/**
 * 시현이 놀이터 OS — 초강력 소방대 V14 (Full Feature Edition)
 * [업데이트] 18종 풀로드, 3가지 모드(4/9/16), 물대포 VFX 복구, 타겟 글로우, 엔딩, 이미지 폴백 완비
 * [유지보수] 모바일 세로 / 태블릿 가로 DOM 이원 구조 보강, resize 상태 유지, 보상 중복 방지
 */

(function () {
  const GAME_KEY = 'megaDispatch';
  const STYLE_ID = 'sihyeon-mega-style';
  const MANIFESTS = {
    normal: './assets/vehicles/fire_manifest.json',
    special: './assets/vehicles/fire_special_manifest.json'
  };

  const state = {
    container: null,
    options: {},
    allTrucks: [],
    displayTrucks: [],
    mission: [],
    currentLevel: 1,
    userIndex: 0,
    combo: 0,
    gridSize: 9,
    isBusy: false,
    gameStarted: false,
    destroyed: false,
    layoutMode: 'portrait',
    resizeTimer: null,
    handleResizeBound: null,
    successRewardGiven: false,
    completeRewardGiven: false,
    isEnding: false,
    timers: []
  };

  const ROLE_ICONS = {
    pump_engine: '💧', water_tanker: '💧', ladder_truck: '🪜',
    aerial_ladder_truck: '🪜', articulating_ladder_truck: '🪜',
    rescue_fire_truck: '⛑️', airport_fire_truck: '✈️',
    foam_fire_truck: '🫧', fire_command_vehicle: '📢',
    fire_tank: '🚜', airport_crash_tender: '💧',
    wildfire_6x6_truck: '🌲', robot_demolition_fire_vehicle: '🤖',
    smoke_extraction_fan_truck: '🌀', articulating_boom_truck: '🦾',
    fire_command_suv: '📢'
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
    return `md14-root dispatch-root dispatch-${state.layoutMode}`;
  }

  function setManagedTimeout(fn, delay) {
    const id = window.setTimeout(() => {
      state.timers = state.timers.filter((timerId) => timerId !== id);
      if (!state.destroyed) fn();
    }, delay);
    state.timers.push(id);
    return id;
  }

  function clearManagedTimers() {
    state.timers.forEach((id) => window.clearTimeout(id));
    state.timers = [];
    if (state.resizeTimer) {
      window.clearTimeout(state.resizeTimer);
      state.resizeTimer = null;
    }
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
      state.layoutMode = nextMode;

      if (state.isEnding) {
        renderEnding(false);
        return;
      }

      if (state.gameStarted) {
        render();
        updateTargetGlow();
      } else {
        showModeSelection();
      }
    }, 120);
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .md14-root {
        width: 100%;
        height: 100%;
        min-height: 0;
        background: #050505;
        position: relative;
        overflow: hidden;
        font-family: 'Jua', sans-serif;
        color: #fff;
        box-sizing: border-box;
        touch-action: manipulation;
        user-select: none;
      }

      .md14-root * {
        box-sizing: border-box;
      }

      /* [배경] 도시 & 불꽃 */
      .md14-city-bg {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 50% 100%, rgba(255,82,0,0.35), transparent 42%),
          linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.82)),
          linear-gradient(180deg, #263238 0%, #0b0b0d 58%, #250606 100%);
        opacity: 0.92;
        z-index: 1;
        pointer-events: none;
      }

      .md14-fire-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 45%;
        background: linear-gradient(transparent, rgba(255, 80, 0, 0.3));
        z-index: 2;
        pointer-events: none;
        animation: md14Fire 3s infinite alternate;
      }

      @keyframes md14Fire {
        from { opacity: 0.2; }
        to { opacity: 0.5; }
      }

      .md14-level-badge {
        position: relative;
        z-index: 20;
        display: inline-grid;
        place-items: center;
        min-height: 38px;
        padding: 6px 14px;
        border-radius: 999px;
        border: 3px solid rgba(255,255,255,0.75);
        background: rgba(0,0,0,0.58);
        color: #fff;
        font-size: clamp(17px, 4.4vw, 24px);
        font-weight: 900;
        box-shadow: 0 5px 12px rgba(0,0,0,0.25);
        white-space: nowrap;
      }

      .md14-status-panel,
      .md14-scene-panel,
      .md14-action-panel {
        position: relative;
        z-index: 10;
        min-width: 0;
      }

      .md14-status-panel {
        display: grid;
        gap: 10px;
        align-content: start;
      }

      .md14-title {
        margin: 0;
        color: #ffeb3b;
        text-align: center;
        font-size: clamp(22px, 6vw, 38px);
        line-height: 1.08;
        font-weight: 900;
        text-shadow: 0 3px 0 rgba(0,0,0,0.45), 0 0 18px rgba(255,23,68,0.55);
      }

      .md14-subtitle {
        margin: 0;
        color: rgba(255,255,255,0.92);
        text-align: center;
        font-size: clamp(15px, 4vw, 21px);
        font-weight: 900;
        line-height: 1.25;
      }

      /* [헤더] 미션 프리뷰 */
      .md14-header {
        position: relative;
        z-index: 10;
        background: rgba(0,0,0,0.72);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        border: 5px solid rgba(255,23,68,0.86);
        border-radius: 28px;
        box-shadow: 0 12px 26px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.12);
      }

      .md-mission-card {
        width: 70px;
        height: 70px;
        background: #fff;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 4px solid #fff;
        position: relative;
        transition: all 0.3s;
        flex: 0 0 auto;
      }

      .md-mission-card.preview-large {
        width: clamp(106px, 24vw, 150px);
        height: clamp(106px, 24vw, 150px);
        border-color: #ffeb3b;
        box-shadow: 0 0 25px #ffeb3b;
      }

      .md-mission-card img {
        width: 85%;
        height: 85%;
        object-fit: contain;
      }

      .md-mission-card.done {
        opacity: 0.2;
        filter: grayscale(100%);
      }

      .md14-role-badge {
        font-size: 14px;
        position: absolute;
        top: -8px;
        right: -8px;
        background: #fff;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: grid;
        place-items: center;
        color: #000;
        box-shadow: 0 2px 4px #000;
      }

      .md14-scene-panel {
        display: grid;
        place-items: center;
        overflow: hidden;
        border-radius: 32px;
        border: 5px solid rgba(255,255,255,0.22);
        background:
          radial-gradient(circle at 50% 80%, rgba(255,235,59,0.22), transparent 34%),
          linear-gradient(180deg, rgba(33,33,33,0.66), rgba(0,0,0,0.35));
        box-shadow: inset 0 0 50px rgba(255,82,0,0.22), 0 16px 34px rgba(0,0,0,0.3);
      }

      .md14-scene-inner {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        display: grid;
        place-items: center;
        padding: 12px;
      }

      .md14-scene-target {
        position: relative;
        width: min(68%, 280px);
        aspect-ratio: 1 / 1;
        display: grid;
        place-items: center;
        border-radius: 36px;
        background: rgba(255,255,255,0.95);
        border: 6px solid #ffeb3b;
        box-shadow: 0 0 36px rgba(255,235,59,0.72), 0 16px 28px rgba(0,0,0,0.28);
        animation: md14ScenePulse 1.2s ease-in-out infinite alternate;
      }

      @keyframes md14ScenePulse {
        from { transform: scale(0.98); }
        to { transform: scale(1.03); }
      }

      .md14-scene-target img {
        width: 86%;
        height: 86%;
        object-fit: contain;
      }

      .md14-scene-icon {
        position: absolute;
        top: -14px;
        right: -14px;
        width: 46px;
        height: 46px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: #111;
        background: #fff;
        border: 4px solid #ffeb3b;
        font-size: 24px;
        box-shadow: 0 6px 12px rgba(0,0,0,0.3);
      }

      .md14-scene-caption {
        position: absolute;
        left: 50%;
        bottom: 12px;
        transform: translateX(-50%);
        width: min(92%, 420px);
        padding: 9px 14px;
        border-radius: 999px;
        text-align: center;
        color: #fff;
        background: rgba(0,0,0,0.55);
        border: 3px solid rgba(255,255,255,0.32);
        font-size: clamp(16px, 4vw, 23px);
        font-weight: 900;
        line-height: 1.1;
        text-shadow: 0 2px 0 rgba(0,0,0,0.45);
      }

      /* [그리드] 차량 선택 */
      .md14-garage {
        display: grid;
        gap: 12px;
        padding: 15px;
        z-index: 10;
        align-content: center;
        position: relative;
        min-height: 0;
      }

      .md14-garage::before {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.05) 40px, rgba(255,255,255,0.05) 42px);
        z-index: -1;
      }

      .grid-4 {
        grid-template-columns: repeat(2, 1fr);
        padding: 30px;
        gap: 25px;
      }

      .grid-9 {
        grid-template-columns: repeat(3, 1fr);
      }

      .grid-16 {
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }

      /* [버튼] 48dp+ 확보 & 타겟 글로우 */
      .md14-truck-btn {
        aspect-ratio: 1/1;
        background: #fff;
        border-radius: 20px;
        border: none;
        box-shadow: 0 8px 0 #888;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        min-height: 80px;
        position: relative;
        transition: transform 0.1s;
        cursor: pointer;
        touch-action: manipulation;
      }

      .md14-truck-btn img {
        width: 90%;
        height: 90%;
        object-fit: contain;
        pointer-events: none;
      }

      .md14-truck-btn.target-glow {
        box-shadow: 0 0 20px #ffeb3b, inset 0 0 10px #fff;
        animation: mdGlow 1.5s infinite;
      }

      @keyframes mdGlow {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.02); }
      }

      .md14-truck-btn:active {
        transform: translateY(5px) scale(0.98);
        box-shadow: 0 3px 0 #777;
      }

      .md-shake {
        animation: mdShakeAnim 0.45s linear;
      }

      @keyframes mdShakeAnim {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
      }

      .water-drop {
        position: absolute;
        width: 14px;
        height: 14px;
        background: #4fc3f7;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        animation: waterFly 0.7s ease-out forwards;
      }

      @keyframes waterFly {
        to { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
      }

      .md14-start-screen {
        position: absolute;
        inset: 0;
        z-index: 1000;
        background: rgba(0,0,0,0.95);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        text-align: center;
        padding: 20px;
      }

      .md14-mode-row {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 12px;
      }

      .mode-btn {
        min-height: 58px;
        padding: 15px 30px;
        font-size: 22px;
        border-radius: 20px;
        border: none;
        background: #ff1744;
        color: white;
        box-shadow: 0 6px 0 #b71c1c;
        margin: 0;
        font-weight: 900;
        font-family: inherit;
        cursor: pointer;
        touch-action: manipulation;
      }

      .mode-btn:active {
        transform: translateY(5px);
        box-shadow: 0 1px 0 #b71c1c;
      }

      .dispatch-portrait {
        display: flex;
        flex-direction: column;
        padding: max(10px, env(safe-area-inset-top)) 10px max(10px, env(safe-area-inset-bottom));
        gap: 8px;
      }

      .dispatch-portrait .md14-status-panel {
        flex: 0 0 auto;
        gap: 7px;
      }

      .dispatch-portrait .md14-title {
        font-size: clamp(22px, 7vw, 34px);
      }

      .dispatch-portrait .md14-subtitle {
        display: none;
      }

      .dispatch-portrait .md14-header {
        min-height: clamp(116px, 18vh, 164px);
        padding: 9px 8px;
        gap: 10px;
        overflow-x: auto;
        scrollbar-width: none;
      }

      .dispatch-portrait .md14-header::-webkit-scrollbar {
        display: none;
      }

      .dispatch-portrait .md-mission-card {
        width: clamp(58px, 16vw, 74px);
        height: clamp(58px, 16vw, 74px);
        border-radius: 16px;
        border-width: 3px;
      }

      .dispatch-portrait .md-mission-card.preview-large {
        width: clamp(94px, 27vw, 134px);
        height: clamp(94px, 27vw, 134px);
      }

      .dispatch-portrait .md14-scene-panel {
        flex: 0.9 1 auto;
        min-height: 110px;
        max-height: 22vh;
      }

      .dispatch-portrait .md14-scene-target {
        width: min(42vw, 150px);
      }

      .dispatch-portrait .md14-scene-caption {
        bottom: 7px;
        font-size: clamp(14px, 3.8vw, 18px);
      }

      .dispatch-portrait .md14-action-panel {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
      }

      .dispatch-portrait .md14-garage {
        flex: 1 1 auto;
        width: 100%;
        border-radius: 26px;
        background: rgba(0,0,0,0.22);
        border: 3px solid rgba(255,255,255,0.12);
        overflow: hidden;
      }

      .dispatch-portrait .md14-truck-btn {
        min-height: 62px;
        border-radius: 17px;
        padding: 8px;
      }

      .dispatch-portrait .grid-4 {
        padding: 18px;
        gap: 16px;
      }

      .dispatch-portrait .grid-9 {
        gap: 10px;
      }

      .dispatch-portrait .grid-16 {
        gap: 7px;
      }

      .dispatch-landscape {
        display: grid;
        grid-template-columns: minmax(210px, 24vw) minmax(360px, 1fr) minmax(260px, 31vw);
        grid-template-rows: 1fr;
        gap: 12px;
        padding: max(10px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
      }

      .dispatch-landscape .md14-status-panel {
        height: 100%;
        min-height: 0;
        padding: 12px;
        border-radius: 30px;
        background: rgba(0,0,0,0.48);
        border: 4px solid rgba(255,255,255,0.12);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
      }

      .dispatch-landscape .md14-title {
        font-size: clamp(24px, 3vw, 39px);
      }

      .dispatch-landscape .md14-header {
        flex: 1 1 auto;
        min-height: 0;
        align-content: center;
        flex-direction: column;
        padding: 12px 8px;
        overflow: hidden auto;
      }

      .dispatch-landscape .md-mission-card {
        width: clamp(62px, 8vw, 92px);
        height: clamp(62px, 8vw, 92px);
      }

      .dispatch-landscape .md-mission-card.preview-large {
        width: clamp(104px, 12vw, 152px);
        height: clamp(104px, 12vw, 152px);
      }

      .dispatch-landscape .md14-scene-panel {
        height: 100%;
        min-height: 0;
      }

      .dispatch-landscape .md14-scene-target {
        width: min(58vh, 78%, 420px);
      }

      .dispatch-landscape .md14-scene-caption {
        bottom: 18px;
        font-size: clamp(18px, 2.2vw, 28px);
      }

      .dispatch-landscape .md14-action-panel {
        height: 100%;
        min-height: 0;
        display: flex;
      }

      .dispatch-landscape .md14-garage {
        width: 100%;
        flex: 1 1 auto;
        min-height: 0;
        overflow: hidden;
        border-radius: 30px;
        background: rgba(0,0,0,0.46);
        border: 4px solid rgba(255,255,255,0.14);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
      }

      .dispatch-landscape .md14-truck-btn {
        min-height: 0;
        border-radius: 18px;
        padding: 8px;
      }

      .dispatch-landscape .grid-4 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        padding: 22px;
        gap: 18px;
      }

      .dispatch-landscape .grid-9 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .dispatch-landscape .grid-16 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
      }

      @media (max-width: 620px), (max-height: 640px) {
        .dispatch-portrait {
          padding: max(7px, env(safe-area-inset-top)) 8px max(8px, env(safe-area-inset-bottom));
          gap: 6px;
        }

        .dispatch-portrait .md14-header {
          min-height: clamp(100px, 17vh, 140px);
          border-width: 4px;
          border-radius: 22px;
        }

        .dispatch-portrait .md14-scene-panel {
          max-height: 18vh;
          border-radius: 22px;
          border-width: 4px;
        }

        .dispatch-portrait .md14-scene-target {
          width: min(36vw, 124px);
          border-width: 5px;
          border-radius: 26px;
        }

        .dispatch-portrait .md14-scene-icon {
          width: 38px;
          height: 38px;
          font-size: 20px;
        }

        .dispatch-portrait .md14-garage {
          border-radius: 22px;
        }

        .dispatch-portrait .md14-truck-btn {
          min-height: 56px;
          border-radius: 15px;
          padding: 6px;
        }

        .dispatch-portrait .grid-4 {
          padding: 12px;
          gap: 12px;
        }

        .dispatch-portrait .grid-9 {
          padding: 10px;
          gap: 8px;
        }

        .dispatch-portrait .grid-16 {
          padding: 8px;
          gap: 6px;
        }

        .mode-btn {
          width: min(100%, 330px);
          font-size: 20px;
        }
      }
    `;
    document.head.appendChild(s);
  }

  async function loadAllTrucks() {
    if (state.allTrucks.length > 0) return;
    try {
      const [res1, res2] = await Promise.all([
        fetch(MANIFESTS.normal).then(r => r.json()),
        fetch(MANIFESTS.special).then(r => r.json())
      ]);
      const list1 = res1.map(t => ({ ...t, gameId: `n_${t.id}` }));
      const list2 = res2.map(t => ({ ...t, gameId: `s_${t.id}` }));
      state.allTrucks = [...list1, ...list2];
    } catch (e) {
      state.allTrucks = [{ gameId: 'n_pump', id: 'pump_engine', file: 'assets/vehicles/fire/pump_engine.png', name_ko: '펌프차' }];
    }
  }

  function showModeSelection() {
    if (!state.container) return;
    state.isEnding = false;
    state.container.innerHTML = `
      <div class="${getRootClass()}">
        <div class="md14-city-bg"></div>
        <div class="md14-start-screen">
          <h1 class="md14-title">본부장 시현! 출동 준비!</h1>
          <p class="md14-subtitle">소방차를 골라서 마을을 지켜요</p>
          <div class="md14-mode-row">
            <button class="mode-btn" type="button" data-mode-size="4">쉬움 🚒 (4대)</button>
            <button class="mode-btn" type="button" data-mode-size="9">보통 🚒🚒 (9대)</button>
            <button class="mode-btn" type="button" data-mode-size="16">도전 🚒🚒🚒 (16대)</button>
          </div>
        </div>
      </div>
    `;

    state.container.querySelectorAll('[data-mode-size]').forEach((button) => {
      button.addEventListener('click', () => {
        window.setV14Mode(Number(button.dataset.modeSize));
      });
    });
  }

  window.setV14Mode = (size) => {
    state.gridSize = size;
    state.currentLevel = 1;
    state.gameStarted = true;
    state.isEnding = false;
    state.completeRewardGiven = false;
    startRound();
  };

  async function startRound() {
    if (state.destroyed || !state.gameStarted) return;
    await loadAllTrucks();
    state.isBusy = false;
    state.userIndex = 0;
    state.combo = 0;
    state.successRewardGiven = false;
    state.isEnding = false;

    // 18종 중 그리드 크기만큼 랜덤 배치
    state.displayTrucks = [...state.allTrucks].sort(() => 0.5 - Math.random()).slice(0, state.gridSize);

    // 미션 생성 (그리드에 따라 개수 조정)
    const mCount = state.gridSize === 4 ? 2 : (state.gridSize === 9 ? 3 : 4);
    state.mission = [...state.displayTrucks].sort(() => 0.5 - Math.random()).slice(0, Math.min(mCount + Math.floor(state.currentLevel/3), state.gridSize));

    render();
    updateTargetGlow();
  }

  function render() {
    if (!state.gameStarted || !state.container) return;

    const target = state.mission[state.userIndex] || state.mission[state.mission.length - 1] || state.displayTrucks[0] || null;
    const targetIcon = target ? (ROLE_ICONS[target.id] || '🚒') : '🚒';
    const targetFile = target?.file || 'assets/vehicles/fire/pump_engine.png';
    const targetName = target?.name_ko || target?.name || '소방차';
    const missionProgressText = `${Math.min(state.userIndex + 1, state.mission.length || 1)} / ${state.mission.length || 1}`;

    state.container.innerHTML = `
      <div class="${getRootClass()}">
        <div class="md14-city-bg"></div>
        <div class="md14-fire-overlay"></div>

        <section class="md14-status-panel" aria-label="미션 안내">
          <div class="md14-level-badge">🚒 ${state.currentLevel}단계 · ${missionProgressText}</div>
          <h1 class="md14-title">초강력 소방대 출동!</h1>
          <p class="md14-subtitle">왼쪽 미션 순서대로 소방차를 눌러요</p>
          <div class="md14-header">
            ${state.mission.map((m, i) => `
              <div class="md-mission-card ${i === state.userIndex ? 'preview-large active' : (i < state.userIndex ? 'done' : '')}">
                <div class="md14-role-badge">${ROLE_ICONS[m.id] || '🚒'}</div>
                <img src="${m.file}" onerror="this.outerHTML='<span style=&quot;font-size:42px;&quot;>🚒</span>';">
              </div>
            `).join('')}
          </div>
        </section>

        <section class="md14-scene-panel" aria-label="출동 장면">
          <div class="md14-scene-inner">
            <div class="md14-scene-target">
              <span class="md14-scene-icon">${targetIcon}</span>
              <img src="${targetFile}" alt="${targetName}" onerror="this.outerHTML='<span style=&quot;font-size:72px;&quot;>🚒</span>';">
            </div>
            <div class="md14-scene-caption">${targetName} 출동 준비!</div>
          </div>
        </section>

        <section class="md14-action-panel" aria-label="차량 선택">
          <div class="md14-garage grid-${state.gridSize}">
            ${state.displayTrucks.map(t => `
              <button class="md14-truck-btn" type="button" data-game-id="${t.gameId}">
                <img src="${t.file}" onerror="this.outerHTML='<span style=&quot;font-size:42px;&quot;>🚒</span>';">
              </button>
            `).join('')}
          </div>
        </section>
      </div>
    `;

    state.container.querySelectorAll('.md14-truck-btn').forEach(btn => {
      btn.onclick = (e) => handleTouch(btn.dataset.gameId, btn, e);
    });
  }

  function updateTargetGlow() {
    if (!state.container) return;
    const targetId = state.mission[state.userIndex]?.gameId;
    state.container.querySelectorAll('.md14-truck-btn').forEach(btn => {
      btn.classList.remove('target-glow');
      if (btn.dataset.gameId === targetId) btn.classList.add('target-glow');
    });
  }

  function shootWater(x, y, isSuper) {
    const count = isSuper ? 30 : 15;
    for (let i = 0; i < count; i++) {
      const drop = document.createElement('div');
      drop.className = 'water-drop';
      drop.style.left = x + 'px';
      drop.style.top = y + 'px';
      drop.style.setProperty('--tx', (Math.random() * (isSuper ? 400 : 200) - (isSuper ? 200 : 100)) + 'px');
      drop.style.setProperty('--ty', (Math.random() * -300 - 50) + 'px');
      state.container.appendChild(drop);
      setManagedTimeout(() => drop.remove(), 700);
    }
  }

  function handleTouch(gameId, el, e) {
    if (state.isBusy) return;
    const target = state.mission[state.userIndex];
    const root = state.container.querySelector('.md14-root');

    if (gameId === target.gameId) {
      state.userIndex++;
      state.combo++;
      const isSuper = state.combo >= 2;

      // [복구] 물대포 VFX 발사
      shootWater(e.clientX, e.clientY, isSuper);

      el.style.transform = 'scale(1.3) !important';
      setManagedTimeout(() => {
        if (el && el.isConnected) el.style.transform = '';
      }, 300);

      if (state.options.speakGuide) {
        if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
          window.SihyeonVoice.play('dispatch.dispatch', '').catch(() => {});
        }
      }

      if (state.userIndex >= state.mission.length) {
        state.isBusy = true;
        setManagedTimeout(finishRound, 700);
      } else {
        render();
        updateTargetGlow();
      }
    } else {
      state.combo = 0;
      if (root) {
        root.classList.add('md-shake');
        setManagedTimeout(() => {
          if (root && root.isConnected) root.classList.remove('md-shake');
        }, 450);
      }
      if (state.options.speakGuide) {
        if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
          window.SihyeonVoice.play('dispatch.tryAgain', '').catch(() => {});
        }
      }
    }
  }

  function finishRound() {
    if (state.destroyed || !state.container || state.successRewardGiven) return;

    state.successRewardGiven = true;

    if (state.options.fireConfetti) state.options.fireConfetti();
    state.options.gainExp?.(20);

    // [보충] 성공 시 골드 장식
    state.container.querySelectorAll('.md14-truck-btn').forEach(btn => {
      btn.style.background = 'linear-gradient(45deg, gold, #ff1744)';
    });

    if (state.currentLevel >= 8) {
      showEnding();
      return;
    }

    state.currentLevel++;
    setManagedTimeout(startRound, 2500);
  }

  function showEnding() {
    state.isEnding = true;
    renderEnding(true);
  }

  function renderEnding(playCompleteVoice) {
    if (!state.container) return;

    state.container.innerHTML = `
      <div class="${getRootClass()}">
        <div class="md14-city-bg"></div>
        <div class="md14-start-screen">
          <h1 style="font-size: clamp(34px, 8vw, 48px); color: gold; text-shadow: 0 0 20px red; margin: 0;">👑 전설의 본부장 시현 👑</h1>
          <p style="font-size: clamp(20px, 5vw, 26px); margin: 20px 0;">시현이가 마을을 지켜냈어요!</p>
          <button class="mode-btn" style="font-size:32px;" type="button" data-action="reload">출동! 🔄</button>
        </div>
      </div>
    `;

    state.container.querySelector('[data-action="reload"]')?.addEventListener('click', () => {
      location.reload();
    });

    if (playCompleteVoice && !state.completeRewardGiven) {
      state.completeRewardGiven = true;
      if (state.options.speakGuide) {
        if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
          window.SihyeonVoice.play('dispatch.missionComplete', '').catch(() => {});
        }
      }
    }
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = {
    render: (c, o) => {
      clearManagedTimers();
      state.container = c;
      state.options = o || {};
      state.destroyed = false;
      state.gameStarted = false;
      state.isBusy = false;
      state.isEnding = false;
      state.successRewardGiven = false;
      state.completeRewardGiven = false;
      state.layoutMode = getLayoutMode();
      injectStyle();
      bindLayoutEvents();
      showModeSelection();
    },
    destroy: () => {
      state.destroyed = true;
      state.gameStarted = false;
      state.isBusy = false;
      state.isEnding = false;
      clearManagedTimers();
      unbindLayoutEvents();
      if (state.container) state.container.innerHTML = '';
      state.container = null;
      state.options = {};
      const style = document.getElementById(STYLE_ID);
      if (style) style.remove();
    }
  };
})();