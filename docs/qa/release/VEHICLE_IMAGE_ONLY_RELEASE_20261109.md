# 시현이놀이터 자동차 이미지 품질 우선 운영 분리 배포 (2026-11-09)

- 기준 원격 main: `adaac2de7c147618e9f16acff952dd87ce5d443a`
- 차량 2차 후보 정본: PR #5 `f35dec64c8b69aea8a6091f2b95d55d896776885` (기존 PR·브랜치 그대로 보존)
- 범위: 자동차 파일 **76개만** 교체, 검수 장부 2개 추가. 게임 JS·CSS·index·서비스워커·공용 표시 규격·manifest 변경 없음.
- 원장상 기존 복원 77개 중 **73개**를 승격. **4개는 실제 구조 손상/HOLD로 제외**. 누락 배경 복원 후보 3개(항만 크레인/여객선/표지 차량)는 별도 독립 QA와 SHA 검증 후 추가해 최종 **76개**.
- 기존 이앙기 현재 이미지에는 모판 알파 손상이 있어 이 배포에서는 독립 승인된 수정 후보의 정확한 SHA-256 바이트를 사용.
- 이전 28개 독립 readback, 격자 A 36개 개별 판정, C 66개 검사와 B의 개별 전후 3배경 비교/승인 자료를 참조함. B의 이전 원장 '검수대기' 32개는 이번 담당자가 직접 전후 3배경 기록 32장을 읽어 소실·격자 잔여·외곽 문제를 비교했음(소스·최종 이미지를 자동 검증한 것과 시각 QA는 구분).
- A 이앙기 및 B 3개 최신 후보 독립 QA 파일: `docs/qa/sihyeon-phase2/release-20261108/independent/new-candidates-r1.md` (독립 QA 브랜치).
- 보류 4개: `fire_special/aerial_ladder_truck.webp`(차체 뒤 절단), `fire_special/fire_command_suv.webp`(범퍼 절단), `fire_special/smoke_extraction_fan_truck.webp`(미러 경계 소실 의심), `transport/garbage_truck.png`(차체·뒷바퀴 합성 이음).
- 기존 보존/추가 HOLD 파일은 main의 원본 바이트로 유지. 새 이미지를 발명하거나 손상 원본을 복구 PASS로 취급하지 않음.
- **이 배포는 이미지 전용**. 기존 자동차 PR #5의 공용 게임 JS/반응형 개편과 과거 통합 브라우저 FAIL 7건은 이 PR에 포함하지 않음.
- 검증 순서: 교체 파일 76개 Git blob/ref 대조 → PR Playground checks → main 병합 → Pages 수신 이미지 SHA와 실제 화면 검증. 미실시 단계는 미실시로 구분.
- 서비스워커는 온라인 요청 시 network-first로 새 이미지 수신 가능하나 오프라인 기존 캐시 사용 시 이전 이미지가 보일 수 있음.
- 실제 아이·휴대폰의 물리 터치, 음성 실청취 검사는 이번 이미지 전용 PR의 PASS라고 주장하지 않음.

## 보존 증거

- `docs/qa/sihyeon-phase2/vehicle-final-dispositions.json` 및 `comparisons/`
- `docs/qa/sihyeon-phase2/release-20261108/grid-a-review.md`
- `docs/qa/sihyeon-phase2/release-20261108/white-fire-review.md`
- `docs/qa/sihyeon-phase2/release-20261108/grid-b-review.md`
- `docs/qa/sihyeon-phase2/release-20261108/independent/new-candidates-r1.md`

**최종 목록과 Git blob 결속은 옆의 `VEHICLE_IMAGE_ONLY_RELEASE_20261109.json`을 참조.**