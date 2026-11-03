/**
 * 7-Day Doorstep Swaps & Returns Policy
 */
export function render(container) {
  const page = document.createElement('div');
  page.className = 'w-full max-w-[900px] mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-28 pb-32 md:pb-16 text-zinc-900';

  page.innerHTML = `
    <!-- Header -->
    <div class="text-center max-w-xl mx-auto mb-10 md:mb-12">
      <p class="font-headline text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">ZERO FRICTION</p>
      <h1 class="font-headline text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-zinc-950">7-Day Doorstep Swaps</h1>
      <p class="text-xs sm:text-sm text-zinc-500 mt-2">The wrong fit shouldn't interrupt your training. We replace your size directly at your door with zero courier fees.</p>
    </div>

    <!-- 3-Step Exchange Process -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
      <div class="p-5 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <div class="w-8 h-8 rounded-full bg-black text-white font-headline text-xs font-bold flex items-center justify-center mb-3">1</div>
        <h3 class="font-headline text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900 mb-1">Request Swap</h3>
        <p class="text-xs text-zinc-500 leading-relaxed">Enter your order ID below or text our WhatsApp Desk with the size you need.</p>
      </div>

      <div class="p-5 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <div class="w-8 h-8 rounded-full bg-black text-white font-headline text-xs font-bold flex items-center justify-center mb-3">2</div>
        <h3 class="font-headline text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900 mb-1">Doorstep Pickup</h3>
        <p class="text-xs text-zinc-500 leading-relaxed">Our courier arrives with a tamper bag. No need to print return labels or tape boxes.</p>
      </div>

      <div class="p-5 bg-white border border-zinc-200 rounded-none sm:rounded-sm">
        <div class="w-8 h-8 rounded-full bg-black text-white font-headline text-xs font-bold flex items-center justify-center mb-3">3</div>
        <h3 class="font-headline text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900 mb-1">Immediate Dispatch</h3>
        <p class="text-xs text-zinc-500 leading-relaxed">Your replacement piece is dispatched within 24 hours via express air delivery.</p>
      </div>
    </div>

    <!-- Instant Swap Request Form -->
    <div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-5 sm:p-8 mb-10 shadow-xs">
      <h2 class="font-headline text-sm font-bold uppercase tracking-wider text-zinc-950 mb-4 pb-2 border-b border-zinc-100">Initiate Doorstep Size Swap</h2>
      <form id="swap-form" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Order Number</label>
            <input type="text" id="swap-order-id" placeholder="e.g. BEAR-1049" required class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black font-mono" />
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Registered Phone / WhatsApp</label>
            <input type="tel" id="swap-phone" placeholder="10-digit mobile number" required class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black font-mono" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Reason for Swap</label>
            <select id="swap-reason" class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black bg-white">
              <option value="size_too_small">Size too small — need one size up</option>
              <option value="size_too_large">Size too large — need one size down</option>
              <option value="prefer_different_colour">Prefer a different colourway</option>
              <option value="defective">Manufacturing defect or yarn pull</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Requested Replacement Size</label>
            <select id="swap-size" class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black bg-white">
              <option value="S">Size S (Small)</option>
              <option value="M">Size M (Medium)</option>
              <option value="L">Size L (Large)</option>
              <option value="XL">Size XL (Extra Large)</option>
              <option value="XXL">Size XXL (Double XL)</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Pickup Address Instructions (Optional)</label>
          <input type="text" id="swap-notes" placeholder="e.g. Ring doorbell, available after 2 PM" class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black" />
        </div>

        <button type="submit" class="w-full py-3 bg-black text-white rounded-full font-headline text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer mt-2">
          Submit Doorstep Swap Request
        </button>
      </form>

      <div id="swap-success" class="mt-4 p-4 rounded-none sm:rounded-sm bg-green-50 border border-green-200 hidden">
        <p class="font-headline text-xs font-bold text-green-900 uppercase">Swap Request Registered!</p>
        <p class="text-xs text-green-800 mt-1">Our courier will contact you within 24 hours for doorstep pickup. Your replacement piece has been reserved in our fulfillment hub.</p>
      </div>
    </div>

    <!-- Policy Conditions -->
    <div class="bg-zinc-50 border border-zinc-200 rounded-none sm:rounded-sm p-6 text-xs text-zinc-600 space-y-3 leading-relaxed">
      <h3 class="font-headline text-xs font-bold uppercase tracking-wider text-zinc-900">Exchange Guidelines</h3>
      <p>• Items must be unwashed, unworn, and have all original brand tags and inner labels intact.</p>
      <p>• For hygiene safety, compression baselayers and sports bras must be tried on over clean undergarments with safety strips unpeeled.</p>
      <p>• Full refunds to original payment method or UPI are processed within 48 hours of return inspection.</p>
    </div>
  `;

  const form = page.querySelector('#swap-form');
  const success = page.querySelector('#swap-success');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    form.style.display = 'none';
    success?.classList.remove('hidden');
  });

  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };

