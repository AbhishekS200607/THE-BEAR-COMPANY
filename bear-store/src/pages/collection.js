import { getMode, subscribe } from '../state/store.js';
import { getProducts } from '../services/productService.js';
import { createProductCard } from '../components/productCard.js';
import { renderEmptyIllustration } from '../components/emptyState.js';
import { skeletonCollection } from '../utils/skeletons.js';

export async function render(container) {
  let mode = getMode();
  let selectedCategory = 'all';
  let selectedSizes = [];
  let selectedColours = [];
  let sortOrder = 'featured';

  // Pagination / Infinite Scroll State (Item 3)
  const PAGE_SIZE = 8;
  let visibleCount = PAGE_SIZE;

  const page = document.createElement('div');
  page.className = 'w-full flex flex-col pt-20 md:pt-24 pb-32';

  container.innerHTML = skeletonCollection();

  let currentFilteredProducts = [];

  async function updateGrid() {
    const allProducts = await getProducts(mode);
    let filtered = allProducts;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => {
        const cat = p.category.toLowerCase();
        if (selectedCategory === 't-shirts') return cat.includes('t-shirt') || cat.includes('tee');
        if (selectedCategory === 'tops') return cat.includes('tank') || cat.includes('bra') || cat.includes('top');
        if (selectedCategory === 'shorts') return cat.includes('short');
        if (selectedCategory === 'joggers') return cat.includes('jogger') || cat.includes('pant') || cat.includes('tight');
        return cat.includes(selectedCategory);
      });
    }

    if (selectedSizes.length > 0) {
      filtered = filtered.filter((p) => p.sizes.some((s) => s.available && selectedSizes.includes(s.size)));
    }

    if (selectedColours.length > 0) {
      filtered = filtered.filter((p) => p.colours.some((c) => selectedColours.includes(c.id) || selectedColours.includes(c.name.toLowerCase())));
    }

    if (sortOrder === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortOrder === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    currentFilteredProducts = filtered;

    const countEl = page.querySelector('#collection-count');
    if (countEl) countEl.textContent = `${filtered.length} Items`;

    renderActiveFilterChips();
    renderProductsBatch();
  }

  // Active Filter Summary Bar (Item 11)
  function renderActiveFilterChips() {
    const bar = page.querySelector('#active-filters-bar');
    const chipsMount = page.querySelector('#active-chips-mount');
    const badge = page.querySelector('#filter-count-badge');
    if (!bar || !chipsMount) return;

    const activeFilters = [];
    if (selectedCategory !== 'all') {
      activeFilters.push({ type: 'category', label: `Category: ${selectedCategory.toUpperCase()}`, value: selectedCategory });
    }
    selectedSizes.forEach((s) => {
      activeFilters.push({ type: 'size', label: `Size: ${s}`, value: s });
    });
    selectedColours.forEach((c) => {
      activeFilters.push({ type: 'colour', label: `Colour: ${c}`, value: c });
    });

    if (activeFilters.length > 0) {
      bar.classList.remove('hidden');
      if (badge) {
        badge.textContent = `(${activeFilters.length})`;
        badge.classList.remove('hidden');
      }

      chipsMount.innerHTML = activeFilters
        .map(
          (f) => `
          <button class="remove-filter-chip inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-800 transition-colors cursor-pointer" data-type="${f.type}" data-value="${f.value}">
            <span>${f.label}</span>
            <span class="text-zinc-400 hover:text-black">✕</span>
          </button>
        `
        )
        .join('');

      chipsMount.querySelectorAll('.remove-filter-chip').forEach((btn) => {
        btn.addEventListener('click', () => {
          const type = btn.dataset.type;
          const val = btn.dataset.value;
          if (type === 'category') selectedCategory = 'all';
          else if (type === 'size') selectedSizes = selectedSizes.filter((s) => s !== val);
          else if (type === 'colour') selectedColours = selectedColours.filter((c) => c !== val);
          syncCategoryButtons();
          syncSizeButtons();
          syncColourButtons();
          syncFilterLabels();
          visibleCount = PAGE_SIZE;
          updateGrid();
        });
      });
    } else {
      bar.classList.add('hidden');
      if (badge) badge.classList.add('hidden');
      chipsMount.innerHTML = '';
    }
  }

  // Render paginated batch
  function renderProductsBatch() {
    const grid = page.querySelector('#collection-products-grid');
    const loadMoreContainer = page.querySelector('#load-more-container');
    const progressText = page.querySelector('#pagination-progress-text');
    const progressBar = page.querySelector('#pagination-progress-fill');
    if (!grid) return;

    grid.innerHTML = '';

    if (currentFilteredProducts.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center">
          ${renderEmptyIllustration('search')}
          <p class="font-headline text-base font-bold text-zinc-950">No products match your filters</p>
          <p class="text-xs text-zinc-500 mt-1">Try removing a filter above, or <button id="empty-reset-btn" class="underline font-bold cursor-pointer">reset all</button>.</p>
        </div>
      `;
      grid.querySelector('#empty-reset-btn')?.addEventListener('click', resetAllFilters);
      if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
      return;
    }

    const itemsToShow = currentFilteredProducts.slice(0, visibleCount);
    itemsToShow.forEach((p) => {
      grid.appendChild(createProductCard(p));
    });

    // Pagination status
    if (loadMoreContainer) {
      if (currentFilteredProducts.length > PAGE_SIZE) {
        loadMoreContainer.classList.remove('hidden');
        const displayed = Math.min(visibleCount, currentFilteredProducts.length);
        const total = currentFilteredProducts.length;
        const pct = Math.round((displayed / total) * 100);

        if (progressText) progressText.textContent = `Showing ${displayed} of ${total} garments`;
        if (progressBar) progressBar.style.width = `${pct}%`;

        const loadMoreBtn = page.querySelector('#load-more-btn');
        if (loadMoreBtn) {
          if (displayed >= total) {
            loadMoreBtn.classList.add('hidden');
          } else {
            loadMoreBtn.classList.remove('hidden');
            loadMoreBtn.textContent = 'Load More Garments';
            loadMoreBtn.disabled = false;
          }
        }
      } else {
        loadMoreContainer.classList.add('hidden');
      }
    }
  }

  function syncSizeButtons() {
    page.querySelectorAll('.size-opt-btn').forEach((btn) => {
      const active = selectedSizes.includes(btn.dataset.size);
      btn.classList.toggle('bg-black', active);
      btn.classList.toggle('text-white', active);
      btn.classList.toggle('border-black', active);
    });
  }

  function syncColourButtons() {
    page.querySelectorAll('.colour-opt-btn').forEach((btn) => {
      btn.classList.toggle('bg-zinc-200', selectedColours.includes(btn.dataset.colour));
    });
  }

  function syncFilterLabels() {
    const sizeLabel = page.querySelector('#size-btn-label');
    const colourLabel = page.querySelector('#colour-btn-label');
    if (sizeLabel) sizeLabel.textContent = selectedSizes.length > 0 ? `Size (${selectedSizes.length})` : 'Size';
    if (colourLabel) colourLabel.textContent = selectedColours.length > 0 ? `Colour (${selectedColours.length})` : 'Colour';
  }

  function resetAllFilters() {
    selectedCategory = 'all';
    selectedSizes = [];
    selectedColours = [];
    sortOrder = 'featured';
    visibleCount = PAGE_SIZE;
    const sortEl = page.querySelector('#sort-dropdown');
    if (sortEl) sortEl.value = 'featured';
    syncCategoryButtons();
    syncSizeButtons();
    syncColourButtons();
    syncFilterLabels();
    updateGrid();
  }

  function syncCategoryButtons() {
    page.querySelectorAll('.cat-pill').forEach((btn) => {
      const isMatch = btn.dataset.cat === selectedCategory;
      if (isMatch) {
        btn.className = `cat-pill ${mode === 'sow' ? 'bg-[#80534C]' : 'bg-black'} text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm transition`;
      } else {
        btn.className = 'cat-pill bg-zinc-100 text-zinc-600 hover:text-black hover:bg-zinc-200 px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer';
      }
    });
  }

  page.innerHTML = `
    <div class="w-full max-w-[1360px] mx-auto">
      <!-- Catalog Header -->
      <section class="px-5 pt-4 pb-1" data-purpose="catalog-heading">
        <h1 class="font-headline text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-950">
          ${mode === 'sow' ? "Women's Collection" : "Men's Collection"}
        </h1>
        <p class="text-xs text-zinc-500 font-medium tracking-wide mt-0.5">
          ${mode === 'sow' ? "Sculpted. Luxury. Everyday." : "Performance. Comfort. Everyday."}
        </p>
      </section>

      <!-- Category Pills -->
      <nav aria-label="Categories" class="pt-3 pb-2 px-5 overflow-x-auto no-scrollbar relative">
        <div class="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
        <div class="flex items-center space-x-2 w-max" id="category-pills-bar">
          <button class="cat-pill ${mode === 'sow' ? 'bg-[#80534C]' : 'bg-black'} text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm transition hover:opacity-90" data-cat="all">
            All
          </button>
          <button class="cat-pill bg-zinc-100 text-zinc-600 hover:text-black hover:bg-zinc-200 px-4 py-1.5 rounded-full text-xs font-medium transition" data-cat="t-shirts">
            T-Shirts
          </button>
          <button class="cat-pill bg-zinc-100 text-zinc-600 hover:text-black hover:bg-zinc-200 px-4 py-1.5 rounded-full text-xs font-medium transition" data-cat="tops">
            Tops
          </button>
          <button class="cat-pill bg-zinc-100 text-zinc-600 hover:text-black hover:bg-zinc-200 px-4 py-1.5 rounded-full text-xs font-medium transition" data-cat="shorts">
            Shorts
          </button>
          <button class="cat-pill bg-zinc-100 text-zinc-600 hover:text-black hover:bg-zinc-200 px-4 py-1.5 rounded-full text-xs font-medium transition" data-cat="joggers">
            Joggers
          </button>
        </div>
      </nav>

      <!-- Secondary Filter Bar -->
      <div class="px-5 py-2.5 flex items-center justify-between border-b border-zinc-100 text-xs relative">
        <div class="flex items-center space-x-2">
          <!-- Size Dropdown -->
          <div class="relative">
            <button id="size-dropdown-btn" class="flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-zinc-200 bg-white text-zinc-800 font-medium hover:border-zinc-400 transition cursor-pointer">
              <span id="size-btn-label">Size</span>
              <svg id="size-chevron" class="w-3 h-3 stroke-[2.2] text-zinc-500 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </button>
            <div id="size-dropdown-menu" class="hidden absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl p-2.5 z-40 w-44">
              <p class="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2 font-headline">Select Size</p>
              <div class="flex flex-wrap gap-1.5">
                ${['S', 'M', 'L', 'XL', 'XXL']
                  .map(
                    (s) =>
                      `<button class="size-opt-btn px-2.5 py-1 text-xs rounded border border-zinc-200 hover:border-black font-semibold transition-colors cursor-pointer" data-size="${s}">${s}</button>`
                  )
                  .join('')}
              </div>
            </div>
          </div>

          <!-- Colour Dropdown -->
          <div class="relative">
            <button id="colour-dropdown-btn" class="flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-zinc-200 bg-white text-zinc-800 font-medium hover:border-zinc-400 transition cursor-pointer">
              <span id="colour-btn-label">Colour</span>
              <svg id="colour-chevron" class="w-3 h-3 stroke-[2.2] text-zinc-500 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </button>
            <div id="colour-dropdown-menu" class="hidden absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl p-2.5 z-40 w-44">
              <p class="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2 font-headline">Select Colour</p>
              <div class="flex flex-col gap-1">
                <button class="colour-opt-btn px-2 py-1 text-xs rounded hover:bg-zinc-100 text-left font-medium flex items-center gap-2 cursor-pointer" data-colour="black">
                  <span class="w-3 h-3 rounded-full bg-black"></span> Black
                </button>
                <button class="colour-opt-btn px-2 py-1 text-xs rounded hover:bg-zinc-100 text-left font-medium flex items-center gap-2 cursor-pointer" data-colour="grey">
                  <span class="w-3 h-3 rounded-full bg-zinc-400"></span> Grey
                </button>
                <button class="colour-opt-btn px-2 py-1 text-xs rounded hover:bg-zinc-100 text-left font-medium flex items-center gap-2 cursor-pointer" data-colour="white">
                  <span class="w-3 h-3 rounded-full bg-zinc-100 border border-zinc-300"></span> White
                </button>
              </div>
            </div>
          </div>

          <span id="filter-count-badge" class="hidden px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-bold"></span>
        </div>

        <div class="flex items-center space-x-2">
          <span class="text-[11px] text-zinc-400 hidden sm:inline" id="collection-count">Loading...</span>
          <select id="sort-dropdown" class="px-2.5 py-1.5 rounded-md border border-zinc-200 bg-white text-zinc-800 font-medium text-xs focus:outline-none cursor-pointer">
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      <!-- Active Filter Summary Bar (Item 11) -->
      <div id="active-filters-bar" class="hidden px-5 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between gap-3 text-xs flex-wrap">
        <div class="flex items-center gap-1.5 flex-wrap" id="active-chips-mount"></div>
        <button id="clear-all-filters-btn" class="text-xs font-bold text-zinc-500 hover:text-black underline cursor-pointer shrink-0">Clear All</button>
      </div>

      <!-- Product Catalog Grid -->
      <main class="px-4 pt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5 md:gap-4 flex-1" data-purpose="product-catalog-grid" id="collection-products-grid">
        ${Array(PAGE_SIZE).fill(0).map(() => `
          <div class="rounded-xl sm:rounded-2xl border border-zinc-200/80 bg-white p-2.5 animate-pulse">
            <div class="aspect-[3/4] rounded-lg bg-zinc-200 mb-3"></div>
            <div class="h-3 bg-zinc-200 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-zinc-200 rounded w-1/2"></div>
          </div>
        `).join('')}
      </main>

      <!-- Infinite Scroll / Load More Footer (Item 3) -->
      <div id="load-more-container" class="hidden mt-12 mb-6 flex flex-col items-center justify-center text-center px-4">
        <p class="text-xs text-zinc-500 font-medium mb-2 font-headline" id="pagination-progress-text">Showing 8 of 16 garments</p>
        <div class="w-48 h-1.5 bg-zinc-200 rounded-full overflow-hidden mb-4">
          <div class="h-full bg-black rounded-full transition-all duration-300" id="pagination-progress-fill" style="width: 50%"></div>
        </div>
        <button id="load-more-btn" class="px-8 py-3 rounded-full border border-black text-black hover:bg-black hover:text-white transition-colors text-xs font-bold uppercase font-headline tracking-wider cursor-pointer shadow-xs">
          Load More Garments
        </button>
        <!-- Infinite Scroll Sentinel -->
        <div id="infinite-scroll-sentinel" class="w-full h-4"></div>
      </div>
    </div>
  `;

  // Category pill handlers
  page.querySelectorAll('.cat-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedCategory = btn.dataset.cat;
      visibleCount = PAGE_SIZE;
      syncCategoryButtons();
      updateGrid();
    });
  });

  // Size Dropdown Handlers
  const sizeBtn = page.querySelector('#size-dropdown-btn');
  const sizeMenu = page.querySelector('#size-dropdown-menu');
  const colourBtn = page.querySelector('#colour-dropdown-btn');
  const colourMenu = page.querySelector('#colour-dropdown-menu');
  const clearAllBtn = page.querySelector('#clear-all-filters-btn');

  const sizeChevron = page.querySelector('#size-chevron');
  const colourChevron = page.querySelector('#colour-chevron');

  sizeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !sizeMenu?.classList.toggle('hidden');
    if (sizeChevron) sizeChevron.style.transform = isOpen ? 'rotate(180deg)' : '';
    colourMenu?.classList.add('hidden');
    if (colourChevron) colourChevron.style.transform = '';
  });

  page.querySelectorAll('.size-opt-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const s = btn.dataset.size;
      if (selectedSizes.includes(s)) {
        selectedSizes = selectedSizes.filter((item) => item !== s);
      } else {
        selectedSizes.push(s);
      }
      syncSizeButtons();
      syncFilterLabels();
      visibleCount = PAGE_SIZE;
      updateGrid();
    });
  });

  // Colour Dropdown Handlers
  colourBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !colourMenu?.classList.toggle('hidden');
    if (colourChevron) colourChevron.style.transform = isOpen ? 'rotate(180deg)' : '';
    sizeMenu?.classList.add('hidden');
    if (sizeChevron) sizeChevron.style.transform = '';
  });

  page.querySelectorAll('.colour-opt-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const c = btn.dataset.colour;
      if (selectedColours.includes(c)) {
        selectedColours = selectedColours.filter((item) => item !== c);
      } else {
        selectedColours.push(c);
      }
      syncColourButtons();
      syncFilterLabels();
      visibleCount = PAGE_SIZE;
      updateGrid();
    });
  });

  clearAllBtn?.addEventListener('click', resetAllFilters);

  // Close dropdowns on outside click
  document.addEventListener('click', () => {
    sizeMenu?.classList.add('hidden');
    colourMenu?.classList.add('hidden');
    if (sizeChevron) sizeChevron.style.transform = '';
    if (colourChevron) colourChevron.style.transform = '';
  });

  // Sort dropdown
  page.querySelector('#sort-dropdown')?.addEventListener('change', (e) => {
    sortOrder = e.target.value;
    updateGrid();
  });

  // Load More Button & Infinite Scroll Sentinel Observer (Item 3)
  const loadMoreBtn = page.querySelector('#load-more-btn');
  const sentinel = page.querySelector('#infinite-scroll-sentinel');

  const handleLoadMore = () => {
    if (visibleCount < currentFilteredProducts.length) {
      visibleCount += PAGE_SIZE;
      renderProductsBatch();
    }
  };

  loadMoreBtn?.addEventListener('click', () => {
    if (loadMoreBtn) {
      loadMoreBtn.textContent = 'Loading...';
      loadMoreBtn.disabled = true;
    }
    setTimeout(handleLoadMore, 0);
  });

  if (sentinel) {
    const sentinelObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < currentFilteredProducts.length) {
        handleLoadMore();
      }
    }, { rootMargin: '200px' });
    sentinelObserver.observe(sentinel);
  }

  // Subscribe to mode change
  const unsub = subscribe((state) => {
    if (state.mode !== mode) {
      mode = state.mode;
      visibleCount = PAGE_SIZE;
      updateGrid();
    }
  });

  container.innerHTML = '';
  container.appendChild(page);

  updateGrid();

  return unsub;
}

export default { render };
