/* English Listening: short, meaningful phrases tied to actions. No recorded English files. */
(function () {
  'use strict';
  const NUMBERS = ['zero','one','two','three','four','five','six','seven','eight','nine','ten',
    'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
  const COLORS = Object.freeze({red:'red',orange:'orange',yellow:'yellow',green:'green',blue:'blue',
    purple:'purple',pink:'pink',black:'black',white:'white',brown:'brown',gray:'gray',
    rainbow:'rainbow',mint:'mint',ivory:'ivory',vanilla:'vanilla',silver:'silver',lime:'light green',
    navy:'dark blue'});
  const KOREAN_COLORS = Object.freeze({'빨강':'red','빨간색':'red','주황색':'orange',
    '노랑':'yellow','노란색':'yellow','초록':'green','초록색':'green','파랑':'blue',
    '파란색':'blue','진파랑':'dark blue','보라':'purple','보라색':'purple',
    '분홍색':'pink','검정색':'black','흰색':'white','무지개':'rainbow','은색':'silver',
    '연두색':'light green','민트색':'mint','아이보리색':'ivory','바닐라색':'vanilla','갈색':'brown'});
  const TOKENS = Object.freeze({red:'red',blue:'blue',yellow:'yellow',green:'green',
    circle:'circle',triangle:'triangle',square:'square',star:'star',cat:'cat',
    rabbit:'rabbit',bear:'bear',frog:'frog'});
  const KOREAN_TOKENS = Object.freeze({'빨강':'red','파랑':'blue','노랑':'yellow','초록':'green',
    '동그라미':'circle','세모':'triangle','네모':'square','별':'star','고양이':'cat',
    '토끼':'rabbit','곰':'bear','개구리':'frog'});
  const ITEMS = Object.freeze({teddy:'teddy bear',apple:'apple',ball:'ball',carrot:'carrot',
    block:'block',cookie:'star cookie'});
  const ANIMALS = Object.freeze({rabbit:'rabbit',bear:'bear',fox:'fox',panda:'panda',
    cat:'cat',dog:'dog'});
  const VEHICLES = Object.freeze({pump_engine:'fire truck',ladder_truck:'ladder truck',
    ambulance:'ambulance',excavator:'excavator',dump_truck:'dump truck',
    concrete_mixer:'cement mixer',train:'train',bus:'bus',car:'car',airplane:'airplane',
    taxi:'taxi',tractor:'tractor',helicopter:'helicopter',school_bus:'school bus'});
  const PHRASES = Object.freeze({
    'common.welcome':'Hi there! Ready to play?',
    'common.breakTime':"Let's take a little break!",
    'common.levelUp':'You did it! Great job!',
    'common.characterTogether':"Let's play together!",
    'common.characterGo':"Let's go!",
    'common.whereToGo':'Where shall we go?',
    'common.landArrive':'Here we are! What shall we play?',
    'common.walkToZone':'Here we go! Step, step, step!',
    'common.backToPark':"Welcome back! Let's play again!",
    'common.zoneArrive':"Here we are!",
    'common.land.game':"Let's play some games!",
    'common.land.number':"Let's play with numbers!",
    'common.land.letter':"Let's play with letters!",
    'common.land.car':"Let's play with cars!",
    'common.land.story':"Story time! Let's listen!",
    'common.land.voice':"Let's talk and sing!",
    'common.zone.karaoke':"Let's sing!",
    'common.word.playground':"Let's play!",
    'common.word.karaoke':"Let's sing!",
    'games.number.intro':"Let's count!",
    'games.number.guide.countQuestion':"How many cars do you see?",
    'games.number.countQuestion':"How many cars do you see?",
    'games.number.correct':"You got it! Great counting!",
    'games.number.wrong':"Oops! Let's count again.",
    'games.number.complete':"Hooray! You counted them all!",
    'games.color.intro':"Let's find some colors!",
    'games.color.correct':"Yes! You found it!",
    'games.color.wrong':"Oops! Try another balloon.",
    'games.color.complete':"You did it! What colorful balloons!",
    'games.paint.intro':"Let's draw and color!",
    'games.paint.blank':'A blank page!',
    'games.paint.sky':'The sky!',
    'games.paint.sea':'The ocean!',
    'games.paint.forest':'The forest!',
    'games.paint.colorTarget':"Let's color the picture!",
    'games.paint.choose':'Which picture shall we color?',
    'games.paint.free':"Let's draw anything you like!",
    'games.paint.complete':'You did it! What a lovely picture!',
    'games.memory.intro':"Let's find the matching cards!",
    'games.memory.correct':"You found a match!",
    'games.memory.wrong':"Not quite. Try again!",
    'games.memory.complete':'All matched! Well done!',
    'games.car.intro':"Let's fix the car!",
    'games.car.wrong':"Oops! Try another tool!",
    'games.car.complete':'All fixed! Off we go!',
    'games.parking.intro':"Let's park the cars!",
    'games.parking.complete':"All parked! Well done!",
    'games.construction.intro':"Let's build something!",
    'games.construction.wrong':"Oops! Try again!",
    'games.construction.correct':"That's right!",
    'games.construction.complete':'Great work! All done!',
    'games.common.correct':"That's right!",
    'games.common.wrong':'Oops! Try again!',
    'games.common.complete':'You did it!',
    'games.sequence.complete':'All done! Great job!'
  });
  const NUMBER_NAMES_KO = ['','하나','둘','셋','넷','다섯','여섯','일곱','여덟','아홉',
    '열','열하나','열둘','열셋','열넷','열다섯','열여섯','열일곱','열여덟','열아홉',
    '스물','스물하나','스물둘','스물셋','스물넷','스물다섯','스물여섯','스물일곱','스물여덟','스물아홉','서른'];
  function numberWord(value) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > 30) return '';
    if (n <= 20) return NUMBERS[n];
    return n === 30 ? 'thirty' : 'twenty-' + NUMBERS[n - 20];
  }
  function itemPhrase(type,count) {
    const noun = ITEMS[type];
    const spoken = numberWord(count);
    return noun && spoken ? spoken + ' ' + noun + (count === 1 ? '' : 's') : '';
  }
  function postOfficeOrder(mission) {
    if (!mission || !Array.isArray(mission.requirements)) return '';
    const request = mission.requirements.map(function (need) { return itemPhrase(need.type,need.count); })
      .filter(Boolean).join(' and ');
    const animal = ANIMALS[mission.animal] || 'friend';
    if (!request) return '';
    let action = 'Tap the things to load the truck.';
    if (mission.kind === 'fill-missing') action = 'Add what is missing.';
    else if (mission.age === 6) action = 'You can make groups of ten!';
    else if (mission.age === 7) action = 'Share the things between the two trucks.';
    return "Let's send " + request + ' to the ' + animal + '. ' + action;
  }
  function postOfficePhrase(text) {
    const raw = String(text || '').trim();
    if (!raw) return '';
    const n = NUMBER_NAMES_KO.indexOf(raw);
    if (n > 0) return numberWord(n) + '!';
    if (/고마워|잘 받았어/.test(raw)) return 'Thank you! Here you go!';
    if (/상자를 닫고|출발/.test(raw)) return "All packed! Let's go!";
    if (/하나 내렸어/.test(raw)) return 'One out!';
    if (/열 개가 한 묶음/.test(raw)) return 'A group of ten!';
    if (/낱개 열 개/.test(raw)) return 'Ten little ones!';
    if (/부족|덜 담|더 실어/.test(raw)) return 'We need a little more!';
    if (/너무 많|많이 담/.test(raw)) return 'Too many! Take one out!';
    if (/틀렸|다시|맞지 않|다른 물건/.test(raw)) return "Oops! Let's check the order.";
    return '';
  }
  function phraseForId(id) {
    const key = String(id || '');
    if (Object.prototype.hasOwnProperty.call(PHRASES,key)) return PHRASES[key];
    const color = key.match(/^games\.color\.(red|blue|yellow|green|purple|pink)$/);
    if (color) return 'Find the ' + COLORS[color[1]] + ' balloon!';
    const paint = key.match(/^games\.paint\.([A-Za-z]+)$/);
    if (paint && COLORS[paint[1]]) return COLORS[paint[1]].charAt(0).toUpperCase() + COLORS[paint[1]].slice(1) + '!';
    const count = key.match(/^games\.number\.(?:koreanCount\.|count\.|countUnit\.|countVehicle\.)(\d+)$/);
    if (count) return numberWord(Number(count[1])) + (key.includes('Vehicle.') ? (Number(count[1]) === 1 ? ' car!' : ' cars!') : '!');
    const sound = key.match(/^games\.number\.vehicleSound\.(\w+)$/);
    if (sound) {
      const soundMap = {siren:'fire truck',ladder:'ladder truck',ambulance:'ambulance',
        excavator:'excavator',dump:'dump truck',mixer:'cement mixer',train:'train',bus:'bus',
        car:'car',airplane:'airplane'};
      const noun = soundMap[sound[1]];
      return noun ? 'Look! A ' + noun + '!' : '';
    }
    return '';
  }
  function phraseForText(text) {
    const raw = String(text || '').trim().replace(/[!.]$/,'');
    if (!raw) return '';
    if (!/[가-힣]/.test(raw)) return raw;
    if (KOREAN_COLORS[raw]) {
      const color = KOREAN_COLORS[raw];
      return color.charAt(0).toUpperCase() + color.slice(1) + '!';
    }
    if (KOREAN_TOKENS[raw]) return KOREAN_TOKENS[raw] + '!';
    const n = NUMBER_NAMES_KO.indexOf(raw);
    if (n > 0) return numberWord(n) + '!';
    const scene = {
      '시현아. 마법 그림판이야. 같이 그리고 색칠해볼까?':"Let's draw and color!",
      '어떤 그림을 색칠해볼까?':"Which picture shall we color?",
      '자유롭게 그려볼까?':"Let's draw!",
      '새 종이야. 되돌리면 그림이 돌아와!':'A new page! You can undo!',
      '바다야!':'The ocean!',
      '하늘이야!':'The sky!',
      '숲속이야!':'The forest!'
    };
    if (scene[String(text || '').trim()]) return scene[String(text || '').trim()];
    const template = raw.match(/^(.+)! 같이 색칠해 볼까\?$/);
    if (template) return "Let's color the picture!";
    return '';
  }
  function colorFeedback(chosen,target) {
    const found = COLORS[target] || '';
    const picked = COLORS[chosen] || '';
    if (!found) return 'You found it!';
    if (chosen === target) return "Yes! That's " + found + '! Great job!';
    return picked ? "Oops! That's " + picked + '. Find ' + found + '!' : 'Try again!';
  }
  function trainPhrase(text,task,state) {
    const raw = String(text || '').trim();
    if (!raw) return '';
    if (!/[가-힣]/.test(raw)) return raw;
    if (KOREAN_TOKENS[raw]) return KOREAN_TOKENS[raw] + '!';
    const aboard = raw.match(/^(.+), (탔어!|탔어)$/);
    if (aboard && KOREAN_TOKENS[aboard[1]]) return KOREAN_TOKENS[aboard[1]] + '. All aboard!';
    const clue = raw.match(/^(.+)\. 보기 친구야\.$/);
    if (clue && KOREAN_TOKENS[clue[1]]) return KOREAN_TOKENS[clue[1]] + ' stays here!';
    if (/마음대로 태워/.test(raw)) return "Build your own train! Let's go!";
    if (/가장 작은 묶음|가장 작은 반복/.test(raw)) return 'Find the smallest repeating group!';
    if (/빨강 둘, 파랑 둘/.test(raw)) return 'Two red, two blue. Make a new pattern!';
    if (/네 묶음을 만들고 도장을/.test(raw)) return 'Make a pattern, then repeat it three times!';
    if (/화살표 친구로/.test(raw)) return 'Match the pictures. Keep the same pattern!';
    if (/두 칸, 세 칸, 네 칸/.test(raw)) return 'Look for a repeating pattern!';
    if (/이 묶음이 되풀이/.test(raw)) return "What comes next? Fill in the train!";
    if (/규칙을 따라, 출발|내 기차, 출발/.test(raw)) return 'Choo-choo! Here we go!';
    if (/멋진 기차|도착!/.test(raw)) return 'We made it! Great job!';
    if (/꺼낼 친구를/.test(raw)) return 'Tap a friend to take it out!';
    if (/다시 태워/.test(raw)) return 'Put a friend back on the train!';
    if (/내렸어/.test(raw)) return 'Off you go!';
    if (/다시 태워도/.test(raw)) return 'You can try again!';
    if (/세 번 이어졌어/.test(raw)) return 'Look! The pattern repeats three times!';
    if (/칸 묶음으로/.test(raw)) return 'Look for a repeating group!';
    if (/고쳐 봐/.test(raw)) return "Let's change the pattern!";
    if (/빈 객차/.test(raw)) return 'Find the empty car!';
    if (/반복 순서|반짝이는 객차|다시 고쳐|빈칸|보기 친구/.test(raw)) return "Look at the pattern. Try again!";
    if (/이 방법도 좋아/.test(raw)) return "That works too! Great thinking!";
    if (/친구들이 차례차례/.test(raw)) return 'Look! The train is moving!';
    if (state && state.lastResult && !state.lastResult.ok) return 'Try a different pattern!';
    return '';
  }
  window.SihyeonEnglishListening = Object.freeze({
    numberWord:numberWord,phraseForId:phraseForId,phraseForText:phraseForText,
    itemPhrase:itemPhrase,postOfficeOrder:postOfficeOrder,postOfficePhrase:postOfficePhrase,
    trainPhrase:trainPhrase,colorFeedback:colorFeedback,tokenName:function (id) { return TOKENS[id] || ''; },
    vehicleName:function (id) { return VEHICLES[id] || 'vehicle'; }
  });
})();