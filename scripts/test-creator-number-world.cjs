/* Saved-world data/state checks. Actual pixels and WebGL use the browser suite. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const Store = require('../js/games/number-world-save.js');
const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'games/number-kingdom-3d.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const source = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).find(s => s.includes('function capture('));
new vm.Script(source);
function fn(name, endName) {
  const start = source.indexOf(`function ${name}(`);
  const end = endName ? source.indexOf(endName, start + 1) : source.indexOf('\nfunction ', start + 1);
  assert.ok(start >= 0 && end > start, name);
  return source.slice(start, end);
}
const sandbox = {structuredClone, console};
vm.createContext(sandbox);
vm.runInContext(['const PLAY_MAX = 300;', ...['assertNumber','poses','cellsFor','getBoundsLocal'].map(n => fn(n)),
  'globalThis.geometry = {poses,cellsFor,getBoundsLocal};'].join('\n'), sandbox);
const rules = {maxEntities:110,maxNumber:300,worldWidth:126,poses:n => Array.from(sandbox.geometry.poses(n)),
  propTypes:['brick','wood','grass','roof','window','bed','cloud','tree','flower'],
  bridgeIds:['g3','g5','g8'],zoneIds:['plaza','river','orchard','train','town'],cameraPresets:4};
const friend = (n, pose = rules.poses(n)[0], id = 'toy3d_1') => ({id,n,pose,gx:8,gy:0,gz:0,carrier:null,bridge:null,history:[]});
const snapshot = (list = [friend(15)]) => ({friends:list,props:[],cameraX:11,camPresetIdx:2,camFov:37,
  zone:'plaza',selected:list[0]?.id || null,townGuide:null});
let checks = 0;
function check(name, run) {run(); checks++; console.log('PASS', name);}
function storage() {const data = new Map(); return {getItem:k => data.has(k) ? data.get(k) : null,
  setItem:(k,v) => data.set(k,v), removeItem:k => data.delete(k),data};}
const denied = () => {throw new Error('Storage access denied');};
let poseCount = 0;
for (let n=1;n<=300;n++) for (const pose of rules.poses(n)) {
  const clean = Store.normalizeSnapshot(snapshot([friend(n,pose)]),rules);
  assert.equal(clean.friends[0].n,n);
  assert.equal(clean.friends[0].pose,pose);
  assert.equal(sandbox.geometry.cellsFor(n,pose).length,n);
  poseCount++;
}
check('every offered 1–300 pose keeps its exact block count in saved data',()=>assert.equal(poseCount,640));
check('an empty world is preserved without manufacturing a zero block',()=>{
  const clean=Store.normalizeSnapshot(snapshot([]),rules);assert.equal(clean.friends.length,0);assert.equal(clean.selected,null);
});
check('malformed dimensions, ids, numbers, unknown props/poses and support cycles are rejected',()=>{
  const invalid=[];
  for(const n of [0,-1,301,1.5,'15',null]) invalid.push(snapshot([friend(n,'tall')]));
  for(const [key,value] of [['gx',NaN],['gy',Infinity],['gz',999],['pose','unknown'],['id','<script>'],['carrier','missing']]) {
    const s=snapshot();s.friends[0][key]=value;invalid.push(s);
  }
  invalid.push(snapshot([friend(2,'tall','same'),friend(2,'tall','same')]));
  const cycle=snapshot([friend(2,'tall','a'),friend(2,'tall','b')]);cycle.friends[0].carrier='b';cycle.friends[1].carrier='a';invalid.push(cycle);
  const prop=snapshot();prop.props=[{id:'p',type:'unknown',gx:1,gy:0,gz:0}];invalid.push(prop);
  const tooMany=snapshot(Array.from({length:111},(_,i)=>friend(1,'tall','f'+i)));invalid.push(tooMany);
  for(const s of invalid) assert.equal(Store.normalizeSnapshot(s,rules),null);
  for(const raw of ['{', 'null', JSON.stringify({version:9,snapshot:snapshot()}),' '.repeat(Store.MAX_BYTES+1)]) assert.equal(Store.decode(raw,rules),null);
});
check('merge history keeps valid branches and discards an invalid arithmetic history',()=>{
  const s=snapshot([friend(120)]);s.friends[0].history=[{left:{n:70,pose:rules.poses(70)[0],history:[]},right:{n:50,pose:rules.poses(50)[0],history:[]}}];
  assert.equal(Store.normalizeSnapshot(s,rules).friends[0].history[0].left.n,70);
  s.friends[0].history[0].left.n=71;
  assert.deepEqual(Store.normalizeSnapshot(s,rules).friends[0].history,[]);
});
check('durable storage restores camera, selection, region, shapes and linked props',()=>{
  const local=storage(),session=storage(),s=snapshot([friend(15)]);
  s.zone='town';s.cameraX=111;s.townGuide='house';
  s.props=[{id:'p1',type:'wood',gx:109,gy:0,gz:0,carrier:null},{id:'p2',type:'wood',gx:109,gy:1,gz:0,carrier:'p1'}];
  const engine=Store.create({rules,memory:{},local:()=>local,session:()=>session});
  assert.equal(engine.write(s).mode,'local');
  const reload=Store.create({rules,memory:{},local:()=>local,session:()=>session});
  const loaded=reload.read();assert.equal(loaded.cameraX,111);assert.equal(loaded.camPresetIdx,2);assert.equal(loaded.camFov,37);
  assert.equal(loaded.selected,'toy3d_1');assert.equal(loaded.zone,'town');assert.equal(loaded.townGuide,'house');assert.equal(loaded.props[1].carrier,'p1');
  assert.equal(reload.status().mode,'local');
});
check('denied persistent storage restores the latest work from session then parent memory',()=>{
  const session=storage(),memory={};const engine=Store.create({rules,memory,local:denied,session:()=>session});
  assert.equal(engine.write(snapshot([friend(20)])).mode,'session');
  assert.equal(Store.create({rules,memory:{},local:denied,session:()=>session}).read().friends[0].n,20);
  const noStorage=Store.create({rules,memory,local:denied,session:denied});
  assert.equal(noStorage.write(snapshot([friend(30)])).mode,'memory');
  const reentry=Store.create({rules,memory,local:denied,session:denied});assert.equal(reentry.read().friends[0].n,30);assert.equal(reentry.status().mode,'memory');
});
check('a stale session copy never wins over a newer local save, or vice versa',()=>{
  const local=storage(),session=storage();
  const initial=Store.create({rules,memory:{},local:()=>local,session:()=>session});initial.read();initial.write(snapshot([friend(5)]));
  const localOnly=Store.create({rules,memory:{},local:()=>local,session:()=>session});localOnly.read();
  session.setItem=()=>{throw new Error('QuotaExceeded');};localOnly.write(snapshot([friend(9)]));
  assert.equal(Store.create({rules,memory:{},local:()=>local,session:()=>session}).read().friends[0].n,9);
  const session2=storage();const sessionOnly=Store.create({rules,memory:{},local:()=>local,session:()=>session2});sessionOnly.read();
  local.setItem=()=>{throw new Error('QuotaExceeded');};sessionOnly.write(snapshot([friend(12)]));
  assert.equal(Store.create({rules,memory:{},local:()=>local,session:()=>session2}).read().friends[0].n,12);
});
check('corrupt latest memory falls back to validated bytes without replacing the old save',()=>{
  const local=storage();const engine=Store.create({rules,memory:{},local:()=>local,session:denied});engine.write(snapshot());
  const original=local.getItem(Store.KEY);const memory={[Store.KEY]:'{broken'};
  const restore=Store.create({rules,memory,local:()=>local,session:denied});assert.equal(restore.read().friends[0].n,15);assert.equal(local.getItem(Store.KEY),original);
  const failed=Store.create({rules,memory:{[Store.KEY]:'{broken'},local:denied,session:denied});assert.equal(failed.read(),null);assert.equal(failed.status().invalid,true);
});
check('write refusal never destroys the last valid stored artwork',()=>{
  const local=storage();const engine=Store.create({rules,memory:{},local:()=>local,session:denied});engine.write(snapshot());const raw=local.getItem(Store.KEY);
  assert.equal(engine.write(snapshot([friend(0,'tall')])).ok,false);assert.equal(local.getItem(Store.KEY),raw);
});

// Exercise the real capture/restore functions with real shape generation and
// entity constructors. Rendering and settling are omitted here, not declared PASS.
check('actual game capture/restore remaps support and selected ids while preserving the camera',()=>{
  const dom={zones:{children:[]},townGuides:{style:{}}};let updates=0;
  const world={headless:false,friends:[],props:[],selected:null,goalX:111,cameraX:111,camPresetIdx:2,townGuide:'tower',zone:'town',undo:[]};
  const ctx={structuredClone,console,state:world,Math,Set,Map,
    camera:{fov:37,updateProjectionMatrix(){}},trainGroup3D:null,
    $:id=>dom[id],removeEntityMesh(){},buildEntityMesh3D(){},createAnimState:()=>({}),recalcSupport3D(){},
    updateUI(){updates++;},updateTownBlueprint:value=>{world.townGuide=value;}};
  vm.createContext(ctx);
  const constants="const PLAY_MAX=300,WORLD_W=126,MIN_GZ=-5,MAX_GZ=3,TRAIN_BASE_GX=84,TRAIN_SLOTS=10,DEFAULT_CAM_FOV=42; let camFov=37;let uid=0,testUid=0;"+
    "const CAM_PRESETS=[{},{},{},{}];const zones=[{id:'plaza',a:0,b:34},{id:'river',a:34,b:58},{id:'orchard',a:58,b:80},{id:'train',a:80,b:102},{id:'town',a:102,b:126}];"+
    "const specs={wood:{w:2,h:1,d:1}};";
  vm.runInContext([constants,...['nextId','clamp','assertNumber','poses','cellsFor','propCellsFor','getBoundsLocal','friend','prop','all','zoneAt','capture','clearAllEntities'].map(n=>fn(n)),
    fn('restore','// Autosave is independent'),
    'globalThis.real={friend,prop,capture,restore,getFov:()=>camFov};'].join('\n'),ctx);
  const a=ctx.real.friend(120,109,0,0,{pose:'ten'}),b=ctx.real.friend(300,115,0,-4);
  const p=ctx.real.prop('wood',108,0,0),q=ctx.real.prop('wood',108,1,0);q.carrier=p.id;
  world.friends.push(a,b);world.props.push(p,q);world.selected=a.id;
  const raw=ctx.real.capture();world.camPresetIdx=0;world.townGuide=null;ctx.real.restore(raw);
  assert.equal(world.friends.length,2);assert.equal(world.friends[0].n,120);assert.equal(world.friends[1].cells.length,300);
  assert.equal(world.selected,world.friends[0].id);assert.notEqual(world.selected,a.id);
  assert.equal(world.props[1].carrier,world.props[0].id);assert.equal(world.cameraX,111);assert.equal(world.camPresetIdx,2);assert.equal(ctx.real.getFov(),37);
  assert.equal(world.zone,'town');assert.equal(world.townGuide,'tower');assert.equal(updates,1);
  world.goalX=120;
  ctx.real.restore(ctx.real.capture());
  assert.equal(world.goalX,120,'rightmost camera position is not shifted during restore');
});

check('actual save lifecycle preserves an untouched unreadable save and flushes a new edit',()=>{
  const saved=[];const initial=JSON.stringify(snapshot());
  const ctx={state:{destroyed:false,drag:null,pan:null,pointer:null,train:{departing:false}},
    worldSaveReady:true,lastSavedWorld:initial,worldSaveResult:{mode:'invalid'},warnedWorldSaveMode:'',
    current:initial,capture:()=>ctx.current,worldStore:{write(data){saved.push(data);return {ok:true,mode:'local'};}},
    updateWorldSaveStatus(){},numberWorldIsEnglish:()=>false,toast(){},endDrag(){throw new Error('no active drag');}};
  vm.createContext(ctx);vm.runInContext(fn('saveWorldNow')+'\nglobalThis.save=saveWorldNow;',ctx);
  assert.equal(ctx.save(true),false);assert.equal(saved.length,0,'leaving without an edit preserves unreadable bytes');
  ctx.current=JSON.stringify(snapshot([friend(25)]));assert.equal(ctx.save(),true);assert.equal(saved[0].friends[0].n,25);
  assert.equal(ctx.save(),true);assert.equal(saved.length,1,'unchanged animation ticks do not rewrite storage');
  ctx.state.destroyed=true;assert.equal(ctx.save(true),false);assert.equal(saved.length,1,'disposed worlds never overwrite storage');
  ctx.state.destroyed=false;ctx.worldSaveResult={mode:'invalid'};ctx.lastSavedWorld=ctx.current;
  assert.equal(ctx.save(true,true),true);assert.equal(saved.length,2,'explicit Save permits replacing an unreadable save');
});

console.log(JSON.stringify({status:'PASS',checks,poseCount,evidence:'Data validation, actual capture/restore with rendering stubs, persistence adapters. No pixel/audio claim.',
  sourceSha256:Object.fromEntries(['games/number-kingdom-3d.html','js/games/number-world-save.js'].map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]))},null,2));
