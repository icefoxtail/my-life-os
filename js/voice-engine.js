(function () {
  'use strict';

  var MANIFEST_URL = './assets/voice/voice_manifest.json';

  var DEFAULT_TTS = {
    lang: 'ko-KR',
    rate: 0.92,
    pitch: 1.08,
    volume: 1
  };

  var EMPTY_MANIFEST = {
    version: 'missing',
    format: 'mp3',
    basePath: './assets/voice/games/',
    voices: {}
  };

  var ID_ALIASES = {
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

  var previous = window.SihyeonVoice || {};

  var manifest = null;
  var manifestPromise = null;
  var currentAudio = null;
  var currentAudioResolve = null;
  var unlocked = false;
  var unlockBound = false;

  function warn(message, detail) {
    try {
      if (detail) console.warn('[SihyeonVoice] ' + message, detail);
      else console.warn('[SihyeonVoice] ' + message);
    } catch (error) {}
  }

  function normalizeId(id) {
    var key = String(id || '').trim();
    return ID_ALIASES[key] || key;
  }

  function hasVoices(data) {
    return Boolean(
      data &&
      data.voices &&
      typeof data.voices === 'object' &&
      Object.keys(data.voices).length > 0
    );
  }

  function normalizeManifest(data) {
    var source = data && typeof data === 'object' ? data : {};

    return {
      version: source.version || 'unknown',
      format: source.format || 'mp3',
      basePath: source.basePath || './assets/voice/games/',
      voices: source.voices && typeof source.voices === 'object' ? source.voices : {}
    };
  }

  function cloneEmptyManifest() {
    return {
      version: EMPTY_MANIFEST.version,
      format: EMPTY_MANIFEST.format,
      basePath: EMPTY_MANIFEST.basePath,
      voices: {}
    };
  }

  function buildManifestUrl() {
    var separator = MANIFEST_URL.indexOf('?') >= 0 ? '&' : '?';
    return MANIFEST_URL + separator + 'v=' + Date.now();
  }

  function fetchManifest() {
    return fetch(buildManifestUrl(), { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('manifest status ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        return normalizeManifest(data);
      });
  }

  function loadManifest(options) {
    var force = Boolean(options && options.force);

    if (!force && hasVoices(manifest)) {
      return Promise.resolve(manifest);
    }

    if (!force && manifestPromise) {
      return manifestPromise;
    }

    manifestPromise = fetchManifest()
      .then(function (data) {
        manifest = data;
        return manifest;
      })
      .catch(function (error) {
        warn('manifest load failed', error);

        if (hasVoices(manifest)) {
          return manifest;
        }

        manifest = cloneEmptyManifest();
        return manifest;
      })
      .finally(function () {
        manifestPromise = null;
      });

    return manifestPromise;
  }

  function getManifest() {
    if (hasVoices(manifest)) {
      return Promise.resolve(manifest);
    }

    return loadManifest({ force: true });
  }

  function isReady() {
    return hasVoices(manifest);
  }

  function stopSpeech() {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (error) {}
  }

  function finishCurrentAudio(value) {
    var resolver = currentAudioResolve;
    currentAudioResolve = null;

    if (typeof resolver === 'function') {
      try {
        resolver(value);
      } catch (error) {}
    }
  }

  function stopAudio() {
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.removeAttribute('src');
        currentAudio.load();
      }
    } catch (error) {}

    currentAudio = null;
    finishCurrentAudio(false);
  }

  function stop() {
    stopAudio();
    stopSpeech();
  }

  function speak(text, options) {
    options = options || {};

    return new Promise(function (resolve) {
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
        var utterance = new SpeechSynthesisUtterance(String(text));

        utterance.lang = options.lang || DEFAULT_TTS.lang;
        utterance.rate = Number(options.rate || DEFAULT_TTS.rate);
        utterance.pitch = Number(options.pitch || DEFAULT_TTS.pitch);
        utterance.volume = Number(options.volume || DEFAULT_TTS.volume);

        utterance.onend = function () {
          resolve(true);
        };

        utterance.onerror = function () {
          resolve(false);
        };

        window.speechSynthesis.speak(utterance);
      } catch (error) {
        resolve(false);
      }
    });
  }

  function resolveVoiceSrc(data, id) {
    var voices = data && data.voices ? data.voices : {};
    var src = voices[id] || '';

    if (!src) return '';

    if (
      src.indexOf('./') === 0 ||
      src.indexOf('/') === 0 ||
      src.indexOf('http://') === 0 ||
      src.indexOf('https://') === 0 ||
      src.indexOf('data:') === 0 ||
      src.indexOf('blob:') === 0
    ) {
      return src;
    }

    var basePath = data && data.basePath ? String(data.basePath) : './assets/voice/games/';
    if (basePath.charAt(basePath.length - 1) !== '/') {
      basePath += '/';
    }

    return basePath + src;
  }

  function playAudio(src, options) {
    options = options || {};

    return new Promise(function (resolve) {
      if (!src) {
        resolve(false);
        return;
      }

      stop();

      try {
        var audio = new Audio(src);
        currentAudio = audio;
        currentAudioResolve = resolve;

        audio.preload = 'auto';
        audio.playsInline = true;
        audio.volume = Math.max(0, Math.min(1, Number(options.volume == null ? 1 : options.volume)));

        audio.onended = function () {
          if (currentAudio === audio) {
            currentAudio = null;
            finishCurrentAudio(true);
          }
        };

        audio.onerror = function () {
          if (currentAudio === audio) {
            currentAudio = null;
            finishCurrentAudio(false);
          }
        };

        var result = audio.play();

        if (result && typeof result.then === 'function') {
          result.catch(function () {
            if (currentAudio === audio) {
              currentAudio = null;
              finishCurrentAudio(false);
            }
          });
        }
      } catch (error) {
        currentAudio = null;
        finishCurrentAudio(false);
      }
    });
  }

  function play(id, fallbackText, options) {
    options = options || {};
    fallbackText = fallbackText || '';

    var voiceId = normalizeId(id);

    if (!voiceId) {
      return speak(fallbackText, options);
    }

    return loadManifest()
      .then(function (data) {
        var src = resolveVoiceSrc(data, voiceId);

        if (!src) {
          return speak(fallbackText, options);
        }

        return playAudio(src, options).then(function (ok) {
          if (ok) return true;
          return speak(fallbackText, options);
        });
      })
      .catch(function () {
        return speak(fallbackText, options);
      });
  }

  function playSequence(items, options) {
    options = options || {};
    var list = Array.isArray(items) ? items : [];

    var chain = Promise.resolve(true);

    list.forEach(function (item) {
      chain = chain.then(function () {
        if (Array.isArray(item)) {
          return play(item[0], item[1] || '', options);
        }

        if (item && typeof item === 'object') {
          return play(item.id, item.text || item.fallbackText || '', Object.assign({}, options, item.options || {}));
        }

        return true;
      });
    });

    return chain.then(function () {
      return true;
    });
  }

  function unlock() {
    unlocked = true;
    return Promise.resolve(true);
  }

  function bindUnlock() {
    if (unlockBound) return;
    unlockBound = true;

    var handler = function () {
      unlock();

      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('touchstart', handler);
      window.removeEventListener('click', handler);
    };

    window.addEventListener('pointerdown', handler, { once: true, passive: true });
    window.addEventListener('touchstart', handler, { once: true, passive: true });
    window.addEventListener('click', handler, { once: true, passive: true });
  }

  function debugStatus() {
    return {
      ready: isReady(),
      unlocked: unlocked,
      manifestVoices: manifest && manifest.voices ? Object.keys(manifest.voices).length : 0,
      hasCurrentAudio: Boolean(currentAudio)
    };
  }

  bindUnlock();

  window.SihyeonVoice = Object.assign({}, previous, {
    play: play,
    speak: speak,
    stop: stop,
    unlock: unlock,
    isReady: isReady,
    getManifest: getManifest,
    playSequence: playSequence,
    loadManifest: loadManifest,
    debugStatus: debugStatus
  });

  loadManifest({ force: true }).catch(function () {});
})();