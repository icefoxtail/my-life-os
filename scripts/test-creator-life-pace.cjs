/* Actual life-sequence module with a deterministic clock and small DOM.
 * Checks child-controlled progression and lifecycle cancellation, not pixels,
 * audible speech or physical touch. The existing legacy test covers all 24
 * handwashing permutations; it remains a required, separate regression gate. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const file = process.argv[2] || path.join(root, 'js/games/life-sequence.js');
const raw = fs.readFileSync(file, 'utf8');
const source = raw.replace(/\}\)\(\);\s*$/, `window.__lifePace = {state, MISSIONS, placeCard,
  removeCard, checkAnswer, startRound, restart, destroy, handleResize, refreshLayoutOnly};\n})();`);

function clock() {
  let now = 0, next = 0;
  const tasks = new Map();
  return {tasks, get now() { return now; },
    setTimeout(fn, ms = 0) { const id = ++next; tasks.set(id, {fn, at: now + ms}); return id; },
    clearTimeout(id) { tasks.delete(id); },
    tick(ms) {
      const end = now + ms;
      for (let guard = 0; guard < 2000; guard++) {
        const entry = [...tasks].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!entry) { now = end; return; }
        tasks.delete(entry[0]); now = entry[1].at; entry[1].fn();
      }
      throw new Error('clock did not settle');
    }
  };
}
function node(tag = 'div', attrs = {}) {
  let html = '';
  const el = {tag, attrs, dataset: {}, children: [], parentElement: null, style: {}, textContent: '',
    className: attrs.class || '', id: attrs.id || '', offsetWidth: 100, disabled: false,
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k]; },
    appendChild(child) { child.parentElement = this; this.children.push(child); return child; },
    remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(x => x !== this); },
    addEventListener(type, fn) { this['on' + type] = fn; },
    click() { this.onclick?.({target: this}); },
    matches(selector) {
      if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
      if (selector.startsWith('#')) return this.id === selector.slice(1);
      const a = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
      return a ? Object.hasOwn(this.attrs, a[1]) && (a[2] == null || this.attrs[a[1]] === a[2]) : this.tag === selector;
    },
    querySelectorAll(selector) {
      const visit = n => n.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...visit(child)]);
      return visit(this);
    },
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
    closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; },
    get innerHTML() { return html; },
    set innerHTML(value) { html = value; this.children = []; parseInto(this, value); }
  };
  for (const [k, v] of Object.entries(attrs)) if (k.startsWith('data-')) el.dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
  el.classList = {
    contains: value => el.className.split(/\s+/).includes(value),
    add(...values) { el.className = [...new Set([...el.className.split(/\s+/).filter(Boolean), ...values])].join(' '); },
    remove(...values) { el.className = el.className.split(/\s+/).filter(v => !values.includes(v)).join(' '); },
    toggle(value, on) { on ? this.add(value) : this.remove(value); }
  };
  return el;
}
function parseInto(parent, html) {
  const stack = [parent];
  for (const match of html.matchAll(/<\/?([a-z][\w-]*)\b([^>]*)>|([^<]+)/gi)) {
    if (match[3]) { stack.at(-1).textContent += match[3].trim(); continue; }
    if (match[0].startsWith('</')) {
      while (stack.length > 1) { if (stack.pop().tag === match[1]) break; }
      continue;
    }
    const attrs = Object.fromEntries([...match[2].matchAll(/([:\w-]+)(?:="([^"]*)")?/g)].map(a => [a[1], a[2] || '']));
    const child = stack.at(-1).appendChild(node(match[1], attrs));
    if (!/^(img|input|br|hr|meta|link)$/.test(match[1]) && !match[0].endsWith('/>')) stack.push(child);
  }
}
function fixture({realVoice = false} = {}) {
  const time = clock(), container = node(), head = node('head'), rewards = [], confetti = [], spoken = [];
  const speech = {active: null, cancels: 0, stops: 0};
  const window = {innerWidth: 390, innerHeight: 844,
    matchMedia: () => ({matches: window.innerWidth >= 640 && window.innerWidth > window.innerHeight}),
    addEventListener() {}, removeEventListener() {}, SihyeonPlaySettings: {getLanguage: () => 'ko'},
    speechSynthesis: {getVoices: () => [], cancel() { speech.cancels++; speech.active = null; },
      speak(utterance) { speech.active = utterance; spoken.push(utterance.text); }},
    SihyeonVoice: {play: () => Promise.resolve(false), stop() { speech.stops++; }}
  };
  const document = {head, createElement: node, getElementById: id => head.querySelector('#' + id)};
  const math = Object.create(Math); math.random = () => 0.9999;
  const context = vm.createContext({window, document, navigator: {}, console, Math: math,
    setTimeout: time.setTimeout, clearTimeout: time.clearTimeout,
    Image: class {set src(value) { this.onload?.(); }},
    SpeechSynthesisUtterance: function(text) { this.text = text; },
    fetch: async () => ({ok: true, json: async () => ({voices: {}})})});
  if (realVoice) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js/voice-engine.js'), 'utf8'), context);
    const stop = window.SihyeonVoice.stop;
    window.SihyeonVoice.stop = () => { speech.stops++; return stop(); };
  }
  vm.runInContext(source, context, {filename: file});
  const api = window.__lifePace;
  const options = {gainExp: n => rewards.push(n), fireConfetti: () => confetti.push(time.now),
    say: text => realVoice ? window.SihyeonVoice.speak(text) : spoken.push(text)};
  const reopen = () => window.SihyeonGames.lifeSequence.render(container, options);
  reopen();
  return {api, window, time, container, rewards, confetti, spoken, speech, reopen,
    get: selector => container.querySelector(selector),
    solve() { for (const step of api.state.mission.steps) api.placeCard(step.id); time.tick(280); }};
}
const cases = [];
function test(name, run) { run(); cases.push(name); }

test('verdict offers Next immediately and awards the solved arrangement once', () => {
  const f = fixture();
  for (const step of f.api.state.mission.steps) f.api.placeCard(step.id);
  f.time.tick(279);
  assert.equal(f.get('[data-life-next]'), null);
  assert.equal(f.rewards.length, 0);
  f.time.tick(1);
  assert.ok(f.get('[data-life-next]'), 'child-controlled Next must exist at the 280ms correct verdict');
  assert.ok(f.get('[data-life-replay]'));
  assert.equal(f.api.state.locked, true, 'solved slots stay protected while Next is independently available');
  assert.equal(f.api.state.combo, 1);
  assert.deepEqual(f.rewards, [12]);
  f.api.checkAnswer();
  assert.deepEqual(f.rewards, [12]);
  assert.equal(f.confetti.length, 1);
});
test('animation still completes but no amount of waiting advances without the child', () => {
  const f = fixture(); f.solve(); f.time.tick(1740);
  assert.ok(f.get('.ls-root').classList.contains('complete'));
  assert.ok(f.get('#lsScene').classList.contains('has-complete'));
  assert.equal(f.container.querySelectorAll('.ls-slot').filter(s => s.classList.contains('correct')).length, 4);
  assert.ok(f.spoken.some(text => text.includes('흐르는 물에 헹구고 수건으로 닦아요.')));
  f.time.tick(120000);
  assert.equal(f.api.state.round, 1);
  assert.equal(f.api.state.mission.id, 'wash_hands');
  assert.equal(f.time.tasks.size, 0);
});
test('early Next cancels animation and detached controls cannot skip or replay another round', () => {
  const f = fixture(); f.solve();
  const next = f.get('[data-life-next]'), replay = f.get('[data-life-replay]');
  const oldTimers = [...f.time.tasks.values()].map(t => t.fn);
  next.click();
  assert.equal(f.api.state.round, 2);
  const stops = f.speech.stops, said = f.spoken.length;
  next.click(); replay.click(); oldTimers.forEach(fn => fn()); f.time.tick(30000);
  assert.equal(f.api.state.round, 2);
  assert.equal(f.speech.stops, stops);
  assert.equal(f.spoken.length, said);
  assert.ok(f.api.state.placed.every(card => card === null));
  assert.equal(f.get('.ls-root').classList.contains('complete'), false);
  assert.deepEqual(f.rewards, [12]);
});
test('Replay restarts only the existing sequence and never duplicates combo or rewards', () => {
  const f = fixture(); f.solve(); f.time.tick(1740);
  f.get('[data-life-replay]').click();
  const abandoned = [...f.time.tasks.values()].map(t => t.fn);
  f.get('[data-life-replay]').click();
  abandoned.forEach(fn => fn());
  assert.equal(f.get('.ls-root').classList.contains('complete'), false);
  f.time.tick(1740);
  assert.ok(f.get('.ls-root').classList.contains('complete'));
  assert.equal(f.api.state.combo, 1);
  assert.deepEqual(f.rewards, [12]);
  assert.equal(f.confetti.length, 1);
  f.get('[data-life-next]').click(); assert.equal(f.api.state.round, 2);
});
test('wrong positions recover at the original 1150ms; correct water/towel stay in place', () => {
  const f = fixture();
  for (const id of ['water', 'rinse', 'soap', 'towel']) f.api.placeCard(id);
  f.time.tick(280 + 1149); assert.equal(f.api.state.locked, true);
  assert.equal(f.get('[data-life-next]'), null);
  f.time.tick(1); assert.equal(f.api.state.locked, false);
  assert.equal(JSON.stringify(f.api.state.placed.map(card => card?.id || null)), '["water",null,null,"towel"]');
  assert.equal(f.api.state.mission.steps[2].id, 'rinse');
  assert.equal(f.rewards.length, 0);
});
test('rotation preserves solved slots, accessible actions and the running animation', () => {
  const f = fixture(); f.solve(); const id = f.api.state.roundId;
  f.window.innerWidth = 844; f.window.innerHeight = 390;
  f.api.handleResize(); f.time.tick(120);
  assert.equal(f.api.state.roundId, id);
  assert.equal(f.api.state.layoutMode, 'landscape');
  assert.equal(f.api.state.placed.filter(Boolean).length, 4);
  assert.ok(f.get('[data-life-next]'));
  f.time.tick(1740); assert.ok(f.get('.ls-root').classList.contains('complete'));
});
test('destroy and a new mount reject late verdict/animation callbacks', () => {
  for (const solved of [false, true]) {
    const f = fixture();
    for (const step of f.api.state.mission.steps) f.api.placeCard(step.id);
    if (solved) f.time.tick(280);
    const oldTimers = [...f.time.tasks.values()].map(t => t.fn);
    const before = f.rewards.length;
    f.api.destroy(); assert.equal(f.time.tasks.size, 0);
    f.reopen(); oldTimers.forEach(fn => fn()); f.time.tick(30000);
    assert.equal(f.api.state.round, 1);
    assert.equal(f.api.state.combo, 0);
    assert.equal(f.api.state.roundAnswered, false);
    assert.equal(f.rewards.length, before);
    assert.ok(f.api.state.placed.every(card => card === null));
  }
});
test('six child-chosen advances complete once; the last result waits for Finish', () => {
  const f = fixture(); let lastNext;
  for (let round = 1; round <= 6; round++) {
    f.solve(); lastNext = f.get('[data-life-next]');
    assert.equal(f.api.state.round, round);
    if (round === 6) {
      assert.ok(lastNext.textContent.includes('마침'));
      f.time.tick(60000);
      assert.equal(f.get('.ls-success'), null);
    }
    lastNext.click(); lastNext.click();
  }
  assert.ok(f.get('.ls-success'));
  assert.deepEqual(f.rewards, [12, 14, 16, 16, 16, 16, 30]);
  assert.equal(f.confetti.length, 7);
  lastNext.click(); f.time.tick(60000);
  assert.equal(f.rewards.length, 7);
  f.get('[data-restart]').click(); lastNext.click();
  assert.equal(f.api.state.round, 1); assert.equal(f.api.state.combo, 0);
});
test('actual shared engine stops the prior step immediately when Next is chosen', () => {
  const f = fixture({realVoice: true}); f.solve();
  const oldVoice = f.speech.active;
  assert.ok(oldVoice?.text.includes('손'));
  const generation = f.window.SihyeonVoice.debugStatus().requestGeneration;
  const before = f.speech.cancels;
  const next = f.get('[data-life-next]'); next.click();
  assert.equal(f.speech.active, null);
  assert.ok(f.speech.cancels > before);
  assert.ok(f.window.SihyeonVoice.debugStatus().requestGeneration > generation);
  oldVoice.onend(); oldVoice.onerror();
  const said = f.spoken.length, stops = f.speech.stops;
  f.time.tick(30000); next.click();
  assert.equal(f.spoken.length, said);
  assert.equal(f.speech.stops, stops);
  assert.equal(f.api.state.mission.id, 'brush_teeth');
});
test('an external round reward error cannot hide Next or stop the original animation', () => {
  for (const callback of ['gainExp', 'fireConfetti']) {
    const f = fixture(); let calls = 0;
    f.api.state.options[callback] = () => { calls++; throw new Error('external storage/effect failure'); };
    f.solve();
    assert.ok(f.get('[data-life-next]'));
    assert.ok(f.get('[data-life-replay]'));
    f.api.checkAnswer();
    assert.equal(calls, 1, 'failed external reward is not retried or duplicated');
    f.time.tick(1740); assert.ok(f.get('.ls-root').classList.contains('complete'));
    f.get('[data-life-next]').click(); assert.equal(f.api.state.round, 2);
  }
});
test('external completion reward errors cannot prevent Finish and its result controls', () => {
  const f = fixture(); let attempted = 0;
  f.api.state.options.gainExp = () => { attempted++; throw new Error('storage quota failure'); };
  f.api.state.options.fireConfetti = () => { throw new Error('effect unavailable'); };
  let last;
  for (let round = 1; round <= 6; round++) {
    f.solve(); last = f.get('[data-life-next]'); last.click();
  }
  assert.ok(f.get('.ls-success'));
  assert.ok(f.get('[data-home]')); assert.ok(f.get('[data-restart]'));
  assert.equal(attempted, 7);
  last.click(); assert.equal(attempted, 7);
});
console.log(JSON.stringify({status: 'PASS', cases: cases.length, scenarios: cases,
  sourceSha256: crypto.createHash('sha256').update(raw).digest('hex'),
  limitation: 'Synthetic DOM/device; run required legacy-inputs and native browser checks separately'}, null, 2));
