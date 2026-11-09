/* English Listening: semantic scripts, settings and stale-media cancellation. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const src = (name) => fs.readFileSync(path.join(__dirname, '..', name),'utf8');

function settingsFixture(initial) {
  const storage = new Map(initial ? [['sihyeon-play-settings-v1',initial]] : []);
  const window = { dispatchEvent() {} };
  const document = { querySelectorAll: () => [], addEventListener() {}, activeElement: null };
  const localStorage = {getItem: k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
  vm.runInNewContext(src('js/play-settings.js'), {
    window,document,localStorage,CustomEvent:class{constructor(t,o){this.type=t;this.detail=o.detail;}}
  });
  return {api:window.SihyeonPlaySettings,storage};
}
const options = settingsFixture();
assert.equal(options.api.getLanguage(),'ko');
assert.equal(options.api.setLanguage('en'),true);
assert.equal(options.api.setAge(7),true);
assert.equal(options.api.getLanguage(),'en','age must not reset language');
assert.equal(options.api.setChallenge('numberCount','21-30'),true);
const restored = settingsFixture(options.storage.get('sihyeon-play-settings-v1'));
assert.equal(restored.api.getLanguage(),'en');
assert.equal(restored.api.getAge(),7);
assert.equal(restored.api.getChallenge('numberCount'),'21-30');
assert.equal(restored.api.setLanguage('invalid'),false);
assert.equal(restored.api.getLanguage(),'en');
assert.equal(settingsFixture('not-json').api.getLanguage(),'ko');

async function run() {
  let language='en';
  const spoken = [],recorded = [],canceled=[];
  const synthesis={
    cancel(){ canceled.push(spoken.length); },
    speak(utterance){spoken.push(utterance);},
    getVoices(){return [{name:'Korean',lang:'ko-KR'},{name:'English US',lang:'en-US'}];}
  };
  class Utterance {constructor(text){this.text=text;}}
  class Audio {
    constructor(src){this.src=src;this.preload='';this.volume=1;recorded.push(this);}
    play(){return Promise.resolve();}
    pause(){}
    removeAttribute(){}
    load(){}
  }
  const window={
    SihyeonPlaySettings:{getLanguage:()=>language},
    speechSynthesis:synthesis,
    addEventListener(){},removeEventListener(){}
  };
  const ctx={window,SpeechSynthesisUtterance:Utterance,Audio,console,
    fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve({voices:{
      'common.land.story':'./assets/voice/games/common-land-story.mp3'
    }})})};
  vm.runInNewContext(src('js/english-listening.js'),ctx);
  const english=window.SihyeonEnglishListening;
  assert.equal(english.numberWord(1),'one');
  assert.equal(english.numberWord(11),'eleven');
  assert.equal(english.numberWord(20),'twenty');
  assert.equal(english.numberWord(21),'twenty-one');
  assert.equal(english.numberWord(30),'thirty');
  for(let i=1;i<=30;i++) assert.match(english.numberWord(i),/^[a-z-]+$/);
  assert.equal(english.phraseForId('common.land.story'),"Story time! Let's listen!");
  assert.equal(english.phraseForId('common.land.letter'),"Let's play with letters!");
  for(const color of ['red','blue','yellow','green','pink','purple'])
    assert.equal(english.phraseForId('games.color.'+color),'Find the '+color+' balloon!');
  assert.equal(english.phraseForText('검정색!'),'Black!');
  assert.equal(english.phraseForText('무지개!'),'Rainbow!');
  assert.equal(english.phraseForText('연두색!'),'Light green!');
  const order = english.postOfficeOrder({
    animal:'rabbit',age:4,kind:'exact',requirements:[{type:'apple',count:3}]
  });
  assert.match(order,/three apples to the rabbit/);
  assert.equal(english.trainPhrase('빨강, 탔어!'),'red. All aboard!');
  assert.equal(english.trainPhrase('규칙을 따라, 출발!'),'Choo-choo! Here we go!');
  assert.equal(english.colorFeedback('red','blue'),"Oops! That's red. Find blue!");

  vm.runInNewContext(src('js/voice-engine.js'),ctx);
  const voice=window.SihyeonVoice;
  const p = voice.play('common.land.story');
  assert.equal(recorded.length,0,'English mode must never load Korean MP3');
  assert.equal(spoken.length,1);
  assert.equal(spoken[0].text,"Story time! Let's listen!");
  assert.equal(spoken[0].lang,'en-US');
  assert.equal(spoken[0].voice.lang,'en-US');
  spoken[0].onend();
  assert.equal(await p,true);
  // Queued letter must not speak after a different zone takes focus.
  const seq=voice.playSequence([['common.land.letter'],['common.land.story']]);
  await Promise.resolve();await Promise.resolve();
  assert.equal(spoken.at(-1).text,"Let's play with letters!");
  const later=voice.play('common.land.number');
  assert.equal(spoken.at(-1).text,"Let's play with numbers!");
  spoken.at(-1).onend();
  assert.equal(await later,true);
  assert.equal(await seq,false);
  assert.equal(spoken.filter(x=>x.text==="Story time! Let's listen!").length,1,
    'previous sequence must never resume');
  assert.equal(await voice.play('games.unknown.id'),false,'unknown English ID never plays Korean');
  assert.equal(recorded.length,0);
  assert.equal(await voice.speak('시현아. 알 수 없는 한국어 문장'),false,
    'English TTS must not read unknown Korean content');
  const tts=voice.speak('One, two, three!',{lang:'en-US'});
  assert.equal(spoken.at(-1).text,'One, two, three!');
  spoken.at(-1).onend();await tts;
  language='ko';
  const ko=voice.play('common.land.story');
  for(let i=0;i<15;i++)await Promise.resolve();
  assert.equal(recorded.length,1,'Korean mode continues to use recorded media');
  assert.equal(recorded[0].src,'./assets/voice/games/common-land-story.mp3');
  recorded[0].onended();assert.equal(await ko,true);
  assert.ok(canceled.length>=2);
  console.log('PASS English TTS: numbers 1-30, colours, English zone mapping, language persisted independent of age, queue cancellation and Korean voice preservation');
}
run().catch(err=>{console.error(err);process.exitCode=1;});
