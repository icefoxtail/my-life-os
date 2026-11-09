/**
 * 시현이 놀이터 OS — 매직 그림판 v4.4.0
 * v4.1 원본 기준 유지 + 시현이 전용 단순 그림놀이 레이아웃
 * - 큰 매직 그림판 헤더 제거
 * - 도구/되돌리기/휴지통/완료/저장 UI 제거
 * - 가로모드: 좌측 도안/SVG 선택, 가운데 화면 꽉찬 그림판, 우측 색깔 선택
 * - 세로모드: 상단 모드 선택, 도안/SVG 가로 스크롤, 중앙 큰 그림판, 하단 색깔 2줄
 * - SVG는 캔버스 안에서 가로/세로 정중앙
 */
(function () {
  'use strict';

  const GAME_KEY = 'artZone';
  const STYLE_ID = 'sihyeon-art-v4-style';
  const LEGACY_STYLE_IDS = ['sihyeon-art-v3-style', 'sihyeon-art-v2-style', 'sihyeon-art-style'];

  const COLORS = [
    { c: 'rainbow', n: '무지개' },
    { c: '#1A1A1A', n: '검정색' },
    { c: '#FF4444', n: '빨간색' },
    { c: '#FF9900', n: '주황색' },
    { c: '#FFD700', n: '노란색' },
    { c: '#44CC44', n: '초록색' },
    { c: '#4488FF', n: '파란색' },
    { c: '#1E40AF', n: '진파랑' },
    { c: '#9944FF', n: '보라색' },
    { c: '#FF88CC', n: '분홍색' },
    { c: '#FFF8E7', n: '아이보리색' },
    { c: '#F6E7C8', n: '바닐라색' },
    { c: '#C0C0C0', n: '은색' },
    { c: '#8EF6D1', n: '민트색' },
    { c: '#8B5A2B', n: '갈색' },
    { c: '#7ED957', n: '연두색' },
  ];

  const THEMES = {
    white: { label: '⚪ 빈칸', color: '#ffffff' },
    sky: { label: '☁️ 하늘', color: '#e3f2fd' },
    ocean: { label: '🌊 바다', color: '#e0f7fa' },
    forest: { label: '🌳 숲속', color: '#f1f8e9' },
  };

  const COLORING_TEMPLATES = [
    {
      id: 'police',
      name: '경찰차',
      emoji: '🚓',
      version: 2,
      parts: {
        light_red: { ko: '빨간 경광등', en: 'red siren light', color: '#FF4444' },
        light_blue: { ko: '파란 경광등', en: 'blue siren light', color: '#4488FF' },
        cabin: { ko: '지붕', en: 'roof', color: '#FFF8E7' },
        window_rear: { ko: '뒷창문', en: 'back window', color: '#8EF6D1' },
        window_front: { ko: '앞창문', en: 'front window', color: '#8EF6D1' },
        body: { ko: '차체', en: 'car body', color: '#FFF8E7' },
        stripe: { ko: '경찰 줄무늬', en: 'police stripe', color: '#1E40AF' },
        badge: { ko: '경찰 배지', en: 'police badge', color: '#FFD700' },
        headlight: { ko: '헤드라이트', en: 'headlight', color: '#FFD700' },
        tire_rear: { ko: '뒷바퀴', en: 'back wheel', color: '#1A1A1A' },
        tire_front: { ko: '앞바퀴', en: 'front wheel', color: '#1A1A1A' },
        hub_rear: { ko: '뒷바퀴 휠', en: 'back hubcap', color: '#C0C0C0' },
        hub_front: { ko: '앞바퀴 휠', en: 'front hubcap', color: '#C0C0C0' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" data-part="light_red" x="95" y="24" width="24" height="16" rx="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="light_blue" x="121" y="24" width="24" height="16" rx="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="cabin" d="M 56 86 L 77 47 Q 81 40 90 40 H 150 Q 159 40 163 47 L 184 86 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="window_rear" d="M 73 82 L 88 54 Q 90 49 96 49 H 114 V 82 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="window_front" d="M 126 82 V 49 H 144 Q 150 49 152 54 L 167 82 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="body" d="M 36 136 H 206 Q 219 136 219 123 V 104 Q 219 91 205 89 L 180 84 H 42 Q 21 84 21 104 V 123 Q 21 136 36 136 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" data-part="stripe" x="21" y="104" width="198" height="15" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="badge" d="M 136 95 Q 148 90 160 95 V 107 Q 160 119 148 124 Q 136 119 136 107 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="headlight" d="M 195 104 V 93 Q 195 87 202 87.6 L 210 88.8 Q 219 90.5 219 100 V 104 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="tire_rear" cx="66" cy="136" r="21" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="tire_front" cx="174" cy="136" r="21" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="hub_rear" cx="66" cy="136" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="hub_front" cx="174" cy="136" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <path d="M 92 40 H 148"/>
          <path d="M 120 86 V 132"/>
          <path d="M 100 94 H 110"/>
          <path d="M 148 99 L 150 104 L 155 104 L 151 107 L 153 112 L 148 109 L 143 112 L 145 107 L 141 104 L 146 104 Z" fill="#333" stroke="none"/>
          <path d="M 21 96 H 30"/>
        </g>
      </svg>`,
      legacy: {
        1: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" x="88" y="10" width="18" height="12" rx="4" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" x="110" y="10" width="18" height="12" rx="4" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" d="M 52 110 L 52 72 C 52 60,72 48,92 48 L 172 48 C 192 48,210 58,210 72 L 210 110 Z" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <path class="fillable" d="M 70 48 L 88 22 L 148 22 L 168 48 Z" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <path class="fillable" d="M 88 30 L 108 30 L 108 48 L 72 48 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" d="M 120 30 L 144 30 L 164 48 L 120 48 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" x="80" y="60" width="30" height="36" rx="4" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" x="120" y="60" width="30" height="36" rx="4" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect x="103" y="76" width="6" height="4" rx="1.5" stroke="#333" stroke-width="2" fill="none"/>
        <rect x="143" y="76" width="6" height="4" rx="1.5" stroke="#333" stroke-width="2" fill="none"/>
        <rect class="fillable" x="48" y="104" width="168" height="10" rx="4" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="58" cy="88" r="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="204" cy="88" r="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="80" cy="118" r="22" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <circle class="fillable" cx="80" cy="118" r="9" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle cx="80" cy="107" r="2.5" fill="#333"/>
        <circle cx="80" cy="129" r="2.5" fill="#333"/>
        <circle cx="69" cy="118" r="2.5" fill="#333"/>
        <circle cx="91" cy="118" r="2.5" fill="#333"/>
        <circle class="fillable" cx="180" cy="118" r="22" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <circle class="fillable" cx="180" cy="118" r="9" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle cx="180" cy="107" r="2.5" fill="#333"/>
        <circle cx="180" cy="129" r="2.5" fill="#333"/>
        <circle cx="169" cy="118" r="2.5" fill="#333"/>
        <circle cx="191" cy="118" r="2.5" fill="#333"/>
      <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="none">
<path d="M156 95 L156 77 Q169 73 182 77 L182 90 Q169 101 156 95 Z" fill="none"/>
<path d="M169 79 L172 86 L179 86 L173 90 L175 96 L169 92 L163 96 L165 90 L159 86 L166 86 Z" fill="#333" stroke="none"/>
<path d="M112 101 H143"/>
</g>
</svg>`,
      },
    },
    {
      id: 'police_bus',
      name: '경찰 버스',
      emoji: '🚌',
      version: 2,
      parts: {
        light_red: { ko: '빨간 경광등', en: 'red siren light', color: '#FF4444' },
        light_blue: { ko: '파란 경광등', en: 'blue siren light', color: '#4488FF' },
        body: { ko: '버스 차체', en: 'bus body', color: '#FFF8E7' },
        window_1: { ko: '첫째 창문', en: 'window 1', color: '#8EF6D1' },
        window_2: { ko: '둘째 창문', en: 'window 2', color: '#8EF6D1' },
        window_3: { ko: '셋째 창문', en: 'window 3', color: '#8EF6D1' },
        window_front: { ko: '앞창문', en: 'front window', color: '#8EF6D1' },
        stripe: { ko: '경찰 줄무늬', en: 'police stripe', color: '#1E40AF' },
        badge: { ko: '경찰 배지', en: 'police badge', color: '#FFD700' },
        headlight: { ko: '헤드라이트', en: 'headlight', color: '#FFD700' },
        tire_rear: { ko: '뒷바퀴', en: 'back wheel', color: '#1A1A1A' },
        tire_front: { ko: '앞바퀴', en: 'front wheel', color: '#1A1A1A' },
        hub_rear: { ko: '뒷바퀴 휠', en: 'back hubcap', color: '#C0C0C0' },
        hub_front: { ko: '앞바퀴 휠', en: 'front hubcap', color: '#C0C0C0' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" data-part="light_red" x="88" y="30" width="30" height="22" rx="8" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="light_blue" x="122" y="30" width="30" height="22" rx="8" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="body" d="M 34 136 H 206 Q 224 136 224 120 V 68 Q 224 52 208 52 H 32 Q 16 52 16 68 V 120 Q 16 136 34 136 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" data-part="window_1" x="26" y="62" width="46" height="28" rx="8" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="window_2" x="78" y="62" width="46" height="28" rx="8" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="window_3" x="130" y="62" width="46" height="28" rx="8" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="window_front" d="M 184 62 H 206 Q 214 62 214 70 V 82 Q 214 90 206 90 H 184 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="stripe" x="16" y="98" width="208" height="14" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="badge" d="M 106 94 Q 120 88 134 94 V 108 Q 134 122 120 128 Q 106 122 106 108 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="headlight" x="200" y="116" width="24" height="16" rx="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="tire_rear" cx="60" cy="138" r="21" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="tire_front" cx="180" cy="138" r="21" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="hub_rear" cx="60" cy="138" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="hub_front" cx="180" cy="138" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <path d="M 84 52 H 156"/>
          <path d="M 120 101 L 122 106 L 127 106 L 123 109 L 125 114 L 120 111 L 115 114 L 117 109 L 113 106 L 118 106 Z" fill="#333" stroke="none"/>
          <path d="M 16 124 H 26"/>
        </g>
      </svg>`,
      legacy: {
        1: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" x="30" y="15" width="16" height="10" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="154" y="15" width="16" height="10" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 20 25 L 180 25 C 185 25, 190 30, 190 40 L 190 70 L 10 70 L 10 40 C 10 30, 15 25, 20 25 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 10 70 L 190 70 L 190 85 C 190 95, 185 100, 175 100 L 25 100 C 15 100, 10 95, 10 85 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="25" y="35" width="30" height="25" rx="4" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="65" y="35" width="30" height="25" rx="4" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="105" y="35" width="30" height="25" rx="4" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="145" y="35" width="30" height="25" rx="4" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="50" cy="100" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="50" cy="100" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="150" cy="100" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="150" cy="100" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
      <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="none">
<path d="M104 72 V91 M100 91 H112"/><path d="M113 80 L120 73 L127 80 L125 88 L120 91 L115 88 Z" fill="none"/><path d="M18 81 H94"/>
</g>
</svg>`,
      },
    },
    {
      id: 'fire_pump',
      name: '소방 펌프차',
      emoji: '🚒',
      version: 2,
      parts: {
        light_red: { ko: '빨간 경광등', en: 'red siren light', color: '#FF4444' },
        light_yellow: { ko: '노란 경광등', en: 'yellow siren light', color: '#FFD700' },
        roof_rack: { ko: '지붕 선반', en: 'roof rack', color: '#C0C0C0' },
        body: { ko: '장비 차체', en: 'equipment body', color: '#FF4444' },
        hose_reel: { ko: '호스 릴', en: 'hose reel', color: '#FFD700' },
        compartment: { ko: '장비함', en: 'equipment door', color: '#C0C0C0' },
        cab: { ko: '운전석', en: 'cab', color: '#FF4444' },
        window_cab: { ko: '운전석 창문', en: 'cab window', color: '#8EF6D1' },
        headlight: { ko: '헤드라이트', en: 'headlight', color: '#FFD700' },
        tire_rear: { ko: '뒷바퀴', en: 'back wheel', color: '#1A1A1A' },
        tire_front: { ko: '앞바퀴', en: 'front wheel', color: '#1A1A1A' },
        hub_rear: { ko: '뒷바퀴 휠', en: 'back hubcap', color: '#C0C0C0' },
        hub_front: { ko: '앞바퀴 휠', en: 'front hubcap', color: '#C0C0C0' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" data-part="light_red" x="148" y="20" width="24" height="18" rx="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="light_yellow" x="174" y="20" width="24" height="18" rx="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="roof_rack" x="22" y="40" width="112" height="16" rx="8" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="body" x="16" y="54" width="130" height="80" rx="12" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="hose_reel" cx="52" cy="90" r="24" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="compartment" x="88" y="70" width="48" height="44" rx="8" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="cab" d="M 140 134 V 52 Q 140 38 154 38 H 186 Q 196 38 201 46 L 216 72 Q 224 78 224 90 V 122 Q 224 134 212 134 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="window_cab" d="M 150 50 H 184 Q 190 50 193 55 L 205 76 H 150 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="headlight" cx="211" cy="102" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="tire_rear" cx="60" cy="138" r="21" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="tire_front" cx="182" cy="138" r="21" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="hub_rear" cx="60" cy="138" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="hub_front" cx="182" cy="138" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <path d="M 50 40 V 56 M 70 40 V 56 M 90 40 V 56 M 110 40 V 56"/>
          <circle cx="52" cy="90" r="8"/>
          <path d="M 52 82 V 98 M 44 90 H 60"/>
          <path d="M 96 92 H 112"/>
        </g>
      </svg>`,
      legacy: {
        1: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" x="158" y="14" width="22" height="11" rx="4" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" d="M 138 108 L 138 46 C 138 34,150 28,164 28 L 196 28 C 213 28,218 52,218 68 L 218 108 Z" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <path class="fillable" d="M 148 60 L 148 40 L 180 40 C 195 40,202 50,204 60 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" x="18" y="40" width="120" height="68" rx="6" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <line x1="18" y1="74" x2="138" y2="74" stroke="#333" stroke-width="2.5"/>
        <line x1="78" y1="40" x2="78" y2="108" stroke="#333" stroke-width="2.5"/>
        <rect class="fillable" x="28" y="48" width="38" height="20" rx="3" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" x="86" y="48" width="38" height="20" rx="3" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="52" cy="90" r="10" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="52" cy="90" r="4" stroke="#333" stroke-width="2" fill="#FFF"/>
        <circle class="fillable" cx="105" cy="90" r="10" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="105" cy="90" r="4" stroke="#333" stroke-width="2" fill="#FFF"/>
        <rect class="fillable" x="14" y="104" width="208" height="10" rx="4" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="212" cy="90" r="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" x="208" y="78" width="8" height="14" rx="3" stroke="#333" stroke-width="2.5" fill="#FFF"/>
        <circle class="fillable" cx="52" cy="120" r="22" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <circle class="fillable" cx="52" cy="120" r="9" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle cx="52" cy="109" r="2.5" fill="#333"/>
        <circle cx="52" cy="131" r="2.5" fill="#333"/>
        <circle cx="41" cy="120" r="2.5" fill="#333"/>
        <circle cx="63" cy="120" r="2.5" fill="#333"/>
        <circle class="fillable" cx="178" cy="120" r="22" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <circle class="fillable" cx="178" cy="120" r="9" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle cx="178" cy="109" r="2.5" fill="#333"/>
        <circle cx="178" cy="131" r="2.5" fill="#333"/>
        <circle cx="167" cy="120" r="2.5" fill="#333"/>
        <circle cx="189" cy="120" r="2.5" fill="#333"/>
      <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="none">
<path d="M25 77 H38 M118 77 H131"/><path d="M155 71 V87 H179"/><circle cx="169" cy="90" r="7" fill="none"/><path d="M169 83 V97 M162 90 H176"/>
</g>
</svg>`,
      },
    },
    {
      id: 'fire_ladder',
      name: '소방 사다리차',
      emoji: '🪜',
      version: 2,
      parts: {
        body: { ko: '차체', en: 'truck body', color: '#FF4444' },
        turntable: { ko: '사다리 받침', en: 'ladder base', color: '#C0C0C0' },
        ladder: { ko: '사다리', en: 'ladder', color: '#FFD700' },
        light_red: { ko: '빨간 경광등', en: 'red siren light', color: '#FF4444' },
        compartment_1: { ko: '뒤 장비함', en: 'back equipment door', color: '#C0C0C0' },
        compartment_2: { ko: '앞 장비함', en: 'front equipment door', color: '#C0C0C0' },
        cab: { ko: '운전석', en: 'cab', color: '#FF4444' },
        window_cab: { ko: '운전석 창문', en: 'cab window', color: '#8EF6D1' },
        headlight: { ko: '헤드라이트', en: 'headlight', color: '#FFD700' },
        tire_rear: { ko: '뒷바퀴', en: 'back wheel', color: '#1A1A1A' },
        tire_front: { ko: '앞바퀴', en: 'front wheel', color: '#1A1A1A' },
        hub_rear: { ko: '뒷바퀴 휠', en: 'back hubcap', color: '#C0C0C0' },
        hub_front: { ko: '앞바퀴 휠', en: 'front hubcap', color: '#C0C0C0' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" data-part="body" x="16" y="80" width="138" height="54" rx="12" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" data-part="turntable" x="28" y="64" width="56" height="22" rx="9" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="compartment_1" x="26" y="92" width="52" height="22" rx="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="compartment_2" x="90" y="92" width="52" height="22" rx="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="cab" d="M 148 134 V 72 Q 148 62 158 62 H 190 Q 198 62 202 69 L 216 90 Q 224 96 224 104 V 122 Q 224 134 212 134 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="window_cab" d="M 158 72 H 188 Q 192 72 195 76 L 205 92 H 158 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="headlight" cx="212" cy="114" r="10" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="ladder" d="M 30 56 L 196 26 Q 203 25 204 32 L 205 42 Q 205 47 199 48 L 32 78 Q 25 79 24 72 L 23 63 Q 23 57 30 56 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" data-part="light_red" x="112" y="66" width="28" height="18" rx="8" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="tire_rear" cx="60" cy="138" r="21" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="tire_front" cx="184" cy="138" r="21" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="hub_rear" cx="60" cy="138" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="hub_front" cx="184" cy="138" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <path d="M 50 55 V 72 M 72 51 V 68 M 94 47 V 64 M 116 43 V 60 M 138 39 V 56 M 160 35 V 52 M 182 31 V 49"/>
        </g>
      </svg>`,
      legacy: {
        1: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" x="150" y="35" width="15" height="8" rx="2" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 20 40 L 130 15 L 135 25 L 25 50 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <line x1="40" y1="36" x2="45" y2="45" stroke="#333" stroke-width="3"/>
        <line x1="60" y1="31" x2="65" y2="41" stroke="#333" stroke-width="3"/>
        <line x1="80" y1="26" x2="85" y2="36" stroke="#333" stroke-width="3"/>
        <line x1="100" y1="22" x2="105" y2="31" stroke="#333" stroke-width="3"/>
        <line x1="120" y1="17" x2="125" y2="27" stroke="#333" stroke-width="3"/>
        <path class="fillable" d="M 40 45 L 60 70 L 30 70 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="15" y="70" width="115" height="25" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="25" y="75" width="20" height="15" rx="2" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" x="55" y="75" width="20" height="15" rx="2" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" d="M 130 95 L 130 55 C 130 45, 140 43, 145 43 L 175 43 C 185 43, 190 65, 190 75 L 190 95 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 140 65 L 140 52 L 165 52 C 175 52, 178 58, 180 65 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="35" cy="95" r="14" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="35" cy="95" r="5" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="75" cy="95" r="14" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="75" cy="95" r="5" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="160" cy="95" r="14" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="160" cy="95" r="5" stroke="#333" stroke-width="4" fill="#FFF"/>
      <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="none">
<path d="M28 56 H56 M68 50 L118 39"/><circle cx="45" cy="67" r="5" fill="none"/><path d="M170 77 H183 M145 84 H155"/>
</g>
</svg>`,
      },
    },
    {
      id: 'ambulance',
      name: '구급차',
      emoji: '🚑',
      version: 2,
      parts: {
        light_red: { ko: '빨간 경광등', en: 'red siren light', color: '#FF4444' },
        light_blue: { ko: '파란 경광등', en: 'blue siren light', color: '#4488FF' },
        body: { ko: '구급차 뒷칸', en: 'ambulance box', color: '#FFF8E7' },
        window_box: { ko: '뒷칸 창문', en: 'box window', color: '#8EF6D1' },
        cross: { ko: '빨간 십자', en: 'red cross', color: '#FF4444' },
        cab: { ko: '운전석', en: 'cab', color: '#FFF8E7' },
        window_cab: { ko: '운전석 창문', en: 'cab window', color: '#8EF6D1' },
        stripe: { ko: '줄무늬', en: 'stripe', color: '#FF4444' },
        headlight: { ko: '헤드라이트', en: 'headlight', color: '#FFD700' },
        tire_rear: { ko: '뒷바퀴', en: 'back wheel', color: '#1A1A1A' },
        tire_front: { ko: '앞바퀴', en: 'front wheel', color: '#1A1A1A' },
        hub_rear: { ko: '뒷바퀴 휠', en: 'back hubcap', color: '#C0C0C0' },
        hub_front: { ko: '앞바퀴 휠', en: 'front hubcap', color: '#C0C0C0' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" data-part="light_red" x="96" y="22" width="26" height="18" rx="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="light_blue" x="124" y="22" width="26" height="18" rx="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="body" x="16" y="38" width="140" height="96" rx="12" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" data-part="window_box" x="26" y="50" width="36" height="28" rx="8" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="cross" d="M 93 52 H 107 V 67 H 122 V 81 H 107 V 96 H 93 V 81 H 78 V 67 H 93 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="cab" d="M 148 134 V 62 Q 148 52 158 52 H 184 Q 192 52 197 59 L 214 84 Q 224 90 224 100 V 122 Q 224 134 212 134 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="window_cab" d="M 158 62 H 182 Q 186 62 189 66 L 200 82 H 158 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="stripe" x="16" y="104" width="208" height="16" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="headlight" x="200" y="87" width="24" height="18" rx="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="tire_rear" cx="62" cy="138" r="21" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="tire_front" cx="184" cy="138" r="21" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="hub_rear" cx="62" cy="138" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="hub_front" cx="184" cy="138" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <path d="M 96 38 H 150"/>
          <path d="M 138 60 V 104"/>
          <path d="M 150 94 H 158"/>
        </g>
      </svg>`,
      legacy: {
        1: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" x="95" y="10" width="18" height="12" rx="4" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" x="118" y="10" width="18" height="12" rx="4" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" d="M 125 108 L 125 50 L 180 50 L 214 74 L 214 108 Z" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <path class="fillable" d="M 135 60 L 170 60 L 194 74 L 135 74 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" x="18" y="30" width="107" height="78" rx="4" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <rect class="fillable" x="22" y="38" width="30" height="60" rx="3" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" x="56" y="38" width="30" height="60" rx="3" stroke="#333" stroke-width="3" fill="#FFF"/>
        <line x1="86" y1="64" x2="86" y2="70" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
        <rect class="fillable" x="100" y="54" width="14" height="40" rx="3" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" x="92" y="66" width="30" height="16" rx="3" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" x="208" y="82" width="8" height="14" rx="3" stroke="#333" stroke-width="2.5" fill="#FFF"/>
        <circle class="fillable" cx="208" cy="98" r="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" x="14" y="104" width="204" height="10" rx="4" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="52" cy="120" r="22" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <circle class="fillable" cx="52" cy="120" r="9" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle cx="52" cy="109" r="2.5" fill="#333"/>
        <circle cx="52" cy="131" r="2.5" fill="#333"/>
        <circle cx="41" cy="120" r="2.5" fill="#333"/>
        <circle cx="63" cy="120" r="2.5" fill="#333"/>
        <circle class="fillable" cx="178" cy="120" r="22" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <circle class="fillable" cx="178" cy="120" r="9" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle cx="178" cy="109" r="2.5" fill="#333"/>
        <circle cx="178" cy="131" r="2.5" fill="#333"/>
        <circle cx="167" cy="120" r="2.5" fill="#333"/>
        <circle cx="189" cy="120" r="2.5" fill="#333"/>
      <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="none">
<path d="M37 48 H43 V57 H49 V64 H43 V73 H37 V64 H31 V57 H37 Z" fill="none"/><path d="M65 87 H77 M140 88 H160"/><path d="M145 78 H170"/>
</g>
</svg>`,
      },
    },
    {
      id: 'excavator',
      name: '포크레인',
      emoji: '🚧',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" x="20" y="95" width="90" height="26" rx="13" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="35" cy="108" r="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="65" cy="108" r="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="95" cy="108" r="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" d="M 30 95 L 30 45 L 85 45 L 95 95 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="40" y="52" width="35" height="25" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 75 75 L 125 25 L 145 40 L 95 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 130 30 L 160 85 L 145 95 L 115 40 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 150 85 L 175 85 L 185 115 L 155 115 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 175 85 L 190 80 L 180 95 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 180 100 L 195 95 L 185 110 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="none">
<path d="M27 117 H104 M47 88 H79"/><circle cx="88" cy="82" r="4" fill="none"/><path d="M162 97 H176 M154 107 H183"/>
</g>
</svg>`,
    },
    {
      id: 'dump_truck',
      name: '덤프트럭',
      emoji: '🚛',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" d="M 15 30 L 115 30 L 115 85 L 15 85 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="25" y="40" width="20" height="35" rx="2" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="55" y="40" width="20" height="35" rx="2" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="85" y="40" width="20" height="35" rx="2" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 120 85 L 120 40 L 160 40 L 185 65 L 185 85 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 128 48 L 155 48 L 172 65 L 128 65 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="40" cy="95" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="40" cy="95" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="90" cy="95" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="90" cy="95" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="155" cy="95" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="155" cy="95" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
      <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="none">
<path d="M18 28 L12 23 H118 L126 32"/><path d="M22 81 H108"/><path d="M132 73 H161 M137 78 H153"/><path d="M184 83 H190"/>
</g>
</svg>`,
    },
    {
      id: 'bulldozer',
      name: '불도저',
      emoji: '🚜',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" x="25" y="90" width="95" height="28" rx="14" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="42" cy="104" r="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="72" cy="104" r="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="102" cy="104" r="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" d="M 35 90 L 35 40 L 80 40 L 80 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="45" y="48" width="28" height="24" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 80 90 L 80 55 L 135 55 L 140 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="95" y="65" width="8" height="18" rx="2" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" x="115" y="65" width="8" height="18" rx="2" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" d="M 140 120 L 140 45 C 165 45, 180 75, 180 120 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 105 85 L 145 85 L 145 95 L 105 95 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
      <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="none">
<path d="M47 77 H69 M96 59 H122"/><path d="M146 110 H174"/><path d="M155 54 Q164 56 167 65"/><path d="M35 118 H118"/>
</g>
</svg>`,
    },
    {
      id: 'rocket',
      name: '우주 로켓',
      emoji: '🚀',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" d="M 95 90 L 95 115 L 105 115 L 105 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 80 75 L 45 105 L 80 100 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 120 75 L 155 105 L 120 100 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 85 105 L 100 145 L 115 105 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 93 105 L 100 128 L 107 105 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="80" y="45" width="40" height="60" rx="5" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 80 45 Q 100 5, 120 45 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="100" cy="65" r="14" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="100" cy="65" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
      <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="none">
<path d="M86 85 H93 M107 85 H114"/><path d="M93 98 H107"/><path d="M95 30 L100 23 L105 30"/><path d="M49 117 l7 -5 m93 5 l-7 -5"/>
</g>
</svg>`,
    },
    {
      id: 'dino',
      name: '공룡',
      emoji: '🦕',
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" x="74" y="118" width="20" height="38" rx="8" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <rect class="fillable" x="100" y="118" width="20" height="38" rx="8" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <rect class="fillable" x="146" y="118" width="20" height="38" rx="8" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <rect class="fillable" x="172" y="118" width="20" height="38" rx="8" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <path d="M74 156 Q79 162 84 156" stroke="#333" stroke-width="2" fill="none"/>
        <path d="M100 156 Q105 162 110 156" stroke="#333" stroke-width="2" fill="none"/>
        <path d="M146 156 Q151 162 156 156" stroke="#333" stroke-width="2" fill="none"/>
        <path d="M172 156 Q177 162 182 156" stroke="#333" stroke-width="2" fill="none"/>
        <path class="fillable" d="M 46 110 Q 38 68, 108 62 Q 162 58, 188 76 Q 210 88, 206 110 Q 166 136, 120 136 Q 68 136, 46 110 Z" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <path class="fillable" d="M 74 68 L 86 30 L 100 66 Z" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <path class="fillable" d="M 98 64 L 118 18 L 132 63 Z" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <path class="fillable" d="M 128 64 L 148 30 L 158 66 Z" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <path class="fillable" d="M 156 72 L 172 46 L 180 74 Z" stroke="#333" stroke-width="3.5" fill="#FFF"/>
        <path class="fillable" d="M 46 110 Q 18 105, 12 90 Q 10 78, 28 82 Q 38 90, 46 110 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle cx="186" cy="90" r="6" fill="#333"/>
        <circle cx="188" cy="88" r="2" fill="#fff"/>
        <circle cx="200" cy="97" r="2.5" fill="#555"/>
        <path d="M 194 104 Q 205 110, 212 106" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="none">
<path d="M196 111 Q188 119 178 115"/><circle cx="204" cy="92" r="2" fill="#333" stroke="none"/><path d="M79 151 L84 156 M109 151 L114 156 M156 151 L161 156"/>
</g>
</svg>`,
    },
    {
      id: 'train',
      name: '칙칙폭폭 기차',
      emoji: '🚂',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <circle class="fillable" cx="135" cy="15" r="10" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="110" cy="20" r="7" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="95" cy="10" r="5" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 140 100 L 180 100 L 155 75 L 140 75 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 15 45 L 75 45 L 70 25 L 20 25 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="20" y="45" width="50" height="55" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="30" y="55" width="30" height="20" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="70" y="60" width="75" height="40" rx="4" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="85" y="60" width="8" height="40" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" x="115" y="60" width="8" height="40" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" d="M 125 60 L 125 40 L 140 40 L 140 60 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 120 40 L 145 40 L 140 25 L 125 25 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="45" cy="100" r="18" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="45" cy="100" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="95" cy="105" r="12" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="95" cy="105" r="4" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="130" cy="105" r="12" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="130" cy="105" r="4" stroke="#333" stroke-width="4" fill="#FFF"/>
      <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="none">
<path d="M16 99 H161"/><path d="M35 83 H60"/><path d="M75 53 H142"/><path d="M150 84 H164"/><circle cx="174" cy="96" r="4" fill="none"/>
</g>
</svg>`,
    },
    {
      id: 'airplane',
      name: '비행기',
      emoji: '✈️',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" d="M 40 70 L 25 35 L 50 35 L 60 65 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 85 65 L 130 30 L 145 35 L 110 70 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 30 75 C 20 60, 140 50, 170 75 C 190 100, 30 90, 30 75 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 85 80 L 120 120 L 135 115 L 115 85 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <ellipse class="fillable" cx="105" cy="100" rx="14" ry="8" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 145 70 L 155 75 L 145 80 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="125" cy="74" r="5" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="105" cy="74" r="5" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="85" cy="74" r="5" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="65" cy="74" r="5" stroke="#333" stroke-width="3" fill="#FFF"/>
      <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="none">
<path d="M33 75 Q40 70 52 70"/><path d="M90 63 L125 38"/><path d="M101 87 L124 111"/><path d="M160 73 Q168 78 165 83"/>
</g>
</svg>`,
    },
    {
      id: 'lion',
      name: '어흥 사자',
      emoji: '🦁',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <polygon class="fillable" points="100,10 120,25 145,15 145,40 170,45 155,65 175,85 150,100 160,125 130,120 100,140 70,120 40,125 50,100 25,85 45,65 30,45 55,40 55,15 80,25" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="72" cy="50" r="14" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="128" cy="50" r="14" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="100" cy="75" r="38" stroke="#333" stroke-width="4" fill="#FFF"/>
        <ellipse class="fillable" cx="100" cy="88" rx="18" ry="12" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 90 82 L 110 82 L 100 92 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle cx="85" cy="65" r="5" fill="#333"/>
        <circle cx="115" cy="65" r="5" fill="#333"/>
        <path d="M 95 96 Q 100 100, 105 96" stroke="#333" stroke-width="3" fill="none"/>
      <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="none">
<path d="M72 92 L46 88 M70 99 L42 102 M128 92 L154 88 M130 99 L158 102"/><path d="M93 99 Q100 110 107 99"/><circle cx="91" cy="82" r="2" fill="#333" stroke="none"/><circle cx="109" cy="82" r="2" fill="#333" stroke="none"/>
</g>
</svg>`,
    },
    {
      id: 'whale',
      name: '고래',
      emoji: '🐳',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" d="M 50 90 L 15 60 L 30 90 L 10 120 L 50 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 45 80 Q 45 35, 120 40 Q 185 50, 185 85 Q 185 125, 120 125 Q 45 125, 45 80 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 55 105 Q 120 130, 180 95 Q 120 115, 55 105 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 105 100 Q 130 140, 145 105 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="95" cy="15" r="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="115" cy="10" r="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="135" cy="22" r="5" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path d="M 115 35 Q 110 25, 105 20" stroke="#333" stroke-width="4" fill="none" stroke-linecap="round"/>
        <circle cx="155" cy="70" r="5" fill="#333"/>
      <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="none">
<path d="M151 95 Q161 102 173 94"/><path d="M119 31 Q123 28 125 24"/><path d="M130 57 Q137 54 144 58"/><path d="M41 86 Q35 92 41 98"/>
</g>
</svg>`,
    },
    {
      id: 'icecream',
      name: '아이스크림',
      emoji: '🍦',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" d="M 75 100 L 100 145 L 125 100 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <ellipse class="fillable" cx="100" cy="98" rx="28" ry="8" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 65 95 C 65 60, 135 60, 135 95 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 75 75 C 75 45, 125 45, 125 75 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 85 55 C 85 30, 115 30, 115 55 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="100" cy="25" r="10" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path d="M 100 15 Q 110 5, 120 10" stroke="#333" stroke-width="4" fill="none" stroke-linecap="round"/>
      <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="none">
<path d="M84 112 L115 134 M115 112 L87 133"/><path d="M91 59 L95 63 M108 62 L113 59 M99 83 L104 80"/><path d="M90 42 L94 45"/>
</g>
</svg>`,
    },
  ];

  const state = {
    container: null,
    options: {},
    tab: 'free',
    mode: 'free',
    canvas: null,
    ctx: null,
    isDrawing: false,
    currentColor: '#FF4444',
    currentSize: 18,
    isRainbow: false,
    hue: 0,
    activeTheme: 'white',
    paintHistory: [],
    activeTemplateId: 'police',
    coloringCompleted: false,
    destroyed: false,
    timers: [],
    resizeHandler: null,
    resizeTimer: null,
    speechToken: 0,
    templateWork: {},
    freeImage: '',
    freeHistory: [],
    freeRestoreToken: 0,
    freeRestorePending: 0,
    freeCanvasReady: false,
    freeRestoreFailed: false,
    pointerId: null,
    lastPoint: null,
    pageHideHandler: null,
  };

  const WORK_KEY = 'sihyeon-art-work-v1';
  // One-time, never-overwritten copy of the coloring fills as they were before
  // template versioning shipped. Free-drawing PNGs are excluded so the copy
  // cannot push the main save over the storage quota.
  const WORK_BACKUP_KEY = 'sihyeon-art-work-v1-backup';
  const FILL_RE = /^(#[0-9a-f]{3,8}|hsl\([0-9.,% ]+\)|white|none)$/i;
  const PART_RE = /^[a-z][a-z0-9_]{0,40}$/;
  const safeFill = (f) => (typeof f === 'string' && FILL_RE.test(f) ? f : '#FFF');
  const isPainted = (f) => !!f && !/^(#fff|#ffffff|white|none)$/i.test(f);
  const templateVersion = (tpl) => (Number.isInteger(tpl?.version) && tpl.version > 0 ? tpl.version : 1);

  // Saved fills are index-ordered for the exact SVG they were painted on.
  // data-part ids (in .fillable document order) make the same paint portable
  // across future SVG revisions without relying on that order.
  const partOrderCache = new Map();
  function partOrder(svg) {
    const key = String(svg || '');
    if (partOrderCache.has(key)) return partOrderCache.get(key);
    const ids = [];
    for (const m of key.matchAll(/<[a-z]+\b[^>]*\bclass="(?:[^"]*\s)?fillable(?:\s[^"]*)?"[^>]*>/gi)) {
      const p = m[0].match(/\bdata-part="([^"]+)"/);
      ids.push(p && PART_RE.test(p[1]) ? p[1] : null);
    }
    const unique = ids.every(Boolean) && new Set(ids).size === ids.length;
    const result = { ids, unique };
    partOrderCache.set(key, result);
    return result;
  }
  // The SVG a saved work must be drawn on: an older revision's artwork stays
  // on that revision so each index keeps meaning the same part.
  function workSvg(tpl, work) {
    const v = work?.svgVersion || 1;
    if (v !== templateVersion(tpl) && typeof tpl.legacy?.[v] === 'string') return tpl.legacy[v];
    return tpl.svg;
  }
  function normalizeWork(tpl, work) {
    const current = templateVersion(tpl);
    if (!Number.isInteger(work.svgVersion) || work.svgVersion < 1) work.svgVersion = 1;
    if (work.svgVersion === current) return work;
    const painted = work.fills.some(isPainted);
    if (painted && work.svgVersion < current && typeof tpl.legacy?.[work.svgVersion] === 'string') return work;
    // No drawable older artwork: carry paint over only by matching part ids.
    const target = partOrder(tpl.svg);
    const parts = work.parts || {};
    work.fills = target.unique ? target.ids.map((p) => (Object.prototype.hasOwnProperty.call(parts, p) ? safeFill(parts[p]) : '#FFF')) : [];
    work.svgVersion = current;
    work.completed = false;
    work.history = [];
    return work;
  }
  function serializeTemplates() {
    const out = {};
    Object.keys(state.templateWork).forEach((id) => {
      const w = state.templateWork[id];
      if (!w) return;
      const entry = { svgVersion: w.svgVersion || 1, fills: w.fills, completed: !!w.completed };
      const tpl = COLORING_TEMPLATES.find((t) => t.id === id);
      const order = tpl ? partOrder(workSvg(tpl, w)) : null;
      if (order && order.unique && order.ids.length) {
        entry.parts = {};
        order.ids.forEach((p, i) => { entry.parts[p] = w.fills[i] || '#FFF'; });
      } else if (w.parts) entry.parts = w.parts;
      out[id] = entry;
    });
    return out;
  }
  function backupWorkOnce() {
    try {
      if (localStorage.getItem(WORK_BACKUP_KEY) !== null) return;
      const raw = localStorage.getItem(WORK_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || !data.templates || typeof data.templates !== 'object') return;
      localStorage.setItem(WORK_BACKUP_KEY, JSON.stringify({ savedFrom: WORK_KEY, templates: data.templates }));
    } catch (_) { /* The main save is untouched when a backup cannot be written. */ }
  }

  let memoryWork = null;
  function saveWork() {
    try {
      // A newly sized canvas is blank until the saved PNG has decoded. Keep the
      // canonical PNG when leaving, changing tabs, or saving during that interval.
      if (state.freeCanvasReady && state.canvas && state.canvas.width > 1) state.freeImage = state.canvas.toDataURL('image/png');
      const serialized = JSON.stringify({templates:serializeTemplates(), freeImage:state.freeImage, activeTemplateId:state.activeTemplateId, activeTheme:state.activeTheme, tab:state.tab});
      // A write can fail while reads keep returning an older picture. Preserve
      // a detached canonical snapshot before attempting persistent storage.
      memoryWork = JSON.parse(serialized);
      localStorage.setItem(WORK_KEY, serialized);
    } catch (_) { /* In-memory work stays available when storage is full. */ }
  }
  function loadWork() {
    if (!memoryWork) backupWorkOnce();
    try {
      const data=memoryWork || JSON.parse(localStorage.getItem(WORK_KEY)||'null');
      if (!data || typeof data!=='object') return;
      if (COLORING_TEMPLATES.some(t=>t.id===data.activeTemplateId)) state.activeTemplateId=data.activeTemplateId;
      if (THEMES[data.activeTheme]) state.activeTheme=data.activeTheme;
      if (data.tab==='free'||data.tab==='coloring') state.tab=data.tab;
      if (typeof data.freeImage==='string' && data.freeImage.startsWith('data:image/png;base64,') && data.freeImage.length<4000000) state.freeImage=data.freeImage;
      if (data.templates && typeof data.templates==='object') {
        COLORING_TEMPLATES.forEach(t=>{
          const item=data.templates[t.id];
          if(!item || typeof item!=='object') return;
          const hasFills=Array.isArray(item.fills);
          const hasParts=!!item.parts && typeof item.parts==='object' && !Array.isArray(item.parts);
          if(!hasFills && !hasParts) return;
          // Saves written before versioning carry no svgVersion: they are v1.
          const svgVersion=Number.isInteger(item.svgVersion) && item.svgVersion>0 && item.svgVersion<1000 ? item.svgVersion : 1;
          const work={svgVersion,fills:hasFills?item.fills.slice(0,1000).map(safeFill):[],completed:!!item.completed,history:[]};
          if(hasParts){
            work.parts=Object.create(null);
            Object.keys(item.parts).slice(0,1000).forEach(k=>{ if(PART_RE.test(k)) work.parts[k]=safeFill(item.parts[k]); });
            if(!hasFills){
              const order=partOrder(workSvg(t,work));
              if(order.unique) work.fills=order.ids.map(p=>work.parts[p]||'#FFF');
            }
          }
          state.templateWork[t.id]=normalizeWork(t,work);
        });
      }
    } catch (_) {}
  }
  function updateFreeRestoreNotice() {
    const notice = state.container?.querySelector?.('#azRestoreNotice');
    if (!notice) return;
    notice.hidden = state.destroyed || state.tab !== 'free' || state.freeCanvasReady;
    notice.textContent = state.freeRestoreFailed
      ? '그림을 불러오지 못했어요. 📄 새 종이를 누르면 다시 그릴 수 있어요.'
      : '그림을 불러오고 있어요…';
  }
  function restoreFreeImage(source) {
    const token = ++state.freeRestoreToken;
    state.freeRestorePending = 0;
    state.freeCanvasReady = false;
    state.freeRestoreFailed = false;
    if (!state.canvas) { updateFreeRestoreNotice(); return; }
    if (!source) {
      const rect = getCanvasCssRect();
      state.ctx.clearRect(0, 0, rect.width, rect.height);
      state.freeImage = '';
      state.freeCanvasReady = true;
      updateFreeRestoreNotice();
      return;
    }
    state.freeImage = source;
    state.freeRestorePending = token;
    updateFreeRestoreNotice();
    const image=new Image(); const canvas=state.canvas;
    const isCurrent = () => !state.destroyed && state.canvas === canvas && state.freeRestoreToken === token && state.freeRestorePending === token;
    const failed = () => {
      if (!isCurrent()) return;
      state.freeRestorePending = 0;
      state.freeRestoreFailed = true;
      // Keep the original PNG for retry or undo after an explicit new paper.
      // A failed decode never makes the blank canvas an authoritative picture.
      updateFreeRestoreNotice();
    };
    image.onload=()=>{
      // A late image must not erase a newer undo, a blank page, or a new stroke.
      if (!isCurrent()) return;
      try {
        const rect=getCanvasCssRect();state.ctx.clearRect(0,0,rect.width,rect.height);state.ctx.drawImage(image,0,0,rect.width,rect.height);
        state.freeRestorePending = 0;
        state.freeCanvasReady = true;
        state.freeRestoreFailed = false;
        updateFreeRestoreNotice();
      } catch (_) { failed(); }
    };
    image.onerror = failed;
    try { image.src=source; } catch (_) { failed(); }
  }
  function undoWork() {
    if(state.tab==='coloring') {
      const work=state.templateWork[state.activeTemplateId]; const item=work?.history?.pop();
      if(!item)return;
      if(item.fills){work.fills=item.fills;if(item.svgVersion)work.svgVersion=item.svgVersion;}else work.fills[item.index]=item.prev;work.completed=false;
      renderColoringTemplate(COLORING_TEMPLATES.find(t=>t.id===state.activeTemplateId));
    } else {
      const prior=state.freeHistory.pop();if(prior===undefined)return;
      state.freeImage=prior;restoreFreeImage(prior);
    }
    timer(saveWork,100);
  }
  function clearWork() {
    if(state.tab==='coloring') {
      const work=state.templateWork[state.activeTemplateId];
      const tpl=COLORING_TEMPLATES.find(t=>t.id===state.activeTemplateId);
      if(work){
        // New paper is where an older saved picture moves to the newest artwork;
        // undo restores both the fills and the revision they belong to.
        work.history.push({fills:work.fills.slice(),svgVersion:work.svgVersion||1});
        const current=templateVersion(tpl);
        if((work.svgVersion||1)!==current){work.svgVersion=current;work.fills=[];}
        else work.fills=work.fills.map(()=>'#FFF');
      }
      if(work)work.completed=false;
      renderColoringTemplate(tpl);
    } else {
      const prior = state.freeCanvasReady ? state.canvas.toDataURL('image/png') : state.freeImage;
      state.freeHistory.push(prior);state.freeHistory=state.freeHistory.slice(-12);
      state.freeRestoreToken += 1;
      state.freeRestorePending = 0;
      state.freeRestoreFailed = false;
      const rect=getCanvasCssRect();state.ctx.clearRect(0,0,rect.width,rect.height);
      state.freeCanvasReady = true;
      updateFreeRestoreNotice();
    }
    saveWork();speak('새 종이야. 되돌리면 그림이 돌아와!');
  }

  function timer(fn, ms) {
    const id = setTimeout(fn, ms);
    state.timers.push(id);
    return id;
  }

  function clearTimers() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
  }

  function removeStyleById(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function injectStyle() {
    removeStyleById(STYLE_ID);
    LEGACY_STYLE_IDS.forEach(removeStyleById);

    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .az-root{
        width:100%;
        height:100%;
        min-height:100dvh;
        display:flex;
        flex-direction:column;
        background:#f0f4f8;
        font-family:'Jua',system-ui,-apple-system,BlinkMacSystemFont,sans-serif;
        touch-action:none;
        position:relative;
        overflow:hidden;
        color:#233044;
      }

      .az-topbar{
        flex:0 0 64px;
        height:64px;
        min-height:64px;
        display:flex;
        align-items:center;
        justify-content:center;
        gap:12px;
        padding:7px 14px;
        background:#fff;
        border-bottom:5px solid #FF7A1A;
        box-sizing:border-box;
        z-index:5;
        position:relative;
      }


      .az-mode-tabs{
        display:flex;
        gap:10px;
        align-items:center;
        justify-content:center;
        flex:0 1 560px;
        width:min(600px, calc(100vw - 260px));
        margin:0 auto;
      }

      .az-mode-tab{
        flex:1 1 0;
        min-width:0;
        height:48px;
        padding:7px 16px;
        border-radius:23px;
        border:3px solid #e6e9ef;
        background:#f9fafc;
        color:#233044;
        font:inherit;
        font-weight:900;
        font-size:18px;
        cursor:pointer;
        transition:transform .16s ease, background .16s ease, border-color .16s ease;
        -webkit-tap-highlight-color:transparent;
        white-space:nowrap;
      }

      .az-mode-tab.active{
        background:#FF7A1A;
        color:#fff;
        border-color:#FF7A1A;
        transform:scale(1.02);
        box-shadow:0 4px 0 #E65100;
      }

      .az-brand{
        position:absolute;
        right:18px;
        top:50%;
        transform:translateY(-50%);
        font-size:16px;
        font-weight:900;
        color:#6b7280;
        opacity:.82;
        white-space:nowrap;
      }

      .az-workspace{
        flex:1 1 auto;
        min-height:0;
        display:grid;
        grid-template-columns:220px minmax(0,1fr) 220px;
        grid-template-rows:minmax(0,1fr);
        gap:10px;
        padding:8px;
        box-sizing:border-box;
        overflow:hidden;
      }

      .az-left-panel,
      .az-right-panel{
        min-width:0;
        min-height:0;
        display:flex;
        flex-direction:column;
        gap:10px;
        overflow:hidden;
        box-sizing:border-box;
      }

      .az-main{
        min-width:0;
        min-height:0;
        position:relative;
        display:flex;
        align-items:center;
        justify-content:center;
        overflow:hidden;
        box-sizing:border-box;
      }

      .az-panel-section{
        background:rgba(255,255,255,.94);
        border:2px solid rgba(36,45,66,.08);
        border-radius:22px;
        padding:12px;
        box-shadow:0 8px 22px rgba(31,45,61,.06);
        box-sizing:border-box;
      }

      .az-panel-title{
        display:flex;
        align-items:center;
        justify-content:space-between;
        margin:0 0 10px;
        font-size:14px;
        line-height:1;
        font-weight:900;
        color:#6b7280;
        white-space:nowrap;
      }

      .az-panel-row{
        display:flex;
        gap:8px;
        overflow-x:auto;
        overflow-y:hidden;
        scrollbar-width:none;
        -webkit-overflow-scrolling:touch;
        padding:2px 2px 6px;
      }

      .az-panel-row::-webkit-scrollbar{ display:none; }

      .az-cat-btn{
        flex:0 0 auto;
        min-height:50px;
        min-width:70px;
        padding:8px 12px;
        border-radius:18px;
        border:3px solid #eef0f4;
        background:#fff;
        color:#233044;
        font:inherit;
        font-size:15px;
        font-weight:900;
        cursor:pointer;
        transition:transform .15s ease, border-color .15s ease, background .15s ease;
        box-shadow:0 4px 0 rgba(0,0,0,.08);
        -webkit-tap-highlight-color:transparent;
      }

      .az-cat-btn.active{
        border-color:#FF7A1A;
        color:#FF7A1A;
        background:#fff8ef;
        transform:translateY(-2px);
      }

      #azTplRow{
        flex:1 1 auto;
        min-height:0;
        overflow-y:auto;
        overflow-x:hidden;
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        align-content:start;
        gap:10px;
        padding:1px 2px 6px;
      }

      #azTplRow .az-cat-btn{
        width:100%;
        min-width:0;
        min-height:86px;
        font-size:42px;
        display:grid;
        place-items:center;
        padding:6px;
      }

      .az-canvas-shell{
        width:100%;
        height:100%;
        max-width:none;
        max-height:100%;
        aspect-ratio:auto;
        display:flex;
        align-items:center;
        justify-content:center;
        min-width:0;
        min-height:0;
      }

      .az-canvas-wrap{
        position:relative;
        width:100%;
        height:100%;
        background:#fff;
        border:5px solid #222;
        border-radius:26px;
        box-shadow:0 16px 38px rgba(0,0,0,.14);
        overflow:hidden;
        transition:background .25s ease;
        display:flex;
        align-items:center;
        justify-content:center;
      }

      #azCanvas{
        width:100%;
        height:100%;
        display:block;
        touch-action:none;
      }

      .az-coloring-wrap{
        position:absolute;
        inset:0;
        display:none;
        align-items:center;
        justify-content:center;
        padding:0;
        background:#fffbf5;
        box-sizing:border-box;
      }

      .az-coloring-wrap svg{
        width:100%;
        height:100%;
        max-width:98%;
        max-height:98%;
        overflow:visible;
        display:block;
      }

      .az-coloring-wrap .fillable{
        cursor:pointer;
        transition:fill .34s ease, opacity .12s ease;
        pointer-events:fill;
      }

      .az-coloring-wrap .fillable:active{ opacity:.7; }

      .az-coloring-wrap.az-done svg{
        animation:az-glow-bounce .7s cubic-bezier(.2,1.4,.35,1) forwards;
        filter:drop-shadow(0 0 10px #FFD700) drop-shadow(0 0 22px #FF9800) drop-shadow(0 0 36px #FF5722);
      }

      @keyframes az-glow-bounce{
        0%{transform:scale(1)}
        40%{transform:scale(1.08)}
        70%{transform:scale(.98)}
        100%{transform:scale(1.04)}
      }

      .az-color-section{
        flex:1 1 auto;
        min-height:0;
        overflow:hidden;
        display:flex;
        flex-direction:column;
      }

      .az-palette-row{
        flex:1 1 auto;
        min-height:0;
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:10px;
        align-content:start;
        overflow-y:auto;
        overflow-x:hidden;
        scrollbar-width:none;
        padding:1px 1px 4px;
      }

      .az-palette-row::-webkit-scrollbar{ display:none; }

      .az-color-circle{
        width:100%;
        aspect-ratio:1 / 1;
        border-radius:50%;
        border:5px solid #fff;
        box-shadow:0 7px 16px rgba(0,0,0,.16);
        cursor:pointer;
        transition:transform .15s ease, border-color .15s ease;
        box-sizing:border-box;
        -webkit-tap-highlight-color:transparent;
      }

      .az-color-circle.active{
        transform:scale(1.08) translateY(-2px);
        border-color:#222;
      }

      .az-work-actions{display:flex;flex:0 0 auto;gap:6px}.az-work-actions button{width:48px;height:48px;background:#fff;border:2px solid #bac7d1;border-radius:14px;font-size:25px}.az-topbar{padding-left:70px!important;padding-right:10px!important}.az-brand{display:none}
      @media(max-width:520px){.az-brand{display:none}.az-topbar{padding-right:8px!important;gap:5px}.az-work-actions button{width:42px;height:44px}.az-mode-tab{font-size:14px!important;padding:8px!important}}
      .az-rainbow{
        background:linear-gradient(45deg,#ff0000,#ffeb3b,#00ff00,#00bcd4,#0044ff,#9c27b0);
        position:relative;
      }

      .az-rainbow::after{
        content:'✨';
        position:absolute;
        inset:0;
        display:grid;
        place-items:center;
        font-size:24px;
      }

      .az-sparkle{
        position:absolute;
        pointer-events:none;
        font-size:22px;
        z-index:200;
        animation:az-sparkle-burst .65s forwards;
      }

      @keyframes az-sparkle-burst{
        0%{opacity:1;transform:translate(var(--sx),var(--sy)) scale(1.3)}
        100%{opacity:0;transform:translate(calc(var(--sx) + var(--tx,0px)),calc(var(--sy) + var(--ty,-55px))) scale(.2)}
      }

      .az-particle{
        position:absolute;
        pointer-events:none;
        font-size:26px;
        z-index:200;
        animation:az-pop .8s forwards;
      }

      @keyframes az-pop{
        0%{transform:scale(0) rotate(0deg);opacity:1}
        100%{transform:scale(1.5) rotate(180deg) translateY(-75px);opacity:0}
      }

      @media (max-width:767px), (orientation:portrait) {
        .az-root{ overflow:hidden; }

        .az-topbar{
          flex-basis:46px;
          height:46px;
          min-height:46px;
          padding:3px 8px;
          gap:6px;
          border-bottom-width:3px;
        }


        .az-mode-tabs{
          flex:0 1 420px;
          width:min(420px, calc(100vw - 24px));
          gap:6px;
        }

        .az-mode-tab{
          height:38px;
          padding:4px 8px;
          border-width:2px;
          border-radius:17px;
          font-size:14px;
        }

        .az-brand{ display:none; }

        .az-workspace{
          grid-template-columns:1fr;
          grid-template-rows:84px minmax(0,1fr) 104px;
          gap:6px;
          padding:6px;
        }

        .az-left-panel{
          order:1;
          overflow:hidden;
          display:block;
        }

        .az-left-panel .free-section,
        .az-left-panel .coloring-section{
          height:84px;
          overflow:hidden;
        }

        .az-main{
          order:2;
        }

        .az-right-panel{
          order:3;
          overflow:hidden;
          display:block;
        }

        .az-panel-section{
          padding:7px;
          border-radius:16px;
        }

        .az-panel-title{
          display:none;
        }

        .free-section .az-panel-row,
        .coloring-section .az-panel-row,
        #azTplRow{
          height:70px;
          display:flex;
          flex-direction:row;
          align-items:center;
          gap:8px;
          overflow-x:auto;
          overflow-y:hidden;
          padding:0 2px 4px;
        }

        #azTplRow .az-cat-btn,
        .az-cat-btn{
          flex:0 0 68px;
          width:68px;
          min-width:68px;
          min-height:62px;
          height:62px;
          font-size:30px;
          padding:5px;
          border-radius:18px;
        }

        .free-section .az-cat-btn{
          flex:0 0 auto;
          width:auto;
          min-width:76px;
          font-size:14px;
        }

        .az-canvas-shell{
          width:min(96vw,100%);
          height:auto;
          max-width:none;
          max-height:100%;
          aspect-ratio:1 / 1;
        }

        .az-canvas-wrap{
          border-width:4px;
          border-radius:22px;
        }

        .az-color-section{
          height:104px;
          padding:7px;
          overflow:hidden;
        }

        .az-palette-row{
          height:90px;
          grid-template-columns:repeat(8,minmax(0,1fr));
          grid-template-rows:repeat(2,minmax(0,1fr));
          gap:6px;
          align-items:center;
          overflow:hidden;
          padding:0;
        }

        .az-color-circle{
          width:100%;
          height:100%;
          min-height:38px;
          max-height:46px;
          border-width:3px;
        }

        .az-coloring-wrap svg{
          max-width:94%;
          max-height:94%;
        }
      }

      @media (min-width:768px) and (min-height:501px) and (orientation:landscape) {
        .az-topbar{
          flex-basis:64px;
          height:64px;
          min-height:64px;
          padding:7px 14px;
        }

        .az-workspace{
          grid-template-columns:220px minmax(0,1fr) 220px;
          gap:10px;
          padding:8px;
        }

        .az-left-panel,
        .az-right-panel{
          height:100%;
          overflow:hidden;
        }

        .az-canvas-shell{
          width:100%;
          height:100%;
          max-width:none;
          max-height:100%;
          aspect-ratio:auto;
        }

        .az-color-circle{
          min-height:72px;
        }

        #azTplRow .az-cat-btn{
          min-height:86px;
          font-size:42px;
        }
      }

      @media (min-width:1024px) and (min-height:680px) and (orientation:landscape) {
        .az-workspace{
          grid-template-columns:240px minmax(0,1fr) 240px;
          gap:10px;
          padding:8px;
        }

        .az-mode-tabs{
          flex-basis:600px;
          width:min(600px, calc(100vw - 340px));
        }

        .az-canvas-shell{
          width:100%;
          height:100%;
          max-width:none;
          max-height:100%;
          aspect-ratio:auto;
        }
      }

      @media (max-height:500px) and (orientation:landscape) {
        .az-topbar{
          flex-basis:40px;
          height:40px;
          min-height:40px;
          padding:3px 8px;
          border-bottom-width:3px;
        }


        .az-mode-tabs{
          flex:0 1 380px;
          width:min(390px, calc(100vw - 24px));
          gap:6px;
        }

        .az-mode-tab{
          height:31px;
          padding:3px 9px;
          font-size:12px;
          border-width:2px;
          border-radius:16px;
        }

        .az-brand{
          font-size:12px;
        }

        .az-workspace{
          grid-template-columns:132px minmax(0,1fr) 132px;
          grid-template-rows:minmax(0,1fr);
          gap:4px;
          padding:4px;
          overflow:hidden;
        }

        .az-panel-section{
          padding:4px;
          border-radius:10px;
          box-shadow:none;
        }

        .az-panel-title{
          font-size:9px;
          margin-bottom:4px;
        }

        #azTplRow{
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:4px;
        }

        #azTplRow .az-cat-btn{
          min-height:48px;
          font-size:25px;
          border-radius:9px;
          border-width:1px;
          box-shadow:0 2px 0 rgba(0,0,0,.08);
        }

        .az-cat-btn{
          min-width:0;
          min-height:34px;
          font-size:9px;
          padding:2px;
          border-width:1px;
          border-radius:8px;
          box-shadow:0 2px 0 rgba(0,0,0,.08);
        }

        .az-canvas-shell{
          width:100%;
          height:100%;
          max-width:none;
          max-height:100%;
          aspect-ratio:auto;
        }

        .az-canvas-wrap{
          border-width:2px;
          border-radius:12px;
          box-shadow:0 6px 14px rgba(0,0,0,.10);
        }

        .az-palette-row{
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:5px;
        }

        .az-color-circle{
          border-width:2px;
        }

        .az-rainbow::after{
          font-size:16px;
        }

        .az-coloring-wrap svg{
          max-width:94%;
          max-height:94%;
        }
      }
    `;
    s.textContent += `
      .az-mode-tabs{min-width:0;max-width:600px;flex:1 1 auto}
      @media(max-width:767px),(orientation:portrait){.az-topbar{flex-basis:60px;height:60px;min-height:60px}.az-work-actions button{height:44px}}
      @media(orientation:landscape) and (max-height:500px){.az-topbar{flex-basis:56px;height:56px;min-height:56px}.az-work-actions button{height:44px}}
    `;
    document.head.appendChild(s);
  }

  function render(container, options = {}) {
    destroy(false);

    state.container = container;
    state.options = options;
    state.tab = 'coloring';
    loadWork();
    state.mode = 'free';
    state.paintHistory = [];
    state.coloringCompleted = false;
    state.destroyed = false;
    state.currentColor = '#FF4444';
    state.currentSize = 18;
    state.isRainbow = false;
    state.hue = 0;
    state.speechToken += 1;

    if (options.initialTemplateId && COLORING_TEMPLATES.some((t) => t.id === options.initialTemplateId)) {
      state.activeTemplateId = options.initialTemplateId;
    }

    injectStyle();

    const isInitialColoring = state.tab === 'coloring';

    container.innerHTML = `
      <div class="az-root" data-tab="${state.tab}">
        <header class="az-topbar">
          <div class="az-mode-tabs">
            <button type="button" class="az-mode-tab${!isInitialColoring ? ' active' : ''}" data-tab="free">🎨 그림 팡팡</button>
            <button type="button" class="az-mode-tab${isInitialColoring ? ' active' : ''}" data-tab="coloring">🌈 색칠 팡팡</button>
          </div>
          <div class="az-brand">🎨 매직 그림판</div>
          <div class="az-work-actions"><button type="button" id="azUndo" aria-label="되돌리기">↶</button><button type="button" id="azNewPaper" aria-label="새 종이">📄</button></div>
        </header>

        <main class="az-workspace">
          <aside class="az-left-panel">
            <section class="az-panel-section free-section"${isInitialColoring ? ' style="display:none;"' : ''}>
              <div class="az-panel-title">배경 고르기</div>
              <div class="az-panel-row" id="azThemeRow">
                ${Object.keys(THEMES).map((k) => `<button type="button" class="az-cat-btn${k === state.activeTheme ? ' active' : ''}" data-theme="${k}">${THEMES[k].label}</button>`).join('')}
              </div>
            </section>

            <section class="az-panel-section coloring-section"${!isInitialColoring ? ' style="display:none;"' : ''}>
              <div class="az-panel-title">색칠 그림</div>
              <div class="az-panel-row" id="azTplRow">
                ${COLORING_TEMPLATES.map((t) => `<button type="button" class="az-cat-btn${t.id === state.activeTemplateId ? ' active' : ''}" data-tpl="${t.id}" aria-label="${t.name}">${t.emoji}</button>`).join('')}
              </div>
            </section>
          </aside>

          <section class="az-main">
            <div class="az-canvas-shell">
              <div class="az-canvas-wrap" id="azCanvasWrap">
                <canvas id="azCanvas"${isInitialColoring ? ' style="display:none;"' : ''}></canvas>
                <div class="az-coloring-wrap" id="azColoringWrap"${isInitialColoring ? ' style="display:flex;"' : ''}></div>
                <div id="azRestoreNotice" role="status" hidden style="position:absolute;z-index:3;left:50%;top:12px;transform:translateX(-50%);max-width:90%;padding:9px 13px;border-radius:14px;background:#fff8e7;color:#5e5143;font-size:14px;text-align:center;pointer-events:none;"></div>
              </div>
            </div>
          </section>

          <aside class="az-right-panel">
            <section class="az-panel-section az-color-section">
              <div class="az-panel-title">색깔 고르기</div>
              <div class="az-palette-row" id="azPaletteRow">
                ${COLORS.map((color) => `<button type="button" class="az-color-circle${color.c === 'rainbow' ? ' az-rainbow' : ''}${state.currentColor === color.c ? ' active' : ''}" ${color.c !== 'rainbow' ? `style="background:${color.c}"` : ''} data-color="${color.c}" data-name="${color.n}" aria-label="${color.n}"></button>`).join('')}
              </div>
            </section>
          </aside>
        </main>
      </div>
    `;

    initCanvas();
    bindEvents();
    installResizeHandler();

    requestAnimationFrame(() => {
      resizeCanvasPreserve(true);
      applyThemeBg();

      if (isInitialColoring) {
        const tpl = COLORING_TEMPLATES.find((t) => t.id === state.activeTemplateId);
        renderColoringTemplate(tpl);
      }
    });

    speak('시현아. 마법 그림판이야. 같이 그리고 색칠해볼까?', true);
  }

  function initCanvas() {
    state.freeCanvasReady = false;
    state.freeRestorePending = 0;
    state.freeRestoreFailed = false;
    state.canvas = document.getElementById('azCanvas');
    state.ctx = state.canvas.getContext('2d');
    resizeCanvasPreserve(false);
    state.ctx.lineCap = 'round';
    state.ctx.lineJoin = 'round';
    applyThemeBg();
    restoreFreeImage(state.freeImage);
  }

  function getCanvasCssRect() {
    const wrap = document.getElementById('azCanvasWrap');
    if (!wrap) return { width: 1, height: 1 };
    const rect = wrap.getBoundingClientRect();
    return {
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
    };
  }

  function resizeCanvasPreserve(preserve = true) {
    if (!state.canvas || !state.ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = getCanvasCssRect();

    const oldCanvas = preserve && state.canvas.width && state.canvas.height
      ? document.createElement('canvas')
      : null;

    if (oldCanvas) {
      oldCanvas.width = state.canvas.width;
      oldCanvas.height = state.canvas.height;
      const oldCtx = oldCanvas.getContext('2d');
      oldCtx.drawImage(state.canvas, 0, 0);
    }

    const nextWidth = Math.max(1, Math.round(rect.width * dpr));
    const nextHeight = Math.max(1, Math.round(rect.height * dpr));

    if (state.canvas.width === nextWidth && state.canvas.height === nextHeight) {
      return;
    }

    state.canvas.width = nextWidth;
    state.canvas.height = nextHeight;

    state.ctx.setTransform(1, 0, 0, 1, 0, 0);
    state.ctx.clearRect(0, 0, nextWidth, nextHeight);
    state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.ctx.lineCap = 'round';
    state.ctx.lineJoin = 'round';

    if (oldCanvas) {
      state.ctx.drawImage(
        oldCanvas,
        0,
        0,
        oldCanvas.width,
        oldCanvas.height,
        0,
        0,
        rect.width,
        rect.height
      );
    }
  }

  function installResizeHandler() {
    if (state.resizeHandler) {
      window.removeEventListener('resize', state.resizeHandler);
      window.removeEventListener('orientationchange', state.resizeHandler);
    }

    state.resizeHandler = () => {
      clearTimeout(state.resizeTimer);
      state.resizeTimer = setTimeout(() => {
        resizeCanvasPreserve(true);
      }, 120);
    };

    window.addEventListener('resize', state.resizeHandler, { passive: true });
    window.addEventListener('orientationchange', state.resizeHandler, { passive: true });
    state.pageHideHandler=()=>{state.isDrawing=false;state.pointerId=null;saveWork();};
    window.addEventListener('pagehide',state.pageHideHandler);
    window.addEventListener('blur',state.pageHideHandler);
  }

  function applyThemeBg() {
    const wrap = document.getElementById('azCanvasWrap');
    if (wrap) wrap.style.backgroundColor = THEMES[state.activeTheme]?.color || '#fff';
  }

  function bindEvents() {
    const root = state.container.querySelector('.az-root');
    root.querySelector('#azUndo').onclick=undoWork;
    root.querySelector('#azNewPaper').onclick=clearWork;

    root.querySelectorAll('.az-mode-tab').forEach((btn) => {
      btn.onclick = () => {
        root.querySelectorAll('.az-mode-tab').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        switchTab(btn.dataset.tab);
      };
    });

    root.querySelectorAll('[data-theme]').forEach((btn) => {
      btn.onclick = () => {
        state.activeTheme = btn.dataset.theme;
        root.querySelectorAll('[data-theme]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        applyThemeBg();
        saveWork();
        const themeName = THEMES[state.activeTheme].label.replace(/^[^\s]+ /, '');
        speak(themeName === '바다' ? '바다야!' : `${themeName}이야!`);
      };
    });

    root.querySelectorAll('[data-tpl]').forEach((btn) => {
      btn.onclick = () => {
        state.activeTemplateId = btn.dataset.tpl;
        state.coloringCompleted = false;
        root.querySelectorAll('[data-tpl]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const tpl = COLORING_TEMPLATES.find((t) => t.id === state.activeTemplateId);
        renderColoringTemplate(tpl);
        speakSelection('template',tpl?.id,`${tpl?.name || '그림'}! 같이 색칠해 볼까?`);
      };
    });

    root.querySelectorAll('.az-color-circle').forEach((btn) => {
      btn.onclick = () => {
        const color = btn.dataset.color;
        state.isRainbow = color === 'rainbow';

        if (!state.isRainbow) {
          state.currentColor = color;
        }

        state.mode = 'free';

        root.querySelectorAll('.az-color-circle').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        speakSelection('color',color,btn.dataset.name + '!');
        if (navigator.vibrate) navigator.vibrate(25);
      };
    });

    const canvas = state.canvas;
    canvas.style.touchAction = 'none';

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const drawStart = (e) => {
      if (state.tab !== 'free' || state.isDrawing || !state.freeCanvasReady || (e.isPrimary === false)) return;
      e.preventDefault();

      const pos = getPos(e);

      state.freeRestoreToken += 1;
      state.freeRestorePending = 0;
      state.isDrawing = true;
      state.pointerId=e.pointerId;state.lastPoint=pos;
      state.freeHistory.push(canvas.toDataURL('image/png'));state.freeHistory=state.freeHistory.slice(-12);
      state.ctx.globalCompositeOperation = 'source-over';
      state.ctx.beginPath();
      state.ctx.moveTo(pos.x, pos.y);
      state.ctx.fillStyle=state.isRainbow?`hsl(${state.hue},90%,60%)`:state.currentColor;
      state.ctx.arc(pos.x,pos.y,state.currentSize/2,0,Math.PI*2);state.ctx.fill();state.ctx.beginPath();state.ctx.moveTo(pos.x,pos.y);

      if (canvas.setPointerCapture) {
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
    };

    const drawMove = (e) => {
      if (!state.isDrawing || state.tab !== 'free' || e.pointerId!==state.pointerId) return;
      e.preventDefault();

      const pos = getPos(e);
      state.ctx.globalCompositeOperation = 'source-over';

      if (state.isRainbow) {
        state.hue = (state.hue + 5) % 360;
        state.ctx.strokeStyle = `hsl(${state.hue},90%,60%)`;
        if (Math.random() > 0.82) createMagicParticle(pos.x, pos.y, '✨');
      } else {
        state.ctx.strokeStyle = state.currentColor;
      }

      const pressure = e.pointerType === 'pen' && typeof e.pressure === 'number' && e.pressure > 0
        ? e.pressure
        : 1;

      state.ctx.lineWidth = state.currentSize * (0.8 + pressure * 0.4);
      state.ctx.beginPath();
      state.ctx.moveTo(state.lastPoint.x,state.lastPoint.y);
      state.ctx.lineTo(pos.x, pos.y);
      state.ctx.stroke();
      state.lastPoint=pos;
    };

    const drawEnd = (e) => {
      if (!state.isDrawing || e.pointerId!==state.pointerId) return;
      state.isDrawing = false;
      state.pointerId=null;
      saveWork();
      state.ctx.closePath();

      if (canvas.hasPointerCapture && canvas.hasPointerCapture(e.pointerId)) {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
    };

    canvas.addEventListener('pointerdown', drawStart);
    canvas.addEventListener('pointermove', drawMove);
    canvas.addEventListener('pointerup', drawEnd);
    canvas.addEventListener('pointercancel', drawEnd);
    canvas.addEventListener('lostpointercapture', drawEnd);
  }

  function switchTab(tab) {
    state.isDrawing=false;state.pointerId=null;
    state.tab = tab;
    saveWork();    state.mode = 'free';
    state.coloringCompleted = false;

    const isFree = tab === 'free';
    const root = state.container?.querySelector('.az-root');
    if (root) root.dataset.tab = tab;

    const canvas = document.getElementById('azCanvas');
    const coloringWrap = document.getElementById('azColoringWrap');

    if (canvas) canvas.style.display = isFree ? 'block' : 'none';
    if (coloringWrap) coloringWrap.style.display = isFree ? 'none' : 'flex';
    updateFreeRestoreNotice();

    state.container.querySelectorAll('.free-section').forEach((el) => {
      el.style.display = isFree ? '' : 'none';
    });

    state.container.querySelectorAll('.coloring-section').forEach((el) => {
      el.style.display = isFree ? 'none' : '';
    });

    state.container.querySelectorAll('.az-color-circle').forEach((b) => b.classList.remove('active'));
    const activeColor = state.container.querySelector(`.az-color-circle[data-color="${state.isRainbow ? 'rainbow' : state.currentColor}"]`);
    if (activeColor) activeColor.classList.add('active');

    if (!isFree) {
      const tpl = COLORING_TEMPLATES.find((t) => t.id === state.activeTemplateId);
      renderColoringTemplate(tpl);
      speak('어떤 그림을 색칠해볼까?');
    } else {
      requestAnimationFrame(() => resizeCanvasPreserve(true));
      speak('자유롭게 그려볼까?');
    }
  }

  function renderColoringTemplate(tpl) {
    if (!tpl) return;

    const wrap = document.getElementById('azColoringWrap');
    if (!wrap) return;

    const work=state.templateWork[tpl.id]||(state.templateWork[tpl.id]={svgVersion:templateVersion(tpl),fills:[],completed:false,history:[]});
    work.history=work.history||[];
    normalizeWork(tpl, work);
    state.paintHistory=work.history;
    state.coloringCompleted=work.completed;

    wrap.classList.remove('az-done');
    wrap.innerHTML = workSvg(tpl, work);
    if (wrap.dataset) wrap.dataset.svgVersion = String(work.svgVersion);

    const svg = wrap.querySelector('svg');
    if (svg) {
      // Normalize to the *visible drawing bounds*, not the template author's viewBox.
      // getBBox() ignores empty margins; padding reserves space for thick strokes.
      try {
        const box = svg.getBBox();
        if (box.width > 0 && box.height > 0 &&
            [box.x, box.y, box.width, box.height].every(Number.isFinite)) {
          const pad = Math.max(box.width, box.height) * 0.095 + 5;
          const cx = box.x + box.width / 2;
          const cy = box.y + box.height / 2;
          const width = box.width + pad * 2;
          const height = box.height + pad * 2;
          svg.setAttribute('viewBox', `${cx - width / 2} ${cy - height / 2} ${width} ${height}`);
        }
      } catch (_) { /* Keep the authored viewBox on unsupported browsers. */ }
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.style.cssText = 'width:100%;height:100%;max-width:94%;max-height:94%;overflow:hidden;display:block;';
    }

    wrap.querySelectorAll('.fillable').forEach((el,index) => {
      if(work.fills[index]) el.setAttribute('fill',work.fills[index]);
      else work.fills[index]=el.getAttribute('fill')||'#FFF';
      const applyFill = (clientX, clientY) => {
        const fillColor = state.isRainbow
          ? `hsl(${(state.hue = (state.hue + 35) % 360)},90%,55%)`
          : state.currentColor;

        const prev = el.getAttribute('fill');

        if (prev === fillColor) return;

        work.history.push({index,prev});
        el.setAttribute('fill', fillColor);
        work.fills[index]=fillColor;
        saveWork();

        burstSparkles(clientX, clientY);

        if (navigator.vibrate) navigator.vibrate(25);

        timer(() => {if(state.activeTemplateId===tpl.id)checkColoringComplete(tpl);}, 450);
      };

      el.addEventListener('pointerup', (e) => {
        e.preventDefault();
        if (state.isDrawing) return;
        applyFill(e.clientX, e.clientY);
      });
    });
  }

  function checkColoringComplete(tpl) {
    if (state.coloringCompleted || state.tab !== 'coloring') return;

    const wrap = document.getElementById('azColoringWrap');
    if (!wrap) return;

    const allAreas = Array.from(wrap.querySelectorAll('.fillable'));
    const svg = wrap.querySelector('svg');
    const whole = svg && svg.getBBox ? svg.getBBox() : { width: 1, height: 1 };
    const minArea = Math.max(60, whole.width * whole.height * 0.012);
    const major = allAreas.filter((el) => {
      try {
        const box = el.getBBox();
        return box.width * box.height >= minArea;
      } catch (_) { return true; }
    });
    const targets = major.length >= 3 ? major : allAreas;
    if (targets.length < 2) return;
    const colored = targets.filter((el) => {
      const fill = (el.getAttribute('fill') || '').toLowerCase();
      return fill !== '' && fill !== '#fff' && fill !== '#ffffff' && fill !== 'white' && fill !== 'none';
    }).length;
    // At least three meaningful taps (or all when fewer), with 75% coverage.
    const needed = Math.max(Math.min(3, targets.length), Math.ceil(targets.length * .75));
    if (colored < needed) return;

    state.coloringCompleted = true;
    state.templateWork[tpl.id].completed=true;
    saveWork();    wrap.classList.add('az-done');

    if(window.SihyeonPlaySettings?.getLanguage?.()==='en') {
      const english=window.SihyeonVoiceLabels?.spoken?.('template',tpl.id,'en');
      if(english) window.SihyeonVoice?.speak?.('Great job! You colored the '+english+'!',{lang:'en-US',rate:.9})?.catch?.(()=>{});
    } else speak(`우와. ${tpl.name} 완성. 시현이 참 잘했어.`, true);
    state.options.fireConfetti?.();
    state.options.gainExp?.(20);

    timer(() => {
      wrap.classList.remove('az-done');
    }, 1300);
  }

  function burstSparkles(clientX, clientY) {
    const wrap = document.getElementById('azCanvasWrap');
    if (!wrap) return;

    const rect = wrap.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const chars = ['⭐', '✨', '💫', '🌟', '⭐'];
    const count = 4 + Math.floor(Math.random() * 2);

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const angle = (i / count) * 2 * Math.PI;
      const dist = 50 + Math.random() * 28;

      el.className = 'az-sparkle';
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
    el.className = 'az-particle';
    el.textContent = char || '✨';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    wrap.appendChild(el);
    timer(() => el.remove(), 820);
  }

  function speakSelection(kind,id,fallback) {
    const labels=window.SihyeonVoiceLabels;
    const voice=window.SihyeonVoice;
    if(labels?.entry?.(kind,id) && typeof voice?.speak==='function'){
      state.speechToken += 1;
      labels.say(kind,id)?.catch?.(()=>{});
      return;
    }
    if(fallback) speak(fallback);
  }

  function speak(msg, force = false) {
    if (!msg || state.destroyed) return;
    const voiceIds = {
      '시현아. 마법 그림판이야. 같이 그리고 색칠해볼까?': 'games.paint.intro',
      '빈칸이야!': 'games.paint.blank',
      '하늘이야!': 'games.paint.sky',
      '바다이야!': 'games.paint.sea',
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
      '어떤 그림을 색칠해볼까?': 'games.paint.choose',
      '자유롭게 그려볼까?': 'games.paint.free',
    };

    // All 16 palette names and all 15 template names now speak, not only the
    // old pre-recorded subset. Cancel pending audio as the child taps again.
    const token = ++state.speechToken;
    const voice = window.SihyeonVoice;
    if (voice && typeof voice.stop === 'function') voice.stop();
    // These legacy clips contain unrelated praise, so mode prompts use the
    // shared language-aware TTS path below in Korean; English keeps its mapping.
    const isKoreanModePrompt = window.SihyeonPlaySettings?.getLanguage?.() !== 'en' &&
      (msg === '어떤 그림을 색칠해볼까?' || msg === '자유롭게 그려볼까?');
    if (!isKoreanModePrompt && voice && typeof voice.play === 'function' && voiceIds[msg]) {
      voice.play(voiceIds[msg], msg, {
        allowTtsFallback: true,
        shouldPlay: () => !state.destroyed && state.speechToken === token,
      }).catch(() => {});
      return;
    }
    if (voice && typeof voice.speak === 'function') {
      // Synchronous within the tap gesture so Android permits TTS playback.
      voice.speak(msg, { lang: 'ko-KR', rate: 0.93, pitch: 1.06 }).catch(() => {});
      return;
    }
    if (typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance === 'function') {
      const utterance = new window.SpeechSynthesisUtterance(msg);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.93;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }

  function destroy(clearDom = true) {
    state.freeRestoreToken += 1;
    if(state.container&&!state.destroyed)saveWork();
    state.freeRestorePending = 0;
    state.freeCanvasReady = false;
    state.isDrawing=false;state.pointerId=null;
    if(state.pageHideHandler){window.removeEventListener('pagehide',state.pageHideHandler);window.removeEventListener('blur',state.pageHideHandler);state.pageHideHandler=null;}
    clearTimers();

    if (state.resizeTimer) {
      clearTimeout(state.resizeTimer);
      state.resizeTimer = null;
    }

    if (state.resizeHandler) {
      window.removeEventListener('resize', state.resizeHandler);
      window.removeEventListener('orientationchange', state.resizeHandler);
      state.resizeHandler = null;
    }

    state.speechToken += 1;
    if (window.SihyeonVoice && typeof window.SihyeonVoice.stop === 'function') {
      window.SihyeonVoice.stop();
    } else if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }

    if (clearDom && state.container) {
      state.container.innerHTML = '';
    }

    state.destroyed = true;
  }

  window.SihyeonGames = window.SihyeonGames || {};
  window.SihyeonGames[GAME_KEY] = { render, destroy };
})();
