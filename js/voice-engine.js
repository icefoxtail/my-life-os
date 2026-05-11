(function () {
  'use strict';

  const MANIFEST_URL = './assets/voice/voice_manifest.json';
  const DEFAULT_TTS = {
    lang: 'ko-KR',
    rate: 0.92,
    pitch: 1.08,
    volume: 1
  };
  const ID_ALIASES = {
    'games.memory.match': 'games.memory.correct',
    'games.memory.no_match': 'games.memory.wrong',
    'games.color.question': 'games.color.intro',
    'games.letter.question': 'games.letter.findLetter',
    'games.letter.intro': 'games.letter.findLetter',
    'games.letter.complete': 'games.letter.completeLetters',
    'games.life.intro': 'games.sequence.handIntro',
    'games.common.wrong': 'games.sequence.wrong',
    'games.common.correct': 'games.construction.correct',
    'games.common.complete': 'games.sequence.complete'
  };

  const previous = window.SihyeonVoice || {};
  let manifest = null;
  let manifestPromise = null;
  let currentAudio = null;
  let unlocked = false;
  let unlockPromise = null;

  function warn(message, detail) {
    if (detail) console.warn('[SihyeonVoice] ' + message, detail);
    else console.warn('[SihyeonVoice] ' + message);
  }

  function normalizeId(id) {
    const key = String(id || '').trim();
    return ID_ALIASES[key] || key;
  }

  function stopSpeech() {
    try {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } catch (error) {}
  }

  function stop() {
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.removeAttribute('src');
        currentAudio.load();
      }
    } catch (error) {}
    currentAudio = null;
    stopSpeech();
  }

  function loadManifest() {
    if (manifest) return Promise.resolve(manifest);
    if (manifestPromise) return manifestPromise;

    manifestPromise = fetch(MANIFEST_URL, { cache: 'force-cache' })
      .then((response) => {
        if (!response.ok) throw new Error('manifest status ' + response.status);
        return response.json();
      })
      .then((data) => {
        manifest = data || {};
        manifest.voices = manifest.voices || {};
        return manifest;
      })
      .catch((error) => {
        warn('manifest load failed', error);
        manifest = { version: 'missing', format: 'mp3', basePath: './assets/voice/games/', voices: {} };
        return manifest;
      });

    return manifestPromise;
  }

  function getManifest() {
    return manifest;
  }

  function isReady() {
    return Boolean(manifest && manifest.voices);
  }

  function speak(text, options = {}) {
    return new Promise((resolve) => {
      if (!text) {
        resolve(false);
        return;
      }

      stop();
      if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
        resolve(false);
        return;
      }

      try {
        const utterance = new SpeechSynthesisUtterance(String(text));
        utterance.lang = options.lang || DEFAULT_TTS.lang;
        utterance.rate = Number(options.rate || DEFAULT_TTS.rate);
        utterance.pitch = Number(options.pitch || DEFAULT_TTS.pitch);
        utterance.volume = Number(options.volume || DEFAULT_TTS.volume);
        utterance.onend = () => resolve(true);
        utterance.onerror = () => resolve(false);
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        resolve(false);
      }
    });
  }

  function resolveVoiceSrc(data, id) {
    const voices = data && data.voices ? data.voices : {};
    return voices[id] || '';
  }

  function playAudio(src, options = {}) {
    return new Promise((resolve) => {
      try {
        const audio = new Audio(src);
        currentAudio = audio;
        audio.preload = 'auto';
        audio.volume = Math.max(0, Math.min(1, Number(options.volume ?? 1)));
        audio.onended = () => {
          if (currentAudio === audio) currentAudio = null;
          resolve(true);
        };
        audio.onerror = () => {
          if (currentAudio === audio) currentAudio = null;
          resolve(false);
        };
        audio.play().catch(() => {
          if (currentAudio === audio) currentAudio = null;
          resolve(false);
        });
      } catch (error) {
        resolve(false);
      }
    });
  }

  async function play(id, fallbackText = '', options = {}) {
    const voiceId = normalizeId(id);
    if (!voiceId) return speak(fallbackText, options);

    stop();
    try {
      const data = await loadManifest();
      const src = resolveVoiceSrc(data, voiceId);
      if (!src) return speak(fallbackText, options);

      const ok = await playAudio(src, options);
      if (ok) return true;
      return speak(fallbackText, options);
    } catch (error) {
      return speak(fallbackText, options);
    }
  }

  async function playSequence(items = [], options = {}) {
    const list = Array.isArray(items) ? items : [];
    for (const item of list) {
      if (Array.isArray(item)) {
        await play(item[0], item[1] || '', options);
      } else if (item && typeof item === 'object') {
        await play(item.id, item.text || item.fallbackText || '', { ...options, ...item.options });
      }
    }
    return true;
  }

  function unlock() {
    if (unlocked) return Promise.resolve(true);
    if (unlockPromise) return unlockPromise;

    unlockPromise = new Promise((resolve) => {
      try {
        const audio = new Audio();
        audio.muted = true;
        audio.playsInline = true;
        const result = audio.play();
        if (result && typeof result.then === 'function') {
          result.then(() => {
            audio.pause();
            unlocked = true;
            resolve(true);
          }).catch(() => {
            unlocked = true;
            resolve(false);
          });
        } else {
          unlocked = true;
          resolve(true);
        }
      } catch (error) {
        unlocked = true;
        resolve(false);
      }
    });

    return unlockPromise;
  }

  function bindUnlock() {
    const handler = () => {
      unlock();
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('touchstart', handler);
      window.removeEventListener('click', handler);
    };
    window.addEventListener('pointerdown', handler, { once: true, passive: true });
    window.addEventListener('touchstart', handler, { once: true, passive: true });
    window.addEventListener('click', handler, { once: true, passive: true });
  }

  bindUnlock();
  loadManifest();

  window.SihyeonVoice = {
    ...previous,
    play,
    speak,
    stop,
    unlock,
    isReady,
    getManifest,
    playSequence,
    loadManifest
  };
})();
