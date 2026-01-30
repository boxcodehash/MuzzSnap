const CACHE_NAME = 'muzzsnap-v1';
const ASSETS = [
  'login.html',
  // Agrega aquí 'chat.html' y tus CSS/JS locales si los tienes
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
