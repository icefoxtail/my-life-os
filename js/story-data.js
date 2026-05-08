const FAMILY_CAST = [
  {
    id: "dad",
    name: "아빠",
    group: "가족",
    roleTag: "든든한 이야기 동행자",
    personality: "시현이를 따뜻하게 믿어 주고, 모험이 안전하게 이어지도록 곁에서 도와줘요.",
    favoriteThemes: ["자동차", "공룡", "우주", "잠자리", "모험"],
    storyUse: "시현이의 선택을 응원하고, 마지막에 따뜻하게 칭찬해 주는 역할"
  },
  {
    id: "mom",
    name: "엄마",
    group: "가족",
    roleTag: "포근한 마음 안내자",
    personality: "다정하고 세심하게 시현이의 마음을 살펴줘요.",
    favoriteThemes: ["잠자리", "동물", "바다", "가족", "전래"],
    storyUse: "불안하거나 속상한 마음을 포근하게 감싸 주는 역할"
  },
  {
    id: "grandma",
    name: "할머니",
    group: "가족",
    roleTag: "따뜻한 이야기 보따리",
    personality: "옛이야기를 부드럽게 들려주고 맛있는 냄새처럼 포근한 분위기를 만들어요.",
    favoriteThemes: ["전래", "이솝", "잠자리", "동물"],
    storyUse: "전래 느낌의 이야기 문을 열어 주거나 따뜻한 지혜를 건네는 역할"
  },
  {
    id: "grandpa",
    name: "할아버지",
    group: "가족",
    roleTag: "느긋한 지혜 길잡이",
    personality: "천천히 바라보고 차분하게 방법을 찾아요.",
    favoriteThemes: ["자동차", "공룡", "전래", "숲"],
    storyUse: "성급하지 않게 문제를 살피고 시현이가 스스로 선택하도록 기다려 주는 역할"
  },
  {
    id: "aunt",
    name: "고모",
    group: "가족",
    roleTag: "신나는 놀이 친구",
    personality: "밝고 경쾌하게 분위기를 살리고 시현이의 상상을 크게 키워줘요.",
    favoriteThemes: ["자동차", "동물", "우주", "마법"],
    storyUse: "놀이처럼 문제를 풀어 가게 만드는 역할"
  },
  {
    id: "uncle_in_law",
    name: "고모부",
    group: "가족",
    roleTag: "뚝딱 도구 도우미",
    personality: "차분하고 실용적으로 필요한 도구를 찾아줘요.",
    favoriteThemes: ["자동차", "우주", "공룡", "모험"],
    storyUse: "수리, 조립, 준비물을 도와주는 역할"
  },
  {
    id: "uncle",
    name: "삼촌",
    group: "가족",
    roleTag: "장난기 많은 모험 대장",
    personality: "재미있는 말과 장난으로 시현이를 웃게 해줘요.",
    favoriteThemes: ["공룡", "자동차", "우주", "바다", "모험"],
    storyUse: "신나는 출발 장면이나 웃음 장면을 만드는 역할"
  }
];

const PET_CAST = [
  {
    id: "nuni",
    name: "눈이",
    group: "고양이",
    roleTag: "새하얀 발자국 고양이",
    personality: "조용히 살금살금 걷고 작은 소리를 잘 들어요.",
    favoriteThemes: ["잠자리", "동물", "숲", "마법"],
    storyUse: "작은 발자국, 작은 소리, 숨은 단서를 찾아 주는 역할"
  },
  {
    id: "reumi",
    name: "름이",
    group: "고양이",
    roleTag: "몽글몽글 장난꾸러기 고양이",
    personality: "호기심이 많고 장난스럽지만 시현이를 좋아해요.",
    favoriteThemes: ["자동차", "동물", "잠자리", "모험"],
    storyUse: "귀여운 실수나 장난으로 이야기를 시작하게 만드는 역할"
  }
];

const COMFORT_TOY_CAST = [
  {
    id: "sicheoni",
    name: "시천이",
    group: "애착인형",
    roleTag: "시현이의 작은 용기 인형",
    personality: "시현이가 용기를 내야 할 때 조용히 곁에 있어줘요.",
    favoriteThemes: ["잠자리", "공룡", "우주", "모험"],
    storyUse: "시현이가 마지막 선택을 할 때 마음속 용기를 주는 역할"
  },
  {
    id: "rona",
    name: "로나",
    group: "애착인형",
    roleTag: "반짝 상상 인형",
    personality: "반짝이는 상상과 재미있는 아이디어를 좋아해요.",
    favoriteThemes: ["우주", "마법", "잠자리", "자동차"],
    storyUse: "상상 문을 열거나 반짝 물건을 발견하게 해 주는 역할"
  },
  {
    id: "gureumi",
    name: "구름이",
    group: "애착인형",
    roleTag: "폭신폭신 잠자리 인형",
    personality: "포근하고 느긋해서 마음을 차분하게 해줘요.",
    favoriteThemes: ["잠자리", "바다", "하늘", "동물"],
    storyUse: "잠자리, 감정 정리, 포근한 마무리 역할"
  }
];

const FRIEND_CAST = [
  { id: "yungyeom", name: "윤겸", group: "시현이 친구", roleTag: "튼튼한 해결사", personality: "용감하고 힘이 세지만 친구 말을 잘 들어요.", favoriteThemes: ["공룡", "자동차", "모험"], storyUse: "무거운 것을 옮기거나 친구들을 도와주는 역할" },
  { id: "sijun", name: "시준", group: "시현이 친구", roleTag: "호기심 탐험가", personality: "궁금한 것이 많고 새로운 길을 잘 찾아요.", favoriteThemes: ["우주", "공룡", "바다"], storyUse: "새로운 장소를 발견하고 질문을 던지는 역할" },
  { id: "seoa", name: "서아", group: "시현이 친구", roleTag: "다정한 이야기꾼", personality: "친구 마음을 잘 알아주고 예쁜 말을 해요.", favoriteThemes: ["동물", "잠자리", "전래"], storyUse: "속상한 친구를 달래고 따뜻한 마무리를 돕는 역할" },
  { id: "haneul", name: "하늘", group: "시현이 친구", roleTag: "상상력 대장", personality: "구름, 별, 로켓 같은 상상을 좋아해요.", favoriteThemes: ["우주", "잠자리", "마법"], storyUse: "상상 장면을 열어 주는 역할" },
  { id: "haeun", name: "하은", group: "시현이 친구", roleTag: "차분한 관찰자", personality: "작은 소리와 작은 변화를 잘 알아차려요.", favoriteThemes: ["동물", "바다", "잠자리"], storyUse: "단서를 발견하고 조용히 해결책을 제안하는 역할" },
  { id: "dasom", name: "다솜", group: "시현이 친구", roleTag: "즐거운 응원단장", personality: "친구들을 잘 응원하고 웃음을 만들어 줘요.", favoriteThemes: ["자동차", "동물", "놀이"], storyUse: "분위기를 밝게 만들고 후렴구를 함께 외치는 역할" },
  { id: "yuchan", name: "유찬", group: "시현이 친구", roleTag: "뚝딱뚝딱 발명가", personality: "고치고 만들고 조립하는 것을 좋아해요.", favoriteThemes: ["자동차", "우주", "공룡"], storyUse: "도구나 장치를 만들어 문제 해결을 돕는 역할" },
  { id: "hayul", name: "하율", group: "시현이 친구", roleTag: "반짝 아이디어 친구", personality: "기발한 생각을 잘 떠올리고 놀이를 좋아해요.", favoriteThemes: ["전래", "이솝", "마법"], storyUse: "예상 밖의 방법으로 길을 여는 역할" },
  { id: "iseo", name: "이서", group: "시현이 친구", roleTag: "꼼꼼한 약속 지킴이", personality: "순서를 잘 기억하고 친구들을 안전하게 챙겨요.", favoriteThemes: ["잠자리", "동물", "바다"], storyUse: "규칙, 약속, 순서를 정리해 주는 역할" }
];

const CLASSIC_CHARACTER_CAST = [
  { id: "snow_white", name: "백설공주", group: "명작", roleTag: "숲속의 다정한 공주", personality: "친절하고 친구들의 마음을 잘 살펴요.", favoriteThemes: ["동물", "전래", "잠자리", "숲"], storyUse: "숲속 친구들을 모으고 따뜻한 결말을 만드는 역할", safetyNote: "독사과, 마녀, 죽음 요소는 절대 사용하지 않는다." },
  { id: "seven_dwarfs", name: "일곱 난쟁이", group: "명작", roleTag: "뚝딱뚝딱 작은 일꾼들", personality: "작지만 힘을 모아 큰일을 해내요.", favoriteThemes: ["자동차", "공룡", "숲", "모험"], storyUse: "작은 도구와 협동으로 문제를 해결하는 역할", safetyNote: "위험한 광산, 어두운 공포 장면은 사용하지 않는다." },
  { id: "cinderella", name: "신데렐라", group: "명작", roleTag: "반짝 구두의 다정한 친구", personality: "차분하고 상냥하며 작은 도움에도 고마워해요.", favoriteThemes: ["전래", "잠자리", "동물", "마법"], storyUse: "반짝이는 물건이나 잃어버린 길을 찾는 역할", safetyNote: "괴롭힘, 학대, 가족 갈등 요소는 사용하지 않는다." },
  { id: "pinocchio", name: "피노키오", group: "명작", roleTag: "궁금한 나무 인형 친구", personality: "궁금한 것이 많고 실수해도 다시 배우려고 해요.", favoriteThemes: ["자동차", "모험", "이솝"], storyUse: "실수 후 솔직하게 말하고 해결을 돕는 역할", safetyNote: "벌을 받거나 위협받는 장면은 사용하지 않는다." },
  { id: "little_mermaid", name: "인어공주", group: "명작", roleTag: "바닷속 노래 친구", personality: "노래를 좋아하고 바다 친구들을 다정하게 챙겨요.", favoriteThemes: ["바다", "잠자리", "동물"], storyUse: "바닷길을 안내하거나 노래로 친구들을 안심시키는 역할", safetyNote: "목소리를 빼앗기거나 슬픈 결말은 사용하지 않는다." },
  { id: "red_riding_hood", name: "빨간 모자", group: "명작", roleTag: "숲길 배달 친구", personality: "씩씩하게 길을 걷고 선물을 전해요.", favoriteThemes: ["숲", "동물", "전래"], storyUse: "길 안내, 바구니 선물, 숲속 배달 역할", safetyNote: "늑대의 위협, 잡아먹힘 요소는 사용하지 않는다." },
  { id: "sun", name: "햇님", group: "전래", roleTag: "따뜻한 빛 친구", personality: "밝고 포근하게 길을 비춰 줘요.", favoriteThemes: ["잠자리", "우주", "전래", "바다"], storyUse: "어두운 길을 밝혀 주거나 마음을 따뜻하게 해 주는 역할", safetyNote: "뜨겁거나 위험한 태양 묘사는 사용하지 않는다." },
  { id: "moon", name: "달님", group: "전래", roleTag: "조용한 밤 친구", personality: "차분하고 다정하게 이야기를 들어줘요.", favoriteThemes: ["잠자리", "우주", "전래"], storyUse: "잠자리 동화에서 감정을 정리하고 포근한 마무리를 돕는 역할", safetyNote: "무서운 밤길이나 공포 분위기는 사용하지 않는다." },
  { id: "tiger", name: "호랑이", group: "전래", roleTag: "커다랗지만 순한 숲 친구", personality: "겉모습은 크지만 마음은 따뜻하고 장난기가 있어요.", favoriteThemes: ["전래", "동물", "공룡"], storyUse: "큰 힘으로 친구를 돕거나 웃음을 만드는 역할", safetyNote: "잡아먹힘, 추격, 위협 요소는 절대 사용하지 않는다." },
  { id: "swallow", name: "제비", group: "전래", roleTag: "작은 지도 배달부", personality: "빠르고 고마움을 잘 표현해요.", favoriteThemes: ["전래", "동물", "모험"], storyUse: "작은 지도나 편지를 전해 주는 역할", safetyNote: "다치는 장면은 사용하지 않는다." },
  { id: "mountain_spirit", name: "산신령", group: "전래", roleTag: "산속 반짝 길잡이", personality: "차분하고 지혜롭게 선택을 도와줘요.", favoriteThemes: ["전래", "숲", "잠자리"], storyUse: "반짝 물건을 보여 주며 시현이의 선택을 돕는 역할", safetyNote: "무섭거나 권위적인 심판자처럼 묘사하지 않는다." },
  { id: "rabbit", name: "토끼", group: "이솝", roleTag: "빠른 숲속 친구", personality: "빠르고 장난기가 있지만 마음은 착해요.", favoriteThemes: ["동물", "이솝", "자동차", "공룡"], storyUse: "빠르게 뛰어가 단서를 찾거나 실수 후 다시 배우는 역할", safetyNote: "비웃음이나 과한 경쟁 중심으로 쓰지 않는다." },
  { id: "turtle", name: "거북이", group: "이솝", roleTag: "느긋한 지혜 친구", personality: "천천히 가지만 끝까지 해내요.", favoriteThemes: ["동물", "바다", "이솝", "잠자리"], storyUse: "서두르지 않고 차분한 해결 방법을 알려주는 역할", safetyNote: "훈계식 교훈으로 직접 설명하지 않는다." },
  { id: "ant", name: "개미", group: "이솝", roleTag: "부지런한 작은 친구", personality: "작은 힘을 모아 큰일을 해내요.", favoriteThemes: ["동물", "이솝", "자동차"], storyUse: "작은 부품, 작은 길, 작은 단서를 모으는 역할", safetyNote: "게으름을 혼내는 구조로 쓰지 않는다." },
  { id: "grasshopper", name: "베짱이", group: "이솝", roleTag: "노래하는 숲속 친구", personality: "노래와 리듬을 좋아하고 분위기를 밝게 만들어요.", favoriteThemes: ["동물", "이솝", "잠자리"], storyUse: "후렴구, 노래, 리듬으로 동화의 반복 구조를 만드는 역할", safetyNote: "게으르다고 비난받는 구조로 쓰지 않는다." },
  { id: "fox", name: "여우", group: "이솝", roleTag: "꾀 많은 숲속 친구", personality: "생각이 빠르고 장난스러운 아이디어를 잘 내요.", favoriteThemes: ["이솝", "동물", "전래"], storyUse: "기발한 방법을 제안하되 마지막 선택은 시현이가 하게 만드는 역할", safetyNote: "속임수나 나쁜 꾀를 성공시키는 구조로 쓰지 않는다." },
  { id: "crane", name: "두루미", group: "이솝", roleTag: "긴 부리의 우아한 친구", personality: "천천히 살피고 서로 편한 방법을 생각해요.", favoriteThemes: ["동물", "바다", "이솝"], storyUse: "서로 다른 친구들이 함께 쓰는 방법을 알려주는 역할", safetyNote: "상대방을 골탕 먹이는 원작 구조는 사용하지 않는다." },
  { id: "lion", name: "사자", group: "이솝", roleTag: "커다란 마음의 왕", personality: "목소리는 크지만 친구를 아끼는 마음도 커요.", favoriteThemes: ["동물", "이솝", "공룡"], storyUse: "큰 소리나 큰 힘을 부드럽게 쓰는 법을 배우는 역할", safetyNote: "위협적이거나 무서운 왕으로 묘사하지 않는다." },
  { id: "mouse", name: "생쥐", group: "이솝", roleTag: "작지만 빠른 도움 친구", personality: "작고 빠르며 좁은 곳을 잘 지나가요.", favoriteThemes: ["동물", "이솝", "자동차"], storyUse: "작은 틈에서 단서를 찾는 역할", safetyNote: "잡아먹힐 위기 장면은 사용하지 않는다." },
  { id: "cloud", name: "구름", group: "자연", roleTag: "폭신폭신 하늘 친구", personality: "부드럽고 천천히 움직이며 마음을 편하게 해줘요.", favoriteThemes: ["잠자리", "우주", "바다"], storyUse: "이동 수단, 자장가, 감정 정리 역할", safetyNote: "폭풍이나 위험한 날씨로 묘사하지 않는다." },
  { id: "star_fairy", name: "별 요정", group: "자연", roleTag: "반짝 등불 친구", personality: "작은 별빛으로 길을 밝혀 줘요.", favoriteThemes: ["잠자리", "우주", "마법"], storyUse: "길 안내, 작은 소원, 자장가 분위기 역할", safetyNote: "무서운 마법이나 벌주는 마법은 사용하지 않는다." },
  { id: "rainbow", name: "무지개", group: "자연", roleTag: "알록달록 다리 친구", personality: "밝고 즐겁게 친구들을 이어 줘요.", favoriteThemes: ["동물", "바다", "우주", "전래"], storyUse: "서로 다른 장소를 연결하는 다리 역할", safetyNote: "높은 곳에서 떨어지는 위험 장면은 사용하지 않는다." }
];

window.STORY_LIBRARY = [

  { id:"built_car_garage_night", theme:"자동차", voiceTone:"bright", title:"반짝반짝 차고의 밤", desc:"시현이가 자동차 친구들의 밤 점검을 도와주는 기본 장문 동화", plotSeed:"밤이 된 차고에서 자동차 친구들이 잠자기 전 점검을 기다리고, 시현이가 정비사처럼 하나씩 살펴본다.", conflict:"자동차 친구들이 작은 불편함 때문에 편히 쉬지 못한다.", sihyeonRole:"시현이가 손전등과 작은 정비 도구를 들고 바퀴, 호스, 의자, 편지를 차례로 정리해 준다.", characters:["시현","포키","빨간 소방차","작은 버스"], mood:"포근함", readingMinutes:5, hasFullContent:true, contentKey:"car_garage_night" },
  { id:"built_dino_soft_steps", theme:"공룡", voiceTone:"adventure", title:"티라노의 조용한 발걸음", desc:"쿵쿵 걷던 티라노가 사뿐사뿐 걷는 법을 배우는 기본 장문 동화", plotSeed:"토토 티라노는 큰 발소리 때문에 친구들을 놀라게 하지만, 시현이와 함께 조용히 걷는 연습을 한다.", conflict:"힘이 센 발과 꼬리를 어떻게 다정하게 써야 할지 배워야 한다.", sihyeonRole:"시현이가 토토에게 발과 꼬리를 천천히 움직이는 방법을 알려주고 친구들을 편안하게 만든다.", characters:["시현","토토 티라노","브라키오"], mood:"다정함", readingMinutes:5, hasFullContent:true, contentKey:"dino_soft_steps" },
  /* --- 이솝우화 (20개) --- */
  { id:"aesop_1", theme:"이솝우화", voiceTone:"gentle", title:"사자와 생쥐", desc:"작은 생쥐가 사자를 돕는 이야기", plotSeed:"사자가 생쥐를 살려주고 훗날 생쥐가 그물을 갉아 사자를 구함", conflict:"작은 힘도 큰 도움이 될 수 있음을 깨달음", sihyeonRole:"시현이가 안전 가위를 가져와 생쥐와 함께 그물을 끊어줌", characters:["시현","사자","생쥐"], mood:"따뜻함", readingMinutes:5, hasFullContent:false },
  { id:"aesop_2", theme:"이솝우화", voiceTone:"gentle", title:"개미와 베짱이", desc:"부지런한 개미와 노래하는 베짱이", plotSeed:"여름내 일한 개미와 놀던 베짱이가 겨울을 맞이함", conflict:"준비하지 않으면 위기가 찾아온다", sihyeonRole:"시현이가 베짱이에게 튼튼한 장난감 텐트를 지어주며 겨울을 보낼 수 있게 도움", characters:["시현","개미","베짱이"], mood:"나눔", readingMinutes:5, hasFullContent:false },
  { id:"aesop_3", theme:"이솝우화", voiceTone:"gentle", title:"토끼와 거북이", desc:"빠른 토끼와 느린 거북이의 경주", plotSeed:"토끼가 자만해 낮잠을 자는 사이 거북이가 꾸준히 걸어 승리", conflict:"꾸준함과 포기하지 않는 마음의 중요성", sihyeonRole:"시현이가 경주로 중간에서 깃발을 흔들며 거북이를 끝까지 응원함", characters:["시현","토끼","거북이"], mood:"응원", readingMinutes:5, hasFullContent:false },
  { id:"aesop_4", theme:"이솝우화", voiceTone:"gentle", title:"여우와 신 포도", desc:"높은 곳의 포도를 포기한 여우", plotSeed:"포도를 따지 못하자 여우가 시어서 맛없을 거라며 포기", conflict:"어려움을 핑계로 쉽게 포기하려는 마음", sihyeonRole:"시현이가 장난감 사다리차를 출동시켜 여우가 포도를 따도록 도와줌", characters:["시현","여우"], mood:"성취감", readingMinutes:5, hasFullContent:false },
  { id:"aesop_5", theme:"이솝우화", voiceTone:"gentle", title:"양치기 소년", desc:"거짓말을 반복한 소년", plotSeed:"늑대가 왔다고 장난치다 진짜 늑대가 왔을 때 아무도 오지 않음", conflict:"거짓말은 신뢰를 잃게 만든다", sihyeonRole:"시현이가 소방차 사이렌 장난감을 크게 울려 진짜 늑대를 쫓아내고 진실의 중요성을 알려줌", characters:["시현","소년","늑대"], mood:"교훈", readingMinutes:5, hasFullContent:false },
  { id:"aesop_6", theme:"이솝우화", voiceTone:"gentle", title:"시골 쥐와 도시 쥐", desc:"시골과 도시의 삶을 비교하는 두 쥐", plotSeed:"도시 쥐가 시골을 비웃었지만 도시는 고양이 때문에 위험함", conflict:"화려함보다 마음 편안한 것이 최고다", sihyeonRole:"시현이가 장난감 기차를 운전해 두 쥐가 안전하게 숲속 피크닉을 즐기게 해줌", characters:["시현","시골쥐","도시쥐"], mood:"편안함", readingMinutes:5, hasFullContent:false },
  { id:"aesop_7", theme:"이솝우화", voiceTone:"gentle", title:"까마귀와 물병", desc:"목마른 까마귀의 지혜", plotSeed:"물이 조금 남은 병에 돌을 채워 넣어 물을 마심", conflict:"포기하지 않고 생각하면 방법을 찾을 수 있다", sihyeonRole:"시현이가 미니 굴삭기로 까마귀를 도와 조약돌을 함께 병에 넣어줌", characters:["시현","까마귀"], mood:"지혜", readingMinutes:5, hasFullContent:false },
  { id:"aesop_8", theme:"이솝우화", voiceTone:"gentle", title:"해와 바람", desc:"나그네의 외투 벗기기 대결", plotSeed:"바람은 세게 불어 실패하지만 해는 따뜻하게 비춰 성공", conflict:"강압보다 따뜻함이 사람의 마음을 움직인다", sihyeonRole:"시현이가 나그네에게 따뜻한 장난감 핫팩을 건네며 햇님과 함께 웃게 만듦", characters:["시현","햇님","바람","나그네"], mood:"따뜻함", readingMinutes:5, hasFullContent:false },
  { id:"aesop_9", theme:"이솝우화", voiceTone:"gentle", title:"욕심 많은 개", desc:"물에 비친 고기를 탐낸 개", plotSeed:"고기를 물고 가다 물에 비친 자신의 고기를 뺏으려다 놓침", conflict:"지나친 욕심은 가진 것마저 잃게 한다", sihyeonRole:"시현이가 뜰채를 가져와 물에 빠진 고기를 건져주고 개를 달래줌", characters:["시현","개"], mood:"다정함", readingMinutes:5, hasFullContent:false },
  { id:"aesop_10", theme:"이솝우화", voiceTone:"gentle", title:"여우와 두루미", desc:"서로 다른 그릇에 음식을 준 여우와 두루미", plotSeed:"접시와 긴 호리병으로 서로 골탕 먹임", conflict:"상대방의 입장을 배려하지 않으면 사이가 멀어진다", sihyeonRole:"시현이가 여우와 두루미 모두 먹기 편한 마법의 동그란 그릇을 선물함", characters:["시현","여우","두루미"], mood:"배려", readingMinutes:5, hasFullContent:false },
  { id:"aesop_11", theme:"이솝우화", voiceTone:"gentle", title:"금도끼 은도끼 (이솝)", desc:"정직한 헤르메스와 나무꾼", plotSeed:"연못에 도끼를 빠뜨린 나무꾼이 정직함으로 상을 받음", conflict:"거짓말의 유혹과 정직함", sihyeonRole:"시현이가 잠수함 장난감을 타고 연못에 들어가 진짜 쇠도끼를 찾아줌", characters:["시현","나무꾼","신"], mood:"정직", readingMinutes:5, hasFullContent:false },
  { id:"aesop_12", theme:"이솝우화", voiceTone:"gentle", title:"사슴과 사자", desc:"뿔을 자랑하던 사슴", plotSeed:"아름다운 뿔을 자랑하다 숲에 걸려 사자에게 잡힐 뻔함", conflict:"자만하던 것이 오히려 약점이 될 수 있다", sihyeonRole:"시현이가 나뭇가지를 치워 사슴의 뿔을 빼주고 사자 몰래 숨겨줌", characters:["시현","사슴","사자"], mood:"안도감", readingMinutes:5, hasFullContent:false },
  { id:"aesop_13", theme:"이솝우화", voiceTone:"gentle", title:"개구리와 황소", desc:"황소만큼 커지려던 개구리", plotSeed:"황소를 보고 샘이 나서 배를 부풀리다 터질 뻔함", conflict:"자신의 진짜 모습을 인정하고 사랑해야 함", sihyeonRole:"시현이가 개구리의 배를 살살 문질러 바람을 빼주고 개구리의 멋진 점프를 칭찬함", characters:["시현","개구리","황소"], mood:"자존감", readingMinutes:5, hasFullContent:false },
  { id:"aesop_14", theme:"이솝우화", voiceTone:"gentle", title:"박쥐와 족제비", desc:"위기를 모면한 박쥐", plotSeed:"새라고 우기고, 쥐라고 우기며 두 번 목숨을 구함", conflict:"상황에 따라 말을 바꾸는 것의 위태로움", sihyeonRole:"시현이가 박쥐에게 안전한 장난감 동굴을 만들어주며 숨을 곳을 제공함", characters:["시현","박쥐","족제비"], mood:"재치", readingMinutes:5, hasFullContent:false },
  { id:"aesop_15", theme:"이솝우화", voiceTone:"gentle", title:"농부와 뱀", desc:"얼어죽어가는 뱀을 살려준 농부", plotSeed:"따뜻하게 해줬으나 본성을 이기지 못한 뱀", conflict:"친절을 베풀어도 변하지 않는 것들이 있다", sihyeonRole:"시현이가 뱀을 장난감 통에 안전하게 담아 숲속 깊은 곳에 놓아줌", characters:["시현","농부","뱀"], mood:"안전", readingMinutes:5, hasFullContent:false },
  { id:"aesop_16", theme:"이솝우화", voiceTone:"gentle", title:"사자와 멧돼지", desc:"물 때문에 싸우던 사자와 멧돼지", plotSeed:"서로 싸우다 독수리들의 밥이 될 뻔함", conflict:"무의미한 다툼은 결국 둘 다 망친다", sihyeonRole:"시현이가 커다란 물뿌리개로 맑은 연못을 두 개 만들어 싸움을 말림", characters:["시현","사자","멧돼지"], mood:"평화", readingMinutes:5, hasFullContent:false },
  { id:"aesop_17", theme:"이솝우화", voiceTone:"gentle", title:"당나귀와 소금", desc:"꾀를 부리던 당나귀", plotSeed:"소금을 물에 녹여 짐을 줄이려다 솜을 짊어지게 됨", conflict:"요행을 바라면 오히려 더 큰 고생을 한다", sihyeonRole:"시현이가 트럭을 몰고 와서 솜을 대신 실어주며 당나귀에게 정직을 가르침", characters:["시현","당나귀","상인"], mood:"교훈", readingMinutes:5, hasFullContent:false },
  { id:"aesop_18", theme:"이솝우화", voiceTone:"gentle", title:"고양이 목에 방울 달기", desc:"생쥐들의 무의미한 회의", plotSeed:"방울을 달자는 좋은 아이디어가 있지만 아무도 나서지 못함", conflict:"실천하지 못할 계획은 소용이 없다", sihyeonRole:"시현이가 장난감 로봇을 보내 고양이 목에 예쁜 리본 방울을 몰래 달아줌", characters:["시현","쥐들","고양이"], mood:"성취", readingMinutes:5, hasFullContent:false },
  { id:"aesop_19", theme:"이솝우화", voiceTone:"gentle", title:"황금알을 낳는 거위", desc:"욕심 부린 농부", plotSeed:"매일 하나씩 낳는 거위의 배를 갈랐지만 아무것도 없음", conflict:"과한 욕심이 모든 것을 망친다", sihyeonRole:"시현이가 농부를 말리고 거위에게 맛있는 모이를 주며 매일 기다리자고 설득함", characters:["시현","농부","거위"], mood:"기다림", readingMinutes:5, hasFullContent:false },
  { id:"aesop_20", theme:"이솝우화", voiceTone:"gentle", title:"아빠와 아들들", desc:"협동을 가르치는 막대기", plotSeed:"막대기 하나는 꺾이지만 묶으면 꺾이지 않음", conflict:"뭉치면 살고 흩어지면 부러진다", sihyeonRole:"시현이가 아들들과 함께 거대한 블록 성을 쌓으며 협동의 힘을 보여줌", characters:["시현","아빠","아들들"], mood:"협동", readingMinutes:5, hasFullContent:false },

  /* --- 한국 전래동화 (20개) --- */
  { id:"folk_1", theme:"전래동화", voiceTone:"folk", title:"흥부와 놀부", desc:"착한 흥부와 박", plotSeed:"제비 다리를 고쳐주고 박에서 금은보화가 나옴", conflict:"착한 마음씨와 욕심의 결과", sihyeonRole:"시현이가 장난감 구급상자로 제비 다리를 치료해주고 흥부와 춤을 춤", characters:["시현","흥부","제비"], mood:"기쁨", readingMinutes:5, hasFullContent:false },
  { id:"folk_2", theme:"전래동화", voiceTone:"folk", title:"콩쥐팥쥐", desc:"착한 콩쥐를 돕는 동물들", plotSeed:"밑빠진 독에 물 붓기 등 어려운 일을 두꺼비와 소가 도움", conflict:"어려움 속에서도 착한 마음을 잃지 않음", sihyeonRole:"시현이가 거대한 장난감 블록으로 밑빠진 독의 구멍을 완벽하게 막아줌", characters:["시현","콩쥐","두꺼비"], mood:"따뜻함", readingMinutes:5, hasFullContent:false },
  { id:"folk_3", theme:"전래동화", voiceTone:"folk", title:"해와 달이 된 오누이", desc:"호랑이를 피해 하늘로 간 오누이", plotSeed:"호랑이를 피해 동아줄을 타고 올라가 해와 달이 됨", conflict:"무서운 호랑이의 위협과 탈출", sihyeonRole:"시현이가 헬리콥터 장난감을 타고 날아와 오누이를 하늘로 안전하게 구출함", characters:["시현","오누이","호랑이"], mood:"용기", readingMinutes:5, hasFullContent:false },
  { id:"folk_4", theme:"전래동화", voiceTone:"folk", title:"혹부리 영감", desc:"노래 주머니 혹", plotSeed:"도깨비가 혹에서 노래가 나오는 줄 알고 혹을 떼어감", conflict:"긍정적인 마음이 위기를 기회로 만듦", sihyeonRole:"시현이가 도깨비들에게 반짝이는 장난감 마이크를 선물하여 혹을 떼도록 도와줌", characters:["시현","혹부리영감","도깨비"], mood:"흥겨움", readingMinutes:5, hasFullContent:false },
  { id:"folk_5", theme:"전래동화", voiceTone:"folk", title:"선녀와 나무꾼", desc:"하늘로 올라간 선녀", plotSeed:"날개옷을 숨긴 나무꾼과 하늘로 돌아간 선녀", conflict:"가족의 사랑과 그리움", sihyeonRole:"시현이가 하늘까지 닿는 거대한 구름 사다리를 만들어 나무꾼을 올려보냄", characters:["시현","나무꾼","선녀"], mood:"신비로움", readingMinutes:5, hasFullContent:false },
  { id:"folk_6", theme:"전래동화", voiceTone:"folk", title:"견우와 직녀", desc:"오작교에서 만나는 두 사람", plotSeed:"일년에 한 번 까치와 까마귀가 다리를 만들어 만남", conflict:"헤어짐의 슬픔과 칠월 칠석의 기적", sihyeonRole:"시현이가 멋진 우주선 다리를 놓아 까치들이 힘들지 않게 오작교를 만들어줌", characters:["시현","견우","직녀"], mood:"감동", readingMinutes:5, hasFullContent:false },
  { id:"folk_7", theme:"전래동화", voiceTone:"folk", title:"토끼와 자라", desc:"용궁에 간 토끼", plotSeed:"간을 두고 왔다고 속여 용궁을 탈출하는 토끼", conflict:"위기 상황에서의 기지와 재치", sihyeonRole:"시현이가 용궁 의사가 되어 딸기 시럽 약을 용왕님께 주고 토끼를 살려냄", characters:["시현","토끼","자라"], mood:"재치", readingMinutes:5, hasFullContent:false },
  { id:"folk_8", theme:"전래동화", voiceTone:"folk", title:"심청전", desc:"아버지를 위해 인당수에 빠진 심청", plotSeed:"효심으로 눈을 뜬 심봉사", conflict:"아버지를 사랑하는 지극한 마음", sihyeonRole:"시현이가 잠수함을 타고 인당수에 들어가 심청이를 안전하게 용궁으로 데려감", characters:["시현","심청","아버지"], mood:"효도", readingMinutes:5, hasFullContent:false },
  { id:"folk_9", theme:"전래동화", voiceTone:"folk", title:"우렁각시", desc:"우렁이 속에서 나온 각시", plotSeed:"우렁이에서 나온 각시가 맛있는 밥을 지어놓음", conflict:"숨겨진 은혜와 행복", sihyeonRole:"시현이가 장난감 요리사가 되어 우렁각시와 함께 맛있는 볶음밥을 만듦", characters:["시현","우렁각시","청년"], mood:"포근함", readingMinutes:5, hasFullContent:false },
  { id:"folk_10", theme:"전래동화", voiceTone:"folk", title:"은혜 갚은 까치", desc:"구렁이에게서 선비를 구한 까치", plotSeed:"자신을 살려준 선비를 위해 종에 머리를 부딪쳐 구함", conflict:"은혜를 잊지 않는 동물의 마음", sihyeonRole:"시현이가 드론을 날려 거대한 종을 대신 울려주어 까치가 다치지 않게 함", characters:["시현","선비","까치"], mood:"감동", readingMinutes:5, hasFullContent:false },
  { id:"folk_11", theme:"전래동화", voiceTone:"folk", title:"팥죽 할머니와 호랑이", desc:"힘을 합쳐 호랑이를 물리친 친구들", plotSeed:"알밤, 자라, 멍석, 지게가 모여 호랑이를 혼내줌", conflict:"약한 이들이 모이면 강한 호랑이도 이길 수 있다", sihyeonRole:"시현이가 포크레인으로 호랑이를 강 밖으로 밀어내며 할머니를 지켜줌", characters:["시현","할머니","호랑이"], mood:"통쾌함", readingMinutes:5, hasFullContent:false },
  { id:"folk_12", theme:"전래동화", voiceTone:"folk", title:"호랑이와 곶감", desc:"곶감이 젤 무서운 호랑이", plotSeed:"우는 아이가 곶감 소리에 울음을 그치자 곶감을 괴물로 착각", conflict:"모르는 것에 대한 무서운 착각", sihyeonRole:"시현이가 호랑이 입에 달콤한 곶감을 쏙 넣어주며 맛있는 간식임을 알려줌", characters:["시현","호랑이","곶감"], mood:"유쾌함", readingMinutes:5, hasFullContent:false },
  { id:"folk_13", theme:"전래동화", voiceTone:"folk", title:"의좋은 형제", desc:"밤새 볏단을 나른 형제", plotSeed:"서로를 위해 자신의 볏단을 상대방의 논에 몰래 갖다 놓음", conflict:"서로를 아끼고 위하는 깊은 형제애", sihyeonRole:"시현이가 장난감 트랙터로 형제의 볏단을 한 번에 싣고 날라줌", characters:["시현","형","아우"], mood:"따뜻함", readingMinutes:5, hasFullContent:false },
  { id:"folk_14", theme:"전래동화", voiceTone:"folk", title:"도깨비 방망이", desc:"금 나와라 뚝딱", plotSeed:"착한 청년은 방망이를 얻고 욕심쟁이는 매를 맞음", conflict:"착한 마음에는 복이 오고 욕심에는 벌이 온다", sihyeonRole:"시현이가 도깨비 방망이를 휘둘러 맛있는 젤리와 초콜릿 산을 만들어냄", characters:["시현","착한청년","도깨비"], mood:"신남", readingMinutes:5, hasFullContent:false },
  { id:"folk_15", theme:"전래동화", voiceTone:"folk", title:"소가 된 게으름뱅이", desc:"일하기 싫어 소가 된 남자", plotSeed:"소 탈을 쓰고 진짜 소가 되어 고생하다 무를 먹고 다시 사람이 됨", conflict:"게으름의 댓가와 성실함의 중요성", sihyeonRole:"시현이가 소가 된 남자에게 싱싱한 무를 찾아 건네주어 사람으로 돌아오게 함", characters:["시현","게으름뱅이","노인"], mood:"교훈", readingMinutes:5, hasFullContent:false },
  { id:"folk_16", theme:"전래동화", voiceTone:"folk", title:"요술 항아리", desc:"넣으면 끝없이 나오는 항아리", plotSeed:"동전 한 닢을 넣으면 끝없이 동전이 나오는 신기한 항아리", conflict:"끝없는 욕심을 부리면 항아리가 깨져버림", sihyeonRole:"시현이가 항아리에 장난감 자동차를 넣어 친구들에게 나누어주는 마법을 부림", characters:["시현","농부","욕심쟁이"], mood:"나눔", readingMinutes:5, hasFullContent:false },
  { id:"folk_17", theme:"전래동화", voiceTone:"folk", title:"삼년고개", desc:"넘어지면 삼년밖에 못 사는 고개", plotSeed:"고개에서 넘어지고 절망하던 노인이 계속 넘어져 수명을 늘림", conflict:"생각을 바꾸면 최악의 상황도 최고의 행운이 됨", sihyeonRole:"시현이가 노인과 함께 삼년고개에서 신나게 구르기 놀이를 하며 웃음을 찾아줌", characters:["시현","노인","아이"], mood:"긍정", readingMinutes:5, hasFullContent:false },
  { id:"folk_18", theme:"전래동화", voiceTone:"folk", title:"호랑이 형님", desc:"사람이 어머니인 줄 아는 호랑이", plotSeed:"나무꾼의 꾀에 속아 호랑이가 효도를 하다 죽어서도 은혜를 갚음", conflict:"어리석지만 순수한 효도와 슬픔", sihyeonRole:"시현이가 호랑이에게 멋진 왕관을 씌워주며 숲속 최고의 효자라고 칭찬함", characters:["시현","호랑이","나무꾼"], mood:"감동", readingMinutes:5, hasFullContent:false },
  { id:"folk_19", theme:"전래동화", voiceTone:"folk", title:"방귀쟁이 며느리", desc:"방귀로 배를 따는 며느리", plotSeed:"엄청난 방귀 냄새로 쫓겨날 뻔했으나 방귀 힘으로 과일을 따서 칭찬받음", conflict:"단점이라고 생각했던 것이 엄청난 장점이 됨", sihyeonRole:"시현이가 며느리의 방귀 바람을 타고 종이비행기를 멀리멀리 날려보냄", characters:["시현","며느리","시아버지"], mood:"코믹함", readingMinutes:5, hasFullContent:false },
  { id:"folk_20", theme:"전래동화", voiceTone:"folk", title:"빨간 부채 파란 부채", desc:"코가 길어지는 부채", plotSeed:"빨간 부채를 부치면 코가 길어지고 파란 부채는 짧아짐", conflict:"장난을 심하게 치면 큰일이 난다", sihyeonRole:"시현이가 파란 부채를 부쳐서 코가 길어진 할아버지의 코를 원래대로 돌려놓음", characters:["시현","할아버지"], mood:"신기함", readingMinutes:5, hasFullContent:false },

  /* --- 세계 명작동화 (30개) --- */
  { id:"classic_1", theme:"세계명작", voiceTone:"magical", title:"아기 돼지 삼형제", desc:"벽돌집을 지은 막내", plotSeed:"짚, 나무로 지은 집은 늑대에게 날아가고 튼튼한 벽돌집만 살아남음", conflict:"게으름과 튼튼한 준비성의 차이", sihyeonRole:"시현이가 포크레인으로 막내 돼지와 함께 크고 튼튼한 철근 콘크리트 집을 지어줌", characters:["시현","아기돼지","늑대"], mood:"든든함", readingMinutes:5, hasFullContent:false },
  { id:"classic_2", theme:"세계명작", voiceTone:"magical", title:"미운 아기 오리", desc:"백조가 된 미운 오리", plotSeed:"놀림받던 오리가 추운 겨울을 이겨내고 아름다운 백조로 성장함", conflict:"다름을 인정받지 못하는 외로움과 진짜 나를 찾는 과정", sihyeonRole:"시현이가 오리에게 튜브를 태워주고 세상에서 가장 멋진 오리라고 안아줌", characters:["시현","아기오리","백조"], mood:"위로", readingMinutes:5, hasFullContent:false },
  { id:"classic_3", theme:"세계명작", voiceTone:"magical", title:"신데렐라", desc:"유리구두와 마법", plotSeed:"요정의 도움으로 파티에 간 신데렐라가 유리구두를 남기고 옴", conflict:"착한 마음은 결국 행복한 기적을 만난다", sihyeonRole:"시현이가 호박을 으리으리한 스포츠카로 변신시켜 신데렐라를 에스코트함", characters:["시현","신데렐라","요정"], mood:"마법", readingMinutes:5, hasFullContent:false },
  { id:"classic_4", theme:"세계명작", voiceTone:"magical", title:"백설공주", desc:"일곱 난쟁이와 사과", plotSeed:"아름다움을 질투한 왕비가 독사과를 주지만 난쟁이와 왕자가 구함", conflict:"지나친 질투는 자신을 망치고 착한 마음은 보호받는다", sihyeonRole:"시현이가 왕비의 독사과를 신선한 딸기로 휙 바꿔치기하여 공주를 지킴", characters:["시현","백설공주","난쟁이"], mood:"모험", readingMinutes:5, hasFullContent:false },
  { id:"classic_5", theme:"세계명작", voiceTone:"magical", title:"잭과 콩나무", desc:"하늘로 자란 콩나무", plotSeed:"마법의 콩이 하늘로 자라 거인의 성에 올라 황금 거위를 가져옴", conflict:"두려움을 이겨내고 거인에게서 탈출하는 모험", sihyeonRole:"시현이가 소방차의 긴 사다리를 뻗어 잭이 거인 성에서 안전하게 내려오게 함", characters:["시현","잭","거인"], mood:"용기", readingMinutes:5, hasFullContent:false },
  { id:"classic_6", theme:"세계명작", voiceTone:"magical", title:"피노키오", desc:"코가 길어지는 인형", plotSeed:"말썽쟁이 피노키오가 고래 뱃속에서 제페토 할아버지를 구하고 진짜 사람이 됨", conflict:"거짓말의 대가와 진짜 용기를 내는 성장", sihyeonRole:"시현이가 잠수함을 타고 고래 입을 벌려 피노키오와 할아버지를 구출함", characters:["시현","피노키오","고래"], mood:"스릴", readingMinutes:5, hasFullContent:false },
  { id:"classic_7", theme:"세계명작", voiceTone:"magical", title:"빨간 모자", desc:"할머니 댁에 가는 길", plotSeed:"늑대가 할머니인 척 빨간 모자를 속이지만 사냥꾼이 구해줌", conflict:"낯선 사람의 달콤한 말을 조심해야 한다", sihyeonRole:"시현이가 경찰차를 타고 삐용삐용 나타나 늑대를 숲 멀리 도망가게 만듦", characters:["시현","빨간모자","늑대"], mood:"안심", readingMinutes:5, hasFullContent:false },
  { id:"classic_8", theme:"세계명작", voiceTone:"magical", title:"헨젤과 그레텔", desc:"과자 집의 마녀", plotSeed:"길을 잃은 남매가 과자 집의 마녀를 속이고 보물을 얻어 탈출함", conflict:"위험한 유혹을 이겨내고 남매가 힘을 합침", sihyeonRole:"시현이가 마녀 몰래 과자 집의 지붕을 떼어내 남매와 함께 신나게 나눠 먹음", characters:["시현","헨젤","그레텔"], mood:"스릴", readingMinutes:5, hasFullContent:false },
  { id:"classic_9", theme:"세계명작", voiceTone:"magical", title:"엄지공주", desc:"작은 공주의 모험", plotSeed:"꽃에서 태어난 엄지공주가 두꺼비와 두더지를 피해 제비와 함께 꽃의 나라로 감", conflict:"자신에게 맞는 진짜 세상을 찾아가는 긴 여정", sihyeonRole:"시현이가 잎사귀 보트를 만들어 엄지공주가 강을 안전하게 건너도록 노를 저어줌", characters:["시현","엄지공주","제비"], mood:"아름다움", readingMinutes:5, hasFullContent:false },
  { id:"classic_10", theme:"세계명작", voiceTone:"magical", title:"벌거벗은 임금님", desc:"보이지 않는 옷", plotSeed:"착한 사람에게만 보인다는 거짓말에 속아 왕이 알몸으로 행진함", conflict:"허영심과 솔직하게 진실을 말하는 용기", sihyeonRole:"시현이가 왕에게 따뜻하고 멋진 진짜 털망토를 입혀주어 부끄럽지 않게 해줌", characters:["시현","임금님","재봉사"], mood:"솔직함", readingMinutes:5, hasFullContent:false },
  { id:"classic_11", theme:"세계명작", voiceTone:"magical", title:"인어공주", desc:"바다 밖을 꿈꾸는 인어", plotSeed:"목소리를 주고 다리를 얻어 육지로 나가지만 왕자의 마음을 얻기 위해 애씀", conflict:"간절한 소망과 희생의 슬픔", sihyeonRole:"시현이가 인어공주에게 마법의 나팔을 선물하여 아름다운 목소리를 되찾게 해줌", characters:["시현","인어공주","마녀"], mood:"신비로움", readingMinutes:5, hasFullContent:false },
  { id:"classic_12", theme:"세계명작", voiceTone:"magical", title:"성냥팔이 소녀", desc:"추운 겨울밤의 성냥", plotSeed:"추운 거리에서 성냥을 그으며 따뜻한 환상을 보고 하늘로 감", conflict:"가난과 추위 속에서도 잃지 않은 희망", sihyeonRole:"시현이가 소방차의 따뜻한 히터를 틀어주고 소녀에게 포근한 담요를 덮어줌", characters:["시현","소녀"], mood:"위로", readingMinutes:5, hasFullContent:false },
  { id:"classic_13", theme:"세계명작", voiceTone:"magical", title:"브레멘 음악대", desc:"나이 든 동물들의 모험", plotSeed:"버림받은 당나귀, 개, 고양이, 닭이 모여 도둑을 쫓아내고 음악대가 됨", conflict:"늙고 약해도 힘을 합치면 새로운 꿈을 이룬다", sihyeonRole:"시현이가 드럼을 치며 동물들과 함께 쿵짝쿵짝 세상에서 제일 신나는 밴드를 만듦", characters:["시현","당나귀","개","고양이","닭"], mood:"흥겨움", readingMinutes:5, hasFullContent:false },
  { id:"classic_14", theme:"세계명작", voiceTone:"magical", title:"잠자는 숲속의 공주", desc:"물레가시와 긴 잠", plotSeed:"마녀의 저주로 백 년 동안 잠든 공주를 왕자가 깨움", conflict:"오랜 기다림과 피할 수 없는 마법의 힘", sihyeonRole:"시현이가 마법의 알람시계 장난감을 따르릉 울려 백 년 잠든 공주를 번쩍 깨움", characters:["시현","공주","왕자"], mood:"신비로움", readingMinutes:5, hasFullContent:false },
  { id:"classic_15", theme:"세계명작", voiceTone:"magical", title:"장화 신은 고양이", desc:"지혜로운 고양이의 활약", plotSeed:"말하는 고양이가 지혜와 꾀로 주인을 귀족으로 만들고 거인을 물리침", conflict:"지혜와 용기가 있으면 가난도 극복할 수 있다", sihyeonRole:"시현이가 고양이에게 아주 멋진 스포츠 고글을 선물하여 거인 몰래 빠져나가게 함", characters:["시현","고양이","거인"], mood:"재치", readingMinutes:5, hasFullContent:false },
  { id:"classic_16", theme:"세계명작", voiceTone:"magical", title:"라푼젤", desc:"탑에 갇힌 긴 머리 소녀", plotSeed:"마녀에 의해 탑에 갇힌 라푼젤이 머리카락을 내려 왕자와 만남", conflict:"갇혀있던 세상에서 벗어나 진정한 자유를 얻는 모험", sihyeonRole:"시현이가 헬리콥터를 타고 탑 꼭대기로 날아가 라푼젤을 태우고 푸른 하늘로 구출함", characters:["시현","라푼젤","마녀"], mood:"자유", readingMinutes:5, hasFullContent:false },
  { id:"classic_17", theme:"세계명작", voiceTone:"magical", title:"알라딘", desc:"마술 램프와 지니", plotSeed:"동굴에서 램프를 주운 알라딘이 지니의 도움으로 마법사를 물리침", conflict:"마법의 힘과 이를 탐내는 악당과의 대결", sihyeonRole:"시현이가 마법의 양탄자를 로켓 썰매로 튜닝하여 알라딘과 하늘을 쌩쌩 날아다님", characters:["시현","알라딘","지니"], mood:"신남", readingMinutes:5, hasFullContent:false },
  { id:"classic_18", theme:"세계명작", voiceTone:"magical", title:"이상한 나라의 앨리스", desc:"토끼를 따라간 신비한 세계", plotSeed:"시계를 보는 토끼를 따라가다 몸이 커졌다 작아지는 마법의 나라를 탐험함", conflict:"상식이 통하지 않는 이상한 세상에서의 모험", sihyeonRole:"시현이가 앨리스와 함께 거대한 카드 병정들과 신나는 블록 볼링 놀이를 함", characters:["시현","앨리스","토끼"], mood:"호기심", readingMinutes:5, hasFullContent:false },
  { id:"classic_19", theme:"세계명작", voiceTone:"magical", title:"피터팬", desc:"어른이 되지 않는 나라", plotSeed:"웬디와 함께 네버랜드로 날아가 후크 선장과 신나는 대결을 펼침", conflict:"영원한 동심과 째깍악어, 후크선장의 위협", sihyeonRole:"시현이가 요정 가루를 뿌리고 팅커벨과 함께 네버랜드 하늘을 붕붕 날아다님", characters:["시현","피터팬","팅커벨"], mood:"신남", readingMinutes:5, hasFullContent:false },
  { id:"classic_20", theme:"세계명작", voiceTone:"magical", title:"오즈의 마법사", desc:"토네이도를 타고 간 세상", plotSeed:"도로시가 허수아비, 양철꾼, 사자와 함께 오즈의 마법사를 찾아 나섬", conflict:"자신에게 부족한 것을 찾기 위한 모험과 우정", sihyeonRole:"시현이가 장난감 기차를 운전하여 도로시와 친구들을 에메랄드 성까지 태워다 줌", characters:["시현","도로시","사자"], mood:"우정", readingMinutes:5, hasFullContent:false },
  { id:"classic_21", theme:"세계명작", voiceTone:"magical", title:"미녀와 야수", desc:"야수의 성에 갇힌 미녀", plotSeed:"마법에 걸려 야수가 된 왕자가 벨의 진정한 사랑으로 마법이 풀림", conflict:"외모가 아닌 진짜 마음을 바라보는 사랑", sihyeonRole:"시현이가 야수의 성에 아주 예쁜 장미꽃 화단을 심어주어 야수가 환하게 웃게 함", characters:["시현","벨","야수"], mood:"따뜻함", readingMinutes:5, hasFullContent:false },
  { id:"classic_22", theme:"세계명작", voiceTone:"magical", title:"백조의 호수", desc:"백조가 된 공주", plotSeed:"마법사 때문에 낮에는 백조, 밤에는 사람이 되는 공주와 왕자의 이야기", conflict:"나쁜 마법을 깨기 위한 진정한 마음의 맹세", sihyeonRole:"시현이가 요술 물총을 쏘아 마법사를 멀리 쫓아버리고 백조들을 모두 구출함", characters:["시현","오데트","왕자"], mood:"용기", readingMinutes:5, hasFullContent:false },
  { id:"classic_23", theme:"세계명작", voiceTone:"magical", title:"피리 부는 사나이", desc:"쥐를 쫓아내는 피리 소리", plotSeed:"마을의 쥐를 피리 소리로 쫓아냈으나 약속을 어긴 마을 사람들에게 벌을 줌", conflict:"약속을 어기면 소중한 것을 잃게 된다", sihyeonRole:"시현이가 사나이 옆에서 멋진 탬버린을 쳐서 쥐들이 신나게 춤추며 숲으로 가게 함", characters:["시현","피리부는사나이"], mood:"신비로움", readingMinutes:5, hasFullContent:false },
  { id:"classic_24", theme:"세계명작", voiceTone:"magical", title:"호두까기 인형", desc:"장난감들의 밤", plotSeed:"크리스마스 밤 호두까기 인형이 생쥐 대왕을 물리치고 왕자로 변함", conflict:"꿈과 환상의 세계에서 펼쳐지는 생쥐 군대와의 대결", sihyeonRole:"시현이가 자동차 장난감 부대를 지휘하여 호두까기 인형을 도와 생쥐들을 물리침", characters:["시현","호두까기인형","클라라"], mood:"환상적", readingMinutes:5, hasFullContent:false },
  { id:"classic_25", theme:"세계명작", voiceTone:"magical", title:"눈의 여왕", desc:"얼어붙은 마음의 조각", plotSeed:"눈의 여왕에게 끌려간 카이를 구하기 위해 겔다가 떠나는 모험", conflict:"얼어붙은 마음을 녹이는 따뜻한 눈물과 우정", sihyeonRole:"시현이가 소방차의 따뜻한 물대포를 쏘아 얼음 성을 녹이고 카이를 구해냄", characters:["시현","겔다","카이"], mood:"따뜻함", readingMinutes:5, hasFullContent:false },
  { id:"classic_26", theme:"세계명작", voiceTone:"magical", title:"황금 거위", desc:"손이 떨어지지 않는 거위", plotSeed:"바보 취급 받던 아들이 황금 거위를 얻어 웃지 않는 공주를 웃게 만듦", conflict:"착한 마음씨가 뜻밖의 행운과 웃음을 가져온다", sihyeonRole:"시현이가 황금 거위 깃털로 공주를 간지럼 태워 온 궁전이 웃음바다가 되게 함", characters:["시현","공주","거위"], mood:"유쾌함", readingMinutes:5, hasFullContent:false },
  { id:"classic_27", theme:"세계명작", voiceTone:"magical", title:"걸리버 여행기", desc:"소인국의 거인", plotSeed:"폭풍을 만나 소인국에 떠내려간 걸리버가 밧줄에 묶인 채 깨어남", conflict:"자신과 전혀 다른 크기의 세상에서 겪는 놀라운 일들", sihyeonRole:"시현이가 커다란 집게차 장난감으로 걸리버를 묶은 밧줄을 싹둑싹둑 잘라내어 줌", characters:["시현","걸리버","소인들"], mood:"신기함", readingMinutes:5, hasFullContent:false },
  { id:"classic_28", theme:"세계명작", voiceTone:"magical", title:"알리바바와 40인의 도둑", desc:"열려라 참깨", plotSeed:"도둑들의 비밀 동굴 주문을 알아낸 알리바바의 모험", conflict:"비밀을 훔치려는 도둑들과 기지로 맞서는 대결", sihyeonRole:"시현이가 동굴 문 앞에 튼튼한 장난감 성벽을 쌓아 도둑들이 아예 못 들어오게 막음", characters:["시현","알리바바","도둑들"], mood:"스릴", readingMinutes:5, hasFullContent:false },
  { id:"classic_29", theme:"세계명작", voiceTone:"magical", title:"미다스의 손", desc:"만지면 황금이 되는 왕", plotSeed:"무엇이든 황금으로 변하게 해달라고 소원을 빌었다가 딸까지 황금으로 만듦", conflict:"물질적인 욕심보다 진짜 소중한 것이 무엇인지 깨달음", sihyeonRole:"시현이가 마법의 지우개를 가져와 황금으로 변한 딸을 다시 부드럽게 지워 돌려놓음", characters:["시현","미다스","딸"], mood:"교훈", readingMinutes:5, hasFullContent:false },
  { id:"classic_30", theme:"세계명작", voiceTone:"magical", title:"왕자와 거지", desc:"얼굴이 똑같은 두 소년", plotSeed:"얼굴이 똑같이 생긴 왕자와 거지가 옷을 바꿔 입고 서로의 삶을 겪음", conflict:"겉모습이 바뀌어도 겪어야 할 삶의 무게와 책임감", sihyeonRole:"시현이가 왕자와 거지에게 아주 멋진 영웅 망토를 똑같이 입혀주며 둘 다 왕처럼 대우함", characters:["시현","왕자","거지"], mood:"우정", readingMinutes:5, hasFullContent:false },

  /* --- 시현이 창작동화 (30개) --- */
  { id:"orig_car_1", theme:"자동차", voiceTone:"bright", title:"진흙투성이 덤프트럭", desc:"세차장 대소동", plotSeed:"진흙에서 논 덤프트럭이 세차를 싫어해서 바퀴가 구르지 않음", conflict:"씻기 싫어하지만 씻어야 달릴 수 있다", sihyeonRole:"시현이가 비눗방울 대포를 쏴서 트럭을 간지럽히며 깨끗이 씻겨줌", characters:["시현","덤프트럭"], mood:"상쾌함", readingMinutes:5, hasFullContent:false },
  { id:"orig_car_2", theme:"자동차", voiceTone:"bright", title:"길 잃은 아기 꼬마버스", desc:"어두운 밤의 버스", plotSeed:"차고지를 못 찾고 뱅글뱅글 도는 꼬마 버스", conflict:"어둡고 낯선 길에서 두려움을 이겨내야 함", sihyeonRole:"시현이가 손전등 불빛으로 반짝이는 길을 만들어 차고지까지 안내함", characters:["시현","꼬마버스"], mood:"포근함", readingMinutes:5, hasFullContent:false },
  { id:"orig_car_3", theme:"자동차", voiceTone:"bright", title:"바퀴 빠진 포크레인", desc:"공사장의 위기", plotSeed:"포크레인이 무거운 돌을 들다 덜컹 하고 바퀴가 빠져버림", conflict:"혼자서 움직일 수 없는 곤란한 상황", sihyeonRole:"시현이가 뚝딱뚝딱 스패너를 들고 바퀴를 다시 단단하게 조립해 줌", characters:["시현","포크레인"], mood:"뿌듯함", readingMinutes:5, hasFullContent:false },
  { id:"orig_car_4", theme:"자동차", voiceTone:"bright", title:"소방차의 물방울 행진", desc:"꽃밭을 구하는 물방울", plotSeed:"시든 꽃밭에 소방차가 나타나 물방울을 뿌려주려 함", conflict:"호스가 꼬여서 물이 시원하게 나오지 않음", sihyeonRole:"시현이가 꼬인 호스를 훌라후프처럼 빙글빙글 돌려 팡 풀어줌", characters:["시현","소방차"], mood:"생기", readingMinutes:5, hasFullContent:false },
  { id:"orig_car_5", theme:"자동차", voiceTone:"bright", title:"구급차 삐용이의 약속", desc:"장난감 병원의 하루", plotSeed:"바퀴가 부러진 곰인형을 태우고 장난감 병원으로 달려가는 구급차", conflict:"차가 밀려 병원에 빨리 갈 수 없음", sihyeonRole:"시현이가 경찰관 모자를 쓰고 호루라기를 불며 삐용이의 길을 비켜줌", characters:["시현","구급차","곰인형"], mood:"안도감", readingMinutes:5, hasFullContent:false },
  
  { id:"orig_dino_1", theme:"공룡", voiceTone:"adventure", title:"티라노의 살금살금 걷기", desc:"발소리가 너무 큰 공룡", plotSeed:"티라노가 걸을 때마다 쿵쿵 소리가 나서 숲속 친구들이 깸", conflict:"힘이 세지만 조심스럽게 배려하는 법을 배워야 함", sihyeonRole:"시현이가 푹신한 구름 솜을 티라노 발바닥에 붙여주어 사뿐사뿐 걷게 함", characters:["시현","티라노"], mood:"배려", readingMinutes:5, hasFullContent:false },
  { id:"orig_dino_2", theme:"공룡", voiceTone:"adventure", title:"아기 프테라의 첫 비행", desc:"날기 무서운 아기 익룡", plotSeed:"바람이 부는 절벽에서 날개를 펴지 못하고 떠는 아기 프테라노돈", conflict:"두려움을 이기고 처음으로 용기를 내는 순간", sihyeonRole:"시현이가 거대한 종이비행기를 만들어 프테라와 함께 바람을 타고 붕 날아오름", characters:["시현","프테라노돈"], mood:"용기", readingMinutes:5, hasFullContent:false },
  { id:"orig_dino_3", theme:"공룡", voiceTone:"adventure", title:"브라키오의 높은 목 우체통", desc:"구름 위로 편지 배달", plotSeed:"구름 위의 새 친구에게 편지를 주려 하지만 목이 다 닿지 않음", conflict:"더 높이 닿기 위해 누군가의 도움이 필요함", sihyeonRole:"시현이가 헬리콥터를 타고 올라가 브라키오 머리 위의 편지를 새에게 전달함", characters:["시현","브라키오"], mood:"성취감", readingMinutes:5, hasFullContent:false },
  { id:"orig_dino_4", theme:"공룡", voiceTone:"adventure", title:"트리케라톱스의 반짝 뿔", desc:"뿔에 붙은 별빛", plotSeed:"밤에 숲을 걷다 뿔에 반딧불이들이 붙어 트리가 당황함", conflict:"자신의 뿔이 무거운 짐이 아니라 환한 등불이 됨", sihyeonRole:"시현이가 반딧불이들을 쓰다듬으며 트리가 숲의 대장 반짝이가 되게 칭찬함", characters:["시현","트리케라톱스"], mood:"신비로움", readingMinutes:5, hasFullContent:false },
  { id:"orig_dino_5", theme:"공룡", voiceTone:"adventure", title:"스테고의 꼬리 미끄럼틀", desc:"놀이터가 된 공룡", plotSeed:"작은 동물들이 스테고의 등에 난 골판을 무서워함", conflict:"겉모습은 뾰족하지만 속마음은 아주 다정함", sihyeonRole:"시현이가 스테고의 등을 신나는 미끄럼틀로 만들어 동물 친구들을 태워줌", characters:["시현","스테고"], mood:"유쾌함", readingMinutes:5, hasFullContent:false },

  { id:"orig_space_1", theme:"우주", voiceTone:"magical", title:"달나라 로켓 정비소", desc:"고장 난 로켓", plotSeed:"달에 가려던 로켓이 엔진에 별 먼지가 껴서 쿨럭거림", conflict:"먼지를 털어내야만 다시 슈웅 날아갈 수 있음", sihyeonRole:"시현이가 우주복을 입고 커다란 붓으로 별 먼지를 쓱싹쓱싹 청소해 줌", characters:["시현","로켓"], mood:"호기심", readingMinutes:5, hasFullContent:false },
  { id:"orig_space_2", theme:"우주", voiceTone:"magical", title:"길 잃은 아기 별 요정", desc:"빛을 잃은 작은 별", plotSeed:"우주 폭풍을 만나 궤도를 잃고 뚝 떨어진 아기 별", conflict:"에너지를 모아 다시 밤하늘로 올라가야 함", sihyeonRole:"시현이가 장난감 건전지 파워를 별에게 톡톡 주입해 반짝이게 만들어 하늘로 날림", characters:["시현","아기별"], mood:"따뜻함", readingMinutes:5, hasFullContent:false },
  { id:"orig_space_3", theme:"우주", voiceTone:"magical", title:"화성의 붉은 모래성", desc:"외계인 친구와의 놀이", plotSeed:"화성에 도착했는데 삐리삐리 외계인이 모래성을 쌓다 자꾸 무너짐", conflict:"모래가 너무 말라서 성이 예쁘게 지어지지 않음", sihyeonRole:"시현이가 소방차에서 우주 물을 칙칙 뿌려 아주 단단하고 멋진 모래성을 지어줌", characters:["시현","외계인"], mood:"신남", readingMinutes:5, hasFullContent:false },
  { id:"orig_space_4", theme:"우주", voiceTone:"magical", title:"우주선의 잠깐 낮잠", desc:"피곤한 우주선 반짝이", plotSeed:"우주를 너무 많이 돌아다녀서 삐빅 소리도 안 나는 반짝이", conflict:"기계도 사람처럼 편안한 휴식이 필요함", sihyeonRole:"시현이가 푹신한 구름 담요를 덮어주고 쉿! 조용히 우주 자장가를 불러줌", characters:["시현","우주선"], mood:"편안함", readingMinutes:5, hasFullContent:false },
  { id:"orig_space_5", theme:"우주", voiceTone:"magical", title:"토성 고리 달리기", desc:"빙글빙글 우주 경주", plotSeed:"토성의 멋진 고리 위에서 우주 토끼와 달리기 시합을 함", conflict:"얼음이 미끄러워서 자꾸 넘어질 뻔함", sihyeonRole:"시현이가 우주 신발 바닥에 오돌토돌 미끄럼 방지 스티커를 붙이고 씽씽 달림", characters:["시현","우주토끼"], mood:"활기참", readingMinutes:5, hasFullContent:false },

  { id:"orig_sea_1", theme:"바다", voiceTone:"gentle", title:"아기 고래 뚜루의 노래", desc:"목소리를 잃어버린 고래", plotSeed:"바다 깊은 곳에서 아기 고래가 노래하는 법을 까먹음", conflict:"자신의 목소리를 다시 찾을 용기가 필요함", sihyeonRole:"시현이가 잠수함을 타고 뿌뿌! 나팔을 불어 뚜루가 다시 노래를 부르게 응원함", characters:["시현","아기고래"], mood:"위로", readingMinutes:5, hasFullContent:false },
  { id:"orig_sea_2", theme:"바다", voiceTone:"gentle", title:"꽃게 까미의 집게발 박수", desc:"박수치는 바다 밴드", plotSeed:"까미가 집게발로 박수를 치면 해파리들이 춤을 춤", conflict:"박수 소리가 너무 작아서 밴드 소리가 안 맞음", sihyeonRole:"시현이가 커다란 조개껍데기를 심벌즈처럼 쳐서 꽃게 밴드를 제일 신나게 만듦", characters:["시현","꽃게"], mood:"흥겨움", readingMinutes:5, hasFullContent:false },
  { id:"orig_sea_3", theme:"바다", voiceTone:"gentle", title:"상어 샤샤의 양치 시간", desc:"이빨이 아픈 상어", plotSeed:"단것을 많이 먹은 샤샤가 이가 아파서 엉엉 욺", conflict:"무서운 상어도 치카치카 양치질은 필수다", sihyeonRole:"시현이가 거대한 장난감 칫솔을 들고 샤샤의 이빨을 뽀득뽀득 반짝이게 닦아줌", characters:["시현","상어"], mood:"상쾌함", readingMinutes:5, hasFullContent:false },
  { id:"orig_sea_4", theme:"바다", voiceTone:"gentle", title:"거북이의 바다 택배", desc:"등딱지 위 선물 배달", plotSeed:"문어 할아버지에게 선물을 배달해야 하는데 조류가 너무 강함", conflict:"거북이 혼자 힘으로는 센 물살을 헤엄치기 힘듦", sihyeonRole:"시현이가 모터보트를 타고 거북이의 등딱지를 뒤에서 밀어주며 슝 배달을 완료함", characters:["시현","거북이"], mood:"뿌듯함", readingMinutes:5, hasFullContent:false },
  { id:"orig_sea_5", theme:"바다", voiceTone:"gentle", title:"문어의 여덟 개 신발", desc:"다리가 꼬인 문어", plotSeed:"문어가 신발을 신으려다 여덟 개 다리가 꽁꽁 꼬여버림", conflict:"서두르다 보면 오히려 일이 꼬이게 됨", sihyeonRole:"시현이가 문어 다리를 하나하나 풀어서 색깔별로 예쁜 신발을 차곡차곡 신겨줌", characters:["시현","문어"], mood:"다정함", readingMinutes:5, hasFullContent:false },

  { id:"orig_bed_1", theme:"잠자리", voiceTone:"bedtime", title:"구름 양탄자의 자장가", desc:"하늘을 나는 침대", plotSeed:"시현이 방에 둥실둥실 구름 양탄자가 찾아와 밤하늘로 데려감", conflict:"잠이 오지 않는 밤을 포근하게 만들어줌", sihyeonRole:"시현이가 구름 양탄자에 누워 달님에게 굿나잇 인사를 하고 스르르 잠이 듦", characters:["시현","구름양탄자","달님"], mood:"포근함", readingMinutes:5, hasFullContent:true, contentKey:"bed_cloud_lullaby" },
  { id:"orig_bed_2", theme:"잠자리", voiceTone:"bedtime", title:"달님의 뽀뽀 배달", desc:"달빛이 전하는 인사", plotSeed:"달님이 노란 빛줄기를 타고 내려와 이불에 뽀뽀를 전함", conflict:"무서운 밤이 달님의 뽀뽀로 환하고 따뜻해짐", sihyeonRole:"시현이가 달빛 뽀뽀를 볼에 받고 입술을 오므려 달님에게 쪽! 하고 뽀뽀를 돌려줌", characters:["시현","달님"], mood:"사랑스러움", readingMinutes:5, hasFullContent:false },
  { id:"orig_bed_3", theme:"잠자리", voiceTone:"bedtime", title:"꿈속 자동차의 느린 길", desc:"천천히 달리는 꿈 버스", plotSeed:"부릉부릉 빨리 달리던 자동차가 밤이 되자 아주 천천히 굴러감", conflict:"낮의 신나는 흥분을 가라앉히고 차분하게 쉬어야 함", sihyeonRole:"시현이가 자동차의 브레이크를 살살 밟아주며 코오 코오 느린 길로 안내함", characters:["시현","꿈자동차"], mood:"졸음", readingMinutes:5, hasFullContent:false },
  { id:"orig_bed_4", theme:"잠자리", voiceTone:"bedtime", title:"별 요정의 작은 등불", desc:"반짝이는 밤의 수호자", plotSeed:"방울방울 별 요정들이 침대 맡에서 작은 등불을 켜줌", conflict:"어두운 방 안의 그림자들을 따뜻한 빛으로 쫓아냄", sihyeonRole:"시현이가 별 요정들과 함께 이불로 작은 텐트를 만들고 반짝반짝 빛 놀이를 하다 잠듦", characters:["시현","별요정"], mood:"안심", readingMinutes:5, hasFullContent:false },
  { id:"orig_bed_5", theme:"잠자리", voiceTone:"bedtime", title:"하품하는 공룡 인형", desc:"장난감들의 잠자리", plotSeed:"시현이의 공룡 인형이 하루 종일 놀아서 입이 찢어지게 하품을 함", conflict:"아무리 놀고 싶어도 장난감도 잠을 자야 내일 또 놂", sihyeonRole:"시현이가 공룡 인형 배를 토닥토닥 두드려주고 이불을 목까지 덮어주며 함께 눈을 감음", characters:["시현","공룡인형"], mood:"따뜻함", readingMinutes:5, hasFullContent:false },

  { id:"orig_habit_1", theme:"생활습관", voiceTone:"bright", title:"치카치카 충치 벌레 탈출", desc:"양치하기 싫은 날", plotSeed:"양치를 안 하면 입속에 까만 충치 벌레들이 성을 짓는 이야기", conflict:"양치를 피하면 결국 입속이 아파지게 됨", sihyeonRole:"시현이가 칫솔 용사로 변신해 치약 거품 미사일로 벌레 성을 와르르 무너뜨림", characters:["시현","충치벌레"], mood:"통쾌함", readingMinutes:5, hasFullContent:false },
  { id:"orig_habit_2", theme:"생활습관", voiceTone:"bright", title:"장난감 제자리 요정", desc:"어질러진 방의 마법", plotSeed:"방을 치우지 않으면 밤에 장난감들이 자기 집을 못 찾아 움", conflict:"스스로 정리하지 않으면 장난감이 슬퍼함", sihyeonRole:"시현이가 척척박사 정리 대장이 되어 자동차와 블록을 모두 제자리에 꼭 안아다 줌", characters:["시현","장난감들"], mood:"뿌듯함", readingMinutes:5, hasFullContent:false },
  { id:"orig_habit_3", theme:"생활습관", voiceTone:"bright", title:"냠냠 골고루 기차", desc:"시금치 터널 지나기", plotSeed:"편식하는 입맛을 바꾸기 위해 숟가락 기차가 채소 터널을 통과함", conflict:"안 먹어본 음식에 대한 두려움", sihyeonRole:"시현이가 기차 기관사가 되어 당근과 시금치를 아삭아삭 씹으며 터널을 씩씩하게 통과함", characters:["시현","숟가락기차"], mood:"건강함", readingMinutes:5, hasFullContent:false },
  { id:"orig_habit_4", theme:"생활습관", voiceTone:"bright", title:"안녕, 예쁘게 인사하기", desc:"인사봇이 된 로봇", plotSeed:"부끄러워서 인사를 못하는 로봇의 태엽이 감기지 않아 멈춤", conflict:"작은 인사가 마음을 여는 큰 태엽이 됨", sihyeonRole:"시현이가 배꼽 손 인사를 씩씩하게 보여주어 로봇의 태엽이 띠링띠링 돌아가게 만듦", characters:["시현","인사로봇"], mood:"활기참", readingMinutes:5, hasFullContent:false },
  { id:"orig_habit_5", theme:"생활습관", voiceTone:"bright", title:"화장실 변기 몬스터", desc:"쉬야 참기 대작전", plotSeed:"화장실 가기가 귀찮아서 참다가 배 속 몬스터가 빵빵해짐", conflict:"미루면 더 큰 불편함이 찾아옴", sihyeonRole:"시현이가 용감하게 화장실로 달려가 변기 물을 쏴아 내리며 배 속 몬스터를 물리침", characters:["시현","변기몬스터"], mood:"상쾌함", readingMinutes:5, hasFullContent:false }
];

const STORY_THEME_META = {
  "자동차": {
    familyIds: ["dad"],
    friendIds: ["yuchan", "dasom"],
    petIds: ["reumi"],
    comfortToyIds: ["rona"],
    classicCharacterIds: ["seven_dwarfs"],
    storyGoal: "자동차 친구의 작은 문제를 함께 고쳐 다시 즐겁게 출발한다.",
    conflict: "자동차 친구가 작은 부품이나 길 때문에 잠시 멈춘다.",
    magicObject: "반짝 스패너",
    emotionalTone: "밝고 신나는 정비 놀이",
    successPattern: "car-repair"
  },
  "공룡": {
    familyIds: ["grandpa"],
    friendIds: ["yungyeom", "haeun"],
    petIds: [],
    comfortToyIds: ["sicheoni"],
    classicCharacterIds: ["turtle"],
    storyGoal: "공룡 친구가 자기 힘을 부드럽게 쓰도록 도와준다.",
    conflict: "커다란 발걸음 때문에 작은 친구들이 깜짝 놀란다.",
    magicObject: "폭신 발자국 스티커",
    emotionalTone: "든든하고 다정한 모험",
    successPattern: "dino-growth"
  },
  "동물": {
    familyIds: ["mom"],
    friendIds: ["seoa", "haeun"],
    petIds: ["nuni"],
    comfortToyIds: [],
    classicCharacterIds: ["rabbit", "turtle"],
    storyGoal: "동물 친구들의 마음을 살피고 모두 편한 방법을 찾는다.",
    conflict: "친구마다 속도와 방법이 달라 작은 오해가 생긴다.",
    magicObject: "따뜻한 리본",
    emotionalTone: "부드럽고 다정한 동물 이야기",
    successPattern: "slow-and-kind"
  },
  "우주": {
    familyIds: ["dad"],
    friendIds: ["haneul", "yuchan"],
    petIds: [],
    comfortToyIds: ["rona"],
    classicCharacterIds: ["star_fairy"],
    storyGoal: "반짝이는 우주 단서를 찾아 안전하게 여행을 이어 간다.",
    conflict: "우주선이나 별길에 작고 안전한 문제가 생긴다.",
    magicObject: "반짝 별 지도",
    emotionalTone: "상상력이 가득한 우주 모험",
    successPattern: "space-repair"
  },
  "바다": {
    familyIds: ["mom"],
    friendIds: ["haeun", "seoa"],
    petIds: ["nuni"],
    comfortToyIds: ["gureumi"],
    classicCharacterIds: ["little_mermaid"],
    storyGoal: "바닷길에서 작은 부탁을 안전하게 전하고 친구를 안심시킨다.",
    conflict: "바다 친구가 노래나 선물을 어디에 두었는지 잠시 헷갈린다.",
    magicObject: "조개빛 나침반",
    emotionalTone: "잔잔하고 반짝이는 바다 이야기",
    successPattern: "sea-song"
  },
  "전래동화": {
    familyIds: ["grandma", "grandpa"],
    friendIds: ["hayul", "seoa"],
    petIds: ["nuni"],
    comfortToyIds: [],
    classicCharacterIds: ["swallow"],
    storyGoal: "전래 느낌의 따뜻한 도움을 나누고 고마움을 전한다.",
    conflict: "작은 선물이나 길 안내가 필요한 친구가 나타난다.",
    magicObject: "반짝 복주머니",
    emotionalTone: "옛이야기처럼 포근하고 정겨운 분위기",
    successPattern: "folk-kindness"
  },
  "이솝우화": {
    familyIds: ["grandma", "grandpa"],
    friendIds: ["dasom", "iseo"],
    petIds: ["nuni"],
    comfortToyIds: [],
    classicCharacterIds: ["ant", "grasshopper"],
    storyGoal: "작은 노력과 노래를 함께 모아 친구의 일을 돕는다.",
    conflict: "친구들이 서로 다른 방식으로 준비해서 잠시 순서가 꼬인다.",
    magicObject: "딸랑딸랑 작은 종",
    emotionalTone: "밝고 리듬 있는 이솝풍 이야기",
    successPattern: "share-and-song"
  },
  "잠자리": {
    familyIds: ["mom", "dad"],
    friendIds: ["haneul", "seoa"],
    petIds: ["nuni"],
    comfortToyIds: ["gureumi"],
    classicCharacterIds: ["cloud", "moon"],
    storyGoal: "하루의 마음을 정리하고 포근하게 잠자리로 돌아온다.",
    conflict: "잠들기 전 마음에 남은 작은 생각이 둥실 떠오른다.",
    magicObject: "폭신 달빛 담요",
    emotionalTone: "차분하고 포근한 잠자리 동화",
    successPattern: "bedtime-calm"
  }
};

const STORY_PATTERN_BY_ID = {
  built_car_garage_night: { friendIds: ["yuchan", "dasom"], classicCharacterIds: ["seven_dwarfs"], successPattern: "car-repair" },
  built_dino_soft_steps: { friendIds: ["yungyeom", "haeun"], classicCharacterIds: ["turtle"], successPattern: "dino-growth" },
  orig_bed_1: { friendIds: ["haneul", "seoa"], classicCharacterIds: ["cloud", "moon"], successPattern: "bedtime-calm" }
};

window.STORY_LIBRARY.forEach(story => {
  const themeMeta = STORY_THEME_META[story.theme] || STORY_THEME_META["동물"];
  const idMeta = STORY_PATTERN_BY_ID[story.id] || {};
  Object.assign(story, {
    familyIds: Array.isArray(story.familyIds) ? story.familyIds : (idMeta.familyIds || themeMeta.familyIds || []),
    friendIds: Array.isArray(story.friendIds) ? story.friendIds : (idMeta.friendIds || themeMeta.friendIds || []),
    petIds: Array.isArray(story.petIds) ? story.petIds : (idMeta.petIds || themeMeta.petIds || []),
    comfortToyIds: Array.isArray(story.comfortToyIds) ? story.comfortToyIds : (idMeta.comfortToyIds || themeMeta.comfortToyIds || []),
    classicCharacterIds: Array.isArray(story.classicCharacterIds) ? story.classicCharacterIds : (idMeta.classicCharacterIds || themeMeta.classicCharacterIds || []),
    storyGoal: story.storyGoal || themeMeta.storyGoal,
    conflict: story.conflict || themeMeta.conflict,
    magicObject: story.magicObject || themeMeta.magicObject,
    emotionalTone: story.emotionalTone || story.mood || themeMeta.emotionalTone,
    successPattern: story.successPattern || idMeta.successPattern || themeMeta.successPattern
  });
});

window.FAMILY_CAST = FAMILY_CAST;
window.PET_CAST = PET_CAST;
window.COMFORT_TOY_CAST = COMFORT_TOY_CAST;
window.FRIEND_CAST = FRIEND_CAST;
window.CLASSIC_CHARACTER_CAST = CLASSIC_CHARACTER_CAST;

window.STORY_CONTENTS = {
  car_garage_night: {
    title: '반짝반짝 차고의 밤',
    theme: '자동차', voiceTone: 'bright',
    paragraphs: [
      '해가 산 뒤로 쏙 들어가자, 우리집 작은 차고에 노란 불빛이 톡 켜졌어요. 시현이는 잠옷 위에 작은 정비사 조끼를 걸치고 차고 문을 살짝 열었지요.',
      '문이 끼이익 열리자 자동차 친구들이 조용히 인사했어요. 포크레인 포키는 팔을 살랑살랑 흔들고, 빨간 소방차는 삐뽀 대신 뿌웅 하고 작은 숨을 쉬었어요.',
      '오늘은 차고 친구들이 모두 잠자기 전 점검을 받는 날이었어요. 시현이는 손전등을 들고 "하나씩 천천히 보자" 하고 말했어요.',
      '먼저 포키의 바퀴를 보았어요. 바퀴 사이에 작은 나뭇잎이 끼어 있어서 달릴 때 사각사각 소리가 났지요.',
      '시현이가 집게로 나뭇잎을 쏙 빼 주자 포키가 기분 좋게 팔을 올렸어요. "고마워, 이제 굴러갈 때 데굴데굴 부드러워졌어."',
      '다음은 빨간 소방차였어요. 소방차의 물 호스가 돌돌돌 너무 단단하게 감겨 있었어요.',
      '시현이는 호스를 조금 풀고 다시 폭신하게 감아 주었어요. 호스는 꼬불꼬불 웃는 모양이 되었고, 소방차는 반짝 불빛을 한 번 깜빡였어요.',
      '작은 버스는 의자가 삐뚤빼뚤해서 손님 장난감들이 자꾸 옆으로 기울어진다고 했어요. 시현이는 의자를 톡톡 밀어 줄을 맞추었어요.',
      '그러자 장난감 곰, 장난감 로봇, 장난감 토끼가 모두 똑바로 앉았어요. 작은 버스 안에서는 "딩동, 편안합니다" 하는 귀여운 소리가 났어요.',
      '차고 구석에서는 택배차가 조용히 기다리고 있었어요. 택배차 안에는 내일 아침 가족에게 줄 작은 그림 편지가 들어 있었지요.',
      '시현이는 편지가 구겨지지 않도록 납작한 상자에 살포시 넣었어요. 상자 위에는 별 스티커도 꾹 붙여 주었답니다.',
      '모든 자동차가 점검을 마치자 차고 천장에 달린 작은 별 전구들이 하나씩 반짝였어요. 반짝, 반짝, 마치 자동차들이 고맙다고 박수치는 것 같았어요.',
      '포키가 낮은 목소리로 말했어요. "시현아, 오늘 우리를 천천히 살펴봐 줘서 마음이 따뜻해."',
      '시현이는 자동차 친구들을 한 대씩 쓰다듬었어요. 차가운 차체도 손끝에서는 포근하게 느껴졌어요.',
      '이제 차고도 잠잘 시간이 되었어요. 시현이는 불빛을 조금 낮추고 "내일 또 재미있게 달리자" 하고 속삭였어요.',
      '자동차 친구들은 부릉부릉 아주 작은 자장가를 불렀어요. 시현이는 그 소리를 들으며 방으로 돌아와 이불 속에 쏙 들어갔답니다.',
      '창밖 차고의 별 전구가 마지막으로 한 번 반짝였어요. 시현이는 "잘 자, 내 자동차 친구들" 하고 말하고 따뜻한 꿈나라로 천천히 떠났어요.'
    ]
  },
  dino_soft_steps: {
    title: '티라노의 조용한 발걸음',
    theme: '공룡', voiceTone: 'adventure',
    paragraphs: [
      '초록 숲 공룡 마을에는 토토라는 티라노가 살았어요. 토토는 마음은 아주 다정했지만 걸을 때마다 쿵쿵쿵 큰 소리가 났어요.',
      '아침이 되면 나뭇잎이 팔랑팔랑 흔들리고, 작은 도토리들이 데구루루 굴러갔어요. 토토는 깜짝 놀란 친구들을 보며 미안한 마음이 들었지요.',
      '그때 시현이가 공룡 모자를 쓰고 숲길로 찾아왔어요. 시현이는 토토에게 손을 흔들며 "우리 같이 조용히 걷는 연습을 해 볼까?" 하고 말했어요.',
      '토토는 커다란 발을 내려다보았어요. "내 발이 너무 커서 어려울 것 같아."',
      '시현이는 고개를 저었어요. "큰 발도 천천히 내려놓으면 폭신폭신 걸을 수 있어."',
      '둘은 먼저 이끼 길 위에서 연습했어요. 시현이가 한 발을 살짝 놓자 사뿐, 토토가 따라 하자 푹신 하는 소리가 났어요.',
      '토토는 웃으며 다시 해 보았어요. 쿵 대신 퐁, 쿵 대신 퐁, 숲길에 작은 북소리 같은 발걸음이 생겼어요.',
      '브라키오가 긴 목을 숙이고 구경하러 왔어요. "토토야, 네 발소리가 오늘은 구름 같구나."',
      '토토는 기분이 좋아 꼬리를 살랑 흔들었어요. 그런데 꼬리가 덤불을 휙 건드려 나뭇잎이 우수수 떨어졌어요.',
      '시현이는 웃으며 말했어요. "발만 조용히 하는 게 아니라 꼬리도 천천히 인사하면 돼."',
      '토토는 꼬리를 오른쪽으로 살랑, 왼쪽으로 살랑 움직였어요. 나뭇잎은 놀라지 않고 바람처럼 팔랑팔랑 춤추었어요.',
      '조금 뒤 작은 공룡들이 낮잠을 자는 언덕에 도착했어요. 토토는 아주 천천히 숨을 들이쉬고 한 발씩 사뿐사뿐 걸었어요.',
      '작은 공룡들은 깨지 않았어요. 오히려 토토의 부드러운 발걸음이 자장가처럼 들려 쌔근쌔근 더 편하게 잠들었어요.',
      '토토는 눈이 동그래졌어요. "나도 친구들을 편안하게 해 줄 수 있구나."',
      '시현이는 토토의 커다란 발등을 톡톡 두드렸어요. "응, 힘센 발은 조심히 쓰면 아주 따뜻한 발이 돼."',
      '저녁이 되자 공룡 마을 친구들이 토토에게 폭신한 잎사귀 길을 선물했어요. 토토는 그 길 위를 퐁퐁 걸으며 모두에게 고맙다고 했지요.',
      '그날 밤 토토는 처음으로 자기 발소리를 좋아하게 되었어요. 시현이도 공룡 숲의 조용한 별빛 아래에서 마음이 포근해졌답니다.'
    ]
  },
  bed_cloud_lullaby: {
    title: '구름 양탄자의 자장가',
    theme: '잠자리', voiceTone: 'bedtime',
    paragraphs: [
      '밤이 되자 시현이 방 창문 밖에 하얀 구름 하나가 둥실둥실 떠왔어요. 구름은 네모난 양탄자처럼 납작하고 폭신해 보였어요.',
      '구름 양탄자는 창문을 톡톡 두드렸어요. "시현아, 오늘 하루도 많이 놀았지? 잠자리 산책을 같이 갈래?"',
      '시현이는 작은 담요를 어깨에 두르고 구름 위에 살포시 앉았어요. 구름은 솜사탕처럼 폭신해서 엉덩이가 푹 들어갔답니다.',
      '구름 양탄자는 아주 천천히 하늘로 올라갔어요. 슈우웅 빠르게 가지 않고, 흔들흔들 요람처럼 움직였어요.',
      '아래에는 집 지붕들이 조용히 잠들어 있었어요. 창문 불빛도 하나둘 꺼지고, 골목길은 파란 이불을 덮은 것처럼 차분했어요.',
      '시현이는 작은 목소리로 물었어요. "구름아, 너도 잘 때가 있어?"',
      '구름 양탄자가 포근하게 대답했어요. "그럼. 나는 달님 옆에서 둥실둥실 쉬어. 오늘은 네 마음이 편해질 때까지 같이 있을게."',
      '조금 가자 별 요정들이 반짝반짝 작은 등불을 들고 나타났어요. 별 요정들은 소곤소곤 노래했어요. "자장자장, 오늘의 웃음도 코오 잠들어요."',
      '시현이는 오늘 만들었던 블록 탑을 떠올렸어요. 와르르 무너졌지만 다시 쌓아서 더 재미있었던 일이 생각났어요.',
      '구름 양탄자는 그 생각을 작은 별 주머니에 담아 주었어요. "즐거운 기억은 꿈속에서 반짝이는 길이 된단다."',
      '다음으로 낮에 조금 속상했던 마음도 떠올랐어요. 시현이는 입을 작게 오므리고 구름을 꼭 잡았어요.',
      '구름은 부드럽게 흔들렸어요. "속상한 마음도 쉬어야 해. 후우 하고 불면 작은 안개가 되어 멀리 흘러가."',
      '시현이가 후우 숨을 내쉬자 마음속 작은 안개가 몽글몽글 떠올랐어요. 달님이 그 안개를 은빛 숟가락으로 살살 저어 밤하늘에 풀어 주었어요.',
      '달님은 둥근 얼굴로 미소 지었어요. "시현아, 오늘도 충분히 잘했단다. 이제 눈꺼풀이 쉬어도 괜찮아."',
      '구름 양탄자는 다시 시현이 방 쪽으로 천천히 내려왔어요. 이불은 따뜻하게 펼쳐져 있었고 베개는 조용히 기다리고 있었어요.',
      '시현이는 구름에게 손을 흔들었어요. "내일도 와 줄래?" 구름은 폭신하게 끄덕이며 "네 꿈이 부르면 언제든 올게" 하고 말했어요.',
      '시현이가 이불 속에 쏙 들어가자 방 안이 포근하게 조용해졌어요. 창밖에서는 구름 양탄자가 아주 작은 목소리로 둥실둥실 자장가를 불렀답니다.'
    ]
  },
  classic_cinderella: {
    title: '신데렐라와 유리구두',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '옛날 옛날, 어느 작고 평화로운 마을에 마음씨 착하고 예쁜 소녀가 살고 있었어요. 소녀의 이름은 신데렐라였습니다.',
      '하지만 신데렐라의 매일매일은 무척 고단했어요. 심술궂은 새어머니와 두 새언니가 온종일 집안일을 모두 떠맡겼거든요.',
      '"신데렐라! 바닥을 다시 쓸어라! 내 드레스도 구겨지지 않게 다려놓고!" 언니들의 구박에도 신데렐라는 꾹 참고 씩씩하게 일했어요.',
      '다락방의 작은 생쥐들과 지저귀는 새들만이 신데렐라의 다정한 친구가 되어 주었답니다.',
      '그러던 어느 날, 왕자님이 신부감을 찾기 위해 나라 안의 모든 아가씨를 성으로 초대하는 무도회를 연다는 기쁜 소식이 전해졌어요.',
      '새어머니와 언니들은 화려한 드레스를 입고 마차를 타고 성으로 훌쩍 떠나버렸죠. 홀로 남겨진 신데렐라는 마당 우물가에 주저앉아 엉엉 울고 말았어요.',
      '"나도 예쁜 드레스를 입고 무도회에 가고 싶은데..."',
      '바로 그때, 눈부신 빛과 함께 상냥한 미소를 지은 요정 할머니가 나타났어요.',
      '"울지 마렴, 신데렐라. 네 착한 마음씨를 알고 있단다. 내가 널 무도회에 보내주마! 비비디 바비디 부!"',
      '요정 할머니가 요술 지팡이를 힘차게 흔들자, 커다란 호박은 황금 마차로, 작은 생쥐들은 멋진 백마로 변했어요.',
      '그리고 신데렐라의 낡은 누더기 옷은 밤하늘의 별을 수놓은 듯 아름다운 드레스로 바뀌었고, 발에는 반짝이는 투명한 유리구두가 신겨졌어요.',
      '"기억하렴, 신데렐라. 밤 12시를 알리는 종이 치면 마법이 모두 풀려버린단다. 그전에 꼭 돌아와야 해!"',
      '성에 도착한 신데렐라가 무도회장에 들어서자, 사람들은 눈이 부시게 아름다운 모습에 모두 숨을 죽였어요.',
      '왕자님은 한눈에 신데렐라에게 반해 다가왔죠. "아름다운 아가씨, 저와 춤을 추시겠습니까?"',
      '두 사람은 밤이 깊어가는 줄도 모르고 행복하게 춤을 추었어요. 신데렐라는 생애 가장 꿈같은 시간을 보냈죠.',
      '그런데 그때, 뎅~ 뎅~ 하고 밤 12시를 알리는 무거운 괘종시계 소리가 울리기 시작했어요.',
      '"앗! 12시야! 전 이만 가봐야 해요!" 신데렐라는 왕자님을 뒤로한 채 성의 계단을 서둘러 뛰어내려갔어요.',
      '그 바람에 계단에 유리구두 한 짝이 벗겨졌지만, 주울 틈도 없이 마차에 올라타 집으로 도망쳤답니다.',
      '다음 날, 왕자님은 유리구두의 주인을 찾기 위해 신하들을 온 나라로 보냈어요. 이 구두가 발에 꼭 맞는 아가씨와 결혼하겠다고 선포한 것이죠.',
      '마침내 신하들이 신데렐라의 집에도 찾아왔어요. 두 새언니는 발을 억지로 구겨 넣으려 했지만 구두는 턱없이 작았어요.',
      '그때, 뒤에서 지켜보던 신데렐라가 조심스럽게 다가왔어요. "저... 제가 한번 신어봐도 될까요?"',
      '새어머니와 언니들은 코웃음을 치며 비웃었지만, 유리구두는 신데렐라의 발에 마치 마법처럼 쏙! 하고 맞았어요.',
      '그리고 신데렐라가 품속에서 나머지 한 짝을 꺼내 신자, 눈부신 빛과 함께 다시 아름다운 드레스 차림으로 변했어요.',
      '신데렐라를 한눈에 알아본 왕자님은 무척 기뻐하며 그녀를 성으로 데려갔어요.',
      '마음씨 착한 신데렐라는 새어머니와 언니들을 모두 용서해주었고, 왕자님과 결혼해 오래오래 행복하게 살았답니다.'
    ]
  },
 
classic_cinderella: {
    title: '신데렐라와 유리구두',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '옛날 옛적, 어느 평화로운 마을에 마음씨가 맑고 고운 소녀가 살고 있었어요. 소녀의 이름은 신데렐라였지요.',
      '하지만 신데렐라의 매일매일은 무척이나 바쁘고 힘들었어요. 심술궂은 새어머니와 두 새언니가 온종일 집안일을 모두 떠맡겼거든요.',
      '"신데렐라! 거실 바닥에 먼지가 있잖아! 당장 다시 닦아!" "내 드레스 구겨지면 가만 안 둘 거야!" 언니들의 잔소리에도 신데렐라는 꾹 참고 씩씩하게 일했어요.',
      '하루 종일 청소를 하고 나면 신데렐라의 옷은 항상 재투성이가 되었어요. 다락방의 작은 생쥐들과 지저귀는 새들만이 신데렐라의 다정한 친구였답니다.',
      '그러던 어느 날, 빰빠라밤! 나팔 소리와 함께 성에서 기쁜 소식이 전해졌어요. 왕자님이 신부감을 찾기 위해 나라 안의 모든 아가씨를 성으로 초대하는 무도회를 연다는 것이었어요.',
      '새어머니와 언니들은 가장 화려하고 반짝이는 드레스를 입고 콧노래를 부르며 성으로 훌쩍 떠나버렸어요.',
      '홀로 텅 빈 집 마당에 남겨진 신데렐라는 우물가에 털썩 주저앉아 엉엉 울고 말았어요. "나도 예쁜 드레스를 입고 무도회에 가고 싶은데..."',
      '바로 그때였어요! 사방이 눈부시게 환해지더니, 상냥한 미소를 지은 요정 할머니가 나타났어요.',
      '"울지 마렴, 신데렐라. 네 착한 마음씨를 내가 알고 있단다. 내가 널 무도회에 보내주마! 비비디 바비디 부!"',
      '요정 할머니가 요술 지팡이를 휙 두르자, 커다란 호박은 황금빛 마차로 변하고 작은 생쥐들은 늠름한 백마로 변했어요.',
      '그리고 신데렐라의 낡은 옷은 밤하늘의 은하수처럼 반짝이는 눈부신 드레스로 변했고, 발에는 투명하게 빛나는 유리구두가 신겨졌어요.',
      '"기억하렴, 신데렐라! 밤 12시가 되면 모든 마법이 풀린단다. 꼭 그전에 집으로 돌아와야 해!" 요정 할머니가 다정하게 일러주었어요.',
      '성에 도착한 신데렐라가 무도회장에 들어서자, 사람들은 너무나 아름다운 모습에 모두 숨을 죽였어요. 왕자님도 한눈에 반해 신데렐라에게 다가왔지요.',
      '두 사람은 손을 잡고 밤이 깊어가는 줄도 모르고 행복하게 춤을 추었어요. 그런데 그때, 뎅~ 뎅~ 하고 밤 12시를 알리는 시계 소리가 울리기 시작했어요.',
      '"앗! 12시야! 전 이만 가봐야 해요!" 신데렐라는 깜짝 놀라 왕자님의 손을 놓고 서둘러 계단을 뛰어내려갔어요.',
      '그 바람에 투명한 유리구두 한 짝이 계단에 벗겨지고 말았지만, 주울 틈도 없이 마차에 올라타 집으로 도망쳤답니다.',
      '다음 날, 왕자님은 계단에 남겨진 유리구두의 주인을 찾아 온 나라를 돌아다녔어요. 신데렐라의 집에 찾아왔을 때, 새언니들은 억지로 발을 쑤셔 넣었지만 구두는 턱없이 작았지요.',
      '마침내 조용히 지켜보던 신데렐라가 다가와 유리구두를 신자, 마치 마법처럼 발에 쏙! 하고 맞았어요.',
      '신데렐라가 품속에서 나머지 한 짝의 유리구두를 꺼내 신자, 다시 아름다운 드레스 차림의 공주님으로 변했답니다.',
      '왕자님은 뛸 듯이 기뻐하며 신데렐라의 손을 잡았어요. 신데렐라는 새어머니와 언니들을 모두 용서해주고, 왕자님과 함께 오래오래 행복하게 살았답니다.'
    ]
  },

  classic_1_pigs: {
    title: '아기 돼지 삼형제',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '어느 화창한 숲속 마을에 통통하고 귀여운 아기 돼지 삼형제가 살고 있었어요.',
      '어느 날 엄마 돼지가 말했어요. "너희들도 이제 다 컸으니, 각자 튼튼한 집을 짓고 스스로 살아보렴." 삼형제는 씩씩하게 숲으로 나섰어요.',
      '놀기를 아주 좋아하는 첫째 돼지는 들판의 볏짚을 쓱쓱 모아 짚으로 집을 지었어요. "헤헤, 집 짓기 참 쉽네! 얼른 다 짓고 피리 불며 놀아야지!"',
      '조금 덜 게으른 둘째 돼지는 산에서 나무판자를 주워 탕탕 못질해서 나무집을 지었어요. "이 정도면 비바람은 막아주겠지? 나도 다 지었으니 바이올린을 켜며 놀아야지!"',
      '하지만 막내 돼지는 달랐어요. "형들, 무서운 늑대가 쳐들어올지도 몰라. 튼튼한 벽돌집을 지어야 해."',
      '막내 돼지는 무거운 벽돌을 하나하나 등에 지고 나르느라 온몸이 땀투성이가 되었지만, 쉬지 않고 차곡차곡 벽돌을 쌓아 아주 튼튼한 집을 완성했어요.',
      '며칠 뒤, 숲속에서 배가 몹시 고픈 무시무시한 늑대가 마을로 내려왔어요. 늑대는 첫째 돼지의 짚집 앞에 서서 씩씩거렸어요.',
      '"아기 돼지야, 문 열어라! 안 열면 입김을 불어서 집을 날려버리겠다!" 첫째 돼지는 덜덜 떨며 문을 열어주지 않았어요.',
      '"좋아, 그럼 날려주마! 후우우우~!" 늑대가 숨을 깊게 들이마시고 세게 불자, 짚집은 깃털처럼 하늘로 다 날아가 버렸어요.',
      '깜짝 놀란 첫째 돼지는 꿀꿀거리며 둘째의 나무집으로 쏜살같이 도망쳤어요.',
      '늑대는 둘째의 나무집 앞까지 쫓아왔어요. "이깟 나무집쯤이야! 후우우우우!" 하고 더 세게 바람을 불자, 나무집도 와르르 무너져 내렸어요.',
      '겁에 질린 첫째와 둘째는 막내 돼지가 있는 튼튼한 벽돌집으로 헐레벌떡 뛰어들어갔어요. 문을 꽉 잠그고 서로 부둥켜안았지요.',
      '늑대는 막내의 튼튼한 벽돌집 앞에 서서 으름장을 놓았어요. "이 집도 한 번에 날려주마! 후우우우우우우우!!!"',
      '늑대가 아무리 힘껏 바람을 불어도 벽돌집은 꿈쩍도 하지 않았어요. 늑대는 얼굴이 빨개지도록 불고 또 불었지만 소용이 없었죠.',
      '힘이 쏙 빠진 늑대는 지붕 위를 쳐다보았어요. "옳지! 저기 있는 굴뚝으로 몰래 들어가야겠다!" 늑대는 지붕으로 엉금엉금 기어 올라갔어요.',
      '굴뚝에서 부스럭거리는 소리를 들은 막내 돼지는 얼른 벽난로에 장작을 넣고 뜨거운 불을 활활 피웠어요.',
      '굴뚝을 타고 내려오던 늑대는 앗 뜨거워! 하며 엉덩이를 훌러덩 데이고 말았어요.',
      '"아이고 뜨거워! 사람 살려!" 늑대는 굴뚝 밖으로 튀어 올라가 숲속 멀리 엉엉 울며 도망쳐 버렸답니다.',
      '첫째와 둘째 돼지는 막내 돼지의 손을 잡고 고마워했어요. "막내야, 네 말이 맞았어. 우리도 튼튼한 벽돌집을 지을게."',
      '그 후로 무서운 늑대는 다시는 나타나지 않았고, 아기 돼지 삼형제는 튼튼한 벽돌집에서 오순도순 행복하게 살았답니다.'
    ]
  },

  classic_4_snow_white: {
    title: '백설공주와 일곱 난쟁이',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '아주 먼 옛날, 눈처럼 하얀 피부와 앵두처럼 붉은 입술, 까마귀처럼 검은 머릿결을 가진 아름다운 백설공주가 살고 있었어요.',
      '하지만 궁전에는 백설공주의 아름다움을 몹시 질투하는 새 왕비가 살고 있었어요. 왕비에게는 진실만을 말하는 요술 거울이 있었지요.',
      '왕비가 "거울아 거울아, 세상에서 누가 제일 예쁘니?" 하고 묻자, 거울은 "왕비님도 예쁘시지만, 세상에서 제일 예쁜 분은 백설공주님입니다"라고 대답했어요.',
      '화가 잔뜩 난 왕비는 사냥꾼을 시켜 백설공주를 깊은 숲속으로 쫓아내 버렸어요. 길을 잃은 공주는 무서워서 숲속을 헤매다 작은 오두막을 발견했어요.',
      '오두막 안에는 일곱 개의 작은 침대와 일곱 개의 작은 접시가 놓여 있었어요. 공주는 너무 피곤한 나머지 일곱 개의 침대를 붙여놓고 스르르 잠이 들었지요.',
      '저녁이 되자, 광산에서 보석을 캐던 일곱 난쟁이들이 오두막으로 돌아왔어요. 난쟁이들은 아름다운 백설공주를 보고 깜짝 놀랐어요.',
      '잠에서 깬 공주가 자초지종을 이야기하자, 착한 난쟁이들은 공주를 따뜻하게 위로해 주었어요. "저희와 함께 여기서 살아요. 저희가 지켜드릴게요."',
      '백설공주는 난쟁이들을 위해 맛있는 파이를 굽고 집을 깨끗하게 청소하며 숲속에서 매일매일 평화롭게 지냈답니다.',
      '하지만 요술 거울을 통해 백설공주가 살아있다는 걸 알게 된 왕비는 무서운 마녀 할머니로 변장하고 독이 든 새빨간 사과를 준비했어요.',
      '난쟁이들이 일하러 간 사이, 마녀 할머니가 오두막을 찾아왔어요. "착한 아가씨, 이 탐스럽고 달콤한 사과를 한 입 먹어보련?"',
      '백설공주는 사과가 너무 맛있어 보여 그만 한 입 베어 물고 말았어요. 그러자마자 공주는 깊고 깊은 마법의 잠에 빠져 쓰러졌어요.',
      '집으로 돌아온 난쟁이들은 쓰러진 공주를 보고 엉엉 눈물을 흘렸어요. 난쟁이들은 공주를 유리 관에 눕히고 매일 슬퍼하며 곁을 지켰어요.',
      '어느 날, 숲을 지나가던 이웃 나라의 왕자님이 우연히 유리 관 속에 잠든 아름다운 백설공주를 보게 되었어요.',
      '왕자님은 공주에게 한눈에 반해, 난쟁이들에게 공주를 자신의 성으로 데려가 보살피게 해달라고 부탁했어요.',
      '왕자님의 신하들이 조심조심 유리 관을 들어 올리다 그만 발이 걸려 덜컹! 하고 관이 흔들리고 말았어요.',
      '바로 그 순간, 공주의 목에 걸려 있던 독사과 조각이 툭! 하고 밖으로 튀어나왔어요.',
      '"어머, 내가 얼마나 잠들어 있었던 거지?" 백설공주가 서서히 눈을 뜨며 일어났어요.',
      '왕자님과 일곱 난쟁이들은 뛸 듯이 기뻐하며 환호성을 질렀어요. 왕자님은 공주님의 손을 잡고 다정하게 청혼했지요.',
      '백설공주는 자신을 지켜준 일곱 난쟁이들과 따뜻한 작별 인사를 나누었어요.',
      '그리고 왕자님과 함께 멋진 궁전으로 돌아가 오래오래 아주 행복하게 살았답니다.'
    ]
  },

  classic_6_pinocchio: {
    title: '피노키오의 모험',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '오래전 어느 작은 마을에 손재주가 아주 좋은 제페토 할아버지가 살았어요. 할아버지는 나무를 깎아 귀여운 인형을 만들고 "피노키오"라는 이름을 지어주었지요.',
      '할아버지는 피노키오가 진짜 아들처럼 움직였으면 좋겠다고 소원을 빌었어요. 그날 밤, 착한 푸른 요정님이 나타나 피노키오에게 생명을 불어넣어 주었답니다.',
      '아침에 일어난 제페토 할아버지는 피노키오가 말도 하고 팔다리를 움직이는 것을 보고 뛸 듯이 기뻐했어요.',
      '할아버지는 자신의 낡은 코트를 팔아 피노키오에게 책을 사주며 학교에 보냈어요. "피노키오야, 학교에 가서 훌륭한 사람이 되어야 한단다."',
      '하지만 호기심 많은 피노키오는 학교로 가는 길에 신나는 인형극을 보고 딴 길로 새고 말았어요. 인형극 단장은 피노키오가 신기하다며 금화 다섯 닢을 주었지요.',
      '집으로 돌아가려던 피노키오는 길에서 나쁜 여우와 고양이를 만났어요. "그 금화를 밭에 심으면 금화 나무가 자란단다!"',
      '여우와 고양이의 거짓말에 속아 넘어간 피노키오는 금화를 모두 빼앗기고 엉엉 울고 말았어요.',
      '푸른 요정님이 나타나 피노키오에게 물었어요. "피노키오야, 금화는 어쩌고 여기서 울고 있니?"',
      '피노키오는 혼날까 봐 두려워 "오다가 주머니에서 떨어뜨렸어요!" 하고 거짓말을 했어요. 그러자 뿅! 하고 피노키오의 나무 코가 길어졌어요.',
      '피노키오가 거짓말을 계속할수록 코는 점점 더 길어져서 나중에는 고개조차 돌릴 수 없게 되었어요.',
      '요정님은 다정하게 타일렀어요. "거짓말을 하면 코가 길어진단다. 솔직하게 말해야 착한 아이가 될 수 있어."',
      '피노키오가 잘못을 뉘우치며 엉엉 울자, 딱따구리들이 날아와 길어진 코를 톡톡 쪼아 원래대로 만들어 주었어요.',
      '피노키오는 할아버지를 찾아 집으로 달려갔지만, 할아버지는 피노키오를 찾아 작은 배를 타고 바다로 나갔다가 커다란 고래에게 삼켜졌다는 소식을 듣게 되었어요.',
      '용감해진 피노키오는 할아버지를 구하기 위해 거센 파도가 치는 바다로 뛰어들었어요. 그리고 할아버지를 삼킨 그 커다란 고래의 입속으로 쑥 빨려 들어갔지요.',
      '캄캄한 고래 뱃속에서 낡은 배 조각에 앉아 있던 제페토 할아버지는 피노키오를 안고 눈물을 흘렸어요. "오, 무사했구나 나의 아들아!"',
      '피노키오는 똑똑한 꾀를 내었어요. 뱃속에 있던 나뭇조각들을 모아 불을 피우기 시작했지요. 매운 연기가 고래의 뱃속을 가득 채웠어요.',
      '"에... 에... 에취!!!" 고래가 어마어마하게 커다란 재채기를 하자, 피노키오와 할아버지는 바다 밖으로 슝~ 날아가 무사히 해변에 닿았어요.',
      '집으로 돌아온 피노키오는 할아버지를 위해 매일매일 성실하게 일하고 공부도 열심히 했어요.',
      '그 모습을 흐뭇하게 지켜본 푸른 요정님은 어느 날 밤, 나무 인형이었던 피노키오를 따뜻한 심장이 뛰는 진짜 사람 아이로 만들어 주었답니다.',
      '제페토 할아버지와 진짜 사람이 된 피노키오는 서로를 꼭 껴안고 영원히 행복하게 살았어요.'
    ]
  },
  classic_7_red_riding_hood: {
    title: '빨간 모자와 늑대',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '옛날 옛적 숲속 마을에 귀엽고 사랑스러운 꼬마 아가씨가 살고 있었어요. 할머니가 정성껏 만들어주신 빨간색 벨벳 모자를 늘 쓰고 다녀서, 사람들은 아이를 "빨간 모자"라고 불렀지요.',
      '어느 날 엄마가 빨간 모자를 불렀어요. "빨간 모자야, 숲속에 사시는 할머니가 편찮으시단다. 이 바구니에 부드러운 빵과 달콤한 포도주를 담았으니 할머니께 전해드리렴."',
      '엄마는 바구니를 건네며 단단히 일러주었어요. "숲길은 험하고 위험하니까 절대 한눈팔지 말고, 낯선 사람과 이야기해서도 안 된단다. 알겠지?"',
      '"네, 엄마! 조심해서 다녀올게요!" 빨간 모자는 씩씩하게 대답하고 숲속으로 걸음을 옮겼어요.',
      '숲길을 걷던 빨간 모자는 그만 엄마의 당부를 깜빡 잊고 말았어요. 길가에 피어난 예쁜 꽃들과 팔랑거리는 나비들에게 시선을 빼앗겼거든요.',
      '그때, 풀숲에서 커다랗고 시커먼 늑대가 어슬렁어슬렁 나타났어요. 늑대는 몹시 배가 고팠지만, 주변에 나무꾼들이 있어서 당장 빨간 모자를 잡아먹을 수는 없었죠.',
      '"안녕, 귀여운 꼬마 아가씨? 어디를 그렇게 바쁘게 가니?" 늑대가 아주 다정한 목소리로 말을 걸었어요.',
      '"숲속 오두막에 사시는 할머니가 아프셔서 빵을 갖다 드리러 가요." 마음 착한 빨간 모자는 늑대가 나쁜 동물인 줄 모르고 묻는 말에 모두 대답해 버렸어요.',
      '늑대는 속으로 나쁜 꾀를 내었어요. "아가씨, 할머니께 예쁜 꽃을 꺾어다 드리면 어떨까? 저기 안쪽에 훨씬 예쁜 꽃들이 많단다." 늑대의 말에 빨간 모자는 숲속 깊은 곳으로 꽃을 꺾으러 들어갔어요.',
      '그 사이 늑대는 지름길을 통해 할머니의 오두막으로 쏜살같이 달려갔어요. 늑대는 할머니를 꿀꺽 삼키고는, 할머니의 잠옷을 입고 침대 이불 속에 누워 빨간 모자를 기다렸지요.',
      '한참 뒤, 꽃을 한 아름 꺾은 빨간 모자가 할머니 댁에 도착했어요. "할머니, 저 왔어요!" 방문을 열고 들어간 빨간 모자는 침대에 누운 할머니의 모습이 어쩐지 이상했어요.',
      '"할머니, 할머니 귀는 왜 이렇게 커요?" "우리 손녀 목소리를 더 잘 들으려고 그러지." 늑대가 목소리를 꾸미며 대답했어요.',
      '"할머니 눈은 왜 이렇게 커요?" "우리 예쁜 손녀를 더 잘 보려고 그러지." "할머니 입은 왜 이렇게 무섭게 커요?!"',
      '"그야... 널 한입에 잡아먹으려고 그러지!!!" 늑대는 이불을 걷어차고 일어나 빨간 모자마저 꿀꺽 삼켜버렸어요.',
      '배가 부른 늑대는 침대에 누워 드르렁드르렁 코를 골며 낮잠을 자기 시작했어요. 그때, 오두막 앞을 지나가던 사냥꾼 할아버지가 그 엄청난 코골이 소리를 들었어요.',
      '"할머니 집에서 웬 늑대 코 고는 소리가 나지?" 사냥꾼 할아버지가 문을 열고 들어가 보니, 커다란 늑대가 배가 볼록해진 채 자고 있었어요.',
      '사냥꾼 할아버지는 조심조심 가위로 늑대의 배를 갈랐어요. 그러자 배 속에서 할머니와 빨간 모자가 "아이고 깜깜해라!" 하며 무사히 빠져나왔지요.',
      '빨간 모자와 할머니, 사냥꾼은 무거운 돌멩이들을 잔뜩 주워와 늑대의 빈 배 속에 가득 채우고 꿰매버렸어요.',
      '잠에서 깬 늑대는 목이 말라 우물가로 가다가, 배 속의 무거운 돌멩이들 때문에 그만 우물에 풍덩 빠져버렸답니다.',
      '빨간 모자는 사냥꾼 할아버지와 할머니와 함께 맛있는 빵을 나누어 먹었어요. 그리고 다시는 낯선 사람의 말을 듣지 않겠다고 굳게 다짐했답니다.'
    ]
  },

  classic_2_ugly_duckling: {
    title: '미운 아기 오리',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '따사로운 여름날, 조용한 시골 농장의 연못가에서 엄마 오리가 알을 품고 있었어요. 시간이 지나자 알들이 "빠지직!" 하고 갈라지며 귀여운 아기 오리들이 삐약삐약 태어났지요.',
      '그런데 가장 크고 못생긴 알 하나만 도무지 깨어날 기미가 보이지 않았어요. 엄마 오리가 며칠을 더 따뜻하게 품어주자, 마침내 마지막 알이 깨졌어요.',
      '하지만 알에서 나온 아기 오리는 다른 형제들과 달랐어요. 작고 노란 솜털 대신, 크고 칙칙한 회색 털을 가진 아주 못생긴 아기 오리였거든요.',
      '농장의 다른 동물들은 회색 아기 오리를 볼 때마다 놀려댔어요. "꽥꽥! 저렇게 크고 못생긴 오리가 어디 있어!" "우리 농장에는 안 어울려. 저리 가!"',
      '심지어 형제 오리들조차 미운 아기 오리를 따돌렸어요. 너무 슬프고 외로웠던 미운 아기 오리는 결국 캄캄한 밤에 몰래 농장을 떠나버렸어요.',
      '넓은 세상으로 나온 아기 오리는 늪지대에 도착했어요. 그곳에서 야생 오리들을 만났지만, 그들도 아기 오리를 보고 못생겼다며 비웃었지요.',
      '얼마 후 사냥꾼들의 총소리가 숲을 울렸고, 깜짝 놀란 아기 오리는 숨을 헐떡이며 늪지대를 빠져나와 끝없이 도망쳤어요.',
      '작은 농가에 도착한 아기 오리는 마음씨 좋은 할머니를 만나 잠시 쉴 수 있었어요. 하지만 그 집에 살던 고양이와 암탉이 아기 오리를 구박하기 시작했어요.',
      '"너는 쥐를 잡을 줄 아니? 알을 낳을 줄 아니? 아무것도 못하면서 밥만 축내다니!" 고양이의 괴롭힘에 아기 오리는 다시 쓸쓸히 집을 나설 수밖에 없었지요.',
      '어느덧 쌀쌀한 가을이 지나고 몹시 추운 겨울이 찾아왔어요. 쌩쌩 부는 찬 바람에 연못물도 꽁꽁 얼어붙기 시작했어요.',
      '갈 곳이 없던 아기 오리는 꽁꽁 언 얼음 위에서 너무 추워 오들오들 떨다가 그만 정신을 잃고 쓰러졌어요.',
      '다행히 지나가던 맘씨 착한 농부가 쓰러진 아기 오리를 발견하고 집으로 데려가 따뜻하게 보살펴 주었어요. 아기 오리는 겨우 목숨을 구했지요.',
      '하지만 농부의 아이들이 아기 오리와 놀고 싶어서 자꾸만 쫓아다니며 장난을 쳤고, 겁을 먹은 아기 오리는 또다시 밖으로 달아나고 말았어요.',
      '길고 길었던 춥고 외로운 겨울이 끝나고, 마침내 따뜻한 봄 햇살이 연못 위를 비추기 시작했어요.',
      '아기 오리는 덤불 속에서 나와 맑은 물 위를 헤엄쳤어요. 그때, 연못 건너편에서 눈부시게 하얀 깃털과 긴 목을 가진 우아한 새 세 마리가 다가왔어요. 바로 백조들이었죠.',
      '"저렇게 아름다운 새들이 나처럼 못생긴 오리를 보면 또 부리로 쪼며 쫓아내겠지?" 아기 오리는 고개를 푹 숙이고 물 위로 슬프게 눈을 감았어요.',
      '그런데 맑은 물에 비친 자신의 모습을 본 아기 오리는 깜짝 놀랐어요! 물속에 비친 것은 칙칙한 회색 오리가 아니었어요.',
      '길고 우아한 목, 눈처럼 새하얀 깃털! 아기 오리는 어느새 세상에서 가장 아름다운 백조로 변해 있었던 거예요!',
      '다른 백조들이 다가와 다정하게 날개를 비비며 환영해 주었어요. 연못가에 놀러 온 아이들도 손뼉을 치며 소리쳤어요. "우와! 저기 새로 온 백조가 세상에서 제일 예쁘다!"',
      '미운 아기 오리, 아니, 아름다운 백조는 마음속 깊이 행복을 느끼며 맑은 연못 위를 우아하게 헤엄쳐 나갔답니다.'
    ]
  },

  classic_5_jack_and_beanstalk: {
    title: '잭과 콩나무',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '어느 작은 시골 마을에 잭이라는 씩씩한 소년이 홀어머니와 함께 살고 있었어요. 잭의 집은 너무너무 가난해서, 마침내 젖소 한 마리 외에는 먹을 것이 하나도 남지 않았지요.',
      '어머니가 슬픈 얼굴로 말했어요. "잭아, 어쩔 수 없구나. 장에 가서 이 젖소를 팔아 먹을 것을 사 오렴." 잭은 젖소를 끌고 장으로 향했어요.',
      '길을 가던 잭은 신비하게 생긴 할아버지를 만났어요. "얘야, 이 신기한 요술 콩 다섯 알과 네 젖소를 바꾸지 않겠니? 이 콩을 심으면 하룻밤 새 하늘까지 자란단다!"',
      '잭은 요술 콩이라는 말에 혹해서 그만 젖소와 콩을 훌렁 바꿔버렸어요. 하지만 집에 돌아온 잭을 본 어머니는 화가 나서 콩을 창밖으로 휙 던져버렸어요.',
      '다음 날 아침, 잠에서 깬 잭은 깜짝 놀랐어요. 마당에 던져진 콩이 밤새 쑥쑥 자라, 끝이 보이지 않는 커다란 콩나무가 되어 하늘 꼭대기 구름까지 뻗어 있었거든요!',
      '잭은 호기심을 참지 못하고 콩나무 줄기를 밟고 엉금엉금 하늘로 올라가기 시작했어요. 구름 위까지 올라가자 그곳에는 어마어마하게 커다란 거인의 성이 있었어요.',
      '잭이 성 안으로 살금살금 들어가 보니, 엄청나게 큰 거인 부인이 요리를 하고 있었어요. 부인은 잭을 보자 숨겨주며 말했어요. "빨리 오븐에 숨어라! 내 남편은 사람을 잡아먹는 무서운 거인이란다!"',
      '잠시 후 쿵! 쿵! 쿵! 발소리와 함께 거인이 돌아왔어요. "킁킁! 어디서 사람 냄새가 나는데!" 거인은 킁킁거리다 고기를 배불리 먹고는 금화가 가득 든 자루를 세다가 잠이 들었어요.',
      '거인이 드르렁 코를 골며 잠들자, 잭은 몰래 오븐에서 나와 금화 자루를 하나 짊어지고 콩나무를 타고 집으로 내려왔어요.',
      '잭과 어머니는 금화 덕분에 한동안 행복하게 살았어요. 하지만 금화가 다 떨어지자 잭은 다시 콩나무를 타고 거인의 성으로 올라갔어요.',
      '이번에 거인은 황금알을 낳는 거위를 탁자 위에 올려놓고 있었어요. 거인이 "알을 낳아라!" 하고 외치면 거위가 반짝이는 황금알을 낳았지요.',
      '거인이 낮잠에 빠지자, 잭은 살금살금 다가가 황금알을 낳는 거위를 품에 안고 재빨리 집으로 도망쳐 내려왔어요. 덕분에 잭과 어머니는 큰 부자가 되었어요.',
      '얼마 후, 잭은 호기심을 참지 못하고 세 번째로 콩나무에 올랐어요. 이번에 거인은 아름다운 소리로 저절로 연주하는 마법의 하프를 듣고 있었어요.',
      '거인이 코를 골기 시작하자, 잭은 마법의 하프를 덥석 집어 들었어요. 그런데 하프가 갑자기 "주인님! 도둑이에요! 주인이이임!" 하고 큰 소리로 외치기 시작했어요.',
      '깜짝 놀라 깨어난 거인은 잭을 발견하고 쿵쿵거리며 무서운 속도로 쫓아왔어요! 잭은 콩나무를 향해 죽을힘을 다해 뛰었어요.',
      '잭은 하프를 안고 콩나무 줄기를 미끄러지듯 쏜살같이 내려왔어요. 거인도 잭을 잡으려고 콩나무를 타고 쿵쾅쿵쾅 내려오기 시작했지요.',
      '마당에 도착한 잭은 소리쳤어요. "어머니! 빨리 도끼를 가져다주세요!" 어머니가 가져온 도끼를 받아 든 잭은 콩나무 밑동을 힘껏 쾅! 쾅! 찍었어요.',
      '쩍! 찌지직! 커다란 콩나무가 꺾이면서 땅으로 쓰러졌고, 콩나무를 타고 내려오던 무서운 거인도 커다란 소리를 내며 땅으로 떨어져 죽고 말았어요.',
      '그 후로 잭은 더 이상 욕심을 부리지 않았어요. 황금 거위와 마법 하프를 소중히 돌보며, 어머니와 함께 세상에서 가장 평화롭고 행복하게 살았답니다.'
    ]
  },

  classic_15_puss_in_boots: {
    title: '장화 신은 고양이',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '어느 시골 마을에 늙은 방앗간 주인이 세 아들을 남기고 세상을 떠났어요. 첫째는 방앗간을, 둘째는 당나귀를 가졌지만, 셋째 아들에게는 고양이 한 마리만 남겨졌지요.',
      '가난한 셋째 아들은 낡은 옷을 입고 한숨을 쉬었어요. "휴우, 고양이 한 마리로 어떻게 먹고살 수 있을까?"',
      '그런데 놀랍게도 고양이가 말을 하기 시작했어요. "주인님, 슬퍼하지 마세요. 저에게 튼튼한 장화 한 켤레와 커다란 자루 하나만 구해주시면 제가 부자로 만들어 드릴게요!"',
      '셋째 아들은 반신반의하면서도 남은 돈을 털어 멋진 빨간 장화와 자루를 사주었어요. 장화를 신은 고양이는 자루에 신선한 당근을 넣고 숲으로 갔어요.',
      '고양이는 당근 냄새를 맡고 다가온 통통하고 커다란 토끼를 자루에 쏙 잡았어요. 그리고 곧장 궁전으로 달려가 임금님께 바쳤지요.',
      '"위대하신 임금님, 제 주인님이신 \'카라바스 후작\'님께서 바치시는 귀한 선물입니다." 임금님은 처음 듣는 카라바스 후작의 선물에 아주 기뻐했어요.',
      '고양이는 매일같이 살진 꿩과 토끼들을 잡아 임금님께 바치며 카라바스 후작의 이름을 널리 알렸어요.',
      '어느 날, 임금님과 아름다운 공주님이 마차를 타고 강가를 산책한다는 소식을 듣고 고양이는 꾀를 내었어요.',
      '"주인님, 빨리 옷을 벗고 저 강물 속으로 들어가 목욕하는 척을 하세요!" 주인이 고개를 갸우뚱거리며 강물에 들어가자, 고양이는 주인의 낡은 옷을 바위 밑에 숨겼어요.',
      '임금님의 마차가 다가오자 고양이는 길가로 뛰어나가 다급하게 소리쳤어요. "도와주세요! 카라바스 후작님이 물에 빠졌어요! 도둑들이 후작님의 옷까지 훔쳐 갔어요!"',
      '임금님은 깜짝 놀라 신하들에게 후작을 구하고, 궁전에서 가장 화려하고 멋진 옷을 가져다 입히라고 명령했어요.',
      '화려한 귀족의 옷을 입은 셋째 아들은 정말로 멋진 후작처럼 보였어요. 공주님은 멋진 청년의 모습에 단숨에 사랑에 빠지고 말았지요.',
      '임금님은 셋째 아들을 마차에 태웠어요. 고양이는 마차보다 먼저 앞서 뛰어가며 들판에서 일하는 농부들에게 무섭게 으름장을 놓았어요.',
      '"곧 임금님 마차가 지나갈 거요! 임금님이 이 땅의 주인이 누구냐 묻거든 반드시 \'카라바스 후작님\'의 땅이라고 대답하시오! 안 그러면 큰 벌을 받을 거요!"',
      '마차가 지나가며 묻자 농부들은 모두 카라바스 후작의 땅이라고 대답했고, 임금님은 후작의 어마어마한 땅에 감탄했어요.',
      '고양이는 계속 달려가 마침내 진짜 땅의 주인인 무서운 식인 거인의 성에 도착했어요. 고양이는 성안으로 들어가 거인에게 칭찬을 늘어놓았어요.',
      '"거인님은 어떤 동물이든 다 변할 수 있는 마법을 하신다면서요? 커다란 사자로 변하는 것도 가능하신가요?"',
      '우쭐해진 거인은 으르렁거리며 커다란 사자로 변했어요. 고양이는 깜짝 놀란 척하며 말했어요. "우와! 정말 대단해요! 하지만 아주 조그만 생쥐로 변하는 건 어렵겠죠?"',
      '거인은 코웃음을 치며 작고 쪼그만 생쥐로 펑! 변했어요. 그 순간 장화 신은 고양이는 날쌔게 달려들어 생쥐를 한입에 꿀꺽 삼켜버렸어요!',
      '마침 임금님의 마차가 성 앞에 도착했어요. 고양이는 문을 활짝 열며 외쳤어요. "카라바스 후작님의 성에 오신 것을 환영합니다!"',
      '끝없이 넓은 영지와 화려한 성을 본 임금님은 크게 감동했어요. 셋째 아들은 공주님과 결혼하여 진짜 훌륭한 귀족이 되었고, 장화 신은 고양이는 세상에서 가장 행복한 고양이 귀족이 되었답니다.'
    ]
  },
  classic_20_wizard_of_oz: {
    title: '오즈의 마법사',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '미국 캔자스의 넓은 들판에 귀여운 소녀 도로시와 작은 강아지 토토가 살고 있었어요. 언제나 조용하고 평화로운 시골 마을이었지요.',
      '그러던 어느 날, 하늘이 캄캄해지더니 무시무시하고 커다란 회오리바람이 불어왔어요. "토토야, 위험해!" 도로시는 토토를 안고 집 안으로 숨었어요.',
      '그런데 회오리바람이 집을 통째로 휙 들어 올려 하늘 높이 날아가기 시작했어요. 빙글빙글 돌던 집은 아주 오랜 시간이 지난 뒤 쿵! 하고 낯선 곳에 떨어졌어요.',
      '도로시가 문을 열고 나가보니, 한 번도 본 적 없는 아름답고 신비한 나라가 펼쳐져 있었어요. 도로시의 집이 떨어지면서 나쁜 동쪽 마녀를 깔아 뭉치게 되었고, 겁쟁이 먼치킨 마을 사람들은 도로시를 영웅으로 환영해주었지요.',
      '착한 북쪽 마녀가 나타나 반짝이는 은구두를 선물하며 말했어요. "집으로 돌아가려면 에메랄드 시티에 사는 위대한 오즈의 마법사를 찾아가렴. 노란 벽돌 길만 따라가면 된단다."',
      '은구두를 신은 도로시는 토토와 함께 노란 벽돌 길을 걷기 시작했어요. 얼마 가지 않아, 장대 끝에 매달려 까마귀를 쫓고 있는 허수아비를 만났어요.',
      '"나는 지혜로운 뇌를 갖고 싶어." 허수아비의 말을 듣고 도로시는 에메랄드 시티에 함께 가자고 했어요.',
      '다시 숲길을 걷던 중, 온몸이 녹슬어 꼼짝 못 하는 양철 나무꾼을 발견했어요. 기름을 쳐서 움직일 수 있게 해주자 양철 나무꾼이 슬프게 말했어요. "나에게도 따뜻하게 뛰는 심장이 있으면 좋겠어." 양철 나무꾼도 여행에 합류했지요.',
      '깊고 어두운 숲속에 들어섰을 때, 커다란 사자 한 마리가 으르렁거리며 나타났어요. 하지만 토토가 짖자 사자는 깜짝 놀라 훌쩍 울음을 터뜨렸어요. "나는 동물의 왕이지만 사실 겁이 너무 많아. 용기를 갖고 싶어."',
      '똑똑해지고 싶은 허수아비, 심장을 원하는 양철 나무꾼, 용기가 필요한 사자, 그리고 집으로 가고 싶은 도로시까지. 네 친구는 험난한 숲과 무서운 괴물들을 피해 서로를 돕고 의지하며 마침내 초록빛으로 반짝이는 에메랄드 시티에 도착했어요.',
      '위대한 오즈의 마법사는 웅장한 목소리로 말했어요. "소원을 이루고 싶다면, 서쪽에 사는 나쁜 마녀의 빗자루를 빼앗아 오너라!"',
      '친구들은 무서웠지만 포기하지 않고 서쪽 마녀의 성으로 향했어요. 하지만 서쪽 마녀가 보낸 날개 달린 원숭이들에게 붙잡히고 말았지요.',
      '마녀는 도로시의 은구두를 빼앗으려 했어요. 화가 난 도로시가 옆에 있던 양동이의 물을 마녀에게 확 끼얹자, 마법에 걸린 마녀는 "아악! 내가 녹고 있어!" 하며 스르르 녹아 사라져 버렸어요.',
      '서쪽 마녀의 빗자루를 가지고 당당하게 돌아온 친구들은 오즈의 마법사의 진짜 정체를 알게 되었어요. 사실 그는 위대한 마법사가 아니라 길을 잃고 오즈에 떨어진 보통 할아버지였어요.',
      '하지만 할아버지는 훌륭한 선물을 주었어요. 허수아비에게는 지혜를 상징하는 훈장을, 양철 나무꾼에게는 째깍거리는 하트 모양 시계를, 사자에게는 용기가 솟아나는 약을 주었지요. 사실 친구들은 모험을 통해 이미 그 모든 것을 마음속에 얻은 상태였답니다.',
      '마지막으로 착한 마녀 글린다가 도로시에게 캔자스로 돌아가는 방법을 알려주었어요. "도로시야, 네가 신고 있는 은구두의 뒤꿈치를 세 번 부딪치며 소원을 말해보렴."',
      '"집보다 좋은 곳은 없어. 집으로 보내줘!" 도로시가 주문을 외우자, 발이 붕 떠오르며 세상이 빙글빙글 돌았어요.',
      '눈을 떠보니, 도로시는 다시 캔자스의 따뜻한 집 침대에 누워 있었어요. 사랑하는 엠 아줌마와 헨리 아저씨가 다가와 도로시를 꼭 안아주었답니다. 도로시의 신비하고 긴 여행은 그렇게 끝이 났어요.'
    ]
  },

  classic_18_alice: {
    title: '이상한 나라의 앨리스',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '따뜻한 햇살이 내리쬐는 오후, 언니가 책을 읽어주는 곁에서 꾸벅꾸벅 졸고 있던 앨리스는 아주 신기한 것을 보았어요.',
      '조끼를 입고 회중시계를 든 하얀 토끼가 "큰일 났어, 큰일 났어! 늦어버리겠어!" 하며 바쁘게 뛰어가는 것이었어요.',
      '호기심이 발동한 앨리스는 하얀 토끼를 쫓아 커다란 토끼굴 속으로 훌쩍 뛰어들었어요. 토끼굴은 우물처럼 깊어서 앨리스는 아래로, 아래로 끝없이 둥둥 떨어졌지요.',
      '쿵! 하고 푹신한 나뭇잎 더미 위에 떨어진 앨리스 앞에는 수많은 문이 달린 긴 복도가 있었어요.',
      '가운데 유리 탁자 위에는 예쁜 황금 열쇠와 "나를 마셔요"라고 적힌 작은 유리병이 있었어요. 병 안의 쥬스를 마시자, 앨리스의 몸이 손바닥만 하게 작아졌어요.',
      '다시 "나를 먹어요"라고 적힌 케이크를 한 입 베어 먹자, 이번에는 천장에 머리가 닿을 만큼 거인처럼 커졌어요! 마음대로 안 되는 몸 때문에 앨리스가 흘린 커다란 눈물이 웅덩이를 만들어 버렸어요.',
      '다시 작아진 앨리스는 자신이 만든 눈물바다를 헤엄치며 이상한 숲속으로 들어갔어요. 그곳에서 버섯 위에 앉아 물담배를 피우는 지혜로운 애벌레를 만나 키를 조절하는 버섯 먹는 법을 배웠지요.',
      '숲을 걷던 앨리스는 나무 위에서 입만 활짝 웃고 있는 체셔 고양이를 만났어요. "토끼를 찾으려면 미친 모자장수에게 가보렴." 체셔 고양이는 수수께끼 같은 말만 남기고 빙그레 웃으며 스르르 사라졌어요.',
      '미친 모자장수와 3월의 토끼는 끝이 없는 긴 식탁에서 영원히 끝나지 않는 시끄러운 다과회를 열고 있었어요. 엉터리 수수께끼와 무례한 말장난에 지친 앨리스는 화를 내며 정원으로 가버렸어요.',
      '도착한 곳은 하트 여왕님의 아름다운 장미 정원이었어요. 그런데 몸이 납작한 트럼프 카드 병정들이 흰 장미를 붉은색 페인트로 허둥지둥 칠하고 있었어요.',
      '"여왕님이 붉은 장미를 원하시는데 실수로 흰 장미를 심었거든. 들키면 목이 달아날 거야!" 병정들이 부들부들 떨며 말했어요.',
      '그때 나팔 소리와 함께 무시무시한 하트 여왕이 나타났어요. 붉은 페인트를 발견한 여왕은 얼굴이 붉으락푸르락해지며 소리쳤어요. "저놈들의 목을 쳐라!"',
      '여왕은 앨리스에게 크로케 경기를 하자고 했어요. 하지만 살아있는 홍학을 골프채로 쓰고, 돌돌 말린 고슴도치를 공으로 쓰는 세상에서 제일 이상하고 정신없는 경기였지요.',
      '경기가 끝나자 성 안에서 재판이 열렸어요. 여왕의 맛있는 하트 타르트를 누군가 훔쳐 갔다는 것이었어요.',
      '아무 죄 없는 하트 잭이 범인으로 몰렸고, 앨리스가 증인으로 불려 나갔어요. 그런데 갑자기 앨리스의 몸이 쑥쑥 다시 커지기 시작했어요.',
      '여왕이 억지를 부리며 소리쳤어요. "이방인은 당장 나가라! 저 소녀의 목도 쳐라!"',
      '하지만 거인처럼 커진 앨리스는 조금도 무섭지 않았어요. "흥! 당신들은 그저 종이 쪼가리 트럼프 카드일 뿐이잖아!" 하고 당당하게 외쳤지요.',
      '그 순간, 수십 장의 트럼프 카드들이 앨리스의 얼굴을 향해 한꺼번에 회오리바람처럼 날아올랐어요.',
      '"앗!" 앨리스는 깜짝 놀라 비명을 지르며 눈을 번쩍 떴어요. 눈을 떠보니, 앨리스는 언니의 무릎을 베고 풀밭에 누워 평화롭게 낮잠을 자고 있었어요.',
      '언니가 앨리스의 얼굴에 떨어진 마른 낙엽들을 털어주며 다정하게 웃었어요. 앨리스는 자신이 겪은 신기하고 이상한 나라의 꿈을 생각하며 빙그레 미소를 지었답니다.'
    ]
  },

  classic_14_sleeping_beauty: {
    title: '잠자는 숲속의 공주',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '오래전, 아기가 없어 늘 슬퍼하던 왕과 왕비에게 눈에 넣어도 아프지 않을 아름다운 공주님이 태어났어요.',
      '왕은 너무 기뻐서 나라 안의 모든 요정들을 초대해 성대한 축하 잔치를 열었어요. 하지만 금 접시가 12개뿐이라, 13번째 마녀는 초대받지 못했지요.',
      '초대받은 12명의 착한 요정들은 아기 공주에게 차례차례 마법의 선물을 주었어요. 아름다움, 착한 마음씨, 지혜로움, 고운 목소리를 축복으로 내려주었죠.',
      '11번째 요정까지 축복을 마쳤을 때, 성문이 쾅 열리며 초대받지 못해 몹시 화가 난 13번째 늙은 마녀가 폭풍우와 함께 나타났어요.',
      '"나를 빼놓다니 감히 용서할 수 없다! 이 아이는 열여섯 살이 되는 날, 날카로운 물레 바늘에 찔려 죽고 말 것이다!" 마녀는 무서운 저주를 퍼붓고 사라졌어요.',
      '왕과 왕비가 눈물을 흘리며 슬퍼할 때, 아직 축복을 내리지 않은 마지막 요정이 앞으로 나섰어요.',
      '"저주의 마법이 너무 강해 완전히 없앨 수는 없지만, 죽는 대신 100년 동안 깊은 잠에 빠지게 될 것입니다. 그리고 진실한 사랑의 입맞춤이 공주를 깨울 것입니다." 요정이 말했어요.',
      '왕은 저주를 막기 위해 나라 안의 모든 물레를 불태우라고 명령했어요. 공주는 요정들의 축복대로 세상에서 가장 아름답고 지혜로운 소녀로 자라났지요.',
      '공주가 16살 생일을 맞이한 날, 부모님이 외출한 사이 공주는 성 안의 이곳저곳을 호기심 있게 구경했어요.',
      '아무도 없는 낡은 탑 꼭대기에 올라간 공주는 한 번도 본 적 없는 물건, 윙윙 돌아가는 물레를 잣고 있는 할머니를 발견했어요.',
      '그 할머니는 바로 마녀가 변장한 모습이었어요. "어머, 신기해라. 저도 한 번 만져봐도 될까요?"',
      '공주가 물레 바늘에 손을 뻗은 순간, 뾰족한 바늘이 공주의 예쁜 손가락을 콕 찌르고 말았어요. 공주는 그 자리에 스르르 쓰러져 깊고 깊은 잠에 빠졌지요.',
      '동시에 성 안의 모든 사람과 동물들도 잠이 들었어요. 왕과 왕비, 요리사, 강아지, 지붕 위의 비둘기, 심지어 활활 타오르던 난로의 불꽃마저 시간이 멈춘 듯 잠이 들었어요.',
      '성 주변에는 굵고 날카로운 가시덤불이 마법처럼 자라나 순식간에 성 전체를 꽁꽁 뒤덮어버렸어요.',
      '100년이라는 아주 긴 시간이 흘렀어요. "저 가시덤불 안에 아름다운 잠자는 공주가 있대!" 수많은 이웃 나라 왕자들이 공주를 구하려 했지만 가시덤불에 갇혀 아무도 성에 들어가지 못했어요.',
      '마침내 딱 100년째가 되는 날, 용감하고 마음이 선량한 한 이웃 나라 왕자가 성을 찾아왔어요.',
      '왕자가 가시덤불에 다가가자, 무시무시하던 가시들은 신기하게도 탐스럽고 아름다운 붉은 장미꽃으로 변하며 스르륵 길을 열어주었어요.',
      '성 안으로 들어간 왕자는 모두가 쿨쿨 잠들어 있는 모습에 깜짝 놀랐어요. 탑 꼭대기 방까지 올라간 왕자는 눈을 감고 잠든 눈부시게 아름다운 공주를 발견했지요.',
      '왕자는 공주의 아름다움에 이끌려 다가가 살며시 입을 맞추었어요. 그러자 기적처럼 마법이 풀리기 시작했어요.',
      '공주가 길고 맑은 눈썹을 파르르 떨며 눈을 뜨고 왕자에게 미소 지었어요. 그러자 성 안의 모든 생명도 100년의 긴 잠에서 깨어나 환호했답니다. 왕자와 공주는 성대한 결혼식을 올리고 오랫동안 행복하게 살았어요.'
    ]
  },

  classic_16_rapunzel: {
    title: '라푼젤',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '옛날 어느 부부에게 예쁜 아기가 생겼어요. 임신한 아내는 이웃집 무서운 마녀의 정원에 탐스럽게 자란 \'라푼젤\'이라는 채소가 너무나 먹고 싶어 병이 날 지경이었어요.',
      '남편은 아내를 위해 밤에 몰래 마녀의 정원 담을 넘어 라푼젤을 캐려 했어요. 그때 무시무시한 마녀에게 딱 걸리고 말았지요.',
      '"내 채소를 훔치다니! 목숨을 살려주는 대신 네 아내가 아기를 낳으면 나에게 넘기거라." 마녀의 협박에 겁에 질린 남편은 덜덜 떨며 약속하고 말았어요.',
      '얼마 후 아내가 귀여운 여자아이를 낳자, 마녀는 아기를 빼앗아 가버렸어요. 마녀는 아기 이름을 라푼젤이라 지어주고 자신의 딸처럼 키웠어요.',
      '라푼젤은 세상에서 가장 아름다운 긴 황금빛 머리카락을 가진 소녀로 자라났어요.',
      '라푼젤이 12살이 되자, 마녀는 라푼젤을 깊은 숲속 한가운데 있는 문도, 계단도 없는 아주 높은 탑 꼭대기 방에 가두어 버렸어요.',
      '마녀가 탑 아래에서 "라푼젤! 라푼젤! 네 머리채를 내려다오!" 하고 외치면, 라푼젤은 길고 튼튼한 금발 머리를 창밖으로 늘어뜨렸고, 마녀는 그 머리카락을 밧줄 삼아 타고 올라갔지요.',
      '탑에 갇힌 라푼젤은 너무나 외로웠어요. 매일 밤 창가에 앉아 은쟁반에 옥구슬 굴러가듯 맑고 고운 목소리로 노래를 부르며 달래곤 했어요.',
      '어느 날, 숲을 지나가던 이웃 나라의 젊은 왕자가 라푼젤의 그 아름다운 노랫소리에 마음을 뺏기고 말았어요.',
      '노래가 들려오는 탑 아래로 간 왕자는 나무 뒤에 숨어서, 마녀가 머리카락을 타고 올라가는 놀라운 광경을 지켜보았지요.',
      '마녀가 떠난 뒤, 왕자도 탑 아래로 가서 마녀 흉내를 내며 소리쳤어요. "라푼젤! 라푼젤! 네 머리채를 내려다오!"',
      '머리카락을 타고 올라온 사람이 마녀가 아닌 낯선 청년인 것을 본 라푼젤은 깜짝 놀라 두려워했어요.',
      '하지만 왕자의 부드럽고 진실한 목소리와 다정한 눈빛에 금세 마음이 녹았고, 두 사람은 곧 깊이 사랑에 빠지게 되었지요.',
      '왕자는 매일 밤 라푼젤을 찾아왔고, 그녀를 구출하기 위해 튼튼한 비단 실을 가져와 몰래 사다리를 만들기로 약속했어요.',
      '하지만 어느 날, 세상 물정을 몰랐던 라푼젤이 마녀에게 그만 말실수를 하고 말았어요. "엄마 옷은 무거운데, 왕자님 옷은 끌어올리기 참 가벼워요."',
      '왕자가 오고 있었다는 사실을 눈치챈 마녀는 화가 나서 펄쩍펄쩍 뛰었어요! 마녀는 가위를 가져와 라푼젤의 아름다운 긴 금발을 싹둑 잘라버렸어요.',
      '그리고 불쌍한 라푼젤을 아무도 없는 거친 사막으로 내쫓아버렸지요. 그날 밤, 마녀는 잘라낸 라푼젤의 머리카락을 창밖으로 내리고 왕자를 기다렸어요.',
      '"라푼젤! 머리채를 내려다오!" 왕자가 기쁘게 머리카락을 타고 올라가자, 꼭대기에서 기다리고 있던 것은 무서운 마녀였어요.',
      '"네 예쁜 새는 영원히 날아가 버렸다!" 마녀의 끔찍한 웃음소리에 놀란 왕자는 그만 발을 헛디뎌 아주 높은 탑 아래 가시덤불 위로 떨어지고 말았어요.',
      '목숨은 구했지만 날카로운 가시에 찔려 두 눈이 멀어버린 왕자는, 라푼젤을 그리워하며 온 세상을 지팡이에 의지해 슬프게 헤맸어요.',
      '수년이 흐른 뒤, 사막을 걷던 눈먼 왕자는 익숙하고 고운 노랫소리를 듣게 되었어요. 바로 라푼젤의 목소리였어요!',
      '초라해진 왕자를 한눈에 알아본 라푼젤은 왕자의 목을 끌어안고 엉엉 눈물을 흘렸어요. 라푼젤의 맑은 눈물이 왕자의 두 눈에 톡, 톡 떨어졌어요.',
      '그러자 기적처럼 상처가 낫고 왕자의 두 눈이 번쩍 뜨였어요! 시력을 되찾은 왕자는 라푼젤을 꼬옥 안아주었답니다.',
      '왕자는 라푼젤을 자신의 나라로 데려가 성대한 결혼식을 올렸고, 힘든 시련을 겪은 두 사람은 평생토록 아끼며 행복하게 살았답니다.'
    ]
  },
  classic_thumbelina: {
    title: '엄지공주',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '옛날 어느 마을에 예쁜 아기를 간절히 바라는 아주머니가 살고 있었어요. 마음씨 착한 마녀가 아주머니에게 작은 씨앗 하나를 주며 화분에 심어보라고 했지요.',
      '씨앗을 심고 정성껏 물을 주자, 얼마 후 아름답고 커다란 튤립꽃이 활짝 피어났어요. 꽃잎이 사르르 열리자, 그 안에는 엄지손가락만 한 아주 작고 귀여운 여자아이가 앉아 있었어요.',
      '아주머니는 아이에게 "엄지공주"라는 예쁜 이름을 지어주었어요. 엄지공주는 호두껍데기 침대에서 자고, 장미 꽃잎을 이불 삼아 덮으며 행복하게 자라났어요.',
      '그러던 어느 날 밤, 열려 있는 창문으로 커다랗고 못생긴 두꺼비 한 마리가 폴짝 뛰어 들어왔어요.',
      '"개굴개굴! 정말 예쁜 아가씨군. 내 아들의 신부로 딱 맞겠어!" 두꺼비는 호두껍데기 침대째로 잠든 엄지공주를 훔쳐서 연못으로 도망쳐 버렸어요.',
      '아침이 되어 잠에서 깬 엄지공주는 연못 한가운데 둥둥 뜬 커다란 연잎 위에 있는 자신을 발견하고 엉엉 울었어요.',
      '그 모습을 불쌍하게 여긴 물고기들이 연잎의 줄기를 갉아 끊어주었고, 하얀 나비 한 마리가 연잎을 끌어당겨 엄지공주가 멀리 도망칠 수 있게 도와주었어요.',
      '하지만 이번에는 커다란 풍뎅이가 날아와 엄지공주를 낚아채서 숲속 나무 위로 데려가 버렸어요. 풍뎅이 친구들이 "다리가 두 개뿐이잖아? 너무 못생겼어!" 하고 놀리자, 풍뎅이는 엄지공주를 들판에 버려두고 떠났어요.',
      '여름과 가을 동안 엄지공주는 숲속에서 꽃꿀을 마시고 이슬을 먹으며 홀로 외롭게 지냈어요. 곧 무섭고 추운 겨울이 찾아왔고, 하얀 눈이 펑펑 내리기 시작했지요.',
      '추위에 오들오들 떨던 엄지공주는 마음씨 좋은 들쥐 할머니의 따뜻한 땅속 집을 발견했어요. 할머니는 엄지공주를 불쌍히 여겨 따뜻한 수프를 주며 겨울을 나게 해주었어요.',
      '그런데 들쥐 할머니의 이웃인 눈이 나쁜 두더지가 얌전하고 고운 목소리를 가진 엄지공주에게 반해 결혼을 하겠다고 했어요.',
      '두더지는 햇빛을 몹시 싫어해서 평생 캄캄한 땅속에서만 살아야 했어요. 엄지공주는 밝은 햇살과 예쁜 꽃들을 다시는 볼 수 없다는 생각에 너무나 슬펐어요.',
      '어느 날, 엄지공주는 두더지의 땅속 굴에서 추위에 얼어 쓰러진 제비 한 마리를 발견했어요. 마음 착한 엄지공주는 매일 밤 몰래 제비에게 다가가 깃털 이불을 덮어주고 따뜻하게 간호해 주었어요.',
      '엄지공주의 정성 덕분에 기운을 차린 제비가 말했어요. "고마운 엄지공주님, 겨울이 끝나가요. 저와 함께 따뜻한 남쪽 나라로 날아가지 않을래요?"',
      '두더지와의 결혼식 전날, 엄지공주는 제비의 등에 살포시 올라탔어요. 제비는 파란 하늘을 향해 힘차게 날아올랐지요.',
      '높은 산을 넘고 넓은 바다를 건너, 마침내 아름다운 꽃들이 가득 피어 있고 따뜻한 햇살이 내리쬐는 남쪽 나라에 도착했어요.',
      '제비가 가장 아름다운 하얀 꽃 위에 엄지공주를 내려주었어요. 놀랍게도 그 꽃 안에는 엄지공주처럼 아주 작고, 등에 투명한 날개가 달린 꽃의 왕자님이 살고 있었어요.',
      '왕자님은 엄지공주의 아름다움과 착한 마음에 반해 다정하게 청혼했어요. 그리고 엄지공주에게 반짝이는 예쁜 요정 날개를 선물해 주었지요.',
      '이제 엄지공주도 꽃의 요정들처럼 날개가 생겼어요! 엄지공주는 왕자님과 함께 이 꽃에서 저 꽃으로 날아다니며 영원히 행복하게 살았답니다.'
    ]
  },

  classic_emperors_new_clothes: {
    title: '벌거벗은 임금님',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '옛날 옛적, 세상에서 새 옷을 입는 것을 제일 좋아하는 임금님이 살고 있었어요. 임금님은 나랏일은 돌보지 않고 하루 종일 옷방에서 옷만 갈아입었어요.',
      '"세상에서 제일 화려하고 멋진 옷을 만들어 오너라!" 임금님의 옷 욕심 때문에 백성들은 세금을 내느라 허리가 휘었지요.',
      '어느 날, 이 소문을 들은 두 명의 사기꾼이 궁전으로 찾아와 임금님에게 거짓말을 했어요.',
      '"저희는 세상에서 가장 신기한 옷감을 짤 수 있는 재단사입니다. 이 옷감으로 만든 옷은 바보나 자기 자리에 어울리지 않는 사람의 눈에는 절대 보이지 않는답니다!"',
      '임금님은 깜짝 놀라며 기뻐했어요. "그 옷만 있다면 누가 바보인지, 누가 나쁜 신하인지 단번에 알 수 있겠구나! 당장 그 옷을 만들도록 하여라!"',
      '임금님은 사기꾼들에게 어마어마하게 많은 금화와 값비싼 비단을 주었어요. 사기꾼들은 텅 빈 베틀 앞에 앉아 밤낮없이 옷감을 짜는 척 연기를 했지요.',
      '며칠 뒤, 임금님은 옷이 얼마나 완성되었는지 궁금해서 가장 똑똑한 늙은 장관을 먼저 보냈어요.',
      '베틀 앞을 빤히 보던 장관은 깜짝 놀랐어요. 눈앞에 옷감이 하나도 보이지 않았거든요! 하지만 자신이 바보로 보일까 봐 겁이 났어요.',
      '"오오! 정말 눈부시게 아름다운 무늬와 색깔이군요! 당장 임금님께 이 훌륭한 옷감에 대해 보고하겠습니다." 장관은 돌아가서 땀을 흘리며 거짓말을 했어요.',
      '이번에는 다른 신하를 보냈지만, 그 신하 역시 옷이 보이지 않는다는 것을 들킬까 봐 아름답다고 거짓 칭찬을 늘어놓았어요.',
      '마침내 옷이 다 완성되었다는 소식에 임금님이 직접 신하들을 거느리고 사기꾼들을 찾아갔어요.',
      '하지만 임금님의 눈에도 옷은 전혀 보이지 않았어요. 텅 빈 공기뿐이었죠. 임금님은 속으로 덜덜 떨었어요. "내가 바보란 말인가? 내가 임금 자격이 없단 말인가!"',
      '하지만 임금님도 헛기침을 하며 거짓말을 했어요. "흠흠, 참으로 멋진 옷이로구나! 마음에 쏙 든다!" 신하들도 덩달아 손뼉을 치며 훌륭하다고 아부했어요.',
      '사기꾼들은 임금님의 옷을 벗기고는, 보이지도 않는 새 옷을 정성스럽게 입혀주는 척 연기했어요. "임금님, 옷이 공기처럼 가벼워서 안 입은 것 같으실 겁니다!"',
      '임금님은 거울 앞에서 몸을 이리저리 돌리며 없는 옷을 입은 척 폼을 잡았어요. 그리고 새로 만든 투명한 옷을 입고 거리를 행진하기로 했어요.',
      '궁전 밖의 백성들도 보이지 않는 옷에 대한 소문을 이미 다 듣고 있었어요. 모두들 자신이 바보라는 걸 들킬까 봐 입을 모아 소리쳤지요.',
      '"우와! 임금님의 새 옷이 정말 아름답습니다! 망토가 끝내주게 멋지네요!"',
      '임금님은 속옷 차림으로 배를 쑥 내밀고 뽐내며 거리를 걸었어요. 신하들도 보이지 않는 망토 자락을 든 척하며 뒤를 따랐지요.',
      '그때, 아빠 품에 안겨 있던 한 어린아이가 임금님을 손가락질하며 꺄르르 웃음을 터뜨렸어요.',
      '"하하하! 저것 봐! 임금님이 벌거벗었어! 속옷만 입고 걷고 있잖아!" 아이의 순수하고 솔직한 외침에 거리는 순간 쥐 죽은 듯 조용해졌어요.',
      '그제야 백성들도 하나둘씩 웃음을 터뜨리기 시작했어요. "맞아! 아이의 말이 맞아! 임금님이 벌거벗었다!"',
      '임금님은 그제야 자신이 속았다는 사실을 깨닫고 얼굴이 사과처럼 새빨개졌어요. 하지만 행진을 멈출 수는 없었기에, 아무렇지 않은 척 턱을 높이 들고 끝까지 씩씩하게 걸어갔답니다.'
    ]
  },

  classic_little_mermaid: {
    title: '인어공주',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '깊고 푸른 바닷속 아름다운 산호 궁전에 바다의 왕과 여섯 명의 인어공주가 살고 있었어요. 그중 막내 인어공주는 바다에서 가장 맑고 고운 목소리를 가졌지요.',
      '인어들은 15살이 되어야만 바다 위로 올라가 세상을 구경할 수 있었어요. 막내 인어공주는 언니들이 들려주는 육지 세상과 인간들의 이야기를 들으며 밤낮으로 바다 위를 동경했어요.',
      '마침내 15살 생일이 된 막내 인어공주는 뛸 듯이 기뻐하며 바다 위로 헤엄쳐 올라갔어요. 물 밖으로 고개를 내밀자 밤하늘에는 별이 반짝이고, 커다란 배 위에서는 파티가 열리고 있었어요.',
      '인어공주는 배 위에서 활짝 웃고 있는 늠름하고 잘생긴 왕자님을 보고 첫눈에 사랑에 빠지고 말았어요.',
      '그런데 갑자기 무서운 폭풍우가 몰아치며 커다란 파도가 배를 덮쳤어요. 배는 산산조각이 났고, 왕자님은 바다 깊은 곳으로 가라앉기 시작했어요.',
      '인어공주는 힘껏 헤엄쳐 왕자님을 구해내어 모래사장 위로 눕혀 주었어요. 왕자님이 눈을 뜨기 전, 근처에서 사람들이 다가오는 소리가 들리자 공주는 얼른 바위 뒤로 숨었어요.',
      '한 이웃 나라 공주가 쓰러진 왕자님을 발견했고, 깨어난 왕자님은 자신을 구해준 사람이 그 이웃 나라 공주라고 굳게 믿게 되었지요.',
      '인어공주는 다리가 생겨 육지로 올라가 왕자님을 다시 만나고 싶었어요. 결국 깊고 어두운 바닷속 마녀를 찾아갔어요.',
      '"다리를 갖게 해주는 대신, 네 그 아름다운 목소리를 다오. 하지만 명심해라! 걷게 되면 매일 칼날 위를 걷는 것처럼 발이 아플 것이야. 그리고 왕자가 다른 여자와 결혼하면 너는 물거품이 되어 사라지고 말 거다!"',
      '인어공주는 두려웠지만, 꾹 참고 고개를 끄덕였어요. 마녀가 마법의 물약을 주자 공주의 목소리는 사라지고 다리가 생겨났어요.',
      '육지에 쓰러져 있던 인어공주를 왕자님이 우연히 발견하고 성으로 데려갔어요. 인어공주는 한마디도 할 수 없었지만, 왕자님을 볼 때마다 눈빛으로 사랑을 전했어요.',
      '인어공주는 발이 끊어질 듯 아파도 왕자님을 위해 밤마다 아름답게 춤을 추었어요. 왕자님도 말 없는 예쁜 공주를 무척이나 아끼고 귀여워해 주었지요.',
      '하지만 왕자님의 마음속에는 바닷가에서 자신을 구해준(그렇다고 굳게 믿고 있는) 이웃 나라 공주가 언제나 자리 잡고 있었어요.',
      '어느 날, 왕자님은 이웃 나라로 인사를 하러 갔다가 그곳의 공주를 만났어요. "아! 당신이 바로 나를 구해준 생명의 은인이군요!" 왕자님은 그녀와 결혼하기로 약속했어요.',
      '왕자님의 결혼식 날, 인어공주는 배 위에서 눈물을 흘리며 밤바다를 바라보았어요. 날이 밝으면 자신은 물거품이 되어 사라질 운명이었으니까요.',
      '그때 바다 위로 공주의 다섯 언니들이 머리카락을 모두 자른 채 나타났어요. "우리가 마녀에게 머리카락을 주고 이 단검을 받아왔어. 해가 뜨기 전에 이 단검으로 왕자를 찌르면, 넌 다시 인어가 되어 바다로 돌아올 수 있어!"',
      '인어공주는 떨리는 손으로 단검을 받아 들고 왕자님의 침실로 갔어요. 잠든 왕자님의 평온한 얼굴을 본 인어공주는 도저히 그를 찌를 수 없었어요.',
      '사랑하는 왕자님이 행복하기를 바라며, 인어공주는 단검을 깊은 바다로 던져버리고 스스로 바다에 몸을 던졌어요.',
      '인어공주의 몸은 투명한 물거품으로 변하기 시작했어요. 하지만 슬프지 않았어요. 하늘에서 따뜻한 빛이 내려오더니 인어공주의 몸을 사르르 감싸 안아 주었거든요.',
      '진정한 사랑과 희생을 보여준 인어공주는 사라지지 않고 아름다운 공기의 요정이 되었답니다. 인어공주는 따뜻한 봄바람이 되어 왕자님의 이마에 부드럽게 입을 맞추고, 저 높은 하늘로 날아올라 영원한 평화를 얻었답니다.'
    ]
  },
classic_11_aladdin: {
    title: '알라딘과 요술 램프',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '아주 먼 옛날, 뜨거운 모래바람이 부는 아라비아의 어느 활기찬 마을에 알라딘이라는 가난하지만 마음씨 착한 청년이 살고 있었어요.',
      '알라딘은 시장에서 일을 도와주며 하루하루 성실하게 살아가고 있었지요. 그러던 어느 날, 스스로를 알라딘의 삼촌이라고 속인 수상한 마법사가 찾아왔어요.',
      '마법사는 알라딘을 깊은 사막 한가운데에 있는 신비한 동굴 앞으로 데려갔어요. "알라딘, 저 좁은 구멍으로 들어가서 낡은 램프 하나만 가져오너라. 그러면 네게 큰 보물을 주마!"',
      '알라딘이 동굴 안으로 들어가자, 그곳에는 눈이 부실 정도로 엄청난 금은보화가 가득 쌓여 있었어요. 하지만 알라딘은 욕심을 부리지 않고 마법사가 말한 낡은 램프만 찾아 들고 나왔지요.',
      '그런데 입구에 도착하자 마법사가 본색을 드러냈어요. "램프부터 당장 내놔라!" 알라딘이 거절하자, 화가 난 마법사는 동굴 입구를 커다란 바위로 막아버리고 알라딘을 가두어 버렸어요.',
      '캄캄한 동굴 속에서 무서워하던 알라딘이 무심코 손에 든 램프를 슥슥 문질렀어요. 그 순간, 펑! 하는 소리와 함께 엄청나게 커다란 거인 지니가 나타났어요!',
      '"무엇을 도와드릴까요, 주인님? 저는 램프의 요정 지니입니다!" 알라딘은 지니의 도움으로 무사히 동굴을 빠져나와 집으로 돌아올 수 있었답니다.',
      '얼마 후 알라딘은 우연히 만난 아름다운 자스민 공주님과 사랑에 빠졌어요. 알라딘은 지니에게 소원을 빌어 멋진 왕자로 변신했고, 마법의 양탄자를 타고 공주님께 다가갔지요.',
      '"나를 믿나요?" 알라딘과 공주님은 밤하늘을 수놓은 별들 사이로 마법의 양탄자를 타고 날아다니며 세상에서 가장 아름다운 시간을 보냈어요.',
      '하지만 나쁜 마법사가 다시 나타나 알라딘이 없는 사이 램프를 훔쳐 가버렸어요. 마법사는 램프의 힘을 이용해 공주님과 커다란 궁전을 통째로 사막 멀리 빼앗아 갔지요.',
      '알라딘은 포기하지 않았어요. 지혜를 짜내어 마법사가 잠든 사이 몰래 성으로 들어갔고, 다시 램프를 되찾아 지니를 불러냈답니다.',
      '"지니야! 나쁜 마법사를 아주 멀리 쫓아버려 줘!" 지니는 순식간에 마법사를 아무도 찾을 수 없는 먼 곳으로 날려버렸어요.',
      '알라딘은 마지막 소원으로 지니에게 자유를 선물했어요. "지니야, 이제 너는 누구의 노예도 아니야. 네가 가고 싶은 곳으로 자유롭게 가렴!"',
      '지니는 감격의 눈물을 흘리며 고맙다고 인사하고 하늘 높이 날아갔어요. 알라딘은 자스민 공주님과 결혼하여 오랫동안 행복하고 평화로운 나라를 만들었답니다.'
    ]
  },

  classic_10_hansel_and_gretel: {
    title: '헨젤과 그레텔',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '옛날 어느 깊은 숲속 작은 오두막에 가난한 나무꾼과 헨젤, 그레텔 남매가 살고 있었어요. 집이 너무 가난해서 가족들은 매일 배를 곯아야 했지요.',
      '어느 날 밤, 남매는 숲속에 홀로 남겨지게 되었어요. 하지만 똑똑한 오빠 헨젤은 낮에 미리 주머니 가득 하얀 조약돌을 챙겨두었답니다.',
      '헨젤은 길을 걸을 때마다 조약돌을 하나씩 떨어뜨렸어요. 밤이 되어 달이 떠오르자, 하얀 조약돌들이 달빛에 반짝반짝 빛나며 길을 안내해주었지요. 덕분에 남매는 무사히 집으로 돌아올 수 있었어요.',
      '하지만 두 번째로 숲에 갈 때는 조약돌을 챙기지 못해 대신 먹으려던 빵 조각을 조금씩 떼어 길에 떨어뜨렸어요.',
      '슬프게도 남매가 잠든 사이 숲속 새들이 빵 조각을 모두 쪼아 먹어버렸어요. 잠에서 깬 헨젤과 그레텔은 길을 잃고 깊은 숲속을 헤매기 시작했어요.',
      '배고픔과 추위에 지쳐갈 때쯤, 눈앞에 믿을 수 없는 풍경이 나타났어요. 지붕은 달콤한 초콜릿, 벽은 폭신한 케이크, 창문은 투명한 사탕으로 만든 과자 집이었어요!',
      '"우와! 맛있겠다!" 남매가 정신없이 과자 집을 떼어 먹고 있을 때, 안에서 인자해 보이는 할머니 한 분이 나오셨어요. "불쌍한 아이들아, 들어와서 마음껏 먹으렴."',
      '사실 할머니는 아이들을 잡아먹으려는 무서운 마녀였어요. 마녀는 헨젤을 철창 안에 가두고 맛있는 음식을 잔뜩 먹여 살을 찌우려 했어요. 그레텔은 마녀의 집안일을 하며 매일 눈물을 흘렸지요.',
      '마녀는 눈이 나빠서 헨젤의 팔을 만져보며 살이 쪘는지 확인했어요. 꾀가 많은 헨젤은 팔 대신 먹고 남은 뼈다귀를 내밀어 마녀를 속였답니다.',
      '기다리다 지친 마녀는 어느 날 커다란 화덕에 불을 활활 피웠어요. "그레텔! 화덕 안이 충분히 뜨거운지 안을 좀 들여다보렴!"',
      '그레텔은 마녀가 자신을 밀어 넣으려는 것을 눈치챘어요. "할머니, 어떻게 보는지 잘 모르겠어요. 직접 보여주세요." 그레텔이 모르는 척 말했어요.',
      '"이 바보 같은 녀석! 이렇게 고개를 들이밀면 되잖아!" 마녀가 화덕 안으로 고개를 푹 숙인 순간, 그레텔은 힘껏 마녀를 밀어 넣고 문을 꽉 잠가버렸어요.',
      '그레텔은 서둘러 오빠 헨젤을 구해냈어요. 남매는 마녀의 창고에 가득했던 보석과 금화를 챙겨 숲을 빠져나왔어요.',
      '깊은 강물 앞에서 커다란 하얀 오리가 나타나 남매를 등에 태워 강을 건너게 도와주었지요. 마침내 남매는 아빠가 기다리는 집으로 무사히 돌아왔어요.',
      '헨젤과 그레텔이 가져온 보석 덕분에 가족들은 다시는 배고플 걱정 없이 서로를 아끼며 영원히 행복하게 살았답니다.'
    ]
  },

  classic_19_match_girl: {
    title: '성냥팔이 소녀',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '한 해의 마지막 날 밤이었어요. 찬 바람이 쌩쌩 불고 하얀 눈이 펑펑 내리는 거리에서 한 어린 소녀가 맨발로 걷고 있었어요.',
      '"성냥 사세요! 따뜻한 성냥 사세요!" 소녀의 바구니에는 성냥이 가득했지만, 사람들은 바쁘게 지나갈 뿐 아무도 성냥을 사주지 않았지요.',
      '소녀는 너무 춥고 배가 고파서 골목 구석에 웅크리고 앉았어요. 얼어붙은 작은 손을 녹이기 위해 소녀는 조심스럽게 성냥 하나를 켰어요. 치익! 작은 불꽃이 피어올랐어요.',
      '첫 번째 성냥불 속에서 크고 따뜻한 난로가 나타났어요. 소녀가 손을 뻗어 온기를 느끼려는 순간, 불꽃이 꺼지며 난로는 사라져 버렸지요.',
      '소녀는 다시 두 번째 성냥을 켰어요. 이번에는 하얀 식탁보 위에 맛있는 구운 거위 요리와 과일들이 가득 차려진 식탁이 나타났어요. 하지만 성냥이 꺼지자 식탁도 다시 차가운 벽으로 변했어요.',
      '세 번째 성냥을 켜자 세상에서 가장 아름답고 커다란 크리스마스트리가 나타나 반짝였어요. 나무에 달린 수많은 등불이 하늘로 올라가더니 예쁜 별이 되었지요.',
      '그때 별 하나가 긴 꼬리를 그리며 떨어졌어요. "별이 떨어지면 누군가 하늘나라로 가는 거라고 할머니가 말씀하셨는데." 소녀는 돌아가신 인자한 할머니가 너무나 그리워졌어요.',
      '소녀는 할머니를 다시 보고 싶은 마음에 남은 성냥을 모두 한꺼번에 켰어요. 화르르! 성냥불은 낮보다 더 환하고 따뜻하게 타올랐고, 그 빛 속에서 할머니가 인자하게 웃으며 나타나셨어요.',
      '"할머니! 제발 저를 데려가 주세요! 성냥불이 꺼지면 난로도, 식탁도, 할머니도 다 사라지잖아요!" 소녀가 할머니의 품으로 달려갔어요.',
      '할머니는 소녀를 포근하게 안아주셨어요. 할머니와 소녀는 눈부신 빛에 둘러싸여 하늘 높이, 아주 높이 올라갔어요. 그곳은 춥지도 않고, 배고프지도 않으며, 슬픔이 없는 아주 평화로운 곳이었지요.',
      '다음 날 아침, 사람들은 골목 구석에서 미소를 띤 얼굴로 잠든 소녀를 발견했어요. 사람들은 알지 못했지만, 소녀는 이제 하늘나라에서 할머니와 함께 영원한 행복을 찾았답니다.'
    ]
  },

  classic_peter_pan: {
    title: '피터팬과 네버랜드',
    theme: '세계명작', voiceTone: 'magical',
    paragraphs: [
      '별빛이 쏟아지는 런던의 조용한 밤, 웬디와 두 동생 존, 마이클이 쿨쿨 잠든 방 창문으로 신비한 소년 피터팬과 요정 팅커벨이 찾아왔어요.',
      '피터팬은 며칠 전 잃어버린 자신의 그림자를 찾으러 온 것이었죠. 웬디가 실과 바늘로 그림자를 피터팬의 발에 꼼꼼하게 꿰매주자 피터팬은 뛸 듯이 기뻐했어요.',
      '피터팬은 고마운 웬디와 동생들을 영원한 아이들의 나라, 네버랜드로 초대했어요. "행복한 생각만 해봐! 그럼 날 수 있어!" 팅커벨이 반짝이는 요정 가루를 솔솔 뿌려주자 아이들의 몸이 둥실 떠올랐어요.',
      '아이들은 창문을 빠져나가 밤하늘을 씽씽 날아갔어요. 오른쪽에서 두 번째 별을 향해 한참을 날아가자, 인어들이 춤추고 요정들이 사는 환상의 섬 네버랜드가 나타났어요.',
      '네버랜드에는 피터팬을 따르는 아이들과 씩씩한 인디언들이 살고 있었지만, 무서운 해적선도 있었어요. 해적들의 대장 후크 선장은 예전에 피터팬과 싸우다 팔을 잃어 갈고리 손을 갖게 되었지요.',
      '후크 선장이 가장 무서워하는 것은 자신의 팔을 삼켰던 커다란 악어였어요. 악어는 시계까지 삼켜버려서 다가올 때마다 뱃속에서 "째깍째깍" 소리가 났거든요.',
      '어느 날, 후크 선장이 웬디와 아이들을 해적선으로 잡아갔어요. "하하하! 피터팬의 친구들을 모두 바다에 빠뜨려 주마!" 후크 선장이 무섭게 으름장을 놓았어요.',
      '그때, 하늘에서 "꼬끼오!" 하는 소리와 함께 피터팬이 단검을 쥐고 나타났어요! 피터팬과 후크 선장은 해적선 위에서 치열하게 칼싸움을 벌였지요.',
      '피터팬은 나비처럼 가볍게 날아다니며 후크 선장을 골탕 먹였고, 마침내 겁을 먹은 후크 선장은 바다 아래에서 들려오는 "째깍째깍" 소리를 듣고 비명을 지르며 바다로 뛰어내려 멀리 도망쳤답니다.',
      '피터팬은 위험에 처한 친구들을 모두 구해냈어요. "피터팬 만세!" 아이들은 해적선 위에서 즐거운 잔치를 열었어요.',
      '모험이 끝난 뒤 웬디와 동생들은 엄마 아빠가 기다리는 집이 그리워졌어요. 피터팬은 요정 가루를 뿌려 해적선을 통째로 하늘에 띄워 런던의 집 앞까지 아이들을 배웅해주었답니다.',
      '웬디는 밤하늘로 다시 날아가는 피터팬에게 손을 흔들며 모험을 영원히 기억하겠다고 약속했어요. 피터팬은 지금도 네버랜드에서 아이들의 꿈속으로 날아갈 준비를 하고 있답니다.'
    ]
  },
};
