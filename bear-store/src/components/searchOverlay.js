import { searchProducts } from '../services/productService.js';
import { getMode, setState, subscribe } from '../state/store.js';
import { createProductCard } from './productCard.js';
import { trapFocus, releaseFocus } from '../utils/accessibility.js';
import { renderEmptyIllustration } from './emptyState.js';
import { applyStagger } from '../utils/animations.js';

let overlay = null;
let previousFocus = null;
let searchTimeout = null;
let releaseTrap = null;

const SEARCH_HISTORY_KEY = 'bear_search_history';
const trendingSuggestions = ['Oversized Tee', 'Training Shorts', 'Seamless Leggings', 'Heavyweight Hoodie', 'Pump Cover', 'Sports Bra'];

function getSearchHistory() {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSearchQuery(query) {
  if (!query || query.trim().length < 2) return;
  try {
    let list = getSearchHistory();
    list = list.filter((q) => q.toLowerCase() !== query.toLowerCase());
    list.unshift(query.trim());
    if (list.length > 6) list = list.slice(0, 6);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(list));
  } catch {}
}

function clearSearchHistory() {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {}
}

export function mount(container) {
  overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-white/98 backdrop-blur-2xl z-50 flex flex-col p-4 sm:p-8 md:p-12 opacity-0 pointer-events-none transition-opacity duration-300';
  overlay.id = 'search-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Search');

  overlay.innerHTML = `
    <div class="max-w-4xl mx-auto w-full flex flex-col h-full">
      <!-- Search Top Bar -->
      <div class="flex items-center gap-3 pb-4 border-b border-zinc-200">
        <div class="flex-1 flex items-center gap-2.5 bg-zinc-100 px-4 py-3 rounded-full border border-zinc-200 focus-within:ring-2 focus-within:ring-black focus-within:bg-white transition-all">
          <span class="material-symbols-outlined text-[22px] text-zinc-400">search</span>
          <input 
            type="search" 
            id="search-input" 
            placeholder="Search performance pieces, technical fabrics, colors…" 
            class="flex-1 bg-transparent text-xs sm:text-sm text-zinc-900 focus:outline-none placeholder:text-zinc-400"
            autocomplete="off"
          />
          <button id="search-clear-btn" class="text-zinc-400 hover:text-black hidden cursor-pointer" type="button" aria-label="Clear query">
            <span class="material-symbols-outlined text-[18px]">cancel</span>
          </button>
        </div>

        <button id="search-close-btn" class="px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-headline text-xs uppercase font-bold transition-colors cursor-pointer" type="button">
          Cancel
        </button>
      </div>

      <!-- Quick Search History & Trending Suggestions Container -->
      <div id="search-tags-container" class="py-4 border-b border-zinc-100 space-y-3">
        <!-- Recent Searches Section (Item 10) -->
        <div id="recent-searches-row" class="hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="font-headline text-[11px] text-zinc-400 uppercase font-bold tracking-wider flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">history</span>
              <span>Recent Searches</span>
            </span>
            <button id="clear-history-btn" class="text-[10px] text-zinc-400 hover:text-black uppercase font-bold underline cursor-pointer">Clear</button>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap" id="recent-chips-mount"></div>
        </div>

        <!-- Trending Searches -->
        <div>
          <span class="font-headline text-[11px] text-zinc-400 uppercase font-bold tracking-wider block mb-2">Trending Searches</span>
          <div class="flex items-center gap-1.5 flex-wrap">
            ${trendingSuggestions
              .map(
                (tag) => `
                <button class="search-tag px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs text-zinc-800 font-semibold transition-colors cursor-pointer" data-query="${tag}">
                  ${tag}
                </button>
              `
              )
              .join('')}
          </div>
        </div>
      </div>

      <!-- Results Grid Container -->
      <div class="flex-1 overflow-y-auto pt-6 no-scrollbar" id="search-results-area">
        <div class="text-center py-20 text-zinc-400">
          <span class="material-symbols-outlined text-4xl mb-2">manage_search</span>
          <p class="font-headline text-sm uppercase font-bold text-zinc-950">Search BEAR & SOW Drops</p>
          <p class="text-xs text-zinc-500 mt-1">Type product names, categories, or keywords to view real-time results.</p>
        </div>
      </div>
    </div>
  `;

  const input = overlay.querySelector('#search-input');
  const clearBtn = overlay.querySelector('#search-clear-btn');
  const closeBtn = overlay.querySelector('#search-close-btn');
  const resultsArea = overlay.querySelector('#search-results-area');
  const tagsContainer = overlay.querySelector('#search-tags-container');
  const recentRow = overlay.querySelector('#recent-searches-row');
  const recentChipsMount = overlay.querySelector('#recent-chips-mount');
  const clearHistoryBtn = overlay.querySelector('#clear-history-btn');

  function renderRecentHistoryChips() {
    const history = getSearchHistory();
    if (history.length > 0) {
      recentRow.classList.remove('hidden');
      recentChipsMount.innerHTML = history
        .map(
          (q) => `
          <button class="recent-tag px-3 py-1 rounded-full border border-zinc-200 bg-white hover:border-black text-xs text-zinc-800 font-medium transition-colors cursor-pointer flex items-center gap-1" data-query="${q}">
            <span>${q}</span>
          </button>
        `
        )
        .join('');

      recentChipsMount.querySelectorAll('.recent-tag').forEach((btn) => {
        btn.addEventListener('click', () => {
          input.value = btn.dataset.query;
          performSearch(btn.dataset.query);
        });
      });
    } else {
      recentRow.classList.add('hidden');
      recentChipsMount.innerHTML = '';
    }
  }

  clearHistoryBtn?.addEventListener('click', () => {
    clearSearchHistory();
    renderRecentHistoryChips();
  });

  function open() {
    previousFocus = document.activeElement;
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.style.willChange = 'opacity';
    document.body.classList.add('overflow-hidden');
    renderRecentHistoryChips();
    releaseTrap = trapFocus(overlay);
    setTimeout(() => input.focus(), 50);
  }

  function close() {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.style.willChange = 'auto';
    document.body.classList.remove('overflow-hidden');
    if (releaseTrap) releaseTrap();
    input.value = '';
    clearBtn.classList.add('hidden');
    tagsContainer.classList.remove('hidden');
    setTimeout(() => releaseFocus(previousFocus), 300);
    setState({ searchOpen: false });
  }

  closeBtn?.addEventListener('click', close);
  clearBtn?.addEventListener('click', () => {
    input.value = '';
    clearBtn.classList.add('hidden');
    tagsContainer.classList.remove('hidden');
    renderRecentHistoryChips();
    input.focus();
    resultsArea.innerHTML = `
      <div class="text-center py-20 text-zinc-400">
        <span class="material-symbols-outlined text-4xl mb-2">manage_search</span>
        <p class="font-headline text-sm uppercase font-bold text-zinc-950">Search BEAR & SOW Drops</p>
        <p class="text-xs text-zinc-500 mt-1">Type product names, categories, or keywords to view real-time results.</p>
      </div>
    `;
  });

  async function performSearch(query) {
    if (!query || query.trim() === '') {
      clearBtn.classList.add('hidden');
      tagsContainer.classList.remove('hidden');
      return;
    }
    clearBtn.classList.remove('hidden');
    tagsContainer.classList.add('hidden');

    // Save to search history
    saveSearchQuery(query);

    resultsArea.innerHTML = `
      <div class="flex justify-center py-16">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    `;

    const results = await searchProducts(query, getMode());

    resultsArea.innerHTML = '';
    if (results.length === 0) {
      resultsArea.innerHTML = `
        <div class="text-center py-16">
          ${renderEmptyIllustration('search')}
          <p class="font-headline text-sm uppercase font-bold text-zinc-950">No matching garments found</p>
          <p class="text-xs text-zinc-500 mt-1">We couldn't find anything matching "${query}". Try searching "Tee", "Shorts", "Joggers", or "Leggings".</p>
        </div>
      `;
    } else {
      const header = document.createElement('p');
      header.className = 'font-headline text-xs text-zinc-400 uppercase font-bold tracking-wider mb-4';
      header.textContent = `Found ${results.length} Matching Garment${results.length !== 1 ? 's' : ''}`;
      resultsArea.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pb-12';
      results.forEach((p) => {
        grid.appendChild(createProductCard(p));
      });
      applyStagger(grid);
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
