/* Regression for readable stale localStorage when writes fail with quota errors.
   Runs production closures in Node; no browser storage quota or PNG decoding is claimed. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const model=require('../js/games/number-post-office-model.js');
const files={postOffice:'js/games/number-post-office.js',art:'js/games/art-zone.js'};
const sources=Object.fromEntries(Object.entries(files).map(([key,file])=>[key,fs.readFileSync(path.join(__dirname,'..',file),'utf8')]));
const checks=[];
function quota(){const error=new Error('Controlled write-only storage failure');error.name='QuotaExceededError';return error;}
function test(name,run){
  try{checks.push({name,status:'PASS',detail:run()});}
  catch(error){checks.push({name,status:'FAIL',message:error.message,stack:error.stack});}
}

test('post office restores the latest three items after an age/range round trip when only writes fail',()=>{
  const key='sihyeon-post-office-v1:4:11-15';
  const seed=771;
  const persisted={version:1,age:4,challenge:'11-15',seed,active:0,orders:[0,1,2].map(round=>model.createState(model.generateMission({age:4,challenge:'11-15',seed,round})))};
  const ids=persisted.orders[0].mission.items.slice(0,3).map(item=>item.id);
  persisted.orders[0]=model.reduce(persisted.orders[0],{type:'MOVE',id:ids[0],truck:0});
  const durableValue=JSON.stringify(persisted);
  const store=new Map([[key,durableValue]]);
  let reads=0,writes=0;
  const context={
    window:{SihyeonGames:{},SihyeonPostOfficeModel:model},
    localStorage:{getItem:k=>{reads++;return store.get(k)||null;},setItem(){writes++;throw quota();}},
    crypto:{getRandomValues(array){array[0]=90210;return array;}},
    performance:{now:()=>1000}
  };
  const marker='  window.SihyeonGames[KEY] = {';
  assert(sources.postOffice.includes(marker),'UI export marker changed; review test access');
  vm.runInNewContext(sources.postOffice.replace(marker,'  window.qaStorage={storageRead,view,loadSession,dispatch};\n'+marker),context,{timeout:1000});
  const q=context.window.qaStorage;
  q.loadSession(4,'11-15',false);
  assert.equal(model.totals(q.view.session.orders[0]).total,1,'existing persistent order should load first');
  q.dispatch({type:'MOVE',id:ids[1],truck:0});q.dispatch({type:'MOVE',id:ids[2],truck:0});
  assert.equal(model.totals(q.view.session.orders[0]).total,3);
  assert.equal(q.view.saveFailed,true,'quota failure should remain visible');
  assert.equal(store.get(key),durableValue,'the fixture must still contain the old one-item save');
  q.loadSession(5,'16-20',false);q.loadSession(4,'11-15',false);
  assert.equal(model.totals(q.view.session.orders[0]).total,3,'old persistent snapshot must not replace the latest memory progress');
  for(const id of ids)assert.equal(q.view.session.orders[0].positions[id],0);
  const detached=q.storageRead(key);detached.orders[0].positions[ids[0]]=-1;
  assert.equal(q.storageRead(key).orders[0].positions[ids[0]],0,'read callers must receive a detached snapshot');
  assert(reads>0&&writes>0);
  return {persistedItems:1,latestItems:3,restoredItems:3,readSucceeded:true,writesRejected:writes,readCopyDetached:true};
});

test('art restores latest free PNG and per-template coloring when old storage reads succeed but writes fail',()=>{
  const key='sihyeon-art-work-v1';
  const oldPng='data:image/png;base64,T0xE',newPng='data:image/png;base64,TkVX';
  const durableValue=JSON.stringify({freeImage:oldPng,templates:{police:{fills:['#111111'],completed:false}},activeTemplateId:'police',activeTheme:'white',tab:'free'});
  const store=new Map([[key,durableValue]]);let reads=0,writes=0;
  const context={
    window:{SihyeonGames:{},removeEventListener(){}},
    localStorage:{getItem:k=>{reads++;return store.get(k)||null;},setItem(){writes++;throw quota();}},
    navigator:{},setTimeout,clearTimeout
  };
  const marker='window.SihyeonGames[GAME_KEY] = { render, destroy };';
  assert(sources.art.includes(marker),'art export marker changed; review test access');
  vm.runInNewContext(sources.art.replace(marker,'window.qaArt={state,loadWork,saveWork,destroy};\n'+marker),context,{timeout:1000});
  const q=context.window.qaArt;q.loadWork();
  assert.equal(q.state.freeImage,oldPng);assert.equal(q.state.templateWork.police.fills[0],'#111111');
  Object.assign(q.state,{container:{},canvas:{width:200,toDataURL:()=>newPng},freeCanvasReady:true,destroyed:false});
  q.state.templateWork.police.fills=['#FF0000'];q.destroy(false);
  assert.equal(q.state.freeImage,newPng);assert.equal(q.state.templateWork.police.fills[0],'#FF0000');
  assert.equal(store.get(key),durableValue,'the fixture must keep the original durable PNG and paint');
  q.loadWork();
  assert.equal(q.state.freeImage,newPng,'old persisted PNG must not replace the current memory picture');
  assert.equal(q.state.templateWork.police.fills[0],'#FF0000','old persisted template must not replace the current paint');
  assert(reads>0&&writes>0);
  return {readSucceeded:true,writesRejected:writes,latestPngPreserved:true,latestTemplateFill:'#FF0000'};
});

const report={
  suite:'Readable stale storage with rejected writes — production closure regressions',
  sourceSha256:Object.fromEntries(Object.entries(sources).map(([key,source])=>[key,crypto.createHash('sha256').update(source).digest('hex')])),
  status:checks.every(check=>check.status==='PASS')?'PASS':'FAIL',checks,
  limits:['Node VM with controlled localStorage behavior; no actual browser quota, private-mode, or device validation.', 'Memory protects progress within the same loaded page; a real reload cannot recover writes the browser rejected.']
};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(report.status!=='PASS')process.exitCode=1;
