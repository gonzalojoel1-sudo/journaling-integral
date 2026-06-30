const CACHE_NAME = 'journaling-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalar Service Worker y cachear elementos estáticos principales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activar Service Worker y limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar peticiones para servir activos desde caché cuando sea posible
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NO cachear peticiones POST (Guardados del diario), llamadas API o archivos de Drizzle Studio
  if (event.request.method !== 'GET' || url.pathname.includes('/api') || url.hostname.includes('drizzle')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Guardar en caché solo peticiones estáticas exitosas
        if (response.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    }).catch(() => {
      // Retorno preventivo si el dispositivo está offline
      return caches.match('/');
    })
  );
});