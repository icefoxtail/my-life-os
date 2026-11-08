# 2차 통합 검수 작업 기록

- 통합 담당: GPT6_ASTRA_ROOT
- 기준 main: `58eb1fad34bba957812b08cf55bdf28c5595ca60`
- 자동차 taskId: `2e058ca8-0f08-4bf4-bff8-c05bfe8610b5`
- 기차 taskId: `6e320e78-0909-4eea-943c-d9daeadd3d36`

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

## 미완료

기차 실제구현·콘텐츠독립검사·입력/모바일검수, 자동차 복원후 게임회귀, PR/CI/main병합, 실제운영 확인.

## 모델 보존과 독립 검수 게이트

- 기차 모델의 원격 SHA: `c97153de1cf595d38b1a32543df59fe93a43c199`. 모델·작성자 검사·TRAIN_WORKLOG 3개 blob을 원격에서 대조하고 worktree fast-forward를 완료했다.
- 모델 SHA-256: `aff31cb58d8ba2fae9d83e6596e71224aa355ee200d116136d7ebb021bd1c8a9`.
- 작성자 검사 205건, 독립 모델 29그룹/1,645 assert/14,684 보드 판정 PASS를 통합 담당자도 직접 재실행했다.
- 최초 오수락165개·손상 저장 예외·history 추가 필드 주입·주기 보고 결함은 최초 실패 JSON으로 보존하고 수정 뒤 결과와 구분한다.
- `.github/workflows/playground-checks.yml`에 작성자 모델 검사와 독립 oracle을 필수 명령으로 추가했다. 실제 원격 CI 실행 결과는 PR 생성 후 별도로 확인한다.
- AWCR r3 업로드/readback: `70de9df2808be0a8028cce53d4200bcca3ef894690fb062552a3e19f635c3008`.
- 현재 범위는 모델·상태 복원 검수다. UI, 음성/실패 대체, 세로·가로 실플레이, 완제품 메뉴 공개, PR/main/운영 확인은 미완료다.
- nextAction: 첫 UI checkpoint를 보존한 뒤 실제 메뉴·공용 수명주기·캐시에 통합하고 네 연령의 화면 세션과 실패 복구를 검수한다.
