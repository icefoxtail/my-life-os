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
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: linear-gradient(160deg, #fff0f5 0%, #e0f7fa 100%);
        font-family: 'Jua', 'Nanum Gothic', sans-serif;
        padding: 20px; box-sizing: border-box;
        overflow: hidden;
        user-select: none;
        touch-action: none;
        position: relative;
      }
      #vz-yt-player {
        position: absolute; top: 0; left: 0;
        width: 1px; height: 1px; opacity: 0; pointer-events: none;
      }
      .vz-character {
        width: clamp(120px, 30vw, 180px);
        height: clamp(120px, 30vw, 180px);
        background: #fff;
        border-radius: 50%;
        border: 6px solid #ffb6c1;
        box-shadow: 0 8px 16px rgba(255, 182, 193, 0.4);
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 50px;
        flex-shrink: 0;
      }
      .vz-character img {
        width: 80%; height: 80%; object-fit: contain; border-radius: 50%;
      }
      .vz-controls {
        position: relative;
        display: flex; align-items: center; justify-content: center;
      }
      .vz-mic-btn {
        width: clamp(140px, 35vw, 220px);
        height: clamp(140px, 35vw, 220px);
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
        position: absolute;
        bottom: -10px; right: -20px;
        width: clamp(60px, 15vw, 80px);
        height: clamp(60px, 15vw, 80px);
        border-radius: 50%;
        background: linear-gradient(135deg, #ffd54f 0%, #ffb300 100%);
        border: 4px solid #fff;
        box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        font-size: clamp(28px, 7vw, 36px);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        transition: transform 0.1s, opacity 0.3s;
        -webkit-tap-highlight-color: transparent;
        z-index: 20;
      }
      .vz-music-btn:active { transform: scale(0.9); }
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
        <div class="vz-character">
          <img src="${nuniImgUrl}" alt="눈이" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <span class="vz-character-fallback" style="display:none; font-size: 80px;">🐱</span>
        </div>
        <div class="vz-controls">
          <button class="vz-mic-btn" type="button" aria-label="마이크 버튼">🎤</button>
          <button class="vz-music-btn disabled" type="button" aria-label="노래 재생 버튼">🎵</button>
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
