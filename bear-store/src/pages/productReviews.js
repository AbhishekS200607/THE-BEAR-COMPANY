import { getProducts } from '../services/productService.js';
import {
  fetchProductReviews,
  submitProductReview,
  updateProductReview,
  deleteProductReview,
  getMyReviewIds,
  recordMyReviewId,
  removeMyReviewId,
  isMyReview,
} from '../services/reviewService.js';
import { showToast } from '../components/toast.js';

/**
 * Dedicated Scalable Reviews Screen (Roadmap Item 10A)
 * Route: #/product-reviews?productId=<id>
 */
export async function render(container) {
  // Parse productId from hash query
  const hash = window.location.hash || '';
  const searchPart = hash.includes('?') ? hash.split('?')[1] : '';
  const params = new URLSearchParams(searchPart);
  const productId = params.get('productId') || '';

  const allProducts = await getProducts();
  const product = allProducts.find((p) => String(p.id) === String(productId)) || allProducts[0] || {
    id: productId,
    name: 'BEAR Performance Garment',
    price: 3299,
    category: 'Athletic Performance',
    images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuC0A_M4HqJNIIAusW1iTMaL94tnVHUlB2_7uyMjBw5mHw6BLBMJonDYlpbl1ks7zxdtF5jLW3oxBMrz9ZUSoacdbiSztre6lZoDTkvo9Apt6qGtxTxL2PLQibuZAUxKdZJVQD8YhaWaEAhApqCJQHkOjxDW8K-juFBWPSJxhzNXraK5jbwy0Vfos7iF5tBILTs-ByqMTeXYzQYYE66yCKJF6mcKz8kT6DF0rxTO3w'],
  };

  const productImage = product.images && product.images[0] ? product.images[0] : '';
  const backHref = product.slug ? `#product/${product.slug}` : (product.id ? `#product/${product.id}` : '#collection');

  // Filter & Pagination State
  let currentPage = 1;
  const pageSize = 10;
  let activeRating = '';
  let activeFit = '';
  let activeVerifiedOnly = false;
  let activeSort = 'newest';
  let activeAbortController = null;
  let currentReviews = [];
  let currentMetrics = null;
  let currentPagination = { page: 1, limit: pageSize, total: 0, totalPages: 1, hasNextPage: false };
  let isLoading = false;

  container.innerHTML = `
    <div class="min-h-screen bg-surface-container-lowest text-zinc-900 pb-24">
      
      <!-- Top Navigation & Product Breadcrumb -->
      <div class="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <a href="${backHref}" class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600 hover:text-black transition-colors shrink-0 font-headline">
              <span class="material-symbols-outlined text-[18px]">arrow_back</span>
              <span class="hidden sm:inline">Back to Product</span>
            </a>
            <span class="text-zinc-300 hidden sm:inline">|</span>
            <div class="flex items-center gap-2.5 min-w-0">
              ${productImage ? `<img src="${productImage}" alt="${product.name}" class="w-8 h-8 rounded-md object-cover bg-zinc-100 shrink-0 border border-zinc-200" />` : ''}
              <div class="min-w-0">
                <h1 class="text-xs sm:text-sm font-extrabold uppercase font-headline tracking-tight text-zinc-950 truncate">${product.name}</h1>
                <p class="text-[10px] text-zinc-500 font-mono">₹${product.price ? product.price.toLocaleString('en-IN') : '3,299'} • Verified Athlete Reviews</p>
              </div>
            </div>
          </div>
          <button id="open-write-modal-top-btn" class="shrink-0 px-4 py-2 rounded-full bg-black text-white hover:bg-zinc-800 text-[11px] font-bold uppercase tracking-wider font-headline transition-colors flex items-center gap-1.5 shadow-xs">
            <span class="material-symbols-outlined text-[15px]">edit</span>
            <span class="hidden sm:inline">Write a Review</span>
            <span class="sm:hidden">Review</span>
          </button>
        </div>
      </div>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        
        <!-- Header Banner & Metrics Overview Card -->
        <div class="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-xs mb-8" id="metrics-card">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            <!-- Left: Big Score & Stars -->
            <div class="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-zinc-100 pb-6 md:pb-0 md:pr-8">
              <p class="text-[11px] font-bold uppercase tracking-widest text-zinc-400 font-headline mb-1">OVERALL RATING</p>
              <div class="flex items-baseline justify-center md:justify-start gap-2 mb-2">
                <span class="font-headline text-5xl font-black text-zinc-950 tracking-tighter" id="metric-avg-score">4.9</span>
                <span class="text-sm font-bold text-zinc-400 font-headline">/ 5.0</span>
              </div>
              <div class="flex items-center justify-center md:justify-start gap-1 text-amber-500 mb-2" id="metric-stars-container">
                ${[1, 2, 3, 4, 5].map(() => `<span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">star</span>`).join('')}
              </div>
              <p class="text-xs text-zinc-500 font-medium" id="metric-total-text">Based on verified athlete purchases</p>
            </div>

            <!-- Middle: Star Distribution Breakdown Bars (Clickable) -->
            <div class="md:col-span-5 flex flex-col gap-1.5" id="metric-breakdown-bars">
              ${[5, 4, 3, 2, 1].map((star) => `
                <button type="button" class="star-filter-bar-btn flex items-center gap-3 text-xs text-zinc-600 hover:text-black transition-colors w-full group py-0.5" data-star="${star}">
                  <span class="w-12 text-right font-medium text-[11px] font-mono group-hover:underline">${star} Stars</span>
                  <div class="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div class="h-full bg-zinc-900 rounded-full transition-all duration-300" id="star-bar-${star}" style="width: 0%;"></div>
                  </div>
                  <span class="w-8 text-left text-[11px] font-mono text-zinc-400" id="star-count-${star}">0</span>
                </button>
              `).join('')}
            </div>

            <!-- Right: Fit Sentiment Metric -->
            <div class="md:col-span-3 bg-zinc-50 rounded-xl p-5 border border-zinc-100 flex flex-col justify-center items-center text-center">
              <span class="material-symbols-outlined text-[28px] text-zinc-700 mb-1">straighten</span>
              <p class="font-headline text-xs font-bold uppercase tracking-wider text-zinc-900 mb-1">Fit Assessment</p>
              <p class="text-sm font-extrabold text-zinc-950 font-headline" id="metric-fit-score">88% True to Size</p>
              <p class="text-[11px] text-zinc-500 mt-1">Based on athlete testing</p>
            </div>

          </div>
        </div>

        <!-- Filter & Sorting Toolbar -->
        <div class="bg-white rounded-xl border border-zinc-200 p-4 mb-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          
          <!-- Filter Chips -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-headline mr-1 hidden sm:inline">Filters:</span>
            
            <!-- Star Ratings Dropdown/Pills -->
            <select id="filter-rating-select" class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-800 hover:border-black transition-colors cursor-pointer">
              <option value="">All Ratings</option>
              <option value="5">5 Stars only</option>
              <option value="4">4 Stars only</option>
              <option value="3">3 Stars only</option>
              <option value="2">2 Stars only</option>
              <option value="1">1 Star only</option>
            </select>

            <!-- Fit Select -->
            <select id="filter-fit-select" class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-800 hover:border-black transition-colors cursor-pointer">
              <option value="">All Fits</option>
              <option value="True to Size">True to Size</option>
              <option value="Runs Small">Runs Small</option>
              <option value="Runs Large">Runs Large</option>
            </select>

            <!-- Verified Buyers Toggle -->
            <label class="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 select-none cursor-pointer px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-400 transition-colors">
              <input type="checkbox" id="filter-verified-checkbox" class="rounded accent-black cursor-pointer" />
              <span>Verified Only</span>
            </label>

            <!-- Active filter reset button -->
            <button id="reset-filters-btn" class="text-[11px] font-bold text-red-600 hover:underline uppercase font-headline hidden px-2 py-1">Reset</button>
          </div>

          <!-- Sorter Dropdown & Total Count -->
          <div class="flex items-center gap-3 shrink-0">
            <span class="text-xs text-zinc-500 font-mono" id="results-count-badge">0 reviews</span>
            <div class="flex items-center gap-1.5">
              <span class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-headline hidden md:inline">Sort:</span>
              <select id="sort-select" class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-800 hover:border-black transition-colors cursor-pointer">
                <option value="newest">Newest First</option>
                <option value="highest_rating">Highest Rating</option>
                <option value="lowest_rating">Lowest Rating</option>
              </select>
            </div>
          </div>

        </div>

        <!-- Reviews Dynamic List -->
        <div id="reviews-feed" class="space-y-4">
          <!-- Populated by loadReviews() -->
        </div>

        <!-- Pagination & Load More Controls -->
        <div id="pagination-controls" class="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200">
          <p class="text-xs text-zinc-500 font-mono" id="page-summary-text">Showing page 1</p>
          <div class="flex items-center gap-2">
            <button id="prev-page-btn" class="px-4 py-2 rounded-lg border border-zinc-200 bg-white text-xs font-bold uppercase font-headline hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none transition-colors">
              Previous
            </button>
            <button id="next-page-btn" class="px-4 py-2 rounded-lg border border-zinc-200 bg-white text-xs font-bold uppercase font-headline hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none transition-colors">
              Next Page
            </button>
          </div>
        </div>

      </div>

      <!-- Write / Edit Review Modal -->
      <div id="reviews-page-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl border border-zinc-100 max-h-[90vh] overflow-y-auto">
          <button id="close-modal-btn" class="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-black rounded-full hover:bg-zinc-100 transition-colors">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
          
          <h2 class="font-headline text-lg sm:text-xl font-black uppercase tracking-tight text-zinc-950 mb-1" id="modal-title">Write Athlete Review</h2>
          <p class="text-xs text-zinc-500 mb-6">Reviewing: <span class="font-bold text-zinc-900">${product.name}</span></p>

          <form id="review-submission-form" class="space-y-4">
            <input type="hidden" id="edit-review-id" value="" />
            
            <!-- Star Rating Input -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-zinc-700 font-headline mb-1">Rating *</label>
              <div class="flex items-center gap-1.5" id="interactive-star-input">
                ${[1, 2, 3, 4, 5].map((s) => `
                  <button type="button" data-val="${s}" class="star-rating-btn p-1 text-zinc-300 hover:text-amber-500 transition-colors">
                    <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1;">star</span>
                  </button>
                `).join('')}
              </div>
              <input type="hidden" id="form-rating-val" value="5" required />
            </div>

            <!-- Fit Feedback -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-zinc-700 font-headline mb-1">Fit Assessment *</label>
              <div class="grid grid-cols-3 gap-2">
                ${['Runs Small', 'True to Size', 'Runs Large'].map((fitOpt) => `
                  <label class="p-2.5 rounded-lg border border-zinc-200 text-center cursor-pointer hover:border-black transition-colors has-[:checked]:border-black has-[:checked]:bg-zinc-50 select-none">
                    <input type="radio" name="form_fit" value="${fitOpt}" class="sr-only" ${fitOpt === 'True to Size' ? 'checked' : ''} />
                    <span class="text-xs font-bold font-headline block">${fitOpt}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- Author Name -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-zinc-700 font-headline mb-1">Your Name or Athlete Tag *</label>
              <input type="text" id="form-author-input" required placeholder="e.g. Rahul S." class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-hidden focus:border-black transition-colors" />
            </div>

            <!-- Title -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-zinc-700 font-headline mb-1">Review Headline *</label>
              <input type="text" id="form-title-input" required placeholder="e.g. Unbelievable stretch and sweat dissipation" class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-hidden focus:border-black transition-colors" />
            </div>

            <!-- Detailed Comments -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-zinc-700 font-headline mb-1">Your Experience / Feedback *</label>
              <textarea id="form-comment-input" rows="4" required placeholder="Tell other athletes how this garment holds up during heavy lifting, conditioning, or high-humidity sessions..." class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-hidden focus:border-black transition-colors"></textarea>
            </div>

            <button type="submit" id="submit-review-btn" class="w-full py-3.5 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider font-headline transition-colors shadow-sm mt-2">
              Submit Review
            </button>
          </form>
        </div>
      </div>

    </div>
  `;

  // DOM Elements
  const feedEl = container.querySelector('#reviews-feed');
  const resultsBadge = container.querySelector('#results-count-badge');
  const prevBtn = container.querySelector('#prev-page-btn');
  const nextBtn = container.querySelector('#next-page-btn');
  const pageSummaryText = container.querySelector('#page-summary-text');
  const ratingSelect = container.querySelector('#filter-rating-select');
  const fitSelect = container.querySelector('#filter-fit-select');
  const verifiedCheckbox = container.querySelector('#filter-verified-checkbox');
  const sortSelect = container.querySelector('#sort-select');
  const resetBtn = container.querySelector('#reset-filters-btn');
  const modalEl = container.querySelector('#reviews-page-modal');
  const formEl = container.querySelector('#review-submission-form');

  function renderSkeletonFeed() {
    feedEl.innerHTML = Array.from({ length: 3 }).map(() => `
      <div class="p-6 rounded-xl border border-zinc-200 bg-white animate-pulse">
        <div class="flex items-center justify-between mb-3">
          <div class="w-24 h-4 bg-zinc-200 rounded"></div>
          <div class="w-16 h-3 bg-zinc-100 rounded"></div>
        </div>
        <div class="w-1/2 h-4 bg-zinc-200 rounded mb-2"></div>
        <div class="w-full h-3 bg-zinc-100 rounded mb-1"></div>
        <div class="w-4/5 h-3 bg-zinc-100 rounded"></div>
      </div>
    `).join('');
  }

  function updateMetricsUI(metrics) {
    if (!metrics) return;
    const avgScoreEl = container.querySelector('#metric-avg-score');
    if (avgScoreEl) avgScoreEl.textContent = metrics.averageRating ? Number(metrics.averageRating).toFixed(1) : '5.0';

    const totalTextEl = container.querySelector('#metric-total-text');
    if (totalTextEl) totalTextEl.textContent = `Based on ${metrics.totalCount || 0} verified athlete purchases`;

    const fitScoreEl = container.querySelector('#metric-fit-score');
    if (fitScoreEl) {
      fitScoreEl.textContent = `${metrics.trueToSizePercent || 88}% True to Size`;
    }

    // Update breakdown bars
    if (metrics.breakdown) {
      const total = metrics.totalCount || 1;
      [5, 4, 3, 2, 1].forEach((star) => {
        const count = metrics.breakdown[star] || 0;
        const pct = Math.round((count / total) * 100);
        const barEl = container.querySelector(`#star-bar-${star}`);
        const countEl = container.querySelector(`#star-count-${star}`);
        if (barEl) barEl.style.width = `${pct}%`;
        if (countEl) countEl.textContent = String(count);
      });
    }
  }

  function renderReviewCard(r) {
    const mine = isMyReview(r.id);
    const dateStr = r.date || (r.created_at || r.createdAt ? new Date(r.created_at || r.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently');
    const isVer = r.isVerified !== undefined ? r.isVerified : (r.verified !== undefined ? r.verified : true);

    return `
      <div class="p-6 rounded-xl border ${mine ? 'border-zinc-900 bg-zinc-50/70 shadow-xs' : 'border-zinc-200 bg-white shadow-2xs'} flex flex-col justify-between transition-all" data-id="${r.id}">
        <div>
          <div class="flex items-center justify-between mb-2.5">
            <div class="flex items-center gap-1 text-amber-500">
              ${Array.from({ length: r.rating || 5 }).map(() => `<span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">star</span>`).join('')}
            </div>
            <div class="flex items-center gap-2">
              ${mine ? `<span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black text-white font-headline">Your Review</span>` : ''}
              <span class="text-[11px] text-zinc-400 font-mono">${dateStr}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 mb-2">
            <span class="font-headline text-sm font-extrabold text-zinc-950">${r.title || ''}</span>
          </div>

          <p class="text-xs text-zinc-600 leading-relaxed mb-4">${r.comment || ''}</p>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-zinc-100 text-[11px]">
          <div class="flex items-center gap-2">
            <span class="font-bold text-zinc-900">${r.author || 'Athlete'}</span>
            ${isVer ? `<span class="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px]"><span class="material-symbols-outlined text-[13px]">check_circle</span> Verified</span>` : ''}
            <span class="text-zinc-400">• Fit: <span class="text-zinc-700 font-semibold">${r.fit || 'True to Size'}</span></span>
          </div>

          ${mine ? `
            <div class="flex items-center gap-2">
              <button class="edit-my-review-btn text-[11px] font-bold text-zinc-600 hover:text-black font-headline uppercase" data-id="${r.id}">Edit</button>
              <span class="text-zinc-300">|</span>
              <button class="delete-my-review-btn text-[11px] font-bold text-red-600 hover:text-red-800 font-headline uppercase" data-id="${r.id}">Delete</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  async function loadReviews(resetPage = false) {
    if (resetPage) currentPage = 1;
    if (activeAbortController) {
      activeAbortController.abort();
    }
    activeAbortController = new AbortController();

    isLoading = true;
    renderSkeletonFeed();

    // Toggle reset filters button visibility
    const hasActiveFilters = Boolean(activeRating || activeFit || activeVerifiedOnly || activeSort !== 'newest');
    if (resetBtn) {
      resetBtn.classList.toggle('hidden', !hasActiveFilters);
    }

    try {
      const data = await fetchProductReviews(
        product.id,
        {
          page: currentPage,
          limit: pageSize,
          rating: activeRating,
          fit: activeFit,
          verified: activeVerifiedOnly ? 'true' : undefined,
          sort: activeSort,
        },
        activeAbortController.signal
      );

      currentReviews = data.reviews || [];
      currentMetrics = data.metrics;
      currentPagination = data.pagination || { page: currentPage, limit: pageSize, total: currentReviews.length, totalPages: 1, hasNextPage: false };

      updateMetricsUI(currentMetrics);

      // Render Feed
      if (currentReviews.length === 0) {
        feedEl.innerHTML = `
          <div class="py-16 px-6 rounded-2xl border border-dashed border-zinc-200 text-center bg-white">
            <span class="material-symbols-outlined text-[36px] text-zinc-400 mb-2">filter_list_off</span>
            <p class="font-headline text-sm font-bold uppercase text-zinc-900">No reviews found</p>
            <p class="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">No athlete reviews match the selected filter combination.</p>
            <button id="empty-state-reset-btn" class="mt-4 px-5 py-2 rounded-full border border-black bg-black text-white hover:bg-zinc-800 text-xs font-bold uppercase font-headline">Reset Filters</button>
          </div>
        `;
        const emptyReset = feedEl.querySelector('#empty-state-reset-btn');
        if (emptyReset) emptyReset.addEventListener('click', resetAllFilters);
      } else {
        feedEl.innerHTML = currentReviews.map(renderReviewCard).join('');
      }

      // Update Badges & Pagination
      if (resultsBadge) {
        resultsBadge.textContent = `${currentPagination.total || currentReviews.length} reviews`;
      }
      if (pageSummaryText) {
        pageSummaryText.textContent = `Showing page ${currentPagination.page} of ${currentPagination.totalPages || 1} (${currentPagination.total} total reviews)`;
      }
      if (prevBtn) prevBtn.disabled = currentPagination.page <= 1;
      if (nextBtn) nextBtn.disabled = !currentPagination.hasNextPage;

    } catch (err) {
      if (err.name === 'AbortError') return; // Ignore cancelled requests
      console.error('[ProductReviews] Fetch error:', err);
      feedEl.innerHTML = `
        <div class="py-12 px-6 rounded-2xl border border-red-200 bg-red-50 text-center">
          <span class="material-symbols-outlined text-[32px] text-red-600 mb-2">error</span>
          <p class="font-headline text-sm font-bold uppercase text-red-900">Could not load reviews</p>
          <p class="text-xs text-red-700 mt-1 mb-4">An error occurred while communicating with the server.</p>
          <button id="retry-fetch-btn" class="px-5 py-2 rounded-full bg-red-600 text-white text-xs font-bold uppercase font-headline hover:bg-red-700">Retry</button>
        </div>
      `;
      const retryBtn = feedEl.querySelector('#retry-fetch-btn');
      if (retryBtn) retryBtn.addEventListener('click', () => loadReviews());
    } finally {
      isLoading = false;
    }
  }

  function resetAllFilters() {
    activeRating = '';
    activeFit = '';
    activeVerifiedOnly = false;
    activeSort = 'newest';
    if (ratingSelect) ratingSelect.value = '';
    if (fitSelect) fitSelect.value = '';
    if (verifiedCheckbox) verifiedCheckbox.checked = false;
    if (sortSelect) sortSelect.value = 'newest';
    loadReviews(true);
  }

  // Event Listeners
  if (ratingSelect) {
    ratingSelect.addEventListener('change', (e) => {
      activeRating = e.target.value;
      loadReviews(true);
    });
  }

  if (fitSelect) {
    fitSelect.addEventListener('change', (e) => {
      activeFit = e.target.value;
      loadReviews(true);
    });
  }

  if (verifiedCheckbox) {
    verifiedCheckbox.addEventListener('change', (e) => {
      activeVerifiedOnly = e.target.checked;
      loadReviews(true);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      loadReviews(true);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllFilters);
  }

  // Interactive Breakdown Bars (Click to filter by star)
  container.querySelectorAll('.star-filter-bar-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const star = btn.dataset.star;
      activeRating = star;
      if (ratingSelect) ratingSelect.value = star;
      loadReviews(true);
    });
  });

  // Pagination Next / Prev
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadReviews(false);
        window.scrollTo({ top: 300, behavior: 'smooth' });
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPagination.hasNextPage) {
        currentPage++;
        loadReviews(false);
        window.scrollTo({ top: 300, behavior: 'smooth' });
      }
    });
  }

  // Review Modal Controls
  const openModalTopBtn = container.querySelector('#open-write-modal-top-btn');
  const closeModalBtn = container.querySelector('#close-modal-btn');
  const starBtns = container.querySelectorAll('.star-rating-btn');
  const ratingInput = container.querySelector('#form-rating-val');
  const editIdInput = container.querySelector('#edit-review-id');
  const modalTitle = container.querySelector('#modal-title');

  function openModal(editReview = null) {
    if (!modalEl) return;
    if (editReview) {
      if (modalTitle) modalTitle.textContent = 'Edit Your Review';
      if (editIdInput) editIdInput.value = editReview.id;
      if (ratingInput) ratingInput.value = editReview.rating || 5;
      updateStarButtons(editReview.rating || 5);
      const authorInp = container.querySelector('#form-author-input');
      const titleInp = container.querySelector('#form-title-input');
      const commInp = container.querySelector('#form-comment-input');
      if (authorInp) authorInp.value = editReview.author || '';
      if (titleInp) titleInp.value = editReview.title || '';
      if (commInp) commInp.value = editReview.comment || '';
      const fitRadio = container.querySelector(`input[name="form_fit"][value="${editReview.fit}"]`);
      if (fitRadio) fitRadio.checked = true;
    } else {
      if (modalTitle) modalTitle.textContent = 'Write Athlete Review';
      if (editIdInput) editIdInput.value = '';
      if (formEl) formEl.reset();
      if (ratingInput) ratingInput.value = 5;
      updateStarButtons(5);
    }
    modalEl.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function updateStarButtons(val) {
    starBtns.forEach((b) => {
      const bVal = Number(b.dataset.val);
      b.classList.toggle('text-amber-500', bVal <= val);
      b.classList.toggle('text-zinc-300', bVal > val);
    });
  }

  starBtns.forEach((b) => {
    b.addEventListener('click', () => {
      const val = Number(b.dataset.val);
      if (ratingInput) ratingInput.value = val;
      updateStarButtons(val);
    });
  });

  if (openModalTopBtn) openModalTopBtn.addEventListener('click', () => openModal(null));
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (modalEl) {
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeModal();
    });
  }

  // Handle Edit / Delete clicks in Feed
  feedEl.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.edit-my-review-btn');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const rev = currentReviews.find((r) => String(r.id) === String(id));
      if (rev) openModal(rev);
      return;
    }

    const delBtn = e.target.closest('.delete-my-review-btn');
    if (delBtn) {
      const id = delBtn.dataset.id;
      if (!confirm('Are you sure you want to permanently delete your review?')) return;
      try {
        await deleteProductReview(id);
        removeMyReviewId(id);
        showToast('Your review was successfully removed.', 'success');
        loadReviews(false);
      } catch (err) {
        showToast(err.message || 'Failed to delete review', 'error');
      }
    }
  });

  // Handle Form Submission
  if (formEl) {
    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const editId = editIdInput ? editIdInput.value.trim() : '';
      const rating = parseInt(ratingInput.value, 10) || 5;
      const fit = (container.querySelector('input[name="form_fit"]:checked')?.value) || 'True to Size';
      const author = container.querySelector('#form-author-input')?.value.trim() || 'Athlete';
      const title = container.querySelector('#form-title-input')?.value.trim() || 'Verified Review';
      const comment = container.querySelector('#form-comment-input')?.value.trim() || '';

      const submitBtn = container.querySelector('#submit-review-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
      }

      try {
        if (editId) {
          await updateProductReview(editId, { rating, fit, author, title, comment });
          showToast('Review updated successfully.', 'success');
        } else {
          const res = await submitProductReview({
            productId: product.id,
            productName: product.name,
            author,
            rating,
            fit,
            title,
            comment,
          });
          if (res?.review?.id) {
            recordMyReviewId(res.review.id);
          }
          showToast('Thank you! Your verified review has been submitted.', 'success');
        }
        closeModal();
        loadReviews(true);
      } catch (err) {
        showToast(err.message || 'Could not submit review', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Review';
        }
      }
    });
  }

  // Initial Data Load
  loadReviews(true);

  // Cleanup on route navigation
  return () => {
    if (activeAbortController) activeAbortController.abort();
    document.body.style.overflow = '';
  };
}
