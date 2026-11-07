# 공용 수정 코드 — 독립 검토

검토 대상은 이번 작업 폴더의 `index.html`, `js/play-settings.js`, `js/games/art-zone.js`, `js/games/number-count.js`, `js/vehicle-display.js`다. 이 문서는 정적 검토와 별도 Node 재현 결과를 기록하며 브라우저 실조작 통과를 대신하지 않는다.

## 수정하고 재검한 비동기 그림 복원 결함

자유 그림의 `restoreFreeImage`가 만드는 `Image.onload`는 호출 순서대로 끝난다는 보장이 없다. 원래 코드에 대해 두 요청을 `older → newer` 순서로 보낸 뒤 콜백을 `newer → older` 순서로 실행하면, 최종 화면은 오래된 그림이 되었다. 독립 Node 재현에서 실제 `FAIL`을 확인한 뒤 통합 담당자의 명시적 범위 지정에 따라 복원 순서 토큰만 추가했다.

새 복원 요청, 새 종이, 게임 종료와 복원 완료 후 새 스트로크가 이전 토큰을 무효화한다. `onload`는 현재 토큰과 현재 캔버스를 모두 확인한 다음에만 그린다. 템플릿 SVG·색상 순서·TTS 경로는 이 추가 수정에서 바꾸지 않았다. 후속 원본 보호 수정에 따라 복원 대기 중 입력은 보류하고, 그림이 복원된 뒤 정상적으로 그릴 수 있다.

`scripts/qa-art-restore-independent.cjs`는 제품 소스를 VM에 읽고, 이미지 완료 순서를 통제하는 모의 `Image`만 제공한다. 함수 구현을 복제하여 검사하지 않는다. 다음 여섯 경우가 통과했고 정확한 소스 SHA-256은 `art-restore-results.json`에 남겼다.

- 이미지 콜백 역순 완료에서 마지막 요청만 반영
- 새 종이 뒤 늦은 복원이 그려지지 않음
- 로딩 중 포인터 입력은 보류되고, 현재 복원이 끝나면 새 스트로크가 정상 작동
- 종료 후 같은 캔버스가 다시 사용돼도 이전 콜백이 반영되지 않음
- 빈 새 복원 요청이 이전 요청을 취소
- 정상적인 현재 요청은 그대로 복원

이는 콜백 순서에 대한 단위 재현이다. 실제 브라우저의 PNG 픽셀, 펜 압력, iOS/Android 입력을 검증했다는 뜻은 아니다.

## 후속 저장 경합 수정의 독립 확인

별도 구현자가 초기 PNG 복원이 끝나기 전에 저장·종료하면 빈 캔버스가 원본을 덮는 경합을 재현했다. 독립 검수자는 변경된 `saveWork`, `restoreFreeImage`, `clearWork`, `drawStart`, `destroy` 및 `resizeCanvasPreserve` 흐름과 새 회귀검사 코드를 다시 읽었다. 준비된 캔버스만 캡처하고, 대기·디코드 실패·그리기 실패에서는 canonical PNG를 유지하며, 새 종이는 원본을 되돌리기 이력에 넣는 계약을 확인했다.

이 수정 단계의 소스 `8e692dbd73a1e231a9f832937f498678bed44ab81018c04f66ac4e80d90f632c`에 대해 독립 작업자가 12개 저장 경합 검사와 위 6개 복원 검사를 직접 재실행해 모두 통과했다. [후속 수정·재현 설명](art-pending-save-review.md), [12개 결과](art-pending-save-results.json), [6개 결과](art-restore-results.json)를 참조한다. 새 검사 작성자는 후속 수정자이고 독립 검수는 소스 검토와 재실행이므로, 독립 작성한 새 테스트로 표현하지 않는다.

## 전달 후 수정 확인한 차량 표시 항목

초기 차량 표시 프레임의 확정 백분율 폭과 `max-height`, 내부 이미지의 독립적인 폭/높이 배율 조합은 높이 제한에 걸릴 때 원본 비율을 깨뜨릴 가능성이 있어 전달했다. 후속 소스는 실제 alpha 경계를 SVG `viewBox`로 두고 `preserveAspectRatio="xMidYMid meet"`를 사용한다. 외부 프레임이 가로·세로 어느 제약에 걸려도 SVG의 단일 균일 배율로 차량을 맞추는 것으로 바뀌었다.

이미지 오류 때 `car.png`로 바꾸면서 이전 차량의 경계 스타일을 유지하는 경로도 전달했다. 최신 `number-count.js`는 대체 경로를 설정한 뒤 `SihyeonVehicleDisplay.apply`를 다시 호출하여 승용차 자체 경계를 사용한다. 대체 이미지까지 실패하면 프레임을 해제하고 자동차 그림문자로 대체한다. 이 두 항목의 발견과 수정 확인은 정적 코드 검토이며, 실측 렌더링은 통합 담당자의 별도 브라우저 기록을 확인한다.

## 확인한 유지 사항

설정은 허용 연령 4~7과 수량 범위를 검증하고, 연령과 수량을 따로 저장한다. 새 우체국은 메뉴 연결·게임 종료 정리에 포함된다. 보드랜드 메뉴와 런타임 스크립트 연결은 제거돼 있다. 그림판의 도안별 채색 저장, 자유 그리기 선분별 무지개 색상 처리는 기존 SVG/TTS 경로를 유지하는 변경이다.

## 최종 통합 검토 — 저장 결함 두 건 수정 후 차단 결함 없음

2026-11-07 UTC, 최신 통합 diff·신규 우체국/설정/2D 대체 소스·통합 검수 문서·CI를 읽기 전용으로 검토했다. 이 단계에서는 브라우저 검수를 다시 수행하지 않았다.

기존 값 읽기는 성공하고 쓰기만 `QuotaExceededError`로 실패하는 조건에서 두 차단 결함을 독립 VM 재현으로 발견했다. 우체국은 모드/수량 왕복 때 최신 적재 대신 옛 저장값을 읽었고, 그림판은 재진입 때 최신 PNG와 도안 채색을 옛 값으로 덮었다. 구현자가 두 게임 모두 최신 메모리 snapshot을 우선하도록 수정했다.

독립 검수자가 처음 실패시킨 재현을 그대로 다시 실행해 두 건 모두 통과했다. 새 회귀 검사에서는 우체국의 기존 1개→추가 적재 3개→연령/수량 왕복→3개 보존 및 읽기 복사본 분리를, 그림판에서는 새 PNG와 빨강 채색 보존을 확인했다. 저장 경합 12건과 복원 6건도 최신 그림판 소스로 다시 통과했다. [수정 전 두 FAIL](storage-write-failure-before.json), [수정 후 두 PASS](storage-write-failure-results.json)가 증거다.

- 우체국 UI SHA-256: `15ab59dc8ce55e599ffc59811a75dffa2e02d9e9836e2b729d4a3fd3e82ef234`
- 그림판 SHA-256: `a57a3c7222219e26770f47f6f5a4d05063474991f2ad1e06c4c916a6a4a9d2b5`

최신 CI와 통합 재현 명령에 `qa-art-pending-save.cjs` 및 `qa-storage-write-failure.cjs`가 포함된 것을 확인했다. **검토 범위에서 남은 구체적 코드 차단 결함은 발견하지 못했다.** 이 결론은 실제 기기·실제 브라우저 저장 용량 초과·음성 실청취·원격 CI 실행·main 병합·운영 배포의 완료 판정을 대신하지 않는다. 메모리는 같은 페이지 안의 진행을 보호하며, 브라우저가 거부한 저장을 실제 페이지 새로고침 뒤 복원할 수 있다고 주장하지 않는다.

## 재실행

```sh
node scripts/qa-art-restore-independent.cjs docs/qa/art-restore-results.json
node scripts/qa-art-pending-save.cjs docs/qa/art-pending-save-results.json
node scripts/qa-storage-write-failure.cjs docs/qa/storage-write-failure-results.json
```
