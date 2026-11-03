/**
 * BEAR Store — Admin Panel
 * Route: #admin | Dark industrial theme | PIN-gated
 */

import { getDashboard, getOrders, updateOrderStatus, getInventory, updateInventory } from '../services/adminService.js';

const PIN = '1980';
const SESSION_KEY = 'bear_admin_session';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  return Number(n).toLocaleString('en-IN');
}

function fmtCurrency(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function statusBadge(status) {
  const map = {
    pending_whatsapp: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    confirmed:        'bg-blue-500/20 text-blue-400 border-blue-500/30',
    processing:       'bg-purple-500/20 text-purple-400 border-purple-500/30',
    shipped:          'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    delivered:        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    cancelled:        'bg-red-500/20 text-red-400 border-red-500/30',
    returned:         'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  };
  const cls = map[status] || 'bg-zinc-700 text-zinc-300 border-zinc-600';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `<span class="inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-bold font-headline tracking-wide ${cls}">${label}</span>`;
}

function stockChip(qty, threshold) {
  if (qty === 0) return `<span class="inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-bold font-headline bg-red-500/20 text-red-400 border-red-500/30">OUT</span>`;
  if (qty <= threshold) return `<span class="inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-bold font-headline bg-amber-500/20 text-amber-400 border-amber-500/30">LOW</span>`;
  return `<span class="inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-bold font-headline bg-emerald-500/20 text-emerald-400 border-emerald-500/30">OK</span>`;
}


// ─── PIN Gate ─────────────────────────────────────────────────────────────────

function renderPinGate(container, onSuccess) {
  container.innerHTML = `
    <div class="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div class="w-full max-w-sm">
        <div class="text-center mb-8">
          <p class="font-headline font-extrabold text-3xl tracking-tighter text-zinc-100">BEAR<span class="text-zinc-500">.</span></p>
          <p class="text-zinc-500 text-xs font-body mt-1 tracking-widest uppercase">Admin Portal</p>
        </div>
        <div class="bg-zinc-900 border border-zinc-800 p-6">
          <p class="text-zinc-400 text-xs font-body mb-4 tracking-wide uppercase">Enter Access PIN</p>
          <div class="flex gap-3 justify-center mb-6" id="pin-dots">
            <span class="w-3 h-3 rounded-full border-2 border-zinc-700 pin-dot"></span>
            <span class="w-3 h-3 rounded-full border-2 border-zinc-700 pin-dot"></span>
            <span class="w-3 h-3 rounded-full border-2 border-zinc-700 pin-dot"></span>
            <span class="w-3 h-3 rounded-full border-2 border-zinc-700 pin-dot"></span>
          </div>
          <div id="pin-error" class="text-red-400 text-xs text-center font-body mb-3 hidden">Incorrect PIN. Try again.</div>
          <div class="grid grid-cols-3 gap-2">
            ${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k => `
              <button type="button" data-key="${k}" class="pin-key h-12 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-100 font-headline font-bold text-lg transition-colors ${k === '' ? 'invisible' : ''}">
                ${k}
              </button>
            `).join('')}
          </div>
        </div>
        <p class="text-zinc-700 text-[11px] text-center mt-4 font-body">Secured admin access · BEAR Performance Wear</p>
      </div>
    </div>
  `;

  let entered = '';
  const dots = container.querySelectorAll('.pin-dot');
  const errorEl = container.querySelector('#pin-error');

  function updateDots() {
    dots.forEach((d, i) => {
      d.classList.toggle('bg-zinc-100', i < entered.length);
      d.classList.toggle('border-zinc-100', i < entered.length);
      d.classList.toggle('border-zinc-700', i >= entered.length);
    });
  }

  container.querySelectorAll('.pin-key').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.key;
      if (k === '⌫') {
        entered = entered.slice(0, -1);
        errorEl.classList.add('hidden');
      } else if (k !== '' && entered.length < 4) {
        entered += k;
      }
      updateDots();
      if (entered.length === 4) {
        if (entered === PIN) {
          sessionStorage.setItem(SESSION_KEY, '1');
          onSuccess();
        } else {
          errorEl.classList.remove('hidden');
          entered = '';
          updateDots();
        }
      }
    });
  });
}


// ─── Admin Shell ──────────────────────────────────────────────────────────────

let _clockInterval = null;

function renderShell(container) {
  container.innerHTML = `
    <div class="min-h-screen bg-zinc-950 text-zinc-100 font-body">

      <!-- Admin Header -->
      <header class="sticky top-0 z-40 bg-zinc-950 border-b border-zinc-800">
        <div class="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="font-headline font-extrabold text-lg tracking-tighter text-zinc-100">BEAR<span class="text-zinc-500">.</span></span>
            <span class="hidden sm:inline-flex items-center px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-headline tracking-widest uppercase">Admin</span>
          </div>
          <div class="flex items-center gap-3 sm:gap-4">
            <span id="admin-clock" class="text-zinc-500 text-xs font-body tabular-nums hidden sm:block"></span>
            <a href="#" class="text-zinc-500 hover:text-zinc-300 text-xs font-body transition-colors">← Storefront</a>
            <button id="admin-logout-btn" type="button" class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-headline uppercase tracking-wide transition-colors">
              Log Out
            </button>
          </div>
        </div>
      </header>

      <!-- Tab Bar -->
      <div class="border-b border-zinc-800 bg-zinc-950 sticky top-14 z-30">
        <div class="max-w-[1400px] mx-auto px-4 sm:px-6 flex gap-0">
          <button type="button" data-tab="dashboard" class="admin-tab px-4 sm:px-6 py-3 text-xs font-headline uppercase tracking-widest border-b-2 transition-colors border-zinc-100 text-zinc-100">Dashboard</button>
          <button type="button" data-tab="orders" class="admin-tab px-4 sm:px-6 py-3 text-xs font-headline uppercase tracking-widest border-b-2 transition-colors border-transparent text-zinc-500 hover:text-zinc-300">Orders</button>
          <button type="button" data-tab="inventory" class="admin-tab px-4 sm:px-6 py-3 text-xs font-headline uppercase tracking-widest border-b-2 transition-colors border-transparent text-zinc-500 hover:text-zinc-300">Inventory</button>
        </div>
      </div>

      <!-- Tab Content -->
      <main id="admin-tab-content" class="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div class="flex items-center justify-center py-20">
          <div class="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div>
        </div>
      </main>

    </div>
  `;

  // Clock
  if (_clockInterval) clearInterval(_clockInterval);
  const clockEl = container.querySelector('#admin-clock');
  function tickClock() {
    if (clockEl) clockEl.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  tickClock();
  _clockInterval = setInterval(tickClock, 1000);

  // Logout
  container.querySelector('#admin-logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    if (_clockInterval) clearInterval(_clockInterval);
    render(container);
  });

  // Tab switching
  let activeTab = 'dashboard';
  const tabContent = container.querySelector('#admin-tab-content');

  function switchTab(tab) {
    activeTab = tab;
    container.querySelectorAll('.admin-tab').forEach(btn => {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle('border-zinc-100', isActive);
      btn.classList.toggle('text-zinc-100', isActive);
      btn.classList.toggle('border-transparent', !isActive);
      btn.classList.toggle('text-zinc-500', !isActive);
    });
    if (tab === 'dashboard') loadDashboard(tabContent);
    else if (tab === 'orders') loadOrders(tabContent);
    else if (tab === 'inventory') loadInventory(tabContent);
  }

  container.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Load default tab
  loadDashboard(tabContent);
}


// ─── Dashboard Tab ────────────────────────────────────────────────────────────

async function loadDashboard(container) {
  container.innerHTML = `<div class="flex items-center justify-center py-20"><div class="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div></div>`;
  const data = await getDashboard();

  container.innerHTML = `
    ${data._mock ? `<div class="mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-body">Mock data — backend offline</div>` : ''}

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      <div class="bg-zinc-900 border border-zinc-800 p-4 sm:p-5">
        <p class="text-zinc-500 text-[11px] font-headline uppercase tracking-widest mb-2">Total Revenue</p>
        <p class="font-headline font-bold text-2xl sm:text-3xl text-zinc-100">${fmtCurrency(data.totalRevenue)}</p>
      </div>
      <div class="bg-zinc-900 border border-zinc-800 p-4 sm:p-5">
        <p class="text-zinc-500 text-[11px] font-headline uppercase tracking-widest mb-2">Total Orders</p>
        <p class="font-headline font-bold text-2xl sm:text-3xl text-zinc-100">${fmt(data.totalOrders)}</p>
      </div>
      <div class="bg-zinc-900 border border-zinc-800 p-4 sm:p-5">
        <p class="text-zinc-500 text-[11px] font-headline uppercase tracking-widest mb-2">WhatsApp Pending</p>
        <p class="font-headline font-bold text-2xl sm:text-3xl text-amber-400">${fmt(data.pendingWhatsAppOrders)}</p>
      </div>
      <div class="bg-zinc-900 border border-zinc-800 p-4 sm:p-5">
        <p class="text-zinc-500 text-[11px] font-headline uppercase tracking-widest mb-2">Low Stock SKUs</p>
        <p class="font-headline font-bold text-2xl sm:text-3xl text-red-400">${fmt(data.lowStockCount)}</p>
      </div>
    </div>

    <!-- Recent Orders -->
    <div class="bg-zinc-900 border border-zinc-800">
      <div class="px-4 sm:px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h2 class="font-headline text-xs uppercase tracking-widest text-zinc-400">Recent Orders</h2>
        <span class="text-zinc-600 text-[11px] font-body">Live feed</span>
      </div>
      <div class="divide-y divide-zinc-800">
        ${(data.recentOrders || []).map(o => `
          <div class="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div class="flex-1 min-w-0">
              <p class="font-headline text-sm text-zinc-100 truncate">${o.customer_name}</p>
              <p class="text-zinc-500 text-xs font-body">${o.order_number}</p>
            </div>
            <div class="flex items-center gap-3 flex-shrink-0">
              ${statusBadge(o.status)}
              <span class="font-headline text-sm text-zinc-300">${fmtCurrency(o.total_amount)}</span>
              <span class="text-zinc-600 text-xs font-body">${timeAgo(o.created_at)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}


// ─── Orders Tab ───────────────────────────────────────────────────────────────

const ORDER_STATUSES = ['all', 'pending_whatsapp', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

async function loadOrders(container, activeStatus = 'all') {
  container.innerHTML = `<div class="flex items-center justify-center py-20"><div class="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div></div>`;
  const { orders, _mock } = await getOrders(activeStatus);

  container.innerHTML = `
    ${_mock ? `<div class="mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-body">Mock data — backend offline</div>` : ''}

    <!-- Status Filter -->
    <div class="flex flex-wrap gap-2 mb-5">
      ${ORDER_STATUSES.map(s => `
        <button type="button" data-status="${s}" class="order-filter-btn px-3 py-1.5 text-[11px] font-headline uppercase tracking-wide border transition-colors ${s === activeStatus ? 'bg-zinc-100 text-zinc-950 border-zinc-100' : 'bg-transparent text-zinc-500 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300'}">
          ${s.replace(/_/g, ' ')}
        </button>
      `).join('')}
    </div>

    <!-- Orders Table -->
    <div class="bg-zinc-900 border border-zinc-800 overflow-x-auto">
      <table class="w-full text-sm min-w-[640px]">
        <thead>
          <tr class="border-b border-zinc-800">
            <th class="px-4 py-3 text-left text-[11px] font-headline uppercase tracking-widest text-zinc-500">Order</th>
            <th class="px-4 py-3 text-left text-[11px] font-headline uppercase tracking-widest text-zinc-500">Customer</th>
            <th class="px-4 py-3 text-left text-[11px] font-headline uppercase tracking-widest text-zinc-500">Status</th>
            <th class="px-4 py-3 text-left text-[11px] font-headline uppercase tracking-widest text-zinc-500">Amount</th>
            <th class="px-4 py-3 text-left text-[11px] font-headline uppercase tracking-widest text-zinc-500">Date</th>
            <th class="px-4 py-3 text-left text-[11px] font-headline uppercase tracking-widest text-zinc-500">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800">
          ${orders.length === 0 ? `
            <tr><td colspan="6" class="px-4 py-10 text-center text-zinc-600 font-body text-sm">No orders found.</td></tr>
          ` : orders.map(o => `
            <tr class="hover:bg-zinc-800/40 transition-colors">
              <td class="px-4 py-3 font-headline text-xs text-zinc-300">${o.order_number}</td>
              <td class="px-4 py-3">
                <p class="text-zinc-100 text-sm font-body">${o.customer_name}</p>
                <p class="text-zinc-500 text-xs font-body">${o.customer_phone}</p>
              </td>
              <td class="px-4 py-3">${statusBadge(o.status)}</td>
              <td class="px-4 py-3 font-headline text-sm text-zinc-200">${fmtCurrency(o.total_amount)}</td>
              <td class="px-4 py-3 text-zinc-500 text-xs font-body">${timeAgo(o.created_at)}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button type="button" data-order-id="${o.id}" class="order-inspect-btn px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[11px] font-headline uppercase tracking-wide transition-colors">View</button>
                  <a href="https://wa.me/91${o.customer_phone}?text=${encodeURIComponent(`Hi ${o.customer_name}, regarding your BEAR order ${o.order_number}`)}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-700/40 text-emerald-400 text-[11px] font-headline uppercase tracking-wide transition-colors">WA</a>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Order Detail Modal (hidden) -->
    <div id="order-modal" class="fixed inset-0 z-50 hidden">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" id="order-modal-backdrop"></div>
      <div class="absolute inset-y-0 right-0 w-full max-w-lg bg-zinc-900 border-l border-zinc-800 overflow-y-auto">
        <div id="order-modal-content" class="p-5 sm:p-6"></div>
      </div>
    </div>
  `;

  // Filter buttons
  container.querySelectorAll('.order-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => loadOrders(container, btn.dataset.status));
  });

  // Inspect buttons
  container.querySelectorAll('.order-inspect-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const order = orders.find(o => o.id === btn.dataset.orderId);
      if (order) openOrderModal(container, order, () => loadOrders(container, activeStatus));
    });
  });
}

function openOrderModal(container, order, onUpdate) {
  const modal = container.querySelector('#order-modal');
  const content = container.querySelector('#order-modal-content');
  modal.classList.remove('hidden');

  content.innerHTML = `
    <div class="flex items-center justify-between mb-5">
      <h2 class="font-headline font-bold text-base text-zinc-100">${order.order_number}</h2>
      <button type="button" id="modal-close-btn" class="text-zinc-500 hover:text-zinc-300 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>

    <!-- Customer -->
    <div class="mb-4 p-3 bg-zinc-800 border border-zinc-700">
      <p class="text-zinc-400 text-[11px] font-headline uppercase tracking-widest mb-1">Customer</p>
      <p class="text-zinc-100 font-body text-sm">${order.customer_name}</p>
      <p class="text-zinc-400 font-body text-xs">${order.customer_phone}</p>
      ${order.shipping_address ? `<p class="text-zinc-500 font-body text-xs mt-1">${order.shipping_address}</p>` : ''}
    </div>

    <!-- Items -->
    <div class="mb-4">
      <p class="text-zinc-400 text-[11px] font-headline uppercase tracking-widest mb-2">Items</p>
      <div class="space-y-1.5">
        ${(order.items || []).map(item => `
          <div class="flex items-center justify-between py-1.5 border-b border-zinc-800">
            <div>
              <p class="text-zinc-200 text-sm font-body">${item.name}</p>
              <p class="text-zinc-500 text-xs font-body">${item.size} · ${item.colour} · Qty ${item.qty}</p>
            </div>
            <p class="font-headline text-sm text-zinc-300">${fmtCurrency(item.price * item.qty)}</p>
          </div>
        `).join('')}
        <div class="flex justify-between pt-1">
          <span class="text-zinc-400 text-xs font-body">Total</span>
          <span class="font-headline font-bold text-zinc-100">${fmtCurrency(order.total_amount)}</span>
        </div>
      </div>
    </div>

    <!-- Current Status -->
    <div class="mb-4 flex items-center gap-2">
      <p class="text-zinc-400 text-[11px] font-headline uppercase tracking-widest">Status:</p>
      ${statusBadge(order.status)}
    </div>

    ${order.tracking_number ? `
      <div class="mb-4 p-3 bg-zinc-800 border border-zinc-700">
        <p class="text-zinc-400 text-[11px] font-headline uppercase tracking-widest mb-1">Tracking</p>
        <p class="text-zinc-300 text-sm font-body">${order.carrier_name || 'Carrier'} · ${order.tracking_number}</p>
      </div>
    ` : ''}

    <!-- Dispatch Form -->
    <div class="border-t border-zinc-800 pt-4 mt-4">
      <p class="text-zinc-400 text-[11px] font-headline uppercase tracking-widest mb-3">Update Order</p>
      <div class="space-y-3">
        <div>
          <label class="text-zinc-500 text-[11px] font-body block mb-1">New Status</label>
          <select id="modal-status" class="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm font-body px-3 py-2 focus:outline-none focus:border-zinc-500">
            <option value="">— select —</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label class="text-zinc-500 text-[11px] font-body block mb-1">Carrier</label>
          <select id="modal-carrier" class="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm font-body px-3 py-2 focus:outline-none focus:border-zinc-500">
            <option value="">— select —</option>
            <option value="BlueDart Express">BlueDart Express</option>
            <option value="Delhivery">Delhivery</option>
            <option value="DTDC">DTDC</option>
            <option value="Ekart">Ekart</option>
            <option value="India Post">India Post</option>
          </select>
        </div>
        <div>
          <label class="text-zinc-500 text-[11px] font-body block mb-1">Tracking Number</label>
          <input id="modal-tracking" type="text" placeholder="e.g. BD-889210948" class="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm font-body px-3 py-2 focus:outline-none focus:border-zinc-500 placeholder-zinc-600" />
        </div>
        <div>
          <label class="text-zinc-500 text-[11px] font-body block mb-1">Admin Notes</label>
          <textarea id="modal-notes" rows="2" placeholder="Optional internal note" class="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm font-body px-3 py-2 focus:outline-none focus:border-zinc-500 placeholder-zinc-600 resize-none"></textarea>
        </div>
        <div id="modal-msg" class="text-xs font-body hidden"></div>
        <button type="button" id="modal-save-btn" class="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-headline text-xs uppercase tracking-widest transition-colors">
          Save Changes
        </button>
        <a href="https://wa.me/919605210198?text=${encodeURIComponent(`Order ${order.order_number} — ${order.customer_name}`)}" target="_blank" rel="noopener noreferrer" class="block w-full py-2.5 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-700/40 text-emerald-400 font-headline text-xs uppercase tracking-widest text-center transition-colors">
          Open WhatsApp Order Line
        </a>
      </div>
    </div>
  `;

  function closeModal() { modal.classList.add('hidden'); }
  content.querySelector('#modal-close-btn').addEventListener('click', closeModal);
  container.querySelector('#order-modal-backdrop').addEventListener('click', closeModal);

  content.querySelector('#modal-save-btn').addEventListener('click', async () => {
    const status = content.querySelector('#modal-status').value;
    const carrierName = content.querySelector('#modal-carrier').value;
    const trackingNumber = content.querySelector('#modal-tracking').value.trim();
    const adminNotes = content.querySelector('#modal-notes').value.trim();
    const msgEl = content.querySelector('#modal-msg');

    if (!status) { msgEl.textContent = 'Please select a status.'; msgEl.className = 'text-xs font-body text-red-400'; msgEl.classList.remove('hidden'); return; }

    const payload = { status };
    if (carrierName) payload.carrierName = carrierName;
    if (trackingNumber) payload.trackingNumber = trackingNumber;
    if (adminNotes) payload.adminNotes = adminNotes;

    msgEl.textContent = 'Saving…'; msgEl.className = 'text-xs font-body text-zinc-400'; msgEl.classList.remove('hidden');
    await updateOrderStatus(order.id, payload);
    msgEl.textContent = 'Updated successfully.'; msgEl.className = 'text-xs font-body text-emerald-400';
    setTimeout(() => { closeModal(); onUpdate(); }, 800);
  });
}


// ─── Inventory Tab ────────────────────────────────────────────────────────────

async function loadInventory(container) {
  container.innerHTML = `<div class="flex items-center justify-center py-20"><div class="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div></div>`;
  const { inventory, _mock } = await getInventory();

  // Group by product name
  const grouped = {};
  inventory.forEach(v => {
    if (!grouped[v.product_name]) grouped[v.product_name] = [];
    grouped[v.product_name].push(v);
  });

  container.innerHTML = `
    ${_mock ? `<div class="mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-body">Mock data — backend offline</div>` : ''}

    <div class="space-y-6" id="inventory-groups">
      ${Object.entries(grouped).map(([productName, variants]) => `
        <div class="bg-zinc-900 border border-zinc-800">
          <div class="px-4 sm:px-5 py-3 border-b border-zinc-800 flex items-center gap-3">
            <h3 class="font-headline text-sm text-zinc-100">${productName}</h3>
            <span class="text-[10px] font-headline uppercase tracking-widest px-2 py-0.5 border ${variants[0].mode === 'sow' ? 'border-amber-700/40 text-amber-500 bg-amber-900/20' : 'border-zinc-700 text-zinc-500 bg-zinc-800'}">${variants[0].mode.toUpperCase()}</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm min-w-[520px]">
              <thead>
                <tr class="border-b border-zinc-800">
                  <th class="px-4 py-2.5 text-left text-[11px] font-headline uppercase tracking-widest text-zinc-600">SKU</th>
                  <th class="px-4 py-2.5 text-left text-[11px] font-headline uppercase tracking-widest text-zinc-600">Colour</th>
                  <th class="px-4 py-2.5 text-left text-[11px] font-headline uppercase tracking-widest text-zinc-600">Size</th>
                  <th class="px-4 py-2.5 text-left text-[11px] font-headline uppercase tracking-widest text-zinc-600">Available</th>
                  <th class="px-4 py-2.5 text-left text-[11px] font-headline uppercase tracking-widest text-zinc-600">Reserved</th>
                  <th class="px-4 py-2.5 text-left text-[11px] font-headline uppercase tracking-widest text-zinc-600">Status</th>
                  <th class="px-4 py-2.5 text-left text-[11px] font-headline uppercase tracking-widest text-zinc-600">Adjust</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800">
                ${variants.map(v => `
                  <tr class="hover:bg-zinc-800/30 transition-colors" data-variant-id="${v.variant_id}">
                    <td class="px-4 py-2.5 text-zinc-500 text-xs font-body">${v.sku}</td>
                    <td class="px-4 py-2.5 text-zinc-300 text-sm font-body">${v.colour}</td>
                    <td class="px-4 py-2.5 text-zinc-300 text-sm font-headline font-bold">${v.size}</td>
                    <td class="px-4 py-2.5 font-headline font-bold text-sm qty-display ${v.quantity_available === 0 ? 'text-red-400' : v.quantity_available <= v.low_stock_threshold ? 'text-amber-400' : 'text-zinc-100'}">${v.quantity_available}</td>
                    <td class="px-4 py-2.5 text-zinc-500 text-sm font-body">${v.quantity_reserved}</td>
                    <td class="px-4 py-2.5">${stockChip(v.quantity_available, v.low_stock_threshold)}</td>
                    <td class="px-4 py-2.5">
                      <div class="flex items-center gap-1">
                        <button type="button" data-action="dec" data-variant-id="${v.variant_id}" class="inv-btn w-7 h-7 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-headline text-base flex items-center justify-center transition-colors leading-none">−</button>
                        <button type="button" data-action="inc" data-variant-id="${v.variant_id}" class="inv-btn w-7 h-7 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-headline text-base flex items-center justify-center transition-colors leading-none">+</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Build a live qty map for optimistic updates
  const qtyMap = {};
  inventory.forEach(v => { qtyMap[v.variant_id] = { qty: v.quantity_available, threshold: v.low_stock_threshold }; });

  container.querySelectorAll('.inv-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const variantId = btn.dataset.variantId;
      const action = btn.dataset.action;
      const entry = qtyMap[variantId];
      if (!entry) return;

      const newQty = action === 'inc' ? entry.qty + 1 : Math.max(0, entry.qty - 1);
      entry.qty = newQty;

      // Optimistic UI update
      const row = container.querySelector(`tr[data-variant-id="${variantId}"]`);
      if (row) {
        const qtyEl = row.querySelector('.qty-display');
        if (qtyEl) {
          qtyEl.textContent = newQty;
          qtyEl.className = `px-4 py-2.5 font-headline font-bold text-sm qty-display ${newQty === 0 ? 'text-red-400' : newQty <= entry.threshold ? 'text-amber-400' : 'text-zinc-100'}`;
        }
        const chipCell = row.querySelector('td:nth-child(6)');
        if (chipCell) chipCell.innerHTML = stockChip(newQty, entry.threshold);
      }

      await updateInventory(variantId, { quantityAvailable: newQty });
    });
  });
}

// ─── Main Render Export ───────────────────────────────────────────────────────

export function render(container) {
  if (_clockInterval) { clearInterval(_clockInterval); _clockInterval = null; }

  if (sessionStorage.getItem(SESSION_KEY) === '1') {
    renderShell(container);
  } else {
    renderPinGate(container, () => renderShell(container));
  }
}

export default { render };
