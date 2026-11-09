/* Canonical label QA: 15 art templates, 16 swatches, 129 vehicles, 6 menu zones.
 * Also validates mapped file existence; it CANNOT certify the spoken contents of MP3.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const file=p=>fs.readFileSync(path.join(root,p),'utf8');
let language='ko',spoken=[],audioSources=[];
const synth={
  cancel(){},
  speak(utterance){
    spoken.push({text:utterance.text,lang:utterance.lang});
    queueMicrotask(()=>utterance.onend?.());
  },
  getVoices(){return [{name:'English',lang:'en-US'},{name:'Korean',lang:'ko-KR'}];}
};
class Utterance {constructor(text){this.text=text;}}
class Audio {constructor(src){audioSources.push(src);this.src=src;}play(){return Promise.resolve();}pause(){}removeAttribute(){}load(){}}
const window={
  SihyeonPlaySettings:{getLanguage:()=>language},speechSynthesis:synth,
  addEventListener(){},removeEventListener(){}
};
const context={window,SpeechSynthesisUtterance:Utterance,Audio,console,
  fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve({voices:{}})})};
for(const script of ['js/voice-labels.js','js/english-listening.js','js/voice-engine.js'])
  vm.runInNewContext(file(script),context,{filename:script});
const lex=window.SihyeonVoiceLabels;
assert(lex);
const vehicleManifest=JSON.parse(file('assets/vehicles/vehicles_manifest.json'));
assert.equal(vehicleManifest.vehicles.length,129);
assert.equal(lex.vehicles.length,vehicleManifest.vehicles.length);
for(const item of vehicleManifest.vehicles){
  const exact=lex.entry('vehicle',item.id);
  assert(exact,'Missing vehicle ID '+item.id);
  assert.equal(exact.ko,item.name_ko,'Displayed KO must equal spoken KO for '+item.id);
  assert(/^[a-zA-Z0-9 .'-]+$/.test(exact.en),'English must be explicit for '+item.id);
  assert.notEqual(exact.en,'vehicle');
}
const artSource=file('js/games/art-zone.js');
const colorsSource=artSource.split('const COLORS = [')[1].split('];')[0];
const uiColors=[...colorsSource.matchAll(/\{\s*c:\s*'([^']+)',\s*n:\s*'([^']+)'\s*\}/g)];
assert.equal(uiColors.length,16);
for(const match of uiColors){
  const record=lex.entry('color',match[1]);
  assert(record,'Unmapped swatch '+match[1]);
  assert.equal(record.ko,match[2], 'Swatch text and Korean voice mismatch');
  assert(record.en,'Missing English swatch '+match[1]);
}
const templates=artSource.split('const COLORING_TEMPLATES = [')[1].split('];\n\n  const state =')[0];
assert(templates,'Failed to locate current art templates');
const ids=[...templates.matchAll(/^\s+id:\s*'([^']+)'/gm)].map(x=>x[1]);
assert.equal(ids.length,15,'Expected exactly the active 15 artwork choices');
for(const id of ids){
  const template=lex.entry('template',id);
  assert(template, 'Missing art template '+id);
  assert(template.ko&&template.en,'Untranslated art template '+id);
  const pattern=new RegExp("id: '"+id+"'[\\s\\S]{0,80}name: '([^']+)'");
  const found=templates.match(pattern);
  assert(found,'No display name for '+id);
  assert.equal(template.ko,found[1],'Displayed picture name must match KO voice for '+id);
}
assert.equal(lex.spoken('template','police','en'),'police car');
assert.equal(lex.spoken('template','fire_ladder','en'),'ladder fire truck');
assert.equal(lex.spoken('template','dino','en'),'dinosaur');
assert.equal(lex.spoken('template','icecream','en'),'ice cream');
assert.equal(lex.spoken('vehicle','helicopter','en'),'helicopter');
assert.equal(lex.spoken('vehicle','rescue_helicopter','ko'),'구조 헬기');
assert.equal(lex.spoken('template','no-such-object','en'),'');
for(let n of [1,2,3,5,10,11,12,20,30,50,100]){
  assert(lex.numberEn(n), 'Cannot announce '+n);
}
assert.equal(lex.numberEn(50),'fifty');
assert.equal(lex.numberEn(100),'one hundred');
assert.equal(lex.blockText('하나랑 둘 합체! 그래서 셋!','en'),'one and two make three!');
assert.equal(lex.blockText('하나','en'),'one!');
assert.equal(lex.blockText('로켓 몸통 쿵!','en'),'The rocket body!');
assert.equal(lex.blockText('로켓 몸통 쿵!','ko'),'로켓 몸통 쿵!');
assert.equal(lex.fixedKoreanVoice('common.land.story'),'만화극장');
assert.equal(lex.fixedKoreanVoice('common.land.letter'),'글자놀이터');
const manifest=JSON.parse(file('assets/voice/voice_manifest.json'));
const voiceEntries=Object.entries(manifest.voices);
assert.equal(voiceEntries.length,307,'Voice-manifest denominator changed; investigate before release');
for(const [id,src] of voiceEntries){
  assert(/^\.\/assets\/voice\/games\/[a-z0-9-]+\.mp3$/.test(src),'Unexpected path '+id);
  assert(fs.existsSync(path.join(root,src.replace(/^\.\//,''))),'Broken voice path '+id);
}
for(const p of ['js/games/art-zone.js','js/games/number-blocks.js','js/games/vehicle-memory.js',
                'js/games/number-vehicles.js','games/number-kingdom-3d.html','js/engine/webgl-fallback.js','js/games/number-count.js']){
  assert(file(p).includes('SihyeonVoiceLabels'),'Voice registry not integrated into '+p);
}
async function run(){
 const voice=window.SihyeonVoice;
 let p=voice.play('common.land.story');
 await Promise.resolve();
 assert.equal(spoken.at(-1).text,'만화극장');
 assert.equal(spoken.at(-1).lang,'ko-KR');
 await p;
 p=lex.say('color','#FF4444');
 assert.equal(spoken.at(-1).text,'빨간색');
 await p;
 p=lex.say('template','fire_ladder');
 assert.equal(spoken.at(-1).text,'소방 사다리차');
 await p;
 language='en';
 p=voice.play('common.land.story');
 assert.equal(spoken.at(-1).text,"Story time! Let's listen!");
 await p;
 p=lex.say('template','dino');
 assert.equal(spoken.at(-1).text,'dinosaur');
 assert.equal(spoken.at(-1).lang,'en-US');
 await p;
 p=lex.say('color','#FF4444');
 assert.equal(spoken.at(-1).text,'red');
 await p;
 assert.equal(audioSources.length,0,'Verified names should never use unverified MP3 files');
 console.log('PASS: all '+ids.length+' art templates, '+uiColors.length+' colors, '+lex.vehicles.length+' vehicles, '+voiceEntries.length+' manifest paths, KO/EN TTS and menu/story identity');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
