/* Late-bound, read-only artwork choices through the real catalog and art bridge. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const files = ['js/play-objects.js', 'js/games/art-zone.js'];
const sources = Object.fromEntries(files.map(file => [file, fs.readFileSync(path.join(root, file), 'utf8')]));
const KEY = 'sihyeon-art-work-v1';
const checks = [];
const plain = value => JSON.parse(JSON.stringify(value));
const svg = object => decodeURIComponent(object.src.slice(object.src.indexOf(',') + 1));
const regionTags = object => [...svg(object).matchAll(/<[a-z]+\b[^>]*\bclass="(?:[^"]*\s)?fillable(?:\s[^"]*)?"[^>]*>/gi)].map(match => match[0]);
const fills = object => regionTags(object).map(tag => tag.match(/\bfill="([^"]*)"/)[1]);
const parts = object => Object.fromEntries(regionTags(object).map(tag => [tag.match(/\bdata-part="([^"]*)"/)?.[1], tag.match(/\bfill="([^"]*)"/)[1]]));
function test(name, run) {
  try { checks.push({ name, status: 'PASS', detail: run() ?? true }); }
  catch (error) { checks.push({ name, status: 'FAIL', error: error.stack }); }
}
function boot(saved) {
  const store = new Map(saved === undefined ? [] : [[KEY, typeof saved === 'string' ? saved : JSON.stringify(saved)]]);
  const writes = [];
  const context = { window: { SihyeonGames: {} }, document: {}, navigator: {},
    localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => { writes.push(key); store.set(key, String(value)); }, removeItem: key => { writes.push(key); store.delete(key); } },
    setTimeout: () => 0, clearTimeout() {} };
  vm.createContext(context);
  vm.runInContext(sources['js/play-objects.js'], context, { timeout: 1000 });
  return { api: context.window.SihyeonPlayObjects, store, writes, context,
    loadArt() { vm.runInContext(sources['js/games/art-zone.js'], context, { timeout: 1000 }); } };
}
function verifyRef(result, requested, actual, missing) {
  assert(result && result.object);
  assert.deepEqual(plain(result.requested), requested);
  assert.deepEqual(plain(result.actual), actual);
  assert.equal(result.missingArtwork, missing);
  assert.equal(result.object.id, actual.id);
  assert.equal(result.object.fromArtwork === true, actual.sourceKind === 'artwork');
}

test('the existing twelve pictures work before the art bridge is loaded', () => {
  const { api, writes } = boot();
  assert.equal(typeof api.listChoices, 'function'); assert.equal(typeof api.resolveChoice, 'function');
  const old = api.list(), choices = api.listChoices({ sourceKind: 'recommended' });
  assert.equal(old.length, 12); assert.equal(choices.length, 12);
  assert.deepEqual(plain(api.listChoices({ sourceKind: 'artwork' })), []);
  for (const object of old) {
    const result = api.resolveChoice({ id: object.id });
    verifyRef(result, { id: object.id, sourceKind: 'recommended' }, { id: object.id, sourceKind: 'recommended' }, false);
    assert.equal(result.object.src, object.src);
    assert.equal(api.get(object.id).src, object.src);
  }
  assert.equal(api.resolveChoice({ id: 'not_a_picture', sourceKind: 'recommended' }), null);
  assert.equal(writes.length, 0);
  return { originalPictures: old.length, personalPictures: 0 };
});

test('late-loaded art bridge adds all 28 examples without changing existing list/get callers', () => {
  const fixture = boot({ templates: { police: { svgVersion: 2, parts: { light_red: '#9944FF' } } } });
  const first = fixture.api.list().map(object => [object.id, object.src]);
  assert.equal(fixture.api.listChoices({ sourceKind: 'artwork' }).length, 0);
  fixture.loadArt();
  const recommended = fixture.api.listChoices({ sourceKind: 'recommended' }), own = fixture.api.listChoices({ sourceKind: 'artwork' });
  assert.equal(recommended.length, 40); assert.equal(fixture.api.list().length, 40);
  assert.deepEqual(plain(fixture.api.list().slice(0, 12).map(object => [object.id, object.src])), plain(first));
  assert.equal(new Set(recommended.map(object => object.id)).size, 40);
  assert(recommended.every(object => object.sourceKind === 'recommended'));
  assert.equal(own.length, 1); assert.equal(own[0].id, 'art:police'); assert.equal(own[0].sourceKind, 'artwork');
  assert.equal(fixture.writes.length, 0);
  return { recommended: 40, artwork: 1, loadingOrder: 'catalog before art bridge' };
});

test('the same art ID distinguishes the child purple light from the recommended red light', () => {
  const fixture = boot({ templates: { police: { svgVersion: 2, parts: { light_red: '#9944FF' } } } }); fixture.loadArt();
  const before = fixture.store.get(KEY);
  const recommended = fixture.api.resolveChoice({ id: 'art:police', sourceKind: 'recommended' });
  const own = fixture.api.resolveChoice({ id: 'art:police', sourceKind: 'artwork' });
  verifyRef(recommended, { id: 'art:police', sourceKind: 'recommended' }, { id: 'art:police', sourceKind: 'recommended' }, false);
  verifyRef(own, { id: 'art:police', sourceKind: 'artwork' }, { id: 'art:police', sourceKind: 'artwork' }, false);
  assert.equal(parts(recommended.object).light_red, '#FF4444');
  assert.equal(parts(own.object).light_red, '#9944FF');
  assert.equal(parts(fixture.api.get('art:police')).light_red, '#FF4444', 'Legacy get keeps recommended semantics');
  assert.equal(fixture.store.get(KEY), before); assert.equal(fixture.writes.length, 0);
  return { sameID: own.object.id, recommendedColor: '#FF4444', artworkColor: '#9944FF', artVersion: own.object.artVersion };
});

test('an absent artwork resolves to its same example while preserving the requested source', () => {
  for (const data of [undefined, '{bad json', null, { templates: {} }, { templates: { police: { svgVersion: 2, parts: { light_red: '#FFF' } } } }]) {
    const fixture = boot(data); fixture.loadArt();
    const original = fixture.store.get(KEY);
    const result = fixture.api.resolveChoice({ id: 'art:police', sourceKind: 'artwork' });
    verifyRef(result, { id: 'art:police', sourceKind: 'artwork' }, { id: 'art:police', sourceKind: 'recommended' }, true);
    assert.equal(parts(result.object).light_red, '#FF4444');
    assert.equal(fixture.store.get(KEY), original); assert.equal(fixture.writes.length, 0);
  }
  return { missingOrBlankFixtures: 5, countAndRequestedSourceUntouched: true };
});

test('new resolution observes edits/deletion while already returned pictures remain snapshots', () => {
  const fixture = boot({ templates: { police: { svgVersion: 2, parts: { light_red: '#9944FF' } } } }); fixture.loadArt();
  const first = fixture.api.resolveChoice({ id: 'art:police', sourceKind: 'artwork' });
  const firstSrc = first.object.src;
  fixture.store.set(KEY, JSON.stringify({ templates: { police: { svgVersion: 2, parts: { light_red: '#44CC44' } } } }));
  const changed = fixture.api.resolveChoice({ id: 'art:police', sourceKind: 'artwork' });
  assert.equal(parts(changed.object).light_red, '#44CC44');
  assert.equal(first.object.src, firstSrc); assert.equal(parts(first.object).light_red, '#9944FF');
  fixture.store.delete(KEY);
  const missing = fixture.api.resolveChoice({ id: 'art:police', sourceKind: 'artwork' });
  assert.equal(missing.missingArtwork, true); assert.equal(missing.actual.sourceKind, 'recommended');
  assert.equal(first.object.src, firstSrc); assert.equal(parts(changed.object).light_red, '#44CC44');
  assert.equal(fixture.writes.length, 0);
  return { liveReads: 3, priorSnapshotsPreserved: true };
});

test('pre-versioning saved artwork retains all fifteen original regions and fills', () => {
  const legacy = Array.from({ length: 15 }, (_, i) => i % 2 ? '#FFF' : '#9944FF');
  const fixture = boot({ activeTemplateId: 'police', templates: { police: { fills: legacy, completed: false } } }); fixture.loadArt();
  const before = fixture.store.get(KEY);
  const result = fixture.api.resolveChoice({ id: 'art:police', sourceKind: 'artwork' });
  verifyRef(result, { id: 'art:police', sourceKind: 'artwork' }, { id: 'art:police', sourceKind: 'artwork' }, false);
  assert.equal(result.object.artVersion, 1); assert.deepEqual(fills(result.object), legacy);
  const example = fixture.api.resolveChoice({ id: 'art:police', sourceKind: 'recommended' });
  assert.equal(example.object.artVersion, 2); assert.notEqual(svg(result.object), svg(example.object));
  assert.equal(fixture.store.get(KEY), before); assert.equal(fixture.writes.length, 0);
  return { savedVersion: 1, originalRegions: 15, exampleVersion: 2 };
});

test('unknown IDs and forged saved SVG/paint cannot replace shipped artwork', () => {
  const fixture = boot({ templates: { police: { svgVersion: 2, src: 'https://invalid.example/remote.svg',
    svg: '<svg onload="bad()"><script>bad()</script></svg>',
    parts: { body: '#44CC44', light_red: '" onload="bad()', stripe: 'url(https://invalid.example/paint)' } } } }); fixture.loadArt();
  for (const id of ['not_a_picture', 'art:missing', '__proto__', 'constructor', '<img onerror=bad()>']) {
    for (const sourceKind of ['recommended', 'artwork']) assert.equal(fixture.api.resolveChoice({ id, sourceKind }), null);
  }
  const own = fixture.api.resolveChoice({ id: 'art:police', sourceKind: 'artwork' });
  assert.equal(parts(own.object).body, '#44CC44');
  assert.equal(parts(own.object).light_red, '#FFF');
  assert.equal(parts(own.object).stripe, '#FFF');
  assert(!/<(?:script|foreignObject|image|use)\b|\bon[a-z]+\s*=|\b(?:href|xlink:href)\s*=/i.test(svg(own.object)));
  assert(!svg(own.object).includes('invalid.example'));
  for (const src of ['javascript:bad()', 'https://invalid.example/p.png', 'data:text/html,<svg/>', '//invalid.example/p.png']) {
    assert.equal(fixture.api.isValid({ id: 'fake', nameKo: '그림', src, unitKo: '개' }), false);
  }
  const markup = fixture.api.picture({ src: './assets/a.svg" onerror="bad()', emoji: '<img onerror=bad()>' }, '"><script>bad()</script>');
  assert(!markup.includes('<script>') && !markup.includes('<img onerror=') && !markup.includes('src="./assets/a.svg" onerror='));
  assert.equal(fixture.writes.length, 0);
  return { unknownIDs: 10, rejectedRemoteSources: 4, realSavedPaintSanitized: true, markupEscaped: true };
});

test('caller mutations do not contaminate future choices or the canonical examples', () => {
  const fixture = boot({ templates: { police: { svgVersion: 2, parts: { body: '#9944FF' } } } }); fixture.loadArt();
  const original = fixture.api.resolveChoice({ id: 'art:police', sourceKind: 'artwork' }).object.src;
  const choices = fixture.api.listChoices({ sourceKind: 'artwork' });
  try { choices[0].src = 'https://invalid.example/changed.svg'; } catch (error) { assert(error instanceof TypeError); }
  choices.length = 0;
  assert.equal(fixture.api.resolveChoice({ id: 'art:police', sourceKind: 'artwork' }).object.src, original);
  assert.equal(fixture.api.listChoices({ sourceKind: 'artwork' }).length, 1);
  assert.equal(fixture.api.list().length, 40);
  assert.equal(fixture.writes.length, 0);
});

const failed = checks.filter(check => check.status !== 'PASS');
console.log(JSON.stringify({ suite: 'Recommended and personal artwork choice contract', status: failed.length ? 'FAIL' : 'PASS',
  passed: checks.length - failed.length, failed: failed.length, checks,
  sources: Object.fromEntries(files.map(file => [file, crypto.createHash('sha256').update(sources[file]).digest('hex')])),
  limitations: ['Pure production catalog/bridge calls in a VM; browser rendering and audio are separate checks'] }, null, 2));
process.exitCode = failed.length ? 1 : 0;
