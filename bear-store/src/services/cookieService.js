const DEFAULTS = { path: '/', sameSite: 'Lax', secure: location.protocol === 'https:' };

export function get(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + encodeURIComponent(name) + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function set(name, value, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  if (opts.maxAge != null) cookie += `; max-age=${opts.maxAge}`;
  if (opts.expires instanceof Date) cookie += `; expires=${opts.expires.toUTCString()}`;
  if (opts.path) cookie += `; path=${opts.path}`;
  if (opts.domain) cookie += `; domain=${opts.domain}`;
  if (opts.sameSite) cookie += `; samesite=${opts.sameSite}`;
  if (opts.secure) cookie += `; secure`;
  document.cookie = cookie;
}

export function remove(name, options = {}) {
  set(name, '', { ...options, maxAge: 0 });
}

// ── Consent helpers ──────────────────────────────────────────
const CONSENT_KEY = 'bear_cookie_consent';
const CONSENT_TTL = 365 * 24 * 60 * 60; // 1 year in seconds

export function getConsent() {
  return get(CONSENT_KEY); // 'accepted' | 'rejected' | null
}

export function setConsent(value) {
  set(CONSENT_KEY, value, { maxAge: CONSENT_TTL });
}

export default { get, set, remove, getConsent, setConsent };
