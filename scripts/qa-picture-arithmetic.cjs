/* Production UI in a controlled DOM/sequence fixture. This does not claim browser layout or audible speech. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const shared = process.env.SIHYEON_SHARED_DIR ? path.resolve(process.env.SIHYEON_SHARED_DIR) : root;
const model = require(path.join(shared, 'js/games/quantity-play-model.js'));
const catalogSource = fs.readFileSync(path.join(shared, 'js/play-objects.js'), 'utf8');
const uiSource = fs.readFileSync(path.join(root, 'js/games/picture-arithmetic.js'), 'utf8');
const SAVE_KEY = 'sihyeon-picture-arithmetic-v1';
const defaults = { version: 1, mode: 'add', a: 9, b: 6, aId: 'korean_police_car', bId: 'pump_engine', total: 15, groups: 3, shareId: 'apple', activeTerm: 'a', style: 'native', muted: false };
const copy = value => JSON.parse(JSON.stringify(value));
let assertions = 0;
function eq(actual, expected, message) { assertions++; assert.deepEqual(copy(actual), copy(expected), message); }
function ok(value, message) { assertions++; assert.ok(value, message); }

function eventHost(target = {}) {
  const listeners = new Map();
  target.addEventListener = (name, handler) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(handler); };
  target.removeEventListener = (name, handler) => listeners.get(name)?.delete(handler);
  target.fire = (name, event = {}) => [...(listeners.get(name) || [])].forEach(handler => handler(event));
  target.listenerCount = () => [...listeners.values()].reduce((n, set) => n + set.size, 0);
  return target;
}
const decode = value => value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
class Element {
  constructor(tag = 'div', attrs = {}) {
    eventHost(this); this.tagName = tag.toUpperCase(); this.attrs = attrs; this.children = []; this.parentElement = null; this.scrollTop = 0; this.text = '';
    const classes = () => new Set((this.attrs.class || '').split(/\s+/).filter(Boolean));
    this.classList = {
      add: (...names) => { const all = classes(); names.forEach(name => all.add(name)); this.attrs.class = [...all].join(' '); },
      remove: (...names) => { const all = classes(); names.forEach(name => all.delete(name)); this.attrs.class = [...all].join(' '); },
      contains: name => classes().has(name),
      toggle: (name, force) => { const enabled = force === undefined ? !classes().has(name) : force; this.classList[enabled ? 'add' : 'remove'](name); return enabled; }
    };
  }
  get dataset() { const result = {}; Object.entries(this.attrs).forEach(([key, value]) => { if (key.startsWith('data-')) result[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value; }); return result; }
  get className() { return this.attrs.class || ''; }
  set className(value) { this.attrs.class = String(value); }
  focus() { if (Element.document) Element.document.activeElement = this; }
  get disabled() { return Object.hasOwn(this.attrs, 'disabled'); }
  get hidden() { return Object.hasOwn(this.attrs, 'hidden'); }
  set hidden(value) { if (value) this.attrs.hidden = ''; else delete this.attrs.hidden; }
  get textContent() { return this.text + this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this.text = String(value); this.children.forEach(child => { child.parentElement = null; }); this.children = []; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  getAttribute(name) { return this.attrs[name] ?? null; }
  appendChild(child) { if (child.parentElement) child.parentElement.children = child.parentElement.children.filter(other => other !== child); child.parentElement = this; this.children.push(child); return child; }
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(other => other !== this); this.parentElement = null; }
  contains(element) { for (let node = element; node; node = node.parentElement) if (node === this) return true; return false; }
  matches(selector) {
    const attributes = [...selector.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)];
    if (attributes.some(match => !Object.hasOwn(this.attrs, match[1]) || (match[2] !== undefined && this.attrs[match[1]] !== match[2]))) return false;
    const stripped = selector.replace(/\[[^\]]+\]/g, '');
    if ([...stripped.matchAll(/\.([\w-]+)/g)].some(match => !this.classList.contains(match[1]))) return false;
    const tag = stripped.match(/^[\w-]+/)?.[0];
    return !tag || tag.toUpperCase() === this.tagName;
  }
  closest(selector) { for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node; return null; }
  querySelectorAll(selector) {
    const parts = selector.split(/\s+/), last = parts.pop(), result = [];
    const visit = node => node.children.forEach(child => {
      if (child.matches(last)) {
        let ancestor = child.parentElement, good = true;
        for (let i = parts.length - 1; i >= 0; i--) { while (ancestor && !ancestor.matches(parts[i])) ancestor = ancestor.parentElement; if (!ancestor) { good = false; break; } ancestor = ancestor.parentElement; }
        if (good) result.push(child);
      }
      visit(child);
    });
    visit(this); return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  getBoundingClientRect() { return { top: 0, bottom: 200, left: 0, right: 360, width: 360, height: 200 }; }
  set innerHTML(html) {
    this.children.forEach(child => { child.parentElement = null; }); this.children = []; this.text = '';
    const stack = [this];
    for (const token of String(html).match(/<[^>]+>|[^<]+/g) || []) {
      if (token.startsWith('</')) { stack.pop(); continue; }
      if (token.startsWith('<')) {
        const tag = token.match(/^<([\w-]+)/)?.[1]; if (!tag) continue;
        const attrs = {};
        for (const match of token.slice(tag.length + 1, -1).matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[match[1]] = decode(match[2] || '');
        const element = new Element(tag, attrs); stack[stack.length - 1].appendChild(element);
        if (!['img', 'input', 'br', 'hr', 'meta', 'link'].includes(tag)) stack.push(element);
      } else stack[stack.length - 1].text += decode(token);
    }
  }
}

function fixture({ saved = {}, writeFails = false, readFails = false, missing = false } = {}) {
  const stored = new Map([[SAVE_KEY, JSON.stringify({ ...defaults, ...saved })]]), runs = [], observers = new Set();
  let active = null, latest = null, lang = 'ko', currentAge = 4, homes = 0, writes = 0;
  const body = new Element('body'), container = body.appendChild(new Element('div'));
  const document = eventHost({ body, hidden: false, activeElement: null, createElement: tag => new Element(tag), getElementById: id => body.querySelector('[id="' + id + '"]') });
  Element.document = document;
  const window = eventHost({ SihyeonQuantityPlayModel: missing ? null : model,
    SihyeonPlaySettings: { getLanguage: () => lang, getAge: () => currentAge, openSettings() { const dialog = new Element('div', { id: 'playSettingsDialog' }); body.appendChild(dialog); } },
    SihyeonQuantitySequencer: { create() {
      const api = {
        start(steps, options) {
          api.stop(); const run = { steps, options, index: 0, status: 'running' }; runs.push(run); active = latest = run;
          options.onStep(steps[0], 0); return Promise.resolve();
        },
        stop() { if (active) { active.status = 'cancelled'; active = null; } },
        getSnapshot() { return { status: latest?.status || 'idle', running: !!active, stepIndex: latest?.index ?? -1, totalSteps: latest?.steps.length || 0 }; }
      }; return api;
    } }
  });
  class Observer {
    constructor(callback) { this.callback = callback; }
    observe() { observers.add(this); }
    disconnect() { observers.delete(this); }
  }
  const context = { window, document, MutationObserver: Observer, console,
    localStorage: { getItem(key) { if (readFails) throw new Error('Controlled read denial'); return stored.get(key) || null; }, setItem(key, value) { writes++; if (writeFails) throw new Error('Controlled quota exceeded'); stored.set(key, value); } } };
  vm.runInNewContext(catalogSource + '\n' + uiSource, context, { timeout: 2000 });
  const api = window.SihyeonGames.pictureArithmetic, options = { closeToParkHome() { homes++; } };
  const render = () => api.render(container, options);
  render();
  function click(action, value) {
    const selector = '[data-pa-action="' + action + '"]' + (value === undefined ? '' : '[data-value="' + value + '"]');
    const scope = container.querySelector('.pa-picture-dialog') || container;
    const button = scope.querySelector(selector); assert(button, 'Actual rendered control missing: ' + selector);
    container.fire('click', { target: button }); return button;
  }
  function step() {
    assert(active, 'No automatic run'); const run = active;
    run.index++;
    if (run.index < run.steps.length) run.options.onStep(run.steps[run.index], run.index);
    else { run.status = 'completed'; active = null; run.options.onEnd(api.getSnapshot().sequence); }
  }
  function finish(onStep) { let guard = 100; while (active && guard--) { step(); onStep?.(); } assert(guard > 0, 'Sequence did not finish'); }
  function closeSettings() { document.getElementById('playSettingsDialog')?.remove(); [...observers].forEach(observer => observer.callback()); }
  return { api, container, window, document, runs, render, click, step, finish, closeSettings, stored,
    setLanguage(value) { lang = value; window.fire('sihyeon-settings-change'); },
    setAge(value) { currentAge = value; window.fire('sihyeon-settings-change'); },
    hide(value) { document.hidden = value; document.fire('visibilitychange'); },
    counts: () => ({ homes, writes, listeners: container.listenerCount() + window.listenerCount() + document.listenerCount(), observers: observers.size }) };
}

const results = [];
function check(name, run) { run(); results.push(name); }
check('two independent pictures, exact addition and count words', () => {
  const f = fixture(); let s = f.api.getSnapshot();
  eq([s.total, s.actualCount, s.actualLeft, s.actualRight], [15, 15, 9, 6]);
  eq([s.leftObjectId, s.rightObjectId], ['korean_police_car', 'pump_engine']);
  const sequence = f.runs.at(-1).steps;
  eq(sequence.slice(0, 15).map(step => step.nativeText), Array.from({ length: 15 }, (_, i) => model.countWord(i + 1, 'native')));
  eq(sequence.slice(0, 15).map(step => step.sinoText), Array.from({ length: 15 }, (_, i) => model.countWord(i + 1, 'sino')));
  eq(sequence.slice(0, 15).map(step => step.enText), Array.from({ length: 15 }, (_, i) => model.countWord(i + 1, 'sino', 'en')));
  f.finish(() => eq(f.api.getSnapshot().actualCount, 15)); s = f.api.getSnapshot();
  eq([s.counted, s.complete], [15, true]);
  f.click('term', 'b'); f.click('category', 'food'); f.click('object', 'cookie');
  s = f.api.getSnapshot(); eq([s.leftObjectId, s.rightObjectId, s.actualLeft, s.actualRight], ['korean_police_car', 'cookie', 9, 6]);
  eq(f.container.querySelectorAll('.pa-item[data-object-id="cookie"]').length, 6);
  f.api.destroy();
});
check('addition boundary states, invalid sum prevented by actual buttons', () => {
  for (const [a, b] of [[0, 0], [0, 30], [30, 0], [29, 1]]) {
    const f = fixture({ saved: { a, b } }); eq(f.api.getSnapshot().actualCount, a + b);
    eq(f.runs.at(-1).steps.filter(step => step.kind === 'count').length, a + b); f.finish();
    eq([f.api.getSnapshot().total, f.api.getSnapshot().complete], [a + b, true]); f.api.destroy();
  }
  const f = fixture(); f.click('range', '2');
  eq(f.container.querySelector('[data-pa-action="number"][data-value="25"]').disabled, true);
  f.click('number', '25'); eq([f.api.getSnapshot().a, f.api.getSnapshot().b], [9, 6]);
  f.click('number', '24'); eq([f.api.getSnapshot().total, f.api.getSnapshot().actualCount], [30, 30]); f.api.destroy();
});
check('equal sharing conserves each original DOM node through every move', () => {
  for (const [total, groups] of [[15, 4], [3, 5], [0, 1], [0, 3], [0, 6], [30, 1], [30, 6], [29, 6], [30, 4]]) {
    const f = fixture({ saved: { mode: 'share', total, groups } });
    const originals = f.container.querySelectorAll('.pa-item');
    let s = f.api.getSnapshot(); eq([s.actualCount, s.poolCount], [total, total]); eq(s.actualGroups, Array(groups).fill(0));
    ok(!f.container.querySelector('[data-pa-action="groups"][data-value="0"]'), 'Zero groups must never be offered');
    f.finish(() => {
      s = f.api.getSnapshot(); eq(s.actualCount, total); eq(s.actualGroups.reduce((sum, n) => sum + n, s.poolCount), total);
      const objects = f.container.querySelectorAll('.pa-item'); eq(new Set(objects).size, total);
      ok(objects.every(element => originals.includes(element)), 'An original node was replaced or cloned during sharing');
      ok(Math.max(...s.actualGroups) - Math.min(...s.actualGroups) <= 1, 'Sharing skipped a group during a round');
    });
    s = f.api.getSnapshot(); eq(s.actualGroups, Array(groups).fill(Math.floor(total / groups)));
    eq([s.each, s.remainder, s.poolCount, s.moved, s.complete], [Math.floor(total / groups), total % groups, total % groups, total - total % groups, true]);
    eq(f.container.querySelector('.pa-pool-title').textContent, '남은 그림'); f.api.destroy();
  }
});
check('replacement, modes, mute, settings, age, language and exit cancel stale callbacks', () => {
  const f = fixture(), old = f.runs.at(-1);
  f.click('number', '7'); let current = f.api.getSnapshot();
  eq(old.status, 'cancelled'); old.options.onStep(old.steps[10], 10); old.options.onEnd({});
  eq(f.api.getSnapshot(), current, 'Old count callback changed the new selection');
  f.click('mode', 'share'); eq(f.api.getSnapshot().mode, 'share');
  f.click('groups', '4'); eq(f.api.getSnapshot().groups, 4);
  const beforeMute = f.runs.at(-1); f.click('mute'); eq(beforeMute.status, 'cancelled'); eq(f.runs.at(-1).options.muted, true);
  f.finish(); eq(f.api.getSnapshot().actualGroups, [3, 3, 3, 3]);
  f.click('style', 'sino'); ok(f.runs.at(-1).steps.filter(step => step.kind === 'move').every(step => step.readingStyle === 'sino'));
  f.setLanguage('en'); eq(f.api.getSnapshot().language, 'en'); ok(f.runs.at(-1).steps.every(step => typeof step.enText === 'string' && !/[가-힣]/.test(step.enText)));
  for (const a of [4, 5, 6, 7]) { f.setAge(a); eq([f.api.getSnapshot().age, f.api.getSnapshot().total, f.api.getSnapshot().groups], [a, 15, 4]); }
  f.click('settings'); eq(f.api.getSnapshot().sequence.status, 'cancelled'); eq(f.counts().observers, 1);
  const numRuns = f.runs.length; f.setLanguage('ko'); eq(f.runs.length, numRuns, 'Settings overlay must not restart background counting');
  f.closeSettings(); eq(f.runs.length, numRuns + 1); eq(f.counts().observers, 0);
  f.hide(true); eq(f.api.getSnapshot().sequence.status, 'cancelled'); f.hide(false); eq(f.api.getSnapshot().sequence.status, 'running');
  const exiting = f.runs.at(-1); f.click('home'); exiting.options.onEnd({}); eq(f.counts().homes, 1);
  eq([f.api.getSnapshot().active, f.counts().listeners, f.counts().observers], [false, 0, 0]);
});
check('validated restoration and in-memory recovery after readable stale storage rejects writes', () => {
  const f = fixture({ saved: { a: 8, b: 3, style: 'sino', shareId: 'cookie', total: 30, groups: 6 }, writeFails: true });
  eq([f.api.getSnapshot().a, f.api.getSnapshot().b, f.api.getSnapshot().readingStyle], [8, 3, 'sino']);
  f.click('number', '10'); f.click('mode', 'share'); f.click('groups', '4'); f.api.destroy(); f.render();
  let s = f.api.getSnapshot(); eq([s.mode, s.a, s.total, s.groups, s.shareObjectId], ['share', 10, 30, 4, 'cookie']);
  eq(s.storage.read, 'memory'); eq(JSON.parse(f.stored.get(SAVE_KEY)).a, 8); f.api.destroy();
  const bad = fixture({ saved: { a: 30, b: 1, total: -1, groups: 0, aId: 'absent', style: 'unknown' } });
  s = bad.api.getSnapshot(); eq([s.a, s.b, s.readingStyle, s.leftObjectId], [9, 6, 'native', 'korean_police_car']);
  bad.click('mode', 'share'); s = bad.api.getSnapshot(); eq([s.total, s.groups], [15, 3]); bad.api.destroy();
  const denied = fixture({ readFails: true, writeFails: true }); denied.click('number', '5'); denied.api.destroy(); denied.render(); eq(denied.api.getSnapshot().a, 5); denied.api.destroy();
});
check('large picture/group dialogs pause, trap focus and resume without losing the exact set', () => {
  const f = fixture(), first = f.runs.at(-1);
  f.click('choosePicture', 'b'); eq(first.status, 'cancelled'); eq(f.api.getSnapshot().dialog, 'pictures');
  eq(f.api.getSnapshot().actualCount, 15);
  let buttons = f.container.querySelectorAll('.pa-picture-dialog button');
  eq(f.document.activeElement.dataset.paAction, 'closeDialog');
  let prevented = 0;
  f.container.fire('keydown', { key: 'Tab', shiftKey: true, preventDefault() { prevented++; } });
  ok(f.document.activeElement === buttons.at(-1));
  f.container.fire('keydown', { key: 'Tab', shiftKey: false, preventDefault() { prevented++; } });
  ok(f.document.activeElement === buttons[0]); eq(prevented, 2);
  f.click('category', 'food'); f.click('object', 'cookie');
  eq([f.api.getSnapshot().dialog, f.api.getSnapshot().rightObjectId, f.api.getSnapshot().actualCount], [null, 'cookie', 15]);
  f.click('choosePicture', 'a'); const paused = f.runs.length;
  f.setLanguage('en'); eq(f.runs.length, paused);
  f.container.fire('keydown', { key: 'Escape', preventDefault() {} });
  eq(f.api.getSnapshot().dialog, null); eq(f.runs.length, paused + 1);
  f.click('mode', 'share'); f.click('chooseGroups');
  eq(f.api.getSnapshot().dialog, 'groups');
  eq(f.container.querySelectorAll('.pa-picture-dialog [data-pa-action="groups"]').map(button => button.dataset.value), ['1', '2', '3', '4', '5', '6']);
  f.click('groups', '5'); f.click('range', '0'); f.click('number', '3'); f.finish();
  eq(f.api.getSnapshot().actualGroups, [0, 0, 0, 0, 0]);
  eq(f.container.querySelector('.pa-empty-groups-summary').hidden, false);
  eq(f.container.querySelectorAll('.pa-empty-group').length, 5); eq(f.api.getSnapshot().poolCount, 3);
  f.click('chooseGroups'); const overlay = f.container.querySelector('.pa-picture-overlay'); f.container.fire('click', { target: overlay });
  eq(f.api.getSnapshot().dialog, null); f.api.destroy(); eq(f.counts().listeners, 0);
});
check('missing dependencies provide an exit without reading or writing game state', () => {
  const f = fixture({ missing: true }); eq(f.api.getSnapshot().error, 'dependencies-unavailable'); eq(f.counts().writes, 0);
  f.click('home'); eq([f.counts().homes, f.counts().listeners], [1, 0]);
});
console.log(JSON.stringify({ status: 'PASS', scope: 'Production UI with controlled DOM/sequence, not browser layout or real audio', assertions, checks: results }, null, 2));
