/* ═══════════════════════════════════════════
   SIHYEON PLAY OS - COLOR BALLOON GAME MODULE
   js/games/color-balloon.js  (upgraded)
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
      { id: 'red',    name: '빨간색', hex: '#FF3B3B', dark: '#CC1F1F', bgTint: 'rgba(255,59,59,0.12)'   },
      { id: 'blue',   name: '파란색', hex: '#1E90FF', dark: '#1565C0', bgTint: 'rgba(30,144,255,0.12)'  },
      { id: 'yellow', name: '노란색', hex: '#FFD93D', dark: '#D4A017', bgTint: 'rgba(255,217,61,0.18)'  },
      { id: 'green',  name: '초록색', hex: '#4CAF50', dark: '#2E7D32', bgTint: 'rgba(76,175,80,0.12)'   },
      { id: 'purple', name: '보라색', hex: '#9C27B0', dark: '#6A1B9A', bgTint: 'rgba(156,39,176,0.12)'  },
      { id: 'pink',   name: '분홍색', hex: '#FF69B4', dark: '#C71585', bgTint: 'rgba(255,105,180,0.12)' }
    ],

    // 판별 풍선 수: 1판→2개, 2판→2개, 3판→3개, 4판→4개, 5판→4개
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

    // ─── 레벨 시작 ───────────────────────────────────────────
    startLevel: function() {
      if (this.state.currentLevel > this.state.maxLevel) {
        this.showCompleteScreen();
        return;
      }

      this.state.isAnimating = false;
      const container = this.state.container;

      // 진행 도트
      this.updateProgress();

      // 타겟 색 선택
      this.state.targetColor = this.colorPool[Math.floor(Math.random() * this.colorPool.length)];
      const color = this.state.targetColor;

      // 타겟 동그라미 업데이트
      const dot = container.querySelector('#cbTargetDot');
      if (dot) {
        dot.style.background  = `radial-gradient(circle at 35% 35%, #fff 0%, ${color.hex} 28%, ${color.dark} 100%)`;
        dot.style.boxShadow   = `0 0 0 4px #fff, 0 0 0 9px ${color.hex}, 0 6px 0 rgba(0,0,0,0.12)`;
      }

      // 배경 색조 반응
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
      const el = this.state.container.querySelector('#cbProgress');
      if (!el) return;
      let html = '';
      for (let i = 1; i <= this.state.maxLevel; i++) {
        html += `<span class="cb-dot ${i < this.state.currentLevel ? 'done' : i === this.state.currentLevel ? 'active' : ''}"></span>`;
      }
      el.innerHTML = html;
    },

    // ─── 풍선 스폰 ───────────────────────────────────────────
    startSpawningBalloons: function() {
      this.spawnBalloonBatch();
      this.state.spawnInterval = setInterval(() => {
        if (!this.state.isAnimating) this.spawnBalloonBatch();
      }, 3500);
    },

    spawnBalloonBatch: function() {
      const area = this.state.container.querySelector('#cbBalloonArea');
      if (!area) return;

      const count = this.balloonCountByLevel[this.state.currentLevel - 1] || 4;
      const target = this.state.targetColor;

      // 정답 1개 + 오답 (count-1)개 (중복 없이)
      let batch = [target];
      const others = [...this.colorPool.filter(c => c.id !== target.id)].sort(() => Math.random() - 0.5);
      for (let i = 0; i < count - 1; i++) batch.push(others[i % others.length]);
      batch.sort(() => Math.random() - 0.5);

      // 최대 30% 간격으로 배치 (화면 밖 방지)
      const slotWidth = Math.floor(70 / count);

      batch.forEach((color, idx) => {
        const isTarget  = color.id === target.id;
        const balloon   = document.createElement('div');
        balloon.className = isTarget ? 'cb-balloon cb-balloon-target' : 'cb-balloon';

        balloon.style.background = `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.85) 0%, ${color.hex} 22%, ${color.dark} 100%)`;

        // 30% 슬롯 내 랜덤 배치
        const leftPct = (idx * slotWidth) + Math.random() * (slotWidth - 5) + 2;
        balloon.style.left = `${leftPct}%`;

        // 속도: 7s~10s (느리게)
        const dur   = 7 + Math.random() * 3;
        const sway  = 1.8 + Math.random() * 1.4;
        const glowAnim = isTarget ? `, targetGlow 2s ease-in-out infinite` : '';
        balloon.style.animation = `cbFloatUp ${dur}s linear forwards, cbSway ${sway}s ease-in-out infinite alternate${glowAnim}`;

        balloon.dataset.colorId = color.id;
        balloon.addEventListener('click', () => this.handleBalloonClick(balloon, color));

        // 눈 (얼굴)
        ['eye-l', 'eye-r'].forEach(cls => {
          const eye = document.createElement('div');
          eye.className = `cb-eye ${cls}`;
          balloon.appendChild(eye);
        });

        // 매듭
        const knot = document.createElement('div');
        knot.className = 'cb-knot';
        knot.style.borderBottomColor = color.dark;
        balloon.appendChild(knot);

        // 실
        const str = document.createElement('div');
        str.className = 'cb-string';
        str.style.background = color.dark;
        balloon.appendChild(str);

        area.appendChild(balloon);
        setTimeout(() => { if (balloon.parentNode) balloon.remove(); }, dur * 1000);
      });
    },

    // ─── 클릭 핸들러 ─────────────────────────────────────────
    handleBalloonClick: function(balloonEl, color) {
      if (this.state.isAnimating) return;

      if (color.id === this.state.targetColor.id) {
        // ✅ 정답
        this.state.isAnimating = true;
        clearInterval(this.state.spawnInterval);

        this.spawnParticles(balloonEl, color);

        balloonEl.style.animation = 'none';
        balloonEl.className = 'cb-balloon cb-pop';

        playGameVoice('games.color.correct');
        if (this.state.options.speakGuide) this.state.options.speakGuide('맞았어! 팡!', true);
        if (this.state.options.fireConfetti) this.state.options.fireConfetti();

        // 나머지 풍선 페이드아웃
        this.state.container.querySelectorAll('.cb-balloon:not(.cb-pop)').forEach(b => {
          b.style.transition = 'opacity 0.6s';
          b.style.opacity = '0';
        });

        // 3.5초 후 다음 판 (성공 여운)
        setTimeout(() => {
          this.state.currentLevel++;
          this.startLevel();
        }, 3500);

      } else {
        // ❌ 오답: 흔들흔들 (중복 방지)
        if (balloonEl.classList.contains('cb-wobble')) return;
        balloonEl.classList.add('cb-wobble');
        setTimeout(() => { if (balloonEl) balloonEl.classList.remove('cb-wobble'); }, 500);

        playGameVoice('games.color.wrong');
        if (this.state.options.speakGuide) {
          this.state.options.speakGuide(`${this.state.targetColor.name}을 찾아보자!`, true);
        }
      }
    },

    // ─── 파티클 이펙트 ───────────────────────────────────────
    spawnParticles: function(balloonEl, color) {
      const area = this.state.container.querySelector('#cbBalloonArea');
      if (!area) return;

      const br  = balloonEl.getBoundingClientRect();
      const ar  = area.getBoundingClientRect();
      const cx  = br.left - ar.left + br.width  / 2;
      const cy  = br.top  - ar.top  + br.height / 2;

      const shapes = ['●', '●', '▲', '★', '●'];

      for (let i = 0; i < 10; i++) {
        const p   = document.createElement('span');
        p.className  = 'cb-particle';
        p.textContent = shapes[i % shapes.length];
        p.style.color = i % 2 === 0 ? color.hex : color.dark;
        p.style.left  = `${cx}px`;
        p.style.top   = `${cy}px`;

        const angle = (i / 10) * Math.PI * 2;
        const dist  = 55 + Math.random() * 70;
        p.style.setProperty('--pdx', `${Math.cos(angle) * dist}px`);
        p.style.setProperty('--pdy', `${Math.sin(angle) * dist}px`);
        p.style.animationDelay = `${i * 25}ms`;

        area.appendChild(p);
        p.addEventListener('animationend', () => p.remove());
      }
    },

    // ─── 완료 화면 ───────────────────────────────────────────
    showCompleteScreen: function() {
      this.clearBalloons();
      const wrapper = this.state.container.querySelector('#cbWrapper');
      if (!wrapper) return;

      const el = document.createElement('div');
      el.className = 'cb-complete';
      el.innerHTML = `
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
      const area = this.state.container?.querySelector('#cbBalloonArea');
      if (area) area.innerHTML = '';
    },

    // ─── 스타일 주입 ─────────────────────────────────────────
    injectStyles: function() {
      const existing = document.getElementById('sihyeon-color-balloon-style');
      if (existing) existing.remove();

      const style = document.createElement('style');
      style.id    = 'sihyeon-color-balloon-style';
      style.textContent = `
        /* ── 래퍼 ── */
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

        /* ── 구름 ── */
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

        /* ── 헤더 ── */
        .cb-header {
          position: relative; z-index: 10; flex-shrink: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 22px;
          background: rgba(255,255,255,0.72);
          box-shadow: 0 4px 14px rgba(0,0,0,0.07);
          border-radius: 0 0 26px 26px;
        }

        /* 진행 도트 */
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

        /* 타겟 동그라미 */
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

        /* ── 풍선 영역 ── */
        .cb-balloon-area {
          flex: 1; position: relative; z-index: 5;
          width: 100%; overflow: hidden;
        }

        /* ── 풍선 ── */
        .cb-balloon {
          position: absolute; bottom: -200px;
          width: clamp(130px, 24vw, 165px);
          height: clamp(160px, 30vw, 205px);
          border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
          box-shadow: inset -12px -12px 24px rgba(0,0,0,0.1), 0 10px 16px rgba(0,0,0,0.18);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: opacity 0.6s ease;
          user-select: none;
        }

        /* 타겟 풍선: 살짝 크고 빛나게 */
        .cb-balloon-target {
          width: clamp(155px, 28vw, 190px);
          height: clamp(190px, 34vw, 235px);
        }
        @keyframes targetGlow {
          0%, 100% { filter: brightness(1)   drop-shadow(0 0 6px rgba(255,255,255,0.5)); }
          50%       { filter: brightness(1.1) drop-shadow(0 0 18px rgba(255,255,255,0.95)); }
        }

        /* 눈 */
        .cb-eye {
          position: absolute; top: 37%;
          width: 11px; height: 11px;
          background: rgba(0,0,0,0.5);
          border-radius: 50%;
        }
        .eye-l { left: 30%; }
        .eye-r { right: 30%; }

        /* 매듭 */
        .cb-knot {
          position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%);
          width: 0; height: 0;
          border-left: 9px solid transparent;
          border-right: 9px solid transparent;
          border-bottom: 16px solid;
        }

        /* 실 */
        .cb-string {
          position: absolute; bottom: -56px; left: 50%; transform: translateX(-50%);
          width: 2px; height: 42px; opacity: 0.45;
        }

        /* 오답 흔들흔들 */
        .cb-balloon.cb-wobble { animation: cbWobble 0.5s ease-in-out !important; }
        @keyframes cbWobble {
          0%   { transform: rotate(0deg); }
          20%  { transform: rotate(-13deg); }
          40%  { transform: rotate(11deg); }
          60%  { transform: rotate(-9deg); }
          80%  { transform: rotate(6deg); }
          100% { transform: rotate(0deg); }
        }

        /* 터지는 애니메이션 */
        .cb-balloon.cb-pop { animation: cbPop 0.38s forwards !important; pointer-events: none; }
        @keyframes cbPop {
          0%   { transform: scale(1);   opacity: 1; }
          55%  { transform: scale(1.7); opacity: 0.7; }
          100% { transform: scale(2.3); opacity: 0; }
        }

        /* 파티클 */
        .cb-particle {
          position: absolute;
          font-size: clamp(14px, 3.5vw, 20px);
          pointer-events: none;
          z-index: 20;
          animation: cbParticleFly 0.75s ease-out forwards;
          line-height: 1;
        }
        @keyframes cbParticleFly {
          0%   { opacity: 1; transform: translate(0, 0) scale(1.2); }
          100% { opacity: 0; transform: translate(var(--pdx), var(--pdy)) scale(0.2); }
        }

        /* 올라가는 + 흔들림 */
        @keyframes cbFloatUp {
          from { bottom: -220px; }
          to   { bottom: 120vh; }
        }
        @keyframes cbSway {
          from { margin-left: -18px; }
          to   { margin-left: 18px; }
        }

        /* ── 완료 화면 ── */
        .cb-complete {
          position: absolute; inset: 0; z-index: 30;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 32px;
          animation: cbFadeIn 0.45s ease;
        }
        @keyframes cbFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .cb-complete-emoji {
          font-size: clamp(90px, 28vw, 150px);
          animation: cbBounceBig 0.65s cubic-bezier(0.2,0.8,0.2,1);
        }
        @keyframes cbBounceBig {
          0%   { transform: scale(0); }
          70%  { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        .cb-complete-btns { display: flex; gap: 22px; }
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

    // ─── 정리 ────────────────────────────────────────────────
    destroy: function() {
      this.clearBalloons();
      if (this.state.styleElement) {
        this.state.styleElement.remove();
        this.state.styleElement = null;
      }
      if (this.state.container) this.state.container.innerHTML = '';
      this.state.currentLevel = 1;
      this.state.isAnimating  = false;
      this.state.targetColor  = null;
    }
  };
})();
