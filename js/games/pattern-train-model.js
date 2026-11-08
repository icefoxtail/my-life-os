/* Pattern Train Workshop: deterministic, DOM-free rules and editing state. */
(function (root) {
  'use strict';
  const TOKENS = Object.freeze({
    red: { name: '빨강', theme: 'color', color: '#e45d63' },
    blue: { name: '파랑', theme: 'color', color: '#498bc9' },
    yellow: { name: '노랑', theme: 'color', color: '#f2bc42' },
    green: { name: '초록', theme: 'color', color: '#52a881' },
    circle: { name: '동그라미', theme: 'shape', color: '#e97677' },
    triangle: { name: '세모', theme: 'shape', color: '#55a992' },
    square: { name: '네모', theme: 'shape', color: '#638fd6' },
    star: { name: '별', theme: 'shape', color: '#efbb44' },
    cat: { name: '고양이', theme: 'animal', color: '#e6a764' },
    rabbit: { name: '토끼', theme: 'animal', color: '#e5b2c6' },
    bear: { name: '곰', theme: 'animal', color: '#af886a' },
    frog: { name: '개구리', theme: 'animal', color: '#79ac66' }
  });
  const PALETTES = Object.freeze({ color: ['red', 'blue', 'yellow', 'green'], shape: ['circle', 'triangle', 'square', 'star'], animal: ['cat', 'rabbit', 'bear', 'frog'] });
  const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const clone = v => JSON.parse(JSON.stringify(v));
  const repeat = (unit, count) => Array.from({ length: count }, (_, i) => unit[i % unit.length]);
  const signature = a => { const seen = []; return a.map(v => { if (!seen.includes(v)) seen.push(v); return seen.indexOf(v); }).join(','); };
  function minimalPeriod(board) {
    if (!Array.isArray(board) || !board.length || board.some(x => !owns(TOKENS, x))) return 0;
    for (let p = 1; p <= board.length; p++) if (board.every((v, i) => v === board[i % p])) return p;
    return board.length;
  }
  function candidateUnits(clues, palette, periods) {
    if (!Array.isArray(clues) || !Array.isArray(palette) || !Array.isArray(periods)) return [];
    const out = [];
    for (const p of [...new Set(periods)]) {
      if (!Number.isInteger(p) || p < 1 || p > 6) continue;
      const unit = Array(p).fill(null); let possible = true;
      clues.forEach((v, i) => { if (v !== null) { if (!palette.includes(v) || (unit[i % p] !== null && unit[i % p] !== v)) possible = false; unit[i % p] = v; } });
      if (!possible) continue;
      const walk = i => {
        if (i === p) { out.push({ period: p, unit: unit.slice(), board: repeat(unit, clues.length) }); return; }
        if (unit[i] !== null) return walk(i + 1);
        for (const v of palette) { unit[i] = v; walk(i + 1); }
        unit[i] = null;
      };
      walk(0);
    }
    return out;
  }
  function fill(id, age, kind, title, theme, unit, size, blanks, extra) {
    const answer = repeat(unit, size);
    return Object.assign({ id, age, kind, title, theme, palette: [...new Set(unit)], unit, size, clues: answer.map((v, i) => blanks.includes(i) ? null : v), allowedPeriods: [unit.length], showUnit: true }, extra || {});
  }
  const TASKS = [
    fill('a4-first', 4, 'fill', '친구 한 명을 태워요', 'animal', ['cat', 'rabbit'], 6, [5]),
    fill('a4-colors', 4, 'fill', '색깔 친구 두 칸', 'color', ['red', 'blue'], 6, [3, 5]),
    fill('a4-middle', 4, 'repair', '가운데 빈자리를 찾아요', 'shape', ['circle', 'triangle'], 6, [2]),
    fill('a4-extend', 4, 'extend', '뒤에 친구를 이어요', 'animal', ['bear', 'frog'], 8, [6, 7]),
    fill('a4-pair', 4, 'fill', '앞뒤에 같은 묶음', 'color', ['yellow', 'green'], 8, [0, 3, 6]),
    fill('a5-aab', 5, 'fill', '두 번, 한 번', 'animal', ['cat', 'cat', 'rabbit'], 6, [2, 5]),
    fill('a5-abb', 5, 'fill', '한 번, 두 번', 'shape', ['circle', 'square', 'square'], 6, [1, 4, 5]),
    fill('a5-abc', 5, 'extend', '세 친구의 행진', 'animal', ['cat', 'rabbit', 'bear'], 8, [6, 7]),
    fill('a5-abba', 5, 'repair', '거울처럼 돌아와요', 'color', ['red', 'blue', 'blue', 'red'], 8, [2, 4, 7]),
    fill('a5-aabb', 5, 'fill', '둘씩 함께 타요', 'shape', ['circle', 'circle', 'triangle', 'triangle'], 8, [1, 3, 5, 7]),
    fill('a6-aabc', 6, 'extend', '넷이 한 묶음', 'animal', ['cat', 'cat', 'rabbit', 'bear'], 12, [8, 9, 10, 11]),
    fill('a6-abcc', 6, 'repair', '끝의 두 친구', 'shape', ['circle', 'triangle', 'square', 'square'], 12, [3, 6, 8, 11]),
    fill('a6-abac', 6, 'translate', '그림을 바꿔도 같은 규칙', 'animal', ['cat', 'rabbit', 'cat', 'bear'], 8, [0, 1, 2, 3, 4, 5, 6, 7], { reference: ['circle', 'triangle', 'circle', 'square'], mapping: { circle: 'cat', triangle: 'rabbit', square: 'bear' } }),
    { id: 'a6-copy', age: 6, kind: 'copy', title: '내 묶음을 세 번 찍어요', theme: 'color', palette: ['red', 'blue', 'yellow'], size: 9, seedSize: 3, clues: Array(9).fill(null), showUnit: false },
    fill('a6-abbc', 6, 'translate', '색을 동물 친구로', 'animal', ['frog', 'bear', 'bear', 'rabbit'], 8, [0, 1, 2, 3, 4, 5, 6, 7], { reference: ['green', 'blue', 'blue', 'yellow'], mapping: { green: 'frog', blue: 'bear', yellow: 'rabbit' } }),
    fill('a7-unit', 7, 'unit', '가장 작은 반복 묶음', 'shape', ['circle', 'triangle', 'circle'], 9, [], { showUnit: false, periodChoices: [1, 2, 3, 4, 6] }),
    fill('a7-unit-four', 7, 'unit', '긴 행진 속 작은 묶음', 'animal', ['cat', 'rabbit', 'bear', 'rabbit'], 12, [], { showUnit: false, periodChoices: [2, 3, 4, 6] }),
    { id: 'a7-alternative', age: 7, kind: 'alternative', title: '같은 재료, 새로운 규칙', theme: 'color', palette: ['red', 'blue'], reference: ['red', 'red', 'blue', 'blue'], seedSize: 4, size: 12, clues: Array(12).fill(null), showUnit: false },
    { id: 'a7-ambiguous', age: 7, kind: 'ambiguous', title: '두 가지 길을 찾아요', theme: 'animal', palette: ['cat', 'rabbit'], size: 8, clues: ['cat', 'rabbit', null, null, 'cat', 'rabbit', null, null], allowedPeriods: [2, 3, 4], showUnit: false },
    fill('a7-abacbc', 7, 'extend', '여섯 칸의 긴 이야기', 'shape', ['circle', 'triangle', 'circle', 'square', 'triangle', 'square'], 12, [6, 7, 8, 9, 10, 11])
  ].map(Object.freeze);
  const TASK_BY_ID = Object.fromEntries(TASKS.map(t => [t.id, t]));
  function taskFor(id) { return owns(TASK_BY_ID, id) ? TASK_BY_ID[id] : null; }
  function getTasks(age) { return TASKS.filter(t => t.age === Number(age)); }
  function createFreeTask(theme, size) {
    theme = owns(PALETTES, theme) ? theme : 'animal';
    size = Number.isInteger(Number(size)) ? Math.min(12, Math.max(2, Number(size))) : 8;
    return { id: 'free-' + theme, age: 0, kind: 'free', title: '마음대로 만드는 나의 기차', theme, palette: PALETTES[theme].slice(), size, clues: Array(size).fill(null), showUnit: false };
  }
  function resolveTask(state) {
    if (!state) return null;
    if (state.free) return owns(PALETTES, state.theme) && Number.isInteger(state.size) && state.size >= 2 && state.size <= 12 ? createFreeTask(state.theme, state.size) : null;
    return taskFor(state.taskId);
  }
  function createState(taskOrId) {
    const task = typeof taskOrId === 'string' ? taskFor(taskOrId) : taskOrId;
    if (!task) throw new Error('Unknown pattern task');
    return { version: 1, taskId: task.id, free: task.kind === 'free', theme: task.theme, size: task.size, board: task.clues.slice(), seed: Array(task.seedSize || 0).fill(null), selected: task.palette[0], chosenPeriod: null, phase: 'BUILDING', history: [], departures: 0, lastResult: null };
  }
  function validateBoard(task, board, options) {
    options = options || {};
    if (!task || !Array.isArray(board) || board.length !== task.size || board.some(v => v !== null && !task.palette.includes(v))) return { ok: false, code: 'invalid', wrong: [] };
    const empty = board.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
    if (empty.length) return { ok: false, code: 'empty', wrong: empty };
    const changedClues = task.clues.map((v, i) => v !== null && v !== board[i] ? i : -1).filter(i => i >= 0);
    if (changedClues.length) return { ok: false, code: 'clue', wrong: changedClues };
    if (task.kind === 'free') return { ok: true, code: 'free', wrong: [], graded: false };
    if (task.kind === 'unit') {
      const p = minimalPeriod(board);
      return { ok: options.chosenPeriod === p, code: options.chosenPeriod === p ? 'ok' : 'unit', wrong: [], period: p };
    }
    if (task.kind === 'copy' || task.kind === 'alternative') {
      const seed = options.seed;
      if (!Array.isArray(seed) || seed.length !== task.seedSize || seed.some(v => !task.palette.includes(v))) return { ok: false, code: 'seed', wrong: [] };
      if (task.kind === 'alternative') {
        const a = seed.slice().sort().join('|'), b = task.reference.slice().sort().join('|');
        if (a !== b) return { ok: false, code: 'materials', wrong: [] };
        if (signature(seed) === signature(task.reference)) return { ok: false, code: 'different', wrong: [] };
      }
      const wrong = board.map((v, i) => v !== seed[i % seed.length] ? i : -1).filter(i => i >= 0);
      return { ok: !wrong.length, code: wrong.length ? 'pattern' : 'ok', wrong, period: minimalPeriod(board) };
    }
    // The pictorial rule strip and the explicit picture-to-picture mapping are
    // visible clues too. A hidden residue in the train is not a free variable.
    const shownUnit = task.kind === 'translate' ? task.reference.map(v => task.mapping[v]) : task.showUnit ? task.unit : null;
    if (shownUnit) {
      const expected = repeat(shownUnit, task.size);
      const wrong = expected.map((v, i) => v !== board[i] ? i : -1).filter(i => i >= 0);
      return { ok: !wrong.length, code: wrong.length ? 'pattern' : 'ok', wrong, period: minimalPeriod(expected), alternatives: 1 };
    }
    const candidates = candidateUnits(task.clues, task.palette, task.allowedPeriods || [task.unit.length]);
    const found = candidates.find(c => c.board.every((v, i) => v === board[i]));
    if (found) return { ok: true, code: 'ok', wrong: [], period: found.period, alternatives: new Set(candidates.map(c => c.board.join('|'))).size };
    let nearest = candidates[0];
    for (const c of candidates) if (!nearest || c.board.filter((v, i) => v !== board[i]).length < nearest.board.filter((v, i) => v !== board[i]).length) nearest = c;
    return { ok: false, code: 'pattern', wrong: nearest ? nearest.board.map((v, i) => v !== board[i] ? i : -1).filter(i => i >= 0) : [] };
  }
  const editSnapshot = s => ({ board: s.board.slice(), seed: s.seed.slice(), chosenPeriod: s.chosenPeriod });
  function reduce(state, action) {
    if (!state || !action) return state;
    const task = resolveTask(state); if (!task) return state;
    if (action.type === 'reset') return createState(task);
    if (action.type === 'arrive') { if (state.phase !== 'RUNNING') return state; const n = clone(state); n.phase = 'ARRIVED'; return n; }
    if (action.type === 'edit') { if (state.phase !== 'ARRIVED') return state; const n = clone(state); n.phase = 'BUILDING'; n.lastResult = null; return n; }
    if (state.phase !== 'BUILDING') return state;
    if (action.type === 'select') { if (!task.palette.includes(action.token) || state.selected === action.token) return state; const n = clone(state); n.selected = action.token; return n; }
    if (action.type === 'start') {
      const result = validateBoard(task, state.board, state); const n = clone(state); n.lastResult = result;
      if (result.ok) { n.phase = 'RUNNING'; n.departures++; } return n;
    }
    if (action.type === 'undo') { if (!state.history.length) return state; const n = clone(state), h = n.history.pop(); n.board = h.board; n.seed = h.seed; n.chosenPeriod = h.chosenPeriod; n.lastResult = null; return n; }
    const n = clone(state); let changed = false;
    function editable(i) { return Number.isInteger(i) && i >= 0 && i < task.size && task.clues[i] === null; }
    function validToken(v) { return task.palette.includes(v); }
    if (action.type === 'place' && editable(action.index) && validToken(action.token || state.selected)) {
      const token = action.token || state.selected;
      if (n.board[action.index] !== token) { n.board[action.index] = token; changed = true; }
    } else if (action.type === 'remove' && editable(action.index) && n.board[action.index] !== null) { n.board[action.index] = null; changed = true;
    } else if (action.type === 'move' && editable(action.from) && editable(action.to) && action.from !== action.to && n.board[action.from] !== null) {
      const token = n.board[action.from]; n.board[action.from] = n.board[action.to]; n.board[action.to] = token; changed = true;
    } else if (action.type === 'seed' && Number.isInteger(action.index) && action.index >= 0 && action.index < task.seedSize && (action.token === null || validToken(action.token || state.selected))) {
      const token = action.token === null ? null : action.token || state.selected;
      if (n.seed[action.index] !== token) { n.seed[action.index] = token; changed = true; }
    } else if (action.type === 'copy' && task.seedSize && n.seed.every(validToken)) { const b = repeat(n.seed, task.size); if (b.some((v, i) => v !== n.board[i])) { n.board = b; changed = true; }
    } else if (action.type === 'period' && task.kind === 'unit' && task.periodChoices.includes(action.period) && n.chosenPeriod !== action.period) { n.chosenPeriod = action.period; changed = true; }
    if (!changed) return state;
    n.history = state.history.concat([editSnapshot(state)]).slice(-24); n.lastResult = null; return n;
  }
  function restoreState(raw) {
    if (!raw || raw.version !== 1 || typeof raw.taskId !== 'string' || !['BUILDING', 'RUNNING', 'ARRIVED'].includes(raw.phase)) return null;
    const task = resolveTask(raw); if (!task || raw.taskId !== task.id || raw.size !== task.size || raw.theme !== task.theme) return null;
    const valid = (b, seed) => Array.isArray(b) && b.length === task.size && b.every((v, i) => (v === null || task.palette.includes(v)) && (task.clues[i] === null || task.clues[i] === v)) && Array.isArray(seed) && seed.length === (task.seedSize || 0) && seed.every(v => v === null || task.palette.includes(v));
    if (!valid(raw.board, raw.seed) || !task.palette.includes(raw.selected)) return null;
    if (raw.chosenPeriod !== null && !(task.periodChoices || []).includes(raw.chosenPeriod)) return null;
    const n = createState(task); n.board = raw.board.slice(); n.seed = raw.seed.slice(); n.selected = raw.selected; n.chosenPeriod = raw.chosenPeriod;
    n.departures = Number.isSafeInteger(raw.departures) && raw.departures >= 0 ? raw.departures : 0;
    n.history = Array.isArray(raw.history) ? raw.history.filter(h => h && valid(h.board, h.seed) && (h.chosenPeriod === null || (task.periodChoices || []).includes(h.chosenPeriod))).slice(-24).map(editSnapshot) : [];
    // A reload must never resume a timer. An interrupted trip is parked and editable.
    n.phase = raw.phase === 'RUNNING' ? 'BUILDING' : raw.phase;
    if (n.phase === 'ARRIVED' && !validateBoard(task, n.board, n).ok) n.phase = 'BUILDING';
    return n;
  }
  const api = { TOKENS, PALETTES, TASKS, taskFor, getTasks, createFreeTask, resolveTask, createState, reduce, restoreState, validateBoard, candidateUnits, minimalPeriod, signature, repeat };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SihyeonPatternTrainModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
