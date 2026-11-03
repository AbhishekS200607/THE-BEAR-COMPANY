const store = new Map();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function set(key, value, ttl = DEFAULT_TTL) {
  store.set(key, { value, expiresAt: Date.now() + ttl });
}

export function invalidate(key) {
  store.delete(key);
}

export function invalidateAll() {
  store.clear();
}

export async function remember(key, fn, ttl = DEFAULT_TTL) {
  const cached = get(key);
  if (cached !== null) return cached;
  const value = await fn();
  set(key, value, ttl);
  return value;
}

export default { get, set, invalidate, invalidateAll, remember };
