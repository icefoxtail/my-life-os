/**
 * 시현이 놀이터 OS — 말하기놀이터 (Voice Zone) v5.0
 * 파일: js/zones/voice-zone.js
 *
 * 기능: 요술 마이크(변조) + 유튜브 재생 + 30초 시각 타이머 + 권한/메모리 무결점 방어
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
    playbackAudio: null, // ★ 생성/소멸 관리
    ytPlayer: null,
    ytReady: false,
    ytLoadTimer: null,   // ★ 유튜브 로딩 타임아웃
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

  // ─── 오디오 엔진 (효과음 & 재생) ──────────────────────────────────
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
    osc.connect(gain); gain.connect(ctx.destination);

    if (type === 'down') { 
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'up') { 
      [659.25, 880].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + i * 0.1);
        g.gain.setValueAtTime(0.2, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
        o.connect(g); g.connect(ctx.destination);
        o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.4);
      });
    }
  }

  // ─── TTS 및 가이드 ─────────────────────────────────────
  function speakMsg(text) {
    if (state.options && typeof state.options.speakGuide === 'function') {
      state.options.speakGuide(text, true);
      return;
    }
    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'ko-KR'; utt.rate = 1.0; utt.pitch = 1.15;
    speechSynthesis.speak(utt);
  }

  // ─── 화려한 스타일 주입 ─────────────────
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
        overflow: auto; user-select: none; position: relative;
        -webkit-user-select: none; -webkit-touch-callout: none;
      }
      #vz-yt-player { position: absolute; top: 0; left: 0; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
      
      .vz-header { position: relative; z-index: 2; width: min(100%, 820px); display: grid; justify-items: center; gap: 8px; margin-bottom: 12px; }
      .vz-character {
        width: clamp(100px, 26vw, 150px); height: clamp(100px, 26vw, 150px);
        background: #fff; border-radius: 50%; border: 6px solid #ffb6c1;
        box-shadow: 0 8px 16px rgba(255, 182, 193, 0.4);
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 8px; flex-shrink: 0;
        animation: vz-float 3s ease-in-out infinite alternate;
      }
      @keyframes vz-float { from { transform: translateY(0); } to { transform: translateY(-10px); } }
      .vz-character img { width: 80%; height: 80%; object-fit: contain; border-radius: 50%; }
      .vz-title { margin: 0; color: #263238; text-align: center; font-size: clamp(26px, 7vw, 42px); line-height: 1.12; text-shadow: 0 2px 0 rgba(255,255,255,0.9); }
      
      .vz-card-grid {
        position: relative; z-index: 2; width: min(100%, 920px);
        display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: clamp(16px, 4vw, 26px); padding: 4px 0 max(12px, env(safe-area-inset-bottom));
      }
      
      .vz-card {
        min-height: 250px; border: 6px solid #fff; border-radius: 35px;
        background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,248,254,0.95));
        box-shadow: 0 12px 0 rgba(123, 31, 162, 0.1), 0 20px 30px rgba(0,0,0,0.1);
        display: flex; flex-direction: column; gap: 12px; padding: 20px;
      }
      .vz-card-visual {
        position: relative; flex: 1 1 auto; min-height: 150px; border-radius: 25px;
        overflow: hidden; display: grid; place-items: center;
        background: linear-gradient(180deg, #e3f2fd 0%, #fff4c4 100%);
        box-shadow: inset 0 -5px 0 rgba(0,0,0,0.06);
      }
      .vz-card-img { width: 100%; height: 100%; min-height: 150px; object-fit: cover; display: block; }
      .vz-card-fallback { width: 100%; height: 100%; min-height: 150px; display: grid; place-items: center; font-size: clamp(75px, 20vw, 120px); }
      
      .vz-card-title { color: #283593; font-size: clamp(26px, 6vw, 36px); font-weight: 900; line-height: 1.1; text-align: center; margin-top: 5px; }
      
      /* 요술 마이크 모드 선택기 */
      .vz-voice-modes { display: flex; justify-content: center; gap: 10px; margin-bottom: 10px; }
      .vz-mode-btn {
        width: clamp(55px, 14vw, 75px); height: clamp(55px, 14vw, 75px);
        border-radius: 50%; font-size: clamp(28px, 7vw, 40px);
        background: #fff; border: 4px solid #ddd;
        box-shadow: 0 4px 0 #ccc; display: grid; place-items: center;
        cursor: pointer; transition: all 0.2s; -webkit-tap-highlight-color: transparent;
      }
      .vz-mode-btn:active { transform: translateY(4px); box-shadow: 0 0 0 transparent; }
      .vz-mode-btn.active {
        border-color: #FF7A1A; background: #FFF3E0;
        box-shadow: 0 4px 0 #E65100, 0 0 15px rgba(255,122,26,0.4);
        transform: scale(1.15) translateY(-2px); z-index: 5;
      }
      
      /* ★ 7번: 모드 선택 피드백 (Pop 효과) */
      .vz-pop-anim { animation: btnPop 0.3s ease-out; }
      @keyframes btnPop { 0% { transform: scale(1.15); } 50% { transform: scale(1.35) rotate(-5deg); } 100% { transform: scale(1.15); } }

      .vz-card-actions { display: flex; justify-content: center; align-items: center; min-height: 120px; position: relative; }
      
      /* 마이크 버튼 및 시각 타이머 */
      .vz-mic-wrap { position: relative; display: grid; place-items: center; width: 100%; height: 100%; touch-action: manipulation; }
      .vz-mic-btn {
        position: relative; z-index: 10;
        width: clamp(120px, 30vw, 170px); height: clamp(120px, 30vw, 170px);
        border-radius: 50%; background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
        border: 8px solid #fff; box-shadow: 0 10px 20px rgba(0,0,0,0.15);
        font-size: clamp(65px, 16vw, 95px); display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s;
        -webkit-tap-highlight-color: transparent;
      }
      .vz-mic-btn:active { transform: scale(0.85); box-shadow: 0 5px 10px rgba(0,0,0,0.15); }
      
      .vz-mic-btn.recording { background: linear-gradient(135deg, #ff8a80 0%, #ff5252 100%); transform: scale(1.1); border-color: #ffebee; }
      .vz-mic-btn.playing { background: linear-gradient(135deg, #81c784 0%, #4caf50 100%); border-color: #e8f5e9; animation: vz-bounce 0.8s infinite alternate; pointer-events: none; }

      /* ★ 5번: 시각적 타이머 (30초 카운트다운) */
      .vz-mic-progress {
        position: absolute; top: -10%; left: -10%; width: 120%; height: 120%;
        z-index: 11; pointer-events: none; opacity: 0; transition: opacity 0.3s;
      }
      .vz-mic-progress circle { fill: none; stroke-width: 5; stroke-linecap: round; }
      .vz-mic-track { stroke: rgba(255,255,255,0.4); }
      .vz-mic-bar {
        stroke: #FF5252; stroke-dasharray: 283; stroke-dashoffset: 0;
        transform-origin: 50% 50%; transform: rotate(-90deg);
      }
      .vz-mic-btn.recording ~ .vz-mic-progress { opacity: 1; }
      .vz-mic-btn.recording ~ .vz-mic-progress .vz-mic-bar { animation: vz-timer-countdown 30s linear forwards; }
      @keyframes vz-timer-countdown { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 283; } }

      .vz-ripple {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: clamp(120px, 30vw, 170px); height: clamp(120px, 30vw, 170px);
        border-radius: 50%; border: 8px solid #ff5252;
        animation: rippleAnim 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; pointer-events: none; z-index: 1;
      }
      @keyframes rippleAnim { 0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; } 100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; border-width: 0px; } }

      /* 뮤직 버튼 */
      .vz-music-btn {
        position: relative; z-index: 10;
        width: clamp(110px, 28vw, 160px); height: clamp(110px, 28vw, 160px);
        border-radius: 50%; background: linear-gradient(135deg, #ffd54f 0%, #ffb300 100%);
        border: 8px solid #fff; box-shadow: 0 10px 0 rgba(230,126,0,0.3), 0 15px 25px rgba(0,0,0,0.15);
        font-size: clamp(60px, 15vw, 85px); display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: transform 0.1s, opacity 0.3s, box-shadow 0.1s; -webkit-tap-highlight-color: transparent;
      }
      .vz-music-btn:active { transform: scale(0.9) translateY(5px); box-shadow: 0 4px 0 rgba(230,126,0,0.3), 0 8px 15px rgba(0,0,0,0.15); }
      .vz-music-btn.playing { animation: vz-music-dance 0.5s infinite alternate; }
      .vz-music-btn.disabled { opacity: 0.5; filter: grayscale(0.5); pointer-events: none; }
      
      @keyframes vz-music-dance { from { transform: translateY(0) rotate(-5deg); } to { transform: translateY(-15px) rotate(5deg); } }
      @keyframes vz-bounce { from { transform: scale(1); } to { transform: scale(1.15); } }

      /* 댄싱 이퀄라이저 */
      .vz-visualizer {
        position: absolute; bottom: -5px; display: flex; gap: 8px; align-items: flex-end; justify-content: center; height: 35px; z-index: 20; opacity: 0; transition: opacity 0.3s; pointer-events: none;
      }
      .vz-music-btn.playing ~ .vz-visualizer { opacity: 1; }
      .vz-visualizer span { width: 10px; background: #FF5252; border-radius: 5px; animation: eqDance 0.5s ease-in-out infinite alternate; }
      .vz-visualizer span:nth-child(1) { height: 15px; animation-delay: 0.1s; background: #FF5252; }
      .vz-visualizer span:nth-child(2) { height: 30px; animation-delay: 0.3s; background: #4CAF50; }
      .vz-visualizer span:nth-child(3) { height: 20px; animation-delay: 0.0s; background: #2196F3; }
      .vz-visualizer span:nth-child(4) { height: 35px; animation-delay: 0.2s; background: #FFC107; }
      @keyframes eqDance { 0% { transform: scaleY(0.4); } 100% { transform: scaleY(1.6); } }

      @media (max-width: 680px) { .vz-card-grid { grid-template-columns: 1fr; gap: 20px; } .vz-card { min-height: 250px; } }
    `;
    document.head.appendChild(style);
  }

  // ─── 유튜브 연동 (에러 타임아웃 추가) ───────────────────────────────────────
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

    // ★ 3번: 로딩 실패 방어 타임아웃 (8초)
    state.ytLoadTimer = setTimeout(() => {
      if (!state.ytReady && state.container) {
        const musicBtn = state.container.querySelector('.vz-music-btn');
        if (musicBtn) {
          musicBtn.innerHTML = '⚠️';
          musicBtn.style.background = '#ccc';
        }
      }
    }, 8000);
  }

  function createPlayer() {
    if (!state.container || !state.container.querySelector('#vz-yt-player')) return;

    state.ytPlayer = new window.YT.Player('vz-yt-player', {
      height: '1', width: '1',
      playerVars: { listType: 'playlist', list: YOUTUBE_PLAYLIST_ID, autoplay: 0, controls: 0, disablekb: 1, fs: 0 },
      events: {
        onReady: (e) => {
          clearTimeout(state.ytLoadTimer);
          e.target.setVolume(50); e.target.setShuffle(true);
          state.ytReady = true;
          updateMusicUI();
        },
        onStateChange: (e) => {
          if (e.data === window.YT.PlayerState.PLAYING) state.isBgmPlaying = true;
          else if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) state.isBgmPlaying = false;
          updateMusicUI();
        },
        onError: () => {
          clearTimeout(state.ytLoadTimer);
          updateMusicUI(true); // 에러 UI
        }
      }
    });
  }

  // ─── 요술 마이크 (모드 변경 + 시각 피드백) ─────────────────────────────────
  function setVoiceMode(mode, btnEl) {
    if (state.isPlaying || state.isRecording) return;
    initAudio();
    playTone('down');
    if (navigator.vibrate) navigator.vibrate(30);
    
    state.voiceMode = mode;
    
    const buttons = state.container.querySelectorAll('.vz-mode-btn');
    buttons.forEach(btn => {
      btn.classList.remove('active', 'vz-pop-anim');
      if (btn.dataset.mode === mode) btn.classList.add('active');
    });

    // 팝 애니메이션 추가 (피드백)
    if (btnEl) {
      void btnEl.offsetWidth; 
      btnEl.classList.add('vz-pop-anim');
    }

    const msg = { normal: '내 목소리!', helium: '헬륨가스 목소리!', robot: '로봇 목소리!', monster: '괴물 목소리!' };
    speakMsg(msg[mode]);
  }

  // ─── 녹음 기능 (클릭 토글 + 자동종료) ───────────────────────────────
  function spawnRipple() {
    const wrap = state.container?.querySelector('.vz-mic-wrap');
    if (!wrap || !state.isRecording) return;
    const ripple = document.createElement('div');
    ripple.className = 'vz-ripple';
    wrap.appendChild(ripple);
    setTimeout(() => ripple.remove(), 1200);
  }

  async function toggleRecording(e) {
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
      
      // ★ 6번: 모바일 폴백 (MIME 타입 감지 강화)
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) options = { mimeType: 'audio/webm;codecs=opus' };
      else if (MediaRecorder.isTypeSupported('audio/mp4')) options = { mimeType: 'audio/mp4' }; // iOS
      
      try {
        state.mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        state.mediaRecorder = new MediaRecorder(stream); // 최후의 폴백
      }
      
      state.audioMimeType = state.mediaRecorder.mimeType || 'audio/webm'; 
      state.audioChunks = [];

      state.mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) state.audioChunks.push(event.data);
      };

      state.mediaRecorder.onstop = async () => {
        if (state.destroyed) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        const audioBlob = new Blob(state.audioChunks, { type: state.audioMimeType });
        stream.getTracks().forEach(track => track.stop());
        playWithWebAudioAPI(audioBlob);
      };

      state.mediaRecorder.start();
      state.isRecording = true;
      updateMicUI();
      
      spawnRipple();
      state.rippleInterval = setInterval(spawnRipple, 400);

      // 30초 뒤 자동 종료 타이머
      state.recordTimer = setTimeout(() => {
        if (state.isRecording) stopRecording();
      }, 30000);

    } catch (err) {
      // ★ 2번: 마이크 권한 거부 시 상태 원상복구
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
      state.mediaRecorder.stop(); // 이 순간 onstop 트리거 -> playWithWebAudioAPI
      
      playTone('up');
      if (navigator.vibrate) navigator.vibrate([30, 50]);
      updateMicUI();
    }
  }

  // Web Audio API를 사용한 마법 재생
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
        } 
        else if (state.voiceMode === 'monster') {
          source.playbackRate.value = 0.65;
        } 
        else if (state.voiceMode === 'robot') {
          const osc = state.audioCtx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.value = 45; 
          
          const gainNode = state.audioCtx.createGain();
          source.connect(gainNode);
          osc.connect(gainNode.gain);
          
          finalNode = gainNode;
          
          osc.start();
          source.onended = () => { osc.stop(); finishPlayback(); };
        }

        finalNode.connect(state.audioCtx.destination);
        
        if (state.voiceMode !== 'robot') {
          source.onended = () => finishPlayback();
        }

        state.currentSource = source;
        source.start(0);

      } catch (e) {
        console.error('Web Audio API fallback:', e);
        // ★ 4번: iOS Autoplay 대응을 위해 playsInline 설정
        const url = URL.createObjectURL(blob);
        state.playbackAudio.src = url;
        state.playbackAudio.play().catch(console.error);
        state.playbackAudio.onended = () => { URL.revokeObjectURL(url); finishPlayback(); };
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
    const micBtn = state.container.querySelector('.vz-mic-btn');
    if (!micBtn) return;

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
  }

  // ─── 음악 재생 ─────────────────────────────────────────
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
    setTimeout(() => { state.ytPlayer.playVideo(); }, 1200);
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
    const musicBtn = state.container.querySelector('.vz-music-btn');
    if (!musicBtn) return;

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
  }

  // ─── 렌더링 및 해제 ────────────────────────────────────
  function render(container, options = {}) {
    destroy();
    injectStyle();
    state.container = container;
    state.options = options;
    state.destroyed = false;
    state.voiceMode = 'normal';

    // ★ 1번: playbackAudio 라이프사이클 관리
    state.playbackAudio = new Audio();
    state.playbackAudio.playsInline = true;

    const nuniImgUrl = './assets/characters/nuni.png';

    container.innerHTML = `
      <div class="vz-root">
        <div id="vz-yt-player"></div>
        <div class="vz-header">
          <div class="vz-character">
            <img src="${nuniImgUrl}" alt="눈이" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <span class="vz-character-fallback" style="display:none; font-size: 80px;">🐱</span>
          </div>
          <h2 class="vz-title">시현아, 요술 마이크야!</h2>
        </div>

        <div class="vz-card-grid">
          <section class="vz-card" aria-label="요술 마이크">
            <div class="vz-card-title">요술 마이크 🎙️</div>
            
            <div class="vz-voice-modes">
              <button class="vz-mode-btn active" data-mode="normal">🧒</button>
              <button class="vz-mode-btn" data-mode="helium">🎈</button>
              <button class="vz-mode-btn" data-mode="robot">🤖</button>
              <button class="vz-mode-btn" data-mode="monster">👻</button>
            </div>

            <div class="vz-card-actions">
              <div class="vz-mic-wrap">
                <svg class="vz-mic-progress" viewBox="0 0 100 100">
                  <circle class="vz-mic-track" cx="50" cy="50" r="45"></circle>
                  <circle class="vz-mic-bar" cx="50" cy="50" r="45"></circle>
                </svg>
                <button class="vz-mic-btn" type="button" aria-label="마이크 켜고 끄기">🎤</button>
              </div>
            </div>
          </section>

          <section class="vz-card" aria-label="신나는 노래">
            <div class="vz-card-visual">
              <img class="vz-card-img" src="./assets/voice/cards/song-play.webp" alt="" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='grid';">
              <span class="vz-card-fallback" style="display:none;">🎵</span>
            </div>
            <div class="vz-card-title">신나는 노래</div>
            <div class="vz-card-actions" style="position:relative;">
              <button class="vz-music-btn disabled" type="button" aria-label="노래 재생 버튼">🎵</button>
              <div class="vz-visualizer">
                <span></span><span></span><span></span><span></span>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    const micBtn = container.querySelector('.vz-mic-btn');
    const musicBtn = container.querySelector('.vz-music-btn');
    const modeBtns = container.querySelectorAll('.vz-mode-btn');

    micBtn.addEventListener('click', toggleRecording);
    musicBtn.addEventListener('click', toggleBgm);

    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => setVoiceMode(btn.dataset.mode, btn));
    });

    speakMsg("시현아! 요술 마이크를 톡! 누르고 말해봐! 목소리가 변신할 거야!");

    initYouTubePlayer();
  }

  function destroy() {
    state.destroyed = true;
    clearInterval(state.rippleInterval);
    clearTimeout(state.recordTimer);
    clearTimeout(state.ytLoadTimer);

    if (state.mediaRecorder && state.isRecording) {
      state.mediaRecorder.stop();
    }

    if (state.currentSource) {
      try { state.currentSource.stop(); } catch(e){}
    }
    
    // ★ playbackAudio 완벽 초기화
    if (state.playbackAudio) {
      state.playbackAudio.pause();
      state.playbackAudio.src = '';
      state.playbackAudio = null;
    }

    if (state.ytPlayer && typeof state.ytPlayer.destroy === 'function') {
      state.ytPlayer.destroy();
    }

    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
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
  }

  window.SihyeonZones = window.SihyeonZones || {};
  window.SihyeonZones[ZONE_KEY] = { render, destroy };
})();
