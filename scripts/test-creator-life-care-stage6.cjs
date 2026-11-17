/* Stage 6 contract checks against the real product handlers. DOM/time are
 * synthetic; source-bound native browser checks are a separate release gate. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
// Reuse the established minimal DOM/clock, not its expected game outcomes.
const helperPath = path.join(__dirname, 'test-creator-life-pace.cjs');
const helper = new Module(helperPath, module);
helper.filename = helperPath;
helper.paths = Module._nodeModulePaths(__dirname);
const helperSource = fs.readFileSync(helperPath, 'utf8').split('const cases = [];')[0]
  .replace('const document = {head, createElement: node,', 'const document = {head, listeners: {}, addEventListener(name, fn) {this.listeners[name] = fn;}, removeEventListener(name) {delete this.listeners[name];}, createElement: node,')
  .replace('return {api, window, time, container, rewards,', 'return {document, api, window, time, container, rewards,');
helper._compile(helperSource + '\nmodule.exports = {fixture, node, clock};', helperPath);
const {fixture: lifeFixture, node: makeNode, clock} = helper.exports;
const cases = [];
function test(name, run) { run(); cases.push(name); }
const plain = value => JSON.parse(JSON.stringify(value));

const missionOrders = {
  wash_hands: ['water', 'soap', 'rinse', 'towel'],
  brush_teeth: ['paste', 'brush', 'rinse'],
  eat_meal: ['clean', 'sit', 'eat'],
  sleep_time: ['pajamas', 'book', 'light'],
  go_out: ['clothes', 'shoes', 'door'],
  clean_up: ['gather', 'basket', 'clean']
};
for (const [id, order] of Object.entries(missionOrders)) {
  test(`life ${id}: every action speaks; explanation is replayable without changing placement`, () => {
    const f = lifeFixture();
    f.api.state.missions = [f.api.MISSIONS.find(m => m.id === id)]; f.api.state.round = 1; f.api.startRound();
    assert.ok(f.get('[data-life-reason]').textContent.length > 10);
    for (const card of order) {
      const before = f.spoken.length;
      f.api.placeCard(card);
      assert.ok(f.spoken.length > before, `${id}/${card} must request speech`);
      const placement = plain(f.api.state.placed);
      const reason = f.get('[data-life-reason]').textContent;
      f.get('[data-life-listen]').click();
      assert.equal(f.spoken.at(-1), reason);
      assert.deepEqual(plain(f.api.state.placed), placement);
    }
    f.time.tick(280);
    assert.equal(f.api.state.roundAnswered, true);
    assert.equal(f.rewards.length, 1);
    f.time.tick(60000);
    assert.equal(f.api.state.round, 1);
  });
  test(`life ${id}: English replay and action speech contain no Korean`, () => {
    const f = lifeFixture(); f.window.SihyeonPlaySettings.getLanguage = () => 'en';
    f.api.state.missions = [f.api.MISSIONS.find(m => m.id === id)]; f.api.state.round = 1; f.api.startRound();
    f.spoken.length = 0;
    f.get('[data-life-listen]').click();
    assert.ok(/[A-Za-z]/.test(f.spoken.at(-1)));
    for (const card of order) { f.api.placeCard(card); f.get('[data-life-listen]').click(); }
    f.time.tick(2500);
    assert.ok(f.spoken.length >= order.length * 2 + 1);
    assert.ok(f.spoken.every(text => !/[가-힣]/.test(text)), f.spoken.join('\n'));
  });
}
for (const id of ['eat_meal', 'sleep_time', 'go_out']) {
  test(`life ${id}: both preparations are valid before the final action`, () => {
    const f = lifeFixture();
    f.api.state.missions = [f.api.MISSIONS.find(m => m.id === id)]; f.api.state.round = 1; f.api.startRound();
    const order = missionOrders[id];
    [order[1], order[0], order[2]].forEach(value => f.api.placeCard(value));
    f.time.tick(280); assert.equal(f.api.state.roundAnswered, true);
    f.time.tick(2500);
    assert.ok(f.spoken.at(-1).indexOf(f.api.state.mission.steps[1].label) < f.spoken.at(-1).indexOf(f.api.state.mission.steps[0].label));
  });
  test(`life ${id}: the final action cannot precede both preparations; retained preparation is respected`, () => {
    const f = lifeFixture();
    f.api.state.missions = [f.api.MISSIONS.find(m => m.id === id)]; f.api.state.round = 1; f.api.startRound();
    const order = missionOrders[id];
    [order[1], order[2], order[0]].forEach(value => f.api.placeCard(value));
    f.time.tick(280 + 1150);
    assert.equal(f.api.state.roundAnswered, false);
    assert.deepEqual(plain(f.api.state.placed.map(card => card?.id || null)), [order[1], null, null]);
    f.api.placeCard(order[0]); f.api.placeCard(order[2]); f.time.tick(280);
    assert.equal(f.api.state.roundAnswered, true);
  });
}

const catRaw = fs.readFileSync(path.join(root, 'js/games/cat-care.js'), 'utf8');
const catSource = catRaw.replace(/\}\)\(\);\s*$/, 'window.__catStage6 = {state, NEEDS, ACTIONS, CAT_DATA, startCare, handleAction, nextNeed, changeCat, renderComplete, handleResize, destroy};\n})();');
function catFixture() {
  const time = clock(), spoken = [], rewards = [], confetti = [];
  const node = (...args) => { const n = makeNode(...args); n.style.setProperty = (key, value) => { n.style[key] = value; }; return n; };
  const head = node('head'), body = node('body'), container = node('main'); body.appendChild(container);
  const document = {head, body, listeners: {}, addEventListener(name, fn) {this.listeners[name] = fn;}, removeEventListener(name) {delete this.listeners[name];}, createElement: node, getElementById: id => head.querySelector('#' + id) || body.querySelector('#' + id)};
  const speech = {stops: 0, cancels: 0};
  const window = {innerWidth: 390, innerHeight: 844, addEventListener() {}, removeEventListener() {},
    SihyeonPlaySettings: {getLanguage: () => 'ko'},
    SihyeonVoice: {play: () => Promise.resolve(false), stop() { speech.stops++; }, speak: text => { spoken.push(text); return Promise.resolve(true); }},
    speechSynthesis: {cancel() { speech.cancels++; }}};
  const ctx = vm.createContext({window, document, console, setTimeout: time.setTimeout, clearTimeout: time.clearTimeout, speechSynthesis: window.speechSynthesis});
  vm.runInContext(catSource, ctx);
  const options = {say: text => { spoken.push(text); return Promise.resolve(true); }, gainExp: amount => rewards.push(amount), fireConfetti: () => confetti.push(time.now)};
  const reopen = () => window.SihyeonGames.catCare.render(container, options);
  reopen();
  const api = window.__catStage6;
  const action = id => api.handleAction(api.ACTIONS.find(a => a.id === id), 100, 100);
  return {api, window, time, container, document, rewards, spoken, confetti, speech, reopen, action, get: selector => container.querySelector(selector)};
}

test('cat: observed need, unsuitable action and waiting preserve the state; correct care changes it once', () => {
  const f = catFixture(); f.api.startCare(f.api.CAT_DATA.white);
  assert.equal(f.api.state.needIndex, 0);
  f.action('sleep'); assert.equal(f.api.state.resolved, false); assert.equal(f.api.state.activeStep, 'default');
  f.action('wait'); assert.equal(f.api.state.resolved, false); assert.match(f.api.state.feedback, /서두르지/);
  assert.equal(f.rewards.length, 0);
  f.action('eat'); assert.equal(f.api.state.resolved, true); assert.equal(f.api.state.activeStep, 'eat');
  assert.deepEqual(f.rewards, [5]);
  f.action('eat'); f.action('bath'); assert.deepEqual(f.rewards, [5]);
  assert.equal(f.api.state.activeStep, 'eat');
  f.time.tick(300000); assert.equal(f.api.state.currentScreen, 'care'); assert.equal(f.api.state.needIndex, 0);
});
test('cat: all four actual needs have a matching response, including space; only manual next changes need', () => {
  const f = catFixture(); f.api.startCare(f.api.CAT_DATA.gray);
  for (const id of ['eat', 'bath', 'sleep', 'wait']) {
    f.action(id); assert.equal(f.api.state.resolved, true);
    const feedback = f.api.state.feedback;
    f.get('[data-cat-listen]').click(); assert.equal(f.spoken.at(-1), feedback);
    const next = f.get('[data-cat-next]'); next.click(); const index = f.api.state.needIndex; next.click();
    assert.equal(f.api.state.needIndex, index, 'detached Next cannot skip another need');
  }
  assert.equal(f.api.state.completed.size, 4); assert.deepEqual(f.rewards, [5, 5, 5, 5]);
  assert.equal(f.api.state.needIndex, 0);
  f.action('eat'); assert.deepEqual(f.rewards, [5, 5, 5, 5]);
  f.get('[data-cat-finish]').click(); assert.equal(f.api.state.currentScreen, 'complete');
  assert.deepEqual(f.rewards, [5, 5, 5, 5, 25]);
  f.api.renderComplete(); assert.deepEqual(f.rewards, [5, 5, 5, 5, 25]);
});
test('cat: early finish is kind and does not claim or reward completion', () => {
  const f = catFixture(); f.api.startCare(f.api.CAT_DATA.white);
  f.get('[data-cat-finish]').click();
  assert.equal(f.api.state.currentScreen, 'complete'); assert.equal(f.rewards.length, 0);
  assert.match(f.container.innerHTML, /cc-root/);
  assert.ok(f.get('#cc-replay')); assert.ok(f.get('#cc-to-land'));
});
test('cat: switching and unmount clear particles and invalidate old actions and callbacks', () => {
  const f = catFixture(); f.api.startCare(f.api.CAT_DATA.white);
  const oldNext = f.get('[data-cat-next]'), oldListen = f.get('[data-cat-listen]');
  f.action('eat'); assert.ok(f.api.state.particles.size > 0);
  const callbacks = [...f.time.tasks.values()].map(t => t.fn);
  f.get('#cc-change-cat').click(); assert.equal(f.api.state.particles.size, 0);
  f.api.startCare(f.api.CAT_DATA.gray);
  const speechCount = f.spoken.length;
  oldNext.click(); oldListen.click(); callbacks.forEach(fn => fn());
  assert.equal(f.api.state.currentCat.id, 'gray'); assert.equal(f.api.state.needIndex, 0); assert.equal(f.spoken.length, speechCount);
  f.action('eat'); f.api.handleResize(); const pending = [...f.time.tasks.values()].map(t => t.fn);
  f.api.destroy(); assert.equal(f.time.tasks.size, 0); assert.equal(f.api.state.particles.size, 0);
  f.reopen(); pending.forEach(fn => fn());
  assert.equal(f.api.state.currentScreen, 'select'); assert.equal(f.api.state.currentCat, null);
});
test('cat: rotation is silent and keeps chosen care, scene and rewards', () => {
  const f = catFixture(); f.api.startCare(f.api.CAT_DATA.white); f.action('eat');
  const said = f.spoken.length, id = f.api.state.turnId;
  f.window.innerWidth = 844; f.window.innerHeight = 390; f.api.handleResize(); f.time.tick(150);
  assert.equal(f.api.state.turnId, id); assert.equal(f.api.state.activeStep, 'eat'); assert.equal(f.spoken.length, said);
  assert.ok(f.get('#cc-change-cat')); assert.ok(f.get('[data-cat-next]')); assert.deepEqual(f.rewards, [5]);
});
test('cat: explicit English replay uses English, reward storage failure does not block next', () => {
  const f = catFixture(); f.window.SihyeonPlaySettings.getLanguage = () => 'en'; f.api.startCare(f.api.CAT_DATA.white);
  let attempts = 0; f.api.state.options.gainExp = () => { attempts++; throw new Error('quota'); };
  for (const id of ['eat', 'bath', 'sleep', 'wait']) {
    f.get('[data-cat-listen]').click(); f.action(id); f.action(id); f.get('[data-cat-next]').click();
  }
  assert.equal(attempts, 4); assert.ok(f.spoken.every(s => !/[가-힣]/.test(s)));
  assert.ok(f.spoken.some(s => s.includes('space')));
});

test('life: hidden page stops narration, keeps the pending verdict and only resumes speech on a new action', () => {
  const f = lifeFixture();
  for (const step of f.api.state.mission.steps) f.api.placeCard(step.id);
  const stops = f.speech.stops, count = f.spoken.length;
  f.document.hidden = true; f.document.listeners.visibilitychange(); f.time.tick(3000);
  assert.ok(f.speech.stops > stops); assert.equal(f.spoken.length, count);
  assert.equal(f.api.state.roundAnswered, true); assert.ok(f.get('[data-life-next]'));
  f.document.hidden = false; f.document.listeners.visibilitychange(); assert.equal(f.spoken.length, count);
  f.get('[data-life-listen]').click(); assert.ok(f.spoken.length > count);
  f.api.destroy(); assert.equal(f.document.listeners.visibilitychange, undefined);
});
test('life: explicit explanation replay is not interrupted by the remaining automatic narration', () => {
  const f = lifeFixture(); f.solve();
  f.get('[data-life-listen]').click(); const count = f.spoken.length;
  f.time.tick(3000); assert.equal(f.spoken.length, count);
  assert.equal(f.api.state.roundAnswered, true);
});
test('cat: hidden page stops narration and no queued callback speaks or worsens the need', () => {
  const f = catFixture(); f.api.startCare(f.api.CAT_DATA.white);
  const stops = f.speech.stops, count = f.spoken.length;
  f.document.hidden = true; f.document.listeners.visibilitychange(); f.time.tick(300000);
  assert.ok(f.speech.stops > stops); assert.equal(f.spoken.length, count);
  assert.equal(f.api.state.needIndex, 0); assert.equal(f.api.state.resolved, false);
  f.document.hidden = false; f.document.listeners.visibilitychange(); assert.equal(f.spoken.length, count);
  f.get('[data-cat-listen]').click(); assert.equal(f.spoken.length, count + 1);
  f.api.destroy(); assert.equal(f.document.listeners.visibilitychange, undefined);
});

console.log(JSON.stringify({status: 'PASS', cases: cases.length, scenarios: cases,
  sourceSha256: Object.fromEntries(['js/games/life-sequence.js', 'js/games/cat-care.js'].map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')])),
  notRun: ['rendered pixels', 'audible speech', 'physical touch', 'child observation']}, null, 2));
