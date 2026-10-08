import { money, unitLabel } from './text.js';

export const MAX_QTY = 999;
const clampQty = q => Math.min(MAX_QTY, Math.max(1, Math.trunc(Number(q)) || 1));
const validPrice = v => v === null || (Number.isSafeInteger(v) && v >= 0);

export function parseCart(raw) {
  try {
    const list = JSON.parse(raw || '[]');
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    return list.filter(i => i && typeof i.id === 'string' && !seen.has(i.id) && seen.add(i.id)
      && Number.isSafeInteger(i.qty) && i.qty >= 1 && i.qty <= MAX_QTY && validPrice(i.price) && typeof i.name === 'string')
      .map(i => ({ id: i.id, qty: i.qty, price: i.price, name: i.name, unit: typeof i.unit === 'string' ? i.unit : '' }));
  } catch { return []; }
}

export function addItem(items, p, qty = 1) {
  const hit = items.find(i => i.id === p.id);
  if (hit) return items.map(i => i === hit ? { ...i, qty: clampQty(i.qty + qty) } : i);
  return [...items, { id: p.id, qty: clampQty(qty), price: p.retail, name: p.name, unit: p.unit }];
}
export const setQty = (items, id, qty) => items.map(i => i.id === id ? { ...i, qty: clampQty(qty) } : i);
export const removeItem = (items, id) => items.filter(i => i.id !== id);

// السعر غير المحدد لا يدخل المجموع كأنه صفر، والمنتج المحذوف من التصدير لا يُحسب.
export function reconcile(items, byId) {
  let total = 0, unknown = 0, changed = 0, removed = 0;
  const lines = items.map(i => {
    const p = byId.get(i.id);
    if (!p) { removed++; return { ...i, product: null, current: null, status: 'removed' }; }
    const status = p.retail !== i.price ? 'changed' : 'ok';
    if (status === 'changed') changed++;
    if (p.retail == null) unknown++; else total += p.retail * i.qty;
    return { ...i, name: p.name, unit: p.unit, product: p, current: p.retail, status };
  });
  return { lines, total, unknown, changed, removed, count: lines.filter(l => l.product).reduce((n, l) => n + l.qty, 0) };
}

export const acknowledge = (items, byId) => items.map(i => {
  const p = byId.get(i.id);
  return p ? { ...i, price: p.retail, name: p.name, unit: p.unit } : i;
});

export function orderMessage(summary, { shopName, exportedAt, note }) {
  const rows = summary.lines.filter(l => l.product).map((l, n) => {
    const u = unitLabel(l.unit);
    const qty = `${l.qty}${u ? ' ' + u : ''}`;
    const price = l.current == null ? 'السعر عند الطلب' : `${money(l.current)} × ${l.qty} = ${money(l.current * l.qty)} د.ع`;
    return `${n + 1}) ${l.name} — الكمية: ${qty} — ${price}`;
  });
  const out = [`طلب من موقع ${shopName}`, '', ...rows, ''];
  out.push(`المجموع للمنتجات المسعّرة: ${money(summary.total)} د.ع`);
  if (summary.unknown) out.push(`منتجات سعرها عند الطلب: ${summary.unknown}`);
  if (exportedAt) out.push(`الأسعار حسب آخر تحديث: ${exportedAt}`);
  if (note && note.trim()) out.push('', `ملاحظات: ${note.trim()}`);
  out.push('', 'أرجو تأكيد التوفر والسعر النهائي.');
  return out.join('\n');
}

export const whatsappUrl = (number, text) => `https://wa.me/${encodeURIComponent(number)}?text=${encodeURIComponent(text)}`;

export function createListStore(storage, key, parse) {
  let items = parse(storage?.getItem(key));
  const subs = new Set();
  const set = next => {
    items = next;
    try { storage?.setItem(key, JSON.stringify(items)); } catch {}
    for (const fn of subs) fn(items);
  };
  return {
    get: () => items,
    set,
    update: fn => set(fn(items)),
    subscribe: fn => { subs.add(fn); return () => subs.delete(fn); },
    reload: () => { items = parse(storage?.getItem(key)); for (const fn of subs) fn(items); },
  };
}

export const createCart = storage => createListStore(storage, 'hamoudi-cart-v1', parseCart);
