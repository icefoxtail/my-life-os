# 3단계 — 내 그림과 우리 동네 이야기

사용자 승인: 1·2·3순위를 순서대로 진행. 1단계 실제 운영 확인과 2단계 정확한 HEAD `43d1449b4ee2f447b3255025b54c6fd5f300ff75`의 76/76 브라우저 검증·독립 화면 검수 후 구현한다. 3단계 main 병합은 2단계 운영 확인 뒤에 진행한다.

## 놀이와 화면

- 게임명: **내 그림 우리 동네**. 숫자나라에 기존 게임 카드와 함께 등록한다.
- 대상: 4–7세. 그림과 수를 고르면 상황이 자동으로 진행된다. 수 선택 범위는 모든 나이에서 0–30이다.
- 아이는 소방서 출동, 경찰서 도착, 간식 나누기, 우리 동네 중 하나와 그림·수를 고른다. 같은 그림을 하나씩 누를 필요가 없다.
- 4세는 한 장면을 자동으로 보고, 5세는 선택적 두 가지 예측 후 자동으로 이어 보며, 6세는 같은 물체를 열 칸·낱개로 묶어 보고, 7세는 첫 결과가 실제 다음 상황으로 이어지는 두 장면을 본다.
- 정답/오답 점수나 다음 놀이 잠금은 없다. 예상과 달라도 실제 움직임과 결과를 함께 보여 준다. 완료 시 짧고 따뜻한 안내와 다시 보기 버튼을 제공한다.
- 모바일 세로: 장면·그림·수 고르기는 큰 버튼의 대화상자로 열고, 핵심 장면과 식·결과를 한 화면에서 읽게 한다. 주요 터치 영역은 44px 이상이다.
- 태블릿/모바일 가로: 넓은 장면을 쓰고, 현재 짝이나 이동한 물체가 고정 제목 아래에 가려지지 않게 한다. 많은 그림은 보드 안에서 자연스럽게 스크롤한다.

## 장면 계약

| scene | 기본 장면(4–6세) | 7세의 연결 장면 |
| --- | --- | --- |
| fire | a−b, 기본 15−4=11 | 떠났던 원본 중 min(2,b)가 돌아온다. 기본 11+2=13 |
| police | a+b, 기본 9+6=15 | 도착 뒤 min(3,a+b)가 출동한다. 기본 15−3=12 |
| snack | total개를 groups명에게 나눈다. 기본 15/4 → 각 3, 남음 3 | 처음 total−min(3,total)개와 배달분 min(3,total)개를 합친 뒤 같은 원본으로 나눈다 |
| neighborhood | a와 b 비교. 기본 7과 5, 차이 2 | 적은 쪽에 차이만큼 도착해 같아진다. 도착할 물체는 처음부터 기다리는 영역에 존재한다 |

fire는 b≤a, police는 a+b≤30, snack은 groups 1–6, neighborhood는 각각 0–30이다. 7세용 추가 수는 화면에 명시하고 사용자가 저장한 기본 수를 바꾸지 않는다. 0 변화는 그대로 있음/이미 같음을 설명한다.

## 순수 모델과 원본 보존

`SihyeonStoryPlayModel.create({scene,age,values})`는 version, scene, age, base, generated, entities, initialZones, stages, finalZones, result, presentation을 반환한다. values는 fire/police/neighborhood의 `{a,b}`, snack의 `{total,groups}`이다.

- entities는 전체 이야기에서 한 번 만든 `{id,slot,ordinal}` 원본 목록이다. slot은 main/arrival/left/right이다.
- stages는 `{id,operator,captionKey,startZones,events,endZones,result}`이다.
- 이벤트는 stage/move/pair/summary이며 stageIndex와 countsAfter를 갖는다. move는 itemId/from/to, pair는 leftId/rightId/pairIndex를 갖는다.
- count 결과는 `{kind:'count',count}`, share는 `{kind:'share',total,groupCount,each,remainder}`, compare는 `{kind:'compare',a,b,pairCount,difference,relation}`이다.
- 모든 장면의 영역은 전체 원본 ID를 정확히 한 번씩 포함한다. 앞 장면 endZones와 다음 startZones는 같다. 이벤트 재생 결과가 endZones와 일치해야 한다.
- DOM 원본은 장면 전환과 열 칸 재배치에서 새로 만들거나 복제하지 않는다. 돌아오는 물체는 실제 떠난 원본이다.

## 내 그림 선택

공용 `SihyeonPlayObjects.list/get`의 기존 계약을 보존하고 늦게 조회하는 `listChoices({sourceKind})`, `resolveChoice({id,sourceKind})`를 추가한다. sourceKind는 recommended/artwork이며 개인 그림과 견본은 같은 art:templateId를 쓸 수 있으므로 두 필드로 구별한다.

resolveChoice는 `{requested,actual,missingArtwork,object}`를 반환한다. 저장된 작품이 없으면 해당 견본을 사용하고 “내 그림이 없어 견본으로 놀아요”를 표시한다. 요청한 출처와 수는 보존하고 자동 진행을 막지 않는다. 모르는 ID는 null이다. 게임에는 그림 참조만 저장하며 SVG·색상 데이터를 중복 저장하지 않는다.

그림 연산, 비교·빼기, 새 이야기 게임의 그림 선택에 추천 그림/내 그림 탭을 붙인다. 기존 작품의 색·판본을 읽기 전용 bridge로 가져오며, 한 번의 실행에서는 그림 snapshot을 유지한다. 작품 삭제나 변경은 다음 입장/선택 시 새로 읽는다. 구형 v1 게임 저장은 recommended로 읽는다.

## 구조·에셋·음성

- 신규 모델/게임/CSS/card: `js/games/neighborhood-story-model.js`, `js/games/neighborhood-story.js`, `css/games/neighborhood-story.css`, `assets/games/neighborhood-story/card.svg`.
- 등록: `SihyeonGames.neighborhoodStory`, `openNeighborhoodStoryGame()`. 저장: `sihyeon-neighborhood-story-v1`. 선택자: `.ns-*`, `[data-ns-action]`.
- 기존 12개 그림과 28종 작품을 재사용한다. 새 카드는 코드 기반 SVG이며 외부 이미지나 새 사진은 필요하지 않다.
- 기존 `SihyeonQuantitySequencer`와 `SihyeonVoice` 경로를 사용한다. 신규 음성 엔진·임의 TTS·가짜 녹음 key/path는 만들지 않는다.
- 실제 manifest에는 `games.number.intro`, `games.number.complete`, `common.characterTogether`, `common.backToPark` 등의 공용 녹음이 있다. 네 이야기별 안내와 가변 식 전용 녹음은 추가 녹음 후보로 보고한다.
- 필요한 문구: “소방차가 출동해요”, “경찰차가 도착해요”, “간식을 함께 나눠요”, “우리 동네를 살펴봐요”, 돌아옴/출동/배달/같아짐/0 변화와 짧은 결과 안내. 한국어·영어 표시는 공용 수 말하기와 그림 이름을 사용한다.

## 검증과 담당

- Root: index, SW, CI, 문서, 원격 PR/main/Pages 및 운영 증거.
- quantity_completion_audit: 신규 이야기 모델·게임·CSS·카드 4파일.
- svg_completion_audit: play-objects와 그림 연산·비교/빼기의 JS/CSS 5파일.
- release_evidence_audit: `qa-artwork-choices.cjs`, `qa-neighborhood-story.cjs`, `qa-art-story-browser.py` 3파일.
- 필수: 수량·원본·단계 연결·입력 불변성, 작품 출처·색·구형 판본·삭제 fallback, 실제 메뉴·자동 진행·취소·재입장·저장·음성 실패, 네 뷰포트, 4–7세 차이. 기존 회귀 job을 유지하고 신규 검사는 독립 CI job으로 실행한다.
- 실제 스피커 청취와 물리 기기 검사는 수행 전까지 NOT_RUN이다.
