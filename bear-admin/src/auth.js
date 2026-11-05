import { createClient } from '@supabase/supabase-js';
import { API_ADMIN } from './config/api.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[BEAR Admin] Missing Supabase environment configuration (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
  },
});

let cachedSession = null;

export async function getSession() {
  if (cachedSession?.access_token) return cachedSession;
  const { data: { session } } = await supabase.auth.getSession();
  cachedSession = session;
  return session;
}

export async function getAccessToken() {
  const session = await getSession();
  return session?.access_token || null;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.access_token;
}

export async function logout() {
  cachedSession = null;
  await supabase.auth.signOut();
}

export function renderAuthGate(container, onSuccess) {
  container.innerHTML = `
    <div style="min-height:100vh;background:#09090b;display:flex;align-items:center;justify-content:center;padding:16px;">
      <div style="width:100%;max-width:360px;">
        <div style="text-align:center;margin-bottom:32px;">
          <p style="font-family:'Space Grotesk',sans-serif;font-size:28px;font-weight:700;letter-spacing:-0.02em;color:#f4f4f5;">
            BEAR<span style="color:#52525b;">.</span>
          </p>
          <p style="font-family:'Space Grotesk',sans-serif;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#52525b;margin-top:4px;">
            Secured Admin Console
          </p>
        </div>

        <div style="background:#18181b;border:1px solid #27272a;padding:28px;">
          <p style="font-family:'Space Grotesk',sans-serif;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#52525b;margin-bottom:20px;">
            Supabase Cryptographic Authentication
          </p>

          <div style="margin-bottom:14px;">
            <label style="display:block;font-size:11px;color:#71717a;margin-bottom:6px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.04em;text-transform:uppercase;">Admin Email</label>
            <input id="auth-email" type="email" class="admin-input" placeholder="admin@bear.in" autocomplete="email" />
          </div>

          <div style="margin-bottom:20px;">
            <label style="display:block;font-size:11px;color:#71717a;margin-bottom:6px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.04em;text-transform:uppercase;">Password</label>
            <input id="auth-password" type="password" class="admin-input" placeholder="••••••••" autocomplete="current-password" />
          </div>

          <div id="auth-error" style="display:none;margin-bottom:14px;padding:8px 12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#f87171;font-size:12px;font-family:'Plus Jakarta Sans',sans-serif;"></div>

          <button id="auth-submit" class="admin-btn primary" style="width:100%;justify-content:center;padding:10px 14px;font-size:12px;">
            Sign In with Supabase
          </button>
        </div>

        <p style="text-align:center;font-size:11px;color:#3f3f46;margin-top:16px;font-family:'Plus Jakarta Sans',sans-serif;">
          BEAR Performance Wear · Cryptographic Role Verification
        </p>
      </div>
    </div>
  `;

  const emailEl = container.querySelector('#auth-email');
  const passEl = container.querySelector('#auth-password');
  const errorEl = container.querySelector('#auth-error');
  const submitBtn = container.querySelector('#auth-submit');

  async function attempt() {
    const email = emailEl.value.trim().toLowerCase();
    const password = passEl.value;

    if (!email || !password) {
      errorEl.textContent = 'Please enter both email and password.';
      errorEl.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying Credentials...';
    errorEl.style.display = 'none';

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        throw new Error(error?.message || 'Invalid email or password.');
      }

      cachedSession = data.session;

      // Verify admin role directly against backend
      const checkRes = await fetch(`${API_ADMIN}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
        },
      });

      if (checkRes.status === 403) {
        await supabase.auth.signOut();
        cachedSession = null;
        throw new Error('Access Denied: Your account does not have administrative privileges.');
      }

      if (!checkRes.ok) {
        throw new Error(`Authentication verification failed (${checkRes.status}).`);
      }

      onSuccess();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
      passEl.value = '';
      passEl.focus();
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In with Supabase';
    }
  }

  submitBtn.addEventListener('click', attempt);
  passEl.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
  emailEl.addEventListener('keydown', e => { if (e.key === 'Enter') passEl.focus(); });
}
