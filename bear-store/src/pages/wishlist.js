import { getWishlist, isInWishlist, toggleWishlist, subscribe } from '../state/store.js';
import { products } from '../data/products.js';
import { createProductCard } from '../components/productCard.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { addItem } from '../services/cartService.js';
import { showToast } from '../components/toast.js';

export function render(container) {
  const page = document.createElement('div');
  page.className = 'page';
  page.style.paddingTop = 'calc(72px + var(--space-8))';

  function buildPage() {
    const wishlistIds = getWishlist();
    const wishlisted = products.filter((p) => wishlistIds.includes(p.id));

    page.innerHTML = `
      <div class="container">
        <div class="page-header" style="padding-top:0">
          <h1>Wishlist (${wishlisted.length})</h1>
        </div>
        ${
          wishlisted.length === 0
            ? `<div class="empty-state">
                <div class="empty-state__icon">♡</div>
                <h2 class="empty-state__title">Your wishlist is empty</h2>
                <p class="empty-state__desc">Save items you love by tapping the heart on any product.</p>
                <a href="#collection" class="btn btn-primary">Explore Collection</a>
              </div>`
            : `<div class="wishlist-grid" id="wishlist-grid"></div>`
        }
      </div>
    `;

    const grid = page.querySelector('#wishlist-grid');
    if (grid) {
      wishlisted.forEach((product) => {
        const card = createProductCard(product);
        grid.appendChild(card);
      });
    }
  }

  buildPage();
  container.innerHTML = '';
  container.appendChild(page);

  const unsub = subscribe(() => buildPage());
  window.addEventListener('hashchange', () => unsub(), { once: true });
}

export default { render };

