/**
 * 시현이 놀이터 OS — 초강력 소방대 V14 (Full Feature Edition)
 * [업데이트] 18종 풀로드, 3가지 모드(4/9/16), 물대포 VFX 복구, 타겟 글로우, 엔딩, 이미지 폴백 완비
 * [유지보수] 모바일 세로 / 태블릿 가로 DOM 이원 구조 보강, resize 상태 유지, 보상 중복 방지
 */

(function () {
  const GAME_KEY = 'megaDispatch';
  const STYLE_ID = 'sihyeon-mega-style';
  const HELP_KEY = 'sihyeon-mega-dispatch-help-v1';
  let helpPreferenceDirty = false;
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
    helpEnabled: true,
    playMode: 'sequence',
    field: null,
    catalogFailed: false,
    catalogToken: 0,
    timers: [],
    roundToken: 0
  };

  function readHelpPreference(fallback = true) {
    if (helpPreferenceDirty) return fallback;
    try {
      const saved = window.localStorage.getItem(HELP_KEY);
      return saved === 'off' ? false : saved === 'on' ? true : fallback;
    } catch (_) { return fallback; }
  }

  function updateHelpButton() {
    const button = state.container?.querySelector('[data-action="help"]');
    if (!button) return;
    const label = state.helpEnabled ? '도움 켜짐. 스스로 찾기로 바꾸기' : '스스로 찾는 중. 도움 켜기';
    button.setAttribute('aria-pressed', String(state.helpEnabled));
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.innerHTML = `<span aria-hidden="true">${state.helpEnabled ? '💡' : '🔎'}</span><span class="md14-help-label">${state.helpEnabled ? '도움' : '찾기'}</span>`;
    button.onclick = () => {
      if (state.destroyed) return;
      state.helpEnabled = !state.helpEnabled;
      try {
        window.localStorage.setItem(HELP_KEY, state.helpEnabled ? 'on' : 'off');
        helpPreferenceDirty = false;
      } catch (_) { helpPreferenceDirty = true; }
      updateHelpButton();
      updateTargetGlow();
    };
  }

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

  // Role play uses reviewed capabilities, while picture practice keeps exact gameId matching.
  // A vehicle whose equipment is uncertain is never silently used as a wrong answer.
  const FIELD_ROLES = {
    supply: {
      ids: ['water_tanker'], wrong: ['ladder_truck', 'smoke_extraction_fan_truck', 'fire_command_vehicle'],
      icon: '💧', need: '물이 부족해요. 큰 물통에 물을 싣고 올 차를 골라요.',
      needEn: 'We need more water. Choose a tanker that carries a big tank of water.',
      reason: '큰 물통에 물을 싣고 왔어요. 현장의 물통을 채워 볼까요?',
      reasonEn: 'The tanker brought water. Let us fill the water tank at the scene.',
      action: '물 채우기', actionEn: 'Fill the tank', total: 2
    },
    pump: {
      ids: ['pump_engine'], wrong: ['smoke_extraction_fan_truck', 'fire_command_vehicle', 'fire_command_suv', 'rescue_fire_truck'],
      icon: '💦', need: '물이 준비됐어요. 호스로 물을 보내는 펌프차를 골라요.',
      needEn: 'The water is ready. Choose the pump engine to send water through a hose.',
      reason: '펌프차가 준비된 물을 호스로 보내요. 넓은 물 버튼을 눌러 봐요.',
      reasonEn: 'The pump engine sends our water through a hose. Press the big water button.',
      action: '물 뿌리기', actionEn: 'Spray water', total: 3
    },
    ladder: {
      ids: ['ladder_truck', 'aerial_ladder_truck', 'articulating_ladder_truck'],
      wrong: ['water_tanker', 'smoke_extraction_fan_truck', 'fire_command_vehicle'],
      icon: '🪜', need: '친구가 높은 창문에서 기다려요. 사다리가 있는 차를 골라요.',
      needEn: 'Our friend is waiting at a high window. Choose a truck with a ladder.',
      reason: '사다리로 높은 창문까지 닿을 수 있어요. 사다리를 펼쳐 볼까요?',
      reasonEn: 'A ladder can reach the high window. Let us raise the ladder.',
      action: '사다리 올리기', actionEn: 'Raise the ladder', total: 3
    },
    smoke: {
      ids: ['smoke_extraction_fan_truck'], wrong: ['water_tanker', 'ladder_truck', 'fire_command_vehicle'],
      icon: '🌀', need: '불은 꺼졌지만 연기가 남았어요. 큰 선풍기가 있는 차를 골라요.',
      needEn: 'The fire is out, but smoke remains. Choose the truck with a big fan.',
      reason: '커다란 선풍기가 연기를 밖으로 보내요. 바람을 보내 볼까요?',
      reasonEn: 'The big fan moves the smoke out. Let us send some air.',
      action: '바람 보내기', actionEn: 'Send some air', total: 3
    }
  };
  const FIELD_INCIDENTS = [
    { id: 'water', icon: '💧', title: '물을 함께 준비해요', subtitle: '물탱크차와 펌프차가 함께해요', steps: ['supply', 'pump'] },
    { id: 'ladder', icon: '🪜', title: '높은 곳의 친구', subtitle: '사다리로 안전하게 내려와요', steps: ['ladder'] },
    { id: 'smoke', icon: '🌀', title: '연기를 걷어 줘요', subtitle: '불이 꺼진 창고에 바람을 보내요', steps: ['smoke'] }
  ];

  function fieldEscape(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function fieldSpeak(ko, en) {
    const language = window.SihyeonPlaySettings?.getLanguage?.() || 'ko';
    const text = language === 'en' ? en : ko;
    if (!text || state.destroyed || state.playMode !== 'field') return;
    try { Promise.resolve(state.options.say?.(text)).catch(() => {}); } catch (_) {}
  }

  function stopFieldVoice() {
    try { window.SihyeonVoice?.stop?.(); } catch (_) {}
  }

  function fieldIncident() {
    return FIELD_INCIDENTS.find(incident => incident.id === state.field?.incidentId) || null;
  }

  function fieldRole() {
    return FIELD_ROLES[fieldIncident()?.steps[state.field?.stepIndex]] || null;
  }

  function availableFieldIncidents() {
    return FIELD_INCIDENTS.filter(incident => incident.steps.every(key =>
      state.allTrucks.some(truck => FIELD_ROLES[key].ids.includes(truck.id))));
  }

  function makeFieldChoices(role) {
    if (!role) return [];
    const correct = state.allTrucks.filter(truck => role.ids.includes(truck.id));
    if (!correct.length) return [];
    const seen = new Set();
    const other = state.allTrucks.filter(truck => role.wrong.includes(truck.id) && !seen.has(truck.id) && seen.add(truck.id));
    // Keep every reviewed normal/special variant visible, including all four ladder pictures.
    return [...correct, ...other.slice(0, 2)].sort(() => Math.random() - 0.5);
  }

  function freshFieldWorld(incidentId) {
    return { water: 0, fire: incidentId === 'water' ? 3 : 0, ladder: 0,
      rescued: false, smoke: incidentId === 'smoke' ? 3 : 0, safe: false };
  }

  function fieldWrongRole(truck) {
    const id = truck.id;
    if (id === 'water_tanker') return ['이 차는 큰 물통에 물을 싣고 와요.', 'This tanker brings a big tank of water.'];
    if (FIELD_ROLES.ladder.ids.includes(id)) return ['이 차는 사다리를 펼쳐 높은 곳에 닿아요.', 'This truck raises a ladder to reach high places.'];
    if (id === 'smoke_extraction_fan_truck') return ['이 차는 커다란 선풍기로 연기를 보내요.', 'This truck uses a big fan to move smoke away.'];
    if (id === 'rescue_fire_truck') return ['이 차는 구조 장비를 싣고 와요.', 'This truck brings rescue equipment.'];
    return ['이 차는 현장을 살피며 소방대에 알려 줘요.', 'This command vehicle checks the scene and guides the fire crew.'];
  }

  function isLandscapeMode() {
    const width = window.innerWidth || document.documentElement.clientWidth || 0;
    const height = window.innerHeight || document.documentElement.clientHeight || 0;
    return width >= 640 && width > height;
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
      if (state.layoutMode === nextMode) {
        if (state.playMode === 'field') fitFieldScene();
        return;
      }
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

      .md14-top-controls {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 6px;
      }
      .md14-top-controls .md14-level-badge { white-space: normal; text-align: center; }
      .md14-help-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-width: 48px;
        min-height: 48px;
        padding: 6px 8px;
        border: 2px solid #b7c9d5;
        border-radius: 14px;
        background: #fff;
        color: #17324a;
        font: inherit;
        font-size: 23px;
        cursor: pointer;
        touch-action: manipulation;
      }
      .md14-help-toggle[aria-pressed="true"] { background: #fff4b7; border-color: #d6a825; }
      .md14-help-toggle:focus-visible { outline: 3px solid #80d8ff; outline-offset: 3px; }
      .md14-help-label { font-size: 14px; font-weight: 900; }
      .md14-start-screen > .md14-help-toggle { margin-bottom: 16px; }

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
      .md-mission-card > .sv-vehicle-frame { max-width: 85%; max-height: 85%; }
      .md14-scene-target > .sv-vehicle-frame { max-width: 86%; max-height: 86%; }
      .md14-truck-btn > .sv-vehicle-frame { max-width: 90%; max-height: 90%; }

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
        aspect-ratio: auto;
        background: #fff;
        border-radius: 20px;
        border: none;
        box-shadow: 0 8px 0 #888;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        min-height: 44px;
        min-width: 0;
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
      /* Row heights follow the available panel, not the width of a square card. */
      .md14-garage { align-content: stretch; }
      .md14-garage.grid-4 { grid-template-rows: repeat(2, minmax(0, 1fr)); }
      .md14-garage.grid-9 { grid-template-rows: repeat(3, minmax(0, 1fr)); }
      .md14-garage.grid-16 { grid-template-rows: repeat(4, minmax(0, 1fr)); }
      @media (orientation: landscape) and (max-height: 640px) {
        .dispatch-landscape { grid-template-columns: minmax(112px, .72fr) minmax(0, 1fr) minmax(210px, 1.28fr); gap: 8px; padding: 8px; }
        .dispatch-landscape .md14-status-panel { grid-template-rows: auto auto minmax(0, 1fr); padding: 6px; gap: 6px; border-radius: 20px; }
        .dispatch-landscape .md14-level-badge { min-height: 30px; padding: 4px; font-size: 14px; }
        .dispatch-landscape .md14-top-controls .md14-help-label { display: none; }
        .dispatch-landscape .md14-top-controls .md14-help-toggle { padding: 4px; }
        .dispatch-landscape .md14-title { font-size: 18px; }
        .dispatch-landscape .md14-subtitle { display: none; }
        .dispatch-landscape .md14-header { padding: 8px 4px; gap: 8px; border-radius: 18px; }
        .dispatch-landscape .md-mission-card { width: 54px; height: 54px; }
        .dispatch-landscape .md-mission-card.preview-large { width: 82px; height: 82px; }
        .dispatch-landscape .md14-scene-inner { padding: 8px; }
        .dispatch-landscape .md14-scene-target { width: min(78%, 42vh); border-radius: 22px; }
        .dispatch-landscape .md14-scene-caption { bottom: 8px; padding: 7px 5px; font-size: 14px; }
        .dispatch-landscape .md14-garage { padding: 8px; gap: 8px; border-radius: 20px; }
        .dispatch-landscape .md14-truck-btn { min-height: 44px; padding: 5px; border-radius: 14px; }
      }

      .md-field-entry { overflow-y: auto; justify-content: flex-start; padding: 18px; }
      .md-field-entry-inner { width: min(100%, 850px); margin: auto; display: grid; gap: 14px; }
      .md-field-entry-head { display: flex; align-items: center; justify-content: center; gap: 12px; padding-left: 44px; }
      .md-field-entry-head .md14-title { font-size: clamp(25px, 5vw, 38px); }
      .md-field-entry-head .md14-help-toggle { flex: 0 0 auto; }
      .md-field-entry p { margin: 0; color: #e8edf2; font-size: 18px; line-height: 1.4; }
      .md-field-entry .md-field-primary { width: 100%; min-height: 96px; background: #ffcc43; color: #251900; box-shadow: 0 6px 0 #b87b14; font-size: 28px; }
      .md-field-primary small { display: block; font-size: 16px; line-height: 1.5; font-weight: 400; }
      .md-field-practice { padding: 14px; background: #182633; border: 2px solid #455565; border-radius: 22px; }
      .md-field-practice h2 { margin: 0 0 12px; font-size: 20px; color: #fff; }
      .md-field-entry .md14-mode-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
      .md-field-entry .mode-btn[data-mode-size] { width: 100%; padding: 10px 4px; min-height: 68px; font-size: 18px; }
      .md-field-entry .mode-btn[data-mode-size] small { display: block; font-size: 14px; }

      .md-field-root { display: grid; grid-template-rows: auto minmax(0, 1fr); gap: 8px; padding: 10px; background: linear-gradient(150deg, #142938, #081722); }
      .md-field-top { min-height: 48px; padding-left: 56px; display: flex; align-items: center; gap: 7px; }
      .md-field-top h1 { flex: 1 1 auto; min-width: 0; margin: 0; color: #ffde66; font-size: clamp(19px, 3.4vw, 29px); line-height: 1.15; }
      .md-field-top .md14-help-toggle { flex: 0 0 auto; }
      .md-field-small { border: 2px solid #839bab; border-radius: 13px; background: #fff; color: #183241; font: inherit; font-size: 17px; min-width: 48px; min-height: 48px; padding: 6px 10px; cursor: pointer; }
      .md-field-small:focus-visible, .md-field-go:focus-visible, .md-field-choice:focus-visible, .md-field-incident:focus-visible { outline: 4px solid #ffe266; outline-offset: 2px; }
      .md-field-menu { min-height: 0; overflow-y: auto; display: flex; flex-direction: column; align-items: stretch; gap: 12px; padding: 6px 2px 10px; }
      .md-field-menu h2 { margin: 0; text-align: center; font-size: clamp(21px, 4vw, 30px); color: #fff6cf; }
      .md-field-menu p { margin: 0; text-align: center; font-size: 17px; line-height: 1.4; }
      .md-field-incidents { flex: 1 0 auto; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; align-content: center; }
      .md-field-incident { min-width: 0; min-height: 150px; border: 3px solid #f5d67a; border-radius: 22px; background: #fff8e8; color: #263644; font: inherit; cursor: pointer; padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 8px; box-shadow: 0 5px 0 #866328; }
      .md-field-incident svg { width: 100%; height: auto; max-height: 200px; }
      .md-field-incident b { font-size: 21px; line-height: 1.2; }
      .md-field-incident small { font-size: 15px; line-height: 1.35; }
      .md-field-done-mark { color: #147047; font-size: 16px; }
      .md-field-menu-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
      .md-field-warning { background: #fff4d3; color: #4a3714; border-radius: 12px; padding: 10px; }
      .md-field-loading { display: grid; place-items: center; padding: 20px; text-align: center; font-size: 23px; color: #fff6cf; }

      .md-field-layout { min-height: 0; display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(230px, 1fr); grid-template-rows: auto minmax(0, 1fr); gap: 10px; }
      .md-field-brief { grid-column: 1 / -1; display: grid; gap: 5px; padding: 10px 14px; border-radius: 18px; background: #fff9e8; color: #273b46; border: 2px solid #e9cb75; }
      .md-field-brief h2 { margin: 0; font-size: clamp(20px, 3vw, 27px); line-height: 1.2; }
      .md-field-brief p { margin: 0; font-size: clamp(16px, 2vw, 21px); line-height: 1.35; }
      .md-field-scene { position: relative; min-height: 0; overflow: hidden; border: 3px solid #526e7e; border-radius: 24px; background: #bde6f1; display: grid; place-items: center; }
      .md-field-canvas { position: relative; width: 100%; aspect-ratio: 16 / 9; max-width: 100%; max-height: 100%; }
      .md-field-canvas > svg { width: 100%; height: 100%; display: block; }
      .md-field-engine { position: absolute; left: 5%; bottom: 7%; width: 35%; height: 28%; display: grid; place-items: center; filter: drop-shadow(0 4px 2px #16313f55); }
      .md-field-engine > img, .md-field-engine > .sv-vehicle-frame { width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: contain; }
      .md-field-engine.is-arriving { animation: mdFieldArrive .55s ease-out both; }
      @keyframes mdFieldArrive { from { transform: translateX(-140%); } to { transform: translateX(0); } }
      .md-field-water-jet { stroke-dasharray: 12 8; animation: mdFieldWater .55s linear both; }
      @keyframes mdFieldWater { from { stroke-dashoffset: 35; opacity: 1; } to { stroke-dashoffset: 0; opacity: 0; } }
      .md-field-controls { min-height: 0; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
      .md-field-choices { min-height: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
      .md-field-choices.has-six { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .md-field-choice { min-width: 0; min-height: 118px; padding: 7px; border: 3px solid #d5e1e7; border-radius: 18px; background: #fff; color: #18313e; box-shadow: 0 4px 0 #718594; font: inherit; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 5px; }
      .md-field-choice-media { width: 100%; min-height: 0; height: 82px; display: grid; place-items: center; }
      .md-field-choice-media > img, .md-field-choice-media > .sv-vehicle-frame { width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: contain; }
      .md-field-choice b { font-size: 15px; line-height: 1.2; overflow-wrap: anywhere; }
      .md-field-choice.target-glow { border-color: #fbc52c; box-shadow: 0 0 0 2px #fbc52c, 0 4px 0 #8c6718; background: #fffbe5; }
      .md-field-choice.is-reconsidered { border-color: #75a8bd; background: #edf7fb; }
      .md-field-feedback { min-height: 0; margin: 0; padding: 9px 11px; border-radius: 14px; background: #eaf6ff; color: #234554; font-size: 16px; line-height: 1.4; }
      .md-field-go { width: 100%; min-height: 68px; border: 3px solid #fff2b8; border-radius: 20px; padding: 12px; background: #ffcd4c; color: #352600; box-shadow: 0 5px 0 #a76c11; font: inherit; font-size: 24px; cursor: pointer; }
      .md-field-go:active { transform: translateY(3px); box-shadow: 0 2px 0 #a76c11; }
      .md-field-go:disabled { cursor: default; background: #bdd2dd; border-color: #dce9ef; color: #314c59; box-shadow: none; }
      .md-field-work-title { margin: 0; color: #fff3c9; font-size: 21px; text-align: center; line-height: 1.3; }
      .md-field-progress { display: flex; justify-content: center; gap: 8px; }
      .md-field-progress span { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #9db5c3; background: #233d4c; }
      .md-field-progress span.done { background: #ffcf4b; border-color: #fff0ac; }
      .md-field-result { background: #e6f8e9; color: #24503b; border: 2px solid #a3d9ab; border-radius: 18px; padding: 14px; text-align: center; font-size: 22px; line-height: 1.4; }
      @media (orientation: portrait) {
        .md-field-layout { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(130px, 1fr) auto; gap: 8px; }
        .md-field-brief { grid-column: auto; }
        .md-field-choices { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .md-field-choices.has-six { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .md-field-controls { gap: 8px; }
        .md-field-choice { min-height: 105px; }
        .md-field-choice-media { height: 70px; }
        .md-field-incidents { grid-template-columns: minmax(0, 1fr); gap: 11px; }
        .md-field-incident { min-height: 120px; display: grid; grid-template-columns: 38% minmax(0, 1fr); grid-template-rows: auto auto; gap: 4px 12px; text-align: left; }
        .md-field-incident svg { grid-row: 1 / -1; max-height: 115px; }
        .md-field-incident b { align-self: end; font-size: 21px; }
        .md-field-incident small { align-self: start; }
      }
      @media (orientation: portrait) and (max-height: 690px) {
        .md-field-root { padding: 7px; gap: 5px; }
        .md-field-top { min-height: 44px; padding-left: 50px; gap: 5px; }
        .md-field-top h1 { font-size: 18px; }
        .md-field-top .md14-help-label { display: none; }
        .md-field-small { padding: 5px; min-width: 44px; min-height: 44px; font-size: 15px; }
        .md-field-brief { padding: 7px 10px; gap: 3px; border-radius: 14px; }
        .md-field-brief h2 { font-size: 19px; }
        .md-field-brief p { font-size: 15px; }
        .md-field-choice { min-height: 88px; padding: 4px; gap: 2px; border-radius: 13px; }
        .md-field-choice-media { height: 51px; }
        .md-field-choice b { font-size: 13px; }
        .md-field-feedback { font-size: 14px; padding: 6px 8px; }
        .md-field-choices { gap: 7px; }
        .md-field-go { min-height: 58px; padding: 8px; font-size: 21px; }
        .md-field-result { padding: 9px; font-size: 19px; }
        .md-field-incident { min-height: 104px; padding: 7px; }
        .md-field-incident b { font-size: 19px; }
        .md-field-incident small { font-size: 14px; }
      }
      @media (orientation: landscape) and (max-height: 520px) {
        .md-field-entry { padding: 10px 14px; }
        .md-field-entry-inner { gap: 8px; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
        .md-field-entry-head, .md-field-entry-inner > p { grid-column: 1 / -1; }
        .md-field-entry-head .md14-title { font-size: 27px; }
        .md-field-entry .md-field-primary { min-height: 112px; }
        .md-field-practice { padding: 10px; }
        .md-field-practice h2 { margin-bottom: 8px; font-size: 18px; }
        .md-field-entry .mode-btn[data-mode-size] { min-height: 64px; font-size: 16px; }
        .md-field-root { padding: 6px; gap: 5px; }
        .md-field-top { min-height: 44px; padding-left: 48px; }
        .md-field-top h1 { font-size: 21px; }
        .md-field-top .md14-help-toggle, .md-field-small { min-height: 44px; }
        .md-field-layout { grid-template-columns: minmax(0, 1.2fr) minmax(230px, 1fr); gap: 7px; }
        .md-field-brief { padding: 6px 10px; gap: 2px; border-radius: 13px; }
        .md-field-brief h2 { font-size: 18px; }
        .md-field-brief p { font-size: 15px; }
        .md-field-choice { min-height: 77px; padding: 4px; gap: 2px; border-radius: 12px; }
        .md-field-choice-media { height: 48px; }
        .md-field-choice b { font-size: 12px; }
        .md-field-controls { gap: 6px; }
        .md-field-choices { gap: 6px; }
        .md-field-feedback { padding: 6px 8px; font-size: 14px; }
        .md-field-go { min-height: 54px; font-size: 21px; padding: 8px; }
        .md-field-result { font-size: 18px; padding: 9px; }
        .md-field-work-title { font-size: 18px; }
        .md-field-menu { gap: 8px; padding: 2px; }
        .md-field-menu h2 { font-size: 22px; }
        .md-field-menu p { font-size: 15px; }
        .md-field-incidents { gap: 10px; }
        .md-field-incident { padding: 7px; min-height: 132px; gap: 4px; }
        .md-field-incident svg { max-height: 94px; }
        .md-field-incident b { font-size: 18px; }
        .md-field-incident small { font-size: 13px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .md-field-engine.is-arriving, .md-field-water-jet { animation: none; }
      }
    `;
    document.head.appendChild(s);
  }

  function fieldSceneMarkup(incidentId, world) {
    const w = world || freshFieldWorld(incidentId);
    const person = (x, y, safe) => `<g data-scene-person transform="translate(${x} ${y})"><circle cy="-24" r="12" fill="#ffd3a8" stroke="#533d34" stroke-width="2"/><path d="M-10 -9 L10 -9 L14 18 L-14 18Z" fill="${safe ? '#63c79b' : '#ffd056'}" stroke="#354f63" stroke-width="2"/><path d="M-6 18L-8 31M6 18L8 31M-10 -5L-21 ${safe ? '-14' : '7'}M10 -5L21 ${safe ? '-14' : '7'}" fill="none" stroke="#354f63" stroke-width="5" stroke-linecap="round"/><circle cx="-4" cy="-26" r="1.5"/><circle cx="4" cy="-26" r="1.5"/><path d="M-4 -20Q0 -16 4 -20" fill="none" stroke="#754b3e" stroke-width="2"/></g>`;
    let scene = '';
    if (incidentId === 'ladder') {
      const fraction = Math.min(2, w.ladder) / 2;
      const bx = 220, by = 292, tx = bx + 220 * fraction, ty = by - 142 * fraction;
      const rungs = Array.from({ length: Math.round(fraction * 11) }, (_, index) => {
        const t = (index + 1) / 12;
        const x = bx + 220 * t, y = by - 142 * t;
        return `<path d="M${x - 5} ${y - 8}L${x + 5} ${y + 8}" stroke="#fff0ab" stroke-width="5"/>`;
      }).join('');
      scene = `<rect x="354" y="55" width="190" height="253" rx="8" fill="#f2bd8d" stroke="#9b7161" stroke-width="4"/>
        <path d="M342 60L449 22L556 60Z" fill="#b86160"/>
        ${[91, 168, 245].map(y => [385, 474].map(x => `<rect x="${x}" y="${y}" width="39" height="43" rx="4" fill="#a9dceb" stroke="#765e58" stroke-width="4"/>`).join('')).join('')}
        <rect x="426" y="128" width="64" height="31" rx="4" fill="#ecdbb1" stroke="#7c685e" stroke-width="3"/>
        <g data-scene-ladder>${fraction ? `<path d="M${bx - 5} ${by - 8}L${tx - 5} ${ty - 8}M${bx + 5} ${by + 8}L${tx + 5} ${ty + 8}" fill="none" stroke="#ffdf67" stroke-width="7"/>${rungs}` : ''}</g>
        ${person(w.rescued ? 570 : 456, w.rescued ? 294 : 124, w.rescued)}`;
    } else {
      scene = `<rect x="343" y="121" width="244" height="183" rx="9" fill="#eac4a2" stroke="#98705c" stroke-width="4"/>
        <path d="M327 126L464 69L602 126Z" fill="#b86659" stroke="#8c5148" stroke-width="4"/>
        <rect x="392" y="160" width="144" height="144" rx="6" fill="#60747a" stroke="#8b6b54" stroke-width="7"/>
        <path d="M400 193H528M400 228H528M400 263H528" stroke="#7d9094" stroke-width="4"/>`;
      if (incidentId === 'water') {
        const height = Math.round(78 * Math.max(0, Math.min(2, w.water)) / 2);
        scene += `<rect x="238" y="208" width="80" height="93" rx="9" fill="#e9f5f7" stroke="#557885" stroke-width="5"/>
          <rect data-scene-water x="244" y="${294 - height}" width="68" height="${height}" rx="4" fill="#46b5ed"/>
          <text x="278" y="197" text-anchor="middle" font-size="21" font-weight="bold" fill="#244d5b">물통</text>
          ${Array.from({ length: w.fire }, (_, index) => `<g data-scene-fire transform="translate(${395 + index * 64} 272)"><path d="M-23 0C-39 -24 -15 -43 -12 -61C-2 -49 4 -39 3 -27C19 -42 13 -59 23 -71C52 -21 32 8 0 10C-9 10 -17 6 -23 0Z" fill="#f08032" stroke="#b9502d" stroke-width="3"/><path d="M-9 2C-19 -9 -6 -25 -4 -34C2 -22 13 -15 13 -5C13 8 2 13 -9 2Z" fill="#ffe071"/></g>`).join('')}
          ${w.safe ? person(569, 294, true) : ''}`;
        if (w.fire < 3 && w.fire > 0) scene += '<path class="md-field-water-jet" d="M185 263Q285 171 445 239" fill="none" stroke="#60c8fb" stroke-width="10"/>';
      } else {
        scene += Array.from({ length: w.smoke }, (_, index) => `<g data-scene-smoke transform="translate(${395 + index * 54} ${181 - (index % 2) * 30})"><circle r="43" fill="#70838b" opacity=".88"/><circle cx="-23" cy="20" r="31" fill="#71858d"/><circle cx="24" cy="17" r="35" fill="#86989e"/></g>`).join('');
        if (w.smoke < 3) scene += '<g data-scene-air fill="none" stroke="#effcff" stroke-width="7" stroke-linecap="round"><path d="M160 232Q255 171 349 198M179 257Q279 208 365 232M203 285Q285 251 355 263"/></g>';
        if (w.safe) scene += person(559, 294, true);
      }
    }
    return `<svg viewBox="0 0 640 360" role="img" aria-label="${fieldEscape(incidentId === 'ladder' ? (w.rescued ? '친구가 안전한 곳에 내려왔어요' : '높은 창문에서 친구가 기다려요') : incidentId === 'water' ? `물통과 불 ${w.fire}개가 있는 현장` : `연기 ${w.smoke}덩이가 남은 창고`)}">
      <rect width="640" height="360" fill="#bfe6f0"/><circle cx="77" cy="62" r="30" fill="#ffe79b"/>
      <path d="M0 208Q95 142 183 202Q255 160 340 210L640 210V360H0Z" fill="#99cba7"/>
      <rect y="291" width="640" height="69" fill="#72868b"/><path d="M0 331H640" stroke="#eee4ad" stroke-width="5" stroke-dasharray="30 22"/>
      <rect x="537" y="283" width="87" height="45" rx="11" fill="#bce2ae"/>
      ${scene}
      ${w.safe ? '<g data-scene-safe><circle cx="594" cy="45" r="28" fill="#3c9f75" stroke="#f4ffed" stroke-width="4"/><path d="M580 45L590 55L609 34" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>' : ''}
    </svg>`;
  }

  function fieldHeader() {
    const total = availableFieldIncidents().length;
    const completed = availableFieldIncidents().filter(incident => state.field?.completed.includes(incident.id)).length;
    return `<header class="md-field-top"><h1>현장 출동${total ? ` · ${completed}/${total}` : ''}</h1>
      <button class="md-field-small" type="button" data-field-listen aria-label="지금 안내 다시 듣기">🔊</button>
      <button class="md14-help-toggle" type="button" data-action="help"></button>
      <button class="md-field-small" type="button" data-field-home>본부</button></header>`;
  }

  function fitFieldScene() {
    const scene = state.container?.querySelector('.md-field-scene');
    const canvas = scene?.querySelector('.md-field-canvas');
    if (!canvas || !(scene.clientWidth > 0) || !(scene.clientHeight > 0)) return;
    const width = Math.min(scene.clientWidth, scene.clientHeight * 16 / 9);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${width * 9 / 16}px`;
  }

  function renderField() {
    if (!state.container || state.destroyed || !state.field) return;
    state.layoutMode = getLayoutMode();
    const f = state.field;
    if (f.phase === 'loading') {
      state.container.innerHTML = `<div class="md14-root md-field-root">${fieldHeader()}<div class="md-field-loading" role="status">🚒 출동할 차를 준비하고 있어요</div></div>`;
      bindFieldControls();
      return;
    }
    if (f.phase === 'menu') {
      const available = availableFieldIncidents();
      const allDone = available.length > 0 && available.every(incident => f.completed.includes(incident.id));
      state.container.innerHTML = `<div class="md14-root md-field-root">${fieldHeader()}<section class="md-field-menu" aria-label="출동할 사건 선택">
        <h2>${allDone ? '마을이 편안해졌어요! 👏' : available.length ? '어디부터 도와줄까요?' : '출동할 차를 다시 불러와요'}</h2>
        <p>${allDone ? '시현이가 고른 차들이 함께 도왔어요.' : '현장을 고르고 소방대와 함께 도와줘요.'}</p>
        <div class="md-field-incidents">${available.map(incident => `<button class="md-field-incident" type="button" data-field-incident="${incident.id}">
          ${fieldSceneMarkup(incident.id)}<b>${incident.icon} ${incident.title}</b><small>${f.completed.includes(incident.id) ? '<span class="md-field-done-mark">✓ 도와줬어요 · 다시 출동</span>' : incident.subtitle}</small></button>`).join('')}</div>
        ${state.catalogFailed ? '<p class="md-field-warning">아직 오지 않은 차가 있어요. 다시 불러올 수 있어요.</p>' : ''}
        <div class="md-field-menu-actions">${state.catalogFailed || !available.length ? '<button class="md-field-small" type="button" data-field-retry>차량 다시 불러오기</button>' : ''}
          ${allDone ? '<button class="md-field-small" type="button" data-field-again>더 출동! 🚒</button>' : ''}
          <button class="md-field-small" type="button" data-field-home>본부로</button></div>
      </section></div>`;
      bindFieldControls();
      return;
    }
    const incident = fieldIncident(), role = fieldRole();
    if (!incident || !role) return;
    const isLastStep = f.stepIndex === incident.steps.length - 1;
    const working = f.phase === 'work' || f.phase === 'arrival';
    const actionLabel = role === FIELD_ROLES.ladder && f.actionCount >= 2 ? '친구 내려오기' : role.action;
    let controls = '';
    if (f.phase === 'choose') {
      controls = `<div class="md-field-choices ${f.choices.length > 4 ? 'has-six' : ''}">${f.choices.map(truck => `<button class="md-field-choice ${f.reconsidered === truck.gameId ? 'is-reconsidered' : ''}" type="button" data-field-game-id="${fieldEscape(truck.gameId)}" aria-label="${fieldEscape(truck.name_ko || truck.name || '소방차')} 출동">
        <span class="md-field-choice-media"><img src="${fieldEscape(truck.file)}" alt="${fieldEscape(truck.name_ko || truck.name || '소방차')}" onerror="this.outerHTML='<span aria-label=&quot;소방차 그림&quot;>🚒</span>'"></span><b>${fieldEscape(truck.name_ko || truck.name || '소방차')}</b></button>`).join('')}</div>
        ${f.message ? `<p class="md-field-feedback" role="status">${fieldEscape(f.message)}</p>` : ''}`;
    } else if (working) {
      controls = `<p class="md-field-work-title">${f.phase === 'arrival' ? '현장으로 출동해요! 🚒' : fieldEscape(f.selected?.name_ko || '소방차') + '와 함께해요'}</p>
        <div class="md-field-progress" aria-label="작업 ${f.actionCount}/${role.total}">${Array.from({ length: role.total }, (_, index) => `<span class="${index < f.actionCount ? 'done' : ''}" aria-hidden="true"></span>`).join('')}</div>
        <button class="md-field-go" type="button" data-field-work ${f.phase === 'arrival' ? 'disabled' : ''}>${role.icon} ${actionLabel}</button>
        <p class="md-field-feedback" role="status">${fieldEscape(f.message || role.reason)}</p>`;
    } else {
      controls = `<div class="md-field-result" role="status">${fieldEscape(f.message)}</div>
        <button class="md-field-go" type="button" data-field-next>${isLastStep ? '다른 사건 고르기 🚒' : '다음 일 · 물 뿌리기 ▶'}</button>
        <button class="md-field-small" type="button" data-field-home>본부로</button>`;
    }
    state.container.innerHTML = `<div class="md14-root md-field-root">${fieldHeader()}<main class="md-field-layout" data-field-phase="${f.phase}" data-field-role="${incident.steps[f.stepIndex]}">
      <section class="md-field-brief"><h2>${incident.icon} ${incident.title}${incident.steps.length > 1 ? ` · ${f.stepIndex + 1}/${incident.steps.length}` : ''}</h2><p>${fieldEscape(f.phase === 'choose' ? role.need : f.phase === 'result' ? '현장이 이렇게 바뀌었어요. 다음 일을 골라요.' : f.phase === 'arrival' ? '선택한 차가 현장으로 출동해요.' : `${actionLabel} · 준비되면 큰 버튼을 눌러요.`)}</p></section>
      <section class="md-field-scene" aria-label="선택에 따라 변하는 출동 현장" data-field-scene="${incident.id}"><div class="md-field-canvas">${fieldSceneMarkup(incident.id, f.world)}
        ${f.selected ? `<div class="md-field-engine ${f.phase === 'arrival' ? 'is-arriving' : ''}"><img src="${fieldEscape(f.selected.file)}" alt="${fieldEscape(f.selected.name_ko || '출동한 소방차')}" onerror="this.outerHTML='<span style=&quot;font-size:50px&quot;>🚒</span>'"></div>` : ''}</div></section>
      <section class="md-field-controls" aria-label="${f.phase === 'choose' ? '역할에 맞는 차 선택' : '현장 작업'}">${controls}</section>
    </main></div>`;
    state.container.querySelectorAll('.md-field-choice-media img, .md-field-engine img').forEach(img => window.SihyeonVehicleDisplay?.apply(img));
    fitFieldScene();
    bindFieldControls();
    updateTargetGlow();
  }

  function bindFieldControls() {
    if (!state.container) return;
    updateHelpButton();
    state.container.querySelectorAll('[data-field-home]').forEach(button => { button.onclick = returnToDispatchHome; });
    state.container.querySelector('[data-field-listen]')?.addEventListener('click', () => {
      const f = state.field, role = fieldRole();
      if (!f || state.playMode !== 'field') return;
      if (f.phase === 'menu') fieldSpeak('어디부터 도와줄까요? 현장을 골라요.', 'Where shall we help first? Choose a scene.');
      else if (f.phase === 'loading') fieldSpeak('출동할 차를 준비하고 있어요.', 'We are getting the fire trucks ready.');
      else if (f.phase === 'result') fieldSpeak(f.message, f.messageEn);
      else if (f.message && f.phase === 'choose' && role) fieldSpeak(`${f.message} ${role.need}`, `${f.messageEn} ${role.needEn}`);
      else if (f.message) fieldSpeak(f.message, f.messageEn);
      else if (role) fieldSpeak(f.phase === 'choose' ? role.need : role.reason, f.phase === 'choose' ? role.needEn : role.reasonEn);
    });
    state.container.querySelectorAll('[data-field-incident]').forEach(button => { button.onclick = () => startFieldIncident(button.dataset.fieldIncident); });
    state.container.querySelectorAll('[data-field-game-id]').forEach(button => { button.onclick = () => chooseFieldTruck(button.dataset.fieldGameId, button); });
    state.container.querySelector('[data-field-work]')?.addEventListener('click', doFieldWork);
    state.container.querySelector('[data-field-next]')?.addEventListener('click', nextFieldStep);
    state.container.querySelector('[data-field-retry]')?.addEventListener('click', () => startFieldPlay(true));
    state.container.querySelector('[data-field-again]')?.addEventListener('click', () => {
      if (state.field?.phase !== 'menu') return;
      state.field.completed = [];
      renderField();
      fieldSpeak('다시 도와주러 출동해요. 현장을 골라요.', 'Let us help again. Choose a scene.');
    });
  }

  function returnToDispatchHome() {
    if (state.destroyed) return;
    state.roundToken++;
    clearManagedTimers();
    stopFieldVoice();
    state.playMode = 'sequence';
    state.gameStarted = false;
    state.isBusy = false;
    state.isEnding = false;
    showModeSelection();
  }

  async function startFieldPlay(retry = false) {
    if (state.destroyed || !state.container) return;
    clearManagedTimers();
    stopFieldVoice();
    const token = ++state.roundToken;
    state.playMode = 'field';
    state.gameStarted = true;
    state.isBusy = true;
    state.isEnding = false;
    state.field = { completed: state.field?.completed || [], phase: 'loading', incidentId: null,
      stepIndex: 0, actionCount: 0, selected: null, choices: [], world: null, message: '', messageEn: '', reconsidered: null };
    renderField();
    await loadAllTrucks(retry);
    if (state.destroyed || token !== state.roundToken || state.playMode !== 'field') return;
    state.isBusy = false;
    state.field.phase = 'menu';
    renderField();
    fieldSpeak(availableFieldIncidents().length ? '어디부터 도와줄까요? 현장을 골라요.' : '출동할 차를 다시 불러와요.',
      availableFieldIncidents().length ? 'Where shall we help first? Choose a scene.' : 'Let us load the fire trucks again.');
  }

  function startFieldIncident(id) {
    if (state.destroyed || state.isBusy || state.playMode !== 'field' || state.field?.phase !== 'menu') return;
    const incident = availableFieldIncidents().find(item => item.id === id);
    if (!incident) return;
    state.roundToken++;
    clearManagedTimers();
    stopFieldVoice();
    Object.assign(state.field, { incidentId: id, phase: 'choose', stepIndex: 0, actionCount: 0,
      world: freshFieldWorld(id), selected: null, message: '', messageEn: '', reconsidered: null });
    state.field.choices = makeFieldChoices(fieldRole());
    renderField();
    fieldSpeak(fieldRole().need, fieldRole().needEn);
  }

  function chooseFieldTruck(gameId, button) {
    const f = state.field, role = fieldRole();
    if (state.destroyed || state.isBusy || state.playMode !== 'field' || f?.phase !== 'choose' || !role || !button?.isConnected) return;
    const truck = f.choices.find(item => item.gameId === gameId);
    if (!truck) return;
    if (!role.ids.includes(truck.id)) {
      const [ko, en] = fieldWrongRole(truck);
      f.message = ko;
      f.messageEn = en;
      f.reconsidered = truck.gameId;
      renderField();
      fieldSpeak(`${ko} ${role.need}`, `${en} ${role.needEn}`);
      return;
    }
    state.isBusy = true;
    f.selected = truck;
    f.phase = 'arrival';
    f.message = role.reason;
    f.messageEn = role.reasonEn;
    f.reconsidered = null;
    const token = state.roundToken;
    renderField();
    fieldSpeak(role.reason, role.reasonEn);
    setManagedTimeout(() => {
      if (state.playMode !== 'field' || state.roundToken !== token || state.field !== f || f.phase !== 'arrival') return;
      f.phase = 'work';
      state.isBusy = false;
      renderField();
    }, 600);
  }

  function doFieldWork(event) {
    const f = state.field, role = fieldRole();
    if (state.destroyed || state.isBusy || state.playMode !== 'field' || f?.phase !== 'work' || !role) return;
    if (event?.currentTarget && !event.currentTarget.isConnected) return;
    f.actionCount = Math.min(role.total, f.actionCount + 1);
    if (role === FIELD_ROLES.supply) f.world.water = f.actionCount;
    if (role === FIELD_ROLES.pump) {
      f.world.fire = Math.max(0, 3 - f.actionCount);
      f.world.water = Math.max(0, 2 * (1 - f.actionCount / 3));
    }
    if (role === FIELD_ROLES.ladder) {
      f.world.ladder = Math.min(2, f.actionCount);
      f.world.rescued = f.actionCount >= 3;
    }
    if (role === FIELD_ROLES.smoke) f.world.smoke = Math.max(0, 3 - f.actionCount);
    if (f.actionCount >= role.total) {
      f.phase = 'result';
      const last = f.stepIndex === fieldIncident().steps.length - 1;
      f.world.safe = last;
      if (!last) {
        f.message = '물이 준비됐어요! 이제 펌프차가 이 물을 쓸 수 있어요.';
        f.messageEn = 'The water is ready! Now the pump engine can use this water.';
      } else {
        [f.message, f.messageEn] = role === FIELD_ROLES.pump
          ? ['불이 꺼졌어요! 두 차가 함께 마을을 도왔어요.', 'The fire is out! Two trucks helped our village together.']
          : role === FIELD_ROLES.ladder
            ? ['친구가 안전한 곳에 도착했어요! 고마워요, 시현!', 'Our friend has reached a safe place! Thank you!']
            : ['연기가 걷혔어요! 이제 모두 편안해졌어요.', 'The smoke has cleared! Everyone feels better now.'];
        if (!f.completed.includes(f.incidentId)) {
          f.completed.push(f.incidentId);
          state.options.gainExp?.(20);
          state.options.fireConfetti?.();
        }
      }
      fieldSpeak(f.message, f.messageEn);
    } else {
      [f.message, f.messageEn] = role === FIELD_ROLES.supply
        ? ['물통이 차오르고 있어요. 한 번 더 채워요.', 'The tank is filling up. Add some more water.']
        : role === FIELD_ROLES.pump
          ? ['불이 줄어들었어요. 남은 불에도 물을 보내요.', 'The fire is getting smaller. Send water to the remaining flames.']
          : role === FIELD_ROLES.ladder
            ? f.actionCount === 2
              ? ['사다리가 창문에 닿았어요! 이제 친구가 내려와요.', 'The ladder has reached the window! Now our friend can come down.']
              : ['사다리가 올라가고 있어요. 조금 더 올려요.', 'The ladder is rising. Raise it a little more.']
            : ['연기가 옅어졌어요. 바람을 조금 더 보내요.', 'The smoke is thinner. Send a little more air.'];
      fieldSpeak(f.message, f.messageEn);
    }
    renderField();
  }

  function nextFieldStep() {
    const f = state.field, incident = fieldIncident();
    if (state.destroyed || state.isBusy || state.playMode !== 'field' || f?.phase !== 'result' || !incident) return;
    state.roundToken++;
    clearManagedTimers();
    stopFieldVoice();
    if (f.stepIndex + 1 < incident.steps.length) {
      f.stepIndex++;
      f.phase = 'choose';
      f.actionCount = 0;
      f.selected = null;
      f.message = '';
      f.messageEn = '';
      f.choices = makeFieldChoices(fieldRole());
      renderField();
      fieldSpeak(fieldRole().need, fieldRole().needEn);
    } else {
      f.phase = 'menu';
      f.incidentId = null;
      renderField();
      fieldSpeak('다음에는 어디를 도와줄까요?', 'Where shall we help next?');
    }
  }

  async function loadAllTrucks(force = false) {
    if (state.allTrucks.length > 0 && !force) return;
    const token = ++state.catalogToken;
    const results = await Promise.allSettled([MANIFESTS.normal, MANIFESTS.special].map(async url => {
      const response = await fetch(url);
      if (response.ok === false) throw new Error('vehicle catalog unavailable');
      const list = await response.json();
      if (!Array.isArray(list)) throw new Error('invalid vehicle catalog');
      return list.filter(truck => truck && typeof truck.id === 'string' && typeof truck.file === 'string' && truck.file);
    }));
    if (token !== state.catalogToken) return;
    state.catalogFailed = results.some(result => result.status !== 'fulfilled' || !result.value.length);
    const prefixes = ['n_', 's_'];
    state.allTrucks = results.flatMap((result, index) => result.status === 'fulfilled'
      ? result.value.map(truck => ({ ...truck, gameId: prefixes[index] + truck.id })) : []);
    if (!state.allTrucks.length) {
      state.catalogFailed = true;
      state.allTrucks = [{ gameId: 'n_pump', id: 'pump_engine', file: 'assets/vehicles/fire/pump_engine.png', name_ko: '펌프차' }];
    }
  }

  function showModeSelection() {
    if (!state.container) return;
    state.isEnding = false;
    state.container.innerHTML = `
      <div class="${getRootClass()}">
        <div class="md14-city-bg"></div>
        <div class="md14-start-screen md-field-entry">
          <div class="md-field-entry-inner">
            <div class="md-field-entry-head"><h1 class="md14-title">본부장 시현! 출동 준비!</h1><button class="md14-help-toggle" type="button" data-action="help"></button></div>
            <p>어떤 놀이로 출동할까요?</p>
            <button class="mode-btn md-field-primary" type="button" data-field-start>🚒 현장 출동<small>물을 준비하고 · 사다리를 올리고 · 연기를 걷어요</small></button>
            <section class="md-field-practice"><h2>그림 순서 놀이</h2><div class="md14-mode-row">
              <button class="mode-btn" type="button" data-mode-size="4">쉬움 🚒<small>4대</small></button>
              <button class="mode-btn" type="button" data-mode-size="9">보통 🚒<small>9대</small></button>
              <button class="mode-btn" type="button" data-mode-size="16">도전 🚒<small>16대</small></button>
            </div></section>
          </div>
        </div>
      </div>
    `;

    updateHelpButton();
    state.container.querySelector('[data-field-start]')?.addEventListener('click', () => startFieldPlay());

    state.container.querySelectorAll('[data-mode-size]').forEach((button) => {
      button.addEventListener('click', () => {
        window.setV14Mode(Number(button.dataset.modeSize));
      });
    });
  }

  window.setV14Mode = (size) => {
    if (![4, 9, 16].includes(size) || state.destroyed) return;
    clearManagedTimers();
    stopFieldVoice();
    state.roundToken++;
    state.playMode = 'sequence';
    state.gridSize = size;
    state.currentLevel = 1;
    state.gameStarted = true;
    state.isEnding = false;
    state.completeRewardGiven = false;
    startRound();
  };

  async function startRound() {
    if (state.destroyed || !state.gameStarted) return;
    const roundToken = ++state.roundToken;
    state.isBusy = true;
    await loadAllTrucks();
    if (state.destroyed || !state.gameStarted || roundToken !== state.roundToken || !state.container) return;
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
    if (state.playMode === 'field') { renderField(); return; }

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
          <div class="md14-top-controls">
            <div class="md14-level-badge">🚒 ${state.currentLevel}단계 · ${missionProgressText}</div>
            <button class="md14-help-toggle" type="button" data-action="help"></button>
          </div>
          <h1 class="md14-title">초강력 소방대 출동!</h1>
          <p class="md14-subtitle">왼쪽 미션 순서대로 소방차를 눌러요</p>
          <div class="md14-header">
            ${state.mission.map((m, i) => `
              <div class="md-mission-card ${i === state.userIndex ? 'preview-large active' : (i < state.userIndex ? 'done' : '')}">
                <div class="md14-role-badge">${ROLE_ICONS[m.id] || '🚒'}</div>
                <img src="${m.file}" alt="${m.name_ko || m.name || '소방차'}" onerror="this.outerHTML='<span style=&quot;font-size:42px;&quot;>🚒</span>';">
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
              <button class="md14-truck-btn" type="button" data-game-id="${t.gameId}" aria-label="${t.name_ko || t.name || '소방차'} 출동">
                <img src="${t.file}" alt="${t.name_ko || t.name || '소방차'}" onerror="this.outerHTML='<span style=&quot;font-size:42px;&quot;>🚒</span>';">
              </button>
            `).join('')}
          </div>
        </section>
      </div>
    `;

    state.container.querySelectorAll('.md-mission-card img, .md14-scene-target img, .md14-truck-btn img').forEach(img => window.SihyeonVehicleDisplay?.apply(img));
    state.container.querySelectorAll('.md14-truck-btn').forEach(btn => {
      btn.onclick = (e) => handleTouch(btn.dataset.gameId, btn, e);
    });
    updateHelpButton();
  }

  function updateTargetGlow() {
    if (!state.container) return;
    if (state.playMode === 'field') {
      const role = fieldRole();
      state.container.querySelectorAll('.md-field-choice').forEach(button => {
        const truck = state.field?.choices.find(item => item.gameId === button.dataset.fieldGameId);
        button.classList.toggle('target-glow', Boolean(state.helpEnabled && role && truck && role.ids.includes(truck.id)));
      });
      return;
    }
    const targetId = state.mission[state.userIndex]?.gameId;
    state.container.querySelectorAll('.md14-truck-btn').forEach(btn => {
      btn.classList.remove('target-glow');
      if (state.helpEnabled && btn.dataset.gameId === targetId) btn.classList.add('target-glow');
    });
  }

  function shootWater(x, y, isSuper) {
    const root = state.container?.querySelector('.md14-root');
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const count = isSuper ? 30 : 15;
    for (let i = 0; i < count; i++) {
      const drop = document.createElement('div');
      drop.className = 'water-drop';
      drop.style.left = (x - rect.left) + 'px';
      drop.style.top = (y - rect.top) + 'px';
      drop.style.setProperty('--tx', (Math.random() * (isSuper ? 400 : 200) - (isSuper ? 200 : 100)) + 'px');
      drop.style.setProperty('--ty', (Math.random() * -300 - 50) + 'px');
      root.appendChild(drop);
      setManagedTimeout(() => drop.remove(), 700);
    }
  }

  function handleTouch(gameId, el, e) {
    if (state.isBusy || state.destroyed || !state.container || !el.isConnected) return;
    const target = state.mission[state.userIndex];
    if (!target) return;
    const root = state.container.querySelector('.md14-root');

    if (gameId === target.gameId) {
      const rect = el.getBoundingClientRect();
      const hasPointer = e?.detail !== 0 && Number.isFinite(e?.clientX) && Number.isFinite(e?.clientY);
      const waterX = hasPointer ? e.clientX : rect.left + rect.width / 2;
      const waterY = hasPointer ? e.clientY : rect.top + rect.height / 2;
      state.userIndex++;
      state.combo++;
      const isSuper = state.combo >= 2;

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
      // Re-render first, then attach the effect to the current scene so it survives this click.
      shootWater(waterX, waterY, isSuper);
      const feedbackEl = state.container.querySelector(`[data-game-id="${gameId}"]`);
      if (feedbackEl) feedbackEl.style.setProperty('transform', 'scale(1.3)', 'important');
      setManagedTimeout(() => {
        if (feedbackEl?.isConnected) feedbackEl.style.removeProperty('transform');
      }, 300);
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
          <button class="mode-btn" style="font-size:28px;" type="button" data-action="replay">다시 출동! 🔄</button>
          <button class="mode-btn" style="font-size:22px;" type="button" data-action="home">놀이터로 🏠</button>
        </div>
      </div>
    `;

    state.container.querySelector('[data-action="replay"]')?.addEventListener('click', () => {
      if (!state.isEnding) return;
      window.setV14Mode(state.gridSize);
    });
    state.container.querySelector('[data-action="home"]')?.addEventListener('click', () => {
      state.options.closeToParkHome?.();
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
      state.playMode = 'sequence';
      state.field = null;
      state.gameStarted = false;
      state.isBusy = false;
      state.isEnding = false;
      state.successRewardGiven = false;
      state.completeRewardGiven = false;
      state.helpEnabled = readHelpPreference(state.helpEnabled);
      state.layoutMode = getLayoutMode();
      injectStyle();
      bindLayoutEvents();
      showModeSelection();
    },
    destroy: () => {
      if (state.playMode === 'field') stopFieldVoice();
      state.destroyed = true;
      state.roundToken += 1;
      state.catalogToken += 1;
      state.playMode = 'sequence';
      state.field = null;
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
