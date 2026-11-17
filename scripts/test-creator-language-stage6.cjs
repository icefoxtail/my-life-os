/* Real stage6 language functions under deterministic timers and a small DOM.
 * No pixels, physical touch or audible pronunciation claims are made here. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname,'..');
const raw = fs.readFileSync(path.join(root,'js/games/abc-phonics.js'),'utf8');
const source = raw.replace(/\}\)\(\);\s*$/, 'window.__language={state,DATASETS,syllableLink,matchingItems};\n})();');
function clock() {
  let now = 0, next = 0;
  const tasks = new Map();
  return {tasks, get now() { return now; },
    setTimeout(fn, ms = 0) { const id = ++next; tasks.set(id, {fn, at: now + ms}); return id; },
    clearTimeout(id) { tasks.delete(id); },
    tick(ms) {
      const end = now + ms;
      for (let guard = 0; guard < 2000; guard++) {
        const entry = [...tasks].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!entry) { now = end; return; }
        tasks.delete(entry[0]); now = entry[1].at; entry[1].fn();
      }
      throw new Error('clock did not settle');
    }
  };
}
function node(tag = 'div', attrs = {}) {
  let html = '';
  const el = {tag, attrs, dataset: {}, children: [], parentElement: null, style: {setProperty(k,v){this[k]=v;}}, textContent: '',
    className: attrs.class || '', id: attrs.id || '', offsetWidth: 100, disabled: Object.hasOwn(attrs,'disabled'), hidden: Object.hasOwn(attrs,'hidden'), naturalWidth: 0,
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k] ?? null; },
    removeAttribute(k) { delete this.attrs[k]; },
    getBoundingClientRect() { return {left:0,top:0,width:200,height:200}; },
    contains(child) { return this===child || this.children.some(n=>n.contains(child)); },
    appendChild(child) { child.parentElement = this; this.children.push(child); return child; },
    remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(x => x !== this); },
    addEventListener(type, fn) { this['on' + type] = fn; },
    click() { if(!this.disabled) this.onclick?.({target: this}); },
    matches(selector) {
      if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
      if (selector.startsWith('#')) return this.id === selector.slice(1);
      const a = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
      return a ? Object.hasOwn(this.attrs, a[1]) && (a[2] == null || this.attrs[a[1]] === a[2]) : this.tag === selector;
    },
    querySelectorAll(selector) {
      const selectors=selector.split(/,\s*/);
      const visit = n => n.children.flatMap(child => [...(selectors.some(s=>child.matches(s)) ? [child] : []), ...visit(child)]);
      return visit(this);
    },
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
    closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; },
    get innerHTML() { return html; },
    set innerHTML(value) { html = value; this.children = []; parseInto(this, value); }
  };
  for (const [k, v] of Object.entries(attrs)) if (k.startsWith('data-')) el.dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
  el.classList = {
    contains: value => el.className.split(/\s+/).includes(value),
    add(...values) { el.className = [...new Set([...el.className.split(/\s+/).filter(Boolean), ...values])].join(' '); },
    remove(...values) { el.className = el.className.split(/\s+/).filter(v => !values.includes(v)).join(' '); },
    toggle(value, on) { on ? this.add(value) : this.remove(value); }
  };
  return el;
}
function parseInto(parent, html) {
  const stack = [parent];
  for (const match of html.matchAll(/<\/?([a-z][\w-]*)\b([^>]*)>|([^<]+)/gi)) {
    if (match[3]) { stack.at(-1).textContent += match[3].trim(); continue; }
    if (match[0].startsWith('</')) {
      while (stack.length > 1) { if (stack.pop().tag === match[1]) break; }
      continue;
    }
    const attrs = Object.fromEntries([...match[2].matchAll(/([:\w-]+)(?:="([^"]*)")?/g)].map(a => [a[1], a[2] || '']));
    const child = stack.at(-1).appendChild(node(match[1], attrs));
    if (!/^(img|input|br|hr|meta|link)$/.test(match[1]) && !match[0].endsWith('/>')) stack.push(child);
  }
}

function fixture({realVoice=false}={}) {
  const time=clock(), container=node(), head=node('head'), voices=[], rewards=[], confetti=[], utterances=[];
  let lang='ko', stops=0;
  const window={innerWidth:390,innerHeight:844,setTimeout:time.setTimeout,clearTimeout:time.clearTimeout,
    addEventListener(){},removeEventListener(){},
    SihyeonPlaySettings:{getLanguage:()=>lang},
    SihyeonVoice:{stop(){stops++;},speak(text,options){voices.push({kind:'speak',text,options});return Promise.resolve(true);},
      play(id,text,options){voices.push({kind:'play',id,text,options});return Promise.resolve(true);}}};
  const handlers={};
  const document={head,hidden:false,documentElement:{},createElement:node,getElementById:id=>head.querySelector('#'+id),addEventListener(k,fn){handlers[k]=fn;},removeEventListener(k){delete handlers[k];}};
  const speechSynthesis={getVoices:()=>[],cancel(){},speak(u){utterances.push({text:u.text,lang:u.lang});u.onend?.();}};
  window.speechSynthesis=speechSynthesis;
  const context=vm.createContext({window,document,navigator:{},console,setTimeout:time.setTimeout,clearTimeout:time.clearTimeout,
    speechSynthesis,SpeechSynthesisUtterance:function(text){this.text=text;},
    fetch:async()=>({ok:true,json:async()=>({voices:{}})})});
  if(realVoice){
    vm.runInContext(fs.readFileSync(path.join(root,'js/english-listening.js'),'utf8'),context);
    vm.runInContext(fs.readFileSync(path.join(root,'js/voice-engine.js'),'utf8'),context);
  }
  vm.runInContext(source,context);
  const api=window.__language, game=window.SihyeonGames.abcPhonics;
  const render=()=>game.render(container,{fireConfetti:()=>confetti.push(time.now),gainExp:n=>rewards.push(n)});
  render();
  return {api,game,time,window,document,handlers,container,voices,utterances,rewards,confetti,render,setLanguage:v=>{lang=v;},get stops(){return stops;},
    get:selector=>container.querySelector(selector),click:selector=>{const el=container.querySelector(selector);assert.ok(el,selector);el.click();},
    transform(){this.click('#ltMainCard');time.tick(800);assert.equal(api.state.phase,'OBJECT');}};
}
const cases=[];
function test(name,fn){fn();cases.push(name);}

test('an object is replayable and Next is the only progression',()=>{
 const f=fixture();f.transform();
 assert.equal(f.get('#ltWordLabel').textContent,'Apple');
 assert.equal(f.confetti.length,1);assert.equal(f.api.state.currentIndex,0);
 const count=f.voices.length;f.click('#ltMainCard');f.time.tick(10000);
 assert.equal(f.api.state.currentIndex,0);assert.equal(f.api.state.phase,'OBJECT');
 assert.equal(f.voices.length,count+1);assert.equal(f.voices.at(-1).text,'Apple!');assert.equal(f.confetti.length,1);
 f.click('#ltHint');f.click('#ltHint');f.time.tick(330);
 assert.equal(f.api.state.currentIndex,1);assert.equal(f.api.state.phase,'LETTER');
});
test('fast taps cannot skip transformation or make repeated rewards',()=>{
 const f=fixture();f.click('#ltMainCard');f.click('#ltMainCard');f.click('#ltHint');f.time.tick(799);
 assert.equal(f.voices.length,1,'delayed intro cannot interrupt a child-started transformation');
 assert.equal(f.api.state.phase,'TRANSFORMING');assert.equal(f.api.state.currentIndex,0);assert.equal(f.confetti.length,0);
 f.time.tick(1);f.time.tick(5000);assert.equal(f.confetti.length,1);assert.equal(f.api.state.currentIndex,0);
});
test('wrong and repeated right picture choices preserve the round and reward once',()=>{
 const f=fixture();f.transform();f.click('#ltFind');
 assert.equal(f.api.state.phase,'CHOOSING');
 assert.equal(f.get('#ltMainCard').hidden,true);assert.equal(f.get('#ltChoices').hidden,false);
 f.click('[data-choice="Ball"]');assert.equal(f.api.state.currentIndex,0);assert.equal(f.confetti.length,1);
 assert.ok(f.get('#ltContext').textContent.includes('Apple'));
 f.click('[data-choice="Apple"]');f.click('[data-choice="Apple"]');assert.equal(f.confetti.length,2);
 f.click('[data-choice="Ball"]');f.click('[data-choice="Apple"]');assert.equal(f.confetti.length,2);
 f.click('#ltFind');assert.equal(f.api.state.phase,'OBJECT');assert.equal(f.get('#ltMainCard').hidden,false);
 f.click('#ltFind');f.click('[data-choice="Apple"]');assert.equal(f.confetti.length,2,'reopening the same match does not farm rewards');
 f.click('#ltHint');f.time.tick(330);assert.equal(f.api.state.currentIndex,1);
});
test('early instruction replay supersedes intro, and hiding cancels late voice without restarting play',()=>{
 const f=fixture();f.click('#ltReplayPrompt');const count=f.voices.length;f.time.tick(700);assert.equal(f.voices.length,count);
 f.render();f.document.hidden=true;f.handlers.visibilitychange();f.time.tick(600);assert.equal(f.voices.length,count);
 f.document.hidden=false;f.handlers.visibilitychange();f.transform();f.click('#ltFind');const phase=f.api.state.phase;
 const last=f.voices.at(-1).options,before=f.voices.length;f.document.hidden=true;f.handlers.visibilitychange();
 assert.equal(last.shouldPlay(),false);f.time.tick(9000);assert.equal(f.voices.length,before);
 f.document.hidden=false;f.handlers.visibilitychange();assert.equal(f.api.state.phase,phase);assert.equal(f.api.state.currentIndex,0);
});
test('each exercise has three distinct pictures and target moves between slots',()=>{
 const f=fixture();
 for(const mode of ['abc','hangul']){
  f.api.state.mode=mode;
  const positions=[];
  for(let i=0;i<f.api.DATASETS[mode].items.length;i++){
   f.api.state.currentIndex=i;
   const items=f.api.matchingItems().map(x=>x.word),target=f.api.DATASETS[mode].items[i].word;
   assert.equal(new Set(items).size,3);assert.equal(items.filter(x=>x===target).length,1);positions.push(items.indexOf(target));
  }
  assert.equal(new Set(positions).size,3);
 }
});
test('switching during the transform cancels old callbacks and stale voice permissions',()=>{
 const f=fixture();f.click('#ltMainCard');const old=f.voices.at(-1).options;
 f.time.tick(100);f.click('[data-mode="hangul"]');f.time.tick(5000);
 assert.equal(f.api.state.mode,'hangul');assert.equal(f.api.state.currentIndex,0);assert.equal(f.api.state.phase,'LETTER');
 assert.equal(f.get('#ltWordLabel').textContent,'ㄱ');assert.equal(f.confetti.length,0);assert.equal(old.shouldPlay(),false);
});
test('sound toggle cancels pending audio and replay never changes play state',()=>{
 const f=fixture();f.transform();const old=f.voices.at(-1).options;
 f.click('#ltSound');assert.equal(f.get('#ltSound').getAttribute('aria-pressed'),'false');assert.equal(old.shouldPlay(),false);
 const count=f.voices.length;f.click('#ltReplayPrompt');f.click('#ltMainCard');assert.equal(f.voices.length,count);
 assert.equal(f.api.state.phase,'OBJECT');f.click('#ltSound');assert.equal(f.get('#ltSound').getAttribute('aria-pressed'),'true');
 f.click('#ltReplayPrompt');assert.equal(f.voices.length,count+1);assert.equal(f.api.state.currentIndex,0);
});
test('Korean transform explains an actual combined syllable without pseudo phonemes',()=>{
 const f=fixture();f.click('[data-mode="hangul"]');f.transform();
 assert.ok(f.voices.some(v=>v.text==='글자 이름은 기역. 기역과 아가 만나면 가. 가방.'));
 assert.ok(f.voices.every(v=>!/[그느드르므브스으즈], [그느드르므브스으즈]/.test(v.text)));
 const vowelNames=['아','애','야','얘','어','에','여','예','오','와','왜','외','요','우','워','웨','위','유','으','의','이'];
 for(const item of f.api.DATASETS.hangul.items){
  const first=item.word[0],vowel=vowelNames[Math.floor((first.codePointAt(0)-0xac00)/28)%21];
  assert.ok(!f.api.syllableLink(item).text.includes('undefined'));assert.ok(!f.api.syllableLink(item).speech.includes('undefined'));assert.ok(f.api.syllableLink(item).text.includes(vowel));assert.ok(f.api.syllableLink(item).speech.includes(`만나면 ${first}.`));
 }
});
test('actual shared English engine speaks ABC replay, guide and completion without an ID translation',()=>{
 const f=fixture({realVoice:true});f.setLanguage('en');
 f.click('#ltReplayPrompt');assert.equal(f.utterances.at(-1).text,'Letter A. Touch the letter.');
 f.transform();assert.equal(f.utterances.at(-1).text,'A. Apple.');
 let count=f.utterances.length;f.click('#ltMainCard');assert.equal(f.utterances.length,count+1);assert.equal(f.utterances.at(-1).text,'Apple!');
 f.click('#ltFind');assert.equal(f.utterances.at(-1).text,'Find the apple.');
 f.click('#ltSound');count=f.utterances.length;f.click('#ltReplayPrompt');assert.equal(f.utterances.length,count);f.click('#ltSound');
 f.click('#ltHint');f.time.tick(330);f.transform();f.click('#ltHint');f.time.tick(330);f.transform();f.click('#ltHint');f.time.tick(330);
 assert.equal(f.utterances.at(-1).text,'You met A, B, and C!');assert.ok(f.utterances.every(u=>u.lang==='en-US'));
 f.click('#ltSwitch');count=f.utterances.length;f.time.tick(1000);f.transform();f.click('#ltReplayPrompt');assert.equal(f.utterances.length,count,'Hangul must not turn into English phonics');
});
test('the acorn is a distinct semantic vector, not a chestnut emoji',()=>{
 const f=fixture();f.click('[data-mode="hangul"]');
 for(let i=0;i<2;i++){f.transform();f.click('#ltHint');f.time.tick(330);}
 f.transform();assert.equal(f.get('#ltWordLabel').textContent,'도토리');
 assert.ok(f.get('#ltFallbackObject').querySelector('svg'));assert.ok(!raw.includes("fallbackObject: '🌰'"));
});
test('destroy cancels transformations and outstanding replay permissions',()=>{
 const f=fixture();f.click('#ltMainCard');const last=f.voices.at(-1).options,count=f.voices.length;
 f.game.destroy();f.time.tick(9000);assert.equal(f.confetti.length,0);assert.equal(f.voices.length,count);
 assert.equal(last.shouldPlay(),false);assert.equal(f.container.children.length,0);
});
test('explicit completion is once per play and never triggered by replay',()=>{
 const f=fixture();
 for(let i=0;i<3;i++){f.transform();f.click('#ltMainCard');assert.equal(f.api.state.currentIndex,i);f.click('#ltHint');f.time.tick(330);}
 assert.equal(f.api.state.phase,'COMPLETE');assert.deepEqual(f.rewards,[20]);f.time.tick(10000);assert.deepEqual(f.rewards,[20]);
});

const html=fs.readFileSync(path.join(root,'games/hangul-playmat-3d.html'),'utf8');
function between(a,b){const x=html.indexOf(a),y=html.indexOf(b,x+a.length);assert.ok(x>=0&&y>x);return html.slice(x,y);}
const data={};vm.runInNewContext(between('const CHO_LIST = [','/* ============================================================================\n * 2.')+'\nthis.api={CHO_LIST,JUNG_LIST,CHO_MAP,JUNG_MAP,getSyllableMeta};',data);
test('every 3D consonant tap says its name, while composed blocks say the actual syllable',()=>{
 const spoken=[];const c={...data.api,state:{},sfx(){},triggerSquash(){},say:t=>spoken.push(t),toast(){},burstParticles(){},spawnMiniToyPopup(){}};
 vm.runInNewContext(between('function handleBlockTap(','/* ============================================================================\n * 6.')+'\nthis.tap=handleBlockTap;',c);
 for(const item of data.api.CHO_LIST){c.tap({role:'cho',cho:item.id});assert.equal(spoken.at(-1),`자음 이름은 ${item.name}.`);}
 c.tap({role:'syllable',cho:'ㄱ',jung:'ㅏ'});assert.ok(spoken.at(-1).includes('합치면 가. 가방'));
 c.tap({role:'syllable',cho:'ㅇ',jung:'ㅏ'});assert.ok(spoken.at(-1).includes('합치면 아.'));assert.ok(!spoken.at(-1).includes('으'));
});
test('3D instruction is retained while muted and replayed after unmuting; English policy is preserved',()=>{
 const speech=[],state={sound:false},shared={speak(text){speech.push(text);return Promise.resolve(true);}};
 let language='ko';const rootVoice={SihyeonVoice:shared,SihyeonPlaySettings:{getLanguage:()=>language}};
 const c={state,speechAvailable:false,window:{},getVoiceRoot:()=>rootVoice};
 vm.runInNewContext(between('function say(text){','function tone(')+'\nthis.say=say;',c);
 c.say('기역, 아. 합치면 가. 가방!');assert.equal(speech.length,0);assert.ok(state.lastSpeech.includes('합치면 가'));
 state.sound=true;c.say(state.lastSpeech);assert.equal(speech.length,1);
 language='en';c.say('이응, 아. 합치면 아.');assert.equal(speech.length,1);
 state.destroyed=true;c.say('가');assert.equal(speech.length,1);
});
console.log(`PASS ${cases.length} stage6 language cases: ${cases.join('; ')}. Browser/audio NOT_RUN.`);
