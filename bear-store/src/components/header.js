import { getMode, setMode, getCartCount, subscribe, setState } from '../state/store.js';

export function mount(container) {
  const header = document.createElement('header');
  header.className = 'fixed top-0 left-0 right-0 z-50';

  function renderHeader() {
    const mode = getMode();
    const cartCount = getCartCount();
    const hash = window.location.hash || '#';
    const isHome = hash === '#' || hash === '#home' || hash === '';
    const isCollection = hash.startsWith('#collection');
    const isAccount = hash.startsWith('#account');

    header.innerHTML = `
      <!-- Slim Top Announcement Bar -->
      <div class="w-full ${mode === 'sow' ? 'bg-[#80534C]' : 'bg-black'} text-white py-1 px-4 text-center flex items-center justify-center">
        <p class="font-headline text-[11px] tracking-widest uppercase font-semibold">
          Complimentary domestic shipping on orders over ₹1,999 • Seamless WhatsApp checkout
        </p>
      </div>

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
            <svg class="w-6 h-6 stroke-[1.8]" fill="none" stroke="currentColor" viewbox="0 0 24 24">
              <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            ${cartCount > 0 ? `<span class="absolute -top-1 -right-1 ${mode === 'sow' ? 'bg-[#80534C]' : 'bg-black'} text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-headline">${cartCount > 9 ? '9+' : cartCount}</span>` : ''}
          </button>
        </div>
      </div>

      <!-- Desktop Floating Pill Navigation (Hidden on Mobile < 768px) -->
      <div class="hidden md:flex h-20 max-w-[1360px] mx-auto px-gutter-desktop items-center justify-center">
        <div class="w-full max-w-5xl bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] rounded-full px-space-md py-space-xs flex items-center justify-between border border-outline-variant/30">
          <nav class="flex items-center gap-space-xs">
            <a 
              href="#" 
              class="px-space-md py-space-xs rounded-full font-label-pill text-label-pill font-semibold transition-all ${
                isHome ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }"
            >HOME</a>
            <a 
              href="#collection" 
              class="px-space-md py-space-xs rounded-full font-label-pill text-label-pill font-semibold transition-all ${
                isCollection ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }"
            >COLLECTION</a>
          </nav>

          <div class="flex items-center justify-center">
            <a href="#" class="font-headline-lg text-headline-lg tracking-tighter font-bold uppercase text-primary px-space-md font-headline">
              BEAR<span class="${mode === 'sow' ? 'text-[#80534C]' : 'text-black'}">.</span>
            </a>
          </div>

          <div class="flex items-center gap-space-md">
            <!-- Mode Switcher (Desktop Only) -->
            <div class="bg-surface-container p-space-xs rounded-full flex items-center border border-outline-variant/20">
              <button 
                id="header-bear-btn" 
                class="px-space-md py-space-xs rounded-full font-label-caps text-label-caps uppercase transition-all font-bold ${
                  mode === 'bear' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }" 
                type="button"
              >BEAR</button>
              <button 
                id="header-sow-btn" 
                class="px-space-md py-space-xs rounded-full font-label-caps text-label-caps uppercase transition-all font-bold ${
                  mode === 'sow' ? 'bg-[#80534C] text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }" 
                type="button"
              >SOW</button>
            </div>

            <!-- Utility Buttons -->
            <div class="flex items-center gap-space-xs">
              <button id="header-search-btn" aria-label="Search" class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer" type="button">
                <span class="material-symbols-outlined text-[20px]">search</span>
              </button>

              <button id="header-cart-btn" aria-label="Cart" class="relative w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer" type="button">
                <span class="material-symbols-outlined text-[20px]">shopping_bag</span>
                ${cartCount > 0 ? `<span class="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-on-primary font-label-caps text-[9px] flex items-center justify-center font-bold">${cartCount > 9 ? '9+' : cartCount}</span>` : ''}
              </button>

              <a href="#account" class="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-space-xs text-on-primary hover:opacity-90 transition-opacity" title="My Account">
                <span class="material-symbols-outlined text-[18px]">person</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach Desktop Header Button Handlers
    header.querySelector('#header-bear-btn')?.addEventListener('click', () => setMode('bear'));
    header.querySelector('#header-sow-btn')?.addEventListener('click', () => setMode('sow'));
    header.querySelector('#header-search-btn')?.addEventListener('click', () => setState({ searchOpen: true }));
    header.querySelector('#header-cart-btn')?.addEventListener('click', () => setState({ cartOpen: true }));

    // Attach Mobile Header Button Handlers
    header.querySelector('#mobile-back-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.hash = '#';
      }
    });
    header.querySelector('#mobile-header-cart-btn')?.addEventListener('click', () => setState({ cartOpen: true }));
  }

  renderHeader();
  subscribe(() => renderHeader());
  window.addEventListener('hashchange', () => renderHeader());

  container.innerHTML = '';
  container.appendChild(header);

  // Mobile Bottom Dock (Floating Pill Dock for Screens < 768px)
  const mobileDock = document.createElement('nav');
  mobileDock.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[390px] z-50 flex md:hidden bg-white/95 backdrop-blur-lg text-zinc-900 rounded-full px-4 py-2.5 shadow-2xl items-center justify-between border border-zinc-200';
  mobileDock.setAttribute('aria-label', 'Bottom Dock');
  
  function renderDock() {
    const mode = getMode();
    const hash = window.location.hash || '#';
    const isHome = hash === '#' || hash === '#home' || hash === '';
    const isCollection = hash.startsWith('#collection');
    const isAccount = hash.startsWith('#account') || hash.startsWith('#wishlist');

    mobileDock.innerHTML = `
      <!-- Tab 1: Home -->
      <a class="p-2 transition flex flex-col items-center ${isHome ? 'text-black font-bold' : 'text-zinc-400 hover:text-black'}" href="#" aria-label="Home">
        <svg class="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewbox="0 0 24 24">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
        ${isHome ? '<span class="w-1 h-1 bg-black rounded-full mt-0.5"></span>' : ''}
      </a>

      <!-- Tab 2: Collection -->
      <a class="p-2 transition flex flex-col items-center ${isCollection ? 'text-black font-bold' : 'text-zinc-400 hover:text-black'}" href="#collection" aria-label="Collection">
        <svg class="w-5 h-5 stroke-[2.2]" fill="none" stroke="currentColor" viewbox="0 0 24 24">
          <rect height="7" rx="1.5" width="7" x="3" y="3"></rect>
          <rect height="7" rx="1.5" width="7" x="14" y="3"></rect>
          <rect height="7" rx="1.5" width="7" x="14" y="14"></rect>
          <rect height="7" rx="1.5" width="7" x="3" y="14"></rect>
        </svg>
        ${isCollection ? '<span class="w-1 h-1 bg-black rounded-full mt-0.5"></span>' : ''}
      </a>

      <!-- Center Switcher: BEAR / SOW Mode Pill -->
      <div class="px-2 py-0.5">
        <button id="dock-mode-btn" class="${mode === 'sow' ? 'bg-[#80534C]' : 'bg-black'} text-white font-headline font-extrabold text-[11px] px-3.5 py-1.5 rounded-full tracking-wider shadow-sm flex items-center gap-1 cursor-pointer transition-transform active:scale-95" title="Toggle BEAR / SOW Mode">
          ${mode.toUpperCase()}
        </button>
      </div>

      <!-- Tab 4: Search (Single Dedicated Search Trigger) -->
      <button id="dock-search-btn" class="p-2 text-zinc-400 hover:text-black transition flex flex-col items-center cursor-pointer" aria-label="Search">
        <svg class="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewbox="0 0 24 24">
          <circle cx="11" cy="11" r="7"></circle>
          <path d="m20 20-3.5-3.5" stroke-linecap="round"></path>
        </svg>
      </button>

      <!-- Tab 5: Profile (Includes Wishlist, Orders, Addresses) -->
      <a class="p-2 transition flex flex-col items-center ${isAccount ? 'text-black font-bold' : 'text-zinc-400 hover:text-black'}" href="#account" aria-label="Profile">
        <svg class="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewbox="0 0 24 24">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
        ${isAccount ? '<span class="w-1 h-1 bg-black rounded-full mt-0.5"></span>' : ''}
      </a>
    `;

    mobileDock.querySelector('#dock-mode-btn')?.addEventListener('click', () => {
      setMode(mode === 'bear' ? 'sow' : 'bear');
    });
    mobileDock.querySelector('#dock-search-btn')?.addEventListener('click', () => setState({ searchOpen: true }));
  }

  renderDock();
  subscribe(() => renderDock());
  window.addEventListener('hashchange', () => renderDock());
  container.appendChild(mobileDock);
}

export default { mount };
