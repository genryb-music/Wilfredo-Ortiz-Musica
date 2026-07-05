// Service worker básico — permite que la app se instale y funcione
// sin conexión para las partes ya visitadas (no descarga música offline).
const CACHE_NAME = 'wilfredo-ortiz-musica-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Estrategia: red primero, si falla usa caché (para que precios/álbumes siempre estén al día)
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
