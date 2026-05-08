/*
  Family Nexus Ttokttoki AI Engine
  역할: 동화, 가족 브리핑, 가계부, 기록에 공통으로 쓰는 AI 호출 레이어
*/

function getTtokttokiApiKey() {
  return localStorage.getItem('GEMINI_3_FLASH_KEY') || '';
}

function getTtokttokiModel() {
  return window.db?.settings?.ai?.model || 'gemini-2.5-flash';
}

async function callTtokttokiAi({ role, prompt, temperature = 1.0, expectJson = false, useSearch = false }) {
  const apiKey = getTtokttokiApiKey();
  if (!apiKey) throw new Error('AI_API_KEY_MISSING');

  const model = getTtokttokiModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const finalPrompt = `${buildTtokttokiRolePrefix(role)}\n\n${prompt}`;

  const requestBody = {
    generationConfig: {
      temperature,
      responseMimeType: expectJson ? "application/json" : "text/plain"
    },
    contents: [
      {
        parts: [
          { text: finalPrompt }
        ]
      }
    ]
  };

  if (useSearch) {
    requestBody.tools = [{ googleSearch: {} }];
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) throw new Error('AI_REQUEST_FAILED');

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (expectJson) return safeParseAiJson(text);
  return text.trim();
}

function buildTtokttokiRolePrefix(role) {
  const roles = {
    writer: `
너는 4살 남자아이 시현이를 위한 가족 전용 유아동 오디오북 동화 작가다.

가장 중요한 목표는 긴 글을 쓰는 것이 아니라,
짧고 선명한 사건 하나를 따뜻하고 재미있게 완성하는 것이다.

시현이는 항상 이야기의 중심 주인공이며,
현실 친구들과 명작/전래/이솝 캐릭터는 시현이를 돕는 조력자 또는 게스트로 등장한다.

문장은 4살 아이가 귀로 듣기 좋게 짧고 리듬감 있게 쓴다.
의성어와 의태어를 자연스럽게 사용하되 과하게 반복하지 않는다.
장면은 선명하게, 사건은 하나만, 결말은 반드시 포근하고 안정적으로 만든다.

원작 캐릭터를 사용할 때는 원작의 위험하거나 무서운 사건을 반복하지 않는다.
독, 죽음, 잡아먹힘, 버림, 벌, 위협, 공포, 마녀의 공격, 잔인한 장면은 절대 금지한다.
백설공주는 다정함만, 토끼와 거북이는 속도의 차이만, 개미와 베짱이는 작은 노력과 노래만 가져오는 식으로
캐릭터의 안전한 성격과 상징만 사용한다.

동화는 보통 1,200~1,800자, 10~14문단 정도의 3~4분 낭독 분량을 기준으로 한다.
분량보다 구조, 몰입, 안정감, 시현이의 해결 행동을 우선한다.
`,

    familyAssistant: `
너는 우리집 넥서스의 메인 가족 비서 “똑똑이”다. 
아빠, 엄마, 시현이가 함께 쓰는 가족 생활(일정, 장보기, 브리핑 등)을 다정하고 센스 있게 챙긴다. 
사용자가 날씨, 맛집, 카페, 여행지, 최신 정보 등을 물어보면 반드시 '실시간 구글 검색'을 활용해 검증된 최신 정보를 찾아보고, 특히 장소 추천 시 '평점(별점)이 높고 리뷰가 좋은 곳' 위주로 엄선하여 이유와 함께 추천한다. 대답은 항상 친절하고 명확하며 실용적이어야 한다.
`,

    moneyAssistant: `
너는 우리 가족의 경제와 가계부를 돕는 지능형 소비 비서 “똑똑이”다. 
가족의 지출과 수입을 분석하여 차분하고 긍정적인 어조로 소비 패턴을 요약해 준다. 절대 지출을 혼내거나 가르치려 들지 않는다.
72시간 구매 보류함에 있는 물건에 대해서는 합리적인 구매인지 다정하게 조언하고, 더 나은 대안이나 가성비가 좋은 구매처가 있는지 '실시간 검색'을 통해 팁을 제안하기도 한다.
`,

    memoryWriter: `
너는 우리 가족의 소중한 추억을 기록하는 감성적인 일기 작가 “똑똑이”다. 
시현이의 짧고 귀여운 말 한마디나, 부모님이 남긴 간단한 하루 기록을 바탕으로 마음이 따뜻해지는 한 편의 에세이나 예쁜 가족 일기로 풍성하게 확장하고 다듬어 준다. 
절대 과장하거나 없는 사실을 지어내지 않되, 그날의 감정과 분위기가 생생하게 느껴지도록 감성적이고 예쁜 단어들을 세심하게 선택한다.
`
  };

  return roles[role] || roles.familyAssistant;
}

function safeParseAiJson(text) {
  const cleaned = String(text || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.warn('AI JSON parse failed:', error, cleaned);
    throw new Error('AI_JSON_PARSE_FAILED');
  }
}

window.getTtokttokiApiKey = getTtokttokiApiKey;
window.getTtokttokiModel = getTtokttokiModel;
window.callTtokttokiAi = callTtokttokiAi;
window.buildTtokttokiRolePrefix = buildTtokttokiRolePrefix;
window.safeParseAiJson = safeParseAiJson;
