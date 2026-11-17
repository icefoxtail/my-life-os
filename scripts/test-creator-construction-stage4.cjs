'use strict';
// State/lifecycle checks. Actual drawing, layout, touch and speech requests are
// covered by the browser suite and the unchanged independent role oracle.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ROOT = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/vehicles/construction_manifest.json'), 'utf8'));
const filename = path.join(ROOT, 'js/games/construction-site.js');
const source = fs.readFileSync(filename, 'utf8').replace(/\}\)\(\);\s*$/,
  'window.__constructionStage4 = {state, PROJECTS, MISSIONS, SAFE_DISTRACTOR_IDS, VEHICLE_ROLES, normalizeVehicle, beginProject, showProjectChooser, handleChoice, performWork, finishWork, nextWork, playCompletedScene, restartGame, refreshLayoutOnly, fitProjectScene, wrongExplanation, speakMission, sceneSvg, render, destroy};\n})();');

function element() {
  const classes = new Set();
  const children = new Map();
  return {innerHTML:'', textContent:'', hidden:false, disabled:false, dataset:{}, style:{},
    classList:{add(...xs){xs.forEach(x=>classes.add(x));}, remove(...xs){xs.forEach(x=>classes.delete(x));}, contains(x){return classes.has(x);}},
    querySelector(key){if(!children.has(key))children.set(key,element());return children.get(key);},
    querySelectorAll(){return [];}, addEventListener(){}, removeEventListener(){}, remove(){}, setAttribute(){},
    offsetWidth:1};
}

function fixture() {
  let now=0, id=0, language='ko';
  const timers=new Map(), requests=[], spoken=[], rewards=[];
  const container=element();
  const window={innerWidth:390,innerHeight:844,
    setTimeout(fn,delay){const key=++id;timers.set(key,{fn,at:now+delay});return key;},
    clearTimeout(key){timers.delete(key);}, addEventListener(){},removeEventListener(){},
    matchMedia(){return {matches:window.innerWidth>=768&&window.innerHeight>=520&&window.innerWidth>window.innerHeight};},
    SihyeonPlaySettings:{getLanguage:()=>language},
    SihyeonVoice:{stop(){},play(){return Promise.resolve(false);}},
    SihyeonVoiceLabels:{entry:(_kind,id)=>({en:id.replaceAll('_',' ')})},
    SihyeonVehicleDisplay:{apply(){},reset(){}}};
  const document={getElementById:()=>null,createElement:element,head:{appendChild(){}}};
  const fetch=()=>new Promise(resolve=>requests.push(resolve));
  const options={say(text){spoken.push(text);return Promise.resolve(true);},gainExp(value){rewards.push(value);},fireConfetti(){}};
  vm.runInNewContext(source,{window,document,navigator:{},fetch,console,Math}, {filename});
  const api=window.__constructionStage4;
  Object.assign(api.state,{container,options,vehicles:catalog.map(api.normalizeVehicle),destroyed:false});
  function tick(ms){const stop=now+ms;for(;;){const next=[...timers.entries()].filter(([,v])=>v.at<=stop).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].fn();}now=stop;}
  function choose(){const answer=api.state.currentChoices.find(v=>api.state.currentMission.answerIds.includes(v.id));assert.ok(answer);api.handleChoice(answer.id,element());tick(400);assert.equal(api.state.workPhase,'ready');return answer;}
  return {api,window,container,options,tick,choose,spoken,rewards,requests,timers,setLanguage(value){language=value;}};
}

let checks=0;
function check(name, fn){fn();checks++;console.log('PASS',name);}
async function asyncCheck(name, fn){await fn();checks++;console.log('PASS',name);}
async function flush(){for(let i=0;i<8;i++)await Promise.resolve();}

(async()=>{
  check('three honest sites use the unchanged seven machine roles',()=>{
    const f=fixture();
    const expected={playground:['push','load','carry'],station:['dig','mix','pump'],bridge:['dig','carry','lift']};
    assert.deepEqual(Array.from(f.api.PROJECTS,p=>p.title),['놀이터 길 만들기','소방서 앞마당 만들기','다리 잇기']);
    for(const project of f.api.PROJECTS){
      assert.deepEqual(Array.from(project.steps,s=>s.id),expected[project.id]);
      f.api.beginProject(project.id);
      for(const mission of f.api.state.missions){
        const unchanged=f.api.MISSIONS.find(m=>m.id===mission.id);
        assert.equal(mission.answerIds,unchanged.answerIds,'project keeps the exact fair-answer list');
      }
    }
    const bridge=f.api.PROJECTS.find(p=>p.id==='bridge');
    assert.match(bridge.steps[1].question,/작은 다리판/);
    assert.match(bridge.steps[2].question,/낮은 받침/);
    assert.match(f.api.PROJECTS.find(p=>p.id==='station').steps[2].result,/놀이 속에서 단단해진/);
  });

  check('ground and work vehicle share one fitted 8:5 canvas across stage shapes',()=>{
    const f=fixture(),stage=f.container.querySelector('.cs-project-game .cs-stage');
    const canvas=stage.querySelector('.cs-project-canvas');
    for(const [width,height,expectedWidth,expectedHeight] of [[340,600,340,212.5],[600,180,288,180],[300,300,300,187.5]]){
      stage.clientWidth=width;stage.clientHeight=height;f.api.fitProjectScene();
      assert.equal(canvas.style.width,expectedWidth+'px');
      assert.equal(canvas.style.height,expectedHeight+'px');
      assert.ok(expectedWidth<=width&&expectedHeight<=height);
      assert.equal(expectedWidth/expectedHeight,8/5);
    }
    stage.clientWidth=0;f.api.fitProjectScene();
    assert.equal(canvas.style.width,'300px','a temporarily hidden stage cannot overwrite its valid fit');
  });

  for(const projectId of ['playground','station','bridge'])check(projectId+' tap/watch, persistent progress, manual next and repeat play',()=>{
    const f=fixture();assert.equal(f.api.beginProject(projectId),true);
    for(let round=1;round<=3;round++){
      assert.equal(f.api.state.currentRound,round);f.choose();
      assert.equal(f.api.state.completedSteps.length,round-1,'selection is not completion');
      assert.equal(f.api.performWork(round%2===0),true);
      assert.equal(f.api.performWork(false),false,'double tap cannot start work twice');
      assert.equal(f.api.performWork(true),false,'watch and manual work share one lock');
      f.tick(900);
      assert.equal(f.api.state.workPhase,'result');
      assert.deepEqual(Array.from(f.api.state.completedSteps),Array.from({length:round},(_,i)=>i+1));
      assert.equal(f.api.finishWork(),false,'completion is idempotent');
      const scene=f.container.querySelector('#csProjectScene').innerHTML;
      assert.match(scene,new RegExp('data-progress="'+round+'"'));
      f.window.innerWidth=1024;f.window.innerHeight=768;f.api.refreshLayoutOnly();
      assert.equal(f.container.querySelector('#csProjectScene').innerHTML,scene,'rotation preserves completed scene');
      f.tick(20000);assert.equal(f.api.state.currentRound,round,'result never advances on a timer');
      assert.equal(f.api.nextWork(),true);
      assert.equal(f.api.nextWork(),false,'repeated next cannot skip a job');
    }
    assert.equal(f.api.state.workPhase,'complete');assert.equal(f.api.state.completedVehicles.length,3);
    assert.deepEqual(f.rewards,[10,10,10,30]);
    assert.equal(f.api.playCompletedScene(),true);assert.equal(f.api.playCompletedScene(),false);
    f.tick(1750);assert.equal(f.api.playCompletedScene(),true);f.tick(1750);
    assert.deepEqual(f.rewards,[10,10,10,30],'finished-place play does not issue more rewards');
    assert.equal(f.api.state.scenePlayCount,2);
    f.api.restartGame();assert.equal(f.api.state.projectId,projectId);assert.equal(f.api.state.completedSteps.length,0);
  });

  check('all seven orders and wrong roles have Korean and English speech',()=>{
    const f=fixture();
    assert.equal(Object.keys(f.api.VEHICLE_ROLES).length,27);
    for(const mission of f.api.MISSIONS){
      f.api.state.currentMission=mission;
      f.setLanguage('ko');f.api.speakMission();assert.equal(f.spoken.at(-1),mission.question);
      f.setLanguage('en');f.api.speakMission();assert.ok(!/[가-힣]/.test(f.spoken.at(-1)));
      for(const id of f.api.SAFE_DISTRACTOR_IDS[mission.id]){
        const vehicle=f.api.state.vehicles.find(v=>v.id===id);assert.ok(vehicle);
        const explanation=f.api.wrongExplanation(vehicle,mission);
        assert.ok(explanation.ko.includes(vehicle.name));
        assert.ok(explanation.ko.includes(f.api.VEHICLE_ROLES[id][0]));
        assert.ok(!/[가-힣]/.test(explanation.en));
      }
    }
  });

  check('incorrect and hidden choices neither work nor reward',()=>{
    const f=fixture();f.api.beginProject('station');
    const wrong=f.api.state.currentChoices.find(v=>!f.api.state.currentMission.answerIds.includes(v.id));assert.ok(wrong);
    const button=element();f.api.handleChoice(wrong.id,button);
    assert.equal(button.classList.contains('is-wrong'),true);
    assert.equal(f.api.state.workPhase,'choose');assert.equal(f.api.state.locked,false);
    assert.equal(f.api.performWork(false),false);assert.equal(f.api.nextWork(),false);
    f.api.handleChoice('not_shown',element());assert.deepEqual(f.rewards,[]);
    assert.equal(f.api.state.completedSteps.length,0);
  });

  check('destroy/reentry cancels work and prevents old rewards',()=>{
    const f=fixture();f.api.beginProject('bridge');f.choose();f.api.performWork(true);
    f.api.destroy();
    Object.assign(f.api.state,{container:element(),options:f.options,vehicles:catalog.map(f.api.normalizeVehicle),destroyed:false});
    f.api.beginProject('station');f.tick(30000);
    assert.equal(f.api.state.currentRound,1);assert.equal(f.api.state.workPhase,'choose');
    assert.equal(f.api.state.completedSteps.length,0);assert.deepEqual(f.rewards,[]);
  });

  check('reward persistence exception cannot wedge a completed job',()=>{
    const f=fixture();f.options.gainExp=()=>{throw new Error('storage blocked');};
    f.api.beginProject('playground');f.choose();f.api.performWork(false);
    assert.doesNotThrow(()=>f.tick(900));assert.equal(f.api.state.workPhase,'result');
    assert.equal(f.api.state.successRewardGiven,true);assert.equal(f.api.nextWork(),true);
  });

  check('partial catalogs cannot start impossible projects or invent a substitute answer',()=>{
    const f=fixture();f.api.state.vehicles=f.api.state.vehicles.filter(v=>['tower_crane','road_roller','water_truck'].includes(v.id));
    for(const id of ['playground','station','bridge','__proto__'])assert.equal(f.api.beginProject(id),false);
    assert.equal(f.api.beginProject(null),true);
    assert.deepEqual(Array.from(f.api.state.missions,m=>m.id),['lift']);
    assert.ok(f.api.state.currentChoices.some(v=>v.id==='tower_crane'));
  });

  await asyncCheck('late manifest from an old game cannot overwrite a new session',async()=>{
    const f=fixture(), first=element(), second=element();
    f.api.render(first,f.options);f.api.render(second,f.options);
    assert.equal(f.requests.length,2);
    const current=catalog.filter(v=>['wheel_loader','dump_truck','concrete_pump_truck'].includes(v.id));
    f.requests[1]({ok:true,json:async()=>current});await flush();
    assert.deepEqual(Array.from(f.api.state.vehicles,v=>v.id),current.map(v=>v.id));
    f.requests[0]({ok:true,json:async()=>catalog});await flush();
    assert.equal(f.api.state.container,second);
    assert.deepEqual(Array.from(f.api.state.vehicles,v=>v.id),current.map(v=>v.id));
    assert.equal(f.api.state.mode,'chooser');
  });
  console.log(`PASS construction stage 4: ${checks} state/lifecycle cases. Browser visibility, native touch and audible speech are separate evidence.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
