/* Independent expected ordinals and suspension boundaries for stage 5. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const crypto=require('node:crypto');
const API=require('../js/quantity-sequencer.js');
const Q=require('../js/games/quantity-play-model.js');
const checks=[];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn){for(let i=0;i<100&&!fn();i++)await sleep(2);assert(fn(),'condition did not settle');}
async function check(name,fn){try{checks.push({name,status:'PASS',detail:await fn()});}catch(error){checks.push({name,status:'FAIL',error:error.stack});}}
function voice(){let serial=0;const calls=[];return {calls,speak(text,options){const ticket=++serial;let resolve;const pending=new Promise(r=>resolve=r);calls.push({text,options,resolve,ticket});return pending;},stop(){serial++;},debugStatus(){return {requestGeneration:serial};}};}
function languageFixture(){
 let lang='ko';const listeners=new Set();
 const window={SihyeonPlaySettings:{getLanguage:()=>lang},addEventListener(type,fn){if(type==='sihyeon-settings-change')listeners.add(fn);},removeEventListener(type,fn){if(type==='sihyeon-settings-change')listeners.delete(fn);}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/quantity-sequencer.js'),'utf8'),{window,setTimeout,clearTimeout});
 return {api:window.SihyeonQuantitySequencer,setLanguage(value,dispatch=true){lang=value;if(dispatch)[...listeners].forEach(fn=>fn());}};
}
(async()=>{
 await check('pause freezes a pending utterance; resume never repeats the visual mutation',async()=>{
  const v=voice(),seen=[],seq=API.create({voice:v,timeoutMs:1000,fallbackMs:1});
  const pending=seq.start([{id:'a',text:'하나'},{id:'b',text:'둘'}],{delayMs:0,onStep:s=>seen.push(s.id)});
  assert.deepEqual(seen,['a']);const before=seq.getSnapshot();assert(seq.pause());
  v.calls[0].resolve(true);await sleep(10);
  assert.deepEqual(seen,['a']);assert.equal(seq.getSnapshot().status,'paused');assert.equal(seq.getSnapshot().runId,before.runId);
  assert(seq.resume());await until(()=>v.calls.length===2);assert.deepEqual(seen,['a']);
  v.calls[1].resolve(true);await until(()=>v.calls.length===3);assert.deepEqual(seen,['a','b']);v.calls[2].resolve(true);
  const final=await pending;assert.equal(final.completedSteps,2);assert.equal(final.status,'completed');
  return {visualSteps:seen,utterances:v.calls.map(c=>c.text),sameRun:true};
 });
 await check('muting a pending utterance keeps the run and every visual step',async()=>{
  const v=voice(),seen=[],seq=API.create({voice:v,timeoutMs:1000,fallbackMs:1});
  const pending=seq.start([{id:'a',text:'하나'},{id:'b',text:'둘'},{id:'c',text:'셋'}],{delayMs:1,onStep:s=>seen.push(s.id)});
  const id=seq.getSnapshot().runId;seq.setMuted(true);v.calls[0].resolve(true);const final=await pending;
  assert.equal(final.runId,id);assert.deepEqual(seen,['a','b','c']);assert.equal(v.calls.length,1);assert.equal(final.completedSteps,3);assert.equal(final.audioFailed,0);
  return {runId:id,visualSteps:seen,audioCalls:1};
 });
 await check('immediate pause-resume and mute-unmute cannot strand an active run',async()=>{
  const v=voice(),seen=[],seq=API.create({voice:v,timeoutMs:1000,fallbackMs:1});
  const pending=seq.start([{id:'a',text:'하나'},{id:'b',text:'둘'}],{delayMs:5,onStep:s=>seen.push(s.id)});
  seq.pause();seq.resume();await until(()=>v.calls.length===2);
  seq.setMuted(true);seq.setMuted(false);await until(()=>v.calls.length===3);
  v.calls[2].resolve(true);await until(()=>seq.getSnapshot().completedSteps===1);
  seq.pause();seq.resume();await until(()=>v.calls.length===4);v.calls[3].resolve(true);
  const result=await pending;assert.equal(result.status,'completed');assert.deepEqual(seen,['a','b']);
  return {visualSteps:seen,status:result.status,completedSteps:result.completedSteps};
 });
 await check('paused replacement does not mutate until resumed; stop resolves it and ignores late work',async()=>{
  const seen=[],seq=API.create({fallbackMs:1});const pending=seq.start([{id:'a',text:'하나'}],{muted:true,paused:true,onStep:s=>seen.push(s.id)});
  await sleep(5);assert.deepEqual(seen,[]);assert.equal(seq.isPaused(),true);seq.stop();const cancelled=await pending;assert.equal(cancelled.status,'cancelled');assert.equal(seq.resume(),false);assert.deepEqual(seen,[]);
  const next=seq.start([{id:'b',text:'둘'}],{muted:true,paused:true,onStep:s=>seen.push(s.id)});seq.resume();assert.equal((await next).status,'completed');assert.deepEqual(seen,['b']);
  return {cancelled:cancelled.status,visualSteps:seen};
 });
 await check('number chooser/settings close stays paused while hidden and duplicate visibility events preserve resume intent',async()=>{
  const source=fs.readFileSync(path.join(__dirname,'../js/games/number-picture.js'),'utf8');
  const body=name=>{const first=source.indexOf('  function '+name+'('),end=source.indexOf('\n  function ',first+1);assert(first>=0&&end>first,name);return source.slice(first,end);};
  const cases=[];
  for(const modal of ['chooser','settings']){
   const seen=[],seq=API.create({fallbackMs:2});let modalOpen=false,observer;
   const document={hidden:false,body:{},getElementById:()=>modalOpen?{}:null};
   const view={container:{contains:()=>true,querySelector:()=>null},picturePicker:false,userPaused:false,resumeAfterModal:false,resumeAfterVisibility:false,sequence:seq,options:{openSettings(){modalOpen=true;}}};
   const context={view,document,repaint(){},MutationObserver:class{constructor(fn){observer=fn;}observe(){}disconnect(){}}};
   vm.createContext(context);vm.runInContext(['resumeWhenVisible','onVisibility','openSettings','closePictures','onClick'].map(body).join('\n'),context);
   const pending=seq.start([{id:'a'},{id:'b'}],{muted:true,delayMs:0,onStep:s=>seen.push(s.id)});const id=seq.getSnapshot().runId;
   if(modal==='chooser')context.onClick({target:{closest:()=>({dataset:{qpAction:'choosePicture'}})}});else context.openSettings();
   document.hidden=true;context.onVisibility();context.onVisibility();
   if(modal==='chooser')context.closePictures();else{modalOpen=false;observer();}
   await sleep(5);assert.equal(seq.getSnapshot().status,'paused');assert.deepEqual(seen,['a']);
   document.hidden=false;context.onVisibility();const result=await pending;
   assert.equal(result.status,'completed');assert.equal(result.runId,id);assert.deepEqual(seen,['a','b']);
   cases.push({modal,hiddenClose:'paused',visibleResume:result.status,sameRun:true});
  }
  return {cases,fixture:'actual lifecycle functions and real sequencer; presentation redraw is stubbed'};
 });
 await check('garden modal close and duplicate visibility events preserve the same suspended run',async()=>{
  const source=fs.readFileSync(path.join(__dirname,'../js/games/ten-frame-garden.js'),'utf8');
  const body=name=>{const first=source.indexOf('  function '+name+'('),end=source.indexOf('\n  function ',first+1);assert(first>=0&&end>first,name);return source.slice(first,end);};
  const cases=[];
  for(const modal of ['numbers','settings']){
   const seen=[],seq=API.create({fallbackMs:2});const document={hidden:false,addEventListener(){}};
   const view={container:{querySelector:()=>null,addEventListener(){}},state:{phase:'counting',active:1},userPaused:false,resumeAfterModal:false,resumeAfterVisibility:false,sequencer:seq,modal:null};
   const context={view,document,window:{addEventListener(){}},draw(){},paintProgress(){},paintPlayback(){},save(){},onClick(){},onKey(){},onSettings(){}};
   vm.createContext(context);vm.runInContext(['stopRun','showModal','closeModal','resumeVisible','bind'].map(body).join('\n'),context);context.bind();
   const pending=seq.start([{id:'a'},{id:'b'}],{muted:true,delayMs:0,onStep:s=>seen.push(s.id)});const id=seq.getSnapshot().runId;
   context.showModal(modal);document.hidden=true;view.handlers.visibility();view.handlers.visibility();context.closeModal();
   await sleep(5);assert.equal(seq.getSnapshot().status,'paused');assert.deepEqual(seen,['a']);
   document.hidden=false;view.handlers.visibility();const result=await pending;assert.equal(result.status,'completed');assert.equal(result.runId,id);assert.deepEqual(seen,['a','b']);
   cases.push({modal,hiddenClose:'paused',visibleResume:result.status,sameRun:true});
  }
  return {cases,fixture:'actual lifecycle functions and real sequencer; presentation redraw is stubbed'};
 });
 for(const mode of ['running','paused','paused-without-settings-event'])await check('followLanguage preserves the '+mode+' run and retries only its current utterance',async()=>{
  const f=languageFixture(),v=voice(),seen=[],seq=f.api.create({voice:v,timeoutMs:1000,fallbackMs:1});
  const pending=seq.start([{id:'a',text:'하나',enText:'one'},{id:'b',text:'둘',enText:'two'}],{followLanguage:true,delayMs:0,onStep:s=>seen.push(s.id)});
  const before=seq.getSnapshot();if(mode!=='running')seq.pause();
  f.setLanguage('en',mode!=='paused-without-settings-event');
  if(mode!=='running'){
   await sleep(5);assert.equal(seq.getSnapshot().status,'paused');assert.deepEqual(seen,['a']);assert.equal(v.calls.length,1);assert(seq.resume());
  }
  await until(()=>v.calls.length===2);
  const changed=seq.getSnapshot();assert.equal(changed.runId,before.runId);assert.equal(changed.completedSteps,before.completedSteps);assert.equal(changed.language,'en');
  assert.equal(v.calls[0].options.shouldPlay(),false);assert.equal(v.calls[1].text,'one');assert.equal(v.calls[1].options.lang,'en-US');assert.deepEqual(seen,['a']);
  v.calls[0].resolve(true);await sleep(2);assert.equal(seq.getSnapshot().completedSteps,0);
  v.calls[1].resolve(true);await until(()=>v.calls.length===3);assert.equal(v.calls[2].text,'two');assert.deepEqual(seen,['a','b']);v.calls[2].resolve(true);
  const result=await pending;assert.equal(result.status,'completed');assert.equal(result.runId,before.runId);assert.equal(result.completedSteps,2);assert.equal(result.audioSucceeded,2);assert.equal(result.audioFailed,0);
  return {mode,runId:result.runId,visualSteps:seen,utterances:v.calls.map(c=>c.text),status:result.status};
 });
 await check('garden completion keeps the final quantity visible after a one-flower boundary change',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../js/games/ten-frame-garden.js'),'utf8');
  const start=source.indexOf('  function revealActiveFlower('),end=source.indexOf('\n  function ',start+1);assert(start>=0&&end>start);
  const calls=[],wanted=[];
  const frame={getBoundingClientRect:()=>({left:0,right:100,top:0,bottom:300,width:100,height:300})};
  const slot={closest:()=>frame,getBoundingClientRect:()=>({left:10,right:50,top:200,bottom:230,width:40,height:30})};
  const board={clientWidth:100,clientHeight:100,clientLeft:0,clientTop:0,getBoundingClientRect:()=>({left:0,top:0}),querySelector(selector){wanted.push(selector);return slot;},scrollBy:delta=>calls.push(delta)};
  const view={container:{querySelector:()=>board},state:{phase:'complete',active:0},lastOrdinal:30};const ctx={view};
  vm.createContext(ctx);vm.runInContext(source.slice(start,end)+'\nrevealActiveFlower();',ctx);
  assert.deepEqual(wanted,['[data-slot="30"]']);assert.equal(calls[0].top,132);assert.equal(calls[0].left,0);
  calls.length=0;view.state.phase='paused';ctx.revealActiveFlower();assert.equal(calls.length,0,'an empty paused pointer must not jump to the end');
  return {finalOrdinal:30,scrollDelta:132,pausedPointerPreserved:true,fixture:'real visibility function with measured board/slot rectangles'};
 });
 await check('31 totals in three strategies count exact disjoint groups and preserve total',()=>{
  let source=fs.readFileSync(path.join(__dirname,'../js/games/ten-frame-garden.js'),'utf8');
  const marker='  window.SihyeonGames = window.SihyeonGames || {};';assert(source.includes(marker));
  const context={window:{SihyeonQuantityPlayModel:Q}};
  vm.runInNewContext(source.replace(marker,'  window.__qaGarden={view,countSteps};\n'+marker),context);
  const M=context.window.SihyeonTenFrameGardenModel,{view,countSteps}=context.window.__qaGarden;
  let cases=0;
  for(const [mode,size] of [['ones',1],['fives',5],['tens',10]])for(let n=0;n<=30;n++){
   view.groupMode=mode;const state=M.createState({quantity:n}),steps=countSteps(state,false).filter(s=>s.kind==='count'||s.kind==='group');
   const expected=[];for(let v=size;v<n+size;v+=size){if(n)expected.push(Math.min(n,v));}
   assert.deepEqual(Array.from(steps,s=>s.ordinal),expected);
   if(size>1){const covered=[];for(const s of steps)for(let k=s.from;k<=s.ordinal;k++)covered.push(k);assert.deepEqual(covered,Array.from({length:n},(_,i)=>i+1));}
   assert.equal(M.inspect(state).visible,n);cases++;
  }
  view.groupMode='tens';const fill=countSteps(M.createState({mode:'fill',quantity:7}),false).filter(s=>s.kind==='count');assert.deepEqual(Array.from(fill,s=>s.ordinal),[8,9,10]);
  return {cases,fillOrdinals:[8,9,10]};
 });
 const paths=['js/quantity-sequencer.js','js/games/number-picture.js','js/games/ten-frame-garden.js'];
 const report={suite:'stage5-number-continuity',status:checks.every(x=>x.status==='PASS')?'PASS':'FAIL',checks,sourceSha256:Object.fromEntries(paths.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'..',p))).digest('hex')])),limits:['Node state/sequence checks. Actual DOM identity, pixel layout and sound audibility require separate browser/device evidence.']};
 console.log(JSON.stringify(report,null,2));if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');if(report.status!=='PASS')process.exitCode=1;
})();
