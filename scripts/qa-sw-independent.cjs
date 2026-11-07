/* Independent service-worker contract checks; no browser/network emulation claim. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const repo = path.resolve(__dirname,'..');
const source = fs.readFileSync(path.join(repo,'sw.js'),'utf8');
const later = () => new Promise(resolve=>setImmediate(resolve));

function fixture() {
  const handlers = new Map();
  const requested=[],written=[],deleted=[];
  let fetching=0,maxFetching=0,putting=0,maxPutting=0,skipped=0,claimed=0;
  const cache = {async put(asset) {
    putting++;maxPutting=Math.max(maxPutting,putting);
    await later();putting--;
    if(asset==='put-fails')throw Error('storage quota');
    written.push(asset);
  }};
  const self = {
    addEventListener:(event,callback)=>handlers.set(event,callback),
    skipWaiting:()=>{skipped++;},clients:{claim:()=>{claimed++;}}
  };
  const caches = {
    open:async()=>cache,
    keys:async()=>[self.__swTest.CACHE_NAME,'sihyeon-play-os-v0','sihyeon-play-os-v1-old','ap-math-os-v5','archive-v2','sihyeon-play-other','random-cache'],
    delete:async name=>{deleted.push(name);return true;}
  };
  async function fetch(asset,options) {
    assert.equal(options.cache,'reload');
    requested.push(asset);fetching++;maxFetching=Math.max(maxFetching,fetching);
    await later();fetching--;
    if(asset==='fetch-fails')throw Error('network unavailable');
    return {ok:asset!=='not-found'};
  }
  vm.runInNewContext(source+'\nself.__swTest={safeCacheAssets,ASSETS,CACHE_NAME};',{self,caches,fetch});
  return {self,handlers,cache,requested,written,deleted,metrics:()=>({maxFetching,maxPutting,skipped,claimed})};
}

(async()=>{
  let f=fixture(),installPromise;
  f.handlers.get('install')({waitUntil:promise=>{installPromise=promise;}});
  await installPromise;
  const assetCount=f.self.__swTest.ASSETS.length;
  assert.equal(f.requested.length,assetCount);
  assert.equal(f.written.length,assetCount);
  assert.equal(new Set(f.requested).size,assetCount,'each declared asset should be visited once');
  assert.equal(f.metrics().maxFetching,4,'the full install actually overlaps exactly four fetches');
  assert.ok(f.metrics().maxPutting<=4,'body consumption/storage is bounded by the worker pool too');
  assert.equal(f.metrics().skipped,1);
  const fullInstall={assets:assetCount,...f.metrics()};

  f=fixture();
  await f.self.__swTest.safeCacheAssets(f.cache,['first','fetch-fails','second','not-found','put-fails','last']);
  assert.equal(f.requested.length,6,'a failed optional asset cannot stop later work');
  assert.deepEqual(f.written.sort(),['first','last','second']);
  assert.ok(f.metrics().maxFetching<=4);
  const failures={requested:f.requested,written:f.written,...f.metrics()};

  for(const count of [0,1,3,4,5,17]){
    f=fixture();
    await f.self.__swTest.safeCacheAssets(f.cache,Array.from({length:count},(_,i)=>String(i)));
    assert.equal(f.written.length,count);
    assert.equal(f.metrics().maxFetching,Math.min(4,count));
  }

  f=fixture();let activatePromise;
  f.handlers.get('activate')({waitUntil:promise=>{activatePromise=promise;}});
  await activatePromise;
  assert.deepEqual(f.deleted.sort(),['sihyeon-play-os-v0','sihyeon-play-os-v1-old']);
  assert.equal(f.metrics().claimed,1);
  const report={
    reviewedAt:new Date().toISOString(),source:'sw.js',sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),
    result:'PASS',verification:'Node VM contract checks with asynchronous fetch/cache doubles; not browser installation evidence',
    fullInstall,failures,lengthCases:[0,1,3,4,5,17],
    activation:{deleted:f.deleted,currentPreserved:true,otherPrefixesPreserved:true},
    limitation:'Existing network-first fetch behavior and actual browser activation/offline behavior are outside these two requested change checks.'
  };
  fs.mkdirSync(path.join(repo,'docs/qa'),{recursive:true});
  fs.writeFileSync(path.join(repo,'docs/qa/sw-independent-results.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`PASS SW: ${assetCount} assets visited once, max 4 concurrent fetches, optional network/404/cache errors continue, 6 boundary lengths, only two old matching-prefix caches deleted.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
