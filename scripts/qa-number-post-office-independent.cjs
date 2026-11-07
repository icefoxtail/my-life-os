/* Independent quantity/state checks. This is not browser or physical-device evidence. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const modelPath = path.join(__dirname, '../js/games/number-post-office-model.js');
const M = require(modelPath);
const checks = [];
let missionsChecked = 0;
let actionsChecked = 0;

function test(name, fn) {
  try { const detail = fn(); checks.push({name, status:'PASS', detail:detail || null}); }
  catch (e) { checks.push({name, status:'FAIL', message:e.message, stack:e.stack}); }
}
function clone(x) { return JSON.parse(JSON.stringify(x)); }
function quantityState(s) { return {positions:s.positions, groups:s.groups}; }
function rangeFor(n) { return n <= 10 ? '1-10' : n <= 15 ? '11-15' : n <= 20 ? '16-20' : '21-30'; }

// Oracle reads each original item exactly once; it does not call model.totals/validate.
function oracle(s) {
  const counts = new Map();
  const trucks = Array(s.mission.truckCount).fill(0);
  let warehouse = 0;
  const seen = new Set();
  for (const item of s.mission.items) {
    assert(!seen.has(item.id), 'duplicate item id'); seen.add(item.id);
    assert(Object.hasOwn(s.positions,item.id), 'item lost from positions');
    const destination=s.positions[item.id];
    assert(Number.isInteger(destination) && destination >= -1 && destination < trucks.length, 'invalid destination');
    if (destination === -1) warehouse++;
    else { trucks[destination]++; counts.set(item.type,(counts.get(item.type)||0)+1); }
  }
  assert.equal(Object.keys(s.positions).length,seen.size,'unexpected position key');
  assert.equal(warehouse+trucks.reduce((a,b)=>a+b,0),s.mission.items.length,'stock changed');
  const grouped=new Set(); const groupIds=new Set();
  for(const group of s.groups) {
    assert(!groupIds.has(group.id),'duplicate bundle id'); groupIds.add(group.id);
    assert.equal(group.items.length,10,'bundle does not contain ten objects');
    let kind;
    for(const id of group.items) {
      assert(!grouped.has(id),'object appears in multiple bundle positions'); grouped.add(id);
      const item=s.mission.items.find(x=>x.id===id); assert(item,'bundle refers to missing object');
      kind=kind||item.type; assert.equal(item.type,kind,'mixed bundle');
      assert.equal(s.positions[id],group.truck,'bundle and object location disagree');
    }
  }
  let correct=s.mission.requirements.every(r=>(counts.get(r.type)||0)===r.count);
  if(trucks.length===2 && s.mission.totalRequired>1) correct=correct&&trucks.every(n=>n>0);
  if(s.mission.splitRule==='near') correct=correct&&Math.abs(trucks[0]-trucks[1])<=1;
  return {correct,trucks,warehouse,total:trucks.reduce((a,b)=>a+b,0)};
}
function step(s,action) {
  const untouched=JSON.stringify(s);
  const next=M.reduce(s,action); actionsChecked++;
  assert.equal(JSON.stringify(s),untouched,'reducer mutated the previous snapshot');
  const o=oracle(next); assert.equal(M.integrity(next),true);
  assert.equal(M.validate(next).ok,o.correct,'quantity validator disagrees with independent oracle');
  assert.deepEqual(M.totals(next).byTruck,o.trucks);
  return next;
}
function solved(mission,firstTruckCount) {
  let s=M.createState(mission); let ordinal=0;
  for(const need of mission.requirements) {
    for(const item of mission.items.filter(x=>x.type===need.type).slice(0,need.count)) {
      const truck=mission.truckCount===2 && ordinal >= (firstTruckCount ?? Math.ceil(mission.totalRequired/2)) ? 1 : 0;
      s=step(s,{type:'MOVE',id:item.id,truck}); ordinal++;
    }
  }
  return s;
}

test('every age can select every target 1..30, with enough unique physical stock',()=>{
  for(const age of [4,5,6,7]) for(let target=1;target<=30;target++) for(const seed of [0,1,2,3,4294967295]) {
    const args={age,challenge:rangeFor(target),seed,round:target%4,target};
    const m=M.generateMission(args); missionsChecked++;
    assert.deepEqual(m,M.generateMission(args),'seed does not reproduce mission');
    assert.equal(m.totalRequired,target);
    assert.equal(m.requirements.reduce((n,r)=>n+r.count,0),target);
    for(const r of m.requirements) {
      assert(Number.isInteger(r.count)&&r.count>0);
      assert(m.items.filter(x=>x.type===r.type).length>r.count,'no extra stock for correction');
    }
    let s=solved(m); assert(oracle(s).correct);
    const packed=clone(s.positions);
    s=step(s,{type:'CHECK'}); assert.equal(s.phase,'DELIVERING');
    const same=step(s,{type:'MOVE',id:m.items[0].id,truck:-1}); assert.deepEqual(same,s);
    s=step(s,{type:'CHECK'}); assert.equal(s.phase,'DELIVERING');
    s=step(s,{type:'FINISH'}); assert.equal(s.phase,'DELIVERED');assert.equal(s.completionCount,1);
    s=step(s,{type:'FINISH'}); assert.equal(s.completionCount,1);
    const restored=M.restoreState(clone(s)); assert(restored); assert.equal(restored.phase,'DELIVERED');
    assert.deepEqual(restored.positions,packed); assert.equal(restored.completionCount,1);
  }
  return {missions:600,targetRange:'1..30',ages:[4,5,6,7]};
});

test('wrong total and wrong type are retained for the child to repair',()=>{
  let s=M.createState(M.generateMission({age:5,challenge:'11-15',target:12,seed:0,round:0}));
  s=step(s,{type:'CHECK'}); assert.equal(s.phase,'SELECTING'); assert(s.feedback.issues.length);
  s=solved(s.mission);const firstNeed=s.mission.requirements[0],secondNeed=s.mission.requirements[1];
  const first=s.mission.items.find(x=>x.type===firstNeed.type&&s.positions[x.id]===0);
  const second=s.mission.items.find(x=>x.type===secondNeed.type&&s.positions[x.id]===-1);
  s=step(s,{type:'MOVE',id:first.id,truck:-1});s=step(s,{type:'MOVE',id:second.id,truck:0});
  assert.equal(oracle(s).total,12);assert.equal(oracle(s).correct,false);
  const before=clone(s.positions);s=step(s,{type:'CHECK'});
  assert.equal(s.phase,'SELECTING');assert.deepEqual(s.positions,before,'wrong answer silently repaired');
  s=step(s,{type:'MOVE',id:second.id,truck:-1});s=step(s,{type:'MOVE',id:first.id,truck:0});
  assert(M.validate(s).ok);
});

test('bundling, unbundling, moving, undoing and resetting conserve actual objects',()=>{
  let s=solved(M.generateMission({age:6,challenge:'21-30',target:23,seed:0,round:0}));
  const positions=clone(s.positions);
  s=step(s,{type:'GROUP',truck:0});assert.equal(s.groups.length,1);assert.deepEqual(s.positions,positions);
  s=step(s,{type:'GROUP',truck:0});assert.equal(s.groups.length,2);assert.deepEqual(s.positions,positions);
  s=step(s,{type:'GROUP',truck:0});assert.equal(s.groups.length,2,'incomplete bundle created');
  s=step(s,{type:'UNGROUP',groupId:s.groups[0].id});assert.equal(s.groups.length,1);assert.deepEqual(s.positions,positions);
  s=step(s,{type:'UNDO'});assert.equal(s.groups.length,2);
  const before=clone(quantityState(s));
  s=step(s,{type:'MOVE_GROUP',groupId:s.groups[0].id,truck:-1});assert.equal(oracle(s).total,13);
  s=step(s,{type:'UNDO'});assert.deepEqual(quantityState(s),before);
  s=step(s,{type:'RESET'});assert.equal(oracle(s).total,0);assert.equal(s.groups.length,0);
  s=step(s,{type:'UNDO'});assert.deepEqual(quantityState(s),before);
  const member=s.groups[0].items[0];s=step(s,{type:'MOVE',id:member,truck:-1});
  assert.equal(oracle(s).total,22);assert.equal(s.groups.length,1,'moving one item should unfold its bundle');
});

test('all valid two-truck arrangements are accepted, including mirrored solutions',()=>{
  let splits=0;
  for(const seed of [0,1]) for(const target of [1,2,9,10,11,15,20,23,30]) {
    const mission=M.generateMission({age:7,challenge:rangeFor(target),target,seed,round:0});
    for(let left=0;left<=target;left++) {
      const s=solved(mission,left);
      const both=target===1||(left>0&&left<target);
      const expected=both&&(seed===0||Math.abs(left-(target-left))<=1);
      assert.equal(M.validate(s).ok,expected,`${mission.kind}: ${left}+${target-left}`);splits++;
    }
  }
  return {arrangements:splits};
});

test('random input sequences preserve unique objects and never double complete',()=>{
  let n=3973; const random=()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);
  for(const age of [4,5,6,7]) {
    let s=M.createState(M.generateMission({age,challenge:'21-30',target:23,seed:3,round:1}));
    for(let i=0;i<450;i++) {
      const kind=Math.floor(random()*7);
      const item=s.mission.items[Math.floor(random()*s.mission.items.length)];
      const truck=Math.floor(random()*(s.mission.truckCount+1))-1;
      const action=kind<3?{type:'MOVE',id:item.id,truck}:kind===3?{type:'GROUP',truck:0}:kind===4?{type:'UNDO'}:kind===5?{type:'CHECK'}:{type:'RESET'};
      s=step(s,action);
      const restored=M.restoreState(clone(s));assert(restored);oracle(restored);
      assert.deepEqual(restored.positions,s.positions);
      assert.equal(restored.groups.length,s.groups.length);
      if(s.phase==='DELIVERING') {s=step(s,{type:'FINISH'});assert.equal(s.completionCount,1);break;}
    }
  }
});

test('interrupted delivery and corrupted saves recover without false reward or lockup',()=>{
  let s=solved(M.generateMission({age:6,challenge:'21-30',target:23,seed:0,round:0}));
  s=step(s,{type:'GROUP',truck:0});
  const packed=clone(s.positions);
  const delivering=step(s,{type:'CHECK'});
  const resumed=M.restoreState(clone(delivering));assert(resumed);
  assert.equal(resumed.phase,'SELECTING');assert.equal(resumed.completionCount,0);assert.deepEqual(resumed.positions,packed);
  for(const bad of [null,{},[],{...clone(s),version:0}]) assert.equal(M.restoreState(bad),null);
  const badPosition=clone(s);badPosition.positions[Object.keys(s.positions)[0]]=99;assert.equal(M.restoreState(badPosition),null);
  const missing=clone(s);delete missing.positions[Object.keys(s.positions)[0]];assert.equal(M.restoreState(missing),null);
  const duplicated=clone(s);duplicated.groups[0].items[1]=duplicated.groups[0].items[0];assert.equal(M.restoreState(duplicated),null);
  const falseWin=clone(s);falseWin.phase='DELIVERED';falseWin.positions[Object.keys(s.positions)[0]]=-1;falseWin.groups=[];
  const noFalseWin=M.restoreState(falseWin);assert(noFalseWin);assert.equal(noFalseWin.phase,'SELECTING');assert.equal(noFalseWin.completionCount,0);
  const suspiciousId=clone(s);suspiciousId.groups[0].id='bundle-10000';
  const safe=M.restoreState(suspiciousId);assert(safe);
  const after=step(safe,{type:'GROUP',truck:0});assert.equal(after.groups.length,2);
  assert.equal(new Set(after.groups.map(g=>g.id)).size,2,'restored bundle sequence collided');
});

const report={
  suite:'Independent quantity/state QA',
  modelSha256:crypto.createHash('sha256').update(fs.readFileSync(modelPath)).digest('hex'),
  status:checks.every(c=>c.status==='PASS')?'PASS':'FAIL',missionsChecked,actionsChecked,checks,
  limits:['Node model checks only. No browser DOM, layout, touch device, TTS listening, or child observation is claimed.']
};
const out=process.argv[2];if(out) fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
process.exitCode=report.status==='PASS'?0:1;
