/* Independent controlled-VM checks of production UI closures.
 * This is not a browser renderer or physical pointer/device test. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const model = require('../js/games/pattern-train-model.js');
const oracle = require('./qa-pattern-train-independent.cjs');
const source = fs.readFileSync(path.resolve(__dirname, '../js/games/pattern-train.js'), 'utf8');
const integrationSource = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
const marker = '  window.SihyeonGames.patternTrain = {';
assert(source.includes(marker), 'UI export marker changed; independent access needs review');
const instrumented = source.replace(marker, '  window.__ptIndependent = { view, read, write, loadPrefs, loadTask, loadCourse, loadFree, dispatch, speak, start, beginTrip, cancelDrag, pointerDown, pointerMove, pointerUp, otherPointerDown, keyDown, onClick, changeLength, guideHtml };\n' + marker);
const copy = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const report = { scope: 'Independent controlled Node VM of actual UI closures and integration functions; no browser layout, real storage quota, audio listening or device PASS', sourceSha256: crypto.createHash('sha256').update(source).digest('hex'), integrationSourceSha256: crypto.createHash('sha256').update(integrationSource).digest('hex'), status: 'PENDING', checks: [], assertions: 0 };
function eq(actual, expected, message) { report.assertions++; assert.deepEqual(copy(actual), copy(expected), message); }
function ok(value, message) { report.assertions++; assert.ok(value, message); }
async function check(name, run) { try { const detail = await run(); report.checks.push({ name, status: 'PASS', detail }); } catch (error) { report.checks.push({ name, status: 'FAIL', error: error.message, stack: error.stack }); } }
function fixture({ recommendedAge = 4, initial = {}, readThrows = false, writeThrows = false, modelAvailable = true, voice = () => Promise.resolve(true) } = {}) {
  const stored = new Map(Object.entries(initial)), timers = new Map(), ghosts = new Set(), windowListeners = new Map(), documentListeners = new Map();
  let id = 0, now = 1000, hit = null, q, activeAge = recommendedAge, saveReads = 0, saveWrites = 0, voiceCalls = 0, confetti = 0, homes = 0;
  const elements = [];
  function eventHost(target, registry) {
    const once = new WeakSet();
    target.addEventListener = (name, fn, options) => { if (!registry.has(name)) registry.set(name, new Set()); registry.get(name).add(fn); if (options?.once) once.add(fn); };
    target.removeEventListener = (name, fn) => registry.get(name)?.delete(fn);
    target.fireControlled = (name, event = {}) => [...(registry.get(name) || [])].forEach(fn => { if (once.has(fn)) registry.get(name).delete(fn); fn(event); });
    return target;
  }
  function element(dataset = {}, classes = []) {
    const names = new Set(classes), registry = new Map();
    const el = eventHost({ dataset, disabled: false, hidden: false, scrollLeft: 0, clientWidth: 360, scrollWidth: 1600, innerHTML: '', textContent: '', style: { setProperty(name, value) { this[name] = value; } }, owner: null,
      classList: { add: name => names.add(name), remove: name => names.delete(name), contains: name => names.has(name), toggle(name, value) { const enabled = value === undefined ? !names.has(name) : value; enabled ? names.add(name) : names.delete(name); } },
      setAttribute(name, value) { this[name] = value; }, getAttribute(name) { return this[name]; },
      remove() { ghosts.delete(this); }, focus() { document.activeElement = this; },
      getBoundingClientRect: () => ({ left: 0, top: 0, right: 360, bottom: 220, width: 360, height: 220 }),
      scrollBy({ left }) { this.scrollLeft += left; },
      closest(selector) {
        if (selector === '.game-play-screen') return null;
        if (selector === '.pt-dialog') return this.inDialog ? this : null;
        if (selector === '[data-action]') return this.dataset.action ? this : null;
        if (selector.includes('[data-action="seat"]')) return ['seat', 'seed'].includes(this.dataset.action) || names.has('pt-palette') ? this : null;
        return null;
      }
    }, registry); elements.push(el); return el;
  }
  const frame = element(), row = element(), note = element(), dragNote = element(), dialogButton = element(), loadErrorHome = element();
  const coaches = Array.from({ length: 12 }, () => element());
  const container = element(); container.owner = container;
  elements.forEach(el => { el.owner = container; });
  container.contains = el => !!el && el.owner === container;
  let captured = null;
  container.setPointerCapture = pointerId => { captured = pointerId; };
  container.hasPointerCapture = pointerId => captured === pointerId;
  container.releasePointerCapture = pointerId => { if (captured === pointerId) { captured = null; q?.view.handlers?.cancel({ pointerId, type: 'lostpointercapture' }); } };
  container.querySelector = selector => {
    if (selector === '.pt-train-scroll') return frame;
    if (selector === '.pt-train-row') return row;
    if (selector === '.pt-voice-note') return note;
    if (selector === '.pt-drag-announcement') return dragNote;
    if (selector === '.pt-dialog button') return dialogButton;
    if (selector === '[data-action="load-error-home"]') return loadErrorHome;
    if (selector.startsWith('[data-coach=')) return coaches[Number(selector.match(/"(\d+)"/)?.[1])];
    return null;
  };
  container.querySelectorAll = selector => {
    if (selector === '.pt-coach') return coaches.slice(0, q?.view.state?.size || 0);
    if (selector === '.pt-drop-target') return elements.filter(el => el.classList.contains('pt-drop-target'));
    if (selector.startsWith('.pt-dialog button')) return [dialogButton];
    const action = selector.match(/^\[data-action="(.+)"\]$/)?.[1];
    return action ? elements.filter(el => el.dataset.action === action) : [];
  };
  const document = eventHost({ activeElement: null, hidden: false, body: { appendChild: el => ghosts.add(el) }, head: { appendChild() {} }, getElementById: () => ({}), createElement: () => { const el = element(); el.owner = container; return el; }, elementFromPoint: () => hit }, documentListeners);
  const window = eventHost({ SihyeonPatternTrainModel: modelAvailable ? model : undefined, SihyeonGames: {}, SihyeonVoice: { stop() {} }, matchMedia: () => ({ matches: false }),
    setTimeout(fn, delay) { const timerId = ++id; timers.set(timerId, { fn: () => { timers.delete(timerId); fn(); }, delay }); return timerId; }, clearTimeout: timerId => timers.delete(timerId),
    SihyeonPlaySettings: { getAge: () => activeAge, setAge(value) { activeAge = value; windowListeners.get('sihyeon-settings-change')?.forEach(fn => fn()); } }
  }, windowListeners);
  const localStorage = { getItem(key) { saveReads++; if (readThrows) throw new Error('Controlled storage read denial'); return stored.get(key) || null; }, setItem(key, value) { saveWrites++; if (writeThrows) { const error = new Error('Controlled readable-stale-storage write rejection'); error.name = 'QuotaExceededError'; throw error; } stored.set(key, value); } };
  const FakeDate = class extends Date { static now() { return now; } };
  vm.runInNewContext(instrumented, { window, document, localStorage, Date: FakeDate, clearTimeout: window.clearTimeout, console }, { timeout: 2000 });
  q = window.__ptIndependent;
  const api = window.SihyeonGames.patternTrain;
  const options = { say(text) { voiceCalls++; return voice(text); }, fireConfetti() { confetti++; }, closeToParkHome() { homes++; } };
  api.render(container, options);
  function button(action, dataset = {}, inDialog = false) { const el = element({ action, ...dataset }); el.owner = container; el.inDialog = inDialog; return el; }
  function event(target, overrides = {}) { return { target, pointerId: 1, isPrimary: true, button: 0, clientX: 40, clientY: 90, cancelable: true, preventDefault() {}, ...overrides }; }
  const click = (action, dataset = {}, inDialog = false) => q.onClick(event(button(action, dataset, inDialog)));
  const down = pointer => { q.otherPointerDown(pointer); q.pointerDown(pointer); };
  const advance = amount => { now += amount; };
  const runArrival = () => { const selected = [...timers].find(([, t]) => t.delay >= 4000 && t.delay < 9000); assert(selected, 'trip arrival timer missing'); timers.delete(selected[0]); selected[1].fn(); };
  return { q, api, window, document, container, frame, row, note, loadErrorHome, ghosts, timers, stored, button, event, click, down, advance, runArrival, hit: value => { hit = value; }, options,
    listeners: () => [...windowListeners.values(), ...documentListeners.values()].reduce((n, set) => n + set.size, 0),
    counts: () => ({ reads: saveReads, writes: saveWrites, voiceCalls, confetti, homes }), render: () => api.render(container, options) };
}
async function flush() { await Promise.resolve(); await Promise.resolve(); }

(async () => {
  await check('actual index launcher cleans prior games and keeps an exit when the model or UI module is missing', () => {
    const names = ['cleanupActiveGame', 'openGameShell', 'openPatternTrainGame', 'gameOptions', 'renderGameLoadError'];
    const functions = names.map(name => { const match = integrationSource.match(new RegExp('^function ' + name + '\\([^\\n]*\\)\\{[\\s\\S]*?^\\}', 'm')); ok(match, name + ': actual integration function missing'); return match[0]; }).join('\n');
    for (const missing of [null, 'model', 'ui']) {
      const calls = [], back = { removed: false, remove() { this.removed = true; } }, target = { innerHTML: '', parentElement: { querySelector: () => back } }, root = { innerHTML: '' };
      const games = {};
      const expectedCleanup = ['vehicleMemory', 'numberPostOffice', 'numberCount', 'parkingLot', 'artZone', 'megaDispatch', 'constructionSite', 'carGarage'];
      for (const game of expectedCleanup) games[game] = { destroy: () => calls.push('destroy:' + game) };
      let rendering = null;
      if (missing !== 'ui') { games.patternTrain = { destroy: () => calls.push('destroy:patternTrain'), render: (el, options) => { rendering = { el, options }; } }; expectedCleanup.push('patternTrain'); }
      const context = { window: { SihyeonPatternTrainModel: missing === 'model' ? undefined : model, SihyeonGames: games, SihyeonPlaySettings: { getAge: () => 4 }, SihyeonZones: { voiceZone: { destroy: () => calls.push('voice:destroy') }, karaokeZone: { destroy: () => calls.push('karaoke:destroy') } } },
        document: { getElementById: id => id === 'sihyeonPlayOS' ? root : target }, cleanupDetachedPlayLayers: () => calls.push('detached:cleanup'), closeGarageHandlers: () => calls.push('garage:cleanup'), startGameTimer: () => calls.push('timer:start'), escapeHtml: text => text,
        speakGuide() {}, fireConfetti() {}, gainExp() {}, playDynamicGuide() {}, returnToZoneLand: zone => calls.push('return:' + zone) };
      vm.runInNewContext('let activeGameZoneId;\n' + functions + '\nopenPatternTrainGame();', context, { timeout: 1000 });
      for (const game of expectedCleanup) eq(calls.filter(call => call === 'destroy:' + game).length, 1, game + ': old game must be destroyed exactly once');
      eq(calls.filter(call => call === 'detached:cleanup').length, 1); eq(calls.filter(call => call === 'garage:cleanup').length, 1);
      ok(root.innerHTML.includes('game-back-floating'), 'shell contains a fallback exit');
      if (missing) { eq(rendering, null); eq(back.removed, false); ok(target.innerHTML.includes('불러오지 못했어요')); }
      else { ok(rendering?.el === target); eq(back.removed, true); eq(rendering.options.ageMode, 4); rendering.options.closeToParkHome(); ok(calls.includes('return:numbers')); }
    }
    return { cases: ['normal', 'model module missing', 'UI module missing'], actualIndexFunctions: names, browserRendering: false };
  });
  await check('standalone model-missing view provides a native exit without reading or overwriting saved work', () => {
    const saved = model.reduce(model.createState('a4-first'), { type: 'place', index: 5, token: 'rabbit' });
    const key = 'sihyeon-pattern-train-v1:board:a4-first', serialized = JSON.stringify(saved);
    const f = fixture({ modelAvailable: false, initial: { [key]: serialized } });
    eq(f.api.getSnapshot(), null); ok(f.container.innerHTML.includes('data-action="load-error-home"'));
    eq(f.counts().reads, 0); eq(f.counts().writes, 0); eq(f.stored.get(key), serialized); eq(f.listeners(), 0); eq(f.timers.size, 0);
    f.loadErrorHome.fireControlled('click'); f.loadErrorHome.fireControlled('click');
    eq(f.counts().homes, 1); eq(f.q.view.container, null); eq(f.stored.get(key), serialized);
    f.window.SihyeonPatternTrainModel = model; f.render(); eq(f.q.view.state.taskId, 'a4-first'); eq(f.q.view.state.board[5], 'rabbit');
    return { nativeFallbackExit: true, duplicateClickCount: 1, savedWorkUntouchedByFailure: true, restoredAfterModuleAvailable: true };
  });
  await check('all four five-stop sessions run through production UI click transitions', () => {
    const f = fixture(); let trips = 0;
    for (const level of [4, 5, 6, 7]) {
      f.q.loadCourse(level, 0, true);
      for (let index = 0; index < 5; index++) {
        const task = f.q.view.task; eq(task.id, model.getTasks(level)[index].id);
        let board;
        if (task.kind === 'copy' || task.kind === 'alternative') {
          const seed = task.kind === 'copy' ? ['red', 'blue', 'red'] : ['red', 'blue', 'blue', 'red'];
          seed.forEach((token, position) => { f.click('select', { token }); f.click('seed', { seed: String(position) }); });
          f.click('copy'); board = Array.from({ length: task.size }, (_, i) => seed[i % seed.length]);
        } else if (task.kind === 'unit') { board = task.clues.slice(); f.click('period', { period: String(oracle.leastPeriod(board)) }); }
        else {
          const unit = task.kind === 'translate' ? task.reference.map(token => task.mapping[token]) : task.unit;
          board = unit ? Array.from({ length: task.size }, (_, i) => unit[i % unit.length]) : oracle.possibleCompletions({ clues: task.clues, alphabet: task.palette, periods: task.allowedPeriods })[0].sequence;
          board.forEach((token, position) => { if (task.clues[position] === null) { f.click('select', { token }); f.click('seat', { index: String(position), token: '' }); } });
        }
        eq(f.q.view.state.board, board, task.id + ': click editing did not build expected train');
        f.click('start'); eq(f.q.view.state.phase, 'RUNNING');
        f.click('start'); eq(f.q.view.state.departures, 1, 'duplicate start counted twice');
        f.runArrival(); eq(f.q.view.state.phase, 'ARRIVED'); trips++;
        f.click('next'); if (index === 4) eq(f.q.view.modal, 'complete');
      }
    }
    eq(trips, 20); eq(f.counts().confetti, 20); return { sessions: 4, trips, input: 'controlled onClick calls, no browser' };
  });
  await check('actual generated guide HTML exposes the rule used by model judgement', () => {
    const f = fixture();
    for (const task of model.TASKS) {
      f.q.loadTask(task, true); const html = f.q.guideHtml();
      if (task.kind === 'translate') { ok(html.includes('그림 대응')); for (const [from, to] of Object.entries(task.mapping)) ok(html.includes(model.TOKENS[from].name + ' 대신 ' + model.TOKENS[to].name)); }
      else if (task.showUnit) ok(html.includes('되풀이할 묶음 ' + task.unit.map(token => model.TOKENS[token].name).join(', ')));
      else if (task.kind === 'ambiguous') for (const period of task.allowedPeriods) ok(html.includes(period + '칸'));
      else if (task.seedSize) eq((html.match(/data-action="seed"/g) || []).length, task.seedSize);
    }
    ok(!source.includes('<img'), 'this workshop should have no required external bitmap asset');
    return { checkedTasks: 20, scope: 'generated HTML semantics, not visual placement' };
  });
  await check('arrival leaves challenge navigation enabled and preserves the completed train after a detour', () => {
    const f = fixture();
    const challengeTag = () => f.q.guideHtml().match(/<button\b[^>]*data-action="challenge"[^>]*>/)?.[0];
    ok(challengeTag()); ok(!/\sdisabled(?:\s|>)/.test(challengeTag()), 'building challenge button must be enabled');
    f.click('select', { token: 'rabbit' }); f.click('seat', { index: '5', token: '' }); f.click('start');
    eq(f.q.view.state.phase, 'RUNNING'); ok(/\sdisabled(?:\s|>)/.test(challengeTag()), 'running trip must lock challenge navigation');
    f.click('challenge'); eq(f.q.view.modal, null, 'programmatic challenge click must also be blocked while running');
    f.runArrival(); eq(f.q.view.state.phase, 'ARRIVED');
    ok(!/\sdisabled(?:\s|>)/.test(challengeTag()), 'arrived challenge button must be enabled in the generated HTML');
    const completed = copy(f.q.view.state.board), departures = f.q.view.state.departures;
    f.click('challenge'); eq(f.q.view.modal, 'challenge'); f.click('level', { level: '5' }, true);
    eq(f.q.view.state.taskId, 'a5-aab'); eq(f.q.view.state.phase, 'BUILDING');
    f.click('challenge'); f.click('level', { level: '4' }, true);
    eq(f.q.view.state.taskId, 'a4-first'); eq(f.q.view.state.board, completed); eq(f.q.view.state.phase, 'ARRIVED');
    eq(f.q.view.state.departures, departures); ok(!/\sdisabled(?:\s|>)/.test(challengeTag()));
    f.click('edit'); eq(f.q.view.state.phase, 'BUILDING'); eq(f.q.view.state.board, completed);
    return { originatingFinding: 'root real-browser review', phasesChecked: ['BUILDING', 'RUNNING', 'ARRIVED'], completedBoardPreserved: true };
  });
  await check('mistake, replacement, undo, removal, explicit restart and return home', () => {
    const f = fixture(); f.click('select', { token: 'cat' }); f.click('seat', { index: '5', token: '' }); f.click('start');
    eq(f.q.view.state.phase, 'BUILDING'); eq(f.q.view.state.board[5], 'cat');
    f.click('select', { token: 'rabbit' }); f.click('seat', { index: '5', token: 'cat' }); eq(f.q.view.state.board[5], 'rabbit');
    f.click('remove', { index: '5' }); eq(f.q.view.state.board[5], null); f.click('undo'); eq(f.q.view.state.board[5], 'rabbit');
    f.click('restart'); eq(f.q.view.modal, 'restart'); eq(f.q.view.state.board[5], 'rabbit');
    f.click('close-modal', {}, true); eq(f.q.view.state.board[5], 'rabbit');
    f.click('restart'); f.click('confirm-reset', {}, true); eq(f.q.view.state.board[5], null);
    f.click('select', { token: 'rabbit' }); f.click('seat', { index: '5', token: '' }); f.click('home'); eq(f.counts().homes, 1); eq(f.api.getSnapshot(), null);
    f.render(); eq(f.q.view.state.board[5], 'rabbit'); return { retainedWrongAnswer: true, homePreservedBoard: true, resetRequiredExplicitConfirmation: true };
  });
  await check('palette and carriage drag success, outside drop, cancel, capture loss and secondary finger', () => {
    const f = fixture(); const original = copy(f.q.view.state.board);
    const palette = f.button('select', { token: 'rabbit' }), seat = f.button('seat', { index: '5', token: '' });
    function dragStart() { f.down(f.event(palette)); f.q.pointerMove(f.event(palette, { clientX: 100 })); eq(f.ghosts.size, 1); }
    dragStart(); f.hit(null); f.q.pointerUp(f.event(palette, { clientX: -10 })); eq(f.q.view.state.board, original); eq(f.ghosts.size, 0);
    f.advance(800); dragStart(); f.q.view.handlers.cancel({ pointerId: 1 }); eq(f.q.view.state.board, original); eq(f.ghosts.size, 0);
    f.advance(800); dragStart(); f.q.otherPointerDown(f.event(palette, { pointerId: 2, isPrimary: false })); eq(f.ghosts.size, 0); f.hit(seat); f.q.pointerUp(f.event(palette)); eq(f.q.view.state.board, original);
    f.advance(800); dragStart(); f.container.releasePointerCapture(1); eq(f.ghosts.size, 0); eq(f.q.view.state.board, original);
    f.advance(800); dragStart(); f.hit(seat); f.q.pointerUp(f.event(palette)); eq(f.q.view.state.board[5], 'rabbit'); eq(f.q.view.state.selected, 'rabbit'); const history = f.q.view.state.history.length;
    f.q.pointerUp(f.event(palette)); eq(f.q.view.state.history.length, history, 'duplicate pointerup cannot place twice');
    f.advance(800); f.click('select', { token: 'cat' }); dragStart(); f.hit(seat); f.q.pointerUp(f.event(palette));
    eq(f.q.view.state.selected, 'rabbit'); eq(f.q.view.state.history.length, history, 'dropping the same token only changes selection');
    ok(/<button\b[^>]*data-action="select"[^>]*data-token="rabbit"[^>]*aria-pressed="true"/.test(f.container.innerHTML), 'same-token drop must redraw the selected palette mark');
    f.advance(800); const occupied = f.button('seat', { index: '5', token: 'rabbit' }); f.down(f.event(occupied)); f.q.pointerMove(f.event(occupied, { clientX: 120 }));
    const tray = f.button('noop'); tray.classList.add('pt-palette'); f.hit(tray); f.q.pointerUp(f.event(occupied)); eq(f.q.view.state.board[5], null);
    return { cases: ['outside', 'pointercancel', 'secondary pointer', 'lost capture', 'successful placement', 'duplicate pointerup', 'return to palette'], physicalTouch: false };
  });
  await check('long second-finger hold cannot create a delayed click after gesture cancellation', () => {
    const f = fixture(); f.q.loadCourse(4, 1, true);
    f.q.dispatch({ type: 'place', index: 3, token: 'red' }); f.click('select', { token: 'blue' });
    const occupied = f.button('seat', { index: '3', token: 'red' });
    f.down(f.event(occupied)); f.q.pointerMove(f.event(occupied, { clientX: 140 }));
    f.q.otherPointerDown(f.event(occupied, { pointerId: 2, isPrimary: false })); eq(f.ghosts.size, 0);
    f.advance(1600); f.q.pointerUp(f.event(occupied, { pointerId: 2, isPrimary: false })); f.q.pointerUp(f.event(occupied));
    f.q.onClick(f.event(occupied)); eq(f.q.view.state.board[3], 'red', 'cancelled held carriage was replaced by a delayed native click');
    f.advance(800); f.q.onClick(f.event(occupied)); eq(f.q.view.state.board[3], 'blue', 'new deliberate tap must work after cancellation settles');
    return { secondaryHoldMs: 1600, boardPreserved: true, physicalTouch: false };
  });
  await check('resize, orientation, Escape and teardown cancel drag without changing a board', () => {
    for (const stop of ['resize', 'Escape', 'destroy']) {
      const f = fixture(), palette = f.button('select', { token: 'rabbit' }), initial = copy(f.q.view.state.board);
      f.down(f.event(palette)); f.q.pointerMove(f.event(palette, { clientX: 140 }));
      if (stop === 'resize') f.q.view.handlers.resize();
      if (stop === 'Escape') f.q.keyDown({ key: 'Escape', preventDefault() {} });
      if (stop === 'destroy') f.api.destroy();
      eq(f.ghosts.size, 0);
      if (stop === 'destroy') { eq(f.listeners(), 0); eq(f.timers.size, 0); f.render(); }
      eq(f.q.view.state.board, initial);
    }
    return { layoutResize: 'handler only; visual orientation tested separately' };
  });
  await check('long held drag cancellation by resize, blur or Escape preserves the source carriage', () => {
    for (const cause of ['resize', 'blur', 'Escape']) {
      const f = fixture(); f.q.loadCourse(4, 1, true); f.q.dispatch({ type: 'place', index: 3, token: 'red' }); f.click('select', { token: 'blue' });
      const occupied = f.button('seat', { index: '3', token: 'red' }); f.down(f.event(occupied)); f.q.pointerMove(f.event(occupied, { clientX: 150 }));
      if (cause === 'Escape') f.q.keyDown({ key: 'Escape', preventDefault() {} }); else f.q.view.handlers[cause]();
      eq(f.ghosts.size, 0); f.advance(1600); f.q.pointerUp(f.event(occupied)); f.q.onClick(f.event(occupied));
      eq(f.q.view.state.board[3], 'red', cause + ': late click changed cancelled carriage');
      f.advance(800); f.q.onClick(f.event(occupied)); eq(f.q.view.state.board[3], 'blue', cause + ': intentional later tap is still available');
    }
    return { cancellationCauses: 3, heldMs: 1600, physicalTouch: false };
  });
  await check('readable old storage plus rejected writes keeps newest board across switching and reopening', () => {
    const old = model.reduce(model.createState('a4-first'), { type: 'place', index: 5, token: 'cat' }); const key = 'sihyeon-pattern-train-v1:board:a4-first', durable = JSON.stringify(old);
    const f = fixture({ initial: { [key]: durable }, writeThrows: true }); eq(f.q.view.state.board[5], 'cat');
    f.q.dispatch({ type: 'place', index: 5, token: 'rabbit' }); eq(f.q.view.saveFailed, true); eq(f.stored.get(key), durable);
    f.q.loadCourse(6, 0, false); f.q.loadCourse(4, 0, false); eq(f.q.view.state.board[5], 'rabbit');
    f.api.destroy(); f.render(); eq(f.q.view.state.board[5], 'rabbit');
    const detached = f.q.read('board:a4-first'); detached.board[5] = null; eq(f.q.read('board:a4-first').board[5], 'rabbit');
    return { ...f.counts(), durableStillOld: true, sameLoadedPageMemoryPreserved: true };
  });
  await check('fresh page context restores committed progress and safely rejects corrupt storage', () => {
    const f = fixture(); f.q.dispatch({ type: 'place', index: 5, token: 'rabbit' });
    const fresh = fixture({ initial: Object.fromEntries(f.stored) }); eq(fresh.q.view.state.board[5], 'rabbit');
    const malformed = fixture({ initial: { 'sihyeon-pattern-train-v1:board:a4-first': '{broken-json' } }); eq(malformed.q.view.state.board[5], null); eq(malformed.q.view.saveFailed, true);
    const denied = fixture({ readThrows: true }); eq(denied.q.view.state.phase, 'BUILDING'); eq(denied.q.view.saveFailed, true);
    const wrong = { ...model.createState(model.createFreeTask('animal', 8)), size: 4.5 };
    const hostile = fixture({ initial: { 'sihyeon-pattern-train-v1:preferences': JSON.stringify({ version: 1, mode: 'free', freeTheme: 'animal' }), 'sihyeon-pattern-train-v1:board:free-animal': JSON.stringify(wrong) } });
    eq(hostile.q.view.state.free, true); eq(hostile.q.view.state.size, 6);
    return { freshContextRestore: true, malformedAndDeniedReads: 'recover editable board' };
  });
  await check('interrupted trip, late arrival and repeated render cannot complete another task', () => {
    const f = fixture(); f.q.dispatch({ type: 'place', index: 5, token: 'rabbit' }); f.click('start');
    const late = [...f.timers.values()].filter(t => t.delay >= 4000 && t.delay < 9000).map(t => t.fn); eq(late.length, 1);
    f.document.hidden = true; f.q.view.handlers.visibility(); eq(f.q.view.state.phase, 'BUILDING');
    late.forEach(fn => fn()); eq(f.q.view.state.phase, 'BUILDING'); eq(f.counts().confetti, 0);
    f.q.loadCourse(5, 0, true); late.forEach(fn => fn()); eq(f.q.view.state.taskId, 'a5-aab'); eq(f.q.view.state.phase, 'BUILDING');
    f.api.destroy(); eq(f.listeners(), 0); eq(f.timers.size, 0); f.render(); const expected = f.q.view.state.taskId;
    late.forEach(fn => fn()); eq(f.q.view.state.taskId, expected); eq(f.q.view.state.phase, 'BUILDING');
    const listeners = f.listeners(); f.render(); eq(f.listeners(), listeners, 'render must not double listeners');
    return { oldTripCallbacksIgnored: true, duplicateListeners: false };
  });
  await check('voice rejection, throw and stalled speech use visual fallback; mute and late rejection are safe', async () => {
    for (const voice of [() => Promise.reject(new Error('no audio')), () => { throw new Error('tts throw'); }, () => undefined]) {
      const f = fixture({ voice }); f.q.speak('친구를 태워 줘'); await flush(); eq(f.q.view.voiceFailed, true); eq(f.note.hidden, false); eq(f.q.view.state.phase, 'BUILDING');
      const before = f.counts().voiceCalls; f.click('mute'); f.q.speak('조용히'); eq(f.counts().voiceCalls, before);
    }
    const stalled = fixture({ voice: () => new Promise(() => {}) }); stalled.q.speak('기다리는 음성');
    [...stalled.timers.values()].filter(t => t.delay === 10000).forEach(t => t.fn()); eq(stalled.q.view.voiceFailed, true);
    let reject; const late = fixture({ voice: () => new Promise((resolve, rejection) => { reject = rejection; }) }); late.q.speak('이전 안내'); late.api.destroy(); late.render(); reject(new Error('old request')); await flush(); eq(late.q.view.voiceFailed, false);
    return { audioHeard: false, controlledFailureModes: 5 };
  });
  await check('free board, theme switching and challenge independence preserve children choices', () => {
    const f = fixture(); f.click('free'); eq(f.q.view.state.free, true); f.q.dispatch({ type: 'place', index: 0, token: 'cat' });
    f.click('longer'); eq(f.q.view.state.size, 7); eq(f.q.view.state.board[0], 'cat'); f.click('theme', { theme: 'shape' }); eq(f.q.view.state.theme, 'shape');
    f.click('theme', { theme: 'animal' }); eq(f.q.view.state.size, 7); eq(f.q.view.state.board[0], 'cat');
    f.click('challenge'); f.click('level', { level: '7' }, true); eq(f.q.view.age, 4); eq(f.q.view.level, 7);
    f.click('age', { age: '5' }); eq(f.q.view.age, 5); eq(f.q.view.level, 5);
    f.click('age', { age: '4' }); eq(f.q.view.level, 7, 'higher challenge belongs to 4yo profile without age locking');
    return { ageFourMayPlaySeven: true, freeWorkPreservedAcrossThemes: true };
  });
  report.status = report.checks.every(item => item.status === 'PASS') ? 'PASS' : 'FAIL';
  const flag = process.argv.indexOf('--report'); if (flag >= 0) fs.writeFileSync(process.argv[flag + 1], JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2)); if (report.status !== 'PASS') process.exitCode = 1;
})();
