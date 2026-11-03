import { searchProducts } from '../services/productService.js';
import { getMode, setState, subscribe } from '../state/store.js';
import { createProductCard } from './productCard.js';
import { trapFocus, releaseFocus } from '../utils/accessibility.js';

let overlay = null;
let previousFocus = null;
let searchTimeout = null;
let releaseTrap = null;

const suggestions = ['Oversized Tee', 'Training Shorts', 'Sculpt Flex Bra', 'Leggings', 'Hoodie', 'Joggers'];

export function mount(container) {
  overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-surface-container-lowest/98 backdrop-blur-2xl z-50 flex flex-col p-6 sm:p-12 opacity-0 pointer-events-none transition-opacity duration-300';
  overlay.id = 'search-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Search');

  overlay.innerHTML = `
    <div class="max-w-4xl mx-auto w-full flex flex-col h-full">
      <!-- Search Top Bar -->
      <div class="flex items-center gap-space-md pb-space-lg border-b border-outline-variant/40">
        <div class="flex-1 flex items-center gap-space-sm bg-surface-container-low px-space-lg py-3.5 rounded-full border border-outline-variant/50 focus-within:ring-2 focus-within:ring-primary transition-all">
          <span class="material-symbols-outlined text-[24px] text-on-surface-variant">search</span>
          <input 
            type="search" 
            id="search-input" 
            placeholder="Search performance pieces, colors, collections…" 
            class="flex-1 bg-transparent font-body-md text-body-md text-on-surface focus:outline-none placeholder:text-on-surface-variant"
            autocomplete="off"
          />
          <button id="search-clear-btn" class="text-on-surface-variant hover:text-primary hidden cursor-pointer" type="button" aria-label="Clear query">
            <span class="material-symbols-outlined text-[20px]">cancel</span>
          </button>
        </div>

        <button id="search-close-btn" class="px-space-lg py-3 rounded-full bg-surface-container hover:bg-surface-container-high text-primary font-label-caps text-sm uppercase font-bold transition-colors cursor-pointer" type="button">
          Cancel
        </button>
      </div>

      <!-- Quick Search Suggestions -->
      <div class="py-space-md flex items-center gap-2 flex-wrap" id="search-suggestions-wrap">
        <span class="font-label-caps text-xs text-on-surface-variant uppercase font-bold mr-1">Trending:</span>
        ${suggestions
          .map(
            (tag) => `
            <button class="search-tag px-space-md py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-xs text-primary font-semibold transition-colors cursor-pointer" data-query="${tag}">
              ${tag}
            </button>
          `
          )
          .join('')}
      </div>

      <!-- Results Grid Container -->
      <div class="flex-1 overflow-y-auto pt-space-lg no-scrollbar" id="search-results-area">
        <div class="text-center py-20 text-on-surface-variant">
          <span class="material-symbols-outlined text-4xl mb-2">manage_search</span>
          <p class="font-headline-sm text-sm uppercase font-bold text-primary font-headline">Search BEAR & SOW Drops</p>
          <p class="text-xs text-on-surface-variant mt-1">Type product names, categories, or keywords to view real-time results.</p>
        </div>
      </div>
    </div>
  `;

  const input = overlay.querySelector('#search-input');
  const clearBtn = overlay.querySelector('#search-clear-btn');
  const closeBtn = overlay.querySelector('#search-close-btn');
  const resultsArea = overlay.querySelector('#search-results-area');

  function open() {
    previousFocus = document.activeElement;
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    document.body.classList.add('overflow-hidden');
    releaseTrap = trapFocus(overlay);
    setTimeout(() => input.focus(), 50);
  }

  function close() {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    document.body.classList.remove('overflow-hidden');
    if (releaseTrap) releaseTrap();
    input.value = '';
    clearBtn.classList.add('hidden');
    setTimeout(() => releaseFocus(previousFocus), 300);
    setState({ searchOpen: false });
  }

  closeBtn?.addEventListener('click', close);
  clearBtn?.addEventListener('click', () => {
    input.value = '';
    clearBtn.classList.add('hidden');
    input.focus();
    resultsArea.innerHTML = `
      <div class="text-center py-20 text-on-surface-variant">
        <span class="material-symbols-outlined text-4xl mb-2">manage_search</span>
        <p class="font-headline-sm text-sm uppercase font-bold text-primary font-headline">Search BEAR & SOW Drops</p>
      </div>
    `;
  });

  async function performSearch(query) {
    if (!query || query.trim() === '') {
      clearBtn.classList.add('hidden');
      return;
    }
    clearBtn.classList.remove('hidden');

    resultsArea.innerHTML = `
      <div class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    `;

    const results = await searchProducts(query, getMode());

    resultsArea.innerHTML = '';
    if (results.length === 0) {
      resultsArea.innerHTML = `
        <div class="text-center py-16">
          <p class="font-headline-sm text-sm uppercase font-bold text-primary font-headline">No matching garments found</p>
          <p class="text-xs text-on-surface-variant mt-1">We couldn't find anything matching "${query}". Try searching "Tee", "Shorts", "Joggers", or "Bra".</p>
        </div>
      `;
    } else {
      const header = document.createElement('p');
      header.className = 'font-label-caps text-xs text-on-surface-variant uppercase font-bold mb-4';
      header.textContent = `Found ${results.length} Matching Garment${results.length !== 1 ? 's' : ''}`;
      resultsArea.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-gutter-desktop pb-12';
      results.forEach((p) => {
        grid.appendChild(createProductCard(p));
      });
      resultsArea.appendChild(grid);
    }
  }

  input?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(e.target.value), 250);
  });

  overlay.querySelectorAll('.search-tag').forEach((btn) => {
    btn.addEventListener('click', () => {
      input.value = btn.dataset.query;
      performSearch(btn.dataset.query);
    });
  });

  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  subscribe((state) => {
    if (state.searchOpen && overlay.classList.contains('pointer-events-none')) open();
    if (!state.searchOpen && !overlay.classList.contains('pointer-events-none')) close();
  });

  container.appendChild(overlay);
}

export default { mount };
