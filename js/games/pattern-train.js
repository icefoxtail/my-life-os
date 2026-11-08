/* 패턴 기차 공작소 — a persistent, pictorial building-and-running workshop. */
(function () {
  'use strict';
  const PREFIX = 'sihyeon-pattern-train-v1:';
  const memory = Object.create(null);
  const LEVELS = { 4: '첫 규칙', 5: '여러 묶음', 6: '규칙 공작', 7: '규칙 탐험' };
  const view = { container: null, options: {}, state: null, task: null, age: 5, level: 5, cursor: 0, mode: 'course', prefs: {}, muted: false, saveFailed: false, voiceFailed: false, modal: null, erase: false, drag: null, ghost: null, activePointers: new Set(), blockedGesture: false, handlers: null, timers: new Set(), voiceToken: 0, tripToken: 0, suppressClickUntil: 0, previousBack: null };
  const M = () => window.SihyeonPatternTrainModel;
  const clone = value => JSON.parse(JSON.stringify(value));
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const svg = (body, cls, box) => '<svg class="' + (cls || '') + '" viewBox="' + (box || '0 0 100 100') + '" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">' + body + '</svg>';
  function icon(name) {
    const paths = {
      home: '<path d="M7 17 24 4l17 13v24H29V27H19v14H7Z"/>',
      sound: '<path d="M7 18h8L26 9v30l-11-9H7Z"/><path d="M33 16q10 8 0 16m5-22q17 14 0 28" fill="none"/>',
      mute: '<path d="M7 18h8L26 9v30l-11-9H7Z"/><path d="m33 18 12 12m0-12-12 12" fill="none"/>',
      hear: '<path d="M11 25a13 13 0 1 1 26 0v9h-8V24h8M11 24h8v10h-8Zm26 9q0 9-13 8" fill="none"/>',
      undo: '<path d="M15 9 5 19l10 10M6 19h20c19 0 19 21 0 21" fill="none"/>',
      restart: '<path d="M10 17a16 16 0 1 1-1 17M10 6v13h13" fill="none"/>',
      play: '<path d="m16 8 24 16-24 16Z"/>',
      hand: '<path d="M18 29V10a4 4 0 0 1 8 0v15l3-7 5 1 4 4 5 1-2 14-9 7H19L8 31q-2-7 4-5Z" fill="none"/>',
      return: '<path d="M10 23h26V8M10 23l10-10M10 23l10 10M10 40h28" fill="none"/>',
      arrow: '<path d="M7 24h32M27 12l12 12-12 12" fill="none"/>',
      stamp: '<path d="M17 8h14v11l-5 8h-4l-5-8ZM8 29h32v11H8Z"/>',
      edit: '<path d="m9 34 22-22 7 7-22 22-9 2Zm20-24 5-5 9 9-5 5"/>',
      plus: '<path d="M24 9v30M9 24h30" fill="none"/>',
      minus: '<path d="M9 24h30" fill="none"/>',
      close: '<path d="m12 12 24 24m0-24L12 36" fill="none"/>',
      check: '<path d="m10 25 10 10L39 13" fill="none"/>',
      book: '<path d="M5 10q9-4 19 2 10-6 19-2v29q-9-4-19 2-10-6-19-2Zm19 2v29" fill="none"/>',
      spark: '<path d="m24 5 5 13 14 6-14 6-5 13-5-13-14-6 14-6Z"/>'
    };
    return svg('<g stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="currentColor">' + (paths[name] || paths.spark) + '</g>', 'pt-icon', '0 0 48 48');
  }
  function token(id, cls) {
    const item = M().TOKENS[id];
    if (!item) return svg('<path d="M30 50h40M50 30v40" fill="none" stroke="#c3c9b9" stroke-width="6" stroke-linecap="round"/>', 'pt-token ' + (cls || ''));
    const c = item.color;
    let body;
    if (item.theme === 'color') {
      body = '<path d="M50 8 86 28v43L50 92 14 71V28Z" fill="' + c + '"/><path d="m14 28 36 21 36-21M50 49v43" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="4"/><path d="m27 30 22-13 17 10-23 13Z" fill="#fff" opacity=".4"/>';
    } else if (item.theme === 'shape') {
      const shapes = { circle: '<circle cx="50" cy="50" r="36"/>', triangle: '<path d="M50 10 91 82H9Z" stroke-linejoin="round"/>', square: '<rect x="17" y="17" width="66" height="66" rx="13"/>', star: '<path d="m50 7 13 27 30 5-21 22 4 31-26-14-27 14 5-31L7 39l30-5Z"/>' };
      body = '<g fill="' + c + '" stroke="' + c + '" stroke-width="5">' + shapes[id] + '</g><ellipse cx="39" cy="35" rx="14" ry="7" fill="white" opacity=".3"/>';
    } else {
      const ears = { cat: '<path d="M18 44 15 9l27 18M82 44 85 9 58 27" fill="' + c + '" stroke="#bf8455" stroke-width="3"/><path d="m23 29-2-11 12 12m44-1 2-11-12 12" fill="#edbec1"/>', rabbit: '<ellipse cx="32" cy="22" rx="12" ry="22" fill="' + c + '"/><ellipse cx="68" cy="22" rx="12" ry="22" fill="' + c + '"/><path d="M32 9v22m36-22v22" stroke="#f7dfe5" stroke-width="10" stroke-linecap="round"/>', bear: '<circle cx="22" cy="27" r="16" fill="' + c + '"/><circle cx="78" cy="27" r="16" fill="' + c + '"/><circle cx="22" cy="27" r="9" fill="#ddbb9e"/><circle cx="78" cy="27" r="9" fill="#ddbb9e"/>', frog: '<circle cx="27" cy="28" r="18" fill="' + c + '"/><circle cx="73" cy="28" r="18" fill="' + c + '"/>' };
      body = ears[id] + '<ellipse cx="50" cy="57" rx="40" ry="34" fill="' + c + '"/>' + (id === 'bear' ? '<ellipse cx="50" cy="67" rx="20" ry="15" fill="#e9cbb0"/>' : '') + '<ellipse cx="26" cy="65" rx="9" ry="5" fill="#ef8d91" opacity=".65"/><ellipse cx="74" cy="65" rx="9" ry="5" fill="#ef8d91" opacity=".65"/><g fill="#3d4645"><ellipse cx="35" cy="51" rx="3.6" ry="4.5"/><ellipse cx="65" cy="51" rx="3.6" ry="4.5"/></g><path d="m46 63 4 4 4-4m-4 4v4m-10-1q10 10 20 0" fill="none" stroke="#5c4b43" stroke-width="2.5" stroke-linecap="round"/>';
    }
    return svg(body, 'pt-token ' + (cls || ''));
  }
  function wheels() {
    return '<span class="pt-wheel pt-wheel-one"><i></i></span><span class="pt-wheel pt-wheel-two"><i></i></span>';
  }
  function engine() {
    return '<div class="pt-engine" aria-label="토끼 기관사의 기관차">' + svg('<path d="M6 127h153l-7 13H4Z" fill="#425b61"/><rect x="17" y="73" width="84" height="49" rx="22" fill="#4c8e87"/><path d="M19 80h73v10H19Z" fill="#75afa1"/><rect x="37" y="48" width="19" height="33" rx="3" fill="#416c6e"/><path d="M31 42h31v12H31Z" fill="#e8b756"/><rect x="96" y="47" width="57" height="76" rx="8" fill="#e9a356"/><path d="M88 41q32-16 71 0v12H88Z" fill="#477b77"/><rect x="106" y="59" width="35" height="39" rx="9" fill="#dcece1"/><ellipse cx="116" cy="69" rx="4" ry="12" fill="#e6b9c7"/><ellipse cx="132" cy="69" rx="4" ry="12" fill="#e6b9c7"/><ellipse cx="124" cy="84" rx="15" ry="13" fill="#e6b9c7"/><circle cx="119" cy="82" r="1.5" fill="#435b55"/><circle cx="129" cy="82" r="1.5" fill="#435b55"/><path d="m120 89 4 2 4-2" fill="none" stroke="#88676d" stroke-width="2"/><path d="M111 65q13-9 26 0v4h-26Z" fill="#498f9a"/><rect x="2" y="100" width="14" height="21" rx="6" fill="#e8b756"/><path d="M89 107h52v8H89Z" fill="#fff1ce"/><circle cx="65" cy="103" r="9" fill="#f4cf72"/><path d="m61 103 3 3 6-8" fill="none" stroke="#856d43" stroke-width="2"/>', 'pt-engine-art', '0 0 165 150') + '<span class="pt-steam pt-steam-one"></span><span class="pt-steam pt-steam-two"></span>' + wheels() + '</div>';
  }
  function timer(fn, delay) { const id = window.setTimeout(() => { view.timers.delete(id); if (view.container) fn(); }, delay); view.timers.add(id); return id; }
  function clearTimers() { view.timers.forEach(id => clearTimeout(id)); view.timers.clear(); }
  function read(key) {
    if (own(memory, key)) return clone(memory[key]);
    try { const raw = localStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; }
    catch (_) { view.saveFailed = true; return null; }
  }
  function write(key, value) {
    memory[key] = clone(value);
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (_) { view.saveFailed = true; }
  }
  function age() { const value = Number(window.SihyeonPlaySettings?.getAge?.() || view.options.ageMode || 5); return [4, 5, 6, 7].includes(value) ? value : 5; }
  function loadPrefs() {
    const raw = read('preferences');
    view.prefs = { version: 1, levels: {}, cursors: {}, freeTheme: 'animal' };
    if (raw && raw.version === 1) {
      [4, 5, 6, 7].forEach(n => { if ([4, 5, 6, 7].includes(raw.levels?.[n])) view.prefs.levels[n] = raw.levels[n]; });
      [4, 5, 6, 7].forEach(n => { if (Number.isInteger(raw.cursors?.[n]) && raw.cursors[n] >= 0 && raw.cursors[n] < 5) view.prefs.cursors[n] = raw.cursors[n]; });
      if (['animal', 'color', 'shape'].includes(raw.freeTheme)) view.prefs.freeTheme = raw.freeTheme;
      if (raw.mode === 'free') view.prefs.mode = 'free';
    }
    view.muted = raw?.muted === true;
  }
  function save() {
    if (!view.state) return;
    write('board:' + view.state.taskId, view.state);
    view.prefs.muted = view.muted; view.prefs.mode = view.mode;
    view.prefs.levels[view.age] = view.level; view.prefs.cursors[view.level] = view.cursor;
    write('preferences', view.prefs);
  }
  function stopVoice() { view.voiceToken++; try { window.SihyeonVoice?.stop?.(); } catch (_) {} }
  function speak(text) {
    if (!view.container || view.muted) return;
    stopVoice(); const ticket = view.voiceToken; let settled = false;
    function fallback(ok) {
      if (settled || !view.container || ticket !== view.voiceToken) return;
      settled = true;
      if (!ok) { view.voiceFailed = true; const note = view.container.querySelector('.pt-voice-note'); if (note) { note.hidden = false; note.textContent = '그림을 보며 함께 만들어요'; } }
    }
    try {
      const result = typeof view.options.say === 'function' ? view.options.say(text) : window.SihyeonVoice?.speak?.(text, { lang: 'ko-KR', rate: .86, pitch: 1.08 });
      Promise.resolve(result).then(value => fallback(value !== false && value !== undefined), () => fallback(false));
    } catch (_) { fallback(false); }
    timer(() => fallback(false), 10000);
  }
  function instruction() {
    const task = view.task;
    if (task.kind === 'free') return '마음대로 태워 줘. 다 타면 기차를 출발시키자!';
    if (task.kind === 'unit') return '처음부터 되풀이되는 가장 작은 묶음을 골라 줘.';
    if (task.kind === 'alternative') return '빨강 둘, 파랑 둘. 순서를 바꿔 새 묶음을 만들고 찍어 줘.';
    if (task.kind === 'copy') return '네 묶음을 만들고 도장을 꾹! 기차에 세 번 찍어 줘.';
    if (task.kind === 'translate') return '화살표 친구로 바꿔 태워 줘. 같은 순서로 이어 가자.';
    if (task.kind === 'ambiguous') return '두 칸, 세 칸, 네 칸 묶음으로 생각해 봐. 여러 방법이 있어!';
    return '이 묶음이 되풀이돼. 친구를 고르고 빈 객차를 톡!';
  }
  function loadTask(task, fresh) {
    cancelDrag(); view.tripToken++; stopVoice();
    const stored = fresh ? null : M().restoreState(read('board:' + task.id));
    view.task = task; view.state = stored && stored.taskId === task.id ? stored : M().createState(task);
    // A free board remembers its own length.
    if (view.state.free) view.task = M().resolveTask(view.state);
    view.erase = false; view.modal = null; save(); draw();
    const frame = view.container.querySelector('.pt-train-scroll'); if (frame) frame.scrollLeft = 0;
    const taskId = view.task.id, firstEmpty = view.state.board.indexOf(null);
    if (firstEmpty >= 0) timer(() => { if (view.task?.id === taskId && !view.drag && view.state.phase === 'BUILDING') scrollToIndex(firstEmpty); }, 280);
    timer(() => speak(instruction()), 160);
  }
  function loadCourse(level, index, fresh) {
    view.mode = 'course'; view.level = level; view.cursor = Math.max(0, Math.min(4, index));
    loadTask(M().getTasks(level)[view.cursor], fresh);
  }
  function loadFree(theme) {
    view.mode = 'free'; view.prefs.freeTheme = theme;
    loadTask(M().createFreeTask(theme, 6), false);
  }
  function dispatch(action, shouldDraw) {
    const next = M().reduce(view.state, action);
    if (next === view.state) return false;
    view.state = next; save(); if (shouldDraw !== false) draw(); return true;
  }
  function rowPictures(values, extra) { return '<span class="pt-rule-pictures ' + (extra || '') + '">' + values.map(value => token(value)).join('') + '</span>'; }
  function guideHtml() {
    const t = view.task, locked = view.state.phase !== 'BUILDING' ? ' disabled' : '';
    let content = '';
    if (t.kind === 'translate') {
      content = '<div class="pt-translation"><div class="pt-motif">' + rowPictures(t.reference) + '<span class="pt-repeat-sign" aria-label="이 묶음 반복">↻</span></div><div class="pt-mappings" aria-label="그림 대응">' + Object.entries(t.mapping).map(([a, b]) => '<span aria-label="' + M().TOKENS[a].name + ' 대신 ' + M().TOKENS[b].name + '">' + token(a) + icon('arrow') + token(b) + '</span>').join('') + '</div></div>';
    } else if (t.seedSize) {
      content = (t.kind === 'alternative' ? '<div class="pt-reference" aria-label="바꿀 원래 묶음">' + rowPictures(t.reference) + icon('arrow') + '</div>' : '') + '<div class="pt-seed" aria-label="내 반복 묶음">' + view.state.seed.map((v, i) => '<button class="pt-seed-slot ' + (v ? 'filled' : 'empty') + '" type="button" data-action="seed" data-seed="' + i + '" aria-label="내 묶음 ' + (i + 1) + '번째, ' + (v ? M().TOKENS[v].name : '빈칸') + '"' + locked + '>' + token(v) + '</button>').join('') + '</div><button class="pt-stamp" data-action="copy" type="button" aria-label="내 묶음을 기차에 세 번 복제"' + (locked || (view.state.seed.some(v => !v) ? ' disabled' : '')) + '>' + icon('stamp') + '<span>찍기</span></button>';
    } else if (t.kind === 'unit') {
      content = '<div class="pt-periods" aria-label="가장 작은 반복 묶음 고르기">' + t.periodChoices.map(p => '<button data-action="period" data-period="' + p + '" aria-label="' + p + '칸 묶음" aria-pressed="' + (view.state.chosenPeriod === p) + '" type="button"' + locked + '><span class="pt-length-dots">' + Array(p).fill('<i></i>').join('') + '</span><span>' + p + '칸</span></button>').join('') + '</div>';
    } else if (t.kind === 'ambiguous') {
      content = '<div class="pt-possible-units" aria-label="2칸, 3칸, 4칸 반복 묶음 중 어느 것이든 가능">' + t.allowedPeriods.map(p => '<span><span class="pt-length-dots">' + Array(p).fill('<i></i>').join('') + '</span><small>' + p + '칸</small></span>').join('<b>또는</b>') + '</div>';
    } else if (t.kind === 'free') {
      content = '<div class="pt-free-themes">' + [['animal', 'cat', '동물'], ['color', 'red', '색깔'], ['shape', 'star', '모양']].map(([theme, picture, text]) => '<button type="button" data-action="theme" data-theme="' + theme + '" aria-label="' + text + ' 공작" aria-pressed="' + (t.theme === theme) + '"' + locked + '>' + token(picture) + '<span>' + text + '</span></button>').join('') + '</div><div class="pt-length-controls"><button type="button" data-action="shorter" aria-label="객차 한 칸 줄이기"' + (locked || (t.size <= 2 ? ' disabled' : '')) + '>' + icon('minus') + '</button><span>' + t.size + '칸</span><button type="button" data-action="longer" aria-label="객차 한 칸 늘리기"' + (locked || (t.size >= 12 ? ' disabled' : '')) + '>' + icon('plus') + '</button></div>';
    } else {
      content = '<div class="pt-motif" aria-label="되풀이할 묶음 ' + t.unit.map(v => M().TOKENS[v].name).join(', ') + '">' + rowPictures(t.unit) + '<span class="pt-repeat-sign" aria-label="이 묶음 반복">↻</span></div>' + (t.unit.length <= 4 ? '<div class="pt-picture-guide" aria-hidden="true">' + icon('hand') + token(view.state.selected) + icon('arrow') + '<span class="pt-mini-coach">+</span></div>' : '');
    }
    return '<section class="pt-guide"><div class="pt-guide-heading"><span class="pt-guide-label">' + (t.kind === 'free' ? '정답 없이, 마음대로' : t.title) + '</span><button class="pt-challenge" type="button" data-action="challenge"' + (view.state.phase === 'RUNNING' ? ' disabled' : '') + '>' + icon('book') + '<span>도전 바꾸기</span></button></div><div class="pt-guide-content">' + content + '</div></section>';
  }
  function coachHtml(value, i) {
    const fixed = view.task.clues[i] !== null;
    const failed = view.state.lastResult && !view.state.lastResult.ok && view.state.lastResult.wrong.includes(i);
    const p = view.state.phase !== 'BUILDING' ? view.state.lastResult?.period : view.task.showUnit ? view.task.unit?.length : view.state.chosenPeriod;
    const classes = ['pt-coach', value ? 'filled' : 'empty', fixed ? 'fixed' : 'editable', failed ? 'needs-friend' : '', p && i % p === 0 ? 'group-start' : ''].join(' ');
    return '<div class="' + classes + '" data-coach="' + i + '"><span class="pt-coupling"></span><button type="button" class="pt-seat" data-action="seat" data-index="' + i + '" data-token="' + (value || '') + '" aria-label="' + (i + 1) + '번 객차, ' + (value ? M().TOKENS[value].name : '빈 객차') + (fixed ? ', 보기' : ', 선택한 친구 태우기') + '"' + (view.state.phase !== 'BUILDING' ? ' disabled' : '') + '>' + token(value) + '<span class="pt-seat-sign" aria-hidden="true">' + (fixed ? '<i></i>' : value ? '' : '+') + '</span></button><span class="pt-coach-number">' + (i + 1) + '</span>' + wheels() + (!fixed && value && view.state.phase === 'BUILDING' ? '<button type="button" class="pt-remove" data-action="remove" data-index="' + i + '" aria-label="' + (i + 1) + '번 객차의 친구 꺼내기">' + icon('return') + '</button>' : '') + '</div>';
  }
  function stageHtml() {
    return '<section class="pt-stage" aria-label="기차 작업장"><div class="pt-scenery" aria-hidden="true"><span class="pt-sun"></span><span class="pt-cloud cloud-one"></span><span class="pt-cloud cloud-two"></span><span class="pt-hill hill-back"></span><span class="pt-hill hill-front"></span><span class="pt-tree tree-one"></span><span class="pt-tree tree-two"></span><span class="pt-station"><i></i><b>반복역</b></span></div><div class="pt-stage-caption">' + (view.state.phase === 'RUNNING' ? '칙칙폭폭, 내 규칙이 달려요!' : view.state.phase === 'ARRIVED' ? '도착! 내가 만든 기차예요' : '친구를 고르고, 객차를 톡!') + '</div><div class="pt-train-scroll" tabindex="0" aria-label="기차를 좌우로 움직여 모든 객차 보기"><div class="pt-rail"></div><div class="pt-train-row">' + engine() + view.state.board.map(coachHtml).join('') + '<div class="pt-train-tail" aria-hidden="true"></div></div></div><div class="pt-scroll-tools"><button type="button" data-action="scroll-left" aria-label="기차 앞쪽 보기">‹</button><span>' + (view.state.phase === 'BUILDING' ? '옆으로 움직여 뒤 객차도 보아요' : '묶음이 다시, 또 다시') + '</span><button type="button" data-action="scroll-right" aria-label="기차 뒤쪽 보기">›</button></div></section>';
  }
  function paletteHtml() {
    const locked = view.state.phase !== 'BUILDING';
    return '<aside class="pt-palette" aria-label="기차 부품"><div class="pt-palette-heading"><span>태울 친구</span><small>톡 · 끌기</small></div><div class="pt-palette-grid">' + view.task.palette.map(id => '<button type="button" class="pt-part" data-action="select" data-token="' + id + '" aria-label="' + M().TOKENS[id].name + ' 선택" aria-pressed="' + (view.state.selected === id && !view.erase) + '"' + (locked ? ' disabled' : '') + '>' + token(id) + '<span>' + M().TOKENS[id].name + '</span><i class="pt-selected-check">' + icon('check') + '</i></button>').join('') + '</div><button type="button" class="pt-eraser" data-action="eraser" aria-label="친구 꺼내기 도구" aria-pressed="' + view.erase + '"' + (locked ? ' disabled' : '') + '>' + icon('return') + '<span>꺼내기</span></button><small class="pt-palette-help">바꿔 태워도 괜찮아요</small></aside>';
  }
  function resultText() {
    const result = view.state.lastResult;
    if (view.state.phase === 'RUNNING') return '친구들이 차례차례 지나가요';
    if (view.state.phase === 'ARRIVED') return view.mode === 'free' ? '멋진 기차야! 또 바꿔 만들어 볼까?' : view.task.kind === 'ambiguous' ? '이 방법도 좋아! 다른 규칙도 만들어 볼까?' : '도착했어! 고치거나 다음 역으로 가자';
    if (!result || result.ok) return view.task.kind === 'free' ? '내가 원하는 순서로, 자유롭게!' : view.task.kind === 'unit' ? '처음부터 같은 묶음이 반복되나요?' : view.task.seedSize ? '내 묶음을 만들고, 도장을 꾹!' : '빈 객차에 친구를 태워 주세요';
    return ({ empty: '빈 객차에도 친구를 태워 줘', unit: '처음부터 되풀이되는 가장 작은 묶음을 찾아봐', seed: '내 묶음의 빈칸을 먼저 채워 줘', materials: '빨강 둘, 파랑 둘을 모두 써 봐', different: '색 자리만 바꾸지 말고, 반복 순서를 바꿔 봐', pattern: '반짝이는 객차를 다시 살펴볼까?', clue: '보기 친구는 자리를 지켜요' })[result.code] || '다시 고쳐도 괜찮아요';
  }
  function footerHtml() {
    const phase = view.state.phase;
    return '<footer class="pt-footer"><div class="pt-feedback" role="status" aria-live="polite"><span class="pt-friend-face">' + token('rabbit') + '</span><span>' + resultText() + '<small class="pt-voice-note" ' + (view.voiceFailed ? '' : 'hidden') + '>그림을 보며 함께 만들어요</small><small class="pt-save-note" ' + (view.saveFailed ? '' : 'hidden') + '>이 화면에는 보관돼요. 다시 열 때는 저장이 안 될 수 있어요.</small></span></div><div class="pt-actions">' + (phase === 'ARRIVED' ? '<button type="button" class="pt-button pt-edit" data-action="edit">' + icon('edit') + '<span>고쳐 만들기</span></button><button type="button" class="pt-button pt-go" data-action="' + (view.mode === 'free' ? 'replay' : 'next') + '">' + icon('play') + '<span>' + (view.mode === 'free' ? '또 출발' : view.cursor === 4 ? '여행 완성' : '다음 역') + '</span></button>' : '<button type="button" class="pt-button pt-undo" data-action="undo" aria-label="한 번 되돌리기"' + (!view.state.history.length || phase !== 'BUILDING' ? ' disabled' : '') + '>' + icon('undo') + '</button><button type="button" class="pt-button pt-go" data-action="start"' + (phase !== 'BUILDING' ? ' disabled' : '') + '>' + icon('play') + '<span>' + (phase === 'RUNNING' ? '달리는 중' : '출발!') + '</span></button>') + '</div></footer>';
  }
  function modalHtml() {
    if (!view.modal) return '';
    let body = '';
    if (view.modal === 'restart') body = '<h2 id="ptDialogTitle">이 기차를 다시 만들까요?</h2><div class="pt-modal-picture">' + engine() + '</div><p>다른 기차 작품은 그대로 보관돼요.</p><div class="pt-dialog-actions"><button data-action="close-modal" type="button">이어서 만들기</button><button data-action="confirm-reset" type="button">새로 만들기</button></div>';
    if (view.modal === 'challenge') body = '<h2 id="ptDialogTitle">어떤 규칙으로 놀까요?</h2><p>나이와 상관없이 어떤 놀이든 골라요.</p><div class="pt-challenge-list">' + [4, 5, 6, 7].map(n => '<button type="button" data-action="level" data-level="' + n + '" aria-pressed="' + (view.mode === 'course' && view.level === n) + '">' + rowPictures(n === 4 ? ['cat', 'rabbit'] : n === 5 ? ['cat', 'cat', 'rabbit'] : n === 6 ? ['red', 'blue', 'yellow'] : ['circle', 'triangle', 'circle', 'square']) + '<span>' + LEVELS[n] + '<small>' + n + '세 추천</small></span></button>').join('') + '</div><button class="pt-free-choice" type="button" data-action="free">' + icon('spark') + '자유 공작</button><button class="pt-dialog-close" data-action="close-modal" aria-label="도전 선택 닫기" type="button">' + icon('close') + '</button>';
    if (view.modal === 'complete') body = '<div class="pt-complete-art">' + token('cat') + token('rabbit') + token('bear') + '</div><h2 id="ptDialogTitle">다섯 정거장, 모두 도착!</h2><p>이번에는 나만의 기차를 만들어 볼까?</p><div class="pt-dialog-actions"><button data-action="tour-again" type="button">한 번 더 여행</button><button data-action="free" type="button">자유 공작</button></div><button class="pt-dialog-close" data-action="close-modal" aria-label="완성 기차로 돌아가기" type="button">' + icon('close') + '</button>';
    return '<div class="pt-overlay"><section class="pt-dialog" role="dialog" aria-modal="true" aria-labelledby="ptDialogTitle">' + body + '</section></div>';
  }
  function draw() {
    if (!view.container || !view.state) return;
    const scroll = view.container.querySelector('.pt-train-scroll')?.scrollLeft || 0;
    const focused = document.activeElement;
    const focusAction = focused && view.container.contains(focused) ? focused.dataset.action : '';
    const focusKey = focused?.dataset.index ?? focused?.dataset.token ?? focused?.dataset.seed ?? focused?.dataset.period ?? '';
    const locked = view.state.phase === 'RUNNING';
    view.container.innerHTML = '<div class="pt-app ' + (view.state.phase === 'RUNNING' ? 'pt-running' : '') + ' ' + (view.erase ? 'pt-erasing' : '') + '" data-phase="' + view.state.phase + '" data-task="' + view.task.id + '"><header class="pt-top"><button class="pt-icon-button pt-home" type="button" data-action="home" aria-label="작품 보관하고 놀이터로">' + icon('home') + '</button><div class="pt-brand"><small>칙칙폭폭, 규칙을 만들어요</small><h1>패턴 기차 공작소</h1></div><div class="pt-top-tools"><button class="pt-icon-button" type="button" data-action="repeat" aria-label="안내 다시 듣기">' + icon('hear') + '</button><button class="pt-icon-button" type="button" data-action="mute" aria-label="' + (view.muted ? '소리 켜기' : '음소거') + '" aria-pressed="' + view.muted + '">' + icon(view.muted ? 'mute' : 'sound') + '</button><button class="pt-icon-button" type="button" data-action="restart" aria-label="현재 기차 다시 만들기"' + (locked ? ' disabled' : '') + '>' + icon('restart') + '</button></div></header><nav class="pt-mode-bar" aria-label="추천 놀이 연령"><div class="pt-ages">' + [4, 5, 6, 7].map(n => '<button type="button" data-action="age" data-age="' + n + '" aria-pressed="' + (view.age === n) + '"' + (locked ? ' disabled' : '') + '>' + n + '<small>세</small></button>').join('') + '</div><div class="pt-route" aria-label="다섯 정거장">' + (view.mode === 'course' ? M().getTasks(view.level).map((t, i) => '<button type="button" data-action="stop" data-stop="' + i + '" aria-label="' + (i + 1) + '번째 놀이, ' + t.title + '" aria-current="' + (i === view.cursor ? 'step' : 'false') + '"' + (locked ? ' disabled' : '') + '><span>' + (i + 1) + '</span></button>').join('') : '<span class="pt-free-label">나의 자유 공작</span>') + '</div><button class="pt-free-toggle" type="button" data-action="' + (view.mode === 'free' ? 'course' : 'free') + '"' + (locked ? ' disabled' : '') + '>' + icon(view.mode === 'free' ? 'book' : 'spark') + '<span>' + (view.mode === 'free' ? '여행' : '자유 공작') + '</span></button></nav><main class="pt-workshop">' + guideHtml() + stageHtml() + paletteHtml() + footerHtml() + '</main>' + modalHtml() + '<div class="pt-drag-announcement" aria-live="polite"></div></div>';
    const viewport = view.container.querySelector('.pt-train-scroll'); if (viewport) viewport.scrollLeft = scroll;
    if (view.modal) { view.container.querySelector('.pt-dialog button')?.focus({ preventScroll: true }); }
    else if (focusAction && !locked) {
      const matches = [...view.container.querySelectorAll('[data-action="' + focusAction + '"]')];
      const restore = matches.find(e => (e.dataset.index ?? e.dataset.token ?? e.dataset.seed ?? e.dataset.period ?? '') === focusKey);
      restore?.focus({ preventScroll: true });
    }
  }
  function scrollToIndex(index) {
    const frame = view.container?.querySelector('.pt-train-scroll'), seat = view.container?.querySelector('[data-coach="' + index + '"]');
    if (!frame || !seat) return;
    const frameBox = frame.getBoundingClientRect(), box = seat.getBoundingClientRect();
    if (box.left < frameBox.left + 8 || box.right > frameBox.right - 8) frame.scrollBy({ left: box.left - frameBox.left - frameBox.width / 2 + box.width / 2, behavior: 'smooth' });
  }
  function beginTrip() {
    if (view.state.phase !== 'RUNNING') return;
    const ticket = ++view.tripToken;
    const frame = view.container.querySelector('.pt-train-scroll'), row = view.container.querySelector('.pt-train-row');
    if (!frame || !row) return;
    frame.scrollLeft = 0;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 1800 : 4200 + view.task.size * 250;
    row.style.setProperty('--trip-distance', '-' + (row.scrollWidth + 40) + 'px');
    row.style.setProperty('--trip-duration', duration + 'ms');
    const period = view.state.lastResult?.period || view.state.board.length;
    function beat(index) {
      if (ticket !== view.tripToken || view.state?.phase !== 'RUNNING') return;
      view.container.querySelectorAll('.pt-coach').forEach((coach, i) => coach.classList.toggle('pt-beat', i % period === index % period));
      timer(() => beat(index + 1), 420);
    }
    beat(0); speak(view.mode === 'free' ? '내 기차, 출발!' : '규칙을 따라, 출발!');
    timer(() => {
      if (ticket !== view.tripToken || view.state.phase !== 'RUNNING') return;
      dispatch({ type: 'arrive' });
      speak(view.mode === 'free' ? '멋진 기차야!' : '도착! 한 번 더 만들어 볼까?');
      try { view.options.fireConfetti?.(); } catch (_) {}
    }, duration + 60);
  }
  function start() {
    if (view.state.phase !== 'BUILDING') return;
    cancelDrag(); dispatch({ type: 'start' });
    if (view.state.phase === 'RUNNING') beginTrip();
    else { speak(resultText()); const index = view.state.lastResult?.wrong?.[0]; if (Number.isInteger(index)) scrollToIndex(index); }
  }
  function changeLength(delta) {
    const old = view.state, length = Math.max(2, Math.min(12, old.size + delta));
    if (length === old.size || !old.free || old.phase !== 'BUILDING') return;
    view.task = M().createFreeTask(old.theme, length); view.state = M().createState(view.task);
    view.state.board = Array.from({ length }, (_, i) => old.board[i] || null); view.state.selected = old.selected;
    save(); draw(); if (delta > 0) scrollToIndex(length - 1);
  }
  function onClick(event) {
    const button = event.target.closest?.('[data-action]');
    if (!button || !view.container?.contains(button) || button.disabled || Date.now() < view.suppressClickUntil) return;
    const action = button.dataset.action;
    if (view.modal && !button.closest('.pt-dialog')) return;
    if (view.state.phase === 'RUNNING' && !['home', 'repeat', 'mute', 'scroll-left', 'scroll-right'].includes(action)) return;
    if (action === 'home') { save(); const leave = view.options.closeToParkHome; destroy(); if (typeof leave === 'function') leave(); return; }
    if (action === 'repeat') { speak(view.state.phase === 'BUILDING' ? instruction() : resultText()); return; }
    if (action === 'mute') { view.muted = !view.muted; stopVoice(); save(); button.innerHTML = icon(view.muted ? 'mute' : 'sound'); button.setAttribute('aria-label', view.muted ? '소리 켜기' : '음소거'); button.setAttribute('aria-pressed', String(view.muted)); if (!view.muted) speak(instruction()); return; }
    if (action === 'scroll-left' || action === 'scroll-right') { const frame = view.container.querySelector('.pt-train-scroll'); frame?.scrollBy({ left: frame.clientWidth * (action === 'scroll-left' ? -.7 : .7), behavior: 'smooth' }); return; }
    if (action === 'select') { view.erase = false; if (!dispatch({ type: 'select', token: button.dataset.token })) draw(); speak(M().TOKENS[button.dataset.token].name); return; }
    if (action === 'eraser') { view.erase = !view.erase; draw(); speak(view.erase ? '꺼낼 친구를 톡 눌러 줘.' : '친구를 다시 태워 줘.'); return; }
    if (action === 'seat') {
      const index = Number(button.dataset.index);
      if (view.task.clues[index] !== null) { speak(M().TOKENS[view.state.board[index]].name + '. 보기 친구야.'); return; }
      if (dispatch({ type: view.erase ? 'remove' : 'place', index })) speak(view.erase ? '내렸어.' : M().TOKENS[view.state.selected].name + ', 탔어!');
      return;
    }
    if (action === 'remove') { dispatch({ type: 'remove', index: Number(button.dataset.index) }); speak('다시 태워도 좋아.'); return; }
    if (action === 'seed') { dispatch({ type: 'seed', index: Number(button.dataset.seed), token: view.erase ? null : view.state.selected }); return; }
    if (action === 'copy') { dispatch({ type: 'copy' }); speak('내 묶음이 세 번 이어졌어!'); return; }
    if (action === 'period') { dispatch({ type: 'period', period: Number(button.dataset.period) }); speak(button.dataset.period + '칸 묶음으로 살펴보자.'); return; }
    if (action === 'undo') { dispatch({ type: 'undo' }); return; }
    if (action === 'start') { start(); return; }
    if (action === 'edit') { dispatch({ type: 'edit' }); speak('마음껏 고쳐 봐.'); return; }
    if (action === 'replay') { dispatch({ type: 'edit' }, false); start(); return; }
    if (action === 'restart') { view.modal = 'restart'; draw(); return; }
    if (action === 'confirm-reset') { view.modal = null; dispatch({ type: 'reset' }); speak(instruction()); return; }
    if (action === 'close-modal') { view.modal = null; draw(); return; }
    if (action === 'challenge') { view.modal = 'challenge'; draw(); return; }
    if (action === 'next') { if (view.cursor === 4) { view.modal = 'complete'; draw(); } else loadCourse(view.level, view.cursor + 1, false); return; }
    if (action === 'tour-again') {
      M().getTasks(view.level).forEach(task => write('board:' + task.id, M().createState(task)));
      loadCourse(view.level, 0, false); return;
    }
    if (action === 'level') { const level = Number(button.dataset.level); loadCourse(level, view.prefs.cursors[level] || 0, false); return; }
    if (action === 'stop') { loadCourse(view.level, Number(button.dataset.stop), false); return; }
    if (action === 'free') { loadFree(view.prefs.freeTheme); return; }
    if (action === 'course') { loadCourse(view.level, view.cursor, false); return; }
    if (action === 'theme') { loadFree(button.dataset.theme); return; }
    if (action === 'longer' || action === 'shorter') { changeLength(action === 'longer' ? 1 : -1); return; }
    if (action === 'age') {
      const nextAge = Number(button.dataset.age); save();
      if (typeof window.SihyeonPlaySettings?.setAge === 'function') window.SihyeonPlaySettings.setAge(nextAge);
      else { view.age = nextAge; loadCourse(view.prefs.levels[nextAge] || nextAge, view.prefs.cursors[view.prefs.levels[nextAge] || nextAge] || 0, false); }
    }
  }
  function cancelDrag(announce) {
    const old = view.drag; view.drag = null;
    if (old?.moved) { view.suppressClickUntil = Date.now() + 500; if (view.activePointers.has(old.pointerId)) view.blockedGesture = true; }
    if (old) { try { if (view.container?.hasPointerCapture(old.pointerId)) view.container.releasePointerCapture(old.pointerId); } catch (_) {} }
    view.ghost?.remove(); view.ghost = null;
    view.container?.querySelectorAll('.pt-drop-target').forEach(el => el.classList.remove('pt-drop-target'));
    if (announce && view.container) { const note = view.container.querySelector('.pt-drag-announcement'); if (note) note.textContent = '친구가 제자리에 있어요.'; }
  }
  function pointerDown(event) {
    if (!view.state || view.modal || view.state.phase !== 'BUILDING' || event.button > 0) return;
    if (event.isPrimary !== false && !view.drag) { view.activePointers.clear(); view.blockedGesture = false; }
    view.activePointers.add(event.pointerId);
    if (view.blockedGesture || event.isPrimary === false || view.activePointers.size > 1 || (view.drag && view.drag.pointerId !== event.pointerId)) { view.blockedGesture = true; cancelDrag(true); view.suppressClickUntil = Date.now() + 700; return; }
    const button = event.target.closest?.('[data-action]');
    if (!button || button.disabled || !view.container.contains(button) || view.erase) return;
    const source = button.dataset.action === 'select' ? 'palette' : button.dataset.action === 'seat' ? 'coach' : '';
    if (!source || !button.dataset.token) return;
    const from = Number(button.dataset.index);
    if (source === 'coach' && view.task.clues[from] !== null) return;
    view.drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, token: button.dataset.token, source, from, moved: false };
  }
  function otherPointerDown(event) {
    if (!view.drag && !view.container?.contains(event.target)) return;
    // A new primary down starts a new gesture even if a previous pointer ended
    // outside this browsing context. A secondary down never clears the lock.
    if (event.isPrimary !== false && !view.drag) { view.activePointers.clear(); view.blockedGesture = false; }
    view.activePointers.add(event.pointerId);
    if (view.activePointers.size > 1 || (view.drag && event.pointerId !== view.drag.pointerId)) { view.blockedGesture = true; cancelDrag(true); view.suppressClickUntil = Date.now() + 700; }
  }
  function dropTarget(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el || !view.container?.contains(el)) return null;
    const target = el.closest('[data-action="seat"], [data-action="seed"], .pt-palette');
    if (!target || target.disabled) return null;
    if (target.dataset.action === 'seat' && view.task.clues[Number(target.dataset.index)] !== null) return null;
    return target;
  }
  function pointerMove(event) {
    const drag = view.drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 9) return;
    if (!drag.moved) {
      drag.moved = true;
      try { view.container.setPointerCapture(event.pointerId); } catch (_) {}
      view.ghost = document.createElement('div'); view.ghost.className = 'pt-drag-ghost'; view.ghost.setAttribute('aria-hidden', 'true'); view.ghost.innerHTML = token(drag.token); document.body.appendChild(view.ghost);
    }
    if (event.cancelable) event.preventDefault();
    view.ghost.style.left = event.clientX + 'px'; view.ghost.style.top = event.clientY + 'px';
    view.container.querySelectorAll('.pt-drop-target').forEach(el => el.classList.remove('pt-drop-target'));
    const target = dropTarget(event.clientX, event.clientY); target?.classList.add('pt-drop-target');
    const frame = view.container.querySelector('.pt-train-scroll'), box = frame.getBoundingClientRect();
    if (event.clientY > box.top && event.clientY < box.bottom) { if (event.clientX < box.left + 30) frame.scrollLeft -= 18; else if (event.clientX > box.right - 30) frame.scrollLeft += 18; }
  }
  function pointerUp(event) {
    view.activePointers.delete(event.pointerId);
    if (view.blockedGesture) {
      cancelDrag(true); view.suppressClickUntil = Date.now() + 600;
      if (!view.activePointers.size) view.blockedGesture = false;
      return;
    }
    const drag = view.drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved) { view.drag = null; return; }
    const target = dropTarget(event.clientX, event.clientY); cancelDrag(); view.suppressClickUntil = Date.now() + 500;
    if (!target || view.state.phase !== 'BUILDING') return;
    if (target.classList.contains('pt-palette')) { if (drag.source === 'coach') dispatch({ type: 'remove', index: drag.from }); return; }
    if (target.dataset.action === 'seed') { if (drag.source === 'palette') { const selected = dispatch({ type: 'select', token: drag.token }, false); if (!dispatch({ type: 'seed', index: Number(target.dataset.seed), token: drag.token }) && selected) draw(); } return; }
    const to = Number(target.dataset.index);
    const selected = drag.source === 'palette' && dispatch({ type: 'select', token: drag.token }, false);
    const placed = dispatch(drag.source === 'coach' ? { type: 'move', from: drag.from, to } : { type: 'place', index: to, token: drag.token });
    if (!placed && selected) draw();
    if (placed) { speak(M().TOKENS[drag.token].name + ', 탔어!'); scrollToIndex(to); }
  }
  function keyDown(event) {
    if (!view.container) return;
    if (event.key === 'Escape') { cancelDrag(true); if (view.modal) { view.modal = null; draw(); } event.preventDefault(); return; }
    if (view.modal && event.key === 'Tab') {
      const controls = [...view.container.querySelectorAll('.pt-dialog button:not(:disabled)')];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    if (!view.modal && view.container.contains(document.activeElement) && view.state.phase === 'BUILDING') {
      if ((event.key === 'Delete' || event.key === 'Backspace') && document.activeElement.dataset.action === 'seat') { event.preventDefault(); dispatch({ type: 'remove', index: Number(document.activeElement.dataset.index) }); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); dispatch({ type: 'undo' }); }
    }
  }
  function parkInterruptedTrip() {
    if (view.state?.phase === 'RUNNING') { view.tripToken++; view.state = M().restoreState(view.state); }
  }
  function bind() {
    const h = view.handlers = {
      click: onClick, down: pointerDown, otherDown: otherPointerDown, move: pointerMove, up: pointerUp,
      cancel: event => { if (view.drag?.pointerId === event.pointerId) cancelDrag(true); if (event.type !== 'lostpointercapture') { view.activePointers.delete(event.pointerId); if (!view.activePointers.size) view.blockedGesture = false; } },
      resize: () => { cancelDrag(true); save(); },
      blur: () => { cancelDrag(true); stopVoice(); save(); },
      visibility: () => { if (document.hidden) { cancelDrag(true); stopVoice(); parkInterruptedTrip(); save(); } else if (view.container) draw(); },
      settings: () => { const nextAge = age(); if (nextAge === view.age) return; save(); parkInterruptedTrip(); view.age = nextAge; const level = view.prefs.levels[nextAge] || nextAge; loadCourse(level, view.prefs.cursors[level] || 0, false); },
      pagehide: () => { cancelDrag(); parkInterruptedTrip(); save(); }, key: keyDown
    };
    view.container.addEventListener('click', h.click); view.container.addEventListener('pointerdown', h.down);
    view.container.addEventListener('lostpointercapture', h.cancel);
    window.addEventListener('pointerdown', h.otherDown, true); window.addEventListener('pointermove', h.move, { passive: false }); window.addEventListener('pointerup', h.up); window.addEventListener('pointercancel', h.cancel);
    window.addEventListener('resize', h.resize); window.addEventListener('orientationchange', h.resize); window.addEventListener('blur', h.blur); window.addEventListener('sihyeon-settings-change', h.settings); window.addEventListener('pagehide', h.pagehide);
    document.addEventListener('visibilitychange', h.visibility); document.addEventListener('keydown', h.key);
  }
  function destroy() {
    if (!view.container) return;
    cancelDrag(); parkInterruptedTrip(); save(); stopVoice(); clearTimers(); view.tripToken++;
    const h = view.handlers;
    if (h) {
      view.container.removeEventListener('click', h.click); view.container.removeEventListener('pointerdown', h.down); view.container.removeEventListener('lostpointercapture', h.cancel);
      window.removeEventListener('pointerdown', h.otherDown, true); window.removeEventListener('pointermove', h.move); window.removeEventListener('pointerup', h.up); window.removeEventListener('pointercancel', h.cancel);
      window.removeEventListener('resize', h.resize); window.removeEventListener('orientationchange', h.resize); window.removeEventListener('blur', h.blur); window.removeEventListener('sihyeon-settings-change', h.settings); window.removeEventListener('pagehide', h.pagehide);
      document.removeEventListener('visibilitychange', h.visibility); document.removeEventListener('keydown', h.key);
    }
    if (view.previousBack?.element) view.previousBack.element.hidden = view.previousBack.hidden;
    view.previousBack = null; view.container = null; view.state = null; view.task = null; view.handlers = null; view.modal = null; view.activePointers.clear(); view.blockedGesture = false;
  }
  function render(container, options) {
    destroy(); if (!container) return;
    view.container = container; view.options = options || {};
    if (!M()) { container.textContent = '기차 공작소를 다시 열어 주세요.'; return; }
    if (!document.getElementById('sihyeon-pattern-train-style')) { const link = document.createElement('link'); link.id = 'sihyeon-pattern-train-style'; link.rel = 'stylesheet'; link.href = './css/games/pattern-train.css'; document.head.appendChild(link); }
    const back = container.closest('.game-play-screen')?.querySelector('.game-back-floating'); if (back) { view.previousBack = { element: back, hidden: back.hidden }; back.hidden = true; }
    view.saveFailed = false; view.voiceFailed = false; view.suppressClickUntil = 0; loadPrefs(); view.age = age(); view.level = view.prefs.levels[view.age] || view.age; view.cursor = view.prefs.cursors[view.level] || 0;
    bind(); if (view.prefs.mode === 'free') loadFree(view.prefs.freeTheme); else loadCourse(view.level, view.cursor, false);
  }
  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames.patternTrain = { id: 'patternTrain', title: '패턴 기차 공작소', render, destroy,
    getSnapshot: () => view.state ? { state: clone(view.state), taskId: view.task.id, age: view.age, level: view.level, cursor: view.cursor, mode: view.mode, muted: view.muted, voiceFailed: view.voiceFailed, saveFailed: view.saveFailed, dragging: !!view.drag?.moved, modal: view.modal } : null };
})();
