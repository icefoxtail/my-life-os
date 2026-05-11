/**
 * 시현이 놀이터 OS — 시현이 노래방 (Karaoke Zone)
 * 파일: js/zones/karaoke-zone.js
 * 버전: v4.7.1 — v4.5 안정본 + 점수판/콤보/자막댄싱 보정완성본
 * 기준: v4.5 안정본 유지 + 점수판/콤보/자막댄싱 최소추가 + 중복/완주/타이머 보정
 */
(function () {
  'use strict';

  window.SihyeonZones = window.SihyeonZones || {};

  const STYLE_ID = 'sihyeon-karaoke-zone-style';

  const SONGS = [
    {"id": "playing_is_best", "title": "노는 게 제일 좋아", "emoji": "🐧", "theme": "snow", "youtubeId": "mZpjPAxtNYI", "desc": "뽀로로 노래", "instruments": ["원곡 영상", "마이크", "박수", "눈꽃 무대"], "lines": ["노는 게 제일 좋아", "친구들 모여라", "언제나 즐거워", "신나게 불러요"], "startOffset": 0, "volume": 70},
    {"id": "banana_chacha", "title": "바나나 차차", "emoji": "🍌", "theme": "party", "youtubeId": "cyJgx5kFAfI", "desc": "신나는 바나나 노래", "instruments": ["원곡 영상", "마이크", "박수", "파티 무대"], "lines": ["바나나 차차", "신나게 차차", "랄랄라 차차", "같이 춤춰요"], "startOffset": 0, "volume": 70},
    {"id": "gogo_dino", "title": "고고다이노", "emoji": "🦖", "theme": "dino", "youtubeId": "acB-EDNOCBw", "desc": "공룡 구조대 노래", "instruments": ["원곡 영상", "마이크", "북", "출동 조명"], "lines": ["고고 고고 다이노", "고고 고고 다이노", "출동해요 다이노", "힘차게 달려요"], "startOffset": 0, "volume": 70},
    {"id": "tayo", "title": "타요", "emoji": "🚌", "theme": "city", "youtubeId": "tVU53nGuPGw", "desc": "꼬마버스 노래", "instruments": ["원곡 영상", "마이크", "벨", "버스 무대"], "lines": ["타요 타요", "달려요", "빵빵 신나게", "친구들과 가요"], "startOffset": 0, "volume": 70},
    {"id": "kongsuni", "title": "콩순이", "emoji": "👧", "theme": "party", "youtubeId": "ORZbDTZaB8U", "desc": "콩순이 노래", "instruments": ["원곡 영상", "마이크", "박수", "친구 무대"], "lines": ["콩순이", "친구들과 함께", "신나게 놀아요", "노래해요"], "startOffset": 0, "volume": 70},
    {"id": "fancy_tomato", "title": "멋쟁이 토마토", "emoji": "🍅", "theme": "flower", "youtubeId": "5i-GDvqldc8", "desc": "토마토 동요", "instruments": ["원곡 영상", "마이크", "박수", "채소 무대"], "lines": ["멋쟁이 토마토", "빨간 토마토", "싱글벙글 웃어요", "신나게 불러요"], "startOffset": 0, "volume": 70},
    {"id": "little_star", "title": "작은 별", "emoji": "⭐", "theme": "star", "youtubeId": "tIRul7vW_b0", "desc": "별 노래", "instruments": ["원곡 영상", "마이크", "종", "별 무대"], "lines": ["반짝 반짝", "작은 별", "아름답게 비치네", "밤하늘에 반짝"], "startOffset": 0, "volume": 70},
    {"id": "dad_cheer_up", "title": "아빠 힘내세요", "emoji": "💪", "theme": "party", "youtubeId": "ZZh3Lw_B7Vs", "desc": "가족 응원 노래", "instruments": ["원곡 영상", "마이크", "박수", "응원 무대"], "lines": ["아빠 힘내세요", "우리가 있잖아요", "힘내세요", "사랑해요"], "startOffset": 0, "volume": 70},
    {"id": "round_and_round", "title": "둥글게 둥글게", "emoji": "⭕", "theme": "party", "youtubeId": "L21Yd-dYM1s", "desc": "율동 동요", "instruments": ["원곡 영상", "마이크", "박수", "율동 무대"], "lines": ["둥글게 둥글게", "빙글빙글 돌아요", "손에 손을 잡고", "신나게 놀아요"], "startOffset": 0, "volume": 70},
    {"id": "three_bears", "title": "곰 세 마리", "emoji": "🐻", "theme": "forest", "youtubeId": "L6_y2KvGNts", "desc": "곰 가족 노래", "instruments": ["원곡 영상", "마이크", "박수", "숲속 무대"], "lines": ["곰 세 마리가", "한 집에 있어", "아빠 곰 엄마 곰", "애기 곰"], "startOffset": 0, "volume": 70},
    {"id": "all_together", "title": "우리 모두 다 같이", "emoji": "👏", "theme": "party", "youtubeId": "eu89jwQbp0k", "desc": "박수 놀이 노래", "instruments": ["원곡 영상", "마이크", "박수", "파티 무대"], "lines": ["우리 모두 다 같이", "손뼉을 쳐요", "우리 모두 다 같이", "신나게 해요"], "startOffset": 0, "volume": 70},
    {"id": "freeze_dance", "title": "그대로 멈춰라", "emoji": "🧊", "theme": "party", "youtubeId": "avRH4M-AJa8", "desc": "멈춤 놀이 노래", "instruments": ["원곡 영상", "마이크", "박수", "놀이 무대"], "lines": ["그대로 멈춰라", "움직이면 안 돼요", "다시 또 움직여요", "신나게 놀아요"], "startOffset": 0, "volume": 70},
    {"id": "school_bell", "title": "학교종", "emoji": "🔔", "theme": "bell", "youtubeId": "-KYsZGZHPyU", "desc": "딩동댕 노래", "instruments": ["원곡 영상", "마이크", "종소리", "딩동 무대"], "lines": ["학교종이 땡땡땡", "어서 모이자", "선생님이 우리를", "기다리신다"], "startOffset": 0, "volume": 70},
    {"id": "its_okay", "title": "괜찮아요", "emoji": "😊", "theme": "flower", "youtubeId": "jntmFkLqVR4", "desc": "마음 동요", "instruments": ["원곡 영상", "마이크", "박수", "따뜻한 무대"], "lines": ["괜찮아요", "괜찮아요", "다시 해봐요", "웃어봐요"], "startOffset": 0, "volume": 70},
    {"id": "jjalang_jjalang", "title": "짤랑짤랑", "emoji": "🪇", "theme": "bell", "youtubeId": "Cl1RFhjTIz0", "desc": "리듬 동요", "instruments": ["원곡 영상", "마이크", "종", "리듬 무대"], "lines": ["짤랑짤랑", "소리가 나요", "신나게 흔들어요", "같이 노래해요"], "startOffset": 0, "volume": 70}
  ];

  const THEME_LABELS = {
    forest: '숲속 무대', star: '별빛 무대', flower: '꽃밭 무대', party: '파티 무대',
    sky: '하늘 무대', bell: '딩동 무대', train: '기차 무대', ocean: '바다 무대',
    snow: '눈꽃 무대', dino: '공룡 무대', city: '도시 무대'
  };

  const THEME_PARTICLES = {
    ocean: ['🫧', '🐟', '🐠'], snow: ['❄️', '⛄'], flower: ['🌸', '🦋'], forest: ['🍃', '🍀'],
    star: ['⭐', '✨'], party: ['🎈', '🎉'], sky: ['☁️', '🕊️'], bell: ['🔔', '🎵'], train: ['☁️', '🚂'],
    dino: ['🦕', '🌴'], city: ['☁️', '🚗']
  };

  const WARM_PRAISES = [
    '시현아, 정말 잘했어! 박수 짝짝짝!',
    '와아아! 목소리 정말 예뻐! 한 번 더?',
    '시현이 목소리가 천사 목소리네!',
    '엄마 아빠도 깜짝 놀랐어! 너무 잘했어!',
    '시현이 무대 최고야! 정말 멋졌어!',
    '우와! 오늘 노래왕은 시현이야!'
  ];

  const MID_STAGE_TALKS = [
    '와! 멋진데?', '좋아, 좋아!', '더 크게 불러볼까?', '신난다!', '무대가 반짝반짝해!', '시현이 최고!'
  ];

  const INSTRUMENT_WORDS = {
    drum: ['쿵!', '둥!', '빰!'],
    tambourine: ['짠!', '찰랑!', '짝!'],
    bell: ['딩!', '동!', '반짝!']
  };

  const FINALE_EMOJIS = ['🎆', '🎇', '🎊', '🎉', '⭐', '✨', '🌈', '🎈'];

  const state = {
    container: null,
    options: {},
    screen: 'list',
    song: null,
    audio: null,
    audioCtx: null,
    lyricTimer: null,
    beatTimer: null,
    particleTimer: null,
    metadataFallbackTimer: null,
    activeLine: 0,
    isPlaying: false,
    isCompleting: false,
    lyricTimerStarted: false,
    recorder: null,
    recordedChunks: [],
    audioMimeType: '',
    stream: null,
    playbackAudio: null,
    recordedUrl: null,
    currentSource: null,
    robotOscillator: null,
    voiceMode: 'normal',
    recordTimer: null,
    cheerScore: 0,
    combo: 0,
    comboTimer: null,
    ytPlayer: null,
    ytPlayerReady: false,
    ytApiPromise: null,
    ytLyricClock: 0,
    currentVolume: 70,
    fanSignShown: false,
    destroyed: false
  };

  function makePlaybackAudio() {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.playsInline = true;
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');
    return audio;
  }

  function ensurePlaybackAudio() {
    if (!state.playbackAudio) state.playbackAudio = makePlaybackAudio();
    return state.playbackAudio;
  }

  function initAudioCtx() {
    if (!window.AudioContext && !window.webkitAudioContext) return null;
    if (!state.audioCtx) state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume().catch(() => {});
    return state.audioCtx;
  }

  function playDing(type) {
    const ctx = initAudioCtx();
    if (!ctx || state.destroyed) return;
    const now = ctx.currentTime;

    if (type === 'fanfare') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + i * 0.1);
        g.gain.setValueAtTime(0.001, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.25, now + i * 0.1 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.8);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + i * 0.1);
        o.stop(now + i * 0.1 + 0.9);
      });
      return;
    }

    if (type === 'up') {
      [659.25, 880].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + i * 0.1);
        g.gain.setValueAtTime(0.001, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.18, now + i * 0.1 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + i * 0.1);
        o.stop(now + i * 0.1 + 0.4);
      });
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'start') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.18);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc.start(now);
      osc.stop(now + 0.46);
    } else if (type === 'beat') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'drum') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'tambourine') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(4000, now);
      osc.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'bell') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'down') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }


  // ─── YouTube IFrame API 유틸리티 ──────────────────────────
  function getYouTubeApi() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (state.ytApiPromise) return state.ytApiPromise;

    state.ytApiPromise = new Promise((resolve, reject) => {
      const previousReady = window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = function () {
        if (typeof previousReady === 'function') {
          try { previousReady(); } catch (e) {}
        }
        if (window.YT && window.YT.Player) resolve(window.YT);
        else reject(new Error('YouTube API failed'));
      };

      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existing) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        tag.onerror = () => reject(new Error('YouTube API script load failed'));
        document.head.appendChild(tag);
      }

      setTimeout(() => {
        if (window.YT && window.YT.Player) resolve(window.YT);
      }, 3500);
    });

    return state.ytApiPromise;
  }

  function cleanupYouTubePlayer() {
    if (state.ytPlayer) {
      try { state.ytPlayer.stopVideo(); } catch (e) {}
      try { state.ytPlayer.destroy(); } catch (e) {}
    }
    state.ytPlayer = null;
    state.ytPlayerReady = false;
  }

  function showKaraokeToast(message) {
    if (!state.container) return;
    const old = state.container.querySelector('.kz-toast-message');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'kz-toast-message';
    toast.textContent = message;
    toast.style.cssText = [
      'position:absolute',
      'z-index:999',
      'left:50%',
      'top:50%',
      'transform:translate(-50%,-50%)',
      'max-width:min(86vw,420px)',
      'padding:20px 24px',
      'border-radius:32px',
      'background:rgba(255,255,255,.98)',
      'border:6px solid #fff',
      'box-shadow:0 12px 34px rgba(0,0,0,.24)',
      'color:#213047',
      'text-align:center',
      'font-size:clamp(22px,6vw,34px)',
      'line-height:1.15',
      'font-weight:900'
    ].join(';');
    state.container.appendChild(toast);
    setTimeout(() => {
      if (toast && toast.parentNode) toast.remove();
    }, 1800);
  }


  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .kz-root{width:100%;height:100%;min-height:0;position:relative;overflow:hidden;display:flex;flex-direction:column;color:#213047;background:linear-gradient(180deg,#8fe4ff 0%,#e7f8ff 45%,#fff1bd 100%);font-family:'Jua',sans-serif;user-select:none;touch-action:manipulation;-webkit-user-select:none;-webkit-touch-callout:none}
      .kz-root::before{content:'';position:absolute;inset:-20%;pointer-events:none;background:radial-gradient(circle at 14% 18%,rgba(255,255,255,.72) 0 6%,transparent 7%),radial-gradient(circle at 84% 14%,rgba(255,217,61,.50) 0 7%,transparent 8%),radial-gradient(circle at 16% 82%,rgba(255,122,26,.20) 0 11%,transparent 12%),radial-gradient(circle at 88% 82%,rgba(142,92,255,.18) 0 12%,transparent 13%);animation:kzFloatBg 8s ease-in-out infinite alternate}
      @keyframes kzFloatBg{from{transform:translate3d(-8px,0,0)}to{transform:translate3d(8px,-10px,0)}}
      .kz-top{position:relative;z-index:10;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:max(12px,env(safe-area-inset-top)) 14px 8px}
      .kz-home,.kz-chip{min-height:52px;border-radius:999px;background:rgba(255,255,255,.92);display:inline-flex;align-items:center;justify-content:center;padding:0 16px;font-weight:900;color:#213047;border:5px solid rgba(255,255,255,.96);box-shadow:0 7px 0 rgba(52,74,110,.18)}
      .kz-home{min-width:72px;font-size:clamp(17px,4.6vw,22px);cursor:pointer}.kz-chip{font-size:clamp(18px,5vw,27px)}.kz-home:active{transform:translateY(4px);box-shadow:0 3px 0 rgba(52,74,110,.18)}
      .kz-list-wrap{position:relative;z-index:5;flex:1;min-height:0;overflow:auto;padding:8px 14px max(18px,env(safe-area-inset-bottom))}.kz-list-wrap::-webkit-scrollbar{display:none}
      .kz-hero{margin:0 0 14px;padding:15px 16px;border-radius:30px;background:rgba(255,255,255,.88);border:5px solid rgba(255,255,255,.96);text-align:center;box-shadow:0 8px 0 rgba(52,74,110,.14)}
      .kz-hero-title{font-size:clamp(28px,8vw,46px);line-height:1.05;font-weight:900;color:#1565C0}.kz-hero-sub{margin-top:6px;font-size:clamp(15px,4.2vw,22px);color:#6b4d16;font-weight:900;word-break:keep-all}
      .kz-song-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(11px,3vw,18px)}
      .kz-song-card{position:relative;min-height:194px;border-radius:30px;background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(255,246,202,.94));border:5px solid #fff;box-shadow:0 8px 0 rgba(52,74,110,.18);display:grid;grid-template-rows:1fr auto auto;gap:8px;padding:12px 10px 14px;text-align:center;color:#213047;cursor:pointer;-webkit-tap-highlight-color:transparent}
      .kz-song-card:active{transform:translateY(4px);box-shadow:0 4px 0 rgba(52,74,110,.18)}.kz-song-icon{min-height:86px;border-radius:24px;display:grid;place-items:center;font-size:clamp(58px,18vw,92px);background:linear-gradient(160deg,#dff7ff 0%,#fff4a8 58%,#ffd0eb 100%);box-shadow:inset 0 -6px 0 rgba(0,0,0,.05)}
      .kz-song-title{font-size:clamp(20px,5.6vw,30px);line-height:1.1;font-weight:900}.kz-song-meta{font-size:clamp(12px,3.4vw,16px);line-height:1.25;color:#6a5c34;font-weight:900}
      .kz-stage{position:relative;z-index:5;flex:1;min-height:0;display:flex;flex-direction:column;padding:8px 14px max(14px,env(safe-area-inset-bottom));gap:10px}
      .kz-stage-scene{position:relative;flex:1;min-height:0;overflow:hidden;border-radius:34px;border:7px solid rgba(255,255,255,.96);box-shadow:0 10px 0 rgba(52,74,110,.18),0 20px 36px rgba(52,74,110,.14);background:linear-gradient(180deg,#39206b 0%,#6f39c7 42%,#ffb347 100%);display:grid;grid-template-rows:auto 1fr auto}
      .kz-stage-scene[data-theme='forest']{background:linear-gradient(180deg,#7bd9ff 0%,#b9f4c4 46%,#5dbb62 100%)}.kz-stage-scene[data-theme='star']{background:linear-gradient(180deg,#1d2671 0%,#5737a1 54%,#ffd36e 100%)}.kz-stage-scene[data-theme='flower']{background:linear-gradient(180deg,#aeeaff 0%,#ffd4e8 54%,#7ed957 100%)}.kz-stage-scene[data-theme='party']{background:linear-gradient(180deg,#ff85c2 0%,#ffd93d 52%,#ff9f1c 100%)}.kz-stage-scene[data-theme='sky']{background:linear-gradient(180deg,#63c7ff 0%,#d9f6ff 62%,#f7d08a 100%)}.kz-stage-scene[data-theme='bell']{background:linear-gradient(180deg,#fdf6b2 0%,#ffcf56 48%,#ff8a50 100%)}.kz-stage-scene[data-theme='train']{background:linear-gradient(180deg,#91dcff 0%,#cdf4ff 44%,#7bb661 100%)}.kz-stage-scene[data-theme='ocean']{background:linear-gradient(180deg,#4FC3F7 0%,#0288D1 44%,#01579B 100%)}.kz-stage-scene[data-theme='snow']{background:linear-gradient(180deg,#E0F7FA 0%,#B2EBF2 44%,#80DEEA 100%)}.kz-stage-scene[data-theme='dino']{background:linear-gradient(180deg,#81C784 0%,#4CAF50 44%,#388E3C 100%)}.kz-stage-scene[data-theme='city']{background:linear-gradient(180deg,#FFCC80 0%,#FFB300 44%,#FF8F00 100%)}
      .kz-mirrorball{position:absolute;top:-30px;left:50%;transform:translateX(-50%);width:80px;height:80px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#fff,#B3E5FC,#CE93D8);box-shadow:inset 0 -10px 20px rgba(0,0,0,.3),0 10px 30px rgba(255,255,255,.8);z-index:10;opacity:0;pointer-events:none;transition:opacity .5s,top .5s}.kz-stage-scene.is-playing .kz-mirrorball{opacity:1;top:10px;animation:kzSpinBall 4s linear infinite}@keyframes kzSpinBall{0%{transform:translateX(-50%) rotate(0deg)}100%{transform:translateX(-50%) rotate(360deg)}}
      .kz-lasers{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .5s;z-index:2;overflow:hidden}.kz-stage-scene.is-playing .kz-lasers{opacity:.6}.kz-laser{position:absolute;bottom:-10%;width:400px;height:10px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.8),transparent);transform-origin:left center;filter:blur(3px)}.kz-laser-1{left:10%;animation:kzLaserSwing 3s ease-in-out infinite alternate;background:linear-gradient(90deg,transparent,#FF4081,transparent)}.kz-laser-2{right:10%;transform-origin:right center;animation:kzLaserSwing2 2.5s ease-in-out infinite alternate;background:linear-gradient(90deg,transparent,#00E676,transparent)}@keyframes kzLaserSwing{0%{transform:rotate(-80deg)}100%{transform:rotate(-10deg)}}@keyframes kzLaserSwing2{0%{transform:rotate(80deg)}100%{transform:rotate(10deg)}}
      .kz-theme-particle{position:absolute;bottom:-10%;font-size:clamp(30px,8vw,55px);animation:kzThemeFloat 4s linear forwards;pointer-events:none;z-index:4;opacity:.9;filter:drop-shadow(0 5px 5px rgba(0,0,0,.2))}@keyframes kzThemeFloat{0%{transform:translateY(0) rotate(-10deg) scale(.5);opacity:0}20%{opacity:1;transform:translateY(-50px) rotate(10deg) scale(1.2)}80%{opacity:1}100%{transform:translateY(-400px) rotate(-20deg) scale(1);opacity:0}}
      .kz-glowsticks{position:absolute;bottom:-20px;left:0;width:100%;height:70px;display:flex;justify-content:space-evenly;opacity:0;transition:opacity .5s;z-index:12;pointer-events:none}.kz-stage-scene.is-playing.high-cheer .kz-glowsticks{opacity:1}.kz-stick{width:12px;height:90px;border-radius:10px;transform-origin:bottom center;box-shadow:0 0 15px currentColor}.kz-stick.c1{color:#FF4081;background:#FF4081;animation:kzSway .5s infinite alternate ease-in-out}.kz-stick.c2{color:#00E676;background:#00E676;animation:kzSway .6s infinite alternate-reverse ease-in-out}.kz-stick.c3{color:#29B6F6;background:#29B6F6;animation:kzSway .45s infinite alternate ease-in-out}.kz-stick.c4{color:#FFEA00;background:#FFEA00;animation:kzSway .55s infinite alternate-reverse ease-in-out}.kz-stick.c5{color:#E040FB;background:#E040FB;animation:kzSway .65s infinite alternate ease-in-out}@keyframes kzSway{from{transform:rotate(-25deg)}to{transform:rotate(25deg)}}
      .kz-cheer-bar{position:absolute;left:10px;top:15%;width:15px;height:60%;background:rgba(0,0,0,.3);border-radius:10px;border:3px solid #fff;z-index:8;overflow:hidden;display:flex;align-items:flex-end}.kz-cheer-fill{width:100%;height:0%;background:linear-gradient(0deg,#FFC107,#FF5252);transition:height .3s ease-out}
      .kz-stage-title{position:relative;z-index:15;display:flex;align-items:center;justify-content:center;gap:8px;min-height:58px;padding:8px 12px;color:#fff;text-align:center;font-size:clamp(22px,6.3vw,34px);font-weight:900;text-shadow:0 3px 0 rgba(0,0,0,.3)}.kz-performer{position:relative;z-index:5;display:grid;place-items:center;align-self:center;font-size:clamp(94px,28vw,188px);filter:drop-shadow(0 16px 0 rgba(0,0,0,.2));animation:kzPerformer 1.5s ease-in-out infinite alternate}.kz-stage-scene.is-playing .kz-performer{animation:kzPerformerDance .8s ease-in-out infinite alternate}@keyframes kzPerformer{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-9px) rotate(2deg)}}@keyframes kzPerformerDance{0%{transform:translateY(0) scale(1) rotate(-5deg)}100%{transform:translateY(-20px) scale(1.1) rotate(5deg)}}
      .kz-lyrics-panel{position:relative;z-index:15;margin:0 12px 12px;padding:12px;border-radius:28px;background:rgba(255,255,255,.95);border:5px solid rgba(255,255,255,.96);box-shadow:0 7px 0 rgba(0,0,0,.15);text-align:center}.kz-current-line{position:relative;min-height:60px;display:flex;align-items:center;justify-content:center;padding:4px 6px;border-radius:20px;background:linear-gradient(180deg,#fff9a8,#fff);font-size:clamp(24px,7.5vw,42px);line-height:1.1;font-weight:900;word-break:keep-all}.kz-lyric-text-wrapper{position:relative;display:inline-block;padding:0 5px}.kz-lyric-base{color:#25184d}.kz-lyric-fill{position:absolute;left:0;top:0;width:0%;height:100%;overflow:hidden;white-space:nowrap;color:#ff4e88;padding:inherit;box-sizing:border-box}.kz-lyric-pointer{position:absolute;top:-35px;left:0%;transform:translateX(-50%);font-size:clamp(30px,8vw,45px);z-index:2;transition:left linear;animation:kzPointerJump .35s infinite alternate cubic-bezier(.1,.8,.3,1);opacity:0;filter:drop-shadow(0 5px 2px rgba(0,0,0,.2))}.kz-stage-scene.is-playing .kz-lyric-pointer{opacity:1}@keyframes kzPointerJump{from{margin-top:0}to{margin-top:-15px}}
      .kz-next-line{margin-top:8px;min-height:25px;color:#745d22;font-size:clamp(15px,4.2vw,22px);font-weight:900}.kz-progress{height:12px;margin:10px 2px 0;border-radius:999px;overflow:hidden;background:rgba(0,0,0,.10)}.kz-progress>span{display:block;width:0%;height:100%;border-radius:inherit;background:linear-gradient(90deg,#ff7a1a,#ffd93d);transition:width .22s linear}
      .kz-instruments{display:flex;justify-content:center;gap:20px;margin-bottom:5px}.kz-inst-btn{width:clamp(65px,16vw,90px);height:clamp(65px,16vw,90px);border-radius:50%;border:5px solid #fff;background:#FFCC80;font-size:clamp(35px,9vw,50px);display:grid;place-items:center;box-shadow:0 6px 0 #EF6C00;cursor:pointer;transition:transform .1s;-webkit-tap-highlight-color:transparent;touch-action:manipulation}.kz-inst-btn:active{transform:translateY(6px);box-shadow:0 0 0 transparent}.kz-inst-btn:nth-child(2){background:#81C784;box-shadow:0 6px 0 #2E7D32}.kz-inst-btn:nth-child(3){background:#64B5F6;box-shadow:0 6px 0 #1565C0}
      .kz-note-particle{position:absolute;font-size:clamp(30px,8vw,45px);pointer-events:none;z-index:100;animation:kzFlyNote .8s ease-out forwards}@keyframes kzFlyNote{0%{opacity:1;transform:translate(0,0) scale(1) rotate(0deg)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.5) rotate(45deg)}}
      .kz-actions-wrap{display:flex;flex-direction:column;gap:8px;flex-shrink:0}.kz-voice-toggle{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:-5px}.kz-voice-btn{width:45px;height:45px;border-radius:50%;font-size:24px;border:3px solid #ccc;background:#fff;box-shadow:0 3px 0 #ccc;display:grid;place-items:center;cursor:pointer;opacity:.5;transition:all .2s;-webkit-tap-highlight-color:transparent}.kz-voice-btn.active{opacity:1;border-color:#FF5252;background:#FFEBEE;box-shadow:0 3px 0 #D32F2F;transform:scale(1.15);z-index:2}.kz-pop-anim{animation:btnPop .3s ease-out}@keyframes btnPop{0%{transform:scale(1.15)}50%{transform:scale(1.35) rotate(-5deg)}100%{transform:scale(1.15)}}
      .kz-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.kz-stage-btn{min-height:65px;border-radius:22px;background:rgba(255,255,255,.95);color:#213047;font-size:clamp(14px,4.2vw,22px);font-weight:900;line-height:1.1;cursor:pointer;border:5px solid #fff;box-shadow:0 6px 0 rgba(0,0,0,.15);-webkit-tap-highlight-color:transparent}.kz-stage-btn:active{transform:translateY(5px);box-shadow:0 1px 0 rgba(0,0,0,.15)}.kz-stage-btn.primary{background:linear-gradient(180deg,#ffef75,#ff9f1c);box-shadow:0 6px 0 #E65100}.kz-stage-btn.recording{background:linear-gradient(180deg,#ff7a7a,#ff3333);color:#fff;box-shadow:0 6px 0 #B71C1C;animation:kzRecordPulse .48s ease-in-out infinite alternate}@keyframes kzRecordPulse{from{transform:scale(1)}to{transform:scale(1.035)}}
      .kz-complete{position:absolute;inset:0;z-index:50;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.6);backdrop-filter:blur(5px);animation:fadeIn .4s ease}@keyframes fadeIn{from{opacity:0}to{opacity:1}}.kz-complete-box{width:min(92vw,540px);border-radius:40px;border:8px solid #FFD700;background:linear-gradient(180deg,#fff,#fff0a6);box-shadow:0 15px 30px rgba(0,0,0,.4);padding:30px 18px;text-align:center;display:grid;gap:15px;position:relative}.kz-complete-icon{font-size:clamp(90px,26vw,150px);filter:drop-shadow(0 10px 10px rgba(0,0,0,.3));animation:kzTrophyPop 1s cubic-bezier(.175,.885,.32,1.275) forwards}@keyframes kzTrophyPop{0%{transform:scale(0) rotate(-20deg)}100%{transform:scale(1) rotate(0)}}.kz-complete-title{font-size:clamp(32px,9vw,50px);font-weight:900;color:#1565C0}.kz-complete-sub{font-size:clamp(18px,5vw,26px);color:#E65100;font-weight:900}.kz-hidden{display:none!important}

      /* v4.2 — YouTube 원곡 영상 무대 */
      .kz-youtube-stage{
        position:relative;
        z-index:14;
        width:min(92%,720px);
        min-height:clamp(190px,38vw,340px);
        margin:0 auto 10px;
        border-radius:30px;
        border:6px solid rgba(255,255,255,.96);
        background:rgba(0,0,0,.34);
        box-shadow:0 8px 0 rgba(0,0,0,.18);
        overflow:hidden;
        display:grid;
        place-items:center;
      }
      .kz-youtube-player{
        width:100%;
        height:100%;
        min-height:clamp(190px,38vw,340px);
        background:#111;
      }
      .kz-youtube-ready{
        width:100%;
        min-height:clamp(190px,38vw,340px);
        display:grid;
        place-items:center;
        padding:16px;
        color:#fff;
        text-align:center;
        text-shadow:0 3px 0 rgba(0,0,0,.25);
        font-weight:900;
      }
      .kz-youtube-ready-icon{
        font-size:clamp(70px,20vw,130px);
        filter:drop-shadow(0 10px 0 rgba(0,0,0,.20));
        animation:kzPerformerDance .9s ease-in-out infinite alternate;
      }
      .kz-youtube-ready-text{
        margin-top:10px;
        font-size:clamp(22px,6vw,36px);
        line-height:1.15;
      }

      @media(max-width:430px){.kz-song-card{min-height:176px;border-width:4px;border-radius:25px}.kz-song-icon{min-height:74px;border-radius:20px}.kz-actions{grid-template-columns:repeat(2,minmax(0,1fr))}.kz-stage-btn{min-height:56px}}
      /* v3.3 — 4살용 5성 업그레이드: 큰 버튼, 따뜻한 말풍선, 폭죽, 자유 악기놀이 */
      .kz-free-play-card{width:100%;min-height:96px;margin:0 0 14px;border-radius:30px;border:6px solid #fff;background:linear-gradient(135deg,#fff176 0%,#ffb74d 45%,#ff80ab 100%);box-shadow:0 9px 0 rgba(52,74,110,.18);display:flex;align-items:center;justify-content:center;gap:14px;color:#213047;font:inherit;font-weight:900;font-size:clamp(24px,7vw,40px);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}.kz-free-play-card:active{transform:translateY(6px) scale(.985);box-shadow:0 3px 0 rgba(52,74,110,.18)}.kz-free-play-sub{display:block;font-size:clamp(13px,3.6vw,18px);color:#6b3d00;margin-top:3px}.kz-stage-bubble{position:absolute;left:50%;top:72px;z-index:18;max-width:min(78%,460px);transform:translateX(-50%) scale(.92);padding:10px 18px;border-radius:24px 24px 24px 6px;background:rgba(255,255,255,.96);border:5px solid #fff;color:#213047;box-shadow:0 7px 0 rgba(0,0,0,.14);font-size:clamp(18px,5vw,28px);font-weight:900;text-align:center;opacity:.95;pointer-events:none;animation:kzBubblePop .55s cubic-bezier(.2,1.4,.35,1) both}@keyframes kzBubblePop{0%{opacity:0;transform:translateX(-50%) translateY(10px) scale(.72)}100%{opacity:.95;transform:translateX(-50%) translateY(0) scale(1)}}.kz-stage-scene.is-recording .kz-performer{animation:kzPerformerDance .42s ease-in-out infinite alternate;filter:drop-shadow(0 0 24px #ffeb3b) drop-shadow(0 16px 0 rgba(0,0,0,.2))}.kz-stage-scene.is-complete{animation:kzStageRainbow 1.2s ease-in-out infinite alternate}@keyframes kzStageRainbow{0%{filter:saturate(1.05) brightness(1)}100%{filter:saturate(1.45) brightness(1.12)}}.kz-inst-btn{width:clamp(96px,22vw,130px)!important;height:clamp(96px,22vw,130px)!important;font-size:clamp(48px,12vw,72px)!important;border-width:7px!important}.kz-instruments{gap:clamp(14px,4vw,28px)!important}.kz-stage-btn{min-height:clamp(74px,15vw,96px)!important;border-radius:28px!important;font-size:clamp(19px,5.2vw,28px)!important}.kz-actions{gap:10px!important}.kz-impact-word{position:absolute;z-index:130;pointer-events:none;font-size:clamp(32px,10vw,62px);font-weight:900;color:#fff;text-shadow:0 4px 0 rgba(0,0,0,.25),0 0 16px rgba(255,255,255,.7);animation:kzImpactWord .78s cubic-bezier(.2,1.35,.32,1) forwards}@keyframes kzImpactWord{0%{opacity:0;transform:translate(-50%,-50%) scale(.4) rotate(-10deg)}35%{opacity:1;transform:translate(-50%,-70%) scale(1.25) rotate(5deg)}100%{opacity:0;transform:translate(-50%,-140%) scale(1) rotate(0)}}.kz-burst-dot{position:absolute;z-index:125;pointer-events:none;font-size:clamp(20px,6vw,38px);animation:kzBurstDot .85s ease-out forwards}@keyframes kzBurstDot{0%{opacity:1;transform:translate(-50%,-50%) scale(.2)}100%{opacity:0;transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) scale(1.3) rotate(180deg)}}.kz-stage-shake{animation:kzStageShake .28s ease-out}@keyframes kzStageShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}50%{transform:translateX(4px)}75%{transform:translateX(-2px)}}.kz-finale-item{position:absolute;z-index:70;pointer-events:none;font-size:clamp(28px,9vw,64px);filter:drop-shadow(0 6px 0 rgba(0,0,0,.18));animation:kzFinaleFall var(--dur,2.8s) linear forwards}@keyframes kzFinaleFall{0%{opacity:0;transform:translateY(-18vh) rotate(0deg) scale(.7)}12%{opacity:1}100%{opacity:0;transform:translateY(112vh) rotate(720deg) scale(1.1)}}.kz-rainbow-ring{position:absolute;inset:10%;z-index:60;border-radius:50%;pointer-events:none;background:conic-gradient(from 0deg,#ff1744,#ff9100,#ffea00,#00e676,#00b0ff,#7c4dff,#ff1744);opacity:.0;filter:blur(10px);animation:kzRainbowRing 1.45s ease-out forwards}@keyframes kzRainbowRing{0%{opacity:0;transform:scale(.2) rotate(0deg)}35%{opacity:.55;transform:scale(1) rotate(90deg)}100%{opacity:0;transform:scale(1.45) rotate(180deg)}}.kz-complete-box{border-width:9px!important;background:radial-gradient(circle at 50% 0%,#fff 0%,#fff7bf 46%,#ffd1e6 100%)!important;overflow:hidden}.kz-complete-box::before{content:'🎊 🎆 🎈 ⭐ 🎉';position:absolute;left:0;right:0;top:8px;text-align:center;font-size:clamp(24px,7vw,42px);letter-spacing:6px;animation:kzHeaderSpark .8s ease-in-out infinite alternate}@keyframes kzHeaderSpark{from{transform:translateY(0) scale(1)}to{transform:translateY(-4px) scale(1.05)}}.kz-complete-title{font-size:clamp(36px,10vw,58px)!important}.kz-complete-sub{font-size:clamp(22px,6vw,32px)!important;line-height:1.25}.kz-free-stage{position:relative;z-index:5;flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:18px;padding:16px}.kz-free-title{font-size:clamp(34px,10vw,58px);font-weight:900;color:#fff;text-shadow:0 5px 0 rgba(0,0,0,.2);text-align:center}.kz-free-instruments{display:flex;gap:clamp(14px,4vw,28px);justify-content:center;flex-wrap:wrap}.kz-free-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;width:min(92vw,520px)}


      /* v4.7.1 — 점수판/콤보/자막 댄싱 */
      .kz-score-board{
        position:absolute;
        top:18%;
        left:50%;
        transform:translateX(-50%);
        z-index:100;
        display:none;
        min-width:clamp(130px,34vw,210px);
        padding:10px 24px;
        border-radius:18px;
        border:5px solid #FFD700;
        background:rgba(0,0,0,.82);
        color:#00FF66;
        font-family:'Courier New',monospace;
        font-size:clamp(38px,11vw,62px);
        font-weight:900;
        text-align:center;
        text-shadow:0 0 12px #00FF66;
        box-shadow:0 0 22px rgba(255,215,0,.76),0 10px 0 rgba(0,0,0,.18);
        pointer-events:none;
      }
      .kz-combo-text{
        position:absolute;
        right:18px;
        top:35%;
        z-index:110;
        pointer-events:none;
        color:#ffeb3b;
        font-size:clamp(30px,8vw,46px);
        font-weight:900;
        text-shadow:2px 2px 0 #e65100,-2px -2px 0 #e65100,2px -2px 0 #e65100,-2px 2px 0 #e65100,0 0 18px rgba(255,255,255,.8);
        animation:kzComboPop .62s cubic-bezier(.17,.89,.32,1.49) forwards;
      }
      @keyframes kzComboPop{
        0%{opacity:0;transform:scale(0) rotate(-20deg)}
        48%{opacity:1;transform:scale(1.32) rotate(10deg)}
        100%{opacity:0;transform:scale(1.08) rotate(0deg)}
      }
      .kz-current-line.dancing{
        animation:kzLineDance .42s ease-in-out infinite alternate;
      }
      @keyframes kzLineDance{
        from{transform:translateY(0);box-shadow:0 0 0 transparent}
        to{transform:translateY(-5px);box-shadow:0 6px 0 rgba(0,0,0,.06)}
      }

      /* v4.5 — 안정화/몰입감 강화 */
      .kz-youtube-loading .kz-youtube-ready-icon{
        animation:kzLoadingDance .55s ease-in-out infinite alternate;
      }
      @keyframes kzLoadingDance{
        from{transform:translateY(0) rotate(-6deg) scale(1)}
        to{transform:translateY(-14px) rotate(6deg) scale(1.08)}
      }
      .kz-volume-row{
        display:grid;
        grid-template-columns:1fr auto 1fr;
        align-items:center;
        gap:8px;
        width:100%;
      }
      .kz-volume-btn,.kz-volume-label{
        min-height:54px;
        border-radius:999px;
        border:5px solid #fff;
        background:rgba(255,255,255,.95);
        color:#213047;
        font-size:clamp(15px,4vw,22px);
        font-weight:900;
        box-shadow:0 5px 0 rgba(0,0,0,.14);
        display:flex;
        align-items:center;
        justify-content:center;
      }
      .kz-volume-btn{
        cursor:pointer;
        -webkit-tap-highlight-color:transparent;
      }
      .kz-volume-btn:active{
        transform:translateY(4px);
        box-shadow:0 1px 0 rgba(0,0,0,.14);
      }
      .kz-volume-label{
        min-width:72px;
        padding:0 12px;
        background:linear-gradient(180deg,#fff9a8,#fff);
      }
      .kz-stage-flash::after{
        content:'';
        position:absolute;
        inset:0;
        z-index:9;
        pointer-events:none;
        background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.72),rgba(255,235,59,.30) 36%,transparent 70%);
        animation:kzStageFlash .35s ease-out forwards;
      }
      @keyframes kzStageFlash{
        from{opacity:0;transform:scale(.9)}
        35%{opacity:1;transform:scale(1)}
        to{opacity:0;transform:scale(1.12)}
      }
      .kz-fan-sign{
        position:absolute;
        z-index:40;
        bottom:78px;
        left:50%;
        transform:translateX(-50%);
        padding:12px 20px;
        border-radius:24px;
        border:6px solid #fff;
        background:linear-gradient(135deg,#fff176,#ff80ab);
        color:#213047;
        box-shadow:0 9px 0 rgba(0,0,0,.18),0 0 24px rgba(255,255,255,.72);
        font-size:clamp(22px,6vw,38px);
        font-weight:900;
        white-space:nowrap;
        pointer-events:none;
        animation:kzFanSignPop 1.8s cubic-bezier(.2,1.35,.32,1) forwards;
      }
      @keyframes kzFanSignPop{
        0%{opacity:0;transform:translateX(-50%) translateY(30px) scale(.55) rotate(-8deg)}
        25%{opacity:1;transform:translateX(-50%) translateY(0) scale(1.06) rotate(3deg)}
        70%{opacity:1;transform:translateX(-50%) translateY(-8px) scale(1) rotate(-2deg)}
        100%{opacity:0;transform:translateX(-50%) translateY(-26px) scale(.92) rotate(0)}
      }
      @media(max-width:430px){
        .kz-volume-row{gap:6px}
        .kz-volume-btn,.kz-volume-label{min-height:48px;border-width:4px}
        .kz-volume-label{min-width:60px}
      }

      @media(max-width:430px){.kz-actions{grid-template-columns:repeat(2,minmax(0,1fr))}.kz-stage-btn{min-height:72px!important}.kz-inst-btn{width:96px!important;height:96px!important}.kz-stage-bubble{top:64px}.kz-current-line{font-size:clamp(27px,8vw,42px)}}

    `;
    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function speak(text, force) {
    if (!text || state.destroyed) return;
    const voiceIds = {
      '시현아, 라이브 콘서트장에 온 걸 환영해! 부르고 싶은 노래를 골라봐.': 'zone.karaoke.intro',
      '라이브 콘서트 시작할까?': 'zone.karaoke.songStart',
      '헬륨가스!': 'zone.karaoke.helium',
      '로봇!': 'zone.karaoke.robot',
      '내 목소리!': 'zone.karaoke.myVoice',
      '악기 놀이야! 북이랑 딸랑이랑 종을 마음껏 눌러봐.': 'zone.karaoke.instrumentIntro',
      '반주 파일을 못 찾았어요. 박자 소리로 부를게요.': 'zone.karaoke.noBacking',
      '반주를 바로 못 틀었어요. 박자 소리로 부를게요.': 'zone.karaoke.backingFail',
      '이 기기에서는 마이크를 사용할 수 없어요.': 'zone.karaoke.noMicDevice',
      '시현이 목소리 녹음 중! 노래해봐!': 'zone.karaoke.recording',
      '마이크를 사용할 수 없어요. 다시 눌러서 시도할 수 있어요.': 'zone.karaoke.micFail',
      '내가 부른 노래 들어볼까?': 'zone.karaoke.listen',
      '재생을 다시 눌러줘.': 'zone.karaoke.replay',
      '시현아, 정말 잘했어! 박수 짝짝짝!': 'zone.karaoke.praise1',
      '와아아! 목소리 정말 예뻐! 한 번 더?': 'zone.karaoke.praise2',
      '시현이 목소리가 천사 목소리네!': 'zone.karaoke.praise3',
      '엄마 아빠도 깜짝 놀랐어! 너무 잘했어!': 'zone.karaoke.praise4',
      '시현이 무대 최고야! 정말 멋졌어!': 'zone.karaoke.praise5',
      '우와! 오늘 노래왕은 시현이야!': 'zone.karaoke.praise6'
    };
    const voiceId = voiceIds[text];
    if (voiceId && window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      window.SihyeonVoice.play(voiceId, text).catch(() => {});
      return;
    }
    if (state.options && typeof state.options.speakGuide === 'function') {
      state.options.speakGuide(text, !!force);
      return;
    }
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.86; utterance.pitch = 1.12;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  }

  function vibrate(pattern) {
    if (!navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (e) {}
  }

  function clearTimer(refName) {
    if (state[refName]) {
      clearInterval(state[refName]);
      clearTimeout(state[refName]);
      state[refName] = null;
    }
  }

  function stopLyricAndEffectTimers() {
    clearTimer('lyricTimer');
    clearTimer('beatTimer');
    clearTimer('particleTimer');
    clearTimer('metadataFallbackTimer');
    state.lyricTimerStarted = false;
  }

  function cleanupPlaybackAudio() {
    if (state.currentSource) {
      try { state.currentSource.stop(0); } catch (e) {}
      try { state.currentSource.disconnect(); } catch (e) {}
      state.currentSource = null;
    }
    if (state.robotOscillator) {
      try { state.robotOscillator.stop(0); } catch (e) {}
      try { state.robotOscillator.disconnect(); } catch (e) {}
      state.robotOscillator = null;
    }
    if (state.playbackAudio) {
      try { state.playbackAudio.pause(); } catch (e) {}
      try { state.playbackAudio.removeAttribute('src'); state.playbackAudio.load(); } catch (e) {}
    }
    if (state.recordedUrl) {
      try { URL.revokeObjectURL(state.recordedUrl); } catch (e) {}
      state.recordedUrl = null;
    }
  }

  function cleanupAudio() {
    if (state.audio) {
      try { state.audio.pause(); } catch (e) {}
      try { state.audio.removeAttribute('src'); state.audio.load(); } catch (e) {}
      state.audio = null;
    }
    stopLyricAndEffectTimers();
    cleanupYouTubePlayer();
    cleanupPlaybackAudio();
    state.isPlaying = false;
  }

  function cleanupRecording() {
    clearTimer('recordTimer');
    if (state.recorder && state.recorder.state !== 'inactive') {
      try { state.recorder.stop(); } catch (e) {}
    }
    state.recorder = null;
    state.recordedChunks = [];
    state.audioMimeType = '';
    if (state.stream) {
      try { state.stream.getTracks().forEach((track) => track.stop()); } catch (e) {}
      state.stream = null;
    }
  }

  function goHome() {
    cleanupAudio();
    cleanupRecording();
    if (typeof state.options.closeToParkHome === 'function') { state.options.closeToParkHome(); return; }
    if (typeof window.renderWorldMapHome === 'function') window.renderWorldMapHome();
  }

  function render(container, options = {}) {
    destroy();
    injectStyle();
    state.container = container;
    state.options = options || {};
    state.screen = 'list';
    state.song = null;
    state.activeLine = 0;
    state.ytLyricClock = 0;
    state.fanSignShown = false;
    state.currentVolume = Math.max(10, Math.min(100, Number(state.song.volume || state.currentVolume || 70)));
    state.cheerScore = 0;
    state.combo = 0;
    clearTimer('comboTimer');
    state.voiceMode = 'normal';
    state.destroyed = false;
    ensurePlaybackAudio();
    renderList();
    speak('시현아, 라이브 콘서트장에 온 걸 환영해! 부르고 싶은 노래를 골라봐.', true);
  }

  function renderList() {
    if (!state.container || state.destroyed) return;
    cleanupAudio();
    cleanupRecording();
    state.screen = 'list';
    state.container.innerHTML = `
      <section class="kz-root">
        <div class="kz-top">
          <button type="button" class="kz-home" data-action="home">🏠 놀이터</button>
          <div class="kz-chip">🎤 시현이 노래방</div>
        </div>
        <div class="kz-list-wrap">
          <div class="kz-hero">
            <div class="kz-hero-title">오늘은 내가 최고 가수!</div>
            <div class="kz-hero-sub">악기를 치면서 신나게 노래를 불러봐요.</div>
          </div>
          <button type="button" class="kz-free-play-card" data-action="free-instrument">
            <span>🥁</span>
            <span>악기 놀이<span class="kz-free-play-sub">노래 없이 마음껏 쿵짝쿵짝!</span></span>
          </button>
          <div class="kz-song-grid">
            ${SONGS.map((song) => `
              <button type="button" class="kz-song-card" data-song-id="${escapeHtml(song.id)}">
                <span class="kz-song-icon">${escapeHtml(song.emoji)}</span>
                <span class="kz-song-title">${escapeHtml(song.title)}</span>
                <span class="kz-song-meta">${escapeHtml(song.desc || THEME_LABELS[song.theme] || '무대')} · ${song.youtubeId ? '원곡 영상' : '영상 준비중'}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </section>
    `;
    bindListEvents();
  }

  function bindListEvents() {
    const root = state.container;
    if (!root) return;
    root.querySelector('[data-action="home"]')?.addEventListener('click', goHome);
    root.querySelector('[data-action="free-instrument"]')?.addEventListener('click', openFreeInstrumentMode);
    root.querySelectorAll('[data-song-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const song = SONGS.find((item) => item.id === button.dataset.songId);
        if (!song) return;
        if (!song.youtubeId) {
          showKaraokeToast('아직 영상이 준비중이에요!');
          speak(`${song.title} 영상은 아직 준비중이에요.`, true);
          vibrate([40, 40]);
          return;
        }
        openSong(song);
      });
    });
  }

  function openSong(song) {
    cleanupAudio();
    cleanupRecording();
    state.song = song;
    state.screen = 'stage';
    state.activeLine = 0;
    state.cheerScore = 0;
    state.combo = 0;
    clearTimer('comboTimer');
    state.fanSignShown = false;
    state.currentVolume = Math.max(10, Math.min(100, Number(song.volume || 70)));
    state.isCompleting = false;
    drawStage();
    updateVolumeUI();
    speak(`${song.title}! 라이브 콘서트 시작할까?`, true);
    playDing('start');
  }

  function drawStage() {
    if (!state.container || state.destroyed || !state.song) return;
    const song = state.song;
    const current = song.lines[state.activeLine] || '시작해볼까요?';
    const next = song.lines[state.activeLine + 1] || '마지막까지 신나게!';

    state.container.innerHTML = `
      <section class="kz-root">
        <div class="kz-top">
          <button type="button" class="kz-home" data-action="back-list">🎵 목록</button>
          <div class="kz-chip">${escapeHtml(song.emoji)} ${escapeHtml(song.title)}</div>
        </div>
        <div class="kz-stage">
          <div class="kz-stage-scene" id="kzScene" data-theme="${escapeHtml(song.theme)}">
            <div class="kz-mirrorball"></div>
            <div class="kz-lasers"><div class="kz-laser kz-laser-1"></div><div class="kz-laser kz-laser-2"></div></div>
            <div class="kz-glowsticks" id="kzGlowsticks"><div class="kz-stick c1"></div><div class="kz-stick c2"></div><div class="kz-stick c3"></div><div class="kz-stick c4"></div><div class="kz-stick c5"></div></div>
            <div class="kz-cheer-bar"><div class="kz-cheer-fill" id="kzCheerFill"></div></div>
            <div class="kz-score-board" id="kzScoreBoard">000</div>
            <div class="kz-stage-title">${escapeHtml(THEME_LABELS[song.theme] || '시현이 무대')}</div>
            <div class="kz-performer" aria-hidden="true">${escapeHtml(song.emoji)}</div>
            <div class="kz-stage-bubble" id="kzStageBubble">시작해볼까?</div>
            <div class="kz-youtube-stage">
              <div class="kz-youtube-ready" id="kzYoutubeReady">
                <div>
                  <div class="kz-youtube-ready-icon">${escapeHtml(song.emoji)}</div>
                  <div class="kz-youtube-ready-text">시작 버튼을 누르면<br>원곡 영상이 나와요!</div>
                </div>
              </div>
              <div class="kz-youtube-player" id="kzYoutubePlayer" style="display:none;"></div>
            </div>
            <div class="kz-lyrics-panel">
              <div class="kz-current-line" id="kzCurrentLine">
                <div class="kz-lyric-text-wrapper">
                  <span class="kz-lyric-pointer" id="kzLyricPointer">${escapeHtml(song.emoji)}</span>
                  <div class="kz-lyric-base" id="kzLyricBase">${escapeHtml(current)}</div>
                  <div class="kz-lyric-fill" id="kzLyricFill">${escapeHtml(current)}</div>
                </div>
              </div>
              <div class="kz-next-line" id="kzNextLine">다음: ${escapeHtml(next)}</div>
              <div class="kz-progress"><span id="kzProgressBar"></span></div>
            </div>
            <div class="kz-complete kz-hidden" id="kzComplete">
              <div class="kz-complete-box">
                <div class="kz-complete-icon">🏆</div>
                <div class="kz-complete-title" id="kzCompleteTitle">시현이 최고 가수상!</div>
                <div class="kz-complete-sub" id="kzCompleteSub">우와아아! 관객들이 박수를 쳐요!</div>
                <button type="button" class="kz-stage-btn primary" data-action="replay-finish" style="margin-top:10px;">한 번 더 부르기 앵콜!</button>
              </div>
            </div>
          </div>
          <div class="kz-actions-wrap">
            <div class="kz-instruments">
              <button type="button" class="kz-inst-btn" data-inst="drum">🥁</button>
              <button type="button" class="kz-inst-btn" data-inst="tambourine">🪇</button>
              <button type="button" class="kz-inst-btn" data-inst="bell">🔔</button>
            </div>
            <div class="kz-voice-toggle">
              <button type="button" class="kz-voice-btn active" data-voice="normal">🧒</button>
              <button type="button" class="kz-voice-btn" data-voice="helium">🎈</button>
              <button type="button" class="kz-voice-btn" data-voice="robot">🤖</button>
            </div>
            <div class="kz-volume-row">
              <button type="button" class="kz-volume-btn" data-action="vol-down">🔉 작게</button>
              <div class="kz-volume-label" id="kzVolumeLabel">70</div>
              <button type="button" class="kz-volume-btn" data-action="vol-up">🔊 크게</button>
            </div>
            <div class="kz-actions">
              <button type="button" class="kz-stage-btn primary" data-action="play">▶ 시작</button>
              <button type="button" class="kz-stage-btn" data-action="restart">🔁 다시</button>
              <button type="button" class="kz-stage-btn" data-action="record">🎙️ 녹음</button>
              <button type="button" class="kz-stage-btn" data-action="back-list">🎵 다른 곡</button>
            </div>
          </div>
        </div>
      </section>
    `;
    bindStageEvents();
  }

  function bindStageEvents() {
    const root = state.container;
    if (!root) return;
    root.querySelectorAll('[data-action="back-list"]').forEach((b) => b.addEventListener('click', renderList));
    root.querySelector('[data-action="play"]')?.addEventListener('click', togglePlay);
    root.querySelector('[data-action="restart"]')?.addEventListener('click', () => { if (state.song) { openSong(state.song); setTimeout(startSong, 150); } });
    root.querySelector('[data-action="replay-finish"]')?.addEventListener('click', () => { if (state.song) { openSong(state.song); setTimeout(startSong, 150); } });
    root.querySelector('[data-action="vol-down"]')?.addEventListener('click', () => adjustVolume(-10));
    root.querySelector('[data-action="vol-up"]')?.addEventListener('click', () => adjustVolume(10));

    root.querySelectorAll('.kz-inst-btn').forEach((btn) => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        playDing(btn.dataset.inst);
        vibrate([25, 20, 45]);
        addCheerScore(8);
        addCombo();
        flashStage();
        addCombo();
        spawnNoteParticle(btn, btn.textContent);
        spawnInstrumentImpact(btn, btn.dataset.inst);
        showStageBubble(pick(MID_STAGE_TALKS));
      });
    });

    root.querySelectorAll('.kz-voice-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.voiceMode = btn.dataset.voice;
        root.querySelectorAll('.kz-voice-btn').forEach((b) => b.classList.remove('active', 'kz-pop-anim'));
        btn.classList.add('active');
        void btn.offsetWidth;
        btn.classList.add('kz-pop-anim');
        playDing('bell');
        const msg = state.voiceMode === 'helium' ? '헬륨가스!' : state.voiceMode === 'robot' ? '로봇!' : '내 목소리!';
        speak(msg, true);
      });
    });

    const recordButton = root.querySelector('[data-action="record"]');
    if (recordButton) {
      recordButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (state.recorder && state.recorder.state === 'recording') stopRecording(recordButton);
        else startRecording(recordButton);
      });
    }
  }



  function updateVolumeUI() {
    const label = state.container?.querySelector('#kzVolumeLabel');
    if (label) label.textContent = String(state.currentVolume);
  }

  function adjustVolume(delta) {
    state.currentVolume = Math.max(10, Math.min(100, (state.currentVolume || 70) + delta));
    updateVolumeUI();

    if (state.ytPlayer && typeof state.ytPlayer.setVolume === 'function') {
      try { state.ytPlayer.setVolume(state.currentVolume); } catch (e) {}
    }

    playDing(delta > 0 ? 'bell' : 'down');
    vibrate(25);
    showStageBubble(delta > 0 ? '소리 크게!' : '소리 작게!');
  }

  function flashStage() {
    const scene = state.container?.querySelector('#kzScene');
    if (!scene) return;
    scene.classList.remove('kz-stage-flash');
    void scene.offsetWidth;
    scene.classList.add('kz-stage-flash');
  }

  function spawnFanSign(text) {
    if (!state.container || state.destroyed) return;
    const scene = state.container.querySelector('#kzScene');
    if (!scene) return;

    const sign = document.createElement('div');
    sign.className = 'kz-fan-sign';
    sign.textContent = text || pick(['시현아 최고!', '앙코르!', '사랑해 시현아!']);
    scene.appendChild(sign);

    setTimeout(() => {
      if (sign.parentNode) sign.remove();
    }, 1900);
  }


  function pick(list) {
    if (!Array.isArray(list) || !list.length) return '';
    return list[Math.floor(Math.random() * list.length)];
  }

  function showStageBubble(text) {
    if (!text || !state.container || state.destroyed) return;
    const bubble = state.container.querySelector('#kzStageBubble');
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.remove('kz-stage-bubble');
    void bubble.offsetWidth;
    bubble.classList.add('kz-stage-bubble');
  }

  function spawnInstrumentImpact(btn, inst) {
    if (!state.container || state.destroyed || !btn) return;
    const rect = btn.getBoundingClientRect();
    const cRect = state.container.getBoundingClientRect();
    const x = rect.left - cRect.left + rect.width / 2;
    const y = rect.top - cRect.top + rect.height / 2;
    const word = pick(INSTRUMENT_WORDS[inst] || ['짠!']);
    const w = document.createElement('div');
    w.className = 'kz-impact-word';
    w.textContent = word;
    w.style.left = `${x}px`;
    w.style.top = `${y}px`;
    state.container.appendChild(w);
    setTimeout(() => { if (w.parentNode) w.remove(); }, 820);

    const burst = ['✨', '⭐', '🎵', '🎶', '💫'];
    for (let i = 0; i < 12; i += 1) {
      const dot = document.createElement('div');
      dot.className = 'kz-burst-dot';
      dot.textContent = pick(burst);
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      const angle = (Math.PI * 2 * i) / 12;
      const dist = 42 + Math.random() * 52;
      dot.style.setProperty('--x', `${Math.cos(angle) * dist}px`);
      dot.style.setProperty('--y', `${Math.sin(angle) * dist}px`);
      state.container.appendChild(dot);
      setTimeout(() => { if (dot.parentNode) dot.remove(); }, 900);
    }
    const scene = state.container.querySelector('#kzScene');
    if (scene) {
      scene.classList.remove('kz-stage-shake');
      void scene.offsetWidth;
      scene.classList.add('kz-stage-shake');
    }
  }

  function spawnFinaleEffects() {
    if (!state.container || state.destroyed) return;
    const stage = state.container.querySelector('#kzScene') || state.container;
    const ring = document.createElement('div');
    ring.className = 'kz-rainbow-ring';
    stage.appendChild(ring);
    setTimeout(() => { if (ring.parentNode) ring.remove(); }, 1550);

    for (let i = 0; i < 46; i += 1) {
      const item = document.createElement('div');
      item.className = 'kz-finale-item';
      item.textContent = pick(FINALE_EMOJIS);
      item.style.left = `${Math.random() * 100}%`;
      item.style.top = `${-10 - Math.random() * 30}%`;
      item.style.setProperty('--dur', `${2.0 + Math.random() * 1.8}s`);
      item.style.animationDelay = `${Math.random() * 0.45}s`;
      stage.appendChild(item);
      setTimeout(() => { if (item.parentNode) item.remove(); }, 4300);
    }
  }

  function openFreeInstrumentMode() {
    cleanupAudio();
    cleanupRecording();
    if (!state.container || state.destroyed) return;
    state.screen = 'freeInstrument';
    state.song = null;
    state.cheerScore = 0;
    state.combo = 0;
    clearTimer('comboTimer');
    state.container.innerHTML = `
      <section class="kz-root">
        <div class="kz-top">
          <button type="button" class="kz-home" data-action="back-list">🎵 목록</button>
          <div class="kz-chip">🥁 악기 놀이</div>
        </div>
        <div class="kz-stage">
          <div class="kz-stage-scene is-playing high-cheer" id="kzScene" data-theme="party">
            <div class="kz-mirrorball"></div>
            <div class="kz-lasers"><div class="kz-laser kz-laser-1"></div><div class="kz-laser kz-laser-2"></div></div>
            <div class="kz-free-stage">
              <div class="kz-free-title">마음껏 연주해요!</div>
              <div class="kz-stage-bubble" id="kzStageBubble">쿵짝쿵짝 시작!</div>
              <div class="kz-free-instruments">
                <button type="button" class="kz-inst-btn" data-inst="drum">🥁</button>
                <button type="button" class="kz-inst-btn" data-inst="tambourine">🪇</button>
                <button type="button" class="kz-inst-btn" data-inst="bell">🔔</button>
              </div>
              <div class="kz-free-actions">
                <button type="button" class="kz-stage-btn primary" data-action="free-party">🎉 와아!</button>
                <button type="button" class="kz-stage-btn" data-action="back-list">🎵 노래</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
    bindFreeInstrumentEvents();
    speak('악기 놀이야! 북이랑 딸랑이랑 종을 마음껏 눌러봐.', true);
  }

  function bindFreeInstrumentEvents() {
    const root = state.container;
    if (!root) return;
    root.querySelectorAll('[data-action="back-list"]').forEach((b) => b.addEventListener('click', renderList));
    root.querySelector('[data-action="free-party"]')?.addEventListener('click', () => {
      spawnFinaleEffects();
      playDing('fanfare');
      vibrate([80, 40, 160]);
      showStageBubble('와아아! 악기 파티!');
    });
    root.querySelectorAll('.kz-inst-btn').forEach((btn) => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        playDing(btn.dataset.inst);
        vibrate([25, 20, 45]);
        flashStage();
        spawnNoteParticle(btn, btn.textContent);
        spawnInstrumentImpact(btn, btn.dataset.inst);
        showStageBubble(pick(MID_STAGE_TALKS));
      });
    });
  }

  function spawnThemeParticle() {
    if (!state.isPlaying || !state.container || !state.song || state.destroyed) return;
    const list = THEME_PARTICLES[state.song.theme] || ['🎵', '✨'];
    const emoji = list[Math.floor(Math.random() * list.length)];
    const p = document.createElement('div');
    p.className = 'kz-theme-particle';
    p.textContent = emoji;
    p.style.left = `${Math.random() * 80 + 10}%`;
    const stage = state.container.querySelector('#kzScene');
    if (stage) {
      stage.appendChild(p);
      setTimeout(() => { if (p.parentNode) p.remove(); }, 4000);
    }
  }

  function spawnNoteParticle(btn, emoji) {
    if (!state.container || state.destroyed) return;
    const rect = btn.getBoundingClientRect();
    const cRect = state.container.getBoundingClientRect();
    const p = document.createElement('div');
    p.className = 'kz-note-particle';
    p.textContent = ['🎵', '🎶', emoji][Math.floor(Math.random() * 3)];
    p.style.left = `${rect.left - cRect.left + rect.width / 2}px`;
    p.style.top = `${rect.top - cRect.top}px`;
    const angle = Math.random() * Math.PI - (Math.PI / 2);
    const dist = 60 + Math.random() * 60;
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${-Math.sin(angle) * dist - 50}px`);
    state.container.appendChild(p);
    setTimeout(() => { if (p.parentNode) p.remove(); }, 800);
  }


  function addCombo() {
    state.combo = Math.max(0, (state.combo || 0) + 1);
    clearTimer('comboTimer');

    if (state.combo >= 3) {
      const scene = state.container?.querySelector('#kzScene');
      if (scene) {
        const old = scene.querySelector('.kz-combo-text');
        if (old) old.remove();

        const comboEl = document.createElement('div');
        comboEl.className = 'kz-combo-text';
        comboEl.textContent = `${state.combo} COMBO!`;
        scene.appendChild(comboEl);

        setTimeout(() => {
          if (comboEl.parentNode) comboEl.remove();
        }, 650);
      }
      addCheerScore(5);
    }

    state.comboTimer = setTimeout(() => {
      state.combo = 0;
      state.comboTimer = null;
    }, 1500);
  }

  function showScore() {
    const board = state.container?.querySelector('#kzScoreBoard');
    if (!board) return;

    const finalScore = Math.floor(Math.random() * 11) + 90;
    board.style.display = 'block';

    let current = 0;
    const scoreTimer = setInterval(() => {
      if (state.destroyed || !board.parentNode) {
        clearInterval(scoreTimer);
        return;
      }

      current = Math.min(finalScore, current + 2);
      board.textContent = `${String(current).padStart(3, '0')}점`;

      if (current % 8 === 0) playDing('beat');

      if (current >= finalScore) {
        clearInterval(scoreTimer);
        playDing('fanfare');
      }
    }, 30);
  }

  function setLyricDancing(enabled) {
    const line = state.container?.querySelector('#kzCurrentLine');
    if (line) line.classList.toggle('dancing', !!enabled);
  }


  function addCheerScore(points) {
    state.cheerScore = Math.min(100, Math.max(0, state.cheerScore + points));
    const fill = state.container?.querySelector('#kzCheerFill');
    if (fill) fill.style.height = `${state.cheerScore}%`;
    const scene = state.container?.querySelector('#kzScene');
    if (scene) scene.classList.toggle('high-cheer', state.cheerScore >= 50);

    if (state.cheerScore >= 100 && !state.fanSignShown) {
      state.fanSignShown = true;
      spawnFanSign(pick(['시현아 최고!', '앙코르!', '사랑해 시현아!']));
      playDing('fanfare');
    }
  }


  async function ensureYouTubePlayer() {
    if (!state.song || !state.song.youtubeId) return null;

    if (state.ytPlayer && state.ytPlayerReady) return state.ytPlayer;

    const readyPanel = state.container?.querySelector('#kzYoutubeReady');
    const playerEl = state.container?.querySelector('#kzYoutubePlayer');
    if (!playerEl) return null;

    const YT = await getYouTubeApi();
    if (state.destroyed || !state.song) return null;

    if (readyPanel) readyPanel.style.display = 'none';
    playerEl.style.display = 'block';

    return await new Promise((resolve) => {
      let resolved = false;

      state.ytPlayer = new YT.Player('kzYoutubePlayer', {
        width: '100%',
        height: '100%',
        videoId: state.song.youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            state.ytPlayerReady = true;
            try { event.target.setVolume(state.currentVolume || state.song.volume || 70); } catch (e) {}
            if (!resolved) {
              resolved = true;
              resolve(event.target);
            }
          },
          onStateChange: (event) => {
            if (!window.YT) return;
            if (event.data === window.YT.PlayerState.PLAYING) {
              state.isPlaying = true;
              startLyricTimer();
            } else if (
              event.data === window.YT.PlayerState.PAUSED ||
              event.data === window.YT.PlayerState.CUED
            ) {
              state.isPlaying = false;
              if (state.lyricTimer) { clearInterval(state.lyricTimer); state.lyricTimer = null; }
            } else if (event.data === window.YT.PlayerState.ENDED) {
              completeSong();
            }
          },
          onError: () => {
            showKaraokeToast('영상을 불러오지 못했어요');
            speak('영상을 불러오지 못했어요.', true);
          }
        }
      });

      setTimeout(() => {
        if (!resolved && state.ytPlayer) {
          resolved = true;
          resolve(state.ytPlayer);
        }
      }, 4500);
    });
  }




  function togglePlay() {
    if (state.isPlaying) pauseSong();
    else startSong();
  }

  async function startSong() {
    if (!state.song || state.destroyed) return;

    if (!state.song.youtubeId) {
      showKaraokeToast('아직 영상이 준비중이에요!');
      speak(`${state.song.title} 영상은 아직 준비중이에요.`, true);
      return;
    }

    // 기존 v3.3 무대 이펙트는 그대로 켠다.
    state.isPlaying = true;
    state.activeLine = 0;
    state.cheerScore = 0;
    state.combo = 0;
    clearTimer('comboTimer');
    addCheerScore(0);

    const scene = state.container?.querySelector('#kzScene');
    if (scene) scene.classList.add('is-playing');

    updateLyricUI();

    const playBtn = state.container?.querySelector('[data-action="play"]');
    if (playBtn) playBtn.textContent = '⏸ 멈춤';

    if (!state.particleTimer) {
      state.particleTimer = setInterval(spawnThemeParticle, 1200);
    }

    try {
      const loadingPanel = state.container?.querySelector('#kzYoutubeReady');
      if (loadingPanel) {
        loadingPanel.classList.add('kz-youtube-loading');
        loadingPanel.innerHTML = `
          <div>
            <div class="kz-youtube-ready-icon">${escapeHtml(state.song.emoji)}</div>
            <div class="kz-youtube-ready-text">영상을 가져오고 있어요!<br>조금만 기다려요!</div>
          </div>
        `;
      }

      const player = await ensureYouTubePlayer();
      if (!player) return;
      try { player.setVolume(state.currentVolume || state.song.volume || 70); } catch (e) {}
      updateVolumeUI();
      player.playVideo();
      startLyricTimer();
      speak('좋아! 원곡을 보면서 크게 따라 불러보자!', true);
      vibrate(35);
    } catch (error) {
      console.warn(error);
      showKaraokeToast('시작 버튼을 한 번 더 눌러줘요');
      speak('시작 버튼을 한 번 더 눌러줘요.', true);
      pauseSong();
    }
  }



  function startLyricTimer() {
    if (state.destroyed || !state.song || !state.isPlaying) return;
    clearTimer('lyricTimer');

    state.lyricTimer = setInterval(() => {
      if (!state.isPlaying || !state.song || state.destroyed) return;

      const offset = Math.max(0, Number(state.song.startOffset || 0));

      if (Array.isArray(state.song.lyricsTiming) && state.song.lyricsTiming.length && state.ytPlayer) {
        let currentTime = 0;
        try { currentTime = (state.ytPlayer.getCurrentTime() || 0) - offset; } catch (e) {}
        if (currentTime < 0) {
          state.activeLine = 0;
          updateLyricUI();
          return;
        }

        let idx = 0;
        for (let i = 0; i < state.song.lyricsTiming.length; i += 1) {
          if (currentTime >= state.song.lyricsTiming[i].t) idx = i;
        }
        if (idx !== state.activeLine) {
          state.activeLine = idx % state.song.lines.length;
          updateLyricUI();
          animateCurrentLyric(getLineDurationMs());
          if (state.activeLine % 2 === 1) showStageBubble(pick(MID_STAGE_TALKS));
        }
        return;
      }

      let duration = 0;
      let currentTime = 0;
      try {
        duration = state.ytPlayer?.getDuration?.() || 0;
        currentTime = (state.ytPlayer?.getCurrentTime?.() || 0) - offset;
      } catch (e) {}

      if (currentTime < 0) {
        if (state.activeLine !== 0) {
          state.activeLine = 0;
          updateLyricUI();
        }
        return;
      }

      const effectiveDuration = Math.max(1, duration - offset);

      if (effectiveDuration > 1 && state.song.lines.length) {
        const idx = Math.min(state.song.lines.length - 1, Math.floor((currentTime / effectiveDuration) * state.song.lines.length));
        if (idx !== state.activeLine) {
          state.activeLine = idx;
          addCheerScore(10);
          updateLyricUI();
          animateCurrentLyric(getLineDurationMs());
          if (state.activeLine % 2 === 1) showStageBubble(pick(MID_STAGE_TALKS));
        }
        return;
      }

      state.ytLyricClock = (state.ytLyricClock || 0) + 350;
      const fallbackIdx = Math.min(state.song.lines.length - 1, Math.floor(state.ytLyricClock / 4200));
      if (fallbackIdx !== state.activeLine) {
        state.activeLine = fallbackIdx;
        updateLyricUI();
        animateCurrentLyric(4200);
      }
    }, 350);

    updateLyricUI();
    animateCurrentLyric(getLineDurationMs());
  }

  function startFallbackBeat(withLyrics) {
    if (state.destroyed) return;
    if (state.beatTimer) clearInterval(state.beatTimer);
    state.beatTimer = setInterval(() => playDing('beat'), 620);
    if (withLyrics && !state.lyricTimerStarted) {
      state.lyricTimerStarted = true;
      startLyricTimer();
    }
  }

  function pauseSong() {
    state.isPlaying = false;

    if (state.ytPlayer) {
      try { state.ytPlayer.pauseVideo(); } catch (e) {}
    }

    if (state.lyricTimer) { clearInterval(state.lyricTimer); state.lyricTimer = null; }
    if (state.beatTimer) { clearInterval(state.beatTimer); state.beatTimer = null; }
    if (state.particleTimer) { clearInterval(state.particleTimer); state.particleTimer = null; }

    const scene = state.container?.querySelector('#kzScene');
    if (scene) scene.classList.remove('is-playing');

    const fill = state.container?.querySelector('#kzLyricFill');
    const ptr = state.container?.querySelector('#kzLyricPointer');
    if (fill) { fill.style.transition = 'none'; fill.style.width = '0%'; }
    if (ptr) { ptr.style.transition = 'none'; ptr.style.left = '0%'; }

    const playBtn = state.container?.querySelector('[data-action="play"]');
    if (playBtn) playBtn.textContent = '▶ 계속';
  }

  function getLineDurationMs() {
    if (!state.song) return 4200;

    if (state.ytPlayer && typeof state.ytPlayer.getDuration === 'function') {
      try {
        const duration = state.ytPlayer.getDuration();
        const offset = Math.max(0, Number(state.song.startOffset || 0));
        const effectiveDuration = Math.max(1, duration - offset);
        if (Number.isFinite(effectiveDuration) && effectiveDuration > 5 && state.song.lines?.length) {
          return Math.max(2600, Math.floor((effectiveDuration * 1000 - 1200) / state.song.lines.length));
        }
      } catch (e) {}
    }

    return 4200;
  }

  function resetLyricAnimation() {
    const fill = state.container?.querySelector('#kzLyricFill');
    const ptr = state.container?.querySelector('#kzLyricPointer');
    if (fill) { fill.style.transition = 'none'; fill.style.width = '0%'; }
    if (ptr) { ptr.style.transition = 'none'; ptr.style.left = '0%'; }
  }

  function animateCurrentLyric(duration) {
    const fill = state.container?.querySelector('#kzLyricFill');
    const ptr = state.container?.querySelector('#kzLyricPointer');
    if (!fill) return;
    fill.style.transition = 'none';
    fill.style.width = '0%';
    if (ptr) { ptr.style.transition = 'none'; ptr.style.left = '0%'; }
    setTimeout(() => {
      if (!state.isPlaying || state.destroyed) return;
      fill.style.transition = `width ${duration}ms linear`;
      fill.style.width = '100%';
      if (ptr) {
        ptr.style.transition = `left ${duration}ms linear`;
        ptr.style.left = '100%';
      }
    }, 50);
  }

  function updateLyricUI() {
    if (!state.song || !state.container) return;
    const base = state.container.querySelector('#kzLyricBase');
    const fill = state.container.querySelector('#kzLyricFill');
    const ptr = state.container.querySelector('#kzLyricPointer');
    const nextLine = state.container.querySelector('#kzNextLine');
    const bar = state.container.querySelector('#kzProgressBar');
    const lineText = state.song.lines[state.activeLine] || '잘했어요!';

    if (base) base.textContent = lineText;
    if (fill) fill.textContent = lineText;
    if (ptr) ptr.textContent = state.song.emoji;
    resetLyricAnimation();

    if (nextLine) {
      const next = state.song.lines[state.activeLine + 1];
      nextLine.textContent = next ? `다음: ${next}` : '마지막까지 신나게!';
    }
    if (bar) {
      const percent = Math.min(100, Math.max(0, ((state.activeLine + 1) / state.song.lines.length) * 100));
      bar.style.width = `${percent}%`;
    }
  }

  function completeSong() {
    if (!state.song || state.destroyed || state.isCompleting) return;
    state.isCompleting = true;
    state.isPlaying = false;

    stopLyricAndEffectTimers();
    cleanupPlaybackAudio();
    clearTimer('comboTimer');

    if (state.ytPlayer) {
      try { state.ytPlayer.stopVideo(); } catch (e) {}
    }

    const scene = state.container?.querySelector('#kzScene');
    if (scene) scene.classList.remove('is-playing');

    setLyricDancing(false);

    state.activeLine = Math.max(0, state.song.lines.length - 1);
    updateLyricUI();

    if (scene) scene.classList.add('is-complete', 'high-cheer');

    showScore();

    setTimeout(() => {
      if (state.destroyed || !state.container) return;

      const complete = state.container.querySelector('#kzComplete');
      if (complete) complete.classList.remove('kz-hidden');

      const praise = pick(WARM_PRAISES);
      const title = state.container.querySelector('#kzCompleteTitle');
      const sub = state.container.querySelector('#kzCompleteSub');

      if (title) title.textContent = '시현이 최고 가수상!';
      if (sub) sub.textContent = praise;

      spawnFinaleEffects();
      state.options.fireConfetti?.();
      state.options.gainExp?.(30);
      playDing('fanfare');
      vibrate([120, 40, 120, 40, 240]);
      speak(praise, true);

      const playBtn = state.container.querySelector('[data-action="play"]');
      if (playBtn) playBtn.textContent = '▶ 다시';
    }, 2500);
  }

  async function startRecording(button) {
    if (state.destroyed || (state.recorder && state.recorder.state === 'recording')) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      speak('이 기기에서는 마이크를 사용할 수 없어요.', true);
      return;
    }

    pauseSong();
    cleanupPlaybackAudio();

    try {
      cleanupRecording();
      state.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) options = { mimeType: 'audio/webm;codecs=opus' };
      else if (MediaRecorder.isTypeSupported('audio/mp4')) options = { mimeType: 'audio/mp4' };

      try { state.recorder = new MediaRecorder(state.stream, options); }
      catch (e) { state.recorder = new MediaRecorder(state.stream); }

      state.audioMimeType = state.recorder.mimeType || options.mimeType || 'audio/webm';
      state.recordedChunks = [];
      state.recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) state.recordedChunks.push(event.data);
      };
      state.recorder.onstop = playRecordedVoice;
      state.recorder.start();

      button.classList.add('recording');
      button.textContent = '⏹️ 중지';
      vibrate(50);
      speak('시현이 목소리 녹음 중! 노래해봐!', true);

      const scene = state.container?.querySelector('#kzScene');
      if (scene) scene.classList.add('is-playing', 'is-recording');
      showStageBubble('녹음 중! 시현이 목소리 들려줘!');
    } catch (error) {
      console.warn(error);
      cleanupRecording();
      button.classList.remove('recording');
      button.textContent = '🎙️ 녹음';
      const scene = state.container?.querySelector('#kzScene');
      if (scene) scene.classList.remove('is-playing');
      speak('마이크를 사용할 수 없어요. 다시 눌러서 시도할 수 있어요.', true);
    }
  }

  function stopRecording(button) {
    if (!state.recorder || state.recorder.state !== 'recording') return;
    try { state.recorder.stop(); } catch (error) { console.warn(error); }
    if (state.stream) {
      try { state.stream.getTracks().forEach((track) => track.stop()); } catch (e) {}
      state.stream = null;
    }
    button.classList.remove('recording');
    button.textContent = '🎙️ 녹음';
    vibrate([40, 40]);
    const scene = state.container?.querySelector('#kzScene');
    if (scene) scene.classList.remove('is-playing', 'is-recording');
  }

  async function playRecordedVoice() {
    if (state.destroyed || !state.recordedChunks.length) return;
    const blob = new Blob(state.recordedChunks, { type: state.audioMimeType || state.recorder?.mimeType || 'audio/webm' });
    speak('내가 부른 노래 들어볼까?', true);

    setTimeout(async () => {
      if (state.destroyed) return;
      cleanupPlaybackAudio();
      try {
        const ctx = initAudioCtx();
        if (!ctx) throw new Error('No AudioContext');
        const arrayBuffer = await blob.arrayBuffer();
        if (state.destroyed) return;
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        if (state.destroyed) return;
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        let finalNode = source;

        if (state.voiceMode === 'helium') {
          source.playbackRate.value = 1.6;
        } else if (state.voiceMode === 'robot') {
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.value = 45;
          const gainNode = ctx.createGain();
          source.connect(gainNode);
          osc.connect(gainNode.gain);
          finalNode = gainNode;
          state.robotOscillator = osc;
          osc.start();
          source.onended = () => {
            try { osc.stop(); } catch (e) {}
            state.robotOscillator = null;
          };
        }

        finalNode.connect(ctx.destination);
        state.currentSource = source;
        source.start(0);
      } catch (e) {
        console.warn('Audio playback failed, fallback to standard audio', e);
        if (state.destroyed) return;
        if (state.recordedUrl) {
          try { URL.revokeObjectURL(state.recordedUrl); } catch (err) {}
        }
        state.recordedUrl = URL.createObjectURL(blob);
        const audio = ensurePlaybackAudio();
        audio.src = state.recordedUrl;
        audio.volume = 1;
        audio.playsInline = true;
        audio.setAttribute('playsinline', '');
        audio.setAttribute('webkit-playsinline', '');
        audio.play().catch(() => speak('재생을 다시 눌러줘.', true));
      }
    }, 900);
  }

  function destroy() {
    cleanupAudio();
    cleanupRecording();
    cleanupPlaybackAudio();
    clearTimer('comboTimer');
    state.container = null;
    state.options = {};
    state.screen = 'list';
    state.song = null;
    state.activeLine = 0;
    state.cheerScore = 0;
    state.combo = 0;
    state.destroyed = true;
    if (state.audioCtx && state.audioCtx.state !== 'closed') {
      state.audioCtx.close().catch(() => {});
      state.audioCtx = null;
    }
  }

  window.SIHYEON_KARAOKE_SONGS = SONGS;
  window.SihyeonZones.karaokeZone = { render, destroy, songs: SONGS };
})();
