# 2차 통합 검수 작업 기록

- 통합 담당: GPT6_ASTRA_ROOT
- 기준 main: `58eb1fad34bba957812b08cf55bdf28c5595ca60`
- 자동차 taskId: `2e058ca8-0f08-4bf4-bff8-c05bfe8610b5`
- 기차 taskId: `6e320e78-0909-4eea-943c-d9daeadd3d36`

## 현재 확인된 체크포인트 — 2026-11-08

| 작업 | 원격에서 파일까지 확인한 commit | PR | AWCR |
|---|---|---|---|
| 자동차 | `47f86ac50a078f95a59d7698e88d3cffcb848f0b` | #5 draft | revision 5 |
| 기차 | `96c84f938d8058ef2cd24029de2d0efe9ca014c8` | #6 draft | revision 5 |

main은 아직 기준 SHA이며 병합·운영 검수 전이다. 각 기록의 SHA는 그 기록을 작성하기 전에 원격에서 확인한 커밋이다. 이후 추가 커밋은 원격 브랜치와 append-only AWCR의 검증된 최신 revision을 조회한다.

- 자동차: 138개 조사 완료, 20개 원본 복원 및 독립 시각/전달 byte 검수 보존. 숫자세기 6수량×6뷰포트 36조건에서 5개 묶음 테두리 높이 불일치를 발견·수정했고 재검은 36/36 PASS. 나머지 원본 개별 정비와 전수 회귀 진행 중.
- 기차: 20개 활동, 모델 작성자205건/독립14,684보드 판정, UI 13그룹252 assert PASS. 실제 브라우저 첫 실행에서 ARRIVED 상태의 도전 버튼 잠금이 후속 조작을 막는 문제를 발견하여 수정. 최초 FAIL JSON과 수정 후 독립 재검을 분리 보존했다. 네 연령 전체 실브라우저 재실행 중이며 아직 브라우저 전체 PASS가 아니다.
- 이 두 정확한 head의 GitHub Playground checks는 각각 run `42446882134`, `42446906519`에서 success를 확인했다.
- 자동차 AWCR r5: raw SHA-256 `d106df1fb7be09b787352ff706dcb2d63e67f6af26b79f60d4a87032ac6d869a`, Drive `176AfkF7JP6fVDndlDyAY5AGOg-QDTf1s`.
- 기차 AWCR r5: raw SHA-256 `83f905dc24d3c66ffc264d133e48f4a0bdfbd2984c01803c366c9798a8b6ab02`, Drive `1eKbg7MzlZjQQbz0LOiXGlWqUZ-nmYRVU`.
- 두 AWCR 모두 업로드 뒤 원본 bytes·revision·schema·predecessor SHA readback 검증을 마쳤다.
- nextAction: 진행 중 실제 브라우저 결과를 보존하고 발견사항 수정 → 직접 드래그/여섯 화면 및 기존 게임 격리 회귀 → 메뉴 공개 → PR 검증/main 병합 → 운영 사이트 실플레이.

## 복구와 원격 저장

초기 원격 작업기록: 자동차 `dc42230223749628e294eb05cb902bce6ff6a188`, 기차 `449d33e5bb4e320be02076facff56c2a45b38a75`.
차량 전수조사 원격: `c3705d9752d6439d9b423ee162829cdafa6cf15e`. 138파일 inventory·원본9시트·시각판정과 조사스크립트의 Git blob이 원격tree와 모두 일치한다.

일반 CLI push는 인증정보 부재로 실패했다. 연결된 GitHub 도구의 blob→tree→commit→update_ref(expected_sha,force:false)로 동일 고정브랜치에 저장하고, 원격 HEAD 및 변경한 모든 파일의 blob SHA를 검증한다. 로컬은 정확한 게시파일을 stage한 뒤 fetch+merge --ff-only하여 동기화한다. force push/reset --hard/브랜치삭제를 사용하지 않는다.

AWCR 자동차 r2 raw SHA256: `a6647a01309ba523e021e98025ec85ee64edbce4e6d9741e68edfa4affeb2e9e`, Drive `1a7UuetaHh4fsKNEhVWWxk17EpO3NzyQe`. 기차 r1 raw SHA256: `e1cf936cf067a432cbef5c9d69c4b9e415580f397d126795199a38ba59584668`, Drive `1Mclw1SgujBC18LX1LPpN55spDZQvHja7`. 업로드파일 원본byte readback 및 schema 검증 완료.

## 변경 전 자동 검사

`BASELINE_CHECKS.json`에 11개 기존 검사 명령의 실제 stdout/exitCode를 보존했다. 모두 exit0이다. 이 결과는 변경 후 검증이나 실기기 PASS가 아니다.

## 브라우저 환경

일반 Playwright Chromium은 프로세스 singleton socket EPERM으로 실행 실패. 샌드박스 밖 로컬서버 실행은 자동승인정책에서 거절되어 사용하지 않았다. Cloud 브라우저는 file: URL을 허용하지 않아 그 경로를 사용하지 않았다. 별도 headless 다운로드는 유효ZIP을 받지못해 중단했다.

공식 `sites-preview start`가 제공한 HTTP 미리보기에서는 실제 앱 메뉴가 정상 열렸다. 공유 Linux Chromium을 CUA로 조작한다. `scripts/qa-phase2-responsive.html`은 같은 실제 앱 iframe을 여섯 뷰포트로 바꾸는 검수페이지다. 물리 스마트폰·OS회전·멀티터치·음성실청취와 구분한다.

초기 실제 메뉴→숫자놀이터→몇 대일까에서 지게차8대의 모두 나타난 상태를 확인했다. 등장 애니메이션 중5대만 보이는 순간은 최종상태로 판정하지 않았다. baseline screenshot은 자동차브랜치 `docs/qa/sihyeon-phase2/browser/count-baseline-desktop.png`에 보존한다.

## 당시 미완료 — 초기 통합 시점

이 아래는 각 체크포인트 당시의 기록이다. 현재 상태와 남은 작업은 위 최신 체크포인트 및 각 범위 WORKLOG를 기준으로 한다.

## 모델 보존과 독립 검수 게이트

- 기차 모델의 원격 SHA: `c97153de1cf595d38b1a32543df59fe93a43c199`. 모델·작성자 검사·TRAIN_WORKLOG 3개 blob을 원격에서 대조하고 worktree fast-forward를 완료했다.
- 모델 SHA-256: `aff31cb58d8ba2fae9d83e6596e71224aa355ee200d116136d7ebb021bd1c8a9`.
- 작성자 검사 205건, 독립 모델 29그룹/1,645 assert/14,684 보드 판정 PASS를 통합 담당자도 직접 재실행했다.
- 최초 오수락165개·손상 저장 예외·history 추가 필드 주입·주기 보고 결함은 최초 실패 JSON으로 보존하고 수정 뒤 결과와 구분한다.
- `.github/workflows/playground-checks.yml`에 작성자 모델 검사와 독립 oracle을 필수 명령으로 추가했다. 실제 원격 CI 실행 결과는 PR 생성 후 별도로 확인한다.
- AWCR r3 업로드/readback: `70de9df2808be0a8028cce53d4200bcca3ef894690fb062552a3e19f635c3008`.
- 현재 범위는 모델·상태 복원 검수다. UI, 음성/실패 대체, 세로·가로 실플레이, 완제품 메뉴 공개, PR/main/운영 확인은 미완료다.
- nextAction: 첫 UI checkpoint를 보존한 뒤 실제 메뉴·공용 수명주기·캐시에 통합하고 네 연령의 화면 세션과 실패 복구를 검수한다.

## 첫 실플레이와 통합 진행

- 첫 UI 원격 SHA `9131e6d7c6708d22d7b03fb2bd1457af38c7f6b0`에서 JS/CSS/card SVG/fixture/작업로그 5개를 원격 blob 대조하고 로컬 fast-forward했다.
- 실제 Chromium 390×844 프레임에서 4세 첫 판: 고양이를 잘못 놓고 출발 → 오답은 보드에 유지 → 객차의 개별 꺼내기 → 토끼 선택/배치 → 출발 중 편집 잠금 → 기차 운행 후 도착 및 고쳐 만들기/다음 역 UI를 확인했다. 음성은 이 fixture에서 의도적으로 false를 반환하며 시각 대체 문구가 나타났다.
- 초기에는 빈6번 객차가 화면 밖에 있어 첫 행동이 불명확했다. 첫 빈칸 자동 이동, 44px 스크롤 조작 영역, 6칸 가이드와 꺼내기 버튼 배치를 후속 보완했다. 초기/도착 화면은 `browser/train-4-first-layout-390.png`, `browser/train-4-arrived-390.png`에 보존한다.
- 수정 UI SHA256 `25804a309bc79f71a3837c06b2aff8a709064d069a4b6aa0d3eb12fbe42252a9`: 독립 실제 closure의 12그룹/230 assert PASS. 합성 포인터와 저장/음성 실패 주입 결과이며 실제 물리 터치나 음성 청취 결과가 아니다. 최초 다중 포인터 긴 hold 실패도 별도 JSON으로 보존한다.
- 공용 index에 model→UI 로드, 스타일, 실행 함수, 종료 목록을 연결했다. **메뉴 카드는 아직 추가하지 않았다.** 서비스워커 캐시136개와 경계검사를 통과했고 새4개 기차 경로를 포함했다. 기존 게임의 load order/자산을 보존했다.
- 초안 PR https://github.com/icefoxtail/my-life-os/pull/6 생성. 원격 CI는 별도 확인하며 아직 병합 준비 완료가 아니다.
- AWCR r4 raw SHA256 `ab7e6a1374327efa97516e6bc6e9660c91249ff7445e6a240ddf4b652a8ae57c` upload/readback 완료.
- nextAction: 수정 스냅샷에서 작성자 브라우저 자동 검사와 네 연령 실제 세션/6개 프레임/복원 검수, 최종 메뉴 공개 및 PR/main/운영 확인.

## 전체 브라우저 PASS 후 메뉴 통합 준비

- 원격 `233cd17789d2db6c225315a9cbefae229ecd5f11`까지 모델 누락 시 귀가 경로와 공용 정리를 보존했다. 독립 UI 15그룹314 assert PASS이며 정상/모델누락/UI누락 및 기존9개 모듈 정리를 실제 index 함수로 검사했다.
- 이전 정확한 preview commit `96c84f938d8058ef2cd24029de2d0efe9ca014c8`에서 네 연령 각5판 전체와 편집/복구/여섯뷰포트 **23/23 PASS**. 상세 범위는 `TRAIN_BROWSER_REVIEW.md`, 원시 JSON과 Git/preview 파일대조는 browser/의 해당 SHA 자료를 따른다.
- 이 검증 뒤 고정 기차 브랜치의 숫자놀이터에 카드와 5세 추천·4~7세 지원 설명을 추가했다. 아직 draft PR이며 운영 main에는 노출하지 않았다. 메뉴 포함 index에서도 static 및 독립 UI 15/314 PASS.
- 남은 순서: 최신 모델누락 fallback의 실제 브라우저 검사와 메뉴 직접 조작/복귀 → 최종 독립검수/CI/PR → main 병합 → Pages와 운영 실플레이. 실제 휴대폰 미검증 상태는 유지한다.
