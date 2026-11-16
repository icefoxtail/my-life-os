/* Short automatic stories, with one set of original picture nodes per run. */
(function () {
  'use strict';

  const KEY = 'neighborhoodStory', SAVE_KEY = 'sihyeon-neighborhood-story-v1';
  const ref = id => ({ id, sourceKind: 'recommended' });
  const DEFAULTS = { version: 1, scene: 'fire', style: 'native', muted: false, scenes: {
    fire: { values: { a: 15, b: 4 }, objects: { main: ref('pump_engine') } },
    police: { values: { a: 9, b: 6 }, objects: { main: ref('korean_police_car'), arrival: ref('korean_police_car') } },
    snack: { values: { total: 15, groups: 4 }, objects: { main: ref('cookie'), arrival: ref('cookie') } },
    neighborhood: { values: { a: 7, b: 5 }, objects: { left: ref('pump_engine'), right: ref('korean_police_car') } }
  } };
  const SCENES = {
    fire: { icon: '🚒', ko: '소방서 출동', en: 'Fire station' },
    police: { icon: '🚓', ko: '경찰서 도착', en: 'Police station' },
    snack: { icon: '🍪', ko: '간식 나누기', en: 'Sharing snacks' },
    neighborhood: { icon: '🏘️', ko: '우리 동네', en: 'Our neighborhood' }
  };
  const view = { container: null, options: {}, state: null, model: null, resolved: {}, sequence: null,
    nodes: new Map(), zones: {}, events: [], eventIndex: -1, stageIndex: 0, currentEvent: null,
    runId: 0, phase: 'idle', complete: false, audioFailed: false, error: null,
    dialog: null, prediction: null, predictionTimer: 0, handlers: null, settingsObserver: null,
    boardObserver: null, scrollFrame: 0, pendingRestart: false, capturedLanguage: 'ko',
    storage: { read: 'unread', write: 'unwritten' } };
  let memory = null;
  const Q = () => window.SihyeonQuantityPlayModel;
  const M = () => window.SihyeonStoryPlayModel;
  const C = () => window.SihyeonPlayObjects;
  const copy = value => JSON.parse(JSON.stringify(value));
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const language = () => window.SihyeonPlaySettings?.getLanguage?.() === 'en' ? 'en' : 'ko';
  const L = (ko, en) => language() === 'en' ? en : ko;
  function age() { const n = window.SihyeonPlaySettings?.getAge?.() || view.options.ageMode; return [4, 5, 6, 7].includes(n) ? n : 4; }
  function selected() { return view.state.scenes[view.state.scene]; }
  function stage() { return view.model.stages[view.stageIndex]; }
  function root() { return view.container?.querySelector('.ns-root'); }
  function object(slot) { return view.resolved[slot]?.object || view.resolved[Object.keys(view.resolved)[0]]?.object; }
  function slots() {
    if (view.state.scene === 'neighborhood') return ['left', 'right'];
    if (view.state.scene === 'police' || (view.state.scene === 'snack' && age() === 7)) return ['main', 'arrival'];
    return ['main'];
  }
  function slotLabel(slot) { return ({ main: L('처음 그림', 'Starting picture'), arrival: L('오는 그림', 'Arriving picture'), left: L('왼쪽 그림', 'Left picture'), right: L('오른쪽 그림', 'Right picture') })[slot]; }
  function commonUnit() { const units = slots().map(slot => object(slot).unitKo); return units.every(unit => unit === units[0]) ? units[0] : '개'; }
  function count(n, style, lang) { return Q().countWord(n, style || view.state.style, lang || language()); }
  function quantity(n, style, lang) {
    if (lang === 'en') {
      const all = slots().map(slot => object(slot));
      const noun = all.every(item => item.id === all[0].id) ? (n === 1 ? all[0].nameEn : all[0].pluralEn || all[0].nameEn) : n === 1 ? 'picture' : 'pictures';
      return count(n, style, lang) + ' ' + noun;
    }
    return (style === 'sino' ? count(n, style, 'ko') : Q().determiner(n)) + ' ' + commonUnit();
  }
  function named(n, slot, style, lang) {
    const item = object(slot);
    if (lang === 'en') return count(n, style, lang) + ' ' + (n === 1 ? item.nameEn : item.pluralEn || item.nameEn);
    return item.nameKo + ' ' + (style === 'sino' ? count(n, style, 'ko') : Q().determiner(n)) + ' ' + item.unitKo;
  }
  function save() {
    memory = copy(view.state);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(memory)); view.storage.write = 'saved'; }
    catch (_) { view.storage.write = 'memory-only'; }
  }
  function load() {
    let saved = memory; view.storage = { read: saved ? 'memory' : 'unread', write: 'unwritten' };
    if (!saved) {
      try { saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); view.storage.read = saved ? 'storage' : 'empty'; }
      catch (_) { view.storage.read = 'unavailable'; }
    }
    view.state = copy(DEFAULTS);
    if (saved?.version !== 1) return;
    if (SCENES[saved.scene]) view.state.scene = saved.scene;
    if (['native', 'sino'].includes(saved.style)) view.state.style = saved.style;
    view.state.muted = saved.muted === true;
    const knownIds = new Set(C().listChoices({ sourceKind: 'recommended' }).map(item => item.id));
    Object.keys(SCENES).forEach(scene => {
      const candidate = saved.scenes?.[scene];
      if (!candidate || typeof candidate !== 'object') return;
      try { const checked = M().create({ scene, age: 4, values: candidate.values }); view.state.scenes[scene].values = copy(checked.base); }
      catch (_) { /* A corrupt pair falls back as a pair; no operand is clamped. */ }
      Object.keys(view.state.scenes[scene].objects).forEach(slot => {
        const requested = candidate.objects?.[slot];
        if (requested && knownIds.has(requested.id)) view.state.scenes[scene].objects[slot] = { id: requested.id, sourceKind: requested.sourceKind === 'artwork' ? 'artwork' : 'recommended' };
      });
    });
  }
  function resolveObjects() {
    view.resolved = {};
    Object.entries(selected().objects).forEach(([slot, requested]) => {
      view.resolved[slot] = C().resolveChoice(requested) || C().resolveChoice(DEFAULTS.scenes[view.state.scene].objects[slot]);
    });
  }
  function zoneLabel(zone) {
    if (zone.startsWith('plate-')) return L((Number(zone.slice(6)) + 1) + '번 접시', 'Plate ' + (Number(zone.slice(6)) + 1));
    if (zone === 'station') return view.state.scene === 'fire' ? L('소방서', 'Fire station') : L('경찰서', 'Police station');
    return ({ road: L('출동한 곳', 'On the road'), waiting: L('오고 있어요', 'On the way'), tray: L('바구니', 'Basket'), left: L('왼쪽', 'Left'), right: L('오른쪽', 'Right') })[zone] || zone;
  }
  function stageCaption(s, style, lang) {
    const o = s.operands, en = lang === 'en';
    if (s.captionKey === 'fire.depart') return o.b ? en ? named(o.b, 'main', style, lang) + (o.b === 1 ? ' heads out.' : ' head out.') : named(o.b, 'main', style, lang) + ' 출동해요' : en ? 'No one heads out. They stay here.' : '출동 없이 그대로 있어요';
    if (s.captionKey === 'fire.return') return o.b ? en ? named(o.b, 'main', style, lang) + (o.b === 1 ? ' comes back.' : ' come back.') : named(o.b, 'main', style, lang) + ' 돌아와요' : en ? 'No one comes back. The number stays the same.' : '돌아올 그림 없이 그대로 있어요';
    if (s.captionKey === 'police.arrive') return o.b ? en ? named(o.b, 'arrival', style, lang) + (o.b === 1 ? ' arrives.' : ' arrive.') : named(o.b, 'arrival', style, lang) + ' 도착해요' : en ? 'No arrivals. The number stays the same.' : '오는 그림 없이 그대로 있어요';
    if (s.captionKey === 'police.depart') return o.b ? en ? quantity(o.b, style, lang) + (o.b === 1 ? ' heads out.' : ' head out.') : quantity(o.b, style, lang) + ' 다시 출동해요' : en ? 'No one heads out. The number stays the same.' : '출동 없이 그대로 있어요';
    if (s.captionKey === 'snack.deliver') return o.b ? en ? named(o.b, 'arrival', style, lang) + (o.b === 1 ? ' is delivered.' : ' are delivered.') : named(o.b, 'arrival', style, lang) + ' 배달 왔어요' : en ? 'There is no delivery. The basket stays empty.' : '배달 없이 빈 바구니 그대로예요';
    if (s.captionKey === 'snack.share') return en ? 'Share ' + quantity(o.total, style, lang) + ' among ' + count(o.groups, style, lang) + (o.groups === 1 ? ' plate.' : ' plates.') : quantity(o.total, style, lang) + ', ' + Q().determiner(o.groups) + ' 곳에 똑같이 나눠요';
    if (s.captionKey === 'neighborhood.compare') return en ? named(o.a, 'left', style, lang) + ' on the left; ' + named(o.b, 'right', style, lang) + ' on the right.' : named(o.a, 'left', style, lang) + ', ' + named(o.b, 'right', style, lang) + ' 비교해요';
    return o.add ? en ? named(o.add, o.target, style, lang) + (o.add === 1 ? ' arrives to make both sides equal.' : ' arrive to make both sides equal.') : named(o.add, o.target, style, lang) + ' 와서 같아져요' : en ? 'Both sides are already equal.' : '양쪽이 이미 같은 수예요';
  }
  function resultText(result, style, lang) {
    const en = lang === 'en';
    if (result.kind === 'share') return en ? 'Each plate has ' + quantity(result.each, style, lang) + '. ' + quantity(result.remainder, style, lang) + (result.remainder === 1 ? ' remains.' : ' remain.')
      : '한 곳에 ' + quantity(result.each, style, lang) + '씩 · 남은 ' + quantity(result.remainder, style, lang);
    if (result.kind === 'compare') return result.difference ? en ? 'The ' + result.relation + ' side has ' + quantity(result.difference, style, lang) + ' more.'
      : (result.relation === 'left' ? '왼쪽에 ' : '오른쪽에 ') + quantity(result.difference, style, lang) + ' 더 있어요'
      : en ? 'Both sides have the same number.' : '양쪽이 같은 수예요';
    return result.count ? en ? quantity(result.count, style, lang) + (result.count === 1 ? ' is here now.' : ' are here now.') : quantity(result.count, style, lang) + ' 있어요'
      : en ? 'None here. Zero.' : '하나도 없어요 · 0';
  }
  function eventNumber(event) {
    if (event.kind === 'pair') return event.pairIndex + 1;
    if (event.kind === 'summary') return event.result.kind === 'count' ? event.result.count : event.result.kind === 'share' ? event.result.each : event.result.difference;
    if (event.kind === 'move') {
      if (view.state.scene === 'fire' || view.state.scene === 'police') return event.countsAfter.station;
      if (view.state.scene === 'snack') return event.countsAfter[event.to];
      return event.countsAfter[event.to];
    }
    const s = view.model.stages[event.stageIndex];
    return s.operator === 'compare' || s.operator === 'equalize' ? Math.abs(s.operands.a - s.operands.b)
      : s.operator === 'share' ? s.operands.total : s.operands.a;
  }
  function narration(event, style, lang) {
    const s = view.model.stages[event.stageIndex], en = lang === 'en', n = eventNumber(event);
    if (event.kind === 'stage') {
      const opening = s.operator === 'subtract' || (s.operator === 'add' && view.state.scene !== 'neighborhood')
        ? (en ? 'Start with ' + quantity(s.operands.a, style, lang) + '. ' : '처음 ' + quantity(s.operands.a, style, lang) + '. ') : '';
      return opening + stageCaption(s, style, lang);
    }
    if (event.kind === 'summary') return resultText(event.result, style, lang);
    if (event.kind === 'pair') return en ? count(n, style, lang) + (n === 1 ? ' pair.' : ' pairs.')
      : (style === 'sino' ? count(n, style, lang) + '. ' : '') + Q().determiner(n) + ' 쌍';
    const remaining = event.to === 'road';
    return count(n, style, lang) + (en ? remaining ? n === 1 ? ' remains.' : ' remain.' : ' here now.' : remaining ? ' 남아요' : ' 있어요');
  }
  function spokenEvent(event) {
    return Object.assign({}, event, { readingStyle: view.state.style, nativeText: narration(event, 'native', 'ko'),
      sinoText: narration(event, 'sino', 'ko'), enText: narration(event, 'native', 'en') });
  }
  function equation(s, reveal) {
    const o = s.operands, r = s.result;
    if (s.operator === 'share') return o.total + ' ÷ ' + o.groups + ' = ' + (reveal ? r.each + L(' · 남음 ', ' · left ') + r.remainder : '?');
    if (s.operator === 'compare') return o.a + ' ↔ ' + o.b + ' · ' + L('차이 ', 'difference ') + (reveal ? r.difference : '?');
    if (s.operator === 'equalize') return o.add ? Math.min(o.a, o.b) + ' + ' + o.add + ' = ' + (reveal ? Math.max(o.a, o.b) : '?') : o.a + ' = ' + o.b;
    return o.a + (s.operator === 'subtract' ? ' − ' : ' + ') + o.b + ' = ' + (reveal ? r.count : '?');
  }
  function toolbarMarkup() {
    const scene = SCENES[view.state.scene], s = selected(), nums = view.state.scene === 'snack' ? s.values.total + L(commonUnit() + ' · ', ' · ') + s.values.groups + L('곳', ' plates') : s.values.a + ', ' + s.values.b;
    return '<button type="button" class="ns-scene-button" data-ns-action="openScene" aria-haspopup="dialog"><span class="ns-scene-icon" aria-hidden="true">' + scene.icon + '</span><span><small>' + L('이야기를 골라요', 'Choose a story') + '</small><strong>' + esc(L(scene.ko, scene.en)) + '</strong></span><span aria-hidden="true">▾</span></button>' +
      '<button type="button" data-ns-action="openNumber" aria-haspopup="dialog"><span aria-hidden="true">①</span><span><strong>' + esc(nums) + '</strong><small>' + L('수 바꾸기', 'Choose numbers') + '</small></span><span aria-hidden="true">▾</span></button>' +
      '<button type="button" data-ns-action="choosePicture" aria-haspopup="dialog"><span class="ns-toolbar-picture">' + C().picture(object(slots()[0])) + '</span><span><strong>' + L('그림 바꾸기', 'Pictures') + '</strong><small class="ns-object-labels">' + esc(slots().map(slot => L(object(slot).nameKo, object(slot).nameEn)).join(' · ')) + '</small></span><span aria-hidden="true">▾</span></button>';
  }
  function zoneMarkup(zone) {
    return '<section class="ns-zone" data-zone-id="' + zone + '"><header><span>' + esc(zoneLabel(zone)) + '</span><strong class="ns-zone-count">' + view.zones[zone].length + '</strong></header>' +
      '<div class="ns-zone-items"></div><p class="ns-zone-empty">' + L('하나도 없어요 · 0', 'None here · 0') + '</p></section>';
  }
  function paint() {
    view.boardObserver?.disconnect();
    const missing = slots().some(slot => view.resolved[slot].missingArtwork);
    view.container.innerHTML = '<section class="ns-root" data-scene="' + view.state.scene + '" data-age="' + view.model.age + '" data-stage="0" data-phase="preview">' +
      '<header class="ns-top"><button type="button" class="ns-icon ns-home" data-ns-action="home" aria-label="' + L('숫자놀이터로', 'Back to number land') + '">⌂</button><h2><small>' + L('그림이 움직이는 수 이야기', 'Moving picture stories') + '</small><strong>' + L('내 그림 우리 동네', 'Our neighborhood') + '</strong></h2><button type="button" class="ns-icon ns-age" data-ns-action="settings" aria-label="' + L('놀이 설정', 'Play settings') + '"><strong>' + view.model.age + '</strong><small>' + L('세 · 설정', 'years') + '</small></button><button type="button" class="ns-icon" data-ns-action="mute" aria-label="' + L(view.state.muted ? '소리 켜기' : '소리 끄기', view.state.muted ? 'Sound on' : 'Mute') + '" aria-pressed="' + view.state.muted + '">' + (view.state.muted ? '🔇' : '🔊') + '</button></header>' +
      '<nav class="ns-toolbar" aria-label="' + L('이야기 고르기', 'Story choices') + '">' + toolbarMarkup() + '</nav>' +
      '<section class="ns-stage"><div class="ns-story-heading"><span class="ns-stage-badge">1 / ' + view.model.stages.length + '</span><p class="ns-caption">' + esc(stageCaption(stage(), view.state.style, language())) + '</p></div>' +
      '<div class="ns-equation">' + esc(equation(stage(), false)) + '</div><div class="ns-prediction" hidden></div>' +
      '<div class="ns-board" tabindex="0" aria-label="' + L('이야기 그림', 'Story pictures') + '"><div class="ns-zones">' + Object.keys(view.zones).map(zoneMarkup).join('') + '</div></div>' +
      '<div class="ns-result" aria-live="polite"><strong class="ns-count-now">' + eventNumber(view.events[0]) + '</strong><span class="ns-result-message">' + L('움직임을 함께 봐요', 'Watch the pictures move') + '</span></div></section>' +
      '<footer class="ns-footer"><div class="ns-readings">' + (language() === 'en' ? '<span class="ns-english">English listening</span>' : '<button type="button" data-ns-action="style" data-value="native" aria-pressed="' + (view.state.style === 'native') + '">하나·둘</button><button type="button" data-ns-action="style" data-value="sino" aria-pressed="' + (view.state.style === 'sino') + '">일·이</button>') + '</div><button type="button" class="ns-replay" data-ns-action="replay">↻ ' + L('다시 보기', 'Replay') + '</button><p class="ns-artwork-note"' + (missing ? '' : ' hidden') + '>' + L('내 그림이 없어 견본으로 놀아요', 'Your picture is missing. We can play with the sample.') + '</p><p class="ns-audio-note" hidden>' + L('소리 없이도 함께 볼 수 있어요', 'We can keep watching without sound.') + '</p></footer></section>';
    view.nodes = new Map();
    view.model.entities.forEach(entity => {
      const selectedObject = object(entity.slot), resolved = view.resolved[entity.slot];
      const node = document.createElement('div'); node.className = 'ns-item';
      node.dataset.itemId = entity.id; node.dataset.objectSlot = entity.slot; node.dataset.objectId = selectedObject.id;
      node.dataset.sourceKind = resolved.actual.sourceKind; node.dataset.requestedSourceKind = resolved.requested.sourceKind;
      node.setAttribute('aria-label', L(selectedObject.nameKo, selectedObject.nameEn));
      node.innerHTML = C().picture(selectedObject) + '<span class="ns-item-number" aria-hidden="true">' + entity.ordinal + '</span>';
      view.nodes.set(entity.id, node);
    });
    Object.keys(view.zones).forEach(layoutZone); updateZoneVisibility(); C().preparePictures(root());
    if (typeof ResizeObserver === 'function') { view.boardObserver = new ResizeObserver(scheduleFocus); view.boardObserver.observe(root().querySelector('.ns-board')); }
  }
  function layoutZone(zone) {
    const section = root().querySelector('.ns-zone[data-zone-id="' + zone + '"]'), holder = section.querySelector('.ns-zone-items'), ids = view.zones[zone];
    // Detach and reparent the same nodes, including while building ten-frames.
    holder.replaceChildren();
    if (view.model.presentation.tenFrames) {
      for (let start = 0; start < ids.length; start += 10) {
        const group = ids.slice(start, start + 10), full = group.length === 10;
        const frame = document.createElement('div'); frame.className = full ? 'ns-ten-frame' : 'ns-ones';
        frame.dataset.zoneId = zone; frame.dataset.frameIndex = String(Math.floor(start / 10));
        const label = document.createElement('span'); label.className = 'ns-frame-label'; label.textContent = full ? L('열 묶음 · 10', 'A ten · 10') : L('낱개 · ', 'Ones · ') + group.length;
        const grid = document.createElement('div'); grid.className = 'ns-frame-items';
        group.forEach(id => grid.appendChild(view.nodes.get(id))); frame.append(label, grid); holder.appendChild(frame);
      }
    } else ids.forEach(id => holder.appendChild(view.nodes.get(id)));
    section.querySelector('.ns-zone-count').textContent = String(ids.length); section.querySelector('.ns-zone-empty').hidden = ids.length > 0;
  }
  function updateZoneVisibility() {
    const scene = view.state.scene, current = stage();
    root().querySelectorAll('.ns-zone').forEach(section => {
      const zone = section.dataset.zoneId;
      let hidden = false;
      if (scene === 'police') hidden = zone === 'road' && view.stageIndex === 0 || zone === 'waiting' && view.stageIndex > 0;
      else if (scene === 'snack') hidden = zone.startsWith('plate-') && current.operator === 'add' || zone === 'waiting' && current.operator !== 'add';
      else if (scene === 'neighborhood') hidden = zone === 'waiting' && view.zones.waiting.length === 0;
      section.hidden = hidden;
    });
  }
  function scheduleFocus() {
    if (view.scrollFrame) cancelAnimationFrame(view.scrollFrame);
    view.scrollFrame = requestAnimationFrame(() => { view.scrollFrame = 0; focusCurrent(); });
  }
  function focusCurrent() {
    if (!view.container || view.dialog) return;
    const board = root()?.querySelector('.ns-board'), nodes = Array.from(root()?.querySelectorAll('.ns-item.is-current') || []);
    if (!board || !nodes.length) return;
    const rects = nodes.map(node => node.getBoundingClientRect()), bounds = board.getBoundingClientRect();
    const header = Math.max(...nodes.map(node => node.closest('.ns-zone')?.querySelector('header')?.getBoundingClientRect().height || 0));
    const top = Math.min(...rects.map(rect => rect.top)), bottom = Math.max(...rects.map(rect => rect.bottom));
    const visibleTop = bounds.top + board.clientTop + header + 4, visibleBottom = bounds.top + board.clientTop + board.clientHeight - 4;
    if (bottom > visibleBottom) board.scrollTop += bottom - visibleBottom;
    if (top < visibleTop) board.scrollTop -= visibleTop - top;
  }
  function showEvent(event) {
    view.currentEvent = copy(event); view.stageIndex = event.stageIndex;
    const section = root(); if (!section) return;
    section.querySelectorAll('.ns-item.is-current').forEach(node => node.classList.remove('is-current'));
    view.phase = event.kind;
    if (event.kind === 'move') {
      const source = view.zones[event.from], index = source.indexOf(event.itemId), node = view.nodes.get(event.itemId);
      if (index < 0 || !node) throw new Error('A story move must keep its original node.');
      source.splice(index, 1); view.zones[event.to].push(event.itemId);
      layoutZone(event.from); layoutZone(event.to); node.classList.add('is-current');
      if (view.state.scene === 'neighborhood') {
        const other = event.to === 'left' ? 'right' : 'left', paired = view.nodes.get(view.zones[other][view.zones[event.to].length - 1]);
        node.classList.add('is-paired'); node.classList.remove('is-extra');
        if (paired) { paired.classList.add('is-current', 'is-paired'); paired.classList.remove('is-extra'); }
      }
    } else if (event.kind === 'pair') {
      [event.leftId, event.rightId].forEach(id => view.nodes.get(id).classList.add('is-current', 'is-paired'));
    } else if (event.kind === 'summary' && event.result.kind === 'compare') {
      ['left', 'right'].forEach(side => view.zones[side].forEach((id, index) => {
        const node = view.nodes.get(id); node.classList.toggle('is-extra', index >= event.result.pairCount); node.classList.toggle('is-paired', index < event.result.pairCount);
      }));
    }
    updateZoneVisibility();
    section.dataset.stage = String(view.stageIndex); section.dataset.phase = view.phase;
    section.querySelector('.ns-stage-badge').textContent = (view.stageIndex + 1) + ' / ' + view.model.stages.length;
    section.querySelector('.ns-caption').textContent = stageCaption(stage(), view.state.style, language());
    section.querySelector('.ns-equation').textContent = equation(stage(), event.kind === 'summary');
    section.querySelector('.ns-count-now').textContent = String(eventNumber(event));
    section.querySelector('.ns-result-message').textContent = event.kind === 'summary' ? resultText(event.result, view.state.style, language())
      : event.kind === 'pair' ? L('하나씩 짝지어요', 'Matching one by one') : event.kind === 'stage' ? L('움직임을 함께 봐요', 'Watch the pictures move') : narration(event, view.state.style, language());
    section.querySelector('.ns-result').classList.toggle('is-summary', event.kind === 'summary');
    focusCurrent(); scheduleFocus();
  }
  function stop() {
    view.runId++; view.sequence?.stop();
    if (view.predictionTimer) clearTimeout(view.predictionTimer); view.predictionTimer = 0;
  }
  function finish() {
    view.complete = true; view.phase = 'complete';
    if (root()) { root().dataset.phase = 'complete'; root().querySelectorAll('.is-current').forEach(node => node.classList.remove('is-current')); }
  }
  function startRemaining() {
    if (!view.container || view.dialog || document.hidden || document.getElementById('playSettingsDialog') || view.error || view.complete) return;
    stop(); const ticket = view.runId, offset = view.eventIndex + 1;
    root().querySelector('.ns-prediction').hidden = true;
    if (offset >= view.events.length) { finish(); return; }
    view.sequence.start(view.events.slice(offset).map(spokenEvent), { muted: view.state.muted, delayMs: 130,
      onStep: (event, index) => {
        if (!view.container || ticket !== view.runId) return;
        view.eventIndex = offset + index; showEvent(event);
      },
      onError: error => {
        if (!view.container || ticket !== view.runId) return;
        const note = root().querySelector('.ns-audio-note');
        if (error.code.startsWith('AUDIO_')) view.audioFailed = true;
        else { view.error = error.code; view.phase = 'error'; note.textContent = L('다시 보기로 한 번 더 해 봐요', 'Try watching it again.'); }
        note.hidden = false;
      },
      onEnd: () => { if (view.container && ticket === view.runId) finish(); }
    });
  }
  function preparePrediction() {
    const result = view.model.stages[0].result;
    const expected = result.kind === 'compare' ? result.relation === 'equal' ? 'equal' : 'different' : String(result.kind === 'count' ? result.count : result.each);
    const alternative = result.kind === 'compare' ? expected === 'equal' ? 'different' : 'equal' : String(Number(expected) === 30 ? 29 : Number(expected) + 1);
    const label = value => value === 'equal' ? L('같아요', 'Equal') : value === 'different' ? L('달라요', 'Different') : value + (result.kind === 'share' ? L(commonUnit() + '씩', ' each') : '');
    view.prediction = { status: 'waiting', choices: [expected, alternative].sort().map(value => ({ value, label: label(value) })), expected, selected: null, correct: null };
  }
  function waitForPrediction() {
    if (!view.prediction || view.prediction.status !== 'waiting') { startRemaining(); return; }
    stop(); const ticket = view.runId, panel = root().querySelector('.ns-prediction');
    view.phase = 'prediction'; root().dataset.phase = view.phase; panel.hidden = false;
    panel.innerHTML = '<p>' + L('어떻게 될까요? 그냥 보아도 괜찮아요', 'What will happen? You can just watch, too.') + '</p><div>' + view.prediction.choices.map(choice => '<button type="button" data-ns-action="prediction" data-value="' + choice.value + '">' + esc(choice.label) + '</button>').join('') + '<button type="button" data-ns-action="skip">' + L('바로 보기', 'Watch now') + '</button></div>';
    view.predictionTimer = setTimeout(() => {
      view.predictionTimer = 0;
      if (!view.container || ticket !== view.runId || view.dialog || document.hidden) return;
      view.prediction.status = 'elapsed'; startRemaining();
    }, 3000);
  }
  function resume() {
    if (!view.container || view.dialog || document.hidden || document.getElementById('playSettingsDialog') || view.error) return;
    if (view.pendingRestart || view.model.age !== age() || view.capturedLanguage !== language()) { restart(); return; }
    if (view.complete) return;
    if (view.prediction?.status === 'waiting') waitForPrediction(); else startRemaining();
  }
  function restart() {
    if (!view.container || !view.state || !view.sequence) return;
    stop(); view.dialog = null; view.pendingRestart = false; view.error = null; view.complete = false; view.audioFailed = false;
    resolveObjects(); view.model = M().create({ scene: view.state.scene, age: age(), values: selected().values });
    view.capturedLanguage = language(); view.zones = copy(view.model.initialZones); view.events = view.model.stages.flatMap(s => s.events);
    view.stageIndex = 0; view.eventIndex = -1; view.currentEvent = null; view.phase = 'preview'; view.prediction = null;
    if (view.model.presentation.prediction) preparePrediction();
    paint(); resume();
  }
  function termLabel(term) {
    const scene = view.state.scene;
    if (term === 'total') return L('나눌 수', 'Total');
    if (term === 'groups') return L('접시 수', 'Plates');
    if (scene === 'neighborhood') return term === 'a' ? L('왼쪽 수', 'Left') : L('오른쪽 수', 'Right');
    return term === 'a' ? L('처음 수', 'Start') : scene === 'fire' ? L('떠날 수', 'Heading out') : L('오는 수', 'Arriving');
  }
  function numberAllowed(n) {
    if (!view.dialog || view.dialog.kind !== 'numbers') return false;
    const values = Object.assign({}, selected().values, { [view.dialog.term]: n });
    try { M().create({ scene: view.state.scene, age: 4, values }); return true; } catch (_) { return false; }
  }
  function categoryOptions(objects) {
    return [['vehicle', '🚓', L('탈것', 'Vehicles')], ['food', '🍎', L('음식', 'Food')], ['toy', '🧸', L('장난감', 'Toys')], ['art', '🎨', L('그림판', 'Pictures')]]
      .filter(category => objects.some(item => item.category === category[0]));
  }
  function dialogContents() {
    const dialog = view.dialog;
    if (dialog.kind === 'scene') return '<div class="ns-scene-choices">' + Object.entries(SCENES).map(([id, scene]) => {
      const values = view.state.scenes[id].values;
      const expression = id === 'snack' ? values.total + ' ÷ ' + values.groups : values.a + (id === 'fire' ? ' − ' : id === 'police' ? ' + ' : ' ↔ ') + values.b;
      return '<button type="button" data-ns-action="scene" data-value="' + id + '" aria-pressed="' + (id === view.state.scene) + '"><span aria-hidden="true">' + scene.icon + '</span><strong>' + esc(L(scene.ko, scene.en)) + '</strong><small>' + expression + '</small></button>';
    }).join('') + '</div>';
    if (dialog.kind === 'numbers') {
      const values = selected().values, terms = view.state.scene === 'snack' ? ['total', 'groups'] : ['a', 'b'];
      const numbers = dialog.term === 'groups' ? [1, 2, 3, 4, 5, 6] : Array.from({ length: dialog.range === 0 ? 11 : 10 }, (_, i) => dialog.range === 0 ? i : dialog.range === 1 ? i + 11 : i + 21);
      return '<div class="ns-choice-tabs ns-term-tabs">' + terms.map(term => '<button type="button" data-ns-action="term" data-value="' + term + '" aria-pressed="' + (dialog.term === term) + '">' + termLabel(term) + ' · ' + values[term] + '</button>').join('') + '</div>' +
        (dialog.term === 'groups' ? '' : '<div class="ns-choice-tabs ns-ranges">' + ['0–10', '11–20', '21–30'].map((label, index) => '<button type="button" data-ns-action="range" data-value="' + index + '" aria-pressed="' + (dialog.range === index) + '">' + label + '</button>').join('') + '</div>') +
        '<div class="ns-number-choices">' + numbers.map(n => '<button type="button" data-ns-action="number" data-value="' + n + '" aria-pressed="' + (values[dialog.term] === n) + '"' + (numberAllowed(n) ? '' : ' disabled') + '>' + n + '</button>').join('') + '</div><p class="ns-dialog-note">' + L('흐린 수는 이 이야기에서 고를 수 없어요', 'Dimmed numbers do not fit this story.') + '</p>';
    }
    const objects = C().listChoices({ sourceKind: dialog.sourceKind }).filter(item => C().isValid(item));
    const categories = categoryOptions(objects), selectedRef = selected().objects[dialog.slot];
    if (!categories.some(category => category[0] === dialog.category)) dialog.category = categories[0]?.[0] || 'art';
    return '<div class="ns-choice-tabs ns-slot-tabs">' + slots().map(slot => '<button type="button" data-ns-action="slot" data-value="' + slot + '" aria-pressed="' + (dialog.slot === slot) + '">' + slotLabel(slot) + '</button>').join('') + '</div>' +
      '<div class="ns-choice-tabs ns-source-tabs">' + [['recommended', L('추천 그림', 'Samples')], ['artwork', L('내 그림', 'My artwork')]].map(([kind, label]) => '<button type="button" data-ns-action="sourceKind" data-value="' + kind + '" aria-pressed="' + (dialog.sourceKind === kind) + '">' + label + '</button>').join('') + '</div>' +
      '<div class="ns-categories">' + categories.map(category => '<button type="button" data-ns-action="category" data-value="' + category[0] + '" aria-pressed="' + (dialog.category === category[0]) + '"><span aria-hidden="true">' + category[1] + '</span>' + category[2] + '</button>').join('') + '</div>' +
      '<div class="ns-picture-choices">' + (objects.length ? objects.filter(item => item.category === dialog.category).map(item => '<button type="button" class="ns-object-choice" data-ns-action="object" data-value="' + esc(item.id) + '" data-source-kind="' + dialog.sourceKind + '" aria-label="' + esc(L(item.nameKo, item.nameEn)) + '" aria-pressed="' + (selectedRef.id === item.id && selectedRef.sourceKind === dialog.sourceKind) + '">' + C().picture(item) + '<span>' + esc(L(item.nameKo, item.nameEn)) + '</span></button>').join('') : '<p class="ns-empty-art">' + L('아직 칠한 내 그림이 없어요. 추천 그림으로 놀 수 있어요.', 'There is no painted artwork yet. You can play with the samples.') + '</p>') + '</div>';
  }
  function paintDialog() {
    if (!view.dialog || !root()) return;
    const active = document.activeElement, action = active?.dataset?.nsAction, value = active?.dataset?.value;
    root().querySelector('.ns-overlay')?.remove();
    const overlay = document.createElement('div'); overlay.className = 'ns-overlay';
    const title = view.dialog.kind === 'scene' ? L('어떤 이야기로 놀까요?', 'Choose a story') : view.dialog.kind === 'numbers' ? L('수를 골라요', 'Choose numbers') : L('어떤 그림으로 놀까요?', 'Choose pictures');
    overlay.innerHTML = '<section class="ns-dialog" data-dialog-kind="' + view.dialog.kind + '" role="dialog" aria-modal="true" aria-labelledby="ns-dialog-title"><header><h3 id="ns-dialog-title">' + title + '</h3><button type="button" data-ns-action="closeDialog" aria-label="' + L('선택창 닫기', 'Close choices') + '">✕</button></header><div class="ns-dialog-content">' + dialogContents() + '</div></section>';
    root().appendChild(overlay); C().preparePictures(overlay);
    const retained = Array.from(overlay.querySelectorAll('[data-ns-action]')).find(button => button.dataset.nsAction === action && button.dataset.value === value);
    (retained || overlay.querySelector('[data-ns-action="closeDialog"]')).focus({ preventScroll: true });
  }
  function openDialog(kind) {
    stop();
    const term = view.state.scene === 'snack' ? 'total' : 'a', slot = slots()[0], n = selected().values[term], requested = selected().objects[slot];
    view.dialog = { kind, term, slot, range: n <= 10 ? 0 : n <= 20 ? 1 : 2, sourceKind: requested.sourceKind, category: object(slot).category || 'art' };
    paintDialog();
  }
  function closeDialog() {
    const kind = view.dialog?.kind; view.dialog = null; root()?.querySelector('.ns-overlay')?.remove(); resume();
    root()?.querySelector('[data-ns-action="' + (kind === 'scene' ? 'openScene' : kind === 'numbers' ? 'openNumber' : 'choosePicture') + '"]')?.focus({ preventScroll: true });
  }
  function openSettings() {
    stop(); const open = view.options.openSettings || window.SihyeonPlaySettings?.openSettings;
    if (typeof open !== 'function') { resume(); return; }
    open(); view.settingsObserver?.disconnect();
    if (!document.getElementById('playSettingsDialog')) { resume(); return; }
    view.settingsObserver = new MutationObserver(() => {
      if (document.getElementById('playSettingsDialog')) return;
      view.settingsObserver?.disconnect(); view.settingsObserver = null; resume();
    });
    view.settingsObserver.observe(document.body, { childList: true });
  }
  function onClick(event) {
    if (view.dialog && event.target === root()?.querySelector('.ns-overlay')) { closeDialog(); return; }
    const button = event.target.closest?.('[data-ns-action]');
    if (!button || !view.container?.contains(button) || button.disabled) return;
    const action = button.dataset.nsAction, value = button.dataset.value;
    if (action === 'home') { const close = view.options.closeToParkHome; destroy(); close?.(); return; }
    if (!view.state) return;
    if (action === 'replay') { restart(); return; }
    if (view.error) return;
    if (action === 'settings') { openSettings(); return; }
    if (action === 'openScene') { openDialog('scene'); return; }
    if (action === 'openNumber') { openDialog('numbers'); return; }
    if (action === 'choosePicture') { openDialog('pictures'); return; }
    if (action === 'closeDialog') { closeDialog(); return; }
    if (action === 'scene' && SCENES[value]) { view.state.scene = value; save(); restart(); return; }
    if (action === 'term' && view.dialog?.kind === 'numbers' && Object.hasOwn(selected().values, value)) {
      view.dialog.term = value; const n = selected().values[value]; view.dialog.range = n <= 10 ? 0 : n <= 20 ? 1 : 2; paintDialog(); return;
    }
    if (action === 'range' && view.dialog?.kind === 'numbers' && ['0', '1', '2'].includes(value)) { view.dialog.range = Number(value); paintDialog(); return; }
    if (action === 'number' && numberAllowed(Number(value))) { selected().values[view.dialog.term] = Number(value); save(); restart(); return; }
    if (action === 'slot' && view.dialog?.kind === 'pictures' && slots().includes(value)) {
      view.dialog.slot = value; view.dialog.sourceKind = selected().objects[value].sourceKind; view.dialog.category = object(value).category || 'art'; paintDialog(); return;
    }
    if (action === 'sourceKind' && view.dialog?.kind === 'pictures' && ['recommended', 'artwork'].includes(value)) { view.dialog.sourceKind = value; paintDialog(); return; }
    if (action === 'category' && view.dialog?.kind === 'pictures' && ['vehicle', 'food', 'toy', 'art'].includes(value)) { view.dialog.category = value; paintDialog(); return; }
    if (action === 'object' && view.dialog?.kind === 'pictures') {
      const choice = C().listChoices({ sourceKind: view.dialog.sourceKind }).find(item => item.id === value);
      if (choice) { selected().objects[view.dialog.slot] = { id: value, sourceKind: view.dialog.sourceKind }; save(); restart(); }
      return;
    }
    if ((action === 'prediction' || action === 'skip') && view.prediction?.status === 'waiting') {
      if (action === 'prediction' && !view.prediction.choices.some(choice => choice.value === value)) return;
      view.prediction.status = action === 'skip' ? 'skipped' : 'answered'; view.prediction.selected = action === 'skip' ? null : value;
      view.prediction.correct = action === 'skip' ? null : value === view.prediction.expected; startRemaining(); return;
    }
    if (action === 'style' && ['native', 'sino'].includes(value)) { view.state.style = value; save(); restart(); return; }
    if (action === 'mute') { view.state.muted = !view.state.muted; save(); restart(); }
  }
  function onKey(event) {
    if (!view.dialog) return;
    if (event.key === 'Escape') { event.preventDefault(); closeDialog(); return; }
    if (event.key !== 'Tab') return;
    const buttons = Array.from(root().querySelectorAll('.ns-dialog button')).filter(button => !button.disabled), first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  function render(container, options) {
    destroy(); view.container = container; view.options = options || {}; view.error = null;
    if (!container) return;
    if (typeof M()?.create !== 'function' || typeof Q()?.countWord !== 'function' || typeof C()?.resolveChoice !== 'function' || typeof C()?.listChoices !== 'function' || typeof window.SihyeonQuantitySequencer?.create !== 'function') {
      view.error = 'dependencies-unavailable'; view.state = null; view.model = null;
      container.innerHTML = '<section class="ns-root ns-load-error"><h2>이야기 놀이를 다시 열어 주세요</h2><button type="button" data-ns-action="home">⌂ 숫자놀이터로</button></section>';
      view.handlers = { click: onClick }; container.addEventListener('click', onClick); return;
    }
    load(); view.sequence = window.SihyeonQuantitySequencer.create(); view.dialog = null;
    view.handlers = { click: onClick, key: onKey, resize: scheduleFocus,
      settings: () => { view.pendingRestart = true; stop(); resume(); },
      visibility: () => { if (document.hidden) stop(); else resume(); } };
    container.addEventListener('click', onClick); container.addEventListener('keydown', onKey);
    window.addEventListener('sihyeon-settings-change', view.handlers.settings); document.addEventListener('visibilitychange', view.handlers.visibility);
    window.addEventListener('resize', scheduleFocus); window.addEventListener('orientationchange', scheduleFocus); restart();
  }
  function destroy() {
    stop(); view.settingsObserver?.disconnect(); view.settingsObserver = null; view.boardObserver?.disconnect(); view.boardObserver = null;
    if (view.scrollFrame) cancelAnimationFrame(view.scrollFrame); view.scrollFrame = 0;
    if (view.handlers) {
      view.container?.removeEventListener('click', view.handlers.click);
      if (view.handlers.key) view.container?.removeEventListener('keydown', view.handlers.key);
      if (view.handlers.settings) window.removeEventListener('sihyeon-settings-change', view.handlers.settings);
      if (view.handlers.visibility) document.removeEventListener('visibilitychange', view.handlers.visibility);
      if (view.handlers.resize) { window.removeEventListener('resize', view.handlers.resize); window.removeEventListener('orientationchange', view.handlers.resize); }
    }
    view.container = null; view.options = {}; view.sequence = null; view.handlers = null; view.dialog = null; view.nodes.clear();
  }
  function getSnapshot() {
    const section = root(), actualZones = {};
    section?.querySelectorAll('.ns-zone').forEach(zone => { actualZones[zone.dataset.zoneId] = Array.from(zone.querySelectorAll('.ns-item'), item => item.dataset.itemId); });
    const actualIds = Object.values(actualZones).flat(), resolved = {};
    Object.entries(view.resolved).forEach(([slot, value]) => {
      const item = value.object;
      resolved[slot] = { requested: copy(value.requested), actual: copy(value.actual), missingArtwork: value.missingArtwork,
        object: { id: item.id, nameKo: item.nameKo, nameEn: item.nameEn, pluralEn: item.pluralEn, unitKo: item.unitKo, fromArtwork: item.fromArtwork === true, artTemplateId: item.artTemplateId || null, artVersion: item.artVersion || null } };
    });
    return { active: !!view.container, error: view.error, state: view.state ? copy(view.state) : null, model: view.model ? copy(view.model) : null,
      scene: view.state?.scene || null, age: view.model?.age || age(), language: language(), readingStyle: view.state?.style || 'native', muted: view.state?.muted === true,
      base: view.model ? copy(view.model.base) : null, generated: view.model ? copy(view.model.generated) : null, result: view.model ? copy(view.model.result) : null,
      stageIndex: view.stageIndex, eventIndex: view.eventIndex, currentEvent: view.currentEvent ? copy(view.currentEvent) : null,
      currentStage: view.model ? copy(view.model.stages[view.stageIndex]) : null, totalEvents: view.events.length,
      actualZones, actualCounts: Object.fromEntries(Object.entries(actualZones).map(([zone, ids]) => [zone, ids.length])), actualIds, actualCount: actualIds.length,
      currentIds: Array.from(section?.querySelectorAll('.ns-item.is-current') || [], node => node.dataset.itemId),
      tenFrames: Array.from(section?.querySelectorAll('.ns-ten-frame') || [], frame => ({ zone: frame.dataset.zoneId, index: Number(frame.dataset.frameIndex), ids: Array.from(frame.querySelectorAll('.ns-item'), node => node.dataset.itemId) })),
      selections: view.state ? copy(selected().objects) : null, resolved,
      prediction: view.prediction ? Object.assign(copy(view.prediction), { timerActive: !!view.predictionTimer }) : { status: 'inactive', timerActive: false },
      phase: view.phase, complete: view.complete, dialog: view.dialog ? copy(view.dialog) : null, audioFailed: view.audioFailed,
      storage: Object.assign({ memoryAvailable: !!memory }, view.storage), sequence: view.sequence?.getSnapshot() || null };
  }
  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[KEY] = { id: KEY, title: '내 그림 우리 동네', render, destroy, getSnapshot };
})();
