// Minimal counterexample: execute the actual extracted observers with virtual RAF.
// This is a harness-only model, not a browser or product-quality PASS.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const directory = __dirname;

async function observe(source, frameIntervalMs) {
  let now = 0, nextId = 0, settled = false, value, error;
  const pending = new Map(), events = [];
  const schedule = (kind, callback, delay) => {
    const id = ++nextId;
    pending.set(id, {kind, callback});
    if (delay !== null) events.push({id, at: now + delay});
    return id;
  };
  const icon = {getAnimations: () => []};
  const element = {
    getBoundingClientRect: () => ({x: 10, y: 20, width: 54, height: 54}),
    contains: node => node === element,
    querySelector: selector => { assert.equal(selector, '.dockSvg'); return icon; },
    getAnimations: () => [],
  };
  const context = {
    element,
    performance: {now: () => now},
    document: {elementFromPoint: (x, y) => {
      assert.equal(x, 37); assert.equal(y, 47); return element;
    }},
    requestAnimationFrame: callback => schedule('raf', callback, frameIntervalMs),
    cancelAnimationFrame: id => pending.delete(id),
    setTimeout: (callback, delay) => schedule('timer', callback, delay),
    clearTimeout: id => pending.delete(id),
  };
  const promise = vm.runInNewContext('(' + source + ')(element)', context, {timeout: 1000});
  promise.then(result => { value = result; settled = true; }, failure => { error = failure; settled = true; });
  // A real event-loop boundary flushes both the VM and host Promise microtasks.
  const flush = () => new Promise(resolve => setImmediate(resolve));
  await flush();
  for (let steps = 0; !settled && steps < 64; steps++) {
    events.sort((a, b) => a.at - b.at || a.id - b.id);
    const event = events.find(item => pending.has(item.id));
    if (!event || event.at > 10000) { now = 10000; break; }
    now = event.at;
    const scheduled = pending.get(event.id);
    pending.delete(event.id);
    scheduled.callback(now);
    await flush();
  }
  if (error) throw error;
  const geometryPass = settled && value.samples >= 4 && value.minWidth >= 44 && value.minHeight >= 44
    && value.centerHit && value.maxRectDelta < .1 && value.buttonAnimationCount === 0 && value.iconAnimationCount === 0;
  const contractPass = Boolean(geometryPass && (!('timedOut' in value)
    || (!value.timedOut && value.observationMs >= 1000 && value.rafFrames >= 4)));
  return {settled, virtualFinishedAtMs: now, contractPass, observation: value || null};
}

(async () => {
  const sources = Object.fromEntries(['old', 'new'].map(label => [label, fs.readFileSync(path.join(directory, label + '-observer.js'), 'utf8')]));
  const results = {};
  for (const [scenario, interval] of [['sparse750ms', 750], ['noFrames', null], ['tooSlow3000ms', 3000]]) {
    results[scenario] = {};
    for (const label of ['old', 'new']) results[scenario][label] = await observe(sources[label], interval);
  }
  assert.equal(results.sparse750ms.old.observation.samples, 2);
  assert.equal(results.sparse750ms.old.contractPass, false);
  assert.equal(results.sparse750ms.new.observation.samples, 4);
  assert.equal(results.sparse750ms.new.observation.observationMs, 2250);
  assert.equal(results.sparse750ms.new.contractPass, true);
  assert.equal(results.noFrames.old.settled, false);
  for (const name of ['noFrames', 'tooSlow3000ms']) {
    const current = results[name].new;
    assert.equal(current.settled, true);
    assert.equal(current.virtualFinishedAtMs, 10000);
    assert.equal(current.observation.timedOut, true);
    assert.equal(current.contractPass, false);
  }
  assert.equal(results.noFrames.new.observation.samples, 0);
  assert.equal(results.tooSlow3000ms.new.observation.samples, 3);
  const output = {status: 'PASS_MINIMAL_HARNESS_COUNTEREXAMPLE', fixture: {width: 54, height: 54, centerHit: true, maxRectDelta: 0, buttonAnimations: 0, iconAnimations: 0, preference: 'reduce'}, results,
    limitations: ['Virtual RAF and timer scheduling only; actual extracted observer logic is executed unchanged.', 'Not an actual browser run or proof of any untested geometry.']};
  fs.writeFileSync(path.join(directory, 'results.json'), JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify({status: output.status, sparseOldSamples: results.sparse750ms.old.observation.samples,
    sparseNewSamples: results.sparse750ms.new.observation.samples,
    sparseNewObservationMs: results.sparse750ms.new.observation.observationMs,
    noFrameBoundMs: results.noFrames.new.virtualFinishedAtMs, tooSlowBoundMs: results.tooSlow3000ms.new.virtualFinishedAtMs}));
})().catch(error => { console.error(error); process.exitCode = 1; });
