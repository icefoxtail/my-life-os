/* Read-only artwork sharing, recommended colors, and save preservation.
 * Runs the actual production closure. This is not a browser pixel/touch test. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const source = fs.readFileSync(path.join(__dirname, '../js/games/art-zone.js'), 'utf8');
const marker = 'window.SihyeonGames[GAME_KEY] = { render, destroy };';
assert(source.includes(marker), 'production export marker changed; review QA access');
const instrumented = source.replace(marker,
  'window.qa = { state, COLORING_TEMPLATES, COLORS, loadWork, saveWork, partOrder, updateArtTools, playCurrentArtwork };\n' + marker);
const KEY = 'sihyeon-art-work-v1';
const TAG_RE = /<[a-z]+\b[^>]*\bclass="(?:[^"]*\s)?fillable(?:\s[^"]*)?"[^>]*>/gi;
const json = (value) => JSON.parse(JSON.stringify(value));
const decode = (object) => decodeURIComponent(object.src.slice(object.src.indexOf(',') + 1));
const fills = (svg) => [...svg.matchAll(TAG_RE)].map((match) => match[0].match(/\bfill="([^"]*)"/)[1]);
const byPart = (svg) => Object.fromEntries([...svg.matchAll(TAG_RE)].map((match) => [
  match[0].match(/\bdata-part="([^"]*)"/)?.[1], match[0].match(/\bfill="([^"]*)"/)[1],
]));

function boot(data, { failWrites = false } = {}) {
  const store = new Map(data === undefined ? [] : [[KEY, typeof data === 'string' ? data : JSON.stringify(data)]]);
  const writes = [];
  const context = {
    window: { SihyeonGames: {} }, document: {}, navigator: {},
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem(key, value) {
        writes.push(key);
        if (failWrites) throw new Error('storage quota');
        store.set(key, String(value));
      },
    },
    setTimeout: () => 0, clearTimeout() {},
  };
  vm.runInNewContext(instrumented, context, { timeout: 1000 });
  return { q: context.window.qa, bridge: context.window.SihyeonArtPlayBridge, store, writes };
}

const checks = [];
function test(name, run) {
  try { checks.push({ name, status: 'PASS', detail: run() ?? true }); }
  catch (error) { checks.push({ name, status: 'FAIL', message: error.message }); }
}

test('catalog shares all 28 shipped drawings with exact colors, counters, and plurals', () => {
  const { q, bridge } = boot();
  const objects = bridge.getPlayObjects();
  assert.equal(objects.length, 28);
  assert.equal(new Set(objects.map((object) => object.id)).size, 28);
  for (const tpl of q.COLORING_TEMPLATES) {
    const object = objects.find((item) => item.artTemplateId === tpl.id);
    assert(object, tpl.id);
    assert.equal(object.id, `art:${tpl.id}`);
    assert.equal(object.nameKo, tpl.name);
    assert.equal(object.artVersion, tpl.version);
    assert.equal(object.category, 'art');
    assert.equal(object.fromArtwork, false);
    assert(object.nameEn && object.pluralEn && object.unitKo);
    assert(object.src.startsWith('data:image/svg+xml;charset=utf-8,'));
    const colors = byPart(decode(object));
    for (const [id, part] of Object.entries(tpl.parts)) assert.equal(colors[id], part.color, `${tpl.id}/${id}`);
  }
  const find = (id) => objects.find((object) => object.artTemplateId === id);
  assert.equal(find('bus').pluralEn, 'buses');
  assert.equal(find('strawberry').pluralEn, 'strawberries');
  assert.equal(find('police_officer').unitKo, '명');
  assert.equal(find('cat').unitKo, '마리');
  assert.equal(find('boat').unitKo, '척');
  assert.equal(find('house').unitKo, '채');
  assert.equal(find('police_swat_suv').pluralEn, 'police SWAT SUVs');
  return { drawings: objects.length };
});

test('all current SVGs have 6–14 stable paint regions and described palette colors', () => {
  const { q } = boot();
  const palette = new Set(q.COLORS.map((color) => color.c));
  for (const tpl of q.COLORING_TEMPLATES) {
    const order = q.partOrder(tpl.svg);
    assert(order.unique, tpl.id);
    assert(order.ids.length >= 6 && order.ids.length <= 14, tpl.id);
    assert.deepEqual([...order.ids].sort(), Object.keys(tpl.parts).sort(), tpl.id);
    assert(/viewBox="0 0 240 180"/.test(tpl.svg), tpl.id);
    for (const part of Object.values(tpl.parts)) assert(part.ko && part.en && palette.has(part.color), tpl.id);
    assert(!/<(?:script|foreignObject|image|use)\b|\bon[a-z]+\s*=|\b(?:href|xlink:href)\s*=/i.test(tpl.svg), tpl.id);
    assert(/class="az-illustration-details" pointer-events="none"/.test(tpl.svg), tpl.id);
  }
});

test('catalog callers cannot recolor or replace the shared canonical images', () => {
  const { bridge } = boot();
  assert(Object.isFrozen(bridge));
  const objects = bridge.getPlayObjects();
  const original = objects[0].src;
  objects[0].src = 'https://untrusted.invalid/image.svg';
  objects[0].nameKo = 'changed';
  objects.length = 0;
  assert.equal(bridge.getPlayObjects().length, 28);
  assert.equal(bridge.getPlayObjects()[0].src, original);
  assert.equal(bridge.getPlayObjects()[0].nameKo, '경찰차');
});

test('painted legacy artwork exports its exact old geometry and index fills without loading or writing', () => {
  const initial = boot();
  const oldSvg = initial.q.COLORING_TEMPLATES.find((tpl) => tpl.id === 'police').legacy[1];
  const paint = fills(oldSvg).map((_, index) => index % 2 ? '#4488FF' : '#FFF');
  const { bridge, q, store, writes } = boot({ activeTemplateId: 'police', templates: { police: { fills: paint } } });
  const originalStore = store.get(KEY);
  const object = bridge.getSavedPlayObject();
  assert.equal(object.artVersion, 1);
  assert.equal(object.fromArtwork, true);
  const exported = decode(object);
  assert.deepEqual(fills(exported), paint);
  assert.equal(exported.replace(/\bfill="[^"]*"/g, 'fill=""'), oldSvg.replace(/\bfill="[^"]*"/g, 'fill=""'));
  assert.equal(store.get(KEY), originalStore);
  assert.equal(Object.keys(q.state.templateWork).length, 0);
  assert.equal(writes.length, 0);
});

test('current and future parts-only saves map by stable identity, without mutating saved input', () => {
  for (const svgVersion of [2, 3]) {
    const data = { templates: { police: { svgVersion, parts: { body: '#FF88CC', hub_front: '#FFD700' } } } };
    const { bridge, store, writes } = boot(data);
    const before = store.get(KEY);
    const object = bridge.getSavedPlayObject('police');
    const painted = byPart(decode(object));
    assert.equal(object.artVersion, 2);
    assert.equal(painted.body, '#FF88CC');
    assert.equal(painted.hub_front, '#FFD700');
    assert.equal(painted.window_front, '#FFF');
    assert.equal(store.get(KEY), before);
    assert.equal(writes.length, 0);
  }
});

test('blank, unknown, surplus, and corrupt saved paint do not become artworks', () => {
  for (const data of [undefined, '{bad json', null, { templates: { police: { fills: ['white', 'none', '#FFF'] } } },
    { templates: { police: { svgVersion: 2, fills: Array(13).fill('#FFF').concat('#FF4444') } } },
    { templates: { police: { fills: ['url(https://untrusted.invalid/a)', '"><script>bad</script>'] } } }]) {
    const { bridge } = boot(data);
    assert.equal(bridge.getSavedPlayObject('police'), null);
    assert.equal(bridge.getSavedPlayObject('not_a_template'), null);
  }
});

test('saved external SVG, scripts, and color attributes are ignored while valid paints survive', () => {
  const { bridge } = boot({ templates: { police: { svgVersion: 2,
    svg: '<svg onload="bad()"/>', src: 'https://untrusted.invalid/a.svg',
    parts: { body: '#44CC44', window_front: '" onload="bad()', stripe: 'url(https://untrusted.invalid/a)' },
  } } });
  const svg = decode(bridge.getSavedPlayObject('police'));
  assert.equal(byPart(svg).body, '#44CC44');
  assert.equal(byPart(svg).window_front, '#FFF');
  assert.equal(byPart(svg).stripe, '#FFF');
  assert(!svg.includes('untrusted') && !svg.includes('onload') && !svg.includes('bad()'));
});

test('current in-memory paint is snapshotted and later edits cannot change the number-game image', () => {
  const { q, bridge } = boot();
  q.state.templateWork.police_swat_suv = { svgVersion: 1, fills: ['#FF88CC'], history: [{ index: 0, prev: '#FFF' }] };
  const before = JSON.stringify(q.state.templateWork);
  const object = bridge.getSavedPlayObject('police_swat_suv');
  assert.equal(fills(decode(object))[0], '#FF88CC');
  assert.equal(JSON.stringify(q.state.templateWork), before);
  q.state.templateWork.police_swat_suv.fills[0] = '#44CC44';
  assert.equal(fills(decode(object))[0], '#FF88CC');
  assert.equal(fills(decode(bridge.getSavedPlayObject('police_swat_suv')))[0], '#44CC44');
});

test('a failed persistent write still exports the newest canonical in-memory artwork', () => {
  const { q, bridge, store } = boot({ activeTemplateId: 'police', templates: { police: { svgVersion: 2, fills: ['#FF4444'] } } }, { failWrites: true });
  q.loadWork();
  q.state.templateWork.police.fills[0] = '#8EF6D1';
  q.saveWork();
  q.state.templateWork = {};
  assert.equal(fills(decode(bridge.getSavedPlayObject('police')))[0], '#8EF6D1');
  assert.equal(JSON.parse(store.get(KEY)).templates.police.fills[0], '#FF4444');
});

test('my-art action saves once and passes only the detached painted picture to the callback', () => {
  const { q, writes } = boot();
  let selected;
  q.state.activeTemplateId = 'police';
  q.state.options = { onPlayObject: (object) => { selected = object; } };
  q.playCurrentArtwork();
  assert.equal(selected, undefined);
  assert.equal(writes.length, 0);
  q.state.templateWork.police = { svgVersion: 2, fills: ['#9944FF'], history: [] };
  q.playCurrentArtwork();
  assert.equal(selected.nameKo, '경찰차');
  assert.equal(selected.fromArtwork, true);
  assert.equal(fills(decode(selected))[0], '#9944FF');
  assert.deepEqual(writes, [KEY]);
});

test('reference stays beside a paintable original and never changes the freely colored work', () => {
  const { q, writes } = boot();
  const attrs = {};
  const img = { getAttribute: (name) => attrs[name], setAttribute: (name, value) => { attrs[name] = value; } };
  const caption = {};
  const partName = {}, partColor = {}, swatch = { style: {}, dataset: {} };
  const hint = { dataset: {}, querySelector: (selector) => selector === '.az-part-name' ? partName : partColor };
  const next = {};
  const elements = {
    '#azArtTools': {}, '#azReferenceToggle': { setAttribute(name, value) { this[name] = value; } },
    '#azFreeColoring': { setAttribute(name, value) { this[name] = value; } },
    '#azCompanion': { classList: { toggle(name, value) { this[name] = value; } } },
    '#azReference': { querySelector: (selector) => ({ img, figcaption: caption, '#azPartHint': hint, '#azPartSwatch': swatch, '#azNextPart': next })[selector] },
    '#azColoringWrap': { style: {} }, '#azPlayArtwork': {},
  };
  q.state.container = { querySelector: (selector) => elements[selector] };
  q.state.tab = 'coloring';
  q.state.options = { onPlayObject() {} };
  q.state.templateWork.police = { svgVersion: 2, fills: ['#9944FF'], history: [] };
  const before = json(q.state.templateWork);
  q.state.showReference = true;
  q.updateArtTools();
  assert.equal(elements['#azReference'].hidden, false);
  assert.equal(elements['#azColoringWrap'].style.display, 'flex');
  assert.equal(elements['#azReferenceToggle']['aria-pressed'], 'true');
  assert.equal(elements['#azFreeColoring']['aria-pressed'], 'false');
  assert.equal(elements['#azCompanion'].classList['has-reference'], true);
  assert.equal(hint.dataset.part, 'body');
  assert.equal(partName.textContent, '차체');
  assert.equal(swatch.dataset.color, '#FFF8E7');
  assert.equal(next.disabled, false);
  assert.equal(elements['#azPlayArtwork'].disabled, false);
  assert.equal(byPart(decode({ src: attrs.src })).light_red, '#FF4444');
  q.state.showReference = false;
  q.updateArtTools();
  assert.equal(elements['#azReference'].hidden, true);
  assert.equal(elements['#azColoringWrap'].style.display, 'flex');
  assert.equal(elements['#azFreeColoring']['aria-pressed'], 'true');
  assert.equal(elements['#azCompanion'].classList['has-reference'], false);
  assert.deepEqual(json(q.state.templateWork), before);
  assert.equal(writes.length, 0);
  q.state.tab = 'free';
  q.updateArtTools();
  assert.equal(elements['#azArtTools'].hidden, true);
  assert.equal(elements['#azReference'].hidden, true);
});

const failures = checks.filter((check) => check.status !== 'PASS');
console.log(JSON.stringify({
  suite: 'Art reference and number-play bridge',
  sourceSha256: crypto.createHash('sha256').update(source).digest('hex'),
  status: failures.length ? 'FAIL' : 'PASS', checks,
  limits: ['Production logic in a Node VM; real SVG pixels, mobile touch targets, and navigation are verified separately.'],
}, null, 2));
if (failures.length) process.exitCode = 1;
