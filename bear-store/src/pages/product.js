import { getProductBySlug } from '../services/productService.js';
import { addItem } from '../services/cartService.js';
import { isInWishlist, toggleWishlist } from '../state/store.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { showToast } from '../components/toast.js';
import { createModal } from '../components/modal.js';

export async function render(container, slug) {
  container.innerHTML = `
    <div class="w-full flex items-center justify-center py-32">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  `;

  const product = await getProductBySlug(slug);

  if (!product) {
    container.innerHTML = `
      <div class="max-w-[1360px] mx-auto px-gutter-desktop py-24 text-center">
        <h1 class="font-headline-lg text-headline-lg font-bold uppercase text-primary mb-4 font-headline">Product Not Found</h1>
        <p class="text-on-surface-variant mb-6">The requested garment is currently unavailable or has been archived.</p>
        <a href="#collection" class="px-space-xl py-space-md rounded-full bg-primary text-on-primary font-headline-sm uppercase font-bold">Browse Collection</a>
      </div>
    `;
    return;
  }

  let selectedColour = product.colours[0]?.name || 'Standard';
  let selectedSize = product.sizes.find((s) => s.available)?.size || 'M';
  let quantity = 1;
  let activeImageIndex = 0;
  const productImages = product.images && product.images.length > 0 ? product.images : [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC0A_M4HqJNIIAusW1iTMaL94tnVHUlB2_7uyMjBw5mHw6BLBMJonDYlpbl1ks7zxdtF5jLW3oxBMrz9ZUSoacdbiSztre6lZoDTkvo9Apt6qGtxTxL2PLQibuZAUxKdZJVQD8YhaWaEAhApqCJQHkOjxDW8K-juFBWPSJxhzNXraK5jbwy0Vfos7iF5tBILTs-ByqMTeXYzQYYE66yCKJF6mcKz8kT6DF0rxTO3w'
  ];

  const page = document.createElement('div');
  page.className = 'w-full flex flex-col pt-16 md:pt-20 pb-24 md:pb-12';

  page.innerHTML = `
    <div class="max-w-[1360px] mx-auto w-full px-4 sm:px-6 md:px-gutter-desktop pt-4 pb-space-xl">
      <!-- Breadcrumb / Go Back Link -->
      <div class="mb-3 flex items-center gap-2">
        <a href="#collection" class="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-black transition-colors no-underline">
          <span class="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Collection</span>
        </a>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
        <!-- LEFT: Product Visual Gallery (7 Cols) -->
        <div class="lg:col-span-7 flex flex-col md:flex-row gap-space-md lg:sticky lg:top-24">
          <!-- Vertical Thumbnails -->
          <div class="order-2 md:order-1 flex md:flex-col gap-space-sm overflow-x-auto md:overflow-y-auto no-scrollbar shrink-0 md:w-24" id="thumb-strip">
            ${productImages
              .map(
                (img, idx) => `
                <button class="thumb-btn relative rounded-DEFAULT overflow-hidden p-0.5 ${
                  idx === 0 ? 'bg-primary' : 'bg-surface-container'
                } transition-all duration-200 aspect-[4/5] w-20 md:w-full group cursor-pointer" data-index="${idx}" type="button">
                  <img src="${img}" alt="${product.name} thumb ${idx + 1}" class="w-full h-full object-cover rounded-DEFAULT" />
                </button>
              `
              )
              .join('')}
          </div>

          <!-- Focal High-Resolution Image Frame -->
          <div class="order-1 md:order-2 flex-1 relative rounded-DEFAULT overflow-hidden bg-surface-container aspect-[3/4] shadow-sm border border-outline-variant/30">
            <div class="relative w-full h-full overflow-hidden">
              <img 
                id="main-product-image" 
                src="${productImages[0]}" 
                alt="${product.name}" 
                class="w-full h-full object-cover transition-opacity duration-300" 
              />
              <div class="absolute top-space-md left-space-md flex flex-col gap-space-xs">
                <span class="px-space-md py-space-xs rounded-full bg-white/90 backdrop-blur-md font-label-caps text-label-caps text-on-surface uppercase tracking-wider shadow-sm font-bold">
                  ${product.mode === 'sow' ? 'SculptSpun Compressive' : '260 GSM Heavyweight'}
                </span>
                <span class="px-space-md py-space-xs rounded-full bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-wider font-bold">
                  Pre-Shrunk
                </span>
              </div>
              <button id="pdp-wishlist-btn" class="absolute top-space-md right-space-md w-11 h-11 rounded-full bg-white/90 backdrop-blur-md text-on-surface flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all" type="button" aria-label="Save to Wishlist">
                <span class="material-symbols-outlined text-[20px] ${isInWishlist(product.id) ? 'text-error' : ''}" style="${isInWishlist(product.id) ? "font-variation-settings: 'FILL' 1;" : ''}">
                  ${isInWishlist(product.id) ? 'favorite' : 'favorite_border'}
                </span>
              </button>

              <!-- Gallery Arrows -->
              ${productImages.length > 1 ? `
                <button id="prev-img-btn" class="absolute left-space-md top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm text-on-surface hover:bg-white hover:scale-105 flex items-center justify-center transition-all shadow-sm" type="button">
                  <span class="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button id="next-img-btn" class="absolute right-space-md top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm text-on-surface hover:bg-white hover:scale-105 flex items-center justify-center transition-all shadow-sm" type="button">
                  <span class="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- RIGHT: Product Details & Purchase Form (5 Cols) -->
        <div class="lg:col-span-5 flex flex-col pt-space-xs">
          <div class="flex items-center justify-between mb-space-sm">
            <nav class="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
              <a href="#" class="hover:text-primary transition-colors">Home</a>
              <span>/</span>
              <a href="#collection" class="hover:text-primary transition-colors">Collection</a>
              <span>/</span>
              <span class="text-on-surface font-medium">${product.category}</span>
            </nav>
            <span class="px-space-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-caps text-label-caps uppercase font-bold">
              ${product.bestseller ? 'Best Seller' : 'In Stock'}
            </span>
          </div>

          <h1 class="font-headline-lg text-headline-lg text-primary tracking-tight uppercase font-bold mb-space-xs font-headline">
            ${product.name}
          </h1>

          <div class="flex items-center gap-space-md pb-space-md mb-space-md border-b border-outline-variant/30">
            <div class="flex items-center gap-1 text-primary">
              <span class="material-symbols-outlined text-[18px] text-amber-500" style="font-variation-settings: 'FILL' 1;">star</span>
              <span class="font-headline-sm text-headline-sm font-bold font-headline">${product.rating || '4.8'}</span>
              <span class="font-body-sm text-body-sm text-on-surface-variant underline ml-1 cursor-pointer">(${product.reviewCount || '256'} reviews)</span>
            </div>
            <span class="text-outline-variant">•</span>
            <span class="font-label-caps text-label-caps text-green-700 uppercase font-bold">Pan-India Express</span>
          </div>

          <!-- Price Display -->
          <div class="flex items-baseline gap-space-md mb-space-lg">
            <span class="font-price-hero text-[36px] font-bold text-primary font-headline">${formatCurrency(product.price)}</span>
            ${product.compareAtPrice ? `
              <span class="font-body-lg text-body-lg line-through text-on-surface-variant font-headline">${formatCurrency(product.compareAtPrice)}</span>
              <span class="px-space-xs py-0.5 rounded bg-green-100 text-green-800 font-label-caps text-xs font-bold uppercase">Save ${(100 - (product.price / product.compareAtPrice) * 100).toFixed(0)}%</span>
            ` : ''}
          </div>

          <p class="font-body-md text-body-md text-on-surface-variant mb-space-lg leading-relaxed">
            ${product.description}
          </p>

          <!-- Color Selector -->
          <div class="flex flex-col gap-space-xs mb-space-lg">
            <div class="flex items-center justify-between">
              <span class="font-label-caps text-label-caps uppercase tracking-wider text-primary font-bold">Color: <span id="color-name-display" class="font-normal text-on-surface-variant">${selectedColour}</span></span>
            </div>
            <div class="flex items-center gap-space-sm pt-1" id="pdp-colors-row">
              ${product.colours
                .map(
                  (c, idx) => `
                  <button class="w-8 h-8 rounded-full border border-black/20 transition-all ${
                    idx === 0 ? 'ring-2 ring-primary ring-offset-2' : ''
                  }" style="background-color:${c.hex}" title="${c.name}" data-color="${c.name}" type="button"></button>
                `
                )
                .join('')}
            </div>
          </div>

          <!-- Size Selector -->
          <div class="flex flex-col gap-space-xs mb-space-lg">
            <div class="flex items-center justify-between">
              <span class="font-label-caps text-label-caps uppercase tracking-wider text-primary font-bold">Select Size</span>
              <button id="size-guide-btn" class="font-label-caps text-label-caps uppercase text-primary underline hover:text-on-surface-variant transition-colors cursor-pointer font-bold" type="button">
                Size Guide
              </button>
            </div>
            <div class="grid grid-cols-5 gap-space-xs pt-1" id="pdp-sizes-grid">
              ${product.sizes
                .map(
                  (s) => `
                  <button class="pdp-size-btn h-12 rounded-DEFAULT font-label-caps text-label-caps font-bold transition-all flex items-center justify-center border ${
                    !s.available
                      ? 'opacity-40 cursor-not-allowed line-through bg-surface-container border-transparent'
                      : s.size === selectedSize
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/30'
                  }" data-size="${s.size}" ${!s.available ? 'disabled' : ''} type="button">
                    ${s.size}
                  </button>
                `
                )
                .join('')}
            </div>
          </div>

          <!-- Quantity & Add to Bag -->
          <div class="flex items-center gap-space-md mb-space-xl">
            <div class="flex items-center border border-outline-variant rounded-full bg-surface-container-low px-2 py-1">
              <button id="qty-minus-btn" class="w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-surface-container transition-colors" type="button">
                <span class="material-symbols-outlined text-[16px]">remove</span>
              </button>
              <span id="qty-display" class="w-8 text-center font-headline-sm text-sm font-bold font-headline">1</span>
              <button id="qty-plus-btn" class="w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-surface-container transition-colors" type="button">
                <span class="material-symbols-outlined text-[16px]">add</span>
              </button>
            </div>

            <button id="pdp-add-to-bag-btn" class="flex-1 py-4 px-space-xl rounded-full bg-primary text-on-primary font-headline-sm text-headline-sm font-bold uppercase tracking-wider shadow-lg hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-space-sm font-headline cursor-pointer" type="button">
              <span class="material-symbols-outlined text-[20px]">shopping_bag</span>
              <span>ADD TO BAG</span>
            </button>
          </div>

          <!-- Product Accordions -->
          <div class="flex flex-col border-t border-outline-variant/30 divide-y divide-outline-variant/30">
            <details class="py-space-md group cursor-pointer" open>
              <summary class="flex items-center justify-between list-none font-headline-sm text-sm uppercase text-primary font-bold font-headline">
                <span>Fit & Specifications</span>
                <span class="material-symbols-outlined text-[20px] text-on-surface-variant transition-transform duration-200 group-open:rotate-180">expand_more</span>
              </summary>
              <div class="pt-space-sm font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                ${product.fit}
              </div>
            </details>

            <details class="py-space-md group cursor-pointer">
              <summary class="flex items-center justify-between list-none font-headline-sm text-sm uppercase text-primary font-bold font-headline">
                <span>Fabric & Care Instructions</span>
                <span class="material-symbols-outlined text-[20px] text-on-surface-variant transition-transform duration-200 group-open:rotate-180">expand_more</span>
              </summary>
              <div class="pt-space-sm font-body-sm text-body-sm text-on-surface-variant leading-relaxed space-y-1">
                <p><strong>Fabric:</strong> ${product.fabric}</p>
                <p><strong>Care:</strong> ${product.care}</p>
              </div>
            </details>

            <details class="py-space-md group cursor-pointer">
              <summary class="flex items-center justify-between list-none font-headline-sm text-sm uppercase text-primary font-bold font-headline">
                <span>Domestic Delivery & 7-Day Doorstep Swaps</span>
                <span class="material-symbols-outlined text-[20px] text-on-surface-variant transition-transform duration-200 group-open:rotate-180">expand_more</span>
              </summary>
              <div class="pt-space-sm font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                ${product.delivery}
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  `;

  // Gallery thumbnail click
  const mainImg = page.querySelector('#main-product-image');
  const thumbBtns = page.querySelectorAll('.thumb-btn');

  function setActiveThumb(idx) {
    activeImageIndex = idx;
    if (mainImg) mainImg.src = productImages[idx];
    thumbBtns.forEach((btn, i) => {
      btn.className = i === idx
        ? 'thumb-btn relative rounded-DEFAULT overflow-hidden p-0.5 bg-primary transition-all duration-200 aspect-[4/5] w-20 md:w-full group cursor-pointer'
        : 'thumb-btn relative rounded-DEFAULT overflow-hidden p-0.5 bg-surface-container transition-all duration-200 aspect-[4/5] w-20 md:w-full group cursor-pointer';
    });
  }

  thumbBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveThumb(Number(btn.dataset.index));
    });
  });

  page.querySelector('#prev-img-btn')?.addEventListener('click', () => {
    const nextIdx = (activeImageIndex - 1 + productImages.length) % productImages.length;
    setActiveThumb(nextIdx);
  });

  page.querySelector('#next-img-btn')?.addEventListener('click', () => {
    const nextIdx = (activeImageIndex + 1) % productImages.length;
    setActiveThumb(nextIdx);
  });

  // Color selection
  page.querySelectorAll('#pdp-colors-row button').forEach((btn) => {
    btn.addEventListener('click', () => {
      page.querySelectorAll('#pdp-colors-row button').forEach((b) => b.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'));
      btn.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      selectedColour = btn.dataset.color;
      page.querySelector('#color-name-display').textContent = selectedColour;
    });
  });

  // Size selection
  page.querySelectorAll('.pdp-size-btn:not([disabled])').forEach((btn) => {
    btn.addEventListener('click', () => {
      page.querySelectorAll('.pdp-size-btn:not([disabled])').forEach((b) => {
        b.className = 'pdp-size-btn h-12 rounded-DEFAULT font-label-caps text-label-caps font-bold transition-all flex items-center justify-center border bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/30';
      });
      btn.className = 'pdp-size-btn h-12 rounded-DEFAULT font-label-caps text-label-caps font-bold transition-all flex items-center justify-center border bg-primary text-on-primary border-primary shadow-sm';
      selectedSize = btn.dataset.size;
    });
  });

  // Quantity controls
  const qtyDisplay = page.querySelector('#qty-display');
  page.querySelector('#qty-minus-btn')?.addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      qtyDisplay.textContent = quantity;
    }
  });

  page.querySelector('#qty-plus-btn')?.addEventListener('click', () => {
    quantity++;
    qtyDisplay.textContent = quantity;
  });

  // Add to Bag CTA
  page.querySelector('#pdp-add-to-bag-btn')?.addEventListener('click', () => {
    addItem(product, selectedColour, selectedSize, quantity);
    showToast(`Added ${quantity}× ${product.name} (${selectedSize}) to bag`, 'success');
  });

  // Wishlist toggle
  const pdpWishlist = page.querySelector('#pdp-wishlist-btn');
  pdpWishlist?.addEventListener('click', () => {
    const isNow = toggleWishlist(product.id);
    const icon = pdpWishlist.querySelector('.material-symbols-outlined');
    if (isNow) {
      icon.classList.add('text-error');
      icon.textContent = 'favorite';
      icon.style.fontVariationSettings = "'FILL' 1";
      showToast(`Saved "${product.name}" to wishlist`, 'info');
    } else {
      icon.classList.remove('text-error');
      icon.textContent = 'favorite_border';
      icon.style.fontVariationSettings = '';
      showToast(`Removed from wishlist`, 'info');
    }
  });

  // Size Guide Modal
  page.querySelector('#size-guide-btn')?.addEventListener('click', () => {
    const modalContent = `
      <div class="p-2 space-y-4">
        <p class="text-sm text-on-surface-variant">Measurements in centimeters. All BEAR tees feature an oversized relaxed drape.</p>
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="border-b border-outline-variant/40">
              <th class="py-2 font-bold font-headline">Size</th>
              <th class="py-2 font-bold font-headline">Chest</th>
              <th class="py-2 font-bold font-headline">Length</th>
              <th class="py-2 font-bold font-headline">Sleeve</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/20">
            <tr><td class="py-2 font-bold">S</td><td class="py-2">106</td><td class="py-2">71</td><td class="py-2">22</td></tr>
            <tr><td class="py-2 font-bold">M</td><td class="py-2">112</td><td class="py-2">74</td><td class="py-2">23</td></tr>
            <tr><td class="py-2 font-bold">L</td><td class="py-2">118</td><td class="py-2">76</td><td class="py-2">24</td></tr>
            <tr><td class="py-2 font-bold">XL</td><td class="py-2">124</td><td class="py-2">78</td><td class="py-2">25</td></tr>
            <tr><td class="py-2 font-bold">XXL</td><td class="py-2">130</td><td class="py-2">80</td><td class="py-2">26</td></tr>
          </tbody>
        </table>
      </div>
    `;
    const guideModal = createModal({ id: 'size-guide-modal', title: 'Ergonomic Sizing Guide', content: modalContent });
    guideModal.open();
  });

  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };
