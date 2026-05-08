/* ═══════════════════════════════════════════
   SIHYEON PLAY OS - COLOR BALLOON GAME MODULE
   js/games/color-balloon.js
═══════════════════════════════════════════ */

(function() {
  window.SihyeonGames = window.SihyeonGames || {};

  window.SihyeonGames.colorBalloon = {
    id: 'colorBalloon',
    title: '🎈 색깔 풍선 팡팡!',
    
    state: {
      currentLevel: 1,
      maxLevel: 5,
      targetColor: null,
      correctCount: 0,
      container: null,
      styleElement: null,
      isAnimating: false,
      spawnInterval: null,
      options: {}
    },

    // 4~5세가 명확하게 구분할 수 있는 기본 색상 풀
    colorPool: [
      { id: 'red', name: '빨간색', hex: '#FF3B3B', dark: '#CC1F1F' },
      { id: 'blue', name: '파란색', hex: '#1E90FF', dark: '#1565C0' },
      { id: 'yellow', name: '노란색', hex: '#FFD93D', dark: '#F5B041' },
      { id: 'green', name: '초록색', hex: '#4CAF50', dark: '#2E7D32' },
      { id: 'purple', name: '보라색', hex: '#9C27B0', dark: '#6A1B9A' },
      { id: 'pink', name: '분홍색', hex: '#FF69B4', dark: '#C71585' }
    ],

    render: function(container, options = {}) {
      this.destroy(); // 기존 상태 완벽 초기화
      
      this.state.container = container;
      this.state.options = options;
      
      this.injectStyles();

      // 게임 레이아웃 스캐폴딩
      container.innerHTML = `
        <div class="balloon-game-wrapper">
          <div class="bg-sky"></div>
          <div class="bg-cloud b-c1"></div>
          <div class="bg-cloud b-c2"></div>
          <div class="bg-cloud b-c3"></div>
          
          <div class="game-header">
            <h1 class="game-title">🎈 색깔 풍선 팡팡!</h1>
            <div class="level-badge" id="cbLevelBadge">1 / 5</div>
          </div>
          
          <div class="mission-area">
            <div class="mission-card" id="cbMissionCard">
              <span id="cbTargetColorText" class="target-text">빨간색</span> 풍선을 터뜨려봐!
            </div>
          </div>

          <div class="balloon-area" id="cbBalloonArea"></div>
          
          <div class="interaction-area" id="cbInteractionArea">
            <div class="success-panel" id="cbSuccessPanel" style="display: none;">
              <h2 class="success-title">🎉 우와! 시현이 최고!</h2>
              <div class="action-buttons">
                <button class="action-btn btn-replay" id="cbRestartBtn">🔁 다시 하기</button>
                <button class="action-btn btn-home" id="cbPlazaBtn">🏠 광장으로</button>
              </div>
            </div>
          </div>
        </div>
      `;

      this.attachEvents();
      this.startLevel();
    },

    startLevel: function() {
      if (this.state.currentLevel > this.state.maxLevel) {
        this.showCompleteScreen();
        return;
      }

      this.state.isAnimating = false;
      const container = this.state.container;
      
      // UI 업데이트
      container.querySelector('#cbLevelBadge').textContent = `${this.state.currentLevel} / ${this.state.maxLevel}`;
      
      // 타겟 색상 랜덤 선택
      this.state.targetColor = this.colorPool[Math.floor(Math.random() * this.colorPool.length)];
      
      const missionText = container.querySelector('#cbTargetColorText');
      missionText.textContent = this.state.targetColor.name;
      missionText.style.color = this.state.targetColor.hex;

      // 음성 가이드
      if (this.state.options.speakGuide) {
        this.state.options.speakGuide(`${this.state.targetColor.name} 풍선을 찾아봐!`, true);
      }

      this.clearBalloons();
      this.startSpawningBalloons();
    },

    startSpawningBalloons: function() {
      this.spawnBalloonBatch(); // 즉시 한 묶음 생성
      
      // 2초마다 계속 새로운 풍선 묶음 생성
      this.state.spawnInterval = setInterval(() => {
        if (!this.state.isAnimating) {
          this.spawnBalloonBatch();
        }
      }, 2000);
    },

    spawnBalloonBatch: function() {
      const area = this.state.container.querySelector('#cbBalloonArea');
      if (!area) return;

      // 한 번에 3~4개의 풍선 생성 (반드시 정답 1개 포함)
      let batchColors = [this.state.targetColor];
      while (batchColors.length < 4) {
        const randomColor = this.colorPool[Math.floor(Math.random() * this.colorPool.length)];
        if (!batchColors.includes(randomColor)) {
          batchColors.push(randomColor);
        }
      }
      
      // 색상 섞기
      batchColors.sort(() => Math.random() - 0.5);

      batchColors.forEach((color, index) => {
        const balloon = document.createElement('div');
        balloon.className = 'balloon';
        
        // 3D 느낌의 그라데이션 적용
        balloon.style.background = `radial-gradient(circle at 30% 30%, #fff 0%, ${color.hex} 20%, ${color.dark} 100%)`;
        
        // 위치 및 애니메이션 랜덤화 (겹치지 않게 가로 영역 분할)
        const leftPos = (index * 25) + (Math.random() * 10); 
        balloon.style.left = `${leftPos}%`;
        
        // 올라가는 속도와 흔들림 정도 랜덤화
        const duration = 4 + Math.random() * 3; // 4s ~ 7s
        balloon.style.animation = `floatUp ${duration}s linear forwards, sway ${2 + Math.random()}s ease-in-out infinite alternate`;
        
        // 데이터 저장 및 클릭 이벤트
        balloon.dataset.colorId = color.id;
        balloon.onclick = () => this.handleBalloonClick(balloon, color);
        
        // 매듭 (풍선 꼬리)
        const knot = document.createElement('div');
        knot.className = 'balloon-knot';
        knot.style.borderBottomColor = color.dark;
        balloon.appendChild(knot);

        area.appendChild(balloon);

        // 화면 밖으로 나간 풍선 제거
        setTimeout(() => {
          if (balloon && balloon.parentNode) {
            balloon.remove();
          }
        }, duration * 1000);
      });
    },

    handleBalloonClick: function(balloonElement, color) {
      if (this.state.isAnimating) return;

      if (color.id === this.state.targetColor.id) {
        // 정답!
        this.state.isAnimating = true;
        clearInterval(this.state.spawnInterval);

        // 정답 풍선 터지는 이펙트
        balloonElement.style.animation = 'none';
        balloonElement.className = 'balloon pop';
        
        if (this.state.options.speakGuide) {
          this.state.options.speakGuide(`맞았어! 팡!`, true);
        }
        if (this.state.options.fireConfetti) {
          this.state.options.fireConfetti();
        }

        // 다른 풍선들은 투명하게 사라짐
        const allBalloons = this.state.container.querySelectorAll('.balloon:not(.pop)');
        allBalloons.forEach(b => b.style.opacity = '0');

        setTimeout(() => {
          this.state.currentLevel++;
          this.startLevel();
        }, 2000);

      } else {
        // 오답: 부드러운 튕김 효과
        balloonElement.style.transform = 'scale(0.9)';
        setTimeout(() => {
          if (balloonElement) balloonElement.style.transform = '';
        }, 150);
        
        if (this.state.options.speakGuide) {
          this.state.options.speakGuide(`어라? ${this.state.targetColor.name}을 찾아보자!`, true);
        }
      }
    },

    clearBalloons: function() {
      clearInterval(this.state.spawnInterval);
      const area = this.state.container.querySelector('#cbBalloonArea');
      if (area) area.innerHTML = '';
    },

    showCompleteScreen: function() {
      this.clearBalloons();
      const container = this.state.container;
      const successPanel = container.querySelector('#cbSuccessPanel');
      const missionArea = container.querySelector('.mission-area');
      
      missionArea.style.display = 'none';
      successPanel.style.display = 'flex';

      if (this.state.options.speakGuide) {
        this.state.options.speakGuide("우와! 풍선을 다 터뜨렸어. 시현이가 최고야!", true);
      }
      if (this.state.options.fireConfetti) this.state.options.fireConfetti();
      if (this.state.options.gainExp) this.state.options.gainExp(25);
    },

    attachEvents: function() {
      const container = this.state.container;
      if (!container) return;
      
      const btnRestart = container.querySelector('#cbRestartBtn');
      const btnPlaza = container.querySelector('#cbPlazaBtn');
      
      if (btnRestart) btnRestart.onclick = () => {
        this.state.currentLevel = 1;
        container.querySelector('.mission-area').style.display = 'flex';
        container.querySelector('#cbSuccessPanel').style.display = 'none';
        this.startLevel();
      };
      
      if (btnPlaza) btnPlaza.onclick = () => {
        if (this.state.options.closeToParkHome) this.state.options.closeToParkHome();
      };
    },

    injectStyles: function() {
      if (this.state.styleElement) return;
      if (document.getElementById('sihyeon-color-balloon-style')) {
        document.getElementById('sihyeon-color-balloon-style').remove();
      }

      const style = document.createElement('style');
      style.id = 'sihyeon-color-balloon-style';
      style.textContent = `
        .balloon-game-wrapper {
          width: 100%; height: 100%; min-height: 100vh;
          position: relative; overflow: hidden;
          font-family: 'Jua', sans-serif;
          background: linear-gradient(180deg, #87CEEB 0%, #E0F7FA 100%);
          display: flex; flex-direction: column;
        }

        /* 하늘 배경 장식 */
        .bg-sky { position: absolute; inset: 0; z-index: 0; }
        .bg-cloud { position: absolute; background: #fff; border-radius: 50px; opacity: 0.8; z-index: 1; pointer-events: none; }
        .bg-cloud::before, .bg-cloud::after { content: ''; position: absolute; background: #fff; border-radius: 50%; }
        .b-c1 { width: 140px; height: 50px; top: 15%; left: -20%; animation: floatCloud 25s linear infinite; }
        .b-c1::before { width: 60px; height: 60px; top: -25px; left: 20px; }
        .b-c1::after { width: 70px; height: 70px; top: -35px; left: 50px; }
        .b-c2 { width: 100px; height: 35px; top: 35%; right: -20px; animation: floatCloud 35s linear infinite reverse; }
        .b-c2::before { width: 40px; height: 40px; top: -15px; left: 15px; }
        .b-c2::after { width: 50px; height: 50px; top: -20px; left: 40px; }
        .b-c3 { width: 120px; height: 40px; top: 60%; left: 30%; animation: floatCloud 30s linear infinite; opacity: 0.5; }
        .b-c3::before { width: 45px; height: 45px; top: -20px; left: 20px; }
        .b-c3::after { width: 55px; height: 55px; top: -25px; left: 45px; }
        @keyframes floatCloud { from { transform: translateX(-50vw); } to { transform: translateX(120vw); } }

        /* 상단 헤더 */
        .game-header {
          position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 15px 20px; background: rgba(255,255,255,0.7);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-radius: 0 0 24px 24px;
        }
        .game-title { margin: 0; font-size: clamp(24px, 6vw, 32px); color: #FF7A1A; text-shadow: 0 2px 0 #fff; }
        .level-badge { background: #1E90FF; color: white; padding: 6px 16px; border-radius: 99px; font-size: 20px; font-weight: bold; border: 3px solid #fff; box-shadow: 0 4px 0 rgba(0,0,0,0.1); }

        /* 미션 안내 영역 */
        .mission-area {
          position: relative; z-index: 10;
          display: flex; justify-content: center; margin-top: 20px; padding: 0 20px;
        }
        .mission-card {
          background: #fff; border: 5px solid #FFD93D; border-radius: 999px;
          padding: 10px 30px; font-size: clamp(22px, 6vw, 32px); font-weight: bold;
          color: #333; box-shadow: 0 8px 0 #E65100, 0 10px 20px rgba(0,0,0,0.15);
          text-align: center;
        }
        .target-text { text-shadow: 0 2px 0 #f0f0f0; }

        /* 풍선 영역 */
        .balloon-area {
          flex: 1; position: relative; z-index: 5;
          width: 100%; overflow: hidden;
        }

        /* 풍선 디자인 */
        .balloon {
          position: absolute; bottom: -120px;
          width: clamp(80px, 20vw, 120px); height: clamp(100px, 25vw, 150px);
          border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
          box-shadow: inset -10px -10px 20px rgba(0,0,0,0.1), 0 10px 15px rgba(0,0,0,0.2);
          cursor: pointer; -webkit-tap-highlight-color: transparent;
          transition: opacity 0.5s ease, transform 0.1s ease;
        }
        
        .balloon-knot {
          position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%);
          width: 0; height: 0;
          border-left: 8px solid transparent; border-right: 8px solid transparent;
          border-bottom: 15px solid; /* 색상은 JS에서 지정 */
        }

        /* 터지는 애니메이션 */
        .balloon.pop {
          animation: popEffect 0.3s forwards !important;
          pointer-events: none;
        }
        @keyframes popEffect {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }

        /* 올라가는 애니메이션 */
        @keyframes floatUp {
          from { bottom: -150px; }
          to { bottom: 120vh; }
        }
        @keyframes sway {
          from { margin-left: -20px; }
          to { margin-left: 20px; }
        }

        /* 하단 성공 패널 */
        .interaction-area { position: absolute; bottom: 30px; left: 0; right: 0; padding: 0 20px; z-index: 20; display: flex; justify-content: center; }
        .success-panel {
          flex-direction: column; align-items: center; width: 100%; max-width: 500px;
          background: rgba(255, 255, 255, 0.95); padding: 25px;
          border: 5px solid #FFD93D; border-radius: 30px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          animation: popUpPanel 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes popUpPanel { from { opacity: 0; transform: translateY(50px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
        
        .success-title { font-size: clamp(24px, 6vw, 32px); color: #FF7A1A; margin: 0 0 20px 0; text-shadow: 0 2px 0 #FFF9C4; }
        .action-buttons { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; width: 100%; }
        .action-btn {
          flex: 1; min-width: 130px; min-height: 60px; font-size: 20px; font-weight: bold; font-family: 'Jua', sans-serif;
          border-radius: 999px; border: 4px solid #fff; box-shadow: 0 6px 0 rgba(0,0,0,0.15); transition: transform 0.1s; cursor: pointer;
        }
        .action-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 rgba(0,0,0,0.15); }
        .btn-replay { background: #4CAF50; color: white; }
        .btn-home { background: #FF9800; color: white; }
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
      if (this.state.container) {
        this.state.container.innerHTML = '';
      }
      this.state.currentLevel = 1;
      this.state.correctCount = 0;
      this.state.isAnimating = false;
    }
  };
})();