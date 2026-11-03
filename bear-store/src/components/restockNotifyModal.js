/**
 * Back-in-Stock / Restock Notification Modal
 * Captures user contact for restock alerts when unavailable sizes are tapped.
 */

import { showToast } from './toast.js';

export function openRestockModal({ product, size }) {
  const existing = document.getElementById('restock-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'restock-modal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200';

  const img = product.images?.[0] || product.image || '';

  modal.innerHTML = `
    <div class="bg-white rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative border border-zinc-200 animate-in fade-in zoom-in-95 duration-200">
      <button id="rm-close-btn" class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors" aria-label="Close">
        <span class="material-symbols-outlined text-[20px]">close</span>
      </button>

      <div class="flex items-center gap-2 mb-2 text-zinc-950">
        <span class="material-symbols-outlined text-amber-600">notifications_active</span>
        <h2 class="font-headline text-base font-extrabold uppercase tracking-tight">Back In Stock Alert</h2>
      </div>

      <div class="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200 mb-4">
        ${img ? `<img src="${img}" alt="${product.name}" class="w-12 h-14 object-cover rounded-lg shrink-0 border border-zinc-200" />` : ''}
        <div class="min-w-0">
          <p class="text-xs font-bold text-zinc-900 truncate">${product.name}</p>
          <p class="text-[11px] text-zinc-500 font-medium">Selected Size: <strong class="text-zinc-900">${size}</strong></p>
        </div>
      </div>

      <p class="text-xs text-zinc-600 mb-4 leading-relaxed">
        This size is currently archived or sold out. Leave your WhatsApp number below to receive priority access the second our factory restocks it.
      </p>

      <form id="restock-form" class="space-y-3">
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">WhatsApp Number *</label>
          <input 
            type="tel" 
            id="restock-phone" 
            required 
            placeholder="10-digit mobile number" 
            pattern="[0-9]{10}"
            class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black font-mono transition-colors"
          />
        </div>

        <button type="submit" class="w-full py-3 px-4 rounded-full bg-black text-white font-headline text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 active:scale-98 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-[18px]">notifications</span>
          <span>Notify Me on Restock</span>
        </button>
      </form>
    </div>
  `;

  modal.querySelector('#rm-close-btn')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  const form = modal.querySelector('#restock-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = modal.querySelector('#restock-phone')?.value.trim();
    if (phone && phone.length === 10) {
      showToast(`We will alert ${phone} the moment Size ${size} drops!`, 'success');
      modal.remove();
    } else {
      showToast('Please enter a valid 10-digit phone number', 'error');
    }
  });

  document.body.appendChild(modal);
}

export default { openRestockModal };
