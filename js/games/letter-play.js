/**
 * 시현이 놀이터 OS — 글자놀이터 미니게임 v5 (유아 몰입형 터치 업그레이드)
 * 파일: js/games/letter-play.js
 *
 * 모드 A (기본): 그림과 글자를 보고 같은 글자 풍선 터뜨리기
 * 모드 B (음절): 모음 선택 → 5문제 짧은 라운드 학습
 */

window.SihyeonGames = window.SihyeonGames || {};

function playGameVoice(id) {
  if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
    window.SihyeonVoice.play(id).catch(() => {});
  }
}

window.SihyeonGames.letterPlay = {
  id: 'letterPlay',
  title: '🎈',

  ROUND_LIMIT: 5,

  _state:        null,
  _timers:       [],
  _container:    null,
  _options:      null,
  _selectedVowel: null,   // null = 단어 모드, 'ㅏ' 등 = 음절 모드
  _selectedCategory: '🚗탈것',  // // [수정본] 기본값 설정

  // ─── 모음별 음절 데이터 (14음절 × 10행) ────────────────
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

  // // [수정본] _wordRounds 제거 및 _wordCategories 카테고리별 객체로 교체
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
      { emoji:'🛵', word:'오토바이',answer:'오', choices:['오','도','보'] },
      { emoji:'🚜', word:'포크레인',answer:'포', choices:['포','코','보'] },
      { emoji:'🛻', word:'트럭',   answer:'트', choices:['트','크','프'] },
      { emoji:'🚐', word:'미니버스',answer:'미', choices:['미','비','피'] },
    ],
    '🐶동물':  [
      { emoji:'🦕', word:'공룡',   answer:'공', choices:['공','동','봉'] },
      { emoji:'🦖', word:'티라노', answer:'티', choices:['티','키','피'] },
      { emoji:'🐶', word:'강아지', answer:'강', choices:['강','방','당'] },
      { emoji:'🐱', word:'고양이', answer:'고', choices:['고','도','소'] },
      { emoji:'🐭', word:'쥐',     answer:'쥐', choices:['쥐','뒤','귀'] },
      { emoji:'🐹', word:'햄스터', answer:'햄', choices:['햄','탬','잼'] },
      { emoji:'🐰', word:'토끼',   answer:'토', choices:['토','고','노'] },
      { emoji:'🐸', word:'개구리', answer:'개', choices:['개','새','배'] },
      { emoji:'🐘', word:'코끼리', answer:'코', choices:['코','모','보'] },
      { emoji:'🦁', word:'사자',   answer:'사', choices:['사','나','다'] },
      { emoji:'🐯', word:'호랑이', answer:'호', choices:['호','보','소'] },
      { emoji:'🐼', word:'판다',   answer:'판', choices:['판','반','난'] },
      { emoji:'🐨', word:'코알라', answer:'코', choices:['코','도','보'] },
      { emoji:'🦒', word:'기린',   answer:'기', choices:['기','미','피'] },
      { emoji:'🦓', word:'얼룩말', answer:'얼', choices:['얼','걸','털'] },
      { emoji:'🐧', word:'펭귄',   answer:'펭', choices:['펭','멩','벵'] },
      { emoji:'🦆', word:'오리',   answer:'오', choices:['오','도','소'] },
      { emoji:'🐔', word:'닭',     answer:'닭', choices:['닭','달','담'] },
      { emoji:'🐢', word:'거북이', answer:'거', choices:['거','서','너'] },
      { emoji:'🐠', word:'물고기', answer:'물', choices:['물','불','풀'] },
      { emoji:'🦈', word:'상어',   answer:'상', choices:['상','방','당'] },
      { emoji:'🐳', word:'고래',   answer:'고', choices:['고','조','노'] },
      { emoji:'🦋', word:'나비',   answer:'나', choices:['나','다','라'] },
      { emoji:'🐝', word:'벌',     answer:'벌', choices:['벌','걸','털'] },
      { emoji:'🐞', word:'무당벌레',answer:'무', choices:['무','두','누'] },
    ],
    '🍎음식':  [
      { emoji:'🍎', word:'사과',   answer:'사', choices:['사','바','타'] },
      { emoji:'🍌', word:'바나나', answer:'바', choices:['바','파','타'] },
      { emoji:'🍓', word:'딸기',   answer:'딸', choices:['딸','말','발'] },
      { emoji:'🍇', word:'포도',   answer:'포', choices:['포','보','소'] },
      { emoji:'🍊', word:'귤',     answer:'귤', choices:['귤','굴','쥴'] },
      { emoji:'🍋', word:'레몬',   answer:'레', choices:['레','메','세'] },
      { emoji:'🍉', word:'수박',   answer:'수', choices:['수','두','부'] },
      { emoji:'🍑', word:'복숭아', answer:'복', choices:['복','독','목'] },
      { emoji:'🍍', word:'파인애플',answer:'파', choices:['파','나','바'] },
      { emoji:'🥝', word:'키위',   answer:'키', choices:['키','피','미'] },
      { emoji:'🍦', word:'아이스크림',answer:'아',choices:['아','오','이'] },
      { emoji:'🎂', word:'케이크', answer:'케', choices:['게','케','데'] },
      { emoji:'🍕', word:'피자',   answer:'피', choices:['피','미','비'] },
      { emoji:'🍜', word:'라면',   answer:'라', choices:['라','나','다'] },
      { emoji:'🍙', word:'주먹밥', answer:'주', choices:['주','두','부'] },
      { emoji:'🍰', word:'조각케이크',answer:'조',choices:['조','보','도'] },
      { emoji:'🧁', word:'머핀',   answer:'머', choices:['머','서','너'] },
      { emoji:'🍩', word:'도너츠', answer:'도', choices:['도','보','소'] },
      { emoji:'🍫', word:'초콜릿', answer:'초', choices:['초','소','도'] },
      { emoji:'🍭', word:'사탕',   answer:'사', choices:['사','바','가'] },
      { emoji:'🥛', word:'우유',   answer:'우', choices:['우','두','무'] },
      { emoji:'🧃', word:'주스',   answer:'주', choices:['주','두','무'] },
      { emoji:'🍚', word:'밥',     answer:'밥', choices:['밥','탑','납'] },
      { emoji:'🥚', word:'계란',   answer:'계', choices:['계','세','네'] },
      { emoji:'🧀', word:'치즈',   answer:'치', choices:['치','미','비'] },
    ],
    '🏠생활':  [
      { emoji:'🏠', word:'집',     answer:'집', choices:['집','힙','십'] },
      { emoji:'🛁', word:'목욕',   answer:'목', choices:['목','독','복'] },
      { emoji:'🪥', word:'칫솔',   answer:'칫', choices:['칫','밋','깃'] },
      { emoji:'🛏️', word:'침대',   answer:'침', choices:['침','심','김'] },
      { emoji:'🪑', word:'의자',   answer:'의', choices:['의','이','우'] },
      { emoji:'📺', word:'텔레비전',answer:'텔', choices:['텔','멜','벨'] },
      { emoji:'📱', word:'휴대폰', answer:'휴', choices:['휴','류','뮤'] },
      { emoji:'💡', word:'전구',   answer:'전', choices:['전','천','선'] },
      { emoji:'🪟', word:'창문',   answer:'창', choices:['창','방','당'] },
      { emoji:'🚪', word:'문',     answer:'문', choices:['문','군','눈'] },
    ],
    '🎮놀이':  [
      { emoji:'⚽', word:'축구',   answer:'축', choices:['축','국','죽'] },
      { emoji:'🏊', word:'수영',   answer:'수', choices:['수','부','두'] },
      { emoji:'🎠', word:'놀이터', answer:'놀', choices:['놀','볼','골'] },
      { emoji:'🧩', word:'퍼즐',   answer:'퍼', choices:['퍼','머','버'] },
      { emoji:'🎈', word:'풍선',   answer:'풍', choices:['풍','붕','중'] },
      { emoji:'🎵', word:'노래',   answer:'노', choices:['노','도','보'] },
      { emoji:'🎨', word:'그림',   answer:'그', choices:['그','크','프'] },
      { emoji:'🪀', word:'요요',   answer:'요', choices:['요','소','도'] },
      { emoji:'🎯', word:'다트',   answer:'다', choices:['다','바','사'] },
      { emoji:'🎪', word:'서커스', answer:'서', choices:['서','어','너'] },
      { emoji:'🎢', word:'롤러코스터',answer:'롤',choices:['롤','몰','골'] },
      { emoji:'🎡', word:'회전목마',answer:'회', choices:['회','외','왜'] },
    ],
    '🌈자연':  [
      { emoji:'🌙', word:'달',     answer:'달', choices:['달','말','살'] },
      { emoji:'⭐', word:'별',     answer:'별', choices:['별','열','절'] },
      { emoji:'☀️', word:'해',     answer:'해', choices:['해','새','배'] },
      { emoji:'🌈', word:'무지개', answer:'무', choices:['무','구','부'] },
      { emoji:'🌺', word:'하늘',   answer:'하', choices:['하','나','가'] },
      { emoji:'🌊', word:'바다',   answer:'바', choices:['바','사','나'] },
      { emoji:'🌲', word:'나무',   answer:'나', choices:['나','다','가'] },
      { emoji:'🌸', word:'꽃',     answer:'꽃', choices:['꽃','못','솥'] },
      { emoji:'⛄', word:'눈사람', answer:'눈', choices:['눈','분','군'] },
      { emoji:'🌧️', word:'비',     answer:'비', choices:['비','미','피'] },
    ],
    '👨가족':  [
      { emoji:'👦', word:'어린이', answer:'어', choices:['어','서','너'] },
      { emoji:'👨', word:'아빠',   answer:'아', choices:['아','다','나'] },
      { emoji:'👩', word:'엄마',   answer:'엄', choices:['엄','염','점'] },
      { emoji:'👴', word:'할아버지',answer:'할', choices:['할','말','살'] },
      { emoji:'👵', word:'할머니', answer:'할', choices:['할','말','날'] },
      { emoji:'📚', word:'책',     answer:'책', choices:['책','색','맥'] },
      { emoji:'✏️', word:'연필',   answer:'연', choices:['연','현','천'] },
      { emoji:'🎒', word:'가방',   answer:'가', choices:['가','나','다'] },
      { emoji:'👟', word:'신발',   answer:'신', choices:['신','진','민'] },
      { emoji:'🧢', word:'모자',   answer:'모', choices:['모','보','소'] },
    ],
  },

  // ─── 스타일 ──────────────────────────────────────────────
  _injectStyle() {
    const STYLE_ID = 'sihyeon-letter-play-style';
    const prev = document.getElementById(STYLE_ID);
    if (prev) prev.remove();

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .slp-root {
        width: 100%; flex: 1; min-height: 0;
        display: flex; flex-direction: column; align-items: center;
        background: linear-gradient(160deg, #ffecd2 0%, #ffe0f0 40%, #d4f5ff 100%);
        overflow: hidden; position: relative;
        font-family: 'Arial Rounded MT Bold', 'Nanum Gothic', sans-serif;
        box-sizing: border-box; user-select: none;
      }

      /* ── 배경 도트 ── */
      .slp-bg-dot {
        position: absolute; border-radius: 50%; opacity: 0.18;
        pointer-events: none; animation: slp-float-dot 6s ease-in-out infinite;
      }
      @keyframes slp-float-dot {
        0%,100% { transform: translateY(0px) rotate(0deg); }
        50%      { transform: translateY(-18px) rotate(20deg); }
      }

      /* ════════════════════════════════════
         모음 선택바 (부모 영역)
      ════════════════════════════════════ */
      .slp-vowel-bar {
        width: 100%; flex-shrink: 0;
        background: rgba(255,255,255,0.9);
        box-shadow: 0 4px 16px rgba(0,0,0,0.10);
        padding: 10px 12px 9px;
        display: flex; align-items: center;
        gap: 8px; overflow-x: auto;
        scrollbar-width: none; box-sizing: border-box;
        border-bottom: 3px solid rgba(255,133,194,0.22);
        z-index: 20; position: relative;
      }
      .slp-vowel-bar::-webkit-scrollbar { display: none; }

      .slp-vowel-label {
        font-size: 11px; color: #bbb; font-weight: 700;
        white-space: nowrap; flex-shrink: 0; margin-right: 2px;
        letter-spacing: 0.5px;
      }

      /* // [수정본] 칩 높이, 폰트 키우기 */
      .slp-vowel-chip {
        flex-shrink: 0;
        min-width: 64px; height: 64px; font-size: 23px;
        border-radius: 50%; border: 4px solid rgba(255,133,194,0.38);
        background: rgba(255,255,255,0.96);
        font-weight: 900; color: #cc6699;
        cursor: pointer; display: grid; place-items: center;
        transition: all 0.2s; box-shadow: 0 6px 0 rgba(0,0,0,0.10), 0 10px 18px rgba(255,78,136,0.12);
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      .slp-vowel-chip:active { transform: translateY(5px) scale(0.96); box-shadow: 0 1px 0 rgba(0,0,0,0.08); }
      .slp-vowel-chip.active {
        background: linear-gradient(135deg,#ff85c2,#ff4e88);
        color: #fff; border-color: #ff4e88;
        box-shadow: 0 4px 0 rgba(255,78,136,0.35);
        transform: scale(1.1);
      }
      
      /* 카테고리 칩 활성화 색상 추가 (단어 모드용) */
      .slp-cat-chip.active {
        background: linear-gradient(135deg,#7ecfff,#38b6ff);
        color: #fff; border-color: #38b6ff;
        box-shadow: 0 4px 0 rgba(56,182,255,0.35);
      }

      /* ── 진행 도트 ── */
      .slp-progress-row {
        display: flex; gap: 8px; padding: 10px 12px 5px;
        flex-shrink: 0; justify-content: center; flex-wrap: wrap;
        max-width: 100%;
      }
      .slp-prog-dot {
        width: 22px; height: 22px; border-radius: 50%;
        background: rgba(0,0,0,0.12);
        border: 3px solid rgba(255,255,255,0.95);
        transition: background 0.3s, transform 0.3s;
        flex-shrink: 0;
        box-shadow: 0 3px 0 rgba(0,0,0,0.10);
      }
      .slp-prog-dot.done   { background: #ff85c2; }
      .slp-prog-dot.active {
        background: #ff4e88; transform: scale(1.3);
        box-shadow: 0 0 0 3px rgba(255,78,136,0.22);
      }

      /* ── 힌트 카드 (공용) ── */
      .slp-hint-card {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: rgba(255,255,255,0.82);
        border-radius: 28px;
        box-shadow: 0 8px 28px rgba(0,0,0,0.10), 0 2px 0 rgba(255,255,255,0.9) inset;
        padding: 12px 28px 10px;
        margin: 4px 12px 0;
        width: calc(100% - 24px); max-width: 360px;
        box-sizing: border-box; flex-shrink: 0;
        cursor: pointer; position: relative; overflow: hidden;
      }
      .slp-hint-card::before {
        content: ''; position: absolute; inset: 0; border-radius: 28px;
        border: 3px solid rgba(255,180,220,0.55); pointer-events: none;
      }

      /* 단어 모드 힌트 — 큰 그림 + 보이는 목표 글자 */
      .slp-mascot-row {
        width: 100%;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        margin-bottom: 4px;
        color: #9b4f75; font-size: clamp(14px, 3.8vw, 18px); font-weight: 900;
      }
      .slp-mascot-face {
        width: 34px; height: 34px; border-radius: 50%;
        display: grid; place-items: center;
        background: linear-gradient(135deg,#fff,#ffe4f5);
        border: 3px solid rgba(255,133,194,0.38);
        box-shadow: 0 3px 0 rgba(255,78,136,0.16);
        font-size: 19px;
      }
      .slp-question-line {
        margin-top: 6px; padding: 6px 12px;
        border-radius: 999px;
        background: rgba(255,255,255,0.72);
        color: #7b5063;
        font-size: clamp(14px, 4vw, 19px);
        font-weight: 900;
        line-height: 1.15;
      }
      .slp-hint-emoji {
        font-size: clamp(108px, 32vw, 176px); line-height: 1;
        animation: slp-emoji-bounce 2.1s ease-in-out infinite;
        filter: drop-shadow(0 12px 0 rgba(0,0,0,0.10));
      }
      @keyframes slp-emoji-bounce {
        0%,100% { transform: translateY(0) scale(1); }
        50%      { transform: translateY(-8px) scale(1.05); }
      }
      .slp-hint-word {
        font-size: clamp(26px, 7.6vw, 44px); font-weight: 900; color: #555;
        margin-top: 5px; letter-spacing: 3px;
        display: flex; align-items: baseline; justify-content: center;
      }
      .slp-first-char {
        min-width: 1.18em; height: 1.18em;
        border-radius: 18px;
        display: inline-grid; place-items: center;
        color: #fff; font-size: clamp(36px, 10.5vw, 60px);
        background: linear-gradient(135deg,#ff85c2,#ff4e88);
        text-shadow: 0 2px 0 rgba(0,0,0,0.14);
        box-shadow: 0 6px 0 rgba(255,78,136,0.22), 0 0 0 4px rgba(255,255,255,0.75);
        animation: slp-first-pulse 2s ease-in-out infinite;
        margin-right: 3px;
      }
      @keyframes slp-first-pulse {
        0%,100% { transform: scale(1); }
        50%      { transform: scale(1.15); }
      }

      /* ════════════════════════════════════
         음절 모드 힌트 카드
      ════════════════════════════════════ */
      .slp-syllable-target {
        font-size: clamp(72px, 22vw, 120px);
        font-weight: 900; color: #ff4e88; line-height: 1;
        text-shadow: 0 4px 0 rgba(255,78,136,0.18);
        animation: slp-syl-pulse 1.8s ease-in-out infinite;
      }
      @keyframes slp-syl-pulse {
        0%,100% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(255,78,136,0)); }
        50%      { transform: scale(1.07); filter: drop-shadow(0 0 12px rgba(255,78,136,0.4)); }
      }
      .slp-syllable-sub {
        font-size: clamp(16px, 4.5vw, 22px); color: #bbb; font-weight: 700;
        margin-top: 2px; letter-spacing: 3px;
      }

      /* ── 풍선 영역 ── */
      .slp-balloons-area {
        flex: 1; display: flex; align-items: center; justify-content: center;
        gap: clamp(12px, 4.8vw, 30px);
        width: 100%; padding: 2px 12px 8px; box-sizing: border-box; min-height: 0;
      }

      .slp-balloon-btn {
        display: flex; flex-direction: column; align-items: center;
        position: relative; cursor: pointer;
        background: none; border: none; padding: 0; outline: none;
        -webkit-tap-highlight-color: transparent;
        flex: 1; max-width: 154px; min-height: 198px;
        animation: slp-balloon-float 2.6s ease-in-out infinite;
        touch-action: manipulation;
      }
      .slp-balloon-btn:nth-child(2) { animation-delay: -1s; }
      .slp-balloon-btn:nth-child(3) { animation-delay: -2s; }
      @keyframes slp-balloon-float {
        0%,100% { transform: translateY(0px) rotate(-2deg); }
        50%      { transform: translateY(-14px) rotate(2deg); }
      }

      /* 힌트 글로우 (2회 오답 후) */
      .slp-balloon-btn.hint-glow .slp-balloon-body {
        animation: slp-hint-glow 0.65s ease-in-out infinite alternate !important;
      }
      @keyframes slp-hint-glow {
        from { filter: brightness(1)   drop-shadow(0 0 3px rgba(255,255,255,0.3)); }
        to   { filter: brightness(1.25) drop-shadow(0 0 18px rgba(255,255,255,1));  }
      }

      /* // [수정본] 풍선 및 글자 크기 확대 */
      .slp-balloon-body {
        width: clamp(118px, 31vw, 176px); height: clamp(142px, 38vw, 212px);
        border-radius: 50% 50% 50% 50% / 55% 55% 45% 45%;
        display: flex; align-items: center; justify-content: center;
        position: relative; transition: transform 0.15s;
        box-shadow: 6px 12px 30px rgba(0,0,0,0.2), -8px -8px 0 0 rgba(255,255,255,0.23) inset, 0 0 0 5px rgba(255,255,255,0.35);
      }
      .slp-balloon-btn:active .slp-balloon-body { transform: scale(0.92); }
      .slp-balloon-body::before {
        content: ''; position: absolute; top: 12%; left: 18%;
        width: 28%; height: 38%; background: rgba(255,255,255,0.52);
        border-radius: 50%; transform: rotate(-20deg); pointer-events: none;
      }
      .slp-balloon-body::after {
        content: ''; position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%);
        width: 0; height: 0;
        border-left: 6px solid transparent; border-right: 6px solid transparent;
        border-top: 10px solid currentColor; filter: brightness(0.7);
      }
      .slp-balloon-string {
        width: 2px; height: clamp(26px, 7vw, 40px);
        background: linear-gradient(to bottom,#aaa,#ccc); border-radius: 1px;
      }
      .slp-balloon-letter {
        font-size: clamp(50px, 14vw, 82px); font-weight: 900; color: white;
        text-shadow: 0 3px 10px rgba(0,0,0,0.28); z-index: 1; position: relative;
      }

      .slp-balloon-color-0 { background:linear-gradient(135deg,#ff7eb3,#ff4e88); color:#ff4e88; }
      .slp-balloon-color-1 { background:linear-gradient(135deg,#ffcc70,#ffaa00); color:#ffaa00; }
      .slp-balloon-color-2 { background:linear-gradient(135deg,#7ecfff,#38b6ff); color:#38b6ff; }
      .slp-balloon-color-3 { background:linear-gradient(135deg,#a78bfa,#7c3aed); color:#7c3aed; }
      .slp-balloon-color-4 { background:linear-gradient(135deg,#6ee7b7,#10b981); color:#10b981; }

      /* 정답/오답 */
      .slp-balloon-btn.correct .slp-balloon-body {
        animation: slp-pop 0.42s cubic-bezier(.34,1.56,.64,1) forwards !important;
      }
      @keyframes slp-pop {
        0%   { transform: scale(1);    opacity: 1; }
        34%  { transform: scale(1.62) rotate(8deg);  opacity: 0.92; }
        68%  { transform: scale(0.35) rotate(-10deg); opacity: 0.72; }
        100% { transform: scale(0);    opacity: 0; }
      }
      .slp-balloon-btn.correct .slp-balloon-string { opacity:0; transition:opacity 0.2s 0.2s; }
      .slp-balloon-btn.wrong .slp-balloon-body { animation: slp-shake 0.4s ease !important; }
      @keyframes slp-shake {
        0%,100% { transform: translateX(0) rotate(0); }
        20%     { transform: translateX(-8px) rotate(-5deg); }
        40%     { transform: translateX(8px) rotate(5deg); }
        60%     { transform: translateX(-6px) rotate(-3deg); }
        80%     { transform: translateX(6px) rotate(3deg); }
      }

      /* ★ 글자 각인 스탬프 */
      .slp-letter-stamp {
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%,-50%) scale(0);
        font-size: clamp(90px, 28vw, 150px); font-weight: 900;
        color: #ff4e88;
        text-shadow: 0 0 40px rgba(255,78,136,0.45), 0 4px 0 rgba(0,0,0,0.07);
        z-index: 300; pointer-events: none;
        animation: slp-stamp 1.1s cubic-bezier(.34,1.56,.64,1) forwards;
      }
      @keyframes slp-stamp {
        0%   { transform: translate(-50%,-50%) scale(0)    rotate(-15deg); opacity:1; }
        45%  { transform: translate(-50%,-50%) scale(1.1)  rotate(4deg);   opacity:1; }
        75%  { transform: translate(-50%,-50%) scale(0.95) rotate(0deg);   opacity:1; }
        100% { transform: translate(-50%,-62%) scale(0.8)  rotate(0deg);   opacity:0; }
      }

      /* 컨페티 */
      .slp-confetti-piece {
        position: absolute; width: 14px; height: 18px;
        border-radius: 4px; pointer-events: none;
        animation: slp-confetti-fall linear forwards; z-index: 100;
      }
      @keyframes slp-confetti-fall {
        0%   { opacity:1; transform:translateY(0) rotate(0deg) scale(1); }
        100% { opacity:0; transform:translateY(260px) rotate(720deg) scale(0.45); }
      }

      /* ── 오버레이 ── */
      .slp-overlay {
        position: absolute; inset: 0;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: rgba(255,255,255,0.9); backdrop-filter: blur(6px);
        z-index: 200; gap: 12px;
        animation: slp-fade-in 0.35s ease;
      }
      @keyframes slp-fade-in {
        from { opacity:0; transform:scale(0.96); }
        to   { opacity:1; transform:scale(1); }
      }
      .slp-result-emoji { font-size: clamp(68px,20vw,105px); animation: slp-pop-in 0.5s cubic-bezier(.34,1.56,.64,1); }
      @keyframes slp-pop-in {
        0%   { transform: scale(0.3) rotate(-15deg); }
        70%  { transform: scale(1.15) rotate(8deg); }
        100% { transform: scale(1) rotate(0deg); }
      }

      /* 정답 글자 카드 */
      .slp-answer-card {
        display: flex; flex-direction: column; align-items: center;
        background: linear-gradient(135deg,#fff0fb,#ffe4f5);
        border: 4px solid #ff85c2; border-radius: 24px;
        padding: 10px 30px;
        box-shadow: 0 6px 0 rgba(255,78,136,0.18);
        animation: slp-pop-in 0.5s 0.1s cubic-bezier(.34,1.56,.64,1) both;
      }
      .slp-answer-big  { font-size: clamp(52px,15vw,84px); font-weight:900; color:#ff4e88; line-height:1; }
      .slp-answer-word { font-size: clamp(16px,4.5vw,24px); color:#aaa; font-weight:700; letter-spacing:3px; margin-top:2px; }

      /* ════════════════════════════════════
         음절 모드 — 전체 음절 완료 그리드
      ════════════════════════════════════ */
      .slp-syllable-grid {
        display: grid; grid-template-columns: repeat(7, 1fr);
        gap: 6px; padding: 10px; max-width: 340px;
        animation: slp-pop-in 0.5s 0.15s cubic-bezier(.34,1.56,.64,1) both;
      }
      .slp-syl-cell {
        aspect-ratio: 1; border-radius: 12px;
        display: grid; place-items: center;
        font-size: clamp(16px, 4.5vw, 22px); font-weight: 900;
        animation: slp-sticker-appear 0.4s cubic-bezier(.34,1.56,.64,1) both;
      }
      .slp-syl-cell.learned { background: linear-gradient(135deg,#ff85c2,#ff4e88); color:#fff; }
      .slp-syl-cell.missed  { background: rgba(0,0,0,0.06); color:#ccc; }
      @keyframes slp-sticker-appear {
        0%   { transform: scale(0) rotate(-30deg); opacity:0; }
        100% { transform: scale(1) rotate(0deg);   opacity:1; }
      }

      /* 이모지 버튼 */
      .slp-icon-btn {
        width: 92px; height: 92px; font-size: 40px;
        border-radius: 50%; border: 6px solid #fff;
        box-shadow: 0 9px 0 rgba(0,0,0,0.14), 0 16px 24px rgba(0,0,0,0.12);
        cursor: pointer; display: grid; place-items: center;
        transition: transform 0.1s;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      .slp-icon-btn:active { transform: translateY(5px); box-shadow: 0 2px 0 rgba(0,0,0,0.13); }
      .slp-icon-btn-row { display: flex; gap: 18px; justify-content: center; }
      .slp-btn-next   { background: #ff85c2; }
      .slp-btn-replay { background: #4CAF50; }
      .slp-btn-home   { background: #FF9800; }

      /* 최종 결과 */
      .slp-result-stickers {
        display: flex; gap: 6px; flex-wrap: wrap;
        justify-content: center; max-width: 280px;
      }
      .slp-result-sticker {
        font-size: clamp(26px,8vw,40px);
        animation: slp-sticker-appear 0.4s cubic-bezier(.34,1.56,.64,1) both;
      }

      /* 발음 버튼 */
      .slp-speak-btn {
        width: 84px; height: 84px; border-radius: 50%;
        background: linear-gradient(180deg,#fff 0%,#fff0a8 100%); border: 5px solid rgba(255,255,255,0.96);
        box-shadow: 0 8px 0 rgba(255,160,0,0.24), 0 14px 22px rgba(0,0,0,0.10);
        cursor: pointer; font-size: 38px; display: grid; place-items: center;
        flex-shrink: 0; margin-top: 6px; transition: transform 0.1s;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      .slp-speak-btn:active { transform: scale(0.9); }

      .slp-reward-sticker {
        position: absolute;
        left: 50%; top: 43%;
        z-index: 340;
        width: clamp(112px, 30vw, 168px);
        height: clamp(112px, 30vw, 168px);
        border-radius: 36px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg,#ffffff 0%,#fff7b8 48%,#ffd1e8 100%);
        border: 7px solid #fff;
        box-shadow: 0 14px 0 rgba(255,122,26,0.22), 0 22px 46px rgba(0,0,0,0.2);
        font-size: clamp(64px, 18vw, 104px);
        pointer-events: none;
        animation: slp-reward-sticker 1.28s cubic-bezier(.2,1.45,.35,1) forwards;
      }
      @keyframes slp-reward-sticker {
        0%   { opacity: 0; transform: translate(-50%,-50%) scale(0.16) rotate(-22deg); }
        45%  { opacity: 1; transform: translate(-50%,-50%) scale(1.16) rotate(8deg); }
        78%  { opacity: 1; transform: translate(-50%,-50%) scale(1) rotate(0deg); }
        100% { opacity: 0; transform: translate(-50%,-68%) scale(0.86) rotate(0deg); }
      }
      .slp-tap-star {
        position:absolute;
        z-index:130;
        pointer-events:none;
        font-size:clamp(22px,7vw,38px);
        animation: slp-tap-star 0.82s ease-out forwards;
      }
      @keyframes slp-tap-star {
        0%   { opacity:1; transform:translate(0,0) scale(0.45) rotate(0deg); }
        100% { opacity:0; transform:translate(var(--tx),var(--ty)) scale(1.5) rotate(260deg); }
      }
      @media (max-width: 430px) {
        .slp-vowel-chip { min-width: 58px; height: 58px; font-size: 21px; }
        .slp-cat-chip { min-width: 86px !important; }
        .slp-balloon-btn { min-height: 178px; }
        .slp-balloon-body { width: clamp(108px, 30vw, 150px); height: clamp(130px, 36vw, 184px); }
        .slp-icon-btn { width: 84px; height: 84px; }
      }
    `;
    document.head.appendChild(style);
  },

  // ─── TTS ────────────────────────────────────────────────
  _speak(text) {
    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'ko-KR'; utt.rate = 0.82; utt.pitch = 1.2;
    speechSynthesis.speak(utt);
  },
  _say(text, force = false) {
    const fn = this._options?.speakGuide;
    if (typeof fn === 'function') fn(text, force);
    else this._speak(text);
  },
  // 글자 → 단어/반복 순으로 각인
  _sayLetterThenWord(letter, word) {
    this._speak(letter);
    const t = setTimeout(() => this._speak(`${letter}! ${word || letter}!`), 950);
    this._timers.push(t);
  },

  // ─── 배경 도트 ───────────────────────────────────────────
  _renderBgDots(root) {
    const colors = ['#ffb3d9','#ffe082','#b3e5fc','#c8e6c9','#d1c4e9'];
    const sizes  = [20,28,16,24,18,32,14];
    for (let i = 0; i < 10; i++) {
      const dot = document.createElement('div');
      dot.className = 'slp-bg-dot';
      const size = sizes[i % sizes.length];
      Object.assign(dot.style, {
        width: `${size}px`, height: `${size}px`,
        background: colors[i % colors.length],
        top: `${Math.random() * 90}%`, left: `${Math.random() * 90}%`,
        animationDelay: `${Math.random() * 4}s`,
        animationDuration: `${4 + Math.random() * 4}s`
      });
      root.appendChild(dot);
    }
  },

  // ─── 컨페티 ──────────────────────────────────────────────
  _burstConfetti(root, x, y) {
    const colors = ['#ff85c2','#ffcc70','#7ecfff','#a78bfa','#6ee7b7','#ff6b6b','#fff'];
    for (let i = 0; i < 32; i++) {
      const p = document.createElement('div');
      p.className = 'slp-confetti-piece';
      p.style.background = colors[i % colors.length];
      p.style.left = `${x - 5 + (Math.random() - 0.5) * 60}px`;
      p.style.top  = `${y - 7}px`;
      p.style.animationDuration = `${0.7 + Math.random() * 0.6}s`;
      root.appendChild(p);
      const t = setTimeout(() => p.remove(), 1400);
      this._timers.push(t);
    }
  },

  // ════════════════════════════════════════════════════════
  //  모음 선택바 렌더 (항상 상단에 위치)
  // ════════════════════════════════════════════════════════
  // // [수정본] 모음 선택바를 카테고리+모음 통합 선택바로 교체
  _renderVowelBar(container) {
    const bar = document.createElement('div');
    bar.className = 'slp-vowel-bar';
    bar.id = 'slpVowelBar';

    // ── 단어 카테고리 칩 ──
    Object.keys(this._wordCategories).forEach(cat => {
      const chip = document.createElement('button');
      chip.className = 'slp-vowel-chip slp-cat-chip'
        + (this._selectedVowel === null && this._selectedCategory === cat ? ' active' : '');
      chip.textContent = cat;
      chip.style.cssText = 'min-width:92px; min-height:64px; border-radius:22px; font-size:16px; padding:0 14px;';
      chip.addEventListener('click', () => {
        this._selectedVowel    = null;
        this._selectedCategory = cat;
        this._startGame();
      });
      bar.appendChild(chip);
    });

    // 구분선
    const sep = document.createElement('div');
    sep.style.cssText = 'width:2px;height:26px;background:rgba(0,0,0,0.12);flex-shrink:0;margin:0 4px;';
    bar.appendChild(sep);

    // ── 모음 칩 ──
    this._vowelData.forEach(({ key }) => {
      const chip = document.createElement('button');
      chip.className = 'slp-vowel-chip'
        + (this._selectedVowel === key ? ' active' : '');
      chip.textContent = key;
      chip.addEventListener('click', () => {
        this._selectedVowel = key;
        this._startGame();
      });
      bar.appendChild(chip);
    });

    container.appendChild(bar);
    return bar;
  },

  // ════════════════════════════════════════════════════════
  //  메인 렌더 진입
  // ════════════════════════════════════════════════════════
  _renderMain(container) {
    // 모음바 제외한 나머지 영역 초기화
    const existing = container.querySelector('.slp-root');
    if (existing) existing.remove();

    if (this._selectedVowel === null) {
      this._renderWordGame(container);
    } else {
      this._renderSyllableGame(container);
    }
  },

  // ════════════════════════════════════════════════════════
  //  모드 A: 단어 게임
  // ════════════════════════════════════════════════════════
  _renderWordGame(container) {
    const s = this._state;
    const root = document.createElement('div');
    root.className = 'slp-root';
    this._renderBgDots(root);

    // 진행 도트
    const progRow = document.createElement('div');
    progRow.className = 'slp-progress-row';
    for (let i = 0; i < s.totalRounds; i++) {
      const d = document.createElement('span');
      d.className = 'slp-prog-dot' +
        (i < s.roundIndex ? ' done' : i === s.roundIndex ? ' active' : '');
      progRow.appendChild(d);
    }
    root.appendChild(progRow);

    const round = s.rounds[s.roundIndex];

    // 힌트 카드 — 목표 글자를 그대로 보여주고 같은 글자 풍선을 찾게 유도
    const hiddenTail = round.word.length > 1 ? round.word.slice(1) : '';
    const hintCard = document.createElement('div');
    hintCard.className = 'slp-hint-card';
    hintCard.innerHTML = `
      <div class="slp-mascot-row">
        <span class="slp-mascot-face">🦊</span>
        <span>로나가 문제를 냈어요</span>
      </div>
      <span class="slp-hint-emoji">${round.emoji}</span>
      <div class="slp-hint-word">
        <span class="slp-first-char">${round.answer}</span>${hiddenTail}
      </div>
      <div class="slp-question-line">같은 글자 풍선을 찾아 톡!</div>
    `;
    hintCard.addEventListener('click', () => this._say(`${round.answer}! 같은 글자를 찾아봐!`, true));
    root.appendChild(hintCard);

    const speakBtn = document.createElement('button');
    speakBtn.className = 'slp-speak-btn';
    speakBtn.textContent = '🔊';
    speakBtn.addEventListener('click', () => this._say(`${round.word}! ${round.answer} 글자를 찾아봐!`, true));
    root.appendChild(speakBtn);

    // 풍선
    root.appendChild(this._buildBalloons(root, round.choices, round.answer, 'word', round));
    container.appendChild(root);

    const t = setTimeout(() => {
      playGameVoice('games.letter.question');
      this._say(`${round.answer}! 같은 글자 풍선을 톡 눌러봐!`, false);
    }, 350);
    this._timers.push(t);
  },

  // ════════════════════════════════════════════════════════
  //  모드 B: 음절 게임 (가~하)
  // ════════════════════════════════════════════════════════
  _renderSyllableGame(container) {
    const s   = this._state;
    const row = this._vowelData.find(v => v.key === this._selectedVowel);
    if (!row) return;

    const root = document.createElement('div');
    root.className = 'slp-root';
    this._renderBgDots(root);

    // 진행 도트 (14개)
    const progRow = document.createElement('div');
    progRow.className = 'slp-progress-row';
    for (let i = 0; i < s.totalRounds; i++) {
      const d = document.createElement('span');
      d.className = 'slp-prog-dot' +
        (i < s.roundIndex ? ' done' : i === s.roundIndex ? ' active' : '');
      progRow.appendChild(d);
    }
    root.appendChild(progRow);

    const target = s.rounds[s.roundIndex].answer;

    // 힌트 카드: 타겟 음절 크게
    const hintCard = document.createElement('div');
    hintCard.className = 'slp-hint-card';
    hintCard.innerHTML = `
      <div class="slp-syllable-target">${target}</div>
      <div class="slp-syllable-sub">${this._selectedVowel}</div>
    `;
    hintCard.addEventListener('click', () => this._say(target, true));
    root.appendChild(hintCard);

    const speakBtn = document.createElement('button');
    speakBtn.className = 'slp-speak-btn';
    speakBtn.textContent = '🔊';
    speakBtn.addEventListener('click', () => this._say(target, true));
    root.appendChild(speakBtn);

    // 풍선 (정답 + 오답 2개, 같은 행에서)
    const choices = this._pickSyllableChoices(row.syllables, target, 3);
    root.appendChild(this._buildBalloons(root, choices, target, 'syllable', null));
    container.appendChild(root);

    const t = setTimeout(() => {
      this._say(`${target}! ${target}을 찾아봐!`, true);
    }, 300);
    this._timers.push(t);
  },

  // 같은 행에서 정답+오답 선택
  _pickSyllableChoices(syllables, target, count) {
    const others = syllables.filter(s => s !== target).sort(() => Math.random() - 0.5);
    const pool   = [target, ...others.slice(0, count - 1)];
    return pool.sort(() => Math.random() - 0.5);
  },

  // ─── 풍선 영역 빌더 (공용) ───────────────────────────────
  _buildBalloons(root, choices, answer, mode, round) {
    const area = document.createElement('div');
    area.className = 'slp-balloons-area';
    const wrongColors = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    let wrongColorIndex = 0;

    choices.forEach((letter, idx) => {
      const btn = document.createElement('button');
      btn.className = 'slp-balloon-btn';
      btn.dataset.letter = letter;
      btn.type = 'button';

      const body = document.createElement('div');
      const color = letter === answer ? 0 : wrongColors[wrongColorIndex++ % wrongColors.length];
      body.className = `slp-balloon-body slp-balloon-color-${color}`;
      const letterSpan = document.createElement('span');
      letterSpan.className = 'slp-balloon-letter';
      letterSpan.textContent = letter;
      body.appendChild(letterSpan);

      const string = document.createElement('div');
      string.className = 'slp-balloon-string';
      btn.appendChild(body);
      btn.appendChild(string);
      area.appendChild(btn);

      btn.addEventListener('click', () =>
        mode === 'syllable'
          ? this._onSyllableClick(btn, letter, root)
          : this._onWordClick(btn, letter, root, round)
      );
    });

    return area;
  },

  // ─── 단어 모드 클릭 ──────────────────────────────────────
  _onWordClick(btn, letter, root, round) {
    if (this._state.locked) return;
    if (letter === round.answer) {
      this._state.locked = true;
      this._handleCorrect(btn, letter, round.word, root, () => {
        this._state.score++;
        this._options?.gainExp?.(15);
        this._options?.fireConfetti?.();
        const t = setTimeout(() => this._showWordRoundResult(round), 3600);
        this._timers.push(t);
      });
    } else {
      this._handleWrong(btn, root, round.answer, round.word);
    }
  },

  // ─── 음절 모드 클릭 ──────────────────────────────────────
  _onSyllableClick(btn, letter, root) {
    if (this._state.locked) return;
    const target = this._state.rounds[this._state.roundIndex].answer;

    if (letter === target) {
      this._state.locked = true;
      this._handleCorrect(btn, letter, null, root, () => {
        this._state.score++;
        this._options?.gainExp?.(10);
        this._options?.fireConfetti?.();
        const t = setTimeout(() => this._advanceSyllable(), 3600);
        this._timers.push(t);
      });
    } else {
      this._handleWrong(btn, root, target, null);
    }
  },


  _burstTapStars(root, x, y) {
    const stars = ['⭐','✨','💖','🌈','🎊'];
    for (let i = 0; i < 14; i++) {
      const star = document.createElement('div');
      star.className = 'slp-tap-star';
      star.textContent = stars[i % stars.length];
      const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.35;
      const dist = 80 + Math.random() * 120;
      star.style.left = `${x}px`;
      star.style.top = `${y}px`;
      star.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
      star.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
      root.appendChild(star);
      const t = setTimeout(() => star.remove(), 920);
      this._timers.push(t);
    }
  },

  _showRewardSticker(root, symbol) {
    const sticker = document.createElement('div');
    sticker.className = 'slp-reward-sticker';
    sticker.textContent = symbol || '⭐';
    root.appendChild(sticker);
    const t = setTimeout(() => sticker.remove(), 1350);
    this._timers.push(t);
  },

  // ─── 정답 처리 (공용) ────────────────────────────────────
  _handleCorrect(btn, letter, word, root, cb) {
    btn.classList.add('correct');
    if (navigator.vibrate) try { navigator.vibrate([40, 30, 90]); } catch(e) {}

    // 컨페티
    const rect  = btn.getBoundingClientRect();
    const cRect = this._container.getBoundingClientRect();
    const centerX = rect.left - cRect.left + rect.width  / 2;
    const centerY = rect.top  - cRect.top  + rect.height / 2;
    this._burstConfetti(root, centerX, centerY);
    this._burstTapStars(root, centerX, centerY);
    this._showRewardSticker(root, word ? (word[0] || letter) : letter);

    // 글자 각인 스탬프
    const stamp = document.createElement('div');
    stamp.className = 'slp-letter-stamp';
    stamp.textContent = letter;
    root.appendChild(stamp);
    const t1 = setTimeout(() => stamp.remove(), 1200);
    this._timers.push(t1);

    playGameVoice('games.letter.correct');
    this._sayLetterThenWord(letter, word);
    cb();
  },

  // ─── 오답 처리 (공용) ────────────────────────────────────
  _handleWrong(btn, root, correctAnswer, word) {
    if (btn.classList.contains('wrong')) return;
    btn.classList.add('wrong');
    if (navigator.vibrate) try { navigator.vibrate([35, 35]); } catch(e) {}
    this._state.wrongCount++;

    playGameVoice('games.letter.wrong');

    // 2회 이상 오답 → 정답 풍선 힌트 글로우
    if (this._state.wrongCount >= 2) {
      root.querySelectorAll('.slp-balloon-btn').forEach(b => {
        if (b.dataset.letter === correctAnswer) b.classList.add('hint-glow');
      });
      this._say(`${correctAnswer} 풍선이 반짝반짝해!`, true);
    } else {
      this._say(word ? `${word}! 다시 들어볼까?` : '다시 한 번 찾아볼까?', true);
    }

    const t = setTimeout(() => {
      btn.classList.remove('wrong');
      this._state.locked = false;
    }, 700);
    this._timers.push(t);
  },

  // ─── 음절 다음 라운드 ────────────────────────────────────
  _advanceSyllable() {
    const s = this._state;
    s.roundIndex++;
    s.wrongCount = 0;
    s.locked     = false;

    if (s.roundIndex >= s.totalRounds) {
      this._showSyllableComplete();
    } else {
      this._renderMain(this._container);
    }
  },

  // ─── 음절 모드 완료 ──────────────────────────────────────
  _showSyllableComplete() {
    const s   = this._state;
    const row = this._vowelData.find(v => v.key === this._selectedVowel);
    const root = this._container.querySelector('.slp-root');
    if (!root) return;

    const overlay = document.createElement('div');
    overlay.className = 'slp-overlay';

    const trophy = document.createElement('div');
    trophy.className = 'slp-result-emoji';
    trophy.textContent = s.score === s.totalRounds ? '🏆' : '🎈';
    overlay.appendChild(trophy);

    // 전체 음절 그리드 표시
    const grid = document.createElement('div');
    grid.className = 'slp-syllable-grid';
    s.rounds.forEach((r, i) => {
      const cell = document.createElement('div');
      cell.className = `slp-syl-cell ${i < s.score ? 'learned' : 'missed'}`;
      cell.textContent = r.answer;
      cell.style.animationDelay = `${i * 0.06}s`;
      grid.appendChild(cell);
    });
    overlay.appendChild(grid);

    // 버튼
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

    playGameVoice('games.letter.complete');
    this._say(
      s.score === s.totalRounds
        ? `${this._selectedVowel} 완벽해요!`
        : `${s.score}개 맞혔어요!`,
      true
    );
    this._options?.fireConfetti?.();
    this._options?.gainExp?.(s.score === s.totalRounds ? 30 : 20);
  },

  // ─── 단어 모드 라운드 결과 ───────────────────────────────
  _showWordRoundResult(round) {
    const s    = this._state;
    const root = this._container?.querySelector('.slp-root');
    if (!root) return;

    const isLast = s.roundIndex >= s.totalRounds - 1;
    const overlay = document.createElement('div');
    overlay.className = 'slp-overlay';

    const emojiEl = document.createElement('div');
    emojiEl.className = 'slp-result-emoji';
    emojiEl.textContent = round.emoji;
    overlay.appendChild(emojiEl);

    const answerCard = document.createElement('div');
    answerCard.className = 'slp-answer-card';
    answerCard.innerHTML = `
      <div class="slp-answer-big">${round.answer}</div>
      <div class="slp-answer-word">${round.word}</div>
    `;
    overlay.appendChild(answerCard);

    const btnRow = document.createElement('div');
    btnRow.className = 'slp-icon-btn-row';

    const nextBtn = document.createElement('button');
    nextBtn.className = `slp-icon-btn ${isLast ? 'slp-btn-replay' : 'slp-btn-next'}`;
    nextBtn.textContent = isLast ? '🏆' : '➡️';
    nextBtn.addEventListener('click', () => {
      if (isLast) {
        this._showWordFinalResult();
      } else {
        s.roundIndex++;
        s.wrongCount = 0;
        s.locked     = false;
        this._renderMain(this._container);
      }
    });
    btnRow.appendChild(nextBtn);

    const replayBtn = document.createElement('button');
    replayBtn.className = 'slp-icon-btn slp-btn-replay';
    replayBtn.textContent = '🔁';
    replayBtn.addEventListener('click', () => {
      s.wrongCount = 0;
      s.locked     = false;
      this._renderMain(this._container);
    });
    btnRow.appendChild(replayBtn);

    overlay.appendChild(btnRow);
    root.appendChild(overlay);

    this._sayLetterThenWord(round.answer, round.word);
  },

  // ─── 단어 모드 최종 결과 ─────────────────────────────────
  _showWordFinalResult() {
    const container = this._container;
    const s = this._state;
    const existing = container.querySelector('.slp-root');
    if (existing) existing.remove();

    const root = document.createElement('div');
    root.className = 'slp-root';
    this._renderBgDots(root);

    const isPerfect = s.score === s.totalRounds;
    const overlay   = document.createElement('div');
    overlay.className = 'slp-overlay';
    overlay.style.background = 'linear-gradient(160deg, #fff0fb 0%, #fffde4 100%)';

    const trophy = document.createElement('div');
    trophy.className = 'slp-result-emoji';
    trophy.textContent = isPerfect ? '🏆' : '🎈';
    overlay.appendChild(trophy);

    const stickerBox = document.createElement('div');
    stickerBox.className = 'slp-result-stickers';
    s.rounds.slice(0, s.totalRounds).forEach((r, i) => {
      const st = document.createElement('span');
      st.className = 'slp-result-sticker';
      st.textContent = i < s.score ? r.emoji : '💨';
      st.style.animationDelay = `${i * 0.1}s`;
      stickerBox.appendChild(st);
    });
    overlay.appendChild(stickerBox);

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

    playGameVoice('games.letter.complete');
    this._say(isPerfect ? '완벽해요! 정말 잘했어요!' : `${s.score}개나 맞혔어요!`, true);
    this._options?.fireConfetti?.();
    this._options?.gainExp?.(isPerfect ? 30 : 20);
  },

  // ─── 게임 시작 ───────────────────────────────────────────
  // // [수정본] 단어 카테고리 분기 적용
  _startGame() {
    // 타이머 정리
    this._timers.forEach(t => clearTimeout(t));
    this._timers = [];

    if (this._selectedVowel === null) {
      // ★ 카테고리 단어 모드: 유아 집중용 5문제 짧은 라운드
      const pool = this._wordCategories[this._selectedCategory] || [];
      const shuffled = pool
        .map(r => ({ ...r, choices: [...r.choices].sort(() => Math.random() - 0.5) }))
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(this.ROUND_LIMIT, pool.length)); // 최대 5문제
      this._state = {
        mode: 'word', roundIndex: 0, totalRounds: shuffled.length,
        score: 0, locked: false, wrongCount: 0, rounds: shuffled
      };
    } else {
      // 음절 모드: 해당 행에서 5문제만 랜덤 추출
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

  // ─── 공개 API ────────────────────────────────────────────
  render(container, options = {}) {
    this.destroy();
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.id = 'slpWrapper';
    wrapper.style.cssText =
      'width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box;';
    container.appendChild(wrapper);

    this._container     = wrapper;
    this._options       = options;
    this._timers        = [];
    this._selectedVowel = null;

    this._injectStyle();
    this._renderVowelBar(wrapper);
    this._startGame();
  },

  destroy() {
    this._timers.forEach(t => clearTimeout(t));
    this._timers = [];
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    if (this._container) this._container.innerHTML = '';
    this._state         = null;
    this._container     = null;
    this._options       = null;
    this._selectedVowel = null;
  }
};
