/* Actual Number Kingdom tap handlers in a synthetic world. These checks cover
 * quantity/action language and voice requests, not rendered pixels or audio. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const file = process.argv[2] || path.resolve(__dirname, '../games/number-kingdom-3d.html');
const html = fs.readFileSync(file, 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
for (const source of scripts) new vm.Script(source, {filename: file});
const source = scripts.find(script => script.includes('function handleFriendTap('));
assert.ok(source, 'Number Kingdom inline game script exists');
function functionSource(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `game function ${name} exists`);
  const end = source.indexOf('\nfunction ', start + 1);
  assert.ok(end > start, `game function ${name} has a following declaration`);
  return source.slice(start, end);
}
const required = ['assertNumber', 'poses', 'cellsFor', 'getBoundsLocal',
  'getSinoName', 'getPureKoreanName', 'sayNumber', 'handleFriendTap'];
const helpers = ['getTapCountLabel', 'quantityComparisonText']
  .filter(name => source.includes(`function ${name}(`));
const constant = name => {
  const match = source.match(new RegExp(`^const ${name} = .+;$`, 'm'));
  assert.ok(match, `game constant ${name} exists`);
  return match[0];
};

const spoken = [], shown = [];
let currentTime = 10000, language = 'ko', pair = null;
const englishNumbers = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const sandbox = {
  state: {sound: true, destroyed: false},
  performance: {now: () => currentTime},
  window: {parent: {
    SihyeonPlaySettings: {getLanguage: () => language},
    SihyeonVoiceLabels: {numberEn: n => englishNumbers[n]},
    SihyeonVoice: {speak: (text, options) => { spoken.push({text, options}); }}
  }},
  findPair3D: () => pair,
  triggerSquash() {}, sfx() {}, burst3D() {},
  getCellColor: () => '#ff0000',
  toast: text => shown.push(text)
};
vm.createContext(sandbox);
vm.runInContext([
  'const PLAY_MAX = 300;', constant('SINO_NAMES'), constant('PURE_KOREAN'), constant('tapTracker'),
  ...required.map(functionSource), ...helpers.map(functionSource),
  'globalThis.game = {cellsFor, getBoundsLocal, handleFriendTap, sayNumber, tapTracker};'
].join('\n'), sandbox);
const game = sandbox.game;
const block = (id, n, pose) => ({id, kind: 'friend', n, pose, cells: game.cellsFor(n, pose), gx: 2, gy: 0, gz: 0});
const tap = item => { currentTime += 100; game.handleFriendTap(item); };
function fresh() {
  Object.assign(game.tapTracker, {targetId: null, num: 0, count: 0, lastTime: 0});
  shown.length = 0; spoken.length = 0; pair = null;
}
let checks = 0;

// Same number, visibly different height: equality must describe quantity.
for (const [n, firstPose, secondPose] of [[4, 'tall', 'rect2'], [8, 'tall', 'bridge'],
  [12, 'ten', 'rect3'], [100, 'ten', 'double']]) {
  fresh();
  const a = block('a', n, firstPose), b = block('b', n, secondPose);
  assert.equal(a.cells.length, n);
  assert.equal(b.cells.length, n);
  assert.notEqual(game.getBoundsLocal(a.cells).h, game.getBoundsLocal(b.cells).h,
    'counterexample must actually have different heights');
  pair = {a, b};
  tap(a); tap(a);
  assert.match(shown.at(-1), /블록 수가 같아요/);
  assert.ok(shown.at(-1).includes(`${n} = ${n}`));
  assert.doesNotMatch(shown.at(-1), /키|높이|\+/);
  checks++;
}

// The shorter character can contain MORE blocks. Exercise repeated and first
// tap branches, both pair orders, and ordinary/special large-number poses.
for (const [largeN, largePose, smallN, smallPose] of [[8, 'bridge', 5, 'tall'], [100, 'double', 20, 'ten']]) {
  for (const reverse of [false, true]) {
    fresh();
    const more = block('more', largeN, largePose), less = block('less', smallN, smallPose);
    assert.ok(game.getBoundsLocal(more.cells).h < game.getBoundsLocal(less.cells).h);
    pair = reverse ? {a: less, b: more} : {a: more, b: less};
    tap(more);
    if (largeN >= 20) {
      assert.match(shown.at(-1), /개 더 많아요/);
      assert.ok(shown.at(-1).includes(`${largeN - smallN}개`));
      checks++;
    }
    tap(more);
    assert.ok(shown.at(-1).includes(`숫자 ${largeN}`));
    assert.ok(shown.at(-1).includes(`${largeN - smallN}개 더 많아요`));
    assert.ok(shown.at(-1).includes(`${smallN} < ${largeN}`));
    assert.doesNotMatch(shown.at(-1), /칸 더|커요|키|높이/);
    assert.equal(more.cells.length, largeN);
    assert.equal(less.cells.length, smallN);
    checks++;
  }
}

const koCounts = ['', '한 번', '두 번', '세 번', '네 번', '다섯 번', '여섯 번', '일곱 번', '여덟 번', '아홉 번', '열 번'];
for (const lang of ['ko', 'en']) {
  fresh(); language = lang;
  const one = block('one', 1, 'tall');
  tap(one);
  assert.equal(spoken.at(-1).text, lang === 'ko' ? '하나' : 'one', 'first touch keeps the number name');
  for (let count = 2; count <= 10; count++) {
    tap(one);
    assert.match(shown.at(-1), /번 두드렸어요/);
    assert.ok(shown.at(-1).includes(`(${count}/10)`));
    const expected = lang === 'ko' ? koCounts[count] : count === 2 ? 'twice' : `${englishNumbers[count]} times`;
    assert.equal(spoken.at(-1).text, expected, 'voice names actions, not additional objects');
    assert.equal(spoken.at(-1).options.lang, lang === 'ko' ? 'ko-KR' : 'en-US');
    assert.equal(one.n, 1);
    assert.equal(one.cells.length, 1, 'counting taps never creates or counts ten blocks');
    checks++;
  }
  tap(one);
  assert.equal(spoken.at(-1).text, lang === 'ko' ? '한 번' : 'once', 'next ten-tap round begins at one');
  assert.ok(shown.at(-1).includes('(1/10)'));
  currentTime += 2500;
  tap(one);
  assert.equal(game.tapTracker.count, 1, 'a pause starts a new sequence');
  assert.equal(spoken.at(-1).text, lang === 'ko' ? '하나' : 'one');
  const another = block('another-one', 1, 'tall');
  tap(another);
  assert.equal(game.tapTracker.count, 1, 'a different physical block starts a new sequence');
  game.sayNumber(10);
  assert.equal(spoken.at(-1).text, lang === 'ko' ? '열' : 'ten', 'ordinary number labels keep no action unit');
  checks += 4;
}

const before = spoken.length;
sandbox.state.sound = false;
assert.equal(game.sayNumber(2, 'tap'), false);
sandbox.state.sound = true;
sandbox.state.destroyed = true;
assert.equal(game.sayNumber(2, 'tap'), false);
assert.equal(spoken.length, before, 'mute and disposal still suppress speech');
checks += 2;
console.log(`PASS ${checks} Number Kingdom language scenarios: real pose geometry, quantity comparison, tap-count Korean/English requests, state preservation and voice guards.`);
