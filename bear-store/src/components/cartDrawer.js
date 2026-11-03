import { getCart, getCartTotal, removeFromCart, updateCartQty, subscribe, setState } from '../state/store.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { trapFocus, releaseFocus } from '../utils/accessibility.js';

let drawer = null;
let overlay = null;
let previousFocus = null;
let releaseTrap = null;

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
  drawer.className = 'fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface-container-lowest z-50 shadow-2xl flex flex-col transform translate-x-full transition-transform duration-300 ease-out border-l border-outline-variant/30';
  drawer.id = 'cart-drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-labelledby', 'cart-drawer-title');
  drawer.setAttribute('aria-hidden', 'true');

  function render() {
    const cart = getCart();
    const total = getCartTotal();
    const itemCount = cart.reduce((s, i) => s + (i.quantity || 1), 0);

    drawer.innerHTML = `
      <!-- Drawer Header -->
      <div class="p-space-lg border-b border-outline-variant/30 flex items-center justify-between">
        <div class="flex items-center gap-space-xs">
          <span class="material-symbols-outlined text-[22px] text-primary">shopping_bag</span>
          <h2 class="font-headline-md text-headline-md font-bold uppercase tracking-tight text-primary font-headline" id="cart-drawer-title">
            Your Bag (${itemCount})
          </h2>
        </div>
        <button class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors cursor-pointer" id="cart-close-btn" aria-label="Close cart">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Drawer Body -->
      <div class="flex-1 overflow-y-auto p-space-lg no-scrollbar">
        ${
          cart.length === 0
            ? `<div class="py-16 text-center">
                <span class="material-symbols-outlined text-5xl text-outline mb-2">shopping_bag</span>
                <h3 class="font-headline-sm text-headline-sm font-bold uppercase text-primary mb-1 font-headline">Your Bag Is Empty</h3>
                <p class="text-sm text-on-surface-variant mb-4">Add your favorite athletic pieces to start training in BEAR.</p>
                <button class="px-space-lg py-space-xs rounded-full bg-primary text-on-primary font-headline-sm uppercase text-xs font-bold font-headline" id="cart-shop-btn">
                  Shop Now
                </button>
              </div>`
            : `<div class="flex flex-col divide-y divide-outline-variant/30">
                ${cart
                  .map((item) => {
                    const img = item.image || (item.images && item.images[0]) || '';
                    return `
                    <div class="py-4 flex gap-space-md items-center">
                      <div class="w-16 h-20 rounded-none bg-surface-container overflow-hidden shrink-0 border border-outline-variant/30">
                        ${img ? `<img src="${img}" alt="${item.name}" class="w-full h-full object-cover" />` : makePlaceholderSVG(item.name, item.mode)}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-headline-sm text-sm uppercase font-bold text-primary truncate font-headline">${item.name}</p>
                        <p class="text-xs text-on-surface-variant mb-2">${item.colour} • Size ${item.size}</p>
                        <div class="flex items-center justify-between">
                          <div class="flex items-center border border-outline-variant rounded-full px-1.5 py-0.5 bg-surface-container-low text-xs">
                            <button class="cart-qty-btn px-1.5 text-primary hover:text-black font-bold" data-action="dec" data-id="${item.id}" data-size="${item.size}" data-color="${item.colour}">-</button>
                            <span class="px-2 font-bold font-headline">${item.quantity}</span>
                            <button class="cart-qty-btn px-1.5 text-primary hover:text-black font-bold" data-action="inc" data-id="${item.id}" data-size="${item.size}" data-color="${item.colour}">+</button>
                          </div>
                          <span class="font-price-card text-sm font-bold text-primary font-headline">${formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      </div>
                      <button class="cart-remove-btn text-on-surface-variant hover:text-error p-1 transition-colors cursor-pointer" data-id="${item.id}" data-size="${item.size}" data-color="${item.colour}" title="Remove item">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  `;
                  })
                  .join('')}
              </div>`
        }
      </div>

      <!-- Drawer Footer -->
      ${
        cart.length > 0
          ? `<div class="p-space-lg border-t border-outline-variant/30 bg-surface-container-low/50">
              <div class="flex justify-between font-headline-sm text-sm uppercase text-on-surface-variant mb-1 font-headline">
                <span>Subtotal</span>
                <span class="text-primary font-bold">${formatCurrency(total)}</span>
              </div>
              <div class="flex justify-between text-xs text-on-surface-variant mb-3">
                <span>Pan-India Shipping</span>
                <span class="text-green-700 font-bold uppercase">${total >= 1999 ? 'FREE' : 'Calculated at checkout'}</span>
              </div>
              <a href="#checkout" id="cart-proceed-btn" class="w-full py-3.5 px-space-xl rounded-full bg-primary hover:opacity-95 text-on-primary font-headline-sm text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all font-headline cursor-pointer">
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
  }

  function open() {
    previousFocus = document.activeElement;
    drawer.setAttribute('aria-hidden', 'false');
    render();
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    drawer.classList.remove('translate-x-full');
    document.body.classList.add('overflow-hidden');
    releaseTrap = trapFocus(drawer);
  }

  function close() {
    drawer.classList.add('translate-x-full');
    overlay.classList.add('opacity-0', 'pointer-events-none');
    document.body.classList.remove('overflow-hidden');
    drawer.setAttribute('aria-hidden', 'true');
    if (releaseTrap) releaseTrap();
    setTimeout(() => releaseFocus(previousFocus), 300);
    setState({ cartOpen: false });
  }

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
