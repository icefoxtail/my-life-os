/**
 * 시현이 놀이터 OS — 말하기광장 (Voice Zone)
 * 파일: js/zones/voice-zone.js
 *
 * 기능: 누르고 말하기(MediaRecorder API) + 유튜브 동요 자동 재생(IFrame API)
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
    playbackAudio: new Audio(),
    ytPlayer: null,
    ytReady: false,
    isRecording: false,
    isPlaying: false,
    isBgmPlaying: false,
    locked: false,
    destroyed: false,
  };

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .vz-root {
        width: 100%; height: 100%; min-height: 100%;
        display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
        background: linear-gradient(160deg, #fff0f5 0%, #e0f7fa 100%);
        font-family: 'Jua', 'Nanum Gothic', sans-serif;
        padding: clamp(14px, 3vw, 24px); box-sizing: border-box;
        overflow: auto;
        user-select: none;
        touch-action: pan-y;
        position: relative;
      }
      #vz-yt-player {
        position: absolute; top: 0; left: 0;
        width: 1px; height: 1px; opacity: 0; pointer-events: none;
      }
      .vz-character {
        width: clamp(92px, 24vw, 138px);
        height: clamp(92px, 24vw, 138px);
        background: #fff;
        border-radius: 50%;
        border: 6px solid #ffb6c1;
        box-shadow: 0 8px 16px rgba(255, 182, 193, 0.4);
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 8px;
        flex-shrink: 0;
      }
      .vz-character img {
        width: 80%; height: 80%; object-fit: contain; border-radius: 50%;
      }
      .vz-header {
        position: relative; z-index: 2; width: min(100%, 820px);
        display: grid; justify-items: center; gap: 8px; margin-bottom: 12px;
      }
      .vz-title {
        margin: 0; color: #263238; text-align: center;
        font-size: clamp(24px, 6vw, 40px); line-height: 1.12;
        text-shadow: 0 2px 0 rgba(255,255,255,0.75);
      }
      .vz-card-grid {
        position: relative; z-index: 2; width: min(100%, 920px);
        display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: clamp(14px, 3vw, 22px); padding: 4px 0 max(12px, env(safe-area-inset-bottom));
      }
      .vz-card {
        min-height: 260px; border: 5px solid #fff; border-radius: 28px;
        background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,248,254,0.95));
        box-shadow: 0 10px 0 rgba(123, 31, 162, 0.14), 0 18px 28px rgba(0,0,0,0.13);
        display: flex; flex-direction: column; gap: 10px; padding: 13px;
      }
      .vz-card-visual {
        position: relative; flex: 1 1 auto; min-height: 140px; border-radius: 22px;
        overflow: hidden; display: grid; place-items: center;
        background: linear-gradient(180deg, #e3f2fd 0%, #fff4c4 100%);
        box-shadow: inset 0 -5px 0 rgba(0,0,0,0.06);
      }
      .vz-card-img { width: 100%; height: 100%; min-height: 140px; object-fit: cover; display: block; }
      .vz-card-fallback { width: 100%; height: 100%; min-height: 140px; display: grid; place-items: center; font-size: clamp(68px, 18vw, 110px); }
      .vz-card-title {
        color: #283593; font-size: clamp(21px, 5vw, 30px);
        font-weight: 900; line-height: 1.08; text-align: center;
      }
      .vz-card-desc {
        color: #5f4775; font-size: clamp(14px, 3.4vw, 17px);
        line-height: 1.3; text-align: center; min-height: 2.6em;
      }
      .vz-card-actions { display: flex; justify-content: center; align-items: center; min-height: 76px; }
      .vz-controls {
        position: relative;
        display: flex; align-items: center; justify-content: center;
      }
      .vz-mic-btn {
        width: clamp(104px, 26vw, 156px);
        height: clamp(104px, 26vw, 156px);
        border-radius: 50%;
        background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
        border: 8px solid #fff;
        box-shadow: 0 10px 20px rgba(0,0,0,0.15);
        font-size: clamp(60px, 15vw, 100px);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        transition: transform 0.1s, background 0.3s;
        -webkit-tap-highlight-color: transparent;
        z-index: 10;
      }
      .vz-mic-btn:active {
        transform: scale(0.92);
      }
      .vz-mic-btn:focus-visible,
      .vz-music-btn:focus-visible { outline: 5px solid #ffd54f; outline-offset: 4px; }
      @keyframes vz-pulse-red {
        0% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7); }
        70% { box-shadow: 0 0 0 40px rgba(255, 82, 82, 0); }
        100% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0); }
      }
      @keyframes vz-pulse-green {
        0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
        70% { box-shadow: 0 0 0 40px rgba(76, 175, 80, 0); }
        100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
      }
      .vz-mic-btn.recording {
        background: linear-gradient(135deg, #ff8a80 0%, #ff5252 100%);
        animation: vz-pulse-red 1.2s infinite;
        border-color: #ffebee;
      }
      .vz-mic-btn.playing {
        background: linear-gradient(135deg, #81c784 0%, #4caf50 100%);
        animation: vz-pulse-green 1.2s infinite;
        border-color: #e8f5e9;
      }
      .vz-music-btn {
        position: relative;
        width: clamp(96px, 24vw, 136px);
        height: clamp(96px, 24vw, 136px);
        border-radius: 50%;
        background: linear-gradient(135deg, #ffd54f 0%, #ffb300 100%);
        border: 7px solid #fff;
        box-shadow: 0 8px 0 rgba(230,126,0,0.28), 0 14px 22px rgba(0,0,0,0.14);
        font-size: clamp(44px, 11vw, 70px);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        transition: transform 0.1s, opacity 0.3s, box-shadow 0.1s;
        -webkit-tap-highlight-color: transparent;
        z-index: 20;
      }
      .vz-music-btn:active { transform: scale(0.94) translateY(3px); box-shadow: 0 4px 0 rgba(230,126,0,0.25), 0 8px 16px rgba(0,0,0,0.12); }
      .vz-music-btn.playing {
        animation: vz-bounce 1s infinite alternate;
      }
      .vz-music-btn.disabled {
        opacity: 0.5; pointer-events: none;
      }
      @keyframes vz-bounce {
        from { transform: translateY(0); }
        to { transform: translateY(-10px); }
      }
      @media (max-width: 680px) {
        .vz-card-grid { grid-template-columns: 1fr; }
        .vz-card { min-height: 235px; }
      }
    `;
    document.head.appendChild(style);
  }

  function speakMsg(text) {
    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'ko-KR';
    utt.rate = 1.1;
    utt.pitch = 1.2;
    speechSynthesis.speak(utt);
  }

  function initYouTubePlayer() {
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      const prevHook = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (prevHook) prevHook();
        if (!state.destroyed) createPlayer();
      };
    }
  }

  function createPlayer() {
    if (!state.container || !state.container.querySelector('#vz-yt-player')) return;

    state.ytPlayer = new window.YT.Player('vz-yt-player', {
      height: '1',
      width: '1',
      playerVars: {
        listType: 'playlist',
        list: YOUTUBE_PLAYLIST_ID,
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
      },
      events: {
        onReady: (e) => {
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
        }
      }
    });
  }

  async function startRecording(e) {
    if (state.locked || state.isPlaying) return;

    const btn = e.currentTarget;
    if (btn.setPointerCapture && e.pointerId != null) btn.setPointerCapture(e.pointerId);

    stopBgm();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.mediaRecorder = new MediaRecorder(stream);
      state.audioChunks = [];

      state.mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) state.audioChunks.push(event.data);
      };

      state.mediaRecorder.onstop = () => {
        if (state.destroyed) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        playRecordedAudio(audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      state.mediaRecorder.start();
      state.isRecording = true;
      updateMicUI();
      speakMsg('말해봐!');
    } catch (err) {
      console.warn('Microphone access denied:', err);
      speakMsg('마이크를 켜줘!');
    }
  }

  function stopRecording(e) {
    const btn = e.currentTarget;
    if (btn.releasePointerCapture && e.pointerId != null) btn.releasePointerCapture(e.pointerId);

    if (state.mediaRecorder && state.isRecording) {
      state.isRecording = false;
      state.mediaRecorder.stop();
      updateMicUI();
    }
  }

  function playRecordedAudio(url) {
    state.isPlaying = true;
    updateMicUI();
    speakMsg('들어봐!');

    setTimeout(() => {
      state.playbackAudio.src = url;
      state.playbackAudio.play().catch(e => {
        console.error('Audio playback failed:', e);
        finishPlayback();
      });

      state.playbackAudio.onended = () => {
        URL.revokeObjectURL(url);
        finishPlayback();
      };
    }, 800);
  }

  function finishPlayback() {
    state.isPlaying = false;
    updateMicUI();
  }

  function updateMicUI() {
    if (!state.container) return;
    const micBtn = state.container.querySelector('.vz-mic-btn');
    if (!micBtn) return;

    micBtn.classList.remove('recording', 'playing');

    if (state.isRecording) {
      micBtn.classList.add('recording');
      micBtn.textContent = '🎤';
    } else if (state.isPlaying) {
      micBtn.classList.add('playing');
      micBtn.textContent = '🔊';
    } else {
      micBtn.textContent = '🎤';
    }
  }

  function toggleBgm() {
    if (state.isRecording || state.isPlaying || !state.ytReady || !state.ytPlayer) return;

    if (state.isBgmPlaying) {
      stopBgm();
    } else {
      playBgm();
    }
  }

  function playBgm() {
    if (!state.ytReady || !state.ytPlayer) return;
    speakMsg('노래 부를게!');
    state.ytPlayer.nextVideo();
    setTimeout(() => {
      state.ytPlayer.playVideo();
    }, 800);
  }

  function stopBgm() {
    if (state.ytPlayer && typeof state.ytPlayer.pauseVideo === 'function') {
      state.ytPlayer.pauseVideo();
    }
    state.isBgmPlaying = false;
    updateMusicUI();
  }

  function updateMusicUI() {
    if (!state.container) return;
    const musicBtn = state.container.querySelector('.vz-music-btn');
    if (!musicBtn) return;

    if (!state.ytReady) {
      musicBtn.classList.add('disabled');
      return;
    }
    musicBtn.classList.remove('disabled');

    if (state.isBgmPlaying) {
      musicBtn.classList.add('playing');
      musicBtn.textContent = '⏸️';
    } else {
      musicBtn.classList.remove('playing');
      musicBtn.textContent = '🎵';
    }
  }

  function render(container) {
    destroy();
    injectStyle();
    state.container = container;
    state.destroyed = false;

    const nuniImgUrl = './assets/characters/nuni.png';

    container.innerHTML = `
      <div class="vz-root">
        <div id="vz-yt-player"></div>
        <div class="vz-header">
          <div class="vz-character">
            <img src="${nuniImgUrl}" alt="눈이" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <span class="vz-character-fallback" style="display:none; font-size: 80px;">🐱</span>
          </div>
          <h2 class="vz-title">시현아, 말하고 다시 들어볼까?</h2>
        </div>

        <div class="vz-card-grid">
          <section class="vz-card" aria-label="내 목소리 듣기">
            <div class="vz-card-visual">
              <img class="vz-card-img" src="./assets/voice/cards/voice-record.png" alt="" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='grid';">
              <span class="vz-card-fallback" style="display:none;">🎙️</span>
            </div>
            <div class="vz-card-title">내 목소리 듣기</div>
            <div class="vz-card-desc">꾹 누르고 말하면, 내 목소리가 다시 나와요</div>
            <div class="vz-card-actions">
              <button class="vz-mic-btn" type="button" aria-label="꾹 누르고 말하기">🎤</button>
            </div>
          </section>

          <section class="vz-card" aria-label="노래 틀어줘">
            <div class="vz-card-visual">
              <img class="vz-card-img" src="./assets/voice/cards/song-play.png" alt="" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='grid';">
              <span class="vz-card-fallback" style="display:none;">🎵</span>
            </div>
            <div class="vz-card-title">노래 틀어줘</div>
            <div class="vz-card-desc">누르면 신나는 노래가 나와요</div>
            <div class="vz-card-actions">
              <button class="vz-music-btn disabled" type="button" aria-label="노래 재생 버튼">🎵</button>
            </div>
          </section>
        </div>
      </div>
    `;

    const micBtn = container.querySelector('.vz-mic-btn');
    const musicBtn = container.querySelector('.vz-music-btn');

    micBtn.addEventListener('pointerdown', startRecording);
    micBtn.addEventListener('pointerup', stopRecording);
    micBtn.addEventListener('pointercancel', stopRecording);
    musicBtn.addEventListener('click', toggleBgm);

    initYouTubePlayer();
  }

  function destroy() {
    state.destroyed = true;

    if (state.mediaRecorder && state.isRecording) {
      state.mediaRecorder.stop();
    }

    state.playbackAudio.pause();
    state.playbackAudio.src = '';

    if (state.ytPlayer && typeof state.ytPlayer.destroy === 'function') {
      state.ytPlayer.destroy();
    }

    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }

    if (state.container) state.container.innerHTML = '';
    state.container = null;
    state.ytPlayer = null;
    state.ytReady = false;
    state.isRecording = false;
    state.isPlaying = false;
    state.isBgmPlaying = false;
    state.locked = false;
  }

  window.SihyeonZones = window.SihyeonZones || {};
  window.SihyeonZones[ZONE_KEY] = { render, destroy };
})();
