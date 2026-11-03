import { getCart, getCartTotal, removeFromCart, updateCartQty, subscribe } from '../state/store.js';
import { formatCurrency } from '../utils/formatCurrency.js';

function makePlaceholderSVG(name, mode = 'bear') {
  const bg = mode === 'sow' ? '#EFE7DF' : '#F0F0EE';
  const text = mode === 'sow' ? '#8A625B' : '#777777';
  const init = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return `<svg viewBox="0 0 80 96" xmlns="http://www.w3.org/2000/svg" width="80" height="96"><rect width="80" height="96" fill="${bg}"/><text x="40" y="52" font-family="Inter,system-ui" font-size="22" font-weight="700" fill="${text}" text-anchor="middle" dominant-baseline="middle" opacity="0.4">${init}</text></svg>`;
}

export function render(container) {
  const page = document.createElement('div');
  page.className = 'page';
  page.style.paddingTop = 'calc(72px + var(--space-8))';

  function buildPage() {
    const cart = getCart();
    const total = getCartTotal();

    page.innerHTML = `
      <div class="container">
        <div class="page-header" style="padding-top:0">
          <h1>Your Bag</h1>
        </div>
        ${
          cart.length === 0
            ? `<div class="empty-state">
                <div class="empty-state__icon">🛍️</div>
                <h2 class="empty-state__title">Your bag is empty</h2>
                <p class="empty-state__desc">Start shopping and add items to your bag.</p>
                <a href="#collection" class="btn btn-primary">Shop Collection</a>
              </div>`
            : `
              <div class="checkout-layout">
                <div>
                  ${cart
                    .map(
                      (item) => `
                    <div class="cart-item" data-id="${item.id}" data-size="${item.size}" data-colour="${item.colour}">
                      <div class="cart-item__image overflow-hidden">
                        ${
                          item.image || (item.images && item.images[0])
                            ? `<img src="${item.image || item.images[0]}" alt="${item.name}" class="w-full h-full object-cover" />`
                            : makePlaceholderSVG(item.name, item.mode)
                        }
                      </div>
                      <div class="cart-item__details">
                        <span class="cart-item__name">${item.name}</span>
                        <span class="cart-item__meta">${item.colour} · ${item.size}</span>
                        <div class="cart-item__actions">
                          <div class="qty-selector">
                            <button class="qty-btn cart-qty-minus" aria-label="Decrease quantity" ${(item.quantity || 1) <= 1 ? 'disabled' : ''}>−</button>
                            <span class="qty-value">${item.quantity || 1}</span>
                            <button class="qty-btn cart-qty-plus" aria-label="Increase quantity">+</button>
                          </div>
                          <span class="cart-item__price">${formatCurrency(item.price * (item.quantity || 1))}</span>
                        </div>
                        <button class="cart-item__remove" aria-label="Remove ${item.name}">Remove</button>
                      </div>
                    </div>
                  `
                    )
                    .join('')}
                </div>

                <!-- Summary -->
                <div>
                  <div style="background:var(--color-surface);border-radius:var(--radius-lg);padding:var(--space-6);border:1px solid var(--color-border);position:sticky;top:calc(80px + var(--space-4))">
                    <h2 style="font-size:var(--text-base);font-weight:700;margin-bottom:var(--space-4);text-transform:uppercase;letter-spacing:var(--tracking-wide)">Order Summary</h2>
                    <div class="cart-summary-row">
                      <span>Subtotal (${cart.reduce((s, i) => s + (i.quantity || 1), 0)} items)</span>
                      <span>${formatCurrency(total)}</span>
                    </div>
                    <div class="cart-summary-row">
                      <span>Shipping</span>
                      <span style="color:var(--color-muted)">To be confirmed</span>
                    </div>
                    <div class="cart-summary-row total">
                      <span>Estimated Total</span>
                      <strong>${formatCurrency(total)}</strong>
                    </div>
                    <a href="#checkout" class="btn btn-primary btn-full btn-lg" style="margin-top:var(--space-5)">Proceed to Checkout</a>
                    <a href="#collection" class="btn btn-ghost btn-full btn-sm" style="margin-top:var(--space-2)">Continue Shopping</a>
                  </div>
                </div>
              </div>
            `
        }
      </div>
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

  // cleanup on navigation
  window.addEventListener('hashchange', () => unsub(), { once: true });
}

export default { render };

