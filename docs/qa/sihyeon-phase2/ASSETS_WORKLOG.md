# 자동차 이미지 2차 정비 — 작업 기록

- 저장소: icefoxtail/my-life-os
- 브랜치: `feat/sihyeon-vehicle-phase2-20261108`
- owner: `GPT6_ASTRA_SIHYEON_VEHICLE_PHASE2`
- AWCR taskId: `2e058ca8-0f08-4bf4-bff8-c05bfe8610b5`
- 기준 main SHA: `58eb1fad34bba957812b08cf55bdf28c5595ca60`
- 조사 시 원격 브랜치 SHA: `58eb1fad34bba957812b08cf55bdf28c5595ca60`
- 현재 단계: ASSET_REPAIR_AND_REGRESSION_IN_PROGRESS
- 기록 시간 기준: 2026-11-08 Asia/Seoul

## 실제 확인한 정본

최신 원격 main 및 두 고정 브랜치, 전체 원격 branch 목록, 최근 PR #1~#4, PR #4 본문·병합 상태, 전체 Git tree, 다음 현행 파일을 읽었다.

- docs/qa/vehicle-audit.md 및 vehicle-audit.json
- docs/qa/UPGRADE_RELEASE_QA.md
- docs/qa/post-office-browser-independent.md
- docs/qa/shared-code-independent-review.md
- docs/qa/final-integration-browser.md
- js/vehicle-display.js, js/games/number-post-office-model.js
- assets/vehicles/vehicles_manifest.json

`docs/qa/release/LIVE_DEPLOYMENT_QA.md`는 main에 없고, 기존 QA 브랜치 `qa/sihyeon-post-office-e1679bbd`의 `c6d3d658469921534f8e3f2b19436e4c49cb5003`에 있음을 확인해 읽었다. 저장소 내 AGENTS.md는 없다.

연속성 담당자가 Google Drive AWCR bootstrap v0.2와 Library 계획서 `SIHYEON_PLAYGROUND_MASTER_UPGRADE_PLAN_v2_4to7_20261107.md` 및 기존 감사 PDF를 실제 조회했다. 과거 2차 AWCR `691aea14-6f4f-4b5f-8bab-cb3b8f8d269d` r1/r2는 확인했으나 코드 Git SHA/검증 가능한 인계가 없어 합류하거나 완료 증거로 사용하지 않는다. 1차 taskId는 재사용하지 않는다.

## 복구 조사 결과

- 두 2차 브랜치 모두 main과 동일, main 대비 추가 커밋/파일 없음.
- 열린 PR 없음. 최근 완료 PR #4까지 확인.
- 접근 가능한 /workspace의 로컬 저장소에서 이전 my-life-os 작업 폴더를 찾지 못했다. 다른 프로젝트 작업 폴더는 변경하지 않았다.
- 현재 정식 clone의 stash 없음, 두 worktree는 서로 독립.
- Library에서는 요청 계획서와 1차 산출물을 찾았으나 2차 기차 코드·QA 복구물을 찾지 못했다.
- 조사 범위 밖 작업물이 없다고 단정하지 않는다. 확인 가능한 코드가 없으므로 최신 main에서 재구현한다.

## 완료

- 최신 원격 조회와 실제 1차 정본 읽기.
- 고정 브랜치와 독립 worktree 확보.
- 신규 AWCR taskId/owner를 범위별 분리.

## 마지막 검증

원격 main/두 브랜치 HEAD와 GitHub API SHA 일치. 초기 기록의 commit/push 및 원격 파일 readback은 이 파일 생성 직후 수행한다. 이 기록 자체는 구현 PASS가 아니다.

## 미완료

실제 구현, 전수 QA, 독립 검수, PR, main 병합, 운영 확인. AWCR 신규 revision upload/readback 대기.

## nextAction

초기 기록을 commit + push하고 원격 commit 및 파일 내용 readback을 확인한다. 이후 138개 원본과 사용처 조사, 전수 contact sheet 및 4분류 기록.

## 파일 소유권

자동차 구현은 차량 자산·공용 차량 표시·해당 QA만, 기차 구현은 기차 소스·패턴 데이터·기차 전용 자산만 수정한다. index.html/sw.js/공용 메뉴/공용 설정/CI는 통합 담당자만 수정한다. 검수자는 제품 파일을 덮어쓰지 않는다. force push, reset --hard, 브랜치 삭제 금지.

## 체크포인트 1 — 전체 원본 조사 완료

- 최초 원격 보존 SHA: `dc42230223749628e294eb05cb902bce6ff6a188`, GitHub에서 WORKLOG 전체 readback 확인.
- 완료: 129+9=138 고유파일 디코딩·SHA·치수·알파·사용처 조사, 원본9장 contact sheet 직접 시각 검토. 초기 4분류는 정비78/표시39/전체정상0/정밀21.
- 조사 코드: `scripts/vehicle-phase2-audit.py` (원본 read-only).
- 증거: `vehicle-inventory.json`, `vehicle-visual-review.json`, `VEHICLE_PHASE2_AUDIT.md`, `contact/vehicles-before-01.jpg`~`09.jpg`.
- 실제 원본 변경: 이 단계 0개. 1개 road_roller 생성 후보는 아직 미적용·검수 대기.
- 발견: 정비소는 공유래스터 대신 인라인SVG. 항타기·천공기·여객기는 원본 프레임 잘림, 특수차18개는 작고 일부 하단이 잘린 원본이므로 정밀검수.
- 미완료: 원본복원, 공용표시 보완, 기존39 회귀, 게임브라우저, PR/운영.
- nextAction: 조사 파일을 원격 저장한 뒤 첫 원본복원 후보를 흰/어둠/격자 배경에서 비교·검수, 작은 묶음 단위로 적용.

## 체크포인트 2 — 첫 원본 복원 5개

- 선행 원격 commit: `c3705d9752d6439d9b423ee162829cdafa6cf15e` (138개 조사/원본9시트 보존·원격 blob 검증).
- 실제 변경 원본: construction의 road_roller / asphalt_paver / grader / backhoe_loader / skid_steer_loader WebP **5개**.
- 각 원본을 직접 연 뒤 개별 Imagegen background-extraction 1회씩 수행. 원본 대비 흰/어둠/격자3배경 비교를 개별 확인하고 차량색·실루엣·장비·바퀴·유리·미러 유지, 표시규모에서 배경잔여/내부삭제 없음 확인.
- 검수후 출력은 PNG→WebP exact lossless 인코딩. 디코딩한 RGBA 전체 bytes가 생성본과 동일함을 검증. 원래 차량 내부픽셀까지 원본과 동일하다고 주장하지 않는다.
- `vehicle-imagegen-provenance.json`: 생성출력SHA, 기준원본SHA, 최종원본SHA, 실제편집프롬프트 규격 보존.
- `assets/vehicles/display_bounds.json`, `js/vehicle-display.js`에 새5개 가시경계 반영. 기존39 경계/픽셀 유지 확인. clean pool44개.
- Node 공용표시검사: 44×6=**264** 비율보존 조건 통과. 원래39 SHA 및 기존경계정확보존, 새5개 SHA/alpha경계 정합성, fallback·idempotence·cleanup 검증.
- 초기분류 보정: 독립검수에서 기존39 중 helicopter/submarine/garbage_truck의 기존잔여파편·선을 확인. 원본정상으로 묶지 않고 **정밀검토3개**로 전환. 현재분류는 정비78/표시36/정밀24이며, 정밀분류는 자동HOLD확정이 아니다.
- 미완료: 나머지 원본 개별복원, 생성후 독립시각QA, 공용게임표시, 브라우저회귀, PR/운영.
- nextAction: 첫5개를 원격저장하고 다음공사차4개 원본후보 개별복원·비교.

### 배포 크기 보강 — 첫5개 최종 형식

생성본1254²를 lossless그대로사용하면 개당629~826KB로 원본대비약20배가 되는비용회귀를 독립검수에서 발견했다. 최종게임전달본은 생성결과만 비율유지768²로리사이즈하고WebP quality92/method6로저장했다. 원본RGB의배경제거를외부알고리즘으로대체하지않는다.

5개최종파일은 road_roller79,764 / asphalt_paver87,146 / grader95,538 / backhoe_loader111,508 / skid_steer_loader97,730 bytes. 생성원본과전달본을3배경으로비교해 표시범위에서장비/타이어/유리/얇은부품의품질유지를확인했다. 전달인코딩의알파는리사이즈된생성본알파와정확일치한다. 기존lossless단계RGBA동일검증은중간후보검증이며최종전달본과구분한다. 최종SHA/치수/알파경계는inventory와provenance를기준으로한다.

## 체크포인트 3 — 장비 구조를 검증한 추가 3개

- 선행 원격 commit: `f5dbf870e9791925215b948769e2bfbd7fcbdd69` (첫5개/최종전달형식/독립검수 포함 23파일 원격 blob readback 및 로컬 동기화 완료).
- 실제 변경 원본: tower_crane / excavator_breaker / dump_loader 3개 추가, 누적 8개. 기존39 PNG는 이 단계까지 원본SHA/경계 유지.
- 구현자와 독립검수자가 원본/생성/768 WebP의 흰색·어두운색·격자3배경을 각각 확인했다. 타워크레인의 트러스·가이와이어·훅, 브레이커 호스·끝·궤도, 로더의 버킷이빨·리프트팔·타이어 유지 확인.
- mobile_crane 첫 후보는 원본에 없던 하부 지지발을 추가해 불승인했다. 원본 유지 및 불승인 비교/생성SHA를 `vehicle-rejected-candidates.json`에 저장. 다시 정밀 편집한다.
- 생성후 전달본을 그대로 복사하는 importer 옵션을 추가했다. 치수와 리사이즈 생성알파 완전일치를 검사하여 실제 시각검수한 bytes를 배포한다.
- 미완료: 나머지 원본복원·보류확정·전수비교·게임QA·PR/운영.
- nextAction: 추가3개 원격저장 후 공사용 트럭4개와 이동크레인 재시도 후보를 개별검수한다.

## 체크포인트 4 — 공사용 트럭 4개

- 선행 원격 commit: `b9103fde8cee451236a0d3f5040a07961aa994d4` (누적8개 원본복원과 공용표시, 30파일 원격 readback/로컬 동기화 확인).
- articulated_dump_truck / water_truck / sweeper_truck / fuel_truck 4개 개별복원·3배경 비교 통과. 흰탱크/흰차체를 보존하고 난간·사다리·배관·브러시를 유지했다. 구현 및 독립 시각검수 완료, 적용누적 12개.
- 생성출력의 비례768px 전달본 그대로 적용, 알파 readback 정확일치. 원본39 SHA와 metadata 보존, Node 51 clean×6=306 표시조건 PASS.
- 미완료: 남은 원본 개별복원 및 정밀보류판정, 전체회귀, PR/운영.
- nextAction: 원격 체크포인트 이후 트레일러·화물차·고소작업차·이동크레인 재시도 비교, 공항차량 개별정비.
