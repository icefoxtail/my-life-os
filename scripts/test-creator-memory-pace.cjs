/* Real memory handlers and voice engine, with a fake clock and explicit
 * SpeechSynthesisUtterance/Audio end callbacks. This does not prove audible
 * pronunciation or physical touch. Pass an alternate source root to reproduce
 * the old post-speech delay without changing the assertions.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const sourceRoot = process.argv[2] ? path.resolve(process.argv[2]) : root;
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'assets/vehicles/vehicles_manifest.json'), 'utf8')).vehicles;

async function flush() { for (let i = 0; i < 24; i++) await Promise.resolve(); }

function clock() {
  let now = 0, nextId = 1;
  const tasks = new Map();
  return {
    get now() { return now; }, tasks,
    setTimeout(fn, delay = 0) { const id = nextId++; tasks.set(id, {fn, at: now + Math.max(0, Number(delay))}); return id; },
    clearTimeout(id) { tasks.delete(id); },
    async advance(ms) {
      const end = now + ms;
      await flush();
      for (let steps = 0; ; steps++) {
        assert.ok(steps < 1000, 'clock must settle');
        const entry = [...tasks].filter(([, task]) => task.at <= end).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!entry) break;
        tasks.delete(entry[0]); now = entry[1].at; entry[1].fn(); await flush();
      }
      now = end; await flush();
    }
  };
}

function element(className = '', dataset = {}) {
  let classes = new Set(className.split(/\s+/).filter(Boolean));
  const children = [];
  return {
    dataset, style: {}, textContent: '', innerHTML: '', children,
    get className() { return [...classes].join(' '); },
    set className(value) { classes = new Set(value.split(/\s+/).filter(Boolean)); },
    classList: {
      add(...names) { names.forEach(name => classes.add(name)); },
      remove(...names) { names.forEach(name => classes.delete(name)); },
      contains(name) { return classes.has(name); },
      toggle(name, on) { on ? classes.add(name) : classes.delete(name); }
    },
    appendChild(child) { children.push(child); child.parent = this; },
    remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); },
    addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }
  };
}

async function fixture({language = 'ko', unsupported = false, audio = false} = {}) {
  const time = clock(), utterances = [], audios = [], playedIds = [];
  let cards = [], stage = element(), markup = '', rewardCount = 0, confettiCount = 0, cancelCount = 0, pauseCount = 0;
  const container = {
    get innerHTML() { return markup; },
    set innerHTML(value) {
      markup = value; stage = element('memory-game-container');
      cards = [...value.matchAll(/<button class="([^"]*)"[^>]*data-index="(\d+)" data-card-uid="([^"]*)" data-pair-key="([^"]*)"/g)]
        .map(([, classes, index, cardUid, pairKey]) => element(classes, {index, cardUid, pairKey}));
      if (value.includes('class="memory-success-panel"')) stage.appendChild(element('memory-success-panel'));
    },
    querySelector(selector) {
      const index = selector.match(/^\.memory-card\[data-index="(\d+)"\]$/);
      if (index) return cards[Number(index[1])] || null;
      if (selector === '.memory-game-container') return stage;
      return stage.children.find(child => child.classList.contains(selector.slice(1))) || null;
    },
    querySelectorAll(selector) { return selector === '.memory-card' ? cards : []; }
  };
  const window = {setTimeout: time.setTimeout, clearTimeout: time.clearTimeout,
    innerWidth: 390, innerHeight: 844, addEventListener() {}, removeEventListener() {},
    SihyeonPlaySettings: {getLanguage: () => language}};
  if (!unsupported) window.speechSynthesis = {
    cancel() { cancelCount++; }, getVoices: () => [],
    speak(utterance) { utterances.push(utterance); }
  };
  class TestDate extends Date { static now() { return time.now; } }
  class TestAudio {
    constructor(src) { this.src = src; audios.push(this); }
    play() { return Promise.resolve(); }
    pause() { pauseCount++; }
    removeAttribute() {} load() {}
  }
  const context = vm.createContext({window, document: {createElement: () => element(), getElementById: () => null},
    navigator: {}, console, Date: TestDate, setTimeout: time.setTimeout, clearTimeout: time.clearTimeout,
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } }, Audio: TestAudio,
    fetch: async () => ({ok: true, json: async () => ({voices: {
      'vehicles.fixture_audio.role': './fixture-role.mp3', 'games.memory.complete': './fixture-complete.mp3'
    }})})});
  for (const file of ['js/voice-labels.js', 'js/english-listening.js', 'js/voice-engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, {filename: file});
  }
  const play = window.SihyeonVoice.play;
  window.SihyeonVoice.play = (...args) => { playedIds.push(args[0]); return play(...args); };
  const source = fs.readFileSync(path.join(sourceRoot, 'js/games/vehicle-memory.js'), 'utf8')
    .replace(/\}\)\(\);\s*$/, `window.__pace = {state, normalizeVehicle, handleMemoryCardClick, announceCardRole,
      renderMemoryBoard, handleResize, startRound, clearTimers, destroy,
      setSelection() { selectedCategory = '🚗탈것'; selectedVehicleCategory = 'rescue'; selectedCardCount = 8; }};\n})();`);
  vm.runInContext(source, context, {filename: 'vehicle-memory.js'});
  const api = window.__pace;
  api.setSelection();
  Object.assign(api.state, {container, destroyed: false, vehicles: catalog.map(api.normalizeVehicle),
    options: {gainExp: () => rewardCount++, fireConfetti: () => confettiCount++}});
  api.state.cards = ['ambulance', 'doctor_car', 'rescue_helicopter', 'ambulance'].flatMap((id, pair) => {
    const base = api.normalizeVehicle(catalog.find(vehicle => vehicle.id === id), 0);
    // A short, intelligible banner exercises the established 1.6s no-audio floor.
    if (pair === 0) base.role = '구급차가 와요';
    if (audio && pair === 0) { base.id = 'fixture_audio'; base.baseId = 'fixture_audio'; }
    return ['a', 'b'].map(copy => ({...base, id: `${base.id}-${pair}`, baseId: base.baseId || base.id,
      pairKey: `vehicle:${base.file}`, uid: `${base.id}-${pair}-${copy}`}));
  });
  api.renderMemoryBoard(); await flush();
  async function beginPair(a = 0, b = 1) {
    const previousUtterances = utterances.length;
    api.handleMemoryCardClick(a);
    await flush();
    if (utterances.length > previousUtterances) utterances.at(-1).onend();
    await flush();
    api.handleMemoryCardClick(b);
    await time.advance(360);
    assert.equal(api.state.locked, true, 'matched pair waits for its role voice');
    return audio && a === 0 ? audios.at(-1) : utterances.at(-1);
  }
  return {api, time, window, utterances, audios, playedIds, beginPair, container,
    get cards() { return cards; }, get rewardCount() { return rewardCount; }, get confettiCount() { return confettiCount; },
    get cancelCount() { return cancelCount; }, get pauseCount() { return pauseCount; }};
}

const cases = [];
async function test(name, run) { await run(); cases.push(name); }

(async () => {
  for (const language of ['ko', 'en']) {
    for (const duration of [100, 3200]) {
      await test(`${language} TTS ${duration}ms: callback restores input immediately`, async () => {
        const f = await fixture({language}); const voice = await f.beginPair();
        const cancellations = f.cancelCount;
        await f.time.advance(duration);
        assert.equal(f.api.state.locked, true, 'active voice must not be cut short');
        assert.equal(f.cancelCount, cancellations);
        voice.onend(); await flush();
        assert.equal(f.api.state.locked, false, 'actual speech end must not add another estimated-speech delay');
        assert.equal(f.container.querySelector('.memory-speech-banner'), null);
        assert.equal(f.cancelCount, cancellations, 'completion does not call voice.stop');
        assert.equal(f.api.state.roundTimers.size, 0, 'completed speech clears its watchdog');
        f.api.handleMemoryCardClick(2);
        assert.equal(f.api.state.flipped[0]?.index, 2, 'the very next physical card accepts input');
      });
    }
  }
  await test('recorded audio ended callback restores input immediately', async () => {
    const f = await fixture({audio: true}); const voice = await f.beginPair();
    assert.equal(voice.src, './fixture-role.mp3');
    await f.time.advance(700); const pauses = f.pauseCount;
    voice.onended(); await flush();
    assert.equal(f.api.state.locked, false);
    assert.equal(f.pauseCount, pauses, 'no pause is introduced by fast completion');
  });
  await test('unsupported speech keeps the 1600ms visual guidance floor', async () => {
    const f = await fixture({unsupported: true}); await f.beginPair();
    await f.time.advance(1599); assert.equal(f.api.state.locked, true);
    await f.time.advance(1); assert.equal(f.api.state.locked, false);
    assert.equal(f.api.state.roundTimers.size, 0);
  });
  await test('delayed speech error counts elapsed time toward the visual floor', async () => {
    const f = await fixture(); const voice = await f.beginPair();
    await f.time.advance(900); voice.onerror(); await flush();
    await f.time.advance(699); assert.equal(f.api.state.locked, true);
    await f.time.advance(1); assert.equal(f.api.state.locked, false);
  });
  await test('late speech error adds no second visual delay', async () => {
    const f = await fixture(); const voice = await f.beginPair();
    await f.time.advance(2500); voice.onerror(); await flush();
    assert.equal(f.api.state.locked, false);
  });
  for (const behavior of ['reject', 'throw']) {
    await test(`voice provider ${behavior} safely recovers after visual guidance`, async () => {
      const f = await fixture();
      f.api.handleMemoryCardClick(0); f.utterances.at(-1).onend(); await flush();
      f.window.SihyeonVoice.speak = () => {
        if (behavior === 'throw') throw new Error('unavailable');
        return Promise.reject(new Error('unavailable'));
      };
      f.api.handleMemoryCardClick(1); await f.time.advance(360 + 1599);
      assert.equal(f.api.state.locked, true);
      await f.time.advance(1); assert.equal(f.api.state.locked, false);
    });
  }
  await test('missing end callback recovers at 15s without stopping active speech', async () => {
    const f = await fixture(); const voice = await f.beginPair(); const cancellations = f.cancelCount;
    await f.time.advance(14999); assert.equal(f.api.state.locked, true);
    await f.time.advance(1); assert.equal(f.api.state.locked, false);
    assert.equal(f.cancelCount, cancellations);
    assert.equal(f.api.state.roundTimers.size, 0);
    f.api.handleMemoryCardClick(2); const currentBanner = f.container.querySelector('.memory-speech-banner');
    voice.onend(); await flush();
    assert.equal(f.api.state.flipped.length, 1);
    assert.equal(f.container.querySelector('.memory-speech-banner'), currentBanner, 'late old callback cannot hide the new card label');
  });
  await test('wrong pair stays visible for 900ms and then allows another try', async () => {
    const f = await fixture();
    f.api.handleMemoryCardClick(0); f.utterances.at(-1).onend(); await flush(); f.api.handleMemoryCardClick(2);
    await f.time.advance(899);
    assert.equal(f.api.state.locked, true);
    assert.equal(f.cards.filter(card => card.classList.contains('is-open')).length, 2);
    await f.time.advance(1);
    assert.equal(f.api.state.locked, false); assert.equal(f.api.state.matched, 0);
    assert.equal(f.cards.filter(card => card.classList.contains('is-open')).length, 0);
  });
  await test('rotation reconstructs exactly the matched cards and preserves pending speech', async () => {
    const f = await fixture(); const voice = await f.beginPair(); const oldCard = f.cards[0];
    f.window.innerWidth = 844; f.window.innerHeight = 390; f.api.handleResize(); await f.time.advance(150);
    assert.notEqual(f.cards[0], oldCard);
    assert.equal(f.api.state.layoutMode, 'landscape');
    assert.equal(f.cards.filter(card => card.classList.contains('is-matched')).length, 2);
    assert.equal(f.api.state.locked, true);
    voice.onend(); await flush(); assert.equal(f.api.state.locked, false);
    f.api.handleMemoryCardClick(6); assert.equal(f.api.state.flipped[0]?.index, 6, 'remaining copy of same picture is playable');
  });
  await test('new round cancels pending guidance and ignores its late end callback', async () => {
    const f = await fixture(); const oldVoice = await f.beginPair();
    f.api.startRound(); await flush(); const banner = f.container.querySelector('.memory-speech-banner');
    oldVoice.onend(); await flush();
    assert.equal(f.api.state.matched, 0); assert.equal(f.api.state.isPreviewing, true); assert.equal(f.api.state.locked, true);
    assert.equal(f.container.querySelector('.memory-speech-banner'), banner);
    assert.equal(f.api.state.cancelRoleWait, null);
    await f.time.advance(1800); assert.equal(f.api.state.locked, false);
    await f.time.advance(15000); assert.equal(f.rewardCount, 0);
  });
  await test('destroy clears role watchdog and never awards for an old callback', async () => {
    const f = await fixture(); const oldVoice = await f.beginPair(); f.api.destroy(); await flush();
    assert.equal(f.api.state.cancelRoleWait, null); assert.equal(f.time.tasks.size, 0);
    oldVoice.onend(); await f.time.advance(20000);
    assert.equal(f.api.state.container, null); assert.equal(f.rewardCount, 0);
  });
  for (const transition of ['destroy', 'startRound']) {
    await test(`same-turn ${transition} prevents queued role speech from starting`, async () => {
      const f = await fixture();
      const pending = f.api.announceCardRole(f.api.state.cards[0], false);
      f.api[transition]();
      assert.equal(await pending, null);
      assert.equal(f.utterances.some(utterance => utterance.text === '구급차가 와요'), false,
        'cancelled role must not speak over a new round or after exit');
      assert.equal(f.api.state.cancelRoleWait, null);
      if (transition === 'destroy') assert.equal(f.time.tasks.size, 0);
      else assert.equal(f.api.state.isPreviewing, true);
    });
  }
  await test('complete board celebrates once after actual role end', async () => {
    const f = await fixture(); let lastVoice;
    for (const a of [0, 2, 4, 6]) {
      lastVoice = await f.beginPair(a, a + 1); lastVoice.onend(); await flush();
    }
    assert.equal(f.api.state.matched, 8); assert.equal(f.confettiCount, 1);
    assert.equal(f.playedIds.filter(id => id === 'games.memory.complete').length, 1);
    await f.time.advance(849); assert.equal(f.rewardCount, 0);
    await f.time.advance(1); assert.equal(f.rewardCount, 1); assert.equal(f.api.state.currentScreen, 'success');
    lastVoice.onend(); f.api.handleMemoryCardClick(0); await f.time.advance(20000);
    assert.equal(f.rewardCount, 1); assert.equal(f.confettiCount, 1);
  });
  await test('missing final callback still completes once without interrupting the role', async () => {
    const f = await fixture();
    for (const a of [0, 2, 4]) { const voice = await f.beginPair(a, a + 1); voice.onend(); await flush(); }
    const lastVoice = await f.beginPair(6, 7); const cancellations = f.cancelCount;
    await f.time.advance(15000 + 850);
    assert.equal(f.rewardCount, 1); assert.equal(f.confettiCount, 1);
    assert.equal(f.playedIds.filter(id => id === 'games.memory.complete').length, 0, 'timeout must not start a new voice over an unresolved role');
    assert.equal(f.cancelCount, cancellations);
    lastVoice.onend(); await f.time.advance(20000);
    assert.equal(f.rewardCount, 1); assert.equal(f.confettiCount, 1);
  });
  await test('new round cancels an already scheduled finale', async () => {
    const f = await fixture();
    for (const a of [0, 2, 4, 6]) { const voice = await f.beginPair(a, a + 1); voice.onend(); await flush(); }
    f.api.startRound(); await f.time.advance(850);
    assert.equal(f.api.state.currentScreen, 'game'); assert.equal(f.rewardCount, 0);
    assert.equal(f.api.state.isPreviewing, true);
  });
  console.log(`PASS ${cases.length} memory pace cases: actual Korean/English TTS and audio completion, no post-speech delay, no-audio/error fallback, 15s watchdog, wrong-pair visibility, rotation, stale callbacks and one completion reward.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
