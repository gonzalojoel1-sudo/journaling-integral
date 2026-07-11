const CACHE_NAME = 'journaling-static-v3';
const ASSETS_TO_CACHE = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalar Service Worker y cachear sólo iconos y manifiesto estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activar y limpiar cachés de versiones antiguas
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

// Interceptar peticiones para servir de caché SÓLO archivos estáticos reales
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // EVITAR INTERCEPTAR páginas HTML dinámicas, llamadas a APIs o consola de Drizzle
  if (
    event.request.method !== 'GET' ||
    event.request.headers.get('accept')?.includes('text/html') ||
    url.pathname.includes('/api') ||
    url.pathname.includes('/_next/data') ||
    url.hostname.includes('drizzle')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Cachear estáticos reales (librerías css, js empaquetados e imágenes)
        if (
          response.status === 200 &&
          (url.pathname.startsWith('/_next/static') || url.pathname.endsWith('.png') || url.pathname.endsWith('.json'))
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    }).catch(() => {
      // Si falla, delegar a la red ordinaria de forma nativa sin romper la página
      return fetch(event.request);
    })
  );
});