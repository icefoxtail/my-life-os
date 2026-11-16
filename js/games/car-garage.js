/**
 * 시현이 놀이터 — 자동차 정비소
 * A repair changes the vehicle itself. Completed, decorated cars can be kept
 * and driven again; the workshop and saved cars never share mutable arrays.
 */
(function () {
  const GAME_KEY = 'carGarage';
  const STYLE_ID = 'sihyeon-car-garage-style';
  const GARAGE_KEY = 'sihyeon_car_garage_v1';
  const MAX_CARS = 24;
  const VEHICLE_META = {
    fire: { name: '소방차', emoji: '🚒', color: '#ef5350', tasks: ['wheel', 'wash', 'siren'] },
    police: { name: '경찰차', emoji: '🚓', color: '#438ce8', tasks: ['wheel', 'light', 'siren'] },
    bus: { name: '버스', emoji: '🚌', color: '#ffc94d', tasks: ['wheel', 'light', 'wash'] },
    ambulance: { name: '구급차', emoji: '🚑', color: '#f7fcff', tasks: ['wheel', 'light', 'gas'] },
    rocket: { name: '로켓카', emoji: '🚀', color: '#9c7bef', tasks: ['wheel', 'gas', 'light'] }
  };
  const TASK_ICONS = { wheel: '⚙️', light: '💡', wash: '🧼', gas: '⛽', siren: '🚨' };
  const TASK_LABELS = { wheel: '바퀴', light: '불빛', wash: '세차', gas: '연료', siren: '사이렌' };
  const TASK_MESSAGES = {
    wheel: '새 바퀴가 튼튼하게 굴러가요!',
    light: '앞을 비추는 불이 켜졌어요!',
    wash: '먼지가 씻겨 나갔어요!',
    gas: '연료가 가득 찼어요!',
    siren: '사이렌 불빛이 켜졌어요!'
  };
  const DECORATIONS = ['🕶️', '👑', '🎀', '💎', '🔥', '🍀'];
  const DECO_LABELS = ['선글라스', '왕관', '리본', '보석', '불꽃', '네잎클로버'];
  const DECO_SLOTS = [{ x: 172, y: 187 }, { x: 220, y: 187 }, { x: 268, y: 187 },
    { x: 172, y: 218 }, { x: 220, y: 218 }, { x: 268, y: 218 }];
  const STOPS = [{ name: '공원', icon: '🌳', x: 6 }, { name: '가게', icon: '🏡', x: 35 },
    { name: '차고', icon: '🏠', x: 66 }];
  let memoryGarage = null;
  let recordSequence = 0;
  const state = {
    container: null, options: {}, currentVehicle: null, phase: 'arrival',
    completedTasks: [], decorations: [], collection: [], savedCurrentId: null,
    audioCtx: null, destroyed: true, locked: false, layoutMode: 'portrait',
    resizeTimer: null, handleResizeBound: null, timers: [], epoch: 0, renderToken: 0,
    successRewardGiven: false, completeRewardGiven: false, skipNextSpeak: false,
    viewBefore: false, message: '', memoryOnly: false, storageBlocked: false, storageNotice: '',
    workshop: null, confirmDeleteId: null, deletedCar: null,
    driveVisited: [], driveX: 6, driveMoving: false
  };

  function isLandscapeMode() {
    const width = window.innerWidth || document.documentElement.clientWidth || 0;
    const height = window.innerHeight || document.documentElement.clientHeight || 0;
    return width >= 560 && width > height;
  }
  function getLayoutMode() { return isLandscapeMode() ? 'landscape' : 'portrait'; }
  function getRootClass() {
    state.layoutMode = getLayoutMode();
    return 'cg-root car-garage-root car-garage-' + state.layoutMode + ' cg-phase-' + state.phase;
  }
  function applyRootLayoutClass() {
    const root = state.container && state.container.querySelector('.cg-root');
    if (root) root.className = getRootClass();
  }
  function bindLayoutEvents() {
    if (state.handleResizeBound) return;
    state.handleResizeBound = handleResize;
    window.addEventListener('resize', state.handleResizeBound, { passive: true });
    window.addEventListener('orientationchange', state.handleResizeBound, { passive: true });
  }
  function unbindLayoutEvents() {
    if (!state.handleResizeBound) return;
    window.removeEventListener('resize', state.handleResizeBound);
    window.removeEventListener('orientationchange', state.handleResizeBound);
    state.handleResizeBound = null;
  }
  function handleResize() {
    if (state.destroyed || !state.container) return;
    if (state.resizeTimer) window.clearTimeout(state.resizeTimer);
    const epoch = state.epoch;
    state.resizeTimer = window.setTimeout(function () {
      state.resizeTimer = null;
      if (!state.destroyed && epoch === state.epoch) applyRootLayoutClass();
    }, 120);
  }
  function setManagedTimeout(fn, delay) {
    const epoch = state.epoch;
    const id = window.setTimeout(function () {
      state.timers = state.timers.filter(function (timer) { return timer !== id; });
      if (!state.destroyed && epoch === state.epoch) fn();
    }, delay);
    state.timers.push(id);
    return id;
  }
  function clearTimers() {
    state.epoch++;
    state.timers.forEach(function (id) { window.clearTimeout(id); });
    state.timers = [];
    if (state.resizeTimer) window.clearTimeout(state.resizeTimer);
    state.resizeTimer = null;
  }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function escapeText(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function cleanCar(raw) {
    if (!raw || !Object.keys(VEHICLE_META).includes(raw.vehicleId) || typeof raw.id !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,80}$/.test(raw.id)) return null;
    return {
      id: raw.id, vehicleId: raw.vehicleId,
      savedAt: Number.isFinite(raw.savedAt) ? raw.savedAt : 0,
      decorations: (Array.isArray(raw.decorations) ? raw.decorations : []).slice(0, DECO_SLOTS.length)
        .filter(function (d) { return d && DECORATIONS.includes(d.emoji) &&
          Number.isFinite(d.x) && Number.isFinite(d.y); })
        .map(function (d) { return { emoji: d.emoji,
          x: Math.min(300, Math.max(145, d.x)), y: Math.min(230, Math.max(170, d.y)) }; })
    };
  }
  function loadGarage() {
    state.memoryOnly = false;
    state.storageBlocked = false;
    state.storageNotice = '';
    if (memoryGarage) {
      state.collection = copy(memoryGarage.cars);
      state.memoryOnly = memoryGarage.memoryOnly;
      state.storageBlocked = !!memoryGarage.writeBlocked;
      return;
    }
    try {
      const raw = JSON.parse(localStorage.getItem(GARAGE_KEY) || 'null');
      if (raw !== null && (raw.version !== 1 || !Array.isArray(raw.cars))) throw new Error('Unrecognized garage save');
      const seen = new Set();
      const input = raw ? raw.cars : [];
      state.collection = input
        .map(cleanCar).filter(function (car) {
          if (!car || seen.has(car.id)) return false;
          seen.add(car.id); return true;
        });
      if (state.collection.length !== input.length) {
        state.storageBlocked = true; state.memoryOnly = true;
      }
    } catch (_) { state.collection = []; state.memoryOnly = true; state.storageBlocked = true; }
    memoryGarage = { cars: copy(state.collection), memoryOnly: state.memoryOnly, writeBlocked: state.storageBlocked };
  }
  function persistGarage() {
    // setItem is atomic: a quota/permission failure keeps the previous durable
    // save intact. Keep the full new collection in this tab for continued play.
    const cars = copy(state.collection);
    let durable = false;
    try {
      if (!state.storageBlocked) {
        localStorage.setItem(GARAGE_KEY, JSON.stringify({ version: 1, cars: cars }));
        durable = true;
      }
    } catch (_) { /* The visible memory-only notice is rendered below. */ }
    state.memoryOnly = !durable;
    memoryGarage = { cars: cars, memoryOnly: !durable, writeBlocked: state.storageBlocked };
    return durable;
  }
  function completedCar() {
    if (!state.currentVehicle || !state.currentVehicle.tasks.every(function (task) {
      return state.completedTasks.includes(task);
    })) return null;
    return {
      id: state.savedCurrentId || 'car-' + Date.now().toString(36) + '-' + (++recordSequence).toString(36),
      vehicleId: state.currentVehicle.id, decorations: copy(state.decorations), savedAt: Date.now()
    };
  }
  function saveCompletedVehicle() {
    const car = completedCar();
    if (!car) return false;
    if (state.savedCurrentId && state.collection.some(function (c) { return c.id === state.savedCurrentId; })) return true;
    if (state.collection.length >= MAX_CARS) {
      state.storageNotice = '차고가 가득해요. 한 대를 보내면 보관할 수 있어요.';
      return false;
    }
    state.collection.unshift(car);
    state.savedCurrentId = car.id;
    state.storageNotice = '';
    persistGarage();
    return true;
  }
  function storageText() {
    if (state.storageNotice) return state.storageNotice;
    return state.memoryOnly ? '이번 놀이 동안 보관 중이에요. 창을 닫으면 새 차가 사라질 수 있어요.' : '';
  }
  function snapshotWorkshop() {
    return { vehicleId: state.currentVehicle.id, phase: state.phase,
      completedTasks: copy(state.completedTasks), decorations: copy(state.decorations),
      savedCurrentId: state.savedCurrentId, completeRewardGiven: state.completeRewardGiven,
      successRewardGiven: state.successRewardGiven, viewBefore: state.viewBefore, message: state.message };
  }
  function openGarage() {
    if (state.destroyed || state.locked || state.driveMoving) return;
    if (!state.workshop) state.workshop = snapshotWorkshop();
    clearTimers(); state.phase = 'garage'; state.confirmDeleteId = null; renderUI();
  }
  function returnToWorkshop() {
    if (state.destroyed || !state.workshop) return;
    clearTimers();
    const work = state.workshop;
    state.currentVehicle = Object.assign({ id: work.vehicleId }, VEHICLE_META[work.vehicleId]);
    ['phase', 'completedTasks', 'decorations', 'savedCurrentId', 'completeRewardGiven',
      'successRewardGiven', 'viewBefore', 'message'].forEach(function (key) { state[key] = copy(work[key]); });
    state.workshop = null; state.locked = false; state.driveMoving = false;
    state.confirmDeleteId = null;
    if (state.phase === 'photo' && !state.savedCurrentId) saveCompletedVehicle();
    renderUI();
  }
  function deleteSavedCar(id) {
    if (state.phase !== 'garage' || state.confirmDeleteId !== id) return false;
    const index = state.collection.findIndex(function (car) { return car.id === id; });
    if (index < 0) return false;
    state.deletedCar = { car: copy(state.collection[index]), index: index };
    state.collection.splice(index, 1);
    state.confirmDeleteId = null;
    state.storageNotice = '';
    persistGarage(); renderUI(); return true;
  }
  function undoDelete() {
    if (!state.deletedCar || state.phase !== 'garage' || state.collection.length >= MAX_CARS) return;
    if (!state.collection.some(function (car) { return car.id === state.deletedCar.car.id; })) {
      state.collection.splice(state.deletedCar.index, 0, copy(state.deletedCar.car));
    }
    state.deletedCar = null; persistGarage(); renderUI();
  }

  function repairState(vehicle, completed) {
    const out = {};
    Object.keys(TASK_ICONS).forEach(function (task) {
      out[task] = !vehicle.tasks.includes(task) || completed.includes(task);
    });
    return out;
  }
  function vehicleSVG(vehicle, completed, decorations) {
    const ready = repairState(vehicle, completed);
    const isBus = vehicle.id === 'bus', isRocket = vehicle.id === 'rocket';
    const emergency = ['fire', 'police', 'ambulance'].includes(vehicle.id);
    const body = isBus
      ? '<path d="M82 119Q82 92 110 92H393Q423 92 436 121L455 160V231H76V155Z" fill="' + vehicle.color + '"/>'
      : isRocket
        ? '<path d="M85 213L111 148H162L195 101Q236 62 280 101L319 148H397L444 211V235H79Z" fill="' + vehicle.color + '"/>'
        : '<path d="M76 151Q76 137 93 137H291L326 99Q337 87 354 89L405 100Q417 103 423 118L455 170V231H76Z" fill="' + vehicle.color + '"/>';
    const windows = isBus
      ? [107, 172, 237, 302, 367].map(function (x) { return '<rect x="' + x + '" y="107" width="51" height="49" rx="9" fill="#b6e8ff"/>'; }).join('')
      : isRocket
        ? '<path d="M191 140L211 108Q237 86 264 108L284 140Z" fill="#b6e8ff"/>'
        : '<path d="M313 141L342 107H392L410 149H313Z" fill="#b6e8ff"/>';
    let identity = '';
    if (vehicle.id === 'fire') identity = '<rect x="103" y="113" width="184" height="15" rx="6" fill="#eee8cf"/><path d="M124 113V128M150 113V128M176 113V128M202 113V128M228 113V128M254 113V128" stroke="#597684" stroke-width="5"/><circle cx="365" cy="189" r="22" fill="#fff5d9"/><path d="M359 178Q344 196 360 202Q378 207 377 190L370 195Q370 183 359 178" fill="#ff9b41" stroke="none"/>';
    if (vehicle.id === 'police') identity = '<path d="M78 164H450V205H78Z" fill="#edf7ff"/><path d="M353 171L370 176V189Q367 202 353 208Q339 202 336 189V176Z" fill="#ffd35c"/><path d="M353 178L357 187H366L359 193L362 202L353 197L345 202L348 193L341 187H350Z" fill="#4288dc" stroke="none"/>';
    if (vehicle.id === 'ambulance') identity = '<path d="M78 203H449V218H78Z" fill="#ef6b67"/><path d="M347 167H363V179H375V195H363V207H347V195H335V179H347Z" fill="#ef6b67" stroke="none"/>';
    if (isRocket) identity = '<path d="M98 179L65 204L72 232H97M407 179L459 205L465 233H437" fill="#fa8e99"/><circle cx="358" cy="188" r="23" fill="#fff0bd"/><path d="M358 171L363 182H375L366 190L369 202L358 195L348 202L350 190L341 182H353Z" fill="#ffbd37" stroke="none"/>';
    const light = '<g data-part="light" data-ready="' + ready.light + '"><rect x="431" y="173" width="21" height="24" rx="5" fill="' + (ready.light ? '#fff4a9' : '#647b8c') + '"/>' +
      (ready.light ? '<path d="M462 167L480 157M465 184H487M461 201L480 212" stroke="#edb52f" stroke-width="5"/>' : '<path d="M436 179L447 190M447 179L436 190" stroke="#e0e5e9" stroke-width="3"/>') + '</g>';
    const siren = emergency ? '<g data-part="siren" data-ready="' + ready.siren + '"><path d="M321 88V76Q321 68 332 68H373Q384 68 384 76V88Z" fill="' + (ready.siren ? '#ef7777' : '#87929d') + '"/><path d="M353 69H374Q384 69 384 79V88H353Z" fill="' + (ready.siren ? '#56b2f1' : '#707d8a') + '"/>' +
      (ready.siren ? '<path d="M314 68L305 59M352 60V48M391 67L401 57" stroke="#f6bd45" stroke-width="5"/>' : '<path d="M337 75L366 83" stroke="#dbe4e9" stroke-width="3"/>') + '</g>' : '';
    const wheel = '<g data-part="wheel" data-ready="' + ready.wheel + '">' +
      (ready.wheel ? '<circle cx="145" cy="233" r="32" fill="#34445c"/><circle cx="145" cy="233" r="16" fill="#dbeef7"/><path d="M145 220V246M132 233H158" stroke="#708eaa" stroke-width="4"/>' :
        '<ellipse cx="145" cy="247" rx="35" ry="19" fill="#536278"/><ellipse cx="145" cy="240" rx="15" ry="10" fill="#b6c7d3"/><path d="M128 236L136 247L127 252M161 236L153 247L163 253" stroke="#1e3147" stroke-width="4"/>') +
      '<circle cx="385" cy="233" r="32" fill="#34445c"/><circle cx="385" cy="233" r="16" fill="#dbeef7"/><path d="M385 220V246M372 233H398" stroke="#708eaa" stroke-width="4"/></g>';
    const dirt = '<g data-part="wash" data-ready="' + ready.wash + '">' + (!ready.wash
      ? '<g fill="#a88b66" stroke="none" opacity=".85"><ellipse cx="146" cy="176" rx="28" ry="12"/><ellipse cx="246" cy="211" rx="34" ry="12"/><ellipse cx="332" cy="165" rx="21" ry="11"/><circle cx="205" cy="178" r="9"/><circle cx="301" cy="198" r="7"/><ellipse cx="400" cy="218" rx="19" ry="8"/></g>'
      : vehicle.tasks.includes('wash') ? '<path d="M92 113V133M82 123H102M453 126V146M443 136H463" stroke="#fffaf2" stroke-width="4"/>' : '') + '</g>';
    const fuel = vehicle.tasks.includes('gas') ? '<g data-part="gas" data-ready="' + ready.gas + '"><rect x="101" y="164" width="35" height="48" rx="7" fill="#e8f0f2"/><rect x="108" y="171" width="21" height="32" rx="3" fill="#d2dee3" stroke="none"/><rect x="108" y="' + (ready.gas ? 171 : 197) + '" width="21" height="' + (ready.gas ? 32 : 6) + '" rx="3" fill="' + (ready.gas ? '#46b88b' : '#ee8373') + '" stroke="none"/></g>' : '';
    const decals = decorations.map(function (d) {
      return '<text data-decal="' + escapeText(d.emoji) + '" x="' + d.x + '" y="' + d.y +
        '" text-anchor="middle" dominant-baseline="middle" font-size="27" stroke="none">' + escapeText(d.emoji) + '</text>';
    }).join('');
    return '<svg class="cg-vehicle-svg" viewBox="0 0 520 300" role="img" aria-label="' + vehicle.name + '" data-vehicle="' +
      vehicle.id + '" xmlns="http://www.w3.org/2000/svg"><ellipse cx="264" cy="270" rx="201" ry="16" fill="#3f5c70" opacity=".13"/><g stroke="#415f78" stroke-width="4" stroke-linejoin="round">' +
      siren + body + windows + identity + '<path d="M305 155V223M82 227H448" fill="none" opacity=".5"/>' +
      light + wheel + dirt + fuel + decals + '</g></svg>';
  }

  // Existing sound synthesis and the recorded voice engine are retained.
  function initAudio() {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    try {
      if (!state.audioCtx) state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (state.audioCtx.state === 'suspended') state.audioCtx.resume().catch(function () {});
    } catch (_) {}
  }
  function playComplexSound(type) {
    if (!state.audioCtx) return;
    try {
      const ctx = state.audioCtx, now = ctx.currentTime, osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = type === 'wheel' ? 'square' : 'sine';
      osc.frequency.setValueAtTime(type === 'light' ? 880 : type === 'gas' ? 160 : 440, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(); osc.stop(now + 0.21);
    } catch (_) {}
  }
  function vibrate(value) { if (navigator.vibrate) try { navigator.vibrate(value); } catch (_) {} }
  function speak() { state.skipNextSpeak = false; }
  function playGarageVoice(id) {
    try {
      const result = window.SihyeonVoice && window.SihyeonVoice.play(id, '');
      if (result && typeof result.catch === 'function') result.catch(function () {});
    } catch (_) {}
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style'); style.id = STYLE_ID;
    style.textContent = [
      '.cg-root{height:100%;width:100%;min-width:0;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:8px;padding:8px 10px max(10px,env(safe-area-inset-bottom));box-sizing:border-box;background:linear-gradient(180deg,#e3f4ff,#fff5d4);color:#29485f;font-family:Jua,sans-serif;overflow:hidden;position:relative;user-select:none;touch-action:manipulation}',
      '.cg-root *{box-sizing:border-box}.cg-root button{font:inherit;color:inherit;cursor:pointer;touch-action:manipulation;min-height:44px;min-width:44px}.cg-root button:focus-visible{outline:4px solid #e07723;outline-offset:2px}.cg-root button:disabled{cursor:default}',
      '.cg-info-panel{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:center;padding-left:56px;min-width:0}.cg-info-title{font-size:clamp(20px,4.5vw,28px);line-height:1.1;min-width:0}.cg-info-title small{display:block;font-size:14px;margin-top:4px;font-weight:normal}.cg-progress-row{grid-column:1/-1;display:flex;gap:6px;justify-content:center;margin-left:-56px;min-height:30px}.cg-progress-chip{display:inline-flex;align-items:center;gap:4px;background:#ffffffb8;border:2px solid #fff;border-radius:18px;padding:3px 10px;font-size:14px}.cg-progress-chip.done{background:#d1f5d8}',
      '.cg-nav-btn,.cg-panel-btn,.cg-compare-btn{border:3px solid #fff;border-radius:18px;background:#fff7da;box-shadow:0 3px 0 #c8d6dc;padding:7px 11px;font-size:16px}.cg-nav-btn{background:#c8eeff}.cg-stage{min-width:0;min-height:0;display:flex;flex-direction:column;gap:6px;border:3px solid #ffffffa8;border-radius:25px;background:linear-gradient(#ffffff66 72%,#b1c9c4 72%);overflow:hidden;padding:7px;position:relative}.cg-stage-message{font-size:clamp(17px,4.4vw,24px);text-align:center;min-height:26px;line-height:1.25;margin:0;flex-shrink:0}.cg-comparison{display:flex;gap:7px;justify-content:center;flex-shrink:0}.cg-compare-btn{font-size:14px;background:#f2f7fb;min-height:44px}.cg-compare-btn[aria-pressed=true]{background:#ffe5a3;border-color:#fff5cc}',
      '.cg-car-unit{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center}.cg-car-body{display:flex;width:100%;height:100%;min-height:0;max-width:680px}.cg-vehicle-svg{display:block;width:100%;height:100%;min-height:0;overflow:visible}.cg-toolbox{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;padding:8px;background:#ffffffb8;border:3px solid #fff;border-radius:22px;min-width:0;min-height:0;align-content:center}.cg-tool-btn{border:3px solid #fff;border-radius:18px;background:#f1f5f8;box-shadow:0 3px 0 #c4d1dc;min-width:0;width:100%;min-height:65px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px}.cg-tool-btn span{font-size:28px;line-height:1}.cg-tool-btn small{font-size:13px}.cg-tool-btn.is-target{border-color:#ffbc64;background:#fff0d1;box-shadow:0 3px 0 #d99d4b}.cg-tool-btn.is-done{background:#d4f2df}.cg-tool-btn.is-dimmed{opacity:.45}.cg-tool-btn:active:not(:disabled),.cg-panel-btn:active,.cg-nav-btn:active{transform:translateY(2px)}',
      '.cg-toolbox.tuning{grid-template-columns:1fr;gap:7px}.cg-sticker-list{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px}.cg-sticker-list .cg-tool-btn{min-height:44px;font-size:25px;border-width:2px;border-radius:13px}.cg-tuning-actions,.cg-photo-actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.6fr);gap:7px}.cg-go-btn{min-height:52px;border:3px solid #fff;border-radius:18px;background:#55b88b;color:#fff!important;box-shadow:0 3px 0 #32866a;font-size:18px;padding:7px 12px}.cg-panel-btn{font-size:16px;min-height:48px;background:#ffe6ac}.cg-panel-btn.secondary{background:#d4effa}.cg-panel-btn.danger{background:#ffe0d4}.cg-toolbox.photo{display:block}.cg-photo-actions .cg-go-btn{grid-column:1/-1}.cg-storage-note{font-size:13px;text-align:center;line-height:1.3;margin:4px 0 0;color:#714b34}.cg-bubbles{position:absolute;inset:0;pointer-events:none}.cg-bubble-item{position:absolute;width:28px;height:28px;border-radius:50%;background:#ffffffcf;border:2px solid #b9e8ff;animation:cgBubble .8s ease-out forwards}@keyframes cgBubble{to{transform:translateY(-50px) scale(1.4);opacity:0}}',
      '.cg-gallery{min-height:0;grid-column:1/-1;overflow:auto;touch-action:pan-y;padding:5px 3px 10px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-content:start}.cg-saved-card{background:#fffdf6;border:3px solid #fff;border-radius:20px;padding:7px;display:grid;gap:6px;box-shadow:0 4px 0 #c6d8cf;min-width:0}.cg-saved-picture{height:110px;min-height:0}.cg-saved-card h3{font-size:17px;text-align:center;margin:0}.cg-saved-card .cg-go-btn{font-size:15px;min-height:44px;padding:4px}.cg-saved-card .cg-panel-btn{font-size:13px;min-height:44px;padding:4px}.cg-delete-actions{display:grid;grid-template-columns:1fr 1fr;gap:5px}.cg-empty{grid-column:1/-1;text-align:center;font-size:21px;padding:30px 12px;line-height:1.5}.cg-gallery-footer{grid-column:1/-1;display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap}.cg-gallery-footer .cg-storage-note{flex-basis:100%}.cg-phase-garage{grid-template-rows:auto minmax(0,1fr) auto}.cg-phase-garage .cg-progress-row{margin:0;grid-column:1/-1}',
      '.cg-road{flex:1;min-height:0;position:relative;overflow:hidden;border-radius:18px;background:linear-gradient(#cdeeff 0 45%,#b1dba0 45% 63%,#8399aa 63% 95%,#c0dfa5 95%)}.cg-road:after{content:"";position:absolute;left:0;right:0;top:80%;border-top:4px dashed #fff1c7}.cg-road-stop{position:absolute;top:6%;width:28%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:3px solid #fff;border-radius:19px;background:#ffffe5;z-index:3;min-height:62px!important;font-size:14px}.cg-road-stop span{font-size:26px}.cg-road-stop[data-stop="0"]{left:3%}.cg-road-stop[data-stop="1"]{left:36%}.cg-road-stop[data-stop="2"]{left:69%}.cg-road-stop.visited{background:#dcf6da}.cg-road-stop:disabled{opacity:.78}.cg-drive-car{position:absolute;width:30%;height:46%;bottom:2%;z-index:4;transition:left 850ms ease-in-out}.cg-toolbox.drive{grid-template-columns:1fr 1fr}.cg-phase-drive .cg-stage{background:#ffffff66}.cg-drive-badge{font-size:14px;text-align:center;background:#fff8dc;padding:5px;border-radius:12px}',
      '.car-garage-landscape{grid-template-columns:minmax(0,1fr) minmax(155px,23%);grid-template-rows:auto minmax(0,1fr);gap:7px;padding:7px 9px}.car-garage-landscape .cg-info-panel{grid-column:1/-1;grid-template-columns:minmax(0,1fr) auto;padding-left:52px;gap:3px}.car-garage-landscape .cg-info-title{font-size:22px}.car-garage-landscape .cg-info-title small{display:inline;margin-left:8px;font-size:14px}.car-garage-landscape .cg-progress-row{margin-left:0;grid-column:1;grid-row:2;justify-content:flex-start}.car-garage-landscape .cg-nav-btn{grid-column:2;grid-row:1/3}.car-garage-landscape .cg-stage{grid-column:1;grid-row:2}.car-garage-landscape .cg-toolbox{grid-column:2;grid-row:2;grid-template-columns:repeat(2,minmax(0,1fr));align-content:center;padding:7px;gap:7px}.car-garage-landscape .cg-tool-btn{min-height:62px}.car-garage-landscape .cg-stage-message{font-size:18px}.car-garage-landscape .cg-toolbox.tuning{grid-template-columns:1fr}.car-garage-landscape .cg-sticker-list{grid-template-columns:repeat(3,minmax(0,1fr))}.car-garage-landscape .cg-sticker-list .cg-tool-btn{min-height:44px}.car-garage-landscape .cg-tuning-actions,.car-garage-landscape .cg-photo-actions{grid-template-columns:1fr}.car-garage-landscape .cg-tuning-actions .cg-panel-btn{font-size:14px}.car-garage-landscape .cg-photo-actions .cg-go-btn{grid-column:auto}.car-garage-landscape .cg-toolbox.photo{display:flex;flex-direction:column;justify-content:center}.car-garage-landscape .cg-photo-actions{width:100%}.car-garage-landscape .cg-gallery{grid-row:2;grid-template-columns:repeat(4,minmax(0,1fr))}.car-garage-landscape.cg-phase-garage{grid-template-rows:auto minmax(0,1fr) auto}.car-garage-landscape .cg-saved-picture{height:90px}.car-garage-landscape.cg-phase-drive{grid-template-rows:auto minmax(0,1fr) auto}.car-garage-landscape.cg-phase-drive .cg-stage{grid-column:1/-1;grid-row:2}.car-garage-landscape.cg-phase-drive .cg-toolbox{grid-column:1/-1;grid-row:3;grid-template-columns:1fr 1fr;padding:5px}.car-garage-landscape .cg-road-stop{min-height:52px!important;flex-direction:row;font-size:14px}.car-garage-landscape .cg-road-stop span{font-size:25px}.car-garage-landscape .cg-drive-car{height:61%;width:26%}',
      '@media(max-width:350px){.cg-root{padding:7px;gap:6px}.cg-info-title{font-size:18px}.cg-info-title small{font-size:12px}.cg-nav-btn{font-size:14px;padding:5px 7px}.cg-toolbox{gap:4px;padding:6px}.cg-tool-btn span{font-size:25px}.cg-tool-btn small{font-size:12px}.cg-progress-chip{padding:3px 7px;font-size:13px}.cg-stage-message{font-size:17px}.cg-sticker-list{gap:2px}.cg-tuning-actions{grid-template-columns:1fr 1.3fr}.cg-go-btn{font-size:16px;padding:5px}.cg-saved-picture{height:90px}.cg-saved-card h3{font-size:15px}}',
      '@media(prefers-reduced-motion:reduce){.cg-drive-car{transition:none}.cg-bubble-item{animation:none}}'
    ].join('');
    document.head.appendChild(style);
  }

  function getPhaseText() {
    return { repair: '고치고 싶은 곳부터 눌러요', tuning: '스티커로 꾸며요', photo: '내가 고친 차',
      garage: '다시 타고 싶은 차를 골라요', drive: '가고 싶은 곳을 눌러요' }[state.phase] || '정비소에 왔어요';
  }
  function getProgressHTML() {
    if (state.phase === 'garage') return '<span class="cg-progress-chip">🚗 ' + state.collection.length + '대 보관</span>';
    if (state.phase === 'drive') return '<span class="cg-progress-chip">' + state.driveVisited.length + ' / 3곳 도착</span>';
    return state.currentVehicle.tasks.map(function (task) {
      const done = state.completedTasks.includes(task);
      return '<span class="cg-progress-chip ' + (done ? 'done' : '') + '">' + (done ? '✓' : TASK_ICONS[task]) + ' ' + TASK_LABELS[task] + '</span>';
    }).join('');
  }
  function startVehicle(vehicleId) {
    if (state.destroyed) return;
    clearTimers();
    const keys = Object.keys(VEHICLE_META);
    const key = keys.includes(vehicleId) ? vehicleId : keys[Math.floor(Math.random() * keys.length)];
    state.currentVehicle = Object.assign({ id: key }, VEHICLE_META[key]);
    state.completedTasks = []; state.decorations = []; state.savedCurrentId = null;
    state.phase = 'repair'; state.locked = false; state.workshop = null;
    state.successRewardGiven = false; state.completeRewardGiven = false;
    state.viewBefore = false; state.message = '어디를 고쳐줄까요?'; state.storageNotice = '';
    state.driveMoving = false; state.driveVisited = []; state.confirmDeleteId = null;
    renderUI(); vibrate(40); playGarageVoice('games.car.intro');
  }
  function renderGarageHTML() {
    if (!state.collection.length) return '<div class="cg-empty">🔧<br>차를 고치고 꾸미면<br>여기에 함께 보관해요.</div>';
    return state.collection.map(function (car) {
      const v = Object.assign({ id: car.vehicleId }, VEHICLE_META[car.vehicleId]);
      return '<article class="cg-saved-card" data-car-id="' + car.id + '"><div class="cg-saved-picture">' +
        vehicleSVG(v, v.tasks, car.decorations) + '</div><h3>' + v.name + '</h3>' +
        '<button class="cg-go-btn" data-drive-id="' + car.id + '">🚗 타고 놀기</button>' +
        (state.confirmDeleteId === car.id
          ? '<div class="cg-delete-actions"><button class="cg-panel-btn danger" data-delete-confirm="' + car.id + '">보내요</button><button class="cg-panel-btn secondary" data-delete-cancel>아니요</button></div>'
          : '<button class="cg-panel-btn secondary" data-delete-id="' + car.id + '">차고에서 보내기</button>') + '</article>';
    }).join('');
  }
  function renderUI() {
    if (!state.container || state.destroyed || !state.currentVehicle) return;
    state.renderToken++;
    const v = state.currentVehicle, garage = state.phase === 'garage', drive = state.phase === 'drive';
    const title = garage ? '🏠 내 차고' : drive ? v.emoji + ' 동네 한 바퀴' : v.emoji + ' ' + v.name;
    const notice = storageText();
    let content = '';
    if (garage) {
      content = '<div class="cg-gallery">' + renderGarageHTML() + '</div><div class="cg-gallery-footer">' +
        (state.deletedCar ? '<button class="cg-panel-btn" data-undo-delete>↶ 방금 차 되돌리기</button>' : '') +
        (notice ? '<p class="cg-storage-note" role="status">' + notice + '</p>' : '') + '</div>';
    } else if (drive) {
      const arrived = state.driveVisited.length === STOPS.length;
      content = '<section class="cg-stage"><p class="cg-stage-message" role="status">' + state.message + '</p><div class="cg-road">' +
        STOPS.map(function (stop, i) {
          const visited = state.driveVisited.includes(i);
          return '<button class="cg-road-stop ' + (visited ? 'visited' : '') + '" data-stop="' + i + '" ' +
            (visited || state.driveMoving ? 'disabled' : '') + '><span>' + (visited ? '✓' : stop.icon) + '</span>' + stop.name + '</button>';
        }).join('') + '<div class="cg-drive-car" style="left:' + state.driveX + '%">' +
        vehicleSVG(v, v.tasks, state.decorations) + '</div></div></section><div class="cg-toolbox drive">' +
        '<button class="cg-panel-btn secondary" data-garage ' + (state.driveMoving ? 'disabled' : '') + '>🏠 내 차고</button>' +
        '<button class="cg-go-btn" data-drive-again ' + (!arrived || state.driveMoving ? 'disabled' : '') + '>🔄 한 바퀴 더</button></div>';
    } else {
      let toolbox = '';
      if (state.phase === 'repair') {
        toolbox = Object.keys(TASK_ICONS).map(function (task) {
          const done = state.completedTasks.includes(task), required = v.tasks.includes(task);
          return '<button class="cg-tool-btn ' + (done ? 'is-done' : required ? 'is-target' : 'is-dimmed') +
            '" data-task="' + task + '" aria-label="' + TASK_LABELS[task] + (done ? ' 완료' : '') + '" ' +
            (done || !required || state.locked ? 'disabled' : '') + '><span>' + (done ? '✓' : TASK_ICONS[task]) +
            '</span><small>' + TASK_LABELS[task] + '</small></button>';
        }).join('');
      } else if (state.phase === 'tuning') {
        toolbox = '<div class="cg-sticker-list">' + DECORATIONS.map(function (deco, i) {
          return '<button class="cg-tool-btn" data-deco="' + i + '" aria-label="' + DECO_LABELS[i] + ' 스티커" ' +
            (state.decorations.length >= DECO_SLOTS.length ? 'disabled' : '') + '>' + deco + '</button>';
        }).join('') + '</div><div class="cg-tuning-actions"><button class="cg-panel-btn secondary" data-undo-deco ' +
          (!state.decorations.length ? 'disabled' : '') + '>↶ 한 장 떼기</button><button class="cg-go-btn" id="btnGo">✨ 완성!</button></div>';
      } else {
        toolbox = '<div class="cg-photo-actions"><button class="cg-go-btn" data-drive-current>🚗 내 차로 달리기</button>' +
          '<button class="cg-panel-btn" data-new-car>🔧 또 고칠래</button><button class="cg-panel-btn secondary" data-home>🏡 놀이터</button></div>' +
          '<p class="cg-storage-note" role="status">' + (notice || (state.collection.some(function (car) { return car.id === state.savedCurrentId; }) ? '내 차고에 보관했어요.' : '이 차를 타고 놀 수 있어요.')) + '</p>';
      }
      const shownTasks = state.viewBefore ? [] : state.completedTasks;
      content = '<section class="cg-stage"><p class="cg-stage-message" role="status">' + state.message + '</p>' +
        '<div class="cg-comparison"><button class="cg-compare-btn" data-before="1" aria-pressed="' + state.viewBefore + '">처음 모습</button>' +
        '<button class="cg-compare-btn" data-before="0" aria-pressed="' + !state.viewBefore + '">지금 모습</button></div>' +
        '<div class="cg-car-unit" id="carUnit"><div class="cg-car-body" id="carBody">' +
        vehicleSVG(v, shownTasks, state.viewBefore ? [] : state.decorations) +
        '</div><div class="cg-bubbles" id="bubbleLayer"></div></div></section>' +
        '<div class="cg-toolbox ' + state.phase + '">' + toolbox + '</div>';
    }
    state.container.innerHTML = '<div class="' + getRootClass() + '"><header class="cg-info-panel"><div class="cg-info-title">' +
      title + '<small>' + (state.phase === 'repair' ? '고치고 싶은 곳부터 눌러요' : getPhaseText()) + '</small></div>' +
      '<button class="cg-nav-btn" ' + (garage ? 'data-workshop' : 'data-garage') + ' ' +
      (state.locked || state.driveMoving ? 'disabled' : '') + '>' + (garage ? '↩ 돌아가기' : '🏠 내 차고') +
      '</button><div class="cg-progress-row">' + getProgressHTML() + '</div></header>' + content + '</div>';
    bindEvents();
  }
  function bindEvents() {
    const root = state.container, token = state.renderToken;
    if (!root) return;
    function on(selector, callback) {
      root.querySelectorAll(selector).forEach(function (button) {
        button.addEventListener('click', function () {
          if (state.destroyed || token !== state.renderToken || button.disabled) return;
          callback(button);
        });
      });
    }
    on('[data-task]', function (button) {
      if (state.phase !== 'repair' || state.locked) return;
      const task = button.dataset.task;
      if (state.currentVehicle.tasks.includes(task)) handleRepairSuccess(task);
      else handleRepairWrong();
    });
    on('[data-before]', function (button) {
      if (state.locked) return;
      state.viewBefore = button.dataset.before === '1'; renderUI();
    });
    on('[data-deco]', function (button) { addDecoration(DECORATIONS[Number(button.dataset.deco)]); });
    on('[data-undo-deco]', function () {
      if (state.phase !== 'tuning') return;
      state.decorations.pop(); state.message = '마지막 스티커를 뗐어요.'; renderUI();
    });
    on('#btnGo', startFinale);
    on('[data-garage]', openGarage);
    on('[data-workshop]', returnToWorkshop);
    on('[data-delete-id]', function (button) { state.confirmDeleteId = button.dataset.deleteId; renderUI(); });
    on('[data-delete-cancel]', function () { state.confirmDeleteId = null; renderUI(); });
    on('[data-delete-confirm]', function (button) { deleteSavedCar(button.dataset.deleteConfirm); });
    on('[data-undo-delete]', undoDelete);
    on('[data-drive-id]', function (button) {
      const car = state.collection.find(function (c) { return c.id === button.dataset.driveId; });
      if (car) startDrive(car);
    });
    on('[data-drive-current]', function () { startDrive(completedCar()); });
    on('[data-drive-again]', function () { startDrive(completedCar()); });
    on('[data-stop]', function (button) { driveTo(Number(button.dataset.stop)); });
    on('[data-new-car]', function () { startVehicle(); });
    on('[data-home]', function () { if (state.options.closeToParkHome) state.options.closeToParkHome(); });
  }
  function handleRepairSuccess(task) {
    if (state.destroyed || state.locked || state.phase !== 'repair' || !state.currentVehicle ||
        !state.currentVehicle.tasks.includes(task) || state.completedTasks.includes(task)) return false;
    state.locked = true; state.completedTasks.push(task); state.viewBefore = false;
    state.message = TASK_MESSAGES[task]; renderUI();
    initAudio(); vibrate(45); playComplexSound(task);
    playGarageVoice('games.car.' + (task === 'gas' ? 'fuel' : task));
    if (task === 'wash') showBubbles();
    setManagedTimeout(function () {
      state.locked = false;
      if (state.currentVehicle.tasks.every(function (t) { return state.completedTasks.includes(t); })) {
        state.phase = 'tuning'; state.message = '다 고쳤어요! 스티커로 꾸며볼까요?';
        playGarageVoice('games.car.decorate');
      }
      renderUI();
    }, 650);
    return true;
  }
  function handleRepairWrong() {
    if (state.destroyed || state.phase !== 'repair') return;
    playGarageVoice('games.car.wrong');
  }
  function showBubbles() {
    const layer = state.container && state.container.querySelector('#bubbleLayer');
    if (!layer) return;
    for (let i = 0; i < 12; i++) {
      const bubble = document.createElement('div'); bubble.className = 'cg-bubble-item';
      bubble.style.left = (8 + Math.random() * 78) + '%';
      bubble.style.top = (35 + Math.random() * 35) + '%';
      layer.appendChild(bubble);
      setManagedTimeout(function () { bubble.remove(); }, 800);
    }
  }
  function addDecoration(emoji) {
    if (state.destroyed || state.phase !== 'tuning' || state.locked ||
        !DECORATIONS.includes(emoji) || state.decorations.length >= DECO_SLOTS.length) return false;
    state.decorations.push(Object.assign({ emoji: emoji }, DECO_SLOTS[state.decorations.length]));
    state.viewBefore = false; state.message = '멋진 내 차가 되고 있어요!';
    renderUI(); initAudio(); playComplexSound('light'); vibrate(20); return true;
  }
  function startFinale() {
    if (state.destroyed || state.locked || state.phase !== 'tuning' || !completedCar()) return false;
    state.phase = 'photo'; state.viewBefore = false; state.message = '내가 고친 차, 완성!';
    saveCompletedVehicle(); performSpecialAction(); renderUI();
    playGarageVoice('games.car.complete'); vibrate(70); return true;
  }
  function performSpecialAction() {
    if (state.destroyed || state.phase !== 'photo' || state.completeRewardGiven) return;
    state.completeRewardGiven = true; state.successRewardGiven = true;
    try { if (state.options.fireConfetti) state.options.fireConfetti(); } catch (_) {}
    try { if (state.options.gainExp) state.options.gainExp(40); } catch (_) {}
  }
  function showSuccessPanel() { if (state.phase === 'photo') renderUI(); }
  function startDrive(raw) {
    if (state.destroyed || state.locked || state.driveMoving) return false;
    const car = cleanCar(raw);
    if (!car) return false;
    if (!state.workshop) state.workshop = snapshotWorkshop();
    clearTimers();
    state.currentVehicle = Object.assign({ id: car.vehicleId }, VEHICLE_META[car.vehicleId]);
    state.completedTasks = state.currentVehicle.tasks.slice(); state.decorations = copy(car.decorations);
    state.savedCurrentId = car.id; state.completeRewardGiven = true; state.successRewardGiven = true;
    state.phase = 'drive'; state.locked = false; state.driveMoving = false;
    state.driveVisited = []; state.driveX = 0; state.viewBefore = false;
    state.message = '내 차로 어디에 가볼까요?'; renderUI(); return true;
  }
  function driveTo(index) {
    if (state.destroyed || state.phase !== 'drive' || state.driveMoving ||
        !Number.isInteger(index) || !STOPS[index] || state.driveVisited.includes(index)) return false;
    state.driveMoving = true; state.message = STOPS[index].name + '으로 가요!';
    const car = state.container && state.container.querySelector('.cg-drive-car');
    const message = state.container && state.container.querySelector('.cg-stage-message');
    if (message) message.textContent = state.message;
    state.driveX = STOPS[index].x;
    if (car) car.style.left = state.driveX + '%';
    state.container.querySelectorAll('[data-stop], [data-garage], [data-drive-again]').forEach(function (button) { button.disabled = true; });
    initAudio(); playComplexSound('gas');
    setManagedTimeout(function () {
      state.driveVisited.push(index); state.driveMoving = false;
      state.message = state.driveVisited.length === STOPS.length
        ? '동네 한 바퀴를 다 돌았어요!' : STOPS[index].name + '에 도착했어요!';
      renderUI();
    }, 900);
    return true;
  }

  function render(container, options) {
    destroy(); injectStyle(); state.container = container; state.options = options || {};
    state.destroyed = false; state.layoutMode = getLayoutMode(); loadGarage();
    bindLayoutEvents(); startVehicle();
  }
  function destroy() {
    clearTimers(); unbindLayoutEvents(); state.renderToken++; state.destroyed = true;
    try { if (window.SihyeonVoice && window.SihyeonVoice.stop) window.SihyeonVoice.stop(); } catch (_) {}
    if (state.audioCtx) {
      try { const result = state.audioCtx.close(); if (result && result.catch) result.catch(function () {}); } catch (_) {}
      state.audioCtx = null;
    }
    if (state.container) state.container.innerHTML = '';
    state.container = null; state.options = {}; state.currentVehicle = null; state.completedTasks = [];
    state.decorations = []; state.phase = 'arrival'; state.workshop = null; state.locked = false;
    state.driveMoving = false; state.driveVisited = []; state.savedCurrentId = null;
    state.successRewardGiven = false; state.completeRewardGiven = false; state.confirmDeleteId = null;
    state.deletedCar = null; state.viewBefore = false; state.message = ''; state.skipNextSpeak = false;
  }
  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
})();
