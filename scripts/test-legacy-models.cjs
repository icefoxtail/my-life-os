/* Dependency-free regression checks. These are model checks, not browser/touch tests. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const sandbox = {window: {addEventListener() {}}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/engine/webgl-fallback.js'), 'utf8'), sandbox);
const model = sandbox.window.Sihyeon2DFallback.model;
const plain = value => JSON.parse(JSON.stringify(value));
let checks = 0;

// Combining and then separating must preserve both the total and original parts.
for (let a = 1; a <= 150; a++) {
  for (let b = 1; b <= 150; b++) {
    const original = [{id:1,value:a}, {id:2,value:b}];
    const merged = model.mergeNumbers(original, [1,2], 10);
    assert.equal(model.sum(merged), a+b);
    assert.equal(merged.length, 1);
    const split = model.splitNumber(merged, 10, 20);
    assert.equal(model.sum(split), a+b);
    assert.deepEqual(plain(split.map(block => block.value)), [a,b]);
    assert.deepEqual(original, [{id:1,value:a}, {id:2,value:b}], 'input must remain unchanged');
    checks++;
  }
}

// A selected block without merge history still separates into positive parts.
for (let value = 2; value <= 300; value++) {
  const split = model.splitNumber([{id:1,value}], 1, 10);
  assert.equal(model.sum(split), value);
  assert.ok(split.every(block => Number.isInteger(block.value) && block.value > 0));
  assert.equal(new Set(split.map(block => block.id)).size, split.length);
  checks++;
}

const pair = [{id:1,value:2}, {id:2,value:3}];
assert.equal(model.mergeNumbers(pair,[1,1],10),pair,'repeat selecting one block cannot double its value');
assert.equal(model.mergeNumbers(pair,[1,99],10),pair,'missing selection cannot consume a real block');
assert.equal(model.splitNumber(pair,99,10),pair,'missing selection is harmless');
assert.equal(model.splitNumber([{id:1,value:1}],1,10).length,1,'one cannot split into zero');
assert.equal(model.mergeNumbers([{id:1,value:200},{id:2,value:200}],[1,2],10).length,2,'total cap is preserved');
const full = Array.from({length:24},(_,index)=>({id:index+1,value:2}));
assert.equal(model.splitNumber(full,1,30),full,'card count cap prevents hidden overflow');
checks += 6;

// Untrusted / partial saved data must not crash the fallback or create quantities.
for (const saved of [null, {}, {blocks:null}, {blocks:[null]}, {blocks:[false]},
  {blocks:[{}]}, {blocks:[{value:0}]}, {blocks:[{value:-1}]}, {blocks:[{value:1.5}]},
  {blocks:[{value:'2'}]}, {blocks:[{value:301}]}, {blocks:[{value:200},{value:200}]},
  {blocks:Array.from({length:25},()=>({value:1}))}]) {
  assert.equal(model.restoreNumbers(saved),null);
  checks++;
}
assert.deepEqual(plain(model.restoreNumbers({blocks:[]})),[],'a saved empty board remains empty');
const restored = model.restoreNumbers({blocks:[{id:5,value:5,parts:[2,3]},{id:5,value:8,parts:[2,3]}]});
assert.deepEqual(plain(restored),[{id:1,value:5,parts:[2,3]},{id:2,value:8}]);
checks += 2;

// All offered basic consonant/vowel pairs form the standard Unicode syllable.
const consonants = [...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ'];
const consonantIndex = [0,2,3,5,6,7,9,11,12,14,15,16,17,18];
const vowels = [...'ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ'];
const vowelIndex = [0,2,4,6,8,12,13,17,18,20];
const syllables = new Set();
consonants.forEach((cho,i) => vowels.forEach((jung,j) => {
  const result = model.composeHangul(cho,jung);
  assert.equal(result.codePointAt(0),0xAC00+consonantIndex[i]*588+vowelIndex[j]*28);
  syllables.add(result);
  checks++;
}));
assert.equal(syllables.size,140);
assert.equal(model.composeHangul('X','ㅏ'),'');
assert.equal(model.composeHangul('ㄱ','X'),'');
checks += 3;
console.log(`PASS ${checks} model scenarios: quantity conservation, undoable parts, saved-data validation, 140 Hangul compositions.`);
