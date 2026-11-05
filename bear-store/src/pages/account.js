import { get, set } from '../utils/storage.js';
import { clearSessionCookie } from '../services/cookieService.js';
import {
  getDemoUser,
  getDemoOrders,
  getDemoAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  cancelOrder,
  requestCancellation,
  generateWhatsAppCancellationMessage,
} from '../services/accountService.js';
import { getWishlist, removeFromWishlist, toggleWishlist } from '../state/store.js';
import { products } from '../data/products.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { createProductCard } from '../components/productCard.js';
import { showToast } from '../components/toast.js';
import { skeletonAccount } from '../utils/skeletons.js';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: `<svg class="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" stroke-linejoin="round"/><rect x="14" y="3" width="7" height="7" rx="1" stroke-linejoin="round"/><rect x="14" y="14" width="7" height="7" rx="1" stroke-linejoin="round"/><rect x="3" y="14" width="7" height="7" rx="1" stroke-linejoin="round"/></svg>` },
  { id: 'wishlist', label: 'My Wishlist', icon: `<svg class="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
  { id: 'orders', label: 'Active Orders', icon: `<svg class="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
  { id: 'cancellations', label: 'Cancellations', icon: `<svg class="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 9l-6 6M9 9l6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
  { id: 'addresses', label: 'My Addresses', icon: `<svg class="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="9" r="2.5" stroke-linecap="round"/></svg>` },
  { id: 'settings', label: 'Settings', icon: `<svg class="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke-linecap="round"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke-linecap="round"/></svg>` },
  { id: 'help', label: 'Help & Support', icon: `<svg class="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-linecap="round"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>` },
  { id: 'logout', label: 'Logout', icon: `<svg class="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke-linecap="round" stroke-linejoin="round"/><polyline points="16 17 21 12 16 7" stroke-linecap="round" stroke-linejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke-linecap="round"/></svg>` },
];

export async function render(container) {
  container.innerHTML = skeletonAccount();

  let user = await getDemoUser();
  let orders = await getDemoOrders();
  let addresses = await getDemoAddresses();

  let activeSection = 'dashboard';
  let addressModalOpen = false;
  let editingAddress = null;
  let cancellationModalOpen = false;
  let cancellingOrder = null;

  const page = document.createElement('div');
  page.className = 'w-full flex flex-col pt-20 md:pt-24 pb-32';

  function getSectionContent(id) {
    const wishlistIds = getWishlist();
    const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));

    switch (id) {
      case 'dashboard':
        return `
          <div class="account-section-title font-headline text-xl font-bold text-zinc-900 mb-4">Account Overview</div>
          <div class="flex items-center gap-4 bg-white border border-zinc-200 rounded-xl p-5 mb-6 shadow-xs">
            <div class="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold flex-shrink-0 font-headline">
              ${user.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <p class="text-base font-bold text-zinc-900 font-headline">${user.name}</p>
              <p class="text-xs text-zinc-500">${user.email}</p>
              <p class="text-[11px] text-zinc-400 mt-0.5">Member since ${user.memberSince}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div class="bg-zinc-50 rounded-xl p-3.5 text-center border border-zinc-200/80 cursor-pointer hover:bg-zinc-100 transition-colors" data-goto="orders">
              <p class="text-2xl font-bold font-headline text-zinc-900">${orders.length}</p>
              <p class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Orders</p>
            </div>
            <div class="bg-zinc-50 rounded-xl p-3.5 text-center border border-zinc-200/80 cursor-pointer hover:bg-zinc-100 transition-colors" data-goto="wishlist">
              <p class="text-2xl font-bold font-headline text-zinc-900">${wishlistIds.length}</p>
              <p class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Wishlist</p>
            </div>
            <div class="bg-zinc-50 rounded-xl p-3.5 text-center border border-zinc-200/80 cursor-pointer hover:bg-zinc-100 transition-colors" data-goto="addresses">
              <p class="text-2xl font-bold font-headline text-zinc-900">${addresses.length}</p>
              <p class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Addresses</p>
            </div>
            <div class="bg-zinc-50 rounded-xl p-3.5 text-center border border-zinc-200/80">
              <p class="text-2xl font-bold font-headline text-zinc-900">${user.bearPoints}</p>
              <p class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">BEAR Points</p>
            </div>
          </div>

          <!-- Recent Orders on Dashboard -->
          <div class="bg-white border border-zinc-200 rounded-xl p-5 mb-6 shadow-xs">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-zinc-900 text-lg">package_2</span>
                <h3 class="font-headline text-sm font-bold text-zinc-900 uppercase tracking-wider">
                  Recent Orders (${orders.length})
                </h3>
              </div>
              ${orders.length > 0 ? `<button class="text-xs font-bold text-black hover:underline cursor-pointer" data-goto="orders">View All Orders →</button>` : ''}
            </div>

            ${orders.length === 0 ? `
              <div class="py-6 text-center text-xs text-zinc-500">
                <p class="font-medium text-zinc-700">No active orders found.</p>
                <p class="text-[11px] text-zinc-400 mt-1">When you place an order, its details and live WhatsApp tracking will appear here.</p>
                <a href="#collection" class="inline-block mt-3 px-4 py-1.5 rounded-full bg-black text-white text-[11px] font-bold uppercase font-headline no-underline">Browse Drops</a>
              </div>
            ` : `
              <div class="space-y-3">
                ${orders.slice(0, 3).map((order) => `
                  <div class="border border-zinc-100 bg-zinc-50/70 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div class="flex items-center gap-2 mb-1">
                        <span class="font-headline text-xs font-bold text-zinc-950">${order.orderNumber || order.id}</span>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'confirmed' || order.status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-900'
                        }">${(order.status || 'pending').replace(/_/g, ' ')}</span>
                      </div>
                      <div class="text-[11px] text-zinc-600 space-y-0.5">
                        ${(order.items || []).map(i => `<div>${i.name} — <span class="font-medium">${i.size || 'M'} × ${i.quantity || 1}</span></div>`).join('')}
                      </div>
                      <p class="text-[10px] text-zinc-400 mt-1">${order.date || ''}</p>
                    </div>

                    <div class="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                      <span class="font-headline text-xs font-bold text-zinc-950">${formatCurrency(order.total)}</span>
                      <a href="#track-order" class="px-3 py-1 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-800 no-underline transition-colors">
                        Track Order
                      </a>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Quick Wishlist Preview Section -->
          <div class="bg-white border border-zinc-200 rounded-xl p-5 mb-6 shadow-xs">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="text-red-500 text-lg">♥</span>
                <h3 class="font-headline text-sm font-bold text-zinc-900 uppercase tracking-wider">Saved in Wishlist (${wishlistedProducts.length})</h3>
              </div>
              <button class="text-xs font-bold text-black hover:underline cursor-pointer" data-goto="wishlist">View All</button>
            </div>
            ${
              wishlistedProducts.length === 0
                ? `<p class="text-xs text-zinc-400">Your wishlist is currently empty. Tap the heart on any product to save it here.</p>`
                : `<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    ${wishlistedProducts.slice(0, 4).map(p => `
                      <a href="#product/${p.slug}" class="group block rounded-none sm:rounded-sm overflow-hidden border border-zinc-100 bg-zinc-50 p-1.5 no-underline">
                        <div class="aspect-[4/5] rounded-none overflow-hidden bg-zinc-200 mb-1.5">
                          <img src="${p.images[0]}" class="w-full h-full object-cover group-hover:scale-105 transition-transform rounded-none" />
                        </div>
                        <p class="text-xs font-bold text-zinc-900 truncate">${p.name}</p>
                        <p class="text-xs font-bold text-zinc-950">₹${p.price.toLocaleString('en-IN')}</p>
                      </a>
                    `).join('')}
                  </div>`
            }
          </div>
        `;

      case 'wishlist':
        return `
          <div class="flex items-center justify-between mb-4">
            <div class="account-section-title font-headline text-xl font-bold text-zinc-900">My Wishlist (${wishlistedProducts.length})</div>
            <a href="#collection" class="text-xs font-bold text-zinc-600 hover:text-black uppercase font-headline no-underline">+ Browse Drops</a>
          </div>
          ${
            wishlistedProducts.length === 0
              ? `
              <div class="text-center py-16 bg-white rounded-none sm:rounded-sm border border-zinc-200 p-8">
                <div class="text-4xl text-zinc-300 mb-3">♡</div>
                <h3 class="font-headline text-base font-bold text-zinc-900">Your Wishlist is Empty</h3>
                <p class="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">Explore the collection and tap the heart icon on any drop to save your favourite pieces here.</p>
                <a href="#collection" class="inline-block mt-4 px-5 py-2.5 rounded-full bg-black text-white text-xs font-bold uppercase font-headline no-underline">Explore Collection</a>
              </div>
            `
              : `
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3" id="account-wishlist-grid">
              </div>
            `
          }
        `;

      case 'orders': {
        const activeOrders = orders.filter((o) => !o.cancellationRequested && o.status !== 'cancelled');
        return `
          <div class="flex items-center justify-between mb-4">
            <div class="account-section-title font-headline text-xl font-bold text-zinc-900">Active Orders (${activeOrders.length})</div>
            <button class="text-xs font-bold font-headline text-zinc-500 hover:text-black uppercase tracking-wider cursor-pointer" data-goto="cancellations">
              View Cancellations (${orders.filter((o) => o.cancellationRequested || o.status === 'cancelled').length}) →
            </button>
          </div>
          <div class="space-y-3">
            ${
              activeOrders.length === 0
                ? `<div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-8 text-center text-xs text-zinc-500">
                     No active orders in progress.
                     <div class="mt-2">
                       <a href="#shop" class="text-black font-bold uppercase underline">Explore Drops</a>
                     </div>
                   </div>`
                : activeOrders
                    .map(
                      (order) => `
                <div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-4 shadow-xs">
                  <div class="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100">
                    <div>
                      <p class="text-xs font-bold font-headline text-zinc-900">${order.id || order.orderNumber}</p>
                      <p class="text-[10px] text-zinc-400">${order.date}</p>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }">${order.status}</span>
                  </div>
                  <div class="space-y-1">
                    ${(order.items || [])
                      .map((item) => `<p class="text-xs text-zinc-600">${item.name} — <span class="font-semibold">${item.size} × ${item.quantity || 1}</span></p>`)
                      .join('')}
                  </div>
                  <div class="mt-3 pt-2 border-t border-zinc-100 flex flex-wrap justify-between items-center gap-2">
                    <span class="text-xs font-bold text-zinc-900 font-headline">${formatCurrency(order.total)}</span>
                    <div class="flex items-center gap-2">
                      ${
                        ['pending_whatsapp', 'confirmed', 'processing'].includes(order.status)
                          ? `<button class="order-cancel-btn px-3 py-1 rounded-full border border-red-200 text-red-600 text-[11px] font-bold hover:bg-red-50 cursor-pointer transition-colors" data-order-id="${order.id || order.orderNumber}">Cancel Order</button>`
                          : ''
                      }
                      <a href="#track-order" class="px-3 py-1 rounded-full bg-black text-white text-[11px] font-bold hover:bg-zinc-800 no-underline transition-colors">Track Order</a>
                    </div>
                  </div>
                </div>
              `
                    )
                    .join('')
            }
          </div>
        `;
      }

      case 'cancellations': {
        const cancelledOrders = orders.filter((o) => o.cancellationRequested || o.status === 'cancelled');
        return `
          <div class="account-section-title font-headline text-xl font-bold text-zinc-900 mb-4">Cancelled Items &amp; Requests (${cancelledOrders.length})</div>
          <div class="space-y-3">
            ${
              cancelledOrders.length === 0
                ? `<div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-8 text-center text-xs text-zinc-500">
                     No cancelled orders or pending requests.
                   </div>`
                : cancelledOrders
                    .map(
                      (order) => `
                <div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-4 shadow-xs">
                  <div class="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100">
                    <div>
                      <p class="text-xs font-bold font-headline text-zinc-900">${order.id || order.orderNumber}</p>
                      <p class="text-[10px] text-zinc-400">${order.date}</p>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'cancelled'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }">
                      ${order.status === 'cancelled' ? 'Cancelled &amp; Restocked' : 'Cancellation Request Pending'}
                    </span>
                  </div>

                  <!-- Cancellation Details Panel -->
                  <div class="bg-zinc-50 p-2.5 rounded border border-zinc-200/80 mb-2.5 text-xs text-zinc-700">
                    <p class="text-[11px] font-bold text-zinc-900 uppercase font-headline">Reason for Cancellation:</p>
                    <p class="text-zinc-600 mt-0.5">${order.cancellationReason || 'Requested via customer account'}</p>
                    ${order.cancellationNotes ? `<p class="text-[11px] text-zinc-500 mt-1 italic font-sans">"${order.cancellationNotes}"</p>` : ''}
                  </div>

                  <div class="space-y-1">
                    ${(order.items || [])
                      .map((item) => `<p class="text-xs text-zinc-600">${item.name} — <span class="font-semibold">${item.size} × ${item.quantity || 1}</span></p>`)
                      .join('')}
                  </div>

                  <div class="mt-3 pt-2 border-t border-zinc-100 flex flex-wrap justify-between items-center gap-2">
                    <span class="text-xs font-bold text-zinc-900 font-headline">${formatCurrency(order.total)}</span>
                    <a href="https://wa.me/919605210198?text=${encodeURIComponent(`Hi BEAR! Inquiring about cancellation for order ${order.id || order.orderNumber}`)}" target="_blank" rel="noopener" class="px-3 py-1 rounded-full border border-zinc-300 text-zinc-800 text-[11px] font-bold hover:border-black transition-colors flex items-center gap-1.5">
                      <span>Chat Support on WhatsApp</span>
                    </a>
                  </div>
                </div>
              `
                    )
                    .join('')
            }
          </div>
        `;
      }

      case 'addresses':
        return `
          <div class="flex items-center justify-between mb-4">
            <div class="account-section-title font-headline text-xl font-bold text-zinc-900">My Addresses (${addresses.length})</div>
            <button id="add-address-trigger-btn" class="px-4 py-1.5 rounded-full bg-black text-white text-xs font-bold font-headline uppercase tracking-wider hover:bg-zinc-800 cursor-pointer shadow-xs transition-colors">
              + Add New Address
            </button>
          </div>

          <!-- Add / Edit Address Form Modal Panel -->
          <div id="address-form-panel" class="${addressModalOpen ? '' : 'hidden'} bg-white border border-zinc-300 rounded-none sm:rounded-sm p-5 mb-5 shadow-sm">
            <div class="flex items-center justify-between pb-2 mb-3 border-b border-zinc-100">
              <h3 class="font-headline text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-950">
                ${editingAddress ? 'Edit Address' : 'Add New Delivery Address'}
              </h3>
              <button id="close-address-form-btn" class="text-zinc-400 hover:text-black text-sm cursor-pointer">✕</button>
            </div>
            <form id="address-crud-form" class="space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Full Name</label>
                  <input type="text" id="addr-name" required value="${editingAddress?.fullName || ''}" placeholder="Full name" class="w-full px-3 py-2 text-xs border border-zinc-200 rounded-none sm:rounded-sm focus:outline-none focus:border-black" />
                </div>
                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Phone Number</label>
                  <input type="tel" id="addr-phone" required value="${editingAddress?.phone || ''}" placeholder="10-digit mobile" class="w-full px-3 py-2 text-xs border border-zinc-200 rounded-none sm:rounded-sm focus:outline-none focus:border-black font-mono" />
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Address Line</label>
                <input type="text" id="addr-line1" required value="${editingAddress?.line1 || ''}" placeholder="House/Flat no., building, street" class="w-full px-3 py-2 text-xs border border-zinc-200 rounded-none sm:rounded-sm focus:outline-none focus:border-black" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">City</label>
                  <input type="text" id="addr-city" required value="${editingAddress?.city || ''}" placeholder="City" class="w-full px-3 py-2 text-xs border border-zinc-200 rounded-none sm:rounded-sm focus:outline-none focus:border-black" />
                </div>
                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">State</label>
                  <input type="text" id="addr-state" required value="${editingAddress?.state || ''}" placeholder="State" class="w-full px-3 py-2 text-xs border border-zinc-200 rounded-none sm:rounded-sm focus:outline-none focus:border-black" />
                </div>
                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">PIN Code</label>
                  <input type="text" id="addr-pincode" maxlength="6" required value="${editingAddress?.pincode || ''}" placeholder="6-digit PIN" class="w-full px-3 py-2 text-xs border border-zinc-200 rounded-none sm:rounded-sm focus:outline-none focus:border-black font-mono" />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">Label</label>
                  <select id="addr-label" class="w-full px-3 py-2 text-xs border border-zinc-200 rounded-none sm:rounded-sm focus:outline-none focus:border-black bg-white">
                    <option value="Home" ${editingAddress?.label === 'Home' ? 'selected' : ''}>Home</option>
                    <option value="Office" ${editingAddress?.label === 'Office' ? 'selected' : ''}>Office / Work</option>
                    <option value="Gym" ${editingAddress?.label === 'Gym' ? 'selected' : ''}>Gym / Club</option>
                  </select>
                </div>
                <div class="flex items-center gap-2 pt-4">
                  <input type="checkbox" id="addr-default" ${editingAddress?.default ? 'checked' : ''} class="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black" />
                  <label for="addr-default" class="text-xs font-semibold text-zinc-700 cursor-pointer">Set as default delivery address</label>
                </div>
              </div>

              <div class="flex items-center gap-2 pt-2">
                <button type="submit" class="px-5 py-2 rounded-full bg-black text-white text-xs font-bold uppercase font-headline hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer">
                  ${editingAddress ? 'Update Address' : 'Save Address'}
                </button>
                <button type="button" id="cancel-addr-btn" class="px-4 py-2 rounded-full border border-zinc-200 text-xs font-bold text-zinc-600 hover:text-black cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>

          <!-- Address List -->
          <div class="space-y-3">
            ${
              addresses.length === 0
                ? `<div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-8 text-center text-xs text-zinc-500">No addresses saved yet. Click "+ Add New Address" above.</div>`
                : addresses
                    .map(
                      (addr) => `
                <div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-4 shadow-xs">
                  <div class="flex items-center justify-between mb-1.5">
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-sm font-headline">${addr.label}</span>
                      ${addr.default ? `<span class="px-2 py-0.5 rounded-full bg-black text-white text-[9px] font-bold uppercase">Default</span>` : ''}
                    </div>
                    <div class="flex items-center gap-3">
                      ${
                        !addr.default
                          ? `<button class="addr-set-default-btn text-[11px] font-bold text-zinc-500 hover:text-black cursor-pointer" data-id="${addr.id}">Set as Default</button>`
                          : ''
                      }
                      <button class="addr-edit-btn text-[11px] font-bold text-zinc-700 hover:text-black cursor-pointer" data-id="${addr.id}">Edit</button>
                      <button class="addr-delete-btn text-[11px] font-bold text-red-500 hover:text-red-700 cursor-pointer" data-id="${addr.id}">Delete</button>
                    </div>
                  </div>
                  <p class="text-xs font-bold text-zinc-900">${addr.fullName}</p>
                  <p class="text-xs text-zinc-500">${addr.line1}</p>
                  <p class="text-xs text-zinc-500">${addr.city}, ${addr.state} — ${addr.pincode}</p>
                  <p class="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                    <svg class="w-3 h-3 stroke-[2] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    ${addr.phone}
                  </p>
                </div>
              `
                    )
                    .join('')
            }
          </div>
        `;

      case 'settings':
        return `
          <div class="account-section-title font-headline text-xl font-bold text-zinc-900 mb-4">Settings</div>
          <div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-5 text-center text-xs text-zinc-500">
            Account preferences and notifications are synchronized.
          </div>
        `;

      case 'help':
        return `
          <div class="account-section-title font-headline text-xl font-bold text-zinc-900 mb-4">Help & Support</div>
          <div class="space-y-2">
            <a href="#track-order" class="w-full text-left p-3.5 rounded-none sm:rounded-sm border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium flex items-center justify-between no-underline text-zinc-900">
              <span>Track my active order</span>
              <span>→</span>
            </a>
            <a href="#returns" class="w-full text-left p-3.5 rounded-none sm:rounded-sm border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium flex items-center justify-between no-underline text-zinc-900">
              <span>Return & 7-day exchange policy</span>
              <span>→</span>
            </a>
            <a href="#size-guide" class="w-full text-left p-3.5 rounded-none sm:rounded-sm border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium flex items-center justify-between no-underline text-zinc-900">
              <span>Garment GSM & size guide</span>
              <span>→</span>
            </a>
            <a href="https://wa.me/919876543210" target="_blank" class="w-full text-left p-3.5 rounded-none sm:rounded-sm border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium flex items-center justify-between no-underline text-zinc-900">
              <span>Contact WhatsApp support</span>
              <span>→</span>
            </a>
          </div>
        `;

      case 'logout': {
        const authMode = get('bear_auth_mode') || 'guest';
        return `
          <div class="account-section-title font-headline text-xl font-bold text-zinc-900 mb-4">Account Session</div>
          <div class="bg-white border border-zinc-200 rounded-xl p-6 text-center shadow-xs">
            ${
              authMode === 'authenticated'
                ? `<p class="text-xs text-zinc-500 mb-5">You are signed in. Signing out will clear your session from this device.</p>
                   <button id="account-logout-btn" class="px-6 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase font-headline cursor-pointer transition-colors">Sign Out</button>`
                : `<div class="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                     <svg class="w-6 h-6 stroke-[1.8] text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-linecap="round" stroke-linejoin="round"/></svg>
                   </div>
                   <p class="text-sm font-bold text-zinc-900 mb-1">You're browsing as a Guest</p>
                   <p class="text-xs text-zinc-500 mb-5">Sign in or create an account to sync your orders and addresses across devices.</p>
                   <a href="#auth" class="inline-block px-6 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase font-headline no-underline transition-colors">Sign In / Create Account</a>`
            }
          </div>
        `;
      }

      default:
        return `<p>Section</p>`;
    }
  }

  function renderView() {
    page.innerHTML = `
      <div class="max-w-[1100px] mx-auto px-4 w-full">
        <!-- Breadcrumb / Back Navigation -->
        <div class="mb-3 flex items-center gap-2">
          <a href="#" class="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-black transition-colors no-underline">
            <svg class="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>Back to Store</span>
          </a>
        </div>

        <div class="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200">
          <div>
            <h1 class="font-headline text-2xl font-bold text-zinc-900">Profile &amp; Account</h1>
            <p class="text-xs text-zinc-500">Manage orders, saved wishlist, and addresses.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <!-- Sidebar Tabs -->
          <aside class="md:col-span-4 bg-white border border-zinc-200 rounded-none sm:rounded-sm p-2 shadow-xs" aria-label="Account navigation">
            ${NAV_ITEMS.map(
              (item) =>
                `<button class="w-full text-left px-4 py-3 rounded-none sm:rounded-sm text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                  activeSection === item.id ? 'bg-black text-white shadow-xs' : 'text-zinc-600 hover:text-black hover:bg-zinc-50'
                }" data-section="${item.id}">
                  ${item.icon}
                  <span>${item.label}</span>
                </button>`
            ).join('')}
          </aside>

          <!-- Main Content Area -->
          <div class="md:col-span-8" id="account-content">
            ${getSectionContent(activeSection)}
          </div>
        </div>
      </div>
      ${cancellationModalOpen && cancellingOrder ? `
        <div id="cancellation-modal-overlay" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full p-6 text-left animate-in fade-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  !
                </div>
                <h3 class="font-headline text-sm font-bold uppercase tracking-wider text-zinc-950">
                  Cancel Order Request
                </h3>
              </div>
              <button id="cancel-modal-close-btn" class="text-zinc-400 hover:text-black text-sm cursor-pointer p-1">✕</button>
            </div>

            <div class="mb-4">
              <p class="text-xs text-zinc-800 font-semibold mb-1">
                Do you want to request cancellation for order <strong class="font-mono text-zinc-950">${cancellingOrder.id || cancellingOrder.orderNumber}</strong>?
              </p>
              <p class="text-[11px] text-zinc-500 leading-relaxed">
                Orders are not cancelled automatically without desk review. To ensure prompt review, your request will be sent directly to our official concierge on WhatsApp (<strong class="text-zinc-900 font-semibold">+91 96052 10198</strong>) with your reason.
              </p>
            </div>

            <form id="cancel-request-form" class="space-y-3">
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">
                  Reason for Cancellation *
                </label>
                <select id="cancel-reason-select" class="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-black font-sans bg-white">
                  <option value="Ordered wrong size or colour">Ordered wrong size or colour</option>
                  <option value="Need to change shipping address or mobile">Need to change shipping address or mobile</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Found an alternative / changed mind">Found an alternative / changed mind</option>
                  <option value="Delivery timeframe too long">Delivery timeframe too long</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-headline">
                  Additional Notes (Optional)
                </label>
                <textarea id="cancel-notes-input" rows="2" placeholder="e.g. Please swap size to L or provide refund details" class="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-black font-sans resize-none"></textarea>
              </div>

              <div class="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl text-[11px] text-zinc-600">
                <p class="font-bold text-zinc-900 mb-0.5">WhatsApp Direct Handoff</p>
                <p>We'll open WhatsApp with your pre-formatted order details so our desk can review and confirm immediately.</p>
              </div>

              <div class="pt-2 flex items-center justify-end gap-2">
                <button type="button" id="cancel-modal-dismiss-btn" class="px-4 py-2 text-xs font-bold font-headline uppercase tracking-wider text-zinc-600 hover:text-black rounded-lg transition-colors cursor-pointer">
                  Keep Order
                </button>
                <button type="submit" id="cancel-modal-submit-btn" class="px-5 py-2.5 text-xs font-bold font-headline uppercase tracking-wider bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer">
                  <span>Send Request on WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ` : ''}
    `;

    // Attach navigation clicks
    page.querySelectorAll('[data-section]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeSection = btn.dataset.section;
        addressModalOpen = false;
        editingAddress = null;
        cancellationModalOpen = false;
        cancellingOrder = null;
        renderView();
      });
    });

    // Attach goto shortcuts
    page.querySelectorAll('[data-goto]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeSection = btn.dataset.goto;
        addressModalOpen = false;
        editingAddress = null;
        cancellationModalOpen = false;
        cancellingOrder = null;
        renderView();
      });
    });

    // Wishlist view items
    if (activeSection === 'wishlist') {
      const grid = page.querySelector('#account-wishlist-grid');
      if (grid) {
        const wishlistIds = getWishlist();
        const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));
        wishlistedProducts.forEach((p) => {
          grid.appendChild(createProductCard(p));
        });
      }
    }

    // Orders Actions: Open Cancellation Modal (NOT directly cancelling)
    page.querySelectorAll('.order-cancel-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const orderId = btn.dataset.orderId;
        const matched = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
        if (matched) {
          cancellingOrder = matched;
          cancellationModalOpen = true;
          renderView();
        }
      });
    });

    page.querySelector('#cancel-modal-close-btn')?.addEventListener('click', () => {
      cancellationModalOpen = false;
      cancellingOrder = null;
      renderView();
    });

    page.querySelector('#cancel-modal-dismiss-btn')?.addEventListener('click', () => {
      cancellationModalOpen = false;
      cancellingOrder = null;
      renderView();
    });

    page.querySelector('#cancel-request-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!cancellingOrder) return;

      const reason = page.querySelector('#cancel-reason-select').value;
      const notes = page.querySelector('#cancel-notes-input').value.trim();

      const waText = generateWhatsAppCancellationMessage(cancellingOrder, reason, notes);
      const waUrl = `https://wa.me/919605210198?text=${encodeURIComponent(waText)}`;

      // Open WhatsApp
      window.open(waUrl, '_blank');

      // Record cancellation request with backend
      orders = await requestCancellation(cancellingOrder.backendId || cancellingOrder.id, reason, notes);

      showToast(`Cancellation request submitted via WhatsApp for #${cancellingOrder.id}`, 'info');
      cancellationModalOpen = false;
      cancellingOrder = null;
      renderView();
    });

    // Address Actions: Open Add Form
    page.querySelector('#add-address-trigger-btn')?.addEventListener('click', () => {
      editingAddress = null;
      addressModalOpen = true;
      renderView();
    });

    // Address Actions: Close Form
    page.querySelector('#close-address-form-btn')?.addEventListener('click', () => {
      addressModalOpen = false;
      editingAddress = null;
      renderView();
    });
    page.querySelector('#cancel-addr-btn')?.addEventListener('click', () => {
      addressModalOpen = false;
      editingAddress = null;
      renderView();
    });

    // Address Actions: Edit Form
    page.querySelectorAll('.addr-edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        editingAddress = addresses.find((a) => a.id === id);
        addressModalOpen = true;
        renderView();
      });
    });

    // Address Actions: Delete
    page.querySelectorAll('.addr-delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        addresses = deleteAddress(id);
        showToast('Address deleted successfully.', 'info');
        renderView();
      });
    });

    // Address Actions: Set Default
    page.querySelectorAll('.addr-set-default-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        addresses = updateAddress(id, { default: true });
        showToast('Set as default delivery address.', 'success');
        renderView();
      });
    });

    // Address Form Submit (Create / Update)
    const addrForm = page.querySelector('#address-crud-form');
    addrForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const newAddressData = {
        fullName: page.querySelector('#addr-name').value.trim(),
        phone: page.querySelector('#addr-phone').value.trim(),
        line1: page.querySelector('#addr-line1').value.trim(),
        city: page.querySelector('#addr-city').value.trim(),
        state: page.querySelector('#addr-state').value.trim(),
        pincode: page.querySelector('#addr-pincode').value.trim(),
        label: page.querySelector('#addr-label').value,
        default: page.querySelector('#addr-default').checked,
      };

      if (editingAddress) {
        addresses = updateAddress(editingAddress.id, newAddressData);
        showToast('Address updated successfully.', 'success');
      } else {
        addresses = addAddress(newAddressData);
        showToast('New address saved successfully.', 'success');
      }

      addressModalOpen = false;
      editingAddress = null;
      renderView();
    });

    // Logout button
    page.querySelector('#account-logout-btn')?.addEventListener('click', () => {
      set('bear_auth_session', null);
      set('bear_auth_mode', null);
      set('bear_user', null);
      set('bear_pending_user', null);
      set('bear_addresses', null);
      set('bear_orders', null);
      clearSessionCookie();
      showToast('Signed out successfully.', 'info');
      window.location.hash = '#auth';
    });
  }

  renderView();
  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };
