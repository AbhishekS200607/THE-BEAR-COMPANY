import { getWishlist, isInWishlist, toggleWishlist, subscribe } from '../state/store.js';
import { products } from '../data/products.js';
import { createProductCard } from '../components/productCard.js';
import { addItem } from '../services/cartService.js';
import { showToast } from '../components/toast.js';
import { renderEmptyIllustration } from '../components/emptyState.js';

export function render(container) {
  const page = document.createElement('div');
  page.className = 'w-full max-w-[1360px] mx-auto px-4 sm:px-6 md:px-gutter-desktop pt-20 md:pt-24 pb-32';

  function buildPage() {
    const wishlistIds = getWishlist();
    const wishlisted = products.filter((p) => wishlistIds.includes(p.id));

    page.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-widest text-zinc-400 font-headline mb-0.5">SAVED ROTATION</p>
          <h1 class="font-headline text-2xl md:text-3xl font-extrabold uppercase text-zinc-950">Wishlist (${wishlisted.length})</h1>
        </div>

        ${
          wishlisted.length > 0
            ? `
            <button id="add-all-to-bag-btn" class="px-6 py-3 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider font-headline hover:bg-zinc-800 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto">
              <span class="material-symbols-outlined text-[18px]">shopping_bag</span>
              <span>Add All to Bag (${wishlisted.length})</span>
            </button>
          `
            : ''
        }
      </div>

      ${
        wishlisted.length === 0
          ? `
          <div class="py-20 text-center bg-white rounded-2xl border border-zinc-200">
            ${renderEmptyIllustration('wishlist')}
            <h2 class="font-headline text-xl font-bold uppercase text-zinc-950 mb-1">Your wishlist is empty</h2>
            <p class="text-xs text-zinc-500 mb-6 max-w-sm mx-auto">Save pieces you love by tapping the heart icon on any garment to curate your training lineup.</p>
            <a href="#collection" class="inline-block px-8 py-3 rounded-full bg-black text-white text-xs font-bold uppercase font-headline tracking-wider hover:bg-zinc-800 transition-colors shadow-sm no-underline">
              Explore Collection
            </a>
          </div>
        `
          : `<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" id="wishlist-grid"></div>`
      }
    `;

    const grid = page.querySelector('#wishlist-grid');
    if (grid) {
      wishlisted.forEach((product) => {
        const card = createProductCard(product);
        grid.appendChild(card);
      });
    }

    // Add All to Bag Handler (Item 21)
    page.querySelector('#add-all-to-bag-btn')?.addEventListener('click', () => {
      let addedCount = 0;
      wishlisted.forEach((p) => {
        const colour = p.colours?.[0]?.name || 'Standard';
        const sizeObj = p.sizes?.find((s) => s.available) || p.sizes?.[0];
        const size = sizeObj?.size || 'M';
        addItem(p, colour, size, 1);
        addedCount++;
      });
      showToast(`Added all ${addedCount} wishlist pieces to your bag!`, 'success');
    });
  }

  buildPage();
  container.innerHTML = '';
  container.appendChild(page);

  const unsub = subscribe(() => buildPage());
  window.addEventListener('hashchange', () => unsub(), { once: true });
}

export default { render };
