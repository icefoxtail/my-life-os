/* 숫자 배달 우체국: DOM 없는 수량·상태 모델. */
(function (root) {
  'use strict';

  const TYPES = [
    { id: 'teddy', name: '곰 인형', emoji: '🧸', color: '#b97643' },
    { id: 'apple', name: '사과', emoji: '🍎', color: '#e96855' },
    { id: 'ball', name: '공', emoji: '⚽', color: '#58a8cc' },
    { id: 'carrot', name: '당근', emoji: '🥕', color: '#eea04a' },
    { id: 'block', name: '블록', emoji: '🧱', color: '#69a89c' },
    { id: 'cookie', name: '별 과자', emoji: '⭐', color: '#dca94e' }
  ];
  const ANIMALS = [
    { id: 'rabbit', name: '토끼', emoji: '🐰', thanks: '친구들과 함께할게!' },
    { id: 'bear', name: '곰', emoji: '🐻', thanks: '기다리던 선물이야!' },
    { id: 'fox', name: '여우', emoji: '🦊', thanks: '소풍 준비가 끝났어!' },
    { id: 'panda', name: '판다', emoji: '🐼', thanks: '친구들이 정말 좋아하겠어!' },
    { id: 'cat', name: '고양이', emoji: '🐱', thanks: '같이 놀 준비가 됐어!' },
    { id: 'dog', name: '강아지', emoji: '🐶', thanks: '배달해 줘서 고마워!' }
  ];
  const CHALLENGES = { '1-10': [1, 10], '11-15': [11, 15], '16-20': [16, 20], '21-30': [21, 30] };
  const PATTERNS = {
    4: [
      ['post-a01', 'exact', 'teddy'], ['post-a02', 'exact', 'apple'],
      ['post-a03', 'exact', 'ball'], ['post-a04', 'exact', 'carrot']
    ],
    5: [
      ['post-b01', 'two-kinds', 'teddy', 'ball'], ['post-b02', 'fill-missing', 'apple', 'cookie'],
      ['post-b03', 'two-kinds', 'carrot', 'apple'], ['post-b04', 'fill-missing', 'block', 'teddy']
    ],
    6: [
      ['post-c01', 'ten-and-ones', 'teddy'], ['post-c02', 'ten-and-ones', 'cookie'],
      ['post-c03', 'ten-and-ones', 'block'], ['post-c04', 'ten-and-ones', 'apple']
    ],
    7: [
      ['post-d01', 'split-any', 'ball'], ['post-d02', 'split-near', 'carrot'],
      ['post-d03', 'split-any', 'teddy'], ['post-d04', 'split-near', 'cookie']
    ]
  };

  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function ageValue(value) { return [4, 5, 6, 7].includes(Number(value)) ? Number(value) : 4; }
  function challengeValue(value) { return Object.prototype.hasOwnProperty.call(CHALLENGES, value) ? value : '1-10'; }
  function rng(seed) {
    let n = seed >>> 0;
    return function () {
      n += 0x6D2B79F5;
      let t = n;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function generateMission(options) {
    options = options || {};
    const age = ageValue(options.age);
    const challenge = challengeValue(options.challenge);
    const seed = Number.isFinite(Number(options.seed)) ? Number(options.seed) >>> 0 : 12345;
    const round = Math.max(0, Math.min(9999, Math.floor(Number(options.round) || 0)));
    const range = CHALLENGES[challenge];
    const random = rng((seed + round * 1013904223 + age * 97) >>> 0);
    const explicitTarget = Number.isInteger(options.target);
    const target = explicitTarget
      ? Math.max(range[0], Math.min(range[1], options.target))
      : range[0] + Math.floor(random() * (range[1] - range[0] + 1));
    const pattern = PATTERNS[age][(seed + round) % 4];
    const requirements = [{ type: pattern[2], count: target }];
    if (age === 5 && target > 1) {
      const first = Math.max(1, Math.min(target - 1, Math.floor(target / 2) + Math.floor(random() * 3) - 1));
      requirements[0].count = first;
      requirements.push({ type: pattern[3], count: target - first });
    }
    const items = [];
    requirements.forEach(function (need) {
      const spare = age === 5 ? 2 + Math.floor(random() * 5) : 3;
      for (let n = 0; n < need.count + spare; n += 1) items.push({ id: need.type + '-' + n, type: need.type });
    });
    const prefilled = [];
    if (pattern[1] === 'fill-missing') {
      requirements.forEach(function (need) {
        const count = Math.min(3, Math.max(0, need.count - 1));
        for (let i = 0; i < count; i += 1) prefilled.push(need.type + '-' + i);
      });
    }
    const generator = { age: age, challenge: challenge, seed: seed, round: round };
    if (explicitTarget) generator.target = target;
    return {
      version: 1,
      id: ['post', age, challenge, seed, round, target].join('-'),
      generator: generator,
      age: age,
      challenge: challenge,
      seed: seed,
      round: round,
      patternId: pattern[0],
      kind: pattern[1],
      animal: ANIMALS[(seed + round * 2 + age) % ANIMALS.length].id,
      requirements: requirements,
      totalRequired: target,
      items: items,
      truckCount: age === 7 ? 2 : 1,
      splitRule: age === 7 ? (pattern[1] === 'split-near' ? 'near' : 'both') : 'none',
      prefilled: prefilled
    };
  }

  function createState(mission) {
    const canonical = generateMission(mission.generator || mission);
    const positions = {};
    canonical.items.forEach(function (item) { positions[item.id] = canonical.prefilled.includes(item.id) ? 0 : -1; });
    return {
      version: 1, mission: canonical, positions: positions, groups: [], nextGroup: 1,
      phase: 'SELECTING', feedback: null, history: [], completionCount: 0
    };
  }

  function totals(state) {
    const byTruck = Array(state.mission.truckCount).fill(0);
    const byType = {};
    const warehouse = {};
    state.mission.requirements.forEach(function (need) {
      byType[need.type] = Array(state.mission.truckCount).fill(0);
      warehouse[need.type] = 0;
    });
    state.mission.items.forEach(function (item) {
      const truck = state.positions[item.id];
      if (Number.isInteger(truck) && truck >= 0 && truck < byTruck.length) {
        byTruck[truck] += 1;
        byType[item.type][truck] += 1;
      } else warehouse[item.type] += 1;
    });
    return { total: byTruck.reduce(function (a, b) { return a + b; }, 0), byTruck: byTruck, byType: byType, warehouse: warehouse };
  }

  function integrity(state) {
    if (!state || !state.mission || !state.positions || !Array.isArray(state.mission.items) || !Array.isArray(state.groups)) return false;
    const ids = state.mission.items.map(function (item) { return item.id; });
    if (new Set(ids).size !== ids.length || Object.keys(state.positions).length !== ids.length) return false;
    if (ids.some(function (id) {
      const p = state.positions[id];
      return !Number.isInteger(p) || p < -1 || p >= state.mission.truckCount;
    })) return false;
    const grouped = new Set();
    const groupIds = new Set();
    for (const group of state.groups) {
      if (!group || typeof group.id !== 'string' || groupIds.has(group.id) || !Array.isArray(group.items) || group.items.length !== 10) return false;
      groupIds.add(group.id);
      const first = state.mission.items.find(function (item) { return item.id === group.items[0]; });
      if (!first || !Number.isInteger(group.truck) || group.truck < 0 || group.truck >= state.mission.truckCount) return false;
      for (const id of group.items) {
        const item = state.mission.items.find(function (candidate) { return candidate.id === id; });
        if (!item || grouped.has(id) || item.type !== first.type || state.positions[id] !== group.truck) return false;
        grouped.add(id);
      }
    }
    return true;
  }

  function validate(state) {
    if (!integrity(state)) return { ok: false, issues: [{ kind: 'invalid' }] };
    const counts = totals(state);
    const issues = [];
    state.mission.requirements.forEach(function (need) {
      const actual = counts.byType[need.type].reduce(function (a, b) { return a + b; }, 0);
      if (actual !== need.count) issues.push({ kind: actual < need.count ? 'missing' : 'extra', type: need.type, needed: need.count, actual: actual });
    });
    if (state.mission.truckCount === 2 && counts.total === state.mission.totalRequired) {
      if (state.mission.splitRule === 'near' && Math.abs(counts.byTruck[0] - counts.byTruck[1]) > 1) issues.push({ kind: 'balance' });
      else if (state.mission.totalRequired > 1 && counts.byTruck.some(function (n) { return n === 0; })) issues.push({ kind: 'split' });
    }
    return { ok: issues.length === 0, issues: issues, counts: counts };
  }

  function beforeMutation(state) {
    const next = copy(state);
    next.history = (next.history || []).slice(-59);
    next.history.push({ positions: copy(state.positions), groups: copy(state.groups), nextGroup: state.nextGroup });
    next.feedback = null;
    return next;
  }

  function reduce(state, action) {
    if (!state || !action || !integrity(state)) return state;
    if (action.type === 'FINISH') {
      if (state.phase !== 'DELIVERING' || !validate(state).ok) return state;
      const done = copy(state);
      done.phase = 'DELIVERED';
      done.completionCount = 1;
      done.history = [];
      return done;
    }
    if (state.phase !== 'SELECTING') return state;
    if (action.type === 'CHECK') {
      const result = validate(state);
      const checked = copy(state);
      checked.feedback = result.ok ? null : result;
      if (result.ok) checked.phase = 'DELIVERING';
      return checked;
    }
    if (action.type === 'MOVE') {
      if (!Object.prototype.hasOwnProperty.call(state.positions, action.id)) return state;
      if (!Number.isInteger(action.truck) || action.truck < -1 || action.truck >= state.mission.truckCount || state.positions[action.id] === action.truck) return state;
      const next = beforeMutation(state);
      next.groups = next.groups.filter(function (group) { return !group.items.includes(action.id); });
      next.positions[action.id] = action.truck;
      return next;
    }
    if (action.type === 'MOVE_GROUP') {
      const group = state.groups.find(function (g) { return g.id === action.groupId; });
      if (!group || !Number.isInteger(action.truck) || action.truck < -1 || action.truck >= state.mission.truckCount || group.truck === action.truck) return state;
      const next = beforeMutation(state);
      group.items.forEach(function (id) { next.positions[id] = action.truck; });
      if (action.truck === -1) next.groups = next.groups.filter(function (g) { return g.id !== group.id; });
      else next.groups.find(function (g) { return g.id === group.id; }).truck = action.truck;
      return next;
    }
    if (action.type === 'GROUP') {
      const truck = action.truck;
      if (!Number.isInteger(truck) || truck < 0 || truck >= state.mission.truckCount) return state;
      const grouped = new Set(state.groups.flatMap(function (group) { return group.items; }));
      const candidates = state.mission.requirements.map(function (need) { return need.type; });
      const type = action.itemType || action.objectType || action.typeId || candidates.find(function (candidate) {
        return state.mission.items.filter(function (item) { return item.type === candidate && state.positions[item.id] === truck && !grouped.has(item.id); }).length >= 10;
      });
      const items = state.mission.items.filter(function (item) { return item.type === type && state.positions[item.id] === truck && !grouped.has(item.id); }).slice(0, 10);
      if (items.length !== 10) return state;
      const next = beforeMutation(state);
      next.groups.push({ id: 'bundle-' + next.nextGroup++, truck: truck, items: items.map(function (item) { return item.id; }) });
      return next;
    }
    if (action.type === 'UNGROUP') {
      if (!state.groups.some(function (group) { return group.id === action.groupId; })) return state;
      const next = beforeMutation(state);
      next.groups = next.groups.filter(function (group) { return group.id !== action.groupId; });
      return next;
    }
    if (action.type === 'UNDO') {
      if (!state.history || !state.history.length) return state;
      const next = copy(state);
      const previous = next.history.pop();
      next.positions = previous.positions;
      next.groups = previous.groups;
      next.nextGroup = previous.nextGroup;
      next.feedback = null;
      return integrity(next) ? next : state;
    }
    if (action.type === 'RESET') {
      const initial = createState(state.mission);
      if (JSON.stringify(initial.positions) === JSON.stringify(state.positions) && !state.groups.length) return state;
      const next = beforeMutation(state);
      next.positions = initial.positions;
      next.groups = [];
      return next;
    }
    return state;
  }

  function restoreState(snapshot) {
    if (!snapshot || snapshot.version !== 1 || !snapshot.mission || !snapshot.mission.generator) return null;
    const args = snapshot.mission.generator;
    if (![4, 5, 6, 7].includes(args.age) || !Object.prototype.hasOwnProperty.call(CHALLENGES, args.challenge) || !Number.isInteger(args.seed) || args.seed < 0 || args.seed > 4294967295 || !Number.isInteger(args.round) || args.round < 0 || args.round > 9999) return null;
    const state = createState(generateMission(args));
    if (snapshot.mission.id !== state.mission.id) return null;
    if (!snapshot.positions || typeof snapshot.positions !== 'object' || Array.isArray(snapshot.positions)) return null;
    const keys = Object.keys(state.positions);
    if (Object.keys(snapshot.positions).length !== keys.length) return null;
    for (const id of keys) {
      const truck = snapshot.positions[id];
      if (!Number.isInteger(truck) || truck < -1 || truck >= state.mission.truckCount) return null;
      state.positions[id] = truck;
    }
    state.groups = Array.isArray(snapshot.groups) ? copy(snapshot.groups) : [];
    if (!integrity(state)) return null;
    // Persisted labels are not identity. Reissue them to avoid forged/colliding counters.
    state.groups.forEach(function (group, index) { group.id = 'bundle-' + (index + 1); });
    state.nextGroup = state.groups.length + 1;
    if (snapshot.phase === 'DELIVERED' && validate(state).ok) {
      state.phase = 'DELIVERED';
      state.completionCount = 1;
    }
    // A delivery interrupted by leaving resumes with the packed box, not a repeated reward.
    return state;
  }

  const API = { TYPES: copy(TYPES), ANIMALS: copy(ANIMALS), CHALLENGES: copy(CHALLENGES),
    generateMission: generateMission, createState: createState, reduce: reduce,
    validate: validate, totals: totals, integrity: integrity, restoreState: restoreState };
  root.SihyeonPostOfficeModel = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
