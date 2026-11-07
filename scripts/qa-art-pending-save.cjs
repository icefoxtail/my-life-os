/* Production-closure regression: saving before asynchronous PNG restore ends.
   Node uses distinct PNG string markers and a controlled Image callback queue.
   This does not claim browser pixel, device, sound, or child-observation coverage. */
'use strict';
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
  'globalThis.qa = { state, restoreFreeImage, saveWork, loadWork, clearWork, undoWork, destroy, bindEvents };');
const ORIGINAL = 'data:image/png;base64,T1JJR0lOQUxfRFJBV0lORw==';
const NEWER = 'data:image/png;base64,TkVXRVJfRFJBV0lORw==';
const BLANK = 'data:image/png;base64,QkxBTktfQ0FOVkFT';
const STROKE = 'data:image/png;base64,TEVHSVQKTkVXX1NUUk9LRQ==';
const WORK_KEY = 'sihyeon-art-work-v1';

function fixture(savedImage = ORIGINAL) {
  const pending = [], operations = [], handlers = {}, timers = new Map();
  const controls = {}, notice = {hidden: true, textContent: ''};
  let pixels = BLANK, shouldThrowDraw = false, nextTimer = 0;
  const store = new Map([[WORK_KEY, JSON.stringify({freeImage:savedImage, templates:{}, activeTemplateId:'police', activeTheme:'white', tab:'free'})]]);
  const canvas = {
    width:400, height:300, style:{}, toDataURL:() => pixels,
    getBoundingClientRect:() => ({left:0,top:0,width:400,height:300}),
    addEventListener:(name,handler) => { handlers[name] = handler; },
    setPointerCapture() {}, hasPointerCapture() {return false;}
  };
  const root = {
    querySelector:selector => controls[selector] || (controls[selector] = {}),
    querySelectorAll:() => []
  };
  const container = {querySelector:selector => selector === '#azRestoreNotice' ? notice : root};
  const context = {
    window:{SihyeonGames:{},removeEventListener(){}},
    document:{getElementById:() => ({getBoundingClientRect:canvas.getBoundingClientRect})},
    localStorage:{getItem:key => store.get(key) || null, setItem:(key,value) => store.set(key,value)},
    navigator:{},
    Image:class {constructor(){pending.push(this);}},
    setTimeout:fn => {timers.set(++nextTimer,fn);return nextTimer;},
    clearTimeout:id => timers.delete(id)
  };
  vm.runInNewContext(testSource, context, {timeout:1000});
  Object.assign(context.qa.state, {
    container, canvas, destroyed:false,
    ctx:{
      clearRect(){pixels=BLANK;operations.push('clear');},
      drawImage(image){if(shouldThrowDraw)throw Error('controlled draw failure');pixels=image.src;operations.push('restore:'+image.src);},
      beginPath(){}, moveTo(){}, arc(){}, closePath(){},
      fill(){pixels=STROKE;operations.push('stroke');}
    }
  });
  context.qa.loadWork(); context.qa.bindEvents();
  return {
    ...context.qa, pending, operations, handlers, notice, canvas,
    stored:() => JSON.parse(store.get(WORK_KEY)),
    pixels:() => pixels,
    failDraw:() => {shouldThrowDraw=true;},
    down:() => handlers.pointerdown({isPrimary:true,pointerId:1,clientX:20,clientY:20,preventDefault(){}}),
    up:() => handlers.pointerup({pointerId:1})
  };
}
const checks = [];
function test(name, body) {
  try {body();checks.push({name,status:'PASS'});}
  catch(error){checks.push({name,status:'FAIL',message:error.message,stack:error.stack});}
}

test('save during initial decode preserves the loaded PNG', () => {
  const f=fixture();f.restoreFreeImage(f.state.freeImage);f.saveWork();
  assert.equal(f.pixels(),BLANK);assert.equal(f.stored().freeImage,ORIGINAL);
  assert.equal(f.state.freeImage,ORIGINAL);assert.equal(f.state.freeCanvasReady,false);
});
test('exit before decode preserves PNG and rejects the late callback', () => {
  const f=fixture();f.restoreFreeImage(f.state.freeImage);f.destroy(false);f.pending[0].onload();
  assert.equal(f.stored().freeImage,ORIGINAL);assert.equal(f.pixels(),BLANK);
  assert.equal(f.state.freeCanvasReady,false);assert.equal(f.state.freeRestorePending,0);
});
test('successful restore enables drawing and later saves the actual new stroke', () => {
  const f=fixture();f.restoreFreeImage(f.state.freeImage);f.pending[0].onload();f.saveWork();
  assert.equal(f.stored().freeImage,ORIGINAL);assert.equal(f.state.freeCanvasReady,true);
  assert.equal(f.state.freeRestorePending,0);assert.equal(f.notice.hidden,true);
  f.down();f.up();assert.equal(f.stored().freeImage,STROKE);
});
test('early drawing does not replace the picture still being loaded', () => {
  const f=fixture();f.restoreFreeImage(f.state.freeImage);const token=f.state.freeRestorePending;
  f.down();f.up();f.saveWork();
  assert.equal(f.state.isDrawing,false);assert.equal(f.state.freeRestorePending,token);
  assert.equal(f.pixels(),BLANK);assert.equal(f.stored().freeImage,ORIGINAL);
  f.pending[0].onload();assert.equal(f.pixels(),ORIGINAL);
});
test('decode error keeps the original and offers explicit new-paper recovery', () => {
  const f=fixture();f.restoreFreeImage(f.state.freeImage);f.pending[0].onerror();f.saveWork();
  assert.equal(f.state.freeRestorePending,0);assert.equal(f.state.freeCanvasReady,false);
  assert.equal(f.state.freeRestoreFailed,true);assert.equal(f.stored().freeImage,ORIGINAL);
  assert.match(f.notice.textContent,/새 종이/);assert.equal(f.notice.hidden,false);
  f.down();assert.equal(f.state.isDrawing,false);
  f.clearWork();assert.equal(f.state.freeCanvasReady,true);assert.equal(f.state.freeRestoreFailed,false);
  assert.equal(f.notice.hidden,true);assert.equal(f.stored().freeImage,BLANK);
  assert.equal(f.state.freeHistory.at(-1),ORIGINAL);
  f.down();f.up();assert.equal(f.stored().freeImage,STROKE);
});
test('destroy and return with the same canvas cannot revive the old callback', () => {
  const f=fixture();f.restoreFreeImage(f.state.freeImage);f.destroy(false);
  f.state.destroyed=false;f.loadWork();f.restoreFreeImage(f.state.freeImage);
  const currentToken=f.state.freeRestorePending;
  f.pending[0].onload();f.pending[0].onerror();
  assert.equal(f.pixels(),BLANK);assert.equal(f.state.freeRestorePending,currentToken);
  assert.equal(f.state.freeCanvasReady,false);assert.equal(f.state.freeRestoreFailed,false);
  f.pending[1].onload();f.saveWork();assert.equal(f.pixels(),ORIGINAL);assert.equal(f.stored().freeImage,ORIGINAL);
});
test('new restore owns saving while older load and error callbacks are ignored', () => {
  const f=fixture();f.restoreFreeImage(ORIGINAL);f.restoreFreeImage(NEWER);
  const token=f.state.freeRestorePending;
  f.pending[0].onerror();f.pending[0].onload();f.saveWork();
  assert.equal(f.state.freeRestorePending,token);assert.equal(f.stored().freeImage,NEWER);
  assert.equal(f.state.freeRestoreFailed,false);assert.equal(f.state.freeCanvasReady,false);
  f.pending[1].onload();f.pending[0].onload();f.saveWork();assert.equal(f.pixels(),NEWER);assert.equal(f.stored().freeImage,NEWER);
});
test('new paper during loading can undo back to the original canonical PNG', () => {
  const f=fixture();f.restoreFreeImage(ORIGINAL);f.clearWork();f.pending[0].onload();
  assert.equal(f.pixels(),BLANK);assert.equal(f.stored().freeImage,BLANK);
  assert.equal(f.state.freeHistory.at(-1),ORIGINAL);assert.equal(f.state.freeCanvasReady,true);
  f.undoWork();f.saveWork();assert.equal(f.stored().freeImage,ORIGINAL);assert.equal(f.state.freeCanvasReady,false);
  f.pending[0].onerror();f.pending[1].onload();assert.equal(f.pixels(),ORIGINAL);assert.equal(f.state.freeCanvasReady,true);
});
test('empty restore cancels pending work and makes an intentional blank writable', () => {
  const f=fixture();f.restoreFreeImage(ORIGINAL);f.restoreFreeImage('');f.pending[0].onload();f.saveWork();
  assert.equal(f.state.freeCanvasReady,true);assert.equal(f.state.freeRestorePending,0);
  assert.equal(f.pixels(),BLANK);assert.equal(f.stored().freeImage,BLANK);
});
test('canvas draw failure protects the source just like decode failure', () => {
  const f=fixture();f.restoreFreeImage(ORIGINAL);f.failDraw();f.pending[0].onload();f.saveWork();
  assert.equal(f.state.freeCanvasReady,false);assert.equal(f.state.freeRestoreFailed,true);
  assert.equal(f.stored().freeImage,ORIGINAL);assert.match(f.notice.textContent,/새 종이/);
});
test('template and mode metadata can still save while free drawing restores', () => {
  const f=fixture();f.restoreFreeImage(ORIGINAL);f.state.tab='coloring';
  f.state.templateWork.police={fills:['#FF4444'],completed:false,history:[]};f.saveWork();
  assert.equal(f.stored().freeImage,ORIGINAL);assert.equal(f.stored().tab,'coloring');
  assert.deepEqual(f.stored().templates.police.fills,['#FF4444']);
});
test('a first visit without a saved drawing stays immediately drawable', () => {
  const f=fixture('');f.restoreFreeImage(f.state.freeImage);
  assert.equal(f.pending.length,0);assert.equal(f.state.freeCanvasReady,true);
  f.down();f.up();assert.equal(f.stored().freeImage,STROKE);
});

const report = {
  suite:'Art pending-save production closure regression',
  sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),
  status:checks.every(check=>check.status==='PASS')?'PASS':'FAIL', checks,
  limits:['Node callback simulation with distinct PNG markers; no actual PNG decoding or browser pixel comparison.', 'Loading touch is intentionally deferred until restore completes; explicit new paper recovers from a decode failure.']
};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(report.status!=='PASS')process.exitCode=1;
