/**
 * 시현이 놀이터 OS — 시현이 로봇 친구 코딩 대모험 V12.1
 * 파일: js/games/robotCoding.js
 * 반영:
 * - 원본 V11 게임 로직 유지
 * - 모바일 세로 / 태블릿 가로 DOM 이원 구조 보강
 * - resize/orientationchange 대응
 * - 실행 중 resize 무시 처리
 * - 최초 진입 색상 선택 화면 정상화
 * - 타이머/VFX 정리 보강
 * - 레벨 보상/엔딩 보상 중복 방지
 */
(function () {
  const GAME_KEY = 'robotCoding';
  const STYLE_ID = 'sihyeon-robot-style';

  window.SihyeonGames = window.SihyeonGames || {};

  const state = {
    container: null,
    options: {},
    currentLevel: 1,
    robotPos: { r: 4, c: 0 },
    goals: [],
    obstacles: [],
    commands: [],
    robotColor: '#00ffff',
    isExecuting: false,
    isInitialized: false,
    destroyed: false,
    layoutMode: 'portrait',
    resizeTimer: null,
    handleResizeBound: null,
    timers: [],
    levelRewardGiven: false,
    endingRewardGiven: false
  };

  const CMDS = [
    { id: 'up', sym: '↑', col: '#ff2d55', dr: -1, dc: 0, voice: 'robot.up' },
    { id: 'down', sym: '↓', col: '#00d4ff', dr: 1, dc: 0, voice: 'robot.down' },
    { id: 'left', sym: '←', col: '#ffd600', dr: 0, dc: -1, voice: 'robot.left' },
    { id: 'right', sym: '→', col: '#39ff14', dr: 0, dc: 1, voice: 'robot.right' },
    { id: 'loop', sym: '🔁', col: '#ff00ff', dr: 0, dc: 0, voice: 'robot.loop' }
  ];

  function isLandscapeMode() {
    try {
      return window.matchMedia('(orientation: landscape) and (min-width: 768px) and (min-height: 520px)').matches;
    } catch (error) {
      return window.innerWidth >= 768 && window.innerWidth > window.innerHeight;
    }
  }

  function getLayoutMode() {
    return isLandscapeMode() ? 'landscape' : 'portrait';
  }

  function playVoice(id) {
    if (!id) return;
    if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      window.SihyeonVoice.play(id, '').catch(() => {});
    }
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

  function vibrate(pattern) {
    try {
      if (navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch (error) {}
  }

  function bindResizeEvents() {
    if (state.handleResizeBound) return;
    state.handleResizeBound = handleResize;
    window.addEventListener('resize', state.handleResizeBound, { passive: true });
    window.addEventListener('orientationchange', state.handleResizeBound, { passive: true });
  }

  function unbindResizeEvents() {
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
      if (nextMode === state.layoutMode) return;

      if (state.isExecuting) {
        return;
      }

      state.layoutMode = nextMode;
      render();
    }, 140);
  }

  function injectStyle() {
    const oldStyle = document.getElementById(STYLE_ID);
    if (oldStyle) oldStyle.remove();

    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .rb11-root {
        width: 100%;
        height: 100%;
        min-height: 0;
        background:
          radial-gradient(circle at 20% 10%, rgba(0,255,255,0.22), transparent 24%),
          radial-gradient(circle at 82% 20%, rgba(255,0,255,0.18), transparent 26%),
          radial-gradient(circle at 50% 85%, rgba(57,255,20,0.12), transparent 28%),
          #020208;
        font-family: 'Jua', sans-serif;
        color: white;
        overflow: hidden;
        position: relative;
        box-sizing: border-box;
        user-select: none;
        touch-action: manipulation;
        --r-col: #00ffff;
      }

      .rb11-root * {
        box-sizing: border-box;
      }

      .rb11-portrait {
        display: flex;
        flex-direction: column;
      }

      .rb11-landscape {
        display: grid;
        grid-template-columns: minmax(230px, 25%) minmax(420px, 1fr) minmax(250px, 28%);
        grid-template-rows: 1fr;
        grid-template-areas: "info stage controls";
        gap: clamp(10px, 1.6vw, 18px);
        padding: max(12px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left));
      }

      .rb11-info-panel {
        position: relative;
        z-index: 20;
        grid-area: info;
        display: grid;
        grid-template-rows: auto auto 1fr;
        gap: 14px;
        min-height: 0;
      }

      .rb11-title-card {
        border: 5px solid var(--r-col, #00ffff);
        border-radius: 30px;
        background: rgba(0, 10, 30, 0.82);
        box-shadow: 0 0 28px rgba(0,255,255,0.22), inset 0 0 30px rgba(0,255,255,0.09);
        padding: 16px 12px;
        text-align: center;
      }

      .rb11-title-emoji {
        font-size: clamp(48px, 7vw, 82px);
        line-height: 1;
        filter: drop-shadow(0 0 18px var(--r-col, #00ffff));
      }

      .rb11-title-main {
        margin-top: 8px;
        font-size: clamp(22px, 2.6vw, 36px);
        font-weight: 900;
        color: var(--r-col, #00ffff);
        text-shadow: 0 0 20px var(--r-col, #00ffff);
        line-height: 1.06;
      }

      .rb11-title-sub {
        margin-top: 8px;
        font-size: clamp(14px, 1.45vw, 19px);
        font-weight: 900;
        color: #ffffff;
        line-height: 1.35;
        opacity: 0.9;
      }

      .rb11-level-card {
        border: 4px solid rgba(255,255,255,0.24);
        border-radius: 24px;
        background: rgba(255,255,255,0.06);
        padding: 13px;
        text-align: center;
      }

      .rb11-level-label {
        font-size: clamp(17px, 1.7vw, 23px);
        font-weight: 900;
        color: #ffff00;
      }

      .rb11-level-num {
        margin-top: 6px;
        font-size: clamp(36px, 5vw, 70px);
        font-weight: 900;
        color: var(--r-col, #00ffff);
        line-height: 1;
        text-shadow: 0 0 26px var(--r-col, #00ffff);
      }

      .rb11-mission-card {
        min-height: 0;
        display: grid;
        align-content: center;
        gap: 12px;
        border: 4px dashed rgba(255,255,255,0.26);
        border-radius: 24px;
        background: rgba(255,255,255,0.05);
        padding: 14px;
        text-align: center;
      }

      .rb11-mission-text {
        font-size: clamp(16px, 1.55vw, 21px);
        font-weight: 900;
        line-height: 1.35;
      }

      .rb11-mission-stars {
        font-size: clamp(34px, 4vw, 58px);
        line-height: 1;
        filter: drop-shadow(0 0 14px gold);
      }

      .rb11-topbar {
        position: relative;
        z-index: 20;
        flex-shrink: 0;
        padding: 10px;
        text-align: center;
        background: rgba(0,0,0,0.5);
        border-bottom: 4px solid var(--r-col, #00ffff);
      }

      .rb11-topbar-title {
        font-size: clamp(21px, 5vw, 34px);
        color: var(--r-col, #00ffff);
        font-weight: 900;
        text-shadow: 0 0 16px var(--r-col, #00ffff);
      }

      .rb11-stage-wrap {
        position: relative;
        z-index: 10;
        grid-area: stage;
        min-height: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .rb11-portrait .rb11-stage-wrap {
        flex: 1.2;
        min-height: 0;
        padding: 15px;
      }

      .rb11-stage {
        position: relative;
        width: min(100%, 86vh, 680px);
        height: min(100%, 86vh, 680px);
        aspect-ratio: 1 / 1;
        border: 10px solid var(--r-col, #00ffff);
        border-radius: 30px;
        background:
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(180deg, rgba(255,255,255,0.025) 1px, transparent 1px),
          rgba(0, 10, 30, 0.85);
        background-size: 20% 20%;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        grid-template-rows: repeat(5, 1fr);
        box-shadow: 0 0 40px var(--r-col, #00ffff), inset 0 0 80px rgba(0, 255, 255, 0.2);
        overflow: hidden;
      }

      .rb11-portrait .rb11-stage {
        width: min(92vw, 54vh, 560px);
        height: min(92vw, 54vh, 560px);
      }

      .rb11-cell {
        border: 1px solid rgba(255, 255, 255, 0.05);
        display: grid;
        place-items: center;
        position: relative;
        font-size: clamp(28px, 8vw, 54px);
      }

      .rb11-trail {
        position: absolute;
        width: 15%;
        height: 15%;
        background: var(--r-col);
        border-radius: 50%;
        opacity: 0.7;
        filter: blur(10px);
        transform: translate(-50%, -50%);
        z-index: 30;
        animation: rb11TrailFade 0.9s forwards;
      }

      @keyframes rb11TrailFade {
        from { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
        to { opacity: 0; transform: translate(-50%, -50%) scale(0.2); }
      }

      .rb11-robot {
        position: absolute;
        width: 20%;
        height: 20%;
        font-size: clamp(56px, 12vw, 100px);
        display: grid;
        place-items: center;
        z-index: 50;
        transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        filter: drop-shadow(0 0 25px var(--r-col, #00ffff));
      }

      .rb11-landscape .rb11-robot {
        font-size: clamp(58px, 7vw, 110px);
      }

      .rb11-goal {
        position: absolute;
        width: 20%;
        height: 20%;
        font-size: clamp(46px, 10vw, 85px);
        display: grid;
        place-items: center;
        z-index: 45;
        animation: rb11Star 1.5s infinite;
        filter: drop-shadow(0 0 25px gold);
        transition: all 0.4s;
      }

      .rb11-landscape .rb11-goal {
        font-size: clamp(48px, 6vw, 92px);
      }

      @keyframes rb11Star {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.3) rotate(15deg); }
      }

      .rb11-ui {
        position: relative;
        z-index: 60;
        grid-area: controls;
        background: rgba(5, 0, 20, 0.98);
        border-top: 8px solid #ff00ff;
        padding: clamp(12px, 2.5vh, 22px);
        display: grid;
        gap: 12px;
      }

      .rb11-portrait .rb11-ui {
        flex-shrink: 0;
      }

      .rb11-landscape .rb11-ui {
        min-height: 0;
        height: 100%;
        align-content: center;
        border: 6px solid #ff00ff;
        border-radius: 30px;
        box-shadow: 0 0 32px rgba(255,0,255,0.28), inset 0 0 30px rgba(255,0,255,0.08);
        padding: 16px;
      }

      .rb11-sequence {
        height: 75px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        display: flex;
        align-items: center;
        padding: 0 12px;
        gap: 8px;
        border: 3px dashed #ff00ff;
        overflow-x: auto;
        scrollbar-width: none;
      }

      .rb11-sequence::-webkit-scrollbar {
        display: none;
      }

      .rb11-landscape .rb11-sequence {
        height: auto;
        min-height: 92px;
        max-height: 150px;
        flex-wrap: wrap;
        align-content: center;
        overflow-y: auto;
      }

      .rb11-seq-item {
        min-width: 50px;
        height: 50px;
        border-radius: 10px;
        font-size: 32px;
        display: grid;
        place-items: center;
        box-shadow: 0 0 12px currentColor;
        animation: rb11Pop 0.3s forwards;
      }

      .rb11-btn-group {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 10px;
      }

      .rb11-landscape .rb11-btn-group {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .rb11-cmd-btn {
        aspect-ratio: 1 / 1;
        border-radius: 18px;
        border: 4px solid #ff00ff;
        font-size: clamp(34px, 8vw, 48px);
        background: #1a0033;
        color: white;
        box-shadow: 0 8px 0 #ff00ff88;
        transition: all 0.08s;
        font-family: inherit;
        cursor: pointer;
      }

      .rb11-landscape .rb11-cmd-btn {
        font-size: clamp(34px, 5vw, 60px);
      }

      .rb11-cmd-btn:active {
        transform: scale(0.85) translateY(6px);
      }

      .rb11-cmd-btn[data-id="loop"] {
        background: linear-gradient(45deg, #ff00ff, #aa00ff);
        animation: rb11LoopPulse 2s infinite;
      }

      @keyframes rb11LoopPulse {
        0%, 100% { border-color: #ff00ff; }
        50% { border-color: #ffff00; }
      }

      .rb11-exec-btn {
        width: 100%;
        padding: 16px;
        border-radius: 40px;
        border: none;
        background: linear-gradient(45deg, #00ff88, #00cc66);
        font-size: clamp(22px, 5.5vw, 32px);
        font-weight: 900;
        color: #001a33;
        box-shadow: 0 10px 0 #008833;
        font-family: inherit;
        cursor: pointer;
      }

      .rb11-exec-btn:active {
        transform: translateY(7px);
        box-shadow: 0 3px 0 #008833;
      }

      .rb11-clear-btn {
        width: 100%;
        color: #bbbbbb;
        background: rgba(255,255,255,0.04);
        border: 2px solid rgba(255,255,255,0.14);
        border-radius: 18px;
        padding: 10px;
        font-size: clamp(15px, 3.8vw, 19px);
        font-weight: 900;
        font-family: inherit;
        cursor: pointer;
      }

      .rb11-p {
        position: absolute;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        animation: rb11Fly 0.8s ease-out forwards;
      }

      @keyframes rb11Fly {
        to { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
      }

      .md-shake {
        animation: rb11Shake 0.45s;
      }

      @keyframes rb11Shake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-10px); }
        40%, 80% { transform: translateX(10px); }
      }

      @keyframes rb11Pop {
        from { transform: scale(0); }
        to { transform: scale(1); }
      }

      .rb11-flash {
        animation: rb11FlashAnim 0.5s;
      }

      @keyframes rb11FlashAnim {
        0% { background: white; }
        100% { background: rgba(0, 10, 30, 0.85); }
      }

      .rb11-setup {
        position: absolute;
        inset: 0;
        z-index: 200;
        background:
          radial-gradient(circle at 50% 18%, rgba(0,255,255,0.28), transparent 28%),
          #000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 22px;
        text-align: center;
      }

      .rb11-setup h1 {
        font-size: clamp(31px, 7.5vw, 54px);
        margin: 0 0 40px;
        color: #00ffff;
        text-shadow: 0 0 24px #00ffff;
      }

      .rb11-color-row {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 20px;
      }

      .color-opt {
        width: clamp(78px, 18vw, 112px);
        height: clamp(78px, 18vw, 112px);
        border-radius: 50%;
        border: 5px solid #fff;
        cursor: pointer;
        transition: 0.2s;
        box-shadow: 0 0 22px currentColor;
      }

      .color-opt:active {
        transform: scale(0.88);
      }

      .rb11-ending {
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        background: radial-gradient(circle, #2a0055, #000);
        padding: 24px;
      }

      .rb11-ending-inner {
        display: grid;
        place-items: center;
        gap: 18px;
      }

      .rb11-ending h1 {
        font-size: clamp(44px, 11vw, 78px);
        color: #ffff00;
        text-shadow: 0 0 50px #00ffff, 0 0 80px #ff00ff;
        margin: 0;
      }

      .rb11-ending p {
        font-size: clamp(20px, 5vw, 30px);
        margin: 0;
        line-height: 1.35;
      }

      .rb11-ending-icon {
        font-size: clamp(90px, 22vw, 150px);
        filter: drop-shadow(0 0 20px #00ffff);
      }

      .rb11-re-btn {
        padding: 22px 48px;
        font-size: clamp(23px, 6vw, 34px);
        border-radius: 50px;
        border: 0;
        background: linear-gradient(45deg, #ff00ff, #00ffff);
        color: #000;
        font-family: inherit;
        font-weight: 900;
        box-shadow: 0 12px 0 #00000066;
        cursor: pointer;
      }

      .rb11-re-btn:active {
        transform: translateY(8px);
        box-shadow: 0 4px 0 #00000066;
      }

      @media (orientation: landscape) and (max-height: 540px) {
        .rb11-landscape {
          grid-template-columns: minmax(180px, 25%) minmax(330px, 1fr) minmax(210px, 28%);
          gap: 8px;
          padding: 8px;
        }

        .rb11-title-card,
        .rb11-level-card,
        .rb11-mission-card,
        .rb11-landscape .rb11-ui {
          border-radius: 20px;
          padding: 9px;
        }

        .rb11-title-emoji {
          font-size: 36px;
        }

        .rb11-title-main {
          font-size: 19px;
        }

        .rb11-title-sub,
        .rb11-mission-text {
          font-size: 12px;
        }

        .rb11-level-num {
          font-size: 38px;
        }

        .rb11-stage {
          border-width: 6px;
          border-radius: 22px;
        }

        .rb11-sequence {
          min-height: 62px;
        }

        .rb11-seq-item {
          min-width: 38px;
          height: 38px;
          font-size: 24px;
        }

        .rb11-cmd-btn {
          border-width: 3px;
          border-radius: 14px;
          font-size: 30px;
        }

        .rb11-exec-btn {
          padding: 11px;
          font-size: 20px;
        }

        .rb11-clear-btn {
          padding: 7px;
          font-size: 13px;
        }
      }

      @media (max-width: 620px), (max-height: 680px) {
        .rb11-topbar {
          padding: 7px;
        }

        .rb11-stage {
          border-width: 7px;
          border-radius: 24px;
        }

        .rb11-portrait .rb11-stage-wrap {
          padding: 10px;
        }

        .rb11-ui {
          border-top-width: 6px;
          padding: 10px 10px calc(12px + env(safe-area-inset-bottom));
          gap: 9px;
        }

        .rb11-sequence {
          height: 58px;
          padding: 0 9px;
        }

        .rb11-seq-item {
          min-width: 42px;
          height: 42px;
          font-size: 27px;
        }

        .rb11-btn-group {
          gap: 7px;
        }

        .rb11-cmd-btn {
          border-width: 3px;
          border-radius: 14px;
        }

        .rb11-exec-btn {
          padding: 12px;
        }
      }
    `;
    document.head.appendChild(s);
  }

  function createVFX(x, y, color, count = 35) {
    if (state.destroyed || !state.container) return;

    const rect = state.container.getBoundingClientRect();

    for (let i = 0; i < count; i += 1) {
      const p = document.createElement('div');
      p.className = 'rb11-p';
      p.style.left = `${x - rect.left}px`;
      p.style.top = `${y - rect.top}px`;
      p.style.background = color;
      p.style.setProperty('--tx', `${Math.random() * 300 - 150}px`);
      p.style.setProperty('--ty', `${Math.random() * 300 - 150}px`);
      state.container.appendChild(p);
      setManagedTimeout(() => p.remove(), 800);
    }
  }

  function createTrail(x, y) {
    if (state.destroyed || !state.container) return;

    const rect = state.container.getBoundingClientRect();
    const t = document.createElement('div');
    t.className = 'rb11-trail';
    t.style.left = `${x - rect.left}px`;
    t.style.top = `${y - rect.top}px`;
    state.container.appendChild(t);
    setManagedTimeout(() => t.remove(), 900);
  }

  async function startLevel() {
    if (state.destroyed) return;

    clearTimers();

    state.isExecuting = false;
    state.commands = [];
    state.robotPos = { r: 4, c: 0 };
    state.obstacles = [];
    state.goals = [];
    state.levelRewardGiven = false;

    const goalCount = Math.min(Math.floor(state.currentLevel / 3) + 1, 3);
    while (state.goals.length < goalCount) {
      const pos = { r: Math.floor(Math.random() * 4), c: Math.floor(Math.random() * 5) };
      if (!(pos.r === 4 && pos.c === 0) && !state.goals.some((g) => g.r === pos.r && g.c === pos.c)) {
        state.goals.push(pos);
      }
    }

    const obsCount = Math.min(Math.floor(state.currentLevel / 2) + 1, 4);
    while (state.obstacles.length < obsCount) {
      const pos = { r: Math.floor(Math.random() * 5), c: Math.floor(Math.random() * 5) };
      if (
        !(pos.r === 4 && pos.c === 0)
        && !state.goals.some((g) => g.r === pos.r && g.c === pos.c)
        && !state.obstacles.some((o) => o.r === pos.r && o.c === pos.c)
      ) {
        state.obstacles.push(pos);
      }
    }

    render();

    if (state.options.speakGuide && state.isInitialized) {
      playVoice('robot.levelStart');
    }
  }

  function getInfoPanelMarkup() {
    const stars = Math.max(1, state.goals.length);
    return `
      <aside class="rb11-info-panel">
        <div class="rb11-title-card">
          <div class="rb11-title-emoji">🤖</div>
          <div class="rb11-title-main">로봇 코딩<br>대모험</div>
          <div class="rb11-title-sub">화살표를 눌러서<br>별까지 길을 만들어요</div>
        </div>

        <div class="rb11-level-card">
          <div class="rb11-level-label">MASTER LEVEL</div>
          <div class="rb11-level-num">${state.currentLevel}</div>
        </div>

        <div class="rb11-mission-card">
          <div class="rb11-mission-stars">${'⭐'.repeat(stars)}</div>
          <div class="rb11-mission-text">별을 모두 모으면<br>다음 모험으로 가요!</div>
        </div>
      </aside>
    `;
  }

  function getStageMarkup() {
    let cellsHTML = '';

    for (let r = 0; r < 5; r += 1) {
      for (let c = 0; c < 5; c += 1) {
        const isObs = state.obstacles.some((o) => o.r === r && o.c === c);
        cellsHTML += `<div class="rb11-cell">${isObs ? '🪨' : ''}</div>`;
      }
    }

    return `
      <div class="rb11-stage-wrap">
        <div class="rb11-stage" id="stage">
          ${cellsHTML}
          ${state.goals.map((g) => `<div class="rb11-goal" data-r="${g.r}" data-c="${g.c}" style="top:${g.r * 20}%; left:${g.c * 20}%;">⭐</div>`).join('')}
          <div class="rb11-robot" id="robot" style="top:${state.robotPos.r * 20}%; left:${state.robotPos.c * 20}%;">🤖</div>
        </div>
      </div>
    `;
  }

  function getControlsMarkup() {
    return `
      <div class="rb11-ui">
        <div class="rb11-sequence">${state.commands.map((c) => `<div class="rb11-seq-item" style="background:${c.col};">${c.sym}</div>`).join('')}</div>
        <div class="rb11-btn-group">${CMDS.map((c) => `<button class="rb11-cmd-btn" type="button" data-id="${c.id}">${c.sym}</button>`).join('')}</div>
        <button class="rb11-exec-btn" type="button" id="execBtn">🚀 코딩 실행!</button>
        <button class="rb11-clear-btn" type="button" id="clearBtn">명령 지우기 🗑️</button>
      </div>
    `;
  }

  function render() {
    if (state.destroyed || !state.container) return;

    if (!state.isInitialized) {
      showColorPicker();
      return;
    }

    const layoutMode = getLayoutMode();
    state.layoutMode = layoutMode;

    if (layoutMode === 'landscape') {
      state.container.innerHTML = `
        <div class="rb11-root rb11-landscape" style="--r-col: ${state.robotColor}">
          ${getInfoPanelMarkup()}
          ${getStageMarkup()}
          ${getControlsMarkup()}
        </div>
      `;
    } else {
      state.container.innerHTML = `
        <div class="rb11-root rb11-portrait" style="--r-col: ${state.robotColor}">
          <div class="rb11-topbar">
            <span class="rb11-topbar-title">🚀 MASTER LEVEL ${state.currentLevel}</span>
          </div>
          ${getStageMarkup()}
          ${getControlsMarkup()}
        </div>
      `;
    }

    bindControlEvents();
  }

  function bindControlEvents() {
    if (!state.container) return;

    state.container.querySelectorAll('.rb11-cmd-btn').forEach((btn) => {
      btn.onclick = () => {
        if (state.isExecuting || state.commands.length >= 14) return;

        const cmd = CMDS.find((c) => c.id === btn.dataset.id);
        if (!cmd) return;

        if (state.options.speakGuide) playVoice(cmd.voice);

        state.commands.push(cmd);
        render();
      };
    });

    const execBtn = state.container.querySelector('#execBtn');
    if (execBtn) execBtn.onclick = runCoding;

    const clearBtn = state.container.querySelector('#clearBtn');
    if (clearBtn) {
      clearBtn.onclick = () => {
        if (state.isExecuting) return;
        state.commands = [];
        render();
      };
    }
  }

  function showColorPicker() {
    if (!state.container) return;

    state.layoutMode = getLayoutMode();

    state.container.innerHTML = `
      <div class="rb11-root rb11-${state.layoutMode}" style="--r-col: ${state.robotColor}">
        <div class="rb11-setup">
          <h1>로봇 색깔을 골라주세요!</h1>
          <div class="rb11-color-row">
            ${['#00ffff', '#ff00ff', '#39ff14', '#ffd600'].map((c) => `<div class="color-opt" style="background:${c}; color:${c};" data-color="${c}"></div>`).join('')}
          </div>
        </div>
      </div>
    `;

    state.container.querySelectorAll('.color-opt').forEach((opt) => {
      opt.onclick = () => {
        state.robotColor = opt.dataset.color;
        state.isInitialized = true;
        startLevel();
      };
    });
  }

  async function runCoding() {
    if (state.isExecuting || state.commands.length === 0 || !state.container) return;

    state.isExecuting = true;

    let commandQueue = [...state.commands];
    const hasLoop = commandQueue.some((c) => c.id === 'loop');

    if (hasLoop) {
      const base = commandQueue.filter((c) => c.id !== 'loop');
      commandQueue = [...base, ...base];

      if (state.options.speakGuide) playVoice('robot.loopMode');
    }

    const robotEl = state.container.querySelector('#robot');
    const stageEl = state.container.querySelector('#stage');
    if (!robotEl || !stageEl) {
      state.isExecuting = false;
      return;
    }

    let curR = state.robotPos.r;
    let curC = state.robotPos.c;

    for (const cmd of commandQueue) {
      if (state.destroyed || !state.container) return;

      const nextR = Math.max(0, Math.min(4, curR + cmd.dr));
      const nextC = Math.max(0, Math.min(4, curC + cmd.dc));

      if (state.obstacles.some((o) => o.r === nextR && o.c === nextC)) {
        const robotRect = robotEl.getBoundingClientRect();
        createVFX(robotRect.left + robotRect.width / 2, robotRect.top + robotRect.height / 2, '#ff0000', 40);

        if (state.options.speakGuide) playVoice('robot.collision');

        break;
      }

      const robotRect = robotEl.getBoundingClientRect();
      createTrail(robotRect.left + robotRect.width / 2, robotRect.top + robotRect.height / 2);

      curR = nextR;
      curC = nextC;
      state.robotPos = { r: curR, c: curC };

      robotEl.style.top = `${curR * 20}%`;
      robotEl.style.left = `${curC * 20}%`;

      const goalIndex = state.goals.findIndex((g) => g.r === curR && g.c === curC);
      if (goalIndex !== -1) {
        state.goals.splice(goalIndex, 1);

        const starEl = stageEl.querySelector(`.rb11-goal[data-r="${curR}"][data-c="${curC}"]`);
        if (starEl) {
          const starRect = starEl.getBoundingClientRect();
          createVFX(starRect.left + starRect.width / 2, starRect.top + starRect.height / 2, '#ffff00', 50);
          starEl.style.transform = 'scale(2.5)';
          starEl.style.opacity = '0';
          setManagedTimeout(() => starEl.remove(), 400);
        }

        if (state.options.speakGuide) playVoice('robot.starCollected');
      }

      vibrate(50);
      await new Promise((resolve) => setManagedTimeout(resolve, 620));
    }

    if (state.destroyed || !state.container) return;

    if (state.goals.length === 0) {
      stageEl.classList.add('rb11-flash');

      if (!state.levelRewardGiven) {
        state.levelRewardGiven = true;
        state.options.fireConfetti?.();
        state.options.gainExp?.(50 + state.currentLevel * 10);
      }

      if (state.options.speakGuide) playVoice('robot.levelComplete');

      setManagedTimeout(() => {
        if (state.destroyed || !state.container) return;

        stageEl.classList.remove('rb11-flash');
        state.currentLevel += 1;
        state.isExecuting = false;
        state.robotPos = { r: 4, c: 0 };

        if (state.currentLevel > 10) {
          showEnding();
        } else {
          startLevel();
        }
      }, 1600);
    } else {
      const root = state.container.querySelector('.rb11-root');
      if (root) root.classList.add('md-shake');

      setManagedTimeout(() => {
        if (root) root.classList.remove('md-shake');
        state.isExecuting = false;
        state.robotPos = { r: 4, c: 0 };
        render();
      }, 1100);
    }
  }

  function showEnding() {
    if (!state.container || state.destroyed) return;

    clearTimers();

    if (!state.endingRewardGiven) {
      state.endingRewardGiven = true;
      state.options.gainExp?.(500);
      state.options.fireConfetti?.();
      if (state.options.speakGuide) playVoice('robot.ending');
    }

    state.container.innerHTML = `
      <div class="rb11-root rb11-ending">
        <div class="rb11-ending-inner">
          <h1>🏆 코딩 천재 시현 🏆</h1>
          <p>로봇 친구와 함께 모든 우주의 별을 모았어요!</p>
          <div class="rb11-ending-icon">🤖🚀⭐✨🌟</div>
          <button id="reBtn" class="rb11-re-btn" type="button">다시 모험 떠나기! 🔄</button>
        </div>
      </div>
    `;

    const reBtn = state.container.querySelector('#reBtn');
    if (reBtn) {
      reBtn.onclick = () => {
        state.currentLevel = 1;
        state.isInitialized = false;
        state.endingRewardGiven = false;
        state.levelRewardGiven = false;
        render();
      };
    }
  }

  function renderGame(container, options = {}) {
    destroy();

    state.container = container;
    state.options = options || {};
    state.destroyed = false;
    state.layoutMode = getLayoutMode();
    state.currentLevel = 1;
    state.robotPos = { r: 4, c: 0 };
    state.goals = [];
    state.obstacles = [];
    state.commands = [];
    state.isExecuting = false;
    state.isInitialized = false;
    state.levelRewardGiven = false;
    state.endingRewardGiven = false;

    injectStyle();
    bindResizeEvents();
    render();
  }

  function destroy() {
    clearTimers();
    unbindResizeEvents();

    state.destroyed = true;
    state.commands = [];
    state.goals = [];
    state.obstacles = [];
    state.robotPos = { r: 4, c: 0 };
    state.isExecuting = false;
    state.isInitialized = false;
    state.levelRewardGiven = false;
    state.endingRewardGiven = false;

    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();

    if (state.container) state.container.innerHTML = '';

    state.container = null;
    state.options = {};
  }

  window.SihyeonGames[GAME_KEY] = {
    render: renderGame,
    destroy
  };
})();