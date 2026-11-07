/* Storage and validation contract checks; no browser/device claim. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../js/play-settings.js'),'utf8');
function fixture(saved,denied=false){
  const storage=new Map(saved===undefined?[]:[['sihyeon-play-settings-v1',saved]]);
  const events=[];
  const window={dispatchEvent:event=>events.push(event)};
  const document={querySelectorAll:()=>[],addEventListener(){}};
  const localStorage={getItem:key=>{if(denied)throw Error('denied');return storage.get(key)||null;},setItem:(key,value)=>{if(denied)throw Error('quota');storage.set(key,value);}};
  vm.runInNewContext(source,{window,document,localStorage,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}});
  return {api:window.SihyeonPlaySettings,storage,events};
}
for(const age of [4,5,6,7]){
  const f=fixture();assert(f.api.setAge(age));
  assert(f.api.setChallenge('numberPostOffice','21-30'));
  assert(f.api.setChallenge('numberCount','1-5'));
  const restored=fixture(f.storage.get('sihyeon-play-settings-v1'));
  assert.equal(restored.api.getAge(),age);
  assert.equal(restored.api.getChallenge('numberPostOffice'),'21-30');
  assert.equal(restored.api.getChallenge('numberCount'),'1-5');
  restored.api.setAge(age===7?4:7);
  assert.equal(restored.api.getChallenge('numberPostOffice'),'21-30','age must never lower challenge');
}
for(const saved of ['not-json','null','false','[]','{"ageMode":99,"challenges":{"numberCount":"bad"}}']){
  const f=fixture(saved);assert.equal(f.api.getAge(),4);assert.equal(f.api.getChallenge('numberCount'),'1-10');
}
const f=fixture(undefined,true);assert(f.api.setAge(6));assert(f.api.setChallenge('numberPostOffice','16-20'));
assert.equal(f.api.getAge(),6);assert.equal(f.api.getChallenge('numberPostOffice'),'16-20');
assert(!f.api.setAge(3));assert(!f.api.setAge(8));assert(!f.api.setChallenge('__proto__','1-10'));assert(!f.api.setChallenge('numberPostOffice','1-5'));
assert(f.events.every(event=>event.type==='sihyeon-settings-change'));
console.log('PASS: all four ages retain independent challenge choices, counting 1–5 persists, malformed/denied storage remains playable, invalid values rejected.');
