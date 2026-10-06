import { SHOP } from './shop.js';
import { validateSnapshot } from './snapshot.js';

const ICONS = {
  'مواد بناء': '🏗️', 'ادوات بناء': '🧱', 'صحيات': '🚿', 'اصباغ': '🎨', 'عدد يدوية': '🔧',
  'عدد كهربائية': '🪚', 'مواد كهربائية': '💡', 'براغي ومثبتات': '🔩', 'ابواب واكسسوارات': '🚪',
  'لوازم حدائق زراعية': '🌱', 'تجهيزات منزلية': '🏠', 'أدوات منزلية': '🧰', 'مواد تنظيف': '🧽',
};
const num = n => new Intl.NumberFormat('ar-IQ').format(n);

for (const e of document.querySelectorAll('[data-shop]')) e.textContent = SHOP[e.dataset.shop];
for (const e of document.querySelectorAll('[data-need]')) e.hidden = !e.dataset.need.split(' ').every(k => SHOP[k]);
for (const [sel, href] of [
  ['[data-href=maps]', SHOP.mapsUrl],
  ['[data-href=waze]', SHOP.wazeUrl],
  ['[data-href=phone]', SHOP.phone && `tel:${SHOP.phone}`],
  ['[data-href=whatsapp]', SHOP.whatsapp && `https://wa.me/${SHOP.whatsapp}`],
]) for (const a of document.querySelectorAll(sel)) { if (href) a.href = href; else a.hidden = true; }
document.querySelectorAll('[data-text=phone]').forEach(e => { e.textContent = SHOP.phone; e.dir = 'ltr'; });

const ld = { '@context': 'https://schema.org', '@type': 'HardwareStore', name: SHOP.name, description: SHOP.tagline, url: location.href.split('#')[0], hasMap: SHOP.mapsUrl };
if (SHOP.phone) ld.telephone = SHOP.phone;
if (SHOP.address) ld.address = SHOP.address;
const s = document.createElement('script');
s.type = 'application/ld+json';
s.textContent = JSON.stringify(ld);
document.head.append(s);

function pickCategory(id) {
  const chip = [...document.querySelectorAll('#chips .chip')].find(c => c.dataset.id === id);
  chip?.click();
  document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
}

async function categories() {
  try {
    const r = await fetch('catalog.json', { cache: 'no-cache' });
    if (!r.ok) return;
    const c = validateSnapshot(await r.json());
    if (!c.public) return;
    const count = id => c.products.filter(p => p.categoryId === id).length;
    const cats = c.categories.map(k => ({ ...k, n: count(k.id) })).filter(k => k.n).sort((a, b) => b.n - a.n);
    document.getElementById('st-products').textContent = num(c.products.length);
    document.getElementById('st-cats').textContent = num(cats.length);
    document.getElementById('stats').hidden = false;
    const box = document.getElementById('cats');
    box.replaceChildren(...cats.map(k => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tile';
      const ic = document.createElement('span'); ic.className = 'ti'; ic.textContent = ICONS[k.name] || '📦';
      const nm = document.createElement('b'); nm.textContent = k.name;
      const ct = document.createElement('small'); ct.textContent = `${num(k.n)} منتج`;
      b.append(ic, nm, ct);
      b.onclick = () => pickCategory(k.id);
      return b;
    }));
  } catch {}
}
categories();
