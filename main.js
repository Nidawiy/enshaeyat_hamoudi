import { SHOP } from '../shop.js';
import { loadSaved, loadRemote } from './catalog-store.js';
import { validateStorefront, buildStore, EMPTY_STOREFRONT } from './storefront-data.js';
import { createCart, reconcile } from './cart-store.js';
import { createFavorites } from './favorites-store.js';
import { parseHash, buildHash } from './router.js';
import { el, emptyState, homeHeader, bottomNav } from './components/ui.js';
import { homePage } from './pages/home.js';
import { categoriesPage, categoryPage, brandsPage, brandPage, collectionPage, searchPage } from './pages/browse.js';
import { productPage } from './pages/product.js';
import { cartPage } from './pages/cart.js';
import { favoritesPage, detailsPage, notificationsPage, contactPage, notFoundPage } from './pages/tabs.js';

const root = document.getElementById('app');
const storage = (() => { try { return window.localStorage; } catch { return null; } })();
let catalog = null, storefront = EMPTY_STOREFRONT, loading = true, failed = false;
let cleanups = [], fresh = false, depth = 0;
const scrolls = new Map();

const toastBox = el('div', { class: 'toast', role: 'status', 'aria-live': 'polite' });
document.body.append(toastBox);
let toastTimer;

const ctx = {
  shop: SHOP,
  store: null,
  cart: createCart(storage),
  favorites: createFavorites(storage),
  toast(text, action) {
    toastBox.replaceChildren(el('span', { text }), action ? el('a', { href: action.href, text: action.label }) : '');
    toastBox.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastBox.classList.remove('on'), 2600);
  },
  navigate(hash, replace = false) {
    fresh = true;
    if (replace) { history.replaceState(null, '', hash); render(); } else location.hash = hash;
  },
  back() { if (depth > 0) history.back(); else ctx.navigate('#/', true); },
  setQuery(query) {
    const path = location.hash.replace(/^#\/?/, '').split('?')[0];
    history.replaceState(null, '', buildHash(path, query));
  },
  paintCart(badge) { paintBadge(badge); },
  onCleanup(fn) { cleanups.push(fn); },
};

function cartCount() {
  const items = ctx.cart.get();
  return ctx.store ? reconcile(items, ctx.store.byId).count : items.reduce((n, i) => n + i.qty, 0);
}
function paintBadge(b) {
  const n = cartCount();
  b.textContent = n > 99 ? '99+' : n ? String(n) : '';
  b.hidden = !n;
  b.closest('a')?.setAttribute('aria-label', n ? `السلة، ${n} قطعة` : 'السلة');
}
ctx.cart.subscribe(() => document.querySelectorAll('[data-cart-count]').forEach(paintBadge));
addEventListener('storage', e => {
  if (e.key === 'hamoudi-cart-v1') ctx.cart.reload();
  if (e.key === 'hamoudi-favorites-v1') ctx.favorites.reload();
});

function page(route) {
  const { name, id, query } = route;
  switch (name) {
    case 'home': return homePage(ctx);
    case 'categories': return categoriesPage(ctx);
    case 'category': return categoryPage(ctx, id, query);
    case 'brands': return brandsPage(ctx);
    case 'brand': return brandPage(ctx, id, query);
    case 'collection': return collectionPage(ctx, id, query);
    case 'search': return searchPage(ctx, query);
    case 'product': return productPage(ctx, id);
    case 'favorites': return favoritesPage(ctx);
    case 'cart': return cartPage(ctx);
    case 'details': return detailsPage(ctx);
    case 'notifications': return notificationsPage(ctx);
    case 'contact': return contactPage(ctx);
    default: return null;
  }
}

function unavailable() {
  const main = el('main', { class: 'page has-tabbar' });
  if (loading) main.append(el('div', { class: 'grid' }, Array.from({ length: 6 }, () => el('div', { class: 'skel' }))));
  else main.append(emptyState('الأسعار غير متاحة حالياً', failed ? 'تعذر تحميل قائمة الأسعار. تحقق من الاتصال ثم أعد المحاولة.' : 'تواصل معنا لمعرفة الأسعار.',
    el('div', { class: 'cta' }, el('button', { class: 'btn', type: 'button', onclick: () => refresh() }, 'إعادة المحاولة'), el('a', { class: 'btn pri', href: '#/contact' }, 'تواصل معنا'))));
  return [homeHeader(ctx), main, bottomNav('home')];
}

function render({ keepScroll = false } = {}) {
  for (const fn of cleanups.splice(0)) { try { fn(); } catch {} }
  const route = parseHash(location.hash);
  const y = scrollY;
  let nodes;
  if (route.name === 'contact') nodes = contactPage(ctx);
  else if (!ctx.store) nodes = unavailable();
  else nodes = page(route) || notFoundPage(ctx);
  if (!nodes.length) return;
  root.replaceChildren(...nodes.filter(Boolean));
  const title = root.querySelector('h1')?.textContent;
  document.title = title && route.name !== 'home' ? `${title} · ${SHOP.name}` : `${SHOP.name} · صحيات وكهربائيات وعدد ومنزليات`;
  if (keepScroll) scrollTo(0, y);
  else if (fresh) scrollTo(0, 0);
  else scrollTo(0, scrolls.get(location.hash) || 0);
  fresh = false;
}

addEventListener('click', e => {
  const a = e.target.closest?.('a[href^="#/"]');
  if (a && !e.defaultPrevented && !e.metaKey && !e.ctrlKey) fresh = true;
}, true);
addEventListener('hashchange', e => {
  const old = new URL(e.oldURL).hash;
  scrolls.set(old, scrollY);
  depth = fresh ? depth + 1 : Math.max(0, depth - 1);
  render();
});
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

let storefrontSettled = false;
function rebuild() {
  ctx.store = catalog && storefrontSettled ? buildStore(catalog, storefront) : null;
}

async function loadStorefront() {
  const r = await fetch('storefront.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error(`storefront.json ${r.status}`);
  return validateStorefront(await r.json());
}

async function refresh() {
  loading = true; failed = false;
  if (!ctx.store) render({ keepScroll: true });
  const [c, s] = await Promise.allSettled([loadRemote(catalog), loadStorefront()]);
  loading = false;
  storefrontSettled = true;
  let changed = false;
  if (c.status === 'fulfilled' && c.value !== catalog) { catalog = c.value; changed = true; }
  if (c.status === 'rejected') { failed = !catalog; console.error(c.reason); }
  if (s.status === 'fulfilled') { storefront = s.value; changed = true; }
  else { console.error(s.reason); ctx.toast('تعذر تحميل بيانات واجهة المتجر؛ تُعرض المنتجات دون الأقسام.'); }
  if (changed || !ctx.store) { rebuild(); render({ keepScroll: true }); }
}

const ld = { '@context': 'https://schema.org', '@type': 'HardwareStore', name: SHOP.name, description: SHOP.tagline, url: location.href.split('#')[0], hasMap: SHOP.mapsUrl };
if (SHOP.phone) ld.telephone = SHOP.phone;
if (SHOP.address) ld.address = SHOP.address;
if (SHOP.since) ld.foundingDate = SHOP.since;
if (SHOP.instagram) ld.sameAs = [`https://www.instagram.com/${SHOP.instagram}/`];
document.head.append(el('script', { type: 'application/ld+json', text: JSON.stringify(ld) }));

catalog = await loadSaved();
render();
refresh();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
