/**
 * 시현이 놀이터 OS — 매직 그림판 v3.0
 * 자유 그리기 + 색칠 팡팡 (SVG inline fill 방식)
 */
(function () {
  const GAME_KEY = 'artZone';
  const STYLE_ID = 'sihyeon-art-v3-style';

  const COLORS = [
    { c: '#FF4444', n: '빨간색' }, { c: '#FF9900', n: '주황색' },
    { c: '#FFD700', n: '노란색' }, { c: '#44CC44', n: '초록색' },
    { c: '#4488FF', n: '파란색' }, { c: '#9944FF', n: '보라색' },
    { c: '#FF88CC', n: '분홍색' }, { c: '#1A1A1A', n: '검정색' },
    { c: 'rainbow', n: '무지개' },
  ];

  const STAMPS = ['🚗', '🦖', '⭐', '❤️', '🍦', '🐶'];

  const THEMES = {
    white:  { label: '⚪ 빈칸',  color: '#ffffff' },
    sky:    { label: '☁️ 하늘', color: '#e3f2fd' },
    ocean:  { label: '🌊 바다', color: '#e0f7fa' },
    forest: { label: '🌳 숲속', color: '#f1f8e9' },
  };

  const COLORING_TEMPLATES = [
    {
      id: 'apple', name: '사과', emoji: '🍎', viewBox: '0 0 200 210',
      parts: [
        { id: 'body', label: '사과', stroke: '#c62828', sw: 4,
          d: 'M58,90 C52,62 68,38 90,35 Q100,30 110,35 C132,38 148,62 142,90 Q152,140 128,172 Q115,188 100,188 Q85,188 72,172 Q48,140 58,90Z' },
        { id: 'leaf', label: '잎사귀', stroke: '#2e7d32', sw: 3,
          d: 'M100,35 C100,18 124,8 136,22 C122,33 110,35 100,35Z' },
        { id: 'stem', label: '꼭지', stroke: '#5d4037', sw: 3,
          d: 'M98,35 L95,20 L105,20 L102,35Z' },
      ],
    },
    {
      id: 'car', name: '자동차', emoji: '🚗', viewBox: '0 0 280 155',
      parts: [
        { id: 'body',   label: '차체',   stroke: '#1565c0', sw: 4,
          d: 'M15,58 L265,58 L265,118 L15,118Z' },
        { id: 'cabin',  label: '지붕',   stroke: '#1a237e', sw: 4,
          d: 'M62,58 L84,20 L196,20 L218,58Z' },
        { id: 'window', label: '창문',   stroke: '#455a64', sw: 2,
          d: 'M88,56 L104,26 L174,26 L192,56Z' },
        { id: 'wheel1', label: '앞바퀴', stroke: '#212121', sw: 4,
          d: 'M44,118 a24,24 0 1,0 48,0 a24,24 0 1,0 -48,0Z' },
        { id: 'wheel2', label: '뒷바퀴', stroke: '#212121', sw: 4,
          d: 'M186,118 a24,24 0 1,0 48,0 a24,24 0 1,0 -48,0Z' },
      ],
    },
    {
      id: 'house', name: '집', emoji: '🏠', viewBox: '0 0 220 200',
      parts: [
        { id: 'wall',    label: '벽',   stroke: '#5d4037', sw: 4,
          d: 'M30,190 L30,90 L190,90 L190,190Z' },
        { id: 'roof',    label: '지붕', stroke: '#b71c1c', sw: 4,
          d: 'M12,90 L110,20 L208,90Z' },
        { id: 'door',    label: '문',   stroke: '#4e342e', sw: 3,
          d: 'M84,190 L84,140 Q110,128 136,140 L136,190Z' },
        { id: 'window',  label: '창문', stroke: '#1565c0', sw: 3,
          d: 'M42,105 L82,105 L82,142 L42,142Z' },
        { id: 'chimney', label: '굴뚝', stroke: '#4e342e', sw: 3,
          d: 'M148,90 L148,44 L166,44 L166,76Z' },
      ],
    },
    {
      id: 'butterfly', name: '나비', emoji: '🦋', viewBox: '0 0 220 200',
      parts: [
        { id: 'wingLT', label: '왼쪽 윗날개',   stroke: '#7b1fa2', sw: 3,
          d: 'M110,95 C85,76 20,56 14,24 C10,4 54,2 90,44 C103,58 108,78 110,95Z' },
        { id: 'wingRT', label: '오른쪽 윗날개', stroke: '#7b1fa2', sw: 3,
          d: 'M110,95 C135,76 200,56 206,24 C210,4 166,2 130,44 C117,58 112,78 110,95Z' },
        { id: 'wingLB', label: '왼쪽 아랫날개',   stroke: '#7b1fa2', sw: 3,
          d: 'M110,100 C82,118 22,130 16,160 C12,182 58,192 100,155 C110,144 111,120 110,100Z' },
        { id: 'wingRB', label: '오른쪽 아랫날개', stroke: '#7b1fa2', sw: 3,
          d: 'M110,100 C138,118 198,130 204,160 C208,182 162,192 120,155 C110,144 109,120 110,100Z' },
        { id: 'body', label: '몸통', stroke: '#4a148c', sw: 3,
          d: 'M110,58 C118,70 118,134 110,148 C102,134 102,70 110,58Z' },
      ],
    },
  ];

  const state = {
    container: null, options: {},
    tab: 'free',    // 'free' | 'coloring'
    mode: 'free',   // 'free' | 'eraser'  (free-tab only)
    canvas: null, ctx: null,
    isDrawing: false, currentColor: '#FF4444', currentSize: 15,
    isRainbow: false, hue: 0,
    activeTheme: 'white', activeStamp: null,
    paintHistory: [],
    activeTemplateId: 'apple',
    coloringCompleted: false,
    destroyed: false,
    timers: [],
  };

  function timer(fn, ms) { const id = setTimeout(fn, ms); state.timers.push(id); }
  function clearTimers()  { state.timers.forEach(clearTimeout); state.timers = []; }

  /* ── CSS ─────────────────────────────────── */
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .az-root{width:100%;height:100%;display:flex;flex-direction:column;background:#f0f4f8;font-family:'Jua',sans-serif;touch-action:none;position:relative;}

      .az-header{display:flex;flex-direction:column;background:#fff;border-bottom:5px solid #FF7A1A;}
      .az-mode-tabs{display:flex;padding:10px 12px 8px;gap:10px;justify-content:center;}
      .az-mode-tab{padding:11px 26px;border-radius:24px;border:3px solid #ddd;background:#f9f9f9;font-weight:800;font-size:17px;cursor:pointer;transition:all .2s;}
      .az-mode-tab.active{background:#FF7A1A;color:#fff;border-color:#FF7A1A;transform:scale(1.05);}
      .az-sub-row{display:flex;gap:10px;padding:4px 12px 10px;overflow-x:auto;scrollbar-width:none;}
      .az-cat-btn{flex-shrink:0;padding:7px 16px;border-radius:18px;border:3px solid #eee;background:#fff;font-size:15px;font-weight:800;cursor:pointer;transition:all .2s;}
      .az-cat-btn.active{border-color:#FF7A1A;color:#FF7A1A;box-shadow:0 4px 10px rgba(255,122,26,.2);}

      .az-main{flex:1;position:relative;padding:14px;display:flex;align-items:center;justify-content:center;min-height:0;}
      .az-canvas-wrap{position:relative;width:100%;height:100%;background:#fff;border:8px solid #333;border-radius:28px;box-shadow:0 18px 40px rgba(0,0,0,.14);overflow:hidden;transition:background .4s;}
      #azCanvas{width:100%;height:100%;display:block;}

      .az-coloring-wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:12px;background:#fff8f2;}
      .az-coloring-wrap svg{width:100%;height:100%;max-width:100%;max-height:100%;overflow:visible;}
      .az-coloring-wrap .fillable{cursor:pointer;transition:fill .4s ease;pointer-events:fill;}
      .az-coloring-wrap .fillable:active{opacity:.8;}

      .az-coloring-wrap.az-done svg{animation:az-glow-bounce .65s cubic-bezier(.2,1.4,.35,1) forwards;filter:drop-shadow(0 0 14px gold) drop-shadow(0 0 28px #ff9800);}
      @keyframes az-glow-bounce{0%{transform:scale(1)}45%{transform:scale(1.13)}75%{transform:scale(.97)}100%{transform:scale(1.08)}}

      .az-complete-banner{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:10px;z-index:200;white-space:nowrap;animation:az-banner-up .4s cubic-bezier(.2,1.4,.35,1) both;}
      @keyframes az-banner-up{from{opacity:0;transform:translateX(-50%) translateY(18px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      .az-complete-btn{padding:13px 18px;border-radius:18px;border:none;font:inherit;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 5px 0 rgba(0,0,0,.15);}
      .az-complete-btn.next{background:#FF7A1A;color:#fff;box-shadow:0 5px 0 #E65100;}
      .az-complete-btn.retry{background:#fff;color:#555;}

      .az-footer{padding:13px;background:#fff;border-top:5px solid #f0f0f0;display:flex;flex-direction:column;gap:12px;}
      .az-palette-row{display:flex;gap:10px;overflow-x:auto;padding:4px 0;scrollbar-width:none;align-items:center;}
      .az-color-circle{width:56px;height:56px;border-radius:50%;border:4px solid #fff;box-shadow:0 5px 12px rgba(0,0,0,.1);flex-shrink:0;cursor:pointer;transition:transform .2s;}
      .az-color-circle.active{transform:scale(1.22) translateY(-7px);border-color:#333;}
      .az-rainbow{background:linear-gradient(45deg,#ff0000,#ffeb3b,#00ff00,#00bcd4,#0044ff,#9c27b0);position:relative;}
      .az-rainbow::after{content:'✨';position:absolute;inset:0;display:grid;place-items:center;font-size:26px;}
      .az-stamp-circle{width:56px;height:56px;border-radius:16px;border:4px solid #eee;background:#f9f9f9;display:grid;place-items:center;font-size:30px;flex-shrink:0;cursor:pointer;}
      .az-stamp-circle.active{border-color:#FF7A1A;background:#fff3e0;transform:scale(1.1);}
      .az-sep{width:3px;height:44px;background:#f0f0f0;border-radius:2px;flex-shrink:0;margin:0 4px;}

      .az-controls{display:flex;justify-content:space-between;align-items:center;gap:10px;}
      .az-size-group{display:flex;gap:8px;}
      .az-size-btn{width:52px;height:52px;border-radius:50%;border:3px solid #eee;background:#fff;font-size:14px;font-weight:900;cursor:pointer;}
      .az-size-btn.active{border-color:#FF7A1A;background:#fff3e0;}
      .az-icon-btns{display:flex;gap:8px;}
      .az-icon-btn{width:60px;height:60px;border-radius:18px;border:none;background:#f5f5f5;font-size:28px;box-shadow:0 5px 0 #ddd;cursor:pointer;}
      .az-icon-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #ddd;}
      .az-done-btn{flex:1;height:62px;border-radius:20px;background:#FF7A1A;color:#fff;font-size:20px;font-weight:900;border:none;box-shadow:0 6px 0 #E65100;cursor:pointer;}
      .az-done-btn:active{transform:translateY(3px);box-shadow:0 2px 0 #E65100;}

      .az-sparkle{position:absolute;pointer-events:none;font-size:22px;z-index:200;animation:az-sparkle-burst .65s forwards;}
      @keyframes az-sparkle-burst{0%{opacity:1;transform:translate(var(--sx),var(--sy)) scale(1.2)}100%{opacity:0;transform:translate(calc(var(--sx) + var(--tx,0px)),calc(var(--sy) + var(--ty,-55px))) scale(.25)}}
      .az-particle{position:absolute;pointer-events:none;font-size:26px;z-index:200;animation:az-pop .8s forwards;}
      @keyframes az-pop{0%{transform:scale(0) rotate(0deg);opacity:1}100%{transform:scale(1.5) rotate(180deg) translateY(-75px);opacity:0}}
      .az-stamp-pop{position:absolute;z-index:220;pointer-events:none;font-size:72px;line-height:1;transform:translate(-50%,-50%) scale(.4) rotate(-10deg);animation:az-stamp-pop .48s cubic-bezier(.2,1.5,.35,1) forwards;}
      @keyframes az-stamp-pop{0%{opacity:0;transform:translate(-50%,-50%) scale(.3) rotate(-12deg)}38%{opacity:1;transform:translate(-50%,-50%) scale(1.25) rotate(5deg)}68%{transform:translate(-50%,-50%) scale(.95) rotate(-2deg)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.06) rotate(0)}}

      .az-exhibit-overlay{position:absolute;inset:0;z-index:300;display:grid;place-items:center;padding:20px;background:rgba(27,35,55,.48);backdrop-filter:blur(8px);animation:az-exhibit-fade .22s ease-out both;}
      @keyframes az-exhibit-fade{from{opacity:0}to{opacity:1}}
      .az-exhibit-card{width:min(94vw,520px);max-height:min(88vh,760px);overflow:auto;border-radius:34px;background:linear-gradient(180deg,#fffaf0 0%,#fff 100%);border:6px solid #fff;box-shadow:0 18px 0 rgba(0,0,0,.22),0 28px 60px rgba(0,0,0,.28);padding:18px;display:grid;gap:14px;text-align:center;animation:az-exhibit-pop .34s cubic-bezier(.2,1.35,.35,1) both;}
      @keyframes az-exhibit-pop{from{transform:translateY(22px) scale(.92);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
      .az-exhibit-title{font-size:clamp(22px,6vw,34px);font-weight:900;color:#2d2d2d;}
      .az-exhibit-frame{border-radius:26px;padding:14px;background:linear-gradient(135deg,#FFD36E 0%,#FF9F1C 42%,#F76B1C 100%);box-shadow:inset 0 4px 0 rgba(255,255,255,.45),0 10px 0 rgba(120,70,0,.18);}
      .az-exhibit-frame img{display:block;width:100%;max-height:46vh;object-fit:contain;border-radius:18px;background:#fff;border:5px solid #fff6d6;}
      .az-exhibit-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
      .az-exhibit-btn{min-height:54px;border-radius:18px;border:0;background:#f2f4f8;color:#233044;font:inherit;font-size:clamp(13px,3.6vw,17px);font-weight:900;box-shadow:0 5px 0 rgba(0,0,0,.14);cursor:pointer;}
      .az-exhibit-btn.primary{background:#FF7A1A;color:#fff;box-shadow:0 5px 0 #E65100;}
      .az-exhibit-btn:active{transform:translateY(3px);box-shadow:0 2px 0 rgba(0,0,0,.14);}
      @media(max-width:420px){.az-exhibit-actions{grid-template-columns:1fr}.az-exhibit-card{padding:14px;border-radius:28px;}}
    `;
    document.head.appendChild(s);
  }

  /* ── Render ──────────────────────────────── */
  function render(container, options = {}) {
    state.container        = container;
    state.options          = options;
    state.tab              = 'free';
    state.mode             = 'free';
    state.paintHistory     = [];
    state.coloringCompleted = false;
    state.activeStamp      = null;
    state.destroyed        = false;
    injectStyle();

    container.innerHTML = `
      <div class="az-root">
        <div class="az-header">
          <div class="az-mode-tabs">
            <button class="az-mode-tab active" data-tab="free">🎨 자유 그리기</button>
            <button class="az-mode-tab" data-tab="coloring">🌈 색칠 팡팡</button>
          </div>
          <div class="az-sub-row" id="azThemeRow">
            ${Object.keys(THEMES).map(k=>`<button class="az-cat-btn${k===state.activeTheme?' active':''}" data-theme="${k}">${THEMES[k].label}</button>`).join('')}
          </div>
          <div class="az-sub-row" id="azTplRow" style="display:none;">
            ${COLORING_TEMPLATES.map(t=>`<button class="az-cat-btn${t.id===state.activeTemplateId?' active':''}" data-tpl="${t.id}">${t.emoji} ${t.name}</button>`).join('')}
          </div>
        </div>
        <div class="az-main">
          <div class="az-canvas-wrap" id="azCanvasWrap">
            <canvas id="azCanvas"></canvas>
            <div class="az-coloring-wrap" id="azColoringWrap" style="display:none;"></div>
          </div>
        </div>
        <div class="az-footer">
          <div class="az-palette-row">
            ${COLORS.map(c=>`<div class="az-color-circle${c.c==='rainbow'?' az-rainbow':''}${state.currentColor===c.c?' active':''}" ${c.c!=='rainbow'?`style="background:${c.c}"`:''}  data-color="${c.c}" data-name="${c.n}"></div>`).join('')}
            <div class="az-sep az-free-only"></div>
            ${STAMPS.map(s=>`<div class="az-stamp-circle az-free-only" data-stamp="${s}">${s}</div>`).join('')}
          </div>
          <div class="az-controls">
            <div class="az-size-group az-free-only">
              <button class="az-size-btn" data-size="6">작음</button>
              <button class="az-size-btn active" data-size="16">중간</button>
              <button class="az-size-btn" data-size="32">크다</button>
            </div>
            <div class="az-icon-btns">
              <button class="az-icon-btn az-free-only" id="azEraser">🧽</button>
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
    speak('시현아! 마법 그림판이야. 자유롭게 그리거나 색칠해봐!', true);
  }

  /* ── Canvas ──────────────────────────────── */
  function initCanvas() {
    state.canvas = document.getElementById('azCanvas');
    state.ctx    = state.canvas.getContext('2d');
    const dpr  = window.devicePixelRatio || 1;
    const rect = document.getElementById('azCanvasWrap').getBoundingClientRect();
    state.canvas.width  = rect.width  * dpr;
    state.canvas.height = rect.height * dpr;
    state.ctx.scale(dpr, dpr);
    state.ctx.lineCap  = 'round';
    state.ctx.lineJoin = 'round';
    applyThemeBg();
  }

  function applyThemeBg() {
    const wrap = document.getElementById('azCanvasWrap');
    if (wrap) wrap.style.backgroundColor = THEMES[state.activeTheme]?.color || '#fff';
  }

  /* ── Events ──────────────────────────────── */
  function bindEvents() {
    const root = state.container.querySelector('.az-root');

    root.querySelectorAll('.az-mode-tab').forEach(btn => {
      btn.onclick = () => {
        root.querySelectorAll('.az-mode-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        switchTab(btn.dataset.tab);
      };
    });

    root.querySelectorAll('[data-theme]').forEach(btn => {
      btn.onclick = () => {
        state.activeTheme = btn.dataset.theme;
        root.querySelectorAll('[data-theme]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyThemeBg();
        speak(THEMES[state.activeTheme].label + ' 테마야!');
      };
    });

    root.querySelectorAll('[data-tpl]').forEach(btn => {
      btn.onclick = () => {
        state.activeTemplateId  = btn.dataset.tpl;
        state.coloringCompleted = false;
        root.querySelectorAll('[data-tpl]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tpl = COLORING_TEMPLATES.find(t => t.id === state.activeTemplateId);
        renderColoringTemplate(tpl);
        speak(`${tpl?.name || ''} 색칠해보자!`);
      };
    });

    root.querySelectorAll('.az-color-circle').forEach(btn => {
      btn.onclick = () => {
        const c = btn.dataset.color;
        state.isRainbow = (c === 'rainbow');
        state.activeStamp = null;
        if (!state.isRainbow) state.currentColor = c;
        if (state.mode === 'eraser') state.mode = 'free';
        root.querySelectorAll('.az-color-circle, .az-stamp-circle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        speak(btn.dataset.name);
        if (navigator.vibrate) navigator.vibrate(25);
      };
    });

    root.querySelectorAll('.az-stamp-circle').forEach(btn => {
      btn.onclick = () => {
        state.activeStamp = btn.dataset.stamp;
        state.isRainbow   = false;
        root.querySelectorAll('.az-color-circle, .az-stamp-circle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        speak('도장 준비!');
      };
    });

    root.querySelectorAll('.az-size-btn').forEach(btn => {
      btn.onclick = () => {
        state.currentSize = parseInt(btn.dataset.size);
        root.querySelectorAll('.az-size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });

    document.getElementById('azEraser').onclick = () => {
      state.mode = 'eraser';
      state.activeStamp = null;
      speak('지우개로 슥싹!');
    };

    document.getElementById('azUndo').onclick = () => {
      const last = state.paintHistory.pop();
      if (last) last.el.setAttribute('fill', last.prev);
    };

    document.getElementById('azClear').onclick = () => {
      if (state.tab === 'coloring') {
        state.coloringCompleted = false;
        const cw = document.getElementById('azColoringWrap');
        cw?.classList.remove('az-done');
        cw?.querySelector('.az-complete-banner')?.remove();
        cw?.querySelectorAll('.fillable').forEach(p => p.setAttribute('fill', '#FFF'));
        state.paintHistory = [];
        speak('다시 색칠해봐!');
      } else {
        state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
        speak('깨끗하게 지웠어!');
      }
    };

    document.getElementById('azDone').onclick = () => {
      state.options.fireConfetti?.();
      state.options.gainExp?.(state.tab === 'coloring' ? 20 : 10);
      speak('우와! 정말 멋진 그림이야! 전시회에 걸어볼게!', true);
      showArtExhibition();
    };

    const canvas = state.canvas;
    const getPos = (e) => {
      const r = canvas.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: cx - r.left, y: cy - r.top };
    };
    const drawStart = (e) => {
      if (state.tab !== 'free') return;
      const pos = getPos(e);
      if (state.activeStamp) { placeStamp(pos.x, pos.y); return; }
      state.isDrawing = true;
      state.ctx.beginPath();
      state.ctx.moveTo(pos.x, pos.y);
    };
    const drawMove = (e) => {
      if (!state.isDrawing || state.tab !== 'free' || state.activeStamp) return;
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
        state.ctx.strokeStyle = `hsl(${state.hue},90%,60%)`;
        if (Math.random() > 0.82) createMagicParticle(pos.x, pos.y, '✨');
      } else {
        state.ctx.strokeStyle = state.currentColor;
      }
      state.ctx.lineWidth = state.currentSize;
      state.ctx.lineTo(pos.x, pos.y);
      state.ctx.stroke();
    };
    canvas.addEventListener('mousedown', drawStart);
    canvas.addEventListener('mousemove', drawMove);
    window.addEventListener('mouseup', () => { state.isDrawing = false; });
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); drawStart(e); }, { passive: false });
    canvas.addEventListener('touchmove',  (e) => { e.preventDefault(); drawMove(e); },  { passive: false });
  }

  /* ── Tab switch ──────────────────────────── */
  function switchTab(tab) {
    state.tab  = tab;
    state.mode = 'free';
    state.activeStamp       = null;
    state.coloringCompleted = false;

    const isFree = tab === 'free';
    document.getElementById('azCanvas').style.display       = isFree ? 'block' : 'none';
    document.getElementById('azColoringWrap').style.display = isFree ? 'none'  : 'flex';
    document.getElementById('azThemeRow').style.display     = isFree ? 'flex'  : 'none';
    document.getElementById('azTplRow').style.display       = isFree ? 'none'  : 'flex';
    document.getElementById('azUndo').style.display         = isFree ? 'none'  : 'block';

    state.container.querySelectorAll('.az-free-only').forEach(el => {
      el.style.display = isFree ? '' : 'none';
    });

    if (!isFree) {
      const tpl = COLORING_TEMPLATES.find(t => t.id === state.activeTemplateId);
      renderColoringTemplate(tpl);
      speak('어떤 그림 색칠해볼까?');
    } else {
      speak('자유롭게 그려봐!');
    }
  }

  /* ── Coloring ────────────────────────────── */
  function renderColoringTemplate(tpl) {
    if (!tpl) return;
    const wrap = document.getElementById('azColoringWrap');
    if (!wrap) return;

    state.paintHistory      = [];
    state.coloringCompleted = false;
    wrap.classList.remove('az-done');
    wrap.querySelector('.az-complete-banner')?.remove();

    const pathsHtml = tpl.parts.map(p =>
      `<path class="fillable" data-pid="${p.id}" data-label="${p.label}"
        d="${p.d}" fill="#FFF" stroke="${p.stroke}" stroke-width="${p.sw}"
        stroke-linecap="round" stroke-linejoin="round"/>`
    ).join('');
    wrap.innerHTML = `<svg viewBox="${tpl.viewBox}" xmlns="http://www.w3.org/2000/svg">${pathsHtml}</svg>`;

    wrap.querySelectorAll('.fillable').forEach(path => {
      const applyFill = (cx, cy) => {
        const fillColor = state.isRainbow
          ? `hsl(${(state.hue = (state.hue + 35) % 360)},90%,55%)`
          : state.currentColor;
        const prev = path.getAttribute('fill');
        if (prev === fillColor) return;
        state.paintHistory.push({ el: path, prev });
        path.setAttribute('fill', fillColor);
        burstSparkles(cx, cy);
        if (navigator.vibrate) navigator.vibrate(25);
        timer(() => checkColoringComplete(tpl), 420);
      };

      path.addEventListener('click', (e) => applyFill(e.clientX, e.clientY));
      path.addEventListener('touchend', (e) => {
        e.preventDefault();
        const t = e.changedTouches[0];
        if (t) applyFill(t.clientX, t.clientY);
      }, { passive: false });
    });
  }

  function checkColoringComplete(tpl) {
    if (state.coloringCompleted || state.tab !== 'coloring') return;
    const wrap = document.getElementById('azColoringWrap');
    if (!wrap) return;

    const allDone = Array.from(wrap.querySelectorAll('.fillable')).every(p => {
      const f = p.getAttribute('fill') || '';
      return f !== '' && f !== '#FFF' && f !== '#fff' && f !== 'white' && f !== 'none';
    });
    if (!allDone) return;

    state.coloringCompleted = true;
    wrap.classList.add('az-done');

    speak(`우와! 예쁜 ${tpl.name} 완성! 시현이 최고!`, true);
    state.options.fireConfetti?.();
    state.options.gainExp?.(20);

    timer(() => {
      const cw = document.getElementById('azColoringWrap');
      if (!cw || cw.querySelector('.az-complete-banner')) return;
      const banner = document.createElement('div');
      banner.className = 'az-complete-banner';
      banner.innerHTML = `
        <button class="az-complete-btn retry">다시 색칠하기 🔄</button>
        <button class="az-complete-btn next">다음 그림 🌈</button>
      `;
      banner.querySelector('.retry').onclick = () => {
        state.coloringCompleted = false;
        cw.classList.remove('az-done');
        banner.remove();
        cw.querySelectorAll('.fillable').forEach(p => p.setAttribute('fill', '#FFF'));
        state.paintHistory = [];
        speak('다시 해보자!');
      };
      banner.querySelector('.next').onclick = () => {
        const idx  = COLORING_TEMPLATES.findIndex(t => t.id === state.activeTemplateId);
        const next = COLORING_TEMPLATES[(idx + 1) % COLORING_TEMPLATES.length];
        state.activeTemplateId  = next.id;
        state.coloringCompleted = false;
        state.container.querySelectorAll('[data-tpl]').forEach(b => {
          b.classList.toggle('active', b.dataset.tpl === next.id);
        });
        renderColoringTemplate(next);
        speak(`${next.name} 색칠해보자!`);
      };
      cw.appendChild(banner);
    }, 820);
  }

  /* ── Particles ───────────────────────────── */
  function burstSparkles(clientX, clientY) {
    const wrap = document.getElementById('azCanvasWrap');
    if (!wrap) return;
    const rect  = wrap.getBoundingClientRect();
    const px    = clientX - rect.left;
    const py    = clientY - rect.top;
    const chars = ['⭐', '✨', '💫', '🌟', '⭐'];
    const count = 4 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const el    = document.createElement('div');
      el.className = 'az-sparkle';
      const angle  = (i / count) * 2 * Math.PI;
      const dist   = 48 + Math.random() * 30;
      el.textContent = chars[i % chars.length];
      el.style.setProperty('--sx', `${px}px`);
      el.style.setProperty('--sy', `${py}px`);
      el.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
      el.style.setProperty('--ty', `${Math.sin(angle) * dist - 18}px`);
      el.style.animationDelay = `${i * 40}ms`;
      wrap.appendChild(el);
      timer(() => el.remove(), 750);
    }
  }

  function createMagicParticle(x, y, char) {
    const wrap = document.getElementById('azCanvasWrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'az-particle';
    el.textContent = char || '✨';
    el.style.left = `${x}px`;
    el.style.top  = `${y}px`;
    wrap.appendChild(el);
    timer(() => el.remove(), 820);
  }

  /* ── Free drawing helpers ────────────────── */
  function placeStamp(x, y) {
    state.ctx.save();
    state.ctx.font = '68px serif';
    state.ctx.textAlign    = 'center';
    state.ctx.textBaseline = 'middle';
    state.ctx.fillText(state.activeStamp, x, y);
    state.ctx.restore();
    showStampPop(x, y, state.activeStamp);
    createMagicParticle(x, y, state.activeStamp);
    if (navigator.vibrate) navigator.vibrate(45);
  }

  function showStampPop(x, y, stamp) {
    const wrap = document.getElementById('azCanvasWrap');
    if (!wrap || !stamp) return;
    const el = document.createElement('div');
    el.className = 'az-stamp-pop';
    el.textContent = stamp;
    el.style.left = `${x}px`;
    el.style.top  = `${y}px`;
    wrap.appendChild(el);
    timer(() => el.remove(), 520);
  }

  /* ── Art Exhibition ──────────────────────── */
  async function buildSnapshot() {
    const w = state.canvas?.width  || 600;
    const h = state.canvas?.height || 600;
    const out = document.createElement('canvas');
    out.width  = w;
    out.height = h;
    const ctx = out.getContext('2d');
    if (!ctx) return '';

    if (state.tab === 'free') {
      ctx.fillStyle = THEMES[state.activeTheme]?.color || '#fff';
      ctx.fillRect(0, 0, w, h);
      if (state.canvas) ctx.drawImage(state.canvas, 0, 0);
    } else {
      ctx.fillStyle = '#fff8f2';
      ctx.fillRect(0, 0, w, h);
      const svg = document.getElementById('azColoringWrap')?.querySelector('svg');
      if (svg) await drawSvgToCanvas(ctx, svg, w, h);
    }
    return out.toDataURL('image/png');
  }

  function drawSvgToCanvas(ctx, svg, w, h) {
    return new Promise(resolve => {
      try {
        const clone = svg.cloneNode(true);
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.setAttribute('width',  String(w));
        clone.setAttribute('height', String(h));
        const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' });
        const url  = URL.createObjectURL(blob);
        const img  = new Image();
        img.onload  = () => { ctx.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url); resolve(); };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
        img.src = url;
      } catch { resolve(); }
    });
  }

  async function showArtExhibition() {
    const root = state.container?.querySelector('.az-root');
    if (!root) return;
    root.querySelector('.az-exhibit-overlay')?.remove();
    const dataUrl = await buildSnapshot();
    const overlay = document.createElement('div');
    overlay.className = 'az-exhibit-overlay';
    overlay.innerHTML = `
      <div class="az-exhibit-card" role="dialog">
        <div class="az-exhibit-title">🖼️ 시현이 그림 전시회</div>
        <div class="az-exhibit-frame">
          <img src="${dataUrl}" alt="시현이가 완성한 그림">
        </div>
        <div class="az-exhibit-actions">
          <button type="button" class="az-exhibit-btn" data-action="continue">계속 그리기</button>
          <button type="button" class="az-exhibit-btn" data-action="restart">다시 그리기</button>
          <button type="button" class="az-exhibit-btn primary" data-action="home">게임랜드 👋</button>
        </div>
      </div>
    `;
    root.appendChild(overlay);

    overlay.querySelector('[data-action="continue"]').onclick = () => {
      overlay.remove();
      speak('조금 더 꾸며보자!', true);
    };
    overlay.querySelector('[data-action="restart"]').onclick = () => {
      overlay.remove();
      if (state.tab === 'coloring') {
        const tpl = COLORING_TEMPLATES.find(t => t.id === state.activeTemplateId);
        renderColoringTemplate(tpl);
      } else {
        state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
        applyThemeBg();
      }
      speak('새 그림 시작!', true);
    };
    overlay.querySelector('[data-action="home"]').onclick = () => {
      overlay.remove();
      state.options.closeToParkHome?.();
    };
  }

  /* ── TTS / Destroy ───────────────────────── */
  function speak(msg, force = false) {
    if (state.options.speakGuide) state.options.speakGuide(msg, force);
  }

  function destroy() {
    clearTimers();
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    if (state.container) state.container.innerHTML = '';
    state.destroyed = true;
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
})();
