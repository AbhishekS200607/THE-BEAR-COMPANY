/**
 * PIN & Live Order Tracking Page
 */
export function render(container) {
  const page = document.createElement('div');
  page.className = 'w-full max-w-[900px] mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-28 pb-32 md:pb-16 text-zinc-900';

  page.innerHTML = `
    <!-- Header -->
    <div class="text-center max-w-xl mx-auto mb-10">
      <p class="font-headline text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">LOGISTICS &amp; TRANSIT</p>
      <h1 class="font-headline text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-zinc-950">Track Your Drop</h1>
      <p class="text-xs sm:text-sm text-zinc-500 mt-2">Enter your 4-digit order number or check delivery speed for your Indian PIN code.</p>
    </div>

    <!-- Dual Tab System: Track by Order OR Check PIN Code -->
    <div class="flex items-center justify-center gap-2 mb-8">
      <button id="tab-btn-order" class="px-5 py-2 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-black text-white shadow-xs transition-colors cursor-pointer">
        Track Existing Order
      </button>
      <button id="tab-btn-pincode" class="px-5 py-2 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-zinc-100 text-zinc-600 hover:text-black transition-colors cursor-pointer">
        Check PIN Transit Time
      </button>
    </div>

    <!-- Panel 1: Order Tracking -->
    <div id="panel-order" class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-5 sm:p-8 shadow-xs">
      <h2 class="font-headline text-sm font-bold uppercase tracking-wider text-zinc-950 mb-4 pb-2 border-b border-zinc-100">Live Order Status</h2>
      <form id="track-order-form" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Order ID</label>
          <input type="text" id="track-order-id" placeholder="e.g. BEAR-1049 or 1049" required value="BEAR-1049" class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black font-mono" />
        </div>
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Phone / WhatsApp Number</label>
          <input type="tel" id="track-phone" placeholder="10-digit mobile number" required value="9876543210" class="w-full px-3.5 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black font-mono" />
        </div>
        <div class="sm:col-span-2 pt-2">
          <button type="submit" class="w-full py-3 bg-black text-white rounded-full font-headline text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer">
            Track Shipment
          </button>
        </div>
      </form>

      <!-- Live Tracking Result Container -->
      <div id="tracking-result" class="mt-8 pt-6 border-t border-zinc-100">
        <div class="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 p-4 rounded-none sm:rounded-sm border border-zinc-200 mb-6">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-headline">Air Courier AWB</span>
            <p class="font-mono text-xs font-bold text-zinc-900">BLUEDART AIR • BD8942109IN</p>
          </div>
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-headline">Estimated Delivery</span>
            <p class="text-xs font-bold text-green-700">Tomorrow by 8:00 PM</p>
          </div>
          <div>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase font-headline">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>In Transit</span>
            </span>
          </div>
        </div>

        <!-- Stepper -->
        <div class="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
          <!-- Step 1 -->
          <div class="relative">
            <span class="absolute -left-6 top-1 w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[10px]">✓</span>
            <p class="text-xs font-bold text-zinc-900 font-headline">Order Confirmed &amp; Payment Verified</p>
            <p class="text-[11px] text-zinc-500">BEAR Fulfillment Central — Nov 03, 14:20 IST</p>
          </div>
          <!-- Step 2 -->
          <div class="relative">
            <span class="absolute -left-6 top-1 w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[10px]">✓</span>
            <p class="text-xs font-bold text-zinc-900 font-headline">Dispatched via BlueDart Express Air</p>
            <p class="text-[11px] text-zinc-500">Bengaluru Air Freight Hub — Nov 03, 19:45 IST</p>
          </div>
          <!-- Step 3 -->
          <div class="relative">
            <span class="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">●</span>
            <p class="text-xs font-bold text-emerald-700 font-headline">In Transit — Arrived at Regional Gateway</p>
            <p class="text-[11px] text-zinc-500">Sorting Center — Live Update</p>
          </div>
          <!-- Step 4 -->
          <div class="relative">
            <span class="absolute -left-6 top-1 w-4 h-4 rounded-full bg-zinc-200 text-zinc-400 flex items-center justify-center text-[10px]">○</span>
            <p class="text-xs font-bold text-zinc-400 font-headline">Out for Doorstep Delivery</p>
            <p class="text-[11px] text-zinc-400">Scheduled for Tomorrow</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel 2: PIN Code Lookup (Hidden by default) -->
    <div id="panel-pincode" class="hidden bg-white border border-zinc-200 rounded-none sm:rounded-sm p-5 sm:p-8 shadow-xs">
      <h2 class="font-headline text-sm font-bold uppercase tracking-wider text-zinc-950 mb-4 pb-2 border-b border-zinc-100">Check PIN Code Serviceability</h2>
      <form id="pincode-form" class="flex flex-col sm:flex-row gap-3">
        <input type="text" id="pincode-input" maxlength="6" placeholder="Enter 6-digit Indian PIN Code (e.g. 560001)" required class="flex-1 px-4 py-2.5 rounded-none sm:rounded-sm border border-zinc-200 text-xs text-zinc-900 font-mono focus:outline-none focus:border-black" />
        <button type="submit" class="px-6 py-2.5 bg-black text-white rounded-full font-headline text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer shrink-0">
          Check Speed
        </button>
      </form>

      <div id="pincode-result" class="mt-6 pt-4 border-t border-zinc-100 hidden">
        <div class="p-4 rounded-none sm:rounded-sm bg-green-50 border border-green-200 flex items-start gap-3">
          <span class="material-symbols-outlined text-green-700 text-xl">verified</span>
          <div>
            <p class="font-headline text-xs font-bold text-green-900 uppercase">Express Delivery Available</p>
            <p class="text-xs text-green-800 mt-0.5" id="pincode-msg">PIN Code 560001 is serviced via BlueDart Air Express. Guaranteed dispatch within 24 hours.</p>
            <div class="flex items-center gap-4 mt-2 text-[11px] text-green-900 font-medium">
              <span>⚡ Air Express: 24-48 Hrs</span>
              <span>💵 Cash on Delivery: Active</span>
              <span>🔄 7-Day Swaps: Supported</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Tab switching
  const tabOrder = page.querySelector('#tab-btn-order');
  const tabPincode = page.querySelector('#tab-btn-pincode');
  const panelOrder = page.querySelector('#panel-order');
  const panelPincode = page.querySelector('#panel-pincode');

  tabOrder?.addEventListener('click', () => {
    tabOrder.className = 'px-5 py-2 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-black text-white shadow-xs transition-colors cursor-pointer';
    tabPincode.className = 'px-5 py-2 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-zinc-100 text-zinc-600 hover:text-black transition-colors cursor-pointer';
    panelOrder.classList.remove('hidden');
    panelPincode.classList.add('hidden');
  });

  tabPincode?.addEventListener('click', () => {
    tabPincode.className = 'px-5 py-2 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-black text-white shadow-xs transition-colors cursor-pointer';
    tabOrder.className = 'px-5 py-2 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-zinc-100 text-zinc-600 hover:text-black transition-colors cursor-pointer';
    panelPincode.classList.remove('hidden');
    panelOrder.classList.add('hidden');
  });

  // Track Order form
  const trackForm = page.querySelector('#track-order-form');
  const trackResult = page.querySelector('#tracking-result');
  trackForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    trackResult?.classList.remove('hidden');
    trackResult?.scrollIntoView({ behavior: 'smooth' });
  });

  // PIN code form
  const pinForm = page.querySelector('#pincode-form');
  const pinResult = page.querySelector('#pincode-result');
  const pinInput = page.querySelector('#pincode-input');
  const pinMsg = page.querySelector('#pincode-msg');

  pinForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pin = pinInput.value.trim();
    if (pin.length === 6) {
      pinMsg.textContent = `PIN Code ${pin} is fully covered by our Air Express logistics network. Dispatches within 24 hours.`;
      pinResult?.classList.remove('hidden');
    }
  });

  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };

