/* Actual game modules in a small DOM/clock fixture. No browser/pixel claim. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname,'..');

function fixture(file, storage = new Map(), denied = false) {
  let serial=0, now=0;
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
      if(name==='class')this.className=String(value);
      if(name.startsWith('data-'))this.dataset[dataKey(name)]=String(value);
    }
    getAttribute(name){return this.attrs[name]??null;}
    appendChild(child){child.remove();this.children.push(child);child.parentNode=this;return child;}
    remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(item=>item!==this);this.parentNode=null;}
    addEventListener(name,fn){(this.handlers[name]??=[]).push(fn);}
    click(event={}){if(this.disabled)return;const e={clientX:150,clientY:190,detail:1,...event};this.onclick?.(e);for(const fn of this.handlers.click||[])fn(e);}
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
  const window={...clock,innerWidth:390,innerHeight:844,localStorage:store,matchMedia:()=>({matches:false}),
    addEventListener:(name,fn)=>windowListeners.set(name,fn),removeEventListener:name=>windowListeners.delete(name)};
  const document={head,body,documentElement:{clientWidth:390,clientHeight:844},createElement:tag=>new Element(tag),
    getElementById:id=>head.querySelector('#'+id)||body.querySelector('#'+id)};
  const fixedMath=Object.create(Math);fixedMath.random=()=>0.2;
  let source=fs.readFileSync(path.join(ROOT,file),'utf8');
  if(file.endsWith('megaDispatch.js'))source=source.replace(/\}\)\(\);\s*$/,'window.__helpTest={state,render,updateTargetGlow,handleTouch};\n})();');
  vm.runInNewContext(source,{window,document,navigator:{},console,Math:fixedMath,...clock,
    fetch:async()=>({json:async()=>[]})});
  return {window,document,container,timers,intervals,storage,Element,
    advance(ms){const end=now+ms;for(;;){const next=[...timers].filter(([,value])=>value.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].fn();}now=end;}};
}

const BALLOON_KEY='sihyeon-color-balloon-help-v1', FIRE_KEY='sihyeon-mega-dispatch-help-v1';
let checks=0;
function balloons(f){return f.container.querySelectorAll('.cb-balloon:not(.cb-pop)');}
function assertBalloonHints(f,enabled){
  const game=f.window.SihyeonGames.colorBalloon;
  for(const el of balloons(f)){
    const target=el.dataset.colorId===game.state.targetColor.id;
    assert.equal(el.classList.contains('cb-balloon-target'),enabled&&target);
    assert.equal(el.classList.contains('cb-target-glow'),enabled&&target);
    if(!enabled)assert.equal(el.classList.contains('cb-hint-jump'),false);
  }
  assert.equal(f.container.querySelector('#cbHelpToggle').getAttribute('aria-pressed'),String(enabled));checks++;
}
for(const help of [true,false]){
  const f=fixture('js/games/color-balloon.js',new Map([[BALLOON_KEY,help?'on':'off']]));
  const game=f.window.SihyeonGames.colorBalloon;game.render(f.container);
  assert.equal(game.state.helpEnabled,help);assertBalloonHints(f,help);
  const targetId=game.state.targetColor.id, level=game.state.currentLevel;
  const wrong=balloons(f).find(el=>el.dataset.colorId!==targetId);
  wrong.click();assert.equal(game.state.currentLevel,level);assert.equal(game.state.isAnimating,false);
  f.advance(3000);assertBalloonHints(f,help);
  const target=balloons(f).find(el=>el.dataset.colorId===targetId);
  target.click();assert.equal(game.state.isAnimating,true);target.click();
  f.advance(2500);assert.equal(game.state.currentLevel,level+1,'Exactly one correct result advances');
  assert.equal(game.state.helpEnabled,help);assertBalloonHints(f,help);
  game.destroy();assert.equal(f.timers.size,0);assert.equal(f.intervals.size,0);checks+=4;
}
for(const denied of [false,true,'write']){
  const stored=denied==='write'?new Map([[BALLOON_KEY,'on']]):new Map();
  const f=fixture('js/games/color-balloon.js',stored,denied), game=f.window.SihyeonGames.colorBalloon;
  game.render(f.container);assert.equal(game.state.helpEnabled,true,'Existing help is the default');
  const before=[game.state.currentLevel,game.state.targetColor.id,balloons(f).map(el=>el.dataset.colorId).join(',')];
  f.container.querySelector('#cbHelpToggle').click();assertBalloonHints(f,false);
  f.advance(3000);assertBalloonHints(f,false);
  assert.deepEqual([game.state.currentLevel,game.state.targetColor.id,balloons(f).map(el=>el.dataset.colorId).join(',')],before,'Changing help preserves the round');
  game.destroy();game.render(f.container);assertBalloonHints(f,false);
  f.container.querySelector('#cbHelpToggle').click();assertBalloonHints(f,true);
  assert.equal(f.storage.has(FIRE_KEY),false,'Preferences are per game');
  if(!denied){
    assert.equal(f.storage.get(BALLOON_KEY),'on');
    f.container.querySelector('#cbHelpToggle').click();
    const again=fixture('js/games/color-balloon.js',f.storage);again.window.SihyeonGames.colorBalloon.render(again.container);assertBalloonHints(again,false);
  }
  game.destroy();checks+=5;
}

function fireFixture(help,denied=false,storage=new Map()){
  if(help!==null)storage.set(FIRE_KEY,help?'on':'off');
  const f=fixture('js/games/megaDispatch.js',storage,denied),game=f.window.SihyeonGames.megaDispatch,api=f.window.__helpTest;
  game.render(f.container,{});
  const list=Array.from({length:4},(_,i)=>({id:'truck'+i,gameId:'truck-'+i,file:'truck'+i+'.png',name_ko:'차'+i}));
  Object.assign(api.state,{displayTrucks:list,mission:list.slice(0,2),currentLevel:1,userIndex:0,gridSize:4,gameStarted:true,isBusy:false});
  api.render();api.updateTargetGlow();
  return Object.assign(f,{game,api});
}
function assertFireHints(f,enabled){
  const target=f.api.state.mission[f.api.state.userIndex]?.gameId;
  for(const el of f.container.querySelectorAll('.md14-truck-btn'))assert.equal(el.classList.contains('target-glow'),enabled&&el.dataset.gameId===target);
  assert.equal(f.container.querySelector('[data-action="help"]').getAttribute('aria-pressed'),String(enabled));checks++;
}
for(const help of [true,false]){
  const f=fireFixture(help);assertFireHints(f,help);
  const first=f.api.state.mission[0].gameId, second=f.api.state.mission[1].gameId;
  const click=id=>f.container.querySelector(`[data-game-id="${id}"]`).click();
  click('truck-3');assert.equal(f.api.state.userIndex,0);assertFireHints(f,help);
  click(first);assert.equal(f.api.state.userIndex,1);assertFireHints(f,help);
  assert.equal(f.container.querySelectorAll('.water-drop').length,15,'Intermediate success keeps water particles after render');
  const drop=f.container.querySelector('.water-drop');assert.equal(drop.style.left,'130px');assert.equal(drop.style.top,'160px','Water uses the root coordinate space');
  f.advance(700);assert.equal(f.container.querySelectorAll('.water-drop').length,0,'Particles expire');
  const lastButton=f.container.querySelector(`[data-game-id="${second}"]`);lastButton.click();lastButton.click();
  assert.equal(f.api.state.userIndex,2);assert.equal(f.api.state.isBusy,true,'Repeated completion cannot advance again');
  assert.equal(f.container.querySelectorAll('.water-drop').length,30);
  f.game.destroy();assert.equal(f.timers.size,0);assert.equal(f.container.querySelectorAll('.water-drop').length,0);checks+=7;
}
for(const event of [{detail:0,clientX:0,clientY:0},undefined]){
  const f=fireFixture(false), first=f.api.state.mission[0].gameId;
  const button=f.container.querySelector(`[data-game-id="${first}"]`);
  f.api.handleTouch(first,button,event);
  const drop=f.container.querySelector('.water-drop');
  assert.equal(drop.style.left,'50px');assert.equal(drop.style.top,'60px','Keyboard/no-coordinate clicks emit at the button center');
  assert.equal(f.api.state.userIndex,1);f.game.destroy();checks++;
}
for(const denied of [false,true,'write']){
  const stored=denied==='write'?new Map([[FIRE_KEY,'on']]):new Map();
  const f=fireFixture(null,denied,stored);assertFireHints(f,true);
  const before=JSON.stringify({mission:f.api.state.mission,choices:f.api.state.displayTrucks,index:f.api.state.userIndex,level:f.api.state.currentLevel});
  f.container.querySelector('[data-action="help"]').click();assertFireHints(f,false);
  assert.equal(JSON.stringify({mission:f.api.state.mission,choices:f.api.state.displayTrucks,index:f.api.state.userIndex,level:f.api.state.currentLevel}),before,'Help toggling keeps the fire mission');
  f.game.destroy();f.game.render(f.container,{});assert.equal(f.api.state.helpEnabled,false,'Same session survives storage refusal');
  assert.equal(f.container.querySelector('[data-action="help"]').getAttribute('aria-pressed'),'false');
  f.container.querySelector('[data-action="help"]').click();assert.equal(f.api.state.helpEnabled,true);
  if(!denied){
    assert.equal(f.storage.get(FIRE_KEY),'on');
    f.container.querySelector('[data-action="help"]').click();
    const again=fireFixture(null,false,f.storage);assertFireHints(again,false);
  }
  assert.equal(f.storage.has(BALLOON_KEY),false);f.game.destroy();checks+=5;
}
console.log(`PASS ${checks} help-mode scenarios: default, immediate/delayed clues, wrong/correct outcomes, persistence/denial, unchanged rounds, water coordinates/lifetime and destroy. Browser NOT_RUN.`);
