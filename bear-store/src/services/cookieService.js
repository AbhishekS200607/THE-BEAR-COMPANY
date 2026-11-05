/**
 * BEAR Store — Cookie Service
 * Handles cookie read/write and granular consent management.
 *
 * Consent categories:
 *   necessary  — always on (session, auth, cart)
 *   analytics  — page views, behaviour tracking
 *   marketing  — retargeting, personalisation
 */

const DEFAULTS = {
  path: '/',
  sameSite: 'Lax',
  secure: location.protocol === 'https:',
};

export function get(name) {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + encodeURIComponent(name) + '=([^;]*)')
  );
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

// ── Consent ──────────────────────────────────────────────────

const CONSENT_KEY = 'bear_cookie_consent';
const CONSENT_TTL = 365 * 24 * 60 * 60; // 1 year in seconds

/**
 * Returns consent object: { necessary, analytics, marketing }
 * necessary is always true.
 */
export function getConsent() {
  const raw = get(CONSENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

/**
 * @param {{ analytics: boolean, marketing: boolean }} prefs
 */
export function setConsent(prefs) {
  const consent = { necessary: true, analytics: !!prefs.analytics, marketing: !!prefs.marketing };
  set(CONSENT_KEY, JSON.stringify(consent), { maxAge: CONSENT_TTL });
  // Dispatch event so other modules can react
  window.dispatchEvent(new CustomEvent('bear:consent', { detail: consent }));
}

export function hasConsent(category) {
  const consent = getConsent();
  if (!consent) return false;
  return !!consent[category];
}

export function revokeConsent() {
  remove(CONSENT_KEY);
  window.dispatchEvent(new CustomEvent('bear:consent', { detail: null }));
}

// ── Auth session cookie (necessary) ──────────────────────────
const SESSION_KEY = 'bear_session_id';
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days

export function setSessionCookie(sessionId) {
  set(SESSION_KEY, sessionId, { maxAge: SESSION_TTL });
}

export function getSessionCookie() {
  return get(SESSION_KEY);
}

export function clearSessionCookie() {
  remove(SESSION_KEY);
}

export default { get, set, remove, getConsent, setConsent, hasConsent, revokeConsent, setSessionCookie, getSessionCookie, clearSessionCookie };
