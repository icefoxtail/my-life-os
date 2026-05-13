/**
 * 시현이 놀이터 OS — 글자놀이터 미니게임 v6.0 (얼티밋 터치 업그레이드)
 * 파일: js/games/letter-play.js
 *
 * 모드 A (단어): 그림과 글자를 보고 같은 글자 풍선 터뜨리기
 * 모드 B (음절): 모음 선택 → 5문제 짧은 라운드 (타격감 & 피날레 극대화)
 */

(function () {
  window.SihyeonGames = window.SihyeonGames || {};

  const LETTER_PLAY_GAME_KEY = 'letterPlay';
  const LETTER_PLAY_STYLE_ID = 'sihyeon-letter-play-style';

  function playGameVoice(id) {
    if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      window.SihyeonVoice.play(id).catch(() => {});
    }
  }

  window.SihyeonGames[LETTER_PLAY_GAME_KEY] = {
    id: 'letterPlay',
    title: '🎈',

    ROUND_LIMIT: 5,

    _state:        null,
    _timers:       [],
    _container:    null,
    _options:      null,
    _audioCtx:     null,
    _selectedVowel: null,
    _selectedCategory: '🚗탈것',
    _layoutMode: 'portrait',
    _resizeTimer: null,
    _handleResizeBound: null,
    _successRewardGiven: false,
    _completeRewardGiven: false,

    // ─── 모음별 음절 데이터 ────────────────
    _vowelData: [
      { key: 'ㅏ', syllables: ['가','나','다','라','마','바','사','아','자','차','카','타','파','하'] },
      { key: 'ㅑ', syllables: ['갸','냐','댜','랴','먀','뱌','샤','야','쟈','챠','캬','탸','퍄','햐'] },
      { key: 'ㅓ', syllables: ['거','너','더','러','머','버','서','어','저','처','커','터','퍼','허'] },
      { key: 'ㅕ', syllables: ['겨','녀','뎌','려','며','벼','셔','여','져','쳐','켜','텨','펴','혀'] },
      { key: 'ㅗ', syllables: ['고','노','도','로','모','보','소','오','조','초','코','토','포','호'] },
      { key: 'ㅛ', syllables: ['교','뇨','됴','료','묘','뵤','쇼','요','죠','쵸','쿄','툐','표','효'] },
      { key: 'ㅜ', syllables: ['구','누','두','루','무','부','수','우','주','추','쿠','투','푸','후'] },
      { key: 'ㅠ', syllables: ['규','뉴','듀','류','뮤','뷰','슈','유','쥬','츄','큐','튜','퓨','휴'] },
      { key: 'ㅡ', syllables: ['그','느','드','르','므','브','스','으','즈','츠','크','트','프','흐'] },
      { key: 'ㅣ', syllables: ['기','니','디','리','미','비','시','이','지','치','키','티','피','히'] },
    ],

    // ─── 단어 카테고리 데이터 ────────────────
    _wordCategories: {
      '🚗탈것':  [
        { emoji:'🚗', word:'자동차', answer:'자', choices:['자','나','다'] },
        { emoji:'🚌', word:'버스',   answer:'버', choices:['버','머','서'] },
        { emoji:'🚒', word:'소방차', answer:'소', choices:['소','도','고'] },
        { emoji:'🚑', word:'구급차', answer:'구', choices:['구','누','두'] },
        { emoji:'🚂', word:'기차',   answer:'기', choices:['기','미','피'] },
        { emoji:'🚀', word:'로켓',   answer:'로', choices:['로','모','보'] },
        { emoji:'✈️', word:'비행기', answer:'비', choices:['비','미','피'] },
        { emoji:'🚁', word:'헬리콥터',answer:'헬', choices:['헬','멜','델'] },
        { emoji:'⛵', word:'배',     answer:'배', choices:['배','새','개'] },
        { emoji:'🚲', word:'자전거', answer:'자', choices:['자','바','사'] },
        { emoji:'🚜', word:'포크레인',answer:'포', choices:['포','코','보'] },
        { emoji:'🛻', word:'트럭',   answer:'트', choices:['트','크','프'] },
      ],
      '🐶동물':  [
        { emoji:'🦕', word:'공룡',   answer:'공', choices:['공','동','봉'] },
        { emoji:'🦖', word:'티라노', answer:'티', choices:['티','키','피'] },
        { emoji:'🐶', word:'강아지', answer:'강', choices:['강','방','당'] },
        { emoji:'🐱', word:'고양이', answer:'고', choices:['고','도','소'] },
        { emoji:'🐰', word:'토끼',   answer:'토', choices:['토','고','노'] },
        { emoji:'🐸', word:'개구리', answer:'개', choices:['개','새','배'] },
        { emoji:'🐘', word:'코끼리', answer:'코', choices:['코','모','보'] },
        { emoji:'🦁', word:'사자',   answer:'사', choices:['사','나','다'] },
        { emoji:'🐯', word:'호랑이', answer:'호', choices:['호','보','소'] },
        { emoji:'🐼', word:'판다',   answer:'판', choices:['판','반','난'] },
        { emoji:'🦒', word:'기린',   answer:'기', choices:['기','미','피'] },
        { emoji:'🐧', word:'펭귄',   answer:'펭', choices:['펭','멩','벵'] },
        { emoji:'🐳', word:'고래',   answer:'고', choices:['고','조','노'] },
      ],
      '🍎음식':  [
        { emoji:'🍎', word:'사과',   answer:'사', choices:['사','바','타'] },
        { emoji:'🍌', word:'바나나', answer:'바', choices:['바','파','타'] },
        { emoji:'🍓', word:'딸기',   answer:'딸', choices:['딸','말','발'] },
        { emoji:'🍇', word:'포도',   answer:'포', choices:['포','보','소'] },
        { emoji:'🍉', word:'수박',   answer:'수', choices:['수','두','부'] },
        { emoji:'🍦', word:'아이스크림',answer:'아',choices:['아','오','이'] },
        { emoji:'🎂', word:'케이크', answer:'케', choices:['게','케','데'] },
        { emoji:'🍕', word:'피자',   answer:'피', choices:['피','미','비'] },
        { emoji:'🍩', word:'도너츠', answer:'도', choices:['도','보','소'] },
        { emoji:'🍫', word:'초콜릿', answer:'초', choices:['초','소','도'] },
        { emoji:'🍭', word:'사탕',   answer:'사', choices:['사','바','가'] },
        { emoji:'🥛', word:'우유',   answer:'우', choices:['우','두','무'] },
        { emoji:'🍚', word:'밥',     answer:'밥', choices:['밥','탑','납'] },
      ],
      '🌈자연':  [
        { emoji:'🌙', word:'달',     answer:'달', choices:['달','말','살'] },
        { emoji:'⭐', word:'별',     answer:'별', choices:['별','열','절'] },
        { emoji:'☀️', word:'해',     answer:'해', choices:['해','새','배'] },
        { emoji:'🌈', word:'무지개', answer:'무', choices:['무','구','부'] },
        { emoji:'🌸', word:'꽃',     answer:'꽃', choices:['꽃','못','솥'] },
        { emoji:'⛄', word:'눈사람', answer:'눈', choices:['눈','분','군'] },
        { emoji:'🌧️', word:'비',     answer:'비', choices:['비','미','피'] },
      ],
    },

    // ─── 오디오 시스템 ────────────────────────────────────────
    _initAudio() {
      if (!window.AudioContext && !window.webkitAudioContext) return;
      if (!this._audioCtx) this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (this._audioCtx.state === 'suspended') this._audioCtx.resume().catch?.(() => {});
    },

    _playTone(type) {
      if (!this._audioCtx) return;
      const ctx = this._audioCtx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);

      if (type === 'pop') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now); osc.stop(now + 0.3);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now); osc.stop(now + 0.3);
      } else if (type === 'complete') {
        [440, 554.37, 659.25, 880].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + i * 0.1);
          g.gain.setValueAtTime(0.3, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.5);
          o.connect(g); g.connect(ctx.destination);
          o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.6);
        });
      }
    },

    _isLandscapeMode() {
      try {
        return window.matchMedia('(orientation: landscape) and (min-width: 768px) and (min-height: 520px)').matches;
      } catch (error) {
        return window.innerWidth >= 768 && window.innerWidth > window.innerHeight;
      }
    },

    _getLayoutMode() {
      return this._isLandscapeMode() ? 'landscape' : 'portrait';
    },

    _getLayoutClass() {
      const mode = this._getLayoutMode();
      this._layoutMode = mode;
      return `letter-play-root letter-play-${mode}`;
    },

    _applyLayoutClass() {
      if (!this._container) return;
      this._container.classList.remove('letter-play-portrait', 'letter-play-landscape');
      this._container.classList.add('letter-play-wrapper', `letter-play-${this._getLayoutMode()}`);

      const root = this._container.querySelector('.slp-root');
      if (!root) return;
      root.classList.remove('letter-play-portrait', 'letter-play-landscape');
      root.classList.add('letter-play-root', `letter-play-${this._getLayoutMode()}`);
    },

    _bindResizeEvents() {
      if (this._handleResizeBound) return;
      this._handleResizeBound = () => this._handleResize();
      window.addEventListener('resize', this._handleResizeBound, { passive: true });
      window.addEventListener('orientationchange', this._handleResizeBound, { passive: true });
    },

    _unbindResizeEvents() {
      if (!this._handleResizeBound) return;
      window.removeEventListener('resize', this._handleResizeBound);
      window.removeEventListener('orientationchange', this._handleResizeBound);
      this._handleResizeBound = null;
    },

    _handleResize() {
      if (!this._container) return;
      if (this._resizeTimer) clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => {
        this._resizeTimer = null;
        this._refreshLayoutOnly();
      }, 120);
    },

    _refreshLayoutOnly() {
      if (!this._container) return;
      this._layoutMode = this._getLayoutMode();
      this._applyLayoutClass();
    },

    // ─── 스타일 ──────────────────────────────────────────────
    _injectStyle() {
      const prev = document.getElementById(LETTER_PLAY_STYLE_ID);
      if (prev) prev.remove();

      const style = document.createElement('style');
      style.id = LETTER_PLAY_STYLE_ID;
      style.textContent = `
        .letter-play-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-sizing: border-box;
        }

        .letter-play-wrapper *,
        .letter-play-root * {
          box-sizing: border-box;
        }

        .slp-root {
          width: 100%; flex: 1; min-height: 0;
          display: flex; flex-direction: column; align-items: center;
          background: linear-gradient(160deg, #ffecd2 0%, #ffe0f0 40%, #d4f5ff 100%);
          overflow: hidden; position: relative;
          font-family: 'Jua', 'Nanum Gothic', sans-serif;
          box-sizing: border-box; user-select: none;
        }

        .letter-play-root {
          isolation: isolate;
        }

        .letter-play-portrait.slp-root {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .letter-play-landscape.slp-root {
          display: grid;
          grid-template-columns: minmax(220px, 25%) minmax(340px, 1fr) minmax(230px, 27%);
          grid-template-rows: auto 1fr;
          gap: 12px;
          align-items: stretch;
          padding: 12px;
        }

        .letter-play-landscape .slp-progress-row {
          grid-column: 1;
          grid-row: 1;
          align-self: start;
          justify-content: flex-start;
          flex-wrap: wrap;
          padding: 0;
        }

        .letter-play-landscape .slp-hint-card {
          grid-column: 1;
          grid-row: 2;
          width: 100%;
          max-width: none;
          height: 100%;
          min-height: 0;
          margin: 0;
          padding: 18px;
        }

        .letter-play-landscape .slp-balloons-area {
          grid-column: 2 / span 2;
          grid-row: 1 / span 2;
          align-items: center;
          justify-content: center;
          padding: 12px;
          gap: clamp(18px, 3vw, 38px);
        }

        .letter-play-landscape .slp-hint-emoji {
          font-size: clamp(110px, 17vw, 220px);
        }

        .letter-play-landscape .slp-hint-word {
          font-size: clamp(34px, 4vw, 64px);
        }

        .letter-play-landscape .slp-first-char {
          font-size: clamp(46px, 5.5vw, 88px);
        }

        .letter-play-landscape .slp-syllable-target {
          font-size: clamp(120px, 15vw, 220px);
        }

        .letter-play-landscape .slp-balloon-btn {
          max-width: 210px;
        }

        .letter-play-landscape .slp-balloon-body {
          width: clamp(140px, 17vw, 230px);
          height: clamp(170px, 21vw, 270px);
        }

        .letter-play-landscape .slp-balloon-letter {
          font-size: clamp(72px, 8vw, 120px);
        }

        .letter-play-landscape .slp-balloon-string {
          height: clamp(30px, 5vw, 58px);
        }

        .letter-play-landscape .slp-overlay {
          inset: 12px;
          border-radius: 34px;
        }

        .letter-play-landscape .slp-syllable-grid {
          max-width: min(70vw, 720px);
        }

        /* ── 이펙트 ── */
        .slp-mega-flash::after {
          content: ''; position: absolute; inset: 0; background: #fff;
          z-index: 999; animation: flashAnim 0.5s ease-out forwards; pointer-events: none;
        }
        @keyframes flashAnim { 0% { opacity: 0.8; } 100% { opacity: 0; } }
        .slp-shake { animation: stageShake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes stageShake {
          0%,100%{transform:translateX(0);} 20%{transform:translateX(-10px) rotate(-2deg);} 
          40%{transform:translateX(10px) rotate(2deg);} 60%{transform:translateX(-5px);} 80%{transform:translateX(5px);}
        }

        .slp-particle {
          position: absolute; border-radius: 50%; pointer-events: none;
          animation: slpParticleFly 0.8s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
          z-index: 150; box-shadow: 0 0 10px currentColor;
        }
        @keyframes slpParticleFly {
          0%   { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--pdx), var(--pdy)) scale(0); }
        }

        .slp-golden-ring {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          width: 0; height: 0; border: 15px solid #FFD700; border-radius: 50%;
          opacity: 1; pointer-events: none; z-index: 100;
          animation: ringExpand 0.8s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
          box-shadow: 0 0 20px #FFD700, inset 0 0 20px #FFD700;
        }
        @keyframes ringExpand { 100% { width: 500px; height: 500px; opacity: 0; border-width: 2px; } }

        .slp-bg-dot {
          position: absolute; border-radius: 50%; opacity: 0.18;
          pointer-events: none; animation: slp-float-dot 6s ease-in-out infinite;
        }
        @keyframes slp-float-dot { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-18px) rotate(20deg); } }

        /* ── 선택바 ── */
        .slp-vowel-bar {
          width: 100%; flex-shrink: 0;
          background: rgba(255,255,255,0.95);
          box-shadow: 0 4px 16px rgba(0,0,0,0.10);
          padding: 12px;
          display: flex; align-items: center;
          gap: 10px; overflow-x: auto;
          scrollbar-width: none; box-sizing: border-box;
          border-bottom: 4px solid rgba(255,133,194,0.3);
          z-index: 20; position: relative;
        }
        .slp-vowel-bar::-webkit-scrollbar { display: none; }

        .slp-vowel-chip {
          flex-shrink: 0; min-width: 70px; height: 70px; font-size: 26px;
          border-radius: 50%; border: 5px solid rgba(255,133,194,0.38);
          background: #fff; font-weight: 900; color: #cc6699;
          cursor: pointer; display: grid; place-items: center;
          transition: all 0.2s; box-shadow: 0 6px 0 rgba(0,0,0,0.10);
          -webkit-tap-highlight-color: transparent; touch-action: manipulation;
        }
        .slp-vowel-chip:active { transform: translateY(6px); box-shadow: 0 0 0 transparent; }
        .slp-vowel-chip.active {
          background: linear-gradient(135deg,#ff85c2,#ff4e88);
          color: #fff; border-color: #ff4e88;
          box-shadow: 0 6px 0 rgba(255,78,136,0.4); transform: scale(1.1);
        }
        .slp-cat-chip.active {
          background: linear-gradient(135deg,#7ecfff,#38b6ff);
          color: #fff; border-color: #38b6ff;
          box-shadow: 0 6px 0 rgba(56,182,255,0.4);
        }

        .letter-play-landscape.letter-play-wrapper .slp-vowel-bar {
          padding: 8px 12px;
          gap: 8px;
        }

        .letter-play-landscape.letter-play-wrapper .slp-vowel-chip {
          min-width: 58px;
          height: 58px;
          font-size: 22px;
          border-width: 4px;
        }

        .letter-play-landscape.letter-play-wrapper .slp-cat-chip {
          min-width: 92px !important;
          height: 58px;
          border-radius: 22px !important;
          font-size: 16px !important;
        }

        /* ── 진행 ── */
        .slp-progress-row { display: flex; gap: 10px; padding: 15px 12px 5px; flex-shrink: 0; justify-content: center; }
        .slp-prog-dot { width: 26px; height: 26px; border-radius: 50%; background: rgba(0,0,0,0.12); border: 4px solid #fff; transition: all 0.3s; box-shadow: 0 4px 0 rgba(0,0,0,0.1); }
        .slp-prog-dot.done { background: #ff85c2; }
        .slp-prog-dot.active { background: #ff4e88; transform: scale(1.4); box-shadow: 0 0 0 4px rgba(255,78,136,0.3); }

        /* ── 힌트 카드 ── */
        .slp-hint-card {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.9); border-radius: 35px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.15), inset 0 0 10px rgba(255,255,255,0.8);
          padding: 15px 30px 10px; margin: 10px 15px 0;
          width: calc(100% - 30px); max-width: 400px;
          box-sizing: border-box; flex-shrink: 0; cursor: pointer; position: relative;
          border: 5px solid rgba(255,180,220,0.7);
        }
        .slp-hint-emoji { font-size: clamp(120px, 35vw, 190px); line-height: 1; animation: slp-emoji-bounce 2s ease-in-out infinite; filter: drop-shadow(0 15px 10px rgba(0,0,0,0.15)); }
        @keyframes slp-emoji-bounce { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-12px) scale(1.05); } }
        
        .slp-hint-word { font-size: clamp(35px, 9vw, 55px); font-weight: 900; color: #444; margin-top: 5px; display: flex; align-items: center; justify-content: center; }
        .slp-first-char {
          min-width: 1.2em; height: 1.2em; border-radius: 20px; display: inline-grid; place-items: center;
          color: #fff; font-size: clamp(45px, 12vw, 75px);
          background: linear-gradient(135deg,#ff85c2,#ff4e88);
          box-shadow: 0 8px 0 rgba(255,78,136,0.3), 0 0 0 5px #fff;
          animation: slp-first-pulse 1.5s infinite; margin-right: 5px;
        }
        @keyframes slp-first-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15) rotate(-3deg); } }

        .slp-syllable-target {
          font-size: clamp(100px, 28vw, 160px); font-weight: 900; color: #ff4e88; line-height: 1;
          text-shadow: 0 6px 0 rgba(255,78,136,0.2); animation: slp-syl-pulse 1.5s infinite;
        }
        @keyframes slp-syl-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); filter: drop-shadow(0 0 20px rgba(255,78,136,0.5)); } }

        /* ── 풍선 ── */
        .slp-balloons-area { flex: 1; display: flex; align-items: center; justify-content: center; gap: clamp(15px, 5vw, 40px); width: 100%; padding: 10px; box-sizing: border-box; }
        .slp-balloon-btn { display: flex; flex-direction: column; align-items: center; position: relative; cursor: pointer; background: none; border: none; padding: 0; outline: none; -webkit-tap-highlight-color: transparent; flex: 1; max-width: 180px; animation: slp-balloon-float 3s ease-in-out infinite; touch-action: manipulation; }
        .slp-balloon-btn:nth-child(2) { animation-delay: -1s; }
        .slp-balloon-btn:nth-child(3) { animation-delay: -2s; }
        @keyframes slp-balloon-float { 0%,100% { transform: translateY(0px) rotate(-3deg); } 50% { transform: translateY(-20px) rotate(3deg); } }

        .slp-balloon-body {
          width: clamp(130px, 35vw, 200px); height: clamp(160px, 42vw, 240px);
          border-radius: 50% 50% 50% 50% / 55% 55% 45% 45%;
          display: flex; align-items: center; justify-content: center;
          position: relative; transition: transform 0.15s;
          box-shadow: inset -10px -10px 30px rgba(0,0,0,0.15), inset 10px 10px 20px rgba(255,255,255,0.4), 0 15px 25px rgba(0,0,0,0.25);
          border: 4px solid rgba(255,255,255,0.5);
        }
        .slp-balloon-btn:active .slp-balloon-body { transform: scale(0.9); }
        .slp-balloon-body::after { content: ''; position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 14px solid currentColor; filter: brightness(0.7); }
        .slp-balloon-string { width: 3px; height: clamp(35px, 9vw, 55px); background: #999; border-radius: 2px; opacity: 0.6; }
        
        .slp-balloon-letter { font-size: clamp(65px, 18vw, 100px); font-weight: 900; color: white; text-shadow: 0 5px 15px rgba(0,0,0,0.4); z-index: 1; }

        .slp-balloon-color-0 { background:linear-gradient(135deg,#ff7eb3,#ff4e88); color:#ff4e88; }
        .slp-balloon-color-1 { background:linear-gradient(135deg,#ffcc70,#ffaa00); color:#ffaa00; }
        .slp-balloon-color-2 { background:linear-gradient(135deg,#7ecfff,#38b6ff); color:#38b6ff; }
        .slp-balloon-color-3 { background:linear-gradient(135deg,#a78bfa,#7c3aed); color:#7c3aed; }
        .slp-balloon-color-4 { background:linear-gradient(135deg,#6ee7b7,#10b981); color:#10b981; }

        /* ★ 메가 팝 애니메이션 */
        .slp-balloon-btn.correct .slp-balloon-body { animation: megaPop 0.5s forwards !important; }
        @keyframes megaPop { 0% { transform: scale(1); opacity: 1; } 30% { transform: scale(1.6) rotate(10deg); filter: brightness(1.5); } 100% { transform: scale(0); opacity: 0; filter: brightness(2); } }
        .slp-balloon-btn.correct .slp-balloon-string { opacity:0; }
        
        .slp-balloon-btn.wrong .slp-balloon-body { animation: slpBalloonWrong 0.4s ease !important; filter: grayscale(0.5); }
        @keyframes slpBalloonWrong {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-12px) rotate(-4deg); }
          40% { transform: translateX(12px) rotate(4deg); }
          60% { transform: translateX(-7px) rotate(-2deg); }
          80% { transform: translateX(7px) rotate(2deg); }
        }

        .slp-balloon-btn.hint-glow .slp-balloon-body { animation: hintJump 0.8s infinite alternate !important; border-color: #FFF !important; }
        @keyframes hintJump { from { transform: translateY(0); filter: brightness(1) drop-shadow(0 0 10px rgba(255,255,255,0.8)); } to { transform: translateY(-30px); filter: brightness(1.3) drop-shadow(0 0 30px #FFF); } }

        /* ── 오버레이 & 결과 ── */
        .slp-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,0.85); backdrop-filter: blur(8px); z-index: 200; gap: 20px; animation: slp-fade-in 0.4s ease; }
        @keyframes slp-fade-in { from { opacity:0; } to { opacity:1; } }
        
        .slp-result-emoji { font-size: clamp(100px,30vw,160px); animation: slp-pop-in 0.6s cubic-bezier(.34,1.56,.64,1); filter: drop-shadow(0 15px 15px rgba(0,0,0,0.2)); }
        @keyframes slp-pop-in { 0% { transform: scale(0.3) rotate(-20deg); } 70% { transform: scale(1.2) rotate(10deg); } 100% { transform: scale(1) rotate(0deg); } }

        .slp-syllable-grid { display: flex; gap: 12px; padding: 20px; max-width: 90vw; justify-content: center; flex-wrap: wrap; animation: slp-pop-in 0.5s 0.1s both; }
        .slp-syl-cell { width: clamp(65px, 15vw, 90px); height: clamp(65px, 15vw, 90px); border-radius: 20px; display: grid; place-items: center; font-size: clamp(35px, 9vw, 55px); font-weight: 900; animation: slp-sticker-appear 0.5s cubic-bezier(.34,1.56,.64,1) both; box-shadow: 0 8px 15px rgba(0,0,0,0.2); }
        .slp-syl-cell.learned { background: linear-gradient(135deg,#ff85c2,#ff4e88); color:#fff; border: 4px solid #fff; }
        .slp-syl-cell.missed  { background: rgba(0,0,0,0.1); color:#999; }
        @keyframes slp-sticker-appear { 0% { transform: scale(0) rotate(-40deg); opacity:0; } 100% { transform: scale(1) rotate(0deg); opacity:1; } }

        .slp-icon-btn-row { display: flex; gap: 25px; justify-content: center; margin-top: 10px; }
        .slp-icon-btn { width: 100px; height: 100px; font-size: 45px; border-radius: 50%; border: 6px solid #fff; box-shadow: 0 10px 0 rgba(0,0,0,0.15); cursor: pointer; display: grid; place-items: center; transition: transform 0.1s; -webkit-tap-highlight-color: transparent; }
        .slp-icon-btn:active { transform: translateY(8px); box-shadow: 0 2px 0 rgba(0,0,0,0.15); }
        .slp-btn-next   { background: #ff85c2; }
        .slp-btn-replay { background: #4CAF50; }
        .slp-btn-home   { background: #FF9800; }

        @media (orientation: landscape) and (min-width: 1024px) and (min-height: 640px) {
          .letter-play-landscape.slp-root {
            grid-template-columns: minmax(260px, 24%) minmax(430px, 1fr) minmax(280px, 26%);
            gap: 16px;
            padding: 16px;
          }

          .letter-play-landscape .slp-hint-card {
            border-radius: 40px;
            border-width: 7px;
          }

          .letter-play-landscape .slp-balloons-area {
            gap: clamp(24px, 3.5vw, 50px);
          }

          .letter-play-landscape .slp-balloon-btn {
            max-width: 240px;
          }

          .letter-play-landscape .slp-balloon-body {
            width: clamp(170px, 18vw, 260px);
            height: clamp(200px, 22vw, 300px);
          }
        }

        @media (orientation: landscape) and (max-width: 900px) {
          .letter-play-landscape.letter-play-wrapper .slp-vowel-bar {
            padding: 6px 8px;
            gap: 6px;
          }

          .letter-play-landscape.letter-play-wrapper .slp-vowel-chip {
            min-width: 48px;
            height: 48px;
            font-size: 18px;
            border-width: 3px;
          }

          .letter-play-landscape.letter-play-wrapper .slp-cat-chip {
            min-width: 78px !important;
            height: 48px;
            border-radius: 18px !important;
            font-size: 13px !important;
            padding: 0 10px !important;
          }

          .letter-play-landscape.slp-root {
            grid-template-columns: minmax(170px, 26%) minmax(240px, 1fr) minmax(180px, 28%);
            gap: 8px;
            padding: 8px;
          }

          .letter-play-landscape .slp-progress-row {
            gap: 7px;
          }

          .letter-play-landscape .slp-prog-dot {
            width: 18px;
            height: 18px;
            border-width: 3px;
          }

          .letter-play-landscape .slp-hint-card {
            border-radius: 24px;
            border-width: 4px;
            padding: 10px;
          }

          .letter-play-landscape .slp-hint-emoji {
            font-size: clamp(72px, 15vw, 130px);
          }

          .letter-play-landscape .slp-hint-word {
            font-size: clamp(22px, 4vw, 38px);
          }

          .letter-play-landscape .slp-first-char {
            border-radius: 14px;
            font-size: clamp(30px, 5vw, 50px);
          }

          .letter-play-landscape .slp-syllable-target {
            font-size: clamp(70px, 14vw, 140px);
          }

          .letter-play-landscape .slp-balloon-body {
            width: clamp(94px, 15vw, 140px);
            height: clamp(114px, 18vw, 166px);
          }

          .letter-play-landscape .slp-balloon-letter {
            font-size: clamp(44px, 7vw, 72px);
          }

          .letter-play-landscape .slp-balloon-string {
            height: 28px;
          }

          .letter-play-landscape .slp-syllable-grid {
            gap: 8px;
            padding: 10px;
          }

          .letter-play-landscape .slp-syl-cell {
            width: 54px;
            height: 54px;
            border-radius: 16px;
            font-size: 30px;
          }

          .letter-play-landscape .slp-icon-btn {
            width: 72px;
            height: 72px;
            font-size: 32px;
            border-width: 4px;
          }
        }

        @media (max-width: 430px) {
          .slp-vowel-chip { min-width: 62px; height: 62px; font-size: 22px; }
          .slp-balloon-body { width: clamp(115px, 32vw, 160px); height: clamp(140px, 38vw, 190px); }
          .slp-icon-btn { width: 85px; height: 85px; font-size: 38px; }
        }
      `;
      document.head.appendChild(style);
    },

    // ─── TTS ────────────────────────────────────────────────
    _speak(text) {
      return;
    },
    _say(text, force = false) {
      return;
    },

    // ─── 배경 도트 & 파티클 ───────────────────────────────────────────
    _renderBgDots(root) {
      const colors = ['#ffb3d9','#ffe082','#b3e5fc','#c8e6c9','#d1c4e9'];
      for (let i = 0; i < 15; i++) {
        const dot = document.createElement('div');
        dot.className = 'slp-bg-dot';
        const size = 15 + Math.random() * 20;
        Object.assign(dot.style, {
          width: `${size}px`, height: `${size}px`, background: colors[i % colors.length],
          top: `${Math.random() * 90}%`, left: `${Math.random() * 90}%`,
          animationDelay: `${Math.random() * 4}s`, animationDuration: `${3 + Math.random() * 4}s`
        });
        root.appendChild(dot);
      }
    },

    _spawnParticles(root, x, y, color) {
      for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'slp-particle';
        p.style.background = i % 3 === 0 ? '#FFF59D' : color;
        p.style.left = `${x}px`; p.style.top = `${y}px`;
        const size = Math.random() * 20 + 10;
        p.style.width = `${size}px`; p.style.height = `${size}px`;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 180 + 50;
        p.style.setProperty('--pdx', `${Math.cos(angle) * dist}px`);
        p.style.setProperty('--pdy', `${Math.sin(angle) * dist}px`);
        root.appendChild(p);
        const t = setTimeout(() => p.remove(), 800);
        this._timers.push(t);
      }
    },

    _flashScreen(root) {
      root.classList.remove('slp-mega-flash', 'slp-shake');
      void root.offsetWidth;
      root.classList.add('slp-mega-flash', 'slp-shake');
    },

    _createGoldenRing(root, x, y) {
      const ring = document.createElement('div');
      ring.className = 'slp-golden-ring';
      ring.style.left = `${x}px`; ring.style.top = `${y}px`;
      root.appendChild(ring);
      const t = setTimeout(() => ring.remove(), 800);
      this._timers.push(t);
    },

    // ════════════════════════════════════════════════════════
    //  모음 선택바 렌더
    // ════════════════════════════════════════════════════════
    _renderVowelBar(container) {
      const bar = document.createElement('div');
      bar.className = 'slp-vowel-bar';

      // ── 단어 카테고리 칩 ──
      Object.keys(this._wordCategories).forEach(cat => {
        const chip = document.createElement('button');
        chip.className = 'slp-vowel-chip slp-cat-chip' + (this._selectedVowel === null && this._selectedCategory === cat ? ' active' : '');
        chip.textContent = cat;
        chip.style.cssText = 'min-width:100px; border-radius:25px; font-size:18px; padding:0 15px;';
        chip.addEventListener('click', () => {
          this._initAudio();
          this._selectedVowel    = null;
          this._selectedCategory = cat;
          this._startGame();
        });
        bar.appendChild(chip);
      });

      const sep = document.createElement('div');
      sep.style.cssText = 'width:4px;height:35px;background:rgba(0,0,0,0.1);border-radius:2px;flex-shrink:0;margin:0 5px;';
      bar.appendChild(sep);

      // ── 모음 칩 ──
      this._vowelData.forEach(({ key }) => {
        const chip = document.createElement('button');
        chip.className = 'slp-vowel-chip' + (this._selectedVowel === key ? ' active' : '');
        chip.textContent = key;
        chip.addEventListener('click', () => {
          this._initAudio();
          this._selectedVowel = key;
          this._startGame();
        });
        bar.appendChild(chip);
      });

      container.appendChild(bar);
    },

    _renderMain(container) {
      const existing = container.querySelector('.slp-root');
      if (existing) existing.remove();

      if (this._selectedVowel === null) this._renderWordGame(container);
      else this._renderSyllableGame(container);
    },

    // ════════════════════════════════════════════════════════
    //  모드 A: 단어 게임
    // ════════════════════════════════════════════════════════
    _renderWordGame(container) {
      const s = this._state;
      const root = document.createElement('div');
      root.className = `slp-root ${this._getLayoutClass()}`;
      this._renderBgDots(root);

      const progRow = document.createElement('div');
      progRow.className = 'slp-progress-row';
      for (let i = 0; i < s.totalRounds; i++) {
        const d = document.createElement('span');
        d.className = 'slp-prog-dot' + (i < s.roundIndex ? ' done' : i === s.roundIndex ? ' active' : '');
        progRow.appendChild(d);
      }
      root.appendChild(progRow);

      const round = s.rounds[s.roundIndex];
      const hiddenTail = round.word.length > 1 ? round.word.slice(1) : '';
      
      const hintCard = document.createElement('div');
      hintCard.className = 'slp-hint-card';
      hintCard.innerHTML = `
        <span class="slp-hint-emoji">${round.emoji}</span>
        <div class="slp-hint-word"><span class="slp-first-char">${round.answer}</span>${hiddenTail}</div>
      `;
      hintCard.addEventListener('click', () => { this._initAudio(); this._say(`시현아, ${round.answer} 글자를 찾아봐!`, true); });
      root.appendChild(hintCard);

      root.appendChild(this._buildBalloons(root, round.choices, round.answer, 'word', round));
      container.appendChild(root);
      this._applyLayoutClass();

      const t = setTimeout(() => {
        playGameVoice('games.letter.question');
        this._say(`시현아! ${round.word}! '${round.answer}' 풍선을 팡! 터뜨려볼까?`, false);
      }, 400);
      this._timers.push(t);
    },

    // ════════════════════════════════════════════════════════
    //  모드 B: 음절 게임
    // ════════════════════════════════════════════════════════
    _renderSyllableGame(container) {
      const s   = this._state;
      const row = this._vowelData.find(v => v.key === this._selectedVowel);
      if (!row) return;

      const root = document.createElement('div');
      root.className = `slp-root ${this._getLayoutClass()}`;
      this._renderBgDots(root);

      const progRow = document.createElement('div');
      progRow.className = 'slp-progress-row';
      for (let i = 0; i < s.totalRounds; i++) {
        const d = document.createElement('span');
        d.className = 'slp-prog-dot' + (i < s.roundIndex ? ' done' : i === s.roundIndex ? ' active' : '');
        progRow.appendChild(d);
      }
      root.appendChild(progRow);

      const target = s.rounds[s.roundIndex].answer;
      const hintCard = document.createElement('div');
      hintCard.className = 'slp-hint-card';
      hintCard.innerHTML = `<div class="slp-syllable-target">${target}</div>`;
      hintCard.addEventListener('click', () => { this._initAudio(); this._say(`시현아! ${target} 글자를 찾아봐!`, true); });
      root.appendChild(hintCard);

      const choices = this._pickSyllableChoices(row.syllables, target, 3);
      root.appendChild(this._buildBalloons(root, choices, target, 'syllable', null));
      container.appendChild(root);
      this._applyLayoutClass();

      const t = setTimeout(() => {
        this._say(`시현아! '${target}' 풍선을 팡! 터뜨려보자!`, true);
      }, 400);
      this._timers.push(t);
    },

    _pickSyllableChoices(syllables, target, count) {
      const others = syllables.filter(s => s !== target).sort(() => Math.random() - 0.5);
      const pool   = [target, ...others.slice(0, count - 1)];
      return pool.sort(() => Math.random() - 0.5);
    },

    _buildBalloons(root, choices, answer, mode, round) {
      const area = document.createElement('div');
      area.className = 'slp-balloons-area';
      const wrongColors = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
      let wrongColorIndex = 0;

      choices.forEach((letter) => {
        const btn = document.createElement('button');
        btn.className = 'slp-balloon-btn';
        btn.dataset.letter = letter;

        const body = document.createElement('div');
        const color = letter === answer ? 0 : wrongColors[wrongColorIndex++ % wrongColors.length];
        body.className = `slp-balloon-body slp-balloon-color-${color}`;
        body.innerHTML = `<span class="slp-balloon-letter">${letter}</span>`;

        const string = document.createElement('div');
        string.className = 'slp-balloon-string';
        
        btn.appendChild(body);
        btn.appendChild(string);
        area.appendChild(btn);

        btn.addEventListener('click', () => {
          this._initAudio();
          if (mode === 'syllable') this._onSyllableClick(btn, letter, root);
          else this._onWordClick(btn, letter, root, round);
        });
      });

      return area;
    },

    _onWordClick(btn, letter, root, round) {
      if (this._state.locked) return;
      if (letter === round.answer) {
        this._state.locked = true;
        this._handleCorrect(btn, letter, round.word, root, () => {
          this._state.score++;
          if (!this._successRewardGiven) {
            this._successRewardGiven = true;
            this._options?.gainExp?.(15);
          }
          const t = setTimeout(() => {
            this._state.roundIndex++;
            this._state.wrongCount = 0;
            this._state.locked = false;
            this._successRewardGiven = false;
            if (this._state.roundIndex >= this._state.totalRounds) this._showWordFinalResult();
            else this._renderMain(this._container);
          }, 1800); // 딜레이 대폭 단축
          this._timers.push(t);
        });
      } else {
        this._handleWrong(btn, root, round.answer, round.word);
      }
    },

    _onSyllableClick(btn, letter, root) {
      if (this._state.locked) return;
      const target = this._state.rounds[this._state.roundIndex].answer;
      if (letter === target) {
        this._state.locked = true;
        this._handleCorrect(btn, letter, null, root, () => {
          this._state.score++;
          if (!this._successRewardGiven) {
            this._successRewardGiven = true;
            this._options?.gainExp?.(10);
          }
          const t = setTimeout(() => this._advanceSyllable(), 1500); // 딜레이 단축
          this._timers.push(t);
        });
      } else {
        this._handleWrong(btn, root, target, null);
      }
    },

    _handleCorrect(btn, letter, word, root, cb) {
      btn.classList.add('correct');
      if (navigator.vibrate) try { navigator.vibrate([100, 50, 100]); } catch(e) {}
      
      this._playTone('pop');
      this._flashScreen(root);

      const rect  = btn.getBoundingClientRect();
      const cRect = this._container.getBoundingClientRect();
      const cx = rect.left - cRect.left + rect.width  / 2;
      const cy = rect.top  - cRect.top  + rect.height / 2;
      
      this._spawnParticles(root, cx, cy, '#ff4e88');
      this._createGoldenRing(root, cx, cy);

      playGameVoice('games.letter.correct');
      
      // 시현이 맞춤 칭찬 멘트
      if (word) {
        this._say(`우와! 시현이가 ${letter} 찾았다! ${word}!`, true);
      } else {
        this._say(`우와! 시현이가 ${letter} 찾았다!`, true);
      }
      
      cb();
    },

    _handleWrong(btn, root, correctAnswer, word) {
      if (btn.classList.contains('wrong')) return;
      btn.classList.add('wrong');
      if (navigator.vibrate) try { navigator.vibrate([50, 50]); } catch(e) {}
      this._state.wrongCount++;
      this._playTone('wrong');
      playGameVoice('games.letter.wrong');

      // 1회 오답만으로도 바로 강력 힌트 발동 (4살 맞춤 관대함)
      if (this._state.wrongCount >= 1) {
        root.querySelectorAll('.slp-balloon-btn').forEach(b => {
          if (b.dataset.letter === correctAnswer) b.classList.add('hint-glow');
        });
        this._say(`시현아! 빛나는 ${correctAnswer} 풍선을 눌러보자!`, true);
      } else {
        this._say(`어라? 이건 ${btn.dataset.letter}야. 다시 찾아볼까?`, true);
      }

      const t = setTimeout(() => {
        btn.classList.remove('wrong');
        this._state.locked = false;
      }, 600);
      this._timers.push(t);
    },

    _advanceSyllable() {
      const s = this._state;
      s.roundIndex++;
      s.wrongCount = 0;
      s.locked     = false;
      this._successRewardGiven = false;

      if (s.roundIndex >= s.totalRounds) this._showSyllableComplete();
      else this._renderMain(this._container);
    },

    _showSyllableComplete() {
      const s = this._state;
      const root = this._container.querySelector('.slp-root');
      if (!root) return;

      const overlay = document.createElement('div');
      overlay.className = 'slp-overlay';

      const trophy = document.createElement('div');
      trophy.className = 'slp-result-emoji';
      trophy.textContent = '🏆';
      overlay.appendChild(trophy);

      // ★ 5라운드에 맞춘 큰 그리드
      const grid = document.createElement('div');
      grid.className = 'slp-syllable-grid';
      s.rounds.forEach((r, i) => {
        const cell = document.createElement('div');
        cell.className = `slp-syl-cell ${i < s.score ? 'learned' : 'missed'}`;
        cell.textContent = r.answer;
        cell.style.animationDelay = `${i * 0.1}s`;
        grid.appendChild(cell);
      });
      overlay.appendChild(grid);

      const btnRow = document.createElement('div');
      btnRow.className = 'slp-icon-btn-row';

      const replayBtn = document.createElement('button');
      replayBtn.className = 'slp-icon-btn slp-btn-replay';
      replayBtn.textContent = '🔁';
      replayBtn.addEventListener('click', () => { this._startGame(); });
      btnRow.appendChild(replayBtn);

      const homeBtn = document.createElement('button');
      homeBtn.className = 'slp-icon-btn slp-btn-home';
      homeBtn.textContent = '🏠';
      homeBtn.addEventListener('click', () => this._options?.closeToParkHome?.());
      btnRow.appendChild(homeBtn);

      overlay.appendChild(btnRow);
      root.appendChild(overlay);

      if (!this._completeRewardGiven) {
        this._completeRewardGiven = true;
        playGameVoice('games.letter.complete');
        this._say(`우와! 시현이가 글자 풍선을 전부 다 터뜨렸어! 최고야!`, true);
        this._playTone('complete');
        this._options?.fireConfetti?.();
        this._options?.gainExp?.(30);
      }
    },

    _showWordFinalResult() {
      const container = this._container;
      const s = this._state;
      const existing = container.querySelector('.slp-root');
      if (existing) existing.remove();

      const root = document.createElement('div');
      root.className = `slp-root ${this._getLayoutClass()}`;
      this._renderBgDots(root);

      const overlay = document.createElement('div');
      overlay.className = 'slp-overlay';

      const trophy = document.createElement('div');
      trophy.className = 'slp-result-emoji';
      trophy.textContent = '🏆';
      overlay.appendChild(trophy);

      // 5개의 이모지를 크고 화려하게 표시
      const grid = document.createElement('div');
      grid.className = 'slp-syllable-grid';
      s.rounds.forEach((r, i) => {
        const cell = document.createElement('div');
        cell.className = 'slp-syl-cell learned';
        cell.textContent = r.emoji;
        cell.style.animationDelay = `${i * 0.1}s`;
        cell.style.background = '#fff';
        cell.style.border = '4px solid #ff4e88';
        grid.appendChild(cell);
      });
      overlay.appendChild(grid);

      const btnRow = document.createElement('div');
      btnRow.className = 'slp-icon-btn-row';

      const retryBtn = document.createElement('button');
      retryBtn.className = 'slp-icon-btn slp-btn-replay';
      retryBtn.textContent = '🔁';
      retryBtn.addEventListener('click', () => this._startGame());
      btnRow.appendChild(retryBtn);

      const homeBtn = document.createElement('button');
      homeBtn.className = 'slp-icon-btn slp-btn-home';
      homeBtn.textContent = '🏠';
      homeBtn.addEventListener('click', () => this._options?.closeToParkHome?.());
      btnRow.appendChild(homeBtn);

      overlay.appendChild(btnRow);
      root.appendChild(overlay);
      container.appendChild(root);
      this._applyLayoutClass();

      if (!this._completeRewardGiven) {
        this._completeRewardGiven = true;
        playGameVoice('games.letter.complete');
        this._say(`우와! 시현이가 낱말 풍선을 전부 다 터뜨렸어! 진짜 잘한다!`, true);
        this._playTone('complete');
        this._options?.fireConfetti?.();
        this._options?.gainExp?.(40);
      }
    },

    _startGame() {
      this._timers.forEach(t => clearTimeout(t));
      this._timers = [];
      this._successRewardGiven = false;
      this._completeRewardGiven = false;

      if (this._selectedVowel === null) {
        const pool = this._wordCategories[this._selectedCategory] || [];
        const shuffled = pool
          .map(r => ({ ...r, choices: [...r.choices].sort(() => Math.random() - 0.5) }))
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(this.ROUND_LIMIT, pool.length));
        this._state = {
          mode: 'word', roundIndex: 0, totalRounds: shuffled.length,
          score: 0, locked: false, wrongCount: 0, rounds: shuffled
        };
      } else {
        const row = this._vowelData.find(v => v.key === this._selectedVowel);
        const rounds = [...row.syllables]
          .sort(() => Math.random() - 0.5)
          .slice(0, this.ROUND_LIMIT)
          .map(s => ({ answer: s }));
        this._state = {
          mode: 'syllable', roundIndex: 0, totalRounds: rounds.length,
          score: 0, locked: false, wrongCount: 0, rounds
        };
      }

      playGameVoice('games.letter.intro');
      this._renderMain(this._container);
    },

    render(container, options = {}) {
      this.destroy();
      container.innerHTML = '';

      const wrapper = document.createElement('div');
      wrapper.id = 'slpWrapper';
      wrapper.className = `letter-play-wrapper ${this._getLayoutClass()}`;
      container.appendChild(wrapper);

      this._container     = wrapper;
      this._options       = options;
      this._timers        = [];
      this._layoutMode    = this._getLayoutMode();
      this._successRewardGiven = false;
      this._completeRewardGiven = false;

      this._initAudio();
      this._injectStyle();
      this._bindResizeEvents();
      this._renderVowelBar(wrapper);
      this._startGame();
    },

    destroy() {
      this._timers.forEach(t => clearTimeout(t));
      this._timers = [];
      if (this._resizeTimer) {
        clearTimeout(this._resizeTimer);
        this._resizeTimer = null;
      }
      this._unbindResizeEvents();
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
      if (this._audioCtx && this._audioCtx.state !== 'closed') {
        this._audioCtx.close().catch?.(() => {});
        this._audioCtx = null;
      }
      const prev = document.getElementById(LETTER_PLAY_STYLE_ID);
      if (prev) prev.remove();
      if (this._container) this._container.innerHTML = '';
      this._state         = null;
      this._container     = null;
      this._options       = null;
      this._layoutMode    = 'portrait';
      this._successRewardGiven = false;
      this._completeRewardGiven = false;
    }
  };
})();