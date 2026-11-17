/* ═══════════════════════════════════════════
   SIHYEON PLAY OS — 꼬마 고양이 돌보기
   파일: js/games/cat-care.js
   버전: v1.6.1
   수정: 첫 화면 눈이/름이 선택 카드 세로형 확대 및 이미지 잘림 방지
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
      selectImg: BASE + 'white_select.webp',
      introVoiceId: 'games.cat.whiteIntro',
      completeVoiceId: 'games.cat.whiteComplete',
      steps: {
        default: BASE + 'white_default.webp',
        eat: BASE + 'white_eat.webp',
        bath: BASE + 'white_bath.webp',
        sleep: BASE + 'white_sleep.webp'
      }
    },
    gray: {
      id: 'gray',
      name: '름이',
      emoji: '🐈',
      color: '#64B5F6',
      selectImg: BASE + 'gray_select.webp',
      introVoiceId: 'games.cat.grayIntro',
      completeVoiceId: 'games.cat.grayComplete',
      steps: {
        default: BASE + 'gray_default.webp',
        eat: BASE + 'gray_eat.webp',
        bath: BASE + 'gray_bath.webp',
        sleep: BASE + 'gray_sleep.webp'
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
    },
    { id: 'wait', emoji: '🌿', label: '기다리기', shortLabel: '기다려요', color: '#A5D6A7', particle: '💚' }
  ];

  const NEEDS = [
    { id: 'hungry', action: 'eat', cue: '🥣', request: '배가 고파!', title: '배가 고파요', clue: '빈 밥그릇 앞에서 기다려요. 무엇이 필요할까요?', result: '냠냠! 맛있게 밥을 먹어요.',
      en: ['I am hungry', 'The food bowl is empty. What does the cat need?', 'Yum! The cat has eaten and feels full.'] },
    { id: 'wash', action: 'bath', cue: '🫧', request: '깨끗이 씻고 싶어!', title: '씻고 싶어요', clue: '씻고 싶은 마음을 알려 줬어요. 어떻게 도와줄까요?', result: '보글보글, 함께 목욕해요.',
      en: ['I want to wash', 'The cat says it would like to wash. How can we help?', 'Bubbles! We are helping the cat wash.'] },
    { id: 'sleepy', action: 'sleep', cue: '🌙', request: '졸려, 쉬고 싶어.', title: '졸려요', clue: '졸린 마음을 알려 줬어요. 무엇이 필요할까요?', result: '코오, 편안히 쉬어요. 깨우지 않고 지켜봐요.',
      en: ['I am sleepy', 'The cat says it feels sleepy. What does it need?', 'The cat is resting. Let us keep it quiet.'] },
    { id: 'space', action: 'wait', cue: '🌿', request: '조금 혼자 있고 싶어.', title: '혼자 쉬고 싶어요', clue: '혼자 있고 싶은 마음을 알려 줬어요. 기다려 줄까요?', result: '조용히 기다려 줬어요. 고양이가 편안히 쉬어요.',
      en: ['I need some space', 'The cat says it wants some time alone. Shall we wait?', 'We waited quietly. The cat is resting.'] }
  ];

  const state = {
    container: null,
    options: {},
    currentCat: null,
    activeStep: 'default',
    completed: null,
    destroyed: false,
    timers: [],
    currentScreen: 'select', // 'select', 'care', 'complete'
    resizeTimer: null,
    // 보상 및 음성 중복 방지 플래그
    selectIntroPlayed: false,
    careIntroPlayed: false,
    completeRewardGiven: false,
    needIndex: 0,
    resolved: false,
    feedback: '',
    feedbackEn: '',
    turnId: 0,
    timerToken: 0,
    rewarded: new Set(),
    completedCats: new Set(),
    particles: new Set()
  };

  function isLandscapeMode() {
    return window.innerWidth > window.innerHeight && window.innerHeight >= 320;
  }

  function timer(fn, ms) {
    const token = state.timerToken;
    const id = setTimeout(() => {
      state.timers = state.timers.filter(t => t !== id);
      if (!state.destroyed && token === state.timerToken) fn();
    }, ms);

    state.timers.push(id);
    return id;
  }

  function clearTimers() {
    state.timerToken += 1;
    state.particles.forEach(node => node.remove());
    state.particles.clear();
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
        background:
          radial-gradient(circle at 18% 14%, rgba(255,255,255,0.86) 0 9%, transparent 31%),
          linear-gradient(160deg, #fff9e6 0%, #fff0f9 62%, #eaf7ff 100%);
        overflow: hidden;
        font-family: 'Jua', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        color: #2d2d2d;
        touch-action: manipulation;
      }

      .cc-root.is-landscape {
        background:
          radial-gradient(circle at 15% 16%, rgba(255,255,255,0.95) 0 9%, transparent 30%),
          radial-gradient(circle at 85% 18%, rgba(255,255,255,0.76) 0 8%, transparent 27%),
          linear-gradient(135deg, #fff7da 0%, #ffeaf5 54%, #eaf7ff 100%);
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

      /* ─────────────────────────────
         선택 화면: 세로
      ───────────────────────────── */
      .cc-select-portrait {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: clamp(10px, 3vh, 24px) 14px max(14px, env(safe-area-inset-bottom));
        gap: clamp(8px, 2vh, 16px);
      }

      .cc-select-hero {
        width: 100%;
        text-align: center;
        flex-shrink: 0;
      }

      .cc-select-title {
        font-size: clamp(25px, 7vw, 38px);
        color: #333;
        margin: 0;
        text-align: center;
        font-weight: 900;
        line-height: 1.12;
        text-shadow: 0 3px 0 rgba(255,255,255,0.72);
      }

      .cc-select-sub {
        margin: 10px 0 0;
        font-size: clamp(14px, 4vw, 20px);
        color: #776b61;
        font-weight: 800;
        line-height: 1.35;
      }

      .cc-select-row {
        width: min(100%, 560px);
        flex: 1 1 auto;
        min-height: 0;
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: repeat(2, minmax(0, 1fr));
        gap: clamp(10px, 2.4vh, 18px);
        align-items: stretch;
        justify-content: center;
        padding: 0;
      }

      .cc-cat-card {
        width: 100%;
        min-width: 0;
        cursor: pointer;
        background: rgba(255,255,255,0.94);
        padding: clamp(10px, 2.8vw, 16px);
        border-radius: clamp(26px, 7vw, 36px);
        box-shadow: 0 12px 28px rgba(0,0,0,0.12);
        border: clamp(5px, 1.5vw, 7px) solid #fff;
        transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
        text-align: center;
        -webkit-tap-highlight-color: transparent;
        font-family: inherit;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        grid-template-rows: 1fr;
        align-items: center;
        gap: clamp(10px, 3vw, 18px);
        min-height: 0;
      }

      .cc-cat-card:active {
        transform: scale(0.94);
        box-shadow: 0 4px 10px rgba(0,0,0,0.12);
      }

      .cc-cat-img-wrap {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        border-radius: clamp(20px, 6vw, 30px);
        overflow: hidden;
        background: linear-gradient(135deg, #fffaf0, #fff6fb);
      }

      .cc-cat-img-wrap img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: inherit;
      }

      .cc-cat-img-fallback {
        position: absolute;
        inset: 0;
        display: none;
        place-items: center;
        font-size: clamp(58px, 16vw, 94px);
        background: linear-gradient(135deg, #ffe0f0, #fff9c4);
        border-radius: inherit;
      }

      .cc-cat-name {
        min-width: clamp(72px, 18vw, 110px);
        font-size: clamp(24px, 6vw, 36px);
        color: #444;
        margin-top: 0;
        font-weight: 900;
        line-height: 1.05;
      }

      /* ─────────────────────────────
         선택 화면: 태블릿/폰 가로 공통
      ───────────────────────────── */
      .cc-select-landscape {
        display: grid;
        grid-template-columns: 230px minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr);
        gap: 14px;
        padding: 14px;
        align-items: stretch;
      }

      .cc-select-landscape .cc-select-hero {
        height: 100%;
        border-radius: 30px;
        background: rgba(255,255,255,0.82);
        border: 5px solid #fff;
        box-shadow: 0 12px 30px rgba(0,0,0,0.10);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .cc-select-landscape .cc-select-title {
        font-size: clamp(30px, 4vw, 48px);
        line-height: 1.08;
      }

      .cc-select-landscape .cc-select-sub {
        font-size: clamp(16px, 1.8vw, 22px);
        margin-top: 8px;
      }

      .cc-select-landscape .cc-select-row {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .cc-select-landscape .cc-cat-card {
        width: 100%;
        height: 100%;
        border-radius: 34px;
        padding: 14px;
        border-width: 7px;
        grid-template-columns: minmax(0, 1fr) 128px;
      }

      .cc-select-landscape .cc-cat-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 18px 34px rgba(0,0,0,0.13);
      }

      .cc-select-landscape .cc-cat-img-wrap {
        height: 100%;
        min-height: 0;
        border-radius: 28px;
      }

      .cc-select-landscape .cc-cat-name {
        min-width: 112px;
        font-size: clamp(32px, 3.2vw, 48px);
        margin-top: 0;
      }

      /* ─────────────────────────────
         돌보기 화면: 세로
      ───────────────────────────── */
      .cc-care-portrait {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .cc-main-display {
        flex: 1 1 auto;
        min-height: 0;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .cc-care-portrait .cc-main-display {
        padding: clamp(10px, 2vh, 18px) 14px 0;
      }

      .cc-main-wrap {
        position: relative;
        flex-shrink: 0;
      }

      .cc-care-portrait .cc-main-wrap {
        width: min(92vw, 470px);
        max-height: 100%;
        aspect-ratio: 1 / 1;
      }

      .cc-main-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        animation: ccFloat 3s ease-in-out infinite;
        transition: opacity 0.25s;
        display: block;
        background: #fff;
      }

      .cc-care-portrait .cc-main-img {
        border-radius: clamp(34px, 9vw, 54px);
        border: clamp(7px, 2vw, 10px) solid #fff;
      }

      .cc-main-fallback {
        position: absolute;
        inset: 0;
        display: none;
        place-items: center;
        background: linear-gradient(135deg, #ffe0f0, #fff9c4);
        box-shadow: 0 20px 40px rgba(0,0,0,0.15);
      }

      .cc-care-portrait .cc-main-fallback {
        font-size: clamp(86px, 25vw, 160px);
        border-radius: clamp(34px, 9vw, 54px);
        border: clamp(7px, 2vw, 10px) solid #fff;
      }

      @keyframes ccFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-14px); }
      }

      .cc-action-panel-portrait {
        flex: 0 0 auto;
        width: 100%;
        padding: 10px 12px max(22px, env(safe-area-inset-bottom));
      }

      .cc-action-bar-portrait {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: clamp(10px, 3vw, 18px);
        align-items: stretch;
        justify-content: center;
      }

      .cc-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        cursor: pointer;
        transition: transform 0.12s, box-shadow 0.12s, opacity 0.2s;
        -webkit-tap-highlight-color: transparent;
        position: relative;
        font-family: inherit;
      }

      .cc-action-bar-portrait .cc-btn {
        width: 100%;
        min-height: clamp(88px, 24vw, 124px);
        border-radius: 26px;
        border: 6px solid #fff;
        box-shadow: 0 10px 0 rgba(0,0,0,0.12), 0 14px 20px rgba(0,0,0,0.10);
        font-size: clamp(30px, 8vw, 46px);
      }

      .cc-btn:active {
        transform: translateY(6px);
        box-shadow: 0 4px 0 rgba(0,0,0,0.12);
      }

      .cc-btn-label {
        color: #555;
        white-space: nowrap;
        font-weight: 900;
      }

      .cc-action-bar-portrait .cc-btn-label {
        position: static;
        transform: none;
        font-size: clamp(12px, 3.2vw, 15px);
        margin-top: 2px;
      }

      .cc-btn.done {
        opacity: 0.5;
        pointer-events: none;
      }

      .cc-btn.done::after {
        content: '✅';
        position: absolute;
        filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));
      }

      .cc-action-bar-portrait .cc-btn.done::after {
        top: -8px;
        right: -8px;
        font-size: 24px;
      }

      /* ─────────────────────────────
         돌보기 화면: 태블릿/폰 가로
      ───────────────────────────── */
      .cc-care-landscape {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: grid;
        grid-template-columns: 220px minmax(0, 1fr) 240px;
        grid-template-rows: minmax(0, 1fr);
        gap: 12px;
        padding: 12px;
        overflow: hidden;
      }

      .cc-care-landscape .cc-main-display {
        min-width: 0;
        height: 100%;
        padding: 0;
      }

      .cc-care-landscape .cc-main-wrap {
        width: min(100%, calc(100vh - 44px));
        height: min(100%, calc(100vh - 44px));
        max-width: 100%;
        max-height: 100%;
      }

      .cc-care-landscape .cc-main-img {
        border-radius: 46px;
        border: 10px solid #fff;
        box-shadow: 0 24px 54px rgba(0,0,0,0.16);
      }

      .cc-care-landscape .cc-main-fallback {
        font-size: clamp(86px, 16vw, 160px);
        border-radius: 46px;
        border: 10px solid #fff;
      }

      .cc-left-panel {
        display: flex;
        min-height: 0;
        height: 100%;
        flex-direction: column;
        gap: 12px;
        overflow: hidden;
      }

      .cc-info-card,
      .cc-mini-actions,
      .cc-action-panel-landscape {
        background: rgba(255,255,255,0.86);
        border: 5px solid #fff;
        border-radius: 28px;
        box-shadow: 0 16px 34px rgba(0,0,0,0.10);
      }

      .cc-info-card {
        flex: 1 1 auto;
        min-height: 0;
        padding: 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        overflow: hidden;
      }

      .cc-info-emoji {
        font-size: clamp(58px, 6.5vw, 90px);
        line-height: 1;
        margin-bottom: 8px;
      }

      .cc-info-name {
        font-size: clamp(27px, 3vw, 40px);
        font-weight: 900;
        color: #333;
        line-height: 1.08;
      }

      .cc-info-sub {
        margin-top: 10px;
        font-size: clamp(15px, 1.45vw, 20px);
        font-weight: 800;
        color: #776b61;
        line-height: 1.35;
      }

      .cc-mini-actions {
        flex: 0 0 auto;
        padding: 10px;
      }

      .cc-small-btn {
        width: 100%;
        min-height: 54px;
        border: 0;
        border-radius: 20px;
        background: #fff;
        color: #333;
        font-family: inherit;
        font-size: 17px;
        font-weight: 900;
        box-shadow: 0 6px 0 rgba(0,0,0,0.12);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }

      .cc-small-btn:active {
        transform: translateY(4px);
        box-shadow: 0 2px 0 rgba(0,0,0,0.12);
      }

      .cc-action-panel-landscape {
        min-height: 0;
        height: 100%;
        padding: 14px;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .cc-action-panel-landscape .cc-panel-title {
        display: block;
        flex: 0 0 auto;
        font-size: clamp(21px, 2vw, 29px);
        font-weight: 900;
        color: #333;
        text-align: center;
        margin-bottom: 12px;
        line-height: 1.12;
      }

      .cc-action-bar-landscape {
        flex: 1 1 auto;
        min-height: 0;
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: repeat(3, minmax(0, 1fr));
        gap: 12px;
        align-items: stretch;
        justify-content: stretch;
      }

      .cc-action-bar-landscape .cc-btn {
        width: 100%;
        height: 100%;
        min-height: 0;
        border-radius: 28px;
        border: 6px solid #fff;
        box-shadow: 0 10px 0 rgba(0,0,0,0.12), 0 14px 20px rgba(0,0,0,0.10);
        font-size: clamp(38px, 4.2vw, 60px);
      }

      .cc-action-bar-landscape .cc-btn-label {
        position: static;
        transform: none;
        font-size: clamp(16px, 1.55vw, 22px);
        color: rgba(40,40,40,0.82);
        margin-top: 2px;
      }

      .cc-action-bar-landscape .cc-btn.done::after {
        top: 8px;
        right: 10px;
        font-size: 28px;
      }

      /* ─────────────────────────────
         완료 화면
      ───────────────────────────── */
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

      .cc-complete.is-landscape {
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
        font-size: clamp(72px, 20vw, 120px);
        animation: ccFloat 2.5s ease-in-out infinite;
      }

      .cc-complete.is-landscape .cc-complete-emoji {
        font-size: clamp(100px, 10vw, 150px);
      }

      .cc-complete-title {
        font-size: clamp(27px, 7vw, 44px);
        font-weight: 900;
        color: #333;
      }

      .cc-complete.is-landscape .cc-complete-title {
        font-size: clamp(40px, 4vw, 58px);
      }

      .cc-complete-sub {
        font-size: clamp(15px, 4.5vw, 24px);
        color: #666;
        line-height: 1.45;
        font-weight: 700;
      }

      .cc-complete.is-landscape .cc-complete-sub {
        font-size: clamp(22px, 2.2vw, 30px);
      }

      .cc-complete-btns {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: min(100%, 300px);
        margin-top: 6px;
      }

      .cc-complete.is-landscape .cc-complete-btns {
        width: min(100%, 460px);
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
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

      .cc-complete.is-landscape .cc-c-btn {
        min-height: 72px;
        font-size: 22px;
        border-radius: 24px;
      }

      .cc-c-btn:active {
        transform: translateY(4px);
        box-shadow: 0 2px 0 rgba(0,0,0,0.15);
      }

      .cc-c-btn-primary { background: #FF7A1A; color: #fff; }
      .cc-c-btn-secondary {
        background: #fff;
        color: #333;
        border: 4px solid #eee !important;
        box-shadow: 0 5px 0 #ddd;
      }

      .cc-particle {
        position: fixed;
        z-index: 9999;
        pointer-events: none;
        line-height: 1;
        transform: translate(-50%, -50%);
        animation: ccParticleBurst 0.9s ease-out forwards;
      }

      @keyframes ccParticleBurst {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(0.7) rotate(0deg); }
        100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.5) rotate(220deg); }
      }

      /* ─────────────────────────────
         큰 태블릿 가로
      ───────────────────────────── */
      @media (orientation: landscape) and (min-width: 1200px) and (min-height: 720px) {
        .cc-select-landscape {
          grid-template-columns: 260px minmax(0, 1fr);
          grid-template-rows: minmax(0, 1fr);
          gap: 18px;
          padding: 18px;
        }

        .cc-select-landscape .cc-select-hero {
          border-radius: 34px;
        }

        .cc-select-landscape .cc-select-title {
          font-size: clamp(42px, 3.6vw, 58px);
        }

        .cc-select-landscape .cc-select-sub {
          font-size: clamp(20px, 1.8vw, 28px);
        }

        .cc-select-landscape .cc-select-row {
          gap: 18px;
        }

        .cc-select-landscape .cc-cat-card {
          border-radius: 42px;
          padding: 20px;
          grid-template-columns: minmax(0, 1fr) 150px;
        }

        .cc-select-landscape .cc-cat-img-wrap {
          border-radius: 34px;
        }

        .cc-care-landscape {
          grid-template-columns: 240px minmax(0, 1fr) 260px;
          gap: 16px;
          padding: 16px;
        }

        .cc-care-landscape .cc-main-wrap {
          width: min(100%, calc(100vh - 52px));
          height: min(100%, calc(100vh - 52px));
        }
      }

      /* ─────────────────────────────
         폰 가로 / 낮은 높이
      ───────────────────────────── */
      @media (orientation: landscape) and (max-height: 540px) {
        .cc-select-landscape {
          grid-template-columns: 96px minmax(0, 1fr);
          grid-template-rows: minmax(0, 1fr);
          gap: 6px;
          padding: 6px;
        }

        .cc-select-landscape .cc-select-hero {
          border-radius: 18px;
          border-width: 3px;
          box-shadow: 0 8px 18px rgba(0,0,0,0.08);
        }

        .cc-select-landscape .cc-select-title {
          font-size: clamp(20px, 4vw, 30px);
        }

        .cc-select-landscape .cc-select-title br,
        .cc-select-landscape .cc-select-sub {
          display: none;
        }

        .cc-select-landscape .cc-select-row {
          gap: 8px;
        }

        .cc-select-landscape .cc-cat-card {
          padding: 8px;
          border-radius: 18px;
          border-width: 4px;
          grid-template-columns: minmax(0, 1fr) 54px;
          gap: 7px;
        }

        .cc-select-landscape .cc-cat-img-wrap {
          border-radius: 14px;
        }

        .cc-select-landscape .cc-cat-name {
          min-width: 48px;
          font-size: 18px;
          margin-top: 0;
        }

        .cc-care-landscape {
          grid-template-columns: 128px minmax(0, 1fr) 138px;
          gap: 6px;
          padding: 6px;
        }

        .cc-left-panel {
          gap: 6px;
        }

        .cc-info-card,
        .cc-mini-actions,
        .cc-action-panel-landscape {
          border-radius: 16px;
          border-width: 3px;
          box-shadow: 0 8px 18px rgba(0,0,0,0.09);
        }

        .cc-info-card {
          padding: 6px;
        }

        .cc-info-emoji {
          font-size: 34px;
          margin-bottom: 4px;
        }

        .cc-info-name {
          font-size: 19px;
        }

        .cc-info-sub {
          display: none;
        }

        .cc-mini-actions {
          padding: 5px;
        }

        .cc-small-btn {
          min-height: 34px;
          border-radius: 11px;
          font-size: 12px;
          box-shadow: 0 3px 0 rgba(0,0,0,0.12);
        }

        .cc-care-landscape .cc-main-wrap {
          width: min(100%, calc(100vh - 16px));
          height: min(100%, calc(100vh - 16px));
        }

        .cc-care-landscape .cc-main-img,
        .cc-care-landscape .cc-main-fallback {
          border-radius: 22px;
          border-width: 5px;
        }

        .cc-action-panel-landscape {
          padding: 6px;
        }

        .cc-action-panel-landscape .cc-panel-title {
          font-size: 13px;
          margin-bottom: 6px;
        }

        .cc-action-bar-landscape {
          gap: 6px;
        }

        .cc-action-bar-landscape .cc-btn {
          border-radius: 14px;
          border-width: 3px;
          font-size: 25px;
          box-shadow: 0 5px 0 rgba(0,0,0,0.12), 0 7px 12px rgba(0,0,0,0.09);
        }

        .cc-action-bar-landscape .cc-btn-label {
          font-size: 11px;
          margin-top: 0;
        }

        .cc-action-bar-landscape .cc-btn.done::after {
          top: 3px;
          right: 5px;
          font-size: 18px;
        }

        .cc-complete.is-landscape {
          min-height: calc(100% - 18px);
          width: min(620px, calc(100% - 18px));
          border-radius: 24px;
          border-width: 5px;
          padding: 16px;
          gap: 10px;
        }

        .cc-complete.is-landscape .cc-complete-emoji {
          font-size: 70px;
        }

        .cc-complete.is-landscape .cc-complete-title {
          font-size: 30px;
        }

        .cc-complete.is-landscape .cc-complete-sub {
          font-size: 15px;
        }

        .cc-complete.is-landscape .cc-c-btn {
          min-height: 46px;
          font-size: 16px;
          border-radius: 16px;
        }
      }

      /* ─────────────────────────────
         작은 폰 세로
      ───────────────────────────── */
      @media (orientation: portrait) and (max-height: 700px) {
        .cc-select-portrait {
          padding-top: 12px;
          gap: 10px;
        }

        .cc-select-title {
          font-size: clamp(22px, 6.2vw, 30px);
        }

        .cc-select-sub {
          margin-top: 5px;
          font-size: 13px;
        }

        .cc-cat-card {
          padding: 9px;
          border-radius: 24px;
          gap: 8px;
        }

        .cc-cat-name {
          min-width: 58px;
          font-size: 20px;
          margin-top: 0;
        }

        .cc-care-portrait .cc-main-display {
          padding-top: 8px;
        }

        .cc-care-portrait .cc-main-wrap {
          width: min(84vw, 390px);
        }

        .cc-action-panel-portrait {
          padding-top: 6px;
        }

        .cc-action-bar-portrait .cc-btn {
          min-height: 78px;
          border-radius: 22px;
          font-size: 27px;
          border-width: 5px;
        }

        .cc-action-bar-portrait .cc-btn-label {
          font-size: 11px;
        }
      }
    `;


    s.textContent += `
      .cc-care-v2{display:grid;height:100%;min-height:0;padding:10px;gap:8px;grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(70px,1fr) auto auto auto;overflow:hidden}
      .cc-care-header{display:flex;align-items:center;gap:8px;min-width:0;grid-row:1}
      .cc-care-name{flex:1;min-width:0;font-size:clamp(18px,5vw,25px);font-weight:900;margin:0;color:#614449}
      .cc-care-control{min-width:44px;min-height:44px;flex-shrink:0;border:3px solid #fff;background:#fff9de;border-radius:15px;font:inherit;font-size:14px;font-weight:900;color:#46363b;padding:7px 10px;cursor:pointer;box-shadow:0 3px 0 #dec7c7}
      .cc-care-control[data-cat-listen]{font-size:22px;padding:5px;width:44px}
      .cc-observe-scene{position:relative;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;border-radius:28px;overflow:hidden;border:5px solid #fff;background:linear-gradient(135deg,#fff8e9,#fff0f5);box-shadow:0 5px 0 #e9d7da}
      .cc-observe-scene img{display:block;width:100%;height:100%;min-height:0;object-fit:contain}
      .cc-observe-scene .cc-main-fallback{font-size:80px;box-shadow:none}
      .cc-need-cue{position:absolute;right:10px;top:10px;padding:8px 12px;display:grid;place-items:center;background:#fff;border:3px solid #f2c7ca;border-radius:22px;font-size:clamp(30px,7vw,48px);box-shadow:0 3px 8px #66443322;pointer-events:none}
      .cc-cat-request{position:absolute;left:12px;right:12px;bottom:10px;max-width:380px;margin:0 auto;padding:8px 12px;background:#fffdf5;border:3px solid #d5abae;border-radius:20px;font-size:clamp(17px,4.2vw,23px);line-height:1.25;text-align:center;font-weight:900;color:#613644;box-shadow:0 3px 8px #66443322;pointer-events:none}
      .cc-care-story{min-width:0;padding:8px 12px;border-radius:18px;background:#fffdf7;border:3px solid #fff;text-align:center;line-height:1.35}
      .cc-need-title{margin:0 0 3px;font-size:clamp(18px,4.6vw,23px);font-weight:900;color:#743b4c}
      .cc-care-copy{font-size:clamp(14px,3.7vw,17px);margin:0;word-break:keep-all;color:#46363b;line-height:1.4}
      .cc-care-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .cc-care-v2 .cc-btn{min-width:44px;min-height:58px;border:4px solid #fff;border-radius:18px;font-size:28px;display:flex;flex-direction:row;gap:8px;padding:6px;box-shadow:0 4px 0 #cbbec7}
      .cc-care-v2 .cc-btn-label{font-size:clamp(14px,3.7vw,18px);white-space:normal;line-height:1.2;color:#322c37}
      .cc-care-v2 .cc-btn.done{opacity:1;pointer-events:auto;outline:3px solid #438460;outline-offset:-3px}
      .cc-care-v2 .cc-btn.done::after{content:'✓';top:2px;right:7px;font-size:16px;color:#175e36;filter:none}
      .cc-care-footer{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .cc-care-footer .cc-care-control{padding:6px;font-size:clamp(13px,3.3vw,16px)}
      .cc-care-next{background:#336d61;color:white}
      .cc-care-next:disabled{background:#eee3df;color:#6e6560;cursor:default;box-shadow:none}
      .cc-care-v2 button:focus-visible{outline:3px solid #174e87;outline-offset:2px}
      .cc-care-v2.is-landscape{grid-template-columns:minmax(0,1fr) minmax(230px,42%);grid-template-rows:44px auto minmax(0,1fr) 44px;gap:8px}
      .cc-care-v2.is-landscape .cc-care-header{grid-column:1/3}
      .cc-care-v2.is-landscape .cc-observe-scene{grid-column:1;grid-row:2/5}
      .cc-care-v2.is-landscape .cc-care-story{grid-column:2;grid-row:2;padding:6px 8px}
      .cc-care-v2.is-landscape .cc-care-actions{grid-column:2;grid-row:3}
      .cc-care-v2.is-landscape .cc-care-footer{grid-column:2;grid-row:4}
      .cc-care-v2.is-landscape .cc-btn{min-height:44px;font-size:23px;padding:4px;gap:5px;border-width:3px;border-radius:14px}
      .cc-care-v2.is-landscape .cc-btn-label{font-size:14px}
      .cc-care-v2.is-landscape .cc-need-title{font-size:18px}
      .cc-care-v2.is-landscape .cc-care-copy{font-size:14px}
      @media(orientation:portrait) and (max-height:650px){.cc-care-v2{padding:7px;gap:6px}.cc-care-v2 .cc-btn{min-height:50px;font-size:24px}.cc-care-v2 .cc-care-story{padding:6px 8px}.cc-care-v2 .cc-need-title{font-size:18px}.cc-care-v2 .cc-care-copy{font-size:14px}}
      @media(orientation:landscape) and (max-height:400px){.cc-care-v2.is-landscape{padding:6px;gap:6px;grid-template-columns:minmax(0,1fr) minmax(236px,43%)}.cc-care-v2.is-landscape .cc-care-actions{gap:5px}.cc-care-v2.is-landscape .cc-care-story{padding:4px 7px}.cc-care-v2.is-landscape .cc-care-footer{gap:5px}.cc-care-v2.is-landscape .cc-care-footer .cc-care-control{font-size:13px}}
      @media(prefers-reduced-motion:reduce){.cc-particle{animation:none}.cc-main-img{animation:none;transition:none}}
    `;

    document.head.appendChild(s);
  }

  function playVoiceId(voiceId) {
    if (state.destroyed || document.hidden) return;
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
      state.particles.add(p);
      timer(() => { p.remove(); state.particles.delete(p); }, 900);
    }
  }

  function renderSelect(renderOpts = {}) {
    if (state.destroyed || !state.container) return;
    state.currentScreen = 'select';
    const selectionTurn = state.turnId;
    const root = state.container.querySelector('.cc-root');
    const isLand = isLandscapeMode();
    
    root.className = 'cc-root' + (isLand ? ' is-landscape' : '');

    if (isLand) {
      root.innerHTML = `
        <div class="cc-screen cc-select-landscape">
          <div class="cc-select-hero">
            <h2 class="cc-select-title">어떤 야옹이를<br>돌볼까?</h2>
            <p class="cc-select-sub">눈이와 름이가<br>시현이를 기다려요</p>
          </div>
          <div class="cc-select-row" id="cc-select-row"></div>
        </div>
      `;
    } else {
      root.innerHTML = `
        <div class="cc-screen cc-select-portrait">
          <div class="cc-select-hero">
            <h2 class="cc-select-title">어떤 야옹이를<br>돌볼까?</h2>
            <p class="cc-select-sub">눈이와 름이가<br>시현이를 기다려요</p>
          </div>
          <div class="cc-select-row" id="cc-select-row"></div>
        </div>
      `;
    }

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

      card.addEventListener('click', () => {
        if (!state.destroyed && state.currentScreen === 'select' && state.turnId === selectionTurn) startCare(cat);
      });
      row.appendChild(card);
    });

    // 최초 진입 렌더링에서만 인트로 음성 재생
    if (!renderOpts.silent && !state.selectIntroPlayed) {
      playVoiceId('games.cat.intro');
      state.selectIntroPlayed = true;
    }
  }

  function activeNeed() { return NEEDS[state.needIndex % NEEDS.length]; }

  function stopSpeech() {
    try { window.SihyeonVoice?.stop?.(); } catch (error) {}
    try { window.speechSynthesis?.cancel?.(); } catch (error) {}
  }

  function say(ko, en) {
    if (state.destroyed || document.hidden) return;
    const text = window.SihyeonPlaySettings?.getLanguage?.() === 'en' ? en : ko;
    if (!text) return;
    stopSpeech();
    try {
      const result = typeof state.options.say === 'function'
        ? state.options.say(text) : window.SihyeonVoice?.speak?.(text);
      result?.catch?.(() => {});
    } catch (error) {}
  }

  function describeNeed() {
    const need = activeNeed();
    say(state.feedback || `${need.title}. ${need.clue}`,
      state.feedbackEn || `${need.en[0]}. ${need.en[1]}`);
  }

  function handleVisibility() {
    if (document.hidden) stopSpeech();
  }

  function changeCat() {
    clearTimers(); stopSpeech(); state.turnId += 1;
    state.currentCat = null;
    state.completed = null;
    state.activeStep = 'default';
    state.feedback = ''; state.feedbackEn = '';
    state.careIntroPlayed = false;
    renderSelect({ silent: true });
  }

  function renderCare(renderOpts = {}) {
    if (state.destroyed || !state.container || !state.currentCat) return;
    state.currentScreen = 'care';
    const cat = state.currentCat;
    const need = activeNeed();
    const root = state.container.querySelector('.cc-root');
    const isLand = isLandscapeMode();
    const turnId = state.turnId;
    root.className = 'cc-root' + (isLand ? ' is-landscape' : '');
    root.innerHTML = `
      <section class="cc-screen cc-care-v2${isLand ? ' is-landscape' : ''}" data-cat-need="${need.id}" data-cat-resolved="${state.resolved}">
        <header class="cc-care-header">
          <h2 class="cc-care-name">${cat.emoji} ${cat.name}</h2>
          <button class="cc-care-control" data-cat-listen type="button" aria-label="고양이 마음 다시 듣기">🔊</button>
          <button class="cc-care-control" id="cc-change-cat" type="button">고양이 선택</button>
        </header>
        <div class="cc-observe-scene">
          <img id="cc-main-img" src="${!state.resolved && need.id !== 'hungry' ? cat.selectImg : cat.steps[state.activeStep] || cat.steps.default}" alt="${cat.name} ${state.resolved ? '돌봄 뒤 모습' : '모습'}"
            onerror="this.style.display='none';this.nextElementSibling.style.display='grid';">
          <div id="cc-main-fallback" class="cc-main-fallback">${cat.emoji}</div>
          <div class="cc-need-cue" aria-hidden="true">${state.resolved ? (need.id === 'sleepy' ? '💤' : '💚') : need.cue}</div>
          ${state.resolved ? '' : `<p class="cc-cat-request" data-cat-request>${need.request}</p>`}
        </div>
        <div class="cc-care-story" role="status" aria-live="polite">
          <h3 class="cc-need-title">${state.resolved ? '마음을 알아줬어요' : need.title}</h3>
          <p class="cc-care-copy" data-cat-feedback>${state.feedback || need.clue}</p>
        </div>
        <div class="cc-care-actions" id="cc-action-bar"></div>
        <div class="cc-care-footer">
          <button class="cc-care-control cc-care-next" data-cat-next type="button" ${state.resolved ? '' : 'disabled'}>${state.completed.size >= NEEDS.length ? '다시 살펴보기' : '다음 모습 ▶'}</button>
          <button class="cc-care-control" data-cat-finish type="button">오늘은 여기까지</button>
        </div>
      </section>`;
    root.querySelector('#cc-change-cat').onclick = () => {
      if (!state.destroyed && state.turnId === turnId) changeCat();
    };
    root.querySelector('[data-cat-listen]').onclick = () => {
      if (!state.destroyed && state.turnId === turnId) describeNeed();
    };
    root.querySelector('[data-cat-next]').onclick = () => nextNeed(turnId);
    root.querySelector('[data-cat-finish]').onclick = () => {
      if (state.destroyed || state.turnId !== turnId) return;
      clearTimers(); stopSpeech(); state.turnId += 1; renderComplete();
    };
    renderActionBtns();
    if (!renderOpts.silent) describeNeed();
  }

  function renderActionBtns() {
    if (!state.container || !state.currentCat) return;
    const bar = state.container.querySelector('#cc-action-bar');
    if (!bar) return;
    bar.innerHTML = '';
    const turnId = state.turnId;
    ACTIONS.forEach(action => {
      const btn = document.createElement('button');
      btn.className = 'cc-btn' + (state.resolved && action.id === activeNeed().action ? ' done' : '');
      btn.type = 'button';
      btn.style.background = action.color;
      btn.innerHTML = `${action.emoji}<span class="cc-btn-label">${action.label}</span>`;
      btn.setAttribute('aria-label', action.label);
      btn.setAttribute('data-cat-action', action.id);
      btn.addEventListener('click', (e) => handleAction(action, e.clientX, e.clientY, turnId));
      bar.appendChild(btn);
    });
  }

  function renderComplete(renderOpts = {}) {
    if (state.destroyed || !state.container) return;
    state.currentScreen = 'complete';

    const cat = state.currentCat;
    const turnId = state.turnId;
    const root = state.container.querySelector('.cc-root');
    const isLand = isLandscapeMode();
    root.className = 'cc-root' + (isLand ? ' is-landscape' : '');
    const completeClass = 'cc-screen cc-complete' + (isLand ? ' is-landscape' : '');

    root.innerHTML = `
      <div class="${completeClass}">
        <div class="cc-complete-emoji">${cat.emoji}</div>
        <div class="cc-complete-title">${cat.name}와 함께했어요 💚</div>
        <div class="cc-complete-sub">${state.completed.size ? `${state.completed.size}가지 마음을 살펴봤어요.` : '곁에서 지켜보는 것도 좋은 돌봄이에요.'}</div>
        <div class="cc-complete-btns">
          <button class="cc-c-btn cc-c-btn-primary" id="cc-replay" type="button">다시 하기 🔄</button>
          <button class="cc-c-btn cc-c-btn-secondary" id="cc-to-land" type="button">즐거운놀이터로 👋</button>
        </div>
      </div>
    `;

    root.querySelector('#cc-replay').addEventListener('click', () => {
      if (state.destroyed || state.currentScreen !== 'complete' || state.turnId !== turnId) return;
      changeCat();
    });

    root.querySelector('#cc-to-land').addEventListener('click', () => {
      if (state.destroyed || state.currentScreen !== 'complete' || state.turnId !== turnId) return;
      if (typeof window.openGameLand === 'function') {
        window.openGameLand();
      } else {
        state.options.closeToParkHome?.();
      }
    });

    // 최초 게임 완료 렌더링에서만 보상 및 축하 효과 실행
    if (!renderOpts.silent) {
      say('고양이의 마음을 살펴봐 줘서 고마워요.', 'Thank you for noticing how the cat feels.');
      if (state.completed.size === NEEDS.length && !state.completedCats.has(cat.id)) {
        state.completedCats.add(cat.id);
        state.completeRewardGiven = true;
        try { state.options.fireConfetti?.(); } catch (error) {}
        try { state.options.gainExp?.(25); } catch (error) {}
      }
    }
  }

  function startCare(cat) {
    if (state.destroyed || !state.container) return;
    clearTimers(); stopSpeech(); state.turnId += 1;
    state.currentCat = cat;
    state.completed = new Set();
    state.needIndex = 0;
    state.resolved = false;
    state.feedback = ''; state.feedbackEn = '';
    state.activeStep = 'default';
    state.careIntroPlayed = false;
    renderCare();
  }

  function nextNeed(turnId = state.turnId) {
    if (state.destroyed || state.currentScreen !== 'care' || !state.resolved || state.turnId !== turnId) return;
    clearTimers(); stopSpeech(); state.turnId += 1;
    state.needIndex = (state.needIndex + 1) % NEEDS.length;
    state.resolved = false;
    state.feedback = ''; state.feedbackEn = '';
    state.activeStep = 'default';
    renderCare();
  }

  function handleAction(action, clientX, clientY, turnId = state.turnId) {
    if (state.destroyed || !state.currentCat || state.currentScreen !== 'care' || state.turnId !== turnId || !ACTIONS.includes(action)) return;
    const need = activeNeed();
    if (state.resolved) {
      state.feedback = need.result;
      state.feedbackEn = need.en[2];
    } else if (action.id === need.action) {
      state.resolved = true;
      state.completed.add(need.id);
      state.activeStep = action.id === 'wait' ? 'sleep' : action.id;
      state.feedback = need.result;
      state.feedbackEn = need.en[2];
      const rewardKey = `${state.currentCat.id}:${need.id}`;
      if (!state.rewarded.has(rewardKey)) {
        state.rewarded.add(rewardKey);
        try { state.options.gainExp?.(5); } catch (error) {}
        if (need.id !== 'sleepy' && need.id !== 'space') burst(clientX, clientY, action.particle, 8);
      }
    } else if (action.id === 'wait') {
      state.feedback = '서두르지 않아도 돼요. 모습을 조금 더 살펴봐요.';
      state.feedbackEn = 'There is no rush. Let us look a little longer.';
    } else {
      state.feedback = `지금은 ${need.title.replace(/요$/, '요')}. ${need.clue}`;
      state.feedbackEn = `${need.en[0]}. ${need.en[1]}`;
    }
    renderCare({ silent: true });
    describeNeed();
  }

  function handleResize() {
    if (state.destroyed) return;
    
    clearTimeout(state.resizeTimer);
    const token = state.timerToken;
    state.resizeTimer = setTimeout(() => {
      if (state.destroyed || token !== state.timerToken) return;
      // 재렌더링 시에는 보상 및 음성 재생을 하지 않도록 silent 옵션 전달
      if (state.currentScreen === 'select') renderSelect({ silent: true });
      else if (state.currentScreen === 'care') renderCare({ silent: true });
      else if (state.currentScreen === 'complete') renderComplete({ silent: true });
    }, 150);
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
    state.needIndex = 0; state.resolved = false;
    state.feedback = ''; state.feedbackEn = '';
    state.rewarded = new Set(); state.completedCats = new Set();
    state.turnId += 1;
    state.timers = [];
    state.currentScreen = 'select';
    // 게임 시작 시 모든 플래그 초기화
    state.selectIntroPlayed = false;
    state.careIntroPlayed = false;
    state.completeRewardGiven = false;

    container.innerHTML = `<div class="cc-root"></div>`;
    renderSelect();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    document.addEventListener?.('visibilitychange', handleVisibility);
  }

  function destroy() {
    state.destroyed = true;
    state.turnId += 1;
    clearTimers();
    stopSpeech();
    clearTimeout(state.resizeTimer);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
    document.removeEventListener?.('visibilitychange', handleVisibility);

    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }

    if (state.container) {
      state.container.innerHTML = '';
    }

    state.container = null;
    state.options = {};
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
})();
