(function() {
  const STORYBOOK_MAIN_COVER_SRC = './assets/stories/storybook_main_cover.png';
  const FEATURED_STORY_IDS = ['classic_1', 'classic_2', 'classic_4', 'classic_5'];
  const CLASSIC_STORY_CONFIGS = {
    classic_1: { contentKey: 'classic_1_pigs', imageDir: 'classic_three_little_pigs', imageReady: true },
    classic_2: { contentKey: 'classic_2_ugly_duckling', imageDir: 'classic_ugly_duckling', imageReady: true },
    classic_3: { contentKey: 'classic_cinderella', imageDir: 'classic_cinderella', imageReady: false },
    classic_4: { contentKey: 'classic_4_snow_white', imageDir: 'classic_snow_white', imageReady: true },
    classic_5: { contentKey: 'classic_5_jack_and_beanstalk', imageDir: 'classic_jack_and_the_beanstalk', imageReady: true },
    classic_6: { contentKey: 'classic_6_pinocchio', imageDir: 'classic_pinocchio', imageReady: false },
    classic_7: { contentKey: 'classic_7_red_riding_hood', imageDir: 'classic_red_riding_hood', imageReady: false },
    classic_8: { contentKey: 'classic_10_hansel_and_gretel', imageDir: 'classic_hansel_and_gretel', imageReady: false },
    classic_9: { contentKey: 'classic_thumbelina', imageDir: 'classic_thumbelina', imageReady: false },
    classic_10: { contentKey: 'classic_emperors_new_clothes', imageDir: 'classic_emperors_new_clothes', imageReady: false },
    classic_11: { contentKey: 'classic_little_mermaid', imageDir: 'classic_little_mermaid', imageReady: false },
    classic_12: { contentKey: 'classic_19_match_girl', imageDir: 'classic_little_match_girl', imageReady: false },
    classic_14: { contentKey: 'classic_14_sleeping_beauty', imageDir: 'classic_sleeping_beauty', imageReady: false },
    classic_15: { contentKey: 'classic_15_puss_in_boots', imageDir: 'classic_puss_in_boots', imageReady: false },
    classic_16: { contentKey: 'classic_16_rapunzel', imageDir: 'classic_rapunzel', imageReady: false },
    classic_17: { contentKey: 'classic_11_aladdin', imageDir: 'classic_aladdin', imageReady: false },
    classic_18: { contentKey: 'classic_18_alice', imageDir: 'classic_alice', imageReady: false },
    classic_19: { contentKey: 'classic_peter_pan', imageDir: 'classic_peter_pan', imageReady: false },
    classic_20: { contentKey: 'classic_20_wizard_of_oz', imageDir: 'classic_wizard_of_oz', imageReady: false }
  };
  const CLASSIC_STORY_PACK_ID_BY_SEED_ID = {
    classic_1: 'classic_three_little_pigs',
    classic_2: 'classic_ugly_duckling',
    classic_4: 'classic_snow_white',
    classic_5: 'classic_jack_and_the_beanstalk'
  };

  function getClassicStoryPacks() {
    if (window.StoryPackRegistry?.getAllPacks) return window.StoryPackRegistry.getAllPacks();
    return Object.assign({}, window.CLASSIC_STORY_PACKS || {}, window.GENERATED_STORY_PACKS || {}, window.CUSTOM_STORY_PACKS || {});
  }

  function getClassicPackBySeedId(seedId) {
    const id = String(seedId || '').trim();
    if (!id) return null;
    if (window.StoryPackRegistry?.getPackById) {
      const pack = window.StoryPackRegistry.getPackById(id);
      if (pack) return pack;
    }
    const packs = getClassicStoryPacks();
    const mapped = (window.STORYBOOK_PACK_ID_BY_SEED_ID && window.STORYBOOK_PACK_ID_BY_SEED_ID[id]) || CLASSIC_STORY_PACK_ID_BY_SEED_ID[id];
    return packs[mapped] || packs[id] || null;
  }

  function getStoryPackByStory(story) {
    if (!story) return null;
    if (window.StoryPackRegistry?.getPackByStory) {
      const pack = window.StoryPackRegistry.getPackByStory(story);
      if (pack) return pack;
    }
    return getClassicPackBySeedId(story.packId)
      || getClassicPackBySeedId(story.storyPackId)
      || getClassicPackBySeedId(story.sourceId)
      || getClassicPackBySeedId(story.id)
      || getClassicPackBySeedId(story.savedId)
      || getClassicPackBySeedId(story.contentKey);
  }

  function flattenPackTexts(pack) {
    if (!pack || !Array.isArray(pack.pages)) return [];
    return pack.pages.flatMap(page => Array.isArray(page.texts) ? page.texts : []).filter(Boolean);
  }

  let storyShelfStage = 'intro';
  let currentStoryFilter = '전체';
  window.currentStoryFilter = window.currentStoryFilter || currentStoryFilter;
  currentStoryFilter = window.currentStoryFilter;

  window.StoryPackRegistry?.prepareStoryLibrary?.();

  let storyReadState = {
    storyId: null,
    paragraphs: [],
    paragraphIndex: 0,
    sentences: [],
    sentenceIndex: 0,
    currentTone: 'gentle',
    isReading: false,
    isPaused: false,
    pendingTimer: null,
    pages: [],
    pageIndex: 0,
    pageSentenceIndex: 0,
    currentStory: null
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
    if (value.includes('...') || value.includes('…')) return basePause + 700;
    if (value.includes('?')) return basePause + 400;
    if (value.includes('!')) return basePause + 300;
    const commaCount = (value.match(/,/g) || []).length;
    if (commaCount >= 2) return basePause + 160;
    return basePause;
  }

  function defaultVoiceAudioMeta() {
    return {
      status: "none",
      provider: "",
      voiceId: "",
      audioKey: "",
      createdAt: null
    };
  }

  function renderReaderVoiceControls() {
    return '';
  }

  function getStoryCoverClass(theme) {
    const value = String(theme || '');
    if (value.includes('자동차')) return 'cover-auto';
    if (value.includes('공룡')) return 'cover-dino';
    if (value.includes('우주')) return 'cover-space';
    if (value.includes('바다')) return 'cover-sea';
    if (value.includes('잠자리')) return 'cover-bedtime';
    if (value.includes('전래')) return 'cover-folk';
    if (value.includes('세계명작') || value.includes('명작')) return 'cover-classic';
    return 'cover-classic';
  }

  function getStoryCoverEmoji(theme) {
    const value = String(theme || '');
    if (value.includes('자동차')) return '🚜';
    if (value.includes('공룡')) return 'Rex';
    if (value.includes('우주')) return '🚀';
    if (value.includes('바다')) return '🐳';
    if (value.includes('잠자리')) return '🌙';
    if (value.includes('전래')) return '🐯';
    if (value.includes('세계명작') || value.includes('명작')) return '🏰';
    if (value.includes('생활습관')) return '🪥';
    return '📖';
  }

  function getClassicConfig(story) {
    const id = String(story?.id || story?.sourceId || '').trim();
    return CLASSIC_STORY_CONFIGS[id] || null;
  }

  function getStoryContentKey(story) {
    if (!story) return '';
    return story.contentKey || getClassicConfig(story)?.contentKey || '';
  }

  function getStoryImageDir(story) {
    if (!story) return '';
    return story.imageDir || story.imageFolder || getClassicConfig(story)?.imageDir || '';
  }

  function getStoryCoverImage(story) {
    if (!story) return '';
    if (story.coverImage) return story.coverImage;
    const dir = getStoryImageDir(story);
    return dir ? `./assets/stories/classics/${dir}/cover.png` : '';
  }

  function getStoryPageImage(story, index) {
    const dir = getStoryImageDir(story);
    if (!dir) return '';
    return `./assets/stories/classics/${dir}/p${String(index + 1).padStart(3, '0')}.png`;
  }

  function isImageReadyStory(story) {
    if (!story) return false;
    if (story.imageReady) return true;
    return Boolean(getClassicConfig(story)?.imageReady);
  }

  function chunkParagraphsForPages(paragraphs, targetPageCount = 11) {
    const list = Array.isArray(paragraphs) ? paragraphs.filter(Boolean) : [];
    if (!list.length) return [];
    const pageCount = Math.max(1, Math.min(targetPageCount, list.length));
    const pages = Array.from({ length: pageCount }, () => []);
    list.forEach((paragraph, index) => {
      const pageIndex = Math.min(pageCount - 1, Math.floor(index * pageCount / list.length));
      pages[pageIndex].push(paragraph);
    });
    return pages.filter(items => items.length);
  }

  function buildStoryPages(story, paragraphs) {
    const desiredPageCount = isImageReadyStory(story) ? 11 : Math.max(1, Math.ceil((paragraphs || []).length / 2));
    const textPages = chunkParagraphsForPages(paragraphs, desiredPageCount);
    if (!textPages.length) return [];
    return textPages.map((texts, index) => ({
      index,
      image: getStoryPageImage(story, index),
      texts
    }));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, '&#39;');
  }

  function normalizeStory(story) {
    if (!story) return null;
    const seedId = story.sourceId || story.id || story.savedId || '';
    const pack = getStoryPackByStory(story) || getClassicPackBySeedId(seedId) || getClassicPackBySeedId(story.contentKey);
    const contentKey = getStoryContentKey(story);
    const full = pack || (contentKey ? window.STORY_CONTENTS?.[contentKey] : null);
    const packParagraphs = pack ? flattenPackTexts(pack) : [];
    const paragraphs = Array.isArray(story.paragraphs) && story.paragraphs.length
      ? story.paragraphs
      : packParagraphs.length
        ? packParagraphs
        : full?.paragraphs || (story.content ? [story.content] : []);
    const imageDir = pack?.imageDir || getStoryImageDir(story);
    const coverImage = pack?.coverImage || (imageDir ? `./assets/stories/classics/${imageDir}/cover.png` : getStoryCoverImage(story));
    const imageReady = Boolean(pack?.imageReady || isImageReadyStory(story));
    const normalized = {
      id: pack?.id || story.id || story.savedId || ('story_' + Date.now()),
      sourceId: story.sourceId || story.id || story.savedId || pack?.seedId || null,
      contentKey,
      title: story.title || full?.title || pack?.title || '시현이 동화',
      theme: story.theme || full?.theme || pack?.theme || '자동차',
      voiceTone: story.voiceTone || full?.voiceTone || pack?.voiceTone || getStoryVoiceTone(story.theme || full?.theme || pack?.theme || ''),
      summary: story.summary || story.desc || '저장한 동화',
      desc: story.desc || story.summary || full?.desc || pack?.desc || '저장한 동화',
      characters: Array.isArray(story.characters) ? story.characters : [],
      paragraphs,
      readingMinutes: story.readingMinutes || pack?.readingMinutes || Math.max(3, Math.ceil(paragraphs.join('').length / 550)),
      source: story.source || (story.hasFullContent || full || pack ? 'built-in' : 'ai'),
      familyIds: Array.isArray(story.familyIds) ? story.familyIds : [],
      friendIds: Array.isArray(story.friendIds) ? story.friendIds : [],
      petIds: Array.isArray(story.petIds) ? story.petIds : [],
      comfortToyIds: Array.isArray(story.comfortToyIds) ? story.comfortToyIds : [],
      classicCharacterIds: Array.isArray(story.classicCharacterIds) ? story.classicCharacterIds : [],
      storyGoal: story.storyGoal || '',
      conflict: story.conflict || '',
      magicObject: story.magicObject || '',
      emotionalTone: story.emotionalTone || '',
      successPattern: story.successPattern || story.storyPattern || '',
      storyPattern: story.storyPattern || story.successPattern || '',
      refrain: story.refrain || '',
      charCount: story.charCount || paragraphs.join('').length,
      paragraphCount: story.paragraphCount || paragraphs.length,
      imageDir,
      coverImage,
      imageReady
    };
    normalized.pages = Array.isArray(story.pages) && story.pages.length
      ? story.pages
      : pack?.pages?.length
        ? pack.pages
        : window.StoryPackRegistry?.buildPagesFromStory
          ? window.StoryPackRegistry.buildPagesFromStory(normalized, paragraphs)
          : buildStoryPages(normalized, paragraphs);
    return normalized;
  }


  function setStoryFilter(filter) {
    currentStoryFilter = filter;
    window.currentStoryFilter = filter;
    storyShelfStage = filter === '대표' ? 'intro' : 'classics';
    renderStoryLibrary();
  }

  function renderStoryWorld() {
    storyShelfStage = 'intro';
    renderStoryLibrary();
  }

  function renderSavedStories() {
    return Array.isArray(db.playground.storyWorld.savedStories) ? db.playground.storyWorld.savedStories : [];
  }

  function getFeaturedStories() {
    const library = Array.isArray(window.STORY_LIBRARY) ? window.STORY_LIBRARY : [];
    return FEATURED_STORY_IDS
      .map(id => library.find(story => story.id === id))
      .filter(Boolean)
      .map(normalizeStory)
      .filter(story => story?.paragraphs?.length);
  }

  function openStorybookIntro() {
    storyShelfStage = 'intro';
    renderStoryLibrary();
  }

  function openStorybookShelf() {
    storyShelfStage = 'classics';
    renderStoryLibrary();
  }

  function renderStorybookIntro(grid) {
    document.querySelector('.story-search-row')?.classList.add('story-ui-hidden');
    document.querySelector('.story-filter-row')?.classList.add('story-ui-hidden');
    const loadMore = document.getElementById('storyLoadMoreBtn');
    if (loadMore) loadMore.style.display = 'none';
    grid.className = 'story-card-grid storybook-intro-grid';
    grid.innerHTML = `
      <button class="storybook-main-cover-card" type="button" onclick="openStorybookShelf()" aria-label="명작 책장 열기">
        <img src="${STORYBOOK_MAIN_COVER_SRC}" alt="동화나라" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';">
        <span class="storybook-main-cover-fallback" style="display:none;">🏰</span>
      </button>
    `;
  }

  function renderStorybookShelf(grid) {
    const stories = getFeaturedStories();
    grid.className = 'story-card-grid storybook-featured-grid';
    grid.innerHTML = stories.map(story => {
      const cover = story.coverImage || '';
      const emoji = getStoryCoverEmoji(story.theme);
      return `
        <button class="storybook-book-card" type="button" onclick="readStoryById('${escapeAttr(story.sourceId || story.id)}')" aria-label="${escapeAttr(story.title)} 읽기">
          <span class="storybook-book-cover">
            ${cover ? `<img src="${cover}" alt="${escapeAttr(story.title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';">` : ''}
            <span class="storybook-book-fallback" ${cover ? 'style="display:none;"' : ''}>${emoji}</span>
          </span>
          <span class="storybook-book-title">${escapeHtml(story.title)}</span>
        </button>
      `;
    }).join('') || `
      <button class="storybook-main-cover-card" type="button" onclick="openStorybookIntro()">
        <span class="storybook-main-cover-fallback">🏰</span>
      </button>
    `;
  }

  function renderStoryLibrary() {
    const grid = document.getElementById('storyLibraryGrid');
    if (!grid) return;
    const reader = document.getElementById('storyReaderView');
    if (reader) reader.style.display = 'none';
    grid.style.display = 'grid';
    if (storyShelfStage === 'intro') renderStorybookIntro(grid);
    else renderStorybookShelf(grid);
  }

  function closeStoryReader() {
    const reader = document.getElementById('storyReaderView');
    const grid = document.getElementById('storyLibraryGrid');
    if (reader) reader.style.display = 'none';
    if (grid) grid.style.display = 'grid';
    stopStoryReading(true);
    releaseStoryLandscapeMode();
    storyShelfStage = 'classics';
    renderStoryLibrary();
    if (window.speakGuide) window.speakGuide('책장으로 돌아왔어. 다른 책도 골라 볼까?', true);
  }

  function showStoryReader() {
    const grid = document.getElementById('storyLibraryGrid');
    const reader = document.getElementById('storyReaderView');
    if (grid) grid.style.display = 'none';
    if (reader) reader.style.display = 'block';
  }
  function requestStoryLandscapeMode() {
    const orientation = window.screen?.orientation;
    if (!orientation || typeof orientation.lock !== 'function') return;
    try {
      const lockResult = orientation.lock('landscape');
      if (lockResult && typeof lockResult.catch === 'function') lockResult.catch(() => {});
    } catch (error) {}
  }

  function releaseStoryLandscapeMode() {
    const orientation = window.screen?.orientation;
    if (!orientation || typeof orientation.unlock !== 'function') return;
    try { orientation.unlock(); } catch (error) {}
  }


  function renderStoryPage() {
    const story = db.playground.storyWorld.currentStory;
    const normalized = normalizeStory(story);
    if (!normalized) return;
    const pageIndex = Math.max(0, Math.min(storyReadState.pageIndex || 0, normalized.pages.length - 1));
    const page = normalized.pages[pageIndex] || { texts: normalized.paragraphs || [], image: normalized.coverImage || '' };
    const imageHtml = page.image
      ? `<div class="storybook-page-illustration"><img src="${page.image}" alt="${escapeAttr(normalized.title)} ${pageIndex + 1}" onerror="this.parentElement.classList.add('image-missing'); this.style.display='none';"></div>`
      : `<div class="storybook-page-illustration image-missing"><span>${getStoryCoverEmoji(normalized.theme)}</span></div>`;
    const textHtml = (page.texts || []).map((text, index) => `
      <p class="story-paragraph" data-story-paragraph="${index}">${escapeHtml(text).replace(/시현/g, "<span class='highlight'>시현</span>")}</p>
    `).join('');
    const pageLabel = `${pageIndex + 1} / ${normalized.pages.length}`;
    document.getElementById('bookView').innerHTML = `
      <article class="storybook-reader-book" onclick="nextStoryParagraph()">
        <header class="storybook-reader-topline">
          <button class="storybook-reader-back" type="button" onclick="event.stopPropagation(); closeStoryReader();">← 책장</button>
          <div class="storybook-reader-page">${pageLabel}</div>
        </header>
        ${imageHtml}
        <section id="bookContentText" class="storybook-reader-text">${textHtml}</section>
      </article>
    `;
  }

  function renderStoryReader(story) {
    const normalized = normalizeStory(story);
    if (!normalized?.paragraphs?.length) return;
    db.playground.storyWorld.currentStory = normalized;
    db.playground.storyWorld.readingHistory.unshift({ id: normalized.id, title: normalized.title, readAt: Date.now() });
    db.playground.storyWorld.readingHistory = db.playground.storyWorld.readingHistory.slice(0, 30);
    storyReadState.currentStory = normalized;
    storyReadState.storyId = normalized.id;
    storyReadState.pages = normalized.pages;
    storyReadState.pageIndex = 0;
    storyReadState.pageSentenceIndex = 0;
    storyReadState.paragraphIndex = 0;

    const coverEmoji = getStoryCoverEmoji(normalized.theme);
    const coverHtml = `<div class="storybook-reader-hero">
  ${normalized.coverImage
    ? `<img src="${normalized.coverImage}" alt="${escapeHtml(normalized.title)}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid';">`
    : ''}
  <span class="storybook-reader-hero-fallback" style="${normalized.coverImage ? 'display:none;' : ''}">${coverEmoji}</span>
</div>`;

    document.getElementById('bookView').innerHTML = `
      <article class="storybook-reader-book" onclick="nextStoryParagraph()">
        <header class="storybook-reader-topline">
          <button class="storybook-reader-back" type="button" onclick="event.stopPropagation(); closeStoryReader();">← 책장</button>
          <div class="storybook-reader-page">1 / ${normalized.pages.length}</div>
        </header>
        ${coverHtml}
        <section id="bookContentText" class="storybook-reader-text">
          ${normalized.paragraphs.map((p, i) => `<p class="story-paragraph" data-story-paragraph="${i}">${escapeHtml(p).replace(/시현/g, "<span class='highlight'>시현</span>")}</p>`).join('')}
        </section>
      </article>
    `;

    renderStoryPage();
    refreshLegacyCompatibility();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function readStoryById(storyId) {
    requestStoryLandscapeMode();
    showStoryReader();
    const savedStories = renderSavedStories();
    const saved = savedStories.find(item => item.id === storyId || item.savedId === storyId);
    const seed = window.STORY_LIBRARY.find(item => item.id === storyId || item.contentKey === storyId || getStoryContentKey(item) === storyId);
    const target = saved || seed;
    const normalized = normalizeStory(target);
    if (normalized?.paragraphs?.length) {
      renderStoryReader(normalized);
      setTimeout(() => startStoryReading(normalized), 450);
      return;
    }
    if (window.speakGuide) window.speakGuide('이 책은 아직 글씨가 없어. 새 이야기 만들기를 눌러 줘.', true);
  }

  function buildPageSentences(page) {
    const texts = Array.isArray(page?.texts) ? page.texts : [];
    const sentences = [];
    texts.forEach((paragraph, paragraphIndex) => {
      splitKoreanSentences(paragraph).forEach(sentence => sentences.push({ text: sentence, paragraphIndex }));
    });
    return sentences;
  }

  function startStoryReading(story) {
    const normalized = normalizeStory(story || db.playground.storyWorld.currentStory);
    if (!normalized?.pages?.length) return;
    storyReadState.currentStory = normalized;
    storyReadState.storyId = normalized.id;
    storyReadState.pages = normalized.pages;
    storyReadState.pageIndex = Math.max(0, storyReadState.pageIndex || 0);
    storyReadState.pageSentenceIndex = 0;
    storyReadState.currentTone = normalized.voiceTone || getStoryVoiceTone(normalized.theme);
    storyReadState.isReading = true;
    storyReadState.isPaused = false;
    clearTimeout(storyReadState.pendingTimer);
    renderStoryPage();
    if (window.speakGuide) window.speakGuide('동화책을 읽어줄게.', true);
    storyReadState.pendingTimer = setTimeout(speakCurrentSentence, 700);
  }

  function speakStoryParagraphs(paragraphs, startIndex = 0) {
    const story = normalizeStory({
      id: 'manual_story',
      title: '동화',
      theme: '세계명작',
      paragraphs: paragraphs || []
    });
    storyReadState.pageIndex = Math.max(0, startIndex || 0);
    startStoryReading(story);
  }

  function speakCurrentSentence() {
    if (!storyReadState.isReading || storyReadState.isPaused) return;
    if (!('speechSynthesis' in window)) {
      alert('이 기기는 음성 읽어주기를 지원하지 않아요.');
      return;
    }
    const story = normalizeStory(storyReadState.currentStory || db.playground.storyWorld.currentStory);
    const page = story?.pages?.[storyReadState.pageIndex];
    if (!story || !page) {
      stopStoryReading(true);
      if (window.speakGuide) window.speakGuide('동화가 끝났어. 참 재미있었지?', true);
      return;
    }
    const sentences = buildPageSentences(page);
    const current = sentences[storyReadState.pageSentenceIndex];
    if (!current) {
      if (storyReadState.pageIndex < story.pages.length - 1) {
        storyReadState.pageIndex += 1;
        storyReadState.pageSentenceIndex = 0;
        renderStoryPage();
        storyReadState.pendingTimer = setTimeout(speakCurrentSentence, 850);
        return;
      }
      stopStoryReading(true);
      if (window.speakGuide) window.speakGuide('동화가 끝났어. 참 재미있었지?', true);
      return;
    }
    highlightStoryParagraph(current.paragraphIndex);
    window.speechSynthesis.cancel();
    const profile = getVoiceProfileByTone(storyReadState.currentTone);
    const utterance = new SpeechSynthesisUtterance(current.text);
    utterance.lang = 'ko-KR';
    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;
    utterance.onend = () => {
      if (!storyReadState.isReading || storyReadState.isPaused) return;
      storyReadState.pageSentenceIndex += 1;
      storyReadState.pendingTimer = setTimeout(speakCurrentSentence, getPauseAfterSentence(current.text, profile.pauseBase));
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
    storyReadState.pendingTimer = setTimeout(speakCurrentSentence, 500);
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
    const story = normalizeStory(storyReadState.currentStory || db.playground.storyWorld.currentStory);
    if (!story?.pages?.length) return;
    clearTimeout(storyReadState.pendingTimer);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (storyReadState.pageIndex < story.pages.length - 1) {
      storyReadState.pageIndex += 1;
      storyReadState.pageSentenceIndex = 0;
      storyReadState.isReading = true;
      storyReadState.isPaused = false;
      renderStoryPage();
      storyReadState.pendingTimer = setTimeout(speakCurrentSentence, 350);
    } else {
      stopStoryReading(true);
      if (window.speakGuide) window.speakGuide('마지막 장까지 다 읽었어.', true);
    }
  }

  function restartStoryReading() {
    const cur = normalizeStory(db.playground.storyWorld.currentStory);
    if (cur?.pages?.length) {
      storyReadState.pageIndex = 0;
      storyReadState.pageSentenceIndex = 0;
      startStoryReading(cur);
    }
  }

  function highlightStoryParagraph(index) {
    document.querySelectorAll('.story-paragraph').forEach((paragraph, paragraphIndex) => {
      paragraph.classList.toggle('reading-active', paragraphIndex === index);
    });
  }

  function getFamilyById(id) {
    return window.FAMILY_CAST?.find(item => item.id === id) || null;
  }

  function getFriendById(id) {
    return window.FRIEND_CAST?.find(item => item.id === id) || null;
  }

  function getPetById(id) {
    return window.PET_CAST?.find(item => item.id === id) || null;
  }

  function getComfortToyById(id) {
    return window.COMFORT_TOY_CAST?.find(item => item.id === id) || null;
  }

  function getClassicCharacterById(id) {
    return window.CLASSIC_CHARACTER_CAST?.find(item => item.id === id) || null;
  }

  function uniqueById(list) {
    const seen = new Set();
    return list.filter(item => {
      if (!item || !item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  function pickByTheme(pool, theme, limit) {
    const matched = pool.filter(item => Array.isArray(item.favoriteThemes) && item.favoriteThemes.includes(theme));
    const source = matched.length ? matched : pool;
    return uniqueById(source).slice(0, limit);
  }

  function selectStoryCast(seed) {
    const familyIds = Array.isArray(seed.familyIds) ? seed.familyIds : [];
    const friendIds = Array.isArray(seed.friendIds) ? seed.friendIds : [];
    const petIds = Array.isArray(seed.petIds) ? seed.petIds : [];
    const comfortToyIds = Array.isArray(seed.comfortToyIds) ? seed.comfortToyIds : [];
    const classicIds = Array.isArray(seed.classicCharacterIds) ? seed.classicCharacterIds : [];

    let family = familyIds.map(getFamilyById).filter(Boolean);
    let friends = friendIds.map(getFriendById).filter(Boolean);
    let pets = petIds.map(getPetById).filter(Boolean);
    let comfortToys = comfortToyIds.map(getComfortToyById).filter(Boolean);
    let classics = classicIds.map(getClassicCharacterById).filter(Boolean);

    if (!family.length) family = pickByTheme(window.FAMILY_CAST || [], seed.theme, 1);
    if (!friends.length) friends = pickByTheme(window.FRIEND_CAST || [], seed.theme, 2);
    if (!classics.length) classics = pickByTheme(window.CLASSIC_CHARACTER_CAST || [], seed.theme, 1);

    family = uniqueById(family).slice(0, 2);
    friends = uniqueById(friends).slice(0, 2);
    pets = uniqueById(pets).slice(0, 1);
    comfortToys = uniqueById(comfortToys).slice(0, 1);
    classics = uniqueById(classics).slice(0, 2);

    return { family, friends, pets, comfortToys, classics };
  }

  function formatCastForPrompt(cast) {
    const lines = [];
    cast.family.forEach(item => {
      lines.push(`- ${item.name}(${item.group}): ${item.roleTag}. 성격: ${item.personality} 역할: ${item.storyUse}`);
    });
    cast.friends.forEach(item => {
      lines.push(`- ${item.name}(${item.group || '시현이 친구'}): ${item.roleTag}. 성격: ${item.personality} 역할: ${item.storyUse}`);
    });
    cast.pets.forEach(item => {
      lines.push(`- ${item.name}(${item.group}): ${item.roleTag}. 성격: ${item.personality} 역할: ${item.storyUse}`);
    });
    cast.comfortToys.forEach(item => {
      lines.push(`- ${item.name}(${item.group}): ${item.roleTag}. 성격: ${item.personality} 역할: ${item.storyUse}`);
    });
    cast.classics.forEach(item => {
      lines.push(`- ${item.name}(${item.group || '동화 캐릭터'}): ${item.roleTag}. 성격: ${item.personality} 역할: ${item.storyUse} 안전조건: ${item.safetyNote || '원작의 무서운 요소는 쓰지 않는다.'}`);
    });
    return lines.join('\n');
  }

  function getSuccessPatternGuide(pattern) {
    const guides = {
      "car-repair": "익숙한 차고나 정비소에서 작은 문제가 생기고, 친구들이 단서를 찾고, 시현이가 마지막 정비 행동으로 해결한다.",
      "car-help": "자동차 친구가 곤란해지고, 작은 도움들이 모여 길을 열며, 시현이가 마지막 선택으로 친구를 돕는다.",
      "find-and-return": "잃어버린 물건이나 길을 찾고, 단서를 따라가며, 시현이가 원래 자리로 따뜻하게 돌려준다.",
      "gentle-rescue": "위험하지 않은 작은 곤란 상황을 차분하고 부드럽게 해결한다.",
      "dino-growth": "힘센 친구가 자신의 힘을 조심히 쓰는 법을 배우고, 시현이가 연습을 도와준다.",
      "sky-explore": "하늘이나 높은 곳을 상상으로 탐험하되 안전하고 밝은 분위기로 진행한다.",
      "sparkle-discovery": "반짝이는 단서나 물건을 발견하고 그 의미를 친구들과 함께 알아낸다.",
      "delivery-help": "작은 편지나 선물을 목적지까지 안전하게 전하는 구조다.",
      "slow-and-kind": "빠름과 느림을 비교하지 않고, 각자의 속도가 가진 장점을 보여준다.",
      "birthday-sharing": "생일이나 축하 장면에서 나눔과 웃음을 중심으로 전개한다.",
      "warm-sharing": "따뜻한 음식이나 선물을 나누며 마음이 풀리는 구조다.",
      "different-view": "서로 다른 키, 속도, 방법을 가진 친구들이 각자 편한 방식을 찾는다.",
      "space-repair": "우주선이나 로켓을 안전하게 고치고 다시 출발하는 구조다.",
      "star-collect": "별빛이나 작은 반짝임을 모으며 감정이나 기억을 정리한다.",
      "imagination-cooking": "상상 재료로 무언가를 만들며 친구들이 즐겁게 협력한다.",
      "rest-and-restart": "쉬어야 다시 움직일 수 있다는 안정적인 회복 구조다.",
      "sea-song": "바다의 소리와 노래를 따라가며 친구의 마음을 찾아준다.",
      "cheer-and-clap": "박수, 응원, 리듬으로 친구에게 용기를 주는 구조다.",
      "care-routine": "양치, 정리, 잠자리 준비 같은 루틴을 재미있게 바꾸는 구조다.",
      "sea-delivery": "바닷길을 따라 작은 택배나 선물을 안전하게 전한다.",
      "folk-kindness": "전래 느낌의 따뜻한 도움과 고마움이 중심이다.",
      "soft-tiger": "커다란 친구를 무섭지 않고 순하고 귀엽게 재해석한다.",
      "honest-choice": "정직을 직접 훈계하지 않고, 시현이의 선택으로 보여준다.",
      "share-and-song": "나눔과 노래가 함께 있는 밝은 이솝풍 구조다.",
      "truth-practice": "솔직하게 말하면 마음이 편해지는 경험을 사건으로 보여준다.",
      "different-comfort": "서로 편한 방식이 다를 수 있음을 부드럽게 보여준다.",
      "bedtime-calm": "밤, 구름, 달, 별을 활용해 하루 감정을 정리하고 잠자리로 돌아온다.",
      "bedtime-light": "작은 등불이나 별빛을 따라 마음이 차분해진다.",
      "goodnight-message": "굿나잇 인사와 애정 표현으로 포근하게 마무리한다.",
      "dream-ride": "꿈속 탈것을 타고 천천히 이동하다 이불 속으로 돌아온다."
    };
    return guides[pattern] || "선명한 사건 하나를 중심으로 도입, 작은 문제, 친구들의 도움, 시현이의 선택, 따뜻한 해결, 포근한 마무리로 구성한다.";
  }

  function buildQualityStoryPrompt(seed) {
    const cast = selectStoryCast(seed);
    const castPrompt = formatCastForPrompt(cast);
    const familyNames = cast.family.map(item => item.name);
    const friendNames = cast.friends.map(item => item.name);
    const petNames = cast.pets.map(item => item.name);
    const comfortToyNames = cast.comfortToys.map(item => item.name);
    const classicNames = cast.classics.map(item => item.name);
    const allNames = ["시현", ...familyNames, ...friendNames, ...petNames, ...comfortToyNames, ...classicNames];
    const patternGuide = getSuccessPatternGuide(seed.successPattern);

    return `
너는 4살 남자아이 시현이를 위한 가족 전용 유아동 오디오북 동화 작가다.

이번 동화는 "시현이 + 가족 + 현실 친구들 + 고양이/애착인형 + 익숙한 동화/전래/이솝 캐릭터"가 함께 등장하는 안전하고 따뜻한 새 이야기다.
원작을 그대로 반복하지 말고, 캐릭터의 성격과 상징만 가져와 완전히 새로운 모험으로 재구성한다.

[주인공]
- 시현
- 4살 남자아이
- 호기심이 많고 자동차, 공룡, 모험, 따뜻한 이야기를 좋아한다.
- 시현이는 항상 이야기의 중심 해결자다.
- 마지막 문제 해결 행동은 반드시 시현이가 한다.

[이번 동화 seed]
- 제목: ${seed.title}
- 테마: ${seed.theme}
- 설명: ${seed.desc}
- 목표: ${seed.storyGoal || '친구들과 함께 작은 문제를 해결한다.'}
- 작은 문제: ${seed.conflict || '친구들이 함께 해결할 수 있는 작고 안전한 문제가 생긴다.'}
- 특별한 물건: ${seed.magicObject || '반짝이는 작은 물건'}
- 감정 톤: ${seed.emotionalTone || '따뜻하고 신나는 가족 동화'}
- 성공 패턴: ${seed.successPattern || 'warm-adventure'}
- 성공 패턴 설명: ${patternGuide}

[이번 등장인물]
${castPrompt || '- 시현: 이야기의 중심 해결자'}

[등장인물 운영 규칙]
- 한 동화의 전체 등장인물은 3~6명 정도로 제한한다.
- 전체 등장인물은 많아도 장면마다 말하는 인물은 2명 이하로 제한한다.
- 현실 친구와 기존 동화 캐릭터는 역할이 겹치지 않게 한다.
- 친구들은 도와주고, 관찰하고, 응원하고, 단서를 주는 역할이다.
- 시현이가 마지막에 직접 선택하고 행동해서 문제를 해결한다.
- 등장인물 이름 목록: ${allNames.join(', ')}

[가족/고양이/애착인형 운영 규칙]
- 가족은 시현이를 대신 해결하지 않는다. 시현이를 믿어 주고 응원한다.
- 아빠와 엄마는 안정감과 따뜻한 칭찬을 담당한다.
- 할머니와 할아버지는 이야기 문을 열거나 차분한 지혜를 준다.
- 고모, 고모부, 삼촌은 놀이, 도구, 웃음, 모험 출발을 돕는다.
- 눈이와 름이는 고양이다. 사람처럼 길게 말하지 않고, 야옹, 살금살금, 꼬리 흔들기 같은 행동으로 단서를 준다.
- 시천이, 로나, 구름이는 시현이의 애착인형이다. 실제로 살아 움직이는 설정은 가능하지만 무섭지 않고 포근해야 한다.
- 애착인형은 시현이의 마음속 용기, 상상, 안정감을 도와주는 역할이다.
- 가족, 친구, 고양이, 애착인형, 명작 캐릭터가 모두 나와도 한 장면에 전부 말하게 하지 않는다.

[길이와 구조]
- 전체 1,200자 이상 1,800자 이하
- paragraphs 배열은 10개 이상 14개 이하
- 각 문단은 2~4문장
- 한 문단에는 중심 행동 하나만 담는다.
- 3~4분 정도 낭독하기 좋은 호흡으로 쓴다.
- 문장은 짧고 리듬감 있게 쓴다.
- 의성어와 의태어를 자연스럽게 넣는다.
- 반복 후렴구를 하나 만들고 이야기 중 2~3번 반복한다.
- 시현이에게 직접 묻는 문장을 1~2번 넣는다.

[안전 조건]
- 무섭거나 잔인한 장면 금지
- 독, 죽음, 잡아먹힘, 버림, 벌, 위협, 공포, 마녀의 공격 금지
- 원작의 위험한 사건 반복 금지
- 친구를 혼내거나 훈계하는 문체 금지
- 도덕 교과서처럼 직접 교훈을 설명하지 말 것
- 잠자리에서 읽어도 불안하지 않게 끝낼 것

[문단 구조]
1~2문단: 익숙하고 흥미로운 장소에서 시작한다.
3~4문단: 작고 안전한 문제가 생긴다.
5~8문단: 친구들과 게스트 캐릭터가 각자의 역할로 단서를 찾는다.
9~11문단: 시현이가 선택하고 직접 행동해서 해결한다.
12~14문단: 친구들이 고마워하고 따뜻하고 안정적으로 마무리한다.

[출력 형식]
반드시 JSON만 출력한다.
마크다운 코드블록 금지.
설명, 인사말, 주석 금지.

{
  "title": "동화 제목",
  "theme": "${seed.theme}",
  "summary": "짧은 요약",
  "readingMinutes": 3,
  "characters": ${JSON.stringify(allNames)},
  "familyIds": ${JSON.stringify(cast.family.map(item => item.id))},
  "friendIds": ${JSON.stringify(cast.friends.map(item => item.id))},
  "petIds": ${JSON.stringify(cast.pets.map(item => item.id))},
  "comfortToyIds": ${JSON.stringify(cast.comfortToys.map(item => item.id))},
  "classicCharacterIds": ${JSON.stringify(cast.classics.map(item => item.id))},
  "storyPattern": "${seed.successPattern || ''}",
  "refrain": "반복 후렴구",
  "paragraphs": [
    "문단 1",
    "문단 2"
  ]
}
`;
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
      story.theme &&
      Array.isArray(story.characters) &&
      Array.isArray(story.paragraphs) &&
      paragraphs.length >= 10 &&
      paragraphs.length <= 16 &&
      text.length >= 1200 &&
      text.includes('시현')
    );
  }

  function getStoryQualityInfo(story) {
    const paragraphs = Array.isArray(story?.paragraphs) ? story.paragraphs : [];
    const text = paragraphs.join('');
    return {
      charCount: text.length,
      paragraphCount: paragraphs.length,
      readingMinutes: Math.max(3, Math.ceil(text.length / 550))
    };
  }

  function buildExpandStoryPrompt(story, seed) {
    return `
아래 동화는 구조가 부족하거나 너무 짧다.
기존 제목, 테마, 등장인물, 분위기를 유지하면서
4살 아이가 듣기 좋은 3~4분 낭독 동화로 다시 다듬어라.

[기준]
- 주인공은 4살 남자아이 시현
- 시현이가 마지막 해결 행동을 한다.
- paragraphs 10개 이상 14개 이하
- 전체 1,200자 이상 1,800자 이하
- 각 문단 2~4문장
- 사건은 하나만 선명하게 유지
- 반복 후렴구 2~3회
- 무섭거나 잔인한 장면 금지
- 독, 죽음, 잡아먹힘, 버림, 벌, 위협, 공포 금지
- 원작 캐릭터가 있어도 위험한 원작 사건은 반복하지 말 것
- 가족은 시현이를 대신 해결하지 말고 응원과 안정감을 담당할 것
- 고양이와 애착인형은 단서, 귀여움, 포근함을 돕되 시현이가 중심일 것
- 따뜻하고 안정적인 결말
- JSON만 출력
- 마크다운 코드블록 금지

[seed]
제목: ${seed.title}
테마: ${seed.theme}
설명: ${seed.desc}
목표: ${seed.storyGoal || ''}
문제: ${seed.conflict || ''}
특별한 물건: ${seed.magicObject || ''}
성공 패턴: ${seed.successPattern || ''}

[기존 동화]
${JSON.stringify(story)}
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
        <span style="font-size:12px; color:var(--text-soft);">시현이와 친구들이 함께 떠나는 새 동화를 만드는 중입니다...</span>
      </div>
    `;

    speakGuide('똑똑이가 시현이와 친구들이 나오는 새 동화를 만들고 있어요.', true);

    try {
      let parsed = await window.callTtokttokiAi({
        role: "writer",
        prompt: buildQualityStoryPrompt(seed),
        temperature: 1.0,
        expectJson: true,
        useSearch: false
      });

      if (!validateGeneratedStory(parsed)) {
        view.innerHTML = `
          <div style="text-align:center; padding-top:100px; font-weight:900; color:var(--warning);">
            동화가 조금 짧게 나와서<br>
            똑똑이가 짧고 재미있는 새 동화로 다시 다듬고 있어요.
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

      const quality = getStoryQualityInfo(parsed);
      const savedStory = {
        id: 'sv_' + Date.now(),
        sourceId: seed.id,
        title: parsed.title || seed.title,
        theme: parsed.theme || seed.theme,
        voiceTone: parsed.voiceTone || seed.voiceTone || getStoryVoiceTone(seed.theme),
        summary: parsed.summary || seed.desc,
        characters: Array.isArray(parsed.characters) ? parsed.characters : seed.characters,
        familyIds: Array.isArray(parsed.familyIds) ? parsed.familyIds : (seed.familyIds || []),
        friendIds: Array.isArray(parsed.friendIds) ? parsed.friendIds : (seed.friendIds || []),
        petIds: Array.isArray(parsed.petIds) ? parsed.petIds : (seed.petIds || []),
        comfortToyIds: Array.isArray(parsed.comfortToyIds) ? parsed.comfortToyIds : (seed.comfortToyIds || []),
        classicCharacterIds: Array.isArray(parsed.classicCharacterIds) ? parsed.classicCharacterIds : (seed.classicCharacterIds || []),
        storyPattern: parsed.storyPattern || seed.successPattern || '',
        storyGoal: seed.storyGoal || '',
        conflict: seed.conflict || '',
        magicObject: seed.magicObject || '',
        emotionalTone: seed.emotionalTone || '',
        refrain: parsed.refrain || '',
        paragraphs: parsed.paragraphs,
        readingMinutes: quality.readingMinutes,
        charCount: quality.charCount,
        paragraphCount: quality.paragraphCount,
        createdAt: Date.now(),
        voiceAudio: defaultVoiceAudioMeta(),
        source: 'ai',
        storyPackMode: 'eleven_page_illustrated',
        expectedPageCount: window.STORYBOOK_EXPECTED_PAGE_COUNT || 11
      };

      const generatedPack = window.StoryPackRegistry?.makePackFromStory?.(savedStory, {
        packId: 'generated_' + savedStory.id,
        imageDir: 'generated/' + savedStory.id,
        sourceId: seed.id
      });
      if (generatedPack) {
        window.GENERATED_STORY_PACKS = window.GENERATED_STORY_PACKS || {};
        window.GENERATED_STORY_PACKS[generatedPack.id] = generatedPack;
        savedStory.packId = generatedPack.id;
        savedStory.storyPackId = generatedPack.id;
        savedStory.imageDir = generatedPack.imageDir;
        savedStory.imageReady = false;
        savedStory.pages = generatedPack.pages;
      }

      db.playground.storyWorld.savedStories.unshift(savedStory);
      db.playground.storyWorld.currentStory = savedStory;

      renderStoryReader(savedStory);
      gainExp(30);
      fireConfetti();
      speakGuide('똑똑이가 새 동화를 완성했어요!', true);

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
    const savedPackBase = {
      id: 'sv_' + Date.now(),
      sourceId: cur.sourceId || cur.id,
      title: cur.title,
      theme: cur.theme,
      voiceTone: cur.voiceTone || getStoryVoiceTone(cur.theme),
      summary: cur.summary || cur.desc || '저장한 동화',
      characters: cur.characters || [],
      familyIds: cur.familyIds || [],
      friendIds: cur.friendIds || [],
      petIds: cur.petIds || [],
      comfortToyIds: cur.comfortToyIds || [],
      classicCharacterIds: cur.classicCharacterIds || [],
      storyPattern: cur.storyPattern || cur.successPattern || '',
      storyGoal: cur.storyGoal || '',
      conflict: cur.conflict || '',
      magicObject: cur.magicObject || '',
      emotionalTone: cur.emotionalTone || '',
      refrain: cur.refrain || '',
      paragraphs: cur.paragraphs,
      readingMinutes: cur.readingMinutes,
      createdAt: Date.now(),
      voiceAudio: defaultVoiceAudioMeta(),
      source: cur.source || 'built-in',
      storyPackMode: 'eleven_page_illustrated',
      expectedPageCount: window.STORYBOOK_EXPECTED_PAGE_COUNT || 11
    };
    const savedGeneratedPack = window.StoryPackRegistry?.makePackFromStory?.(savedPackBase, {
      packId: 'generated_' + savedPackBase.id,
      imageDir: 'generated/' + savedPackBase.id,
      sourceId: savedPackBase.sourceId
    });
    if (savedGeneratedPack) {
      window.GENERATED_STORY_PACKS = window.GENERATED_STORY_PACKS || {};
      window.GENERATED_STORY_PACKS[savedGeneratedPack.id] = savedGeneratedPack;
      savedPackBase.packId = savedGeneratedPack.id;
      savedPackBase.storyPackId = savedGeneratedPack.id;
      savedPackBase.imageDir = savedGeneratedPack.imageDir;
      savedPackBase.imageReady = false;
      savedPackBase.pages = savedGeneratedPack.pages;
    } else {
      savedPackBase.pages = cur.pages || [];
    }
    savedStories.unshift(savedPackBase);
    save();
    renderStoryWorld();
    fireConfetti();
    alert('동화를 보관함에 저장했어요💖 언제든 다시 읽을 수 있습니다!');
  }

  function exportCurrentStoryPack() {
    const cur = normalizeStory(db.playground.storyWorld.currentStory);
    if (!cur?.paragraphs?.length) {
      alert('내보낼 동화가 없어요.');
      return;
    }
    const pack = window.StoryPackRegistry?.makePackFromStory?.(cur, {
      packId: cur.packId || cur.storyPackId || ('generated_' + (cur.id || Date.now())),
      imageDir: cur.imageDir || ('generated/' + (cur.id || Date.now())),
      sourceId: cur.sourceId || cur.id
    });
    if (!pack || !window.StoryPackRegistry?.downloadPackFile) {
      alert('동화 파일을 만들 수 없어요.');
      return;
    }
    window.StoryPackRegistry.downloadPackFile(pack);
  }

  function deleteSavedStory(id) {
    const savedStories = db.playground.storyWorld.savedStories;
    const index = savedStories.findIndex(story => story.id === id || story.savedId === id);
    if (index >= 0) savedStories.splice(index, 1);
    save();
    renderStoryWorld();
  }

  function readStory(index) {
    const packs = window.StoryPackRegistry?.getAllPacks?.() || {};
    const pack = Object.values(packs)[Number(index) || 0];
    if (pack?.id) {
      readStoryById(pack.id);
      return;
    }
    const story = (window.STORY_LIBRARY || [])[Number(index) || 0];
    if (story?.id) readStoryById(story.id);
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
  window.openStorybookIntro = openStorybookIntro;
  window.openStorybookShelf = openStorybookShelf;
  window.readStoryById = readStoryById;
  window.generateStoryFromSeed = generateStoryFromSeed;
  window.saveCurrentStory = saveCurrentStory;
  window.exportCurrentStoryPack = exportCurrentStoryPack;
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
