# Service Worker 변경 독립 검토

검토자: `legacy_repairs` — 구현 담당 root와 분리하여 현재 `sw.js`를 읽고 실행 검증했다. Service Worker 파일은 이 검토에서 수정하지 않았다.

## 결론

요청된 두 변경은 Node 비동기 계약 검증을 통과했다.

1. `safeCacheAssets`는 공유 cursor를 네 worker가 증가시키며, 각각 fetch와 cache.put을 기다린 뒤 다음 항목을 가져간다. 132개 실제 ASSETS 항목이 각각 한 번 처리되었고 동시에 진행된 fetch의 최댓값은 4였다. body 소비를 포함하는 cache.put도 worker 수 이내였다.
2. 활성화 삭제 조건은 `sihyeon-play-os-`로 시작하면서 현재 CACHE_NAME과 다른 키로 한정된다. 현재 앱 캐시 및 `ap-math-os-v5`, `archive-v2`, `sihyeon-play-other`, `random-cache`는 삭제되지 않았다.

## 실제 실행

`node scripts/qa-sw-independent.cjs`

- 실제 소스를 Node VM에서 실행하고 비동기 fetch/cache 대역을 사용했다.
- 모든 자산이 있는 install, fetch 예외, HTTP 404 응답, cache.put 예외를 검증했다. 실패 항목 뒤의 마지막 정상 파일까지 처리되었다.
- 배열 길이 0·1·3·4·5·17에서 완료 수와 동시 상한을 확인했다.
- activate 콜백에서 이전 앱 캐시 2개만 삭제하는 것을 확인했다.
- 결과와 검토한 소스 SHA-256은 [sw-independent-results.json](sw-independent-results.json)에 저장했다.

## 범위와 한계

실제 Chrome의 SW install/activate, 네트워크 상태 전환, 캐시 저장 용량, 오프라인 화면은 부모 작업자의 브라우저 검수 대상이다. 이 단위 검증을 실제 브라우저 통과로 부르지 않는다. 이번 검토 범위 밖의 기존 network-first fetch 정책은 변경하지 않았다.
