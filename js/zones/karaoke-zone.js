/**
 * 시현이 놀이터 OS — 시현이 노래방 (Karaoke Zone)
 * 파일: js/zones/karaoke-zone.js
 * 버전: v5.0.0 — YouTube 화면 중심 초간단 정리본
 * 기준:
 * - 유튜브 화면을 메인으로 사용
 * - 자막/점수/콤보/악기/녹음/목소리변조/응원바/파티클 UI 삭제
 * - 최하단 1줄 조작만 유지
 * - 유튜브 iframe 직접 임베드 방식으로 안정성 우선
 */
(function () {
  'use strict';

  window.SihyeonZones = window.SihyeonZones || {};

  const STYLE_ID = 'sihyeon-karaoke-zone-style';

  const SONGS = [
    {"id": "playing_is_best", "title": "노는 게 제일 좋아", "emoji": "🐧", "theme": "snow", "youtubeId": "mZpjPAxtNYI", "desc": "뽀로로 노래", "volume": 70},
    {"id": "banana_chacha", "title": "바나나 차차", "emoji": "🍌", "theme": "party", "youtubeId": "cyJgx5kFAfI", "desc": "신나는 바나나 노래", "volume": 70},
    {"id": "gogo_dino", "title": "고고다이노", "emoji": "🦖", "theme": "dino", "youtubeId": "acB-EDNOCBw", "desc": "공룡 구조대 노래", "volume": 70},
    {"id": "tayo", "title": "타요", "emoji": "🚌", "theme": "city", "youtubeId": "tVU53nGuPGw", "desc": "꼬마버스 노래", "volume": 70},
    {"id": "kongsuni", "title": "콩순이", "emoji": "👧", "theme": "party", "youtubeId": "ORZbDTZaB8U", "desc": "콩순이 노래", "volume": 70},
    {"id": "fancy_tomato", "title": "멋쟁이 토마토", "emoji": "🍅", "theme": "flower", "youtubeId": "5i-GDvqldc8", "desc": "토마토 동요", "volume": 70},
    {"id": "little_star", "title": "작은 별", "emoji": "⭐", "theme": "star", "youtubeId": "tIRul7vW_b0", "desc": "별 노래", "volume": 70},
    {"id": "dad_cheer_up", "title": "아빠 힘내세요", "emoji": "💪", "theme": "party", "youtubeId": "ZZh3Lw_B7Vs", "desc": "가족 응원 노래", "volume": 70},
    {"id": "round_and_round", "title": "둥글게 둥글게", "emoji": "⭕", "theme": "party", "youtubeId": "L21Yd-dYM1s", "desc": "율동 동요", "volume": 70},
    {"id": "three_bears", "title": "곰 세 마리", "emoji": "🐻", "theme": "forest", "youtubeId": "L6_y2KvGNts", "desc": "곰 가족 노래", "volume": 70},
    {"id": "all_together", "title": "우리 모두 다 같이", "emoji": "👏", "theme": "party", "youtubeId": "eu89jwQbp0k", "desc": "박수 놀이 노래", "volume": 70},
    {"id": "freeze_dance", "title": "그대로 멈춰라", "emoji": "🧊", "theme": "party", "youtubeId": "avRH4M-AJa8", "desc": "멈춤 놀이 노래", "volume": 70},
    {"id": "school_bell", "title": "학교종", "emoji": "🔔", "theme": "bell", "youtubeId": "-KYsZGZHPyU", "desc": "딩동댕 노래", "volume": 70},
    {"id": "its_okay", "title": "괜찮아요", "emoji": "😊", "theme": "flower", "youtubeId": "jntmFkLqVR4", "desc": "마음 동요", "volume": 70},
    {"id": "jjalang_jjalang", "title": "짤랑짤랑", "emoji": "🪇", "theme": "bell", "youtubeId": "Cl1RFhjTIz0", "desc": "리듬 동요", "volume": 70}
  ];

  const state = {
    container: null,
    options: {},
    screen: 'list',
    song: null,
    destroyed: false,
    iframeVersion: 0
  };

  function injectStyle() {
    const old = document.getElementById(STYLE_ID);
    if (old) old.remove();

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .kz-root{
        width:100%;
        height:100%;
        min-height:0;
        position:relative;
        overflow:hidden;
        display:flex;
        flex-direction:column;
        background:linear-gradient(180deg,#7bdcff 0%,#e7f8ff 46%,#fff1bd 100%);
        color:#213047;
        font-family:'Jua','Pretendard',system-ui,sans-serif;
        user-select:none;
        touch-action:manipulation;
        -webkit-user-select:none;
        -webkit-touch-callout:none;
      }

      .kz-root *{
        box-sizing:border-box;
      }

      .kz-top{
        position:relative;
        z-index:10;
        flex-shrink:0;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        padding:max(12px,env(safe-area-inset-top)) 14px 8px;
      }

      .kz-home,
      .kz-chip{
        min-height:52px;
        border-radius:999px;
        background:rgba(255,255,255,.94);
        display:inline-flex;
        align-items:center;
        justify-content:center;
        padding:0 16px;
        font-weight:900;
        color:#213047;
        border:5px solid rgba(255,255,255,.98);
        box-shadow:0 7px 0 rgba(52,74,110,.18);
        white-space:nowrap;
      }

      .kz-home{
        min-width:72px;
        border:none;
        font:inherit;
        font-size:clamp(17px,4.6vw,22px);
        cursor:pointer;
        -webkit-tap-highlight-color:transparent;
      }

      .kz-home:active{
        transform:translateY(4px);
        box-shadow:0 3px 0 rgba(52,74,110,.18);
      }

      .kz-chip{
        min-width:0;
        max-width:calc(100vw - 120px);
        overflow:hidden;
        text-overflow:ellipsis;
        font-size:clamp(18px,5vw,27px);
      }

      .kz-player-top{
        justify-content:center;
      }

      .kz-chip-full{
        max-width:calc(100vw - 28px);
        padding:0 22px;
      }

      .kz-list-wrap{
        position:relative;
        z-index:5;
        flex:1;
        min-height:0;
        overflow:auto;
        padding:8px 14px max(18px,env(safe-area-inset-bottom));
      }

      .kz-list-wrap::-webkit-scrollbar{
        display:none;
      }

      .kz-song-grid{
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:clamp(11px,3vw,18px);
      }

      .kz-song-card{
        position:relative;
        min-height:132px;
        border-radius:30px;
        background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(255,246,202,.95));
        border:5px solid #fff;
        box-shadow:0 8px 0 rgba(52,74,110,.18);
        display:grid;
        grid-template-rows:1fr auto;
        gap:8px;
        padding:9px 8px 10px;
        text-align:center;
        color:#213047;
        cursor:pointer;
        font:inherit;
        -webkit-tap-highlight-color:transparent;
      }

      .kz-song-card:active{
        transform:translateY(4px);
        box-shadow:0 4px 0 rgba(52,74,110,.18);
      }

      .kz-song-icon{
        min-height:70px;
        border-radius:24px;
        display:grid;
        place-items:center;
        font-size:clamp(46px,14vw,74px);
        background:linear-gradient(160deg,#dff7ff 0%,#fff4a8 58%,#ffd0eb 100%);
        box-shadow:inset 0 -6px 0 rgba(0,0,0,.05);
      }

      .kz-song-title{
        font-size:clamp(18px,5vw,26px);
        line-height:1.08;
        font-weight:900;
        word-break:keep-all;
      }

      .kz-player-root{
        position:relative;
        z-index:5;
        flex:1;
        min-height:0;
        display:grid;
        grid-template-rows:minmax(0,1fr) auto;
        gap:10px;
        padding:8px 10px max(12px,env(safe-area-inset-bottom));
      }

      .kz-youtube-shell{
        position:relative;
        min-height:0;
        width:100%;
        height:100%;
        overflow:hidden;
        border-radius:32px;
        border:7px solid rgba(255,255,255,.98);
        background:#05070c;
        box-shadow:0 10px 0 rgba(52,74,110,.18),0 22px 38px rgba(52,74,110,.18);
      }

      .kz-youtube-frame{
        display:block;
        width:100%;
        height:100%;
        min-height:260px;
        border:0;
        background:#000;
      }

      .kz-youtube-fallback{
        position:absolute;
        inset:0;
        z-index:2;
        display:none;
        place-items:center;
        padding:18px;
        color:#fff;
        text-align:center;
        background:linear-gradient(180deg,#111827,#172554);
        font-weight:900;
      }

      .kz-youtube-fallback.is-visible{
        display:grid;
      }

      .kz-fallback-icon{
        font-size:clamp(74px,22vw,140px);
        filter:drop-shadow(0 10px 0 rgba(0,0,0,.24));
        animation:kzBounce 1s ease-in-out infinite alternate;
      }

      .kz-fallback-text{
        margin-top:12px;
        font-size:clamp(22px,6vw,38px);
        line-height:1.12;
        word-break:keep-all;
      }

      @keyframes kzBounce{
        from{transform:translateY(0) rotate(-3deg)}
        to{transform:translateY(-12px) rotate(3deg)}
      }

      .kz-bottom-bar{
        flex-shrink:0;
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:8px;
      }

      .kz-bottom-btn{
        min-height:clamp(64px,13vw,88px);
        border-radius:24px;
        background:rgba(255,255,255,.96);
        color:#213047;
        font:inherit;
        font-size:clamp(17px,4.6vw,25px);
        font-weight:900;
        line-height:1.05;
        cursor:pointer;
        border:5px solid #fff;
        box-shadow:0 6px 0 rgba(0,0,0,.15);
        -webkit-tap-highlight-color:transparent;
      }

      .kz-bottom-btn:active{
        transform:translateY(5px);
        box-shadow:0 1px 0 rgba(0,0,0,.15);
      }

      .kz-bottom-btn.primary{
        background:linear-gradient(180deg,#ffef75,#ff9f1c);
        box-shadow:0 6px 0 #E65100;
      }

      .kz-toast-message{
        position:absolute;
        z-index:999;
        left:50%;
        top:50%;
        transform:translate(-50%,-50%);
        max-width:min(86vw,420px);
        padding:20px 24px;
        border-radius:32px;
        background:rgba(255,255,255,.98);
        border:6px solid #fff;
        box-shadow:0 12px 34px rgba(0,0,0,.24);
        color:#213047;
        text-align:center;
        font-size:clamp(22px,6vw,34px);
        line-height:1.15;
        font-weight:900;
        pointer-events:none;
      }

      @media(orientation:landscape){
        .kz-top{
          padding:10px 14px 6px;
        }

        .kz-player-root{
          padding:6px 12px max(8px,env(safe-area-inset-bottom));
          gap:8px;
        }

        .kz-bottom-btn{
          min-height:58px;
          border-radius:20px;
          font-size:clamp(16px,3vw,23px);
        }
      }

      @media(max-width:430px){
        .kz-song-card{
          min-height:124px;
          border-width:4px;
          border-radius:25px;
          padding:8px 7px 9px;
        }

        .kz-song-icon{
          min-height:64px;
          border-radius:20px;
        }

        .kz-bottom-bar{
          gap:6px;
        }

        .kz-bottom-btn{
          border-width:4px;
          border-radius:20px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showKaraokeToast(message) {
    if (!state.container || state.destroyed) return;

    const old = state.container.querySelector('.kz-toast-message');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'kz-toast-message';
    toast.textContent = message;
    state.container.appendChild(toast);

    window.setTimeout(() => {
      if (toast && toast.parentNode) toast.remove();
    }, 1500);
  }

  function vibrate(pattern) {
    if (!navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (e) {}
  }

  function speak(text, force) {
    if (!text || state.destroyed) return;

    const voiceIds = {
      '시현아, 부르고 싶은 노래를 골라봐.': 'zone.karaoke.intro',
      '원곡 영상을 보면서 따라 불러요.': 'zone.karaoke.songStart'
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
      utterance.rate = 0.88;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  }

  function goHome() {
    destroyPlayerOnly();

    if (typeof state.options.closeToParkHome === 'function') {
      state.options.closeToParkHome();
      return;
    }

    if (typeof window.renderWorldMapHome === 'function') {
      window.renderWorldMapHome();
    }
  }

  function getYoutubeEmbedUrl(song, autoplay) {
    const id = encodeURIComponent(song.youtubeId || '');
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      playsinline: '1',
      controls: '1',
      rel: '0',
      modestbranding: '1',
      fs: '1',
      iv_load_policy: '3',
      enablejsapi: '0'
    });

    return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
  }

  function destroyPlayerOnly() {
    state.iframeVersion += 1;
    const frame = state.container?.querySelector('.kz-youtube-frame');
    if (frame) {
      try { frame.src = 'about:blank'; } catch (e) {}
    }
  }

  function render(container, options = {}) {
    destroy();
    injectStyle();

    state.container = container;
    state.options = options || {};
    state.screen = 'list';
    state.song = null;
    state.destroyed = false;
    state.iframeVersion = 0;

    renderList();
    speak('시현아, 부르고 싶은 노래를 골라봐.', true);
  }

  function renderList() {
    if (!state.container || state.destroyed) return;

    destroyPlayerOnly();

    state.screen = 'list';
    state.song = null;

    state.container.innerHTML = `
      <section class="kz-root">
        <div class="kz-top">
          <button type="button" class="kz-home" data-action="home">🏠</button>
          <div class="kz-chip">🎤 시현이 노래방</div>
        </div>
        <div class="kz-list-wrap">
          <div class="kz-song-grid">
            ${SONGS.map((song) => `
              <button type="button" class="kz-song-card" data-song-id="${escapeHtml(song.id)}" aria-label="${escapeHtml(song.title)}">
                <span class="kz-song-icon">${escapeHtml(song.emoji)}</span>
                <span class="kz-song-title">${escapeHtml(song.title)}</span>
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

    root.querySelectorAll('[data-song-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const song = SONGS.find((item) => item.id === button.dataset.songId);
        if (!song) return;

        if (!song.youtubeId) {
          showKaraokeToast('영상 준비중');
          vibrate([40, 40]);
          return;
        }

        openSong(song);
      });
    });
  }

  function openSong(song) {
    if (!state.container || state.destroyed) return;

    destroyPlayerOnly();

    state.song = song;
    state.screen = 'player';

    drawPlayer(song, true);
    speak('원곡 영상을 보면서 따라 불러요.', true);
    vibrate(35);
  }

  function drawPlayer(song, autoplay) {
    if (!state.container || state.destroyed || !song) return;

    const version = state.iframeVersion + 1;
    state.iframeVersion = version;

    state.container.innerHTML = `
      <section class="kz-root">
        <div class="kz-top kz-player-top">
          <div class="kz-chip kz-chip-full">${escapeHtml(song.emoji)} ${escapeHtml(song.title)}</div>
        </div>

        <div class="kz-player-root">
          <div class="kz-youtube-shell">
            <iframe
              class="kz-youtube-frame"
              title="${escapeHtml(song.title)}"
              src="${escapeHtml(getYoutubeEmbedUrl(song, autoplay))}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowfullscreen
              referrerpolicy="strict-origin-when-cross-origin"
            ></iframe>
            <div class="kz-youtube-fallback" id="kzYoutubeFallback">
              <div>
                <div class="kz-fallback-icon">${escapeHtml(song.emoji)}</div>
                <div class="kz-fallback-text">영상이 안 나오면<br>다시 버튼을 눌러요</div>
              </div>
            </div>
          </div>

          <div class="kz-bottom-bar">
            <button type="button" class="kz-bottom-btn" data-action="back-list">🎵 목록</button>
            <button type="button" class="kz-bottom-btn primary" data-action="reload">🔁 다시</button>
            <button type="button" class="kz-bottom-btn" data-action="open-youtube">▶ 유튜브</button>
            <button type="button" class="kz-bottom-btn" data-action="home">🏠 홈</button>
          </div>
        </div>
      </section>
    `;

    bindPlayerEvents(song);

    window.setTimeout(() => {
      if (state.destroyed || state.iframeVersion !== version) return;
      const fallback = state.container?.querySelector('#kzYoutubeFallback');
      const frame = state.container?.querySelector('.kz-youtube-frame');
      if (!fallback || !frame) return;

      /*
       * YouTube iframe은 네트워크/저작권/임베드 제한 여부를 JS에서 완벽히 알 수 없다.
       * 그래서 화면 자체를 가리지 않고, 안내 패널은 실제 iframe 영역 뒤에만 둔다.
       * 사용자가 검은 화면을 보면 하단의 다시/유튜브 버튼으로 즉시 대체 진입할 수 있다.
       */
    }, 3500);
  }

  function bindPlayerEvents(song) {
    const root = state.container;
    if (!root) return;

    root.querySelectorAll('[data-action="back-list"]').forEach((button) => {
      button.addEventListener('click', renderList);
    });

    root.querySelectorAll('[data-action="home"]').forEach((button) => {
      button.addEventListener('click', goHome);
    });

    root.querySelector('[data-action="reload"]')?.addEventListener('click', () => {
      if (!state.song) return;
      vibrate(25);
      drawPlayer(state.song, true);
    });

    root.querySelector('[data-action="open-youtube"]')?.addEventListener('click', () => {
      if (!song || !song.youtubeId) return;

      const url = `https://www.youtube.com/watch?v=${encodeURIComponent(song.youtubeId)}`;

      try {
        window.open(url, '_blank', 'noopener');
      } catch (e) {
        window.location.href = url;
      }
    });
  }

  function destroy() {
    destroyPlayerOnly();

    state.container = null;
    state.options = {};
    state.screen = 'list';
    state.song = null;
    state.destroyed = true;
  }

  window.SIHYEON_KARAOKE_SONGS = SONGS;
  window.SihyeonZones.karaokeZone = { render, destroy, songs: SONGS };
})();
