// [수정본]
/**
 * 시현이 놀이터 OS — 주차장 미니게임 (Parking Lot)
 * 파일: js/games/parking-lot.js
 * 수정: 글자 힌트 제거 및 실루엣(그림자) 힌트 도입, 자동차 이름 텍스트 제거
 */

(function () {
  const GAME_KEY    = 'parkingLot';
  const STYLE_ID    = 'sihyeon-parking-lot-style';
  const MANIFEST_URL = './assets/vehicles/vehicles_manifest.json';
  const SLOT_COUNT  = 4;

  const CATEGORY_META = {
    fire:         { label: '🚒소방차', color: '#FF5252' },
    rescue:       { label: '🚑구조대', color: '#FF9800' },
    construction: { label: '🏗️공사차', color: '#FFC107' },
    transport:    { label: '🚌교통',   color: '#2196F3' },
    airport:      { label: '✈️공항',   color: '#42A5F5' },
    farm:         { label: '🚜농장',   color: '#66BB6A' },
    port:         { label: '⚓항구',   color: '#26A69A' },
    road_service: { label: '🛣️도로',   color: '#78909C' },
    military_special: { label: '🛡️특수', color: '#8D6E63' },
    town:         { label: '🏘️동네',   color: '#EC407A' },
  };

  const state = {
    container:  null,
    options:    {},
    allVehicles: {},   
    selectedCat: 'transport',
    slots:      [],    
    cars:       [],
    filledCount: 0,
    round:      1,
    locked:     false,
    destroyed:  false,
  };

  // ── CSS injectStyle() ──────────────────────────────────
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .pl-root {
        width: 100%; height: 100%;
        display: flex; flex-direction: column;
        background: linear-gradient(160deg, #e0f7fa 0%, #b2ebf2 100%);
        overflow: hidden;
        position: relative;
        font-family: 'Arial Rounded MT Bold', 'Nanum Gothic', sans-serif;
        box-sizing: border-box;
        user-select: none;
        touch-action: none;
      }
      
      /* 상단 카테고리 바 */
      .pl-cat-bar {
        display: flex; gap: 8px;
        padding: 12px;
        overflow-x: auto;
        scrollbar-width: none;
        background: rgba(255,255,255,0.6);
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        flex-shrink: 0;
        z-index: 10;
      }
      .pl-cat-bar::-webkit-scrollbar { display: none; }
      
      .pl-cat-chip {
        flex-shrink: 0;
        padding: 10px 16px;
        border-radius: 20px;
        background: #fff;
        border: 3px solid transparent;
        box-shadow: 0 4px 0 rgba(0,0,0,0.1);
        font-size: clamp(14px, 4vw, 18px);
        font-weight: 900;
        color: #333;
        cursor: pointer;
        transition: transform 0.1s, border-color 0.2s;
        -webkit-tap-highlight-color: transparent;
      }
      .pl-cat-chip:active { transform: translateY(4px); box-shadow: 0 0 0 rgba(0,0,0,0.1); }
      .pl-cat-chip.active {
        border-color: #4CAF50;
        color: #4CAF50;
        background: #f1f8e9;
      }

      /* 주차장 (위) */
      .pl-slots-area {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        padding: 16px;
        flex-shrink: 0;
      }
      @media (min-width: 600px) {
        .pl-slots-area { grid-template-columns: repeat(4, 1fr); }
      }
      
      .pl-slot {
        background: #fff;
        border-radius: 20px;
        border: 5px solid #ccc;
        min-height: clamp(100px, 25vw, 140px);
        display: flex; align-items: center; justify-content: center;
        flex-direction: column;
        position: relative;
        box-shadow: inset 0 4px 10px rgba(0,0,0,0.05);
        transition: all 0.3s;
      }

      /* 힌트 이미지 (연한 그림자) */
      .pl-slot-img {
        max-width: 85%; max-height: 85%;
        object-fit: contain;
        display: block;
        opacity: 0.15;
        filter: grayscale(100%) brightness(0.8);
        transition: all 0.4s ease;
      }

      .pl-slot-check {
        position: absolute;
        top: -12px; right: -12px;
        font-size: clamp(24px, 7vw, 36px);
        background: #fff; border-radius: 50%;
        display: none;
        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        z-index: 5;
      }
      
      /* 정답 시 효과: 선명해지고 체크 마크 표시 */
      .pl-slot.correct {
        border-color: #4CAF50 !important;
        background: #e8f5e9;
      }
      .pl-slot.correct .pl-slot-img { 
        opacity: 1; 
        filter: grayscale(0%) brightness(1); 
        animation: pl-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .pl-slot.correct .pl-slot-check { display: block; }

      /* 대기 차량 (아래) */
      .pl-cars-area {
        flex: 1;
        display: flex; flex-wrap: wrap;
        align-items: center; justify-content: center;
        gap: 16px;
        padding: 16px;
        background: rgba(255,255,255,0.3);
        border-radius: 30px 30px 0 0;
        position: relative;
      }
      
      .pl-car-drag {
        width: clamp(90px, 22vw, 130px);
        height: clamp(90px, 22vw, 130px);
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.15);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        cursor: grab;
        touch-action: none;
        position: relative;
        will-change: transform;
      }
      .pl-car-drag:active { cursor: grabbing; }
      .pl-car-drag.dragging {
        opacity: 0.85;
        box-shadow: 0 16px 32px rgba(0,0,0,0.3);
      }
      
      /* 글자가 없어졌으므로 이미지를 조금 더 크게 키움 */
      .pl-car-drag img {
        max-width: 85%; max-height: 85%;
        object-fit: contain;
        pointer-events: none;
      }
      
      /* 드래그 빈자리 플레이스홀더 */
      .pl-car-placeholder {
        border-radius: 16px;
        background: rgba(0,0,0,0.05);
        border: 2px dashed rgba(0,0,0,0.1);
        box-sizing: border-box;
      }

      /* 성공 패널 */
      .pl-success-overlay {
        position: absolute; inset: 0;
        background: rgba(255,255,255,0.85);
        backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        z-index: 200;
        animation: pl-fade-in 0.4s ease;
      }
      .pl-success-box {
        background: #fff;
        padding: 30px;
        border-radius: 30px;
        border: 6px solid #4CAF50;
        box-shadow: 0 16px 40px rgba(0,0,0,0.2);
        text-align: center;
        display: flex; flex-direction: column; gap: 20px;
        animation: pl-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .pl-success-title { font-size: 32px; font-weight: 900; color: #333; }
      .pl-success-emoji { font-size: 64px; }
      .pl-success-btns { display: flex; gap: 12px; justify-content: center; }
      .pl-btn {
        padding: 12px 24px; border-radius: 999px;
        font-size: 18px; font-weight: 900; color: #fff;
        border: none; cursor: pointer; box-shadow: 0 6px 0 rgba(0,0,0,0.2);
        transition: transform 0.1s;
      }
      .pl-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 rgba(0,0,0,0.2); }
      .pl-btn-next { background: #4CAF50; }
      .pl-btn-home { background: #FF9800; }

      @keyframes pl-pop {
        0% { transform: scale(0.5); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes pl-fade-in {
        from { opacity: 0; } to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  // ── manifest fetch ─────────────────────────────────────
  async function fetchVehicles() {
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
      const json = await res.json();
      const list = Array.isArray(json.vehicles) ? json.vehicles : [];
      const map = {};
      list.forEach(v => {
        const cat = v.category || 'transport';
        if (!map[cat]) map[cat] = [];
        map[cat].push({
          id:   v.id,
          name: v.name_ko || v.name || v.id,
          file: v.file || '',
        });
      });
      return map;
    } catch (e) {
      console.warn("Failed to load vehicle manifest, using fallback");
      return {
        fire: [
          { id:'pump_engine',  name:'펌프차',   file:'./assets/vehicles/fire/pump_engine.png' },
          { id:'ladder_truck', name:'사다리차', file:'./assets/vehicles/fire/ladder_truck.png' },
        ],
        rescue: [
          { id:'ambulance', name:'구급차', file:'./assets/vehicles/rescue/ambulance.png' },
        ],
        construction: [
          { id:'excavator',      name:'포크레인', file:'./assets/vehicles/construction/excavator.png' },
          { id:'dump_truck',     name:'덤프트럭', file:'./assets/vehicles/construction/dump_truck.png' },
          { id:'concrete_mixer', name:'레미콘',   file:'./assets/vehicles/construction/concrete_mixer.png' },
        ],
        transport: [
          { id:'train',    name:'기차',   file:'./assets/vehicles/transport/train.png' },
          { id:'bus',      name:'버스',   file:'./assets/vehicles/transport/bus.png' },
          { id:'car',      name:'자동차', file:'./assets/vehicles/transport/car.png' },
          { id:'airplane', name:'비행기', file:'./assets/vehicles/transport/airplane.png' },
        ],
      };
    }
  }

  // ── shuffle ────────────────────────────────────────────
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ── startRound ─────────────────────────────────────────
  function startRound() {
    if (!state.container) return;
    state.locked = false;
    state.filledCount = 0;
    
    let pool = state.allVehicles[state.selectedCat] || [];
    if (pool.length === 0) return;

    while (pool.length < SLOT_COUNT) {
      pool = pool.concat(state.allVehicles[state.selectedCat]);
    }
    
    const timestamp = Date.now();
    const selected = shuffle(pool).slice(0, SLOT_COUNT).map((v, i) => ({
      ...v,
      instanceId: `${v.id}-${i}-${timestamp}`
    }));

    state.slots = selected.map(v => ({ vehicle: v, filled: false }));
    state.cars = shuffle(selected);

    renderBoard();
    
    if (window.SihyeonVoice && window.SihyeonVoice.play) {
      window.SihyeonVoice.play('games.parking.intro', '').catch(()=>{});
    }
  }

  // ── renderBoard ────────────────────────────────────────
  function renderBoard() {
    const validCats = Object.keys(CATEGORY_META).filter(k => state.allVehicles[k]);
    const catColor = CATEGORY_META[state.selectedCat]?.color || '#ccc';

    const catBarHTML = `
      <div class="pl-cat-bar">
        ${validCats.map(cat => `
          <button class="pl-cat-chip ${cat === state.selectedCat ? 'active' : ''}" 
                  data-cat="${cat}">
            ${CATEGORY_META[cat].label}
          </button>
        `).join('')}
      </div>
    `;

    const slotsHTML = `
      <div class="pl-slots-area">
        ${state.slots.map(s => `
          <div class="pl-slot" data-slot-id="${s.vehicle.instanceId}" style="border-color: ${catColor}">
            <img class="pl-slot-img" src="${s.vehicle.file}" alt="${s.vehicle.name}">
            <div class="pl-slot-check">✅</div>
          </div>
        `).join('')}
      </div>
    `;

    const carsHTML = `
      <div class="pl-cars-area">
        ${state.cars.map(c => `
          <div class="pl-car-drag" data-vehicle-id="${c.instanceId}">
            <img src="${c.file}" alt="${c.name}">
            </div>
        `).join('')}
      </div>
    `;

    state.container.innerHTML = `
      <div class="pl-root">
        ${catBarHTML}
        ${slotsHTML}
        ${carsHTML}
      </div>
    `;

    bindEvents();
  }

  // ── bindEvents & 드래그 앤 드롭 ────────────────────────────
  function bindEvents() {
    const root = state.container.querySelector('.pl-root');
    if (!root) return;

    // 카테고리 탭 클릭
    root.querySelectorAll('.pl-cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (state.locked) return;
        state.selectedCat = chip.dataset.cat;
        state.round = 1;
        startRound();
      });
    });

    // 드래그 변수
    let activeCard = null;
    let startX = 0, startY = 0;
    let initialRect = null;
    let placeholder = null;

    function onPointerDown(e) {
      if (state.locked) return;
      const card = e.currentTarget;
      if (card.style.display === 'none') return;
      
      activeCard = card;
      initialRect = card.getBoundingClientRect();
      
      // 레이아웃 유지를 위한 placeholder 생성
      placeholder = document.createElement('div');
      placeholder.className = 'pl-car-placeholder';
      placeholder.style.width = initialRect.width + 'px';
      placeholder.style.height = initialRect.height + 'px';
      card.parentNode.insertBefore(placeholder, card);

      // 카드를 fixed로 전환하여 최상단에서 자유 이동
      card.style.position = 'fixed';
      card.style.left = initialRect.left + 'px';
      card.style.top = initialRect.top + 'px';
      card.style.margin = '0';
      card.style.zIndex = 100;
      card.style.transition = 'none';

      startX = e.clientX;
      startY = e.clientY;
      
      card.classList.add('dragging');
      card.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
      if (!activeCard) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      activeCard.style.transform = `translate(${dx}px, ${dy}px)`;
    }

    function onPointerUp(e) {
      if (!activeCard) return;
      const card = activeCard;
      activeCard = null;
      
      card.releasePointerCapture(e.pointerId);
      card.classList.remove('dragging');

      // 드롭 위치 감지를 위해 일시적으로 투명화
      card.style.visibility = 'hidden';
      const elUnder = document.elementFromPoint(e.clientX, e.clientY);
      card.style.visibility = '';

      const slot = elUnder ? elUnder.closest('.pl-slot') : null;
      checkDrop(card, slot, placeholder, initialRect);
    }

    root.querySelectorAll('.pl-car-drag').forEach(card => {
      card.addEventListener('pointerdown', onPointerDown);
      card.addEventListener('pointermove', onPointerMove);
      card.addEventListener('pointerup', onPointerUp);
      card.addEventListener('pointercancel', onPointerUp);
    });
  }

  // ── checkDrop ──────────────────────────────────────────
  function checkDrop(card, slot, ph, initRect) {
    const vId = card.dataset.vehicleId;

    if (slot && slot.dataset.slotId === vId && !slot.classList.contains('correct')) {
      // 정답 처리
      slot.classList.add('correct');
      card.style.display = 'none'; 
      if (ph) ph.remove(); 
      state.filledCount++;
      
      if (window.SihyeonVoice && window.SihyeonVoice.play) {
         window.SihyeonVoice.play('games.parking.complete', '').catch(()=>{}); 
      }
      
      if (state.filledCount >= SLOT_COUNT) {
        state.locked = true;
        setTimeout(showSuccess, 500);
      }
    } else {
      // 오답 처리: placeholder 위치로 부드럽게 복귀 애니메이션
      if (ph && initRect) {
        const phRect = ph.getBoundingClientRect();
        const targetX = phRect.left - initRect.left;
        const targetY = phRect.top - initRect.top;

        card.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        card.style.transform = `translate(${targetX}px, ${targetY}px)`;
      } else {
        card.style.transition = 'transform 0.3s';
        card.style.transform = 'translate(0px, 0px)';
      }
      
      if (window.SihyeonVoice && window.SihyeonVoice.play) {
         window.SihyeonVoice.play('games.memory.wrong', '').catch(()=>{});
      }
      
      // 애니메이션 종료 후 상태 원복 및 placeholder 파기
      setTimeout(() => {
        if (card) {
          card.style.position = '';
          card.style.left = '';
          card.style.top = '';
          card.style.margin = '';
          card.style.transform = '';
          card.style.transition = '';
          card.style.zIndex = '';
        }
        if (ph) ph.remove();
      }, 300);
    }
  }

  // ── showSuccess ────────────────────────────────────────
  function showSuccess() {
    if (state.options.fireConfetti) state.options.fireConfetti();
    if (state.options.gainExp) state.options.gainExp(20);
    
    if (window.SihyeonVoice && window.SihyeonVoice.play) {
      window.SihyeonVoice.play('games.parking.complete', '').catch(()=>{});
    }

    const overlay = document.createElement('div');
    overlay.className = 'pl-success-overlay';
    overlay.innerHTML = `
      <div class="pl-success-box">
        <div class="pl-success-emoji">🎉</div>
        <div class="pl-success-title">주차 완료!</div>
        <div class="pl-success-btns">
          <button class="pl-btn pl-btn-home">🏠 홈</button>
          <button class="pl-btn pl-btn-next">▶️ 다음 라운드</button>
        </div>
      </div>
    `;
    state.container.querySelector('.pl-root').appendChild(overlay);

    overlay.querySelector('.pl-btn-home').addEventListener('click', () => {
      if (state.options.closeToParkHome) state.options.closeToParkHome();
    });
    
    overlay.querySelector('.pl-btn-next').addEventListener('click', () => {
      state.round++;
      startRound();
    });
  }

  // ── render (공개 API) ──────────────────────────────────
  function render(container, options = {}) {
    destroy();
    state.container = container;
    state.options   = options;
    state.destroyed = false;
    state.round     = 1;
    
    injectStyle();
    
    container.innerHTML = '<div style="padding:30px;text-align:center;color:#fff;font-size:22px;height:100%;background:linear-gradient(160deg, #e0f7fa 0%, #b2ebf2 100%);">주차장 준비 중...</div>';
    
    fetchVehicles().then(map => {
      if (state.destroyed) return;
      state.allVehicles = map;
      if (Object.keys(map).length === 0) {
         container.innerHTML = '<div style="padding:30px;color:#fff;font-size:22px;">차량 데이터를 불러올 수 없어요.</div>';
         return;
      }
      state.selectedCat = map['transport'] ? 'transport' : Object.keys(map)[0];
      startRound();
    });
  }

  // ── destroy (공개 API) ─────────────────────────────────
  function destroy() {
    state.destroyed = true;
    if (state.container) state.container.innerHTML = '';
    state.container = null;
    state.slots     = [];
    state.cars      = [];
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
})();
