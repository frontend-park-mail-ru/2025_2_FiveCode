const CACHE_VERSION = 'v2';
const STATIC_CACHE = `app-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `app-dynamic-${CACHE_VERSION}`;
const API_CACHE = `app-api-${CACHE_VERSION}`;

const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return Promise.allSettled(
        STATIC_FILES.map(file => cache.add(file))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE].includes(key)) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then(cache =>
        cache.match(request).then(cached => {
          const fetchPromise = fetch(request)
            .then(networkResponse => {
              if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => null);

          return cached || fetchPromise || new Response('Offline', { status: 503 });
        })
      )
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  if (['style', 'script', 'image', 'font'].includes(request.destination)) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;

          return fetch(request)
            .then(response => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              if (request.destination === 'image') {
                return new Response('', { status: 204 });
              }
              return new Response('', { status: 503 });
            });
        })
      )
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request) || new Response('', { status: 503 }))
  );
});
