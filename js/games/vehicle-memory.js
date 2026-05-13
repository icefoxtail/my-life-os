/**
 * 시현이 놀이터 OS — 🚗 자동차 메모리 게임 (Vehicle Memory)
 * 파일: js/games/vehicle-memory.js
 * 버전: v5.4.0
 * 수정:
 * - 원본 v5.3.0 기능 유지
 * - 모바일 세로 / 태블릿 가로 DOM 이원화
 * - resize/orientationchange 대응
 * - resize 시 현재 카드 상태, 매칭 상태, 힌트 상태 유지
 * - 성공 보상 중복 방지
 */
(function () {
  const GAME_KEY = 'vehicleMemory';
  const STYLE_ID = 'sihyeon-vehicle-memory-style';
  const MANIFEST_URL = './assets/vehicles/vehicles_manifest.json';

  const EMOJI_CATEGORIES = {
    '🍎과일': [
      { id:'fruit_1',  name:'사과',   emoji:'🍎', role:'맛있는 사과예요' },
      { id:'fruit_2',  name:'바나나', emoji:'🍌', role:'길쭉하고 달콤한 바나나예요' },
      { id:'fruit_3',  name:'딸기',   emoji:'🍓', role:'빨갛고 새콤달콤한 딸기예요' },
      { id:'fruit_4',  name:'포도',   emoji:'🍇', role:'동글동글 포도알이 모여 있어요' },
      { id:'fruit_5',  name:'수박',   emoji:'🍉', role:'시원한 수박이에요' },
      { id:'fruit_6',  name:'귤',     emoji:'🍊', role:'상큼한 귤이에요' },
      { id:'fruit_7',  name:'레몬',   emoji:'🍋', role:'새콤한 레몬이에요' },
      { id:'fruit_8',  name:'복숭아', emoji:'🍑', role:'말랑말랑 복숭아예요' },
      { id:'fruit_9',  name:'키위',   emoji:'🥝', role:'초록색 키위예요' },
      { id:'fruit_10', name:'체리',   emoji:'🍒', role:'작고 귀여운 체리예요' },
      { id:'fruit_11', name:'파인애플',emoji:'🍍', role:'뾰족뾰족 파인애플이에요' },
      { id:'fruit_12', name:'망고',   emoji:'🥭', role:'달콤한 망고예요' },
      { id:'fruit_13', name:'배',     emoji:'🍐', role:'아삭아삭한 배예요' },
      { id:'fruit_14', name:'블루베리',emoji:'🫐', role:'작고 파란 블루베리예요' },
    ],
    '🍕음식': [
      { id:'food_1',  name:'피자',      emoji:'🍕', role:'치즈가 쭉 늘어나는 피자예요' },
      { id:'food_2',  name:'라면',      emoji:'🍜', role:'따뜻한 라면이에요' },
      { id:'food_3',  name:'밥',        emoji:'🍚', role:'든든한 밥이에요' },
      { id:'food_4',  name:'케이크',    emoji:'🎂', role:'축하할 때 먹는 케이크예요' },
      { id:'food_5',  name:'아이스크림',emoji:'🍦', role:'차갑고 달콤한 아이스크림이에요' },
      { id:'food_6',  name:'햄버거',    emoji:'🍔', role:'맛있는 햄버거예요' },
      { id:'food_7',  name:'초밥',      emoji:'🍣', role:'동글동글 초밥이에요' },
      { id:'food_8',  name:'떡볶이',    emoji:'🌶️', role:'매콤달콤 떡볶이예요' },
      { id:'food_9',  name:'치킨',      emoji:'🍗', role:'바삭바삭 치킨이에요' },
      { id:'food_10', name:'도넛',      emoji:'🍩', role:'동그란 도넛이에요' },
      { id:'food_11', name:'사탕',      emoji:'🍭', role:'달콤한 사탕이에요' },
      { id:'food_12', name:'쿠키',      emoji:'🍪', role:'바삭한 쿠키예요' },
      { id:'food_13', name:'빵',        emoji:'🍞', role:'고소한 빵이에요' },
      { id:'food_14', name:'스파게티',  emoji:'🍝', role:'길쭉길쭉 스파게티예요' },
      { id:'food_15', name:'타코',      emoji:'🌮', role:'바삭한 타코예요' },
    ],
    '🐶동물': [
      { id:'animal_1',  name:'강아지', emoji:'🐶', role:'멍멍 짖는 강아지예요' },
      { id:'animal_2',  name:'고양이', emoji:'🐱', role:'야옹야옹 고양이예요' },
      { id:'animal_3',  name:'토끼',   emoji:'🐰', role:'깡충깡충 토끼예요' },
      { id:'animal_4',  name:'곰',     emoji:'🐻', role:'커다란 곰이에요' },
      { id:'animal_5',  name:'사자',   emoji:'🦁', role:'어흥 사자예요' },
      { id:'animal_6',  name:'코끼리', emoji:'🐘', role:'긴 코를 가진 코끼리예요' },
      { id:'animal_7',  name:'기린',   emoji:'🦒', role:'목이 긴 기린이에요' },
      { id:'animal_8',  name:'펭귄',   emoji:'🐧', role:'뒤뚱뒤뚱 펭귄이에요' },
      { id:'animal_9',  name:'오리',   emoji:'🐥', role:'꽥꽥 오리예요' },
      { id:'animal_10', name:'개구리', emoji:'🐸', role:'개굴개굴 개구리예요' },
      { id:'animal_11', name:'판다',   emoji:'🐼', role:'대나무를 좋아하는 판다예요' },
      { id:'animal_12', name:'호랑이', emoji:'🐯', role:'어흥 호랑이예요' },
      { id:'animal_13', name:'원숭이', emoji:'🐒', role:'장난꾸러기 원숭이예요' },
      { id:'animal_14', name:'돼지',   emoji:'🐷', role:'꿀꿀 돼지예요' },
      { id:'animal_15', name:'닭',     emoji:'🐔', role:'꼬끼오 닭이에요' },
      { id:'animal_16', name:'양',     emoji:'🐑', role:'메에 양이에요' },
    ],
  };

  let selectedCategory = '🚗탈것';
  let selectedVehicleCategory = 'all';
  let selectedCardCount = 8;

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

  const VEHICLE_ROLE_FALLBACKS = {
    fire: '불이 난 곳에 달려가서 불을 꺼요',
    police: '우리 동네를 안전하게 지켜요',
    rescue: '위험한 곳에서 사람을 도와줘요',
    construction: '공사장에서 무거운 일을 해요',
    transport: '사람들을 태우고 이동해요',
    airport: '공항에서 비행기를 도와줘요',
    farm: '농장에서 일을 도와줘요',
    port: '항구에서 배와 짐을 도와줘요',
    road_service: '도로를 깨끗하고 안전하게 만들어요',
    military_special: '특별한 임무를 해요',
    town: '동네에서 우리를 도와줘요',
  };

  const HINT_COLORS = ['red', 'yellow', 'blue', 'green', 'purple', 'pink'];
  const PREVIEW_MS = 1800;

  const state = {
    container: null,
    options: {},
    vehicles: [],
    cards: [],
    flipped: [],
    matched: 0,
    matchedPairKeys: new Set(),
    locked: false,
    round: 1,
    destroyed: false,
    isPreviewing: false,
    noticeTimer: null,
    finaleTimer: null,
    previewTimer: null,
    resizeTimer: null,
    handleResizeBound: null,
    pendingVoiceToken: 0,
    seenCards: new Set(),
    seenPairs: {},
    hintPairs: {},
    wrongCount: 0,
    hintColorIndex: 0,
    layoutMode: 'portrait',
    currentScreen: 'game',
    successRewardGiven: false
  };

  function isLandscapeMode() {
    return window.innerWidth > window.innerHeight && window.innerWidth >= 768;
  }

  function getLayoutMode() {
    return isLandscapeMode() ? 'landscape' : 'portrait';
  }

  function playGameVoice(id) {
    if (!id) return Promise.resolve(false);
    if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      return window.SihyeonVoice.play(id).then(() => true).catch(() => false);
    }
    return Promise.resolve(false);
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .memory-game-container {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        padding: 8px 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        color: #17324a;
        overflow: hidden;
        font-family: 'Jua', sans-serif;
      }

      .memory-game-container.memory-portrait {
        display: flex;
        flex-direction: column;
      }

      .memory-game-container.memory-landscape {
        display: grid;
        grid-template-columns: minmax(250px, 0.74fr) minmax(420px, 1.26fr);
        grid-template-rows: 1fr;
        gap: clamp(12px, 1.8vw, 22px);
        padding: max(14px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(14px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
      }

      .memory-land-left {
        min-height: 0;
        min-width: 0;
        display: grid;
        grid-template-rows: auto 1fr;
        gap: 14px;
      }

      .memory-land-title-card {
        border: 6px solid #fff;
        border-radius: 32px;
        background: rgba(255,255,255,0.82);
        box-shadow: 0 12px 28px rgba(0,0,0,0.13);
        padding: 16px;
        text-align: center;
        display: grid;
        gap: 7px;
      }

      .memory-land-title-emoji {
        font-size: clamp(46px, 6vw, 76px);
        line-height: 1;
      }

      .memory-land-title {
        font-size: clamp(22px, 2.5vw, 34px);
        font-weight: 900;
        line-height: 1.08;
        color: #17324a;
      }

      .memory-land-sub {
        font-size: clamp(14px, 1.35vw, 18px);
        font-weight: 900;
        color: #0d47a1;
        line-height: 1.32;
      }

      .memory-land-main {
        min-height: 0;
        min-width: 0;
        display: grid;
      }

      .memory-control-panel {
        flex-shrink: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        grid-template-areas:
          "levels picker"
          "cats picker";
        gap: 6px 8px;
        padding: 0;
        align-items: center;
      }

      .memory-landscape .memory-control-panel {
        height: 100%;
        min-height: 0;
        grid-template-columns: 1fr;
        grid-template-areas:
          "levels"
          "cats"
          "picker";
        grid-template-rows: auto 1fr auto;
        align-items: stretch;
        gap: 12px;
        border: 6px solid #fff;
        border-radius: 32px;
        background: rgba(255,255,255,0.72);
        box-shadow: 0 12px 28px rgba(0,0,0,0.13);
        padding: 14px;
        overflow: hidden;
      }

      .memory-level-row {
        grid-area: levels;
      }

      .memory-main-cat-row {
        grid-area: cats;
      }

      .memory-category-picker-btn {
        grid-area: picker;
        align-self: stretch;
        min-width: 92px;
        min-height: 100%;
        padding: 0 12px;
        border-radius: 22px;
        border: 4px solid #fff;
        background: linear-gradient(180deg,#ffffff 0%,#b8edff 100%);
        box-shadow: 0 5px 0 rgba(13,71,161,0.22);
        color: #0d47a1;
        font-family: inherit;
        font-size: clamp(13px, 3.5vw, 17px);
        font-weight: 900;
        line-height: 1.15;
        cursor: pointer;
        touch-action: manipulation;
        display: grid;
        place-items: center;
        text-align: center;
      }

      .memory-landscape .memory-category-picker-btn {
        min-width: 0;
        min-height: 58px;
        font-size: clamp(15px, 1.55vw, 20px);
      }

      .memory-category-picker-btn:active {
        transform: translateY(3px);
        box-shadow: 0 2px 0 rgba(13,71,161,0.2);
      }

      .memory-filter-row {
        width: 100%;
        display: flex;
        gap: 7px;
        overflow-x: auto;
        scrollbar-width: none;
        padding: 0 2px 4px;
        align-items: center;
        flex-shrink: 0;
      }

      .memory-landscape .memory-filter-row {
        flex-direction: column;
        align-items: stretch;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 0 2px 4px;
      }

      .memory-landscape .memory-level-row {
        flex-direction: row;
        overflow-x: auto;
        overflow-y: hidden;
      }

      .memory-filter-row::-webkit-scrollbar {
        display: none;
      }

      .memory-cat-chip,
      .memory-level-chip,
      .memory-vehicle-cat-chip {
        flex-shrink: 0;
        border-radius: 999px;
        background: rgba(255,255,255,0.86);
        border: 3px solid #fff;
        box-shadow: 0 4px 0 rgba(0,0,0,0.14);
        font-weight: 900;
        cursor: pointer;
        white-space: nowrap;
        touch-action: manipulation;
        color: #17324a;
        font-family: inherit;
        line-height: 1;
      }

      .memory-cat-chip:active,
      .memory-level-chip:active,
      .memory-vehicle-cat-chip:active {
        transform: translateY(3px);
        box-shadow: 0 1px 0 rgba(0,0,0,0.14);
      }

      .memory-level-chip {
        min-height: 38px;
        padding: 0 16px;
        font-size: clamp(15px, 3.8vw, 18px);
        border-color: #ffd700;
        background: #fffdf0;
        color: #b8860b;
      }

      .memory-landscape .memory-level-chip {
        min-height: 44px;
        padding: 0 14px;
        font-size: clamp(14px, 1.35vw, 18px);
      }

      .memory-level-chip.active {
        background: linear-gradient(180deg,#ffb74d 0%,#ff9800 100%);
        color: #fff;
        border-color: #fff;
        box-shadow: 0 4px 0 rgba(230,81,0,0.3);
      }

      .memory-cat-chip {
        min-height: 40px;
        padding: 0 15px;
        font-size: clamp(15px, 3.8vw, 18px);
      }

      .memory-landscape .memory-cat-chip {
        width: 100%;
        min-height: 46px;
        font-size: clamp(15px, 1.45vw, 19px);
      }

      .memory-cat-chip.active {
        background: linear-gradient(180deg,#fff 0%,#ffe577 100%);
        box-shadow: 0 4px 0 rgba(200,140,0,0.25);
      }

      .memory-vehicle-cat-chip {
        min-height: 52px;
        padding: 0 14px;
        border-radius: 18px;
        font-size: clamp(15px, 4vw, 20px);
        background: rgba(255,255,255,0.88);
      }

      .memory-vehicle-cat-chip.active {
        background: linear-gradient(180deg,#e8f5ff 0%,#a7e4ff 100%);
        color: #0d47a1;
        box-shadow: 0 4px 0 rgba(13,71,161,0.22);
      }

      .memory-board {
        flex: 1;
        min-height: 0;
        display: grid;
        gap: clamp(7px, 2vw, 12px);
        align-items: stretch;
        justify-items: stretch;
      }

      .memory-landscape .memory-board {
        width: 100%;
        height: 100%;
        min-height: 0;
        border: 6px solid rgba(255,255,255,0.78);
        border-radius: 34px;
        background: rgba(255,255,255,0.22);
        box-shadow: 0 12px 28px rgba(0,0,0,0.13);
        padding: clamp(10px, 1.5vw, 18px);
      }

      .memory-board.count-8 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        grid-template-rows: repeat(2, minmax(0, 1fr));
      }

      .memory-board.count-12 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        grid-template-rows: repeat(3, minmax(0, 1fr));
      }

      .memory-board.count-16 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        grid-template-rows: repeat(4, minmax(0, 1fr));
      }

      .memory-card {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        border: 0;
        background: transparent;
        perspective: 900px;
        cursor: pointer;
        touch-action: manipulation;
      }

      .memory-card:active .memory-card-inner {
        transform: scale(0.96);
      }

      .memory-card.is-open:active .memory-card-inner,
      .memory-card.is-matched:active .memory-card-inner,
      .memory-card.is-preview:active .memory-card-inner {
        transform: rotateY(180deg) scale(0.96);
      }

      .memory-card-inner {
        position: absolute;
        inset: 0;
        transform-style: preserve-3d;
        transition: transform 0.38s cubic-bezier(0.2,0.8,0.2,1);
      }

      .memory-card.is-open .memory-card-inner,
      .memory-card.is-matched .memory-card-inner,
      .memory-card.is-preview .memory-card-inner {
        transform: rotateY(180deg);
      }

      .memory-card-face {
        position: absolute;
        inset: 0;
        backface-visibility: hidden;
        border-radius: clamp(16px, 4vw, 24px);
        display: grid;
        place-items: center;
        overflow: hidden;
      }

      .memory-card-back {
        background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.72), transparent 30%),
                    linear-gradient(45deg, #48d3b5, #8ee36f, #5fc9ff, #48d3b5);
        background-size: 260% 260%;
        animation: magicRainbow 5s ease infinite;
        border: 5px solid #fff;
        box-shadow: inset 0 0 18px rgba(255,255,255,0.72), 0 7px 0 rgba(0,0,0,0.18);
        color: #fff;
      }

      .memory-card-back::before {
        content: '🌟';
        font-size: clamp(42px, 13vw, 76px);
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.26));
        animation: starPulse 1.5s ease-in-out infinite alternate;
      }

      @keyframes magicRainbow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      @keyframes starPulse {
        0% { transform: scale(0.86) rotate(-12deg); opacity: 0.9; }
        100% { transform: scale(1.16) rotate(12deg); opacity: 1; }
      }

      .memory-card.hint-red:not(.is-open):not(.is-matched):not(.is-preview) .memory-card-back {
        border-color: #ff5a6f;
        box-shadow: inset 0 0 18px rgba(255,255,255,0.72), 0 7px 0 rgba(0,0,0,0.18), 0 0 0 5px rgba(255,90,111,0.34), 0 0 22px rgba(255,90,111,0.68);
        animation: magicRainbow 5s ease infinite, memoryHintPulseRed 1.35s ease-in-out infinite alternate;
      }

      .memory-card.hint-yellow:not(.is-open):not(.is-matched):not(.is-preview) .memory-card-back {
        border-color: #ffd23f;
        box-shadow: inset 0 0 18px rgba(255,255,255,0.72), 0 7px 0 rgba(0,0,0,0.18), 0 0 0 5px rgba(255,210,63,0.34), 0 0 22px rgba(255,210,63,0.68);
        animation: magicRainbow 5s ease infinite, memoryHintPulseYellow 1.35s ease-in-out infinite alternate;
      }

      .memory-card.hint-blue:not(.is-open):not(.is-matched):not(.is-preview) .memory-card-back {
        border-color: #4d96ff;
        box-shadow: inset 0 0 18px rgba(255,255,255,0.72), 0 7px 0 rgba(0,0,0,0.18), 0 0 0 5px rgba(77,150,255,0.34), 0 0 22px rgba(77,150,255,0.68);
        animation: magicRainbow 5s ease infinite, memoryHintPulseBlue 1.35s ease-in-out infinite alternate;
      }

      .memory-card.hint-green:not(.is-open):not(.is-matched):not(.is-preview) .memory-card-back {
        border-color: #69db7c;
        box-shadow: inset 0 0 18px rgba(255,255,255,0.72), 0 7px 0 rgba(0,0,0,0.18), 0 0 0 5px rgba(105,219,124,0.34), 0 0 22px rgba(105,219,124,0.68);
        animation: magicRainbow 5s ease infinite, memoryHintPulseGreen 1.35s ease-in-out infinite alternate;
      }

      .memory-card.hint-purple:not(.is-open):not(.is-matched):not(.is-preview) .memory-card-back {
        border-color: #b197fc;
        box-shadow: inset 0 0 18px rgba(255,255,255,0.72), 0 7px 0 rgba(0,0,0,0.18), 0 0 0 5px rgba(177,151,252,0.34), 0 0 22px rgba(177,151,252,0.68);
        animation: magicRainbow 5s ease infinite, memoryHintPulsePurple 1.35s ease-in-out infinite alternate;
      }

      .memory-card.hint-pink:not(.is-open):not(.is-matched):not(.is-preview) .memory-card-back {
        border-color: #ff8cc6;
        box-shadow: inset 0 0 18px rgba(255,255,255,0.72), 0 7px 0 rgba(0,0,0,0.18), 0 0 0 5px rgba(255,140,198,0.34), 0 0 22px rgba(255,140,198,0.68);
        animation: magicRainbow 5s ease infinite, memoryHintPulsePink 1.35s ease-in-out infinite alternate;
      }

      @keyframes memoryHintPulseRed {
        from { filter: drop-shadow(0 0 0 rgba(255,90,111,0)); }
        to { filter: drop-shadow(0 0 12px rgba(255,90,111,0.72)); }
      }

      @keyframes memoryHintPulseYellow {
        from { filter: drop-shadow(0 0 0 rgba(255,210,63,0)); }
        to { filter: drop-shadow(0 0 12px rgba(255,210,63,0.72)); }
      }

      @keyframes memoryHintPulseBlue {
        from { filter: drop-shadow(0 0 0 rgba(77,150,255,0)); }
        to { filter: drop-shadow(0 0 12px rgba(77,150,255,0.72)); }
      }

      @keyframes memoryHintPulseGreen {
        from { filter: drop-shadow(0 0 0 rgba(105,219,124,0)); }
        to { filter: drop-shadow(0 0 12px rgba(105,219,124,0.72)); }
      }

      @keyframes memoryHintPulsePurple {
        from { filter: drop-shadow(0 0 0 rgba(177,151,252,0)); }
        to { filter: drop-shadow(0 0 12px rgba(177,151,252,0.72)); }
      }

      @keyframes memoryHintPulsePink {
        from { filter: drop-shadow(0 0 0 rgba(255,140,198,0)); }
        to { filter: drop-shadow(0 0 12px rgba(255,140,198,0.72)); }
      }

      .memory-card-front {
        transform: rotateY(180deg);
        background: linear-gradient(180deg,#ffffff 0%,#fff5bd 100%);
        border: 5px solid #fff;
        box-shadow: 0 7px 0 rgba(0,0,0,0.18), inset 0 3px 0 rgba(255,255,255,0.55);
      }

      .memory-card-front img {
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 7px 0 rgba(0,0,0,0.12));
        transform: scale(var(--vehicle-scale, 1.16));
      }

      .memory-card-fallback {
        font-size: clamp(48px, 15vw, 82px);
      }

      .memory-card-front .memory-emoji-face {
        font-size: clamp(56px, 18vw, 94px);
        line-height: 1;
        filter: drop-shadow(0 6px 0 rgba(0,0,0,0.15));
      }

      .memory-card.is-matched {
        z-index: 10;
      }

      .memory-card.is-matched .memory-card-face {
        border-color: #7ed957;
        box-shadow: 0 7px 0 rgba(34,120,54,0.26), 0 0 0 6px rgba(126,217,87,0.35);
      }

      .memory-card.is-matched .memory-card-front::after {
        content: '⭐';
        position: absolute;
        right: 7px;
        top: 5px;
        z-index: 2;
        font-size: clamp(20px, 6vw, 34px);
        filter: drop-shadow(0 3px 0 rgba(0,0,0,0.18));
        animation: matchedStarPop 0.42s ease-out;
      }

      @keyframes matchedStarPop {
        0% { transform: scale(0.2) rotate(-20deg); opacity: 0; }
        70% { transform: scale(1.24) rotate(8deg); opacity: 1; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }

      .memory-card.is-matched .memory-card-inner {
        animation: cardBounce 0.56s cubic-bezier(0.2, 0.8, 0.2, 1);
      }

      @keyframes cardBounce {
        0% { transform: rotateY(180deg) scale(1); }
        50% { transform: rotateY(180deg) scale(1.12) translateY(-8px); }
        100% { transform: rotateY(180deg) scale(1); }
      }

      .memory-card.is-wrong .memory-card-inner {
        animation: wrongShake 0.46s ease-in-out;
      }

      @keyframes wrongShake {
        0%, 100% { transform: rotateY(180deg) translateX(0); }
        20% { transform: rotateY(180deg) translateX(-7px); }
        40% { transform: rotateY(180deg) translateX(7px); }
        60% { transform: rotateY(180deg) translateX(-5px); }
        80% { transform: rotateY(180deg) translateX(5px); }
      }

      .memory-card.is-finale .memory-card-inner {
        animation: finaleDance 1.5s infinite alternate;
      }

      @keyframes finaleDance {
        0% { transform: rotateY(180deg) translateY(0) rotate(0deg); }
        33% { transform: rotateY(180deg) translateY(-8px) rotate(-3deg); }
        66% { transform: rotateY(180deg) translateY(0) rotate(3deg); }
        100% { transform: rotateY(180deg) translateY(-8px) rotate(0deg); }
      }

      .memory-speech-banner {
        position: absolute;
        left: 50%;
        bottom: 16px;
        z-index: 16;
        transform: translateX(-50%);
        width: min(92vw, 560px);
        min-height: 54px;
        padding: 12px 18px;
        border-radius: 999px;
        border: 5px solid #fff;
        background: linear-gradient(180deg,#ffffff 0%,#fff4a7 100%);
        box-shadow: 0 8px 0 rgba(0,0,0,0.18);
        color: #17324a;
        text-align: center;
        font-size: clamp(20px, 5.4vw, 30px);
        font-weight: 900;
        line-height: 1.14;
        display: grid;
        place-items: center;
        pointer-events: none;
        animation: speechPop 0.22s ease-out;
      }

      .memory-landscape .memory-speech-banner {
        bottom: max(18px, env(safe-area-inset-bottom));
        width: min(58vw, 620px);
      }

      .memory-speech-banner.preview {
        background: linear-gradient(180deg,#ffffff 0%,#c9f7ff 100%);
        color: #0d47a1;
      }

      @keyframes speechPop {
        from { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.94); }
        to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
      }

      .memory-success-panel {
        position: absolute;
        inset: 0;
        z-index: 20;
        display: grid;
        place-items: center;
        padding: 18px;
        background: rgba(255,122,26,0.18);
        backdrop-filter: blur(4px);
        animation: fadeIn 0.4s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.94); }
        to { opacity: 1; transform: scale(1); }
      }

      .memory-success-box {
        width: min(92vw, 520px);
        border-radius: 28px;
        background: rgba(255,255,255,0.96);
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
        animation: starPulse 1s infinite alternate;
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

      .memory-game-btn {
        min-height: 52px;
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

      .memory-category-sheet {
        position: absolute;
        inset: 0;
        z-index: 30;
        display: grid;
        align-items: end;
        background: rgba(0,0,0,0.24);
        animation: sheetFadeIn 0.18s ease-out;
      }

      @keyframes sheetFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .memory-category-sheet-box {
        width: 100%;
        max-height: min(72vh, 520px);
        padding: 16px 14px calc(18px + env(safe-area-inset-bottom));
        border-radius: 28px 28px 0 0;
        border: 6px solid #fff;
        border-bottom: 0;
        background: linear-gradient(180deg,#ffffff 0%,#eefaff 100%);
        box-shadow: 0 -10px 28px rgba(0,0,0,0.22);
        display: grid;
        gap: 12px;
        animation: sheetSlideUp 0.22s cubic-bezier(0.2,0.8,0.2,1);
      }

      .memory-landscape .memory-category-sheet {
        align-items: center;
        justify-items: center;
      }

      .memory-landscape .memory-category-sheet-box {
        width: min(640px, 74vw);
        max-height: min(82vh, 620px);
        border-radius: 30px;
        border-bottom: 6px solid #fff;
      }

      @keyframes sheetSlideUp {
        from { transform: translateY(24px); }
        to { transform: translateY(0); }
      }

      .memory-category-sheet-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .memory-category-sheet-title {
        font-size: clamp(23px, 6vw, 34px);
        font-weight: 900;
        color: #17324a;
        line-height: 1.05;
      }

      .memory-category-sheet-close {
        width: 48px;
        height: 48px;
        border-radius: 999px;
        border: 4px solid #fff;
        background: linear-gradient(180deg,#fff 0%,#ffe577 100%);
        box-shadow: 0 5px 0 rgba(0,0,0,0.16);
        color: #17324a;
        font-family: inherit;
        font-size: 22px;
        font-weight: 900;
        cursor: pointer;
      }

      .memory-category-sheet-close:active {
        transform: translateY(3px);
        box-shadow: 0 2px 0 rgba(0,0,0,0.16);
      }

      .memory-category-sheet-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        overflow-y: auto;
        padding: 2px 2px 6px;
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
        .memory-game-container {
          padding: 7px 8px 10px;
          gap: 6px;
        }

        .memory-control-panel {
          gap: 4px 6px;
          grid-template-columns: minmax(0, 1fr) 82px;
        }

        .memory-filter-row {
          gap: 6px;
          padding-bottom: 3px;
        }

        .memory-level-chip {
          min-height: 36px;
          padding: 0 14px;
        }

        .memory-cat-chip {
          min-height: 38px;
          padding: 0 13px;
        }

        .memory-category-picker-btn {
          min-width: 82px;
          padding: 0 8px;
          border-radius: 18px;
          border-width: 3px;
        }

        .memory-board {
          gap: 7px;
        }

        .memory-card-face {
          border-width: 4px;
        }

        .memory-card-front img {
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          transform: scale(var(--vehicle-scale, 1.18));
        }

        .memory-category-sheet-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 9px;
        }

        .memory-vehicle-cat-chip {
          min-height: 50px;
          font-size: 16px;
          padding: 0 10px;
        }
      }

      @media (max-height: 720px) {
        .memory-game-container {
          padding-top: 5px;
          gap: 5px;
        }

        .memory-filter-row {
          padding-bottom: 2px;
        }

        .memory-level-chip,
        .memory-cat-chip {
          min-height: 34px;
          font-size: 15px;
          padding: 0 12px;
        }

        .memory-category-picker-btn {
          font-size: 13px;
        }

        .memory-board {
          gap: 6px;
        }
      }

      @media (max-height: 620px) {
        .memory-level-chip,
        .memory-cat-chip {
          min-height: 31px;
          font-size: 14px;
          padding: 0 10px;
        }

        .memory-category-picker-btn {
          min-width: 76px;
          font-size: 12px;
          border-width: 3px;
        }

        .memory-control-panel {
          gap: 2px 5px;
          grid-template-columns: minmax(0, 1fr) 76px;
        }

        .memory-board {
          gap: 5px;
        }

        .memory-speech-banner {
          bottom: 10px;
          min-height: 46px;
          padding: 9px 14px;
          border-width: 4px;
        }

        .memory-category-sheet-box {
          max-height: 78vh;
          padding-top: 12px;
          gap: 9px;
        }

        .memory-category-sheet-title {
          font-size: 22px;
        }

        .memory-category-sheet-close {
          width: 42px;
          height: 42px;
          font-size: 20px;
        }

        .memory-vehicle-cat-chip {
          min-height: 44px;
          font-size: 14px;
        }
      }

      @media (orientation: landscape) and (max-height: 540px) {
        .memory-game-container.memory-landscape {
          grid-template-columns: minmax(210px, 0.7fr) minmax(360px, 1.3fr);
          gap: 10px;
          padding: 10px;
        }

        .memory-land-left {
          gap: 8px;
        }

        .memory-land-title-card,
        .memory-landscape .memory-control-panel,
        .memory-landscape .memory-board {
          border-width: 4px;
          border-radius: 24px;
          padding: 10px;
        }

        .memory-land-title-emoji {
          font-size: 38px;
        }

        .memory-land-title {
          font-size: 20px;
        }

        .memory-land-sub {
          font-size: 13px;
        }

        .memory-landscape .memory-level-chip {
          min-height: 34px;
          font-size: 13px;
          padding: 0 10px;
        }

        .memory-landscape .memory-cat-chip {
          min-height: 36px;
          font-size: 13px;
          padding: 0 10px;
        }

        .memory-landscape .memory-category-picker-btn {
          min-height: 42px;
          font-size: 13px;
        }

        .memory-landscape .memory-board {
          gap: 6px;
        }

        .memory-landscape .memory-speech-banner {
          min-height: 42px;
          font-size: 18px;
        }
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
    const baseId = vehicle.id || `${file}-${index}`;
    const name = vehicle.name_ko || vehicle.name || vehicle.title || vehicle.id || `vehicle-${index}`;
    const category = vehicle.category || 'transport';
    const role = vehicle.role_ko
      || vehicle.work_ko
      || vehicle.job_ko
      || vehicle.desc_ko
      || vehicle.description_ko
      || vehicle.sound_ko
      || VEHICLE_ROLE_FALLBACKS[category]
      || '멋진 일을 해요';

    const scaleValue = Number(vehicle.scale || vehicle.image_scale || vehicle.card_scale || 0);
    const scale = Number.isFinite(scaleValue) && scaleValue > 0 ? scaleValue : null;

    return {
      ...vehicle,
      id: baseId,
      baseId,
      name,
      file,
      category,
      role,
      sound: vehicle.sound_ko || role,
      scale,
      voiceNameId: vehicle.voice_name_id || vehicle.voiceNameId || vehicle.name_voice_id || vehicle.nameVoiceId || vehicle.name_audio_id || vehicle.nameAudioId || '',
      voiceRoleId: vehicle.voice_role_id || vehicle.voiceRoleId || vehicle.role_voice_id || vehicle.roleVoiceId || vehicle.work_voice_id || vehicle.workVoiceId || vehicle.sound_id || vehicle.soundId || vehicle.audio_id || vehicle.audioId || '',
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
    const pairCount = Math.floor(selectedCardCount / 2);

    let expanded = [...sourcePool];
    while (expanded.length < pairCount) expanded = expanded.concat(sourcePool);

    const source = shuffle(expanded).slice(0, pairCount);

    return shuffle(source.flatMap((vehicle, index) => {
      const pairKey = `${vehicle.baseId || vehicle.id}-${index}`;
      return [
        { ...vehicle, id: pairKey, pairKey, uid: `${pairKey}-a` },
        { ...vehicle, id: pairKey, pairKey, uid: `${pairKey}-b` }
      ];
    }));
  }

  function pickRoundEmoji() {
    const pool = EMOJI_CATEGORIES[selectedCategory] || [];
    const pairCount = Math.floor(selectedCardCount / 2);

    let expanded = [...pool];
    while (expanded.length < pairCount) expanded = expanded.concat(pool);

    const picked = shuffle(expanded).slice(0, pairCount);

    return shuffle(picked.flatMap((item, index) => {
      const pairKey = `${item.id}-${index}`;
      return [
        { ...item, id: pairKey, pairKey, uid: `${pairKey}-a`, isEmoji: true },
        { ...item, id: pairKey, pairKey, uid: `${pairKey}-b`, isEmoji: true }
      ];
    }));
  }

  function render(container, options = {}) {
    destroy();
    injectStyle();

    state.container = container;
    state.options = options;
    state.destroyed = false;
    state.round = 1;
    state.layoutMode = getLayoutMode();
    state.currentScreen = 'game';
    state.successRewardGiven = false;

    container.innerHTML = `
      <div class="memory-game-container memory-${state.layoutMode}">
        <div class="memory-loading">자동차 카드를 준비하고 있어요!</div>
      </div>
    `;

    state.handleResizeBound = handleResize;
    window.addEventListener('resize', state.handleResizeBound);
    window.addEventListener('orientationchange', state.handleResizeBound);

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
          <div class="memory-game-container memory-${getLayoutMode()}">
            <div class="memory-error">자동차 카드를 불러오지 못했어요.</div>
          </div>
        `;
      });
  }

  function startRound() {
    if (!state.container) return;

    clearTimers();

    state.cards = selectedCategory === '🚗탈것'
      ? pickRoundVehicles()
      : pickRoundEmoji();

    state.flipped = [];
    state.matched = 0;
    state.matchedPairKeys = new Set();
    state.locked = false;
    state.isPreviewing = false;
    state.seenCards = new Set();
    state.seenPairs = {};
    state.hintPairs = {};
    state.wrongCount = 0;
    state.hintColorIndex = 0;
    state.currentScreen = 'game';
    state.successRewardGiven = false;

    renderMemoryBoard();
    playGameVoice('games.memory.intro');
    startPreview();
  }

  function getLevelBarMarkup() {
    return `
      <div class="memory-filter-row memory-level-row" aria-label="카드 개수 선택">
        ${[8, 12, 16].map(num => `
          <button class="memory-level-chip ${selectedCardCount === num ? 'active' : ''}"
            type="button" data-count="${num}">
            ${num === 8 ? '8장 쉬움' : num === 12 ? '12장 보통' : '16장 도전'}
          </button>
        `).join('')}
      </div>
    `;
  }

  function getCategoryBarMarkup() {
    return `
      <div class="memory-filter-row memory-main-cat-row" aria-label="카테고리 선택">
        ${['🚗탈것', ...Object.keys(EMOJI_CATEGORIES)].map(cat => `
          <button class="memory-cat-chip ${selectedCategory === cat ? 'active' : ''}"
            type="button" data-cat="${cat}">${cat}</button>
        `).join('')}
      </div>
    `;
  }

  function getPickerButtonMarkup() {
    return selectedCategory === '🚗탈것'
      ? `
        <button class="memory-category-picker-btn" type="button" data-action="open-category-sheet">
          ${getSelectedVehicleCategoryLabel()}<br>바꾸기
        </button>
      `
      : '';
  }

  function getControlPanelMarkup() {
    return `
      <div class="memory-control-panel ${selectedCategory === '🚗탈것' ? 'has-picker' : 'no-picker'}">
        ${getLevelBarMarkup()}
        ${getCategoryBarMarkup()}
        ${getPickerButtonMarkup()}
      </div>
    `;
  }

  function getCardClass(card, index) {
    const classes = ['memory-card'];

    if (state.isPreviewing) classes.push('is-preview');
    if (state.matchedPairKeys.has(card.pairKey)) classes.push('is-matched');
    if (state.flipped.some((item) => item.index === index)) classes.push('is-open');

    return classes.join(' ');
  }

  function getBoardMarkup() {
    return `
      <div class="memory-board count-${selectedCardCount}" role="grid" aria-label="카드 맞추기">
        ${state.cards.map((card, index) => {
          const scale = Number(card.scale || 0);
          const scaleStyle = scale > 0 ? ` style="--vehicle-scale:${escapeAttr(scale)}"` : '';

          return `
            <button class="${getCardClass(card, index)}" type="button" data-index="${index}" data-pair-key="${escapeAttr(card.pairKey)}" aria-label="카드">
              <span class="memory-card-inner">
                <span class="memory-card-face memory-card-back"></span>
                <span class="memory-card-face memory-card-front">
                  ${card.isEmoji
                    ? `<span class="memory-emoji-face">${card.emoji}</span>`
                    : `<img src="./${card.file}" alt="${escapeAttr(card.name)}" draggable="false"${scaleStyle}>
                       <span class="memory-card-fallback" hidden>🚗</span>`
                  }
                </span>
              </span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  function getMemorySuccessMarkup() {
    if (state.currentScreen !== 'success') return '';

    return `
      <div class="memory-success-panel">
        <div class="memory-success-box">
          <div class="memory-success-icon">🏆</div>
          <div class="memory-success-title">다 찾았다!<br>다음 판 갈까?</div>
          <div class="memory-success-actions">
            <button class="memory-game-btn" type="button" data-action="restart-success">다시 하기</button>
            <button class="memory-game-btn" type="button" data-action="next">다음 판!</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderMemoryBoard() {
    const layoutMode = getLayoutMode();
    state.layoutMode = layoutMode;

    if (layoutMode === 'landscape') {
      state.container.innerHTML = `
        <div class="memory-game-container memory-landscape">
          <aside class="memory-land-left">
            <div class="memory-land-title-card">
              <div class="memory-land-title-emoji">🚗🧠</div>
              <div class="memory-land-title">메모리 게임</div>
              <div class="memory-land-sub">카드를 기억해서<br>같은 짝을 찾아요</div>
            </div>
            ${getControlPanelMarkup()}
          </aside>

          <main class="memory-land-main">
            ${getBoardMarkup()}
          </main>

          ${getMemorySuccessMarkup()}
        </div>
      `;
    } else {
      state.container.innerHTML = `
        <div class="memory-game-container memory-portrait">
          ${getControlPanelMarkup()}
          ${getBoardMarkup()}
          ${getMemorySuccessMarkup()}
        </div>
      `;
    }

    bindBoardEvents();
    refreshFlippedElements();
    applyHintClasses();
  }

  function refreshFlippedElements() {
    if (!state.container || !state.flipped.length) return;

    state.flipped = state.flipped.map((item) => ({
      ...item,
      el: state.container.querySelector(`.memory-card[data-index="${item.index}"]`)
    })).filter((item) => item.el);
  }

  function bindBoardEvents() {
    const root = state.container;
    if (!root) return;

    root.querySelector('[data-action="open-category-sheet"]')?.addEventListener('click', openCategorySheet);

    root.querySelectorAll('.memory-card').forEach((card) => {
      card.addEventListener('click', () => handleMemoryCardClick(Number(card.dataset.index)));
    });

    root.querySelectorAll('.memory-card-front img').forEach((img) => {
      img.addEventListener('error', () => {
        img.hidden = true;
        if (img.nextElementSibling) img.nextElementSibling.hidden = false;
      });
    });

    root.querySelectorAll('.memory-cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        selectedCategory = chip.dataset.cat;
        state.round = 1;
        startRound();
      });
    });

    root.querySelectorAll('.memory-level-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        selectedCardCount = parseInt(chip.dataset.count, 10);
        state.round = 1;
        startRound();
      });
    });

    root.querySelector('[data-action="restart-success"]')?.addEventListener('click', restartMemoryGame);
    root.querySelector('[data-action="next"]')?.addEventListener('click', nextMemoryGame);
  }

  function startPreview() {
    if (!state.container) return;

    clearTimeout(state.previewTimer);

    state.isPreviewing = true;
    state.locked = true;

    state.container.querySelectorAll('.memory-card').forEach((card) => {
      card.classList.add('is-preview');
    });

    showSpeechBanner('잠깐 보고 기억해요!', 'preview');

    state.previewTimer = window.setTimeout(() => {
      endPreview();
    }, PREVIEW_MS);
  }

  function endPreview() {
    if (!state.container || state.destroyed) return;

    state.container.querySelectorAll('.memory-card').forEach((card) => {
      card.classList.remove('is-preview');
    });

    hideSpeechBanner();

    state.isPreviewing = false;
    state.locked = false;
    state.flipped = [];
    state.seenCards = new Set();
    state.seenPairs = {};
    state.hintPairs = {};
    state.wrongCount = 0;
    state.hintColorIndex = 0;

    applyHintClasses();
  }

  function openCategorySheet() {
    if (!state.container || selectedCategory !== '🚗탈것') return;

    const existing = state.container.querySelector('.memory-category-sheet');
    if (existing) existing.remove();

    const availableVehicleCategories = new Set(state.vehicles.map((vehicle) => vehicle.category));
    const categories = VEHICLE_CATEGORIES.filter((cat) => cat.id === 'all' || availableVehicleCategories.has(cat.id));

    const sheet = document.createElement('div');
    sheet.className = 'memory-category-sheet';
    sheet.innerHTML = `
      <div class="memory-category-sheet-box" role="dialog" aria-label="자동차 종류 선택">
        <div class="memory-category-sheet-head">
          <div class="memory-category-sheet-title">자동차 종류를 골라요</div>
          <button class="memory-category-sheet-close" type="button" data-action="close-category-sheet" aria-label="닫기">×</button>
        </div>
        <div class="memory-category-sheet-grid">
          ${categories.map((cat) => `
            <button class="memory-vehicle-cat-chip ${selectedVehicleCategory === cat.id ? 'active' : ''}"
              type="button" data-vehicle-cat="${cat.id}">${cat.label}</button>
          `).join('')}
        </div>
      </div>
    `;

    state.container.querySelector('.memory-game-container')?.appendChild(sheet);

    sheet.addEventListener('click', (event) => {
      if (event.target === sheet) {
        closeCategorySheet();
      }
    });

    sheet.querySelector('[data-action="close-category-sheet"]')?.addEventListener('click', closeCategorySheet);

    sheet.querySelectorAll('.memory-vehicle-cat-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        selectedVehicleCategory = chip.dataset.vehicleCat || 'all';
        closeCategorySheet();
        state.round = 1;
        startRound();
      });
    });
  }

  function closeCategorySheet() {
    const sheet = state.container?.querySelector('.memory-category-sheet');
    if (sheet) sheet.remove();
  }

  function getSelectedVehicleCategoryLabel() {
    const found = VEHICLE_CATEGORIES.find((cat) => cat.id === selectedVehicleCategory);
    return found ? found.label : '🚗전체';
  }

  function handleMemoryCardClick(index) {
    if (state.locked || state.isPreviewing || state.currentScreen === 'success') return;

    const cardData = state.cards[index];
    const cardEl = state.container?.querySelector(`.memory-card[data-index="${index}"]`);

    if (!cardData || !cardEl || cardEl.classList.contains('is-open') || cardEl.classList.contains('is-matched')) return;

    cardEl.classList.add('is-open');
    rememberSeenCard(index, cardData);
    state.flipped.push({ index, data: cardData, el: cardEl });
    applyHintClasses();

    if (state.flipped.length === 1) {
      announceCardName(cardData);
      return;
    }

    if (state.flipped.length === 2) {
      checkMemoryMatch();
    }
  }

  function rememberSeenCard(index, cardData) {
    const pairKey = cardData?.pairKey || cardData?.id;
    if (!pairKey) return;

    state.seenCards.add(index);

    if (!state.seenPairs[pairKey]) {
      state.seenPairs[pairKey] = [];
    }

    if (!state.seenPairs[pairKey].includes(index)) {
      state.seenPairs[pairKey].push(index);
    }

    maybeRegisterHint(pairKey);
  }

  function maybeRegisterHint(pairKey) {
    if (!pairKey) return;
    if (state.hintPairs[pairKey]) return;
    if (!isHintAllowed()) return;

    const seenIndexes = state.seenPairs[pairKey] || [];
    const uniqueIndexes = Array.from(new Set(seenIndexes));
    if (uniqueIndexes.length < 2) return;

    const hasMatchedCard = uniqueIndexes.some((index) => {
      const cardEl = state.container?.querySelector(`.memory-card[data-index="${index}"]`);
      return cardEl?.classList.contains('is-matched') || state.matchedPairKeys.has(pairKey);
    });

    if (hasMatchedCard) return;

    const color = HINT_COLORS[state.hintColorIndex % HINT_COLORS.length];
    state.hintColorIndex += 1;
    state.hintPairs[pairKey] = color;
  }

  function isHintAllowed() {
    if (selectedCardCount === 16) {
      return state.wrongCount >= 2;
    }
    return true;
  }

  function refreshHintsAfterWrong() {
    Object.keys(state.seenPairs).forEach((pairKey) => {
      maybeRegisterHint(pairKey);
    });
    applyHintClasses();
  }

  function applyHintClasses() {
    if (!state.container) return;

    state.container.querySelectorAll('.memory-card').forEach((cardEl) => {
      HINT_COLORS.forEach((color) => cardEl.classList.remove(`hint-${color}`));

      if (cardEl.classList.contains('is-matched') || cardEl.classList.contains('is-open') || cardEl.classList.contains('is-preview')) {
        return;
      }

      const pairKey = cardEl.dataset.pairKey;
      const color = pairKey ? state.hintPairs[pairKey] : '';
      if (color) {
        cardEl.classList.add(`hint-${color}`);
      }
    });
  }

  function clearHintForPair(pairKey) {
    if (!pairKey) return;
    delete state.hintPairs[pairKey];
    applyHintClasses();
  }

  function getCardElement(index, fallbackEl) {
    return state.container?.querySelector(`.memory-card[data-index="${index}"]`) || fallbackEl;
  }

  function checkMemoryMatch() {
    const [first, second] = state.flipped;
    state.locked = true;

    if (first.data.pairKey === second.data.pairKey || first.data.id === second.data.id) {
      window.setTimeout(() => {
        const pairKey = first.data.pairKey || first.data.id;
        const firstEl = getCardElement(first.index, first.el);
        const secondEl = getCardElement(second.index, second.el);

        if (!firstEl || !secondEl || state.destroyed) return;

        firstEl.classList.add('is-matched');
        secondEl.classList.add('is-matched');
        HINT_COLORS.forEach((color) => {
          firstEl.classList.remove(`hint-${color}`);
          secondEl.classList.remove(`hint-${color}`);
        });

        state.matchedPairKeys.add(pairKey);
        clearHintForPair(pairKey);

        state.matched += 2;
        state.flipped = [];

        const isFinal = state.matched >= selectedCardCount;
        announceCardRole(first.data, isFinal).then(() => {
          if (state.destroyed) return;

          if (isFinal) {
            triggerFinaleAfterRole();
          } else {
            state.locked = false;
            applyHintClasses();
          }
        });
      }, 360);
      return;
    }

    state.wrongCount += 1;

    const firstEl = getCardElement(first.index, first.el);
    const secondEl = getCardElement(second.index, second.el);

    firstEl?.classList.add('is-wrong');
    secondEl?.classList.add('is-wrong');
    showSpeechBanner('다시 찾아보자!');
    playGameVoice('games.memory.wrong');

    window.setTimeout(() => {
      const latestFirstEl = getCardElement(first.index, firstEl);
      const latestSecondEl = getCardElement(second.index, secondEl);

      latestFirstEl?.classList.remove('is-wrong');
      latestSecondEl?.classList.remove('is-wrong');
      latestFirstEl?.classList.remove('is-open');
      latestSecondEl?.classList.remove('is-open');

      state.flipped = [];
      state.locked = false;

      refreshHintsAfterWrong();

      state.noticeTimer = window.setTimeout(() => {
        hideSpeechBanner();
      }, 700);
    }, 900);
  }

  function announceCardName(cardData) {
    const name = cardData?.name || '멋진 카드';
    showSpeechBanner(`${name}!`);
    playVehicleVoice(cardData, 'name');
  }

  function announceCardRole(cardData, isFinal) {
    const text = getRoleText(cardData);
    const token = ++state.pendingVoiceToken;

    showSpeechBanner(text);

    return playVehicleVoice(cardData, 'role').then(() => {
      const waitMs = estimateSpeechMs(text, isFinal);
      return wait(waitMs);
    }).then(() => {
      if (token !== state.pendingVoiceToken) return;
      if (!isFinal) hideSpeechBanner();
    });
  }

  function playVehicleVoice(cardData, type) {
    if (!cardData) return Promise.resolve(false);

    const rawBaseId = String(cardData.baseId || cardData.id || '')
      .replace(/-\d+$/g, '');

    const baseId = rawBaseId.replace(/[^a-zA-Z0-9_-]/g, '_');

    const explicitIds = type === 'name'
      ? [
          cardData.voiceNameId,
          cardData.name_voice_id,
          cardData.nameVoiceId,
          cardData.nameAudioId,
          cardData.audio_name_id,
        ]
      : [
          cardData.voiceRoleId,
          cardData.role_voice_id,
          cardData.roleVoiceId,
          cardData.work_voice_id,
          cardData.workVoiceId,
          cardData.sound_id,
          cardData.soundId,
          cardData.audio_id,
          cardData.audioId,
        ];

    const candidateIds = [
      ...explicitIds,
      `vehicles.${baseId}.${type}`,
      `vehicle.${baseId}.${type}`,
      `games.vehicleMemory.${baseId}.${type}`,
      `games.memory.${baseId}.${type}`,
      `memory.${baseId}.${type}`,
    ].filter(Boolean);

    return playFirstAvailableVoice(candidateIds);
  }

  function playFirstAvailableVoice(ids) {
    if (!window.SihyeonVoice || typeof window.SihyeonVoice.play !== 'function') {
      return Promise.resolve(false);
    }

    let index = 0;

    function next() {
      const id = ids[index];
      index += 1;

      if (!id) return Promise.resolve(false);

      return window.SihyeonVoice.play(id)
        .then(() => true)
        .catch(() => next());
    }

    return next();
  }

  function getRoleText(cardData) {
    if (!cardData) return '멋진 일을 해요';

    const name = cardData.name || '';
    const role = cardData.role
      || cardData.work_ko
      || cardData.job_ko
      || cardData.desc_ko
      || cardData.description_ko
      || cardData.sound
      || VEHICLE_ROLE_FALLBACKS[cardData.category]
      || '멋진 일을 해요';

    if (cardData.isEmoji) {
      return `${name}! ${role}`;
    }

    if (String(role).includes(name)) {
      return role;
    }

    return `${name}는 ${role}`;
  }

  function showSpeechBanner(text, mode) {
    if (!state.container) return;

    clearTimeout(state.noticeTimer);

    let banner = state.container.querySelector('.memory-speech-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'memory-speech-banner';
      state.container.querySelector('.memory-game-container')?.appendChild(banner);
    }

    banner.classList.toggle('preview', mode === 'preview');
    banner.textContent = text;
  }

  function hideSpeechBanner() {
    clearTimeout(state.noticeTimer);
    state.noticeTimer = null;

    const banner = state.container?.querySelector('.memory-speech-banner');
    if (banner) banner.remove();
  }

  function estimateSpeechMs(text, isFinal) {
    const len = String(text || '').replace(/\s+/g, '').length;
    const base = Math.max(1600, Math.min(4200, 900 + len * 95));
    return isFinal ? base + 500 : base;
  }

  function triggerFinaleAfterRole() {
    state.locked = true;
    state.options.fireConfetti?.();
    playGameVoice('games.memory.complete');

    state.container?.querySelectorAll('.memory-card').forEach((card, idx) => {
      window.setTimeout(() => card.classList.add('is-finale'), idx * 70);
    });

    clearTimeout(state.finaleTimer);
    state.finaleTimer = window.setTimeout(() => {
      hideSpeechBanner();
      showMemorySuccess();
    }, 850);
  }

  function showMemorySuccess() {
    if (!state.container) return;

    state.currentScreen = 'success';
    state.locked = true;

    if (!state.successRewardGiven) {
      state.options.gainExp?.(selectedCardCount * 2);
      state.successRewardGiven = true;
    }

    if (state.container.querySelector('.memory-success-panel')) return;

    const panel = document.createElement('div');
    panel.className = 'memory-success-panel';
    panel.innerHTML = `
      <div class="memory-success-box">
        <div class="memory-success-icon">🏆</div>
        <div class="memory-success-title">다 찾았다!<br>다음 판 갈까?</div>
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

  function handleResize() {
    if (state.destroyed || !state.container) return;

    clearTimeout(state.resizeTimer);

    state.resizeTimer = window.setTimeout(() => {
      if (state.destroyed || !state.container) return;

      const nextMode = getLayoutMode();

      if (nextMode !== state.layoutMode) {
        renderMemoryBoard();
      }
    }, 150);
  }

  function clearTimers() {
    clearTimeout(state.noticeTimer);
    clearTimeout(state.finaleTimer);
    clearTimeout(state.previewTimer);
    clearTimeout(state.resizeTimer);
    state.noticeTimer = null;
    state.finaleTimer = null;
    state.previewTimer = null;
    state.resizeTimer = null;
    state.pendingVoiceToken += 1;
  }

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function destroy() {
    clearTimers();

    state.destroyed = true;

    if (state.handleResizeBound) {
      window.removeEventListener('resize', state.handleResizeBound);
      window.removeEventListener('orientationchange', state.handleResizeBound);
      state.handleResizeBound = null;
    }

    if (state.container) state.container.innerHTML = '';

    state.container = null;
    state.options = {};
    state.cards = [];
    state.flipped = [];
    state.matched = 0;
    state.matchedPairKeys = new Set();
    state.locked = false;
    state.isPreviewing = false;
    state.seenCards = new Set();
    state.seenPairs = {};
    state.hintPairs = {};
    state.wrongCount = 0;
    state.hintColorIndex = 0;
    state.layoutMode = 'portrait';
    state.currentScreen = 'game';
    state.successRewardGiven = false;
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