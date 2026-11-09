/* Single source of truth for labels spoken when a child taps a visible item.
 * Korean & English names are selected by stable IDs; do not reuse unverified MP3s.
 * Vehicle vocabulary reflects 129 existing manifest records at source main cf988eb3.
 */
(function () {
  'use strict';
  const palettes = [
  {
    "id": "rainbow",
    "hex": "rainbow",
    "ko": "무지개",
    "en": "rainbow"
  },
  {
    "id": "black",
    "hex": "#1A1A1A",
    "ko": "검정색",
    "en": "black"
  },
  {
    "id": "red",
    "hex": "#FF4444",
    "ko": "빨간색",
    "en": "red"
  },
  {
    "id": "orange",
    "hex": "#FF9900",
    "ko": "주황색",
    "en": "orange"
  },
  {
    "id": "yellow",
    "hex": "#FFD700",
    "ko": "노란색",
    "en": "yellow"
  },
  {
    "id": "green",
    "hex": "#44CC44",
    "ko": "초록색",
    "en": "green"
  },
  {
    "id": "blue",
    "hex": "#4488FF",
    "ko": "파란색",
    "en": "blue"
  },
  {
    "id": "navy",
    "hex": "#1E40AF",
    "ko": "진파랑",
    "en": "dark blue"
  },
  {
    "id": "purple",
    "hex": "#9944FF",
    "ko": "보라색",
    "en": "purple"
  },
  {
    "id": "pink",
    "hex": "#FF88CC",
    "ko": "분홍색",
    "en": "pink"
  },
  {
    "id": "ivory",
    "hex": "#FFF8E7",
    "ko": "아이보리색",
    "en": "ivory"
  },
  {
    "id": "vanilla",
    "hex": "#F6E7C8",
    "ko": "바닐라색",
    "en": "vanilla"
  },
  {
    "id": "silver",
    "hex": "#C0C0C0",
    "ko": "은색",
    "en": "silver"
  },
  {
    "id": "mint",
    "hex": "#8EF6D1",
    "ko": "민트색",
    "en": "mint"
  },
  {
    "id": "brown",
    "hex": "#8B5A2B",
    "ko": "갈색",
    "en": "brown"
  },
  {
    "id": "lime",
    "hex": "#7ED957",
    "ko": "연두색",
    "en": "light green"
  }
];
  const templates = [
  {
    "id": "police",
    "ko": "경찰차",
    "en": "police car"
  },
  {
    "id": "police_bus",
    "ko": "경찰 버스",
    "en": "police bus"
  },
  {
    "id": "fire_pump",
    "ko": "소방 펌프차",
    "en": "fire truck"
  },
  {
    "id": "fire_ladder",
    "ko": "소방 사다리차",
    "en": "ladder truck"
  },
  {
    "id": "ambulance",
    "ko": "구급차",
    "en": "ambulance"
  },
  {
    "id": "excavator",
    "ko": "포크레인",
    "en": "excavator"
  },
  {
    "id": "dump_truck",
    "ko": "덤프트럭",
    "en": "dump truck"
  },
  {
    "id": "bulldozer",
    "ko": "불도저",
    "en": "bulldozer"
  },
  {
    "id": "rocket",
    "ko": "우주 로켓",
    "en": "space rocket"
  },
  {
    "id": "dino",
    "ko": "공룡",
    "en": "dinosaur"
  },
  {
    "id": "train",
    "ko": "칙칙폭폭 기차",
    "en": "train"
  },
  {
    "id": "airplane",
    "ko": "비행기",
    "en": "airplane"
  },
  {
    "id": "lion",
    "ko": "어흥 사자",
    "en": "lion"
  },
  {
    "id": "whale",
    "ko": "고래",
    "en": "whale"
  },
  {
    "id": "icecream",
    "ko": "아이스크림",
    "en": "ice cream"
  },
  {
    "id": "helicopter",
    "ko": "헬리콥터",
    "en": "helicopter"
  }
];
  const vehicles = [
  {
    "id": "pump_engine",
    "ko": "펌프차",
    "en": "fire truck"
  },
  {
    "id": "water_tanker",
    "ko": "물탱크차",
    "en": "water tanker"
  },
  {
    "id": "ladder_truck",
    "ko": "사다리차",
    "en": "ladder truck"
  },
  {
    "id": "aerial_ladder_truck",
    "ko": "고가사다리차",
    "en": "aerial ladder truck"
  },
  {
    "id": "articulating_ladder_truck",
    "ko": "굴절사다리차",
    "en": "articulating ladder truck"
  },
  {
    "id": "rescue_fire_truck",
    "ko": "구조공작차",
    "en": "fire rescue truck"
  },
  {
    "id": "airport_fire_truck",
    "ko": "공항소방차",
    "en": "airport fire truck"
  },
  {
    "id": "foam_fire_truck",
    "ko": "포소화차",
    "en": "foam fire truck"
  },
  {
    "id": "fire_command_vehicle",
    "ko": "소방 지휘차",
    "en": "fire command vehicle"
  },
  {
    "id": "korean_police_car",
    "ko": "한국 경찰차",
    "en": "police car"
  },
  {
    "id": "us_police_car",
    "ko": "미국 경찰차",
    "en": "police car"
  },
  {
    "id": "police_motorcycle",
    "ko": "경찰 오토바이",
    "en": "police motorcycle"
  },
  {
    "id": "swat_truck",
    "ko": "경찰특공대차",
    "en": "SWAT truck"
  },
  {
    "id": "forensic_bus",
    "ko": "과학수사버스",
    "en": "forensics bus"
  },
  {
    "id": "riot_police_bus",
    "ko": "기동대 버스",
    "en": "police bus"
  },
  {
    "id": "ambulance",
    "ko": "구급차",
    "en": "ambulance"
  },
  {
    "id": "doctor_car",
    "ko": "닥터카",
    "en": "doctor's car"
  },
  {
    "id": "rescue_helicopter",
    "ko": "구조 헬기",
    "en": "rescue helicopter"
  },
  {
    "id": "excavator",
    "ko": "포크레인",
    "en": "excavator"
  },
  {
    "id": "mini_excavator",
    "ko": "미니 굴착기",
    "en": "mini excavator"
  },
  {
    "id": "bulldozer",
    "ko": "불도저",
    "en": "bulldozer"
  },
  {
    "id": "wheel_loader",
    "ko": "휠로더",
    "en": "wheel loader"
  },
  {
    "id": "dump_truck",
    "ko": "덤프트럭",
    "en": "dump truck"
  },
  {
    "id": "concrete_mixer",
    "ko": "레미콘",
    "en": "cement mixer"
  },
  {
    "id": "concrete_pump_truck",
    "ko": "콘크리트 펌프카",
    "en": "concrete pump truck"
  },
  {
    "id": "crane_truck",
    "ko": "크레인차",
    "en": "crane truck"
  },
  {
    "id": "forklift",
    "ko": "지게차",
    "en": "forklift"
  },
  {
    "id": "road_roller",
    "ko": "로드롤러",
    "en": "road roller"
  },
  {
    "id": "asphalt_paver",
    "ko": "아스팔트 포장차",
    "en": "asphalt paver"
  },
  {
    "id": "grader",
    "ko": "그레이더",
    "en": "road grader"
  },
  {
    "id": "backhoe_loader",
    "ko": "백호로더",
    "en": "backhoe loader"
  },
  {
    "id": "skid_steer_loader",
    "ko": "스키드로더",
    "en": "skid-steer loader"
  },
  {
    "id": "tower_crane",
    "ko": "타워크레인",
    "en": "tower crane"
  },
  {
    "id": "mobile_crane",
    "ko": "이동식 크레인",
    "en": "mobile crane"
  },
  {
    "id": "pile_driver",
    "ko": "항타기",
    "en": "pile driver"
  },
  {
    "id": "drilling_rig",
    "ko": "천공기",
    "en": "drilling rig"
  },
  {
    "id": "excavator_breaker",
    "ko": "브레이커 굴착기",
    "en": "breaker excavator"
  },
  {
    "id": "dump_loader",
    "ko": "광산 덤프로더",
    "en": "mine loader"
  },
  {
    "id": "articulated_dump_truck",
    "ko": "굴절식 덤프트럭",
    "en": "articulated dump truck"
  },
  {
    "id": "water_truck",
    "ko": "살수차",
    "en": "water truck"
  },
  {
    "id": "sweeper_truck",
    "ko": "노면 청소차",
    "en": "street sweeper"
  },
  {
    "id": "fuel_truck",
    "ko": "주유차",
    "en": "fuel truck"
  },
  {
    "id": "lowbed_trailer",
    "ko": "저상 트레일러",
    "en": "lowboy trailer"
  },
  {
    "id": "cargo_truck",
    "ko": "자재 운반 트럭",
    "en": "cargo truck"
  },
  {
    "id": "scissor_lift",
    "ko": "고소작업대",
    "en": "scissor lift"
  },
  {
    "id": "train",
    "ko": "기차",
    "en": "train"
  },
  {
    "id": "bus",
    "ko": "버스",
    "en": "bus"
  },
  {
    "id": "car",
    "ko": "자동차",
    "en": "car"
  },
  {
    "id": "taxi",
    "ko": "택시",
    "en": "taxi"
  },
  {
    "id": "school_bus",
    "ko": "스쿨버스",
    "en": "school bus"
  },
  {
    "id": "rocket",
    "ko": "로켓",
    "en": "rocket"
  },
  {
    "id": "submarine",
    "ko": "잠수함",
    "en": "submarine"
  },
  {
    "id": "tow_truck",
    "ko": "견인차",
    "en": "tow truck"
  },
  {
    "id": "garbage_truck",
    "ko": "청소차",
    "en": "garbage truck"
  },
  {
    "id": "tractor",
    "ko": "트랙터",
    "en": "tractor"
  },
  {
    "id": "airplane",
    "ko": "비행기",
    "en": "airplane"
  },
  {
    "id": "helicopter",
    "ko": "헬리콥터",
    "en": "helicopter"
  },
  {
    "id": "passenger_airplane",
    "ko": "여객기",
    "en": "passenger airplane"
  },
  {
    "id": "airport_bus",
    "ko": "공항버스",
    "en": "airport bus"
  },
  {
    "id": "airport_follow_me_car",
    "ko": "공항 유도차",
    "en": "airport guide car"
  },
  {
    "id": "baggage_cart",
    "ko": "수하물 카트",
    "en": "baggage cart"
  },
  {
    "id": "catering_truck",
    "ko": "기내식 트럭",
    "en": "catering truck"
  },
  {
    "id": "de_icing_truck",
    "ko": "제빙 트럭",
    "en": "de-icing truck"
  },
  {
    "id": "fuel_truck_airport",
    "ko": "공항 주유차",
    "en": "airport fuel truck"
  },
  {
    "id": "pushback_tug",
    "ko": "토잉카",
    "en": "aircraft tug"
  },
  {
    "id": "stair_truck",
    "ko": "탑승 계단차",
    "en": "aircraft stairs truck"
  },
  {
    "id": "farm_tractor",
    "ko": "농장 트랙터",
    "en": "farm tractor"
  },
  {
    "id": "plow_tractor",
    "ko": "쟁기 트랙터",
    "en": "plow tractor"
  },
  {
    "id": "combine_harvester",
    "ko": "콤바인",
    "en": "combine harvester"
  },
  {
    "id": "rice_transplanter",
    "ko": "이앙기",
    "en": "rice transplanter"
  },
  {
    "id": "sprayer_truck",
    "ko": "농약 살포차",
    "en": "crop sprayer"
  },
  {
    "id": "baler",
    "ko": "베일러",
    "en": "hay baler"
  },
  {
    "id": "farm_trailer",
    "ko": "농장 트레일러",
    "en": "farm trailer"
  },
  {
    "id": "fruit_harvest_truck",
    "ko": "과일 수확차",
    "en": "fruit harvest truck"
  },
  {
    "id": "milk_tanker",
    "ko": "우유 탱크로리",
    "en": "milk tanker"
  },
  {
    "id": "cargo_ship",
    "ko": "화물선",
    "en": "cargo ship"
  },
  {
    "id": "container_truck",
    "ko": "컨테이너 트럭",
    "en": "container truck"
  },
  {
    "id": "harbor_crane",
    "ko": "항만 크레인",
    "en": "harbor crane"
  },
  {
    "id": "reach_stacker",
    "ko": "리치스태커",
    "en": "reach stacker"
  },
  {
    "id": "tugboat",
    "ko": "예인선",
    "en": "tugboat"
  },
  {
    "id": "ferry",
    "ko": "페리",
    "en": "ferry",
    "enPlural": "ferries"
  },
  {
    "id": "fishing_boat",
    "ko": "어선",
    "en": "fishing boat"
  },
  {
    "id": "coast_guard_boat",
    "ko": "해경정",
    "en": "coast guard boat"
  },
  {
    "id": "rescue_boat",
    "ko": "구조정",
    "en": "rescue boat"
  },
  {
    "id": "road_repair_truck",
    "ko": "도로 보수차",
    "en": "road repair truck"
  },
  {
    "id": "line_painting_truck",
    "ko": "차선 도색차",
    "en": "road marking truck"
  },
  {
    "id": "traffic_cone_truck",
    "ko": "안전콘 트럭",
    "en": "traffic cone truck"
  },
  {
    "id": "road_sign_truck",
    "ko": "도로 표지판 트럭",
    "en": "road sign truck"
  },
  {
    "id": "road_sweeper",
    "ko": "도로 청소차",
    "en": "road sweeper"
  },
  {
    "id": "salt_spreader",
    "ko": "제설 염화칼슘 살포차",
    "en": "salt spreader"
  },
  {
    "id": "snow_plow",
    "ko": "제설차",
    "en": "snowplow"
  },
  {
    "id": "bridge_inspection_truck",
    "ko": "교량 점검차",
    "en": "bridge inspection truck"
  },
  {
    "id": "tunnel_cleaning_truck",
    "ko": "터널 청소차",
    "en": "tunnel cleaning truck"
  },
  {
    "id": "military_truck",
    "ko": "특수 트럭",
    "en": "special truck"
  },
  {
    "id": "command_truck",
    "ko": "지휘 트럭",
    "en": "command truck"
  },
  {
    "id": "communication_relay_truck",
    "ko": "통신 중계차",
    "en": "communications truck"
  },
  {
    "id": "radar_truck",
    "ko": "레이더 차량",
    "en": "radar truck"
  },
  {
    "id": "searchlight_truck",
    "ko": "탐조등 차량",
    "en": "searchlight truck"
  },
  {
    "id": "mobile_hospital",
    "ko": "이동 병원차",
    "en": "mobile hospital"
  },
  {
    "id": "armored_rescue_vehicle",
    "ko": "장갑 구조차",
    "en": "armored rescue vehicle"
  },
  {
    "id": "mrap_patrol_vehicle",
    "ko": "특수 순찰차",
    "en": "armored patrol vehicle"
  },
  {
    "id": "tracked_carrier",
    "ko": "궤도 운반차",
    "en": "tracked carrier"
  },
  {
    "id": "amphibious_vehicle",
    "ko": "수륙양용차",
    "en": "amphibious vehicle"
  },
  {
    "id": "engineering_vehicle",
    "ko": "공병 작업차",
    "en": "engineering vehicle"
  },
  {
    "id": "bridge_layer_truck",
    "ko": "교량 설치차",
    "en": "bridge-laying truck"
  },
  {
    "id": "decontamination_truck",
    "ko": "제독차",
    "en": "decontamination truck"
  },
  {
    "id": "water_purification_truck",
    "ko": "정수 차량",
    "en": "water purification truck"
  },
  {
    "id": "snow_rescue_vehicle",
    "ko": "설상 구조차",
    "en": "snow rescue vehicle"
  },
  {
    "id": "drone_control_vehicle",
    "ko": "드론 관제차",
    "en": "drone control vehicle"
  },
  {
    "id": "eod_robot_vehicle",
    "ko": "로봇 작업차",
    "en": "robot support vehicle"
  },
  {
    "id": "missile_launcher_vehicle",
    "ko": "발사대 차량",
    "en": "launcher vehicle"
  },
  {
    "id": "school_van",
    "ko": "어린이 통학차",
    "en": "school van"
  },
  {
    "id": "bakery_truck",
    "ko": "빵 배달차",
    "en": "bakery delivery truck"
  },
  {
    "id": "flower_delivery_van",
    "ko": "꽃 배달차",
    "en": "flower delivery van"
  },
  {
    "id": "pet_grooming_van",
    "ko": "반려동물 미용차",
    "en": "pet grooming van"
  },
  {
    "id": "utility_repair_van",
    "ko": "수리 서비스차",
    "en": "repair service van"
  },
  {
    "id": "maintenance_pickup",
    "ko": "동네 관리차",
    "en": "maintenance pickup"
  },
  {
    "id": "beverage_delivery_truck",
    "ko": "음료 배달차",
    "en": "beverage delivery truck"
  },
  {
    "id": "toy_truck",
    "ko": "장난감 판매차",
    "en": "toy truck"
  },
  {
    "id": "community_bus",
    "ko": "마을버스",
    "en": "community bus"
  },
  {
    "id": "mail_truck",
    "ko": "우편차",
    "en": "mail truck"
  },
  {
    "id": "delivery_truck",
    "ko": "택배차",
    "en": "delivery truck"
  },
  {
    "id": "food_truck",
    "ko": "푸드트럭",
    "en": "food truck"
  },
  {
    "id": "ice_cream_truck",
    "ko": "아이스크림차",
    "en": "ice cream truck"
  },
  {
    "id": "moving_truck",
    "ko": "이삿짐차",
    "en": "moving truck"
  },
  {
    "id": "laundry_truck",
    "ko": "세탁 배달차",
    "en": "laundry truck"
  },
  {
    "id": "recycling_truck",
    "ko": "재활용 수거차",
    "en": "recycling truck"
  },
  {
    "id": "library_bus",
    "ko": "이동 도서관 버스",
    "en": "mobile library bus"
  },
  {
    "id": "street_vendor_truck",
    "ko": "이동 판매차",
    "en": "street vendor truck"
  }
];
  const zones = [
  {
    "id": "game",
    "ko": "즐거운놀이터",
    "en": "Let's play some games!"
  },
  {
    "id": "numbers",
    "ko": "숫자놀이터",
    "en": "Let's play with numbers!"
  },
  {
    "id": "letters",
    "ko": "글자놀이터",
    "en": "Let's play with letters!"
  },
  {
    "id": "cars",
    "ko": "자동차놀이터",
    "en": "Let's play with cars!"
  },
  {
    "id": "story",
    "ko": "만화극장",
    "en": "Story time!"
  },
  {
    "id": "voice",
    "ko": "말하기놀이터",
    "en": "Let's talk and sing!"
  }
];
  const blockEnglish = {
  "시현아! 신나는 숫자 블록 놀이를 시작해볼까?": "Let's play with number blocks!",
  "시현아! 숫자를 합쳐서 5를 만들어볼까?": "Let's make five!",
  "시현아, 순서대로 블록을 올려서 예쁘게 만들어볼까?": "Let's build with blocks!",
  "시현아, 블록 세 개로 멋진 집을 만들어볼까?": "Let's build a house!",
  "우와! 튼튼한 집 완성! 창문에 불이 반짝반짝!": "We built a house! Great job!",
  "네모 집 쿵!": "A square house!",
  "세모 지붕 쿵!": "A triangle roof!",
  "문까지 달면 완성!": "Let's add the door!",
  "시현아, 칙칙폭폭 기차를 만들어볼까?": "Let's build a train!",
  "기차 완성! 칙칙폭폭 출발해요! 빠아앙!": "Choo-choo! The train is ready!",
  "기관차 쿵!": "The engine!",
  "바퀴 쿵!": "The wheels!",
  "객차까지 연결 완료!": "A train car! All connected!",
  "시현아, 우주로 가는 로켓을 만들어볼까?": "Let's build a rocket!",
  "우와아! 로켓 완성! 우주로 슈우우웅~ 날아가요!": "Our rocket is ready! Blast off!",
  "로켓 몸통 쿵!": "The rocket body!",
  "날개 쿵!": "The wings!",
  "불꽃 발사 준비 완료!": "Ready for launch!",
  "어라? 이 블록은 안 맞네. 다른 걸 찾아볼까?": "Oops! Let's try another block!",
  "우와! 딱 맞았어!": "That's a perfect fit!",
  "집 만들기": "Let's build a house!",
  "기차 만들기": "Let's build a train!",
  "로켓 만들기": "Let's build a rocket!",
  "우와 대단해!": "Wow! You did it!"
};
  const byId = list => Object.freeze(Object.fromEntries(list.map(item=>[item.id,Object.freeze(item)])));
  const colorById=byId(palettes),templateById=byId(templates),vehicleById=byId(vehicles),zoneById=byId(zones);
  const colorByHex=Object.freeze(Object.fromEntries(palettes.map(x=>[x.hex.toLowerCase(),x])));
  const oneToTwenty=['zero','one','two','three','four','five','six','seven','eight','nine','ten',
    'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  function numberEn(n) {
    if(!Number.isInteger(n)||n<0||n>999)return '';
    if(n<20)return oneToTwenty[n];
    if(n<100) return tens[Math.floor(n/10)]+(n%10?'-'+oneToTwenty[n%10]:'');
    return oneToTwenty[Math.floor(n/100)]+' hundred'+(n%100?' '+numberEn(n%100):'');
  }
  function numberKo(n) {
    const nums=['영','하나','둘','셋','넷','다섯','여섯','일곱','여덟','아홉','열'];
    if(Number.isInteger(n)&&n>=0&&n<=10)return nums[n];
    return String(n);
  }
  function language() {
    try { return window.SihyeonPlaySettings?.getLanguage?.()==='en'?'en':'ko'; }
    catch (_) { return 'ko'; }
  }
  function entry(kind,key) {
    if(kind==='color')return colorById[key]||colorByHex[String(key).toLowerCase()]||null;
    if(kind==='template')return templateById[key]||null;
    if(kind==='vehicle')return vehicleById[key]||null;
    if(kind==='zone')return zoneById[key]||null;
    return null;
  }
  function spoken(kind,key,lang) {
    const record=entry(kind,key);return record ? record[lang==='en'?'en':'ko'] : '';
  }
  function say(kind,key,options) {
    const settings=options||{};
    const lang=settings.lang||language();
    const text=spoken(kind,key,lang);
    if(!text)return Promise.resolve(false);
    const voice=window.SihyeonVoice;
    if(!voice||typeof voice.speak!=='function')return Promise.resolve(false);
    return voice.speak(text,{lang:lang==='en'?'en-US':'ko-KR',rate:lang==='en'?0.9:0.93,pitch:1.0});
  }
  function blockText(raw,lang) {
    const t=String(raw||'').trim();
    if(lang!=='en')return t;
    const named={'하나':1,'둘':2,'셋':3,'넷':4,'다섯':5};
    const n=named[t.replace(/\.$/,'')];
    if(n)return numberEn(n)+'!';
    const merged=t.match(/^(하나|둘|셋|넷|다섯)(?:이랑|랑) (하나|둘|셋|넷|다섯) 합체! 그래서 (하나|둘|셋|넷|다섯)!$/);
    if(merged)return numberEn(named[merged[1]])+' and '+numberEn(named[merged[2]])+' make '+numberEn(named[merged[3]])+'!';
    return blockEnglish[t]||'';
  }
  function fixedKoreanVoice(id) {
    const named={
      'common.land.game':'game','common.land.number':'numbers','common.land.letter':'letters',
      'common.land.car':'cars','common.land.story':'story','common.land.voice':'voice'
    };
    if(named[id])return zoneById[named[id]].ko;
    const generic={
      'common.welcome':'시현아 안녕. 놀이공원에 온 걸 환영해.',
      'common.whereToGo':'어디로 갈까? 가고 싶은 곳을 살짝 눌러볼까?',
      'common.landArrive':'도착했어! 어떤 놀이를 해 볼까?',
      'common.walkToZone':'출발! 하나, 둘, 하나, 둘!',
      'common.zoneArrive':'도착했어! 같이 놀아보자!'
    };
    return generic[id]||'';
  }
  window.SihyeonVoiceLabels=Object.freeze({
    palettes,templates,vehicles,zones,
    colorById,templateById,vehicleById,zoneById,
    entry,spoken,say,language,numberEn,numberKo,blockText,fixedKoreanVoice
  });
})();
