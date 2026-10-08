const PREFIX = 'catalog-viewer-';
const CACHE = `${PREFIX}v18`;
const IMAGES = `${PREFIX}images`;
const IMAGE_LIMIT = 150;
const DATA = ['/catalog.json', '/storefront.json'];
const FILES = [
  './', './index.html', './shop.js', './snapshot.js', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  './styles/app.css', './fonts/noto-sans-arabic-arabic-wght-normal.woff2', './fonts/noto-sans-arabic-latin-wght-normal.woff2',
  './js/main.js', './js/text.js', './js/router.js', './js/catalog-store.js', './js/storefront-data.js', './js/cart-store.js', './js/favorites-store.js',
  './js/components/icons.js', './js/components/ui.js',
  './js/pages/home.js', './js/pages/browse.js', './js/pages/product.js', './js/pages/cart.js', './js/pages/tabs.js',
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith(PREFIX) && key !== CACHE && key !== IMAGES)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
async function trim(cache) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - IMAGE_LIMIT)).map(k => cache.delete(k)));
}
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !url.href.startsWith(self.registration.scope)) return;
  if (DATA.some(name => url.pathname.endsWith(name))) {
    event.respondWith(caches.open(CACHE).then(cache => fetch(event.request).then(r => { if (r.ok) cache.put(event.request, r.clone()); return r; }).catch(() => cache.match(event.request, { ignoreSearch: true }).then(hit => hit || Response.error()))));
    return;
  }
  if (url.pathname.includes('/assets/')) {
    event.respondWith(caches.open(IMAGES).then(async cache => {
      const hit = await cache.match(event.request);
      if (hit) return hit;
      const r = await fetch(event.request);
      if (r.ok) { await cache.put(event.request, r.clone()); trim(cache); }
      return r;
    }));
    return;
  }
  event.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(event.request, { ignoreSearch: true });
    return hit || (event.request.mode === 'navigate' && await cache.match('./index.html')) || fetch(event.request);
  }));
});
