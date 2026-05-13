/**
 * 시현이 놀이터 OS — 빙글빙글 보드랜드
 * 파일: js/zones/boardland-zone.js
 * 버전: v2.4.0 보드랜드 성우 음성 매핑 정리 + TTS 제거
 * 특징:
 * - 1600×900 고정 좌표계 기반 보드판
 * - left = x / 1600 * 100%, top = y / 900 * 100% 변환
 * - 모바일/태블릿 가로모드 전용 보드게임
 * - 1~4인 선택
 * - 소방차/경찰차/구급차/중장비 매니페스트 통합 후보 풀에서 말 랜덤 배정
 * - 같은 칸 다중 말 오프셋 배치
 * - 8칸 완전 랜덤 룰렛 유지
 * - 한 칸씩 이동, 미션, 성공 보상, 완주 다시 놀기
 * - 룰렛 결과 후 이동 예정 칸 반짝임
 * - 현재 차례/말 강조 강화
 * - 타이머 일괄 정리로 메모리 누수 방지
 * - 보드랜드 녹음 음성 key 기반 재생
 * - 독립 실행 가능: window.openBoardLandZone()
 */
(function () {
  'use strict';

  const ZONE_ID = 'boardland';
  const STYLE_ID = 'sihyeon-boardland-style';
  const ROOT_ID = 'sihyeon-boardland-root';

  const BOARD_STAGE = {
    width: 1600,
    height: 900
  };

  const BOARD_PLAY_AREA = {
    left: 60,
    top: 90,
    right: 1080,
    bottom: 820
  };

  const PATH_POINTS = [
    { index: 0, x: 187, y: 758, type: 'start', icon: '🚩', voice: '출발해요!' },
    { index: 1, x: 337, y: 763, type: 'normal', icon: '⭐', voice: '첫 번째 길이에요!' },
    { index: 2, x: 494, y: 763, type: 'mission', icon: '🎴', voice: '미션 카드예요!' },
    { index: 3, x: 646, y: 763, type: 'normal', icon: '🌈', voice: '무지개 길을 지나가요!' },
    { index: 4, x: 805, y: 763, type: 'gift', icon: '🎁', voice: '선물을 찾았어요!' },
    { index: 5, x: 956, y: 755, type: 'normal', icon: '⭐', voice: '반짝 길이에요!' },
    { index: 6, x: 989, y: 648, type: 'mission', icon: '🎴', voice: '미션 카드예요!' },
    { index: 7, x: 958, y: 531, type: 'normal', icon: '💗', voice: '하트 길이에요!' },
    { index: 8, x: 963, y: 427, type: 'bonus', icon: '⭐', voice: '보너스 칸이에요!' },
    { index: 9, x: 974, y: 331, type: 'normal', icon: '🌈', voice: '알록달록 길이에요!' },
    { index: 10, x: 950, y: 218, type: 'mission', icon: '🎴', voice: '미션 카드예요!' },
    { index: 11, x: 818, y: 154, type: 'gift', icon: '🎁', voice: '선물 칸이에요!' },
    { index: 12, x: 675, y: 150, type: 'normal', icon: '⭐', voice: '반짝반짝!' },
    { index: 13, x: 538, y: 167, type: 'mission', icon: '🎴', voice: '미션 카드예요!' },
    { index: 14, x: 367, y: 202, type: 'normal', icon: '🌈', voice: '무지개 길이에요!' },
    { index: 15, x: 279, y: 292, type: 'bonus', icon: '⭐', voice: '보너스 칸이에요!' },
    { index: 16, x: 235, y: 397, type: 'normal', icon: '💗', voice: '하트 길이에요!' },
    { index: 17, x: 229, y: 517, type: 'mission', icon: '🎴', voice: '미션 카드예요!' },
    { index: 18, x: 223, y: 636, type: 'normal', icon: '⭐', voice: '좋아요!' },
    { index: 19, x: 483, y: 536, type: 'gift', icon: '🎁', voice: '선물 칸이에요!' },
    { index: 20, x: 515, y: 438, type: 'normal', icon: '🌈', voice: '조금만 더 가요!' },
    { index: 21, x: 603, y: 630, type: 'normal', icon: '💗', voice: '좋아요!' },
    { index: 22, x: 826, y: 628, type: 'mission', icon: '🎴', voice: '마지막 미션이에요!' },
    { index: 23, x: 716, y: 341, type: 'finish', icon: '🏁', voice: '도착했어요! 정말 잘했어요!' }
  ];

  const TOKEN_OFFSETS = {
    1: [
      { x: 0, y: 0 }
    ],
    2: [
      { x: -22, y: 0 },
      { x: 22, y: 0 }
    ],
    3: [
      { x: 0, y: -22 },
      { x: -22, y: 18 },
      { x: 22, y: 18 }
    ],
    4: [
      { x: -22, y: -22 },
      { x: 22, y: -22 },
      { x: -22, y: 22 },
      { x: 22, y: 22 }
    ]
  };

  const ROULETTE_ITEMS = [
    { id: 'move_1', emoji: '➡️', label: '한 칸 앞으로', type: 'move', value: 1, voice: '한 칸 앞으로 가요!' },
    { id: 'move_2', emoji: '⏩', label: '두 칸 앞으로', type: 'move', value: 2, voice: '두 칸 앞으로 출발!' },
    { id: 'move_3', emoji: '⏩⏩', label: '세 칸 앞으로', type: 'move', value: 3, voice: '세 칸 앞으로 가요!' },
    { id: 'spin_again', emoji: '🔁', label: '한 번 더', type: 'bonus', value: 'spin_again', voice: '우와! 한 번 더 돌려요!' },
    { id: 'mission_card', emoji: '🎴', label: '미션 카드', type: 'mission', value: 'vehicle', voice: '미션 카드가 나왔어요!' },
    { id: 'rescue_mission', emoji: '🚨', label: '출동 미션', type: 'mission', value: 'rescue', voice: '출동 미션이에요!' },
    { id: 'gift_card', emoji: '🎁', label: '선물 카드', type: 'card', value: 'gift', voice: '선물 카드가 나왔어요!' },
    { id: 'star_bonus', emoji: '⭐', label: '별 보너스', type: 'card', value: 'star', voice: '별 보너스예요!' }
  ];

  const TOKEN_MANIFEST_URLS = [
    './assets/vehicles/fire_manifest.json',
    './assets/vehicles/rescue_manifest.json',
    './assets/vehicles/police_manifest.json',
    './assets/vehicles/construction_manifest.json'
  ];

  const FALLBACK_TOKEN_VEHICLES = [
    { id: 'pump_engine', group: 'fire', name: '펌프차', file: 'assets/vehicles/fire/pump_engine.png', voice: '삐뽀삐뽀, 물을 뿜어요!' },
    { id: 'water_tanker', group: 'fire', name: '물탱크차', file: 'assets/vehicles/fire/water_tanker.png', voice: '출렁출렁 물을 싣고 가요!' },
    { id: 'ladder_truck', group: 'fire', name: '사다리차', file: 'assets/vehicles/fire/ladder_truck.png', voice: '사다리가 쭉쭉 올라가요!' },
    { id: 'korean_police_car', group: 'police', name: '한국 경찰차', file: 'assets/vehicles/police/korean_police_car.png', voice: '위용위용 순찰해요!' },
    { id: 'police_motorcycle', group: 'police', name: '경찰 오토바이', file: 'assets/vehicles/police/police_motorcycle.png', voice: '부릉부릉 빠르게 달려요!' },
    { id: 'ambulance', group: 'rescue', name: '구급차', file: 'assets/vehicles/rescue/ambulance.png', voice: '애앵애앵 도와주러 가요!' },
    { id: 'doctor_car', group: 'rescue', name: '닥터카', file: 'assets/vehicles/rescue/doctor_car.png', voice: '의사 선생님이 빨리 도착해요!' },
    { id: 'excavator', group: 'construction', name: '포크레인', file: 'assets/vehicles/construction/excavator.png', voice: '쿠궁쿠궁 흙을 퍼요!' },
    { id: 'bulldozer', group: 'construction', name: '불도저', file: 'assets/vehicles/construction/bulldozer.png', voice: '쓱쓱 밀고 지나가요!' },
    { id: 'dump_truck', group: 'construction', name: '덤프트럭', file: 'assets/vehicles/construction/dump_truck.png', voice: '우르르 짐을 내려요!' }
  ];

  const MISSION_POOL = [
    { kind: 'vehicle', icon: '🚗', effect: '부릉!', voice: '자동차처럼 부릉부릉 해볼까요?' },
    { kind: 'vehicle', icon: '🚒', effect: '출동!', voice: '소방차처럼 출동해볼까요?' },
    { kind: 'vehicle', icon: '🚓', effect: '순찰!', voice: '경찰차처럼 순찰해볼까요?' },
    { kind: 'vehicle', icon: '🚑', effect: '도움!', voice: '구급차처럼 도와주러 가볼까요?' },
    { kind: 'action', icon: '👏', effect: '짝짝!', voice: '손뼉을 짝짝 쳐볼까요?' },
    { kind: 'action', icon: '🙌', effect: '하이파이브!', voice: '가족이랑 하이파이브 해볼까요?' },
    { kind: 'action', icon: '🤗', effect: '포옹!', voice: '가족을 꼭 안아줘 볼까요?' },
    { kind: 'action', icon: '😊', effect: '방긋!', voice: '예쁜 웃음을 보여줄까요?' }
  ];

  const state = {
    isOpen: false,
    isReady: false,
    isSpinning: false,
    isMoving: false,
    rotation: 0,
    playerCount: 2,
    players: [],
    currentPlayerIndex: 0,
    stars: 0,
    hearts: 3,
    gifts: 0,
    audioEnabled: true,
    pendingSpinAgain: false,
    winner: null,
    boardResizeHandler: null,
    timers: {},
    previewPath: [],
    tokenVehicles: [],
    tokenVehiclesLoaded: false
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
          linear-gradient(180deg, #39b9ff 0%, #84e7ff 38%, #a8f18a 70%, #62d772 100%);
        overflow: hidden;
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
      }

      #${ROOT_ID} * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
      }

      .bl-bg-park {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
      }

      .bl-confetti {
        position: absolute;
        width: 100%;
        height: 100%;
        opacity: .5;
        background-image:
          radial-gradient(circle, rgba(255,255,255,.95) 0 2px, transparent 3px),
          radial-gradient(circle, rgba(255,230,69,.95) 0 2px, transparent 3px),
          radial-gradient(circle, rgba(255,78,174,.9) 0 2px, transparent 3px),
          radial-gradient(circle, rgba(58,106,255,.85) 0 2px, transparent 3px);
        background-size: 130px 90px, 160px 120px, 210px 150px, 180px 110px;
        animation: blSparkle 6s linear infinite;
      }

      .bl-cloud {
        position: absolute;
        width: 16vw;
        height: 6vw;
        min-width: 130px;
        min-height: 48px;
        border-radius: 999px;
        background: rgba(255,255,255,.84);
        box-shadow: 40px 8px 0 rgba(255,255,255,.72), 80px 0 0 rgba(255,255,255,.56);
        animation: blFloat 9s ease-in-out infinite;
      }
      .bl-cloud.c1 { left: 7%; top: 8%; }
      .bl-cloud.c2 { right: 14%; top: 12%; transform: scale(.72); animation-delay: -3s; }
      .bl-cloud.c3 { left: 50%; top: 5%; transform: scale(.55); animation-delay: -5s; }

      .bl-screen {
        position: relative;
        width: 100%;
        height: 100%;
        padding: calc(10px + var(--bl-safe-top)) calc(12px + var(--bl-safe-right)) calc(10px + var(--bl-safe-bottom)) calc(12px + var(--bl-safe-left));
        display: grid;
        grid-template-rows: minmax(54px, 9vh) 1fr minmax(80px, 15vh);
        gap: clamp(6px, 1vh, 12px);
      }

      .bl-topbar {
        display: grid;
        grid-template-columns: minmax(152px, 24vw) 1fr minmax(260px, 33vw);
        align-items: center;
        gap: 12px;
        position: relative;
        z-index: 5;
      }

      .bl-home,
      .bl-sound-btn,
      .bl-gear,
      .bl-player-count-btn,
      .bl-start-btn,
      .bl-spin-button,
      .bl-success-btn,
      .bl-replay-btn,
      .bl-finish-choice-btn {
        border: 0;
        cursor: pointer;
        touch-action: manipulation;
        font-family: inherit;
      }

      .bl-home:active,
      .bl-sound-btn:active,
      .bl-gear:active,
      .bl-player-count-btn:active,
      .bl-start-btn:active,
      .bl-spin-button:active,
      .bl-success-btn:active,
      .bl-replay-btn:active,
      .bl-finish-choice-btn:active {
        transform: translateY(3px) scale(.98);
      }

      .bl-voice-guide {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .bl-home {
        width: clamp(48px, 6.2vh, 70px);
        height: clamp(48px, 6.2vh, 70px);
        border-radius: 22px;
        background: linear-gradient(180deg, #ffce47, #ff811a);
        box-shadow: 0 8px 0 #c95e00, 0 13px 24px rgba(121,70,5,.3), inset 0 3px 0 rgba(255,255,255,.65);
        color: white;
        font-size: clamp(27px, 4.6vh, 42px);
        display: grid;
        place-items: center;
      }

      .bl-mascot-bubble {
        flex: 1;
        height: clamp(48px, 6.6vh, 74px);
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
        width: clamp(40px, 5.8vh, 62px);
        height: clamp(40px, 5.8vh, 62px);
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: linear-gradient(180deg, #ffe482, #ffac37);
        font-size: clamp(27px, 4.4vh, 42px);
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
        font-size: clamp(25px, 4vh, 42px);
        overflow: hidden;
      }

      .bl-speaker-pill::before,
      .bl-speaker-pill::after {
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
        font-size: clamp(30px, 5.1vh, 70px);
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
        min-width: clamp(62px, 7vw, 98px);
        height: clamp(42px, 5.6vh, 60px);
        padding: 0 12px;
        border-radius: 22px;
        background: rgba(255,255,255,.9);
        border: 3px solid rgba(255,245,210,.95);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        box-shadow: 0 7px 0 rgba(168,102,19,.25), 0 11px 22px rgba(52,97,126,.18), inset 0 2px 0 rgba(255,255,255,.7);
        font-weight: 900;
        font-size: clamp(20px, 3vh, 32px);
      }

      .bl-chip-icon { font-size: 1.25em; }

      .bl-gear {
        width: clamp(44px, 5.8vh, 62px);
        height: clamp(44px, 5.8vh, 62px);
        border-radius: 20px;
        background: rgba(255,255,255,.92);
        font-size: clamp(23px, 3.4vh, 34px);
        box-shadow: 0 7px 0 rgba(111,87,58,.22), inset 0 2px 0 rgba(255,255,255,.8);
      }

      .bl-main {
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, 1.62fr) minmax(288px, .66fr);
        gap: clamp(10px, 1.4vw, 18px);
        min-height: 0;
        z-index: 3;
      }

      .bl-board-wrap {
        position: relative;
        min-width: 0;
        min-height: 0;
        border-radius: clamp(24px, 3.2vw, 42px);
        background: rgba(255,255,255,.18);
        box-shadow: inset 0 0 0 4px rgba(255,255,255,.24), 0 18px 32px rgba(22,97,44,.16);
        overflow: hidden;
      }

      .bl-board-stage {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: auto;
        aspect-ratio: 16 / 9;
        overflow: hidden;
        border-radius: 36px;
        background:
          url('./assets/games/boardland/boardland_board.webp') center / cover no-repeat,
          radial-gradient(circle at 54% 50%, rgba(255,241,145,.85), rgba(255,241,145,0) 30%),
          linear-gradient(180deg, rgba(255,246,194,.96), rgba(153,230,115,.92));
        box-shadow: inset 0 0 0 7px rgba(255,255,255,.62), inset 0 -14px 0 rgba(89,164,51,.18);
      }

      .bl-board-stage::before {
        content: '';
        position: absolute;
        inset: 3.5%;
        border-radius: 32px;
        background:
          radial-gradient(circle at 28% 22%, rgba(255,121,210,.2), transparent 22%),
          radial-gradient(circle at 70% 70%, rgba(83,178,255,.2), transparent 25%),
          radial-gradient(circle at 34% 74%, rgba(255,198,80,.24), transparent 20%);
        pointer-events: none;
      }

      .bl-route-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
        pointer-events: none;
      }

      .bl-route-shadow {
        fill: none;
        stroke: rgba(123, 74, 25, .28);
        stroke-width: 112;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .bl-route-main {
        fill: none;
        stroke: rgba(255, 235, 139, .95);
        stroke-width: 94;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .bl-route-inner {
        fill: none;
        stroke: rgba(255, 255, 255, .62);
        stroke-width: 18;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-dasharray: 1 62;
      }

      .bl-path-marker {
        position: absolute;
        width: 78px;
        height: 78px;
        transform: translate(-50%, -50%);
        border-radius: 28px;
        display: grid;
        place-items: center;
        font-size: 34px;
        border: 5px solid rgba(255,255,255,.96);
        box-shadow: 0 8px 0 rgba(138,88,25,.2), 0 12px 18px rgba(80,60,8,.15), inset 0 4px 0 rgba(255,255,255,.5);
        transition: transform .18s ease, filter .18s ease;
        z-index: 4;
      }
      .bl-path-marker[data-type='start'] { background: linear-gradient(180deg, #55d7ff, #1887ff); }
      .bl-path-marker[data-type='finish'] { background: linear-gradient(180deg, #b66bff, #7031ff); width: 92px; height: 92px; }
      .bl-path-marker[data-type='mission'] { background: linear-gradient(180deg, #ff7fc8, #ff4f7b); }
      .bl-path-marker[data-type='gift'] { background: linear-gradient(180deg, #ffd85c, #ff9e28); }
      .bl-path-marker[data-type='bonus'] { background: linear-gradient(180deg, #94f461, #36c940); }
      .bl-path-marker[data-type='normal'] { background: linear-gradient(180deg, #79d8ff, #38a8ff); }

      .bl-path-marker.is-current {
        transform: translate(-50%, -50%) scale(1.11);
        filter: brightness(1.15) saturate(1.15);
        z-index: 8;
      }

      .bl-path-marker.is-current::after {
        content: '';
        position: absolute;
        inset: -14px;
        border-radius: 32px;
        border: 5px solid rgba(255,239,88,.86);
        animation: blMarkerPulse 1s ease-in-out infinite;
      }

      .bl-path-marker.is-preview {
        transform: translate(-50%, -50%) scale(1.08);
        filter: brightness(1.18) saturate(1.2);
        z-index: 9;
      }

      .bl-path-marker.is-preview::before {
        content: '';
        position: absolute;
        inset: -10px;
        border-radius: 32px;
        border: 5px dashed rgba(255,255,255,.94);
        box-shadow: 0 0 16px rgba(255,243,76,.86);
        animation: blPreviewPulse .7s ease-in-out infinite alternate;
      }

      .bl-path-marker.is-preview-target {
        transform: translate(-50%, -50%) scale(1.2);
        z-index: 10;
      }

      .bl-path-marker.is-preview-target::before {
        border-style: solid;
        border-color: rgba(255,96,32,.96);
        box-shadow: 0 0 22px rgba(255,96,32,.86);
      }

      @keyframes blPreviewPulse {
        from { opacity: .62; transform: scale(.96); }
        to { opacity: 1; transform: scale(1.06); }
      }

      .bl-token-layer {
        position: absolute;
        inset: 0;
        z-index: 16;
        pointer-events: none;
      }

      .bl-player-token {
        position: absolute;
        width: 78px;
        height: 78px;
        transform: translate(-50%, -78%);
        transition: left .36s cubic-bezier(.18, 1.25, .38, 1), top .36s cubic-bezier(.18, 1.25, .38, 1), filter .18s ease, transform .18s ease;
        display: grid;
        place-items: center;
        z-index: 18;
      }

      .bl-player-token.is-current {
        transform: translate(-50%, -84%) scale(1.18);
        filter: drop-shadow(0 0 18px rgba(255,245,83,.98)) drop-shadow(0 8px 10px rgba(0,0,0,.24));
        z-index: 24;
      }

      .bl-player-token.is-current::before {
        content: '🔻';
        position: absolute;
        left: 50%;
        top: -32px;
        transform: translateX(-50%);
        font-size: 30px;
        animation: blBounce 1s ease-in-out infinite;
      }

      .bl-token-img-wrap {
        width: 100%;
        height: 100%;
        border-radius: 24px;
        display: grid;
        place-items: center;
        background: rgba(255,255,255,.92);
        border: 4px solid rgba(255,255,255,.96);
        box-shadow: 0 7px 0 rgba(69,76,91,.24), 0 13px 20px rgba(36,46,80,.2), inset 0 4px 0 rgba(255,255,255,.7);
        overflow: hidden;
      }

      .bl-token-img-wrap img {
        width: 92%;
        height: 92%;
        object-fit: contain;
        display: block;
      }

      .bl-token-fallback {
        font-size: 38px;
        display: none;
      }

      .bl-player-token.is-img-error img { display: none; }
      .bl-player-token.is-img-error .bl-token-fallback { display: block; }

      .bl-side {
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-rows: minmax(245px, 1fr) auto;
        gap: 10px;
      }

      .bl-wheel-wrap {
        position: relative;
        display: grid;
        place-items: center;
        min-height: 0;
      }

      .bl-wheel-stage {
        position: relative;
        width: min(34vw, 58vh);
        height: min(34vw, 58vh);
        min-width: 245px;
        min-height: 245px;
        max-width: 470px;
        max-height: 470px;
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
        font-size: clamp(40px, 7vh, 68px);
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
        border: min(1.25vw, 16px) solid #ffd35a;
        box-shadow: 0 12px 0 #c98515, 0 21px 34px rgba(68,66,0,.22), inset 0 0 0 min(.65vw, 9px) rgba(255,255,255,.38);
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

      .bl-wheel-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 30%;
        height: 30%;
        margin-left: -15%;
        margin-top: -15%;
        display: grid;
        place-items: center;
        font-size: clamp(30px, 5.4vh, 60px);
        transform: rotate(calc(var(--i) * 45deg)) translateY(-105%) rotate(calc(var(--i) * -45deg));
        z-index: 2;
        text-shadow: 0 5px 0 rgba(80,47,0,.16);
      }

      .bl-wheel-icon .mini {
        background: rgba(255,255,255,.78);
        border-radius: 999px;
        min-width: 1.7em;
        min-height: 1.22em;
        padding: .08em .16em;
        display: grid;
        place-items: center;
        box-shadow: inset 0 3px 0 rgba(255,255,255,.55), 0 5px 0 rgba(101,71,0,.12);
      }

      .bl-spin-button {
        position: absolute;
        width: 32%;
        height: 32%;
        border-radius: 50%;
        z-index: 6;
        background: linear-gradient(180deg, #ff6a68, #ed1748);
        border: min(.6vw, 8px) solid #ffd35c;
        box-shadow: 0 10px 0 #a20d27, 0 14px 22px rgba(128,0,42,.3), inset 0 4px 0 rgba(255,255,255,.52);
        color: white;
        font-size: clamp(40px, 7vh, 78px);
        display: grid;
        place-items: center;
      }

      .bl-spin-button.is-spinning {
        opacity: .86;
        cursor: default;
        transform: none !important;
      }

      .bl-player-panel {
        border-radius: 26px;
        background: rgba(255,255,255,.88);
        border: 4px solid rgba(255,255,255,.9);
        box-shadow: 0 9px 0 rgba(94,118,18,.18), 0 14px 22px rgba(40,76,80,.14), inset 0 4px 0 rgba(255,255,255,.7);
        padding: 8px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 7px;
      }

      .bl-player-card {
        min-width: 0;
        height: clamp(54px, 7.5vh, 78px);
        border-radius: 20px;
        background: linear-gradient(180deg, rgba(255,255,255,.95), rgba(241,250,255,.86));
        border: 3px solid rgba(255,255,255,.9);
        box-shadow: inset 0 3px 0 rgba(255,255,255,.65), 0 4px 0 rgba(75,100,145,.1);
        display: grid;
        grid-template-columns: 46px 1fr;
        align-items: center;
        gap: 6px;
        padding: 4px 7px;
        opacity: .88;
      }

      .bl-player-card.is-current {
        opacity: 1;
        background: linear-gradient(180deg, #fff7a4, #ffd85c);
        border-color: #fff;
        box-shadow: 0 0 0 5px rgba(255,238,61,.36), 0 6px 0 rgba(172,113,8,.18), inset 0 3px 0 rgba(255,255,255,.75);
      }

      .bl-player-mini-img {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        object-fit: contain;
        background: white;
      }

      .bl-player-meta {
        min-width: 0;
        display: grid;
        gap: 1px;
        line-height: 1.05;
      }

      .bl-player-label {
        font-size: 14px;
        font-weight: 900;
        color: #2c3d54;
      }

      .bl-player-pos {
        font-size: 18px;
        font-weight: 900;
        color: #ef4c2f;
      }

      .bl-bottom {
        display: grid;
        grid-template-columns: minmax(0, 1fr) clamp(132px, 17vw, 220px);
        gap: clamp(10px, 1.5vw, 18px);
        min-height: 0;
        position: relative;
        z-index: 6;
      }

      .bl-mission-panel {
        min-width: 0;
        height: 100%;
        border-radius: clamp(22px, 3vh, 36px);
        background: rgba(255,244,222,.92);
        border: 4px solid rgba(255,255,255,.88);
        box-shadow: 0 12px 0 rgba(151,76,151,.28), 0 20px 30px rgba(34,49,105,.15), inset 0 4px 0 rgba(255,255,255,.7);
        display: grid;
        grid-template-columns: clamp(78px, 12vh, 132px) 1fr clamp(110px, 15vw, 190px);
        align-items: center;
        gap: clamp(8px, 1.3vw, 18px);
        padding: clamp(8px, 1.1vh, 14px) clamp(12px, 1.8vw, 22px);
        overflow: hidden;
      }

      .bl-mission-icon {
        width: clamp(70px, 11vh, 126px);
        height: clamp(70px, 11vh, 126px);
        border-radius: 34%;
        display: grid;
        place-items: center;
        font-size: clamp(46px, 8vh, 92px);
        background: linear-gradient(180deg, #fff, #fff3ce);
        box-shadow: inset 0 5px 0 rgba(255,255,255,.85), 0 7px 0 rgba(206,149,64,.22);
      }

      .bl-mission-visual {
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: clamp(10px, 1.8vw, 24px);
        font-weight: 900;
        color: #1f64d8;
        text-shadow: 0 3px 0 rgba(255,255,255,.8);
      }

      .bl-wave {
        display: inline-grid;
        place-items: center;
        width: clamp(40px, 6.5vh, 72px);
        height: clamp(40px, 6.5vh, 72px);
        border-radius: 50%;
        color: #1497ef;
        font-size: clamp(26px, 4.8vh, 50px);
        animation: blWavePop 1s ease-in-out infinite;
      }

      .bl-mission-effect {
        white-space: nowrap;
        color: #583210;
        font-size: clamp(24px, 4.4vh, 48px);
      }

      .bl-success-btn {
        height: clamp(62px, 10vh, 116px);
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

      .bl-turn-card {
        height: 100%;
        border-radius: clamp(22px, 3vh, 36px);
        background: rgba(255,255,255,.9);
        border: 4px solid rgba(255,255,255,.9);
        box-shadow: 0 12px 0 rgba(50,129,188,.2), 0 20px 30px rgba(34,49,105,.14), inset 0 4px 0 rgba(255,255,255,.7);
        display: grid;
        place-items: center;
        padding: 8px;
      }

      .bl-turn-vehicle {
        width: min(100%, 146px);
        height: min(100%, 112px);
        object-fit: contain;
      }

      .bl-overlay {
        position: absolute;
        inset: 0;
        z-index: 70;
        display: grid;
        place-items: center;
        background: rgba(38, 154, 229, .55);
        backdrop-filter: blur(6px);
        padding: 24px;
      }

      .bl-start-panel {
        width: min(92vw, 760px);
        border-radius: 48px;
        padding: clamp(20px, 4vh, 42px);
        background: rgba(255,255,255,.96);
        border: 8px solid rgba(255,255,255,.92);
        box-shadow: 0 24px 0 rgba(177,92,12,.28), 0 36px 86px rgba(20,45,94,.28), inset 0 8px 0 rgba(255,255,255,.7);
        display: grid;
        gap: 18px;
        text-align: center;
      }

      .bl-start-title {
        font-size: clamp(42px, 8vh, 88px);
        line-height: 1;
        font-weight: 900;
        color: #ef4c2f;
        text-shadow: 0 4px 0 #fff0a6;
      }

      .bl-player-count-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }

      .bl-player-count-btn {
        min-height: clamp(80px, 14vh, 126px);
        border-radius: 30px;
        background: linear-gradient(180deg, #fff6a4, #ffca3a);
        border: 5px solid rgba(255,255,255,.94);
        box-shadow: 0 9px 0 #c58511, inset 0 5px 0 rgba(255,255,255,.6);
        font-size: clamp(42px, 8vh, 82px);
      }

      .bl-player-count-btn.is-selected {
        background: linear-gradient(180deg, #8af14a, #20b83d);
        box-shadow: 0 9px 0 #11872c, 0 0 0 7px rgba(255,240,67,.44), inset 0 5px 0 rgba(255,255,255,.6);
      }

      .bl-start-btn {
        min-height: clamp(82px, 14vh, 132px);
        border-radius: 34px;
        background: linear-gradient(180deg, #ff6a68, #ed1748);
        border: 6px solid #ffd35c;
        box-shadow: 0 12px 0 #a20d27, 0 18px 28px rgba(128,0,42,.24), inset 0 5px 0 rgba(255,255,255,.5);
        color: white;
        font-size: clamp(50px, 9vh, 100px);
      }

      .bl-toast,
      .bl-result-burst,
      .bl-finish-panel,
      .bl-flash {
        position: absolute;
      }

      .bl-toast {
        left: 50%;
        top: 50%;
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

      .bl-toast.show { display: grid; animation: blToast .72s cubic-bezier(.2,1.45,.39,1) both; }

      .bl-result-burst {
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
        background: radial-gradient(circle at 50% 42%, rgba(255,255,255,.98), rgba(255,252,201,.92) 46%, rgba(255,191,55,.88) 72%, rgba(255,128,35,.78));
        border: 8px solid rgba(255,255,255,.95);
        box-shadow: 0 18px 0 rgba(183,91,12,.34), 0 30px 70px rgba(11,33,75,.28), inset 0 7px 0 rgba(255,255,255,.75);
        pointer-events: none;
      }

      .bl-result-burst.show { display: grid; animation: blResultBurst 1.05s cubic-bezier(.18, 1.45, .32, 1) both; }

      .bl-flash {
        inset: 0;
        z-index: 60;
        pointer-events: none;
        display: none;
        background: radial-gradient(circle, rgba(255,255,255,.95), rgba(255,235,80,.78) 38%, rgba(255,80,185,.0) 70%);
      }
      .bl-flash.show { display: block; animation: blFlash .72s ease-out both; }

      .bl-finish-panel {
        left: 50%;
        top: 50%;
        z-index: 90;
        width: min(88vw, 690px);
        min-height: clamp(250px, 42vh, 420px);
        transform: translate(-50%, -50%) scale(.88);
        display: none;
        place-items: center;
        gap: 14px;
        padding: clamp(22px, 4vh, 40px);
        border-radius: clamp(34px, 5vh, 58px);
        background: radial-gradient(circle at 50% 0%, rgba(255,255,255,.98), rgba(255,245,204,.96) 62%, rgba(255,210,88,.94));
        border: 8px solid rgba(255,255,255,.96);
        box-shadow: 0 22px 0 rgba(177,92,12,.34), 0 38px 90px rgba(20,45,94,.35), inset 0 8px 0 rgba(255,255,255,.72);
        text-align: center;
      }

      .bl-finish-panel.show { display: grid; animation: blFinishPop .62s cubic-bezier(.2, 1.35, .35, 1) both; }

      .bl-winner-img {
        width: clamp(120px, 24vh, 230px);
        height: clamp(100px, 18vh, 190px);
        object-fit: contain;
        background: white;
        border-radius: 34px;
        border: 5px solid #fff;
        box-shadow: 0 10px 0 rgba(141,94,16,.2);
      }

      .bl-finish-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        width: 100%;
      }

      .bl-finish-choice-btn {
        min-height: clamp(76px, 12vh, 124px);
        border-radius: 30px;
        border: 5px solid rgba(255,255,255,.95);
        background: linear-gradient(180deg, #8af14a, #20b83d);
        box-shadow: 0 10px 0 #11872c, inset 0 5px 0 rgba(255,255,255,.58);
        font-size: clamp(42px, 8vh, 88px);
      }

      .bl-finish-choice-btn.secondary {
        background: linear-gradient(180deg, #65d3ff, #1888ff);
        box-shadow: 0 10px 0 #0d5fc8, inset 0 5px 0 rgba(255,255,255,.58);
      }

      .bl-portrait-hint {
        display: none;
        position: absolute;
        inset: 0;
        z-index: 110;
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
        .bl-screen { grid-template-rows: minmax(44px, 8vh) 1fr minmax(64px, 14vh); padding: 7px 9px; gap: 5px; }
        .bl-topbar { grid-template-columns: minmax(112px, 23vw) 1fr minmax(198px, 35vw); gap: 6px; }
        .bl-title { font-size: clamp(24px, 5vh, 46px); }
        .bl-chip { min-width: 52px; padding: 0 7px; gap: 4px; }
        .bl-main { grid-template-columns: minmax(0, 1.55fr) minmax(230px, .62fr); gap: 7px; }
        .bl-wheel-stage { min-width: 215px; min-height: 215px; }
        .bl-path-marker { width: 52px; height: 52px; border-radius: 18px; font-size: 24px; border-width: 3px; }
        .bl-path-marker[data-type='finish'] { width: 60px; height: 60px; }
        .bl-player-token { width: 52px; height: 52px; }
        .bl-player-panel { gap: 5px; padding: 5px; }
        .bl-player-card { height: 45px; grid-template-columns: 36px 1fr; padding: 3px 5px; }
        .bl-player-mini-img { width: 34px; height: 34px; }
        .bl-player-label { font-size: 11px; }
        .bl-player-pos { font-size: 14px; }
        .bl-mission-panel { grid-template-columns: 60px 1fr 86px; border-width: 3px; }
        .bl-mission-icon { width: 58px; height: 58px; font-size: 40px; }
        .bl-mission-effect { font-size: clamp(20px, 4vh, 34px); }
        .bl-turn-card { display: none; }
        .bl-bottom { grid-template-columns: 1fr; }
      }

      @media (min-width: 1300px) {
        .bl-screen { max-width: 1680px; margin: 0 auto; }
      }

      @keyframes blFloat { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(-9px); } }
      @keyframes blSparkle { 0%{ transform: translateY(0); } 100%{ transform: translateY(18px); } }
      @keyframes blPulseRing { 0%{ transform: scale(.55); opacity:.8; } 100%{ transform: scale(1.55); opacity:0; } }
      @keyframes blBounce { 0%,100%{ transform: translateX(-50%) translateY(0); } 50%{ transform: translateX(-50%) translateY(-10px); } }
      @keyframes blWavePop { 0%,100%{ transform: scale(.92); opacity:.78; } 50%{ transform: scale(1.12); opacity:1; } }
      @keyframes blMarkerPulse { 0%,100%{ opacity:.65; transform: scale(.98); } 50%{ opacity:1; transform: scale(1.08); } }
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
      @keyframes blFlash {
        0% { opacity: 0; }
        20% { opacity: 1; }
        100% { opacity: 0; }
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

  function shuffleCopy(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = randomInt(0, i);
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function pickRandomRouletteItem() {
    const index = randomInt(0, ROULETTE_ITEMS.length - 1);
    return { index, item: ROULETTE_ITEMS[index] };
  }

  function pickRandomMission() {
    return MISSION_POOL[randomInt(0, MISSION_POOL.length - 1)];
  }

  function pointToPercent(point) {
    return {
      left: `${(point.x / BOARD_STAGE.width) * 100}%`,
      top: `${(point.y / BOARD_STAGE.height) * 100}%`
    };
  }

  function pointWithOffsetToPercent(point, offset = { x: 0, y: 0 }) {
    return {
      left: `${((point.x + offset.x) / BOARD_STAGE.width) * 100}%`,
      top: `${((point.y + offset.y) / BOARD_STAGE.height) * 100}%`
    };
  }

  function getCurrentPlayer() {
    return state.players[state.currentPlayerIndex] || null;
  }

  const BOARDLAND_VOICE_TEXT_MAP = {
    '시현아, 룰렛을 빙글빙글 돌려볼까?': 'boardland.startGame',
    '시현아, 보드랜드를 시작해볼까? 룰렛을 빙글빙글 돌려요!': 'boardland.startGame',
    '참 잘했어요!': 'boardland.wellDone',
    '도감은 다음에 열어요!': 'boardland.collectionNextTime',
    '선물 하나를 받았어요!': 'boardland.giftReceived',
    '음성 안내를 켰어요!': 'boardland.audioEnabled',
    '처음부터 다시 시작해요!': 'boardland.restart',
    '다시 시작해요! 룰렛을 돌려요!': 'boardland.restart',
    '빙글빙글 돌아가요!': 'boardland.spinning',
    '성공! 정말 잘했어요!': 'boardland.missionSuccess',
    '한 칸 앞으로 가요!': 'boardland.move1',
    '두 칸 앞으로 출발!': 'boardland.move2',
    '세 칸 앞으로 가요!': 'boardland.move3',
    '우와! 한 번 더 돌려요!': 'boardland.spinAgain',
    '한 번 더 돌려요!': 'boardland.spinAgain',
    '한 번 더 돌릴 수 있어요!': 'boardland.spinAgain',
    '동물 친구를 따라 해 볼까요?': 'boardland.animalMission',
    '자동차 소리를 내 볼까요?': 'boardland.carMission',
    '가족이랑 함께하는 미션이에요!': 'boardland.familyMission',
    '선물 카드가 나왔어요!': 'boardland.giftCard',
    '출발해요!': 'boardland.cell.start',
    '첫 번째 길이에요!': 'boardland.cell.star1',
    '미션 카드예요!': 'boardland.carMission',
    '무지개 길을 지나가요!': 'boardland.cell.rainbow2',
    '무지개 길이에요!': 'boardland.cell.rainbow1',
    '선물을 찾았어요!': 'boardland.cell.gift1',
    '선물 칸이에요!': 'boardland.cell.gift2',
    '반짝 길이에요!': 'boardland.cell.star2',
    '반짝반짝!': 'boardland.cell.star4',
    '반짝 별이에요!': 'boardland.cell.star2',
    '하트 길이에요!': 'boardland.cell.heart1',
    '보너스 칸이에요!': 'boardland.mission.giftStar',
    '알록달록 길이에요!': 'boardland.cell.rainbow2',
    '좋아요!': 'boardland.wellDone',
    '조금만 더 가요!': 'boardland.wellDone',
    '마지막 미션이에요!': 'boardland.familyMission',
    '도착했어요!': 'boardland.cell.finish',
    '도착했어요! 정말 잘했어요!': 'boardland.cell.finish',
    '별 하나를 받았어요!': 'boardland.mission.giftStar',
    '좋아요! 성공 버튼을 눌러요!': 'boardland.wellDone',
    '자동차처럼 부릉부릉 해볼까요?': 'boardland.mission.carSound',
    '소방차처럼 출동해볼까요?': 'boardland.mission.firetruck',
    '경찰차처럼 순찰해볼까요?': 'boardland.mission.police',
    '구급차처럼 도와주러 가볼까요?': 'boardland.mission.ambulance',
    '손뼉을 짝짝 쳐볼까요?': 'boardland.mission.clap',
    '가족이랑 손뼉을 짝짝 쳐볼까요?': 'boardland.mission.clap',
    '가족이랑 하이파이브 해볼까요?': 'boardland.mission.highfive',
    '가족을 꼭 안아줘 볼까요?': 'boardland.mission.hug',
    '예쁜 웃음을 보여줄까요?': 'boardland.mission.smile',
    '가족에게 예쁜 웃음을 보여줄까요?': 'boardland.mission.smile'
  };

  function resolveBoardlandVoiceKey(text) {
    const raw = String(text || '').trim();
    if (!raw) return '';
    if (raw.startsWith('boardland.')) return raw;
    if (BOARDLAND_VOICE_TEXT_MAP[raw]) return BOARDLAND_VOICE_TEXT_MAP[raw];
    if (raw.includes('빙글빙글')) return 'boardland.spinning';
    if (raw.includes('룰렛')) return 'boardland.startGame';
    if (raw.includes('한 칸')) return 'boardland.move1';
    if (raw.includes('두 칸')) return 'boardland.move2';
    if (raw.includes('세 칸')) return 'boardland.move3';
    if (raw.includes('한 번 더')) return 'boardland.spinAgain';
    if (raw.includes('선물 카드')) return 'boardland.giftCard';
    if (raw.includes('선물')) return 'boardland.giftReceived';
    if (raw.includes('별')) return 'boardland.mission.giftStar';
    if (raw.includes('도착')) return 'boardland.gameComplete';
    if (raw.includes('성공') || raw.includes('잘했어요') || raw.includes('좋아요')) return 'boardland.missionSuccess';
    if (raw.includes('무지개')) return 'boardland.cell.rainbow1';
    if (raw.includes('하트')) return 'boardland.cell.heart1';
    if (raw.includes('자동차')) return 'boardland.mission.carSound';
    if (raw.includes('소방차')) return 'boardland.mission.firetruck';
    if (raw.includes('경찰차')) return 'boardland.mission.police';
    if (raw.includes('구급차')) return 'boardland.mission.ambulance';
    if (raw.includes('손뼉')) return 'boardland.mission.clap';
    if (raw.includes('하이파이브')) return 'boardland.mission.highfive';
    if (raw.includes('안아')) return 'boardland.mission.hug';
    if (raw.includes('웃음')) return 'boardland.mission.smile';
    return '';
  }

  function playBoardlandVoice(key) {
    if (!state.audioEnabled || !key) return;
    try {
      if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
        window.SihyeonVoice.play(key, '').catch(() => {});
      }
    } catch (error) {
      console.warn('[BoardLand] voice failed', error);
    }
  }

  function speak(text) {
    const key = resolveBoardlandVoiceKey(text);
    if (key) playBoardlandVoice(key);
  }

  function haptic(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (error) {
      // ignore
    }
  }


  function setManagedTimer(key, fn, delay) {
    clearManagedTimer(key);
    const timerId = window.setTimeout(() => {
      if (state.timers[key] === timerId) delete state.timers[key];
      fn();
    }, delay);
    state.timers[key] = timerId;
    return timerId;
  }

  function clearManagedTimer(key) {
    const timerId = state.timers[key];
    if (timerId) window.clearTimeout(timerId);
    delete state.timers[key];
  }

  function clearAllManagedTimers() {
    Object.keys(state.timers || {}).forEach(clearManagedTimer);
  }

  function injectRoot() {
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
          <section class="bl-board-wrap" aria-label="보드판" data-board-wrap>
            <div class="bl-board-stage" data-board-stage>
              <svg class="bl-route-svg" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
                <polyline class="bl-route-shadow" points="${getRoutePointsAttribute()}" />
                <polyline class="bl-route-main" points="${getRoutePointsAttribute()}" />
                <polyline class="bl-route-inner" points="${getRoutePointsAttribute()}" />
              </svg>
              <div class="bl-path-layer" data-path-markers></div>
              <div class="bl-token-layer" data-token-layer></div>
            </div>
          </section>

          <aside class="bl-side">
            <section class="bl-wheel-wrap" aria-label="룰렛">
              <div class="bl-wheel-stage">
                <div class="bl-wheel-pointer" aria-hidden="true"></div>
                <div class="bl-wheel" data-wheel>
                  ${ROULETTE_ITEMS.map((item, index) => `
                    <div class="bl-wheel-icon" style="--i:${index}" aria-hidden="true"><span class="mini">${item.emoji}</span></div>
                  `).join('')}
                </div>
                <button class="bl-spin-button" type="button" data-action="spin" aria-label="룰렛 돌리기">⭐</button>
              </div>
            </section>
            <section class="bl-player-panel" data-player-panel aria-label="플레이어"></section>
          </aside>
        </main>

        <footer class="bl-bottom">
          <section class="bl-mission-panel" aria-live="polite">
            <div class="bl-mission-icon" data-mission-icon>🎡</div>
            <div class="bl-mission-visual">
              <span class="bl-wave">🔊</span>
              <span class="bl-mission-effect" data-mission-effect>시작!</span>
              <span class="bl-wave">🔊</span>
            </div>
            <button class="bl-success-btn" type="button" data-action="success" aria-label="성공">✓</button>
          </section>
          <section class="bl-turn-card" aria-label="현재 차례">
            <img class="bl-turn-vehicle" data-turn-vehicle alt="현재 차례 차량" />
          </section>
        </footer>
      </div>

      <div class="bl-overlay" data-start-overlay>
        <section class="bl-start-panel" aria-label="게임 시작">
          <div class="bl-start-title">🎡🚒🚓🚑🚜</div>
          <div class="bl-player-count-grid">
            <button class="bl-player-count-btn" type="button" data-player-count="1" aria-label="1명">👤</button>
            <button class="bl-player-count-btn is-selected" type="button" data-player-count="2" aria-label="2명">👥</button>
            <button class="bl-player-count-btn" type="button" data-player-count="3" aria-label="3명">👨‍👩‍👧</button>
            <button class="bl-player-count-btn" type="button" data-player-count="4" aria-label="4명">👨‍👩‍👧‍👦</button>
          </div>
          <button class="bl-start-btn" type="button" data-action="start-game" aria-label="게임 시작">▶</button>
        </section>
      </div>

      <div class="bl-flash" data-flash aria-hidden="true"></div>
      <div class="bl-toast" data-toast></div>
      <div class="bl-result-burst" data-result-burst aria-hidden="true">⭐</div>
      <div class="bl-finish-panel" data-finish-panel aria-hidden="true">
        <img class="bl-winner-img" data-winner-img alt="우승 차량" />
        <div class="bl-finish-actions">
          <button class="bl-finish-choice-btn" type="button" data-action="replay-same" aria-label="같은 인원으로 다시">🔄</button>
          <button class="bl-finish-choice-btn secondary" type="button" data-action="reselect" aria-label="인원 다시 고르기">👥</button>
        </div>
      </div>
      <div class="bl-portrait-hint" aria-hidden="true">
        <div class="bl-portrait-card"><span class="big">📱↔️</span>가로로 돌리면<br>보드게임을 할 수 있어요!</div>
      </div>
    `;

    document.body.appendChild(root);
    renderPathMarkers(root);
    bindEvents(root);
    fitBoardStage(root);
    state.boardResizeHandler = () => fitBoardStage(root);
    window.addEventListener('resize', state.boardResizeHandler);
    state.isOpen = true;
  }

  function getRoutePointsAttribute() {
    return PATH_POINTS.map((point) => `${point.x},${point.y}`).join(' ');
  }

  function renderPathMarkers(root) {
    const holder = root.querySelector('[data-path-markers]');
    if (!holder) return;
    holder.innerHTML = PATH_POINTS.map((point) => {
      const pos = pointToPercent(point);
      return `
        <div class="bl-path-marker" data-point-index="${point.index}" data-type="${point.type}" style="left:${pos.left};top:${pos.top};" aria-label="${escapeHtml(point.voice)}">
          ${point.icon}
        </div>
      `;
    }).join('');
  }

  function fitBoardStage(root) {
    const wrap = root.querySelector('[data-board-wrap]');
    const stage = root.querySelector('[data-board-stage]');
    if (!wrap || !stage) return;

    const rect = wrap.getBoundingClientRect();
    const wrapWidth = Math.max(1, rect.width);
    const wrapHeight = Math.max(1, rect.height);
    const targetRatio = BOARD_STAGE.width / BOARD_STAGE.height;
    const wrapRatio = wrapWidth / wrapHeight;

    let width;
    let height;
    if (wrapRatio > targetRatio) {
      height = wrapHeight;
      width = height * targetRatio;
    } else {
      width = wrapWidth;
      height = width / targetRatio;
    }

    stage.style.width = `${width}px`;
    stage.style.height = `${height}px`;
  }

  function bindEvents(root) {
    root.addEventListener('click', (event) => {
      const countBtn = event.target.closest('[data-player-count]');
      if (countBtn) {
        const count = Number(countBtn.getAttribute('data-player-count')) || 2;
        selectPlayerCount(root, count);
        return;
      }

      const btn = event.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const actionMap = {
        close: () => close(),
        'toggle-sound': () => toggleSound(root),
        reset: () => resetGame(root, { keepPlayers: true }),
        'start-game': () => startGame(root, state.playerCount),
        spin: () => spinRoulette(root),
        success: () => completeMission(root),
        'replay-same': () => {
          hideFinishReplay(root);
          resetGame(root, { keepPlayers: false, playerCount: state.playerCount, autoStart: true });
        },
        reselect: () => {
          hideFinishReplay(root);
          showStartOverlay(root);
        }
      };
      if (actionMap[action]) actionMap[action]();
    });
  }

  function selectPlayerCount(root, count) {
    state.playerCount = Math.min(4, Math.max(1, count));
    root.querySelectorAll('[data-player-count]').forEach((btn) => {
      btn.classList.toggle('is-selected', Number(btn.getAttribute('data-player-count')) === state.playerCount);
    });
    speak(`${state.playerCount}명으로 놀아요!`);
  }

  async function startGame(root, count) {
    state.playerCount = Math.min(4, Math.max(1, count || state.playerCount || 2));
    await ensureTokenVehicles();
    state.isReady = true;
    state.isSpinning = false;
    state.isMoving = false;
    state.rotation = 0;
    state.currentPlayerIndex = 0;
    state.stars = 0;
    state.hearts = 3;
    state.gifts = 0;
    state.pendingSpinAgain = false;
    state.winner = null;
    clearMovePreview(root);
    state.players = createPlayers(state.playerCount);
    hideStartOverlay(root);
    hideFinishReplay(root);
    updateAll(root);
    setMission(root, { icon: '🎡', effect: '룰렛!', voice: '룰렛을 돌려볼까요?' }, false);
    haptic([20, 30, 20]);
    const player = getCurrentPlayer();
    speak(`${state.playerCount}명 보드게임 시작! ${player ? player.label : '첫 번째'} 차례예요. 룰렛을 돌려요!`);
  }

  async function ensureTokenVehicles() {
    if (state.tokenVehiclesLoaded && state.tokenVehicles.length) return state.tokenVehicles;

    const loaded = [];
    await Promise.all(TOKEN_MANIFEST_URLS.map(async (url) => {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`manifest ${response.status}`);
        const items = await response.json();
        if (!Array.isArray(items)) return;
        items.forEach((item) => {
          const vehicle = normalizeTokenVehicle(item);
          if (vehicle) loaded.push(vehicle);
        });
      } catch (error) {
        /* manifest fallback 아래에서 처리 */
      }
    }));

    const unique = [];
    const seen = new Set();
    loaded.forEach((vehicle) => {
      const key = `${vehicle.group}:${vehicle.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      unique.push(vehicle);
    });

    state.tokenVehicles = unique.length >= 4 ? unique : FALLBACK_TOKEN_VEHICLES.slice();
    state.tokenVehiclesLoaded = true;
    return state.tokenVehicles;
  }

  function normalizeTokenVehicle(item) {
    if (!item || !item.id || !item.file) return null;
    const group = item.category || item.group || 'vehicle';
    const name = item.name_ko || item.name || item.id;
    const voice = item.sound_ko || item.voice || `${name} 출발!`;
    return {
      id: String(item.id),
      group: String(group),
      name: String(name),
      file: String(item.file).replace(/^\.\//, ''),
      voice: String(voice)
    };
  }

  function createPlayers(count) {
    const pool = state.tokenVehicles.length ? state.tokenVehicles : FALLBACK_TOKEN_VEHICLES;
    const vehicles = shuffleCopy(pool).slice(0, count);
    return vehicles.map((vehicle, index) => ({
      id: `player_${index + 1}`,
      label: `${index + 1}P`,
      vehicle,
      position: 0,
      isFinished: false
    }));
  }

  function showStartOverlay(root) {
    state.isReady = false;
    state.isSpinning = false;
    state.isMoving = false;
    state.pendingSpinAgain = false;
    state.winner = null;
    const overlay = root.querySelector('[data-start-overlay]');
    if (overlay) overlay.style.display = 'grid';
    updateAll(root);
  }

  function hideStartOverlay(root) {
    const overlay = root.querySelector('[data-start-overlay]');
    if (overlay) overlay.style.display = 'none';
  }

  function toggleSound(root) {
    state.audioEnabled = !state.audioEnabled;
    const pill = root.querySelector('.bl-speaker-pill');
    if (pill) pill.textContent = state.audioEnabled ? '🔊' : '🔇';
    if (state.audioEnabled) speak('음성 안내를 켰어요!');
  }

  function resetGame(root, options = {}) {
    hideFinishReplay(root);
    clearAllManagedTimers();
    clearMovePreview(root);
    state.isSpinning = false;
    state.isMoving = false;
    state.rotation = 0;
    state.currentPlayerIndex = 0;
    state.stars = 0;
    state.hearts = 3;
    state.gifts = 0;
    state.pendingSpinAgain = false;
    state.winner = null;

    const wheel = root.querySelector('[data-wheel]');
    if (wheel) {
      wheel.style.transitionDuration = '0ms';
      wheel.style.transform = 'rotate(0deg)';
      requestAnimationFrame(() => { wheel.style.transitionDuration = ''; });
    }

    if (options.autoStart) {
      ensureTokenVehicles().then(() => {
        state.players = createPlayers(options.playerCount || state.playerCount || 2);
        state.isReady = true;
        hideStartOverlay(root);
        updateAll(root);
        setMission(root, { icon: '🎡', effect: '룰렛!', voice: '룰렛을 돌려볼까요?' }, false);
        speak('다시 시작해요! 룰렛을 돌려요!');
      });
      return;
    }

    if (options.keepPlayers && state.players.length) {
      state.players.forEach((player) => { player.position = 0; player.isFinished = false; });
      state.isReady = true;
      updateAll(root);
      setMission(root, { icon: '🎡', effect: '룰렛!', voice: '룰렛을 돌려볼까요?' }, false);
      showToast(root, '🚩 처음부터!');
      speak('처음부터 다시 시작해요!');
      return;
    }

    showStartOverlay(root);
    updateAll(root);
  }

  function spinRoulette(root) {
    if (!state.isReady || state.isSpinning || state.isMoving || state.winner) return;
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;

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
    speak(`${currentPlayer.label} 차례! 빙글빙글 돌아가요!`);

    setManagedTimer('spinComplete', () => {
      state.isSpinning = false;
      spinButton.classList.remove('is-spinning');
      spinButton.disabled = false;
      handleRouletteResult(root, item);
    }, duration + 80);
  }

  function handleRouletteResult(root, item) {
    if (!state.isReady || state.winner) return;
    haptic([30, 40, 30]);
    showRouletteResultBurst(root, item.emoji);
    showToast(root, `${item.emoji}`);
    speak(item.voice);

    if (item.type === 'move') {
      previewMovePath(root, item.value);
      setManagedTimer('movePreviewDelay', () => moveCurrentPlayer(root, item.value), 760);
      return;
    }

    if (item.type === 'mission') {
      setManagedTimer('missionDelay', () => setMission(root, pickRandomMission()), 620);
      return;
    }

    if (item.type === 'card') {
      setManagedTimer('cardDelay', () => {
        if (item.value === 'star') {
          state.stars += 1;
          setMission(root, { icon: '⭐', effect: '+1', voice: '별 하나를 받았어요!' });
        } else {
          state.gifts += 1;
          setMission(root, { icon: '🎁', effect: '선물!', voice: '선물 하나를 받았어요!' });
        }
        updateStats(root);
      }, 620);
      return;
    }

    if (item.type === 'bonus') {
      state.pendingSpinAgain = true;
      setManagedTimer('bonusDelay', () => {
        setMission(root, { icon: '🔁', effect: '한 번 더!', voice: '한 번 더 돌릴 수 있어요!' });
      }, 620);
    }
  }


  function previewMovePath(root, count) {
    clearMovePreview(root);
    const player = getCurrentPlayer();
    if (!player) return;
    const steps = Math.max(1, Number(count) || 1);
    const path = [];
    for (let i = 1; i <= steps; i += 1) {
      const nextIndex = Math.min(PATH_POINTS.length - 1, player.position + i);
      path.push(nextIndex);
      if (nextIndex >= PATH_POINTS.length - 1) break;
    }
    state.previewPath = path;
    path.forEach((pointIndex, localIndex) => {
      const marker = root.querySelector(`.bl-path-marker[data-point-index="${pointIndex}"]`);
      if (!marker) return;
      marker.classList.add('is-preview');
      if (localIndex === path.length - 1) marker.classList.add('is-preview-target');
    });
    setManagedTimer('clearPreview', () => clearMovePreview(root), 2600);
  }

  function clearMovePreview(root) {
    state.previewPath = [];
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('.bl-path-marker.is-preview, .bl-path-marker.is-preview-target').forEach((marker) => {
      marker.classList.remove('is-preview', 'is-preview-target');
    });
    clearManagedTimer('clearPreview');
  }

  function moveCurrentPlayer(root, count) {
    const player = getCurrentPlayer();
    if (!player || state.isMoving) return;

    clearMovePreview(root);
    state.isMoving = true;
    const steps = Math.max(1, Number(count) || 1);
    let done = 0;

    const goOneStep = () => {
      if (player.position >= PATH_POINTS.length - 1) {
        state.isMoving = false;
        celebrateFinish(root, player);
        return;
      }

      player.position += 1;
      done += 1;
      updateTokens(root);
      highlightCurrentPositions(root);
      haptic(15);

      const point = PATH_POINTS[player.position];
      if (done < steps && player.position < PATH_POINTS.length - 1) {
        setManagedTimer('moveStep', goOneStep, 390);
      } else {
        state.isMoving = false;
        setManagedTimer('afterMove', () => afterMove(root, player, point), 430);
      }
    };

    goOneStep();
  }

  function afterMove(root, player, point) {
    if (!point || !player) return;
    speak(point.voice);

    if (point.type === 'finish' || player.position >= PATH_POINTS.length - 1) {
      celebrateFinish(root, player);
      return;
    }

    if (point.type === 'gift') {
      state.gifts += 1;
      updateStats(root);
      setMission(root, { icon: '🎁', effect: '선물!', voice: '선물 하나를 받았어요!' });
      return;
    }

    if (point.type === 'bonus') {
      state.stars += 1;
      updateStats(root);
      setMission(root, { icon: '⭐', effect: '+1', voice: '별 하나를 받았어요!' });
      return;
    }

    if (point.type === 'mission') {
      setMission(root, pickRandomMission());
      return;
    }

    setMission(root, { icon: point.icon || '✨', effect: '좋아요!', voice: '좋아요! 성공 버튼을 눌러요!' });
  }

  function setMission(root, mission, shouldSpeak = true) {
    const icon = root.querySelector('[data-mission-icon]');
    const effect = root.querySelector('[data-mission-effect]');
    if (icon) icon.textContent = mission.icon || '⭐';
    if (effect) effect.textContent = mission.effect || '좋아요!';
    if (shouldSpeak) speak(mission.voice || mission.effect || '좋아요!');
  }

  function completeMission(root) {
    if (!state.isReady || state.isSpinning || state.isMoving || state.winner) return;

    haptic([20, 30, 20]);
    state.stars += 1;
    updateStats(root);
    showFlash(root);
    showToast(root, '✅ 성공!');

    if (state.pendingSpinAgain) {
      state.pendingSpinAgain = false;
      const player = getCurrentPlayer();
      speak(`${player ? player.label : '지금'} 한 번 더 돌려요!`);
      setMission(root, { icon: '🔁', effect: '다시!', voice: '한 번 더 돌려요!' }, false);
      updateAll(root);
      return;
    }

    nextPlayer(root);
  }

  function nextPlayer(root) {
    if (!state.players.length) return;
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    updateAll(root);
    const player = getCurrentPlayer();
    speak(`${player ? player.label : '다음'} 차례예요! 룰렛을 돌려요!`);
    setMission(root, { icon: '🎡', effect: '룰렛!', voice: '룰렛을 돌려요!' }, false);
  }

  function celebrateFinish(root, player) {
    if (state.winner) return;
    state.winner = player;
    player.isFinished = true;
    player.position = PATH_POINTS.length - 1;
    state.stars += 3;
    state.hearts += 1;
    updateAll(root);
    setMission(root, { icon: '🏁', effect: '도착!', voice: '도착했어요!' }, false);
    showToast(root, '🎉 도착!');
    showFlash(root);
    showFinishReplay(root, player);
    speak(`${player.label} ${player.vehicle.name} 도착! 정말 정말 잘했어요!`);
  }

  function updateAll(root) {
    updateStats(root);
    renderPlayers(root);
    updateTokens(root);
    updateTurnVehicle(root);
    highlightCurrentPositions(root);
    fitBoardStage(root);
  }

  function updateStats(root) {
    const stars = root.querySelector('[data-stat="stars"]');
    const hearts = root.querySelector('[data-stat="hearts"]');
    const gifts = root.querySelector('[data-stat="gifts"]');
    if (stars) stars.textContent = String(state.stars);
    if (hearts) hearts.textContent = String(state.hearts);
    if (gifts) gifts.textContent = String(state.gifts);
  }

  function renderPlayers(root) {
    const panel = root.querySelector('[data-player-panel]');
    if (!panel) return;
    if (!state.players.length) {
      panel.innerHTML = '';
      return;
    }

    panel.innerHTML = state.players.map((player, index) => {
      const current = index === state.currentPlayerIndex && !state.winner;
      return `
        <div class="bl-player-card ${current ? 'is-current' : ''}">
          <img class="bl-player-mini-img" src="${escapeHtml(player.vehicle.file)}" alt="${escapeHtml(player.vehicle.name)}" onerror="this.style.display='none'" />
          <div class="bl-player-meta">
            <div class="bl-player-label">${escapeHtml(player.label)}</div>
            <div class="bl-player-pos">${player.position + 1}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateTokens(root) {
    const layer = root.querySelector('[data-token-layer]');
    if (!layer) return;

    if (!state.players.length) {
      layer.innerHTML = '';
      return;
    }

    const grouped = groupPlayersByPosition();
    const tokensHtml = [];

    Object.keys(grouped).forEach((positionKey) => {
      const playersOnPoint = grouped[positionKey];
      const point = PATH_POINTS[Number(positionKey)] || PATH_POINTS[0];
      const offsets = TOKEN_OFFSETS[Math.min(4, playersOnPoint.length)] || TOKEN_OFFSETS[1];

      playersOnPoint.forEach((player, localIndex) => {
        const offset = offsets[localIndex] || { x: 0, y: 0 };
        const pos = pointWithOffsetToPercent(point, offset);
        const playerIndex = state.players.findIndex((item) => item.id === player.id);
        const current = playerIndex === state.currentPlayerIndex && !state.winner;
        tokensHtml.push(`
          <div class="bl-player-token ${current ? 'is-current' : ''}" data-token-id="${escapeHtml(player.id)}" style="left:${pos.left};top:${pos.top};">
            <div class="bl-token-img-wrap">
              <img src="${escapeHtml(player.vehicle.file)}" alt="${escapeHtml(player.vehicle.name)}" onerror="this.closest('.bl-player-token').classList.add('is-img-error')" />
              <span class="bl-token-fallback">${getVehicleFallbackEmoji(player.vehicle.group)}</span>
            </div>
          </div>
        `);
      });
    });

    layer.innerHTML = tokensHtml.join('');
  }

  function groupPlayersByPosition() {
    const grouped = {};
    state.players.forEach((player) => {
      const key = String(player.position);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(player);
    });
    return grouped;
  }

  function updateTurnVehicle(root) {
    const img = root.querySelector('[data-turn-vehicle]');
    const player = getCurrentPlayer();
    if (!img) return;
    if (!player) {
      img.removeAttribute('src');
      img.alt = '현재 차례 차량';
      return;
    }
    img.src = player.vehicle.file;
    img.alt = player.vehicle.name;
  }

  function highlightCurrentPositions(root) {
    const activePositions = new Set(state.players.map((player) => String(player.position)));
    root.querySelectorAll('.bl-path-marker').forEach((marker) => {
      marker.classList.toggle('is-current', activePositions.has(marker.getAttribute('data-point-index')));
    });
  }

  function getVehicleFallbackEmoji(group) {
    if (group === 'fire') return '🚒';
    if (group === 'police') return '🚓';
    if (group === 'rescue') return '🚑';
    if (group === 'construction') return '🚜';
    return '🚗';
  }

  function showRouletteResultBurst(root, emoji) {
    const burst = root.querySelector('[data-result-burst]');
    if (!burst) return;

    burst.textContent = emoji || '⭐';
    burst.classList.remove('show');
    void burst.offsetWidth;
    burst.classList.add('show');

    setManagedTimer('resultBurst', () => {
      burst.classList.remove('show');
    }, 1100);
  }

  function showFinishReplay(root, player) {
    const panel = root.querySelector('[data-finish-panel]');
    const winnerImg = root.querySelector('[data-winner-img]');
    if (winnerImg && player) {
      winnerImg.src = player.vehicle.file;
      winnerImg.alt = `${player.label} ${player.vehicle.name}`;
    }
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

  function showFlash(root) {
    const flash = root.querySelector('[data-flash]');
    if (!flash) return;
    flash.classList.remove('show');
    void flash.offsetWidth;
    flash.classList.add('show');
    setManagedTimer('flash', () => flash.classList.remove('show'), 760);
  }

  function showToast(root, message) {
    const toast = root.querySelector('[data-toast]');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    setManagedTimer('toast', () => toast.classList.remove('show'), 1300);
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
    injectRoot();
  }

  function close() {
    const oldRoot = document.getElementById(ROOT_ID);
    clearAllManagedTimers();
    if (oldRoot) {
      clearMovePreview(oldRoot);
      oldRoot.remove();
    }
    if (state.boardResizeHandler) {
      window.removeEventListener('resize', state.boardResizeHandler);
      state.boardResizeHandler = null;
    }
    try {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } catch (error) {
      // ignore
    }
    state.isOpen = false;
    state.isReady = false;
    state.isSpinning = false;
    state.isMoving = false;
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
