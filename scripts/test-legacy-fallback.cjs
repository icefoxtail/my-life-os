/* Fault injection for the dependency/GPU/storage boundary, without a browser.
 * This cannot establish real WebGL rendering, touch behavior or visual layout. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname,'../js/engine/webgl-fallback.js'),'utf8');

function fixture({webgl=false,script='error',saved=null,storageDenied=false,search=''}={}) {
  const elements = new Map();
  const requestedScripts = [];
  const storage = new Map();
  const listeners = new Map();
  if (saved !== null) storage.set('sihyeon-2d-blocks-v1-numbers',JSON.stringify(saved));
  let probes = 0;
  function node(tag) {
    return {
      tagName:tag,style:{},dataset:{},innerHTML:'',
      addEventListener(name,handler) { this[name] = handler; },
      contains() { return true; },
      remove() { elements.delete(this.id); },
      appendChild(child) {
        if (child.id) elements.set(child.id,child);
        if (child.tagName === 'script') {
          requestedScripts.push(child.src);
          queueMicrotask(() => {
            if (script === 'success') { win.THREE = {}; child.onload?.(); }
            else child.onerror?.();
          });
        }
      },
      getContext() { probes++; return webgl ? {getExtension:()=>({loseContext(){}})} : null; }
    };
  }
  const document = {getElementById:id=>elements.get(id),createElement:node,head:node('head'),body:node('body')};
  const win = {
    location:{search},
    addEventListener(name,fn) { listeners.set(name,fn); }
  };
  win.parent = win;
  const localStorage = {
    getItem(key) { if(storageDenied) throw Error('Denied'); return storage.get(key)||null; },
    setItem(key,value) { if(storageDenied) throw Error('Denied'); storage.set(key,value); }
  };
  vm.runInNewContext(source,{window:win,document,localStorage,URLSearchParams,setTimeout,clearTimeout});
  return {api:win.Sihyeon2DFallback,elements,requestedScripts,storage,listeners,probes:()=>probes,node};
}

(async () => {
  let f = fixture();
  assert.equal(await f.api.prepare('numbers'),false);
  assert.equal(f.requestedScripts.length,0,'no network dependency is attempted without WebGL');
  assert.match(f.elements.get('sihyeon-2d-root').innerHTML,/숫자 블록 놀이/);
  assert.match(f.elements.get('sihyeon-2d-root').innerHTML,/data-action="merge"/);

  f = fixture({webgl:true});
  assert.equal(await f.api.prepare('hangul'),false);
  assert.equal(f.requestedScripts.length,2,'both dependency errors lead to a usable fallback');
  assert.equal(f.elements.has('sihyeon-3d-loading'),false,'loading screen does not trap play');
  assert.match(f.elements.get('sihyeon-2d-root').innerHTML,/data-action="join"/);

  f = fixture({webgl:true,script:'success'});
  assert.equal(await f.api.prepare('numbers'),true,'working GPU/dependency keeps the original 3D game');
  assert.equal(f.elements.has('sihyeon-2d-root'),false);
  assert.equal(f.requestedScripts.length,1);
  const canvas = f.node('canvas');canvas.id='scene3d';f.elements.set(canvas.id,canvas);
  f.api.ready('numbers',()=>{throw Error('Lost GPU cannot dispose');});
  assert.equal(f.elements.has('sihyeon-3d-loading'),false);
  let prevented = false;
  canvas.webglcontextlost({preventDefault(){prevented=true;}});
  assert.equal(prevented,true);
  assert.match(f.elements.get('sihyeon-2d-root').innerHTML,/숫자 블록 놀이/,'renderer cleanup failure cannot block fallback');

  f = fixture({webgl:true,search:'?view=2d'});
  assert.equal(await f.api.prepare('numbers'),false);
  assert.equal(f.probes(),0,'intentional 2D entry does not allocate a GPU context');

  f = fixture({storageDenied:true});
  assert.equal(await f.api.prepare('numbers'),false);
  assert.match(f.elements.get('sihyeon-2d-root').innerHTML,/모두 5개/);
  assert.doesNotThrow(()=>f.listeners.get('pagehide')());

  f = fixture({saved:{blocks:[null]}});
  assert.equal(await f.api.prepare('numbers'),false);
  assert.match(f.elements.get('sihyeon-2d-root').innerHTML,/모두 5개/,'invalid saved data uses a valid initial board');

  f = fixture({saved:{blocks:[{value:11},{value:9}],sound:false}});
  assert.equal(await f.api.prepare('numbers'),false);
  assert.match(f.elements.get('sihyeon-2d-root').innerHTML,/모두 20개/);
  assert.match(f.elements.get('sihyeon-2d-root').innerHTML,/소리 켜기/);
  const restored = JSON.parse(f.storage.get('sihyeon-2d-blocks-v1-numbers'));
  assert.equal(restored.blocks[0].value,11);
  assert.equal(restored.blocks[1].value,9);
  console.log('PASS 7 fault-boundary scenarios: unavailable GPU, two CDN errors, working 3D, context loss, explicit 2D, denied storage, invalid and restored progress.');
})().catch(error=>{console.error(error);process.exitCode=1;});
