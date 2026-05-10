/* ═══════════════════════════════════════════
   SIHYEON PLAY OS - NUMBER BLOCKS GAME MODULE
   js/games/number-blocks.js
   v5.0 — 4살 시현이 맞춤 (초거대 블록, 초강력 이펙트, 화려한 피날레)
═══════════════════════════════════════════ */

(function() {
  const GAME_KEY = 'numberBlocks';
  const STYLE_ID = 'sihyeon-number-blocks-style';

  // ★ 블록 메타데이터 (더 화려한 색상과 그림자)
  const BLOCK_META = {
    1: { color: 'blue',   gradient: 'radial-gradient(circle at 30% 30%, #a1c4fd, #2196F3)', shadow: '#0D47A1', name: '하나', w: 1, h: 1 },
    2: { color: 'red',    gradient: 'linear-gradient(135deg, #ff9a9e, #FF1744)',            shadow: '#B71C1C', name: '둘',   w: 2, h: 1 },
    3: { color: 'yellow', gradient: 'linear-gradient(135deg, #FFF59D, #FFC107)',            shadow: '#F57F17', name: '셋',   w: 1, h: 3 },
    4: { color: 'green',  gradient: 'linear-gradient(135deg, #B9F6CA, #00E676)',            shadow: '#1B5E20', name: '넷',   w: 2, h: 2 },
    5: { color: 'purple', gradient: 'linear-gradient(135deg, #E1BEE7, #D500F9)',            shadow: '#4A148C', name: '다섯', w: 5, h: 1, aura: true }
  };

  const BUILD_MISSIONS = [
    {
      id: 'house', title: '집 만들기', icon: '🏠', scene: '🌈', complete: '🏡', color: '#FF7A1A',
      guide: '시현아, 블록 세 개로 멋진 집을 만들어볼까?',
      completeText: '우와! 튼튼한 집 완성! 창문에 불이 반짝반짝!',
      steps: [
        { id: 'body', label: '네모 집', emoji: '🟦', say: '네모 집 쿵!' },
        { id: 'roof', label: '세모 지붕', emoji: '🔺', say: '세모 지붕 쿵!' },
        { id: 'door', label: '문', emoji: '🚪', say: '문까지 달면 완성!' }
      ],
      wrongs: [ { id: 'tree', label: '나무', emoji: '🌳' }, { id: 'cloud', label: '구름', emoji: '☁️' } ]
    },
    {
      id: 'train', title: '기차 만들기', icon: '🚂', scene: '🛤️', complete: '🚂', color: '#1E90FF',
      guide: '시현아, 칙칙폭폭 기차를 만들어볼까?',
      completeText: '기차 완성! 칙칙폭폭 출발해요! 빠아앙!',
      steps: [
        { id: 'engine', label: '기관차', emoji: '🚂', say: '기관차 쿵!' },
        { id: 'wheel', label: '바퀴', emoji: '⚙️', say: '바퀴 쿵!' },
        { id: 'car', label: '객차', emoji: '🚃', say: '객차까지 연결 완료!' }
      ],
      wrongs: [ { id: 'ship', label: '배', emoji: '⛵' }, { id: 'balloon', label: '풍선', emoji: '🎈' } ]
    },
    {
      id: 'rocket', title: '로켓 만들기', icon: '🚀', scene: '🌌', complete: '🚀', color: '#9C27B0',
      guide: '시현아, 우주로 가는 로켓을 만들어볼까?',
      completeText: '우와아! 로켓 완성! 우주로 슈우우웅~ 날아가요!',
      steps: [
        { id: 'body', label: '몸통', emoji: '🟪', say: '로켓 몸통 쿵!' },
        { id: 'wing', label: '날개', emoji: '🪽', say: '날개 쿵!' },
        { id: 'fire', label: '불꽃', emoji: '🔥', say: '불꽃 발사 준비 완료!' }
      ],
      wrongs: [ { id: 'moon', label: '달', emoji: '🌙' }, { id: 'star', label: '별', emoji: '⭐' } ]
    }
  ];

  const state = {
    container: null,
    options: {},
    mode: 'number',
    currentLevel: 1,
    targetNumber: 5,
    centerBlock: null,
    isAnimating: false,
    audioCtx: null,
    timers: [],
    buildRound: 0,
    buildMission: null,
    buildPlaced: [],
    buildPool: [],
    destroyed: false
  };

  // ─── 오디오 시스템 ───
  function initAudio() {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    if (!state.audioCtx) state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume().catch?.(() => {});
  }

  function setTimer(fn, delay) {
    const id = setTimeout(() => {
      state.timers = state.timers.filter((timerId) => timerId !== id);
      fn();
    }, delay);
    state.timers.push(id);
    return id;
  }

  function clearTimers() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
  }

  function playTone(type) {
    if (!state.audioCtx) return;
    const ctx = state.audioCtx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'pop') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1180, now + 0.14);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
      osc.start(now); osc.stop(now + 0.26);
    } else if (type === 'complete') { // 웅장한 화음
      [392, 523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + i * 0.1);
        g.gain.setValueAtTime(0.3, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.5);
        o.connect(g); g.connect(ctx.destination);
        o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.6);
      });
    }
  }

  function playBlockSound(val) {
    if (!state.audioCtx) return;
    const ctx = state.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    const freq = 200 + val * 100;
    osc.type = val === 5 ? 'sine' : val % 2 ? 'triangle' : 'square';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 2, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.start(now); osc.stop(now + 0.45);
  }

  function vibrate(pattern) {
    if (!navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch(e) {}
  }

  function speak(text, rate = 1.0) {
    const speakGuide = state.options && state.options.speakGuide;
    if (speakGuide) {
      speakGuide(text, true);
      return;
    }
    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'ko-KR';
    utt.rate = Math.min(rate, 0.94);
    utt.pitch = 1.08;
    speechSynthesis.speak(utt);
  }

  function shuffle(list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ─── 초호화 CSS 스타일 (크기, 빛, 이펙트 강화) ───
  function injectStyle() {
    const prev = document.getElementById(STYLE_ID);
    if (prev) prev.remove();
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .nb-root { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; background: linear-gradient(135deg, #1A237E 0%, #0D47A1 44%, #00838F 100%); font-family: 'Jua', sans-serif; position: relative; overflow: hidden; user-select: none; touch-action: none; color: #222; isolation: isolate; }
      
      /* 우주 배경 글로우 */
      .nb-bg-glow { position: absolute; inset: -20%; z-index: 0; background: radial-gradient(circle at 22% 18%, rgba(255,255,255,0.4), transparent 25%), radial-gradient(circle at 78% 24%, rgba(255,217,61,0.5), transparent 25%), radial-gradient(circle at 50% 72%, rgba(255,122,26,0.4), transparent 30%); animation: nbBgFloat 7s ease-in-out infinite alternate; pointer-events: none; }
      @keyframes nbBgFloat { from { transform: translate(-2%, 1%) scale(1); } to { transform: translate(2%, -2%) scale(1.08); } }
      
      .nb-stars { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
      .nb-star { position: absolute; width: 6px; height: 6px; background: #fff; border-radius: 50%; animation: nbTwinkle 2s infinite ease-in-out alternate; }
      .nb-star:nth-child(3n) { background: #FFF59D; width: 8px; height: 8px; }
      .nb-star:nth-child(4n) { background: #80DEEA; }
      @keyframes nbTwinkle { 0% { opacity: 0.2; transform: scale(0.6); } 100% { opacity: 1; transform: scale(1.8); box-shadow: 0 0 15px currentColor; } }

      /* 헤더 */
      .nb-header { position: relative; z-index: 30; width: 100%; display: flex; flex-direction: column; gap: 12px; padding: 12px 14px 8px; box-sizing: border-box; flex-shrink: 0; align-items: center; }
      .nb-mode-tabs { display: flex; gap: 15px; width: min(96vw, 600px); justify-content: center; }
      .nb-mode-tab { flex: 1; min-height: 85px; border-radius: 30px; border: 6px solid #fff; background: linear-gradient(180deg, #ffffff, #FFE082); box-shadow: 0 10px 0 rgba(0,0,0,0.2); font: inherit; font-size: clamp(20px, 5.5vw, 30px); font-weight: 900; color: #17324A; display: grid; place-items: center; cursor: pointer; touch-action: manipulation; transition: all 0.2s; }
      .nb-mode-tab.active { background: linear-gradient(180deg, #ffffff, #80DEEA); color: #004D40; transform: translateY(-4px); box-shadow: 0 14px 0 rgba(0,0,0,0.2), 0 0 20px rgba(128, 222, 234, 0.6); border-color: #E0F7FA; }
      .nb-mode-tab:active { transform: translateY(6px); box-shadow: 0 4px 0 rgba(0,0,0,0.2); }

      /* 보드 & 트레이 */
      .nb-stage { flex: 1; width: 100%; min-height: 0; position: relative; z-index: 10; display: flex; align-items: center; justify-content: center; perspective: 1000px; padding: 10px; }
      .nb-tray { width: 100%; z-index: 10; background: rgba(255,255,255,0.2); backdrop-filter: blur(15px); border-top: 6px solid rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center; gap: 20px; padding: 20px 10px calc(20px + env(safe-area-inset-bottom)); flex-wrap: wrap; box-shadow: 0 -10px 30px rgba(0,0,0,0.2); }

      /* ★ 초대형 화려한 숫자 블록 */
      .nb-block {
        position: relative; display: grid; place-items: center; border-radius: 28px; cursor: pointer;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s;
        /* 훨씬 더 크고 화려한 블록! */
        box-shadow: inset 4px 4px 15px rgba(255,255,255,0.8), inset -6px -6px 20px rgba(0,0,0,0.3), 0 15px 25px rgba(0,0,0,0.4);
        --sz: clamp(80px, 18vw, 120px); 
        border: 4px solid rgba(255,255,255,0.4);
      }
      .nb-block:active { transform: scale(0.9) !important; }
      
      /* 숫자가 적히는 면 */
      .nb-face { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: calc(var(--sz) * 0.85); font-weight: 900; color: #fff; text-shadow: 0 5px 15px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.5); pointer-events: none; }
      .nb-tray-item { width: clamp(100px, 25vw, 140px); height: clamp(100px, 25vw, 140px); display: flex; align-items: center; justify-content: center; }
      
      .nb-flying { position: fixed; z-index: 150; pointer-events: none; transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5)); }
      
      /* 오라 이펙트 (5번 블록) */
      .nb-aura { position: absolute; inset: -20px; border-radius: 40px; z-index: -1; background: conic-gradient(from 0deg, #FF1744, #FFEA00, #00E676, #00B0FF, #D500F9, #FF1744); animation: nbSpin 2s linear infinite; opacity: 0.8; filter: blur(15px); }
      @keyframes nbSpin { 100% { transform: rotate(360deg); } }

      /* ★ 메가 플래시 효과 (블록 합쳐질 때 화면 번쩍임) */
      .nb-mega-flash::after { content: ''; position: absolute; inset: 0; background: #fff; z-index: 999; animation: megaFlash 0.5s ease-out forwards; pointer-events: none; }
      @keyframes megaFlash { 0% { opacity: 0.8; } 100% { opacity: 0; } }

      /* 화면 흔들림 효과 */
      .nb-shake { animation: stageShake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
      @keyframes stageShake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-15px) rotate(-2deg); } 40% { transform: translateX(15px) rotate(2deg); } 60% { transform: translateX(-10px); } 80% { transform: translateX(10px); } }

      /* 파티클 & 팝 효과 강화 */
      .nb-particle { position: absolute; border-radius: 50%; pointer-events: none; animation: nbExplode 1s cubic-bezier(0.1, 0.8, 0.2, 1) forwards; z-index: 70; box-shadow: 0 0 10px currentColor; }
      .nb-emoji-pop { position: absolute; z-index: 80; pointer-events: none; font-size: clamp(60px, 18vw, 100px); font-weight: 900; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.4)); animation: nbEmojiPop 1.2s cubic-bezier(0.2, 1.35, 0.3, 1) forwards; }
      @keyframes nbExplode { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(var(--dx),var(--dy)) scale(0); opacity: 0; } }
      @keyframes nbEmojiPop { 0% { transform: translate(-50%,-50%) scale(0.2) rotate(-20deg); opacity: 0; } 30% { transform: translate(-50%,-80%) scale(1.5) rotate(10deg); opacity: 1; } 100% { transform: translate(-50%,-150%) scale(1) rotate(0); opacity: 0; } }

      /* 골든 링 (엄청 크게) */
      .nb-golden-ring { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 0; height: 0; border: 25px solid #FFD700; border-radius: 50%; opacity: 1; pointer-events: none; z-index: 5; animation: nbRingExpand 1.2s cubic-bezier(0.1, 0.8, 0.2, 1) forwards; box-shadow: 0 0 40px #FFD700, inset 0 0 40px #FFD700; }
      @keyframes nbRingExpand { 100% { width: 800px; height: 800px; opacity: 0; border-width: 2px; } }

      /* 타겟 블록 전용 (더 큼) */
      .nb-block.stage-block { --sz: clamp(100px, 24vw, 160px); animation: nbFloatStage 3s ease-in-out infinite alternate; z-index: 50; }
      @keyframes nbFloatStage { from { transform: translateY(-10px); } to { transform: translateY(10px); } }
      .nb-dance { animation: nbDanceAnim 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) !important; }
      @keyframes nbDanceAnim { 0% { transform: scale(1) rotate(0); } 30% { transform: scale(1.6) rotate(15deg); } 70% { transform: scale(1.6) rotate(-15deg); } 100% { transform: scale(1) rotate(360deg); } }

      /* 블록 만들기 (Build) 모드 스타일 */
      .nb-build-stage { position: relative; width: min(96vw, 750px); height: 100%; min-height: 350px; border-radius: 40px; border: 8px solid #fff; background: #fff; box-shadow: 0 20px 40px rgba(0,0,0,0.3), inset 0 5px 20px rgba(0,0,0,0.1); overflow: hidden; display: grid; grid-template-rows: auto 1fr auto; }
      .nb-build-sky { position: absolute; inset: 0; opacity: 0.8; pointer-events: none; transition: background 1s; }
      .nb-build-title { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; }
      .nb-build-pill { padding: 10px 20px; border-radius: 999px; border: 5px solid #fff; background: rgba(255,255,255,0.95); box-shadow: 0 8px 0 rgba(0,0,0,0.15); font-size: clamp(20px, 5.5vw, 30px); font-weight: 900; }
      
      .nb-build-scene { position: relative; z-index: 1; display: grid; place-items: center; min-height: 0; padding: 10px; }
      .nb-build-scene-emoji { font-size: clamp(110px, 32vw, 220px); filter: drop-shadow(0 20px 30px rgba(0,0,0,0.2)); transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
      
      .nb-build-slots { position: relative; z-index: 3; display: flex; justify-content: center; gap: 15px; padding: 0 15px 20px; }
      .nb-build-slot { flex: 1; max-width: 180px; min-height: clamp(100px, 25vw, 150px); border-radius: 30px; border: 6px dashed #ccc; background: rgba(255,255,255,0.6); display: grid; place-items: center; position: relative; box-shadow: inset 0 0 20px rgba(0,0,0,0.05); }
      .nb-build-slot.filled { border-style: solid; background: #fff; border-color: #FFD700; box-shadow: 0 10px 20px rgba(0,0,0,0.15); animation: nbSlotFill 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
      .nb-build-slot.wrong { animation: nbWrongShake 0.4s ease; border-color: #FF1744; background: #ffebee; }
      
      /* 슬롯 안의 조각 */
      .nb-build-piece { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; }
      .nb-build-piece-emoji { font-size: clamp(50px, 14vw, 80px); line-height: 1; filter: drop-shadow(0 8px 0 rgba(0,0,0,0.15)); }

      /* 빌드 모드 트레이 (카드를 엄청 크게) */
      .nb-build-tray { width: 100%; display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; padding: 15px; z-index: 10; background: rgba(255,255,255,0.25); border-top: 6px solid rgba(255,255,255,0.5); box-shadow: 0 -10px 30px rgba(0,0,0,0.2); }
      .nb-build-card { width: clamp(100px, 28vw, 150px); min-height: clamp(100px, 28vw, 150px); border-radius: 30px; border: 6px solid #fff; background: linear-gradient(180deg, #ffffff, #FFF9C4); box-shadow: 0 10px 0 rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
      .nb-build-card:active { transform: translateY(8px); box-shadow: 0 2px 0 rgba(0,0,0,0.15); }
      .nb-build-card.used { opacity: 0.3; filter: grayscale(1); transform: scale(0.9); pointer-events: none; }
      .nb-build-card .nb-build-piece-emoji { font-size: clamp(55px, 16vw, 90px); }

      /* 메가 완성 애니메이션 */
      .nb-build-mega-complete .nb-build-scene-emoji { animation: megaCompleteFloat 2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite alternate; filter: drop-shadow(0 0 40px #FFD700) drop-shadow(0 20px 30px rgba(0,0,0,0.3)); transform: scale(1.4); }
      @keyframes megaCompleteFloat { from { transform: scale(1.4) translateY(0) rotate(-3deg); } to { transform: scale(1.5) translateY(-20px) rotate(3deg); } }

      /* 성공 패널 */
      .nb-success-overlay { position: absolute; inset: 0; z-index: 999; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); display: grid; place-items: center; animation: nbFadeIn 0.3s; }
      .nb-success-box { width: min(92vw, 600px); border-radius: 40px; text-align: center; border: 10px solid #FFD700; background: #fff; padding: 40px 20px; display: grid; gap: 20px; box-shadow: 0 30px 60px rgba(0,0,0,0.4), inset 0 0 50px rgba(255,215,0,0.3); }
      .nb-success-icon { font-size: clamp(100px, 28vw, 160px); animation: nbSuccessFloat 1s ease-in-out infinite alternate; filter: drop-shadow(0 15px 15px rgba(0,0,0,0.2)); }
      .nb-success-title { font-size: clamp(36px, 10vw, 55px); font-weight: 900; color: #1A237E; margin: 0; }
      .nb-success-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 10px; }
      .nb-round-btn { min-height: 90px; border-radius: 35px; border: 6px solid #fff; box-shadow: 0 10px 0 rgba(0,0,0,0.2); font-size: clamp(30px, 8vw, 45px); cursor: pointer; }
      .nb-round-btn:active { transform: translateY(8px); box-shadow: 0 2px 0 rgba(0,0,0,0.2); }
      .nb-btn-green { background: #00E676; color: white; }
      .nb-btn-orange { background: #FF9100; color: white; }

      @keyframes nbSlotFill { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); } }
      @keyframes nbWrongShake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-15px) rotate(-5deg); } 40% { transform: translateX(15px) rotate(5deg); } 60% { transform: translateX(-10px); } 80% { transform: translateX(10px); } }
      
      @media(max-height: 600px) {
        .nb-mode-tab { min-height: 65px; border-radius: 20px; font-size: 20px; }
        .nb-header { padding: 5px; }
        .nb-tray { padding: 10px; min-height: 120px; }
        .nb-build-tray { padding: 10px; }
        .nb-build-card { min-height: 80px; }
      }
    `;
    document.head.appendChild(style);
  }

  function renderBgStars(root) {
    const starsDiv = document.createElement('div');
    starsDiv.className = 'nb-stars';
    for (let i = 0; i < 40; i += 1) {
      const s = document.createElement('div');
      s.className = 'nb-star';
      s.style.left = `${Math.random() * 100}%`;
      s.style.top = `${Math.random() * 100}%`;
      s.style.animationDelay = `${Math.random() * 2}s`;
      s.style.animationDuration = `${1 + Math.random() * 2}s`;
      starsDiv.appendChild(s);
    }
    root.appendChild(starsDiv);
  }

  function renderShell() {
    if (!state.container) return;
    state.container.innerHTML = `
      <div class="nb-root" id="mainRoot">
        <div class="nb-bg-glow"></div>
        <div class="nb-header">
          <div class="nb-mode-tabs">
            <button class="nb-mode-tab ${state.mode === 'number' ? 'active' : ''}" type="button" data-mode="number">🔢 숫자 만들기</button>
            <button class="nb-mode-tab ${state.mode === 'build' ? 'active' : ''}" type="button" data-mode="build">🏗️ 블록 만들기</button>
          </div>
        </div>
        <div class="nb-stage" id="nbStage"></div>
        <div class="nb-tray" id="nbTray"></div>
      </div>
    `;
    renderBgStars(state.container.querySelector('.nb-root'));
    state.container.querySelectorAll('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (state.isAnimating || state.mode === btn.dataset.mode) return;
        state.mode = btn.dataset.mode;
        restartCurrentMode(true);
      });
    });
  }

  function createBlockElement(value, isStage = false) {
    const meta = BLOCK_META[value] || BLOCK_META[1];
    const el = document.createElement('div');
    el.className = `nb-block ${isStage ? 'stage-block' : ''}`;
    el.dataset.val = value;
    el.style.background = meta.gradient;
    el.style.width = `calc(var(--sz) * ${meta.w})`;
    el.style.height = `calc(var(--sz) * ${meta.h})`;
    
    if (meta.aura) {
      const aura = document.createElement('div');
      aura.className = 'nb-aura';
      el.appendChild(aura);
    }
    const face = document.createElement('div');
    face.className = 'nb-face';
    face.textContent = value;
    el.appendChild(face);
    return el;
  }

  function createParticles(x, y, color, count = 40) {
    const stage = state.container?.querySelector('#nbStage');
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    for (let i = 0; i < count; i += 1) {
      const p = document.createElement('div');
      p.className = 'nb-particle';
      // 무지개 파티클 섞기
      p.style.background = i % 4 === 0 ? '#FFF59D' : i % 4 === 1 ? color : i % 4 === 2 ? '#FF1744' : '#00E676';
      p.style.left = `${x - stageRect.left}px`;
      p.style.top = `${y - stageRect.top}px`;
      const size = Math.random() * 25 + 15; // 파티클 엄청 큼
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 250 + 80; // 멀리 퍼짐
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      stage.appendChild(p);
      setTimer(() => p.remove(), 1100);
    }
  }

  function createEmojiPop(x, y, textOrEmoji) {
    const stage = state.container?.querySelector('#nbStage');
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'nb-emoji-pop';
    pop.textContent = textOrEmoji;
    pop.style.left = `${x - stageRect.left}px`;
    pop.style.top = `${y - stageRect.top}px`;
    stage.appendChild(pop);
    setTimer(() => pop.remove(), 1300);
  }

  function createGoldenRing(x, y) {
    const stage = state.container?.querySelector('#nbStage');
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    const ring = document.createElement('div');
    ring.className = 'nb-golden-ring';
    ring.style.left = `${x - stageRect.left}px`;
    ring.style.top = `${y - stageRect.top}px`;
    stage.appendChild(ring);
    setTimer(() => ring.remove(), 1300);
  }

  function flashScreen() {
    const root = state.container?.querySelector('#mainRoot');
    if (!root) return;
    root.classList.remove('nb-mega-flash', 'nb-shake');
    void root.offsetWidth; // reflow
    root.classList.add('nb-mega-flash', 'nb-shake');
  }

  function restartCurrentMode(announce) {
    clearTimers();
    state.centerBlock = null;
    state.isAnimating = false;
    if (state.mode === 'number') startNumberMode(announce);
    else startBuildMode(announce);
  }

  function startNumberMode(announce) {
    renderShell();
    state.currentLevel = 1;
    state.targetNumber = 5;
    state.centerBlock = null;
    setTimer(startNumberLevel, 300);
    if (announce) speak('시현아! 숫자를 합쳐서 5를 만들어볼까?', 0.94);
  }

  function startNumberLevel() {
    if (!state.container || state.destroyed || state.mode !== 'number') return;
    state.centerBlock = null;
    state.isAnimating = false;
    const tray = state.container.querySelector('#nbTray');
    const stage = state.container.querySelector('#nbStage');
    if (!tray || !stage) return;
    tray.className = 'nb-tray';
    tray.innerHTML = '';
    stage.innerHTML = '';

    let remaining = state.targetNumber;
    const pool = [];
    while (remaining > 0) {
      let v = Math.floor(Math.random() * 2) + 1;
      if (v > remaining) v = remaining;
      pool.push(v);
      remaining -= v;
    }
    shuffle(pool).forEach((val) => {
      const wrap = document.createElement('div');
      wrap.className = 'nb-tray-item';
      const block = createBlockElement(val, false);
      block.addEventListener('click', () => handleNumberBlockClick(block, val));
      wrap.appendChild(block);
      tray.appendChild(wrap);
    });
  }

  function handleNumberBlockClick(blockEl, val) {
    if (state.isAnimating || state.destroyed || state.mode !== 'number') return;
    initAudio();
    vibrate(60);
    playBlockSound(val);
    state.isAnimating = true;

    const rect = blockEl.getBoundingClientRect();
    const clone = blockEl.cloneNode(true);
    clone.className = 'nb-block nb-flying';
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.margin = '0';
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    document.body.appendChild(clone);
    blockEl.style.opacity = '0';
    blockEl.style.pointerEvents = 'none';

    const stage = state.container.querySelector('#nbStage');
    const stageRect = stage.getBoundingClientRect();
    const targetX = stageRect.left + stageRect.width / 2 - rect.width / 2;
    const targetY = stageRect.top + stageRect.height / 2 - rect.height / 2;
    
    requestAnimationFrame(() => {
      clone.style.left = `${targetX}px`;
      clone.style.top = `${targetY}px`;
      clone.style.transform = 'scale(1.5)'; // 날아갈 때 엄청 커짐
    });
    
    setTimer(() => {
      clone.remove();
      if (state.destroyed || state.mode !== 'number') return;
      processNumberMerge(val, stageRect.left + stageRect.width / 2, stageRect.top + stageRect.height / 2);
    }, 550);
  }

  function processNumberMerge(newVal, cx, cy) {
    const stage = state.container?.querySelector('#nbStage');
    if (!stage) return;
    
    if (state.centerBlock === null) {
      state.centerBlock = newVal;
      stage.appendChild(createBlockElement(newVal, true));
      createEmojiPop(cx, cy, '쿵!');
      speak(BLOCK_META[newVal].name, 1.1);
      state.isAnimating = false;
      return;
    }

    const oldVal = state.centerBlock;
    const sum = Math.min(state.targetNumber, oldVal + newVal);
    stage.innerHTML = '';
    state.centerBlock = sum;
    
    // ★ 초강력 합체 이펙트
    flashScreen();
    vibrate([100, 50, 200]);
    createParticles(cx, cy, BLOCK_META[sum].shadow, 45);
    createEmojiPop(cx, cy, '쾅!!💥');
    playBlockSound(sum);
    
    const mergedEl = createBlockElement(sum, true);
    mergedEl.style.transform = 'scale(0.2)';
    stage.appendChild(mergedEl);
    
    speak(`${BLOCK_META[oldVal].name}이랑 ${BLOCK_META[newVal].name} 합체! 그래서 ${BLOCK_META[sum].name}!`, 0.94);
    
    requestAnimationFrame(() => {
      mergedEl.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      mergedEl.style.transform = 'scale(1)';
    });
    
    setTimer(() => checkNumberWin(mergedEl, cx, cy), 1500);
  }

  function checkNumberWin(mergedEl, cx, cy) {
    if (state.destroyed || state.mode !== 'number') return;
    if (state.centerBlock === state.targetNumber) {
      state.isAnimating = true;
      mergedEl.classList.add('nb-dance');
      createGoldenRing(cx, cy);
      createParticles(cx, cy, '#FFD700', 60); // 엄청난 파티클
      vibrate([100, 60, 100, 60, 300]);
      state.options.fireConfetti?.();
      state.options.gainExp?.(40); // 보상 증가
      
      setTimer(() => showSuccessOverlay('🌟', '우와 대단해!', '시현이가 5를 만들었어!', () => startNumberMode(false)), 4000);
    } else {
      state.isAnimating = false;
    }
  }

  // ─── 블록 만들기 모드 ───
  function startBuildMode(announce) {
    renderShell();
    state.buildRound = 0;
    state.isAnimating = false;
    if (announce) speak('시현아, 순서대로 블록을 올려서 예쁘게 만들어볼까?', 0.94);
    setTimer(startBuildRound, 300);
  }

  function startBuildRound() {
    if (!state.container || state.destroyed || state.mode !== 'build') return;
    if (state.buildRound >= BUILD_MISSIONS.length) {
      showSuccessOverlay('🏆', '최고의 건축가!', '집, 기차, 로켓을 모두 멋지게 만들었어!', () => startBuildMode(false));
      state.options.fireConfetti?.();
      state.options.gainExp?.(50);
      return;
    }

    state.buildMission = BUILD_MISSIONS[state.buildRound];
    state.buildPlaced = new Array(state.buildMission.steps.length).fill(null);
    state.buildPool = shuffle([...state.buildMission.steps.map((s) => ({ ...s, correct: true })), ...state.buildMission.wrongs.map((w) => ({ ...w, correct: false }))]);
    state.isAnimating = false;
    drawBuildRound();
    speak(state.buildMission.guide, 1.0);
  }

  function drawBuildRound() {
    const tray = state.container?.querySelector('#nbTray');
    const stage = state.container?.querySelector('#nbStage');
    const mission = state.buildMission;
    if (!tray || !stage || !mission) return;
    
    tray.className = 'nb-build-tray';
    const isComplete = state.buildPlaced.every(Boolean);
    
    stage.innerHTML = `
      <div class="nb-build-stage ${isComplete ? `nb-build-mega-complete ${mission.id}` : ''}">
        <div class="nb-build-sky" style="background:linear-gradient(180deg, ${mission.color}55 0%, #fff6bd 62%, #9cf28a 100%)"></div>
        <div class="nb-build-title">
          <div class="nb-build-pill">${mission.icon} ${mission.title}</div>
        </div>
        <div class="nb-build-scene">
          <div class="nb-build-scene-emoji">${isComplete ? mission.complete : mission.scene}</div>
        </div>
        ${!isComplete ? `
        <div class="nb-build-slots">
          ${state.buildPlaced.map((piece, index) => renderBuildSlot(piece, index)).join('')}
        </div>` : ''}
      </div>
    `;
    
    // 카드를 그림 위주로 (텍스트 제거 또는 최소화)
    if (!isComplete) {
      tray.innerHTML = state.buildPool.map((piece) => {
        const used = state.buildPlaced.some((placed) => placed && placed.id === piece.id);
        return `
          <button class="nb-build-card ${used ? 'used' : ''}" type="button" data-piece="${piece.id}">
            <span class="nb-build-piece-emoji">${piece.emoji}</span>
          </button>
        `;
      }).join('');
      
      tray.querySelectorAll('[data-piece]').forEach((btn) => {
        btn.addEventListener('click', () => handleBuildPieceClick(btn.dataset.piece));
      });
    } else {
      tray.innerHTML = ''; // 완성되면 트레이 비우기
    }
  }

  function renderBuildSlot(piece, index) {
    return `<div class="nb-build-slot ${piece ? 'filled' : ''}" data-slot="${index}">
      ${piece ? `<span class="nb-build-piece-emoji">${piece.emoji}</span>` : ''}
    </div>`;
  }

  function handleBuildPieceClick(pieceId) {
    if (state.isAnimating || state.destroyed || state.mode !== 'build') return;
    const mission = state.buildMission;
    const piece = state.buildPool.find((item) => item.id === pieceId);
    if (!mission || !piece || state.buildPlaced.some((placed) => placed && placed.id === pieceId)) return;

    const nextIndex = state.buildPlaced.findIndex((item) => !item);
    const expected = mission.steps[nextIndex];
    initAudio();

    if (!piece.correct || !expected || piece.id !== expected.id) {
      vibrate([50, 50, 50]);
      playTone('wrong');
      const card = state.container?.querySelector(`[data-piece="${pieceId}"]`);
      const slot = state.container?.querySelector(`[data-slot="${Math.max(nextIndex, 0)}"]`);
      card?.classList.add('wrong');
      slot?.classList.add('wrong');
      speak('어라? 이 블록은 안 맞네. 다른 걸 찾아볼까?', 1.0);
      setTimer(() => {
        card?.classList.remove('wrong');
        slot?.classList.remove('wrong');
      }, 500);
      return;
    }

    state.isAnimating = true;
    vibrate(100);
    playTone('pop');
    state.buildPlaced[nextIndex] = piece;
    drawBuildRound();
    
    const slot = state.container?.querySelector(`[data-slot="${nextIndex}"]`);
    if (slot) {
      const rect = slot.getBoundingClientRect();
      createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, mission.color, 30);
      createEmojiPop(rect.left + rect.width / 2, rect.top + rect.height / 2, '착!!');
    }
    speak(piece.say || '우와! 딱 맞았어!', 1.05);

    if (state.buildPlaced.every(Boolean)) {
      setTimer(completeBuildRound, 1200);
    } else {
      setTimer(() => { state.isAnimating = false; }, 500);
    }
  }

  function completeBuildRound() {
    if (state.destroyed || state.mode !== 'build') return;
    const mission = state.buildMission;
    drawBuildRound(); // 다시 그려서 메가 완성 애니메이션 적용
    
    flashScreen();
    const stage = state.container?.querySelector('#nbStage');
    const rect = stage?.getBoundingClientRect();
    if (rect) {
      createGoldenRing(rect.left + rect.width / 2, rect.top + rect.height / 2);
      createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, mission.color, 60);
      createEmojiPop(rect.left + rect.width / 2, rect.top + rect.height / 2, '✨완성!✨');
    }
    vibrate([100, 60, 100, 60, 300]);
    playTone('complete');
    state.options.fireConfetti?.();
    
    speak(mission.completeText, 1.0);
    
    // 시현이가 웅장한 애니메이션을 충분히 볼 수 있도록 대기 시간 대폭 연장
    setTimer(() => {
      state.buildRound += 1;
      state.isAnimating = false;
      startBuildRound();
    }, 6000); 
  }

  function showSuccessOverlay(icon, title, sub, replayFn) {
    if (!state.container || state.destroyed) return;
    const overlay = document.createElement('div');
    overlay.className = 'nb-success-overlay';
    overlay.innerHTML = `
      <div class="nb-success-box">
        <div class="nb-success-icon">${icon}</div>
        <div class="nb-success-title">${title}</div>
        <div class="nb-success-sub" style="font-size: 26px; font-weight: 900; color: #555;">${sub}</div>
        <div class="nb-success-actions">
          <button class="nb-round-btn nb-btn-green" type="button" id="nbReplay">또 할래! 🔁</button>
          <button class="nb-round-btn nb-btn-orange" type="button" id="nbHome">놀이터로 🏠</button>
        </div>
      </div>
    `;
    state.container.appendChild(overlay);
    speak(title, 1.0);
    overlay.querySelector('#nbReplay')?.addEventListener('click', () => {
      overlay.remove();
      replayFn?.();
    });
    overlay.querySelector('#nbHome')?.addEventListener('click', () => state.options.closeToParkHome?.());
  }

  function render(container, options = {}) {
    destroy();
    injectStyle();
    state.container = container;
    state.options = options || {};
    state.destroyed = false;
    state.mode = 'number';
    startNumberMode(false);
    speak('시현아! 신나는 숫자 블록 놀이를 시작해볼까?', 0.94);
  }

  function destroy() {
    state.destroyed = true;
    clearTimers();
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    if (state.audioCtx && state.audioCtx.state !== 'closed') {
      state.audioCtx.close().catch?.(() => {});
      state.audioCtx = null;
    }
    if (state.container) state.container.innerHTML = '';
    state.container = null;
    state.options = {};
    state.isAnimating = false;
    state.centerBlock = null;
    state.buildMission = null;
    state.buildPlaced = [];
    state.buildPool = [];
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
})();
