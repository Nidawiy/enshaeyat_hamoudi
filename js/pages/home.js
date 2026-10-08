import { el, homeHeader, tabTitle, searchBox, sectionHead, sectionTile, brandTile, productRail, bottomNav } from '../components/ui.js';
import { buildHash } from '../router.js';
import { COLLECTIONS } from '../storefront-data.js';
import { dateText } from '../text.js';

function banners(list) {
  if (!list.length) return null;
  const track = el('div', { class: 'banners', 'aria-roledescription': 'شرائح', 'aria-label': 'عروض المحل' },
    list.map((b, i) => el('a', { class: `banner tone-${b.tone}`, href: b.href, 'aria-label': `${b.title}. ${b.text}`, 'data-i': i },
      b.image ? el('img', { src: b.image, alt: '', width: 900, height: 340 }) : null,
      el('div', { class: 'banner-txt' }, el('b', { text: b.title }), b.text ? el('span', { text: b.text }) : null))));
  if (list.length < 2) return track;
  const dots = el('div', { class: 'dots' }, list.map((b, i) => el('button', {
    type: 'button', class: i === 0 ? 'on' : null, 'aria-label': `الشريحة ${i + 1}`,
    onclick: () => track.children[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }),
  })));
  track.addEventListener('scroll', () => {
    const w = track.clientWidth || 1, i = Math.round(Math.abs(track.scrollLeft) / w);
    [...dots.children].forEach((d, n) => d.classList.toggle('on', n === i));
  }, { passive: true });
  return el('div', { class: 'banner-wrap' }, track, dots);
}

function collectionBlock(ctx, key) {
  const items = ctx.store.collections[key];
  if (!items.length) return null;
  return el('section', { class: 'sec' }, sectionHead(COLLECTIONS[key], `#/collections/${key}`), productRail(ctx, items));
}

export function homePage(ctx) {
  const { store } = ctx;
  const main = el('main', { class: 'page has-tabbar' },
    tabTitle('الرئيسية'),
    searchBox({ onSubmit: q => ctx.navigate(buildHash('search', { q: q.trim() })) }),
    banners(store.storefront.banners),
    el('section', { class: 'sec' }, sectionHead('الأقسام', '#/categories'),
      el('div', { class: 'rail2' }, store.sections.map(s => sectionTile(s, { compact: true })))),
    collectionBlock(ctx, 'bestsellers'),
    store.brands.length ? el('section', { class: 'sec' }, sectionHead('البراندات', '#/brands'),
      el('div', { class: 'rail2' }, store.brands.map(b => brandTile(b, { compact: true })))) : null,
    collectionBlock(ctx, 'new'),
    collectionBlock(ctx, 'featured'),
    el('a', { class: 'all-link', href: '#/search' }, `تصفّح جميع المنتجات (${store.catalog.products.length})`),
    el('p', { class: 'updated' }, 'آخر تحديث للأسعار: ', el('b', { text: dateText(store.catalog.exportedAt) })),
    el('p', { class: 'updated', text: 'الأسعار قابلة للتغيير، يرجى التأكد عند الشراء.' }));
  return [homeHeader(ctx), main, bottomNav('home')];
}
