const CACHE_NAME = 'sihyeon-play-os-v1.0.4-story-pack-modular';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './js/story-data.js',
  './js/data/story-pack-registry.js',
  './js/data/classics/classic_three_little_pigs.js',
  './js/data/classics/classic_ugly_duckling.js',
  './js/data/classics/classic_snow_white.js',
  './js/data/classics/classic_jack_and_the_beanstalk.js',
  './js/story-world.js',
  './assets/stories/storybook_main_cover.png',
  './js/story-world.js',
  './js/story-data.js',
  './js/data/classics/classic_three_little_pigs.js',
  './js/data/classics/classic_ugly_duckling.js',
  './js/data/classics/classic_snow_white.js',
  './js/data/classics/classic_jack_and_the_beanstalk.js',
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
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
