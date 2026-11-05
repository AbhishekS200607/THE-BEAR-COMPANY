/**
 * BEAR Store — Cache Service
 * In-memory L1 + sessionStorage L2 with TTL.
 * Use for products, collections, user data — anything fetched async.
 */

const PREFIX = 'bear_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 min

// L1 — in-memory (fastest, cleared on page unload)
const memStore = new Map();

function readSession(key) {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() > entry.exp) {
      sessionStorage.removeItem(PREFIX + key);
      return null;
    }
    return entry.val;
  } catch {
    return null;
  }
}

function writeSession(key, value, ttl) {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify({ val: value, exp: Date.now() + ttl }));
  } catch { /* quota */ }
}

export function get(key) {
  // L1
  const mem = memStore.get(key);
  if (mem) {
    if (Date.now() > mem.exp) { memStore.delete(key); }
    else return mem.val;
  }
  // L2
  const val = readSession(key);
  if (val !== null) {
    memStore.set(key, { val, exp: Date.now() + DEFAULT_TTL });
    return val;
  }
  return null;
}

export function set(key, value, ttl = DEFAULT_TTL) {
  memStore.set(key, { val: value, exp: Date.now() + ttl });
  // Skip sessionStorage for large arrays to avoid quota churn
  if (!Array.isArray(value) || value.length < 10) {
    writeSession(key, value, ttl);
  }
}

export function invalidate(key) {
  memStore.delete(key);
  try { sessionStorage.removeItem(PREFIX + key); } catch { /* ignore */ }
}

export function invalidateAll() {
  memStore.clear();
  try {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => sessionStorage.removeItem(k));
  } catch { /* ignore */ }
}

/**
 * Cache-aside helper — returns cached value or calls fn() and caches result.
 * @param {string} key
 * @param {() => Promise<*>} fn
 * @param {number} [ttl]
 */
export async function remember(key, fn, ttl = DEFAULT_TTL) {
  const cached = get(key);
  if (cached !== null) return cached;
  const value = await fn();
  set(key, value, ttl);
  return value;
}

// Named cache keys — use these everywhere instead of raw strings
export const CACHE_KEYS = {
  PRODUCTS: 'products',
  COLLECTIONS: 'collections',
  USER: 'account_user',
  ORDERS: 'account_orders',
  ADDRESSES: 'account_addresses',
};

export default { get, set, invalidate, invalidateAll, remember, CACHE_KEYS };
