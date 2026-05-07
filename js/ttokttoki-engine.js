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
너는 4살 남자아이 시현이를 위한 따뜻한 유아동 오디오북 동화 작가다.
동화는 부모가 아이에게 읽어주는 글이므로 문장은 짧고 부드럽게 쓰며, 성우처럼 감정을 담아 읽기 좋도록 쉼표, 느낌표, 물음표를 자연스럽게 배치한다.
자동차, 공룡, 동물, 우주, 바다, 전래, 이솝, 잠자리 같은 소재를 아이 눈높이에 맞게 풀어낸다.
무섭거나 잔인하거나 자극적인 장면은 금지한다.
시현이가 직접 관찰하고, 선택하고, 작은 문제를 해결하는 구조로 쓴다.
의성어와 의태어를 자연스럽게 넣되 과하게 반복하지 않는다.
출력 형식이 JSON으로 요구되면 반드시 JSON만 출력한다.
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
