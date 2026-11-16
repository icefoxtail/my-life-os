/* Source-bound geometry and DOM lifecycle checks; visual/browser QA is separate. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/vehicle-display.js'), 'utf8');
const bounds = JSON.parse(source.match(/const bounds = (.*);\n/)[1]);
assert.deepEqual(bounds, JSON.parse(fs.readFileSync(path.join(root, 'assets/vehicles/display_bounds.json'), 'utf8')));

class Element {
  constructor(tag) { this.tagName = tag; this.attributes = {}; this.children = []; this.style = {cssText: ''}; this.alt = ''; this.listeners = []; }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name] ?? null; }
  appendChild(child) { child.remove(); this.children.push(child); child.parentElement = this; }
  before(child) { const parent = this.parentElement, index = parent.children.indexOf(this); child.remove(); parent.children.splice(index, 0, child); child.parentElement = parent; }
  remove() { if (this.parentElement) { const parent = this.parentElement; parent.children.splice(parent.children.indexOf(this), 1); this.parentElement = null; } }
  addEventListener(type, fn, capture) { this.listeners.push({type, fn, capture}); }
  removeEventListener(type, fn, capture) { this.listeners = this.listeners.filter(item => !(item.type === type && item.fn === fn && item.capture === capture)); }
  error() { this.listeners.filter(item => item.type === 'error').sort((a, b) => Number(!!b.capture) - Number(!!a.capture)).forEach(item => item.fn()); }
}

const window = {};
vm.runInNewContext(source, {window, document: {createElementNS: (namespace, tag) => new Element(tag)}});
const api = window.SihyeonVehicleDisplay;
const files = [];
for (const filename of ['vehicles_manifest.json', 'fire_special_manifest.json']) {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'assets/vehicles', filename), 'utf8'));
  files.push(...(Array.isArray(data) ? data : data.vehicles).map(item => item.file.replace(/^\.\//, '')));
}
assert.equal(new Set(files).size, 138, 'all current manifest sources have measured geometry');
assert.deepEqual(new Set(Object.keys(bounds).map(key => 'assets/vehicles/' + key)), new Set(files));
const clean = Object.entries(bounds).filter(([, item]) => item.clean);
assert.equal(clean.length, 39, 'geometry does not change the existing default random-counting pool');
let scenarios = 0;
for (const [name, b] of Object.entries(bounds)) {
  const imageBytes = fs.readFileSync(path.join(root, 'assets/vehicles', name));
  assert.equal(crypto.createHash('sha256').update(imageBytes).digest('hex'), b.sourceSha256, 'geometry binds to the current image: ' + name);
  const parent = new Element('button'), image = new Element('img');
  image.setAttribute('src', './assets/vehicles/' + name); parent.appendChild(image);
  const frame = api.apply(image);
  assert.equal(frame.tagName, 'svg');
  assert.equal(frame.getAttribute('preserveAspectRatio'), 'xMidYMax meet');
  const [x, y, w, h] = frame.getAttribute('viewBox').split(' ').map(Number);
  assert.ok(w > 0 && h > 0 && x < b.box[0] && y < b.box[1] && x + w > b.box[2] && y + h > b.box[3], 'safe margin surrounds each measured edge');
  assert.equal(image.parentElement.getAttribute('width'), String(b.width));
  assert.equal(image.parentElement.getAttribute('height'), String(b.height));
  assert.equal(api.isClean(image.getAttribute('src')), b.clean, 'display fitting does not grant selection eligibility');
  for (const [cellWidth, cellHeight] of [[320, 260], [180, 140], [110, 86], [75, 50], [60, 120], [280, 72]]) {
    const vw = cellWidth * .9, vh = cellHeight * .88;
    const scale = Math.min(vw / w, vh / h), rw = w * scale, rh = h * scale;
    assert.ok(rw <= vw + 1e-8 && rh <= vh + 1e-8);
    assert.ok(Math.abs(rw / rh - w / h) < 1e-10, 'one scale preserves the visible aspect ratio');
    assert.ok((vw - rw) / 2 >= -1e-8 && vh - rh >= -1e-8, 'horizontal centering and bottom alignment fit');
    scenarios++;
  }
}

const parent = new Element('button'), image = new Element('img');
image.style.cssText = 'color:red;'; parent.appendChild(image);
image.setAttribute('src', './assets/vehicles/transport/rocket.png');
const first = api.apply(image);
image.setAttribute('src', './assets/vehicles/transport/car.png');
assert.equal(api.apply(image), first, 'a source replacement reuses one frame');
assert.equal(parent.children.length, 1);
assert.equal(first.getAttribute('viewBox'), api.geometry(image.getAttribute('src')).viewBox.join(' '));
api.reset(image);
assert.equal(parent.children[0], image); assert.equal(parent.children.length, 1);
assert.equal(image.style.cssText, 'color:red;');
assert.equal(image.listeners.length, 0, 'reset also removes its capture listener');
image.setAttribute('src', './assets/vehicles/transport/car.png?v=2');
assert.equal(api.isClean(image.getAttribute('src')), true);
api.apply(image); image.setAttribute('src', './unknown.png'); assert.equal(api.apply(image), null);
assert.equal(parent.children[0], image, 'unknown sources keep ordinary contain layout');
image.setAttribute('src', './assets/vehicles/transport/car.png'); api.apply(image);
let fallbackRestored = false;
image.addEventListener('error', () => { fallbackRestored = image.parentElement === parent; }, false);
image.error();
assert.equal(fallbackRestored, true, 'capture restores sibling DOM before the game fallback');
assert.equal(parent.children[0], image);
assert.equal(api.apply(null), null);
assert.equal(api.geometry('./unknown.png'), null);
console.log('PASS ' + scenarios + ' uniform-scale layouts for all 138 current sources; exact image hashes, clean39 preserved, margin/baseline, replacement, error fallback and cleanup.');
