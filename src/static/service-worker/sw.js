const CACHE_VERSION = 'v1';
const STATIC_CACHE = `app-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `app-dynamic-${CACHE_VERSION}`;
const API_CACHE = `app-api-${CACHE_VERSION}`;

const STATIC_FILES = [
  '/',
  '/index.html',
];

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 дней в миллисекундах

// Установка service worker
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('[SW] Caching static files');
      return Promise.allSettled(
        STATIC_FILES.map(file => cache.add(file).catch(err => {
          console.warn(`[SW] Failed to cache ${file}:`, err);
        }))
      );
    }).then(() => {
      self.skipWaiting();
    })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Удаляем старые версии кэша
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    return event.respondWith(
      caches.open(API_CACHE).then(cache => {
        return cache.match(request).then(response => {
          if (response) {
            fetch(request).then(networkResponse => {
              if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
            }).catch(() => {});
            return response;
          }

          return fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      }).catch(() => {
        return new Response('API unavailable offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
    );
  }

  if (request.mode === 'navigate') {
    return event.respondWith(
      fetch(request)
        .then(networkResponse => {
          if (networkResponse.ok) {
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then(cachedResponse => {
            return cachedResponse || caches.match('/index.html') || 
              new Response('Offline - page not available', {
                status: 503,
                statusText: 'Service Unavailable'
              });
          });
        })
    );
  }

  // Статические файлы (JS, CSS, images) - cache first, fallback to network
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image') {
    return event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return cache.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Fallback для изображений
            if (request.destination === 'image') {
              return new Response('', { status: 204 });
            }
            return new Response('', { status: 503 });
          });
        });
      })
    );
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, response.clone());
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then(cachedResponse => {
          return cachedResponse || new Response('', { status: 503 });
        });
      })
  );
});
