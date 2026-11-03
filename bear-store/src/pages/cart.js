import { getCart, getCartTotal, removeFromCart, updateCartQty, subscribe } from '../state/store.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { renderEmptyIllustration } from '../components/emptyState.js';

const FREE_SHIPPING_THRESHOLD = 1999;

function makePlaceholderSVG(name, mode = 'bear') {
  const bg = mode === 'sow' ? '#EFE7DF' : '#F0F0EE';
  const text = mode === 'sow' ? '#8A625B' : '#777777';
  const init = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return `<svg viewBox="0 0 80 96" xmlns="http://www.w3.org/2000/svg" width="80" height="96"><rect width="80" height="96" fill="${bg}"/><text x="40" y="52" font-family="Inter,system-ui" font-size="22" font-weight="700" fill="${text}" text-anchor="middle" dominant-baseline="middle" opacity="0.4">${init}</text></svg>`;
}

export function render(container) {
  const page = document.createElement('div');
  page.className = 'w-full max-w-[1360px] mx-auto px-4 sm:px-6 md:px-gutter-desktop pt-20 md:pt-24 pb-32';

  function buildPage() {
    const cart = getCart();
    const total = getCartTotal();
    const progressPct = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100));
    const amountAway = FREE_SHIPPING_THRESHOLD - total;

    page.innerHTML = `
      <div class="mb-6">
        <h1 class="font-headline text-2xl md:text-3xl font-extrabold uppercase text-zinc-950">Your Bag (${cart.reduce((s, i) => s + (i.quantity || 1), 0)})</h1>
      </div>
      ${
        cart.length === 0
          ? `<div class="py-20 text-center bg-white rounded-2xl border border-zinc-200">
              ${renderEmptyIllustration('bag')}
              <h2 class="font-headline text-xl font-bold uppercase text-zinc-950 mb-1">Your bag is empty</h2>
              <p class="text-xs text-zinc-500 mb-6 max-w-sm mx-auto">Explore high-performance garments engineered for discipline, movement, and daily training.</p>
              <a href="#collection" class="inline-block px-8 py-3 rounded-full bg-black text-white text-xs font-bold uppercase font-headline tracking-wider hover:bg-zinc-800 transition-colors shadow-sm no-underline">Shop Collection</a>
            </div>`
          : `
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div class="lg:col-span-8 flex flex-col gap-4">
                <!-- Free Shipping Upsell Banner (Item 12) -->
                <div class="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                  <div class="flex items-center justify-between mb-1.5 font-headline">
                    <span class="text-xs font-bold text-zinc-800">
                      ${
                        amountAway > 0
                          ? `Add <strong class="text-black font-black">${formatCurrency(amountAway)}</strong> more for Free Air Express Delivery`
                          : `🎉 <strong class="text-emerald-700 font-bold uppercase">Free Pan-India Air Express Delivery Unlocked!</strong>`
                      }
                    </span>
                    <span class="text-[11px] font-bold text-zinc-400 font-mono">${progressPct}%</span>
                  </div>
                  <div class="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                    <div class="h-full bg-black rounded-full transition-all duration-300" style="width: ${progressPct}%"></div>
                  </div>
                </div>

                <!-- Items List -->
                <div class="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100 p-4 sm:p-6 shadow-2xs">
                  ${cart
                    .map(
                      (item) => `
                    <div class="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4 cart-item" data-id="${item.id}" data-size="${item.size}" data-colour="${item.colour}">
                      <div class="flex items-center gap-3.5 min-w-0">
                        <div class="w-16 h-20 rounded-lg overflow-hidden shrink-0 border border-zinc-200 bg-zinc-50">
                          ${
                            item.image || (item.images && item.images[0])
                              ? `<img src="${item.image || item.images[0]}" alt="${item.name}" class="w-full h-full object-cover" />`
                              : makePlaceholderSVG(item.name, item.mode)
                          }
                        </div>
                        <div class="min-w-0">
                          <p class="text-xs sm:text-sm font-bold text-zinc-950 truncate font-headline">${item.name}</p>
                          <p class="text-xs text-zinc-400 mb-2">${item.colour} · Size ${item.size}</p>
                          <div class="flex items-center border border-zinc-200 rounded-full bg-zinc-50 px-2 py-0.5 w-max text-xs">
                            <button class="cart-qty-minus px-1 text-zinc-700 hover:text-black font-bold cursor-pointer" aria-label="Decrease quantity" ${(item.quantity || 1) <= 1 ? 'disabled' : ''}>−</button>
                            <span class="qty-value px-2 font-bold font-headline">${item.quantity || 1}</span>
                            <button class="cart-qty-plus px-1 text-zinc-700 hover:text-black font-bold cursor-pointer" aria-label="Increase quantity">+</button>
                          </div>
                        </div>
                      </div>

                      <div class="text-right shrink-0">
                        <p class="text-xs sm:text-sm font-bold text-zinc-950 font-headline mb-2">${formatCurrency(item.price * (item.quantity || 1))}</p>
                        <button class="cart-item__remove text-xs text-zinc-400 hover:text-red-600 underline cursor-pointer" aria-label="Remove ${item.name}">Remove</button>
                      </div>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>

              <!-- Summary Sidebar -->
              <div class="lg:col-span-4">
                <div class="bg-white rounded-xl border border-zinc-200 p-5 sm:p-6 sticky top-28 shadow-2xs">
                  <h2 class="font-headline text-sm font-bold uppercase tracking-wider text-zinc-950 mb-4 pb-2 border-b border-zinc-100">Order Summary</h2>
                  <div class="space-y-2 text-xs text-zinc-600 mb-4">
                    <div class="flex justify-between">
                      <span>Items Subtotal</span>
                      <span class="text-zinc-950 font-bold font-headline">${formatCurrency(total)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Pan-India Priority Air</span>
                      <span class="text-emerald-700 font-bold uppercase text-[11px]">FREE (₹0)</span>
                    </div>
                  </div>
                  <div class="flex justify-between items-baseline pt-3 border-t border-zinc-200 mb-6">
                    <span class="font-headline text-sm uppercase font-bold text-zinc-950">Total Amount</span>
                    <span class="font-headline text-xl font-bold text-zinc-950">${formatCurrency(total)}</span>
                  </div>
                  <a href="#checkout" class="w-full py-3.5 rounded-full bg-black text-white text-xs font-bold uppercase font-headline tracking-wider hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 shadow-md no-underline">
                    <span>Proceed to Checkout</span>
                    <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </a>
                  <a href="#collection" class="block text-center text-xs font-bold uppercase text-zinc-500 hover:text-black underline mt-3 font-headline no-underline">Continue Shopping</a>
                </div>
              </div>
            </div>
          `
      }
    `;

    // Events
    page.querySelectorAll('.cart-qty-minus').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.cart-item');
        const qty = parseInt(row.querySelector('.qty-value').textContent) - 1;
        updateCartQty(row.dataset.id, row.dataset.size, row.dataset.colour, qty);
      });
    });
    page.querySelectorAll('.cart-qty-plus').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.cart-item');
        const qty = parseInt(row.querySelector('.qty-value').textContent) + 1;
        updateCartQty(row.dataset.id, row.dataset.size, row.dataset.colour, qty);
      });
    });
    page.querySelectorAll('.cart-item__remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.cart-item');
        removeFromCart(row.dataset.id, row.dataset.size, row.dataset.colour);
      });
    });
  }

  buildPage();
  container.innerHTML = '';
  container.appendChild(page);

  const unsub = subscribe(() => buildPage());
  window.addEventListener('hashchange', () => unsub(), { once: true });
}

export default { render };
