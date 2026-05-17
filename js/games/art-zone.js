/**
 * 시현이 놀이터 OS — 매직 그림판 v4.2
 * v4.1 원본 기준 유지 + 시현이 전용 단순 그림놀이 레이아웃
 * - 큰 매직 그림판 헤더 제거
 * - 도구/되돌리기/휴지통/완료/저장 UI 제거
 * - 가로모드: 좌측 도안/SVG 선택, 가운데 큰 정사각형 그림판, 우측 색깔 선택
 * - 세로모드: 상단 모드 선택, 도안/SVG 가로 스크롤, 중앙 큰 그림판, 하단 색깔 2줄
 * - SVG는 캔버스 안에서 가로/세로 정중앙
 */
(function () {
  'use strict';

  const GAME_KEY = 'artZone';
  const STYLE_ID = 'sihyeon-art-v4-style';
  const LEGACY_STYLE_IDS = ['sihyeon-art-v3-style', 'sihyeon-art-v2-style', 'sihyeon-art-style'];

  const COLORS = [
    { c: '#FF4444', n: '빨간색' },
    { c: '#FF9900', n: '주황색' },
    { c: '#FFD700', n: '노란색' },
    { c: '#44CC44', n: '초록색' },
    { c: '#4488FF', n: '파란색' },
    { c: '#1E40AF', n: '진파랑' },
    { c: '#9944FF', n: '보라색' },
    { c: '#FF88CC', n: '분홍색' },
    { c: '#FFFFFF', n: '흰색' },
    { c: '#F6E7C8', n: '바닐라색' },
    { c: '#C0C0C0', n: '은색' },
    { c: '#9E9E9E', n: '회색' },
    { c: '#1A1A1A', n: '검정색' },
    { c: '#8B5A2B', n: '갈색' },
    { c: '#7ED957', n: '연두색' },
    { c: 'rainbow', n: '무지개' },
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
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
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
      </svg>`,
    },
    {
      id: 'police_bus',
      name: '경찰 버스',
      emoji: '🚌',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
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
      </svg>`,
    },
    {
      id: 'fire_pump',
      name: '소방 펌프차',
      emoji: '🚒',
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
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
      </svg>`,
    },
    {
      id: 'fire_ladder',
      name: '소방 사다리차',
      emoji: '🪜',
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
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
      </svg>`,
    },
    {
      id: 'ambulance',
      name: '구급차',
      emoji: '🚑',
      svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
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
      </svg>`,
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
  };

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
        flex:0 0 48px;
        height:48px;
        min-height:48px;
        display:flex;
        align-items:center;
        gap:8px;
        padding:4px 10px;
        background:#fff;
        border-bottom:4px solid #FF7A1A;
        box-sizing:border-box;
        z-index:5;
      }

      .az-back-btn{
        flex:0 0 42px;
        width:42px;
        height:40px;
        border-radius:16px;
        border:3px solid #edf0f5;
        background:#fff;
        color:#233044;
        font:inherit;
        font-size:22px;
        font-weight:900;
        box-shadow:0 4px 0 rgba(0,0,0,.08);
        cursor:pointer;
        -webkit-tap-highlight-color:transparent;
      }

      .az-back-btn:active{
        transform:translateY(2px);
        box-shadow:0 2px 0 rgba(0,0,0,.08);
      }

      .az-mode-tabs{
        display:flex;
        gap:8px;
        align-items:center;
        flex:0 1 430px;
      }

      .az-mode-tab{
        flex:1 1 0;
        min-width:0;
        height:40px;
        padding:5px 12px;
        border-radius:19px;
        border:3px solid #e6e9ef;
        background:#f9fafc;
        color:#233044;
        font:inherit;
        font-weight:900;
        font-size:16px;
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
        margin-left:auto;
        font-size:15px;
        font-weight:900;
        color:#6b7280;
        opacity:.82;
        white-space:nowrap;
      }

      .az-workspace{
        flex:1 1 auto;
        min-height:0;
        display:grid;
        grid-template-columns:160px minmax(0,1fr) 150px;
        grid-template-rows:minmax(0,1fr);
        gap:8px;
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
        gap:8px;
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
        border-radius:18px;
        padding:8px;
        box-shadow:0 8px 22px rgba(31,45,61,.06);
        box-sizing:border-box;
      }

      .az-panel-title{
        display:flex;
        align-items:center;
        justify-content:space-between;
        margin:0 0 7px;
        font-size:12px;
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
        gap:8px;
        padding:0 1px 4px;
      }

      #azTplRow .az-cat-btn{
        width:100%;
        min-width:0;
        min-height:64px;
        font-size:32px;
        display:grid;
        place-items:center;
        padding:6px;
      }

      .az-canvas-shell{
        width:min(100%, calc(100dvh - 72px));
        max-width:800px;
        max-height:100%;
        aspect-ratio:1 / 1;
        display:flex;
        align-items:center;
        justify-content:center;
      }

      .az-canvas-wrap{
        position:relative;
        width:100%;
        height:100%;
        background:#fff;
        border:5px solid #222;
        border-radius:24px;
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
        width:auto;
        height:auto;
        max-width:88%;
        max-height:88%;
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
        gap:8px;
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
        border:4px solid #fff;
        box-shadow:0 5px 12px rgba(0,0,0,.14);
        cursor:pointer;
        transition:transform .15s ease, border-color .15s ease;
        box-sizing:border-box;
        -webkit-tap-highlight-color:transparent;
      }

      .az-color-circle.active{
        transform:scale(1.08) translateY(-2px);
        border-color:#222;
      }

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

        .az-back-btn{
          flex-basis:40px;
          width:40px;
          height:38px;
          border-radius:15px;
          font-size:20px;
          border-width:2px;
        }

        .az-mode-tabs{
          flex:1 1 auto;
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
          max-width:90%;
          max-height:90%;
        }
      }

      @media (min-width:768px) and (min-height:501px) and (orientation:landscape) {
        .az-workspace{
          grid-template-columns:160px minmax(0,1fr) 150px;
          gap:8px;
          padding:8px;
        }

        .az-left-panel,
        .az-right-panel{
          height:100%;
          overflow:hidden;
        }

        .az-canvas-shell{
          width:min(100%, calc(100dvh - 72px));
          max-width:800px;
        }

        .az-color-circle{
          min-height:48px;
        }
      }

      @media (min-width:1024px) and (min-height:680px) and (orientation:landscape) {
        .az-workspace{
          grid-template-columns:160px minmax(0,1fr) 150px;
          gap:8px;
          padding:8px;
        }

        .az-canvas-shell{
          width:min(100%, calc(100dvh - 74px));
          max-width:812px;
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

        .az-back-btn{
          flex-basis:34px;
          width:34px;
          height:32px;
          border-radius:12px;
          font-size:17px;
          border-width:2px;
          box-shadow:0 2px 0 rgba(0,0,0,.08);
        }

        .az-mode-tabs{
          flex:0 1 340px;
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
          grid-template-columns:112px minmax(0,1fr) 108px;
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
          min-height:39px;
          font-size:21px;
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
          width:min(100%, calc(100dvh - 50px));
          max-width:none;
        }

        .az-canvas-wrap{
          border-width:2px;
          border-radius:12px;
          box-shadow:0 6px 14px rgba(0,0,0,.10);
        }

        .az-palette-row{
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:4px;
        }

        .az-color-circle{
          border-width:2px;
        }

        .az-rainbow::after{
          font-size:16px;
        }

        .az-coloring-wrap svg{
          max-width:90%;
          max-height:90%;
        }
      }
    `;
    document.head.appendChild(s);
  }

  function render(container, options = {}) {
    destroy(false);

    state.container = container;
    state.options = options;
    state.tab = options.initialTab === 'coloring' ? 'coloring' : 'free';
    state.mode = 'free';
    state.paintHistory = [];
    state.coloringCompleted = false;
    state.destroyed = false;
    state.currentColor = '#FF4444';
    state.currentSize = 18;
    state.isRainbow = false;
    state.hue = 0;

    if (options.initialTemplateId && COLORING_TEMPLATES.some((t) => t.id === options.initialTemplateId)) {
      state.activeTemplateId = options.initialTemplateId;
    }

    injectStyle();

    const isInitialColoring = state.tab === 'coloring';

    container.innerHTML = `
      <div class="az-root" data-tab="${state.tab}">
        <header class="az-topbar">
          <button type="button" class="az-back-btn" id="azBackBtn" aria-label="뒤로가기">←</button>
          <div class="az-mode-tabs">
            <button type="button" class="az-mode-tab${!isInitialColoring ? ' active' : ''}" data-tab="free">🎨 자유 그리기</button>
            <button type="button" class="az-mode-tab${isInitialColoring ? ' active' : ''}" data-tab="coloring">🌈 색칠 팡팡</button>
          </div>
          <div class="az-brand">🎨 매직 그림판</div>
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
    state.canvas = document.getElementById('azCanvas');
    state.ctx = state.canvas.getContext('2d');
    resizeCanvasPreserve(false);
    state.ctx.lineCap = 'round';
    state.ctx.lineJoin = 'round';
    applyThemeBg();
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
  }

  function applyThemeBg() {
    const wrap = document.getElementById('azCanvasWrap');
    if (wrap) wrap.style.backgroundColor = THEMES[state.activeTheme]?.color || '#fff';
  }

  function bindEvents() {
    const root = state.container.querySelector('.az-root');
    const backBtn = document.getElementById('azBackBtn');

    if (backBtn) {
      backBtn.onclick = () => {
        if (typeof state.options.closeToParkHome === 'function') {
          state.options.closeToParkHome();
          return;
        }

        if (typeof state.options.onBack === 'function') {
          state.options.onBack();
          return;
        }

        if (window.history.length > 1) {
          window.history.back();
        }
      };
    }

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
        speak(THEMES[state.activeTheme].label.replace(/^[^\s]+ /, '') + '이야!');
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
        speak(`${tpl?.name || '그림'}을 같이 색칠해볼까?`);
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

        speak(btn.dataset.name + '!');
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
      if (state.tab !== 'free') return;
      e.preventDefault();

      const pos = getPos(e);

      state.isDrawing = true;
      state.ctx.globalCompositeOperation = 'source-over';
      state.ctx.beginPath();
      state.ctx.moveTo(pos.x, pos.y);

      if (canvas.setPointerCapture) {
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
    };

    const drawMove = (e) => {
      if (!state.isDrawing || state.tab !== 'free') return;
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
      state.ctx.lineTo(pos.x, pos.y);
      state.ctx.stroke();
    };

    const drawEnd = (e) => {
      if (!state.isDrawing) return;
      state.isDrawing = false;
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
    canvas.addEventListener('pointerleave', drawEnd);
  }

  function switchTab(tab) {
    state.tab = tab;
    state.mode = 'free';
    state.coloringCompleted = false;

    const isFree = tab === 'free';
    const root = state.container?.querySelector('.az-root');
    if (root) root.dataset.tab = tab;

    const canvas = document.getElementById('azCanvas');
    const coloringWrap = document.getElementById('azColoringWrap');

    if (canvas) canvas.style.display = isFree ? 'block' : 'none';
    if (coloringWrap) coloringWrap.style.display = isFree ? 'none' : 'flex';

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

    state.paintHistory = [];
    state.coloringCompleted = false;

    wrap.classList.remove('az-done');
    wrap.innerHTML = tpl.svg;

    const svg = wrap.querySelector('svg');
    if (svg) {
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.style.cssText = 'width:auto;height:auto;max-width:88%;max-height:88%;overflow:visible;display:block;';
    }

    wrap.querySelectorAll('.fillable').forEach((el) => {
      const applyFill = (clientX, clientY) => {
        const fillColor = state.isRainbow
          ? `hsl(${(state.hue = (state.hue + 35) % 360)},90%,55%)`
          : state.currentColor;

        const prev = el.getAttribute('fill');

        if (prev === fillColor) return;

        state.paintHistory.push({ el, prev });
        el.setAttribute('fill', fillColor);

        burstSparkles(clientX, clientY);

        if (navigator.vibrate) navigator.vibrate(25);

        timer(() => checkColoringComplete(tpl), 450);
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

    const allDone = Array.from(wrap.querySelectorAll('.fillable')).every((el) => {
      const fill = el.getAttribute('fill') || '';
      return fill !== '' && fill !== '#FFF' && fill !== '#fff' && fill !== 'white' && fill !== 'none';
    });

    if (!allDone) return;

    state.coloringCompleted = true;
    wrap.classList.add('az-done');

    speak(`우와. ${tpl.name} 완성. 시현이 참 잘했어.`, true);
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

  function speak(msg, force = false) {
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
      '진파랑!': 'games.paint.blue',
      '보라색!': 'games.paint.purple',
      '분홍색!': 'games.paint.pink',
      '흰색!': 'games.paint.blank',
      '바닐라색!': 'games.paint.blank',
      '은색!': 'games.paint.clear',
      '회색!': 'games.paint.clear',
      '검정색!': 'games.paint.black',
      '갈색!': 'games.paint.orange',
      '연두색!': 'games.paint.green',
      '무지개!': 'games.paint.rainbow',
      '어떤 그림을 색칠해볼까?': 'games.paint.choose',
      '자유롭게 그려볼까?': 'games.paint.free',
    };

    const voiceId = voiceIds[msg];

    if (voiceId && window.SihyeonVoice && typeof window.SihyeonVoice.play === 'function') {
      window.SihyeonVoice.play(voiceId, '').catch(() => {});
      return;
    }

    if (!force) return;

    if (window.SihyeonVoice && typeof window.SihyeonVoice.speak === 'function') {
      try {
        window.SihyeonVoice.speak(msg);
      } catch (_) {}
    }
  }

  function destroy(clearDom = true) {
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

    if (typeof speechSynthesis !== 'undefined') {
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