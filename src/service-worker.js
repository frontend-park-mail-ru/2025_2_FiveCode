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


self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_FILES))
      .catch((err) => console.error('Error caching files during install:', err))
  );
  self.skipWaiting();
});
// --- Активация ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      )
    )
  );
  self.clients.claim();
});

// --- Обработка запросов ---
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const reqUrl = new URL(event.request.url);

  // НЕ перехватываем: API и внешние запросы
  if (reqUrl.origin !== self.location.origin || reqUrl.pathname.startsWith('/api/')) return;

  // НЕ перехватываем: служебные файлы
  const excludedPaths = ['/service-worker.js', '/bundle.js'];
  if (excludedPaths.includes(reqUrl.pathname)) return;

  // HTML-навигация
  if (event.request.mode === 'navigate') {
  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        // если fetch успешен (онлайн), просто возвращаем ответ
        if (!resp || !resp.ok) throw new Error('Fetch failed'); // на случай ошибок
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return resp;
      })
      .catch(async () => {
        // fallback только при ошибке fetch (офлайн)
        const cached = await caches.match('/index.html');
        if (cached) return cached;
        return new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } });
      })
  );
  return;
}


  // Остальные ресурсы (CSS, JS, картинки)
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((resp) => {
      if (resp.ok && resp.type !== 'opaque') {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return resp;
    }).catch(() => caches.match('/index.html')))
  );
});
