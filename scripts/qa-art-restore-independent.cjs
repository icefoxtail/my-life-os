/* Deterministic asynchronous restore race checks against the production closure.
   This is a Node callback simulation, not a browser or canvas-pixel test. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const sourcePath = path.join(__dirname, '../js/games/art-zone.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const marker = 'window.SihyeonGames[GAME_KEY] = { render, destroy };';
assert(source.includes(marker), 'production export marker changed; review test access');
const testSource = source.replace(marker,
  'globalThis.qa = { state, restoreFreeImage, clearWork, destroy, bindEvents };');

function fixture() {
  const pending = [], draws = [], operations = [], handlers = {};
  const controls = {};
  const root = {
    querySelector: selector => controls[selector] || (controls[selector] = {}),
    querySelectorAll: () => []
  };
  const canvas = {
    width: 400, height: 300, style: {},
    toDataURL: () => 'data:image/png;base64,fixture',
    getBoundingClientRect: () => ({left: 0, top: 0, width: 400, height: 300}),
    addEventListener: (name, handler) => { handlers[name] = handler; },
    setPointerCapture: () => {}
  };
  const context = {
    window: {SihyeonGames: {}, removeEventListener: () => {}},
    document: {getElementById: () => ({getBoundingClientRect: canvas.getBoundingClientRect})},
    localStorage: {setItem: () => {}}, navigator: {},
    Image: class { constructor() { pending.push(this); } },
    setTimeout, clearTimeout
  };
  vm.runInNewContext(testSource, context, {timeout: 1000});
  Object.assign(context.qa.state, {
    canvas, container: {querySelector: () => root}, tab: 'free', destroyed: false,
    ctx: {
      clearRect: () => operations.push('clear'),
      drawImage: image => { draws.push(image.src); operations.push('restore:' + image.src); },
      beginPath: () => {}, moveTo: () => {}, arc: () => {},
      fill: () => operations.push('stroke'), closePath: () => {}
    }
  });
  return {...context.qa, pending, draws, operations, handlers};
}

const checks = [];
function test(name, body) {
  body(); checks.push({name, status: 'PASS'});
}

test('newest restore wins when image callbacks finish in reverse order', () => {
  const f = fixture();
  f.restoreFreeImage('older'); f.restoreFreeImage('newer');
  f.pending[1].onload(); f.pending[0].onload();
  assert.deepEqual(f.draws, ['newer']);
});

test('new paper invalidates a pending restore', () => {
  const f = fixture();
  f.restoreFreeImage('old-picture'); f.clearWork(); f.pending[0].onload();
  assert.deepEqual(f.draws, []);
  assert.equal(f.operations.at(-1), 'clear');
});

test('a pointer stroke waits for the pending picture and works after restore', () => {
  const f = fixture(); f.bindEvents();
  f.restoreFreeImage('old-picture');
  f.handlers.pointerdown({isPrimary: true, pointerId: 1, clientX: 25, clientY: 30, preventDefault() {}});
  assert.equal(f.state.isDrawing, false, 'loading touch must not replace the saved picture');
  assert.equal(f.operations.includes('stroke'), false);
  f.pending[0].onload();
  assert.deepEqual(f.draws, ['old-picture']);
  f.handlers.pointerdown({isPrimary: true, pointerId: 2, clientX: 25, clientY: 30, preventDefault() {}});
  assert.equal(f.operations.at(-1), 'stroke');
});

test('destroy invalidates callbacks even if a new lifecycle reuses the canvas', () => {
  const f = fixture();
  f.restoreFreeImage('old-picture'); f.destroy(false);
  f.state.destroyed = false;
  f.pending[0].onload();
  assert.deepEqual(f.draws, []);
});

test('an empty newer restore request cancels the older pending request', () => {
  const f = fixture();
  f.restoreFreeImage('old-picture'); f.restoreFreeImage(''); f.pending[0].onload();
  assert.deepEqual(f.draws, []);
});

test('ordinary current restore still draws the requested picture', () => {
  const f = fixture();
  f.restoreFreeImage('current-picture'); f.pending[0].onload();
  assert.deepEqual(f.draws, ['current-picture']);
});

const report = {
  suite: 'Independent art asynchronous restore QA',
  sourceSha256: crypto.createHash('sha256').update(source).digest('hex'),
  status: 'PASS', checks,
  limits: ['Node callback simulation only; no browser canvas pixels, touch device, or child observation is claimed.']
};
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
