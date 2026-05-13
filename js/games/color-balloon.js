/* ═══════════════════════════════════════════
   SIHYEON PLAY OS - COLOR BALLOON GAME MODULE
   js/games/color-balloon.js
   v5.1 — 상승 애니메이션 버그 수정 + 정답/오답 보이스 오류 수정 + 모바일/태블릿 DOM 이원화
═══════════════════════════════════════════ */

(function() {
  window.SihyeonGames = window.SihyeonGames || {};

  const STYLE_ID = 'sihyeon-color-balloon-style';

  function playGameVoice(id) {
    if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      window.SihyeonVoice.play(id).catch(() => {});
    }
  }

  function isLandscapeMode() {
    try {
      return window.matchMedia('(orientation: landscape) and (min-width: 768px) and (min-height: 520px)').matches;
    } catch (error) {
      return window.innerWidth >= 768 && window.innerWidth > window.innerHeight;
    }
  }

  function getLayoutMode() {
    return isLandscapeMode() ? 'landscape' : 'portrait';
  }

  window.SihyeonGames.colorBalloon = {
    id: 'colorBalloon',
    title: '🎈',

    state: {
      currentLevel: 1,
      maxLevel: 5,
      targetColor: null,
      container: null,
      styleElement: null,
      isAnimating: false,
      spawnInterval: null,
      options: {},
      layoutMode: 'portrait',
      resizeTimer: null,
      handleResizeBound: null,
      completeRewardGiven: false,
      destroyed: false,
      timers: []
    },

    colorPool: [
      { id: 'red',    name: '빨간색', emoji: '🐞', hex: '#FF3B3B', dark: '#CC1F1F', bgTint: 'rgba(255,59,59,0.15)'   },
      { id: 'blue',   name: '파란색', emoji: '🐳', hex: '#1E90FF', dark: '#1565C0', bgTint: 'rgba(30,144,255,0.15)'  },
      { id: 'yellow', name: '노란색', emoji: '🐥', hex: '#FFD93D', dark: '#D4A017', bgTint: 'rgba(255,217,61,0.2)'  },
      { id: 'green',  name: '초록색', emoji: '🐸', hex: '#4CAF50', dark: '#2E7D32', bgTint: 'rgba(76,175,80,0.15)'   },
      { id: 'purple', name: '보라색', emoji: '🐙', hex: '#9C27B0', dark: '#6A1B9A', bgTint: 'rgba(156,39,176,0.15)'  },
      { id: 'pink',   name: '분홍색', emoji: '🐷', hex: '#FF69B4', dark: '#C71585', bgTint: 'rgba(255,105,180,0.15)' }
    ],

    balloonCountByLevel: [2, 3, 3, 4, 4],

    setManagedTimeout: function(fn, delay) {
      const id = window.setTimeout(() => {
        this.state.timers = this.state.timers.filter((timerId) => timerId !== id);
        if (!this.state.destroyed) fn();
      }, delay);
      this.state.timers.push(id);
      return id;
    },

    clearManagedTimers: function() {
      this.state.timers.forEach((id) => window.clearTimeout(id));
      this.state.timers = [];
      if (this.state.resizeTimer) {
        window.clearTimeout(this.state.resizeTimer);
        this.state.resizeTimer = null;
      }
    },

    bindResizeEvents: function() {
      if (this.state.handleResizeBound) return;
      this.state.handleResizeBound = this.handleResize.bind(this);
      window.addEventListener('resize', this.state.handleResizeBound, { passive: true });
      window.addEventListener('orientationchange', this.state.handleResizeBound, { passive: true });
    },

    unbindResizeEvents: function() {
      if (!this.state.handleResizeBound) return;
      window.removeEventListener('resize', this.state.handleResizeBound);
      window.removeEventListener('orientationchange', this.state.handleResizeBound);
      this.state.handleResizeBound = null;
    },

    handleResize: function() {
      if (this.state.destroyed || !this.state.container) return;

      if (this.state.resizeTimer) window.clearTimeout(this.state.resizeTimer);

      this.state.resizeTimer = window.setTimeout(() => {
        this.state.resizeTimer = null;
        if (this.state.destroyed || !this.state.container) return;

        const nextMode = getLayoutMode();
        if (nextMode === this.state.layoutMode) return;

        this.state.layoutMode = nextMode;

        if (this.state.currentLevel > this.state.maxLevel) {
          this.renderShell();
          this.showCompleteScreen({ silent: true });
          return;
        }

        this.renderShell();
        this.updateProgress();
        this.applyTargetVisual();

        if (!this.state.isAnimating) {
          this.clearBalloons({ keepTimers: true });
          this.startSpawningBalloons();
        }
      }, 140);
    },

    render: function(container, options = {}) {
      this.destroy();

      this.state.container = container;
      this.state.options = options;
      this.state.currentLevel = 1;
      this.state.isAnimating = false;
      this.state.targetColor = null;
      this.state.layoutMode = getLayoutMode();
      this.state.completeRewardGiven = false;
      this.state.destroyed = false;

      this.injectStyles();
      this.bindResizeEvents();
      this.renderShell();

      playGameVoice('games.color.intro');
      this.startLevel();
    },

    renderShell: function() {
      const container = this.state.container;
      if (!container) return;

      const mode = getLayoutMode();
      this.state.layoutMode = mode;

      if (mode === 'landscape') {
        container.innerHTML = `
          <div class="cb-wrapper cb-landscape" id="cbWrapper">
            <div class="cb-bg-tint" id="cbBgTint"></div>
            <div class="bg-cloud b-c1"></div>
            <div class="bg-cloud b-c2"></div>
            <div class="bg-cloud b-c3"></div>

            <aside class="cb-land-panel">
              <div class="cb-land-title-card">
                <div class="cb-land-title-emoji">🎈</div>
                <div class="cb-land-title">색깔 풍선</div>
                <div class="cb-land-sub">목표 색깔을 보고<br>같은 풍선을 터뜨려요</div>
              </div>

              <div class="cb-header">
                <div class="cb-progress" id="cbProgress"></div>
                <div class="cb-target-wrap">
                  <div class="cb-target-label">찾을 색깔</div>
                  <div class="cb-target-dot" id="cbTargetDot"></div>
                </div>
              </div>
            </aside>

            <main class="cb-play-panel">
              <div class="cb-balloon-area" id="cbBalloonArea"></div>
            </main>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="cb-wrapper cb-portrait" id="cbWrapper">
            <div class="cb-bg-tint" id="cbBgTint"></div>
            <div class="bg-cloud b-c1"></div>
            <div class="bg-cloud b-c2"></div>
            <div class="bg-cloud b-c3"></div>

            <div class="cb-header">
              <div class="cb-progress" id="cbProgress"></div>
              <div class="cb-target-wrap">
                <div class="cb-target-dot" id="cbTargetDot"></div>
              </div>
            </div>

            <div class="cb-balloon-area" id="cbBalloonArea"></div>
          </div>
        `;
      }
    },

    startLevel: function() {
      if (this.state.currentLevel > this.state.maxLevel) {
        this.showCompleteScreen();
        return;
      }

      this.clearManagedTimers();
      this.state.isAnimating = false;

      const container = this.state.container;
      if (!container) return;

      this.updateProgress();

      this.state.targetColor = this.colorPool[Math.floor(Math.random() * this.colorPool.length)];
      this.applyTargetVisual();

      playGameVoice(`games.color.${this.state.targetColor.id}`);

      this.clearBalloons({ keepTimers: true });
      this.startSpawningBalloons();
    },

    applyTargetVisual: function() {
      const container = this.state.container;
      const color = this.state.targetColor;
      if (!container || !color) return;

      const dot = container.querySelector('#cbTargetDot');
      if (dot) {
        dot.style.background = `radial-gradient(circle at 35% 35%, #fff 0%, ${color.hex} 28%, ${color.dark} 100%)`;
        dot.style.boxShadow = `0 0 0 5px #fff, 0 0 0 12px ${color.hex}, 0 8px 0 rgba(0,0,0,0.2)`;
        dot.classList.remove('pulse-anim');
        void dot.offsetWidth;
        dot.classList.add('pulse-anim');
      }

      const tint = container.querySelector('#cbBgTint');
      if (tint) tint.style.background = color.bgTint;
    },

    updateProgress: function() {
      const el = this.state.container?.querySelector('#cbProgress');
      if (!el) return;

      let html = '';
      for (let i = 1; i <= this.state.maxLevel; i++) {
        html += `<span class="cb-dot ${i < this.state.currentLevel ? 'done' : i === this.state.currentLevel ? 'active' : ''}"></span>`;
      }
      el.innerHTML = html;
    },

    startSpawningBalloons: function() {
      clearInterval(this.state.spawnInterval);
      this.state.spawnInterval = null;

      this.spawnBalloonBatch();

      const intervalMs = Math.max(2500, 4000 - (this.state.currentLevel * 300));

      this.state.spawnInterval = setInterval(() => {
        if (!this.state.isAnimating && !this.state.destroyed) this.spawnBalloonBatch();
      }, intervalMs);
    },

    spawnBalloonBatch: function() {
      const area = this.state.container?.querySelector('#cbBalloonArea');
      if (!area) return;

      const count = this.balloonCountByLevel[this.state.currentLevel - 1] || 4;
      const target = this.state.targetColor;
      if (!target) return;

      let batch = [target];
      const others = [...this.colorPool.filter(c => c.id !== target.id)].sort(() => Math.random() - 0.5);

      for (let i = 0; i < count - 1; i++) {
        batch.push(others[i % others.length]);
      }

      batch.sort(() => Math.random() - 0.5);

      const slotWidth = Math.floor(80 / count);
      const lvl = this.state.currentLevel;

      let baseDur = 16 - (lvl * 1.5);
      if (baseDur < 7) baseDur = 7;

      batch.forEach((color, idx) => {
        const isTarget = color.id === target.id;
        const balloon = document.createElement('div');

        balloon.className = isTarget ? 'cb-balloon cb-balloon-target cb-target-glow' : 'cb-balloon';
        balloon.style.background = `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.9) 0%, ${color.hex} 25%, ${color.dark} 100%)`;

        const leftPct = (idx * slotWidth) + Math.random() * Math.max(1, (slotWidth - 5)) + 5;
        balloon.style.left = `${Math.min(86, Math.max(4, leftPct))}%`;

        const dur = baseDur + Math.random() * 2.5;
        const sway = 1.8 + Math.random() * 1.5;

        balloon.style.animation = `cbFloatUp ${dur}s linear forwards, cbSway ${sway}s ease-in-out infinite alternate`;
        balloon.dataset.colorId = color.id;
        balloon.addEventListener('click', () => this.handleBalloonClick(balloon, color));

        const content = document.createElement('div');
        content.className = 'cb-content';
        content.innerHTML = `
          <div class="cb-emoji">${color.emoji}</div>
          <div class="cb-face">
            <div class="cb-eye eye-l"></div>
            <div class="cb-eye eye-r"></div>
            <div class="cb-mouth"></div>
          </div>
        `;
        balloon.appendChild(content);

        const knot = document.createElement('div');
        knot.className = 'cb-knot';
        knot.style.borderBottomColor = color.dark;
        balloon.appendChild(knot);

        const str = document.createElement('div');
        str.className = 'cb-string';
        str.style.background = color.dark;
        balloon.appendChild(str);

        area.appendChild(balloon);

        if (isTarget) {
          this.setManagedTimeout(() => {
            if (balloon.parentNode && !balloon.classList.contains('cb-pop')) {
              balloon.classList.add('cb-hint-jump');
            }
          }, 3000);
        }

        this.setManagedTimeout(() => {
          if (balloon.parentNode) balloon.remove();
        }, dur * 1000);
      });
    },

    handleBalloonClick: function(balloonEl, color) {
      if (this.state.isAnimating || !this.state.targetColor) return;

      if (color.id === this.state.targetColor.id) {
        this.state.isAnimating = true;
        clearInterval(this.state.spawnInterval);
        this.state.spawnInterval = null;

        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        this.flashScreen();
        this.spawnParticles(balloonEl, color);

        balloonEl.style.animation = 'none';
        balloonEl.classList.remove('cb-hint-jump', 'cb-target-glow');
        balloonEl.className = 'cb-balloon cb-pop';

        playGameVoice('games.color.correct');

        if (this.state.options.fireConfetti) this.state.options.fireConfetti();

        this.state.container?.querySelectorAll('.cb-balloon:not(.cb-pop)').forEach(b => {
          b.style.transition = 'opacity 0.4s, transform 0.4s';
          b.style.opacity = '0';
          b.style.transform = 'scale(0.5)';
        });

        this.setManagedTimeout(() => {
          if (!this.state.container) return;
          this.state.currentLevel++;
          this.startLevel();
        }, 2500);

      } else {
        if (balloonEl.classList.contains('cb-wobble')) return;

        if (navigator.vibrate) navigator.vibrate(50);

        balloonEl.classList.add('cb-wobble', 'cb-wrong-face');
        playGameVoice('games.color.wrong');

        this.setManagedTimeout(() => {
          if (balloonEl) balloonEl.classList.remove('cb-wobble', 'cb-wrong-face');
        }, 800);
      }
    },

    flashScreen: function() {
      const wrapper = this.state.container?.querySelector('#cbWrapper');
      if (!wrapper) return;

      wrapper.classList.remove('cb-mega-flash');
      void wrapper.offsetWidth;
      wrapper.classList.add('cb-mega-flash');
    },

    spawnParticles: function(balloonEl, color) {
      const area = this.state.container?.querySelector('#cbBalloonArea');
      if (!area) return;

      const br = balloonEl.getBoundingClientRect();
      const ar = area.getBoundingClientRect();
      const cx = br.left - ar.left + br.width / 2;
      const cy = br.top - ar.top + br.height / 2;

      const shapes = ['●', color.emoji, '★', color.emoji, '●', '✨'];

      for (let i = 0; i < 20; i++) {
        const p = document.createElement('span');
        p.className = 'cb-particle';
        p.textContent = shapes[i % shapes.length];
        p.style.color = i % 2 === 0 ? color.hex : color.dark;
        p.style.left = `${cx}px`;
        p.style.top = `${cy}px`;
        p.style.fontSize = `clamp(30px, 8vw, 55px)`;

        const angle = (i / 20) * Math.PI * 2;
        const dist = 80 + Math.random() * 120;
        p.style.setProperty('--pdx', `${Math.cos(angle) * dist}px`);
        p.style.setProperty('--pdy', `${Math.sin(angle) * dist}px`);
        p.style.animationDelay = `${(i % 3) * 20}ms`;

        area.appendChild(p);
        p.addEventListener('animationend', () => p.remove());
      }

      const textPop = document.createElement('div');
      textPop.className = 'cb-text-pop';
      textPop.textContent = '팡!!💥';
      textPop.style.left = `${cx}px`;
      textPop.style.top = `${cy}px`;
      textPop.style.color = color.dark;
      area.appendChild(textPop);
      this.setManagedTimeout(() => textPop.remove(), 1000);
    },

    showCompleteScreen: function(options = {}) {
      this.clearBalloons({ keepTimers: true });

      const wrapper = this.state.container?.querySelector('#cbWrapper');
      if (!wrapper) return;

      if (wrapper.querySelector('.cb-complete')) return;

      const el = document.createElement('div');
      el.className = 'cb-complete';
      el.innerHTML = `
        <div class="cb-stars">
            <div class="cb-star-wrap"><div class="cb-star">⭐</div></div>
            <div class="cb-star-wrap main-star"><div class="cb-star">⭐</div></div>
            <div class="cb-star-wrap"><div class="cb-star">⭐</div></div>
        </div>
        <div class="cb-complete-emoji">🎉</div>
        <div class="cb-complete-text">시현이 최고야!</div>
        <div class="cb-complete-btns">
          <button class="cb-btn cb-btn-replay" id="cbRestartBtn" type="button">🔁</button>
          <button class="cb-btn cb-btn-home" id="cbPlazaBtn" type="button">🏠</button>
        </div>
      `;
      wrapper.appendChild(el);

      if (!options.silent && !this.state.completeRewardGiven) {
        this.state.completeRewardGiven = true;
        playGameVoice('games.color.complete');
        if (this.state.options.fireConfetti) this.state.options.fireConfetti();
        if (this.state.options.gainExp) this.state.options.gainExp(30);
      }

      el.querySelector('#cbRestartBtn')?.addEventListener('click', () => {
        this.state.currentLevel = 1;
        this.state.completeRewardGiven = false;
        el.remove();
        this.renderShell();
        this.startLevel();
      });

      el.querySelector('#cbPlazaBtn')?.addEventListener('click', () => {
        this.state.options.closeToParkHome?.();
      });
    },

    clearBalloons: function(options = {}) {
      clearInterval(this.state.spawnInterval);
      this.state.spawnInterval = null;

      if (!options.keepTimers) {
        this.clearManagedTimers();
      }

      const area = this.state.container?.querySelector('#cbBalloonArea');
      if (area) area.innerHTML = '';
    },

    injectStyles: function() {
      const existing = document.getElementById(STYLE_ID);
      if (existing) existing.remove();

      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        .cb-wrapper {
          width: 100%;
          height: 100%;
          min-height: 100%;
          position: relative;
          overflow: hidden;
          font-family: 'Jua', sans-serif;
          background: linear-gradient(180deg, #87CEEB 0%, #E0F7FA 100%);
          box-sizing: border-box;
          touch-action: manipulation;
          user-select: none;
        }

        .cb-wrapper * {
          box-sizing: border-box;
        }

        .cb-portrait {
          display: flex;
          flex-direction: column;
        }

        .cb-landscape {
          display: grid;
          grid-template-columns: minmax(240px, 28%) minmax(420px, 1fr);
          grid-template-rows: 1fr;
          gap: 14px;
          padding: max(14px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(14px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
        }

        .cb-bg-tint {
          position: absolute;
          inset: 0;
          z-index: 0;
          transition: background 0.9s ease;
          pointer-events: none;
        }

        .cb-mega-flash::after {
          content: '';
          position: absolute;
          inset: 0;
          background: #fff;
          z-index: 999;
          pointer-events: none;
          animation: flashAnim 0.6s ease-out forwards;
        }

        @keyframes flashAnim {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }

        .bg-cloud {
          position: absolute;
          background: #fff;
          border-radius: 50px;
          opacity: 0.8;
          z-index: 1;
          pointer-events: none;
        }

        .bg-cloud::before,
        .bg-cloud::after {
          content: '';
          position: absolute;
          background: #fff;
          border-radius: 50%;
        }

        .b-c1 {
          width: 140px;
          height: 50px;
          top: 12%;
          left: -20%;
          animation: floatCloud 25s linear infinite;
        }

        .b-c1::before {
          width: 60px;
          height: 60px;
          top: -25px;
          left: 20px;
        }

        .b-c1::after {
          width: 70px;
          height: 70px;
          top: -35px;
          left: 50px;
        }

        .b-c2 {
          width: 100px;
          height: 35px;
          top: 32%;
          right: -20px;
          animation: floatCloud 35s linear infinite reverse;
        }

        .b-c2::before {
          width: 40px;
          height: 40px;
          top: -15px;
          left: 15px;
        }

        .b-c2::after {
          width: 50px;
          height: 50px;
          top: -20px;
          left: 40px;
        }

        .b-c3 {
          width: 120px;
          height: 40px;
          top: 58%;
          left: 28%;
          animation: floatCloud 30s linear infinite;
          opacity: 0.5;
        }

        .b-c3::before {
          width: 45px;
          height: 45px;
          top: -20px;
          left: 20px;
        }

        .b-c3::after {
          width: 55px;
          height: 55px;
          top: -25px;
          left: 45px;
        }

        @keyframes floatCloud {
          from { transform: translateX(-60vw); }
          to { transform: translateX(130vw); }
        }

        .cb-header {
          position: relative;
          z-index: 10;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 25px;
          background: rgba(255,255,255,0.85);
          box-shadow: 0 4px 14px rgba(0,0,0,0.1);
          border-radius: 0 0 30px 30px;
        }

        .cb-landscape .cb-header {
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-columns: 1fr;
          grid-template-rows: auto 1fr;
          align-items: center;
          justify-items: center;
          gap: 18px;
          border-radius: 32px;
          border: 6px solid #fff;
          box-shadow: 0 12px 28px rgba(0,0,0,0.13);
          padding: 18px;
        }

        .cb-land-panel {
          position: relative;
          z-index: 10;
          min-height: 0;
          display: grid;
          grid-template-rows: auto 1fr;
          gap: 14px;
        }

        .cb-land-title-card {
          border-radius: 32px;
          border: 6px solid #fff;
          background: rgba(255,255,255,0.84);
          box-shadow: 0 12px 28px rgba(0,0,0,0.13);
          padding: 18px 14px;
          text-align: center;
          display: grid;
          gap: 8px;
        }

        .cb-land-title-emoji {
          font-size: clamp(48px, 6vw, 82px);
          line-height: 1;
        }

        .cb-land-title {
          color: #17324A;
          font-size: clamp(24px, 2.8vw, 38px);
          font-weight: 900;
          line-height: 1.05;
        }

        .cb-land-sub {
          color: #0d47a1;
          font-size: clamp(15px, 1.45vw, 20px);
          font-weight: 900;
          line-height: 1.35;
        }

        .cb-play-panel {
          position: relative;
          z-index: 5;
          min-height: 0;
          display: grid;
          overflow: hidden;
          border: 6px solid rgba(255,255,255,0.72);
          border-radius: 36px;
          background: rgba(255,255,255,0.18);
          box-shadow: 0 12px 28px rgba(0,0,0,0.13);
        }

        .cb-progress {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .cb-landscape .cb-progress {
          flex-direction: column;
          gap: 14px;
        }

        .cb-dot {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(0,0,0,0.15);
          transition: background 0.3s, transform 0.3s;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .cb-landscape .cb-dot {
          width: 26px;
          height: 26px;
        }

        .cb-dot.active {
          background: #FF7A1A;
          transform: scale(1.3);
          box-shadow: 0 0 0 4px rgba(255,122,26,0.3);
        }

        .cb-dot.done {
          background: #FF7A1A;
          opacity: 0.4;
        }

        .cb-target-wrap {
          display: flex;
          align-items: center;
        }

        .cb-landscape .cb-target-wrap {
          flex-direction: column;
          gap: 16px;
        }

        .cb-target-label {
          display: none;
        }

        .cb-landscape .cb-target-label {
          display: block;
          color: #17324A;
          font-size: clamp(18px, 1.8vw, 24px);
          font-weight: 900;
        }

        .cb-target-dot {
          width: 65px;
          height: 65px;
          border-radius: 50%;
          transition: background 0.5s, box-shadow 0.5s;
        }

        .cb-landscape .cb-target-dot {
          width: clamp(90px, 10vw, 132px);
          height: clamp(90px, 10vw, 132px);
        }

        .pulse-anim {
          animation: cbTargetPulse 1.5s ease-in-out infinite;
        }

        @keyframes cbTargetPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        .cb-balloon-area {
          flex: 1;
          position: relative;
          z-index: 5;
          width: 100%;
          overflow: hidden;
        }

        .cb-landscape .cb-balloon-area {
          height: 100%;
          min-height: 0;
        }

        .cb-balloon {
          position: absolute;
          bottom: -300px;
          width: clamp(165px, 30vw, 220px);
          height: clamp(200px, 38vw, 260px);
          border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
          box-shadow: inset -15px -15px 30px rgba(0,0,0,0.15), 0 12px 20px rgba(0,0,0,0.2);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: opacity 0.6s ease, filter 0.25s ease, box-shadow 0.25s ease;
          user-select: none;
        }

        .cb-landscape .cb-balloon {
          width: clamp(150px, 17vw, 230px);
          height: clamp(190px, 22vw, 290px);
        }

        .cb-balloon-target {
          width: clamp(195px, 35vw, 250px);
          height: clamp(235px, 42vw, 300px);
          z-index: 10;
        }

        .cb-landscape .cb-balloon-target {
          width: clamp(180px, 20vw, 270px);
          height: clamp(220px, 25vw, 330px);
        }

        .cb-target-glow {
          filter: drop-shadow(0 0 10px rgba(255,255,255,0.8));
        }

        .cb-hint-jump {
          filter: brightness(1.18) drop-shadow(0 0 28px rgba(255,255,255,0.95));
          box-shadow:
            inset -15px -15px 30px rgba(0,0,0,0.15),
            0 12px 20px rgba(0,0,0,0.2),
            0 0 0 8px rgba(255,255,255,0.34),
            0 0 32px rgba(255,255,255,0.86);
        }

        .cb-hint-jump .cb-content {
          animation: cbHintContentJump 0.6s ease-in-out infinite alternate;
        }

        @keyframes cbHintContentJump {
          from { transform: translateY(0) scale(1) rotate(0deg); }
          to { transform: translateY(-18px) scale(1.08) rotate(4deg); }
        }

        .cb-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 2;
          pointer-events: none;
        }

        .cb-emoji {
          font-size: clamp(65px, 13vw, 95px);
          filter: drop-shadow(0 5px 5px rgba(0,0,0,0.2));
          margin-bottom: -5px;
        }

        .cb-landscape .cb-emoji {
          font-size: clamp(62px, 8vw, 108px);
        }

        .cb-face {
          position: relative;
          width: 70px;
          height: 40px;
        }

        .cb-eye {
          position: absolute;
          top: 0;
          width: 16px;
          height: 16px;
          background: rgba(0,0,0,0.75);
          border-radius: 50%;
          transition: all 0.2s;
        }

        .eye-l {
          left: 8px;
        }

        .eye-r {
          right: 8px;
        }

        .cb-mouth {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 22px;
          height: 12px;
          border: 5px solid rgba(0,0,0,0.75);
          border-top: 0;
          border-radius: 0 0 22px 22px;
          transition: all 0.2s;
        }

        .cb-wrong-face .cb-eye {
          height: 6px;
          border-radius: 5px;
          top: 5px;
        }

        .cb-wrong-face .cb-mouth {
          height: 6px;
          border: none;
          border-top: 5px solid rgba(0,0,0,0.75);
          border-radius: 22px 22px 0 0;
        }

        .cb-pop .cb-eye {
          height: 22px;
          width: 22px;
          top: -5px;
        }

        .cb-pop .cb-mouth {
          width: 22px;
          height: 22px;
          border: 5px solid rgba(0,0,0,0.75);
          border-radius: 50%;
        }

        .cb-knot {
          position: absolute;
          bottom: -18px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 12px solid transparent;
          border-right: 12px solid transparent;
          border-bottom: 22px solid;
        }

        .cb-string {
          position: absolute;
          bottom: -70px;
          left: 50%;
          transform: translateX(-50%);
          width: 3px;
          height: 55px;
          opacity: 0.5;
        }

        .cb-balloon.cb-wobble {
          animation: cbWobble 0.5s ease-in-out !important;
        }

        @keyframes cbWobble {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-20deg) translateX(-15px); }
          50% { transform: rotate(15deg) translateX(15px); }
          75% { transform: rotate(-10deg) translateX(-10px); }
          100% { transform: rotate(0deg) translateX(0); }
        }

        .cb-balloon.cb-pop {
          animation: cbMegaPop 0.5s forwards !important;
          pointer-events: none;
          z-index: 200;
        }

        @keyframes cbMegaPop {
          0% { transform: scale(1); opacity: 1; }
          30% { transform: scale(1.6); opacity: 0.9; filter: brightness(1.5); }
          100% { transform: scale(0); opacity: 0; filter: brightness(2); }
        }

        .cb-particle {
          position: absolute;
          font-weight: 900;
          pointer-events: none;
          z-index: 150;
          animation: cbParticleFly 1s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
          line-height: 1;
        }

        @keyframes cbParticleFly {
          0% { opacity: 1; transform: translate(0, 0) scale(1) rotate(0deg); }
          100% { opacity: 0; transform: translate(var(--pdx), var(--pdy)) scale(0.3) rotate(360deg); }
        }

        .cb-text-pop {
          position: absolute;
          font-size: clamp(50px, 12vw, 80px);
          font-weight: 900;
          z-index: 160;
          pointer-events: none;
          transform: translate(-50%, -50%);
          text-shadow: 0 5px 0 #fff, 0 -5px 0 #fff, 5px 0 0 #fff, -5px 0 0 #fff, 0 8px 15px rgba(0,0,0,0.3);
          animation: cbTextPopAnim 1s cubic-bezier(0.2, 1.35, 0.3, 1) forwards;
        }

        @keyframes cbTextPopAnim {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5) rotate(-10deg); }
          40% { opacity: 1; transform: translate(-50%, -80%) scale(1.2) rotate(5deg); }
          100% { opacity: 0; transform: translate(-50%, -120%) scale(0.8) rotate(0); }
        }

        @keyframes cbFloatUp {
          from { bottom: -300px; }
          to { bottom: 120vh; }
        }

        @keyframes cbSway {
          from { margin-left: -25px; }
          to { margin-left: 25px; }
        }

        .cb-complete {
          position: absolute;
          inset: 0;
          z-index: 30;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          animation: cbFadeIn 0.4s ease;
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(8px);
        }

        @keyframes cbFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .cb-stars {
            display: flex;
            align-items: flex-end;
            justify-content: center;
            gap: 15px;
            margin-bottom: -10px;
        }

        .cb-star-wrap {
            font-size: clamp(70px, 18vw, 100px);
            filter: drop-shadow(0 10px 15px rgba(0,0,0,0.3));
            animation: cbStarDrop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        .cb-star-wrap:nth-child(1) {
          animation-delay: 0.1s;
          transform: rotate(-15deg);
        }

        .cb-star-wrap:nth-child(3) {
          animation-delay: 0.3s;
          transform: rotate(15deg);
        }

        .cb-star-wrap.main-star {
            font-size: clamp(90px, 25vw, 140px);
            animation-delay: 0.5s;
            z-index: 2;
            margin-bottom: 20px;
        }

        .cb-star {
          animation: cbStarSpin 4s linear infinite;
        }

        @keyframes cbStarDrop {
            0% { transform: scale(0) translateY(-150px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        @keyframes cbStarSpin {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }

        .cb-complete-emoji {
          font-size: clamp(100px, 30vw, 180px);
          animation: cbBounceBig 0.8s 0.8s cubic-bezier(0.2,0.8,0.2,1) both;
        }

        .cb-complete-text {
          font-size: clamp(35px, 8vw, 55px);
          font-weight: 900;
          color: #17324A;
          animation: cbFadeIn 0.5s 1s both;
        }

        @keyframes cbBounceBig {
          0% { transform: scale(0); }
          60% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }

        .cb-complete-btns {
          display: flex;
          gap: 25px;
          margin-top: 10px;
          animation: cbFadeIn 0.5s 1.2s both;
        }

        .cb-btn {
          width: 100px;
          height: 100px;
          font-size: 45px;
          border-radius: 50%;
          border: 6px solid #fff;
          box-shadow: 0 10px 0 rgba(0,0,0,0.2);
          cursor: pointer;
          font-family: 'Jua', sans-serif;
          transition: transform 0.1s;
          display: grid;
          place-items: center;
        }

        .cb-btn:active {
          transform: translateY(8px);
          box-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }

        .cb-btn-replay {
          background: #4CAF50;
        }

        .cb-btn-home {
          background: #FF9800;
        }

        @media (orientation: landscape) and (max-height: 540px) {
          .cb-landscape {
            grid-template-columns: minmax(190px, 26%) minmax(360px, 1fr);
            gap: 10px;
            padding: 10px;
          }

          .cb-land-title-card,
          .cb-landscape .cb-header,
          .cb-play-panel {
            border-width: 4px;
            border-radius: 24px;
          }

          .cb-land-title-card {
            padding: 10px;
          }

          .cb-land-title-emoji {
            font-size: 38px;
          }

          .cb-land-title {
            font-size: 21px;
          }

          .cb-land-sub {
            font-size: 13px;
          }

          .cb-landscape .cb-dot {
            width: 20px;
            height: 20px;
          }

          .cb-landscape .cb-target-dot {
            width: 76px;
            height: 76px;
          }

          .cb-landscape .cb-balloon {
            width: clamp(126px, 15vw, 180px);
            height: clamp(158px, 19vw, 230px);
          }

          .cb-landscape .cb-balloon-target {
            width: clamp(148px, 17vw, 210px);
            height: clamp(182px, 21vw, 260px);
          }

          .cb-landscape .cb-emoji {
            font-size: clamp(52px, 7vw, 82px);
          }
        }

        @media (max-width: 620px), (max-height: 640px) {
          .cb-header {
            padding: 10px 15px;
            border-radius: 0 0 22px 22px;
          }

          .cb-progress {
            gap: 9px;
          }

          .cb-dot {
            width: 18px;
            height: 18px;
          }

          .cb-target-dot {
            width: 54px;
            height: 54px;
          }

          .cb-balloon {
            width: clamp(130px, 30vw, 175px);
            height: clamp(160px, 38vw, 220px);
          }

          .cb-balloon-target {
            width: clamp(155px, 36vw, 205px);
            height: clamp(190px, 44vw, 250px);
          }

          .cb-emoji {
            font-size: clamp(50px, 13vw, 76px);
          }

          .cb-btn {
            width: 84px;
            height: 84px;
            font-size: 38px;
          }
        }
      `;

      document.head.appendChild(style);
      this.state.styleElement = style;
    },

    destroy: function() {
      this.clearBalloons();
      this.clearManagedTimers();
      this.unbindResizeEvents();

      if (this.state.styleElement) {
        this.state.styleElement.remove();
        this.state.styleElement = null;
      }

      if (this.state.container) this.state.container.innerHTML = '';

      this.state.container = null;
      this.state.options = {};
      this.state.currentLevel = 1;
      this.state.isAnimating = false;
      this.state.targetColor = null;
      this.state.layoutMode = 'portrait';
      this.state.completeRewardGiven = false;
      this.state.destroyed = true;
    }
  };
})();