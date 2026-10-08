import { icon } from './icons.js';
import { priceText, unitLabel } from '../text.js';
import { productHash } from '../router.js';
import { addItem } from '../cart-store.js';
import { toggleFavorite } from '../favorites-store.js';

export function el(tag, attrs, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) if (c != null && c !== false) e.append(c);
  return e;
}

export function cartLink(ctx) {
  const badge = el('span', { class: 'badge', 'data-cart-count': '' });
  const a = el('a', { class: 'ibtn', href: '#/cart', 'aria-label': 'السلة' }, icon('cart'), badge);
  ctx.paintCart(badge);
  return a;
}

export function backButton(ctx) {
  return el('button', { class: 'ibtn back', type: 'button', 'aria-label': 'رجوع', onclick: () => ctx.back() }, icon('back'));
}

export function homeHeader(ctx) {
  return el('header', { class: 'top home-top' },
    el('a', { class: 'logo', href: '#/', 'aria-label': ctx.shop.name }, el('img', { src: 'icon-192.png', alt: '', width: 44, height: 44 }), el('span', { text: ctx.shop.name })),
    el('div', { class: 'top-actions' },
      el('a', { class: 'contact-link', href: '#/contact' }, icon('phone'), el('span', { text: 'تواصل معنا' })),
      cartLink(ctx),
      el('a', { class: 'ibtn', href: '#/notifications', 'aria-label': 'الإشعارات' }, icon('bell'))));
}

export function pageHeader(ctx, title, { share, cart = true } = {}) {
  return el('header', { class: 'top page-top' },
    backButton(ctx),
    el('h1', { text: title }),
    el('div', { class: 'top-actions' },
      share ? el('button', { class: 'ibtn', type: 'button', 'aria-label': 'مشاركة', onclick: share }, icon('share')) : null,
      cart ? cartLink(ctx) : null));
}

export function tabTitle(title) { return el('h1', { class: 'tab-title', text: title }); }

export function searchBox({ value = '', placeholder = 'ابحث عن منتج...', onInput, onSubmit, label = 'البحث عن منتج' }) {
  const input = el('input', { type: 'search', value, placeholder, 'aria-label': label, autocomplete: 'off', enterkeyhint: 'search' });
  input.value = value;
  let t;
  input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => onInput?.(input.value), 150); });
  const form = el('form', { class: 'search', role: 'search', onsubmit: e => { e.preventDefault(); clearTimeout(t); (onSubmit || onInput)?.(input.value); input.blur(); } },
    input, el('button', { class: 'search-ico', type: 'submit', 'aria-label': 'بحث' }, icon('search')));
  return form;
}

export function emptyState(title, text, action) {
  return el('div', { class: 'empty', role: 'status' }, el('b', { text: title }), text ? el('p', { text }) : null, action || null);
}

export function sectionHead(title, href) {
  return el('div', { class: 'sec-head' }, el('h2', { text: title }),
    href ? el('a', { class: 'more-link', href }, el('span', { text: 'المزيد' }), icon('back', 'ico flip')) : null);
}

function thumb(ctx, p, cls) {
  const s = ctx.store.sectionsOf(p.id).find(x => !x.collection);
  const hue = s ? s.icon : 'star';
  const box = el('div', { class: `${cls} noimg hue-${hue}` });
  box.append(icon(hue, 'ph'));
  return box;
}

export function favButton(ctx, id, cls = 'fav') {
  const b = el('button', { class: cls, type: 'button' }, icon('heart'));
  const paint = () => {
    const on = ctx.favorites.get().includes(id);
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة');
  };
  b.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    ctx.favorites.update(ids => toggleFavorite(ids, id));
    paint();
    ctx.toast(ctx.favorites.get().includes(id) ? 'أُضيف إلى المفضلة' : 'أُزيل من المفضلة');
  });
  paint();
  return b;
}

export function addToCart(ctx, p, qty = 1) {
  ctx.cart.update(items => addItem(items, p, qty));
  ctx.toast('أُضيف إلى السلة', { href: '#/cart', label: 'عرض السلة' });
}

export function badges(ctx, id) {
  const b = ctx.store.badges(id), box = el('div', { class: 'badges' });
  if (b.bestseller) box.append(el('span', { class: 'gold-badge', title: 'الأكثر مبيعاً' }, icon('trend'), el('span', { class: 'sr', text: 'الأكثر مبيعاً' })));
  if (b.isNew) box.append(el('span', { class: 'gold-badge', title: 'جديد' }, icon('sparkle'), el('span', { class: 'sr', text: 'جديد' })));
  return box.childElementCount ? box : null;
}

export function productCard(ctx, p) {
  const unit = unitLabel(p.unit);
  const card = el('article', { class: 'pcard' },
    el('a', { class: 'pcard-link', href: productHash(p.id) },
      thumb(ctx, p, 'pimg'),
      el('h3', { class: 'pname', text: p.name }),
      el('p', { class: 'pprice' + (p.retail == null ? ' na' : '') }, el('b', { text: priceText(p.retail) }), unit ? el('small', { text: ` / ${unit}` }) : null)),
    favButton(ctx, p.id),
    badges(ctx, p.id),
    el('button', { class: 'add-btn', type: 'button', onclick: () => addToCart(ctx, p) }, icon('cart'), el('span', { text: 'أضف للسلة' })));
  return card;
}

export { thumb };

export function productRail(ctx, products) {
  return el('div', { class: 'rail', role: 'list' }, products.slice(0, 12).map(p => { const c = productCard(ctx, p); c.setAttribute('role', 'listitem'); return c; }));
}

export function sectionTile(s, { compact = false } = {}) {
  const href = s.collection ? `#/collections/${s.collection}` : `#/category/${s.id}`;
  return el('a', { class: 'tile' + (compact ? ' compact' : ''), href },
    el('div', { class: 'tile-img hue-' + s.icon }, s.image ? el('img', { src: s.image, alt: '', loading: 'lazy', width: 300, height: 240 }) : icon(s.icon, 'tile-ico')),
    el('span', { class: 'tile-name', text: s.name }));
}

export function brandMark(b, big = false) {
  return el('div', { class: 'brand-mark text' + (big ? ' big' : ''), 'aria-hidden': 'true' }, el('b', { text: b.name }), b.subtitle ? el('small', { text: b.subtitle }) : null);
}

export function brandTile(b, { compact = false } = {}) {
  return el('a', { class: 'tile brand' + (compact ? ' compact' : ''), href: `#/brand/${b.id}`, 'aria-label': [b.name, b.subtitle].filter(Boolean).join(' — ') }, brandMark(b));
}

export function bottomNav(active) {
  const items = [['home', '#/', 'الرئيسية', 'home'], ['favorites', '#/favorites', 'المفضلة', 'heart'], ['details', '#/details', 'التفاصيل', 'info']];
  return el('nav', { class: 'tabbar', 'aria-label': 'التنقل الرئيسي' }, items.map(([id, href, label, ic]) =>
    el('a', { href, class: id === active ? 'on' : null, 'aria-current': id === active ? 'page' : null }, icon(ic), el('span', { text: label }))));
}

// شبكة منتجات بعرض تدريجي.
export function productGrid(ctx, items, { page = 40, empty } = {}) {
  const box = el('div', { class: 'list' });
  let shown = page;
  const draw = () => {
    if (!items.length) { box.replaceChildren(empty || emptyState('لا توجد منتجات حالياً')); return; }
    const g = el('div', { class: 'grid' }, items.slice(0, shown).map(p => productCard(ctx, p)));
    box.replaceChildren(g);
    if (items.length > shown) box.append(el('button', { class: 'more', type: 'button', onclick: () => { shown += page; draw(); } }, `عرض المزيد (${items.length - shown} متبقٍ)`));
  };
  draw();
  return box;
}
