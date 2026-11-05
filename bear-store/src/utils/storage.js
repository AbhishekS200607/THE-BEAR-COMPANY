/**
 * localStorage wrapper — JSON serialisation + optional TTL
 */

export function get(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // TTL envelope
    if (parsed && typeof parsed === 'object' && '__exp' in parsed) {
      if (Date.now() > parsed.__exp) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed.__val;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @param {*} value
 * @param {number} [ttlMs] - optional TTL in milliseconds
 */
export function set(key, value, ttlMs) {
  try {
    const payload = ttlMs != null
      ? { __val: value, __exp: Date.now() + ttlMs }
      : value;
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // quota exceeded or private mode
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch { /* ignore */ }
}

// Convenience TTL constants
export const TTL = {
  SESSION: 7 * 24 * 60 * 60 * 1000,   // 7 days  — auth session
  SHORT:   5 * 60 * 1000,              // 5 min   — product cache
  MEDIUM:  30 * 60 * 1000,             // 30 min  — collection cache
  LONG:    24 * 60 * 60 * 1000,        // 1 day   — static content
};

export default { get, set, remove, TTL };
