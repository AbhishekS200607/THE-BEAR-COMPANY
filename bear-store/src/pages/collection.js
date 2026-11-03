import { getMode, subscribe } from '../state/store.js';
import { getProducts } from '../services/productService.js';
import { createProductCard } from '../components/productCard.js';

export async function render(container) {
  let mode = getMode();
  let selectedCategory = 'all';
  let selectedSizes = [];
  let selectedColours = [];
  let sortOrder = 'featured';

  const page = document.createElement('div');
  page.className = 'w-full flex flex-col pt-14 md:pt-20 pb-32';

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

    const grid = page.querySelector('#collection-products-grid');
    const countEl = page.querySelector('#collection-count');
    if (countEl) countEl.textContent = `${filtered.length} Items`;

    if (grid) {
      grid.innerHTML = '';
      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full py-16 text-center">
            <span class="material-symbols-outlined text-4xl text-zinc-400 mb-2">inventory_2</span>
            <p class="font-headline text-base font-bold text-zinc-900">No products match your filters</p>
            <p class="text-xs text-zinc-500 mt-1">Try resetting size or category filters to view all pieces.</p>
            <button id="empty-reset-btn" class="mt-4 px-4 py-1.5 rounded-full bg-black text-white text-xs font-bold">Reset Filters</button>
          </div>
        `;
        grid.querySelector('#empty-reset-btn')?.addEventListener('click', () => {
          selectedCategory = 'all';
          selectedSizes = [];
          selectedColours = [];
          syncCategoryButtons();
          updateGrid();
        });
      } else {
        filtered.forEach((p) => {
          grid.appendChild(createProductCard(p));
        });
      }
    }
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
    <!-- Top Container: Constrained or Wide Desktop Layout -->
    <div class="w-full max-w-[1360px] mx-auto">
      <!-- BEGIN: CollectionTitleSection (Exact Screen 02 Spec) -->
      <section class="px-5 pt-4 pb-1" data-purpose="catalog-heading">
        <h1 class="font-headline text-2xl md:text-3xl font-bold tracking-tight text-zinc-950">
          ${mode === 'sow' ? "Women's Collection" : "Men's Collection"}
        </h1>
        <p class="text-xs text-zinc-500 font-medium tracking-wide mt-0.5">
          ${mode === 'sow' ? "Sculpted. Luxury. Everyday." : "Performance. Comfort. Everyday."}
        </p>
      </section>

      <!-- BEGIN: CategoryPills (Horizontal scrollable interaction matching Screen 02) -->
      <nav aria-label="Categories" class="pt-3 pb-2 px-5 overflow-x-auto no-scrollbar">
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

      <!-- BEGIN: SecondaryFilterBar (Size, Colour, Sort) -->
      <div class="px-5 py-2.5 flex items-center justify-between border-b border-zinc-100 text-xs relative">
        <div class="flex items-center space-x-2">
          <!-- Size Dropdown -->
          <div class="relative">
            <button id="size-dropdown-btn" class="flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-zinc-200 bg-white text-zinc-800 font-medium hover:border-zinc-400 transition cursor-pointer">
              <span id="size-btn-label">Size</span>
              <svg class="w-3 h-3 stroke-[2.2] text-zinc-500" fill="none" stroke="currentColor" viewbox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </button>
            <div id="size-dropdown-menu" class="hidden absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl p-2.5 z-40 w-44">
              <p class="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2 font-headline">Select Size</p>
              <div class="flex flex-wrap gap-1.5">
                ${['S', 'M', 'L', 'XL', 'XXL']
                  .map(
                    (s) =>
                      `<button class="size-opt-btn px-2.5 py-1 text-xs rounded border border-zinc-200 hover:border-black font-semibold transition-colors" data-size="${s}">${s}</button>`
                  )
                  .join('')}
              </div>
            </div>
          </div>

          <!-- Colour Dropdown -->
          <div class="relative">
            <button id="colour-dropdown-btn" class="flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-zinc-200 bg-white text-zinc-800 font-medium hover:border-zinc-400 transition cursor-pointer">
              <span>Colour</span>
              <svg class="w-3 h-3 stroke-[2.2] text-zinc-500" fill="none" stroke="currentColor" viewbox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </button>
            <div id="colour-dropdown-menu" class="hidden absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl p-2.5 z-40 w-44">
              <p class="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2 font-headline">Select Colour</p>
              <div class="flex flex-col gap-1">
                <button class="colour-opt-btn px-2 py-1 text-xs rounded hover:bg-zinc-100 text-left font-medium flex items-center gap-2" data-colour="black">
                  <span class="w-3 h-3 rounded-full bg-black"></span> Black
                </button>
                <button class="colour-opt-btn px-2 py-1 text-xs rounded hover:bg-zinc-100 text-left font-medium flex items-center gap-2" data-colour="grey">
                  <span class="w-3 h-3 rounded-full bg-zinc-400"></span> Grey
                </button>
                <button class="colour-opt-btn px-2 py-1 text-xs rounded hover:bg-zinc-100 text-left font-medium flex items-center gap-2" data-colour="white">
                  <span class="w-3 h-3 rounded-full bg-zinc-100 border border-zinc-300"></span> White
                </button>
              </div>
            </div>
          </div>

          <!-- Reset Filter Button -->
          <button id="reset-filter-btn" class="text-xs text-zinc-500 hover:text-black underline ml-1 hidden cursor-pointer">Reset</button>
        </div>

        <div class="flex items-center space-x-2">
          <span class="text-[11px] text-zinc-400 hidden sm:inline" id="collection-count">Loading...</span>
          <!-- Sort Dropdown -->
          <select id="sort-dropdown" class="px-2.5 py-1.5 rounded-md border border-zinc-200 bg-white text-zinc-800 font-medium text-xs focus:outline-none cursor-pointer">
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      <!-- BEGIN: ProductGrid (Flipkart-Style 2-Column Mobile, 3-Column Tablet, 4-Column Desktop) -->
      <main class="px-4 pt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5 md:gap-4 flex-1" data-purpose="product-catalog-grid" id="collection-products-grid">
      </main>
    </div>
  `;

  // Category pill handlers
  page.querySelectorAll('.cat-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedCategory = btn.dataset.cat;
      syncCategoryButtons();
      updateGrid();
    });
  });

  // Size Dropdown Handlers
  const sizeBtn = page.querySelector('#size-dropdown-btn');
  const sizeMenu = page.querySelector('#size-dropdown-menu');
  const sizeLabel = page.querySelector('#size-btn-label');
  const resetBtn = page.querySelector('#reset-filter-btn');

  sizeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    sizeMenu?.classList.toggle('hidden');
    colourMenu?.classList.add('hidden');
  });

  page.querySelectorAll('.size-opt-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sz = btn.dataset.size;
      if (selectedSizes.includes(sz)) {
        selectedSizes = selectedSizes.filter((s) => s !== sz);
        btn.classList.remove('bg-black', 'text-white');
      } else {
        selectedSizes.push(sz);
        btn.classList.add('bg-black', 'text-white');
      }
      sizeLabel.textContent = selectedSizes.length > 0 ? `Size (${selectedSizes.length})` : 'Size';
      checkResetState();
      updateGrid();
    });
  });

  // Colour Dropdown Handlers
  const colourBtn = page.querySelector('#colour-dropdown-btn');
  const colourMenu = page.querySelector('#colour-dropdown-menu');

  colourBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    colourMenu?.classList.toggle('hidden');
    sizeMenu?.classList.add('hidden');
  });

  page.querySelectorAll('.colour-opt-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const clr = btn.dataset.colour;
      if (selectedColours.includes(clr)) {
        selectedColours = selectedColours.filter((c) => c !== clr);
        btn.classList.remove('bg-zinc-200');
      } else {
        selectedColours.push(clr);
        btn.classList.add('bg-zinc-200');
      }
      checkResetState();
      updateGrid();
    });
  });

  // Close dropdowns on outside click
  document.addEventListener('click', () => {
    sizeMenu?.classList.add('hidden');
    colourMenu?.classList.add('hidden');
  });

  // Sort change handler
  page.querySelector('#sort-dropdown')?.addEventListener('change', (e) => {
    sortOrder = e.target.value;
    updateGrid();
  });

  // Reset Filters Handler
  function checkResetState() {
    if (selectedSizes.length > 0 || selectedColours.length > 0 || selectedCategory !== 'all') {
      resetBtn?.classList.remove('hidden');
    } else {
      resetBtn?.classList.add('hidden');
    }
  }

  resetBtn?.addEventListener('click', () => {
    selectedCategory = 'all';
    selectedSizes = [];
    selectedColours = [];
    sizeLabel.textContent = 'Size';
    page.querySelectorAll('.size-opt-btn').forEach((b) => b.classList.remove('bg-black', 'text-white'));
    page.querySelectorAll('.colour-opt-btn').forEach((b) => b.classList.remove('bg-zinc-200'));
    resetBtn.classList.add('hidden');
    syncCategoryButtons();
    updateGrid();
  });

  container.innerHTML = '';
  container.appendChild(page);

  // Initial load of products
  await updateGrid();
}

export default { render };
