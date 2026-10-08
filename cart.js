import { el, pageHeader, thumb, emptyState } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { money, priceText, unitLabel, dateText } from '../text.js';
import { reconcile, setQty, removeItem, acknowledge, orderMessage, whatsappUrl, MAX_QTY } from '../cart-store.js';
import { productHash } from '../router.js';

function line(ctx, l) {
  const unit = unitLabel(l.unit);
  const qtyInput = el('input', { type: 'number', inputmode: 'numeric', min: 1, max: MAX_QTY, value: l.qty, 'aria-label': `كمية ${l.name}` });
  qtyInput.addEventListener('change', () => ctx.cart.update(items => setQty(items, l.id, qtyInput.value)));
  const remove = el('button', { class: 'ibtn', type: 'button', 'aria-label': `حذف ${l.name} من السلة`, onclick: () => ctx.cart.update(items => removeItem(items, l.id)) }, icon('trash'));
  if (!l.product) return el('li', { class: 'cline removed' },
    el('div', { class: 'cinfo' }, el('b', { text: l.name }), el('p', { class: 'warn', text: 'لم يعد هذا المنتج في القائمة الحالية ولن يدخل الطلب.' })), remove);
  return el('li', { class: 'cline' + (l.status === 'changed' ? ' changed' : '') },
    el('a', { href: productHash(l.id), class: 'cthumb', 'aria-hidden': 'true', tabindex: '-1' }, thumb(ctx, l.product, 'cimg')),
    el('div', { class: 'cinfo' },
      el('a', { href: productHash(l.id) }, el('b', { text: l.name })),
      el('p', {}, priceText(l.current), unit ? ` / ${unit}` : ''),
      l.status === 'changed' ? el('p', { class: 'warn', text: `تغيّر السعر من ${priceText(l.price)} إلى ${priceText(l.current)}` }) : null,
      el('div', { class: 'cqty' },
        el('button', { type: 'button', class: 'ibtn', 'aria-label': 'زيادة الكمية', onclick: () => ctx.cart.update(items => setQty(items, l.id, l.qty + 1)) }, icon('plus')),
        qtyInput,
        el('button', { type: 'button', class: 'ibtn', 'aria-label': 'إنقاص الكمية', onclick: () => ctx.cart.update(items => setQty(items, l.id, l.qty - 1)) }, icon('minus')),
        unit ? el('small', { text: unit }) : null)),
    el('div', { class: 'cside' }, remove, el('span', { class: 'csum', text: l.current == null ? 'عند الطلب' : `${money(l.current * l.qty)} د.ع` })));
}

export function cartPage(ctx) {
  const main = el('main', { class: 'page' });
  let note = '';
  const draw = () => {
    const summary = reconcile(ctx.cart.get(), ctx.store.byId);
    if (!summary.lines.length) {
      main.replaceChildren(emptyState('السلة فارغة', 'أضف منتجات من الأقسام ثم أرسل الطلب للمحل على واتساب.', el('a', { class: 'btn pri', href: '#/categories' }, 'تصفّح الأقسام')));
      return;
    }
    const notices = [];
    if (summary.changed) notices.push(el('div', { class: 'notice' },
      el('p', { text: `تغيّرت أسعار ${summary.changed} من منتجات السلة منذ إضافتها. راجعها قبل إرسال الطلب.` }),
      el('button', { class: 'btn', type: 'button', onclick: () => ctx.cart.update(items => acknowledge(items, ctx.store.byId)) }, 'اعتماد الأسعار الحالية')));
    if (summary.removed) notices.push(el('div', { class: 'notice' }, el('p', { text: `${summary.removed} من منتجات السلة لم تعد في القائمة الحالية.` })));

    const ready = summary.count > 0 && !summary.changed && !!ctx.shop.whatsapp;
    const text = orderMessage(summary, { shopName: ctx.shop.name, exportedAt: dateText(ctx.store.catalog.exportedAt), note });
    const send = el('a', { class: 'btn pri wa' + (ready ? '' : ' disabled'), target: '_blank', rel: 'noopener', 'aria-disabled': ready ? null : 'true' }, icon('chat'), 'إرسال الطلب على واتساب');
    if (ready) send.href = whatsappUrl(ctx.shop.whatsapp, text);
    else send.addEventListener('click', e => e.preventDefault());

    const noteBox = el('textarea', { rows: 2, maxlength: 500, placeholder: 'ملاحظات للمحل (اختياري)', 'aria-label': 'ملاحظات الطلب' });
    noteBox.value = note;
    noteBox.addEventListener('input', () => { note = noteBox.value; if (ready) send.href = whatsappUrl(ctx.shop.whatsapp, orderMessage(summary, { shopName: ctx.shop.name, exportedAt: dateText(ctx.store.catalog.exportedAt), note })); });

    main.replaceChildren(...notices,
      el('ul', { class: 'clines' }, summary.lines.map(l => line(ctx, l))),
      el('div', { class: 'csummary' },
        el('div', { class: 'crow' }, el('span', { text: 'المجموع للمنتجات المسعّرة' }), el('b', { text: `${money(summary.total)} د.ع` })),
        summary.unknown ? el('p', { class: 'mut', text: `${summary.unknown} منتج سعره عند الطلب، يحدده المحل عند التأكيد.` }) : null,
        noteBox, send,
        el('p', { class: 'mut', text: 'الإرسال يفتح واتساب برسالة جاهزة ترسلها بنفسك. الطلب لا يُعد مؤكداً حتى يرد المحل بالتوفر والسعر النهائي.' }),
        el('button', { class: 'btn ghost', type: 'button', onclick: () => { if (confirm('تفريغ السلة؟')) ctx.cart.set([]); } }, 'تفريغ السلة')));
  };
  draw();
  ctx.onCleanup(ctx.cart.subscribe(draw));
  return [pageHeader(ctx, 'السلة', { cart: false }), main];
}
