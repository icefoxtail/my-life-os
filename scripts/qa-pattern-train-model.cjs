'use strict';
const assert = require('node:assert/strict');
const M = require('../js/games/pattern-train-model.js');
let cases = 0;
for (const task of M.TASKS) {
  let state = M.createState(task);
  assert.equal(M.restoreState(state).taskId, task.id); cases++;
  if (task.unit) {
    state.board = M.repeat(task.unit, task.size);
    if (task.kind === 'unit') state.chosenPeriod = M.minimalPeriod(state.board);
  } else if (task.kind === 'copy') { state.seed = task.palette.slice(0, task.seedSize); state = M.reduce(state, { type: 'copy' });
  } else if (task.kind === 'alternative') { state.seed = ['red', 'blue', 'red', 'blue']; state = M.reduce(state, { type: 'copy' });
  } else { state.board = M.candidateUnits(task.clues, task.palette, task.allowedPeriods)[0].board; }
  assert.equal(M.validateBoard(task, state.board, state).ok, true, task.id); cases++;
  const running = M.reduce(state, { type: 'start' }); assert.equal(running.phase, 'RUNNING');
  assert.equal(M.reduce(running, { type: 'start' }), running); assert.equal(M.reduce(running, { type: 'place', index: 0 }), running); cases += 3;
  assert.equal(M.restoreState(running).phase, 'BUILDING'); cases++;
  const arrived = M.reduce(running, { type: 'arrive' }); assert.equal(arrived.phase, 'ARRIVED'); assert.equal(M.reduce(arrived, { type: 'edit' }).phase, 'BUILDING'); cases += 2;
  const corrupted = JSON.parse(JSON.stringify(state)); corrupted.board[0] = 'bad'; assert.equal(M.restoreState(corrupted), null); cases++;
}
const amb = M.taskFor('a7-ambiguous'); const candidates = M.candidateUnits(amb.clues, amb.palette, amb.allowedPeriods);
assert.ok(new Set(candidates.map(c => c.board.join('|'))).size > 1);
for (const c of candidates) { assert.equal(M.validateBoard(amb, c.board).ok, true); cases++; }
const alt = M.taskFor('a7-alternative');
for (const seed of [['red', 'red', 'blue', 'blue'], ['blue', 'blue', 'red', 'red']]) { assert.equal(M.validateBoard(alt, M.repeat(seed, alt.size), { seed }).ok, false); cases++; }
const free = M.createFreeTask('shape', 6); assert.deepEqual(M.validateBoard(free, Array(6).fill('circle')), { ok: true, code: 'free', wrong: [], graded: false }); cases++;
let s = M.createState('a4-first'); s = M.reduce(s, { type: 'place', index: 5, token: 'cat' });
assert.equal(M.reduce(s, { type: 'place', index: 5, token: 'cat' }), s);
assert.equal(M.reduce(s, { type: 'start' }).lastResult.ok, false);
s = M.reduce(s, { type: 'place', index: 5, token: 'rabbit' }); assert.equal(M.reduce(s, { type: 'start' }).phase, 'RUNNING');
s = M.reduce(s, { type: 'remove', index: 5 }); assert.equal(s.board[5], null); s = M.reduce(s, { type: 'undo' }); assert.equal(s.board[5], 'rabbit'); cases += 5;
assert.equal(M.TASKS.length, 20); assert.equal(new Set(M.TASKS.map(t => t.id)).size, 20);
// Counterexamples supplied by the independent reviewer are permanent regressions.
for (const id of ['a5-aab', 'a6-abac', 'a6-abbc']) {
  const task = M.taskFor(id); const board = task.clues.map(v => v || task.palette[0]);
  assert.equal(M.validateBoard(task, board).ok, false, id + ' visible rule'); cases++;
}
for (const theme of ['constructor', 'toString', '__proto__']) {
  const broken = M.createState(M.createFreeTask('animal', 6)); broken.theme = theme; broken.taskId = 'free-' + theme;
  assert.equal(M.restoreState(broken), null); cases++;
}
const brokenSize = M.createState(M.createFreeTask('animal', 6)); brokenSize.size = 4.5;
assert.equal(M.restoreState(brokenSize), null); assert.equal(Number.isInteger(M.createFreeTask('animal', 4.5).size), true); cases += 2;
let injection = M.createState('a4-first'); injection.history = [{ board: injection.board, seed: [], chosenPeriod: null, phase: 'RUNNING', taskId: 'missing', departures: 99 }];
injection = M.reduce(M.restoreState(injection), { type: 'undo' });
assert.equal(injection.phase, 'BUILDING'); assert.equal(injection.taskId, 'a4-first'); assert.equal(injection.departures, 0); cases += 3;
const aba = ['red', 'blue', 'red'];
assert.equal(M.validateBoard(M.taskFor('a6-copy'), M.repeat(aba, 9), { seed: aba }).period, 3); cases++;
console.log(JSON.stringify({ status: 'PASS', taskCount: M.TASKS.length, cases, ambiguousCompletions: new Set(candidates.map(c => c.board.join('|'))).size }, null, 2));
