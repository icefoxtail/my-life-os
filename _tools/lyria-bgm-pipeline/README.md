# 시현이 노래방 고품질 BGM 생성 파이프라인 (Gemini/Lyria)

이 프로젝트는 시현이 놀이터 OS의 "시현이 노래방"에 들어갈 고품질 반주(Instrumental BGM)를 생성하기 위한 프롬프트 및 메타데이터 파이프라인입니다.

## ⚠️ 중요 원칙

1. 이 작업은 생성기/프롬프트 파이프라인이며, 기존 앱 코드(`karaoke-zone.js` 등)는 절대 수정하지 않습니다.
2. 모든 곡은 **보컬 없이(No vocals, No lyrics)** 풍성한 키즈 반주로 생성하며, 원곡 멜로디를 복제하지 않은 "오리지널 멜로디"로 생성합니다.
3. **MP3 / WAV 변환 규칙**
   - Gemini/Lyria 등에서 `.mp3`로 출력될 경우, 파일 확장자만 단순히 `.wav`로 이름 바꾸기를 하면 안 됩니다.
   - 권장: `ffmpeg` 등 오디오 변환 도구를 사용해 실제 `.wav` 파일로 인코딩 변환합니다.
   - 대안: `karaoke-zone.js` 내의 해당 오디오 파일 경로를 `.mp3`로 수정합니다.
   - 현재 프로젝트 기준은 `.wav` 유지입니다.

## 🚀 파이프라인 실행 흐름

1. `node tools/make-lyria-prompts.js` 스크립트를 실행합니다.
2. `prompts/` 폴더에 정상적으로 생성된 16개의 `.txt` 프롬프트 파일을 확인합니다.
3. 각 텍스트 파일의 내용을 복사하여 Gemini/Lyria 음악 생성 도구 또는 Google AI Studio에 입력합니다.
4. Instrumental BGM 생성을 요청합니다.
5. 생성된 오디오 파일을 지정된 파일명으로 다운로드 및 저장합니다.
6. `.mp3` 파일로 다운로드되었다면 실제 `.wav` 형식으로 변환합니다.
7. 최종 `.wav` 파일을 `assets/karaoke/` 폴더에 배치합니다.
8. 파일 배치가 끝난 곡은 `BGM_MANIFEST.json`의 `status`를 `"ready"`로 변경합니다.
9. 앱을 실행하여 곡별 재생 테스트를 진행합니다.

## 📂 산출물 구분

### A. 파이프라인 파일

- `README.md`
- `data/karaoke-lyria-song-specs.json`
- `tools/make-lyria-prompts.js`
- `prompts/*.txt`
- `BGM_MANIFEST.json`

### B. 실제 음원 파일

- `assets/karaoke/*.wav`

현재 이 ZIP은 A 파이프라인 파일 완성본입니다. 실제 음원 파일은 생성 전이므로 `pending` 상태입니다.
