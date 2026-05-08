/* ═══════════════════════════════════════════
   SIHYEON PLAY OS - VOICE ENGINE v1
   js/voice-engine.js
   - 성우 mp3/webm 재생 전용 준비 엔진
   - 음성 파일이 없으면 TTS로 대체하지 않음
   - 게임부터 안전하게 연결하기 위한 1차 기반
═══════════════════════════════════════════ */
(function () {
  'use strict';

  const MANIFEST_URL = './assets/voice/voice_manifest.json';
  const DEFAULT_BASE_DIR = './assets/voice/';

  let manifest = null;
  let manifestPromise = null;
  let activeAudio = null;
  let activeId = '';
  let muted = false;

  function normalizePath(path) {
    if (!path) return '';
    const value = String(path).trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('./')) return value;
    if (value.startsWith('/')) return '.' + value;
    if (value.startsWith('assets/voice/')) return './' + value;
    return DEFAULT_BASE_DIR + value.replace(/^\/+/, '');
  }

  async function loadManifest(force = false) {
    if (!force && manifest) return manifest;
    if (!force && manifestPromise) return manifestPromise;

    manifestPromise = fetch(MANIFEST_URL, { cache: force ? 'no-store' : 'force-cache' })
      .then((res) => {
        if (!res.ok) throw new Error('VOICE_MANIFEST_LOAD_FAILED_' + res.status);
        return res.json();
      })
      .then((json) => {
        manifest = json || {};
        return manifest;
      })
      .catch((error) => {
        console.warn('[SihyeonVoice] voice manifest load failed:', error);
        manifest = { version: 'empty', ui: {}, games: {}, stories: {} };
        return manifest;
      });

    return manifestPromise;
  }

  function getNestedValue(obj, dottedPath) {
    if (!obj || !dottedPath) return '';
    return String(dottedPath).split('.').reduce((current, key) => {
      if (!current || current[key] === undefined || current[key] === null) return '';
      return current[key];
    }, obj);
  }

  async function getVoiceSrc(voiceId) {
    const data = await loadManifest(false);
    const path = getNestedValue(data, voiceId);
    return normalizePath(path);
  }

  function stop() {
    if (activeAudio) {
      try {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      } catch (error) {
        console.warn('[SihyeonVoice] stop failed:', error);
      }
    }
    activeAudio = null;
    activeId = '';
  }

  function pause() {
    if (activeAudio) activeAudio.pause();
  }

  function resume() {
    if (activeAudio) activeAudio.play().catch(() => {});
  }

  async function play(voiceId, options = {}) {
    if (!voiceId || muted) return false;
    stop();

    const src = await getVoiceSrc(voiceId);
    if (!src) {
      console.warn('[SihyeonVoice] missing voice:', voiceId);
      return false;
    }

    return new Promise((resolve) => {
      const audio = new Audio(src);
      activeAudio = audio;
      activeId = voiceId;
      audio.preload = 'auto';
      audio.volume = Math.max(0, Math.min(1, Number(options.volume ?? 1)));

      audio.onended = () => {
        if (activeAudio === audio) {
          activeAudio = null;
          activeId = '';
        }
        resolve(true);
      };

      audio.onerror = () => {
        console.warn('[SihyeonVoice] audio error:', voiceId, src);
        if (activeAudio === audio) {
          activeAudio = null;
          activeId = '';
        }
        resolve(false);
      };

      audio.play().catch((error) => {
        console.warn('[SihyeonVoice] play blocked:', voiceId, error);
        if (activeAudio === audio) {
          activeAudio = null;
          activeId = '';
        }
        resolve(false);
      });
    });
  }

  async function preload(voiceIds = []) {
    const ids = Array.isArray(voiceIds) ? voiceIds : [];
    const data = await loadManifest(false);
    ids.forEach((id) => {
      const src = normalizePath(getNestedValue(data, id));
      if (!src) return;
      const audio = new Audio(src);
      audio.preload = 'auto';
    });
  }

  function setMuted(value) {
    muted = Boolean(value);
    if (muted) stop();
  }

  function isMuted() {
    return muted;
  }

  function getActiveId() {
    return activeId;
  }

  function getStoryVoiceId(storyId, paragraphIndex) {
    const safeStoryId = String(storyId || '').trim();
    const index = Number(paragraphIndex || 0) + 1;
    return `stories.${safeStoryId}.p${String(index).padStart(3, '0')}`;
  }

  async function playStoryParagraph(storyId, paragraphIndex, options = {}) {
    return play(getStoryVoiceId(storyId, paragraphIndex), options);
  }

  window.SihyeonVoice = {
    loadManifest,
    getVoiceSrc,
    play,
    stop,
    pause,
    resume,
    preload,
    setMuted,
    isMuted,
    getActiveId,
    getStoryVoiceId,
    playStoryParagraph
  };

  window.playVoice = play;
  window.stopVoice = stop;
})();
