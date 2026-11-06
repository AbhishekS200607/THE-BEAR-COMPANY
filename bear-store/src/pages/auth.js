/**
 * ============================================================================
 * BEAR Store — Customer Authentication & Email OTP Verification
 * ============================================================================
 * Vanilla JS + Vite implementation featuring:
 * - Customer Sign In with password
 * - Secure 2-Step Signup with 6-digit Email OTP Verification
 * - Guest Checkout continuation
 * - Password recovery flow
 * - 6-digit auto-advancing, paste-friendly OTP input interface
 * - Dynamic mode theming (BEAR Dark Industrial vs SOW Warm Terracotta)
 * - Strict client-side sanitization and error prevention
 */

import { getMode } from '../state/store.js';
import { showToast } from '../components/toast.js';
import { get, set, TTL } from '../utils/storage.js';
import { setSessionCookie } from '../services/cookieService.js';
import { shakeInput } from '../utils/animations.js';
import { API_V1 } from '../config/api.js';

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://flxccuowqflxtwtynvml.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_a97yBCvUiIhQOGxpnXG2MA_Z9OVx83s';

// ── Frontend API Helpers ───────────────────────────────────────────────────

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

async function requestSignupOtp(signupData) {
  const res = await fetch(`${API_V1}/auth/signup/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signupData),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    const err = new Error(json.error?.message || json.message || 'Unable to send verification code.');
    err.status = res.status;
    err.cooldownSeconds = json.error?.details?.cooldownSeconds;
    throw err;
  }
  return json.data || {};
}

async function verifySignupOtp(email, otp) {
  const res = await fetch(`${API_V1}/auth/signup/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    const err = new Error(json.error?.message || json.message || 'Verification failed.');
    err.status = res.status;
    err.attemptsRemaining = json.error?.details?.attemptsRemaining;
    throw err;
  }
  return json.data || {};
}

async function resendEmailOtp(email, purpose = 'verification') {
  const res = await fetch(`${API_V1}/auth/email-otp/resend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, purpose }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    const err = new Error(json.error?.message || json.message || 'Could not resend verification code.');
    err.cooldownSeconds = json.error?.details?.cooldownSeconds;
    throw err;
  }
  return json.data || {};
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

/**
 * Masks an email for privacy (e.g., "ab***@gmail.com")
 */
function maskEmailDisplay(email) {
  if (!email || !email.includes('@')) return email || '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user.slice(0, 2)}***@${domain}`;
}

// ── Auth Page Renderer ─────────────────────────────────────────────────────

export function render(container) {
  const mode = getMode();
  const isSow = mode === 'sow';
  const accent = isSow ? '#80534C' : '#09090b';
  const accentLight = isSow ? 'bg-[#80534C]' : 'bg-black';
  const accentHover = isSow ? 'hover:bg-[#6b4540]' : 'hover:bg-zinc-800';
  const accentText = isSow ? 'text-[#80534C]' : 'text-black';
  const focusBorder = isSow ? 'focus:border-[#80534C] focus:ring-[#80534C]' : 'focus:border-black focus:ring-black';

  // State: 'login' | 'signup' | 'verify-otp' | 'otp-verified' | 'forgot' | 'guest' | 'reset-sent'
  let activeTab = 'login';
  let pendingEmail = '';
  let pendingSignup = null; // Temporarily holds signup fields in memory while verifying OTP
  let resendSeconds = 0;
  let resendTimer = null;
  let isVerifyingOtp = false;

  function clearResendTimer() {
    if (resendTimer) {
      clearInterval(resendTimer);
      resendTimer = null;
    }
  }

  function startResendTimer(seconds = 60) {
    clearResendTimer();
    resendSeconds = seconds;
    updateResendUi();

    resendTimer = setInterval(() => {
      resendSeconds = Math.max(0, resendSeconds - 1);
      updateResendUi();
      if (resendSeconds === 0) {
        clearResendTimer();
      }
    }, 1000);
  }

  function updateResendUi() {
    const countdownEl = page.querySelector('#otp-resend-countdown');
    const resendBtn = page.querySelector('#otp-resend-btn');

    if (countdownEl && resendBtn) {
      if (resendSeconds > 0) {
        countdownEl.classList.remove('hidden');
        countdownEl.textContent = `Resend code in 00:${String(resendSeconds).padStart(2, '0')}`;
        resendBtn.classList.add('hidden');
        resendBtn.disabled = true;
      } else {
        countdownEl.classList.add('hidden');
        resendBtn.classList.remove('hidden');
        resendBtn.disabled = false;
        resendBtn.textContent = "Didn't receive it? Resend code";
      }
    }
  }

  const page = document.createElement('div');
  page.className = 'w-full min-h-screen flex flex-col items-center justify-center pt-20 pb-32 px-4';

  function inp(cls = '') {
    return `w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none ${focusBorder} transition-colors ${cls}`;
  }
  function label(text) {
    return `<label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 font-headline">${text}</label>`;
  }
  function errEl(id) {
    return `<p id="${id}" class="text-[11px] text-red-600 mt-1 hidden"></p>`;
  }
  function serverErrEl(id) {
    return `<div id="${id}" class="hidden text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 leading-relaxed"></div>`;
  }
  function submitBtn(id, textId, text, extraClass = '') {
    return `<button type="submit" id="${id}" class="w-full py-3 rounded-full ${accentLight} ${accentHover} text-white text-xs font-bold uppercase font-headline tracking-wider transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 ${extraClass}">
      <span id="${textId}">${text}</span>
    </button>`;
  }

  function tabBar() {
    if (activeTab === 'forgot' || activeTab === 'guest' || activeTab === 'verify-otp' || activeTab === 'otp-verified' || activeTab === 'reset-sent') {
      return '';
    }
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
    const defaultName = pendingSignup?.fullName || ((guestUser?.name && guestUser.name !== 'Guest') ? guestUser.name : '');
    const defaultPhone = pendingSignup?.phoneNumber || guestUser?.phone || '';
    const defaultEmail = pendingSignup?.email || '';

    return `
      <form id="signup-form" novalidate class="flex flex-col gap-4">
        <div>
          ${label('Full Name')}
          <input id="signup-name" type="text" autocomplete="name" placeholder="Your full name" value="${defaultName}" class="${inp()}" />
          ${errEl('signup-name-err')}
        </div>
        <div>
          ${label('Email Address')}
          <input id="signup-email" type="email" autocomplete="email" placeholder="you@example.com" value="${defaultEmail}" class="${inp()}" />
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
          <input id="signup-password" type="password" autocomplete="new-password" placeholder="Min. 8 characters" value="${pendingSignup?.password || ''}" class="${inp()}" />
          ${errEl('signup-pass-err')}
        </div>
        ${serverErrEl('signup-server-err')}
        ${submitBtn('signup-submit', 'signup-btn-text', 'Verify Email & Create Account')}
        <p class="text-[10px] text-zinc-400 text-center leading-relaxed">
          By signing up, you will receive a 6-digit verification code to confirm your email address.
        </p>
      </form>`;
  }

  /**
   * Premium 6-Digit Email-OTP Verification Interface
   */
  function otpVerificationScreen() {
    const masked = maskEmailDisplay(pendingEmail);

    return `
      <div class="text-center py-1">
        <!-- Back Button (Preserves form data) -->
        <div class="flex items-center justify-start mb-4">
          <button id="otp-back-btn" type="button" class="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-black transition-colors cursor-pointer font-headline uppercase tracking-wider">
            <svg class="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Edit Details
          </button>
        </div>

        <!-- Outlined Minimal SVG Header Icon: Envelope + Security Shield -->
        <div class="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center mx-auto mb-4 shadow-2xs">
          <svg class="w-8 h-8 ${accentText}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.6" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 3l3.5 2v3.5c0 3-2 5.5-3.5 6.5-1.5-1-3.5-3.5-3.5-6.5V5L16 3z" />
          </svg>
        </div>

        <!-- Heading & Masked Email -->
        <h2 class="font-headline text-xl font-extrabold text-zinc-950 uppercase tracking-tight mb-1.5">
          Verify your email
        </h2>
        <p class="text-xs text-zinc-500 leading-relaxed">
          We sent a six-digit verification code to:
        </p>
        <p class="text-xs sm:text-sm font-bold font-mono text-zinc-900 mt-0.5 mb-6 bg-zinc-100/80 py-1 px-3 rounded-full inline-block">
          ${masked}
        </p>

        <!-- 6-Digit OTP Form -->
        <form id="otp-form" novalidate class="flex flex-col gap-5">
          <div>
            <div class="flex justify-center gap-2 sm:gap-2.5" id="otp-inputs">
              ${Array.from({ length: 6 }, (_, index) => `
                <input 
                  type="text"
                  aria-label="Verification digit ${index + 1} of 6"
                  data-otp-index="${index}" 
                  inputmode="numeric" 
                  pattern="[0-9]*" 
                  maxlength="1" 
                  autocomplete="one-time-code"
                  class="otp-digit w-10 sm:w-11 h-12 sm:h-14 text-center font-headline text-lg sm:text-xl font-extrabold rounded-xl border border-zinc-200 text-zinc-950 bg-white focus:outline-none focus:ring-2 ${focusBorder} transition-all shadow-2xs" 
                />
              `).join('')}
            </div>

            <!-- Server Error Notification Card -->
            <div id="otp-server-err" class="hidden text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 mt-4 text-left leading-relaxed"></div>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            id="otp-verify-submit" 
            disabled 
            class="w-full py-3.5 rounded-full ${accentLight} ${accentHover} text-white text-xs font-bold uppercase font-headline tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span id="otp-verify-btn-text">Verify &amp; Create Account</span>
          </button>
        </form>

        <!-- Resend Section with 60s Live Countdown -->
        <div class="mt-5 pt-4 border-t border-zinc-100 flex flex-col items-center justify-center min-h-[36px]">
          <p id="otp-resend-countdown" class="text-xs text-zinc-400 font-mono font-medium">
            Resend code in 01:00
          </p>
          <button 
            id="otp-resend-btn" 
            type="button" 
            class="hidden text-xs ${accentText} font-bold underline hover:opacity-80 transition-opacity cursor-pointer font-headline uppercase tracking-wider"
          >
            Didn't receive it? Resend code
          </button>
        </div>

        <!-- Security Guidance Help Text -->
        <p class="text-[11px] text-zinc-400 leading-relaxed mt-4 max-w-xs mx-auto">
          Check your spam or promotions folder. Never share this code with anyone.
        </p>
      </div>`;
  }

  /**
   * Green Animated Success State
   */
  function otpVerifiedScreen() {
    return `
      <div class="text-center py-6">
        <div class="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4 animate-bounce">
          <svg class="w-8 h-8 text-emerald-600 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h2 class="font-headline text-lg font-bold text-zinc-950 uppercase tracking-tight mb-2">
          Email Verified
        </h2>
        <p class="text-xs text-zinc-500 leading-relaxed mb-6 font-medium">
          Creating your account &amp; logging you in...
        </p>
        <div class="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mx-auto"></div>
      </div>`;
  }

  function forgotForm() {
    return `
      <div class="mb-5">
        <button id="back-to-login" class="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-black cursor-pointer font-headline uppercase tracking-wider">
          <svg class="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Back to Sign In
        </button>
        <h2 class="font-headline text-base font-bold text-zinc-900 mt-3">Reset your password</h2>
        <p class="text-xs text-zinc-500 mt-1">Enter your email and we'll send you a password reset link.</p>
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
        <button id="back-to-login" class="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-black cursor-pointer font-headline uppercase tracking-wider">
          <svg class="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Back
        </button>
        <h2 class="font-headline text-base font-bold text-zinc-900 mt-3">Continue as Guest</h2>
        <p class="text-xs text-zinc-500 mt-1">Your orders and addresses will be saved locally on this device.</p>
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
      case 'verify-otp': return otpVerificationScreen();
      case 'otp-verified': return otpVerifiedScreen();
      case 'forgot': return forgotForm();
      case 'guest': return guestForm();
      case 'reset-sent': return resetSentScreen();
      default: return loginForm();
    }
  }

  function showGuestButton() {
    return activeTab === 'login' || activeTab === 'signup';
  }

  function renderPage() {
    clearResendTimer();
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

    // ── Tab Switching ──────────────────────────────────────────────────────
    page.querySelector('#tab-login')?.addEventListener('click', () => { activeTab = 'login'; renderPage(); });
    page.querySelector('#tab-signup')?.addEventListener('click', () => { activeTab = 'signup'; renderPage(); });

    // ── Navigation Buttons ─────────────────────────────────────────────────
    page.querySelector('#back-to-login')?.addEventListener('click', () => { activeTab = 'login'; renderPage(); });
    page.querySelector('#otp-back-btn')?.addEventListener('click', () => { activeTab = 'signup'; renderPage(); });
    page.querySelector('#guest-continue-btn')?.addEventListener('click', () => { activeTab = 'guest'; renderPage(); });
    page.querySelector('#forgot-btn')?.addEventListener('click', () => { activeTab = 'forgot'; renderPage(); });
    page.querySelector('#go-to-login')?.addEventListener('click', () => { activeTab = 'login'; renderPage(); });

    // ── OTP VERIFICATION LOGIC ─────────────────────────────────────────────
    if (activeTab === 'verify-otp') {
      startResendTimer(60);
      const otpInputs = Array.from(page.querySelectorAll('.otp-digit'));
      const verifyBtn = page.querySelector('#otp-verify-submit');
      const verifyText = page.querySelector('#otp-verify-btn-text');
      const otpError = page.querySelector('#otp-server-err');
      const resendBtn = page.querySelector('#otp-resend-btn');

      const getOtp = () => otpInputs.map((input) => input.value).join('');
      const updateVerifyState = () => {
        const fullOtp = getOtp();
        verifyBtn.disabled = fullOtp.length !== 6 || isVerifyingOtp;
      };

      // Auto-focus first input cell
      setTimeout(() => {
        otpInputs[0]?.focus();
      }, 100);

      otpInputs.forEach((input, index) => {
        // Numeric input only + Auto-advance to next cell
        input.addEventListener('input', (e) => {
          const val = input.value.replace(/\D/g, '');
          input.value = val ? val.slice(-1) : '';

          if (input.value && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
          }

          otpError.classList.add('hidden');
          updateVerifyState();
        });

        // Backspace navigation to previous cell
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace') {
            if (!input.value && index > 0) {
              otpInputs[index - 1].focus();
              otpInputs[index - 1].value = '';
              updateVerifyState();
            }
          } else if (e.key === 'ArrowLeft' && index > 0) {
            otpInputs[index - 1].focus();
          } else if (e.key === 'ArrowRight' && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
          }
        });

        // Paste support (6 digits into any cell)
        input.addEventListener('paste', (e) => {
          e.preventDefault();
          const pastedData = (e.clipboardData || window.clipboardData)?.getData('text') || '';
          const digits = pastedData.replace(/\D/g, '').slice(0, 6);
          if (!digits) return;

          digits.split('').forEach((digit, i) => {
            if (otpInputs[i]) {
              otpInputs[i].value = digit;
            }
          });

          const nextIndex = Math.min(digits.length, 5);
          otpInputs[nextIndex]?.focus();
          otpError.classList.add('hidden');
          updateVerifyState();
        });
      });

      // OTP Verification Submission
      page.querySelector('#otp-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const otp = getOtp();
        if (otp.length !== 6 || isVerifyingOtp) return;

        isVerifyingOtp = true;
        verifyBtn.disabled = true;
        verifyText.textContent = 'Verifying...';
        otpError.classList.add('hidden');

        try {
          // Verify code and complete account activation atomically on backend
          const result = await verifySignupOtp(pendingEmail, otp);

          // Success: Display animated confirmation screen
          activeTab = 'otp-verified';
          renderPage();

          // Persist session if returned from backend
          if (result.session) {
            set('bear_auth_session', result.session, TTL.SESSION);
            setSessionCookie(result.session.access_token?.slice(0, 32) || 'session');
          }
          if (result.user) {
            set('bear_auth_mode', 'authenticated');
            set('bear_user', {
              name: result.user.user_metadata?.full_name || pendingSignup?.fullName || pendingEmail.split('@')[0],
              email: result.user.email || pendingEmail,
              phone: result.user.user_metadata?.phone || pendingSignup?.phoneNumber || '',
              avatar: null,
              memberSince: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
              bearPoints: 50, // Welcome bonus
            });
          }

          // Clear temporary pending signup from memory
          pendingSignup = null;

          showToast('Welcome to BEAR! Your account is active.', 'success');

          // Smooth redirect to account page
          setTimeout(() => {
            window.location.hash = '#account';
          }, 1200);
        } catch (err) {
          isVerifyingOtp = false;
          verifyBtn.disabled = false;
          verifyText.textContent = 'Verify & Create Account';

          const msg = err.message || '';
          if (msg.toLowerCase().includes('expired')) {
            otpError.textContent = 'Your verification code has expired. Please request a new one below.';
          } else if (msg.toLowerCase().includes('attempts') || msg.toLowerCase().includes('invalid')) {
            otpError.textContent = msg;
          } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
            otpError.textContent = 'Network error. Please check your internet connection.';
          } else {
            otpError.textContent = msg || 'Invalid verification code. Please check and try again.';
          }

          otpError.classList.remove('hidden');
          shakeInput(page.querySelector('#otp-inputs'));
        }
      });

      // Resend OTP trigger
      resendBtn?.addEventListener('click', async () => {
        if (resendSeconds > 0) return;
        resendBtn.disabled = true;
        resendBtn.textContent = 'Sending...';

        try {
          await resendEmailOtp(pendingEmail, 'verification');
          showToast(`New verification code sent to ${maskEmailDisplay(pendingEmail)}`, 'success');
          startResendTimer(60);
        } catch (err) {
          showToast(err.message || 'Could not resend code. Please try again.', 'error');
          resendBtn.disabled = false;
          resendBtn.textContent = "Didn't receive it? Resend code";
        }
      });
    }

    // ── LOGIN FORM SUBMISSION ──────────────────────────────────────────────
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
          serverErr.textContent = 'Please verify your email first. Request an OTP on the signup tab.';
        } else if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
          serverErr.textContent = 'Incorrect email or password. Please try again.';
        } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
          serverErr.textContent = 'Cannot connect. Check your internet connection or continue as Guest.';
        } else {
          serverErr.textContent = msg || 'Sign in failed. Please try again.';
        }
        serverErr.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        btnText.textContent = 'Sign In to Account';
      }
    });

    // ── SIGNUP FORM SUBMISSION (Requests OTP without creating account yet) ──
    page.querySelector('#signup-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = page.querySelector('#signup-name').value.trim();
      const email = page.querySelector('#signup-email').value.trim();
      const phone = (page.querySelector('#signup-phone')?.value || '').trim();
      const password = page.querySelector('#signup-password').value;
      const serverErr = page.querySelector('#signup-server-err');
      const btnText = page.querySelector('#signup-btn-text');
      const submitBtn = page.querySelector('#signup-submit');

      ['#signup-name-err', '#signup-email-err', '#signup-phone-err', '#signup-pass-err'].forEach((s) => {
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
      btnText.textContent = 'Sending Code...';

      try {
        // Request OTP with encrypted pending signup on backend
        await requestSignupOtp({
          email,
          password,
          fullName: name,
          phoneNumber: phone || null,
        });

        // Store signup details temporarily in memory for edit button fallback
        pendingSignup = { fullName: name, email, phoneNumber: phone || '', password };
        pendingEmail = email;

        // Transition smoothly to OTP verification screen
        activeTab = 'verify-otp';
        renderPage();
      } catch (err) {
        const msg = err.message || '';
        if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
          serverErr.textContent = 'An account with this email already exists. Try signing in instead.';
        } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
          serverErr.textContent = 'Cannot connect to server. Check your connection or continue as Guest.';
        } else {
          serverErr.textContent = msg || 'Could not send verification code. Please try again.';
        }
        serverErr.classList.remove('hidden');
        submitBtn.disabled = false;
        btnText.textContent = 'Verify Email & Create Account';
      }
    });

    // ── FORGOT PASSWORD SUBMISSION ─────────────────────────────────────────
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
        serverErr.textContent = err.message || 'Failed to send reset link';
        serverErr.classList.remove('hidden');
        submitBtn.disabled = false;
        btnText.textContent = 'Send Reset Link';
      }
    });

    // ── GUEST SIGN IN SUBMISSION ───────────────────────────────────────────
    page.querySelector('#guest-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = page.querySelector('#guest-name').value.trim();
      const phone = page.querySelector('#guest-phone').value.trim();
      const email = (page.querySelector('#guest-email')?.value || '').trim();

      page.querySelector('#guest-name-err').classList.add('hidden');
      page.querySelector('#guest-phone-err').classList.add('hidden');

      let valid = true;
      if (!name || name.length < 2) {
        page.querySelector('#guest-name-err').textContent = 'Please enter your full name';
        page.querySelector('#guest-name-err').classList.remove('hidden');
        valid = false;
      }
      if (!phone || !/^[0-9]{10}$/.test(phone)) {
        page.querySelector('#guest-phone-err').textContent = 'Phone number must be a 10-digit mobile number';
        page.querySelector('#guest-phone-err').classList.remove('hidden');
        valid = false;
      }
      if (!valid) return;

      set('bear_auth_mode', 'guest');
      set('bear_user', {
        name,
        email: email || `${phone}@guest.bear.in`,
        phone,
        avatar: null,
        memberSince: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        bearPoints: 0,
      });

      showToast('Continuing as Guest', 'info');
      window.location.hash = '#checkout';
    });
  }

  // Initial render
  renderPage();

  container.innerHTML = '';
  container.appendChild(page);

  // Cleanup timers when navigating away
  return () => {
    clearResendTimer();
  };
}

export default { render };
