/* ═══════════════════════════════════════════
   SIHYEON PLAY OS - COLOR BALLOON GAME MODULE
   js/games/color-balloon.js  (4살 맞춤 갓벽 업그레이드)
═══════════════════════════════════════════ */

(function() {
  window.SihyeonGames = window.SihyeonGames || {};

  function playGameVoice(id) {
    if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      window.SihyeonVoice.play(id).catch(() => {});
    }
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
      options: {}
    },

    colorPool: [
      { id: 'red',    name: '빨간색', emoji: '🐞', hex: '#FF3B3B', dark: '#CC1F1F', bgTint: 'rgba(255,59,59,0.12)'   },
      { id: 'blue',   name: '파란색', emoji: '🐳', hex: '#1E90FF', dark: '#1565C0', bgTint: 'rgba(30,144,255,0.12)'  },
      { id: 'yellow', name: '노란색', emoji: '🐥', hex: '#FFD93D', dark: '#D4A017', bgTint: 'rgba(255,217,61,0.18)'  },
      { id: 'green',  name: '초록색', emoji: '🐸', hex: '#4CAF50', dark: '#2E7D32', bgTint: 'rgba(76,175,80,0.12)'   },
      { id: 'purple', name: '보라색', emoji: '🐙', hex: '#9C27B0', dark: '#6A1B9A', bgTint: 'rgba(156,39,176,0.12)'  },
      { id: 'pink',   name: '분홍색', emoji: '🐷', hex: '#FF69B4', dark: '#C71585', bgTint: 'rgba(255,105,180,0.12)' }
    ],

    balloonCountByLevel: [2, 2, 3, 4, 4],

    render: function(container, options = {}) {
      this.destroy();

      this.state.container = container;
      this.state.options   = options;
      this.state.currentLevel = 1;
      this.state.isAnimating  = false;

      this.injectStyles();

      container.innerHTML = `
        <div class="cb-wrapper" id="cbWrapper">
          <div class="cb-bg-tint"  id="cbBgTint"></div>
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

      playGameVoice('games.color.intro');
      this.startLevel();
    },

    startLevel: function() {
      if (this.state.currentLevel > this.state.maxLevel) {
        this.showCompleteScreen();
        return;
      }

      this.state.isAnimating = false;
      const container = this.state.container;
      if (!container) return;

      this.updateProgress();

      this.state.targetColor = this.colorPool[Math.floor(Math.random() * this.colorPool.length)];
      const color = this.state.targetColor;

      const dot = container.querySelector('#cbTargetDot');
      if (dot) {
        dot.style.background  = `radial-gradient(circle at 35% 35%, #fff 0%, ${color.hex} 28%, ${color.dark} 100%)`;
        dot.style.boxShadow   = `0 0 0 4px #fff, 0 0 0 9px ${color.hex}, 0 6px 0 rgba(0,0,0,0.12)`;
      }

      const tint = container.querySelector('#cbBgTint');
      if (tint) tint.style.background = color.bgTint;

      playGameVoice('games.color.question');
      if (this.state.options.speakGuide) {
        this.state.options.speakGuide(`${color.name} 풍선을 찾아봐!`, true);
      }

      this.clearBalloons();
      this.startSpawningBalloons();
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
      this.spawnBalloonBatch();

      const intervalMs = Math.max(2500, 4500 - (this.state.currentLevel * 500));

      this.state.spawnInterval = setInterval(() => {
        if (!this.state.isAnimating) this.spawnBalloonBatch();
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
      for (let i = 0; i < count - 1; i++) batch.push(others[i % others.length]);
      batch.sort(() => Math.random() - 0.5);

      const slotWidth = Math.floor(70 / count);
      const lvl = this.state.currentLevel;
      let baseDur = 14 - (lvl * 2);
      if (baseDur < 5) baseDur = 5;

      batch.forEach((color, idx) => {
        const isTarget  = color.id === target.id;
        const balloon   = document.createElement('div');
        balloon.className = isTarget ? 'cb-balloon cb-balloon-target' : 'cb-balloon';

        balloon.style.background = `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.85) 0%, ${color.hex} 22%, ${color.dark} 100%)`;

        const leftPct = (idx * slotWidth) + Math.random() * (slotWidth - 5) + 2;
        balloon.style.left = `${leftPct}%`;

        const dur   = baseDur + Math.random() * 2;
        const sway  = 1.8 + Math.random() * 1.4;
        const glowAnim = isTarget ? `, targetGlow 2s ease-in-out infinite` : '';
        balloon.style.animation = `cbFloatUp ${dur}s linear forwards, cbSway ${sway}s ease-in-out infinite alternate${glowAnim}`;

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
          setTimeout(() => {
            if (balloon.parentNode && !balloon.classList.contains('cb-pop')) {
              balloon.classList.add('cb-hint-jump');
            }
          }, 4000);
        }

        setTimeout(() => { if (balloon.parentNode) balloon.remove(); }, dur * 1000);
      });
    },

    handleBalloonClick: function(balloonEl, color) {
      if (this.state.isAnimating) return;

      if (color.id === this.state.targetColor.id) {
        this.state.isAnimating = true;
        clearInterval(this.state.spawnInterval);
        this.state.spawnInterval = null;

        if (navigator.vibrate) {
          navigator.vibrate(200);
        }

        this.spawnParticles(balloonEl, color);

        balloonEl.style.animation = 'none';
        balloonEl.classList.remove('cb-hint-jump');
        balloonEl.className = 'cb-balloon cb-pop';

        playGameVoice('games.color.correct');
        if (this.state.options.speakGuide) {
          this.state.options.speakGuide(`${color.name} 풍선 팡!`, true);
        }
        if (this.state.options.fireConfetti) this.state.options.fireConfetti();

        this.state.container.querySelectorAll('.cb-balloon:not(.cb-pop)').forEach(b => {
          b.style.transition = 'opacity 0.6s';
          b.style.opacity = '0';
        });

        setTimeout(() => {
          if (!this.state.container) return;
          this.state.currentLevel++;
          this.startLevel();
        }, 3500);

      } else {
        if (balloonEl.classList.contains('cb-wobble')) return;

        balloonEl.classList.add('cb-wobble', 'cb-wrong-face');
        setTimeout(() => {
          if (balloonEl) balloonEl.classList.remove('cb-wobble', 'cb-wrong-face');
        }, 800);

        if (this.state.options.speakGuide) {
          this.state.options.speakGuide(`이건 ${color.name}이야. ${this.state.targetColor.name}을 찾아봐!`, true);
        }
      }
    },

    spawnParticles: function(balloonEl, color) {
      const area = this.state.container?.querySelector('#cbBalloonArea');
      if (!area) return;

      const br  = balloonEl.getBoundingClientRect();
      const ar  = area.getBoundingClientRect();
      const cx  = br.left - ar.left + br.width  / 2;
      const cy  = br.top  - ar.top  + br.height / 2;

      const shapes = ['●', color.emoji, '★', color.emoji, '●'];

      for (let i = 0; i < 12; i++) {
        const p   = document.createElement('span');
        p.className  = 'cb-particle';
        p.textContent = shapes[i % shapes.length];
        p.style.color = i % 2 === 0 ? color.hex : color.dark;
        p.style.left  = `${cx}px`;
        p.style.top   = `${cy}px`;

        const angle = (i / 12) * Math.PI * 2;
        const dist  = 65 + Math.random() * 80;
        p.style.setProperty('--pdx', `${Math.cos(angle) * dist}px`);
        p.style.setProperty('--pdy', `${Math.sin(angle) * dist}px`);
        p.style.animationDelay = `${(i % 3) * 30}ms`;

        area.appendChild(p);
        p.addEventListener('animationend', () => p.remove());
      }
    },

    showCompleteScreen: function() {
      this.clearBalloons();
      const wrapper = this.state.container?.querySelector('#cbWrapper');
      if (!wrapper) return;

      const el = document.createElement('div');
      el.className = 'cb-complete';
      el.innerHTML = `
        <div class="cb-stars">
            <div class="cb-star-wrap"><div class="cb-star">⭐</div></div>
            <div class="cb-star-wrap main-star"><div class="cb-star">⭐</div></div>
            <div class="cb-star-wrap"><div class="cb-star">⭐</div></div>
        </div>
        <div class="cb-complete-emoji">🎉</div>
        <div class="cb-complete-btns">
          <button class="cb-btn cb-btn-replay" id="cbRestartBtn">🔁</button>
          <button class="cb-btn cb-btn-home"   id="cbPlazaBtn">🏠</button>
        </div>
      `;
      wrapper.appendChild(el);

      playGameVoice('games.color.complete');
      if (this.state.options.speakGuide) this.state.options.speakGuide('우와! 풍선을 다 터뜨렸어. 시현이가 최고야!', true);
      if (this.state.options.fireConfetti) this.state.options.fireConfetti();
      if (this.state.options.gainExp)      this.state.options.gainExp(25);

      el.querySelector('#cbRestartBtn')?.addEventListener('click', () => {
        this.state.currentLevel = 1;
        el.remove();
        this.startLevel();
      });
      el.querySelector('#cbPlazaBtn')?.addEventListener('click', () => {
        this.state.options.closeToParkHome?.();
      });
    },

    clearBalloons: function() {
      clearInterval(this.state.spawnInterval);
      this.state.spawnInterval = null;
      const area = this.state.container?.querySelector('#cbBalloonArea');
      if (area) area.innerHTML = '';
    },

    injectStyles: function() {
      const existing = document.getElementById('sihyeon-color-balloon-style');
      if (existing) existing.remove();

      const style = document.createElement('style');
      style.id    = 'sihyeon-color-balloon-style';
      style.textContent = `
        .cb-wrapper {
          width: 100%; height: 100%; min-height: 100vh;
          position: relative; overflow: hidden;
          font-family: 'Jua', sans-serif;
          background: linear-gradient(180deg, #87CEEB 0%, #E0F7FA 100%);
          display: flex; flex-direction: column;
        }
        .cb-bg-tint {
          position: absolute; inset: 0; z-index: 0;
          transition: background 0.9s ease;
          pointer-events: none;
        }
        .bg-cloud { position: absolute; background: #fff; border-radius: 50px; opacity: 0.8; z-index: 1; pointer-events: none; }
        .bg-cloud::before, .bg-cloud::after { content: ''; position: absolute; background: #fff; border-radius: 50%; }
        .b-c1 { width: 140px; height: 50px; top: 12%; left: -20%; animation: floatCloud 25s linear infinite; }
        .b-c1::before { width: 60px; height: 60px; top: -25px; left: 20px; }
        .b-c1::after  { width: 70px; height: 70px; top: -35px; left: 50px; }
        .b-c2 { width: 100px; height: 35px; top: 32%; right: -20px; animation: floatCloud 35s linear infinite reverse; }
        .b-c2::before { width: 40px; height: 40px; top: -15px; left: 15px; }
        .b-c2::after  { width: 50px; height: 50px; top: -20px; left: 40px; }
        .b-c3 { width: 120px; height: 40px; top: 58%; left: 28%; animation: floatCloud 30s linear infinite; opacity: 0.5; }
        .b-c3::before { width: 45px; height: 45px; top: -20px; left: 20px; }
        .b-c3::after  { width: 55px; height: 55px; top: -25px; left: 45px; }
        @keyframes floatCloud { from { transform: translateX(-60vw); } to { transform: translateX(130vw); } }

        .cb-header {
          position: relative; z-index: 10; flex-shrink: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 22px;
          background: rgba(255,255,255,0.72);
          box-shadow: 0 4px 14px rgba(0,0,0,0.07);
          border-radius: 0 0 26px 26px;
        }
        .cb-progress { display: flex; gap: 10px; align-items: center; }
        .cb-dot {
          width: 20px; height: 20px; border-radius: 50%;
          background: rgba(0,0,0,0.14);
          transition: background 0.3s, transform 0.3s;
        }
        .cb-dot.active {
          background: #FF7A1A;
          transform: scale(1.25);
          box-shadow: 0 0 0 4px rgba(255,122,26,0.28);
        }
        .cb-dot.done { background: #FF7A1A; opacity: 0.4; }
        .cb-target-wrap { display: flex; align-items: center; }
        .cb-target-dot {
          width: 58px; height: 58px; border-radius: 50%;
          transition: background 0.5s, box-shadow 0.5s;
          animation: cbTargetPulse 2s ease-in-out infinite;
        }
        @keyframes cbTargetPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.1); }
        }
        .cb-balloon-area {
          flex: 1; position: relative; z-index: 5;
          width: 100%; overflow: hidden;
        }
        .cb-balloon {
          position: absolute; bottom: -250px;
          width: clamp(155px, 29vw, 200px);
          height: clamp(190px, 36vw, 245px);
          border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
          box-shadow: inset -12px -12px 24px rgba(0,0,0,0.1), 0 10px 16px rgba(0,0,0,0.18);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: opacity 0.6s ease;
          user-select: none;
        }
        .cb-balloon-target {
          width: clamp(185px, 33vw, 230px);
          height: clamp(225px, 40vw, 280px);
        }
        @keyframes targetGlow {
          0%, 100% { filter: brightness(1)   drop-shadow(0 0 6px rgba(255,255,255,0.5)); }
          50%       { filter: brightness(1.1) drop-shadow(0 0 18px rgba(255,255,255,0.95)); }
        }
        .cb-hint-jump {
            animation: cbHintJump 0.8s ease-in-out infinite alternate !important;
        }
        @keyframes cbHintJump {
            from { transform: translateY(0) scale(1); filter: brightness(1); }
            to { transform: translateY(-20px) scale(1.05); filter: brightness(1.2) drop-shadow(0 0 20px rgba(255,255,255,1)); }
        }
        .cb-content {
            position: absolute; inset: 0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            z-index: 2; pointer-events: none;
        }
        .cb-emoji {
            font-size: clamp(55px, 11vw, 80px);
            filter: drop-shadow(0 4px 4px rgba(0,0,0,0.15));
            margin-bottom: -5px;
        }
        .cb-face {
            position: relative; width: 60px; height: 35px;
        }
        .cb-eye {
            position: absolute; top: 0; width: 14px; height: 14px;
            background: rgba(0,0,0,0.7); border-radius: 50%;
            transition: all 0.2s;
        }
        .eye-l { left: 8px; }
        .eye-r { right: 8px; }
        .cb-mouth {
            position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
            width: 18px; height: 10px; border: 4px solid rgba(0,0,0,0.7);
            border-top: 0; border-radius: 0 0 18px 18px;
            transition: all 0.2s;
        }
        .cb-wrong-face .cb-eye { height: 5px; border-radius: 5px; top: 5px; }
        .cb-wrong-face .cb-mouth { height: 5px; border: none; border-top: 4px solid rgba(0,0,0,0.7); border-radius: 18px 18px 0 0; }
        .cb-pop .cb-eye { height: 18px; top: -3px; }
        .cb-pop .cb-mouth { width: 16px; height: 16px; border: 4px solid rgba(0,0,0,0.7); border-radius: 50%; }
        .cb-knot {
          position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%);
          width: 0; height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-bottom: 18px solid;
        }
        .cb-string {
          position: absolute; bottom: -60px; left: 50%; transform: translateX(-50%);
          width: 2px; height: 46px; opacity: 0.45;
        }
        .cb-balloon.cb-wobble { animation: cbWobble 0.6s ease-in-out !important; }
        @keyframes cbWobble {
          0%   { transform: rotate(0deg); }
          20%  { transform: rotate(-15deg) translateX(-10px); }
          40%  { transform: rotate(12deg) translateX(10px); }
          60%  { transform: rotate(-10deg) translateX(-8px); }
          80%  { transform: rotate(8deg) translateX(8px); }
          100% { transform: rotate(0deg) translateX(0); }
        }
        .cb-balloon.cb-pop { animation: cbPop 0.4s forwards !important; pointer-events: none; z-index: 100; }
        @keyframes cbPop {
          0%   { transform: scale(1);   opacity: 1; }
          40%  { transform: scale(1.4); opacity: 0.9; }
          100% { transform: scale(0); opacity: 0; filter: brightness(2); }
        }
        .cb-particle {
          position: absolute;
          font-size: clamp(22px, 5vw, 32px);
          pointer-events: none;
          z-index: 120;
          animation: cbParticleFly 0.8s ease-out forwards;
          line-height: 1;
        }
        @keyframes cbParticleFly {
          0%   { opacity: 1; transform: translate(0, 0) scale(1.5) rotate(0deg); }
          100% { opacity: 0; transform: translate(var(--pdx), var(--pdy)) scale(0.3) rotate(360deg); }
        }
        @keyframes cbFloatUp {
          from { bottom: -250px; }
          to   { bottom: 120vh; }
        }
        @keyframes cbSway {
          from { margin-left: -20px; }
          to   { margin-left: 20px; }
        }
        .cb-complete {
          position: absolute; inset: 0; z-index: 30;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 20px;
          animation: cbFadeIn 0.45s ease;
          background: rgba(255,255,255,0.4);
          backdrop-filter: blur(4px);
        }
        @keyframes cbFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .cb-stars {
            display: flex; align-items: flex-end; justify-content: center; gap: 15px;
            margin-bottom: -10px;
        }
        .cb-star-wrap {
            font-size: clamp(60px, 15vw, 90px);
            filter: drop-shadow(0 8px 12px rgba(0,0,0,0.2));
            animation: cbStarDrop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .cb-star-wrap:nth-child(1) { animation-delay: 0.1s; transform: rotate(-15deg); }
        .cb-star-wrap:nth-child(3) { animation-delay: 0.3s; transform: rotate(15deg); }
        .cb-star-wrap.main-star {
            font-size: clamp(80px, 20vw, 120px);
            animation-delay: 0.5s; z-index: 2; margin-bottom: 20px;
        }
        .cb-star { animation: cbStarSpin 4s linear infinite; }
        @keyframes cbStarDrop {
            0% { transform: scale(0) translateY(-100px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes cbStarSpin {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
        }
        .cb-complete-emoji {
          font-size: clamp(90px, 28vw, 150px);
          animation: cbBounceBig 0.8s 0.8s cubic-bezier(0.2,0.8,0.2,1) both;
        }
        @keyframes cbBounceBig {
          0%   { transform: scale(0); }
          60%  { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        .cb-complete-btns { display: flex; gap: 22px; margin-top: 10px; animation: cbFadeIn 0.5s 1.2s both; }
        .cb-btn {
          width: 90px; height: 90px; font-size: 36px;
          border-radius: 50%; border: 5px solid #fff;
          box-shadow: 0 8px 0 rgba(0,0,0,0.15);
          cursor: pointer; font-family: 'Jua', sans-serif;
          transition: transform 0.1s;
          display: grid; place-items: center;
        }
        .cb-btn:active { transform: translateY(5px); box-shadow: 0 3px 0 rgba(0,0,0,0.15); }
        .cb-btn-replay { background: #4CAF50; }
        .cb-btn-home   { background: #FF9800; }
      `;
      document.head.appendChild(style);
      this.state.styleElement = style;
    },

    destroy: function() {
      this.clearBalloons();
      if (this.state.styleElement) {
        this.state.styleElement.remove();
        this.state.styleElement = null;
      }
      if (this.state.container) this.state.container.innerHTML = '';
      this.state.container = null;
      this.state.options = {};
      this.state.currentLevel = 1;
      this.state.isAnimating  = false;
      this.state.targetColor  = null;
    }
  };
})();
