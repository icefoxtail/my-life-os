/* Exact quantity and language checks; no claim about device audio or rendering. */
const assert = require('node:assert/strict');
const model = require('../js/games/quantity-play-model.js');

const native = '영 하나 둘 셋 넷 다섯 여섯 일곱 여덟 아홉 열 열하나 열둘 열셋 열넷 열다섯 열여섯 열일곱 열여덟 열아홉 스물 스물하나 스물둘 스물셋 스물넷 스물다섯 스물여섯 스물일곱 스물여덟 스물아홉 서른'.split(' ');
const sino = '영 일 이 삼 사 오 육 칠 팔 구 십 십일 십이 십삼 십사 십오 십육 십칠 십팔 십구 이십 이십일 이십이 이십삼 이십사 이십오 이십육 이십칠 이십팔 이십구 삼십'.split(' ');
const beforeUnit = '영 한 두 세 네 다섯 여섯 일곱 여덟 아홉 열 열한 열두 열세 열네 열다섯 열여섯 열일곱 열여덟 열아홉 스무 스물한 스물두 스물세 스물네 스물다섯 스물여섯 스물일곱 스물여덟 스물아홉 서른'.split(' ');
const english = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three twenty-four twenty-five twenty-six twenty-seven twenty-eight twenty-nine thirty'.split(' ');

for (let n = 0; n <= 30; n += 1) {
  assert(model.isQuantity(n));
  assert.equal(model.countWord(n), native[n]);
  assert.equal(model.countWord(n, 'sino'), sino[n]);
  assert.equal(model.countWord(n, 'native', 'en'), english[n]);
  assert.equal(model.countWord(n, 'sino', 'en'), english[n]);
  assert.equal(model.determiner(n), beforeUnit[n]);
  for (const unit of ['대', '개', '마리', '송이']) {
    assert.equal(model.quantityText(n, unit), n ? beforeUnit[n] + ' ' + unit : '하나도 없어요');
  }
  const items = model.items(n, 'test');
  assert.equal(items.length, n);
  assert.equal(new Set(items.map(item => item.id)).size, n);
  items.forEach((item, index) => {
    assert.equal(item.id, 'test-' + (index + 1));
    assert.equal(item.index, index);
    assert.equal(item.ordinal, index + 1);
  });
}
assert.equal(model.quantityText(1, '대', 'en'), 'one vehicle');
assert.equal(model.quantityText(20, '대', 'en'), 'twenty vehicles');
assert.equal(model.quantityText(3, '송이', 'en'), 'three flowers');
assert.equal(model.quantityText(0, '마리', 'en'), 'None here');

let additions = 0;
let rejectedSums = 0;
for (let a = 0; a <= 30; a += 1) {
  for (let b = 0; b <= 30; b += 1) {
    if (a + b > 30) {
      assert.throws(() => model.addition(a, b), error => error.code === 'SUM_OUT_OF_RANGE');
      rejectedSums += 1;
      continue;
    }
    const result = model.addition(a, b);
    assert.equal(result.a, a);
    assert.equal(result.b, b);
    assert.equal(result.left.length, a);
    assert.equal(result.right.length, b);
    assert.equal(result.total, result.items.length);
    assert.equal(result.total, a + b);
    assert.equal(new Set(result.items.map(item => item.id)).size, result.total);
    assert(result.left.every(item => item.source === 'left' && item.groupIndex === 0));
    assert(result.right.every(item => item.source === 'right' && item.groupIndex === 1));
    assert.deepEqual(result.items, [...result.left, ...result.right]);
    additions += 1;
  }
}

let shares = 0;
for (let total = 0; total <= 30; total += 1) {
  for (let groupCount = 1; groupCount <= 6; groupCount += 1) {
    const result = model.equalShare(total, groupCount);
    const grouped = result.groups.flat();
    const all = grouped.concat(result.remaining);
    assert.equal(result.groups.length, groupCount);
    assert(result.groups.every(group => group.length === result.each));
    assert.equal(all.length, total, 'every original object must remain visible');
    assert.equal(new Set(all.map(item => item.id)).size, total, 'no copied or lost objects');
    assert.equal(result.remaining.length, result.remainder);
    assert(result.remainder >= 0 && result.remainder < groupCount);
    assert.equal(result.each * groupCount + result.remainder, total);
    assert.equal(result.moves.length, grouped.length);
    const ledger = Array(groupCount).fill(0);
    const movedIds = new Set();
    for (const move of result.moves) {
      assert(move.groupIndex >= 0 && move.groupIndex < groupCount);
      assert(!movedIds.has(move.item.id));
      movedIds.add(move.item.id);
      ledger[move.groupIndex] += 1;
      assert.equal(move.groupCountAfter, ledger[move.groupIndex]);
      assert(Math.max(...ledger) - Math.min(...ledger) <= 1, 'distribute in fair complete rounds');
    }
    assert(ledger.every(value => value === result.each));
    assert(result.remaining.every(item => !movedIds.has(item.id)), 'remainders stay outside all equal groups');
    shares += 1;
  }
}
assert.deepEqual(model.equalShare(15, 4).groups.map(group => group.length), [3, 3, 3, 3]);
assert.equal(model.equalShare(15, 4).remaining.length, 3);
assert.deepEqual(model.equalShare(3, 5).groups.map(group => group.length), [0, 0, 0, 0, 0]);
assert.equal(model.equalShare(3, 5).remaining.length, 3);
assert.equal(model.equalShare(0, 6).moves.length, 0);

for (const value of [-1, 31, 0.5, NaN, Infinity, -Infinity, '3', null, undefined, true, [], {}]) {
  assert(!model.isQuantity(value));
  for (const operation of [() => model.countWord(value), () => model.determiner(value),
    () => model.quantityText(value), () => model.items(value), () => model.addition(value, 1),
    () => model.addition(1, value), () => model.equalShare(value, 2)]) {
    assert.throws(operation, error => error.code === 'QUANTITY_OUT_OF_RANGE');
  }
}
for (const groupCount of [0, -1, 7, 1.5, NaN, Infinity, '2', null, undefined]) {
  assert.throws(() => model.equalShare(15, groupCount), error => error.code === 'GROUP_COUNT_OUT_OF_RANGE');
}
assert.throws(() => model.countWord(3, 'unknown'), error => error.code === 'READING_STYLE_INVALID');
assert.throws(() => model.countWord(3, 'native', 'unknown'), error => error.code === 'LANGUAGE_INVALID');
assert.throws(() => model.quantityText(3, ''), error => error.code === 'UNIT_INVALID');
assert.throws(() => model.items(3, ''), error => error.code === 'ITEM_PREFIX_INVALID');
const first = model.equalShare(15, 4);
first.groups[0].pop();
assert.equal(model.equalShare(15, 4).groups[0].length, 3, 'each calculation returns independent data');

console.log('PASS: 0-30 number words and counters; ' + additions + ' additions; ' + rejectedSums + ' overflowing sums rejected; ' + shares + ' equal shares preserve objects and remainders; invalid inputs rejected.');
