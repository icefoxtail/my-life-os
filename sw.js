const CACHE_NAME = 'sihyeon-play-os-v1.0.25';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',

  './js/voice-engine.js',
  './js/ttokttoki-engine.js',
  './js/zones/voice-zone.js',
  './js/zones/karaoke-zone.js',

  './js/data/story-pack-registry.js',

  './js/story-data.js',
  './js/story-world.js',

  './js/games/vehicle-memory.js',
  './js/games/number-count.js',
  './js/games/letter-play.js',
  './js/games/color-balloon.js',
  './js/games/car-garage.js',

  './assets/games/cards/vehicle-memory.webp',
  './assets/games/cards/color-balloon.webp',
  './assets/games/cards/number-count.webp',
  './assets/games/cards/number-blocks.webp',
  './assets/games/cards/letter-play.webp',
  './assets/games/cards/car-garage.webp',
  './assets/games/cards/parking-lot.webp',
  './assets/games/cards/construction-site.webp',
  './assets/games/cards/karaoke-zone.webp',

  './assets/karaoke/three_bears.wav',
  './assets/karaoke/twinkle.wav',
  './assets/karaoke/butterfly.wav',
  './assets/karaoke/rabbit.wav',
  './assets/karaoke/birthday.wav',
  './assets/karaoke/airplane.wav',
  './assets/karaoke/school_bell.wav',
  './assets/karaoke/choo_choo_sihyeon.wav',
  './assets/karaoke/shark_family_adventure_v2.wav',
  './assets/karaoke/penguin_friend_parade.wav',
  './assets/karaoke/dino_rescue_go.wav',
  './assets/karaoke/little_bus_drive_v2.wav',
  './assets/karaoke/shark_family_adventure_chant.wav',
  './assets/karaoke/penguin_friend_march.wav',
  './assets/karaoke/dino_rescue_action.wav',
  './assets/karaoke/little_bus_drive_chant.wav',

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
