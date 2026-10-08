import { validateSnapshot } from '../snapshot.js';

// الموقع للزبائن: يقبل نسخة العرض العامة فقط ويحذف أي سعر غير سعر المفرد.
export const publicOnly = n => n.public ? { ...n, products: n.products.map(p => ({ ...p, wholesale: null, cartonPrice: null })) } : null;

const open = () => new Promise((res, rej) => {
  const r = indexedDB.open('catalog-viewer', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('s');
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});

async function stored(mode, value) {
  const d = await open();
  try {
    return await new Promise((resolve, reject) => {
      const t = d.transaction('s', mode), store = t.objectStore('s');
      const request = mode === 'readonly' ? store.get('snap') : store.put(value, 'snap');
      t.oncomplete = () => resolve(mode === 'readonly' ? request.result || null : undefined);
      t.onabort = () => reject(t.error || new Error('تعذر حفظ نسخة العرض. بقيت النسخة السابقة محفوظة.'));
      t.onerror = () => reject(t.error);
    });
  } finally { d.close(); }
}

export async function loadSaved() {
  try {
    const v = await stored('readonly');
    return v ? publicOnly(validateSnapshot(v)) : null;
  } catch { return null; }
}

// يعتمد catalog.json من الموقع إن كان أحدث من النسخة المحفوظة.
export async function loadRemote(current) {
  const r = await fetch('catalog.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error(`catalog.json ${r.status}`);
  const n = publicOnly(validateSnapshot(await r.json()));
  if (!n) return current;
  if (!current || Date.parse(n.exportedAt) > Date.parse(current.exportedAt)) {
    await stored('readwrite', n).catch(() => {});
    return n;
  }
  return current;
}
