const CACHE_NAME = 'sihyeon-play-os-v1.0.28';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',

  './js/voice-engine.js',
  './js/zones/voice-zone.js',
  './js/zones/karaoke-zone.js',
  './js/zones/boardland-zone.js',

  './js/data/classic-video-registry.js',
  './js/story-world.js',

  './js/games/vehicle-memory.js',
  './js/games/number-count.js',
  './js/games/number-basket.js',
  './js/games/number-vehicles.js',
  './js/games/number-blocks.js',
  './js/games/letter-play.js',
  './js/games/color-balloon.js',
  './js/games/car-garage.js',
  './js/games/coding-car.js',
  './js/games/parking-lot.js',
  './js/games/construction-site.js',
  './js/games/life-sequence.js',
  './js/games/art-zone.js',
  './js/games/abc-phonics.js',
  './js/games/cat-care.js',
  './js/games/robotCoding.js',
  './js/games/megaDispatch.js',

  './assets/games/cards/vehicle-memory.webp',
  './assets/games/cards/color-balloon.webp',
  './assets/games/cards/life-sequence.webp',
  './assets/games/cards/art-zone.webp',
  './assets/games/cards/cat-care.webp',
  './assets/games/cards/boardland-zone.png',
  './assets/games/cards/robotCoding.png',
  './assets/games/cards/number-count.webp',
  './assets/games/cards/number-basket.webp',
  './assets/games/cards/number-vehicles.png',
  './assets/games/cards/number-blocks.webp',
  './assets/games/cards/letter-play.webp',
  './assets/games/cards/abc-phonics.webp',
  './assets/games/cards/car-garage.webp',
  './assets/games/cards/coding-car.png',
  './assets/games/cards/parking-lot.webp',
  './assets/games/cards/construction-site.webp',
  './assets/games/cards/megadispatch.png',
  './assets/games/cards/karaoke-zone.png',

  './assets/games/codingCar/garage.png',
  './assets/games/codingCar/arrow-up.webp',
  './assets/games/codingCar/arrow-down.webp',
  './assets/games/codingCar/arrow-left.webp',
  './assets/games/codingCar/arrow-right.webp',

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

  './assets/stories/folk_covers/folk_bedtime_moon.webp',
  './assets/stories/folk_covers/folk_collection_main.webp',
  './assets/stories/folk_covers/folk_dokkaebi_magic.webp',
  './assets/stories/folk_covers/folk_longplay_adventure.webp',
  './assets/stories/folk_covers/folk_popular_collection.webp',
  './assets/stories/folk_covers/folk_tiger_magpie.webp',

  './assets/stories/classic_covers/classic_three_little_pigs.webp',
  './assets/stories/classic_covers/classic_ugly_duckling.webp',
  './assets/stories/classic_covers/classic_snow_white.webp',
  './assets/stories/classic_covers/classic_jack_and_the_beanstalk.webp'
];

function safeCacheAssets(cache, assets) {
  return Promise.allSettled(
    assets.map((asset) => fetch(asset, { cache: 'reload' })
      .then((response) => {
        if (!response || !response.ok) return null;
        return cache.put(asset, response);
      })
      .catch(() => null))
  );
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => safeCacheAssets(cache, ASSETS))
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
