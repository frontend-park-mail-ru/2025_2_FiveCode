const CACHE_NAME = 'goose-app-v1';

const CACHE_FILES = [
    '/index.html',
    '/bundle.js',
    '/styles.css',
    '/src/static/css/globals.css',
    '/src/static/css/header.css',
    '/src/static/css/sidebar.css',
    '/src/static/css/note-block.css',
    '/src/static/css/auth.css',
    '/src/static/css/note-editor.css',
];

this.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(CACHE_FILES);
            })
            .catch((error) => {
                console.error('Error caching files:', error);
            })
    );
    self.skipWaiting();
});

this.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients && self.clients.claim && self.clients.claim();
});

this.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    const reqUrl = new URL(event.request.url);

    if (reqUrl.pathname.startsWith('/api/') || reqUrl.hostname !== self.location.hostname) {
        return;
    }

    if (event.request.mode === 'navigate' || (event.request.headers.get('accept') || '').includes('text/html')) {
        event.respondWith(
            fetch(event.request).then((resp) => {
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, resp.clone()).catch(() => {});
                });
                return resp;
            }).catch(() => caches.match('/index.html'))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => cachedResponse || fetch(event.request))
    );
});
