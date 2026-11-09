# 시현이놀이터 한국어·영어 음성 싱크 정비 — 2026-11-09

## 사용자 목표
시현이가 실제로 터치한 도안·색깔·자동차·숫자를 음성으로 정확하게 듣고, 한국어/English Listening 모두 화면과 내용이 일치하도록 한다. 잘못된 녹음 파일에 연결되거나 이전 화면의 음성이 다시 나오는 일을 방지한다.

## 범위와 정본
- 시작 Git main `cf988eb30d602df4a7fac950228cb1cd831769e4`
- `js/voice-labels.js`를 새 단일 사전으로 사용. 기존 UI와 실제 차량 manifest에서 추출한 한국어 이름을 보존하고 영어 이름을 명시 등록한다
- 매직그림판 실제 색칠 도안 **15개**, 색깔 팔레트 **16개**를 고유 ID(도안) 또는 정확한 HEX(색깔) 기준으로 이름 TTS 출력
- 공용 차량 manifest **129개** 전부 한국어 이름과 영어 이름을 연결. 메모리 차량 카드 뒤집기·맞히기와 숫자세기 문구에서 사용
- 공용 홈·구역 안내 여섯 항목은 영어는 기존 English Listening TTS, 한국어는 현행 화면 이름에서 얻은 한국어 TTS로 읽어 화면/MP3 내용 불일치 위험을 제거
- 숫자블록(1~5 조합/집·기차·로켓 공작)과 숫자 왕국 3D(1~10 및 20·50·100 트레이 선택, 3D 친구 클릭)의 한국어·영어 TTS 활성화 및 현재 누른 숫자에 묶음
- 탈것 만들기의 소방차·경찰차·구급차와 번호 선택을 한국어/영어 TTS로 연결
- 한국어 MP3/성우 원본 파일은 삭제·변경하지 않음; 의미가 반드시 맞아야 하는 선택 음성만 TTS로 대체
- 원문 숫자 데이터·게임 정답 판정·도형·자동차 PNG/SVG 원본·드래그·학습 진행률을 변경하지 않음

## 원본 녹음 목록 정적 감사
- `assets/voice/voice_manifest.json`: **307개 ID**, 307/307 파일 경로 존재
- `assets/voice/games`에 MP3 **403개** 존재
- 서로 다른 이름의 파일인데 동일 SHA(Git blob)인 파일 4쌍:
  - `boardland-cell-rainbow1.mp3` ↔ `boardland-cell-rainbow2.mp3`
  - `dispatch-gamecomplete.mp3` ↔ `dispatch-missioncomplete.mp3`
  - `dispatch-tryagain.mp3` ↔ `dispatch-wrongchoice.mp3`
  - `games-sequence-cleanstep2.mp3` ↔ `games-sequence-outwrong3.mp3`
- 이 정보는 **파일 무결성/중복 여부**만 보여 준다. 실제 녹음 대사와 발음은 MP3를 직접 청취·전사하지 않았으므로 **미검증**. 동일 MP3가 반드시 오류라는 뜻도 아님.
- 아이가 누른 낱말·숫자에 대해서는 해당 녹음 파일을 우회하고 실제 UI 데이터에서 생성한 TTS를 사용하여 음성 이름 불일치 경로를 구조적으로 제거

## 검증
- `node scripts/qa-voice-label-sync.cjs`: 15/15 도안 표시명, 16/16 색깔 표시명, 129/129 차량 정본, 307/307 음성 링크 존재, 6개 구역, 숫자/블록 구문, 한글·영어 TTS 요청
- `python3 scripts/qa-voice-label-sync-browser.py`: 실제 Chromium에서 2개 화면 크기로 15개 도안+16개 색깔 × 한글/영어, 숫자블록 1~5 조작, 동화 메뉴 이름 오재생을 확인
- 기존 `Playground checks`, `Phase 2 browser release`는 반드시 유지. 확인되지 않은 결과는 PASS라고 기록하지 않음.
- 마지막 main 배포 성공 및 공개 Pages 원문 확인 이전에는 운영 완료라 주장하지 않음

## 한계
- 한국어/영어 브라우저 Web Speech TTS는 기기·설치 음성에 따라 음색, 속도, 발음이 달라질 수 있다.
- 브라우저에서 `speechSynthesis.speak`가 정확한 글자/언어로 호출되는 것과 실제 스마트폰 스피커 청취 품질은 별도의 검증이다.
- 이번 배포는 요청받은 자주 쓰는 놀이와 이름이 달라질 위험이 큰 구역 안내에 초점을 둔다. 전체 403개 기존 MP3 실제 녹음 내용을 전사/청취한 음성 전수 PASS는 아님.
