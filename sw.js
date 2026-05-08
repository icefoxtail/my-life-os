const CACHE_NAME = 'sihyeon-play-os-v1.0.2';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',

  './assets/world/park_main.png',
  './assets/world/game_land_map.png',
  './assets/world/number_land_map.png',
  './assets/world/letter_land_map.png',
  './assets/world/car_land_map.png',
  './assets/world/story_land_map.png',
  './assets/world/voice_land_map.png',

  './assets/characters/characters_manifest.json',
  './assets/characters/sihyeon.png',
  './assets/characters/dad.png',
  './assets/characters/mom.png',
  './assets/characters/sicheoni.png',
  './assets/characters/rona.png',
  './assets/characters/reumi.png',
  './assets/characters/nuni.png',

  './assets/vehicles/vehicles_manifest.json',
  './assets/vehicles/transport/train.png',

  './assets/voice/voice_manifest.json',

  './js/voice-engine.js',
  './js/ttokttoki-engine.js',
  './js/story-data.js',
  './js/story-world.js',
  './js/games/vehicle-memory.js',
  './js/games/number-count.js',
  './js/games/letter-play.js',
  './js/games/color-balloon.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const results = await Promise.allSettled(PRECACHE_ASSETS.map((url) => cache.add(url)));
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn('[SW] precache failed:', PRECACHE_ASSETS[index], result.reason);
        }
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(request));
    return;
  }

  const isStaticAsset =
    request.destination === 'image' ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'audio' ||
    /\.(png|jpg|jpeg|webp|gif|svg|js|css|json|mp3|webm|ogg)$/i.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return cached || Response.error();
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return Response.error();
  }
}
