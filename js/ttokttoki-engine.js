/*
  Family Nexus Ttokttoki AI Engine
  역할: 동화, 가족 브리핑, 우아림, 가계부, 기록이 공통으로 쓰는 AI 호출 레이어
*/

function getTtokttokiApiKey() {
  return localStorage.getItem('GEMINI_3_FLASH_KEY') || '';
}

function getTtokttokiModel() {
  return window.db?.settings?.ai?.model || 'gemini-3.0-flash';
}

async function callTtokttokiAi({ role, prompt, temperature = 0.8, expectJson = false }) {
  const apiKey = getTtokttokiApiKey();
  if (!apiKey) throw new Error('AI_API_KEY_MISSING');

  const model = getTtokttokiModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const finalPrompt = `${buildTtokttokiRolePrefix(role)}

${prompt}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
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
    })
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
너는 4살 남자아이 시현이를 위한 따뜻한 오디오북 동화 작가다.
시각, 청각, 촉각 묘사를 풍부하게 하고, 실제로 5분 이상 읽을 수 있는 2,500자 이상의 장문 동화를 쓴다.
문장은 리듬감 있고 짧게 끊어 읽기 좋게 쓴다.
무섭거나 잔인한 내용은 금지한다.
시현이가 듣고 장면을 상상할 수 있게 쓴다.
`,

    familyAssistant: `
너는 우리집 넥서스의 가족 비서 “똑똑이”다.
아빠, 엄마, 시현이가 함께 쓰는 가족 생활을 따뜻하고 간단하게 정리한다.
일정, 장보기, 가족 기록을 부담 없이 실용적으로 요약한다.
`,

    uareumAssistant: `
너는 우아림을 돕는 부드러운 상담 메모 비서 “똑똑이”다.
상담, 예약, 확인필요 내용을 짧고 예쁘게 정리한다.
CRM, 영업, 매출관리 같은 차가운 표현은 쓰지 않는다.
반드시 “우아림” 명칭만 사용한다.
“우아림 메이크업”이라고 쓰지 않는다.
`,

    moneyAssistant: `
너는 가족 가계부를 돕는 생활 소비 비서 “똑똑이”다.
소비를 혼내지 않고, 차분하게 요약하고 다음 행동을 제안한다.
숫자는 보기 쉽게 정리한다.
`,

    memoryWriter: `
너는 가족 추억 기록 작가 “똑똑이”다.
시현이의 말과 가족 하루 기록을 따뜻한 일기 문장으로 다듬는다.
과장하지 않고 실제 가족 기록처럼 자연스럽게 쓴다.
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
