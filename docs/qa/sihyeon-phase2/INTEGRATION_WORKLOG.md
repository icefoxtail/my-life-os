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
