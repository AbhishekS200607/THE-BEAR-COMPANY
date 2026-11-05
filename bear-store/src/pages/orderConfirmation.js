import { getMode } from '../state/store.js';
import { formatCurrency } from '../utils/formatCurrency.js';

/**
 * Renders the order confirmation page.
 * Accepts an optional `orderData` object; falls back to a demo order if none provided.
 */
export function render(container, orderData = null) {
  const mode  = getMode();
  const isSow = mode === 'sow';

  // Try to read real order from sessionStorage first
  if (!orderData) {
    try {
      const stored = sessionStorage.getItem('bear_last_order');
      if (stored) {
        orderData = JSON.parse(stored);
        sessionStorage.removeItem('bear_last_order');
      }
    } catch { /* ignore */ }
  }

  // Demo order fallback so the page is always meaningful
  const order = orderData || {
    id: `BR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    items: [
      { name: isSow ? 'Sculpt Flex Sports Bra' : 'Heavy Oversized Tee', size: 'M', colour: isSow ? 'Terracotta Clay' : 'Washed Carbon Black', qty: 1, price: isSow ? 1199 : 999 },
      { name: isSow ? 'Contour High-Rise Tights' : 'Training Shorts',    size: 'S', colour: isSow ? 'Warm Taupe' : 'Graphite',              qty: 1, price: isSow ? 1599 : 1299 },
    ],
    address: { name: 'Arjun Sharma', line: '14B, Koramangala 5th Block', city: 'Bengaluru', state: 'Karnataka', pin: '560095' },
    payment: 'UPI · Google Pay',
    shipping: 'Free Air Express',
    eta: '24 – 48 Hours',
  };

  const total    = order.grandTotal ?? order.items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount  = order.discount || 0;
  const accentBtn   = isSow ? 'bg-[#80534C] hover:bg-[#6b4540]' : 'bg-black hover:bg-zinc-800';
  const accentText  = isSow ? 'text-[#80534C]' : 'text-zinc-950';
  const accentLight = isSow ? 'bg-[#FAF7F5] border-[#EFE7DF]' : 'bg-zinc-50 border-zinc-200';
  const accentDot   = isSow ? 'bg-[#80534C]' : 'bg-black';
  const accentBorder = isSow ? 'border-[#80534C]' : 'border-black';

  const page = document.createElement('div');
  page.className = 'w-full max-w-[720px] mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-28 pb-32 md:pb-16 text-zinc-900';

  page.innerHTML = `
    <!-- Confirmation Hero -->
    <div class="text-center mb-10">
      <div class="w-16 h-16 rounded-full ${accentLight} border-2 ${accentBorder} flex items-center justify-center mx-auto mb-4" style="animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both">
        <span class="material-symbols-outlined text-[32px] ${accentText}">check_circle</span>
      </div>
      <p class="font-headline text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">ORDER CONFIRMED</p>
      <h1 class="font-headline text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-zinc-950">
        ${isSow ? 'Your SOW Drop Is Locked In.' : 'Your Drop Is Locked In.'}
      </h1>
      <p class="text-xs sm:text-sm text-zinc-500 mt-2 max-w-sm mx-auto">
        ${isSow
          ? 'Your SOW pieces are being packed with care. Expect a WhatsApp dispatch notification shortly.'
          : 'Your BEAR gear is being packed and dispatched. You\'ll receive a WhatsApp tracking link soon.'}
      </p>

      <!-- Order ID Badge -->
      <div class="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full ${accentLight} border font-mono text-xs font-bold text-zinc-700">
        <span class="material-symbols-outlined text-[14px] ${accentText}">tag</span>
        <span>Order ${order.id}</span>
        <span class="text-zinc-400">·</span>
        <span class="text-zinc-500 font-normal">${order.date}</span>
      </div>
    </div>

    <!-- ETA Banner -->
    <div class="flex items-center gap-3 p-4 rounded-none sm:rounded-sm ${accentLight} border mb-8">
      <span class="material-symbols-outlined text-[22px] text-emerald-600 shrink-0">local_shipping</span>
      <div class="flex-1 min-w-0">
        <p class="font-headline text-xs font-bold uppercase tracking-wider text-zinc-950">Estimated Delivery: <span class="text-emerald-700">${order.eta}</span></p>
        <p class="text-[11px] text-zinc-500 mt-0.5">Pan-India Air Express · ${order.shipping} · You'll receive a live tracking link on WhatsApp</p>
      </div>
      <a href="#track-order" class="shrink-0 px-3 py-1.5 rounded-full border border-zinc-300 text-zinc-700 font-headline text-[11px] font-bold uppercase tracking-wider hover:border-black hover:text-black transition-colors">
        Track
      </a>
    </div>

    <!-- Order Items -->
    <div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-5 sm:p-6 mb-6">
      <div class="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
        <span class="w-2 h-2 rounded-full ${accentDot}"></span>
        <h2 class="font-headline text-xs font-bold uppercase tracking-wider text-zinc-950">Order Summary</h2>
      </div>

      <div class="divide-y divide-zinc-100">
        ${order.items.map(item => `
          <div class="py-3.5 flex items-center gap-3">
            <div class="w-12 h-14 rounded-lg bg-zinc-100 border border-zinc-200 shrink-0 flex items-center justify-center">
              <span class="font-headline text-[10px] font-bold text-zinc-400 uppercase">${item.name.split(' ').slice(0,2).map(w => w[0]).join('')}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-headline text-xs font-bold text-zinc-950 truncate">${item.name}</p>
              <p class="text-[11px] text-zinc-400 mt-0.5">${item.colour} · Size ${item.size} · Qty ${item.qty}</p>
            </div>
            <span class="font-headline text-xs font-bold text-zinc-950 shrink-0">${formatCurrency(item.price * item.qty)}</span>
          </div>
        `).join('')}
      </div>

      <!-- Totals -->
      <div class="mt-4 pt-4 border-t border-zinc-100 space-y-2 text-xs">
        <div class="flex justify-between text-zinc-600">
          <span>Subtotal</span>
          <span class="font-bold text-zinc-950">${formatCurrency(order.items.reduce((s, i) => s + i.price * i.qty, 0))}</span>
        </div>
        ${discount > 0 ? `
        <div class="flex justify-between text-emerald-700">
          <span>Coupon (${order.coupon})</span>
          <span class="font-bold">-${formatCurrency(discount)}</span>
        </div>` : ''}
        <div class="flex justify-between text-zinc-600">
          <span>Shipping</span>
          <span class="font-bold text-emerald-700 uppercase text-[11px]">FREE</span>
        </div>
        <div class="flex justify-between font-headline font-extrabold text-sm text-zinc-950 pt-2 border-t border-zinc-100">
          <span>Total Paid</span>
          <span>${formatCurrency(total)}</span>
        </div>
      </div>
    </div>

    <!-- Delivery & Payment Details -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      <div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-5">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-symbols-outlined text-[16px] text-zinc-400">location_on</span>
          <h3 class="font-headline text-[11px] font-bold uppercase tracking-wider text-zinc-500">Delivery Address</h3>
        </div>
        <p class="font-headline text-xs font-bold text-zinc-950">${order.address.name}</p>
        <p class="text-xs text-zinc-600 mt-0.5 leading-relaxed">${order.address.line}<br/>${order.address.city}, ${order.address.state} — ${order.address.pin}</p>
      </div>

      <div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-5">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-symbols-outlined text-[16px] text-zinc-400">payments</span>
          <h3 class="font-headline text-[11px] font-bold uppercase tracking-wider text-zinc-500">Payment Method</h3>
        </div>
        <p class="font-headline text-xs font-bold text-zinc-950">${order.payment}</p>
        <p class="text-xs text-zinc-600 mt-0.5">Payment verified · Encrypted checkout</p>
        <div class="flex items-center gap-1 mt-2">
          <span class="material-symbols-outlined text-[13px] text-emerald-600">shield</span>
          <span class="text-[11px] text-emerald-700 font-bold">Secure · Confirmed</span>
        </div>
      </div>
    </div>

    <!-- What Happens Next -->
    <div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-5 sm:p-6 mb-8">
      <div class="flex items-center gap-2 mb-5 pb-3 border-b border-zinc-100">
        <span class="w-2 h-2 rounded-full ${accentDot}"></span>
        <h2 class="font-headline text-xs font-bold uppercase tracking-wider text-zinc-950">What Happens Next</h2>
      </div>
      <div class="space-y-4">
        ${[
          { step: '01', icon: 'inventory_2',    title: 'Packing & QC',         desc: 'Your order is being quality-checked and packed in tamper-proof waterproof mailers.' },
          { step: '02', icon: 'local_shipping', title: 'Dispatch Notification', desc: 'You\'ll receive a WhatsApp message with your live BlueDart / Delhivery tracking link.' },
          { step: '03', icon: 'door_front',     title: 'Doorstep Delivery',    desc: 'Your drop arrives within the estimated window. Reschedule anytime via WhatsApp.' },
        ].map(s => `
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full ${accentLight} border flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[16px] ${accentText}">${s.icon}</span>
            </div>
            <div>
              <p class="font-headline text-xs font-bold text-zinc-950 uppercase">${s.step}. ${s.title}</p>
              <p class="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">${s.desc}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- CTA Row -->
    <div class="flex flex-col sm:flex-row gap-3">
      <a href="#collection" class="flex-1 py-3 rounded-full ${accentBtn} text-white font-headline text-xs font-bold uppercase tracking-wider transition-colors shadow-sm text-center">
        Continue Shopping
      </a>
      <a href="#account" class="flex-1 py-3 rounded-full border border-zinc-300 hover:border-black text-zinc-800 hover:text-black font-headline text-xs font-bold uppercase tracking-wider transition-colors text-center">
        View My Orders
      </a>
      <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer"
        class="flex-1 py-3 rounded-full border border-emerald-300 hover:border-emerald-600 text-emerald-700 hover:text-emerald-800 font-headline text-xs font-bold uppercase tracking-wider transition-colors text-center flex items-center justify-center gap-1.5">
        <span class="material-symbols-outlined text-[14px]">chat</span>
        <span>WhatsApp Support</span>
      </a>
    </div>
  `;

  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };
