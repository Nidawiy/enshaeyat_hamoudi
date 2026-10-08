import { el, pageHeader, tabTitle, homeHeader, bottomNav, productGrid, emptyState } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { dateText } from '../text.js';

export function favoritesPage(ctx) {
  const main = el('main', { class: 'page has-tabbar' });
  const draw = () => {
    const ids = ctx.favorites.get();
    const items = ids.map(id => ctx.store.byId.get(id)).filter(Boolean);
    const missing = ids.length - items.length;
    main.replaceChildren(...[tabTitle('المفضلة'),
      missing ? el('div', { class: 'notice' }, el('p', { text: `${missing} من المفضلة لم تعد في القائمة الحالية.` }),
        el('button', { class: 'btn', type: 'button', onclick: () => ctx.favorites.set(items.map(p => p.id)) }, 'إزالتها')) : null,
      productGrid(ctx, items, { empty: emptyState('لا توجد منتجات في المفضلة', 'اضغط على القلب في أي منتج لحفظه هنا.', el('a', { class: 'btn pri', href: '#/categories' }, 'تصفّح الأقسام')) })].filter(Boolean));
  };
  draw();
  ctx.onCleanup(ctx.favorites.subscribe(draw));
  return [homeHeader(ctx), main, bottomNav('favorites')];
}

const row = (href, ic, label, ext) => el('a', { class: 'row-link', href, target: ext ? '_blank' : null, rel: ext ? 'noopener' : null }, icon(ic), el('span', {}, label), icon('back', 'ico flip'));

export function detailsPage(ctx) {
  const s = ctx.shop;
  const favs = ctx.favorites.get().length;
  return [homeHeader(ctx), el('main', { class: 'page has-tabbar' }, tabTitle('التفاصيل'),
    el('div', { class: 'panel' }, el('b', { class: 'shop-name', text: s.name }), s.since ? el('p', { class: 'mut', text: `منذ عام ${s.since}` }) : null,
      el('dl', { class: 'facts' },
        s.address ? el('div', {}, el('dt', {}, icon('map')), el('dd', { text: s.address })) : null,
        s.hours ? el('div', {}, el('dt', {}, icon('clock')), el('dd', { text: s.hours })) : null,
        s.phone ? el('div', {}, el('dt', {}, icon('phone')), el('dd', {}, el('bdi', { dir: 'ltr', text: s.phone }))) : null)),
    el('nav', { class: 'rows', 'aria-label': 'روابط التفاصيل' },
      row('#/contact', 'phone', 'تواصل معنا'),
      row('#/favorites', 'heart', `المفضلة${favs ? ` (${favs})` : ''}`),
      row('#/cart', 'cart', 'السلة'),
      row('#/notifications', 'bell', 'الإشعارات')),
    el('p', { class: 'updated' }, 'آخر تحديث للأسعار: ', el('b', { text: dateText(ctx.store.catalog.exportedAt) })),
    el('p', { class: 'updated', text: 'السلة والمفضلة تُحفظان على هذا الجهاز فقط.' })), bottomNav('details')];
}

export function notificationsPage(ctx) {
  const list = [...ctx.store.storefront.announcements].sort((a, b) => b.date.localeCompare(a.date));
  return [pageHeader(ctx, 'الإشعارات'), el('main', { class: 'page' }, list.length
    ? el('ul', { class: 'notes' }, list.map(a => el('li', { class: 'panel' }, el('b', { text: a.title }), a.text ? el('p', { text: a.text }) : null, el('small', { class: 'mut', text: dateText(a.date) }))))
    : emptyState('لا توجد إشعارات', 'ستظهر هنا إعلانات المحل عند نشرها.'))];
}

export function contactPage(ctx) {
  const s = ctx.shop;
  const links = [
    s.phone && row(`tel:${s.phone}`, 'phone', ['اتصال ', el('bdi', { dir: 'ltr', text: s.phone })]),
    s.whatsapp && row(`https://wa.me/${s.whatsapp}`, 'chat', 'مراسلة على واتساب', true),
    s.instagram && row(`https://www.instagram.com/${s.instagram}/`, 'user', ['إنستغرام ', el('bdi', { dir: 'ltr', text: `@${s.instagram}` })], true),
    s.mapsUrl && row(s.mapsUrl, 'map', 'الاتجاهات في خرائط Google', true),
    s.wazeUrl && row(s.wazeUrl, 'nav', 'افتح في Waze', true),
  ].filter(Boolean);
  return [pageHeader(ctx, 'تواصل معنا'), el('main', { class: 'page' },
    el('div', { class: 'panel' }, el('b', { class: 'shop-name', text: s.name }), s.since ? el('p', { class: 'mut', text: `منذ عام ${s.since}` }) : null,
      el('dl', { class: 'facts' },
        s.address ? el('div', {}, el('dt', {}, icon('map')), el('dd', { text: s.address })) : null,
        s.hours ? el('div', {}, el('dt', {}, icon('clock')), el('dd', { text: s.hours })) : null)),
    el('nav', { class: 'rows', 'aria-label': 'طرق التواصل' }, links),
    el('p', { class: 'updated', text: s.tagline }))];
}

export function notFoundPage(ctx) {
  return [pageHeader(ctx, 'غير موجود'), el('main', { class: 'page' }, emptyState('الصفحة غير موجودة', 'ربما تغيّر الرابط أو حُذف المحتوى.', el('a', { class: 'btn pri', href: '#/' }, 'العودة للرئيسية')))];
}
