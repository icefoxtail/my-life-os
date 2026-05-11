/**
 * 시현이 놀이터 OS — 시현이 로봇 친구 코딩 대모험 V11 (Masterpiece Final)
 * 규격: OS 표준 인터페이스 준수 (gainExp 추가, 객체 안정성 강화)
 */
(function () {
  const GAME_KEY = 'robotCoding';
  const STYLE_ID = 'sihyeon-robot-style';

  // 윈도우 객체 안전하게 확보 (OS 서식 핵심)
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
    destroyed: false
  };

  const CMDS = [
    { id: 'up', sym: '↑', col: '#ff2d55', dr: -1, dc: 0, voice: "위로 출동! 삑!" },
    { id: 'down', sym: '↓', col: '#00d4ff', dr: 1, dc: 0, voice: "아래로 슈웅! 뽀옥!" },
    { id: 'left', sym: '←', col: '#ffd600', dr: 0, dc: -1, voice: "왼쪽으로 가자! 치익!" },
    { id: 'right', sym: '→', col: '#39ff14', dr: 0, dc: 1, voice: "오른쪽으로 변신! 콰쾅!" },
    { id: 'loop', sym: '🔁', col: '#ff00ff', dr: 0, dc: 0, voice: "빙글빙글 반복!" }
  ];

  function injectStyle() {
    // 중복 설치 방지 및 갱신
    const oldStyle = document.getElementById(STYLE_ID);
    if (oldStyle) oldStyle.remove();

    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .rb11-root { width: 100%; height: 100%; display: flex; flex-direction: column; background: #020208; font-family: 'Jua', sans-serif; color: white; overflow: hidden; position: relative; }
      .rb11-stage { 
        flex: 1.2; position: relative; margin: 15px; border: 10px solid var(--r-col, #00ffff); border-radius: 30px; 
        background: rgba(0, 10, 30, 0.85); display: grid; grid-template-columns: repeat(5, 1fr); grid-template-rows: repeat(5, 1fr);
        box-shadow: 0 0 40px var(--r-col, #00ffff), inset 0 0 80px rgba(0, 255, 255, 0.2);
      }
      .rb11-cell { border: 1px solid rgba(255, 255, 255, 0.03); display: grid; place-items: center; position: relative; }
      .rb11-trail { position: absolute; width: 15%; height: 15%; background: var(--r-col); border-radius: 50%; opacity: 0.7; filter: blur(10px); transform: translate(-50%, -50%); z-index: 30; animation: rb11TrailFade 0.9s forwards; }
      @keyframes rb11TrailFade { from { opacity: 0.7; transform: scale(1.1); } to { opacity: 0; transform: scale(0.2); } }
      .rb11-robot { position: absolute; width: 20%; height: 20%; font-size: clamp(65px, 13vw, 100px); display: grid; place-items: center; z-index: 50; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); filter: drop-shadow(0 0 25px var(--r-col, #00ffff)); }
      .rb11-goal { position: absolute; width: 20%; height: 20%; font-size: clamp(55px, 10vw, 85px); display: grid; place-items: center; z-index: 45; animation: rb11Star 1.5s infinite; filter: drop-shadow(0 0 25px gold); transition: all 0.4s; }
      @keyframes rb11Star { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3) rotate(15deg); } }
      .rb11-ui { background: rgba(5, 0, 20, 0.98); border-top: 8px solid #ff00ff; padding: clamp(12px, 2.5vh, 22px); z-index: 60; }
      .rb11-sequence { height: 75px; background: rgba(255, 255, 255, 0.05); border-radius: 12px; margin-bottom: 12px; display: flex; align-items: center; padding: 0 12px; gap: 8px; border: 3px dashed #ff00ff; overflow-x: auto; }
      .rb11-seq-item { min-width: 50px; height: 50px; border-radius: 10px; font-size: 32px; display: grid; place-items: center; box-shadow: 0 0 12px currentColor; animation: rb11Pop 0.3s forwards; }
      .rb11-btn-group { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
      .rb11-cmd-btn { aspect-ratio: 1/1; border-radius: 18px; border: 4px solid #ff00ff; font-size: 42px; background: #1a0033; color: white; box-shadow: 0 8px 0 #ff00ff88; transition: all 0.08s; }
      .rb11-cmd-btn:active { transform: scale(0.85) translateY(6px); }
      .rb11-cmd-btn[data-id="loop"] { background: linear-gradient(45deg, #ff00ff, #aa00ff); animation: rb11LoopPulse 2s infinite; }
      @keyframes rb11LoopPulse { 0%,100% { border-color: #ff00ff; } 50% { border-color: #ffff00; } }
      .rb11-exec-btn { width: 100%; padding: 16px; border-radius: 40px; border: none; background: linear-gradient(45deg, #00ff88, #00cc66); font-size: 26px; font-weight: 900; color: #001a33; box-shadow: 0 10px 0 #008833; margin: 12px 0; }
      .rb11-p { position: absolute; width: 12px; height: 12px; border-radius: 50%; pointer-events: none; z-index: 1000; animation: rb11Fly 0.8s ease-out forwards; }
      @keyframes rb11Fly { to { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; } }
      .md-shake { animation: rb11Shake 0.45s; }
      @keyframes rb11Shake { 0%,100% { transform:translateX(0); } 20%,60% { transform:translateX(-10px); } 40%,80% { transform:translateX(10px); } }
      @keyframes rb11Pop { from { transform: scale(0); } to { transform: scale(1); } }
      .rb11-flash { animation: rb11FlashAnim 0.5s; }
      @keyframes rb11FlashAnim { 0% { background: white; } 100% { background: transparent; } }
      .rb11-setup { position: absolute; inset: 0; z-index: 200; background: #000; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      .color-opt { width: 85px; height: 85px; border-radius: 50%; border: 5px solid #fff; cursor: pointer; transition: 0.2s; }
    `;
    document.head.appendChild(s);
  }

  function createVFX(x, y, color, count = 35) {
    if (state.destroyed || !state.container) return;
    const rect = state.container.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'rb11-p';
      p.style.left = (x - rect.left) + 'px';
      p.style.top = (y - rect.top) + 'px';
      p.style.background = color;
      p.style.setProperty('--tx', (Math.random() * 300 - 150) + 'px');
      p.style.setProperty('--ty', (Math.random() * 300 - 150) + 'px');
      state.container.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }
  }

  function createTrail(x, y) {
    if (state.destroyed || !state.container) return;
    const rect = state.container.getBoundingClientRect();
    const t = document.createElement('div');
    t.className = 'rb11-trail';
    t.style.left = (x - rect.left) + 'px';
    t.style.top = (y - rect.top) + 'px';
    state.container.appendChild(t);
    setTimeout(() => t.remove(), 900);
  }

  async function startLevel() {
    if (state.destroyed) return;
    state.isExecuting = false;
    state.commands = [];
    state.robotPos = { r: 4, c: 0 };
    state.obstacles = [];
    state.goals = [];

    const goalCount = Math.min(Math.floor(state.currentLevel / 3) + 1, 3);
    while (state.goals.length < goalCount) {
      const pos = { r: Math.floor(Math.random() * 4), c: Math.floor(Math.random() * 5) };
      if (!(pos.r === 4 && pos.c === 0) && !state.goals.some(g => g.r === pos.r && g.c === pos.c)) {
        state.goals.push(pos);
      }
    }

    const obsCount = Math.min(Math.floor(state.currentLevel / 2) + 1, 4);
    while (state.obstacles.length < obsCount) {
      const pos = { r: Math.floor(Math.random() * 5), c: Math.floor(Math.random() * 5) };
      if (!(pos.r === 4 && pos.c === 0) && !state.goals.some(g => g.r === pos.r && g.c === pos.c) && !state.obstacles.some(o => o.r === pos.r && o.c === pos.c)) {
        state.obstacles.push(pos);
      }
    }

    render();
    if (state.options.speakGuide && state.isInitialized) {
        state.options.speakGuide(`레벨 ${state.currentLevel}! 별을 모두 모으자!`, true);
    }
  }

  function render() {
    if (state.destroyed || !state.container) return;
    if (!state.isInitialized) { showColorPicker(); return; }

    let cellsHTML = '';
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const isObs = state.obstacles.some(o => o.r === r && o.c === c);
        cellsHTML += `<div class="rb11-cell">${isObs ? '🪨' : ''}</div>`;
      }
    }

    state.container.innerHTML = `
      <div class="rb11-root" style="--r-col: ${state.robotColor}">
        <div style="padding:10px; text-align:center; background:rgba(0,0,0,0.5); border-bottom:4px solid ${state.robotColor};">
          <span style="font-size:24px; color:${state.robotColor};">🚀 MASTER LEVEL ${state.currentLevel}</span>
        </div>
        <div class="rb11-stage" id="stage">
          ${cellsHTML}
          ${state.goals.map(g => `<div class="rb11-goal" data-r="${g.r}" data-c="${g.c}" style="top:${g.r * 20}%; left:${g.c * 20}%;">⭐</div>`).join('')}
          <div class="rb11-robot" id="robot" style="top:${state.robotPos.r * 20}%; left:${state.robotPos.c * 20}%;">🤖</div>
        </div>
        <div class="rb11-ui">
          <div class="rb11-sequence">${state.commands.map(c => `<div class="rb11-seq-item" style="background:${c.col};">${c.sym}</div>`).join('')}</div>
          <div class="rb11-btn-group">${CMDS.map(c => `<button class="rb11-cmd-btn" data-id="${c.id}">${c.sym}</button>`).join('')}</div>
          <button class="rb11-exec-btn" id="execBtn">🚀 코딩 실행!</button>
          <button id="clearBtn" style="width:100%; color:#888; background:none; border:none; padding:5px; font-size:16px;">명령 지우기 🗑️</button>
        </div>
      </div>
    `;

    state.container.querySelectorAll('.rb11-cmd-btn').forEach(btn => {
      btn.onclick = () => {
        if (state.isExecuting || state.commands.length >= 14) return;
        const cmd = CMDS.find(c => c.id === btn.dataset.id);
        if (state.options.speakGuide) state.options.speakGuide(cmd.voice, true);
        state.commands.push(cmd);
        render();
      };
    });
    state.container.querySelector('#execBtn').onclick = runCoding;
    state.container.querySelector('#clearBtn').onclick = () => { state.commands = []; render(); };
  }

  function showColorPicker() {
      state.container.innerHTML = `
        <div class="rb11-root"><div class="rb11-setup">
          <h1 style="font-size:32px; margin-bottom:40px; color:#00ffff;">로봇 색깔을 골라주세요!</h1>
          <div style="display:flex; gap:20px;">
            ${['#00ffff', '#ff00ff', '#39ff14', '#ffd600'].map(c => `<div class="color-opt" style="background:${c};" data-color="${c}"></div>`).join('')}
          </div>
        </div></div>`;
      state.container.querySelectorAll('.color-opt').forEach(opt => {
          opt.onclick = () => { state.robotColor = opt.dataset.color; state.isInitialized = true; startLevel(); };
      });
  }

  async function runCoding() {
    if (state.isExecuting || state.commands.length === 0) return;
    state.isExecuting = true;
    
    let commandQueue = [...state.commands];
    const hasLoop = commandQueue.some(c => c.id === 'loop');
    if (hasLoop) {
        const base = commandQueue.filter(c => c.id !== 'loop');
        commandQueue = [...base, ...base];
        if (state.options.speakGuide) state.options.speakGuide("빙글빙글 반복 모드!", true);
    }

    const robotEl = state.container.querySelector('#robot');
    const stageEl = state.container.querySelector('#stage');
    let curR = 4, curC = 0;

    for (let cmd of commandQueue) {
      const nextR = Math.max(0, Math.min(4, curR + cmd.dr));
      const nextC = Math.max(0, Math.min(4, curC + cmd.dc));
      
      if (state.obstacles.some(o => o.r === nextR && o.c === nextC)) {
        createVFX(robotEl.getBoundingClientRect().left + 45, robotEl.getBoundingClientRect().top + 45, '#ff0000', 40);
        if (state.options.speakGuide) state.options.speakGuide("아이쿠! 부딪혔어요!", true);
        break;
      }

      const robotRect = robotEl.getBoundingClientRect();
      createTrail(robotRect.left + robotRect.width/2, robotRect.top + robotRect.height/2);

      curR = nextR; curC = nextC;
      state.robotPos = { r: curR, c: curC };
      robotEl.style.top = (curR * 20) + '%';
      robotEl.style.left = (curC * 20) + '%';
      
      const goalIndex = state.goals.findIndex(g => g.r === curR && g.c === curC);
      if (goalIndex !== -1) {
          state.goals.splice(goalIndex, 1);
          const starEl = stageEl.querySelector(`.rb11-goal[data-r="${curR}"][data-c="${curC}"]`);
          if (starEl) {
              const starRect = starEl.getBoundingClientRect();
              createVFX(starRect.left + starRect.width/2, starRect.top + starRect.height/2, '#ffff00', 50);
              starEl.style.transform = 'scale(2.5)';
              starEl.style.opacity = '0';
              setTimeout(() => starEl.remove(), 400);
          }
          if (state.options.speakGuide) state.options.speakGuide("별 수집 완료!", true);
      }

      if (navigator.vibrate) navigator.vibrate(50);
      await new Promise(r => setTimeout(r, 620));
    }

    if (state.goals.length === 0) {
      stageEl.classList.add('rb11-flash');
      if (state.options.fireConfetti) state.options.fireConfetti();
      
      // [서식 보완] 경험치 획득 시스템 연동
      if (state.options.gainExp) state.options.gainExp(50 + state.currentLevel * 10);

      if (state.options.speakGuide) state.options.speakGuide("우와아아아!!! 별을 다 모았어요! 시현이 최고!!!", true);
      
      setTimeout(() => {
        stageEl.classList.remove('rb11-flash');
        state.currentLevel++;
        state.isExecuting = false;
        state.robotPos = { r: 4, c: 0 };
        if (state.currentLevel > 10) showEnding(); else startLevel();
      }, 1600);
    } else {
      const root = state.container.querySelector('.rb11-root');
      if (root) root.classList.add('md-shake');
      setTimeout(() => {
        if (root) root.classList.remove('md-shake');
        state.isExecuting = false;
        state.robotPos = { r: 4, c: 0 };
        render();
      }, 1100);
    }
  }

  function showEnding() {
    // [서식 보완] 엔딩 경험치 대폭 증정
    if (state.options.gainExp) state.options.gainExp(500);

    state.container.innerHTML = `
      <div class="rb11-root" style="justify-content:center; align-items:center; text-align:center; background: radial-gradient(circle, #2a0055, #000);">
        <h1 style="font-size: clamp(48px, 12vw, 78px); color:#ffff00; text-shadow:0 0 50px #00ffff, 0 0 80px #ff00ff;">🏆 코딩 천재 시현 🏆</h1>
        <p style="font-size:28px; margin:25px 0;">로봇 친구와 함께 모든 우주의 별을 모았어요!</p>
        <div style="font-size:140px; margin:30px 0; filter: drop-shadow(0 0 20px #00ffff);">🤖🚀⭐✨🌟</div>
        <button id="reBtn" style="padding:22px 65px; font-size:32px; border-radius:50px; background:linear-gradient(45deg, #ff00ff, #00ffff); color:#000; font-weight:900; box-shadow:0 12px 0 #00000066;">다시 모험 떠나기! 🔄</button>
      </div>
    `;
    document.getElementById('reBtn').onclick = () => { state.currentLevel = 1; state.isInitialized = false; startLevel(); };
  }

  // SihyeonGames 객체 등록 (OS 표준 서식)
  window.SihyeonGames[GAME_KEY] = {
    render: (c, o) => { 
      state.container = c; 
      state.options = o; 
      state.destroyed = false; 
      injectStyle(); 
      startLevel(); 
    },
    destroy: () => { 
      state.destroyed = true; 
      state.commands = []; 
      state.isInitialized = false; 
      const style = document.getElementById(STYLE_ID); 
      if (style) style.remove(); 
    }
  };
})();