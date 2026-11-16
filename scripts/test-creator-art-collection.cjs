'use strict';
// Production collection functions under controlled storage and PNG callbacks.
// Native UI, real decoding, and visual geometry are covered by the browser suite.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const file = path.resolve(__dirname, '../js/games/art-zone.js');
const source = fs.readFileSync(file, 'utf8');
const marker = 'window.SihyeonGames[GAME_KEY] = { render, destroy };';
assert(source.includes(marker), 'production export marker must remain reviewable');
const instrumented = source.replace(marker, `globalThis.qa = {
  state, COLORING_TEMPLATES, templatePreview, workSvg, snapshotTemplate,
  readCollectionItem, loadCollection, persistCollection, captureCurrentArtwork,
  saveCurrentToCollection, loadCollectedArtwork, undoCollectionRestore,
  collectionPicture, saveWork, restoreFreeImage,
  message: () => collectionMessage, readBlocked: () => collectionReadBlocked
};`);
const KEY = 'sihyeon-art-collection-v1';
const WORK = 'sihyeon-art-work-v1';
const PNG_A = 'data:image/png;base64,UElDVFVSRV9B';
const PNG_B = 'data:image/png;base64,UElDVFVSRV9C';
const plain = object => JSON.parse(JSON.stringify(object));
const checks = [];
function check(name, run) {
  try { checks.push({name, status:'PASS', detail:run() || true}); }
  catch (error) { checks.push({name, status:'FAIL', error:error.stack}); }
}
function fixture(initial) {
  const store = new Map(initial === undefined ? [] : [[KEY, typeof initial === 'string' ? initial : JSON.stringify(initial)]]);
  const writes = [], pending = [], draws = [];
  let denyRead = false, denyWrite = false, pixels = PNG_A;
  const canvas = {width:400,height:300,style:{},toDataURL:() => pixels};
  const wrap = {getBoundingClientRect:() => ({width:400,height:300})};
  const container = {querySelector:() => null,querySelectorAll:() => []};
  const context = {
    window:{SihyeonGames:{}}, navigator:{},
    document:{getElementById:id => id === 'azCanvasWrap' ? wrap : id === 'azCanvas' ? canvas : null},
    localStorage:{
      getItem(key){if(key === KEY && denyRead)throw Error('denied read');return store.get(key) ?? null;},
      setItem(key,value){if(key === KEY && denyWrite)throw Error('quota');writes.push(key);store.set(key,String(value));}
    },
    Image:class{constructor(){pending.push(this);}},
    requestAnimationFrame(){}, setTimeout(){return 1;}, clearTimeout(){}
  };
  vm.runInNewContext(instrumented, context, {timeout:1000});
  Object.assign(context.qa.state, {container,canvas,destroyed:false,tab:'coloring',
    ctx:{clearRect(){pixels='';},drawImage(image){pixels=image.src;draws.push(image.src);}}
  });
  return {...context.qa,context,store,writes,pending,draws,
    denyRead(value=true){denyRead=value;},denyWrite(value=true){denyWrite=value;},
    stored:() => store.has(KEY) ? JSON.parse(store.get(KEY)) : null,
    pixels:() => pixels};
}
function paint(f, color, templateId='police') {
  const template=f.COLORING_TEMPLATES.find(item=>item.id===templateId);
  const count=[...template.svg.matchAll(/class="fillable"/g)].length;
  f.state.tab='coloring';f.state.activeTemplateId=templateId;
  f.state.templateWork[templateId]={svgVersion:template.version || 1,fills:Array(count).fill(color),completed:false,history:[]};
}
const decode = src => decodeURIComponent(src.slice(src.indexOf(',')+1));

check('all 28 chooser pictures contain the exact selectable SVG instead of emoji placeholders', () => {
  const f=fixture();
  assert.equal(f.COLORING_TEMPLATES.length,28);
  for(const template of f.COLORING_TEMPLATES) {
    const before=JSON.stringify(f.state.templateWork);
    assert.equal(decode(f.templatePreview(template)),template.svg);
    assert.equal(JSON.stringify(f.state.templateWork),before,'preview must not create or change a working picture');
  }
  return {templates:28};
});

check('two colors of one template are independent snapshots that survive a fresh module', () => {
  const f=fixture();paint(f,'#9944FF');f.saveCurrentToCollection();
  const first=plain(f.loadCollection()[0]);
  paint(f,'#44CC44');f.saveCurrentToCollection();
  f.state.templateWork.police.fills[0]='#FF4444';f.saveWork();
  const data=f.stored();assert.equal(data.items.length,2);
  assert(data.items[0].work.fills.every(color=>color==='#9944FF'));
  assert(data.items[1].work.fills.every(color=>color==='#44CC44'));
  assert.notEqual(data.items[0].id,data.items[1].id);
  assert.deepEqual(data.items[0],first);
  const reloaded=fixture(data);assert.deepEqual(plain(reloaded.loadCollection()),data.items);
});

check('legacy preview, saved picture, and reopened working picture preserve all fifteen original regions', () => {
  const f=fixture();const colors=Array.from({length:15},(_,i)=>i%2?'#FFF':'#9944FF');
  f.state.templateWork.police={svgVersion:1,fills:colors.slice(),completed:true,history:[]};
  const template=f.COLORING_TEMPLATES.find(item=>item.id==='police');
  const preview=decode(f.templatePreview(template));
  assert.equal([...preview.matchAll(/class="fillable"/g)].length,15);
  f.saveCurrentToCollection();const saved=f.loadCollection()[0];
  assert.equal(saved.work.svgVersion,1);assert.deepEqual(plain(saved.work.fills),colors);
  paint(f,'#44CC44');f.loadCollectedArtwork(saved.id);
  assert.equal(f.state.templateWork.police.svgVersion,1);
  assert.deepEqual(plain(f.state.templateWork.police.fills),colors);
  assert.equal(f.state.templateWork.police.completed,true);
  assert.equal([...decode(f.collectionPicture(saved)).matchAll(/class="fillable"/g)].length,15);
});

check('two free pictures retain their backgrounds and late PNG callbacks cannot replace the newest choice', () => {
  const f=fixture();f.state.tab='free';f.state.freeImage=PNG_A;f.state.activeTheme='ocean';
  f.saveCurrentToCollection();f.state.freeImage=PNG_B;f.state.activeTheme='forest';f.saveCurrentToCollection();
  const [a,b]=f.loadCollection();assert.equal(a.image,PNG_A);assert.equal(a.theme,'ocean');
  assert.equal(b.image,PNG_B);assert.equal(b.theme,'forest');
  f.loadCollectedArtwork(a.id);f.loadCollectedArtwork(b.id);f.saveWork();
  assert.equal(JSON.parse(f.store.get(WORK)).freeImage,PNG_B,'save while decoding must use the selected canonical PNG');
  f.pending[1].onload();f.pending[0].onload();
  assert.deepEqual(f.draws,[PNG_B]);assert.equal(f.pixels(),PNG_B);
  assert.equal(f.state.activeTheme,'forest');
  assert.deepEqual(f.stored().items.map(item=>item.image),[PNG_A,PNG_B]);
});

check('opening a stored picture is undoable without losing other templates or the free drawing', () => {
  const f=fixture();paint(f,'#9944FF');f.saveCurrentToCollection();
  paint(f,'#44CC44');paint(f,'#4488FF','bus');f.state.freeImage=PNG_B;f.state.activeTheme='sky';
  const before=plain(f.state.templateWork);f.state.activeTemplateId='bus';
  f.loadCollectedArtwork(f.loadCollection()[0].id);
  assert.equal(f.state.activeTemplateId,'police');
  assert(f.state.templateWork.police.fills.every(color=>color==='#9944FF'));
  assert.equal(f.undoCollectionRestore(),true);
  assert.deepEqual(plain(f.state.templateWork),before);
  assert.equal(f.state.activeTemplateId,'bus');assert.equal(f.state.activeTheme,'sky');assert.equal(f.state.freeImage,PNG_B);
  assert.equal(f.undoCollectionRestore(),false,'undo restoration is consumed once');
});

check('restore undo cannot roll back later edits to other templates or to the free canvas', () => {
  const f=fixture();paint(f,'#9944FF');f.saveCurrentToCollection();
  paint(f,'#FF4444','fire_pump');paint(f,'#44CC44');f.state.freeImage=PNG_A;
  f.loadCollectedArtwork(f.loadCollection()[0].id);
  paint(f,'#4488FF','fire_pump');f.state.freeImage=PNG_B;f.state.activeTheme='forest';
  f.state.activeTemplateId='police';f.state.tab='coloring';
  assert.equal(f.undoCollectionRestore(),true);
  assert(f.state.templateWork.police.fills.every(color=>color==='#44CC44'));
  assert(f.state.templateWork.fire_pump.fills.every(color=>color==='#4488FF'),'a later fire-engine edit belongs to another page');
  assert.equal(f.state.freeImage,PNG_B);assert.equal(f.state.activeTheme,'forest');
});

check('undoing a free-picture restore preserves a later coloring edit', () => {
  const f=fixture();f.state.tab='free';f.state.freeImage=PNG_A;f.state.activeTheme='ocean';f.saveCurrentToCollection();
  f.state.freeImage=PNG_B;f.state.activeTheme='forest';
  f.loadCollectedArtwork(f.loadCollection()[0].id);
  paint(f,'#4488FF','bus');f.state.tab='free';
  assert.equal(f.undoCollectionRestore(),true);
  assert.equal(f.state.freeImage,PNG_B);assert.equal(f.state.activeTheme,'forest');
  assert(f.state.templateWork.bus.fills.every(color=>color==='#4488FF'));
});

check('a quota failure preserves old disk bytes and keeps the added picture usable in this session', () => {
  const f=fixture();paint(f,'#9944FF');f.saveCurrentToCollection();
  const old=f.store.get(KEY);f.denyWrite();paint(f,'#44CC44');f.saveCurrentToCollection();
  assert.equal(f.store.get(KEY),old);assert.equal(f.loadCollection().length,2);
  assert.match(f.message(),/이번 놀이/);
  const newest=f.loadCollection()[1];paint(f,'#FF4444');f.loadCollectedArtwork(newest.id);
  assert(f.state.templateWork.police.fills.every(color=>color==='#44CC44'));
  assert.equal(f.store.get(KEY),old);
});

check('denied reads cannot silently overwrite an existing collection even when writes are allowed', () => {
  const original=fixture();paint(original,'#4488FF');original.saveCurrentToCollection();
  const raw=original.store.get(KEY),f=fixture(raw);f.denyRead();paint(f,'#9944FF');f.saveCurrentToCollection();
  assert(f.readBlocked());assert.equal(f.store.get(KEY),raw);
  assert(!f.writes.includes(KEY));assert.equal(f.loadCollection().length,1);assert.match(f.message(),/이번 놀이/);
});

check('corrupt, duplicate, and future-format collections stay untouched for recovery', () => {
  for(const raw of ['{broken',JSON.stringify({version:2,items:[]}),JSON.stringify({version:1,items:[{id:'aw-bad',kind:'free',image:'https://example.test/image.png'}]})]) {
    const f=fixture(raw);paint(f,'#9944FF');f.saveCurrentToCollection();
    assert.equal(f.store.get(KEY),raw);assert(f.readBlocked());assert.equal(f.loadCollection().length,1);
  }
});

check('the thirteenth picture is refused without evicting any of the twelve saved pictures', () => {
  const f=fixture();
  for(let n=1;n<=12;n++){paint(f,'#'+(0x220000+n*4096).toString(16));f.saveCurrentToCollection();}
  const before=f.store.get(KEY);assert.equal(f.loadCollection().length,12);
  paint(f,'#9944FF');f.saveCurrentToCollection();assert.equal(f.loadCollection().length,12);assert.equal(f.store.get(KEY),before);
  assert.match(f.message(),/12장/);
  paint(f,'#'+(0x220000+12*4096).toString(16));f.saveCurrentToCollection();
  assert.equal(f.loadCollection().length,12);assert.equal(f.store.get(KEY),before);assert.match(f.message(),/이미 보관/);
});

check('stored SVG injection and external images cannot enter a collection preview', () => {
  const f=fixture();const template=f.COLORING_TEMPLATES.find(item=>item.id==='police');
  const item=f.readCollectionItem({id:'aw-safe',kind:'coloring',templateId:'police',createdAt:1,
    work:{svgVersion:2,fills:['" onload="bad()','url(https://example.test/bad)','#9944FF'],svg:'<svg onload="bad()"/>'}});
  assert(item);assert.equal(item.work.fills[0],'#FFF');assert.equal(item.work.fills[1],'#FFF');
  const preview=decode(f.collectionPicture(item));assert(!preview.includes('onload='));assert(!preview.includes('https://example.test'));
  assert(preview.includes('fill="#9944FF"'));
  assert.equal(f.readCollectionItem({id:'aw-bad',kind:'free',image:'data:image/svg+xml,<svg onload="bad()"/>'}),null);
  assert.equal(f.readCollectionItem({id:'aw-bad',kind:'free',image:'data:image/png;base64,'+'A'.repeat(4000000)}),null);
  assert.equal(decode(f.templatePreview(template)),template.svg);
});

const report={suite:'Creator stage3 art collection',status:checks.every(row=>row.status==='PASS')?'PASS':'FAIL',
  sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),checks,
  limitations:['Production closure with controlled storage and Image callbacks; no real browser pixels, physical touch, audible listening, or child observation.']};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(report.status!=='PASS')process.exitCode=1;
