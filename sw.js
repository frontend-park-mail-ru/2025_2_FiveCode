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
});

this.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request);
            })
    );
});
