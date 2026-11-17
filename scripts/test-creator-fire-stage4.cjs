/* Stage 4 fire: execute the real game in a controlled DOM/clock; no pixel claim.
 * Expected capability variants and before/after world conditions are independent assertions.
 * The small DOM fixture follows the existing help-mode harness; production APIs are not exposed.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
function fixture(settings = {}) {
  const file='js/games/megaDispatch.js', storage=settings.storage || new Map(), denied=settings.denied || false;
  let serial=0, now=0; const spoken=[], rewards=[], requests=[], stops=[];
  const timers=new Map(), intervals=new Map(), windowListeners=new Map();
  const attrsPattern=/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g;
  const dataKey=name=>name.slice(5).replace(/-([a-z])/g,(_,char)=>char.toUpperCase());
  class Element {
    constructor(tag='div') {
      this.tagName=tag.toUpperCase();this.attrs={};this.dataset={};this.children=[];this.parentNode=null;this.handlers={};this.offsetWidth=100;
      this.style={setProperty(key,value){this[key]=value;},removeProperty(key){delete this[key];}};
      this.classes=new Set();
      this.classList={add:(...names)=>names.forEach(name=>this.classes.add(name)),remove:(...names)=>names.forEach(name=>this.classes.delete(name)),
        contains:name=>this.classes.has(name),toggle:(name,on)=>{const add=on===undefined?!this.classes.has(name):on;add?this.classes.add(name):this.classes.delete(name);return add;}};
    }
    get className(){return [...this.classes].join(' ');}
    set className(value){this.classes=new Set(value.split(/\s+/).filter(Boolean));}
    get id(){return this.attrs.id;}
    set id(value){this.attrs.id=value;}
    get isConnected(){let node=this;while(node){if(node.root)return true;node=node.parentNode;}return false;}
    get innerHTML(){return this.html||'';}
    set innerHTML(html){
      this.html=html;for(const child of this.children)child.parentNode=null;this.children=[];
      const stack=[this];
      const tags=/<\/?([a-zA-Z][\w:-]*)((?:[^"'<>]|"[^"]*"|'[^']*')*)>/g;
      for(const match of html.matchAll(tags)){
        if(match[0].startsWith('</')){if(stack.length>1)stack.pop();continue;}
        const child=new Element(match[1]);
        for(const attr of match[2].matchAll(attrsPattern))child.setAttribute(attr[1],attr[2]??attr[3]??attr[4]??'');
        stack.at(-1).appendChild(child);
        if(!['IMG','BR','INPUT','HR','META','LINK'].includes(child.tagName)&&!match[2].trim().endsWith('/'))stack.push(child);
      }
    }
    setAttribute(name,value){
      this.attrs[name]=String(value);
      if(name==='disabled')this.disabled=true;
      if(name==='class')this.className=String(value);
      if(name.startsWith('data-'))this.dataset[dataKey(name)]=String(value);
    }
    getAttribute(name){return this.attrs[name]??null;}
    appendChild(child){child.remove();this.children.push(child);child.parentNode=this;return child;}
    remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(item=>item!==this);this.parentNode=null;}
    addEventListener(name,fn){(this.handlers[name]??=[]).push(fn);}
    click(event={}){if(this.disabled)return;const e={clientX:150,clientY:190,detail:1,currentTarget:this,target:this,...event};this.onclick?.(e);for(const fn of this.handlers.click||[])fn(e);}
    getBoundingClientRect(){return {left:20,top:30,width:100,height:120};}
    matches(selector){
      selector=selector.trim().split(/\s+/).at(-1);
      const not=selector.match(/:not\(([^)]+)\)/);if(not&&this.matches(not[1]))return false;
      selector=selector.replace(/:not\([^)]+\)/g,'');
      const id=selector.match(/#([\w-]+)/);if(id&&this.id!==id[1])return false;
      for(const match of selector.matchAll(/\.([\w-]+)/g))if(!this.classes.has(match[1]))return false;
      for(const match of selector.matchAll(/\[([\w-]+)(?:=["']?([^\]"']+)["']?)?\]/g)){
        if(!(match[1] in this.attrs))return false;
        if(match[2]!==undefined&&this.attrs[match[1]]!==match[2])return false;
      }
      const tag=selector.match(/^[a-zA-Z][\w-]*/);return !tag||this.tagName===tag[0].toUpperCase();
    }
    querySelectorAll(selector){
      const out=[];const selectors=selector.split(',');
      const visit=node=>{for(const child of node.children){if(selectors.some(sel=>child.matches(sel)))out.push(child);visit(child);}};visit(this);return out;
    }
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  }
  const body=new Element('body');body.root=true;const head=new Element('head');head.root=true;
  const container=body.appendChild(new Element());
  const clock={setTimeout(fn,ms){const id=++serial;timers.set(id,{fn,at:now+ms,ms});return id;},clearTimeout(id){timers.delete(id);},
    setInterval(fn,ms){const id=++serial;intervals.set(id,{fn,ms});return id;},clearInterval(id){intervals.delete(id);}};
  const store={getItem(key){if(denied===true)throw Error('storage denied');return storage.get(key)??null;},setItem(key,value){if(denied)throw Error('storage denied');storage.set(key,value);}};
  const window={...clock,SihyeonPlaySettings:{getLanguage:()=>settings.language || 'ko'},SihyeonVoice:{stop(){stops.push(true);}},innerWidth:390,innerHeight:844,localStorage:store,matchMedia:()=>({matches:false}),
    addEventListener:(name,fn)=>windowListeners.set(name,fn),removeEventListener:name=>windowListeners.delete(name)};
  const document={head,body,documentElement:{clientWidth:390,clientHeight:844},createElement:tag=>new Element(tag),
    getElementById:id=>head.querySelector('#'+id)||body.querySelector('#'+id)};
  const fixedMath=Object.create(Math);fixedMath.random=()=>0.2;
  let source=fs.readFileSync(path.join(ROOT,file),'utf8');
  if(file.endsWith('megaDispatch.js'))source=source.replace(/\}\)\(\);\s*$/,'window.__fieldTest={state,FIELD_ROLES,FIELD_INCIDENTS,startFieldPlay,startFieldIncident,chooseFieldTruck,doFieldWork,nextFieldStep,makeFieldChoices,availableFieldIncidents,handleResize,renderField};\n})();');
  vm.runInNewContext(source,{window,document,navigator:{},console,Math:fixedMath,...clock,
    fetch:async url=>{requests.push(url);if(settings.waitFetch)await settings.waitFetch;const broken=settings.fail===true || (settings.fail==='special' && url.includes('special')); if(broken)throw Error('offline');return {ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(ROOT,url.replace(/^\.\//,'')),'utf8'))};}});
  const game=window.SihyeonGames.megaDispatch, api=window.__fieldTest;
  const options={say:text=>{spoken.push(text);return settings.rejectVoice?Promise.reject(Error('speech unavailable')):Promise.resolve(true);},gainExp:value=>rewards.push(value),fireConfetti:()=>{}};
  game.render(container,options);
  return {window,document,container,timers,intervals,storage,Element,game,api,spoken,rewards,requests,stops,settings,options,
    advance(ms){const end=now+ms;for(;;){const next=[...timers].filter(([,value])=>value.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].fn();}now=end;}};
}

const FIRE_KEY='sihyeon-mega-dispatch-help-v1';
let checks=0;
function click(f, selector) { const button=f.container.querySelector(selector);assert.ok(button,selector);button.click();return button; }
const clone=value=>JSON.parse(JSON.stringify(value));
const settle=()=>new Promise(resolve=>setImmediate(resolve));
async function ready(settings={}) {const f=fixture(settings);await f.api.startFieldPlay();assert.equal(f.api.state.field.phase,'menu');return f;}
function choose(f,id) {click(f,`[data-field-game-id="${id}"]`);assert.equal(f.api.state.field.phase,'arrival');assert.equal(f.api.state.isBusy,true);click(f,'[data-field-work]');assert.equal(f.api.state.field.actionCount,0);f.advance(600);assert.equal(f.api.state.field.phase,'work');}
function rotate(f) {const before=clone(f.api.state.field);f.window.innerWidth=844;f.window.innerHeight=390;f.api.handleResize();f.advance(120);assert.deepEqual(clone(f.api.state.field),before,'rotation preserves the real incident, selected truck and work');checks++;}
function hints(f,enabled) {const s=f.api.state;const role=s.field.incidentId?s.api:null;for(const button of f.container.querySelectorAll('.md-field-choice')){const vehicle=s.field.choices.find(t=>t.gameId===button.dataset.fieldGameId);const key=f.api.FIELD_INCIDENTS.find(i=>i.id===s.field.incidentId).steps[s.field.stepIndex];const valid=f.api.FIELD_ROLES[key].ids.includes(vehicle.id);assert.equal(button.classList.contains('target-glow'),enabled&&valid);}assert.equal(f.container.querySelector('[data-action="help"]').getAttribute('aria-pressed'),String(enabled));checks++;}
function work(f,n){for(let i=0;i<n;i++)click(f,'[data-field-work]');}

(async()=>{
  const initial=await ready();
  assert.equal(initial.api.state.allTrucks.length,18);
  assert.deepEqual(Array.from(initial.api.availableFieldIncidents(),i=>i.id),['water','ladder','smoke']);
  initial.api.state.allTrucks.push({id:'unknown_fire_vehicle',gameId:'new_unknown',file:'new.png'});
  for(const role of Object.values(initial.api.FIELD_ROLES))assert.ok(initial.api.makeFieldChoices(role).every(t=>t.gameId!=='new_unknown'),'unknown vehicles cannot become false wrong answers');
  initial.game.destroy();checks+=3;

  for(const tanker of ['n_water_tanker','s_water_tanker']){
    const f=await ready();click(f,'[data-field-incident="water"]');
    const choices=Array.from(f.api.state.field.choices,t=>t.gameId);
    assert.ok(choices.includes('n_water_tanker')&&choices.includes('s_water_tanker'),'both water-tanker pictures are actually offered');
    hints(f,true);const unchanged=clone(f.api.state.field);click(f,'[data-action="help"]');hints(f,false);assert.deepEqual(clone(f.api.state.field),unchanged);
    const hidden=new f.Element('button');f.api.chooseFieldTruck('n_pump_engine',hidden);assert.deepEqual(clone(f.api.state.field),unchanged,'hidden or stale choices are ignored');
    const wrong=f.api.state.field.choices.find(t=>!['n_water_tanker','s_water_tanker'].includes(t.gameId));
    const before=clone(f.api.state.field.world);click(f,`[data-field-game-id="${wrong.gameId}"]`);
    assert.deepEqual(clone(f.api.state.field.world),before);assert.equal(f.api.state.field.phase,'choose');assert.equal(f.container.querySelector('.md-shake'),null);assert.ok(f.api.state.field.message.includes('이 차는'));
    choose(f,tanker);hints(f,false);rotate(f);
    work(f,1);assert.equal(f.api.state.field.world.water,1);assert.equal(f.api.state.field.world.fire,3);
    const oldButton=f.container.querySelector('[data-field-work]');oldButton.click();
    assert.equal(f.api.state.field.world.water,2);assert.equal(f.api.state.field.phase,'result');assert.deepEqual(f.rewards,[]);
    oldButton.click();assert.equal(f.api.state.field.actionCount,2,'a detached work button cannot count twice');
    const waiting=clone(f.api.state.field);f.advance(20000);assert.deepEqual(clone(f.api.state.field),waiting,'the completed water tank waits for the child');rotate(f);
    click(f,'[data-field-next]');assert.equal(f.api.state.field.world.water,2);assert.equal(f.api.state.field.world.fire,3);
    assert.equal(f.api.state.field.stepIndex,1);assert.equal(f.api.state.field.phase,'choose');
    const pumpOptions=Array.from(f.api.state.field.choices,t=>t.id);
    assert.ok(pumpOptions.includes('pump_engine'));for(const ambiguous of ['water_tanker','ladder_truck','airport_fire_truck','airport_crash_tender','wildfire_6x6_truck'])assert.ok(!pumpOptions.includes(ambiguous),'possibly valid pumps are never false distractors');
    choose(f,'n_pump_engine');
    for(let remaining=2;remaining>=0;remaining--){work(f,1);assert.equal(f.api.state.field.world.fire,remaining);}
    assert.equal(f.api.state.field.world.safe,true);assert.deepEqual(f.rewards,[20]);
    const saved=clone(f.api.state.field);f.api.doFieldWork();assert.deepEqual(clone(f.api.state.field),saved);f.advance(20000);assert.deepEqual(clone(f.api.state.field),saved);
    click(f,'[data-field-next]');assert.deepEqual(Array.from(f.api.state.field.completed),['water']);assert.equal(f.api.state.field.phase,'menu');
    f.game.destroy();assert.equal(f.timers.size,0);checks+=18;
  }

  const ladderVariants=['n_ladder_truck','n_aerial_ladder_truck','n_articulating_ladder_truck','s_aerial_ladder_truck'];
  for(const ladder of ladderVariants){
    const f=await ready();click(f,'[data-field-incident="ladder"]');
    const actual=Array.from(f.api.state.field.choices,t=>t.gameId);
    ladderVariants.forEach(id=>assert.ok(actual.includes(id),`${id} is visible and selectable`));
    assert.ok(!actual.includes('s_articulating_boom_truck'),'unverified rescue basket is neither a forced answer nor a false wrong choice');
    hints(f,true);choose(f,ladder);work(f,1);assert.equal(f.api.state.field.world.ladder,1);assert.equal(f.api.state.field.world.rescued,false);rotate(f);
    work(f,1);assert.equal(f.api.state.field.world.ladder,2);assert.equal(f.api.state.field.world.rescued,false);
    const progress=clone(f.api.state.field);click(f,'[data-field-listen]');assert.equal(f.spoken.at(-1),f.api.state.field.message);assert.deepEqual(clone(f.api.state.field),progress);
    work(f,1);assert.equal(f.api.state.field.world.rescued,true);assert.equal(f.api.state.field.world.safe,true);assert.deepEqual(f.rewards,[20]);
    click(f,'[data-field-next]');click(f,'[data-field-incident="ladder"]');choose(f,ladder);work(f,3);assert.deepEqual(f.rewards,[20],'replaying a completed incident cannot duplicate its reward within the visit');
    f.game.destroy();checks+=11;
  }

  for(const language of ['ko','en']){
    const f=await ready({language,rejectVoice:true,denied:true});click(f,'[data-field-incident="smoke"]');
    click(f,'[data-action="help"]');hints(f,false);choose(f,'s_smoke_extraction_fan_truck');
    assert.equal(f.api.state.field.world.fire,0,'the fan scene starts after the fire is out');
    for(let remaining=2;remaining>=0;remaining--){work(f,1);assert.equal(f.api.state.field.world.smoke,remaining);}
    assert.equal(f.api.state.field.world.safe,true);assert.deepEqual(f.rewards,[20]);
    assert.ok(f.spoken.length>=5);assert.ok(f.spoken.every(text=>typeof text==='string'),'say always receives a single string');
    assert.ok(f.spoken.every(text=>language==='en'?!/[가-힣]/.test(text):/[가-힣]/.test(text)),'every guidance request uses the selected language');
    await settle();f.game.destroy();f.game.render(f.container,f.options);assert.equal(f.api.state.helpEnabled,false,'in-session preference survives storage refusal');f.game.destroy();checks+=10;
  }

  for(const fail of [true,'special']){
    const settings={fail};const f=await ready(settings);
    assert.equal(f.api.state.catalogFailed,true);
    assert.equal(f.api.availableFieldIncidents().length,fail===true?0:2,'only playable incidents are offered, with the matching denominator');
    if(fail===true)assert.equal(f.api.state.allTrucks[0].gameId,'n_pump','legacy fallback remains separate from a real catalog picture');
    const calls=f.requests.length;settings.fail=false;await f.api.startFieldPlay(true);
    assert.equal(f.requests.length,calls+2,'retry makes real requests despite a previously cached fallback');
    assert.equal(f.api.state.allTrucks.length,18);assert.equal(f.api.state.catalogFailed,false);assert.equal(f.api.availableFieldIncidents().length,3);
    f.game.destroy();checks+=7;
  }

  const leave=await ready();click(leave,'[data-field-incident="water"]');click(leave,'[data-field-game-id="n_water_tanker"]');
  assert.equal(leave.api.state.field.phase,'arrival');click(leave,'[data-field-home]');const speechCount=leave.spoken.length;leave.advance(9000);
  assert.ok(leave.container.querySelector('[data-field-start]'));assert.equal(leave.api.state.playMode,'sequence');assert.equal(leave.spoken.length,speechCount);assert.deepEqual(leave.rewards,[]);assert.equal(leave.timers.size,0);
  for(const size of [4,9,16]){click(leave,`[data-mode-size="${size}"]`);await settle();assert.equal(leave.api.state.playMode,'sequence');assert.equal(leave.container.querySelectorAll('.md14-truck-btn').length,size);leave.game.destroy();leave.game.render(leave.container,leave.options);}
  leave.game.destroy();checks+=8;

  let release;const settings={waitFetch:new Promise(resolve=>{release=resolve;})};const stale=fixture(settings);
  const loading=stale.api.startFieldPlay();stale.game.destroy();stale.game.render(stale.container,stale.options);release();await loading;await settle();
  assert.ok(stale.container.querySelector('[data-field-start]'));assert.equal(stale.api.state.playMode,'sequence');assert.equal(stale.api.state.field,null);assert.deepEqual(stale.rewards,[]);stale.game.destroy();checks+=4;

  console.log(`PASS ${checks} stage-4 fire assertions/groups: all three coherent incidents, tanker2/ladder4 variants, safe choices, persistent cooperation, work input, help/rotation, replay, language/speech failure, catalog partial/failure retry and lifecycle. Browser NOT_RUN.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
