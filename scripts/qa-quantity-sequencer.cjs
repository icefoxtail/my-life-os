/* Deterministic controller tests using fake voice promises; not audible-device QA. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname, '../js/quantity-sequencer.js'), 'utf8');

function fixture() {
  let lang = 'ko';
  const listeners = new Set();
  const window = {
    SihyeonPlaySettings: { getLanguage: () => lang },
    addEventListener(type, fn) { if (type === 'sihyeon-settings-change') listeners.add(fn); },
    removeEventListener(type, fn) { if (type === 'sihyeon-settings-change') listeners.delete(fn); }
  };
  vm.runInNewContext(source, { window, setTimeout, clearTimeout, console });
  return { api: window.SihyeonQuantitySequencer, listeners,
    setLanguage(value) { lang = value; [...listeners].forEach(fn => fn()); } };
}

function fakeVoice(mode = 'deferred') {
  let generation = 0;
  let active = null;
  const calls = [];
  const api = {
    calls, stopCount: 0,
    stop() { generation += 1; api.stopCount += 1; if (active) { active.resolve(false); active = null; } },
    debugStatus() { return { requestGeneration: generation }; },
    speak(text, options) {
      api.stop();
      let resolve;
      const promise = new Promise(done => { resolve = done; });
      const call = { text, options, resolve, generation };
      calls.push(call);
      active = call;
      if (mode === 'success') { active = null; resolve(true); }
      if (mode === 'failure') { active = null; resolve(false); }
      return promise;
    }
  };
  return api;
}

const tick = () => new Promise(resolve => setImmediate(resolve));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(predicate) {
  const deadline = Date.now() + 250;
  while (!predicate()) {
    if (Date.now() > deadline) throw Error('Expected asynchronous controller state did not arrive.');
    await sleep(1);
  }
}
const steps = [
  { id: 'one', text: '하나', nativeText: '하나', sinoText: '일', enText: 'one' },
  { id: 'two', text: '둘', nativeText: '둘', sinoText: '이', enText: 'two' }
];

(async function () {
  {
    const f = fixture();
    const voice = fakeVoice();
    const seen = [];
    const ended = [];
    const c = f.api.create({ voice, timeoutMs: 100, fallbackMs: 0 });
    const done = c.start(steps, { delayMs: 0, onStep: step => seen.push(step.id), onEnd: result => ended.push(result.status) });
    assert.equal(c.isRunning(), true);
    assert.deepEqual(seen, ['one']);
    assert.equal(voice.calls.length, 1, 'the second object must wait for the first utterance');
    assert.equal(voice.calls[0].options.shouldPlay(), true);
    voice.calls[0].resolve(true);
    await until(() => voice.calls.length === 2);
    assert.deepEqual(seen, ['one', 'two']);
    voice.calls[1].resolve(true);
    const result = await done;
    assert.equal(result.status, 'completed');
    assert.equal(result.completedSteps, 2);
    assert.equal(result.audioSucceeded, 2);
    assert.equal(result.audioFailed, 0);
    assert.deepEqual(ended, ['completed']);
    assert.equal(c.isRunning(), false);
    assert.equal(f.listeners.size, 0);
  }
  {
    const f = fixture();
    const voice = fakeVoice();
    const seen = [];
    const ends = [];
    const c = f.api.create({ voice, timeoutMs: 50, fallbackMs: 0 });
    const old = c.start(steps, { delayMs: 0, onStep: step => seen.push(step.id), onEnd: () => ends.push('old') });
    const oldCall = voice.calls[0];
    const fresh = c.start([{ id: 'fresh', text: '아홉', enText: 'nine' }], { onStep: step => seen.push(step.id), onEnd: () => ends.push('fresh') });
    const cancelled = await old;
    assert.equal(cancelled.status, 'cancelled');
    assert.equal(cancelled.reason, 'replaced');
    assert.equal(oldCall.options.shouldPlay(), false);
    oldCall.resolve(true);
    await tick();
    assert.deepEqual(seen, ['one', 'fresh']);
    voice.calls[1].resolve(true);
    const result = await fresh;
    assert.equal(result.audioSucceeded, 1);
    assert.deepEqual(ends, ['fresh']);
  }
  {
    const f = fixture();
    const voice = fakeVoice();
    const errors = [];
    const seen = [];
    const c = f.api.create({ voice, timeoutMs: 5, fallbackMs: 0 });
    const result = await c.start(steps, { delayMs: 0, onStep: step => seen.push(step.id), onError: error => errors.push(error.code) });
    assert.equal(result.status, 'completed');
    assert.equal(result.audioFailed, 2);
    assert.equal(result.audioTimedOut, 1);
    assert.equal(result.audioAttempted, 1, 'one hung engine must not add another timeout for every object');
    assert.equal(result.audioSucceeded, 0);
    assert.deepEqual(seen, ['one', 'two']);
    assert.deepEqual(errors, ['AUDIO_TIMEOUT', 'AUDIO_SKIPPED_AFTER_TIMEOUT']);
    voice.calls.forEach(call => call.resolve(true));
    await tick();
    assert.equal(c.getSnapshot().audioSucceeded, 0, 'late audio completion cannot change a finished run');
    assert.equal(f.listeners.size, 0);
  }
  {
    const f = fixture();
    const voice = fakeVoice('success');
    const seen = [];
    const c = f.api.create({ voice, fallbackMs: 1 });
    const result = await c.start(steps, { muted: true, delayMs: 0, onStep: step => seen.push(step.id) });
    assert.deepEqual(seen, ['one', 'two']);
    assert.equal(result.status, 'completed');
    assert.equal(result.muted, true);
    assert.equal(result.audioAttempted, 0);
    assert.equal(result.audioFailed, 0);
    assert.equal(voice.calls.length, 0);
    assert.equal(voice.stopCount, 0);
  }
  {
    const f = fixture();
    const voice = fakeVoice();
    const errors = [];
    const c = f.api.create({ voice, timeoutMs: 5, fallbackMs: 80 });
    const pending = c.start(steps, { onError: error => errors.push(error.code) });
    await until(() => errors.length === 1);
    voice.speak('A newer voice during visual fallback', {});
    const stopsBefore = voice.stopCount;
    c.stop();
    const result = await pending;
    assert.equal(result.status, 'cancelled');
    assert.equal(voice.stopCount, stopsBefore, 'fallback no longer owns the global audio request');
    voice.calls.at(-1).resolve(true);
  }
  {
    const f = fixture();
    const voice = fakeVoice('failure');
    const c = f.api.create({ voice, fallbackMs: 0 });
    const result = await c.start(steps, { delayMs: 0 });
    assert.equal(result.status, 'completed');
    assert.equal(result.completedSteps, 2);
    assert.equal(result.audioFailed, 2);
    assert.equal(result.audioSucceeded, 0);
  }
  {
    const f = fixture();
    const voice = fakeVoice('success');
    const c = f.api.create({ voice, fallbackMs: 0 });
    await c.start(steps.map(step => ({ ...step, readingStyle: 'sino' })), { delayMs: 0 });
    assert.deepEqual(voice.calls.map(call => call.text), ['일', '이']);
    f.setLanguage('en');
    const result = await c.start(steps, { delayMs: 0 });
    assert.equal(result.language, 'en');
    assert.deepEqual(voice.calls.slice(2).map(call => call.text), ['one', 'two']);
    assert(voice.calls.slice(2).every(call => call.options.lang === 'en-US'));
    const missing = await c.start([{ text: '열다섯' }], { delayMs: 0 });
    assert.equal(missing.audioFailed, 1);
    assert.equal(missing.audioAttempted, 0, 'never send Korean text to the English voice');
  }
  {
    const f = fixture();
    const voice = fakeVoice();
    const seen = [];
    const c = f.api.create({ voice, timeoutMs: 100 });
    const pending = c.start(steps, { onStep: step => seen.push(step.id) });
    f.setLanguage('en');
    const result = await pending;
    assert.equal(result.status, 'cancelled');
    assert.equal(result.reason, 'language-changed');
    assert.equal(voice.calls[0].options.shouldPlay(), false);
    assert.deepEqual(seen, ['one']);
    assert.equal(f.listeners.size, 0);
  }
  {
    const f = fixture();
    const voice = fakeVoice();
    const c = f.api.create({ voice, timeoutMs: 100 });
    const pending = c.start(steps);
    voice.speak('A newer game', {});
    const result = await pending;
    assert.equal(result.status, 'cancelled');
    assert.equal(result.reason, 'voice-interrupted');
    assert.equal(voice.calls.length, 2, 'the old sequence must not resume over another game');
    assert.equal(voice.stopCount, 2, 'do not stop another game\'s newer voice');
    voice.calls[1].resolve(true);
  }
  {
    const f = fixture();
    const voice = fakeVoice('success');
    const c = f.api.create({ voice, fallbackMs: 0 });
    const empty = await c.start([]);
    assert.equal(empty.status, 'completed');
    assert.equal(empty.totalSteps, 0);
    assert.equal(voice.calls.length, 0);
    assert.throws(() => c.start([null]), /step objects/);
    const failed = await c.start(steps, { onStep() { throw Error('render failed'); } });
    assert.equal(failed.status, 'error');
    assert.equal(failed.completedSteps, 0);
    assert.equal(voice.calls.length, 0);
    const seen = [];
    const pending = c.start(steps, { muted: true, onStep: step => seen.push(step.id) });
    c.stop();
    const cancelled = await pending;
    assert.equal(cancelled.status, 'cancelled');
    await sleep(2);
    assert.deepEqual(seen, ['one']);
    assert.equal(f.listeners.size, 0);
  }
  console.log('PASS: sequential completion, replacement and late callbacks, bounded audio timeout, muted visuals, explicit failure, KO/Sino/EN wording, language cancellation, shared-voice interruption, empty state and teardown. Device speech audibility NOT_RUN.');
})().catch(error => { console.error(error); process.exitCode = 1; });
