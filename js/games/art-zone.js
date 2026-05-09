/**
 * 시현이 놀이터 OS — 매직 그림판 v2.0 (게임랜드 카드용 게임 모듈)
 * 파일: js/games/art-zone.js
 */
(function () {
  const GAME_KEY = 'artZone';
  const STYLE_ID = 'sihyeon-art-v2-style';

  const state = {
    container: null, options: {}, mode: 'free', canvas: null, ctx: null,
    isDrawing: false, currentColor: '#FF4444', currentSize: 15,
    isRainbow: false, hue: 0, activeTheme: 'white', activeStamp: null,
    paintHistory: [], traceTarget: 'dog', activeCategory: 'animals', destroyed: false
  };

  const THEMES = {
    white: { label: '⚪ 빈칸', color: '#ffffff' },
    sky:   { label: '☁️ 하늘', color: '#e3f2fd' },
    ocean: { label: '🌊 바다', color: '#e0f7fa' },
    forest:{ label: '🌳 숲속', color: '#f1f8e9' }
  };

  const COLORS = [
    { c: '#FF4444', n: '빨간색' }, { c: '#4488FF', n: '파란색' }, 
    { c: '#FFD700', n: '노란색' }, { c: '#44CC44', n: '초록색' },
    { c: '#1A1A1A', n: '검정색' }, { c: '#9944FF', n: '보라색' },
    { c: '#FF88CC', n: '분홍색' }, { c: 'rainbow', n: '무지개' }
  ];

  const STAMPS = ['🚗', '🦖', '⭐', '❤️', '🍦', '🐶'];

  // 100점 완성용 12종 정교화 데이터 (MECE)
  const TRACE_GUIDES = {
    animals: [
      { id: 'dog', name: '강아지', d: 'M150,200 Q200,100 250,200 T350,200 Q350,350 250,400 Q150,350 150,200 Z', 
        sections: [{id:'head', d:'M150,200 Q200,100 250,200 L250,250 L150,250 Z'}, {id:'ear', d:'M150,200 Q120,150 100,200 L150,250 Z'}, {id:'body', d:'M250,200 Q350,200 350,350 Q250,400 150,350 L150,250 L250,250 Z'}] },
      { id: 'cat', name: '고양이', d: 'M250,150 L200,50 L220,150 L280,150 L300,50 L250,150 Z', 
        sections: [{id:'face', d:'M150,250 a100,100 0 1,0 200,0 a100,100 0 1,0 -200,0'}, {id:'earL', d:'M180,180 L150,100 L210,160 Z'}, {id:'earR', d:'M320,180 L350,100 L290,160 Z'}] },
      { id: 'rabbit', name: '토끼', d: 'M250,250 m-80,0 a80,80 0 1,0 160,0 a80,80 0 1,0 -160,0', 
        sections: [{id:'face', d:'M250,250 m-80,0 a80,80 0 1,0 160,0 a80,80 0 1,0 -160,0'}, {id:'earL', d:'M200,180 Q170,50 150,180 Z'}, {id:'earR', d:'M300,180 Q330,50 350,180 Z'}] },
      { id: 'bear', name: '곰', d: 'M250,300 m-120,0 a120,120 0 1,0 240,0 a120,120 0 1,0 -240,0', 
        sections: [{id:'face', d:'M250,300 m-120,0 a120,120 0 1,0 240,0 a120,120 0 1,0 -240,0'}, {id:'earL', d:'M150,200 a40,40 0 1,0 80,0'}, {id:'earR', d:'M270,200 a40,40 0 1,0 80,0'}] }
    ],
    foods: [
      { id: 'apple', name: '사과', d: 'M250,150 C200,150 150,200 150,280 C150,380 250,430 350,280 C350,200 300,150 250,150 Z', 
        sections: [{id:'fruit', d:'M250,150 C200,150 150,200 150,280 C150,380 250,430 350,280 C350,200 300,150 250,150 Z'}, {id:'leaf', d:'M250,150 Q300,100 350,150 Q300,170 250,150'}] },
      { id: 'strawberry', name: '딸기', d: 'M250,450 L150,250 Q250,180 350,250 Z', 
        sections: [{id:'berry', d:'M250,450 L150,250 Q250,180 350,250 Z'}, {id:'leafL', d:'M150,250 L120,200 L180,230 Z'}, {id:'leafR', d:'M350,250 L380,200 L320,230 Z'}] },
      { id: 'banana', name: '바나나', d: 'M100,200 Q250,100 400,300 Q250,250 100,200 Z', 
        sections: [{id:'body', d:'M100,200 Q250,100 400,300 Q250,250 100,200 Z'}, {id:'top', d:'M400,300 L420,330 L380,310 Z'}] },
      { id: 'carrot', name: '당근', d: 'M150,150 L250,450 L350,150 Z', 
        sections: [{id:'body', d:'M150,150 L250,450 L350,150 Z'}, {id:'leaf1', d:'M200,150 Q200,50 180,100'}, {id:'leaf2', d:'M300,150 Q300,50 320,100'}] }
    ],
    vehicles: [
      { id: 'car', name: '자동차', d: 'M100,350 L100,280 L180,280 L220,200 L350,200 L400,280 L450,280 L450,350 Z', 
        sections: [{id:'body', d:'M100,350 L100,280 L180,280 L220,200 L350,200 L400,280 L450,280 L450,350 Z'}, {id:'wheelF', d:'M150,350 a30,30 0 1,0 60,0'}, {id:'wheelR', d:'M350,350 a30,30 0 1,0 60,0'}] },
      { id: 'bus', name: '버스', d: 'M50,350 L50,150 L450,150 L450,350 Z', 
        sections: [{id:'body', d:'M50,350 L50,150 L450,150 L450,350 Z'}, {id:'window', d:'M80,180 L420,180 L420,250 L80,250 Z'}, {id:'wheel1', d:'M100,350 a35,35 0 1,0 70,0'}] },
      { id: 'truck', name: '트럭', d: 'M50,350 L50,220 L200,220 L200,350 Z M220,350 L220,120 L450,120 L450,350 Z', 
        sections: [{id:'cabin', d:'M50,350 L50,220 L200,220 L200,350 Z'}, {id:'cargo', d:'M220,350 L220,120 L450,120 L450,350 Z'}] },
      { id: 'police', name: '경찰차', d: 'M100,350 L450,350 L450,250 L100,250 Z', 
        sections: [{id:'body', d:'M100,350 L450,350 L450,250 L100,250 Z'}, {id:'light', d:'M230,250 L230,210 L270,210 L270,250', fill:'#ff3b30'}] }
    ]
  };

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .az-root { width: 100%; height: 100%; display: flex; flex-direction: column; background: #f0f4f8; font-family: 'Jua', sans-serif; touch-action: none; position: relative; }
      .az-header { display: flex; flex-direction: column; background: #fff; border-bottom: 5px solid #FF7A1A; }
      .az-mode-tabs { display: flex; padding: 12px; gap: 10px; justify-content: center; }
      .az-mode-tab { padding: 12px 24px; border-radius: 25px; border: 3px solid #ddd; background: #f9f9f9; font-weight: 800; font-size: 17px; cursor: pointer; }
      .az-mode-tab.active { background: #FF7A1A; color: #fff; border-color: #FF7A1A; transform: scale(1.05); }
      .az-category-row { display: flex; gap: 12px; padding: 5px 15px 12px; overflow-x: auto; scrollbar-width: none; align-items: center; }
      .az-cat-btn { flex-shrink: 0; padding: 8px 16px; border-radius: 18px; border: 3px solid #eee; background: #fff; font-size: 15px; font-weight: 800; }
      .az-cat-btn.active { border-color: #FF7A1A; color: #FF7A1A; box-shadow: 0 4px 10px rgba(255,122,26,0.2); }

      .az-main { flex: 1; position: relative; padding: 15px; display: flex; align-items: center; justify-content: center; min-height: 0; }
      .az-canvas-wrap { position: relative; width: 100%; height: 100%; background: #fff; border: 8px solid #333; border-radius: 30px; box-shadow: 0 20px 45px rgba(0,0,0,0.15); overflow: hidden; transition: background 0.4s; }
      #azCanvas { width: 100%; height: 100%; position: relative; z-index: 5; }
      .az-overlay { position: absolute; inset: 0; pointer-events: none; opacity: 0.35; z-index: 10; }
      .az-paint-svg { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 15; }
      .az-paint-svg path { cursor: pointer; transition: fill 0.2s; pointer-events: auto; }

      .az-footer { padding: 15px; background: #fff; border-top: 5px solid #f0f0f0; display: flex; flex-direction: column; gap: 15px; }
      .az-palette-row { display: flex; gap: 12px; overflow-x: auto; padding: 5px 0; scrollbar-width: none; align-items: center; }
      .az-color-circle { width: 60px; height: 60px; border-radius: 50%; border: 4px solid #fff; box-shadow: 0 5px 12px rgba(0,0,0,0.1); flex-shrink: 0; transition: transform 0.2s; }
      .az-color-circle.active { transform: scale(1.2) translateY(-8px); border-color: #333; }
      .az-rainbow { background: linear-gradient(45deg, #ff0000, #ffeb3b, #00ff00, #00bcd4, #0044ff, #9c27b0); position: relative; }
      .az-rainbow::after { content: '✨'; position: absolute; inset: 0; display: grid; place-items: center; font-size: 28px; }
      .az-stamp-circle { width: 60px; height: 60px; border-radius: 18px; border: 4px solid #eee; background: #f9f9f9; display: grid; place-items: center; font-size: 32px; flex-shrink: 0; }
      .az-stamp-circle.active { border-color: #FF7A1A; background: #fff3e0; transform: scale(1.1); }

      .az-controls { display: flex; justify-content: space-between; align-items: center; }
      .az-size-group { display: flex; gap: 8px; }
      .az-size-btn { width: 55px; height: 55px; border-radius: 50%; border: 3px solid #eee; background: #fff; font-size: 15px; font-weight: 900; }
      .az-size-btn.active { border-color: #FF7A1A; background: #fff3e0; }
      .az-icon-btn { width: 65px; height: 65px; border-radius: 20px; border: none; background: #f5f5f5; font-size: 32px; box-shadow: 0 5px 0 #ddd; }
      .az-icon-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 #ddd; }
      .az-done-btn { flex: 1; margin-left: 15px; height: 65px; border-radius: 20px; background: #FF7A1A; color: #fff; font-size: 22px; font-weight: 900; border: none; box-shadow: 0 6px 0 #E65100; }

      .az-particle { position: absolute; pointer-events: none; animation: az-pop 0.8s forwards; z-index: 100; font-size: 26px; }
      @keyframes az-pop { 0% { transform: scale(0) rotate(0deg); opacity: 1; } 100% { transform: scale(1.6) rotate(180deg) translateY(-80px); opacity: 0; } }

      .az-stamp-pop {
        position: absolute;
        z-index: 120;
        pointer-events: none;
        font-size: 76px;
        line-height: 1;
        transform: translate(-50%, -50%) scale(0.45) rotate(-10deg);
        filter: drop-shadow(0 10px 0 rgba(0,0,0,0.16));
        animation: az-stamp-pop 0.48s cubic-bezier(.2,1.5,.35,1) forwards;
      }
      @keyframes az-stamp-pop {
        0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.35) rotate(-12deg); }
        35%  { opacity: 1; transform: translate(-50%, -50%) scale(1.26) rotate(5deg); }
        68%  { opacity: 1; transform: translate(-50%, -50%) scale(0.96) rotate(-2deg); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(1.08) rotate(0deg); }
      }

      .az-exhibit-overlay {
        position: absolute;
        inset: 0;
        z-index: 300;
        display: grid;
        place-items: center;
        padding: 20px;
        background: rgba(27, 35, 55, 0.48);
        backdrop-filter: blur(8px);
        animation: az-exhibit-fade 0.22s ease-out both;
      }
      @keyframes az-exhibit-fade {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      .az-exhibit-card {
        width: min(94vw, 520px);
        max-height: min(88vh, 760px);
        overflow: auto;
        border-radius: 34px;
        background: linear-gradient(180deg, #fffaf0 0%, #ffffff 100%);
        border: 6px solid #fff;
        box-shadow: 0 18px 0 rgba(0,0,0,0.22), 0 28px 60px rgba(0,0,0,0.28);
        padding: 18px;
        display: grid;
        gap: 14px;
        text-align: center;
        animation: az-exhibit-pop 0.34s cubic-bezier(.2,1.35,.35,1) both;
      }
      @keyframes az-exhibit-pop {
        from { transform: translateY(22px) scale(0.92); opacity: 0; }
        to   { transform: translateY(0) scale(1); opacity: 1; }
      }
      .az-exhibit-title {
        font-size: clamp(24px, 7vw, 36px);
        font-weight: 900;
        color: #2d2d2d;
        text-shadow: 0 2px 0 rgba(255,255,255,0.8);
      }
      .az-exhibit-frame {
        position: relative;
        border-radius: 26px;
        padding: 14px;
        background: linear-gradient(135deg, #FFD36E 0%, #FF9F1C 42%, #F76B1C 100%);
        box-shadow: inset 0 4px 0 rgba(255,255,255,0.45), 0 10px 0 rgba(120,70,0,0.18);
      }
      .az-exhibit-frame::before {
        content: '⭐';
        position: absolute;
        left: 12px;
        top: 10px;
        font-size: 28px;
        filter: drop-shadow(0 2px 0 rgba(0,0,0,0.18));
      }
      .az-exhibit-frame::after {
        content: '✨';
        position: absolute;
        right: 12px;
        top: 10px;
        font-size: 28px;
        filter: drop-shadow(0 2px 0 rgba(0,0,0,0.18));
      }
      .az-exhibit-frame img {
        display: block;
        width: 100%;
        max-height: 48vh;
        object-fit: contain;
        border-radius: 18px;
        background: #fff;
        border: 5px solid #fff6d6;
      }
      .az-exhibit-actions {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      .az-exhibit-btn {
        min-height: 58px;
        border-radius: 18px;
        border: 0;
        background: #f2f4f8;
        color: #233044;
        font: inherit;
        font-size: clamp(14px, 3.8vw, 18px);
        font-weight: 900;
        box-shadow: 0 5px 0 rgba(0,0,0,0.14);
      }
      .az-exhibit-btn.primary {
        background: #FF7A1A;
        color: #fff;
        box-shadow: 0 5px 0 #E65100;
      }
      .az-exhibit-btn:active {
        transform: translateY(3px);
        box-shadow: 0 2px 0 rgba(0,0,0,0.14);
      }
      @media (max-width: 420px) {
        .az-exhibit-actions { grid-template-columns: 1fr; }
        .az-exhibit-card { padding: 14px; border-radius: 28px; }
      }
    `;
    document.head.appendChild(style);
  }

  function render(container, options = {}) {
    state.container = container;
    state.options = options;
    injectStyle();

    container.innerHTML = `
      <div class="az-root">
        <div class="az-header">
          <div class="az-mode-tabs">
            <button class="az-mode-tab active" data-mode="free">🎨 자유</button>
            <button class="az-mode-tab" data-mode="trace">✍️ 따라그리기</button>
            <button class="az-mode-tab" data-mode="paint">🌈 색칠하기</button>
          </div>
          <div class="az-category-row" id="azCategoryRow" style="display:none;">
            <button class="az-cat-btn active" data-cat="animals">🐶 동물</button>
            <button class="az-cat-btn" data-cat="foods">🍎 음식</button>
            <button class="az-cat-btn" data-cat="vehicles">🚗 자동차</button>
            <div style="width:20px; flex-shrink:0;"></div>
            <div id="azTargetList" style="display:flex; gap:10px;"></div>
          </div>
          <div class="az-category-row" id="azThemeRow">
            ${Object.keys(THEMES).map(k => `<button class="az-cat-btn ${k===state.activeTheme?'active':''}" data-theme="${k}">${THEMES[k].label}</button>`).join('')}
          </div>
        </div>
        <div class="az-main">
          <div class="az-canvas-wrap" id="azCanvasWrap">
            <canvas id="azCanvas"></canvas>
            <svg class="az-overlay" id="azTraceSvg" viewBox="0 0 500 500" style="display:none;">
              <path id="azTracePath" d="" fill="none" stroke="#ccc" stroke-width="6" stroke-dasharray="10,10" />
            </svg>
            <div id="azPaintLayer" class="az-paint-svg" style="display:none;"></div>
          </div>
        </div>
        <div class="az-footer">
          <div class="az-palette-row">
            ${COLORS.map(c => `<div class="az-color-circle ${c.c==='rainbow'?'az-rainbow':''} ${state.currentColor===c.c?'active':''}" style="background:${c.c==='rainbow'?'':c.c}" data-color="${c.c}" data-name="${c.n}"></div>`).join('')}
            <div style="width:15px; border-left:3px dashed #f0f0f0; height:45px; flex-shrink:0;"></div>
            ${STAMPS.map(s => `<div class="az-stamp-circle" data-stamp="${s}">${s}</div>`).join('')}
          </div>
          <div class="az-controls">
            <div class="az-size-group">
              <button class="az-size-btn" data-size="6">작음</button>
              <button class="az-size-btn active" data-size="16">중간</button>
              <button class="az-size-btn" data-size="32">크다</button>
            </div>
            <div style="display:flex; gap:10px; margin-left:15px;">
              <button class="az-icon-btn" id="azEraser">🧽</button>
              <button class="az-icon-btn" id="azUndo" style="display:none;">↩️</button>
              <button class="az-icon-btn" id="azClear">🗑️</button>
            </div>
            <button class="az-done-btn" id="azDone">다 그렸어요! ✨</button>
          </div>
        </div>
      </div>
    `;

    initCanvas();
    bindEvents();
    updateModeView();
    speak('시현아! 마법 그림판 v2.0이야. 예쁜 그림을 그려보자!', true);
  }

  function initCanvas() {
    state.canvas = document.getElementById('azCanvas');
    state.ctx = state.canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const wrap = document.getElementById('azCanvasWrap');
    const rect = wrap.getBoundingClientRect();
    state.canvas.width = rect.width * dpr;
    state.canvas.height = rect.height * dpr;
    state.ctx.scale(dpr, dpr);
    state.ctx.lineCap = 'round';
    state.ctx.lineJoin = 'round';
    applyThemeBackground();
  }

  function applyThemeBackground() {
    const wrap = document.getElementById('azCanvasWrap');
    wrap.style.backgroundColor = THEMES[state.activeTheme].color;
  }

  function bindEvents() {
    const getPos = (e) => {
      const rect = state.canvas.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: cx - rect.left, y: cy - rect.top };
    };

    const start = (e) => {
      if (state.mode === 'paint') return;
      const pos = getPos(e);
      if (state.activeStamp) { placeStamp(pos.x, pos.y); return; }
      state.isDrawing = true;
      state.ctx.beginPath();
      state.ctx.moveTo(pos.x, pos.y);
    };

    const move = (e) => {
      if (!state.isDrawing || state.activeStamp) return;
      const pos = getPos(e);
      if (state.mode === 'eraser') {
        state.ctx.globalCompositeOperation = 'destination-out';
        state.ctx.beginPath();
        state.ctx.arc(pos.x, pos.y, state.currentSize, 0, Math.PI * 2);
        state.ctx.fill();
        return;
      }
      state.ctx.globalCompositeOperation = 'source-over';
      if (state.isRainbow) {
        state.hue = (state.hue + 5) % 360;
        state.ctx.strokeStyle = `hsl(${state.hue}, 90%, 60%)`;
        if (Math.random() > 0.8) createMagicParticle(pos.x, pos.y);
      } else {
        state.ctx.strokeStyle = state.currentColor;
      }
      state.ctx.lineWidth = state.currentSize;
      state.ctx.lineTo(pos.x, pos.y);
      state.ctx.stroke();
    };

    state.canvas.addEventListener('mousedown', start);
    state.canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', () => state.isDrawing = false);
    state.canvas.addEventListener('touchstart', (e) => { if(state.mode !== 'paint') e.preventDefault(); start(e); });
    state.canvas.addEventListener('touchmove', (e) => { if(state.mode !== 'paint') e.preventDefault(); move(e); });

    state.container.querySelectorAll('.az-mode-tab').forEach(btn => {
      btn.onclick = () => {
        state.mode = btn.dataset.mode;
        state.container.querySelectorAll('.az-mode-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateModeView();
      };
    });

    state.container.querySelectorAll('[data-theme]').forEach(btn => {
      btn.onclick = () => {
        state.activeTheme = btn.dataset.theme;
        state.container.querySelectorAll('[data-theme]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyThemeBackground();
        speak(THEMES[state.activeTheme].label + ' 테마야!');
      };
    });

    state.container.querySelectorAll('.az-color-circle').forEach(btn => {
      btn.onclick = () => {
        const c = btn.dataset.color;
        state.isRainbow = (c === 'rainbow');
        state.activeStamp = null;
        if(!state.isRainbow) state.currentColor = c;
        if(state.mode === 'eraser') state.mode = 'free';
        state.container.querySelectorAll('.az-color-circle, .az-stamp-circle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        speak(btn.dataset.name);
        if(navigator.vibrate) navigator.vibrate(30);
      };
    });

    state.container.querySelectorAll('.az-stamp-circle').forEach(btn => {
      btn.onclick = () => {
        state.activeStamp = btn.dataset.stamp;
        state.isRainbow = false;
        state.container.querySelectorAll('.az-color-circle, .az-stamp-circle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        speak('도장 준비!');
      };
    });

    state.container.querySelectorAll('.az-size-btn').forEach(btn => {
      btn.onclick = () => {
        state.currentSize = parseInt(btn.dataset.size);
        state.container.querySelectorAll('.az-size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });

    document.getElementById('azEraser').onclick = () => {
      state.mode = 'eraser';
      state.activeStamp = null;
      speak('지우개로 슥싹!');
    };

    document.getElementById('azClear').onclick = () => {
        state.ctx.clearRect(0,0,state.canvas.width, state.canvas.height);
        speak('깨끗하게 지웠어!');
    };
    document.getElementById('azUndo').onclick = () => undoPaint();

    document.getElementById('azDone').onclick = () => {
      state.options.fireConfetti?.();
      state.options.gainExp?.(state.mode === 'free' ? 10 : state.mode === 'trace' ? 15 : 20);
      speak('우와! 정말 멋진 그림이야! 전시회에 걸어볼게!', true);
      showArtExhibition();
    };

    state.container.querySelectorAll('.az-cat-btn[data-cat]').forEach(btn => {
        btn.onclick = () => {
            state.activeCategory = btn.dataset.cat;
            state.container.querySelectorAll('.az-cat-btn[data-cat]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTargetList();
        };
    });
  }

  function updateModeView() {
    const isTrace = state.mode === 'trace';
    const isPaint = state.mode === 'paint';
    document.getElementById('azCategoryRow').style.display = (isTrace || isPaint) ? 'flex' : 'none';
    document.getElementById('azTraceSvg').style.display = isTrace ? 'block' : 'none';
    document.getElementById('azPaintLayer').style.display = isPaint ? 'block' : 'none';
    document.getElementById('azUndo').style.display = isPaint ? 'block' : 'none';
    renderTargetList();
  }

  function renderTargetList() {
      const list = TRACE_GUIDES[state.activeCategory];
      const wrap = document.getElementById('azTargetList');
      wrap.innerHTML = list.map(item => `<button class="az-cat-btn ${state.traceTarget === item.id ? 'active' : ''}" data-tid="${item.id}">${item.name}</button>`).join('');
      
      wrap.querySelectorAll('[data-tid]').forEach(btn => {
          btn.onclick = () => {
              state.traceTarget = btn.dataset.tid;
              wrap.querySelectorAll('[data-tid]').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              if(state.mode === 'trace') {
                  document.getElementById('azTracePath').setAttribute('d', list.find(x => x.id === state.traceTarget).d);
                  speak(`${btn.innerText} 그려볼까?`);
              } else if(state.mode === 'paint') {
                  renderPaintSections();
                  speak(`${btn.innerText} 색칠해보자!`);
              }
          };
      });
      if(state.mode === 'trace') document.getElementById('azTracePath').setAttribute('d', list[0].d);
      else if(state.mode === 'paint') renderPaintSections();
  }

  function renderPaintSections() {
      const target = TRACE_GUIDES[state.activeCategory].find(x => x.id === state.traceTarget);
      const layer = document.getElementById('azPaintLayer');
      state.paintHistory = [];
      
      layer.innerHTML = `
        <svg class="az-paint-svg" viewBox="0 0 500 500">
            ${target.sections.map(sec => `<path class="paint-sec" d="${sec.d}" fill="${sec.fill || '#eeeeee'}" stroke="#333" stroke-width="2" />`).join('')}
        </svg>
      `;
      
      layer.querySelectorAll('.paint-sec').forEach(p => {
          p.onclick = (e) => {
              let fillCol = state.currentColor;
              if (state.isRainbow) {
                  state.hue = (state.hue + 30) % 360;
                  fillCol = `hsl(${state.hue}, 100%, 50%)`;
              }
              state.paintHistory.push({ el: p, prev: p.getAttribute('fill') });
              p.setAttribute('fill', fillCol);
              createMagicParticle(e.clientX, e.clientY, state.isRainbow ? '✨' : null);
              if(navigator.vibrate) navigator.vibrate(30);
          };
      });
  }

  function undoPaint() {
      const last = state.paintHistory.pop();
      if(last) last.el.setAttribute('fill', last.prev);
  }

  function placeStamp(x, y) {
    state.ctx.save();
    state.ctx.font = '70px serif';
    state.ctx.textAlign = 'center';
    state.ctx.textBaseline = 'middle';
    state.ctx.fillText(state.activeStamp, x, y);
    state.ctx.restore();
    showStampPop(x, y, state.activeStamp);
    createMagicParticle(x, y, state.activeStamp);
    if(navigator.vibrate) navigator.vibrate(50);
  }

  function normalizeEffectPoint(x, y) {
    const wrap = document.getElementById('azCanvasWrap');
    if (!wrap) return { x, y };
    const rect = wrap.getBoundingClientRect();
    const appearsToBeClientPoint = x > rect.width || y > rect.height || x < 0 || y < 0;
    if (!appearsToBeClientPoint) return { x, y };
    return { x: x - rect.left, y: y - rect.top };
  }

  function showStampPop(x, y, stamp) {
    const wrap = document.getElementById('azCanvasWrap');
    if (!wrap || !stamp) return;
    const point = normalizeEffectPoint(x, y);
    const pop = document.createElement('div');
    pop.className = 'az-stamp-pop';
    pop.textContent = stamp;
    pop.style.left = `${point.x}px`;
    pop.style.top = `${point.y}px`;
    wrap.appendChild(pop);
    setTimeout(() => pop.remove(), 520);
  }

  function createMagicParticle(x, y, char) {
    const wrap = document.getElementById('azCanvasWrap');
    if (!wrap) return;
    const point = normalizeEffectPoint(x, y);
    const s = document.createElement('div');
    s.className = 'az-particle';
    s.textContent = char || '✨';
    s.style.left = `${point.x}px`; s.style.top = `${point.y}px`;
    wrap.appendChild(s);
    setTimeout(() => s.remove(), 800);
  }

  async function buildArtSnapshotDataUrl() {
    if (!state.canvas) return '';
    const output = document.createElement('canvas');
    output.width = state.canvas.width;
    output.height = state.canvas.height;
    const ctx = output.getContext('2d');
    if (!ctx) return state.canvas.toDataURL('image/png');

    ctx.fillStyle = THEMES[state.activeTheme]?.color || '#ffffff';
    ctx.fillRect(0, 0, output.width, output.height);
    ctx.drawImage(state.canvas, 0, 0);

    const paintLayer = document.getElementById('azPaintLayer');
    const paintSvg = paintLayer?.querySelector('svg');
    if (state.mode === 'paint' && paintSvg) {
      await drawSvgLayerToCanvas(ctx, paintSvg, output.width, output.height);
    }

    return output.toDataURL('image/png');
  }

  function drawSvgLayerToCanvas(ctx, svg, width, height) {
    return new Promise((resolve) => {
      try {
        const clone = svg.cloneNode(true);
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.setAttribute('width', String(width));
        clone.setAttribute('height', String(height));
        const svgText = new XMLSerializer().serializeToString(clone);
        const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        img.src = url;
      } catch (error) {
        console.warn('[ArtZone] SVG snapshot skipped:', error);
        resolve();
      }
    });
  }

  async function showArtExhibition() {
    const root = state.container?.querySelector('.az-root');
    if (!root) return;
    root.querySelector('.az-exhibit-overlay')?.remove();

    const dataUrl = await buildArtSnapshotDataUrl();
    const overlay = document.createElement('div');
    overlay.className = 'az-exhibit-overlay';
    overlay.innerHTML = `
      <div class="az-exhibit-card" role="dialog" aria-label="시현이 그림 전시회">
        <div class="az-exhibit-title">🖼️ 시현이 그림 전시회</div>
        <div class="az-exhibit-frame">
          <img src="${dataUrl}" alt="시현이가 완성한 그림">
        </div>
        <div class="az-exhibit-actions">
          <button type="button" class="az-exhibit-btn" data-action="continue">계속 그리기</button>
          <button type="button" class="az-exhibit-btn" data-action="restart">다시 그리기</button>
          <button type="button" class="az-exhibit-btn primary" data-action="home">게임랜드</button>
        </div>
      </div>
    `;
    root.appendChild(overlay);

    overlay.querySelector('[data-action="continue"]')?.addEventListener('click', () => {
      overlay.remove();
      speak('좋아, 조금 더 꾸며보자!', true);
    });

    overlay.querySelector('[data-action="restart"]')?.addEventListener('click', () => {
      overlay.remove();
      resetCurrentArtwork();
      speak('새 그림을 다시 시작해보자!', true);
    });

    overlay.querySelector('[data-action="home"]')?.addEventListener('click', () => {
      overlay.remove();
      state.options.closeToParkHome?.();
    });
  }

  function resetCurrentArtwork() {
    state.paintHistory = [];
    if (state.mode === 'paint') {
      renderPaintSections();
      return;
    }
    state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    applyThemeBackground();
  }

  function speak(msg, force = false) {
    if (state.options.speakGuide) state.options.speakGuide(msg, force);
  }

  function destroy() {
    state.destroyed = true;
    if (state.container) state.container.innerHTML = '';
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
})();