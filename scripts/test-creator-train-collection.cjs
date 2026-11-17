/* Gallery/state tests. Real handlers run against a small DOM fixture; these
   results are not pixel, physical-device, or learning-effect evidence. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const M = require(path.join(ROOT, 'js/games/pattern-train-model.js'));
const KEY = 'sihyeon-pattern-train-v1:collection';
const plain = x => JSON.parse(JSON.stringify(x));
const checks = [];
function test(name, run) { run(); checks.push({ name, status: 'PASS' }); }
function complete(task, values) {
  let s = M.createState(task);
  values.forEach((token, index) => { s = M.reduce(s, { type: 'place', index, token }); });
  return s;
}
function fixture(initial = new Map(), options = {}) {
  const storage = new Map(initial); let serial = 0;
  const container = { innerHTML: '', addEventListener() {}, removeEventListener() {}, contains: () => true,
    closest: () => null, querySelector: () => null, querySelectorAll: () => [] };
  const document = { activeElement: null, addEventListener() {}, removeEventListener() {}, getElementById: () => ({}), head: { appendChild() {} }, body: { appendChild() {} } };
  const window = { SihyeonPatternTrainModel: M, addEventListener() {}, removeEventListener() {}, setTimeout: () => ++serial, clearTimeout() {},
    SihyeonVoice: { stop() {}, speak: () => Promise.resolve(false) } };
  const code = fs.readFileSync(path.join(ROOT, 'js/games/pattern-train.js'), 'utf8')
    .replace('  window.SihyeonGames.patternTrain = {', '  window.__gallery = {view, onClick, dispatch};\n  window.SihyeonGames.patternTrain = {');
  vm.runInNewContext(code, { window, document, console, clearTimeout() {}, localStorage: {
    getItem(key) { if (options.readFailure && key === KEY) throw new Error('read denied'); return storage.get(key) ?? null; },
    setItem(key, value) { if (options.writeFailure && key === KEY) throw new Error('quota'); storage.set(key, value); }
  } });
  const api = window.SihyeonGames.patternTrain, internal = window.__gallery;
  api.render(container, {});
  function click(action, more = {}) {
    const button = { dataset: { action, ...more }, disabled: false,
      closest: selector => selector === '[data-action]' ? button : selector === '.pt-dialog' && internal.view.modal ? container : null };
    internal.onClick({ target: button });
  }
  function fill(values) {
    values.forEach((token, index) => { click('select', { token }); click('seat', { index: String(index) }); });
  }
  function save() { click('collection'); click('save-work'); }
  return { api, internal, container, storage, click, fill, save, snapshot: () => plain(api.getSnapshot()) };
}

test('six immutable snapshots; capacity and duplicate never replace prior work', () => {
  let c = M.restoreCollection(null);
  const states = [];
  for (let i = 0; i < 7; i++) states.push(complete(M.createFreeTask('animal', 6), Array.from({ length: 6 }, (_, j) => (i >> j) & 1 ? 'rabbit' : 'cat')));
  for (let i = 0; i < 6; i++) {
    const before = plain(c), r = M.addWork(c, states[i], 'work-' + i, 100 + i);
    assert.equal(r.ok, true); assert.deepEqual(c, before); c = r.collection;
    states[i].board[0] = 'frog'; assert.notEqual(c.works[i].state.board[0], 'frog');
  }
  const before = plain(c);
  assert.equal(M.addWork(c, states[6], 'overflow', 200).code, 'full');
  assert.equal(M.addWork(c, c.works[0].state, 'duplicate', 201).code, 'duplicate');
  assert.deepEqual(c, before);
  const removed = M.removeWork(c, 'work-2'); assert.equal(removed.works.length, 5); assert.deepEqual(c, before);
  assert.equal(M.addWork(removed, states[6], 'replacement', 202).ok, true);
});
test('all four ambiguous answers save separately and reveal two- or four-car units', () => {
  const task = M.taskFor('a7-ambiguous'); let c = M.restoreCollection(null), count = 0;
  for (let bits = 0; bits < 16; bits++) {
    const board = task.clues.slice(); [2, 3, 6, 7].forEach((index, k) => { board[index] = (bits >> k) & 1 ? 'rabbit' : 'cat'; });
    // Independent period check over the displayed clue-compliant arrangement.
    const periods = [2, 3, 4].filter(p => board.every((v, i) => i < p || v === board[i - p]));
    const state = complete(task, board), result = M.addWork(c, state, 'answer-' + bits, bits);
    assert.equal(result.ok, periods.length > 0);
    if (result.ok) { c = result.collection; count++; const d = M.describePattern(board); assert.equal(d.period, Math.min(...periods)); assert.deepEqual(d.groups.flat().concat(d.tail), board); }
  }
  assert.equal(count, 4); assert.equal(c.works.length, 4);
});
test('whole repeating groups, partial tails, and honest non-repeating free boards', () => {
  const d = M.describePattern(['cat', 'rabbit', 'bear', 'cat', 'rabbit', 'bear', 'cat', 'rabbit']);
  assert.equal(d.period, 3); assert.equal(d.fullGroups, 2); assert.deepEqual(d.unit, ['cat', 'rabbit', 'bear']); assert.deepEqual(d.tail, ['cat', 'rabbit']);
  for (const b of [['cat', 'rabbit', 'bear'], ['cat', 'rabbit', 'bear', 'cat'], ['cat', 'rabbit', 'bear', 'frog']]) {
    const p = M.describePattern(b); assert.equal(p.repeating, false); assert.equal(p.period, null); assert.deepEqual(p.groups, [b]);
  }
  assert.equal(M.describePattern(['cat', null]), null);
});
test('invalid, incomplete, running, and malformed gallery snapshots are rejected', () => {
  const s = complete(M.createFreeTask('animal', 2), ['cat', 'rabbit']);
  assert.equal(M.workState({ ...s, phase: 'RUNNING' }), null);
  assert.equal(M.workState(M.createState('a4-first')), null);
  const c = M.addWork(M.restoreCollection(null), s, 'valid', 1).collection;
  for (const raw of [{ version: 2, works: [] }, { version: 1, works: {} }, { version: 1, works: [...c.works, ...c.works] },
    { version: 1, works: [{ ...c.works[0], id: '<script>' }] }, { version: 1, works: [{ ...c.works[0], createdAt: -1 }] },
    { version: 1, works: [{ ...c.works[0], state: { ...s, board: ['bad', 'rabbit'] } }] }]) assert.equal(M.restoreCollection(raw), null);
  assert.deepEqual(M.restoreCollection(plain(c)), c);
});
test('public save/load handlers keep old work immutable, editing and restart stay independent', () => {
  const f = fixture(); f.click('free'); f.fill(['cat', 'rabbit', 'cat', 'rabbit', 'cat', 'rabbit']); f.save();
  const first = f.snapshot().collection.works[0]; assert.equal(first.state.history.length, 0);
  f.click('save-work'); assert.equal(f.snapshot().collection.works.length, 1); assert.match(f.container.innerHTML, /이미 작품함/);
  f.click('close-modal'); f.fill(['cat', 'cat', 'rabbit', 'cat', 'cat', 'rabbit']); f.save();
  assert.equal(f.snapshot().collection.works.length, 2);
  assert.match(f.container.innerHTML, /data-comparison="first"[\s\S]*data-period="2"/);
  assert.match(f.container.innerHTML, /data-comparison="current"[\s\S]*data-period="3"/);
  f.click('open-work', { work: first.id }); assert.equal(f.snapshot().modal, 'open-work');
  f.click('confirm-open-work'); assert.deepEqual(f.snapshot().state.board, first.state.board); assert.equal(f.snapshot().state.history.length, 0);
  f.click('select', { token: 'frog' }); f.click('seat', { index: '0' }); f.click('shorter'); f.click('undo');
  assert.equal(f.snapshot().state.size, 6); assert.equal(f.snapshot().state.board[0], 'frog');
  assert.deepEqual(f.snapshot().collection.works[0], first);
  f.click('restart'); f.click('confirm-reset'); assert.equal(f.snapshot().state.board.filter(Boolean).length, 0);
  assert.deepEqual(f.snapshot().collection.works[0], first);
  const fresh = fixture(f.storage); assert.deepEqual(fresh.snapshot().collection.works, f.snapshot().collection.works);
  fresh.click('collection'); fresh.click('open-work', { work: first.id }); fresh.click('confirm-open-work');
  assert.deepEqual(fresh.snapshot().state.board, first.state.board);
});
test('first successful departure is retained for a different answer even before gallery save', () => {
  const f = fixture(); f.click('level', { level: '7' }); f.click('stop', { stop: '3' });
  const a = ['cat', 'rabbit', 'cat', 'rabbit', 'cat', 'rabbit', 'cat', 'rabbit'];
  const b = ['cat', 'rabbit', 'rabbit', 'cat', 'cat', 'rabbit', 'rabbit', 'cat'];
  f.fill(a); f.click('start'); assert.deepEqual(f.snapshot().firstWork.board, a);
  f.internal.dispatch({ type: 'arrive' }); f.click('edit'); f.fill(b); f.click('collection');
  assert.deepEqual(f.snapshot().firstWork.board, a); assert.deepEqual(f.snapshot().state.board, b);
  assert.match(f.container.innerHTML, /data-period="2"/); assert.match(f.container.innerHTML, /data-period="4"/);
  f.click('save-work');
  assert.equal(f.snapshot().collection.works.length, 1);
  assert.deepEqual(f.snapshot().firstWork.board, a, 'saving a later answer must not hide the first successful answer');
  assert.deepEqual(f.snapshot().state.board, b);
  assert.match(f.container.innerHTML, /data-comparison="first"[\s\S]*data-period="2"/);
  assert.match(f.container.innerHTML, /data-comparison="current"[\s\S]*data-period="4"/);
  f.click('close-modal'); f.fill(a); f.save();
  const savedA = f.snapshot().collection.works[1];
  // Only B was the first durable save. A fresh JS module must consistently use
  // B as its recovered baseline, even when the second stored train A is opened.
  const fresh = fixture(f.storage);
  assert.deepEqual(fresh.snapshot().firstWork.board, b);
  fresh.click('collection'); fresh.click('open-work', { work: savedA.id }); fresh.click('confirm-open-work');
  assert.deepEqual(fresh.snapshot().firstWork.board, b);
  assert.deepEqual(fresh.snapshot().state.board, a);
});
test('delete asks first; cancel and confirmed delete never alter the open train', () => {
  const f = fixture(); f.click('free'); f.fill(Array(6).fill('cat')); f.save();
  const saved = f.snapshot().collection.works[0], board = f.snapshot().state.board;
  f.click('remove-work', { work: saved.id }); assert.equal(f.snapshot().collection.works.length, 1);
  f.click('collection'); assert.equal(f.snapshot().collection.works.length, 1);
  f.click('remove-work', { work: saved.id }); f.click('confirm-remove-work');
  assert.equal(f.snapshot().collection.works.length, 0); assert.deepEqual(f.snapshot().state.board, board);
});
test('write failure retains session gallery and warns without pretending permanent storage', () => {
  const f = fixture(new Map(), { writeFailure: true }); f.click('free'); f.fill(Array(6).fill('bear')); f.save();
  assert.equal(f.snapshot().collection.works.length, 1); assert.equal(f.snapshot().collectionVolatile, true);
  assert.match(f.container.innerHTML, /기기를 다시 열 때는 남지 않을 수/); assert.equal(f.storage.has(KEY), false);
  f.api.destroy(); f.api.render(f.container, {}); assert.equal(f.snapshot().collection.works.length, 1);
  assert.equal(f.snapshot().collectionVolatile, true);
});
test('unreadable, corrupt, and unknown galleries retain exact raw bytes while new works remain in session', () => {
  for (const [original, options] of [['broken{', {}], [JSON.stringify({ version: 99, works: [] }), {}], ['protected bytes', { readFailure: true }]]) {
    const f = fixture(new Map([[KEY, original]]), options); f.click('free'); f.fill(Array(6).fill('frog')); f.save();
    assert.equal(f.snapshot().collectionLocked, true); assert.equal(f.snapshot().collectionVolatile, true);
    assert.equal(f.snapshot().collection.works.length, 1); assert.equal(f.storage.get(KEY), original);
    f.api.destroy(); f.api.render(f.container, {}); assert.equal(f.snapshot().collection.works.length, 1); assert.equal(f.storage.get(KEY), original);
  }
});
test('incomplete or wrong course cannot be stored through a forged enabled button', () => {
  const f = fixture(); f.click('collection'); assert.match(f.container.innerHTML, /data-action="save-work" disabled/);
  f.click('save-work'); assert.equal(f.snapshot().collection.works.length, 0);
  f.click('close-modal'); f.fill(Array(6).fill('cat')); f.save(); assert.equal(f.snapshot().collection.works.length, 0);
});
console.log(JSON.stringify({ status: 'PASS', scope: 'model and actual handlers in controlled DOM/storage fixture; browser and device not covered', checks,
  sourceHashes: Object.fromEntries(['js/games/pattern-train-model.js', 'js/games/pattern-train.js'].map(p => [p, crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, p))).digest('hex')])) }, null, 2));
