/* ═══════════════════════════════════════════
   SIHYEON PLAY OS - LETTER TRANSFORM
   파일: js/games/abc-phonics.js
   설명: ABC 변신 + 한글 변신 통합 탭형 게임
═══════════════════════════════════════════ */

(function () {
  const GAME_KEY = 'abcPhonics';
  const ALIAS_KEY = 'letterTransform';
  const STYLE_ID = 'sihyeon-letter-transform-style';

  const DATASETS = {
    abc: {
      key: 'abc',
      label: 'ABC',
      title: 'ABC 변신',
      intro: 'ABC 글자가 장난감으로 변신해요!',
      completeTitle: 'ABC 변신 완료!',
      completeVoice: 'Wonderful! Great job!',
      completeExp: 20,
      bg: ['#FFF7D6', '#E8F7FF'],
      items: [
        {
          letter: 'A',
          letterName: 'A',
          phonics: '애, 애',
          word: 'Apple',
          wordVoice: 'Apple!',
          displayWord: 'Apple',
          color: '#FF3B3B',
          fallbackLetter: 'A',
          fallbackObject: '🍎',
          letterImg: './assets/abc-phonics/tiles/a.png',
          objectImg: './assets/abc-phonics/tiles/apple.png'
        },
        {
          letter: 'B',
          letterName: 'B',
          phonics: '브, 브',
          word: 'Ball',
          wordVoice: 'Ball!',
          displayWord: 'Ball',
          color: '#1E90FF',
          fallbackLetter: 'B',
          fallbackObject: '🏀',
          letterImg: './assets/abc-phonics/tiles/b.png',
          objectImg: './assets/abc-phonics/tiles/ball.png'
        },
        {
          letter: 'C',
          letterName: 'C',
          phonics: '크, 크',
          word: 'Car',
          wordVoice: 'Car!',
          displayWord: 'Car',
          color: '#FFC107',
          fallbackLetter: 'C',
          fallbackObject: '🚗',
          letterImg: './assets/abc-phonics/tiles/c.png',
          objectImg: './assets/abc-phonics/tiles/car.png'
        }
      ]
    },

    hangul: {
      key: 'hangul',
      label: '한글',
      title: '한글 변신',
      intro: '한글 친구들이 귀여운 그림으로 변신해요!',
      completeTitle: '한글 변신 완료!',
      completeVoice: '우와! 한글 친구들을 모두 만났어요!',
      completeExp: 30,
      bg: ['#FFE6F3', '#FFF7C9'],
      items: [
        {
          letter: 'ㄱ',
          letterName: '기역',
          phonics: '그, 그',
          word: '가방',
          wordVoice: '가, 가, 가방!',
          displayWord: '가방',
          color: '#FF4D4D',
          fallbackLetter: 'ㄱ',
          fallbackObject: '🎒',
          letterImg: './assets/letter-transform/hangul/giyeok.png',
          objectImg: './assets/letter-transform/hangul/bag.png'
        },
        {
          letter: 'ㄴ',
          letterName: '니은',
          phonics: '느, 느',
          word: '나비',
          wordVoice: '나, 나, 나비!',
          displayWord: '나비',
          color: '#FF9F1C',
          fallbackLetter: 'ㄴ',
          fallbackObject: '🦋',
          letterImg: './assets/letter-transform/hangul/nieun.png',
          objectImg: './assets/letter-transform/hangul/butterfly.png'
        },
        {
          letter: 'ㄷ',
          letterName: '디귿',
          phonics: '드, 드',
          word: '도토리',
          wordVoice: '도, 도, 도토리!',
          displayWord: '도토리',
          color: '#8B5CF6',
          fallbackLetter: 'ㄷ',
          fallbackObject: '🌰',
          letterImg: './assets/letter-transform/hangul/digeut.png',
          objectImg: './assets/letter-transform/hangul/acorn.png'
        },
        {
          letter: 'ㄹ',
          letterName: '리을',
          phonics: '르, 르',
          word: '로봇',
          wordVoice: '로, 로, 로봇!',
          displayWord: '로봇',
          color: '#00AEEF',
          fallbackLetter: 'ㄹ',
          fallbackObject: '🤖',
          letterImg: './assets/letter-transform/hangul/rieul.png',
          objectImg: './assets/letter-transform/hangul/robot.png'
        },
        {
          letter: 'ㅁ',
          letterName: '미음',
          phonics: '므, 므',
          word: '모자',
          wordVoice: '모, 모, 모자!',
          displayWord: '모자',
          color: '#2EC4B6',
          fallbackLetter: 'ㅁ',
          fallbackObject: '🧢',
          letterImg: './assets/letter-transform/hangul/mieum.png',
          objectImg: './assets/letter-transform/hangul/hat.png'
        },
        {
          letter: 'ㅂ',
          letterName: '비읍',
          phonics: '브, 브',
          word: '바나나',
          wordVoice: '바, 바, 바나나!',
          displayWord: '바나나',
          color: '#FFD93D',
          fallbackLetter: 'ㅂ',
          fallbackObject: '🍌',
          letterImg: './assets/letter-transform/hangul/bieup.png',
          objectImg: './assets/letter-transform/hangul/banana.png'
        },
        {
          letter: 'ㅅ',
          letterName: '시옷',
          phonics: '스, 스',
          word: '사자',
          wordVoice: '사, 사, 사자!',
          displayWord: '사자',
          color: '#FF7A1A',
          fallbackLetter: 'ㅅ',
          fallbackObject: '🦁',
          letterImg: './assets/letter-transform/hangul/siot.png',
          objectImg: './assets/letter-transform/hangul/lion.png'
        },
        {
          letter: 'ㅇ',
          letterName: '이응',
          phonics: '으, 으',
          word: '오리',
          wordVoice: '오, 오, 오리!',
          displayWord: '오리',
          color: '#5BC8F5',
          fallbackLetter: 'ㅇ',
          fallbackObject: '🦆',
          letterImg: './assets/letter-transform/hangul/ieung.png',
          objectImg: './assets/letter-transform/hangul/duck.png'
        },
        {
          letter: 'ㅈ',
          letterName: '지읒',
          phonics: '즈, 즈',
          word: '자동차',
          wordVoice: '자, 자, 자동차!',
          displayWord: '자동차',
          color: '#3478F6',
          fallbackLetter: 'ㅈ',
          fallbackObject: '🚗',
          letterImg: './assets/letter-transform/hangul/jieut.png',
          objectImg: './assets/letter-transform/hangul/car.png'
        }
      ]
    }
  };

  const state = {
    container: null,
    options: {},
    mode: 'abc',
    currentIndex: 0,
    isTransforming: false,
    destroyed: false,
    timers: []
  };

  function timer(fn, ms) {
    const id = setTimeout(() => {
      state.timers = state.timers.filter((timerId) => timerId !== id);
      if (!state.destroyed) fn();
    }, ms);
    state.timers.push(id);
    return id;
  }

  function clearTimers() {
    state.timers.forEach((id) => clearTimeout(id));
    state.timers = [];
  }

  function getDataset() {
    return DATASETS[state.mode] || DATASETS.abc;
  }

  function getItems() {
    return getDataset().items || [];
  }

  function getCurrentItem() {
    return getItems()[state.currentIndex] || getItems()[0];
  }

  function injectStyle() {
    const prev = document.getElementById(STYLE_ID);
    if (prev) prev.remove();

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .lt-root {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        font-family: 'Jua', 'Apple SD Gothic Neo', system-ui, sans-serif;
        color: #24324a;
        background: linear-gradient(180deg, #fff7d6 0%, #e8f7ff 100%);
        user-select: none;
        touch-action: manipulation;
        isolation: isolate;
        transition: background 0.45s ease, opacity 0.28s ease;
      }

      .lt-root::before {
        content: "";
        position: absolute;
        inset: -40px;
        z-index: 0;
        pointer-events: none;
        background:
          radial-gradient(circle at 18% 18%, rgba(255,255,255,.65) 0 8%, transparent 9%),
          radial-gradient(circle at 82% 22%, rgba(255,217,61,.28) 0 9%, transparent 10%),
          radial-gradient(circle at 15% 80%, rgba(255,122,26,.16) 0 10%, transparent 11%),
          radial-gradient(circle at 86% 78%, rgba(91,200,245,.22) 0 11%, transparent 12%);
        animation: ltBgFloat 8s ease-in-out infinite alternate;
      }

      @keyframes ltBgFloat {
        from { transform: translate3d(-8px, 4px, 0) scale(1); }
        to   { transform: translate3d(10px, -8px, 0) scale(1.02); }
      }

      .lt-top {
        position: relative;
        z-index: 10;
        flex-shrink: 0;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 10px;
        padding: max(10px, env(safe-area-inset-top)) 12px 8px;
      }

      .lt-mode-tabs {
        display: inline-grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 7px;
        min-width: 178px;
        padding: 5px;
        border-radius: 999px;
        background: rgba(255,255,255,.62);
        border: 3px solid rgba(255,255,255,.9);
        box-shadow: 0 5px 0 rgba(0,0,0,.11);
      }

      .lt-mode-tab {
        min-height: 40px;
        padding: 0 13px;
        border-radius: 999px;
        border: 0;
        background: transparent;
        color: #24324a;
        font: inherit;
        font-size: clamp(15px, 3.8vw, 18px);
        font-weight: 900;
        cursor: pointer;
        touch-action: manipulation;
      }

      .lt-mode-tab.active {
        background: linear-gradient(180deg, #ffffff 0%, #ffe577 100%);
        box-shadow: 0 4px 0 rgba(200,140,0,.2), inset 0 2px 0 rgba(255,255,255,.7);
      }

      .lt-progress {
        justify-self: center;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: clamp(5px, 1.8vw, 9px);
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
      }

      .lt-dot {
        width: clamp(11px, 3vw, 18px);
        height: clamp(11px, 3vw, 18px);
        flex: 0 0 auto;
        border-radius: 999px;
        background: rgba(255,255,255,.66);
        border: 3px solid rgba(255,255,255,.95);
        box-shadow: 0 3px 0 rgba(0,0,0,.11);
        transition: transform .25s ease, background .25s ease, box-shadow .25s ease;
      }

      .lt-dot.done {
        background: linear-gradient(180deg, #a9ff8b 0%, #25c85c 100%);
      }

      .lt-dot.active {
        transform: scale(1.22);
        background: var(--lt-color, #ff7a1a);
        box-shadow: 0 0 0 5px rgba(255,122,26,.18), 0 3px 0 rgba(0,0,0,.11);
      }

      .lt-home-btn {
        justify-self: end;
        min-width: 50px;
        min-height: 50px;
        border-radius: 999px;
        background: rgba(255,255,255,.9);
        border: 4px solid #fff;
        box-shadow: 0 6px 0 rgba(0,0,0,.14);
        font-size: 25px;
        cursor: pointer;
        touch-action: manipulation;
      }

      .lt-home-btn:active,
      .lt-mode-tab:active,
      .lt-main-card:active,
      .lt-btn:active {
        transform: translateY(4px);
        box-shadow: 0 2px 0 rgba(0,0,0,.14);
      }

      .lt-title-wrap {
        position: relative;
        z-index: 8;
        flex-shrink: 0;
        text-align: center;
        padding: 0 14px 8px;
      }

      .lt-title {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 6px 18px;
        border-radius: 999px;
        background: rgba(255,255,255,.84);
        border: 4px solid rgba(255,255,255,.95);
        box-shadow: 0 6px 0 rgba(0,0,0,.11);
        font-size: clamp(20px, 5vw, 30px);
        font-weight: 900;
        line-height: 1.1;
      }

      .lt-stage {
        position: relative;
        z-index: 5;
        flex: 1;
        min-height: 0;
        display: grid;
        place-items: center;
        padding: 4px 14px 10px;
      }

      .lt-stage-inner {
        position: relative;
        width: min(94vw, 560px);
        height: 100%;
        min-height: 0;
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        align-items: center;
        justify-items: center;
        gap: 8px;
      }

      .lt-main-card {
        position: relative;
        width: min(86vw, 420px);
        height: min(53dvh, 430px);
        min-height: 300px;
        border-radius: 36px;
        border: 7px solid rgba(255,255,255,.96);
        background:
          radial-gradient(circle at 50% 20%, rgba(255,255,255,.75), transparent 42%),
          linear-gradient(180deg, rgba(255,255,255,.94) 0%, rgba(255,246,199,.92) 100%);
        box-shadow:
          0 15px 0 rgba(0,0,0,.14),
          0 24px 42px rgba(0,0,0,.16),
          inset 0 4px 0 rgba(255,255,255,.75);
        display: grid;
        place-items: center;
        overflow: hidden;
        cursor: pointer;
        touch-action: manipulation;
        transition: transform .15s ease, box-shadow .15s ease;
      }

      .lt-main-card::before {
        content: "";
        position: absolute;
        inset: 16px;
        border-radius: 26px;
        border: 4px dashed rgba(255,255,255,.75);
        pointer-events: none;
      }

      .lt-main-card::after {
        content: "";
        position: absolute;
        left: -20%;
        top: -20%;
        width: 70%;
        height: 70%;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,.58), transparent 68%);
        pointer-events: none;
      }

      .lt-image-wrap {
        position: relative;
        z-index: 4;
        width: 86%;
        height: 82%;
        display: grid;
        place-items: center;
        animation: ltFloat 3s ease-in-out infinite;
      }

      @keyframes ltFloat {
        0%,100% { transform: translateY(0) rotate(-1deg); }
        50%     { transform: translateY(-12px) rotate(1deg); }
      }

      .lt-display-img {
        display: block;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 16px 0 rgba(0,0,0,.12)) drop-shadow(0 22px 22px rgba(0,0,0,.12));
        transition: transform .35s cubic-bezier(.2,1.35,.35,1), opacity .25s ease;
      }

      .lt-fallback-letter,
      .lt-fallback-object {
        width: min(64vw, 300px);
        height: min(64vw, 300px);
        max-height: 78%;
        border-radius: 40px;
        display: none;
        place-items: center;
        font-weight: 900;
        line-height: 1;
        color: #fff;
        background:
          radial-gradient(circle at 30% 22%, rgba(255,255,255,.45), transparent 28%),
          linear-gradient(145deg, var(--lt-color, #ff7a1a) 0%, rgba(0,0,0,.14) 130%);
        box-shadow: inset 0 5px 0 rgba(255,255,255,.4), 0 14px 0 rgba(0,0,0,.12);
        text-shadow: 0 5px 0 rgba(0,0,0,.18);
      }

      .lt-fallback-letter {
        font-size: clamp(130px, 36vw, 230px);
      }

      .lt-fallback-object {
        font-size: clamp(120px, 34vw, 210px);
        background: linear-gradient(180deg, #fff 0%, #fff3bd 100%);
        color: #24324a;
      }

      .lt-image-missing .lt-display-img {
        display: none;
      }

      .lt-image-missing .lt-fallback-letter,
      .lt-image-missing .lt-fallback-object {
        display: grid;
      }

      .lt-transformed .lt-image-wrap {
        animation: ltTransformPop .75s cubic-bezier(.2,1.45,.32,1) both;
      }

      @keyframes ltTransformPop {
        0%   { transform: scale(.35) rotate(-18deg); opacity: 0; }
        55%  { transform: scale(1.14) rotate(6deg); opacity: 1; }
        100% { transform: scale(1) rotate(0); opacity: 1; }
      }

      .lt-word-label {
        position: relative;
        z-index: 7;
        min-height: 58px;
        padding: 6px 22px;
        border-radius: 999px;
        background: rgba(255,255,255,.9);
        border: 4px solid #fff;
        box-shadow: 0 6px 0 rgba(0,0,0,.12);
        display: grid;
        place-items: center;
        opacity: 0;
        transform: translateY(16px);
        color: #24324a;
        font-size: clamp(34px, 10vw, 70px);
        font-weight: 900;
        line-height: 1;
        pointer-events: none;
      }

      .lt-word-label.show {
        animation: ltLabelIn .5s cubic-bezier(.2,1.35,.35,1) forwards;
      }

      @keyframes ltLabelIn {
        to { opacity: 1; transform: translateY(0); }
      }

      .lt-hint {
        position: relative;
        z-index: 10;
        min-height: 54px;
        padding: 8px 28px;
        border-radius: 999px;
        background: rgba(255,255,255,.88);
        border: 4px solid #fff;
        box-shadow: 0 6px 0 rgba(0,0,0,.12);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #24324a;
        font-size: clamp(20px, 5.6vw, 30px);
        font-weight: 900;
        opacity: 0;
        transform: translateY(12px);
        transition: opacity .25s ease, transform .25s ease;
        pointer-events: none;
      }

      .lt-hint.visible {
        opacity: 1;
        transform: translateY(0);
        animation: ltHintPulse 1.1s ease-in-out infinite alternate;
      }

      @keyframes ltHintPulse {
        from { scale: 1; }
        to   { scale: 1.045; }
      }

      .lt-particle {
        position: absolute;
        z-index: 30;
        width: 18px;
        height: 18px;
        border-radius: 999px;
        background: var(--lt-color, #ff7a1a);
        pointer-events: none;
        animation: ltExplode .86s ease-out forwards;
      }

      @keyframes ltExplode {
        0%   { transform: translate(0,0) scale(1); opacity: 1; }
        100% { transform: translate(var(--tx), var(--ty)) scale(.05); opacity: 0; }
      }

      .lt-star {
        position: absolute;
        z-index: 32;
        pointer-events: none;
        font-size: clamp(22px, 6vw, 40px);
        animation: ltStarPop .92s ease-out forwards;
      }

      @keyframes ltStarPop {
        0%   { transform: translate(-50%,-50%) scale(.2) rotate(-20deg); opacity: 0; }
        40%  { opacity: 1; }
        100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.2) rotate(30deg); opacity: 0; }
      }

      .lt-complete-screen {
        position: relative;
        z-index: 10;
        flex: 1;
        min-height: 0;
        padding: 28px 18px max(22px, env(safe-area-inset-bottom));
        display: grid;
        place-items: center;
        text-align: center;
      }

      .lt-complete-box {
        width: min(92vw, 520px);
        border-radius: 34px;
        background: linear-gradient(180deg, rgba(255,255,255,.96) 0%, rgba(255,240,166,.96) 100%);
        border: 7px solid #fff;
        box-shadow: 0 14px 0 rgba(0,0,0,.16), 0 24px 46px rgba(0,0,0,.16);
        padding: 28px 18px 22px;
        display: grid;
        gap: 14px;
      }

      .lt-complete-emoji {
        font-size: clamp(78px, 22vw, 130px);
        animation: ltCompleteBounce .85s ease-in-out infinite alternate;
      }

      @keyframes ltCompleteBounce {
        from { transform: translateY(0) rotate(-2deg); }
        to   { transform: translateY(-10px) rotate(3deg); }
      }

      .lt-complete-title {
        font-size: clamp(30px, 8vw, 48px);
        font-weight: 900;
        color: #24324a;
        line-height: 1.12;
      }

      .lt-complete-sub {
        font-size: clamp(17px, 4.8vw, 24px);
        font-weight: 900;
        color: #795315;
      }

      .lt-complete-btns {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
        margin-top: 6px;
      }

      .lt-btn {
        min-height: 62px;
        border-radius: 22px;
        border: 0;
        font: inherit;
        font-size: clamp(17px, 4.5vw, 22px);
        font-weight: 900;
        cursor: pointer;
        touch-action: manipulation;
        box-shadow: 0 7px 0 rgba(0,0,0,.17);
        transition: transform .1s ease, box-shadow .1s ease;
      }

      .lt-btn-primary {
        background: #FF7A1A;
        color: #fff;
      }

      .lt-btn-secondary {
        background: #fff;
        color: #24324a;
        border: 4px solid #eee;
        box-shadow: 0 5px 0 #ddd;
      }

      @media (max-width: 560px) {
        .lt-top {
          grid-template-columns: 1fr auto;
          grid-template-areas:
            "tabs home"
            "progress progress";
          padding-left: 9px;
          padding-right: 9px;
          gap: 7px;
        }

        .lt-mode-tabs { grid-area: tabs; width: 100%; min-width: 0; }
        .lt-home-btn { grid-area: home; }
        .lt-progress { grid-area: progress; width: 100%; }

        .lt-title-wrap { padding-bottom: 6px; }

        .lt-main-card {
          width: min(92vw, 400px);
          height: min(51dvh, 390px);
          min-height: 282px;
          border-radius: 30px;
          border-width: 6px;
        }

        .lt-word-label {
          min-height: 52px;
          font-size: clamp(30px, 10vw, 56px);
        }

        .lt-hint {
          min-height: 50px;
          font-size: clamp(19px, 5.6vw, 26px);
        }
      }

      @media (max-height: 650px) {
        .lt-title-wrap { display: none; }
        .lt-main-card {
          height: min(50dvh, 340px);
          min-height: 238px;
        }
        .lt-word-label { min-height: 48px; }
      }
    `;

    document.head.appendChild(style);
  }

  function escapeAttr(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function speakDirect(text, lang, rate) {
    if (!text || typeof speechSynthesis === 'undefined') return;
    try {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang || 'ko-KR';
      utterance.rate = rate || 0.86;
      utterance.pitch = 1.12;
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn('[LetterTransform] speak failed:', error);
    }
  }

  function speakItemText(text, forceLang) {
    if (!text) return;

    if (forceLang === 'ko-KR' && state.options && typeof state.options.speakGuide === 'function') {
      state.options.speakGuide(text, true);
      return;
    }

    speakDirect(text, forceLang || (state.mode === 'abc' ? 'en-US' : 'ko-KR'), state.mode === 'abc' ? 0.78 : 0.88);
  }

  function vibrate(pattern) {
    if (!navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (error) {}
  }

  function createExplosion(x, y, color) {
    const root = state.container?.querySelector('.lt-root');
    if (!root) return;

    const colors = [color, '#FFF59D', '#FFD700', '#FF69B4', '#00D4FF', '#FFFFFF'];
    for (let i = 0; i < 28; i += 1) {
      const p = document.createElement('div');
      p.className = 'lt-particle';
      p.style.backgroundColor = colors[i % colors.length];
      const angle = Math.random() * Math.PI * 2;
      const dist = 110 + Math.random() * 210;
      p.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      root.appendChild(p);
      setTimeout(() => p.remove(), 1000);
    }

    const stars = ['⭐', '✨', '🌟', '💫', '🎊'];
    for (let i = 0; i < 10; i += 1) {
      const s = document.createElement('div');
      s.className = 'lt-star';
      s.textContent = stars[i % stars.length];
      const angle = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * 160;
      s.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
      s.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      root.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  }

  function updateRootBackground(root, item) {
    const dataset = getDataset();
    const start = dataset.bg?.[0] || '#fff7d6';
    const end = dataset.bg?.[1] || '#e8f7ff';
    root.style.setProperty('--lt-color', item.color || '#ff7a1a');
    root.style.background = `
      radial-gradient(circle at 50% 18%, rgba(255,255,255,.8) 0%, transparent 34%),
      linear-gradient(180deg, ${start} 0%, ${end} 100%)
    `;
  }

  function makeProgressHTML() {
    const items = getItems();
    return items.map((item, idx) => {
      const cls = idx < state.currentIndex ? 'done' : (idx === state.currentIndex ? 'active' : '');
      return `<span class="lt-dot ${cls}" style="${idx === state.currentIndex ? `--lt-color:${item.color};` : ''}"></span>`;
    }).join('');
  }

  function resetMode(nextMode) {
    if (!DATASETS[nextMode] || state.mode === nextMode) return;
    clearTimers();
    state.mode = nextMode;
    state.currentIndex = 0;
    state.isTransforming = false;
    renderScene(true);
    timer(() => {
      const dataset = getDataset();
      speakItemText(dataset.intro, nextMode === 'abc' ? 'en-US' : 'ko-KR');
    }, 300);
  }

  function renderScene(skipIntroVoice) {
    if (state.destroyed || !state.container) return;

    const root = state.container.querySelector('.lt-root');
    const item = getCurrentItem();
    const dataset = getDataset();

    if (!root || !item) return;

    updateRootBackground(root, item);

    root.innerHTML = `
      <div class="lt-top">
        <div class="lt-mode-tabs" role="tablist" aria-label="글자 모드 선택">
          <button type="button" class="lt-mode-tab ${state.mode === 'abc' ? 'active' : ''}" data-mode="abc">ABC</button>
          <button type="button" class="lt-mode-tab ${state.mode === 'hangul' ? 'active' : ''}" data-mode="hangul">한글</button>
        </div>
        <div class="lt-progress" aria-label="진행도">${makeProgressHTML()}</div>
        <button type="button" class="lt-home-btn" data-action="home" aria-label="글자놀이터로">🏠</button>
      </div>

      <div class="lt-title-wrap">
        <div class="lt-title">${dataset.title}</div>
      </div>

      <div class="lt-stage">
        <div class="lt-stage-inner">
          <button type="button" class="lt-main-card" id="ltMainCard" aria-label="${escapeAttr(item.letterName)} 변신">
            <span class="lt-image-wrap" id="ltImageWrap">
              <img src="${escapeAttr(item.letterImg)}" class="lt-display-img" id="ltMainImg" alt="${escapeAttr(item.letter)}" draggable="false">
              <span class="lt-fallback-letter" id="ltFallbackLetter">${item.fallbackLetter}</span>
              <span class="lt-fallback-object" id="ltFallbackObject" style="display:none;">${item.fallbackObject}</span>
            </span>
          </button>

          <div class="lt-word-label" id="ltWordLabel">${escapeAttr(item.displayWord)}</div>
          <div class="lt-hint" id="ltHint">👆 눌러봐!</div>
        </div>
      </div>
    `;

    const mainCard = root.querySelector('#ltMainCard');
    const mainImg = root.querySelector('#ltMainImg');
    const imageWrap = root.querySelector('#ltImageWrap');
    const fallbackLetter = root.querySelector('#ltFallbackLetter');
    const fallbackObject = root.querySelector('#ltFallbackObject');
    const hint = root.querySelector('#ltHint');

    root.querySelectorAll('.lt-mode-tab').forEach((btn) => {
      btn.addEventListener('click', () => resetMode(btn.dataset.mode));
    });

    root.querySelector('[data-action="home"]')?.addEventListener('click', () => {
      if (typeof window.openLetterLand === 'function') window.openLetterLand();
      else state.options.closeToParkHome?.();
    });

    mainImg.addEventListener('error', () => {
      imageWrap.classList.add('lt-image-missing');
      const isTransformed = state.isTransforming || mainCard.classList.contains('lt-transformed');
      fallbackLetter.style.display = isTransformed ? 'none' : 'grid';
      fallbackObject.style.display = isTransformed ? 'grid' : 'none';
    });

    mainImg.addEventListener('load', () => {
      imageWrap.classList.remove('lt-image-missing');
      fallbackLetter.style.display = 'none';
      fallbackObject.style.display = 'none';
    });

    timer(() => {
      if (!state.destroyed) hint.classList.add('visible');
    }, 650);

    mainCard.addEventListener('click', () => {
      if (state.isTransforming) {
        advanceRound();
        return;
      }

      state.isTransforming = true;
      vibrate(70);
      hint.classList.remove('visible');

      speakItemText(
        state.mode === 'abc' ? item.letterName : `${item.letterName}! ${item.phonics}`,
        state.mode === 'abc' ? 'en-US' : 'ko-KR'
      );

      const rect = mainCard.getBoundingClientRect();
      createExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, item.color);

      mainCard.classList.add('lt-transformed');

      timer(() => {
        mainImg.src = item.objectImg;
        mainImg.alt = item.word;
        fallbackLetter.style.display = 'none';
        fallbackObject.style.display = 'grid';
        imageWrap.classList.remove('lt-image-missing');
        vibrate([45, 40, 45]);
      }, 230);

      timer(() => {
        const label = root.querySelector('#ltWordLabel');
        if (label) label.classList.add('show');

        speakItemText(
          state.mode === 'abc' ? item.wordVoice : item.wordVoice,
          state.mode === 'abc' ? 'en-US' : 'ko-KR'
        );

        state.options.fireConfetti?.();
      }, 760);

      timer(() => {
        hint.textContent = '👆 다음';
        hint.classList.add('visible');
      }, 2100);
    });

    if (!skipIntroVoice) {
      timer(() => {
        const guide = state.mode === 'abc'
          ? `Touch ${item.letter}!`
          : `${item.letterName}을 눌러볼까?`;
        speakItemText(guide, state.mode === 'abc' ? 'en-US' : 'ko-KR');
      }, 450);
    }
  }

  function advanceRound() {
    if (state.destroyed || !state.container) return;

    const root = state.container.querySelector('.lt-root');
    if (!root) return;

    root.style.opacity = '0';

    timer(() => {
      state.currentIndex += 1;
      state.isTransforming = false;
      root.style.opacity = '1';

      if (state.currentIndex >= getItems().length) {
        showComplete();
      } else {
        renderScene();
      }
    }, 330);
  }

  function showComplete() {
    if (state.destroyed || !state.container) return;

    const root = state.container.querySelector('.lt-root');
    const dataset = getDataset();

    if (!root) return;

    root.style.setProperty('--lt-color', '#FF7A1A');
    root.style.background = 'linear-gradient(180deg, #fff9c4 0%, #ffe082 48%, #ffd6e8 100%)';

    root.innerHTML = `
      <div class="lt-complete-screen">
        <div class="lt-complete-box">
          <div class="lt-complete-emoji">🎉</div>
          <div class="lt-complete-title">${dataset.completeTitle}</div>
          <div class="lt-complete-sub">시현이 최고야! 🌟</div>
          <div class="lt-complete-btns">
            <button type="button" class="lt-btn lt-btn-primary" id="ltReplay">다시 하기 🔄</button>
            <button type="button" class="lt-btn lt-btn-secondary" id="ltSwitch">${state.mode === 'abc' ? '한글도 하기 ㄱ' : 'ABC도 하기 A'}</button>
            <button type="button" class="lt-btn lt-btn-secondary" id="ltToLand">글자놀이터로 👋</button>
          </div>
        </div>
      </div>
    `;

    speakItemText(dataset.completeVoice, state.mode === 'abc' ? 'en-US' : 'ko-KR');
    state.options.fireConfetti?.();
    state.options.gainExp?.(dataset.completeExp || 20);

    root.querySelector('#ltReplay')?.addEventListener('click', () => {
      state.currentIndex = 0;
      state.isTransforming = false;
      renderScene(true);
      timer(() => {
        const msg = state.mode === 'abc' ? 'Touch the letter!' : '글자를 눌러볼까?';
        speakItemText(msg, state.mode === 'abc' ? 'en-US' : 'ko-KR');
      }, 350);
    });

    root.querySelector('#ltSwitch')?.addEventListener('click', () => {
      resetMode(state.mode === 'abc' ? 'hangul' : 'abc');
    });

    root.querySelector('#ltToLand')?.addEventListener('click', () => {
      if (typeof window.openLetterLand === 'function') window.openLetterLand();
      else state.options.closeToParkHome?.();
    });
  }

  function render(container, options = {}) {
    destroy();
    injectStyle();

    state.container = container;
    state.options = options || {};
    state.destroyed = false;
    state.currentIndex = 0;
    state.isTransforming = false;
    state.timers = [];
    state.mode = options.initialMode === 'hangul' ? 'hangul' : 'abc';

    container.innerHTML = `<div class="lt-root"></div>`;
    renderScene(true);

    timer(() => {
      const dataset = getDataset();
      speakItemText(dataset.intro, state.mode === 'abc' ? 'en-US' : 'ko-KR');
    }, 350);
  }

  function destroy() {
    state.destroyed = true;
    clearTimers();

    if (typeof speechSynthesis !== 'undefined') {
      try { speechSynthesis.cancel(); } catch (error) {}
    }

    if (state.container) state.container.innerHTML = '';
    state.container = null;
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
  window.SihyeonGames[ALIAS_KEY] = window.SihyeonGames[GAME_KEY];
})();
