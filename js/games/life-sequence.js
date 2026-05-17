(function () {
  'use strict';

  const GAME_KEY = 'lifeSequence';
  const STYLE_ID = 'sihyeon-life-sequence-style';
  const TOTAL_ROUNDS = 6;

  const MISSIONS = [
    {
      id: 'wash_hands',
      title: '손 씻기',
      guide: '손을 깨끗하게 씻어볼까?',
      completeText: '뽀득뽀득. 손이 깨끗해졌어요.',
      sequenceText: '물을 틀고 비누로 문지르고 수건으로 닦아요.',
      bg: './assets/life-sequence/wash-hands/bg.webp',
      completeImage: './assets/life-sequence/wash-hands/complete.webp',
      sceneEmoji: '🧼',
      completeEmoji: '✨',
      steps: [
        { id: 'water', order: 1, label: '물을 틀어요', shortLabel: '물', emoji: '🚰', image: './assets/life-sequence/wash-hands/step1.webp', effect: '물이 졸졸 나와요.', hint: '먼저 물을 틀어야 해요.' },
        { id: 'soap', order: 2, label: '비누로 문질러요', shortLabel: '비누', emoji: '🫧', image: './assets/life-sequence/wash-hands/step2.webp', effect: '보글보글 거품이 생겼어요.', hint: '비누는 그 다음이에요.' },
        { id: 'towel', order: 3, label: '수건으로 닦아요', shortLabel: '수건', emoji: '🧻', image: './assets/life-sequence/wash-hands/step3.webp', effect: '보송보송 닦았어요.', hint: '수건은 마지막에 써요.' }
      ]
    },
    {
      id: 'brush_teeth',
      title: '양치하기',
      guide: '이를 반짝반짝 닦아볼까?',
      completeText: '반짝반짝. 이가 깨끗해졌어요.',
      sequenceText: '치약을 짜고 이를 쓱쓱 닦고 입을 헹궈요.',
      bg: './assets/life-sequence/brush-teeth/bg.webp',
      completeImage: './assets/life-sequence/brush-teeth/complete.webp',
      sceneEmoji: '🪥',
      completeEmoji: '😁',
      steps: [
        { id: 'paste', order: 1, label: '치약을 짜요', shortLabel: '치약', emoji: '🪥', image: './assets/life-sequence/brush-teeth/step1.webp', effect: '치약을 쭈욱 짰어요.', hint: '먼저 치약을 짜야 해요.' },
        { id: 'brush', order: 2, label: '이를 쓱쓱 닦아요', shortLabel: '쓱쓱', emoji: '🫧', image: './assets/life-sequence/brush-teeth/step2.webp', effect: '쓱쓱 깨끗하게 닦아요.', hint: '이를 닦는 건 그 다음이에요.' },
        { id: 'rinse', order: 3, label: '입을 헹궈요', shortLabel: '헹구기', emoji: '🥛', image: './assets/life-sequence/brush-teeth/step3.webp', effect: '입을 깨끗하게 헹궜어요.', hint: '입 헹구기는 마지막이에요.' }
      ]
    },
    {
      id: 'eat_meal',
      title: '밥 먹기',
      guide: '밥 먹을 준비를 해볼까?',
      completeText: '냠냠. 맛있게 잘 먹었어요.',
      sequenceText: '손을 씻고 자리에 앉고 맛있게 먹어요.',
      bg: './assets/life-sequence/eat-meal/bg.webp',
      completeImage: './assets/life-sequence/eat-meal/complete.webp',
      sceneEmoji: '🍚',
      completeEmoji: '😋',
      steps: [
        { id: 'clean', order: 1, label: '손을 씻어요', shortLabel: '손 씻기', emoji: '🧼', image: './assets/life-sequence/eat-meal/step1.webp', effect: '깨끗한 손이 되었어요.', hint: '밥 먹기 전에는 먼저 손을 씻어요.' },
        { id: 'sit', order: 2, label: '자리에 앉아요', shortLabel: '앉기', emoji: '🪑', image: './assets/life-sequence/eat-meal/step2.webp', effect: '의자에 바르게 앉았어요.', hint: '손을 씻고 나서 자리에 앉아요.' },
        { id: 'eat', order: 3, label: '맛있게 먹어요', shortLabel: '냠냠', emoji: '🍽️', image: './assets/life-sequence/eat-meal/step3.webp', effect: '냠냠 맛있게 먹어요.', hint: '먹는 건 준비가 끝난 뒤예요.' }
      ]
    },
    {
      id: 'sleep_time',
      title: '잠자기',
      guide: '잘 준비를 해볼까?',
      completeText: '코오 잘 자요. 내일 또 놀자!',
      sequenceText: '잠옷을 입고 책을 읽고 불을 끄고 자요.',
      bg: './assets/life-sequence/sleep/bg.webp',
      completeImage: './assets/life-sequence/sleep/complete.webp',
      sceneEmoji: '🌙',
      completeEmoji: '😴',
      steps: [
        { id: 'pajamas', order: 1, label: '잠옷을 입어요', shortLabel: '잠옷', emoji: '👕', image: './assets/life-sequence/sleep/step1.webp', effect: '포근한 잠옷을 입었어요.', hint: '먼저 잠옷을 입어요.' },
        { id: 'book', order: 2, label: '책을 읽어요', shortLabel: '책', emoji: '📖', image: './assets/life-sequence/sleep/step2.webp', effect: '조용히 책을 읽어요.', hint: '책 읽기는 그 다음이에요.' },
        { id: 'light', order: 3, label: '불을 끄고 자요', shortLabel: '잘 자요', emoji: '🛏️', image: './assets/life-sequence/sleep/step3.webp', effect: '불을 끄고 코오 자요.', hint: '자는 건 마지막이에요.' }
      ]
    },
    {
      id: 'go_out',
      title: '외출 준비',
      guide: '밖에 나갈 준비를 해볼까?',
      completeText: '준비 끝. 신나게 나가요.',
      sequenceText: '옷을 입고 신발을 신고 문 밖으로 나가요.',
      bg: './assets/life-sequence/go-out/bg.webp',
      completeImage: './assets/life-sequence/go-out/complete.webp',
      sceneEmoji: '🎒',
      completeEmoji: '🚪',
      steps: [
        { id: 'clothes', order: 1, label: '옷을 입어요', shortLabel: '옷', emoji: '🧥', image: './assets/life-sequence/go-out/step1.webp', effect: '멋진 옷을 입었어요.', hint: '밖에 나가기 전에 먼저 옷을 입어요.' },
        { id: 'shoes', order: 2, label: '신발을 신어요', shortLabel: '신발', emoji: '👟', image: './assets/life-sequence/go-out/step2.webp', effect: '신발을 꼭꼭 신었어요.', hint: '신발은 옷을 입은 다음이에요.' },
        { id: 'door', order: 3, label: '문 밖으로 나가요', shortLabel: '나가기', emoji: '🚪', image: './assets/life-sequence/go-out/step3.webp', effect: '문을 열고 신나게 나가요.', hint: '문 밖으로 나가는 건 마지막이에요.' }
      ]
    },
    {
      id: 'clean_up',
      title: '장난감 정리',
      guide: '놀고 난 뒤 정리해볼까?',
      completeText: '우와. 방이 깨끗해졌어요.',
      sequenceText: '장난감을 모으고 바구니에 넣고 정리해요.',
      bg: './assets/life-sequence/cleanup/bg.webp',
      completeImage: './assets/life-sequence/cleanup/complete.webp',
      sceneEmoji: '🧸',
      completeEmoji: '🏠',
      steps: [
        { id: 'gather', order: 1, label: '장난감을 모아요', shortLabel: '모으기', emoji: '🧩', image: './assets/life-sequence/cleanup/step1.webp', effect: '장난감을 하나씩 모아요.', hint: '먼저 장난감을 모아요.' },
        { id: 'basket', order: 2, label: '바구니에 넣어요', shortLabel: '바구니', emoji: '🧺', image: './assets/life-sequence/cleanup/step2.webp', effect: '바구니에 쏙쏙 넣어요.', hint: '바구니에 넣는 건 그 다음이에요.' },
        { id: 'clean', order: 3, label: '방이 깨끗해져요', shortLabel: '깨끗', emoji: '✨', image: './assets/life-sequence/cleanup/step3.webp', effect: '방이 깨끗해졌어요.', hint: '마지막에는 방이 깨끗해져요.' }
      ]
    }
  ];

  const state = {
    container: null,
    options: {},
    missions: [],
    round: 1,
    mission: null,
    pool: [],
    placed: [],
    locked: false,
    combo: 0,
    timers: [],
    destroyed: false,
    layoutMode: 'portrait',
    resizeTimer: null,
    handleResizeBound: null,
    successRewardGiven: false,
    completeRewardGiven: false
  };

  function injectStyle() {
    const prev = document.getElementById(STYLE_ID);
    if (prev) prev.remove();

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .ls-root{width:100%;height:100%;min-height:0;position:relative;overflow:hidden;color:#233047;background:linear-gradient(180deg,#8fd8ff 0%,#c9f1ff 42%,#fff5c7 100%);font-family:'Arial Rounded MT Bold','Jua','Nanum Gothic',system-ui,sans-serif;user-select:none;touch-action:manipulation;box-sizing:border-box;isolation:isolate}
      .ls-root *{box-sizing:border-box}.ls-root::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 12% 72%,rgba(255,151,199,.3) 0 8%,transparent 8.8%),radial-gradient(circle at 88% 70%,rgba(255,214,80,.35) 0 10%,transparent 10.8%);animation:lsFloat 7s ease-in-out infinite alternate}
      .ls-play-shell{position:relative;z-index:3;width:100%;height:100%;min-height:0;display:flex;flex-direction:column;gap:8px;padding:8px;overflow:hidden}.ls-left-work{min-height:0;display:flex;flex-direction:column;gap:8px;overflow:hidden}.ls-mini-status{flex:0 0 auto;display:flex;align-items:center;justify-content:center;gap:10px;width:min(100%,470px);min-height:50px;margin:0 auto;padding:6px 10px;border-radius:999px;border:4px solid #fff;background:rgba(255,255,255,.9);box-shadow:0 6px 0 rgba(50,70,120,.14);backdrop-filter:blur(8px)}
      .ls-progress{display:flex;align-items:center;justify-content:center;gap:5px;min-width:0}.ls-dot{width:clamp(11px,2.8vw,18px);height:clamp(11px,2.8vw,18px);border-radius:999px;background:rgba(255,255,255,.62);border:2px solid #fff;box-shadow:0 2px 0 rgba(50,70,120,.14);flex:0 0 auto}.ls-dot.done{background:linear-gradient(180deg,#a9ff8b 0%,#25c85c 100%)}.ls-dot.active{background:linear-gradient(180deg,#fff56b 0%,#ff9e2d 100%);transform:scale(1.2)}
      .ls-mission-icon{flex:0 0 auto;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(180deg,#fff 0%,#fff4a8 100%);border:3px solid #fff;box-shadow:0 3px 0 rgba(50,70,120,.12);font-size:26px;line-height:1}.ls-icon-btn{flex:0 0 auto;width:42px;height:42px;border:0;border-radius:50%;display:grid;place-items:center;background:linear-gradient(180deg,#fff 0%,#ffe477 100%);box-shadow:0 4px 0 rgba(50,70,120,.18);font:inherit;font-size:24px;cursor:pointer;-webkit-tap-highlight-color:transparent}.ls-icon-btn:active,.ls-pool-card:active{transform:translateY(4px);box-shadow:0 1px 0 rgba(50,70,120,.18)}
      .ls-scene{position:relative;z-index:5;flex:1 1 auto;min-height:0;border-radius:28px;border:5px solid rgba(255,255,255,.94);overflow:hidden;box-shadow:0 8px 0 rgba(50,70,120,.14),inset 0 5px 0 rgba(255,255,255,.34);background:#fff}.ls-scene-bg,.ls-complete-image{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:.45s ease}.ls-scene-bg{transform:scale(1.03)}.ls-scene.has-bg .ls-scene-bg{opacity:1}.ls-scene.has-complete .ls-complete-image{opacity:1}.ls-fallback{position:absolute;inset:0;display:grid;place-items:center;background:linear-gradient(160deg,#ffe39a 0%,#ffb0d4 48%,#9eeaff 100%)}.ls-scene.has-bg .ls-fallback{opacity:0}.ls-emoji{font-size:clamp(86px,26vw,168px);filter:drop-shadow(0 12px 0 rgba(0,0,0,.12));animation:lsBounce 1.8s ease-in-out infinite alternate}.ls-tint{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,.2));pointer-events:none}.ls-sparkle{position:absolute;inset:0;z-index:6;pointer-events:none;opacity:0;background:radial-gradient(circle at 18% 24%,#fff 0 1.8%,transparent 2.4%),radial-gradient(circle at 78% 28%,#fff68b 0 2.2%,transparent 2.8%),radial-gradient(circle at 35% 70%,#fff 0 1.7%,transparent 2.3%)}.ls-root.complete .ls-sparkle{animation:lsSparkle 1.2s ease-out forwards}.ls-complete-fallback{position:absolute;left:50%;top:50%;z-index:8;width:clamp(116px,34vw,220px);height:clamp(116px,34vw,220px);transform:translate(-50%,-50%) scale(0);border-radius:50%;border:7px solid #fff;background:linear-gradient(180deg,#fff56f 0%,#ff8fc5 100%);box-shadow:0 12px 0 rgba(50,70,120,.16);display:grid;place-items:center;font-size:clamp(58px,17vw,108px)}.ls-root.complete .ls-complete-fallback{animation:lsPop .72s cubic-bezier(.2,1.45,.32,1) forwards}.ls-scene.has-complete .ls-complete-fallback{display:none}
      .ls-slots{position:absolute;left:12px;right:12px;bottom:12px;z-index:12;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.ls-slot{min-height:clamp(76px,18vw,128px);border-radius:20px;border:4px dashed rgba(255,255,255,.96);background:rgba(255,255,255,.42);box-shadow:inset 0 0 18px rgba(255,255,255,.25),0 5px 0 rgba(50,70,120,.11);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}.ls-slot::before{content:attr(data-label);position:absolute;left:8px;top:8px;z-index:5;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.94);border:3px solid #fff;color:#5d4b18;font-size:18px;font-weight:900;box-shadow:0 3px 0 rgba(50,70,120,.12)}.ls-slot.filled{border-style:solid;background:rgba(255,255,255,.78)}.ls-slot.wrong{animation:lsWrong .45s ease-in-out;border-color:#ff9ca8}.ls-slot.correct{border-color:#7ed957;box-shadow:0 6px 0 rgba(34,120,54,.2),0 0 0 5px rgba(126,217,87,.24);animation:lsCheck .48s cubic-bezier(.2,1.45,.32,1)}.ls-slot.correct::after{content:"✓";position:absolute;right:6px;top:6px;z-index:6;width:clamp(26px,7vw,38px);height:clamp(26px,7vw,38px);border-radius:50%;display:grid;place-items:center;background:linear-gradient(180deg,#fff 0%,#9cff86 100%);border:3px solid #fff;color:#168934;font-size:clamp(18px,5vw,28px);font-weight:900}.ls-placeholder{font-size:clamp(36px,9vw,66px);opacity:.72;font-weight:900;color:#fff;text-shadow:0 4px 0 rgba(50,70,120,.18)}
      .ls-slot-card{width:100%;height:100%;min-height:72px;padding:10px 5px 5px;display:grid;place-items:center;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}.ls-card-img{max-width:100%;max-height:100%;width:100%;height:100%;object-fit:contain;border-radius:16px;filter:drop-shadow(0 7px 0 rgba(0,0,0,.12))}.ls-card-emoji{font-size:clamp(42px,10vw,78px);line-height:1}.ls-card-label,.ls-pool-label{display:none!important}
      .ls-pool{position:relative;z-index:10;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;min-height:0}.ls-pool-card{min-width:0;min-height:0;border-radius:22px;border:5px solid #fff;background:linear-gradient(180deg,#fff 0%,#fff1b8 100%);box-shadow:0 8px 0 rgba(50,70,120,.16);cursor:pointer;display:grid;place-items:center;padding:6px;color:#24324a;font:inherit;font-weight:900;position:relative;overflow:hidden;-webkit-tap-highlight-color:transparent}.ls-pool-card.used{opacity:.34;filter:grayscale(.2);pointer-events:none;transform:scale(.95)}.ls-pool-card .ls-card-img{width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;border-radius:18px}.ls-pool-card .ls-card-emoji{font-size:clamp(54px,12vw,104px)}
      .ls-message{position:absolute;left:50%;bottom:clamp(102px,22vw,160px);z-index:40;width:min(88vw,520px);transform:translateX(-50%) translateY(20px) scale(.92);opacity:0;pointer-events:none;padding:14px 16px;border-radius:28px;border:5px solid #fff;background:rgba(255,255,255,.94);box-shadow:0 9px 0 rgba(50,70,120,.16);text-align:center;font-size:clamp(21px,5.8vw,34px);font-weight:900}.ls-message.show{animation:lsMsg 1.35s ease-out forwards}
      .ls-success{position:absolute;inset:0;z-index:80;display:grid;place-items:center;padding:18px;background:rgba(93,197,255,.2);backdrop-filter:blur(4px)}.ls-success-box{width:min(92vw,540px);border-radius:32px;border:7px solid #fff;background:linear-gradient(180deg,#fff 0%,#fff0a6 100%);box-shadow:0 14px 0 rgba(50,70,120,.18);padding:24px 18px 20px;text-align:center;display:grid;gap:14px}.ls-success-icon{font-size:clamp(78px,23vw,132px);animation:lsSuccess 1s ease-in-out infinite alternate}.ls-success-title{font-size:clamp(30px,8vw,46px);font-weight:900}.ls-success-sub{font-size:clamp(17px,4.8vw,24px);font-weight:900;color:#74501c}.ls-success-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.ls-btn{min-height:58px;border-radius:999px;border:4px solid #fff;background:linear-gradient(180deg,#fff 0%,#ffe477 100%);box-shadow:0 6px 0 rgba(50,70,120,.18);font:inherit;font-size:20px;font-weight:900;color:#233047;cursor:pointer}
      @keyframes lsFloat{from{transform:translateX(-8px)}to{transform:translateX(10px) translateY(-6px)}}@keyframes lsBounce{from{transform:translateY(0) rotate(-3deg) scale(1)}to{transform:translateY(-8px) rotate(4deg) scale(1.04)}}@keyframes lsPop{0%{transform:translate(-50%,-50%) scale(0);opacity:0}68%{transform:translate(-50%,-50%) scale(1.12);opacity:1}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}@keyframes lsSparkle{0%{opacity:0;transform:scale(.9)}18%,72%{opacity:1}100%{opacity:0;transform:scale(1.12)}}@keyframes lsWrong{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px) rotate(-2deg)}40%{transform:translateX(7px) rotate(2deg)}60%{transform:translateX(-5px) rotate(-1deg)}80%{transform:translateX(4px) rotate(1deg)}}@keyframes lsCheck{0%{transform:scale(1)}58%{transform:scale(1.08) translateY(-4px)}100%{transform:scale(1)}}@keyframes lsMsg{0%{opacity:0;transform:translateX(-50%) translateY(24px) scale(.86)}18%,78%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}100%{opacity:0;transform:translateX(-50%) translateY(-12px) scale(.98)}}@keyframes lsSuccess{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-10px) rotate(3deg)}}
      .life-sequence-portrait .ls-play-shell{grid-template-rows:auto minmax(0,1fr) auto}.life-sequence-portrait .ls-left-work{order:3;flex:0 0 auto}.life-sequence-portrait .ls-mini-status{order:1;margin-bottom:0}.life-sequence-portrait .ls-scene{order:2;margin:0;min-height:0}.life-sequence-portrait .ls-pool{height:clamp(104px,23vh,150px)}.life-sequence-portrait .ls-pool-card{height:100%}.life-sequence-portrait .ls-slots{left:9px;right:9px;bottom:9px;gap:7px}.life-sequence-portrait .ls-slot{min-height:clamp(74px,18vw,106px);border-width:4px}.life-sequence-portrait .ls-slot-card{padding:7px 4px 4px}.life-sequence-portrait .ls-message{bottom:clamp(116px,26vh,170px)}
      .life-sequence-landscape .ls-play-shell{display:grid;grid-template-columns:minmax(0,48%) minmax(0,52%);grid-template-rows:minmax(0,1fr);gap:10px;padding:10px}.life-sequence-landscape .ls-left-work{height:100%;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:10px}.life-sequence-landscape .ls-mini-status{width:min(100%,520px);min-height:54px}.life-sequence-landscape .ls-pool{height:100%;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.life-sequence-landscape .ls-pool-card{height:100%;border-radius:28px;border-width:6px;padding:8px}.life-sequence-landscape .ls-scene{height:100%;margin:0;border-radius:34px;border-width:6px}.life-sequence-landscape .ls-slots{left:16px;right:16px;bottom:16px;gap:10px}.life-sequence-landscape .ls-slot{min-height:clamp(96px,18vh,150px)}.life-sequence-landscape .ls-message{left:74%;bottom:24px;width:min(42vw,560px)}.life-sequence-landscape .ls-success{grid-column:1 / span 2;grid-row:1}
      @media(orientation:landscape) and (min-width:1024px) and (min-height:640px){.life-sequence-landscape .ls-play-shell{grid-template-columns:minmax(0,48%) minmax(0,52%);gap:14px;padding:14px}.life-sequence-landscape .ls-mini-status{min-height:62px}.life-sequence-landscape .ls-mission-icon,.life-sequence-landscape .ls-icon-btn{width:48px;height:48px;font-size:28px}.life-sequence-landscape .ls-dot{width:17px;height:17px}.life-sequence-landscape .ls-pool{gap:14px}.life-sequence-landscape .ls-pool-card{border-radius:34px;border-width:7px}.life-sequence-landscape .ls-scene{border-radius:42px;border-width:8px}.life-sequence-landscape .ls-slot{min-height:clamp(120px,18vh,168px);border-radius:28px}.life-sequence-landscape .ls-slot::before{width:38px;height:38px;font-size:22px}.life-sequence-landscape .ls-pool-card .ls-card-img{border-radius:24px}}
      @media(orientation:landscape) and (max-height:540px){.life-sequence-landscape .ls-play-shell{grid-template-columns:minmax(0,48%) minmax(0,52%);gap:6px;padding:6px}.life-sequence-landscape .ls-left-work{gap:6px}.life-sequence-landscape .ls-mini-status{width:100%;min-height:38px;padding:4px 7px;gap:6px;border-width:3px}.life-sequence-landscape .ls-dot{width:9px;height:9px;border-width:1px}.life-sequence-landscape .ls-mission-icon,.life-sequence-landscape .ls-icon-btn{width:30px;height:30px;font-size:18px;border-width:2px}.life-sequence-landscape .ls-pool{gap:6px}.life-sequence-landscape .ls-pool-card{border-radius:16px;border-width:3px;padding:4px;box-shadow:0 4px 0 rgba(50,70,120,.16)}.life-sequence-landscape .ls-scene{border-radius:18px;border-width:3px;box-shadow:0 4px 0 rgba(50,70,120,.14)}.life-sequence-landscape .ls-slots{left:7px;right:7px;bottom:7px;gap:5px}.life-sequence-landscape .ls-slot{min-height:58px;border-width:3px;border-radius:14px}.life-sequence-landscape .ls-slot::before{left:5px;top:5px;width:23px;height:23px;font-size:13px;border-width:2px}.life-sequence-landscape .ls-placeholder{font-size:30px}.life-sequence-landscape .ls-message{bottom:12px;width:min(44vw,390px);font-size:18px;padding:9px;border-width:3px}}
      @media(max-width:620px) and (orientation:portrait){.ls-play-shell{padding:7px;gap:7px}.ls-mini-status{width:100%;min-height:46px;padding:5px 8px;gap:8px;border-width:3px}.ls-mission-icon,.ls-icon-btn{width:36px;height:36px;font-size:21px}.ls-dot{width:12px;height:12px}.ls-scene{border-radius:24px;border-width:5px}.ls-pool{height:clamp(96px,21vh,132px);gap:7px}.ls-pool-card{border-radius:18px;border-width:4px;padding:5px;box-shadow:0 5px 0 rgba(50,70,120,.16)}.ls-slots{left:7px;right:7px;bottom:7px;gap:6px}.ls-slot{min-height:70px;border-radius:16px;border-width:3px}.ls-slot::before{left:5px;top:5px;width:24px;height:24px;font-size:14px;border-width:2px}.ls-placeholder{font-size:32px}.ls-success-actions{grid-template-columns:1fr}.ls-message{font-size:22px;border-width:4px}}
      @media(max-height:610px) and (orientation:portrait){.life-sequence-portrait .ls-pool{height:96px}.life-sequence-portrait .ls-slot{min-height:62px}.ls-mini-status{min-height:40px}.ls-mission-icon,.ls-icon-btn{width:32px;height:32px;font-size:19px}.ls-dot{width:10px;height:10px}}
    `;
    document.head.appendChild(style);
  }

  function playGameVoice(id) {
    const missionId = state.mission?.id || 'wash_hands';
    const missionMap = {
      wash_hands: { intro: 'games.sequence.handIntro', complete: 'games.sequence.handComplete' },
      brush_teeth: { intro: 'games.sequence.teethIntro', complete: 'games.sequence.teethComplete' },
      eat_meal: { intro: 'games.sequence.mealIntro', complete: 'games.sequence.mealComplete' },
      sleep_time: { intro: 'games.sequence.sleepIntro', complete: 'games.sequence.sleepComplete' },
      go_out: { intro: 'games.sequence.outIntro', complete: 'games.sequence.outComplete' },
      clean_up: { intro: 'games.sequence.cleanIntro', complete: 'games.sequence.cleanComplete' }
    };
    const missionVoice = missionMap[missionId] || missionMap.wash_hands;
    const aliases = {
      'games.life.intro': missionVoice.intro,
      'games.common.wrong': 'games.sequence.wrong',
      'games.common.correct': missionVoice.complete,
      'games.common.complete': 'games.sequence.complete'
    };
    if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      window.SihyeonVoice.play(aliases[id] || id).catch(() => {});
    }
  }

  function speak(text, force) {
    if (!text) return;
  }

  function vibrate(pattern) {
    if (!navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (error) {}
  }

  function timer(fn, ms) {
    const id = setTimeout(() => {
      state.timers = state.timers.filter((timerId) => timerId !== id);
      if (!state.destroyed) fn();
    }, ms);
    state.timers.push(id);
    return id;
  }

  function clearTimers() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
  }

  function isLandscapeMode() {
    try {
      return window.matchMedia('(orientation: landscape) and (min-width: 640px)').matches;
    } catch (error) {
      return window.innerWidth >= 640 && window.innerWidth > window.innerHeight;
    }
  }

  function getLayoutMode() {
    return isLandscapeMode() ? 'landscape' : 'portrait';
  }

  function getRootLayoutClass() {
    const mode = getLayoutMode();
    state.layoutMode = mode;
    return `life-sequence-root life-sequence-${mode}`;
  }

  function applyRootLayoutClass() {
    const root = state.container?.querySelector('.ls-root');
    if (!root) return;
    root.classList.remove('life-sequence-portrait', 'life-sequence-landscape');
    root.classList.add('life-sequence-root', `life-sequence-${getLayoutMode()}`);
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

  function handleResize() {
    if (state.destroyed || !state.container) return;
    if (state.resizeTimer) clearTimeout(state.resizeTimer);
    state.resizeTimer = setTimeout(() => {
      state.resizeTimer = null;
      refreshLayoutOnly();
    }, 120);
  }

  function refreshLayoutOnly() {
    if (state.destroyed || !state.container) return;
    state.layoutMode = getLayoutMode();
    applyRootLayoutClass();
  }

  function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function render(container, options = {}) {
    destroy();
    injectStyle();
    state.container = container;
    state.options = options || {};
    state.destroyed = false;
    state.locked = false;
    state.round = 1;
    state.combo = 0;
    state.layoutMode = getLayoutMode();
    state.successRewardGiven = false;
    state.completeRewardGiven = false;
    state.missions = shuffle(MISSIONS).slice(0, TOTAL_ROUNDS);
    bindResizeEvents();
    startRound();
  }

  function startRound() {
    if (!state.container) return;
    clearTimers();
    state.locked = false;
    if (state.round > state.missions.length) {
      showComplete();
      return;
    }
    state.mission = state.missions[state.round - 1];
    state.pool = shuffle(state.mission.steps.map((step) => ({ ...step })));
    state.placed = new Array(state.mission.steps.length).fill(null);
    state.successRewardGiven = false;
    draw();
    playGameVoice('games.life.intro');
    speak(state.mission.guide, true);
  }

  function draw() {
    const mission = state.mission;
    if (!mission || !state.container) return;

    state.container.innerHTML = `
      <div class="ls-root ${getRootLayoutClass()}">
        <div class="ls-play-shell">
          <section class="ls-left-work">
            <div class="ls-mini-status" aria-label="진행 상태">
              <div class="ls-progress">
                ${state.missions.map((_, index) => `<span class="ls-dot ${index + 1 < state.round ? 'done' : index + 1 === state.round ? 'active' : ''}"></span>`).join('')}
              </div>
              <div class="ls-mission-icon" aria-label="${escapeAttr(mission.title)}">${escapeHtml(mission.sceneEmoji)}</div>
              <button class="ls-icon-btn" data-action="restart" type="button" aria-label="다시 하기">🔄</button>
            </div>
            <div class="ls-pool">${state.pool.map(renderPoolCard).join('')}</div>
          </section>
          <section class="ls-scene" id="lsScene">
            <div class="ls-fallback"><div class="ls-emoji">${escapeHtml(mission.sceneEmoji)}</div></div>
            <div class="ls-scene-bg" style="background-image:url('${escapeAttr(mission.bg)}')"></div>
            <div class="ls-complete-image" style="background-image:url('${escapeAttr(mission.completeImage)}')"></div>
            <div class="ls-tint"></div>
            <div class="ls-sparkle"></div>
            <div class="ls-complete-fallback">${escapeHtml(mission.completeEmoji)}</div>
            <div class="ls-slots">${state.placed.map(renderSlot).join('')}</div>
          </section>
          <div class="ls-message" id="lsMessage"></div>
        </div>
      </div>
    `;

    bindEvents();
    bindImageFallbacks();
  }

  function renderVisual(card) {
    return `<img class="ls-card-img" src="${escapeAttr(card.image)}" alt="${escapeAttr(card.label)}" draggable="false"><span class="ls-card-emoji" hidden>${escapeHtml(card.emoji || '✨')}</span>`;
  }

  function renderSlot(card, index) {
    return `
      <div class="ls-slot ${card ? 'filled' : ''}" data-slot="${index}" data-label="${index + 1}">
        ${card ? `<button class="ls-slot-card" type="button" data-remove="${index}" aria-label="${escapeAttr(card.label)}">${renderVisual(card)}</button>` : `<div class="ls-placeholder">${index + 1}</div>`}
      </div>
    `;
  }

  function renderPoolCard(card) {
    const used = state.placed.some((placedCard) => placedCard && placedCard.id === card.id);
    return `
      <button class="ls-pool-card ${used ? 'used' : ''}" type="button" data-card="${escapeAttr(card.id)}" aria-label="${escapeAttr(card.label)}">
        ${renderVisual(card)}
      </button>
    `;
  }

  function bindEvents() {
    const root = state.container;
    if (!root) return;

    root.querySelector('[data-action="restart"]')?.addEventListener('click', restart);

    root.querySelectorAll('[data-card]').forEach((button) => {
      button.addEventListener('click', () => placeCard(button.dataset.card));
    });

    root.querySelectorAll('[data-remove]').forEach((button) => {
      button.addEventListener('click', () => removeCard(Number(button.dataset.remove)));
    });

    root.querySelectorAll('[data-slot]').forEach((slot) => {
      slot.addEventListener('click', (event) => {
        if (event.target.closest('[data-remove]')) return;
        const index = Number(slot.dataset.slot);
        if (state.placed[index]) removeCard(index);
      });
    });
  }

  function bindImageFallbacks() {
    const root = state.container;
    const scene = root?.querySelector('#lsScene');

    if (scene && state.mission) {
      const bg = new Image();
      bg.onload = () => scene.classList.add('has-bg');
      bg.onerror = () => scene.classList.remove('has-bg');
      bg.src = state.mission.bg;

      const complete = new Image();
      complete.onload = () => { scene.dataset.complete = '1'; };
      complete.onerror = () => { scene.dataset.complete = '0'; };
      complete.src = state.mission.completeImage;
    }

    root?.querySelectorAll('.ls-card-img').forEach((img) => {
      img.addEventListener('error', () => {
        img.hidden = true;
        const fallback = img.parentElement?.querySelector('.ls-card-emoji');
        if (fallback) fallback.hidden = false;
      });
    });
  }

  function placeCard(cardId) {
    if (state.locked) return;
    const card = state.pool.find((item) => item.id === cardId);
    if (!card || state.placed.some((item) => item && item.id === cardId)) return;

    const index = state.placed.findIndex((item) => !item);
    if (index < 0) return;

    state.placed[index] = card;
    speak(card.effect || card.label, false);
    vibrate(40);
    draw();

    if (state.placed.every(Boolean)) timer(checkAnswer, 280);
  }

  function removeCard(index) {
    if (state.locked || !state.placed[index]) return;
    state.placed[index] = null;
    vibrate(25);
    draw();
  }

  function checkAnswer() {
    const wrong = [];
    state.placed.forEach((card, index) => {
      if (!card || Number(card.order) !== index + 1) wrong.push(index);
    });
    wrong.length ? handleWrong(wrong) : handleCorrect();
  }

  function handleWrong(wrongIndexes) {
    if (!state.container || !state.mission) return;

    state.combo = 0;
    vibrate([70, 40, 70]);
    playGameVoice('games.common.wrong');

    wrongIndexes.forEach((index) => {
      state.container.querySelector(`[data-slot="${index}"]`)?.classList.add('wrong');
    });

    const expected = state.mission.steps.find((step) => Number(step.order) === wrongIndexes[0] + 1);
    const text = expected?.hint || '괜찮아. 순서가 조금 달라요. 다시 해볼까?';

    showMessage(text);
    speak(text, true);

    timer(() => {
      wrongIndexes.forEach((index) => { state.placed[index] = null; });
      draw();
    }, 1150);
  }

  function handleCorrect() {
    if (!state.container || !state.mission) return;

    state.locked = true;
    state.combo += 1;
    vibrate(180);

    const slots = Array.from(state.container.querySelectorAll('.ls-slot'));
    slots.forEach((slot, index) => {
      timer(() => {
        const card = state.placed[index];
        slot.classList.add('correct');
        if (card) speak(card.label, false);
      }, index * 360);
    });

    const delay = slots.length * 360 + 300;
    timer(() => {
      const root = state.container?.querySelector('.ls-root');
      const scene = state.container?.querySelector('#lsScene');

      root?.classList.add('complete');
      if (scene && scene.dataset.complete === '1') scene.classList.add('has-complete');

      const comboText = state.combo >= 2 ? ` ${state.combo}번 연속 성공!` : '';
      const sequenceText = state.mission.sequenceText ? ` ${state.mission.sequenceText}` : '';
      const message = `${state.mission.completeText} ${sequenceText}${comboText}`.replace(/\s+/g, ' ').trim();

      showMessage(message);
      speak(message, true);
      if (!state.successRewardGiven) {
        state.successRewardGiven = true;
        playGameVoice('games.common.correct');
        state.options.fireConfetti?.();
        state.options.gainExp?.(10 + Math.min(state.combo, 3) * 2);
      }

      timer(() => {
        state.round += 1;
        startRound();
      }, getSuccessMessageHoldMs(message));
    }, delay);
  }

  function getSuccessMessageHoldMs(message) {
    const baseTime = 6000;
    const extraTime = String(message || '').length * 80;
    return Math.min(12000, baseTime + extraTime);
  }

  function showMessage(text) {
    const message = state.container?.querySelector('#lsMessage');
    if (!message) return;

    message.textContent = text;
    message.classList.remove('show');
    void message.offsetWidth;
    message.classList.add('show');
  }

  function showComplete() {
    if (!state.container) return;

    clearTimers();
    state.locked = true;
    if (!state.completeRewardGiven) {
      state.completeRewardGiven = true;
      state.options.fireConfetti?.();
      state.options.gainExp?.(30);
      playGameVoice('games.common.complete');
      speak('차례차례 모두 해냈어요. 정말 멋져요!', true);
    }

    state.container.innerHTML = `
      <div class="ls-root ${getRootLayoutClass()}">
        <div class="ls-scene" style="flex:1;margin:12px">
          <div class="ls-fallback"><div class="ls-emoji">🌈</div></div>
          <div class="ls-tint"></div>
          <div class="ls-sparkle" style="animation:lsSparkle 1.2s ease-out forwards"></div>
          <div class="ls-complete-fallback" style="animation:lsPop .72s cubic-bezier(.2,1.45,.32,1) forwards">🏆</div>
        </div>
        <div class="ls-success">
          <div class="ls-success-box">
            <div class="ls-success-icon">🌈</div>
            <div class="ls-success-title">하루놀이 완료!</div>
            <div class="ls-success-sub">순서를 아주 잘 맞췄어요!</div>
            <div class="ls-success-actions">
              <button class="ls-btn" type="button" data-restart>🔄</button>
              <button class="ls-btn" type="button" data-home>🏠</button>
            </div>
          </div>
        </div>
      </div>
    `;

    state.container.querySelector('[data-restart]')?.addEventListener('click', restart);
    state.container.querySelector('[data-home]')?.addEventListener('click', () => state.options.closeToParkHome?.());
  }

  function restart() {
    clearTimers();
    state.round = 1;
    state.combo = 0;
    state.successRewardGiven = false;
    state.completeRewardGiven = false;
    state.missions = shuffle(MISSIONS).slice(0, TOTAL_ROUNDS);
    startRound();
  }

  function destroy() {
    clearTimers();
    if (state.resizeTimer) {
      clearTimeout(state.resizeTimer);
      state.resizeTimer = null;
    }
    unbindResizeEvents();
    state.destroyed = true;
    const prev = document.getElementById(STYLE_ID);
    if (prev) prev.remove();
    if (state.container) state.container.innerHTML = '';
    state.container = null;
    state.options = {};
    state.missions = [];
    state.round = 1;
    state.mission = null;
    state.pool = [];
    state.placed = [];
    state.locked = false;
    state.combo = 0;
    state.layoutMode = 'portrait';
    state.successRewardGiven = false;
    state.completeRewardGiven = false;
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
