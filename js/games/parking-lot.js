/**
 * 시현이 놀이터 OS — 주차장 미니게임 (Parking Lot)
 * 파일: js/games/parking-lot.js
 * 버전: v1.5.1
 * 수정:
 * - 모바일 세로 DOM / 태블릿 가로 DOM 이원화 유지
 * - 기존 카테고리, 슬롯, 차량 드래그/드롭, 성공 처리 유지
 * - 드래그 중 resize/orientationchange 무시
 * - 성공/오답 setTimeout 관리 타이머로 교체
 * - 주차 완료 보이스 중복 방지
 * - destroy 시 style/timer/event 정리 보강
 * - 빈 카테고리 fallback 방어
 */

(function () {
  'use strict';

  const GAME_KEY = 'parkingLot';
  const STYLE_ID = 'sihyeon-parking-lot-style';
  const MANIFEST_URL = './assets/vehicles/vehicles_manifest.json';
  const SLOT_COUNT = 4;

  const CATEGORY_META = {
    fire: { label: '🚒소방차', color: '#FF5252' },
    rescue: { label: '🚑구조대', color: '#FF9800' },
    construction: { label: '🏗️공사차', color: '#FFC107' },
    transport: { label: '🚌교통', color: '#2196F3' },
    airport: { label: '✈️공항', color: '#42A5F5' },
    farm: { label: '🚜농장', color: '#66BB6A' },
    port: { label: '⚓항구', color: '#26A69A' },
    road_service: { label: '🛣️도로', color: '#78909C' },
    military_special: { label: '🛡️특수', color: '#8D6E63' },
    town: { label: '🏘️동네', color: '#EC407A' }
  };

  const state = {
    container: null,
    options: {},
    allVehicles: {},
    selectedCat: 'transport',
    slots: [],
    cars: [],
    filledCount: 0,
    round: 1,
    locked: false,
    destroyed: false,
    layoutMode: 'portrait',
    resizeTimer: null,
    handleResizeBound: null,
    successRewardGiven: false,
    isDragging: false,
    timers: []
  };

  function isLandscapeMode() {
    try {
      return window.matchMedia('(orientation: landscape) and (min-width: 768px) and (min-height: 520px)').matches;
    } catch (error) {
      return window.innerWidth > window.innerHeight && window.innerWidth >= 768;
    }
  }

  function getLayoutMode() {
    return isLandscapeMode() ? 'landscape' : 'portrait';
  }

  function normalizeVehicleFile(file) {
    const raw = String(file || '');
    if (!raw) return './assets/vehicles/transport/bus.webp';
    if (raw.startsWith('./')) return raw;
    if (raw.startsWith('/')) return `.${raw}`;
    return `./${raw}`;
  }

  function playVoice(key) {
    if (key && window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      window.SihyeonVoice.play(key, '').catch(() => {});
    }
  }

  function vibrate(pattern) {
    try {
      if (navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch (error) {}
  }

  function setManagedTimeout(fn, delay) {
    const id = window.setTimeout(() => {
      state.timers = state.timers.filter((timerId) => timerId !== id);
      if (!state.destroyed) fn();
    }, delay);
    state.timers.push(id);
    return id;
  }

  function clearTimers() {
    state.timers.forEach((id) => window.clearTimeout(id));
    state.timers = [];

    if (state.resizeTimer) {
      window.clearTimeout(state.resizeTimer);
      state.resizeTimer = null;
    }
  }

  function removeStyle() {
    const prev = document.getElementById(STYLE_ID);
    if (prev) prev.remove();
  }

  function injectStyle() {
    removeStyle();

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .pl-root {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        background:
          radial-gradient(circle at 14% 16%, rgba(255,255,255,0.55) 0 8%, transparent 8.8%),
          radial-gradient(circle at 88% 20%, rgba(255,255,255,0.45) 0 9%, transparent 9.8%),
          linear-gradient(160deg, #e0f7fa 0%, #b2ebf2 100%);
        overflow: hidden;
        position: relative;
        font-family: 'Arial Rounded MT Bold', 'Jua', 'Nanum Gothic', system-ui, sans-serif;
        box-sizing: border-box;
        user-select: none;
        touch-action: none;
        color: #263238;
      }

      .pl-root * {
        box-sizing: border-box;
      }

      .pl-root.pl-portrait {
        display: flex;
        flex-direction: column;
      }

      .pl-root.pl-landscape {
        display: grid;
        grid-template-columns: minmax(230px, 0.74fr) minmax(370px, 1.22fr) minmax(260px, 0.9fr);
        grid-template-rows: 1fr;
        gap: 16px;
        padding: max(14px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(14px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
      }

      .pl-land-panel,
      .pl-land-slots-panel,
      .pl-land-cars-panel {
        min-height: 0;
        min-width: 0;
      }

      .pl-land-panel {
        display: grid;
        grid-template-rows: auto 1fr;
        gap: 14px;
      }

      .pl-land-title-card {
        border-radius: 30px;
        border: 5px solid #fff;
        background: rgba(255,255,255,0.86);
        box-shadow: 0 12px 28px rgba(0,0,0,0.12);
        padding: 18px 16px;
        text-align: center;
      }

      .pl-land-title-emoji {
        font-size: clamp(46px, 6vw, 76px);
        line-height: 1;
        margin-bottom: 8px;
      }

      .pl-land-title {
        font-size: clamp(23px, 2.6vw, 36px);
        font-weight: 900;
        line-height: 1.12;
        color: #263238;
      }

      .pl-land-sub {
        margin-top: 8px;
        font-size: clamp(14px, 1.45vw, 19px);
        font-weight: 900;
        color: #607d8b;
        line-height: 1.35;
      }

      .pl-cat-bar {
        display: flex;
        gap: 8px;
        padding: 12px;
        overflow-x: auto;
        scrollbar-width: none;
        background: rgba(255,255,255,0.6);
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        flex-shrink: 0;
        z-index: 10;
      }

      .pl-landscape .pl-cat-bar {
        height: 100%;
        min-height: 0;
        display: grid;
        grid-template-columns: 1fr;
        grid-auto-rows: minmax(48px, max-content);
        align-content: start;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 14px;
        border-radius: 30px;
        border: 5px solid #fff;
        background: rgba(255,255,255,0.76);
        box-shadow: 0 12px 28px rgba(0,0,0,0.12);
      }

      .pl-cat-bar::-webkit-scrollbar {
        display: none;
      }

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
        transition: transform 0.1s, border-color 0.2s, background 0.2s, color 0.2s;
        -webkit-tap-highlight-color: transparent;
        font-family: inherit;
        white-space: nowrap;
      }

      .pl-landscape .pl-cat-chip {
        width: 100%;
        min-height: 50px;
        padding: 9px 12px;
        font-size: clamp(15px, 1.5vw, 20px);
      }

      .pl-cat-chip:active {
        transform: translateY(4px);
        box-shadow: 0 0 0 rgba(0,0,0,0.1);
      }

      .pl-cat-chip.active {
        border-color: #4CAF50;
        color: #4CAF50;
        background: #f1f8e9;
      }

      .pl-slots-area {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        padding: 16px;
        flex-shrink: 0;
      }

      .pl-landscape .pl-slots-area {
        width: 100%;
        height: 100%;
        min-height: 0;
        padding: 0;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-template-rows: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .pl-land-slots-panel {
        min-height: 0;
        display: grid;
      }

      .pl-slot {
        background: #fff;
        border-radius: 20px;
        border: 5px solid #ccc;
        min-height: clamp(100px, 25vw, 140px);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        position: relative;
        box-shadow: inset 0 4px 10px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08);
        transition: all 0.3s;
        overflow: visible;
      }

      .pl-landscape .pl-slot {
        min-height: 0;
        height: 100%;
        border-radius: 28px;
        border-width: 6px;
      }

      .pl-slot-img {
        max-width: 85%;
        max-height: 85%;
        object-fit: contain;
        display: block;
        opacity: 0.15;
        filter: grayscale(100%) brightness(0.8);
        transition: all 0.4s ease;
        pointer-events: none;
      }

      .pl-slot-check {
        position: absolute;
        top: -12px;
        right: -12px;
        font-size: clamp(24px, 7vw, 36px);
        background: #fff;
        border-radius: 50%;
        display: none;
        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        z-index: 5;
      }

      .pl-slot.correct {
        border-color: #4CAF50 !important;
        background: #e8f5e9;
      }

      .pl-slot.correct .pl-slot-img {
        opacity: 1;
        filter: grayscale(0%) brightness(1);
        animation: pl-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      .pl-slot.correct .pl-slot-check {
        display: block;
      }

      .pl-cars-area {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding: 16px;
        background: rgba(255,255,255,0.3);
        border-radius: 30px 30px 0 0;
        position: relative;
      }

      .pl-landscape .pl-cars-area {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: repeat(4, minmax(0, 1fr));
        gap: 14px;
        padding: 16px;
        border-radius: 32px;
        border: 5px solid #fff;
        background: rgba(255,255,255,0.7);
        box-shadow: 0 12px 28px rgba(0,0,0,0.12);
      }

      .pl-land-cars-panel {
        min-height: 0;
        display: grid;
      }

      .pl-car-drag {
        width: clamp(90px, 22vw, 130px);
        height: clamp(90px, 22vw, 130px);
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.15);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: grab;
        touch-action: none;
        position: relative;
        will-change: transform;
        -webkit-tap-highlight-color: transparent;
      }

      .pl-landscape .pl-car-drag {
        width: 100%;
        height: 100%;
        min-height: 0;
        border-radius: 24px;
      }

      .pl-car-drag:active {
        cursor: grabbing;
      }

      .pl-car-drag.dragging {
        opacity: 0.85;
        box-shadow: 0 16px 32px rgba(0,0,0,0.3);
      }

      .pl-car-drag img {
        max-width: 85%;
        max-height: 85%;
        object-fit: contain;
        pointer-events: none;
      }

      .pl-car-placeholder {
        border-radius: 16px;
        background: rgba(0,0,0,0.05);
        border: 2px dashed rgba(0,0,0,0.1);
        box-sizing: border-box;
      }

      .pl-landscape .pl-car-placeholder {
        width: 100% !important;
        height: 100% !important;
        border-radius: 24px;
      }

      .pl-success-overlay {
        position: absolute;
        inset: 0;
        background: rgba(255,255,255,0.85);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 200;
        animation: pl-fade-in 0.4s ease;
        padding: 18px;
      }

      .pl-success-box {
        background: #fff;
        padding: 30px;
        border-radius: 30px;
        border: 6px solid #4CAF50;
        box-shadow: 0 16px 40px rgba(0,0,0,0.2);
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 20px;
        animation: pl-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      .pl-success-title {
        font-size: 32px;
        font-weight: 900;
        color: #333;
      }

      .pl-success-emoji {
        font-size: 64px;
      }

      .pl-success-btns {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      .pl-btn {
        padding: 12px 24px;
        border-radius: 999px;
        font-size: 18px;
        font-weight: 900;
        color: #fff;
        border: none;
        cursor: pointer;
        box-shadow: 0 6px 0 rgba(0,0,0,0.2);
        transition: transform 0.1s;
        font-family: inherit;
      }

      .pl-btn:active {
        transform: translateY(4px);
        box-shadow: 0 2px 0 rgba(0,0,0,0.2);
      }

      .pl-btn-next {
        background: #4CAF50;
      }

      .pl-btn-home {
        background: #FF9800;
      }

      @keyframes pl-pop {
        0% { transform: scale(0.5); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }

      @keyframes pl-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @media (min-width: 600px) and (orientation: portrait) {
        .pl-root.pl-portrait .pl-slots-area {
          grid-template-columns: repeat(4, 1fr);
        }
      }

      @media (max-height: 540px) and (orientation: landscape) {
        .pl-root.pl-landscape {
          grid-template-columns: minmax(190px, 0.7fr) minmax(340px, 1.24fr) minmax(220px, 0.86fr);
          gap: 10px;
          padding: 10px;
        }

        .pl-land-title-card {
          border-radius: 22px;
          border-width: 4px;
          padding: 10px;
        }

        .pl-land-title-emoji {
          font-size: 40px;
          margin-bottom: 4px;
        }

        .pl-land-title {
          font-size: 22px;
        }

        .pl-land-sub {
          font-size: 13px;
          margin-top: 4px;
        }

        .pl-landscape .pl-cat-bar {
          border-radius: 22px;
          border-width: 4px;
          padding: 8px;
          grid-auto-rows: minmax(38px, max-content);
          gap: 6px;
        }

        .pl-landscape .pl-cat-chip {
          min-height: 38px;
          padding: 6px 8px;
          font-size: 13px;
          border-width: 3px;
          border-radius: 16px;
        }

        .pl-landscape .pl-slots-area {
          gap: 8px;
        }

        .pl-landscape .pl-slot {
          border-radius: 20px;
          border-width: 4px;
        }

        .pl-landscape .pl-cars-area {
          border-radius: 22px;
          border-width: 4px;
          padding: 8px;
          gap: 8px;
        }

        .pl-landscape .pl-car-drag {
          border-radius: 18px;
        }
      }

      @media (max-width: 420px) {
        .pl-cat-bar {
          gap: 6px;
          padding: 9px;
        }

        .pl-cat-chip {
          padding: 8px 12px;
          border-radius: 17px;
          border-width: 3px;
          font-size: 14px;
        }

        .pl-slots-area {
          padding: 12px;
          gap: 10px;
        }

        .pl-slot {
          min-height: 94px;
          border-radius: 18px;
          border-width: 4px;
        }

        .pl-cars-area {
          gap: 12px;
          padding: 12px;
          border-radius: 24px 24px 0 0;
        }

        .pl-car-drag {
          width: clamp(82px, 24vw, 110px);
          height: clamp(82px, 24vw, 110px);
        }

        .pl-success-btns {
          flex-direction: column;
        }
      }
    `;

    document.head.appendChild(style);
  }

  async function fetchVehicles() {
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
      const json = await res.json();
      const list = Array.isArray(json.vehicles) ? json.vehicles : [];
      const map = {};

      list.forEach((v) => {
        const cat = v.category || 'transport';
        if (!map[cat]) map[cat] = [];

        map[cat].push({
          id: v.id,
          name: v.name_ko || v.name || v.id,
          file: normalizeVehicleFile(v.file || v.src || '')
        });
      });

      return map;
    } catch (e) {
      console.warn('Failed to load vehicle manifest, using fallback');

      return {
        fire: [
          { id: 'pump_engine', name: '펌프차', file: './assets/vehicles/fire/pump_engine.webp' },
          { id: 'ladder_truck', name: '사다리차', file: './assets/vehicles/fire/ladder_truck.webp' }
        ],
        rescue: [
          { id: 'ambulance', name: '구급차', file: './assets/vehicles/rescue/ambulance.webp' }
        ],
        construction: [
          { id: 'excavator', name: '포크레인', file: './assets/vehicles/construction/excavator.webp' },
          { id: 'dump_truck', name: '덤프트럭', file: './assets/vehicles/construction/dump_truck.webp' },
          { id: 'concrete_mixer', name: '레미콘', file: './assets/vehicles/construction/concrete_mixer.webp' }
        ],
        transport: [
          { id: 'train', name: '기차', file: './assets/vehicles/transport/train.webp' },
          { id: 'bus', name: '버스', file: './assets/vehicles/transport/bus.webp' },
          { id: 'car', name: '자동차', file: './assets/vehicles/transport/car.webp' },
          { id: 'airplane', name: '비행기', file: './assets/vehicles/transport/airplane.webp' }
        ]
      };
    }
  }

  function shuffle(arr) {
    const a = [...arr];

    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }

    return a;
  }

  function getValidCategories() {
    return Object.keys(CATEGORY_META).filter(k => Array.isArray(state.allVehicles[k]) && state.allVehicles[k].length > 0);
  }

  function ensureSelectedCategory() {
    const validCats = getValidCategories();

    if (!validCats.length) return false;

    if (!validCats.includes(state.selectedCat)) {
      state.selectedCat = validCats.includes('transport') ? 'transport' : validCats[0];
    }

    return true;
  }

  function startRound(renderOpts = {}) {
    if (!state.container) return;

    state.locked = false;
    state.filledCount = 0;
    state.successRewardGiven = false;
    state.isDragging = false;
    clearTimers();

    if (!ensureSelectedCategory()) {
      state.container.innerHTML = '<div style="padding:30px;color:#fff;font-size:22px;">차량 데이터를 불러올 수 없어요.</div>';
      return;
    }

    let pool = state.allVehicles[state.selectedCat] || [];

    if (pool.length === 0) return;

    while (pool.length < SLOT_COUNT) {
      pool = pool.concat(state.allVehicles[state.selectedCat]);
    }

    const timestamp = Date.now();
    const selected = shuffle(pool).slice(0, SLOT_COUNT).map((v, i) => ({
      ...v,
      file: normalizeVehicleFile(v.file || ''),
      instanceId: `${v.id}-${i}-${timestamp}`
    }));

    state.slots = selected.map(v => ({ vehicle: v, filled: false }));
    state.cars = shuffle(selected);

    renderBoard();

    if (!renderOpts.silent) {
      playVoice('games.parking.intro');
    }
  }

  function getCategoryBarHTML() {
    const validCats = getValidCategories();

    return `
      <div class="pl-cat-bar" aria-label="차량 종류 선택">
        ${validCats.map(cat => `
          <button class="pl-cat-chip ${cat === state.selectedCat ? 'active' : ''}"
                  type="button"
                  data-cat="${cat}">
            ${CATEGORY_META[cat].label}
          </button>
        `).join('')}
      </div>
    `;
  }

  function getSlotsHTML() {
    const catColor = CATEGORY_META[state.selectedCat]?.color || '#ccc';

    return `
      <div class="pl-slots-area">
        ${state.slots.map(s => `
          <div class="pl-slot ${s.filled ? 'correct' : ''}" data-slot-id="${s.vehicle.instanceId}" style="border-color: ${catColor}">
            <img class="pl-slot-img" src="${s.vehicle.file}" alt="${s.vehicle.name}" onerror="this.style.opacity='0';">
            <div class="pl-slot-check">✅</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function getCarsHTML() {
    return `
      <div class="pl-cars-area">
        ${state.cars.map(c => `
          <div class="pl-car-drag" data-vehicle-id="${c.instanceId}" style="${c.parked ? 'display:none;' : ''}">
            <img src="${c.file}" alt="${c.name}" onerror="this.style.display='none';">
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderBoard() {
    if (!state.container) return;

    const mode = getLayoutMode();
    state.layoutMode = mode;

    const categoryBarHTML = getCategoryBarHTML();
    const slotsHTML = getSlotsHTML();
    const carsHTML = getCarsHTML();

    if (mode === 'landscape') {
      state.container.innerHTML = `
        <div class="pl-root pl-landscape">
          <aside class="pl-land-panel">
            <div class="pl-land-title-card">
              <div class="pl-land-title-emoji">🅿️🚗</div>
              <div class="pl-land-title">주차장 놀이</div>
              <div class="pl-land-sub">오른쪽 자동차를<br>같은 그림 주차칸에 넣어요</div>
            </div>
            ${categoryBarHTML}
          </aside>
          <main class="pl-land-slots-panel">
            ${slotsHTML}
          </main>
          <aside class="pl-land-cars-panel">
            ${carsHTML}
          </aside>
        </div>
      `;
    } else {
      state.container.innerHTML = `
        <div class="pl-root pl-portrait">
          ${categoryBarHTML}
          ${slotsHTML}
          ${carsHTML}
        </div>
      `;
    }

    bindEvents();
  }

  function bindEvents() {
    const root = state.container?.querySelector('.pl-root');
    if (!root) return;

    root.querySelectorAll('.pl-cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (state.locked || state.isDragging) return;
        state.selectedCat = chip.dataset.cat;
        state.round = 1;
        startRound();
      });
    });

    let activeCard = null;
    let startX = 0;
    let startY = 0;
    let initialRect = null;
    let placeholder = null;

    function cleanupDraggingCard(card) {
      if (!card) return;

      card.style.position = '';
      card.style.left = '';
      card.style.top = '';
      card.style.margin = '';
      card.style.transform = '';
      card.style.transition = '';
      card.style.zIndex = '';
      card.style.width = '';
      card.style.height = '';
      card.style.visibility = '';
    }

    function cleanupPlaceholder() {
      if (placeholder && placeholder.parentNode) placeholder.remove();
      placeholder = null;
    }

    function onPointerDown(e) {
      if (state.locked || state.isDragging) return;

      const card = e.currentTarget;
      if (card.style.display === 'none') return;

      activeCard = card;
      state.isDragging = true;
      initialRect = card.getBoundingClientRect();

      placeholder = document.createElement('div');
      placeholder.className = 'pl-car-placeholder';
      placeholder.style.width = initialRect.width + 'px';
      placeholder.style.height = initialRect.height + 'px';

      card.parentNode.insertBefore(placeholder, card);

      card.style.position = 'fixed';
      card.style.left = initialRect.left + 'px';
      card.style.top = initialRect.top + 'px';
      card.style.width = initialRect.width + 'px';
      card.style.height = initialRect.height + 'px';
      card.style.margin = '0';
      card.style.zIndex = 100;
      card.style.transition = 'none';

      startX = e.clientX;
      startY = e.clientY;

      card.classList.add('dragging');

      try {
        card.setPointerCapture(e.pointerId);
      } catch (error) {}

      vibrate(8);
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

      try {
        card.releasePointerCapture(e.pointerId);
      } catch (error) {}

      card.classList.remove('dragging');

      card.style.visibility = 'hidden';
      const elUnder = document.elementFromPoint(e.clientX, e.clientY);
      card.style.visibility = '';

      const slot = elUnder ? elUnder.closest('.pl-slot') : null;

      checkDrop(card, slot, placeholder, initialRect, cleanupDraggingCard, cleanupPlaceholder);

      placeholder = null;
      initialRect = null;
      state.isDragging = false;
    }

    root.querySelectorAll('.pl-car-drag').forEach(card => {
      card.addEventListener('pointerdown', onPointerDown);
      card.addEventListener('pointermove', onPointerMove);
      card.addEventListener('pointerup', onPointerUp);
      card.addEventListener('pointercancel', onPointerUp);
    });
  }

  function checkDrop(card, slot, ph, initRect, cleanupDraggingCard, cleanupPlaceholder) {
    const vId = card.dataset.vehicleId;

    if (slot && slot.dataset.slotId === vId && !slot.classList.contains('correct')) {
      const slotData = state.slots.find(item => item.vehicle.instanceId === vId);
      const carData = state.cars.find(item => item.instanceId === vId);

      if (slotData) slotData.filled = true;
      if (carData) carData.parked = true;

      slot.classList.add('correct');

      card.style.display = 'none';

      if (ph) ph.remove();

      state.filledCount += 1;

      vibrate([20, 30, 20]);

      if (state.filledCount >= SLOT_COUNT) {
        state.locked = true;
        setManagedTimeout(showSuccess, 500);
      } else {
        playVoice('games.parking.correct');
      }

      return;
    }

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

    vibrate([40, 25, 40]);
    playVoice('games.parking.wrong');

    setManagedTimeout(() => {
      cleanupDraggingCard?.(card);
      cleanupPlaceholder?.();
    }, 300);
  }

  function showSuccess() {
    if (state.destroyed || !state.container) return;
    if (state.successRewardGiven) return;

    state.successRewardGiven = true;

    if (state.options.fireConfetti) state.options.fireConfetti();
    if (state.options.gainExp) state.options.gainExp(20);

    playVoice('games.parking.complete');

    const root = state.container.querySelector('.pl-root');
    if (!root) return;

    const overlay = document.createElement('div');
    overlay.className = 'pl-success-overlay';
    overlay.innerHTML = `
      <div class="pl-success-box">
        <div class="pl-success-emoji">🎉</div>
        <div class="pl-success-title">주차 완료!</div>
        <div class="pl-success-btns">
          <button class="pl-btn pl-btn-home" type="button">🏠 홈</button>
          <button class="pl-btn pl-btn-next" type="button">▶️ 다음 라운드</button>
        </div>
      </div>
    `;

    root.appendChild(overlay);

    overlay.querySelector('.pl-btn-home')?.addEventListener('click', () => {
      if (state.options.closeToParkHome) state.options.closeToParkHome();
    });

    overlay.querySelector('.pl-btn-next')?.addEventListener('click', () => {
      state.round += 1;
      startRound();
    });
  }

  function handleResize() {
    if (state.destroyed || !state.container) return;

    if (state.resizeTimer) window.clearTimeout(state.resizeTimer);

    state.resizeTimer = window.setTimeout(() => {
      state.resizeTimer = null;
      if (state.destroyed || !state.container) return;

      const nextMode = getLayoutMode();

      if (nextMode !== state.layoutMode && !state.successRewardGiven && !state.locked && !state.isDragging) {
        renderBoard();
      }
    }, 150);
  }

  function bindResizeEvents() {
    if (state.handleResizeBound) return;
    state.handleResizeBound = handleResize;
    window.addEventListener('resize', state.handleResizeBound, { passive: true });
    window.addEventListener('orientationchange', state.handleResizeBound, { passive: true });
  }

  function unbindResizeEvents() {
    if (!state.handleResizeBound) return;
    window.removeEventListener('resize', state.handleResizeBound);
    window.removeEventListener('orientationchange', state.handleResizeBound);
    state.handleResizeBound = null;
  }

  function render(container, options = {}) {
    destroy();

    state.container = container;
    state.options = options;
    state.destroyed = false;
    state.round = 1;
    state.locked = false;
    state.filledCount = 0;
    state.slots = [];
    state.cars = [];
    state.layoutMode = getLayoutMode();
    state.successRewardGiven = false;
    state.isDragging = false;

    injectStyle();

    container.innerHTML = '<div style="padding:30px;text-align:center;color:#fff;font-size:22px;height:100%;background:linear-gradient(160deg, #e0f7fa 0%, #b2ebf2 100%);">주차장 준비 중...</div>';

    fetchVehicles().then(map => {
      if (state.destroyed) return;

      state.allVehicles = map;

      if (!ensureSelectedCategory()) {
        container.innerHTML = '<div style="padding:30px;color:#fff;font-size:22px;">차량 데이터를 불러올 수 없어요.</div>';
        return;
      }

      startRound();
    });

    bindResizeEvents();
  }

  function destroy() {
    state.destroyed = true;

    clearTimers();
    unbindResizeEvents();

    if (state.container) state.container.innerHTML = '';

    removeStyle();

    state.container = null;
    state.options = {};
    state.allVehicles = {};
    state.slots = [];
    state.cars = [];
    state.filledCount = 0;
    state.round = 1;
    state.locked = false;
    state.layoutMode = 'portrait';
    state.successRewardGiven = false;
    state.isDragging = false;
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
})();