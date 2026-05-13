/**
 * 시현이 놀이터 OS — 럭셔리 자동차 정비소 (Premium Car Garage)
 * 파일: js/games/car-garage.js
 * 버전: 4살 시현이 맞춤형 화사한 v4.0 (자유도, UI/UX 강조, 대왕버튼 적용)
 */

(function () {
  const GAME_KEY = 'carGarage';
  const STYLE_ID = 'sihyeon-car-garage-style';

  // 1. 차량별 맞춤형 데이터
  const VEHICLE_META = {
    fire:      { name: '소방차', emoji: '🚒', tasks: ['wheel', 'wash', 'siren'], action: 'fire_fin' },
    police:    { name: '경찰차', emoji: '🚓', tasks: ['wheel', 'light', 'siren'], action: 'police_fin' },
    bus:       { name: '버스',   emoji: '🚌', tasks: ['wheel', 'light', 'wash'],  action: 'bus_fin' },
    ambulance: { name: '구급차', emoji: '🚑', tasks: ['wheel', 'light', 'gas'],   action: 'amb_fin' },
    rocket:    { name: '로켓카', emoji: '🚀', tasks: ['wheel', 'gas', 'light'],   action: 'rocket_fin' }
  };

  const TASK_ICONS = {
    wheel: '⚙️',
    light: '💡',
    wash:  '🧼',
    gas:   '⛽',
    siren: '🚨'
  };

  const state = {
    container: null,
    options: {},
    currentVehicle: null,
    phase: 'arrival', // arrival -> repair -> tuning -> photo
    completedTasks: [], // ★ 순서 상관없이 완료한 태스크 배열
    audioCtx: null,
    destroyed: false,
    locked: false, // 연속 클릭 방지용
    layoutMode: 'portrait',
    resizeTimer: null,
    handleResizeBound: null,
    timers: [],
    successRewardGiven: false,
    completeRewardGiven: false,
    skipNextSpeak: false
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
    return `cg-root car-garage-root car-garage-${state.layoutMode}`;
  }

  function applyRootLayoutClass() {
    const root = state.container?.querySelector('.cg-root');
    if (!root) return;
    const nextMode = getLayoutMode();
    root.classList.remove('car-garage-portrait', 'car-garage-landscape');
    root.classList.add(`car-garage-${nextMode}`);
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

  function setManagedTimeout(fn, delay) {
    const id = window.setTimeout(() => {
      state.timers = state.timers.filter((timerId) => timerId !== id);
      if (!state.destroyed) fn();
    }, delay);
    state.timers.push(id);
    return id;
  }

  function clearTimers() {
    state.timers.forEach((id) => window.clearTimeout(id));
    state.timers = [];
    if (state.resizeTimer) {
      window.clearTimeout(state.resizeTimer);
      state.resizeTimer = null;
    }
  }

  // ─── 오디오 합성 유틸리티 ──────────────────────────
  function initAudio() {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    if (!state.audioCtx) state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume().catch?.(() => {});
  }

  function playComplexSound(type) {
    if (!state.audioCtx) return;
    const ctx = state.audioCtx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);

    switch(type) {
      case 'wheel': // 칙칙칙!
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        osc.start(); osc.stop(now + 0.1);
        break;
      case 'light': // 띠링!
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        osc.start(); osc.stop(now + 0.2);
        break;
      case 'gas': // 푸우우웅!
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(450, now + 0.8);
        gain.gain.setValueAtTime(0.2, now);
        osc.start(); osc.stop(now + 0.8);
        break;
      default:
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.1, now);
        osc.start(); osc.stop(now + 0.2);
    }
  }

  function vibrate(p) { if (navigator.vibrate) try { navigator.vibrate(p); } catch(e) {} }

  // ─── 초호화 화사한 CSS 스타일 ────────────────────────────────
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .cg-root {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        background: linear-gradient(180deg, #E3F2FD 0%, #FFF9C4 100%);
        font-family: 'Jua', sans-serif;
        position: relative;
        overflow: hidden;
        user-select: none;
        touch-action: none;
        transition: filter 0.2s ease-in-out;
        box-sizing: border-box;
      }

      .cg-root * {
        box-sizing: border-box;
      }

      .car-garage-root {
        color: #17324A;
      }

      .cg-floor {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 35%;
        background: linear-gradient(180deg, #CFD8DC 0%, #90A4AE 100%);
        border-top: 8px solid #FFCA28;
        box-shadow: 0 -10px 25px rgba(255, 202, 40, 0.4);
        pointer-events: none;
      }

      .cg-info-panel {
        position: relative;
        z-index: 120;
        flex-shrink: 0;
        display: grid;
        gap: 7px;
        padding: max(10px, env(safe-area-inset-top)) 12px 8px;
      }

      .cg-info-title {
        min-height: 48px;
        display: grid;
        place-items: center;
        padding: 8px 16px;
        border-radius: 999px;
        border: 5px solid #fff;
        background: rgba(255,255,255,0.9);
        box-shadow: 0 7px 0 rgba(0,0,0,0.13);
        color: #17324A;
        font-size: clamp(21px, 5.6vw, 34px);
        font-weight: 900;
        line-height: 1.08;
        text-align: center;
      }

      .cg-progress-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        min-height: 42px;
        flex-wrap: wrap;
      }

      .cg-progress-chip {
        min-width: 52px;
        min-height: 42px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        border: 4px solid #fff;
        background: rgba(255,255,255,0.72);
        box-shadow: 0 5px 0 rgba(0,0,0,0.12);
        font-size: clamp(22px, 6vw, 34px);
        filter: grayscale(0.6);
        opacity: 0.68;
      }

      .cg-progress-chip.done {
        background: linear-gradient(180deg, #ffffff 0%, #B9F6CA 100%);
        filter: none;
        opacity: 1;
      }

      .cg-progress-chip.target {
        background: linear-gradient(180deg, #ffffff 0%, #FFE082 100%);
        filter: none;
        opacity: 1;
        animation: cgChipPulse 0.9s ease-in-out infinite alternate;
      }

      @keyframes cgChipPulse {
        from { transform: translateY(0) scale(1); }
        to { transform: translateY(-3px) scale(1.06); }
      }

      .cg-stage {
        flex: 1;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        min-height: 0;
      }

      .cg-car-unit {
        position: relative;
        transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .cg-car-body {
        font-size: clamp(160px, 45vw, 300px);
        position: relative;
        z-index: 5;
        filter: drop-shadow(0 15px 25px rgba(0,0,0,0.3));
        transition: filter 0.5s, transform 0.3s;
      }
      
      /* 자동차 피드백 클래스 */
      .cg-car-body.is-clean { filter: drop-shadow(0 0 40px #FFF) brightness(1.2); }
      .cg-car-body.is-powered { animation: carPulse 2s infinite alternate; }
      @keyframes carPulse { from { filter: brightness(1); } to { filter: brightness(1.25) drop-shadow(0 0 35px #FFD700); } }
      .cg-car-body.happy-jump { animation: happyJump 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      @keyframes happyJump { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3) translateY(-50px) rotate(-5deg); } }

      /* 도구 바 (툴박스) */
      .cg-toolbox {
        min-height: 140px;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        border-top: 5px solid #FF9800;
        z-index: 100;
        padding: 10px calc(10px + env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) calc(10px + env(safe-area-inset-left));
        flex-wrap: wrap;
        box-shadow: 0 -5px 20px rgba(0,0,0,0.1);
      }

      /* 기본 도구 버튼 */
      .cg-tool-btn {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: #fff;
        border: 5px solid #ddd;
        font-size: 40px;
        display: grid;
        place-items: center;
        box-shadow: 0 6px 0 #ccc;
        transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        cursor: pointer;
        touch-action: manipulation;
        font-family: inherit;
      }

      /* ★ 4살 시현이 맞춤! 반드시 눌러야 하는 타겟 버튼 엄청난 강조! */
      .cg-tool-btn.is-target {
        border-color: #FF6B6B;
        background: #FFF9E6;
        box-shadow: 0 8px 0 #E63946, 0 0 20px rgba(255,107,107,0.6);
        transform: scale(1.15);
        animation: ultraPulse 1.5s infinite;
        z-index: 10;
      }

      @keyframes ultraPulse {
        0% { transform: scale(1.15); box-shadow: 0 8px 0 #E63946, 0 0 0 0 rgba(255,107,107,0.7); }
        50% { transform: scale(1.25); box-shadow: 0 8px 0 #E63946, 0 0 0 20px rgba(255,107,107,0); border-color: #FF3B3B; }
        100% { transform: scale(1.15); box-shadow: 0 8px 0 #E63946, 0 0 0 0 rgba(255,107,107,0); }
      }

      /* 당장 안 눌러도 되는 버튼은 흐릿하게 (시선 분산 방지) */
      .cg-tool-btn.is-dimmed {
        opacity: 0.4;
        filter: grayscale(100%);
        transform: scale(0.85);
        box-shadow: 0 3px 0 #ccc;
        pointer-events: none;
      }
      
      /* 다 고친 버튼 (체크표시) */
      .cg-tool-btn.is-done {
        background: #E8F5E9;
        border-color: #4CAF50;
        box-shadow: 0 6px 0 #2E7D32;
        font-size: 45px;
        transform: scale(0.9);
        pointer-events: none;
      }

      .cg-tool-btn:active { transform: translateY(6px) scale(0.95); box-shadow: 0 2px 0 #ccc; }
      .cg-tool-btn.is-target:active { box-shadow: 0 2px 0 #E63946; }

      /* ★ 튜닝 후 거대한 출동 버튼 */
      .cg-go-btn {
        width: 90%;
        height: 90px;
        border-radius: 45px;
        background: linear-gradient(180deg, #4CAF50 0%, #2E7D32 100%);
        border: 6px solid #fff;
        box-shadow: 0 8px 0 #1B5E20, 0 10px 20px rgba(0,0,0,0.2);
        color: white;
        font-size: 40px;
        font-weight: 900;
        font-family: inherit;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px;
        animation: pulseGo 1s infinite alternate;
        cursor: pointer;
        touch-action: manipulation;
      }

      .cg-go-btn:active { transform: translateY(8px); box-shadow: 0 0 0 #1B5E20; }
      @keyframes pulseGo { from { transform: scale(1); } to { transform: scale(1.05); } }

      /* 세차 거품 */
      .cg-bubbles {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 6;
        display: block;
      }

      .cg-bubble-item {
        position: absolute;
        background: rgba(255,255,255,0.9);
        border-radius: 50%;
        border: 2px solid #E3F2FD;
        animation: bubbleUp 0.8s forwards;
      }

      @keyframes bubbleUp { 0% { transform: scale(0) translateY(0); opacity: 1; } 100% { transform: scale(2) translateY(-200px); opacity: 0; } }

      /* 말풍선 */
      .cg-speech {
        position: absolute;
        top: 10%;
        left: 50%;
        transform: translateX(-50%);
        background: #fff;
        padding: 15px 40px;
        border-radius: 40px;
        font-size: 38px;
        font-weight: 900;
        color: #17324A;
        border: 6px solid #FF9800;
        box-shadow: 0 15px 30px rgba(0,0,0,0.2);
        z-index: 150;
        white-space: nowrap;
        animation: cgPopIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .cg-speech::after {
        content: '';
        position: absolute;
        bottom: -20px;
        left: 50%;
        transform: translateX(-50%);
        border-width: 20px 15px 0;
        border-style: solid;
        border-color: #FF9800 transparent transparent;
      }

      @keyframes cgPopIn { from { transform: translateX(-50%) scale(0); opacity: 0; } to { transform: translateX(-50%) scale(1); opacity: 1; } }
      
      /* 데코레이션 */
      .cg-deco-item {
        position: absolute;
        font-size: 75px;
        z-index: 15;
        pointer-events: none;
        filter: drop-shadow(0 5px 10px rgba(0,0,0,0.3));
        animation: popDeco 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      @keyframes popDeco { from { transform: scale(0) rotate(-30deg); } to { transform: scale(1) rotate(0); } }

      /* 완료 패널 */
      .cg-success-panel {
        position: absolute;
        inset: 0;
        z-index: 200;
        display: grid;
        place-items: center;
        padding: 20px;
        background: rgba(0,0,0,0.4);
        backdrop-filter: blur(5px);
        animation: fadeIn 0.4s ease-out;
      }

      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

      .cg-success-box {
        width: min(92vw, 520px);
        border-radius: 35px;
        background: #fff;
        border: 8px solid #FFD700;
        box-shadow: 0 15px 0 rgba(200,150,0,0.5);
        padding: 30px 20px;
        text-align: center;
        display: grid;
        gap: 20px;
      }

      .cg-success-icon { font-size: 100px; animation: happyJump 1s infinite; }
      .cg-success-title { font-size: clamp(32px, 8vw, 48px); font-weight: 900; color: #17324a; margin: 0; }
      .cg-success-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }

      .cg-panel-btn {
        min-height: 65px;
        border-radius: 999px;
        font-size: 22px;
        font-weight: 900;
        border: 5px solid #fff;
        cursor: pointer;
        box-shadow: 0 6px 0 rgba(0,0,0,0.2);
        font-family: inherit;
        touch-action: manipulation;
      }

      .cg-panel-btn.restart { background: #FF9800; color: white; }
      .cg-panel-btn.home { background: #4FC3F7; color: white; }
      .cg-panel-btn:active { transform: translateY(6px); box-shadow: 0 0 0 rgba(0,0,0,0); }

      .car-garage-portrait {
        display: flex;
        flex-direction: column;
      }

      .car-garage-landscape {
        display: grid;
        grid-template-columns: minmax(220px, 24vw) minmax(360px, 1fr) minmax(270px, 30vw);
        grid-template-rows: 1fr;
        gap: 12px;
        padding: max(10px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
      }

      .car-garage-landscape .cg-floor {
        height: 42%;
      }

      .car-garage-landscape .cg-info-panel {
        grid-column: 1;
        grid-row: 1;
        height: 100%;
        min-height: 0;
        padding: 14px;
        align-content: start;
        justify-content: stretch;
        border-radius: 32px;
        border: 5px solid rgba(255,255,255,0.72);
        background: rgba(255,255,255,0.46);
        box-shadow: inset 0 2px 0 rgba(255,255,255,0.34), 0 14px 30px rgba(0,0,0,0.13);
      }

      .car-garage-landscape .cg-info-title {
        min-height: 106px;
        padding: 18px 14px;
        border-radius: 30px;
        font-size: clamp(24px, 2.7vw, 38px);
        line-height: 1.16;
      }

      .car-garage-landscape .cg-progress-row {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }

      .car-garage-landscape .cg-progress-chip {
        min-width: 0;
        width: 100%;
        min-height: clamp(58px, 9vh, 82px);
        font-size: clamp(28px, 3.4vw, 46px);
        border-radius: 24px;
      }

      .car-garage-landscape .cg-stage {
        grid-column: 2;
        grid-row: 1;
        min-height: 0;
        overflow: hidden;
        border-radius: 36px;
        border: 5px solid rgba(255,255,255,0.38);
        background: rgba(255,255,255,0.14);
      }

      .car-garage-landscape .cg-car-body {
        font-size: clamp(190px, 30vw, 390px);
      }

      .car-garage-landscape .cg-speech {
        top: max(22px, env(safe-area-inset-top));
        width: min(92%, 620px);
        padding: 14px 22px;
        font-size: clamp(24px, 3vw, 42px);
        text-align: center;
      }

      .car-garage-landscape .cg-toolbox {
        grid-column: 3;
        grid-row: 1;
        height: 100%;
        min-height: 0;
        align-content: center;
        align-items: center;
        justify-content: center;
        flex-direction: row;
        border-top: 0;
        border: 5px solid rgba(255,255,255,0.82);
        border-radius: 32px;
        padding: 16px max(14px, env(safe-area-inset-right)) 16px 14px;
        overflow: hidden auto;
      }

      .car-garage-landscape .cg-tool-btn {
        width: clamp(82px, 10vw, 112px);
        height: clamp(82px, 10vw, 112px);
        font-size: clamp(40px, 5vw, 62px);
      }

      .car-garage-landscape .cg-go-btn {
        width: 100%;
        height: clamp(82px, 12vh, 110px);
        font-size: clamp(30px, 3vw, 46px);
      }

      .car-garage-landscape .cg-success-box {
        width: min(720px, 72vw);
      }

      @media (max-width: 620px) {
        .cg-info-panel {
          padding: max(8px, env(safe-area-inset-top)) 8px 6px;
          gap: 5px;
        }

        .cg-info-title {
          min-height: 42px;
          padding: 7px 12px;
          border-width: 4px;
        }

        .cg-progress-row {
          gap: 6px;
          min-height: 36px;
        }

        .cg-progress-chip {
          min-width: 44px;
          min-height: 36px;
          border-width: 3px;
        }

        .cg-car-body {
          font-size: clamp(138px, 43vw, 260px);
        }

        .cg-toolbox {
          min-height: 116px;
          gap: 9px;
          padding-top: 8px;
          border-top-width: 4px;
        }

        .cg-tool-btn {
          width: clamp(64px, 18vw, 78px);
          height: clamp(64px, 18vw, 78px);
          font-size: clamp(31px, 9vw, 40px);
          border-width: 4px;
        }

        .cg-go-btn {
          height: 76px;
          font-size: clamp(28px, 8vw, 38px);
          border-width: 5px;
        }

        .cg-speech {
          top: 8%;
          padding: 11px 20px;
          border-width: 5px;
          font-size: clamp(24px, 7vw, 34px);
        }

        .cg-success-actions {
          grid-template-columns: 1fr;
        }
      }

      @media (max-height: 690px) {
        .cg-info-panel {
          padding-top: 6px;
          gap: 4px;
        }

        .cg-info-title {
          min-height: 36px;
          font-size: 20px;
        }

        .cg-progress-row {
          min-height: 32px;
        }

        .cg-progress-chip {
          min-height: 32px;
          min-width: 40px;
          font-size: 25px;
        }

        .cg-car-body {
          font-size: clamp(120px, 36vw, 230px);
        }

        .cg-toolbox {
          min-height: 98px;
          gap: 7px;
        }

        .cg-tool-btn {
          width: clamp(58px, 15vw, 72px);
          height: clamp(58px, 15vw, 72px);
          font-size: 32px;
        }

        .cg-go-btn {
          height: 68px;
          font-size: 30px;
        }

        .cg-speech {
          top: 7%;
          font-size: 26px;
          padding: 10px 20px;
        }

        .car-garage-landscape .cg-info-title {
          min-height: 76px;
          font-size: clamp(19px, 2.3vw, 30px);
        }

        .car-garage-landscape .cg-progress-chip {
          min-height: clamp(46px, 8vh, 64px);
        }

        .car-garage-landscape .cg-car-body {
          font-size: clamp(160px, 27vw, 320px);
        }

        .car-garage-landscape .cg-tool-btn {
          width: clamp(70px, 9vw, 92px);
          height: clamp(70px, 9vw, 92px);
          font-size: clamp(34px, 4.4vw, 52px);
        }

        .car-garage-landscape .cg-go-btn {
          height: clamp(66px, 10vh, 88px);
          font-size: clamp(24px, 2.7vw, 36px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  function getPhaseText() {
    if (state.phase === 'repair') return '고쳐줄 차례예요';
    if (state.phase === 'tuning') return '예쁘게 꾸며요';
    if (state.phase === 'photo') return '출동 준비 완료';
    return '정비소에 왔어요';
  }

  function getProgressHTML() {
    const v = state.currentVehicle;
    if (!v) return '';

    if (state.phase === 'tuning') {
      return '<span class="cg-progress-chip done">✅</span><span class="cg-progress-chip target">🎀</span><span class="cg-progress-chip target">🚀</span>';
    }

    if (state.phase === 'photo') {
      return '<span class="cg-progress-chip done">🏆</span><span class="cg-progress-chip done">🚀</span>';
    }

    return v.tasks.map((task) => {
      const done = state.completedTasks.includes(task);
      return `<span class="cg-progress-chip ${done ? 'done' : 'target'}">${done ? '✅' : TASK_ICONS[task]}</span>`;
    }).join('');
  }

  // ─── 게임 진행 엔진 ──────────────────────────────────────
  
  function startVehicle() {
    if (state.destroyed) return;
    clearTimers();

    const keys = Object.keys(VEHICLE_META);
    const key = keys[Math.floor(Math.random() * keys.length)];
    state.currentVehicle = { ...VEHICLE_META[key], id: key };
    state.completedTasks = []; // 작업 초기화
    state.phase = 'repair';
    state.locked = false;
    state.successRewardGiven = false;
    state.completeRewardGiven = false;
    
    renderUI();
    vibrate(100);
    playGarageVoice('games.car.intro', `시현아, ${state.currentVehicle.name}가 수리하러 왔어!`);
    speak(`시현아, ${state.currentVehicle.name}가 수리하러 왔어!`);
  }

  function renderUI() {
    if (!state.container || state.destroyed) return;
    const root = state.container.querySelector('.cg-root');
    if (!root) {
      state.container.innerHTML = `<div class="${getRootClass()}"></div>`;
      return renderUI();
    }

    applyRootLayoutClass();

    const v = state.currentVehicle;

    // 말풍선 텍스트 로직
    let speechText = '';
    if (state.phase === 'repair') {
      speechText = '시현아, 고쳐줘! 🔧';
    } else if (state.phase === 'tuning') {
      speechText = '스티커를 붙여볼까? 🎀';
    } else {
      speechText = '출발!! 🚀';
    }

    // 툴박스(하단 바) 그리기 로직
    let toolboxHTML = '';
    if (state.phase === 'repair') {
      const requiredTasks = v.tasks;
      toolboxHTML = Object.keys(TASK_ICONS).map(t => {
        const isDone = state.completedTasks.includes(t);
        const isTarget = requiredTasks.includes(t) && !isDone;
        
        let classes = 'cg-tool-btn';
        if (isTarget) classes += ' is-target';      // 꼭 눌러야 하는 버튼!
        else if (isDone) classes += ' is-done';     // 이미 완료함
        else classes += ' is-dimmed';               // 이번 차엔 필요 없음

        const icon = isDone ? '✅' : TASK_ICONS[t];
        return `<button class="${classes}" data-task="${t}">${icon}</button>`;
      }).join('');
    } else if (state.phase === 'tuning') {
      const decos = ['🕶️', '👑', '🎀', '💎', '🔥', '🍀'];
      toolboxHTML = decos.map(d => `<button class="cg-tool-btn" style="border-color:#4FC3F7; color:black;" data-deco="${d}">${d}</button>`).join('');
      toolboxHTML += `<button class="cg-go-btn" id="btnGo">🚀 빵빵! 출동하기</button>`;
    }

    // 화면 렌더링
    root.innerHTML = `
      <div class="cg-floor"></div>
      <div class="cg-info-panel">
        <div class="cg-info-title">${v.emoji} ${v.name}<br>${getPhaseText()}</div>
        <div class="cg-progress-row">${getProgressHTML()}</div>
      </div>
      <div class="cg-stage">
        <div class="cg-car-unit" id="carUnit">
          <div class="cg-bubbles" id="bubbleLayer"></div>
          <div class="cg-car-body" id="carBody">${v.emoji}</div>
          <div id="decoLayer"></div>
        </div>
        <div class="cg-speech" id="speechBubble">${speechText}</div>
      </div>
      <div class="cg-toolbox">
        ${toolboxHTML}
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    const root = state.container;
    if (!root) return;

    // 수리 도구 버튼 이벤트
    root.querySelectorAll('.cg-tool-btn[data-task]').forEach(btn => {
      btn.onclick = () => {
        if (state.phase !== 'repair' || state.locked) return;
        const selectedTask = btn.dataset.task;
        const v = state.currentVehicle;

        // 타겟인지 확인 (자유 순서!)
        const isTarget = v.tasks.includes(selectedTask);
        const isAlreadyDone = state.completedTasks.includes(selectedTask);

        if (isAlreadyDone) return; // 이미 한 건 무시

        if (isTarget) {
          handleRepairSuccess(selectedTask);
        } else {
          handleRepairWrong(btn);
        }
      };
    });

    // 스티커(튜닝) 버튼 이벤트
    root.querySelectorAll('.cg-tool-btn[data-deco]').forEach(btn => {
      btn.onclick = () => {
        if (state.phase !== 'tuning' || state.locked) return;
        addDecoration(btn.dataset.deco);
      };
    });

    // 거대한 출동 버튼
    root.querySelector('#btnGo')?.addEventListener('click', startFinale);
  }

  function handleRepairSuccess(task) {
    if (state.locked || state.destroyed || !state.currentVehicle) return;

    state.locked = true;
    initAudio();
    vibrate(70);
    playComplexSound(task);
    
    state.completedTasks.push(task); // 완료 목록에 추가

    const carBody = state.container.querySelector('#carBody');
    const speech = state.container.querySelector('#speechBubble');
    if (speech) speech.textContent = '우와! 최고야! 😍';

    // 부품별 시현이 맞춤 칭찬 보이스
    if (task === 'wheel') { playGarageVoice('games.car.wheel', "시현아, 바퀴를 튼튼하게 달았어!"); speak("시현아, 바퀴를 튼튼하게 달았어!"); }
    else if (task === 'light') { playGarageVoice('games.car.light', "반짝반짝! 불이 들어왔네!"); speak("반짝반짝! 불이 들어왔네!"); }
    else if (task === 'wash') { playGarageVoice('games.car.wash', "보글보글! 자동차가 깨끗해졌어!"); speak("보글보글~ 자동차가 깨끗해졌어!"); }
    else if (task === 'gas') { playGarageVoice('games.car.fuel', "시현이가 기름을 빵빵하게 채웠어!"); speak("시현이가 기름을 빵빵하게 채웠어!"); }
    else if (task === 'siren') { playGarageVoice('games.car.siren', "삐용삐용! 사이렌 소리가 들려!"); speak("삐용삐용! 사이렌 소리가 들려!"); }

    // 시각 리액션
    carBody.classList.add('happy-jump');
    if (task === 'wash') {
      showBubbles();
      carBody.classList.add('is-clean');
    } else {
      carBody.classList.add('is-powered');
      setManagedTimeout(() => {
        if (carBody.isConnected) carBody.classList.remove('is-powered');
      }, 2000);
    }
    setManagedTimeout(() => {
      if (carBody.isConnected) carBody.classList.remove('happy-jump');
    }, 600);

    // 모두 고쳤는지 확인
    if (state.completedTasks.length >= state.currentVehicle.tasks.length) {
      setManagedTimeout(() => {
        if (state.destroyed) return;
        state.phase = 'tuning';
        state.locked = false;
        playGarageVoice('games.car.decorate', "시현아, 다 고쳤어! 이제 예쁜 스티커로 꾸며주자!");
        speak("시현아, 다 고쳤어! 이제 예쁜 스티커로 꾸며주자!");
        renderUI();
      }, 1500); // 칭찬 충분히 듣고 넘어감
    } else {
      setManagedTimeout(() => {
        if (state.destroyed) return;
        state.locked = false;
        renderUI();
      }, 1500);
    }
  }

  function handleRepairWrong(btn) {
    // 타겟이 아닌 버튼을 누른 경우 (사실상 is-dimmed 라 눌리지 않지만 만약을 대비해)
    playGarageVoice('games.car.wrong', "시현아, 그건 지금 안 필요해. 반짝이는 걸 눌러볼까?");
    speak("시현아, 그건 지금 안 필요해~ 반짝이는 걸 눌러볼까?");
  }

  function showBubbles() {
    const layer = state.container?.querySelector('#bubbleLayer');
    if (!layer) return;
    for(let i=0; i<20; i++) {
      const b = document.createElement('div');
      b.className = 'cg-bubble-item';
      b.style.left = Math.random() * 90 + '%';
      b.style.top = Math.random() * 80 + '%';
      const s = Math.random() * 30 + 20 + 'px'; // 더 큰 거품
      b.style.width = s;
      b.style.height = s;
      layer.appendChild(b);
      setManagedTimeout(() => {
        if (b.isConnected) b.remove();
      }, 800);
    }
  }

  function addDecoration(decoEmoji) {
    initAudio();
    vibrate(30);
    const layer = state.container?.querySelector('#decoLayer');
    if (!layer) return;
    const d = document.createElement('div');
    d.className = 'cg-deco-item';
    d.textContent = decoEmoji;
    d.style.left = (Math.random() * 70 + 5) + '%';
    d.style.top = (Math.random() * 50) + '%';
    layer.appendChild(d);
    playComplexSound('light');
  }

  function startFinale() {
    if (state.destroyed || state.locked || state.phase !== 'tuning') return;

    state.phase = 'photo';
    state.locked = true;
    vibrate(300);
    const speech = state.container.querySelector('#speechBubble');
    if (speech) speech.textContent = '출발 준비 완료! 🚀';
    playGarageVoice('games.car.complete', "시현아, 자동차가 출발한다! 안녕!");
    speak("시현아, 자동차가 출발한다! 안녕~");

    setManagedTimeout(() => {
      performSpecialAction();
    }, 800);
  }

  function performSpecialAction() {
    if (state.destroyed || !state.currentVehicle || !state.container) return;

    const v = state.currentVehicle;
    const unit = state.container.querySelector('#carUnit');
    if (!unit) return;
    
    // 웅장한 퇴장 애니메이션
    if (v.action === 'fire_fin') {
       unit.animate([
         { transform: 'rotate(0) scale(1)' },
         { transform: 'rotate(720deg) scale(1.5)', offset: 0.5 },
         { transform: 'rotate(1080deg) scale(1.2) translateX(120vw)' }
       ], { duration: 2500, easing: 'ease-in-out' });
       showBubbles();
    } else if (v.action === 'police_fin') {
       unit.animate([
         { transform: 'translateX(0) rotate(0)', filter: 'brightness(2)' },
         { transform: 'translateX(40vw) rotate(-15deg)', filter: 'hue-rotate(180deg)', offset: 0.3 },
         { transform: 'translateX(150vw) rotate(0)' }
       ], { duration: 2000 });
    } else if (v.action === 'rocket_fin') {
       unit.animate([
         { transform: 'translateY(0)' },
         { transform: 'translateY(20px)', offset: 0.1 },
         { transform: 'translateY(-200vh) scale(0.3)' }
       ], { duration: 2200 });
    } else {
       unit.style.transition = 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
       unit.style.transform = 'translateX(150vw) rotate(10deg)';
    }

    if (!state.completeRewardGiven) {
      state.completeRewardGiven = true;
      if (state.options.fireConfetti) state.options.fireConfetti();
      if (state.options.gainExp) state.options.gainExp(40);
    }

    // 자동차가 날아간 뒤 성공 패널 띄우기
    setManagedTimeout(() => { showSuccessPanel(); }, 2000);
  }

  function showSuccessPanel() {
    if (state.destroyed || !state.container) return;
    if (state.successRewardGiven) return;

    state.successRewardGiven = true;

    const panel = document.createElement('div');
    panel.className = 'cg-success-panel';
    panel.innerHTML = `
      <div class="cg-success-box">
        <div class="cg-success-icon">🏆</div>
        <h2 class="cg-success-title">시현이 최고야!</h2>
        <div class="cg-success-actions">
          <button class="cg-panel-btn restart">또 고칠래! 🔧</button>
          <button class="cg-panel-btn home">놀이터 가기 👋</button>
        </div>
      </div>
    `;
    state.container.querySelector('.cg-root')?.appendChild(panel);

    panel.querySelector('.restart').onclick = () => {
      panel.remove();
      startVehicle();
    };
    panel.querySelector('.home').onclick = () => {
      if (state.options.closeToParkHome) state.options.closeToParkHome();
    };
  }

  function speak(text) {
    if (state.skipNextSpeak) {
      state.skipNextSpeak = false;
      return;
    }
  }

  function playGarageVoice(id, fallbackText) {
    if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      state.skipNextSpeak = true;
      window.SihyeonVoice.play(id, '').catch(() => {});
    }
  }

  // ─── LifeCycle API ────────────────────────────────────
  function render(container, options = {}) {
    destroy();
    injectStyle();
    state.container = container;
    state.options = options;
    state.destroyed = false;
    state.layoutMode = getLayoutMode();
    state.successRewardGiven = false;
    state.completeRewardGiven = false;
    state.skipNextSpeak = false;
    bindLayoutEvents();

    container.innerHTML = `<div class="${getRootClass()}"></div>`;
    startVehicle();
  }

  function destroy() {
    clearTimers();
    unbindLayoutEvents();

    state.destroyed = true;
    if (state.audioCtx) {
      state.audioCtx.close().catch(() => {});
      state.audioCtx = null;
    }
    if (state.container) state.container.innerHTML = '';
    state.container = null;
    state.options = {};
    state.currentVehicle = null;
    state.completedTasks = [];
    state.phase = 'arrival';
    state.locked = false;
    state.successRewardGiven = false;
    state.completeRewardGiven = false;
    state.skipNextSpeak = false;
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };

})();