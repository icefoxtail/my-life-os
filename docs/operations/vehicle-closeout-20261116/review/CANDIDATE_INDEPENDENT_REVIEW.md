# 차량 표시 / Pixi 후보 독립 검토

검토자: `/root/live_status`. 기준일: 2026-11-16 UTC. 구현 및 원격 게시 담당과 분리하여 소스, 실제 이미지, Node 계약 검사, GitHub Actions 산출물과 스크린샷을 검토했다.

## 판정 범위

차량 후보 `83000bc9af5482dc64693b16387220ca821cf147`과 Pixi 후보 `ff0133dd06d5d4b01b1542917176a54dac52383d`의 아래 집중 검사는 PASS다. 이 문서는 해당 후보 검사에 대한 판정이며, 최종 통합 main 및 공개 운영 URL의 배포 확인은 별도 운영 증거로 결속해야 한다.

| 후보 | 원격 실행 | 결과 | 원본 artifact |
| --- | --- | --- | --- |
| 차량 첫 후보 `46311eed30047eae6291b9164165ea7b245dc1ff` | [43864992439](https://github.com/icefoxtail/my-life-os/actions/runs/43864992439) | 37/38 PASS, 공사장 1024×768 1 FAIL | 14224644361 |
| 차량 수정 후보 `83000bc9af5482dc64693b16387220ca821cf147` | [43865566483](https://github.com/icefoxtail/my-life-os/actions/runs/43865566483) | 38/38 PASS, pageErrors 0 | 14225786166 |
| Pixi 첫 후보 `a89fc6232cdb34689070a44eb243bfd0490ab659` | [43864994212](https://github.com/icefoxtail/my-life-os/actions/runs/43864994212) | 7/7 FAIL | 14224919315 |
| Pixi 수정 후보 `ff0133dd06d5d4b01b1542917176a54dac52383d` | [43866360106](https://github.com/icefoxtail/my-life-os/actions/runs/43866360106) | 7/7 PASS, pageErrors 0 | 14226480816 |

다운로드 ZIP SHA256은 다음과 같고 GitHub artifact digest와 일치했다.

| artifact | SHA256 |
| --- | --- |
| 차량 첫 후보 | `a6e595656e4b7797183973ab0355db4170a59391724cee506b59079b46c2ef32` |
| 차량 수정 후보 | `87a7ffbcfa54bcbcf03b12f88d97e2343153d915227175ab56a0f94cc9f6971f` |
| Pixi 첫 후보 | `53a7723274ad641bec8afa2eb6b63d02b3fe7415a95b166ff6b95892e72a4570` |
| Pixi 수정 후보 | `d70070f64b2848c431f5cab00240fd938a3d1b8a4ba59f9e5a63c7d131fc8c6a` |

## 차량 표시

기준 main은 `833cc1ec5cd38728850957c47b33a6bb24c0ada3`다. 현재 차량 138개의 이미지 바이트는 기준 main과 동일하다. 승인 정본 `docs/qa/release/VEHICLE_IMAGE_ONLY_RELEASE_20261109.json`의 76개 `resultSha256`도 모두 일치한다. Pillow로 독립 측정한 실제 크기와 alpha≥16 가시 영역은 새 metadata 138개 모두와 일치하며, JSON과 helper 내장 metadata도 일치한다. 기존 clean39 선택 규칙은 유지된다. 과거 HOLD는 거절된 대체 이미지에 관한 상태이므로, 현재 보존 원본을 자동 제외하는 조건으로 사용하지 않았다.

브라우저 검사는 138개를 실제로 디코드하여 alpha 경계를 측정하고, 각 이미지에 6가지 셀 모양을 적용했다. 총 828회에서 균일 배율, 투명 안전 여백, 가시 영역의 프레임 내 포함, 재적용/복원, 오류 fallback을 확인했다. 별도로 6게임 × 6화면 크기인 대표 36개 화면을 검사했다. 이는 138개 이미지 각각을 36개 게임 화면 전부에 띄운 조합 검사는 아니다. 화면 크기는 390×844, 844×390, 640×360, 768×1024, 1024×768, 1280×800이다. 코딩 자동차는 기존 내부 진입점을 사용했고 공개 메뉴를 추가하지 않았다.

첫 실행에서 공사장 1024×768의 선택 버튼 오른쪽 끝이 1028px로 4px 넘쳤다. 실패 스크린샷에서도 우측 카드 테두리 잘림을 확인했다. 가운데 grid 열의 최소폭만 조정한 수정 후보에서 오른쪽 끝은 1008px로 바뀌었고, 세 버튼 모두 hit=true이며 문서 가로 overflow가 없었다. 14개 검사 대상 파일의 artifact hash는 수정 후보 실제 파일과 모두 일치했고 검사 전후 소스 변경도 없었다. helper SHA256은 `21b7b08965d92dec8398efe6fd305fb7975d7dd2f20844a1d5b5326ea4d02d02`, 수정 공사장 소스는 `a8fe63447c3410624451f1dbdffb2cc25831883f85d1bae502973d4a453e94c3`다.

첫 후보의 count 390×844/1280×800, parking 390×844/640×360, fire 390×844/640×360/768×1024, coding 390×844/844×390, construction 640×360 및 실패 1024×768 스크린샷을 직접 열어 검토했다. memory 초기 스크린샷은 카드 뒷면이므로 차량 얼굴의 육안 증거로 계산하지 않는다. 공사장 1024×768 성공 화면은 당시 PASS 시 캡처 대상이 아니어서 DOM 측정으로 확인했으며, 후속 운영 검사에서 항상 캡처하도록 QA 선택 목록 한 줄을 보완했다. 판정 조건이나 검사 수는 바꾸지 않았다.

## Pixi

기존 reviewer Node 계약 4개는 수정 전 baseline에서 실패하고 후보에서 통과했다. Pixi 7/8 포인터 소유권, 바깥 이동·해제·취소, listener 정리, 파괴된 파티클 접근 방지, 다른 게임이 소유한 host 보존을 확인한다. 로딩 중 닫기/재진입은 별도 lifecycle 검사로 확인했다.

첫 실제 브라우저 실행에서 4개 사례는 7부품 조립, 완료 안내, 재진입 정리까지 성공했으나 `Cannot set properties of null (setting 'x')` 오류 때문에 FAIL이었다. 나머지 3개는 runtime 객체를 반환하는 전역 대입 evaluate에서 context destroyed로 실패했다. 어떤 오류도 무시하여 PASS로 처리하지 않았다.

실행된 Pixi 버전은 8.22.0이다. 공식 [Container 소스](https://github.com/pixijs/pixijs/blob/v8.22.0/src/scene/container/Container.ts)의 좌표 setter와 destroy 계약을 확인하고, 같은 계약을 가진 객체로 실제 프로젝트 runtime을 Node에서 실행했다. 장면 객체를 tween 도중 파괴하면 첫 후보의 오류와 ticker 잔류가 독립 재현됐다. 수정 후보에서는 position과 scale 두 경우 모두 폐기 좌표 쓰기 0, 남은 ticker 0, Promise 정상 종료를 확인했다. `pixi-retired-animation-5444e33.json`에 이 검사 결과를 보존했다. 첫 브라우저 실행에 stack이 없었으므로 독립 재현과 첫 실행의 정확한 호출 위치가 같다고 단정하지 않는다.

수정은 애니메이션 소유자의 파괴 상태와 await 뒤 장면 생존 여부를 검사하고, QA의 runtime 저장 evaluate가 큰 객체를 반환하지 않도록 한 것이다. 같은 7개 브라우저 시나리오를 그대로 다시 실행했고 pageerror stack 수집도 추가했다. 수정 후보의 6개 source hash가 artifact와 모두 일치한다. runtime SHA256은 `16ddfbd826ce9d8f4ece06b872338f0280b9e972f01f21d218aeb7f18ade8d02`, 게임 소스는 `394a3445e8bb5f4e18f380174bc28306bddb1f0dc45fd1b4090c214039eb4a90`다.

실제 Chromium에서 소방차/경찰차/구급차 각각 KO mouse 및 EN touch 6개 사례와 로딩·드롭 중 종료/재진입 1개 사례가 통과했다. 잘못된 부품 복귀, 7개 올바른 조립, 완료 안내 정확히 1회, 이전 runtime의 ticker/timer 0, 새 canvas 1개 및 새 부품 7개를 확인했다. desktop 구급차 완료, mobile 소방차 완료, mobile 경찰차 재진입, desktop 로딩·드롭 재진입 스크린샷도 직접 열어 조립과 초기화 상태를 확인했다.

## 해석상의 한계

- 실제 휴대전화/태블릿 손가락 사용과 스피커 청취는 수행하지 않았다. touch는 브라우저 입력이며 음성은 공유 발화 경로를 기록하는 probe로 검사했다.
- 기존 원본 중 일부 배경무늬는 유지된다. 이번 작업은 전체 차량 그림의 재제작이 아니다.
- 공사장 640×360의 중앙 화물상자 장면, coding 390×844의 화살표 이미지 하단에 기존 잘림이 보인다. 해당 세로/장면 크기 규칙은 이번 변경에서 수정되지 않았으며, 차량 가시 영역·클릭 문제의 회귀 판정과 분리한다.
- Pixi와 coding 내부 진입 검증은 새 공개 메뉴 제공을 뜻하지 않는다.
- 로컬 Chromium은 OS socket EPERM으로 실행할 수 없었다. 위 브라우저 판정은 GitHub Actions의 실제 실행과 내려받은 소스 결속 증거에 근거한다.
