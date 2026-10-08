import { createListStore } from './cart-store.js';

export function parseFavorites(raw) {
  try {
    const list = JSON.parse(raw || '[]');
    return Array.isArray(list) ? [...new Set(list.filter(id => typeof id === 'string' && id.length <= 200))] : [];
  } catch { return []; }
}

export const toggleFavorite = (ids, id) => ids.includes(id) ? ids.filter(x => x !== id) : [id, ...ids];

export const createFavorites = storage => createListStore(storage, 'hamoudi-favorites-v1', parseFavorites);
