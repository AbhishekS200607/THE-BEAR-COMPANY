import { getProductBySlug } from '../services/productService.js';
import { products } from '../data/products.js';
import { addItem } from '../services/cartService.js';
import { isInWishlist, toggleWishlist } from '../state/store.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { showToast } from '../components/toast.js';
import { createModal } from '../components/modal.js';
import { createProductCard } from '../components/productCard.js';
import { recordView, getRecentlyViewedIds } from '../services/recentlyViewedService.js';
import { openSizeRecommender } from '../components/sizeRecommender.js';
import { openRestockModal } from '../components/restockNotifyModal.js';
import { skeletonProduct } from '../utils/skeletons.js';
import { flyToCart } from '../utils/animations.js';
import {
  fetchProductReviews,
  postProductReview,
  updateProductReview,
  deleteProductReview,
  calculateReviewMetrics,
  isMyReview,
  recordMyReviewId,
} from '../services/reviewService.js';

export async function render(container, slug) {
  container.innerHTML = `<div class="w-full flex flex-col pt-20 md:pt-24">${skeletonProduct()}</div>`;

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

  // Record this product in recently viewed
  recordView(product.id);

  // Ensure sizes are unique by size name to protect against stale sessionStorage cache or raw payloads
  const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  const sizeMap = new Map();
  (product.sizes || []).forEach((s) => {
    const sizeName = typeof s === 'string' ? s : s?.size;
    if (!sizeName) return;
    const isAvail = s.available !== undefined ? Boolean(s.available) : true;
    if (!sizeMap.has(sizeName)) {
      sizeMap.set(sizeName, {
        size: sizeName,
        variantId: s.variantId || null,
        available: isAvail,
        sku: s.sku || null,
      });
    } else if (isAvail) {
      sizeMap.get(sizeName).available = true;
    }
  });
  if (sizeMap.size > 0) {
    product.sizes = Array.from(sizeMap.values()).sort((a, b) => {
      const idxA = SIZE_ORDER.indexOf(a.size);
      const idxB = SIZE_ORDER.indexOf(b.size);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.size.localeCompare(b.size);
    });
  }

  let selectedColour = product.colours[0]?.name || 'Standard';
  let selectedSize = product.sizes.find((s) => s.available)?.size || 'M';
  let quantity = 1;
  let activeImageIndex = 0;
  const productImages = product.images && product.images.length > 0 ? product.images : [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC0A_M4HqJNIIAusW1iTMaL94tnVHUlB2_7uyMjBw5mHw6BLBMJonDYlpbl1ks7zxdtF5jLW3oxBMrz9ZUSoacdbiSztre6lZoDTkvo9Apt6qGtxTxL2PLQibuZAUxKdZJVQD8YhaWaEAhApqCJQHkOjxDW8K-juFBWPSJxhzNXraK5jbwy0Vfos7iF5tBILTs-ByqMTeXYzQYYE66yCKJF6mcKz8kT6DF0rxTO3w'
  ];

  // Authentic product reviews and calculated metrics from server (bounded preview to 3 reviews)
  const { reviews: fetchedReviews, metrics: fetchedMetrics } = await fetchProductReviews(product.id, { limit: 3, sort: 'newest' });
  let reviews = fetchedReviews.slice(0, 3);
  let metrics = fetchedMetrics;

  const hasRealId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.id);

  function renderReviewCardHTML(r) {
    const mine = isMyReview(r.id);
    const dateStr = r.date || (r.created_at || r.createdAt ? new Date(r.created_at || r.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently');
    const isVer = r.isVerified !== undefined ? r.isVerified : (r.verified !== undefined ? r.verified : true);
    return `
      <div class="review-card-item p-5 rounded-xl border ${mine ? 'border-zinc-900 bg-zinc-50/70 shadow-xs' : 'border-zinc-200 bg-white shadow-2xs'} flex flex-col justify-between transition-all" id="review-card-${r.id}" data-id="${r.id}">
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-1 text-amber-500">
              ${Array.from({ length: r.rating || 5 }).map(() => `<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>`).join('')}
            </div>
            <div class="flex items-center gap-2">
              ${mine ? `<span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black text-white font-headline">Your Review</span>` : ''}
              <span class="text-[11px] text-zinc-400 font-mono">${dateStr}</span>
            </div>
          </div>
          <h3 class="font-headline text-sm font-bold text-zinc-950 mb-1 rev-card-title">${r.title || ''}</h3>
          <p class="text-xs text-zinc-600 leading-relaxed mb-3 rev-card-comment">${r.comment || ''}</p>
        </div>
        <div>
          <div class="flex items-center justify-between pt-2 border-t border-zinc-100 text-[11px] text-zinc-500">
            <span class="font-bold text-zinc-900 rev-card-author">${r.author || 'Anonymous'} ${isVer ? '<span class="text-emerald-700 ml-1">✓ Verified Athlete</span>' : ''}</span>
            <span class="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-medium rev-card-fit">${r.fit || 'True to Size'}</span>
          </div>
          ${mine ? `
          <div class="flex items-center justify-end gap-3 pt-2.5 mt-2.5 border-t border-zinc-200/70">
            <button class="edit-review-btn text-xs font-bold font-headline uppercase text-zinc-700 hover:text-black flex items-center gap-1 transition-colors cursor-pointer" data-id="${r.id}" type="button">
              <span class="material-symbols-outlined text-[15px]">edit</span>
              <span>Edit</span>
            </button>
            <button class="delete-review-btn text-xs font-bold font-headline uppercase text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors cursor-pointer" data-id="${r.id}" type="button">
              <span class="material-symbols-outlined text-[15px]">delete</span>
              <span>Delete</span>
            </button>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  const page = document.createElement('div');
  page.className = 'w-full flex flex-col pt-20 md:pt-24 pb-24 md:pb-16';

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
                <button class="thumb-btn relative rounded-xl overflow-hidden p-0.5 ${
                  idx === 0 ? 'ring-2 ring-black' : 'opacity-70 hover:opacity-100'
                } transition-all duration-200 aspect-[4/5] w-20 md:w-full group cursor-pointer bg-zinc-100 border border-zinc-200" data-index="${idx}" type="button" aria-label="View image ${idx + 1}">
                  <img src="${img}" alt="${product.name} thumb ${idx + 1}" class="w-full h-full object-cover rounded-lg" />
                </button>
              `
              )
              .join('')}
          </div>

          <!-- Focal High-Resolution Image Frame with Hover Zoom & Fullscreen Trigger -->
          <div class="order-1 md:order-2 flex-1 relative rounded-2xl overflow-hidden bg-zinc-100 aspect-[3/4] shadow-xs border border-zinc-200 pdp-zoom-container" id="pdp-main-image-wrap">
            <img 
              id="main-product-image" 
              src="${productImages[0]}" 
              alt="${product.name}" 
              class="w-full h-full object-cover pdp-zoom-image select-none transition-transform duration-200" 
            />

            <div class="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none">
              <span class="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-bold font-headline text-zinc-950 uppercase tracking-wider shadow-xs">
                ${product.mode === 'sow' ? 'SculptSpun Compressive' : '260 GSM Heavyweight'}
              </span>
              <span class="px-3 py-1 rounded-full bg-black text-white text-[10px] font-bold font-headline uppercase tracking-wider shadow-xs">
                Pre-Shrunk
              </span>
            </div>

            <!-- Wishlist & Lightbox Fullscreen Buttons -->
            <div class="absolute top-4 right-4 flex items-center gap-2">
              <button id="pdp-zoom-btn" class="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-zinc-900 flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer border border-zinc-200" type="button" aria-label="Zoom Image">
                <span class="material-symbols-outlined text-[18px]">zoom_in</span>
              </button>
              <button id="pdp-wishlist-btn" class="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-zinc-900 flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer border border-zinc-200" type="button" aria-label="Save to Wishlist">
                <span class="material-symbols-outlined text-[18px] ${isInWishlist(product.id) ? 'text-red-600' : ''}" style="${isInWishlist(product.id) ? "font-variation-settings: 'FILL' 1;" : ''}">
                  ${isInWishlist(product.id) ? 'favorite' : 'favorite_border'}
                </span>
              </button>
            </div>

            <!-- Gallery Arrows -->
            ${productImages.length > 1 ? `
              <button id="prev-img-btn" class="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm text-zinc-900 hover:bg-white hover:scale-105 flex items-center justify-center transition-all shadow-sm cursor-pointer border border-zinc-200" type="button" aria-label="Previous Image">
                <span class="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button id="next-img-btn" class="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm text-zinc-900 hover:bg-white hover:scale-105 flex items-center justify-center transition-all shadow-sm cursor-pointer border border-zinc-200" type="button" aria-label="Next Image">
                <span class="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- RIGHT: Product Details & Purchase Form (5 Cols) -->
        <div class="lg:col-span-5 flex flex-col pt-space-xs">
          <div class="flex items-center justify-between mb-space-sm">
            <nav class="flex items-center gap-space-xs text-xs text-zinc-500 font-medium">
              <a href="#" class="hover:text-black transition-colors">Home</a>
              <span>/</span>
              <a href="#collection" class="hover:text-black transition-colors">Collection</a>
              <span>/</span>
              <span class="text-zinc-900 font-bold">${product.category}</span>
            </nav>
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase tracking-wider font-headline border border-emerald-200">
              ${product.bestseller ? 'Best Seller' : 'In Stock'}
            </span>
          </div>

          <h1 class="font-headline text-2xl md:text-3xl font-extrabold uppercase text-zinc-950 tracking-tight mb-2">
            ${product.name}
          </h1>

          <div class="flex items-center gap-3 pb-3 mb-4 border-b border-zinc-100 text-xs">
            <div class="flex items-center gap-1 text-zinc-900">
              <span class="material-symbols-outlined text-[17px] text-amber-500" style="${Number(metrics.averageRating) > 0 ? "font-variation-settings: 'FILL' 1;" : "color: #d4d4d8;"}">star</span>
              <span class="font-headline font-bold" id="pdp-header-rating">${Number(metrics.averageRating) > 0 ? metrics.averageRating : 'New'}</span>
              <a href="#customer-reviews-section" id="pdp-header-reviews-link" class="text-zinc-500 hover:text-black underline ml-1 cursor-pointer">(${metrics.totalCount > 0 ? `${metrics.totalCount} reviews` : 'Write a Review'})</a>
            </div>
            <span class="text-zinc-300">•</span>
            <span class="text-emerald-700 font-bold uppercase text-[11px] font-headline">Free Pan-India Air Express</span>
          </div>

          <!-- Live Scarcity Radar Pulse (FOMO / Social Proof) -->
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50/90 border border-amber-200 text-amber-900 text-xs mb-4 shadow-2xs self-start">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span class="font-headline tracking-wide uppercase text-[10px] font-bold">
              High Demand: 7 athletes viewing now · Only 2 left in Size <strong id="radar-size-indicator">${selectedSize}</strong>
            </span>
          </div>

          <!-- Price Display -->
          <div class="flex items-baseline gap-3 mb-4">
            <span class="font-headline text-3xl font-black text-zinc-950">${formatCurrency(product.price)}</span>
            ${product.compareAtPrice ? `
              <span class="font-headline text-base line-through text-zinc-400">${formatCurrency(product.compareAtPrice)}</span>
              <span class="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 text-[11px] font-bold uppercase font-headline">Save ${(100 - (product.price / product.compareAtPrice) * 100).toFixed(0)}%</span>
            ` : ''}
          </div>

          <p class="text-xs sm:text-sm text-zinc-600 mb-6 leading-relaxed">
            ${product.description}
          </p>

          <!-- Color Selector -->
          <div class="flex flex-col gap-1.5 mb-5">
            <div class="flex items-center justify-between">
              <span class="text-xs uppercase tracking-wider text-zinc-900 font-bold font-headline">Color: <span id="color-name-display" class="font-normal text-zinc-500">${selectedColour}</span></span>
            </div>
            <div class="flex items-center gap-2 pt-1" id="pdp-colors-row">
              ${product.colours
                .map(
                  (c, idx) => `
                  <button class="w-8 h-8 rounded-full border border-black/20 transition-all ${
                    idx === 0 ? 'ring-2 ring-black ring-offset-2' : ''
                  }" style="background-color:${c.hex}" title="${c.name}" data-color="${c.name}" aria-label="Select ${c.name} colour" type="button"></button>
                `
                )
                .join('')}
            </div>
          </div>

          <!-- Size Selector with Size Recommender -->
          <div class="flex flex-col gap-1.5 mb-6">
            <div class="flex items-center justify-between">
              <span class="text-xs uppercase tracking-wider text-zinc-900 font-bold font-headline">Select Size: <strong id="pdp-selected-size-label">${selectedSize}</strong></span>
              <div class="flex items-center gap-3">
                <button id="whats-my-size-btn" class="text-xs text-zinc-900 font-bold font-headline uppercase underline hover:text-zinc-600 transition-colors flex items-center gap-1 cursor-pointer" type="button">
                  <span class="material-symbols-outlined text-[15px]">straighten</span>
                  <span>What's My Size?</span>
                </button>
                <button id="size-guide-btn" class="text-xs text-zinc-500 underline hover:text-black transition-colors cursor-pointer" type="button">
                  Size Guide
                </button>
              </div>
            </div>
            <div class="grid grid-cols-5 gap-2 pt-1" id="pdp-sizes-grid">
              ${product.sizes
                .map(
                  (s) => `
                  <button class="pdp-size-btn h-12 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border font-headline ${
                    !s.available
                      ? 'opacity-40 line-through bg-zinc-100 text-zinc-400 border-zinc-200 cursor-pointer'
                      : s.size === selectedSize
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-white hover:border-zinc-400 text-zinc-900 border-zinc-200'
                  }" data-size="${s.size}" data-available="${s.available ? 'true' : 'false'}" type="button" title="${!s.available ? 'Sold out - Click to get notified' : ''}">
                    <span>${s.size}</span>
                    ${!s.available ? '<span class="text-[8px] no-underline">Notify</span>' : ''}
                  </button>
                `
                )
                .join('')}
            </div>
          </div>

          <!-- Quantity & Add to Bag -->
          <div class="flex items-center gap-3 mb-8" id="pdp-cta-block">
            <div class="flex items-center border border-zinc-200 rounded-full bg-zinc-50 px-2 py-1">
              <button id="qty-minus-btn" class="w-8 h-8 rounded-full flex items-center justify-center text-zinc-900 hover:bg-zinc-200 transition-colors cursor-pointer" type="button" aria-label="Decrease quantity">
                <span class="material-symbols-outlined text-[16px]">remove</span>
              </button>
              <span id="qty-display" class="w-8 text-center text-xs font-bold font-headline" aria-live="polite">1</span>
              <button id="qty-plus-btn" class="w-8 h-8 rounded-full flex items-center justify-center text-zinc-900 hover:bg-zinc-200 transition-colors cursor-pointer" type="button" aria-label="Increase quantity">
                <span class="material-symbols-outlined text-[16px]">add</span>
              </button>
            </div>

            <button id="pdp-add-to-bag-btn" class="flex-1 py-4 px-6 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider shadow-lg hover:bg-zinc-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 font-headline cursor-pointer" type="button">
              <span class="material-symbols-outlined text-[18px]">shopping_bag</span>
              <span>ADD TO BAG</span>
            </button>
          </div>

          <!-- Product Accordions -->
          <div class="flex flex-col border-t border-zinc-200 divide-y divide-zinc-200">
            <details class="py-4 group cursor-pointer" open>
              <summary class="flex items-center justify-between list-none text-xs uppercase text-zinc-950 font-bold font-headline" aria-expanded="true">
                <span>Fit & Specifications</span>
                <span class="material-symbols-outlined text-[20px] text-zinc-400 transition-transform duration-200 group-open:rotate-180">expand_more</span>
              </summary>
              <div class="pt-2 text-xs text-zinc-600 leading-relaxed">
                ${product.fit}
              </div>
            </details>

            <details class="py-4 group cursor-pointer">
              <summary class="flex items-center justify-between list-none text-xs uppercase text-zinc-950 font-bold font-headline" aria-expanded="false">
                <span>Fabric & Care Instructions</span>
                <span class="material-symbols-outlined text-[20px] text-zinc-400 transition-transform duration-200 group-open:rotate-180">expand_more</span>
              </summary>
              <div class="pt-2 text-xs text-zinc-600 leading-relaxed space-y-1">
                <p><strong>Fabric:</strong> ${product.fabric}</p>
                <p><strong>Care:</strong> ${product.care}</p>
              </div>
            </details>

            <details class="py-4 group cursor-pointer">
              <summary class="flex items-center justify-between list-none text-xs uppercase text-zinc-950 font-bold font-headline" aria-expanded="false">
                <span>Domestic Delivery & 7-Day Doorstep Swaps</span>
                <span class="material-symbols-outlined text-[20px] text-zinc-400 transition-transform duration-200 group-open:rotate-180">expand_more</span>
              </summary>
              <div class="pt-2 text-xs text-zinc-600 leading-relaxed">
                ${product.delivery}
              </div>
            </details>
          </div>
        </div>
      </div>

      <!-- ============================================================
           REVIEWS & RATINGS SECTION (Item 8)
           ============================================================ -->
      <section id="customer-reviews-section" class="mt-16 pt-12 border-t border-zinc-200">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-widest text-zinc-400 font-headline mb-1">AUTHENTIC ATHLETE FEEDBACK</p>
            <h2 class="font-headline text-2xl font-extrabold uppercase text-zinc-950 tracking-tight">Customer Reviews</h2>
          </div>
          ${hasRealId ? `
          <button id="write-review-btn" class="px-5 py-2.5 rounded-full border border-black text-black hover:bg-black hover:text-white transition-colors text-xs font-bold uppercase font-headline self-start cursor-pointer">
            Write a Review
          </button>
          ` : `
          <button id="write-review-btn" disabled class="px-5 py-2.5 rounded-full border border-zinc-300 text-zinc-400 disabled opacity-50 cursor-not-allowed text-xs font-bold uppercase font-headline self-start">
            Live catalog required
          </button>
          `}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-10 bg-zinc-50 p-6 rounded-2xl border border-zinc-200">
          <!-- Left: Score & Fit Gauge -->
          <div class="md:col-span-4 text-center md:text-left md:border-r md:border-zinc-200 md:pr-6">
            <div class="font-headline text-5xl font-black text-zinc-950" id="pdp-avg-rating">${Number(metrics.averageRating) > 0 ? metrics.averageRating : '—'}</div>
            <div class="flex items-center justify-center md:justify-start gap-0.5 text-amber-500 my-1">
              ${[1, 2, 3, 4, 5].map((s) => `<span class="material-symbols-outlined text-[20px]" style="${Number(metrics.averageRating) >= s ? "font-variation-settings: 'FILL' 1;" : "color: #e4e4e7;"}">star</span>`).join('')}
            </div>
            <p class="text-xs text-zinc-500 font-medium" id="pdp-reviews-count">${metrics.totalCount > 0 ? `Based on ${metrics.totalCount} verified athlete purchases` : 'No reviews submitted yet'}</p>
            <div class="mt-4 pt-3 border-t border-zinc-200/80">
              <span class="text-[11px] font-bold uppercase text-zinc-700 font-headline">Fit Sentiment:</span>
              <p class="text-xs text-emerald-800 font-semibold mt-0.5" id="pdp-fit-sentiment">${metrics.fitSentiment}</p>
            </div>
          </div>

          <!-- Right: Star Breakdown -->
          <div class="md:col-span-8 space-y-2" id="pdp-star-breakdown">
            ${metrics.breakdown.map(
              (r) => `
              <div class="flex items-center gap-3 text-xs">
                <span class="w-12 text-zinc-600 font-mono font-bold">${r.stars} Stars</span>
                <div class="flex-1 h-2 rounded-full bg-zinc-200 overflow-hidden">
                  <div class="h-full bg-black rounded-full transition-all duration-500" style="width: ${r.pct}%"></div>
                </div>
                <span class="w-8 text-right text-zinc-400 font-mono text-[11px]">${r.pct}%</span>
              </div>
            `
            ).join('')}
          </div>
        </div>

        <!-- Review Cards Grid (Bounded to Top 3 Reviews with Scale Route 10A) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="reviews-list-container">
          ${reviews.length > 0
            ? reviews.slice(0, 3).map(renderReviewCardHTML).join('') + (
                (metrics.totalCount || reviews.length) > 3
                  ? `
                  <div class="col-span-1 md:col-span-2 text-center pt-4">
                    <a href="#product-reviews?productId=${encodeURIComponent(product.id)}" class="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-black bg-black text-white hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider font-headline transition-all shadow-xs">
                      View all ${metrics.totalCount || reviews.length} reviews
                      <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </a>
                  </div>
                  `
                  : ''
              )
            : `
            <div id="no-reviews-placeholder" class="col-span-1 md:col-span-2 py-10 px-6 rounded-2xl border border-dashed border-zinc-200 text-center bg-zinc-50/50">
              <span class="material-symbols-outlined text-[32px] text-zinc-400 mb-2">rate_review</span>
              <p class="font-headline text-sm font-bold uppercase text-zinc-900">No athlete reviews yet</p>
              <p class="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">Be the first athlete to test and review this garment in training.</p>
            </div>
          `}
        </div>
      </section>

      <!-- ============================================================
           YOU MAY ALSO LIKE / RELATED PRODUCTS (Item 9)
           ============================================================ -->
      <section class="mt-20 pt-12 border-t border-zinc-200">
        <div class="flex items-center justify-between mb-6">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-widest text-zinc-400 font-headline mb-0.5">COMPLETE THE ROTATION</p>
            <h2 class="font-headline text-2xl font-extrabold uppercase text-zinc-950 tracking-tight">You May Also Like</h2>
          </div>
          <a href="#collection" class="text-xs font-bold uppercase tracking-wider text-black underline font-headline hover:text-zinc-600">View All</a>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" id="related-products-grid"></div>
      </section>

      <!-- ============================================================
           RECENTLY VIEWED PRODUCTS (Item 4)
           ============================================================ -->
      <section class="mt-16 pt-12 border-t border-zinc-200 hidden" id="recently-viewed-section">
        <div class="mb-6">
          <p class="text-[11px] font-bold uppercase tracking-widest text-zinc-400 font-headline mb-0.5">YOUR RECENT EXPLORATION</p>
          <h2 class="font-headline text-2xl font-extrabold uppercase text-zinc-950 tracking-tight">Recently Viewed</h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" id="recently-viewed-grid"></div>
      </section>
    </div>

    <!-- ============================================================
         STICKY BOTTOM ADD-TO-BAG BAR (Item 5)
         ============================================================ -->
    <div id="sticky-pdp-bar" class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 p-3 sm:px-6 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] translate-y-full flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 min-w-0">
        <img src="${productImages[0]}" alt="${product.name}" class="w-10 h-12 object-cover rounded-lg shrink-0 border border-zinc-200" />
        <div class="min-w-0">
          <p class="text-xs font-bold text-zinc-950 truncate font-headline">${product.name}</p>
          <p class="text-[11px] text-zinc-500">${formatCurrency(product.price)} • Size: <strong class="text-zinc-900" id="sticky-size-display">${selectedSize}</strong></p>
        </div>
      </div>
      <button id="sticky-add-btn" class="py-2.5 px-6 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider shadow-md hover:bg-zinc-800 active:scale-95 transition-all shrink-0 font-headline cursor-pointer">
        Add to Bag
      </button>
    </div>
  `;

  // Gallery thumbnail switching
  const mainImg = page.querySelector('#main-product-image');
  const thumbBtns = page.querySelectorAll('.thumb-btn');

  function setActiveThumb(idx) {
    activeImageIndex = idx;
    if (mainImg) mainImg.src = productImages[idx];
    thumbBtns.forEach((btn, i) => {
      if (i === idx) {
        btn.classList.add('ring-2', 'ring-black');
        btn.classList.remove('opacity-70');
      } else {
        btn.classList.remove('ring-2', 'ring-black');
        btn.classList.add('opacity-70');
      }
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

  // Desktop Hover Magnifier Lens & Click Lightbox (Item 6)
  const imageWrap = page.querySelector('#pdp-main-image-wrap');
  if (imageWrap && mainImg) {
    imageWrap.addEventListener('mousemove', (e) => {
      const rect = imageWrap.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mainImg.style.transformOrigin = `${x}% ${y}%`;
    });

    imageWrap.addEventListener('mouseleave', () => {
      mainImg.style.transformOrigin = 'center center';
    });

    // Lightbox modal on zoom button or image click
    const openLightbox = () => {
      const modal = createModal({
        id: 'image-lightbox-modal',
        title: product.name,
        content: `
          <div class="flex items-center justify-center p-2">
            <img src="${productImages[activeImageIndex]}" alt="${product.name}" class="max-h-[80vh] w-auto max-w-full rounded-xl object-contain shadow-2xl" />
          </div>
        `,
      });
      modal.open();
    };

    page.querySelector('#pdp-zoom-btn')?.addEventListener('click', openLightbox);
  }

  // Color selection
  function updateSizesForColour(colourName) {
    if (!product.variants || product.variants.length === 0) return;
    const colourVariants = product.variants.filter((v) => !v.colour || v.colour.toLowerCase() === colourName.toLowerCase());
    page.querySelectorAll('.pdp-size-btn').forEach((btn) => {
      const sizeVal = btn.dataset.size;
      const match = colourVariants.find((v) => v.size === sizeVal);
      const isAvail = match ? match.available : true;
      btn.dataset.available = isAvail ? 'true' : 'false';
      if (!isAvail) {
        btn.className = 'pdp-size-btn h-12 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border font-headline opacity-40 line-through bg-zinc-100 text-zinc-400 border-zinc-200 cursor-pointer';
        btn.title = 'Sold out - Click to get notified';
        if (!btn.querySelector('.notify-badge')) {
          const badge = document.createElement('span');
          badge.className = 'text-[8px] no-underline notify-badge';
          badge.textContent = 'Notify';
          btn.appendChild(badge);
        }
      } else {
        btn.title = '';
        btn.querySelector('.notify-badge')?.remove();
        if (sizeVal === selectedSize) {
          btn.className = 'pdp-size-btn h-12 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border font-headline bg-black text-white border-black shadow-sm';
        } else {
          btn.className = 'pdp-size-btn h-12 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border font-headline bg-white hover:border-zinc-400 text-zinc-900 border-zinc-200';
        }
      }
    });
  }

  page.querySelectorAll('#pdp-colors-row button').forEach((btn) => {
    btn.addEventListener('click', () => {
      page.querySelectorAll('#pdp-colors-row button').forEach((b) => b.classList.remove('ring-2', 'ring-black', 'ring-offset-2'));
      btn.classList.add('ring-2', 'ring-black', 'ring-offset-2');
      selectedColour = btn.dataset.color;
      page.querySelector('#color-name-display').textContent = selectedColour;
      updateSizesForColour(selectedColour);
    });
  });

  // Size selection & Restock Notify Trigger (Item 24)
  const sizeBtns = page.querySelectorAll('.pdp-size-btn');
  const sizeLabel = page.querySelector('#pdp-selected-size-label');
  const stickySizeDisplay = page.querySelector('#sticky-size-display');

  sizeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const isAvailable = btn.dataset.available === 'true';
      const sizeVal = btn.dataset.size;

      if (!isAvailable) {
        // Trigger Back-in-Stock Alert Modal
        openRestockModal({ product, size: sizeVal });
        return;
      }

      sizeBtns.forEach((b) => {
        if (b.dataset.available === 'true') {
          b.className = 'pdp-size-btn h-12 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border font-headline bg-white hover:border-zinc-400 text-zinc-900 border-zinc-200';
        }
      });
      btn.className = 'pdp-size-btn h-12 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border font-headline bg-black text-white border-black shadow-sm';
      btn.classList.remove('size-pill-elastic');
      void btn.offsetWidth;
      btn.classList.add('size-pill-elastic');
      selectedSize = sizeVal;
      if (sizeLabel) sizeLabel.textContent = selectedSize;
      if (stickySizeDisplay) stickySizeDisplay.textContent = selectedSize;
      const radarSize = page.querySelector('#radar-size-indicator');
      if (radarSize) radarSize.textContent = selectedSize;
    });
  });

  // What's My Size Tool (Item 7)
  page.querySelector('#whats-my-size-btn')?.addEventListener('click', () => {
    openSizeRecommender({
      currentSize: selectedSize,
      onSelectSize: (recommended) => {
        const targetBtn = Array.from(sizeBtns).find((b) => b.dataset.size === recommended && b.dataset.available === 'true');
        if (targetBtn) {
          targetBtn.click();
          showToast(`Selected size ${recommended} based on your athletic profile`, 'success');
        } else {
          showToast(`Recommended size ${recommended} is currently archived`, 'info');
        }
      },
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
    if (quantity < 10) {
      quantity++;
      qtyDisplay.textContent = quantity;
    } else {
      showToast('Maximum 10 units per order item', 'info');
    }
  });

  // Add to Bag CTA with Parabolic Fly-to-Cart
  const handleAdd = (e) => {
    const triggerEl = e?.currentTarget;
    const rect = triggerEl?.getBoundingClientRect();
    const isVisible = rect && rect.top >= 0 && rect.bottom <= window.innerHeight;
    const effectiveTrigger = isVisible
      ? triggerEl
      : page.querySelector('#sticky-add-btn') || triggerEl;
    
    // Launch fly-to-cart particle
    flyToCart(effectiveTrigger, productImages[0]);
    addItem(product, selectedColour, selectedSize, quantity);
    showToast(`Added ${quantity}× ${product.name} (${selectedSize}) to bag`, 'success');
  };

  page.querySelector('#pdp-add-to-bag-btn')?.addEventListener('click', handleAdd);
  page.querySelector('#sticky-add-btn')?.addEventListener('click', handleAdd);

  // Sticky Bottom Bar — activates strictly when scrolling past the main purchase CTA
  const stickyBar = page.querySelector('#sticky-pdp-bar');
  const ctaBlock = page.querySelector('#pdp-cta-block');
  if (stickyBar && ctaBlock) {
    const updateStickyVisibility = () => {
      const rect = ctaBlock.getBoundingClientRect();
      // Show sticky bar ONLY when user has scrolled past the main CTA block (rect.bottom < 0)
      if (rect.bottom < 0) {
        stickyBar.classList.remove('translate-y-full');
      } else {
        stickyBar.classList.add('translate-y-full');
      }
    };

    window.addEventListener('scroll', updateStickyVisibility, { passive: true });
    updateStickyVisibility();
  }

  // Wishlist toggle
  const pdpWishlist = page.querySelector('#pdp-wishlist-btn');
  pdpWishlist?.addEventListener('click', () => {
    const isNow = toggleWishlist(product.id);
    const icon = pdpWishlist.querySelector('.material-symbols-outlined');
    if (isNow) {
      icon.classList.add('text-red-600');
      icon.textContent = 'favorite';
      icon.style.fontVariationSettings = "'FILL' 1";
      showToast(`Saved "${product.name}" to wishlist`, 'info');
    } else {
      icon.classList.remove('text-red-600');
      icon.textContent = 'favorite_border';
      icon.style.fontVariationSettings = '';
      showToast(`Removed from wishlist`, 'info');
    }
  });

  // Size Guide Static Table Modal
  page.querySelector('#size-guide-btn')?.addEventListener('click', () => {
    const modalContent = `
      <div class="p-2 space-y-4">
        <p class="text-xs text-zinc-500">Measurements in centimeters. All BEAR tees feature an oversized relaxed drape.</p>
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-zinc-200">
              <th class="py-2 font-bold font-headline">Size</th>
              <th class="py-2 font-bold font-headline">Chest</th>
              <th class="py-2 font-bold font-headline">Length</th>
              <th class="py-2 font-bold font-headline">Sleeve</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
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

  // Write Review Modal (Item 8)
  page.querySelector('#write-review-btn')?.addEventListener('click', () => {
    const reviewModal = createModal({
      id: 'write-review-modal',
      title: 'Review This Garment',
      content: `
        <form id="submit-review-form" class="space-y-3.5 pt-1">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Your Full Name *</label>
            <input type="text" id="rev-name" required placeholder="e.g. Rahul S." class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:border-black" />
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Rating *</label>
            <select id="rev-rating" class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none focus:border-black">
              <option value="5">★★★★★ (5/5) — Exceptional Quality</option>
              <option value="4">★★★★☆ (4/5) — Very Good</option>
              <option value="3">★★★☆☆ (3/5) — Average</option>
              <option value="2">★★☆☆☆ (2/5) — Fair</option>
              <option value="1">★☆☆☆☆ (1/5) — Poor</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Fit Assessment *</label>
            <select id="rev-fit" class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none focus:border-black">
              <option value="True to Size">True to Size</option>
              <option value="Runs Slightly Large">Runs Slightly Large</option>
              <option value="Runs Slightly Small">Runs Slightly Small</option>
              <option value="Perfect Athletic Cut">Perfect Athletic Cut</option>
              <option value="Relaxed Oversized">Relaxed Oversized</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Review Headline *</label>
            <input type="text" id="rev-title" required placeholder="e.g. Best lifting tee I own" class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:border-black" />
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Detailed Feedback *</label>
            <textarea id="rev-comment" required rows="3" placeholder="Share your experience with the fabric, drape, and durability..." class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:border-black"></textarea>
          </div>
          <button type="submit" class="w-full py-3 bg-black text-white rounded-full text-xs font-bold uppercase font-headline tracking-wider hover:bg-zinc-800 transition-colors shadow-md cursor-pointer">
            Publish Verified Review
          </button>
        </form>
      `,
    });
    reviewModal.open();

    const form = document.getElementById('submit-review-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const hasRealId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.id);
      if (!hasRealId) {
        showToast('Reviews require a live catalog product. Please try again once the store is connected.', 'info');
        reviewModal?.close();
        return;
      }
      const author = document.getElementById('rev-name')?.value.trim();
      const title = document.getElementById('rev-title')?.value.trim();
      const comment = document.getElementById('rev-comment')?.value.trim();
      const rating = Math.round(Number(document.getElementById('rev-rating')?.value || 5));
      const fit = document.getElementById('rev-fit')?.value || 'True to Size';

      // 1. Persist review into server database
      const result = await postProductReview(product.id, {
        productName: product.name,
        author,
        title,
        comment,
        rating,
        fit,
      });

      // 2. Dynamically re-calculate metrics
      if (result?.metrics) {
        metrics = result.metrics;
        updateMetricsDOM(metrics);
      }
      if (result?.review) {
        reviews.unshift(result.review);
        recordMyReviewId(result.review.id);
        const reviewsList = page.querySelector('#reviews-list-container');
        if (reviewsList) {
          const placeholder = reviewsList.querySelector('#no-reviews-placeholder');
          if (placeholder) placeholder.remove();
          const temp = document.createElement('div');
          temp.innerHTML = renderReviewCardHTML(result.review);
          const newCard = temp.firstElementChild;
          if (newCard) {
            newCard.classList.add('animate-in', 'fade-in', 'duration-300');
            reviewsList.prepend(newCard);
            bindReviewCardEvents(newCard, result.review);
          }
        }
      }

      reviewModal.close();
      showToast('Thank you! Your athlete review has been published.', 'success');
    });
  });

  function updateMetricsDOM(m) {
    if (!m) return;
    const isZero = !m.totalCount || Number(m.averageRating) === 0;

    const hdrRating = page.querySelector('#pdp-header-rating');
    if (hdrRating) hdrRating.textContent = isZero ? 'New' : m.averageRating;
    const hdrLink = page.querySelector('#pdp-header-reviews-link');
    if (hdrLink) hdrLink.textContent = isZero ? '(Write a Review)' : `(${m.totalCount} reviews)`;

    const avgRatingEl = page.querySelector('#pdp-avg-rating');
    if (avgRatingEl) avgRatingEl.textContent = isZero ? '—' : m.averageRating;
    const countEl = page.querySelector('#pdp-reviews-count');
    if (countEl) countEl.textContent = isZero ? 'No reviews submitted yet' : `Based on ${m.totalCount} verified athlete purchases`;
    const fitEl = page.querySelector('#pdp-fit-sentiment');
    if (fitEl) fitEl.textContent = m.fitSentiment;

    const breakdownEl = page.querySelector('#pdp-star-breakdown');
    if (breakdownEl && m.breakdown) {
      breakdownEl.innerHTML = m.breakdown.map((r) => `
        <div class="flex items-center gap-3 text-xs">
          <span class="w-12 text-zinc-600 font-mono font-bold">${r.stars} Stars</span>
          <div class="flex-1 h-2 rounded-full bg-zinc-200 overflow-hidden">
            <div class="h-full bg-black rounded-full transition-all duration-500" style="width: ${r.pct}%"></div>
          </div>
          <span class="w-8 text-right text-zinc-400 font-mono text-[11px]">${r.pct}%</span>
        </div>
      `).join('');
    }
  }

  function openEditReviewModal(r) {
    const editModal = createModal({
      id: 'edit-review-modal',
      title: 'Edit Your Review',
      content: `
        <form id="edit-review-form" class="space-y-4">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Athlete Name *</label>
            <input type="text" id="edit-rev-name" required value="${r.author || ''}" class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:border-black" />
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Rating *</label>
            <select id="edit-rev-rating" class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none focus:border-black">
              <option value="5" ${r.rating === 5 ? 'selected' : ''}>★★★★★ (5/5) — Exceptional Quality</option>
              <option value="4" ${r.rating === 4 ? 'selected' : ''}>★★★★☆ (4/5) — Very Good</option>
              <option value="3" ${r.rating === 3 ? 'selected' : ''}>★★★☆☆ (3/5) — Average</option>
              <option value="2" ${r.rating === 2 ? 'selected' : ''}>★★☆☆☆ (2/5) — Fair</option>
              <option value="1" ${r.rating === 1 ? 'selected' : ''}>★☆☆☆☆ (1/5) — Poor</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Fit Assessment *</label>
            <select id="edit-rev-fit" class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none focus:border-black">
              <option value="True to Size" ${r.fit === 'True to Size' ? 'selected' : ''}>True to Size</option>
              <option value="Runs Slightly Large" ${r.fit === 'Runs Slightly Large' ? 'selected' : ''}>Runs Slightly Large</option>
              <option value="Runs Slightly Small" ${r.fit === 'Runs Slightly Small' ? 'selected' : ''}>Runs Slightly Small</option>
              <option value="Perfect Athletic Cut" ${r.fit === 'Perfect Athletic Cut' ? 'selected' : ''}>Perfect Athletic Cut</option>
              <option value="Relaxed Oversized" ${r.fit === 'Relaxed Oversized' ? 'selected' : ''}>Relaxed Oversized</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Review Headline *</label>
            <input type="text" id="edit-rev-title" required value="${r.title || ''}" class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:border-black" />
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Detailed Feedback *</label>
            <textarea id="edit-rev-comment" required rows="3" class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:border-black">${r.comment || ''}</textarea>
          </div>
          <button type="submit" id="save-edit-review-btn" class="w-full py-3 bg-black text-white rounded-full text-xs font-bold uppercase font-headline tracking-wider hover:bg-zinc-800 transition-colors shadow-md cursor-pointer">
            Save Changes
          </button>
        </form>
      `,
    });
    editModal.open();

    const editForm = document.getElementById('edit-review-form');
    editForm?.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const author = document.getElementById('edit-rev-name')?.value.trim();
      const title = document.getElementById('edit-rev-title')?.value.trim();
      const comment = document.getElementById('edit-rev-comment')?.value.trim();
      const rating = Math.round(Number(document.getElementById('edit-rev-rating')?.value || 5));
      const fit = document.getElementById('edit-rev-fit')?.value || 'True to Size';

      const saveBtn = document.getElementById('save-edit-review-btn');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
      }

      const res = await updateProductReview(r.id, product.id, {
        author,
        title,
        comment,
        rating,
        fit,
      });

      if (res?.review) {
        Object.assign(r, res.review);
        const oldCard = page.querySelector(`#review-card-${r.id}`);
        if (oldCard) {
          const temp = document.createElement('div');
          temp.innerHTML = renderReviewCardHTML(r);
          const replacement = temp.firstElementChild;
          oldCard.replaceWith(replacement);
          bindReviewCardEvents(replacement, r);
        }
        if (res.metrics) {
          metrics = res.metrics;
          updateMetricsDOM(metrics);
        }
        editModal.close();
        showToast('Your review has been updated.', 'success');
      } else {
        showToast('Failed to update review. Please try again.', 'error');
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Changes';
        }
      }
    });
  }

  function openDeleteConfirm(r) {
    const confirmModal = createModal({
      id: 'delete-review-modal',
      title: 'Delete Review',
      content: `
        <div class="space-y-4">
          <p class="text-xs text-zinc-600 leading-relaxed">
            Are you sure you want to delete your review for <strong>${product.name}</strong>? This action cannot be undone.
          </p>
          <div class="flex items-center gap-2 pt-2">
            <button type="button" id="confirm-del-btn" class="flex-1 py-2.5 bg-red-600 text-white rounded-full text-xs font-bold uppercase font-headline tracking-wider hover:bg-red-700 transition-colors shadow-sm cursor-pointer">
              Yes, Delete
            </button>
            <button type="button" id="cancel-del-btn" class="flex-1 py-2.5 bg-zinc-100 text-zinc-800 rounded-full text-xs font-bold uppercase font-headline tracking-wider hover:bg-zinc-200 transition-colors cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      `,
    });
    confirmModal.open();

    document.getElementById('cancel-del-btn')?.addEventListener('click', () => confirmModal.close());
    document.getElementById('confirm-del-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('confirm-del-btn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Deleting...';
      }

      const res = await deleteProductReview(r.id, product.id);
      if (res?.success) {
        const card = page.querySelector(`#review-card-${r.id}`);
        if (card) {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.remove();
            if (reviews.length === 0) {
              const reviewsList = page.querySelector('#reviews-list-container');
              if (reviewsList && !reviewsList.querySelector('#no-reviews-placeholder')) {
                reviewsList.innerHTML = `
                  <div id="no-reviews-placeholder" class="col-span-1 md:col-span-2 py-10 px-6 rounded-2xl border border-dashed border-zinc-200 text-center bg-zinc-50/50">
                    <span class="material-symbols-outlined text-[32px] text-zinc-400 mb-2">rate_review</span>
                    <p class="font-headline text-sm font-bold uppercase text-zinc-900">No athlete reviews yet</p>
                    <p class="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">Be the first athlete to test and review this garment in training.</p>
                  </div>
                `;
              }
            }
          }, 250);
        }
        reviews = reviews.filter((item) => item.id !== r.id);
        if (res.metrics) {
          metrics = res.metrics;
          updateMetricsDOM(metrics);
        }
        confirmModal.close();
        showToast('Your review has been deleted.', 'info');
      } else {
        showToast('Could not delete review. Please try again.', 'error');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Yes, Delete';
        }
      }
    });
  }

  function bindReviewCardEvents(card, r) {
    card.querySelector('.edit-review-btn')?.addEventListener('click', () => openEditReviewModal(r));
    card.querySelector('.delete-review-btn')?.addEventListener('click', () => openDeleteConfirm(r));
  }

  // Bind edit & delete actions on initial review cards
  page.querySelectorAll('.review-card-item').forEach((card) => {
    const id = card.dataset.id;
    const revObj = reviews.find((x) => String(x.id) === String(id));
    if (revObj) bindReviewCardEvents(card, revObj);
  });

  // Render Related Products (Item 9)
  const relatedGrid = page.querySelector('#related-products-grid');
  if (relatedGrid) {
    const related = products
      .filter((p) => p.id !== product.id && p.mode === product.mode)
      .slice(0, 4);

    related.forEach((rel) => {
      relatedGrid.appendChild(createProductCard(rel));
    });
  }

  // Render Recently Viewed Products (Item 4)
  const recentSection = page.querySelector('#recently-viewed-section');
  const recentGrid = page.querySelector('#recently-viewed-grid');
  const recentIds = getRecentlyViewedIds().filter((id) => id !== product.id);

  if (recentSection && recentGrid && recentIds.length > 0) {
    const recentProducts = products.filter((p) => recentIds.includes(p.id)).slice(0, 4);
    if (recentProducts.length > 0) {
      recentSection.classList.remove('hidden');
      recentProducts.forEach((p) => {
        recentGrid.appendChild(createProductCard(p));
      });
    }
  }

  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };
