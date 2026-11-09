/* Coloring-template revision safety: saved paint must stay on the artwork it was
   painted on, move to new artwork only on an explicit new paper, and survive undo,
   reload, part-id saves, downgrade and corrupt data. Runs the production closure in
   a Node VM with a minimal fake SVG DOM; it does not claim browser rendering. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const sourcePath = path.join(__dirname, '../js/games/art-zone.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const marker = 'window.SihyeonGames[GAME_KEY] = { render, destroy };';
assert(source.includes(marker), 'production export marker changed; review test access');
const testSource = source.replace(marker,
  'window.qa = { state, COLORING_TEMPLATES, COLORS, loadWork, saveWork, undoWork, clearWork, renderColoringTemplate, partOrder, templateVersion };\n' + marker);

const KEY = 'sihyeon-art-work-v1';
const BACKUP = 'sihyeon-art-work-v1-backup';
const TAG_RE = /<[a-z]+\b[^>]*\bclass="(?:[^"]*\s)?fillable(?:\s[^"]*)?"[^>]*>/gi;

function fakeWrap() {
  const wrap = { html: '', els: [], classList: { add() {}, remove() {} }, dataset: {} };
  Object.defineProperty(wrap, 'innerHTML', {
    get: () => wrap.html,
    set(value) {
      wrap.html = value;
      wrap.els = [...value.matchAll(TAG_RE)].map((m) => {
        const attrs = { fill: (m[0].match(/\bfill="([^"]*)"/) || [])[1] || '' };
        const part = (m[0].match(/\bdata-part="([^"]*)"/) || [])[1];
        const handlers = {};
        return {
          part,
          getAttribute: (k) => attrs[k] ?? null,
          setAttribute: (k, v) => { attrs[k] = v; },
          addEventListener: (n, h) => { handlers[n] = h; },
          getBBox: () => ({ x: 0, y: 0, width: 40, height: 40 }),
          tap() { handlers.pointerup?.({ preventDefault() {}, clientX: 0, clientY: 0 }); },
        };
      });
    },
  });
  wrap.querySelector = (s) => (s === 'svg' ? { getBBox: () => ({ x: 0, y: 0, width: 240, height: 180 }), setAttribute() {}, style: {} } : null);
  wrap.querySelectorAll = (s) => (s === '.fillable' ? wrap.els : []);
  return wrap;
}

function boot(store, { failKeys = [], real = false } = {}) {
  const wrap = fakeWrap();
  const writes = [];
  const context = {
    window: { SihyeonGames: {}, removeEventListener() {} },
    document: { getElementById: (id) => (id === 'azColoringWrap' ? wrap : null) },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem(k, v) {
        writes.push(k);
        if (failKeys.includes(k)) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
        store.set(k, String(v));
      },
    },
    navigator: {},
    setTimeout: () => 0, clearTimeout() {},
  };
  vm.runInNewContext(testSource, context, { timeout: 1000 });
  const q = context.window.qa;
  if (!real) {
    // Pin police to its original v1 artwork so these checks do not depend on
    // which templates have shipped a redesign; redesign() simulates one.
    const t = q.COLORING_TEMPLATES.find((x) => x.id === 'police');
    if (t.legacy?.[1]) t.svg = t.legacy[1];
    delete t.legacy; delete t.parts; delete t.version;
  }
  q.state.tab = 'coloring';
  q.state.destroyed = false;
  q.state.options = {};
  return { q, wrap, store, writes };
}

const police = (q) => q.COLORING_TEMPLATES.find((t) => t.id === 'police');
const V1_SVG = (() => { const { q } = boot(new Map()); return police(q).svg; })();
const V1_COUNT = [...V1_SVG.matchAll(TAG_RE)].length;
const V2_SVG = `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg">
  <path class="fillable" data-part="body" d="M10 10H200V120H10Z" fill="#FFF"/>
  <rect class="fillable" data-part="window_front" x="20" y="20" width="40" height="30" fill="#FFF"/>
  <rect class="fillable" data-part="window_rear" x="80" y="20" width="40" height="30" fill="#FFF"/>
  <rect class="fillable" data-part="light_red" x="60" y="0" width="20" height="10" fill="#FFF"/>
  <circle class="fillable" data-part="wheel_front" cx="50" cy="130" r="20" fill="#FFF"/>
  <circle class="fillable" data-part="wheel_rear" cx="170" cy="130" r="20" fill="#FFF"/>
</svg>`;
const V2_PARTS = ['body', 'window_front', 'window_rear', 'light_red', 'wheel_front', 'wheel_rear'];
// Simulate the future release: police redesigned as v2, original kept as legacy[1].
function redesign(q) {
  const t = police(q);
  t.legacy = { 1: t.svg };
  t.svg = V2_SVG;
  t.version = 2;
}
const painted = () => Array.from({ length: V1_COUNT }, (_, i) => (i % 2 ? '#FFF' : '#FF4444'));
const saved = (s) => JSON.parse(s.get(KEY)).templates.police;

const checks = [];
function test(name, run) {
  try { checks.push({ name, status: 'PASS', detail: run() ?? true }); }
  catch (error) { checks.push({ name, status: 'FAIL', message: error.message, stack: error.stack }); }
}

test('unchanged v1 template: pre-versioning save loads identically and saves as svgVersion 1', () => {
  const fills = painted();
  const store = new Map([[KEY, JSON.stringify({ templates: { police: { fills, completed: false } }, activeTemplateId: 'police', tab: 'coloring' })]]);
  const { q, wrap } = boot(store);
  q.loadWork();
  q.renderColoringTemplate(police(q));
  assert.equal(wrap.innerHTML, V1_SVG);
  assert.deepEqual(wrap.els.map((e) => e.getAttribute('fill')), fills);
  wrap.els[1].tap();
  assert.equal(saved(store).svgVersion, 1);
  assert.equal(saved(store).fills[1], '#FF4444');
  assert.equal(saved(store).fills.length, V1_COUNT);
  return { fillables: V1_COUNT };
});

test('redesigned template: painted v1 work stays on the legacy artwork with every index unchanged', () => {
  const fills = painted();
  const store = new Map([[KEY, JSON.stringify({ templates: { police: { fills, completed: true } } })]]);
  const { q, wrap } = boot(store);
  redesign(q);
  q.loadWork();
  q.renderColoringTemplate(police(q));
  assert.equal(wrap.innerHTML, V1_SVG, 'old paint must be drawn on the artwork it was painted on');
  assert.equal(wrap.dataset.svgVersion, '1');
  assert.deepEqual(wrap.els.map((e) => e.getAttribute('fill')), fills);
  wrap.els[3].tap();
  assert.equal(saved(store).svgVersion, 1, 'painting more on a legacy picture keeps it legacy');
  assert.equal(saved(store).fills[3], '#FF4444');
  assert.deepEqual(saved(store).fills.filter((_, i) => i !== 3), fills.filter((_, i) => i !== 3));
});

test('new paper moves to the new artwork; undo returns the legacy picture intact', () => {
  const fills = painted();
  const store = new Map([[KEY, JSON.stringify({ templates: { police: { fills, completed: false } } })]]);
  const { q, wrap } = boot(store);
  redesign(q);
  q.loadWork();
  q.state.activeTemplateId = 'police';
  q.renderColoringTemplate(police(q));
  q.clearWork();
  assert.equal(wrap.innerHTML, V2_SVG);
  assert.equal(saved(store).svgVersion, 2);
  assert.deepEqual(Object.keys(saved(store).parts), V2_PARTS);
  assert(Object.values(saved(store).parts).every((c) => c === '#FFF'));
  wrap.els[0].tap();
  assert.equal(saved(store).parts.body, '#FF4444');
  q.undoWork(); // undo the body tap
  q.undoWork(); // undo the new paper
  assert.equal(wrap.innerHTML, V1_SVG);
  assert.equal(q.state.templateWork.police.svgVersion, 1);
  assert.deepEqual(wrap.els.map((e) => e.getAttribute('fill')), fills);
});

test('v2 work reloads from storage onto the same parts', () => {
  const store = new Map();
  {
    const { q, wrap } = boot(store);
    redesign(q);
    q.loadWork();
    q.renderColoringTemplate(police(q));
    assert.equal(wrap.innerHTML, V2_SVG, 'a fresh picture uses the newest artwork');
    q.state.currentColor = '#4488FF';
    wrap.els[4].tap();
  }
  assert.equal(saved(store).parts.wheel_front, '#4488FF');
  const { q, wrap } = boot(store);
  redesign(q);
  q.loadWork();
  q.renderColoringTemplate(police(q));
  assert.equal(wrap.innerHTML, V2_SVG);
  assert.equal(wrap.els.find((e) => e.part === 'wheel_front').getAttribute('fill'), '#4488FF');
});

test('unpainted v1 save goes straight to the new artwork', () => {
  const store = new Map([[KEY, JSON.stringify({ templates: { police: { fills: Array(V1_COUNT).fill('#FFF') } } })]]);
  const { q, wrap } = boot(store);
  redesign(q);
  q.loadWork();
  q.renderColoringTemplate(police(q));
  assert.equal(wrap.innerHTML, V2_SVG);
  assert.equal(q.state.templateWork.police.svgVersion, 2);
});

test('parts-only save and a newer-than-code save map by part id, never by order', () => {
  const parts = { wheel_rear: '#1A1A1A', body: '#4488FF' };
  for (const svgVersion of [2, 3]) {
    const store = new Map([[KEY, JSON.stringify({ templates: { police: { svgVersion, parts, fills: svgVersion === 3 ? ['#FF0000', '#FF0000'] : undefined } } })]]);
    const { q, wrap } = boot(store);
    redesign(q);
    q.loadWork();
    q.renderColoringTemplate(police(q));
    assert.equal(wrap.innerHTML, V2_SVG);
    const byPart = Object.fromEntries(wrap.els.map((e) => [e.part, e.getAttribute('fill')]));
    assert.equal(byPart.body, '#4488FF');
    assert.equal(byPart.wheel_rear, '#1A1A1A');
    assert.equal(byPart.window_front, '#FFF', 'index-ordered fills from unknown artwork must not leak onto parts');
  }
});

test('reserved part names (constructor, toString) never leak prototype values as fills', () => {
  const store = new Map([[KEY, JSON.stringify({ templates: { police: { svgVersion: 3, parts: { body: '#4488FF' } } } })]]);
  const { q, wrap } = boot(store);
  redesign(q);
  police(q).svg = V2_SVG.replace('data-part="window_front"', 'data-part="constructor"').replace('data-part="window_rear"', 'data-part="tostring"');
  q.loadWork();
  q.renderColoringTemplate(police(q));
  for (const e of wrap.els) assert.equal(typeof e.getAttribute('fill'), 'string');
  assert.equal(wrap.els.find((e) => e.part === 'constructor').getAttribute('fill'), '#FFF');
});

test('legacy picture painted further survives a second reload on the legacy artwork', () => {
  const fills = painted();
  const store = new Map([[KEY, JSON.stringify({ templates: { police: { fills } } })]]);
  { const { q, wrap } = boot(store); redesign(q); q.loadWork(); q.renderColoringTemplate(police(q)); wrap.els[1].tap(); }
  const { q, wrap } = boot(store);
  redesign(q);
  q.loadWork();
  q.renderColoringTemplate(police(q));
  assert.equal(wrap.innerHTML, V1_SVG);
  assert.equal(wrap.els[1].getAttribute('fill'), '#FF4444');
  assert.equal(wrap.els[0].getAttribute('fill'), fills[0]);
});

test('completed flag: new paper resets it on a completed legacy picture', () => {
  const store = new Map([[KEY, JSON.stringify({ templates: { police: { fills: painted(), completed: true } } })]]);
  const { q } = boot(store);
  redesign(q);
  q.loadWork();
  q.state.activeTemplateId = 'police';
  q.renderColoringTemplate(police(q));
  assert.equal(q.state.coloringCompleted, true);
  q.clearWork();
  assert.equal(saved(store).completed, false);
  assert.equal(saved(store).svgVersion, 2);
});

test('memory fallback: when writes fail, new paper and undo on a legacy picture survive an in-page reload', () => {
  const fills = painted();
  const raw = JSON.stringify({ templates: { police: { fills } } });
  const store = new Map([[KEY, raw]]);
  const { q, wrap } = boot(store, { failKeys: [KEY] });
  redesign(q);
  q.loadWork();
  q.state.activeTemplateId = 'police';
  q.renderColoringTemplate(police(q));
  q.clearWork();
  q.undoWork();
  assert.equal(wrap.innerHTML, V1_SVG, 'undo inside the page restores the legacy picture');
  q.clearWork();
  // Re-entering the game reloads from the memory copy (undo history is per visit, as before).
  q.loadWork();
  q.renderColoringTemplate(police(q));
  assert.equal(wrap.innerHTML, V2_SVG, 'memory copy keeps the new paper');
  assert.equal(store.get(KEY), raw, 'rejected writes never altered durable storage');
  return { fillsKept: fills.length };
});

test('one-time backup: written once, templates only, never overwritten', () => {
  const first = { templates: { police: { fills: painted() } }, freeImage: 'data:image/png;base64,QUJD' };
  const store = new Map([[KEY, JSON.stringify(first)]]);
  boot(store).q.loadWork();
  const backup = JSON.parse(store.get(BACKUP));
  assert.deepEqual(backup.templates, first.templates);
  assert.equal('freeImage' in backup, false, 'free PNG must not be duplicated into the backup');
  store.set(KEY, JSON.stringify({ templates: { police: { fills: ['#000'] } } }));
  boot(store).q.loadWork();
  assert.deepEqual(JSON.parse(store.get(BACKUP)).templates, first.templates);
  const empty = new Map();
  boot(empty).q.loadWork();
  assert.equal(empty.has(BACKUP), false, 'nothing to back up on a first visit');
});

test('backup write failure leaves loading and saving intact', () => {
  const fills = painted();
  const store = new Map([[KEY, JSON.stringify({ templates: { police: { fills } } })]]);
  const { q, wrap } = boot(store, { failKeys: [BACKUP] });
  q.loadWork();
  q.renderColoringTemplate(police(q));
  assert.deepEqual(wrap.els.map((e) => e.getAttribute('fill')), fills);
  wrap.els[1].tap();
  assert.equal(saved(store).fills[1], '#FF4444');
});

test('corrupt or hostile saved data never throws and never injects colors', () => {
  const bad = [
    { police: { fills: 'x', parts: [1, 2] } },
    { police: { svgVersion: '2', fills: ['url(javascript:1)', 5, null] } },
    { police: { svgVersion: -4, parts: { 'Bad-Key': '#000', body: 'expression(1)' } } },
    { police: null },
    'nope',
  ];
  for (const templates of bad) {
    const store = new Map([[KEY, JSON.stringify({ templates })]]);
    const { q, wrap } = boot(store);
    redesign(q);
    q.loadWork();
    q.renderColoringTemplate(police(q));
    for (const e of wrap.els) assert.match(e.getAttribute('fill'), /^(#[0-9a-f]{3,8}|hsl\([0-9.,% ]+\)|white|none)$/i);
  }
  return { cases: bad.length };
});

test('shipped redesigns: a painted v1 save opens on the real legacy artwork', () => {
  const { q: probe } = boot(new Map(), { real: true });
  const shipped = probe.COLORING_TEMPLATES.filter((t) => probe.templateVersion(t) > 1);
  for (const t of shipped) {
    const count = [...t.legacy[1].matchAll(TAG_RE)].length;
    const fills = Array.from({ length: count }, (_, i) => (i % 3 ? '#FFF' : '#44CC44'));
    const store = new Map([[KEY, JSON.stringify({ templates: { [t.id]: { fills } } })]]);
    const { q, wrap } = boot(store, { real: true });
    q.loadWork();
    q.renderColoringTemplate(q.COLORING_TEMPLATES.find((x) => x.id === t.id));
    assert.equal(wrap.innerHTML, t.legacy[1], `${t.id}: legacy artwork`);
    assert.deepEqual(wrap.els.map((e) => e.getAttribute('fill')), fills, `${t.id}: same colors on same indices`);
  }
  return { shipped: shipped.map((t) => t.id) };
});

test('static: every template revision is complete and every part is unique and described', () => {
  const { q } = boot(new Map(), { real: true });
  const palette = new Set(q.COLORS.map((c) => String(c.c).toLowerCase()));
  const labels = fs.readFileSync(path.join(__dirname, '../js/voice-labels.js'), 'utf8');
  const report = [];
  for (const t of q.COLORING_TEMPLATES) {
    const version = q.templateVersion(t);
    for (let v = 1; v < version; v++) assert.equal(typeof t.legacy?.[v], 'string', `${t.id}: legacy[${v}] missing for version ${version}`);
    const order = q.partOrder(t.svg);
    const anyPart = order.ids.some(Boolean);
    if (version > 1 || t.parts || anyPart) {
      assert(order.unique, `${t.id}: every fillable needs a unique valid data-part`);
      assert.deepEqual(Object.keys(t.parts || {}).sort(), [...order.ids].sort(), `${t.id}: parts metadata must list exactly the SVG parts`);
      for (const [id, meta] of Object.entries(t.parts)) {
        assert(meta.ko && meta.en, `${t.id}.${id}: ko/en name`);
        assert(palette.has(String(meta.color).toLowerCase()), `${t.id}.${id}: recommended color ${meta.color} not in palette`);
      }
    }
    assert(labels.includes(`"id": "${t.id}"`), `${t.id}: missing from voice-labels`);
    report.push({ id: t.id, version, fillables: order.ids.length, parts: anyPart });
  }
  return report;
});

const result = {
  suite: 'Coloring template revisions — saved paint safety',
  sourceSha256: crypto.createHash('sha256').update(source).digest('hex'),
  status: checks.every((c) => c.status === 'PASS') ? 'PASS' : 'FAIL',
  checks,
  limits: ['Node VM with a regex-built fake SVG DOM; real browser rendering is checked separately.'],
};
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.status !== 'PASS') process.exitCode = 1;
