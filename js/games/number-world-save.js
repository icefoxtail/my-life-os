/* Number Kingdom's saved artwork contains data only, never meshes or callbacks. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.NumberWorldSave = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const KEY = 'sihyeon.number-world.v1';
  const MAX_BYTES = 2000000;
  const finite = (n, min, max) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
  const object = value => value && typeof value === 'object' && !Array.isArray(value);

  function normalizeSnapshot(input, rules) {
    if (!object(input) || !Array.isArray(input.friends) || !Array.isArray(input.props)) return null;
    if (input.friends.length + input.props.length > rules.maxEntities) return null;
    const ids = new Set(), friends = [], props = [];
    const goodId = id => typeof id === 'string' && /^[A-Za-z0-9_.:-]{1,80}$/.test(id);
    const validPosition = p => finite(p.gx, 0, rules.worldWidth) && finite(p.gy, -5, 33000) && finite(p.gz, -12, 12);
    const history = (raw, n, depth = 0) => {
      if (!Array.isArray(raw) || raw.length === 0 || depth > rules.maxNumber) return [];
      // Only the last merge is used by the game's split choices. Older siblings
      // are redundant; the two branches recursively retain their own last merge.
      const last = raw[raw.length - 1];
      if (!object(last) || !object(last.left) || !object(last.right)) return [];
      const left = last.left, right = last.right;
      if (![left.n, right.n].every(v => Number.isInteger(v) && v >= 1 && v < n) || left.n + right.n !== n) return [];
      const branch = value => ({n: value.n, pose: rules.poses(value.n).includes(value.pose) ? value.pose : rules.poses(value.n)[0],
        history: history(value.history, value.n, depth + 1)});
      return [{left: branch(left), right: branch(right)}];
    };
    for (const raw of [...input.props, ...input.friends]) {
      if (!object(raw) || !goodId(raw.id) || ids.has(raw.id) || !validPosition(raw)) return null;
      ids.add(raw.id);
    }
    const link = value => value == null ? null : goodId(value) && ids.has(value) ? value : false;
    for (const p of input.props) {
      if (!rules.propTypes.includes(p.type)) return null;
      const carrier = link(p.carrier);
      if (carrier === false || carrier === p.id) return null;
      props.push({id: p.id, _old: p.id, type: p.type, gx: p.gx, gy: p.gy, gz: p.gz, carrier});
    }
    for (const f of input.friends) {
      if (!Number.isInteger(f.n) || f.n < 1 || f.n > rules.maxNumber || !rules.poses(f.n).includes(f.pose)) return null;
      const carrier = link(f.carrier);
      if (carrier === false || carrier === f.id) return null;
      if (f.bridge != null && !rules.bridgeIds.includes(f.bridge)) return null;
      friends.push({id: f.id, _old: f.id, n: f.n, pose: f.pose,
        savedPose: rules.poses(f.n).includes(f.savedPose) ? f.savedPose : null,
        gx: f.gx, gy: f.gy, gz: f.gz, carrier, bridge: f.bridge || null,
        history: history(f.history, f.n)});
    }
    // A malformed support cycle must not reach descendants()/physics.
    const byId = new Map([...props, ...friends].map(p => [p.id, p]));
    for (const entity of byId.values()) {
      const seen = new Set([entity.id]);
      let parent = entity.carrier;
      while (parent) {
        if (seen.has(parent)) return null;
        seen.add(parent); parent = byId.get(parent)?.carrier || null;
      }
    }
    if (!finite(input.cameraX, 4, rules.worldWidth - 4)) return null;
    if (!Number.isInteger(input.camPresetIdx) || input.camPresetIdx < 0 || input.camPresetIdx >= rules.cameraPresets) return null;
    if (!finite(input.camFov, 28, 62) || !rules.zoneIds.includes(input.zone)) return null;
    const selected = link(input.selected);
    if (selected === false) return null;
    const townGuide = ['house', 'tower', 'stairs'].includes(input.townGuide) ? input.townGuide : null;
    return {friends, props, cameraX: input.cameraX, camPresetIdx: input.camPresetIdx,
      camFov: input.camFov, zone: input.zone, selected, townGuide};
  }

  function decode(raw, rules) {
    if (typeof raw !== 'string' || raw.length > MAX_BYTES) return null;
    try {
      const data = JSON.parse(raw);
      if (!object(data) || data.version !== 1) return null;
      return normalizeSnapshot(data.snapshot, rules);
    } catch (_) { return null; }
  }

  function create(options) {
    const rules = options.rules, memory = options.memory || {};
    let status = {mode: 'empty', restored: false, invalid: false}, lastSavedAt = 0;
    const access = (name, action) => {
      try { const storage = options[name] && options[name](); return storage ? action(storage) : null; }
      catch (_) { return null; }
    };
    function read() {
      const candidates = [
        ['memory', memory[KEY]],
        ['session', access('session', storage => storage.getItem(KEY))],
        ['local', access('local', storage => storage.getItem(KEY))]
      ];
      let invalid = false;
      const valid = [];
      for (const [source, raw] of candidates) {
        if (raw == null) continue;
        const snapshot = decode(raw, rules);
        if (!snapshot) { invalid = true; continue; }
        const data = JSON.parse(raw);
        const savedAt = Number.isSafeInteger(data.savedAt) && data.savedAt >= 0 ? data.savedAt : 0;
        valid.push({source, raw, snapshot, savedAt});
      }
      valid.sort((a, b) => b.savedAt - a.savedAt);
      if (valid.length) {
        const chosen = valid[0];
        lastSavedAt = chosen.savedAt;
        memory[KEY] = chosen.raw;
        const mode = valid.some(v => v.source === 'local' && v.raw === chosen.raw) ? 'local'
          : valid.some(v => v.source === 'session' && v.raw === chosen.raw) ? 'session' : 'memory';
        status = {mode, restored: true, invalid};
        return chosen.snapshot;
      }
      status = {mode: invalid ? 'invalid' : 'empty', restored: false, invalid};
      return null;
    }
    function write(snapshot) {
      const clean = normalizeSnapshot(snapshot, rules);
      if (!clean) return {ok: false, mode: 'invalid'};
      lastSavedAt = Math.max(Date.now(), lastSavedAt + 1);
      const raw = JSON.stringify({version: 1, savedAt: lastSavedAt, snapshot: clean});
      if (raw.length > MAX_BYTES) return {ok: false, mode: 'too-large'};
      memory[KEY] = raw;
      const session = access('session', storage => { storage.setItem(KEY, raw); return storage.getItem(KEY) === raw; });
      const local = access('local', storage => { storage.setItem(KEY, raw); return storage.getItem(KEY) === raw; });
      status = {mode: local ? 'local' : session ? 'session' : 'memory', restored: status.restored, invalid: false};
      return {ok: true, ...status};
    }
    return {read, write, status: () => ({...status})};
  }
  return {KEY, MAX_BYTES, normalizeSnapshot, decode, create};
});
