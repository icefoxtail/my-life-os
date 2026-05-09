/* ═══════════════════════════════════════════
   SIHYEON PLAY OS - NUMBER BLOCKS GAME MODULE
   js/games/number-blocks.js
   v4.1 — 숫자 만들기 + 뚝딱 블록 만들기 탭 통합 확장본
═══════════════════════════════════════════ */

(function() {
  const GAME_KEY = 'numberBlocks';
  const STYLE_ID = 'sihyeon-number-blocks-style';

  const BLOCK_META = {
    1: { color: 'blue',   gradient: 'radial-gradient(circle at 30% 30%, #a1c4fd, #4facfe)', shadow: '#1565C0', name: '하나', w: 1, h: 1, face: 'normal' },
    2: { color: 'red',    gradient: 'linear-gradient(135deg, #ff9a9e, #ff5252)',            shadow: '#CC1F1F', name: '둘',   w: 2, h: 1, face: 'smile' },
    3: { color: 'yellow', gradient: 'linear-gradient(135deg, #fff176, #ffb300)',            shadow: '#D4A017', name: '셋',   w: 1, h: 3, face: 'star' },
    4: { color: 'green',  gradient: 'linear-gradient(135deg, #9cff8a, #31c95b)',            shadow: '#2E7D32', name: '넷',   w: 2, h: 2, face: 'square' },
    5: { color: 'purple', gradient: 'linear-gradient(135deg, #e1bee7, #8e24aa)',            shadow: '#4A148C', name: '다섯', w: 5, h: 1, face: 'magic', aura: true }
  };

  const BUILD_MISSIONS = [
    {
      id: 'house',
      title: '집 만들기',
      icon: '🏠',
      scene: '🌈',
      complete: '🏡',
      color: '#FF7A1A',
      guide: '블록 세 개로 예쁜 집을 만들어보자!',
      completeText: '집 완성! 창문에 불이 반짝 켜졌어요!',
      steps: [
        { id: 'body', label: '네모 집', emoji: '🟦', say: '먼저 네모 집 블록!' },
        { id: 'roof', label: '세모 지붕', emoji: '🔺', say: '지붕을 올려볼까?' },
        { id: 'door', label: '문', emoji: '🚪', say: '문을 붙이면 완성!' }
      ],
      wrongs: [
        { id: 'tree', label: '나무', emoji: '🌳' },
        { id: 'cloud', label: '구름', emoji: '☁️' }
      ]
    },
    {
      id: 'train',
      title: '기차 만들기',
      icon: '🚂',
      scene: '🛤️',
      complete: '🚂',
      color: '#1E90FF',
      guide: '칙칙폭폭 기차를 만들어보자!',
      completeText: '기차 완성! 칙칙폭폭 출발해요!',
      steps: [
        { id: 'engine', label: '기관차', emoji: '🚂', say: '기관차를 놓고!' },
        { id: 'wheel', label: '바퀴', emoji: '⚙️', say: '바퀴를 착 붙이고!' },
        { id: 'car', label: '객차', emoji: '🚃', say: '객차를 연결하면 출발!' }
      ],
      wrongs: [
        { id: 'ship', label: '배', emoji: '⛵' },
        { id: 'balloon', label: '풍선', emoji: '🎈' }
      ]
    },
    {
      id: 'rocket',
      title: '로켓 만들기',
      icon: '🚀',
      scene: '🌌',
      complete: '🚀',
      color: '#9C27B0',
      guide: '슈우웅 로켓을 만들어볼까?',
      completeText: '로켓 완성! 하늘로 슈우웅 날아가요!',
      steps: [
        { id: 'body', label: '몸통', emoji: '🟪', say: '몸통을 세우고!' },
        { id: 'wing', label: '날개', emoji: '🪽', say: '날개를 붙이고!' },
        { id: 'fire', label: '불꽃', emoji: '🔥', say: '불꽃을 붙이면 발사!' }
      ],
      wrongs: [
        { id: 'moon', label: '달', emoji: '🌙' },
        { id: 'star', label: '별', emoji: '⭐' }
      ]
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
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.start(now); osc.stop(now + 0.24);
      return;
    }
    if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.2);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
      osc.start(now); osc.stop(now + 0.26);
      return;
    }
    if (type === 'complete') {
      [392, 523.25, 659.25, 783.99].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + i * 0.09);
        g.gain.setValueAtTime(0.22, now + i * 0.09);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.09 + 0.28);
        o.connect(g); g.connect(ctx.destination);
        o.start(now + i * 0.09); o.stop(now + i * 0.09 + 0.3);
      });
      return;
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
    const freq = 300 + val * 150;
    osc.type = val === 5 ? 'sine' : val % 2 ? 'triangle' : 'square';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.8, now + 0.22);
    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.36);
    osc.start(now); osc.stop(now + 0.38);
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
    utt.rate = rate;
    utt.pitch = 1.24;
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

  function injectStyle() {
    const prev = document.getElementById(STYLE_ID);
    if (prev) prev.remove();
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .nb-root{width:100%;height:100%;min-height:100%;display:flex;flex-direction:column;align-items:center;background:linear-gradient(135deg,#311B92 0%,#1A237E 44%,#00B8D4 100%);font-family:'Jua','Apple SD Gothic Neo',sans-serif;position:relative;overflow:hidden;user-select:none;touch-action:none;color:#222;isolation:isolate}
      .nb-bg-glow{position:absolute;inset:-20%;z-index:0;background:radial-gradient(circle at 22% 18%,rgba(255,255,255,.35),transparent 20%),radial-gradient(circle at 78% 24%,rgba(255,217,61,.42),transparent 22%),radial-gradient(circle at 50% 72%,rgba(255,122,26,.36),transparent 28%);animation:nbBgFloat 7s ease-in-out infinite alternate;pointer-events:none}
      @keyframes nbBgFloat{from{transform:translate(-2%,1%) scale(1)}to{transform:translate(2%,-2%) scale(1.04)}}
      .nb-stars{position:absolute;inset:0;z-index:1;pointer-events:none}.nb-star{position:absolute;width:5px;height:5px;background:#fff;border-radius:50%;animation:nbTwinkle 2s infinite ease-in-out alternate}.nb-star:nth-child(3n){background:#fff176}.nb-star:nth-child(4n){background:#80deea}@keyframes nbTwinkle{0%{opacity:.25;transform:scale(.75)}100%{opacity:1;transform:scale(1.65);box-shadow:0 0 12px currentColor}}
      .nb-header{position:relative;z-index:30;width:100%;display:grid;gap:10px;padding:12px 12px 8px;box-sizing:border-box;flex-shrink:0}.nb-title-badge{justify-self:center;min-height:46px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.94);padding:6px 20px;border-radius:999px;color:#311B92;font-size:clamp(18px,5vw,25px);font-weight:900;box-shadow:0 6px 0 rgba(0,0,0,.2);border:4px solid #fff;text-align:center}.nb-mode-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;width:min(94vw,520px);justify-self:center}.nb-mode-tab{min-height:80px;border-radius:26px;border:5px solid #fff;background:linear-gradient(180deg,#fff,#ffe577);box-shadow:0 8px 0 rgba(0,0,0,.18);font:inherit;font-size:clamp(18px,5vw,26px);font-weight:900;color:#24324a;display:grid;place-items:center;cursor:pointer;touch-action:manipulation}.nb-mode-tab.active{background:linear-gradient(180deg,#fff,#90f7ec 48%,#32ccbc);color:#0a4051;transform:translateY(-3px);box-shadow:0 11px 0 rgba(0,0,0,.18),0 0 0 5px rgba(255,255,255,.22)}.nb-mode-tab:active{transform:translateY(5px);box-shadow:0 3px 0 rgba(0,0,0,.18)}
      .nb-stage{flex:1;width:100%;min-height:0;position:relative;z-index:10;display:flex;align-items:center;justify-content:center;perspective:1000px;padding:8px 12px;box-sizing:border-box}.nb-tray{min-height:160px;width:100%;z-index:10;background:rgba(255,255,255,.16);backdrop-filter:blur(12px);border-top:5px solid rgba(255,255,255,.42);display:flex;align-items:center;justify-content:center;gap:16px;padding:18px 14px calc(18px + env(safe-area-inset-bottom));box-sizing:border-box;flex-wrap:wrap;flex-shrink:0}
      .nb-block{position:relative;display:grid;place-items:center;border-radius:22px;cursor:pointer;transition:transform .15s cubic-bezier(.34,1.56,.64,1),opacity .3s;box-shadow:inset 3px 3px 10px rgba(255,255,255,.64),inset -4px -4px 15px rgba(0,0,0,.25),0 12px 20px rgba(0,0,0,.34);--sz:clamp(58px,14vw,84px);-webkit-tap-highlight-color:transparent}.nb-block:active{transform:scale(.9)!important}.nb-face{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:calc(var(--sz)*.78);font-weight:900;color:rgba(255,255,255,.95);text-shadow:0 4px 8px rgba(0,0,0,.3);pointer-events:none}.nb-tray-item{width:clamp(84px,22vw,112px);height:clamp(84px,22vw,112px);display:flex;align-items:center;justify-content:center}.nb-flying{position:fixed;z-index:100;pointer-events:none;transition:all .6s cubic-bezier(.34,1.56,.64,1)}.nb-aura{position:absolute;inset:-15px;border-radius:30px;z-index:-1;background:conic-gradient(from 0deg,red,yellow,lime,aqua,blue,magenta,red);animation:nbSpin 3s linear infinite;opacity:.6;filter:blur(10px)}@keyframes nbSpin{100%{transform:rotate(360deg)}}
      .nb-particle{position:absolute;border-radius:50%;pointer-events:none;animation:nbExplode .85s cubic-bezier(.1,.8,.3,1) forwards;z-index:70}.nb-emoji-pop{position:absolute;z-index:80;pointer-events:none;font-size:clamp(34px,10vw,58px);animation:nbEmojiPop 1s cubic-bezier(.2,1.35,.3,1) forwards}@keyframes nbExplode{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(0);opacity:0}}@keyframes nbEmojiPop{0%{transform:translate(-50%,-50%) scale(.25) rotate(-12deg);opacity:0}35%{transform:translate(-50%,-70%) scale(1.35) rotate(8deg);opacity:1}100%{transform:translate(-50%,-132%) scale(.8) rotate(0);opacity:0}}
      .nb-golden-ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:0;height:0;border:15px solid #FFD700;border-radius:50%;opacity:1;pointer-events:none;z-index:5;animation:nbRingExpand 1s ease-out forwards}@keyframes nbRingExpand{100%{width:420px;height:420px;opacity:0;border-width:2px}}.nb-block.stage-block{animation:nbFloatStage 3s ease-in-out infinite alternate}@keyframes nbFloatStage{from{transform:translateY(-6px)}to{transform:translateY(7px)}}.nb-dance{animation:nbDanceAnim 1s ease-in-out!important}@keyframes nbDanceAnim{0%{transform:scale(1) rotate(0)}50%{transform:scale(1.32) rotate(180deg)}100%{transform:scale(1) rotate(360deg)}}
      .nb-success-overlay{position:absolute;inset:0;z-index:200;background:rgba(0,0,0,.48);backdrop-filter:blur(7px);display:grid;place-items:center;padding:18px;animation:nbFadeIn .28s}@keyframes nbFadeIn{from{opacity:0}to{opacity:1}}.nb-success-box{width:min(92vw,540px);border-radius:34px;text-align:center;box-shadow:0 18px 0 rgba(0,0,0,.25),0 28px 56px rgba(0,0,0,.28);border:8px solid #fff;background:linear-gradient(180deg,#fff,#fff3b0);padding:26px 18px;display:grid;gap:16px}.nb-success-icon{font-size:clamp(78px,22vw,126px);animation:nbSuccessFloat 1s ease-in-out infinite alternate}.nb-success-title{font-size:clamp(30px,8vw,46px);font-weight:900;color:#311B92;line-height:1.05}.nb-success-sub{font-size:clamp(17px,5vw,25px);font-weight:900;color:#6d4b00}.nb-success-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.nb-round-btn{min-height:84px;border-radius:26px;border:5px solid #fff;box-shadow:0 8px 0 rgba(0,0,0,.18);font:inherit;font-size:clamp(28px,8vw,42px);font-weight:900}.nb-round-btn:active{transform:translateY(5px);box-shadow:0 3px 0 rgba(0,0,0,.18)}.nb-btn-green{background:#4CAF50}.nb-btn-orange{background:#FF9800}.nb-btn-blue{background:#29B6F6}@keyframes nbSuccessFloat{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-10px) rotate(3deg)}}
      .nb-build-stage{position:relative;width:min(94vw,720px);height:100%;min-height:300px;border-radius:34px;border:7px solid rgba(255,255,255,.92);background:linear-gradient(180deg,rgba(255,255,255,.62),rgba(255,255,255,.28));box-shadow:0 14px 0 rgba(0,0,0,.18),inset 0 4px 0 rgba(255,255,255,.45);overflow:hidden;display:grid;grid-template-rows:auto 1fr auto}.nb-build-sky{position:absolute;inset:0;opacity:.96;background:linear-gradient(180deg,#91e7ff,#fff1a7 70%,#a7ef8a);pointer-events:none}.nb-build-scene{position:relative;z-index:1;display:grid;place-items:center;min-height:0;padding:10px}.nb-build-scene-emoji{font-size:clamp(92px,28vw,170px);filter:drop-shadow(0 16px 0 rgba(0,0,0,.12));animation:nbBuildFloat 2.5s ease-in-out infinite alternate}.nb-build-title{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px}.nb-build-pill{min-height:48px;padding:8px 16px;border-radius:999px;border:4px solid #fff;background:rgba(255,255,255,.9);box-shadow:0 5px 0 rgba(0,0,0,.14);font-size:clamp(17px,4.8vw,24px);font-weight:900}.nb-build-slots{position:relative;z-index:3;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0 12px 12px}.nb-build-slot{min-height:clamp(84px,21vw,126px);border-radius:24px;border:5px dashed rgba(255,255,255,.96);background:rgba(255,255,255,.42);display:grid;place-items:center;box-shadow:inset 0 0 18px rgba(255,255,255,.22),0 6px 0 rgba(0,0,0,.12);position:relative;overflow:hidden}.nb-build-slot::before{content:attr(data-step);position:absolute;left:50%;top:6px;transform:translateX(-50%);padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.9);font-size:clamp(12px,3.5vw,16px);font-weight:900;color:#47351d}.nb-build-slot.filled{border-style:solid;background:rgba(255,255,255,.78);animation:nbSlotFill .42s cubic-bezier(.2,1.4,.35,1)}.nb-build-slot.wrong{animation:nbWrongShake .42s ease;border-color:#ff6f91}.nb-build-piece{width:100%;height:100%;display:grid;grid-template-rows:1fr auto;place-items:center;padding:22px 4px 7px;box-sizing:border-box}.nb-build-piece-emoji{font-size:clamp(38px,11vw,68px);line-height:1;filter:drop-shadow(0 8px 0 rgba(0,0,0,.12))}.nb-build-piece-label{font-size:clamp(12px,3.5vw,17px);font-weight:900;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.82);white-space:nowrap}
      .nb-build-tray{width:100%;z-index:10;background:rgba(255,255,255,.16);backdrop-filter:blur(12px);border-top:5px solid rgba(255,255,255,.42);display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;padding:14px 10px calc(14px + env(safe-area-inset-bottom));box-sizing:border-box;flex-shrink:0}.nb-build-card{min-height:92px;border-radius:24px;border:5px solid #fff;background:linear-gradient(180deg,#fff,#fff1b8);box-shadow:0 8px 0 rgba(0,0,0,.16);font:inherit;display:grid;grid-template-rows:1fr auto;place-items:center;padding:7px 4px;color:#26344d;font-weight:900;touch-action:manipulation}.nb-build-card.used{opacity:.34;filter:grayscale(.2);pointer-events:none;transform:scale(.94)}.nb-build-card:active{transform:translateY(5px);box-shadow:0 3px 0 rgba(0,0,0,.16)}.nb-build-card .nb-build-piece-emoji{font-size:clamp(34px,10vw,58px)}.nb-build-complete .nb-build-scene-emoji{animation:nbBuildComplete 1.2s cubic-bezier(.2,1.3,.35,1) infinite alternate}.nb-build-complete.house .nb-build-sky{background:linear-gradient(180deg,#89e8ff,#fff3b5 62%,#78dd65)}.nb-build-complete.train .nb-build-scene-emoji{animation:nbTrainRun 1.1s ease-in-out infinite}.nb-build-complete.rocket .nb-build-scene-emoji{animation:nbRocketFly 1.1s ease-in-out infinite}.nb-build-progress{position:relative;z-index:2;display:flex;gap:7px}.nb-build-dot{width:18px;height:18px;border-radius:50%;border:3px solid #fff;background:rgba(255,255,255,.55);box-shadow:0 2px 0 rgba(0,0,0,.14)}.nb-build-dot.done{background:#7ed957}.nb-build-dot.active{background:#ffb300;transform:scale(1.18)}
      @keyframes nbBuildFloat{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-10px) rotate(2deg)}}@keyframes nbBuildComplete{from{transform:scale(1) rotate(-2deg)}to{transform:scale(1.1) rotate(3deg);filter:drop-shadow(0 0 25px #fff)}}@keyframes nbTrainRun{0%,100%{transform:translateX(-14px)}50%{transform:translateX(14px)}}@keyframes nbRocketFly{0%{transform:translateY(16px) scale(1)}100%{transform:translateY(-20px) scale(1.1)}}@keyframes nbSlotFill{0%{transform:scale(.72);opacity:.5}70%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}@keyframes nbWrongShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px) rotate(-2deg)}50%{transform:translateX(7px) rotate(2deg)}75%{transform:translateX(-4px) rotate(-1deg)}}
      @media(max-height:680px){.nb-mode-tab{min-height:68px}.nb-header{gap:7px;padding:8px 10px 6px}.nb-title-badge{min-height:40px}.nb-tray{min-height:138px;padding-top:12px;padding-bottom:12px}.nb-build-tray{padding-top:10px;padding-bottom:10px}.nb-build-card{min-height:78px}.nb-build-stage{min-height:240px}.nb-build-slot{min-height:76px}}
      @media(max-width:430px){.nb-mode-tabs{gap:8px}.nb-mode-tab{min-height:74px;border-radius:22px;font-size:clamp(16px,5.2vw,22px)}.nb-tray-item{width:84px;height:84px}.nb-build-tray{grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;padding-left:7px;padding-right:7px}.nb-build-card{border-width:4px;border-radius:20px;min-height:84px}.nb-build-card .nb-build-piece-label{font-size:11px;padding:2px 4px}.nb-build-slots{gap:7px;padding-left:8px;padding-right:8px}.nb-build-slot{border-radius:20px;border-width:4px}}
    `;
    document.head.appendChild(style);
  }

  function renderBgStars(root) {
    const starsDiv = document.createElement('div');
    starsDiv.className = 'nb-stars';
    for (let i = 0; i < 36; i += 1) {
      const s = document.createElement('div');
      s.className = 'nb-star';
      s.style.left = `${Math.random() * 100}%`;
      s.style.top = `${Math.random() * 100}%`;
      s.style.animationDelay = `${Math.random() * 2}s`;
      s.style.animationDuration = `${1.2 + Math.random() * 2.6}s`;
      starsDiv.appendChild(s);
    }
    root.appendChild(starsDiv);
  }

  function renderShell() {
    if (!state.container) return;
    state.container.innerHTML = `
      <div class="nb-root">
        <div class="nb-bg-glow"></div>
        <div class="nb-header">
          <div class="nb-title-badge" id="nbTitleBadge">숫자 블록</div>
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

  function setTitle(text) {
    const title = state.container?.querySelector('#nbTitleBadge');
    if (title) title.textContent = text;
  }

  function createBlockElement(value, isStage = false) {
    const meta = BLOCK_META[value];
    const el = document.createElement('div');
    el.className = `nb-block ${isStage ? 'stage-block' : ''}`;
    el.dataset.val = value;
    const sz = isStage ? 'clamp(66px, 16vw, 92px)' : 'clamp(54px, 13vw, 76px)';
    el.style.setProperty('--sz', sz);
    el.style.width = `calc(var(--sz) * ${meta.w})`;
    el.style.height = `calc(var(--sz) * ${meta.h})`;
    el.style.background = meta.gradient;
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

  function createParticles(x, y, color, count = 22) {
    const stage = state.container?.querySelector('#nbStage');
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    for (let i = 0; i < count; i += 1) {
      const p = document.createElement('div');
      p.className = 'nb-particle';
      p.style.background = i % 3 === 0 ? '#fff176' : i % 3 === 1 ? color : '#80deea';
      p.style.left = `${x - stageRect.left}px`;
      p.style.top = `${y - stageRect.top}px`;
      const size = Math.random() * 16 + 10;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 170 + 65;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      stage.appendChild(p);
      setTimer(() => p.remove(), 900);
    }
  }

  function createEmojiPop(x, y, emoji) {
    const stage = state.container?.querySelector('#nbStage');
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'nb-emoji-pop';
    pop.textContent = emoji;
    pop.style.left = `${x - stageRect.left}px`;
    pop.style.top = `${y - stageRect.top}px`;
    stage.appendChild(pop);
    setTimer(() => pop.remove(), 1100);
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
    setTimer(() => ring.remove(), 1000);
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
    setTitle('숫자 블록 합치기!');
    state.currentLevel = 1;
    state.targetNumber = 5;
    state.centerBlock = null;
    setTimer(startNumberLevel, 260);
    if (announce) speak('숫자 만들기! 블록을 톡톡 눌러보자!', 1.05);
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
    speak(`숫자 ${state.targetNumber}을 만들어보자!`, 1.08);
  }

  function handleNumberBlockClick(blockEl, val) {
    if (state.isAnimating || state.destroyed || state.mode !== 'number') return;
    initAudio();
    vibrate(55);
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
      clone.style.transform = 'scale(1.2)';
    });
    setTimer(() => {
      clone.remove();
      if (state.destroyed || state.mode !== 'number') return;
      processNumberMerge(val, stageRect.left + stageRect.width / 2, stageRect.top + stageRect.height / 2);
    }, 600);
  }

  function processNumberMerge(newVal, cx, cy) {
    const stage = state.container?.querySelector('#nbStage');
    if (!stage) return;
    if (state.centerBlock === null) {
      state.centerBlock = newVal;
      stage.appendChild(createBlockElement(newVal, true));
      createEmojiPop(cx, cy, '톡!');
      speak(BLOCK_META[newVal].name, 1.15);
      state.isAnimating = false;
      return;
    }

    const oldVal = state.centerBlock;
    const sum = Math.min(state.targetNumber, oldVal + newVal);
    stage.innerHTML = '';
    state.centerBlock = sum;
    vibrate([80, 40, 160]);
    createParticles(cx, cy, BLOCK_META[sum].shadow, 26);
    createEmojiPop(cx, cy, '✨');
    playBlockSound(sum);
    const mergedEl = createBlockElement(sum, true);
    mergedEl.style.transform = 'scale(0)';
    stage.appendChild(mergedEl);
    speak(`${BLOCK_META[oldVal].name}이랑 ${BLOCK_META[newVal].name}이 만나서 ${BLOCK_META[sum].name}!`, 1.02);
    requestAnimationFrame(() => {
      mergedEl.style.transition = 'transform .42s cubic-bezier(.34,1.56,.64,1)';
      mergedEl.style.transform = 'scale(1)';
    });
    setTimer(() => checkNumberWin(mergedEl, cx, cy), 1350);
  }

  function checkNumberWin(mergedEl, cx, cy) {
    if (state.destroyed || state.mode !== 'number') return;
    if (state.centerBlock === state.targetNumber) {
      state.isAnimating = true;
      mergedEl.classList.add('nb-dance');
      createGoldenRing(cx, cy);
      createParticles(cx, cy, '#FFD700', 34);
      vibrate([90, 60, 90, 60, 240]);
      state.options.fireConfetti?.();
      state.options.gainExp?.(30);
      setTimer(() => showSuccessOverlay('⭐⭐⭐', '완벽해요!', '숫자 5를 완성했어!', () => startNumberMode(false)), 1800);
    } else {
      state.isAnimating = false;
    }
  }

  function startBuildMode(announce) {
    renderShell();
    setTitle('뚝딱 블록 만들기!');
    state.buildRound = 0;
    state.isAnimating = false;
    if (announce) speak('블록 만들기! 세 개를 차례차례 붙여보자!', 1.05);
    setTimer(startBuildRound, 260);
  }

  function startBuildRound() {
    if (!state.container || state.destroyed || state.mode !== 'build') return;
    if (state.buildRound >= BUILD_MISSIONS.length) {
      showSuccessOverlay('🏆', '블록 작품 완료!', '집, 기차, 로켓을 모두 만들었어요!', () => startBuildMode(false));
      state.options.fireConfetti?.();
      state.options.gainExp?.(40);
      speak('우와! 블록 작품을 모두 완성했어!', 1.05);
      return;
    }

    state.buildMission = BUILD_MISSIONS[state.buildRound];
    state.buildPlaced = new Array(state.buildMission.steps.length).fill(null);
    state.buildPool = shuffle([...state.buildMission.steps.map((s) => ({ ...s, correct: true })), ...state.buildMission.wrongs.map((w) => ({ ...w, correct: false }))]);
    state.isAnimating = false;
    drawBuildRound();
    speak(state.buildMission.guide, 1.04);
  }

  function drawBuildRound() {
    const tray = state.container?.querySelector('#nbTray');
    const stage = state.container?.querySelector('#nbStage');
    const mission = state.buildMission;
    if (!tray || !stage || !mission) return;
    tray.className = 'nb-build-tray';
    stage.innerHTML = `
      <div class="nb-build-stage ${state.buildPlaced.every(Boolean) ? `nb-build-complete ${mission.id}` : ''}">
        <div class="nb-build-sky" style="background:linear-gradient(180deg, ${mission.color}55 0%, #fff6bd 62%, #9cf28a 100%)"></div>
        <div class="nb-build-title">
          <div class="nb-build-pill">${mission.icon} ${mission.title}</div>
          <div class="nb-build-progress">${BUILD_MISSIONS.map((_, i) => `<span class="nb-build-dot ${i < state.buildRound ? 'done' : i === state.buildRound ? 'active' : ''}"></span>`).join('')}</div>
        </div>
        <div class="nb-build-scene">
          <div class="nb-build-scene-emoji">${state.buildPlaced.every(Boolean) ? mission.complete : mission.scene}</div>
        </div>
        <div class="nb-build-slots">
          ${state.buildPlaced.map((piece, index) => renderBuildSlot(piece, index)).join('')}
        </div>
      </div>
    `;
    tray.innerHTML = state.buildPool.map((piece) => renderBuildCard(piece)).join('');
    tray.querySelectorAll('[data-piece]').forEach((btn) => {
      btn.addEventListener('click', () => handleBuildPieceClick(btn.dataset.piece));
    });
  }

  function renderBuildSlot(piece, index) {
    const labels = ['1번', '2번', '3번'];
    return `<div class="nb-build-slot ${piece ? 'filled' : ''}" data-slot="${index}" data-step="${labels[index] || `${index + 1}번`}">${piece ? renderBuildPiece(piece) : `<span class="nb-build-piece-emoji">${index + 1}️⃣</span>`}</div>`;
  }

  function renderBuildPiece(piece) {
    return `<div class="nb-build-piece"><div class="nb-build-piece-emoji">${piece.emoji}</div><div class="nb-build-piece-label">${piece.label}</div></div>`;
  }

  function renderBuildCard(piece) {
    const used = state.buildPlaced.some((placed) => placed && placed.id === piece.id);
    return `<button class="nb-build-card ${used ? 'used' : ''}" type="button" data-piece="${piece.id}">${renderBuildPiece(piece)}</button>`;
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
      vibrate([55, 35, 55]);
      playTone('wrong');
      const card = state.container?.querySelector(`[data-piece="${pieceId}"]`);
      const slot = state.container?.querySelector(`[data-slot="${Math.max(nextIndex, 0)}"]`);
      card?.classList.add('wrong');
      slot?.classList.add('wrong');
      speak('이 블록은 아닌가 봐. 다른 블록을 찾아볼까?', 1.05);
      setTimer(() => {
        card?.classList.remove('wrong');
        slot?.classList.remove('wrong');
      }, 520);
      return;
    }

    state.isAnimating = true;
    vibrate(80);
    playTone('pop');
    state.buildPlaced[nextIndex] = piece;
    drawBuildRound();
    const slot = state.container?.querySelector(`[data-slot="${nextIndex}"]`);
    if (slot) {
      const rect = slot.getBoundingClientRect();
      createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, mission.color, 20);
      createEmojiPop(rect.left + rect.width / 2, rect.top + rect.height / 2, '착!');
    }
    speak(piece.say || '딱 맞았어!', 1.05);

    if (state.buildPlaced.every(Boolean)) {
      setTimer(completeBuildRound, 900);
    } else {
      setTimer(() => { state.isAnimating = false; }, 360);
    }
  }

  function completeBuildRound() {
    if (state.destroyed || state.mode !== 'build') return;
    const mission = state.buildMission;
    drawBuildRound();
    const stage = state.container?.querySelector('#nbStage');
    const rect = stage?.getBoundingClientRect();
    if (rect) {
      createGoldenRing(rect.left + rect.width / 2, rect.top + rect.height / 2);
      createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, mission.color, 38);
      createEmojiPop(rect.left + rect.width / 2, rect.top + rect.height / 2, '🎉');
    }
    vibrate([80, 60, 80, 60, 220]);
    playTone('complete');
    state.options.fireConfetti?.();
    state.options.gainExp?.(15);
    speak(mission.completeText, 1.03);
    setTimer(() => {
      state.buildRound += 1;
      state.isAnimating = false;
      startBuildRound();
    }, 2600);
  }

  function showSuccessOverlay(icon, title, sub, replayFn) {
    if (!state.container || state.destroyed) return;
    const overlay = document.createElement('div');
    overlay.className = 'nb-success-overlay';
    overlay.innerHTML = `
      <div class="nb-success-box">
        <div class="nb-success-icon">${icon}</div>
        <div class="nb-success-title">${title}</div>
        <div class="nb-success-sub">${sub}</div>
        <div class="nb-success-actions">
          <button class="nb-round-btn nb-btn-green" type="button" id="nbReplay">🔁</button>
          <button class="nb-round-btn nb-btn-orange" type="button" id="nbHome">🏠</button>
        </div>
      </div>
    `;
    state.container.appendChild(overlay);
    speak(title, 1.05);
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
    state.currentLevel = 1;
    state.targetNumber = 5;
    state.centerBlock = null;
    state.isAnimating = false;
    startNumberMode(false);
    speak('숫자 블록이야! 숫자 만들기랑 블록 만들기를 해보자!', 1.05);
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
