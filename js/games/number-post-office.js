/* 숫자 배달 우체국 — 그림, 실제 물건, 세 곳의 배달. */
(function () {
  'use strict';

  const KEY = 'numberPostOffice';
  const SAVE_PREFIX = 'sihyeon-post-office-v1:';
  const ASSETS = './assets/games/number-post-office/';
  const PAGE_SIZE = 10;
  const memorySaves = {};
  const view = {
    container: null, options: {}, session: null, activeTruck: 0, stockType: '', stockPage: 0,
    cargoPage: 0, modal: null, muted: false, voiceFailed: false, saveFailed: false,
    drag: null, timers: new Set(), voiceToken: 0, inputTimes: new Map(), lastAction: 0,
    deliveryStage: '', deliveryToken: 0, handlers: null, flies: new Set(), previousBack: null
  };
  function model() { return window.SihyeonPostOfficeModel; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function current() { return view.session && view.session.orders[view.session.active]; }
  function typeOf(id) { return model().TYPES.find(function (type) { return type.id === id; }) || model().TYPES[0]; }
  function objectParticle(text) {
    const last = String(text).charCodeAt(String(text).length - 1);
    return text + (last >= 0xAC00 && last <= 0xD7A3 && (last - 0xAC00) % 28 ? '을' : '를');
  }
  function animalOf(id) { return model().ANIMALS.find(function (animal) { return animal.id === id; }) || model().ANIMALS[0]; }
  function esc(value) { return String(value).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function age() { return [4, 5, 6, 7].includes(Number(window.SihyeonPlaySettings?.getAge?.())) ? Number(window.SihyeonPlaySettings.getAge()) : 4; }
  function chosenChallenge(ageMode) {
    const recommended = ({ 4: '1-10', 5: '11-15', 6: '16-20', 7: '21-30' })[ageMode];
    const value = window.SihyeonPlaySettings?.getChallenge?.(KEY, recommended) || recommended;
    return Object.prototype.hasOwnProperty.call(model().CHALLENGES, value) ? value : recommended;
  }
  function numberWord(n, counter) {
    const ones = counter ? ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'] : ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
    if (!n) return '영';
    if (n < 10) return ones[n];
    if (n === 20 && counter) return '스무';
    return ['', '열', '스물', '서른', '마흔'][Math.floor(n / 10)] + ones[n % 10];
  }
  function timer(fn, delay) {
    const id = window.setTimeout(function () { view.timers.delete(id); if (view.container) fn(); }, delay);
    view.timers.add(id);
    return id;
  }
  function clearTimers() { view.timers.forEach(function (id) { clearTimeout(id); }); view.timers.clear(); }
  function storageRead(key) {
    // A readable stored value can be older when only setItem is rejected.
    // The current page's latest snapshot owns that key until a real reload.
    if (Object.prototype.hasOwnProperty.call(memorySaves, key)) return clone(memorySaves[key]);
    try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : null; }
    catch (error) { view.saveFailed = true; return null; }
  }
  function storageWrite(key, value) {
    memorySaves[key] = clone(value);
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (error) { view.saveFailed = true; }
  }
  function save() {
    if (!view.session) return;
    storageWrite(SAVE_PREFIX + view.session.age + ':' + view.session.challenge, view.session);
    storageWrite(SAVE_PREFIX + 'preferences', { muted: view.muted });
  }
  function newSeed() {
    try { return crypto.getRandomValues(new Uint32Array(1))[0]; }
    catch (error) { return (Date.now() ^ Math.floor(Math.random() * 4294967295)) >>> 0; }
  }
  function newSession(ageMode, challenge) {
    const seed = newSeed();
    return { version: 1, age: ageMode, challenge: challenge, seed: seed, active: 0,
      orders: [0, 1, 2].map(function (round) { return model().createState(model().generateMission({ age: ageMode, challenge: challenge, seed: seed, round: round })); }) };
  }
  function restoreSession(raw, ageMode, challenge) {
    if (!raw || raw.version !== 1 || raw.age !== ageMode || raw.challenge !== challenge || !Number.isInteger(raw.seed) || !Array.isArray(raw.orders) || raw.orders.length !== 3 || !Number.isInteger(raw.active) || raw.active < 0 || raw.active > 2) return null;
    const orders = raw.orders.map(function (state, index) {
      const restored = model().restoreState(state);
      return restored && restored.mission.age === ageMode && restored.mission.challenge === challenge && restored.mission.seed === raw.seed && restored.mission.round === index ? restored : null;
    });
    if (orders.some(function (state) { return !state; })) return null;
    return { version: 1, age: ageMode, challenge: challenge, seed: raw.seed, active: raw.active, orders: orders };
  }
  function loadSession(ageMode, challenge, fresh) {
    const stored = fresh ? null : storageRead(SAVE_PREFIX + ageMode + ':' + challenge);
    view.session = restoreSession(stored, ageMode, challenge) || newSession(ageMode, challenge);
    resetView();
    save();
  }
  function resetView() {
    cancelDrag();
    view.activeTruck = 0;
    view.stockType = current().mission.requirements[0].type;
    view.stockPage = 0;
    view.cargoPage = 0;
    view.modal = null;
    view.deliveryStage = '';
    view.deliveryToken += 1;
    view.inputTimes.clear();
  }
  function picture(id, fallback, extra) {
    return '<span class="npo-picture ' + (extra || '') + '"><img src="' + ASSETS + esc(id) + '.svg" alt="" draggable="false"><span class="npo-image-fallback" aria-hidden="true">' + esc(fallback) + '</span></span>';
  }
  function itemPicture(type, extra) { const item = typeOf(type); return picture(item.id, item.emoji, extra); }
  function bindImageFallbacks(root) {
    root.querySelectorAll('.npo-picture img').forEach(function (img) {
      const showFallback = function () { img.closest('.npo-picture')?.classList.add('missing'); };
      img.onerror = showFallback;
      if (img.complete && img.naturalWidth === 0) showFallback();
    });
  }
  function soundText() {
    const state = current();
    if (!state) return '';
    const mission = state.mission;
    if (window.SihyeonPlaySettings?.getLanguage?.()==='en')
      return window.SihyeonEnglishListening?.postOfficeOrder?.(mission) || '';
    const request = mission.requirements.map(function (need) { return typeOf(need.type).name + ' ' + numberWord(need.count, true) + ' 개'; }).join(', ');
    let instruction = '물건을 톡 눌러 차에 실어 줘.';
    if (mission.kind === 'fill-missing') instruction = '담긴 물건은 두고, 부족한 물건을 더 실어 줘.';
    if (mission.age === 6) instruction = '열 개씩 묶어도 좋아. 어느 친구에게 먼저 갈까?';
    if (mission.age === 7) instruction = mission.totalRequired === 1 ? '한 물건은 어느 차에 실어도 좋아.' : (mission.splitRule === 'near' ? '두 차에 비슷하게 나눠 실어 줘.' : '두 차에 나눠 실어 줘. 여러 방법으로 나눌 수 있어.');
    return animalOf(mission.animal).name + '에게 ' + request + '를 보내 줘. ' + instruction;
  }
  function stopVoice() {
    view.voiceToken += 1;
    try { window.SihyeonVoice?.stop?.(); } catch (error) {}
  }
  function speak(text) {
    if (!view.container || view.muted) return;
    if (window.SihyeonPlaySettings?.getLanguage?.()==='en' && /[가-힣]/.test(String(text))) {
      text = window.SihyeonEnglishListening?.postOfficePhrase?.(text) || '';
    }
    if (!text) return;
    stopVoice();
    const token = view.voiceToken;
    let finished = false;
    const fallback = function (ok) {
      if (finished || token !== view.voiceToken || !view.container) return;
      finished = true;
      if (!ok) {
        view.voiceFailed = true;
        const status = view.container.querySelector('.npo-sound-note');
        if (status) { status.hidden = false; status.textContent = '🔎 주문 그림을 눌러 개수를 볼 수 있어요'; }
      }
    };
    try {
      if (typeof view.options.say === 'function') {
        Promise.resolve(view.options.say(text)).then(fallback, function () { fallback(false); });
      } else if (window.SihyeonVoice && typeof window.SihyeonVoice.speak === 'function') {
        Promise.resolve(window.SihyeonVoice.speak(text, { lang: window.SihyeonPlaySettings?.getLanguage?.()==='en' ? 'en-US' : 'ko-KR', rate: 0.88, pitch: 1.08 })).then(fallback, function () { fallback(false); });
      } else fallback(false);
    } catch (error) { fallback(false); }
    timer(function () { fallback(false); }, 11000);
  }
  function ding() {
    if (view.muted) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      ctx.resume().catch(function () {});
      [523.25, 659.25, 783.99].forEach(function (note, i) {
        const oscillator = ctx.createOscillator(); const volume = ctx.createGain();
        oscillator.type = 'sine'; oscillator.frequency.value = note;
        volume.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        volume.gain.linearRampToValueAtTime(0.06, ctx.currentTime + i * 0.1 + 0.02);
        volume.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.35);
        oscillator.connect(volume); volume.connect(ctx.destination);
        oscillator.start(ctx.currentTime + i * 0.1); oscillator.stop(ctx.currentTime + i * 0.1 + 0.36);
      });
      window.setTimeout(function () { ctx.close().catch(function () {}); }, 900);
    } catch (error) {}
  }

  function goalDots(count) {
    let html = '';
    for (let start = 0; start < count; start += 10) {
      html += '<span class="npo-mini-ten" aria-hidden="true">';
      for (let i = 0; i < 10; i += 1) html += '<i class="' + (start + i < count ? 'filled' : '') + '"></i>';
      html += '</span>';
    }
    return html;
  }
  function requestHtml(state) {
    const mission = state.mission;
    const animal = animalOf(mission.animal);
    const instruction = mission.age === 7 ? (mission.totalRequired === 1 ? '어느 차로 보낼까?' : (mission.splitRule === 'near' ? '두 차에 비슷하게 나누기' : '두 차에 나눠 싣기')) : (mission.kind === 'fill-missing' ? '조금 더 담아 줘!' : '이만큼 보내 줘!');
    return '<div class="npo-request"><div class="npo-friend">' + picture(animal.id, animal.emoji) + '<span>' + esc(animal.name) + '</span></div>' +
      '<div class="npo-order"><div class="npo-order-title"><span>' + instruction + '</span><button type="button" class="npo-range" data-action="challenge" aria-label="도전 수량 바꾸기">' + esc(mission.challenge.replace('-', '~')) + ' <span>▾</span></button></div>' +
      '<div class="npo-goals">' + mission.requirements.map(function (need) {
        return '<button type="button" class="npo-goal" data-action="goal" aria-label="' + esc(typeOf(need.type).name) + ' ' + need.count + '개 주문 그림 보기">' + itemPicture(need.type) + '<strong>' + need.count + '<small>개</small></strong><span class="npo-mini-tens">' + goalDots(need.count) + '</span><span class="npo-expand" aria-hidden="true">⌕</span></button>';
      }).join('') + '</div></div></div>';
  }
  function routeHtml(state) {
    const planned = state.mission.age >= 6;
    return '<nav class="npo-route" aria-label="배달할 친구"><span class="npo-route-label">' + (planned ? '먼저 갈 곳' : '오늘 배달') + '</span>' + view.session.orders.map(function (order, index) {
      const animal = animalOf(order.mission.animal);
      const done = order.phase === 'DELIVERED';
      const content = picture(animal.id, animal.emoji) + '<span>' + (done ? '✓' : (index + 1)) + '</span>';
      return '<button type="button" class="npo-stop ' + (index === view.session.active ? 'current ' : '') + (done ? 'done' : '') + '" data-action="stop" data-stop="' + index + '" ' + (!planned || state.phase === 'DELIVERING' ? 'disabled ' : '') + 'aria-label="' + animal.name + ' 주문 ' + (done ? '완료' : (index + 1)) + '">' + content + '</button>';
    }).join('<span class="npo-route-dash" aria-hidden="true"></span>') + '</nav>';
  }
  function pager(which, index, total) {
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    return '<div class="npo-pager"><button type="button" data-action="' + which + '-prev" aria-label="앞의 열 개" ' + (index <= 0 ? 'disabled' : '') + '>‹</button><span>' + (pages > 1 ? ((index * 10 + 1) + ' ~ ' + Math.min(total, (index + 1) * 10)) : '하나씩 톡!') + '</span><button type="button" data-action="' + which + '-next" aria-label="다음 열 개" ' + (index >= pages - 1 ? 'disabled' : '') + '>›</button></div>';
  }
  function warehouseHtml(state) {
    const types = state.mission.requirements.map(function (need) { return need.type; });
    if (!types.includes(view.stockType)) view.stockType = types[0];
    const all = state.mission.items.filter(function (item) { return item.type === view.stockType; });
    view.stockPage = Math.max(0, Math.min(view.stockPage, Math.ceil(all.length / PAGE_SIZE) - 1));
    const visible = all.slice(view.stockPage * PAGE_SIZE, (view.stockPage + 1) * PAGE_SIZE);
    return '<section class="npo-warehouse npo-panel" data-drop-warehouse="true" aria-label="물건 창고"><div class="npo-panel-top"><h2>물건 창고</h2><div class="npo-types">' + types.map(function (type) {
      return '<button type="button" class="npo-type ' + (type === view.stockType ? 'active' : '') + '" data-action="type" data-type="' + type + '" aria-label="' + esc(typeOf(type).name) + ' 창고" aria-pressed="' + (type === view.stockType) + '">' + itemPicture(type) + '</button>';
    }).join('') + '</div></div><div class="npo-stock-grid npo-ten-grid">' + Array.from({ length: PAGE_SIZE }, function (_, slot) {
      const item = visible[slot];
      if (!item) return '<span class="npo-empty-slot" aria-hidden="true"></span>';
      const packed = state.positions[item.id] >= 0;
      return '<button type="button" class="npo-item npo-stock-item ' + (packed ? 'packed' : '') + '" data-item="' + item.id + '" data-from="-1" ' + (packed ? 'disabled ' : '') + 'aria-label="' + esc(typeOf(item.type).name) + ' ' + (view.stockPage * 10 + slot + 1) + '번 싣기">' + itemPicture(item.type) + '<span class="npo-order-number">' + (packed ? '✓' : (view.stockPage * 10 + slot + 1)) + '</span></button>';
    }).join('') + '</div>' + pager('stock', view.stockPage, all.length) + '</section>';
  }
  function cargoItems(state, truck) {
    const grouped = new Set(state.groups.flatMap(function (group) { return group.items; }));
    return state.mission.items.filter(function (item) { return state.positions[item.id] === truck && !grouped.has(item.id); });
  }
  function canGroup(state) {
    const loose = cargoItems(state, view.activeTruck);
    return state.mission.requirements.some(function (need) { return loose.filter(function (item) { return item.type === need.type; }).length >= 10; });
  }
  function cargoHtml(state) {
    const counts = model().totals(state);
    const loose = cargoItems(state, view.activeTruck);
    const bundles = state.groups.filter(function (group) { return group.truck === view.activeTruck; });
    view.cargoPage = Math.max(0, Math.min(view.cargoPage, Math.max(0, Math.ceil(loose.length / PAGE_SIZE) - 1)));
    const visible = loose.slice(view.cargoPage * PAGE_SIZE, (view.cargoPage + 1) * PAGE_SIZE);
    return '<section class="npo-cargo npo-panel" aria-label="배달 짐칸"><div class="npo-panel-top"><h2>배달 짐칸</h2><button type="button" class="npo-reset" data-action="reset" aria-label="상자 다시 담기">↻</button></div>' +
      '<div class="npo-trucks">' + Array.from({ length: state.mission.truckCount }, function (_, i) {
        return '<button type="button" class="npo-truck-tab ' + (i === view.activeTruck ? 'active' : '') + '" data-action="truck" data-truck="' + i + '" data-drop-truck="' + i + '" aria-pressed="' + (i === view.activeTruck) + '" aria-label="' + (i + 1) + '번 차, ' + counts.byTruck[i] + '개 실음">' + picture(i === 0 ? 'truck-orange' : 'truck-blue', i === 0 ? '🚚' : '🚙') + '<span><small>' + (state.mission.truckCount === 2 ? (i + 1) + '번 차' : '실은 물건') + '</small><strong>' + counts.byTruck[i] + '</strong></span></button>';
      }).join('') + '</div><div class="npo-cargo-body" data-drop-truck="' + view.activeTruck + '"><div class="npo-bundles">' + bundles.map(function (bundle) {
        const type = state.mission.items.find(function (item) { return item.id === bundle.items[0]; }).type;
        return '<button type="button" class="npo-bundle" data-action="unbundle" data-group="' + bundle.id + '" aria-label="' + esc(typeOf(type).name) + ' 열 개 묶음 풀기"><span class="npo-bundle-pictures">' + bundle.items.map(function () { return itemPicture(type); }).join('') + '</span><strong>10</strong><span class="npo-unpack">↗</span></button>';
      }).join('') + '</div><div class="npo-cargo-grid npo-ten-grid">' + Array.from({ length: PAGE_SIZE }, function (_, slot) {
        const item = visible[slot];
        if (!item) return '<span class="npo-empty-slot" aria-hidden="true"></span>';
        return '<button type="button" class="npo-item npo-cargo-item" data-item="' + item.id + '" data-from="' + view.activeTruck + '" aria-label="' + esc(typeOf(item.type).name) + ' 내리기">' + itemPicture(item.type) + '<span class="npo-order-number">' + (view.cargoPage * 10 + slot + 1 + bundles.length * 10) + '</span></button>';
      }).join('') + '</div></div><div class="npo-cargo-bottom">' + (bundles.length ? '<span class="npo-equation">📦 ' + bundles.length + ' × 10 + ' + loose.length + '</span>' : '') + pager('cargo', view.cargoPage, loose.length) + '</div></section>';
  }
  function feedbackText(state) {
    if (state.feedback && state.feedback.issues && state.feedback.issues.length) {
      const issue = state.feedback.issues[0];
      if (issue.kind === 'missing') return typeOf(issue.type).emoji + ' ' + objectParticle(typeOf(issue.type).name) + ' 조금 더 담아 볼까?';
      if (issue.kind === 'extra') return typeOf(issue.type).emoji + ' ' + objectParticle(typeOf(issue.type).name) + ' 조금 내려 볼까?';
      if (issue.kind === 'balance') return '🚚 ↔ 🚙 두 차에 비슷하게 나누어 볼까?';
      if (issue.kind === 'split') return '🚚 + 🚙 다른 차에도 실어 볼까?';
    }
    if (view.saveFailed) return '이 기기에서는 이어하기 저장이 어려워요';
    if (state.mission.age === 7) return '차를 고르고 물건을 실어요. 짐칸을 톡 누르면 내려요.';
    return '물건을 톡! 짐칸을 톡 누르면 다시 꺼낼 수 있어요.';
  }
  function draw() {
    if (!view.container || !view.session) return;
    const state = current();
    const done = state.phase === 'DELIVERED';
    const locked = state.phase !== 'SELECTING';
    view.container.innerHTML = '<section class="npo-root" data-age="' + state.mission.age + '" data-phase="' + state.phase + '"><header class="npo-top"><button type="button" class="npo-icon-button npo-home" data-action="home" aria-label="숫자놀이터로">🏠</button><div class="npo-brand"><span>숫자 배달</span><strong>우체국</strong></div><div class="npo-top-tools"><button type="button" class="npo-icon-button" data-action="listen" aria-label="주문 다시 듣기">🔊</button><button type="button" class="npo-icon-button" data-action="sound" aria-label="' + (view.muted ? '소리 켜기' : '소리 끄기') + '" aria-pressed="' + view.muted + '">' + (view.muted ? '🔇' : '♪') + '</button><button type="button" class="npo-icon-button npo-age" data-action="settings" aria-label="놀이 모드 설정"><strong>' + state.mission.age + '</strong><small>세 ⚙</small></button></div></header>' +
      requestHtml(state) + routeHtml(state) + '<main class="npo-workspace" ' + (locked ? 'inert' : '') + '>' + warehouseHtml(state) + cargoHtml(state) + '</main>' +
      '<footer class="npo-footer"><p class="npo-status ' + (state.feedback ? 'npo-needs-change' : '') + '" aria-live="polite">' + esc(feedbackText(state)) + '</p><div class="npo-actions"><button type="button" class="npo-tool-button" data-action="undo" aria-label="한 번 되돌리기" ' + (locked || !state.history.length ? 'disabled' : '') + '><b>↶</b><span>되돌리기</span></button><button type="button" class="npo-tool-button npo-group-button" data-action="bundle" aria-label="열 개 묶기" ' + (locked || !canGroup(state) ? 'disabled' : '') + '><b>📦 <em>10</em></b><span>묶기</span></button><button type="button" class="npo-tool-button" data-action="help" aria-label="그림 도움 보기"><b>☝</b><span>도움</span></button><button type="button" class="npo-deliver-button" data-action="deliver" ' + (locked ? 'disabled' : '') + '><span>🚚</span><strong>배달 출발</strong><b>→</b></button></div><p class="npo-sound-note" ' + (!view.voiceFailed && !view.muted ? 'hidden' : '') + '>🔎 주문 그림을 눌러 개수를 볼 수 있어요</p></footer>' +
      (state.phase === 'DELIVERING' ? deliveryHtml(state) : '') + (done ? resultHtml(state) : '') + (view.modal ? modalHtml(state) : '') + '</section>';
    bindImageFallbacks(view.container);
  }
  function deliveryHtml(state) {
    const stage = view.deliveryStage || 'packing';
    const animal = animalOf(state.mission.animal);
    const label = stage === 'packing' ? '상자를 닫아요' : stage === 'driving' ? '친구에게 가요!' : '선물이 도착했어요!';
    return '<div class="npo-delivery" role="status" aria-live="polite" data-stage="' + stage + '"><h2>' + label + '</h2><div class="npo-delivery-scene"><div class="npo-post-building"><span>✉</span></div><div class="npo-delivery-road"></div><div class="npo-moving-truck">' + picture('truck-orange', '🚚') + '<div class="npo-shipment">' + state.mission.requirements.map(function (need) { return '<span>' + itemPicture(need.type) + '<b>' + need.count + '</b></span>'; }).join('') + '</div></div><div class="npo-recipient">' + picture(animal.id, animal.emoji) + '<span>♡</span></div></div><button type="button" class="npo-soft-button" data-action="skip-delivery">도착 보기 →</button></div>';
  }
  function resultHtml(state) {
    const counts = model().totals(state);
    const animal = animalOf(state.mission.animal);
    const complete = view.session.orders.every(function (order) { return order.phase === 'DELIVERED'; });
    return '<div class="npo-result" role="dialog" aria-modal="true" aria-label="배달 완료"><div class="npo-result-card"><div class="npo-received-animal">' + picture(animal.id, animal.emoji) + '<span>♡</span></div><div class="npo-stamp">배달 완료 ✓</div><h2>' + (complete ? '세 친구에게 모두 도착!' : '고마워, 잘 받았어!') + '</h2><p>' + esc(animal.thanks) + '</p><div class="npo-received">' + state.mission.requirements.map(function (need) { return '<span>' + itemPicture(need.type) + '<strong>' + need.count + '</strong><small>개</small></span>'; }).join('') + '</div>' +
      (state.mission.age === 7 ? '<p class="npo-result-split">🚚 ' + counts.byTruck[0] + ' + 🚙 ' + counts.byTruck[1] + ' = ' + counts.total + '<br><small>이렇게 나눠도 같은 수예요</small></p>' : '') +
      (state.mission.age === 5 ? '<p class="npo-leftover">창고에 남은 물건 ' + state.mission.requirements.map(function (need) { return typeOf(need.type).emoji + ' ' + counts.warehouse[need.type]; }).join(' · ') + '</p>' : '') +
      '<div class="npo-result-actions"><button type="button" class="npo-deliver-button" data-action="next"><strong>' + (complete ? '새 배달 놀이' : '다음 친구에게') + '</strong><b>→</b></button><div><button type="button" class="npo-soft-button" data-action="replay">↻ 한 번 더</button><button type="button" class="npo-soft-button" data-action="home">🏠 다른 놀이</button></div></div></div></div>';
  }
  function modalHtml(state) {
    let content = '';
    if (view.modal === 'challenge') {
      content = '<h2>얼마나 보내볼까?</h2><p>담던 상자는 보관해 둘게요.</p><div class="npo-challenge-choices">' + Object.keys(model().CHALLENGES).map(function (challenge, i) {
        return '<button type="button" class="' + (challenge === state.mission.challenge ? 'active' : '') + '" data-action="choose-challenge" data-challenge="' + challenge + '"><span>' + ['🌱', '🌿', '🌳', '🌲'][i] + '</span><strong>' + challenge.replace('-', '~') + '</strong><small>개</small></button>';
      }).join('') + '</div><p class="npo-dialog-note">나이와 상관없이 고를 수 있어요</p>';
    } else if (view.modal === 'settings') {
      content = '<h2>어떤 놀이로 갈까?</h2><p>담던 상자는 보관해 둘게요.</p><div class="npo-challenge-choices">' + [4, 5, 6, 7].map(function (a, i) {
        return '<button type="button" data-action="choose-age" data-age="' + a + '"><span>' + ['🐰', '🐻', '🦊', '🐼'][i] + '</span><strong>' + a + '세</strong></button>';
      }).join('') + '</div>';
    } else if (view.modal === 'goal') {
      content = '<h2>친구가 기다리는 물건</h2><div class="npo-full-order">' + state.mission.requirements.map(function (need) {
        return '<section><h3>' + esc(typeOf(need.type).name) + ' ' + need.count + '개</h3><div class="npo-order-items">' + Array.from({ length: need.count }, function (_, i) { return '<span>' + itemPicture(need.type) + '<small>' + (i + 1) + '</small></span>'; }).join('') + '</div></section>';
      }).join('') + '</div><button type="button" class="npo-soft-button" data-action="listen">🔊 주문 듣기</button>';
    } else {
      const type = state.mission.requirements[0].type;
      content = '<h2>톡 눌러 차에 실어요</h2><div class="npo-demo" aria-label="물건을 누르면 짐칸으로 이동하는 시범"><div class="npo-demo-stock">' + itemPicture(type) + '<span>☝</span></div><b>→</b><div class="npo-demo-box">' + itemPicture(type) + '<span>📦</span></div></div><p>짐칸에서 톡 누르면 다시 꺼내요.</p><p>열 개가 모이면 📦 묶기도 해 보세요.</p><button type="button" class="npo-soft-button" data-action="reset">↻ 상자 다시 담기</button><p class="npo-dialog-note">다시 담은 뒤에도 ↶로 되돌릴 수 있어요</p>';
    }
    return '<div class="npo-modal" role="dialog" aria-modal="true" aria-label="' + (view.modal === 'goal' ? '주문 그림' : '놀이 도움') + '"><div class="npo-dialog"><button type="button" class="npo-dialog-close" data-action="close-modal" aria-label="닫고 계속 놀기">×</button>' + content + '<button type="button" class="npo-continue" data-action="close-modal">계속 놀기 →</button></div></div>';
  }

  function dispatch(action) {
    const old = current();
    const next = model().reduce(old, action);
    if (next === old) return false;
    view.session.orders[view.session.active] = next;
    save();
    return true;
  }
  function fly(item, fromRect, targetTruck) {
    if (!fromRect || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !view.container) return;
    const destination = view.container.querySelector(targetTruck < 0 ? '.npo-warehouse' : '.npo-cargo-grid');
    if (!destination) return;
    const target = destination.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'npo-flying-item'; ghost.innerHTML = itemPicture(item.type);
    ghost.style.left = fromRect.left + 'px'; ghost.style.top = fromRect.top + 'px';
    ghost.style.width = Math.max(42, fromRect.width) + 'px'; ghost.style.height = Math.max(42, fromRect.height) + 'px';
    document.body.appendChild(ghost); view.flies.add(ghost);
    bindImageFallbacks(ghost);
    const x = target.left + target.width / 2 - fromRect.left - fromRect.width / 2;
    const y = target.top + target.height / 2 - fromRect.top - fromRect.height / 2;
    if (typeof ghost.animate === 'function') ghost.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + x + 'px,' + y + 'px) scale(.65)', opacity: 0 }], { duration: 270, easing: 'ease-out', fill: 'forwards' });
    timer(function () { ghost.remove(); view.flies.delete(ghost); }, 300);
  }
  function moveItem(id, targetTruck, rect) {
    if (!current() || current().phase !== 'SELECTING') return;
    const now = performance.now();
    if (now - (view.inputTimes.get(id) || -1000) < 180) return;
    const item = current().mission.items.find(function (candidate) { return candidate.id === id; });
    if (!item || !dispatch({ type: 'MOVE', id: id, truck: targetTruck })) return;
    view.inputTimes.set(id, now);
    if (targetTruck >= 0) {
      view.activeTruck = targetTruck;
      view.cargoPage = Math.max(0, Math.ceil(cargoItems(current(), targetTruck).length / PAGE_SIZE) - 1);
    }
    draw(); fly(item, rect, targetTruck);
    const total = model().totals(current()).total;
    speak(targetTruck >= 0 ? numberWord(total, false) : '하나 내렸어.');
  }
  function finishDelivery() {
    if (!current() || current().phase !== 'DELIVERING') return;
    if (dispatch({ type: 'FINISH' })) {
      view.deliveryToken += 1;
      view.deliveryStage = '';
      draw(); ding(); speak('고마워! 물건을 잘 받았어.');
      try { view.options.fireConfetti?.(); } catch (error) {}
    }
  }
  function deliver() {
    if (!current() || current().phase !== 'SELECTING') return;
    cancelDrag();
    if (!dispatch({ type: 'CHECK' })) return;
    if (current().phase !== 'DELIVERING') { draw(); speak(feedbackText(current())); return; }
    const missionId = current().mission.id;
    const deliveryToken = ++view.deliveryToken;
    const isSameDelivery = function () { return deliveryToken === view.deliveryToken && current()?.mission.id === missionId && current().phase === 'DELIVERING'; };
    view.deliveryStage = 'packing'; draw(); speak('상자를 닫고, 출발!');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    timer(function () { if (isSameDelivery()) { view.deliveryStage = 'driving'; draw(); } }, reduced ? 120 : 450);
    timer(function () { if (isSameDelivery()) { view.deliveryStage = 'received'; draw(); } }, reduced ? 300 : 1600);
    timer(function () { if (isSameDelivery()) finishDelivery(); }, reduced ? 650 : 2400);
  }
  function nextOrder() {
    if (current().phase !== 'DELIVERED') return;
    const nextAge = age(); const challenge = chosenChallenge(nextAge);
    const next = view.session.orders.findIndex(function (state) { return state.phase !== 'DELIVERED'; });
    // An external settings change during the short delivery scene waits until
    // the child sees this result; the completed session stays saved separately.
    if (nextAge !== view.session.age || challenge !== view.session.challenge) loadSession(nextAge, challenge, false);
    else if (next < 0) loadSession(nextAge, challenge, true);
    else { view.session.active = next; resetView(); save(); }
    draw(); speak(soundText());
  }
  function changeSettings(newAge, newChallenge) {
    if (!view.container || !current() || current().phase === 'DELIVERING') return;
    if (newAge === view.session.age && newChallenge === view.session.challenge) { view.modal = null; draw(); return; }
    save(); stopVoice(); loadSession(newAge, newChallenge, false); draw(); speak(soundText());
  }
  function handleAction(action, element) {
    if (!current()) return;
    const state = current();
    if (['next', 'replay', 'stop', 'deliver'].includes(action)) {
      const now = performance.now();
      if (now - view.lastAction < 350) return;
      view.lastAction = now;
    }
    if (action === 'home') {
      save(); stopVoice(); cancelDrag();
      if (typeof view.options.closeToParkHome === 'function') view.options.closeToParkHome();
      return;
    }
    if (action === 'listen') { if (view.muted) { view.modal = 'goal'; draw(); } else speak(soundText()); return; }
    if (action === 'sound') { view.muted = !view.muted; stopVoice(); save(); draw(); if (!view.muted) speak(soundText()); return; }
    if (action === 'settings') {
      if (state.phase === 'DELIVERING') return;
      save(); stopVoice();
      if (typeof view.options.openSettings === 'function') view.options.openSettings();
      else { view.modal = 'settings'; draw(); }
      return;
    }
    if (action === 'choose-age') {
      const nextAge = Number(element.dataset.age);
      window.SihyeonPlaySettings?.setAge?.(nextAge);
      changeSettings(nextAge, chosenChallenge(nextAge)); return;
    }
    if (action === 'challenge' || action === 'goal' || action === 'help') {
      if (state.phase === 'DELIVERING') return;
      view.modal = action; cancelDrag(); draw();
      view.container.querySelector('.npo-dialog-close')?.focus(); return;
    }
    if (action === 'close-modal') { view.modal = null; draw(); return; }
    if (action === 'choose-challenge') {
      const challenge = element.dataset.challenge;
      if (!Object.prototype.hasOwnProperty.call(model().CHALLENGES, challenge)) return;
      window.SihyeonPlaySettings?.setChallenge?.(KEY, challenge);
      changeSettings(view.session.age, challenge); return;
    }
    if (action === 'skip-delivery') { finishDelivery(); return; }
    if (action === 'next') { nextOrder(); return; }
    if (action === 'replay') {
      if (state.phase !== 'DELIVERED') return;
      view.session.orders[view.session.active] = model().createState(state.mission);
      resetView(); save(); draw(); speak(soundText()); return;
    }
    if (action === 'stop') {
      const stop = Number(element.dataset.stop);
      if (state.mission.age < 6 || state.phase === 'DELIVERING' || !Number.isInteger(stop) || stop < 0 || stop > 2) return;
      save(); view.session.active = stop; resetView(); save(); draw(); speak(soundText()); return;
    }
    if (state.phase !== 'SELECTING') return;
    if (action === 'deliver') { deliver(); return; }
    if (action === 'truck') { view.activeTruck = Number(element.dataset.truck); view.cargoPage = 0; draw(); return; }
    if (action === 'type') { view.stockType = element.dataset.type; view.stockPage = 0; draw(); return; }
    if (action === 'stock-prev') view.stockPage -= 1;
    else if (action === 'stock-next') view.stockPage += 1;
    else if (action === 'cargo-prev') view.cargoPage -= 1;
    else if (action === 'cargo-next') view.cargoPage += 1;
    else if (action === 'undo') dispatch({ type: 'UNDO' });
    else if (action === 'reset') { dispatch({ type: 'RESET' }); view.modal = null; view.cargoPage = 0; }
    else if (action === 'bundle') { if (dispatch({ type: 'GROUP', truck: view.activeTruck })) speak('열 개가 한 묶음! 눌러서 다시 풀 수 있어.'); }
    else if (action === 'unbundle') { if (dispatch({ type: 'UNGROUP', groupId: element.dataset.group })) speak('낱개 열 개로 다시 풀었어.'); }
    else return;
    cancelDrag(); draw();
  }

  function pointerDown(event) {
    if (!current() || current().phase !== 'SELECTING' || view.modal || view.drag || event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const button = event.target.closest('[data-item]');
    if (!button || button.disabled || !view.container.contains(button)) return;
    view.drag = { pointer: event.pointerId, element: button, id: button.dataset.item, from: Number(button.dataset.from), x: event.clientX, y: event.clientY, rect: button.getBoundingClientRect(), moved: false, ghost: null };
    try { button.setPointerCapture(event.pointerId); } catch (error) {}
  }
  function pointerMove(event) {
    const drag = view.drag;
    if (!drag || event.pointerId !== drag.pointer) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) >= 10) {
      drag.moved = true;
      const item = current().mission.items.find(function (candidate) { return candidate.id === drag.id; });
      const ghost = document.createElement('div');
      ghost.className = 'npo-drag-ghost'; ghost.innerHTML = itemPicture(item.type); document.body.appendChild(ghost); drag.ghost = ghost;
      bindImageFallbacks(ghost);
      drag.element.classList.add('dragging');
    }
    if (drag.moved) {
      event.preventDefault();
      drag.ghost.style.left = event.clientX - 32 + 'px'; drag.ghost.style.top = event.clientY - 32 + 'px';
      view.container.querySelectorAll('.npo-drop-ready').forEach(function (node) { node.classList.remove('npo-drop-ready'); });
      document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-drop-truck],[data-drop-warehouse]')?.classList.add('npo-drop-ready');
    }
  }
  function releaseDrag(drag) {
    if (!drag) return;
    drag.ghost?.remove(); drag.element?.classList.remove('dragging');
    try { if (drag.element?.hasPointerCapture(drag.pointer)) drag.element.releasePointerCapture(drag.pointer); } catch (error) {}
    view.container?.querySelectorAll('.npo-drop-ready').forEach(function (node) { node.classList.remove('npo-drop-ready'); });
  }
  function cancelDrag() {
    const drag = view.drag; view.drag = null;
    if (drag) view.suppressClickUntil = performance.now() + 500;
    releaseDrag(drag);
  }
  function pointerUp(event) {
    const drag = view.drag;
    if (!drag || event.pointerId !== drag.pointer) return;
    view.drag = null;
    let target = drag.from === -1 ? view.activeTruck : -1;
    if (drag.moved) {
      const drop = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-drop-truck],[data-drop-warehouse]');
      target = drop && view.container?.contains(drop) ? (drop.hasAttribute('data-drop-warehouse') ? -1 : Number(drop.dataset.dropTruck)) : null;
    }
    releaseDrag(drag);
    view.suppressClickUntil = performance.now() + 500;
    if (target !== null) moveItem(drag.id, target, drag.rect);
  }
  function click(event) {
    const item = event.target.closest('[data-item]');
    if (item && !item.disabled) {
      // Pointer input is committed at pointerup. Click remains the keyboard/AT alternative.
      if (event.detail > 0 && performance.now() < (view.suppressClickUntil || 0)) return;
      moveItem(item.dataset.item, Number(item.dataset.from) === -1 ? view.activeTruck : -1, item.getBoundingClientRect());
      return;
    }
    const button = event.target.closest('[data-action]');
    if (button && !button.disabled && view.container?.contains(button)) handleAction(button.dataset.action, button);
  }
  function onSettingsChange() {
    if (!view.container || !view.session) return;
    const nextAge = age(); const challenge = chosenChallenge(nextAge);
    if (current().phase === 'DELIVERING') return;
    changeSettings(nextAge, challenge);
  }
  function bind() {
    view.handlers = {
      click: click, pointerdown: pointerDown, pointermove: pointerMove, pointerup: pointerUp,
      pointercancel: cancelDrag,
      lostpointercapture: function (event) { if (view.drag && view.drag.pointer === event.pointerId) cancelDrag(); },
      resize: function () { cancelDrag(); save(); },
      blur: function () { cancelDrag(); save(); stopVoice(); },
      visibility: function () { if (document.hidden) { cancelDrag(); save(); stopVoice(); } },
      settings: onSettingsChange,
      keydown: function (event) { if (event.key === 'Escape') { cancelDrag(); if (view.modal) { view.modal = null; draw(); } } }
    };
    ['click', 'pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture', 'keydown'].forEach(function (name) { view.container.addEventListener(name, view.handlers[name]); });
    window.addEventListener('resize', view.handlers.resize);
    window.addEventListener('orientationchange', view.handlers.resize);
    window.addEventListener('blur', view.handlers.blur);
    window.addEventListener('sihyeon-settings-change', view.handlers.settings);
    document.addEventListener('visibilitychange', view.handlers.visibility);
  }
  function destroy() {
    if (!view.container) return;
    save(); cancelDrag(); stopVoice(); clearTimers();
    view.deliveryToken += 1;
    if (view.handlers) {
      ['click', 'pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture', 'keydown'].forEach(function (name) { view.container.removeEventListener(name, view.handlers[name]); });
      window.removeEventListener('resize', view.handlers.resize);
      window.removeEventListener('orientationchange', view.handlers.resize);
      window.removeEventListener('blur', view.handlers.blur);
      window.removeEventListener('sihyeon-settings-change', view.handlers.settings);
      document.removeEventListener('visibilitychange', view.handlers.visibility);
    }
    view.flies.forEach(function (node) { node.remove(); }); view.flies.clear();
    if (view.previousBack?.element) view.previousBack.element.hidden = view.previousBack.hidden;
    view.previousBack = null; view.container = null; view.session = null; view.handlers = null;
  }
  function render(container, options) {
    destroy();
    if (!container) return;
    view.container = container; view.options = options || {};
    if (!model()) { container.textContent = '우체국을 다시 열어 주세요.'; return; }
    if (!document.getElementById('sihyeon-number-post-office-style')) {
      const style = document.createElement('link'); style.id = 'sihyeon-number-post-office-style'; style.rel = 'stylesheet'; style.href = './css/games/number-post-office.css'; document.head.appendChild(style);
    }
    const back = container.closest('.game-play-screen')?.querySelector('.game-back-floating');
    if (back) { view.previousBack = { element: back, hidden: back.hidden }; back.hidden = true; }
    view.voiceFailed = false; view.saveFailed = false; view.lastAction = -1000; view.suppressClickUntil = 0;
    const prefs = storageRead(SAVE_PREFIX + 'preferences'); view.muted = prefs?.muted === true;
    loadSession(age(), chosenChallenge(age()), false);
    bind(); draw();
    timer(function () { if (current()?.phase !== 'DELIVERED') speak(soundText()); }, 180);
  }
  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[KEY] = { id: KEY, title: '숫자 배달 우체국', render: render, destroy: destroy,
    getSnapshot: function () { return view.session ? { session: clone(view.session), state: clone(current()), activeTruck: view.activeTruck, stockPage: view.stockPage, cargoPage: view.cargoPage, muted: view.muted, voiceFailed: view.voiceFailed, saveFailed: view.saveFailed } : null; } };
})();
