'use strict';

// Independent specification oracle. Product checks use this, never the game verdict as an answer generator.
// Only period lengths explicitly admitted by a task/visible clue belong here.
const assert = require('node:assert/strict');

function canonicalEquality(sequence) {
  const names = new Map();
  return sequence.map(value => {
    if (value === null || value === undefined) return '?';
    if (!names.has(value)) names.set(value, names.size);
    return names.get(value);
  });
}

function leastPeriod(sequence) {
  if (!sequence.length) return 0;
  for (let period = 1; period <= sequence.length; period += 1) {
    if (sequence.every((value, index) => index < period || value === sequence[index - period])) return period;
  }
  throw new Error('Unreachable finite sequence');
}

function sameEqualityPattern(reference, candidate) {
  if (reference.length !== candidate.length || reference.some(value => value === null) || candidate.some(value => value === null)) return false;
  const left = canonicalEquality(reference), right = canonicalEquality(candidate);
  return left.every((value, index) => value === right[index]);
}

function concreteSequences(length, alphabet) {
  assert(Number.isInteger(length) && length >= 0 && length <= 12);
  function* walk(prefix) {
    if (prefix.length === length) { yield prefix; return; }
    for (const symbol of alphabet) yield* walk(prefix.concat(symbol));
  }
  return walk([]);
}

function possibleCompletions({ clues, alphabet, periods, minimumDistinct = 1 }) {
  assert(Array.isArray(clues) && Array.isArray(alphabet) && Array.isArray(periods));
  assert(new Set(alphabet).size === alphabet.length && !alphabet.includes(null));
  assert(clues.every(value => value === null || alphabet.includes(value)));
  const completions = new Map();
  for (const period of periods) {
    assert(Number.isInteger(period) && period >= 1 && period <= 12);
    const residue = Array(period).fill(null);
    let conflict = false;
    clues.forEach((value, index) => {
      if (value === null || conflict) return;
      if (residue[index % period] !== null && residue[index % period] !== value) conflict = true;
      else residue[index % period] = value;
    });
    if (conflict) continue;
    const vacancies = residue.flatMap((value, index) => value === null ? [index] : []);
    function fill(depth) {
      if (depth < vacancies.length) {
        for (const value of alphabet) {
          residue[vacancies[depth]] = value;
          fill(depth + 1);
        }
        residue[vacancies[depth]] = null;
        return;
      }
      if (new Set(residue).size < minimumDistinct) return;
      const sequence = clues.map((_, index) => residue[index % period]);
      const key = JSON.stringify(sequence);
      if (!completions.has(key)) completions.set(key, { sequence, periods: [] });
      completions.get(key).periods.push(period);
    }
    fill(0);
  }
  return [...completions.values()];
}

function selfCheck() {
  const alphabet = ['A', 'B', 'C'];
  assert.deepEqual(canonicalEquality(['red', 'red', 'blue', 'red', 'red', 'blue']), [0, 0, 1, 0, 0, 1]);
  assert.equal(leastPeriod(['A', 'B', 'C', 'A', 'B', 'C', 'A']), 3);
  assert.equal(leastPeriod(['A', 'A', 'A']), 1);
  assert.equal(leastPeriod(['A', 'B', 'A', 'B', 'A', 'B']), 2);
  assert(sameEqualityPattern(['red', 'blue', 'blue'], ['cat', 'dog', 'dog']));
  assert(sameEqualityPattern(['red', 'blue', 'blue'], ['dog', 'cat', 'cat']));
  assert(!sameEqualityPattern(['red', 'blue', 'blue'], ['dog', 'dog', 'dog']));
  assert.equal([...concreteSequences(3, ['A', 'B'])].length, 8);
  assert.equal(possibleCompletions({ clues: ['A', 'B', null], alphabet, periods: [1, 2, 3] }).length, 3);
  assert.deepEqual(possibleCompletions({ clues: ['A', 'B', 'A', 'B', null], alphabet, periods: [1, 2, 3, 4] }).map(item => item.sequence), [['A', 'B', 'A', 'B', 'A']]);
  assert.deepEqual(possibleCompletions({ clues: ['A', 'B', 'C', 'A', 'B', 'C', null], alphabet, periods: [1, 2, 3, 4] }).map(item => item.sequence), [['A', 'B', 'C', 'A', 'B', 'C', 'A']]);
  assert.equal(possibleCompletions({ clues: ['A', null, 'A', null], alphabet, periods: [1, 2] }).length, 3);
  assert.equal(possibleCompletions({ clues: ['A', null, 'A', null], alphabet, periods: [1, 2], minimumDistinct: 2 }).length, 2);
  assert.equal(possibleCompletions({ clues: ['A', 'A', 'B', 'B'], alphabet, periods: [2] }).length, 0);
  const clues = ['A', null, 'A', null], before = JSON.stringify(clues);
  possibleCompletions({ clues, alphabet, periods: [2] });
  assert.equal(JSON.stringify(clues), before);
}

function productChecks() {
  const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
  const sourcePath = path.resolve(__dirname, '../js/games/pattern-train-model.js');
  const M = require(sourcePath);
  const sourceSha256 = crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex');
  const report = { scope: 'Independent model/math/state verification only; not browser/device/deployment PASS', sourceSha256, status: 'PENDING', groups: [], totalAssertions: 0, boardVerdicts: 0, catalogue: [], findings: [] };
  let assertions = 0;
  const eq = (a, b, message) => { assertions++; assert.deepEqual(a, b, message); };
  const ok = (value, message) => { assertions++; assert.ok(value, message); };
  function group(name, run) {
    const start = assertions;
    try { run(); report.groups.push({ name, status: 'PASS', assertions: assertions - start }); }
    catch (error) { report.groups.push({ name, status: 'FAIL', assertions: assertions - start, error: error.message }); report.findings.push({ name, error: error.message }); }
  }
  const duplicate = value => JSON.parse(JSON.stringify(value));
  const repeated = (unit, length) => Array.from({ length }, (_, index) => unit[index % unit.length]);
  const key = board => JSON.stringify(board);
  function completions(task) {
    // This encodes the stated, visible rule. It deliberately does not call the product candidate generator.
    if (task.kind === 'translate') {
      ok(task.mapping && task.reference, task.id + ': translation needs visible mapping or a bijection rule');
      const target = task.reference.map(symbol => task.mapping[symbol]);
      ok(target.every(symbol => task.palette.includes(symbol)), task.id + ': every reference token is mapped');
      return [repeated(target, task.size)];
    }
    if (task.showUnit) {
      ok(Array.isArray(task.unit) && task.unit.length > 0, task.id + ': visible unit missing');
      return [repeated(task.unit, task.size)];
    }
    return possibleCompletions({ clues: task.clues, alphabet: task.palette, periods: task.allowedPeriods }).map(item => item.sequence);
  }
  function* editableBoards(task) {
    const emptyIndices = task.clues.flatMap((value, index) => value === null ? [index] : []);
    for (const choice of concreteSequences(emptyIndices.length, task.palette)) {
      const board = task.clues.slice(); emptyIndices.forEach((position, index) => { board[position] = choice[index]; }); yield board;
    }
  }
  group('catalogue is at least sixteen structural activities, with all four recommended ages', () => {
    eq(new Set(M.TASKS.map(t => t.id)).size, M.TASKS.length, 'task IDs must be unique');
    ok(M.TASKS.length >= 16);
    const structures = new Set();
    for (const task of M.TASKS) {
      eq(task.clues.length, task.size, task.id);
      ok(task.palette.length >= 2 && new Set(task.palette).size === task.palette.length, task.id);
      ok(task.clues.every(value => value === null || task.palette.includes(value)), task.id);
      const structure = JSON.stringify({ kind: task.kind, unit: task.unit && canonicalEquality(task.unit), reference: task.reference && canonicalEquality(task.reference), size: task.size, mask: task.clues.map(v => v === null ? 0 : 1), seed: task.seedSize, periods: task.allowedPeriods });
      structures.add(structure);
      report.catalogue.push({ id: task.id, age: task.age, kind: task.kind, structuralSignature: structure });
    }
    ok(structures.size >= 16, 'Color/animal renaming must not inflate the sixteen-activity minimum');
    for (const age of [4, 5, 6, 7]) ok(M.getTasks(age).length >= 4, 'age ' + age + ' session missing');
    report.structuralActivityCount = structures.size;
  });
  group('candidate generator agrees with an independent residue-class oracle', () => {
    const alphabet = ['red', 'blue'];
    for (const clues of concreteSequences(5, [null, ...alphabet])) {
      const expected = possibleCompletions({ clues, alphabet, periods: [1, 2, 3, 4] }).map(item => key(item.sequence)).sort();
      const got = [...new Set(M.candidateUnits(clues, alphabet, [1, 2, 3, 4]).map(item => key(item.board)))].sort();
      eq(got, expected, 'clues ' + key(clues));
    }
  });
  const answers = new Map();
  for (const task of M.TASKS.filter(t => !['copy', 'alternative', 'unit'].includes(t.kind))) {
    group('exhaustive visible-rule verdict: ' + task.id, () => {
      const validBoards = completions(task), allowed = new Set(validBoards.map(key)); answers.set(task.id, validBoards[0]);
      ok(allowed.size > 0, task.id + ': unsatisfiable visible clues');
      for (const board of validBoards) ok(board.every((v, i) => task.clues[i] === null || task.clues[i] === v), task.id + ': displayed unit contradicts a locked carriage');
      if (task.kind !== 'ambiguous') eq(allowed.size, 1, task.id + ': unique answer needs sufficient visible information');
      let falseAccepts = 0, falseRejects = 0, examined = 0; const samples = [];
      for (const board of editableBoards(task)) {
        const expected = allowed.has(key(board)), actual = M.validateBoard(task, board).ok;
        examined++; report.boardVerdicts++;
        if (actual !== expected) { if (actual) falseAccepts++; else falseRejects++; if (samples.length < 3) samples.push({ board, expected, actual }); }
      }
      const row = report.catalogue.find(t => t.id === task.id); Object.assign(row, { examined, validCompletions: allowed.size, falseAccepts, falseRejects });
      eq({ falseAccepts, falseRejects, samples }, { falseAccepts: 0, falseRejects: 0, samples: [] }, task.id + ': wrong verdicts for actual visible rule');
    });
  }
  for (const task of M.TASKS.filter(t => t.kind === 'unit')) group('least repeating unit: ' + task.id, () => {
    const board = task.clues.slice(), expected = leastPeriod(board); answers.set(task.id, board);
    ok(task.periodChoices.includes(expected), task.id + ': correct unit cannot be selected');
    for (const chosenPeriod of [null, ...task.periodChoices, -1, 0, 99]) eq(M.validateBoard(task, board, { chosenPeriod }).ok, chosenPeriod === expected, task.id + ': selected period ' + chosenPeriod);
  });
  for (const task of M.TASKS.filter(t => ['copy', 'alternative'].includes(t.kind))) group('created rule and copied carriages: ' + task.id, () => {
    let validSeedCount = 0;
    for (const seed of concreteSequences(task.seedSize, task.palette)) {
      let seedValid = true;
      if (task.kind === 'alternative') seedValid = key(seed.slice().sort()) === key(task.reference.slice().sort()) && !sameEqualityPattern(seed, task.reference);
      const board = repeated(seed, task.size); const result = M.validateBoard(task, board, { seed });
      eq(result.ok, seedValid, task.id + ': seed ' + key(seed)); report.boardVerdicts++;
      if (!seedValid) continue;
      validSeedCount++; if (!answers.has(task.id)) answers.set(task.id, { board, seed });
      for (let index = 0; index < board.length; index++) {
        const wrong = board.slice(); wrong[index] = task.palette.find(t => t !== wrong[index]);
        eq(M.validateBoard(task, wrong, { seed }).ok, false, task.id + ': inconsistent carriage ' + index); report.boardVerdicts++;
      }
    }
    ok(validSeedCount > 0, task.id + ': no valid workshop rule');
    eq(M.validateBoard(task, repeated(task.palette, task.size), { seed: [] }).ok, false);
    report.catalogue.find(t => t.id === task.id).validSeedCount = validSeedCount;
  });
  group('reported repeat length actually repeats the entire constructed train', () => {
    for (const [id, seed] of [['a6-copy', ['red', 'blue', 'red']], ['a7-alternative', ['red', 'blue', 'blue', 'red']]]) {
      const task = M.taskFor(id), board = repeated(seed, task.size), result = M.validateBoard(task, board, { seed });
      ok(result.ok, id);
      ok(Number.isInteger(result.period) && result.period > 0, id + ': no valid repeat length');
      ok(board.every((symbol, index) => index < result.period || symbol === board[index - result.period]), id + ': reported ' + result.period + ' does not repeat the full train');
    }
  });
  group('all twenty workshop tasks complete through reducer actions; duplicate trip blocked', () => {
    for (const task of M.TASKS) {
      let state = M.createState(task.id); const initial = duplicate(state), answer = answers.get(task.id);
      if (['copy', 'alternative'].includes(task.kind)) {
        for (let index = 0; index < answer.seed.length; index++) state = M.reduce(state, { type: 'seed', index, token: answer.seed[index] });
        state = M.reduce(state, { type: 'copy' }); eq(state.board, answer.board);
      } else {
        const board = answer;
        for (let index = 0; index < task.size; index++) if (task.clues[index] === null) state = M.reduce(state, { type: 'place', index, token: board[index] });
        if (task.kind === 'unit') state = M.reduce(state, { type: 'period', period: leastPeriod(board) });
      }
      eq(M.createState(task.id), initial, 'catalogue must not mutate while playing ' + task.id);
      const ready = duplicate(state), running = M.reduce(state, { type: 'start' });
      eq(state, ready, 'start must not mutate caller state'); eq(running.phase, 'RUNNING', task.id); eq(running.departures, 1);
      for (const action of [{ type: 'start' }, { type: 'place', index: task.size - 1 }, { type: 'remove', index: 0 }, { type: 'undo' }, { type: 'copy' }]) eq(M.reduce(running, action), running, 'running must lock edits');
      eq(M.restoreState(running).phase, 'BUILDING', 'reload does not resume an old animation');
      const arrived = M.reduce(running, { type: 'arrive' }); eq(arrived.phase, 'ARRIVED'); eq(M.reduce(arrived, { type: 'arrive' }), arrived);
      const edit = M.reduce(arrived, { type: 'edit' }); eq(edit.phase, 'BUILDING'); eq(edit.board, running.board);
      eq(M.reduce(edit, { type: 'start' }).departures, 2, 'a deliberately retested creation departs again');
      eq(M.reduce(running, { type: 'reset' }), initial, 'restart resets same task');
    }
  });
  group('mistakes are retained and can be replaced, removed, swapped and undone', () => {
    let state = M.createState('a4-first'); const wrongToken = 'cat', correctToken = 'rabbit';
    state = M.reduce(state, { type: 'place', index: 5, token: wrongToken }); const wrong = duplicate(state);
    const failed = M.reduce(state, { type: 'start' }); eq(failed.phase, 'BUILDING'); eq(failed.board, wrong.board); eq(failed.lastResult.ok, false); eq(failed.departures, 0);
    eq(M.reduce(state, { type: 'place', index: 5, token: wrongToken }), state, 'rapid identical tap is idempotent');
    state = M.reduce(failed, { type: 'place', index: 5, token: correctToken }); eq(state.board[5], correctToken); eq(state.lastResult, null);
    const replaced = duplicate(state); state = M.reduce(state, { type: 'remove', index: 5 }); eq(state.board[5], null);
    state = M.reduce(state, { type: 'undo' }); eq(state.board, replaced.board);
    const protectedState = duplicate(state);
    for (const action of [{ type: 'place', index: 0, token: 'rabbit' }, { type: 'place', index: -1 }, { type: 'place', index: 99 }, { type: 'place', index: 1.5 }, { type: 'place', index: 5, token: 'not-a-token' }, { type: 'remove', index: 0 }, { type: 'move', from: 0, to: 5 }]) eq(M.reduce(state, action), protectedState, 'locked or invalid action must be ignored');
    state = M.createState('a4-colors'); state = M.reduce(state, { type: 'place', index: 3, token: 'red' });
    let next = M.reduce(state, { type: 'move', from: 3, to: 5 }); eq(next.board[3], null); eq(next.board[5], 'red'); eq(state.board[3], 'red', 'move cannot mutate source state');
    next = M.reduce(next, { type: 'place', index: 3, token: 'blue' }); const two = duplicate(next);
    next = M.reduce(next, { type: 'move', from: 3, to: 5 }); eq(next.board[3], 'red'); eq(next.board[5], 'blue');
    eq(M.reduce(next, { type: 'undo' }).board, two.board, 'a swap is one undoable edit');
    for (let i = 0; i < 40; i++) state = M.reduce(state, { type: 'place', index: 3, token: i % 2 ? 'red' : 'blue' });
    ok(state.history.length <= 24, 'bounded undo memory');
  });
  group('free workshop accepts every complete arbitrary arrangement without grading', () => {
    const task = M.createFreeTask('animal', 4);
    for (const board of concreteSequences(4, task.palette)) { const result = M.validateBoard(task, board); eq(result.ok, true); eq(result.graded, false); report.boardVerdicts++; }
    const incomplete = M.validateBoard(task, [null, 'cat', 'frog', 'bear']); eq(incomplete.ok, false); eq(incomplete.code, 'empty');
  });
  group('restoration rejects malformed data and keeps only valid bounded history', () => {
    const good = M.createState('a4-first');
    const invalids = [null, {}, { ...good, version: 2 }, { ...good, taskId: 'missing' }, { ...good, phase: 'BOGUS' }, { ...good, selected: 'bad' }, { ...good, theme: 'shape' }, { ...good, size: 7 }, { ...good, board: ['cat'] }, { ...good, board: good.board.map((v, i) => i === 0 ? null : v) }, { ...good, chosenPeriod: 99 }, { ...good, seed: [null] }];
    for (const invalid of invalids) eq(M.restoreState(invalid), null, 'invalid saved state accepted');
    const source = duplicate(good); source.history = [null, {}, { board: good.board.slice(), seed: [], chosenPeriod: null }, { board: ['bad'], seed: [], chosenPeriod: null }];
    source.departures = -2; const restored = M.restoreState(source); eq(restored.history.length, 1); eq(restored.departures, 0);
    restored.board[5] = 'rabbit'; eq(source.board[5], null, 'restored state must not alias saved arrays');
    const invalidArrived = { ...good, phase: 'ARRIVED' }; eq(M.restoreState(invalidArrived).phase, 'BUILDING');
    const free = M.createState(M.createFreeTask('animal', 8));
    for (const size of [4.5, -3, 0, '8', null, {}, []]) eq(M.restoreState({ ...free, size }), null, 'malformed free size must return null, without throwing: ' + JSON.stringify(size));
  });
  group('saved free theme names cannot select inherited object properties', () => {
    const free = M.createState(M.createFreeTask('animal', 8));
    for (const theme of ['constructor', 'toString', '__proto__', 'not-a-theme']) eq(M.restoreState({ ...free, theme, taskId: 'free-' + theme }), null, 'unsupported saved theme must be rejected without an exception');
  });
  group('saved nested JSON cannot inject fields through undo history', () => {
    const good = M.createState('a4-first');
    const source = duplicate(good); source.history = [{ board: good.board.slice(), seed: [], chosenPeriod: null, phase: 'RUNNING', taskId: 'missing', departures: 99 }];
    const restored = M.restoreState(source), undone = M.reduce(restored, { type: 'undo' });
    eq(undone.phase, 'BUILDING'); eq(undone.taskId, 'a4-first'); eq(undone.departures, 0);
  });
  report.totalAssertions = assertions;
  report.status = report.findings.length ? 'FAIL' : 'PASS';
  return report;
}

if (require.main === module) {
  selfCheck();
  if (process.argv.includes('--oracle-only')) console.log('Specification oracle self-check only; no product PASS.');
  else {
    const report = productChecks();
    const reportFlag = process.argv.indexOf('--report');
    if (reportFlag >= 0) require('node:fs').writeFileSync(process.argv[reportFlag + 1], JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
    if (report.status !== 'PASS') process.exitCode = 1;
  }
}
module.exports = { canonicalEquality, leastPeriod, sameEqualityPattern, concreteSequences, possibleCompletions, selfCheck, productChecks };
