/**
 * 시현이 놀이터 OS — 🚗 자동차 메모리 게임 (Vehicle Memory)
 * 파일: js/games/vehicle-memory.js
 * 버전: v5.0 (난이도 선택, 마법 카드 뒷면, 3초 피날레 딜레이 추가)
 */
(function () {
  const GAME_KEY = 'vehicleMemory';
  const STYLE_ID = 'sihyeon-vehicle-memory-style';
  const MANIFEST_URL = './assets/vehicles/vehicles_manifest.json';

  const EMOJI_CATEGORIES = {
    '🍎과일': [
      { id:'fruit_1',  name:'사과',   emoji:'🍎' },
      { id:'fruit_2',  name:'바나나', emoji:'🍌' },
      { id:'fruit_3',  name:'딸기',   emoji:'🍓' },
      { id:'fruit_4',  name:'포도',   emoji:'🍇' },
      { id:'fruit_5',  name:'수박',   emoji:'🍉' },
      { id:'fruit_6',  name:'귤',     emoji:'🍊' },
      { id:'fruit_7',  name:'레몬',   emoji:'🍋' },
      { id:'fruit_8',  name:'복숭아', emoji:'🍑' },
      { id:'fruit_9',  name:'키위',   emoji:'🥝' },
      { id:'fruit_10', name:'체리',   emoji:'🍒' },
      { id:'fruit_11', name:'파인애플',emoji:'🍍' },
      { id:'fruit_12', name:'망고',   emoji:'🥭' },
      { id:'fruit_13', name:'배',     emoji:'🍐' },
      { id:'fruit_14', name:'블루베리',emoji:'🫐' },
    ],
    '🍕음식': [
      { id:'food_1',  name:'피자',      emoji:'🍕' },
      { id:'food_2',  name:'라면',      emoji:'🍜' },
      { id:'food_3',  name:'밥',        emoji:'🍚' },
      { id:'food_4',  name:'케이크',    emoji:'🎂' },
      { id:'food_5',  name:'아이스크림',emoji:'🍦' },
      { id:'food_6',  name:'햄버거',    emoji:'🍔' },
      { id:'food_7',  name:'초밥',      emoji:'🍣' },
      { id:'food_8',  name:'떡볶이',    emoji:'🌶️' },
      { id:'food_9',  name:'치킨',      emoji:'🍗' },
      { id:'food_10', name:'도넛',      emoji:'🍩' },
      { id:'food_11', name:'사탕',      emoji:'🍭' },
      { id:'food_12', name:'쿠키',      emoji:'🍪' },
      { id:'food_13', name:'빵',        emoji:'🍞' },
      { id:'food_14', name:'스파게티',  emoji:'🍝' },
      { id:'food_15', name:'타코',      emoji:'🌮' },
    ],
    '🐶동물': [
      { id:'animal_1',  name:'강아지', emoji:'🐶' },
      { id:'animal_2',  name:'고양이', emoji:'🐱' },
      { id:'animal_3',  name:'토끼',   emoji:'🐰' },
      { id:'animal_4',  name:'곰',     emoji:'🐻' },
      { id:'animal_5',  name:'사자',   emoji:'🦁' },
      { id:'animal_6',  name:'코끼리', emoji:'🐘' },
      { id:'animal_7',  name:'기린',   emoji:'🦒' },
      { id:'animal_8',  name:'펭귄',   emoji:'🐧' },
      { id:'animal_9',  name:'오리',   emoji:'🐥' },
      { id:'animal_10', name:'개구리', emoji:'🐸' },
      { id:'animal_11', name:'판다',   emoji:'🐼' },
      { id:'animal_12', name:'호랑이', emoji:'🐯' },
      { id:'animal_13', name:'원숭이', emoji:'🐒' },
      { id:'animal_14', name:'돼지',   emoji:'🐷' },
      { id:'animal_15', name:'닭',     emoji:'🐔' },
      { id:'animal_16', name:'양',     emoji:'🐑' },
    ],
  };

  let selectedCategory = '🚗탈것'; // 기본 카테고리
  let selectedVehicleCategory = 'all'; // 자동차 세부 카테고리
  let selectedCardCount = 8; // ★ 카드 개수 기본값 8장 (4쌍)

  const VEHICLE_CATEGORIES = [
    { id: 'all', label: '🚗전체' },
    { id: 'fire', label: '🚒소방' },
    { id: 'police', label: '🚓경찰' },
    { id: 'rescue', label: '🚑구조' },
    { id: 'construction', label: '🏗️공사' },
    { id: 'transport', label: '🚌교통' },
    { id: 'airport', label: '✈️공항' },
    { id: 'farm', label: '🚜농장' },
    { id: 'port', label: '⚓항구' },
    { id: 'road_service', label: '🛣️도로' },
    { id: 'military_special', label: '🛡️특수' },
    { id: 'town', label: '🏘️동네' },
  ];

  const state = {
    container: null,
    options: {},
    vehicles: [],
    cards: [],
    flipped: [],
    matched: 0,
    locked: false,
    round: 1,
    destroyed: false
  };

  function playGameVoice(id) {
    if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      window.SihyeonVoice.play(id).catch(() => {});
    }
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .memory-game-container {
        width: 100%; height: 100%; min-height: 0; padding: 10px 14px 18px;
        display: flex; flex-direction: column; gap: 12px;
        color: #17324a; overflow: hidden; font-family: 'Jua', sans-serif;
      }
      .memory-game-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-shrink: 0; }
      .memory-game-pill {
        min-height: 48px; padding: 8px 16px; border-radius: 999px;
        background: rgba(255,255,255,0.88); border: 4px solid #fff;
        box-shadow: 0 6px 0 rgba(0,0,0,0.16); font-size: clamp(18px, 4.8vw, 26px);
        font-weight: 900; display: inline-flex; align-items: center; gap: 8px;
      }
      .memory-game-actions { display: flex; gap: 8px; flex-shrink: 0; }
      .memory-game-btn {
        min-width: 70px; min-height: 48px; padding: 8px 13px; border-radius: 999px;
        background: linear-gradient(180deg,#fff 0%,#ffe577 100%);
        border: 4px solid #fff; box-shadow: 0 6px 0 rgba(0,0,0,0.16);
        color: #17324a; font: inherit; font-size: 18px; font-weight: 900; cursor: pointer;
      }
      .memory-game-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 rgba(0,0,0,0.18); }

      /* 카테고리 & 난이도 선택 바 */
      .memory-filter-row {
        width: 100%; display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none;
        padding: 0 0 4px; flex-shrink: 0; align-items: center;
      }
      .memory-filter-row::-webkit-scrollbar { display: none; }
      
      .memory-cat-chip, .memory-level-chip {
        flex-shrink: 0; min-height: 46px; padding: 0 16px; border-radius: 999px;
        background: rgba(255,255,255,0.82); border: 4px solid #fff;
        box-shadow: 0 5px 0 rgba(0,0,0,0.14); font-size: clamp(15px, 4vw, 19px);
        font-weight: 900; cursor: pointer; white-space: nowrap; touch-action: manipulation;
        transition: transform 0.1s;
      }
      .memory-cat-chip:active, .memory-level-chip:active { transform: translateY(3px); box-shadow: 0 2px 0 rgba(0,0,0,0.14); }
      .memory-cat-chip.active { background: linear-gradient(180deg,#fff 0%,#ffe577 100%); box-shadow: 0 5px 0 rgba(200,140,0,0.25); }
      
      /* ★ 난이도 칩 특별 스타일 */
      .memory-level-chip { border-color: #ffd700; background: #fffdf0; color: #b8860b; }
      .memory-level-chip.active { background: linear-gradient(180deg,#ffb74d 0%,#ff9800 100%); color: #fff; border-color: #fff; box-shadow: 0 5px 0 rgba(230,81,0,0.3); }

      .memory-vehicle-cat-chip {
        flex-shrink: 0; min-height: 40px; padding: 0 14px; border-radius: 999px;
        background: rgba(255,255,255,0.76); border: 3px solid #fff;
        box-shadow: 0 4px 0 rgba(0,0,0,0.12); font-size: clamp(13px, 3.4vw, 16px);
        font-weight: 900; cursor: pointer; white-space: nowrap; touch-action: manipulation;
      }
      .memory-vehicle-cat-chip.active {
        background: linear-gradient(180deg,#e8f5ff 0%,#a7e4ff 100%); color: #0d47a1; box-shadow: 0 4px 0 rgba(13,71,161,0.22);
      }

      /* 게임 보드 */
      .memory-board {
        flex: 1; min-height: 0; display: grid; gap: clamp(8px, 2.4vw, 14px);
        /* 카드가 12장, 16장이면 자동으로 크기 조절 */
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .memory-card {
        position: relative; width: 100%; height: 100%; min-height: 70px;
        border: 0; background: transparent; perspective: 900px; cursor: pointer; touch-action: manipulation;
      }
      .memory-card-inner {
        position: absolute; inset: 0; transform-style: preserve-3d; transition: transform 0.4s cubic-bezier(0.2,0.8,0.2,1);
      }
      .memory-card.is-open .memory-card-inner, .memory-card.is-matched .memory-card-inner {
        transform: rotateY(180deg);
      }
      .memory-card-face {
        position: absolute; inset: 0; backface-visibility: hidden; border-radius: 20px;
        display: grid; place-items: center; overflow: hidden;
      }
      
      /* ★ 반짝반짝 화려한 카드 뒷면 (마법 무지개 애니메이션) */
      .memory-card-back {
        background: linear-gradient(45deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #9D4EDD, #FF6B6B);
        background-size: 400% 400%;
        animation: magicRainbow 5s ease infinite;
        border: 5px solid #fff;
        box-shadow: inset 0 0 15px rgba(255,255,255,0.8), 0 8px 0 rgba(0,0,0,0.18);
        color: #fff;
      }
      .memory-card-back::before {
        content: '🌟';
        font-size: clamp(34px, 10vw, 54px);
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
        animation: starPulse 1.5s ease-in-out infinite alternate;
      }
      @keyframes magicRainbow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes starPulse {
        0% { transform: scale(0.8) rotate(-15deg); opacity: 0.8; }
        100% { transform: scale(1.2) rotate(15deg); opacity: 1; }
      }

      /* 카드 앞면 */
      .memory-card-front {
        transform: rotateY(180deg);
        background: linear-gradient(180deg,#ffffff 0%,#fff6c7 100%);
        border: 5px solid #fff;
        box-shadow: 0 8px 0 rgba(0,0,0,0.18), inset 0 3px 0 rgba(255,255,255,0.55);
      }
      .memory-card-front img {
        max-width: 90%; max-height: 90%; object-fit: contain; filter: drop-shadow(0 8px 0 rgba(0,0,0,0.12));
      }
      .memory-card-fallback { font-size: clamp(38px, 12vw, 64px); }
      .memory-card-front .memory-emoji-face { font-size: clamp(44px, 14vw, 72px); line-height: 1; filter: drop-shadow(0 6px 0 rgba(0,0,0,0.15)); }

      /* 정답 맞췄을 때 살짝 튀어오르는 효과 */
      .memory-card.is-matched { z-index: 10; }
      .memory-card.is-matched .memory-card-face {
        border-color: #7ed957; box-shadow: 0 8px 0 rgba(34,120,54,0.26), 0 0 0 6px rgba(126,217,87,0.35);
      }
      .memory-card.is-matched .memory-card-inner {
        animation: cardBounce 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      @keyframes cardBounce {
        0% { transform: rotateY(180deg) scale(1); }
        50% { transform: rotateY(180deg) scale(1.15) translateY(-10px); }
        100% { transform: rotateY(180deg) scale(1); }
      }

      /* ★ 피날레 댄스 (3초 대기 시간 동안 춤추기) */
      .memory-card.is-finale .memory-card-inner {
        animation: finaleDance 1.5s infinite alternate;
      }
      @keyframes finaleDance {
        0% { transform: rotateY(180deg) translateY(0) rotate(0deg); }
        33% { transform: rotateY(180deg) translateY(-8px) rotate(-3deg); }
        66% { transform: rotateY(180deg) translateY(0) rotate(3deg); }
        100% { transform: rotateY(180deg) translateY(-8px) rotate(0deg); }
      }

      /* 성공 패널 */
      .memory-success-panel { position: absolute; inset: 0; z-index: 20; display: grid; place-items: center; padding: 18px; background: rgba(255,122,26,0.18); backdrop-filter: blur(4px); animation: fadeIn 0.4s ease-out; }
      @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      .memory-success-box { width: min(92vw, 520px); border-radius: 28px; background: rgba(255,255,255,0.96); border: 6px solid #fff; box-shadow: 0 12px 0 rgba(0,0,0,0.2); padding: 24px 18px; text-align: center; display: grid; gap: 14px; }
      .memory-success-icon { font-size: clamp(72px, 22vw, 120px); line-height: 1; animation: starPulse 1s infinite alternate; }
      .memory-success-title { font-size: clamp(28px, 8vw, 44px); line-height: 1.08; font-weight: 900; color: #17324a; }
      .memory-success-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
      
      .memory-loading, .memory-error { flex: 1; display: grid; place-items: center; padding: 26px; text-align: center; color: #fff; font-size: clamp(22px, 6vw, 32px); text-shadow: 0 2px 0 rgba(0,0,0,0.2); }
      
      @media (max-width: 620px) {
        .memory-game-container { padding: 8px 10px 14px; }
        .memory-game-top { align-items: flex-start; }
        .memory-game-actions { flex-direction: column; }
        .memory-game-btn { min-width: 62px; font-size: 16px; }
        .memory-card-face { border-radius: 16px; border-width: 4px; }
      }
    `;
    document.head.appendChild(style);
  }

  function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function normalizeVehicle(vehicle, index) {
    const file = vehicle.file || vehicle.src || '';
    const name = vehicle.name_ko || vehicle.name || vehicle.id || `vehicle-${index}`;
    return {
      id: vehicle.id || `${file}-${index}`,
      name,
      file,
      category: vehicle.category || 'transport',
      sound: vehicle.sound_ko || name
    };
  }

  async function fetchMemoryVehicles() {
    const response = await fetch(MANIFEST_URL, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Vehicle manifest load failed: ${response.status}`);
    const manifest = await response.json();
    const vehicles = Array.isArray(manifest.vehicles) ? manifest.vehicles : [];
    return vehicles.map(normalizeVehicle).filter((vehicle) => vehicle.file);
  }

  function pickRoundVehicles() {
    const pool = selectedVehicleCategory === 'all'
      ? state.vehicles
      : state.vehicles.filter((vehicle) => vehicle.category === selectedVehicleCategory);
    const sourcePool = pool.length ? pool : state.vehicles;
    
    // 선택된 카드 개수(selectedCardCount)의 절반만큼 페어 구성
    const pairCount = Math.floor(selectedCardCount / 2);
    let expanded = [...sourcePool];
    while (expanded.length < pairCount) expanded = expanded.concat(sourcePool);
    const source = shuffle(expanded).slice(0, pairCount);
    
    return shuffle(source.flatMap((vehicle, index) => [
      { ...vehicle, id: `${vehicle.id}-${index}`, uid: `${vehicle.id}-${index}-a` },
      { ...vehicle, id: `${vehicle.id}-${index}`, uid: `${vehicle.id}-${index}-b` }
    ]));
  }

  function pickRoundEmoji() {
    const pool = EMOJI_CATEGORIES[selectedCategory] || [];
    const pairCount = Math.floor(selectedCardCount / 2);
    const picked = shuffle(pool).slice(0, pairCount);
    return shuffle(picked.flatMap(item => [
      { ...item, uid: `${item.id}-a`, isEmoji: true },
      { ...item, uid: `${item.id}-b`, isEmoji: true }
    ]));
  }

  function render(container, options = {}) {
    destroy();
    injectStyle();
    state.container = container;
    state.options = options;
    state.destroyed = false;
    state.round = 1;
    container.innerHTML = `
      <div class="memory-game-container">
        <div class="memory-loading">자동차 카드를 준비하고 있어요!</div>
      </div>
    `;
    fetchMemoryVehicles()
      .then((vehicles) => {
        if (state.destroyed) return;
        state.vehicles = vehicles;
        startRound();
      })
      .catch((error) => {
        console.warn(error);
        if (!state.container || state.destroyed) return;
        state.container.innerHTML = `
          <div class="memory-game-container">
            <div class="memory-error">자동차 카드를 불러오지 못했어요.</div>
          </div>
        `;
      });
  }

  function startRound() {
    if (!state.container) return;
    state.cards = selectedCategory === '🚗탈것'
      ? pickRoundVehicles()
      : pickRoundEmoji();
    state.flipped = [];
    state.matched = 0;
    state.locked = false;
    renderMemoryBoard();
    playGameVoice('games.memory.intro');
    const label = selectedCategory === '🚗탈것' ? '자동차' : selectedCategory.slice(2);
    
    // 시현이 이름 부르기 효과 추가
  }

  function renderMemoryBoard() {
    const availableVehicleCategories = new Set(state.vehicles.map((vehicle) => vehicle.category));
    
    // 카테고리 필터 바
    const catBar = `
      <div class="memory-filter-row">
        ${['🚗탈것', ...Object.keys(EMOJI_CATEGORIES)].map(cat => `
          <button class="memory-cat-chip ${selectedCategory === cat ? 'active' : ''}"
            type="button" data-cat="${cat}">${cat}</button>
        `).join('')}
      </div>
    `;

    // 자동차 세부 카테고리 필터 바
    const vehicleCatBar = selectedCategory === '🚗탈것'
      ? `
        <div class="memory-filter-row" style="padding-bottom: 8px;">
          ${VEHICLE_CATEGORIES
            .filter((cat) => cat.id === 'all' || availableVehicleCategories.has(cat.id))
            .map((cat) => `
              <button class="memory-vehicle-cat-chip ${selectedVehicleCategory === cat.id ? 'active' : ''}"
                type="button" data-vehicle-cat="${cat.id}">${cat.label}</button>
            `).join('')}
        </div>
      `
      : '';

    // ★ 난이도(카드 개수) 선택 바
    const levelBar = `
      <div class="memory-filter-row">
        ${[8, 12, 16].map(num => `
          <button class="memory-level-chip ${selectedCardCount === num ? 'active' : ''}"
            type="button" data-count="${num}">
            ${num}장
          </button>
        `).join('')}
      </div>
    `;

    state.container.innerHTML = `
      <div class="memory-game-container">
        <div class="memory-game-top">
          <div class="memory-game-pill">🎴 ${state.round}판</div>
          <div class="memory-game-actions">
            <button class="memory-game-btn" type="button" data-action="restart">다시</button>
            <button class="memory-game-btn" type="button" data-action="home">홈</button>
          </div>
        </div>
        
        ${levelBar}
        ${catBar}
        ${vehicleCatBar}

        <div class="memory-board" role="grid" aria-label="카드 맞추기">
          ${state.cards.map((card, index) => `
            <button class="memory-card" type="button" data-index="${index}" aria-label="카드">
              <span class="memory-card-inner">
                <span class="memory-card-face memory-card-back"></span>
                <span class="memory-card-face memory-card-front">
                  ${card.isEmoji
                    ? `<span class="memory-emoji-face">${card.emoji}</span>`
                    : `<img src="./${card.file}" alt="${escapeAttr(card.name)}" draggable="false">
                       <span class="memory-card-fallback" hidden>🚗</span>`
                  }
                </span>
              </span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
    bindBoardEvents();
  }

  function bindBoardEvents() {
    const root = state.container;
    root.querySelector('[data-action="restart"]')?.addEventListener('click', restartMemoryGame);
    root.querySelector('[data-action="home"]')?.addEventListener('click', () => state.options.closeToParkHome?.());
    root.querySelectorAll('.memory-card').forEach((card) => {
      card.addEventListener('click', () => handleMemoryCardClick(Number(card.dataset.index)));
    });
    root.querySelectorAll('.memory-card-front img').forEach((img) => {
      img.addEventListener('error', () => {
        img.hidden = true;
        img.nextElementSibling.hidden = false;
      });
    });

    // 메인 카테고리 클릭
    root.querySelectorAll('.memory-cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        selectedCategory = chip.dataset.cat;
        state.round = 1;
        startRound();
      });
    });

    // 서브 카테고리 (자동차용) 클릭
    root.querySelectorAll('.memory-vehicle-cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        selectedVehicleCategory = chip.dataset.vehicleCat || 'all';
        state.round = 1;
        startRound();
      });
    });

    // 난이도 (카드 개수) 클릭
    root.querySelectorAll('.memory-level-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        selectedCardCount = parseInt(chip.dataset.count, 10);
        state.round = 1;
        startRound();
      });
    });
  }

  function handleMemoryCardClick(index) {
    if (state.locked) return;
    const cardData = state.cards[index];
    const cardEl = state.container?.querySelector(`.memory-card[data-index="${index}"]`);
    if (!cardData || !cardEl || cardEl.classList.contains('is-open') || cardEl.classList.contains('is-matched')) return;
    
    cardEl.classList.add('is-open');
    state.flipped.push({ index, data: cardData, el: cardEl });
    
    if (state.flipped.length === 2) checkMemoryMatch();
  }

  function checkMemoryMatch() {
    const [first, second] = state.flipped;
    state.locked = true;

    // 정답일 때
    if (first.data.id === second.data.id) {
      window.setTimeout(() => {
        first.el.classList.add('is-matched');
        second.el.classList.add('is-matched');
        state.matched += 2;
        state.flipped = [];
        playGameVoice('games.memory.correct');
        
        // 다 맞췄는지 확인
        if (state.matched >= selectedCardCount) {
          triggerFinale(); 
        } else {
          // 다 맞춘게 아니면 잠시 후 터치 잠금 해제
          window.setTimeout(() => { state.locked = false; }, 800);
        }
      }, 400);
      return;
    }

    // 오답일 때
    window.setTimeout(() => {
      first.el.classList.remove('is-open');
      second.el.classList.remove('is-open');
      state.flipped = [];
      state.locked = false;
      playGameVoice('games.memory.wrong');
    }, 900);
  }

  // ★ 3초 피날레 대기 기능
  function triggerFinale() {
    state.locked = true;
    state.options.fireConfetti?.();
    playGameVoice('games.memory.complete');
    
    const label = selectedCategory === '🚗탈것' ? '자동차' : selectedCategory.slice(2);

    // 맞춘 카드들이 신나게 춤추는 애니메이션 부여
    state.container.querySelectorAll('.memory-card').forEach((card, idx) => {
      setTimeout(() => card.classList.add('is-finale'), idx * 80);
    });

    // 3초 대기 후 성공 패널 띄우기
    window.setTimeout(() => {
      showMemorySuccess();
    }, 3000);
  }

  function showMemorySuccess() {
    if (!state.container || state.container.querySelector('.memory-success-panel')) return;
    
    state.options.gainExp?.(selectedCardCount * 2); // 카드 개수에 따라 보상 증가

    const panel = document.createElement('div');
    panel.className = 'memory-success-panel';
    panel.innerHTML = `
      <div class="memory-success-box">
        <div class="memory-success-icon">🏆</div>
        <div class="memory-success-title">전부 다 찾았어!</div>
        <div class="memory-success-actions">
          <button class="memory-game-btn" type="button" data-action="restart-success">다시 하기</button>
          <button class="memory-game-btn" type="button" data-action="next">다음 판!</button>
        </div>
      </div>
    `;
    state.container.querySelector('.memory-game-container')?.appendChild(panel);
    panel.querySelector('[data-action="restart-success"]')?.addEventListener('click', restartMemoryGame);
    panel.querySelector('[data-action="next"]')?.addEventListener('click', nextMemoryGame);
  }

  function restartMemoryGame() {
    state.round = Math.max(1, state.round);
    startRound();
  }

  function nextMemoryGame() {
    state.round += 1;
    startRound();
  }

  function destroy() {
    state.destroyed = true;
    if (state.container) state.container.innerHTML = '';
    state.container = null;
    state.options = {};
    state.cards = [];
    state.flipped = [];
    state.matched = 0;
    state.locked = false;
  }

  function escapeAttr(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
})();
