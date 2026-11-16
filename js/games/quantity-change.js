/* Picture comparison and subtraction. The original objects keep their identities. */
(function () {
  'use strict';

  const KEY = 'quantityChange';
  const SAVE_KEY = 'sihyeon-quantity-change-v1';
  const DEFAULTS = {
    version: 1, mode: 'compare',
    compare: { a: 15, b: 12, aId: 'pump_engine', bId: 'korean_police_car', activeTerm: 'a', aSourceKind: 'recommended', bSourceKind: 'recommended' },
    subtract: { a: 15, b: 4, objectId: 'pump_engine', activeTerm: 'b', objectSourceKind: 'recommended' },
    style: 'native', muted: false
  };
  const view = {
    container: null, options: {}, objects: [], state: null, model: null, sequence: null,
    handlers: null, settingsObserver: null, boardObserver: null, scrollFrame: 0,
    range: 0, category: 'vehicle', dialog: null, runId: 0, phase: 'idle',
    matchedPairs: 0, extrasShown: 0, moved: 0, current: null,
    complete: false, audioFailed: false, error: null,
    choiceSourceKind: 'recommended', choiceObjects: [], choices: {},
    storage: { read: 'unread', write: 'unwritten' }
  };
  let memory = null;
  const M = () => window.SihyeonQuantityPlayModel;
  const C = () => window.SihyeonPlayObjects;
  const copy = value => JSON.parse(JSON.stringify(value));
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const language = () => window.SihyeonPlaySettings?.getLanguage?.() === 'en' ? 'en' : 'ko';
  function age() {
    const n = window.SihyeonPlaySettings?.getAge?.() || view.options.ageMode;
    return [4, 5, 6, 7].includes(n) ? n : 4;
  }
  function values() { return view.state[view.state.mode]; }
  function selectedSlot() { return view.state.mode === 'compare' ? values().activeTerm : 'object'; }
  function reference(slot) { return { id: values()[slot + 'Id'], sourceKind: values()[slot + 'SourceKind'] }; }
  function selectedRef() { return reference(selectedSlot()); }
  function item(slot) { return view.choices[slot].object; }
  function captureChoices() {
    // A run owns its resolved pictures. Moving a node or changing the number
    // range must not replace personal paint midway through the sequence.
    view.choices = {};
    (view.state.mode === 'compare' ? ['a', 'b'] : ['object']).forEach(slot => {
      view.choices[slot] = C().resolveChoice(reference(slot));
    });
  }
  function refreshChoiceList(kind) {
    view.choiceSourceKind = kind === 'artwork' ? 'artwork' : 'recommended';
    view.choiceObjects = C().listChoices({ sourceKind: view.choiceSourceKind });
  }
  function missingArtwork() { return Object.values(view.choices).some(choice => choice.missingArtwork); }
  function choiceSnapshot() {
    return Object.fromEntries(Object.entries(view.choices).map(([slot, choice]) => [slot, {
      requested: Object.assign({}, choice.requested), actual: Object.assign({}, choice.actual),
      missingArtwork: choice.missingArtwork, artVersion: choice.object.artVersion || null,
      fromArtwork: choice.object.fromArtwork === true
    }]));
  }
  function pictureLabel(slot) { return (view.choices[slot].actual.sourceKind === 'artwork' ? '내 그림 ' : '추천 그림 ') + item(slot).nameKo; }
  function sourceBadge(slot) { return view.choices[slot].actual.sourceKind === 'artwork' ? '<span class="qc-source-badge" aria-hidden="true">내</span>' : ''; }
  function selectedNumber() { const s = values(); return s[s.activeTerm]; }
  function commonUnit() {
    return view.state.mode === 'subtract' ? item('object').unitKo
      : item('a').unitKo === item('b').unitKo ? item('a').unitKo : '개';
  }
  function plainQuantity(n, unit) { return M().determiner(n) + ' ' + unit; }
  function syncPicker() {
    const n = selectedNumber();
    view.range = n <= 10 ? 0 : n <= 20 ? 1 : 2;
    const selected = selectedRef();
    view.category = (view.objects.find(object => object.id === selected.id) || view.objects[0]).category || 'toy';
    refreshChoiceList(selected.sourceKind);
  }
  function save() {
    memory = copy(view.state);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(memory)); view.storage.write = 'saved'; }
    catch (_) { view.storage.write = 'memory-only'; }
  }
  function load() {
    let saved = memory;
    view.storage = { read: saved ? 'memory' : 'unread', write: 'unwritten' };
    if (!saved) {
      try { saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); view.storage.read = saved ? 'storage' : 'empty'; }
      catch (_) { view.storage.read = 'unavailable'; }
    }
    const state = copy(DEFAULTS);
    if (saved?.version === 1) {
      if (['compare', 'subtract'].includes(saved.mode)) state.mode = saved.mode;
      const compared = saved.compare;
      if (compared && M().isQuantity(compared.a) && M().isQuantity(compared.b)) {
        state.compare.a = compared.a; state.compare.b = compared.b;
      }
      const subtracted = saved.subtract;
      if (subtracted && M().isQuantity(subtracted.a) && M().isQuantity(subtracted.b) && subtracted.b <= subtracted.a) {
        state.subtract.a = subtracted.a; state.subtract.b = subtracted.b;
      }
      ['compare', 'subtract'].forEach(mode => {
        const candidate = saved[mode];
        if (!candidate || typeof candidate !== 'object') return;
        if (['a', 'b'].includes(candidate.activeTerm)) state[mode].activeTerm = candidate.activeTerm;
        (mode === 'compare' ? ['aId', 'bId'] : ['objectId']).forEach(key => {
          if (view.objects.some(object => object.id === candidate[key])) {
            state[mode][key] = candidate[key];
            const sourceKey = key.replace(/Id$/, 'SourceKind');
            state[mode][sourceKey] = candidate[sourceKey] === 'artwork' ? 'artwork' : 'recommended';
          }
        });
      });
      if (['native', 'sino'].includes(saved.style)) state.style = saved.style;
      state.muted = saved.muted === true;
    }
    ['aId', 'bId'].forEach(key => {
      if (!view.objects.some(object => object.id === state.compare[key])) state.compare[key] = view.objects[0].id;
    });
    if (!view.objects.some(object => object.id === state.subtract.objectId)) state.subtract.objectId = view.objects[0].id;
    view.state = state; syncPicker();
  }
  function calculate() {
    const s = values();
    view.model = view.state.mode === 'compare' ? M().comparison(s.a, s.b) : M().subtraction(s.a, s.b);
  }
  function readingStep(id, kind, n, extra) {
    return Object.assign({ id, kind, number: n, readingStyle: view.state.style,
      nativeText: M().countWord(n, 'native'), sinoText: M().countWord(n, 'sino'),
      enText: M().countWord(n, 'sino', 'en') }, extra);
  }
  function steps() {
    const s = values(), model = view.model, unit = commonUnit();
    if (view.state.mode === 'compare') {
      const result = [{ id: 'compare-intro', kind: 'intro',
        text: '왼쪽 ' + plainQuantity(s.a, unit) + ', 오른쪽 ' + plainQuantity(s.b, unit) + '. 하나씩 짝을 지어요.',
        enText: M().countWord(s.a, 'sino', 'en') + ' on the left, ' + M().countWord(s.b, 'sino', 'en') + ' on the right. Let us match them.' }];
      model.pairs.forEach((pair, index) => result.push(readingStep('pair-' + (index + 1), 'pair', index + 1,
        { pairIndex: index, leftId: pair.left.id, rightId: pair.right.id })));
      const extras = model.relation === 'left' ? model.leftExtra : model.rightExtra;
      extras.forEach((object, index) => result.push(readingStep('extra-' + object.id, 'extra', index + 1,
        { itemId: object.id, side: model.relation, extraIndex: index })));
      result.push({ id: 'compare-result', kind: 'summary',
        text: model.difference ? (model.relation === 'left' ? '왼쪽에 ' : '오른쪽에 ') + plainQuantity(model.difference, unit) + ' 더 있어요.' : '양쪽이 같은 수예요.',
        enText: model.difference ? 'The ' + model.relation + ' side has ' + M().countWord(model.difference, 'sino', 'en') + ' more.' : 'Both sides have the same number.' });
      return result;
    }
    const result = [{ id: 'subtract-intro', kind: 'intro',
      text: (s.a ? '처음에는 ' + plainQuantity(s.a, unit) + ' 있어요.' : '처음에는 하나도 없어요.') + ' ' + M().countWord(s.b, 'sino') + '만큼 빼 볼까요?',
      enText: 'Start with ' + M().countWord(s.a, 'sino', 'en') + '. Take away ' + M().countWord(s.b, 'sino', 'en') + '.' }];
    model.moves.forEach((move, index) => result.push(readingStep('depart-' + move.item.id, 'depart', move.remainingAfter,
      { itemId: move.item.id, ordinal: index + 1, remainingAfter: move.remainingAfter, departedAfter: move.departedAfter })));
    const remainder = model.remainingCount ? plainQuantity(model.remainingCount, unit) + ' 남아요.' : '남은 그림이 없어요. 영이에요.';
    result.push({ id: 'subtract-result', kind: 'summary', readingStyle: view.state.style,
      nativeText: M().countWord(s.a, 'native') + ' 빼기 ' + M().countWord(s.b, 'native') + '. ' + remainder,
      sinoText: M().countWord(s.a, 'sino') + ' 빼기 ' + M().countWord(s.b, 'sino') + '. ' + remainder,
      enText: M().countWord(s.a, 'sino', 'en') + ' minus ' + M().countWord(s.b, 'sino', 'en') + ' is ' + M().countWord(model.remainingCount, 'sino', 'en') + '.' });
    return result;
  }
  function objectMarkup(object, slot, side) {
    const choice = view.choices[slot], selected = choice.object;
    return '<div class="qc-item" data-item-id="' + esc(object.id) + '" data-object-id="' + esc(selected.id) + '" data-side="' + side +
      '" data-source-kind="' + choice.actual.sourceKind + '" data-requested-source-kind="' + choice.requested.sourceKind + '" data-missing-artwork="' + choice.missingArtwork + '">' +
      C().picture(selected) + '<span class="qc-item-number" aria-hidden="true">' + object.ordinal + '</span></div>';
  }
  function pairMarkup(left, right, index, extra) {
    return '<div class="qc-match-row ' + (extra ? 'qc-extra-row' : 'qc-pair') + '" data-row-index="' + index + '"' + (extra ? '' : ' data-pair-index="' + index + '"') + '>' +
      '<div class="qc-side qc-side-left">' + (left ? objectMarkup(left, 'a', 'left') : '<span class="qc-no-pair" aria-label="왼쪽에는 짝이 없어요">빈 자리</span>') + '</div>' +
      '<span class="qc-pair-link" aria-hidden="true">' + (extra ? '·' : '↔') + '</span><div class="qc-side qc-side-right">' +
      (right ? objectMarkup(right, 'b', 'right') : '<span class="qc-no-pair" aria-label="오른쪽에는 짝이 없어요">빈 자리</span>') + '</div></div>';
  }
  function boardMarkup() {
    const model = view.model, s = values();
    if (view.state.mode === 'compare') {
      if (s.a === 0 && s.b === 0) return '<div class="qc-zero"><div><strong>0</strong><span>＝</span><strong>0</strong></div><p>양쪽 모두 하나도 없어요</p></div>';
      return '<div class="qc-pairs">' + model.pairs.map((pair, index) => pairMarkup(pair.left, pair.right, index, false)).join('') +
        model.leftExtra.map((object, index) => pairMarkup(object, null, model.pairCount + index, true)).join('') +
        model.rightExtra.map((object, index) => pairMarkup(null, object, model.pairCount + index, true)).join('') + '</div>';
    }
    return '<div class="qc-subtract-board"><section class="qc-bucket qc-remaining"><header><span>남은 그림</span><strong data-qc-remaining-count>' + s.a + '</strong></header>' +
      '<div class="qc-remaining-items">' + model.original.map(object => objectMarkup(object, 'object', 'original')).join('') + '</div>' +
      '<p class="qc-bucket-empty" data-qc-remaining-empty' + (s.a ? ' hidden' : '') + '>하나도 없어요 · 0</p></section>' +
      '<section class="qc-bucket qc-departed"><header><span>떠난 그림</span><strong data-qc-departed-count>0</strong></header><div class="qc-departed-items"></div>' +
      '<p class="qc-bucket-empty" data-qc-departed-empty>아직 없어요 · 0</p></section></div>';
  }
  function termMarkup(term) {
    const s = values(), compared = view.state.mode === 'compare';
    const label = compared ? term === 'a' ? '왼쪽' : '오른쪽' : term === 'a' ? '처음 수' : '떠날 수';
    const slot = compared ? term : 'object', selected = item(slot);
    return '<div class="qc-term qc-term-' + term + (s.activeTerm === term ? ' is-selected' : '') + (compared || term === 'a' ? '' : ' qc-number-only') + '" data-term-slot="' + term + '">' +
      (compared || term === 'a' ? '<button type="button" class="qc-term-picture" data-qc-action="choosePicture" data-value="' + (compared ? term : 'source') + '" data-source-kind="' + view.choices[slot].actual.sourceKind + '" aria-label="' + label + ' 그림 바꾸기: ' + esc(pictureLabel(slot)) + '" aria-haspopup="dialog">' + C().picture(selected) + sourceBadge(slot) + '<span aria-hidden="true">▾</span></button>' : '') +
      '<button type="button" class="qc-term-number" data-qc-action="term" data-value="' + term + '" aria-label="' + label + ' 숫자 고르기" aria-pressed="' + (s.activeTerm === term) + '"><small>' + label + '</small><strong>' + s[term] + '<span aria-hidden="true">▾</span></strong></button></div>';
  }
  function expressionMarkup() {
    return view.state.mode === 'compare'
      ? termMarkup('a') + '<span class="qc-operator qc-relation" aria-label="' + ({ left: '왼쪽이 더 많아요', right: '오른쪽이 더 많아요', equal: '같아요' })[view.model.relation] + '">' + ({ left: '&gt;', right: '&lt;', equal: '＝' })[view.model.relation] + '</span>' + termMarkup('b')
      : termMarkup('a') + '<span class="qc-operator" aria-hidden="true">−</span>' + termMarkup('b') + '<span class="qc-operator" aria-hidden="true">＝</span><div class="qc-answer" aria-label="남는 수 ' + view.model.remainingCount + '"><small>남아요</small><strong>' + view.model.remainingCount + '</strong></div>';
  }
  function resultMarkup() {
    const compared = view.state.mode === 'compare', model = view.model;
    return '<span class="qc-result-label">' + (compared ? '차이' : '남는 수') + '</span><strong class="qc-result-number">' + (compared ? model.difference : model.remainingCount) + '<small>' + esc(commonUnit()) + '</small></strong><span class="qc-result-message">' +
      (compared ? ({ left: '왼쪽이 더 많아요', right: '오른쪽이 더 많아요', equal: '같은 수예요' })[model.relation] : '떠난 뒤 남는 그림') + '</span>';
  }
  function categoryOptions() {
    return [['vehicle', '🚓', '탈것'], ['food', '🍎', '음식'], ['toy', '🧸', '장난감'], ['art', '🎨', '그림판']]
      .filter(category => view.objects.some(object => object.category === category[0]));
  }
  function numberAllowed(n) {
    if (!M().isQuantity(n)) return false;
    const s = values();
    return view.state.mode === 'compare' || (s.activeTerm === 'a' ? n >= s.b : n <= s.a);
  }
  function pickerMarkup() {
    const s = values(), current = selectedNumber(), compared = view.state.mode === 'compare';
    const label = compared ? s.activeTerm === 'a' ? '왼쪽 그림' : '오른쪽 그림' : s.activeTerm === 'a' ? '처음 있던 수' : '떠날 그림';
    const low = [0, 11, 21][view.range], high = [10, 20, 30][view.range];
    return '<div class="qc-picker-heading"><span class="qc-picker-dot qc-dot-' + s.activeTerm + '" aria-hidden="true"></span><strong>' + label + '은 몇 개?</strong><span>고르면 바로 시작해요</span></div>' +
      '<div class="qc-ranges" role="group" aria-label="숫자 범위">' + ['0–10', '11–20', '21–30'].map((label, index) => '<button type="button" data-qc-action="range" data-value="' + index + '" aria-pressed="' + (view.range === index) + '">' + label + '</button>').join('') + '</div>' +
      '<div class="qc-numbers" role="group" aria-label="원하는 숫자">' + Array.from({ length: high - low + 1 }, (_, index) => index + low).map(n =>
        '<button type="button" data-qc-action="number" data-value="' + n + '" aria-label="' + n + ' 선택" aria-pressed="' + (n === current) + '"' + (numberAllowed(n) ? '' : ' disabled') + '>' + n + '</button>').join('') + '</div>' +
      '<p class="qc-picker-note">' + (compared ? '양쪽 그림과 숫자를 따로 골라요' : s.activeTerm === 'a' ? '떠날 수보다 많거나 같게 골라요' : '처음 있던 수까지만 떠날 수 있어요') + '</p>';
  }
  function paint() {
    if (!view.container) return;
    view.boardObserver?.disconnect();
    const compared = view.state.mode === 'compare';
    view.container.innerHTML = '<section class="qc-root" data-mode="' + view.state.mode + '" data-age="' + age() + '">' +
      '<header class="qc-top"><button type="button" class="qc-icon qc-home" data-qc-action="home" aria-label="숫자놀이터로">🏠</button><h2>그림으로<br><strong>비교하고 빼기</strong></h2><div class="qc-top-tools"><button type="button" class="qc-icon" data-qc-action="mute" aria-label="' + (view.state.muted ? '소리 켜기' : '소리 끄기') + '" aria-pressed="' + view.state.muted + '">' + (view.state.muted ? '🔇' : '🔊') + '</button><button type="button" class="qc-icon qc-age" data-qc-action="settings" aria-label="놀이 모드 설정"><strong>' + age() + '</strong><small>세 ⚙</small></button></div></header>' +
      '<nav class="qc-modes" aria-label="비교와 빼기"><button type="button" data-qc-action="mode" data-value="compare" aria-pressed="' + compared + '"><span aria-hidden="true">↔</span> 비교하기</button><button type="button" data-qc-action="mode" data-value="subtract" aria-pressed="' + !compared + '"><span aria-hidden="true">−</span> 빼기</button></nav>' +
      '<main class="qc-stage"><div class="qc-expression">' + expressionMarkup() + '</div><div class="qc-result">' + resultMarkup() + '</div>' +
      '<div class="qc-board" role="region" tabindex="0" aria-label="' + (compared ? '양쪽 그림을 짝짓는 놀이판. 스크롤해서 다른 짝도 볼 수 있어요' : '남은 그림과 떠난 그림. 스크롤해서 모두 볼 수 있어요') + '">' + boardMarkup() + '</div>' +
      '<div class="qc-progress" role="status" aria-live="polite"><strong class="qc-count-now">' + (compared ? '0' : values().a) + '</strong><span class="qc-count-word">' + (compared ? '짝을 지어요' : '남아 있어요') + '</span><span class="qc-status">자동으로 시작해요</span></div></main>' +
      '<aside class="qc-picker" aria-label="그림의 수 고르기">' + pickerMarkup() + '</aside><footer class="qc-footer"><div class="qc-readings" role="group" aria-label="수 읽는 방법">' +
      (language() === 'en' ? '<span class="qc-english">🌐 English · one, two</span>' : '<button type="button" data-qc-action="style" data-value="native" aria-pressed="' + (view.state.style === 'native') + '">하나·둘</button><button type="button" data-qc-action="style" data-value="sino" aria-pressed="' + (view.state.style === 'sino') + '">일·이</button>') +
      '</div><button type="button" class="qc-replay" data-qc-action="replay">↻ 다시 보기</button><p class="qc-audio-note qc-artwork-note" data-missing-artwork="' + missingArtwork() + '"' + (missingArtwork() ? '' : ' hidden') + '>' + (missingArtwork() ? '내 그림이 없어 견본으로 놀아요' : '소리 없이도 함께 볼 수 있어요') + '</p></footer></section>';
    C().preparePictures(view.container);
    const board = view.container.querySelector('.qc-board');
    if (typeof window.ResizeObserver === 'function') {
      view.boardObserver = new window.ResizeObserver(scheduleFocus);
      view.boardObserver.observe(board);
    }
  }
  function paintPicker() {
    const picker = view.container?.querySelector('.qc-picker');
    if (picker) picker.innerHTML = pickerMarkup();
    const expression = view.container?.querySelector('.qc-expression');
    if (expression) { expression.innerHTML = expressionMarkup(); C().preparePictures(expression); }
  }
  function pictureChoices() {
    const selected = selectedRef(), personal = view.choiceSourceKind === 'artwork';
    const objects = view.choiceObjects.filter(object => personal || object.category === view.category);
    return '<div class="qc-choice-controls"><div class="qc-source-kinds" role="group" aria-label="그림 출처">' +
      [['recommended', '추천 그림'], ['artwork', '내 그림']].map(([kind, label]) => '<button type="button" data-qc-action="sourceKind" data-value="' + kind + '" aria-pressed="' + (view.choiceSourceKind === kind) + '">' + label + '</button>').join('') + '</div>' +
      (personal ? '' : '<div class="qc-categories" role="group" aria-label="그림 종류">' + categoryOptions().map(category => '<button type="button" data-qc-action="category" data-value="' + category[0] + '" aria-pressed="' + (view.category === category[0]) + '"><span aria-hidden="true">' + category[1] + '</span>' + category[2] + '</button>').join('') + '</div>') + '</div>' +
      '<div class="qc-picture-choices">' + (objects.length ? objects.map(object => '<button type="button" class="qc-object-choice" data-qc-action="object" data-value="' + esc(object.id) + '" data-source-kind="' + object.sourceKind + '" aria-label="' + (personal ? '내 그림 ' : '추천 그림 ') + esc(object.nameKo) + ' 고르기" aria-pressed="' + (selected.id === object.id && selected.sourceKind === object.sourceKind) + '">' + C().picture(object) + '<span>' + esc(object.nameKo) + '</span></button>').join('') :
        '<div class="qc-choice-empty"><p>불러올 내 그림이 없어요.</p><p>그림판에서 먼저 색칠해 보세요.</p><button type="button" data-qc-action="sourceKind" data-value="recommended">추천 그림 보기</button></div>') + '</div>';
  }
  function paintDialog() {
    view.container?.querySelector('.qc-picture-overlay')?.remove();
    if (!view.container || !view.dialog) return;
    const overlay = document.createElement('div'); overlay.className = 'qc-picture-overlay';
    overlay.innerHTML = '<section class="qc-picture-dialog" role="dialog" aria-modal="true" aria-labelledby="qc-dialog-title"><header><h3 id="qc-dialog-title">' +
      (view.state.mode === 'compare' ? values().activeTerm === 'a' ? '왼쪽 그림을 골라요' : '오른쪽 그림을 골라요' : '어떤 그림이 떠날까요?') +
      '</h3><button type="button" data-qc-action="closeDialog" aria-label="그림 선택창 닫기">✕</button></header>' + pictureChoices() + '</section>';
    view.container.querySelector('.qc-root').appendChild(overlay);
    C().preparePictures(overlay);
    overlay.querySelector('[data-qc-action="closeDialog"]').focus();
  }
  function openDialog(term) {
    stop();
    if (view.state.mode === 'compare' && ['a', 'b'].includes(term)) values().activeTerm = term;
    syncPicker(); save(); paintPicker(); view.dialog = 'pictures'; paintDialog();
  }
  function closeDialog() {
    view.dialog = null; run();
    view.container?.querySelector('[data-qc-action="choosePicture"][data-value="' + (view.state.mode === 'compare' ? values().activeTerm : 'source') + '"]')?.focus?.({ preventScroll: true });
  }
  function keepVisible(element) {
    const board = view.container?.querySelector('.qc-board');
    if (!board || !element || view.dialog) return;
    const rect = element.getBoundingClientRect(), bounds = board.getBoundingClientRect();
    const bucket = element.closest('.qc-bucket');
    const inset = bucket && element !== bucket ? (bucket.querySelector('header')?.getBoundingClientRect().height || 0) + 5 : 4;
    const top = bounds.top + board.clientTop + inset, bottom = bounds.top + board.clientTop + board.clientHeight - 4;
    if (rect.bottom > bottom) board.scrollTop += rect.bottom - bottom;
    if (rect.top < top) board.scrollTop -= top - rect.top;
  }
  function focusCurrent() {
    if (!view.container || view.dialog) return;
    const root = view.container.querySelector('.qc-root'), board = root?.querySelector('.qc-board');
    if (!board) return;
    const current = root.querySelector('.qc-match-row.is-current') || root.querySelector('.qc-item.is-current');
    if (current) { keepVisible(current); return; }
    if (view.complete && view.state.mode === 'compare') keepVisible(root.querySelector('.qc-extra-row') || root.querySelector('.qc-match-row:last-child'));
    else if (view.complete) board.scrollTop = 0;
  }
  function scheduleFocus() {
    if (view.scrollFrame) cancelAnimationFrame(view.scrollFrame);
    view.scrollFrame = requestAnimationFrame(() => { view.scrollFrame = 0; focusCurrent(); });
  }
  function showStep(step) {
    const root = view.container?.querySelector('.qc-root');
    if (!root) return;
    view.current = { id: step.id, kind: step.kind, number: step.number ?? null, pairIndex: step.pairIndex ?? null, itemId: step.itemId ?? null };
    root.querySelectorAll('.is-current').forEach(node => node.classList.remove('is-current'));
    let now = 0, word = '', status = '';
    if (step.kind === 'pair') {
      view.phase = 'pairing'; view.matchedPairs = step.pairIndex + 1;
      const pair = root.querySelector('[data-pair-index="' + step.pairIndex + '"]');
      if (!pair) throw new Error('A comparison pair is missing');
      pair.classList.add('is-paired', 'is-current');
      pair.querySelectorAll('.qc-item').forEach(node => node.classList.add('is-paired', 'is-current'));
      now = view.matchedPairs; word = M().countWord(now, view.state.style, language()); status = now + '쌍을 만들었어요';
      keepVisible(pair);
    } else if (step.kind === 'extra') {
      view.phase = 'difference'; view.extrasShown = step.extraIndex + 1;
      const object = root.querySelector('[data-item-id="' + step.itemId + '"]');
      if (!object) throw new Error('An unmatched comparison object is missing');
      object.classList.add('is-extra', 'is-current'); object.closest('.qc-match-row').classList.add('is-current');
      now = view.extrasShown; word = M().countWord(now, view.state.style, language()); status = (step.side === 'left' ? '왼쪽에 ' : '오른쪽에 ') + now + commonUnit() + ' 더 있어요';
      keepVisible(object.closest('.qc-match-row'));
    } else if (step.kind === 'depart') {
      view.phase = 'subtracting'; view.moved = step.departedAfter;
      const object = root.querySelector('[data-item-id="' + step.itemId + '"]'), departed = root.querySelector('.qc-departed-items');
      if (!object || !departed) throw new Error('A departing object or destination is missing');
      // Reparent this exact node: no cloned pictures and no lost original objects.
      departed.appendChild(object); object.classList.add('is-departed', 'is-current');
      root.querySelector('[data-qc-remaining-count]').textContent = String(step.remainingAfter);
      root.querySelector('[data-qc-departed-count]').textContent = String(step.departedAfter);
      root.querySelector('[data-qc-remaining-empty]').hidden = step.remainingAfter !== 0;
      root.querySelector('[data-qc-departed-empty]').hidden = true;
      now = step.remainingAfter; word = now ? M().countWord(now, view.state.style, language()) : '하나도 없어요'; status = step.departedAfter + commonUnit() + ' 떠났어요';
      keepVisible(object);
    } else if (step.kind === 'summary') {
      view.phase = 'summary'; root.classList.add('qc-show-result');
      if (view.state.mode === 'compare') {
        now = view.model.difference; word = now ? '이만큼 차이 나요' : '같은 수예요';
        status = view.model.pairCount + '쌍 · 차이 ' + now + commonUnit();
        keepVisible(root.querySelector('.qc-extra-row') || root.querySelector('.qc-match-row:last-child'));
      } else {
        now = view.model.remainingCount; word = now ? '남은 그림' : '하나도 없어요'; status = values().a + ' − ' + values().b + ' = ' + now;
        root.querySelector('.qc-board').scrollTop = 0;
        if (view.moved === 0) root.querySelector('[data-qc-departed-empty]').textContent = '떠난 그림 없어요 · 0';
      }
    } else {
      view.phase = 'preview'; now = view.state.mode === 'compare' ? 0 : values().a;
      word = view.state.mode === 'compare' ? '하나씩 짝지어요' : '남아 있는 수';
      status = view.state.mode === 'compare' ? '양쪽 그림을 비교해요' : values().b + commonUnit() + ' 떠날 거예요';
    }
    root.dataset.phase = view.phase;
    root.querySelector('.qc-count-now').textContent = String(now);
    root.querySelector('.qc-count-word').textContent = word;
    root.querySelector('.qc-status').textContent = status;
    scheduleFocus();
  }
  function stop() { view.runId++; view.sequence?.stop(); }
  function run() {
    if (!view.container || !view.state || !view.sequence || view.dialog || view.error) return;
    stop(); const ticket = view.runId;
    view.matchedPairs = 0; view.extrasShown = 0; view.moved = 0; view.current = null;
    view.phase = 'preview'; view.complete = false; view.audioFailed = false;
    captureChoices(); calculate(); paint();
    view.sequence.start(steps(), {
      muted: view.state.muted, delayMs: 150,
      onStep: step => { if (view.container && ticket === view.runId) showStep(step); },
      onError: error => {
        if (!view.container || ticket !== view.runId) return;
        const note = view.container.querySelector('.qc-audio-note');
        if (error.code.startsWith('AUDIO_')) view.audioFailed = true;
        else { view.phase = 'error'; if (note && !missingArtwork()) note.textContent = '다시 보기로 한 번 더 해 봐요'; }
        if (note) note.hidden = false;
      },
      onEnd: () => {
        if (!view.container || ticket !== view.runId) return;
        view.complete = true; view.phase = 'complete';
        const root = view.container.querySelector('.qc-root');
        root.classList.add('qc-finished'); root.dataset.phase = 'complete';
        root.querySelectorAll('.is-current').forEach(node => node.classList.remove('is-current'));
        scheduleFocus();
      }
    });
  }
  function changeNumber(n) {
    if (!numberAllowed(n)) return;
    const s = values(); s[s.activeTerm] = n;
    syncPicker(); save(); run();
  }
  function openSettings() {
    stop();
    const open = view.options.openSettings || window.SihyeonPlaySettings?.openSettings;
    if (typeof open !== 'function') { run(); return; }
    open(); view.settingsObserver?.disconnect();
    if (!document.getElementById('playSettingsDialog')) { run(); return; }
    view.settingsObserver = new MutationObserver(() => {
      if (document.getElementById('playSettingsDialog')) return;
      view.settingsObserver?.disconnect(); view.settingsObserver = null;
      if (view.container && !document.hidden && !view.dialog) run();
    });
    view.settingsObserver.observe(document.body, { childList: true });
  }
  function onClick(event) {
    if (view.dialog && event.target === view.container?.querySelector('.qc-picture-overlay')) { closeDialog(); return; }
    const button = event.target.closest?.('[data-qc-action]');
    if (!button || !view.container?.contains(button) || button.disabled) return;
    const action = button.dataset.qcAction, value = button.dataset.value;
    if (action === 'home') { const close = view.options.closeToParkHome; destroy(); close?.(); return; }
    if (!view.state || view.error) return;
    if (action === 'settings') { openSettings(); return; }
    if (action === 'choosePicture') { openDialog(value); return; }
    if (action === 'closeDialog') { closeDialog(); return; }
    if (action === 'mode' && ['compare', 'subtract'].includes(value)) { view.state.mode = value; syncPicker(); save(); run(); return; }
    if (action === 'term' && ['a', 'b'].includes(value)) { values().activeTerm = value; syncPicker(); save(); paintPicker(); return; }
    if (action === 'sourceKind' && ['recommended', 'artwork'].includes(value)) { refreshChoiceList(value); if (view.dialog) paintDialog(); return; }
    if (action === 'range' && ['0', '1', '2'].includes(value)) { view.range = Number(value); paintPicker(); return; }
    if (action === 'category' && categoryOptions().some(category => category[0] === value)) { view.category = value; if (view.dialog) paintDialog(); return; }
    if (action === 'number') { changeNumber(Number(value)); return; }
    if (action === 'object' && view.choiceObjects.some(object => object.id === value && object.sourceKind === button.dataset.sourceKind)) {
      const s = values(), slot = selectedSlot();
      s[slot + 'Id'] = value; s[slot + 'SourceKind'] = button.dataset.sourceKind;
      view.dialog = null; syncPicker(); save(); run(); return;
    }
    if (action === 'style' && ['native', 'sino'].includes(value)) { view.state.style = value; save(); run(); return; }
    if (action === 'mute') { view.state.muted = !view.state.muted; save(); run(); return; }
    if (action === 'replay') run();
  }
  function onKey(event) {
    if (!view.dialog) return;
    if (event.key === 'Escape') { event.preventDefault(); closeDialog(); return; }
    if (event.key !== 'Tab') return;
    const buttons = Array.from(view.container.querySelectorAll('.qc-picture-dialog button')).filter(button => !button.disabled);
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  function render(container, options) {
    destroy(); view.container = container; view.options = options || {}; view.error = null;
    if (!container) return;
    const ready = typeof M()?.comparison === 'function' && typeof M()?.subtraction === 'function'
      && typeof C()?.list === 'function' && typeof C()?.listChoices === 'function' && typeof C()?.resolveChoice === 'function'
      && typeof window.SihyeonQuantitySequencer?.create === 'function';
    view.objects = ready ? C().list().filter(object => C().isValid(object)) : [];
    if (!ready || !view.objects.length) {
      view.error = 'dependencies-unavailable'; view.state = null; view.model = null;
      container.innerHTML = '<section class="qc-root qc-load-error"><h2>그림 놀이를 다시 열어 주세요</h2><button type="button" data-qc-action="home">🏠 숫자놀이터로</button></section>';
      view.handlers = { click: onClick }; container.addEventListener('click', onClick); return;
    }
    load(); view.sequence = window.SihyeonQuantitySequencer.create(); view.dialog = null;
    const resume = () => { if (view.container && !view.error && !view.dialog && !document.hidden && !document.getElementById('playSettingsDialog')) run(); };
    view.handlers = { click: onClick, key: onKey, settings: resume, resize: scheduleFocus,
      visibility: () => { if (document.hidden) stop(); else resume(); } };
    container.addEventListener('click', view.handlers.click); container.addEventListener('keydown', view.handlers.key);
    window.addEventListener('sihyeon-settings-change', view.handlers.settings);
    document.addEventListener('visibilitychange', view.handlers.visibility);
    window.addEventListener('resize', view.handlers.resize); window.addEventListener('orientationchange', view.handlers.resize);
    run();
  }
  function destroy() {
    stop(); view.settingsObserver?.disconnect(); view.settingsObserver = null;
    view.boardObserver?.disconnect(); view.boardObserver = null;
    if (view.scrollFrame) cancelAnimationFrame(view.scrollFrame); view.scrollFrame = 0;
    if (view.handlers) {
      view.container?.removeEventListener('click', view.handlers.click);
      if (view.handlers.key) view.container?.removeEventListener('keydown', view.handlers.key);
      if (view.handlers.settings) window.removeEventListener('sihyeon-settings-change', view.handlers.settings);
      if (view.handlers.visibility) document.removeEventListener('visibilitychange', view.handlers.visibility);
      if (view.handlers.resize) { window.removeEventListener('resize', view.handlers.resize); window.removeEventListener('orientationchange', view.handlers.resize); }
    }
    view.container = null; view.sequence = null; view.handlers = null; view.options = {}; view.dialog = null;
    view.choices = {}; view.choiceObjects = [];
  }
  function getSnapshot() {
    const s = view.state ? values() : null, root = view.container, model = view.model;
    const count = selector => root?.querySelectorAll(selector).length || 0;
    return {
      active: !!root, error: view.error, mode: view.state?.mode || null, a: s?.a ?? null, b: s?.b ?? null,
      artworkChoices: choiceSnapshot(), missingArtwork: missingArtwork(), choiceSourceKind: view.choiceSourceKind,
      state: view.state ? copy(view.state) : null, model: model ? copy(model) : null,
      pairCount: model?.pairCount ?? null, difference: model?.difference ?? null, relation: model?.relation || null,
      remainingCount: model?.remainingCount ?? null, matchedPairs: view.matchedPairs, extrasShown: view.extrasShown, moved: view.moved,
      actualCount: count('.qc-item'), actualLeft: count('.qc-item[data-side="left"]'), actualRight: count('.qc-item[data-side="right"]'),
      actualRemaining: count('.qc-remaining-items .qc-item'), actualDeparted: count('.qc-departed-items .qc-item'),
      actualPairedRows: count('.qc-pair.is-paired'), actualIds: root ? Array.from(root.querySelectorAll('.qc-item'), node => node.dataset.itemId) : [],
      currentStep: view.current ? copy(view.current) : null, phase: view.phase, complete: view.complete,
      dialog: view.dialog, range: view.range, category: view.category, readingStyle: view.state?.style || 'native',
      muted: view.state?.muted === true, age: age(), language: language(), audioFailed: view.audioFailed,
      storage: Object.assign({ memoryAvailable: !!memory }, view.storage), sequence: view.sequence?.getSnapshot() || null
    };
  }
  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[KEY] = { id: KEY, title: '그림으로 비교하고 빼기', render, destroy, getSnapshot };
})();
