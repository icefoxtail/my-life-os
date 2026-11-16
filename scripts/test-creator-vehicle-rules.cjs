/* Execute the real game handlers with a small DOM/clock fixture.
 * These are deterministic rule/state regressions, not browser or touch evidence.
 * Pass an alternate source root to demonstrate the pre-fix counterexample.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const alternateRoot = process.argv.slice(2).find(arg => !arg.startsWith('--'));
const sourceRoot = alternateRoot ? path.resolve(alternateRoot) : root;
const constructionOnly = process.argv.includes('--construction-only');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'assets/vehicles/vehicles_manifest.json'), 'utf8')).vehicles;
const construction = JSON.parse(fs.readFileSync(path.join(root, 'assets/vehicles/construction_manifest.json'), 'utf8'));

function element(dataset = {}, initialClasses = '') {
  const classes = new Set(initialClasses.split(/\s+/).filter(Boolean));
  return {
    dataset, textContent: '', innerHTML: '', style: {},
    classList: {
      add(...names) { names.forEach(name => classes.add(name)); },
      remove(...names) { names.forEach(name => classes.delete(name)); },
      contains: name => classes.has(name),
      toggle(name, on) { on ? classes.add(name) : classes.delete(name); }
    },
    appendChild() {}, addEventListener() {}, remove() {},
    querySelector: () => null, querySelectorAll: () => []
  };
}

function clock() {
  let now = 0, nextId = 1;
  const timers = new Map();
  return {
    timers,
    setTimeout(fn, delay) { const id = nextId++; timers.set(id, { fn, at: now + delay, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    runDelay(delay) {
      const entry = [...timers].find(([, task]) => task.delay === delay);
      assert.ok(entry, `expected ${delay}ms callback`);
      timers.delete(entry[0]); now = Math.max(now, entry[1].at); entry[1].fn();
    },
    async drain() {
      for (let i = 0; i < 150; i++) {
        // Speech completion is a Promise before its next managed delay.
        for (let n = 0; n < 10; n++) await Promise.resolve();
        if (!timers.size) return;
        const entry = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        timers.delete(entry[0]); now = entry[1].at; entry[1].fn();
      }
      throw new Error('fixture did not settle');
    }
  };
}

function seededMath(seed) {
  const result = Object.create(Math);
  result.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  return result;
}

function memoryFixture(seed = 1) {
  const time = clock(), banner = element(), stage = element();
  let cards = [], rewards = 0;
  const container = {
    querySelector(selector) {
      const match = selector.match(/^\.memory-card\[data-index="(\d+)"\]$/);
      if (match) return cards[Number(match[1])] || null;
      return selector === '.memory-speech-banner' ? banner : selector === '.memory-game-container' ? stage : null;
    },
    querySelectorAll: selector => selector === '.memory-card' ? cards : []
  };
  const window = { ...time, innerWidth: 390, innerHeight: 844,
    addEventListener() {}, removeEventListener() {} };
  const source = fs.readFileSync(path.join(sourceRoot, 'js/games/vehicle-memory.js'), 'utf8')
    .replace(/\}\)\(\);\s*$/, `window.__test = {state, normalizeVehicle, pickRoundVehicles, pickRoundEmoji,
      getCardClass, getBoardMarkup, handleMemoryCardClick, checkMemoryMatch, maybeRegisterHint, clearTimers,
      setSelection(category, count) { selectedVehicleCategory = category; selectedCardCount = count; },
      setEmoji(category) { selectedCategory = category; }};\n})();`);
  vm.runInNewContext(source, {window, document: {createElement: () => element(), getElementById: () => null},
    navigator: {}, console, Math: seededMath(seed), setTimeout: time.setTimeout, clearTimeout: time.clearTimeout});
  const api = window.__test;
  Object.assign(api.state, {container, destroyed: false, vehicles: catalog.map(api.normalizeVehicle),
    options: {gainExp: () => { rewards++; }}});
  function mount() {
    cards = api.state.cards.map((card, index) => element({index: String(index), pairKey: card.pairKey}, api.getCardClass(card, index)));
  }
  function deal(category, count) {
    api.setSelection(category, count); api.state.cards = api.pickRoundVehicles(); mount(); return api.state.cards;
  }
  return {api, time, deal, mount, get cards() { return cards; }, get rewards() { return rewards; }};
}

async function testMemory() {
  let boards = 0;
  for (const category of [...new Set(catalog.map(vehicle => vehicle.category))]) {
    for (const count of [8, 12, 16]) {
      const f = memoryFixture(boards + 1), cards = f.deal(category, count);
      assert.equal(cards.length, count);
      assert.equal(new Set(cards.map(card => card.uid)).size, count, 'physical cards retain distinct IDs');
      const pictures = new Map();
      cards.forEach(card => pictures.set(card.file, [...(pictures.get(card.file) || []), card]));
      for (const [picture, group] of pictures) {
        assert.equal(group.length % 2, 0, 'every picture has an even number of physical cards');
        assert.equal(new Set(group.map(card => card.pairKey)).size, 1,
          `${category}/${count}: the same visible ${picture} must be one match identity`);
      }
      boards++;
    }
  }
  for (const [category, count] of [['rescue', 8], ['police', 16]]) {
    const f = memoryFixture(15), cards = f.deal(category, count);
    const duplicate = cards.find(card => cards.filter(other => other.file === card.file).length >= 4);
    assert.ok(duplicate, 'small catalog necessarily duplicates a picture');
    const first = cards.indexOf(duplicate);
    const second = cards.findIndex(card => card.file === duplicate.file && card.id !== duplicate.id);
    assert.ok(second >= 0, 'select two cards from different originally dealt pairs');
    f.api.handleMemoryCardClick(first); f.api.handleMemoryCardClick(second);
    f.time.runDelay(360);
    assert.equal(f.api.state.matched, 2);
    assert.equal(f.api.state.matchedCardUids.size, 2);
    assert.equal(f.cards.filter(card => card.classList.contains('is-matched')).length, 2);
    // The real board markup is also used when orientation changes. Other copies
    // of this picture must survive reconstruction and remain playable.
    assert.equal((f.api.getBoardMarkup().match(/memory-card is-matched/g) || []).length, 2);
    f.mount();
    assert.equal(f.cards.filter(card => card.classList.contains('is-matched')).length, 2);
    const remainingSame = cards.map((card, index) => ({card, index})).filter(({card}) =>
      card.file === duplicate.file && !f.api.state.matchedCardUids.has(card.uid));
    for (const {index} of remainingSame) f.api.state.seenPairs[duplicate.pairKey].push(index);
    f.api.state.wrongCount = 2;
    f.api.maybeRegisterHint(duplicate.pairKey);
    assert.ok(f.api.state.hintPairs[duplicate.pairKey], 'matched copies cannot suppress hints for remaining copies');
    await f.time.drain();
    assert.equal(f.api.state.locked, false);
    f.api.handleMemoryCardClick(first);
    assert.equal(f.api.state.flipped.length, 0, 'already matched card cannot be counted a second time');
    while (f.api.state.matched < count) {
      const a = cards.findIndex(card => !f.api.state.matchedCardUids.has(card.uid));
      const b = cards.findIndex((card, i) => i !== a && card.file === cards[a].file && !f.api.state.matchedCardUids.has(card.uid));
      assert.ok(b >= 0, 'cross-pair matching leaves a solvable board');
      f.api.handleMemoryCardClick(a); f.api.handleMemoryCardClick(b);
      await f.time.drain();
    }
    assert.equal(f.api.state.matched, count);
    assert.equal(f.api.state.matchedCardUids.size, count);
    assert.equal(f.api.state.currentScreen, 'success');
    assert.equal(f.rewards, 1, 'completion reward happens once');
    f.api.handleMemoryCardClick(first); await f.time.drain(); assert.equal(f.rewards, 1);
  }
  const alias = memoryFixture();
  alias.api.state.vehicles = [
    {id: 'first', file: 'same.png', category: 'rescue'},
    {id: 'alias', file: 'same.png', category: 'rescue'}
  ].map(alias.api.normalizeVehicle);
  const samePicture = alias.deal('rescue', 8);
  assert.equal(new Set(samePicture.map(card => card.pairKey)).size, 1, 'different catalog IDs sharing a picture still match');
  const wrong = memoryFixture(); const wrongCards = wrong.deal('rescue', 8);
  wrong.api.handleMemoryCardClick(0);
  wrong.api.handleMemoryCardClick(wrongCards.findIndex(card => card.file !== wrongCards[0].file));
  await wrong.time.drain(); assert.equal(wrong.api.state.matched, 0); assert.equal(wrong.api.state.wrongCount, 1);
  const stale = memoryFixture(), staleCards = stale.deal('rescue', 8);
  stale.api.handleMemoryCardClick(0);
  stale.api.handleMemoryCardClick(staleCards.findIndex((card, i) => i && card.file === staleCards[0].file));
  stale.api.clearTimers(); await stale.time.drain(); assert.equal(stale.api.state.matched, 0, 'retired round cannot finish a pending match');
  const empty = memoryFixture(); empty.api.state.vehicles = []; assert.equal(empty.api.pickRoundVehicles().length, 0);
  for (const category of ['🍎과일', '🍕음식', '🐶동물']) {
    const f = memoryFixture(); f.api.setEmoji(category); f.api.setSelection('all', 16);
    const cards = f.api.pickRoundEmoji(); assert.equal(cards.length, 16);
    assert.equal(new Set(cards.map(card => card.uid)).size, 16);
    cards.forEach(card => assert.ok(cards.some(other => other.uid !== card.uid && other.emoji === card.emoji && other.pairKey === card.pairKey)));
  }
  return boards;
}

function constructionFixture(seed = 1) {
  const time = clock(), window = {...time};
  const source = fs.readFileSync(path.join(sourceRoot, 'js/games/construction-site.js'), 'utf8')
    .replace(/\}\)\(\);\s*$/, 'window.__test = {state, MISSIONS, normalizeVehicle, pickMissions, makeChoices, getAnswerVehicle, handleChoice};\n})();');
  vm.runInNewContext(source, {window, document: {}, navigator: {}, console, Math: seededMath(seed)});
  const api = window.__test;
  Object.assign(api.state, {vehicles: construction.map(api.normalizeVehicle), destroyed: false,
    container: {querySelector: () => null, querySelectorAll: () => []}});
  return {api, time};
}

function testConstruction() {
  // Independent semantic expectations, grouped by equipment role rather than
  // copying the implementation's distractor whitelist.
  const valid = {
    dig: ['excavator', 'mini_excavator', 'backhoe_loader'],
    push: ['bulldozer', 'grader', 'wheel_loader', 'backhoe_loader', 'skid_steer_loader'],
    load: ['excavator', 'mini_excavator', 'wheel_loader', 'backhoe_loader', 'skid_steer_loader'],
    carry: ['dump_truck', 'articulated_dump_truck', 'dump_loader', 'cargo_truck'],
    mix: ['concrete_mixer'], lift: ['crane_truck', 'forklift', 'tower_crane', 'mobile_crane'],
    pump: ['concrete_pump_truck']
  };
  const buckets = ['excavator', 'mini_excavator', 'wheel_loader', 'backhoe_loader', 'skid_steer_loader', 'dump_loader'];
  const transport = ['dump_truck', 'articulated_dump_truck', 'dump_loader', 'cargo_truck', 'lowbed_trailer', 'forklift'];
  const neverWrong = {
    dig: [...buckets, 'bulldozer', 'grader', 'drilling_rig', 'excavator_breaker', 'pile_driver'],
    push: [...buckets, 'bulldozer', 'grader', 'road_roller', 'asphalt_paver'],
    load: [...buckets, ...transport, 'bulldozer', 'grader', 'sweeper_truck'],
    carry: [...buckets, ...transport, 'bulldozer', 'grader', 'scissor_lift'],
    mix: ['concrete_mixer', 'asphalt_paver'],
    lift: [...buckets, ...transport, 'crane_truck', 'tower_crane', 'mobile_crane', 'scissor_lift', 'pile_driver'],
    pump: ['concrete_pump_truck']
  };
  const f = constructionFixture();
  assert.equal(f.api.state.vehicles.length, 27, 'review uses the deployed 27-vehicle catalog');
  for (const mission of f.api.MISSIONS) {
    for (const id of valid[mission.id]) {
      f.api.state.currentMission = mission; f.api.state.currentChoices = f.api.state.vehicles;
      f.api.state.completedVehicles = []; f.api.state.locked = false;
      const button = element(); f.api.handleChoice(id, button);
      assert.equal(button.classList.contains('is-correct'), true, `${id} can perform ${mission.id}`);
      assert.equal(button.classList.contains('is-wrong'), false);
      assert.equal(f.api.state.completedVehicles.length, 1);
      f.api.handleChoice(id, button); assert.equal(f.api.state.completedVehicles.length, 1, 'double activation is locked');
    }
    const seen = new Set();
    for (let seed = 1; seed <= 150; seed++) {
      const sample = constructionFixture(seed);
      sample.api.state.vehicles.push(sample.api.normalizeVehicle({id: 'new_unreviewed_machine', file: 'new.png'}, 27));
      const choices = sample.api.makeChoices(mission);
      assert.equal(choices.length, 3);
      assert.equal(new Set(choices.map(vehicle => vehicle.id)).size, 3);
      assert.ok(choices.some(vehicle => valid[mission.id].includes(vehicle.id)), 'every question offers a defensible answer');
      for (const vehicle of choices) {
        seen.add(vehicle.id);
        assert.notEqual(vehicle.id, 'new_unreviewed_machine', 'unknown catalog additions cannot silently become wrong answers');
        if (neverWrong[mission.id].includes(vehicle.id)) {
          assert.ok(mission.answerIds.includes(vehicle.id), `${vehicle.id} must not be marked wrong for ${mission.id}`);
        }
      }
    }
    valid[mission.id].forEach(id => assert.ok(seen.has(id), `${id} can actually appear for ${mission.id}`));
  }
  // Missing/small data must never use the first unrelated vehicle as a fake answer.
  const sparse = constructionFixture();
  sparse.api.state.vehicles = sparse.api.state.vehicles.filter(vehicle => ['road_roller', 'water_truck', 'fuel_truck'].includes(vehicle.id));
  assert.equal(sparse.api.pickMissions().length, 0);
  for (const mission of sparse.api.MISSIONS) assert.equal(sparse.api.makeChoices(mission).length, 0);
  const single = constructionFixture();
  single.api.state.vehicles = single.api.state.vehicles.filter(vehicle => ['tower_crane', 'road_roller', 'water_truck'].includes(vehicle.id));
  assert.deepEqual(Array.from(single.api.pickMissions(), mission => mission.id), ['lift']);
  const lift = single.api.MISSIONS.find(mission => mission.id === 'lift');
  assert.equal(single.api.makeChoices(lift).length, 3);
  const unshown = constructionFixture(); unshown.api.state.currentMission = unshown.api.MISSIONS[0];
  unshown.api.state.currentChoices = [];
  const ignored = element(); unshown.api.handleChoice('backhoe_loader', ignored);
  assert.equal(unshown.api.state.completedVehicles.length, 0);
  assert.equal(ignored.classList.contains('is-wrong'), false, 'a stale/hidden choice is ignored');
}

(async () => {
  const boards = constructionOnly ? 0 : await testMemory(); testConstruction();
  console.log(`PASS ${constructionOnly ? '' : `${boards} memory catalog/count boards; rescue 8 and police 16 cross-copy matching, reconstructed markup, remaining hints, completion, stale timers, emoji and empty data; `}construction 27 vehicles across 7 missions, multiple valid roles, safe distractors and sparse catalogs.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
