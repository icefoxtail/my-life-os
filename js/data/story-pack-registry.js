/* ═══════════════════════════════════════════
   SIHYEON PLAY OS - STORY PACK REGISTRY
   js/data/story-pack-registry.js
   - 모든 장문/명작/창작 동화를 11페이지 그림책 포맷으로 통일
   - 개별 콘텐츠 파일 구조를 위한 공통 유틸리티
═══════════════════════════════════════════ */
(function () {
  'use strict';

  const EXPECTED_PAGE_COUNT = 11;

  const PACK_ID_BY_SEED_ID = {
    classic_1: 'classic_three_little_pigs',
    classic_2: 'classic_ugly_duckling',
    classic_4: 'classic_snow_white',
    classic_5: 'classic_jack_and_the_beanstalk'
  };

  const IMAGE_DIR_BY_SEED_ID = {
    classic_1: 'classic_three_little_pigs',
    classic_2: 'classic_ugly_duckling',
    classic_3: 'classic_cinderella',
    classic_4: 'classic_snow_white',
    classic_5: 'classic_jack_and_the_beanstalk',
    classic_6: 'classic_pinocchio',
    classic_7: 'classic_red_riding_hood',
    classic_8: 'classic_hansel_and_gretel',
    classic_9: 'classic_thumbelina',
    classic_10: 'classic_emperors_new_clothes',
    classic_11: 'classic_little_mermaid',
    classic_12: 'classic_little_match_girl',
    classic_13: 'classic_bremen_town_musicians',
    classic_14: 'classic_sleeping_beauty',
    classic_15: 'classic_puss_in_boots',
    classic_16: 'classic_rapunzel',
    classic_17: 'classic_aladdin',
    classic_18: 'classic_alice',
    classic_19: 'classic_peter_pan',
    classic_20: 'classic_wizard_of_oz',
    classic_21: 'classic_beauty_and_the_beast',
    classic_22: 'classic_swan_lake',
    classic_23: 'classic_pied_piper',
    classic_24: 'classic_nutcracker',
    classic_25: 'classic_snow_queen',
    classic_26: 'classic_golden_goose',
    classic_27: 'classic_gulliver',
    classic_28: 'classic_ali_baba',
    classic_29: 'classic_midas',
    classic_30: 'classic_prince_and_pauper'
  };

  function getAllPacks() {
    return Object.assign(
      {},
      window.CLASSIC_STORY_PACKS || {},
      window.GENERATED_STORY_PACKS || {},
      window.CUSTOM_STORY_PACKS || {}
    );
  }

  function toSafeId(value) {
    return String(value || 'story')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'story';
  }

  function getPackIdBySeedId(seedId) {
    const id = String(seedId || '').trim();
    if (!id) return '';
    return PACK_ID_BY_SEED_ID[id] || id;
  }

  function getImageDirBySeedId(seedId) {
    const id = String(seedId || '').trim();
    if (!id) return '';
    return IMAGE_DIR_BY_SEED_ID[id] || PACK_ID_BY_SEED_ID[id] || '';
  }

  function getPackById(id) {
    const key = String(id || '').trim();
    if (!key) return null;
    const packs = getAllPacks();
    return packs[key] || packs[getPackIdBySeedId(key)] || null;
  }

  function getPackByStory(story) {
    if (!story) return null;
    return getPackById(story.packId)
      || getPackById(story.storyPackId)
      || getPackById(story.sourceId)
      || getPackById(story.id)
      || getPackById(story.savedId)
      || getPackById(story.contentKey);
  }

  function splitSentences(text) {
    const value = String(text || '').trim();
    if (!value) return [];
    const matches = value.match(/[^.?!…]+[.?!…]+(?:["'”’])?|[^.?!…]+$/g);
    return (matches || [value]).map(item => item.trim()).filter(Boolean);
  }

  function normalizeTexts(input) {
    const raw = Array.isArray(input) ? input : [input];
    const parts = [];
    raw.forEach((item) => {
      const text = String(item || '').trim();
      if (!text) return;
      if (text.length > 220) parts.push(...splitSentences(text));
      else parts.push(text);
    });
    return parts.filter(Boolean);
  }

  function splitTextsToElevenPages(input) {
    const texts = normalizeTexts(input);
    const pages = Array.from({ length: EXPECTED_PAGE_COUNT }, () => []);
    if (!texts.length) return pages;

    texts.forEach((text, index) => {
      const pageIndex = Math.min(EXPECTED_PAGE_COUNT - 1, Math.floor(index * EXPECTED_PAGE_COUNT / texts.length));
      pages[pageIndex].push(text);
    });

    for (let i = 0; i < pages.length; i += 1) {
      if (pages[i].length || !texts.length) continue;
      const donorIndex = pages.findIndex(page => page.length > 1);
      if (donorIndex >= 0) pages[i].push(pages[donorIndex].pop());
    }
    return pages;
  }

  function buildImagePath(imageDir, index) {
    if (!imageDir) return '';
    return `./assets/stories/classics/${imageDir}/p${String(index + 1).padStart(3, '0')}.png`;
  }

  function buildCoverPath(imageDir) {
    if (!imageDir) return '';
    return `./assets/stories/classics/${imageDir}/cover.png`;
  }

  function buildPagesFromStory(story, paragraphs, options = {}) {
    const sourceId = story?.sourceId || story?.id || story?.savedId || options.sourceId || '';
    const imageDir = options.imageDir || story?.imageDir || getImageDirBySeedId(sourceId);
    const packId = options.packId || story?.packId || story?.storyPackId || getPackIdBySeedId(sourceId) || toSafeId(story?.title || sourceId);
    const pageTexts = splitTextsToElevenPages(paragraphs || story?.paragraphs || story?.texts || []);
    return pageTexts.map((texts, index) => ({
      image: buildImagePath(imageDir, index),
      texts,
      voice: `stories.${packId}.p${String(index + 1).padStart(3, '0')}`,
      imagePrompt: story?.imagePrompts?.[index] || ''
    }));
  }

  function makePackFromStory(story, options = {}) {
    const sourceId = story?.sourceId || story?.id || story?.savedId || options.sourceId || '';
    const packId = options.packId || story?.packId || story?.storyPackId || `generated_${Date.now()}`;
    const imageDir = options.imageDir || story?.imageDir || `generated/${packId}`;
    const pages = buildPagesFromStory(story, story?.paragraphs || [], { packId, imageDir, sourceId });
    return {
      id: packId,
      seedId: sourceId,
      title: story?.title || '시현이 동화',
      theme: story?.theme || '창작동화',
      voiceTone: story?.voiceTone || 'gentle',
      desc: story?.summary || story?.desc || '',
      readingMinutes: story?.readingMinutes || Math.max(3, Math.ceil((story?.paragraphs || []).join('').length / 550)),
      imageDir,
      imageReady: false,
      coverImage: options.coverImage || story?.coverImage || '',
      expectedPageCount: EXPECTED_PAGE_COUNT,
      pages
    };
  }

  function packToJsSource(pack) {
    const safePack = Object.assign({}, pack, { expectedPageCount: EXPECTED_PAGE_COUNT });
    const id = toSafeId(safePack.id);
    return `window.CUSTOM_STORY_PACKS = window.CUSTOM_STORY_PACKS || {};\n\nwindow.CUSTOM_STORY_PACKS.${id} = ${JSON.stringify(safePack, null, 2)};\n`;
  }

  function downloadPackFile(pack) {
    if (!pack) return false;
    const source = packToJsSource(pack);
    const fileName = `${toSafeId(pack.id)}.js`;
    const blob = new Blob([source], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }

  function prepareStoryLibrary() {
    if (!Array.isArray(window.STORY_LIBRARY)) return;
    window.STORY_LIBRARY.forEach((story) => {
      const sourceId = story.sourceId || story.id || story.savedId || '';
      const pack = getPackByStory(story);
      const imageDir = story.imageDir || getImageDirBySeedId(sourceId);
      story.storyPackMode = 'eleven_page_illustrated';
      story.expectedPageCount = EXPECTED_PAGE_COUNT;
      story.storyPackId = story.storyPackId || (pack?.id || getPackIdBySeedId(sourceId));
      if (imageDir) story.imageDir = imageDir;
      if (pack) {
        story.hasFullContent = true;
        story.imageReady = Boolean(pack.imageReady);
        story.coverImage = pack.coverImage || buildCoverPath(pack.imageDir || imageDir);
      } else if (imageDir) {
        story.coverImage = story.coverImage || buildCoverPath(imageDir);
      }
    });
  }

  window.STORYBOOK_EXPECTED_PAGE_COUNT = EXPECTED_PAGE_COUNT;
  window.STORYBOOK_PACK_ID_BY_SEED_ID = Object.assign({}, PACK_ID_BY_SEED_ID);
  window.STORYBOOK_IMAGE_DIR_BY_SEED_ID = Object.assign({}, IMAGE_DIR_BY_SEED_ID);
  window.GENERATED_STORY_PACKS = window.GENERATED_STORY_PACKS || {};
  window.CUSTOM_STORY_PACKS = window.CUSTOM_STORY_PACKS || {};
  window.StoryPackRegistry = {
    EXPECTED_PAGE_COUNT,
    getAllPacks,
    getPackIdBySeedId,
    getImageDirBySeedId,
    getPackById,
    getPackByStory,
    splitTextsToElevenPages,
    buildPagesFromStory,
    makePackFromStory,
    packToJsSource,
    downloadPackFile,
    prepareStoryLibrary
  };
})();
