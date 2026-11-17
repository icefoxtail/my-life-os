/* Automatic visual counting, using the existing shared voice engine only. */
(function (root) {
  'use strict';

  function language() {
    try { return root.SihyeonPlaySettings?.getLanguage?.() === 'en' ? 'en' : 'ko'; }
    catch (_) { return 'ko'; }
  }

  function milliseconds(value, fallback, maximum) {
    return Number.isFinite(value) && value >= 0 ? Math.min(value, maximum) : fallback;
  }

  function create(configuration) {
    const config = configuration || {};
    const timeoutMs = Math.max(1, milliseconds(config.timeoutMs, 8000, 60000));
    const fallbackMs = milliseconds(config.fallbackMs, 450, 5000);
    let generation = 0;
    let active = null;
    let last = idleSnapshot();

    function idleSnapshot() {
      return { runId: generation, status: 'idle', running: false, stepIndex: -1, completedSteps: 0, totalSteps: 0,
        language: language(), audioAttempted: 0, audioSucceeded: 0, audioFailed: 0, audioTimedOut: 0,
        muted: false, reason: null, errors: [] };
    }

    function snapshot(run) {
      const value = run ? run.state : last;
      return Object.assign({}, value, { errors: value.errors.map(function (error) { return Object.assign({}, error); }) });
    }

    function getVoice() {
      try { return typeof config.voice === 'function' ? config.voice() : config.voice || root.SihyeonVoice; }
      catch (_) { return null; }
    }

    function current(run) {
      return active === run && generation === run.id && (run.state.status === 'running' || run.state.status === 'paused');
    }

    function notify(run) {
      if (typeof run.options.onState === 'function') {
        try { run.options.onState(snapshot(run)); } catch (_) {}
      }
    }

    function ready(run) {
      if (!current(run)) return Promise.resolve(false);
      if (run.state.status !== 'paused') return Promise.resolve(true);
      return new Promise(function (resolve) { run.resumeWaiters.add(resolve); });
    }

    function voiceGeneration(voice) {
      try {
        const value = voice?.debugStatus?.().requestGeneration;
        return Number.isInteger(value) ? value : null;
      } catch (_) { return null; }
    }

    function stopOwnedVoice(run) {
      const voice = run.voice;
      if (!run.voicePending || !voice || typeof voice.stop !== 'function') return;
      const now = voiceGeneration(voice);
      // Do not stop a newer request started by another game or global control.
      if (run.voiceTicket != null && now != null && run.voiceTicket !== now) return;
      try { voice.stop(); } catch (_) {}
      run.voiceTicket = null;
    }

    function clearPending(run) {
      const pending = Array.from(run.pending);
      run.pending.clear();
      pending.forEach(function (cancel) { cancel(); });
    }

    function finish(run, status, reason) {
      if (!current(run)) return;
      run.state.status = status;
      run.state.running = false;
      run.state.reason = reason || null;
      clearPending(run);
      run.resumeWaiters.forEach(function (resolve) { resolve(false); });
      run.resumeWaiters.clear();
      if (run.languageListener && typeof root.removeEventListener === 'function') {
        root.removeEventListener('sihyeon-settings-change', run.languageListener);
      }
      active = null;
      last = snapshot(run);
      const result = snapshot(run);
      notify(run);
      run.resolve(result);
      if (status === 'completed' && typeof run.options.onEnd === 'function') {
        try { run.options.onEnd(result); } catch (_) {}
      }
    }

    function cancel(run, reason, stopVoice) {
      if (!current(run)) return;
      if (stopVoice !== false) stopOwnedVoice(run);
      finish(run, 'cancelled', reason || 'stopped');
    }

    function syncLanguage(run) {
      if (!current(run)) return false;
      const next = language();
      if (next === run.state.language) return true;
      if (run.options.followLanguage !== true) { cancel(run, 'language-changed'); return false; }
      // Opt-in games retain their visual step and any explicit pause. Only the
      // interrupted utterance is retried using the newly selected language.
      stopOwnedVoice(run);
      run.cancelSpeech?.();
      run.state.language = next;
      run.audioTimedOut = false;
      notify(run);
      return true;
    }

    function report(run, code, stepIndex, detail) {
      if (!current(run)) return;
      const step = run.steps[stepIndex];
      const error = { code: code, stepIndex: stepIndex, stepId: step?.id || null, message: detail || code };
      run.state.errors.push(error);
      if (typeof run.options.onError === 'function') {
        try { run.options.onError(Object.assign({}, error)); } catch (_) {}
      }
    }

    function wait(run, duration) {
      if (!current(run)) return Promise.resolve(false);
      return new Promise(function (resolve) {
        let settled = false;
        let timer;
        const complete = function (result) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          run.pending.delete(cancelWait);
          resolve(result);
        };
        const cancelWait = function () { complete(false); };
        run.pending.add(cancelWait);
        timer = setTimeout(function () { complete(current(run)); }, duration);
      });
    }

    async function waitPlaying(run, duration) {
      while (current(run)) {
        if (!current(run)) return false;
        if (run.state.status === 'paused' && !await ready(run)) return false;
        if (await wait(run, duration)) return true;
        // A pause interrupts this small pacing wait, not the visual step.
        if (!current(run)) return false;
      }
      return false;
    }

    function textFor(step, lang) {
      if (lang === 'en') return typeof step.enText === 'string' ? step.enText.trim() : '';
      const selected = step.readingStyle === 'sino' ? step.sinoText : step.nativeText;
      return String(selected == null ? step.text || '' : selected).trim();
    }

    function speakStep(run, text) {
      if (!current(run)) return Promise.resolve({ kind: 'cancelled' });
      const voice = getVoice();
      if (!voice || typeof voice.speak !== 'function') return Promise.resolve({ kind: 'unavailable' });
      const speechLanguage = run.state.language;
      run.voice = voice;
      run.voicePending = true;
      run.state.audioAttempted += 1;
      return new Promise(function (resolve) {
        let settled = false;
        let timer;
        const complete = function (result) {
          if (settled) return;
          settled = true;
          run.voicePending = false;
          run.cancelSpeech = null;
          clearTimeout(timer);
          run.pending.delete(cancelSpeech);
          resolve(result);
        };
        const cancelSpeech = function () { complete({ kind: 'cancelled' }); };
        run.cancelSpeech = cancelSpeech;
        run.pending.add(cancelSpeech);
        timer = setTimeout(function () {
          if (!current(run)) { complete({ kind: 'cancelled' }); return; }
          const now = voiceGeneration(voice);
          if (run.voiceTicket != null && now != null && run.voiceTicket !== now) {
            complete({ kind: 'interrupted' });
            return;
          }
          stopOwnedVoice(run);
          complete({ kind: 'timeout' });
        }, timeoutMs);
        try {
          const promise = voice.speak(text, {
            lang: speechLanguage === 'en' ? 'en-US' : 'ko-KR',
            rate: 0.9,
            shouldPlay: function () { return !settled && current(run) && run.state.running && !run.state.muted && run.state.language === speechLanguage && language() === speechLanguage; }
          });
          run.voiceTicket = voiceGeneration(voice);
          Promise.resolve(promise).then(function (ok) {
            if (!current(run)) { complete({ kind: 'cancelled' }); return; }
            const now = voiceGeneration(voice);
            if (run.voiceTicket != null && now != null && run.voiceTicket !== now) {
              complete({ kind: 'interrupted' });
              return;
            }
            complete({ kind: ok === true ? 'success' : 'unavailable' });
          }, function () { complete({ kind: current(run) ? 'unavailable' : 'cancelled' }); });
        } catch (_) { complete({ kind: 'unavailable' }); }
      });
    }

    async function execute(run) {
      for (let index = 0; index < run.steps.length; index += 1) {
        if (!current(run)) return;
        if (run.state.status === 'paused' && !await ready(run)) return;
        if (!syncLanguage(run)) return;
        const step = run.steps[index];
        run.state.stepIndex = index;
        if (typeof run.options.onStep === 'function') {
          try { run.options.onStep(step, index); }
          catch (_) {
            report(run, 'STEP_CALLBACK_FAILED', index, 'The visual step could not be updated.');
            if (current(run)) { stopOwnedVoice(run); finish(run, 'error', 'step-callback-failed'); }
            return;
          }
        }
        if (!current(run)) return;
        while (current(run)) {
          if (run.state.status === 'paused' && !await ready(run)) return;
          if (!syncLanguage(run)) return;
          if (run.state.muted) {
            if (!await waitPlaying(run, fallbackMs)) return;
            break;
          }
          const speechLanguage = run.state.language;
          const text = textFor(step, speechLanguage);
          // One stalled engine must not make a 30-object run wait for 30 timeouts.
          // A new selection or replay creates a fresh run and tries audio again.
          const result = run.audioTimedOut ? { kind: 'after-timeout' }
            : text ? await speakStep(run, text) : { kind: 'missing-text' };
          if (!current(run)) return;
          if (!syncLanguage(run)) return;
          if (run.state.language !== speechLanguage) continue;
          if (result.kind === 'interrupted') { cancel(run, 'voice-interrupted', false); return; }
          // Pause/resume and mute/unmute may happen in the same event turn.
          // Cancellation of a still-current speech request always retries here.
          if (result.kind === 'cancelled') continue;
          if (result.kind === 'success') run.state.audioSucceeded += 1;
          else {
            run.state.audioFailed += 1;
            if (result.kind === 'timeout') { run.state.audioTimedOut += 1; run.audioTimedOut = true; }
            report(run, result.kind === 'timeout' ? 'AUDIO_TIMEOUT' : result.kind === 'after-timeout' ? 'AUDIO_SKIPPED_AFTER_TIMEOUT'
              : result.kind === 'missing-text' ? 'AUDIO_TEXT_MISSING' : 'AUDIO_UNAVAILABLE', index);
            if (!await waitPlaying(run, fallbackMs)) return;
          }
          break;
        }
        if (!current(run)) return;
        run.state.completedSteps = index + 1;
        notify(run);
        if (index + 1 < run.steps.length && !await waitPlaying(run, run.delayMs)) return;
      }
      if (current(run)) finish(run, 'completed');
    }

    function stop() {
      if (active) cancel(active, 'stopped');
    }

    function pause() {
      const run = active;
      if (!run || !run.state.running) return false;
      stopOwnedVoice(run);
      run.state.status = 'paused'; run.state.running = false;
      clearPending(run); notify(run);
      return true;
    }

    function resume() {
      const run = active;
      if (!run || run.state.status !== 'paused') return false;
      if (!syncLanguage(run)) return false;
      run.state.status = 'running'; run.state.running = true;
      const waiters = Array.from(run.resumeWaiters); run.resumeWaiters.clear();
      waiters.forEach(function (resolve) { resolve(true); }); notify(run);
      return true;
    }

    function setMuted(value) {
      const run = active;
      if (!run) { last.muted = value === true; return; }
      run.state.muted = value === true;
      if (run.state.muted) { stopOwnedVoice(run); run.cancelSpeech?.(); }
      notify(run);
    }

    function start(steps, options) {
      if (!Array.isArray(steps) || steps.some(function (step) { return !step || typeof step !== 'object' || Array.isArray(step); })) {
        throw new TypeError('Counting steps must be an array of step objects.');
      }
      if (active) cancel(active, 'replaced');
      generation += 1;
      options = options || {};
      const state = Object.assign(idleSnapshot(), {
        runId: generation, status: options.paused === true ? 'paused' : 'running', running: options.paused !== true, totalSteps: steps.length,
        muted: options.muted === true
      });
      let resolver;
      const result = new Promise(function (resolve) { resolver = resolve; });
      const run = { id: generation, state: state, steps: steps.map(function (step) { return Object.assign({}, step); }),
        options: options, delayMs: milliseconds(options.delayMs, 100, 5000), pending: new Set(),
        voice: null, voiceTicket: null, voicePending: false, cancelSpeech: null, resumeWaiters: new Set(), audioTimedOut: false, resolve: resolver, languageListener: null };
      active = run;
      if (typeof root.addEventListener === 'function') {
        run.languageListener = function () {
          syncLanguage(run);
        };
        root.addEventListener('sihyeon-settings-change', run.languageListener);
      }
      execute(run).catch(function () {
        if (!current(run)) return;
        report(run, 'SEQUENCE_FAILED', run.state.stepIndex);
        stopOwnedVoice(run);
        finish(run, 'error', 'sequence-failed');
      });
      notify(run);
      return result;
    }

    return Object.freeze({
      start: start, stop: stop, pause: pause, resume: resume, setMuted: setMuted,
      isRunning: function () { return Boolean(active?.state.running); },
      isPaused: function () { return active?.state.status === 'paused'; },
      getSnapshot: function () { return snapshot(active); }
    });
  }

  const API = Object.freeze({ create: create });
  root.SihyeonQuantitySequencer = API;
  if (typeof module === 'object' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
