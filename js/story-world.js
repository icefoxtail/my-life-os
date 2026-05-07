(function() {
  let currentStoryFilter = '전체';
  window.currentStoryFilter = window.currentStoryFilter || currentStoryFilter;
  currentStoryFilter = window.currentStoryFilter;

  let storyReadState = {
    storyId: null,
    paragraphs: [],
    paragraphIndex: 0,
    isReading: false,
    isPaused: false
  };

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
        <div class="story-card">
          <div class="story-theme">${escapeHtml(story.theme || '저장')}</div>
          <div style="font-size:19px; font-weight:900; line-height:1.25;">${escapeHtml(story.title)}</div>
          <div style="font-size:14px; color:var(--text-soft); line-height:1.45; font-weight:700; flex:1;">${escapeHtml(story.desc || story.summary || '')}</div>
          <div class="item-meta">예상 낭독 ${story.readingMinutes || 5}분 · ${canRead ? '본문 있음' : 'AI 생성 필요'}</div>
          <button class="btn small outline" style="width:100%; min-height:44px;" onclick="readStoryById('${readId}')" ${canRead ? '' : 'disabled'}>📖 읽기</button>
          <button class="btn small ai-btn" style="width:100%; min-height:44px;" onclick="generateStoryFromSeed('${story.sourceId || story.id}')">✨ AI로 만들기</button>
          ${saved
            ? `<button class="del-btn" style="width:100%; margin-top:2px;" onclick="deleteSavedStory('${readId}')">삭제</button>`
            : `<button class="btn small outline" style="width:100%; min-height:44px;" onclick="readStoryById('${readId}'); saveCurrentStory();" ${canRead ? '' : 'disabled'}>💖 저장</button>`
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
    stopStoryReading();
    stopSpeaking();
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
      return;
    }
    if (seed?.hasFullContent) {
      renderStoryReader(normalizeStory(seed));
      return;
    }
    alert('이 카드는 아직 장문 본문이 없어요. AI로 만들기를 눌러 주세요.');
  }

  function startStoryReading(story) {
    const normalized = normalizeStory(story);
    if (!normalized?.paragraphs?.length) return;
    storyReadState.storyId = normalized.id;
    storyReadState.paragraphs = normalized.paragraphs;
    storyReadState.paragraphIndex = 0;
    storyReadState.isReading = true;
    storyReadState.isPaused = false;
    speakStoryParagraphs(storyReadState.paragraphs, 0);
  }

  function speakStoryParagraphs(paragraphs, startIndex = 0) {
    if (!('speechSynthesis' in window)) {
      alert('이 기기는 음성 읽어주기를 지원하지 않아요.');
      return;
    }
    window.speechSynthesis.cancel();
    storyReadState.paragraphs = paragraphs;
    storyReadState.paragraphIndex = startIndex;
    storyReadState.isReading = true;
    storyReadState.isPaused = false;
    speakCurrentParagraph();
  }

  function speakCurrentParagraph() {
    if (!storyReadState.isReading || storyReadState.isPaused) return;
    const text = storyReadState.paragraphs[storyReadState.paragraphIndex];
    if (!text) {
      stopStoryReading();
      return;
    }
    highlightStoryParagraph(storyReadState.paragraphIndex);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = db.settings.voiceGuide.rate || 0.85;
    utterance.pitch = db.settings.voiceGuide.pitch || 1.1;
    utterance.onend = () => {
      if (!storyReadState.isReading || storyReadState.isPaused) return;
      storyReadState.paragraphIndex++;
      if (storyReadState.paragraphIndex < storyReadState.paragraphs.length) speakCurrentParagraph();
      else stopStoryReading();
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
    window.speechSynthesis.pause();
  }

  function resumeStoryReading() {
    if (!('speechSynthesis' in window)) return;
    storyReadState.isPaused = false;
    storyReadState.isReading = true;
    window.speechSynthesis.resume();
  }

  function stopStoryReading() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    storyReadState.isReading = false;
    storyReadState.isPaused = false;
    highlightStoryParagraph(-1);
  }

  function nextStoryParagraph() {
    if (!storyReadState.paragraphs.length) {
      const cur = db.playground.storyWorld.currentStory;
      if (cur?.paragraphs?.length) storyReadState.paragraphs = cur.paragraphs;
    }
    if (!storyReadState.paragraphs.length) return;
    storyReadState.paragraphIndex = Math.min(storyReadState.paragraphIndex + 1, storyReadState.paragraphs.length - 1);
    storyReadState.isReading = true;
    storyReadState.isPaused = false;
    speakCurrentParagraph();
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

  function parseGeneratedStoryText(text, seed) {
    const cleaned = text.replace(/```json|```/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed.paragraphs)) return parsed;
    } catch (error) {
      console.warn('Story JSON parse failed, falling back to line split.', error);
    }
    const paragraphs = cleaned.split(/\n+/).map(line => line.trim()).filter(Boolean);
    return { title: seed.title, theme: seed.theme, summary: seed.desc, characters: ['시현', ...seed.characters.filter(name => name !== '시현')], paragraphs };
  }

  function buildLongStoryPrompt(seed) {
    return `
너는 4살 남자아이 시현이만을 위한 세계 최고의 유아동 동화 작가이자 낭독용 오디오북 작가다.

너의 목표는 짧은 줄거리 요약이 아니라, 실제로 5분 이상 읽어줄 수 있는 장문 동화를 쓰는 것이다.
이 동화는 눈으로 읽는 글이 아니라 귀로 듣는 글이다.
따라서 문장은 리듬감 있고, 너무 길지 않아야 하며, 아이가 듣고 장면을 상상할 수 있어야 한다.

[주인공]
- 이름: 시현
- 나이: 4살
- 성격: 호기심 많고, 자동차와 모험을 좋아함

[이번 동화 seed]
- 제목: ${seed.title}
- 테마: ${seed.theme}
- 설명: ${seed.desc}
- 등장인물 힌트: ${(seed.characters || []).join(", ")}

[절대 조건]
- 전체 글자 수는 반드시 2,500자 이상
- paragraphs 배열은 반드시 20개 이상 25개 이하
- 각 문단은 2~4문장
- 무섭거나 잔인한 장면 금지
- 마지막은 따뜻하고 안정적으로 끝낼 것
- 시현이가 직접 문제를 해결하는 구조
- 의성어/의태어를 풍부하게 사용할 것
- 시각, 청각, 촉각 묘사를 골고루 넣을 것
- 시현이에게 직접 묻는 문장을 최소 3번 넣을 것
- 반복되는 후렴구를 하나 만들고 이야기 중 3번 이상 자연스럽게 반복할 것
- 단순 교훈 설명 금지
- 지루한 도덕 교과서 문체 금지
- 실제 잠자리에서 읽어줄 수 있게 부드럽고 몰입감 있게 작성

[문단 구조]
1~5문단: 호기심을 자극하는 도입. 소리와 움직임을 생생하게 묘사.
6~15문단: 문제가 생기고, 시현이가 친구들과 함께 해결 방법을 찾는 모험.
16~22문단: 시현이의 선택과 행동으로 문제가 해결됨.
23~25문단: 따뜻한 칭찬과 포근한 마무리.

[출력 형식]
반드시 JSON만 출력한다.
마크다운 코드블록을 쓰지 마라.
설명, 인사말, 주석을 쓰지 마라.

{
  "title": "동화 제목",
  "theme": "${seed.theme}",
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
      paragraphs.length >= 20 &&
      text.length >= 2500
    );
  }

  function getStoryQualityInfo(story) {
    const paragraphs = Array.isArray(story?.paragraphs) ? story.paragraphs : [];
    const text = paragraphs.join('');
    return {
      charCount: text.length,
      paragraphCount: paragraphs.length,
      readingMinutes: Math.max(5, Math.ceil(text.length / 500))
    };
  }

  function buildExpandStoryPrompt(story, seed) {
    return `
아래 동화는 너무 짧다.
기존 내용의 분위기, 등장인물, 제목, 테마를 유지하면서
5분 이상 낭독 가능한 장문 동화로 확장하라.

[기준]
- 주인공은 4살 남자아이 시현
- paragraphs 20개 이상 25개 이하
- 전체 2,500자 이상
- 각 문단 2~4문장
- 시현이에게 직접 묻는 문장 3회 이상
- 반복 후렴구 3회 이상
- 장면 묘사를 더 풍부하게
- 무섭거나 잔인한 장면 금지
- 따뜻한 결말
- JSON만 출력
- 마크다운 코드블록 금지

[seed]
제목: ${seed.title}
테마: ${seed.theme}
설명: ${seed.desc}

[기존 동화]
${JSON.stringify(story)}
`;
  }

  async function generateStoryFromSeed(storyId) {
    const seed = window.STORY_LIBRARY.find(item => item.id === storyId || item.contentKey === storyId);
    if (!seed) return;

    if (!window.getTtokttokiApiKey || !window.getTtokttokiApiKey()) {
      alert('똑똑이 연결 키가 없어요. 고급 설정에서 연결 키를 저장해 주세요. 본문이 있는 기본 장문 동화는 바로 읽을 수 있어요.');
      return;
    }

    showStoryReader();

    const view = document.getElementById('bookView');
    view.innerHTML = `
      <div style="text-align:center; padding-top:100px; font-weight:900; color:var(--primary);">
        ✨ 똑똑이 작가가 [${escapeHtml(seed.title)}] 이야기를 쓰고 있어요.<br>
        <span style="font-size:12px; color:var(--text-soft);">5분 이상 읽을 수 있는 장문 동화를 만드는 중입니다.</span>
      </div>
    `;

    speakGuide('똑똑이가 긴 동화를 만들고 있어요.');

    try {
      let parsed = await window.callTtokttokiAi({
        role: "writer",
        prompt: buildLongStoryPrompt(seed),
        temperature: 0.9,
        expectJson: true
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
          temperature: 0.85,
          expectJson: true
        });
      }

      if (!validateGeneratedStory(parsed)) {
        const quality = getStoryQualityInfo(parsed);
        throw new Error(`Generated story too short: ${quality.paragraphCount} paragraphs, ${quality.charCount} chars`);
      }

      const quality = getStoryQualityInfo(parsed);

      const savedStory = {
        id: 'sv_' + Date.now(),
        sourceId: seed.id,
        title: parsed.title || seed.title,
        theme: parsed.theme || seed.theme,
        summary: parsed.summary || seed.desc,
        characters: Array.isArray(parsed.characters) ? parsed.characters : seed.characters,
        refrain: parsed.refrain || '',
        paragraphs: parsed.paragraphs,
        readingMinutes: quality.readingMinutes,
        charCount: quality.charCount,
        paragraphCount: quality.paragraphCount,
        createdAt: Date.now(),
        source: 'ai'
      };

      db.playground.storyWorld.savedStories.unshift(savedStory);
      db.playground.storyWorld.currentStory = savedStory;

      renderStoryReader(savedStory);
      gainExp(30);
      fireConfetti();
      speakGuide('똑똑이가 새 장문 동화를 완성했어요!');

    } catch (error) {
      console.error(error);
      view.innerHTML = `
        <div style="text-align:center; padding-top:100px; color:var(--danger); font-weight:900;">
          동화를 만들지 못했어요.<br>
          똑똑이 연결 키나 인터넷 연결을 확인해 주세요.<br>
          기본 장문 동화는 바로 읽을 수 있어요.
        </div>
      `;
    }
  }

  function saveCurrentStory() {
    const cur = normalizeStory(db.playground.storyWorld.currentStory);
    if (!cur?.paragraphs?.length) return alert('저장할 동화 내용이 없어요!');
    const savedStories = db.playground.storyWorld.savedStories;
    const isExist = savedStories.find(story => story.title === cur.title && JSON.stringify(story.paragraphs) === JSON.stringify(cur.paragraphs));
    if (isExist) return alert('이미 보관함에 저장된 동화예요💖');
    savedStories.unshift({
      id: 'sv_' + Date.now(),
      sourceId: cur.sourceId || cur.id,
      title: cur.title,
      theme: cur.theme,
      summary: cur.summary || cur.desc || '저장한 동화',
      characters: cur.characters || [],
      refrain: cur.refrain || '',
      paragraphs: cur.paragraphs,
      readingMinutes: cur.readingMinutes,
      charCount: cur.charCount || cur.paragraphs.join('').length,
      paragraphCount: cur.paragraphCount || cur.paragraphs.length,
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
    const book = STATIC_STORIES[index];
    showStoryReader();
    db.playground.storyWorld.currentStory = {
      id: `static_${index}`,
      theme: '자동차',
      title: book.t,
      desc: '기본 동화',
      content: book.c.replace(/<[^>]*>/g, '')
    };
    document.getElementById('bookView').innerHTML = `<div class="book-title">${book.t}</div><div id="bookContentText">${book.c}</div>`;
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
