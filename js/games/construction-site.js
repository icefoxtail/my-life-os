(function () {
  const GAME_KEY = 'constructionSite';
  const STYLE_ID = 'sihyeon-construction-site-style';
  const MANIFEST_URL = './assets/vehicles/construction_manifest.json';
  const TOTAL_ROUNDS = 6;

  const FALLBACK_VEHICLES = [
    {
      id: 'excavator',
      category: 'construction',
      file: 'assets/vehicles/construction/excavator.png',
      name_ko: '포크레인',
      sound_ko: '쿠궁쿠궁 흙을 퍼요!'
    },
    {
      id: 'mini_excavator',
      category: 'construction',
      file: 'assets/vehicles/construction/mini_excavator.png',
      name_ko: '미니 굴착기',
      sound_ko: '작지만 힘차게 파요!'
    },
    {
      id: 'bulldozer',
      category: 'construction',
      file: 'assets/vehicles/construction/bulldozer.png',
      name_ko: '불도저',
      sound_ko: '쓱쓱 밀고 지나가요!'
    },
    {
      id: 'wheel_loader',
      category: 'construction',
      file: 'assets/vehicles/construction/wheel_loader.png',
      name_ko: '휠로더',
      sound_ko: '커다란 삽으로 담아요!'
    },
    {
      id: 'dump_truck',
      category: 'construction',
      file: 'assets/vehicles/construction/dump_truck.png',
      name_ko: '덤프트럭',
      sound_ko: '우르르 짐을 내려요!'
    },
    {
      id: 'concrete_mixer',
      category: 'construction',
      file: 'assets/vehicles/construction/concrete_mixer.png',
      name_ko: '레미콘',
      sound_ko: '빙글빙글 섞어요!'
    },
    {
      id: 'concrete_pump_truck',
      category: 'construction',
      file: 'assets/vehicles/construction/concrete_pump_truck.png',
      name_ko: '콘크리트 펌프카',
      sound_ko: '쭉쭉 뻗어서 보내요!'
    },
    {
      id: 'crane_truck',
      category: 'construction',
      file: 'assets/vehicles/construction/crane_truck.png',
      name_ko: '크레인차',
      sound_ko: '번쩍 들어 올려요!'
    },
    {
      id: 'forklift',
      category: 'construction',
      file: 'assets/vehicles/construction/forklift.png',
      name_ko: '지게차',
      sound_ko: '삐리리 짐을 들어요!'
    }
  ];

  const MISSIONS = [
    {
      id: 'dig',
      title: '땅을 파야 해요!',
      question: '땅을 파야 해요. 어떤 차가 필요할까?',
      answerIds: ['excavator', 'mini_excavator'],
      targetIcon: '🟫',
      resultIcon: '🕳️',
      workLabel: '흙 파기',
      successText: '쿠궁쿠궁! 땅을 팠어요!',
      wrongText: '이 차는 다른 일을 잘해요. 흙을 파는 차를 골라볼까?',
      stageClass: 'cs-stage-dig'
    },
    {
      id: 'push',
      title: '흙더미를 밀어야 해요!',
      question: '흙더미를 앞으로 밀어야 해요. 누가 도와줄까?',
      answerIds: ['bulldozer'],
      targetIcon: '🧱',
      resultIcon: '🟩',
      workLabel: '밀기',
      successText: '쓱쓱! 흙더미를 밀었어요!',
      wrongText: '이 차는 밀기보다 다른 일을 잘해요. 다시 골라볼까?',
      stageClass: 'cs-stage-push'
    },
    {
      id: 'load',
      title: '흙을 담아야 해요!',
      question: '흙을 담아서 옮겨야 해요. 어떤 차가 좋을까?',
      answerIds: ['wheel_loader'],
      targetIcon: '🟤',
      resultIcon: '🪣',
      workLabel: '담기',
      successText: '커다란 삽으로 흙을 담았어요!',
      wrongText: '이 차는 흙을 담기 어렵대요. 커다란 삽이 있는 차를 찾아볼까?',
      stageClass: 'cs-stage-load'
    },
    {
      id: 'carry',
      title: '짐을 멀리 옮겨야 해요!',
      question: '흙과 돌을 다른 곳으로 옮겨야 해요. 어떤 차가 필요할까?',
      answerIds: ['dump_truck'],
      targetIcon: '📦',
      resultIcon: '🏁',
      workLabel: '옮기기',
      successText: '우르르! 짐을 싣고 옮겼어요!',
      wrongText: '이 차는 많이 싣기 어려워요. 짐을 옮기는 차를 찾아볼까?',
      stageClass: 'cs-stage-carry'
    },
    {
      id: 'mix',
      title: '콘크리트를 만들어야 해요!',
      question: '튼튼한 바닥을 만들 재료가 필요해요. 어떤 차가 필요할까?',
      answerIds: ['concrete_mixer'],
      targetIcon: '🌀',
      resultIcon: '⬛',
      workLabel: '섞기',
      successText: '빙글빙글! 콘크리트가 완성됐어요!',
      wrongText: '이 차는 섞는 차가 아니에요. 빙글빙글 도는 차를 찾아볼까?',
      stageClass: 'cs-stage-mix'
    },
    {
      id: 'lift',
      title: '무거운 짐을 들어야 해요!',
      question: '무거운 짐을 높이 들어야 해요. 어떤 차가 필요할까?',
      answerIds: ['crane_truck', 'forklift'],
      targetIcon: '📦',
      resultIcon: '✨',
      workLabel: '들기',
      successText: '번쩍! 무거운 짐을 들어 올렸어요!',
      wrongText: '이 차는 들어 올리는 일이 어려워요. 다시 골라볼까?',
      stageClass: 'cs-stage-lift'
    },
    {
      id: 'pump',
      title: '높은 곳에 보내야 해요!',
      question: '높은 곳까지 콘크리트를 보내야 해요. 어떤 차가 필요할까?',
      answerIds: ['concrete_pump_truck'],
      targetIcon: '⬛',
      resultIcon: '🌟',
      workLabel: '보내기',
      successText: '쭉쭉! 높은 곳까지 보냈어요!',
      wrongText: '이 차는 높이 보내는 차가 아니에요. 긴 팔이 있는 차를 찾아볼까?',
      stageClass: 'cs-stage-pump'
    }
  ];

  const state = {
    container: null,
    options: {},
    vehicles: [],
    missions: [],
    currentRound: 1,
    currentMission: null,
    currentChoices: [],
    locked: false,
    destroyed: false,
    timers: []
  };

  function playGameVoice(id) {
    if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      window.SihyeonVoice.play(id).catch(() => {});
    }
  }

  function speak(text, force) {
    if (!text) return;
    if (state.options && typeof state.options.speakGuide === 'function') {
      state.options.speakGuide(text, !!force);
      return;
    }
    if (typeof speechSynthesis === 'undefined') return;
    try {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.92;
      utterance.pitch = 1.18;
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn('TTS 재생 실패:', error);
    }
  }

  function vibrate(pattern) {
    if (!navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn(error);
    }
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
  }

  function injectStyle() {
    const prev = document.getElementById(STYLE_ID);
    if (prev) prev.remove();

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .cs-root {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
        color: #223047;
        background:
          radial-gradient(circle at 18% 14%, rgba(255,255,255,0.95) 0 0.8%, transparent 1.2%),
          radial-gradient(circle at 76% 18%, rgba(255,255,255,0.9) 0 0.7%, transparent 1.1%),
          linear-gradient(180deg, #60c8ff 0%, #9ee7ff 36%, #ffe59c 36.4%, #f8b24d 100%);
        font-family: 'Arial Rounded MT Bold', 'Nanum Gothic', system-ui, sans-serif;
        user-select: none;
        touch-action: manipulation;
      }

      .cs-root::before {
        content: "";
        position: absolute;
        inset: 0;
        background:
          radial-gradient(ellipse at 18% 21%, rgba(255,255,255,0.85) 0 7%, transparent 7.4%),
          radial-gradient(ellipse at 28% 18%, rgba(255,255,255,0.76) 0 6%, transparent 6.4%),
          radial-gradient(ellipse at 68% 25%, rgba(255,255,255,0.74) 0 8%, transparent 8.4%),
          radial-gradient(ellipse at 81% 21%, rgba(255,255,255,0.82) 0 6%, transparent 6.5%);
        opacity: 0.96;
        pointer-events: none;
        animation: csCloudFloat 7s ease-in-out infinite alternate;
      }

      .cs-root::after {
        content: "";
        position: absolute;
        left: -8%;
        right: -8%;
        bottom: -10%;
        height: 34%;
        background:
          repeating-linear-gradient(-18deg, rgba(255,255,255,0.16) 0 12px, transparent 12px 26px),
          linear-gradient(180deg, #d28b34 0%, #a76524 100%);
        border-radius: 50% 50% 0 0 / 22% 22% 0 0;
        box-shadow: inset 0 18px 0 rgba(255,255,255,0.18);
        pointer-events: none;
      }

      .cs-top {
        position: relative;
        z-index: 5;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 10px 12px 6px;
      }

      .cs-pill {
        min-height: 48px;
        padding: 8px 16px;
        border-radius: 999px;
        background: rgba(255,255,255,0.9);
        border: 4px solid #fff;
        box-shadow: 0 6px 0 rgba(102,60,14,0.22);
        font-size: clamp(17px, 4.6vw, 24px);
        font-weight: 900;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        white-space: nowrap;
      }

      .cs-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }

      .cs-btn {
        min-width: 62px;
        min-height: 48px;
        padding: 8px 13px;
        border-radius: 999px;
        border: 4px solid #fff;
        background: linear-gradient(180deg, #fff 0%, #ffe477 100%);
        box-shadow: 0 6px 0 rgba(102,60,14,0.22);
        color: #223047;
        font: inherit;
        font-size: 17px;
        font-weight: 900;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }

      .cs-btn:active {
        transform: translateY(4px);
        box-shadow: 0 2px 0 rgba(102,60,14,0.22);
      }

      .cs-progress {
        position: relative;
        z-index: 5;
        flex-shrink: 0;
        display: flex;
        justify-content: center;
        gap: 7px;
        padding: 0 12px 6px;
      }

      .cs-dot {
        width: clamp(15px, 4vw, 22px);
        height: clamp(15px, 4vw, 22px);
        border-radius: 999px;
        background: rgba(255,255,255,0.62);
        border: 3px solid #fff;
        box-shadow: 0 3px 0 rgba(102,60,14,0.18);
      }

      .cs-dot.active {
        background: linear-gradient(180deg, #fff36d 0%, #ff9e2c 100%);
        transform: scale(1.18);
      }

      .cs-dot.done {
        background: linear-gradient(180deg, #9cff86 0%, #23b94a 100%);
      }

      .cs-question-card {
        position: relative;
        z-index: 5;
        margin: 0 12px 8px;
        padding: 10px 12px;
        border-radius: 24px;
        border: 5px solid #fff;
        background: rgba(255,255,255,0.88);
        box-shadow: 0 7px 0 rgba(102,60,14,0.2);
        text-align: center;
        flex-shrink: 0;
      }

      .cs-title {
        font-size: clamp(20px, 5.5vw, 30px);
        line-height: 1.08;
        font-weight: 900;
        color: #1f2d44;
      }

      .cs-question {
        margin-top: 5px;
        font-size: clamp(15px, 4.2vw, 21px);
        line-height: 1.2;
        font-weight: 900;
        color: #5a3a12;
        word-break: keep-all;
      }

      .cs-stage {
        position: relative;
        z-index: 3;
        flex: 1;
        min-height: 0;
        margin: 0 12px 10px;
        border-radius: 30px;
        border: 6px solid rgba(255,255,255,0.92);
        overflow: hidden;
        background:
          radial-gradient(circle at 50% 18%, rgba(255,255,255,0.28) 0 6%, transparent 6.5%),
          linear-gradient(180deg, rgba(255,244,185,0.84) 0%, rgba(255,196,89,0.84) 46%, rgba(158,92,29,0.9) 100%);
        box-shadow:
          0 9px 0 rgba(102,60,14,0.22),
          inset 0 5px 0 rgba(255,255,255,0.34);
      }

      .cs-stage-sky-shine {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 16% 14%, rgba(255,255,255,0.65) 0 5%, transparent 5.6%),
          radial-gradient(circle at 82% 17%, rgba(255,255,255,0.4) 0 8%, transparent 8.6%);
        pointer-events: none;
      }

      .cs-site-board {
        position: absolute;
        left: 14px;
        top: 14px;
        z-index: 5;
        min-height: 42px;
        padding: 7px 14px;
        border-radius: 999px;
        background: linear-gradient(180deg, #fffdf2 0%, #ffe082 100%);
        border: 4px solid #fff;
        box-shadow: 0 5px 0 rgba(102,60,14,0.2);
        font-size: clamp(15px, 4vw, 21px);
        font-weight: 900;
        color: #4b2e08;
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }

      .cs-sun {
        position: absolute;
        right: clamp(14px, 5vw, 40px);
        top: clamp(18px, 5vw, 42px);
        width: clamp(58px, 15vw, 96px);
        height: clamp(58px, 15vw, 96px);
        border-radius: 50%;
        background:
          radial-gradient(circle at 35% 35%, #fff 0%, #fff58a 22%, #ffbb22 70%, #ff8f00 100%);
        box-shadow:
          0 0 0 12px rgba(255,230,80,0.22),
          0 0 36px rgba(255,193,7,0.55);
        animation: csPulseSun 2.8s ease-in-out infinite alternate;
      }

      .cs-ground {
        position: absolute;
        left: -4%;
        right: -4%;
        bottom: -2%;
        height: 37%;
        border-radius: 50% 50% 0 0 / 18% 18% 0 0;
        background:
          repeating-linear-gradient(14deg, rgba(255,255,255,0.16) 0 12px, transparent 12px 24px),
          linear-gradient(180deg, #d78a31 0%, #9d5c21 100%);
        box-shadow: inset 0 14px 0 rgba(255,255,255,0.16);
      }

      .cs-road {
        position: absolute;
        left: 50%;
        bottom: -8%;
        width: min(52vw, 390px);
        height: 42%;
        transform: translateX(-50%) perspective(240px) rotateX(34deg);
        transform-origin: bottom center;
        background:
          linear-gradient(90deg, transparent 0 45%, rgba(255,255,255,0.65) 45% 55%, transparent 55% 100%),
          linear-gradient(180deg, #6d7279 0%, #313942 100%);
        border-left: 6px solid rgba(255,255,255,0.45);
        border-right: 6px solid rgba(255,255,255,0.45);
        clip-path: polygon(34% 0%, 66% 0%, 100% 100%, 0% 100%);
        opacity: 0.92;
      }

      .cs-target-zone {
        position: absolute;
        left: 50%;
        bottom: 26%;
        width: clamp(155px, 46vw, 290px);
        height: clamp(110px, 27vw, 175px);
        transform: translateX(-50%);
        border-radius: 28px;
        border: 6px dashed rgba(255,255,255,0.9);
        background:
          radial-gradient(circle at 28% 32%, rgba(255,255,255,0.55) 0 11%, transparent 12%),
          linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.12));
        display: grid;
        place-items: center;
        box-shadow: inset 0 0 20px rgba(255,255,255,0.28), 0 8px 0 rgba(102,60,14,0.15);
      }

      .cs-target-icon {
        font-size: clamp(58px, 17vw, 104px);
        filter: drop-shadow(0 7px 0 rgba(0,0,0,0.16));
        animation: csTargetWiggle 1.7s ease-in-out infinite alternate;
      }

      .cs-result-icon {
        position: absolute;
        left: 50%;
        bottom: 28%;
        z-index: 8;
        transform: translateX(-50%) scale(0);
        width: clamp(116px, 33vw, 210px);
        height: clamp(90px, 23vw, 145px);
        border-radius: 28px;
        border: 5px solid #fff;
        background:
          radial-gradient(circle at 32% 26%, rgba(255,255,255,0.68) 0 15%, transparent 16%),
          linear-gradient(180deg, #d7ff8d 0%, #58d46f 100%);
        box-shadow: 0 8px 0 rgba(44,113,44,0.25);
        display: grid;
        place-items: center;
        font-size: clamp(48px, 14vw, 88px);
      }

      .cs-root.is-success .cs-result-icon {
        animation: csResultPop 0.72s cubic-bezier(0.2, 1.4, 0.32, 1) forwards;
      }

      .cs-worker-vehicle {
        position: absolute;
        left: -42%;
        bottom: 17%;
        z-index: 10;
        width: clamp(130px, 34vw, 245px);
        height: clamp(112px, 29vw, 200px);
        display: grid;
        place-items: center;
        transform: translateX(0);
        opacity: 0;
        pointer-events: none;
      }

      .cs-worker-vehicle img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 12px 0 rgba(0,0,0,0.16)) drop-shadow(0 16px 18px rgba(0,0,0,0.2));
      }

      .cs-worker-fallback {
        font-size: clamp(80px, 22vw, 150px);
        filter: drop-shadow(0 10px 0 rgba(0,0,0,0.15));
      }

      .cs-root.is-working .cs-worker-vehicle {
        animation: csVehicleWork 2.35s cubic-bezier(0.18, 0.88, 0.22, 1) forwards;
      }

      .cs-root.is-working .cs-target-zone {
        animation: csWorkShake 0.22s ease-in-out 4 alternate;
      }

      .cs-dust {
        position: absolute;
        left: 50%;
        bottom: 31%;
        z-index: 9;
        width: clamp(160px, 42vw, 290px);
        height: clamp(84px, 20vw, 128px);
        transform: translateX(-50%);
        pointer-events: none;
        opacity: 0;
      }

      .cs-dust span {
        position: absolute;
        bottom: 0;
        width: clamp(26px, 7vw, 46px);
        height: clamp(26px, 7vw, 46px);
        border-radius: 50%;
        background: rgba(255,235,169,0.9);
        box-shadow: inset 0 4px 0 rgba(255,255,255,0.34);
      }

      .cs-dust span:nth-child(1) { left: 5%; }
      .cs-dust span:nth-child(2) { left: 25%; width: clamp(34px, 9vw, 58px); height: clamp(34px, 9vw, 58px); }
      .cs-dust span:nth-child(3) { left: 48%; }
      .cs-dust span:nth-child(4) { left: 68%; width: clamp(30px, 8vw, 52px); height: clamp(30px, 8vw, 52px); }

      .cs-root.is-working .cs-dust {
        animation: csDustBoom 1.2s ease-out 0.55s forwards;
      }

      .cs-finish-build {
        position: absolute;
        left: 50%;
        bottom: 32%;
        z-index: 6;
        width: clamp(124px, 34vw, 230px);
        height: clamp(96px, 25vw, 170px);
        transform: translateX(-50%);
        opacity: 0;
        pointer-events: none;
      }

      .cs-build-base {
        position: absolute;
        left: 8%;
        right: 8%;
        bottom: 0;
        height: 56%;
        border-radius: 18px 18px 8px 8px;
        border: 5px solid #fff;
        background: linear-gradient(180deg, #ffef8a 0%, #ff9d3d 100%);
        box-shadow: 0 8px 0 rgba(102,60,14,0.22);
      }

      .cs-build-roof {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 46%;
        height: 50%;
        clip-path: polygon(50% 0%, 100% 68%, 88% 80%, 50% 30%, 12% 80%, 0 68%);
        background: linear-gradient(180deg, #ff5a76 0%, #d12d44 100%);
        filter: drop-shadow(0 6px 0 rgba(102,60,14,0.18));
      }

      .cs-build-door {
        position: absolute;
        left: 50%;
        bottom: 0;
        width: 24%;
        height: 34%;
        transform: translateX(-50%);
        border-radius: 12px 12px 0 0;
        background: #744123;
        border: 4px solid rgba(255,255,255,0.75);
      }

      .cs-root.is-complete .cs-finish-build {
        animation: csHousePop 0.8s cubic-bezier(0.2, 1.4, 0.32, 1) forwards;
      }

      .cs-choices {
        position: relative;
        z-index: 6;
        flex-shrink: 0;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: clamp(7px, 2.2vw, 13px);
        padding: 0 12px 14px;
      }

      .cs-choice {
        min-width: 0;
        min-height: clamp(112px, 25vw, 166px);
        border-radius: 24px;
        border: 5px solid #fff;
        background:
          radial-gradient(circle at 28% 22%, rgba(255,255,255,0.7) 0 13%, transparent 14%),
          linear-gradient(180deg, #ffffff 0%, #fff1b8 100%);
        box-shadow: 0 8px 0 rgba(102,60,14,0.2);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding: 8px 7px;
        color: #24324a;
        font: inherit;
        font-weight: 900;
        -webkit-tap-highlight-color: transparent;
        position: relative;
        overflow: hidden;
      }

      .cs-choice::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(120deg, transparent 0 28%, rgba(255,255,255,0.5) 42%, transparent 56% 100%);
        transform: translateX(-120%);
        opacity: 0.72;
      }

      .cs-choice:active {
        transform: translateY(5px);
        box-shadow: 0 3px 0 rgba(102,60,14,0.2);
      }

      .cs-choice:not(.is-disabled):hover::before {
        animation: csShine 0.75s ease-out;
      }

      .cs-choice.is-disabled {
        pointer-events: none;
      }

      .cs-choice.is-correct {
        background: linear-gradient(180deg, #f7fff1 0%, #8cff79 100%);
        box-shadow: 0 8px 0 rgba(38,122,37,0.25), 0 0 0 6px rgba(126,217,87,0.28);
      }

      .cs-choice.is-wrong {
        animation: csWrongWobble 0.42s ease-in-out;
        background: linear-gradient(180deg, #fff 0%, #ffd8d8 100%);
      }

      .cs-choice-img-wrap {
        flex: 1;
        min-height: 0;
        width: 100%;
        display: grid;
        place-items: center;
      }

      .cs-choice-img {
        max-width: 95%;
        max-height: clamp(62px, 15vw, 104px);
        object-fit: contain;
        filter: drop-shadow(0 8px 0 rgba(0,0,0,0.12));
      }

      .cs-choice-emoji {
        font-size: clamp(46px, 13vw, 86px);
        filter: drop-shadow(0 7px 0 rgba(0,0,0,0.14));
      }

      .cs-choice-name {
        width: 100%;
        min-height: 24px;
        padding: 3px 5px;
        border-radius: 999px;
        background: rgba(255,255,255,0.7);
        font-size: clamp(13px, 3.4vw, 18px);
        line-height: 1.08;
        text-align: center;
        word-break: keep-all;
      }

      .cs-message {
        position: absolute;
        left: 50%;
        bottom: clamp(128px, 27vw, 185px);
        z-index: 30;
        width: min(88vw, 520px);
        transform: translateX(-50%) translateY(20px) scale(0.92);
        opacity: 0;
        pointer-events: none;
        padding: 14px 16px;
        border-radius: 28px;
        border: 5px solid #fff;
        background: rgba(255,255,255,0.94);
        box-shadow: 0 9px 0 rgba(102,60,14,0.22);
        text-align: center;
        color: #223047;
        font-size: clamp(21px, 5.8vw, 34px);
        line-height: 1.14;
        font-weight: 900;
      }

      .cs-message.show {
        animation: csMessagePop 1.35s ease-out forwards;
      }

      .cs-success-panel {
        position: absolute;
        inset: 0;
        z-index: 60;
        display: grid;
        place-items: center;
        padding: 18px;
        background: rgba(70, 170, 255, 0.2);
        backdrop-filter: blur(4px);
      }

      .cs-success-box {
        width: min(92vw, 540px);
        border-radius: 32px;
        border: 7px solid #fff;
        background:
          radial-gradient(circle at 28% 16%, rgba(255,255,255,0.82) 0 10%, transparent 11%),
          linear-gradient(180deg, #ffffff 0%, #fff0a6 100%);
        box-shadow: 0 14px 0 rgba(102,60,14,0.22);
        padding: 24px 18px 20px;
        text-align: center;
        display: grid;
        gap: 14px;
      }

      .cs-success-icon {
        font-size: clamp(78px, 23vw, 132px);
        line-height: 1;
        animation: csSuccessBounce 1s ease-in-out infinite alternate;
      }

      .cs-success-title {
        font-size: clamp(30px, 8vw, 46px);
        line-height: 1.06;
        font-weight: 900;
        color: #223047;
      }

      .cs-success-sub {
        font-size: clamp(17px, 4.8vw, 24px);
        line-height: 1.2;
        font-weight: 900;
        color: #74501c;
      }

      .cs-success-actions {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .cs-loading,
      .cs-error {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        text-align: center;
        color: #fff;
        background: linear-gradient(180deg, #60c8ff 0%, #f7b143 100%);
        font-size: clamp(24px, 7vw, 38px);
        line-height: 1.18;
        font-weight: 900;
        text-shadow: 0 3px 0 rgba(0,0,0,0.18);
      }

      @keyframes csCloudFloat {
        from { transform: translateX(-10px); }
        to { transform: translateX(14px); }
      }

      @keyframes csPulseSun {
        from { transform: scale(1) rotate(0deg); }
        to { transform: scale(1.08) rotate(8deg); }
      }

      @keyframes csTargetWiggle {
        from { transform: rotate(-3deg) scale(1); }
        to { transform: rotate(4deg) scale(1.05); }
      }

      @keyframes csVehicleWork {
        0% { left: -42%; opacity: 0; transform: translateX(0) scale(0.92); }
        18% { opacity: 1; }
        48% { left: 50%; transform: translateX(-50%) scale(1.05); }
        68% { left: 50%; transform: translateX(-50%) scale(1.05) rotate(-2deg); }
        100% { left: 104%; opacity: 0.98; transform: translateX(-50%) scale(0.98); }
      }

      @keyframes csWorkShake {
        from { transform: translateX(-50%) rotate(-1.8deg); }
        to { transform: translateX(-50%) rotate(1.8deg); }
      }

      @keyframes csDustBoom {
        0% { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.6); }
        30% { opacity: 1; transform: translateX(-50%) translateY(-4px) scale(1.08); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-28px) scale(1.35); }
      }

      @keyframes csResultPop {
        0% { transform: translateX(-50%) scale(0); opacity: 0; }
        70% { transform: translateX(-50%) scale(1.1); opacity: 1; }
        100% { transform: translateX(-50%) scale(1); opacity: 1; }
      }

      @keyframes csHousePop {
        0% { transform: translateX(-50%) translateY(30px) scale(0.4); opacity: 0; }
        70% { transform: translateX(-50%) translateY(-5px) scale(1.08); opacity: 1; }
        100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
      }

      @keyframes csShine {
        from { transform: translateX(-120%); }
        to { transform: translateX(120%); }
      }

      @keyframes csWrongWobble {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-9px) rotate(-2deg); }
        40% { transform: translateX(8px) rotate(2deg); }
        60% { transform: translateX(-6px) rotate(-1deg); }
        80% { transform: translateX(4px) rotate(1deg); }
      }

      @keyframes csMessagePop {
        0% { opacity: 0; transform: translateX(-50%) translateY(24px) scale(0.86); }
        18% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.04); }
        78% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.98); }
      }

      @keyframes csSuccessBounce {
        from { transform: translateY(0) rotate(-2deg); }
        to { transform: translateY(-10px) rotate(3deg); }
      }

      @media (max-width: 620px) {
        .cs-top {
          padding: 8px 9px 5px;
        }

        .cs-pill {
          min-height: 44px;
          padding: 7px 12px;
        }

        .cs-btn {
          min-width: 56px;
          min-height: 44px;
          padding: 7px 10px;
          font-size: 15px;
        }

        .cs-question-card {
          margin: 0 9px 7px;
          padding: 9px 10px;
          border-radius: 21px;
          border-width: 4px;
        }

        .cs-stage {
          margin: 0 9px 8px;
          border-radius: 25px;
          border-width: 5px;
        }

        .cs-site-board {
          left: 10px;
          top: 10px;
          min-height: 36px;
          padding: 6px 10px;
          border-width: 3px;
        }

        .cs-choices {
          padding: 0 9px 11px;
          gap: 7px;
        }

        .cs-choice {
          min-height: 104px;
          border-radius: 20px;
          border-width: 4px;
          padding: 7px 5px;
        }

        .cs-success-actions {
          grid-template-columns: 1fr;
        }
      }

      @media (max-height: 610px) {
        .cs-question {
          display: none;
        }

        .cs-question-card {
          padding: 8px 10px;
        }

        .cs-choice {
          min-height: 92px;
        }

        .cs-choice-img {
          max-height: 64px;
        }

        .cs-stage {
          margin-bottom: 7px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function shuffle(list) {
    const copy = Array.isArray(list) ? [...list] : [];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function normalizeVehicle(vehicle, index) {
    if (!vehicle) return null;
    const file = vehicle.file || vehicle.src || vehicle.image || '';
    const name = vehicle.name_ko || vehicle.name || vehicle.id || `공사차${index + 1}`;
    return {
      id: vehicle.id || `${file}-${index}`,
      category: vehicle.category || 'construction',
      file,
      name,
      sound: vehicle.sound_ko || vehicle.sound || name
    };
  }

  async function fetchConstructionVehicles() {
    try {
      const response = await fetch(MANIFEST_URL, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Construction manifest load failed: ${response.status}`);
      const manifest = await response.json();
      const raw = Array.isArray(manifest)
        ? manifest
        : Array.isArray(manifest.vehicles)
          ? manifest.vehicles
          : [];
      const list = raw.map(normalizeVehicle).filter((vehicle) => vehicle && vehicle.file);
      if (list.length < 3) throw new Error('Construction manifest has too few vehicles.');
      return list;
    } catch (error) {
      console.warn(error);
      return FALLBACK_VEHICLES.map(normalizeVehicle).filter((vehicle) => vehicle && vehicle.file);
    }
  }

  function pickMissions() {
    const availableVehicleIds = new Set(state.vehicles.map((vehicle) => vehicle.id));
    const possible = MISSIONS.filter((mission) => mission.answerIds.some((id) => availableVehicleIds.has(id)));
    const source = possible.length >= TOTAL_ROUNDS ? possible : MISSIONS;
    return shuffle(source).slice(0, TOTAL_ROUNDS);
  }

  function getVehicleById(id) {
    return state.vehicles.find((vehicle) => vehicle.id === id) || null;
  }

  function getAnswerVehicle(mission) {
    const availableAnswerId = mission.answerIds.find((id) => getVehicleById(id));
    return getVehicleById(availableAnswerId) || state.vehicles[0] || null;
  }

  function makeChoices(mission) {
    const answer = getAnswerVehicle(mission);
    if (!answer) return [];

    const answerIds = new Set(mission.answerIds);
    const wrongPool = shuffle(state.vehicles.filter((vehicle) => !answerIds.has(vehicle.id)));
    const choices = [answer, ...wrongPool.slice(0, 2)];

    while (choices.length < 3) {
      const extra = state.vehicles.find((vehicle) => !choices.some((choice) => choice.id === vehicle.id));
      if (!extra) break;
      choices.push(extra);
    }

    return shuffle(choices.slice(0, 3));
  }

  function render(container, options = {}) {
    destroy();
    injectStyle();

    state.container = container;
    state.options = options || {};
    state.destroyed = false;
    state.locked = false;
    state.currentRound = 1;
    state.currentMission = null;
    state.currentChoices = [];

    container.innerHTML = `
      <div class="cs-loading">
        <div>🏗️<br>공사장을 준비하고 있어요!</div>
      </div>
    `;

    fetchConstructionVehicles()
      .then((vehicles) => {
        if (state.destroyed || !state.container) return;
        state.vehicles = vehicles;
        state.missions = pickMissions();
        startRound();
      })
      .catch((error) => {
        console.warn(error);
        if (!state.container || state.destroyed) return;
        state.container.innerHTML = `
          <div class="cs-error">
            <div>공사차를 불러오지 못했어요.</div>
          </div>
        `;
      });
  }

  function startRound() {
    if (!state.container) return;

    clearTimers();
    state.locked = false;

    if (state.currentRound > state.missions.length) {
      showCompleteScreen();
      return;
    }

    state.currentMission = state.missions[state.currentRound - 1];
    state.currentChoices = makeChoices(state.currentMission);

    renderGame();
    playGameVoice('games.construction.intro');
    speak(state.currentMission.question, true);
  }

  function renderGame() {
    const mission = state.currentMission;
    if (!mission) return;

    state.container.innerHTML = `
      <div class="cs-root ${escapeAttr(mission.stageClass || '')}">
        <div class="cs-top">
          <div class="cs-pill">🏗️ ${state.currentRound}번 공사</div>
          <div class="cs-actions">
            <button class="cs-btn" type="button" data-action="restart">다시</button>
            <button class="cs-btn" type="button" data-action="home">홈</button>
          </div>
        </div>

        <div class="cs-progress">
          ${state.missions.map((_, index) => `
            <span class="cs-dot ${index + 1 < state.currentRound ? 'done' : index + 1 === state.currentRound ? 'active' : ''}"></span>
          `).join('')}
        </div>

        <div class="cs-question-card">
          <div class="cs-title">${escapeHtml(mission.title)}</div>
          <div class="cs-question">${escapeHtml(mission.question)}</div>
        </div>

        <div class="cs-stage" aria-label="공사장">
          <div class="cs-stage-sky-shine"></div>
          <div class="cs-site-board">🚧 ${escapeHtml(mission.workLabel)}</div>
          <div class="cs-sun"></div>
          <div class="cs-ground"></div>
          <div class="cs-road"></div>

          <div class="cs-target-zone">
            <div class="cs-target-icon">${escapeHtml(mission.targetIcon)}</div>
          </div>

          <div class="cs-result-icon">${escapeHtml(mission.resultIcon)}</div>

          <div class="cs-worker-vehicle" id="csWorkerVehicle"></div>

          <div class="cs-dust">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div class="cs-finish-build">
            <div class="cs-build-roof"></div>
            <div class="cs-build-base"></div>
            <div class="cs-build-door"></div>
          </div>
        </div>

        <div class="cs-choices">
          ${state.currentChoices.map((vehicle) => `
            <button class="cs-choice" type="button" data-id="${escapeAttr(vehicle.id)}" aria-label="${escapeAttr(vehicle.name)}">
              <span class="cs-choice-img-wrap">
                <img class="cs-choice-img" src="./${escapeAttr(vehicle.file)}" alt="${escapeAttr(vehicle.name)}" draggable="false">
                <span class="cs-choice-emoji" hidden>🚜</span>
              </span>
              <span class="cs-choice-name">${escapeHtml(vehicle.name)}</span>
            </button>
          `).join('')}
        </div>

        <div class="cs-message" id="csMessage"></div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    const root = state.container;
    if (!root) return;

    root.querySelector('[data-action="restart"]')?.addEventListener('click', restartGame);
    root.querySelector('[data-action="home"]')?.addEventListener('click', () => {
      state.options.closeToParkHome?.();
    });

    root.querySelectorAll('.cs-choice').forEach((button) => {
      button.addEventListener('click', () => handleChoice(button.dataset.id, button));
    });

    root.querySelectorAll('.cs-choice-img').forEach((img) => {
      img.addEventListener('error', () => {
        img.hidden = true;
        const fallback = img.parentElement?.querySelector('.cs-choice-emoji');
        if (fallback) fallback.hidden = false;
      });
    });
  }

  function handleChoice(vehicleId, button) {
    if (state.locked || !state.currentMission) return;

    const mission = state.currentMission;
    const selectedVehicle = getVehicleById(vehicleId);
    const isCorrect = mission.answerIds.includes(vehicleId);

    if (selectedVehicle) speak(selectedVehicle.sound || selectedVehicle.name, false);

    if (!isCorrect) {
      button.classList.add('is-wrong');
      vibrate([70, 40, 70]);
      playGameVoice('games.common.wrong');
      showMessage(mission.wrongText || '다시 골라볼까?');
      speak(mission.wrongText || '다시 골라볼까?', true);

      setManagedTimeout(() => {
        button.classList.remove('is-wrong');
      }, 520);
      return;
    }

    state.locked = true;
    button.classList.add('is-correct');
    rootDisableChoices();

    playGameVoice('games.common.correct');
    vibrate(180);
    runWorkAnimation(selectedVehicle);
  }

  function rootDisableChoices() {
    state.container?.querySelectorAll('.cs-choice').forEach((el) => {
      el.classList.add('is-disabled');
    });
  }

  function runWorkAnimation(vehicle) {
    const root = state.container?.querySelector('.cs-root');
    const worker = state.container?.querySelector('#csWorkerVehicle');
    const mission = state.currentMission;
    if (!root || !worker || !mission || !vehicle) return;

    worker.innerHTML = `
      <img src="./${escapeAttr(vehicle.file)}" alt="${escapeAttr(vehicle.name)}" draggable="false">
      <span class="cs-worker-fallback" hidden>🚜</span>
    `;

    const img = worker.querySelector('img');
    img?.addEventListener('error', () => {
      img.hidden = true;
      const fallback = worker.querySelector('.cs-worker-fallback');
      if (fallback) fallback.hidden = false;
    });

    root.classList.add('is-working');
    speak(vehicle.sound || mission.successText, true);

    setManagedTimeout(() => {
      root.classList.add('is-success');
      showMessage(mission.successText);
      speak(mission.successText, true);
      state.options.fireConfetti?.();
      state.options.gainExp?.(8);
    }, 1500);

    setManagedTimeout(() => {
      state.currentRound += 1;
      startRound();
    }, 4050);
  }

  function showMessage(text) {
    const message = state.container?.querySelector('#csMessage');
    if (!message) return;
    message.textContent = text;
    message.classList.remove('show');
    void message.offsetWidth;
    message.classList.add('show');
  }

  function showCompleteScreen() {
    if (!state.container) return;

    clearTimers();
    state.locked = true;

    state.options.fireConfetti?.();
    state.options.gainExp?.(25);
    playGameVoice('games.common.complete');
    speak('뚝딱뚝딱! 멋진 공사장이 완성됐어요!', true);

    state.container.innerHTML = `
      <div class="cs-root is-complete">
        <div class="cs-stage" style="flex:1; margin:12px;">
          <div class="cs-stage-sky-shine"></div>
          <div class="cs-site-board">🏁 완성!</div>
          <div class="cs-sun"></div>
          <div class="cs-ground"></div>
          <div class="cs-road"></div>
          <div class="cs-finish-build">
            <div class="cs-build-roof"></div>
            <div class="cs-build-base"></div>
            <div class="cs-build-door"></div>
          </div>
        </div>

        <div class="cs-success-panel">
          <div class="cs-success-box">
            <div class="cs-success-icon">🏗️</div>
            <div class="cs-success-title">공사 완료!</div>
            <div class="cs-success-sub">멋진 공사장을 완성했어요!</div>
            <div class="cs-success-actions">
              <button class="cs-btn" type="button" data-action="restart-complete">다시 하기</button>
              <button class="cs-btn" type="button" data-action="home-complete">놀이터</button>
            </div>
          </div>
        </div>
      </div>
    `;

    state.container.querySelector('[data-action="restart-complete"]')?.addEventListener('click', restartGame);
    state.container.querySelector('[data-action="home-complete"]')?.addEventListener('click', () => {
      state.options.closeToParkHome?.();
    });
  }

  function restartGame() {
    clearTimers();
    state.currentRound = 1;
    state.missions = pickMissions();
    startRound();
  }

  function destroy() {
    clearTimers();
    state.destroyed = true;
    const prev = document.getElementById(STYLE_ID);
    if (prev) prev.remove();
    if (state.container) state.container.innerHTML = '';
    state.container = null;
    state.options = {};
    state.vehicles = [];
    state.missions = [];
    state.currentRound = 1;
    state.currentMission = null;
    state.currentChoices = [];
    state.locked = false;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
