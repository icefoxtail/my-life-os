/**
 * 시현이 놀이터 OS — 매직 그림판 v3.1 (태블릿 최적화 + 시현이 맞춤 이모지 UI)
 * 자유 그리기 + 색칠 팡팡 (SVG inline fill 방식)
 */
(function () {
  const GAME_KEY = 'artZone';
  const STYLE_ID = 'sihyeon-art-v3-style';

  /* ── 팔레트 / 도장 / 테마 ─────────────────── */
  const COLORS = [
    { c: '#FF4444', n: '빨간색' }, { c: '#FF9900', n: '주황색' },
    { c: '#FFD700', n: '노란색' }, { c: '#44CC44', n: '초록색' },
    { c: '#4488FF', n: '파란색' }, { c: '#9944FF', n: '보라색' },
    { c: '#FF88CC', n: '분홍색' }, { c: '#1A1A1A', n: '검정색' },
    { c: 'rainbow', n: '무지개' },
  ];

  const STAMPS = ['🚗', '🦖', '⭐', '❤️', '🍦', '🐶'];

  const THEMES = {
    white:  { label: '⚪ 빈칸',  color: '#ffffff' },
    sky:    { label: '☁️ 하늘', color: '#e3f2fd' },
    ocean:  { label: '🌊 바다', color: '#e0f7fa' },
    forest: { label: '🌳 숲속', color: '#f1f8e9' },
  };

  /* ── 색칠 팡팡 템플릿 ─────────────────────── */
  const COLORING_TEMPLATES = [
    {
      id: 'police',
      name: '경찰차',
      emoji: '🚓',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <!-- 경광등 (좌/우 분리) -->
        <path class="fillable" d="M 75 20 L 75 10 L 95 10 L 95 20 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 95 20 L 95 10 L 115 10 L 115 20 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 차체 상/하 분리 -->
        <path class="fillable" d="M 25 90 L 25 60 C 25 50, 45 40, 65 40 L 145 40 C 165 40, 185 50, 185 60 L 185 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 45 40 L 70 20 L 120 20 L 145 40 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 창문 (앞/뒤 분리) -->
        <path class="fillable" d="M 70 25 L 90 25 L 90 40 L 50 40 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 100 25 L 120 25 L 140 40 L 100 40 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 헤드라이트/테일램프 -->
        <circle class="fillable" cx="30" cy="70" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="180" cy="70" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 바퀴 -->
        <circle class="fillable" cx="60" cy="90" r="18" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="60" cy="90" r="7" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="150" cy="90" r="18" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="150" cy="90" r="7" stroke="#333" stroke-width="4" fill="#FFF"/>
      </svg>`
    },
    {
      id: 'police_bus',
      name: '경찰 버스',
      emoji: '🚌',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <!-- 양쪽 경광등 -->
        <rect class="fillable" x="30" y="15" width="16" height="10" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="154" y="15" width="16" height="10" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 버스 차체 윗부분 -->
        <path class="fillable" d="M 20 25 L 180 25 C 185 25, 190 30, 190 40 L 190 70 L 10 70 L 10 40 C 10 30, 15 25, 20 25 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 버스 차체 아랫부분 (띠 도색용) -->
        <path class="fillable" d="M 10 70 L 190 70 L 190 85 C 190 95, 185 100, 175 100 L 25 100 C 15 100, 10 95, 10 85 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 창문 4개 -->
        <rect class="fillable" x="25" y="35" width="30" height="25" rx="4" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="65" y="35" width="30" height="25" rx="4" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="105" y="35" width="30" height="25" rx="4" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="145" y="35" width="30" height="25" rx="4" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 바퀴 -->
        <circle class="fillable" cx="50" cy="100" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="50" cy="100" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="150" cy="100" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="150" cy="100" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
      </svg>`
    },
    {
      id: 'fire_pump',
      name: '소방 펌프차',
      emoji: '🚒',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <!-- 경광등 -->
        <rect class="fillable" x="135" y="15" width="20" height="10" rx="4" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 조종석 (Cab) -->
        <path class="fillable" d="M 120 90 L 120 40 C 120 30, 130 25, 140 25 L 165 25 C 180 25, 185 45, 185 60 L 185 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 130 50 L 130 35 L 155 35 C 165 35, 170 40, 175 50 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 장비 수납부 (몸체) -->
        <rect class="fillable" x="15" y="35" width="105" height="55" rx="5" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 펌프/캐비닛 디테일 -->
        <rect class="fillable" x="25" y="45" width="30" height="35" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="65" y="45" width="45" height="35" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 호스 릴 -->
        <circle class="fillable" cx="87" cy="62" r="10" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="87" cy="62" r="3" stroke="#333" stroke-width="2" fill="#FFF"/>
        <!-- 헤드라이트 -->
        <rect class="fillable" x="180" y="70" width="8" height="12" rx="2" stroke="#333" stroke-width="3" fill="#FFF"/>
        <!-- 바퀴 -->
        <circle class="fillable" cx="45" cy="90" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="45" cy="90" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="150" cy="90" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="150" cy="90" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
      </svg>`
    },
    {
      id: 'fire_ladder',
      name: '소방 사다리차',
      emoji: '🪜',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <!-- 경광등 -->
        <rect class="fillable" x="150" y="35" width="15" height="8" rx="2" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 사다리 -->
        <path class="fillable" d="M 20 40 L 130 15 L 135 25 L 25 50 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <line x1="40" y1="36" x2="45" y2="45" stroke="#333" stroke-width="3"/>
        <line x1="60" y1="31" x2="65" y2="41" stroke="#333" stroke-width="3"/>
        <line x1="80" y1="26" x2="85" y2="36" stroke="#333" stroke-width="3"/>
        <line x1="100" y1="22" x2="105" y2="31" stroke="#333" stroke-width="3"/>
        <line x1="120" y1="17" x2="125" y2="27" stroke="#333" stroke-width="3"/>
        <!-- 사다리 지지대 -->
        <path class="fillable" d="M 40 45 L 60 70 L 30 70 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 차량 몸체 뒷부분 -->
        <rect class="fillable" x="15" y="70" width="115" height="25" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="25" y="75" width="20" height="15" rx="2" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" x="55" y="75" width="20" height="15" rx="2" stroke="#333" stroke-width="3" fill="#FFF"/>
        <!-- 차량 몸체 앞부분 (Cab) -->
        <path class="fillable" d="M 130 95 L 130 55 C 130 45, 140 43, 145 43 L 175 43 C 185 43, 190 65, 190 75 L 190 95 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 140 65 L 140 52 L 165 52 C 175 52, 178 58, 180 65 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 바퀴 (사다리차는 3개 배치) -->
        <circle class="fillable" cx="35" cy="95" r="14" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="35" cy="95" r="5" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="75" cy="95" r="14" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="75" cy="95" r="5" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="160" cy="95" r="14" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="160" cy="95" r="5" stroke="#333" stroke-width="4" fill="#FFF"/>
      </svg>`
    },
{
      id: 'ambulance',
      name: '구급차',
      emoji: '🚑',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <!-- 경광등 (좌/우 분리) -->
        <rect class="fillable" x="80" y="15" width="20" height="12" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="105" y="15" width="20" height="12" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 뒷칸 (의료실) -->
        <path class="fillable" d="M 15 90 L 15 27 L 105 27 L 105 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 앞칸 (조종석) -->
        <path class="fillable" d="M 105 90 L 105 45 L 150 45 L 180 65 L 180 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 조종석 창문 -->
        <path class="fillable" d="M 115 52 L 145 52 L 165 65 L 115 65 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 십자가 마크 (가로/세로 분할) -->
        <rect class="fillable" x="45" y="55" width="30" height="10" rx="2" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="55" y="45" width="10" height="30" rx="2" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 헤드라이트 -->
        <rect class="fillable" x="175" y="75" width="8" height="10" rx="2" stroke="#333" stroke-width="3" fill="#FFF"/>
        <!-- 바퀴 -->
        <circle class="fillable" cx="45" cy="90" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="45" cy="90" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="150" cy="90" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="150" cy="90" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
      </svg>`
    },
    {
      id: 'excavator',
      name: '포크레인',
      emoji: '🚧',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <!-- 무한궤도 (Tracks) -->
        <rect class="fillable" x="20" y="95" width="90" height="26" rx="13" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="35" cy="108" r="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="65" cy="108" r="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="95" cy="108" r="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <!-- 조종석 및 엔진룸 -->
        <path class="fillable" d="M 30 95 L 30 45 L 85 45 L 95 95 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 조종석 창문 -->
        <rect class="fillable" x="40" y="52" width="35" height="25" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 붐 (Boom - 큰 팔) -->
        <path class="fillable" d="M 75 75 L 125 25 L 145 40 L 95 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 스틱 (Stick - 작은 팔) -->
        <path class="fillable" d="M 130 30 L 160 85 L 145 95 L 115 40 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 버킷 (Bucket - 삽) -->
        <path class="fillable" d="M 150 85 L 175 85 L 185 115 L 155 115 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 175 85 L 190 80 L 180 95 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 180 100 L 195 95 L 185 110 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      </svg>`
    },
    {
      id: 'dump_truck',
      name: '덤프트럭',
      emoji: '🚛',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <!-- 거대한 적재함 (Dump Box) -->
        <path class="fillable" d="M 15 30 L 115 30 L 115 85 L 15 85 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 적재함 측면 패널 장식 -->
        <rect class="fillable" x="25" y="40" width="20" height="35" rx="2" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="55" y="40" width="20" height="35" rx="2" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="85" y="40" width="20" height="35" rx="2" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 앞칸 조종석 (Cab) -->
        <path class="fillable" d="M 120 85 L 120 40 L 160 40 L 185 65 L 185 85 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 조종석 창문 -->
        <path class="fillable" d="M 128 48 L 155 48 L 172 65 L 128 65 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 앞바퀴 1개, 뒷바퀴 2개 (헤비듀티) -->
        <circle class="fillable" cx="40" cy="95" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="40" cy="95" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="90" cy="95" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="90" cy="95" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="155" cy="95" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="155" cy="95" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
      </svg>`
    },
    {
      id: 'bulldozer',
      name: '불도저',
      emoji: '🚜',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <!-- 무한궤도 (Tracks) -->
        <rect class="fillable" x="25" y="90" width="95" height="28" rx="14" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="42" cy="104" r="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="72" cy="104" r="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="102" cy="104" r="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <!-- 조종석 (Cab) -->
        <path class="fillable" d="M 35 90 L 35 40 L 80 40 L 80 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 조종석 창문 -->
        <rect class="fillable" x="45" y="48" width="28" height="24" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 앞 엔진룸 -->
        <path class="fillable" d="M 80 90 L 80 55 L 135 55 L 140 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 엔진룸 배기구/그릴 장식 -->
        <rect class="fillable" x="95" y="65" width="8" height="18" rx="2" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" x="115" y="65" width="8" height="18" rx="2" stroke="#333" stroke-width="3" fill="#FFF"/>
        <!-- 거대한 앞 블레이드 (삽) -->
        <path class="fillable" d="M 140 120 L 140 45 C 165 45, 180 75, 180 120 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 블레이드 연결 지지대 -->
        <path class="fillable" d="M 105 85 L 145 85 L 145 95 L 105 95 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      </svg>`
    },
{
      id: 'rocket',
      name: '우주 로켓',
      emoji: '🚀',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <!-- 중앙 날개 -->
        <path class="fillable" d="M 95 90 L 95 115 L 105 115 L 105 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 좌우 날개 -->
        <path class="fillable" d="M 80 75 L 45 105 L 80 100 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 120 75 L 155 105 L 120 100 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 추진기 불꽃 (겉/속) -->
        <path class="fillable" d="M 85 105 L 100 145 L 115 105 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 93 105 L 100 128 L 107 105 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 로켓 몸통 및 머리 -->
        <rect class="fillable" x="80" y="45" width="40" height="60" rx="5" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 80 45 Q 100 5, 120 45 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 창문 -->
        <circle class="fillable" cx="100" cy="65" r="14" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="100" cy="65" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
      </svg>`
    },
    {
      id: 'dino',
      name: '공룡',
      emoji: '🦕',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <!-- 다리 4개 -->
        <rect class="fillable" x="65" y="95" width="16" height="30" rx="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="85" y="95" width="16" height="30" rx="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="125" y="95" width="16" height="30" rx="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="145" y="95" width="16" height="30" rx="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 꼬리, 몸통, 머리 -->
        <path class="fillable" d="M 40 90 Q 30 55, 100 55 Q 150 55, 170 70 Q 190 75, 185 90 Q 140 115, 100 115 Q 60 115, 40 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 배부분 분할 -->
        <path class="fillable" d="M 50 100 Q 100 115, 155 95 Q 100 105, 50 100 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 등껍질 골판 4개 -->
        <path class="fillable" d="M 60 60 L 70 25 L 85 57 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 80 55 L 100 15 L 115 55 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 110 57 L 130 25 L 140 60 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 135 65 L 150 40 L 160 70 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 눈 -->
        <circle cx="165" cy="78" r="4" fill="#333"/>
      </svg>`
    },
    {
      id: 'train',
      name: '칙칙폭폭 기차',
      emoji: '🚂',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <!-- 증기 연기 -->
        <circle class="fillable" cx="135" cy="15" r="10" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="110" cy="20" r="7" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="95" cy="10" r="5" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 배장기 (앞 범퍼) -->
        <path class="fillable" d="M 140 100 L 180 100 L 155 75 L 140 75 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 조종실 지붕 -->
        <path class="fillable" d="M 15 45 L 75 45 L 70 25 L 20 25 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 조종실 -->
        <rect class="fillable" x="20" y="45" width="50" height="55" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="30" y="55" width="30" height="20" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 보일러통 및 띠 -->
        <rect class="fillable" x="70" y="60" width="75" height="40" rx="4" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="85" y="60" width="8" height="40" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" x="115" y="60" width="8" height="40" stroke="#333" stroke-width="3" fill="#FFF"/>
        <!-- 연통 -->
        <path class="fillable" d="M 125 60 L 125 40 L 140 40 L 140 60 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 120 40 L 145 40 L 140 25 L 125 25 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 바퀴 -->
        <circle class="fillable" cx="45" cy="100" r="18" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="45" cy="100" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="95" cy="105" r="12" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="95" cy="105" r="4" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="130" cy="105" r="12" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="130" cy="105" r="4" stroke="#333" stroke-width="4" fill="#FFF"/>
      </svg>`
    },
    {
      id: 'airplane',
      name: '비행기',
      emoji: '✈️',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <!-- 꼬리 날개 -->
        <path class="fillable" d="M 40 70 L 25 35 L 50 35 L 60 65 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 뒤쪽 메인 날개 -->
        <path class="fillable" d="M 85 65 L 130 30 L 145 35 L 110 70 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 둥근 동체 -->
        <path class="fillable" d="M 30 75 C 20 60, 140 50, 170 75 C 190 100, 30 90, 30 75 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 앞쪽 메인 날개 -->
        <path class="fillable" d="M 85 80 L 120 120 L 135 115 L 115 85 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 제트 엔진 -->
        <ellipse class="fillable" cx="105" cy="100" rx="14" ry="8" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 창문들 -->
        <path class="fillable" d="M 145 70 L 155 75 L 145 80 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="125" cy="74" r="5" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="105" cy="74" r="5" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="85" cy="74" r="5" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="65" cy="74" r="5" stroke="#333" stroke-width="3" fill="#FFF"/>
      </svg>`
    },
    {
      id: 'lion',
      name: '어흥 사자',
      emoji: '🦁',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <!-- 갈기 (지그재그 폴리곤) -->
        <polygon class="fillable" points="100,10 120,25 145,15 145,40 170,45 155,65 175,85 150,100 160,125 130,120 100,140 70,120 40,125 50,100 25,85 45,65 30,45 55,40 55,15 80,25" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 귀 -->
        <circle class="fillable" cx="72" cy="50" r="14" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="128" cy="50" r="14" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 얼굴 -->
        <circle class="fillable" cx="100" cy="75" r="38" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 주둥이 (Snout) -->
        <ellipse class="fillable" cx="100" cy="88" rx="18" ry="12" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 코 -->
        <path class="fillable" d="M 90 82 L 110 82 L 100 92 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <!-- 눈과 입 -->
        <circle cx="85" cy="65" r="5" fill="#333"/>
        <circle cx="115" cy="65" r="5" fill="#333"/>
        <path d="M 95 96 Q 100 100, 105 96" stroke="#333" stroke-width="3" fill="none"/>
      </svg>`
    },
    {
      id: 'whale',
      name: '고래',
      emoji: '🐳',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <!-- 꼬리 -->
        <path class="fillable" d="M 50 90 L 15 60 L 30 90 L 10 120 L 50 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 몸통 -->
        <path class="fillable" d="M 45 80 Q 45 35, 120 40 Q 185 50, 185 85 Q 185 125, 120 125 Q 45 125, 45 80 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 주름진 배 -->
        <path class="fillable" d="M 55 105 Q 120 130, 180 95 Q 120 115, 55 105 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 옆 지느러미 -->
        <path class="fillable" d="M 105 100 Q 130 140, 145 105 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 물줄기 (분수) -->
        <circle class="fillable" cx="95" cy="15" r="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="115" cy="10" r="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="135" cy="22" r="5" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path d="M 115 35 Q 110 25, 105 20" stroke="#333" stroke-width="4" fill="none" stroke-linecap="round"/>
        <!-- 눈 -->
        <circle cx="155" cy="70" r="5" fill="#333"/>
      </svg>`
    },
    {
      id: 'icecream',
      name: '아이스크림',
      emoji: '🍦',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <!-- 콘 -->
        <path class="fillable" d="M 75 100 L 100 145 L 125 100 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 콘 테두리(림) -->
        <ellipse class="fillable" cx="100" cy="98" rx="28" ry="8" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 1단 스쿱 (아래) -->
        <path class="fillable" d="M 65 95 C 65 60, 135 60, 135 95 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 2단 스쿱 (중간) -->
        <path class="fillable" d="M 75 75 C 75 45, 125 45, 125 75 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 3단 스쿱 (위) -->
        <path class="fillable" d="M 85 55 C 85 30, 115 30, 115 55 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <!-- 꼭대기 체리 -->
        <circle class="fillable" cx="100" cy="25" r="10" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path d="M 100 15 Q 110 5, 120 10" stroke="#333" stroke-width="4" fill="none" stroke-linecap="round"/>
      </svg>`
    }
  ];

  /* ── State ───────────────────────────────── */
  const state = {
    container: null, options: {},
    tab: 'free',   
    mode: 'free',  
    canvas: null, ctx: null,
    isDrawing: false, currentColor: '#FF4444', currentSize: 15,
    isRainbow: false, hue: 0,
    activeTheme: 'white', activeStamp: null,
    paintHistory: [],
    activeTemplateId: 'police',
    coloringCompleted: false,
    destroyed: false,
    timers: [],
  };

  function timer(fn, ms) { const id = setTimeout(fn, ms); state.timers.push(id); }
  function clearTimers()  { state.timers.forEach(clearTimeout); state.timers = []; }

  /* ── CSS ─────────────────────────────────── */
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .az-root{width:100%;height:100%;display:flex;flex-direction:column;background:#f0f4f8;font-family:'Jua',sans-serif;touch-action:none;position:relative;}

      /* header */
      .az-header{display:flex;flex-direction:column;background:#fff;border-bottom:5px solid #FF7A1A;}
      .az-mode-tabs{display:flex;padding:10px 12px 8px;gap:10px;justify-content:center;}
      .az-mode-tab{padding:11px 26px;border-radius:24px;border:3px solid #ddd;background:#f9f9f9;font-weight:800;font-size:17px;cursor:pointer;transition:all .2s;}
      .az-mode-tab.active{background:#FF7A1A;color:#fff;border-color:#FF7A1A;transform:scale(1.05);}
      .az-sub-row{display:flex;gap:10px;padding:4px 12px 10px;overflow-x:auto;scrollbar-width:none;}
      
      /* 이모지 전용 템플릿 버튼 스타일을 위해 폰트 크기 키움 */
      .az-cat-btn{flex-shrink:0;padding:7px 16px;border-radius:18px;border:3px solid #eee;background:#fff;font-size:15px;font-weight:800;cursor:pointer;transition:all .2s;}
      .az-cat-btn.active{border-color:#FF7A1A;color:#FF7A1A;box-shadow:0 4px 10px rgba(255,122,26,.2);}
      #azTplRow .az-cat-btn { font-size: 26px; padding: 4px 16px; border-radius: 20px; }

      /* main canvas area */
      .az-main{flex:1;position:relative;padding:14px;display:flex;align-items:center;justify-content:center;min-height:0;}
      .az-canvas-wrap{position:relative;width:100%;height:100%;background:#fff;border:8px solid #333;border-radius:28px;box-shadow:0 18px 40px rgba(0,0,0,.14);overflow:hidden;transition:background .4s;}
      #azCanvas{width:100%;height:100%;display:block;}

      /* coloring SVG container */
      .az-coloring-wrap{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:14px;background:#fffbf5;}
      .az-coloring-wrap svg{width:100%;height:100%;overflow:visible;}
      .az-coloring-wrap .fillable{cursor:pointer;transition:fill .4s ease;pointer-events:fill;}
      .az-coloring-wrap .fillable:active{opacity:.75;}

      /* completion glow + bounce */
      .az-coloring-wrap.az-done svg{
        animation: az-glow-bounce .7s cubic-bezier(.2,1.4,.35,1) forwards;
        filter: drop-shadow(0 0 10px #FFD700) drop-shadow(0 0 22px #FF9800) drop-shadow(0 0 36px #FF5722);
      }
      @keyframes az-glow-bounce{
        0%   { transform: scale(1);    }
        40%  { transform: scale(1.12); }
        70%  { transform: scale(.97);  }
        100% { transform: scale(1.08); }
      }

      /* complete banner */
      .az-complete-banner{
        position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
        display:flex;gap:10px;z-index:200;white-space:nowrap;
        animation: az-banner-up .42s cubic-bezier(.2,1.4,.35,1) both;
      }
      @keyframes az-banner-up{
        from{opacity:0;transform:translateX(-50%) translateY(20px)}
        to  {opacity:1;transform:translateX(-50%) translateY(0)}
      }
      .az-cbtn{padding:13px 20px;border-radius:18px;border:none;font:inherit;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 5px 0 rgba(0,0,0,.15);}
      .az-cbtn.next {background:#FF7A1A;color:#fff;box-shadow:0 5px 0 #E65100;}
      .az-cbtn.retry{background:#fff;color:#555;}

      /* footer */
      .az-footer{padding:13px;background:#fff;border-top:5px solid #f0f0f0;display:flex;flex-direction:column;gap:12px;}
      .az-palette-row{display:flex;gap:10px;overflow-x:auto;padding:4px 0;scrollbar-width:none;align-items:center;}
      .az-color-circle{width:56px;height:56px;border-radius:50%;border:4px solid #fff;box-shadow:0 5px 12px rgba(0,0,0,.1);flex-shrink:0;cursor:pointer;transition:transform .2s;}
      .az-color-circle.active{transform:scale(1.22) translateY(-7px);border-color:#333;}
      .az-rainbow{background:linear-gradient(45deg,#ff0000,#ffeb3b,#00ff00,#00bcd4,#0044ff,#9c27b0);position:relative;}
      .az-rainbow::after{content:'✨';position:absolute;inset:0;display:grid;place-items:center;font-size:26px;}
      .az-stamp-circle{width:56px;height:56px;border-radius:16px;border:4px solid #eee;background:#f9f9f9;display:grid;place-items:center;font-size:30px;flex-shrink:0;cursor:pointer;}
      .az-stamp-circle.active{border-color:#FF7A1A;background:#fff3e0;transform:scale(1.1);}
      .az-sep{width:3px;height:44px;background:#f0f0f0;border-radius:2px;flex-shrink:0;margin:0 4px;}

      .az-controls{display:flex;justify-content:space-between;align-items:center;gap:10px;}
      .az-size-group{display:flex;gap:8px;}
      .az-size-btn{width:52px;height:52px;border-radius:50%;border:3px solid #eee;background:#fff;font-size:14px;font-weight:900;cursor:pointer;}
      .az-size-btn.active{border-color:#FF7A1A;background:#fff3e0;}
      .az-icon-btns{display:flex;gap:8px;}
      .az-icon-btn{width:60px;height:60px;border-radius:18px;border:none;background:#f5f5f5;font-size:28px;box-shadow:0 5px 0 #ddd;cursor:pointer;}
      .az-icon-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #ddd;}
      .az-done-btn{flex:1;height:62px;border-radius:20px;background:#FF7A1A;color:#fff;font-size:20px;font-weight:900;border:none;box-shadow:0 6px 0 #E65100;cursor:pointer;}
      .az-done-btn:active{transform:translateY(3px);box-shadow:0 2px 0 #E65100;}

      /* particles */
      .az-sparkle{
        position:absolute;pointer-events:none;font-size:22px;z-index:200;
        animation: az-sparkle-burst .65s forwards;
      }
      @keyframes az-sparkle-burst{
        0%  {opacity:1; transform:translate(var(--sx),var(--sy)) scale(1.3);}
        100%{opacity:0; transform:translate(calc(var(--sx) + var(--tx,0px)), calc(var(--sy) + var(--ty,-55px))) scale(.2);}
      }
      .az-particle{position:absolute;pointer-events:none;font-size:26px;z-index:200;animation:az-pop .8s forwards;}
      @keyframes az-pop{0%{transform:scale(0) rotate(0deg);opacity:1}100%{transform:scale(1.5) rotate(180deg) translateY(-75px);opacity:0}}
      .az-stamp-pop{position:absolute;z-index:220;pointer-events:none;font-size:72px;line-height:1;transform:translate(-50%,-50%) scale(.4) rotate(-10deg);animation:az-stamp-pop .48s cubic-bezier(.2,1.5,.35,1) forwards;}
      @keyframes az-stamp-pop{0%{opacity:0;transform:translate(-50%,-50%) scale(.3) rotate(-12deg)}38%{opacity:1;transform:translate(-50%,-50%) scale(1.25) rotate(5deg)}68%{transform:translate(-50%,-50%) scale(.95) rotate(-2deg)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.06) rotate(0)}}

      /* exhibition overlay */
      .az-exhibit-overlay{position:absolute;inset:0;z-index:300;display:grid;place-items:center;padding:20px;background:rgba(27,35,55,.48);backdrop-filter:blur(8px);animation:az-exhibit-fade .22s ease-out both;}
      @keyframes az-exhibit-fade{from{opacity:0}to{opacity:1}}
      .az-exhibit-card{width:min(94vw,520px);max-height:min(88vh,760px);overflow:auto;border-radius:34px;background:linear-gradient(180deg,#fffaf0 0%,#fff 100%);border:6px solid #fff;box-shadow:0 18px 0 rgba(0,0,0,.22),0 28px 60px rgba(0,0,0,.28);padding:18px;display:grid;gap:14px;text-align:center;animation:az-exhibit-pop .34s cubic-bezier(.2,1.35,.35,1) both;}
      @keyframes az-exhibit-pop{from{transform:translateY(22px) scale(.92);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
      .az-exhibit-title{font-size:clamp(22px,6vw,34px);font-weight:900;color:#2d2d2d;}
      .az-exhibit-frame{border-radius:26px;padding:14px;background:linear-gradient(135deg,#FFD36E 0%,#FF9F1C 42%,#F76B1C 100%);box-shadow:inset 0 4px 0 rgba(255,255,255,.45),0 10px 0 rgba(120,70,0,.18);}
      .az-exhibit-frame img{display:block;width:100%;max-height:46vh;object-fit:contain;border-radius:18px;background:#fff;border:5px solid #fff6d6;}
      .az-exhibit-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
      .az-exhibit-btn{min-height:54px;border-radius:18px;border:0;background:#f2f4f8;color:#233044;font:inherit;font-size:clamp(13px,3.6vw,17px);font-weight:900;box-shadow:0 5px 0 rgba(0,0,0,.14);cursor:pointer;}
      .az-exhibit-btn.primary{background:#FF7A1A;color:#fff;box-shadow:0 5px 0 #E65100;}
      .az-exhibit-btn:active{transform:translateY(3px);box-shadow:0 2px 0 rgba(0,0,0,.14);}

      /* ────────────────────────────────────────────────
         1. 태블릿 최적화 (가로폭도 넓고, 높이도 충분한 기기)
      ──────────────────────────────────────────────── */
      @media (min-width: 768px) and (min-height: 600px) {
        .az-header { flex-direction: row; align-items: center; justify-content: space-between; padding: 12px 24px; }
        .az-mode-tabs { padding: 0; }
        .az-sub-row { padding: 0; flex-wrap: wrap; justify-content: flex-end; }
        
        #azTplRow .az-cat-btn { font-size: 34px; padding: 6px 18px; }

        .az-main { padding: 24px 40px; }
        .az-canvas-wrap { border-width: 12px; border-radius: 36px; }

        .az-footer { padding: 20px 40px; gap: 20px; }
        .az-palette-row { justify-content: center; gap: 16px; overflow-x: visible; }
        .az-color-circle, .az-stamp-circle { width: 72px; height: 72px; border-width: 5px; font-size: 38px; }
        .az-color-circle.active, .az-stamp-circle.active { transform: scale(1.15) translateY(-8px); }
        
        .az-controls { gap: 24px; justify-content: center; }
        .az-size-group { gap: 12px; }
        .az-size-btn { width: 64px; height: 64px; font-size: 16px; border-width: 4px; }
        .az-icon-btns { gap: 12px; }
        .az-icon-btn { width: 72px; height: 72px; font-size: 34px; border-radius: 22px; }
        
        .az-done-btn { flex: none; width: auto; padding: 0 40px; height: 72px; font-size: 24px; border-radius: 24px; }
      }

      /* ────────────────────────────────────────────────
         2. 스마트폰 가로 모드 최적화 (높이가 낮고 가로로 긴 화면)
      ──────────────────────────────────────────────── */
      @media (max-height: 500px) and (orientation: landscape) {
        .az-header { flex-direction: row; align-items: center; justify-content: space-between; padding: 4px 16px; border-width: 3px; }
        .az-mode-tabs { padding: 0; }
        .az-mode-tab { padding: 6px 16px; font-size: 14px; }
        .az-cat-btn { padding: 4px 12px; font-size: 13px; }
        
        #azTplRow .az-cat-btn { font-size: 20px; padding: 2px 12px; }
        
        .az-main { padding: 6px 16px; }
        .az-canvas-wrap { border-width: 4px; border-radius: 16px; }

        .az-footer { padding: 6px 16px; flex-direction: row; align-items: center; justify-content: space-between; gap: 10px; border-width: 3px; }
        .az-palette-row { padding: 0; gap: 6px; }
        .az-color-circle, .az-stamp-circle { width: 42px; height: 42px; font-size: 20px; border-width: 3px; }
        .az-sep { height: 30px; }
        
        .az-controls { gap: 10px; }
        .az-size-btn { width: 38px; height: 38px; font-size: 11px; }
        .az-icon-btn { width: 42px; height: 42px; font-size: 20px; border-radius: 12px; }
        .az-done-btn { height: 42px; font-size: 15px; padding: 0 16px; border-radius: 12px; }
        
        .az-header, .az-main, .az-footer {
          padding-left: max(16px, env(safe-area-inset-left));
          padding-right: max(16px, env(safe-area-inset-right));
        }
      }
    `;
    document.head.appendChild(s);
  }

  /* ── Render ──────────────────────────────── */
  function render(container, options = {}) {
    state.container         = container;
    state.options           = options;
    state.tab               = 'free';
    state.mode              = 'free';
    state.paintHistory      = [];
    state.coloringCompleted = false;
    state.activeStamp       = null;
    state.destroyed         = false;
    injectStyle();

    container.innerHTML = `
      <div class="az-root">
        <div class="az-header">
          <div class="az-mode-tabs">
            <button class="az-mode-tab active" data-tab="free">🎨 자유 그리기</button>
            <button class="az-mode-tab"        data-tab="coloring">🌈 색칠 팡팡</button>
          </div>
          <div class="az-sub-row" id="azThemeRow">
            ${Object.keys(THEMES).map(k=>`<button class="az-cat-btn${k===state.activeTheme?' active':''}" data-theme="${k}">${THEMES[k].label}</button>`).join('')}
          </div>
          <div class="az-sub-row" id="azTplRow" style="display:none;">
            ${COLORING_TEMPLATES.map(t=>`<button class="az-cat-btn${t.id===state.activeTemplateId?' active':''}" data-tpl="${t.id}">${t.emoji}</button>`).join('')}
          </div>
        </div>

        <div class="az-main">
          <div class="az-canvas-wrap" id="azCanvasWrap">
            <canvas id="azCanvas"></canvas>
            <div class="az-coloring-wrap" id="azColoringWrap"></div>
          </div>
        </div>

        <div class="az-footer">
          <div class="az-palette-row">
            ${COLORS.map(c=>`<div class="az-color-circle${c.c==='rainbow'?' az-rainbow':''}${state.currentColor===c.c?' active':''}" ${c.c!=='rainbow'?`style="background:${c.c}"`:''}  data-color="${c.c}" data-name="${c.n}"></div>`).join('')}
            <div class="az-sep az-free-only"></div>
            ${STAMPS.map(s=>`<div class="az-stamp-circle az-free-only" data-stamp="${s}">${s}</div>`).join('')}
          </div>
          <div class="az-controls">
            <div class="az-size-group az-free-only">
              <button class="az-size-btn"       data-size="6">작음</button>
              <button class="az-size-btn active" data-size="16">중간</button>
              <button class="az-size-btn"       data-size="32">크다</button>
            </div>
            <div class="az-icon-btns">
              <button class="az-icon-btn az-free-only" id="azEraser">🧽</button>
              <button class="az-icon-btn" id="azUndo" style="display:none;">↩️</button>
              <button class="az-icon-btn" id="azClear">🗑️</button>
            </div>
            <button class="az-done-btn" id="azDone">다 그렸어요! ✨</button>
          </div>
        </div>
      </div>
    `;

    initCanvas();
    bindEvents();
    speak('시현아. 마법 그림판이야. 같이 그리고 색칠해볼까?', true);
  }

  /* ── Canvas init ─────────────────────────── */
  function initCanvas() {
    state.canvas = document.getElementById('azCanvas');
    state.ctx    = state.canvas.getContext('2d');
    const dpr  = window.devicePixelRatio || 1;
    const rect = document.getElementById('azCanvasWrap').getBoundingClientRect();
    state.canvas.width  = rect.width  * dpr;
    state.canvas.height = rect.height * dpr;
    state.ctx.scale(dpr, dpr);
    state.ctx.lineCap  = 'round';
    state.ctx.lineJoin = 'round';
    applyThemeBg();
  }

  function applyThemeBg() {
    const wrap = document.getElementById('azCanvasWrap');
    if (wrap) wrap.style.backgroundColor = THEMES[state.activeTheme]?.color || '#fff';
  }

  /* ── Event binding ───────────────────────── */
  function bindEvents() {
    const root = state.container.querySelector('.az-root');

    // tab switch
    root.querySelectorAll('.az-mode-tab').forEach(btn => {
      btn.onclick = () => {
        root.querySelectorAll('.az-mode-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        switchTab(btn.dataset.tab);
      };
    });

    // background theme (free mode)
    root.querySelectorAll('[data-theme]').forEach(btn => {
      btn.onclick = () => {
        state.activeTheme = btn.dataset.theme;
        root.querySelectorAll('[data-theme]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyThemeBg();
        speak(THEMES[state.activeTheme].label + '이야!');
      };
    });

    // coloring template picker
    root.querySelectorAll('[data-tpl]').forEach(btn => {
      btn.onclick = () => {
        state.activeTemplateId  = btn.dataset.tpl;
        state.coloringCompleted = false;
        root.querySelectorAll('[data-tpl]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tpl = COLORING_TEMPLATES.find(t => t.id === state.activeTemplateId);
        renderColoringTemplate(tpl);
        // t.name을 남겨두었기 때문에 TTS는 "경찰차를 같이 색칠해볼까?" 하고 자연스럽게 나옴
        speak(`${tpl?.name || ''}을 같이 색칠해볼까?`);
      };
    });

    // color palette — TTS on select
    root.querySelectorAll('.az-color-circle').forEach(btn => {
      btn.onclick = () => {
        const c = btn.dataset.color;
        state.isRainbow = (c === 'rainbow');
        state.activeStamp = null;
        if (!state.isRainbow) state.currentColor = c;
        if (state.mode === 'eraser') state.mode = 'free';
        root.querySelectorAll('.az-color-circle, .az-stamp-circle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        speak(btn.dataset.name + '!');
        if (navigator.vibrate) navigator.vibrate(25);
      };
    });

    // stamps
    root.querySelectorAll('.az-stamp-circle').forEach(btn => {
      btn.onclick = () => {
        state.activeStamp = btn.dataset.stamp;
        state.isRainbow   = false;
        root.querySelectorAll('.az-color-circle, .az-stamp-circle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        speak('도장 준비됐어.');
      };
    });

    // brush size
    root.querySelectorAll('.az-size-btn').forEach(btn => {
      btn.onclick = () => {
        state.currentSize = parseInt(btn.dataset.size);
        root.querySelectorAll('.az-size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });

    // eraser
    document.getElementById('azEraser').onclick = () => {
      state.mode = 'eraser';
      state.activeStamp = null;
      speak('지우개로 슥싹.');
    };

    // undo
    document.getElementById('azUndo').onclick = () => {
      const last = state.paintHistory.pop();
      if (last) last.el.setAttribute('fill', last.prev);
    };

    // clear
    document.getElementById('azClear').onclick = () => {
      if (state.tab === 'coloring') {
        const cw = document.getElementById('azColoringWrap');
        state.coloringCompleted = false;
        cw?.classList.remove('az-done');
        cw?.querySelector('.az-complete-banner')?.remove();
        cw?.querySelectorAll('.fillable').forEach(el => el.setAttribute('fill', '#FFF'));
        state.paintHistory = [];
        speak('괜찮아. 다시 색칠해볼까?');
      } else {
        state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
        speak('깨끗하게 지웠어.');
      }
    };

    // done → exhibition
    document.getElementById('azDone').onclick = () => {
      state.options.fireConfetti?.();
      state.options.gainExp?.(state.tab === 'coloring' ? 20 : 10);
      speak('우와. 멋진 그림이야. 전시회에 걸어볼게.', true);
      showArtExhibition();
    };

    // canvas draw events (free mode only) - ★ Pointer Events로 통합 (태블릿 펜/터치 최적화)
    const canvas = state.canvas;
    canvas.style.touchAction = 'none';

    const getPos = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const drawStart = (e) => {
      if (state.tab !== 'free') return;
      if (e.pointerType === 'touch') e.preventDefault(); 

      const pos = getPos(e);
      if (state.activeStamp) { placeStamp(pos.x, pos.y); return; }
      
      state.isDrawing = true;
      state.ctx.beginPath();
      state.ctx.moveTo(pos.x, pos.y);
      canvas.setPointerCapture(e.pointerId); 
    };

    const drawMove = (e) => {
      if (!state.isDrawing || state.tab !== 'free' || state.activeStamp) return;
      if (e.pointerType === 'touch') e.preventDefault();

      const pos = getPos(e);
      if (state.mode === 'eraser') {
        state.ctx.globalCompositeOperation = 'destination-out';
        state.ctx.beginPath();
        state.ctx.arc(pos.x, pos.y, state.currentSize, 0, Math.PI * 2);
        state.ctx.fill();
        return;
      }
      
      state.ctx.globalCompositeOperation = 'source-over';
      if (state.isRainbow) {
        state.hue = (state.hue + 5) % 360;
        state.ctx.strokeStyle = `hsl(${state.hue},90%,60%)`;
        if (Math.random() > 0.82) createMagicParticle(pos.x, pos.y, '✨');
      } else {
        state.ctx.strokeStyle = state.currentColor;
      }
      
      // 태블릿 펜 필압 지원
      const pressure = e.pointerType === 'pen' ? e.pressure : 1;
      state.ctx.lineWidth = state.currentSize * (0.8 + (pressure * 0.4));
      
      state.ctx.lineTo(pos.x, pos.y);
      state.ctx.stroke();
    };

    const drawEnd = (e) => {
      state.isDrawing = false;
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    };

    canvas.addEventListener('pointerdown', drawStart);
    canvas.addEventListener('pointermove', drawMove);
    canvas.addEventListener('pointerup', drawEnd);
    canvas.addEventListener('pointercancel', drawEnd);
    canvas.addEventListener('pointerout', drawEnd);
  }

  /* ── Tab switch ──────────────────────────── */
  function switchTab(tab) {
    state.tab  = tab;
    state.mode = 'free';
    state.activeStamp       = null;
    state.coloringCompleted = false;

    const isFree = tab === 'free';
    document.getElementById('azCanvas').style.display       = isFree ? 'block' : 'none';
    document.getElementById('azColoringWrap').style.display = isFree ? 'none'  : 'flex';
    document.getElementById('azThemeRow').style.display     = isFree ? 'flex'  : 'none';
    document.getElementById('azTplRow').style.display       = isFree ? 'none'  : 'flex';
    document.getElementById('azUndo').style.display         = isFree ? 'none'  : 'block';

    state.container.querySelectorAll('.az-free-only').forEach(el => {
      el.style.display = isFree ? '' : 'none';
    });

    if (!isFree) {
      const tpl = COLORING_TEMPLATES.find(t => t.id === state.activeTemplateId);
      renderColoringTemplate(tpl);
      speak('어떤 그림을 색칠해볼까?');
    } else {
      speak('자유롭게 그려볼까?');
    }
  }

  /* ── Coloring template ───────────────────── */
  function renderColoringTemplate(tpl) {
    if (!tpl) return;
    const wrap = document.getElementById('azColoringWrap');
    if (!wrap) return;

    state.paintHistory      = [];
    state.coloringCompleted = false;
    wrap.classList.remove('az-done');
    wrap.querySelector('.az-complete-banner')?.remove();

    // insert SVG string directly
    wrap.innerHTML = tpl.svg;

    // style the SVG to fill the container
    const svg = wrap.querySelector('svg');
    if (svg) {
      svg.style.cssText = 'width:100%;height:100%;overflow:visible;';
    }

    // bind fill events to every .fillable element
    wrap.querySelectorAll('.fillable').forEach(el => {
      const applyFill = (cx, cy) => {
        const fillColor = state.isRainbow
          ? `hsl(${(state.hue = (state.hue + 35) % 360)},90%,55%)`
          : state.currentColor;
        const prev = el.getAttribute('fill');
        if (prev === fillColor) return;
        state.paintHistory.push({ el, prev });
        el.setAttribute('fill', fillColor);
        burstSparkles(cx, cy);
        if (navigator.vibrate) navigator.vibrate(25);
        timer(() => checkColoringComplete(tpl), 450);
      };

      el.addEventListener('pointerup', (e) => {
        if (state.isDrawing) return; 
        applyFill(e.clientX, e.clientY);
      });
    });
  }

  /* ── Completion check ────────────────────── */
  function checkColoringComplete(tpl) {
    if (state.coloringCompleted || state.tab !== 'coloring') return;
    const wrap = document.getElementById('azColoringWrap');
    if (!wrap) return;

    const allDone = Array.from(wrap.querySelectorAll('.fillable')).every(el => {
      const f = el.getAttribute('fill') || '';
      return f !== '' && f !== '#FFF' && f !== '#fff' && f !== 'white' && f !== 'none';
    });
    if (!allDone) return;

    state.coloringCompleted = true;
    wrap.classList.add('az-done');

    speak(`우와. ${tpl.name} 완성. 시현이 참 잘했어.`, true);
    state.options.fireConfetti?.();
    state.options.gainExp?.(20);

    timer(() => {
      const cw = document.getElementById('azColoringWrap');
      if (!cw || cw.querySelector('.az-complete-banner')) return;
      const banner = document.createElement('div');
      banner.className = 'az-complete-banner';
      banner.innerHTML = `
        <button class="az-cbtn retry">다시 색칠하기 🔄</button>
        <button class="az-cbtn next">다음 그림 🌈</button>
      `;
      banner.querySelector('.retry').onclick = () => {
        state.coloringCompleted = false;
        cw.classList.remove('az-done');
        banner.remove();
        cw.querySelectorAll('.fillable').forEach(el => el.setAttribute('fill', '#FFF'));
        state.paintHistory = [];
        speak('괜찮아. 다시 해보자.');
      };
      banner.querySelector('.next').onclick = () => {
        const idx  = COLORING_TEMPLATES.findIndex(t => t.id === state.activeTemplateId);
        const next = COLORING_TEMPLATES[(idx + 1) % COLORING_TEMPLATES.length];
        state.activeTemplateId  = next.id;
        state.coloringCompleted = false;
        state.container.querySelectorAll('[data-tpl]').forEach(b => {
          b.classList.toggle('active', b.dataset.tpl === next.id);
        });
        renderColoringTemplate(next);
        speak(`${next.name}을 같이 색칠해볼까?`);
      };
      cw.appendChild(banner);
    }, 850);
  }

  /* ── burstSparkles ───────────────────────── */
  function burstSparkles(clientX, clientY) {
    const wrap = document.getElementById('azCanvasWrap');
    if (!wrap) return;
    const rect  = wrap.getBoundingClientRect();
    const px    = clientX - rect.left;
    const py    = clientY - rect.top;
    const chars = ['⭐', '✨', '💫', '🌟', '⭐'];
    const count = 4 + Math.floor(Math.random() * 2); // 4~5개
    for (let i = 0; i < count; i++) {
      const el    = document.createElement('div');
      el.className = 'az-sparkle';
      const angle  = (i / count) * 2 * Math.PI;
      const dist   = 50 + Math.random() * 28;
      el.textContent = chars[i % chars.length];
      el.style.setProperty('--sx', `${px}px`);
      el.style.setProperty('--sy', `${py}px`);
      el.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
      el.style.setProperty('--ty', `${Math.sin(angle) * dist - 20}px`);
      el.style.animationDelay = `${i * 40}ms`;
      wrap.appendChild(el);
      timer(() => el.remove(), 750);
    }
  }

  function createMagicParticle(x, y, char) {
    const wrap = document.getElementById('azCanvasWrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className   = 'az-particle';
    el.textContent = char || '✨';
    el.style.left  = `${x}px`;
    el.style.top   = `${y}px`;
    wrap.appendChild(el);
    timer(() => el.remove(), 820);
  }

  /* ── Free drawing helpers ────────────────── */
  function placeStamp(x, y) {
    state.ctx.save();
    state.ctx.font          = '68px serif';
    state.ctx.textAlign     = 'center';
    state.ctx.textBaseline  = 'middle';
    state.ctx.fillText(state.activeStamp, x, y);
    state.ctx.restore();
    showStampPop(x, y, state.activeStamp);
    createMagicParticle(x, y, state.activeStamp);
    if (navigator.vibrate) navigator.vibrate(45);
  }

  function showStampPop(x, y, stamp) {
    const wrap = document.getElementById('azCanvasWrap');
    if (!wrap || !stamp) return;
    const el       = document.createElement('div');
    el.className   = 'az-stamp-pop';
    el.textContent = stamp;
    el.style.left  = `${x}px`;
    el.style.top   = `${y}px`;
    wrap.appendChild(el);
    timer(() => el.remove(), 520);
  }

  /* ── Art Exhibition (snapshot) ───────────── */
  async function buildSnapshot() {
    const w = state.canvas?.width  || 600;
    const h = state.canvas?.height || 600;
    const out = document.createElement('canvas');
    out.width  = w;
    out.height = h;
    const ctx = out.getContext('2d');
    if (!ctx) return '';

    if (state.tab === 'free') {
      ctx.fillStyle = THEMES[state.activeTheme]?.color || '#fff';
      ctx.fillRect(0, 0, w, h);
      if (state.canvas) ctx.drawImage(state.canvas, 0, 0);
    } else {
      ctx.fillStyle = '#fffbf5';
      ctx.fillRect(0, 0, w, h);
      const svg = document.getElementById('azColoringWrap')?.querySelector('svg');
      if (svg) await drawSvgToCanvas(ctx, svg, w, h);
    }
    return out.toDataURL('image/png');
  }

  function drawSvgToCanvas(ctx, svg, w, h) {
    return new Promise(resolve => {
      try {
        const clone = svg.cloneNode(true);
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.setAttribute('width',  String(w));
        clone.setAttribute('height', String(h));
        const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' });
        const url  = URL.createObjectURL(blob);
        const img  = new Image();
        img.onload  = () => { ctx.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url); resolve(); };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
        img.src = url;
      } catch { resolve(); }
    });
  }

  async function showArtExhibition() {
    const root = state.container?.querySelector('.az-root');
    if (!root) return;
    root.querySelector('.az-exhibit-overlay')?.remove();
    const dataUrl = await buildSnapshot();
    const overlay = document.createElement('div');
    overlay.className = 'az-exhibit-overlay';
    overlay.innerHTML = `
      <div class="az-exhibit-card" role="dialog">
        <div class="az-exhibit-title">🖼️ 시현이 그림 전시회</div>
        <div class="az-exhibit-frame">
          <img src="${dataUrl}" alt="시현이가 완성한 그림">
        </div>
        <div class="az-exhibit-actions">
          <button type="button" class="az-exhibit-btn" data-action="continue">계속 그리기</button>
          <button type="button" class="az-exhibit-btn" data-action="restart">다시 그리기</button>
          <button type="button" class="az-exhibit-btn primary" data-action="home">즐거운놀이터 👋</button>
        </div>
      </div>
    `;
    root.appendChild(overlay);
    overlay.querySelector('[data-action="continue"]').onclick = () => { overlay.remove(); speak('조금 더 꾸며볼까?', true); };
    overlay.querySelector('[data-action="restart"]').onclick  = () => {
      overlay.remove();
      if (state.tab === 'coloring') {
        const tpl = COLORING_TEMPLATES.find(t => t.id === state.activeTemplateId);
        renderColoringTemplate(tpl);
      } else {
        state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
        applyThemeBg();
      }
      speak('새 그림을 시작해볼까?', true);
    };
    overlay.querySelector('[data-action="home"]').onclick = () => {
      overlay.remove();
      state.options.closeToParkHome?.();
    };
  }

  /* ── TTS / Destroy ───────────────────────── */
  function speak(msg, force = false) {
    const voiceIds = {
      '시현아. 마법 그림판이야. 같이 그리고 색칠해볼까?': 'games.paint.intro',
      '빈칸이야!': 'games.paint.blank',
      '하늘이야!': 'games.paint.sky',
      '바다야!': 'games.paint.sea',
      '숲속이야!': 'games.paint.forest',
      '그림을 같이 색칠해볼까?': 'games.paint.colorTarget',
      '빨간색!': 'games.paint.red',
      '주황색!': 'games.paint.orange',
      '노란색!': 'games.paint.yellow',
      '초록색!': 'games.paint.green',
      '파란색!': 'games.paint.blue',
      '보라색!': 'games.paint.purple',
      '분홍색!': 'games.paint.pink',
      '검정색!': 'games.paint.black',
      '무지개!': 'games.paint.rainbow',
      '도장 준비됐어.': 'games.paint.stamp',
      '지우개로 슥싹.': 'games.paint.erase',
      '괜찮아. 다시 색칠해볼까?': 'games.paint.wrong',
      '깨끗하게 지웠어.': 'games.paint.clear',
      '우와. 멋진 그림이야. 전시회에 걸어볼게.': 'games.paint.exhibit',
      '어떤 그림을 색칠해볼까?': 'games.paint.choose',
      '자유롭게 그려볼까?': 'games.paint.free',
      '우와. 그림 완성. 시현이 참 잘했어.': 'games.paint.complete',
      '괜찮아. 다시 해보자.': 'games.paint.retry',
      '조금 더 꾸며볼까?': 'games.paint.more',
      '새 그림을 시작해볼까?': 'games.paint.new'
    };
    const voiceId = voiceIds[msg];
    if (voiceId && window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      window.SihyeonVoice.play(voiceId, '').catch(() => {});
      return;
    }
  }

  function destroy() {
    clearTimers();
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    if (state.container) state.container.innerHTML = '';
    state.destroyed = true;
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
})();
