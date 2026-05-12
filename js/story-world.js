(function () {
  'use strict';

  const STYLE_ID = 'story-youtube-only-style';
  const THEATER_ID = 'classicVideoTheater';
  const ORDER_STORAGE_KEY = 'SIHYEON_STORY_VIDEO_ORDER_V1';
  const LAST_PLAY_STORAGE_KEY = 'SIHYEON_STORY_LAST_VIDEO_BY_ITEM_V1';

  let currentStoryFilter = window.currentStoryFilter || '전체';
  window.currentStoryFilter = currentStoryFilter;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function readJsonStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJsonStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  }

  function getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function hashString(value) {
    let hash = 2166136261;
    const text = String(value || '');
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seededRandomFactory(seedText) {
    let seed = hashString(seedText) || 1;
    return function seededRandom() {
      seed += 0x6D2B79F5;
      let value = seed;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleWithSeed(list, seedText) {
    const result = list.slice();
    const random = seededRandomFactory(seedText);
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function getClassicVideoLibrary() {
    return Array.isArray(window.CLASSIC_VIDEO_LIBRARY) ? window.CLASSIC_VIDEO_LIBRARY : [];
  }

  function getFolkVideoLibrary() {
    return Array.isArray(window.FOLK_VIDEO_LIBRARY) ? window.FOLK_VIDEO_LIBRARY : [];
  }

  function normalizeCoverPath(value) {
    const src = String(value || '').trim();
    if (!src) return '';
    return src;
  }

  function getCoverBaseDir(item, id, groupName) {
    const haystack = [id, item?.title, item?.theme, item?.group, groupName, ...(Array.isArray(item?.tags) ? item.tags : [])].join(' ').toLowerCase();
    if (/folk|전래|옛이야기/.test(haystack)) return './assets/stories/folk_covers/';
    if (/classic|명작|세계명작/.test(haystack)) return './assets/stories/classic_covers/';
    return '';
  }

  function resolveFallbackCoverSlug(item, id, groupName) {
    const haystack = [id, item?.title, item?.desc, item?.theme, item?.group, groupName, ...(Array.isArray(item?.tags) ? item.tags : [])].join(' ').toLowerCase();

    if (/전래|folk|옛이야기/.test(haystack)) {
      if (/도깨비|dokkaebi|magic/.test(haystack)) return 'folk_dokkaebi_magic';
      if (/호랑이|까치|tiger|magpie/.test(haystack)) return 'folk_tiger_magpie';
      if (/잠자리|달|밤|bedtime|moon/.test(haystack)) return 'folk_bedtime_moon';
      if (/모험|긴|long|adventure/.test(haystack)) return 'folk_longplay_adventure';
      if (/12|인기|popular/.test(haystack)) return 'folk_popular_collection';
      if (/모아|모음|collection|main/.test(haystack)) return 'folk_collection_main';
    }

    return String(id || '').trim();
  }

  function buildFallbackCoverPath(item, id, groupName) {
    const baseDir = getCoverBaseDir(item, id, groupName);
    const slug = resolveFallbackCoverSlug(item, id, groupName);
    return baseDir && slug ? `${baseDir}${slug}.png` : '';
  }

  function buildCoverFallbackCandidates(src, item, id, groupName) {
    const candidates = [];
    const add = value => {
      const clean = String(value || '').trim();
      if (clean && !candidates.includes(clean)) candidates.push(clean);
    };

    add(src);

    const baseDir = getCoverBaseDir(item, id, groupName);
    const fallbackSlug = resolveFallbackCoverSlug(item, id, groupName);
    [fallbackSlug, id].filter(Boolean).forEach(slug => {
      if (baseDir) {
        add(`${baseDir}${slug}.png`);
        add(`${baseDir}${slug}.webp`);
        add(`${baseDir}${slug}.jpg`);
        add(`${baseDir}${slug}.jpeg`);
      }
    });

    const current = String(src || '').trim();
    const extMatch = current.match(/^(.*)\.(png|webp|jpg|jpeg)$/i);
    if (extMatch) {
      const stem = extMatch[1];
      add(`${stem}.png`);
      add(`${stem}.webp`);
      add(`${stem}.jpg`);
      add(`${stem}.jpeg`);
    }

    return candidates;
  }

  function encodeCoverFallbacks(values) {
    return escapeAttr(JSON.stringify(values));
  }

  function handleStoryCoverError(img) {
    if (!img) return;
    let candidates = [];
    try {
      candidates = JSON.parse(img.dataset.coverFallbacks || '[]');
    } catch (error) {
      candidates = [];
    }

    const current = img.getAttribute('src') || '';
    const next = candidates.find(src => src && src !== current && !img.dataset[`tried_${hashString(src)}`]);
    if (next) {
      img.dataset[`tried_${hashString(next)}`] = '1';
      img.src = next;
      return;
    }

    img.onerror = null;
    img.style.display = 'none';
    if (img.nextElementSibling) img.nextElementSibling.style.display = 'grid';
  }

  function resolveVideoCoverImage(item, id, groupName) {
    const candidates = [
      item?.coverImage,
      item?.coverSrc,
      item?.cover,
      item?.thumbnail,
      item?.thumbnailUrl,
      item?.thumb,
      item?.poster,
      item?.image,
      item?.imageSrc,
      item?.img,
      item?.src
    ].map(normalizeCoverPath).filter(Boolean);

    return candidates[0] || buildFallbackCoverPath(item, id, groupName);
  }

  function normalizeVideoItem(item, groupName) {
    if (!item) return null;
    const id = String(item.id || item.key || item.slug || item.videoId || item.youtubeId || item.title || '').trim();
    if (!id) return null;
    return {
      ...item,
      id,
      group: item.group || groupName || item.theme || '',
      title: item.title || '시현이 만화',
      desc: item.desc || item.summary || '',
      theme: item.theme || groupName || '',
      coverImage: resolveVideoCoverImage(item, id, groupName)
    };
  }

  function getAllVideoItems() {
    const classic = getClassicVideoLibrary().map(item => normalizeVideoItem(item, '명작'));
    const folk = getFolkVideoLibrary().map(item => normalizeVideoItem(item, '전래'));
    const custom = Array.isArray(window.STORY_VIDEO_LIBRARY)
      ? window.STORY_VIDEO_LIBRARY.map(item => normalizeVideoItem(item, item.group || item.theme || '추천'))
      : [];

    const seen = new Set();
    return classic.concat(folk, custom)
      .filter(Boolean)
      .filter(item => {
        const key = item.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return collectVideoIds(item).length > 0;
      });
  }

  function collectVideoIds(item) {
    if (!item) return [];
    const raw = [];

    if (item.videoId) raw.push(item.videoId);
    if (item.youtubeId) raw.push(item.youtubeId);

    ['videoIds', 'youtubeIds', 'randomVideoIds'].forEach(key => {
      if (Array.isArray(item[key])) raw.push(...item[key]);
    });

    ['videos', 'youtubeVideos', 'playlist'].forEach(key => {
      if (Array.isArray(item[key])) {
        item[key].forEach(video => {
          if (typeof video === 'string') raw.push(video);
          else if (video?.videoId) raw.push(video.videoId);
          else if (video?.youtubeId) raw.push(video.youtubeId);
          else if (video?.id) raw.push(video.id);
        });
      }
    });

    const seen = new Set();
    return raw
      .map(value => String(value || '').trim())
      .filter(Boolean)
      .filter(value => {
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
  }

  function getVideoItemById(id) {
    const targetId = String(id || '').trim();
    if (!targetId) return null;
    const direct = window.getClassicVideoById?.(targetId) || window.getFolkVideoById?.(targetId);
    if (direct) return normalizeVideoItem(direct, direct.group || direct.theme || '');
    return getAllVideoItems().find(item => item.id === targetId) || null;
  }

  function getStorySearchQuery() {
    return String(document.getElementById('storySearchInput')?.value || '').trim().toLowerCase();
  }

  function getFilterButtons() {
    return [
      { key: '전체', label: '전체' },
      { key: '명작', label: '명작' },
      { key: '전래', label: '전래' },
      { key: '자동차', label: '자동차' },
      { key: '공룡', label: '공룡' },
      { key: '잠자리', label: '잠자리' }
    ];
  }

  function itemMatchesFilter(item, filter) {
    const value = String(filter || '전체');
    if (value === '전체') return true;
    const haystack = [
      item.title,
      item.desc,
      item.theme,
      item.group,
      ...(Array.isArray(item.tags) ? item.tags : [])
    ].join(' ');
    if (value === '명작') return /명작|classic|세계명작|만화/.test(haystack);
    if (value === '전래') return /전래|옛이야기|folk/.test(haystack);
    return haystack.includes(value);
  }

  function filterVideoItems(list) {
    const query = getStorySearchQuery();
    return list.filter(item => {
      if (!itemMatchesFilter(item, currentStoryFilter)) return false;
      if (!query) return true;
      const haystack = [
        item.title,
        item.desc,
        item.theme,
        item.group,
        ...(Array.isArray(item.tags) ? item.tags : [])
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  function getOrderedVideoItems(items) {
    const today = getTodayKey();
    const stored = readJsonStorage(ORDER_STORAGE_KEY, null);
    const currentIds = items.map(item => item.id).sort().join('|');

    if (stored?.date === today && stored?.sourceKey === currentIds && Array.isArray(stored.order)) {
      const byId = new Map(items.map(item => [item.id, item]));
      const ordered = stored.order.map(id => byId.get(id)).filter(Boolean);
      const missing = items.filter(item => !stored.order.includes(item.id));
      return ordered.concat(missing);
    }

    const shuffled = shuffleWithSeed(items, `story-video:${today}:${currentIds}`);
    writeJsonStorage(ORDER_STORAGE_KEY, {
      date: today,
      sourceKey: currentIds,
      order: shuffled.map(item => item.id)
    });
    return shuffled;
  }

  function reshuffleStoryVideos() {
    try {
      localStorage.removeItem(ORDER_STORAGE_KEY);
    } catch (error) {}
    renderStoryWorld();
  }

  function getRandomVideoId(item) {
    const candidates = collectVideoIds(item);
    if (!candidates.length) return '';
    if (candidates.length === 1) return candidates[0];

    const lastMap = readJsonStorage(LAST_PLAY_STORAGE_KEY, {});
    const last = lastMap[item.id];
    const pool = candidates.filter(id => id !== last);
    const source = pool.length ? pool : candidates;
    const index = Math.floor(Math.random() * source.length);
    const picked = source[index];

    lastMap[item.id] = picked;
    writeJsonStorage(LAST_PLAY_STORAGE_KEY, lastMap);
    return picked;
  }

  function buildYoutubeEmbedUrl(videoId) {
    const id = encodeURIComponent(String(videoId || '').trim());
    return `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;
  }

  function injectStoryVideoStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .story-ui-hidden{display:none!important;}
      .story-youtube-shell{grid-column:1/-1;display:grid;gap:12px;align-content:start;width:100%;}
      .story-youtube-top{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.2);}
      .story-youtube-title{font-size:clamp(24px,6vw,38px);font-weight:900;line-height:1.05;}
      .story-youtube-sub{margin-top:4px;font-size:clamp(12px,3.1vw,16px);font-weight:800;color:rgba(255,255,255,.9);}
      .story-youtube-random{flex:0 0 auto;min-height:42px;padding:0 14px;border:0;border-radius:999px;background:rgba(255,255,255,.94);color:#4C1D95;font-size:15px;font-weight:900;box-shadow:0 4px 0 rgba(0,0,0,.16);cursor:pointer;}
      .story-youtube-filters{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 6px;scrollbar-width:none;}
      .story-youtube-filters::-webkit-scrollbar{display:none;}
      .story-youtube-filter{flex:0 0 auto;min-height:38px;padding:0 14px;border:3px solid rgba(255,255,255,.72);border-radius:999px;background:rgba(255,255,255,.24);color:#fff;font-size:15px;font-weight:900;text-shadow:0 2px 0 rgba(0,0,0,.18);box-shadow:0 3px 0 rgba(0,0,0,.12);cursor:pointer;}
      .story-youtube-filter.active{background:#FFD93D;color:#3B0764;text-shadow:none;border-color:#fff;}
      .story-youtube-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;align-items:stretch;}
      .story-youtube-card{min-width:0;border:3px solid rgba(255,255,255,.88);border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(255,247,216,.96));box-shadow:0 7px 0 rgba(58,16,99,.22),0 12px 24px rgba(0,0,0,.16);overflow:hidden;text-align:left;cursor:pointer;display:flex;flex-direction:column;transition:transform .12s,box-shadow .12s;}
      .story-youtube-card:active{transform:translateY(5px);box-shadow:0 3px 0 rgba(58,16,99,.2),0 8px 16px rgba(0,0,0,.14);}
      .story-youtube-cover{position:relative;display:grid;place-items:center;width:100%;aspect-ratio:16/10;background:radial-gradient(circle at 25% 15%,#FFF7AD 0,#FFD36A 30%,#A855F7 72%,#3B0764 100%);overflow:hidden;}
      .story-youtube-cover img{width:100%;height:100%;object-fit:cover;display:block;}
      .story-youtube-fallback{position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-size:clamp(30px,9vw,58px);text-shadow:0 4px 0 rgba(0,0,0,.24);background:radial-gradient(circle at 30% 20%,#FFE9A8 0,#B565F2 54%,#2D0060 100%);}
      .story-youtube-card-title{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;padding:7px 7px 2px;color:#3B0764;font-size:clamp(13px,3.35vw,18px);font-weight:900;line-height:1.12;min-height:38px;}
      .story-youtube-play{align-self:flex-start;margin:auto 7px 8px;padding:5px 8px;border-radius:999px;background:#FFD93D;color:#3B0764;font-size:clamp(11px,3vw,14px);font-weight:900;box-shadow:0 3px 0 #E6A700;white-space:nowrap;}
      .story-youtube-empty{grid-column:1/-1;min-height:160px;display:grid;place-items:center;text-align:center;border:3px dashed rgba(255,255,255,.65);border-radius:22px;color:#fff;font-size:18px;font-weight:900;text-shadow:0 2px 0 rgba(0,0,0,.18);background:rgba(255,255,255,.12);}
      .classic-video-theater{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:max(10px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));background:rgba(0,0,0,.86);backdrop-filter:blur(8px);overflow:auto;}
      .classic-video-panel{width:min(96vw,1100px);max-height:100%;display:flex;flex-direction:column;gap:10px;border:4px solid rgba(255,255,255,.84);border-radius:22px;background:linear-gradient(180deg,#3B0764 0%,#160026 100%);box-shadow:0 20px 60px rgba(0,0,0,.42);padding:10px;margin:auto 0;}
      .classic-video-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:46px;}
      .classic-video-title{padding:0;color:#fff;font-size:clamp(18px,4.4vw,26px);font-weight:900;line-height:1.15;text-shadow:0 2px 0 rgba(0,0,0,.24);}
      .classic-video-close{position:relative;z-index:2;flex:0 0 auto;min-width:74px;min-height:42px;border:0;border-radius:999px;background:#fff;color:#3B0764;font-size:17px;font-weight:900;box-shadow:0 4px 0 rgba(0,0,0,.18);cursor:pointer;}
      .classic-video-hint{color:rgba(255,255,255,.88);font-size:clamp(13px,3.4vw,16px);font-weight:800;text-align:center;text-shadow:0 1px 0 rgba(0,0,0,.25);}
      .classic-video-frame-wrap{position:relative;align-self:center;width:min(96vw,1100px,calc(78dvh * 16 / 9));max-width:100%;aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#000;max-height:78dvh;}
      .classic-video-frame-wrap iframe{position:absolute;inset:0;width:100%;height:100%;border:0;}
      @media (min-width:760px){.story-youtube-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;}.story-youtube-card-title{font-size:17px;min-height:46px;padding:9px 10px 3px;}.story-youtube-play{margin:6px 10px 10px;font-size:14px;padding:6px 10px;}.story-youtube-card{border-radius:20px;}}
      @media (min-width:1180px){.story-youtube-grid{grid-template-columns:repeat(5,minmax(0,1fr));}}
      @media (max-width:360px){.story-youtube-grid{gap:6px;}.story-youtube-card{border-width:2px;border-radius:15px;}.story-youtube-card-title{font-size:12px;min-height:34px;padding:6px 6px 2px;}.story-youtube-play{font-size:10px;margin:4px 6px 7px;padding:4px 7px;}}
      @media (orientation:portrait){.classic-video-theater{align-items:flex-start;}.classic-video-panel{margin:0;width:min(96vw,1100px);}.classic-video-frame-wrap{max-height:78dvh;}}
      @media (orientation:landscape){.classic-video-theater{align-items:center;}.classic-video-panel{width:min(96vw,1200px);}.classic-video-frame-wrap{width:min(96vw,1200px,calc(86dvh * 16 / 9));max-height:86dvh;}}
    `;
    document.head.appendChild(style);
  }

  function lockClassicVideoLandscape() {
    const orientation = window.screen?.orientation;
    if (!orientation || typeof orientation.lock !== 'function') return;
    try {
      const result = orientation.lock('landscape');
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch (error) {}
  }

  function unlockClassicVideoOrientation() {
    const orientation = window.screen?.orientation;
    if (!orientation || typeof orientation.unlock !== 'function') return;
    try { orientation.unlock(); } catch (error) {}
  }

  function openClassicVideoTheater(itemId) {
    const item = getVideoItemById(itemId);
    if (!item) return;
    const videoId = getRandomVideoId(item);
    if (!videoId) return;

    closeClassicVideoTheater();
    lockClassicVideoLandscape();

    const modal = document.createElement('div');
    modal.id = THEATER_ID;
    modal.className = 'classic-video-theater';
    modal.innerHTML = `
      <div class="classic-video-panel" role="dialog" aria-modal="true" aria-label="${escapeAttr(item.title)}">
        <div class="classic-video-panel-head">
          <div class="classic-video-title">${escapeHtml(item.title)}</div>
          <button class="classic-video-close" type="button" onclick="closeClassicVideoTheater()">닫기</button>
        </div>
        <div class="classic-video-frame-wrap">
          <iframe src="${buildYoutubeEmbedUrl(videoId)}" title="${escapeAttr(item.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen playsinline></iframe>
        </div>
        <div class="classic-video-hint">같은 카드를 다시 누르면 다른 영상이 랜덤으로 나와요.</div>
      </div>
    `;

    modal.addEventListener('click', event => {
      if (event.target === modal) closeClassicVideoTheater();
    });
    document.body.appendChild(modal);
  }

  function closeClassicVideoTheater() {
    const modal = document.getElementById(THEATER_ID);
    unlockClassicVideoOrientation();
    if (!modal) return;
    modal.querySelectorAll('iframe').forEach(frame => { frame.src = ''; });
    modal.remove();
  }

  function renderFilterBar() {
    return `
      <div class="story-youtube-filters" role="tablist" aria-label="동화 영상 필터">
        ${getFilterButtons().map(item => `
          <button class="story-youtube-filter ${item.key === currentStoryFilter ? 'active' : ''}" type="button" onclick="setStoryFilter('${escapeAttr(item.key)}')">
            ${escapeHtml(item.label)}
          </button>
        `).join('')}
      </div>
    `;
  }

  function renderVideoCard(item, index) {
    const cover = item.coverImage || '';
    const fallbackIcon = String(item.group || item.theme || '').includes('전래') ? '🐯' : '🏰';
    const loadingMode = index < 9 ? 'eager' : 'lazy';
    const videoCount = collectVideoIds(item).length;
    const coverFallbacks = buildCoverFallbackCandidates(cover, item, item.id, item.group || item.theme || '');
    const firstCover = coverFallbacks[0] || '';

    return `
      <button class="story-youtube-card" type="button" onclick="openClassicVideoTheater('${escapeAttr(item.id)}')" aria-label="${escapeAttr(item.title)} 보기">
        <span class="story-youtube-cover">
          ${firstCover ? `<img src="${escapeAttr(firstCover)}" data-cover-fallbacks='${encodeCoverFallbacks(coverFallbacks)}' alt="${escapeAttr(item.title)}" loading="${loadingMode}" decoding="async" onerror="handleStoryCoverError(this)">` : ''}
          <span class="story-youtube-fallback" ${firstCover ? 'style="display:none;"' : ''}>${fallbackIcon}</span>
        </span>
        <span class="story-youtube-card-title">${escapeHtml(item.title)}</span>
        <span class="story-youtube-play">▶ 랜덤 보기${videoCount > 1 ? ` ${videoCount}` : ''}</span>
      </button>
    `;
  }

  function renderStoryWorld() {
    injectStoryVideoStyles();

    const grid = document.getElementById('storyLibraryGrid');
    if (!grid) return;

    const reader = document.getElementById('storyReaderView');
    if (reader) reader.style.display = 'none';
    grid.style.display = 'grid';
    grid.className = 'story-card-grid storybook-featured-grid story-youtube-only-grid';
    grid.style.minHeight = 'auto';
    grid.style.alignContent = 'start';
    grid.style.paddingTop = '0px';
    grid.style.paddingBottom = 'max(18px, env(safe-area-inset-bottom))';

    document.querySelector('.story-search-row')?.classList.remove('story-ui-hidden');
    document.querySelector('.story-filter-row')?.classList.add('story-ui-hidden');

    const loadMore = document.getElementById('storyLoadMoreBtn');
    if (loadMore) loadMore.style.display = 'none';

    const videos = getOrderedVideoItems(filterVideoItems(getAllVideoItems()));
    const cards = videos.length
      ? videos.map(renderVideoCard).join('')
      : `<div class="story-youtube-empty">볼 수 있는 유튜브 동화가 아직 없어요.</div>`;

    grid.innerHTML = `
      <section class="story-youtube-shell" aria-label="시현이 만화극장">
        <div class="story-youtube-top">
          <div>
            <div class="story-youtube-title">🎬 시현이 만화극장</div>
            <div class="story-youtube-sub">카드 순서는 매일 바뀌고, 영상은 후보 중 랜덤으로 재생돼요.</div>
          </div>
          <button class="story-youtube-random" type="button" onclick="reshuffleStoryVideos()">🔀 섞기</button>
        </div>
        ${renderFilterBar()}
        <div class="story-youtube-grid">
          ${cards}
        </div>
      </section>
    `;
  }

  function setStoryFilter(filter) {
    currentStoryFilter = filter || '전체';
    window.currentStoryFilter = currentStoryFilter;
    renderStoryWorld();
  }

  function renderClassicVideoSection() {
    const videos = getOrderedVideoItems(filterVideoItems(getClassicVideoLibrary().map(item => normalizeVideoItem(item, '명작')).filter(Boolean)));
    if (!videos.length) return '';
    return `<div class="story-youtube-grid">${videos.map(renderVideoCard).join('')}</div>`;
  }

  function renderFolkVideoSection() {
    const videos = getOrderedVideoItems(filterVideoItems(getFolkVideoLibrary().map(item => normalizeVideoItem(item, '전래')).filter(Boolean)));
    if (!videos.length) return '';
    return `<div class="story-youtube-grid">${videos.map(renderVideoCard).join('')}</div>`;
  }

  function bootStoryWorldIfMounted() {
    renderStoryWorld();
  }

  function openStorybookIntro() { renderStoryWorld(); }
  function openStorybookShelf() { renderStoryWorld(); }
  function openStorySeedShelf() { renderStoryWorld(); }
  function openSavedStoryShelf() { renderStoryWorld(); }
  function closeStoryReader() { renderStoryWorld(); }
  function readStoryById(storyId) { openClassicVideoTheater(storyId); }
  function readStory(index) {
    const videos = getOrderedVideoItems(filterVideoItems(getAllVideoItems()));
    const item = videos[Number(index) || 0];
    if (item) openClassicVideoTheater(item.id);
  }

  function noop() {}

  window.setStoryFilter = setStoryFilter;
  window.openStorybookIntro = openStorybookIntro;
  window.openStorybookShelf = openStorybookShelf;
  window.nextClassicStoryPage = noop;
  window.prevClassicStoryPage = noop;
  window.openStorySeedShelf = openStorySeedShelf;
  window.openSavedStoryShelf = openSavedStoryShelf;
  window.generateStoryByTheme = noop;
  window.readStoryById = readStoryById;
  window.getClassicVideoLibrary = getClassicVideoLibrary;
  window.getFolkVideoLibrary = getFolkVideoLibrary;
  window.getVideoItemById = getVideoItemById;
  window.renderClassicVideoSection = renderClassicVideoSection;
  window.renderFolkVideoSection = renderFolkVideoSection;
  window.openClassicVideoTheater = openClassicVideoTheater;
  window.closeClassicVideoTheater = closeClassicVideoTheater;
  window.buildYoutubeEmbedUrl = buildYoutubeEmbedUrl;
  window.reshuffleStoryVideos = reshuffleStoryVideos;
  window.handleStoryCoverError = handleStoryCoverError;
  window.generateStoryFromSeed = noop;
  window.saveCurrentStory = noop;
  window.exportCurrentStoryPack = noop;
  window.deleteSavedStory = noop;
  window.closeStoryReader = closeStoryReader;
  window.speakBookText = noop;
  window.pauseStoryReading = noop;
  window.resumeStoryReading = noop;
  window.nextStoryParagraph = noop;
  window.stopStoryReading = noop;
  window.restartStoryReading = noop;
  window.readStory = readStory;
  window.generateGeminiStory = noop;
  window.renderStoryWorld = renderStoryWorld;
  window.bootStoryWorldIfMounted = bootStoryWorldIfMounted;
  window.validateGeneratedStory = function validateGeneratedStory() { return false; };
  window.buildExpandStoryPrompt = function buildExpandStoryPrompt() { return ''; };

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeClassicVideoTheater();
  });
})();
