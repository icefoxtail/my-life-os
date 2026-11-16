/* Independent arithmetic/state assertions; this does not claim browser or voice QA. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/games/ten-frame-garden.js'), 'utf8'), sandbox);
const M = sandbox.window.SihyeonTenFrameGardenModel;
assert(M && sandbox.window.SihyeonGames.tenFrameGarden);
let cases = 0;
let fillPositions = 0;
function checkNeeds(state) {
  const q = M.inspect(state);
  if (state.mode === 'fill') {
    assert.equal(q.initialNeed, state.goal - state.quantity);
    assert.equal(q.added, state.count - state.quantity);
    assert.equal(q.stillNeeded, state.goal - state.count);
    assert.equal(q.added + q.stillNeeded, q.initialNeed);
    assert.equal(q.stillNeeded, M.slots(state).filter(s => !s.filled).length, 'Current need equals the actual empty slots');
    fillPositions++;
  } else {
    assert.equal(q.initialNeed, 0); assert.equal(q.added, 0); assert.equal(q.stillNeeded, 0);
  }
}
for (const mode of ['number', 'free', 'fill', 'colors']) {
  for (let n = 0; n <= 30; n++) {
    let state = M.createState({ quantity: n, mode });
    const before = JSON.stringify(state);
    const expectedGoal = mode === 'fill' ? Math.min(30, (Math.floor(n / 10) + 1) * 10) : n;
    assert.equal(state.quantity, n);
    assert.equal(state.goal, expectedGoal);
    checkNeeds(state);
    assert.equal(M.slots(state).filter(s => s.filled).length, n, 'N flowers appear before automatic counting');
    assert.equal(M.slots(state).length, Math.max(10, Math.ceil(expectedGoal / 10) * 10));
    assert.equal(new Set(M.slots(state).map(s => s.id)).size, M.slots(state).length);
    let old = state;
    for (let i = 1; i <= expectedGoal; i++) {
      state = M.reduce(state, { type: 'STEP', ordinal: i });
      assert.equal(state.active, i);
      assert.equal(state.quantity, n, 'chosen number stays separate from fill result');
      assert.equal(M.slots(state).filter(s => s.filled).length, mode === 'fill' ? Math.max(n, i) : n);
      checkNeeds(state);
    }
    assert.equal(JSON.stringify(old), before, 'reducer must not mutate prior state');
    state = M.reduce(state, { type: 'COMPLETE' });
    assert.equal(state.count, expectedGoal);
    assert.equal(state.active, 0);
    checkNeeds(state);
    assert.equal(M.inspect(state).visible, expectedGoal);
    assert.equal(M.inspect(state).groups.reduce((a, b) => a + b, 0), expectedGoal);
    state = M.reduce(state, { type: 'REPLAY' });
    assert.equal(state.count, n, 'replay restores the chosen starting amount');
    assert.equal(state.active, 0);
    checkNeeds(state);
    cases++;
  }
}
for (let n = 0; n <= 30; n++) for (let split = 0; split <= n; split++) {
  const state = M.createState({ quantity: n, mode: 'colors', split, flower: 'pink' });
  const shown = M.slots(state).filter(s => s.filled);
  assert.equal(shown.length, n);
  assert.equal(shown.filter(s => s.flower === 'pink').length, split);
  assert.equal(shown.filter(s => s.flower === 'purple').length, n - split);
  assert.equal(M.inspect(state).firstColor + M.inspect(state).secondColor, n);
  cases++;
}
const start = M.createState({ quantity: 15, mode: 'colors', split: 8 });
for (const value of [-1, 31, 3.2, NaN, Infinity, '9', null]) {
  assert.equal(M.reduce(start, { type: 'QUANTITY', value }), start);
}
for (const value of [-1, 16, 3.1, '8']) assert.equal(M.reduce(start, { type: 'SPLIT', value }), start);
assert.equal(M.reduce(start, { type: 'MODE', value: 'unknown' }), start);
assert.equal(M.reduce(start, { type: 'FLOWER', value: '<bad>' }), start);
assert.equal(M.reduce(start, { type: 'READING', value: 'bad' }), start);
assert.equal(M.reduce(start, { type: 'STEP', ordinal: 16 }), start);
const nine = M.reduce(M.reduce(start, { type: 'STEP', ordinal: 12 }), { type: 'QUANTITY', value: 9 });
assert.equal(nine.count, 9); assert.equal(nine.goal, 9); assert.equal(nine.active, 0);
const flowerChange = M.reduce(nine, { type: 'FLOWER', value: 'purple' });
assert.equal(flowerChange.count, 9); assert.equal(flowerChange.quantity, 9);
const readingChange = M.reduce(flowerChange, { type: 'READING', value: 'sino' });
assert.equal(readingChange.reading, 'sino'); assert.equal(readingChange.count, 9);
for (const bad of [null, [], false, 'bad', { quantity: 99, mode: 'bad', flower: 'bad', split: -4 }]) {
  const restored = M.restore(bad);
  assert.equal(restored.quantity, 15); assert.equal(restored.mode, 'number');
}
const restore = M.restore(JSON.parse(JSON.stringify(M.preferences(start))));
assert.equal(restore.quantity, 15); assert.equal(restore.split, 8); assert.equal(restore.mode, 'colors');
const stopped = M.reduce(M.reduce(start, { type: 'STEP', ordinal: 5 }), { type: 'PAUSE' });
assert.equal(stopped.active, 0); assert.equal(stopped.count, 15);
assert.equal(M.nextTen(0), 10); assert.equal(M.nextTen(10), 20); assert.equal(M.nextTen(20), 30); assert.equal(M.nextTen(30), 30);
assert.deepEqual(Array.from(M.inspect(M.createState({ quantity: 15 })).groups), [10, 5]);
console.log(`PASS: ${cases} garden quantity/fill/color states and ${fillPositions} fill-position complement checks; 0-30 counts, fixed totals, unique objects, restore and cancellation state. Browser rendering and real speech are NOT_RUN.`);
