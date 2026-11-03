import { getCart, getCartTotal, removeFromCart, updateCartQty, subscribe, setState, getMode } from '../state/store.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { trapFocus, releaseFocus } from '../utils/accessibility.js';
import { renderEmptyIllustration } from './emptyState.js';
import { products } from '../data/products.js';
import { addItem } from '../services/cartService.js';
import { showToast } from './toast.js';

let drawer = null;
let overlay = null;
let previousFocus = null;
let releaseTrap = null;

// Touch tracking for swipe-to-close gesture (Item 19)
let touchStartX = 0;
let touchStartY = 0;
let touchCurrentX = 0;

const FREE_SHIPPING_THRESHOLD = 1999;

function makePlaceholderSVG(name, mode = 'bear') {
  const bg = mode === 'sow' ? '#EFE7DF' : '#F0F0EE';
  const text = mode === 'sow' ? '#8A625B' : '#777777';
  const init = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return `<svg viewBox="0 0 80 96" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"><rect width="80" height="96" fill="${bg}"/><text x="40" y="52" font-family="'Space Grotesk', system-ui" font-size="22" font-weight="700" fill="${text}" text-anchor="middle" dominant-baseline="middle" opacity="0.4">${init}</text></svg>`;
}

export function mount(container) {
  // Backdrop
  overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 opacity-0 pointer-events-none transition-opacity duration-300';
  overlay.id = 'cart-overlay';
  overlay.addEventListener('click', close);

  drawer = document.createElement('aside');
  drawer.className = 'fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transform translate-x-full transition-transform duration-300 ease-out border-l border-zinc-200 select-none';
  drawer.id = 'cart-drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-labelledby', 'cart-drawer-title');
  drawer.setAttribute('aria-hidden', 'true');

  function render() {
    const cart = getCart();
    const total = getCartTotal();
    const mode = getMode();
    const itemCount = cart.reduce((s, i) => s + (i.quantity || 1), 0);

    const progressPct = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100));
    const amountAway = FREE_SHIPPING_THRESHOLD - total;

    // Filter recommended products (products matching current mode not in cart)
    const cartProductIds = new Set(cart.map((i) => i.id));
    let recommendations = products.filter((p) => p.mode === mode && !cartProductIds.has(p.id));
    if (recommendations.length < 3) {
      recommendations = products.filter((p) => !cartProductIds.has(p.id));
    }
    const displayedRecommendations = recommendations.slice(0, 3);

    drawer.innerHTML = `
      <!-- Drawer Header -->
      <div class="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-[20px] text-zinc-950">shopping_bag</span>
          <h2 class="font-headline text-base font-extrabold uppercase tracking-tight text-zinc-950" id="cart-drawer-title">
            Your Bag (${itemCount})
          </h2>
        </div>
        <button class="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer" id="cart-close-btn" aria-label="Close cart">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Free Shipping Upsell Progress Bar (Item 12) -->
      ${
        cart.length > 0
          ? `
          <div class="px-5 py-3 bg-zinc-50 border-b border-zinc-100 text-xs">
            <div class="flex items-center justify-between mb-1.5 font-headline">
              <span class="text-[11px] font-bold text-zinc-700">
                ${
                  amountAway > 0
                    ? `Add <strong class="text-zinc-950 font-black">${formatCurrency(amountAway)}</strong> more for Free Air Express`
                    : `🎉 <strong class="text-emerald-700 font-bold uppercase">Free Pan-India Air Express Unlocked!</strong>`
                }
              </span>
              <span class="text-[10px] font-bold text-zinc-400 font-mono">${progressPct}%</span>
            </div>
            <div class="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <div class="h-full bg-black rounded-full transition-all duration-300" style="width: ${progressPct}%"></div>
            </div>
          </div>
        `
          : ''
      }

      <!-- Drawer Body -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 no-scrollbar">
        ${
          cart.length === 0
            ? `<div class="py-12 text-center">
                ${renderEmptyIllustration('bag')}
                <h3 class="font-headline text-base font-extrabold uppercase text-zinc-950 mb-1">Your Bag Is Empty</h3>
                <p class="text-xs text-zinc-500 mb-6 max-w-xs mx-auto">Explore high-performance garments engineered for discipline and daily training.</p>
                <button class="px-6 py-2.5 rounded-full bg-black text-white font-headline text-xs uppercase font-bold tracking-wider hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm" id="cart-shop-btn">
                  Explore Collection
                </button>
              </div>`
            : `<div class="flex flex-col divide-y divide-zinc-100">
                ${cart
                  .map((item) => {
                    const img = item.image || (item.images && item.images[0]) || '';
                    return `
                    <div class="py-3.5 flex gap-3 items-center">
                      <div class="w-16 h-20 rounded-lg bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
                        ${img ? `<img src="${img}" alt="${item.name}" class="w-full h-full object-cover" />` : makePlaceholderSVG(item.name, item.mode)}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold text-zinc-950 truncate font-headline">${item.name}</p>
                        <p class="text-[11px] text-zinc-400 mb-2">${item.colour} • Size ${item.size}</p>
                        <div class="flex items-center justify-between">
                          <div class="flex items-center border border-zinc-200 rounded-full px-2 py-0.5 bg-zinc-50 text-xs">
                            <button class="cart-qty-btn px-1 text-zinc-700 hover:text-black font-bold cursor-pointer" data-action="dec" data-id="${item.id}" data-size="${item.size}" data-color="${item.colour}">-</button>
                            <span class="px-2 font-bold font-headline">${item.quantity}</span>
                            <button class="cart-qty-btn px-1 text-zinc-700 hover:text-black font-bold cursor-pointer" data-action="inc" data-id="${item.id}" data-size="${item.size}" data-color="${item.colour}">+</button>
                          </div>
                          <span class="text-xs font-bold text-zinc-950 font-headline">${formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      </div>
                      <button class="cart-remove-btn text-zinc-300 hover:text-red-600 p-1 transition-colors cursor-pointer" data-id="${item.id}" data-size="${item.size}" data-color="${item.colour}" title="Remove item">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  `;
                  })
                  .join('')}
              </div>`
        }

        <!-- Compact "You May Also Like" Strip in Cart Drawer -->
        ${
          displayedRecommendations.length > 0
            ? `
            <div class="mt-6 pt-5 border-t border-zinc-100">
              <div class="flex items-center justify-between mb-3">
                <span class="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-headline">You May Also Like</span>
                <span class="text-[10px] text-zinc-400 font-medium">Quick Add</span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                ${displayedRecommendations
                  .map((p) => {
                    const img = p.images?.[0] || p.image || '';
                    return `
                    <div class="p-2 rounded-xl bg-zinc-50 border border-zinc-200/80 flex flex-col justify-between">
                      <div>
                        <div class="aspect-[4/5] rounded-lg overflow-hidden bg-zinc-100 mb-1.5 border border-zinc-200">
                          ${img ? `<img src="${img}" alt="${p.name}" class="w-full h-full object-cover" />` : ''}
                        </div>
                        <p class="text-[10px] font-bold text-zinc-950 truncate font-headline leading-tight">${p.name}</p>
                        <p class="text-[10px] font-bold text-zinc-600 font-headline mb-2">${formatCurrency(p.price)}</p>
                      </div>
                      <button class="drawer-rec-add-btn w-full py-1 rounded-md bg-black text-white text-[9px] font-bold uppercase font-headline tracking-wider hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-0.5" data-id="${p.id}">
                        <span>+ Add</span>
                      </button>
                    </div>
                  `;
                  })
                  .join('')}
              </div>
            </div>
          `
            : ''
        }
      </div>

      <!-- Drawer Footer -->
      ${
        cart.length > 0
          ? `<div class="p-4 sm:p-5 border-t border-zinc-100 bg-zinc-50">
              <div class="flex justify-between text-xs text-zinc-600 mb-1 font-headline">
                <span>Items Subtotal</span>
                <span class="text-zinc-950 font-bold font-headline">${formatCurrency(total)}</span>
              </div>
              <div class="flex justify-between text-xs text-zinc-600 mb-4">
                <span>Pan-India Priority Air</span>
                <span class="text-emerald-700 font-bold uppercase text-[11px]">FREE (₹0)</span>
              </div>
              <a href="#checkout" id="cart-proceed-btn" class="w-full py-3.5 px-6 rounded-full bg-black hover:bg-zinc-800 text-white font-headline text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer no-underline">
                <span>PROCEED TO CHECKOUT</span>
                <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
              </a>
            </div>`
          : ''
      }
    `;

    // Attach listeners
    drawer.querySelector('#cart-close-btn')?.addEventListener('click', close);
    drawer.querySelector('#cart-shop-btn')?.addEventListener('click', () => {
      close();
      window.location.hash = '#collection';
    });
    drawer.querySelector('#cart-proceed-btn')?.addEventListener('click', close);

    drawer.querySelectorAll('.cart-qty-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const size = btn.dataset.size;
        const color = btn.dataset.color;
        const action = btn.dataset.action;
        const item = cart.find((i) => i.id === id && i.size === size && i.colour === color);
        if (item) {
          const newQty = action === 'inc' ? item.quantity + 1 : item.quantity - 1;
          updateCartQty(id, size, color, newQty);
        }
      });
    });

    drawer.querySelectorAll('.cart-remove-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const size = btn.dataset.size;
        const color = btn.dataset.color;
        removeFromCart(id, size, color);
      });
    });

    // Quick add from drawer recommendations
    drawer.querySelectorAll('.drawer-rec-add-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pId = btn.dataset.id;
        const targetProduct = products.find((p) => p.id === pId);
        if (targetProduct) {
          const colour = targetProduct.colours?.[0]?.name || 'Standard';
          const sizeObj = targetProduct.sizes?.find((s) => s.available) || targetProduct.sizes?.[0];
          const size = sizeObj?.size || 'M';
          addItem(targetProduct, colour, size, 1);
          showToast(`Added ${targetProduct.name} to bag!`, 'success');
        }
      });
    });
  }

  function open() {
    previousFocus = document.activeElement;
    drawer.setAttribute('aria-hidden', 'false');
    render();
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    drawer.classList.remove('translate-x-full');
    drawer.style.transform = '';
    document.body.classList.add('overflow-hidden');
    releaseTrap = trapFocus(drawer);
  }

  function close() {
    drawer.classList.add('translate-x-full');
    overlay.classList.add('opacity-0', 'pointer-events-none');
    drawer.style.transform = '';
    document.body.classList.remove('overflow-hidden');
    drawer.setAttribute('aria-hidden', 'true');
    if (releaseTrap) releaseTrap();
    setTimeout(() => releaseFocus(previousFocus), 300);
    setState({ cartOpen: false });
  }

  // Mobile Swipe Gesture Event Listeners (Item 19)
  drawer.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchCurrentX = touchStartX;
    },
    { passive: true }
  );

  drawer.addEventListener(
    'touchmove',
    (e) => {
      touchCurrentX = e.touches[0].clientX;
      const deltaX = touchCurrentX - touchStartX;
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

      // Horizontal swipe to right (closing direction)
      if (deltaX > 0 && deltaX > deltaY) {
        drawer.style.transform = `translateX(${deltaX}px)`;
      }
    },
    { passive: true }
  );

  drawer.addEventListener('touchend', () => {
    const deltaX = touchCurrentX - touchStartX;
    if (deltaX > 75) {
      close();
    } else {
      // Snap back
      drawer.style.transform = '';
    }
  });

  drawer.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  subscribe((state) => {
    if (state.cartOpen && drawer.getAttribute('aria-hidden') === 'true') open();
    if (!state.cartOpen && drawer.getAttribute('aria-hidden') === 'false') close();
    if (drawer.getAttribute('aria-hidden') === 'false') render();
  });

  container.appendChild(overlay);
  container.appendChild(drawer);
}

export default { mount };
