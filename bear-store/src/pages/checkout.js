import { getCart, getCartTotal, setState, getMode } from '../state/store.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { submitOrder, generateWhatsAppMessage } from '../services/checkoutService.js';
import { confirmOrder, cancelOrder, getDemoAddresses, addAddress } from '../services/accountService.js';
import { showToast } from '../components/toast.js';
import { createSlideToConfirm } from '../components/slideToConfirm.js';
import { triggerOrderConfetti } from '../utils/animations.js';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
  'Chandigarh', 'Puducherry'
];


export async function render(container) {
  const cart = getCart();
  const subtotal = getCartTotal();
  const shipping = 0; // Pan-India Air Express Delivery is always Free (₹0)
  const mode = getMode();

  let activeCoupon = null;
  let discountAmount = 0;
  let grandTotal = subtotal;

  // Load saved delivery addresses
  const savedAddresses = await getDemoAddresses().catch(() => []);
  const defaultAddr = savedAddresses.find((a) => a.default) || savedAddresses[0] || null;

  const page = document.createElement('div');
  page.className = 'w-full flex flex-col pt-20 md:pt-24 pb-32 md:pb-16';

  if (cart.length === 0) {
    page.innerHTML = `
      <div class="max-w-[1360px] mx-auto px-4 md:px-gutter-desktop py-24 text-center">
        <span class="material-symbols-outlined text-6xl text-zinc-300 mb-4">shopping_bag</span>
        <h1 class="font-headline text-2xl md:text-3xl font-extrabold uppercase text-zinc-950 mb-2">Your Bag Is Empty</h1>
        <p class="text-sm text-zinc-500 mb-6">Add pieces to your bag before proceeding to checkout.</p>
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
        <h1 class="font-headline text-2xl md:text-3xl font-extrabold uppercase text-zinc-950 tracking-tight">Express Checkout</h1>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- LEFT: Delivery Details Form (7 Cols) -->
        <div class="lg:col-span-7 bg-white p-5 sm:p-space-lg rounded-xl border border-zinc-200/80 shadow-xs">
          <div class="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
            <h2 class="font-headline text-sm uppercase tracking-wider font-bold text-zinc-950 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">local_shipping</span>
              <span>Pan-India Delivery Address</span>
            </h2>
            ${savedAddresses.length > 0 ? `
              <button type="button" id="toggle-new-addr-btn" class="text-xs font-bold text-zinc-600 hover:text-black underline cursor-pointer font-headline uppercase tracking-wider">
                + New Address
              </button>
            ` : ''}
          </div>

          ${savedAddresses.length > 0 ? `
            <!-- Saved Delivery Addresses Selector -->
            <div class="mb-5 pb-5 border-b border-zinc-100">
              <p class="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2.5 font-headline">
                Use Saved Address (${savedAddresses.length})
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="saved-addresses-grid">
                ${savedAddresses.map((addr) => {
                  const isSelected = defaultAddr && defaultAddr.id === addr.id;
                  return `
                    <div 
                      class="saved-addr-card border rounded-xl p-3.5 cursor-pointer transition-all text-xs relative ${
                        isSelected ? 'border-black bg-zinc-50 ring-1 ring-black shadow-2xs' : 'border-zinc-200 hover:border-zinc-400 bg-white'
                      }"
                      data-addr-id="${addr.id}"
                    >
                      <div class="flex items-center justify-between mb-1.5">
                        <span class="font-bold font-headline uppercase text-[10px] px-2 py-0.5 rounded bg-zinc-200/80 text-zinc-800">
                          ${addr.label || 'Home'}
                        </span>
                        ${addr.default ? '<span class="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Default</span>' : ''}
                      </div>
                      <p class="font-bold text-zinc-950 font-headline">${addr.fullName}</p>
                      <p class="text-zinc-600 line-clamp-2 mt-0.5 leading-relaxed">${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}</p>
                      <p class="text-zinc-600 mt-0.5">${addr.city}, ${addr.state} — <span class="font-mono font-medium">${addr.pincode}</span></p>
                      <p class="text-zinc-500 font-mono text-[11px] mt-1.5 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[13px]">call</span>
                        <span>${addr.phone}</span>
                      </p>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <form id="checkout-address-form" class="flex flex-col gap-4" novalidate>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1 font-headline">Full Legal Name *</label>
                <input 
                  type="text" 
                  id="full-name" 
                  required 
                  placeholder="e.g. Rahul Sharma" 
                  value="${defaultAddr?.fullName || ''}"
                  class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black transition-colors"
                />
                <p id="full-name-error" class="text-[11px] text-red-600 font-medium mt-1 hidden"></p>
              </div>

              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1 font-headline">Mobile / WhatsApp Number *</label>
                <input 
                  type="tel" 
                  id="mobile-number" 
                  required 
                  maxlength="10"
                  placeholder="10-digit mobile number" 
                  value="${defaultAddr?.phone || ''}"
                  class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black font-mono transition-colors"
                />
                <p id="mobile-error" class="text-[11px] text-red-600 font-medium mt-1 hidden"></p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1 font-headline">PIN Code (Pan-India) *</label>
                <input 
                  type="text" 
                  id="pin-code" 
                  required 
                  maxlength="6" 
                  placeholder="6-digit PIN code" 
                  value="${defaultAddr?.pincode || ''}"
                  class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black font-mono transition-colors"
                />
                <p id="pincode-error" class="text-[11px] text-red-600 font-medium mt-1 hidden"></p>
              </div>

              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1 font-headline">State *</label>
                <select id="state" class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black bg-white cursor-pointer">
                  ${INDIAN_STATES.map((s) => `<option value="${s}" ${s === (defaultAddr?.state || 'Karnataka') ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1 font-headline">Street Address / Landmark *</label>
              <textarea 
                id="address" 
                required 
                rows="2" 
                placeholder="Flat/House no., building, street address" 
                class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black transition-colors"
              >${defaultAddr ? (defaultAddr.line1 + (defaultAddr.line2 ? ', ' + defaultAddr.line2 : '')) : ''}</textarea>
              <p id="address-error" class="text-[11px] text-red-600 font-medium mt-1 hidden"></p>
            </div>

            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1 font-headline">City / District *</label>
              <input 
                type="text" 
                id="city" 
                required 
                placeholder="City / District" 
                value="${defaultAddr?.city || ''}"
                class="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-black transition-colors"
              />
              <p id="city-error" class="text-[11px] text-red-600 font-medium mt-1 hidden"></p>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <input 
                type="checkbox" 
                id="save-address-chk" 
                ${savedAddresses.length === 0 ? 'checked' : ''} 
                class="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer" 
              />
              <label for="save-address-chk" class="text-xs text-zinc-700 font-medium cursor-pointer select-none">
                Save this address to my account for faster checkout
              </label>
            </div>
          </form>

          <div class="mt-6 pt-4 border-t border-zinc-100 flex items-center gap-2 text-xs text-zinc-500">
            <span class="material-symbols-outlined text-emerald-700 text-base">verified</span>
            <span>BlueDart Air Express priority dispatch is confirmed for this destination.</span>
          </div>
        </div>

        <!-- RIGHT: Order Summary & Coupon Code & Slide to Confirm (5 Cols) -->
        <aside class="lg:col-span-5 flex flex-col gap-4">
          <div class="bg-white p-5 sm:p-space-lg rounded-xl border border-zinc-200/80 shadow-xs">
            <h2 class="font-headline text-sm uppercase tracking-wider font-bold text-zinc-950 mb-4 pb-2 border-b border-zinc-100">
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

            <!-- Promo Code / Coupon Box (Item 13) -->
            <div class="pt-3 pb-4 border-t border-zinc-100">
              <label class="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 font-headline">Promo Code</label>
              <div class="flex gap-2">
                <input 
                  type="text" 
                  id="coupon-code-input" 
                  placeholder="e.g. BEAR10" 
                  class="flex-1 px-3.5 py-2 rounded-lg border border-zinc-200 text-xs font-mono uppercase focus:outline-none focus:border-black tracking-wider transition-colors"
                />
                <button 
                  id="apply-coupon-btn" 
                  type="button" 
                  class="px-4 py-2 rounded-lg bg-black text-white text-xs font-bold uppercase font-headline hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                >
                  Apply
                </button>
              </div>
              <div id="coupon-feedback" class="mt-2 text-[11px] font-semibold hidden"></div>
            </div>

            <!-- Cost Calculations -->
            <div class="flex flex-col gap-2 pt-3 border-t border-zinc-100 text-xs">
              <div class="flex justify-between text-zinc-600">
                <span>Items Subtotal</span>
                <span class="text-zinc-950 font-bold font-headline">${formatCurrency(subtotal)}</span>
              </div>
              
              <div id="discount-row" class="hidden flex justify-between text-emerald-700 font-medium">
                <span id="discount-label">Coupon Discount</span>
                <span id="discount-val" class="font-bold font-headline">-₹0</span>
              </div>

              <div class="flex justify-between text-zinc-600">
                <span>Pan-India Air Express Delivery</span>
                <span class="text-emerald-700 font-bold uppercase text-[11px]">FREE (₹0)</span>
              </div>

              <div class="flex justify-between items-baseline pt-3 mt-1 border-t border-zinc-200">
                <div>
                  <span class="font-headline text-sm uppercase font-bold text-zinc-950">Total Amount</span>
                  <p class="text-[10px] text-zinc-400">All taxes &amp; duties included</p>
                </div>
                <span class="font-headline text-xl font-bold text-zinc-950" id="grand-total-display">${formatCurrency(grandTotal)}</span>
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

  // Coupon Application Logic (Item 13)
  const couponInput = page.querySelector('#coupon-code-input');
  const applyCouponBtn = page.querySelector('#apply-coupon-btn');
  const couponFeedback = page.querySelector('#coupon-feedback');
  const discountRow = page.querySelector('#discount-row');
  const discountLabel = page.querySelector('#discount-label');
  const discountVal = page.querySelector('#discount-val');
  const grandTotalDisplay = page.querySelector('#grand-total-display');

  async function applyCoupon(code) {
    const cleanCode = (code || '').toUpperCase().trim();
    if (!cleanCode) {
      couponFeedback.className = 'mt-2 text-[11px] font-semibold text-red-600 block';
      couponFeedback.textContent = '✕ Please enter a promo code.';
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/api/v1/orders/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, cartTotal: subtotal }),
      });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data?.valid) {
        couponFeedback.className = 'mt-2 text-[11px] font-semibold text-red-600 block';
        couponFeedback.textContent = `✕ ${json.error?.message || json.message || 'Invalid promo code.'}`;
        return;
      }

      const data = json.data;
      activeCoupon = {
        code: cleanCode,
        type: data.type === 'percentage' ? 'pct' : 'flat',
        value: data.value,
        label: data.label,
      };
      discountAmount = data.discountAmount;
      grandTotal = Math.max(0, subtotal - discountAmount);

      couponFeedback.className = 'mt-2 text-[11px] font-semibold text-emerald-700 flex items-center justify-between';
      couponFeedback.innerHTML = `
        <span>✓ Applied ${cleanCode}: ${data.label}</span>
        <button id="remove-coupon-btn" class="text-zinc-400 hover:text-black font-bold uppercase underline cursor-pointer ml-2">Remove</button>
      `;

      discountLabel.textContent = `Coupon (${cleanCode})`;
      discountVal.textContent = `-${formatCurrency(discountAmount)}`;
      discountRow.classList.remove('hidden');
      discountRow.classList.add('flex');
      grandTotalDisplay.textContent = formatCurrency(grandTotal);

      couponFeedback.querySelector('#remove-coupon-btn')?.addEventListener('click', () => {
        activeCoupon = null;
        discountAmount = 0;
        grandTotal = subtotal;
        discountRow.classList.add('hidden');
        discountRow.classList.remove('flex');
        grandTotalDisplay.textContent = formatCurrency(grandTotal);
        couponFeedback.className = 'hidden';
        couponInput.value = '';
        showToast('Coupon removed', 'info');
      });

      showToast(`Coupon ${cleanCode} applied! Saved ${formatCurrency(discountAmount)}`, 'success');
    } catch {
      couponFeedback.className = 'mt-2 text-[11px] font-semibold text-red-600 block';
      couponFeedback.textContent = '✕ Could not validate coupon. Check connection.';
    }
  }

  applyCouponBtn?.addEventListener('click', () => {
    applyCoupon(couponInput?.value);
  });

  // Real-Time Inline Form Validation (Item 20)
  const fullNameInput = page.querySelector('#full-name');
  const mobileInput = page.querySelector('#mobile-number');
  const pincodeInput = page.querySelector('#pin-code');
  const addressInput = page.querySelector('#address');
  const cityInput = page.querySelector('#city');

  const fullNameErr = page.querySelector('#full-name-error');
  const mobileErr = page.querySelector('#mobile-error');
  const pincodeErr = page.querySelector('#pincode-error');
  const addressErr = page.querySelector('#address-error');
  const cityErr = page.querySelector('#city-error');

  function validateField(input, errEl, validator, errorMsg) {
    const val = input.value.trim();
    const isValid = validator(val);
    if (!isValid) {
      input.classList.add('border-red-500', 'bg-red-50/20');
      input.classList.remove('border-zinc-200');
      errEl.textContent = errorMsg;
      errEl.classList.remove('hidden');
      return false;
    } else {
      input.classList.remove('border-red-500', 'bg-red-50/20');
      input.classList.add('border-zinc-200');
      errEl.classList.add('hidden');
      return true;
    }
  }

  fullNameInput?.addEventListener('blur', () => {
    validateField(fullNameInput, fullNameErr, (v) => v.length >= 2, 'Please enter your full legal name');
  });

  mobileInput?.addEventListener('blur', () => {
    validateField(mobileInput, mobileErr, (v) => /^[6-9]\d{9}$/.test(v), 'Please enter a valid 10-digit Indian mobile number');
  });

  pincodeInput?.addEventListener('blur', () => {
    validateField(pincodeInput, pincodeErr, (v) => /^\d{6}$/.test(v), 'Please enter a valid 6-digit Indian PIN code');
  });

  addressInput?.addEventListener('blur', () => {
    validateField(addressInput, addressErr, (v) => v.length >= 5, 'Please enter a complete street address');
  });

  cityInput?.addEventListener('blur', () => {
    validateField(cityInput, cityErr, (v) => v.length >= 2, 'Please enter your city / district');
  });

  // Handle Saved Address Selection & Switching
  const savedCards = page.querySelectorAll('.saved-addr-card');
  const toggleNewAddrBtn = page.querySelector('#toggle-new-addr-btn');
  const saveAddressChk = page.querySelector('#save-address-chk');
  const stateSelect = page.querySelector('#state');

  savedCards.forEach((card) => {
    card.addEventListener('click', () => {
      const addrId = card.getAttribute('data-addr-id');
      const selected = savedAddresses.find((a) => a.id === addrId);
      if (!selected) return;

      // Update active card styling
      savedCards.forEach((c) => {
        c.classList.remove('border-black', 'bg-zinc-50', 'ring-1', 'ring-black', 'shadow-2xs');
        c.classList.add('border-zinc-200', 'bg-white');
      });
      card.classList.add('border-black', 'bg-zinc-50', 'ring-1', 'ring-black', 'shadow-2xs');
      card.classList.remove('border-zinc-200', 'bg-white');

      // Populate form fields with saved address data
      fullNameInput.value = selected.fullName || '';
      mobileInput.value = selected.phone || '';
      pincodeInput.value = selected.pincode || '';
      addressInput.value = selected.line1 + (selected.line2 ? ', ' + selected.line2 : '');
      cityInput.value = selected.city || '';
      if (stateSelect && selected.state) {
        stateSelect.value = selected.state;
      }

      if (saveAddressChk) saveAddressChk.checked = false;

      // Clear any prior validation errors
      [fullNameErr, mobileErr, pincodeErr, addressErr, cityErr].forEach((el) => el?.classList.add('hidden'));
      [fullNameInput, mobileInput, pincodeInput, addressInput, cityInput].forEach((el) => {
        el?.classList.remove('border-red-500', 'bg-red-50/20');
        el?.classList.add('border-zinc-200');
      });

      showToast(`Using address: ${selected.label || 'Home'} (${selected.fullName})`, 'info');
    });
  });

  toggleNewAddrBtn?.addEventListener('click', () => {
    // Deselect all cards
    savedCards.forEach((c) => {
      c.classList.remove('border-black', 'bg-zinc-50', 'ring-1', 'ring-black', 'shadow-2xs');
      c.classList.add('border-zinc-200', 'bg-white');
    });

    // Clear form inputs for entering a brand new address
    fullNameInput.value = '';
    mobileInput.value = '';
    pincodeInput.value = '';
    addressInput.value = '';
    cityInput.value = '';
    if (saveAddressChk) saveAddressChk.checked = true;

    [fullNameErr, mobileErr, pincodeErr, addressErr, cityErr].forEach((el) => el?.classList.add('hidden'));
    [fullNameInput, mobileInput, pincodeInput, addressInput, cityInput].forEach((el) => {
      el?.classList.remove('border-red-500', 'bg-red-50/20');
      el?.classList.add('border-zinc-200');
    });

    fullNameInput.focus();
    showToast('Enter new delivery address', 'info');
  });

  function validateAllDeliveryInputs() {
    const isNameValid = validateField(fullNameInput, fullNameErr, (v) => v.length >= 2, 'Please enter your full legal name');
    const isMobileValid = validateField(mobileInput, mobileErr, (v) => /^[6-9]\d{9}$/.test(v), 'Please enter a valid 10-digit Indian mobile number');
    const isPinValid = validateField(pincodeInput, pincodeErr, (v) => /^\d{6}$/.test(v), 'Please enter a valid 6-digit Indian PIN code');
    const isAddrValid = validateField(addressInput, addressErr, (v) => v.length >= 5, 'Please enter a complete street address');
    const isCityValid = validateField(cityInput, cityErr, (v) => v.length >= 2, 'Please enter your city / district');

    if (!isNameValid) fullNameInput.focus();
    else if (!isMobileValid) mobileInput.focus();
    else if (!isPinValid) pincodeInput.focus();
    else if (!isAddrValid) addressInput.focus();
    else if (!isCityValid) cityInput.focus();

    if (!(isNameValid && isMobileValid && isPinValid && isAddrValid && isCityValid)) {
      showToast('Please fix the highlighted fields before placing your order', 'error');
      return false;
    }
    return true;
  }

  // Unified Order Execution logic with WhatsApp Verification
  async function executeOrderPlacement() {
    try {
      const fullName = fullNameInput.value.trim();
      const mobile = mobileInput.value.trim();
      const pincode = pincodeInput.value.trim();
      const address = addressInput.value.trim();
      const city = cityInput.value.trim();
      const state = page.querySelector('#state').value.trim();

      const order = await submitOrder(cart, {
        fullName,
        mobile,
        pincode,
        address,
        city,
        state,
        coupon: activeCoupon ? activeCoupon.code : null,
        discount: discountAmount,
        grandTotal,
      });

      if (!order) return false;

      // Save address to user's address book if requested
      if (saveAddressChk?.checked) {
        const isAlreadySaved = savedAddresses.some(
          (a) => a.phone === mobile && a.pincode === pincode && a.line1.toLowerCase().trim() === address.toLowerCase().trim()
        );
        if (!isAlreadySaved) {
          addAddress({
            label: 'Home',
            fullName,
            phone: mobile,
            line1: address,
            city,
            state,
            pincode,
            default: savedAddresses.length === 0,
          });
        }
      }

    const waText = generateWhatsAppMessage({
      ...order,
      total: grandTotal,
      coupon: activeCoupon ? activeCoupon.code : null,
      discount: discountAmount,
    });
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
              ${activeCoupon ? `<p class="text-emerald-700 font-semibold"><strong>Coupon:</strong> ${activeCoupon.code} (-${formatCurrency(discountAmount)})</p>` : ''}
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
        // Pass order data to confirmation page via sessionStorage
        try {
          sessionStorage.setItem('bear_last_order', JSON.stringify({
            id: order.orderNumber,
            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
            items: (order.items || []).map(i => ({ name: i.name, size: i.size, colour: i.colour, qty: i.quantity || 1, price: i.price })),
            address: { name: fullName, line: address, city, state, pin: pincode },
            payment: 'WhatsApp Verified',
            shipping: 'Free Air Express',
            eta: '24 – 48 Hours',
            coupon: activeCoupon ? activeCoupon.code : null,
            discount: discountAmount,
            grandTotal,
          }));
        } catch { /* ignore quota */ }
        window.location.hash = '#order-confirmation';
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
      try {
        triggerOrderConfetti();
      } catch {}
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
            ${activeCoupon ? `<p class="text-xs text-emerald-700 mt-1 font-semibold"><strong>Coupon Applied:</strong> ${activeCoupon.code} (-${formatCurrency(discountAmount)})</p>` : ''}
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
          </div>
        </div>
      `;
    }

    renderVerificationPendingScreen();
    return true;
  } catch (err) {
    showToast(err.message || 'Order failed. Please check connection.', 'error');
    return false;
  }
}

  // Mount Slide to Confirm
  const slideMount = page.querySelector('#slide-to-confirm-mount');
  if (slideMount) {
    const slider = createSlideToConfirm({
      validate: () => validateAllDeliveryInputs(),
      onConfirm: async () => {
        await executeOrderPlacement();
        return true;
      },
    });
    slideMount.appendChild(slider);
  }

  // 1-Click WhatsApp CTA fallback button
  page.querySelector('#place-order-whatsapp-btn')?.addEventListener('click', async () => {
    if (!validateAllDeliveryInputs()) return;
    try {
      triggerOrderConfetti();
    } catch {}
    await executeOrderPlacement();
  });

  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };
