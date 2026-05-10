/**
 * 시현이 놀이터 OS — 매직 그림판 v3.1
 * 자유 그리기 + 색칠 팡팡 (SVG inline fill 방식)
 */
(function () {
  const GAME_KEY = 'artZone';
  const STYLE_ID = 'sihyeon-art-v3-style';

  /* ── 팔레트 / 도장 / 테마 ─────────────────── */
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

  /* ── 색칠 팡팡 템플릿 ─────────────────────── */
  const COLORING_TEMPLATES = [
    {
      id: 'police',
      name: '경찰차',
      emoji: '🚓',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" d="M 30 90 L 30 60 C 30 50, 50 40, 70 40 L 130 40 C 150 40, 170 50, 170 60 L 170 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 50 40 L 70 20 L 130 20 L 150 40 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 90 20 L 90 10 L 110 10 L 110 20 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 70 25 L 95 25 L 95 40 L 55 40 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 105 25 L 130 25 L 145 40 L 105 40 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="60" cy="90" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="60" cy="90" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="140" cy="90" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="140" cy="90" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
      </svg>`
    },
    {
      id: 'ambulance',
      name: '구급차',
      emoji: '🚑',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" d="M 20 90 L 20 30 L 120 30 L 120 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 120 90 L 120 50 L 160 50 L 180 70 L 180 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 60 50 L 80 50 L 80 40 L 90 40 L 90 50 L 110 50 L 110 60 L 90 60 L 90 70 L 80 70 L 80 60 L 60 60 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 40 30 L 40 20 L 60 20 L 60 30 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 130 55 L 155 55 L 170 70 L 130 70 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="50" cy="90" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="50" cy="90" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="150" cy="90" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="150" cy="90" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
      </svg>`
    },
    {
      id: 'firetruck',
      name: '소방차',
      emoji: '🚒',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" d="M 20 90 L 20 40 L 130 40 L 130 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 130 90 L 130 50 L 170 50 C 180 50, 185 60, 185 70 L 185 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 30 30 L 120 30 L 120 20 L 30 20 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <line x1="45" y1="20" x2="45" y2="30" stroke="#333" stroke-width="4"/>
        <line x1="65" y1="20" x2="65" y2="30" stroke="#333" stroke-width="4"/>
        <line x1="85" y1="20" x2="85" y2="30" stroke="#333" stroke-width="4"/>
        <line x1="105" y1="20" x2="105" y2="30" stroke="#333" stroke-width="4"/>
        <path class="fillable" d="M 140 50 L 140 40 L 160 40 L 160 50 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 140 55 L 165 55 C 170 55, 175 60, 175 70 L 140 70 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="45" cy="90" r="14" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="85" cy="90" r="14" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="155" cy="90" r="14" stroke="#333" stroke-width="4" fill="#FFF"/>
      </svg>`
    },
    {
      id: 'excavator',
      name: '포크레인',
      emoji: '🚧',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" x="30" y="90" width="80" height="24" rx="12" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="45" cy="102" r="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="70" cy="102" r="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="95" cy="102" r="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" d="M 40 90 L 40 50 L 100 50 L 100 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 45 55 L 75 55 L 75 85 L 45 85 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 85 70 L 140 30 L 150 40 L 95 80 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 135 30 L 170 70 L 160 80 L 125 40 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 160 75 L 180 75 L 190 105 L 150 105 L 155 85 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      </svg>`
    },
  {
    id: 'rocket',
    name: '우주 로켓',
    svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
      <path class="fillable" d="M 80 80 L 50 120 L 80 110 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <path class="fillable" d="M 120 80 L 150 120 L 120 110 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <path class="fillable" d="M 100 20 C 130 50, 125 110, 100 120 C 75 110, 70 50, 100 20 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <circle class="fillable" cx="100" cy="65" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
      <circle class="fillable" cx="100" cy="65" r="8" stroke="#333" stroke-width="4" fill="#FFF"/>
      <path class="fillable" d="M 85 120 L 100 145 L 115 120 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
    </svg>`
  },
  {
    id: 'dino',
    name: '공룡',
    svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
      <path class="fillable" d="M 120 90 L 170 110 L 130 115 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <rect class="fillable" x="65" y="100" width="15" height="30" rx="5" stroke="#333" stroke-width="4" fill="#FFF"/>
      <rect class="fillable" x="85" y="100" width="15" height="30" rx="5" stroke="#333" stroke-width="4" fill="#FFF"/>
      <rect class="fillable" x="110" y="100" width="15" height="30" rx="5" stroke="#333" stroke-width="4" fill="#FFF"/>
      <rect class="fillable" x="130" y="100" width="15" height="30" rx="5" stroke="#333" stroke-width="4" fill="#FFF"/>
      <ellipse class="fillable" cx="105" cy="90" rx="35" ry="25" stroke="#333" stroke-width="4" fill="#FFF"/>
      <path class="fillable" d="M 80 80 Q 60 50, 60 30 L 40 30 Q 40 10, 60 15 Q 75 15, 75 30 Q 80 50, 100 70 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <circle cx="55" cy="22" r="3" fill="#333"/>
    </svg>`
  },
  {
    id: 'train',
    name: '칙칙폭폭 기차',
    svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
      <path class="fillable" d="M 30 110 L 30 50 L 80 50 L 80 110 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <path class="fillable" d="M 20 50 L 90 50 L 90 35 L 20 35 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <path class="fillable" d="M 80 110 L 80 65 L 150 65 L 150 110 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <path class="fillable" d="M 150 110 L 170 110 L 150 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <path class="fillable" d="M 120 65 L 120 35 L 145 35 L 145 65 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <rect class="fillable" x="45" y="65" width="20" height="25" stroke="#333" stroke-width="4" fill="#FFF"/>
      <circle class="fillable" cx="55" cy="115" r="15" stroke="#333" stroke-width="4" fill="#FFF"/>
      <circle class="fillable" cx="100" cy="115" r="15" stroke="#333" stroke-width="4" fill="#FFF"/>
      <circle class="fillable" cx="135" cy="115" r="10" stroke="#333" stroke-width="4" fill="#FFF"/>
      <circle class="fillable" cx="132" cy="20" r="10" stroke="#333" stroke-width="4" fill="#FFF"/>
      <circle class="fillable" cx="115" cy="10" r="7" stroke="#333" stroke-width="4" fill="#FFF"/>
    </svg>`
  },
  {
    id: 'airplane',
    name: '슈웅 비행기',
    svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
      <path class="fillable" d="M 30 75 L 10 40 L 60 65 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <path class="fillable" d="M 30 75 L 10 110 L 60 85 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <path class="fillable" d="M 20 75 C 20 50, 150 40, 180 75 C 150 110, 20 100, 20 75 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <path class="fillable" d="M 80 60 L 130 15 L 140 60 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <path class="fillable" d="M 80 90 L 110 135 L 140 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <path class="fillable" d="M 150 65 C 160 65, 170 70, 170 75 C 170 80, 160 85, 150 85 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <circle class="fillable" cx="120" cy="75" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
      <circle class="fillable" cx="95" cy="75" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
      <circle class="fillable" cx="70" cy="75" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
    </svg>`
  },
  {
    id: 'lion',
    name: '어흥 사자',
    svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
      <path d="M 140 90 Q 170 70, 175 45" stroke="#333" stroke-width="4" fill="none"/>
      <circle class="fillable" cx="175" cy="45" r="8" stroke="#333" stroke-width="4" fill="#FFF"/>
      <rect class="fillable" x="65" y="95" width="16" height="30" rx="5" stroke="#333" stroke-width="4" fill="#FFF"/>
      <rect class="fillable" x="85" y="95" width="16" height="30" rx="5" stroke="#333" stroke-width="4" fill="#FFF"/>
      <rect class="fillable" x="115" y="95" width="16" height="30" rx="5" stroke="#333" stroke-width="4" fill="#FFF"/>
      <rect class="fillable" x="135" y="95" width="16" height="30" rx="5" stroke="#333" stroke-width="4" fill="#FFF"/>
      <ellipse class="fillable" cx="110" cy="85" rx="40" ry="25" stroke="#333" stroke-width="4" fill="#FFF"/>
      <path class="fillable" d="M 60 20 C 80 15, 100 30, 105 50 C 115 70, 105 95, 80 105 C 50 115, 25 95, 20 70 C 15 45, 35 25, 60 20 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <circle class="fillable" cx="65" cy="65" r="22" stroke="#333" stroke-width="4" fill="#FFF"/>
      <circle class="fillable" cx="48" cy="48" r="7" stroke="#333" stroke-width="4" fill="#FFF"/>
      <circle class="fillable" cx="82" cy="48" r="7" stroke="#333" stroke-width="4" fill="#FFF"/>
      <circle cx="58" cy="60" r="3" fill="#333"/>
      <circle cx="72" cy="60" r="3" fill="#333"/>
      <polygon points="62,68 68,68 65,73" fill="#333"/>
      <path d="M 65 73 Q 60 80, 55 77" stroke="#333" stroke-width="3" fill="none"/>
      <path d="M 65 73 Q 70 80, 75 77" stroke="#333" stroke-width="3" fill="none"/>
    </svg>`
  },
  {
    id: 'whale',
    name: '고래',
    svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
      <path class="fillable" d="M 120 60 Q 100 30, 90 40 Q 80 50, 110 60 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <path class="fillable" d="M 130 60 Q 150 20, 165 35 Q 180 50, 140 60 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <line x1="125" y1="30" x2="125" y2="60" stroke="#333" stroke-width="4"/>
      <path class="fillable" d="M 40 100 L 10 70 C 20 90, 20 110, 10 130 L 40 100 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <path class="fillable" d="M 40 100 C 40 50, 180 40, 180 100 C 180 140, 80 140, 40 100 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <path class="fillable" d="M 110 110 Q 130 140, 150 120 Q 130 110, 110 110 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <circle cx="155" cy="85" r="5" fill="#333"/>
      <path d="M 180 100 Q 165 115, 145 105" stroke="#333" stroke-width="4" fill="none"/>
    </svg>`
  },
  {
    id: 'icecream',
    name: '아이스크림',
    svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
      <path class="fillable" d="M 75 90 L 100 140 L 125 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <line x1="85" y1="95" x2="105" y2="130" stroke="#333" stroke-width="3"/>
      <line x1="115" y1="95" x2="95" y2="130" stroke="#333" stroke-width="3"/>
      <circle class="fillable" cx="100" cy="70" r="30" stroke="#333" stroke-width="4" fill="#FFF"/>
      <circle class="fillable" cx="100" cy="35" r="10" stroke="#333" stroke-width="4" fill="#FFF"/>
      <path d="M 100 25 Q 110 15, 120 20" stroke="#333" stroke-width="3" fill="none"/>
    </svg>`
  }
  ];

  /* ── State ───────────────────────────────── */
  const state = {
    container: null, options: {},
    tab: 'free',   // 'free' | 'coloring'
    mode: 'free',  // 'free' | 'eraser'
    canvas: null, ctx: null,
    isDrawing: false, currentColor: '#FF4444', currentSize: 15,
    isRainbow: false, hue: 0,
    activeTheme: 'white', activeStamp: null,
    paintHistory: [],
    activeTemplateId: 'police',
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

      /* header */
      .az-header{display:flex;flex-direction:column;background:#fff;border-bottom:5px solid #FF7A1A;}
      .az-mode-tabs{display:flex;padding:10px 12px 8px;gap:10px;justify-content:center;}
      .az-mode-tab{padding:11px 26px;border-radius:24px;border:3px solid #ddd;background:#f9f9f9;font-weight:800;font-size:17px;cursor:pointer;transition:all .2s;}
      .az-mode-tab.active{background:#FF7A1A;color:#fff;border-color:#FF7A1A;transform:scale(1.05);}
      .az-sub-row{display:flex;gap:10px;padding:4px 12px 10px;overflow-x:auto;scrollbar-width:none;}
      .az-cat-btn{flex-shrink:0;padding:7px 16px;border-radius:18px;border:3px solid #eee;background:#fff;font-size:15px;font-weight:800;cursor:pointer;transition:all .2s;}
      .az-cat-btn.active{border-color:#FF7A1A;color:#FF7A1A;box-shadow:0 4px 10px rgba(255,122,26,.2);}

      /* main canvas area */
      .az-main{flex:1;position:relative;padding:14px;display:flex;align-items:center;justify-content:center;min-height:0;}
      .az-canvas-wrap{position:relative;width:100%;height:100%;background:#fff;border:8px solid #333;border-radius:28px;box-shadow:0 18px 40px rgba(0,0,0,.14);overflow:hidden;transition:background .4s;}
      #azCanvas{width:100%;height:100%;display:block;}

      /* coloring SVG container */
      .az-coloring-wrap{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:14px;background:#fffbf5;}
      .az-coloring-wrap svg{width:100%;height:100%;overflow:visible;}
      .az-coloring-wrap .fillable{cursor:pointer;transition:fill .4s ease;pointer-events:fill;}
      .az-coloring-wrap .fillable:active{opacity:.75;}

      /* completion glow + bounce */
      .az-coloring-wrap.az-done svg{
        animation: az-glow-bounce .7s cubic-bezier(.2,1.4,.35,1) forwards;
        filter: drop-shadow(0 0 10px #FFD700) drop-shadow(0 0 22px #FF9800) drop-shadow(0 0 36px #FF5722);
      }
      @keyframes az-glow-bounce{
        0%   { transform: scale(1);    }
        40%  { transform: scale(1.12); }
        70%  { transform: scale(.97);  }
        100% { transform: scale(1.08); }
      }

      /* complete banner */
      .az-complete-banner{
        position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
        display:flex;gap:10px;z-index:200;white-space:nowrap;
        animation: az-banner-up .42s cubic-bezier(.2,1.4,.35,1) both;
      }
      @keyframes az-banner-up{
        from{opacity:0;transform:translateX(-50%) translateY(20px)}
        to  {opacity:1;transform:translateX(-50%) translateY(0)}
      }
      .az-cbtn{padding:13px 20px;border-radius:18px;border:none;font:inherit;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 5px 0 rgba(0,0,0,.15);}
      .az-cbtn.next {background:#FF7A1A;color:#fff;box-shadow:0 5px 0 #E65100;}
      .az-cbtn.retry{background:#fff;color:#555;}

      /* footer */
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

      /* particles */
      .az-sparkle{
        position:absolute;pointer-events:none;font-size:22px;z-index:200;
        animation: az-sparkle-burst .65s forwards;
      }
      @keyframes az-sparkle-burst{
        0%  {opacity:1; transform:translate(var(--sx),var(--sy)) scale(1.3);}
        100%{opacity:0; transform:translate(calc(var(--sx) + var(--tx,0px)), calc(var(--sy) + var(--ty,-55px))) scale(.2);}
      }
      .az-particle{position:absolute;pointer-events:none;font-size:26px;z-index:200;animation:az-pop .8s forwards;}
      @keyframes az-pop{0%{transform:scale(0) rotate(0deg);opacity:1}100%{transform:scale(1.5) rotate(180deg) translateY(-75px);opacity:0}}
      .az-stamp-pop{position:absolute;z-index:220;pointer-events:none;font-size:72px;line-height:1;transform:translate(-50%,-50%) scale(.4) rotate(-10deg);animation:az-stamp-pop .48s cubic-bezier(.2,1.5,.35,1) forwards;}
      @keyframes az-stamp-pop{0%{opacity:0;transform:translate(-50%,-50%) scale(.3) rotate(-12deg)}38%{opacity:1;transform:translate(-50%,-50%) scale(1.25) rotate(5deg)}68%{transform:translate(-50%,-50%) scale(.95) rotate(-2deg)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.06) rotate(0)}}

      /* exhibition overlay */
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
    state.container         = container;
    state.options           = options;
    state.tab               = 'free';
    state.mode              = 'free';
    state.paintHistory      = [];
    state.coloringCompleted = false;
    state.activeStamp       = null;
    state.destroyed         = false;
    injectStyle();

    container.innerHTML = `
      <div class="az-root">
        <div class="az-header">
          <div class="az-mode-tabs">
            <button class="az-mode-tab active" data-tab="free">🎨 자유 그리기</button>
            <button class="az-mode-tab"        data-tab="coloring">🌈 색칠 팡팡</button>
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
            <div class="az-coloring-wrap" id="azColoringWrap"></div>
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
              <button class="az-size-btn"       data-size="6">작음</button>
              <button class="az-size-btn active" data-size="16">중간</button>
              <button class="az-size-btn"       data-size="32">크다</button>
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

  /* ── Canvas init ─────────────────────────── */
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

  /* ── Event binding ───────────────────────── */
  function bindEvents() {
    const root = state.container.querySelector('.az-root');

    // tab switch
    root.querySelectorAll('.az-mode-tab').forEach(btn => {
      btn.onclick = () => {
        root.querySelectorAll('.az-mode-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        switchTab(btn.dataset.tab);
      };
    });

    // background theme (free mode)
    root.querySelectorAll('[data-theme]').forEach(btn => {
      btn.onclick = () => {
        state.activeTheme = btn.dataset.theme;
        root.querySelectorAll('[data-theme]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyThemeBg();
        speak(THEMES[state.activeTheme].label + ' 테마야!');
      };
    });

    // coloring template picker
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

    // color palette — TTS on select
    root.querySelectorAll('.az-color-circle').forEach(btn => {
      btn.onclick = () => {
        const c = btn.dataset.color;
        state.isRainbow = (c === 'rainbow');
        state.activeStamp = null;
        if (!state.isRainbow) state.currentColor = c;
        if (state.mode === 'eraser') state.mode = 'free';
        root.querySelectorAll('.az-color-circle, .az-stamp-circle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        speak(btn.dataset.name + '!');
        if (navigator.vibrate) navigator.vibrate(25);
      };
    });

    // stamps
    root.querySelectorAll('.az-stamp-circle').forEach(btn => {
      btn.onclick = () => {
        state.activeStamp = btn.dataset.stamp;
        state.isRainbow   = false;
        root.querySelectorAll('.az-color-circle, .az-stamp-circle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        speak('도장 준비!');
      };
    });

    // brush size
    root.querySelectorAll('.az-size-btn').forEach(btn => {
      btn.onclick = () => {
        state.currentSize = parseInt(btn.dataset.size);
        root.querySelectorAll('.az-size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });

    // eraser
    document.getElementById('azEraser').onclick = () => {
      state.mode = 'eraser';
      state.activeStamp = null;
      speak('지우개로 슥싹!');
    };

    // undo
    document.getElementById('azUndo').onclick = () => {
      const last = state.paintHistory.pop();
      if (last) last.el.setAttribute('fill', last.prev);
    };

    // clear
    document.getElementById('azClear').onclick = () => {
      if (state.tab === 'coloring') {
        const cw = document.getElementById('azColoringWrap');
        state.coloringCompleted = false;
        cw?.classList.remove('az-done');
        cw?.querySelector('.az-complete-banner')?.remove();
        cw?.querySelectorAll('.fillable').forEach(el => el.setAttribute('fill', '#FFF'));
        state.paintHistory = [];
        speak('다시 색칠해봐!');
      } else {
        state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
        speak('깨끗하게 지웠어!');
      }
    };

    // done → exhibition
    document.getElementById('azDone').onclick = () => {
      state.options.fireConfetti?.();
      state.options.gainExp?.(state.tab === 'coloring' ? 20 : 10);
      speak('우와! 정말 멋진 그림이야! 전시회에 걸어볼게!', true);
      showArtExhibition();
    };

    // canvas draw events (free mode only)
    const canvas = state.canvas;
    const getPos = (e) => {
      const r  = canvas.getBoundingClientRect();
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

  /* ── Coloring template ───────────────────── */
  function renderColoringTemplate(tpl) {
    if (!tpl) return;
    const wrap = document.getElementById('azColoringWrap');
    if (!wrap) return;

    state.paintHistory      = [];
    state.coloringCompleted = false;
    wrap.classList.remove('az-done');
    wrap.querySelector('.az-complete-banner')?.remove();

    // insert SVG string directly
    wrap.innerHTML = tpl.svg;

    // style the SVG to fill the container
    const svg = wrap.querySelector('svg');
    if (svg) {
      svg.style.cssText = 'width:100%;height:100%;overflow:visible;';
    }

    // bind fill events to every .fillable element (path, circle, rect, …)
    wrap.querySelectorAll('.fillable').forEach(el => {
      const applyFill = (cx, cy) => {
        const fillColor = state.isRainbow
          ? `hsl(${(state.hue = (state.hue + 35) % 360)},90%,55%)`
          : state.currentColor;
        const prev = el.getAttribute('fill');
        if (prev === fillColor) return;
        state.paintHistory.push({ el, prev });
        el.setAttribute('fill', fillColor);
        burstSparkles(cx, cy);
        if (navigator.vibrate) navigator.vibrate(25);
        timer(() => checkColoringComplete(tpl), 450);
      };

      el.addEventListener('click',    (e) => applyFill(e.clientX, e.clientY));
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        const t = e.changedTouches[0];
        if (t) applyFill(t.clientX, t.clientY);
      }, { passive: false });
    });
  }

  /* ── Completion check ────────────────────── */
  function checkColoringComplete(tpl) {
    if (state.coloringCompleted || state.tab !== 'coloring') return;
    const wrap = document.getElementById('azColoringWrap');
    if (!wrap) return;

    const allDone = Array.from(wrap.querySelectorAll('.fillable')).every(el => {
      const f = el.getAttribute('fill') || '';
      return f !== '' && f !== '#FFF' && f !== '#fff' && f !== 'white' && f !== 'none';
    });
    if (!allDone) return;

    state.coloringCompleted = true;
    wrap.classList.add('az-done');

    speak(`우와! ${tpl.name} 완성! 시현이 최고!`, true);
    state.options.fireConfetti?.();
    state.options.gainExp?.(20);

    timer(() => {
      const cw = document.getElementById('azColoringWrap');
      if (!cw || cw.querySelector('.az-complete-banner')) return;
      const banner = document.createElement('div');
      banner.className = 'az-complete-banner';
      banner.innerHTML = `
        <button class="az-cbtn retry">다시 색칠하기 🔄</button>
        <button class="az-cbtn next">다음 그림 🌈</button>
      `;
      banner.querySelector('.retry').onclick = () => {
        state.coloringCompleted = false;
        cw.classList.remove('az-done');
        banner.remove();
        cw.querySelectorAll('.fillable').forEach(el => el.setAttribute('fill', '#FFF'));
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
    }, 850);
  }

  /* ── burstSparkles ───────────────────────── */
  function burstSparkles(clientX, clientY) {
    const wrap = document.getElementById('azCanvasWrap');
    if (!wrap) return;
    const rect  = wrap.getBoundingClientRect();
    const px    = clientX - rect.left;
    const py    = clientY - rect.top;
    const chars = ['⭐', '✨', '💫', '🌟', '⭐'];
    const count = 4 + Math.floor(Math.random() * 2); // 4~5개
    for (let i = 0; i < count; i++) {
      const el    = document.createElement('div');
      el.className = 'az-sparkle';
      const angle  = (i / count) * 2 * Math.PI;
      const dist   = 50 + Math.random() * 28;
      el.textContent = chars[i % chars.length];
      el.style.setProperty('--sx', `${px}px`);
      el.style.setProperty('--sy', `${py}px`);
      el.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
      el.style.setProperty('--ty', `${Math.sin(angle) * dist - 20}px`);
      el.style.animationDelay = `${i * 40}ms`;
      wrap.appendChild(el);
      timer(() => el.remove(), 750);
    }
  }

  function createMagicParticle(x, y, char) {
    const wrap = document.getElementById('azCanvasWrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className   = 'az-particle';
    el.textContent = char || '✨';
    el.style.left  = `${x}px`;
    el.style.top   = `${y}px`;
    wrap.appendChild(el);
    timer(() => el.remove(), 820);
  }

  /* ── Free drawing helpers ────────────────── */
  function placeStamp(x, y) {
    state.ctx.save();
    state.ctx.font          = '68px serif';
    state.ctx.textAlign     = 'center';
    state.ctx.textBaseline  = 'middle';
    state.ctx.fillText(state.activeStamp, x, y);
    state.ctx.restore();
    showStampPop(x, y, state.activeStamp);
    createMagicParticle(x, y, state.activeStamp);
    if (navigator.vibrate) navigator.vibrate(45);
  }

  function showStampPop(x, y, stamp) {
    const wrap = document.getElementById('azCanvasWrap');
    if (!wrap || !stamp) return;
    const el       = document.createElement('div');
    el.className   = 'az-stamp-pop';
    el.textContent = stamp;
    el.style.left  = `${x}px`;
    el.style.top   = `${y}px`;
    wrap.appendChild(el);
    timer(() => el.remove(), 520);
  }

  /* ── Art Exhibition (snapshot) ───────────── */
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
      ctx.fillStyle = '#fffbf5';
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
          <button type="button" class="az-exhibit-btn primary" data-action="home">즐거운놀이터 👋</button>
        </div>
      </div>
    `;
    root.appendChild(overlay);
    overlay.querySelector('[data-action="continue"]').onclick = () => { overlay.remove(); speak('조금 더 꾸며보자!', true); };
    overlay.querySelector('[data-action="restart"]').onclick  = () => {
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
