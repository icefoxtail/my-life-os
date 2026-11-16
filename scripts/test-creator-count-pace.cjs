/* Actual number-count handlers with a small DOM and deterministic clock.
 * Checks pacing/cancellation, not rendering, audible speech or physical touch. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const file = process.argv[2] || path.resolve(__dirname, '../js/games/number-count.js');
const source = fs.readFileSync(file, 'utf8');

function clock() {
  let now = 0, next = 0;
  const timers = new Map();
  return {
    timers, get now() { return now; },
    setTimeout(fn, ms = 0) { const id = ++next; timers.set(id, {fn, at: now + ms}); return id; },
    clearTimeout(id) { timers.delete(id); },
    tick(ms) {
      const until = now + ms;
      for (let limit = 0; limit < 2000; limit++) {
        const entry = [...timers].filter(([, t]) => t.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
        if (!entry) { now = until; return; }
        timers.delete(entry[0]); now = entry[1].at; entry[1].fn();
      }
      throw new Error('clock did not settle');
    }
  };
}
function element(tag = 'div') {
  let html = '';
  const e = {tag, children: [], parentNode: null, dataset: {}, style: {setProperty() {}}, attrs: {},
    className: '', textContent: '', disabled: false,
    get innerHTML() { return html; },
    set innerHTML(value) {
      html = value; this.children.forEach(n => { n.parentNode = null; }); this.children = [];
      for (const match of value.matchAll(/<button\b[^>]*id="([^"]+)"[^>]*>/g)) {
        const b = element('button'); b.id = match[1]; this.appendChild(b);
      }
    },
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
    removeChild(child) { this.children = this.children.filter(n => n !== child); child.parentNode = null; },
    remove() { this.parentNode?.removeChild(this); },
    setAttribute(name, value) { this.attrs[name] = String(value); },
    getAttribute(name) { return this.attrs[name]; },
    addEventListener(name, fn) { this['on' + name] = fn; },
    querySelectorAll(selector) {
      const matches = node => selector.split(',').some(part => {
        if (part.startsWith('#')) return node.id === part.slice(1);
        if (part.startsWith('.')) {
          const name = part.slice(1).split('[')[0];
          return node.classList.contains(name) && (!part.includes('data-correct') || node.dataset.correct === 'true');
        }
        return node.tag === part;
      });
      const visit = node => node.children.flatMap(child => [...(matches(child) ? [child] : []), ...visit(child)]);
      return visit(this);
    },
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  };
  e.classList = {
    contains: name => e.className.split(/\s+/).includes(name),
    add(...names) { e.className = [...new Set([...e.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
    remove(...names) { e.className = e.className.split(/\s+/).filter(n => !names.includes(n)).join(' '); },
    toggle(name, on) { on ? this.add(name) : this.remove(name); }
  };
  return e;
}
function fixture() {
  const time = clock(), container = element(), spoken = [], rewards = [];
  for (const id of ['ncGame','ncVehiclesWrapper','ncChoicesArea','ncObjectsArea','ncDotProgress','ncSuccessPanel']) {
    const el = element(); el.id = id; container.appendChild(el);
  }
  const window = {SihyeonPlaySettings: {getLanguage: () => 'ko'},
    SihyeonVoice: {speak: text => { spoken.push(text); return Promise.resolve(); }},
    matchMedia: () => ({matches: false}), removeEventListener() {}};
  const math = Object.create(Math); math.random = () => 0.9999;
  vm.runInNewContext(source, {window, document: {createElement: element}, navigator: {},
    setTimeout: time.setTimeout, clearTimeout: time.clearTimeout, console, Math: math});
  const game = window.SihyeonGames.numberCount;
  Object.assign(game.state, {container, difficulty: 5,
    gameVehicles: [{id:'car', name:'자동차', image:'car.png'}],
    options: {say: text => spoken.push(text), fireConfetti: () => rewards.push('round'), gainExp: n => rewards.push(n)}});
  game.loadNextQuestion();
  return {game, time, container, spoken, rewards, window, math,
    get: selector => container.querySelector(selector)};
}

let checks = 0;
let f = fixture();
f.time.tick(900);
assert.equal(f.game.state.currentAnswer, 30);
assert.equal(f.get('#ncChoicesArea').style.visibility, 'visible', '30 objects finish entering within 900ms');
assert.equal(f.get('#ncChoicesArea').children.length, 5);
f.game.checkAnswer(30);
assert.ok(f.get('#ncContinueBtn'), 'a correct answer immediately offers a next button');
assert.equal(f.game.state.isAnimating, false, 'optional recount never locks progression');
assert.equal(f.game.state.correctCount, 1);
f.game.checkAnswer(30);
assert.equal(f.game.state.correctCount, 1, 'double answer cannot reward twice');
assert.equal(f.rewards.length, 1);
f.time.tick(30000);
assert.equal(f.game.state.currentLevel, 1, 'the next round waits for the child, not a long automatic sequence');
checks += 6;

const firstNext = f.get('#ncContinueBtn').onclick;
f.get('#ncRecountBtn').onclick(); f.time.tick(1300);
assert.equal(f.get('#ncVehiclesWrapper').querySelectorAll('.nc-count-dot').length, 3);
assert.equal(f.game.state.countedIds.size, 0, 'visual recount does not change physical object tap identities');
const stale = [...f.time.timers.values()].map(t => t.fn);
firstNext();
assert.equal(f.game.state.currentLevel, 2, 'next works while recounting');
firstNext(); assert.equal(f.game.state.currentLevel, 2, 'double next cannot skip a question');
stale.forEach(fn => fn());
assert.equal(f.game.state.currentLevel, 2);
assert.equal(f.get('#ncVehiclesWrapper').querySelectorAll('.nc-count-dot').length, 0, 'expired recount callbacks cannot mark new objects');
assert.equal(f.get('#ncObjectsArea').querySelectorAll('.nc-star').length, 0, 'immediate next cleans cancelled celebration nodes');
f.time.tick(900);
f.game.checkAnswer(30);
firstNext(); assert.equal(f.game.state.currentLevel, 2, 'a detached previous next handler cannot advance a later correct answer');
checks += 8;

f.get('#ncRecountBtn').onclick(); f.time.tick(650);
f.get('#ncRecountBtn').onclick();
assert.equal(f.game.state.recountActive, false);
assert.equal(f.get('#ncVehiclesWrapper').querySelectorAll('.nc-count-dot').length, 0);
f.time.tick(30000);
assert.equal(f.get('#ncVehiclesWrapper').querySelectorAll('.nc-count-dot').length, 0, 'stop cancels every future recount badge');
f.get('#ncRecountBtn').onclick(); f.time.tick(19800);
assert.equal(f.get('#ncVehiclesWrapper').querySelectorAll('.nc-count-dot').length, 30);
assert.equal(f.game.state.recountActive, false);
assert.equal(f.game.state.currentLevel, 2, 'full optional recount never auto advances');
const cell = f.get('#ncVehiclesWrapper').children[0]; cell.onclick(); cell.onclick();
assert.equal(f.game.state.countedIds.size, 1, 'repeated object taps still count one physical object');
assert.equal(f.get('#ncVehiclesWrapper').querySelectorAll('.nc-count-dot').length, 0, 'a child tap returns from completed recount to tap counting');
checks += 8;

f.get('#ncRecountBtn').onclick();
const beforeRound = f.game.state.roundId;
f.game.refreshLayoutOnly();
assert.equal(f.game.state.roundId, beforeRound);
assert.equal(f.game.state.recountActive, true, 'rotation only changes layout');
f.game.destroy(); f.time.tick(30000);
assert.equal(f.time.timers.size, 0);
assert.equal(f.game.state.container, null);
checks += 4;

f = fixture();
for (let round = 1; round <= 5; round++) {
  f.time.tick(900); f.game.checkAnswer(f.game.state.currentAnswer);
  const next = f.get('#ncContinueBtn').onclick; next(); next();
  assert.equal(f.game.state.currentLevel, round + 1);
}
f.time.tick(3000);
assert.equal(f.rewards.filter(x => x === 30).length, 1, 'five child-controlled rounds reward completion once');
assert.equal(f.rewards.filter(x => x === 'round').length, 6, 'five answer celebrations and one final celebration');
assert.equal(f.get('#ncSuccessPanel').style.display, 'flex');
checks += 8;

// A correct-answer utterance can still be speaking when the child presses Next.
// Run the real shared engine, holding only its native speech-device completion.
// Advancing from 30 to 21 must not leave "thirty vehicles" over the new objects.
f = fixture();
const speech = {active: null, requests: [], cancels: 0};
f.window.addEventListener = () => {};
f.window.speechSynthesis = {
  getVoices: () => [],
  cancel() { speech.cancels++; speech.active = null; },
  speak(utterance) { speech.active = utterance; speech.requests.push(utterance); }
};
vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../js/voice-engine.js'), 'utf8'), {
  window: f.window, console, Promise,
  SpeechSynthesisUtterance: function(text) { this.text = text; },
  fetch: async () => ({ok: true, json: async () => ({voices: {}})})
}, {filename: 'js/voice-engine.js'});
f.game.state.options.say = text => f.window.SihyeonVoice.speak(text);
f.time.tick(900);
f.game.checkAnswer(30);
const thirtyVoice = speech.active;
assert.equal(thirtyVoice.text, '우와 맞았어! 서른 대야!');
const thirtyNext = f.get('#ncContinueBtn').onclick;
const beforeNext = {cancels: speech.cancels,
  generation: f.window.SihyeonVoice.debugStatus().requestGeneration,
  requests: speech.requests.length};
f.math.random = () => 0; // The next actual generated question contains 21 objects.
thirtyNext();
assert.equal(f.game.state.currentAnswer, 21);
assert.equal(f.get('#ncVehiclesWrapper').children.length, 21);
assert.ok(speech.cancels > beforeNext.cancels);
assert.ok(f.window.SihyeonVoice.debugStatus().requestGeneration > beforeNext.generation,
  'valid Next invalidates the actual shared voice queue');
assert.equal(speech.active, null, 'old 30-object speech stops immediately when 21 objects arrive');
f.time.tick(500);
thirtyVoice.onend(); thirtyVoice.onerror();
assert.equal(speech.active, null);
assert.equal(speech.requests.length, beforeNext.requests, 'no old quantity replays during entry');
checks += 3;

f.time.tick(400);
assert.equal(speech.active.text, '자동차는 몇 대일까?', 'new question asks about the current objects');
f.game.checkAnswer(21);
assert.equal(speech.active.text, '우와 맞았어! 스물한 대야!', 'new feedback uses the new quantity');
const twentyOneVoice = speech.active;
const beforeStale = {cancels: speech.cancels,
  generation: f.window.SihyeonVoice.debugStatus().requestGeneration};
thirtyNext();
assert.equal(f.game.state.currentLevel, 2);
assert.equal(speech.active, twentyOneVoice, 'detached old Next cannot cancel the current feedback');
assert.equal(speech.cancels, beforeStale.cancels);
assert.equal(f.window.SihyeonVoice.debugStatus().requestGeneration, beforeStale.generation);
checks += 2;
console.log(`PASS ${checks} number-count pacing/cancellation checks: immediate next, optional recount, 30 objects, repeated input, stale callbacks, rotation, disposal, five-round completion and actual-engine speech cancellation when advancing.`);
