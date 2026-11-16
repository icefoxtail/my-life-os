/**
 * 시현이 놀이터 OS — 매직 그림판 v4.6.0
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
      id: 'police_swat_suv',
      name: '경찰 특공대 SUV',
      emoji: '🚙',
      version: 1,
      parts: {
        light_red: { ko: '빨간 경광등', en: 'red siren light', color: '#FF4444' },
        light_blue: { ko: '파란 경광등', en: 'blue siren light', color: '#4488FF' },
        body: { ko: '튼튼한 차체', en: 'SUV body', color: '#1E40AF' },
        window_rear: { ko: '뒷창문', en: 'back window', color: '#8EF6D1' },
        window_front: { ko: '앞창문', en: 'front window', color: '#8EF6D1' },
        side_panel: { ko: '옆 보호판', en: 'side panel', color: '#C0C0C0' },
        badge: { ko: '경찰 배지', en: 'police badge', color: '#FFD700' },
        headlight: { ko: '헤드라이트', en: 'headlight', color: '#FFD700' },
        spare_wheel: { ko: '예비 바퀴', en: 'spare wheel', color: '#1A1A1A' },
        guard_front: { ko: '앞 보호대', en: 'front bumper guard', color: '#C0C0C0' },
        tire_rear: { ko: '뒷바퀴', en: 'back wheel', color: '#1A1A1A' },
        tire_front: { ko: '앞바퀴', en: 'front wheel', color: '#1A1A1A' },
        hub_rear: { ko: '뒷바퀴 휠', en: 'back hubcap', color: '#C0C0C0' },
        hub_front: { ko: '앞바퀴 휠', en: 'front hubcap', color: '#C0C0C0' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" data-part="light_red" x="94" y="22" width="24" height="16" rx="5" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="light_blue" x="120" y="22" width="24" height="16" rx="5" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="body" d="M 40 136 Q 30 136 30 126 V 54 Q 30 42 42 42 H 146 Q 156 42 161 52 L 177 82 L 208 88 Q 220 90 220 102 V 124 Q 220 136 209 136 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" data-part="window_rear" x="44" y="55" width="47" height="31" rx="5" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="window_front" d="M 104 86 V 55 H 143 Q 148 55 151 61 L 164 86 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="side_panel" d="M 31 97 H 190 V 122 H 31 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="badge" d="M 120 95 Q 134 89 148 95 V 109 Q 148 121 134 127 Q 120 121 120 109 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="headlight" d="M 199 90 H 210 Q 219 90 219 100 V 108 H 199 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="spare_wheel" x="16" y="90" width="25" height="40" rx="9" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" data-part="guard_front" x="208" y="111" width="16" height="24" rx="4" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="tire_rear" cx="67" cy="137" r="23" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="tire_front" cx="178" cy="137" r="23" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="hub_rear" cx="67" cy="137" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="hub_front" cx="178" cy="137" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <path d="M 42 37 H 154 M 48 37 V 42 M 84 37 V 42 M 150 37 V 42"/>
          <path d="M 98 48 V 94 M 99 124 V 132 M 109 93 H 118 M 158 93 H 166 M 94 132 H 150"/>
          <path d="M 202 116 H 207 M 202 122 H 207 M 202 128 H 207 M 25 99 V 121 M 33 99 V 121"/>
          <path d="M 134 99 L 137 105 L 143 106 L 138 111 L 139 117 L 134 114 L 129 117 L 130 111 L 125 106 L 131 105 Z" fill="#333" stroke="none"/>
        </g>
      </svg>`,
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
      version: 2,
      parts: {
        boom: { ko: '긴 팔', en: 'boom', color: '#FFD700' },
        stick: { ko: '짧은 팔', en: 'stick', color: '#FF9900' },
        bucket: { ko: '삽', en: 'bucket', color: '#C0C0C0' },
        track: { ko: '무한궤도', en: 'track', color: '#1A1A1A' },
        body: { ko: '몸체', en: 'body', color: '#FFD700' },
        cab: { ko: '운전실', en: 'cab', color: '#FFD700' },
        window: { ko: '창문', en: 'window', color: '#8EF6D1' },
        wheel_rear: { ko: '뒷바퀴', en: 'rear wheel', color: '#C0C0C0' },
        wheel_front: { ko: '앞바퀴', en: 'front wheel', color: '#C0C0C0' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
  <path class="fillable" data-part="boom" d="M 112 104 L 146 48 Q 150 40 158 44 L 168 50 Q 175 55 171 62 L 138 116 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
  <path class="fillable" data-part="stick" d="M 156 44 L 176 52 L 202 108 L 184 116 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
  <path class="fillable" data-part="bucket" d="M 182 104 L 214 98 Q 224 116 206 134 L 188 134 Q 178 120 182 104 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
  <rect class="fillable" data-part="track" x="22" y="130" width="130" height="30" rx="15" stroke="#333" stroke-width="4" fill="#FFF"/>
  <rect class="fillable" data-part="body" x="26" y="92" width="100" height="40" rx="9" stroke="#333" stroke-width="4" fill="#FFF"/>
  <path class="fillable" data-part="cab" d="M 62 94 V 56 Q 62 50 68 50 H 106 Q 112 50 112 56 V 94 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
  <rect class="fillable" data-part="window" x="71" y="59" width="32" height="26" rx="6" stroke="#333" stroke-width="3" fill="#FFF"/>
  <circle class="fillable" data-part="wheel_rear" cx="44" cy="145" r="9" stroke="#333" stroke-width="3" fill="#FFF"/>
  <circle class="fillable" data-part="wheel_front" cx="130" cy="145" r="9" stroke="#333" stroke-width="3" fill="#FFF"/>
  <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
    <path d="M 62 145 H 112"/>
    <path d="M 34 106 H 52"/>
    <path d="M 192 134 V 140 M 200 134 V 140 M 208 134 V 138"/>
    <path d="M 125 88 L 150 76"/>
  </g>
</svg>`,
      legacy: {
        1: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
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
    },
    {
      id: 'dump_truck',
      name: '덤프트럭',
      emoji: '🚛',
      version: 2,
      parts: {
        chassis: { ko: '아래 틀', en: 'chassis', color: '#C0C0C0' },
        bed: { ko: '짐칸', en: 'dump bed', color: '#FF9900' },
        cab: { ko: '운전석', en: 'cab', color: '#FFD700' },
        window: { ko: '창문', en: 'window', color: '#8EF6D1' },
        headlight: { ko: '헤드라이트', en: 'headlight', color: '#FFF8E7' },
        tire_rear: { ko: '뒷바퀴', en: 'back wheel', color: '#1A1A1A' },
        tire_front: { ko: '앞바퀴', en: 'front wheel', color: '#1A1A1A' },
        hub_rear: { ko: '뒷바퀴 휠', en: 'back hubcap', color: '#C0C0C0' },
        hub_front: { ko: '앞바퀴 휠', en: 'front hubcap', color: '#C0C0C0' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
  <rect class="fillable" data-part="chassis" x="18" y="118" width="204" height="18" rx="8" stroke="#333" stroke-width="4" fill="#FFF"/>
  <path class="fillable" data-part="bed" d="M 36 118 L 16 62 Q 14 54 22 54 H 148 Q 156 54 152 61 L 134 70 V 118 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
  <path class="fillable" data-part="cab" d="M 136 118 V 74 Q 136 66 144 66 H 172 Q 180 66 185 73 L 202 96 Q 206 102 213 102 H 216 Q 222 104 222 110 V 118 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
  <path class="fillable" data-part="window" d="M 146 76 H 170 L 184 96 H 146 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
  <rect class="fillable" data-part="headlight" x="201" y="102" width="20" height="16" rx="4" stroke="#333" stroke-width="3" fill="#FFF"/>
  <circle class="fillable" data-part="tire_rear" cx="64" cy="139" r="21" stroke="#333" stroke-width="4" fill="#FFF"/>
  <circle class="fillable" data-part="tire_front" cx="176" cy="139" r="21" stroke="#333" stroke-width="4" fill="#FFF"/>
  <circle class="fillable" data-part="hub_rear" cx="64" cy="139" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
  <circle class="fillable" data-part="hub_front" cx="176" cy="139" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
  <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
    <path d="M 50 66 L 58 108 M 80 66 V 108 M 108 66 V 108"/>
    <path d="M 22 64 H 132"/>
    <circle cx="38" cy="112" r="3" fill="#333" stroke="none"/>
    <path d="M 160 98 H 170"/>
  </g>
</svg>`,
      legacy: {
        1: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
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
    },
    {
      id: 'bulldozer',
      name: '불도저',
      emoji: '🚜',
      version: 2,
      parts: {
        push_arm: { ko: '미는 팔', en: 'push arm', color: '#C0C0C0' },
        blade: { ko: '큰 삽날', en: 'blade', color: '#FF9900' },
        body: { ko: '몸체', en: 'body', color: '#FFD700' },
        engine: { ko: '엔진 덮개', en: 'engine hood', color: '#FFD700' },
        cab: { ko: '운전실', en: 'cab', color: '#FFD700' },
        window: { ko: '창문', en: 'window', color: '#8EF6D1' },
        track: { ko: '무한궤도', en: 'track', color: '#1A1A1A' },
        wheel_rear: { ko: '뒷바퀴', en: 'rear wheel', color: '#C0C0C0' },
        wheel_front: { ko: '앞바퀴', en: 'front wheel', color: '#C0C0C0' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
  <rect class="fillable" data-part="push_arm" x="150" y="100" width="48" height="22" rx="6" stroke="#333" stroke-width="3" fill="#FFF"/>
  <path class="fillable" data-part="blade" d="M 212 54 Q 222 52 222 60 Q 202 104 222 144 Q 222 152 212 152 Q 178 104 212 54 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
  <rect class="fillable" data-part="body" x="42" y="88" width="122" height="36" rx="10" stroke="#333" stroke-width="4" fill="#FFF"/>
  <rect class="fillable" data-part="engine" x="112" y="62" width="50" height="32" rx="9" stroke="#333" stroke-width="4" fill="#FFF"/>
  <path class="fillable" data-part="cab" d="M 54 90 V 36 Q 54 30 60 30 H 100 Q 106 30 106 36 V 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
  <rect class="fillable" data-part="window" x="63" y="40" width="34" height="30" rx="6" stroke="#333" stroke-width="3" fill="#FFF"/>
  <rect class="fillable" data-part="track" x="30" y="116" width="140" height="44" rx="22" stroke="#333" stroke-width="4" fill="#FFF"/>
  <circle class="fillable" data-part="wheel_rear" cx="58" cy="138" r="12" stroke="#333" stroke-width="3" fill="#FFF"/>
  <circle class="fillable" data-part="wheel_front" cx="142" cy="138" r="12" stroke="#333" stroke-width="3" fill="#FFF"/>
  <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
    <path d="M 84 138 H 116"/>
    <path d="M 206 66 L 212 62"/>
    <path d="M 124 76 H 148 M 124 84 H 148"/>
    <path d="M 72 78 H 92"/>
  </g>
</svg>`,
      legacy: {
        1: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
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
    },
    {
      id: 'rocket',
      name: '우주 로켓',
      emoji: '🚀',
      version: 2,
      parts: {
        fin_left: { ko: '왼쪽 날개', en: 'left fin', color: '#FF4444' },
        fin_right: { ko: '오른쪽 날개', en: 'right fin', color: '#FF4444' },
        body: { ko: '로켓 몸통', en: 'rocket body', color: '#FFF8E7' },
        nose: { ko: '뾰족한 머리', en: 'nose cone', color: '#FF4444' },
        window: { ko: '동그란 창문', en: 'round window', color: '#8EF6D1' },
        stripe: { ko: '줄무늬', en: 'stripe', color: '#4488FF' },
        nozzle: { ko: '분사구', en: 'nozzle', color: '#C0C0C0' },
        flame: { ko: '불꽃', en: 'flame', color: '#FF9900' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
  <path class="fillable" data-part="fin_left" d="M 92 90 L 58 126 Q 50 134 56 142 L 92 138 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
  <path class="fillable" data-part="fin_right" d="M 148 90 L 182 126 Q 190 134 184 142 L 148 138 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
  <path class="fillable" data-part="flame" d="M 106 138 Q 98 152 120 162 Q 142 152 134 138 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
  <rect class="fillable" data-part="nozzle" x="104" y="126" width="32" height="14" rx="5" stroke="#333" stroke-width="3" fill="#FFF"/>
  <path class="fillable" data-part="body" d="M 90 66 H 150 V 126 Q 150 134 142 134 H 98 Q 90 134 90 126 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
  <path class="fillable" data-part="nose" d="M 120 18 Q 146 34 150 68 H 90 Q 94 34 120 18 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
  <rect class="fillable" data-part="stripe" x="90" y="108" width="60" height="16" stroke="#333" stroke-width="3" fill="#FFF"/>
  <circle class="fillable" data-part="window" cx="120" cy="88" r="15" stroke="#333" stroke-width="3" fill="#FFF"/>
  <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
    <path d="M 113 84 Q 115 80 119 79"/>
    <path d="M 108 44 Q 112 36 118 33"/>
  </g>
</svg>`,
      legacy: {
        1: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
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
    },
    {
      id: 'dino',
      name: '공룡',
      emoji: '🦕',
      version: 2,
      parts: {
        plate_1: { ko: '등판 1', en: 'back plate 1', color: '#FF9900' },
        plate_2: { ko: '등판 2', en: 'back plate 2', color: '#FFD700' },
        plate_3: { ko: '등판 3', en: 'back plate 3', color: '#FF9900' },
        plate_4: { ko: '등판 4', en: 'back plate 4', color: '#FFD700' },
        tail: { ko: '꼬리', en: 'tail', color: '#7ED957' },
        leg_rear: { ko: '뒷다리', en: 'back leg', color: '#7ED957' },
        leg_front: { ko: '앞다리', en: 'front leg', color: '#7ED957' },
        body: { ko: '몸통', en: 'body', color: '#7ED957' },
        belly: { ko: '배', en: 'belly', color: '#F6E7C8' },
        head: { ko: '얼굴', en: 'head', color: '#7ED957' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" data-part="plate_1" d="M 68 84 Q 68 62 80 56 Q 92 62 92 84 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="plate_2" d="M 93 78 Q 93 54 105 46 Q 117 54 117 78 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="plate_3" d="M 118 78 Q 118 54 130 46 Q 142 54 142 78 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="plate_4" d="M 143 82 Q 143 62 155 56 Q 167 62 167 84 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="tail" d="M 72 88 Q 42 96 16 68 Q 18 114 48 122 Q 62 126 76 124 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" data-part="leg_rear" x="78" y="118" width="30" height="42" rx="13" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" data-part="leg_front" x="140" y="118" width="30" height="42" rx="13" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="body" d="M 62 108 Q 62 70 118 68 Q 178 68 182 105 Q 182 138 120 140 Q 62 142 62 108 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="belly" d="M 92 118 Q 122 110 156 118 Q 150 133 123 134 Q 98 134 92 118 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="head" d="M 164 86 Q 164 60 192 60 Q 220 60 220 86 Q 220 112 192 112 Q 164 112 164 86 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <circle cx="198" cy="80" r="5.5" fill="#333" stroke="none"/>
          <circle cx="200" cy="78" r="1.8" fill="#FFF" stroke="none"/>
          <circle cx="212" cy="92" r="1.8" fill="#333" stroke="none"/>
          <path d="M 194 98 Q 203 105 212 99"/>
          <circle cx="180" cy="97" r="5" stroke-width="2"/>
          <circle cx="88" cy="92" r="4" stroke-width="2"/>
          <circle cx="108" cy="86" r="3" stroke-width="2"/>
          <circle cx="132" cy="90" r="4" stroke-width="2"/>
          <path d="M 88 154 V 160 M 99 154 V 160 M 150 154 V 160 M 161 154 V 160"/>
        </g>
      </svg>`,
      legacy: {
        1: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
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
    },
    {
      id: 'train',
      name: '칙칙폭폭 기차',
      emoji: '🚂',
      version: 2,
      parts: {
        smoke: { ko: '연기', en: 'smoke', color: '#C0C0C0' },
        chimney: { ko: '굴뚝', en: 'chimney', color: '#1A1A1A' },
        dome: { ko: '동그란 뚜껑', en: 'steam dome', color: '#FFD700' },
        boiler: { ko: '기관차 몸통', en: 'boiler', color: '#FF4444' },
        frame: { ko: '아래 틀', en: 'frame', color: '#1A1A1A' },
        cab: { ko: '운전실', en: 'cab', color: '#FF4444' },
        roof: { ko: '지붕', en: 'roof', color: '#1E40AF' },
        window: { ko: '창문', en: 'window', color: '#8EF6D1' },
        lamp: { ko: '앞 등', en: 'headlamp', color: '#FFD700' },
        wheel_big: { ko: '큰 바퀴', en: 'big wheel', color: '#1A1A1A' },
        wheel_mid: { ko: '가운데 바퀴', en: 'middle wheel', color: '#1A1A1A' },
        wheel_small: { ko: '작은 바퀴', en: 'small wheel', color: '#1A1A1A' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
  <circle class="fillable" data-part="smoke" cx="166" cy="26" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
  <path class="fillable" data-part="chimney" d="M 154 74 V 56 L 146 42 H 182 L 174 56 V 74 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
  <path class="fillable" data-part="dome" d="M 106 74 Q 106 52 122 52 Q 138 52 138 74 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
  <rect class="fillable" data-part="boiler" x="70" y="70" width="130" height="52" rx="16" stroke="#333" stroke-width="4" fill="#FFF"/>
  <rect class="fillable" data-part="frame" x="18" y="118" width="186" height="14" rx="6" stroke="#333" stroke-width="3" fill="#FFF"/>
  <rect class="fillable" data-part="cab" x="24" y="48" width="64" height="80" rx="6" stroke="#333" stroke-width="4" fill="#FFF"/>
  <rect class="fillable" data-part="roof" x="16" y="34" width="80" height="18" rx="9" stroke="#333" stroke-width="4" fill="#FFF"/>
  <rect class="fillable" data-part="window" x="36" y="62" width="40" height="30" rx="7" stroke="#333" stroke-width="3" fill="#FFF"/>
  <circle class="fillable" data-part="lamp" cx="180" cy="92" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
  <circle class="fillable" data-part="wheel_big" cx="54" cy="138" r="22" stroke="#333" stroke-width="4" fill="#FFF"/>
  <circle class="fillable" data-part="wheel_mid" cx="108" cy="141" r="19" stroke="#333" stroke-width="4" fill="#FFF"/>
  <circle class="fillable" data-part="wheel_small" cx="160" cy="145" r="15" stroke="#333" stroke-width="4" fill="#FFF"/>
  <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
    <circle cx="54" cy="138" r="7"/><circle cx="108" cy="141" r="6"/><circle cx="160" cy="145" r="5"/>
    <path d="M 54 138 L 108 141"/>
    <path d="M 146 80 V 112 M 96 100 H 128"/>
    <path d="M 194 124 L 212 132 V 140 H 196"/>
  </g>
</svg>`,
      legacy: {
        1: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
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
    },
    {
      id: 'airplane',
      name: '비행기',
      emoji: '✈️',
      version: 2,
      parts: {
        tail: { ko: '꼬리 날개', en: 'tail fin', color: '#FF4444' },
        wing_far: { ko: '뒤쪽 날개', en: 'far wing', color: '#4488FF' },
        fuselage: { ko: '비행기 몸통', en: 'fuselage', color: '#FFF8E7' },
        nose: { ko: '뾰족한 코', en: 'nose', color: '#FF4444' },
        cockpit: { ko: '조종석 창문', en: 'cockpit window', color: '#8EF6D1' },
        window_1: { ko: '창문 1', en: 'window 1', color: '#8EF6D1' },
        window_2: { ko: '창문 2', en: 'window 2', color: '#8EF6D1' },
        window_3: { ko: '창문 3', en: 'window 3', color: '#8EF6D1' },
        wing: { ko: '큰 날개', en: 'wing', color: '#4488FF' },
        engine: { ko: '엔진', en: 'engine', color: '#C0C0C0' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
  <path class="fillable" data-part="tail" d="M 36 80 L 24 40 Q 22 32 30 32 H 44 Q 50 32 54 38 L 82 80 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
  <path class="fillable" data-part="wing_far" d="M 116 74 L 92 36 Q 90 30 97 30 H 106 Q 112 31 115 36 L 146 74 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
  <path class="fillable" data-part="fuselage" d="M 22 94 Q 22 74 44 72 H 182 Q 220 74 220 94 Q 220 114 182 116 H 44 Q 22 114 22 94 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
  <path class="fillable" data-part="nose" d="M 188 73 Q 220 76 220 94 Q 220 112 188 115 Q 198 94 188 73 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
  <path class="fillable" data-part="cockpit" d="M 158 80 H 176 Q 182 80 184 86 L 186 92 H 158 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
  <circle class="fillable" data-part="window_1" cx="64" cy="92" r="9" stroke="#333" stroke-width="3" fill="#FFF"/>
  <circle class="fillable" data-part="window_2" cx="92" cy="92" r="9" stroke="#333" stroke-width="3" fill="#FFF"/>
  <circle class="fillable" data-part="window_3" cx="120" cy="92" r="9" stroke="#333" stroke-width="3" fill="#FFF"/>
  <path class="fillable" data-part="wing" d="M 100 102 H 146 L 114 148 Q 110 156 102 156 H 94 Q 88 154 92 146 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
  <rect class="fillable" data-part="engine" x="112" y="124" width="36" height="18" rx="9" stroke="#333" stroke-width="3" fill="#FFF"/>
  <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
    <path d="M 140 94 H 150"/>
    <path d="M 32 104 H 54"/>
    <path d="M 126 148 H 140"/>
  </g>
</svg>`,
      legacy: {
        1: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
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
    },
    {
      id: 'lion',
      name: '어흥 사자',
      emoji: '🦁',
      version: 2,
      parts: {
        mane: { ko: '갈기', en: 'mane', color: '#FF9900' },
        ear_left: { ko: '왼쪽 귀', en: 'left ear', color: '#FFD700' },
        ear_right: { ko: '오른쪽 귀', en: 'right ear', color: '#FFD700' },
        face: { ko: '얼굴', en: 'face', color: '#FFD700' },
        tuft: { ko: '앞머리', en: 'forelock', color: '#FF9900' },
        muzzle: { ko: '주둥이', en: 'muzzle', color: '#FFF8E7' },
        nose: { ko: '코', en: 'nose', color: '#8B5A2B' },
        cheek_left: { ko: '왼쪽 볼', en: 'left cheek', color: '#FF88CC' },
        cheek_right: { ko: '오른쪽 볼', en: 'right cheek', color: '#FF88CC' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" data-part="mane" d="M 120.0 30.0 Q 138.7 10.1 146.9 36.1 Q 172.4 26.3 168.5 53.3 Q 195.7 55.6 180.4 78.2 Q 204.0 92.0 180.4 105.8 Q 195.7 128.4 168.5 130.7 Q 172.4 157.7 146.9 147.9 Q 138.7 173.9 120.0 154.0 Q 101.3 173.9 93.1 147.9 Q 67.6 157.7 71.5 130.7 Q 44.3 128.4 59.6 105.8 Q 36.0 92.0 59.6 78.2 Q 44.3 55.6 71.5 53.3 Q 67.6 26.3 93.1 36.1 Q 101.3 10.1 120.0 30.0 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="ear_left" cx="87" cy="56" r="15" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="ear_right" cx="153" cy="56" r="15" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="face" cx="120" cy="96" r="46" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="tuft" d="M 100 56 Q 110 40 120 54 Q 130 40 140 56 Q 120 66 100 56 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <ellipse class="fillable" data-part="muzzle" cx="120" cy="114" rx="27" ry="20" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="nose" d="M 109 97 Q 120 92 131 97 Q 129 108 120 111 Q 111 108 109 97 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="cheek_left" cx="82" cy="108" r="10" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="cheek_right" cx="158" cy="108" r="10" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <circle cx="100" cy="84" r="5.5" fill="#333" stroke="none"/>
          <circle cx="140" cy="84" r="5.5" fill="#333" stroke="none"/>
          <circle cx="102" cy="82" r="1.8" fill="#FFF" stroke="none"/>
          <circle cx="142" cy="82" r="1.8" fill="#FFF" stroke="none"/>
          <path d="M 120 111 V 118 M 108 122 Q 114 128 120 118 Q 126 128 132 122"/>
          <path d="M 83 54 Q 87 50 91 54 M 149 54 Q 153 50 157 54"/>
        </g>
      </svg>`,
      legacy: {
        1: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
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
    },
    {
      id: 'whale',
      name: '고래',
      emoji: '🐳',
      version: 2,
      parts: {
        spout: { ko: '물줄기', en: 'water spout', color: '#8EF6D1' },
        tail: { ko: '꼬리', en: 'tail fin', color: '#4488FF' },
        body: { ko: '몸통', en: 'body', color: '#4488FF' },
        belly: { ko: '하얀 배', en: 'belly', color: '#FFF8E7' },
        fin: { ko: '지느러미', en: 'flipper', color: '#1E40AF' },
        cheek: { ko: '볼', en: 'cheek', color: '#FF88CC' },
        wave: { ko: '바다 물결', en: 'sea waves', color: '#8EF6D1' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" data-part="spout" d="M 143 56 Q 146 44 138 36 Q 128 38 124 28 Q 138 22 146 30 Q 142 16 152 12 Q 162 16 158 30 Q 166 22 180 28 Q 176 38 166 36 Q 158 44 161 56 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="tail" d="M 54 112 Q 44 92 34 78 Q 20 80 12 62 Q 28 52 34 64 Q 36 48 52 44 Q 54 62 62 78 Q 68 96 66 116 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="body" d="M 40 104 Q 40 58 108 56 Q 174 56 198 96 Q 206 122 182 134 Q 150 148 100 146 Q 40 144 40 104 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="belly" d="M 122 128 Q 160 118 194 108 Q 198 124 180 132 Q 152 144 128 141 Q 118 136 122 128 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="fin" d="M 78 98 Q 98 94 106 108 Q 104 124 86 122 Q 74 112 78 98 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="cheek" cx="168" cy="100" r="10" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="wave" d="M 16 150 Q 30 140 44 150 Q 58 160 72 150 Q 86 140 100 150 Q 114 160 128 150 Q 142 140 156 150 Q 170 160 184 150 Q 198 140 212 150 Q 220 156 224 152 V 162 Q 220 166 212 162 H 28 Q 16 160 16 150 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <circle cx="170" cy="82" r="5.5" fill="#333" stroke="none"/>
          <circle cx="172" cy="80" r="1.8" fill="#FFF" stroke="none"/>
          <path d="M 176 114 Q 186 119 196 112"/>
          <path d="M 108 56 Q 120 50 134 54"/>
        </g>
      </svg>`,
      legacy: {
        1: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
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
    },
    {
      id: 'icecream',
      name: '아이스크림',
      emoji: '🍦',
      version: 2,
      parts: {
        cone: { ko: '와플 콘', en: 'waffle cone', color: '#F6E7C8' },
        rim: { ko: '콘 테두리', en: 'cone rim', color: '#8B5A2B' },
        wafer: { ko: '과자 막대', en: 'wafer stick', color: '#F6E7C8' },
        scoop_1: { ko: '아래 아이스크림', en: 'bottom scoop', color: '#FF88CC' },
        scoop_2: { ko: '위 아이스크림', en: 'top scoop', color: '#FFF8E7' },
        cherry: { ko: '체리', en: 'cherry', color: '#FF4444' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" data-part="cone" d="M 88 124 L 114 162 Q 120 171 126 162 L 152 124 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" data-part="rim" x="80" y="106" width="80" height="22" rx="9" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="wafer" d="M 146 70 L 158 32 Q 160 25 167 27 Q 174 29 172 36 L 161 74 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="scoop_1" d="M 80 98 Q 74 62 120 60 Q 166 62 160 98 Q 164 108 154 106 Q 148 116 140 106 Q 132 112 126 106 Q 118 114 110 106 Q 102 112 96 106 Q 86 110 80 98 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="scoop_2" cx="120" cy="52" r="25" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="cherry" cx="120" cy="22" r="10" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <path d="M 122 12 Q 124 6 133 5"/>
          <path d="M 100 134 L 112 152 M 112 132 L 121 146 M 140 134 L 128 152 M 128 132 L 119 146"/>
          <circle cx="105" cy="88" r="4.5" fill="#333" stroke="none"/>
          <circle cx="135" cy="88" r="4.5" fill="#333" stroke="none"/>
          <path d="M 113 94 Q 120 100 127 94"/>
          <path d="M 108 44 Q 112 38 119 38"/>
        </g>
      </svg>`,
      legacy: {
        1: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
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
    },
    {
      id: 'police_motorcycle',
      name: '경찰 오토바이',
      emoji: '🏍️',
      version: 1,
      parts: {
        light_red: { ko: '빨간 경광등', en: 'red siren light', color: '#FF4444' },
        light_blue: { ko: '파란 경광등', en: 'blue siren light', color: '#4488FF' },
        body: { ko: '몸체', en: 'body', color: '#FFF8E7' },
        stripe: { ko: '경찰 줄무늬', en: 'police stripe', color: '#1E40AF' },
        seat: { ko: '안장', en: 'seat', color: '#1A1A1A' },
        fairing: { ko: '앞 덮개', en: 'front cover', color: '#FFF8E7' },
        windshield: { ko: '바람막이', en: 'windshield', color: '#8EF6D1' },
        headlight: { ko: '헤드라이트', en: 'headlight', color: '#FFD700' },
        tire_rear: { ko: '뒷바퀴', en: 'back wheel', color: '#1A1A1A' },
        tire_front: { ko: '앞바퀴', en: 'front wheel', color: '#1A1A1A' },
        hub_rear: { ko: '뒷바퀴 휠', en: 'back hubcap', color: '#C0C0C0' },
        hub_front: { ko: '앞바퀴 휠', en: 'front hubcap', color: '#C0C0C0' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="4" fill="none">
          <path d="M 58 86 V 66"/>
        </g>
        <rect class="fillable" data-part="light_red" x="32" y="46" width="26" height="20" rx="8" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="light_blue" x="58" y="46" width="26" height="20" rx="8" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="body" d="M 60 116 Q 46 116 48 102 L 52 92 Q 55 86 64 86 H 100 Q 110 68 132 68 H 148 Q 162 68 166 82 L 170 102 Q 172 116 158 116 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="stripe" d="M 50 96 H 168 L 170 110 H 48 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="seat" d="M 56 86 Q 56 72 72 72 H 98 Q 108 72 106 80 L 102 86 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="fairing" d="M 158 74 Q 176 62 192 72 Q 202 80 200 94 Q 198 104 186 106 L 170 106 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="windshield" d="M 166 70 L 174 40 Q 177 33 184 36 Q 190 39 190 46 L 188 70 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="headlight" cx="202" cy="86" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="tire_rear" cx="64" cy="130" r="26" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="tire_front" cx="184" cy="130" r="26" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="hub_rear" cx="64" cy="130" r="12" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="hub_front" cx="184" cy="130" r="12" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <path d="M 180 104 L 184 130" stroke-width="6"/>
          <path d="M 76 116 L 64 130" stroke-width="5"/>
          <path d="M 166 62 L 154 56 M 150 54 L 156 58"/>
          <path d="M 96 120 H 122 Q 128 120 128 126 H 100"/>
          <path d="M 184 82 L 186 86 L 190 86 L 187 89 L 188 93 L 184 91 L 180 93 L 181 89 L 178 86 L 182 86 Z" fill="#333" stroke="none"/>
        </g>
      </svg>`,
    },
    {
      id: 'police_helicopter',
      name: '경찰 헬기',
      emoji: '🚁',
      version: 1,
      parts: {
        rotor: { ko: '프로펠러', en: 'main rotor', color: '#C0C0C0' },
        engine: { ko: '엔진 덮개', en: 'engine cover', color: '#1E40AF' },
        light: { ko: '경광등', en: 'siren light', color: '#FF4444' },
        fin: { ko: '꼬리 날개', en: 'tail fin', color: '#1E40AF' },
        tail: { ko: '꼬리', en: 'tail boom', color: '#FFF8E7' },
        tail_rotor: { ko: '꼬리 프로펠러', en: 'tail rotor', color: '#C0C0C0' },
        cabin: { ko: '몸체', en: 'cabin', color: '#FFF8E7' },
        window_front: { ko: '앞창문', en: 'front window', color: '#8EF6D1' },
        window_side: { ko: '옆창문', en: 'side window', color: '#8EF6D1' },
        stripe: { ko: '경찰 줄무늬', en: 'police stripe', color: '#1E40AF' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" data-part="rotor" x="26" y="30" width="180" height="14" rx="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="fin" d="M 34 90 L 28 58 Q 27 51 34 53 L 62 86 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="tail" d="M 86 88 L 40 80 Q 30 78 30 88 V 96 Q 30 104 40 102 L 86 114 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <ellipse class="fillable" data-part="tail_rotor" cx="24" cy="90" rx="12" ry="22" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="engine" x="94" y="48" width="40" height="22" rx="9" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="light" x="132" y="52" width="26" height="18" rx="8" stroke="#333" stroke-width="3" fill="#FFF"/>
        <ellipse class="fillable" data-part="cabin" cx="120" cy="102" rx="52" ry="36" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="window_front" d="M 132 76 Q 158 76 168 100 H 132 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="window_side" x="80" y="78" width="40" height="22" rx="9" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="stripe" d="M 69.4 108 H 170.6 A 52 36 0 0 1 162 122 H 78 A 52 36 0 0 1 69.4 108 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <path d="M 114 44 V 50 M 126 44 V 50"/>
          <path d="M 80 135 L 76 150 M 160 135 L 164 150" stroke-width="4"/>
          <path d="M 62 152 H 168 Q 180 152 184 142" stroke-width="4"/>
          <path d="M 120 109 L 122 114 L 127 114 L 123 117 L 125 121 L 120 118.5 L 115 121 L 117 117 L 113 114 L 118 114 Z" fill="#333" stroke="none"/>
          <path d="M 139 59 H 151"/>
          <path d="M 140 90 H 150"/>
        </g>
      </svg>`,
    },
    {
      id: 'police_officer',
      name: '경찰관',
      emoji: '👮',
      version: 1,
      parts: {
        pants: { ko: '바지', en: 'pants', color: '#1E40AF' },
        shoe_left: { ko: '왼쪽 신발', en: 'left shoe', color: '#1A1A1A' },
        shoe_right: { ko: '오른쪽 신발', en: 'right shoe', color: '#1A1A1A' },
        shirt: { ko: '제복', en: 'uniform', color: '#4488FF' },
        belt: { ko: '허리띠', en: 'belt', color: '#1A1A1A' },
        arm_left: { ko: '왼팔', en: 'left arm', color: '#4488FF' },
        arm_right: { ko: '오른팔', en: 'right arm', color: '#4488FF' },
        hand_left: { ko: '왼손', en: 'left hand', color: '#F6E7C8' },
        hand_right: { ko: '오른손', en: 'right hand', color: '#F6E7C8' },
        face: { ko: '얼굴', en: 'face', color: '#F6E7C8' },
        cap: { ko: '경찰 모자', en: 'police cap', color: '#1E40AF' },
        brim: { ko: '모자 챙', en: 'cap brim', color: '#1A1A1A' },
        badge: { ko: '모자 배지', en: 'cap badge', color: '#FFD700' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" data-part="pants" d="M 94 134 H 146 V 150 Q 146 154 140 154 H 126 Q 121 154 121 148 V 142 Q 120 140 119 142 V 148 Q 119 154 114 154 H 100 Q 94 154 94 150 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <ellipse class="fillable" data-part="shoe_left" cx="104" cy="156" rx="16" ry="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <ellipse class="fillable" data-part="shoe_right" cx="136" cy="156" rx="16" ry="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="shirt" d="M 92 104 Q 92 94 102 94 H 138 Q 148 94 148 104 V 128 H 92 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" data-part="belt" x="92" y="124" width="56" height="12" rx="4" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="arm_left" d="M 92 100 Q 80 98 77 110 L 73 126 Q 71 135 80 136 Q 88 137 90 129 L 95 112 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="arm_right" d="M 148 100 Q 162 98 167 86 L 171 70 Q 173 62 165 61 Q 158 61 156 69 L 153 82 Q 151 88 146 90 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="hand_left" cx="77" cy="141" r="9" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="hand_right" cx="168" cy="54" r="9" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="face" cx="120" cy="68" r="34" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="cap" d="M 86 52 Q 86 22 120 22 Q 154 22 154 52 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" data-part="brim" x="80" y="48" width="80" height="12" rx="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="badge" d="M 111 28 H 129 V 38 Q 129 44 120 47 Q 111 44 111 38 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <circle cx="107" cy="76" r="4.5" fill="#333" stroke="none"/>
          <circle cx="133" cy="76" r="4.5" fill="#333" stroke="none"/>
          <circle cx="108.6" cy="74.4" r="1.5" fill="#FFF" stroke="none"/>
          <circle cx="134.6" cy="74.4" r="1.5" fill="#FFF" stroke="none"/>
          <circle cx="96" cy="86" r="5" fill="#FF88CC" stroke="none"/>
          <circle cx="144" cy="86" r="5" fill="#FF88CC" stroke="none"/>
          <path d="M 110 88 Q 120 98 130 88"/>
          <path d="M 108 94 L 120 108 L 132 94"/>
          <path d="M 120 110 V 124"/>
          <circle cx="120" cy="114" r="1.8" fill="#333" stroke="none"/>
          <circle cx="120" cy="120" r="1.8" fill="#333" stroke="none"/>
          <rect x="114" y="126" width="12" height="8" rx="2"/>
          <path d="M 100 106 L 101.5 110 L 105 110 L 102.3 112.4 L 103.3 116 L 100 114 L 96.7 116 L 97.7 112.4 L 95 110 L 98.5 110 Z" fill="#333" stroke="none"/>
        </g>
      </svg>`,
    },
    {
      id: 'police_dog',
      name: '경찰견',
      emoji: '🐕',
      version: 1,
      parts: {
        tail: { ko: '꼬리', en: 'tail', color: '#8B5A2B' },
        ear_left: { ko: '왼쪽 귀', en: 'left ear', color: '#1A1A1A' },
        ear_right: { ko: '오른쪽 귀', en: 'right ear', color: '#1A1A1A' },
        body: { ko: '몸', en: 'body', color: '#8B5A2B' },
        haunch_left: { ko: '왼쪽 뒷다리', en: 'left hind leg', color: '#8B5A2B' },
        haunch_right: { ko: '오른쪽 뒷다리', en: 'right hind leg', color: '#8B5A2B' },
        vest: { ko: '경찰 조끼', en: 'police vest', color: '#1E40AF' },
        badge: { ko: '경찰 배지', en: 'police badge', color: '#FFD700' },
        paw_left: { ko: '왼쪽 앞발', en: 'left paw', color: '#F6E7C8' },
        paw_right: { ko: '오른쪽 앞발', en: 'right paw', color: '#F6E7C8' },
        head: { ko: '얼굴', en: 'head', color: '#8B5A2B' },
        muzzle: { ko: '주둥이', en: 'muzzle', color: '#F6E7C8' },
        nose: { ko: '코', en: 'nose', color: '#1A1A1A' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" data-part="tail" d="M 148 148 Q 188 152 192 122 Q 194 110 185 111 Q 179 112 179 121 Q 177 138 148 136 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="ear_left" d="M 92 46 L 82 12 Q 81 7 86 9 L 110 26 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="ear_right" d="M 148 46 L 158 12 Q 159 7 154 9 L 130 26 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="body" d="M 120 84 Q 90 84 86 118 Q 84 146 96 154 H 144 Q 156 146 154 118 Q 150 84 120 84 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <ellipse class="fillable" data-part="haunch_left" cx="84" cy="134" rx="17" ry="21" stroke="#333" stroke-width="4" fill="#FFF"/>
        <ellipse class="fillable" data-part="haunch_right" cx="156" cy="134" rx="17" ry="21" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="vest" d="M 98 98 Q 120 92 142 98 L 146 130 Q 146 138 138 138 H 102 Q 94 138 94 130 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="badge" d="M 124 104 H 140 V 114 Q 140 121 132 125 Q 124 121 124 114 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="paw_left" x="96" y="138" width="19" height="20" rx="9" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="paw_right" x="125" y="138" width="19" height="20" rx="9" stroke="#333" stroke-width="3" fill="#FFF"/>
        <ellipse class="fillable" data-part="head" cx="120" cy="58" rx="36" ry="32" stroke="#333" stroke-width="4" fill="#FFF"/>
        <ellipse class="fillable" data-part="muzzle" cx="120" cy="71" rx="21" ry="16" stroke="#333" stroke-width="3" fill="#FFF"/>
        <ellipse class="fillable" data-part="nose" cx="120" cy="63" rx="11" ry="7.5" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <circle cx="102" cy="50" r="5" fill="#333" stroke="none"/>
          <circle cx="138" cy="50" r="5" fill="#333" stroke="none"/>
          <circle cx="103.8" cy="48.2" r="1.7" fill="#FFF" stroke="none"/>
          <circle cx="139.8" cy="48.2" r="1.7" fill="#FFF" stroke="none"/>
          <path d="M 94 40 Q 102 35 110 39 M 130 39 Q 138 35 146 40"/>
          <path d="M 120 70 V 75 M 110 76 Q 115 82 120 75 Q 125 82 130 76"/>
          <path d="M 115 80 Q 120 92 125 80 Z" fill="#FF88CC"/>
          <path d="M 132 108 L 133.5 112 L 137 112 L 134.3 114.4 L 135.3 118 L 132 116 L 128.7 118 L 129.7 114.4 L 127 112 L 130.5 112 Z" fill="#333" stroke="none"/>
          <path d="M 105 104 V 128"/>
          <path d="M 105 138 V 148 M 134 138 V 148"/>
        </g>
      </svg>`,
    },
    {
      id: 'boat',
      name: '배',
      emoji: '⛵',
      version: 1,
      parts: {
        sun: { ko: '해님', en: 'sun', color: '#FF9900' },
        flag: { ko: '깃발', en: 'flag', color: '#FF4444' },
        sail_big: { ko: '큰 돛', en: 'big sail', color: '#FFF8E7' },
        sail_small: { ko: '작은 돛', en: 'small sail', color: '#FFD700' },
        hull: { ko: '배 몸통', en: 'hull', color: '#1E40AF' },
        stripe: { ko: '배 줄무늬', en: 'hull stripe', color: '#FFF8E7' },
        water: { ko: '파도', en: 'waves', color: '#4488FF' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <circle class="fillable" data-part="sun" cx="48" cy="44" r="15" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="sail_big" d="M 124 36 Q 172 66 186 112 H 124 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="sail_small" d="M 112 54 Q 88 86 62 112 H 112 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="hull" d="M 32 112 H 208 Q 210 112 208 116 Q 198 152 176 152 H 64 Q 42 152 32 116 Q 30 112 32 112 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="stripe" d="M 33.5 116 Q 32 112 36 112 H 204 Q 208 112 206.5 116 L 204 126 H 36 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="flag" d="M 118 22 L 148 30 Q 152 32 148 34 L 118 44 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="water" d="M 16 144 Q 28 134 40 144 T 64 144 T 88 144 T 112 144 T 136 144 T 160 144 T 184 144 T 208 144 H 224 V 158 Q 224 164 218 164 H 22 Q 16 164 16 158 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <path d="M 118 22 V 112" stroke-width="4"/>
          <path d="M 48 20 V 14 M 48 68 V 74 M 24 44 H 18 M 72 44 H 78 M 31 27 L 27 23 M 65 61 L 69 65 M 65 27 L 69 23 M 31 61 L 27 65"/>
          <path d="M 134 60 Q 160 82 170 104"/>
          <path d="M 98 74 Q 84 92 76 106"/>
          <circle cx="94" cy="136" r="5"/>
          <circle cx="146" cy="136" r="5"/>
          <path d="M 40 154 Q 46 150 52 154 M 110 154 Q 116 150 122 154 M 176 154 Q 182 150 188 154"/>
        </g>
      </svg>`,
    },
    {
      id: 'bus',
      name: '버스',
      emoji: '🚌',
      version: 1,
      parts: {
        sign: { ko: '지붕 표지판', en: 'roof sign', color: '#FFF8E7' },
        body: { ko: '버스 차체', en: 'bus body', color: '#FFD700' },
        stripe: { ko: '검정 줄무늬', en: 'black stripe', color: '#1A1A1A' },
        window_1: { ko: '첫째 창문', en: 'window 1', color: '#8EF6D1' },
        window_2: { ko: '둘째 창문', en: 'window 2', color: '#8EF6D1' },
        window_3: { ko: '셋째 창문', en: 'window 3', color: '#8EF6D1' },
        door: { ko: '문', en: 'door', color: '#FF9900' },
        windshield: { ko: '앞유리', en: 'windshield', color: '#8EF6D1' },
        headlight: { ko: '헤드라이트', en: 'headlight', color: '#FFF8E7' },
        bumper: { ko: '범퍼', en: 'bumper', color: '#C0C0C0' },
        tire_rear: { ko: '뒷바퀴', en: 'back wheel', color: '#1A1A1A' },
        tire_front: { ko: '앞바퀴', en: 'front wheel', color: '#1A1A1A' },
        hub_rear: { ko: '뒷바퀴 휠', en: 'back hubcap', color: '#C0C0C0' },
        hub_front: { ko: '앞바퀴 휠', en: 'front hubcap', color: '#C0C0C0' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" data-part="sign" x="64" y="16" width="56" height="18" rx="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="body" d="M 28 30 H 180 Q 188 30 188 38 V 78 H 214 Q 224 78 224 90 V 128 Q 224 136 216 136 H 28 Q 20 136 20 128 V 38 Q 20 30 28 30 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" data-part="stripe" x="20" y="108" width="204" height="14" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="window_1" x="28" y="42" width="30" height="46" rx="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="window_2" x="65" y="42" width="30" height="46" rx="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="window_3" x="102" y="42" width="30" height="46" rx="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="door" x="139" y="42" width="26" height="64" rx="6" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="windshield" d="M 172 42 H 180 Q 184 42 184 46 V 88 H 172 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="headlight" x="198" y="88" width="26" height="18" rx="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="bumper" x="200" y="132" width="32" height="16" rx="7" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="tire_rear" cx="66" cy="140" r="21" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="tire_front" cx="168" cy="140" r="21" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="hub_rear" cx="66" cy="140" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="hub_front" cx="168" cy="140" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <path d="M 74 25 H 110"/>
          <path d="M 152 42 V 106 M 139 74 H 165"/>
          <path d="M 188 78 V 106"/>
          <circle cx="43" cy="78" r="6"/>
          <circle cx="117" cy="78" r="6"/>
          <path d="M 40 79 Q 43 82 46 79 M 114 79 Q 117 82 120 79"/>
        </g>
      </svg>`,
    },
    {
      id: 'strawberry',
      name: '딸기',
      emoji: '🍓',
      version: 1,
      parts: {
        body: { ko: '딸기 열매', en: 'strawberry', color: '#FF4444' },
        shine: { ko: '반짝이', en: 'shine', color: '#FF88CC' },
        stem: { ko: '줄기', en: 'stem', color: '#7ED957' },
        leaf_left: { ko: '왼쪽 잎', en: 'left leaf', color: '#44CC44' },
        leaf_right: { ko: '오른쪽 잎', en: 'right leaf', color: '#44CC44' },
        leaf_front: { ko: '앞쪽 잎', en: 'front leaf', color: '#7ED957' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" data-part="body" d="M 120 160 Q 116 160 110 156 Q 62 130 58 88 Q 56 56 88 54 Q 106 54 120 62 Q 134 54 152 54 Q 184 56 182 88 Q 178 130 130 156 Q 124 160 120 160 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" data-part="stem" x="112" y="26" width="16" height="42" rx="8" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="leaf_left" d="M 120 66 Q 100 40 62 52 Q 70 84 120 74 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="leaf_right" d="M 120 66 Q 140 40 178 52 Q 170 84 120 74 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="leaf_front" d="M 102 70 Q 120 64 138 70 Q 134 92 120 98 Q 106 92 102 70 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <ellipse class="fillable" data-part="shine" cx="78" cy="102" rx="8" ry="14" transform="rotate(12 78 102)" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <circle cx="102" cy="116" r="4.5" fill="#333" stroke="none"/>
          <circle cx="138" cy="116" r="4.5" fill="#333" stroke="none"/>
          <circle cx="103.5" cy="114.5" r="1.5" fill="#FFF" stroke="none"/>
          <circle cx="139.5" cy="114.5" r="1.5" fill="#FFF" stroke="none"/>
          <path d="M 112 124 Q 120 132 128 124"/>
          <ellipse cx="148" cy="86" rx="2.5" ry="3.5" fill="#333" stroke="none"/>
          <ellipse cx="164" cy="104" rx="2.5" ry="3.5" fill="#333" stroke="none"/>
          <ellipse cx="94" cy="86" rx="2.5" ry="3.5" fill="#333" stroke="none"/>
          <ellipse cx="156" cy="128" rx="2.5" ry="3.5" fill="#333" stroke="none"/>
          <ellipse cx="86" cy="124" rx="2.5" ry="3.5" fill="#333" stroke="none"/>
          <ellipse cx="120" cy="142" rx="2.5" ry="3.5" fill="#333" stroke="none"/>
          <ellipse cx="170" cy="76" rx="2.5" ry="3.5" fill="#333" stroke="none"/>
        </g>
      </svg>`,
    },
    {
      id: 'apple',
      name: '사과',
      emoji: '🍎',
      version: 1,
      parts: {
        body: { ko: '사과 열매', en: 'apple', color: '#FF4444' },
        shine: { ko: '반짝이', en: 'shine', color: '#FF88CC' },
        stem: { ko: '꼭지', en: 'stem', color: '#8B5A2B' },
        leaf: { ko: '잎', en: 'leaf', color: '#44CC44' },
        cheek_left: { ko: '왼쪽 볼', en: 'left cheek', color: '#FF88CC' },
        cheek_right: { ko: '오른쪽 볼', en: 'right cheek', color: '#FF88CC' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" data-part="body" d="M 120 62 Q 138 46 164 56 Q 192 70 188 108 Q 182 152 150 160 Q 134 162 120 156 Q 106 162 90 160 Q 58 152 52 108 Q 48 70 76 56 Q 102 46 120 62 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="stem" d="M 113 64 Q 113 44 121 30 Q 123 26 128 28 Q 133 30 131 35 Q 126 46 127 64 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="leaf" d="M 130 44 Q 152 18 188 26 Q 180 58 136 52 Q 130 50 130 44 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <ellipse class="fillable" data-part="shine" cx="76" cy="90" rx="8" ry="15" transform="rotate(14 76 90)" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="cheek_left" cx="82" cy="124" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="cheek_right" cx="158" cy="124" r="11" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <circle cx="102" cy="108" r="5" fill="#333" stroke="none"/>
          <circle cx="138" cy="108" r="5" fill="#333" stroke="none"/>
          <circle cx="103.8" cy="106.2" r="1.7" fill="#FFF" stroke="none"/>
          <circle cx="139.8" cy="106.2" r="1.7" fill="#FFF" stroke="none"/>
          <path d="M 111 120 Q 120 130 129 120"/>
          <path d="M 140 44 Q 158 36 174 34"/>
        </g>
      </svg>`,
    },
    {
      id: 'cat',
      name: '고양이',
      emoji: '🐱',
      version: 1,
      parts: {
        tail: { ko: '꼬리', en: 'tail', color: '#FF9900' },
        body: { ko: '몸', en: 'body', color: '#FF9900' },
        belly: { ko: '배', en: 'belly', color: '#FFF8E7' },
        paw_left: { ko: '왼발', en: 'left paw', color: '#FFF8E7' },
        paw_right: { ko: '오른발', en: 'right paw', color: '#FFF8E7' },
        ear_left: { ko: '왼쪽 귀', en: 'left ear', color: '#FF9900' },
        ear_right: { ko: '오른쪽 귀', en: 'right ear', color: '#FF9900' },
        head: { ko: '얼굴', en: 'face', color: '#FF9900' },
        muzzle: { ko: '주둥이', en: 'muzzle', color: '#FFF8E7' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" data-part="tail" d="M 150 148 Q 202 156 206 112 Q 208 86 192 84 Q 180 92 186 112 Q 186 134 150 130 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="body" d="M 80 108 Q 68 158 98 158 H 142 Q 172 158 160 108 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <ellipse class="fillable" data-part="belly" cx="120" cy="132" rx="19" ry="20" stroke="#333" stroke-width="3" fill="#FFF"/>
        <ellipse class="fillable" data-part="paw_left" cx="96" cy="154" rx="17" ry="9" stroke="#333" stroke-width="3" fill="#FFF"/>
        <ellipse class="fillable" data-part="paw_right" cx="144" cy="154" rx="17" ry="9" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="ear_left" d="M 74 60 Q 66 26 76 20 Q 98 24 108 38 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="ear_right" d="M 166 60 Q 174 26 164 20 Q 142 24 132 38 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <ellipse class="fillable" data-part="head" cx="120" cy="66" rx="50" ry="40" stroke="#333" stroke-width="4" fill="#FFF"/>
        <ellipse class="fillable" data-part="muzzle" cx="120" cy="82" rx="22" ry="15" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <circle cx="98" cy="62" r="5.5" fill="#333" stroke="none"/>
          <circle cx="142" cy="62" r="5.5" fill="#333" stroke="none"/>
          <circle cx="100" cy="60" r="1.8" fill="#FFF" stroke="none"/>
          <circle cx="144" cy="60" r="1.8" fill="#FFF" stroke="none"/>
          <path d="M 114 74 H 126 L 120 80 Z" fill="#333"/>
          <path d="M 120 80 V 85 M 111 87 Q 116 92 120 85 Q 124 92 129 87"/>
          <path d="M 98 80 L 72 76 M 98 85 L 72 88 M 142 80 L 168 76 M 142 85 L 168 88"/>
          <path d="M 112 34 V 42 M 120 32 V 41 M 128 34 V 42"/>
          <path d="M 80 52 Q 80 38 88 32 M 160 52 Q 160 38 152 32"/>
          <path d="M 96 148 V 154 M 144 148 V 154"/>
        </g>
      </svg>`,
    },
    {
      id: 'puppy',
      name: '강아지',
      emoji: '🐶',
      version: 1,
      parts: {
        tail: { ko: '꼬리', en: 'tail', color: '#F6E7C8' },
        body: { ko: '몸', en: 'body', color: '#F6E7C8' },
        paw_left: { ko: '왼발', en: 'left paw', color: '#FFF8E7' },
        paw_right: { ko: '오른발', en: 'right paw', color: '#FFF8E7' },
        head: { ko: '얼굴', en: 'face', color: '#F6E7C8' },
        ear_left: { ko: '왼쪽 귀', en: 'left ear', color: '#8B5A2B' },
        ear_right: { ko: '오른쪽 귀', en: 'right ear', color: '#8B5A2B' },
        patch: { ko: '눈 얼룩', en: 'eye patch', color: '#8B5A2B' },
        muzzle: { ko: '주둥이', en: 'muzzle', color: '#FFF8E7' },
        nose: { ko: '코', en: 'nose', color: '#1A1A1A' },
        tongue: { ko: '혓바닥', en: 'tongue', color: '#FF88CC' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" data-part="tail" d="M 154 138 Q 192 142 198 104 Q 200 92 190 94 Q 180 98 182 112 Q 180 128 154 124 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="body" d="M 82 104 Q 70 158 98 158 H 142 Q 170 158 158 104 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <ellipse class="fillable" data-part="paw_left" cx="96" cy="154" rx="17" ry="9" stroke="#333" stroke-width="3" fill="#FFF"/>
        <ellipse class="fillable" data-part="paw_right" cx="144" cy="154" rx="17" ry="9" stroke="#333" stroke-width="3" fill="#FFF"/>
        <ellipse class="fillable" data-part="head" cx="120" cy="62" rx="46" ry="38" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="ear_left" d="M 82 34 Q 50 30 48 68 Q 48 94 68 96 Q 84 90 84 62 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="ear_right" d="M 158 34 Q 190 30 192 68 Q 192 94 172 96 Q 156 90 156 62 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="patch" cx="142" cy="56" r="14" stroke="#333" stroke-width="3" fill="#FFF"/>
        <ellipse class="fillable" data-part="muzzle" cx="120" cy="80" rx="25" ry="17" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="tongue" d="M 109 90 Q 108 110 120 110 Q 132 110 131 90 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <ellipse class="fillable" data-part="nose" cx="120" cy="72" rx="10" ry="7.5" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <circle cx="100" cy="56" r="5.5" fill="#333" stroke="none"/>
          <circle cx="140" cy="56" r="5.5" fill="#333" stroke="none"/>
          <circle cx="102" cy="54" r="1.8" fill="#FFF" stroke="none"/>
          <circle cx="142" cy="54" r="1.8" fill="#FFF" stroke="none"/>
          <path d="M 120 79 V 88 M 107 86 Q 113 94 120 88 Q 127 94 133 86"/>
          <path d="M 120 94 V 104"/>
          <path d="M 96 148 V 154 M 144 148 V 154"/>
        </g>
      </svg>`,
    },
    {
      id: 'butterfly',
      name: '나비',
      emoji: '🦋',
      version: 1,
      parts: {
        wing_top_left: { ko: '왼쪽 위 날개', en: 'upper left wing', color: '#FF88CC' },
        wing_top_right: { ko: '오른쪽 위 날개', en: 'upper right wing', color: '#FF88CC' },
        wing_bottom_left: { ko: '왼쪽 아래 날개', en: 'lower left wing', color: '#9944FF' },
        wing_bottom_right: { ko: '오른쪽 아래 날개', en: 'lower right wing', color: '#9944FF' },
        spot_top_left: { ko: '왼쪽 위 무늬', en: 'upper left spot', color: '#FFF8E7' },
        spot_top_right: { ko: '오른쪽 위 무늬', en: 'upper right spot', color: '#FFF8E7' },
        spot_bottom_left: { ko: '왼쪽 아래 무늬', en: 'lower left spot', color: '#FFD700' },
        spot_bottom_right: { ko: '오른쪽 아래 무늬', en: 'lower right spot', color: '#FFD700' },
        body: { ko: '몸통', en: 'body', color: '#8B5A2B' },
        head: { ko: '머리', en: 'head', color: '#F6E7C8' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" data-part="wing_top_left" d="M 114 88 C 106 40 72 20 46 28 C 20 36 20 74 44 88 C 64 100 96 98 114 96 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="wing_top_right" d="M 126 88 C 134 40 168 20 194 28 C 220 36 220 74 196 88 C 176 100 144 98 126 96 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="wing_bottom_left" d="M 114 100 C 82 100 48 108 48 130 C 48 156 86 160 102 140 C 112 128 114 114 114 100 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="wing_bottom_right" d="M 126 100 C 158 100 192 108 192 130 C 192 156 154 160 138 140 C 128 128 126 114 126 100 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="spot_top_left" cx="58" cy="56" r="12" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="spot_top_right" cx="182" cy="56" r="12" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="spot_bottom_left" cx="78" cy="130" r="12" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" data-part="spot_bottom_right" cx="162" cy="130" r="12" stroke="#333" stroke-width="3" fill="#FFF"/>
        <ellipse class="fillable" data-part="body" cx="120" cy="100" rx="9" ry="44" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="head" cx="120" cy="52" r="13" stroke="#333" stroke-width="4" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <path d="M 115 41 Q 108 24 94 20 M 125 41 Q 132 24 146 20"/>
          <circle cx="94" cy="20" r="3.5" fill="#333" stroke="none"/>
          <circle cx="146" cy="20" r="3.5" fill="#333" stroke="none"/>
          <circle cx="115" cy="50" r="2.2" fill="#333" stroke="none"/>
          <circle cx="125" cy="50" r="2.2" fill="#333" stroke="none"/>
          <path d="M 115 57 Q 120 62 125 57"/>
          <path d="M 113 96 H 127 M 112 108 H 128 M 113 120 H 127"/>
        </g>
      </svg>`,
    },
    {
      id: 'house',
      name: '집',
      emoji: '🏠',
      version: 1,
      parts: {
        sun: { ko: '해님', en: 'sun', color: '#FFD700' },
        chimney: { ko: '굴뚝', en: 'chimney', color: '#8B5A2B' },
        wall: { ko: '벽', en: 'wall', color: '#F6E7C8' },
        roof: { ko: '지붕', en: 'roof', color: '#FF4444' },
        attic_window: { ko: '동그란 창문', en: 'round window', color: '#8EF6D1' },
        window_left: { ko: '왼쪽 창문', en: 'left window', color: '#8EF6D1' },
        window_right: { ko: '오른쪽 창문', en: 'right window', color: '#8EF6D1' },
        grass: { ko: '잔디', en: 'grass', color: '#7ED957' },
        door: { ko: '문', en: 'door', color: '#4488FF' },
      },
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <circle class="fillable" data-part="sun" cx="42" cy="38" r="14" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="chimney" x="152" y="30" width="22" height="46" rx="4" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="wall" x="52" y="84" width="136" height="66" rx="5" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="roof" d="M 34 94 L 110 36 Q 120 29 130 36 L 206 94 Q 210 100 202 100 H 38 Q 30 100 34 94 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" data-part="attic_window" cx="120" cy="72" r="13" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="window_left" x="64" y="108" width="28" height="28" rx="5" stroke="#333" stroke-width="3" fill="#FFF"/>
        <rect class="fillable" data-part="window_right" x="148" y="108" width="28" height="28" rx="5" stroke="#333" stroke-width="3" fill="#FFF"/>
        <path class="fillable" data-part="grass" d="M 16 150 Q 28 142 40 148 T 64 148 T 88 148 T 112 148 T 136 148 T 160 148 T 184 148 T 208 148 Q 216 146 224 150 V 158 Q 224 164 218 164 H 22 Q 16 164 16 158 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" data-part="door" d="M 102 152 V 122 Q 102 108 120 108 Q 138 108 138 122 V 152 Z" stroke="#333" stroke-width="3" fill="#FFF"/>
        <g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">
          <path d="M 42 14 V 9 M 42 62 V 67 M 18 38 H 13 M 66 38 H 71 M 25 21 L 22 18 M 59 55 L 62 58 M 59 21 L 62 18 M 25 55 L 22 58"/>
          <circle cx="160" cy="21" r="5"/><circle cx="170" cy="11" r="6"/>
          <path d="M 78 108 V 136 M 64 122 H 92 M 162 108 V 136 M 148 122 H 176"/>
          <path d="M 120 59 V 85 M 107 72 H 133" stroke-width="2"/>
          <circle cx="130" cy="132" r="3" fill="#333" stroke="none"/>
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
    showReference: false,
    referencePartId: null,
    colorSceneToken: 0,
    collectionUndo: null,
    collectionUndoTarget: null,
  };

  const WORK_KEY = 'sihyeon-art-work-v1';
  const COLLECTION_KEY = 'sihyeon-art-collection-v1';
  const COLLECTION_LIMIT = 12;
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

  function readTemplateWork(tpl, item) {
    if (!item || typeof item !== 'object') return null;
    const hasFills = Array.isArray(item.fills);
    const hasParts = !!item.parts && typeof item.parts === 'object' && !Array.isArray(item.parts);
    if (!hasFills && !hasParts) return null;
    const svgVersion = Number.isInteger(item.svgVersion) && item.svgVersion > 0 && item.svgVersion < 1000 ? item.svgVersion : 1;
    const work = { svgVersion, fills: hasFills ? item.fills.slice(0, 1000).map(safeFill) : [], completed: !!item.completed, history: [] };
    if (hasParts) {
      work.parts = Object.create(null);
      Object.keys(item.parts).slice(0, 1000).forEach((key) => {
        if (PART_RE.test(key)) work.parts[key] = safeFill(item.parts[key]);
      });
      if (!hasFills) {
        const order = partOrder(workSvg(tpl, work));
        if (order.unique) work.fills = order.ids.map((part) => work.parts[part] || '#FFF');
      }
    }
    return normalizeWork(tpl, work);
  }

  // Names and counters are shared with number play; the drawings themselves
  // remain here so there is only one source of template geometry and colors.
  const PLAY_OBJECT_LABELS = {
    police: ['police car', 'police cars', '대'],
    police_swat_suv: ['police SWAT SUV', 'police SWAT SUVs', '대'],
    police_bus: ['police bus', 'police buses', '대'],
    fire_pump: ['fire engine', 'fire engines', '대'],
    fire_ladder: ['ladder truck', 'ladder trucks', '대'],
    ambulance: ['ambulance', 'ambulances', '대'],
    excavator: ['excavator', 'excavators', '대'],
    dump_truck: ['dump truck', 'dump trucks', '대'],
    bulldozer: ['bulldozer', 'bulldozers', '대'],
    rocket: ['rocket', 'rockets', '대'],
    dino: ['dinosaur', 'dinosaurs', '마리'],
    train: ['train', 'trains', '대'],
    airplane: ['airplane', 'airplanes', '대'],
    lion: ['lion', 'lions', '마리'],
    whale: ['whale', 'whales', '마리'],
    icecream: ['ice cream', 'ice creams', '개'],
    police_motorcycle: ['police motorcycle', 'police motorcycles', '대'],
    police_helicopter: ['police helicopter', 'police helicopters', '대'],
    police_officer: ['police officer', 'police officers', '명'],
    police_dog: ['police dog', 'police dogs', '마리'],
    boat: ['boat', 'boats', '척'],
    bus: ['bus', 'buses', '대'],
    strawberry: ['strawberry', 'strawberries', '개'],
    apple: ['apple', 'apples', '개'],
    cat: ['cat', 'cats', '마리'],
    puppy: ['puppy', 'puppies', '마리'],
    butterfly: ['butterfly', 'butterflies', '마리'],
    house: ['house', 'houses', '채'],
  };
  const FILLABLE_TAG_RE = /<[a-z]+\b[^>]*\bclass="(?:[^"]*\s)?fillable(?:\s[^"]*)?"[^>]*>/gi;
  const recommendedPlayObjects = new Map();

  function readOnlySvg(tpl, svg, fills, recommended = false) {
    let index = 0;
    // svg is always a shipped template, never a string from stored work or callers.
    // Only validated paint values can enter this read-only image.
    return svg.replace(FILLABLE_TAG_RE, (tag) => {
      const part = tag.match(/\bdata-part="([^"]+)"/)?.[1];
      const fill = safeFill(recommended ? tpl.parts?.[part]?.color : fills[index]);
      index += 1;
      return tag.replace(/\bfill="[^"]*"/, `fill="${fill}"`);
    });
  }

  function playObject(tpl, svg, version, fromArtwork) {
    const [nameEn, pluralEn, unitKo] = PLAY_OBJECT_LABELS[tpl.id];
    return {
      id: `art:${tpl.id}`, nameKo: tpl.name, nameEn, pluralEn, unitKo,
      category: 'art', emoji: tpl.emoji,
      src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      artTemplateId: tpl.id, artVersion: version, fromArtwork,
    };
  }

  function getPlayObjects() {
    return COLORING_TEMPLATES.map((tpl) => {
      if (!recommendedPlayObjects.has(tpl.id)) {
        recommendedPlayObjects.set(tpl.id, Object.freeze(playObject(tpl,
          readOnlySvg(tpl, tpl.svg, [], true), templateVersion(tpl), false)));
      }
      return { ...recommendedPlayObjects.get(tpl.id) };
    });
  }

  function getSavedPlayObject(templateId) {
    let stored = memoryWork;
    if (!stored) {
      try { stored = JSON.parse(localStorage.getItem(WORK_KEY) || 'null'); }
      catch (_) { stored = null; }
    }
    const activeId = state.container && !state.destroyed ? state.activeTemplateId : stored?.activeTemplateId || state.activeTemplateId;
    const tpl = COLORING_TEMPLATES.find((item) => item.id === (templateId || activeId));
    if (!tpl) return null;
    // Deserialize into a detached work: reading from another game must not
    // migrate, recolor, save, or empty the child's original artwork.
    const work = readTemplateWork(tpl, state.templateWork[tpl.id] || stored?.templates?.[tpl.id]);
    if (!work) return null;
    const svg = workSvg(tpl, work);
    const fills = work.fills.slice(0, partOrder(svg).ids.length);
    if (!fills.some(isPainted)) return null;
    return playObject(tpl, readOnlySvg(tpl, svg, fills), work.svgVersion, true);
  }

  // Chooser pictures use the same shipped geometry and detached paint as the
  // editor, including the original revision of a returning child's artwork.
  function templatePreview(tpl) {
    const work = readTemplateWork(tpl, state.templateWork[tpl.id]);
    const svg = work ? readOnlySvg(tpl, workSvg(tpl, work), work.fills) : tpl.svg;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function updateTemplatePreview(tpl) {
    const image = state.container?.querySelector?.(`[data-tpl="${tpl.id}"] img`);
    if (image) image.src = templatePreview(tpl);
  }

  function referenceParts(tpl) {
    // Begin with the largest useful parts. Names and colors come from the
    // template metadata, and the hint never decides what the child must paint.
    const wrap = state.container?.querySelector?.('#azColoringWrap');
    const areas = new Map();
    wrap?.querySelectorAll?.('.fillable[data-part]').forEach((el) => {
      try {
        const box = el.getBBox();
        areas.set(el.getAttribute('data-part'), box.width * box.height);
      } catch (_) { /* Metadata ordering also works before the first layout. */ }
    });
    const priority = (id) => {
      if (/^(body|fuselage|hull|wall|face|boiler|cone)$/.test(id)) return 0;
      if (/^(window|windshield|cockpit|belly|roof|head|mane|scoop|sail|wing)/.test(id)) return 1;
      if (/^(tire|wheel|ear|tail|leaf|door|cab|pants|shirt|bed|blade|bucket|track)/.test(id)) return 2;
      return 3;
    };
    const candidates = Object.entries(tpl.parts || {}).map(([id, part]) => ({ id, ...part, area: areas.get(id) || 0 }));
    const major = candidates.filter((part) => priority(part.id) < 3);
    return (major.length >= 3 ? major : candidates)
      .sort((a, b) => priority(a.id) - priority(b.id) || b.area - a.area)
      .slice(0, 4);
  }

  function referencePart(tpl) {
    const parts = referenceParts(tpl);
    return parts.find((part) => part.id === state.referencePartId) || parts[0] || null;
  }

  function speakReferencePart() {
    const tpl = COLORING_TEMPLATES.find((item) => item.id === state.activeTemplateId);
    const part = tpl && referencePart(tpl);
    const voice = window.SihyeonVoice;
    if (!part || !state.showReference || typeof voice?.speak !== 'function') return;
    const english = window.SihyeonPlaySettings?.getLanguage?.() === 'en';
    const color = english
      ? window.SihyeonVoiceLabels?.spoken?.('color', part.color, 'en')
      : COLORS.find((item) => item.c === part.color)?.n;
    state.speechToken += 1;
    voice.stop?.();
    voice.speak(`${english ? part.en : part.ko}${color ? ', ' + color : ''}`,
      { lang: english ? 'en-US' : 'ko-KR', rate: .9 })?.catch?.(() => {});
  }

  function updateArtTools() {
    const root = state.container;
    const tools = root?.querySelector?.('#azArtTools');
    if (!tools) return;
    const tpl = COLORING_TEMPLATES.find((item) => item.id === state.activeTemplateId);
    if (!tpl) return;
    updateTemplatePreview(tpl);
    const isColoring = state.tab === 'coloring';
    const showing = isColoring && state.showReference;
    tools.hidden = !isColoring;
    const toggle = root.querySelector('#azReferenceToggle');
    toggle.textContent = '🖼️ 보고 색칠';
    toggle.setAttribute('aria-pressed', String(showing));
    root.querySelector('#azFreeColoring')?.setAttribute('aria-pressed', String(!showing));
    root.querySelector('#azCompanion')?.classList.toggle('has-reference', showing);
    const sample = root.querySelector('#azReference');
    sample.hidden = !showing;
    if (showing) {
      const object = getPlayObjects().find((item) => item.artTemplateId === tpl.id);
      const img = sample.querySelector('img');
      if (img.getAttribute('src') !== object.src) img.setAttribute('src', object.src);
      img.alt = `${tpl.name} 참고 색상`;
      const work = state.templateWork[tpl.id];
      const legacy = !!work && work.svgVersion !== templateVersion(tpl);
      sample.querySelector('figcaption').textContent = legacy
        ? '새 도안 견본 · 내 그림은 그대로'
        : '견본 · 내 색도 좋아요!';
      const part = referencePart(tpl);
      const hint = sample.querySelector('#azPartHint');
      if (hint && part) {
        state.referencePartId = part.id;
        hint.dataset.part = part.id;
        hint.querySelector('.az-part-name').textContent = part.ko;
        hint.querySelector('.az-part-color').textContent = COLORS.find((item) => item.c === part.color)?.n || '';
        const swatch = sample.querySelector('#azPartSwatch');
        swatch.style.backgroundColor = part.color;
        swatch.dataset.color = part.color;
      }
      const next = sample.querySelector('#azNextPart');
      if (next) next.disabled = referenceParts(tpl).length < 2;
    }
    const wrap = root.querySelector('#azColoringWrap');
    if (wrap) {
      // The sample is beside the drawing; showing it must never cover the
      // child's picture or turn painting into a read-only preview.
      wrap.style.display = isColoring ? 'flex' : 'none';
      const sameVersion = state.templateWork[tpl.id]?.svgVersion === templateVersion(tpl);
      wrap.querySelectorAll?.('.fillable').forEach((el) => {
        el.classList.toggle('az-guided-part', showing && sameVersion && el.getAttribute('data-part') === state.referencePartId);
      });
    }
    const play = root.querySelector('#azPlayArtwork');
    play.hidden = typeof state.options.onPlayObject !== 'function';
    play.disabled = !getSavedPlayObject(tpl.id);
    play.title = play.disabled ? '먼저 그림을 색칠해 주세요.' : '내가 칠한 그림으로 숫자 놀이';
  }

  function playCurrentArtwork() {
    const object = getSavedPlayObject(state.activeTemplateId);
    const onPlayObject = state.options.onPlayObject;
    if (!object || typeof onPlayObject !== 'function') return;
    saveWork();
    onPlayObject(object);
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
          // Saves written before versioning still mean v1 artwork.
          const work = readTemplateWork(t, data.templates[t.id]);
          if (work) state.templateWork[t.id] = work;
        });
      }
    } catch (_) {}
  }

  // The working page and the collection have separate keys. Saving a new
  // version never overwrites an older picture of the same template.
  let memoryCollection = null;
  let collectionReadBlocked = false;
  let collectionMessage = '';
  let collectionSequence = 0;
  let persistedCollectionIds = new Set();

  function snapshotTemplate(tpl, source) {
    const work = readTemplateWork(tpl, source);
    if (!work) return null;
    const snapshot = { svgVersion: work.svgVersion, fills: work.fills.slice(), completed: !!work.completed };
    const order = partOrder(workSvg(tpl, work));
    if (order.unique && order.ids.length) {
      snapshot.parts = {};
      order.ids.forEach((part, index) => { snapshot.parts[part] = safeFill(work.fills[index]); });
    }
    return snapshot;
  }

  function readCollectionItem(item) {
    if (!item || typeof item !== 'object' || !/^aw-[a-z0-9-]{1,72}$/.test(item.id || '')) return null;
    const base = { id: item.id, createdAt: Number.isSafeInteger(item.createdAt) && item.createdAt > 0 ? item.createdAt : 0 };
    if (item.kind === 'coloring') {
      const tpl = COLORING_TEMPLATES.find((entry) => entry.id === item.templateId);
      const work = tpl && snapshotTemplate(tpl, item.work);
      return work ? { ...base, kind: 'coloring', templateId: tpl.id, work } : null;
    }
    if (item.kind === 'free' && typeof item.image === 'string' &&
        /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(item.image) && item.image.length < 4000000) {
      return { ...base, kind: 'free', image: item.image,
        theme: Object.prototype.hasOwnProperty.call(THEMES, item.theme) ? item.theme : 'white' };
    }
    return null;
  }

  function loadCollection() {
    if (memoryCollection) return memoryCollection;
    memoryCollection = [];
    try {
      const raw = localStorage.getItem(COLLECTION_KEY);
      if (!raw) return memoryCollection;
      const data = JSON.parse(raw);
      if (!data || data.version !== 1 || !Array.isArray(data.items) || data.items.length > COLLECTION_LIMIT) throw Error('unreadable collection');
      const items = data.items.map(readCollectionItem);
      if (items.some((item) => !item) || new Set(items.map((item) => item.id)).size !== items.length) throw Error('unreadable picture');
      memoryCollection = items;
      persistedCollectionIds = new Set(items.map((item) => item.id));
    } catch (_) {
      // A denied read or a future/corrupt format must not be replaced by a new
      // empty collection just because writing happens to be permitted.
      collectionReadBlocked = true;
      collectionMessage = '저장된 그림을 읽지 못했어요. 새 그림은 이번 놀이에서만 보관돼요.';
    }
    return memoryCollection;
  }

  function persistCollection(items) {
    memoryCollection = JSON.parse(JSON.stringify(items));
    if (collectionReadBlocked) return false;
    try {
      localStorage.setItem(COLLECTION_KEY, JSON.stringify({ version: 1, items: memoryCollection }));
      persistedCollectionIds = new Set(memoryCollection.map((item) => item.id));
      return true;
    } catch (_) {
      // The browser keeps the old value when setItem fails. Session pictures
      // remain available without pretending that they survived a reload.
      return false;
    }
  }

  function captureCurrentArtwork() {
    saveWork();
    if (state.tab === 'coloring') {
      const tpl = COLORING_TEMPLATES.find((item) => item.id === state.activeTemplateId);
      const work = tpl && snapshotTemplate(tpl, state.templateWork[tpl.id]);
      if (!work || !work.fills.some(isPainted)) return null;
      return { kind: 'coloring', templateId: tpl.id, work };
    }
    if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(state.freeImage) || state.freeImage.length >= 4000000) return null;
    return { kind: 'free', image: state.freeImage, theme: state.activeTheme };
  }

  function artworkIdentity(item) {
    return item.kind === 'free'
      ? JSON.stringify([item.kind, item.image, item.theme])
      : JSON.stringify([item.kind, item.templateId, item.work.svgVersion, item.work.fills]);
  }

  function saveCurrentToCollection() {
    const items = loadCollection();
    const picture = captureCurrentArtwork();
    if (!picture) {
      collectionMessage = '먼저 그림을 그리거나 색칠해 주세요.';
    } else if (items.some((item) => artworkIdentity(item) === artworkIdentity(picture))) {
      collectionMessage = '이 그림은 이미 보관했어요. 새 색으로 그리면 한 장 더 보관할 수 있어요.';
    } else if (items.length >= COLLECTION_LIMIT) {
      collectionMessage = '그림 12장이 모두 찼어요. 지워도 괜찮은 그림을 고르면 자리가 생겨요.';
    } else {
      const item = { ...picture, id: `aw-${Date.now().toString(36)}-${(++collectionSequence).toString(36)}-${Math.random().toString(36).slice(2, 9)}`, createdAt: Date.now() };
      const saved = persistCollection([...items, item]);
      collectionMessage = saved ? '내 그림에 보관했어요. 다음에도 다시 볼 수 있어요.'
        : collectionReadBlocked ? '저장된 그림을 읽지 못했어요. 새 그림은 이번 놀이에서만 보관돼요.'
          : '기기에 저장하지 못했어요. 새 그림은 이번 놀이에서만 볼 수 있어요.';
    }
    renderCollection();
  }

  function currentWorkspaceSnapshot(target) {
    saveWork();
    const snapshot = { tab: state.tab, activeTemplateId: state.activeTemplateId };
    if (target.kind === 'coloring') {
      const prior = state.templateWork[target.templateId];
      snapshot.work = prior ? JSON.parse(JSON.stringify(prior)) : null;
    } else {
      snapshot.activeTheme = state.activeTheme;
      snapshot.freeImage = state.freeImage;
      snapshot.freeHistory = state.freeHistory.slice();
    }
    return snapshot;
  }

  function refreshWorkspaceChoices() {
    const root = state.container?.querySelector?.('.az-root');
    if (!root) return;
    root.querySelectorAll('.az-mode-tab').forEach((button) => button.classList.toggle('active', button.dataset.tab === state.tab));
    root.querySelectorAll('[data-tpl]').forEach((button) => button.classList.toggle('active', button.dataset.tpl === state.activeTemplateId));
    root.querySelectorAll('[data-theme]').forEach((button) => button.classList.toggle('active', button.dataset.theme === state.activeTheme));
    COLORING_TEMPLATES.forEach(updateTemplatePreview);
    applyThemeBg();
  }

  function loadCollectedArtwork(id) {
    const item = loadCollection().find((entry) => entry.id === id);
    if (!item) return;
    state.collectionUndo = currentWorkspaceSnapshot(item);
    state.collectionUndoTarget = { kind: item.kind, templateId: item.templateId || null };
    state.isDrawing = false;
    state.pointerId = null;
    state.referencePartId = null;
    if (item.kind === 'coloring') {
      const tpl = COLORING_TEMPLATES.find((entry) => entry.id === item.templateId);
      state.templateWork[tpl.id] = readTemplateWork(tpl, item.work);
      state.activeTemplateId = tpl.id;
    } else {
      state.freeHistory = [];
      state.activeTheme = item.theme;
      // Invalidate the previous PNG decode before any save can read pixels.
      restoreFreeImage(item.image);
    }
    closeCollection();
    switchTab(item.kind === 'coloring' ? 'coloring' : 'free');
    refreshWorkspaceChoices();
    speak('보관한 그림이야. 되돌리면 이전 그림이 돌아와!');
  }

  function undoCollectionRestore() {
    const prior = state.collectionUndo;
    const target = state.collectionUndoTarget;
    if (!prior || !target || target.kind !== (state.tab === 'coloring' ? 'coloring' : 'free') ||
        (target.kind === 'coloring' && target.templateId !== state.activeTemplateId)) return false;
    state.collectionUndo = null;
    state.collectionUndoTarget = null;
    state.tab = prior.tab;
    state.activeTemplateId = prior.activeTemplateId;
    // Undo owns only the page that was replaced. The child may have visited
    // and edited another template or the free canvas since opening this one.
    if (target.kind === 'coloring') {
      if (prior.work) state.templateWork[target.templateId] = JSON.parse(JSON.stringify(prior.work));
      else delete state.templateWork[target.templateId];
    } else {
      state.activeTheme = prior.activeTheme;
      state.freeHistory = prior.freeHistory.slice();
      restoreFreeImage(prior.freeImage);
    }
    switchTab(prior.tab);
    refreshWorkspaceChoices();
    speak('이전 그림이 돌아왔어!');
    return true;
  }

  function collectionPicture(item) {
    if (item.kind === 'free') return item.image;
    const tpl = COLORING_TEMPLATES.find((entry) => entry.id === item.templateId);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(readOnlySvg(tpl, workSvg(tpl, item.work), item.work.fills))}`;
  }

  function closeCollection() {
    state.container?.querySelector?.('#azCollection')?.remove();
    state.container?.querySelector?.('#azCollectionButton')?.focus?.();
  }

  function renderCollection(confirmDeleteId = null) {
    const root = state.container?.querySelector?.('.az-root');
    if (!root || state.destroyed) return;
    const items = loadCollection();
    let overlay = root.querySelector('#azCollection');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'azCollection';
      overlay.className = 'az-collection';
      root.appendChild(overlay);
    }
    const full = items.length >= COLLECTION_LIMIT;
    const hasSessionPicture = items.some((item) => !persistedCollectionIds.has(item.id));
    const message = collectionMessage || (collectionReadBlocked ? '저장된 그림을 읽지 못했어요. 새 그림은 이번 놀이에서만 보관돼요.'
      : hasSessionPicture ? '새 그림은 이번 놀이에서만 보관돼요.'
      : full ? '12장이 모두 찼어요. 지워도 괜찮은 그림을 골라 주세요.'
        : '같은 그림도 여러 장 보관할 수 있어요.');
    overlay.innerHTML = `
      <section class="az-collection-dialog" role="dialog" aria-modal="true" aria-labelledby="azCollectionTitle">
        <header class="az-collection-header">
          <h2 id="azCollectionTitle">🖼️ 내 그림 <small>${items.length}/${COLLECTION_LIMIT}</small></h2>
          <button type="button" id="azCollectionClose" aria-label="그림판으로 돌아가기">닫기 ✕</button>
        </header>
        <div class="az-collection-bar">
          <button type="button" id="azCollectionSave">＋ 지금 그림 보관</button>
          <p id="azCollectionStatus" role="status" aria-live="polite">${message}</p>
        </div>
        <div class="az-collection-grid" tabindex="0" aria-label="보관한 그림 목록">
          ${items.length ? items.map((item, index) => {
            const name = item.kind === 'free' ? '내가 그린 그림' : COLORING_TEMPLATES.find((entry) => entry.id === item.templateId).name;
            const background = item.kind === 'free' ? THEMES[item.theme].color : '#fffbf5';
            const pending = !persistedCollectionIds.has(item.id);
            return `<article class="az-collected-work" data-work-id="${item.id}">
              <img src="${collectionPicture(item)}" alt="${name} ${index + 1}" draggable="false" style="background:${background}">
              <h3>${name} <span>${index + 1}</span></h3>
              ${pending ? '<small class="az-session-picture">이번 놀이에서만</small>' : ''}
              ${confirmDeleteId === item.id ? `<p class="az-delete-question">이 그림을 지울까요?</p><div class="az-collected-actions"><button type="button" data-keep="${item.id}">그대로 두기</button><button type="button" class="az-delete-confirm" data-confirm-delete="${item.id}">지우기</button></div>`
                : `<div class="az-collected-actions"><button type="button" data-open-work="${item.id}" aria-label="${name} ${index + 1} 불러오기">그림 열기</button><button type="button" data-delete-work="${item.id}" aria-label="${name} ${index + 1} 지우기">🗑️</button></div>`}
            </article>`;
          }).join('') : '<div class="az-collection-empty"><span>🎨</span><p>소중한 그림을 모아 봐요!</p><p>지금 그림 보관을 누르면<br>여기에 한 장씩 담겨요.</p></div>'}
        </div>
      </section>`;
    overlay.querySelector('#azCollectionClose').onclick = closeCollection;
    overlay.querySelector('#azCollectionSave').onclick = saveCurrentToCollection;
    overlay.querySelectorAll('[data-open-work]').forEach((button) => { button.onclick = () => loadCollectedArtwork(button.dataset.openWork); });
    overlay.querySelectorAll('[data-delete-work]').forEach((button) => { button.onclick = () => { renderCollection(button.dataset.deleteWork); overlay.querySelector(`[data-keep="${button.dataset.deleteWork}"]`)?.focus(); }; });
    overlay.querySelectorAll('[data-keep]').forEach((button) => { button.onclick = () => renderCollection(); });
    overlay.querySelectorAll('[data-confirm-delete]').forEach((button) => {
      button.onclick = () => {
        const saved = persistCollection(loadCollection().filter((item) => item.id !== button.dataset.confirmDelete));
        collectionMessage = saved ? '그림 한 장을 지웠어요. 지금 그리는 그림은 그대로예요.'
          : '이번 놀이에서 지웠어요. 기기에 저장하지 못해 다음에 다시 보일 수 있어요.';
        renderCollection();
      };
    });
    overlay.onkeydown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); closeCollection(); return; }
      if (event.key !== 'Tab') return;
      const controls = Array.from(overlay.querySelectorAll('button,[tabindex="0"]')).filter((element) => !element.disabled);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    overlay.querySelector('#azCollectionClose').focus();
  }

  function openCollection() {
    state.isDrawing = false;
    state.pointerId = null;
    saveWork();
    collectionMessage = '';
    renderCollection();
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
      if(!item){undoCollectionRestore();return;}
      if(item.fills){work.fills=item.fills;if(item.svgVersion)work.svgVersion=item.svgVersion;}else work.fills[item.index]=item.prev;work.completed=false;
      renderColoringTemplate(COLORING_TEMPLATES.find(t=>t.id===state.activeTemplateId));
    } else {
      const prior=state.freeHistory.pop();if(prior===undefined){undoCollectionRestore();return;}
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
      .az-mode-tab{min-height:44px}
      @media(max-width:767px),(orientation:portrait){.az-topbar{flex-basis:60px;height:60px;min-height:60px}.az-work-actions button{height:44px}}
      @media(orientation:landscape) and (max-height:500px){.az-topbar{flex-basis:56px;height:56px;min-height:56px}.az-work-actions button{height:44px}}
      .az-main{flex-direction:column;gap:7px}
      .az-art-tools{width:100%;flex:0 0 auto;display:flex;justify-content:center;gap:6px}
      .az-art-tools[hidden],.az-art-tools button[hidden],.az-reference[hidden]{display:none}
      .az-art-tools button{min-height:44px;min-width:0;padding:6px 10px;border:2px solid #e1e5eb;border-radius:15px;background:#fff;color:#233044;font:inherit;font-size:15px;cursor:pointer;white-space:nowrap;-webkit-tap-highlight-color:transparent}
      .az-art-tools button[aria-pressed="true"]{border-color:#4488FF;background:#eef6ff}
      .az-art-tools button:disabled{color:#77828e;background:#edf0f4;cursor:default}
      .az-art-tools button:focus-visible{outline:3px solid #1E40AF;outline-offset:2px}
      .az-art-mode-group{display:flex;flex:1 1 auto;min-width:0;max-width:340px;gap:4px;padding:3px;background:#e9edf3;border-radius:18px}
      .az-art-mode-group button{flex:1 1 0;padding:4px 8px}
      #azPlayArtwork{align-self:center;flex:0 1 auto}
      .az-companion{display:flex;flex:1 1 auto;width:100%;height:0;min-width:0;min-height:0;align-items:stretch}
      .az-companion.has-reference{gap:8px}
      .az-main .az-companion .az-canvas-shell{order:0;flex:1 1 auto;width:0;height:100%;min-width:0;min-height:0;aspect-ratio:auto}
      .az-reference{order:1;flex:0 0 clamp(112px,24%,164px);min-width:0;min-height:0;position:relative;margin:0;padding:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;background:#eef6ff;border:2px solid #dae6f3;border-radius:20px;box-sizing:border-box}
      .az-reference img{display:block;flex:1 1 auto;min-height:0;width:100%;max-height:180px;object-fit:contain;pointer-events:none}
      .az-reference figcaption{flex:0 0 auto;max-width:100%;margin:0;text-align:center;color:#46607b;font-size:12px;line-height:1.35;word-break:keep-all}
      .az-reference-guide{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:7px;min-width:0;width:100%}
      .az-part-hint{display:flex;align-items:center;justify-content:center;gap:6px;max-width:100%;min-width:0;color:#233044;font-size:14px;line-height:1.35;word-break:keep-all}
      .az-part-hint strong,.az-part-hint small{display:block}
      .az-part-hint small{font-size:12px;color:#46607b}
      .az-part-swatch{flex:0 0 25px;width:25px;height:25px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 1px #b7c7d7}
      .az-reference-guide button{min-height:44px;max-width:100%;padding:5px 10px;border:2px solid #cadbee;border-radius:14px;background:#fff;color:#355270;font:inherit;font-size:14px;font-weight:800;cursor:pointer;-webkit-tap-highlight-color:transparent}
      .az-reference-guide button:focus-visible{outline:3px solid #1E40AF;outline-offset:2px}
      .az-coloring-wrap .az-guided-part{stroke:#2475c7;stroke-dasharray:5 4;stroke-width:3.5}
      @media(orientation:portrait){
        .az-companion{flex-direction:column}
        .az-main .az-companion .az-canvas-shell{order:1;width:100%;height:0}
        .az-reference{order:0;flex:0 0 90px;width:100%;max-height:90px;display:grid;grid-template-columns:94px minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto;column-gap:10px;row-gap:2px;padding:6px 9px;border-radius:16px}
        .az-reference img{grid-column:1;grid-row:1 / 3;height:100%;max-height:74px;min-height:0}
        .az-reference figcaption{grid-column:2;grid-row:2;font-size:11px;line-height:1.2;text-align:left}
        .az-reference-guide{grid-column:2;grid-row:1;flex-direction:row;justify-content:space-between;gap:6px}
        .az-part-hint{justify-content:flex-start;font-size:13px}
        .az-part-swatch{flex-basis:20px;width:20px;height:20px}
        .az-reference-guide button{flex:0 0 54px;padding:4px 5px;font-size:12px;line-height:1.2}
      }
      @media(max-width:380px){
        .az-mode-tabs{gap:4px}
        .az-mode-tab{height:44px;white-space:normal;font-size:12px!important;line-height:1.15;padding:3px!important;word-break:keep-all}
        .az-art-tools{gap:4px}
        .az-art-tools button{font-size:12px;padding:5px 6px}
        .az-art-mode-group{gap:3px;padding:2px}
        .az-reference{grid-template-columns:76px minmax(0,1fr);column-gap:7px;flex-basis:82px;max-height:82px;padding:5px 7px}
        .az-reference img{max-height:68px}
        .az-reference figcaption{font-size:10px}
        .az-part-hint{gap:4px;font-size:12px}
        .az-part-hint small{font-size:11px}
      }
      @media(orientation:landscape) and (max-height:500px){
        .az-main{gap:4px}
        .az-art-tools button{font-size:12px;padding:5px 7px}
        .az-art-mode-group{padding:2px}
        .az-companion.has-reference{gap:5px}
        .az-reference{flex-basis:112px;padding:6px;gap:4px;border-radius:12px}
        .az-reference img{max-height:110px}
        .az-reference figcaption{font-size:10px}
        .az-part-hint{font-size:12px;gap:4px}
        .az-part-hint small{font-size:11px}
        .az-part-swatch{flex-basis:20px;width:20px;height:20px}
        .az-reference-guide{gap:5px}
        .az-reference-guide button{font-size:12px;padding:4px 7px}
      }
    `;
    s.textContent += `
      .az-left-panel .coloring-section{display:flex;flex-direction:column;min-height:0;flex:1 1 auto}
      #azTplRow .az-cat-btn{position:relative;display:flex;flex-direction:column;justify-content:center;gap:2px;overflow:hidden}
      #azTplRow .az-cat-btn img{display:block;width:100%;height:58px;min-height:0;object-fit:contain;pointer-events:none}
      #azTplRow .az-tpl-name{display:block;max-width:100%;font-size:11px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}
      #azTplRow{touch-action:pan-y}
      .az-work-actions button{flex:0 0 44px;min-width:44px;width:44px;cursor:pointer}
      .az-work-actions #azCollectionButton{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:20px;line-height:1;padding:2px}
      .az-action-name{font:11px/1 'Jua',sans-serif;color:#233044;white-space:nowrap}
      .az-collection,.az-collection *{box-sizing:border-box}
      .az-collection{position:fixed;inset:0;z-index:10020;display:grid;place-items:center;padding:12px;background:rgba(24,47,70,.56);touch-action:pan-y}
      .az-collection-dialog{width:min(820px,100%);max-height:calc(100dvh - 24px);min-height:0;display:flex;flex-direction:column;background:#fff9ef;border:3px solid #fff;border-radius:24px;box-shadow:0 16px 48px #172d4655;overflow:hidden}
      .az-collection-header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 14px;background:#fff;flex:0 0 auto}
      .az-collection-header h2{margin:0;font-size:23px;line-height:1.2;color:#233044}
      .az-collection-header small{font-size:14px;color:#65758a;white-space:nowrap}
      .az-collection button{min-height:44px;min-width:44px;padding:6px 10px;border:2px solid #d6dce5;border-radius:14px;background:#fff;font:inherit;font-size:14px;color:#233044;cursor:pointer;touch-action:manipulation}
      .az-collection button:focus-visible,.az-collection-grid:focus-visible{outline:3px solid #235fa8;outline-offset:2px}
      .az-collection-bar{display:grid;grid-template-columns:max-content minmax(0,1fr);align-items:center;gap:10px;padding:8px 14px;flex:0 0 auto}
      #azCollectionSave{background:#fff0d8;border-color:#efaa55;font-size:16px}
      #azCollectionStatus{margin:0;font-size:13px;line-height:1.4;word-break:keep-all;color:#5d5043}
      .az-collection-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:12px;padding:6px 14px 14px;overflow-y:auto;min-height:0;overscroll-behavior:contain;touch-action:pan-y;align-content:start}
      .az-collected-work{padding:8px;border:2px solid #efe0c9;border-radius:18px;background:white;min-width:0;display:flex;flex-direction:column;gap:6px}
      .az-collected-work>img{width:100%;height:120px;object-fit:contain;display:block;border-radius:12px;border:1px solid #e9e5df}
      .az-collected-work h3{font-size:14px;line-height:1.2;margin:0;min-height:18px;word-break:keep-all;text-align:center}
      .az-collected-work h3 span{color:#8a7560;font-size:12px}
      .az-collected-actions{display:flex;gap:5px;margin-top:auto;min-width:0}
      .az-collected-actions [data-open-work],.az-collected-actions [data-keep]{flex:1 1 auto;min-width:0}
      .az-collected-actions [data-delete-work]{flex:0 0 44px;padding:6px}
      .az-collected-actions [data-confirm-delete]{background:#fff0e9;border-color:#dfab92}
      .az-collected-actions [data-keep]{background:#eef6ff;border-color:#aac9e8}
      .az-delete-question{margin:0;text-align:center;font-size:13px;color:#805342}
      .az-session-picture{font-size:11px;line-height:1.2;color:#805a35;text-align:center}
      .az-collection-empty{grid-column:1/-1;min-height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#65758a}
      .az-collection-empty>span{font-size:54px}
      .az-collection-empty p{margin:5px 0;font-size:16px;line-height:1.4}
      @media(max-width:767px),(orientation:portrait){
        #azTplRow{touch-action:pan-x}
        #azTplRow .az-cat-btn img{height:39px}
        #azTplRow .az-tpl-name{font-size:10px;line-height:1.1}
      }
      @media(max-width:520px){
        .az-work-actions{gap:4px}
        .az-work-actions button{width:44px;min-width:44px}
        .az-collection-header{padding:8px 10px}
        .az-collection-header h2{font-size:21px}
        .az-collection-bar{grid-template-columns:1fr;padding:8px 10px;gap:6px}
        .az-collection-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:4px 10px 12px}
        .az-collected-work{padding:6px;gap:5px}
        .az-collected-work>img{height:96px}
        .az-collected-work h3{font-size:12px;line-height:1.25}
        .az-collected-actions button{padding:5px;font-size:12px}
      }
      @media(max-width:380px){.az-mode-icon{display:none}.az-mode-tabs{gap:4px}.az-mode-tab{min-width:44px}}
      @media(orientation:landscape) and (max-height:500px){
        .az-left-panel,.az-right-panel{height:100%;min-height:0;display:flex}
        .az-left-panel .coloring-section{height:100%;min-height:0;display:flex;flex-direction:column}
        .az-left-panel .free-section{height:100%;min-height:0;overflow-y:auto}
        .az-left-panel .free-section .az-panel-row{height:auto;display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden;touch-action:pan-y}
        .az-left-panel .free-section .az-cat-btn{min-height:44px;width:100%;flex:0 0 auto;font-size:12px}
        #azTplRow{height:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));overflow-y:auto;overflow-x:hidden;touch-action:pan-y;align-items:start}
        #azTplRow .az-cat-btn{width:100%;min-width:0;height:66px;min-height:66px;flex:none}
        #azTplRow .az-cat-btn img{height:43px}
        #azTplRow .az-tpl-name{font-size:9px}
        .az-right-panel .az-color-section{height:100%;min-height:0}
        .az-palette-row{height:auto;grid-template-rows:none;align-items:start;overflow-y:auto;touch-action:pan-y}
        .az-color-circle{min-height:44px;max-height:none;aspect-ratio:1}
        .az-collection-header{padding:6px 12px}
        .az-collection-bar{padding:6px 12px}
        .az-collected-work>img{height:82px}
      }
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
    state.showReference = false;
    state.referencePartId = null;
    state.collectionUndo = null;
    state.collectionUndoTarget = null;
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
            <button type="button" class="az-mode-tab${!isInitialColoring ? ' active' : ''}" data-tab="free"><span class="az-mode-icon">🎨 </span>그림 팡팡</button>
            <button type="button" class="az-mode-tab${isInitialColoring ? ' active' : ''}" data-tab="coloring"><span class="az-mode-icon">🌈 </span>색칠 팡팡</button>
          </div>
          <div class="az-brand">🎨 매직 그림판</div>
          <div class="az-work-actions"><button type="button" id="azUndo" aria-label="되돌리기">↶</button><button type="button" id="azNewPaper" aria-label="새 종이">📄</button><button type="button" id="azCollectionButton" aria-label="내 그림" aria-haspopup="dialog"><span aria-hidden="true">🖼️</span><span class="az-action-name">내 그림</span></button></div>
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
                ${COLORING_TEMPLATES.map((t) => `<button type="button" class="az-cat-btn${t.id === state.activeTemplateId ? ' active' : ''}" data-tpl="${t.id}" aria-label="${t.name}" title="${t.name}"><img src="${templatePreview(t)}" alt="" draggable="false"><span class="az-tpl-name">${t.name}</span></button>`).join('')}
              </div>
            </section>
          </aside>

          <section class="az-main">
            <div class="az-art-tools" id="azArtTools"${!isInitialColoring ? ' hidden' : ''}>
              <div class="az-art-mode-group" role="group" aria-label="색칠 방법">
                <button type="button" id="azFreeColoring" aria-pressed="true">🎨 자유 색칠</button>
                <button type="button" id="azReferenceToggle" aria-pressed="false" aria-controls="azReference">🖼️ 보고 색칠</button>
              </div>
              <button type="button" id="azPlayArtwork" aria-label="내 그림 숫자 놀이" disabled${typeof options.onPlayObject !== 'function' ? ' hidden' : ''}>🔢 숫자 놀이</button>
            </div>
            <div class="az-companion" id="azCompanion">
              <figure class="az-reference" id="azReference" hidden>
                <img alt="참고 색상" draggable="false">
                <figcaption>견본 · 내 색도 좋아요!</figcaption>
                <div class="az-reference-guide">
                  <div class="az-part-hint" id="azPartHint" role="status" aria-live="polite">
                    <span class="az-part-swatch" id="azPartSwatch" aria-hidden="true"></span>
                    <span><strong class="az-part-name"></strong><small class="az-part-color"></small></span>
                  </div>
                  <button type="button" id="azNextPart" aria-label="다음 부분 보기">다음 부분 ›</button>
                </div>
              </figure>
            <div class="az-canvas-shell">
              <div class="az-canvas-wrap" id="azCanvasWrap">
                <canvas id="azCanvas"${isInitialColoring ? ' style="display:none;"' : ''}></canvas>
                <div class="az-coloring-wrap" id="azColoringWrap"${isInitialColoring ? ' style="display:flex;"' : ''}></div>
                <div id="azRestoreNotice" role="status" hidden style="position:absolute;z-index:3;left:50%;top:12px;transform:translateX(-50%);max-width:90%;padding:9px 13px;border-radius:14px;background:#fff8e7;color:#5e5143;font-size:14px;text-align:center;pointer-events:none;"></div>
              </div>
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
    root.querySelector('#azCollectionButton').onclick = openCollection;
    root.querySelector('#azReferenceToggle').onclick = () => {
      state.showReference = !state.showReference;
      updateArtTools();
      if (state.showReference) speakReferencePart();
    };
    root.querySelector('#azFreeColoring').onclick = () => {
      state.showReference = false;
      updateArtTools();
    };
    root.querySelector('#azNextPart').onclick = () => {
      if (!state.showReference) return;
      const tpl = COLORING_TEMPLATES.find((item) => item.id === state.activeTemplateId);
      const parts = tpl && referenceParts(tpl);
      if (!parts?.length) return;
      const index = parts.findIndex((part) => part.id === state.referencePartId);
      state.referencePartId = parts[(index + 1) % parts.length].id;
      updateArtTools();
      speakReferencePart();
    };
    root.querySelector('#azPlayArtwork').onclick = playCurrentArtwork;

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
        state.referencePartId = null;
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
      updateArtTools();
      requestAnimationFrame(() => resizeCanvasPreserve(true));
      speak('자유롭게 그려볼까?');
    }
  }

  function renderColoringTemplate(tpl) {
    if (!tpl) return;

    const wrap = document.getElementById('azColoringWrap');
    if (!wrap) return;
    const sceneToken = ++state.colorSceneToken;

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
        updateArtTools();

        burstSparkles(clientX, clientY);

        if (navigator.vibrate) navigator.vibrate(25);

        timer(() => {if(state.activeTemplateId===tpl.id && state.colorSceneToken===sceneToken)checkColoringComplete(tpl);}, 450);
      };

      el.addEventListener('pointerup', (e) => {
        e.preventDefault();
        if (state.isDrawing) return;
        applyFill(e.clientX, e.clientY);
      });
    });
    updateArtTools();
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
      const english=window.SihyeonVoiceLabels?.spoken?.('template',tpl.id,'en') || PLAY_OBJECT_LABELS[tpl.id]?.[0];
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
    if (kind === 'template' && PLAY_OBJECT_LABELS[id] && typeof voice?.speak === 'function') {
      const tpl = COLORING_TEMPLATES.find((item) => item.id === id);
      const english = window.SihyeonPlaySettings?.getLanguage?.() === 'en';
      state.speechToken += 1;
      voice.stop?.();
      voice.speak(english ? PLAY_OBJECT_LABELS[id][0] : tpl.name,
        { lang: english ? 'en-US' : 'ko-KR', rate: .9 })?.catch?.(() => {});
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
  window.SihyeonArtPlayBridge = Object.freeze({ getPlayObjects, getSavedPlayObject });
  window.SihyeonGames[GAME_KEY] = { render, destroy };
})();
