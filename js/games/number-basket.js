/**
 * 시현이 놀이터 OS — 숫자 바구니 v1.4.1
 * 파일: js/games/number-basket.js
 * 기준: number-basket v1.3
 * 변경:
 * - 숫자 블록 1.webp ~ 10.webp 전체 유지
 * - 숫자 블록 CSS 사각형 → 이미지 블록 적용
 * - 모바일 세로 / 태블릿 가로 레이아웃 보강
 * - 기존 5 → 8 → 12 레벨 흐름 유지
 */
(function() {
  const GAME_KEY = 'numberBasket';
  const ASSET_BASE = './assets/games/number-basket';
  const ALL_NUMBER_BLOCKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  function playPopSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      /* ignore */
    }
  }

  const styleHTML = `
    <style>
      .nb-root {
        width: 100%;
        height: 100%;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: max(14px, env(safe-area-inset-top)) 14px max(18px, env(safe-area-inset-bottom));
        box-sizing: border-box;
        overflow: hidden;
        font-family: 'Jua', 'Pretendard', sans-serif;
        position: relative;
        touch-action: manipulation;
      }

      .nb-status-board {
        flex: 0 0 auto;
        background: rgba(255,255,255,0.25);
        padding: 12px 25px;
        border-radius: 25px;
        color: #fff;
        font-size: clamp(20px, 5vw, 32px);
        font-weight: 900;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        backdrop-filter: blur(5px);
        border: 2px solid rgba(255,255,255,0.3);
        line-height: 1.15;
        white-space: nowrap;
      }

      .nb-basket-area {
        flex: 0 0 auto;
        position: relative;
        width: clamp(168px, 39vw, 248px);
        height: clamp(168px, 39vw, 248px);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 4px 0 2px;
      }

      .nb-basket-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        z-index: 2;
        filter: drop-shadow(0 12px 20px rgba(0,0,0,0.3));
      }

      .nb-basket-sum {
        position: absolute;
        bottom: 18%;
        font-size: clamp(46px, 11vw, 70px);
        font-weight: 900;
        color: #FFD700;
        text-shadow: 3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000;
        z-index: 3;
        transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        pointer-events: none;
      }

      .nb-character {
        position: absolute;
        right: -28px;
        top: -36px;
        width: clamp(58px, 14vw, 88px);
        z-index: 4;
        filter: drop-shadow(0 5px 10px rgba(0,0,0,0.3));
        transition: transform 0.2s;
        pointer-events: none;
      }

      .nb-char-jump {
        animation: nbCharJump 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      @keyframes nbCharJump {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-30px) scale(1.1); }
      }

      .nb-blocks-area {
        flex: 1 1 auto;
        display: grid;
        grid-template-columns: repeat(5, minmax(54px, 1fr));
        gap: clamp(7px, 1.8vw, 14px);
        align-content: center;
        justify-items: center;
        padding: 10px 6px 72px;
        z-index: 10;
        width: 100%;
        max-width: 640px;
        box-sizing: border-box;
        min-height: 0;
      }

      .nb-block {
        position: relative;
        width: clamp(56px, 17vw, 108px);
        height: clamp(56px, 17vw, 108px);
        border: 0;
        border-radius: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 7px 0 rgba(0,0,0,0.18), 0 13px 22px rgba(0,0,0,0.18);
        transition: transform 0.1s, box-shadow 0.1s, filter 0.18s;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        background: transparent;
        padding: 0;
        overflow: visible;
        touch-action: manipulation;
      }

      .nb-block:active {
        transform: translateY(5px);
        box-shadow: 0 2px 0 rgba(0,0,0,0.18), 0 5px 10px rgba(0,0,0,0.2);
      }

      .nb-block-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
        pointer-events: none;
        filter: drop-shadow(0 6px 8px rgba(0,0,0,0.16));
      }

      .nb-block-fallback {
        display: none;
        width: 100%;
        height: 100%;
        border-radius: 24px;
        align-items: center;
        justify-content: center;
        font-size: clamp(30px, 8vw, 52px);
        font-weight: 900;
        color: #fff;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.35);
        background: linear-gradient(135deg, #FF9F43, #FF4D4D);
      }

      .nb-undo-btn {
        position: absolute;
        bottom: max(18px, env(safe-area-inset-bottom));
        left: 50%;
        transform: translateX(-50%);
        background: #fff;
        color: #ff4757;
        font-size: 22px;
        font-weight: 900;
        padding: 12px 28px;
        border-radius: 50px;
        box-shadow: 0 6px 15px rgba(0,0,0,0.2);
        z-index: 100;
        display: none;
        border: 4px solid #ff4757;
        cursor: pointer;
        transition: transform 0.1s, box-shadow 0.1s;
        font-family: 'Jua', 'Pretendard', sans-serif;
        white-space: nowrap;
      }

      .nb-undo-btn:active {
        transform: translateX(-50%) translateY(4px);
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      }

      .nb-shake-error {
        animation: nbShake 0.5s ease;
        filter: drop-shadow(0 0 12px #ff4757);
      }

      @keyframes nbShake {
        0%,100%{transform:translateX(0)}
        15%{transform:translateX(-12px) rotate(-6deg)}
        30%{transform:translateX(12px) rotate(6deg)}
        45%{transform:translateX(-10px) rotate(-4deg)}
        60%{transform:translateX(10px) rotate(4deg)}
        75%{transform:translateX(-6px)}
        90%{transform:translateX(6px)}
      }

      .nb-basket-shake {
        animation: nbBasketShake 0.45s ease;
      }

      @keyframes nbBasketShake {
        0%,100%{transform:rotate(0)}
        20%{transform:rotate(-8deg) scale(1.05)}
        40%{transform:rotate(8deg) scale(1.05)}
        60%{transform:rotate(-5deg)}
        80%{transform:rotate(5deg)}
      }

      .nb-overflow-popup {
        position:absolute;
        top:-20px;
        left:50%;
        transform:translateX(-50%);
        background:#ff4757;
        color:#fff;
        font-size:28px;
        font-weight:900;
        padding:6px 18px;
        border-radius:20px;
        white-space:nowrap;
        animation:nbPopup 1.2s ease forwards;
        pointer-events:none;
        z-index:200;
      }

      @keyframes nbPopup {
        0%{opacity:0;transform:translateX(-50%) scale(0.5) translateY(10px)}
        30%{opacity:1;transform:translateX(-50%) scale(1.1) translateY(-5px)}
        70%{opacity:1;transform:translateX(-50%) scale(1) translateY(-10px)}
        100%{opacity:0;transform:translateX(-50%) scale(0.9) translateY(-30px)}
      }

      .nb-ripple {
        position:absolute;
        border-radius:50%;
        background:rgba(255,255,255,0.5);
        transform:scale(0);
        animation:nbRipple 0.45s ease-out forwards;
        pointer-events:none;
      }

      @keyframes nbRipple {
        to{transform:scale(3);opacity:0}
      }

      @keyframes nbScatter {
        to{transform:translate(var(--sx),var(--sy)) rotate(var(--sr)) scale(0); opacity:0;}
      }

      .nb-hint-pulse {
        animation: nbPulse 0.8s infinite alternate;
        filter: brightness(1.2) drop-shadow(0 0 16px #FFD700);
      }

      @keyframes nbPulse {
        from { transform: scale(1); }
        to { transform: scale(1.13); }
      }

      .nb-clone {
        position: fixed !important;
        z-index: 1000;
        pointer-events: none;
        transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
      }

      .nb-train-box {
        position: absolute;
        bottom: 5%;
        left: -350px;
        width: 300px;
        height: 150px;
        z-index: 50;
        display: none;
      }

      .nb-train-active {
        display: block;
        animation: nbTrainRun 4.5s linear forwards;
      }

      @keyframes nbTrainRun {
        0% { left: -350px; transform: rotate(-3deg); }
        10% { transform: rotate(3deg); }
        90% { transform: rotate(-3deg); }
        100% { left: 120%; transform: rotate(0); }
      }

      @media (orientation: portrait) and (max-height: 720px) {
        .nb-root { padding-top: 10px; }
        .nb-status-board { font-size: 20px; padding: 9px 18px; }
        .nb-basket-area { width: 150px; height: 150px; }
        .nb-blocks-area { gap: 6px; padding-top: 6px; padding-bottom: 66px; }
        .nb-block { width: clamp(52px, 15.5vw, 86px); height: clamp(52px, 15.5vw, 86px); }
        .nb-undo-btn { font-size: 19px; padding: 9px 22px; }
      }

      @media (orientation: landscape) and (min-width: 740px) {
        .nb-root {
          display: grid;
          grid-template-columns: minmax(260px, 38%) minmax(420px, 62%);
          grid-template-rows: auto 1fr auto;
          grid-template-areas:
            "status blocks"
            "basket blocks"
            "undo blocks";
          align-items: center;
          justify-items: center;
          gap: 10px 22px;
          padding: max(16px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
        }

        .nb-status-board {
          grid-area: status;
          align-self: end;
          font-size: clamp(23px, 3.2vw, 34px);
          padding: 13px 28px;
          max-width: 100%;
        }

        .nb-basket-area {
          grid-area: basket;
          width: min(34vw, 320px);
          height: min(34vw, 320px);
          margin: 0;
          align-self: center;
        }

        .nb-character {
          right: -24px;
          top: -28px;
          width: clamp(70px, 9vw, 104px);
        }

        .nb-basket-sum {
          font-size: clamp(58px, 8vw, 86px);
        }

        .nb-blocks-area {
          grid-area: blocks;
          align-self: stretch;
          justify-self: stretch;
          width: 100%;
          height: 100%;
          max-width: none;
          padding: 16px 10px;
          display: grid;
          grid-template-columns: repeat(5, minmax(84px, 1fr));
          grid-template-rows: repeat(2, minmax(84px, 1fr));
          place-items: center;
          align-content: center;
          justify-content: center;
          gap: clamp(12px, 2vw, 22px);
        }

        .nb-block {
          width: min(12.8vw, 142px);
          height: min(12.8vw, 142px);
          max-width: 142px;
          max-height: 142px;
          border-radius: 30px;
        }

        .nb-undo-btn {
          grid-area: undo;
          position: static;
          transform: none;
          align-self: start;
          font-size: 22px;
          padding: 12px 30px;
        }

        .nb-undo-btn:active {
          transform: translateY(4px);
        }

        .nb-train-box {
          bottom: 4%;
          width: 340px;
          height: 170px;
        }
      }

      @media (orientation: landscape) and (min-width: 1000px) {
        .nb-root {
          grid-template-columns: minmax(360px, 38%) minmax(620px, 62%);
          gap: 12px 30px;
        }

        .nb-basket-area {
          width: min(31vw, 370px);
          height: min(31vw, 370px);
        }

        .nb-blocks-area {
          grid-template-columns: repeat(5, minmax(112px, 156px));
          grid-template-rows: repeat(2, minmax(112px, 156px));
          justify-content: center;
        }

        .nb-block {
          width: min(12.5vw, 156px);
          height: min(12.5vw, 156px);
          max-width: 156px;
          max-height: 156px;
        }
      }
    </style>
  `;

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = {
    container: null,
    options: {},
    state: {
      level: 1,
      targetNum: 5,
      currentSum: 0,
      availableBlocks: [],
      hintTimer: null,
      isAnimating: false,
      errorCount: 0,
      history: []
    },

    render: function(container, options) {
      this.container = container;
      this.options = options || {};
      this.initUI();
      this.startLevel(1);
    },

    initUI: function() {
      this.container.innerHTML = styleHTML + `
        <div class="nb-root">
          <div class="nb-status-board">미션: <span id="nbTargetNum" style="color:#FFD93D; font-size:1.2em;">5</span> 만들기</div>

          <div class="nb-basket-area" id="nbBasketArea">
            <img src="${ASSET_BASE}/basket.webp" class="nb-basket-img" alt="바구니" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'><path d=\\'M10 30 L90 30 L80 90 L20 90 Z\\' fill=\\'%23FFD93D\\' stroke=\\'%23E65100\\' stroke-width=\\'4\\'/></svg>'">
            <img src="./assets/characters/sicheoni.png" class="nb-character" id="nbCompanion" alt="도우미 친구" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 50 50\\'><circle cx=\\'25\\' cy=\\'25\\' r=\\'20\\' fill=\\'%23FFB6C1\\'/><circle cx=\\'15\\' cy=\\'20\\' r=\\'3\\'/><circle cx=\\'35\\' cy=\\'20\\' r=\\'3\\'/><path d=\\'M20 35 Q25 40 30 35\\' stroke=\\'%23000\\' stroke-width=\\'2\\' fill=\\'none\\'/></svg>'">
            <div class="nb-basket-sum" id="nbCurrentSumText">0</div>
          </div>

          <div class="nb-blocks-area" id="nbBlocksList"></div>

          <button class="nb-undo-btn" id="nbUndoBtn" type="button">↩ 하나 빼기</button>

          <div class="nb-train-box" id="nbGoldenTrain">
            <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 60'><rect width='100' height='40' y='10' fill='%23FF7A1A' rx='10'/><circle cx='20' cy='50' r='8'/><circle cx='80' cy='50' r='8'/></svg>" style="width:100%;" alt="축하 기차">
          </div>
        </div>
      `;

      const undoBtn = document.getElementById('nbUndoBtn');
      if (undoBtn) {
        undoBtn.onclick = () => this.undoLastBlock();
      }
    },

    startLevel: function(level) {
      this.state.level = level;
      this.state.history = [];

      const undoBtn = document.getElementById('nbUndoBtn');
      if (undoBtn) undoBtn.style.display = 'none';

      if (level === 1) {
        this.state.targetNum = 5;
      } else if (level === 2) {
        this.state.targetNum = 8;
      } else {
        this.state.targetNum = 12;
      }

      this.state.availableBlocks = ALL_NUMBER_BLOCKS.slice();
      this.state.currentSum = 0;
      this.state.errorCount = 0;
      this.state.isAnimating = false;

      const targetEl = document.getElementById('nbTargetNum');
      if (targetEl) targetEl.innerText = this.state.targetNum;

      this.updateSumDisplay();
      this.renderBlocks();
      this.speak(`시현아, 우리 숫자 ${this.state.targetNum}을 만들어볼까?`, true);
      this.resetHintTimer();
    },

    renderBlocks: function() {
      const list = document.getElementById('nbBlocksList');
      if (!list) return;

      list.innerHTML = '';

      this.state.availableBlocks.forEach((n) => {
        const b = document.createElement('button');
        b.className = 'nb-block';
        b.dataset.val = String(n);
        b.type = 'button';
        b.setAttribute('aria-label', `숫자 ${n}`);
        b.innerHTML = `
          <img class="nb-block-img" src="${ASSET_BASE}/${n}.webp" alt="숫자 ${n}" draggable="false">
          <span class="nb-block-fallback">${n}</span>
        `;

        const img = b.querySelector('.nb-block-img');
        const fallback = b.querySelector('.nb-block-fallback');
        if (img && fallback) {
          img.onerror = function() {
            img.style.display = 'none';
            fallback.style.display = 'flex';
          };
        }

        b.onclick = (e) => this.handleBlockTouch(n, b, e);
        list.appendChild(b);
      });
    },

    speak: function(text, force) {
      if (this.options.speakGuide) this.options.speakGuide(text, force !== false);
    },

    handleBlockTouch: function(val, blockEl, event) {
      if (this.state.isAnimating) return;
      clearTimeout(this.state.hintTimer);
      this.clearHints();

      if (this.state.currentSum + val > this.state.targetNum) {
        const over = (this.state.currentSum + val) - this.state.targetNum;
        this.state.errorCount++;
        if (navigator.vibrate) navigator.vibrate([80, 50, 80]);

        blockEl.classList.add('nb-shake-error');
        setTimeout(() => blockEl.classList.remove('nb-shake-error'), 500);

        const basketArea = document.getElementById('nbBasketArea');
        if (basketArea) {
          basketArea.classList.add('nb-basket-shake');
          setTimeout(() => basketArea.classList.remove('nb-basket-shake'), 450);

          const popup = document.createElement('div');
          popup.className = 'nb-overflow-popup';
          popup.textContent = `+${over} 초과!`;
          basketArea.appendChild(popup);
          setTimeout(() => popup.remove(), 1200);
        }

        const msgs = [
          `앗! ${over}만큼 넘쳤어! 더 작은 걸 넣어봐!`,
          `너무 커! ${this.state.targetNum - this.state.currentSum}이 필요해~`,
          `이런! 바구니가 넘칠 뻔했어!`,
          `조심해! ${over}만큼 많아!`
        ];
        const extra = this.state.errorCount >= 3 ? ' 힌트 봐봐~' : '';
        this.speak(msgs[Math.floor(Math.random() * msgs.length)] + extra);

        this.resetHintTimer();
        return;
      }

      this.state.isAnimating = true;
      this.state.currentSum += val;
      this.state.history.push(val);

      const undoBtn = document.getElementById('nbUndoBtn');
      if (undoBtn) undoBtn.style.display = 'block';

      if (navigator.vibrate) navigator.vibrate(30);
      playPopSound();
      this.addRipple(blockEl, event);
      this.animateToBasket(blockEl, val);

      const companion = document.getElementById('nbCompanion');
      if (companion) {
        companion.classList.remove('nb-char-jump');
        void companion.offsetWidth;
        companion.classList.add('nb-char-jump');
      }
    },

    undoLastBlock: function() {
      if (this.state.history.length === 0 || this.state.isAnimating) return;

      const lastVal = this.state.history.pop();
      this.state.currentSum -= lastVal;

      this.updateSumDisplay();
      this.speak(`${lastVal}을 뺐어! 다시 해보자~`);

      if (this.state.history.length === 0) {
        const undoBtn = document.getElementById('nbUndoBtn');
        if (undoBtn) undoBtn.style.display = 'none';
      }
      this.resetHintTimer();
    },

    addRipple: function(blockEl) {
      const r = document.createElement('div');
      r.className = 'nb-ripple';
      const size = Math.max(blockEl.offsetWidth, blockEl.offsetHeight);
      r.style.cssText = `width:${size}px;height:${size}px;left:${blockEl.offsetWidth / 2 - size / 2}px;top:${blockEl.offsetHeight / 2 - size / 2}px;`;
      blockEl.style.position = 'relative';
      blockEl.appendChild(r);
      setTimeout(() => r.remove(), 450);
    },

    animateToBasket: function(el) {
      const basket = document.getElementById('nbBasketArea');
      if (!basket) {
        this.updateSumDisplay();
        this.state.isAnimating = false;
        return;
      }

      const start = el.getBoundingClientRect();
      const end = basket.getBoundingClientRect();
      const clone = el.cloneNode(true);

      clone.classList.add('nb-clone');
      clone.style.left = start.left + 'px';
      clone.style.top = start.top + 'px';
      clone.style.width = start.width + 'px';
      clone.style.height = start.height + 'px';
      clone.style.margin = '0';
      document.body.appendChild(clone);

      requestAnimationFrame(() => {
        const tx = end.left + (end.width / 2) - (start.width / 2);
        const ty = end.top + (end.height / 2) - (start.height / 2);
        clone.style.transform = `translate(${tx - start.left}px, ${ty - start.top}px) scale(0.2) rotate(360deg)`;
        clone.style.opacity = '0.3';
      });

      setTimeout(() => {
        if (clone.parentNode) clone.parentNode.removeChild(clone);
        this.updateSumDisplay();

        const sumEl = document.getElementById('nbCurrentSumText');
        if (sumEl) {
          sumEl.style.transform = 'scale(1.7)';
          setTimeout(() => { sumEl.style.transform = 'scale(1)'; }, 200);
        }

        if (this.state.currentSum === this.state.targetNum) {
          setTimeout(() => this.handleLevelClear(), 400);
        } else {
          this.speak(`합쳐서 ${this.state.currentSum}!`);
          this.state.isAnimating = false;
          this.resetHintTimer();
        }
      }, 450);
    },

    updateSumDisplay: function() {
      const el = document.getElementById('nbCurrentSumText');
      if (!el) return;

      el.innerText = this.state.currentSum;
      el.style.display = this.state.currentSum === 0 ? 'none' : 'block';

      const ratio = this.state.currentSum / this.state.targetNum;
      if (ratio >= 1) {
        el.style.color = '#00FF88';
      } else if (ratio >= 0.7) {
        el.style.color = '#7BFF00';
      } else {
        el.style.color = '#FFD700';
      }
    },

    resetHintTimer: function() {
      clearTimeout(this.state.hintTimer);
      this.clearHints();
      if (this.state.currentSum >= this.state.targetNum) return;

      this.state.hintTimer = setTimeout(() => {
        const diff = this.state.targetNum - this.state.currentSum;
        const blocks = Array.from(document.querySelectorAll('.nb-block'));
        const hint = blocks.reverse().find(b => parseInt(b.dataset.val, 10) <= diff);
        if (hint) {
          hint.classList.add('nb-hint-pulse');
          this.speak(`시현아, ${diff}을 만들 수 있는 친구를 골라봐~`);
        }
      }, 2800);
    },

    clearHints: function() {
      document.querySelectorAll('.nb-block').forEach(b => b.classList.remove('nb-hint-pulse'));
    },

    handleLevelClear: function() {
      clearTimeout(this.state.hintTimer);
      this.clearHints();

      const undoBtn = document.getElementById('nbUndoBtn');
      if (undoBtn) undoBtn.style.display = 'none';

      document.querySelectorAll('.nb-block').forEach((b, i) => {
        const angle = (i / this.state.availableBlocks.length) * 360;
        const dist = 120 + Math.random() * 80;
        const sx = Math.cos(angle * Math.PI / 180) * dist + 'px';
        const sy = Math.sin(angle * Math.PI / 180) * dist + 'px';
        const sr = (Math.random() * 720 - 360) + 'deg';
        b.style.setProperty('--sx', sx);
        b.style.setProperty('--sy', sy);
        b.style.setProperty('--sr', sr);
        b.style.animation = `nbScatter 0.8s ease-out ${i * 0.06}s forwards`;
      });

      if (this.options.fireConfetti) this.options.fireConfetti();

      const companion = document.getElementById('nbCompanion');
      if (companion) {
        companion.classList.remove('nb-char-jump');
        void companion.offsetWidth;
        companion.classList.add('nb-char-jump');
      }

      if (this.state.level === 1) {
        this.speak('와아아아!! 정확히 맞췄어!! 시현이 최고! 다음엔 8을 만들어보자!');
        setTimeout(() => { this.state.isAnimating = false; this.startLevel(2); }, 3500);
      } else if (this.state.level === 2) {
        this.speak('대단해! 8 완성! 마지막으로 12까지 도전해볼까?');
        setTimeout(() => { this.state.isAnimating = false; this.startLevel(3); }, 3500);
      } else {
        this.speak('우와! 12 완성! 시현이가 정말 최고야! 숫자 왕 탄생!', true);
        this.runTrain();
        if (this.options.gainExp) this.options.gainExp(50);
      }
    },

    runTrain: function() {
      const train = document.getElementById('nbGoldenTrain');
      if (train) {
        train.style.display = 'block';
        train.classList.remove('nb-train-active');
        void train.offsetWidth;
        train.classList.add('nb-train-active');
        setTimeout(() => {
          train.classList.remove('nb-train-active');
          this.state.isAnimating = false;
        }, 5000);
      } else {
        this.state.isAnimating = false;
      }
    },

    destroy: function() {
      clearTimeout(this.state.hintTimer);
      this.state.isAnimating = false;
      if (this.container) this.container.innerHTML = '';
    }
  };
})();