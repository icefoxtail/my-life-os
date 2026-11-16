'use strict';
// Reviewer-owned behavior checks against the actual runtime class; no browser claim.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const source = fs.readFileSync(path.join(root, 'js/engine/pixi-runtime.js'), 'utf8');
const window = {
  devicePixelRatio: 1, innerWidth: 1200, innerHeight: 800,
  matchMedia: () => ({ matches: true }),
  addEventListener() {}, removeEventListener() {}, setTimeout, clearTimeout,
};
vm.runInNewContext(source, { window, performance, Math, Set, Map, Promise });
const Runtime = window.SihyeonPixiRuntime.SihyeonPixiGame;

function runtime(version8 = true) {
  const rt = new Runtime({ innerHTML: 'newer-owner-content' });
  rt.scale = 2;
  rt.app = { ticker: { add() {}, remove() {} }, destroy() {} };
  if (version8) rt.app.init = async () => {};
  return rt;
}

function displayObject() {
  const handlers = new Map();
  return {
    x: 10, y: 20,
    on(name, fn) { handlers.set(name, fn); },
    off(name, fn) { if (handlers.get(name) === fn) handlers.delete(name); },
    emit(name, event) { handlers.get(name)?.(event); }, handlers,
  };
}

function pointers(version8) {
  const rt = runtime(version8), object = displayObject();
  const calls = { start: 0, move: 0, end: 0, cancel: 0 };
  rt.makeDraggable(object, {
    onStart() { calls.start++; }, onMove() { calls.move++; },
    onEnd() { calls.end++; }, onCancel() { calls.cancel++; },
  });
  const event = (pointerId, x, y) => ({ pointerId, global: { x, y } });
  const move = version8 ? 'globalpointermove' : 'pointermove';
  assert(object.handlers.has(move));
  object.emit('pointerdown', event(7, 100, 100));
  object.emit('pointerdown', event(8, 140, 140));
  object.emit(move, event(8, 900, 900));
  object.emit('pointerupoutside', event(8, 900, 900));
  object.emit('pointercancel', event(8, 900, 900));
  assert.deepEqual(calls, { start: 1, move: 0, end: 0, cancel: 0 });
  assert.deepEqual([object.x, object.y], [10, 20]);
  object.emit(move, event(7, 500, 300));
  assert.deepEqual([object.x, object.y], [210, 120]);
  object.emit('pointerupoutside', event(7, 700, 500));
  assert.deepEqual([object.x, object.y], [310, 220]);
  assert.equal(calls.end, 1);
  object.emit('pointerup', event(7, 700, 500));
  assert.equal(calls.end, 1, 'release cannot complete twice');
  object.emit('pointerdown', event(9, 500, 500));
  object.emit('pointercancel', event(9, 520, 540));
  assert.equal(calls.cancel, 1);
  const stopped = [object.x, object.y];
  object.emit(move, event(9, 900, 900));
  assert.deepEqual([object.x, object.y], stopped, 'cancelled gesture cannot move');
  object.__sihyeonDragCleanup();
  assert.equal(object.handlers.size, 0, 'all registered pointer listeners released');
  return { version: version8 ? 8 : 7, secondaryPointerIgnored: true, outsideRelease: true, cancel: true, cleanup: true };
}

function removedParticle() {
  const rt = runtime();
  class Graphics {
    constructor() { this.destroyed = false; this.position = { set: (x, y) => { this.x = x; this.y = y; } }; }
    beginFill() {} drawRoundedRect() {} endFill() {}
    destroy() { this.destroyed = true; }
    get x() { if (this.destroyed) throw new Error('retired particle x accessed'); return this._x; }
    set x(value) { if (this.destroyed) throw new Error('retired particle x mutated'); this._x = value; }
    get y() { if (this.destroyed) throw new Error('retired particle y accessed'); return this._y; }
    set y(value) { if (this.destroyed) throw new Error('retired particle y mutated'); this._y = value; }
  }
  const layer = { children: [], addChild(p) { this.children.push(p); p.parent = this; },
    removeChild(p) { this.children.splice(this.children.indexOf(p), 1); p.parent = null; } };
  rt.PIXI = { Graphics }; rt.layers.fx = layer;
  rt.spawnParticles(20, 30, { count: 1 });
  assert.equal(rt.tickers.size, 1);
  rt.clearLayer('fx');
  for (const tick of Array.from(rt.tickers)) tick();
  assert.equal(rt.tickers.size, 0, 'retired particle must release its ticker');
  return { removedDuringAnimation: true, retiredObjectAccess: false, remainingTickers: 0 };
}

function newerHostOwner() {
  const rt = runtime(), host = rt.container;
  rt.destroy(); rt.destroy();
  assert.equal(host.innerHTML, 'newer-owner-content', 'retired runtime must not wipe another owner');
  assert.equal(rt.destroyed, true); assert.equal(rt.tickers.size, 0);
  return { idempotentDestroy: true, otherOwnerPreserved: true };
}

const checks = [];
for (const [name, fn] of [['Pixi 8 pointers', () => pointers(true)], ['Pixi 7 pointers', () => pointers(false)],
  ['retired particles', removedParticle], ['shared host ownership', newerHostOwner]]) {
  try { checks.push({ name, status: 'PASS', detail: fn() }); }
  catch (error) { checks.push({ name, status: 'FAIL', error: String(error) }); }
}
const report = { reviewer: '/root/live_status', sourceSha256: crypto.createHash('sha256').update(source).digest('hex'),
  scope: 'actual runtime behavior in Node VM, not browser input', checks };
console.log(JSON.stringify(report, null, 2));
process.exitCode = checks.every(row => row.status === 'PASS') ? 0 : 1;
