// Validate the complete file before replacing the last saved snapshot.
export function validateSnapshot(raw) {
  const fail = () => { throw new Error('ملف نسخة العرض غير مكتمل أو يحتوي بيانات غير صالحة. أعد تصديره من تطبيق الكتالوج.'); };
  const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const text = (value, max = 200, required = false) => typeof value === 'string' && value.length <= max && (!required || !!value.trim());
  const price = value => value === null || (Number.isSafeInteger(value) && value >= 0 && value <= 999999999999);
  if (!object(raw) || raw.format !== 'daleel-viewer' || raw.version !== 1 || !text(raw.snapshotId, 200, true) || !text(raw.exportedAt) || !Number.isFinite(Date.parse(raw.exportedAt))) fail();
  const records = value => {
    if (!Array.isArray(value) || value.length > 100000) fail();
    const ids = new Set();
    for (const item of value) {
      if (!object(item) || !text(item.id, 200, true) || ids.has(item.id)) fail();
      ids.add(item.id);
    }
    return value;
  };
  const categories = records(raw.categories).map(c => {
    if (!text(c.name, 60, true)) fail();
    return { id: c.id, name: c.name };
  });
  const categoryIds = new Set(categories.map(c => c.id));
  const subcategories = records(raw.subcategories).map(s => {
    if (!text(s.name, 60, true) || !categoryIds.has(s.categoryId)) fail();
    return { id: s.id, name: s.name, categoryId: s.categoryId };
  });
  const subMap = new Map(subcategories.map(s => [s.id, s]));
  const products = records(raw.products).map(p => {
    if (!text(p.name, 200, true) || !text(p.brand) || !text(p.model) || !text(p.unit, 200, true) || !categoryIds.has(p.categoryId)) fail();
    if (p.subcategoryId !== null && subMap.get(p.subcategoryId)?.categoryId !== p.categoryId) fail();
    if (![p.wholesale, p.retail, p.cartonPrice].every(price) || (p.piecesCount !== null && (!Number.isSafeInteger(p.piecesCount) || p.piecesCount <= 0))) fail();
    return { id:p.id, name:p.name, brand:p.brand, model:p.model, unit:p.unit, categoryId:p.categoryId, subcategoryId:p.subcategoryId, wholesale:p.wholesale, retail:p.retail, cartonPrice:p.cartonPrice, piecesCount:p.piecesCount };
  });
  return { format: 'daleel-viewer', version: 1, public: raw.public === true, snapshotId:raw.snapshotId, exportedAt:new Date(raw.exportedAt).toISOString(), categories, subcategories, products };
}
