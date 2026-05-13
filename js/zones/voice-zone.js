/**
 * 시현이 놀이터 OS — 말하기놀이터 (Voice Zone) v5.1
 * 파일: js/zones/voice-zone.js
 *
 * 기준: art-zone 방식 참고
 * 변경:
 * - 모바일 세로 DOM / 태블릿 가로 DOM 이원 구조 적용
 * - 기존 요술 마이크, 변조, 유튜브 재생, 30초 타이머, 권한 방어 유지
 * - 기존 voice key / SihyeonVoice.play 연결 유지
 */

(function () {
  const ZONE_KEY = 'voiceZone';
  const STYLE_ID = 'sihyeon-voice-zone-style';

  const PLAYLISTS = {
    gogodino: 'PLZrs_vDGBxZEQXo8QImjT0UBlfdnkTLoD',
    tayo:     'PLkvTG4A3XyMjRj1HInS6Pib5Bw-H9OqI6',
    poli:     'PLwH_nnbgqf2iJgQh6AtebL5L30vS1p73S',
  };

  const YOUTUBE_PLAYLIST_ID = PLAYLISTS.gogodino;

  const state = {
    container: null,
    mediaRecorder: null,
    audioChunks: [],
    audioMimeType: '',
    playbackAudio: null,
    ytPlayer: null,
    ytReady: false,
    ytLoadTimer: null,
    isRecording: false,
    isPlaying: false,
    isBgmPlaying: false,
    locked: false,
    destroyed: false,
    audioCtx: null,
    currentSource: null,
    rippleInterval: null,
    recordTimer: null,
    voiceMode: 'normal'
  };

  function initAudio() {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    if (!state.audioCtx) state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume().catch?.(() => {});
  }

  function playTone(type) {
    if (!state.audioCtx) return;

    const ctx = state.audioCtx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'down') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'up') {
      [659.25, 880].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + i * 0.1);
        g.gain.setValueAtTime(0.2, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + i * 0.1);
        o.stop(now + i * 0.1 + 0.4);
      });
    }
  }

  function speakMsg(text) {
    const voiceIds = {
      '내 목소리!': 'zone.voice.myVoice',
      '헬륨가스 목소리!': 'zone.voice.helium',
      '로봇 목소리!': 'zone.voice.robot',
      '괴물 목소리!': 'zone.voice.monster',
      '시현아, 마이크 권한을 허락해줘!': 'zone.voice.permission',
      '들어보자!': 'zone.voice.listen',
      '신나는 노래 틀어줄게!': 'zone.voice.music',
      '시현아! 요술 마이크를 톡! 누르고 말해봐! 목소리가 변신할 거야!': 'zone.voice.intro'
    };

    const voiceId = voiceIds[text];

    if (voiceId && window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      window.SihyeonVoice.play(voiceId, '').catch(() => {});
    }
  }

  function injectStyle() {
    const old = document.getElementById(STYLE_ID);
    if (old) old.remove();

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .vz-root {
        width: 100%;
        height: 100%;
        min-height: 100%;
        position: relative;
        overflow: hidden;
        font-family: 'Jua', 'Nanum Gothic', system-ui, sans-serif;
        background:
          radial-gradient(circle at 16% 12%, rgba(255,255,255,0.9) 0 6%, transparent 6.4%),
          radial-gradient(circle at 84% 18%, rgba(255,255,255,0.82) 0 5%, transparent 5.5%),
          linear-gradient(160deg, #fff0f5 0%, #e0f7fa 52%, #d9f8e8 100%);
        color: #263238;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        touch-action: manipulation;
      }

      .vz-root * {
        box-sizing: border-box;
      }

      #vz-yt-player {
        position: absolute;
        top: 0;
        left: 0;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
      }

      .vz-mobile-layout,
      .vz-tablet-layout {
        position: relative;
        z-index: 2;
        width: 100%;
        height: 100%;
        min-height: 0;
      }

      .vz-tablet-layout {
        display: none;
      }

      .vz-mobile-layout {
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow-y: auto;
        overflow-x: hidden;
        padding: max(14px, env(safe-area-inset-top)) 14px max(18px, env(safe-area-inset-bottom));
      }

      .vz-mobile-header {
        width: min(100%, 760px);
        flex: 0 0 auto;
        display: grid;
        justify-items: center;
        gap: 8px;
        padding: 2px 0 12px;
      }

      .vz-character {
        width: clamp(88px, 23vw, 132px);
        height: clamp(88px, 23vw, 132px);
        background: #fff;
        border-radius: 50%;
        border: 6px solid #ffb6c1;
        box-shadow: 0 8px 16px rgba(255, 182, 193, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        animation: vz-float 3s ease-in-out infinite alternate;
      }

      @keyframes vz-float {
        from { transform: translateY(0); }
        to { transform: translateY(-10px); }
      }

      .vz-character img {
        width: 80%;
        height: 80%;
        object-fit: contain;
        border-radius: 50%;
      }

      .vz-character-fallback {
        display: none;
        font-size: clamp(50px, 15vw, 82px);
      }

      .vz-title {
        margin: 0;
        color: #263238;
        text-align: center;
        font-size: clamp(25px, 7vw, 40px);
        line-height: 1.12;
        text-shadow: 0 2px 0 rgba(255,255,255,0.9);
      }

      .vz-mobile-grid {
        width: min(100%, 760px);
        display: grid;
        grid-template-columns: 1fr;
        gap: 18px;
        padding-bottom: 8px;
      }

      .vz-card {
        position: relative;
        border: 6px solid #fff;
        border-radius: 34px;
        background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,248,254,0.95));
        box-shadow: 0 12px 0 rgba(123, 31, 162, 0.1), 0 20px 30px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: clamp(16px, 4vw, 22px);
        min-height: 248px;
        overflow: hidden;
      }

      .vz-card-title {
        color: #283593;
        font-size: clamp(25px, 6.2vw, 36px);
        font-weight: 900;
        line-height: 1.1;
        text-align: center;
        margin: 0;
      }

      .vz-card-visual {
        position: relative;
        flex: 1 1 auto;
        min-height: 136px;
        border-radius: 25px;
        overflow: hidden;
        display: grid;
        place-items: center;
        background: linear-gradient(180deg, #e3f2fd 0%, #fff4c4 100%);
        box-shadow: inset 0 -5px 0 rgba(0,0,0,0.06);
      }

      .vz-card-img {
        width: 100%;
        height: 100%;
        min-height: 136px;
        object-fit: cover;
        display: block;
      }

      .vz-card-fallback {
        width: 100%;
        height: 100%;
        min-height: 136px;
        display: grid;
        place-items: center;
        font-size: clamp(75px, 20vw, 120px);
      }

      .vz-voice-modes {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin: 0 auto 8px;
      }

      .vz-mode-btn {
        width: clamp(55px, 14vw, 76px);
        height: clamp(55px, 14vw, 76px);
        border-radius: 50%;
        font-size: clamp(28px, 7vw, 40px);
        background: #fff;
        border: 4px solid #ddd;
        box-shadow: 0 4px 0 #ccc;
        display: grid;
        place-items: center;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s, background 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .vz-mode-btn:active {
        transform: translateY(4px);
        box-shadow: 0 0 0 transparent;
      }

      .vz-mode-btn.active {
        border-color: #FF7A1A;
        background: #FFF3E0;
        box-shadow: 0 4px 0 #E65100, 0 0 15px rgba(255,122,26,0.4);
        transform: scale(1.15) translateY(-2px);
        z-index: 5;
      }

      .vz-pop-anim {
        animation: vzBtnPop 0.3s ease-out;
      }

      @keyframes vzBtnPop {
        0% { transform: scale(1.15); }
        50% { transform: scale(1.35) rotate(-5deg); }
        100% { transform: scale(1.15); }
      }

      .vz-card-actions {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 122px;
        position: relative;
      }

      .vz-mic-wrap {
        position: relative;
        display: grid;
        place-items: center;
        width: 100%;
        height: 100%;
        touch-action: manipulation;
      }

      .vz-mic-btn {
        position: relative;
        z-index: 10;
        width: clamp(118px, 30vw, 170px);
        height: clamp(118px, 30vw, 170px);
        border-radius: 50%;
        background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
        border: 8px solid #fff;
        box-shadow: 0 10px 20px rgba(0,0,0,0.15);
        font-size: clamp(62px, 16vw, 95px);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s, box-shadow 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .vz-mic-btn:active {
        transform: scale(0.85);
        box-shadow: 0 5px 10px rgba(0,0,0,0.15);
      }

      .vz-mic-btn.recording {
        background: linear-gradient(135deg, #ff8a80 0%, #ff5252 100%);
        transform: scale(1.1);
        border-color: #ffebee;
      }

      .vz-mic-btn.playing {
        background: linear-gradient(135deg, #81c784 0%, #4caf50 100%);
        border-color: #e8f5e9;
        animation: vz-bounce 0.8s infinite alternate;
        pointer-events: none;
      }

      .vz-mic-progress {
        position: absolute;
        top: -10%;
        left: -10%;
        width: 120%;
        height: 120%;
        z-index: 11;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s;
      }

      .vz-mic-progress circle {
        fill: none;
        stroke-width: 5;
        stroke-linecap: round;
      }

      .vz-mic-track {
        stroke: rgba(255,255,255,0.4);
      }

      .vz-mic-bar {
        stroke: #FF5252;
        stroke-dasharray: 283;
        stroke-dashoffset: 0;
        transform-origin: 50% 50%;
        transform: rotate(-90deg);
      }

      .vz-mic-btn.recording ~ .vz-mic-progress {
        opacity: 1;
      }

      .vz-mic-btn.recording ~ .vz-mic-progress .vz-mic-bar {
        animation: vz-timer-countdown 30s linear forwards;
      }

      @keyframes vz-timer-countdown {
        from { stroke-dashoffset: 0; }
        to { stroke-dashoffset: 283; }
      }

      .vz-ripple {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: clamp(120px, 30vw, 170px);
        height: clamp(120px, 30vw, 170px);
        border-radius: 50%;
        border: 8px solid #ff5252;
        animation: vzRippleAnim 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        pointer-events: none;
        z-index: 1;
      }

      @keyframes vzRippleAnim {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
        100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; border-width: 0; }
      }

      .vz-music-btn {
        position: relative;
        z-index: 10;
        width: clamp(108px, 28vw, 160px);
        height: clamp(108px, 28vw, 160px);
        border-radius: 50%;
        background: linear-gradient(135deg, #ffd54f 0%, #ffb300 100%);
        border: 8px solid #fff;
        box-shadow: 0 10px 0 rgba(230,126,0,0.3), 0 15px 25px rgba(0,0,0,0.15);
        font-size: clamp(58px, 15vw, 85px);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.1s, opacity 0.3s, box-shadow 0.1s, filter 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .vz-music-btn:active {
        transform: scale(0.9) translateY(5px);
        box-shadow: 0 4px 0 rgba(230,126,0,0.3), 0 8px 15px rgba(0,0,0,0.15);
      }

      .vz-music-btn.playing {
        animation: vz-music-dance 0.5s infinite alternate;
      }

      .vz-music-btn.disabled {
        opacity: 0.5;
        filter: grayscale(0.5);
        pointer-events: none;
      }

      @keyframes vz-music-dance {
        from { transform: translateY(0) rotate(-5deg); }
        to { transform: translateY(-15px) rotate(5deg); }
      }

      @keyframes vz-bounce {
        from { transform: scale(1); }
        to { transform: scale(1.15); }
      }

      .vz-visualizer {
        position: absolute;
        bottom: -5px;
        display: flex;
        gap: 8px;
        align-items: flex-end;
        justify-content: center;
        height: 35px;
        z-index: 20;
        opacity: 0;
        transition: opacity 0.3s;
        pointer-events: none;
      }

      .vz-music-btn.playing ~ .vz-visualizer {
        opacity: 1;
      }

      .vz-visualizer span {
        width: 10px;
        background: #FF5252;
        border-radius: 5px;
        animation: vzEqDance 0.5s ease-in-out infinite alternate;
      }

      .vz-visualizer span:nth-child(1) { height: 15px; animation-delay: 0.1s; background: #FF5252; }
      .vz-visualizer span:nth-child(2) { height: 30px; animation-delay: 0.3s; background: #4CAF50; }
      .vz-visualizer span:nth-child(3) { height: 20px; animation-delay: 0s; background: #2196F3; }
      .vz-visualizer span:nth-child(4) { height: 35px; animation-delay: 0.2s; background: #FFC107; }

      @keyframes vzEqDance {
        0% { transform: scaleY(0.4); }
        100% { transform: scaleY(1.6); }
      }

      .vz-tablet-layout {
        padding: max(18px, env(safe-area-inset-top)) max(20px, 3vw) max(18px, env(safe-area-inset-bottom));
        overflow: hidden;
      }

      .vz-tablet-shell {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(220px, 0.78fr) minmax(360px, 1.25fr) minmax(240px, 0.82fr);
        gap: clamp(14px, 2vw, 24px);
        align-items: stretch;
      }

      .vz-tablet-panel,
      .vz-tablet-stage,
      .vz-tablet-music {
        min-height: 0;
        border: 6px solid rgba(255,255,255,0.95);
        border-radius: 36px;
        background: rgba(255,255,255,0.72);
        box-shadow: 0 14px 30px rgba(0,0,0,0.12);
        backdrop-filter: blur(8px);
        overflow: hidden;
      }

      .vz-tablet-panel {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: clamp(16px, 2vw, 24px);
        gap: 18px;
      }

      .vz-tablet-panel .vz-character {
        width: clamp(112px, 13vw, 174px);
        height: clamp(112px, 13vw, 174px);
      }

      .vz-tablet-title {
        margin: 0;
        font-size: clamp(26px, 3vw, 44px);
        line-height: 1.1;
        text-align: center;
        color: #263238;
        text-shadow: 0 2px 0 rgba(255,255,255,0.9);
      }

      .vz-tablet-sub {
        margin: 0;
        font-size: clamp(17px, 1.6vw, 24px);
        line-height: 1.35;
        text-align: center;
        color: #5b6770;
        font-weight: 900;
      }

      .vz-tablet-stage {
        display: grid;
        grid-template-rows: auto 1fr auto;
        align-items: center;
        justify-items: center;
        padding: clamp(18px, 2vw, 28px);
        gap: 16px;
        background:
          radial-gradient(circle at 50% 20%, rgba(255,255,255,0.85) 0 18%, transparent 18.5%),
          linear-gradient(180deg, rgba(255,255,255,0.92), rgba(244,250,255,0.9));
      }

      .vz-tablet-stage-title {
        margin: 0;
        color: #283593;
        font-size: clamp(30px, 3.4vw, 52px);
        line-height: 1.05;
        text-align: center;
      }

      .vz-tablet-mic-center {
        width: 100%;
        min-height: 0;
        display: grid;
        place-items: center;
      }

      .vz-tablet-layout .vz-mic-btn {
        width: clamp(170px, 20vw, 245px);
        height: clamp(170px, 20vw, 245px);
        font-size: clamp(86px, 9vw, 128px);
      }

      .vz-tablet-layout .vz-ripple {
        width: clamp(170px, 20vw, 245px);
        height: clamp(170px, 20vw, 245px);
      }

      .vz-tablet-layout .vz-voice-modes {
        gap: 14px;
        margin-bottom: 0;
      }

      .vz-tablet-layout .vz-mode-btn {
        width: clamp(66px, 7vw, 92px);
        height: clamp(66px, 7vw, 92px);
        font-size: clamp(34px, 4vw, 48px);
      }

      .vz-tablet-music {
        display: grid;
        grid-template-rows: minmax(160px, 1fr) auto minmax(150px, 0.9fr);
        gap: 14px;
        padding: clamp(16px, 2vw, 24px);
        align-items: center;
        justify-items: center;
      }

      .vz-tablet-music .vz-card-visual {
        width: 100%;
        height: 100%;
        min-height: 150px;
      }

      .vz-tablet-music-title {
        color: #283593;
        font-size: clamp(28px, 3vw, 44px);
        font-weight: 900;
        line-height: 1.1;
        text-align: center;
      }

      .vz-tablet-layout .vz-music-btn {
        width: clamp(136px, 15vw, 190px);
        height: clamp(136px, 15vw, 190px);
        font-size: clamp(70px, 7vw, 96px);
      }

      @media (orientation: landscape) and (min-width: 760px) {
        .vz-mobile-layout {
          display: none;
        }

        .vz-tablet-layout {
          display: block;
        }
      }

      @media (orientation: landscape) and (max-height: 540px) {
        .vz-tablet-layout {
          padding: 10px 14px;
        }

        .vz-tablet-shell {
          gap: 12px;
        }

        .vz-tablet-panel,
        .vz-tablet-stage,
        .vz-tablet-music {
          border-radius: 28px;
          border-width: 5px;
        }

        .vz-tablet-panel {
          padding: 12px;
          gap: 10px;
        }

        .vz-tablet-stage {
          padding: 12px;
          gap: 10px;
        }

        .vz-tablet-music {
          padding: 12px;
          gap: 8px;
          grid-template-rows: minmax(100px, 1fr) auto minmax(110px, 0.9fr);
        }
      }

      @media (max-width: 380px) {
        .vz-mobile-layout {
          padding-left: 10px;
          padding-right: 10px;
        }

        .vz-card {
          border-radius: 28px;
          border-width: 5px;
          padding: 14px;
        }

        .vz-voice-modes {
          gap: 7px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function getCharacterMarkup() {
    const nuniImgUrl = './assets/characters/nuni.png';

    return `
      <div class="vz-character">
        <img src="${nuniImgUrl}" alt="눈이" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';">
        <span class="vz-character-fallback">🐱</span>
      </div>
    `;
  }

  function getModeButtonsMarkup() {
    return `
      <div class="vz-voice-modes">
        <button class="vz-mode-btn ${state.voiceMode === 'normal' ? 'active' : ''}" type="button" data-mode="normal" aria-label="내 목소리">🧒</button>
        <button class="vz-mode-btn ${state.voiceMode === 'helium' ? 'active' : ''}" type="button" data-mode="helium" aria-label="헬륨가스 목소리">🎈</button>
        <button class="vz-mode-btn ${state.voiceMode === 'robot' ? 'active' : ''}" type="button" data-mode="robot" aria-label="로봇 목소리">🤖</button>
        <button class="vz-mode-btn ${state.voiceMode === 'monster' ? 'active' : ''}" type="button" data-mode="monster" aria-label="괴물 목소리">👻</button>
      </div>
    `;
  }

  function getMicButtonMarkup() {
    return `
      <div class="vz-mic-wrap">
        <svg class="vz-mic-progress" viewBox="0 0 100 100" aria-hidden="true">
          <circle class="vz-mic-track" cx="50" cy="50" r="45"></circle>
          <circle class="vz-mic-bar" cx="50" cy="50" r="45"></circle>
        </svg>
        <button class="vz-mic-btn" type="button" aria-label="마이크 켜고 끄기">🎤</button>
      </div>
    `;
  }

  function getMusicButtonMarkup() {
    return `
      <div class="vz-card-actions">
        <button class="vz-music-btn disabled" type="button" aria-label="노래 재생 버튼">🎵</button>
        <div class="vz-visualizer" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>
      </div>
    `;
  }

  function getMobileMarkup() {
    return `
      <div class="vz-mobile-layout">
        <div class="vz-mobile-header">
          ${getCharacterMarkup()}
          <h2 class="vz-title">시현아, 요술 마이크야!</h2>
        </div>

        <div class="vz-mobile-grid">
          <section class="vz-card" aria-label="요술 마이크">
            <h3 class="vz-card-title">요술 마이크 🎙️</h3>
            ${getModeButtonsMarkup()}
            <div class="vz-card-actions">
              ${getMicButtonMarkup()}
            </div>
          </section>

          <section class="vz-card" aria-label="신나는 노래">
            <div class="vz-card-visual">
              <img class="vz-card-img" src="./assets/voice/cards/song-play.webp" alt="" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='grid';">
              <span class="vz-card-fallback" style="display:none;">🎵</span>
            </div>
            <h3 class="vz-card-title">신나는 노래</h3>
            ${getMusicButtonMarkup()}
          </section>
        </div>
      </div>
    `;
  }

  function getTabletMarkup() {
    return `
      <div class="vz-tablet-layout">
        <div class="vz-tablet-shell">
          <aside class="vz-tablet-panel" aria-label="말하기 놀이터 안내">
            ${getCharacterMarkup()}
            <h2 class="vz-tablet-title">시현아,<br>요술 마이크야!</h2>
            <p class="vz-tablet-sub">목소리를 녹음하고<br>재미있게 변신해 보자!</p>
          </aside>

          <main class="vz-tablet-stage" aria-label="요술 마이크">
            <h3 class="vz-tablet-stage-title">요술 마이크 🎙️</h3>
            <div class="vz-tablet-mic-center">
              ${getMicButtonMarkup()}
            </div>
            ${getModeButtonsMarkup()}
          </main>

          <aside class="vz-tablet-music" aria-label="신나는 노래">
            <div class="vz-card-visual">
              <img class="vz-card-img" src="./assets/voice/cards/song-play.webp" alt="" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='grid';">
              <span class="vz-card-fallback" style="display:none;">🎵</span>
            </div>
            <div class="vz-tablet-music-title">신나는 노래</div>
            ${getMusicButtonMarkup()}
          </aside>
        </div>
      </div>
    `;
  }

  function bindDomEvents() {
    if (!state.container) return;

    const micBtns = state.container.querySelectorAll('.vz-mic-btn');
    const musicBtns = state.container.querySelectorAll('.vz-music-btn');
    const modeBtns = state.container.querySelectorAll('.vz-mode-btn');

    micBtns.forEach((btn) => {
      btn.addEventListener('click', toggleRecording);
    });

    musicBtns.forEach((btn) => {
      btn.addEventListener('click', toggleBgm);
    });

    modeBtns.forEach((btn) => {
      btn.addEventListener('click', () => setVoiceMode(btn.dataset.mode, btn));
    });
  }

  function initYouTubePlayer() {
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];

        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.head.appendChild(tag);
        }
      }

      const prevHook = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (prevHook) prevHook();
        if (!state.destroyed) createPlayer();
      };
    }

    state.ytLoadTimer = setTimeout(() => {
      if (!state.ytReady && state.container) {
        state.container.querySelectorAll('.vz-music-btn').forEach((musicBtn) => {
          musicBtn.innerHTML = '⚠️';
          musicBtn.style.background = '#ccc';
        });
      }
    }, 8000);
  }

  function createPlayer() {
    if (!state.container || !state.container.querySelector('#vz-yt-player')) return;
    if (!window.YT || !window.YT.Player) return;

    if (state.ytPlayer && typeof state.ytPlayer.destroy === 'function') {
      try {
        state.ytPlayer.destroy();
      } catch (error) {}
    }

    state.ytPlayer = new window.YT.Player('vz-yt-player', {
      height: '1',
      width: '1',
      playerVars: {
        listType: 'playlist',
        list: YOUTUBE_PLAYLIST_ID,
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0
      },
      events: {
        onReady: (e) => {
          clearTimeout(state.ytLoadTimer);
          e.target.setVolume(50);
          e.target.setShuffle(true);
          state.ytReady = true;
          updateMusicUI();
        },
        onStateChange: (e) => {
          if (e.data === window.YT.PlayerState.PLAYING) {
            state.isBgmPlaying = true;
          } else if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) {
            state.isBgmPlaying = false;
          }

          updateMusicUI();
        },
        onError: () => {
          clearTimeout(state.ytLoadTimer);
          updateMusicUI(true);
        }
      }
    });
  }

  function setVoiceMode(mode, btnEl) {
    if (state.isPlaying || state.isRecording) return;

    initAudio();
    playTone('down');

    if (navigator.vibrate) navigator.vibrate(30);

    state.voiceMode = mode;

    const buttons = state.container.querySelectorAll('.vz-mode-btn');

    buttons.forEach((btn) => {
      btn.classList.remove('active', 'vz-pop-anim');
      if (btn.dataset.mode === mode) btn.classList.add('active');
    });

    if (btnEl) {
      void btnEl.offsetWidth;
      btnEl.classList.add('vz-pop-anim');
    }

    const msg = {
      normal: '내 목소리!',
      helium: '헬륨가스 목소리!',
      robot: '로봇 목소리!',
      monster: '괴물 목소리!'
    };

    speakMsg(msg[mode]);
  }

  function getVisibleMicWrap() {
    if (!state.container) return null;

    const wraps = Array.from(state.container.querySelectorAll('.vz-mic-wrap'));
    return wraps.find((wrap) => {
      const rect = wrap.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }) || wraps[0] || null;
  }

  function spawnRipple() {
    const wrap = getVisibleMicWrap();

    if (!wrap || !state.isRecording) return;

    const ripple = document.createElement('div');
    ripple.className = 'vz-ripple';
    wrap.appendChild(ripple);

    setTimeout(() => {
      if (ripple && ripple.parentNode) ripple.remove();
    }, 1200);
  }

  async function toggleRecording() {
    if (state.locked || state.isPlaying) return;

    if (state.isRecording) {
      stopRecording();
      return;
    }

    initAudio();
    playTone('down');

    if (navigator.vibrate) navigator.vibrate(50);

    stopBgm();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let options = {};
      if (window.MediaRecorder && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (window.MediaRecorder && MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }

      try {
        state.mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        state.mediaRecorder = new MediaRecorder(stream);
      }

      state.audioMimeType = state.mediaRecorder.mimeType || 'audio/webm';
      state.audioChunks = [];

      state.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) state.audioChunks.push(event.data);
      };

      state.mediaRecorder.onstop = async () => {
        if (state.destroyed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const audioBlob = new Blob(state.audioChunks, { type: state.audioMimeType });
        stream.getTracks().forEach((track) => track.stop());
        playWithWebAudioAPI(audioBlob);
      };

      state.mediaRecorder.start();
      state.isRecording = true;
      updateMicUI();

      spawnRipple();
      state.rippleInterval = setInterval(spawnRipple, 400);

      state.recordTimer = setTimeout(() => {
        if (state.isRecording) stopRecording();
      }, 30000);
    } catch (err) {
      console.warn('Microphone access denied:', err);
      state.isRecording = false;
      updateMicUI();
      speakMsg('시현아, 마이크 권한을 허락해줘!');
    }
  }

  function stopRecording() {
    if (state.mediaRecorder && state.isRecording) {
      clearInterval(state.rippleInterval);
      clearTimeout(state.recordTimer);

      state.isRecording = false;
      state.mediaRecorder.stop();

      playTone('up');

      if (navigator.vibrate) navigator.vibrate([30, 50]);

      updateMicUI();
    }
  }

  async function playWithWebAudioAPI(blob) {
    state.isPlaying = true;
    updateMicUI();
    speakMsg('들어보자!');

    setTimeout(async () => {
      try {
        if (!state.audioCtx) initAudio();

        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await state.audioCtx.decodeAudioData(arrayBuffer);

        const source = state.audioCtx.createBufferSource();
        source.buffer = audioBuffer;

        let finalNode = source;

        if (state.voiceMode === 'helium') {
          source.playbackRate.value = 1.6;
        } else if (state.voiceMode === 'monster') {
          source.playbackRate.value = 0.65;
        } else if (state.voiceMode === 'robot') {
          const osc = state.audioCtx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.value = 45;

          const gainNode = state.audioCtx.createGain();

          source.connect(gainNode);
          osc.connect(gainNode.gain);

          finalNode = gainNode;

          osc.start();
          source.onended = () => {
            try {
              osc.stop();
            } catch (error) {}
            finishPlayback();
          };
        }

        finalNode.connect(state.audioCtx.destination);

        if (state.voiceMode !== 'robot') {
          source.onended = () => finishPlayback();
        }

        state.currentSource = source;
        source.start(0);
      } catch (e) {
        console.error('Web Audio API fallback:', e);

        const url = URL.createObjectURL(blob);

        if (!state.playbackAudio) {
          state.playbackAudio = new Audio();
          state.playbackAudio.playsInline = true;
          state.playbackAudio.setAttribute('playsinline', '');
        }

        state.playbackAudio.src = url;
        state.playbackAudio.play().catch(console.error);
        state.playbackAudio.onended = () => {
          URL.revokeObjectURL(url);
          finishPlayback();
        };
      }
    }, 1200);
  }

  function finishPlayback() {
    state.isPlaying = false;
    state.currentSource = null;
    updateMicUI();
  }

  function updateMicUI() {
    if (!state.container) return;

    const micBtns = state.container.querySelectorAll('.vz-mic-btn');

    micBtns.forEach((micBtn) => {
      micBtn.classList.remove('recording', 'playing');

      if (state.isRecording) {
        micBtn.classList.add('recording');
        micBtn.innerHTML = '⏹️';
      } else if (state.isPlaying) {
        micBtn.classList.add('playing');
        micBtn.innerHTML = '🔊';
      } else {
        micBtn.innerHTML = '🎤';
      }
    });
  }

  function toggleBgm() {
    if (state.isRecording || state.isPlaying || !state.ytReady || !state.ytPlayer) return;

    initAudio();
    playTone('down');

    if (state.isBgmPlaying) stopBgm();
    else playBgm();
  }

  function playBgm() {
    if (!state.ytReady || !state.ytPlayer) return;

    if (navigator.vibrate) navigator.vibrate(50);

    speakMsg('신나는 노래 틀어줄게!');
    state.ytPlayer.nextVideo();

    setTimeout(() => {
      if (state.ytPlayer && !state.destroyed) {
        state.ytPlayer.playVideo();
      }
    }, 1200);
  }

  function stopBgm() {
    if (state.ytPlayer && typeof state.ytPlayer.pauseVideo === 'function') {
      state.ytPlayer.pauseVideo();
    }

    state.isBgmPlaying = false;
    updateMusicUI();
  }

  function updateMusicUI(hasError = false) {
    if (!state.container) return;

    const musicBtns = state.container.querySelectorAll('.vz-music-btn');

    musicBtns.forEach((musicBtn) => {
      if (hasError) {
        musicBtn.classList.add('disabled');
        musicBtn.innerHTML = '⚠️';
        return;
      }

      if (!state.ytReady) {
        musicBtn.classList.add('disabled');
        return;
      }

      musicBtn.classList.remove('disabled');

      if (state.isBgmPlaying) {
        musicBtn.classList.add('playing');
        musicBtn.innerHTML = '⏸️';
      } else {
        musicBtn.classList.remove('playing');
        musicBtn.innerHTML = '🎵';
      }
    });
  }

  function render(container, options = {}) {
    destroy();
    injectStyle();

    state.container = container;
    state.options = options;
    state.destroyed = false;
    state.voiceMode = 'normal';

    state.playbackAudio = new Audio();
    state.playbackAudio.playsInline = true;
    state.playbackAudio.setAttribute('playsinline', '');
    state.playbackAudio.setAttribute('webkit-playsinline', '');

    container.innerHTML = `
      <div class="vz-root">
        <div id="vz-yt-player"></div>
        ${getMobileMarkup()}
        ${getTabletMarkup()}
      </div>
    `;

    bindDomEvents();
    updateMicUI();
    updateMusicUI();

    const root = container.querySelector('.vz-root');

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (state.container && root && !state.destroyed) {
          void root.offsetHeight;
        }
      });
    } else {
      setTimeout(() => {
        if (state.container && root && !state.destroyed) {
          void root.offsetHeight;
        }
      }, 100);
    }

    speakMsg('시현아! 요술 마이크를 톡! 누르고 말해봐! 목소리가 변신할 거야!');
    initYouTubePlayer();
  }

  function destroy() {
    state.destroyed = true;

    clearInterval(state.rippleInterval);
    clearTimeout(state.recordTimer);
    clearTimeout(state.ytLoadTimer);

    if (state.mediaRecorder && state.isRecording) {
      try {
        state.mediaRecorder.stop();
      } catch (error) {}
    }

    if (state.currentSource) {
      try {
        state.currentSource.stop();
      } catch (e) {}
    }

    if (state.playbackAudio) {
      state.playbackAudio.pause();
      state.playbackAudio.src = '';
      state.playbackAudio = null;
    }

    if (state.ytPlayer && typeof state.ytPlayer.destroy === 'function') {
      try {
        state.ytPlayer.destroy();
      } catch (error) {}
    }

    if (state.audioCtx && state.audioCtx.state !== 'closed') {
      state.audioCtx.close().catch(() => {});
      state.audioCtx = null;
    }

    if (state.container) state.container.innerHTML = '';

    state.container = null;
    state.ytPlayer = null;
    state.ytReady = false;
    state.isRecording = false;
    state.isPlaying = false;
    state.isBgmPlaying = false;
    state.locked = false;
    state.currentSource = null;
    state.mediaRecorder = null;
    state.audioChunks = [];
    state.audioMimeType = '';
    state.rippleInterval = null;
    state.recordTimer = null;
    state.ytLoadTimer = null;
  }

  window.SihyeonZones = window.SihyeonZones || {};
  window.SihyeonZones[ZONE_KEY] = { render, destroy };
})();