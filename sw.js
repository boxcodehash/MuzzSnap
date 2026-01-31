const CACHE_NAME = 'muzz-v3';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        'index.html',
        'login.html',
        'chat.html',
        'swap.html',
        'manifest.json'
      ]).catch(err => console.log("Error caching:", err));
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
