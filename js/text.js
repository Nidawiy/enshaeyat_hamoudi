const AR = '٠١٢٣٤٥٦٧٨٩';

export const norm = s => String(s || '')
  .replace(/[٠-٩]/g, c => AR.indexOf(c))
  .replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 1776))
  .replace(/[\u064B-\u065F\u0670ـ]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  .normalize('NFKC').toLowerCase().trim();

export const tokens = s => norm(s).split(/[\s/\\|,،؛:()\[\]"'+*\-]+/).filter(Boolean);

export const money = v => new Intl.NumberFormat('en-US').format(v);

export const priceText = v => v == null ? 'السعر عند الطلب' : `${money(v)} د.ع`;

export const unitLabel = unit => unit && unit !== 'غير محدد' ? unit : '';

export const dateText = iso => new Intl.DateTimeFormat('ar-IQ', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Baghdad' }).format(new Date(iso));
