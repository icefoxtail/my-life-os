/* Execute the actual Number Kingdom sound handler with the actual shared voice
 * engine. Native speech is held by a deterministic device stub: these assertions
 * verify cancellation/queue behavior, not audible output or a physical device. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const file = process.argv[2] || path.join(root, 'games/number-kingdom-3d.html');
const html = fs.readFileSync(file, 'utf8');
const source = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1]).find(script => script.includes('function sayNumber('));
assert.ok(source, 'actual Number Kingdom script exists');
new vm.Script(source, {filename: file});

function functionSource(name) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf('\nfunction ', start + 1);
  assert.ok(start >= 0 && end > start, `actual function ${name} exists`);
  return source.slice(start, end);
}
function constant(name) {
  const match = source.match(new RegExp(`^const ${name} = .+;$`, 'm'));
  assert.ok(match, `actual constant ${name} exists`);
  return match[0];
}
const soundStart = source.indexOf('  function updateSoundButton(){');
const soundEnd = source.indexOf("  $('reset').onclick", soundStart);
assert.ok(soundStart >= 0 && soundEnd > soundStart, 'actual sound-button binding exists');
const dispose = source.match(/  dispose: \(\) => \{([\s\S]*?)\n  \}\n\};\n(window\.Sihyeon2DFallback\.ready\([^\n]+);/);
assert.ok(dispose, 'actual disposal and fallback registration exist');
const engineFile = path.join(root, 'js/voice-engine.js');
const engineSource = fs.readFileSync(engineFile, 'utf8');

function nativeSpeech() {
  return {
    utterances: [], cancels: 0,
    getVoices() { return []; },
    cancel() { this.cancels++; },
    speak(utterance) { this.utterances.push(utterance); }
  };
}
const utteranceClass = function SpeechSynthesisUtterance(text) { this.text = text; };
function fixture({embedded, engine}) {
  const localNative = nativeSpeech();
  const win = {
    speechSynthesis: localNative, addEventListener() {}, removeEventListener() {},
    visualViewport: {removeEventListener() {}}
  };
  const host = embedded ? {
    speechSynthesis: nativeSpeech(), addEventListener() {}, removeEventListener() {}
  } : win;
  win.parent = host;
  host.SihyeonPlaySettings = {getLanguage: () => 'ko'};
  const counters = {engineStops: 0, suspended: 0, resumed: 0, rendererDisposed: 0};
  const speechPromises = [];
  if (engine) {
    const hostContext = vm.createContext({window: host, console, Promise,
      SpeechSynthesisUtterance: utteranceClass,
      fetch: async () => ({ok: true, json: async () => ({voices: {}})})});
    vm.runInContext(engineSource, hostContext, {filename: engineFile});
    const actualStop = host.SihyeonVoice.stop;
    host.SihyeonVoice.stop = () => { counters.engineStops++; return actualStop(); };
    const actualSpeak = host.SihyeonVoice.speak;
    host.SihyeonVoice.speak = (...args) => {
      const result = actualSpeak(...args); speechPromises.push(result); return result;
    };
  }
  const button = {attributes: {}, style: {},
    setAttribute(name, value) { this.attributes[name] = value; }};
  const state = {sound: true, destroyed: false, soundCtx: {
    suspend() { counters.suspended++; return Promise.resolve(); },
    resume() { counters.resumed++; return Promise.resolve(); }
  }};
  let fallbackDispose;
  win.Sihyeon2DFallback = {ready(kind, callback) {
    assert.equal(kind, 'numbers'); fallbackDispose = callback;
  }};
  const context = vm.createContext({window: win, console, state, Promise,
    SpeechSynthesisUtterance: utteranceClass,
    $: id => { assert.equal(id, 'sound'); return button; },
    nkLayoutObserver: {disconnect() {}}, onResize() {},
    saveWorldNow() {}, saveWorldOnLeave() {}, saveWorldOnHidden() {},
    document: {removeEventListener() {}},
    renderer: {dispose() { counters.rendererDisposed++; }}
  });
  vm.runInContext([
    constant('SINO_NAMES'), constant('PURE_KOREAN'),
    ...['getSinoName', 'getPureKoreanName', 'getTapCountLabel', 'sayNumber', 'stopSpeech'].map(functionSource),
    source.slice(soundStart, soundEnd),
    `window.NumberKingdomDebug = {dispose: () => {${dispose[1]}\n}};`,
    dispose[2] + ';',
    'globalThis.game = {sayNumber, stopSpeech};'
  ].join('\n'), context);
  return {state, button, counters, host, localNative, speechPromises,
    spoken: (engine ? host.speechSynthesis : localNative).utterances,
    say: context.game.sayNumber, click: () => button.onclick(),
    dispose: () => fallbackDispose()};
}

// Flush promise chains without timers or a synthetic speech-end event. The device
// may omit onend when cancel is called; engine.stop must settle the queue itself.
async function flush() { for (let i = 0; i < 15; i++) await Promise.resolve(); }
const checks = [];
async function verifyEngine(embedded) {
  const f = fixture({embedded, engine: true});
  const label = embedded ? 'parent shared engine' : 'standalone shared engine';
  assert.equal(f.say(3), true);
  assert.equal(f.spoken.length, 1);
  assert.equal(f.spoken[0].text, '셋');
  const oldSpeech = f.spoken[0];
  const before = {generation: f.host.SihyeonVoice.debugStatus().requestGeneration,
    hostCancels: f.host.speechSynthesis.cancels, localCancels: f.localNative.cancels};
  let speechOutcome = 'pending';
  f.speechPromises[0].then(value => { speechOutcome = value; });
  f.click();
  assert.equal(f.state.sound, false);
  assert.equal(f.button.attributes['aria-pressed'], 'false');
  assert.equal(f.counters.engineStops, 1, `${label}: mute must call actual engine.stop immediately`);
  assert.ok(f.host.SihyeonVoice.debugStatus().requestGeneration > before.generation);
  assert.ok(f.host.speechSynthesis.cancels > before.hostCancels);
  assert.ok(f.localNative.cancels > before.localCancels, 'local native fallback is also cancelled');
  assert.equal(f.counters.suspended, 1);
  await flush();
  assert.equal(speechOutcome, false, 'mute settles pending speech without waiting for native onend');
  assert.equal(f.say(4), false, 'muted new actions cannot speak');
  f.click();
  assert.equal(f.state.sound, true);
  assert.equal(f.button.attributes['aria-pressed'], 'true');
  oldSpeech.onend(); oldSpeech.onerror();
  await flush();
  assert.equal(f.spoken.length, 1, 'unmute and stale callbacks must not replay');
  assert.equal(f.counters.resumed, 0, 'unmute alone does not resume suspended sound');
  assert.equal(f.say(5), true, 'new user action may speak after unmute');
  assert.equal(f.spoken[1].text, '다섯');
  f.spoken[1].onend();
  assert.equal(await f.speechPromises[1], true);
  checks.push(`${label}: immediate mute, silent unmute, new action only`);

  let sequenceOutcome = 'pending';
  f.host.SihyeonVoice.playSequence([['', '첫 번째'], ['', '두 번째']],
    {allowTtsFallback: true}).then(value => { sequenceOutcome = value; });
  await flush();
  assert.equal(f.spoken.length, 3);
  assert.equal(f.spoken[2].text, '첫 번째');
  const queuedSpeech = f.spoken[2];
  f.click(); f.click(); // mute, then unmute before the old promise chain drains
  queuedSpeech.onend(); queuedSpeech.onerror();
  await flush();
  assert.equal(sequenceOutcome, false, 'engine generation invalidates the old sequence');
  assert.equal(f.spoken.length, 3, 'old sequence never starts its second utterance');
  checks.push(`${label}: stale sequence callbacks do not resume`);

  f.say(6);
  const dyingSpeech = f.spoken[3];
  let disposalOutcome = 'pending';
  f.speechPromises.at(-1).then(value => { disposalOutcome = value; });
  const stopCount = f.counters.engineStops;
  f.dispose(); // callback actually registered with the 2D companion's ready()
  assert.equal(f.state.destroyed, true);
  assert.equal(f.counters.engineStops, stopCount + 1);
  assert.equal(f.counters.rendererDisposed, 1);
  dyingSpeech.onend(); dyingSpeech.onerror();
  await flush();
  assert.equal(disposalOutcome, false);
  assert.equal(f.say(7), false);
  assert.equal(f.spoken.length, 4, 'disposed scene cannot start more speech');
  checks.push(`${label}: registered fallback disposal stops speech and rejects stale actions`);
}

function verifyNative(embedded) {
  const f = fixture({embedded, engine: false});
  const label = embedded ? 'iframe native fallback' : 'standalone native fallback';
  assert.equal(f.say(3), true);
  assert.equal(f.spoken.length, 1);
  const cancelCount = f.localNative.cancels;
  f.click();
  assert.ok(f.localNative.cancels > cancelCount, `${label}: mute cancels the actual local fallback`);
  assert.equal(f.say(4), false);
  f.click();
  assert.equal(f.spoken.length, 1, 'unmute does not enqueue speech');
  assert.equal(f.say(5), true);
  assert.equal(f.spoken.length, 2);
  const beforeDispose = f.localNative.cancels;
  f.dispose();
  assert.ok(f.localNative.cancels > beforeDispose);
  assert.equal(f.say(6), false);
  checks.push(`${label}: immediate mute, no replay, disposal cancellation`);
}

(async () => {
  await verifyEngine(true);
  await verifyEngine(false);
  verifyNative(true);
  verifyNative(false);
  console.log(JSON.stringify({status: 'PASS', checks: checks.length, scenarios: checks,
    evidence: 'Actual game bindings/dispose + actual shared voice engine; deterministic native speech device stub; no audible QA',
    sourceSha256: Object.fromEntries([file, engineFile].map(name => [name,
      crypto.createHash('sha256').update(fs.readFileSync(name)).digest('hex')]))}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
