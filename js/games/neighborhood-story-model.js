/* A whole story has one registry of objects. Every event moves those same IDs. */
(function (root) {
  'use strict';

  const SCENES = ['fire', 'police', 'snack', 'neighborhood'];
  const AGES = [4, 5, 6, 7];
  function fail(code, message) { const error = new RangeError(message); error.code = code; throw error; }
  function copyZones(zones) { return Object.fromEntries(Object.entries(zones).map(([key, ids]) => [key, ids.slice()])); }
  function counts(zones) { return Object.fromEntries(Object.entries(zones).map(([key, ids]) => [key, ids.length])); }
  function sameZones(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function quantities() {
    if (root.SihyeonQuantityPlayModel) return root.SihyeonQuantityPlayModel;
    if (typeof module === 'object' && module.exports && typeof require === 'function') return require('./quantity-play-model.js');
    throw new Error('The shared quantity model is unavailable.');
  }

  function create(options) {
    const input = options || {}, scene = input.scene, age = input.age, values = input.values || {};
    if (!SCENES.includes(scene)) fail('STORY_SCENE_INVALID', 'Choose one of the four story scenes.');
    if (!AGES.includes(age)) fail('STORY_AGE_INVALID', 'Story age must be 4, 5, 6, or 7.');
    const Q = quantities();
    // Shared models validate every quantity. Invalid inputs are never clamped.
    let base, operation;
    if (scene === 'snack') {
      base = { total: values.total, groups: values.groups };
      operation = Q.equalShare(base.total, base.groups);
    } else {
      base = { a: values.a, b: values.b };
      operation = scene === 'fire' ? Q.subtraction(base.a, base.b)
        : scene === 'police' ? Q.addition(base.a, base.b) : Q.comparison(base.a, base.b);
    }
    const savedBase = JSON.stringify(base), entities = [], ordinals = {}, stages = [];
    const generated = scene === 'fire' ? { returnCount: Math.min(2, base.b) }
      : scene === 'police' ? { leaveCount: Math.min(3, base.a + base.b) }
        : scene === 'snack' ? { deliveryCount: Math.min(3, base.total), startingStock: base.total - Math.min(3, base.total) }
          : { addCount: Math.abs(base.a - base.b), targetZone: base.a < base.b ? 'left' : base.a > base.b ? 'right' : null };
    function make(slot, count) {
      return Array.from({ length: count }, () => {
        const ordinal = (ordinals[slot] || 0) + 1; ordinals[slot] = ordinal;
        const item = { id: 'story-' + scene + '-' + slot + '-' + ordinal, slot, ordinal };
        entities.push(item); return item.id;
      });
    }
    let zones;
    if (scene === 'fire') zones = { station: make('main', base.a), road: [] };
    else if (scene === 'police') zones = { station: make('main', base.a), waiting: make('arrival', base.b), road: [] };
    else if (scene === 'snack') {
      zones = { tray: make('main', age === 7 ? generated.startingStock : base.total), waiting: age === 7 ? make('arrival', generated.deliveryCount) : [] };
      for (let i = 0; i < base.groups; i++) zones['plate-' + i] = [];
    } else zones = { left: make('left', base.a), right: make('right', base.b), waiting: age === 7 && generated.targetZone ? make(generated.targetZone, generated.addCount) : [] };
    const initialZones = copyZones(zones);
    let current;
    function begin(operator, captionKey, operands) {
      const stageIndex = stages.length, id = scene + '-' + (stageIndex + 1);
      current = { id, operator, captionKey, operands: Object.assign({}, operands), startZones: copyZones(zones), events: [], endZones: null, result: null };
      current.events.push({ kind: 'stage', id: id + '-start', stageIndex, captionKey, countsAfter: counts(zones) });
    }
    function move(itemId, from, to) {
      const index = zones[from]?.indexOf(itemId);
      if (index == null || index < 0 || !zones[to]) fail('STORY_INVARIANT_FAILED', 'A story move must use an existing object and zone.');
      zones[from].splice(index, 1); zones[to].push(itemId);
      current.events.push({ kind: 'move', id: current.id + '-move-' + current.events.length, stageIndex: stages.length,
        itemId, from, to, countsAfter: counts(zones) });
    }
    function pair(leftId, rightId, pairIndex) {
      current.events.push({ kind: 'pair', id: current.id + '-pair-' + (pairIndex + 1), stageIndex: stages.length,
        leftId, rightId, pairIndex, countsAfter: counts(zones) });
    }
    function end(result) {
      current.result = Object.assign({}, result); current.endZones = copyZones(zones);
      current.events.push({ kind: 'summary', id: current.id + '-end', stageIndex: stages.length,
        result: Object.assign({}, result), countsAfter: counts(zones) });
      stages.push(current); current = null;
    }
    const countResult = count => ({ kind: 'count', count });
    function compareResult(a, b) {
      const result = Q.comparison(a, b);
      return { kind: 'compare', a, b, pairCount: result.pairCount, difference: result.difference, relation: result.relation };
    }

    if (scene === 'fire') {
      const originals = zones.station.slice();
      begin('subtract', 'fire.depart', { a: base.a, b: base.b });
      operation.moves.forEach(event => move(originals[event.item.index], 'station', 'road'));
      end(countResult(zones.station.length));
      if (age === 7) {
        const returned = zones.road.slice(-generated.returnCount).reverse();
        begin('add', 'fire.return', { a: zones.station.length, b: generated.returnCount });
        // slice(-0) is the entire array; zero return must move nothing.
        if (generated.returnCount) returned.forEach(id => move(id, 'road', 'station'));
        end(countResult(zones.station.length));
      }
    } else if (scene === 'police') {
      begin('add', 'police.arrive', { a: base.a, b: base.b });
      zones.waiting.slice().forEach(id => move(id, 'waiting', 'station'));
      end(countResult(zones.station.length));
      if (age === 7) {
        const assembled = zones.station.slice(), leaving = Q.subtraction(assembled.length, generated.leaveCount);
        begin('subtract', 'police.depart', { a: assembled.length, b: generated.leaveCount });
        leaving.moves.forEach(event => move(assembled[event.item.index], 'station', 'road'));
        end(countResult(zones.station.length));
      }
    } else if (scene === 'snack') {
      if (age === 7) {
        begin('add', 'snack.deliver', { a: generated.startingStock, b: generated.deliveryCount });
        zones.waiting.slice().forEach(id => move(id, 'waiting', 'tray'));
        end(countResult(zones.tray.length));
      }
      const all = zones.tray.slice();
      begin('share', 'snack.share', { total: base.total, groups: base.groups });
      operation.moves.forEach(event => move(all[event.item.index], 'tray', 'plate-' + event.groupIndex));
      end({ kind: 'share', total: base.total, groupCount: base.groups, each: operation.each, remainder: operation.remainder });
    } else {
      begin('compare', 'neighborhood.compare', { a: base.a, b: base.b });
      operation.pairs.forEach((event, index) => pair(zones.left[event.left.index], zones.right[event.right.index], index));
      end(compareResult(base.a, base.b));
      if (age === 7) {
        begin('equalize', 'neighborhood.equalize', { a: zones.left.length, b: zones.right.length, add: generated.addCount, target: generated.targetZone });
        if (generated.targetZone) zones.waiting.slice().forEach(id => move(id, 'waiting', generated.targetZone));
        end(compareResult(zones.left.length, zones.right.length));
      }
    }

    const registry = new Set(entities.map(item => item.id));
    function assertPartition(candidate) {
      const ids = Object.values(candidate).flat();
      if (ids.length !== registry.size || new Set(ids).size !== registry.size || ids.some(id => !registry.has(id))) {
        fail('STORY_INVARIANT_FAILED', 'Each original object must occur in exactly one zone.');
      }
    }
    assertPartition(initialZones);
    stages.forEach((stage, stageIndex) => {
      assertPartition(stage.startZones); assertPartition(stage.endZones);
      if (!sameZones(stage.startZones, stageIndex ? stages[stageIndex - 1].endZones : initialZones)) {
        fail('STORY_INVARIANT_FAILED', 'A story stage must start at the previous stage result.');
      }
      const replay = copyZones(stage.startZones);
      stage.events.forEach(event => {
        if (event.kind === 'move') {
          const position = replay[event.from].indexOf(event.itemId);
          if (position < 0) fail('STORY_INVARIANT_FAILED', 'A replayed move lost its original object.');
          replay[event.from].splice(position, 1); replay[event.to].push(event.itemId);
        } else if (event.kind === 'pair' && (!replay.left.includes(event.leftId) || !replay.right.includes(event.rightId))) {
          fail('STORY_INVARIANT_FAILED', 'Both objects in a pair must be present.');
        }
        assertPartition(replay);
        if (JSON.stringify(counts(replay)) !== JSON.stringify(event.countsAfter)) fail('STORY_INVARIANT_FAILED', 'Event counts disagree with actual objects.');
      });
      if (!sameZones(replay, stage.endZones)) fail('STORY_INVARIANT_FAILED', 'Events must reproduce the stage result.');
    });
    if (scene === 'fire' && age === 7) {
      const departed = new Set(stages[0].endZones.road);
      if (stages[1].events.some(event => event.kind === 'move' && !departed.has(event.itemId))) fail('STORY_INVARIANT_FAILED', 'Only an original departing object can return.');
    }
    if (JSON.stringify(base) !== savedBase) fail('STORY_INVARIANT_FAILED', 'A story must not change the selected base values.');
    const finalZones = copyZones(zones); assertPartition(finalZones);
    return { version: 1, scene, age, base, generated, entities, initialZones, stages, finalZones,
      result: Object.assign({}, stages[stages.length - 1].result), presentation: { prediction: age === 5, tenFrames: age === 6 } };
  }

  const API = Object.freeze({ create });
  root.SihyeonStoryPlayModel = API;
  if (typeof module === 'object' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
