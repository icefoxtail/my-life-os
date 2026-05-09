const CACHE_NAME = 'sihyeon-play-os-v1.0.21';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',

  './js/voice-engine.js',
  './js/ttokttoki-engine.js',
  './js/zones/voice-zone.js',

  './js/data/story-pack-registry.js',

  './js/story-data.js',
  './js/story-world.js',

  './js/games/vehicle-memory.js',
  './js/games/number-count.js',
  './js/games/letter-play.js',
  './js/games/color-balloon.js',
  './js/games/car-garage.js',

  './assets/games/cards/vehicle-memory.png',
  './assets/games/cards/color-balloon.png',
  './assets/games/cards/number-count.png',
  './assets/games/cards/number-blocks.png',
  './assets/games/cards/letter-play.png',
  './assets/games/cards/car-garage.png',
  './assets/games/cards/parking-lot.png',
  './assets/games/cards/construction-site.png',

  './assets/stories/storybook_main_cover.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, copy).catch(() => {});
        });
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
