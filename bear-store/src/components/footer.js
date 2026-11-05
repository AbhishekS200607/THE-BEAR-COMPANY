import { getMode, setMode, subscribe } from '../state/store.js';

/**
 * Mobile Collapsible Accordion State
 * Remembers open/closed sections across re-renders
 */
const accordionState = {
  silhouettes: false,
  care: false,
  discipline: false,
  connect: false,
};

export function mount(container) {
  const footer = document.createElement('footer');
  footer.setAttribute('data-purpose', 'site-footer');

  function renderFooter() {
    const mode = getMode();
    const isSow = mode === 'sow';
    const currentYear = new Date().getFullYear();

    // Theme tokens
    const bgClass = isSow ? 'bg-[#FAF7F5]' : 'bg-white';
    const borderClass = isSow ? 'border-[#EFE7DF]' : 'border-zinc-200';
    const dividerClass = isSow ? 'border-[#EFE7DF]' : 'border-zinc-100';
    const headingClass = isSow ? 'text-[#32120E]' : 'text-zinc-950';
    const textMutedClass = isSow ? 'text-[#7D6B65]' : 'text-zinc-500';
    const hoverTextClass = isSow ? 'hover:text-[#80534C]' : 'hover:text-black';
    const dotClass = isSow ? 'text-[#80534C]' : 'text-black';
    const badgeBgClass = isSow ? 'bg-[#FDFBF9] border-[#E8DFD8] text-[#332923]' : 'bg-white border-zinc-200 text-zinc-800';
    const iconBtnClass = isSow ? 'border-[#E5DDD7] text-[#653C36] hover:border-[#80534C] hover:text-[#80534C]' : 'border-zinc-200 text-zinc-700 hover:border-black hover:text-black';

    footer.className = `w-full ${bgClass} border-t ${borderClass} mt-16 md:mt-24 ${textMutedClass} font-sans transition-colors duration-300`;

    footer.innerHTML = `
      <div class="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 pt-10 sm:pt-14 pb-[max(8rem,env(safe-area-inset-bottom))] md:pb-12">
        <!-- Top Brand Identity Row -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 mb-8 border-b ${dividerClass}">
          <div>
            <a href="#" class="font-headline font-extrabold text-2xl tracking-tighter ${headingClass} inline-flex items-center gap-0.5 no-underline focus-visible:outline-2" aria-label="BEAR Home">
              BEAR<span class="${dotClass}">.</span>
            </a>
            <p class="text-xs ${textMutedClass} mt-1">Dual-identity performance engineering. Designed and crafted in India.</p>
          </div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold border ${badgeBgClass} w-fit">
            <span>🇮🇳</span>
            <span>INDIA · INR (₹)</span>
          </div>
        </div>

        <!-- Four Main Sections: Collapsible on Mobile, 4 Expanded Columns on Desktop -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-0 md:gap-8 lg:gap-12 pb-10 border-b ${dividerClass}">
          
          <!-- SECTION 1: SILHOUETTES -->
          <div class="border-b ${dividerClass} md:border-b-0">
            <button 
              type="button" 
              class="footer-accordion-btn w-full py-3.5 md:py-0 flex items-center justify-between text-left cursor-pointer md:cursor-default focus-visible:outline-2" 
              data-target="silhouettes" 
              aria-expanded="${accordionState.silhouettes ? 'true' : 'false'}"
              aria-controls="accordion-silhouettes"
            >
              <h3 class="font-headline text-xs font-bold uppercase tracking-wider ${headingClass}">SILHOUETTES</h3>
              <span class="material-symbols-outlined text-[20px] ${textMutedClass} transition-transform duration-200 md:hidden accordion-chevron ${accordionState.silhouettes ? 'rotate-180' : ''}">expand_more</span>
            </button>
            <div id="accordion-silhouettes" class="${accordionState.silhouettes ? 'block' : 'hidden'} md:block pt-2 md:pt-3 pb-4 md:pb-0">
              <ul class="flex flex-col space-y-2.5 text-xs">
                <li>
                  <button type="button" class="footer-mode-btn text-left ${textMutedClass} ${hoverTextClass} transition-colors cursor-pointer focus-visible:outline-2" data-mode="bear">
                    BEAR (Men's Active)
                  </button>
                </li>
                <li>
                  <button type="button" class="footer-mode-btn text-left ${textMutedClass} ${hoverTextClass} transition-colors cursor-pointer focus-visible:outline-2" data-mode="sow">
                    SOW (Women's Movement)
                  </button>
                </li>
                <li><a href="#collection" class="${textMutedClass} ${hoverTextClass} transition-colors block no-underline focus-visible:outline-2">All Products</a></li>
                <li><a href="#collection" class="${textMutedClass} ${hoverTextClass} transition-colors block no-underline focus-visible:outline-2">New Arrivals</a></li>
                <li><a href="#collection" class="${textMutedClass} ${hoverTextClass} transition-colors block no-underline focus-visible:outline-2">Best Sellers</a></li>
              </ul>
            </div>
          </div>

          <!-- SECTION 2: CUSTOMER CARE -->
          <div class="border-b ${dividerClass} md:border-b-0">
            <button 
              type="button" 
              class="footer-accordion-btn w-full py-3.5 md:py-0 flex items-center justify-between text-left cursor-pointer md:cursor-default focus-visible:outline-2" 
              data-target="care" 
              aria-expanded="${accordionState.care ? 'true' : 'false'}"
              aria-controls="accordion-care"
            >
              <h3 class="font-headline text-xs font-bold uppercase tracking-wider ${headingClass}">CUSTOMER CARE</h3>
              <span class="material-symbols-outlined text-[20px] ${textMutedClass} transition-transform duration-200 md:hidden accordion-chevron ${accordionState.care ? 'rotate-180' : ''}">expand_more</span>
            </button>
            <div id="accordion-care" class="${accordionState.care ? 'block' : 'hidden'} md:block pt-2 md:pt-3 pb-4 md:pb-0">
              <ul class="flex flex-col space-y-2.5 text-xs">
                <li><a href="#track-order" class="${textMutedClass} ${hoverTextClass} transition-colors block no-underline focus-visible:outline-2">PIN &amp; Order Tracking</a></li>
                <li><a href="#faq" class="${textMutedClass} ${hoverTextClass} transition-colors block no-underline focus-visible:outline-2">Frequently Asked Questions</a></li>
                <li><a href="#contact" class="${textMutedClass} ${hoverTextClass} transition-colors block no-underline focus-visible:outline-2">Contact Us</a></li>
                <li><a href="#shipping" class="${textMutedClass} ${hoverTextClass} transition-colors block no-underline focus-visible:outline-2">Shipping &amp; Transit Times</a></li>
                <li><a href="#returns" class="${textMutedClass} ${hoverTextClass} transition-colors block no-underline focus-visible:outline-2">Returns &amp; Exchange</a></li>
                <li><a href="#size-guide" class="${textMutedClass} ${hoverTextClass} transition-colors block no-underline focus-visible:outline-2">Size Guide</a></li>
              </ul>
            </div>
          </div>

          <!-- SECTION 3: DISCIPLINE -->
          <div class="border-b ${dividerClass} md:border-b-0">
            <button 
              type="button" 
              class="footer-accordion-btn w-full py-3.5 md:py-0 flex items-center justify-between text-left cursor-pointer md:cursor-default focus-visible:outline-2" 
              data-target="discipline" 
              aria-expanded="${accordionState.discipline ? 'true' : 'false'}"
              aria-controls="accordion-discipline"
            >
              <h3 class="font-headline text-xs font-bold uppercase tracking-wider ${headingClass}">DISCIPLINE</h3>
              <span class="material-symbols-outlined text-[20px] ${textMutedClass} transition-transform duration-200 md:hidden accordion-chevron ${accordionState.discipline ? 'rotate-180' : ''}">expand_more</span>
            </button>
            <div id="accordion-discipline" class="${accordionState.discipline ? 'block' : 'hidden'} md:block pt-2 md:pt-3 pb-4 md:pb-0">
              <ul class="flex flex-col space-y-2.5 text-xs">
                <li><a href="#manifesto" class="${textMutedClass} ${hoverTextClass} transition-colors block no-underline focus-visible:outline-2">Discipline Manifesto</a></li>
                <li><a href="#manifesto" class="${textMutedClass} ${hoverTextClass} transition-colors block no-underline focus-visible:outline-2">Our Story</a></li>
                <li><a href="#textiles" class="${textMutedClass} ${hoverTextClass} transition-colors block no-underline focus-visible:outline-2">Technical Textiles</a></li>
                <li><a href="#ethical-production" class="${textMutedClass} ${hoverTextClass} transition-colors block no-underline focus-visible:outline-2">Ethical Production</a></li>
                <li><a href="#athletes" class="${textMutedClass} ${hoverTextClass} transition-colors block no-underline focus-visible:outline-2">BEAR Athlete Club</a></li>
              </ul>
            </div>
          </div>

          <!-- SECTION 4: CONNECT -->
          <div class="md:border-b-0">
            <button 
              type="button" 
              class="footer-accordion-btn w-full py-3.5 md:py-0 flex items-center justify-between text-left cursor-pointer md:cursor-default focus-visible:outline-2" 
              data-target="connect" 
              aria-expanded="${accordionState.connect ? 'true' : 'false'}"
              aria-controls="accordion-connect"
            >
              <h3 class="font-headline text-xs font-bold uppercase tracking-wider ${headingClass}">CONNECT</h3>
              <span class="material-symbols-outlined text-[20px] ${textMutedClass} transition-transform duration-200 md:hidden accordion-chevron ${accordionState.connect ? 'rotate-180' : ''}">expand_more</span>
            </button>
            <div id="accordion-connect" class="${accordionState.connect ? 'block' : 'hidden'} md:block pt-2 md:pt-3 pb-4 md:pb-0">
              <ul class="flex flex-col space-y-2.5 text-xs mb-4">
                <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="${textMutedClass} ${hoverTextClass} transition-colors block no-underline focus-visible:outline-2">Instagram</a></li>
                <li><a href="https://youtube.com" target="_blank" rel="noopener noreferrer" class="${textMutedClass} ${hoverTextClass} transition-colors block no-underline focus-visible:outline-2">YouTube</a></li>
                <li><a href="https://wa.me/919605210198" target="_blank" rel="noopener noreferrer" class="${textMutedClass} ${hoverTextClass} transition-colors block no-underline focus-visible:outline-2">WhatsApp Support</a></li>
                <li><a href="mailto:support@bearperformance.in" class="${textMutedClass} ${hoverTextClass} transition-colors block break-all no-underline focus-visible:outline-2">Email Support</a></li>
              </ul>

              <!-- Minimal Social Icons (Instagram, YouTube, WhatsApp, X) -->
              <div class="flex items-center gap-2 pt-1">
                <!-- Instagram -->
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="w-7 h-7 rounded-full border ${iconBtnClass} flex items-center justify-center transition-colors focus-visible:outline-2" aria-label="Instagram">
                  <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>

                <!-- YouTube -->
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" class="w-7 h-7 rounded-full border ${iconBtnClass} flex items-center justify-center transition-colors focus-visible:outline-2" aria-label="YouTube">
                  <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>

                <!-- WhatsApp -->
                <a href="https://wa.me/919605210198" target="_blank" rel="noopener noreferrer" class="w-7 h-7 rounded-full border ${iconBtnClass} flex items-center justify-center transition-colors focus-visible:outline-2" aria-label="WhatsApp">
                  <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </a>

                <!-- X (Twitter) -->
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" class="w-7 h-7 rounded-full border ${iconBtnClass} flex items-center justify-center transition-colors focus-visible:outline-2" aria-label="X (Twitter)">
                  <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

        </div>

        <!-- SECTION: SECURE PAYMENTS -->
        <div class="py-8 border-b ${dividerClass}">
          <h3 class="font-headline text-xs font-bold uppercase tracking-wider ${headingClass} mb-3.5">SECURE PAYMENTS</h3>
          
          <!-- Compact, Consistent Payment Badges -->
          <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3">
            <span class="px-2.5 py-1 text-[11px] font-bold font-headline border rounded-none sm:rounded-sm ${badgeBgClass}">UPI</span>
            <span class="px-2.5 py-1 text-[11px] font-bold font-headline border rounded-none sm:rounded-sm ${badgeBgClass}">Google Pay</span>
            <span class="px-2.5 py-1 text-[11px] font-bold font-headline border rounded-none sm:rounded-sm ${badgeBgClass}">PhonePe</span>
            <span class="px-2.5 py-1 text-[11px] font-bold font-headline border rounded-none sm:rounded-sm ${badgeBgClass}">Paytm</span>
            <span class="px-2.5 py-1 text-[11px] font-bold font-headline border rounded-none sm:rounded-sm ${badgeBgClass}">Visa</span>
            <span class="px-2.5 py-1 text-[11px] font-bold font-headline border rounded-none sm:rounded-sm ${badgeBgClass}">Mastercard</span>
            <span class="px-2.5 py-1 text-[11px] font-bold font-headline border rounded-none sm:rounded-sm ${badgeBgClass}">RuPay</span>
            <span class="px-2.5 py-1 text-[11px] font-bold font-headline border rounded-none sm:rounded-sm ${badgeBgClass}">Cash on Delivery</span>
          </div>

          <!-- Security Statement with Shield Icon -->
          <div class="flex items-center gap-1.5 text-xs ${textMutedClass}">
            <span class="material-symbols-outlined text-[15px] ${isSow ? 'text-[#80534C]' : 'text-zinc-600'}">shield</span>
            <span>Secure checkout · Encrypted payment processing</span>
          </div>
        </div>

        <!-- SECTION: COPYRIGHT AND LEGAL -->
        <div class="pt-6 sm:pt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs ${textMutedClass}">
          <p>© ${currentYear} BEAR Performance Wear Pvt. Ltd. All rights reserved.</p>

          <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <a href="#privacy" class="${textMutedClass} ${hoverTextClass} transition-colors no-underline focus-visible:outline-2">Privacy Policy</a>
            <span class="opacity-40">·</span>
            <a href="#terms" class="${textMutedClass} ${hoverTextClass} transition-colors no-underline focus-visible:outline-2">Terms of Service</a>
            <span class="opacity-40">·</span>
            <a href="#shipping" class="${textMutedClass} ${hoverTextClass} transition-colors no-underline focus-visible:outline-2">Shipping Policy</a>
            <span class="opacity-40">·</span>
            <a href="#returns" class="${textMutedClass} ${hoverTextClass} transition-colors no-underline focus-visible:outline-2">Return &amp; Refund Policy</a>
            <span class="opacity-40">·</span>
            <a href="#returns" class="${textMutedClass} ${hoverTextClass} transition-colors no-underline focus-visible:outline-2">Cancellation Policy</a>
            <span class="opacity-40">·</span>
            <a href="#admin" class="${textMutedClass} hover:text-zinc-400 transition-colors no-underline focus-visible:outline-2 opacity-40 hover:opacity-70 text-[10px]">Admin</a>
          </div>
        </div>

      </div>
    `;

    // Mode Switch Click Listeners
    footer.querySelectorAll('.footer-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetMode = btn.dataset.mode;
        if (targetMode) {
          setMode(targetMode);
          window.location.hash = '#collection';
        }
      });
    });

    // Mobile Accordion Click Listeners (Keyboard + Touch accessible)
    footer.querySelectorAll('.footer-accordion-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        // Only run on mobile (< 768px)
        if (window.innerWidth >= 768) return;

        const targetKey = btn.dataset.target;
        if (!targetKey) return;

        // Toggle state
        accordionState[targetKey] = !accordionState[targetKey];
        const isOpen = accordionState[targetKey];

        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        const content = footer.querySelector(`#accordion-${targetKey}`);
        const chevron = btn.querySelector('.accordion-chevron');

        if (content) {
          if (isOpen) {
            content.classList.remove('hidden');
          } else {
            content.classList.add('hidden');
          }
        }

        if (chevron) {
          if (isOpen) {
            chevron.classList.add('rotate-180');
          } else {
            chevron.classList.remove('rotate-180');
          }
        }
      });
    });
  }

  renderFooter();

  // Reactive subscription: auto-updates when switching between BEAR and SOW mode
  subscribe(() => renderFooter());
  window.addEventListener('hashchange', () => renderFooter());

  container.innerHTML = '';
  container.appendChild(footer);
}

export default { mount };
