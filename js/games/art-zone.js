/**
 * 시현이 놀이터 OS — 매직 그림판 v4.0
 * 1단계 완성본: 모바일 세로형 + 태블릿 가로형 이중 레이아웃
 * 자유 그리기 + 색칠 팡팡 (SVG inline fill 방식)
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
    { c: '#9944FF', n: '보라색' },
    { c: '#FF88CC', n: '분홍색' },
    { c: '#1A1A1A', n: '검정색' },
    { c: 'rainbow', n: '무지개' },
  ];

  const STAMPS = ['🚗', '🦖', '⭐', '❤️', '🍦', '🐶'];

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
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <path class="fillable" d="M 75 20 L 75 10 L 95 10 L 95 20 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 95 20 L 95 10 L 115 10 L 115 20 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 25 90 L 25 60 C 25 50, 45 40, 65 40 L 145 40 C 165 40, 185 50, 185 60 L 185 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 45 40 L 70 20 L 120 20 L 145 40 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 70 25 L 90 25 L 90 40 L 50 40 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 100 25 L 120 25 L 140 40 L 100 40 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="30" cy="70" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="180" cy="70" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="60" cy="90" r="18" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="60" cy="90" r="7" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="150" cy="90" r="18" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="150" cy="90" r="7" stroke="#333" stroke-width="4" fill="#FFF"/>
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
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" x="135" y="15" width="20" height="10" rx="4" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 120 90 L 120 40 C 120 30, 130 25, 140 25 L 165 25 C 180 25, 185 45, 185 60 L 185 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 130 50 L 130 35 L 155 35 C 165 35, 170 40, 175 50 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="15" y="35" width="105" height="55" rx="5" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="25" y="45" width="30" height="35" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="65" y="45" width="45" height="35" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="87" cy="62" r="10" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="87" cy="62" r="3" stroke="#333" stroke-width="2" fill="#FFF"/>
        <rect class="fillable" x="180" y="70" width="8" height="12" rx="2" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="45" cy="90" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="45" cy="90" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="150" cy="90" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="150" cy="90" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
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
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" x="80" y="15" width="20" height="12" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="105" y="15" width="20" height="12" rx="3" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 15 90 L 15 27 L 105 27 L 105 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 105 90 L 105 45 L 150 45 L 180 65 L 180 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 115 52 L 145 52 L 165 65 L 115 65 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="45" y="55" width="30" height="10" rx="2" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="55" y="45" width="10" height="30" rx="2" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="175" y="75" width="8" height="10" rx="2" stroke="#333" stroke-width="3" fill="#FFF"/>
        <circle class="fillable" cx="45" cy="90" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="45" cy="90" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="150" cy="90" r="16" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle class="fillable" cx="150" cy="90" r="6" stroke="#333" stroke-width="4" fill="#FFF"/>
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
      svg: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
        <rect class="fillable" x="65" y="95" width="16" height="30" rx="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="85" y="95" width="16" height="30" rx="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="125" y="95" width="16" height="30" rx="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <rect class="fillable" x="145" y="95" width="16" height="30" rx="6" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 40 90 Q 30 55, 100 55 Q 150 55, 170 70 Q 190 75, 185 90 Q 140 115, 100 115 Q 60 115, 40 90 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 50 100 Q 100 115, 155 95 Q 100 105, 50 100 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 60 60 L 70 25 L 85 57 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 80 55 L 100 15 L 115 55 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 110 57 L 130 25 L 140 60 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <path class="fillable" d="M 135 65 L 150 40 L 160 70 Z" stroke="#333" stroke-width="4" fill="#FFF"/>
        <circle cx="165" cy="78" r="4" fill="#333"/>
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
    currentSize: 16,
    isRainbow: false,
    hue: 0,
    activeTheme: 'white',
    activeStamp: null,
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
        min-height:0;
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
        flex:0 0 auto;
        min-height:58px;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:8px 12px;
        background:#fff;
        border-bottom:5px solid #FF7A1A;
        box-sizing:border-box;
        z-index:5;
      }

      .az-mode-tabs{
        display:flex;
        gap:10px;
        justify-content:center;
        align-items:center;
        width:100%;
        max-width:520px;
      }

      .az-mode-tab{
        flex:1;
        min-height:44px;
        padding:8px 14px;
        border-radius:22px;
        border:3px solid #e6e9ef;
        background:#f9fafc;
        color:#233044;
        font:inherit;
        font-weight:800;
        font-size:16px;
        cursor:pointer;
        transition:transform .16s ease, background .16s ease, border-color .16s ease;
        -webkit-tap-highlight-color:transparent;
      }

      .az-mode-tab.active{
        background:#FF7A1A;
        color:#fff;
        border-color:#FF7A1A;
        transform:scale(1.03);
        box-shadow:0 5px 0 #E65100;
      }

      .az-workspace{
        flex:1;
        min-height:0;
        display:flex;
        flex-direction:column;
        gap:10px;
        padding:10px;
        box-sizing:border-box;
        overflow:hidden;
      }

      .az-left-panel,
      .az-right-panel{
        flex:0 0 auto;
        min-height:0;
        display:flex;
        flex-direction:column;
        gap:10px;
        box-sizing:border-box;
      }

      .az-left-panel{
        order:1;
      }

      .az-main{
        order:2;
        flex:1 1 auto;
        min-height:0;
        position:relative;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:0;
        box-sizing:border-box;
      }

      .az-right-panel{
        order:3;
      }

      .az-panel-section{
        background:rgba(255,255,255,.92);
        border:2px solid rgba(36,45,66,.08);
        border-radius:22px;
        padding:10px;
        box-shadow:0 8px 22px rgba(31,45,61,.06);
        box-sizing:border-box;
      }

      .az-panel-title{
        display:flex;
        align-items:center;
        justify-content:space-between;
        margin:0 0 8px;
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

      .az-panel-row::-webkit-scrollbar{
        display:none;
      }

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

      #azTplRow .az-cat-btn{
        min-width:64px;
        font-size:30px;
        display:grid;
        place-items:center;
        padding:6px 12px;
      }

      .az-canvas-wrap{
        position:relative;
        width:100%;
        height:100%;
        min-height:260px;
        background:#fff;
        border:7px solid #222;
        border-radius:26px;
        box-shadow:0 16px 38px rgba(0,0,0,.14);
        overflow:hidden;
        transition:background .25s ease;
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
        padding:10px;
        background:#fffbf5;
        box-sizing:border-box;
      }

      .az-coloring-wrap svg{
        width:100%;
        height:100%;
        max-width:100%;
        max-height:100%;
        overflow:visible;
      }

      .az-coloring-wrap .fillable{
        cursor:pointer;
        transition:fill .34s ease, opacity .12s ease;
        pointer-events:fill;
      }

      .az-coloring-wrap .fillable:active{
        opacity:.7;
      }

      .az-coloring-wrap.az-done svg{
        animation:az-glow-bounce .7s cubic-bezier(.2,1.4,.35,1) forwards;
        filter:drop-shadow(0 0 10px #FFD700) drop-shadow(0 0 22px #FF9800) drop-shadow(0 0 36px #FF5722);
      }

      @keyframes az-glow-bounce{
        0%{transform:scale(1)}
        40%{transform:scale(1.12)}
        70%{transform:scale(.97)}
        100%{transform:scale(1.08)}
      }

      .az-complete-banner{
        position:absolute;
        left:50%;
        bottom:16px;
        transform:translateX(-50%);
        display:flex;
        gap:10px;
        z-index:200;
        white-space:nowrap;
        animation:az-banner-up .42s cubic-bezier(.2,1.4,.35,1) both;
      }

      @keyframes az-banner-up{
        from{opacity:0;transform:translateX(-50%) translateY(20px)}
        to{opacity:1;transform:translateX(-50%) translateY(0)}
      }

      .az-cbtn{
        padding:13px 18px;
        border-radius:18px;
        border:none;
        font:inherit;
        font-size:16px;
        font-weight:900;
        cursor:pointer;
        box-shadow:0 5px 0 rgba(0,0,0,.15);
      }

      .az-cbtn.next{
        background:#FF7A1A;
        color:#fff;
        box-shadow:0 5px 0 #E65100;
      }

      .az-cbtn.retry{
        background:#fff;
        color:#555;
      }

      .az-palette-row,
      .az-stamp-row,
      .az-size-group,
      .az-icon-btns{
        display:flex;
        gap:8px;
        overflow-x:auto;
        overflow-y:hidden;
        scrollbar-width:none;
        -webkit-overflow-scrolling:touch;
        padding:2px 2px 6px;
      }

      .az-palette-row::-webkit-scrollbar,
      .az-stamp-row::-webkit-scrollbar,
      .az-size-group::-webkit-scrollbar,
      .az-icon-btns::-webkit-scrollbar{
        display:none;
      }

      .az-color-circle{
        width:54px;
        height:54px;
        flex:0 0 54px;
        border-radius:50%;
        border:4px solid #fff;
        box-shadow:0 5px 12px rgba(0,0,0,.12);
        cursor:pointer;
        transition:transform .15s ease, border-color .15s ease;
        box-sizing:border-box;
        -webkit-tap-highlight-color:transparent;
      }

      .az-color-circle.active{
        transform:scale(1.14) translateY(-4px);
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

      .az-stamp-circle{
        width:56px;
        height:56px;
        flex:0 0 56px;
        border-radius:18px;
        border:4px solid #edf0f5;
        background:#fff;
        display:grid;
        place-items:center;
        font-size:30px;
        cursor:pointer;
        box-shadow:0 5px 0 rgba(0,0,0,.09);
        transition:transform .15s ease, border-color .15s ease, background .15s ease;
        -webkit-tap-highlight-color:transparent;
      }

      .az-stamp-circle.active{
        border-color:#FF7A1A;
        background:#fff3e0;
        transform:scale(1.08);
      }

      .az-size-btn{
        min-width:58px;
        height:50px;
        flex:0 0 auto;
        border-radius:18px;
        border:3px solid #edf0f5;
        background:#fff;
        color:#233044;
        font:inherit;
        font-size:13px;
        font-weight:900;
        cursor:pointer;
        box-shadow:0 4px 0 rgba(0,0,0,.08);
        -webkit-tap-highlight-color:transparent;
      }

      .az-size-btn.active{
        border-color:#FF7A1A;
        background:#fff3e0;
        color:#FF7A1A;
      }

      .az-icon-btns{
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
      }

      .az-icon-btn{
        width:100%;
        height:54px;
        border-radius:18px;
        border:none;
        background:#f5f7fb;
        font:inherit;
        font-size:25px;
        font-weight:900;
        box-shadow:0 5px 0 #dce1ea;
        cursor:pointer;
        -webkit-tap-highlight-color:transparent;
      }

      .az-icon-btn:active,
      .az-size-btn:active,
      .az-cat-btn:active,
      .az-stamp-circle:active{
        transform:translateY(2px);
      }

      .az-done-btn{
        width:100%;
        min-height:60px;
        border-radius:20px;
        background:#FF7A1A;
        color:#fff;
        font:inherit;
        font-size:20px;
        font-weight:900;
        border:none;
        box-shadow:0 6px 0 #E65100;
        cursor:pointer;
        -webkit-tap-highlight-color:transparent;
      }

      .az-done-btn:active{
        transform:translateY(3px);
        box-shadow:0 2px 0 #E65100;
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

      .az-stamp-pop{
        position:absolute;
        z-index:220;
        pointer-events:none;
        font-size:72px;
        line-height:1;
        transform:translate(-50%,-50%) scale(.4) rotate(-10deg);
        animation:az-stamp-pop .48s cubic-bezier(.2,1.5,.35,1) forwards;
      }

      @keyframes az-stamp-pop{
        0%{opacity:0;transform:translate(-50%,-50%) scale(.3) rotate(-12deg)}
        38%{opacity:1;transform:translate(-50%,-50%) scale(1.25) rotate(5deg)}
        68%{transform:translate(-50%,-50%) scale(.95) rotate(-2deg)}
        100%{opacity:0;transform:translate(-50%,-50%) scale(1.06) rotate(0)}
      }

      .az-exhibit-overlay{
        position:absolute;
        inset:0;
        z-index:300;
        display:grid;
        place-items:center;
        padding:20px;
        background:rgba(27,35,55,.48);
        backdrop-filter:blur(8px);
        animation:az-exhibit-fade .22s ease-out both;
      }

      @keyframes az-exhibit-fade{
        from{opacity:0}
        to{opacity:1}
      }

      .az-exhibit-card{
        width:min(94vw,520px);
        max-height:min(88vh,760px);
        overflow:auto;
        border-radius:34px;
        background:linear-gradient(180deg,#fffaf0 0%,#fff 100%);
        border:6px solid #fff;
        box-shadow:0 18px 0 rgba(0,0,0,.22),0 28px 60px rgba(0,0,0,.28);
        padding:18px;
        display:grid;
        gap:14px;
        text-align:center;
        animation:az-exhibit-pop .34s cubic-bezier(.2,1.35,.35,1) both;
      }

      @keyframes az-exhibit-pop{
        from{transform:translateY(22px) scale(.92);opacity:0}
        to{transform:translateY(0) scale(1);opacity:1}
      }

      .az-exhibit-title{
        font-size:clamp(22px,6vw,34px);
        font-weight:900;
        color:#2d2d2d;
      }

      .az-exhibit-frame{
        border-radius:26px;
        padding:14px;
        background:linear-gradient(135deg,#FFD36E 0%,#FF9F1C 42%,#F76B1C 100%);
        box-shadow:inset 0 4px 0 rgba(255,255,255,.45),0 10px 0 rgba(120,70,0,.18);
      }

      .az-exhibit-frame img{
        display:block;
        width:100%;
        max-height:46vh;
        object-fit:contain;
        border-radius:18px;
        background:#fff;
        border:5px solid #fff6d6;
      }

      .az-exhibit-actions{
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:8px;
      }

      .az-exhibit-btn{
        min-height:54px;
        border-radius:18px;
        border:0;
        background:#f2f4f8;
        color:#233044;
        font:inherit;
        font-size:clamp(13px,3.6vw,17px);
        font-weight:900;
        box-shadow:0 5px 0 rgba(0,0,0,.14);
        cursor:pointer;
      }

      .az-exhibit-btn.primary{
        background:#FF7A1A;
        color:#fff;
        box-shadow:0 5px 0 #E65100;
      }

      .az-exhibit-btn:active{
        transform:translateY(3px);
        box-shadow:0 2px 0 rgba(0,0,0,.14);
      }

      @media (max-width:767px), (orientation:portrait) {
        .az-root{
          overflow:hidden;
        }

        .az-topbar{
          min-height:58px;
        }

        .az-workspace{
          overflow:hidden;
        }

        .az-left-panel{
          max-height:138px;
          overflow:auto;
          padding-bottom:2px;
        }

        .az-right-panel{
          max-height:210px;
          overflow:auto;
          padding-bottom:max(4px,env(safe-area-inset-bottom));
        }

        .az-panel-title{
          font-size:13px;
          margin-bottom:6px;
        }

        .az-panel-section{
          padding:8px;
          border-radius:18px;
        }

        .az-left-panel .az-panel-section,
        .az-right-panel .az-panel-section{
          flex:0 0 auto;
        }

        .az-main{
          min-height:300px;
        }

        .az-canvas-wrap{
          min-height:300px;
        }

        .az-finish-section{
          padding-bottom:8px;
        }
      }

      @media (min-width:768px) and (min-height:600px) and (orientation:landscape) {
        .az-topbar{
          min-height:60px;
          padding:8px 18px;
        }

        .az-mode-tabs{
          max-width:560px;
        }

        .az-mode-tab{
          min-height:46px;
          font-size:18px;
          border-radius:24px;
        }

        .az-workspace{
          display:grid;
          grid-template-columns:220px minmax(0,1fr) 220px;
          grid-template-rows:minmax(0,1fr);
          gap:14px;
          padding:14px;
        }

        .az-left-panel,
        .az-right-panel{
          order:initial;
          min-height:0;
          height:100%;
          overflow-y:auto;
          overflow-x:hidden;
          padding:10px;
          border-radius:26px;
          background:rgba(255,255,255,.78);
          border:2px solid rgba(36,45,66,.08);
          box-shadow:0 16px 38px rgba(31,45,61,.08);
          backdrop-filter:blur(8px);
        }

        .az-left-panel{
          grid-column:1;
        }

        .az-main{
          order:initial;
          grid-column:2;
          min-width:0;
          min-height:0;
          height:100%;
        }

        .az-right-panel{
          grid-column:3;
        }

        .az-panel-section{
          background:#fff;
          border-radius:22px;
          padding:10px;
          box-shadow:0 7px 18px rgba(31,45,61,.06);
        }

        .az-panel-title{
          font-size:15px;
          margin-bottom:9px;
        }

        .az-panel-row,
        .az-palette-row,
        .az-stamp-row,
        .az-size-group{
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:9px;
          overflow:visible;
          padding:0;
        }

        .az-cat-btn{
          width:100%;
          min-width:0;
          min-height:64px;
          padding:8px;
          font-size:17px;
          border-radius:18px;
        }

        #azTplRow .az-cat-btn{
          min-height:76px;
          min-width:0;
          font-size:36px;
        }

        .az-color-circle{
          width:100%;
          height:auto;
          aspect-ratio:1/1;
          flex:auto;
          border-width:5px;
        }

        .az-stamp-circle{
          width:100%;
          height:auto;
          aspect-ratio:1/1;
          flex:auto;
          font-size:36px;
          border-radius:22px;
        }

        .az-size-btn{
          width:100%;
          min-width:0;
          height:56px;
          font-size:15px;
          border-radius:18px;
        }

        .az-icon-btns{
          display:grid;
          grid-template-columns:1fr;
          gap:10px;
          padding:0;
          overflow:visible;
        }

        .az-icon-btn{
          height:62px;
          font-size:30px;
          border-radius:20px;
        }

        .az-done-btn{
          min-height:70px;
          font-size:23px;
          border-radius:24px;
        }

        .az-canvas-wrap{
          width:100%;
          height:100%;
          min-height:0;
          border-width:10px;
          border-radius:34px;
          box-shadow:0 18px 42px rgba(0,0,0,.16);
        }

        .az-coloring-wrap{
          padding:18px;
        }

        .az-complete-banner{
          bottom:20px;
        }
      }

      @media (min-width:1024px) and (min-height:680px) and (orientation:landscape) {
        .az-workspace{
          grid-template-columns:260px minmax(0,1fr) 260px;
          gap:16px;
          padding:16px;
        }

        .az-panel-section{
          padding:12px;
        }

        .az-cat-btn{
          min-height:70px;
          font-size:18px;
        }

        #azTplRow .az-cat-btn{
          min-height:84px;
          font-size:40px;
        }

        .az-icon-btn{
          height:66px;
        }

        .az-done-btn{
          min-height:74px;
        }
      }

      @media (max-height:500px) and (orientation:landscape) {
        .az-topbar{
          min-height:46px;
          padding:4px 12px;
          border-bottom-width:3px;
        }

        .az-mode-tab{
          min-height:34px;
          padding:4px 12px;
          font-size:13px;
          border-width:2px;
        }

        .az-workspace{
          display:grid;
          grid-template-columns:170px minmax(0,1fr) 170px;
          gap:8px;
          padding:8px;
        }

        .az-left-panel,
        .az-right-panel{
          height:100%;
          min-height:0;
          overflow-y:auto;
          overflow-x:hidden;
          padding:0;
        }

        .az-panel-section{
          padding:6px;
          border-radius:14px;
        }

        .az-panel-title{
          font-size:11px;
          margin-bottom:5px;
        }

        .az-panel-row,
        .az-palette-row,
        .az-stamp-row,
        .az-size-group{
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:6px;
          overflow:visible;
          padding:0;
        }

        .az-cat-btn{
          min-width:0;
          min-height:42px;
          font-size:12px;
          padding:4px;
          border-width:2px;
          border-radius:12px;
        }

        #azTplRow .az-cat-btn{
          min-height:46px;
          font-size:23px;
        }

        .az-color-circle,
        .az-stamp-circle{
          width:100%;
          height:auto;
          aspect-ratio:1/1;
          flex:auto;
          border-width:3px;
        }

        .az-stamp-circle{
          font-size:22px;
          border-radius:14px;
        }

        .az-size-btn{
          min-width:0;
          width:100%;
          height:38px;
          font-size:11px;
          border-radius:12px;
          border-width:2px;
        }

        .az-icon-btns{
          display:grid;
          grid-template-columns:1fr;
          gap:6px;
          padding:0;
          overflow:visible;
        }

        .az-icon-btn{
          height:40px;
          font-size:20px;
          border-radius:12px;
        }

        .az-done-btn{
          min-height:42px;
          font-size:15px;
          border-radius:14px;
        }

        .az-canvas-wrap{
          min-height:0;
          border-width:4px;
          border-radius:16px;
        }
      }
    `;
    document.head.appendChild(s);
  }

  function render(container, options = {}) {
    destroy(false);

    state.container = container;
    state.options = options;
    state.tab = 'free';
    state.mode = 'free';
    state.paintHistory = [];
    state.coloringCompleted = false;
    state.activeStamp = null;
    state.destroyed = false;
    state.currentColor = '#FF4444';
    state.currentSize = 16;
    state.isRainbow = false;
    state.hue = 0;

    injectStyle();

    container.innerHTML = `
      <div class="az-root">
        <div class="az-topbar">
          <div class="az-mode-tabs">
            <button type="button" class="az-mode-tab active" data-tab="free">🎨 자유 그리기</button>
            <button type="button" class="az-mode-tab" data-tab="coloring">🌈 색칠 팡팡</button>
          </div>
        </div>

        <div class="az-workspace">
          <div class="az-left-panel">
            <section class="az-panel-section free-section">
              <div class="az-panel-title">배경 고르기</div>
              <div class="az-panel-row" id="azThemeRow">
                ${Object.keys(THEMES).map((k) => `<button type="button" class="az-cat-btn${k === state.activeTheme ? ' active' : ''}" data-theme="${k}">${THEMES[k].label}</button>`).join('')}
              </div>
            </section>

            <section class="az-panel-section coloring-section" style="display:none;">
              <div class="az-panel-title">색칠 그림</div>
              <div class="az-panel-row" id="azTplRow">
                ${COLORING_TEMPLATES.map((t) => `<button type="button" class="az-cat-btn${t.id === state.activeTemplateId ? ' active' : ''}" data-tpl="${t.id}" aria-label="${t.name}">${t.emoji}</button>`).join('')}
              </div>
            </section>

            <section class="az-panel-section free-section">
              <div class="az-panel-title">도장 찍기</div>
              <div class="az-stamp-row" id="azStampRow">
                ${STAMPS.map((stamp) => `<button type="button" class="az-stamp-circle" data-stamp="${stamp}" aria-label="도장 ${stamp}">${stamp}</button>`).join('')}
              </div>
            </section>
          </div>

          <div class="az-main">
            <div class="az-canvas-wrap" id="azCanvasWrap">
              <canvas id="azCanvas"></canvas>
              <div class="az-coloring-wrap" id="azColoringWrap"></div>
            </div>
          </div>

          <div class="az-right-panel">
            <section class="az-panel-section">
              <div class="az-panel-title">색깔 고르기</div>
              <div class="az-palette-row" id="azPaletteRow">
                ${COLORS.map((color) => `<button type="button" class="az-color-circle${color.c === 'rainbow' ? ' az-rainbow' : ''}${state.currentColor === color.c ? ' active' : ''}" ${color.c !== 'rainbow' ? `style="background:${color.c}"` : ''} data-color="${color.c}" data-name="${color.n}" aria-label="${color.n}"></button>`).join('')}
              </div>
            </section>

            <section class="az-panel-section free-section">
              <div class="az-panel-title">펜 굵기</div>
              <div class="az-size-group" id="azSizeGroup">
                <button type="button" class="az-size-btn" data-size="6">작음</button>
                <button type="button" class="az-size-btn active" data-size="16">중간</button>
                <button type="button" class="az-size-btn" data-size="32">크다</button>
              </div>
            </section>

            <section class="az-panel-section">
              <div class="az-panel-title">도구</div>
              <div class="az-icon-btns" id="azToolButtons">
                <button type="button" class="az-icon-btn free-section" id="azEraser" aria-label="지우개">🧽</button>
                <button type="button" class="az-icon-btn coloring-section" id="azUndo" style="display:none;" aria-label="되돌리기">↩️</button>
                <button type="button" class="az-icon-btn" id="azClear" aria-label="전체 지우기">🗑️</button>
              </div>
            </section>

            <section class="az-panel-section az-finish-section">
              <button type="button" class="az-done-btn" id="azDone">다 그렸어요! ✨</button>
            </section>
          </div>
        </div>
      </div>
    `;

    initCanvas();
    bindEvents();
    installResizeHandler();

    requestAnimationFrame(() => {
      resizeCanvasPreserve(true);
      applyThemeBg();
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
        speak(THEMES[state.activeTheme].label + '이야!');
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
        state.activeStamp = null;

        if (!state.isRainbow) {
          state.currentColor = color;
        }

        if (state.mode === 'eraser') {
          state.mode = 'free';
        }

        root.querySelectorAll('.az-color-circle, .az-stamp-circle').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        speak(btn.dataset.name + '!');
        if (navigator.vibrate) navigator.vibrate(25);
      };
    });

    root.querySelectorAll('.az-stamp-circle').forEach((btn) => {
      btn.onclick = () => {
        state.activeStamp = btn.dataset.stamp;
        state.isRainbow = false;
        state.mode = 'free';

        root.querySelectorAll('.az-color-circle, .az-stamp-circle').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        speak('도장 준비됐어.');
        if (navigator.vibrate) navigator.vibrate(25);
      };
    });

    root.querySelectorAll('.az-size-btn').forEach((btn) => {
      btn.onclick = () => {
        state.currentSize = parseInt(btn.dataset.size, 10) || 16;
        root.querySelectorAll('.az-size-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });

    document.getElementById('azEraser').onclick = () => {
      state.mode = 'eraser';
      state.activeStamp = null;
      root.querySelectorAll('.az-stamp-circle').forEach((b) => b.classList.remove('active'));
      speak('지우개로 슥싹.');
    };

    document.getElementById('azUndo').onclick = () => {
      const last = state.paintHistory.pop();
      if (last && last.el) {
        last.el.setAttribute('fill', last.prev);
      }
    };

    document.getElementById('azClear').onclick = () => {
      if (state.tab === 'coloring') {
        const cw = document.getElementById('azColoringWrap');
        state.coloringCompleted = false;
        cw?.classList.remove('az-done');
        cw?.querySelector('.az-complete-banner')?.remove();
        cw?.querySelectorAll('.fillable').forEach((el) => el.setAttribute('fill', '#FFF'));
        state.paintHistory = [];
        speak('괜찮아. 다시 색칠해볼까?');
      } else {
        clearFreeCanvas();
        speak('깨끗하게 지웠어.');
      }
    };

    document.getElementById('azDone').onclick = () => {
      state.options.fireConfetti?.();
      state.options.gainExp?.(state.tab === 'coloring' ? 20 : 10);
      speak('우와. 멋진 그림이야. 전시회에 걸어볼게.', true);
      showArtExhibition();
    };

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

      if (state.activeStamp) {
        placeStamp(pos.x, pos.y);
        return;
      }

      state.isDrawing = true;
      state.ctx.globalCompositeOperation = state.mode === 'eraser' ? 'destination-out' : 'source-over';
      state.ctx.beginPath();
      state.ctx.moveTo(pos.x, pos.y);

      if (canvas.setPointerCapture) {
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
    };

    const drawMove = (e) => {
      if (!state.isDrawing || state.tab !== 'free' || state.activeStamp) return;
      e.preventDefault();

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

  function clearFreeCanvas() {
    if (!state.canvas || !state.ctx) return;
    const rect = getCanvasCssRect();
    state.ctx.clearRect(0, 0, rect.width, rect.height);
  }

  function switchTab(tab) {
    state.tab = tab;
    state.mode = 'free';
    state.activeStamp = null;
    state.coloringCompleted = false;

    const isFree = tab === 'free';

    document.getElementById('azCanvas').style.display = isFree ? 'block' : 'none';
    document.getElementById('azColoringWrap').style.display = isFree ? 'none' : 'flex';

    state.container.querySelectorAll('.free-section').forEach((el) => {
      el.style.display = isFree ? '' : 'none';
    });

    state.container.querySelectorAll('.coloring-section').forEach((el) => {
      el.style.display = isFree ? 'none' : '';
    });

    state.container.querySelectorAll('.az-color-circle, .az-stamp-circle').forEach((b) => b.classList.remove('active'));
    const firstColor = state.container.querySelector(`.az-color-circle[data-color="${state.currentColor}"]`);
    if (firstColor) firstColor.classList.add('active');

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
    wrap.querySelector('.az-complete-banner')?.remove();
    wrap.innerHTML = tpl.svg;

    const svg = wrap.querySelector('svg');
    if (svg) {
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.style.cssText = 'width:100%;height:100%;max-width:100%;max-height:100%;overflow:visible;';
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
      const cw = document.getElementById('azColoringWrap');
      if (!cw || cw.querySelector('.az-complete-banner')) return;

      const banner = document.createElement('div');
      banner.className = 'az-complete-banner';
      banner.innerHTML = `
        <button type="button" class="az-cbtn retry">다시 색칠하기 🔄</button>
        <button type="button" class="az-cbtn next">다음 그림 🌈</button>
      `;

      banner.querySelector('.retry').onclick = () => {
        state.coloringCompleted = false;
        cw.classList.remove('az-done');
        banner.remove();
        cw.querySelectorAll('.fillable').forEach((el) => el.setAttribute('fill', '#FFF'));
        state.paintHistory = [];
        speak('괜찮아. 다시 해보자.');
      };

      banner.querySelector('.next').onclick = () => {
        const idx = COLORING_TEMPLATES.findIndex((t) => t.id === state.activeTemplateId);
        const next = COLORING_TEMPLATES[(idx + 1) % COLORING_TEMPLATES.length];

        state.activeTemplateId = next.id;
        state.coloringCompleted = false;

        state.container.querySelectorAll('[data-tpl]').forEach((b) => {
          b.classList.toggle('active', b.dataset.tpl === next.id);
        });

        renderColoringTemplate(next);
        speak(`${next.name}을 같이 색칠해볼까?`);
      };

      cw.appendChild(banner);
    }, 850);
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

  function placeStamp(x, y) {
    if (!state.ctx) return;

    state.ctx.save();
    state.ctx.globalCompositeOperation = 'source-over';
    state.ctx.font = '68px serif';
    state.ctx.textAlign = 'center';
    state.ctx.textBaseline = 'middle';
    state.ctx.fillText(state.activeStamp, x, y);
    state.ctx.restore();

    showStampPop(x, y, state.activeStamp);
    createMagicParticle(x, y, state.activeStamp);

    if (navigator.vibrate) navigator.vibrate(45);
  }

  function showStampPop(x, y, stamp) {
    const wrap = document.getElementById('azCanvasWrap');
    if (!wrap || !stamp) return;

    const el = document.createElement('div');
    el.className = 'az-stamp-pop';
    el.textContent = stamp;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    wrap.appendChild(el);
    timer(() => el.remove(), 520);
  }

  async function buildSnapshot() {
    const w = state.canvas?.width || 600;
    const h = state.canvas?.height || 600;
    const out = document.createElement('canvas');

    out.width = w;
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
    return new Promise((resolve) => {
      try {
        const clone = svg.cloneNode(true);
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.setAttribute('width', String(w));
        clone.setAttribute('height', String(h));
        clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
          type: 'image/svg+xml;charset=utf-8',
        });

        const url = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = () => {
          ctx.drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(url);
          resolve();
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };

        img.src = url;
      } catch (_) {
        resolve();
      }
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
      <div class="az-exhibit-card" role="dialog" aria-modal="true">
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

    overlay.querySelector('[data-action="continue"]').onclick = () => {
      overlay.remove();
      speak('조금 더 꾸며볼까?', true);
    };

    overlay.querySelector('[data-action="restart"]').onclick = () => {
      overlay.remove();

      if (state.tab === 'coloring') {
        const tpl = COLORING_TEMPLATES.find((t) => t.id === state.activeTemplateId);
        renderColoringTemplate(tpl);
      } else {
        clearFreeCanvas();
        applyThemeBg();
      }

      speak('새 그림을 시작해볼까?', true);
    };

    overlay.querySelector('[data-action="home"]').onclick = () => {
      overlay.remove();
      state.options.closeToParkHome?.();
    };
  }

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
      '새 그림을 시작해볼까?': 'games.paint.new',
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