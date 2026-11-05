/**
 * BEAR Store — Cookie Consent Banner
 * Granular: Necessary (always) / Analytics / Marketing
 */

import { getConsent, setConsent } from '../services/cookieService.js';

export function mount(container) {
  if (getConsent()) return; // already decided

  let showPrefs = false;

  function render() {
    container.innerHTML = `
      <div id="cookie-banner" role="dialog" aria-label="Cookie preferences" class="
        fixed bottom-0 left-0 right-0 z-[9999]
        bg-white border-t border-zinc-200 shadow-2xl
        px-4 py-4 sm:px-6
        translate-y-full transition-transform duration-300 ease-out
      ">
        <div class="max-w-[900px] mx-auto">

          ${!showPrefs ? `
            <!-- Default banner -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
              <div class="flex-1">
                <p class="text-xs font-bold text-zinc-900 mb-0.5">🍪 We use cookies</p>
                <p class="text-[11px] text-zinc-500 leading-relaxed">
                  We use necessary cookies to keep the store working, and optional cookies to improve your experience.
                  <a href="#privacy" class="underline text-black font-semibold">Privacy Policy</a>
                </p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <button id="cookie-manage" class="px-4 py-2 rounded-full border border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:text-black text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors">
                  Manage
                </button>
                <button id="cookie-reject" class="px-4 py-2 rounded-full border border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:text-black text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors">
                  Reject All
                </button>
                <button id="cookie-accept" class="px-4 py-2 rounded-full bg-black text-white hover:bg-zinc-800 text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors">
                  Accept All
                </button>
              </div>
            </div>
          ` : `
            <!-- Preferences panel -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <p class="text-xs font-bold text-zinc-900">Cookie Preferences</p>
                <button id="cookie-prefs-back" class="text-[11px] text-zinc-500 hover:text-black cursor-pointer font-semibold">← Back</button>
              </div>
              <div class="space-y-3 mb-4">

                <!-- Necessary -->
                <div class="flex items-start justify-between gap-4 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                  <div>
                    <p class="text-[11px] font-bold text-zinc-900">Necessary <span class="text-zinc-400 font-normal">(always on)</span></p>
                    <p class="text-[10px] text-zinc-500 mt-0.5">Cart, session, auth — required for the store to function.</p>
                  </div>
                  <div class="w-9 h-5 rounded-full bg-black flex-shrink-0 mt-0.5 relative">
                    <div class="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"></div>
                  </div>
                </div>

                <!-- Analytics -->
                <div class="flex items-start justify-between gap-4 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                  <div>
                    <p class="text-[11px] font-bold text-zinc-900">Analytics</p>
                    <p class="text-[10px] text-zinc-500 mt-0.5">Helps us understand which pages and products are popular.</p>
                  </div>
                  <button id="toggle-analytics" role="switch" aria-checked="false" class="w-9 h-5 rounded-full bg-zinc-300 flex-shrink-0 mt-0.5 relative transition-colors cursor-pointer">
                    <div class="toggle-thumb absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"></div>
                  </button>
                </div>

                <!-- Marketing -->
                <div class="flex items-start justify-between gap-4 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                  <div>
                    <p class="text-[11px] font-bold text-zinc-900">Marketing</p>
                    <p class="text-[10px] text-zinc-500 mt-0.5">Personalised recommendations and retargeting ads.</p>
                  </div>
                  <button id="toggle-marketing" role="switch" aria-checked="false" class="w-9 h-5 rounded-full bg-zinc-300 flex-shrink-0 mt-0.5 relative transition-colors cursor-pointer">
                    <div class="toggle-thumb absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"></div>
                  </button>
                </div>

              </div>
              <div class="flex items-center gap-2 justify-end">
                <button id="cookie-save-prefs" class="px-5 py-2 rounded-full bg-black text-white hover:bg-zinc-800 text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors">
                  Save Preferences
                </button>
              </div>
            </div>
          `}

        </div>
      </div>
    `;

    const banner = container.querySelector('#cookie-banner');

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => banner.classList.replace('translate-y-full', 'translate-y-0'));
    });

    function dismiss() {
      banner.classList.replace('translate-y-0', 'translate-y-full');
      banner.addEventListener('transitionend', () => { container.innerHTML = ''; }, { once: true });
    }

    if (!showPrefs) {
      container.querySelector('#cookie-accept')?.addEventListener('click', () => {
        setConsent({ analytics: true, marketing: true });
        dismiss();
      });
      container.querySelector('#cookie-reject')?.addEventListener('click', () => {
        setConsent({ analytics: false, marketing: false });
        dismiss();
      });
      container.querySelector('#cookie-manage')?.addEventListener('click', () => {
        showPrefs = true;
        render();
      });
    } else {
      let analyticsOn = false;
      let marketingOn = false;

      function applyToggleState(btn, on) {
        btn.setAttribute('aria-checked', String(on));
        btn.classList.toggle('bg-black', on);
        btn.classList.toggle('bg-zinc-300', !on);
        const thumb = btn.querySelector('.toggle-thumb');
        thumb.style.transform = on ? 'translateX(16px)' : 'translateX(0)';
      }

      const analyticsBtn = container.querySelector('#toggle-analytics');
      const marketingBtn = container.querySelector('#toggle-marketing');

      analyticsBtn?.addEventListener('click', () => {
        analyticsOn = !analyticsOn;
        applyToggleState(analyticsBtn, analyticsOn);
      });
      marketingBtn?.addEventListener('click', () => {
        marketingOn = !marketingOn;
        applyToggleState(marketingBtn, marketingOn);
      });

      container.querySelector('#cookie-prefs-back')?.addEventListener('click', () => {
        showPrefs = false;
        render();
      });

      container.querySelector('#cookie-save-prefs')?.addEventListener('click', () => {
        setConsent({ analytics: analyticsOn, marketing: marketingOn });
        dismiss();
      });
    }
  }

  render();
}

export default { mount };
