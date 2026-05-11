/**
 * 시현이 놀이터 OS — 부릉부릉 길찾기 (Coding Car)
 * 파일: js/games/coding-car.js
 * 설명: 4살 시현이를 위한 방향 화살표 기반 코딩(순서) 놀이
 */

(function () {
  const GAME_KEY    = 'codingCar';
  const STYLE_ID    = 'sihyeon-coding-car-style';
  const MANIFEST_URL = './assets/vehicles/vehicles_manifest.json';
  
  // 맵 크기 및 명령 제한
  const GRID_SIZE = 3; 
  const MAX_COMMANDS = 4;

  const state = {
    container:  null,
    options:    {},
    vehicle:    null,
    commands:   [],
    carX:       0, // 시작 X (왼쪽)
    carY:       2, // 시작 Y (아래)
    locked:     false,
    destroyed:  false,
  };

  // ── CSS injectStyle() ──────────────────────────────────
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .cc-root {
        width: 100%; height: 100%;
        display: flex; flex-direction: column;
        background: linear-gradient(180deg, #81D4FA 0%, #B3E5FC 30%, #C8E6C9 100%);
        font-family: 'Arial Rounded MT Bold', 'Nanum Gothic', sans-serif;
        box-sizing: border-box;
        user-select: none;
        touch-action: none;
        overflow: hidden;
      }
      
      /* 헤더 영역 */
      .cc-header {
        text-align: center;
        padding: 16px;
        font-size: clamp(20px, 5vw, 26px);
        font-weight: 900;
        color: #333;
        text-shadow: 2px 2px 0 #fff;
        flex-shrink: 0;
      }

      /* 맵 영역 (3x3 그리드) */
      .cc-map-container {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
      }
      .cc-map {
        width: clamp(280px, 90vw, 400px);
        height: clamp(280px, 90vw, 400px);
        background: #81C784;
        border: 8px solid #4CAF50;
        border-radius: 16px;
        position: relative;
        box-shadow: 0 10px 20px rgba(0,0,0,0.15);
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
      }
      .cc-cell {
        border: 2px dashed rgba(255,255,255,0.3);
        box-sizing: border-box;
      }

      /* 차고지 (도착점: 우측 상단 2,0) */
      .cc-garage {
        position: absolute;
        width: 33.33%; height: 33.33%;
        top: 0; left: 66.66%;
        background-image: url('./assets/games/codingCar/garage.png');
        background-size: 80%;
        background-position: center;
        background-repeat: no-repeat;
        z-index: 5;
      }

      /* 자동차 */
      .cc-car-wrapper {
        position: absolute;
        width: 33.33%; height: 33.33%;
        top: 0; left: 0;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        will-change: transform;
      }
      .cc-car-img {
        max-width: 80%; max-height: 80%;
        object-fit: contain;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
      }

      /* UI 영역 (명령 슬롯 + 버튼) */
      .cc-ui-area {
        background: rgba(255,255,255,0.85);
        border-radius: 30px 30px 0 0;
        padding: 20px 10px;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
        display: flex; flex-direction: column; gap: 16px;
        flex-shrink: 0;
      }

      /* 명령 슬롯 */
      .cc-slots {
        display: flex; justify-content: center; gap: 10px;
        height: 60px;
      }
      .cc-slot {
        width: 60px; height: 60px;
        background: #eceff1;
        border: 4px solid #cfd8dc;
        border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s;
      }
      .cc-slot img {
        width: 80%; height: 80%; object-fit: contain;
        animation: cc-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .cc-slot.active { border-color: #2196F3; background: #e3f2fd; }

      /* 방향 화살표 버튼 그룹 */
      .cc-controls {
        display: flex; justify-content: center; align-items: center; gap: 12px;
      }
      .cc-btn-arrow {
        width: clamp(60px, 15vw, 80px);
        height: clamp(60px, 15vw, 80px);
        background: transparent; border: none; padding: 0;
        cursor: pointer;
        transition: transform 0.1s;
        -webkit-tap-highlight-color: transparent;
      }
      .cc-btn-arrow:active { transform: scale(0.9); }
      .cc-btn-arrow img { width: 100%; height: 100%; object-fit: contain; }

      /* 출발 버튼 */
      .cc-btn-go {
        padding: 0 24px;
        height: clamp(60px, 15vw, 80px);
        background: #FF5252;
        border: none; border-radius: 20px;
        color: white; font-size: clamp(20px, 5vw, 26px); font-weight: 900;
        box-shadow: 0 6px 0 #D32F2F;
        cursor: pointer;
        transition: transform 0.1s, box-shadow 0.1s;
      }
      .cc-btn-go:active {
        transform: translateY(6px); box-shadow: 0 0 0 #D32F2F;
      }
      .cc-btn-go:disabled {
        background: #ccc; box-shadow: 0 6px 0 #999; transform: none; cursor: not-allowed;
      }

      /* 성공 오버레이 */
      .cc-success-overlay {
        position: absolute; inset: 0;
        background: rgba(255,255,255,0.85); backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        z-index: 200; animation: cc-fade-in 0.4s ease;
      }
      .cc-success-box {
        background: #fff; padding: 30px; border-radius: 30px;
        border: 6px solid #4CAF50; text-align: center;
        box-shadow: 0 16px 40px rgba(0,0,0,0.2);
        animation: cc-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .cc-btn-home {
        margin-top: 20px; padding: 12px 24px; border-radius: 999px;
        font-size: 18px; font-weight: 900; color: #fff;
        background: #FF9800; border: none; box-shadow: 0 4px 0 #F57C00;
      }

      @keyframes cc-pop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      @keyframes cc-fade-in { from { opacity: 0; } to { opacity: 1; } }
    `;
    document.head.appendChild(style);
  }

  // ── 자동차 데이터 불러오기 ──────────────────────────────
  async function fetchVehicle() {
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
      const json = await res.json();
      const list = Array.isArray(json.vehicles) ? json.vehicles : [];
      if (list.length > 0) {
        // 소방차나 버스, 경찰차 중 랜덤 선택 (아이들이 좋아하는 차)
        const favs = list.filter(v => ['pump_engine','bus','police_car','excavator'].includes(v.id));
        const pool = favs.length > 0 ? favs : list;
        return pool[Math.floor(Math.random() * pool.length)];
      }
    } catch (e) {
      console.warn("Failed to load vehicle manifest, using fallback");
    }
    return { name: '소방차', file: './assets/vehicles/fire/pump_engine.png' };
  }

  // ── 게임 초기화 및 렌더링 ─────────────────────────────
  function startGame() {
    state.commands = [];
    state.carX = 0; // 시작 위치: 왼쪽 아래 (0, 2)
    state.carY = 2;
    state.locked = false;
    renderBoard();
    
    if (window.SihyeonVoice && window.SihyeonVoice.play) {
      window.SihyeonVoice.play('games.coding.intro', '차고지까지 화살표를 눌러서 길을 만들어줘!');
    } else if (state.options.speakGuide) {
      state.options.speakGuide('차고지까지 화살표를 눌러서 길을 만들어줘!', true);
    }
  }

  function renderBoard() {
    const rootHTML = `
      <div class="cc-root">
        <div class="cc-header">🏁 차고지로 출발!</div>
        
        <div class="cc-map-container">
          <div class="cc-map">
            ${Array(9).fill('<div class="cc-cell"></div>').join('')}
            <div class="cc-garage"></div>
            <div class="cc-car-wrapper" id="ccCar" style="transform: translate(0%, 200%);">
              <img src="${state.vehicle.file}" class="cc-car-img" alt="자동차">
            </div>
          </div>
        </div>

        <div class="cc-ui-area">
          <div class="cc-slots" id="ccSlots">
            ${Array(MAX_COMMANDS).fill('<div class="cc-slot"></div>').join('')}
          </div>
          
          <div class="cc-controls">
            <button class="cc-btn-arrow" data-dir="up"><img src="./assets/games/codingCar/arrow-up.webp" alt="위"></button>
            <button class="cc-btn-arrow" data-dir="down"><img src="./assets/games/codingCar/arrow-down.webp" alt="아래"></button>
            <button class="cc-btn-arrow" data-dir="left"><img src="./assets/games/codingCar/arrow-left.webp" alt="왼쪽"></button>
            <button class="cc-btn-arrow" data-dir="right"><img src="./assets/games/codingCar/arrow-right.webp" alt="오른쪽"></button>
            <button class="cc-btn-go" id="ccGoBtn">GO!</button>
          </div>
        </div>
      </div>
    `;
    state.container.innerHTML = rootHTML;
    bindEvents();
  }

  // ── 이벤트 바인딩 ──────────────────────────────────────
  function bindEvents() {
    const root = state.container.querySelector('.cc-root');
    
    // 방향 버튼 클릭
    root.querySelectorAll('.cc-btn-arrow').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.locked || state.commands.length >= MAX_COMMANDS) return;
        const dir = btn.dataset.dir;
        state.commands.push(dir);
        updateSlotsUI();
        playSound('sfx.pop', '버튼');
      });
    });

    // 슬롯 클릭 (명령 취소)
    const slots = root.querySelectorAll('.cc-slot');
    slots.forEach((slot, index) => {
      slot.addEventListener('click', () => {
        if (state.locked) return;
        // 가장 마지막 명령을 지우기 (단순화)
        if (state.commands.length > 0 && index === state.commands.length - 1) {
          state.commands.pop();
          updateSlotsUI();
          playSound('sfx.cancel', '취소');
        }
      });
    });

    // 출발 버튼
    root.querySelector('#ccGoBtn').addEventListener('click', () => {
      if (state.locked || state.commands.length === 0) return;
      executeCommands();
    });
  }

  function updateSlotsUI() {
    const slots = state.container.querySelectorAll('.cc-slot');
    slots.forEach((slot, i) => {
      slot.innerHTML = '';
      slot.classList.remove('active');
      if (i < state.commands.length) {
        const dir = state.commands[i];
        slot.innerHTML = `<img src="./assets/games/codingCar/arrow-${dir}.webp">`;
        slot.classList.add('active');
      }
    });
  }

  // ── 애니메이션 및 실행 ─────────────────────────────────
  async function executeCommands() {
    state.locked = true;
    const carEl = state.container.querySelector('#ccCar');
    const goBtn = state.container.querySelector('#ccGoBtn');
    goBtn.disabled = true;

    if (window.SihyeonVoice) window.SihyeonVoice.play('games.coding.go', '부릉부릉 출발!');

    // 명령 순차 실행
    for (let i = 0; i < state.commands.length; i++) {
      const dir = state.commands[i];
      
      // 슬롯 하이라이트 (현재 실행중인 명령)
      const slots = state.container.querySelectorAll('.cc-slot');
      slots.forEach(s => s.style.borderColor = '#cfd8dc');
      slots[i].style.borderColor = '#FF5252';

      let nextX = state.carX;
      let nextY = state.carY;
      if (dir === 'up') nextY--;
      if (dir === 'down') nextY++;
      if (dir === 'left') nextX--;
      if (dir === 'right') nextX++;

      // 벽에 부딪히는 경우 체크
      if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
        await bumpAnimation(carEl, dir);
        break; // 루프 중단
      } else {
        await jumpAnimation(carEl, state.carX, state.carY, nextX, nextY);
        state.carX = nextX;
        state.carY = nextY;
      }
      // 한 칸 이동 후 짧은 대기
      await new Promise(r => setTimeout(r, 200));
    }

    // 결과 판정
    checkResult();
  }

  // 통통 튀면서 이동하는 애니메이션
  async function jumpAnimation(el, oldX, oldY, newX, newY) {
    playSound('sfx.hop', '폴짝!');
    
    // wrapper가 33.33% 크기이므로, 100% 이동하면 다음 칸으로 감
    const startX = oldX * 100; const startY = oldY * 100;
    const endX = newX * 100;   const endY = newY * 100;
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    const anim = el.animate([
      { transform: `translate(${startX}%, ${startY}%) scale(1)` },
      // 중간에 살짝 위로 뜨기 (점프 효과)
      { transform: `translate(${midX}%, calc(${midY}% - 20%)) scale(1.1)`, offset: 0.5 },
      { transform: `translate(${endX}%, ${endY}%) scale(1)` }
    ], { duration: 400, easing: 'ease-in-out' });

    await anim.finished;
    el.style.transform = `translate(${endX}%, ${endY}%)`;
  }

  // 벽에 부딪혔을 때 살짝 흔들리는 효과
  async function bumpAnimation(el, dir) {
    playSound('sfx.wrong', '쿵!');
    const currX = state.carX * 100;
    const currY = state.carY * 100;
    
    let bumpX = currX, bumpY = currY;
    if (dir === 'up') bumpY -= 20;
    if (dir === 'down') bumpY += 20;
    if (dir === 'left') bumpX -= 20;
    if (dir === 'right') bumpX += 20;

    const anim = el.animate([
      { transform: `translate(${currX}%, ${currY}%)` },
      { transform: `translate(${bumpX}%, ${bumpY}%)`, offset: 0.3 },
      { transform: `translate(${currX}%, ${currY}%)` }
    ], { duration: 300, easing: 'ease-in-out' });

    await anim.finished;
  }

  // ── 결과 판정 ─────────────────────────────────────────
  function checkResult() {
    // 도착점은 우측 상단 (2, 0)
    if (state.carX === 2 && state.carY === 0) {
      showSuccess();
    } else {
      // 실패 시 원래 자리로 돌아가기
      if (window.SihyeonVoice) window.SihyeonVoice.play('games.coding.fail', '어라? 길을 잃었네. 다시 해보자!');
      else if (state.options.speakGuide) state.options.speakGuide('어라? 길을 잃었네. 다시 해보자!', true);
      
      setTimeout(() => {
        startGame(); // 상태 초기화 후 다시 시작
      }, 1500);
    }
  }

  function showSuccess() {
    if (state.options.fireConfetti) state.options.fireConfetti();
    if (window.SihyeonVoice) window.SihyeonVoice.play('games.coding.success', '우와! 차고지에 도착했어. 참 잘했어!');
    else if (state.options.speakGuide) state.options.speakGuide('우와! 차고지에 도착했어. 참 잘했어!', true);

    const overlay = document.createElement('div');
    overlay.className = 'cc-success-overlay';
    overlay.innerHTML = `
      <div class="cc-success-box">
        <div style="font-size:64px;">🏁🎉</div>
        <div style="font-size:32px; font-weight:900; color:#333; margin:10px 0;">완벽해!</div>
        <button class="cc-btn-home">🏠 홈으로</button>
      </div>
    `;
    state.container.appendChild(overlay);

    overlay.querySelector('.cc-btn-home').addEventListener('click', () => {
      if (state.options.closeToParkHome) state.options.closeToParkHome();
    });
  }

  // 유틸: 간단한 사운드 
  function playSound(key, fallbackText) {
    if (window.SihyeonVoice && window.SihyeonVoice.play) {
      window.SihyeonVoice.play(key, '').catch(()=>{});
    }
  }

  // ── Public API ─────────────────────────────────────────
  async function render(container, options = {}) {
    destroy();
    state.container = container;
    state.options = options;
    state.destroyed = false;
    
    injectStyle();
    
    container.innerHTML = '<div style="padding:30px; text-align:center; color:#333; font-size:22px; height:100%; background:#B3E5FC;">자동차 부르는 중...</div>';
    
    state.vehicle = await fetchVehicle();
    if (state.destroyed) return;
    
    startGame();
  }

  function destroy() {
    state.destroyed = true;
    if (state.container) state.container.innerHTML = '';
    state.container = null;
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
})();
