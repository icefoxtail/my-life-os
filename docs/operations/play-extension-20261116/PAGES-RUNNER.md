# Pages 실행기 대기 해소

## 관찰한 문제

1단계 main `6f6c739ee75cb215bf0a1768d62b50d649fa7a78`의 Playground checks와 두 Chromium 검사 작업은 성공했다. 자동 생성된 Pages run `43814182675`는 `ubuntu-latest` 실행기가 배정되지 않은 채 대기했고, 운영 UI 검사는 새 파일을 기다리다 종료되어 메뉴 검사를 실행하지 못했다.

같은 저장소의 `ubuntu-24.04` 작업들은 실행되는 것을 확인했다. GitHub 전체 장애나 정확한 실행기 용량 원인은 확인하지 않았다.

## 변경

`pages-pinned-runner.yml`은 현재 공개 사이트의 같은 main 소스를 `ubuntu-24.04`에서 배포한다. GitHub 공식 `upload-pages-artifact`와 `deploy-pages`를 확인한 commit SHA로 고정했다. 배포 직전 원격 main SHA가 실행 SHA와 같은지 확인해 새 main보다 오래된 이 워크플로의 배포를 건너뛴다.

- main push와 main의 수동 실행만 배포할 수 있다.
- 기존 `github-pages` 환경과 Pages 주소를 사용한다.
- 기존 브랜치 게시 설정과 보호 규칙을 바꾸지 않는다.
- 공식 artifact 포장은 `.git`, `.github`, 기타 점으로 시작하는 경로를 제외한다.
- 기존 자동 브랜치 게시도 남아 있으므로 같은 main을 중복 게시할 수 있다. 단계별 마감은 실제 운영 파일 SHA와 메뉴 검사 결과로 판정한다.
- 새 설정에서 실제 배포가 성공하기 전까지 운영 완료로 기록하지 않는다.

공식 근거: [actions/deploy-pages 보안 고려사항](https://github.com/actions/deploy-pages#security-considerations)은 브랜치를 게시 원본으로 쓰는 사이트의 배포가 그 원본 브랜치에서 시작해야 한다고 명시한다. 이 변경은 해당 조건을 유지한다.

## 범위와 확인

이번 보완은 배포 워크플로와 이 기록만 추가한다. 앱 코드·CSS·그림·저장 형식은 1단계 main과 동일하다. YAML 구문, main 전용 조건, 최소 배포 권한, 공식 action SHA와 기존 필수 CI를 확인한 뒤 정상 PR 병합한다. 이후 실제 배포와 1단계 운영 UI 검사로 결과를 확인한다.
