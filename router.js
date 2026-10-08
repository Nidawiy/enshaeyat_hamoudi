const ROUTES = [
  ['home', /^$/],
  ['categories', /^categories$/],
  ['category', /^category\/([^/]+)$/],
  ['brands', /^brands$/],
  ['brand', /^brand\/([^/]+)$/],
  ['collection', /^collections\/(bestsellers|new|featured)$/],
  ['search', /^search$/],
  ['product', /^product\/([^/]+)$/],
  ['favorites', /^favorites$/],
  ['cart', /^cart$/],
  ['details', /^details$/],
  ['details', /^account$/],
  ['notifications', /^notifications$/],
  ['contact', /^contact$/],
];

export function parseHash(hash) {
  const raw = String(hash || '').replace(/^#\/?/, '');
  const [path, qs = ''] = raw.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs));
  const clean = path.replace(/\/+$/, '');
  for (const [name, re] of ROUTES) {
    const m = clean.match(re);
    if (m) {
      let id = null;
      try { id = m[1] ? decodeURIComponent(m[1]) : null; } catch { break; }
      return { name, id, query };
    }
  }
  return { name: 'notfound', id: null, query };
}

export function buildHash(path, query = {}) {
  const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v != null && v !== '')).toString();
  return `#/${path}${qs ? '?' + qs : ''}`;
}

export const productHash = id => `#/product/${encodeURIComponent(id)}`;
