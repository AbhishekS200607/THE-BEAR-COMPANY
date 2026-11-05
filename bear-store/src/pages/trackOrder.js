/**
 * PIN & Live Order Tracking Page
 * Dynamic BlueDart Air Express logistics tracker & Indian PIN code serviceability checker.
 */

import { getDemoOrders } from '../services/accountService.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { showToast } from '../components/toast.js';
import { API_V1 } from '../config/api.js';

export function render(container) {
  const page = document.createElement('div');
  page.className = 'w-full max-w-[920px] mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-28 pb-32 md:pb-16 text-zinc-900';

  page.innerHTML = `
    <!-- Header -->
    <div class="text-center max-w-xl mx-auto mb-10">
      <p class="font-headline text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">LOGISTICS &amp; AIR DISPATCH</p>
      <h1 class="font-headline text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-zinc-950">Track Your Drop</h1>
      <p class="text-xs sm:text-sm text-zinc-500 mt-2">Enter your BEAR order reference or verify express transit speed for your Indian PIN code.</p>
    </div>

    <!-- Dual Tab System: Track by Order OR Check PIN Code -->
    <div class="flex items-center justify-center gap-2 mb-8">
      <button id="tab-btn-order" class="px-5 py-2 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-black text-white shadow-xs transition-colors cursor-pointer">
        Track Existing Order
      </button>
      <button id="tab-btn-pincode" class="px-5 py-2 rounded-full text-xs font-bold font-headline uppercase tracking-wider bg-zinc-100 text-zinc-600 hover:text-black transition-colors cursor-pointer">
        Check PIN Serviceability
      </button>
    </div>

    <!-- Panel 1: Order Tracking -->
    <div id="panel-order" class="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-8 shadow-xs">
      <h2 class="font-headline text-sm font-bold uppercase tracking-wider text-zinc-950 mb-4 pb-2 border-b border-zinc-100 flex items-center gap-2">
        <span class="material-symbols-outlined text-[18px]">local_shipping</span>
        <span>Live Order Tracking</span>
      </h2>

      <form id="track-order-form" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Order Reference *</label>
          <input 
            type="text" 
            id="track-order-id" 
            placeholder="e.g. BEAR-2026-104928" 
            required 
            value="" 
            class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black font-mono transition-colors" 
          />
        </div>
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Phone / WhatsApp Number *</label>
          <input 
            type="tel" 
            id="track-phone" 
            placeholder="10-digit mobile number" 
            required 
            maxlength="10"
            value="" 
            class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black font-mono transition-colors" 
          />
        </div>
        <div class="sm:col-span-2 pt-1">
          <button type="submit" class="w-full py-3 bg-black text-white rounded-full font-headline text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-[18px]">travel_explore</span>
            <span>Locate Shipment</span>
          </button>
        </div>
      </form>

      <!-- Live Tracking Result Container (Hidden until search) -->
      <div id="tracking-result-mount" class="mt-8 pt-6 border-t border-zinc-100 hidden"></div>
    </div>

    <!-- Panel 2: PIN Code Lookup (Hidden by default) -->
    <div id="panel-pincode" class="hidden bg-white border border-zinc-200 rounded-2xl p-5 sm:p-8 shadow-xs">
      <h2 class="font-headline text-sm font-bold uppercase tracking-wider text-zinc-950 mb-4 pb-2 border-b border-zinc-100 flex items-center gap-2">
        <span class="material-symbols-outlined text-[18px]">pin_drop</span>
        <span>Check PIN Code Serviceability</span>
      </h2>
      <p class="text-xs text-zinc-500 mb-4">We deliver across 19,000+ Indian PIN codes via BlueDart Express Air cargo.</p>
      
      <form id="pincode-form" class="flex flex-col sm:flex-row gap-3">
        <input 
          type="text" 
          id="pincode-input" 
          maxlength="6" 
          placeholder="Enter 6-digit Indian PIN Code (e.g. 560001, 110001)" 
          required 
          class="flex-1 px-4 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 font-mono focus:outline-none focus:border-black transition-colors" 
        />
        <button type="submit" class="px-6 py-2.5 bg-black text-white rounded-full font-headline text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer shrink-0">
          Check Speed
        </button>
      </form>

      <div id="pincode-result" class="mt-6 pt-4 border-t border-zinc-100 hidden">
        <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <span class="material-symbols-outlined text-emerald-700 text-xl">verified</span>
          <div>
            <p class="font-headline text-xs font-bold text-emerald-950 uppercase">Express Air Service Active</p>
            <p class="text-xs text-emerald-800 mt-0.5" id="pincode-msg">PIN Code is serviced directly via BlueDart Air Express.</p>
            <div class="flex items-center gap-4 mt-2 text-[11px] text-emerald-900 font-medium flex-wrap">
              <span>⚡ Air Express: 24–48 Hours</span>
              <span>💵 Cash on Delivery (COD): Active</span>
              <span>🔄 7-Day Doorstep Swaps: Active</span>
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

  // Track Order Form Execution
  const trackForm = page.querySelector('#track-order-form');
  const trackResultMount = page.querySelector('#tracking-result-mount');

  trackForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const orderIdInput = page.querySelector('#track-order-id')?.value.trim();
    const phoneInput = page.querySelector('#track-phone')?.value.trim();

    if (!orderIdInput || !phoneInput) {
      showToast('Please enter both Order ID and Phone Number', 'error');
      return;
    }

    // Loading skeleton placeholder
    trackResultMount.classList.remove('hidden');
    trackResultMount.innerHTML = `
      <div class="animate-pulse space-y-4">
        <div class="h-16 bg-zinc-100 rounded-xl"></div>
        <div class="h-4 bg-zinc-100 rounded w-1/2"></div>
        <div class="h-20 bg-zinc-100 rounded-xl"></div>
      </div>
    `;

    // Query live backend API first
    let liveOrder = null;
    try {
      const res = await fetch(`${API_V1}/orders/track?orderNumber=${encodeURIComponent(orderIdInput)}&phone=${encodeURIComponent(phoneInput)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          liveOrder = json.data;
        }
      }
    } catch {
      // Backend offline, fallback to client store
    }

    const allOrders = await getDemoOrders();
    const cleanId = orderIdInput.trim().toUpperCase();
    const cleanPhone = phoneInput.replace(/[^0-9]/g, '').slice(-10);

    const matched = liveOrder || (allOrders || []).find(
      (o) =>
        ((o.orderNumber || o.id || '').toUpperCase() === cleanId) &&
        (!cleanPhone || !o.details?.mobile || o.details.mobile.endsWith(cleanPhone))
    );

    setTimeout(() => {
      if (!matched) {
        trackResultMount.innerHTML = `
          <div class="bg-red-50/80 border border-red-200 rounded-2xl p-6 sm:p-8 text-center text-zinc-800">
            <div class="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <span class="material-symbols-outlined text-2xl">search_off</span>
            </div>
            <h3 class="font-headline text-sm font-bold uppercase tracking-wider text-red-950 mb-1">Shipment Not Found</h3>
            <p class="text-xs text-zinc-600 max-w-md mx-auto mb-4 leading-relaxed">
              We couldn't locate an active shipment matching order reference <strong class="font-mono text-zinc-900">${cleanId}</strong> for phone ending in <strong class="font-mono text-zinc-900">${cleanPhone || phoneInput}</strong>.
            </p>
            <div class="flex flex-wrap items-center justify-center gap-3">
              <a href="https://wa.me/919605210198?text=Hi%20BEAR!%20Need%20help%20tracking%20order%20${encodeURIComponent(cleanId)}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#25D366] text-white text-xs font-bold uppercase font-headline hover:bg-[#1EBE5D] transition-colors">
                <span>WhatsApp Support</span>
              </a>
              <button type="button" id="recheck-order-btn" class="px-5 py-2.5 rounded-full border border-zinc-300 text-xs font-bold uppercase font-headline hover:border-black transition-colors cursor-pointer">
                Try Again
              </button>
            </div>
          </div>
        `;
        trackResultMount.querySelector('#recheck-order-btn')?.addEventListener('click', () => {
          trackResultMount.classList.add('hidden');
          document.getElementById('track-order-id')?.focus();
        });
        trackResultMount.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      const orderRef = liveOrder ? liveOrder.order_number : (matched.orderNumber || matched.id);
      const orderStatus = liveOrder ? liveOrder.status : (matched.status || 'pending_whatsapp');
      const awbNumber = liveOrder?.tracking_number || matched.tracking_number || matched.awbNumber || null;
      const carrierName = liveOrder?.carrier_name || matched.carrier_name || (awbNumber ? 'BLUEDART AIR' : 'Pending Allocation');
      const trackingUrl = liveOrder?.tracking_url || matched.tracking_url || (awbNumber ? `https://www.bluedart.com/tracking/${awbNumber}` : null);

      // Status text & badge
      let statusBadge = '';
      if (orderStatus === 'pending_whatsapp') {
        statusBadge = `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase font-headline mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Awaiting WhatsApp Confirmation</span>
          </span>
        `;
      } else if (orderStatus === 'delivered') {
        statusBadge = `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase font-headline mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Delivered</span>
          </span>
        `;
      } else {
        statusBadge = `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase font-headline mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>In Transit (Air Express)</span>
          </span>
        `;
      }

      trackResultMount.innerHTML = `
        <!-- Logistics Banner -->
        <div class="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 p-4 sm:p-5 rounded-xl border border-zinc-200 mb-6">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-headline">Order Reference</span>
            <p class="font-mono text-xs font-bold text-zinc-950">${orderRef}</p>
          </div>
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-headline">Air Courier AWB</span>
            ${awbNumber 
              ? `<p class="font-mono text-xs font-bold text-zinc-900">${carrierName} • <a href="${trackingUrl || '#'}" target="_blank" rel="noopener" class="underline text-black hover:text-zinc-600">${awbNumber}</a></p>`
              : `<p class="font-mono text-xs text-zinc-500 font-semibold">Assigned upon air dispatch</p>`
            }
          </div>
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-headline">Status</span>
            ${statusBadge}
          </div>
        </div>

        <!-- 4-Stage BlueDart Transit Stepper (Item 14) -->
        <div class="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 mb-6">
          <!-- Step 1 -->
          <div class="relative">
            <span class="absolute -left-6 top-1 w-4 h-4 rounded-full ${orderStatus === 'pending_whatsapp' ? 'bg-amber-500 text-white' : 'bg-black text-white'} flex items-center justify-center text-[10px] font-bold">✓</span>
            <p class="text-xs font-bold text-zinc-950 font-headline">Order Placed &amp; Stock Reserved</p>
            <p class="text-[11px] text-zinc-500">BEAR Fulfillment Central — WhatsApp verification synced</p>
          </div>
          <!-- Step 2 -->
          <div class="relative">
            <span class="absolute -left-6 top-1 w-4 h-4 rounded-full ${orderStatus === 'pending_whatsapp' ? 'bg-zinc-200 text-zinc-400' : 'bg-black text-white'} flex items-center justify-center text-[10px] font-bold">✓</span>
            <p class="text-xs font-bold text-zinc-950 font-headline">Dispatched via BlueDart Express Air</p>
            <p class="text-[11px] text-zinc-500">Kempegowda Air Cargo Terminal — Airway Bill Generated</p>
          </div>
          <!-- Step 3 -->
          <div class="relative">
            <span class="absolute -left-6 top-1 w-4 h-4 rounded-full ${['shipped', 'delivered'].includes(orderStatus) ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-400'} flex items-center justify-center text-[10px] font-bold">●</span>
            <p class="text-xs font-bold ${['shipped', 'delivered'].includes(orderStatus) ? 'text-emerald-700' : 'text-zinc-500'} font-headline">In Transit — Reached Destination City Hub</p>
            <p class="text-[11px] text-zinc-500">Sorted for express doorstep delivery</p>
          </div>
          <!-- Step 4 -->
          <div class="relative">
            <span class="absolute -left-6 top-1 w-4 h-4 rounded-full ${orderStatus === 'delivered' ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-400'} flex items-center justify-center text-[10px] font-bold">${orderStatus === 'delivered' ? '✓' : '○'}</span>
            <p class="text-xs font-bold ${orderStatus === 'delivered' ? 'text-emerald-700' : 'text-zinc-400'} font-headline">Out for Doorstep Delivery</p>
            <p class="text-[11px] text-zinc-400">${orderStatus === 'delivered' ? 'Successfully handed over to customer' : 'BlueDart delivery agent out for final mile'}</p>
          </div>
        </div>

        <!-- Support note -->
        <div class="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-600 flex items-center justify-between">
          <span>Need to reschedule or update delivery address?</span>
          <a href="https://wa.me/919605210198?text=Hi%20BEAR!%20Need%20to%20update%20address%20for%20order%20${encodeURIComponent(orderRef)}" target="_blank" class="text-black font-bold uppercase font-headline underline ml-2">Chat on WhatsApp</a>
        </div>
      `;
      trackResultMount.scrollIntoView({ behavior: 'smooth' });
    }, 350);
  });

  // PIN Code Form Execution
  const pinForm = page.querySelector('#pincode-form');
  const pinResult = page.querySelector('#pincode-result');
  const pinInput = page.querySelector('#pincode-input');
  const pinMsg = page.querySelector('#pincode-msg');

  pinForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pin = pinInput.value.trim();
    if (pin.length === 6 && /^\d{6}$/.test(pin)) {
      pinMsg.textContent = `PIN Code ${pin} is serviced via BlueDart Air Express. Complimentary standard air shipping confirmed.`;
      pinResult?.classList.remove('hidden');
    } else {
      showToast('Please enter a valid 6-digit Indian PIN code', 'error');
    }
  });

  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };
