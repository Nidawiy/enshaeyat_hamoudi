const PREFIX = 'catalog-viewer-';
const CACHE = `${PREFIX}v11`;
const FILES = ['./', './index.html', './app.js', './site.js', './shop.js', './snapshot.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith(PREFIX) && key !== CACHE)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !url.href.startsWith(self.registration.scope)) return;
  if (url.pathname.endsWith('/catalog.json')) {
    event.respondWith(caches.open(CACHE).then(cache => fetch(event.request).then(r => { if (r.ok) cache.put(event.request, r.clone()); return r; }).catch(() => cache.match(event.request, { ignoreSearch: true }).then(hit => hit || Response.error()))));
    return;
  }
  event.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(event.request, { ignoreSearch: true });
    return hit || (event.request.mode === 'navigate' && await cache.match('./index.html')) || fetch(event.request);
  }));
});
