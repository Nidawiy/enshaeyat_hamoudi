import { el, pageHeader, productCard, favButton, addToCart, thumb, emptyState } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { priceText, unitLabel, money } from '../text.js';
import { MAX_QTY } from '../cart-store.js';

export function productPage(ctx, id) {
  const { store } = ctx;
  const p = store.byId.get(id);
  if (!p) return [pageHeader(ctx, 'تفاصيل المنتج'), el('main', { class: 'page' },
    emptyState('المنتج غير متوفر في القائمة الحالية', 'ربما حُذف أو تغيّر في آخر تحديث للأسعار.', el('a', { class: 'btn pri', href: '#/' }, 'العودة للرئيسية')))];

  const content = store.content(p.id);
  const brand = store.brandOf(p.id);
  const unit = unitLabel(p.unit);
  const secs = store.sectionsOf(p.id).filter(s => !s.collection);
  const share = async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: p.name, text: `${p.name} — ${priceText(p.retail)}`, url });
      else { await navigator.clipboard.writeText(url); ctx.toast('نُسخ رابط المنتج'); }
    } catch (e) { if (e?.name !== 'AbortError') ctx.toast('تعذرت المشاركة'); }
  };

  const similar = store.similar(p);
  const main = el('main', { class: 'page has-buybar' },
    thumb(ctx, p, 'detail-img'),
    el('h2', { class: 'detail-name', text: p.name }),
    store.badges(p.id).isNew ? el('span', { class: 'new-pill' }, icon('sparkle'), 'جديد') : null,
    el('p', { class: 'detail-price' + (p.retail == null ? ' na' : '') }, priceText(p.retail), unit ? el('small', { text: ` / ${unit}` }) : null),
    el('dl', { class: 'facts' },
      brand ? el('div', {}, el('dt', { text: 'الماركة' }), el('dd', {}, el('a', { href: `#/brand/${brand.id}`, text: brand.name }))) : null,
      secs.length ? el('div', {}, el('dt', { text: 'القسم' }), el('dd', {}, secs.map((s, i) => [i ? '، ' : '', el('a', { href: `#/category/${s.id}`, text: s.name })]))) : null,
      p.model ? el('div', {}, el('dt', { text: 'الموديل' }), el('dd', { text: p.model })) : null),
    content.publicDescription ? el('section', { class: 'desc' }, el('h3', { text: 'وصف المنتج' }), el('p', { text: content.publicDescription })) : null,
    similar.length ? el('section', { class: 'sec' }, el('h3', { class: 'sim-title', text: 'منتجات مشابهة' }), el('div', { class: 'grid' }, similar.map(x => productCard(ctx, x)))) : null);

  let qty = 1;
  const qtyOut = el('output', { class: 'qty-n', 'aria-live': 'polite', text: '1' });
  const total = el('span', { class: 'buy-total' });
  const paint = () => {
    qtyOut.textContent = String(qty);
    total.textContent = p.retail == null ? 'السعر عند الطلب' : `${money(p.retail * qty)} د.ع`;
  };
  const step = d => { qty = Math.min(MAX_QTY, Math.max(1, qty + d)); paint(); };
  const bar = el('div', { class: 'buybar' },
    el('div', { class: 'buy-row' },
      el('div', { class: 'qty', role: 'group', 'aria-label': 'الكمية' },
        el('button', { type: 'button', 'aria-label': 'زيادة الكمية', onclick: () => step(1) }, icon('plus')),
        qtyOut,
        el('button', { type: 'button', 'aria-label': 'إنقاص الكمية', onclick: () => step(-1) }, icon('minus')),
        unit ? el('small', { text: unit }) : null),
      total),
    el('div', { class: 'buy-row' },
      el('button', { class: 'add-btn big', type: 'button', onclick: () => { addToCart(ctx, p, qty); qty = 1; paint(); } }, icon('cart'), el('span', { text: 'أضف للسلة' })),
      favButton(ctx, p.id, 'fav-big')));
  paint();
  return [pageHeader(ctx, 'تفاصيل المنتج', { share }), main, bar];
}
