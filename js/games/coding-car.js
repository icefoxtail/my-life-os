/**
 * 시현이 놀이터 OS — 부릉부릉 길찾기 (Coding Car)
 * 파일: js/games/coding-car.js
 * 버전: v2.1.0
 * 설명: 4살 시현이를 위한 방향 화살표 기반 코딩(순서) 놀이
 * 반영: 3×3/4×4, 랜덤 시작·도착, 즉각 반응, 햅틱, 자동차 클릭 안내, 화살표 유도, 이미지 fallback, 경험치 보상
 */
(function () {
  const GAME_KEY = 'codingCar';
  const STYLE_ID = 'sihyeon-coding-car-style';
  const MANIFEST_URL = './assets/vehicles/vehicles_manifest.json';

  const DIFFICULTIES = {
    easy: {
      id: 'easy',
      label: '3×3 쉬움',
      gridSize: 3,
      maxCommands: 4,
      minDistance: 2,
      maxDistance: 4
    },
    challenge: {
      id: 'challenge',
      label: '4×4 도전',
      gridSize: 4,
      maxCommands: 7,
      minDistance: 3,
      maxDistance: 6
    }
  };

  const DIRS = {
    up:    { dx: 0,  dy: -1, label: '위',     emoji: '⬆️' },
    down:  { dx: 0,  dy: 1,  label: '아래',   emoji: '⬇️' },
    left:  { dx: -1, dy: 0,  label: '왼쪽',   emoji: '⬅️' },
    right: { dx: 1,  dy: 0,  label: '오른쪽', emoji: '➡️' }
  };

  const state = {
    container: null,
    options: {},
    vehicle: null,
    vehicles: [],
    commands: [],
    carX: 0,
    carY: 0,
    startX: 0,
    startY: 0,
    goalX: 2,
    goalY: 0,
    difficulty: 'easy',
    gridSize: 3,
    maxCommands: 4,
    failCount: 0,
    hasFirstInput: false,
    locked: false,
    destroyed: false,
    noticeTimer: null,
    resetTimer: null,
    timers: [],
    layoutMode: 'portrait',
    resizeTimer: null,
    handleResizeBound: null,
    successRewardGiven: false,
    completeRewardGiven: false
  };

  function isLandscapeMode() {
    const width = window.innerWidth || document.documentElement.clientWidth || 0;
    const height = window.innerHeight || document.documentElement.clientHeight || 0;
    return width >= 760 && width > height;
  }

  function getLayoutMode() {
    return isLandscapeMode() ? 'landscape' : 'portrait';
  }

  function getRootClass() {
    state.layoutMode = getLayoutMode();
    return `cc-root coding-car-root coding-car-${state.layoutMode}`;
  }

  function applyRootLayoutClass() {
    const root = state.container?.querySelector('.cc-root');
    if (!root) return;

    const nextMode = getLayoutMode();
    root.classList.remove('coding-car-portrait', 'coding-car-landscape');
    root.classList.add(`coding-car-${nextMode}`);
    state.layoutMode = nextMode;
  }

  function bindLayoutEvents() {
    if (state.handleResizeBound) return;
    state.handleResizeBound = handleResize;
    window.addEventListener('resize', state.handleResizeBound, { passive: true });
    window.addEventListener('orientationchange', state.handleResizeBound, { passive: true });
  }

  function unbindLayoutEvents() {
    if (!state.handleResizeBound) return;
    window.removeEventListener('resize', state.handleResizeBound);
    window.removeEventListener('orientationchange', state.handleResizeBound);
    state.handleResizeBound = null;
  }

  function handleResize() {
    if (state.destroyed || !state.container) return;
    if (state.resizeTimer) window.clearTimeout(state.resizeTimer);

    state.resizeTimer = window.setTimeout(() => {
      state.resizeTimer = null;
      if (state.destroyed || !state.container) return;

      const nextMode = getLayoutMode();
      if (state.layoutMode === nextMode) return;

      applyRootLayoutClass();
    }, 120);
  }

  function setManagedTimeout(fn, ms) {
    const id = window.setTimeout(() => {
      state.timers = state.timers.filter((timerId) => timerId !== id);
      if (!state.destroyed) fn();
    }, ms);
    state.timers.push(id);
    return id;
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .cc-root {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        background:
          radial-gradient(circle at 18% 10%, rgba(255,255,255,0.72), transparent 20%),
          linear-gradient(180deg, #81D4FA 0%, #B3E5FC 30%, #C8E6C9 100%);
        font-family: 'Arial Rounded MT Bold', 'Jua', 'Nanum Gothic', sans-serif;
        box-sizing: border-box;
        user-select: none;
        touch-action: none;
        overflow: hidden;
        color: #17324a;
      }

      .coding-car-root {
        box-sizing: border-box;
      }

      .coding-car-root * {
        box-sizing: border-box;
      }

      .cc-top {
        flex-shrink: 0;
        display: grid;
        gap: 8px;
        padding: 10px 10px 4px;
      }

      .cc-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .cc-title {
        flex: 1;
        min-height: 42px;
        display: grid;
        place-items: center;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255,255,255,0.88);
        border: 4px solid #fff;
        box-shadow: 0 5px 0 rgba(0,0,0,0.14);
        text-align: center;
        font-size: clamp(18px, 5vw, 27px);
        font-weight: 900;
        line-height: 1.08;
        color: #17324a;
        text-shadow: 1px 1px 0 rgba(255,255,255,0.9);
      }

      .cc-difficulty-row {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        scrollbar-width: none;
        padding: 0 2px 4px;
      }

      .cc-difficulty-row::-webkit-scrollbar {
        display: none;
      }

      .cc-diff-btn {
        flex: 1;
        min-width: 120px;
        min-height: 42px;
        padding: 0 14px;
        border-radius: 999px;
        border: 4px solid #fff;
        background: rgba(255,255,255,0.82);
        box-shadow: 0 5px 0 rgba(0,0,0,0.14);
        color: #17324a;
        font-family: inherit;
        font-size: clamp(15px, 4vw, 19px);
        font-weight: 900;
        cursor: pointer;
        touch-action: manipulation;
      }

      .cc-diff-btn.active {
        background: linear-gradient(180deg,#fff 0%,#ffe577 100%);
        color: #9a5c00;
        box-shadow: 0 5px 0 rgba(200,140,0,0.25);
      }

      .cc-diff-btn:active {
        transform: translateY(3px);
        box-shadow: 0 2px 0 rgba(0,0,0,0.16);
      }

      .cc-map-container {
        flex: 1;
        min-height: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px 10px 8px;
      }

      .cc-map {
        position: relative;
        width: min(90vw, 58vh, 430px);
        height: min(90vw, 58vh, 430px);
        min-width: 250px;
        min-height: 250px;
        background:
          linear-gradient(90deg, rgba(255,255,255,0.12) 50%, transparent 50%),
          linear-gradient(180deg, #86d283 0%, #62bd69 100%);
        border: 8px solid #4CAF50;
        border-radius: 24px;
        box-shadow: 0 10px 20px rgba(0,0,0,0.16), inset 0 3px 0 rgba(255,255,255,0.4);
        display: grid;
        overflow: hidden;
      }

      .cc-map.grid-3 {
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
      }

      .cc-map.grid-4 {
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(4, 1fr);
      }

      .cc-cell {
        position: relative;
        border: 2px dashed rgba(255,255,255,0.34);
        box-sizing: border-box;
      }

      .cc-cell.path-hint::after {
        content: '✨';
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        font-size: clamp(18px, 6vw, 32px);
        animation: cc-hint-twinkle 0.9s ease-in-out infinite alternate;
      }

      @keyframes cc-hint-twinkle {
        from { transform: scale(0.82); opacity: 0.45; }
        to { transform: scale(1.1); opacity: 1; }
      }

      .cc-garage {
        position: absolute;
        width: calc(100% / var(--cc-grid-size, 3));
        height: calc(100% / var(--cc-grid-size, 3));
        top: 0;
        left: 0;
        transform: translate(calc(var(--goal-x, 2) * 100%), calc(var(--goal-y, 0) * 100%));
        background-image: url('./assets/games/codingCar/garage.png');
        background-size: 82%;
        background-position: center;
        background-repeat: no-repeat;
        z-index: 5;
        filter: drop-shadow(0 4px 4px rgba(0,0,0,0.22));
        display: grid;
        place-items: center;
      }

      .cc-garage::after {
        content: '🏠';
        font-size: clamp(32px, 10vw, 60px);
        opacity: 0.92;
        filter: drop-shadow(0 4px 4px rgba(0,0,0,0.18));
      }

      .cc-garage.has-image::after {
        content: '';
      }

      .cc-start-flag {
        position: absolute;
        width: calc(100% / var(--cc-grid-size, 3));
        height: calc(100% / var(--cc-grid-size, 3));
        top: 0;
        left: 0;
        transform: translate(calc(var(--start-x, 0) * 100%), calc(var(--start-y, 2) * 100%));
        z-index: 4;
        display: grid;
        place-items: center;
        pointer-events: none;
      }

      .cc-start-flag::before {
        content: '🚩';
        font-size: clamp(28px, 10vw, 52px);
        filter: drop-shadow(0 4px 4px rgba(0,0,0,0.18));
        animation: cc-flag-pop 0.5s ease-out;
      }

      @keyframes cc-flag-pop {
        from { transform: scale(0.3); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }

      .cc-car-wrapper {
        position: absolute;
        width: calc(100% / var(--cc-grid-size, 3));
        height: calc(100% / var(--cc-grid-size, 3));
        top: 0;
        left: 0;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        will-change: transform;
        cursor: pointer;
        touch-action: manipulation;
      }

      .cc-car-wrapper.is-guide-shake .cc-car-img {
        animation: cc-car-guide-shake 0.5s ease-in-out;
      }

      @keyframes cc-car-guide-shake {
        0%, 100% { transform: rotate(0deg) scale(1); }
        20% { transform: rotate(-7deg) scale(1.05); }
        40% { transform: rotate(7deg) scale(1.05); }
        60% { transform: rotate(-4deg) scale(1.03); }
        80% { transform: rotate(4deg) scale(1.03); }
      }

      .cc-car-img {
        max-width: 92%;
        max-height: 92%;
        object-fit: contain;
        filter: drop-shadow(0 5px 5px rgba(0,0,0,0.28));
      }

      .cc-ui-area {
        flex-shrink: 0;
        background: rgba(255,255,255,0.88);
        border-radius: 30px 30px 0 0;
        border-top: 5px solid #fff;
        padding: 12px 10px calc(12px + env(safe-area-inset-bottom));
        box-shadow: 0 -4px 20px rgba(0,0,0,0.12);
        display: grid;
        gap: 9px;
      }

      .cc-guide-text {
        min-height: 28px;
        display: grid;
        place-items: center;
        text-align: center;
        color: #0d47a1;
        font-size: clamp(16px, 4.3vw, 22px);
        font-weight: 900;
        line-height: 1.1;
        text-shadow: 1px 1px 0 rgba(255,255,255,0.9);
      }

      .cc-slots {
        display: flex;
        justify-content: center;
        gap: 8px;
        min-height: 54px;
      }

      .cc-slot {
        width: clamp(44px, 11vw, 58px);
        height: clamp(44px, 11vw, 58px);
        background: #eceff1;
        border: 4px solid #cfd8dc;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.18s ease;
        box-shadow: inset 0 2px 0 rgba(255,255,255,0.7);
      }

      .cc-slot img {
        width: 82%;
        height: 82%;
        object-fit: contain;
        animation: cc-pop 0.24s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      .cc-slot .cc-arrow-fallback {
        font-size: clamp(26px, 7vw, 40px);
        line-height: 1;
        animation: cc-pop 0.24s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      .cc-slot.active {
        border-color: #2196F3;
        background: #e3f2fd;
      }

      .cc-slot.running {
        border-color: #FF5252 !important;
        background: #fff0f0;
        box-shadow: 0 0 0 5px rgba(255,82,82,0.18);
      }

      .cc-slot.bad {
        border-color: #ff5252;
        background: #ffebee;
        animation: cc-slot-bad 0.45s ease-in-out;
      }

      @keyframes cc-slot-bad {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        50% { transform: translateX(5px); }
        75% { transform: translateX(-3px); }
      }

      .cc-controls {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
      }

      .cc-controls.need-input .cc-btn-arrow {
        animation: cc-arrow-guide-glow 0.9s ease-in-out infinite alternate;
      }

      .cc-controls.need-input .cc-btn-arrow:nth-child(2) {
        animation-delay: 0.08s;
      }

      .cc-controls.need-input .cc-btn-arrow:nth-child(3) {
        animation-delay: 0.16s;
      }

      .cc-controls.need-input .cc-btn-arrow:nth-child(4) {
        animation-delay: 0.24s;
      }

      @keyframes cc-arrow-guide-glow {
        from {
          filter: brightness(1);
          transform: translateY(0);
          box-shadow: 0 6px 0 rgba(0,0,0,0.16);
        }
        to {
          filter: brightness(1.12);
          transform: translateY(-2px);
          box-shadow: 0 8px 0 rgba(0,0,0,0.14), 0 0 0 5px rgba(33,150,243,0.16);
        }
      }

      .cc-btn-arrow {
        height: clamp(56px, 14vw, 76px);
        background: linear-gradient(180deg,#ffffff 0%,#dff7ff 100%);
        border: 4px solid #fff;
        border-radius: 20px;
        box-shadow: 0 6px 0 rgba(0,0,0,0.16);
        padding: 5px;
        cursor: pointer;
        transition: transform 0.1s, box-shadow 0.1s;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        display: grid;
        place-items: center;
        position: relative;
        overflow: hidden;
      }

      .cc-btn-arrow:active {
        transform: translateY(5px) scale(0.98);
        box-shadow: 0 1px 0 rgba(0,0,0,0.16);
      }

      .cc-btn-arrow img {
        width: 92%;
        height: 92%;
        object-fit: contain;
        pointer-events: none;
        position: relative;
        z-index: 2;
      }

      .cc-btn-arrow .cc-arrow-fallback {
        position: absolute;
        inset: 0;
        z-index: 1;
        display: grid;
        place-items: center;
        font-size: clamp(32px, 9vw, 54px);
        line-height: 1;
      }

      .cc-btn-arrow img.is-hidden {
        display: none;
      }

      .cc-bottom-guide {
        min-height: 24px;
        display: grid;
        place-items: center;
        text-align: center;
        color: #8a4b00;
        font-size: clamp(15px, 4vw, 20px);
        font-weight: 900;
        line-height: 1.1;
      }

      .cc-bottom-actions {
        display: grid;
        grid-template-columns: 1fr 1fr 1.5fr;
        gap: 8px;
      }

      .cc-btn-edit,
      .cc-btn-go {
        min-height: clamp(50px, 12vw, 66px);
        border: 4px solid #fff;
        border-radius: 20px;
        font-family: inherit;
        font-size: clamp(16px, 4.4vw, 24px);
        font-weight: 900;
        cursor: pointer;
        transition: transform 0.1s, box-shadow 0.1s;
        touch-action: manipulation;
      }

      .cc-btn-edit {
        background: linear-gradient(180deg,#ffffff 0%,#eeeeee 100%);
        color: #455a64;
        box-shadow: 0 5px 0 rgba(69,90,100,0.25);
      }

      .cc-btn-go {
        background: linear-gradient(180deg,#ff7b7b 0%,#FF5252 100%);
        color: white;
        box-shadow: 0 6px 0 #D32F2F;
      }

      .cc-btn-go.ready {
        animation: cc-go-ready 0.9s ease-in-out infinite alternate;
      }

      @keyframes cc-go-ready {
        from { filter: brightness(1); transform: scale(1); }
        to { filter: brightness(1.08); transform: scale(1.03); }
      }

      .cc-btn-edit:active,
      .cc-btn-go:active {
        transform: translateY(5px);
        box-shadow: 0 1px 0 rgba(0,0,0,0.16);
      }

      .cc-btn-edit:disabled,
      .cc-btn-go:disabled {
        background: #d7d7d7;
        color: #8b8b8b;
        box-shadow: 0 5px 0 #aaa;
        transform: none;
        cursor: not-allowed;
        animation: none;
      }

      .cc-speech {
        position: absolute;
        left: 50%;
        bottom: calc(190px + env(safe-area-inset-bottom));
        z-index: 40;
        transform: translateX(-50%);
        width: min(92vw, 540px);
        min-height: 50px;
        padding: 10px 16px;
        border-radius: 999px;
        border: 5px solid #fff;
        background: linear-gradient(180deg,#ffffff 0%,#fff4a7 100%);
        box-shadow: 0 8px 0 rgba(0,0,0,0.18);
        color: #17324a;
        text-align: center;
        font-size: clamp(19px, 5.2vw, 29px);
        font-weight: 900;
        line-height: 1.14;
        display: grid;
        place-items: center;
        pointer-events: none;
        animation: cc-speech-pop 0.22s ease-out;
      }

      @keyframes cc-speech-pop {
        from { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.94); }
        to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
      }

      .cc-success-overlay {
        position: absolute;
        inset: 0;
        background: rgba(255,255,255,0.86);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 200;
        animation: cc-fade-in 0.4s ease;
        padding: 18px;
      }

      .cc-success-box {
        width: min(92vw, 520px);
        background: #fff;
        padding: 26px 18px;
        border-radius: 30px;
        border: 6px solid #4CAF50;
        text-align: center;
        box-shadow: 0 16px 40px rgba(0,0,0,0.2);
        animation: cc-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        display: grid;
        gap: 12px;
      }

      .cc-success-icon {
        font-size: clamp(64px, 20vw, 104px);
        line-height: 1;
      }

      .cc-success-title {
        font-size: clamp(29px, 8vw, 44px);
        font-weight: 900;
        color: #17324a;
        line-height: 1.08;
      }

      .cc-success-actions {
        display: grid;
        grid-template-columns: 1.4fr 1fr 0.9fr;
        gap: 8px;
        margin-top: 4px;
      }

      .cc-success-btn {
        min-height: 54px;
        padding: 8px 10px;
        border-radius: 999px;
        border: 4px solid #fff;
        font-family: inherit;
        font-size: clamp(15px, 4.2vw, 20px);
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 5px 0 rgba(0,0,0,0.16);
      }

      .cc-success-next {
        background: linear-gradient(180deg,#fff 0%,#ffe577 100%);
        color: #9a5c00;
      }

      .cc-success-retry {
        background: linear-gradient(180deg,#fff 0%,#dff7ff 100%);
        color: #0d47a1;
      }

      .cc-success-home {
        background: linear-gradient(180deg,#fff 0%,#ffcc80 100%);
        color: #8a4b00;
      }

      .cc-success-btn:active {
        transform: translateY(4px);
        box-shadow: 0 1px 0 rgba(0,0,0,0.16);
      }

      @keyframes cc-pop {
        0% { transform: scale(0.5); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }

      @keyframes cc-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .coding-car-portrait {
        display: flex;
        flex-direction: column;
      }

      .coding-car-landscape {
        display: grid;
        grid-template-columns: minmax(220px, 24vw) minmax(360px, 1fr) minmax(250px, 28vw);
        grid-template-rows: 1fr;
        gap: 12px;
        padding: max(10px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
      }

      .coding-car-landscape .cc-top {
        grid-column: 1;
        grid-row: 1;
        height: 100%;
        min-height: 0;
        padding: 14px;
        align-content: start;
        gap: 16px;
        border-radius: 32px;
        border: 5px solid rgba(255,255,255,0.68);
        background: rgba(255,255,255,0.42);
        box-shadow: inset 0 2px 0 rgba(255,255,255,0.28), 0 14px 30px rgba(0,0,0,0.14);
      }

      .coding-car-landscape .cc-header {
        display: block;
      }

      .coding-car-landscape .cc-title {
        min-height: 102px;
        padding: 18px 14px;
        border-radius: 30px;
        font-size: clamp(24px, 2.7vw, 36px);
        line-height: 1.18;
      }

      .coding-car-landscape .cc-difficulty-row {
        flex-direction: column;
        overflow: visible;
        padding: 0;
        gap: 12px;
      }

      .coding-car-landscape .cc-diff-btn {
        width: 100%;
        min-width: 0;
        min-height: 68px;
        border-radius: 26px;
        font-size: clamp(20px, 2.2vw, 28px);
      }

      .coding-car-landscape .cc-map-container {
        grid-column: 2;
        grid-row: 1;
        width: 100%;
        height: 100%;
        min-height: 0;
        padding: 0;
        align-items: center;
        justify-content: center;
      }

      .coding-car-landscape .cc-map {
        width: min(100%, 72vh, 620px);
        height: min(100%, 72vh, 620px);
        min-width: 340px;
        min-height: 340px;
        border-width: 9px;
        border-radius: 34px;
      }

      .coding-car-landscape .cc-ui-area {
        grid-column: 3;
        grid-row: 1;
        height: 100%;
        min-height: 0;
        align-content: center;
        border-radius: 32px;
        border-top: 0;
        border: 5px solid rgba(255,255,255,0.82);
        padding: 16px max(14px, env(safe-area-inset-right)) 16px 14px;
        gap: 12px;
        overflow: hidden auto;
      }

      .coding-car-landscape .cc-guide-text {
        min-height: 72px;
        padding: 8px 10px;
        border-radius: 24px;
        background: rgba(255,255,255,0.72);
        border: 4px solid #fff;
        font-size: clamp(20px, 2.3vw, 30px);
      }

      .coding-car-landscape .cc-slots {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 9px;
        min-height: 0;
      }

      .coding-car-landscape .cc-slot {
        width: 100%;
        height: clamp(54px, 8vh, 72px);
        border-radius: 18px;
      }

      .coding-car-landscape .cc-controls {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .coding-car-landscape .cc-btn-arrow {
        height: clamp(70px, 12vh, 98px);
        border-radius: 24px;
      }

      .coding-car-landscape .cc-bottom-guide {
        min-height: 58px;
        padding: 8px 10px;
        border-radius: 22px;
        background: rgba(255,241,200,0.72);
        border: 4px solid #fff;
        font-size: clamp(18px, 2vw, 26px);
      }

      .coding-car-landscape .cc-bottom-actions {
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .coding-car-landscape .cc-btn-edit,
      .coding-car-landscape .cc-btn-go {
        min-height: clamp(60px, 9vh, 82px);
        border-radius: 24px;
        font-size: clamp(20px, 2.2vw, 30px);
      }

      .coding-car-landscape .cc-speech {
        left: 50%;
        bottom: max(18px, env(safe-area-inset-bottom));
        width: min(44vw, 620px);
        font-size: clamp(20px, 2.4vw, 32px);
      }

      .coding-car-landscape .cc-success-box {
        width: min(720px, 72vw);
      }

      .coding-car-landscape .cc-success-actions {
        grid-template-columns: 1.4fr 1fr 0.9fr;
      }

      @media (max-width: 620px) {
        .cc-top {
          padding: 8px 8px 3px;
          gap: 6px;
        }

        .cc-title {
          min-height: 38px;
          padding: 7px 10px;
          border-width: 3px;
        }

        .cc-diff-btn {
          min-height: 38px;
          border-width: 3px;
          padding: 0 10px;
        }

        .cc-map-container {
          padding: 5px 8px 6px;
        }

        .cc-map {
          border-width: 6px;
          border-radius: 20px;
        }

        .cc-ui-area {
          padding: 10px 8px calc(10px + env(safe-area-inset-bottom));
          gap: 7px;
          border-radius: 24px 24px 0 0;
        }

        .cc-guide-text {
          min-height: 24px;
        }

        .cc-slots {
          gap: 6px;
          min-height: 48px;
        }

        .cc-slot {
          border-width: 3px;
          border-radius: 12px;
        }

        .cc-controls {
          gap: 6px;
        }

        .cc-btn-arrow {
          border-width: 3px;
          border-radius: 17px;
        }

        .cc-bottom-guide {
          min-height: 20px;
        }

        .cc-bottom-actions {
          gap: 6px;
        }

        .cc-btn-edit,
        .cc-btn-go {
          border-width: 3px;
          border-radius: 17px;
        }

        .cc-speech {
          bottom: calc(178px + env(safe-area-inset-bottom));
          border-width: 4px;
          min-height: 46px;
          padding: 9px 14px;
        }

        .cc-success-actions {
          grid-template-columns: 1fr;
        }
      }

      @media (max-height: 690px) {
        .cc-top {
          padding-top: 6px;
          gap: 4px;
        }

        .cc-title {
          min-height: 34px;
          font-size: 18px;
        }

        .cc-difficulty-row {
          padding-bottom: 2px;
        }

        .cc-diff-btn {
          min-height: 32px;
          font-size: 14px;
        }

        .cc-map {
          width: min(88vw, 48vh, 390px);
          height: min(88vw, 48vh, 390px);
        }

        .cc-ui-area {
          gap: 5px;
          padding-top: 7px;
        }

        .cc-guide-text {
          min-height: 20px;
          font-size: 15px;
        }

        .cc-slots {
          min-height: 42px;
        }

        .cc-slot {
          width: 42px;
          height: 42px;
        }

        .cc-btn-arrow {
          height: 49px;
        }

        .cc-bottom-guide {
          min-height: 18px;
          font-size: 14px;
        }

        .cc-btn-edit,
        .cc-btn-go {
          min-height: 44px;
        }

        .cc-speech {
          bottom: calc(156px + env(safe-area-inset-bottom));
          min-height: 42px;
          font-size: 18px;
        }

        .coding-car-landscape .cc-title {
          min-height: 82px;
          font-size: clamp(19px, 2.3vw, 30px);
        }

        .coding-car-landscape .cc-diff-btn {
          min-height: 54px;
          font-size: clamp(17px, 2vw, 24px);
        }

        .coding-car-landscape .cc-map {
          width: min(100%, 68vh, 560px);
          height: min(100%, 68vh, 560px);
        }

        .coding-car-landscape .cc-guide-text {
          min-height: 54px;
          font-size: clamp(17px, 2vw, 24px);
        }

        .coding-car-landscape .cc-btn-arrow {
          height: clamp(56px, 10vh, 78px);
        }

        .coding-car-landscape .cc-btn-edit,
        .coding-car-landscape .cc-btn-go {
          min-height: clamp(50px, 8vh, 70px);
        }
      }
    `;

    document.head.appendChild(style);
  }

  function vibrate(pattern) {
    try {
      if (navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  }

  function playSound(key) {
    if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      window.SihyeonVoice.play(key, '').catch(() => {});
    }
  }

  function playVoice(key) {
    if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      window.SihyeonVoice.play(key, '').catch(() => {});
    }
  }

  async function fetchVehicles() {
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`vehicle manifest failed: ${res.status}`);

      const json = await res.json();
      const list = Array.isArray(json.vehicles) ? json.vehicles : [];
      return list.filter((vehicle) => vehicle && (vehicle.file || vehicle.src));
    } catch (e) {
      console.warn('Failed to load vehicle manifest, using fallback', e);
      return [
        { id: 'pump_engine', name_ko: '소방차', file: 'assets/vehicles/fire/pump_engine.webp', category: 'fire' },
        { id: 'police_car', name_ko: '경찰차', file: 'assets/vehicles/police/police_car.webp', category: 'police' },
        { id: 'bus', name_ko: '버스', file: 'assets/vehicles/transport/bus.webp', category: 'transport' },
        { id: 'excavator', name_ko: '굴착기', file: 'assets/vehicles/construction/excavator.webp', category: 'construction' }
      ];
    }
  }

  function normalizeVehicleFile(file) {
    const raw = String(file || '');
    if (!raw) return './assets/vehicles/fire/pump_engine.webp';
    if (raw.startsWith('./')) return raw;
    if (raw.startsWith('/')) return `.${raw}`;
    return `./${raw}`;
  }

  function pickVehicle() {
    const list = state.vehicles.length ? state.vehicles : [];
    const favIds = ['pump_engine', 'ladder_truck', 'bus', 'police_car', 'ambulance', 'excavator', 'fire_tanker'];
    const favs = list.filter((vehicle) => favIds.includes(vehicle.id));
    const pool = favs.length ? favs : list;

    if (!pool.length) {
      return { id: 'pump_engine', name_ko: '소방차', file: './assets/vehicles/fire/pump_engine.webp' };
    }

    const picked = pool[Math.floor(Math.random() * pool.length)];
    return {
      ...picked,
      name_ko: picked.name_ko || picked.name || picked.id || '자동차',
      file: normalizeVehicleFile(picked.file || picked.src)
    };
  }

  function getDifficulty() {
    return DIFFICULTIES[state.difficulty] || DIFFICULTIES.easy;
  }

  function setDifficulty(id) {
    if (!DIFFICULTIES[id] || state.difficulty === id) return;
    state.difficulty = id;
    vibrate(12);
    startGame();
  }

  function getDistance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  function chooseMission() {
    const difficulty = getDifficulty();
    const size = difficulty.gridSize;
    const points = [];

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        points.push({ x, y });
      }
    }

    const candidates = [];

    points.forEach((start) => {
      points.forEach((goal) => {
        if (start.x === goal.x && start.y === goal.y) return;

        const distance = getDistance(start, goal);
        if (distance < difficulty.minDistance || distance > difficulty.maxDistance) return;

        const needsLeft = goal.x < start.x;
        const needsRight = goal.x > start.x;
        const needsUp = goal.y < start.y;
        const needsDown = goal.y > start.y;
        const dirKinds = [needsLeft, needsRight, needsUp, needsDown].filter(Boolean).length;

        candidates.push({
          start,
          goal,
          distance,
          score: dirKinds + (needsLeft ? 1 : 0) + (needsDown ? 1 : 0)
        });
      });
    });

    const weighted = [];
    candidates.forEach((item) => {
      const repeat = Math.max(1, item.score);
      for (let i = 0; i < repeat; i += 1) weighted.push(item);
    });

    const picked = weighted[Math.floor(Math.random() * weighted.length)] || {
      start: { x: 0, y: size - 1 },
      goal: { x: size - 1, y: 0 }
    };

    state.startX = picked.start.x;
    state.startY = picked.start.y;
    state.goalX = picked.goal.x;
    state.goalY = picked.goal.y;
    state.carX = state.startX;
    state.carY = state.startY;
  }

  function startGame() {
    if (!state.container) return;

    clearTimers();

    const difficulty = getDifficulty();
    state.gridSize = difficulty.gridSize;
    state.maxCommands = difficulty.maxCommands;
    state.commands = [];
    state.failCount = 0;
    state.hasFirstInput = false;
    state.locked = false;
    state.successRewardGiven = false;
    state.completeRewardGiven = false;
    state.vehicle = pickVehicle();

    chooseMission();
    renderBoard();
    showNotice('화살표를 눌러서 길을 만들어요!');
    playVoice('games.coding.intro');
    guideArrowButtons();
  }

  function renderBoard() {
    if (!state.container) return;

    const cellCount = state.gridSize * state.gridSize;
    const carFile = normalizeVehicleFile(state.vehicle?.file || state.vehicle?.src);
    const carName = state.vehicle?.name_ko || state.vehicle?.name || '자동차';
    const guideText = getArrowGuideText();
    const bottomGuideText = getGoGuideText();

    state.container.innerHTML = `
      <div class="${getRootClass()}">
        <div class="cc-top">
          <div class="cc-header">
            <div class="cc-title">🏁 ${escapeHtml(carName)}를 차고지로 보내요!</div>
          </div>

          <div class="cc-difficulty-row" aria-label="난이도 선택">
            ${Object.values(DIFFICULTIES).map((item) => `
              <button class="cc-diff-btn ${state.difficulty === item.id ? 'active' : ''}" type="button" data-difficulty="${item.id}">
                ${item.label}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="cc-map-container">
          <div
            class="cc-map grid-${state.gridSize}"
            style="--cc-grid-size:${state.gridSize}; --start-x:${state.startX}; --start-y:${state.startY}; --goal-x:${state.goalX}; --goal-y:${state.goalY};"
          >
            ${Array(cellCount).fill(0).map((_, index) => {
              const x = index % state.gridSize;
              const y = Math.floor(index / state.gridSize);
              return `<div class="cc-cell" data-cell-x="${x}" data-cell-y="${y}"></div>`;
            }).join('')}
            <div class="cc-start-flag"></div>
            <div class="cc-garage" id="ccGarage"></div>
            <div class="cc-car-wrapper" id="ccCar" style="transform: translate(${state.carX * 100}%, ${state.carY * 100}%);" role="button" aria-label="자동차">
              <img src="${escapeAttr(carFile)}" class="cc-car-img" alt="${escapeAttr(carName)}" draggable="false">
            </div>
          </div>
        </div>

        <div class="cc-ui-area">
          <div class="cc-guide-text" id="ccArrowGuide">${escapeHtml(guideText)}</div>

          <div class="cc-slots" id="ccSlots">
            ${Array(state.maxCommands).fill(0).map(() => '<div class="cc-slot"></div>').join('')}
          </div>

          <div class="cc-controls ${state.commands.length === 0 && !state.locked ? 'need-input' : ''}" id="ccControls">
            ${Object.keys(DIRS).map((dir) => `
              <button class="cc-btn-arrow" type="button" data-dir="${dir}" aria-label="${escapeAttr(DIRS[dir].label)}">
                <span class="cc-arrow-fallback" aria-hidden="true">${DIRS[dir].emoji}</span>
                <img src="./assets/games/codingCar/arrow-${dir}.webp" alt="${escapeAttr(DIRS[dir].label)}">
              </button>
            `).join('')}
          </div>

          <div class="cc-bottom-guide" id="ccGoGuide">${escapeHtml(bottomGuideText)}</div>

          <div class="cc-bottom-actions">
            <button class="cc-btn-edit" type="button" data-action="undo">↩ 하나</button>
            <button class="cc-btn-edit" type="button" data-action="clear">🧹 지우기</button>
            <button class="cc-btn-go" type="button" id="ccGoBtn" disabled>GO!</button>
          </div>
        </div>
      </div>
    `;

    bindEvents();
    updateSlotsUI();
    updateGuideUI();
    updateGoButton();
    checkGarageImageFallback();
  }

  function bindEvents() {
    const root = state.container?.querySelector('.cc-root');
    if (!root) return;

    root.querySelectorAll('.cc-diff-btn').forEach((button) => {
      button.addEventListener('click', () => {
        if (state.locked) return;
        setDifficulty(button.dataset.difficulty);
      });
    });

    root.querySelector('#ccCar')?.addEventListener('click', () => {
      if (state.locked) return;
      guideUseArrows();
    });

    root.querySelectorAll('.cc-btn-arrow').forEach((button) => {
      button.addEventListener('click', () => {
        if (state.locked || state.commands.length >= state.maxCommands) return;

        const dir = button.dataset.dir;
        if (!DIRS[dir]) return;

        state.commands.push(dir);
        state.hasFirstInput = true;
        vibrate(10);
        playSound('sfx.pop');
        showNotice(`${DIRS[dir].emoji} ${DIRS[dir].label}!`);
        wiggleCar(dir);
        updateSlotsUI();
        updateGuideUI();
        updateGoButton();

        if (state.commands.length >= state.maxCommands) {
          showNotice('이제 GO!');
        } else if (state.commands.length === 1) {
          showNotice('좋아! 하나 더!');
        }
      });
    });

    root.querySelectorAll('.cc-btn-arrow img').forEach((img) => {
      img.addEventListener('error', () => {
        img.classList.add('is-hidden');
      });
    });

    root.querySelectorAll('.cc-slot').forEach((slot, index) => {
      slot.addEventListener('click', () => {
        if (state.locked) return;
        if (state.commands.length > 0 && index === state.commands.length - 1) {
          undoCommand();
        }
      });
    });

    root.querySelector('[data-action="undo"]')?.addEventListener('click', () => {
      if (state.locked) return;
      undoCommand();
    });

    root.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
      if (state.locked) return;
      clearCommands();
    });

    root.querySelector('#ccGoBtn')?.addEventListener('click', () => {
      if (state.locked || state.commands.length === 0) return;
      executeCommands();
    });

    root.querySelector('.cc-car-img')?.addEventListener('error', (event) => {
      event.currentTarget.src = './assets/vehicles/fire/pump_engine.webp';
    });
  }

  function checkGarageImageFallback() {
    const garage = state.container?.querySelector('#ccGarage');
    if (!garage) return;

    const probe = new Image();
    probe.onload = () => {
      if (garage.isConnected) garage.classList.add('has-image');
    };
    probe.onerror = () => {
      if (garage.isConnected) garage.classList.remove('has-image');
    };
    probe.src = './assets/games/codingCar/garage.png';
  }

  function getArrowGuideText() {
    if (state.locked) return '자동차가 움직이고 있어요!';
    if (state.commands.length === 0) return '먼저 화살표를 눌러요 👇';
    if (state.commands.length >= state.maxCommands) return '화살표가 꽉 찼어요!';
    return '좋아요! 길을 더 만들 수 있어요';
  }

  function getGoGuideText() {
    if (state.locked) return '잠깐만 기다려요';
    if (state.commands.length === 0) return '화살표를 먼저 눌러요';
    return '이제 GO를 눌러요!';
  }

  function updateGuideUI() {
    const arrowGuide = state.container?.querySelector('#ccArrowGuide');
    const goGuide = state.container?.querySelector('#ccGoGuide');
    const controls = state.container?.querySelector('#ccControls');

    if (arrowGuide) arrowGuide.textContent = getArrowGuideText();
    if (goGuide) goGuide.textContent = getGoGuideText();
    if (controls) controls.classList.toggle('need-input', state.commands.length === 0 && !state.locked);
  }

  function guideArrowButtons() {
    updateGuideUI();
  }

  function guideUseArrows() {
    vibrate(10);
    playSound('sfx.pop');
    showNotice('아래 화살표를 눌러줘!');
    shakeCarGuide();
    updateGuideUI();
  }

  function shakeCarGuide() {
    const carEl = state.container?.querySelector('#ccCar');
    if (!carEl) return;

    carEl.classList.remove('is-guide-shake');
    void carEl.offsetWidth;
    carEl.classList.add('is-guide-shake');

    setManagedTimeout(() => {
      if (carEl.isConnected) carEl.classList.remove('is-guide-shake');
    }, 520);
  }

  function undoCommand() {
    if (!state.commands.length) return;
    state.commands.pop();
    state.hasFirstInput = state.commands.length > 0;
    vibrate(8);
    playSound('sfx.cancel');
    showNotice('하나 지웠어요!');
    updateSlotsUI();
    updateGuideUI();
    updateGoButton();
  }

  function clearCommands() {
    if (!state.commands.length) return;
    state.commands = [];
    state.hasFirstInput = false;
    vibrate([8, 25, 8]);
    playSound('sfx.cancel');
    showNotice('다시 만들어볼까요?');
    updateSlotsUI();
    updateGuideUI();
    updateGoButton();
  }

  function updateSlotsUI() {
    const slots = state.container?.querySelectorAll('.cc-slot') || [];

    slots.forEach((slot, i) => {
      slot.innerHTML = '';
      slot.classList.remove('active', 'running', 'bad');

      if (i < state.commands.length) {
        const dir = state.commands[i];
        slot.innerHTML = `
          <span class="cc-arrow-fallback" aria-hidden="true">${DIRS[dir]?.emoji || '➡️'}</span>
          <img src="./assets/games/codingCar/arrow-${escapeAttr(dir)}.webp" alt="${escapeAttr(DIRS[dir]?.label || dir)}">
        `;
        slot.classList.add('active');

        const img = slot.querySelector('img');
        img?.addEventListener('error', () => {
          img.classList.add('is-hidden');
        });
      }
    });
  }

  function updateGoButton() {
    const goBtn = state.container?.querySelector('#ccGoBtn');
    if (!goBtn) return;

    const enabled = state.commands.length > 0 && !state.locked;
    goBtn.disabled = !enabled;
    goBtn.classList.toggle('ready', enabled);
    goBtn.textContent = enabled ? 'GO 출발!' : 'GO!';
  }

  function showNotice(text) {
    if (!state.container) return;

    clearTimeout(state.noticeTimer);

    let notice = state.container.querySelector('.cc-speech');
    if (!notice) {
      notice = document.createElement('div');
      notice.className = 'cc-speech';
      state.container.querySelector('.cc-root')?.appendChild(notice);
    }

    notice.textContent = text;

    state.noticeTimer = setManagedTimeout(() => {
      if (notice && notice.parentNode) notice.remove();
      state.noticeTimer = null;
    }, 1500);
  }

  function wiggleCar(dir) {
    const carEl = state.container?.querySelector('#ccCar');
    if (!carEl || !DIRS[dir]) return;

    const baseX = state.carX * 100;
    const baseY = state.carY * 100;
    const dx = DIRS[dir].dx * 10;
    const dy = DIRS[dir].dy * 10;

    try {
      const anim = carEl.animate([
        { transform: `translate(${baseX}%, ${baseY}%) scale(1)` },
        { transform: `translate(${baseX + dx}%, ${baseY + dy}%) scale(1.05)` },
        { transform: `translate(${baseX}%, ${baseY}%) scale(1)` }
      ], { duration: 180, easing: 'ease-out' });

      anim.finished.catch(() => {});
    } catch (e) {
      carEl.style.transform = `translate(${baseX}%, ${baseY}%)`;
    }
  }

  async function executeCommands() {
    state.locked = true;
    updateGuideUI();
    updateGoButton();
    vibrate(20);
    playVoice('games.coding.go');
    showNotice('출발!');

    const carEl = state.container?.querySelector('#ccCar');
    if (!carEl) {
      state.locked = false;
      updateGuideUI();
      updateGoButton();
      return;
    }

    let bumped = false;
    let badIndex = -1;

    for (let i = 0; i < state.commands.length; i += 1) {
      if (state.destroyed || !carEl.isConnected) return;

      const dir = state.commands[i];
      const slots = state.container?.querySelectorAll('.cc-slot') || [];
      slots.forEach((slot) => slot.classList.remove('running'));
      slots[i]?.classList.add('running');

      const nextX = state.carX + DIRS[dir].dx;
      const nextY = state.carY + DIRS[dir].dy;

      if (nextX < 0 || nextX >= state.gridSize || nextY < 0 || nextY >= state.gridSize) {
        badIndex = i;
        bumped = true;
        await bumpAnimation(carEl, dir);
        if (state.destroyed || !carEl.isConnected) return;
        break;
      }

      await jumpAnimation(carEl, state.carX, state.carY, nextX, nextY);
      if (state.destroyed || !carEl.isConnected) return;

      state.carX = nextX;
      state.carY = nextY;

      await wait(170);
      if (state.destroyed || !carEl.isConnected) return;
    }

    const slots = state.container?.querySelectorAll('.cc-slot') || [];
    slots.forEach((slot) => slot.classList.remove('running'));

    checkResult(bumped, badIndex);
  }

  async function jumpAnimation(el, oldX, oldY, newX, newY) {
    vibrate(8);
    playSound('sfx.hop');

    const startX = oldX * 100;
    const startY = oldY * 100;
    const endX = newX * 100;
    const endY = newY * 100;
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    try {
      const anim = el.animate([
        { transform: `translate(${startX}%, ${startY}%) scale(1)` },
        { transform: `translate(${midX}%, calc(${midY}% - 20%)) scale(1.12)`, offset: 0.5 },
        { transform: `translate(${endX}%, ${endY}%) scale(1)` }
      ], { duration: 380, easing: 'ease-in-out' });

      await anim.finished;
    } catch (e) {}

    if (el.isConnected) {
      el.style.transform = `translate(${endX}%, ${endY}%)`;
    }
  }

  async function bumpAnimation(el, dir) {
    vibrate([30, 40, 30]);
    playSound('sfx.wrong');

    const currX = state.carX * 100;
    const currY = state.carY * 100;
    const bumpX = currX + (DIRS[dir].dx * 20);
    const bumpY = currY + (DIRS[dir].dy * 20);

    try {
      const anim = el.animate([
        { transform: `translate(${currX}%, ${currY}%)` },
        { transform: `translate(${bumpX}%, ${bumpY}%)`, offset: 0.3 },
        { transform: `translate(${currX}%, ${currY}%)` }
      ], { duration: 310, easing: 'ease-in-out' });

      await anim.finished;
    } catch (e) {}

    if (el.isConnected) {
      el.style.transform = `translate(${currX}%, ${currY}%)`;
    }
  }

  function checkResult(bumped, badIndex) {
    if (state.destroyed) return;

    if (!bumped && state.carX === state.goalX && state.carY === state.goalY) {
      showSuccess();
      return;
    }

    state.failCount += 1;
    vibrate([20, 40, 20]);
    playVoice('games.coding.fail');

    if (badIndex >= 0) {
      markBadSlot(badIndex);
      showNotice('쿵! 길 밖으로 나갔어요');
    } else {
      showNotice('아까워요! 화살표를 바꿔볼까?');
    }

    revealHintAfterFail();

    state.resetTimer = setManagedTimeout(() => {
      if (state.destroyed) return;
      resetCarToStart();

      if (state.difficulty === 'easy') {
        state.commands = [];
        state.hasFirstInput = false;
      }

      state.locked = false;
      updateSlotsUI();
      updateGuideUI();
      updateGoButton();

      if (state.difficulty === 'easy') {
        showNotice('다시 화살표를 눌러봐요!');
      } else {
        showNotice('하나 지우고 다시 눌러요!');
      }

      state.resetTimer = null;
    }, 1300);
  }

  function markBadSlot(index) {
    const slots = state.container?.querySelectorAll('.cc-slot') || [];
    if (slots[index]) slots[index].classList.add('bad');
  }

  function resetCarToStart() {
    const carEl = state.container?.querySelector('#ccCar');
    if (!carEl) return;

    state.carX = state.startX;
    state.carY = state.startY;
    carEl.style.transform = `translate(${state.startX * 100}%, ${state.startY * 100}%)`;
  }

  function revealHintAfterFail() {
    const cells = state.container?.querySelectorAll('.cc-cell') || [];
    cells.forEach((cell) => cell.classList.remove('path-hint'));

    if (state.failCount <= 0) return;

    const path = getSimplePath();
    const hintCount = state.failCount === 1 ? 1 : Math.min(path.length, 3);

    path.slice(0, hintCount).forEach((point) => {
      const cell = state.container?.querySelector(`.cc-cell[data-cell-x="${point.x}"][data-cell-y="${point.y}"]`);
      cell?.classList.add('path-hint');
    });
  }

  function getSimplePath() {
    const path = [];
    let x = state.startX;
    let y = state.startY;

    while (x !== state.goalX) {
      x += state.goalX > x ? 1 : -1;
      path.push({ x, y });
    }

    while (y !== state.goalY) {
      y += state.goalY > y ? 1 : -1;
      path.push({ x, y });
    }

    return path;
  }

  function showSuccess() {
    if (state.destroyed || !state.container || state.successRewardGiven) return;

    state.successRewardGiven = true;
    state.locked = true;

    if (state.options.fireConfetti) state.options.fireConfetti();
    state.options.gainExp?.(20);
    vibrate([30, 40, 30, 40, 60]);
    playVoice('games.coding.success');

    const carName = state.vehicle?.name_ko || state.vehicle?.name || '자동차';

    const overlay = document.createElement('div');
    overlay.className = 'cc-success-overlay';
    overlay.innerHTML = `
      <div class="cc-success-box">
        <div class="cc-success-icon">🏁🎉</div>
        <div class="cc-success-title">${escapeHtml(carName)} 도착!<br>완벽해!</div>
        <div class="cc-success-actions">
          <button class="cc-success-btn cc-success-next" type="button" data-action="next">다음 길!</button>
          <button class="cc-success-btn cc-success-retry" type="button" data-action="retry">다시 하기</button>
          <button class="cc-success-btn cc-success-home" type="button" data-action="home">홈</button>
        </div>
      </div>
    `;

    state.container?.querySelector('.cc-root')?.appendChild(overlay);

    overlay.querySelector('[data-action="next"]')?.addEventListener('click', () => {
      vibrate(15);
      startGame();
    });

    overlay.querySelector('[data-action="retry"]')?.addEventListener('click', () => {
      vibrate(10);
      retrySameMission();
    });

    overlay.querySelector('[data-action="home"]')?.addEventListener('click', () => {
      vibrate(8);
      if (state.options.closeToParkHome) state.options.closeToParkHome();
    });
  }

  function retrySameMission() {
    if (!state.container) return;

    clearTimers();

    state.commands = [];
    state.failCount = 0;
    state.hasFirstInput = false;
    state.locked = false;
    state.successRewardGiven = false;
    state.completeRewardGiven = false;
    state.carX = state.startX;
    state.carY = state.startY;

    renderBoard();
    showNotice('같은 길을 다시 해봐요!');
  }

  async function render(container, options = {}) {
    destroy();

    state.container = container;
    state.options = options;
    state.destroyed = false;
    state.layoutMode = getLayoutMode();
    state.successRewardGiven = false;
    state.completeRewardGiven = false;

    injectStyle();
    bindLayoutEvents();

    container.innerHTML = `
      <div class="${getRootClass()}">
        <div class="memory-loading" style="flex:1; display:grid; place-items:center; padding:30px; text-align:center; color:#17324a; font-size:24px; font-weight:900;">
          자동차 부르는 중...
        </div>
      </div>
    `;

    state.vehicles = await fetchVehicles();
    if (state.destroyed) return;

    startGame();
  }

  function clearTimers() {
    clearTimeout(state.noticeTimer);
    clearTimeout(state.resetTimer);
    if (state.resizeTimer) window.clearTimeout(state.resizeTimer);
    state.timers.forEach((timerId) => window.clearTimeout(timerId));
    state.noticeTimer = null;
    state.resetTimer = null;
    state.resizeTimer = null;
    state.timers = [];
  }

  function wait(ms) {
    return new Promise((resolve) => {
      const id = window.setTimeout(() => {
        state.timers = state.timers.filter((timerId) => timerId !== id);
        resolve();
      }, ms);
      state.timers.push(id);
    });
  }

  function destroy() {
    clearTimers();
    unbindLayoutEvents();

    state.destroyed = true;

    if (state.container) state.container.innerHTML = '';

    state.container = null;
    state.options = {};
    state.vehicle = null;
    state.commands = [];
    state.locked = false;
    state.hasFirstInput = false;
    state.successRewardGiven = false;
    state.completeRewardGiven = false;
  }

  function escapeAttr(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
})();