'use strict';
const assert = require('node:assert/strict');
const { fixture } = require('./qa-picture-arithmetic.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const results = [];
function check(name, fn) { fn(); results.push(name); }
check('count-on keeps the first quantity and counts only the second addend', () => {
  for (const [a,b] of [[0,0],[0,6],[9,6],[15,1],[29,1],[20,10],[30,0]]) {
    const f=fixture({saved:{a,b,strategy:'on'}});
    const steps=f.runs.at(-1).steps;
    assert.equal(steps[0].kind,'base');assert.equal(steps[0].number,a);
    assert.deepEqual(copy(steps.filter(s=>s.kind==='count').map(s=>s.number)),Array.from({length:b},(_,i)=>a+i+1));
    const original=f.container.querySelectorAll('.pa-item');
    f.finish(()=>assert(f.container.querySelectorAll('.pa-item').every(node=>original.includes(node))));
    const end=f.api.getSnapshot();assert.equal(end.total,a+b);assert.equal(end.counted,a+b);assert.equal(end.actualCount,a+b);
    f.api.destroy();
  }
});
check('whole-count addition moves the original two groups into one result',()=>{
  const f=fixture({saved:{a:3,b:2}}), nodes=f.container.querySelectorAll('.pa-item');
  assert.equal(f.container.querySelector('.pa-add-items').children.length,1);
  f.finish(()=>assert(f.container.querySelectorAll('.pa-item').every(node=>nodes.includes(node))));
  assert.equal(f.container.querySelector('.pa-add-items').children.length,5);
  assert.equal(f.container.querySelector('.pa-source-trays').hidden,true);f.api.destroy();
});
check('pause, mute and a cancelled picker keep the same run and count',()=>{
  const f=fixture();f.step();f.step();const run=f.runs.at(-1),before=copy(f.api.getSnapshot());
  f.click('pause');assert.equal(f.api.getSnapshot().paused,true);
  f.click('mute');assert.equal(f.runs.at(-1),run);assert.equal(f.api.getSnapshot().counted,before.counted);
  f.click('choosePicture','a');f.click('closeDialog');assert.equal(f.api.getSnapshot().paused,true,'User pause was lost by closing a picker');
  f.click('pause');assert.equal(f.api.getSnapshot().paused,false);assert.equal(f.runs.at(-1),run);
  f.finish();assert.equal(f.api.getSnapshot().counted,15);f.api.destroy();
});
check('overlapping picker/settings and hidden-page pauses resume only after the final blocker closes',()=>{
  for(const type of ['picture','settings']) for(const closeWhileHidden of [false,true]){
    const f=fixture();f.step();f.step();const run=f.runs.at(-1),before=copy(f.api.getSnapshot());
    if(type==='picture')f.click('choosePicture','a');else f.click('settings');
    assert.equal(f.api.getSnapshot().paused,true);
    f.hide(true);f.hide(true); // Repeated hidden notifications must be idempotent.
    const close=()=>type==='picture'?f.click('closeDialog'):f.closeSettings();
    if(closeWhileHidden){close();assert.equal(f.api.getSnapshot().paused,true);f.hide(false);}
    else{f.hide(false);assert.equal(f.api.getSnapshot().paused,true);close();}
    assert.equal(f.api.getSnapshot().paused,false,type+' did not resume after final blocker');
    assert.equal(f.runs.at(-1),run);assert.equal(f.api.getSnapshot().counted,before.counted);
    f.finish();assert.equal(f.api.getSnapshot().counted,15);f.api.destroy();
  }
  for(const type of ['picture','settings']){
    const f=fixture();f.step();f.click('pause');const run=f.runs.at(-1);
    if(type==='picture')f.click('choosePicture','a');else f.click('settings');
    f.hide(true);f.hide(false);if(type==='picture')f.click('closeDialog');else f.closeSettings();
    assert.equal(f.api.getSnapshot().paused,true,'Explicit user pause must survive automatic blockers');
    f.click('pause');assert.equal(f.api.getSnapshot().paused,false);assert.equal(f.runs.at(-1),run);f.api.destroy();
  }
});
check('seven pictures can be kept and reshared into four places without replacing any picture',()=>{
  const f=fixture({saved:{mode:'share',total:7,groups:3}}),nodes=f.container.querySelectorAll('.pa-item');f.finish();
  assert.deepEqual(copy(f.api.getSnapshot().actualGroups),[2,2,2]);assert.equal(f.api.getSnapshot().poolCount,1);
  f.click('keepRemainder');assert.equal(f.api.getSnapshot().remainderKept,true);assert.equal(f.api.getSnapshot().poolCount,1);
  f.click('moreGroup');assert.equal(f.api.getSnapshot().groups,4);
  f.finish(()=>assert(f.container.querySelectorAll('.pa-item').every(node=>nodes.includes(node))));
  assert.deepEqual(copy(f.api.getSnapshot().actualGroups),[1,1,1,1]);assert.equal(f.api.getSnapshot().poolCount,3);
  f.click('compareShares');const history=copy(f.api.getSnapshot().shareHistory);
  assert.deepEqual(history.map(x=>[x.total,x.groups,x.each,x.remainder]),[[7,3,2,1],[7,4,1,3]]);
  assert.equal(f.container.querySelectorAll('.pa-comparison-card').length,2);f.api.destroy();
});
check('comparison history restores valid snapshots and rejects fabricated results',()=>{
  const good={total:7,groups:3,each:2,remainder:1,picture:'apple',sourceKind:'recommended'};
  const f=fixture({saved:{mode:'share',total:7,groups:4,shareHistory:[good,{...good,each:9},{...good,groups:0},null]},writeFails:true});
  f.finish();assert.equal(f.api.getSnapshot().shareHistory.length,2);f.api.destroy();f.render();
  assert.equal(f.api.getSnapshot().storage.read,'memory');assert.equal(f.api.getSnapshot().shareHistory.length,2);f.api.destroy();
});
check('a kept remainder restores only the same verified distribution, including a fresh module mount',()=>{
  const f=fixture({saved:{mode:'share',total:7,groups:3}});f.finish();const original=f.container.querySelectorAll('.pa-item');
  f.click('keepRemainder');assert.equal(f.api.getSnapshot().remainderKept,true);
  const saved=JSON.parse(f.stored.get('sihyeon-picture-arithmetic-v1'));
  assert.deepEqual(saved.keptShare,{total:7,groups:3,each:2,remainder:1,picture:'apple',sourceKind:'recommended'});
  assert.equal(f.api.getSnapshot().actualCount,7);assert.equal(f.api.getSnapshot().poolCount,1);
  assert(f.container.querySelectorAll('.pa-item').every(node=>original.includes(node)));
  f.api.destroy();
  // A new fixture executes a fresh module context and reads only saved JSON.
  const fresh=fixture({saved});fresh.finish();assert.equal(fresh.api.getSnapshot().remainderKept,true);
  assert(fresh.container.querySelector('.pa-pool').classList.contains('is-kept'));
  assert.equal(fresh.container.querySelector('.pa-pool-title').textContent,'🧺 다음에 쓸 그림');
  assert.equal(fresh.api.getSnapshot().actualCount,7);assert.equal(fresh.api.getSnapshot().poolCount,1);
  fresh.click('moreGroup');fresh.finish();assert.equal(fresh.api.getSnapshot().remainderKept,false);
  assert.equal(fresh.api.getSnapshot().actualCount,7);assert.equal(fresh.api.getSnapshot().poolCount,3);
  fresh.click('chooseGroups');fresh.click('groups','3');fresh.finish();assert.equal(fresh.api.getSnapshot().remainderKept,true);
  fresh.api.destroy();
  for(const overrides of [{total:8},{groups:4},{shareId:'pump_engine'},
    {keptShare:{...saved.keptShare,sourceKind:'artwork'}},
    {keptShare:{...saved.keptShare,each:99}},{keptShare:{...saved.keptShare,remainder:0}},
    {keptShare:{...saved.keptShare,groups:0}},{keptShare:{...saved.keptShare,picture:null}},
    {keptShare:{...saved.keptShare,sourceKind:'unknown'}}]){
    const other=fixture({saved:{...saved,...overrides}});other.finish();
    assert.equal(other.api.getSnapshot().remainderKept,false,JSON.stringify(overrides));
    assert.equal(other.api.getSnapshot().actualCount,overrides.total??7);other.api.destroy();
  }
  const volatile=fixture({saved:{mode:'share',total:7,groups:3},writeFails:true});volatile.finish();volatile.click('keepRemainder');
  volatile.api.destroy();volatile.render();volatile.finish();assert.equal(volatile.api.getSnapshot().remainderKept,true);assert.equal(volatile.api.getSnapshot().storage.read,'memory');volatile.api.destroy();
});
check('zero, short supply and the six-place boundary retain every object',()=>{
  for(const [total,groups] of [[0,6],[1,6],[3,5],[30,6]]){
    const f=fixture({saved:{mode:'share',total,groups}});f.finish();const s=f.api.getSnapshot();
    assert.equal(s.actualCount,total);assert.deepEqual(copy(s.actualGroups),Array(groups).fill(Math.floor(total/groups)));assert.equal(s.poolCount,total%groups);
    assert.equal(!!f.container.querySelector('[data-pa-action="moreGroup"]'),groups<6);f.api.destroy();
  }
});
console.log(JSON.stringify({status:'PASS',scope:'Stage5 production UI/DOM/sequence model; browser and audible speech separate',checks:results},null,2));
