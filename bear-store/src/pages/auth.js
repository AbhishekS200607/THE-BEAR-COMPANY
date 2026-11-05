/**
 * BEAR Store — Customer Auth Page
 * Login / Signup / Guest (with name+phone) / Forgot Password
 */

import { getMode } from '../state/store.js';
import { showToast } from '../components/toast.js';
import { get, set, TTL } from '../utils/storage.js';
import { setSessionCookie } from '../services/cookieService.js';
import { shakeInput } from '../utils/animations.js';
import { API_V1 } from '../config/api.js';

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://flxccuowqflxtwtynvml.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_a97yBCvUiIhQOGxpnXG2MA_Z9OVx83s';

async function supabaseSignIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description || json.msg || 'Sign in failed');
  return json;
}

async function supabaseSignUp(email, password, fullName, phoneNumber = null) {
  try {
    // 1. Primary: Use backend pre-confirmed registration (bypasses Supabase SMTP email rate limiter)
    const payload = { email, password, fullName };
    if (phoneNumber) payload.phoneNumber = phoneNumber;

    const res = await fetch(`${API_V1}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok && json.success && json.data) {
      return json.data;
    }
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Sign up failed');
    }
  } catch (backendErr) {
    if (backendErr.message && !backendErr.message.toLowerCase().includes('failed to fetch')) {
      throw backendErr;
    }
    console.warn('[BEAR Auth] Backend unreachable, trying direct Supabase:', backendErr.message);
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password, data: { full_name: fullName, phone: phoneNumber } }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error_description || json.msg || backendErr.message || 'Sign up failed');
    return json;
  }
}

async function supabaseForgotPassword(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
    body: JSON.stringify({ email }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description || json.msg || 'Failed to send reset email');
  return json;
}

export function render(container) {
  const mode = getMode();
  const isSow = mode === 'sow';
  const accent = isSow ? '#80534C' : '#09090b';
  const accentLight = isSow ? 'bg-[#80534C]' : 'bg-black';
  const accentHover = isSow ? 'hover:bg-[#6b4540]' : 'hover:bg-zinc-800';
  const accentText = isSow ? 'text-[#80534C]' : 'text-black';

  // activeTab: 'login' | 'signup' | 'forgot' | 'guest' | 'email-sent' | 'reset-sent'
  let activeTab = 'login';
  let pendingEmail = '';

  const page = document.createElement('div');
  page.className = 'w-full min-h-screen flex flex-col items-center justify-center pt-20 pb-32 px-4';

  function inp(cls = '') {
    return `w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black transition-colors ${cls}`;
  }
  function label(text) {
    return `<label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 font-headline">${text}</label>`;
  }
  function errEl(id) {
    return `<p id="${id}" class="text-[11px] text-red-600 mt-1 hidden"></p>`;
  }
  function serverErrEl(id) {
    return `<div id="${id}" class="hidden text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"></div>`;
  }
  function submitBtn(id, textId, text, extraClass = '') {
    return `<button type="submit" id="${id}" class="w-full py-3 rounded-full ${accentLight} ${accentHover} text-white text-xs font-bold uppercase font-headline tracking-wider transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 ${extraClass}">
      <span id="${textId}">${text}</span>
    </button>`;
  }

  function tabBar() {
    if (activeTab === 'forgot' || activeTab === 'guest' || activeTab === 'email-sent' || activeTab === 'reset-sent') return '';
    return `
      <div class="flex bg-zinc-100 rounded-full p-1 mb-6">
        <button id="tab-login" class="flex-1 py-2 rounded-full text-xs font-bold font-headline uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'login' ? `${accentLight} text-white shadow-sm` : 'text-zinc-500 hover:text-zinc-800'}">Sign In</button>
        <button id="tab-signup" class="flex-1 py-2 rounded-full text-xs font-bold font-headline uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'signup' ? `${accentLight} text-white shadow-sm` : 'text-zinc-500 hover:text-zinc-800'}">Create Account</button>
      </div>`;
  }

  function loginForm() {
    return `
      <form id="login-form" novalidate class="flex flex-col gap-4">
        <div>
          ${label('Email Address')}
          <input id="login-email" type="email" autocomplete="email" placeholder="you@example.com" class="${inp()}" />
          ${errEl('login-email-err')}
        </div>
        <div>
          <div class="flex items-center justify-between mb-1.5">
            ${label('Password').replace('<label', '<label style="margin-bottom:0"')}
            <button type="button" id="forgot-btn" class="text-[11px] ${accentText} font-semibold hover:underline cursor-pointer">Forgot password?</button>
          </div>
          <input id="login-password" type="password" autocomplete="current-password" placeholder="••••••••" class="${inp()}" />
          ${errEl('login-pass-err')}
        </div>
        ${serverErrEl('login-server-err')}
        ${submitBtn('login-submit', 'login-btn-text', 'Sign In to Account')}
      </form>`;
  }

  function signupForm() {
    const guestUser = get('bear_user');
    const defaultName = (guestUser?.name && guestUser.name !== 'Guest') ? guestUser.name : '';
    const defaultPhone = guestUser?.phone || '';

    return `
      <form id="signup-form" novalidate class="flex flex-col gap-4">
        <div>
          ${label('Full Name')}
          <input id="signup-name" type="text" autocomplete="name" placeholder="Your full name" value="${defaultName}" class="${inp()}" />
          ${errEl('signup-name-err')}
        </div>
        <div>
          ${label('Email Address')}
          <input id="signup-email" type="email" autocomplete="email" placeholder="you@example.com" class="${inp()}" />
          ${errEl('signup-email-err')}
        </div>
        <div>
          ${label('Mobile Number (Optional)')}
          <input id="signup-phone" type="tel" maxlength="10" placeholder="10-digit mobile number" value="${defaultPhone}" class="${inp()}" />
          ${errEl('signup-phone-err')}
          <p class="text-[10px] text-zinc-400 mt-1">Links any guest orders previously placed with this mobile number.</p>
        </div>
        <div>
          ${label('Password')}
          <input id="signup-password" type="password" autocomplete="new-password" placeholder="Min. 8 characters" class="${inp()}" />
          ${errEl('signup-pass-err')}
        </div>
        ${serverErrEl('signup-server-err')}
        ${submitBtn('signup-submit', 'signup-btn-text', 'Create My Account')}
        <p class="text-[10px] text-zinc-400 text-center leading-relaxed">
          By creating an account you agree to our
          <a href="#terms" class="underline ${accentText}">Terms</a> and
          <a href="#privacy" class="underline ${accentText}">Privacy Policy</a>.
        </p>
      </form>`;
  }

  function forgotForm() {
    return `
      <div class="mb-5">
        <button id="back-to-login" class="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-black cursor-pointer">
          <svg class="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Back to Sign In
        </button>
        <h2 class="font-headline text-base font-bold text-zinc-900 mt-3">Reset your password</h2>
        <p class="text-xs text-zinc-500 mt-1">Enter your email and we'll send you a reset link.</p>
      </div>
      <form id="forgot-form" novalidate class="flex flex-col gap-4">
        <div>
          ${label('Email Address')}
          <input id="forgot-email" type="email" autocomplete="email" placeholder="you@example.com" class="${inp()}" />
          ${errEl('forgot-email-err')}
        </div>
        ${serverErrEl('forgot-server-err')}
        ${submitBtn('forgot-submit', 'forgot-btn-text', 'Send Reset Link')}
      </form>`;
  }

  function guestForm() {
    return `
      <div class="mb-5">
        <button id="back-to-login" class="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-black cursor-pointer">
          <svg class="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Back
        </button>
        <h2 class="font-headline text-base font-bold text-zinc-900 mt-3">Continue as Guest</h2>
        <p class="text-xs text-zinc-500 mt-1">Your info is saved on this device only. Create an account to sync across devices.</p>
      </div>
      <form id="guest-form" novalidate class="flex flex-col gap-4">
        <div>
          ${label('Full Name')}
          <input id="guest-name" type="text" autocomplete="name" placeholder="Your full name" class="${inp()}" />
          ${errEl('guest-name-err')}
        </div>
        <div>
          ${label('Phone Number')}
          <input id="guest-phone" type="tel" autocomplete="tel" placeholder="10-digit mobile number" class="${inp()} font-mono" />
          ${errEl('guest-phone-err')}
        </div>
        <div>
          ${label('Email (optional)')}
          <input id="guest-email" type="email" autocomplete="email" placeholder="you@example.com" class="${inp()}" />
        </div>
        ${serverErrEl('guest-server-err')}
        ${submitBtn('guest-submit', 'guest-btn-text', 'Continue as Guest')}
      </form>`;
  }

  function emailSentScreen() {
    return `
      <div class="text-center py-4">
        <div class="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
          <svg class="w-8 h-8 text-emerald-600 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="font-headline text-lg font-bold text-zinc-900 mb-2">Check your inbox!</h2>
        <p class="text-xs text-zinc-500 leading-relaxed mb-1">We've sent a verification link to</p>
        <p class="text-sm font-bold text-zinc-900 mb-4">${pendingEmail}</p>
        <p class="text-xs text-zinc-400 leading-relaxed mb-6">Click the link in the email to activate your account, then come back to sign in.</p>
        <button id="go-to-login" class="w-full py-3 rounded-full ${accentLight} ${accentHover} text-white text-xs font-bold uppercase font-headline tracking-wider cursor-pointer">
          Go to Sign In
        </button>
        <p class="text-[11px] text-zinc-400 mt-4">Didn't receive it? Check your spam folder or <button id="resend-email" class="underline ${accentText} cursor-pointer font-semibold">resend</button>.</p>
      </div>`;
  }

  function resetSentScreen() {
    return `
      <div class="text-center py-4">
        <div class="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-5">
          <svg class="w-8 h-8 text-blue-600 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="font-headline text-lg font-bold text-zinc-900 mb-2">Reset link sent!</h2>
        <p class="text-xs text-zinc-500 leading-relaxed mb-1">We've sent a password reset link to</p>
        <p class="text-sm font-bold text-zinc-900 mb-4">${pendingEmail}</p>
        <p class="text-xs text-zinc-400 leading-relaxed mb-6">Follow the link in the email to set a new password.</p>
        <button id="go-to-login" class="w-full py-3 rounded-full ${accentLight} ${accentHover} text-white text-xs font-bold uppercase font-headline tracking-wider cursor-pointer">
          Back to Sign In
        </button>
      </div>`;
  }

  function getCardContent() {
    switch (activeTab) {
      case 'login': return loginForm();
      case 'signup': return signupForm();
      case 'forgot': return forgotForm();
      case 'guest': return guestForm();
      case 'email-sent': return emailSentScreen();
      case 'reset-sent': return resetSentScreen();
      default: return loginForm();
    }
  }

  function showGuestButton() {
    return activeTab === 'login' || activeTab === 'signup';
  }

  function renderPage() {
    page.innerHTML = `
      <div class="w-full max-w-[420px]">
        <div class="text-center mb-8">
          <a href="#" class="font-headline font-extrabold text-3xl tracking-tighter text-zinc-950 no-underline">
            BEAR<span style="color:${accent}">.</span>
          </a>
          <p class="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-headline">
            ${isSow ? 'SOW · Athletic Luxury' : 'Performance Activewear'}
          </p>
        </div>

        ${tabBar()}

        <div class="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
          ${getCardContent()}
        </div>

        ${showGuestButton() ? `
          <div class="flex items-center gap-3 my-5">
            <div class="flex-1 h-px bg-zinc-200"></div>
            <span class="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">or</span>
            <div class="flex-1 h-px bg-zinc-200"></div>
          </div>
          <button id="guest-continue-btn" class="w-full py-3 rounded-full border border-zinc-300 text-zinc-700 hover:border-zinc-500 hover:text-black text-xs font-bold uppercase font-headline tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2">
            <svg class="w-4 h-4 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Continue as Guest
          </button>
          <p class="text-center text-[11px] text-zinc-400 mt-4 leading-relaxed">
            Guest accounts save orders and addresses on this device only.
          </p>
        ` : ''}
      </div>
    `;

    // Tab switching
    page.querySelector('#tab-login')?.addEventListener('click', () => { activeTab = 'login'; renderPage(); });
    page.querySelector('#tab-signup')?.addEventListener('click', () => { activeTab = 'signup'; renderPage(); });

    // Back buttons
    page.querySelector('#back-to-login')?.addEventListener('click', () => { activeTab = 'login'; renderPage(); });

    // Guest flow trigger
    page.querySelector('#guest-continue-btn')?.addEventListener('click', () => { activeTab = 'guest'; renderPage(); });

    // Forgot password trigger
    page.querySelector('#forgot-btn')?.addEventListener('click', () => { activeTab = 'forgot'; renderPage(); });

    // Go to login from success screens
    page.querySelector('#go-to-login')?.addEventListener('click', () => { activeTab = 'login'; renderPage(); });

    // Resend verification email
    page.querySelector('#resend-email')?.addEventListener('click', async () => {
      if (!pendingEmail) return;
      try {
        await supabaseSignUp(pendingEmail, '__resend__', '');
      } catch (_) { /* ignore */ }
      showToast('Verification email resent. Check your inbox.', 'info');
    });

    // LOGIN FORM
    page.querySelector('#login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = page.querySelector('#login-email').value.trim();
      const password = page.querySelector('#login-password').value;
      const serverErr = page.querySelector('#login-server-err');
      const btnText = page.querySelector('#login-btn-text');
      const submitBtn = page.querySelector('#login-submit');

      page.querySelector('#login-email-err').classList.add('hidden');
      page.querySelector('#login-pass-err').classList.add('hidden');
      serverErr.classList.add('hidden');

      let valid = true;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        page.querySelector('#login-email-err').textContent = 'Please enter a valid email address';
        page.querySelector('#login-email-err').classList.remove('hidden');
        shakeInput(page.querySelector('#login-email'));
        valid = false;
      }
      if (!password || password.length < 6) {
        page.querySelector('#login-pass-err').textContent = 'Password must be at least 6 characters';
        page.querySelector('#login-pass-err').classList.remove('hidden');
        shakeInput(page.querySelector('#login-password'));
        valid = false;
      }
      if (!valid) return;

      submitBtn.disabled = true;
      btnText.textContent = 'Signing In...';

      try {
        const session = await supabaseSignIn(email, password);
        set('bear_auth_session', session, TTL.SESSION);
        setSessionCookie(session.access_token?.slice(0, 32) || 'session');
        set('bear_auth_mode', 'authenticated');
        set('bear_user', {
          name: session.user?.user_metadata?.full_name || email.split('@')[0],
          email: session.user?.email || email,
          phone: session.user?.user_metadata?.phone || '',
          avatar: null,
          memberSince: new Date(session.user?.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
          bearPoints: 0,
        });
        showToast('Welcome back!', 'success');
        window.location.hash = '#account';
      } catch (err) {
        const msg = err.message || '';
        if (msg.toLowerCase().includes('email not confirmed')) {
          serverErr.textContent = 'Please verify your email first. Check your inbox for the confirmation link.';
        } else if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
          serverErr.textContent = 'Incorrect email or password. Please try again.';
        } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
          serverErr.textContent = 'Cannot connect. Check your internet or continue as Guest.';
        } else {
          serverErr.textContent = msg || 'Sign in failed. Please try again.';
        }
        serverErr.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        btnText.textContent = 'Sign In to Account';
      }
    });

    // SIGNUP FORM
    page.querySelector('#signup-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = page.querySelector('#signup-name').value.trim();
      const email = page.querySelector('#signup-email').value.trim();
      const phone = (page.querySelector('#signup-phone')?.value || '').trim();
      const password = page.querySelector('#signup-password').value;
      const serverErr = page.querySelector('#signup-server-err');
      const btnText = page.querySelector('#signup-btn-text');
      const submitBtn = page.querySelector('#signup-submit');

      ['#signup-name-err', '#signup-email-err', '#signup-phone-err', '#signup-pass-err'].forEach(s => {
        const el = page.querySelector(s);
        if (el) el.classList.add('hidden');
      });
      serverErr.classList.add('hidden');

      let valid = true;
      if (!name || name.length < 2) {
        page.querySelector('#signup-name-err').textContent = 'Please enter your full name';
        page.querySelector('#signup-name-err').classList.remove('hidden');
        valid = false;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        page.querySelector('#signup-email-err').textContent = 'Please enter a valid email address';
        page.querySelector('#signup-email-err').classList.remove('hidden');
        valid = false;
      }
      if (phone && !/^[0-9]{10}$/.test(phone)) {
        page.querySelector('#signup-phone-err').textContent = 'Mobile number must be exactly 10 digits';
        page.querySelector('#signup-phone-err').classList.remove('hidden');
        valid = false;
      }
      if (!password || password.length < 8) {
        page.querySelector('#signup-pass-err').textContent = 'Password must be at least 8 characters';
        page.querySelector('#signup-pass-err').classList.remove('hidden');
        valid = false;
      }
      if (!valid) return;

      submitBtn.disabled = true;
      btnText.textContent = 'Creating Account...';

      try {
        const result = await supabaseSignUp(email, password, name, phone || null);

        if (result.user && !result.session) {
          // Email confirmation required
          pendingEmail = email;
          // Store pending user info so after verification they have a name
          set('bear_pending_user', { name, email, phone: phone || '' });
          activeTab = 'email-sent';
          renderPage();
        } else if (result.session) {
          set('bear_auth_session', result.session, TTL.SESSION);
          setSessionCookie(result.session.access_token?.slice(0, 32) || 'session');
          set('bear_auth_mode', 'authenticated');
          set('bear_user', {
            name,
            email,
            phone: phone || '',
            avatar: null,
            memberSince: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
            bearPoints: 0,
          });
          showToast(`Welcome to BEAR, ${name.split(' ')[0]}!`, 'success');
          window.location.hash = '#account';
        }
      } catch (err) {
        const msg = err.message || '';
        if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
          serverErr.textContent = 'An account with this email already exists. Try signing in instead.';
        } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
          serverErr.textContent = 'Cannot connect. Check your internet or continue as Guest.';
        } else {
          serverErr.textContent = msg || 'Sign up failed. Please try again.';
        }
        serverErr.classList.remove('hidden');
        submitBtn.disabled = false;
        btnText.textContent = 'Create My Account';
      }
    });

    // FORGOT PASSWORD FORM
    page.querySelector('#forgot-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = page.querySelector('#forgot-email').value.trim();
      const serverErr = page.querySelector('#forgot-server-err');
      const btnText = page.querySelector('#forgot-btn-text');
      const submitBtn = page.querySelector('#forgot-submit');

      page.querySelector('#forgot-email-err').classList.add('hidden');
      serverErr.classList.add('hidden');

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        page.querySelector('#forgot-email-err').textContent = 'Please enter a valid email address';
        page.querySelector('#forgot-email-err').classList.remove('hidden');
        return;
      }

      submitBtn.disabled = true;
      btnText.textContent = 'Sending...';

      try {
        await supabaseForgotPassword(email);
        pendingEmail = email;
        activeTab = 'reset-sent';
        renderPage();
      } catch (err) {
        const msg = err.message || '';
        serverErr.textContent = msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')
          ? 'Cannot connect. Check your internet connection.'
          : msg || 'Failed to send reset email. Please try again.';
        serverErr.classList.remove('hidden');
        submitBtn.disabled = false;
        btnText.textContent = 'Send Reset Link';
      }
    });

    // GUEST FORM
    page.querySelector('#guest-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = page.querySelector('#guest-name').value.trim();
      const phone = page.querySelector('#guest-phone').value.trim();
      const email = page.querySelector('#guest-email').value.trim();

      page.querySelector('#guest-name-err').classList.add('hidden');
      page.querySelector('#guest-phone-err').classList.add('hidden');

      let valid = true;
      if (!name || name.length < 2) {
        page.querySelector('#guest-name-err').textContent = 'Please enter your name';
        page.querySelector('#guest-name-err').classList.remove('hidden');
        valid = false;
      }
      if (!phone || !/^\d{10}$/.test(phone)) {
        page.querySelector('#guest-phone-err').textContent = 'Please enter a valid 10-digit phone number';
        page.querySelector('#guest-phone-err').classList.remove('hidden');
        valid = false;
      }
      if (!valid) return;

      set('bear_auth_mode', 'guest');
      set('bear_user', {
        name,
        email: email || '',
        phone,
        avatar: null,
        memberSince: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        bearPoints: 0,
      });
      showToast(`Welcome, ${name.split(' ')[0]}!`, 'success');
      window.location.hash = '#account';
    });
  }

  renderPage();
  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };
