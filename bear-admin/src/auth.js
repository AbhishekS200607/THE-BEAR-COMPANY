/**
 * BEAR Admin — Authentication Gate
 * Email: admin@bear.in / Password: bear1980
 */

const SESSION_KEY = 'bear_admin_v2';
const CREDENTIALS = { email: 'admin@bear.in', password: 'bear1980' };

export function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
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
            Admin Portal
          </p>
        </div>

        <div style="background:#18181b;border:1px solid #27272a;padding:28px;">
          <p style="font-family:'Space Grotesk',sans-serif;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#52525b;margin-bottom:20px;">
            Sign In to Continue
          </p>

          <div style="margin-bottom:14px;">
            <label style="display:block;font-size:11px;color:#71717a;margin-bottom:6px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.04em;text-transform:uppercase;">Email</label>
            <input id="auth-email" type="email" class="admin-input" placeholder="admin@bear.in" autocomplete="email" />
          </div>

          <div style="margin-bottom:20px;">
            <label style="display:block;font-size:11px;color:#71717a;margin-bottom:6px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.04em;text-transform:uppercase;">Password</label>
            <input id="auth-password" type="password" class="admin-input" placeholder="••••••••" autocomplete="current-password" />
          </div>

          <div id="auth-error" style="display:none;margin-bottom:14px;padding:8px 12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#f87171;font-size:12px;font-family:'Plus Jakarta Sans',sans-serif;"></div>

          <button id="auth-submit" class="admin-btn primary" style="width:100%;justify-content:center;padding:10px 14px;font-size:12px;">
            Sign In
          </button>
        </div>

        <p style="text-align:center;font-size:11px;color:#3f3f46;margin-top:16px;font-family:'Plus Jakarta Sans',sans-serif;">
          BEAR Performance Wear · Secured Admin Access
        </p>
      </div>
    </div>
  `;

  const emailEl = container.querySelector('#auth-email');
  const passEl = container.querySelector('#auth-password');
  const errorEl = container.querySelector('#auth-error');
  const submitBtn = container.querySelector('#auth-submit');

  function attempt() {
    const email = emailEl.value.trim().toLowerCase();
    const pass = passEl.value;
    if (email === CREDENTIALS.email && pass === CREDENTIALS.password) {
      sessionStorage.setItem(SESSION_KEY, '1');
      onSuccess();
    } else {
      errorEl.textContent = 'Incorrect email or password.';
      errorEl.style.display = 'block';
      passEl.value = '';
      passEl.focus();
    }
  }

  submitBtn.addEventListener('click', attempt);
  passEl.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
  emailEl.addEventListener('keydown', e => { if (e.key === 'Enter') passEl.focus(); });
}
