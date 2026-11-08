# 패턴 기차 공작소 — 구현 및 검증 경계

## 제품과 통합 계약

게임은 프레임워크를 추가하지 않은 정적 HTML/CSS/SVG/JavaScript 모듈이다. 실제 조립물은 객차의 그림으로 남고, 출발 시 객차 전체가 레일을 지나며 반복 위치를 강조한다. 도착 뒤 같은 작품을 고치거나 다음 정거장·자유 공작으로 간다. 점수, 제한 시간, 실패 처벌은 없다.

- 공용 게임 API: `window.SihyeonGames.patternTrain.render(container, options)`, `destroy()`, 읽기 전용 `getSnapshot()`.
- 공용 옵션: `say`, `fireConfetti`, `closeToParkHome`, `ageMode`. 공용 나이 설정이 있으면 `SihyeonPlaySettings`의 나이와 변경 이벤트를 사용한다.
- 로딩 순서: `js/games/pattern-train-model.js` → `js/games/pattern-train.js`.
- CSS: `css/games/pattern-train.css`, link id `sihyeon-pattern-train-style`.
- 메뉴 그림: `assets/games/pattern-train/card.svg`.
- 통합 소유자는 메뉴/게임 진입/종료 목록/서비스워커/CI를 연결한다. 제품 모듈은 자체 홈·다시하기·안내·음소거를 제공한다.

## 읽기 없이 할 수 있는 조립

반복 묶음은 그림 순서와 반복 화살표로 제시한다. 부품은 색만으로 구분하지 않고 색 블록의 모양, 친숙한 기하 도형, 직접 그린 동물 얼굴을 사용한다. 부품을 탭한 뒤 빈 객차를 탭하거나, 부품을 객차로 끈다. 이미 놓은 부품을 다른 부품으로 바꾸고, 꺼내고, 서로 옮기고, 한 단계 되돌릴 수 있다.

첫 빈 객차가 화면 밖이면 진입 후 그 객차로 이동한다. 긴 기차를 작은 그림으로 전체 축소하지 않고, 작업 가능한 객차 크기를 유지하는 가로 스크롤과 44px 좌우 이동 영역을 쓴다. 짧은 가로 화면은 팔레트를 2열 측면에 둔다. 소리 없이도 동일한 그림 묶음·대응표·부품·빈 자리·출발 버튼으로 진행할 수 있다.

런타임의 기관차·객차·바퀴·친구·도형·작업 도구는 inline SVG와 CSS다. 게임 핵심 그림에는 `<img>` 요청이 없다. 메뉴 SVG 로드 실패는 공용 메뉴의 처리 범위이며, 게임 안의 조립 그림 네트워크 실패와 구분한다.

## 콘텐츠와 수학적 계약

추천 연령과 도전 선택은 분리되어 있다. 4세 추천 설정에서도 7세 도전을 고를 수 있고 반대로도 가능하다. 네 추천 도전마다 5개 정거장, 총 20개 활동을 제공한다.

| 추천 | 활동 ID | 실제 규칙/활동 | 객차 |
|---|---|---|---:|
| 4 | a4-first | AB, 마지막 한 칸 채우기 | 6 |
| 4 | a4-colors | AB, 떨어진 두 빈칸 | 6 |
| 4 | a4-middle | AB, 가운데 복원 | 6 |
| 4 | a4-extend | AB, 뒤로 이어 만들기 | 8 |
| 4 | a4-pair | AB, 앞뒤 세 자리 | 8 |
| 5 | a5-aab | AAB | 6 |
| 5 | a5-abb | ABB | 6 |
| 5 | a5-abc | ABC 이어 만들기 | 8 |
| 5 | a5-abba | ABBA | 8 |
| 5 | a5-aabb | AABB | 8 |
| 6 | a6-aabc | AABC 이어 만들기 | 12 |
| 6 | a6-abcc | ABCC 여러 칸 복원 | 12 |
| 6 | a6-abac | ABAC, 도형→동물 대응 | 8 |
| 6 | a6-copy | 내가 만든 3칸 묶음을 3회 복제 | 9 |
| 6 | a6-abbc | ABBC, 색→동물 대응 | 8 |
| 7 | a7-unit | ABA의 최소 반복단위 찾기 | 9 |
| 7 | a7-unit-four | ABCB의 최소 반복단위 찾기 | 12 |
| 7 | a7-alternative | AABB와 같은 재료로 다른 동일성 구조 만들기 | 12 |
| 7 | a7-ambiguous | 명시한 길이 2/3/4 안에서 가능한 여러 완성 인정 | 8 |
| 7 | a7-abacbc | ABACBC 이어 만들기 | 12 |

`showUnit` 문제는 위에 실제 보이는 묶음도 정답 제약으로 검사한다. 대응 활동은 화살표 그림으로 대응을 명시하고 그 대응을 검사한다. 빈 객차만의 단서에서 알 수 없는 부분을 숨은 정답으로 강제하지 않는다.

복수 해석 활동은 표시한 반복 길이의 후보를 모두 열거한다. 해당 단서에서 유효한 완성 배열 4개를 모두 인정한다. 다른 규칙 만들기는 재료별 수량과 기호 동일성 구조를 함께 검사하므로 AABB→BBAA처럼 색 이름만 바꾼 구조를 새 규칙으로 처리하지 않는다. ABAB와 ABBA 등의 실제 다른 구조는 인정한다.

자유 공작은 색·모양·동물별 2~12칸을 마음대로 만든다. 빈칸을 안내하지만 완성 배열의 반복 정오 채점은 하지 않는다(`graded:false`).

## 상태·저장·입력

모델은 DOM이 없는 순수 상태 전이를 제공한다. BUILDING에서만 조립/출발하고, RUNNING에서는 추가 편집·출발이 일어나지 않는다. 도착 후 ARRIVED에서 편집으로 돌아갈 수 있다. 이전 상태를 바꾸지 않으며 undo는 최근 24개의 board/seed/chosenPeriod만 갖는다.

저장 prefix는 `sihyeon-pattern-train-v1:`이다. `board:<taskId>`로 과제별 작품을, `preferences`로 도전·진행 정거장·음소거·자유 테마를 저장한다. 쓰기 전에 최신 메모리를 갱신하고 읽을 때 같은 페이지의 메모리를 우선한다. 따라서 `getItem`만 되고 `setItem`이 거부되는 환경에서 오래된 저장본이 최신 작업을 덮지 않는다. 실제 쓰기 실패 시에만 재진입 저장의 한계를 화면에 표시한다.

복원은 크기·재료·단서·상태·테마·undo를 검사한다. 임의 메타 필드는 복원하지 않는다. 진행 중 운행은 편집 가능한 BUILDING으로 주차하고 예전 타이머를 재개하지 않는다. 게임 파괴 시 입력 리스너·타이머·음성·드래그 유령을 정리한다.

드래그는 Pointer Events의 유효한 마지막 drop에서 한 번만 적용된다. 취소/화면 밖 drop/캡처 손실은 원본을 유지한다. 보조 포인터가 나타난 제스처는 모든 포인터가 끝날 때까지 격리하고 끝난 뒤 늦은 click도 차단한다. 정상적인 새 primary 제스처는 창 밖에서 끝난 입력의 고립 상태를 회복한다.

## 검증 도구와 결과의 범위

- `node scripts/qa-pattern-train-model.cjs`: 구현자 모델 회귀, 205 cases.
- `node scripts/qa-pattern-train-independent.cjs`: 독립 oracle, 29그룹·1,645 assert·14,684 보드 판정. 독립 검수자가 관리한다.
- `node scripts/qa-pattern-train-ui-independent.cjs`: 실제 제품 UI closure를 제어 VM에서 검수한다. 레이아웃·물리 입력을 검증하는 도구는 아니다. 독립 검수자가 관리한다.
- `scripts/qa-pattern-train.html`: 실제 게임만 직접 여는 브라우저 fixture. 의도적으로 음성 false를 반환하여 시각 대체를 확인한다.
- `scripts/qa-pattern-train.html?autotest=1`: 구현자 실제 브라우저 DOM/합성 Pointer Event/운행/새 문서 복원/6개 iframe 크기 검사. 결과는 `#qa-results`에 구조화 JSON으로 나타난다. 검사 전 저장값을 보관하고 종료 시 원래 값으로 돌린다.

실제 Chrome 조작과 화면 증거, 운영 배포 확인은 통합 담당자가 별도로 기록한다. 뷰포트 에뮬레이션·합성 Pointer Events·제어 VM·실제 휴대폰 및 스피커 청취는 서로 다른 검증 범위이며 대체 PASS로 쓰지 않는다. 최신 실행 결과·원격 SHA는 WORKLOG 및 독립 결과 파일을 기준으로 한다.
