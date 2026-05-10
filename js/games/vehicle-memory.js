(function () {
  const GAME_KEY = 'vehicleMemory';
  const STYLE_ID = 'sihyeon-vehicle-memory-style';
  const MANIFEST_URL = './assets/vehicles/vehicles_manifest.json';
  const CARD_COUNT = 12;
  const PAIR_COUNT = CARD_COUNT / 2;

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
  let selectedCategory = '🚗탈것'; // 기본값
  let selectedVehicleCategory = 'all';

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
        width: 100%;
        height: 100%;
        min-height: 0;
        padding: 10px 14px 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        color: #17324a;
        overflow: hidden;
      }
      .memory-game-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-shrink: 0;
      }
      .memory-game-pill {
        min-height: 48px;
        padding: 8px 16px;
        border-radius: 999px;
        background: rgba(255,255,255,0.88);
        border: 4px solid #fff;
        box-shadow: 0 6px 0 rgba(0,0,0,0.16);
        font-size: clamp(18px, 4.8vw, 26px);
        font-weight: 900;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .memory-game-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }
      .memory-game-btn {
        min-width: 70px;
        min-height: 48px;
        padding: 8px 13px;
        border-radius: 999px;
        background: linear-gradient(180deg,#fff 0%,#ffe577 100%);
        border: 4px solid #fff;
        box-shadow: 0 6px 0 rgba(0,0,0,0.16);
        color: #17324a;
        font: inherit;
        font-size: 18px;
        font-weight: 900;
        cursor: pointer;
      }
      .memory-game-btn:active {
        transform: translateY(4px);
        box-shadow: 0 2px 0 rgba(0,0,0,0.18);
      }
      .memory-board {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: clamp(8px, 2.4vw, 14px);
      }
      .memory-card {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 86px;
        border: 0;
        background: transparent;
        perspective: 900px;
        cursor: pointer;
        touch-action: manipulation;
      }
      .memory-card-inner {
        position: absolute;
        inset: 0;
        transform-style: preserve-3d;
        transition: transform 0.32s cubic-bezier(0.2,0.8,0.2,1);
      }
      .memory-card.is-open .memory-card-inner,
      .memory-card.is-matched .memory-card-inner {
        transform: rotateY(180deg);
      }
      .memory-card-face {
        position: absolute;
        inset: 0;
        backface-visibility: hidden;
        border-radius: 22px;
        border: 5px solid #fff;
        display: grid;
        place-items: center;
        overflow: hidden;
        box-shadow: 0 8px 0 rgba(0,0,0,0.18), inset 0 3px 0 rgba(255,255,255,0.55);
      }
      .memory-card-back {
        background:
          radial-gradient(circle at 28% 22%, rgba(255,255,255,0.45) 0 16%, transparent 17%),
          linear-gradient(145deg,#1e90ff 0%,#1956d8 100%);
        color: #fff;
        font-size: clamp(34px, 11vw, 58px);
        text-shadow: 0 3px 0 rgba(0,0,0,0.2);
      }
      .memory-card-front {
        transform: rotateY(180deg);
        background: linear-gradient(180deg,#ffffff 0%,#fff6c7 100%);
      }
      .memory-card-front img {
        max-width: 92%;
        max-height: 92%;
        object-fit: contain;
        filter: drop-shadow(0 8px 0 rgba(0,0,0,0.12));
      }
      .memory-card-fallback {
        font-size: clamp(38px, 12vw, 64px);
      }
      .memory-card.is-matched .memory-card-face {
        border-color: #7ed957;
        box-shadow: 0 8px 0 rgba(34,120,54,0.26), 0 0 0 5px rgba(126,217,87,0.25);
      }
      .memory-success-panel {
        position: absolute;
        inset: 0;
        z-index: 20;
        display: grid;
        place-items: center;
        padding: 18px;
        background: rgba(255,122,26,0.18);
        backdrop-filter: blur(3px);
      }
      .memory-success-box {
        width: min(92vw, 520px);
        border-radius: 28px;
        background: rgba(255,255,255,0.94);
        border: 6px solid #fff;
        box-shadow: 0 12px 0 rgba(0,0,0,0.2);
        padding: 24px 18px;
        text-align: center;
        display: grid;
        gap: 14px;
      }
      .memory-success-icon {
        font-size: clamp(72px, 22vw, 120px);
        line-height: 1;
      }
      .memory-success-title {
        font-size: clamp(28px, 8vw, 44px);
        line-height: 1.08;
        font-weight: 900;
        color: #17324a;
      }
      .memory-success-actions {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .memory-loading,
      .memory-error {
        flex: 1;
        display: grid;
        place-items: center;
        padding: 26px;
        text-align: center;
        color: #fff;
        font-size: clamp(22px, 6vw, 32px);
        text-shadow: 0 2px 0 rgba(0,0,0,0.2);
      }
      @media (max-width: 620px) {
        .memory-game-container { padding: 8px 10px 14px; }
        .memory-game-top { align-items: flex-start; }
        .memory-game-actions { flex-direction: column; }
        .memory-game-btn { min-width: 62px; font-size: 16px; }
        .memory-board { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .memory-card-face { border-radius: 18px; border-width: 4px; }
      }
      .memory-cat-bar {
        width: 100%;
        display: flex;
        gap: 8px;
        overflow-x: auto;
        scrollbar-width: none;
        padding: 0 0 8px;
        flex-shrink: 0;
      }
      .memory-cat-bar::-webkit-scrollbar { display: none; }
      .memory-cat-chip {
        flex-shrink: 0;
        min-height: 52px;
        padding: 0 18px;
        border-radius: 999px;
        background: rgba(255,255,255,0.82);
        border: 4px solid #fff;
        box-shadow: 0 5px 0 rgba(0,0,0,0.14);
        font-size: clamp(15px, 4vw, 19px);
        font-weight: 900;
        cursor: pointer;
        white-space: nowrap;
        touch-action: manipulation;
        transition: transform 0.1s;
      }
      .memory-cat-chip:active { transform: translateY(3px); box-shadow: 0 2px 0 rgba(0,0,0,0.14); }
      .memory-cat-chip.active {
        background: linear-gradient(180deg,#fff 0%,#ffe577 100%);
        box-shadow: 0 5px 0 rgba(200,140,0,0.25);
      }
      .memory-vehicle-cat-bar {
        width: 100%;
        display: flex;
        gap: 7px;
        overflow-x: auto;
        scrollbar-width: none;
        padding: 0 0 8px;
        flex-shrink: 0;
      }
      .memory-vehicle-cat-bar::-webkit-scrollbar { display: none; }
      .memory-vehicle-cat-chip {
        flex-shrink: 0;
        min-height: 42px;
        padding: 0 14px;
        border-radius: 999px;
        background: rgba(255,255,255,0.76);
        border: 3px solid #fff;
        box-shadow: 0 4px 0 rgba(0,0,0,0.12);
        font-size: clamp(13px, 3.4vw, 16px);
        font-weight: 900;
        cursor: pointer;
        white-space: nowrap;
        touch-action: manipulation;
      }
      .memory-vehicle-cat-chip.active {
        background: linear-gradient(180deg,#e8f5ff 0%,#a7e4ff 100%);
        color: #0d47a1;
        box-shadow: 0 4px 0 rgba(13,71,161,0.22);
      }
      .memory-card-front .memory-emoji-face {
        font-size: clamp(44px, 14vw, 72px);
        line-height: 1;
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
    let expanded = [...sourcePool];
    while (expanded.length < PAIR_COUNT) expanded = expanded.concat(sourcePool);
    const source = shuffle(expanded).slice(0, PAIR_COUNT);
    return shuffle(source.flatMap((vehicle, index) => [
      { ...vehicle, id: `${vehicle.id}-${index}`, uid: `${vehicle.id}-${index}-a` },
      { ...vehicle, id: `${vehicle.id}-${index}`, uid: `${vehicle.id}-${index}-b` }
    ]));
  }

  function pickRoundEmoji() {
    const pool = EMOJI_CATEGORIES[selectedCategory] || [];
    const picked = shuffle(pool).slice(0, PAIR_COUNT);
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
    state.options.speakGuide?.(`${label} 카드 두 장을 골라서 같은 친구를 찾아 보자!`, true);
  }

  function renderMemoryBoard() {
    const availableVehicleCategories = new Set(state.vehicles.map((vehicle) => vehicle.category));
    const catBar = `
      <div class="memory-cat-bar">
        ${['🚗탈것', ...Object.keys(EMOJI_CATEGORIES)].map(cat => `
          <button class="memory-cat-chip ${selectedCategory === cat ? 'active' : ''}"
            type="button" data-cat="${cat}">${cat}</button>
        `).join('')}
      </div>
    `;
    const vehicleCatBar = selectedCategory === '🚗탈것'
      ? `
        <div class="memory-vehicle-cat-bar">
          ${VEHICLE_CATEGORIES
            .filter((cat) => cat.id === 'all' || availableVehicleCategories.has(cat.id))
            .map((cat) => `
              <button class="memory-vehicle-cat-chip ${selectedVehicleCategory === cat.id ? 'active' : ''}"
                type="button" data-vehicle-cat="${cat.id}">${cat.label}</button>
            `).join('')}
        </div>
      `
      : '';

    state.container.innerHTML = `
      <div class="memory-game-container">
        <div class="memory-game-top">
          <div class="memory-game-pill">🎴 ${state.round}판</div>
          <div class="memory-game-actions">
            <button class="memory-game-btn" type="button" data-action="restart">다시</button>
            <button class="memory-game-btn" type="button" data-action="home">홈</button>
          </div>
        </div>
        ${catBar}
        ${vehicleCatBar}
        <div class="memory-board" role="grid" aria-label="카드 맞추기">
          ${state.cards.map((card, index) => `
            <button class="memory-card" type="button" data-index="${index}" aria-label="카드">
              <span class="memory-card-inner">
                <span class="memory-card-face memory-card-back">★</span>
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

    root.querySelectorAll('.memory-cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        selectedCategory = chip.dataset.cat;
        state.round = 1;
        startRound();
      });
    });
    root.querySelectorAll('.memory-vehicle-cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        selectedVehicleCategory = chip.dataset.vehicleCat || 'all';
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
    state.options.speakGuide?.(cardData.sound || cardData.name);
    if (state.flipped.length === 2) checkMemoryMatch();
  }

  function checkMemoryMatch() {
    const [first, second] = state.flipped;
    state.locked = true;
    if (first.data.id === second.data.id) {
      window.setTimeout(() => {
        first.el.classList.add('is-matched');
        second.el.classList.add('is-matched');
        first.el.classList.remove('is-open');
        second.el.classList.remove('is-open');
        state.matched += 2;
        state.flipped = [];
        state.locked = false;
        playGameVoice('games.memory.match');
        state.options.speakGuide?.(`${first.data.sound || first.data.name}. 짝을 찾았어!`, true);
        if (state.matched >= CARD_COUNT) showMemorySuccess();
      }, 400);
      return;
    }
    window.setTimeout(() => {
      first.el.classList.remove('is-open');
      second.el.classList.remove('is-open');
      state.flipped = [];
      state.locked = false;
      playGameVoice('games.memory.no_match');
    }, 760);
  }

  function showMemorySuccess() {
    state.locked = true;
    state.options.fireConfetti?.();
    state.options.gainExp?.(20);
    playGameVoice('games.memory.complete');
    
    // 카테고리 이름 가이드 대응 (완료 멘트)
    const label = selectedCategory === '🚗탈것' ? '자동차' : selectedCategory.slice(2);
    state.options.speakGuide?.(`${label} 짝을 모두 찾았어. 정말 멋져!`, true);
    
    const matchedCards = Array.from(state.container.querySelectorAll('.memory-card.is-matched'));
    const totalDelay = matchedCards.length * 80 + 5000;
    window.setTimeout(() => {
      if (!state.container || state.matched < CARD_COUNT || state.container.querySelector('.memory-success-panel')) return;
      const panel = document.createElement('div');
      panel.className = 'memory-success-panel';
      panel.innerHTML = `
        <div class="memory-success-box">
          <div class="memory-success-icon">🏁</div>
          <div class="memory-success-title">다 찾았어!</div>
          <div class="memory-success-actions">
            <button class="memory-game-btn" type="button" data-action="restart-success">다시 하기</button>
            <button class="memory-game-btn" type="button" data-action="next">다음 게임</button>
          </div>
        </div>
      `;
      state.container.querySelector('.memory-game-container')?.appendChild(panel);
      panel.querySelector('[data-action="restart-success"]')?.addEventListener('click', restartMemoryGame);
      panel.querySelector('[data-action="next"]')?.addEventListener('click', nextMemoryGame);
    }, totalDelay);
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
