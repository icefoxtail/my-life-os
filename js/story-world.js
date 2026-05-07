(function() {
  let currentStoryFilter = '전체';
  window.currentStoryFilter = window.currentStoryFilter || currentStoryFilter;
  currentStoryFilter = window.currentStoryFilter;

  let storyReadState = {
    storyId: null,
    paragraphs: [],
    paragraphIndex: 0,
    sentences: [],
    sentenceIndex: 0,
    currentTone: 'gentle',
    isReading: false,
    isPaused: false,
    pendingTimer: null
  };
  window.storyReadState = storyReadState;

  function getStoryVoiceTone(theme) {
    const value = String(theme || '');
    if (value.includes('잠자리')) return 'bedtime';
    if (value.includes('공룡')) return 'adventure';
    if (value.includes('자동차') || value.includes('생활습관')) return 'bright';
    if (value.includes('세계명작') || value.includes('명작') || value.includes('우주')) return 'magical';
    if (value.includes('전래')) return 'folk';
    return 'gentle';
  }

  function getVoiceProfileByTone(tone) {
    const profiles = {
      bedtime: { rate: 0.72, pitch: 0.95, pauseBase: 650 },
      gentle: { rate: 0.82, pitch: 1.02, pauseBase: 430 },
      bright: { rate: 0.9, pitch: 1.12, pauseBase: 330 },
      adventure: { rate: 0.94, pitch: 1.08, pauseBase: 280 },
      magical: { rate: 0.8, pitch: 1.12, pauseBase: 520 },
      folk: { rate: 0.78, pitch: 0.98, pauseBase: 560 }
    };
    return profiles[tone] || profiles.gentle;
  }

  function splitKoreanSentences(text) {
    const value = String(text || '').trim();
    if (!value) return [];
    const matches = value.match(/[^.?!…]+[.?!…]+(?:["'”’])?|[^.?!…]+$/g);
    return (matches || [value]).map(sentence => sentence.trim()).filter(Boolean);
  }

  function getPauseAfterSentence(sentence, basePause) {
    const value = String(sentence || '');
    if (value.includes('...') || value.includes('…')) return basePause + 450;
    if (value.includes('?')) return basePause + 300;
    if (value.includes('!')) return basePause + 180;
    const commaCount = (value.match(/,/g) || []).length;
    if (commaCount >= 2) return basePause + 120;
    return basePause;
  }

  function normalizeStory(story) {
    if (!story) return null;
    const full = story.contentKey ? window.STORY_CONTENTS?.[story.contentKey] : null;
    const paragraphs = Array.isArray(story.paragraphs) && story.paragraphs.length
      ? story.paragraphs
      : full?.paragraphs || (story.content ? [story.content] : []);
    return {
      id: story.id || story.savedId || ('story_' + Date.now()),
      sourceId: story.sourceId || story.id || story.savedId || null,
      title: story.title || full?.title || '시현이 동화',
      theme: story.theme || full?.theme || '자동차',
      voiceTone: story.voiceTone || full?.voiceTone || getStoryVoiceTone(story.theme || full?.theme || ''),
      summary: story.summary || story.desc || '저장한 동화',
      desc: story.desc || story.summary || '저장한 동화',
      characters: Array.isArray(story.characters) ? story.characters : [],
      paragraphs,
      readingMinutes: story.readingMinutes || Math.max(1, Math.ceil(paragraphs.join('').length / 500)),
      source: story.source || (story.hasFullContent ? 'built-in' : 'ai')
    };
  }

  function setStoryFilter(filter) {
    currentStoryFilter = filter;
    window.currentStoryFilter = filter;
    const nav = document.getElementById('storyFilterNav');
    nav?.querySelectorAll('.status-badge').forEach(btn => {
      btn.classList.toggle('active', btn.innerText.includes(filter) || (filter === '전체' && btn.innerText.trim() === '전체'));
    });
    renderStoryLibrary();
  }

  function renderStoryWorld() {
    renderStoryLibrary();
  }

  function renderSavedStories() {
    return Array.isArray(db.playground.storyWorld.savedStories) ? db.playground.storyWorld.savedStories : [];
  }

  function renderStoryLibrary() {
    const grid = document.getElementById('storyLibraryGrid');
    if (!grid) return;
    const reader = document.getElementById('storyReaderView');
    if (reader) reader.style.display = 'none';
    grid.style.display = 'grid';

    const savedStories = renderSavedStories();
    const list = currentStoryFilter === '저장한 동화'
      ? savedStories
      : currentStoryFilter === '전체'
        ? window.STORY_LIBRARY
        : window.STORY_LIBRARY.filter(story => story.theme === currentStoryFilter);

    grid.innerHTML = list.map(story => {
      const saved = Boolean(story.source || story.paragraphs || story.savedId || story.content);
      const readId = story.id || story.savedId;
      const canRead = saved || story.hasFullContent || Boolean(story.content);
      return `
        <div class="story-card kids-story-card">
          <div class="story-theme">${escapeHtml(story.theme || '저장')}</div>
          <div class="story-card-title">${escapeHtml(story.title)}</div>
          <div class="story-card-desc">${escapeHtml(story.desc || story.summary || '')}</div>
          <div class="item-meta">예상 낭독 ${story.readingMinutes || 5}분 · ${canRead ? '바로 읽기 가능' : '새 이야기 만들기'}</div>
          <div class="story-card-actions">
            <button class="btn small outline" style="width:100%; min-height:48px;" onclick="readStoryById('${readId}')" ${canRead ? '' : 'disabled'}>▶ 감성 낭독</button>
            <button class="btn small ai-btn" style="width:100%; min-height:48px;" onclick="generateStoryFromSeed('${story.sourceId || story.id}')">✨ 새 이야기 만들기</button>
          </div>
          ${saved
            ? `<button class="del-btn" style="width:100%; margin-top:2px;" onclick="deleteSavedStory('${readId}')">삭제</button>`
            : `<button class="btn small outline" style="width:100%; min-height:48px;" onclick="readStoryById('${readId}'); saveCurrentStory();" ${canRead ? '' : 'disabled'}>💖 저장</button>`
          }
        </div>
      `;
    }).join('') || `<div class="item-meta bento-full" style="text-align:center; padding:30px;">해당하는 동화가 없어요.</div>`;
  }

  function closeStoryReader() {
    const reader = document.getElementById('storyReaderView');
    const grid = document.getElementById('storyLibraryGrid');
    if (reader) reader.style.display = 'none';
    if (grid) grid.style.display = 'grid';
    stopStoryReading(true);
    if (window.speakGuide) window.speakGuide('책을 덮었어. 다른 책을 골라 볼까?', true);
  }

  function showStoryReader() {
    const grid = document.getElementById('storyLibraryGrid');
    const reader = document.getElementById('storyReaderView');
    if (grid) grid.style.display = 'none';
    if (reader) reader.style.display = 'block';
  }

  function renderStoryReader(story) {
    const normalized = normalizeStory(story);
    if (!normalized) return;
    db.playground.storyWorld.currentStory = normalized;
    db.playground.storyWorld.readingHistory.unshift({ id: normalized.id, title: normalized.title, readAt: Date.now() });
    db.playground.storyWorld.readingHistory = db.playground.storyWorld.readingHistory.slice(0, 30);
    const paragraphsHtml = normalized.paragraphs.map((paragraph, index) => `
      <p class="story-paragraph" data-story-paragraph="${index}">${escapeHtml(paragraph).replace(/시현/g, "<span class='highlight'>시현</span>")}</p>
    `).join('');
    document.getElementById('bookView').innerHTML = `
      <div class="book-title">${escapeHtml(normalized.title)}</div>
      <div class="item-meta" style="text-align:center; margin:-10px 0 18px;">${escapeHtml(normalized.theme)} · 약 ${normalized.readingMinutes}분 · ${escapeHtml(normalized.characters.join(', '))}</div>
      <div id="bookContentText">${paragraphsHtml}</div>
    `;
    refreshLegacyCompatibility();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function readStoryById(storyId) {
    showStoryReader();
    const savedStories = renderSavedStories();
    const saved = savedStories.find(item => item.id === storyId || item.savedId === storyId);
    const seed = window.STORY_LIBRARY.find(item => item.id === storyId || item.contentKey === storyId);
    if (saved) {
      renderStoryReader(saved);
      if (window.speakGuide) window.speakGuide('읽고 싶은 동화를 골랐구나. 감성 낭독을 눌러 봐.', true);
      return;
    }
    if (seed?.hasFullContent) {
      renderStoryReader(normalizeStory(seed));
      if (window.speakGuide) window.speakGuide('읽고 싶은 동화를 골랐구나. 감성 낭독을 눌러 봐.', true);
      return;
    }
    if (window.speakGuide) window.speakGuide('이 책은 아직 글씨가 없어. 새 이야기 만들기를 눌러 줘.', true);
  }

  function startStoryReading(story) {
    const normalized = normalizeStory(story);
    if (!normalized?.paragraphs?.length) return;

    storyReadState.storyId = normalized.id;
    storyReadState.paragraphs = normalized.paragraphs;
    storyReadState.paragraphIndex = 0;
    storyReadState.currentTone = normalized.voiceTone || getStoryVoiceTone(normalized.theme);
    storyReadState.sentences = [];
    storyReadState.sentenceIndex = 0;
    storyReadState.isReading = true;
    storyReadState.isPaused = false;
    clearTimeout(storyReadState.pendingTimer);

    normalized.paragraphs.forEach((paragraph, paragraphIndex) => {
      splitKoreanSentences(paragraph).forEach(sentence => {
        storyReadState.sentences.push({ text: sentence, paragraphIndex });
      });
    });

    if (!storyReadState.sentences.length) return;
    if (window.speakGuide) window.speakGuide('이제 똑똑이가 부드럽게 읽어줄게.', true);
    storyReadState.pendingTimer = setTimeout(speakCurrentSentence, 1200);
  }

  function speakStoryParagraphs(paragraphs, startIndex = 0) {
    storyReadState.paragraphs = paragraphs;
    storyReadState.paragraphIndex = Math.max(0, startIndex);
    storyReadState.sentences = [];
    paragraphs.forEach((paragraph, paragraphIndex) => {
      splitKoreanSentences(paragraph).forEach(sentence => storyReadState.sentences.push({ text: sentence, paragraphIndex }));
    });
    const firstSentenceIndex = storyReadState.sentences.findIndex(item => item.paragraphIndex >= storyReadState.paragraphIndex);
    storyReadState.sentenceIndex = firstSentenceIndex >= 0 ? firstSentenceIndex : 0;
    storyReadState.isReading = true;
    storyReadState.isPaused = false;
    clearTimeout(storyReadState.pendingTimer);
    speakCurrentSentence();
  }

  function speakCurrentSentence() {
    if (!storyReadState.isReading || storyReadState.isPaused) return;
    if (!('speechSynthesis' in window)) {
      alert('이 기기는 음성 읽어주기를 지원하지 않아요.');
      return;
    }
    const current = storyReadState.sentences[storyReadState.sentenceIndex];
    if (!current) {
      stopStoryReading(true);
      if (window.speakGuide) window.speakGuide('동화가 끝났어. 참 재미있었지?', true);
      return;
    }
    storyReadState.paragraphIndex = current.paragraphIndex;
    highlightStoryParagraph(current.paragraphIndex);
    window.speechSynthesis.cancel();

    const profile = getVoiceProfileByTone(storyReadState.currentTone);
    const utterance = new SpeechSynthesisUtterance(current.text);
    utterance.lang = 'ko-KR';
    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;
    utterance.onend = () => {
      if (!storyReadState.isReading || storyReadState.isPaused) return;
      const pauseDuration = getPauseAfterSentence(current.text, profile.pauseBase);
      storyReadState.sentenceIndex += 1;
      storyReadState.pendingTimer = setTimeout(speakCurrentSentence, pauseDuration);
    };
    window.speechSynthesis.speak(utterance);
  }

  function pauseStoryReading() {
    if (!('speechSynthesis' in window)) return;
    if (storyReadState.isPaused) {
      resumeStoryReading();
      return;
    }
    storyReadState.isPaused = true;
    clearTimeout(storyReadState.pendingTimer);
    window.speechSynthesis.cancel();
    if (window.speakGuide) window.speakGuide('잠깐 쉬어갈게.', true);
  }

  function resumeStoryReading() {
    if (!('speechSynthesis' in window)) return;
    storyReadState.isPaused = false;
    storyReadState.isReading = true;
    if (window.speakGuide) window.speakGuide('다시 읽어볼게.', true);
    storyReadState.pendingTimer = setTimeout(speakCurrentSentence, 900);
  }

  function stopStoryReading(silent = false) {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    const wasReading = storyReadState.isReading || storyReadState.isPaused;
    storyReadState.isReading = false;
    storyReadState.isPaused = false;
    clearTimeout(storyReadState.pendingTimer);
    highlightStoryParagraph(-1);
    if (!silent && wasReading && window.speakGuide) window.speakGuide('동화를 멈췄어.', true);
  }

  function nextStoryParagraph() {
    if (!storyReadState.sentences.length) {
      const cur = db.playground.storyWorld.currentStory;
      if (cur?.paragraphs?.length) startStoryReading(cur);
      return;
    }
    const current = storyReadState.sentences[storyReadState.sentenceIndex];
    const currentParagraphIndex = current?.paragraphIndex ?? storyReadState.paragraphIndex;
    let nextIndex = storyReadState.sentenceIndex;
    while (nextIndex < storyReadState.sentences.length && storyReadState.sentences[nextIndex].paragraphIndex === currentParagraphIndex) {
      nextIndex += 1;
    }
    if (nextIndex >= storyReadState.sentences.length) {
      stopStoryReading();
      return;
    }
    clearTimeout(storyReadState.pendingTimer);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    storyReadState.sentenceIndex = nextIndex;
    storyReadState.isReading = true;
    storyReadState.isPaused = false;
    speakCurrentSentence();
  }

  function restartStoryReading() {
    const cur = db.playground.storyWorld.currentStory;
    if (cur?.paragraphs?.length) startStoryReading(cur);
  }

  function highlightStoryParagraph(index) {
    document.querySelectorAll('.story-paragraph').forEach((paragraph, paragraphIndex) => {
      paragraph.classList.toggle('reading-active', paragraphIndex === index);
      if (paragraphIndex === index) paragraph.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function buildLongStoryPrompt(seed) {
    return `
아래 조건에 맞춰 시현이를 위한 장문 동화를 JSON으로 작성하라.

[주인공]
- 이름: 시현
- 나이: 4살
- 특징: 자동차와 모험을 좋아하고, 호기심이 많음

[동화 씨앗]
- 제목: ${seed.title}
- 테마: ${seed.theme}
- 사건 전개(Plot): ${seed.plotSeed || seed.desc}
- 갈등 요소(Conflict): ${seed.conflict || '작은 문제가 발생함'}
- 시현이의 역할(Role): ${seed.sihyeonRole || '시현이가 직접 문제를 해결함'}
- 분위기(Mood): ${seed.mood || '따뜻함'}
- 등장인물: ${(seed.characters || []).join(", ")}

[목표]
- 부모가 아이에게 실제로 읽어줄 수 있는 따뜻한 오디오북 동화
- 너무 짧은 줄거리 요약이 아니라 장면이 이어지는 완성된 이야기
- 아이가 듣고 머릿속으로 상상할 수 있는 글
- 원작을 그대로 베끼지 말고, 반드시 시현이의 역할을 중심으로 재창조할 것

[분량]
- paragraphs는 18개 이상 24개 이하
- 전체 글자 수는 2,200자 이상
- 각 문단은 2문장 이상 4문장 이하
- readingMinutes는 5 이상으로 설정

[이야기 구조]
- 도입: 시현이가 신기한 상황이나 친구를 만난다.
- 전개: 작은 문제(Conflict)가 생기고, 시현이가 친구들과 해결 방법을 찾는다.
- 해결: 시현이가 주도적으로(Role) 행동해서 문제가 풀린다.
- 마무리: 모두가 안심하고 따뜻하게 끝난다.

[문체]
- 한국어
- 4살 아이가 듣기 좋은 부드러운 말투
- 짧고 리듬 있는 문장
- 의성어와 의태어를 자연스럽게 사용
- 시현이에게 말을 거는 문장을 2번 이상 포함
- 반복 후렴구를 1개 만들고 이야기 중 2번 이상 자연스럽게 반복

[금지]
- 무서운 장면, 잔인한 장면
- 혼내는 교훈체, 설명문처럼 딱딱한 문체
- 마크다운, 코드블록, JSON 밖의 문장

[출력 형식]
반드시 아래 JSON 구조만 출력하라.
{
  "title": "동화 제목",
  "theme": "${seed.theme}",
  "voiceTone": "${seed.voiceTone || 'gentle'}",
  "summary": "짧은 요약",
  "readingMinutes": 5,
  "characters": ["시현"],
  "refrain": "반복 후렴구",
  "paragraphs": [
    "문단 1",
    "문단 2"
  ]
}
`;
  }

  function validateGeneratedStory(story) {
    const paragraphs = Array.isArray(story?.paragraphs) ? story.paragraphs : [];
    const text = paragraphs.join('');
    return Boolean(
      story &&
      story.title &&
      Array.isArray(story.paragraphs) &&
      paragraphs.length >= 18 &&
      text.length >= 2200
    );
  }

  function buildExpandStoryPrompt(story, seed) {
    return `
아래 동화는 우리 앱의 기준보다 짧거나 구조가 불안정하다.
기존 제목, 테마, 등장인물, 시현이의 핵심 역할을 유지하면서 더 안정적인 장문 동화 JSON으로 다시 작성하라.

[기준]
- 주인공은 4살 남자아이 시현
- paragraphs는 18개 이상 24개 이하
- 전체 글자 수는 2,200자 이상
- 각 문단은 2문장 이상 4문장 이하
- readingMinutes는 5 이상
- 시현이가 직접 관찰하고 선택하고 해결하는 구조
- 시현이에게 말을 거는 문장 2번 이상
- 반복 후렴구 1개, 본문 중 2번 이상 사용
- 무섭거나 잔인한 장면 금지
- 따뜻하고 안정적인 결말
- JSON만 출력 (마크다운 금지)

[동화 씨앗]
제목: ${seed.title}
테마: ${seed.theme}
시현이의 역할: ${seed.sihyeonRole || '직접 문제를 해결함'}
등장인물: ${(seed.characters || []).join(", ")}

[기존 동화]
${JSON.stringify(story)}

[출력 형식]
{
  "title": "동화 제목",
  "theme": "${seed.theme}",
  "voiceTone": "${seed.voiceTone || 'gentle'}",
  "summary": "짧은 요약",
  "readingMinutes": 5,
  "characters": ["시현"],
  "refrain": "반복 후렴구",
  "paragraphs": [
    "문단 1",
    "문단 2"
  ]
}
`;
  }

  async function generateStoryFromSeed(storyId) {
    const seed = window.STORY_LIBRARY.find(item => item.id === storyId || item.contentKey === storyId);
    if (!seed) return;

    if (!window.getTtokttokiApiKey || !window.getTtokttokiApiKey()) {
      alert('똑똑이 연결 키가 없어요. 설정에서 연결 키를 저장해 주세요. 본문이 있는 기본 장문 동화는 바로 읽을 수 있어요.');
      return;
    }

    showStoryReader();

    const view = document.getElementById('bookView');
    view.innerHTML = `
      <div style="text-align:center; padding-top:100px; font-weight:900; color:var(--primary);">
        ✨ 똑똑이 작가가 [${escapeHtml(seed.title)}] 이야기를 쓰고 있어요.<br>
        <span style="font-size:12px; color:var(--text-soft);">시현이가 주인공이 되는 장문 동화를 만드는 중입니다...</span>
      </div>
    `;

    speakGuide('똑똑이가 시현이를 위한 특별한 동화를 만들고 있어요.', true);

    try {
      let parsed = await window.callTtokttokiAi({
        role: "writer",
        prompt: buildLongStoryPrompt(seed),
        temperature: 1.0,
        expectJson: true,
        useSearch: false
      });

      if (!validateGeneratedStory(parsed)) {
        view.innerHTML = `
          <div style="text-align:center; padding-top:100px; font-weight:900; color:var(--warning);">
            동화가 조금 짧게 나와서<br>
            똑똑이가 더 길고 재미있게 다시 늘리고 있어요.
          </div>
        `;

        parsed = await window.callTtokttokiAi({
          role: "writer",
          prompt: buildExpandStoryPrompt(parsed, seed),
          temperature: 1.0,
          expectJson: true,
          useSearch: false
        });
      }

      if (!validateGeneratedStory(parsed)) {
        throw new Error(`Generated story too short or malformed.`);
      }

      const savedStory = {
        id: 'sv_' + Date.now(),
        sourceId: seed.id,
        title: parsed.title || seed.title,
        theme: parsed.theme || seed.theme,
        voiceTone: parsed.voiceTone || seed.voiceTone || getStoryVoiceTone(seed.theme),
        summary: parsed.summary || seed.desc,
        characters: Array.isArray(parsed.characters) ? parsed.characters : seed.characters,
        refrain: parsed.refrain || '',
        paragraphs: parsed.paragraphs,
        readingMinutes: Math.max(5, Math.ceil((parsed.paragraphs.join('')).length / 500)),
        createdAt: Date.now(),
        source: 'ai'
      };

      db.playground.storyWorld.savedStories.unshift(savedStory);
      db.playground.storyWorld.currentStory = savedStory;

      renderStoryReader(savedStory);
      gainExp(30);
      fireConfetti();
      speakGuide('똑똑이가 새 장문 동화를 완성했어요!', true);

    } catch (error) {
      console.error(error);
      view.innerHTML = `
        <div style="text-align:center; padding-top:100px; color:var(--danger); font-weight:900;">
          동화를 완성하지 못했어요.<br>
          연결 키, 인터넷 상태, 모델 응답 상태를 확인해 주세요.<br>
          본문이 있는 기본 동화는 바로 읽을 수 있어요.
        </div>
      `;
    }
  }

  function saveCurrentStory() {
    const cur = normalizeStory(db.playground.storyWorld.currentStory);
    if (!cur?.paragraphs?.length) {
      if (window.speakGuide) window.speakGuide('저장할 동화 내용이 없어요.', true);
      return;
    }
    const savedStories = db.playground.storyWorld.savedStories;
    const isExist = savedStories.find(story => story.title === cur.title && JSON.stringify(story.paragraphs) === JSON.stringify(cur.paragraphs));
    if (isExist) {
      if (window.speakGuide) window.speakGuide('이미 보관함에 저장된 동화야.', true);
      return;
    }
    savedStories.unshift({
      id: 'sv_' + Date.now(),
      sourceId: cur.sourceId || cur.id,
      title: cur.title,
      theme: cur.theme,
      voiceTone: cur.voiceTone || getStoryVoiceTone(cur.theme),
      summary: cur.summary || cur.desc || '저장한 동화',
      characters: cur.characters || [],
      refrain: cur.refrain || '',
      paragraphs: cur.paragraphs,
      readingMinutes: cur.readingMinutes,
      createdAt: Date.now(),
      source: cur.source || 'built-in'
    });
    save();
    renderStoryWorld();
    fireConfetti();
    alert('동화를 보관함에 저장했어요💖 언제든 다시 읽을 수 있습니다!');
  }

  function deleteSavedStory(id) {
    const savedStories = db.playground.storyWorld.savedStories;
    const index = savedStories.findIndex(story => story.id === id || story.savedId === id);
    if (index >= 0) savedStories.splice(index, 1);
    save();
    renderStoryWorld();
  }

  function readStory(index) {
    const book = window.STORY_CONTENTS[Object.keys(window.STORY_CONTENTS)[index]];
    showStoryReader();
    db.playground.storyWorld.currentStory = {
      id: `static_${index}`,
      theme: book.theme,
      title: book.title,
      desc: '기본 동화',
      content: book.paragraphs.join(' ')
    };
    document.getElementById('bookView').innerHTML = `<div class="book-title">${book.title}</div><div id="bookContentText">${book.paragraphs.map(p => `<p class="story-paragraph">${p}</p>`).join('')}</div>`;
  }

  async function generateGeminiStory() {
    const firstSeed = window.STORY_LIBRARY.find(story => story.theme === '자동차' && !story.hasFullContent) || window.STORY_LIBRARY[0];
    if (firstSeed) {
      await generateStoryFromSeed(firstSeed.id);
    }
  }

  function speakBookText() {
    if (db.playground.storyWorld.currentStory?.paragraphs?.length) {
      startStoryReading(db.playground.storyWorld.currentStory);
      return;
    }
    const el = document.getElementById('bookContentText');
    if (!el) return alert('먼저 동화를 선택해 주세요!');
    speakStory(el.innerText);
  }

  window.setStoryFilter = setStoryFilter;
  window.readStoryById = readStoryById;
  window.generateStoryFromSeed = generateStoryFromSeed;
  window.saveCurrentStory = saveCurrentStory;
  window.deleteSavedStory = deleteSavedStory;
  window.closeStoryReader = closeStoryReader;
  window.speakBookText = speakBookText;
  window.pauseStoryReading = pauseStoryReading;
  window.resumeStoryReading = resumeStoryReading;
  window.nextStoryParagraph = nextStoryParagraph;
  window.stopStoryReading = stopStoryReading;
  window.restartStoryReading = restartStoryReading;
  window.readStory = readStory;
  window.generateGeminiStory = generateGeminiStory;
  window.renderStoryWorld = renderStoryWorld;
  window.validateGeneratedStory = validateGeneratedStory;
  window.buildExpandStoryPrompt = buildExpandStoryPrompt;
})();
