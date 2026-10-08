import { norm } from './text.js';

export const ICONS = ['bulb', 'brush', 'faucet', 'wrench', 'lock', 'pipe', 'saw', 'car', 'snow', 'star', 'fire', 'plug', 'tube', 'home', 'pump', 'brick'];
export const COLLECTIONS = { bestsellers: 'الأكثر مبيعاً', new: 'وصل حديثاً', featured: 'المنتجات المميزة' };
const TONES = ['sky', 'deep', 'gold'];

export const EMPTY_STOREFRONT = Object.freeze({
  format: 'hamoudi-storefront', version: 1, sections: [], brands: [], productBrands: {},
  collections: { bestsellers: [], new: [], featured: [] }, offers: [], products: {}, banners: [], announcements: [],
});

// يُرفض الملف كاملاً عند أي خلل، فلا تظهر بيانات عرض نصف صحيحة.
export function validateStorefront(raw) {
  const fail = why => { throw new Error(`ملف بيانات المتجر غير صالح: ${why}`); };
  const object = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const text = (v, max, required = false) => typeof v === 'string' && v.length <= max && (!required || !!v.trim());
  const slug = v => typeof v === 'string' && /^[a-z0-9-]{1,60}$/.test(v);
  const ref = v => text(v, 200, true);
  const asset = v => typeof v === 'string' && /^assets\/[a-z0-9][a-z0-9_\-/]*\.(png|jpe?g|webp|svg)$/i.test(v) && !v.includes('..') && !v.includes('//');
  const refs = (v, what) => {
    if (v === undefined) return [];
    if (!Array.isArray(v) || v.length > 100000 || !v.every(ref)) fail(what);
    return [...new Set(v)];
  };
  const unique = (list, what) => {
    if (!Array.isArray(list) || list.length > 1000) fail(what);
    const ids = new Set();
    for (const item of list) {
      if (!object(item) || !slug(item.id) || ids.has(item.id)) fail(`${what}: معرّف مكرر أو غير صالح`);
      ids.add(item.id);
    }
    return list;
  };
  const date = v => text(v, 40, true) && Number.isFinite(Date.parse(v));

  if (!object(raw) || raw.format !== 'hamoudi-storefront' || raw.version !== 1) fail('الصيغة أو الإصدار');

  const sections = unique(raw.sections, 'الأقسام').map(s => {
    if (!text(s.name, 60, true) || !ICONS.includes(s.icon)) fail(`القسم ${s.id}`);
    if (s.collection !== undefined && !(s.collection in COLLECTIONS)) fail(`مجموعة القسم ${s.id}`);
    const r = s.rules ?? {};
    if (!object(r)) fail(`قواعد القسم ${s.id}`);
    return {
      id: s.id, name: s.name, icon: s.icon, image: s.image && asset(s.image) ? s.image : null, collection: s.collection ?? null,
      rules: { categoryIds: refs(r.categoryIds, s.id), subcategoryIds: refs(r.subcategoryIds, s.id), excludeSubcategoryIds: refs(r.excludeSubcategoryIds, s.id), productIds: refs(r.productIds, s.id) },
    };
  });

  const brands = unique(raw.brands, 'الماركات').map((b, order) => {
    if (!text(b.name, 60, true) || (b.subtitle !== undefined && !text(b.subtitle, 80)) || (b.visible !== undefined && typeof b.visible !== 'boolean')) fail(`الماركة ${b.id}`);
    if (b.aliases !== undefined && (!Array.isArray(b.aliases) || !b.aliases.every(a => text(a, 60, true)))) fail(`أسماء الماركة ${b.id}`);
    if (b.logo !== undefined && !asset(b.logo)) fail(`شعار الماركة ${b.id}`);
    return { id: b.id, name: b.name, subtitle: b.subtitle || '', aliases: b.aliases || [], logo: b.logo || null, visible: b.visible !== false, order };
  });
  const brandIds = new Set(brands.map(b => b.id));

  if (!object(raw.productBrands)) fail('ربط الماركات');
  const productBrands = {};
  for (const [pid, bid] of Object.entries(raw.productBrands)) {
    if (!ref(pid) || !brandIds.has(bid)) fail(`ربط المنتج ${pid} بماركة غير موجودة`);
    productBrands[pid] = bid;
  }

  if (!object(raw.collections)) fail('المجموعات');
  const collections = {};
  for (const key of Object.keys(COLLECTIONS)) collections[key] = refs(raw.collections[key] ?? [], key);

  if (!Array.isArray(raw.offers)) fail('التخفيضات');
  const offers = raw.offers.map(o => {
    if (!object(o) || !ref(o.productId) || !Number.isSafeInteger(o.price) || !Number.isSafeInteger(o.previousPrice) || o.price < 0 || o.previousPrice <= o.price || !date(o.validUntil)) fail('عنصر تخفيض');
    return { productId: o.productId, price: o.price, previousPrice: o.previousPrice, validUntil: new Date(o.validUntil).toISOString() };
  });

  if (!object(raw.products)) fail('محتوى المنتجات');
  const products = {};
  for (const [pid, c] of Object.entries(raw.products)) {
    if (!ref(pid) || !object(c)) fail(`محتوى المنتج ${pid}`);
    if (c.publicDescription !== undefined && !text(c.publicDescription, 2000)) fail(`وصف المنتج ${pid}`);
    if (c.images !== undefined && (!Array.isArray(c.images) || c.images.length > 8 || !c.images.every(asset))) fail(`صور المنتج ${pid}`);
    products[pid] = { publicDescription: c.publicDescription?.trim() || '', images: c.images || [] };
  }

  const banners = unique(raw.banners, 'البنرات').map(b => {
    if (!text(b.title, 60, true) || !text(b.text, 120) || !(typeof b.href === 'string' && /^#\/[\w\-/?=&%]*$/.test(b.href)) || !TONES.includes(b.tone) || (b.image !== undefined && !asset(b.image))) fail(`البنر ${b.id}`);
    return { id: b.id, title: b.title, text: b.text || '', href: b.href, tone: b.tone, image: b.image || null };
  });

  const announcements = unique(raw.announcements, 'الإشعارات').map(a => {
    if (!text(a.title, 80, true) || !text(a.text, 600) || !date(a.date)) fail(`الإشعار ${a.id}`);
    return { id: a.id, title: a.title, text: a.text || '', date: new Date(a.date).toISOString() };
  });

  return { format: raw.format, version: 1, sections, brands, productBrands, collections, offers, products, banners, announcements };
}

function inSection(p, r) {
  if (r.productIds.includes(p.id)) return true;
  if (p.subcategoryId && r.subcategoryIds.includes(p.subcategoryId)) return true;
  return r.categoryIds.includes(p.categoryId) && !(p.subcategoryId && r.excludeSubcategoryIds.includes(p.subcategoryId));
}

// يربط بيانات العرض بمعرّفات منتجات آخر تصدير؛ ما حُذف من التصدير لا يظهر.
export function buildStore(catalog, storefront = EMPTY_STOREFRONT, now = Date.now()) {
  const byId = new Map(catalog.products.map(p => [p.id, p]));
  const catName = new Map(catalog.categories.map(c => [c.id, c.name]));
  const subName = new Map(catalog.subcategories.map(s => [s.id, s.name]));
  const brandById = new Map(storefront.brands.map(b => [b.id, b]));
  const existing = ids => ids.map(id => byId.get(id)).filter(Boolean);

  const collections = Object.fromEntries(Object.entries(storefront.collections).map(([k, ids]) => [k, existing(ids)]));
  const memberOf = Object.fromEntries(Object.entries(storefront.collections).map(([k, ids]) => [k, new Set(ids)]));

  const sectionProducts = new Map();
  const sectionsOf = new Map(catalog.products.map(p => [p.id, []]));
  for (const s of storefront.sections) {
    const list = s.collection ? collections[s.collection] : catalog.products.filter(p => inSection(p, s.rules));
    sectionProducts.set(s.id, list);
    for (const p of list) sectionsOf.get(p.id).push(s);
  }

  const brandOf = id => {
    const b = brandById.get(storefront.productBrands[id]);
    return b && b.visible ? b : null;
  };
  const brandProducts = new Map(storefront.brands.map(b => [b.id, []]));
  for (const p of catalog.products) { const b = brandOf(p.id); if (b) brandProducts.get(b.id).push(p); }

  const index = new Map(catalog.products.map(p => {
    const b = brandOf(p.id);
    return [p.id, norm([p.name, p.brand, p.model, p.unit, catName.get(p.categoryId), subName.get(p.subcategoryId),
      b && [b.name, b.subtitle, ...b.aliases].join(' '), ...sectionsOf.get(p.id).map(s => s.name)].join(' '))];
  }));

  const offers = storefront.offers
    .filter(o => byId.has(o.productId) && byId.get(o.productId).retail === o.price && Date.parse(o.validUntil) > now)
    .map(o => ({ ...o, product: byId.get(o.productId) }));

  return {
    catalog, storefront, byId, collections, offers,
    sections: storefront.sections,
    brands: storefront.brands.filter(b => b.visible),
    section: id => storefront.sections.find(s => s.id === id) || null,
    brand: id => { const b = brandById.get(id); return b && b.visible ? b : null; },
    sectionProducts: id => sectionProducts.get(id) || [],
    sectionsOf: id => sectionsOf.get(id) || [],
    brandProducts: id => brandProducts.get(id) || [],
    brandOf,
    categoryName: id => catName.get(id) || '',
    subcategoryName: id => subName.get(id) || '',
    content: id => storefront.products[id] || { publicDescription: '', images: [] },
    badges: id => ({ bestseller: memberOf.bestsellers.has(id), isNew: memberOf.new.has(id), featured: memberOf.featured.has(id) }),
    search(items, q) {
      const terms = norm(q).split(/\s+/).filter(Boolean);
      return terms.length ? items.filter(p => terms.every(t => index.get(p.id).includes(t))) : items;
    },
    similar(p, limit = 8) {
      const seen = new Set([p.id]), out = [];
      const take = list => { for (const x of list) { if (out.length >= limit) return; if (!seen.has(x.id)) { seen.add(x.id); out.push(x); } } };
      if (p.subcategoryId) take(catalog.products.filter(x => x.subcategoryId === p.subcategoryId));
      for (const s of sectionsOf.get(p.id) || []) take(sectionProducts.get(s.id));
      return out;
    },
  };
}

export function sortProducts(items, key) {
  if (key === 'name') return [...items].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  if (key !== 'asc' && key !== 'desc') return items;
  const dir = key === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => a.retail == null ? (b.retail == null ? 0 : 1) : b.retail == null ? -1 : (a.retail - b.retail) * dir);
}
