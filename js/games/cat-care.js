/* ═══════════════════════════════════════════
   SIHYEON PLAY OS — 꼬마 고양이 돌보기
   파일: js/games/cat-care.js
   버전: v1.3.0
   수정: 모바일 세로형 + 태블릿 가로형 이중 DOM/레이아웃 적용
═══════════════════════════════════════════ */

(function () {
  'use strict';

  const GAME_KEY = 'catCare';
  const STYLE_ID = 'sihyeon-cat-care-style';
  const BASE = './assets/games/cat-care/';

  const CAT_DATA = {
    white: {
      id: 'white',
      name: '눈이',
      emoji: '🐱',
      color: '#FFB74D',
      selectImg: BASE + 'white_select.jpg',
      introVoiceId: 'games.cat.whiteIntro',
      completeVoiceId: 'games.cat.whiteComplete',
      steps: {
        default: BASE + 'white_default.jpg',
        eat: BASE + 'white_eat.jpg',
        bath: BASE + 'white_bath.jpg',
        sleep: BASE + 'white_sleep.jpg'
      }
    },
    gray: {
      id: 'gray',
      name: '름이',
      emoji: '🐈',
      color: '#64B5F6',
      selectImg: BASE + 'gray_select.jpg',
      introVoiceId: 'games.cat.grayIntro',
      completeVoiceId: 'games.cat.grayComplete',
      steps: {
        default: BASE + 'gray_default.jpg',
        eat: BASE + 'gray_eat.jpg',
        bath: BASE + 'gray_bath.jpg',
        sleep: BASE + 'gray_sleep.jpg'
      }
    }
  };

  const ACTIONS = [
    {
      id: 'eat',
      emoji: '🥣',
      label: '밥 주기',
      shortLabel: '밥',
      color: '#FFB74D',
      voiceId: 'games.cat.feed',
      particle: '💛'
    },
    {
      id: 'bath',
      emoji: '🫧',
      label: '목욕하기',
      shortLabel: '목욕',
      color: '#81D4FA',
      voiceId: 'games.cat.wash',
      particle: '🫧'
    },
    {
      id: 'sleep',
      emoji: '🌙',
      label: '재우기',
      shortLabel: '잠',
      color: '#9575CD',
      voiceId: 'games.cat.sleep',
      particle: '⭐'
    }
  ];

  const state = {
    container: null,
    options: {},
    currentCat: null,
    activeStep: 'default',
    completed: null,
    destroyed: false,
    timers: []
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

  function injectStyle() {
    const old = document.getElementById(STYLE_ID);
    if (old) old.remove();

    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .cc-root {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        background: linear-gradient(160deg, #fff9e6 0%, #fff0f9 100%);
        overflow: hidden;
        font-family: 'Jua', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        color: #2d2d2d;
        touch-action: manipulation;
      }

      .cc-root * {
        box-sizing: border-box;
      }

      .cc-screen {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
      }

      /* ═══════════════════════════════════════
         선택 화면 — 모바일 기본
      ═══════════════════════════════════════ */

      .cc-select-screen {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: clamp(18px, 5vh, 40px) 16px 20px;
        gap: clamp(14px, 3vh, 24px);
      }

      .cc-select-hero {
        width: 100%;
        text-align: center;
        flex-shrink: 0;
      }

      .cc-select-title {
        font-size: clamp(24px, 7vw, 38px);
        color: #333;
        margin: 0;
        text-align: center;
        font-weight: 900;
        line-height: 1.15;
      }

      .cc-select-sub {
        margin: 10px 0 0;
        font-size: clamp(14px, 4vw, 20px);
        color: #776b61;
        font-weight: 800;
        line-height: 1.35;
      }

      .cc-select-row {
        width: 100%;
        display: flex;
        gap: clamp(14px, 4vw, 28px);
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        padding: 0;
      }

      .cc-cat-card {
        width: clamp(138px, 40vw, 220px);
        cursor: pointer;
        background: #fff;
        padding: 12px;
        border-radius: 34px;
        box-shadow: 0 12px 28px rgba(0,0,0,0.12);
        border: 5px solid #fff;
        transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
        text-align: center;
        -webkit-tap-highlight-color: transparent;
        font-family: inherit;
      }

      .cc-cat-card:active {
        transform: scale(0.92);
        box-shadow: 0 4px 10px rgba(0,0,0,0.12);
      }

      .cc-cat-img-wrap {
        position: relative;
        width: 100%;
        padding-top: 100%;
        border-radius: 26px;
        overflow: hidden;
        background: #f5f5f5;
      }

      .cc-cat-img-wrap img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 26px;
      }

      .cc-cat-img-fallback {
        position: absolute;
        inset: 0;
        display: none;
        place-items: center;
        font-size: clamp(56px, 16vw, 92px);
        background: linear-gradient(135deg, #ffe0f0, #fff9c4);
      }

      .cc-cat-name {
        font-size: clamp(19px, 5vw, 27px);
        color: #444;
        margin-top: 10px;
        font-weight: 900;
      }

      /* ═══════════════════════════════════════
         돌보기 화면 — 모바일 기본
      ═══════════════════════════════════════ */

      .cc-care-layout {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .cc-left-panel {
        display: none;
      }

      .cc-main-display {
        flex: 1 1 auto;
        min-height: 0;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: clamp(10px, 2vh, 18px) 16px 0;
      }

      .cc-main-wrap {
        position: relative;
        width: clamp(230px, 74vw, 430px);
        aspect-ratio: 1 / 1;
        flex-shrink: 0;
      }

      .cc-main-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: clamp(34px, 9vw, 54px);
        border: clamp(7px, 2vw, 10px) solid #fff;
        box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        animation: ccFloat 3s ease-in-out infinite;
        transition: opacity 0.25s;
        display: block;
        background: #fff;
      }

      .cc-main-fallback {
        position: absolute;
        inset: 0;
        display: none;
        place-items: center;
        font-size: clamp(86px, 25vw, 160px);
        border-radius: clamp(34px, 9vw, 54px);
        background: linear-gradient(135deg, #ffe0f0, #fff9c4);
        border: clamp(7px, 2vw, 10px) solid #fff;
        box-shadow: 0 20px 40px rgba(0,0,0,0.15);
      }

      @keyframes ccFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-14px); }
      }

      .cc-action-panel {
        flex: 0 0 auto;
        width: 100%;
        padding: 10px 14px max(22px, env(safe-area-inset-bottom));
      }

      .cc-panel-title {
        display: none;
      }

      .cc-action-bar {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: clamp(10px, 3.5vw, 22px);
      }

      .cc-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: clamp(82px, 27vw, 122px);
        height: clamp(82px, 27vw, 122px);
        border-radius: 50%;
        border: 6px solid #fff;
        cursor: pointer;
        box-shadow: 0 10px 0 rgba(0,0,0,0.12), 0 14px 20px rgba(0,0,0,0.10);
        transition: transform 0.12s, box-shadow 0.12s, opacity 0.2s;
        -webkit-tap-highlight-color: transparent;
        position: relative;
        font-size: clamp(31px, 9vw, 50px);
        font-family: inherit;
      }

      .cc-btn:active {
        transform: translateY(6px);
        box-shadow: 0 4px 0 rgba(0,0,0,0.12);
      }

      .cc-btn-label {
        position: absolute;
        bottom: -28px;
        left: 50%;
        transform: translateX(-50%);
        font-size: clamp(11px, 3.2vw, 15px);
        color: #555;
        white-space: nowrap;
        font-weight: 900;
      }

      .cc-btn.done {
        opacity: 0.5;
        pointer-events: none;
      }

      .cc-btn.done::after {
        content: '✅';
        position: absolute;
        top: -8px;
        right: -8px;
        font-size: 24px;
        filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));
      }

      .cc-particle {
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        animation: ccExplode 0.8s ease-out forwards;
      }

      @keyframes ccExplode {
        0% {
          transform: translate(0,0) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(var(--tx), var(--ty)) scale(0);
          opacity: 0;
        }
      }

      /* ═══════════════════════════════════════
         완료 화면
      ═══════════════════════════════════════ */

      .cc-complete {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: clamp(14px, 3.5vh, 22px);
        padding: 28px 20px clamp(20px, 5vh, 36px);
        text-align: center;
        overflow: hidden;
      }

      .cc-complete-emoji {
        font-size: clamp(72px, 20vw, 120px);
        animation: ccFloat 2.5s ease-in-out infinite;
      }

      .cc-complete-title {
        font-size: clamp(27px, 7vw, 44px);
        font-weight: 900;
        color: #333;
      }

      .cc-complete-sub {
        font-size: clamp(15px, 4.5vw, 24px);
        color: #666;
        line-height: 1.45;
        font-weight: 700;
      }

      .cc-complete-btns {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: min(100%, 300px);
        margin-top: 6px;
      }

      .cc-c-btn {
        min-height: 60px;
        border-radius: 18px;
        border: none;
        font-size: clamp(16px, 4.5vw, 21px);
        font-weight: 900;
        cursor: pointer;
        touch-action: manipulation;
        box-shadow: 0 6px 0 rgba(0,0,0,0.15);
        transition: transform 0.1s, box-shadow 0.1s;
        -webkit-tap-highlight-color: transparent;
        font-family: inherit;
      }

      .cc-c-btn:active {
        transform: translateY(4px);
        box-shadow: 0 2px 0 rgba(0,0,0,0.15);
      }

      .cc-c-btn-primary {
        background: #FF7A1A;
        color: #fff;
      }

      .cc-c-btn-secondary {
        background: #fff;
        color: #333;
        border: 4px solid #eee !important;
        box-shadow: 0 5px 0 #ddd;
      }

      /* ═══════════════════════════════════════
         태블릿 가로 모드 — 좌측 정보 / 중앙 고양이 / 우측 행동
      ═══════════════════════════════════════ */

      @media (min-width: 768px) and (min-height: 560px) and (orientation: landscape) {
        .cc-root {
          background:
            radial-gradient(circle at 18% 18%, rgba(255,255,255,0.9) 0 10%, transparent 30%),
            linear-gradient(135deg, #fff7da 0%, #ffeaf5 54%, #eaf7ff 100%);
        }

        .cc-select-screen {
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: 22px;
          padding: 22px;
          align-items: stretch;
        }

        .cc-select-hero {
          height: 100%;
          border-radius: 36px;
          background: rgba(255,255,255,0.82);
          border: 6px solid #fff;
          box-shadow: 0 18px 40px rgba(0,0,0,0.10);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .cc-select-title {
          font-size: clamp(34px, 4vw, 54px);
          line-height: 1.16;
        }

        .cc-select-sub {
          font-size: clamp(19px, 2vw, 28px);
          margin-top: 16px;
        }

        .cc-select-row {
          height: 100%;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          align-items: stretch;
          justify-content: stretch;
        }

        .cc-cat-card {
          width: 100%;
          height: 100%;
          min-height: 0;
          border-radius: 38px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-width: 7px;
        }

        .cc-cat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 34px rgba(0,0,0,0.13);
        }

        .cc-cat-img-wrap {
          border-radius: 30px;
        }

        .cc-cat-img-wrap img,
        .cc-cat-img-fallback {
          border-radius: 30px;
        }

        .cc-cat-name {
          font-size: clamp(28px, 3vw, 40px);
          margin-top: 14px;
        }

        .cc-care-layout {
          display: grid;
          grid-template-columns: 230px minmax(0, 1fr) 230px;
          grid-template-rows: minmax(0, 1fr);
          gap: 16px;
          padding: 16px;
        }

        .cc-left-panel {
          display: flex;
          min-height: 0;
          height: 100%;
          flex-direction: column;
          gap: 14px;
          overflow: hidden;
        }

        .cc-info-card,
        .cc-mini-actions,
        .cc-action-panel {
          background: rgba(255,255,255,0.86);
          border: 5px solid #fff;
          border-radius: 32px;
          box-shadow: 0 16px 34px rgba(0,0,0,0.10);
        }

        .cc-info-card {
          flex: 1 1 auto;
          min-height: 0;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          overflow: hidden;
        }

        .cc-info-emoji {
          font-size: clamp(60px, 7vw, 96px);
          line-height: 1;
          margin-bottom: 10px;
        }

        .cc-info-name {
          font-size: clamp(28px, 3vw, 42px);
          font-weight: 900;
          color: #333;
          line-height: 1.1;
        }

        .cc-info-sub {
          margin-top: 10px;
          font-size: clamp(16px, 1.6vw, 22px);
          font-weight: 800;
          color: #776b61;
          line-height: 1.35;
        }

        .cc-mini-actions {
          flex: 0 0 auto;
          padding: 12px;
        }

        .cc-small-btn {
          width: 100%;
          min-height: 58px;
          border: 0;
          border-radius: 22px;
          background: #fff;
          color: #333;
          font-family: inherit;
          font-size: 18px;
          font-weight: 900;
          box-shadow: 0 6px 0 rgba(0,0,0,0.12);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .cc-small-btn:active {
          transform: translateY(4px);
          box-shadow: 0 2px 0 rgba(0,0,0,0.12);
        }

        .cc-main-display {
          min-width: 0;
          min-height: 0;
          height: 100%;
          padding: 0;
        }

        .cc-main-wrap {
          width: min(100%, calc(100vh - 68px));
          height: min(100%, calc(100vh - 68px));
          max-width: 100%;
          max-height: 100%;
        }

        .cc-main-img,
        .cc-main-fallback {
          border-radius: 54px;
          border-width: 12px;
          box-shadow: 0 24px 54px rgba(0,0,0,0.16);
        }

        .cc-action-panel {
          min-height: 0;
          height: 100%;
          padding: 16px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .cc-panel-title {
          display: block;
          flex: 0 0 auto;
          font-size: clamp(22px, 2.2vw, 30px);
          font-weight: 900;
          color: #333;
          text-align: center;
          margin-bottom: 14px;
        }

        .cc-action-bar {
          flex: 1 1 auto;
          min-height: 0;
          display: grid;
          grid-template-columns: 1fr;
          grid-auto-rows: minmax(96px, 1fr);
          gap: 14px;
          align-items: stretch;
          justify-content: stretch;
        }

        .cc-btn {
          width: 100%;
          height: 100%;
          min-height: 96px;
          border-radius: 28px;
          font-size: clamp(38px, 4.5vw, 62px);
          border-width: 6px;
        }

        .cc-btn-label {
          position: static;
          transform: none;
          font-size: clamp(17px, 1.65vw, 23px);
          color: rgba(40,40,40,0.82);
          margin-top: 2px;
        }

        .cc-btn.done::after {
          top: 8px;
          right: 10px;
          font-size: 28px;
        }

        .cc-complete {
          width: min(720px, calc(100% - 48px));
          height: auto;
          min-height: min(620px, calc(100% - 48px));
          margin: auto;
          border-radius: 42px;
          border: 7px solid #fff;
          background: rgba(255,255,255,0.88);
          box-shadow: 0 22px 48px rgba(0,0,0,0.14);
        }

        .cc-complete-emoji {
          font-size: clamp(100px, 10vw, 150px);
        }

        .cc-complete-title {
          font-size: clamp(40px, 4vw, 58px);
        }

        .cc-complete-sub {
          font-size: clamp(22px, 2.2vw, 30px);
        }

        .cc-complete-btns {
          width: min(100%, 460px);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .cc-c-btn {
          min-height: 72px;
          font-size: 22px;
          border-radius: 24px;
        }
      }

      /* 작은 가로 화면 방어 */
      @media (max-height: 540px) and (orientation: landscape) {
        .cc-select-screen {
          display: grid;
          grid-template-columns: 0.7fr 1.3fr;
          gap: 12px;
          padding: 12px;
        }

        .cc-select-hero {
          border-radius: 24px;
          padding: 14px;
        }

        .cc-select-title {
          font-size: clamp(24px, 4vw, 34px);
        }

        .cc-select-sub {
          font-size: 15px;
        }

        .cc-select-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .cc-cat-card {
          width: 100%;
          padding: 10px;
          border-radius: 24px;
        }

        .cc-cat-img-wrap {
          border-radius: 18px;
        }

        .cc-cat-img-wrap img,
        .cc-cat-img-fallback {
          border-radius: 18px;
        }

        .cc-cat-name {
          font-size: 20px;
          margin-top: 6px;
        }

        .cc-care-layout {
          display: grid;
          grid-template-columns: 170px minmax(0, 1fr) 170px;
          gap: 8px;
          padding: 8px;
        }

        .cc-left-panel {
          display: flex;
          min-height: 0;
          height: 100%;
          flex-direction: column;
          gap: 8px;
          overflow: hidden;
        }

        .cc-info-card,
        .cc-mini-actions,
        .cc-action-panel {
          border-radius: 20px;
          border: 4px solid #fff;
          background: rgba(255,255,255,0.88);
          box-shadow: 0 10px 22px rgba(0,0,0,0.10);
        }

        .cc-info-card {
          flex: 1 1 auto;
          min-height: 0;
          padding: 10px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .cc-info-emoji {
          font-size: 46px;
        }

        .cc-info-name {
          font-size: 23px;
          font-weight: 900;
        }

        .cc-info-sub {
          font-size: 13px;
          font-weight: 800;
          color: #776b61;
          margin-top: 5px;
        }

        .cc-mini-actions {
          padding: 8px;
        }

        .cc-small-btn {
          min-height: 40px;
          border: 0;
          border-radius: 14px;
          background: #fff;
          font-family: inherit;
          font-size: 14px;
          font-weight: 900;
          box-shadow: 0 4px 0 rgba(0,0,0,0.12);
        }

        .cc-main-display {
          padding: 0;
        }

        .cc-main-wrap {
          width: min(100%, calc(100vh - 24px));
          height: min(100%, calc(100vh - 24px));
        }

        .cc-main-img,
        .cc-main-fallback {
          border-radius: 28px;
          border-width: 6px;
        }

        .cc-action-panel {
          height: 100%;
          min-height: 0;
          padding: 8px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .cc-panel-title {
          display: block;
          font-size: 16px;
          font-weight: 900;
          text-align: center;
          margin-bottom: 8px;
        }

        .cc-action-bar {
          display: grid;
          grid-template-columns: 1fr;
          grid-auto-rows: minmax(54px, 1fr);
          gap: 8px;
          flex: 1;
        }

        .cc-btn {
          width: 100%;
          height: 100%;
          min-height: 54px;
          border-radius: 18px;
          border-width: 4px;
          font-size: 28px;
        }

        .cc-btn-label {
          position: static;
          transform: none;
          font-size: 12px;
          margin-top: 2px;
        }
      }
    `;

    document.head.appendChild(s);
  }

  function playVoiceId(voiceId) {
    if (voiceId && window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      window.SihyeonVoice.play(voiceId, '').catch(() => {});
    }
  }

  function burst(x, y, emoji, count = 16) {
    const root = document.body;
    const startX = Number.isFinite(x) ? x : window.innerWidth / 2;
    const startY = Number.isFinite(y) ? y : window.innerHeight / 2;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'cc-particle';
      p.textContent = emoji;
      p.style.fontSize = '26px';

      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 140;

      p.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
      p.style.left = `${startX}px`;
      p.style.top = `${startY}px`;

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
      if (!state.container) return;

      img.style.display = 'block';
      img.src = src;
      img.style.opacity = '1';

      if (fallback) {
        fallback.textContent = state.currentCat.emoji;
        fallback.style.display = 'none';
      }
    }, 120);
  }

  function renderSelect() {
    if (state.destroyed || !state.container) return;

    const root = state.container.querySelector('.cc-root');

    root.innerHTML = `
      <div class="cc-screen cc-select-screen">
        <div class="cc-select-hero">
          <h2 class="cc-select-title">어떤 야옹이를<br>돌볼까?</h2>
          <p class="cc-select-sub">눈이와 름이가<br>시현이를 기다려요</p>
        </div>
        <div class="cc-select-row" id="cc-select-row"></div>
      </div>
    `;

    const row = root.querySelector('#cc-select-row');

    Object.values(CAT_DATA).forEach(cat => {
      const card = document.createElement('button');
      card.className = 'cc-cat-card';
      card.type = 'button';
      card.setAttribute('aria-label', cat.name);
      card.style.borderColor = '#fff';
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

    playVoiceId('games.cat.intro');
  }

  function renderCare() {
    if (state.destroyed || !state.container) return;

    const cat = state.currentCat;
    const root = state.container.querySelector('.cc-root');

    root.innerHTML = `
      <div class="cc-screen cc-care-layout">
        <aside class="cc-left-panel">
          <div class="cc-info-card">
            <div class="cc-info-emoji">${cat.emoji}</div>
            <div class="cc-info-name">${cat.name}</div>
            <div class="cc-info-sub">밥 먹고<br>목욕하고<br>코 잘 시간이에요</div>
          </div>
          <div class="cc-mini-actions">
            <button class="cc-small-btn" id="cc-change-cat" type="button">고양이 바꾸기</button>
          </div>
        </aside>

        <main class="cc-main-display">
          <div class="cc-main-wrap">
            <img id="cc-main-img" class="cc-main-img"
              src="${cat.steps.default}" alt="${cat.name}"
              onerror="this.style.display='none';document.getElementById('cc-main-fallback').style.display='grid';">
            <div id="cc-main-fallback" class="cc-main-fallback">${cat.emoji}</div>
          </div>
        </main>

        <aside class="cc-action-panel">
          <div class="cc-panel-title">${cat.name} 돌보기</div>
          <div class="cc-action-bar" id="cc-action-bar"></div>
        </aside>
      </div>
    `;

    const changeBtn = root.querySelector('#cc-change-cat');
    if (changeBtn) {
      changeBtn.addEventListener('click', () => {
        state.currentCat = null;
        state.completed = null;
        state.activeStep = 'default';
        renderSelect();
      });
    }

    renderActionBtns();
    playVoiceId(cat.introVoiceId);
  }

  function renderActionBtns() {
    if (!state.container) return;

    const bar = state.container.querySelector('#cc-action-bar');
    if (!bar) return;

    bar.innerHTML = '';

    ACTIONS.forEach(action => {
      const btn = document.createElement('button');
      btn.className = 'cc-btn' + (state.completed.has(action.id) ? ' done' : '');
      btn.type = 'button';
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
      <div class="cc-screen cc-complete">
        <div class="cc-complete-emoji">${cat.emoji}</div>
        <div class="cc-complete-title">${cat.name} 행복해요! 🎉</div>
        <div class="cc-complete-sub">${cat.name}가 너무 기뻐해요!<br>시현이 최고야 ⭐</div>
        <div class="cc-complete-btns">
          <button class="cc-c-btn cc-c-btn-primary" id="cc-replay" type="button">다시 하기 🔄</button>
          <button class="cc-c-btn cc-c-btn-secondary" id="cc-to-land" type="button">즐거운놀이터로 👋</button>
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
      if (typeof window.openGameLand === 'function') {
        window.openGameLand();
      } else {
        state.options.closeToParkHome?.();
      }
    });

    playVoiceId(cat.completeVoiceId);
    state.options.fireConfetti?.();
    state.options.gainExp?.(25);
  }

  function startCare(cat) {
    state.currentCat = cat;
    state.completed = new Set();
    state.activeStep = 'default';
    renderCare();
  }

  function handleAction(action, clientX, clientY) {
    state.completed.add(action.id);
    state.activeStep = action.id;

    setMainImg(action.id);
    burst(clientX, clientY, action.particle);
    playVoiceId(action.voiceId);
    renderActionBtns();

    if (state.completed.size >= ACTIONS.length) {
      timer(() => renderComplete(), 1800);
    }
  }

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

    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }

    if (state.container) {
      state.container.innerHTML = '';
    }

    state.container = null;
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
})();