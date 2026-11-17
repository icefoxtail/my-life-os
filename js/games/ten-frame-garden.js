(function () {
  'use strict';

  const KEY = 'tenFrameGarden';
  const SAVE_KEY = 'sihyeon-ten-frame-garden-v1';
  const MODES = ['number', 'free', 'fill', 'colors'];
  const FLOWERS = [
    { id: 'yellow', name: '노란 꽃', en: 'yellow flowers', petal: '#f4c84c', center: '#92572d' },
    { id: 'pink', name: '분홍 꽃', en: 'pink flowers', petal: '#e78fa2', center: '#f8d36b' },
    { id: 'purple', name: '보라 꽃', en: 'purple flowers', petal: '#a18dcf', center: '#f8d36b' }
  ];
  const isQuantity = value => Number.isInteger(value) && value >= 0 && value <= 30;
  const nextTen = n => Math.min(30, (Math.floor(n / 10) + 1) * 10);
  const clone = value => JSON.parse(JSON.stringify(value));
  const partner = id => FLOWERS[(FLOWERS.findIndex(f => f.id === id) + 1) % FLOWERS.length].id;

  function createState(input) {
    input = input && typeof input === 'object' ? input : {};
    const quantity = isQuantity(input.quantity) ? input.quantity : 15;
    const mode = MODES.includes(input.mode) ? input.mode : 'number';
    return {
      version: 1, quantity, mode,
      flower: FLOWERS.some(f => f.id === input.flower) ? input.flower : 'yellow',
      reading: input.reading === 'sino' ? 'sino' : 'native',
      split: Number.isInteger(input.split) ? Math.max(0, Math.min(quantity, input.split)) : Math.ceil(quantity / 2),
      count: quantity, goal: mode === 'fill' ? nextTen(quantity) : quantity,
      phase: 'ready', active: 0
    };
  }
  function preferences(state) {
    return { version: 1, quantity: state.quantity, mode: state.mode, flower: state.flower, reading: state.reading, split: state.split };
  }
  function reduce(state, action) {
    if (!state || !action) return state;
    const base = preferences(state);
    switch (action.type) {
      case 'QUANTITY':
        if (!isQuantity(action.value)) return state;
        return createState(Object.assign(base, { quantity: action.value, split: Math.min(action.value, state.split) }));
      case 'MODE':
        return MODES.includes(action.value) ? createState(Object.assign(base, { mode: action.value })) : state;
      case 'FLOWER':
        return FLOWERS.some(f => f.id === action.value) ? createState(Object.assign(base, { flower: action.value })) : state;
      case 'READING':
        return ['native', 'sino'].includes(action.value) ? createState(Object.assign(base, { reading: action.value })) : state;
      case 'SPLIT':
        if (!Number.isInteger(action.value) || action.value < 0 || action.value > state.quantity) return state;
        return createState(Object.assign(base, { split: action.value }));
      case 'REPLAY': return createState(base);
      case 'STEP':
        if (!Number.isInteger(action.ordinal) || action.ordinal < 1 || action.ordinal > state.goal) return state;
        return Object.assign({}, state, {
          phase: 'counting', active: action.ordinal,
          count: state.mode === 'fill' ? Math.max(state.count, action.ordinal) : state.count
        });
      case 'COMPLETE': return Object.assign({}, state, { count: state.goal, phase: 'complete', active: 0 });
      case 'PAUSE': return Object.assign({}, state, { phase: 'paused', active: 0 });
      default: return state;
    }
  }
  function slots(state) {
    const capacity = Math.max(10, Math.ceil(state.goal / 10) * 10);
    return Array.from({ length: capacity }, (_, index) => ({
      id: 'garden-flower-' + (index + 1), ordinal: index + 1, frame: Math.floor(index / 10),
      filled: index < state.count,
      flower: state.mode === 'colors' && index >= state.split ? partner(state.flower) : state.flower,
      active: index + 1 === state.active
    }));
  }
  function inspect(state) {
    const all = slots(state);
    const filling = state.mode === 'fill';
    return {
      chosen: state.quantity, visible: all.filter(s => s.filled).length, goal: state.goal,
      initialNeed: filling ? state.goal - state.quantity : 0,
      added: filling ? state.count - state.quantity : 0,
      stillNeeded: filling ? state.goal - state.count : 0,
      frames: all.length / 10, capacity: all.length, empty: all.filter(s => !s.filled).length,
      firstColor: state.mode === 'colors' ? state.split : state.count,
      secondColor: state.mode === 'colors' ? state.quantity - state.split : 0,
      groups: Array.from({ length: all.length / 10 }, (_, frame) => all.filter(s => s.frame === frame && s.filled).length)
    };
  }
  const Model = Object.freeze({ MAX_QUANTITY: 30, createState, restore: createState, preferences, reduce, slots, inspect, nextTen });
  window.SihyeonTenFrameGardenModel = Model;

  const view = {
    container: null, options: {}, state: null, sequencer: null, runId: 0, handlers: null,
    modal: null, muted: false, voiceFailed: false, saveFailed: false, memory: null,
    undo: [], age: 4, language: 'ko', previousBack: null, lastWord: '', lastOrdinal: 0, userPaused: false, resumeAfterModal: false, resumeAfterVisibility: false, groupMode: 'ones', groupStart: 0, groupEnd: 0
  };
  const Q = () => window.SihyeonQuantityPlayModel;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const currentAge = () => { const n = Number(window.SihyeonPlaySettings?.getAge?.() || view.options.ageMode || 4); return [4, 5, 6, 7].includes(n) ? n : 4; };
  const language = () => window.SihyeonPlaySettings?.getLanguage?.() === 'en' ? 'en' : 'ko';
  const flower = id => FLOWERS.find(f => f.id === id) || FLOWERS[0];

  function flowerSvg(id) {
    const f = flower(id);
    return '<svg class="tfg-flower" viewBox="0 0 80 96" aria-hidden="true" focusable="false"><path d="M40 45v42" fill="none" stroke="#527d52" stroke-width="6" stroke-linecap="round"/><path d="M38 74C17 75 15 62 17 58c17-2 25 6 23 16M42 81c20 0 24-12 21-16-14-1-22 5-21 16" fill="#81a46b" stroke="#527d52" stroke-width="2"/><g fill="' + f.petal + '" stroke="#735d47" stroke-width="1.7"><ellipse cx="40" cy="20" rx="12" ry="17"/><ellipse cx="40" cy="20" rx="12" ry="17" transform="rotate(60 40 37)"/><ellipse cx="40" cy="20" rx="12" ry="17" transform="rotate(120 40 37)"/><ellipse cx="40" cy="20" rx="12" ry="17" transform="rotate(180 40 37)"/><ellipse cx="40" cy="20" rx="12" ry="17" transform="rotate(240 40 37)"/><ellipse cx="40" cy="20" rx="12" ry="17" transform="rotate(300 40 37)"/></g><circle cx="40" cy="37" r="11.5" fill="' + f.center + '" stroke="#735d47" stroke-width="2"/><circle cx="36" cy="35" r="1.5" fill="#654a39"/><circle cx="44" cy="35" r="1.5" fill="#654a39"/><path d="M36 41q4 3 8 0" fill="none" stroke="#654a39" stroke-width="1.5" stroke-linecap="round"/></svg>';
  }
  function icon(name) {
    const paths = {
      home: '<path d="m4 14 12-10 12 10M8 12v16h16V12M13 28v-9h6v9"/>',
      hear: '<path d="M4 12h5l7-6v20l-7-6H4zM21 11q6 5 0 10M24 6q12 10 0 20"/>',
      mute: '<path d="M4 12h5l7-6v20l-7-6H4zM22 12l7 9m0-9-7 9"/>',
      replay: '<path d="M7 10a11 11 0 1 1-1 13M7 3v8H1"/>',
      undo: '<path d="m12 7-8 8 8 8M5 15h15a7 7 0 0 1 7 7v4"/>',
      close: '<path d="m8 8 16 16M24 8 8 24"/>',
      plus: '<path d="M16 5v22M5 16h22"/>',
      minus: '<path d="M5 16h22"/>'
    };
    return '<svg class="tfg-icon" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">' + (paths[name] || paths.hear) + '</svg>';
  }
  function modeMark(mode) {
    if (mode === 'number') return '<span class="tfg-mode-numeral">123</span>';
    if (mode === 'free') return '<span class="tfg-mode-numeral">＋−</span>';
    if (mode === 'fill') return '<span class="tfg-mini-frame" aria-hidden="true">' + Array.from({ length: 10 }, () => '<i></i>').join('') + '</span>';
    return '<span class="tfg-two-flowers">' + flowerSvg('yellow') + flowerSvg('pink') + '</span>';
  }
  function save() {
    if (!view.state) return;
    view.memory = Object.assign(preferences(view.state), { muted: view.muted, groupMode: view.groupMode });
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(view.memory)); view.saveFailed = false; }
    catch (_) { view.saveFailed = true; }
  }
  function load() {
    if (view.memory) return clone(view.memory);
    try { const raw = localStorage.getItem(SAVE_KEY); const parsed = raw ? JSON.parse(raw) : null; return parsed?.version === 1 ? parsed : {}; }
    catch (_) { return {}; }
  }
  function stopRun(reason) {
    if(reason === 'pause'){
      view.sequencer?.pause?.();
      if(view.state && view.sequencer?.isPaused?.())view.state=Object.assign({},view.state,{phase:'paused'});
      paintPlayback();return;
    }
    view.runId++;view.sequencer?.stop?.();
  }
  function modeGuide(mode) {
    return ({ number: ['원하는 꽃과 숫자를 골라요.', 'Choose a flower and a number.'], free: ['더하고 빼며 꽃정원을 바꿔요.', 'Add or take away flowers.'], fill: ['선택한 수에서 열 칸을 이어 채워요.', 'Keep planting to fill the next ten.'], colors: ['두 색으로 같은 수를 만들어요.', 'Make the same number with two colors.'] })[mode];
  }
  function countSteps(state, announceMode) {
    const steps = [];
    if (announceMode && state.mode !== 'fill') {
      const guide = modeGuide(state.mode);
      steps.push({ id: 'garden-guide', text: guide[0], enText: guide[1], kind: 'guide' });
    }
    if (state.mode === 'fill' && state.quantity < state.goal) {
      const need = state.goal - state.quantity;
      steps.push({ id: 'garden-starting-flowers', kind: 'baseline', ordinal: state.quantity,
        text: (state.quantity === 0 ? '아직 꽃이 없어요.' : '꽃이 ' + Q().quantityText(state.quantity, '송이', 'ko') + ' 있어요.') + ' ' + Q().quantityText(need, '송이', 'ko') + '를 더 심으면 ' + Q().quantityText(state.goal, '송이', 'ko') + '가 돼요.',
        enText: (state.quantity === 0 ? 'There are no flowers yet.' : state.quantity === 1 ? 'There is one flower.' : 'There are ' + Q().quantityText(state.quantity, '송이', 'en') + '.') + ' Add ' + Q().quantityText(need, '송이', 'en') + ' to make ' + Q().quantityText(state.goal, '송이', 'en') + '.' });
    }
    const firstOrdinal = state.mode === 'fill' ? state.quantity + 1 : 1;
    const groupSize=state.mode!=='fill'&&view.groupMode==='fives'?5:state.mode!=='fill'&&view.groupMode==='tens'?10:1;
    for (let from = firstOrdinal; from <= state.goal; from+=groupSize) {
      const n=Math.min(state.goal,from+groupSize-1);
      if(groupSize>1){
        const parts=[];for(let v=0;v<n;v+=groupSize)parts.push(Math.min(groupSize,n-v));
        steps.push({id:'garden-group-'+n,kind:'group',ordinal:n,from,label:parts.join('+'),text:parts.map(v=>Q().quantityText(v,'송이','ko')).join(', ')+'. 모두 '+Q().quantityText(n,'송이','ko')+'예요.',enText:parts.map(v=>Q().countWord(v,'sino','en')).join(' plus ')+'. '+Q().quantityText(n,'송이','en')+' in all.'});continue;
      }
      steps.push({ id: 'garden-count-' + n, ordinal: n, kind: 'count',
        nativeText: Q().countWord(n, 'native', 'ko'), sinoText: Q().countWord(n, 'sino', 'ko'),
        enText: Q().countWord(n, state.reading, 'en'), readingStyle: state.reading });
    }
    const totals = inspect(Object.assign({}, state, { count: state.goal }));
    let ko = state.goal === 0 ? '꽃이 하나도 없어요.' : '꽃이 모두 ' + Q().quantityText(state.goal, '송이', 'ko') + '예요.';
    let en = state.goal === 0 ? 'There are no flowers.' : state.goal === 1 ? 'There is one flower.' : 'There are ' + Q().quantityText(state.goal, '송이', 'en') + '.';
    if (state.mode === 'fill') {
      const need = state.goal - state.quantity;
      ko = need === 0
        ? '이미 ' + Q().quantityText(state.goal, '송이', 'ko') + '로 가득 찼어요. 더 심을 꽃은 없어요.'
        : (state.quantity === 0 ? '빈 화단에 ' : Q().quantityText(state.quantity, '송이', 'ko') + '에 ') + Q().quantityText(need, '송이', 'ko') + '를 더해서, 모두 ' + Q().quantityText(state.goal, '송이', 'ko') + '예요.';
      en = need === 0
        ? 'The garden already has ' + Q().quantityText(state.goal, '송이', 'en') + '. No more flowers are needed.'
        : (state.quantity === 0 ? 'Zero flowers' : Q().quantityText(state.quantity, '송이', 'en')) + ' and ' + Q().countWord(need, 'native', 'en') + ' more make ' + Q().quantityText(state.goal, '송이', 'en') + '.';
    } else if (state.mode === 'colors' && state.quantity > 0) {
      const second = state.quantity - state.split;
      const colorKo = (id, n) => flower(id).name + '은 ' + (n === 0 ? '없어요.' : Q().quantityText(n, '송이', 'ko') + '예요.');
      const colorEn = (id, n) => Q().countWord(n, 'native', 'en') + ' ' + id + (n === 1 ? ' flower' : ' flowers');
      ko = colorKo(state.flower, state.split) + ' ' + colorKo(partner(state.flower), second) + ' 모두 ' + Q().quantityText(state.quantity, '송이', 'ko') + '예요.';
      en = colorEn(state.flower, state.split) + ' and ' + colorEn(partner(state.flower), second) + '. ' + Q().quantityText(state.quantity, '송이', 'en') + ' in all.';
    } else if (totals.groups.filter(n => n > 0).length > 1) {
      ko = totals.groups.filter(n => n > 0).map(n => Q().quantityText(n, '송이', 'ko')).join(', ') + '. 모두 ' + Q().quantityText(state.goal, '송이', 'ko') + '예요.';
    }
    steps.push({ id: 'garden-total', text: ko, enText: en, kind: 'summary' });
    return steps;
  }
  function startAuto(announceMode, continuation) {
    if (!view.container || !view.state || !view.sequencer) return;
    stopRun();
    const run = view.runId;
    if(!continuation){view.state = reduce(view.state, { type: 'REPLAY' });view.lastWord = ''; view.lastOrdinal = 0;}
    view.groupStart=0;view.groupEnd=0;
    draw(); save();
    const steps = countSteps(view.state, announceMode).filter(step=>!continuation||step.kind==='summary'||((step.kind==='count'||step.kind==='group')&&step.ordinal>view.lastOrdinal));
    playSteps(steps,run);
  }
  function playSteps(steps,run){
    view.sequencer.start(steps, {
      muted: view.muted, paused:view.userPaused||!!view.modal, delayMs: 100,onState:paintPlayback,
      onStep(step) {
        if (!view.container || view.runId !== run) return;
        if (step.kind === 'count' || step.kind === 'group' || step.kind === 'change') {
          view.state = reduce(view.state, { type: 'STEP', ordinal: step.ordinal });
          if(step.activeOrdinal)view.state=Object.assign({},view.state,{active:step.activeOrdinal});
          view.lastOrdinal = step.ordinal;
          view.lastWord = step.kind==='change'?(language()==='en'?step.enLabel:step.label):step.kind==='group'?step.label:Q().countWord(step.ordinal, view.state.reading, language());
          view.groupStart=step.kind==='group'?step.from:0;view.groupEnd=step.kind==='group'?step.ordinal:0;
        } else {
          view.state = Object.assign({}, view.state, { active: 0 });view.groupStart=0;view.groupEnd=0;
          if (step.kind === 'baseline') { view.lastOrdinal = step.ordinal; view.lastWord = Q().quantityText(step.ordinal, '송이', language()); }
          if (step.kind === 'summary') { view.lastOrdinal = view.state.goal; view.lastWord = view.state.goal === 0 ? '없어요' : '모두 ' + Q().quantityText(view.state.goal, '송이', 'ko'); }
        }
        paintProgress();
      },
      onEnd() {
        if (!view.container || view.runId !== run) return;
        view.state = reduce(view.state, { type: 'COMPLETE' }); paintProgress(); save();paintPlayback();
      },
      onError() {
        if (!view.container || view.runId !== run) return;
        view.voiceFailed = true;
        const note = view.container.querySelector('.tfg-voice-note');
        if (note) { note.hidden = false; note.textContent = '소리가 없어도 꽃을 함께 볼 수 있어요.'; }
      }
    }).catch(() => {
      if (!view.container || view.runId !== run) return;
      view.voiceFailed = true; view.state = reduce(view.state, { type: 'PAUSE' }); paintProgress();
    });
    if(view.userPaused)view.sequencer.pause();paintPlayback();
  }
  function paintPlayback(){
    const root=view.container;if(!root)return;
    const pause=root.querySelector('[data-action="pause"]');
    const paused=view.sequencer?.isPaused?.()||view.userPaused;
    if(pause){pause.textContent=paused?'▶':'⏸';pause.setAttribute('aria-label',paused?'이어서 세기':'잠깐 멈추기');pause.setAttribute('aria-pressed',String(paused));pause.disabled=view.state?.phase==='complete'&&!view.sequencer?.isPaused?.()&&!view.sequencer?.isRunning?.();}
    const group=root.querySelector('[data-action="group"]');if(group){group.textContent={ones:'1씩',fives:'5씩',tens:'10씩'}[view.groupMode];group.setAttribute('aria-label','세는 묶음 바꾸기, 현재 '+{ones:'하나씩',fives:'다섯 송이씩',tens:'열 송이씩'}[view.groupMode]);group.disabled=view.state?.mode==='fill';}
  }
  function change(action, announceMode) {
    if (!view.state) return;
    const before=view.state,next = reduce(before, action);
    if (next === before) return;
    view.undo.push(preferences(before)); if (view.undo.length > 20) view.undo.shift();
    const delta=next.quantity-before.quantity;
    const single=action.type==='QUANTITY'&&action.incremental===true&&Math.abs(delta)===1&&next.mode!=='fill';
    const recolor=action.type==='SPLIT'&&Math.abs(next.split-before.split)===1;
    stopRun();view.state=next;view.modal=null;
    if(action.type==='READING'){view.state=Object.assign({},before,{reading:next.reading});draw();save();startAuto(false,true);return;}
    if(single||recolor){
      view.state=Object.assign({},next,{phase:'counting'});view.lastOrdinal=next.quantity;view.groupStart=0;view.groupEnd=0;draw();save();
      const ordinal=next.quantity,activeOrdinal=single?next.quantity:Math.max(next.split,before.split);
      const ko=single?(delta>0?'하나 더, ':'하나 덜, ')+Q().countWord(next.quantity,next.reading,'ko'):'한 송이의 색을 바꿨어요. 모두 '+Q().quantityText(next.quantity,'송이','ko')+'예요.';
      const en=single?(delta>0?'One more, ':'One fewer, ')+Q().countWord(next.quantity,next.reading,'en'):'One flower changed color. Still '+Q().quantityText(next.quantity,'송이','en')+'.';
      playSteps([{id:'garden-change',kind:'change',ordinal,activeOrdinal,text:ko,enText:en,label:single?(delta>0?'+1':'−1'):'같은 수',enLabel:single?(delta>0?'+1':'−1'):'Same total'}],view.runId);
      return;
    }
    startAuto(announceMode);
  }
  function framesHtml() {
    const all = slots(view.state); const count = all.length / 10;
    return '<div class="tfg-frames" data-frames="' + count + '" style="--tfg-frames:' + count + '" role="region" aria-label="열 칸 화단. 스크롤해서 다른 화단도 볼 수 있어요" tabindex="0">' + Array.from({ length: count }, (_, f) => {
      const group = all.filter(s => s.frame === f);
      return '<section class="tfg-frame" aria-label="' + (f + 1) + '번째 열 칸 화단"><div class="tfg-frame-heading"><span>' + (f * 10 + 1) + '–' + ((f + 1) * 10) + '</span><strong data-frame-count="' + f + '">' + group.filter(s => s.filled).length + '</strong></div><div class="tfg-ten-grid">' + group.map(s => '<div class="tfg-slot" data-slot="' + s.ordinal + '" data-filled="' + s.filled + '" data-flower="' + s.flower + '" data-active="false" role="img" aria-label="' + (s.filled ? s.ordinal + '번째 꽃' : '빈 칸') + '">' + (s.filled ? flowerSvg(s.flower) : '<span class="tfg-soil-dot" aria-hidden="true"></span>') + '<span class="tfg-count-badge" aria-hidden="true">' + s.ordinal + '</span></div>').join('') + '</div></section>';
    }).join('') + '</div>';
  }
  function equationHtml() {
    const s = view.state; const d = inspect(s);
    // Keep the original amount and the complete addend visible even while
    // planting. Progress is a separate remaining count in the stage heading.
    if (s.mode === 'fill') return '<span data-fill-start>' + s.quantity + '</span><span>＋</span><span class="tfg-complement" data-fill-addend>' + d.initialNeed + '</span><span>＝</span><strong data-fill-goal>' + s.goal + '</strong>';
    if (s.mode === 'colors') return '<span class="tfg-equation-flower">' + flowerSvg(s.flower) + '<b>' + s.split + '</b></span><span>＋</span><span class="tfg-equation-flower">' + flowerSvg(partner(s.flower)) + '<b>' + (s.quantity - s.split) + '</b></span><span>＝</span><strong>' + s.quantity + '</strong>';
    const groups=view.groupMode==='fives'?Array.from({length:Math.max(1,Math.ceil(s.count/5))},(_,i)=>Math.max(0,Math.min(5,s.count-i*5))):d.groups.filter((n,i)=>n>0||i===0);
    return '<span class="tfg-group-equation">' + groups.join(' ＋ ') + '</span><span>＝</span><strong>' + s.count + '</strong>';
  }
  function fillNeedText() {
    const remaining = inspect(view.state).stillNeeded;
    return language() === 'en'
      ? remaining > 0 ? remaining + ' more' : 'All filled!'
      : remaining > 0 ? remaining + '송이 더' : '가득 찼어요!';
  }
  function modalHtml() {
    if (!view.modal) return '';
    if (view.modal === 'numbers') return '<div class="tfg-modal" data-modal="numbers"><section class="tfg-dialog" role="dialog" aria-modal="true" aria-labelledby="tfg-dialog-title"><header><div class="tfg-dialog-flower">' + flowerSvg(view.state.flower) + '</div><h2 id="tfg-dialog-title">몇 송이?</h2><button type="button" class="tfg-icon-button" data-action="close-modal" aria-label="닫기">' + icon('close') + '</button></header><div class="tfg-number-grid">' + Array.from({ length: 31 }, (_, n) => '<button type="button" data-action="quantity" data-value="' + n + '" aria-pressed="' + (n === view.state.quantity) + '" aria-label="꽃 ' + n + '송이 선택">' + n + '</button>').join('') + '</div></section></div>';
    return '<div class="tfg-modal"><section class="tfg-dialog tfg-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="tfg-dialog-title"><header><h2 id="tfg-dialog-title">함께 고르는 놀이</h2><button type="button" class="tfg-icon-button" data-action="close-modal" aria-label="닫기">' + icon('close') + '</button></header><div class="tfg-age-choices">' + [4, 5, 6, 7].map((n, i) => '<button type="button" data-action="age" data-value="' + n + '" aria-pressed="' + (view.age === n) + '"><span>' + ['🐣', '🐰', '🦊', '🐻'][i] + '</span><strong>' + n + '세</strong></button>').join('') + '</div><p>나이와 관계없이 원하는 숫자를 골라요.</p><div class="tfg-language-choices"><button type="button" data-action="language" data-value="ko" aria-pressed="' + (language() === 'ko') + '">🇰🇷 한국어</button><button type="button" data-action="language" data-value="en" aria-pressed="' + (language() === 'en') + '">🇺🇸 English</button></div><button type="button" class="tfg-dialog-done" data-action="close-modal">🌼 이어서 놀기</button></section></div>';
  }
  function draw() {
    if (!view.container || !view.state) return;
    const previous=new Map([...view.container.querySelectorAll('.tfg-slot')].map(el=>[el.dataset.slot,el]));
    const oldBoard=view.container.querySelector('.tfg-frames'),oldScroll={top:oldBoard?.scrollTop||0,left:oldBoard?.scrollLeft||0};
    const s = view.state;
    const titles = { number: '내 숫자', free: '자유 정원', fill: '열 칸 채우기', colors: '두 색 꽃' };
    view.container.innerHTML = '<section class="tfg-app" data-mode="' + s.mode + '" data-phase="' + s.phase + '" data-age="' + view.age + '"><header class="tfg-top"><button type="button" class="tfg-icon-button tfg-home" data-action="home" aria-label="숫자놀이터로">' + icon('home') + '</button><div class="tfg-brand"><small>꽃이 하나, 둘, 셋</small><h1>열 칸 꽃정원</h1></div><button type="button" class="tfg-icon-button" data-action="replay" aria-label="처음부터 다시 세기">' + icon('replay') + '</button><button type="button" class="tfg-icon-button" data-action="mute" aria-label="' + (view.muted ? '소리 켜기' : '소리 끄기') + '" aria-pressed="' + view.muted + '">' + icon(view.muted ? 'mute' : 'hear') + '</button></header><nav class="tfg-mode-bar" aria-label="꽃정원 놀이 선택"><div class="tfg-modes">' + MODES.map(mode => '<button type="button" data-action="mode" data-value="' + mode + '" aria-pressed="' + (s.mode === mode) + '" aria-label="' + titles[mode] + '">' + modeMark(mode) + '<span>' + titles[mode] + '</span></button>').join('') + '</div><button type="button" class="tfg-age-button" data-action="settings" aria-label="' + view.age + '세 놀이 설정"><b>' + view.age + '</b><span>세 ⚙</span></button></nav><main class="tfg-workspace"><section class="tfg-stage" aria-label="꽃이 피는 정원"><div class="tfg-stage-heading"><div class="tfg-goal">' + (s.mode === 'fill' ? '<small data-fill-need>' + fillNeedText() + '</small><strong>' + s.quantity + '<span> → </span>' + s.goal + '</strong>' : '<small>' + (s.mode === 'colors' ? '두 색, 같은 수' : '내가 고른 꽃') + '</small><strong>' + s.quantity + '<span> 송이</span></strong>') + '</div><div class="tfg-counting" aria-live="polite" aria-atomic="true"><b data-count-value>' + (view.lastOrdinal || (s.quantity === 0 ? '0' : '♪')) + '</b><span data-count-word>' + esc(view.lastWord || (s.quantity === 0 ? '없어요' : '함께 세어요')) + '</span></div></div>' + framesHtml() + '<div class="tfg-equation" aria-label="화단별 꽃 수">' + equationHtml() + '</div></section><aside class="tfg-controls" aria-label="꽃과 숫자 선택"><div class="tfg-flower-choices" aria-label="꽃 선택">' + FLOWERS.map(f => '<button type="button" data-action="flower" data-value="' + f.id + '" aria-label="' + f.name + ' 선택" aria-pressed="' + (s.flower === f.id) + '">' + flowerSvg(f.id) + '<span>' + f.name + '</span></button>').join('') + '</div><div class="tfg-quantity-control"><button type="button" class="tfg-step-button" data-action="less" aria-label="꽃 한 송이 덜"' + (s.quantity === 0 ? ' disabled' : '') + '>' + icon('minus') + '</button><button type="button" class="tfg-quantity-button" data-action="number-picker" aria-label="숫자 고르기, 현재 ' + s.quantity + '송이"><strong>' + s.quantity + '</strong><span>송이 ▦</span></button><button type="button" class="tfg-step-button" data-action="more" aria-label="꽃 한 송이 더"' + (s.quantity === 30 ? ' disabled' : '') + '>' + icon('plus') + '</button></div><div class="tfg-quick-numbers" aria-label="자주 고르는 숫자">' + [5, 9, 10, 15, 20, 30].map(n => '<button type="button" data-action="quantity" data-value="' + n + '" aria-pressed="' + (s.quantity === n) + '">' + n + '</button>').join('') + '</div>' + (s.mode === 'colors' ? '<div class="tfg-split-controls"><div>' + flowerSvg(s.flower) + '<strong>' + s.split + '</strong><span>＋</span>' + flowerSvg(partner(s.flower)) + '<strong>' + (s.quantity - s.split) + '</strong></div><button type="button" data-action="split-less" aria-label="첫 번째 색 꽃 한 송이를 두 번째 색으로 바꾸기"' + (s.split === 0 ? ' disabled' : '') + '>' + icon('minus') + '</button><button type="button" data-action="split-more" aria-label="두 번째 색 꽃 한 송이를 첫 번째 색으로 바꾸기"' + (s.split === s.quantity ? ' disabled' : '') + '>' + icon('plus') + '</button></div>' : '') + '<div class="tfg-reading" role="group" aria-label="숫자 읽는 방식"><button type="button" data-action="reading" data-value="native" aria-pressed="' + (s.reading === 'native') + '">🔊 하나·둘</button><button type="button" data-action="reading" data-value="sino" aria-pressed="' + (s.reading === 'sino') + '">🔊 일·이</button></div><div class="tfg-control-bottom"><button type="button" data-action="pause" aria-label="잠깐 멈추기" aria-pressed="false">⏸</button><button type="button" data-action="group" aria-label="세는 묶음 바꾸기">1씩</button><button type="button" data-action="undo" aria-label="이전 선택으로 돌아가기"' + (!view.undo.length ? ' disabled' : '') + '>' + icon('undo') + '<span>되돌리기</span></button><p class="tfg-voice-note"' + (view.voiceFailed ? '' : ' hidden') + '>소리가 없어도 꽃을 함께 볼 수 있어요.</p></div></aside></main>' + modalHtml() + '</section>';
    view.container.querySelectorAll('.tfg-slot').forEach(el=>{const old=previous.get(el.dataset.slot);if(old)el.replaceWith(old);});
    const board=view.container.querySelector('.tfg-frames');if(board){board.scrollTop=oldScroll.top;board.scrollLeft=oldScroll.left;}
    paintProgress();paintPlayback();
  }
  function paintProgress() {
    if (!view.container || !view.state) return;
    const s = view.state;
    const details = inspect(s);
    view.container.querySelector('.tfg-app')?.setAttribute('data-phase', s.phase);
    slots(s).forEach(slot => {
      const node = view.container.querySelector('[data-slot="' + slot.ordinal + '"]');
      if (!node) return;
      if (node.dataset.filled !== String(slot.filled) || (slot.filled && node.dataset.flower !== slot.flower)) {
        node.dataset.filled = String(slot.filled);node.dataset.flower=slot.flower;
        node.innerHTML = (slot.filled ? flowerSvg(slot.flower) : '<span class="tfg-soil-dot" aria-hidden="true"></span>') + '<span class="tfg-count-badge" aria-hidden="true">' + slot.ordinal + '</span>';
      }
      node.dataset.active = String(slot.active);node.dataset.grouped=String(slot.filled&&slot.ordinal>=view.groupStart&&slot.ordinal<=view.groupEnd&&view.groupEnd>0);
      node.setAttribute('aria-label', slot.filled ? slot.ordinal + '번째 꽃' : '빈 칸');
    });
    details.groups.forEach((n, index) => { const node = view.container.querySelector('[data-frame-count="' + index + '"]'); if (node) node.textContent = n; });
    const need = view.container.querySelector('[data-fill-need]');
    if (need) {
      need.textContent = fillNeedText();
      need.dataset.initialNeed = String(details.initialNeed);
      need.dataset.added = String(details.added);
      need.dataset.stillNeeded = String(details.stillNeeded);
    }
    const count = view.container.querySelector('[data-count-value]'); if (count) count.textContent = view.lastOrdinal || (s.quantity === 0 ? '0' : '♪');
    const word = view.container.querySelector('[data-count-word]'); if (word) word.textContent = view.lastWord || (s.quantity === 0 ? '없어요' : '함께 세어요');
    const equation = view.container.querySelector('.tfg-equation');
    if (equation) {
      equation.innerHTML = equationHtml();
      equation.setAttribute('aria-label', s.mode === 'fill'
        ? language() === 'en' ? 'Starting flowers plus more flowers equals the goal' : '처음 꽃 수 더하기 더 심을 꽃 수는 목표 수'
        : '화단별 꽃 수');
    }
    revealActiveFlower();
  }
  function revealActiveFlower() {
    if (!view.container || !view.state?.active) return;
    const board = view.container.querySelector('.tfg-frames');
    const slot = board?.querySelector('[data-slot="' + view.state.active + '"]');
    if (!board || !slot) return;
    const frame = slot.closest('.tfg-frame');
    const frameRect = frame?.getBoundingClientRect();
    const target = frameRect && frameRect.width <= board.clientWidth - 4 && frameRect.height <= board.clientHeight - 4 ? frame : slot;
    const rect = target.getBoundingClientRect(); const viewport = board.getBoundingClientRect();
    const left = viewport.left + board.clientLeft + 2; const top = viewport.top + board.clientTop + 2;
    const right = viewport.left + board.clientLeft + board.clientWidth - 2;
    const bottom = viewport.top + board.clientTop + board.clientHeight - 2;
    const dx = rect.left < left ? rect.left - left : rect.right > right ? rect.right - right : 0;
    const dy = rect.top < top ? rect.top - top : rect.bottom > bottom ? rect.bottom - bottom : 0;
    // Move only this board. The selected total and controls stay in place, and the
    // active ten-frame is visible before its next spoken count begins.
    if (dx || dy) board.scrollBy({ left: dx, top: dy, behavior: 'auto' });
  }
  function showModal(name) {
    view.resumeAfterModal=view.sequencer?.isRunning?.();stopRun('pause'); view.modal = name; draw();
    const target = view.container.querySelector('.tfg-modal [aria-pressed="true"], .tfg-modal button');
    target?.focus?.({ preventScroll: true });
  }
  function closeModal() {
    const returnAction = view.modal === 'settings' ? 'settings' : 'number-picker';
    view.modal = null;draw();if(view.resumeAfterModal&&!view.userPaused){view.state=Object.assign({},view.state,{phase:'counting'});view.sequencer.resume();paintProgress();}
    view.container?.querySelector('[data-action="' + returnAction + '"]')?.focus?.({ preventScroll: true });
  }
  function onClick(event) {
    const b = event.target.closest?.('button[data-action]');
    if (!b || !view.container?.contains(b) || b.disabled) return;
    const a = b.dataset.action;
    if (a === 'home') { const leave = view.options.closeToParkHome; destroy(); if (typeof leave === 'function') leave(); return; }
    if (a === 'number-picker') { showModal('numbers'); return; }
    if (a === 'settings') { showModal('settings'); return; }
    if (a === 'close-modal') { closeModal(); return; }
    if (a === 'quantity') { change({ type: 'QUANTITY', value: Number(b.dataset.value) }); return; }
    if (a === 'more' || a === 'less') { change({ type: 'QUANTITY', value: view.state.quantity + (a === 'more' ? 1 : -1),incremental:true }); return; }
    if (a === 'mode') { change({ type: 'MODE', value: b.dataset.value }, true); return; }
    if (a === 'flower') { change({ type: 'FLOWER', value: b.dataset.value }); return; }
    if (a === 'reading') { change({ type: 'READING', value: b.dataset.value }); return; }
    if (a === 'split-less' || a === 'split-more') { change({ type: 'SPLIT', value: view.state.split + (a === 'split-more' ? 1 : -1) }); return; }
    if (a === 'replay') { view.userPaused=false;startAuto(); return; }
    if(a==='pause'){view.userPaused=!view.sequencer.isPaused();if(view.userPaused)stopRun('pause');else{view.state=Object.assign({},view.state,{phase:'counting'});view.sequencer.resume();paintProgress();}paintPlayback();return;}
    if(a==='group'){const modes=['ones','fives','tens'];view.groupMode=modes[(modes.indexOf(view.groupMode)+1)%3];startAuto();return;}
    if (a === 'mute') { view.muted = !view.muted;view.sequencer.setMuted(view.muted);save();draw();return; }
    if (a === 'undo' && view.undo.length) { stopRun(); view.state = createState(view.undo.pop()); startAuto(); return; }
    if (a === 'age') {
      const n=Number(b.dataset.value);if(![4,5,6,7].includes(n))return;
      view.modal=null;view.age=n;view.options.ageMode=n;
      window.SihyeonPlaySettings?.setAge?.(n);view.age=currentAge();draw();
      if(view.resumeAfterModal&&!view.userPaused)view.sequencer.resume();return;
    }
    if (a === 'language') {
      if(!['ko','en'].includes(b.dataset.value))return;
      const wasPaused=view.userPaused;view.modal=null;
      window.SihyeonPlaySettings?.setLanguage?.(b.dataset.value);
      if(view.language!==language()){view.language=language();startAuto(false,true);}else draw();
      if(!wasPaused)view.sequencer.resume();
    }
  }
  function onKey(event) {
    if (event.key === 'Escape' && view.modal) { event.preventDefault(); closeModal(); return; }
    if (event.key !== 'Tab' || !view.modal) return;
    const controls = [...view.container.querySelectorAll('.tfg-modal button:not([disabled])')];
    if (!controls.length) return;
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function onSettings() {
    if (!view.container) return;
    const nextAge = currentAge(); const nextLanguage = language();
    if (nextAge === view.age && nextLanguage === view.language) return;
    const changed=nextLanguage!==view.language;view.age = nextAge; view.language = nextLanguage;
    if(changed){startAuto(false,true);if(view.modal)view.sequencer.pause();}else draw();
  }
  function resumeVisible() {
    if (view.container && !document.hidden && !view.modal && !view.userPaused && view.resumeAfterVisibility && view.sequencer?.isPaused?.()){view.state=Object.assign({},view.state,{phase:'counting'});view.sequencer.resume();paintProgress();}
  }
  function bind() {
    const h = view.handlers = {
      click: onClick, key: onKey, settings: onSettings,
      blur: () => { view.resumeAfterVisibility=view.sequencer?.isRunning?.()||view.resumeAfterVisibility;stopRun('pause'); save(); paintProgress(); },
      focus: resumeVisible,
      visibility: () => { if (document.hidden) { view.resumeAfterVisibility=view.sequencer?.isRunning?.()||view.resumeAfterVisibility;stopRun('pause'); save(); } else resumeVisible(); },
      pagehide: () => { stopRun('pause'); save(); }
    };
    view.container.addEventListener('click', h.click);
    view.container.addEventListener('keydown', h.key);
    window.addEventListener('sihyeon-settings-change', h.settings);
    window.addEventListener('blur', h.blur);
    window.addEventListener('focus', h.focus);
    window.addEventListener('pagehide', h.pagehide);
    document.addEventListener('visibilitychange', h.visibility);
  }
  function destroy() {
    if (!view.container) return;
    save(); stopRun();
    const h = view.handlers;
    if (h) {
      view.container.removeEventListener('click', h.click); view.container.removeEventListener('keydown', h.key);
      window.removeEventListener('sihyeon-settings-change', h.settings); window.removeEventListener('blur', h.blur); window.removeEventListener('focus', h.focus);
      window.removeEventListener('pagehide', h.pagehide); document.removeEventListener('visibilitychange', h.visibility);
    }
    if (view.previousBack?.element) view.previousBack.element.hidden = view.previousBack.hidden;
    view.container = null; view.state = null; view.sequencer = null; view.handlers = null; view.previousBack = null;
    view.modal = null; view.undo = []; view.lastWord = ''; view.lastOrdinal = 0;view.userPaused=false;view.groupMode='ones';view.groupStart=0;view.groupEnd=0;
  }
  function render(container, options) {
    destroy(); if (!container) return;
    view.container = container; view.options = options || {};
    if (!Q() || !window.SihyeonQuantitySequencer?.create) {
      container.innerHTML = '<section class="tfg-load-error"><h2>꽃정원을 다시 열어 주세요.</h2><button type="button">🏠 숫자놀이터로</button></section>';
      container.querySelector('button')?.addEventListener('click', () => { const leave = view.options.closeToParkHome; destroy(); if (typeof leave === 'function') leave(); }, { once: true });
      return;
    }
    if (!document.getElementById('sihyeon-ten-frame-garden-style')) {
      const link = document.createElement('link'); link.id = 'sihyeon-ten-frame-garden-style'; link.rel = 'stylesheet'; link.href = './css/games/ten-frame-garden.css'; document.head.appendChild(link);
    }
    const back = container.closest('.game-play-screen')?.querySelector('.game-back-floating');
    if (back) { view.previousBack = { element: back, hidden: back.hidden }; back.hidden = true; }
    const saved = load(); view.state = createState(saved); view.muted = saved.muted === true;view.groupMode=['ones','fives','tens'].includes(saved.groupMode)?saved.groupMode:'ones';
    view.age = currentAge(); view.language = language(); view.voiceFailed = false; view.saveFailed = false;
    view.sequencer = window.SihyeonQuantitySequencer.create({ timeoutMs: 7500, fallbackMs: 470 });
    bind(); startAuto(false);
  }
  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[KEY] = { id: KEY, title: '열 칸 꽃정원', render, destroy, model: Model,
    getSnapshot: () => view.state ? { state: clone(view.state), quantities: inspect(view.state), age: view.age, language: language(), muted: view.muted, voiceFailed: view.voiceFailed, saveFailed: view.saveFailed, modal: view.modal, groupMode:view.groupMode, userPaused:view.userPaused, running: view.sequencer?.isRunning?.() || false, sequence: view.sequencer?.getSnapshot?.() || null } : null };
})();
