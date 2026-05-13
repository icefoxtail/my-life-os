/* ═══════════════════════════════════════════
   SIHYEON PLAY OS — 꼬마 고양이 돌보기
   파일: js/games/cat-care.js
   버전: v1.5.0
   수정: resize 중복 보상/음성 버그 수정 및 상태 플래그 도입
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
    }
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
    completeRewardGiven: false
  };

  function isLandscapeMode() {
    return window.innerWidth > window.innerHeight && window.innerWidth >= 768;
  }

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

      .cc-root.is-landscape {
        background:
          radial-gradient(circle at 18% 18%, rgba(255,255,255,0.9) 0 10%, transparent 30%),
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

      .cc-select-portrait {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: clamp(18px, 5vh, 40px) 16px 20px;
        gap: clamp(14px, 3vh, 24px);
      }

      .cc-select-landscape {
        display: grid;
        grid-template-columns: 0.85fr 1.15fr;
        gap: 22px;
        padding: 22px;
        align-items: stretch;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-select-landscape {
          grid-template-columns: 0.7fr 1.3fr;
          gap: 12px;
          padding: 12px;
        }
      }

      .cc-select-hero {
        width: 100%;
        text-align: center;
        flex-shrink: 0;
      }

      .cc-select-landscape .cc-select-hero {
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

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-select-landscape .cc-select-hero {
          border-radius: 24px;
          padding: 14px;
        }
      }

      .cc-select-title {
        font-size: clamp(24px, 7vw, 38px);
        color: #333;
        margin: 0;
        text-align: center;
        font-weight: 900;
        line-height: 1.15;
      }

      .cc-select-landscape .cc-select-title {
        font-size: clamp(34px, 4vw, 54px);
        line-height: 1.16;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-select-landscape .cc-select-title {
          font-size: clamp(24px, 4vw, 34px);
        }
      }

      .cc-select-sub {
        margin: 10px 0 0;
        font-size: clamp(14px, 4vw, 20px);
        color: #776b61;
        font-weight: 800;
        line-height: 1.35;
      }

      .cc-select-landscape .cc-select-sub {
        font-size: clamp(19px, 2vw, 28px);
        margin-top: 16px;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-select-landscape .cc-select-sub {
          font-size: 15px;
        }
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

      .cc-select-landscape .cc-select-row {
        height: 100%;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px;
        align-items: stretch;
        justify-content: stretch;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-select-landscape .cc-select-row {
          gap: 12px;
        }
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

      .cc-select-landscape .cc-cat-card {
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

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-select-landscape .cc-cat-card {
          padding: 10px;
          border-radius: 24px;
        }
      }

      .cc-cat-card:active {
        transform: scale(0.92);
        box-shadow: 0 4px 10px rgba(0,0,0,0.12);
      }

      .cc-select-landscape .cc-cat-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 18px 34px rgba(0,0,0,0.13);
      }

      .cc-cat-img-wrap {
        position: relative;
        width: 100%;
        padding-top: 100%;
        border-radius: 26px;
        overflow: hidden;
        background: #f5f5f5;
      }

      .cc-select-landscape .cc-cat-img-wrap {
        border-radius: 30px;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-select-landscape .cc-cat-img-wrap {
          border-radius: 18px;
        }
      }

      .cc-cat-img-wrap img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 26px;
      }

      .cc-select-landscape .cc-cat-img-wrap img {
        border-radius: 30px;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-select-landscape .cc-cat-img-wrap img {
          border-radius: 18px;
        }
      }

      .cc-cat-img-fallback {
        position: absolute;
        inset: 0;
        display: none;
        place-items: center;
        font-size: clamp(56px, 16vw, 92px);
        background: linear-gradient(135deg, #ffe0f0, #fff9c4);
        border-radius: 26px;
      }

      .cc-select-landscape .cc-cat-img-fallback {
        border-radius: 30px;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-select-landscape .cc-cat-img-fallback {
          border-radius: 18px;
        }
      }

      .cc-cat-name {
        font-size: clamp(19px, 5vw, 27px);
        color: #444;
        margin-top: 10px;
        font-weight: 900;
      }

      .cc-select-landscape .cc-cat-name {
        font-size: clamp(28px, 3vw, 40px);
        margin-top: 14px;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-select-landscape .cc-cat-name {
          font-size: 20px;
          margin-top: 6px;
        }
      }

      .cc-care-portrait {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .cc-care-landscape {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: grid;
        grid-template-columns: 230px minmax(0, 1fr) 230px;
        grid-template-rows: minmax(0, 1fr);
        gap: 16px;
        padding: 16px;
        overflow: hidden;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-care-landscape {
          grid-template-columns: 170px minmax(0, 1fr) 170px;
          gap: 8px;
          padding: 8px;
        }
      }

      .cc-left-panel {
        display: flex;
        min-height: 0;
        height: 100%;
        flex-direction: column;
        gap: 14px;
        overflow: hidden;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-left-panel {
          gap: 8px;
        }
      }

      .cc-info-card,
      .cc-mini-actions,
      .cc-action-panel-landscape {
        background: rgba(255,255,255,0.86);
        border: 5px solid #fff;
        border-radius: 32px;
        box-shadow: 0 16px 34px rgba(0,0,0,0.10);
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-info-card,
        .cc-mini-actions,
        .cc-action-panel-landscape {
          border-radius: 20px;
          border: 4px solid #fff;
          box-shadow: 0 10px 22px rgba(0,0,0,0.10);
        }
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

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-info-card {
          padding: 10px;
        }
      }

      .cc-info-emoji {
        font-size: clamp(60px, 7vw, 96px);
        line-height: 1;
        margin-bottom: 10px;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-info-emoji {
          font-size: 46px;
        }
      }

      .cc-info-name {
        font-size: clamp(28px, 3vw, 42px);
        font-weight: 900;
        color: #333;
        line-height: 1.1;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-info-name {
          font-size: 23px;
        }
      }

      .cc-info-sub {
        margin-top: 10px;
        font-size: clamp(16px, 1.6vw, 22px);
        font-weight: 800;
        color: #776b61;
        line-height: 1.35;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-info-sub {
          font-size: 13px;
          margin-top: 5px;
        }
      }

      .cc-mini-actions {
        flex: 0 0 auto;
        padding: 12px;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-mini-actions {
          padding: 8px;
        }
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

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-small-btn {
          min-height: 40px;
          border-radius: 14px;
          font-size: 14px;
          box-shadow: 0 4px 0 rgba(0,0,0,0.12);
        }
      }

      .cc-small-btn:active {
        transform: translateY(4px);
        box-shadow: 0 2px 0 rgba(0,0,0,0.12);
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
        padding: clamp(10px, 2vh, 18px) 16px 0;
      }

      .cc-care-landscape .cc-main-display {
        min-width: 0;
        height: 100%;
        padding: 0;
      }

      .cc-main-wrap {
        position: relative;
        flex-shrink: 0;
      }

      .cc-care-portrait .cc-main-wrap {
        width: clamp(230px, 74vw, 430px);
        aspect-ratio: 1 / 1;
      }

      .cc-care-landscape .cc-main-wrap {
        width: min(100%, calc(100vh - 68px));
        height: min(100%, calc(100vh - 68px));
        max-width: 100%;
        max-height: 100%;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-care-landscape .cc-main-wrap {
          width: min(100%, calc(100vh - 24px));
          height: min(100%, calc(100vh - 24px));
        }
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

      .cc-care-landscape .cc-main-img {
        border-radius: 54px;
        border: 12px solid #fff;
        box-shadow: 0 24px 54px rgba(0,0,0,0.16);
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-care-landscape .cc-main-img {
          border-radius: 28px;
          border-width: 6px;
        }
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

      .cc-care-landscape .cc-main-fallback {
        font-size: clamp(86px, 25vw, 160px);
        border-radius: 54px;
        border: 12px solid #fff;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-care-landscape .cc-main-fallback {
          border-radius: 28px;
          border-width: 6px;
        }
      }

      @keyframes ccFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-14px); }
      }

      .cc-action-panel-portrait {
        flex: 0 0 auto;
        width: 100%;
        padding: 10px 14px max(22px, env(safe-area-inset-bottom));
      }

      .cc-action-panel-landscape {
        min-height: 0;
        height: 100%;
        padding: 16px;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        overflow-x: hidden;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-action-panel-landscape {
          padding: 8px;
        }
      }

      .cc-action-panel-landscape .cc-panel-title {
        display: block;
        flex: 0 0 auto;
        font-size: clamp(22px, 2.2vw, 30px);
        font-weight: 900;
        color: #333;
        text-align: center;
        margin-bottom: 14px;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-action-panel-landscape .cc-panel-title {
          font-size: 16px;
          margin-bottom: 8px;
        }
      }

      .cc-action-bar-portrait {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: clamp(10px, 3.5vw, 22px);
      }

      .cc-action-bar-landscape {
        flex: 1 1 auto;
        min-height: 0;
        display: grid;
        grid-template-columns: 1fr;
        grid-auto-rows: minmax(96px, 1fr);
        gap: 14px;
        align-items: stretch;
        justify-content: stretch;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-action-bar-landscape {
          grid-auto-rows: minmax(54px, 1fr);
          gap: 8px;
        }
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
        width: clamp(82px, 27vw, 122px);
        height: clamp(82px, 27vw, 122px);
        border-radius: 50%;
        border: 6px solid #fff;
        box-shadow: 0 10px 0 rgba(0,0,0,0.12), 0 14px 20px rgba(0,0,0,0.10);
        font-size: clamp(31px, 9vw, 50px);
      }

      .cc-action-bar-landscape .cc-btn {
        width: 100%;
        height: 100%;
        min-height: 96px;
        border-radius: 28px;
        border: 6px solid #fff;
        box-shadow: 0 10px 0 rgba(0,0,0,0.12), 0 14px 20px rgba(0,0,0,0.10);
        font-size: clamp(38px, 4.5vw, 62px);
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-action-bar-landscape .cc-btn {
          min-height: 54px;
          border-radius: 18px;
          border-width: 4px;
          font-size: 28px;
        }
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
        position: absolute;
        bottom: -28px;
        left: 50%;
        transform: translateX(-50%);
        font-size: clamp(11px, 3.2vw, 15px);
      }

      .cc-action-bar-landscape .cc-btn-label {
        position: static;
        transform: none;
        font-size: clamp(17px, 1.65vw, 23px);
        color: rgba(40,40,40,0.82);
        margin-top: 2px;
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .cc-action-bar-landscape .cc-btn-label {
          font-size: 12px;
        }
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

      .cc-action-bar-landscape .cc-btn.done::after {
        top: 8px;
        right: 10px;
        font-size: 28px;
      }

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

  function renderSelect(renderOpts = {}) {
    if (state.destroyed || !state.container) return;
    state.currentScreen = 'select';
    
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

      card.addEventListener('click', () => startCare(cat));
      row.appendChild(card);
    });

    // 최초 진입 렌더링에서만 인트로 음성 재생
    if (!renderOpts.silent && !state.selectIntroPlayed) {
      playVoiceId('games.cat.intro');
      state.selectIntroPlayed = true;
    }
  }

  function renderCare(renderOpts = {}) {
    if (state.destroyed || !state.container) return;
    state.currentScreen = 'care';

    const cat = state.currentCat;
    const root = state.container.querySelector('.cc-root');
    const isLand = isLandscapeMode();
    
    root.className = 'cc-root' + (isLand ? ' is-landscape' : '');

    if (isLand) {
      root.innerHTML = `
        <div class="cc-screen cc-care-landscape">
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
                src="${cat.steps[state.activeStep]}" alt="${cat.name}"
                onerror="this.style.display='none';document.getElementById('cc-main-fallback').style.display='grid';">
              <div id="cc-main-fallback" class="cc-main-fallback">${cat.emoji}</div>
            </div>
          </main>
          <aside class="cc-action-panel-landscape">
            <div class="cc-panel-title">${cat.name} 돌보기</div>
            <div class="cc-action-bar-landscape" id="cc-action-bar"></div>
          </aside>
        </div>
      `;
    } else {
      root.innerHTML = `
        <div class="cc-screen cc-care-portrait">
          <main class="cc-main-display">
            <div class="cc-main-wrap">
              <img id="cc-main-img" class="cc-main-img"
                src="${cat.steps[state.activeStep]}" alt="${cat.name}"
                onerror="this.style.display='none';document.getElementById('cc-main-fallback').style.display='grid';">
              <div id="cc-main-fallback" class="cc-main-fallback">${cat.emoji}</div>
            </div>
          </main>
          <aside class="cc-action-panel-portrait">
            <div class="cc-action-bar-portrait" id="cc-action-bar"></div>
          </aside>
        </div>
      `;
    }

    const changeBtn = root.querySelector('#cc-change-cat');
    if (changeBtn) {
      changeBtn.addEventListener('click', () => {
        state.currentCat = null;
        state.completed = null;
        state.activeStep = 'default';
        state.careIntroPlayed = false; // 고양이 변경 시 인사 다시 재생 가능하도록 초기화
        renderSelect();
      });
    }

    renderActionBtns();
    
    // 최초 고양이 선택 진입 렌더링에서만 인사 음성 재생
    if (!renderOpts.silent && !state.careIntroPlayed) {
      playVoiceId(cat.introVoiceId);
      state.careIntroPlayed = true;
    }
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

  function renderComplete(renderOpts = {}) {
    if (state.destroyed || !state.container) return;
    state.currentScreen = 'complete';

    const cat = state.currentCat;
    const root = state.container.querySelector('.cc-root');
    const isLand = isLandscapeMode();
    
    root.className = 'cc-root' + (isLand ? ' is-landscape' : '');
    const completeClass = 'cc-screen cc-complete' + (isLand ? ' is-landscape' : '');

    root.innerHTML = `
      <div class="${completeClass}">
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
      // 모든 진행 플래그 초기화
      state.selectIntroPlayed = false;
      state.careIntroPlayed = false;
      state.completeRewardGiven = false;
      renderSelect();
    });

    root.querySelector('#cc-to-land').addEventListener('click', () => {
      if (typeof window.openGameLand === 'function') {
        window.openGameLand();
      } else {
        state.options.closeToParkHome?.();
      }
    });

    // 최초 게임 완료 렌더링에서만 보상 및 축하 효과 실행
    if (!renderOpts.silent && !state.completeRewardGiven) {
      playVoiceId(cat.completeVoiceId);
      state.options.fireConfetti?.();
      state.options.gainExp?.(25);
      state.completeRewardGiven = true; // 지급 완료 표시
    }
  }

  function startCare(cat) {
    state.currentCat = cat;
    state.completed = new Set();
    state.activeStep = 'default';
    state.careIntroPlayed = false; // 선택 직후 인사가 나오도록 보장
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

  function handleResize() {
    if (state.destroyed) return;
    
    clearTimeout(state.resizeTimer);
    state.resizeTimer = setTimeout(() => {
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
    state.timers = [];
    state.currentScreen = 'select';
    // 게임 시작 시 모든 플래그 초기화
    state.selectIntroPlayed = false;
    state.careIntroPlayed = false;
    state.completeRewardGiven = false;

    container.innerHTML = `<div class="cc-root"></div>`;
    renderSelect();

    window.addEventListener('resize', handleResize);
  }

  function destroy() {
    state.destroyed = true;
    clearTimers();
    clearTimeout(state.resizeTimer);
    window.removeEventListener('resize', handleResize);

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