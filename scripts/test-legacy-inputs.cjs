/* Synthetic pointer/state regression checks for the actual parking handlers.
 * No browser or physical touch is involved; real browser evidence is separate. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname,'../js/games/parking-lot.js'),'utf8')
  .replace(/\}\)\(\);\s*$/, 'window.__parkingTest = {state, bindEvents, parkCar, handleResize, destroy};\n})();');

function fixture() {
  const ghosts = new Set();
  const windowHandlers = new Map();
  const pendingTimers = new Map();
  let nextTimer=1, hit=null;
  function element(dataset={}) {
    const classes = new Set();
    const handlers = new Map();
    const attrs = new Map();
    let captured=null;
    const el = {
      dataset,style:{},disabled:false,offsetWidth:100,handlers,
      classList:{add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name),toggle(name,on){on?classes.add(name):classes.delete(name);}},
      addEventListener(name,fn){handlers.set(name,fn);},
      setAttribute(name,value){attrs.set(name,value);},
      removeAttribute(name){attrs.delete(name);},
      getBoundingClientRect:()=>({left:10,top:20,width:100,height:90}),
      setPointerCapture(id){captured=id;},
      hasPointerCapture(id){return captured===id;},
      releasePointerCapture(id){captured=null;this.fire('lostpointercapture',{pointerId:id});},
      cloneNode(){return element({...dataset});},
      remove(){ghosts.delete(this);},
      closest(selector){return selector==='.pl-slot' && dataset.slotId ? this : null;},
      fire(name,event={}){handlers.get(name)?.({currentTarget:this,button:0,isPrimary:true,pointerId:7,clientX:20,clientY:30,detail:1,preventDefault(){},...event});}
    };
    return el;
  }
  const cards=[element({vehicleId:'car-1'}),element({vehicleId:'car-2'}),element({vehicleId:'bus-3'})];
  const slots=[element({slotId:'car-1'}),element({slotId:'car-2'}),element({slotId:'bus-3'})];
  const root={
    querySelectorAll(selector){return selector==='.pl-car-drag'?cards:selector==='.pl-slot'?slots:[];},
    contains(el){return cards.includes(el)||slots.includes(el);}
  };
  const container={innerHTML:'',querySelector:selector=>selector==='.pl-root'?root:null,querySelectorAll:selector=>root.querySelectorAll(selector)};
  const win={
    addEventListener:(name,fn)=>windowHandlers.set(name,fn),removeEventListener:name=>windowHandlers.delete(name),
    setTimeout(fn,ms){const id=nextTimer++;pendingTimers.set(id,{fn,ms});return id;},
    clearTimeout:id=>pendingTimers.delete(id),matchMedia:()=>({matches:false})
  };
  const document={body:{appendChild:node=>ghosts.add(node)},elementFromPoint:()=>hit,getElementById:()=>null};
  vm.runInNewContext(source,{window:win,document,navigator:{},console,Date,Math});
  const api=win.__parkingTest;
  Object.assign(api.state,{container,destroyed:false,layoutMode:'portrait',cars:[{id:'car',instanceId:'car-1'},{id:'car',instanceId:'car-2'},{id:'bus',instanceId:'bus-3'}],slots:[{vehicle:{id:'car',instanceId:'car-1'},filled:false},{vehicle:{id:'car',instanceId:'car-2'},filled:false},{vehicle:{id:'bus',instanceId:'bus-3'},filled:false}]});
  api.bindEvents();
  return {api,cards,slots,ghosts,windowHandlers,pendingTimers,hit:target=>{hit=target;},start(){cards[0].fire('pointerdown');cards[0].fire('pointermove',{clientX:50,clientY:70});}};
}

let f=fixture();
f.cards[0].fire('pointerdown');f.cards[0].fire('pointerup');f.cards[0].fire('click');
assert.equal(f.ghosts.size,0);assert.equal(f.api.state.selectedCarId,'car-1');
f.slots[2].fire('click');assert.equal(f.api.state.filledCount,0);assert.equal(f.cards[0].style.display,undefined);
f.slots[1].fire('click');assert.equal(f.api.state.filledCount,1,'identical cars accept either matching slot');
f.slots[1].fire('click');assert.equal(f.api.state.filledCount,1,'double activation cannot count twice');

for(const exit of ['pointercancel','lostpointercapture','blur','resize','cleanup','destroy']) {
  f=fixture();f.start();assert.equal(f.ghosts.size,1,exit);
  assert.equal(f.api.state.isDragging,true);
  if(exit==='blur') f.windowHandlers.get('blur')();
  else if(exit==='resize') f.api.handleResize();
  else if(exit==='cleanup') f.api.state.inputCleanup();
  else if(exit==='destroy') f.api.destroy();
  else f.cards[0].fire(exit);
  assert.equal(f.ghosts.size,0,`${exit} removes every ghost`);
  assert.equal(f.api.state.isDragging,false,`${exit} ends capture state`);
  assert.equal(f.cards[0].classList.contains('dragging'),false);
  assert.equal(f.cards[0].style.display,undefined,'real card never disappears on cancel');
  f.cards[0].fire('pointerup');assert.equal(f.ghosts.size,0,'late pointerup is harmless');
}

f=fixture();f.start();f.cards[0].fire('pointerup',{clientX:-10,clientY:-10});
assert.equal(f.ghosts.size,0);assert.equal(f.api.state.filledCount,0,'outside drop is reversible');
f.start();f.hit(f.slots[2]);f.cards[0].fire('pointerup');
assert.equal(f.ghosts.size,0);assert.equal(f.api.state.filledCount,0,'wrong drop keeps the car');
f.start();f.hit(f.slots[1]);f.cards[0].fire('pointerup');
assert.equal(f.ghosts.size,0);assert.equal(f.api.state.filledCount,1,'correct drag parks exactly one car');
f.cards[0].fire('click');assert.equal(f.api.state.selectedCarId,null,'post-drag native click is suppressed');

f=fixture();f.cards[0].fire('pointerdown');f.cards[1].fire('pointerdown',{pointerId:8,isPrimary:false});
f.cards[1].fire('pointermove',{pointerId:8,clientX:80,clientY:90});
assert.equal(f.ghosts.size,0,'secondary pointer cannot steal the first gesture');
f.cards[0].fire('pointercancel');
f.cards[2].fire('click',{detail:0});f.slots[2].fire('click',{detail:0});
assert.equal(f.api.state.filledCount,1,'keyboard activation shares the tap path');
console.log('PASS parking input lifecycle: tap, wrong/correct drop, outside drop, duplicate models, double activation, cancel, capture loss, blur, resize, cleanup, destroy and secondary pointer.');

// Handwashing: every wrong permutation keeps already-correct positions, and
// the short assessment timer cannot erase an intervening edit.
const lifeSource=fs.readFileSync(path.resolve(__dirname,'../js/games/life-sequence.js'),'utf8')
  .replace(/\}\)\(\);\s*$/, 'window.__lifeTest={state,MISSIONS,placeCard,removeCard};\n})();');
function lifeFixture(){
  const timers=new Map();let timerId=0;
  const clock={setTimeout(fn,ms){const id=++timerId;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)};
  const window={matchMedia:()=>({matches:false})};
  vm.runInNewContext(lifeSource,{window,navigator:{},...clock});
  const api=window.__lifeTest,mission=api.MISSIONS.find(item=>item.id==='wash_hands');
  Object.assign(api.state,{container:{innerHTML:'',querySelector:()=>null,querySelectorAll:()=>[]},destroyed:false,mission,missions:[mission],pool:mission.steps,placed:[null,null,null,null]});
  return {api,run(ms){const entry=[...timers].find(([,value])=>value.ms===ms);assert.ok(entry,`timer ${ms} should exist`);timers.delete(entry[0]);entry[1].fn();}};
}
function permutations(items){return items.length?items.flatMap((item,i)=>permutations(items.filter((_,j)=>j!==i)).map(rest=>[item,...rest])):[[]];}
for(const order of permutations(['water','soap','rinse','towel'])){
  const life=lifeFixture();
  assert.equal(life.api.state.mission.steps[2].id,'rinse');
  for(const id of order)life.api.placeCard(id);
  assert.equal(life.api.state.locked,true,'complete arrangement locks before deferred check');
  life.api.removeCard(0);
  assert.equal(life.api.state.placed[0].id,order[0],'editing is paused during the pending verdict');
  life.run(280);
  if(order.join(',')==='water,soap,rinse,towel'){
    assert.equal(life.api.state.combo,1);
    assert.equal(life.api.state.locked,true);
  }else{
    life.run(1150);
    assert.equal(life.api.state.locked,false);
    order.forEach((id,i)=>{
      const expected=life.api.state.mission.steps[i].id;
      assert.equal(life.api.state.placed[i]?.id||null,id===expected?id:null,'only misplaced cards return to the pool');
    });
  }
}
console.log('PASS handwashing: all 24 four-step arrangements, required rinse step, delayed-check edit lock, and correct-slot preservation.');
