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
        <circle class="fillable" cx="50" cy="100" r="6" stroke="#333" stroke-width="4"