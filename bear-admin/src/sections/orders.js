import { getOrders, updateOrderStatus, bulkUpdateOrderStatus } from '../services/adminService.js';
import { fmtCurrency, fmtDate, statusBadge, timeAgo, spinner, openModal, showToast } from '../helpers.js';
import { getIcon } from '../utils/icons.js';

const STATUSES = ['all', 'pending_whatsapp', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export async function renderOrders(container, initialStatus = 'all') {
  container.innerHTML = spinner();
  const { orders = [], _error } = await getOrders('all');

  if (_error) {
    container.innerHTML = `
      <div style="padding:40px;text-align:center;background:#18181b;border:1px solid #27272a;">
        <span style="font-size:36px;color:#f87171;margin-bottom:12px;display:flex;justify-content:center;">${getIcon('orders')}</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#f4f4f5;margin-bottom:6px;">Error Loading Orders</p>
        <p style="font-size:12px;color:#71717a;margin-bottom:20px;">${_error}</p>
        <button id="order-retry-btn" class="admin-btn primary">Retry</button>
      </div>
    `;
    container.querySelector('#order-retry-btn')?.addEventListener('click', () => renderOrders(container, initialStatus));
    return;
  }

  // State management for Search, Sort, Filter, and Select All
  let currentStatus = initialStatus;
  let searchQuery = '';
  let sortBy = 'newest';
  const selectedIds = new Set();

  function getFilteredAndSorted() {
    return orders
      .filter(o => {
        if (currentStatus !== 'all' && o.status !== currentStatus) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchNum = (o.orderNumber || '').toLowerCase().includes(q);
          const matchName = (o.customerName || '').toLowerCase().includes(q);
          const matchPhone = (o.customerPhone || '').toLowerCase().includes(q);
          const matchAddr = (o.shippingAddress || '').toLowerCase().includes(q);
          const matchNotes = (o.adminNotes || '').toLowerCase().includes(q);
          const matchCity = (o.deliveryCity || '').toLowerCase().includes(q);
          if (!matchNum && !matchName && !matchPhone && !matchAddr && !matchNotes && !matchCity) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        if (sortBy === 'amount_desc') return (b.totalAmount || 0) - (a.totalAmount || 0);
        if (sortBy === 'amount_asc') return (a.totalAmount || 0) - (b.totalAmount || 0);
        if (sortBy === 'order_num') return (b.orderNumber || '').localeCompare(a.orderNumber || '');
        if (sortBy === 'customer_asc') return (a.customerName || '').localeCompare(b.customerName || '');
        return 0;
      });
  }

  function exportOrdersToCsv(selectedOrders) {
    const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'Email', 'Status', 'Total (INR)', 'Items'];
    const rows = selectedOrders.map(o => {
      const itemsSummary = (o.items || []).map(i => `${i.name || 'Item'} (${i.size}/${i.colour}) x${i.qty}`).join('; ');
      return [
        `"${o.orderNumber || ''}"`,
        `"${new Date(o.createdAt).toLocaleString('en-IN')}"`,
        `"${(o.customerName || '').replace(/"/g, '""')}"`,
        `"${o.customerPhone || ''}"`,
        `"${o.customerEmail || ''}"`,
        `"${o.status || ''}"`,
        o.totalAmount || 0,
        `"${itemsSummary.replace(/"/g, '""')}"`
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bear_orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function renderView() {
    const displayed = getFilteredAndSorted();
    const allVisibleSelected = displayed.length > 0 && displayed.every(o => selectedIds.has(o.id));

    // Status counts for pills
    const counts = {};
    STATUSES.forEach(s => {
      counts[s] = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
    });

    container.innerHTML = `
      <!-- Header -->
      <div class="section-header" style="flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div>
          <p class="section-title">Orders Management</p>
          <p class="section-subtitle">${orders.length} total orders · ${displayed.length} shown in view</p>
        </div>
      </div>

      <!-- Controls Bar: Search, Sort & Reset -->
      <div style="background:#111113;border:1px solid #27272a;border-radius:6px;padding:12px 14px;margin-bottom:14px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;">
        
        <!-- Live Search Input -->
        <div style="position:relative;flex:1;min-width:240px;max-width:380px;">
          <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#71717a;display:flex;align-items:center;pointer-events:none;">
            ${getIcon('search')}
          </span>
          <input 
            id="order-search-input" 
            class="admin-input" 
            type="text" 
            placeholder="Search by order #, customer name, phone, city..." 
            value="${searchQuery}" 
            style="padding-left:34px;padding-right:28px;width:100%;height:36px;font-size:12px;" 
          />
          ${searchQuery ? `
            <button id="clear-order-search-btn" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:#a1a1aa;cursor:pointer;padding:2px;display:flex;align-items:center;">
              ${getIcon('close')}
            </button>
          ` : ''}
        </div>

        <!-- Sort Dropdown -->
        <div style="display:flex;gap:8px;align-items:center;">
          <select id="sort-orders" class="admin-select" style="height:36px;font-size:11px;padding:0 8px;">
            <option value="newest" ${sortBy === 'newest' ? 'selected' : ''}>Sort: Newest First</option>
            <option value="oldest" ${sortBy === 'oldest' ? 'selected' : ''}>Sort: Oldest First</option>
            <option value="amount_desc" ${sortBy === 'amount_desc' ? 'selected' : ''}>Amount: High → Low</option>
            <option value="amount_asc" ${sortBy === 'amount_asc' ? 'selected' : ''}>Amount: Low → High</option>
            <option value="order_num" ${sortBy === 'order_num' ? 'selected' : ''}>Order # (Recent)</option>
            <option value="customer_asc" ${sortBy === 'customer_asc' ? 'selected' : ''}>Customer Name: A → Z</option>
          </select>

          ${(searchQuery || sortBy !== 'newest' || currentStatus !== 'all') ? `
            <button id="reset-order-filters-btn" class="admin-btn" style="height:36px;padding:0 10px;font-size:11px;" title="Reset filters">
              Reset
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Status Filter Tabs with Counts -->
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">
        ${STATUSES.map(s => {
          const isActive = s === currentStatus;
          const count = counts[s] || 0;
          return `
            <button type="button" data-status="${s}" class="admin-btn order-filter-btn ${isActive ? 'primary' : ''}" style="padding:5px 12px;font-size:10px;display:flex;align-items:center;gap:6px;">
              <span>${s.replace(/_/g, ' ')}</span>
              <span style="background:${isActive ? 'rgba(255,255,255,0.2)' : '#27272a'};color:${isActive ? '#fff' : '#a1a1aa'};padding:1px 5px;border-radius:10px;font-size:9px;font-family:'Space Grotesk',sans-serif;">${count}</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Sticky Batch Action Bar (when orders are selected) -->
      ${selectedIds.size > 0 ? `
        <div style="background:#18181b;border:1px solid #3b82f6;border-radius:6px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;animation:fadeIn 0.15s ease-in-out;">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:700;color:#93c5fd;display:flex;align-items:center;gap:6px;">
              ${getIcon('check')}
              <span>${selectedIds.size} order${selectedIds.size > 1 ? 's' : ''} selected</span>
            </span>
            <button id="batch-clear-orders-btn" class="admin-btn" style="padding:3px 8px;font-size:10px;color:#a1a1aa;">
              Deselect All
            </button>
          </div>

          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <!-- Bulk Status Selector -->
            <div style="display:flex;align-items:center;gap:4px;">
              <select id="bulk-status-select" class="admin-select" style="height:32px;font-size:10px;padding:0 6px;">
                <option value="">— Move Selected To —</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button id="apply-bulk-status-btn" class="admin-btn primary" style="padding:4px 10px;font-size:10px;">
                Apply
              </button>
            </div>

            <!-- Export CSV -->
            <button id="export-selected-csv-btn" class="admin-btn" style="padding:5px 10px;font-size:10px;display:flex;align-items:center;gap:4px;" title="Export selected orders to CSV">
              ${getIcon('download')}
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Orders Data Table -->
      <div class="card" style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <!-- Master Select All Checkbox -->
              <th style="width:38px;padding:10px 8px 10px 14px;">
                <input 
                  type="checkbox" 
                  id="select-all-orders-checkbox" 
                  ${allVisibleSelected ? 'checked' : ''} 
                  style="cursor:pointer;accent-color:#3b82f6;width:15px;height:15px;" 
                  title="Select all ${displayed.length} visible orders" 
                />
              </th>
              <th class="order-sortable-header" data-sort="order_num" style="cursor:pointer;" title="Sort by Order #">
                <span style="display:inline-flex;align-items:center;gap:4px;">
                  <span>Order #</span>
                  ${sortBy === 'order_num' ? getIcon('chevronDown') : getIcon('arrowUpDown')}
                </span>
              </th>
              <th class="order-sortable-header" data-sort="customer_asc" style="cursor:pointer;" title="Sort by Customer Name">
                <span style="display:inline-flex;align-items:center;gap:4px;">
                  <span>Customer</span>
                  ${sortBy === 'customer_asc' ? getIcon('chevronUp') : getIcon('arrowUpDown')}
                </span>
              </th>
              <th>Status</th>
              <th class="order-sortable-header" data-sort="amount" style="cursor:pointer;" title="Sort by Total Amount">
                <span style="display:inline-flex;align-items:center;gap:4px;">
                  <span>Total Amount</span>
                  ${sortBy === 'amount_desc' ? getIcon('chevronDown') : sortBy === 'amount_asc' ? getIcon('chevronUp') : getIcon('arrowUpDown')}
                </span>
              </th>
              <th class="order-sortable-header" data-sort="newest" style="cursor:pointer;" title="Sort by Date Placed">
                <span style="display:inline-flex;align-items:center;gap:4px;">
                  <span>Placed</span>
                  ${sortBy === 'newest' ? getIcon('chevronDown') : sortBy === 'oldest' ? getIcon('chevronUp') : ''}
                </span>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${displayed.length === 0 ? `
              <tr>
                <td colspan="7" style="text-align:center;color:#71717a;padding:40px 16px;">
                  <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                    <span style="color:#52525b;">${getIcon('orders')}</span>
                    <p style="font-size:13px;color:#a1a1aa;font-weight:500;">No orders found matching your criteria.</p>
                  </div>
                </td>
              </tr>
            ` : displayed.map(o => {
              const isSelected = selectedIds.has(o.id);
              return `
              <tr style="${isSelected ? 'background:rgba(59,130,246,0.06);' : ''}">
                <td style="width:38px;padding:11px 8px 11px 14px;">
                  <input 
                    type="checkbox" 
                    class="order-row-checkbox" 
                    data-id="${o.id}" 
                    ${isSelected ? 'checked' : ''} 
                    style="cursor:pointer;accent-color:#3b82f6;width:15px;height:15px;" 
                  />
                </td>
                <td style="font-family:'Space Grotesk',sans-serif;font-size:12px;color:#a1a1aa;font-weight:600;">
                  ${o.orderNumber}
                </td>
                <td>
                  <p style="color:#e4e4e7;font-weight:500;">${o.customerName}</p>
                  <p style="font-size:11px;color:#71717a;">${o.customerPhone}</p>
                </td>
                <td>
                  ${statusBadge(o.status)}
                  ${o.adminNotes && o.adminNotes.includes('[CANCELLATION REQUESTED]')
                    ? `<div style="display:inline-block;padding:2px 6px;border-radius:3px;font-size:9px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;background:#451a1a;color:#f87171;border:1px solid #7f1d1d;margin-top:4px;">Cancellation Requested</div>`
                    : ''}
                </td>
                <td style="font-family:'Space Grotesk',sans-serif;font-weight:600;color:#f4f4f5;">
                  ${fmtCurrency(o.totalAmount)}
                </td>
                <td style="color:#71717a;font-size:12px;">${timeAgo(o.createdAt)}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <button class="admin-btn order-view-btn" data-id="${o.id}" style="padding:4px 10px;font-size:10px;">View & Update</button>
                    <a href="https://wa.me/91${o.customerPhone}?text=${encodeURIComponent(`Hi ${o.customerName}, regarding your BEAR order ${o.orderNumber}`)}" target="_blank" rel="noopener noreferrer" class="admin-btn" style="padding:4px 8px;font-size:10px;color:#34d399;text-decoration:none;" title="Chat on WhatsApp">WA</a>
                  </div>
                </td>
              </tr>
            `;}).join('')}
          </tbody>
        </table>
      </div>
    `;

    // ── Bind Event Listeners ──────────────────────────────────────────────────
    
    // Live Search
    const searchInput = container.querySelector('#order-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderView();
        const updatedInput = container.querySelector('#order-search-input');
        if (updatedInput) {
          updatedInput.focus();
          updatedInput.setSelectionRange(updatedInput.value.length, updatedInput.value.length);
        }
      });
    }

    container.querySelector('#clear-order-search-btn')?.addEventListener('click', () => {
      searchQuery = '';
      renderView();
    });

    // Sort Dropdown
    container.querySelector('#sort-orders')?.addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderView();
    });

    // Reset Button
    container.querySelector('#reset-order-filters-btn')?.addEventListener('click', () => {
      searchQuery = '';
      currentStatus = 'all';
      sortBy = 'newest';
      renderView();
    });

    // Status Filter Tabs
    container.querySelectorAll('.order-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentStatus = btn.dataset.status;
        renderView();
      });
    });

    // Clickable table header sorting
    container.querySelectorAll('.order-sortable-header').forEach(th => {
      th.addEventListener('click', () => {
        const type = th.dataset.sort;
        if (type === 'amount') {
          sortBy = sortBy === 'amount_desc' ? 'amount_asc' : 'amount_desc';
        } else if (type === 'order_num') {
          sortBy = sortBy === 'order_num' ? 'newest' : 'order_num';
        } else if (type === 'customer_asc') {
          sortBy = sortBy === 'customer_asc' ? 'newest' : 'customer_asc';
        } else if (type === 'newest') {
          sortBy = sortBy === 'newest' ? 'oldest' : 'newest';
        }
        renderView();
      });
    });

    // Master Select All Checkbox
    container.querySelector('#select-all-orders-checkbox')?.addEventListener('change', (e) => {
      const checked = e.target.checked;
      displayed.forEach(o => {
        if (checked) selectedIds.add(o.id);
        else selectedIds.delete(o.id);
      });
      renderView();
    });

    // Row Checkboxes
    container.querySelectorAll('.order-row-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = cb.dataset.id;
        if (e.target.checked) selectedIds.add(id);
        else selectedIds.delete(id);
        renderView();
      });
    });

    // Batch Actions
    container.querySelector('#batch-clear-orders-btn')?.addEventListener('click', () => {
      selectedIds.clear();
      renderView();
    });

    container.querySelector('#apply-bulk-status-btn')?.addEventListener('click', async () => {
      const newStatus = container.querySelector('#bulk-status-select')?.value;
      if (!newStatus) {
        showToast('Please select a target status first', 'error');
        return;
      }
      const ids = Array.from(selectedIds);
      if (confirm(`Update status of ${ids.length} order(s) to "${newStatus}"?`)) {
        try {
          await bulkUpdateOrderStatus(ids, newStatus, 'Bulk status update via admin console');
          showToast(`Updated ${ids.length} order(s) to ${newStatus}.`);
          selectedIds.clear();
          renderOrders(container, currentStatus);
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });

    container.querySelector('#export-selected-csv-btn')?.addEventListener('click', () => {
      const selectedOrders = orders.filter(o => selectedIds.has(o.id));
      exportOrdersToCsv(selectedOrders);
      showToast(`Exported ${selectedOrders.length} order(s) to CSV.`);
    });

    // View & Update Modal
    container.querySelectorAll('.order-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const order = orders.find(x => x.id === btn.dataset.id);
        if (order) openOrderModal(order, () => renderOrders(container, currentStatus));
      });
    });
  }

  // Initial render
  renderView();
}

function openOrderModal(order, onUpdate) {
  const { overlay, close } = openModal(`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <div>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;color:#f4f4f5;">Order ${order.orderNumber}</p>
        <p style="font-size:11px;color:#71717a;margin-top:2px;">Placed ${fmtDate(order.createdAt)}</p>
      </div>
      <button id="modal-close" class="admin-btn" style="padding:4px 8px;font-size:11px;">✕</button>
    </div>

    <!-- Customer Information -->
    ${order.adminNotes && order.adminNotes.includes('[CANCELLATION REQUESTED]') ? `
      <div style="background:#2a1215;border:1px solid #ef4444;padding:12px 14px;margin-bottom:14px;border-radius:4px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <p style="color:#f87171;font-weight:700;font-size:11px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.05em;text-transform:uppercase;">
            ⚠️ Customer Requested Cancellation via WhatsApp
          </p>
          <a href="https://wa.me/91${order.customerPhone}?text=${encodeURIComponent(`Hi ${order.customerName}, regarding your cancellation request for BEAR order ${order.orderNumber}`)}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:#34d399;font-weight:600;text-decoration:none;">
            Chat on WhatsApp ↗
          </a>
        </div>
        <p style="color:#fca5a5;font-size:12px;line-height:1.4;">${order.adminNotes.split('\n')[0]}</p>
      </div>
    ` : ''}
    <div style="background:#111113;border:1px solid #27272a;padding:14px;margin-bottom:14px;">
      <p style="font-size:10px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.08em;text-transform:uppercase;color:#52525b;margin-bottom:6px;">Delivery Details</p>
      <p style="color:#e4e4e7;font-size:13px;font-weight:600;">${order.customerName}</p>
      <p style="color:#71717a;font-size:12px;">+91 ${order.customerPhone} ${order.customerEmail ? '· ' + order.customerEmail : ''}</p>
      <p style="color:#a1a1aa;font-size:12px;margin-top:4px;">${order.shippingAddress || 'India'}</p>
    </div>

    <!-- Ordered Items -->
    <div style="margin-bottom:14px;">
      <p style="font-size:10px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.08em;text-transform:uppercase;color:#52525b;margin-bottom:8px;">Order Items</p>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${(order.items || []).map(item => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1f1f22;">
            <div>
              <p style="color:#d4d4d8;font-size:13px;font-weight:500;">${item.name}</p>
              <p style="color:#71717a;font-size:11px;">Size ${item.size} · ${item.colour} · Qty ${item.qty}</p>
            </div>
            <p style="font-family:'Space Grotesk',sans-serif;font-weight:600;color:#f4f4f5;">${fmtCurrency(item.price * item.qty)}</p>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;padding-top:10px;">
        <span style="color:#71717a;font-size:12px;">Grand Total</span>
        <span style="font-family:'Space Grotesk',sans-serif;font-weight:700;color:#f4f4f5;font-size:15px;">${fmtCurrency(order.totalAmount)}</span>
      </div>
    </div>

    <form id="order-update-form" style="border-top:1px solid #27272a;padding-top:16px;">
      <p style="font-size:10px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.08em;text-transform:uppercase;color:#52525b;margin-bottom:12px;">Update Order & Fulfillment</p>

      <div style="display:flex;flex-direction:column;gap:10px;">
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;text-transform:uppercase;">Status Transition</label>
          <select id="m-status" class="admin-select">
            <option value="pending_whatsapp" ${order.status === 'pending_whatsapp' ? 'selected' : ''}>Pending WhatsApp Verification</option>
            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>

        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;text-transform:uppercase;">Courier Carrier</label>
          <select id="m-carrier" class="admin-select">
            <option value="">— Unassigned —</option>
            <option value="Express Air Cargo" ${order.carrierName?.includes('Express') ? 'selected' : ''}>Express Air Cargo</option>
            <option value="Shiprocket" ${order.carrierName?.includes('Shiprocket') ? 'selected' : ''}>Shiprocket</option>
            <option value="Delhivery" ${order.carrierName?.includes('Delhivery') ? 'selected' : ''}>Delhivery Express</option>
            <option value="BlueDart Express" ${order.carrierName?.includes('BlueDart') ? 'selected' : ''}>BlueDart Express Air</option>
            <option value="DTDC" ${order.carrierName?.includes('DTDC') ? 'selected' : ''}>DTDC Express</option>
            <option value="Shadowfax" ${order.carrierName?.includes('Shadowfax') ? 'selected' : ''}>Shadowfax Air</option>
            <option value="India Post" ${order.carrierName?.includes('Post') ? 'selected' : ''}>India Post Speed Post</option>
          </select>
        </div>

        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;text-transform:uppercase;">Tracking ID / AWB Number</label>
          <input id="m-tracking" type="text" class="admin-input" placeholder="e.g. AWB-889210948" value="${order.trackingNumber || ''}" />
        </div>

        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;text-transform:uppercase;">Tracking URL (Optional)</label>
          <input id="m-tracking-url" type="url" class="admin-input" placeholder="https://..." value="${order.trackingUrl || ''}" />
        </div>

        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;text-transform:uppercase;">Admin Internal Notes</label>
          <textarea id="m-notes" class="admin-input" rows="2" style="resize:none;" placeholder="Notes regarding customer or fulfillment...">${order.adminNotes || ''}</textarea>
        </div>

        <button type="submit" id="m-save-btn" class="admin-btn primary" style="justify-content:center;padding:10px;margin-top:6px;">
          Save Order Changes
        </button>
      </div>
    </form>
  `);

  overlay.querySelector('#modal-close').addEventListener('click', close);

  overlay.querySelector('#order-update-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = overlay.querySelector('#m-save-btn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const status = overlay.querySelector('#m-status').value;
    const carrierName = overlay.querySelector('#m-carrier').value.trim() || null;
    const trackingNumber = overlay.querySelector('#m-tracking').value.trim() || null;
    let trackingUrl = overlay.querySelector('#m-tracking-url').value.trim() || null;
    const adminNotes = overlay.querySelector('#m-notes').value.trim() || null;

    try {
      await updateOrderStatus(order.id, {
        status,
        carrierName,
        trackingNumber,
        trackingUrl,
        adminNotes,
      });
      showToast(`Order ${order.orderNumber} updated successfully.`);
      close();
      onUpdate();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Save Order Changes';
    }
  });
}
