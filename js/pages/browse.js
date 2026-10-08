import { el, pageHeader, searchBox, sectionTile, brandTile, brandMark, productGrid, emptyState } from '../components/ui.js';
import { sortProducts, COLLECTIONS } from '../storefront-data.js';

function chips(list, current, onPick, label) {
  if (list.length < 2) return null;
  return el('div', { class: 'chips', role: 'group', 'aria-label': label }, list.map(c => el('button', {
    type: 'button', class: 'chip' + (c.id === current ? ' on' : ''), 'aria-pressed': String(c.id === current),
    onclick: () => onPick(c.id),
  }, c.label)));
}

function sortSelect(value, onChange) {
  const s = el('select', { 'aria-label': 'ترتيب المنتجات', onchange: () => onChange(s.value) },
    [['', 'الترتيب الافتراضي'], ['name', 'الاسم'], ['asc', 'السعر: الأقل أولاً'], ['desc', 'السعر: الأعلى أولاً']]
      .map(([v, t]) => el('option', { value: v, selected: v === value }, t)));
  s.value = value;
  return s;
}

// قائمة منتجات يحفظ بحثها وفلترها وترتيبها في الرابط.
function listing(ctx, { base, query, filters = [], filterKey, emptyText }) {
  const state = { q: query.q || '', sort: query.sort || '', [filterKey]: query[filterKey] || '' };
  const count = el('span', { class: 'count', 'aria-live': 'polite' });
  const slot = el('div');
  const chipSlot = el('div');
  const apply = () => {
    let items = base;
    const f = filters.find(x => x.id === state[filterKey]);
    if (f && f.test) items = items.filter(f.test);
    items = sortProducts(ctx.store.search(items, state.q), state.sort);
    count.textContent = `${items.length} منتج`;
    slot.replaceChildren(productGrid(ctx, items, {
      empty: emptyState(state.q ? 'لا توجد نتائج' : 'لا توجد منتجات حالياً', state.q ? 'جرّب كلمة أخرى أو اختر قسماً مختلفاً.' : emptyText),
    }));
    if (filterKey) chipSlot.replaceChildren(chips(filters, state[filterKey], id => { state[filterKey] = id; sync(); apply(); }, 'تصفية') || '');
  };
  const sync = () => ctx.setQuery({ q: state.q, sort: state.sort, [filterKey]: state[filterKey] });
  const search = searchBox({ value: state.q, onInput: v => { state.q = v.trim(); sync(); apply(); } });
  apply();
  return [search, chipSlot, base.length ? el('div', { class: 'tools' }, count, sortSelect(state.sort, v => { state.sort = v; sync(); apply(); })) : null, slot];
}

export function categoriesPage(ctx) {
  return [pageHeader(ctx, 'الأقسام'), el('main', { class: 'page' }, el('div', { class: 'tiles' }, ctx.store.sections.map(s => sectionTile(s))))];
}

export function categoryPage(ctx, id, query) {
  const s = ctx.store.section(id);
  if (!s) return null;
  if (s.collection) { ctx.navigate(`#/collections/${s.collection}`, true); return []; }
  const base = ctx.store.sectionProducts(id);
  const subs = [...new Set(base.map(p => p.subcategoryId).filter(Boolean))].map(sid => ({ id: sid, label: ctx.store.subcategoryName(sid), test: p => p.subcategoryId === sid }));
  return [pageHeader(ctx, s.name), el('main', { class: 'page' },
    ...listing(ctx, { base, query, filterKey: 'sub', filters: subs.length > 1 ? [{ id: '', label: 'الكل' }, ...subs] : [], emptyText: 'سنضيف منتجات هذا القسم قريباً. تواصل معنا للاستفسار.' }))];
}

export function brandsPage(ctx) {
  const list = ctx.store.brands;
  return [pageHeader(ctx, 'البراندات'), el('main', { class: 'page' },
    list.length ? el('div', { class: 'tiles' }, list.map(b => brandTile(b))) : emptyState('لا توجد ماركات منشورة حالياً'))];
}

export function brandPage(ctx, id, query) {
  const b = ctx.store.brand(id);
  if (!b) return null;
  const base = ctx.store.brandProducts(id);
  const secs = [...new Map(base.flatMap(p => ctx.store.sectionsOf(p.id)).filter(s => !s.collection).map(s => [s.id, s])).values()];
  const filters = secs.map(s => ({ id: s.id, label: s.name, test: p => ctx.store.sectionsOf(p.id).some(x => x.id === s.id) }));
  const parts = listing(ctx, { base, query, filterKey: 'category', filters: filters.length > 1 ? [{ id: '', label: 'الكل' }, ...filters] : [], emptyText: 'لم تُربط منتجات بهذه الماركة بعد. تواصل معنا للاستفسار عن توفرها.' });
  if (filters.length === 1) parts.splice(1, 0, el('div', { class: 'chips' }, el('span', { class: 'chip on' }, filters[0].label)));
  return [el('div', { class: 'brand-hero' }, brandMark(b, true)), pageHeader(ctx, b.name), el('main', { class: 'page' }, ...parts)];
}

export function collectionPage(ctx, key, query) {
  return [pageHeader(ctx, COLLECTIONS[key]), el('main', { class: 'page' },
    ...listing(ctx, { base: ctx.store.collections[key], query, emptyText: 'لم يحدد المحل منتجات هذه المجموعة بعد.' }))];
}

export function searchPage(ctx, query) {
  return [pageHeader(ctx, query.q ? 'نتائج البحث' : 'جميع المنتجات'), el('main', { class: 'page' },
    ...listing(ctx, { base: ctx.store.catalog.products, query }))];
}
