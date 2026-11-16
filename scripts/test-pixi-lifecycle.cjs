'use strict';

// A real game render may finish loading Pixi after its host has been closed.
// It must release that obsolete runtime without drawing or replacing a new game.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/games-pixi/number-vehicles-pixi.js'), 'utf8');
const runtimeSource = fs.readFileSync(path.join(__dirname, '../js/engine/pixi-runtime.js'), 'utf8');

async function retiredAnimation(scale) {
  const window = {};
  vm.runInNewContext(runtimeSource, { window, performance: { now: () => 0 } });
  const runtime = new window.SihyeonPixiRuntime.SihyeonPixiGame({});
  const scheduled = new Set();
  runtime.app = { ticker: { add: fn => scheduled.add(fn), remove: fn => scheduled.delete(fn) } };
  const owner = { destroyed: false };
  const point = {};
  for (const axis of ['x', 'y']) Object.defineProperty(point, axis, {
    get: () => 1,
    set() { if (owner.destroyed) throw new Error('retired Pixi coordinate written'); }
  });
  owner.scale = point;
  Object.defineProperty(owner, 'x', Object.getOwnPropertyDescriptor(point, 'x'));
  const pending = scale ? runtime.successPop(owner) : runtime.tween(owner, { x: 10 });
  assert.equal(scheduled.size, 1);
  owner.destroyed = true;
  owner.scale = null;
  for (const tick of Array.from(scheduled)) tick();
  await pending;
  assert.equal(scheduled.size, 0, 'retired animation must remove its ticker');
  assert.equal(runtime.tickers.size, 0);
}

async function abandonedLoad(reenter) {
  const requests = [];
  const window = { SihyeonPixiRuntime: {
    createGame(container, options) {
      return new Promise(resolve => requests.push({ container, options, resolve }));
    }
  }};
  vm.runInNewContext(source, { window, Math, Map, Set });
  const game = window.SihyeonGames.numberVehiclesPixi;
  const first = { innerHTML: '' };
  const pending = game.render(first);
  game.destroy();
  let secondPending;
  if (reenter) secondPending = game.render({ innerHTML: '' });
  const retired = { destroyed: false, draws: 0,
    destroy() { this.destroyed = true; },
    getMetrics() { return { mode: 'portrait' }; },
    clearAllLayers() { this.draws += 1; throw new Error('obsolete runtime tried to render'); }
  };
  requests[0].resolve(retired);
  await pending;
  assert.equal(retired.draws, 0, 'closed game must not redraw');
  assert.equal(retired.destroyed, true, 'closed game must dispose its late runtime');
  if (reenter) {
    game.destroy();
    const nextRetired = { ...retired, destroyed: false, draws: 0 };
    requests[1].resolve(nextRetired);
    await secondPending;
    assert.equal(nextRetired.draws, 0);
    assert.equal(nextRetired.destroyed, true);
  }
}

(async () => {
  await abandonedLoad(false);
  await abandonedLoad(true);
  await retiredAnimation(false);
  await retiredAnimation(true);
  process.stdout.write('PASS: close/reenter while loading and retired position/scale animations\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
