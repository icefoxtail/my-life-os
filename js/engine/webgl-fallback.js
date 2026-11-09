/* Playable 2D companion for the two existing 3D block games.
 * Same-origin, dependency-free; no network, audio or GPU is required to play. */
(function () {
  'use strict';
  const STORAGE_PREFIX = 'sihyeon-2d-blocks-v1-';
  const MAX_TOTAL = 300;
  const MAX_BLOCKS = 24;
  const CHO = [ ['ㄱ',0,'기역'],['ㄴ',2,'니은'],['ㄷ',3,'디귿'],['ㄹ',5,'리을'],['ㅁ',6,'미음'],['ㅂ',7,'비읍'],['ㅅ',9,'시옷'],['ㅇ',11,'이응'],['ㅈ',12,'지읒'],['ㅊ',14,'치읓'],['ㅋ',15,'키읔'],['ㅌ',16,'티읕'],['ㅍ',17,'피읖'],['ㅎ',18,'히읗'] ];
  const JUNG = [ ['ㅏ',0,'아'],['ㅑ',2,'야'],['ㅓ',4,'어'],['ㅕ',6,'여'],['ㅗ',8,'오'],['ㅛ',12,'요'],['ㅜ',13,'우'],['ㅠ',17,'유'],['ㅡ',18,'으'],['ㅣ',20,'이'] ];
  const WORDS = {
    '가':['가방','🎒'],'나':['나비','🦋'],'다':['다람쥐','🐿️'],'라':['라디오','📻'],
    '마':['마차','🐴'],'바':['바나나','🍌'],'사':['사과','🍎'],'아':['아기','👶'],
    '자':['자동차','🚗'],'차':['차','🚙'],'카':['카메라','📷'],'타':['타조','🪶'],
    '파':['파인애플','🍍'],'하':['하마','🦛'],'거':['거미','🕷️'],'고':['고래','🐳'],
    '구':['구두','👞'],'기':['기차','🚂'],'너':['너구리','🦝'],'노':['노래','🎵'],
    '도':['도토리','🌰'],'두':['두부','⬜'],'로':['로봇','🤖'],'리':['리본','🎀'],
    '모':['모자','🎩'],'무':['무지개','🌈'],'미':['미소','😊'],'버':['버스','🚌'],
    '보':['보물','💎'],'부':['부엉이','🦉'],'비':['비행기','✈️'],'서':['서랍','🗄️'],
    '소':['소','🐮'],'수':['수박','🍉'],'시':['시계','⏰'],'오':['오리','🦆'],
    '우':['우산','☔'],'이':['이불','🛏️'],'여':['여우','🦊'],'야':['야구공','⚾'],
    '요':['요요','🪀'],'유':['유모차','👶'],'저':['저금통','🐷'],'조':['조개','🐚'],
    '주':['주사위','🎲'],'지':['지구','🌍'],'초':['초콜릿','🍫'],'치':['치즈','🧀'],
    '코':['코끼리','🐘'],'쿠':['쿠키','🍪'],'키':['키위','🥝'],'토':['토끼','🐰'],
    '티':['티셔츠','👕'],'포':['포도','🍇'],'피':['피아노','🎹'],'호':['호랑이','🐯']
  };
  let active = null;
  let cleanup3D = null;

  function sum(blocks) { return blocks.reduce((n, block) => n + block.value, 0); }
  function composeHangul(cho, jung) {
    const c = CHO.find(item => item[0] === cho);
    const j = JUNG.find(item => item[0] === jung);
    return c && j ? String.fromCharCode(0xAC00 + (c[1] * 21 + j[1]) * 28) : '';
  }
  function mergeNumbers(blocks, selectedIds, newId) {
    const ids = [...new Set(selectedIds)];
    const chosen = blocks.filter(block => ids.includes(block.id));
    if (chosen.length < 2 || chosen.length !== ids.length) return blocks;
    const total = sum(chosen);
    if (total > MAX_TOTAL) return blocks;
    return [...blocks.filter(block => !ids.includes(block.id)), { id: newId, value: total, parts: chosen.map(block => block.value) }];
  }
  function splitNumber(blocks, selectedId, nextId) {
    const selected = blocks.find(block => block.id === selectedId);
    if (!selected || selected.value < 2) return blocks;
    const parts = selected.parts?.length > 1 ? selected.parts : selected.value > 10
      ? [10, selected.value - 10] : [Math.floor(selected.value / 2), Math.ceil(selected.value / 2)];
    if (blocks.length - 1 + parts.length > MAX_BLOCKS) return blocks;
    return blocks.flatMap(block => block.id === selectedId
      ? parts.map((value, index) => ({ id: nextId + index, value })) : [block]);
  }
  function readSaved(kind) {
    try { return JSON.parse(localStorage.getItem(STORAGE_PREFIX + kind)); } catch (error) { return null; }
  }
  function save() {
    if (!active) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + active.kind, JSON.stringify({
        version: 1, blocks: active.blocks, cho: active.cho, jung: active.jung,
        joined: active.joined, sound: active.sound
      }));
    } catch (error) {} // Storage denial does not stop the current game.
  }
  function restoreNumbers(saved) {
    if (!Array.isArray(saved?.blocks) || saved.blocks.length > MAX_BLOCKS) return null;
    const valid = saved.blocks.every(block => block && typeof block === 'object'
      && Number.isInteger(block.value) && block.value > 0 && block.value <= MAX_TOTAL);
    if (!valid || sum(saved.blocks) > MAX_TOTAL) return null;
    return saved.blocks.map((block, index) => {
      const result = {id: index + 1, value: block.value};
      if (Array.isArray(block.parts) && block.parts.length > 1 && block.parts.length <= MAX_BLOCKS
        && block.parts.every(value => Number.isInteger(value) && value > 0)
        && block.parts.reduce((a,b) => a+b, 0) === block.value) result.parts = block.parts.slice();
      return result;
    });
  }
  // The same language preference applies to 2D fallback when WebGL is unavailable.
  // English text is deliberately mapped from actual numeric action data.
  function say(text) {
    if(!active?.sound||!text)return;
    const root=window.parent && window.parent!==window ? window.parent : window;
    const english=root.SihyeonPlaySettings?.getLanguage?.()==='en';
    const names=root.SihyeonVoiceLabels;
    let phrase=String(text);
    if(english){
      if(active.kind!=='numbers')return;
      const word=n=>names?.numberEn?.(Number(n)) || '';
      const added=phrase.match(/^(\d+) 블록을 놓았어요\.$/);
      const merged=phrase.match(/^(\d+) 더하기 (\d+)은 (\d+)\. 모두 (\d+)개예요\.$/);
      if(added)phrase=word(added[1])+'! One more block!';
      else if(merged)phrase=word(merged[1])+' plus '+word(merged[2])+' makes '+word(merged[3])+'!';
      else if(/나누어도 모두/.test(phrase))phrase='Look! We can split the blocks!';
      else if(/블록을 합치거나/.test(phrase))phrase="Let's join some blocks first!";
      else if(/두 블록을 먼저/.test(phrase))phrase='Pick two blocks first!';
      else if(/새 놀이/.test(phrase))phrase="Let's start again!";
      else return;
    }
    try{
      if(root.SihyeonVoice?.speak){
        Promise.resolve(root.SihyeonVoice.speak(phrase,{
          lang:english?'en-US':'ko-KR',rate:english?.9:.85,pitch:1.02
        })).catch(()=>{});
        return;
      }
      if(english || !window.speechSynthesis || typeof SpeechSynthesisUtterance!=='function')return;
      window.speechSynthesis.cancel();
      const utterance=new SpeechSynthesisUtterance(phrase);
      utterance.lang='ko-KR';utterance.rate=.85;
      window.speechSynthesis.speak(utterance);
    }catch(_){}
  }
  function sayNumber(n) {
    if(!active?.sound)return;
    const root=window.parent && window.parent!==window ? window.parent : window;
    const english=root.SihyeonPlaySettings?.getLanguage?.()==='en';
    const labels=root.SihyeonVoiceLabels;
    const word=english ? labels?.numberEn?.(n) : labels?.numberKo?.(n);
    if(!word)return;
    try { root.SihyeonVoice?.speak?.(word,{
      lang:english?'en-US':'ko-KR',rate:.9,pitch:1.0
    })?.catch?.(()=>{}); }catch(_){}
  }

  function installStyle() {
    if (document.getElementById('sihyeon-2d-style')) return;
    const style = document.createElement('style');
    style.id = 'sihyeon-2d-style';
    style.textContent = `
      .s2d-root,.s2d-loading { position:fixed;inset:0;z-index:5000;background:#eaf5ef;color:#244235;font-family:system-ui,'Apple SD Gothic Neo',sans-serif;box-sizing:border-box; }
      .s2d-root * { box-sizing:border-box; }
      .s2d-loading { display:grid;place-content:center;gap:12px;text-align:center;font-size:24px; }
      .s2d-loading strong { font-size:72px; }
      .s2d-root { display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:10px;padding:max(10px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left)); }
      .s2d-head { display:flex;align-items:center;gap:12px;min-height:58px; }
      .s2d-root.embedded .s2d-head { padding-left:66px; }
      .s2d-heading { flex:1;min-width:0; }
      .s2d-heading h1 { font-size:clamp(19px,3vw,27px);margin:0; }
      .s2d-heading p { margin:4px 0 0;font-size:14px; }
      .s2d-root button { border:2px solid #c7dcd0;border-radius:16px;background:#fff;min-height:56px;padding:8px 12px;color:#244235;font:inherit;font-weight:700;touch-action:manipulation;cursor:pointer; }
      .s2d-root button:focus-visible { outline:4px solid #247aa8;outline-offset:2px; }
      .s2d-root button:disabled { opacity:.42;cursor:default; }
      .s2d-root button:active:not(:disabled) { transform:translateY(2px); }
      .s2d-main { display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:12px;min-height:0; }
      .s2d-work { min-height:0;display:flex;flex-direction:column;gap:8px; }
      .s2d-message { min-height:44px;border-radius:14px;padding:10px;background:#fff7d7;font-size:clamp(17px,2.4vw,22px);text-align:center; }
      .s2d-board { min-height:0;flex:1;overflow:auto;display:flex;flex-wrap:wrap;align-content:flex-start;align-items:stretch;justify-content:center;gap:12px;padding:12px;border:2px solid #c7dcd0;border-radius:22px;background:#fcfffc; }
      .s2d-root .s2d-block { position:relative;width:150px;min-height:116px;max-height:260px;overflow:auto;display:flex;align-items:center;flex-direction:column;gap:8px;padding:10px;background:#fff6d7;border-color:#e3c970; }
      .s2d-block[aria-pressed='true'] { outline:4px solid #247aa8;outline-offset:1px; }
      .s2d-block[aria-pressed='true']::after { content:'✓';position:absolute;right:7px;top:4px;font-size:24px;color:#247aa8; }
      .s2d-amount { font-size:42px;line-height:1.2; }
      .s2d-frames { display:flex;gap:5px;flex-wrap:wrap;justify-content:center; }
      .s2d-frame { width:55px;display:grid;grid-template-columns:repeat(5,1fr);gap:2px;padding:3px;border:1px solid #bca55b;border-radius:5px;background:#fff; }
      .s2d-dot { width:7px;height:7px;border:1px solid #e2cba4;border-radius:2px;background:#fff; }
      .s2d-dot.full { background:#e5a322;border-color:#a86517; }
      .s2d-palette { min-height:0;overflow:auto;padding:6px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:58px;gap:7px;align-content:start;background:#dbece1;border-radius:18px; }
      .s2d-palette button { font-size:25px;padding:4px; }
      .s2d-palette strong { grid-column:1/-1;font-size:16px;display:flex;align-items:center;justify-content:center; }
      .s2d-footer { display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center; }
      .s2d-root .s2d-primary { background:#2d7656;color:#fff;border-color:#245f47; }
      .s2d-empty { align-self:center;margin:auto;font-size:28px;text-align:center; }
      .s2d-total { padding:4px;text-align:center;font-size:18px; }
      .s2d-compose { width:100%;min-height:160px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:14px; }
      .s2d-jamo { border-radius:20px;display:grid;place-items:center;width:100px;height:112px;font-size:70px;background:#ffd3c9;border:3px solid #de917f; }
      .s2d-jamo.vowel { background:#c8e9fc;border-color:#7baeca; }
      .s2d-plus { font-size:32px; }
      .s2d-result { min-width:150px;text-align:center;font-size:100px;font-weight:800;line-height:1.2;animation:s2d-pop .35s ease; }
      .s2d-word { width:100%;text-align:center;font-size:25px; }
      .s2d-word span { display:block;font-size:72px;line-height:1.3; }
      .s2d-root .s2d-jamo-button[aria-pressed='true'] { outline:3px solid #247aa8;outline-offset:-3px;background:#fff3bd; }
      @keyframes s2d-pop { from{transform:scale(.85)}to{transform:scale(1)} }
      @media (orientation:portrait) {
        .s2d-main { grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto;gap:8px; }
        .s2d-palette { grid-template-columns:repeat(5,minmax(0,1fr));grid-auto-rows:56px;max-height:136px; }
        .s2d-root[data-fallback-kind='hangul'] .s2d-palette { grid-template-columns:repeat(5,minmax(0,1fr));max-height:180px; }
        .s2d-root[data-fallback-kind='hangul'] .s2d-palette strong { grid-column:1/-1;min-height:28px; }
        .s2d-palette button { min-width:0;padding:2px;font-size:24px; }
        .s2d-root .s2d-block { width:calc(50% - 8px);max-width:180px; }
        .s2d-footer button { flex:1;min-width:66px;padding:6px;font-size:15px; }
      }
      @media (orientation:landscape) and (max-height:520px) {
        .s2d-root { gap:6px;padding:6px; }
        .s2d-head { min-height:50px; }
        .s2d-heading p { display:none; }
        .s2d-head button { min-height:46px; }
        .s2d-main { grid-template-columns:minmax(0,1fr) 144px;gap:8px; }
        .s2d-message { min-height:36px;padding:6px;font-size:17px; }
        .s2d-board { padding:8px; }
        .s2d-footer button { min-height:50px; }
        .s2d-compose { min-height:100px;gap:12px; }
        .s2d-jamo { width:82px;height:88px;font-size:64px; }
        .s2d-result { min-width:100px;font-size:80px; }
        .s2d-word { width:auto;min-width:110px; }
        .s2d-word span { font-size:58px; }
      }
      @media (prefers-reduced-motion:reduce) { .s2d-root * { animation:none!important;transition:none!important; } }
    `;
    document.head.appendChild(style);
  }
  function frames(value) {
    const groups = [];
    for (let base = 0; base < value; base += 10) {
      groups.push(`<span class="s2d-frame" aria-hidden="true">${Array.from({length:10}, (_,i) => `<i class="s2d-dot ${base+i < value ? 'full' : ''}"></i>`).join('')}</span>`);
    }
    return `<span class="s2d-frames">${groups.join('')}</span>`;
  }
  function goHome() {
    save();
    try {
      if (window.parent !== window && typeof window.parent.returnToCurrentGameLand === 'function') {
        window.parent.returnToCurrentGameLand(); return;
      }
    } catch (error) {}
    window.location.href = '../index.html';
  }
  function remember() {
    active.undo.push(JSON.stringify({blocks:active.blocks, cho:active.cho, jung:active.jung, joined:active.joined}));
    if (active.undo.length > 30) active.undo.shift();
  }
  function announce(text) { active.message = text; say(text); save(); render(); }
  function numberAction(action, value) {
    if (!active || active.kind !== 'numbers') return;
    const selected = active.blocks.filter(block => active.selected.includes(block.id));
    if (action === 'select') {
      active.selected = active.selected.includes(value) ? active.selected.filter(id => id !== value)
        : active.selected.length < 2 ? [...active.selected, value] : [active.selected[1], value];
      render();
      const tapped=active.blocks.find(block=>block.id===value);
      if(tapped)sayNumber(tapped.value);
      return;
    }
    if (action === 'add') {
      if (!Number.isInteger(value) || value < 1 || value > 100) return;
      if (active.blocks.length >= MAX_BLOCKS || sum(active.blocks) + value > MAX_TOTAL) {
        announce('블록을 합치거나 새 놀이를 열어볼까?'); return;
      }
      remember(); active.blocks.push({id:active.nextId++,value}); active.selected = [];
      announce(`${value} 블록을 놓았어요.`); return;
    }
    if (action === 'merge' && selected.length === 2) {
      remember(); const values = selected.map(block => block.value);
      active.blocks = mergeNumbers(active.blocks, active.selected, active.nextId++);
      active.selected = [active.blocks[active.blocks.length-1].id];
      announce(`${values.join(' 더하기 ')}은 ${values[0]+values[1]}. 모두 ${sum(active.blocks)}개예요.`); return;
    }
    if (action === 'split' && selected.length === 1 && selected[0].value > 1) {
      const next = splitNumber(active.blocks, selected[0].id, active.nextId);
      if (next === active.blocks) { announce('두 블록을 먼저 합쳐 볼까?'); return; }
      remember(); active.nextId += MAX_BLOCKS; active.blocks = next; active.selected = [];
      announce(`나누어도 모두 ${sum(active.blocks)}개예요.`);
    }
  }
  function letterAction(action, value) {
    if (!active || active.kind !== 'hangul') return;
    if (action === 'cho' && CHO.some(item => item[0] === value)) {
      remember(); active.cho = value; active.joined = false;
      announce(CHO.find(item => item[0] === value)[2]);
    } else if (action === 'jung' && JUNG.some(item => item[0] === value)) {
      remember(); active.jung = value; active.joined = false;
      announce(JUNG.find(item => item[0] === value)[2]);
    } else if (action === 'join' && !active.joined) {
      remember(); active.joined = true;
      const syllable = composeHangul(active.cho, active.jung);
      announce(WORDS[syllable] ? `${syllable}. ${WORDS[syllable][0]}!` : `${syllable}!`);
    } else if (action === 'separate' && active.joined) {
      remember(); active.joined = false;
      announce('자음과 모음을 다시 나눴어요.');
    }
  }
  function handleAction(action) {
    if (!active) return;
    if (action === 'home') { goHome(); return; }
    if (action === 'sound') {
      active.sound = !active.sound;
      if (!active.sound) { try { window.speechSynthesis?.cancel(); window.parent.SihyeonVoice?.stop?.(); } catch (error) {} }
      save(); render(); return;
    }
    if (action === 'listen') { say(active.message); return; }
    if (action === 'undo') {
      if (!active.undo.length) return;
      Object.assign(active, JSON.parse(active.undo.pop())); active.selected = [];
      announce('한 번 되돌렸어요.'); return;
    }
    if (action === 'reset') {
      remember(); active.selected = [];
      if (active.kind === 'numbers') active.blocks = [];
      else { active.cho = 'ㄱ'; active.jung = 'ㅏ'; active.joined = false; }
      announce('새 놀이예요. 되돌리면 아까 놀이로 돌아가요.'); return;
    }
    if (active.kind === 'numbers') numberAction(action);
    else letterAction(action);
  }
  function render() {
    if (!active) return;
    const root = document.getElementById('sihyeon-2d-root');
    if (!root) return;
    const numbers = active.kind === 'numbers';
    const selected = active.blocks.filter(block => active.selected.includes(block.id));
    const syllable = composeHangul(active.cho, active.jung);
    const word = WORDS[syllable];
    root.innerHTML = `
      <header class="s2d-head">
        ${window.parent === window ? '<button data-action="home" aria-label="놀이터로">🏠</button>' : ''}
        <div class="s2d-heading"><h1>${numbers ? '숫자 블록 놀이' : '한글 블록 놀이'}</h1><p>그림 블록으로 계속 놀아요</p></div>
        <button data-action="sound" aria-label="${active.sound ? '소리 끄기' : '소리 켜기'}">${active.sound ? '🔊' : '🔇'}</button>
      </header>
      <main class="s2d-main">
        <section class="s2d-work">
          <div class="s2d-message" role="status">${active.message}</div>
          <div class="s2d-board">
            ${numbers ? active.blocks.map(block => `<button class="s2d-block" data-block="${block.id}" aria-label="${block.value} 블록 선택" aria-pressed="${active.selected.includes(block.id)}"><strong class="s2d-amount">${block.value}</strong>${frames(block.value)}</button>`).join('') || '<div class="s2d-empty">🧱<br>블록을 골라볼까?</div>'
              : `<div class="s2d-compose">${active.joined ? `<div class="s2d-result">${syllable}</div>${word ? `<div class="s2d-word"><span>${word[1]}</span>${word[0]}</div>` : ''}` : `<span class="s2d-jamo">${active.cho}</span><span class="s2d-plus">+</span><span class="s2d-jamo vowel">${active.jung}</span>`}</div>`}
          </div>
          ${numbers ? `<div class="s2d-total" aria-live="polite">모두 ${sum(active.blocks)}개 · 👆 블록 두 개를 골라요</div>` : ''}
        </section>
        <aside class="s2d-palette" aria-label="${numbers ? '놓을 숫자 블록' : '자음과 모음'}">
          ${numbers ? [1,2,3,4,5,6,7,8,9,10,20,50,100].map(n => `<button data-add="${n}" aria-label="${n} 블록 놓기">${n}</button>`).join('')
            : `<strong>자음</strong>${CHO.map(item => `<button class="s2d-jamo-button" data-cho="${item[0]}" aria-label="${item[2]}" aria-pressed="${active.cho === item[0]}">${item[0]}</button>`).join('')}<strong>모음</strong>${JUNG.map(item => `<button class="s2d-jamo-button" data-jung="${item[0]}" aria-label="${item[2]} 모음" aria-pressed="${active.jung === item[0]}">${item[0]}</button>`).join('')}`}
        </aside>
      </main>
      <footer class="s2d-footer">
        ${numbers ? `<button class="s2d-primary" data-action="merge" ${selected.length !== 2 ? 'disabled' : ''}>＋ 합치기</button><button data-action="split" ${selected.length !== 1 || selected[0].value < 2 ? 'disabled' : ''}>↔ 나누기</button>`
          : `<button class="s2d-primary" data-action="join" ${active.joined ? 'disabled' : ''}>🧲 붙이기</button><button data-action="separate" ${!active.joined ? 'disabled' : ''}>↔ 떼기</button>`}
        <button data-action="undo" ${active.undo.length ? '' : 'disabled'}>↩ 되돌리기</button>
        <button data-action="reset">✨ 새 놀이</button>
        <button data-action="listen" aria-label="다시 듣기">🔊</button>
      </footer>`;
  }
  function show(kind) {
    const safeKind = kind === 'hangul' ? 'hangul' : 'numbers';
    if (active?.kind === safeKind && document.getElementById('sihyeon-2d-root')) return;
    // Context loss may also make the renderer's own dispose routine throw.
    // The companion must still open in that case.
    try { cleanup3D?.(); } catch (error) {}
    cleanup3D = null;
    installStyle();
    document.getElementById('sihyeon-3d-loading')?.remove();
    const game = document.getElementById('game');
    if (game) game.style.display = 'none';
    document.getElementById('sihyeon-2d-root')?.remove();
    const saved = readSaved(safeKind);
    const blocks = restoreNumbers(saved) || [{id:1,value:2},{id:2,value:3}];
    active = {
      kind:safeKind, blocks, selected:[], nextId:MAX_BLOCKS + 1, undo:[], sound:saved?.sound !== false,
      cho:CHO.some(item => item[0] === saved?.cho) ? saved.cho : 'ㄱ',
      jung:JUNG.some(item => item[0] === saved?.jung) ? saved.jung : 'ㅏ',
      joined:saved?.joined === true,
      message:safeKind === 'numbers' ? '👆 블록 두 개를 골라 합쳐볼까?' : '👆 자음과 모음을 골라 붙여볼까?'
    };
    const root = document.createElement('div'); root.id = 'sihyeon-2d-root';
    root.className = 's2d-root' + (window.parent !== window ? ' embedded' : '');
    root.dataset.fallbackKind = safeKind;
    document.body.appendChild(root);
    root.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button || button.disabled || !root.contains(button)) return;
      if (button.dataset.block) numberAction('select', Number(button.dataset.block));
      else if (button.dataset.add) numberAction('add', Number(button.dataset.add));
      else if (button.dataset.cho) letterAction('cho', button.dataset.cho);
      else if (button.dataset.jung) letterAction('jung', button.dataset.jung);
      else handleAction(button.dataset.action);
    });
    render(); save();
  }
  function loading() {
    installStyle();
    const pane = document.createElement('div'); pane.id = 'sihyeon-3d-loading';
    pane.className = 's2d-loading'; pane.innerHTML = '<strong>🧱</strong><span>블록 놀이를 준비해요</span>';
    document.body.appendChild(pane);
  }
  function loadScript(url, timeoutMs) {
    return new Promise(resolve => {
      let done = false;
      const script = document.createElement('script');
      function finish(success) {
        if (done) return; done = true; clearTimeout(timeout);
        script.onload = script.onerror = null;
        if (!success) script.remove();
        resolve(success);
      }
      const timeout = setTimeout(() => finish(false), timeoutMs);
      script.src = url; script.async = true;
      script.onload = () => finish(Boolean(window.THREE));
      script.onerror = () => finish(false);
      document.head.appendChild(script);
    });
  }
  async function prepare(kind) {
    if (new URLSearchParams(window.location.search).get('view') === '2d') { show(kind); return false; }
    let supported = false;
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
      supported = Boolean(context);
      context?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch (error) {}
    if (!supported) { show(kind); return false; }
    loading();
    const loaded = Boolean(window.THREE)
      || await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 4000)
      || await loadScript('https://unpkg.com/three@0.128.0/build/three.min.js', 4000);
    if (!loaded) { show(kind); return false; }
    return true;
  }
  function ready(kind, onDispose) {
    document.getElementById('sihyeon-3d-loading')?.remove();
    cleanup3D = typeof onDispose === 'function' ? onDispose : null;
    document.getElementById('scene3d')?.addEventListener('webglcontextlost', event => {
      event.preventDefault(); show(kind);
    }, {once:true});
  }
  window.addEventListener('pagehide', save);
  window.Sihyeon2DFallback = {prepare, show, ready, model:{sum, mergeNumbers, splitNumber, composeHangul, restoreNumbers}};
})();
