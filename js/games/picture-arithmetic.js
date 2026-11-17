/* Picture addition and equal sharing. Every object is shown before automatic counting. */
(function () {
  'use strict';

  const KEY = 'pictureArithmetic';
  const SAVE_KEY = 'sihyeon-picture-arithmetic-v1';
  const DEFAULTS = {
    mode: 'add', a: 9, b: 6, aId: 'korean_police_car', bId: 'pump_engine',
    total: 15, groups: 3, shareId: 'apple', activeTerm: 'a', style: 'native', muted: false,
    aSourceKind: 'recommended', bSourceKind: 'recommended', shareSourceKind: 'recommended',
    strategy: 'all', shareHistory: [], keptShare: null
  };
  const view = {
    container: null, options: {}, objects: [], state: null, sequence: null, handlers: null,
    range: 0, category: 'vehicle', model: null, counted: 0, moved: 0, current: null,
    phase: 'idle', complete: false, audioFailed: false, runId: 0, error: null, settingsObserver: null, dialog: null,
    remainderKept: false, userPaused: false, suspended: false,
    choiceSourceKind: 'recommended', choiceObjects: [], choices: {},
    storage: { read: 'unread', write: 'unwritten' }
  };
  let memory = null;
  const M = () => window.SihyeonQuantityPlayModel;
  const C = () => window.SihyeonPlayObjects;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function language() { return window.SihyeonPlaySettings?.getLanguage?.() === 'en' ? 'en' : 'ko'; }
  function age() {
    const n = window.SihyeonPlaySettings?.getAge?.() || view.options.ageMode;
    return [4, 5, 6, 7].includes(n) ? n : 4;
  }
  function selectedSlot() { return view.state.mode === 'share' ? 'share' : view.state.activeTerm === 'b' ? 'b' : 'a'; }
  function reference(slot) { return { id: view.state[slot + 'Id'], sourceKind: view.state[slot + 'SourceKind'] }; }
  function selectedRef() { return reference(selectedSlot()); }
  function item(slot) { return view.choices[slot].object; }
  function captureChoices() {
    // Resolve once per run. Counting and reparenting keep this exact picture,
    // even if the saved artwork changes while the sequence is in progress.
    view.choices = {};
    (view.state.mode === 'share' ? ['share'] : ['a', 'b']).forEach(slot => {
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
  function sourceBadge(slot) { return view.choices[slot].actual.sourceKind === 'artwork' ? '<span class="pa-source-badge" aria-hidden="true">내</span>' : ''; }
  function selectedNumber() {
    const s = view.state;
    return s.mode === 'share' ? s.total : s.activeTerm === 'b' ? s.b : s.a;
  }
  function syncPicker() {
    const n = selectedNumber();
    view.range = n <= 10 ? 0 : n <= 20 ? 1 : 2;
    const selected = selectedRef();
    view.category = (view.objects.find(object => object.id === selected.id) || view.objects[0]).category || 'toy';
    refreshChoiceList(selected.sourceKind);
  }
  function save() {
    // The in-session copy is authoritative after a quota or privacy-mode write failure.
    memory = JSON.parse(JSON.stringify(Object.assign({ version: 1 }, view.state)));
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(memory));
      view.storage.write = 'saved';
    } catch (_) { view.storage.write = 'memory-only'; }
  }
  function validKeptShare(row) {
    return !!row && M().isQuantity(row.total) && Number.isInteger(row.groups) && row.groups >= 1 && row.groups <= 6
      && row.each === Math.floor(row.total / row.groups) && row.remainder === row.total % row.groups && row.remainder > 0
      && typeof row.picture === 'string' && row.picture.length > 0 && row.picture.length <= 100
      && ['recommended', 'artwork'].includes(row.sourceKind);
  }
  function load() {
    let saved = memory;
    view.storage = { read: saved ? 'memory' : 'unread', write: 'unwritten' };
    if (!saved) {
      try {
        saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
        view.storage.read = saved ? 'storage' : 'empty';
      } catch (_) { view.storage.read = 'unavailable'; }
    }
    const s = Object.assign({}, DEFAULTS);
    if (saved?.version === 1) {
      if (['add', 'share'].includes(saved.mode)) s.mode = saved.mode;
      // A corrupt/obsolete sum must not silently truncate either child's chosen term.
      if (M().isQuantity(saved.a) && M().isQuantity(saved.b) && saved.a + saved.b <= 30) {
        s.a = saved.a; s.b = saved.b;
      }
      if (M().isQuantity(saved.total)) s.total = saved.total;
      if (Number.isInteger(saved.groups) && saved.groups >= 1 && saved.groups <= 6) s.groups = saved.groups;
      ['aId', 'bId', 'shareId'].forEach(key => {
        if (view.objects.some(object => object.id === saved[key])) s[key] = saved[key];
      });
      ['a', 'b', 'share'].forEach(slot => {
        if (saved[slot + 'SourceKind'] === 'artwork' && saved[slot + 'Id'] === s[slot + 'Id']) s[slot + 'SourceKind'] = 'artwork';
      });
      if (['a', 'b'].includes(saved.activeTerm)) s.activeTerm = saved.activeTerm;
      if (['native', 'sino'].includes(saved.style)) s.style = saved.style;
      if (['all', 'on'].includes(saved.strategy)) s.strategy = saved.strategy;
      s.shareHistory = Array.isArray(saved.shareHistory) ? saved.shareHistory.filter(row =>
        row && M().isQuantity(row.total) && Number.isInteger(row.groups) && row.groups >= 1 && row.groups <= 6 &&
        row.each === Math.floor(row.total / row.groups) && row.remainder === row.total % row.groups &&
        typeof row.picture === 'string' && row.picture.length <= 100 && ['recommended', 'artwork'].includes(row.sourceKind)
      ).slice(-4) : [];
      if (validKeptShare(saved.keptShare)) {
        const k = saved.keptShare;
        s.keptShare = { total: k.total, groups: k.groups, each: k.each, remainder: k.remainder, picture: k.picture, sourceKind: k.sourceKind };
      }
      s.muted = saved.muted === true;
    }
    ['aId', 'bId', 'shareId'].forEach(key => {
      if (!view.objects.some(object => object.id === s[key])) s[key] = view.objects[0].id;
    });
    view.state = s;
    syncPicker();
  }
  function calculate() {
    const s = view.state;
    view.model = s.mode === 'add' ? M().addition(s.a, s.b) : M().equalShare(s.total, s.groups);
    return view.model;
  }
  function commonUnit() {
    return view.state.mode === 'share' ? item('share').unitKo : item('a').unitKo === item('b').unitKo ? item('a').unitKo : '개';
  }
  function plainQuantity(n, unit) { return M().determiner(n) + ' ' + unit; }
  function readingStep(id, kind, n, extra) {
    return Object.assign({ id, kind, number: n, nativeText: M().countWord(n, 'native', 'ko'),
      sinoText: M().countWord(n, 'sino', 'ko'), enText: M().countWord(n, 'sino', 'en'), readingStyle: view.state.style }, extra);
  }
  function summaryStep() {
    const s = view.state, model = view.model, unit = commonUnit();
    if (s.mode === 'add') {
      const mixed = item('a').unitKo !== item('b').unitKo ? '물건 ' : '';
      const total = model.total === 0 ? '하나도 없어요. 영이에요.' : mixed + '모두 ' + plainQuantity(model.total, unit) + '예요.';
      return { id: 'sum', kind: 'summary', readingStyle: s.style,
        nativeText: M().countWord(s.a, 'native') + ' 더하기 ' + M().countWord(s.b, 'native') + '. ' + total,
        sinoText: M().countWord(s.a, 'sino') + ' 더하기 ' + M().countWord(s.b, 'sino') + '. ' + total,
        enText: M().countWord(s.a, 'sino', 'en') + ' plus ' + M().countWord(s.b, 'sino', 'en') + ' is ' + M().countWord(model.total, 'sino', 'en') + '.' };
    }
    let text;
    if (!model.total) text = '어느 곳에도 없어요. 남은 것도 없어요. 영이에요.';
    else if (!model.each) text = '한 개씩 나누기에는 모자라요. ' + plainQuantity(model.remainder, unit) + ' 모두 남아요.';
    else text = '한 곳에 ' + plainQuantity(model.each, unit) + '씩. ' + (model.remainder ? plainQuantity(model.remainder, unit) + ' 남아요.' : '남은 것은 없어요.');
    return { id: 'share-result', kind: 'summary', text,
      enText: M().countWord(model.each, 'sino', 'en') + ' in each group. ' + (model.remainder ? M().countWord(model.remainder, 'sino', 'en') + ' left over.' : 'None left over.') };
  }
  function steps() {
    const s = view.state, model = view.model;
    if (s.mode === 'add') {
      if (s.strategy === 'on') {
        return [{ id: 'known-first', kind: 'base', number: s.a,
          text: '먼저 ' + plainQuantity(s.a, item('a').unitKo) + '. 여기서 이어서 세어요.',
          enText: 'Start with ' + s.a + '. Count on from here.' }].concat(
          model.right.map((object, index) => readingStep('count-' + object.id, 'count', s.a + index + 1,
            { itemId: object.id, ordinal: s.a + index + 1 })), summaryStep());
      }
      return model.items.map((object, index) => readingStep('count-' + object.id, 'count', index + 1,
        { itemId: object.id, ordinal: index + 1 })).concat(summaryStep());
    }
    const intro = { id: 'share-intro', kind: 'intro',
      text: (model.total ? '모두 ' + plainQuantity(model.total, commonUnit()) + ' 있어요. ' : '하나도 없어요. ') + M().determiner(model.groupCount) + ' 곳에 똑같이 나눠요.',
      enText: 'Share ' + M().countWord(model.total, 'sino', 'en') + ' into ' + M().countWord(model.groupCount, 'sino', 'en') + ' equal groups.' };
    return [intro].concat(model.moves.map((move, index) => readingStep('move-' + move.item.id, 'move', move.groupCountAfter,
      { itemId: move.item.id, groupIndex: move.groupIndex, ordinal: index + 1 })), summaryStep());
  }
  function objectMarkup(object, slot, source) {
    const choice = view.choices[slot], selected = choice.object;
    return '<div class="pa-item pa-source-' + source + '" data-item-id="' + esc(object.id) + '" data-source="' + source + '" data-object-id="' + esc(selected.id) +
      '" data-source-kind="' + choice.actual.sourceKind + '" data-requested-source-kind="' + choice.requested.sourceKind + '" data-missing-artwork="' + choice.missingArtwork + '">' +
      C().picture(selected) + '<span class="pa-item-number" aria-hidden="true"></span></div>';
  }
  function boardMarkup() {
    const s = view.state, model = view.model;
    if (s.mode === 'add') {
      if (!model.total) return '<div class="pa-zero"><strong>0</strong><span>하나도 없어요</span><span aria-hidden="true">🌿</span></div>';
      return '<div class="pa-source-trays"><section class="pa-source-tray"><header>첫 그림 · ' + s.a + '</header><div class="pa-waiting-items" data-add-source="a">' +
        model.left.map(object => objectMarkup(object, 'a', 'a')).join('') + '</div></section><span class="pa-join-sign" aria-hidden="true">＋</span>' +
        '<section class="pa-source-tray"><header>둘째 그림 · ' + s.b + '</header><div class="pa-waiting-items" data-add-source="b">' +
        model.right.map(object => objectMarkup(object, 'b', 'b')).join('') + '</div></section></div>' +
        '<section class="pa-together"><header>여기로 모아요 <span aria-hidden="true">↓</span></header><div class="pa-add-items"></div></section>';
    }
    const all = M().items(s.total, 'share');
    return '<section class="pa-pool"><header><strong class="pa-pool-title">나눌 그림</strong><span class="pa-pool-count">' + s.total + '</span></header>' +
      '<div class="pa-pool-items">' + all.map(object => objectMarkup(object, 'share', 'share')).join('') + '</div>' +
      '<p class="pa-pool-empty"' + (s.total ? ' hidden' : '') + '>하나도 없어요 · 0</p><div class="pa-next-choices" hidden></div>' +
      '<div class="pa-empty-groups-summary" hidden aria-label="' + s.groups + '곳 모두 0개"><strong>빈 자리</strong><div class="pa-empty-group-list" style="--pa-group-count:' + s.groups + '">' +
      model.groups.map((_, index) => '<span class="pa-empty-group"><small>' + (index + 1) + '번</small><b>0</b></span>').join('') + '</div></div></section>' +
      '<div class="pa-groups" data-groups="' + s.groups + '">' + model.groups.map((_, index) =>
        '<section class="pa-group" data-group="' + index + '" aria-label="' + (index + 1) + '번 자리"><header><span class="pa-group-badge" aria-hidden="true">' + ['🐰','🐻','🐱','🐶','🐸','🐼'][index] + '</span><strong>' + (index + 1) + '번 자리</strong><span class="pa-group-count" data-group-count="' + index + '">0</span></header>' +
        '<div class="pa-group-items" data-group-index="' + index + '"></div></section>').join('') + '</div><section class="pa-comparisons" hidden aria-label="같은 수를 다르게 나눈 모습"></section>';
  }
  function termMarkup(term) {
    const s = view.state, selected = item(term);
    const label = term === 'a' ? '첫 번째' : '두 번째';
    return '<div class="pa-term pa-term-' + term + (s.activeTerm === term ? ' is-selected' : '') + '" data-term-slot="' + term + '">' +
      '<button type="button" class="pa-term-picture-button" data-pa-action="choosePicture" data-value="' + term + '" data-source-kind="' + view.choices[term].actual.sourceKind + '" aria-label="' + label + ' 그림 바꾸기: ' + esc(pictureLabel(term)) + '" aria-haspopup="dialog">' + C().picture(selected) + sourceBadge(term) + '<span class="pa-picture-edit" aria-hidden="true">▾</span></button>' +
      '<button type="button" class="pa-term-number" data-pa-action="term" data-value="' + term + '" aria-label="' + label + ' 숫자 고르기" aria-pressed="' + (s.activeTerm === term) + '"><span class="pa-term-info"><small>' + esc(selected.nameKo) + '</small><strong>' + s[term] + '</strong></span><span class="pa-term-edit" aria-hidden="true">▾</span></button></div>';
  }
  function expressionMarkup() {
    const s = view.state;
    if (s.mode === 'add') return '<div class="pa-expression pa-add-expression">' + termMarkup('a') + '<span class="pa-operator" aria-hidden="true">+</span>' + termMarkup('b') +
      '<span class="pa-operator" aria-hidden="true">=</span><div class="pa-answer" aria-label="합 ' + view.model.total + '"><small>모두</small><strong>' + view.model.total + '</strong></div></div>';
    return '<div class="pa-expression pa-share-expression"><div class="pa-share-source"><button type="button" class="pa-share-picture-button" data-pa-action="choosePicture" data-value="share" data-source-kind="' + view.choices.share.actual.sourceKind + '" aria-label="나눌 그림 바꾸기: ' + esc(pictureLabel('share')) + '" aria-haspopup="dialog">' + C().picture(item('share')) + sourceBadge('share') + '<span class="pa-picture-edit" aria-hidden="true">▾</span></button>' +
      '<span><small>' + esc(item('share').nameKo) + '</small><strong>' + s.total + '</strong></span></div><span class="pa-operator" aria-hidden="true">÷</span>' +
      '<button type="button" class="pa-share-divisor" data-pa-action="chooseGroups" aria-label="나눌 곳 고르기: ' + s.groups + '곳" aria-haspopup="dialog"><strong>' + s.groups + '</strong><small>곳 ▾</small></button><span class="pa-operator" aria-hidden="true">=</span>' +
      '<div class="pa-answer"><small>한 곳에</small><strong>' + view.model.each + '</strong></div><div class="pa-remainder"><small>남은 것</small><strong>' + view.model.remainder + '</strong></div></div>';
  }
  function categoryOptions() {
    return [['vehicle', '🚓', '탈것'], ['food', '🍎', '음식'], ['toy', '🧸', '장난감'], ['art', '🎨', '그림판']]
      .filter(category => view.objects.some(object => object.category === category[0]));
  }
  function pictureChoicesMarkup() {
    const selected = selectedRef(), personal = view.choiceSourceKind === 'artwork';
    const objects = view.choiceObjects.filter(object => personal || object.category === view.category);
    return '<div class="pa-choice-controls"><div class="pa-source-kinds" role="group" aria-label="그림 출처">' +
      [['recommended', '추천 그림'], ['artwork', '내 그림']].map(([kind, label]) => '<button type="button" data-pa-action="sourceKind" data-value="' + kind + '" aria-pressed="' + (view.choiceSourceKind === kind) + '">' + label + '</button>').join('') + '</div>' +
      (personal ? '' : '<div class="pa-categories" role="group" aria-label="그림 종류">' + categoryOptions().map(category => '<button type="button" data-pa-action="category" data-value="' + category[0] + '" aria-pressed="' + (view.category === category[0]) + '"><span aria-hidden="true">' + category[1] + '</span>' + category[2] + '</button>').join('') + '</div>') + '</div>' +
      '<div class="pa-objects" role="group" aria-label="그림 고르기">' + (objects.length ? objects.map(object => '<button type="button" class="pa-object-choice" data-pa-action="object" data-value="' + esc(object.id) + '" data-source-kind="' + object.sourceKind + '" aria-label="' + (personal ? '내 그림 ' : '추천 그림 ') + esc(object.nameKo) + ' 고르기" aria-pressed="' + (selected.id === object.id && selected.sourceKind === object.sourceKind) + '">' + C().picture(object) + '<span>' + esc(object.nameKo) + '</span></button>').join('') :
        '<div class="pa-choice-empty"><p>불러올 내 그림이 없어요.</p><p>그림판에서 먼저 색칠해 보세요.</p><button type="button" data-pa-action="sourceKind" data-value="recommended">추천 그림 보기</button></div>') + '</div>';
  }
  function groupButtonsMarkup() {
    return '<div class="pa-group-buttons" role="group" aria-label="나눌 곳 수">' + [1, 2, 3, 4, 5, 6].map(value => '<button type="button" data-pa-action="groups" data-value="' + value + '" aria-label="' + value + '곳에 나누기" aria-pressed="' + (view.state.groups === value) + '">' + value + '</button>').join('') + '</div>';
  }
  function pickerMarkup() {
    const s = view.state, slot = selectedSlot(), n = selectedNumber();
    const low = [0, 11, 21][view.range], high = [10, 20, 30][view.range];
    const max = s.mode === 'share' ? 30 : 30 - (s.activeTerm === 'b' ? s.a : s.b);
    return '<div class="pa-picker-heading"><strong>' + (s.mode === 'share' ? '나눌 그림과 숫자' : s.activeTerm === 'b' ? '두 번째 그림과 숫자' : '첫 번째 그림과 숫자') + '</strong><span>고르면 바로 시작해요</span></div>' +
      '<button type="button" class="pa-choose-picture" data-pa-action="choosePicture" data-value="' + (s.mode === 'share' ? 'share' : s.activeTerm) + '" aria-haspopup="dialog">' + C().picture(item(slot)) + '<span>' + esc(item(slot).nameKo) + '<small>' + (view.choices[slot].actual.sourceKind === 'artwork' ? '내 그림 · ' : '') + '그림 바꾸기 ▾</small></span></button>' +
      '<div class="pa-inline-pictures">' + pictureChoicesMarkup() + '</div>' +
      '<div class="pa-ranges" role="group" aria-label="숫자 범위">' + ['0–10', '11–20', '21–30'].map((label, index) => '<button type="button" data-pa-action="range" data-value="' + index + '" aria-pressed="' + (view.range === index) + '">' + label + '</button>').join('') + '</div>' +
      '<div class="pa-numbers" role="group" aria-label="원하는 숫자">' + Array.from({ length: high - low + 1 }, (_, index) => index + low).map(value => '<button type="button" data-pa-action="number" data-value="' + value + '" aria-label="' + value + ' 선택" aria-pressed="' + (value === n) + '"' + (value > max ? ' disabled' : '') + '>' + value + '</button>').join('') + '</div>' +
      (s.mode === 'add' ? '<p class="pa-limit-note">두 수를 합해 30까지 만들어요</p>' : '<div class="pa-group-picker"><strong>몇 곳에 나눌까요?</strong>' + groupButtonsMarkup() + '</div>');
  }
  function footerMarkup() {
    const s = view.state;
    return '<div class="pa-play-controls"><button type="button" class="pa-pause" data-pa-action="pause" aria-label="잠깐 멈추기">Ⅱ 멈춤</button>' +
      (s.mode === 'add' ? '<button type="button" class="pa-strategy" data-pa-action="strategy" aria-pressed="' + (s.strategy === 'on') + '">' + (s.strategy === 'on' ? '이어 세기 ✓' : '이어 세기') + '</button>' : '') +
      '<div class="pa-readings" role="group" aria-label="수 읽는 방법">' + (language() === 'en' ? '<span class="pa-english">🌐 English · one, two</span>' :
      '<button type="button" data-pa-action="style" data-value="native" aria-pressed="' + (s.style === 'native') + '">하나·둘</button><button type="button" data-pa-action="style" data-value="sino" aria-pressed="' + (s.style === 'sino') + '">일·이</button>') + '</div>' +
      '<button type="button" class="pa-replay" data-pa-action="replay">↻ ' + (s.mode === 'share' ? '다시 나누기' : '다시 세기') + '</button></div><p class="pa-sound-note pa-artwork-note" data-missing-artwork="' + missingArtwork() + '"' + (missingArtwork() ? '' : ' hidden') + '>' + (missingArtwork() ? '내 그림이 없어 견본으로 놀아요' : '그림과 숫자로 계속 놀아요') + '</p>';
  }
  function paint() {
    if (!view.container || !view.state) return;
    const s = view.state;
    view.container.innerHTML = '<section class="pa-root" data-mode="' + s.mode + '" data-age="' + age() + '">' +
      '<header class="pa-top"><button type="button" class="pa-icon pa-home" data-pa-action="home" aria-label="숫자놀이터로">🏠</button><h2>그림으로<br><strong>더하고 나누기</strong></h2><div class="pa-top-tools"><button type="button" class="pa-icon" data-pa-action="mute" aria-label="' + (s.muted ? '소리 켜기' : '소리 끄기') + '" aria-pressed="' + s.muted + '">' + (s.muted ? '🔇' : '🔊') + '</button><button type="button" class="pa-icon pa-age" data-pa-action="settings" aria-label="놀이 모드 설정"><strong>' + age() + '</strong><small>세 ⚙</small></button></div></header>' +
      '<nav class="pa-modes" aria-label="연산 놀이"><button type="button" data-pa-action="mode" data-value="add" aria-pressed="' + (s.mode === 'add') + '"><span aria-hidden="true">＋</span> 더하기</button><button type="button" data-pa-action="mode" data-value="share" aria-pressed="' + (s.mode === 'share') + '"><span aria-hidden="true">÷</span> 똑같이 나누기</button></nav>' +
      '<main class="pa-stage">' + expressionMarkup() + '<div class="pa-board" role="region" aria-label="' + (s.mode === 'share' ? '그림을 똑같이 나누는 자리' : '두 그림을 모아 세는 자리') + '">' + boardMarkup() + '</div>' +
      '<div class="pa-progress"><strong class="pa-count-now">0</strong><span class="pa-count-word">' + (s.mode === 'share' ? '한 바퀴씩 나눠요' : '함께 세어요') + '</span><span class="pa-status" role="status" aria-live="polite">그림이 모두 나타났어요</span></div></main>' +
      '<aside class="pa-picker" aria-label="그림과 숫자 고르기">' + pickerMarkup() + '</aside><footer class="pa-footer">' + footerMarkup() + '</footer></section>';
    C().preparePictures(view.container);
  }
  function paintPicker() {
    const picker = view.container?.querySelector('.pa-picker');
    if (!picker) return;
    picker.innerHTML = pickerMarkup();
    view.container.querySelectorAll('[data-pa-action="term"]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.value === view.state.activeTerm)));
    view.container.querySelectorAll('[data-term-slot]').forEach(element => element.classList.toggle('is-selected', element.dataset.termSlot === view.state.activeTerm));
    C().preparePictures(picker);
  }
  function paintDialog() {
    view.container?.querySelector('.pa-picture-overlay')?.remove();
    if (!view.container || !view.dialog) return;
    const overlay = document.createElement('div');
    overlay.className = 'pa-picture-overlay';
    const groups = view.dialog === 'groups';
    const title = groups ? '몇 곳에 나눌까요?' : (view.state.mode === 'share' ? '나눌 그림을 골라요' : view.state.activeTerm === 'b' ? '두 번째 그림을 골라요' : '첫 번째 그림을 골라요');
    overlay.innerHTML = '<section class="pa-picture-dialog" role="dialog" aria-modal="true" aria-labelledby="pa-dialog-title"><header><h3 id="pa-dialog-title">' + title + '</h3><button type="button" data-pa-action="closeDialog" aria-label="선택창 닫기">✕</button></header>' +
      (groups ? '<div class="pa-dialog-groups">' + groupButtonsMarkup() + '</div>' : pictureChoicesMarkup()) + '</section>';
    view.container.querySelector('.pa-root').appendChild(overlay);
    C().preparePictures(overlay);
    overlay.querySelector('[data-pa-action="closeDialog"]').focus();
  }
  function openDialog(kind, term) {
    suspend();
    if (kind === 'pictures' && view.state.mode === 'add' && ['a', 'b'].includes(term)) view.state.activeTerm = term;
    syncPicker(); save(); paintPicker();
    view.dialog = kind; paintDialog();
  }
  function closeDialog() {
    const kind = view.dialog;
    view.dialog = null; view.container?.querySelector('.pa-picture-overlay')?.remove(); resumeSuspended();
    const selector = kind === 'groups' ? '[data-pa-action="chooseGroups"]' : '[data-pa-action="choosePicture"][data-value="' + (view.state.mode === 'share' ? 'share' : view.state.activeTerm) + '"]';
    view.container?.querySelector(selector)?.focus?.({ preventScroll: true });
  }
  function onKey(event) {
    if (!view.dialog) return;
    if (event.key === 'Escape') { event.preventDefault(); closeDialog(); return; }
    if (event.key !== 'Tab') return;
    const buttons = Array.from(view.container.querySelectorAll('.pa-picture-dialog button')).filter(button => !button.disabled);
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  function keepInBoard(element, group) {
    const board = view.container?.querySelector('.pa-board');
    if (!board || !element) return;
    const bounds = board.getBoundingClientRect(), groupBounds = group?.getBoundingClientRect();
    const wholeGroupFits = groupBounds && groupBounds.height <= bounds.height - 16;
    const target = (wholeGroupFits ? group : element).getBoundingClientRect();
    // Tall groups keep a sticky heading; the picture must stay below that heading.
    const inset = group && !wholeGroupFits ? group.querySelector('header').getBoundingClientRect().height + 8 : 8;
    if (target.bottom > bounds.bottom - 8) board.scrollTop += target.bottom - bounds.bottom + 8;
    else if (target.top < bounds.top + inset) board.scrollTop -= bounds.top + inset - target.top;
  }
  function movePicture(element, target) {
    if (!element || !target) return;
    const before = element.getBoundingClientRect();
    target.appendChild(element);
    if (element.animate && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      const after = element.getBoundingClientRect();
      element.animate([{ transform: 'translate(' + (before.left - after.left) + 'px,' + (before.top - after.top) + 'px)' }, { transform: 'translate(0,0)' }], { duration: 280, easing: 'ease-out' });
    }
  }
  function updatePause() {
    const button = view.container?.querySelector('[data-pa-action="pause"]');
    if (!button) return;
    const paused = view.sequence?.isPaused?.() || false;
    button.textContent = paused ? '▶ 이어서' : 'Ⅱ 멈춤';
    button.setAttribute('aria-label', paused ? '멈춘 곳부터 이어서 세기' : '잠깐 멈추기');
    button.setAttribute('aria-pressed', String(paused));
    button.disabled = view.complete;
  }
  function syncControls() {
    const footer = view.container?.querySelector('.pa-footer');
    if (footer) footer.innerHTML = footerMarkup();
    const ageLabel = view.container?.querySelector('.pa-age strong');
    if (ageLabel) ageLabel.textContent = String(age());
    updatePause();
  }
  function suspend() {
    // Visibility can suspend an already-open picker/settings dialog. Preserve
    // the original intent to resume instead of replacing it with false.
    view.suspended = view.suspended || view.sequence?.getSnapshot().status === 'running';
    view.sequence?.pause?.(); updatePause();
  }
  function resumeSuspended() {
    syncControls();
    // Closing one blocker must not consume another blocker's pending resume.
    if (document.hidden || view.dialog || document.getElementById('playSettingsDialog')) return;
    if (view.suspended && !view.userPaused) view.sequence?.resume?.();
    view.suspended = false; updatePause();
  }
  function distributionRecord() {
    const model = view.model;
    return { total: model.total, groups: model.groupCount, each: model.each, remainder: model.remainder,
      picture: view.choices.share.actual.id, sourceKind: view.choices.share.actual.sourceKind };
  }
  function keptShareMatches() {
    const kept = view.state.keptShare;
    if (view.state.mode !== 'share' || !validKeptShare(kept)) return false;
    const current = distributionRecord();
    return Object.keys(current).every(key => kept[key] === current[key]);
  }
  function markKeptRemainder() {
    view.container.querySelector('.pa-pool').classList.add('is-kept');
    view.container.querySelector('.pa-pool-title').textContent = '🧺 다음에 쓸 그림';
  }
  function rememberDistribution() {
    const s = view.state, row = distributionRecord();
    s.shareHistory = s.shareHistory.filter(old => !(old.total === row.total && old.groups === row.groups && old.picture === row.picture && old.sourceKind === row.sourceKind)).concat(row).slice(-4);
    save();
  }
  function showSharingChoices() {
    const root = view.container?.querySelector('.pa-root');
    if (!root || view.state.mode !== 'share') return;
    const model = view.model, choices = root.querySelector('.pa-next-choices');
    if (choices) {
      choices.hidden = false;
      choices.innerHTML = (model.remainder ? '<button type="button" data-pa-action="keepRemainder"' + (view.remainderKept ? ' disabled' : '') + '>🧺 ' + (view.remainderKept ? model.remainder + commonUnit() + ' 보관했어요' : '남은 것 보관') + '</button>' : '') +
        (model.groupCount < 6 ? '<button type="button" data-pa-action="moreGroup">＋ 한 곳 더</button>' : '') +
        '<button type="button" data-pa-action="compareShares">나눈 모습 비교</button>';
    }
  }
  function showDistributionComparison() {
    const area = view.container?.querySelector('.pa-comparisons');
    if (!area) return;
    const choice = view.choices.share.actual;
    const rows = view.state.shareHistory.filter(row => row.total === view.model.total && row.picture === choice.id && row.sourceKind === choice.sourceKind);
    area.hidden = false;
    area.innerHTML = '<h3>같은 ' + view.model.total + commonUnit() + ', 다른 나눔</h3>' +
      (rows.length < 2 ? '<p>한 곳 더 또는 나눌 곳을 바꿔 봐요.<br>' + (view.storage.write === 'memory-only' ? '이번 놀이 동안 이 모습을 기억해요.' : '이 모습은 그대로 기억할게요.') + '</p>' : '') +
      '<div class="pa-comparison-list">' + rows.map(row => '<div class="pa-comparison-card"><strong>' + row.groups + '곳에 나누면</strong><div class="pa-mini-groups">' +
        Array.from({ length: row.groups }, (_, index) => '<span><i aria-hidden="true">' + ['🐰','🐻','🐱','🐶','🐸','🐼'][index] + '</i><b>' + row.each + '</b></span>').join('') +
        '</div><span>한 곳 ' + row.each + ' · 남은 것 ' + row.remainder + '</span><small>' + row.groups + ' × ' + row.each + ' + ' + row.remainder + ' = ' + row.total + '</small></div>').join('') + '</div>';
    keepInBoard(area);
  }
  function showStep(step) {
    const root = view.container?.querySelector('.pa-root');
    if (!root) return;
    const s = view.state, model = view.model, unit = commonUnit();
    view.current = { id: step.id, kind: step.kind, number: step.number ?? null, groupIndex: step.groupIndex ?? null };
    root.querySelectorAll('.pa-item.is-current').forEach(element => element.classList.remove('is-current'));
    root.querySelectorAll('.pa-group.is-current').forEach(element => element.classList.remove('is-current'));
    let word = '', status = '', number = 0;
    if (step.kind === 'base') {
      view.phase = 'counting'; view.counted = s.a;
      const target = root.querySelector('.pa-add-items');
      model.left.forEach((object, index) => {
        const element = root.querySelector('[data-item-id="' + object.id + '"]');
        movePicture(element, target); element?.classList.add('is-counted', 'is-known');
        if (element) element.querySelector('.pa-item-number').textContent = String(index + 1);
      });
      number = s.a; word = '여기서 이어서'; status = s.a + '에서 시작해요';
      keepInBoard(target);
    } else if (step.kind === 'count') {
      view.phase = 'counting'; view.counted = step.ordinal;
      const element = root.querySelector('[data-item-id="' + step.itemId + '"]');
      movePicture(element, root.querySelector('.pa-add-items'));
      element?.classList.add('is-current', 'is-counted');
      if (element) element.querySelector('.pa-item-number').textContent = String(step.ordinal);
      keepInBoard(element);
      number = step.number; word = M().countWord(number, s.style, language()); status = view.counted + ' / ' + model.total + unit;
    } else if (step.kind === 'move') {
      view.phase = 'sharing'; view.moved = step.ordinal; view.counted = step.ordinal;
      const element = root.querySelector('[data-item-id="' + step.itemId + '"]');
      const target = root.querySelector('[data-group-index="' + step.groupIndex + '"]');
      if (!element || !target) throw new Error('A sharing object or its group is missing');
      // Move the existing node. Never copy it, even while its highlight is animated.
      movePicture(element, target);
      element.classList.add('is-current', 'is-counted');
      element.querySelector('.pa-item-number').textContent = String(step.number);
      root.querySelector('[data-group="' + step.groupIndex + '"]').classList.add('is-current');
      root.querySelector('[data-group-count="' + step.groupIndex + '"]').textContent = String(step.number);
      root.querySelector('.pa-pool-title').textContent = '아직 나눌 그림';
      root.querySelector('.pa-pool-count').textContent = String(model.total - view.moved);
      root.querySelector('.pa-pool-empty').hidden = model.total !== view.moved;
      keepInBoard(element, root.querySelector('[data-group="' + step.groupIndex + '"]'));
      number = step.number; word = M().countWord(number, s.style, language()); status = (step.groupIndex + 1) + '번 자리 · ' + number + unit;
    } else if (step.kind === 'intro') {
      view.phase = 'preview';
      number = model.total; word = '한 바퀴에 하나씩'; status = model.total + unit + ' → ' + model.groupCount + '곳';
    } else if (step.kind === 'summary') {
      view.phase = 'summary'; root.classList.add('pa-show-result');
      if (s.mode === 'add') {
        number = model.total; word = model.total ? '모두 ' + model.total + unit : '하나도 없어요'; status = s.a + ' + ' + s.b + ' = ' + model.total;
        const trays = root.querySelector('.pa-source-trays'); if (trays) trays.hidden = true;
        const heading = root.querySelector('.pa-together > header'); if (heading) heading.textContent = '모두 모였어요 · ' + model.total + unit;
      } else {
        number = model.each; word = '한 곳에 ' + model.each + unit; status = '남은 것 ' + model.remainder + unit;
        root.querySelector('.pa-pool-title').textContent = '남은 그림';
        root.querySelector('.pa-pool-count').textContent = String(model.remainder);
        root.querySelector('.pa-pool').classList.add('is-remainder');
        root.querySelector('.pa-pool-empty').hidden = model.remainder !== 0;
        root.querySelector('.pa-pool-empty').textContent = '남은 것 없어요 · 0';
        root.querySelector('.pa-empty-groups-summary').hidden = model.each !== 0;
        view.remainderKept = keptShareMatches();
        if (view.remainderKept) markKeptRemainder();
        keepInBoard(root.querySelector('.pa-pool'));
      }
    }
    root.querySelector('.pa-count-now').textContent = String(number);
    root.querySelector('.pa-count-word').textContent = word;
    root.querySelector('.pa-status').textContent = status;
  }
  function stop() {
    view.runId++;
    view.sequence?.stop();
  }
  function run(options) {
    if (!view.container || !view.sequence || !view.state || view.error || view.dialog) return;
    const retained = options?.preserveItems ? Array.from(view.container.querySelectorAll('.pa-item')) : [];
    stop();
    const ticket = view.runId;
    view.counted = 0; view.moved = 0; view.current = null; view.phase = 'preview';
    view.complete = false; view.audioFailed = false; view.remainderKept = false; view.userPaused = false; view.suspended = false;
    captureChoices(); calculate(); paint();
    retained.forEach(element => {
      const placeholder = view.container.querySelector('[data-item-id="' + element.dataset.itemId + '"]');
      if (!placeholder || placeholder.dataset.objectId !== element.dataset.objectId || placeholder.dataset.sourceKind !== element.dataset.sourceKind) return;
      element.classList.remove('is-current', 'is-counted', 'is-known');
      element.querySelector('.pa-item-number').textContent = '';
      placeholder.replaceWith(element);
    });
    view.sequence.start(steps(), { muted: view.state.muted, followLanguage: true, delayMs: 160,
      onState: () => { if (view.container && ticket === view.runId) updatePause(); },
      onStep: step => { if (view.container && ticket === view.runId) showStep(step); },
      onError: error => {
        if (!view.container || ticket !== view.runId) return;
        const note = view.container.querySelector('.pa-sound-note');
        if (error.code.startsWith('AUDIO_')) view.audioFailed = true;
        else {
          view.phase = 'error';
          if (note && !missingArtwork()) note.textContent = '다시 세기 버튼으로 한 번 더 해 봐요';
        }
        if (note) note.hidden = false;
      },
      onEnd: () => {
        if (!view.container || ticket !== view.runId) return;
        view.complete = true; view.phase = 'complete';
        const root = view.container.querySelector('.pa-root');
        root?.classList.add('pa-finished');
        root?.querySelectorAll('.is-current').forEach(element => element.classList.remove('is-current'));
        if (view.state.mode === 'share') { rememberDistribution(); showSharingChoices(); }
        updatePause();
      }
    });
  }
  function changeNumber(n) {
    if (!M().isQuantity(n)) return;
    const s = view.state;
    if (s.mode === 'share') s.total = n;
    else {
      const term = s.activeTerm === 'b' ? 'b' : 'a';
      if (n + s[term === 'a' ? 'b' : 'a'] > 30) return;
      s[term] = n;
    }
    syncPicker(); save(); run();
  }
  function openSettings() {
    suspend();
    const open = view.options.openSettings || window.SihyeonPlaySettings?.openSettings;
    if (typeof open !== 'function') { resumeSuspended(); return; }
    open();
    view.settingsObserver?.disconnect();
    if (!document.getElementById('playSettingsDialog')) { resumeSuspended(); return; }
    view.settingsObserver = new MutationObserver(() => {
      if (document.getElementById('playSettingsDialog')) return;
      view.settingsObserver?.disconnect(); view.settingsObserver = null;
      if (view.container && !document.hidden) resumeSuspended();
    });
    view.settingsObserver.observe(document.body, { childList: true });
  }
  function onClick(event) {
    if (view.dialog && event.target === view.container?.querySelector('.pa-picture-overlay')) { closeDialog(); return; }
    const button = event.target.closest?.('[data-pa-action]');
    if (!button || !view.container?.contains(button) || button.disabled) return;
    const action = button.dataset.paAction, value = button.dataset.value, s = view.state;
    if (action === 'home') { const close = view.options.closeToParkHome; destroy(); close?.(); return; }
    if (action === 'settings') { openSettings(); return; }
    if (!s || view.error) return;
    if (action === 'choosePicture') { openDialog('pictures', value); return; }
    if (action === 'chooseGroups') { openDialog('groups'); return; }
    if (action === 'closeDialog') { closeDialog(); return; }
    if (action === 'mode' && ['add', 'share'].includes(value)) { s.mode = value; syncPicker(); save(); run(); return; }
    if (action === 'term' && ['a', 'b'].includes(value)) { s.activeTerm = value; syncPicker(); save(); paintPicker(); return; }
    if (action === 'sourceKind' && ['recommended', 'artwork'].includes(value)) { refreshChoiceList(value); if (view.dialog) paintDialog(); else paintPicker(); return; }
    if (action === 'category' && categoryOptions().some(category => category[0] === value)) { view.category = value; if (view.dialog) paintDialog(); else paintPicker(); return; }
    if (action === 'range' && ['0', '1', '2'].includes(value)) { view.range = Number(value); paintPicker(); return; }
    if (action === 'number') { changeNumber(Number(value)); return; }
    if (action === 'object' && view.choiceObjects.some(object => object.id === value && object.sourceKind === button.dataset.sourceKind)) {
      const slot = selectedSlot();
      s[slot + 'Id'] = value; s[slot + 'SourceKind'] = button.dataset.sourceKind;
      view.dialog = null;
      syncPicker(); save(); run(); return;
    }
    if (action === 'groups') {
      const groups = Number(value);
      if (Number.isInteger(groups) && groups >= 1 && groups <= 6) { s.groups = groups; view.dialog = null; save(); run({ preserveItems: true }); }
      return;
    }
    if (action === 'pause') {
      if (view.sequence?.isPaused?.()) { view.userPaused = false; view.sequence.resume(); }
      else { view.userPaused = true; view.sequence?.pause?.(); }
      updatePause(); return;
    }
    if (action === 'strategy') { s.strategy = s.strategy === 'all' ? 'on' : 'all'; save(); run({ preserveItems: true }); return; }
    if (action === 'moreGroup' && view.complete && s.mode === 'share' && s.groups < 6) { s.groups++; save(); run({ preserveItems: true }); return; }
    if (action === 'keepRemainder' && view.complete && view.model.remainder > 0 && s.mode === 'share') {
      view.remainderKept = true;
      s.keptShare = distributionRecord(); save(); markKeptRemainder();
      view.container.querySelector('.pa-status').textContent = view.model.remainder + commonUnit() + ' 그대로 보관해요';
      showSharingChoices(); return;
    }
    if (action === 'compareShares' && view.complete && s.mode === 'share') { showDistributionComparison(); return; }
    if (action === 'style' && ['native', 'sino'].includes(value)) { s.style = value; save(); run(); return; }
    if (action === 'mute') {
      s.muted = !s.muted; save(); view.sequence?.setMuted?.(s.muted);
      button.textContent = s.muted ? '🔇' : '🔊'; button.setAttribute('aria-pressed', String(s.muted));
      button.setAttribute('aria-label', s.muted ? '소리 켜기' : '소리 끄기'); return;
    }
    if (action === 'replay') run();
  }
  function render(container, options) {
    destroy(); view.container = container; view.options = options || {}; view.error = null;
    const ready = M() && typeof C()?.list === 'function' && typeof C()?.listChoices === 'function'
      && typeof C()?.resolveChoice === 'function' && typeof window.SihyeonQuantitySequencer?.create === 'function';
    view.objects = ready ? C().list().filter(object => C().isValid(object)) : [];
    if (!ready || !view.objects.length) {
      view.error = 'dependencies-unavailable'; view.state = null; view.model = null;
      container.innerHTML = '<section class="pa-root pa-load-error"><h2>그림 놀이를 불러오지 못했어요</h2><p>놀이터로 돌아가서 다시 열어 주세요.</p><button type="button" data-pa-action="home">🏠 숫자놀이터로</button></section>';
      view.handlers = { click: onClick }; container.addEventListener('click', onClick); return;
    }
    load();
    view.sequence = window.SihyeonQuantitySequencer.create();
    view.handlers = {
      click: onClick,
      key: onKey,
      settings: () => { if (view.container && !view.error && !view.dialog && !document.getElementById('playSettingsDialog')) syncControls(); },
      visibility: () => { if (document.hidden) suspend(); else if (view.container && !view.error && !view.dialog && !document.getElementById('playSettingsDialog')) resumeSuspended(); }
    };
    container.addEventListener('click', view.handlers.click);
    container.addEventListener('keydown', view.handlers.key);
    window.addEventListener('sihyeon-settings-change', view.handlers.settings);
    document.addEventListener('visibilitychange', view.handlers.visibility);
    run();
  }
  function destroy() {
    stop();
    view.settingsObserver?.disconnect(); view.settingsObserver = null;
    if (view.handlers) {
      view.container?.removeEventListener('click', view.handlers.click);
      if (view.handlers.key) view.container?.removeEventListener('keydown', view.handlers.key);
      if (view.handlers.settings) window.removeEventListener('sihyeon-settings-change', view.handlers.settings);
      if (view.handlers.visibility) document.removeEventListener('visibilitychange', view.handlers.visibility);
    }
    view.container = null; view.sequence = null; view.handlers = null; view.options = {}; view.dialog = null;
    view.choices = {}; view.choiceObjects = [];
  }
  function getSnapshot() {
    const s = view.state, model = view.model, root = view.container;
    return {
      active: !!root, error: view.error, mode: s?.mode || null,
      state: s ? Object.assign({}, s) : null, artworkChoices: choiceSnapshot(), missingArtwork: missingArtwork(), choiceSourceKind: view.choiceSourceKind,
      a: s?.a ?? null, b: s?.b ?? null, leftObjectId: s?.aId || null, rightObjectId: s?.bId || null,
      shareObjectId: s?.shareId || null, total: model?.total ?? null,
      groups: s?.mode === 'share' ? model?.groupCount : null,
      each: s?.mode === 'share' ? model?.each : null, remainder: s?.mode === 'share' ? model?.remainder : null,
      actualCount: root?.querySelectorAll('.pa-item').length || 0,
      actualLeft: root?.querySelectorAll('.pa-item[data-source="a"]').length || 0,
      actualRight: root?.querySelectorAll('.pa-item[data-source="b"]').length || 0,
      actualGroups: root ? Array.from(root.querySelectorAll('.pa-group-items'), group => group.querySelectorAll('.pa-item').length) : [],
      poolCount: root?.querySelector('.pa-pool-items')?.querySelectorAll('.pa-item').length || 0,
      counted: view.counted, moved: view.moved, phase: view.phase, currentStep: view.current ? Object.assign({}, view.current) : null,
      complete: view.complete, dialog: view.dialog, readingStyle: s?.style || 'native', muted: s?.muted || false,
      strategy: s?.strategy || 'all', remainderKept: view.remainderKept,
      shareHistory: s ? JSON.parse(JSON.stringify(s.shareHistory)) : [], paused: view.sequence?.isPaused?.() || false,
      age: age(), language: language(), audioFailed: view.audioFailed,
      storage: Object.assign({ memoryAvailable: !!memory }, view.storage), sequence: view.sequence?.getSnapshot() || null
    };
  }
  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[KEY] = { id: KEY, title: '그림으로 더하고 나누기', render, destroy, getSnapshot };
})();
