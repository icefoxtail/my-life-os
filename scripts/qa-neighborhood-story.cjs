/* Independent story arithmetic, entity partitions and event replay. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'js/games/neighborhood-story-model.js');
const M = require(file);

let assertions = 0;
const counts = { fire: 0, police: 0, snack: 0, neighborhood: 0, invalid: 0, events: 0 };
function equal(a, b, message) { assertions++; assert.strictEqual(a, b, message); }
function deep(a, b, message) { assertions++; assert.deepEqual(a, b, message); }
function ok(value, message) { assertions++; assert.ok(value, message); }
function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value); Object.values(value).forEach(freeze); return value;
}
const copy = value => JSON.parse(JSON.stringify(value));
const sorted = values => [...values].sort();
const quantities = zones => Object.fromEntries(Object.entries(zones).map(([key, items]) => [key, items.length]));
const comparison = (a, b) => ({ kind: 'compare', a, b, pairCount: Math.min(a, b), difference: Math.abs(a - b), relation: a > b ? 'left' : a < b ? 'right' : 'equal' });

function partition(zones, registry, keys, label) {
  deep(sorted(Object.keys(zones)), sorted(keys), label + ': zone keys');
  const ids = Object.values(zones).flat();
  ok(Object.values(zones).every(Array.isArray), label + ': arrays');
  equal(ids.length, registry.size, label + ': original count');
  equal(new Set(ids).size, registry.size, label + ': no clones');
  ok(ids.every(id => registry.has(id)), label + ': no invented IDs');
}

function oracle(scene, age, values) {
  const { a, b, total, groups } = values;
  const connected = age === 7;
  if (scene === 'fire') {
    const back = Math.min(2, b);
    return { total: a, keys: ['station', 'road'], initial: { station: a, road: 0 },
      generated: { returnCount: back },
      stages: [{ result: { kind: 'count', count: a - b }, counts: { station: a - b, road: b }, moves: b, route: ['station', 'road'] },
        ...(connected ? [{ result: { kind: 'count', count: a - b + back }, counts: { station: a - b + back, road: b - back }, moves: back, route: ['road', 'station'] }] : [])] };
  }
  if (scene === 'police') {
    const leave = Math.min(3, a + b);
    return { total: a + b, keys: ['station', 'waiting', 'road'], initial: { station: a, waiting: b, road: 0 },
      generated: { leaveCount: leave },
      stages: [{ result: { kind: 'count', count: a + b }, counts: { station: a + b, waiting: 0, road: 0 }, moves: b, route: ['waiting', 'station'] },
        ...(connected ? [{ result: { kind: 'count', count: a + b - leave }, counts: { station: a + b - leave, waiting: 0, road: leave }, moves: leave, route: ['station', 'road'] }] : [])] };
  }
  if (scene === 'snack') {
    const delivery = connected ? Math.min(3, total) : 0;
    const plates = Object.fromEntries(Array.from({ length: groups }, (_, i) => ['plate-' + i, 0]));
    const each = Math.floor(total / groups), remainder = total % groups;
    const result = { kind: 'share', total, groupCount: groups, each, remainder };
    return { total, keys: ['tray', 'waiting', ...Object.keys(plates)], initial: { tray: total - delivery, waiting: delivery, ...plates },
      generated: { deliveryCount: Math.min(3, total), startingStock: total - Math.min(3, total) },
      stages: [...(connected ? [{ result: { kind: 'count', count: total }, counts: { tray: total, waiting: 0, ...plates }, moves: delivery, route: ['waiting', 'tray'] }] : []),
        { result, counts: { tray: remainder, waiting: 0, ...Object.fromEntries(Object.keys(plates).map(key => [key, each])) }, moves: total - remainder, share: groups }] };
  }
  const difference = Math.abs(a - b), target = a < b ? 'left' : a > b ? 'right' : null;
  return { total: a + b + (connected ? difference : 0), keys: ['left', 'right', 'waiting'],
    initial: { left: a, right: b, waiting: connected ? difference : 0 },
    generated: { addCount: difference, targetZone: target },
    stages: [{ result: comparison(a, b), counts: { left: a, right: b, waiting: connected ? difference : 0 }, moves: 0, pairs: Math.min(a, b) },
      ...(connected ? [{ result: comparison(Math.max(a, b), Math.max(a, b)), counts: { left: Math.max(a, b), right: Math.max(a, b), waiting: 0 }, moves: difference, route: ['waiting', target] }] : [])] };
}

function check(scene, age, values) {
  const input = freeze({ scene, age, values: { ...values } });
  const before = JSON.stringify(input);
  const story = M.create(input), expected = oracle(scene, age, values);
  equal(JSON.stringify(input), before, 'Creation does not mutate the saved input');
  equal(story.version, 1); equal(story.scene, scene); equal(story.age, age);
  deep(story.base, values, 'Every chosen number is preserved');
  ok(story.base !== input.values, 'The returned base is a detached input snapshot');
  deep(story.generated, expected.generated, 'Derived quantities follow the defined second-scene formulas');
  deep(story.presentation, { prediction: age === 5, tenFrames: age === 6 });
  equal(story.entities.length, expected.total);
  const registry = new Map(story.entities.map(item => [item.id, item]));
  equal(registry.size, expected.total);
  equal(new Set(story.entities).size, expected.total, 'Every entity is a distinct original');
  for (const item of story.entities) {
    ok(typeof item.id === 'string' && item.id.length > 0);
    ok(['main', 'arrival', 'left', 'right'].includes(item.slot));
    ok(Number.isInteger(item.ordinal) && item.ordinal >= 1 && item.ordinal <= 30);
  }
  for (const slot of ['main', 'arrival', 'left', 'right']) {
    const ordinals = story.entities.filter(item => item.slot === slot).map(item => item.ordinal);
    equal(new Set(ordinals).size, ordinals.length, 'Ordinals are unique within a picture slot');
  }
  partition(story.initialZones, registry, expected.keys, 'initial');
  deep(quantities(story.initialZones), expected.initial);
  const slots = scene === 'fire' ? { station: 'main' }
    : scene === 'police' ? { station: 'main', waiting: 'arrival' }
      : scene === 'snack' ? { tray: 'main', waiting: 'arrival' }
        : { left: 'left', right: 'right', waiting: expected.generated.targetZone };
  for (const [zone, slot] of Object.entries(slots)) {
    ok(story.initialZones[zone].every(id => registry.get(id).slot === slot), 'Initial originals have the intended picture slot');
  }
  equal(story.stages.length, expected.stages.length, 'Only age seven has two connected stages');
  const eventIDs = new Set(), stageIDs = new Set();
  let prior = story.initialZones;
  story.stages.forEach((stage, stageIndex) => {
    const goal = expected.stages[stageIndex];
    ok(typeof stage.id === 'string' && !stageIDs.has(stage.id)); stageIDs.add(stage.id);
    ok(typeof stage.operator === 'string' && stage.operator.length > 0);
    ok(typeof stage.captionKey === 'string' && stage.captionKey.length > 0);
    deep(stage.startZones, prior, 'The next scene starts with the actual preceding result');
    partition(stage.startZones, registry, expected.keys, 'stage start');
    const replay = copy(stage.startZones);
    equal(stage.events[0]?.kind, 'stage', 'The stage introduction precedes movement');
    equal(stage.events.at(-1)?.kind, 'summary', 'A result follows the actual movement');
    let moves = 0, pairs = 0, introductions = 0, summaries = 0;
    const pairedLeft = new Set(), pairedRight = new Set(), moved = new Set();
    stage.events.forEach(event => {
      counts.events++;
      ok(typeof event.id === 'string' && !eventIDs.has(event.id), 'Event identities are unique within an episode'); eventIDs.add(event.id);
      equal(event.stageIndex, stageIndex);
      if (event.kind === 'stage') {
        introductions++; equal(event.captionKey, stage.captionKey);
      } else if (event.kind === 'move') {
        ok(registry.has(event.itemId), 'Only original registered items may move');
        ok(!moved.has(event.itemId), 'A stage does not move the same item twice'); moved.add(event.itemId);
        ok(Object.hasOwn(replay, event.from) && Object.hasOwn(replay, event.to) && event.from !== event.to);
        const index = replay[event.from].indexOf(event.itemId);
        ok(index >= 0, 'The moved object must currently be in the stated source zone');
        if (goal.share) {
          equal(event.from, 'tray'); equal(event.to, 'plate-' + (moves % goal.share), 'Sharing proceeds in complete equal rounds');
        } else {
          deep([event.from, event.to], goal.route, 'Movement direction matches the actual story');
        }
        if ((scene === 'fire' && stageIndex === 0) || (scene === 'police' && stageIndex === 1)) {
          equal(event.itemId, replay[event.from].at(-1), 'Subtraction moves the actual last original first');
        }
        replay[event.from].splice(index, 1); replay[event.to].push(event.itemId); moves++;
      } else if (event.kind === 'pair') {
        equal(scene, 'neighborhood');
        ok(replay.left.includes(event.leftId) && replay.right.includes(event.rightId), 'A pair uses present opposite-side originals');
        ok(!pairedLeft.has(event.leftId) && !pairedRight.has(event.rightId), 'A comparison does not reuse a paired item');
        pairedLeft.add(event.leftId); pairedRight.add(event.rightId);
        equal(event.pairIndex, pairs); pairs++;
      } else if (event.kind === 'summary') {
        summaries++; deep(event.result, goal.result, 'The summary uses the independently calculated answer');
      } else {
        assert.fail('Unknown event kind: ' + event.kind);
      }
      deep(event.countsAfter, quantities(replay), 'Every event reports actual post-event quantities');
      partition(replay, registry, expected.keys, 'after event');
    });
    equal(introductions, 1); equal(summaries, 1); equal(moves, goal.moves);
    equal(pairs, goal.pairs || 0, 'Only the intended comparisons create pair events');
    deep(stage.endZones, replay, 'Applying the event stream reconstructs the exact end zones');
    deep(quantities(stage.endZones), goal.counts);
    deep(stage.result, goal.result);
    partition(stage.endZones, registry, expected.keys, 'stage end');
    if (scene === 'fire' && stageIndex === 1) {
      const originalsOnRoad = new Set(stage.startZones.road);
      ok(stage.events.filter(event => event.kind === 'move').every(event => originalsOnRoad.has(event.itemId)), 'The returning engines are the exact departed originals');
    }
    prior = stage.endZones;
  });
  deep(story.finalZones, prior); deep(story.result, expected.stages.at(-1).result);
  partition(story.finalZones, registry, expected.keys, 'final');
  counts[scene]++;
  return story;
}

equal(typeof M.create, 'function');
const retained = freeze(check('fire', 7, { a: 15, b: 4 }));
const retainedJSON = JSON.stringify(retained);
for (const age of [4, 5, 6, 7]) {
  for (let a = 0; a <= 30; a++) for (let b = 0; b <= 30; b++) {
    if (b <= a) check('fire', age, { a, b });
    if (a + b <= 30) check('police', age, { a, b });
    check('neighborhood', age, { a, b });
  }
  for (let total = 0; total <= 30; total++) for (let groups = 1; groups <= 6; groups++) check('snack', age, { total, groups });
}
counts.fire--; // The frozen sentinel is additional to the exhaustive range.
deep({ fire: counts.fire, police: counts.police, snack: counts.snack, neighborhood: counts.neighborhood },
  { fire: 1984, police: 1984, snack: 744, neighborhood: 3844 });
equal(JSON.stringify(retained), retainedJSON, 'Later episodes cannot mutate an earlier frozen episode');
const separate = M.create({ scene: 'fire', age: 7, values: { a: 15, b: 4 } });
ok(separate.entities[0] !== retained.entities[0], 'Separate episodes do not share mutable entity objects');

function rejects(input) { assertions++; assert.throws(() => M.create(input)); counts.invalid++; }
for (const age of [4, 5, 6, 7]) for (let a = 0; a <= 30; a++) for (let b = 0; b <= 30; b++) {
  if (b > a) rejects({ scene: 'fire', age, values: { a, b } });
  if (a + b > 30) rejects({ scene: 'police', age, values: { a, b } });
}
for (const bad of [-1, 31, 0.5, NaN, Infinity, -Infinity, '7', '', null, undefined, true, false, [], {}]) {
  for (const scene of ['fire', 'police', 'neighborhood']) for (const term of ['a', 'b']) {
    rejects({ scene, age: 4, values: { a: 0, b: 0, [term]: bad } });
  }
  rejects({ scene: 'snack', age: 4, values: { total: bad, groups: 2 } });
}
for (const groups of [-1, 0, 7, 30, 1.5, '4', null, undefined, NaN, Infinity]) rejects({ scene: 'snack', age: 4, values: { total: 15, groups } });
for (const age of [0, 3, 8, 5.5, '4', null, undefined, NaN, true]) rejects({ scene: 'fire', age, values: { a: 1, b: 0 } });
for (const scene of ['', 'unknown', null, undefined, {}, 4]) rejects({ scene, age: 4, values: { a: 1, b: 0 } });
for (const values of [null, undefined, {}, [], 1, '1']) rejects({ scene: 'fire', age: 4, values });

console.log(JSON.stringify({ suite: 'Independent neighborhood-story quantities, original identities and event replay', status: 'PASS',
  sourceSHA256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  episodes: counts.fire + counts.police + counts.snack + counts.neighborhood, counts, assertions,
  checked: ['all valid quantities for all four scenes and four ages', 'independent arithmetic and generated quantities',
    'exact registry partition before and after every event', 'stage continuity and replay reconstruction',
    'original return, pair uniqueness, equal sharing rounds and remaining originals', 'saved input and prior-episode immutability',
    'invalid quantities, scene, age and group values reject'],
  limitations: ['Pure model only; browser, audible audio and physical-device validation are separate'] }, null, 2));
