/* ═══════════════════════════════════════════
   SIHYEON PLAY OS — 꼬마 고양이 돌보기
   파일: js/games/cat-care.js
═══════════════════════════════════════════ */

(function () {
  const GAME_KEY = 'catCare';
  const STYLE_ID = 'sihyeon-cat-care-style';
  const BASE = './assets/games/cat-care/';

  const CAT_DATA = {
    white: {
      id: 'white', name: '흰 고양이', emoji: '🐱', color: '#FFB74D',
      selectImg: BASE + 'white_select.jpg',
      steps: {
        default: BASE + 'white_default.jpg',
        eat:     BASE + 'white_eat.jpg',
        bath:    BASE + 'white_bath.jpg',
        sleep:   BASE + 'white_sleep.jpg'
      }
    },
    gray: {
      id: 'gray', name: '회색 고양이', emoji: '🐈', color: '#64B5F6',
      selectImg: BASE + 'gray_select.jpg',
      steps: {
        default: BASE + 'gray_default.jpg',
        eat:     BASE + 'gray_eat.jpg',
        bath:    BASE + 'gray_bath.jpg',
        sleep:   BASE + 'gray_sleep.jpg'
      }
    }
  };

  const ACTIONS = [
    { id: 'eat',   emoji: '🐟', label: '밥 주기',  color: '#FFB74D',
      voice: '냠냠 쩝쩝! 맛있어요!', particle: '❤️' },
    { id: 'bath',  emoji: '🫧', label: '목욕하기', color: '#81D4FA',
      voice: '보글보글! 깨끗해요!',  particle: '🫧' },
    { id: 'sleep', emoji: '🌙', label: '재우기',   color: '#9575CD',
      voice: '코오... 잘 자요~',      particle: '⭐' }
  ];

  const state = {
    container: null, options: {},
    currentCat: null, activeStep: 'default',
    completed: null,   // Set
    destroyed: false, timers: []
  };

  function timer(fn, ms) {
    const id = setTimeout(() => {
      state.timers = state.timers.filter(t => t !== id);
      if (!state.destroyed) fn();
    }, ms);
    state.timers.push(id);
    return id;
  }
  function clearTimers() {
    state.timers.forEach(id => clearTimeout(id));
    state.timers = [];
  }

  /* ─── CSS ─── */
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .cc-root {
        position: relative; width: 100%; height: 100%;
        display: flex; flex-direction: column;
        align-items: center; justify-content: flex-start;
        background: linear-gradient(160deg, #fff9e6 0%, #fff0f9 100%);
        overflow: hidden; font-family: 'Jua', sans-serif;
        touch-action: manipulation;
      }

      /* ─ 선택 화면 ─ */
      .cc-select-title {
        font-size: clamp(22px, 6vw, 34px); color: #333; margin: clamp(20px,5vh,40px) 0 clamp(14px,3vh,24px);
        text-align: center;
      }
      .cc-select-row {
        display: flex; gap: clamp(16px,5vw,32px); align-items: center; justify-content: center;
        flex-wrap: wrap; padding: 0 16px;
      }
      .cc-cat-card {
        width: clamp(130px, 38vw, 220px); cursor: pointer;
        background: #fff; padding: 12px; border-radius: 36px;
        box-shadow: 0 12px 28px rgba(0,0,0,0.12);
        border: 5px solid #fff;
        transition: transform 0.15s, box-shadow 0.15s;
        text-align: center;
        -webkit-tap-highlight-color: transparent;
      }
      .cc-cat-card:active { transform: scale(0.91); box-shadow: 0 4px 10px rgba(0,0,0,0.12); }
      .cc-cat-img-wrap { position: relative; width: 100%; padding-top: 100%; border-radius: 26px; overflow: hidden; background: #f5f5f5; }
      .cc-cat-img-wrap img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 26px; }
      .cc-cat-img-fallback {
        position: absolute; inset: 0; display: grid; place-items: center;
        font-size: clamp(52px, 16vw, 90px); background: linear-gradient(135deg,#ffe0f0,#fff9c4);
      }
      .cc-cat-name { font-size: clamp(16px, 4.5vw, 22px); color: #444; margin-top: 10px; font-weight: 900; }

      /* ─ 돌보기 화면 ─ */
      .cc-main-display {
        flex: 1; min-height: 0; width: 100%;
        display: flex; align-items: center; justify-content: center;
        padding: 10px 16px 0;
      }
      .cc-main-wrap {
        position: relative;
        width: clamp(220px, 68vw, 400px);
        aspect-ratio: 1;
      }
      .cc-main-img {
        width: 100%; height: 100%; object-fit: cover;
        border-radius: 50px; border: 10px solid #fff;
        box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        animation: ccFloat 3s ease-in-out infinite;
        transition: opacity 0.25s;
        display: block;
      }
      .cc-main-fallback {
        position: absolute; inset: 0; display: none;
        place-items: center; font-size: clamp(80px,24vw,160px);
        border-radius: 50px; background: linear-gradient(135deg,#ffe0f0,#fff9c4);
        border: 10px solid #fff; box-shadow: 0 20px 40px rgba(0,0,0,0.15);
      }
      @keyframes ccFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }

      /* ─ 버튼 3개 ─ */
      .cc-action-bar {
        flex-shrink: 0; width: 100%;
        display: flex; align-items: center; justify-content: center;
        gap: clamp(10px, 3.5vw, 22px);
        padding: clamp(10px,2vh,18px) 14px clamp(14px,3.5vh,28px);
      }
      .cc-btn {
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
        width: clamp(80px, 26vw, 120px);
        height: clamp(80px, 26vw, 120px);
        border-radius: 50%;
        border: 6px solid #fff;
        cursor: pointer;
        box-shadow: 0 10px 0 rgba(0,0,0,0.12), 0 14px 20px rgba(0,0,0,0.10);
        transition: transform 0.12s, box-shadow 0.12s, opacity 0.2s;
        -webkit-tap-highlight-color: transparent;
        position: relative;
        font-size: clamp(30px, 9vw, 48px);
      }
      .cc-btn:active { transform: translateY(6px); box-shadow: 0 4px 0 rgba(0,0,0,0.12); }
      .cc-btn-label {
        position: absolute; bottom: -28px; left: 50%; transform: translateX(-50%);
        font-size: clamp(11px, 3.2vw, 15px); color: #555; white-space: nowrap; font-weight: 900;
      }
      .cc-btn.done {
        opacity: 0.5; pointer-events: none;
      }
      .cc-btn.done::after {
        content: '✅'; position: absolute; top: -8px; right: -8px;
        font-size: 24px; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));
      }

      /* ─ 파티클 ─ */
      .cc-particle {
        position: fixed; pointer-events: none; z-index: 9999;
        animation: ccExplode 0.8s ease-out forwards;
      }
      @keyframes ccExplode {
        0%   { transform: translate(0,0) scale(1); opacity: 1; }
        100% { transform: translate(var(--tx),var(--ty)) scale(0); opacity: 0; }
      }

      /* ─ 완료 화면 ─ */
      .cc-complete {
        display: flex; flex-direction: column; align-items: center;
        justify-content: center; gap: clamp(14px,3.5vh,22px);
        padding: 28px 20px clamp(20px,5vh,36px); height: 100%; text-align: center;
      }
      .cc-complete-emoji { font-size: clamp(72px,20vw,110px); animation: ccFloat 2.5s ease-in-out infinite; }
      .cc-complete-title { font-size: clamp(26px,7vw,42px); font-weight: 900; color: #333; }
      .cc-complete-sub { font-size: clamp(15px,4.5vw,24px); color: #666; }
      .cc-complete-btns { display: flex; flex-direction: column; gap: 12px; width: min(100%, 280px); margin-top: 6px; }
      .cc-c-btn {
        min-height: 60px; border-radius: 18px; border: none;
        font-size: clamp(16px,4.5vw,21px); font-weight: 900; cursor: pointer;
        touch-action: manipulation; box-shadow: 0 6px 0 rgba(0,0,0,0.15);
        transition: transform 0.1s, box-shadow 0.1s;
        -webkit-tap-highlight-color: transparent;
      }
      .cc-c-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 rgba(0,0,0,0.15); }
      .cc-c-btn-primary { background: #FF7A1A; color: #fff; }
      .cc-c-btn-secondary { background: #fff; color: #333; border: 4px solid #eee !important; box-shadow: 0 5px 0 #ddd; }
    `;
    document.head.appendChild(s);
  }

  /* ─── 유틸 ─── */
  function speak(text) {
    const voiceIds = {
      '시현아, 어떤 야옹이를 같이 돌봐줄까?': 'games.cat.intro',
      '흰 고양이가 왔어요. 같이 돌봐줄까?': 'games.cat.whiteIntro',
      '회색 고양이가 왔어요. 같이 돌봐줄까?': 'games.cat.grayIntro',
      '냠냠 쩝쩝! 맛있어요!': 'games.cat.feed',
      '보글보글! 깨끗해요!': 'games.cat.wash',
      '코오... 잘 자요.': 'games.cat.sleep',
      '흰 고양이가 행복해요. 시현아, 정말 잘했어.': 'games.cat.whiteComplete',
      '회색 고양이가 행복해요. 시현아, 정말 잘했어.': 'games.cat.grayComplete'
    };
    const voiceId = voiceIds[text];
    if (voiceId && window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      window.SihyeonVoice.play(voiceId, '').catch(() => {});
      return;
    }
  }

  function burst(x, y, emoji, count = 16) {
    const root = document.body;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'cc-particle';
      p.textContent = emoji;
      p.style.fontSize = '26px';
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 140;
      p.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
      p.style.left = `${x}px`; p.style.top = `${y}px`;
      root.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }
  }

  function setMainImg(stepKey) {
    if (!state.container || !state.currentCat) return;
    const img = state.container.querySelector('#cc-main-img');
    const fallback = state.container.querySelector('#cc-main-fallback');
    if (!img) return;
    const src = state.currentCat.steps[stepKey] || state.currentCat.steps.default;
    img.style.opacity = '0';
    timer(() => {
      img.src = src;
      img.style.opacity = '1';
    }, 120);
    if (fallback) fallback.textContent = state.currentCat.emoji;
  }

  /* ─── 화면 렌더 ─── */
  function renderSelect() {
    if (state.destroyed || !state.container) return;
    const root = state.container.querySelector('.cc-root');
    root.innerHTML = `
      <div class="cc-select-title">어떤 고양이를 돌볼까?</div>
      <div class="cc-select-row" id="cc-select-row"></div>
    `;
    const row = root.querySelector('#cc-select-row');
    Object.values(CAT_DATA).forEach(cat => {
      const card = document.createElement('div');
      card.className = 'cc-cat-card';
      card.innerHTML = `
        <div class="cc-cat-img-wrap">
          <img src="${cat.selectImg}" alt="${cat.name}"
            onerror="this.style.display='none';this.nextElementSibling.style.display='grid';">
          <div class="cc-cat-img-fallback">${cat.emoji}</div>
        </div>
        <div class="cc-cat-name">${cat.name}</div>
      `;
      card.addEventListener('click', () => startCare(cat));
      row.appendChild(card);
    });
    speak('시현아, 어떤 야옹이를 같이 돌봐줄까?');
  }

  function renderCare() {
    if (state.destroyed || !state.container) return;
    const cat = state.currentCat;
    const root = state.container.querySelector('.cc-root');

    root.innerHTML = `
      <div class="cc-main-display">
        <div class="cc-main-wrap">
          <img id="cc-main-img" class="cc-main-img"
            src="${cat.steps.default}" alt="${cat.name}"
            onerror="this.style.display='none';document.getElementById('cc-main-fallback').style.display='grid';">
          <div id="cc-main-fallback" class="cc-main-fallback">${cat.emoji}</div>
        </div>
      </div>
      <div class="cc-action-bar" id="cc-action-bar"></div>
    `;

    renderActionBtns();
    speak(`${cat.name}이 왔어요. 같이 돌봐줄까?`);
  }

  function renderActionBtns() {
    if (!state.container) return;
    const bar = state.container.querySelector('#cc-action-bar');
    if (!bar) return;
    bar.innerHTML = '';

    ACTIONS.forEach(action => {
      const btn = document.createElement('button');
      btn.className = 'cc-btn' + (state.completed.has(action.id) ? ' done' : '');
      btn.style.background = action.color;
      btn.innerHTML = `${action.emoji}<span class="cc-btn-label">${action.label}</span>`;
      btn.setAttribute('aria-label', action.label);
      btn.addEventListener('click', (e) => {
        if (state.completed.has(action.id)) return;
        handleAction(action, e.clientX, e.clientY);
      });
      bar.appendChild(btn);
    });
  }

  function renderComplete() {
    if (state.destroyed || !state.container) return;
    const cat = state.currentCat;
    const root = state.container.querySelector('.cc-root');
    root.innerHTML = `
      <div class="cc-complete">
        <div class="cc-complete-emoji">${cat.emoji}</div>
        <div class="cc-complete-title">고양이 행복해요! 🎉</div>
        <div class="cc-complete-sub">${cat.name}이 너무 기뻐해요!<br>시현이 최고야 ⭐</div>
        <div class="cc-complete-btns">
          <button class="cc-c-btn cc-c-btn-primary" id="cc-replay">다시 하기 🔄</button>
          <button class="cc-c-btn cc-c-btn-secondary" id="cc-to-land">즐거운놀이터로 👋</button>
        </div>
      </div>
    `;
    root.querySelector('#cc-replay').addEventListener('click', () => {
      state.currentCat = null;
      state.completed = null;
      state.activeStep = 'default';
      renderSelect();
    });
    root.querySelector('#cc-to-land').addEventListener('click', () => {
      if (typeof window.openGameLand === 'function') window.openGameLand();
      else state.options.closeToParkHome?.();
    });
    speak(`${cat.name}이 행복해요. 시현아, 정말 잘했어.`);
    state.options.fireConfetti?.();
    state.options.gainExp?.(25);
  }

  /* ─── 액션 핸들러 ─── */
  function startCare(cat) {
    state.currentCat = cat;
    state.completed = new Set();
    state.activeStep = 'default';
    renderCare();
  }

  function handleAction(action, clientX, clientY) {
    state.completed.add(action.id);
    state.activeStep = action.id;

    // 이미지 전환
    setMainImg(action.id);

    // 파티클
    burst(clientX, clientY, action.particle);

    // 음성
    speak(action.voice);

    // 버튼 상태 업데이트
    renderActionBtns();

    // 전부 완료?
    if (state.completed.size >= ACTIONS.length) {
      timer(() => renderComplete(), 1800);
    }
  }

  /* ─── 라이프사이클 ─── */
  function render(container, options = {}) {
    destroy();
    injectStyle();
    state.container = container;
    state.options = options;
    state.destroyed = false;
    state.currentCat = null;
    state.completed = null;
    state.activeStep = 'default';
    state.timers = [];
    container.innerHTML = `<div class="cc-root"></div>`;
    renderSelect();
  }

  function destroy() {
    state.destroyed = true;
    clearTimers();
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    if (state.container) state.container.innerHTML = '';
    state.container = null;
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
})();
