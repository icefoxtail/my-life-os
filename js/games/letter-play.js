/**
 * 시현이 놀이터 OS — 글자놀이터 미니게임 v1
 * 파일: js/games/letter-play.js
 *
 * 콘셉트: 글자 풍선 파티
 * 4~5세 아이가 그림을 보고 첫 글자 풍선을 터뜨리는 놀이.
 * 공부가 아닌 '장난감' 경험을 목표로 한다.
 */

window.SihyeonGames = window.SihyeonGames || {};

function playGameVoice(id) {
  if (window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
    window.SihyeonVoice.play(id).catch(() => {});
  }
}

window.SihyeonGames.letterPlay = {
  id: 'letterPlay',
  title: '글자놀이터',

  _state: null,
  _timers: [],
  _container: null,
  _options: null,

  _rounds: [
    { emoji: '🍎', word: '사과', answer: '사', choices: ['사', '나', '다'] },
    { emoji: '🐶', word: '강아지', answer: '강', choices: ['강', '바', '하'] },
    { emoji: '🌙', word: '달', answer: '달', choices: ['달', '말', '살'] },
    { emoji: '🚗', word: '자동차', answer: '자', choices: ['가', '자', '마'] },
    { emoji: '🦋', word: '나비', answer: '나', choices: ['다', '나', '라'] },
    { emoji: '🍌', word: '바나나', answer: '바', choices: ['바', '파', '타'] },
    { emoji: '🐱', word: '고양이', answer: '고', choices: ['도', '소', '고'] },
    { emoji: '⭐', word: '별', answer: '별', choices: ['별', '열', '절'] },
    { emoji: '🌸', word: '꽃', answer: '꽃', choices: ['꽃', '못', '솥'] },
    { emoji: '🐸', word: '개구리', answer: '개', choices: ['개', '새', '배'] }
  ],

  _injectStyle() {
    const STYLE_ID = 'sihyeon-letter-play-style';
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .slp-root {
        width: 100%;
        height: 100%;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        background: linear-gradient(160deg, #ffecd2 0%, #ffe0f0 40%, #d4f5ff 100%);
        overflow: hidden;
        position: relative;
        font-family: 'Arial Rounded MT Bold', 'Nanum Gothic', sans-serif;
        box-sizing: border-box;
        padding: 0;
        user-select: none;
      }

      .slp-bg-dot {
        position: absolute;
        border-radius: 50%;
        opacity: 0.18;
        pointer-events: none;
        animation: slp-float-dot 6s ease-in-out infinite;
      }
      @keyframes slp-float-dot {
        0%,100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-18px) rotate(20deg); }
      }

      .slp-progress-bar {
        width: 100%;
        height: 10px;
        background: rgba(255,255,255,0.5);
        position: relative;
        overflow: hidden;
        flex-shrink: 0;
      }
      .slp-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #ff85c2, #ffb347);
        border-radius: 0 8px 8px 0;
        transition: width 0.5s cubic-bezier(.34,1.56,.64,1);
      }

      .slp-stars-row {
        display: flex;
        gap: 6px;
        padding: 8px 16px 4px;
        flex-shrink: 0;
        justify-content: center;
      }
      .slp-star {
        font-size: clamp(20px, 5vw, 28px);
        filter: grayscale(1) opacity(0.35);
        transition: filter 0.4s, transform 0.4s;
      }
      .slp-star.lit {
        filter: none;
        animation: slp-star-pop 0.5s cubic-bezier(.34,1.56,.64,1);
      }
      @keyframes slp-star-pop {
        0% { transform: scale(0.5) rotate(-20deg); }
        70% { transform: scale(1.4) rotate(10deg); }
        100% { transform: scale(1) rotate(0deg); }
      }

      .slp-hint-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.75);
        border-radius: 32px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.10), 0 2px 0 rgba(255,255,255,0.9) inset;
        padding: 16px 32px 12px;
        margin: 8px 16px 0;
        width: calc(100% - 32px);
        max-width: 360px;
        box-sizing: border-box;
        flex-shrink: 0;
        position: relative;
        overflow: hidden;
      }
      .slp-hint-card::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 32px;
        border: 3px solid rgba(255,180,220,0.6);
        pointer-events: none;
      }
      .slp-hint-emoji {
        font-size: clamp(64px, 18vw, 100px);
        line-height: 1;
        animation: slp-emoji-bounce 2.5s ease-in-out infinite;
        display: block;
      }
      @keyframes slp-emoji-bounce {
        0%,100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-8px) scale(1.05); }
      }
      .slp-hint-word {
        font-size: clamp(28px, 8vw, 48px);
        font-weight: 900;
        color: #444;
        margin-top: 4px;
        letter-spacing: 4px;
      }

      .slp-balloons-area {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: clamp(12px, 5vw, 28px);
        width: 100%;
        padding: 0 12px;
        box-sizing: border-box;
        min-height: 0;
      }

      .slp-balloon-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
        outline: none;
        -webkit-tap-highlight-color: transparent;
        flex: 1;
        max-width: 120px;
        animation: slp-balloon-float 3s ease-in-out infinite;
      }
      .slp-balloon-btn:nth-child(2) { animation-delay: -1s; }
      .slp-balloon-btn:nth-child(3) { animation-delay: -2s; }
      @keyframes slp-balloon-float {
        0%,100% { transform: translateY(0px) rotate(-2deg); }
        50% { transform: translateY(-14px) rotate(2deg); }
      }
      .slp-balloon-body {
        width: clamp(80px, 22vw, 110px);
        height: clamp(96px, 27vw, 132px);
        border-radius: 50% 50% 50% 50% / 55% 55% 45% 45%;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: transform 0.15s, filter 0.15s;
        box-shadow: 4px 8px 24px rgba(0,0,0,0.18), -6px -6px 0 0 rgba(255,255,255,0.2) inset;
      }
      .slp-balloon-btn:active .slp-balloon-body { transform: scale(0.92); }
      .slp-balloon-body::before {
        content: '';
        position: absolute;
        top: 12%;
        left: 18%;
        width: 28%;
        height: 38%;
        background: rgba(255,255,255,0.55);
        border-radius: 50%;
        transform: rotate(-20deg);
        pointer-events: none;
      }
      .slp-balloon-body::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 10px solid currentColor;
        filter: brightness(0.7);
      }
      .slp-balloon-string {
        width: 2px;
        height: clamp(28px, 8vw, 44px);
        background: linear-gradient(to bottom, #aaa, #ccc);
        border-radius: 1px;
        margin-top: 0;
      }
      .slp-balloon-letter {
        font-size: clamp(30px, 9vw, 52px);
        font-weight: 900;
        color: white;
        text-shadow: 0 2px 8px rgba(0,0,0,0.25);
        z-index: 1;
        position: relative;
      }

      .slp-balloon-color-0 { background: linear-gradient(135deg, #ff7eb3, #ff4e88); color: #ff4e88; }
      .slp-balloon-color-1 { background: linear-gradient(135deg, #ffcc70, #ffaa00); color: #ffaa00; }
      .slp-balloon-color-2 { background: linear-gradient(135deg, #7ecfff, #38b6ff); color: #38b6ff; }
      .slp-balloon-color-3 { background: linear-gradient(135deg, #a78bfa, #7c3aed); color: #7c3aed; }
      .slp-balloon-color-4 { background: linear-gradient(135deg, #6ee7b7, #10b981); color: #10b981; }

      .slp-balloon-btn.correct .slp-balloon-body {
        animation: slp-pop 0.45s cubic-bezier(.34,1.56,.64,1) forwards;
      }
      @keyframes slp-pop {
        0% { transform: scale(1); opacity: 1; }
        40% { transform: scale(1.35); opacity: 0.8; }
        100% { transform: scale(0); opacity: 0; }
      }
      .slp-balloon-btn.wrong .slp-balloon-body { animation: slp-shake 0.4s ease; }
      @keyframes slp-shake {
        0%,100% { transform: translateX(0) rotate(0); }
        20% { transform: translateX(-8px) rotate(-5deg); }
        40% { transform: translateX(8px) rotate(5deg); }
        60% { transform: translateX(-6px) rotate(-3deg); }
        80% { transform: translateX(6px) rotate(3deg); }
      }
      .slp-balloon-btn.correct .slp-balloon-string { opacity: 0; transition: opacity 0.2s 0.2s; }

      .slp-confetti-piece {
        position: absolute;
        width: 10px;
        height: 14px;
        border-radius: 2px;
        pointer-events: none;
        animation: slp-confetti-fall linear forwards;
        z-index: 100;
      }
      @keyframes slp-confetti-fall {
        0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
        100% { opacity: 0; transform: translateY(200px) rotate(540deg) scale(0.5); }
      }

      .slp-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.88);
        backdrop-filter: blur(6px);
        z-index: 200;
        animation: slp-fade-in 0.35s ease;
        border-radius: inherit;
      }
      @keyframes slp-fade-in {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
      }
      .slp-overlay-emoji {
        font-size: clamp(72px, 20vw, 110px);
        animation: slp-pop-in 0.5s cubic-bezier(.34,1.56,.64,1);
      }
      @keyframes slp-pop-in {
        0% { transform: scale(0.3) rotate(-15deg); }
        70% { transform: scale(1.15) rotate(8deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      .slp-overlay-message {
        font-size: clamp(22px, 6.5vw, 38px);
        font-weight: 900;
        color: #444;
        margin: 12px 0 4px;
        text-align: center;
        padding: 0 20px;
      }
      .slp-overlay-sub {
        font-size: clamp(15px, 4vw, 20px);
        color: #888;
        margin-bottom: 24px;
        text-align: center;
        padding: 0 24px;
      }

      .slp-btn {
        min-height: 64px;
        padding: 0 28px;
        border-radius: 50px;
        border: none;
        cursor: pointer;
        font-size: clamp(16px, 4.5vw, 22px);
        font-weight: 900;
        font-family: inherit;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: transform 0.15s, filter 0.15s;
        -webkit-tap-highlight-color: transparent;
        outline: none;
        width: 100%;
        max-width: 280px;
        box-sizing: border-box;
      }
      .slp-btn:active { transform: scale(0.94); filter: brightness(0.92); }
      .slp-btn-primary {
        background: linear-gradient(135deg, #ff85c2, #ff4e88);
        color: white;
        box-shadow: 0 4px 16px rgba(255,78,136,0.4), 0 -2px 0 rgba(255,255,255,0.3) inset;
      }
      .slp-btn-ghost {
        background: rgba(255,255,255,0.7);
        color: #888;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        border: 2px solid rgba(0,0,0,0.07);
      }
      .slp-btn-row {
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: center;
        width: 100%;
        padding: 0 24px;
        box-sizing: border-box;
      }

      .slp-result-stickers {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        justify-content: center;
        margin: 8px 0 16px;
        max-width: 260px;
      }
      .slp-result-sticker {
        font-size: clamp(28px, 9vw, 44px);
        animation: slp-sticker-appear 0.4s cubic-bezier(.34,1.56,.64,1) both;
      }
      @keyframes slp-sticker-appear {
        0% { transform: scale(0) rotate(-30deg); opacity: 0; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }

      .slp-guide-text {
        font-size: clamp(15px, 4vw, 19px);
        color: #cc6699;
        font-weight: 700;
        text-align: center;
        margin: 6px 0 0;
        padding: 0 12px;
        flex-shrink: 0;
        letter-spacing: 1px;
      }
      .slp-speech-bubble {
        background: rgba(255,255,255,0.85);
        border-radius: 20px;
        padding: 6px 16px;
        font-size: clamp(13px, 3.5vw, 16px);
        color: #888;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        margin: 4px 0 0;
        text-align: center;
        flex-shrink: 0;
        max-width: calc(100% - 32px);
      }
    `;
    document.head.appendChild(style);
  },

  _speak(text) {
    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'ko-KR';
    utt.rate = 0.88;
    utt.pitch = 1.2;
    speechSynthesis.speak(utt);
  },

  _say(text, force = false) {
    const speak = this._options?.speakGuide;
    if (typeof speak === 'function') speak(text, force);
    else this._speak(text);
  },

  _renderBgDots(root) {
    const colors = ['#ffb3d9', '#ffe082', '#b3e5fc', '#c8e6c9', '#d1c4e9'];
    const sizes = [20, 28, 16, 24, 18, 32, 14];
    for (let i = 0; i < 10; i += 1) {
      const dot = document.createElement('div');
      dot.className = 'slp-bg-dot';
      const size = sizes[i % sizes.length];
      Object.assign(dot.style, {
        width: `${size}px`,
        height: `${size}px`,
        background: colors[i % colors.length],
        top: `${Math.random() * 90}%`,
        left: `${Math.random() * 90}%`,
        animationDelay: `${Math.random() * 4}s`,
        animationDuration: `${4 + Math.random() * 4}s`
      });
      root.appendChild(dot);
    }
  },

  _burstConfetti(root, x, y) {
    const colors = ['#ff85c2', '#ffcc70', '#7ecfff', '#a78bfa', '#6ee7b7', '#ff6b6b', '#fff'];
    for (let i = 0; i < 22; i += 1) {
      const piece = document.createElement('div');
      piece.className = 'slp-confetti-piece';
      piece.style.background = colors[i % colors.length];
      piece.style.left = `${x - 5 + (Math.random() - 0.5) * 60}px`;
      piece.style.top = `${y - 7}px`;
      piece.style.animationDuration = `${0.7 + Math.random() * 0.6}s`;
      root.appendChild(piece);
      const timer = setTimeout(() => piece.remove(), 1400);
      this._timers.push(timer);
    }
  },

  _renderGame(container) {
    const s = this._state;
    container.innerHTML = '';

    const root = document.createElement('div');
    root.className = 'slp-root';
    this._renderBgDots(root);

    const progressBar = document.createElement('div');
    progressBar.className = 'slp-progress-bar';
    const progressFill = document.createElement('div');
    progressFill.className = 'slp-progress-fill';
    progressFill.style.width = `${(s.roundIndex / s.totalRounds) * 100}%`;
    progressBar.appendChild(progressFill);
    root.appendChild(progressBar);

    const starsRow = document.createElement('div');
    starsRow.className = 'slp-stars-row';
    for (let i = 0; i < s.totalRounds; i += 1) {
      const star = document.createElement('span');
      star.className = `slp-star${i < s.score ? ' lit' : ''}`;
      star.textContent = '⭐';
      starsRow.appendChild(star);
    }
    root.appendChild(starsRow);

    const round = s.rounds[s.roundIndex];
    const hintCard = document.createElement('div');
    hintCard.className = 'slp-hint-card';
    hintCard.innerHTML = `
      <span class="slp-hint-emoji">${round.emoji}</span>
      <div class="slp-hint-word">${round.word}</div>
    `;
    root.appendChild(hintCard);

    const guide = document.createElement('div');
    guide.className = 'slp-guide-text';
    guide.textContent = '첫 글자 풍선을 터뜨려요! 🎈';
    root.appendChild(guide);

    const balloonsArea = document.createElement('div');
    balloonsArea.className = 'slp-balloons-area';
    const shuffledColors = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);

    round.choices.forEach((letter, idx) => {
      const btn = document.createElement('button');
      btn.className = 'slp-balloon-btn';
      btn.dataset.letter = letter;
      btn.type = 'button';

      const body = document.createElement('div');
      body.className = `slp-balloon-body slp-balloon-color-${shuffledColors[idx % 5]}`;
      const letterSpan = document.createElement('span');
      letterSpan.className = 'slp-balloon-letter';
      letterSpan.textContent = letter;
      body.appendChild(letterSpan);

      const string = document.createElement('div');
      string.className = 'slp-balloon-string';

      btn.appendChild(body);
      btn.appendChild(string);
      balloonsArea.appendChild(btn);
      btn.addEventListener('click', (e) => this._onBalloonClick(btn, letter, root, e));
    });

    root.appendChild(balloonsArea);

    const speechBubble = document.createElement('div');
    speechBubble.className = 'slp-speech-bubble';
    speechBubble.style.cursor = 'pointer';
    speechBubble.innerHTML = `🔊 <b>${round.word}</b> — 눌러서 들어봐요`;
    speechBubble.addEventListener('click', () => {
      this._say(round.word, true);
    });
    root.appendChild(speechBubble);
    container.appendChild(root);

    const t = setTimeout(() => {
      playGameVoice('games.letter.question');
      this._say(`${round.word}의 첫 글자는 무엇일까요?`, false);
    }, 350);
    this._timers.push(t);
  },

  _onBalloonClick(btn, letter, root) {
    if (this._state.locked) return;
    this._state.locked = true;

    const confetti = this._options.fireConfetti || (() => {});
    const gainExp = this._options.gainExp || (() => {});
    const round = this._state.rounds[this._state.roundIndex];

    if (letter === round.answer) {
      btn.classList.add('correct');
      const rect = btn.getBoundingClientRect();
      const containerRect = this._container.getBoundingClientRect();
      this._burstConfetti(root, rect.left - containerRect.left + rect.width / 2, rect.top - containerRect.top + rect.height / 2);
      this._state.score += 1;
      gainExp(15);
      confetti();
      playGameVoice('games.letter.correct');
      this._say(`맞아요! ${round.word}의 첫 글자는 ${round.answer}!`, true);
      const t = setTimeout(() => this._showRoundResult(), 1500);
      this._timers.push(t);
      return;
    }

    btn.classList.add('wrong');
    playGameVoice('games.letter.wrong');
    this._say('괜찮아요. 다시 찾아봐요!', false);
    const t = setTimeout(() => {
      btn.classList.remove('wrong');
      this._state.locked = false;
    }, 700);
    this._timers.push(t);
  },

  _showRoundResult() {
    const root = this._container?.querySelector('.slp-root');
    if (!root) return;
    const overlay = document.createElement('div');
    overlay.className = 'slp-overlay';
    const round = this._state.rounds[this._state.roundIndex];
    const isLast = this._state.roundIndex >= this._state.totalRounds - 1;
    overlay.innerHTML = `
      <div class="slp-overlay-emoji">${round.emoji}</div>
      <div class="slp-overlay-message">🎉 ${round.answer}! 맞아요!</div>
      <div class="slp-overlay-sub">${round.word}의 첫 글자는 <b style="color:#ff4e88">${round.answer}</b> 이에요</div>
    `;

    const btnRow = document.createElement('div');
    btnRow.className = 'slp-btn-row';
    const nextBtn = document.createElement('button');
    nextBtn.className = 'slp-btn slp-btn-primary';
    nextBtn.textContent = isLast ? '결과 보기 🎊' : '다음 풍선 🎈';
    nextBtn.addEventListener('click', () => {
      if (isLast) this._showFinalResult();
      else {
        this._state.roundIndex += 1;
        this._state.locked = false;
        this._renderGame(this._container);
      }
    });
    btnRow.appendChild(nextBtn);
    overlay.appendChild(btnRow);
    root.appendChild(overlay);
  },

  _showFinalResult() {
    const container = this._container;
    const closeHome = this._options.closeToParkHome || (() => {});
    container.innerHTML = '';

    const root = document.createElement('div');
    root.className = 'slp-root';
    this._renderBgDots(root);

    const overlay = document.createElement('div');
    overlay.className = 'slp-overlay';
    overlay.style.background = 'linear-gradient(160deg, #fff0fb 0%, #fffde4 100%)';

    const s = this._state;
    const isPerfect = s.score === s.totalRounds;
    overlay.innerHTML = `
      <div class="slp-overlay-emoji" style="font-size:clamp(72px,20vw,108px)">${isPerfect ? '🏆' : '🎈'}</div>
      <div class="slp-overlay-message">${isPerfect ? '완벽해요!' : `${s.score}개 맞혔어요!`}</div>
      <div class="slp-overlay-sub">글자 풍선 파티 완료! 🎉</div>
    `;

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
    btnRow.className = 'slp-btn-row';
    btnRow.style.marginTop = '8px';

    const retryBtn = document.createElement('button');
    retryBtn.className = 'slp-btn slp-btn-primary';
    retryBtn.textContent = '🔄 다시 하기';
    retryBtn.addEventListener('click', () => this._startGame());

    const nextBtn = document.createElement('button');
    nextBtn.className = 'slp-btn slp-btn-primary';
    nextBtn.textContent = '🎲 다음 게임';
    nextBtn.addEventListener('click', () => this._startGame());

    const homeBtn = document.createElement('button');
    homeBtn.className = 'slp-btn slp-btn-ghost';
    homeBtn.textContent = '🏠 광장으로';
    homeBtn.addEventListener('click', () => closeHome());

    btnRow.appendChild(retryBtn);
    btnRow.appendChild(nextBtn);
    btnRow.appendChild(homeBtn);
    overlay.appendChild(btnRow);
    root.appendChild(overlay);
    container.appendChild(root);

    playGameVoice('games.letter.complete');
    this._say(isPerfect ? '완벽해요! 정말 잘했어요!' : `${s.score}개나 맞혔어요! 대단해요!`, true);
  },

  _startGame() {
    const shuffled = this._rounds
      .map((round) => ({ ...round, choices: [...round.choices].sort(() => Math.random() - 0.5) }))
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    this._state = {
      roundIndex: 0,
      totalRounds: 5,
      score: 0,
      locked: false,
      rounds: shuffled
    };
    playGameVoice('games.letter.intro');
    this._renderGame(this._container);
  },

  render(container, options = {}) {
    this.destroy();
    this._container = container;
    this._options = options;
    this._timers = [];
    this._injectStyle();
    this._startGame();
  },

  destroy() {
    this._timers.forEach((t) => clearTimeout(t));
    this._timers = [];
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    if (this._container) this._container.innerHTML = '';
    this._state = null;
    this._container = null;
    this._options = null;
  }
};
