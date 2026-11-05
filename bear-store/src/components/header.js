import { getMode, setMode, getCartCount, subscribe, setState } from '../state/store.js';

let promoMessages = [
  'COMPLIMENTARY EXPRESS AIR SHIPPING ACROSS INDIA (₹0)',
  'USE CODE BEAR10 FOR 10% OFF YOUR FIRST DROP',
  'ORDER & TRACK DIRECT VIA WHATSAPP: +91 96052 10198',
];
let promoEnabled = true;
let promoIndex = 0;
let promoInterval = null;
let promoFetched = false;

async function loadPromotions(onUpdate) {
  try {
    const res = await fetch('http://localhost:4000/api/v1/promotions');
    if (res.ok) {
      const json = await res.json();
      const bar = json.data?.announcement_bar;
      if (bar) {
        if (typeof bar.enabled === 'boolean') {
          promoEnabled = bar.enabled;
        }
        if (Array.isArray(bar.messages) && bar.messages.length > 0) {
          promoMessages = bar.messages;
        }
        promoFetched = true;
        if (typeof onUpdate === 'function') onUpdate();
      }
    }
  } catch {
    // Graceful fallback to default messages if offline
  }
}

export function mount(container) {
  const header = document.createElement('header');
  header.className = 'fixed top-0 left-0 right-0 z-50';

  function updateAnnouncementDOM() {
    const barEl = header.querySelector('#header-announcement-bar');
    const textEl = header.querySelector('#header-announcement-text');
    if (!promoEnabled) {
      if (barEl) barEl.style.display = 'none';
    } else {
      if (barEl) barEl.style.display = 'flex';
      if (textEl && promoMessages.length > 0) {
        textEl.textContent = promoMessages[promoIndex % promoMessages.length];
      }
    }
  }

  function startAnnouncementTicker() {
    if (promoInterval) clearInterval(promoInterval);
    promoInterval = setInterval(() => {
      if (!promoEnabled || promoMessages.length <= 1) return;
      promoIndex = (promoIndex + 1) % promoMessages.length;
      const textEl = header.querySelector('#header-announcement-text');
      if (textEl) {
        textEl.classList.remove('opacity-100', 'translate-y-0');
        textEl.classList.add('opacity-0', '-translate-y-1');
        setTimeout(() => {
          textEl.textContent = promoMessages[promoIndex % promoMessages.length];
          textEl.classList.remove('-translate-y-1');
          textEl.classList.add('translate-y-1');
          requestAnimationFrame(() => {
            textEl.classList.remove('opacity-0', 'translate-y-1');
            textEl.classList.add('opacity-100', 'translate-y-0');
          });
        }, 200);
      }
    }, 3800);
  }

  function renderHeader() {
    const mode = getMode();
    const cartCount = getCartCount();
    const hash = window.location.hash || '#';
    const isHome = hash === '#' || hash === '#home' || hash === '';
    const isCollection = hash.startsWith('#collection');
    const isAccount = hash.startsWith('#account');

    header.innerHTML = `
      <!-- Slim Top Announcement Bar (Connected to /api/v1/promotions) -->
      ${
        promoEnabled
          ? `
      <div id="header-announcement-bar" class="w-full ${mode === 'sow' ? 'bg-[#80534C]' : 'bg-black'} text-white py-1 px-4 text-center flex items-center justify-center transition-colors duration-300">
        <p id="header-announcement-text" class="font-headline text-[11px] tracking-widest uppercase font-semibold transition-all duration-300 transform opacity-100 translate-y-0 select-none">
          ${promoMessages[promoIndex % promoMessages.length] || ''}
        </p>
      </div>`
          : ''
      }

      <!-- Mobile Top Bar (< 768px): Clean Minimal Branding Header with Go Back Button -->
      <!-- Shows Go Back button when navigated to any inner screen / subpage -->
      <div class="px-4 sm:px-5 pt-3 pb-2 flex md:hidden items-center justify-between bg-white/95 backdrop-blur-md border-b border-zinc-100 shadow-xs">
        <div class="flex items-center gap-2">
          ${
            !isHome
              ? `
              <button id="mobile-back-btn" class="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 active:scale-95 flex items-center justify-center text-zinc-900 transition-all cursor-pointer shadow-2xs" aria-label="Go Back" title="Go Back">
                <svg class="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </button>
            `
              : ''
          }
          <!-- BEAR. Brand Logo -->
          <a class="font-headline font-extrabold text-2xl tracking-tighter text-black flex items-center gap-0.5 no-underline" href="#">
            BEAR<span class="${mode === 'sow' ? 'text-[#80534C]' : 'text-black'}">.</span>
          </a>
        </div>

        <!-- Quick Bag Action Trigger -->
        <div class="flex items-center">
          <button aria-label="Shopping Bag" id="mobile-header-cart-btn" class="relative p-1.5 text-zinc-800 hover:text-black transition cursor-pointer">
            <svg class="w-6 h-6 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            ${cartCount > 0 ? `<span class="absolute -top-1 -right-1 ${mode === 'sow' ? 'bg-[#80534C]' : 'bg-black'} text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-headline">${cartCount > 9 ? '9+' : cartCount}</span>` : ''}
          </button>
        </div>
      </div>

      <div class="hidden md:flex h-16 max-w-[1360px] mx-auto px-gutter-desktop items-center justify-center">
        <div class="w-full max-w-2xl bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] rounded-full px-4 py-1 flex items-center justify-between border border-outline-variant/30">

          <!-- Left: Nav links — flex-1 so it takes equal third -->
          <nav class="flex items-center gap-3 flex-1">
            <a href="#" class="px-3 py-1.5 rounded-full font-label-pill text-label-pill font-semibold transition-all ${
                isHome ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }" ${isHome ? 'aria-current="page"' : ''}>HOME</a>
            <a href="#collection" class="px-3 py-1.5 rounded-full font-label-pill text-label-pill font-semibold transition-all ${
                isCollection ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }" ${isCollection ? 'aria-current="page"' : ''}>COLLECTION</a>
          </nav>

          <!-- Center: Logo — flex-1 centered -->
          <div class="flex items-center justify-center flex-1">
            <a href="#" class="font-headline tracking-tighter font-bold uppercase text-black text-base no-underline">
              BEAR<span class="${mode === 'sow' ? 'text-[#80534C]' : 'text-black'}">.</span>
            </a>
          </div>

          <!-- Right: Controls — flex-1 right-aligned, gap-3 between every item -->
          <div class="flex items-center justify-end gap-3 flex-1">
            <div class="bg-surface-container p-1 rounded-full flex items-center border border-outline-variant/20">
              <button id="header-bear-btn" class="px-3 py-1 rounded-full font-label-caps text-label-caps uppercase transition-all font-bold ${
                  mode === 'bear' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }" type="button">BEAR</button>
              <button id="header-sow-btn" class="px-3 py-1 rounded-full font-label-caps text-label-caps uppercase transition-all font-bold ${
                  mode === 'sow' ? 'bg-[#80534C] text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }" type="button">SOW</button>
            </div>
            <button id="header-search-btn" aria-label="Search" class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer" type="button">
              <span class="material-symbols-outlined text-[18px]">search</span>
            </button>
            <button id="header-cart-btn" aria-label="Cart" class="relative w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer" type="button">
              <span class="material-symbols-outlined text-[18px]">shopping_bag</span>
              ${cartCount > 0 ? `<span class="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-on-primary font-label-caps text-[8px] flex items-center justify-center font-bold">${cartCount > 9 ? '9+' : cartCount}</span>` : ''}
            </button>
            <a href="#account" class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary hover:opacity-90 transition-opacity" title="My Account" aria-label="My Account">
              <svg class="w-4 h-4 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </div>

        </div>
      </div>
    `;

    // Attach Desktop Header Button Handlers
    header.querySelector('#header-bear-btn')?.addEventListener('click', () => setMode('bear'));
    header.querySelector('#header-sow-btn')?.addEventListener('click', () => setMode('sow'));
    header.querySelector('#header-search-btn')?.addEventListener('click', () => setState({ searchOpen: true }));
    header.querySelector('#header-cart-btn')?.addEventListener('click', () => setState({ cartOpen: true }));

    // Attach Mobile Header Button Handlers (Safe History Fallback)
    header.querySelector('#mobile-back-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
        window.history.back();
      } else {
        window.location.hash = hash.startsWith('#product') ? '#collection' : '#';
      }
    });
    header.querySelector('#mobile-header-cart-btn')?.addEventListener('click', () => setState({ cartOpen: true }));
  }

  renderHeader();
  subscribe(() => renderHeader());
  window.addEventListener('hashchange', () => renderHeader());

  startAnnouncementTicker();
  if (!promoFetched) {
    loadPromotions(() => updateAnnouncementDOM());
  }
  window.addEventListener('focus', () => {
    loadPromotions(() => updateAnnouncementDOM());
  });

  container.innerHTML = '';
  container.appendChild(header);

  // Mobile Bottom Dock (Floating Pill Dock for Screens < 768px)
  const mobileDock = document.createElement('nav');
  mobileDock.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-[420px] z-50 flex md:hidden rounded-full px-3 py-2 shadow-2xl items-center justify-between border transition-colors';
  mobileDock.setAttribute('aria-label', 'Bottom Navigation');
  
  function renderDock() {
    const mode = getMode();
    const cartCount = getCartCount();
    const hash = window.location.hash || '#';
    const isHome = hash === '#' || hash === '#home' || hash === '';
    const isCollection = hash.startsWith('#collection');
    const isCart = hash.startsWith('#cart');
    const isAccount = hash.startsWith('#account') || hash.startsWith('#wishlist');

    // SOW vs BEAR responsive palette (Issue 21 fix)
    if (mode === 'sow') {
      mobileDock.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-[420px] z-50 flex md:hidden bg-[#FAF7F2]/95 backdrop-blur-lg text-[#332923] rounded-full px-3 py-2 shadow-2xl items-center justify-between border border-[#E3D8CE] transition-colors';
    } else {
      mobileDock.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-[420px] z-50 flex md:hidden bg-white/95 backdrop-blur-lg text-zinc-900 rounded-full px-3 py-2 shadow-2xl items-center justify-between border border-zinc-200 transition-colors';
    }

    const dotColor = mode === 'sow' ? 'bg-[#80534C]' : 'bg-black';

    mobileDock.innerHTML = `
      <!-- Tab 1: Home -->
      <a class="p-2 transition flex flex-col items-center ${isHome ? 'text-black font-bold' : 'text-zinc-400 hover:text-black'}" href="#" aria-label="Home" ${isHome ? 'aria-current="page"' : ''}>
        <svg class="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
        ${isHome ? `<span class="w-1 h-1 ${dotColor} rounded-full mt-0.5"></span>` : ''}
      </a>

      <!-- Tab 2: Collection -->
      <a class="p-2 transition flex flex-col items-center ${isCollection ? 'text-black font-bold' : 'text-zinc-400 hover:text-black'}" href="#collection" aria-label="Collection" ${isCollection ? 'aria-current="page"' : ''}>
        <svg class="w-5 h-5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect height="7" rx="1.5" width="7" x="3" y="3"></rect>
          <rect height="7" rx="1.5" width="7" x="14" y="3"></rect>
          <rect height="7" rx="1.5" width="7" x="14" y="14"></rect>
          <rect height="7" rx="1.5" width="7" x="3" y="14"></rect>
        </svg>
        ${isCollection ? `<span class="w-1 h-1 ${dotColor} rounded-full mt-0.5"></span>` : ''}
      </a>

      <!-- Center Switcher: Animated BEAR / SOW Toggle -->
      <div class="px-1 py-0.5">
        <button id="dock-mode-btn"
          role="switch"
          aria-checked="${mode === 'sow' ? 'true' : 'false'}"
          aria-label="Toggle BEAR / SOW collection"
          class="dock-mode-toggle mode-switch${mode === 'sow' ? ' mode-switch--sow' : ''}"
          type="button"
        >
          <div class="mode-switch__thumb${mode === 'sow' ? ' mode-switch__thumb--sow' : ''}"></div>
          <div class="mode-switch__labels">
            <span class="mode-switch__label mode-switch__label--bear">BEAR</span>
            <span class="mode-switch__label mode-switch__label--sow">SOW</span>
          </div>
        </button>
      </div>

      <!-- Tab 4: Search -->
      <button id="dock-search-btn" class="p-2 text-zinc-400 hover:text-black transition flex flex-col items-center cursor-pointer" aria-label="Search">
        <svg class="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7"></circle>
          <path d="m20 20-3.5-3.5" stroke-linecap="round"></path>
        </svg>
      </button>

      <!-- Tab 5: Cart (With live count badge - Issue 3 fix) -->
      <button id="dock-cart-btn" class="relative p-2 ${isCart ? 'text-black font-bold' : 'text-zinc-400 hover:text-black'} transition flex flex-col items-center cursor-pointer" aria-label="Shopping Bag">
        <svg class="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
        ${cartCount > 0 ? `<span class="absolute top-0.5 right-0.5 ${mode === 'sow' ? 'bg-[#80534C]' : 'bg-black'} text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-headline">${cartCount > 9 ? '9+' : cartCount}</span>` : ''}
        ${isCart ? `<span class="w-1 h-1 ${dotColor} rounded-full mt-0.5"></span>` : ''}
      </button>

      <!-- Tab 6: Profile (Includes Wishlist, Orders, Addresses) -->
      <a class="p-2 transition flex flex-col items-center ${isAccount ? 'text-black font-bold' : 'text-zinc-400 hover:text-black'}" href="#account" aria-label="Profile" ${isAccount ? 'aria-current="page"' : ''}>
        <svg class="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
        ${isAccount ? `<span class="w-1 h-1 ${dotColor} rounded-full mt-0.5"></span>` : ''}
      </a>
    `;

    mobileDock.querySelector('#dock-mode-btn')?.addEventListener('click', () => {
      setMode(mode === 'bear' ? 'sow' : 'bear');
    });
    mobileDock.querySelector('#dock-search-btn')?.addEventListener('click', () => setState({ searchOpen: true }));
    mobileDock.querySelector('#dock-cart-btn')?.addEventListener('click', () => setState({ cartOpen: true }));
  }

  renderDock();
  subscribe(() => renderDock());
  window.addEventListener('hashchange', () => renderDock());
  container.appendChild(mobileDock);
}

export default { mount };
