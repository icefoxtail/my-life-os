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
  }
};
