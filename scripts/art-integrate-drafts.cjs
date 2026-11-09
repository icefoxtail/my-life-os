/* Integrate .art-drafts/<id>.js into js/games/art-zone.js (and voice-labels for new ids).
   Usage: node scripts/art-integrate-drafts.cjs id1,id2,...
   - Existing template, redesign: version+1, parts, new svg, current svg copied verbatim to legacy[oldVersion].
   - Existing template, keep: adds data-part attributes only (geometry and order must be identical).
   - New template: appended to COLORING_TEMPLATES and js/voice-labels.js templates. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const artPath = path.join(root, 'js/games/art-zone.js');
const labelsPath = path.join(root, 'js/voice-labels.js');
let art = fs.readFileSync(artPath, 'utf8');
let labels = fs.readFileSync(labelsPath, 'utf8');
const ids = (process.argv[2] || '').split(',').filter(Boolean);
if (!ids.length) throw new Error('usage: art-integrate-drafts.cjs id1,id2');

const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const partsSrc = (parts, ind) => `{\n${Object.entries(parts).map(([k, m]) => `${ind}  ${k}: { ko: ${q(m.ko)}, en: ${q(m.en)}, color: ${q(m.color)} },`).join('\n')}\n${ind}}`;
const strip = (svg) => {
  const s = String(svg).trim();
  if (s.includes('`') || s.includes('${')) throw new Error('svg must not contain backticks or ${');
  return s;
};

for (const id of ids) {
  const ctx = { window: { ART_DRAFTS: [] } };
  vm.runInNewContext(fs.readFileSync(path.join(root, '.art-drafts', `${id}.js`), 'utf8'), ctx);
  const d = ctx.window.ART_DRAFTS.find((x) => x.id === id);
  if (!d) throw new Error(`draft ${id} missing`);
  const svg = strip(d.svg);
  const at = art.indexOf(`      id: '${id}',`);
  if (at >= 0) {
    const objEnd = art.indexOf('\n    },', at);
    const block = art.slice(at, objEnd);
    if (/\n      version:/.test(block)) throw new Error(`${id} already versioned; extend this script for v3+`);
    const s0 = art.indexOf('      svg: `', at);
    const s1 = art.indexOf('`,', s0 + 12);
    if (s0 < 0 || s0 > objEnd || s1 < 0) throw new Error(`cannot find svg of ${id}`);
    const oldSvg = art.slice(s0 + 12, s1);
    let replacement;
    if (d.mode === 'keep') {
      const norm = (x) => x.replace(/\s+data-part="[^"]*"/g, '').replace(/\s+/g, ' ').trim();
      if (norm(oldSvg) !== norm(svg)) throw new Error(`${id}: keep draft changes geometry`);
      replacement = `      parts: ${partsSrc(d.parts, '      ')},\n      svg: \`${svg}\``;
    } else {
      replacement = `      version: 2,\n      parts: ${partsSrc(d.parts, '      ')},\n      svg: \`${svg}\`,\n      legacy: {\n        1: \`${oldSvg}\`,\n      }`;
    }
    art = art.slice(0, s0) + replacement + art.slice(s1 + 1);
    console.log(`${id}: ${d.mode === 'keep' ? 'keep (+data-part)' : 'redesign v2 (+legacy[1])'}`);
  } else {
    if (!d.nameEn) throw new Error(`${id}: new template needs nameEn`);
    const end = art.indexOf('  ];\n\n  const state =');
    if (end < 0) throw new Error('templates end marker missing');
    const obj = `    {\n      id: ${q(id)},\n      name: ${q(d.name)},\n      emoji: ${q(d.emoji)},\n      version: 1,\n      parts: ${partsSrc(d.parts, '      ')},\n      svg: \`${svg}\`,\n    },\n`;
    art = art.slice(0, end) + obj + art.slice(end);
    const lEnd = labels.indexOf('];', labels.indexOf('const templates = ['));
    const before = labels.slice(0, lEnd).replace(/\s*$/, '');
    labels = `${before},\n  {\n    "id": ${JSON.stringify(id)},\n    "ko": ${JSON.stringify(d.name)},\n    "en": ${JSON.stringify(d.nameEn)}\n  }\n${labels.slice(lEnd)}`;
    console.log(`${id}: new v1`);
  }
}
fs.writeFileSync(artPath, art);
fs.writeFileSync(labelsPath, labels);
