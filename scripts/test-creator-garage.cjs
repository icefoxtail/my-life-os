/* Executes the shipped garage module and its real handlers with a small DOM,
 * deterministic clock and controlled Storage exceptions. Pixel/touch/audio
 * observations are deliberately left to the separate browser/manual checks. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const file = process.argv[2] || path.join(root, 'js/games/car-garage.js');
const raw = fs.readFileSync(file, 'utf8');
const marker = 'window.SihyeonGames[GAME_KEY] = { render, destroy };';
assert.ok(raw.includes(marker));
const source = raw.replace(marker, marker + '\nwindow.__garage = { state, startVehicle, handleRepairSuccess, addDecoration, startFinale, saveCompletedVehicle, completedCar, cleanCar, vehicleSVG, renderUI, openGarage, returnToWorkshop, startDrive, driveTo, deleteSavedCar, undoDelete, destroy, handleResize };');
const KEY = 'sihyeon_car_garage_v1';
const REQUIRED = {fire:['wheel','wash','siren'],police:['wheel','light','siren'],bus:['wheel','light','wash'],ambulance:['wheel','light','gas'],rocket:['wheel','gas','light']};

function clock() {
  let now=0, id=0; const tasks=new Map();
  return {tasks, setTimeout(fn,ms=0){const key=++id;tasks.set(key,{fn,at:now+ms});return key;},
    clearTimeout(key){tasks.delete(key);}, tick(ms){
      const until=now+ms;
      for(let guard=0;guard<10000;guard++){
        const entry=[...tasks].filter(([,v])=>v.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];
        if(!entry){now=until;return;}
        tasks.delete(entry[0]);now=entry[1].at;entry[1].fn();
      }
      throw Error('Clock did not settle');
    }};
}
function node(tag='div',attrs={}) {
  let html='';
  const el={tag,attrs,dataset:{},children:[],style:{},className:attrs.class||'',id:attrs.id||'',
    disabled:Object.hasOwn(attrs,'disabled'),textContent:'',parentElement:null,
    appendChild(child){child.parentElement=this;this.children.push(child);return child;},
    remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(c=>c!==this);},
    addEventListener(type,fn){this['on'+type]=fn;},click(){this.onclick?.({target:this});},
    setAttribute(key,value){this.attrs[key]=String(value);},getAttribute(key){return this.attrs[key];},
    matches(selector){
      if(selector.includes(','))return selector.split(',').some(s=>this.matches(s.trim()));
      if(selector.startsWith('.'))return this.className.split(/\s+/).includes(selector.slice(1));
      if(selector.startsWith('#'))return this.id===selector.slice(1);
      const a=selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
      return a?Object.hasOwn(this.attrs,a[1])&&(a[2]==null||this.attrs[a[1]]===a[2]):this.tag===selector;
    },
    querySelectorAll(selector){const visit=n=>n.children.flatMap(c=>[...(c.matches(selector)?[c]:[]),...visit(c)]);return visit(this);},
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;},
    get innerHTML(){return html;},set innerHTML(value){html=value;this.children=[];parseInto(this,value);}
  };
  for(const[k,v]of Object.entries(attrs))if(k.startsWith('data-'))el.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;
  return el;
}
function parseInto(parent,html) {
  const stack=[parent];
  for(const m of html.matchAll(/<\/?([a-z][\w-]*)\b([^>]*)>|([^<]+)/gi)){
    if(m[3]){stack.at(-1).textContent+=m[3].trim();continue;}
    if(m[0].startsWith('</')){while(stack.length>1){if(stack.pop().tag===m[1])break;}continue;}
    const attrs=Object.fromEntries([...m[2].matchAll(/([:\w-]+)(?:="([^"]*)")?/g)].map(a=>[a[1],a[2]||'']));
    const child=stack.at(-1).appendChild(node(m[1],attrs));
    if(!/^(img|br|hr|input|link|meta)$/.test(m[1])&&!m[0].endsWith('/>'))stack.push(child);
  }
}
function fixture(saved=null, settings={}) {
  const time=clock(),container=node(),head=node('head'),rewards=[],voices=[];
  const storage=new Map(saved===null?[]:[[KEY,saved]]),fails={get:!!settings.getDenied,set:false};
  const window={innerWidth:390,innerHeight:844,setTimeout:time.setTimeout,clearTimeout:time.clearTimeout,
    addEventListener(){},removeEventListener(){},
    SihyeonVoice:{play(id){voices.push(id);return Promise.resolve(false);},stop(){}}};
  const document={head,documentElement:{clientWidth:390,clientHeight:844},createElement:node,getElementById:id=>head.querySelector('#'+id)};
  const localStorage={getItem(key){if(fails.get)throw Error('Storage denied');return storage.get(key)||null;},
    setItem(key,value){if(fails.set)throw Error('QuotaExceededError');storage.set(key,value);}};
  const math=Object.create(Math);math.random=()=>0.01;
  vm.runInNewContext(source,{window,document,localStorage,navigator:{},Math:math,console},{filename:file});
  const api=window.__garage;
  const options={gainExp:n=>rewards.push(n),fireConfetti(){}};
  const reopen=()=>window.SihyeonGames.carGarage.render(container,options);
  reopen();
  return {api,window,container,time,rewards,voices,storage,fails,reopen,get:s=>container.querySelector(s),
    solve(vehicle='fire',decos=[]){api.startVehicle(vehicle);for(const t of REQUIRED[vehicle]){api.handleRepairSuccess(t);time.tick(650);}for(const d of decos)api.addDecoration(d);}};
}
function json(value){return JSON.parse(JSON.stringify(value));}
const cases=[];
function test(name,fn){fn();cases.push({name,status:'PASS'});}
function permutations(values){if(!values.length)return[[]];return values.flatMap((v,i)=>permutations(values.filter((_,j)=>i!==j)).map(t=>[v,...t]));}

test('five vehicles / all 30 valid repair orders preserve only the repaired parts',()=>{
  for(const[vehicle,tasks]of Object.entries(REQUIRED))for(const order of permutations(tasks)){
    const f=fixture();f.api.startVehicle(vehicle);
    const before=f.container.innerHTML;
    for(const t of tasks)assert.ok(before.includes('data-part="'+t+'" data-ready="false"'),vehicle+': '+t+' initially broken');
    for(const task of order){
      assert.equal(f.api.handleRepairSuccess(task),true);
      assert.equal(f.api.handleRepairSuccess(task),false,'rapid repeat ignored');
      const current=f.container.innerHTML;
      for(const t of tasks)assert.ok(current.includes('data-part="'+t+'" data-ready="'+f.api.state.completedTasks.includes(t)+'"'),vehicle+': '+t);
      assert.equal(f.api.state.collection.length,0,'repair alone never stores an incomplete car');
      f.time.tick(650);assert.equal(f.api.handleRepairSuccess(task),false,'completed tool stays idempotent');
    }
    assert.equal(f.api.state.phase,'tuning');assert.equal(f.api.state.completedTasks.length,3);
    assert.deepEqual(f.rewards,[]);
  }
});
test('unneeded tools and detached controls do not alter the next workshop',()=>{
  const f=fixture();assert.equal(f.api.handleRepairSuccess('gas'),false);
  const detached=f.get('[data-task="wheel"]');f.api.startVehicle('bus');detached.click();
  assert.equal(f.api.state.completedTasks.length,0);
  f.get('[data-task="wheel"]').click();f.time.tick(650);
  f.get('[data-before="1"]').click();assert.equal(f.api.state.viewBefore,true);
  assert.ok(f.container.innerHTML.includes('data-part="wheel" data-ready="false"'));
  f.get('[data-before="0"]').click();assert.ok(f.container.innerHTML.includes('data-part="wheel" data-ready="true"'));
});
test('same model can be stored twice with independent decorations and one reward per completion',()=>{
  const f=fixture();f.solve('fire',['🎀','👑']);assert.equal(f.api.startFinale(),true);
  const first=json(f.api.state.collection[0]);const rawFirst=f.storage.get(KEY);
  assert.deepEqual(f.rewards,[40]);assert.equal(f.api.startFinale(),false);
  f.api.saveCompletedVehicle();assert.equal(f.api.state.collection.length,1);
  f.solve('fire',['🍀']);f.api.startFinale();
  assert.equal(f.api.state.collection.length,2);assert.notEqual(f.api.state.collection[0].id,first.id);
  assert.deepEqual(json(f.api.state.collection[1]),first);
  assert.deepEqual(f.rewards,[40,40]);assert.notEqual(f.storage.get(KEY),rawFirst);
  f.api.state.decorations[0].emoji='🔥';assert.equal(f.api.state.collection[0].decorations[0].emoji,'🍀');
  const reopened=fixture(f.storage.get(KEY));assert.equal(reopened.api.state.collection.length,2);
  assert.deepEqual(json(reopened.api.state.collection[1]),first);
});
test('six sticker positions, remove and render preserve exact coordinates',()=>{
  const f=fixture();f.solve('police');
  for(const d of ['🎀','👑','🔥','🍀','💎','🕶️'])assert.equal(f.api.addDecoration(d),true);
  assert.equal(f.api.addDecoration('🎀'),false);const before=json(f.api.state.decorations);
  f.api.renderUI();assert.deepEqual(json(f.api.state.decorations),before);
  assert.equal((f.container.innerHTML.match(/data-decal=/g)||[]).length,6);
  f.get('[data-undo-deco]').click();assert.equal(f.api.state.decorations.length,5);
  f.api.addDecoration('🎀');assert.equal(f.api.state.decorations[5].x,before[5].x);
  f.api.startFinale();assert.deepEqual(json(f.api.state.collection[0].decorations),json(f.api.state.decorations));
});
test('saved car drives to all three stops in free order without replay rewards and restores unfinished work',()=>{
  const f=fixture();f.solve('police',['💎','🍀']);f.api.startFinale();
  const saved=json(f.api.state.collection[0]);f.api.startVehicle('bus');
  f.api.handleRepairSuccess('wash');f.time.tick(650);f.api.openGarage();
  assert.equal(f.api.startDrive(saved),true);
  assert.deepEqual(json(f.api.state.decorations),saved.decorations);
  for(const stop of [2,0,1]){
    assert.equal(f.api.driveTo(stop),true);assert.equal(f.api.driveTo(stop),false);
    f.time.tick(900);assert.equal(f.api.driveTo(stop),false);
  }
  assert.equal(f.api.state.driveVisited.length,3);assert.deepEqual(f.rewards,[40]);
  f.api.openGarage();f.api.returnToWorkshop();
  assert.equal(f.api.state.currentVehicle.id,'bus');assert.equal(f.api.state.phase,'repair');
  assert.deepEqual(json(f.api.state.completedTasks),['wash']);assert.deepEqual(f.rewards,[40]);
  assert.deepEqual(json(f.api.state.collection[0]),saved);
});
test('deletion requires its visible confirmation, is reversible and does not recreate on return',()=>{
  const f=fixture();f.solve();f.api.startFinale();const car=json(f.api.state.collection[0]);
  f.api.openGarage();assert.equal(f.api.deleteSavedCar(car.id),false);
  f.get('[data-delete-id]').click();f.get('[data-delete-cancel]').click();
  assert.equal(f.api.state.collection.length,1);
  f.get('[data-delete-id]').click();f.get('[data-delete-confirm]').click();assert.equal(f.api.state.collection.length,0);
  f.api.returnToWorkshop();assert.equal(f.api.state.collection.length,0,'returning must not resurrect a deliberately deleted car');
  assert.ok(!f.container.innerHTML.includes('내 차고에 보관했어요.'));
  f.api.openGarage();f.get('[data-undo-delete]').click();assert.deepEqual(json(f.api.state.collection),[car]);
});
test('storage failure retains prior durable bytes and all new cars for the current tab',()=>{
  const f=fixture();f.solve('bus',['🎀']);f.api.startFinale();const durable=f.storage.get(KEY);
  f.fails.set=true;f.solve('ambulance',['💎']);f.api.startFinale();
  assert.equal(f.storage.get(KEY),durable);assert.equal(f.api.state.collection.length,2);
  assert.equal(f.api.state.memoryOnly,true);assert.ok(f.container.innerHTML.includes('이번 놀이 동안'));
  f.api.destroy();f.reopen();assert.equal(f.api.state.collection.length,2);
  const fresh=fixture(durable);assert.equal(fresh.api.state.collection.length,1);
});
test('unreadable, future and damaged saves block writes and keep the original raw bytes',()=>{
  const existing=JSON.stringify({version:1,cars:[{id:'prior',vehicleId:'bus',decorations:[]}]});
  for(const[saved,settings]of [[existing,{getDenied:true}],[JSON.stringify({version:2,cars:[{id:'prior',vehicleId:'bus'}]}),{}],['{damaged',{}]]){
    const f=fixture(saved,settings);assert.equal(f.api.state.storageBlocked,true);
    f.solve('police',['🎀']);f.api.startFinale();assert.equal(f.storage.get(KEY),saved);
    assert.equal(f.api.state.memoryOnly,true);assert.equal(f.api.state.collection.length,1);
    f.fails.get=false;f.api.destroy();f.reopen();
    assert.equal(f.api.state.storageBlocked,true,'the tab must not retry a destructive write after remount');
    f.solve('fire');f.api.startFinale();assert.equal(f.storage.get(KEY),saved);
    assert.equal(f.api.state.collection.length,2);
  }
});
test('invalid saved values are not treated as vehicles or markup',()=>{
  const malicious={version:1,cars:[{id:'ok',vehicleId:'__proto__'},{id:'bad<script>',vehicleId:'fire'},
    {id:'safe',vehicleId:'fire',decorations:[{emoji:'<script>',x:2,y:2},{emoji:'🎀',x:999,y:-40}]}]};
  const f=fixture(JSON.stringify(malicious));assert.equal(f.api.state.collection.length,1);
  assert.deepEqual(json(f.api.state.collection[0].decorations),[{emoji:'🎀',x:300,y:170}]);
  const bad=fixture('{broken');assert.equal(bad.api.state.collection.length,0);
  assert.equal(bad.api.state.memoryOnly,true);assert.equal(f.api.cleanCar({id:'other',vehicleId:'constructor'}),null);
});
test('a full garage keeps every prior car and saves the waiting finish only after a deliberate removal',()=>{
  const f=fixture();
  for(let i=0;i<24;i++){f.solve('fire');f.api.startFinale();}
  const ids=f.api.state.collection.map(c=>c.id);
  f.solve('rocket',['👑']);f.api.startFinale();
  assert.equal(f.api.state.collection.length,24);assert.equal(f.api.state.savedCurrentId,null);
  assert.ok(f.container.innerHTML.includes('차고가 가득'));
  assert.deepEqual(json(f.api.state.collection.map(c=>c.id)),json(ids));
  f.api.openGarage();f.api.state.confirmDeleteId=ids[0];f.api.deleteSavedCar(ids[0]);f.api.returnToWorkshop();
  assert.equal(f.api.state.collection.length,24);assert.equal(f.api.state.collection[0].vehicleId,'rocket');
  assert.ok(f.api.state.collection.filter(c=>c.vehicleId==='fire').length===23);
  assert.equal(f.rewards.length,25);
});
test('rotation and stale timeouts cannot change a later mount or duplicate drive completion',()=>{
  const f=fixture();f.api.handleRepairSuccess('wheel');
  const old=[...f.time.tasks.values()].map(t=>t.fn);f.api.destroy();f.reopen();old.forEach(fn=>fn());f.time.tick(5000);
  assert.equal(f.api.state.completedTasks.length,0);assert.deepEqual(f.rewards,[]);
  f.solve('rocket',['🔥']);f.api.startFinale();f.api.startDrive(f.api.completedCar());
  f.api.driveTo(1);f.window.innerWidth=640;f.window.innerHeight=360;f.api.handleResize();f.time.tick(120);
  assert.equal(f.api.state.layoutMode,'landscape');f.time.tick(780);
  assert.deepEqual(json(f.api.state.driveVisited),[1]);assert.deepEqual(f.rewards,[40]);
  const late=[...f.time.tasks.values()].map(t=>t.fn);f.api.destroy();f.reopen();late.forEach(fn=>fn());
  assert.equal(f.api.state.phase,'repair');
});
console.log(JSON.stringify({status:'PASS',checks:cases.length,repairPermutations:30,cases,
  sourceSha256:crypto.createHash('sha256').update(raw).digest('hex'),
  notRun:['real browser pixels','physical device touch','audible speech','child observation']},null,2));
