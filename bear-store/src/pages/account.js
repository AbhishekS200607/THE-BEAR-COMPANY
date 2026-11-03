import {
  getDemoUser,
  getDemoOrders,
  getDemoAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  cancelOrder,
} from '../services/accountService.js';
import { getWishlist, removeFromWishlist, toggleWishlist } from '../state/store.js';
import { products } from '../data/products.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { createProductCard } from '../components/productCard.js';
import { showToast } from '../components/toast.js';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: `<svg class="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" stroke-linejoin="round"/><rect x="14" y="3" width="7" height="7" rx="1" stroke-linejoin="round"/><rect x="14" y="14" width="7" height="7" rx="1" stroke-linejoin="round"/><rect x="3" y="14" width="7" height="7" rx="1" stroke-linejoin="round"/></svg>` },
  { id: 'wishlist', label: 'My Wishlist', icon: `<svg class="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
  { id: 'orders', label: 'My Orders', icon: `<svg class="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
  { id: 'addresses', label: 'My Addresses', icon: `<svg class="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="9" r="2.5" stroke-linecap="round"/></svg>` },
  { id: 'settings', label: 'Settings', icon: `<svg class="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke-linecap="round"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke-linecap="round"/></svg>` },
  { id: 'help', label: 'Help & Support', icon: `<svg class="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-linecap="round"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>` },
  { id: 'logout', label: 'Logout', icon: `<svg class="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke-linecap="round" stroke-linejoin="round"/><polyline points="16 17 21 12 16 7" stroke-linecap="round" stroke-linejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke-linecap="round"/></svg>` },
];

export async function render(container) {
  // Render shimmer skeleton during async user & orders fetch (Item 2)
  container.innerHTML = `
    <div class="w-full max-w-[1360px] mx-auto px-4 sm:px-6 md:px-gutter-desktop pt-20 md:pt-24 pb-32 animate-pulse">
      <div class="h-8 bg-zinc-200 rounded w-48 mb-8"></div>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div class="lg:col-span-3 space-y-2">
          <div class="h-10 bg-zinc-200 rounded-xl"></div>
          <div class="h-10 bg-zinc-200 rounded-xl"></div>
          <div class="h-10 bg-zinc-200 rounded-xl"></div>
          <div class="h-10 bg-zinc-200 rounded-xl"></div>
          <div class="h-10 bg-zinc-200 rounded-xl"></div>
        </div>
        <div class="lg:col-span-9 space-y-4">
          <div class="h-24 bg-zinc-200 rounded-xl"></div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="h-20 bg-zinc-200 rounded-xl"></div>
            <div class="h-20 bg-zinc-200 rounded-xl"></div>
            <div class="h-20 bg-zinc-200 rounded-xl"></div>
            <div class="h-20 bg-zinc-200 rounded-xl"></div>
          </div>
          <div class="h-64 bg-zinc-200 rounded-xl mt-6"></div>
        </div>
      </div>
    </div>
  `;

  let user = await getDemoUser();
  let orders = await getDemoOrders();
  let addresses = await getDemoAddresses();

  let activeSection = 'dashboard';
  let addressModalOpen = false;
  let editingAddress = null;

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

      case 'orders':
        return `
          <div class="account-section-title font-headline text-xl font-bold text-zinc-900 mb-4">My Orders (${orders.length})</div>
          <div class="space-y-3">
            ${
              orders.length === 0
                ? `<div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-8 text-center text-xs text-zinc-500">No orders placed yet.</div>`
                : orders
                    .map(
                      (order) => `
                <div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-4 shadow-xs">
                  <div class="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100">
                    <div>
                      <p class="text-xs font-bold font-headline text-zinc-900">${order.id}</p>
                      <p class="text-[10px] text-zinc-400">${order.date}</p>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }">${order.status}</span>
                  </div>
                  <div class="space-y-1">
                    ${order.items
                      .map((item) => `<p class="text-xs text-zinc-600">${item.name} — <span class="font-semibold">${item.size} × ${item.quantity || 1}</span></p>`)
                      .join('')}
                  </div>
                  <div class="mt-3 pt-2 border-t border-zinc-100 flex flex-wrap justify-between items-center gap-2">
                    <span class="text-xs font-bold text-zinc-900 font-headline">${formatCurrency(order.total)}</span>
                    <div class="flex items-center gap-2">
                      ${
                        order.status === 'processing'
                          ? `<button class="order-cancel-btn px-3 py-1 rounded-full border border-red-200 text-red-600 text-[11px] font-bold hover:bg-red-50 cursor-pointer transition-colors" data-order-id="${order.id}">Cancel Order</button>`
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

      case 'logout':
        return `
          <div class="account-section-title font-headline text-xl font-bold text-zinc-900 mb-4">Logout</div>
          <div class="bg-white border border-zinc-200 rounded-none sm:rounded-sm p-5 text-center">
            <p class="text-xs text-zinc-500 mb-4">This is a live customer account session.</p>
            <button id="account-logout-btn" class="px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs font-bold uppercase cursor-pointer">Sign Out</button>
          </div>
        `;

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
    `;

    // Attach navigation clicks
    page.querySelectorAll('[data-section]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeSection = btn.dataset.section;
        addressModalOpen = false;
        editingAddress = null;
        renderView();
      });
    });

    // Attach goto shortcuts
    page.querySelectorAll('[data-goto]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeSection = btn.dataset.goto;
        addressModalOpen = false;
        editingAddress = null;
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

    // Orders Actions (Cancel Order)
    page.querySelectorAll('.order-cancel-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const orderId = btn.dataset.orderId;
        orders = cancelOrder(orderId);
        showToast(`Order #${orderId} has been cancelled.`, 'info');
        renderView();
      });
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
      showToast('Signed out of demo session.', 'info');
      window.location.hash = '#';
    });
  }

  renderView();
  container.innerHTML = '';
  container.appendChild(page);
}

export default { render };
