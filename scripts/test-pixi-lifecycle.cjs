'use strict';

// A real game render may finish loading Pixi after its host has been closed.
// It must release that obsolete runtime without drawing or replacing a new game.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/games-pixi/number-vehicles-pixi.js'), 'utf8');

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
  process.stdout.write('PASS: close during Pixi load and close/reenter during Pixi load\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
