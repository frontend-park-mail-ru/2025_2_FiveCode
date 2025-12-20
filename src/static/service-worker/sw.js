const CACHE_VERSION = "v3.0.2";
const STATIC_CACHE = `app-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `app-dynamic-${CACHE_VERSION}`;
const NOTES_CACHE = `app-notes-${CACHE_VERSION}`;

const STATIC_FILES = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_FILES);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!key.includes(CACHE_VERSION)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(DYNAMIC_CACHE);
          await cache.put(request, networkResponse.clone());
          
          return networkResponse;
        } catch (error) {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return caches.match("/index.html");
        }
      })()
    );
    return;
  }

  if (url.pathname.includes("hot-update")) {
    return;
  }

  if (url.pathname.startsWith("/api/notes") && request.method === "GET") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          const responseToCache = networkResponse.clone();
          const cache = await caches.open(NOTES_CACHE);
          await cache.put(request, responseToCache);
                  
          return networkResponse;
        } catch (error) {
          // If network fails, try to serve from cache
          const cachedResponse = await caches.match(request);
          
          if (cachedResponse) {
            const headers = new Headers(cachedResponse.headers);
            headers.append('X-Served-From', 'cache');
            
            const modifiedResponse = new Response(cachedResponse.body, {
              status: cachedResponse.status,
              statusText: cachedResponse.statusText,
              headers: headers
            });
            
            return modifiedResponse;
          }

          throw error;
        }
      })()
    );
    return;
  }

  if (url.pathname.startsWith("/api/") || request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        return caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});
