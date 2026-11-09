# 시현이놀이터 English Listening TTS — v1, 2026-11-09

## 목적
기존 4·5·6·7세 게임과 한국어 UI를 보존한 채, 언어권 유아의 자연스러운 듣기 노출을 위해 **영어 음성만 브라우저 SpeechSynthesis TTS**로 재생한다. 영어 MP3 녹음은 생성·사용하지 않는다.

## 운영 UX
- 홈 4~7세 선택 버튼 옆 🌐 KO/EN 빠른 전환 또는 놀이 설정의 한국어/English Listening 선택
- 선택 언어는 `sihyeon-play-settings-v1`에 저장되며 놀이 연령·수량 설정과 독립
- 화면/UI·선택된 수학 난이도·문항 데이터는 한국어 기존 구현 그대로
- 언어 변경 및 게임/구역 전환 시 이전 음성·대기 중 TTS/MP3와 연속 대사 재생을 취소
- 영어 모드에서 기존 한국어 녹음(MP3)을 실행하지 않고, 미작성 영어 대사는 억지 번역이나 엉뚱한 한국어 음성 대신 무음 처리
- 지원 환경에 영어 음성 엔진이 없거나 정책으로 TTS가 차단된 경우 그림·터치 기능은 유지하며 음성 실청취는 별도 사용자 검증 필요

## 대본/연결
- 공통 인사, 출발/도착, 구역 안내, 칭찬·다시 시도
- 숫자 1~30, 자동차 수 세기, 실제 차량 이름을 이용한 질문 및 정답 반응
- 색깔 풍선 6색의 목표색·실제로 누른 색과 선택색의 일치/불일치 안내
- 매직그림판 색깔 16종(영어 색 이름) 및 알려진 녹음 ID
- 숫자 배달 우체국의 실제 미션 수량·물체·수령자 영어 문장과 조작 반응
- 패턴 기차 4~7세의 색/도형/동물 단어, 작업 방식·조작·성공·재도전 영어 반응

### 대사 예
- "How many fire trucks do you see?"
- "Yes! Twenty-one cars! Great counting!"
- "Find the blue balloon!"
- "Oops! That's red. Find blue!"
- "Let's send three apples to the rabbit. Tap the things to load the truck."
- "Make a pattern, then repeat it three times!"
- "Choo-choo! Here we go!"

## 검증 기준
- `node scripts/qa-english-listening.cjs`: 숫자/색깔/미션 의미, 저장·연령 독립, 영어에서 한국어 MP3 차단, 지연 음성/시퀀스 차단, 기존 한국어 재생 회귀
- `node scripts/qa-play-settings.cjs` 및 기존 Playground checks, 보존된 패턴 기차 브라우저 fixture
- 최종 HEAD에 대한 CI/브라우저 확인 필수. CI 성공만으로 실제 기기 TTS 청취 PASS는 아님.

## 제외/남은 일
- 모든 게임 음성을 번역하지 않는다. 범위 밖 기존 게임에서 무관한 한국어 대사를 읽지 않도록 모드별 엔진 차단; 새 상황별 영어 대사는 후속 단계에서 추가.
- 영어권 원어민 억양, 속도, 실제 Android/iOS 스피커 출력, 어린이 실사용성은 브라우저/단위 검사만으로 검증하지 않음.
- 기존 한국어 MP3 **내용 자체**의 메뉴/색 불일치 여부는 음성 파일 직접 청취·전사 검수가 필요. 이번 릴리스에서 '모두 정상'이라고 주장하지 않음.
- 미리 읽던 한국어 동화 본문은 영어 번역하지 않았으며, English Listening이 자동 동화 번역을 의미하지 않음.

상태: PR·CI·Pages 운영 확인 전에는 구현 후보. 관련 브랜치 `feat/sihyeon-english-tts-20261109`, 시작 main `b08b3f743f60a8819640f98bb3b722af67a93f98`.
