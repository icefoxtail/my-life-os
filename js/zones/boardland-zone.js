/**
 * 시현이 놀이터 OS — 빙글빙글 보드랜드
 * 파일: js/zones/boardland-zone.js
 * 버전: v1.1.0
 * 특징:
 * - 8칸 완전 랜덤 룰렛
 * - 글자 못 읽는 아이 기준: 아이콘/음성/큰 버튼 중심
 * - 모바일 가로모드 + 태블릿 큰 화면 최적화
 * - 룰렛 결과 중앙 팡 효과
 * - 완주 후 큰 🔄 다시 놀기 버튼
 * - 독립 실행 가능: window.openBoardLandZone()
 */
(function () {
  'use strict';

  const ZONE_ID = 'boardland';
  const STYLE_ID = 'sihyeon-boardland-style';
  const ROOT_ID = 'sihyeon-boardland-root';

  const ROULETTE_ITEMS = [
    { id: 'move_1', emoji: '➡️', label: '한 칸 앞으로', type: 'move', value: 1, voice: 'boardland.move1' },
    { id: 'move_2', emoji: '⏩', label: '두 칸 앞으로', type: 'move', value: 2, voice: 'boardland.move2' },
    { id: 'move_3', emoji: '⏩⏩', label: '세 칸 앞으로', type: 'move', value: 3, voice: 'boardland.move3' },
    { id: 'spin_again', emoji: '🔁', label: '한 번 더', type: 'bonus', value: 'spin_again', voice: 'boardland.spinAgain' },
    { id: 'animal_mission', emoji: '🐶', label: '동물 미션', type: 'mission', value: 'animal', voice: 'boardland.animalMission' },
    { id: 'car_mission', emoji: '🚗', label: '자동차 미션', type: 'mission', value: 'car', voice: 'boardland.carMission' },
    { id: 'family_mission', emoji: '👨‍👩‍👧', label: '가족 미션', type: 'mission', value: 'family', voice: 'boardland.familyMission' },
    { id: 'gift_card', emoji: '🎁', label: '선물 카드', type: 'card', value: 'gift', voice: 'boardland.giftCard' }
  ];

  const BOARD_CELLS = [
    { icon: '🚩', kind: 'start', voice: 'boardland.cell.start' },
    { icon: '⭐', kind: 'star', voice: 'boardland.cell.star1' },
    { icon: '🌈', kind: 'rainbow', voice: 'boardland.cell.rainbow1' },
    { icon: '💗', kind: 'heart', voice: 'boardland.cell.heart1' },
    { icon: '🚓', kind: 'car', voice: 'boardland.cell.police' },
    { icon: '🐶', kind: 'animal', voice: 'boardland.cell.dog' },
    { icon: '🚗', kind: 'car', voice: 'boardland.cell.car' },
    { icon: '⭐', kind: 'star', voice: 'boardland.cell.star2' },
    { icon: '🚑', kind: 'rescue', voice: 'boardland.cell.ambulance' },
    { icon: '💗', kind: 'heart', voice: 'boardland.cell.heart2' },
    { icon: '👑', kind: 'crown', voice: 'boardland.cell.crown' },
    { icon: '🐧', kind: 'animal', voice: 'boardland.cell.penguin' },
    { icon: '🎁', kind: 'gift', voice: 'boardland.cell.gift1' },
    { icon: '⭐', kind: 'star', voice: 'boardland.cell.star3' },
    { icon: '🚒', kind: 'fire', voice: 'boardland.cell.firetruck' },
    { icon: '🍀', kind: 'lucky', voice: 'boardland.cell.clover' },
    { icon: '🦁', kind: 'animal', voice: 'boardland.cell.lion' },
    { icon: '🌈', kind: 'rainbow', voice: 'boardland.cell.rainbow2' },
    { icon: '🐼', kind: 'animal', voice: 'boardland.cell.panda' },
    { icon: '🎁', kind: 'gift', voice: 'boardland.cell.gift2' },
    { icon: '⭐', kind: 'star', voice: 'boardland.cell.star4' },
    { icon: '🐵', kind: 'animal', voice: 'boardland.cell.monkey' },
    { icon: '🎈', kind: 'balloon', voice: 'boardland.cell.balloon' },
    { icon: '🏁', kind: 'finish', voice: 'boardland.cell.finish' }
  ];

  const BOARD_POSITIONS = [
    { x: 8, y: 78 },
    { x: 20, y: 78 },
    { x: 32, y: 78 },
    { x: 44, y: 78 },
    { x: 56, y: 78 },
    { x: 68, y: 78 },
    { x: 80, y: 70 },
    { x: 88, y: 57 },
    { x: 90, y: 43 },
    { x: 86, y: 30 },
    { x: 75, y: 21 },
    { x: 62, y: 17 },
    { x: 49, y: 17 },
    { x: 36, y: 17 },
    { x: 23, y: 17 },
    { x: 11, y: 25 },
    { x: 7, y: 39 },
    { x: 7, y: 53 },
    { x: 10, y: 66 },
    { x: 19, y: 61 },
    { x: 28, y: 54 },
    { x: 36, y: 46 },
    { x: 47, y: 38 },
    { x: 58, y: 43 }
  ];

  const MISSIONS = {
    animal: [
      { icon: '🐶', title: '동물 미션', voice: 'boardland.mission.dog', effect: '🔊 멍멍!' },
      { icon: '🐱', title: '동물 미션', voice: 'boardland.mission.cat', effect: '🔊 야옹!' },
      { icon: '🦁', title: '동물 미션', voice: 'boardland.mission.lion', effect: '🔊 어흥!' },
      { icon: '🐰', title: '동물 미션', voice: 'boardland.mission.rabbit', effect: '⬆️ 깡충!' }
    ],
    car: [
      { icon: '🚗', title: '자동차 미션', voice: 'boardland.mission.car', effect: '🔊 부릉!' },
      { icon: '🚒', title: '자동차 미션', voice: 'boardland.mission.firetruck', effect: '🚨 출동!' },
      { icon: '🚓', title: '자동차 미션', voice: 'boardland.mission.police', effect: '🚨 순찰!' },
      { icon: '🚑', title: '자동차 미션', voice: 'boardland.mission.ambulance', effect: '💗 도움!' }
    ],
    family: [
      { icon: '👏', title: '가족 미션', voice: 'boardland.mission.clap', effect: '👏 짝짝!' },
      { icon: '🤗', title: '가족 미션', voice: 'boardland.mission.hug', effect: '💗 포옹!' },
      { icon: '🙌', title: '가족 미션', voice: 'boardland.mission.highfive', effect: '🙌 하이파이브!' },
      { icon: '😊', title: '가족 미션', voice: 'boardland.mission.smile', effect: '😊 방긋!' }
    ],
    gift: [
      { icon: '🎁', title: '선물 카드', voice: 'boardland.mission.giftStar', effect: '⭐ +1' },
      { icon: '💗', title: '선물 카드', voice: 'boardland.mission.giftHeart', effect: '💗 +1' },
      { icon: '🔁', title: '선물 카드', voice: 'boardland.mission.giftSpin', effect: '🔁 한 번 더!' }
    ]
  };

  const state = {
    isOpen: false,
    isSpinning: false,
    rotation: 0,
    playerIndex: 0,
    stars: 0,
    hearts: 3,
    gifts: 0,
    lastMission: null,
    audioEnabled: true,
    speechQueue: [],
    pendingSpinAgain: false
  };

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      :root {
        --bl-safe-top: env(safe-area-inset-top, 0px);
        --bl-safe-right: env(safe-area-inset-right, 0px);
        --bl-safe-bottom: env(safe-area-inset-bottom, 0px);
        --bl-safe-left: env(safe-area-inset-left, 0px);
      }

      #${ROOT_ID} {
        position: fixed;
        inset: 0;
        z-index: 9999;
        font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #38220a;
        background:
          radial-gradient(circle at 18% 14%, rgba(255,255,255,.9), rgba(255,255,255,0) 18%),
          radial-gradient(circle at 86% 18%, rgba(255,235,109,.45), rgba(255,235,109,0) 24%),
          linear-gradient(180deg, #36b7ff 0%, #7be4ff 36%, #a9f18b 72%, #5bd071 100%);
        overflow: hidden;
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
      }

      #${ROOT_ID} * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

      .bl-bg-park {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
      }

      .bl-cloud {
        position: absolute;
        width: 16vw;
        height: 6vw;
        min-width: 130px;
        min-height: 48px;
        border-radius: 999px;
        background: rgba(255,255,255,.85);
        filter: blur(.2px);
        box-shadow: 40px 8px 0 rgba(255,255,255,.74), 80px 0 0 rgba(255,255,255,.55);
        animation: blFloat 9s ease-in-out infinite;
      }
      .bl-cloud.c1 { left: 9%; top: 9%; }
      .bl-cloud.c2 { right: 18%; top: 12%; transform: scale(.72); animation-delay: -3s; }
      .bl-cloud.c3 { left: 54%; top: 5%; transform: scale(.55); animation-delay: -5s; }

      .bl-park-shape {
        position: absolute;
        border-radius: 50% 50% 12% 12%;
        opacity: .55;
        filter: saturate(1.1);
      }
      .bl-park-shape.ferris {
        left: 3%; top: 23%; width: 15vw; height: 15vw;
        border: .8vw solid rgba(255,255,255,.65);
        background: radial-gradient(circle, transparent 46%, rgba(255,255,255,.15) 48%, transparent 54%);
      }
      .bl-park-shape.castle {
        right: 2%; top: 21%; width: 15vw; height: 18vw;
        border-radius: 30% 30% 10% 10%;
        background: linear-gradient(180deg, rgba(255,150,213,.72), rgba(172,111,255,.38));
        clip-path: polygon(10% 100%,10% 35%,25% 35%,25% 18%,35% 18%,35% 35%,50% 35%,50% 10%,62% 10%,62% 35%,75% 35%,75% 24%,88% 24%,88% 100%);
      }
      .bl-park-shape.coaster {
        left: 23%; top: 25%; width: 55vw; height: 18vw;
        border-radius: 50%;
        border-top: .8vw dashed rgba(255,255,255,.65);
        transform: rotate(-5deg);
      }
      .bl-confetti {
        position: absolute;
        width: 100%;
        height: 100%;
        background-image:
          radial-gradient(circle, rgba(255,255,255,.95) 0 2px, transparent 3px),
          radial-gradient(circle, rgba(255,230,69,.95) 0 2px, transparent 3px),
          radial-gradient(circle, rgba(255,78,174,.9) 0 2px, transparent 3px),
          radial-gradient(circle, rgba(58,106,255,.85) 0 2px, transparent 3px);
        background-size: 130px 90px, 160px 120px, 210px 150px, 180px 110px;
        animation: blSparkle 6s linear infinite;
        opacity: .55;
      }

      .bl-screen {
        position: relative;
        width: 100%;
        height: 100%;
        padding: calc(12px + var(--bl-safe-top)) calc(14px + var(--bl-safe-right)) calc(12px + var(--bl-safe-bottom)) calc(14px + var(--bl-safe-left));
        display: grid;
        grid-template-rows: minmax(58px, 10vh) 1fr minmax(84px, 15vh);
        gap: clamp(6px, 1.2vh, 12px);
      }

      .bl-topbar {
        display: grid;
        grid-template-columns: minmax(150px, 28vw) 1fr minmax(230px, 34vw);
        align-items: center;
        gap: 12px;
        position: relative;
        z-index: 5;
      }

      .bl-home, .bl-gear, .bl-mini-action, .bl-spin-button, .bl-success-btn, .bl-sound-btn, .bl-replay-btn {
        border: 0;
        cursor: pointer;
        touch-action: manipulation;
        font-family: inherit;
      }

      .bl-voice-guide {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .bl-home {
        width: clamp(50px, 6.5vh, 72px);
        height: clamp(50px, 6.5vh, 72px);
        border-radius: 22px;
        background: linear-gradient(180deg, #ffce47, #ff811a);
        box-shadow: 0 8px 0 #c95e00, 0 13px 24px rgba(121,70,5,.3), inset 0 3px 0 rgba(255,255,255,.65);
        color: white;
        font-size: clamp(27px, 4.6vh, 42px);
        display: grid;
        place-items: center;
      }
      .bl-home:active, .bl-gear:active, .bl-mini-action:active, .bl-spin-button:active, .bl-success-btn:active, .bl-sound-btn:active, .bl-replay-btn:active { transform: translateY(3px) scale(.98); }

      .bl-mascot-bubble {
        flex: 1;
        height: clamp(50px, 7vh, 78px);
        border-radius: 28px;
        padding: 6px 12px 6px 6px;
        background: rgba(255,255,255,.88);
        border: 3px solid rgba(255,255,255,.95);
        box-shadow: 0 12px 30px rgba(22,111,167,.22), inset 0 -4px 0 rgba(64,153,255,.12);
        display: flex;
        align-items: center;
        gap: 10px;
        overflow: hidden;
      }
      .bl-bear {
        width: clamp(42px, 6vh, 64px);
        height: clamp(42px, 6vh, 64px);
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: linear-gradient(180deg, #ffe482, #ffac37);
        font-size: clamp(27px, 4.5vh, 44px);
        box-shadow: inset 0 4px 0 rgba(255,255,255,.6), 0 5px 12px rgba(117,68,5,.22);
      }
      .bl-speaker-pill {
        position: relative;
        flex: 1;
        height: 80%;
        border-radius: 999px;
        background: linear-gradient(90deg, rgba(68,197,255,.16), rgba(80,153,255,.34));
        display: flex;
        align-items: center;
        justify-content: center;
        color: #0b84d8;
        font-size: clamp(26px, 4.2vh, 44px);
        overflow: hidden;
      }
      .bl-speaker-pill::before, .bl-speaker-pill::after {
        content: '';
        position: absolute;
        width: 42px;
        height: 42px;
        border: 4px solid rgba(17,134,217,.28);
        border-left-color: transparent;
        border-bottom-color: transparent;
        border-radius: 50%;
        right: 17%;
        animation: blPulseRing 1.15s ease-out infinite;
      }
      .bl-speaker-pill::after { animation-delay: .35s; }

      .bl-title {
        justify-self: center;
        text-align: center;
        line-height: .9;
        color: white;
        text-shadow: 0 6px 0 rgba(0,79,169,.55), 0 10px 26px rgba(2,78,153,.4), 0 0 2px #fff;
        font-weight: 900;
        letter-spacing: -0.05em;
        font-size: clamp(30px, 5.4vh, 74px);
        transform: rotate(-1deg);
        filter: drop-shadow(0 8px 0 rgba(255,201,35,.7));
      }
      .bl-title span:nth-child(1) { color: #ff4545; }
      .bl-title span:nth-child(2) { color: #ffb52f; }
      .bl-title span:nth-child(3) { color: #5bea54; }
      .bl-title span:nth-child(4) { color: #37b4ff; }

      .bl-stats {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: clamp(7px, 1vw, 12px);
      }
      .bl-chip {
        min-width: clamp(64px, 8vw, 105px);
        height: clamp(42px, 5.8vh, 62px);
        padding: 0 13px;
        border-radius: 22px;
        background: rgba(255,255,255,.9);
        border: 3px solid rgba(255,245,210,.95);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: 0 7px 0 rgba(168,102,19,.25), 0 11px 22px rgba(52,97,126,.18), inset 0 2px 0 rgba(255,255,255,.7);
        font-weight: 900;
        font-size: clamp(21px, 3.1vh, 34px);
      }
      .bl-chip .bl-chip-icon { font-size: 1.25em; filter: drop-shadow(0 3px 0 rgba(104,65,8,.15)); }
      .bl-gear {
        width: clamp(44px, 5.8vh, 64px);
        height: clamp(44px, 5.8vh, 64px);
        border-radius: 20px;
        background: rgba(255,255,255,.92);
        font-size: clamp(23px, 3.4vh, 35px);
        box-shadow: 0 7px 0 rgba(111,87,58,.22), inset 0 2px 0 rgba(255,255,255,.8);
      }

      .bl-main {
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, 1.18fr) minmax(300px, .82fr);
        gap: clamp(10px, 1.7vw, 22px);
        min-height: 0;
        z-index: 3;
      }

      .bl-board-wrap {
        position: relative;
        min-width: 0;
        min-height: 0;
        border-radius: clamp(28px, 4vw, 54px);
        overflow: hidden;
        background:
          radial-gradient(circle at 50% 42%, rgba(255,255,255,.28), rgba(255,255,255,0) 42%),
          linear-gradient(180deg, rgba(255,255,255,.25), rgba(255,255,255,.08));
        box-shadow: inset 0 0 0 4px rgba(255,255,255,.22);
      }

      .bl-board-inner {
        position: absolute;
        inset: 0;
        background-image: url('./assets/games/boardland/board.png');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        background-color: rgba(255, 241, 118, 0.3);
      }

      .bl-mini-park {
        position: absolute;
        left: 25%;
        top: 28%;
        width: 42%;
        height: 37%;
        border-radius: 45% 45% 28% 28%;
        background:
          radial-gradient(circle at 52% 78%, #f6d88f 0 19%, transparent 20%),
          radial-gradient(circle at 50% 27%, #ff6ed5 0 19%, #fff0a7 20% 22%, transparent 23%),
          linear-gradient(180deg, rgba(254,172,80,.9), rgba(255,218,84,.7));
        box-shadow: 0 22px 40px rgba(93,87,0,.18), inset 0 6px 0 rgba(255,255,255,.45);
      }
      .bl-mini-park::before {
        content: '🎪';
        position: absolute;
        left: 50%; top: 42%;
        transform: translate(-50%, -50%);
        font-size: clamp(56px, 10vw, 138px);
        filter: drop-shadow(0 10px 6px rgba(0,0,0,.16));
      }
      .bl-mini-park::after {
        content: '🎈 🎡 ✨';
        position: absolute;
        left: 50%; top: -12%;
        transform: translateX(-50%);
        font-size: clamp(24px, 4vw, 56px);
      }

      .bl-cell {
        position: absolute;
        width: clamp(44px, 8vw, 92px);
        height: clamp(44px, 8vw, 92px);
        max-width: 10.5vh;
        max-height: 10.5vh;
        min-width: 44px;
        min-height: 44px;
        transform: translate(-50%, -50%);
        border-radius: 24%;
        display: grid;
        place-items: center;
        font-size: clamp(25px, 4.9vh, 56px);
        border: 4px solid rgba(255,255,255,.95);
        box-shadow: 0 9px 0 rgba(145,82,18,.22), 0 13px 24px rgba(75,84,12,.22), inset 0 4px 0 rgba(255,255,255,.45);
        transition: transform .22s ease, filter .22s ease;
      }
      .bl-cell:nth-child(6n+1) { background: linear-gradient(180deg, #ffd44c, #ff9e2f); }
      .bl-cell:nth-child(6n+2) { background: linear-gradient(180deg, #ff74c7, #ff4e7f); }
      .bl-cell:nth-child(6n+3) { background: linear-gradient(180deg, #72d7ff, #2d9fff); }
      .bl-cell:nth-child(6n+4) { background: linear-gradient(180deg, #9df75d, #43c53a); }
      .bl-cell:nth-child(6n+5) { background: linear-gradient(180deg, #c68bff, #8f51ff); }
      .bl-cell:nth-child(6n+6) { background: linear-gradient(180deg, #fff27c, #ffc431); }
      .bl-cell.is-current {
        filter: brightness(1.12) saturate(1.15);
        transform: translate(-50%, -50%) scale(1.08);
        z-index: 4;
      }
      .bl-cell.is-finish {
        border-radius: 36px;
        background: linear-gradient(180deg, #b365ff, #742cff);
      }
      .bl-cell.is-start {
        border-radius: 36px;
        background: linear-gradient(180deg, #4fc8ff, #1985ff);
      }

      .bl-token {
        position: absolute;
        left: 8%; top: 78%;
        width: clamp(58px, 9.6vw, 118px);
        height: clamp(58px, 9.6vw, 118px);
        transform: translate(-50%, -82%);
        display: grid;
        place-items: center;
        z-index: 12;
        transition: left .35s cubic-bezier(.22,1.35,.46,1), top .35s cubic-bezier(.22,1.35,.46,1), transform .18s ease;
        pointer-events: none;
      }
      .bl-token::before {
        content: '';
        position: absolute;
        left: 50%; top: 84%;
        width: 78%; height: 20%;
        border-radius: 50%;
        background: radial-gradient(ellipse, rgba(255,251,119,.9), rgba(255,207,15,.18) 64%, transparent 70%);
        transform: translateX(-50%);
        filter: blur(2px);
      }
      .bl-token-car {
        position: relative;
        width: 100%; height: 100%;
        border-radius: 40% 45% 36% 36%;
        background: linear-gradient(180deg, #ff5b3f, #e91024);
        border: 4px solid rgba(255,255,255,.9);
        box-shadow: 0 10px 0 #8c101a, 0 17px 24px rgba(94,0,0,.26), inset 0 6px 0 rgba(255,255,255,.48);
      }
      .bl-token-car::before {
        content: '😊';
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        font-size: clamp(29px, 4.8vh, 58px);
      }
      .bl-token-car::after {
        content: '';
        position: absolute;
        left: 16%; right: 16%; bottom: -9%; height: 20%;
        background: radial-gradient(circle at 20% 50%, #1f2937 0 32%, transparent 35%), radial-gradient(circle at 80% 50%, #1f2937 0 32%, transparent 35%);
      }
      .bl-token-marker {
        position: absolute;
        top: -30%; left: 50%;
        transform: translateX(-50%);
        font-size: clamp(23px, 3.8vh, 42px);
        filter: drop-shadow(0 6px 0 rgba(177,67,0,.35));
        animation: blBounce 1s ease-in-out infinite;
      }

      .bl-wheel-wrap {
        position: relative;
        display: grid;
        grid-template-rows: 1fr;
        place-items: center;
        min-height: 0;
      }
      .bl-wheel-stage {
        position: relative;
        width: min(43vw, 68vh);
        height: min(43vw, 68vh);
        min-width: 290px;
        min-height: 290px;
        max-width: 560px;
        max-height: 560px;
        display: grid;
        place-items: center;
      }
      .bl-wheel-pointer {
        position: absolute;
        top: -2%;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10;
        width: 13%;
        height: 18%;
        filter: drop-shadow(0 8px 0 rgba(116,40,10,.24));
      }
      .bl-wheel-pointer::before {
        content: '📍';
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        font-size: clamp(44px, 8vh, 76px);
      }
      .bl-wheel {
        position: relative;
        width: 92%;
        height: 92%;
        border-radius: 50%;
        background: conic-gradient(
          from -22.5deg,
          #7ee345 0deg 45deg,
          #35b9ff 45deg 90deg,
          #a56bff 90deg 135deg,
          #ff72b8 135deg 180deg,
          #ff922d 180deg 225deg,
          #ffc93c 225deg 270deg,
          #2cc8bd 270deg 315deg,
          #8c67ff 315deg 360deg
        );
        border: min(1.45vw, 18px) solid #ffd35a;
        box-shadow:
          0 14px 0 #c98515,
          0 24px 38px rgba(68,66,0,.22),
          inset 0 0 0 min(.8vw, 10px) rgba(255,255,255,.38),
          inset 0 0 42px rgba(255,255,255,.2);
        transition-property: transform;
        transition-timing-function: cubic-bezier(.09,.72,.11,1);
        overflow: hidden;
      }
      .bl-wheel::before {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 50%;
        background:
          linear-gradient(0deg, transparent 49.4%, rgba(255,255,255,.72) 49.4% 50.6%, transparent 50.6%),
          linear-gradient(45deg, transparent 49.4%, rgba(255,255,255,.72) 49.4% 50.6%, transparent 50.6%),
          linear-gradient(90deg, transparent 49.4%, rgba(255,255,255,.72) 49.4% 50.6%, transparent 50.6%),
          linear-gradient(135deg, transparent 49.4%, rgba(255,255,255,.72) 49.4% 50.6%, transparent 50.6%);
        opacity: .88;
      }
      .bl-wheel::after {
        content: '';
        position: absolute;
        inset: 4%;
        border-radius: 50%;
        border: 6px dotted rgba(255,255,255,.75);
        pointer-events: none;
      }

      .bl-wheel-icon {
        position: absolute;
        top: 50%; left: 50%;
        width: 30%; height: 30%;
        margin-left: -15%; margin-top: -15%;
        display: grid;
        place-items: center;
        font-size: clamp(32px, 6vh, 66px);
        transform: rotate(calc(var(--i) * 45deg)) translateY(-105%) rotate(calc(var(--i) * -45deg));
        z-index: 2;
        text-shadow: 0 5px 0 rgba(80,47,0,.16);
      }
      .bl-wheel-icon .mini {
        background: rgba(255,255,255,.75);
        border-radius: 999px;
        min-width: 1.8em;
        min-height: 1.25em;
        padding: .08em .16em;
        display: grid;
        place-items: center;
        box-shadow: inset 0 3px 0 rgba(255,255,255,.55), 0 5px 0 rgba(101,71,0,.12);
      }
      .bl-spin-button {
        position: absolute;
        width: 31%; height: 31%;
        border-radius: 50%;
        z-index: 6;
        background: linear-gradient(180deg, #ff6a68, #ed1748);
        border: min(.65vw, 8px) solid #ffd35c;
        box-shadow: 0 10px 0 #a20d27, 0 14px 22px rgba(128,0,42,.3), inset 0 4px 0 rgba(255,255,255,.52);
        color: white;
        font-size: clamp(42px, 8vh, 84px);
        display: grid;
        place-items: center;
      }
      .bl-spin-button.is-spinning {
        opacity: .88;
        cursor: default;
        transform: none !important;
      }
      .bl-wheel-glow {
        position: absolute;
        inset: 2%;
        border-radius: 50%;
        pointer-events: none;
        box-shadow: 0 0 55px rgba(255,240,78,.65), inset 0 0 38px rgba(255,255,255,.22);
        animation: blGlow 2.1s ease-in-out infinite;
      }

      .bl-bottom {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: clamp(10px, 1.5vw, 18px);
        min-height: 0;
        position: relative;
        z-index: 6;
      }
      .bl-mission-panel {
        min-width: 0;
        height: 100%;
        border-radius: clamp(24px, 3.2vh, 38px);
        background: rgba(255,244,222,.92);
        border: 4px solid rgba(255,255,255,.88);
        box-shadow: 0 12px 0 rgba(151,76,151,.28), 0 20px 30px rgba(34,49,105,.15), inset 0 4px 0 rgba(255,255,255,.7);
        display: grid;
        grid-template-columns: clamp(72px, 12vw, 150px) 1fr clamp(100px, 16vw, 190px);
        align-items: center;
        gap: clamp(8px, 1.3vw, 18px);
        padding: clamp(8px, 1.2vh, 14px) clamp(12px, 2vw, 22px);
        overflow: hidden;
      }
      .bl-mission-icon {
        width: clamp(66px, 11vh, 130px);
        height: clamp(66px, 11vh, 130px);
        border-radius: 36%;
        display: grid;
        place-items: center;
        font-size: clamp(46px, 8vh, 96px);
        background: linear-gradient(180deg, #fff, #fff3ce);
        box-shadow: inset 0 5px 0 rgba(255,255,255,.85), 0 7px 0 rgba(206,149,64,.22);
      }
      .bl-mission-visual {
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: clamp(12px, 2vw, 28px);
        font-weight: 900;
        font-size: clamp(28px, 5vh, 58px);
        color: #1f64d8;
        text-shadow: 0 3px 0 rgba(255,255,255,.8);
      }
      .bl-wave {
        display: inline-grid;
        place-items: center;
        width: clamp(42px, 7vh, 78px);
        height: clamp(42px, 7vh, 78px);
        border-radius: 50%;
        color: #1497ef;
        animation: blWavePop 1s ease-in-out infinite;
      }
      .bl-mission-effect {
        white-space: nowrap;
        color: #583210;
        font-size: clamp(22px, 4.1vh, 46px);
      }
      .bl-success-btn {
        height: clamp(60px, 10vh, 116px);
        border-radius: 32px;
        background: linear-gradient(180deg, #8af14a, #20b83d);
        border: 4px solid rgba(255,255,255,.9);
        box-shadow: 0 9px 0 #11872c, 0 15px 22px rgba(15,112,23,.22), inset 0 4px 0 rgba(255,255,255,.55);
        display: grid;
        place-items: center;
        font-size: clamp(44px, 7vh, 84px);
        color: white;
        text-shadow: 0 4px 0 rgba(0,93,18,.25);
      }

      .bl-menu {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: clamp(62px, 10vh, 108px);
        gap: clamp(8px, 1vw, 14px);
        align-items: center;
      }
      .bl-mini-action {
        width: clamp(62px, 10vh, 108px);
        height: clamp(62px, 10vh, 108px);
        border-radius: 28%;
        background: linear-gradient(180deg, #3fd1ff, #1684ff);
        border: 4px solid #ffe174;
        box-shadow: 0 9px 0 #0c5ac3, 0 14px 22px rgba(6,64,146,.25), inset 0 4px 0 rgba(255,255,255,.45);
        color: white;
        font-size: clamp(32px, 6vh, 62px);
        display: grid;
        place-items: center;
      }

      .bl-toast {
        position: absolute;
        left: 50%; top: 50%;
        transform: translate(-50%, -50%) scale(.92);
        z-index: 50;
        min-width: clamp(220px, 34vw, 500px);
        min-height: clamp(110px, 18vh, 210px);
        padding: 22px 30px;
        border-radius: 44px;
        background: rgba(255,255,255,.96);
        border: 6px solid #ffd75c;
        box-shadow: 0 18px 0 rgba(190,114,14,.32), 0 30px 70px rgba(11,33,75,.28), inset 0 5px 0 rgba(255,255,255,.8);
        display: none;
        place-items: center;
        text-align: center;
        font-weight: 900;
        font-size: clamp(28px, 5vh, 66px);
        color: #e84a1a;
        text-shadow: 0 3px 0 rgba(255,236,146,.9);
      }
      .bl-toast.show {
        display: grid;
        animation: blToast .72s cubic-bezier(.2,1.45,.39,1) both;
      }

      .bl-result-burst {
        position: absolute;
        left: 50%;
        top: 50%;
        z-index: 80;
        width: clamp(140px, 22vw, 310px);
        height: clamp(140px, 22vw, 310px);
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(.4);
        display: none;
        place-items: center;
        font-size: clamp(70px, 13vw, 180px);
        background:
          radial-gradient(circle at 50% 42%, rgba(255,255,255,.98), rgba(255,252,201,.92) 46%, rgba(255,191,55,.88) 72%, rgba(255,128,35,.78));
        border: 8px solid rgba(255,255,255,.95);
        box-shadow:
          0 18px 0 rgba(183,91,12,.34),
          0 30px 70px rgba(11,33,75,.28),
          inset 0 7px 0 rgba(255,255,255,.75);
        pointer-events: none;
      }

      .bl-result-burst.show {
        display: grid;
        animation: blResultBurst 1.05s cubic-bezier(.18, 1.45, .32, 1) both;
      }

      .bl-finish-panel {
        position: absolute;
        left: 50%;
        top: 50%;
        z-index: 90;
        width: min(88vw, 620px);
        min-height: clamp(230px, 38vh, 380px);
        transform: translate(-50%, -50%) scale(.88);
        display: none;
        place-items: center;
        gap: 18px;
        padding: clamp(22px, 4vh, 40px);
        border-radius: clamp(34px, 5vh, 58px);
        background:
          radial-gradient(circle at 50% 0%, rgba(255,255,255,.98), rgba(255,245,204,.96) 62%, rgba(255,210,88,.94));
        border: 8px solid rgba(255,255,255,.96);
        box-shadow:
          0 22px 0 rgba(177,92,12,.34),
          0 38px 90px rgba(20,45,94,.35),
          inset 0 8px 0 rgba(255,255,255,.72);
        text-align: center;
      }

      .bl-finish-panel.show {
        display: grid;
        animation: blFinishPop .62s cubic-bezier(.2, 1.35, .35, 1) both;
      }

      .bl-finish-emoji {
        font-size: clamp(74px, 14vh, 150px);
        line-height: 1;
        filter: drop-shadow(0 8px 0 rgba(155,85,0,.22));
      }

      .bl-replay-btn {
        width: min(72vw, 420px);
        height: clamp(86px, 15vh, 138px);
        border-radius: clamp(30px, 5vh, 46px);
        background: linear-gradient(180deg, #8af14a, #20b83d);
        border: 6px solid rgba(255,255,255,.95);
        box-shadow:
          0 12px 0 #11872c,
          0 20px 34px rgba(15,112,23,.28),
          inset 0 6px 0 rgba(255,255,255,.58);
        color: white;
        font-family: inherit;
        font-size: clamp(54px, 10vh, 106px);
        font-weight: 900;
        cursor: pointer;
        touch-action: manipulation;
      }

      .bl-portrait-hint {
        display: none;
        position: absolute;
        inset: 0;
        z-index: 100;
        background: linear-gradient(180deg, #36b7ff, #82e78c);
        place-items: center;
        text-align: center;
        padding: 28px;
      }
      .bl-portrait-card {
        width: min(92vw, 440px);
        border-radius: 34px;
        padding: 26px;
        background: rgba(255,255,255,.94);
        box-shadow: 0 18px 40px rgba(0,90,160,.22);
        font-size: 24px;
        font-weight: 900;
        line-height: 1.32;
      }
      .bl-portrait-card .big { font-size: 78px; display: block; margin-bottom: 12px; }

      @media (orientation: portrait) and (max-width: 900px) {
        .bl-portrait-hint { display: grid; }
      }

      @media (max-width: 980px) and (orientation: landscape) {
        .bl-screen { grid-template-rows: minmax(48px, 9vh) 1fr minmax(68px, 15vh); padding: 8px 10px; gap: 6px; }
        .bl-topbar { grid-template-columns: minmax(110px, 25vw) 1fr minmax(180px, 36vw); gap: 6px; }
        .bl-title { font-size: clamp(24px, 5vh, 48px); }
        .bl-chip { min-width: 54px; padding: 0 8px; gap: 4px; }
        .bl-main { grid-template-columns: 1.12fr .88fr; gap: 8px; }
        .bl-wheel-stage { min-width: 245px; min-height: 245px; }
        .bl-cell { width: 48px; height: 48px; font-size: 27px; border-width: 3px; }
        .bl-token { width: 62px; height: 62px; }
        .bl-mission-panel { grid-template-columns: 64px 1fr 92px; border-width: 3px; }
        .bl-menu { grid-auto-columns: 58px; gap: 6px; }
        .bl-mini-action { width: 58px; height: 58px; border-width: 3px; }
      }

      @media (min-width: 1300px) {
        .bl-screen { max-width: 1680px; margin: 0 auto; }
      }

      @keyframes blFloat { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(-9px); } }
      @keyframes blSparkle { 0%{ transform: translateY(0); } 100%{ transform: translateY(18px); } }
      @keyframes blPulseRing { 0%{ transform: scale(.55); opacity:.8; } 100%{ transform: scale(1.55); opacity:0; } }
      @keyframes blBounce { 0%,100%{ transform: translateX(-50%) translateY(0); } 50%{ transform: translateX(-50%) translateY(-10px); } }
      @keyframes blGlow { 0%,100%{ opacity:.55; } 50%{ opacity:1; } }
      @keyframes blWavePop { 0%,100%{ transform: scale(.92); opacity:.78; } 50%{ transform: scale(1.12); opacity:1; } }
      @keyframes blToast { 0%{ opacity:0; transform: translate(-50%, -50%) scale(.76) rotate(-3deg); } 60%{ opacity:1; transform: translate(-50%, -50%) scale(1.08) rotate(1deg); } 100%{ opacity:1; transform: translate(-50%, -50%) scale(1) rotate(0); } }
      @keyframes blResultBurst {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(.35) rotate(-12deg); }
        45% { opacity: 1; transform: translate(-50%, -50%) scale(1.18) rotate(6deg); }
        72% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(.9) rotate(0); }
      }
      @keyframes blFinishPop {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(.72) rotate(-3deg); }
        70% { opacity: 1; transform: translate(-50%, -50%) scale(1.05) rotate(1deg); }
        100% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0); }
      }
    `;
    document.head.appendChild(style);
  }

  function randomInt(min, max) {
    const low = Math.ceil(min);
    const high = Math.floor(max);
    if (high <= low) return low;
    const range = high - low + 1;
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return low + (values[0] % range);
    }
    return low + Math.floor(Math.random() * range);
  }

  function pickRandomRouletteItem() {
    const index = randomInt(0, ROULETTE_ITEMS.length - 1);
    return { index, item: ROULETTE_ITEMS[index] };
  }

  function pickRandomMission(kind) {
    const list = MISSIONS[kind] || MISSIONS.animal;
    return list[randomInt(0, list.length - 1)];
  }

  function speak(voiceId) {
    if (!state.audioEnabled || !voiceId) return;
    try {
      if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
        window.SihyeonVoice.play(voiceId, '').catch(() => {});
      }
    } catch (error) {
      console.warn('[BoardLand] voice play failed', error);
    }
  }

  function haptic(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (error) {
      // ignore
    }
  }

  function createRoot() {
    close();
    injectStyle();

    const root = document.createElement('div');
    root.id = ROOT_ID;
    root.innerHTML = `
      <div class="bl-bg-park" aria-hidden="true">
        <div class="bl-confetti"></div>
        <div class="bl-cloud c1"></div>
        <div class="bl-cloud c2"></div>
        <div class="bl-cloud c3"></div>
        <div class="bl-park-shape ferris"></div>
        <div class="bl-park-shape coaster"></div>
        <div class="bl-park-shape castle"></div>
      </div>
      <div class="bl-screen">
        <header class="bl-topbar">
          <div class="bl-voice-guide">
            <button class="bl-home" type="button" data-action="close" aria-label="나가기">⌂</button>
            <button class="bl-sound-btn bl-mascot-bubble" type="button" data-action="toggle-sound" aria-label="음성 안내 켜기 끄기">
              <span class="bl-bear">🐻</span>
              <span class="bl-speaker-pill">🔊</span>
            </button>
          </div>
          <div class="bl-title" aria-label="빙글빙글 보드랜드"><span>보</span><span>드</span><span>랜</span><span>드</span></div>
          <div class="bl-stats">
            <div class="bl-chip" aria-label="별"><span class="bl-chip-icon">⭐</span><span data-stat="stars">0</span></div>
            <div class="bl-chip" aria-label="하트"><span class="bl-chip-icon">💗</span><span data-stat="hearts">3</span></div>
            <div class="bl-chip" aria-label="선물"><span class="bl-chip-icon">🎁</span><span data-stat="gifts">0</span></div>
            <button class="bl-gear" type="button" data-action="reset" aria-label="처음부터">⚙️</button>
          </div>
        </header>

        <main class="bl-main">
          <section class="bl-board-wrap" aria-label="보드판">
            <div class="bl-board-inner">
              <div class="bl-mini-park" aria-hidden="true"></div>
              <div class="bl-cells" data-cells></div>
              <div class="bl-token" data-token aria-hidden="true">
                <span class="bl-token-marker">🔻</span>
                <span class="bl-token-car"></span>
              </div>
            </div>
          </section>

          <section class="bl-wheel-wrap" aria-label="룰렛">
            <div class="bl-wheel-stage">
              <div class="bl-wheel-pointer" aria-hidden="true"></div>
              <div class="bl-wheel" data-wheel>
                ${ROULETTE_ITEMS.map((item, index) => `
                  <div class="bl-wheel-icon" style="--i:${index}" aria-hidden="true"><span class="mini">${item.emoji}</span></div>
                `).join('')}
              </div>
              <div class="bl-wheel-glow" aria-hidden="true"></div>
              <button class="bl-spin-button" type="button" data-action="spin" aria-label="룰렛 돌리기">⭐</button>
            </div>
          </section>
        </main>

        <footer class="bl-bottom">
          <section class="bl-mission-panel" aria-live="polite">
            <div class="bl-mission-icon" data-mission-icon>🐶</div>
            <div class="bl-mission-visual">
              <span class="bl-wave">🔊</span>
              <span class="bl-mission-effect" data-mission-effect>멍멍!</span>
              <span class="bl-wave">🔊</span>
            </div>
            <button class="bl-success-btn" type="button" data-action="success" aria-label="성공">✓</button>
          </section>
          <nav class="bl-menu" aria-label="메뉴">
            <button class="bl-mini-action" type="button" data-action="cheer" aria-label="칭찬">🏆</button>
            <button class="bl-mini-action" type="button" data-action="album" aria-label="도감">📘</button>
            <button class="bl-mini-action" type="button" data-action="gift" aria-label="선물">🏪</button>
            <button class="bl-mini-action" type="button" data-action="family" aria-label="가족">👨‍👩‍👧</button>
          </nav>
        </footer>
      </div>
      <div class="bl-toast" data-toast></div>
      <div class="bl-result-burst" data-result-burst aria-hidden="true">⭐</div>
      <div class="bl-finish-panel" data-finish-panel aria-hidden="true">
        <div class="bl-finish-emoji">🎉🏁🎉</div>
        <button class="bl-replay-btn" type="button" data-action="replay" aria-label="다시 놀기">🔄</button>
      </div>
      <div class="bl-portrait-hint" aria-hidden="true">
        <div class="bl-portrait-card"><span class="big">📱↔️</span>가로로 돌리면<br>더 크게 놀 수 있어요!</div>
      </div>
    `;

    document.body.appendChild(root);
    renderBoardCells(root);
    bindEvents(root);
    updateAll(root);
    state.isOpen = true;
    setTimeout(() => speak('boardland.startGame'), 350);
  }

  function renderBoardCells(root) {
    const holder = root.querySelector('[data-cells]');
    if (!holder) return;
    holder.innerHTML = BOARD_CELLS.map((cell, index) => {
      const pos = BOARD_POSITIONS[index];
      const classes = ['bl-cell'];
      if (index === 0) classes.push('is-start');
      if (index === BOARD_CELLS.length - 1) classes.push('is-finish');
      return `<div class="${classes.join(' ')}" data-cell-index="${index}" style="left:${pos.x}%;top:${pos.y}%;" aria-label="${escapeHtml(cell.voice)}">${cell.icon}</div>`;
    }).join('');
  }

  function bindEvents(root) {
    root.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      switch (action) {
        case 'close':
          close();
          break;
        case 'toggle-sound':
          toggleSound(root);
          break;
        case 'reset':
          resetGame(root);
          break;
        case 'spin':
          spinRoulette(root);
          break;
        case 'success':
          completeMission(root);
          break;
        case 'replay':
          hideFinishReplay(root);
          resetGame(root);
          break;
        case 'cheer':
          showToast(root, '🏆 참 잘했어요!');
          speak('boardland.wellDone');
          break;
        case 'album':
          showToast(root, '📘 도감은 다음에 열어요!');
          speak('boardland.collectionNextTime');
          break;
        case 'gift':
          state.gifts += 1;
          updateStats(root);
          showToast(root, '🎁 선물 하나!');
          speak('boardland.giftReceived');
          break;
        case 'family':
          setMission(root, pickRandomMission('family'));
          break;
        default:
          break;
      }
    });
  }

  function toggleSound(root) {
    state.audioEnabled = !state.audioEnabled;
    const pill = root.querySelector('.bl-speaker-pill');
    if (pill) pill.textContent = state.audioEnabled ? '🔊' : '🔇';
    if (state.audioEnabled) speak('boardland.audioEnabled');
  }

  function resetGame(root) {
    hideFinishReplay(root);
    state.isSpinning = false;
    state.rotation = 0;
    state.playerIndex = 0;
    state.stars = 0;
    state.hearts = 3;
    state.gifts = 0;
    state.pendingSpinAgain = false;
    state.lastMission = null;
    const wheel = root.querySelector('[data-wheel]');
    if (wheel) {
      wheel.style.transitionDuration = '0ms';
      wheel.style.transform = 'rotate(0deg)';
      requestAnimationFrame(() => { wheel.style.transitionDuration = ''; });
    }
    updateAll(root);
    setMission(root, { icon: '🐶', effect: '🔊 멍멍!', voice: '룰렛을 돌려볼까요?' }, false);
    showToast(root, '🚩 처음부터!');
    speak('boardland.restart');
  }

  function spinRoulette(root) {
    if (state.isSpinning) return;
    state.isSpinning = true;
    haptic([18, 30, 18]);

    const spinButton = root.querySelector('[data-action="spin"]');
    const wheel = root.querySelector('[data-wheel]');
    if (!wheel || !spinButton) return;

    spinButton.classList.add('is-spinning');
    spinButton.disabled = true;

    const { index, item } = pickRandomRouletteItem();
    const fullTurns = randomInt(5, 8);
    const duration = randomInt(2400, 3600);
    const finalMod = (360 - (index * 45)) % 360;
    const currentMod = ((state.rotation % 360) + 360) % 360;
    const deltaToTarget = (finalMod - currentMod + 360) % 360;
    state.rotation += fullTurns * 360 + deltaToTarget;

    wheel.style.transitionDuration = `${duration}ms`;
    wheel.style.transform = `rotate(${state.rotation}deg)`;
    showToast(root, '🎡 빙글빙글!');
    speak('boardland.spinning');

    window.setTimeout(() => {
      state.isSpinning = false;
      spinButton.classList.remove('is-spinning');
      spinButton.disabled = false;
      handleRouletteResult(root, item);
    }, duration + 80);
  }

  function handleRouletteResult(root, item) {
    haptic([30, 40, 30]);
    showRouletteResultBurst(root, item.emoji);
    showToast(root, `${item.emoji}`);
    speak(item.voice);

    if (item.type === 'move') {
      window.setTimeout(() => movePlayer(root, item.value), 650);
      return;
    }

    if (item.type === 'mission') {
      window.setTimeout(() => setMission(root, pickRandomMission(item.value)), 650);
      return;
    }

    if (item.type === 'card') {
      window.setTimeout(() => {
        const mission = pickRandomMission('gift');
        if (mission.effect.indexOf('⭐') >= 0) state.stars += 1;
        if (mission.effect.indexOf('💗') >= 0) state.hearts += 1;
        if (mission.effect.indexOf('🔁') >= 0) state.pendingSpinAgain = true;
        state.gifts += 1;
        updateStats(root);
        setMission(root, mission);
      }, 650);
      return;
    }

    if (item.type === 'bonus') {
      state.pendingSpinAgain = true;
      window.setTimeout(() => {
        setMission(root, { icon: '🔁', title: '한 번 더', voice: '가운데 별 버튼을 한 번 더 눌러요!', effect: '⭐ 다시!' });
      }, 650);
    }
  }

  function movePlayer(root, count) {
    const steps = Math.max(1, Number(count) || 1);
    let done = 0;
    const goOneStep = () => {
      if (state.playerIndex >= BOARD_CELLS.length - 1) {
        celebrateFinish(root);
        return;
      }
      state.playerIndex += 1;
      done += 1;
      updateToken(root);
      highlightCurrentCell(root);
      haptic(15);
      const cell = BOARD_CELLS[state.playerIndex];
      if (done < steps && state.playerIndex < BOARD_CELLS.length - 1) {
        window.setTimeout(goOneStep, 390);
      } else {
        window.setTimeout(() => afterMove(root, cell), 420);
      }
    };
    goOneStep();
  }

  function afterMove(root, cell) {
    if (!cell) return;
    speak(cell.voice);

    if (cell.kind === 'finish' || state.playerIndex >= BOARD_CELLS.length - 1) {
      celebrateFinish(root);
      return;
    }

    if (cell.kind === 'star') {
      state.stars += 1;
      updateStats(root);
      setMission(root, { icon: '⭐', effect: '⭐ +1', voice: '별 하나를 받았어요!' });
      return;
    }

    if (cell.kind === 'heart') {
      state.hearts += 1;
      updateStats(root);
      setMission(root, { icon: '💗', effect: '💗 +1', voice: '하트 하나를 받았어요!' });
      return;
    }

    if (cell.kind === 'gift') {
      state.gifts += 1;
      updateStats(root);
      setMission(root, pickRandomMission('gift'));
      return;
    }

    if (cell.kind === 'animal') {
      setMission(root, pickRandomMission('animal'));
      return;
    }

    if (cell.kind === 'car' || cell.kind === 'fire' || cell.kind === 'rescue') {
      setMission(root, pickRandomMission('car'));
      return;
    }

    setMission(root, { icon: cell.icon, effect: '✨ 좋아요!', voice: cell.voice || '좋아요!' });
  }

  function setMission(root, mission, shouldSpeak = true) {
    state.lastMission = mission;
    const icon = root.querySelector('[data-mission-icon]');
    const effect = root.querySelector('[data-mission-effect]');
    if (icon) icon.textContent = mission.icon || '⭐';
    if (effect) effect.textContent = mission.effect || '좋아요!';
    if (shouldSpeak) speak(mission.voice || mission.effect || '좋아요!');
  }

  function completeMission(root) {
    haptic([20, 30, 20]);
    state.stars += 1;
    updateStats(root);
    showToast(root, '✅ 성공!');
    speak('boardland.missionSuccess');
  }

  function celebrateFinish(root) {
    state.playerIndex = BOARD_CELLS.length - 1;
    state.stars += 3;
    state.hearts += 1;
    updateAll(root);
    setMission(root, { icon: '🏁', effect: '🎉 도착!', voice: '도착했어요! 정말 정말 잘했어요!' }, false);
    showToast(root, '🎉 도착!');
    showFinishReplay(root);
    speak('boardland.gameComplete');
  }

  function updateAll(root) {
    updateStats(root);
    updateToken(root);
    highlightCurrentCell(root);
  }

  function updateStats(root) {
    const stars = root.querySelector('[data-stat="stars"]');
    const hearts = root.querySelector('[data-stat="hearts"]');
    const gifts = root.querySelector('[data-stat="gifts"]');
    if (stars) stars.textContent = String(state.stars);
    if (hearts) hearts.textContent = String(state.hearts);
    if (gifts) gifts.textContent = String(state.gifts);
  }

  function updateToken(root) {
    const token = root.querySelector('[data-token]');
    if (!token) return;
    const pos = BOARD_POSITIONS[state.playerIndex] || BOARD_POSITIONS[0];
    token.style.left = `${pos.x}%`;
    token.style.top = `${pos.y}%`;
  }

  function highlightCurrentCell(root) {
    root.querySelectorAll('.bl-cell').forEach((cell) => {
      cell.classList.toggle('is-current', Number(cell.getAttribute('data-cell-index')) === state.playerIndex);
    });
  }

  let resultBurstTimer = null;

  function showRouletteResultBurst(root, emoji) {
    const burst = root.querySelector('[data-result-burst]');
    if (!burst) return;

    burst.textContent = emoji || '⭐';
    burst.classList.remove('show');
    void burst.offsetWidth;
    burst.classList.add('show');

    if (resultBurstTimer) window.clearTimeout(resultBurstTimer);
    resultBurstTimer = window.setTimeout(() => {
      burst.classList.remove('show');
    }, 1100);
  }

  function showFinishReplay(root) {
    const panel = root.querySelector('[data-finish-panel]');
    if (!panel) return;
    panel.classList.add('show');
    panel.setAttribute('aria-hidden', 'false');
  }

  function hideFinishReplay(root) {
    const panel = root && root.querySelector ? root.querySelector('[data-finish-panel]') : null;
    if (!panel) return;
    panel.classList.remove('show');
    panel.setAttribute('aria-hidden', 'true');
  }

  let toastTimer = null;

  function showToast(root, message) {
    const toast = root.querySelector('[data-toast]');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 1300);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function open() {
    createRoot();
  }

  function close() {
    const oldRoot = document.getElementById(ROOT_ID);
    if (oldRoot) oldRoot.remove();
    try {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } catch (error) {
      // ignore
    }
    state.isOpen = false;
    state.isSpinning = false;
  }

  window.SihyeonZones = window.SihyeonZones || {};
  window.SihyeonZones[ZONE_ID] = {
    id: ZONE_ID,
    title: '빙글빙글 보드랜드',
    emoji: '🎡',
    open,
    close
  };

  window.openBoardLandZone = open;
  window.closeBoardLandZone = close;
})();