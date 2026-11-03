import { getCart, getCartTotal, setState, getMode } from '../state/store.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { submitOrder, generateWhatsAppMessage } from '../services/checkoutService.js';
import { confirmOrder, cancelOrder } from '../services/accountService.js';
import { showToast } from '../components/toast.js';
import { createSlideToConfirm } from '../components/slideToConfirm.js';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
  'Chandigarh', 'Puducherry'
];

export function render(container) {
  const cart = getCart();
  const total = getCartTotal();
  const shipping = 0; // Pan-India Air Express Delivery is always Free (₹0)
  const grandTotal = total;
  const mode = getMode();

  const page = document.createElement('div');
  page.className = 'w-full flex flex-col pt-20 md:pt-24 pb-32 md:pb-16';

  if (cart.length === 0) {
    page.innerHTML = `
      <div class="max-w-[1360px] mx-auto px-4 md:px-gutter-desktop py-24 text-center">
        <span class="material-symbols-outlined text-6xl text-on-surface-variant mb-4">shopping_bag</span>
        <h1 class="font-headline text-2xl md:text-3xl font-bold uppercase text-primary mb-2">Your Bag Is Empty</h1>
        <p class="text-sm text-on-surface-variant mb-6">Add pieces to your bag before proceeding to checkout.</p>
        <a href="#collection" class="inline-block px-8 py-3 rounded-full bg-black text-white text-xs uppercase font-bold font-headline no-underline shadow-sm">
          Explore Collection
        </a>
      </div>
    `;
    container.innerHTML = '';
    container.appendChild(page);
    return;
  }

  page.innerHTML = `
    <div class="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-gutter-desktop py-4 sm:py-8 w-full">
      <!-- Back Navigation Header -->
      <div class="mb-4 flex items-center gap-2">
        <a href="#cart" class="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-black transition-colors no-underline">
          <span class="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Bag</span>
        </a>
      </div>

      <div class="mb-6 md:mb-8">
        <p class="font-headline text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">FINAL STEP</p>
        <h1 class="font-headline text-2xl md:text-3xl font-bold uppercase text-primary tracking-tight">Express Checkout</h1>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- LEFT: Delivery Details Form (7 Cols) -->
        <div class="lg:col-span-7 bg-white p-5 sm:p-space-lg rounded-xl border border-zinc-200/80 shadow-xs">
          <h2 class="font-headline text-sm uppercase tracking-wider font-bold text-primary mb-4 pb-2 border-b border-zinc-100 flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">local_shipping</span>
            <span>Pan-India Delivery Address</span>
          </h2>

          <form id="checkout-address-form" class="flex flex-col gap-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Full Legal Name *</label>
                <input 
                  type="text" 
                  id="full-name" 
                  required 
                  placeholder="e.g. Rahul Sharma" 
                  value=""
                  class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Mobile / WhatsApp Number *</label>
                <input 
                  type="tel" 
                  id="mobile-number" 
                  required 
                  placeholder="10-digit mobile number" 
                  value=""
                  class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black font-mono transition-colors"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">PIN Code (Pan-India) *</label>
                <input 
                  type="text" 
                  id="pin-code" 
                  required 
                  maxlength="6" 
                  placeholder="6-digit PIN code" 
                  value=""
                  class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black font-mono transition-colors"
                />
              </div>

              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">State *</label>
                <select id="state" class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black bg-white">
                  ${INDIAN_STATES.map((s) => `<option value="${s}" ${s === 'Karnataka' ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Street Address / Landmark *</label>
              <textarea 
                id="address" 
                required 
                rows="2" 
                placeholder="Flat/House no., building, street address" 
                class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black transition-colors"
              ></textarea>
            </div>

            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">City / District *</label>
              <input 
                type="text" 
                id="city" 
                required 
                placeholder="City / District" 
                value=""
                class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </form>

          <div class="mt-6 pt-4 border-t border-zinc-100 flex items-center gap-2 text-xs text-zinc-500">
            <span class="material-symbols-outlined text-green-700 text-base">verified</span>
            <span>BlueDart Air Express priority dispatch is confirmed for this destination.</span>
          </div>
        </div>

        <!-- RIGHT: Order Summary & Interactive Slide to Confirm (5 Cols) -->
        <aside class="lg:col-span-5 flex flex-col gap-4">
          <div class="bg-white p-5 sm:p-space-lg rounded-xl border border-zinc-200/80 shadow-xs">
            <h2 class="font-headline text-sm uppercase tracking-wider font-bold text-primary mb-4 pb-2 border-b border-zinc-100">
              Cart Summary (${cart.reduce((s, i) => s + (i.quantity || 1), 0)} items)
            </h2>

            <!-- Items Scrollable Strip -->
            <div class="flex flex-col divide-y divide-zinc-100 max-h-60 overflow-y-auto mb-4 pr-1">
              ${cart
                .map((item) => {
                  const img = item.image || (item.images && item.images[0]) || '';
                  return `
                  <div class="py-2.5 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <div class="w-10 h-12 rounded-lg bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
                        ${img ? `<img src="${img}" alt="${item.name}" class="w-full h-full object-cover" />` : ''}
                      </div>
                      <div class="min-w-0">
                        <p class="text-xs text-zinc-900 font-bold truncate">${item.name}</p>
                        <p class="text-[10px] text-zinc-400">${item.colour} • Size ${item.size} • Qty ${item.quantity || 1}</p>
                      </div>
                    </div>
                    <p class="text-xs font-bold text-zinc-950 font-headline shrink-0">${formatCurrency(item.price * (item.quantity || 1))}</p>
                  </div>
                `;
                })
                .join('')}
            </div>

            <!-- Cost Calculations -->
            <div class="flex flex-col gap-2 pt-3 border-t border-zinc-100 text-xs">
              <div class="flex justify-between text-zinc-600">
                <span>Items Subtotal</span>
                <span class="text-zinc-950 font-bold font-headline">${formatCurrency(total)}</span>
              </div>
              <div class="flex justify-between text-zinc-600">
                <span>Pan-India Air Express Delivery</span>
                <span class="text-green-700 font-bold uppercase text-[11px]">FREE (₹0)</span>
              </div>
              <div class="flex justify-between items-baseline pt-3 mt-1 border-t border-zinc-200">
                <div>
                  <span class="font-headline text-sm uppercase font-bold text-zinc-950">Total Amount</span>
                  <p class="text-[10px] text-zinc-400">All taxes &amp; duties included</p>
                </div>
                <span class="font-headline text-xl font-bold text-zinc-950">${formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <!-- Interactive Slide to Confirm Component Container -->
            <div class="mt-6 pt-4 border-t border-zinc-100">
              <p class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-headline mb-2 text-center">
                Swipe to Complete Order
              </p>
              
              <!-- Mount root for SlideToConfirm -->
              <div id="slide-to-confirm-mount"></div>

              <!-- Desktop Alternative 1-Click Button -->
              <div class="hidden md:block mt-3">
                <button 
                  id="place-order-whatsapp-btn" 
                  class="w-full py-3.5 px-4 rounded-full bg-black text-white hover:bg-zinc-800 active:scale-[0.99] font-headline text-xs uppercase font-bold tracking-wider shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  type="button"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.074-2.127-.517-1.706-.707-2.812-2.454-2.898-2.569-.085-.114-.698-.928-.698-1.77 0-.843.443-1.258.6-1.429.157-.171.343-.214.457-.214.114 0 .228.001.328.006.106.006.248-.04.388.297.144.346.491 1.2.534 1.286.043.086.072.186.014.3-.058.114-.086.186-.171.286-.086.1-.182.223-.26.299-.086.086-.175.18-.075.352.1.171.444.733.953 1.186.655.584 1.207.765 1.378.851.171.086.271.071.371-.043.1-.114.428-.499.542-.671.114-.171.229-.143.386-.086.157.057 1.001.472 1.173.557.171.086.286.129.328.2.043.072.043.415-.101.82z"/>
                  </svg>
                  <span>Or Click to Order via WhatsApp</span>
                </button>
              </div>

              <p class="text-center text-[10px] text-zinc-400 mt-3 leading-relaxed">
                Instant order verification link, UPI payment prompts, and air dispatch alerts sent directly to your WhatsApp.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `;

  // Validation function
  function validateDeliveryInputs() {
    const fullName = page.querySelector('#full-name')?.value.trim();
    const mobile = page.querySelector('#mobile-number')?.value.trim();
    const pincode = page.querySelector('#pin-code')?.value.trim();
    const address = page.querySelector('#address')?.value.trim();

    if (!fullName || !mobile || !pincode || !address) {
      showToast('Please fill in your delivery details before sliding', 'error');
      if (!fullName) page.querySelector('#full-name')?.focus();
      else if (!mobile) page.querySelector('#mobile-number')?.focus();
      else if (!address) page.querySelector('#address')?.focus();
      else if (!pincode) page.querySelector('#pin-code')?.focus();
      return false;
    }
    return true;
  }

  // Unified Order Execution logic with 2-Stage WhatsApp Verification
  async function executeOrderPlacement() {
    const fullName = page.querySelector('#full-name').value.trim();
    const mobile = page.querySelector('#mobile-number').value.trim();
    const pincode = page.querySelector('#pin-code').value.trim();
    const address = page.querySelector('#address').value.trim();
    const city = page.querySelector('#city').value.trim();
    const state = page.querySelector('#state').value.trim();

    const order = await submitOrder(cart, { fullName, mobile, pincode, address, city, state });
    const waText = generateWhatsAppMessage(order);
    const waUrl = `https://wa.me/919605210198?text=${encodeURIComponent(waText)}`;

    // Open WhatsApp
    window.open(waUrl, '_blank');
    showToast(`WhatsApp opened for #${order.orderNumber}. Please send message!`, 'info');

    // Stage 1: Verification Pending Screen (CART IS NOT CLEARED YET)
    function renderVerificationPendingScreen() {
      container.innerHTML = `
        <div class="max-w-[720px] mx-auto px-4 sm:px-6 md:px-gutter-desktop py-12 md:py-16 text-center">
          <!-- Pending Status Indicator -->
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Action Required: WhatsApp Verification</span>
          </div>

          <h1 class="font-headline text-2xl md:text-3xl font-extrabold uppercase text-zinc-950 mb-2">
            Order Reserved: ${order.orderNumber}
          </h1>
          <p class="text-xs sm:text-sm text-zinc-600 mb-6 leading-relaxed max-w-lg mx-auto">
            We opened WhatsApp with your order pre-filled. To prevent premature orders, <strong>your order is not confirmed until you send the WhatsApp message</strong>.
          </p>

          <!-- Order Summary Card -->
          <div class="p-5 sm:p-6 rounded-xl bg-zinc-50 text-left mb-6 border border-zinc-200 shadow-2xs">
            <div class="flex items-center justify-between pb-3 border-b border-zinc-200">
              <span class="font-headline text-xs uppercase text-zinc-950 font-bold">Reservation Summary</span>
              <span class="text-[11px] font-bold uppercase px-2 py-0.5 bg-amber-100 text-amber-900 rounded-sm">
                Awaiting Message
              </span>
            </div>
            
            <div class="py-3 border-b border-zinc-100 space-y-1.5">
              ${(order.items || []).map(item => `
                <div class="flex items-center justify-between text-xs text-zinc-800">
                  <span class="font-medium">${item.name} (${item.size} / ${item.colour}) × ${item.quantity || 1}</span>
                  <span class="font-bold text-zinc-950">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
                </div>
              `).join('')}
            </div>

            <div class="pt-3 text-xs text-zinc-700 space-y-1">
              <p><strong>Deliver To:</strong> ${fullName} (${mobile})</p>
              <p><strong>Address:</strong> ${address}, ${city}, ${state} — ${pincode}</p>
              <p class="text-sm font-bold text-zinc-950 pt-1">
                <strong>Total Due:</strong> ${formatCurrency(grandTotal)}
              </p>
            </div>
          </div>

          <!-- Explicit Verification Actions -->
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button id="btn-confirm-sent" class="w-full sm:w-auto px-6 py-3.5 rounded-full ${mode === 'sow' ? 'bg-[#80534C]' : 'bg-black'} hover:opacity-90 active:scale-95 text-white text-xs font-bold uppercase font-headline shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all">
              <svg class="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              <span>I Have Sent the Message — Confirm Order</span>
            </button>

            <a href="${waUrl}" target="_blank" class="w-full sm:w-auto px-5 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white text-xs font-bold uppercase font-headline flex items-center justify-center gap-2 shadow-xs no-underline transition-all">
              <svg class="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
              </svg>
              <span>Re-Open WhatsApp</span>
            </a>

            <button id="btn-cancel-return-cart" class="w-full sm:w-auto px-5 py-3.5 rounded-full border border-zinc-300 text-zinc-700 hover:text-black hover:bg-zinc-100 active:scale-95 text-xs font-bold uppercase font-headline flex items-center justify-center gap-1.5 cursor-pointer transition-all">
              <span>✕ Didn't Send? Return to Bag</span>
            </button>
          </div>

          <p class="text-[11px] text-zinc-400 mt-4">
            Items remain in your bag until you confirm you sent the message.
          </p>
        </div>
      `;

      // Button: Explicitly Sent -> Confirm Order & Empty Bag
      container.querySelector('#btn-confirm-sent')?.addEventListener('click', () => {
        confirmOrder(order.orderNumber);
        setState({ cart: [] });
        showToast('Order verified & confirmed!', 'success');
        renderOrderConfirmedScreen();
      });

      // Button: Did Not Send -> Keep Bag & Return
      container.querySelector('#btn-cancel-return-cart')?.addEventListener('click', () => {
        cancelOrder(order.orderNumber);
        showToast('Order reservation cancelled. Bag items preserved.', 'info');
        window.location.hash = '#cart';
      });
    }

    // Stage 2: Final Confirmed View
    function renderOrderConfirmedScreen() {
      container.innerHTML = `
        <div class="max-w-[720px] mx-auto px-4 sm:px-6 md:px-gutter-desktop py-16 md:py-20 text-center">
          <div class="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-4">
            <span class="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <h1 class="font-headline text-2xl md:text-3xl font-extrabold uppercase text-zinc-950 mb-2">Order Confirmed & Verified</h1>
          <p class="text-sm font-bold text-green-700 uppercase font-headline mb-4">Order ID: ${order.orderNumber}</p>
          <p class="text-xs sm:text-sm text-zinc-600 mb-6 leading-relaxed max-w-lg mx-auto">
            Your WhatsApp message has been recorded. Our fulfilment desk has assigned your dispatch queue. You will receive BlueDart live tracking alerts directly on WhatsApp.
          </p>

          <div class="p-5 sm:p-6 rounded-xl bg-zinc-50 text-left mb-6 border border-zinc-200">
            <p class="font-headline text-xs uppercase text-zinc-950 font-bold mb-3 pb-1 border-b border-zinc-200">Shipment Details</p>
            <p class="text-xs text-zinc-700"><strong>Recipient:</strong> ${fullName} (${mobile})</p>
            <p class="text-xs text-zinc-700 mt-1"><strong>Address:</strong> ${address}, ${city}, ${state} — ${pincode}</p>
            <p class="text-xs text-zinc-700 mt-1"><strong>Total Paid / COD:</strong> ${formatCurrency(grandTotal)}</p>
            <p class="text-xs text-green-700 mt-1 font-bold"><strong>Status:</strong> Processing (Standard dispatch via BlueDart Air Express)</p>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-3">
            <a href="#" class="px-6 py-3 rounded-full ${mode === 'sow' ? 'bg-[#80534C]' : 'bg-black'} text-white text-xs font-bold uppercase font-headline no-underline shadow-xs">
              Return to Store
            </a>
            <a href="#track-order" class="px-6 py-3 rounded-full border border-zinc-200 text-zinc-800 hover:bg-zinc-100 text-xs font-bold uppercase font-headline no-underline">
              Track Shipment
            </a>
            <a href="#account" class="px-6 py-3 rounded-full border border-zinc-200 text-zinc-800 hover:bg-zinc-100 text-xs font-bold uppercase font-headline no-underline">
              View in Orders
            </a>
          </div>
        </div>
      `;
    }

    renderVerificationPendingScreen();
  }

  // Mount Slide to Confirm Component
  const sliderMount = page.querySelector('#slide-to-confirm-mount');
  if (sliderMount) {
    const slider = createSlideToConfirm({
      label: `SLIDE TO PAY ${formatCurrency(grandTotal)}`,
      confirmedLabel: 'CONFIRMED!',
      mode,
      validate: validateDeliveryInputs,
      onConfirm: executeOrderPlacement,
    });
    sliderMount.appendChild(slider);
  }

  // Desktop click button handler
  const desktopBtn = page.querySelector('#place-order-whatsapp-btn');
  desktopBtn?.addEventListener('click', async () => {
    if (!validateDeliveryInputs()) return;
    desktopBtn.disabled = true;
    desktopBtn.innerHTML = `
      <span class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
      <span>PROCESSING...</span>
    `;
    await executeOrderPlacement();
  });

  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };
