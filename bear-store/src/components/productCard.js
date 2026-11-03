import { isInWishlist, toggleWishlist } from '../state/store.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { showToast } from './toast.js';
import { addItem } from '../services/cartService.js';

/**
 * Fallback SVG placeholder
 */
function makePlaceholderSVG(name, mode = 'bear') {
  const bgColor = mode === 'sow' ? '#EFE7DF' : '#F4F4F5';
  const textColor = mode === 'sow' ? '#8A625B' : '#71717A';
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return `
    <svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect width="300" height="400" fill="${bgColor}"/>
      <text x="150" y="185" font-family="'Space Grotesk', system-ui" font-size="44" font-weight="700" fill="${textColor}" text-anchor="middle" dominant-baseline="middle" opacity="0.4">${initials}</text>
      <text x="150" y="240" font-family="'Plus Jakarta Sans', system-ui" font-size="12" font-weight="600" fill="${textColor}" text-anchor="middle" opacity="0.4">${name}</text>
    </svg>
  `;
}

/**
 * Global Quick-Add Bottom Sheet / Modal
 * Opens a responsive slide-up sheet anchored to the screen — NEVER overflows inside the card
 */
export function openQuickAddSheet(product) {
  const existingSheet = document.getElementById('quick-add-sheet-root');
  if (existingSheet) existingSheet.remove();

  const root = document.createElement('div');
  root.id = 'quick-add-sheet-root';
  root.className = 'fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-200';

  let selectedSize = product.sizes.find((s) => s.available)?.size || 'M';
  let selectedColour = product.colours[0]?.name || 'Standard';
  const hasRealImage = product.images && product.images[0] && (product.images[0].startsWith('http') || product.images[0].startsWith('/'));
  const firstImage = hasRealImage ? product.images[0] : null;
  const isSow = product.mode === 'sow';

  root.innerHTML = `
    <div class="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto border border-zinc-100" role="dialog" aria-modal="true">
      <!-- Header: Thumb, Details & Close -->
      <div class="flex items-start justify-between pb-3 border-b border-zinc-100">
        <div class="flex items-center gap-3">
          <div class="w-14 h-16 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
            ${
              firstImage
                ? `<img src="${firstImage}" alt="${product.name}" class="w-full h-full object-cover" />`
                : makePlaceholderSVG(product.name, product.mode)
            }
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-headline">${product.mode.toUpperCase()}</p>
            <h3 class="text-sm font-bold text-zinc-900 font-headline line-clamp-1">${product.name}</h3>
            <div class="flex items-baseline gap-1.5 mt-0.5">
              <span class="text-sm font-bold text-zinc-950 font-headline">₹${product.price.toLocaleString('en-IN')}</span>
              ${product.compareAtPrice ? `<span class="text-xs text-zinc-400 line-through">₹${product.compareAtPrice.toLocaleString('en-IN')}</span>` : ''}
            </div>
          </div>
        </div>
        <button id="qa-close-btn" class="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-black transition-colors cursor-pointer" aria-label="Close">
          ✕
        </button>
      </div>

      <!-- Colour Selection -->
      ${
        product.colours.length > 1
          ? `
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold uppercase tracking-wider text-zinc-700 font-headline">Colour: <span id="qa-colour-name" class="font-normal text-zinc-500">${selectedColour}</span></span>
          </div>
          <div class="flex items-center gap-2">
            ${product.colours
              .map(
                (c, idx) => `
              <button class="qa-colour-btn w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                idx === 0 ? (isSow ? 'border-[#80534C] ring-2 ring-offset-2 ring-[#80534C]' : 'border-black ring-2 ring-offset-2 ring-black') : 'border-zinc-200 hover:border-zinc-400'
              }" style="background-color:${c.hex}" data-colour="${c.name}" title="${c.name}"></button>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      <!-- Size Selection (Touch-friendly 44px pills) -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-zinc-700 font-headline">Select Size</span>
          <span class="text-[11px] text-zinc-400">Regular fit</span>
        </div>
        <div class="grid grid-cols-5 gap-2">
          ${product.sizes
            .map(
              (s) => `
            <button class="qa-size-btn h-11 rounded-lg border font-headline text-xs font-bold transition-all cursor-pointer ${
              s.size === selectedSize
                ? isSow
                  ? 'border-[#80534C] bg-[#80534C] text-white shadow-sm'
                  : 'border-black bg-black text-white shadow-sm'
                : s.available
                ? 'border-zinc-200 bg-white text-zinc-800 hover:border-black'
                : 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed line-through'
            }" data-size="${s.size}" ${!s.available ? 'disabled' : ''}>
              ${s.size}
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Add to Bag CTA Button -->
      <button id="qa-submit-btn" class="w-full py-3.5 rounded-full ${
        isSow ? 'bg-[#80534C]' : 'bg-black'
      } text-white font-headline text-xs uppercase font-bold tracking-wider hover:opacity-90 active:scale-[0.99] transition-all shadow-md mt-1 cursor-pointer">
        Add to Bag • ₹${product.price.toLocaleString('en-IN')}
      </button>
    </div>
  `;

  document.body.appendChild(root);

  // Close Sheet Function
  const close = () => root.remove();

  root.querySelector('#qa-close-btn')?.addEventListener('click', close);
  root.addEventListener('click', (e) => {
    if (e.target === root) close();
  });

  // Colour Selection Handler
  root.querySelectorAll('.qa-colour-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedColour = btn.dataset.colour;
      const label = root.querySelector('#qa-colour-name');
      if (label) label.textContent = selectedColour;

      root.querySelectorAll('.qa-colour-btn').forEach((b) => {
        b.className = `qa-colour-btn w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
          b.dataset.colour === selectedColour
            ? isSow
              ? 'border-[#80534C] ring-2 ring-offset-2 ring-[#80534C]'
              : 'border-black ring-2 ring-offset-2 ring-black'
            : 'border-zinc-200 hover:border-zinc-400'
        }`;
      });
    });
  });

  // Size Selection Handler
  root.querySelectorAll('.qa-size-btn:not([disabled])').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedSize = btn.dataset.size;
      root.querySelectorAll('.qa-size-btn:not([disabled])').forEach((b) => {
        const isMatch = b.dataset.size === selectedSize;
        b.className = `qa-size-btn h-11 rounded-lg border font-headline text-xs font-bold transition-all cursor-pointer ${
          isMatch
            ? isSow
              ? 'border-[#80534C] bg-[#80534C] text-white shadow-sm'
              : 'border-black bg-black text-white shadow-sm'
            : 'border-zinc-200 bg-white text-zinc-800 hover:border-black'
        }`;
      });
    });
  });

  // Submit Handler
  root.querySelector('#qa-submit-btn')?.addEventListener('click', () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      colour: selectedColour,
      image: firstImage,
      mode: product.mode,
    });
    showToast(`Added ${product.name} (${selectedSize}) to Bag!`, 'success');
    close();
  });
}

/**
 * Create a full Flipkart-style e-commerce product card DOM element
 * Self-contained, balanced, and never overflows
 */
export function createProductCard(product) {
  const card = document.createElement('article');
  card.className = 'group flex flex-col cursor-pointer bg-white rounded-none sm:rounded-sm overflow-hidden hover:shadow-md transition-shadow duration-200 border border-zinc-200/80 p-2 sm:p-2.5';
  card.setAttribute('data-purpose', 'product-card');
  card.setAttribute('data-product-id', product.id);

  const wishlisted = isInWishlist(product.id);
  const displayColours = product.colours.slice(0, 3);
  const extraColours = product.colours.length - 3;
  const hasRealImage = product.images && product.images[0] && (product.images[0].startsWith('http') || product.images[0].startsWith('/'));
  const firstImage = hasRealImage ? product.images[0] : null;

  const discountPercent = product.compareAtPrice && product.compareAtPrice > product.price 
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) 
    : null;

  card.innerHTML = `
    <!-- Thumbnail Container with 4:5 aspect ratio (Non-curved clean straight edges) -->
    <div class="relative bg-zinc-100 rounded-none overflow-hidden aspect-[4/5] mb-2">
      <a href="#product/${product.slug}" class="block w-full h-full no-underline hover:no-underline" aria-label="View ${product.name}">
        ${
          firstImage
            ? `<img src="${firstImage}" alt="${product.name}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 rounded-none" loading="lazy" onerror="this.parentElement.innerHTML='${makePlaceholderSVG(product.name, product.mode).replace(/'/g, "\\'")}'" />`
            : makePlaceholderSVG(product.name, product.mode)
        }
      </a>

      <!-- Badges: Top Left -->
      <div class="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
        ${product.new ? '<span class="px-2 py-0.5 rounded-none bg-black text-white font-headline text-[9px] uppercase font-bold tracking-wider shadow-xs">New</span>' : ''}
        ${product.bestseller ? '<span class="px-2 py-0.5 rounded-none bg-amber-500 text-white font-headline text-[9px] uppercase font-bold tracking-wider shadow-xs">Top Seller</span>' : ''}
      </div>

      <!-- Wishlist Heart Button: Top Right -->
      <button class="wishlist-btn absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-zinc-700 hover:text-red-500 transition shadow-xs z-10 ${wishlisted ? 'text-red-500' : ''}" aria-label="${wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}" aria-pressed="${wishlisted}">
        <svg class="w-4 h-4 stroke-[2]" fill="${wishlisted ? 'currentColor' : 'none'}" stroke="currentColor" viewbox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </button>

      <!-- Rating chip: Bottom Left -->
      <div class="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-none bg-black/75 backdrop-blur-xs text-white font-headline text-[10px] font-bold flex items-center gap-1 shadow-xs">
        <span class="text-amber-400 text-xs">★</span>
        <span>${product.rating || '4.8'}</span>
      </div>
    </div>

    <!-- Product Details -->
    <div class="px-0.5 flex flex-col flex-1">
      <div class="flex items-center justify-between mb-0.5">
        <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-headline">${product.mode === 'sow' ? 'SOW' : 'BEAR'}</span>
        <span class="text-[10px] text-zinc-400 font-medium">${product.category}</span>
      </div>

      <h2 class="text-xs sm:text-sm font-semibold text-zinc-900 line-clamp-1 hover:text-black">
        <a href="#product/${product.slug}" class="no-underline hover:no-underline text-zinc-900 hover:text-black block truncate">${product.name}</a>
      </h2>

      <!-- Price Row -->
      <div class="flex items-baseline gap-1.5 mt-1 flex-wrap">
        <span class="text-xs sm:text-sm font-bold text-zinc-950 font-headline">₹${product.price.toLocaleString('en-IN')}</span>
        ${product.compareAtPrice ? `<span class="text-[10px] text-zinc-400 line-through">₹${product.compareAtPrice.toLocaleString('en-IN')}</span>` : ''}
        ${discountPercent ? `<span class="text-[10px] font-bold text-green-700">${discountPercent}% off</span>` : ''}
      </div>

      <!-- Color Swatches & Quick Add Button Row -->
      <div class="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-100">
        <div class="flex items-center space-x-1">
          ${displayColours
            .map(
              (c, i) =>
                `<span class="w-2.5 h-2.5 rounded-full border border-black/10 ${i === 0 ? 'ring-1 ring-offset-1 ring-zinc-400' : ''}" style="background-color:${c.hex}" title="${c.name}"></span>`
            )
            .join('')}
          ${extraColours > 0 ? `<span class="text-[9px] text-zinc-400 font-bold">+${extraColours}</span>` : ''}
        </div>

        <button class="card-add-btn px-2.5 py-1 rounded-full ${
          product.mode === 'sow' ? 'bg-[#80534C]' : 'bg-black'
        } text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all flex items-center gap-0.5 shadow-xs cursor-pointer" type="button">
          <span>+</span>
          <span>ADD</span>
        </button>
      </div>
    </div>
  `;

  // Wishlist click
  const wishlistBtn = card.querySelector('.wishlist-btn');
  wishlistBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isNowWishlisted = toggleWishlist(product.id);
    const svg = wishlistBtn.querySelector('svg');
    if (isNowWishlisted) {
      wishlistBtn.classList.add('text-red-500');
      wishlistBtn.setAttribute('aria-pressed', 'true');
      svg.setAttribute('fill', 'currentColor');
      showToast(`Saved "${product.name}" to wishlist`, 'info');
    } else {
      wishlistBtn.classList.remove('text-red-500');
      wishlistBtn.setAttribute('aria-pressed', 'false');
      svg.setAttribute('fill', 'none');
      showToast(`Removed from wishlist`, 'info');
    }
  });

  // Add to Bag click -> Opens the responsive Quick-Add Bottom Sheet
  const addBtn = card.querySelector('.card-add-btn');
  addBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickAddSheet(product);
  });

  return card;
}

export default { createProductCard, openQuickAddSheet };
