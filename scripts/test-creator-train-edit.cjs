/* Real free-train editing handlers/model. DOM output and storage are controlled
 * fixtures, not browser/touch evidence. An alternate source root reproduces the
 * pre-fix lost-tail/lost-undo regression with the same assertions. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..');
const M = require(path.join(root, 'js/games/pattern-train-model.js'));
const plain = value => JSON.parse(JSON.stringify(value));
let checks = 0;

function fixture(initial = new Map()) {
  const storage = new Map(initial), timers = new Map(); let serial = 0;
  const container = {innerHTML: '', addEventListener() {}, removeEventListener() {},
    contains: () => true, closest: () => null, querySelector: () => null, querySelectorAll: () => []};
  const document = {activeElement: null, addEventListener() {}, removeEventListener() {},
    getElementById: () => ({}), head: {appendChild() {}}, body: {appendChild() {}}};
  const window = {SihyeonPatternTrainModel: M, addEventListener() {}, removeEventListener() {},
    setTimeout(fn, ms) { const id = ++serial; timers.set(id, {fn, ms}); return id; }, clearTimeout(id) { timers.delete(id); },
    SihyeonVoice: {stop() {}, speak: () => Promise.resolve(false)}};
  const source = fs.readFileSync(path.join(root, 'js/games/pattern-train.js'), 'utf8')
    .replace('  window.SihyeonGames.patternTrain = {', '  window.__trainEdit = {view, onClick};\n  window.SihyeonGames.patternTrain = {');
  vm.runInNewContext(source, {window, document, console, clearTimeout: window.clearTimeout,
    localStorage: {getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value)}});
  const api = window.SihyeonGames.patternTrain, internal = window.__trainEdit;
  api.render(container, {});
  function click(action, more = {}) {
    const button = {dataset: {action, ...more}, disabled: false,
      closest: selector => selector === '[data-action]' ? button : null};
    internal.onClick({target: button});
  }
  return {api, internal, container, storage, timers, click,
    get state() { return plain(internal.view.state); }, get task() { return internal.view.task; }};
}

// First run the actual UI path: shortening must create an undoable action.
const f = fixture(); f.click('free');
for (let i = 0; i < 3; i++) f.click('shorter');
for (const [index, token] of ['cat', 'rabbit', 'bear'].entries()) {
  f.click('select', {token}); f.click('seat', {index: String(index)});
}
f.click('select', {token: 'frog'});
const before = f.state;
assert.deepEqual(before.board, ['cat', 'rabbit', 'bear']);
f.click('shorter');
assert.deepEqual(f.state.board, ['cat', 'rabbit']);
assert.equal(f.state.history.length, before.history.length + 1, 'shortening must retain prior edits and add exactly one Undo step');
assert.doesNotMatch(f.container.innerHTML, /class="pt-button pt-undo"[^>]*disabled/, 'Undo remains enabled after shortening');
f.click('select', {token: 'cat'}); f.click('undo');
assert.deepEqual(f.state.board, before.board); assert.equal(f.state.size, 3); assert.equal(f.task.size, 3);
assert.equal(f.state.selected, 'frog', 'resize Undo restores the selection at that edit');
assert.equal((f.container.innerHTML.match(/data-coach="/g) || []).length, 3, 'rendered task and recovered board agree');
assert.deepEqual(f.state.history, before.history);
checks++;

f.click('longer'); assert.deepEqual(f.state.board, ['cat', 'rabbit', 'bear', null]);
f.click('undo'); assert.deepEqual(f.state.board, before.board); assert.equal(f.task.size, 3); checks++;
f.click('longer'); f.click('select', {token: 'cat'}); f.click('seat', {index: '3'}); f.click('shorter');
f.click('undo'); assert.deepEqual(f.state.board, ['cat', 'rabbit', 'bear', 'cat']);
f.click('undo'); assert.deepEqual(f.state.board, ['cat', 'rabbit', 'bear', null]);
f.click('undo'); assert.deepEqual(f.state.board, before.board); assert.equal(f.state.selected, 'frog'); checks++;

// Save the shortened board, then load a fresh JS module context. Both the tail
// and its resize history must survive the existing version-1 storage format.
f.click('shorter');
const serialized = JSON.parse(f.storage.get('sihyeon-pattern-train-v1:board:free-animal'));
assert.equal(serialized.version, 1);
assert.deepEqual(Object.keys(serialized).sort(), Object.keys(before).sort(), 'top-level saved schema is unchanged');
const fresh = fixture(f.storage); assert.equal(fresh.state.size, 2); fresh.click('undo');
assert.deepEqual(fresh.state.board, before.board); assert.equal(fresh.state.selected, 'frog'); assert.equal(fresh.task.size, 3);
assert.equal((fresh.container.innerHTML.match(/data-coach="/g) || []).length, 3);
fresh.api.destroy(); fresh.api.render(fresh.container, {});
assert.deepEqual(fresh.state.board, before.board); assert.equal(fresh.state.history.length, before.history.length); checks++;
f.api.destroy(); fresh.api.destroy();

for (const theme of Object.keys(M.PALETTES)) {
  for (let size = 2; size <= 12; size++) {
    let source = M.createState(M.createFreeTask(theme, size)); const palette = M.PALETTES[theme];
    for (let index = 0; index < size; index++) source = M.reduce(source, {type: 'place', index, token: palette[index % palette.length]});
    source = M.reduce(source, {type: 'select', token: palette[3]}); source.departures = 7;
    const sourceCopy = plain(source);
    for (let length = 2; length <= 12; length++) {
      if (length === size) { assert.equal(M.reduce(source, {type: 'resize', size}), source); continue; }
      const resized = M.reduce(source, {type: 'resize', size: length});
      assert.equal(resized.size, length); assert.equal(resized.board.length, length);
      assert.deepEqual(resized.board.slice(0, Math.min(size, length)), source.board.slice(0, Math.min(size, length)));
      if (length > size) assert.ok(resized.board.slice(size).every(value => value === null));
      assert.equal(resized.history.length, source.history.length + 1);
      const changedSelection = M.reduce(resized, {type: 'select', token: palette[0]});
      for (const candidate of [changedSelection, M.restoreState(plain(changedSelection))]) {
        assert.ok(candidate, 'different-length free history is valid after JSON restore');
        const undone = M.reduce(candidate, {type: 'undo'});
        assert.deepEqual(undone.board, source.board); assert.equal(undone.size, size); assert.equal(undone.selected, source.selected);
        assert.deepEqual(undone.history, source.history); assert.equal(undone.departures, 7); assert.equal(undone.phase, 'BUILDING');
      }
      assert.deepEqual(source, sourceCopy, 'resize and undo never mutate their source'); checks++;
    }
  }
}

let s = M.createState(M.createFreeTask('animal', 3));
for (const invalid of [null, false, undefined, NaN, Infinity, '4', {}, 0, 1, 13, 4.5]) {
  assert.equal(M.reduce(s, {type: 'resize', size: invalid}), s); checks++;
}
for (const phase of ['RUNNING', 'ARRIVED']) {
  const locked = {...s, phase}; assert.equal(M.reduce(locked, {type: 'resize', size: 4}), locked); checks++;
}
for (const task of M.TASKS) {
  const state = M.createState(task); assert.equal(M.reduce(state, {type: 'resize', size: task.size === 4 ? 5 : 4}), state);
  const bad = plain(state); bad.history = [{board: Array(3).fill(task.palette[0]), seed: state.seed, chosenPeriod: null}];
  assert.equal(M.restoreState(bad).history.length, 0, 'course history still obeys its original clue positions/length'); checks++;
}
assert.equal(M.TASKS.length, 20);

const old = M.createState(M.createFreeTask('animal', 3));
old.history = [{board: ['cat', null, 'bear'], seed: [], chosenPeriod: null}];
const oldUndo = M.reduce(M.restoreState(plain(old)), {type: 'undo'});
assert.deepEqual(oldUndo.board, ['cat', null, 'bear']); assert.equal(oldUndo.selected, old.selected); checks++;
const corrupt = plain(old);
corrupt.history = [null, {}, {board: ['cat'], seed: [], chosenPeriod: null},
  {board: Array(13).fill('cat'), seed: [], chosenPeriod: null},
  {board: ['cat', 'rabbit'], seed: [], chosenPeriod: null, selected: 'red'},
  {board: ['cat', 'rabbit'], seed: [], chosenPeriod: null, selected: 'bear', phase: 'RUNNING', taskId: 'bad', departures: 999}];
const safe = M.restoreState(corrupt); assert.equal(safe.history.length, 1);
const safeUndo = M.reduce(safe, {type: 'undo'});
assert.equal(safeUndo.size, 2); assert.equal(safeUndo.selected, 'bear'); assert.equal(safeUndo.phase, 'BUILDING');
assert.equal(safeUndo.taskId, 'free-animal'); assert.equal(safeUndo.departures, 0); checks++;
for (let i = 0; i < 60; i++) s = M.reduce(s, {type: 'resize', size: i % 2 ? 3 : 2});
assert.equal(s.history.length, 24); s = M.restoreState(plain(s));
for (let i = 0; i < 24; i++) { s = M.reduce(s, {type: 'undo'}); assert.equal(s.size, s.board.length); }
assert.equal(s.history.length, 0); assert.equal(M.reduce(s, {type: 'undo'}), s); checks++;
console.log(`PASS ${checks} free-train edit cases: actual UI shrink/expand/Undo, selected token and task length, repeated undo, version-1 fresh-context restoration, all 3 themes × 2–12 lengths, immutable bounded history and unchanged 20 course resize guards.`);
