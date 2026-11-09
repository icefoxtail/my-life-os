# 매직 그림판 색칠 도안 스타일 가이드

기준 도안: `js/games/art-zone.js`의 `police`(v2). 새 도안과 리디자인은 모두 이 기준에 맞춘다.
미리보기·자동 점검: `scripts/qa-art-preview.html` (`?ids=…`, `?drafts=…`, `?parts=1`)

## 목표
- 아이가 한눈에 "아, 경찰차!" 하고 알아본다. 주인공 사물의 대표 특징(경광등, 사다리, 십자 표시, 바가지, 코 …)을 크게 그린다.
- 손가락으로 쉽게 칠한다. 칠할 부위는 크고 의미가 있어야 한다(차체·창문·바퀴·경광등).
- 27개 도안이 한 세트처럼 보인다. 선 굵기·비율·여백을 통일한다.

## 캔버스
- `viewBox="0 0 240 180"`, `stroke-linejoin="round" stroke-linecap="round"`
- 그림이 차지하는 범위는 대략 x 16~224, y 18~162. 주인공을 가운데에 둔다.
  (게임이 getBBox로 자동 확대·중앙 정렬하지만, 비율과 균형은 그리는 쪽에서 맞춘다.)
- 옆모습 탈것은 오른쪽을 향한다. 바퀴 아래쪽이 y ≈ 157~162.

## 선
- 외곽선(주요 덩어리: 차체, 몸통, 바퀴): `stroke="#333" stroke-width="4"`
- 내부 칠 영역(창문, 등, 휠, 줄무늬): `stroke-width="3"`
- 장식 선은 `<g class="az-illustration-details" pointer-events="none" stroke="#333" stroke-width="2.5" fill="none">` 안에 맨 마지막에 둔다(문 경계선, 손잡이, 별, 눈, 수염 등). 작은 검정 채움(`fill="#333" stroke="none"`)도 이 그룹에 넣는다.
- 모서리는 둥글게(rect rx, path Q 곡선). 뾰족한 모서리는 피한다.

## 칠 영역 (`.fillable`)
- 모든 칠 영역: `class="fillable" data-part="<id>" … fill="#FFF"`
- 도안당 **6~14개**.
- 최소 크기: bbox 짧은 변 ≥ 12, 면적 ≥ 그림 전체 bbox의 1.2%(미리보기에서 ⚠로 표시). 이보다 작은 장식은 칠 영역으로 만들지 말고 장식 그룹으로 그린다.
- 겹치는 경우 위에 그려진 요소가 터치를 받는다. 큰 덩어리 → 그 위의 부위 순서로 그린다(차체 → 줄무늬 → 배지, 바퀴 → 휠).
- 문서 순서 = 저장 index 순서다. 한 번 배포한 버전의 칠 영역 순서·개수는 바꾸지 않는다. 바꾸려면 version을 올린다.

## data-part 이름
- 영문 소문자 snake_case, 사물 기준 의미 이름: `body`, `cabin`, `window_front`, `window_rear`, `tire_front`, `hub_front`, `light_red`, `ladder`, `cross`, `scoop`, `mane`, `cone` …
- 좌우/앞뒤가 있으면 `_front/_rear`, `_left/_right`, 여러 개면 `_1`, `_2`.
- 도안 안에서 중복 금지. `constructor`, `toString` 같은 예약어 금지.

## 메타데이터
```js
{
  id: 'ambulance', name: '구급차', emoji: '🚑',
  version: 2,                       // 리디자인이면 이전 version + 1, 신규 도안은 1
  parts: {                          // SVG의 data-part와 정확히 같은 키 집합
    body: { ko: '차체', en: 'body', color: '#FFF8E7' },
    …
  },
  svg: `<svg …>…</svg>`,
  legacy: { 1: `이전 svg 원문 그대로` },   // 리디자인일 때만. 한 글자도 바꾸지 않는다.
}
```
- `color`는 반드시 팔레트 값: `#1A1A1A #FF4444 #FF9900 #FFD700 #44CC44 #4488FF #1E40AF #9944FF #FF88CC #FFF8E7 #F6E7C8 #C0C0C0 #8EF6D1 #8B5A2B #7ED957`
- 추천 색으로 칠했을 때 실제 사물처럼 보여야 한다(구급차는 흰 차체 + 빨간 십자, 소방차는 빨간 차체).
- 기존 도안을 유지만 할 때(그림이 이미 충분히 좋을 때)는 SVG를 바꾸지 않는다. version을 올리지 않고 data-part와 parts만 추가할 수 있다(칠 영역 순서·개수가 그대로일 때만).

## 반려 기준
- 원본보다 알아보기 어렵거나 덜 귀엽다.
- 칠 영역이 너무 작거나 많아서 아이가 정확히 누르기 어렵다.
- 선 굵기나 비율이 기준 도안과 어긋난다.
- 이름(한/영)과 그림이 맞지 않는다.
