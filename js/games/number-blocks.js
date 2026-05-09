/* ═══════════════════════════════════════════
   SIHYEON PLAY OS - NUMBER BLOCKS GAME MODULE
   js/games/number-blocks.js
   대상: 4살 (넘버블록스 컨셉, 프리미엄 비주얼, 햅틱/사운드 강화)
═══════════════════════════════════════════ */

(function() {
  const GAME_KEY = 'numberBlocks';
  const STYLE_ID = 'sihyeon-number-blocks-style';

  const BLOCK_META = {
    1: { color: 'blue',   gradient: 'radial-gradient(circle at 30% 30%, #a1c4fd, #c2e9fb)', shadow: '#1565C0', name: '하나', w: 1, h: 1, face: 'normal' },
    2: { color: 'red',    gradient: 'linear-gradient(135deg, #ff8a80, #ff5252)',            shadow: '#CC1F1F', name: '둘',   w: 2, h: 1, face: 'smile' },
    3: { color: 'yellow', gradient: 'linear-gradient(135deg, #FFD54F, #FFB300)',            shadow: '#D4A017', name: '셋',   w: 1, h: 3, face: 'star' },
    4: { color: 'green',  gradient: 'linear-gradient(135deg, #81C784, #4CAF50)',            shadow: '#2E7D32', name: '넷',   w: 2, h: 2, face: 'square' },
    5: { color: 'purple', gradient: 'linear-gradient(135deg, #BA68C8, #7B1FA2)',            shadow: '#4A148C', name: '다섯', w: 5, h: 1, face: 'magic', aura: true }
  };

  const state = {
    container: null,
    options: {},
    currentLevel: 1,
    targetNumber: 5,
    centerBlock: null,
    blocksOnBoard: [],
    isAnimating: false,
    audioCtx: null,
    startTimer: null,
    successTimer: null,
    destroyed: false
  };

  function initAudio() {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    if (!state.audioCtx) {
      state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (state.audioCtx.state === 'suspended') {
      state.audioCtx.resume().catch?.(() => {});
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

    switch(val) {
      case 1:
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
        break;
      case 2:
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(330, now);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.start(now); osc.stop(now + 0.8);
        break;
      case 3:
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.2);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
        break;
      case 4:
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now); osc.stop(now + 0.4);
        break;
      case 5:
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.3);
        osc.frequency.linearRampToValueAtTime(1760, now + 0.6);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0, now + 1.0);
        osc.start(now); osc.stop(now + 1.0);
        break;
    }
  }

  function vibrate(pattern) {
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch(e) {}
    }
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
    utt.pitch = 1.3;
    speechSynthesis.speak(utt);
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .nb-root {
        width: 100%; height: 100%; min-height: 100vh;
        display: flex; flex-direction: column; align-items: center;
        background: linear-gradient(135deg, #1A237E 0%, #311B92 100%);
        font-family: 'Jua', sans-serif;
        position: relative; overflow: hidden;
        user-select: none; touch-action: none;
      }
      .nb-bg-glow {
        position: absolute; inset: 0; z-index: 0;
        background: radial-gradient(circle at 50% 40%, rgba(255,255,255,0.15) 0%, transparent 70%);
        transition: transform 0.5s, opacity 0.5s;
        pointer-events: none;
      }
      .nb-stars { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
      .nb-star {
        position: absolute; width: 4px; height: 4px; background: #fff; border-radius: 50%;
        animation: nbTwinkle 2s infinite ease-in-out alternate;
      }
      @keyframes nbTwinkle { 0% { opacity: 0.2; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1.5); box-shadow: 0 0 10px #fff; } }
      .nb-stage {
        flex: 1; width: 100%; position: relative; z-index: 10;
        display: flex; align-items: center; justify-content: center;
        perspective: 1000px;
        padding-top: 70px;
      }
      .nb-tray {
        height: 25vh; min-height: 180px; width: 100%; z-index: 10;
        background: rgba(255,255,255,0.1);
        backdrop-filter: blur(10px);
        border-top: 4px solid rgba(255,255,255,0.3);
        display: flex; align-items: center; justify-content: center; gap: 15px;
        padding: 20px; box-sizing: border-box;
        flex-wrap: wrap;
      }
      .nb-block {
        position: relative;
        display: grid; place-items: center;
        border-radius: 20px;
        cursor: pointer;
        transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s;
        box-shadow: inset 3px 3px 10px rgba(255,255,255,0.6),
                    inset -4px -4px 15px rgba(0,0,0,0.25),
                    0 10px 20px rgba(0,0,0,0.4);
        --sz: clamp(50px, 12vw, 70px);
        -webkit-tap-highlight-color: transparent;
      }
      .nb-block:active { transform: scale(0.9) !important; }
      .nb-face {
        position: absolute; inset: 0;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        font-size: calc(var(--sz) * 0.8); font-weight: 900;
        color: rgba(255,255,255,0.9);
        text-shadow: 0 4px 8px rgba(0,0,0,0.3);
        pointer-events: none;
      }
      .nb-tray-item {
        width: clamp(60px, 15vw, 80px);
        height: clamp(60px, 15vw, 80px);
        display: flex; align-items: center; justify-content: center;
      }
      .nb-flying {
        position: fixed; z-index: 100;
        pointer-events: none;
        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .nb-aura {
        position: absolute; inset: -15px; border-radius: 30px; z-index: -1;
        background: conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red);
        animation: nbSpin 3s linear infinite;
        opacity: 0.6; filter: blur(10px);
      }
      @keyframes nbSpin { 100% { transform: rotate(360deg); } }
      .nb-particle {
        position: absolute; border-radius: 50%; pointer-events: none;
        animation: nbExplode 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
      }
      @keyframes nbExplode {
        0% { transform: translate(0,0) scale(1); opacity: 1; }
        100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
      }
      .nb-golden-ring {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 0; height: 0;
        border: 15px solid #FFD700; border-radius: 50%;
        opacity: 1; pointer-events: none; z-index: 5;
        animation: nbRingExpand 1s ease-out forwards;
      }
      @keyframes nbRingExpand {
        100% { width: 400px; height: 400px; opacity: 0; border-width: 2px; }
      }
      .nb-block.stage-block {
        animation: nbFloatStage 3s ease-in-out infinite alternate;
      }
      @keyframes nbFloatStage {
        from { transform: translateY(-5px); }
        to { transform: translateY(5px); }
      }
      .nb-dance {
        animation: nbDanceAnim 1s ease-in-out !important;
      }
      @keyframes nbDanceAnim {
        0% { transform: scale(1) rotate(0deg); }
        50% { transform: scale(1.3) rotate(180deg); }
        100% { transform: scale(1) rotate(360deg); }
      }
      .nb-header {
        position: absolute; top: 20px; left: 0; width: 100%; z-index: 20;
        display: flex; justify-content: center; pointer-events: none;
      }
      .nb-title-badge {
        background: rgba(255,255,255,0.9); padding: 8px 24px; border-radius: 20px;
        color: #311B92; font-size: clamp(18px,5vw,24px); font-weight: 900;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 4px solid #fff;
      }
      .nb-success-overlay {
        position: absolute; inset: 0; z-index: 200;
        background: rgba(0,0,0,0.6); backdrop-filter: blur(5px);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        animation: nbFadeIn 0.4s;
      }
      @keyframes nbFadeIn { from { opacity: 0; } to { opacity: 1; } }
    `;
    document.head.appendChild(style);
  }

  function createBlockElement(value, isStage = false) {
    const meta = BLOCK_META[value];
    const el = document.createElement('div');
    el.className = `nb-block ${isStage ? 'stage-block' : ''}`;
    el.dataset.val = value;

    const sz = isStage ? 'clamp(60px, 14vw, 80px)' : 'clamp(40px, 10vw, 60px)';
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

  function createParticles(x, y, color) {
    const stage = state.container?.querySelector('.nb-stage');
    if (!stage) return;
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.className = 'nb-particle';
      p.style.background = color;
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;

      const size = Math.random() * 15 + 10;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;

      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 150 + 50;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);

      stage.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }
  }

  function createGoldenRing(x, y) {
    const stage = state.container?.querySelector('.nb-stage');
    if (!stage) return;
    const ring = document.createElement('div');
    ring.className = 'nb-golden-ring';
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    stage.appendChild(ring);
    setTimeout(() => ring.remove(), 1000);
  }

  function startLevel() {
    if (!state.container || state.destroyed) return;
    state.centerBlock = null;
    state.blocksOnBoard = [];
    state.isAnimating = false;

    const tray = state.container.querySelector('.nb-tray');
    const stage = state.container.querySelector('.nb-stage');
    if (!tray || !stage) return;
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
    pool.sort(() => Math.random() - 0.5);

    pool.forEach((val) => {
      const wrap = document.createElement('div');
      wrap.className = 'nb-tray-item';

      const block = createBlockElement(val, false);
      block.addEventListener('click', (e) => handleBlockClick(block, val, e));

      wrap.appendChild(block);
      tray.appendChild(wrap);
    });

    speak(`숫자 ${state.targetNumber}을 만들어보자!`, 1.1);
  }

  function handleBlockClick(blockEl, val) {
    if (state.isAnimating || state.destroyed) return;
    initAudio();

    vibrate(50);
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

    const stage = state.container.querySelector('.nb-stage');
    const stageRect = stage.getBoundingClientRect();
    const targetX = stageRect.left + stageRect.width / 2 - rect.width / 2;
    const targetY = stageRect.top + stageRect.height / 2 - rect.height / 2;

    requestAnimationFrame(() => {
      clone.style.left = `${targetX}px`;
      clone.style.top = `${targetY}px`;
      clone.style.transform = 'scale(1.2)';
    });

    setTimeout(() => {
      clone.remove();
      if (state.destroyed) return;
      processMerge(val, stageRect.left + stageRect.width / 2, stageRect.top + stageRect.height / 2);
    }, 600);
  }

  function processMerge(newVal, cx, cy) {
    const stage = state.container?.querySelector('.nb-stage');
    if (!stage) return;

    if (state.centerBlock === null) {
      state.centerBlock = newVal;
      const newEl = createBlockElement(newVal, true);
      stage.appendChild(newEl);
      speak(BLOCK_META[newVal].name, 1.2);
      state.isAnimating = false;
    } else {
      const oldVal = state.centerBlock;
      const sum = Math.min(state.targetNumber, oldVal + newVal);

      stage.innerHTML = '';
      state.centerBlock = sum;

      vibrate([100, 50, 200]);
      createParticles(cx, cy, BLOCK_META[sum].shadow);
      playBlockSound(sum);

      const mergedEl = createBlockElement(sum, true);
      mergedEl.style.transform = 'scale(0)';
      stage.appendChild(mergedEl);

      speak(`${BLOCK_META[oldVal].name}이랑 ${BLOCK_META[newVal].name}이 만나서~ ${BLOCK_META[sum].name}!`);

      requestAnimationFrame(() => {
        mergedEl.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        mergedEl.style.transform = 'scale(1)';
      });

      state.successTimer = setTimeout(() => {
        checkWin(mergedEl, cx, cy);
      }, 1500);
    }
  }

  function checkWin(mergedEl, cx, cy) {
    if (state.destroyed) return;
    if (state.centerBlock === state.targetNumber) {
      state.isAnimating = true;
      mergedEl.classList.add('nb-dance');
      createGoldenRing(cx, cy);
      vibrate([100, 100, 100, 100, 300]);

      if (state.options.fireConfetti) state.options.fireConfetti();
      if (state.options.gainExp) state.options.gainExp(30);

      state.successTimer = setTimeout(() => {
        showSuccessOverlay();
      }, 2000);
    } else {
      state.isAnimating = false;
    }
  }

  function showSuccessOverlay() {
    if (!state.container || state.destroyed) return;
    const overlay = document.createElement('div');
    overlay.className = 'nb-success-overlay';

    overlay.innerHTML = `
      <div style="background:#fff; padding:30px 40px; border-radius:30px; text-align:center; box-shadow:0 20px 40px rgba(0,0,0,0.4); border: 8px solid #FFD700;">
        <div style="font-size: 80px; margin-bottom: 20px;">⭐⭐⭐</div>
        <h2 style="font-size: 32px; color: #311B92; margin-bottom: 20px;">완벽해요!</h2>
        <div style="display:flex; gap:15px; justify-content:center;">
          <button id="nbReplay" style="width:70px; height:70px; font-size:30px; border-radius:50%; background:#4CAF50; border:4px solid #fff; box-shadow:0 6px 0 rgba(0,0,0,0.2);">🔁</button>
          <button id="nbHome" style="width:70px; height:70px; font-size:30px; border-radius:50%; background:#FF9800; border:4px solid #fff; box-shadow:0 6px 0 rgba(0,0,0,0.2);">🏠</button>
        </div>
      </div>
    `;

    state.container.appendChild(overlay);
    speak('와아! 숫자 5를 완성했어! 시현이가 최고야!', 1.1);

    overlay.querySelector('#nbReplay').onclick = () => {
      overlay.remove();
      startLevel();
    };
    overlay.querySelector('#nbHome').onclick = () => {
      if (state.options.closeToParkHome) state.options.closeToParkHome();
    };
  }

  function renderBgStars(container) {
    const starsDiv = document.createElement('div');
    starsDiv.className = 'nb-stars';
    for (let i = 0; i < 30; i++) {
      const s = document.createElement('div');
      s.className = 'nb-star';
      s.style.left = `${Math.random() * 100}%`;
      s.style.top = `${Math.random() * 100}%`;
      s.style.animationDelay = `${Math.random() * 2}s`;
      starsDiv.appendChild(s);
    }
    container.appendChild(starsDiv);
  }

  function render(container, options = {}) {
    destroy();
    injectStyle();
    state.container = container;
    state.options = options;
    state.destroyed = false;
    state.currentLevel = 1;
    state.targetNumber = 5;

    container.innerHTML = `
      <div class="nb-root">
        <div class="nb-bg-glow"></div>
        <div class="nb-header">
          <div class="nb-title-badge">숫자 블록 합치기!</div>
        </div>
        <div class="nb-stage"></div>
        <div class="nb-tray"></div>
      </div>
    `;

    renderBgStars(container.querySelector('.nb-root'));

    state.startTimer = setTimeout(startLevel, 500);
  }

  function destroy() {
    state.destroyed = true;
    clearTimeout(state.startTimer);
    clearTimeout(state.successTimer);
    state.startTimer = null;
    state.successTimer = null;
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
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
})();
