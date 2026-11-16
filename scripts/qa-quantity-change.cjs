/* Independent comparison/subtraction invariants. No browser or audible-speech claim. */
'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'js/games/quantity-play-model.js');
const M = require(source);
assert.equal(typeof M.comparison, 'function');
assert.equal(typeof M.subtraction, 'function');

let assertions = 0;
function same(actual, expected, message) { assertions++; assert.strictEqual(actual, expected, message); }
function deep(actual, expected, message) { assertions++; assert.deepEqual(actual, expected, message); }
function ok(value, message) { assertions++; assert.ok(value, message); }
function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value); Object.values(value).forEach(freeze); return value;
}
function unique(items, count) {
  same(items.length, count, 'Physical item count');
  same(new Set(items).size, count, 'Every physical item is a distinct object');
  same(new Set(items.map(item => item.id)).size, count, 'IDs are unique across both sides');
  ok(items.every(item => typeof item.id === 'string' && item.id.length > 0), 'Nonempty item IDs');
}

// Holding earlier results frozen catches reuse/mutation across later calls.
const earlier = freeze({ compare: M.comparison(30, 30), subtract: M.subtraction(30, 17) });
const earlierJSON = JSON.stringify(earlier);
let comparisons = 0, validSubtractions = 0, invalidSubtractions = 0;
for (let a = 0; a <= 30; a++) for (let b = 0; b <= 30; b++) {
  const c = M.comparison(a, b);
  same(c.a, a); same(c.b, b);
  same(c.pairCount, Math.min(a, b)); same(c.difference, Math.abs(a - b));
  same(c.relation, a > b ? 'left' : a < b ? 'right' : 'equal');
  unique(c.left.concat(c.right), a + b);
  same(c.left.length, a); same(c.right.length, b); same(c.pairs.length, Math.min(a, b));
  c.pairs.forEach((pair, i) => {
    same(pair.left, c.left[i], 'A pair retains the original left reference');
    same(pair.right, c.right[i], 'A pair retains the original right reference');
  });
  deep(c.leftExtra, c.left.slice(c.pairCount));
  deep(c.rightExtra, c.right.slice(c.pairCount));
  c.leftExtra.forEach((item, i) => same(item, c.left[c.pairCount + i]));
  c.rightExtra.forEach((item, i) => same(item, c.right[c.pairCount + i]));
  same(c.leftExtra.length + c.rightExtra.length, c.difference);
  same(c.pairs.length * 2 + c.leftExtra.length + c.rightExtra.length, a + b, 'No missing or cloned comparison object');
  comparisons++;

  if (b > a) {
    assertions++;
    assert.throws(() => M.subtraction(a, b), error => error.code === 'SUBTRACTION_OUT_OF_RANGE');
    invalidSubtractions++;
    continue;
  }
  const s = M.subtraction(a, b);
  same(s.a, a); same(s.b, b); same(s.remainingCount, a - b);
  unique(s.original, a); unique(s.remaining.concat(s.departed), a);
  same(s.remaining.length, a - b); same(s.departed.length, b); same(s.moves.length, b);
  const originalIDs = s.original.map(item => item.id);
  s.remaining.forEach((item, i) => same(item, s.original[i], 'Remaining objects keep their original references and order'));
  s.departed.forEach((item, i) => same(item, s.original[a - i - 1], 'Departure uses the original last item first'));
  s.moves.forEach((move, i) => {
    same(move.item, s.original[a - i - 1]); same(move.item, s.departed[i]);
    same(move.remainingAfter, a - i - 1); same(move.departedAfter, i + 1);
    same(move.remainingAfter + move.departedAfter, a, 'Every subtraction step conserves the original count');
  });
  const retained = new Set(s.remaining);
  ok(s.departed.every(item => !retained.has(item)), 'Remaining and departed partitions are disjoint');
  ok(s.original.every(item => retained.has(item) || s.departed.includes(item)), 'Every original object survives subtraction');
  deep(s.original.map(item => item.id), originalIDs, 'The original array is not shortened or reordered');
  const before = JSON.stringify(s);
  const another = M.subtraction(a, b);
  same(JSON.stringify(s), before, 'Another call must not change an earlier result');
  if (a) ok(another.original[0] !== s.original[0], 'Results from independent calls do not share mutable objects');
  validSubtractions++;
}
same(comparisons, 961); same(validSubtractions, 496); same(invalidSubtractions, 465);
same(JSON.stringify(earlier), earlierJSON, 'Prior frozen results remain unchanged');

let invalidOperands = 0;
for (const value of [-1, 31, 0.5, 15.2, NaN, Infinity, -Infinity, '7', '', null, undefined, true, false, [], {}]) {
  for (const fn of [M.comparison, M.subtraction]) for (const args of [[value, 0], [0, value]]) {
    assertions++;
    assert.throws(() => fn(...args), error => error.code === 'QUANTITY_OUT_OF_RANGE');
    invalidOperands++;
  }
}
for (const [unit, singular, plural] of [['채', 'house', 'houses'], ['척', 'boat', 'boats']]) {
  same(M.quantityText(1, unit, 'en'), 'one ' + singular);
  same(M.quantityText(2, unit, 'en'), 'two ' + plural);
}
console.log(JSON.stringify({
  suite: 'Independent quantity comparison and subtraction invariants', status: 'PASS',
  sourceSHA256: crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),
  comparisons, validSubtractions, invalidSubtractions, invalidOperands, assertions,
  checked: ['zero through thirty on each side, including sixty visible comparison objects',
    'pair and extra references, identity and uniqueness', 'all departure steps and conserved original arrays',
    'independent calls and frozen prior-result nonmutation', 'invalid operands and subtraction rejection',
    'English house and boat units'],
  limitations: ['Model checks only; browser layout, native audio, physical devices and child observation are NOT_RUN']
}, null, 2));
