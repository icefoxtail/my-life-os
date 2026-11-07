# 읽기는 성공하고 쓰기만 실패하는 저장 경합

## 독립 검수에서 재현한 문제

localStorage가 기존 값을 정상적으로 읽지만 새 쓰기는 `QuotaExceededError`로 거부하는 환경을 모의했다. 제품 closure를 VM에 그대로 읽었으며, 수량이나 그림 상태의 저장 코드를 별도로 복제하지 않았다.

우체국은 같은 페이지에 최신 메모리 저장본이 있어도 `getItem`의 오래된 값을 먼저 읽었다. 기존 저장에는 1개, 최신 플레이에는 3개가 있는 상태에서 다른 연령·수량 범위로 갔다가 돌아오면 1개로 되돌아갔다.

그림판도 최신 자유 그림 PNG와 도안별 빨간색 상태를 메모리에서 보관했지만, 다시 들어오는 `loadWork`가 기존 PNG·검은색 저장본으로 덮었다. 이미지가 완전히 복원된 상태에서도 발생하므로 초기 이미지 디코드 경합과는 별도 결함이다.

[수정 전 두 실패 결과](storage-write-failure-before.json)를 보존했다. 당시 우체국 UI SHA는 `157d7fd888d2cd0d52ed0c7333f4af058636bab07456551576d4606eb7e3571d`, 그림판 SHA는 `8e692dbd73a1e231a9f832937f498678bed44ab81018c04f66ac4e80d90f632c`였다.

## 최소 수정

- 우체국은 해당 저장 키의 메모리 snapshot이 존재하면 복사본을 먼저 반환한다. 메모리 값이 없는 첫 읽기에서만 localStorage를 읽는다. 읽은 결과를 호출자가 변경해도 보관한 snapshot은 바뀌지 않는다.
- 그림판은 저장을 시도하기 전에 자유 PNG·도안별 색·모드·배경을 분리된 `memoryWork` snapshot으로 보관한다. 같은 페이지에서 다시 들어오면 이 최신 snapshot을 우선 복원한다.
- 기존 PNG 디코드 보호는 유지한다. 아직 복원되지 않은 빈 캔버스를 원본으로 저장하지 않는다.

이 보호는 같은 페이지가 살아 있는 동안의 진행에 적용된다. 브라우저가 실제 쓰기를 거부한 상태에서 페이지 전체를 새로고침하면 메모리 저장본도 사라지므로, 실제 저장 실패를 영구 저장 성공으로 취급하지 않는다.

## 회귀 검사

```sh
node scripts/qa-storage-write-failure.cjs docs/qa/storage-write-failure-results.json
node scripts/qa-art-pending-save.cjs docs/qa/art-pending-save-results.json
node scripts/qa-art-restore-independent.cjs docs/qa/art-restore-results.json
```

[수정 후 실행 결과](storage-write-failure-results.json)에서 다음 두 사례가 통과했다.

| 사례 | 결과 |
|---|---|
| 우체국 기존 저장 1개 → 쓰기 거부 중 3개 적재 → 5세/다른 범위 → 4세/원래 범위 | 3개 고유 물체 위치 보존, 저장 실패 표시 유지, 읽기 결과의 복사본 분리 |
| 그림판 OLD PNG/검정 저장 → NEW PNG/빨강 변경 → 쓰기 거부 상태에서 destroy/loadWork | NEW PNG와 해당 도안의 빨강 보존 |

그림판 초기 저장 경합 12개와 비동기 복원 6개도 최신 소스에서 재실행해 통과했다. 우체국 수량 모델·게임 입력·레이아웃은 변경하지 않았다.

수정 후 우체국 UI SHA-256은 `15ab59dc8ce55e599ffc59811a75dffa2e02d9e9836e2b729d4a3fd3e82ef234`, 그림판은 `a57a3c7222219e26770f47f6f5a4d05063474991f2ad1e06c4c916a6a4a9d2b5`다.

검사는 Node의 제어된 저장 어댑터와 PNG 문자열 표식으로 수행했다. 실제 브라우저 저장 할당량, 사생활 보호 모드, PNG 디코드, 실제 기기 검증으로 확대하지 않는다. 새 회귀는 구현자가 작성했다. 독립 검수자는 처음 실패했던 자체 VM 재현 두 건, 새 저장 회귀 두 건, 그림판 초기 저장 12건·비동기 복원 6건을 위 최신 SHA에서 각각 재실행하여 모두 통과한 것을 확인했고, 메모리 우선·복사본·후속 validation 경로도 별도로 읽었다.
