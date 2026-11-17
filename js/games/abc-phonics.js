/* ═══════════════════════════════════════════
   SIHYEON PLAY OS - LETTER TRANSFORM
   파일: js/games/abc-phonics.js
   설명: ABC 변신 + 한글 변신 통합 탭형 게임
═══════════════════════════════════════════ */

(function () {
  const GAME_KEY = 'abcPhonics';
  const ALIAS_KEY = 'letterTransform';
  const STYLE_ID = 'sihyeon-letter-transform-style';

  const DATASETS = {
    abc: {
      key: 'abc',
      label: 'ABC',
      title: 'ABC 변신',
      intro: '에이, 비, 씨가 장난감으로 변신해요!',
      completeTitle: 'ABC 변신 완료!',
      completeVoice: '우와. 에이, 비, 씨를 모두 만났어요.',
      completeExp: 20,
      bg: ['#FFF7D6', '#E8F7FF'],
      items: [
        {
          letter: 'A',
          letterName: 'A',
          word: 'Apple',
          wordVoice: 'Apple!',
          displayWord: 'Apple',
          color: '#FF3B3B',
          fallbackLetter: 'A',
          fallbackObject: '🍎',
          letterImg: './assets/abc-phonics/tiles/a.png',
          objectImg: './assets/abc-phonics/tiles/apple.png'
        },
        {
          letter: 'B',
          letterName: 'B',
          word: 'Ball',
          wordVoice: 'Ball!',
          displayWord: 'Ball',
          color: '#1E90FF',
          fallbackLetter: 'B',
          fallbackObject: '🏀',
          letterImg: './assets/abc-phonics/tiles/b.png',
          objectImg: './assets/abc-phonics/tiles/ball.png'
        },
        {
          letter: 'C',
          letterName: 'C',
          word: 'Car',
          wordVoice: 'Car!',
          displayWord: 'Car',
          color: '#FFC107',
          fallbackLetter: 'C',
          fallbackObject: '🚗',
          letterImg: './assets/abc-phonics/tiles/c.png',
          objectImg: './assets/abc-phonics/tiles/car.png'
        }
      ]
    },

    hangul: {
      key: 'hangul',
      label: '한글',
      title: '한글 변신',
      intro: '한글 친구들이 그림으로 변신해요!',
      completeTitle: '한글 변신 완료!',
      completeVoice: '우와. 한글 친구들을 모두 만났어요.',
      completeExp: 30,
      bg: ['#FFE6F3', '#FFF7C9'],
      items: [
        {
          letter: 'ㄱ',
          letterName: '기역',
          word: '가방',
          wordVoice: '가, 가, 가방!',
          displayWord: '가방',
          color: '#FF4D4D',
          fallbackLetter: 'ㄱ',
          fallbackObject: '🎒',
          letterImg: '',
          objectImg: ''
        },
        {
          letter: 'ㄴ',
          letterName: '니은',
          word: '나비',
          wordVoice: '나, 나, 나비!',
          displayWord: '나비',
          color: '#FF9F1C',
          fallbackLetter: 'ㄴ',
          fallbackObject: '🦋',
          letterImg: '',
          objectImg: ''
        },
        {
          letter: 'ㄷ',
          letterName: '디귿',
          word: '도토리',
          wordVoice: '도, 도, 도토리!',
          displayWord: '도토리',
          color: '#8B5CF6',
          fallbackLetter: 'ㄷ',
          fallbackObject: '',
          letterImg: '',
          objectImg: ''
        },
        {
          letter: 'ㄹ',
          letterName: '리을',
          word: '로봇',
          wordVoice: '로, 로, 로봇!',
          displayWord: '로봇',
          color: '#00AEEF',
          fallbackLetter: 'ㄹ',
          fallbackObject: '🤖',
          letterImg: '',
          objectImg: ''
        },
        {
          letter: 'ㅁ',
          letterName: '미음',
          word: '모자',
          wordVoice: '모, 모, 모자!',
          displayWord: '모자',
          color: '#2EC4B6',
          fallbackLetter: 'ㅁ',
          fallbackObject: '🧢',
          letterImg: '',
          objectImg: ''
        },
        {
          letter: 'ㅂ',
          letterName: '비읍',
          word: '바나나',
          wordVoice: '바, 바, 바나나!',
          displayWord: '바나나',
          color: '#FFD93D',
          fallbackLetter: 'ㅂ',
          fallbackObject: '🍌',
          letterImg: '',
          objectImg: ''
        },
        {
          letter: 'ㅅ',
          letterName: '시옷',
          word: '사자',
          wordVoice: '사, 사, 사자!',
          displayWord: '사자',
          color: '#FF7A1A',
          fallbackLetter: 'ㅅ',
          fallbackObject: '🦁',
          letterImg: '',
          objectImg: ''
        },
        {
          letter: 'ㅇ',
          letterName: '이응',
          word: '오리',
          wordVoice: '오, 오, 오리!',
          displayWord: '오리',
          color: '#5BC8F5',
          fallbackLetter: 'ㅇ',
          fallbackObject: '🦆',
          letterImg: '',
          objectImg: ''
        },
        {
          letter: 'ㅈ',
          letterName: '지읒',
          word: '자동차',
          wordVoice: '자, 자, 자동차!',
          displayWord: '자동차',
          color: '#3478F6',
          fallbackLetter: 'ㅈ',
          fallbackObject: '🚗',
          letterImg: '',
          objectImg: ''
        }
      ]
    }
  };

  const state = {
    container: null,
    options: {},
    mode: 'abc',
    currentIndex: 0,
    isTransforming: false,
    phase: 'LETTER',
    destroyed: false,
    timers: [],
    layoutMode: 'portrait',
    resizeTimer: null,
    handleResizeBound: null,
    successRewardGiven: false,
    completeRewardGiven: false,
    sound: true,
    voiceEpoch: 0,
    matchAnswered: false,
    introTimer: null
  };

  function isLandscapeMode() {
    const width = window.innerWidth || document.documentElement.clientWidth || 0;
    const height = window.innerHeight || document.documentElement.clientHeight || 0;
    return width > height && width >= 540;
  }

  function getLayoutMode() {
    return isLandscapeMode() ? 'landscape' : 'portrait';
  }

  function getRootClass() {
    state.layoutMode = getLayoutMode();
    return `lt-root abc-phonics-root abc-phonics-${state.layoutMode}`;
  }

  function updateRootLayoutClass() {
    const root = state.container?.querySelector('.lt-root');
    if (!root) return;
    const nextMode = getLayoutMode();
    root.classList.remove('abc-phonics-portrait', 'abc-phonics-landscape');
    root.classList.add(`abc-phonics-${nextMode}`);
    state.layoutMode = nextMode;
  }

  function bindLayoutEvents() {
    if (state.handleResizeBound) return;
    state.handleResizeBound = handleResize;
    window.addEventListener('resize', state.handleResizeBound, { passive: true });
    window.addEventListener('orientationchange', state.handleResizeBound, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
  }

  function unbindLayoutEvents() {
    if (!state.handleResizeBound) return;
    window.removeEventListener('resize', state.handleResizeBound);
    window.removeEventListener('orientationchange', state.handleResizeBound);
    document.removeEventListener('visibilitychange', handleVisibility);
    state.handleResizeBound = null;
  }

  function handleVisibility() {
    if (document.hidden) { cancelIntro(); stopVoice(); }
  }

  function cancelIntro() {
    if (state.introTimer == null) return;
    clearTimeout(state.introTimer);
    state.timers = state.timers.filter(id => id !== state.introTimer);
    state.introTimer = null;
  }

  function scheduleIntro(fn, ms) {
    cancelIntro();
    state.introTimer = timer(() => {
      state.introTimer = null;
      if (!document.hidden && state.phase === 'LETTER') fn();
    }, ms);
  }

  function handleResize() {
    if (state.destroyed || !state.container) return;
    if (state.resizeTimer) window.clearTimeout(state.resizeTimer);
    state.resizeTimer = window.setTimeout(() => {
      state.resizeTimer = null;
      if (state.destroyed || !state.container) return;
      updateRootLayoutClass();
    }, 120);
  }

  function timer(fn, ms) {
    const id = setTimeout(() => {
      state.timers = state.timers.filter((timerId) => timerId !== id);
      if (!state.destroyed) fn();
    }, ms);
    state.timers.push(id);
    return id;
  }

  function clearTimers() {
    state.timers.forEach((id) => clearTimeout(id));
    state.timers = [];
    state.introTimer = null;
    if (state.resizeTimer) {
      window.clearTimeout(state.resizeTimer);
      state.resizeTimer = null;
    }
  }

  function getDataset() {
    return DATASETS[state.mode] || DATASETS.abc;
  }

  function getItems() {
    return getDataset().items || [];
  }

  function getCurrentItem() {
    return getItems()[state.currentIndex] || getItems()[0];
  }

  function injectStyle() {
    const prev = document.getElementById(STYLE_ID);
    if (prev) prev.remove();

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .lt-root {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        font-family: 'Jua', 'Apple SD Gothic Neo', system-ui, sans-serif;
        color: #24324a;
        background: linear-gradient(180deg, #fff7d6 0%, #e8f7ff 100%);
        user-select: none;
        touch-action: manipulation;
        isolation: isolate;
        transition: background 0.45s ease, opacity 0.28s ease;
      }

      .abc-phonics-root {
        box-sizing: border-box;
      }

      .abc-phonics-root * {
        box-sizing: border-box;
      }

      .lt-root::before {
        content: "";
        position: absolute;
        inset: -40px;
        z-index: 0;
        pointer-events: none;
        background:
          radial-gradient(circle at 18% 18%, rgba(255,255,255,.65) 0 8%, transparent 9%),
          radial-gradient(circle at 82% 22%, rgba(255,217,61,.28) 0 9%, transparent 10%),
          radial-gradient(circle at 15% 80%, rgba(255,122,26,.16) 0 10%, transparent 11%),
          radial-gradient(circle at 86% 78%, rgba(91,200,245,.22) 0 11%, transparent 12%);
        animation: ltBgFloat 8s ease-in-out infinite alternate;
      }

      @keyframes ltBgFloat {
        from { transform: translate3d(-8px, 4px, 0) scale(1); }
        to   { transform: translate3d(10px, -8px, 0) scale(1.02); }
      }

      .lt-top {
        position: relative;
        z-index: 10;
        flex-shrink: 0;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 10px;
        padding: max(10px, env(safe-area-inset-top)) 12px 8px;
      }

      .lt-mode-tabs {
        display: inline-grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 7px;
        min-width: 178px;
        padding: 5px;
        border-radius: 999px;
        background: rgba(255,255,255,.62);
        border: 3px solid rgba(255,255,255,.9);
        box-shadow: 0 5px 0 rgba(0,0,0,.11);
      }

      .lt-mode-tab {
        min-height: 40px;
        padding: 0 13px;
        border-radius: 999px;
        border: 0;
        background: transparent;
        color: #24324a;
        font: inherit;
        font-size: clamp(15px, 3.8vw, 18px);
        font-weight: 900;
        cursor: pointer;
        touch-action: manipulation;
      }

      .lt-mode-tab.active {
        background: linear-gradient(180deg, #ffffff 0%, #ffe577 100%);
        box-shadow: 0 4px 0 rgba(200,140,0,.2), inset 0 2px 0 rgba(255,255,255,.7);
      }

      .lt-progress {
        justify-self: center;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: clamp(5px, 1.8vw, 9px);
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
      }

      .lt-dot {
        width: clamp(11px, 3vw, 18px);
        height: clamp(11px, 3vw, 18px);
        flex: 0 0 auto;
        border-radius: 999px;
        background: rgba(255,255,255,.66);
        border: 3px solid rgba(255,255,255,.95);
        box-shadow: 0 3px 0 rgba(0,0,0,.11);
        transition: transform .25s ease, background .25s ease, box-shadow .25s ease;
      }

      .lt-dot.done {
        background: linear-gradient(180deg, #a9ff8b 0%, #25c85c 100%);
      }

      .lt-dot.active {
        transform: scale(1.22);
        background: var(--lt-color, #ff7a1a);
        box-shadow: 0 0 0 5px rgba(255,122,26,.18), 0 3px 0 rgba(0,0,0,.11);
      }

      .lt-home-btn {
        justify-self: end;
        min-width: 50px;
        min-height: 50px;
        border-radius: 999px;
        background: rgba(255,255,255,.9);
        border: 4px solid #fff;
        box-shadow: 0 6px 0 rgba(0,0,0,.14);
        font-size: 25px;
        cursor: pointer;
        touch-action: manipulation;
      }

      .lt-home-btn:active,
      .lt-mode-tab:active,
      .lt-main-card:active,
      .lt-btn:active {
        transform: translateY(4px);
        box-shadow: 0 2px 0 rgba(0,0,0,.14);
      }

      .lt-title-wrap {
        position: relative;
        z-index: 8;
        flex-shrink: 0;
        text-align: center;
        padding: 0 14px 8px;
      }

      .lt-title {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 6px 18px;
        border-radius: 999px;
        background: rgba(255,255,255,.84);
        border: 4px solid rgba(255,255,255,.95);
        box-shadow: 0 6px 0 rgba(0,0,0,.11);
        font-size: clamp(20px, 5vw, 30px);
        font-weight: 900;
        line-height: 1.1;
      }

      .lt-stage {
        position: relative;
        z-index: 5;
        flex: 1;
        min-height: 0;
        display: grid;
        place-items: center;
        padding: 4px 14px 10px;
      }

      .lt-stage-inner {
        position: relative;
        width: min(94vw, 560px);
        height: 100%;
        min-height: 0;
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        align-items: center;
        justify-items: center;
        gap: 8px;
      }

      .lt-main-card {
        position: relative;
        width: min(86vw, 420px);
        height: min(53dvh, 430px);
        min-height: 300px;
        border-radius: 36px;
        border: 7px solid rgba(255,255,255,.96);
        background:
          radial-gradient(circle at 50% 20%, rgba(255,255,255,.75), transparent 42%),
          linear-gradient(180deg, rgba(255,255,255,.94) 0%, rgba(255,246,199,.92) 100%);
        box-shadow:
          0 15px 0 rgba(0,0,0,.14),
          0 24px 42px rgba(0,0,0,.16),
          inset 0 4px 0 rgba(255,255,255,.75);
        display: grid;
        place-items: center;
        overflow: hidden;
        cursor: pointer;
        touch-action: manipulation;
        transition: transform .15s ease, box-shadow .15s ease;
      }

      .lt-main-card::before {
        content: "";
        position: absolute;
        inset: 16px;
        border-radius: 26px;
        border: 4px dashed rgba(255,255,255,.75);
        pointer-events: none;
      }

      .lt-main-card::after {
        content: "";
        position: absolute;
        left: -20%;
        top: -20%;
        width: 70%;
        height: 70%;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,.58), transparent 68%);
        pointer-events: none;
      }

      .lt-image-wrap {
        position: relative;
        z-index: 4;
        width: 86%;
        height: 82%;
        display: grid;
        place-items: center;
        animation: ltFloat 3s ease-in-out infinite;
      }

      @keyframes ltFloat {
        0%,100% { transform: translateY(0) rotate(-1deg); }
        50%     { transform: translateY(-12px) rotate(1deg); }
      }

      .lt-display-img {
        display: block;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 16px 0 rgba(0,0,0,.12)) drop-shadow(0 22px 22px rgba(0,0,0,.12));
        transition: transform .35s cubic-bezier(.2,1.35,.35,1), opacity .25s ease;
      }

      .lt-fallback-letter,
      .lt-fallback-object {
        width: min(64vw, 300px);
        height: min(64vw, 300px);
        max-height: 78%;
        border-radius: 40px;
        display: none;
        place-items: center;
        font-weight: 900;
        line-height: 1;
        color: #fff;
        background:
          radial-gradient(circle at 30% 22%, rgba(255,255,255,.45), transparent 28%),
          linear-gradient(145deg, var(--lt-color, #ff7a1a) 0%, rgba(0,0,0,.14) 130%);
        box-shadow: inset 0 5px 0 rgba(255,255,255,.4), 0 14px 0 rgba(0,0,0,.12);
        text-shadow: 0 5px 0 rgba(0,0,0,.18);
      }

      .lt-fallback-letter {
        font-size: clamp(130px, 36vw, 230px);
      }

      .lt-fallback-object {
        font-size: clamp(120px, 34vw, 210px);
        background: linear-gradient(180deg, #fff 0%, #fff3bd 100%);
        color: #24324a;
      }

      .lt-image-missing .lt-display-img {
        display: none;
      }

      .lt-image-missing .lt-fallback-letter,
      .lt-image-missing .lt-fallback-object {
        display: grid;
      }

      .lt-transformed .lt-image-wrap {
        animation: ltTransformPop .75s cubic-bezier(.2,1.45,.32,1) both;
      }

      @keyframes ltTransformPop {
        0%   { transform: scale(.35) rotate(-18deg); opacity: 0; }
        55%  { transform: scale(1.14) rotate(6deg); opacity: 1; }
        100% { transform: scale(1) rotate(0); opacity: 1; }
      }

      .lt-word-label {
        position: relative;
        z-index: 7;
        min-height: 58px;
        padding: 6px 22px;
        border-radius: 999px;
        background: rgba(255,255,255,.9);
        border: 4px solid #fff;
        box-shadow: 0 6px 0 rgba(0,0,0,.12);
        display: grid;
        place-items: center;
        opacity: 0;
        transform: translateY(16px);
        color: #24324a;
        font-size: clamp(34px, 10vw, 70px);
        font-weight: 900;
        line-height: 1;
        pointer-events: none;
      }

      .lt-word-label.show {
        animation: ltLabelIn .5s cubic-bezier(.2,1.35,.35,1) forwards;
      }

      @keyframes ltLabelIn {
        to { opacity: 1; transform: translateY(0); }
      }

      .lt-hint {
        position: relative;
        z-index: 10;
        min-height: 54px;
        padding: 8px 28px;
        border-radius: 999px;
        background: rgba(255,255,255,.88);
        border: 4px solid #fff;
        box-shadow: 0 6px 0 rgba(0,0,0,.12);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #24324a;
        font-size: clamp(20px, 5.6vw, 30px);
        font-weight: 900;
        opacity: 0;
        transform: translateY(12px);
        transition: opacity .25s ease, transform .25s ease;
        pointer-events: auto;
        cursor: pointer;
      }

      .lt-hint:disabled { cursor: default; }
      .lt-hint:focus-visible, .lt-main-card:focus-visible { outline: 4px solid #1473c9; outline-offset: 4px; }

      .lt-hint.visible {
        opacity: 1;
        transform: translateY(0);
        animation: ltHintPulse 1.1s ease-in-out infinite alternate;
      }

      @keyframes ltHintPulse {
        from { scale: 1; }
        to   { scale: 1.045; }
      }

      .lt-particle {
        position: absolute;
        z-index: 30;
        width: 18px;
        height: 18px;
        border-radius: 999px;
        background: var(--lt-color, #ff7a1a);
        pointer-events: none;
        animation: ltExplode .86s ease-out forwards;
      }

      @keyframes ltExplode {
        0%   { transform: translate(0,0) scale(1); opacity: 1; }
        100% { transform: translate(var(--tx), var(--ty)) scale(.05); opacity: 0; }
      }

      .lt-star {
        position: absolute;
        z-index: 32;
        pointer-events: none;
        font-size: clamp(22px, 6vw, 40px);
        animation: ltStarPop .92s ease-out forwards;
      }

      @keyframes ltStarPop {
        0%   { transform: translate(-50%,-50%) scale(.2) rotate(-20deg); opacity: 0; }
        40%  { opacity: 1; }
        100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.2) rotate(30deg); opacity: 0; }
      }

      .lt-complete-screen {
        position: relative;
        z-index: 10;
        flex: 1;
        min-height: 0;
        padding: 28px 18px max(22px, env(safe-area-inset-bottom));
        display: grid;
        place-items: center;
        text-align: center;
      }

      .lt-complete-box {
        width: min(92vw, 520px);
        border-radius: 34px;
        background: linear-gradient(180deg, rgba(255,255,255,.96) 0%, rgba(255,240,166,.96) 100%);
        border: 7px solid #fff;
        box-shadow: 0 14px 0 rgba(0,0,0,.16), 0 24px 46px rgba(0,0,0,.16);
        padding: 28px 18px 22px;
        display: grid;
        gap: 14px;
      }

      .lt-complete-emoji {
        font-size: clamp(78px, 22vw, 130px);
        animation: ltCompleteBounce .85s ease-in-out infinite alternate;
      }

      @keyframes ltCompleteBounce {
        from { transform: translateY(0) rotate(-2deg); }
        to   { transform: translateY(-10px) rotate(3deg); }
      }

      .lt-complete-title {
        font-size: clamp(30px, 8vw, 48px);
        font-weight: 900;
        color: #24324a;
        line-height: 1.12;
      }

      .lt-complete-sub {
        font-size: clamp(17px, 4.8vw, 24px);
        font-weight: 900;
        color: #795315;
      }

      .lt-complete-btns {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
        margin-top: 6px;
      }

      .lt-btn {
        min-height: 62px;
        border-radius: 22px;
        border: 0;
        font: inherit;
        font-size: clamp(17px, 4.5vw, 22px);
        font-weight: 900;
        cursor: pointer;
        touch-action: manipulation;
        box-shadow: 0 7px 0 rgba(0,0,0,.17);
        transition: transform .1s ease, box-shadow .1s ease;
      }

      .lt-btn-primary {
        background: #FF7A1A;
        color: #fff;
      }

      .lt-btn-secondary {
        background: #fff;
        color: #24324a;
        border: 4px solid #eee;
        box-shadow: 0 5px 0 #ddd;
      }

      .abc-phonics-landscape {
        display: grid;
        grid-template-columns: minmax(210px, 24vw) minmax(360px, 1fr) minmax(230px, 26vw);
        grid-template-rows: 1fr;
        gap: 12px;
        padding: max(10px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
      }

      .abc-phonics-landscape .lt-top {
        height: 100%;
        min-height: 0;
        grid-column: 1;
        grid-row: 1;
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr auto;
        align-items: stretch;
        gap: 14px;
        padding: 14px;
        border-radius: 32px;
        background: rgba(255,255,255,.42);
        border: 5px solid rgba(255,255,255,.72);
        box-shadow: inset 0 2px 0 rgba(255,255,255,.28), 0 14px 30px rgba(0,0,0,.14);
      }

      .abc-phonics-landscape .lt-mode-tabs {
        width: 100%;
        min-width: 0;
        grid-template-columns: 1fr;
        gap: 10px;
        padding: 7px;
        border-radius: 28px;
      }

      .abc-phonics-landscape .lt-mode-tab {
        min-height: 62px;
        font-size: clamp(20px, 2.4vw, 30px);
        border-radius: 22px;
      }

      .abc-phonics-landscape .lt-progress {
        width: 100%;
        min-height: 0;
        flex-direction: column;
        flex-wrap: wrap;
        align-content: center;
        justify-content: center;
        gap: 8px;
      }

      .abc-phonics-landscape .lt-dot {
        width: clamp(15px, 2vw, 22px);
        height: clamp(15px, 2vw, 22px);
      }

      .abc-phonics-landscape .lt-home-btn {
        justify-self: center;
        align-self: end;
        min-width: 68px;
        min-height: 68px;
        font-size: 31px;
      }

      .abc-phonics-landscape .lt-title-wrap {
        position: absolute;
        z-index: 12;
        left: calc(24vw + 34px);
        top: max(18px, env(safe-area-inset-top));
        padding: 0;
        pointer-events: none;
      }

      .abc-phonics-landscape .lt-title {
        min-height: 54px;
        font-size: clamp(24px, 3vw, 40px);
        box-shadow: 0 8px 0 rgba(0,0,0,.11);
      }

      .abc-phonics-landscape .lt-stage {
        grid-column: 2 / 4;
        grid-row: 1;
        width: 100%;
        height: 100%;
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(360px, 1fr) minmax(220px, 26vw);
        gap: 12px;
        padding: 76px 0 0;
      }

      .abc-phonics-landscape .lt-stage-inner {
        width: 100%;
        height: 100%;
        min-height: 0;
        grid-column: 1 / 3;
        display: grid;
        grid-template-columns: minmax(360px, 1fr) minmax(220px, 26vw);
        grid-template-rows: 1fr;
        gap: 12px;
        align-items: stretch;
        justify-items: stretch;
      }

      .abc-phonics-landscape .lt-main-card {
        grid-column: 1;
        align-self: stretch;
        justify-self: stretch;
        width: 100%;
        height: 100%;
        min-height: 0;
        border-radius: 42px;
      }

      .abc-phonics-landscape .lt-image-wrap {
        width: 88%;
        height: 88%;
      }

      .abc-phonics-landscape .lt-fallback-letter,
      .abc-phonics-landscape .lt-fallback-object {
        width: min(34vw, 360px);
        height: min(34vw, 360px);
      }

      .abc-phonics-landscape .lt-fallback-letter {
        font-size: clamp(150px, 22vw, 280px);
      }

      .abc-phonics-landscape .lt-fallback-object {
        font-size: clamp(138px, 20vw, 260px);
      }

      .abc-phonics-landscape .lt-word-label,
      .abc-phonics-landscape .lt-hint {
        grid-column: 2;
        width: 100%;
        align-self: center;
        justify-self: stretch;
      }

      .abc-phonics-landscape .lt-word-label {
        position: absolute;
        right: 0;
        top: 28%;
        width: min(25vw, 330px);
        min-height: 96px;
        font-size: clamp(44px, 6vw, 86px);
        border-radius: 32px;
      }

      .abc-phonics-landscape .lt-hint {
        position: absolute;
        right: 0;
        bottom: 8%;
        width: min(25vw, 330px);
        min-height: 88px;
        padding: 10px 18px;
        border-radius: 30px;
        font-size: clamp(24px, 3vw, 38px);
      }

      .abc-phonics-landscape .lt-complete-screen {
        grid-column: 1 / 4;
        grid-row: 1;
        padding: max(20px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
      }

      .abc-phonics-landscape .lt-complete-box {
        width: min(760px, 78vw);
        grid-template-columns: auto minmax(0, 1fr);
        grid-template-areas:
          "emoji title"
          "emoji sub"
          "buttons buttons";
        align-items: center;
        text-align: left;
        padding: 34px 30px 28px;
      }

      .abc-phonics-landscape .lt-complete-emoji {
        grid-area: emoji;
        font-size: clamp(100px, 13vw, 160px);
      }

      .abc-phonics-landscape .lt-complete-title {
        grid-area: title;
        font-size: clamp(38px, 5vw, 62px);
      }

      .abc-phonics-landscape .lt-complete-sub {
        grid-area: sub;
        font-size: clamp(22px, 2.8vw, 34px);
      }

      .abc-phonics-landscape .lt-complete-btns {
        grid-area: buttons;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      @media (max-width: 560px) {
        .lt-top {
          grid-template-columns: 1fr auto;
          grid-template-areas:
            "tabs home"
            "progress progress";
          padding-left: 9px;
          padding-right: 9px;
          gap: 7px;
        }

        .lt-mode-tabs { grid-area: tabs; width: 100%; min-width: 0; }
        .lt-home-btn { grid-area: home; }
        .lt-progress { grid-area: progress; width: 100%; }

        .lt-title-wrap { padding-bottom: 6px; }

        .lt-main-card {
          width: min(92vw, 400px);
          height: min(51dvh, 390px);
          min-height: 282px;
          border-radius: 30px;
          border-width: 6px;
        }

        .lt-word-label {
          min-height: 52px;
          font-size: clamp(30px, 10vw, 56px);
        }

        .lt-hint {
          min-height: 50px;
          font-size: clamp(19px, 5.6vw, 26px);
        }
      }

      @media (max-height: 650px) {
        .lt-title-wrap { display: none; }
        .lt-main-card {
          height: min(50dvh, 340px);
          min-height: 238px;
        }
        .lt-word-label { min-height: 48px; }
      }
    `;


    style.textContent += `
      .lt-root{display:flex;flex-direction:column;padding:0;gap:0}
      .lt-root [hidden]{display:none!important}
      .lt-top{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"tabs sound" "progress progress";padding:8px 12px;gap:6px;flex:0 0 auto;height:auto;border:0;border-radius:0;background:transparent;box-shadow:none}
      .lt-mode-tabs{grid-area:tabs;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));min-width:0;width:min(100%,250px);padding:3px;gap:4px}
      .lt-root .lt-mode-tab{min-height:44px;padding:4px 12px;font-size:18px;border-radius:22px}
      .lt-sound{grid-area:sound;flex:0 0 48px;min-width:48px;width:48px;height:48px;border:3px solid #fff;border-radius:16px;background:#fff7ce;font-size:24px;cursor:pointer;box-shadow:0 3px 0 #d6c88f}
      .lt-progress{grid-area:progress;width:100%;min-height:14px;display:flex;flex-direction:row;flex-wrap:nowrap;gap:7px}
      .lt-dot{width:10px;height:10px;border-width:2px}
      .lt-stage{display:flex;flex:1 1 auto;width:100%;height:auto;min-height:0;padding:6px 14px 16px}
      .lt-stage-inner{display:grid;width:min(100%,980px);margin:auto;height:100%;min-height:0;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto;gap:12px;align-items:stretch;justify-items:stretch}
      .lt-picture-area{position:relative;min-height:0;min-width:0;display:grid;place-items:stretch}
      .lt-main-card{width:100%;height:100%;min-height:0;max-height:none;border-width:5px;border-radius:28px;grid-column:auto;box-shadow:0 6px 0 rgba(0,0,0,.14),inset 0 4px 0 rgba(255,255,255,.75)}
      .lt-image-wrap{width:82%;height:82%;min-height:0;max-height:100%;align-self:center;justify-self:center;animation:none}
      .lt-display-img{max-width:100%;max-height:100%;width:100%;height:100%;object-fit:contain}
      .lt-fallback-letter,.lt-fallback-object{width:100%;height:100%;max-height:100%;border-radius:26px;font-size:clamp(80px,26vw,180px);box-shadow:inset 0 4px 0 rgba(255,255,255,.4),0 5px 0 rgba(0,0,0,.1)}
      .lt-fallback-object svg{width:70%;height:90%}
      .lt-learning-panel{display:grid;grid-template-rows:auto auto auto;align-content:center;gap:8px;min-width:0;padding-top:2px}
      .lt-word-label,.abc-phonics-landscape .lt-word-label{position:static;grid-column:auto;right:auto;top:auto;width:100%;min-height:48px;padding:7px 12px;font-size:clamp(26px,7vw,42px);line-height:1.1;opacity:1;transform:none;border-radius:20px;animation:none;box-shadow:0 4px 0 rgba(0,0,0,.1)}
      .lt-context{text-align:center;min-height:2.6em;display:grid;place-items:center;padding:0 4px;font-size:clamp(15px,3.8vw,19px);font-weight:900;line-height:1.3}
      .lt-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .lt-action,.abc-phonics-landscape .lt-hint{position:static;width:100%;min-width:44px;min-height:48px;margin:0;padding:8px 5px;border:3px solid #fff;border-radius:16px;box-shadow:0 3px 0 rgba(0,0,0,.13);background:#fff5c2;color:#24324a;font:inherit;font-size:clamp(14px,3.8vw,19px);font-weight:900;line-height:1.2;cursor:pointer;opacity:1;transform:none;animation:none;scale:1}
      .lt-actions .lt-hint{grid-column:1/-1;background:#267e66;color:#fff;min-height:48px}
      .lt-action:disabled{opacity:.52;cursor:default}
      .lt-action:focus-visible,.lt-sound:focus-visible,.lt-choice:focus-visible,.lt-mode-tab:focus-visible{outline:3px solid #1266b0;outline-offset:2px}
      .lt-choice-board{height:100%;min-height:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:10px;border-radius:26px;background:rgba(255,255,255,.58)}
      .lt-choice{min-width:44px;min-height:44px;border:4px solid #fff;border-radius:23px;background:#fff8de;display:grid;place-items:center;cursor:pointer;box-shadow:0 5px 0 rgba(0,0,0,.12);font-size:clamp(44px,12vw,100px);transition:background .2s}
      .lt-choice svg{width:90%;max-height:90%}
      .lt-choice.lt-match{background:#b6f0cf;border-color:#277e64}
      .abc-phonics-landscape .lt-top{display:flex;grid-column:auto;grid-row:auto;padding:8px 12px;gap:12px;height:auto;border:0;background:transparent;box-shadow:none;border-radius:0;flex:0 0 auto}
      .abc-phonics-landscape .lt-mode-tabs{width:200px;flex:0 0 auto;grid-template-columns:repeat(2,minmax(0,1fr));border-radius:24px;padding:3px;gap:4px}
      .abc-phonics-landscape .lt-progress{flex:1 1 auto;flex-direction:row;flex-wrap:nowrap;gap:8px;min-height:14px}
      .abc-phonics-landscape .lt-stage{grid-column:auto;grid-row:auto;display:flex;padding:2px 14px 14px}
      .abc-phonics-landscape .lt-stage-inner{grid-template-columns:minmax(0,1.2fr) minmax(210px,1fr);grid-template-rows:minmax(0,1fr);gap:16px;grid-column:auto}
      .abc-phonics-landscape .lt-fallback-letter,.abc-phonics-landscape .lt-fallback-object{width:100%;height:100%;font-size:clamp(80px,25vh,160px)}
      .abc-phonics-landscape .lt-context{font-size:17px;min-height:2.6em}
      .abc-phonics-landscape .lt-choice-board{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding:6px}
      .abc-phonics-landscape .lt-choice{font-size:clamp(40px,7vw,86px);border-width:3px;border-radius:18px}
      @media(max-width:360px){.lt-top{padding:6px 10px}.lt-stage{padding:3px 10px 10px}.lt-stage-inner{gap:8px}.lt-learning-panel{gap:5px}.lt-context{font-size:14px}.lt-action{font-size:14px}.lt-word-label{font-size:28px}.lt-choice-board{gap:5px;padding:6px}}
      @media(orientation:landscape) and (max-height:400px){.abc-phonics-landscape .lt-top{padding:5px 10px}.abc-phonics-landscape .lt-stage{padding:2px 10px 10px}.abc-phonics-landscape .lt-stage-inner{gap:12px}.abc-phonics-landscape .lt-learning-panel{gap:5px}.abc-phonics-landscape .lt-word-label{min-height:42px;padding:4px 8px;font-size:30px}.abc-phonics-landscape .lt-context{min-height:2.4em;font-size:15px}.lt-actions{gap:6px}}
      @media(max-height:650px){.lt-complete-screen{padding:12px}.lt-complete-box{padding:18px 14px;gap:9px}.lt-complete-emoji{font-size:64px}.lt-complete-title{font-size:28px}.lt-complete-sub{font-size:18px}.lt-btn{min-height:48px;font-size:17px}.lt-complete-btns{gap:9px}}
      @media(orientation:landscape) and (max-height:500px){.abc-phonics-landscape .lt-complete-screen{padding:12px}.abc-phonics-landscape .lt-complete-box{width:min(95%,760px);padding:16px;gap:8px}.abc-phonics-landscape .lt-complete-title{font-size:28px}.abc-phonics-landscape .lt-complete-sub{font-size:18px}.abc-phonics-landscape .lt-complete-emoji{font-size:70px}}
      /* Public shell Back occupies the first 44px. Keep both mode tabs clear. */
      .lt-root .lt-top{padding-left:60px}
      /* A choice control must stay still while a child aims or taps it. */
      .lt-root .lt-hint.visible{animation:none;transform:none;scale:1}
      @media(prefers-reduced-motion:reduce){.lt-root::before,.lt-transformed .lt-image-wrap{animation:none}}
    `;
    document.head.appendChild(style);
  }

  function escapeAttr(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function stopVoice() {
    state.voiceEpoch += 1;
    try { window.SihyeonVoice?.stop?.(); } catch (_) {}
  }

  function speakDirect(text, lang = 'ko-KR') {
    if (state.destroyed || document.hidden || !state.sound || !text) return Promise.resolve(false);
    // Korean letter learning stays Korean. English Listening never reads it
    // with an English voice or substitutes a translation for the learned sound.
    if (lang === 'ko-KR' && window.SihyeonPlaySettings?.getLanguage?.() === 'en') return Promise.resolve(false);
    stopVoice();
    const epoch = state.voiceEpoch;
    try {
      return Promise.resolve(window.SihyeonVoice?.speak?.(text, {
        lang, rate: 0.88, shouldPlay: () => !state.destroyed && state.sound && epoch === state.voiceEpoch
      })).catch(() => false);
    } catch (_) { return Promise.resolve(false); }
  }

  function syllableLink(item) {
    if (state.mode === 'abc') return {text: `글자 이름 · ${item.letter}`, speech: item.letterName};
    const syllable = item.word[0];
    const vowel = {0:'아',4:'어',8:'오',13:'우',18:'으',20:'이'}[Math.floor((syllable.codePointAt(0) - 0xac00) / 28) % 21];
    return {text: `${item.letterName} + ${vowel} → ${syllable}`,
      speech: `글자 이름은 ${item.letterName}. ${item.letterName}과 ${vowel}가 만나면 ${syllable}. ${item.word}.`};
  }

  function objectMarkup(item) {
    // A chestnut symbol is not an acorn. This simple vector preserves the cap,
    // stem and pointed nut that distinguish the actual representative object.
    if (item.word === '도토리') return '<svg viewBox="0 0 120 120" role="img" aria-label="도토리"><path d="M61 28q-3-17 10-22" fill="none" stroke="#69422a" stroke-width="8" stroke-linecap="round"/><path d="M29 51h62c2 28-12 45-31 57C40 95 27 78 29 51" fill="#bd743a"/><path d="M24 53q2-30 36-30t36 30Z" fill="#79532e"/><path d="M34 38l13 12m2-21l16 21m1-23l17 22m-48-1l14-16m4 16l14-20m3 21l13-16" stroke="#a78150" stroke-width="4" stroke-linecap="round"/><path d="M43 63q-3 17 9 29" fill="none" stroke="#e3a86c" stroke-width="6" stroke-linecap="round"/></svg>';
    return `<span aria-hidden="true">${item.fallbackObject}</span>`;
  }

  function matchingItems() {
    const items = getItems(), index = state.currentIndex;
    const choices = [items[index], items[(index + 1) % items.length], items[(index + 2) % items.length]];
    // Rotate the target position; no answer styling or fixed first-button clue.
    return choices.slice(index % 3).concat(choices.slice(0, index % 3));
  }

  function speakItemText(text, forceLang) {
    if (state.destroyed || document.hidden || !state.sound || !text) return Promise.resolve(false);
    // ABC words are English learning content in either listening setting. The
    // shared English manifest deliberately has no games.abc.* translations.
    // Use the explicit lesson text so replay does not silently disappear.
    if (forceLang === 'en-US') {
      const englishLesson = {
        '에이, 비, 씨가 장난감으로 변신해요!': 'The letters A, B, and C turn into pictures!',
        '우와. 에이, 비, 씨를 모두 만났어요.': 'You met A, B, and C!'
      };
      const phrase = englishLesson[text] || text;
      return /[가-힣]/.test(phrase) ? Promise.resolve(false) : speakDirect(phrase, 'en-US');
    }
    const voiceIds = {
      '에이, 비, 씨가 장난감으로 변신해요!': 'games.abc.intro',
      'Touch A!': 'games.abc.touchA',
      'Touch B!': 'games.abc.touchB',
      'Touch C!': 'games.abc.touchC',
      'A': 'games.abc.a',
      'B': 'games.abc.b',
      'C': 'games.abc.c',
      'Apple!': 'games.abc.apple',
      'Ball!': 'games.abc.ball',
      'Car!': 'games.abc.car',
      'Touch the letter!': 'games.abc.touchLetter',
      '우와. 에이, 비, 씨를 모두 만났어요.': 'games.abc.complete',
      '한글 친구들이 그림으로 변신해요!': 'games.korean.intro',
      '가, 가, 가방!': 'games.korean.ga',
      '나, 나, 나비!': 'games.korean.na',
      '도, 도, 도토리!': 'games.korean.do',
      '로, 로, 로봇!': 'games.korean.ro',
      '모, 모, 모자!': 'games.korean.mo',
      '바, 바, 바나나!': 'games.korean.ba',
      '사, 사, 사자!': 'games.korean.sa',
      '오, 오, 오리!': 'games.korean.o',
      '자, 자, 자동차!': 'games.korean.ja',
      '글자를 눌러볼까?': 'games.korean.touchTarget',
      '우와. 한글 친구들을 모두 만났어요.': 'games.korean.complete'
    };
    const voiceId = voiceIds[text];
    if (voiceId && window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      stopVoice();
      const epoch = state.voiceEpoch;
      return Promise.resolve(window.SihyeonVoice.play(voiceId, text, {
        allowTtsFallback: true, lang: forceLang || 'ko-KR',
        shouldPlay: () => !state.destroyed && state.sound && epoch === state.voiceEpoch
      })).catch(() => false);
    }
    return speakDirect(text, forceLang || 'ko-KR');
  }

  function vibrate(pattern) {
    if (!navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (error) {}
  }

  function createExplosion(x, y, color) {
    const root = state.container?.querySelector('.lt-root');
    if (!root) return;

    const colors = [color, '#FFF59D', '#FFD700', '#FF69B4', '#00D4FF', '#FFFFFF'];
    for (let i = 0; i < 28; i += 1) {
      const p = document.createElement('div');
      p.className = 'lt-particle';
      p.style.backgroundColor = colors[i % colors.length];
      const angle = Math.random() * Math.PI * 2;
      const dist = 110 + Math.random() * 210;
      p.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      root.appendChild(p);
      timer(() => p.remove(), 1000);
    }

    const stars = ['⭐', '✨', '🌟', '💫', '🎊'];
    for (let i = 0; i < 10; i += 1) {
      const s = document.createElement('div');
      s.className = 'lt-star';
      s.textContent = stars[i % stars.length];
      const angle = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * 160;
      s.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
      s.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      root.appendChild(s);
      timer(() => s.remove(), 1000);
    }
  }

  function updateRootBackground(root, item) {
    const dataset = getDataset();
    const start = dataset.bg?.[0] || '#fff7d6';
    const end = dataset.bg?.[1] || '#e8f7ff';
    root.style.setProperty('--lt-color', item.color || '#ff7a1a');
    root.style.background = `
      radial-gradient(circle at 50% 18%, rgba(255,255,255,.8) 0%, transparent 34%),
      linear-gradient(180deg, ${start} 0%, ${end} 100%)
    `;
  }

  function makeProgressHTML() {
    const items = getItems();
    return items.map((item, idx) => {
      const cls = idx < state.currentIndex ? 'done' : (idx === state.currentIndex ? 'active' : '');
      return `<span class="lt-dot ${cls}" style="${idx === state.currentIndex ? `--lt-color:${item.color};` : ''}"></span>`;
    }).join('');
  }

  function resetMode(nextMode) {
    if (!DATASETS[nextMode] || state.mode === nextMode) return;
    clearTimers();
    stopVoice();
    state.mode = nextMode;
    state.currentIndex = 0;
    state.isTransforming = false;
    state.phase = 'LETTER';
    state.successRewardGiven = false;
    state.completeRewardGiven = false;
    renderScene(true);
    scheduleIntro(() => {
      const dataset = getDataset();
      if (state.phase === 'LETTER') speakItemText(dataset.intro, nextMode === 'abc' ? 'en-US' : 'ko-KR');
    }, 300);
  }

  function renderScene(skipIntroVoice) {
    if (state.destroyed || !state.container) return;
    clearTimers();
    stopVoice();
    state.phase = 'LETTER';
    state.isTransforming = false;
    state.matchAnswered = false;

    const root = state.container.querySelector('.lt-root');
    const item = getCurrentItem();
    if (!root || !item) return;
    root.style.opacity = '1';
    state.successRewardGiven = false;
    updateRootLayoutClass();
    updateRootBackground(root, item);
    const link = syllableLink(item);

    root.innerHTML = `
      <div class="lt-top">
        <div class="lt-mode-tabs" role="group" aria-label="글자 모드 선택">
          <button type="button" class="lt-mode-tab ${state.mode === 'abc' ? 'active' : ''}" data-mode="abc" aria-pressed="${state.mode === 'abc'}">ABC</button>
          <button type="button" class="lt-mode-tab ${state.mode === 'hangul' ? 'active' : ''}" data-mode="hangul" aria-pressed="${state.mode === 'hangul'}">한글</button>
        </div>
        <div class="lt-progress" aria-label="${state.currentIndex + 1} / ${getItems().length}">${makeProgressHTML()}</div>
        <button type="button" class="lt-sound" id="ltSound" aria-label="안내 소리" aria-pressed="${state.sound}">${state.sound ? '🔊' : '🔇'}</button>
      </div>
      <div class="lt-stage">
        <div class="lt-stage-inner">
          <div class="lt-picture-area">
            <button type="button" class="lt-main-card" id="ltMainCard" aria-label="${escapeAttr(item.letterName)} 변신">
              <span class="lt-image-wrap" id="ltImageWrap">
                <img class="lt-display-img" id="ltMainImg" alt="${escapeAttr(item.letter)}" draggable="false" hidden>
                <span class="lt-fallback-letter" id="ltFallbackLetter">${item.fallbackLetter}</span>
                <span class="lt-fallback-object" id="ltFallbackObject" style="display:none;">${objectMarkup(item)}</span>
              </span>
            </button>
            <div class="lt-choice-board" id="ltChoices" role="group" aria-label="뜻에 맞는 그림 찾기" hidden></div>
          </div>
          <div class="lt-learning-panel">
            <div class="lt-word-label show" id="ltWordLabel">${escapeAttr(item.letter)}</div>
            <div class="lt-context" id="ltContext" role="status" aria-live="polite">${escapeAttr(link.text)}</div>
            <div class="lt-actions">
              <button type="button" class="lt-action" id="ltReplayPrompt">🔊 다시 듣기</button>
              <button type="button" class="lt-action" id="ltFind" disabled>👀 그림 찾기</button>
              <button type="button" class="lt-action lt-hint visible" id="ltHint" aria-label="글자 변신">✨ 변신</button>
            </div>
          </div>
        </div>
      </div>`;

    const mainCard = root.querySelector('#ltMainCard');
    const mainImg = root.querySelector('#ltMainImg');
    const imageWrap = root.querySelector('#ltImageWrap');
    const fallbackLetter = root.querySelector('#ltFallbackLetter');
    const fallbackObject = root.querySelector('#ltFallbackObject');
    const hint = root.querySelector('#ltHint');
    const find = root.querySelector('#ltFind');
    const label = root.querySelector('#ltWordLabel');
    const context = root.querySelector('#ltContext');
    const board = root.querySelector('#ltChoices');
    const lang = state.mode === 'abc' ? 'en-US' : 'ko-KR';

    root.querySelectorAll('.lt-mode-tab').forEach(btn => btn.addEventListener('click', () => resetMode(btn.dataset.mode)));
    root.querySelector('#ltSound').addEventListener('click', () => {
      state.sound = !state.sound;
      cancelIntro();
      stopVoice();
      const button = root.querySelector('#ltSound');
      button.setAttribute('aria-pressed', String(state.sound));
      button.textContent = state.sound ? '🔊' : '🔇';
    });

    let visualIsObject = false;
    function showFallback() {
      mainImg.hidden = true;
      imageWrap.classList.add('lt-image-missing');
      fallbackLetter.style.display = visualIsObject ? 'none' : 'grid';
      fallbackObject.style.display = visualIsObject ? 'grid' : 'none';
    }
    function showLoadedImage() {
      if (!mainImg.getAttribute('src') || !mainImg.naturalWidth) return;
      mainImg.hidden = false;
      imageWrap.classList.remove('lt-image-missing');
      fallbackLetter.style.display = 'none';
      fallbackObject.style.display = 'none';
    }
    function showVisual(source, isObject) {
      visualIsObject = isObject;
      mainImg.alt = isObject ? item.word : item.letter;
      showFallback();
      if (source) {
        mainImg.src = source;
        if (mainImg.complete) showLoadedImage();
      } else mainImg.removeAttribute('src');
    }
    mainImg.addEventListener('error', showFallback);
    mainImg.addEventListener('load', showLoadedImage);
    showVisual(item.letterImg, false);

    function replayPrompt() {
      cancelIntro();
      if (state.phase === 'LETTER') speakDirect(state.mode === 'abc' ? `Letter ${item.letterName}. Touch the letter.` : `글자 이름은 ${item.letterName}. 눌러서 ${item.word} 그림을 만나 볼까요?`, lang);
      else if (state.phase === 'CHOOSING') speakDirect(state.mode === 'abc' ? `Find the ${item.word.toLowerCase()}.` : `${item.word} 그림을 찾아볼까요?`, lang);
      else if (state.phase === 'OBJECT') speakItemText(item.wordVoice, lang);
    }
    root.querySelector('#ltReplayPrompt').addEventListener('click', replayPrompt);

    function transform() {
      if (state.destroyed || !root.contains(mainCard)) return;
      if (state.phase === 'OBJECT') { replayPrompt(); return; }
      if (state.phase !== 'LETTER') return;
      cancelIntro();
      state.phase = 'TRANSFORMING';
      state.isTransforming = true;
      mainCard.disabled = true;
      hint.disabled = true;
      vibrate(70);
      const rect = mainCard.getBoundingClientRect();
      createExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, item.color);
      mainCard.classList.add('lt-transformed');
      // A complete phrase makes the name / combined syllable distinction clear.
      // The visual may finish before speech; the child can replay or continue.
      speakDirect(state.mode === 'abc' ? `${item.letterName}. ${item.word}.` : link.speech, lang);
      timer(() => { showVisual(item.objectImg, true); vibrate([45, 40, 45]); }, 230);
      timer(() => {
        label.textContent = item.displayWord;
        context.textContent = state.mode === 'abc' ? `${item.letter} → ${item.word} · ${ {Apple:'사과',Ball:'공',Car:'자동차'}[item.word] }` : link.text;
        if (!state.successRewardGiven) {
          state.successRewardGiven = true;
          state.options.fireConfetti?.();
        }
        state.phase = 'OBJECT';
        state.isTransforming = false;
        mainCard.disabled = false;
        mainCard.setAttribute('aria-label', `${item.word} 다시 듣기`);
        hint.disabled = false;
        find.disabled = false;
        hint.textContent = '다음 ▶';
        hint.setAttribute('aria-label', '다음 글자');
      }, 800);
    }
    mainCard.addEventListener('click', transform);
    hint.addEventListener('click', () => {
      if (state.phase === 'LETTER') transform();
      else if (state.phase === 'OBJECT' || state.phase === 'CHOOSING') advanceRound();
    });
    find.addEventListener('click', () => {
      if (state.phase === 'CHOOSING') {
        state.phase = 'OBJECT';
        board.hidden = true;
        mainCard.hidden = false;
        find.textContent = '👀 그림 찾기';
        label.textContent = item.displayWord;
        context.textContent = link.text;
        return;
      }
      if (state.phase !== 'OBJECT') return;
      state.phase = 'CHOOSING';
      mainCard.hidden = true;
      board.hidden = false;
      find.textContent = '🖼️ 그림 보기';
      label.textContent = item.displayWord;
      context.textContent = `${item.word} 그림을 찾아요`;
      board.innerHTML = matchingItems().map(choice => `<button type="button" class="lt-choice" data-choice="${escapeAttr(choice.word)}" aria-label="${escapeAttr(choice.word)}">${objectMarkup(choice)}</button>`).join('');
      board.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
        if (state.destroyed || state.phase !== 'CHOOSING') return;
        const chosen = button.dataset.choice;
        if (chosen === item.word) {
          context.textContent = `맞아요! ${item.word}!`;
          speakItemText(item.wordVoice, lang);
          if (!state.matchAnswered) { state.matchAnswered = true; state.options.fireConfetti?.(); }
          board.querySelectorAll('[data-choice]').forEach(b => b.classList.toggle('lt-match', b === button));
        } else {
          context.textContent = `이건 ${chosen} · ${item.word} 그림을 찾아요`;
          speakDirect(state.mode === 'abc' ? `You picked the ${chosen.toLowerCase()}. Find the ${item.word.toLowerCase()}.` : `이건 ${chosen}. ${item.word} 그림을 찾아볼까요?`, lang);
        }
      }));
      replayPrompt();
    });

    if (!skipIntroVoice) scheduleIntro(replayPrompt, 400);
  }

  function advanceRound() {
    if (state.destroyed || !state.container || !['OBJECT','CHOOSING'].includes(state.phase)) return;
    state.phase = 'ADVANCING';
    clearTimers();
    stopVoice();

    const root = state.container.querySelector('.lt-root');
    if (!root) return;

    root.querySelectorAll('#ltMainCard, #ltHint').forEach(button => { button.disabled = true; });
    root.style.opacity = '0';

    timer(() => {
      state.currentIndex += 1;
      state.isTransforming = false;
      state.successRewardGiven = false;
      root.style.opacity = '1';

      if (state.currentIndex >= getItems().length) {
        showComplete();
      } else {
        renderScene();
      }
    }, 330);
  }

  function showComplete() {
    if (state.destroyed || !state.container) return;
    state.phase = 'COMPLETE';
    clearTimers();
    stopVoice();

    const root = state.container.querySelector('.lt-root');
    const dataset = getDataset();

    if (!root) return;

    updateRootLayoutClass();
    root.style.setProperty('--lt-color', '#FF7A1A');
    root.style.background = 'linear-gradient(180deg, #fff9c4 0%, #ffe082 48%, #ffd6e8 100%)';

    root.innerHTML = `
      <div class="lt-complete-screen">
        <div class="lt-complete-box">
          <div class="lt-complete-emoji">🎉</div>
          <div class="lt-complete-title">${dataset.completeTitle}</div>
          <div class="lt-complete-sub">시현이 최고야! 🌟</div>
          <div class="lt-complete-btns">
            <button type="button" class="lt-btn lt-btn-primary" id="ltReplay">다시 하기 🔄</button>
            <button type="button" class="lt-btn lt-btn-secondary" id="ltSwitch">${state.mode === 'abc' ? '한글도 하기 ㄱ' : 'ABC도 하기 A'}</button>
            <button type="button" class="lt-btn lt-btn-secondary" id="ltToLand">글자놀이터로 👋</button>
          </div>
        </div>
      </div>
    `;

    if (!state.completeRewardGiven) {
      state.completeRewardGiven = true;
      speakItemText(dataset.completeVoice, state.mode === 'abc' ? 'en-US' : 'ko-KR');
      state.options.fireConfetti?.();
      state.options.gainExp?.(dataset.completeExp || 20);
    }

    root.querySelector('#ltReplay')?.addEventListener('click', () => {
      state.currentIndex = 0;
      state.isTransforming = false;
      state.successRewardGiven = false;
      state.completeRewardGiven = false;
      renderScene(true);
      scheduleIntro(() => {
        const msg = state.mode === 'abc' ? 'Touch the letter!' : '글자를 눌러볼까?';
        speakItemText(msg, state.mode === 'abc' ? 'en-US' : 'ko-KR');
      }, 350);
    });

    root.querySelector('#ltSwitch')?.addEventListener('click', () => {
      resetMode(state.mode === 'abc' ? 'hangul' : 'abc');
    });

    root.querySelector('#ltToLand')?.addEventListener('click', () => {
      if (typeof window.openLetterLand === 'function') window.openLetterLand();
      else state.options.closeToParkHome?.();
    });
  }

  function render(container, options = {}) {
    destroy();
    injectStyle();

    state.container = container;
    state.options = options || {};
    state.destroyed = false;
    state.currentIndex = 0;
    state.isTransforming = false;
    state.timers = [];
    state.mode = options.initialMode === 'hangul' ? 'hangul' : 'abc';
    state.layoutMode = getLayoutMode();
    state.successRewardGiven = false;
    state.completeRewardGiven = false;
    state.sound = true;
    state.matchAnswered = false;

    bindLayoutEvents();

    container.innerHTML = `<div class="${getRootClass()}"></div>`;
    renderScene(true);

    scheduleIntro(() => {
      const dataset = getDataset();
      if (state.phase === 'LETTER') speakItemText(dataset.intro, state.mode === 'abc' ? 'en-US' : 'ko-KR');
    }, 350);
  }

  function destroy() {
    state.destroyed = true;
    clearTimers();
    stopVoice();
    unbindLayoutEvents();

    if (typeof speechSynthesis !== 'undefined') {
      try { speechSynthesis.cancel(); } catch (error) {}
    }

    if (state.container) state.container.innerHTML = '';
    state.container = null;
    state.successRewardGiven = false;
    state.completeRewardGiven = false;
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
  window.SihyeonGames[ALIAS_KEY] = window.SihyeonGames[GAME_KEY];
})();
