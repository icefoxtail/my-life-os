# 시현이 가족 노래방 자동 반주 생성기 v1

Gemini/Lyria API 없이 로컬에서 바로 WAV 반주를 생성하는 자동 생성기입니다.

## 구성
- `tools/make-family-karaoke-bgm.py`
- `data/karaoke-song-specs.json`
- `assets/karaoke/*.wav`
- `BGM_MANIFEST.json`

## 실행
```bash
python tools/make-family-karaoke-bgm.py
```

## 현재 기준
- 16곡 전체 생성
- 곡당 24트랙 구조
- 보컬 없음
- 외부 음악 API 없음
- 파일명은 `karaoke-zone.js`의 audio 경로와 일치

## 적용
생성된 `assets/karaoke/*.wav` 파일을 기존 프로젝트의 같은 경로에 복사하면 됩니다.

## 참고
이 생성기는 완전 자동 반주 생성기입니다.
다만 상용 음원/전문 DAW 품질이 아니라 앱 내장용 합성 반주 품질입니다.
마음에 드는 인기곡만 나중에 Lyria 수동 생성본으로 같은 파일명 덮어쓰기 하면 됩니다.
