/**
 * 시현이 놀이터 OS — 초강력 소방대 V14 (Full Feature Edition)
 * [업데이트] 18종 풀로드, 3가지 모드(4/9/16), 물대포 VFX 복구, 타겟 글로우, 엔딩, 이미지 폴백 완비
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
    destroyed: false
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

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .md14-root { width: 100%; height: 100%; display: flex; flex-direction: column; background: #050505; position: relative; overflow: hidden; font-family: 'Jua', sans-serif; }
      
      /* [배경] 도시 & 불꽃 */
      .md14-city-bg { position: absolute; inset: 0; background: radial-gradient(circle at 50% 100%, rgba(255,82,0,0.35), transparent 42%), linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.82)), linear-gradient(180deg, #263238 0%, #0b0b0d 58%, #250606 100%); opacity: 0.92; z-index: 1; pointer-events: none; }
      .md14-fire-overlay { position: absolute; bottom: 0; left: 0; width: 100%; height: 45%; background: linear-gradient(transparent, rgba(255, 80, 0, 0.3)); z-index: 2; pointer-events: none; animation: md14Fire 3s infinite alternate; }
      @keyframes md14Fire { from { opacity: 0.2; } to { opacity: 0.5; } }

      /* [그리드] 가구 바닥 장식 */
      .md14-garage { flex: 1; display: grid; gap: 12px; padding: 15px; z-index: 10; align-content: center; position: relative; }
      .md14-garage::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.05) 40px, rgba(255,255,255,0.05) 42px); z-index: -1; }
      .grid-4 { grid-template-columns: repeat(2, 1fr); padding: 30px; gap: 25px; }
      .grid-9 { grid-template-columns: repeat(3, 1fr); }
      .grid-16 { grid-template-columns: repeat(4, 1fr); gap: 10px; }

      /* [헤더] 중앙 집중 프리뷰 */
      .md14-header { position: relative; z-index: 10; height: clamp(140px, 20vh, 180px); background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; gap: 15px; border-bottom: 6px solid #ff1744; }
      .md-mission-card { width: 70px; height: 70px; background: #fff; border-radius: 18px; display: flex; align-items: center; justify-content: center; border: 4px solid #fff; position: relative; transition: all 0.3s; }
      .md-mission-card.preview-large { width: clamp(110px, 25vw, 150px); height: clamp(110px, 25vw, 150px); border-color: #ffeb3b; box-shadow: 0 0 25px #ffeb3b; }
      .md-mission-card img { width: 85%; height: 85%; object-fit: contain; }
      .md-mission-card.done { opacity: 0.2; filter: grayscale(100%); }

      /* [버튼] 48dp+ 확보 & 타겟 글로우 */
      .md14-truck-btn { aspect-ratio: 1/1; background: #fff; border-radius: 20px; border: none; box-shadow: 0 8px 0 #888; display: flex; align-items: center; justify-content: center; padding: 10px; min-height: 80px; position: relative; transition: transform 0.1s; }
      .md14-truck-btn img { width: 90%; height: 90%; object-fit: contain; }
      .md14-truck-btn.target-glow { box-shadow: 0 0 20px #ffeb3b, inset 0 0 10px #fff; animation: mdGlow 1.5s infinite; }
      @keyframes mdGlow { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.02); } }
      
      .md-shake { animation: mdShakeAnim 0.45s linear; }
      @keyframes mdShakeAnim { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); } 20%, 40%, 60%, 80% { transform: translateX(10px); } }
      .water-drop { position: absolute; width: 14px; height: 14px; background: #4fc3f7; border-radius: 50%; pointer-events: none; z-index: 1000; animation: waterFly 0.7s ease-out forwards; }
      @keyframes waterFly { to { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; } }

      .md14-start-screen { position: absolute; inset: 0; z-index: 1000; background: rgba(0,0,0,0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; text-align: center; }
      .mode-btn { padding: 15px 30px; font-size: 22px; border-radius: 20px; border: none; background: #ff1744; color: white; box-shadow: 0 6px 0 #b71c1c; margin: 10px; font-weight: 900; }
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
    state.container.innerHTML = `
      <div class="md14-root">
        <div class="md14-city-bg"></div>
        <div class="md14-start-screen">
          <h1 style="font-size: 36px; color: #ffeb3b;">본부장 시현! 출동 준비!</h1>
          <div>
            <button class="mode-btn" onclick="window.setV14Mode(4)">쉬움 🚒 (4대)</button>
            <button class="mode-btn" onclick="window.setV14Mode(9)">보통 🚒🚒 (9대)</button>
            <button class="mode-btn" onclick="window.setV14Mode(16)">도전 🚒🚒🚒 (16대)</button>
          </div>
        </div>
      </div>
    `;
  }

  window.setV14Mode = (size) => {
    state.gridSize = size;
    state.gameStarted = true;
    startRound();
  };

  async function startRound() {
    if (state.destroyed || !state.gameStarted) return;
    await loadAllTrucks();
    state.isBusy = false;
    state.userIndex = 0;
    state.combo = 0;

    // 18종 중 그리드 크기만큼 랜덤 배치
    state.displayTrucks = [...state.allTrucks].sort(() => 0.5 - Math.random()).slice(0, state.gridSize);
    
    // 미션 생성 (그리드에 따라 개수 조정)
    const mCount = state.gridSize === 4 ? 2 : (state.gridSize === 9 ? 3 : 4);
    state.mission = [...state.displayTrucks].sort(() => 0.5 - Math.random()).slice(0, Math.min(mCount + Math.floor(state.currentLevel/3), state.gridSize));
    
    render();
    updateTargetGlow();
  }

  function render() {
    if (!state.gameStarted) return;
    state.container.innerHTML = `
      <div class="md14-root">
        <div class="md14-city-bg"></div>
        <div class="md14-fire-overlay"></div>
        <div class="md14-level-badge" style="position:absolute; top:15px; left:20px; color:#fff; font-size:20px; font-weight:900; z-index:100;">🚒 ${state.currentLevel} 🚒</div>
        <div class="md14-header">
          ${state.mission.map((m, i) => `
            <div class="md-mission-card ${i === state.userIndex ? 'preview-large active' : (i < state.userIndex ? 'done' : '')}">
              <div style="font-size:14px; position:absolute; top:-8px; right:-8px; background:#fff; border-radius:50%; width:24px; height:24px; display:grid; place-items:center; color:#000; box-shadow:0 2px 4px #000;">${ROLE_ICONS[m.id] || '🚒'}</div>
              <img src="${m.file}" onerror="this.outerHTML='<span style=&quot;font-size:42px;&quot;>🚒</span>';">
            </div>
          `).join('')}
        </div>
        <div class="md14-garage grid-${state.gridSize}">
          ${state.displayTrucks.map(t => `
            <button class="md14-truck-btn" data-game-id="${t.gameId}">
              <img src="${t.file}" onerror="this.outerHTML='<span style=&quot;font-size:42px;&quot;>🚒</span>';">
            </button>
          `).join('')}
        </div>
      </div>
    `;
    state.container.querySelectorAll('.md14-truck-btn').forEach(btn => {
      btn.onclick = (e) => handleTouch(btn.dataset.gameId, btn, e);
    });
  }

  function updateTargetGlow() {
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
      drop.style.left = x + 'px'; drop.style.top = y + 'px';
      drop.style.setProperty('--tx', (Math.random() * (isSuper ? 400 : 200) - (isSuper ? 200 : 100)) + 'px');
      drop.style.setProperty('--ty', (Math.random() * -300 - 50) + 'px');
      state.container.appendChild(drop);
      setTimeout(() => drop.remove(), 700);
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
      setTimeout(() => el.style.transform = '', 300);

      if (state.options.speakGuide) {
        const msg = isSuper ? "초강력!! " : "";
        state.options.speakGuide(`${msg}${target.name_ko} 출동!`, true);
      }
      
      if (state.userIndex >= state.mission.length) {
        state.isBusy = true;
        setTimeout(finishRound, 700);
      } else {
        render();
        updateTargetGlow();
      }
    } else {
      state.combo = 0;
      if (root) { root.classList.add('md-shake'); setTimeout(() => root.classList.remove('md-shake'), 450); }
      if (state.options.speakGuide) state.options.speakGuide("다시 골라보자!", true);
    }
  }

  function finishRound() {
    if (state.options.fireConfetti) state.options.fireConfetti();
    
    // [보충] 성공 시 골드 장식
    state.container.querySelectorAll('.md14-truck-btn').forEach(btn => {
      btn.style.background = 'linear-gradient(45deg, gold, #ff1744)';
    });

    if (state.currentLevel >= 8) {
      showEnding();
      return;
    }

    state.currentLevel++;
    setTimeout(startRound, 2500);
  }

  function showEnding() {
    state.container.innerHTML = `
      <div class="md14-root">
        <div class="md14-city-bg"></div>
        <div class="md14-start-screen">
          <h1 style="font-size: 48px; color: gold; text-shadow: 0 0 20px red;">👑 전설의 본부장 시현 👑</h1>
          <p style="font-size: 24px; margin: 20px 0;">시현이가 마을을 지켜냈어요!</p>
          <button class="mode-btn" style="font-size:32px;" onclick="location.reload()">출동! 🔄</button>
        </div>
      </div>
    `;
    if (state.options.speakGuide) state.options.speakGuide("시현 본부장님 만세! 모든 미션을 완료했습니다!", true);
  }

  window.SihyeonGames[GAME_KEY] = { 
    render: (c, o) => {
      state.container = c;
      state.options = o || {};
      state.destroyed = false;
      state.gameStarted = false;
      state.isBusy = false;
      injectStyle();
      showModeSelection();
    },
    destroy: () => {
      state.destroyed = true;
      state.gameStarted = false;
      const style = document.getElementById(STYLE_ID);
      if (style) style.remove();
    }
  };
})();
