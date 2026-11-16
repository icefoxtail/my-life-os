/* Current Hangul content rules and popup ownership; not a browser/audio test. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourcePath = process.argv[2] || path.join(__dirname, '../games/hangul-playmat-3d.html');
const html = fs.readFileSync(sourcePath, 'utf8');
for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  if (match[1].trim()) new vm.Script(match[1], {filename: sourcePath});
}
function between(start, end) {
  const a = html.indexOf(start);
  const b = html.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, `Missing source section: ${start}`);
  return html.slice(a, b);
}
const data = {};
vm.runInNewContext(between('const CHO_LIST = [', '/* ============================================================================\n * 2.') +
  '\nthis.api = {CHO_LIST,JUNG_LIST,WORD_DICT,SHELF_WORDS,composeHangul,getSyllableMeta};', data);
const api = data.api;
let checks = 0;

// Independently derive the reachable set from standard Unicode jamo indices.
const consonants = [...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ'];
const consonantIndices = [0,2,3,5,6,7,9,11,12,14,15,16,17,18];
const vowels = [...'ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ'];
const vowelIndices = [0,2,4,6,8,12,13,17,18,20];
const recipes = new Map();
consonants.forEach((cho,i) => vowels.forEach((jung,j) => {
  const char = String.fromCodePoint(0xac00 + consonantIndices[i]*588 + vowelIndices[j]*28);
  assert.equal(api.composeHangul(cho,jung), char);
  recipes.set(char, {cho,jung});
  checks++;
}));
assert.equal(recipes.size, 140);
assert.equal(Object.keys(api.SHELF_WORDS).length, 16, 'Keep the full reachable bonus collection');
const unreachable = Object.keys(api.SHELF_WORDS).filter(word => [...word].some(char => !recipes.has(char)));
assert.deepEqual(unreachable, [], 'Every advertised bonus must use available syllables');
for (const word of Object.keys(api.SHELF_WORDS)) {
  assert.ok(word.length >= 2 && word.length <= 3, `Shelf recognizer supports 2–3 syllables: ${word}`);
  assert.equal([...word].map(char => {
    const pair = recipes.get(char);
    return api.composeHangul(pair.cho,pair.jung);
  }).join(''), word);
  checks++;
}

// Every current 3D model has an independent semantic allowlist. An unrelated
// shape must never be presented as the named word merely because it exists.
const modelWords = {
  bag:['가방'], whale:['고래'], cloud:['구름'], train:['기차'],
  butterfly:['나비'], banana:['바나나'], airplane:['비행기'], apple:['사과'],
  duck:['아기오리','오리'], umbrella:['우산'], car:['자동차','차'], hat:['모자']
};
for (const [char, meta] of Object.entries(api.WORD_DICT)) {
  assert.ok(recipes.has(char), `Dictionary key is playable: ${char}`);
  assert.ok(meta.word.startsWith(char), `Representative word begins with ${char}: ${meta.word}`);
  if (meta.toy !== 'picture') assert.ok(modelWords[meta.toy]?.includes(meta.word), `${meta.word} must not use ${meta.toy}`);
  checks++;
}
for (const [word, meta] of Object.entries(api.SHELF_WORDS)) {
  if (meta.toy !== 'picture') assert.ok(modelWords[meta.toy]?.includes(word), `${word} must not use ${meta.toy}`);
  checks++;
}
const expectedPictures = {'로':'🤖','토':'🐰','호':'🐯','버':'🚌','포':'🍇','피':'🎹'};
for (const [char, emoji] of Object.entries(expectedPictures)) {
  assert.equal(api.WORD_DICT[char].toy,'picture');
  assert.equal(api.WORD_DICT[char].emoji,emoji);
  checks++;
}
assert.equal(api.WORD_DICT['도'].emoji,'', 'A chestnut emoji is not an acorn');
for (const [char, pair] of recipes) {
  const meta = api.getSyllableMeta(pair.cho,pair.jung);
  assert.equal(meta.char,char);
  if (!api.WORD_DICT[char]) {
    assert.equal(meta.toy,'picture');
    assert.equal(meta.word,`${char} 블록`);
    assert.equal(meta.emoji,'', 'An unnamed syllable keeps its own letter, not an arbitrary animal');
  }
  checks++;
}

// Execute the real shelf recognizer, including adjacency and duplicate guards.
const popups = [];
const shelfContext = {
  SHELF_WORDS:api.SHELF_WORDS, state:{blocks:[],lastBonusWord:''},
  triggerSquash(){}, burstParticles(){}, sfx(){}, say(){}, toast(){},
  spawnMiniToyPopup(block,meta){popups.push({block,meta});}
};
vm.runInNewContext(between('function checkShelfBonusWords(){','function triggerSquash(') +
  '\nthis.check=checkShelfBonusWords;', shelfContext);
for (const word of Object.keys(api.SHELF_WORDS)) {
  popups.length=0;shelfContext.state.lastBonusWord='';
  shelfContext.state.blocks=[...word].map((char,i)=>({role:'syllable',char,onShelf:true,shelfIdx:i}));
  shelfContext.check();
  assert.equal(popups.length,1, `Recognize reachable ${word}`);
  assert.equal(popups[0].meta.word,word);
  assert.equal(popups[0].meta.toy,api.SHELF_WORDS[word].toy);
  shelfContext.check();assert.equal(popups.length,1,'Do not repeat the same bonus');
  checks++;
}
popups.length=0;shelfContext.state.lastBonusWord='';
shelfContext.state.blocks=[{role:'syllable',char:'나',onShelf:true,shelfIdx:0},{role:'syllable',char:'비',onShelf:true,shelfIdx:2}];
shelfContext.check();assert.equal(popups.length,0,'Separated shelf letters are not a word');checks++;

// Exercise the actual canvas drawing + Sprite factory with owned resource spies.
// These checks verify routing/labels/cleanup, not real pixel appearance.
const canvases = [];
class Texture {
  constructor(canvas){this.canvas=canvas;this.disposed=0;}
  dispose(){this.disposed++;}
}
class Material {
  constructor(props){Object.assign(this,props);this.disposed=0;}
  dispose(){this.disposed++;}
}
class Sprite {
  constructor(material){this.material=material;this.scale={set(){}};}
}
class Group {
  constructor(){this.children=[];this.userData={};}
  add(child){this.children.push(child);}
}
const pictureContext = {
  THREE:{CanvasTexture:Texture,SpriteMaterial:Material,Sprite,Group,sRGBEncoding:3001},
  document:{createElement(tag){
    assert.equal(tag,'canvas');
    const calls=[];
    const ctx=new Proxy({}, {get(target,key){
      if(key in target)return target[key];
      return (...args)=>calls.push({method:key,args});
    }});
    const canvas={calls,getContext(kind){assert.equal(kind,'2d');return ctx;}};
    canvases.push(canvas);return canvas;
  }},
  toysGroup:{remove(){}}
};
vm.runInNewContext(between('function drawWordIllustration(', 'function buildMiniToy3D(') +
  '\nthis.build=buildWordPictureToy;this.remove=removeMiniToy;', pictureContext);
const pictureEntries = [
  ...Object.entries(api.WORD_DICT).filter(([,meta])=>meta.toy==='picture').map(([char,meta])=>({char,...meta})),
  ...Object.entries(api.SHELF_WORDS).filter(([,meta])=>meta.toy==='picture').map(([word,meta])=>({word,...meta})),
  api.getSyllableMeta('ㄱ','ㅑ')
];
for (const meta of pictureEntries) {
  const mesh=pictureContext.build(meta), canvas=canvases[canvases.length-1];
  assert.equal(mesh.userData.word,meta.word);
  assert.ok(canvas.calls.some(call=>call.method==='fillText' && call.args[0]===meta.word),'Every picture carries its own word');
  if(meta.emoji)assert.ok(canvas.calls.some(call=>call.method==='fillText' && call.args[0]===meta.emoji),'Draw the correct symbol');
  else if(api.WORD_DICT[meta.char] || Object.hasOwn(api.SHELF_WORDS,meta.word)) {
    assert.ok(canvas.calls.filter(call=>call.method==='fill' || call.method==='fillRect').length >= 3,`Draw an actual object for ${meta.word}`);
  } else assert.ok(canvas.calls.some(call=>call.method==='fillText' && call.args[0]===meta.char),'Unknown syllable displays itself');
  const material=mesh.userData.wordPicture.material, texture=material.map;
  pictureContext.remove(mesh);pictureContext.remove(mesh);
  assert.equal(material.disposed,1);assert.equal(texture.disposed,1,'Dispose each popup-owned texture once');
  checks++;
}
// New feedback must not be buried under an earlier picture. A shelf bonus
// replaces preceding syllable popups while retaining the normal lifetime.
const removed=[];
const popupContext={
  state:{toys:[]},uid:0,toysGroup:{add(){}},
  buildMiniToy3D(toy,meta){return {word:meta.word,userData:toy==='picture'?{wordPicture:{}}:{},position:{set(){}},scale:{setScalar(){}}};},
  removeMiniToy(mesh){removed.push(mesh.word);}
};
vm.runInNewContext(between('function spawnMiniToyPopup(', '// 진열대에 나란히')+'\nthis.spawn=spawnMiniToyPopup;', popupContext);
const anchor={x:0,y:0,z:0};
popupContext.spawn(anchor,{word:'로봇',toy:'picture'});
popupContext.spawn(anchor,{word:'도토리',toy:'picture'});
assert.deepEqual(removed,['로봇']);assert.equal(popupContext.state.toys.length,1);checks++;
popupContext.spawn(anchor,{word:'사과',toy:'apple'});
popupContext.spawn(anchor,{word:'호랑이',toy:'picture'});
assert.deepEqual(removed,['로봇','도토리']);assert.equal(popupContext.state.toys.length,2);checks++;
popupContext.spawn(anchor,{word:'두부',toy:'picture'},true);
assert.deepEqual(removed,['로봇','도토리','사과','호랑이']);
assert.equal(popupContext.state.toys.length,1);assert.equal(popupContext.state.toys[0].word,'두부');checks++;
assert.equal(popupContext.state.toys[0].isBonus,true);assert.equal(popupContext.state.toys[0].maxAge,5.5);checks++;

// Exercise the exact browser comparison function independently of a browser.
// The old 2D reference can reject an intact glyph: a half-covered sRGB text edge
// and the corresponding linear-light filtered edge have different RGB values.
// Matching the GPU reference must accept that edge and still reject occlusion.
const browserQa=fs.readFileSync(path.join(__dirname,'qa-creator-hangul-browser.py'),'utf8');
const comparatorSource=browserQa.match(/COMPARE_PIXELS = """([\s\S]*?)"""/)[1];
const compare=vm.runInNewContext('('+comparatorSource+')');
const pixelWidth=80,pixelHeight=100,bounds={x:0,y:0,width:pixelWidth,height:pixelHeight};
const paper=[255,253,245,255],ink=[34,52,84,255];
const linear=c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4;
const srgb=c=>255*(c<=.0031308?12.92*c:1.055*c**(1/2.4)-.055);
const gpuEdge=ink.map((c,i)=>i===3?255:Math.round(srgb((linear(c/255)+linear(paper[i]/255))/2)));
const canvasEdge=ink.map((c,i)=>i===3?255:Math.round((c+paper[i])/2));
const pixels=new Uint8ClampedArray(pixelWidth*pixelHeight*4);
function paint(array,x,y,width,height,color){
  for(let j=y;j<y+height;j++)for(let i=x;i<x+width;i++)array.set(color,(j*pixelWidth+i)*4);
}
paint(pixels,0,0,pixelWidth,pixelHeight,paper);
paint(pixels,20,20,40,40,[166,101,49,255]);
for(const x of [24,42]){
  paint(pixels,x,82,2,12,gpuEdge);paint(pixels,x+2,82,3,12,ink);paint(pixels,x+5,82,2,12,gpuEdge);
}
const canvasReference=new Uint8ClampedArray(pixels);
for(const x of [24,42]){paint(canvasReference,x,82,2,12,canvasEdge);paint(canvasReference,x+5,82,2,12,canvasEdge);}
const wrongPipeline=compare(pixels,canvasReference,pixelWidth,pixelHeight,bounds);
assert.ok(wrongPipeline.labelMatch<.88,'Different raster pipelines can reject an intact label');checks++;
const intact=compare(pixels,pixels,pixelWidth,pixelHeight,bounds);
assert.equal(intact.pictureMatch,1);assert.equal(intact.labelMatch,1);checks++;
const hiddenLabel=new Uint8ClampedArray(pixels);paint(hiddenLabel,40,78,40,22,paper);
const labelResult=compare(hiddenLabel,pixels,pixelWidth,pixelHeight,bounds);
assert.ok(labelResult.labelMatch<.88);assert.equal(labelResult.pictureMatch,1);checks++;
const hiddenPicture=new Uint8ClampedArray(pixels);paint(hiddenPicture,20,8,40,66,paper);
const pictureResult=compare(hiddenPicture,pixels,pixelWidth,pixelHeight,bounds);
assert.ok(pictureResult.pictureMatch<.90);assert.equal(pictureResult.labelMatch,1);checks++;
console.log(`PASS ${checks} Hangul rule scenarios: 140 syllables, 16 reachable bonuses, semantic pictures, shelf behavior, popup cleanup, raster-reference mismatch and real occlusion rejection. Browser/audio NOT_RUN.`);
