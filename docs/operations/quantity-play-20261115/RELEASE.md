# 시현이 놀이터 수량·SVG·꽃 정원·연산 운영 반영

2026-11-15에 계획의 네 단계를 각각 브랜치에서 검증하고, PR → main → GitHub Pages → 실제 운영 화면 순서로 반영했다. 기능 배포 기준 main은 `25bc1494caeacc821f1aa3f97cd80e7d77aa3154`다.

- 운영 주소: https://icefoxtail.github.io/my-life-os/index.html
- 사용 안내: [USER-GUIDE.md](USER-GUIDE.md)
- 원래 실행 계획: [PLAN.md](PLAN.md)
- 단계별 상태와 근거: [CURRENT.json](CURRENT.json)
- 독립 범위 대조: [SCOPE-REVIEW.md](SCOPE-REVIEW.md)

## 단계별 운영 결과

| 단계 | 제공한 기능 | PR | 검증한 브랜치 head | main merge |
| --- | --- | --- | --- | --- |
| 1 | 원하는 그림과 0–30을 고르는 자동 숫자놀이 | [#25](https://github.com/icefoxtail/my-life-os/pull/25) | `b5713ea9a457a1ed3c8eacfa612e3d3004db0a9e` | `8029e1c9c66f93d3b2339013cbaba502c3f22e36` |
| 2 | SVG 참고 색상, 특공대 SUV, 내 색칠 작품으로 숫자놀이 | [#26](https://github.com/icefoxtail/my-life-os/pull/26) | `b3cbb03d2bfdbbd7db6c666134ae6b5f52af288e` | `463263652e35ab903a724b504bb7db683909027c` |
| 3 | 열 칸 꽃 정원, 다음 열 채우기, 두 색 분해 | [#27](https://github.com/icefoxtail/my-life-os/pull/27) | `ab4fe0502a4139572093ba85e122d50c9e83f497` | `1ee1761e4f5660c6a98b7c7c0e59158146437b6d` |
| 4 | 서로 다른 그림 덧셈, 균등 나누기와 나머지 | [#28](https://github.com/icefoxtail/my-life-os/pull/28) | `a62669e4776df97aa01bd24a309d5c8f309d7387` | `25bc1494caeacc821f1aa3f97cd80e7d77aa3154` |

각 merge의 전체 Git tree가 해당 단계에서 CI를 통과한 head의 tree와 같음을 확인했다. 단계 사이 병합도 [merge-preflight.json](merge-preflight.json)에 기록한 것처럼 다음 단계의 검증된 tree와 일치했다. GitHub가 base 변경 직후 일시적으로 반환한 `mergeable: null/false`는 다시 조회해 `clean/true`를 확인한 뒤 병합했으며, 강제 병합이나 보호 규칙 변경은 하지 않았다.

## 실제 놀이 동작

**내가 만드는 숫자놀이:** 경찰차와 9를 고르면 9대가 즉시 모두 나타나고 자동으로 하나씩 강조하며 센다. 소방차 15대도 같은 방식이다. 하나·둘 / 일·이와 기존 영어 듣기 설정을 사용한다. 전체 선택 수와 지금 세는 수를 구분하고, +1/−1, 줄·열 묶음·흩어 배치를 지원한다.

**SVG와 작품 연결:** 기존 27종 SVG와 저장 판본을 보존하고 특공대 SUV 도안을 추가했다. 28종을 실제 렌더하고 289개 색칠 영역을 확인했다. 추천색은 읽기 전용 참고 그림으로 보여 주며, 내 그림을 덮어쓰지 않는다. 색칠 후 ‘내 그림 숫자 놀이’로 보낸 작품의 색은 돌아오기와 새로고침 후에도 유지된다.

**열 칸 꽃 정원:** 0–30송이를 열 칸 화단 1–3개로 보여 준다. 내 숫자·자유 정원·열 칸 채우기·두 색 꽃을 지원한다. 15에서 열 칸 채우기를 시작하면 고른 수 15와 목표 20을 유지하며 16–20을 이어 센다. 두 색의 수를 바꾸어도 전체 수는 유지된다.

**그림으로 더하고 나누기:** 두 항의 그림을 각각 고르고 합이 30 이하인 덧셈을 만든다. 나누기는 전체 0–30개를 1–6곳에 한 바퀴씩 균등하게 이동시킨다. 15개를 4곳에 나누면 각 3개, 나머지 3개다. 3개를 5곳에 나누면 각 0개, 나머지 3개로 보존한다. 소수나 불균등 분배로 바꾸지 않는다.

## 검증 근거

| 구분 | 결과와 근거 |
| --- | --- |
| PR CI | 네 단계 모두 Playground checks와 Phase 2 browser release 성공. [1단계](ci/stage1-ci.json), [2단계](ci/stage2-ci.json), [3단계](ci/stage3-ci.json), [4단계](ci/stage4-ci.json) |
| 최종 숫자놀이 | 20/20 PASS, 페이지 오류 0. [원본 보고서](ci/number-picture-browser.json) |
| 최종 꽃 정원 | 14/14 PASS, 페이지 오류 0. [원본 보고서](ci/ten-frame-garden-browser.json) |
| 최종 덧셈·나누기 | 19/19 PASS, 페이지 오류 0. [원본 보고서](ci/picture-arithmetic-browser.json) |
| 수 모델 | 유효 덧셈 496조합, 균등 나누기 186조합, 꽃 정원 620상태. 연산 Node 검증 855 assertions |
| 화면 | 세로·가로·태블릿·데스크톱을 포함하는 놀이별 6개 viewport. 320×568의 그림/버튼, 가로 선택판, 현재 세는 그림과 나머지 가시성 확인 |
| 기존 기능 | 차량·우체국·기차·그림판 저장·영어 듣기·메뉴 음성·한국어/영어 클릭 음성·홈 안내·서비스 워커 기존 검증 통과 |
| Pages | 단계별 build/deploy 성공. 공개 서버 파일 8/5/5/5개를 해당 merge의 바이트 및 SHA-256과 대조해 모두 일치 |
| 운영 화면 | 실제 메뉴와 버튼으로 경찰차 9대, 소방차 15대, 내가 칠한 SUV 15대, 정원 15→20, 9+6, 15÷4를 확인 |

브라우저 수량 검사는 공유 음성 엔진을 교체하지 않고, `speechSynthesis`의 하부 완료 이벤트만 fixture로 제어한다. 변경/취소/설정/홈/재진입/새로고침/저장 실패와 늦은 콜백을 확인한다. 실제 버튼 클릭 시점을 기준으로 이전 자동 세기와 새 실행을 구분하며, 검증 종료 후 저장 실패 fixture가 제거된 것도 확인한다.

기존 음성 전수 검사는 현재 실제 도안 registry와 갤러리의 일치를 검사한 뒤 전 도안·16색을 한국어/영어로 확인한다. 이전 음성 사전의 비노출 `helicopter` 별칭 제외 규칙은 유지했다. 검증 개수는 도안 27개에서 28개로 늘어난 상태를 반영하며 검증 대상을 줄이지 않았다.

### 운영 화면과 파일 대조

| 단계 | 서버 바이트 대조 | 실제 UI 관찰 | 화면 |
| --- | --- | --- | --- |
| 1 | [pages.json](production/stage1/pages.json) | [live.json](production/stage1/live.json) | [경찰차 9대](production/stage1/police-nine.jpg), [소방차 15대](production/stage1/fire-fifteen.jpg) |
| 2 | [pages.json](production/stage2/pages.json) | [live.json](production/stage2/live.json) | [참고 그림](production/stage2/suv-reference.jpg), [내 SUV 15대](production/stage2/own-suv-fifteen.jpg) |
| 3 | [pages.json](production/stage3/pages.json) | [live.json](production/stage3/live.json) | [15→20 꽃 채우기](production/stage3/garden-fill-twenty.jpg) |
| 4 | [pages.json](production/stage4/pages.json) | [live.json](production/stage4/live.json) | [9+6](production/stage4/add-nine-six.jpg), [15÷4](production/stage4/share-fifteen-four.jpg) |

## 확인 범위와 남은 제한

구현·필수 자동 검증·네 단계의 운영 배포 확인은 완료했다. 실제 Android/iPhone 기기와 스피커로 발음·음량을 듣는 검증은 `NOT_RUN`이다. 운영 확인에 사용한 클라우드 브라우저에서는 음성 사용 불가 안내와 함께 그림·숫자 자동 진행이 정상적으로 이어지는 것을 확인했다. 이를 실제 기기 음성 청취 PASS로 표시하지 않는다.

계속 열어 둔 브라우저는 배포 직후 이전 리소스를 잠시 표시할 수 있었다. 일반 새로고침 후 신규 도안과 메뉴가 표시됐고 기존 저장 작품을 초기화하지 않았다. 다른 진행 중 PR의 내용은 이번 단계에 포함하지 않았다.

이후 작업은 이 운영 기준과 저장된 결과를 출발점으로 사용하며, 이미 끝낸 네 단계의 구현을 다시 시작하지 않는다.
