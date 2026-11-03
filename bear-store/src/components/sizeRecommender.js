/**
 * Interactive Size Recommendation Tool ("What's My Size")
 * Calculates optimal sizing based on height, weight, and preferred drape.
 */

export function openSizeRecommender({ currentSize, onSelectSize } = {}) {
  const existing = document.getElementById('size-recommender-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'size-recommender-modal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200';

  let height = 175; // cm
  let weight = 74;  // kg
  let fitPreference = 'regular'; // 'fitted', 'regular', 'oversized'

  function calculateSize() {
    // Intelligent heuristic based on height, weight, and preferred drape
    const bmi = weight / ((height / 100) * (height / 100));
    let base = 'M';

    if (bmi < 20.5) base = 'S';
    else if (bmi < 23.5) base = 'M';
    else if (bmi < 26.5) base = 'L';
    else if (bmi < 29.5) base = 'XL';
    else base = 'XXL';

    // Drape adjustment
    if (fitPreference === 'fitted') {
      if (base === 'XXL') base = 'XL';
      else if (base === 'XL') base = 'L';
      else if (base === 'L') base = 'M';
    } else if (fitPreference === 'oversized') {
      if (base === 'S') base = 'M';
      else if (base === 'M') base = 'L';
      else if (base === 'L') base = 'XL';
      else if (base === 'XL') base = 'XXL';
    }

    const confidence = Math.min(96, Math.max(88, Math.floor(95 - Math.abs(bmi - 23))));
    return { size: base, confidence };
  }

  function renderContent() {
    const { size, confidence } = calculateSize();

    modal.innerHTML = `
      <div class="bg-white rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative border border-zinc-200 animate-in fade-in zoom-in-95 duration-200">
        <!-- Close Button -->
        <button id="sr-close-btn" class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors" aria-label="Close">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div class="flex items-center gap-2 mb-1">
          <span class="material-symbols-outlined text-zinc-950 text-xl">straighten</span>
          <h2 class="font-headline text-base font-extrabold uppercase tracking-tight text-zinc-950">Fit &amp; Size Recommender</h2>
        </div>
        <p class="text-xs text-zinc-500 mb-6">Enter your physical dimensions for an algorithmic athletic fit match.</p>

        <!-- Height Slider -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-zinc-600 font-headline">Height</label>
            <span class="font-mono text-xs font-bold text-zinc-950" id="sr-height-val">${height} cm (${Math.floor(height / 30.48)}' ${Math.round((height % 30.48) / 2.54)}")</span>
          </div>
          <input type="range" id="sr-height-range" min="150" max="205" value="${height}" class="w-full accent-black cursor-pointer" />
        </div>

        <!-- Weight Slider -->
        <div class="mb-5">
          <div class="flex justify-between items-center mb-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-zinc-600 font-headline">Weight</label>
            <span class="font-mono text-xs font-bold text-zinc-950" id="sr-weight-val">${weight} kg (${Math.round(weight * 2.20462)} lbs)</span>
          </div>
          <input type="range" id="sr-weight-range" min="45" max="120" value="${weight}" class="w-full accent-black cursor-pointer" />
        </div>

        <!-- Fit Preference Pills -->
        <div class="mb-6">
          <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 font-headline mb-2">Preferred Drape / Cut</label>
          <div class="grid grid-cols-3 gap-2">
            <button type="button" class="sr-fit-btn py-2 px-1 text-center rounded-lg text-xs font-semibold border transition-all ${fitPreference === 'fitted' ? 'bg-black text-white border-black shadow-xs' : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-300'}" data-fit="fitted">
              Fitted
            </button>
            <button type="button" class="sr-fit-btn py-2 px-1 text-center rounded-lg text-xs font-semibold border transition-all ${fitPreference === 'regular' ? 'bg-black text-white border-black shadow-xs' : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-300'}" data-fit="regular">
              Athletic
            </button>
            <button type="button" class="sr-fit-btn py-2 px-1 text-center rounded-lg text-xs font-semibold border transition-all ${fitPreference === 'oversized' ? 'bg-black text-white border-black shadow-xs' : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-300'}" data-fit="oversized">
              Oversized
            </button>
          </div>
        </div>

        <!-- Calculated Result Box -->
        <div class="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center mb-6">
          <p class="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-headline mb-0.5">Recommended Size</p>
          <p class="font-headline text-3xl font-black text-zinc-950">${size}</p>
          <p class="text-[11px] text-emerald-700 font-semibold mt-1">✓ ${confidence}% match for your physique &amp; drape preference</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3">
          <button id="sr-apply-btn" class="flex-1 py-3 px-4 rounded-full bg-black text-white font-headline text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 active:scale-98 transition-all shadow-md cursor-pointer">
            Select Size ${size}
          </button>
        </div>
      </div>
    `;

    // Event handlers
    modal.querySelector('#sr-close-btn')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    const hRange = modal.querySelector('#sr-height-range');
    hRange?.addEventListener('input', (e) => {
      height = parseInt(e.target.value, 10);
      renderContent();
    });

    const wRange = modal.querySelector('#sr-weight-range');
    wRange?.addEventListener('input', (e) => {
      weight = parseInt(e.target.value, 10);
      renderContent();
    });

    modal.querySelectorAll('.sr-fit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        fitPreference = btn.dataset.fit;
        renderContent();
      });
    });

    modal.querySelector('#sr-apply-btn')?.addEventListener('click', () => {
      if (typeof onSelectSize === 'function') {
        onSelectSize(size);
      }
      modal.remove();
    });
  }

  renderContent();
  document.body.appendChild(modal);
}

export default { openSizeRecommender };

