/**
 * Recently Viewed Products Service
 * Tracks customer's last viewed garments across PDPs.
 */

const STORAGE_KEY = 'bear_recently_viewed';
const MAX_ITEMS = 6;

export function recordView(productId) {
  if (!productId) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list = raw ? JSON.parse(raw) : [];

    // Remove if already exists, then push to front
    list = list.filter((id) => id !== productId);
    list.unshift(productId);

    if (list.length > MAX_ITEMS) {
      list = list.slice(0, MAX_ITEMS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Could not record recently viewed product:', err);
  }
}

export function getRecentlyViewedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearRecentlyViewed() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export default { recordView, getRecentlyViewedIds, clearRecentlyViewed };

