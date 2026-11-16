# 차량 표시 / Pixi 최종 운영 독립 검토

## 판정

**지정된 차량 표시 및 Pixi 입력·종료 검토 범위 PASS.** 최종 제품 main `b6719ff833f25e5a7c8dec45c53abe0ce71bc0c7`를 대상으로 공개 Pages에서 차량 10/10파일과 Pixi 4/4파일의 SHA256 일치를 확인한 뒤, 같은 공개 URL에서 차량 38/38 및 Pixi 7/7 브라우저 검사가 통과했다. 두 운영 검사에서 공유하는 `index.html`과 `sw.js` hash도 같아 동일 릴리스에 결속된다. 중복을 제외하면 공개 runtime 파일은 12개다.

검토자는 `/root/live_status`이며 구현 및 원격 게시 담당과 분리되었다. 직접 산출물을 내려받아 ZIP digest, 결과 JSON, 동결 소스 hash와 대표 스크린샷을 확인했다. 이 문서는 해당 집중 검토의 결과이며 기존 전체 보존 회귀의 종합 상태는 운영 `REPORT.md`에서 관리한다.

대상 서비스: [시현이 놀이터](https://icefoxtail.github.io/my-life-os/index.html). 최종 제품 tree는 `5f21cd1b9a419332f14941a2815caa9d040970a2`이며 통합 검토 후보 `a0fd765f230894f600cfcb572cc1f6c315349dc3`와 동일하다.

## 최종 공개 운영 증거

| 항목 | 차량 | Pixi |
| --- | --- | --- |
| Actions 실행 | [43869275111](https://github.com/icefoxtail/my-life-os/actions/runs/43869275111) | [43869274835](https://github.com/icefoxtail/my-life-os/actions/runs/43869274835) |
| 운영 job | `133305830413` | `133305829185` |
| 운영 완료 UTC | 2026-11-16 12:48:02 | 2026-11-16 12:49:29 |
| 운영 완료 KST | 2026-11-16 21:48:02 | 2026-11-16 21:49:29 |
| artifact | `14225984995` | `14226992203` |
| 공개 파일 expected=actual | 10/10 | 4/4 |
| 공개 URL 브라우저 결과 | 38/38 PASS | 7/7 PASS |
| pageErrors | 0 | 0 |
| artifact source hash와 동결 소스 대조 | 14/14 일치 | 6/6 일치 |

원본 ZIP SHA256:

- 차량: `3c05a531fb866a9c49415bf164936f5e0b1a2aa3e3bb8c1f04af86414c96670c`
- Pixi: `c95f4318456f15ef9c0791309294cad674893be57c73bea9b94545e65582ba5d`

운영 artifact의 `deployed-runtime.json`은 실제 공개 파일 SHA256을 기록한다. 차량의 `independent-vehicle-browser.json` 및 Pixi의 `pixi-vehicle-browser.json`/`pixi-vehicle-sources.json`이 같은 배포 대상에서의 행동 검사를 기록한다. 차량 검사 소스는 실행 전후 동일하다. 공개 hash 대기의 50분 예산은 일치 조건을 완화하지 않는다.

## 공개 runtime SHA256

아래 값은 최종 checkout 예상값, 공개 URL 실제 응답, 독립 검토 동결 소스와 일치한다.

| 파일 | SHA256 |
| --- | --- |
| `sw.js` | `3131903ec96ff7702a265c6c550cf8a74d9741872b0b8280650fb33b7fc01893` |
| `index.html` | `90716f1288694d1866eeaaf8c9f14d3d16513c15fa3f5d97980fc9c548cfe38f` |
| `assets/vehicles/display_bounds.json` | `e6c95664c2cec6d00e39a2d44d3835046976d6a83ce20e925ac5e65b094acb3a` |
| `js/vehicle-display.js` | `21b7b08965d92dec8398efe6fd305fb7975d7dd2f20844a1d5b5326ea4d02d02` |
| `js/games/number-count.js` | `347c12c5e268e2b850e6a00583b709dffa395802c3ba28b463c1b85bb06584e5` |
| `js/games/vehicle-memory.js` | `d6363cc79ca1440d0e2f8d9dc27b4c3718bfb1f3f57c8e8e950bc346160b7507` |
| `js/games/parking-lot.js` | `c3728be0956c8b1e761896f6e3ef1ab15f8c2317575a71c02871e87742b23b70` |
| `js/games/construction-site.js` | `a8fe63447c3410624451f1dbdffb2cc25831883f85d1bae502973d4a453e94c3` |
| `js/games/megaDispatch.js` | `6d09721bf28440f8b4d579c204ba04ebe5f26c76b03c897a0b40f47c9017d725` |
| `js/games/coding-car.js` | `3c61599f67809531dd660ed321243067ac3d29d5a1267d47d8445c66f7a11d17` |
| `js/engine/pixi-runtime.js` | `16ddfbd826ce9d8f4ece06b872338f0280b9e972f01f21d218aeb7f18ade8d02` |
| `js/games-pixi/number-vehicles-pixi.js` | `394a3445e8bb5f4e18f380174bc28306bddb1f0dc45fd1b4090c214039eb4a90` |

## 차량 표시 검사 범위

승인 정본의 현재 76개 이미지 바이트를 checkout 기준으로 대조하고, 공개 URL의 전체 138개 이미지를 실제 디코드하여 alpha≥16 가시 영역과 metadata를 대조했다. 각 이미지에 6가지 셀 모양을 적용한 828회 SVG 배치에서 균일 배율, 안전 여백, 가시 영역의 프레임 내 포함, 반복 적용/복원과 오류 fallback을 확인했다. 현재 이미지 원본 바이트 및 clean39 선택 규칙은 유지되었다.

별도로 숫자 세기, 차량 기억, 주차장, 공사장, 소방대, 코딩 자동차의 6게임 × 6화면 크기인 36개 대표 화면을 검사했다. 크기는 390×844, 844×390, 640×360, 768×1024, 1024×768, 1280×800이다. 첫 후보에서 발견된 공사장 1024×768의 4px overflow는 수정되었고, 최종 운영에서 세 선택 버튼이 x=738/right=1008에 위치하여 오른쪽 16px 여백을 확보하며 모두 hit=true다. 성공 스크린샷에서도 카드와 차량이 온전히 표시됨을 직접 확인했다.

138개 이미지를 각각 36개 게임 화면 전부에 띄운 조합 검사는 아니다. memory 초기 캡처는 카드 뒷면이므로 차량 얼굴의 육안 증거로 계산하지 않는다. coding은 기존 내부 진입점으로 검사했고 새 공개 메뉴를 추가하지 않았다.

## Pixi 검사 범위

실제 Chromium에서 관찰된 Pixi 버전은 8.22.0이다. 소방차·경찰차·구급차 각각 KO mouse 및 EN touch로 6개 사례를 실행했다. 잘못된 부품을 놓았을 때 복귀, 올바른 7개 부품 조립, 출동 버튼 입력, 완료 안내 정확히 1회, 완료 애니메이션 중 종료·재진입을 확인했다. 별도 1개 사례에서 로딩 및 드롭 도중 종료·재진입을 확인했다. 모든 사례에서 pageerror가 없었으며, 이전 runtime의 ticker/timer=0, 새 canvas=1, 새 부품=7, 새 placed=0 상태를 확인했다.

초기 원격 실행의 파괴 객체 좌표 쓰기는 실제 runtime을 이용한 독립 Node 재현으로 확인했고, 수정 후 position/scale 두 경로에서 폐기 좌표 쓰기 0·ticker 0·Promise 정상 종료를 확인했다. 최종 공개 runtime은 그 수정본 SHA256과 같다. 앞선 실패, 수정 및 원인 구분은 [후보 독립 검토](CANDIDATE_INDEPENDENT_REVIEW.md)와 `pixi-retired-animation-5444e33.json`에 보존했다.

## 최종 운영 스크린샷 직접 검토

아래 다섯 PNG를 최종 운영 artifact에서 직접 열어 확인했다. SHA256은 원본 파일의 값이다.

| artifact | PNG | 직접 확인 내용 | SHA256 |
| --- | --- | --- | --- |
| `14225984995` | `construction-1024x768.png` | 선택 카드 3개와 차량 전체, 우측 16px 여백 | `f834ddba0847f20fea8018a62af2f7fab125a6badfb35ef12600b5fd35bfb7f1` |
| `14225984995` | `parking-640x360.png` | 주차칸 4개와 선택 차량 4개의 화면 내 표시 | `5a59134f35262d1b2c8b38bf60b3aa2f5ca98e6a3247008eba233100115ae6a1` |
| `14225984995` | `fire-768x1024.png` | 2×2 선택 차량 및 카드 프레임의 화면 내 표시 | `f43ff0eedef4fd6aa223614a5660cb5bb58c58173705ae5a1fd63ab6adf3be74` |
| `14226992203` | `completion-0-en.png` | 모바일 소방차 7부품 조립 및 완료 표시 | `dc2219a02b2b6df005e634b01ffef45b6812b3ecada542e81b4100cf936c5f38` |
| `14226992203` | `reentered-None-ko.png` | 종료·재진입 후 새 1/7 단계와 부품 7개 | `5bfb7e790351c41b6f817c6add1cfb69bf06efa31ec5b892eed2ed67156f78f4` |

## 판정의 한계

- 브라우저 touch 입력과 음성 발화 경로 기록을 검사했다. 물리 휴대전화/태블릿 사용과 스피커 청취는 수행하지 않았다. 운영 검사는 service worker를 차단한 새 브라우저 context에서 수행했다.
- Pixi 7시나리오는 완료 직후 종료 경합을 검사하므로, 출동 애니메이션 전체 재생 후 자동 다음 차량 전환 및 선택 장식 3개 배치 완주를 검증했다고 계산하지 않는다.
- 기존 원본 중 일부 배경무늬는 유지된다. 전체 차량 그림 재제작이나 모든 기존 UI 미관 개선을 완료했다고 해석하지 않는다. 기존 작은 공사장 화물 장면 및 코딩 세로 화살표 그림의 별도 개선거리는 후보 검토에 분리해 기록했다.
- Pixi와 coding의 내부 진입 검증은 새 공개 메뉴 제공을 뜻하지 않는다.
- 로컬 Chromium은 OS socket EPERM으로 실행하지 못했다. 위 실제 브라우저 판정은 GitHub Actions에서 공개 서비스에 실행한 결과와 내려받아 검토한 증거에 근거한다.
