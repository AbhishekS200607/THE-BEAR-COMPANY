import {
  getFulfillment,
  assignFulfillmentStaff,
  bulkUpdateFulfillmentStatus,
  updatePackingChecklist,
  toggleOrderUrgent,
  getOrderTimeline,
  openBatchPackingSlips,
} from '../services/adminService.js';
import { getIcon } from '../utils/icons.js';

/**
 * BEAR Admin — Warehouse Fulfillment Centre Cockpit (Milestone 2)
 * Pure SVG icons only, zero external fonts.
 */
export async function renderFulfillment(container) {
  let activeTab = 'processing';
  let searchQuery = '';
  let activeStaffFilter = '';
  let activeCourierFilter = '';
  let selectedOrderIds = new Set();
  let currentData = { orders: [], tabCounts: {}, staffMembers: [] };
  let activeDrawerOrder = null;
  let isLoading = false;

  container.innerHTML = `
    <div class="fulfillment-section flex flex-col gap-6" style="padding: 24px; color: #f4f4f5;">
      
      <!-- Top Title & Search Toolbar -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase; margin: 0; color: #fff;">
              Fulfillment Centre
            </h1>
            <span style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; background: #27272a; color: #a1a1aa; font-weight: 700; text-transform: uppercase;">
              Warehouse Ops
            </span>
          </div>
          <p style="font-size: 12px; color: #71717a; margin: 4px 0 0 0;">
            Real-time pick/pack checklists, staff assignment, and express dispatch pipeline.
          </p>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <div style="position: relative; flex: 1; min-width: 260px;">
            <span style="position: absolute; left: 10px; top: 9px; color: #71717a; display: flex; align-items: center;">
              ${getIcon('search')}
            </span>
            <input 
              type="text" 
              id="fc-search-input" 
              placeholder="Search Order #, Customer, Phone, AWB, SKU..." 
              style="width: 100%; box-sizing: border-box; padding: 8px 12px 8px 34px; background: #141416; border: 1px solid #27272a; border-radius: 8px; font-size: 12px; color: #fff; outline: none;"
            />
          </div>

          <button id="fc-refresh-btn" style="display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: #18181b; border: 1px solid #27272a; border-radius: 8px; color: #d4d4d8; font-size: 12px; font-weight: 700; cursor: pointer;">
            ${getIcon('refresh')}
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <!-- Pipeline Tabs -->
      <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; border-bottom: 1px solid #27272a;" id="fc-tabs-container">
        <!-- Rendered dynamically -->
      </div>

      <!-- Batch Action Toolbar (Visible when 1+ rows selected) -->
      <div id="fc-batch-bar" style="display: none; align-items: center; justify-between: space-between; padding: 10px 16px; background: #18181b; border: 1px solid #3f3f46; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #fff;">
          <span style="display: flex;">${getIcon('layers')}</span>
          <span id="fc-selected-count">0 orders selected</span>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <!-- Assign Staff -->
          <select id="fc-batch-staff-select" style="padding: 6px 10px; background: #09090b; border: 1px solid #3f3f46; border-radius: 6px; color: #fff; font-size: 11px; font-weight: 600; cursor: pointer;">
            <option value="">Assign Specialist...</option>
          </select>

          <!-- Status Transition -->
          <button id="fc-batch-processing-btn" style="padding: 6px 12px; background: #27272a; border: 1px solid #3f3f46; border-radius: 6px; color: #fff; font-size: 11px; font-weight: 700; cursor: pointer;">
            Mark Processing
          </button>
          <button id="fc-batch-ready-btn" style="padding: 6px 12px; background: #0284c7; border: 1px solid #38bdf8; border-radius: 6px; color: #fff; font-size: 11px; font-weight: 700; cursor: pointer;">
            Mark Ready to Ship
          </button>

          <!-- Print Slips -->
          <button id="fc-batch-print-btn" style="display: flex; align-items: center; gap: 4px; padding: 6px 14px; background: #fff; border: none; border-radius: 6px; color: #000; font-size: 11px; font-weight: 800; cursor: pointer;">
            ${getIcon('print')}
            <span>Print Slips</span>
          </button>
        </div>
      </div>

      <!-- Main Orders Table -->
      <div style="background: #141416; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;" id="fc-table-card">
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px;">
            <thead>
              <tr style="background: #09090b; border-bottom: 1px solid #27272a; color: #71717a; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                <th style="padding: 12px 14px; width: 40px; text-align: center;">
                  <input type="checkbox" id="fc-select-all-cb" style="accent-color: #fff; cursor: pointer;" />
                </th>
                <th style="padding: 12px 14px;">Order / Priority</th>
                <th style="padding: 12px 14px;">Customer &amp; Location</th>
                <th style="padding: 12px 14px;">Items &amp; Packing Status</th>
                <th style="padding: 12px 14px;">Assigned Specialist</th>
                <th style="padding: 12px 14px;">Logistics / AWB</th>
                <th style="padding: 12px 14px;">Pipeline State</th>
                <th style="padding: 12px 14px; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="fc-orders-tbody">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>

        <!-- Empty / Loading State Container -->
        <div id="fc-state-container" style="padding: 40px; text-align: center; display: none;"></div>
      </div>

    </div>

    <!-- Slide-over Order Fulfillment Drawer -->
    <div id="fc-drawer-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(2px); z-index: 50; display: none;">
      <div id="fc-drawer-content" style="position: absolute; right: 0; top: 0; bottom: 0; width: 100%; max-width: 540px; background: #111113; border-left: 1px solid #27272a; display: flex; flex-direction: column; box-shadow: -10px 0 30px rgba(0,0,0,0.5); overflow-y: auto;">
        <!-- Drawer populated on open -->
      </div>
    </div>
  `;

  // Select DOM Elements
  const tabsContainer = container.querySelector('#fc-tabs-container');
  const searchInput = container.querySelector('#fc-search-input');
  const refreshBtn = container.querySelector('#fc-refresh-btn');
  const batchBar = container.querySelector('#fc-batch-bar');
  const selectedCountEl = container.querySelector('#fc-selected-count');
  const batchStaffSelect = container.querySelector('#fc-batch-staff-select');
  const batchProcessingBtn = container.querySelector('#fc-batch-processing-btn');
  const batchReadyBtn = container.querySelector('#fc-batch-ready-btn');
  const batchPrintBtn = container.querySelector('#fc-batch-print-btn');
  const selectAllCb = container.querySelector('#fc-select-all-cb');
  const tbody = container.querySelector('#fc-orders-tbody');
  const stateContainer = container.querySelector('#fc-state-container');
  const drawerBackdrop = container.querySelector('#fc-drawer-backdrop');
  const drawerContent = container.querySelector('#fc-drawer-content');

  function renderTabs() {
    const counts = currentData.tabCounts || {};
    const tabs = [
      { key: 'urgent', label: 'Urgent & Alerts', count: counts.urgent || 0, icon: 'alertTriangle', color: '#ef4444' },
      { key: 'processing', label: 'Processing & Pick', count: counts.processing || 0, icon: 'clock', color: '#eab308' },
      { key: 'ready_to_ship', label: 'Ready to Ship', count: counts.ready_to_ship || 0, icon: 'checkCircle', color: '#3b82f6' },
      { key: 'shipped', label: 'Dispatched', count: counts.shipped || 0, icon: 'shipping', color: '#10b981' },
      { key: 'exceptions', label: 'Exceptions', count: counts.exceptions || 0, icon: 'alertTriangle', color: '#f97316' },
      { key: 'all', label: 'All Orders', count: counts.all || 0, icon: 'orders', color: '#a1a1aa' },
    ];

    tabsContainer.innerHTML = tabs.map((t) => {
      const isActive = activeTab === t.key;
      return `
        <button 
          class="fc-tab-btn" 
          data-tab="${t.key}" 
          style="display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: all 0.15s; border: none; white-space: nowrap; ${
            isActive 
              ? 'background: #27272a; color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.3);' 
              : 'background: transparent; color: #71717a; hover:color: #d4d4d8;'
          }"
        >
          <span style="display: flex; color: ${t.color};">${getIcon(t.icon)}</span>
          <span>${t.label}</span>
          <span style="font-size: 10px; padding: 1px 6px; border-radius: 9999px; font-weight: 800; font-family: monospace; ${
            isActive ? 'background: #3f3f46; color: #fff;' : 'background: #18181b; color: #71717a;'
          }">${t.count}</span>
        </button>
      `;
    }).join('');

    tabsContainer.querySelectorAll('.fc-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        selectedOrderIds.clear();
        updateBatchBar();
        renderTabs();
        loadOrders();
      });
    });
  }

  function updateBatchBar() {
    const count = selectedOrderIds.size;
    if (count > 0) {
      batchBar.style.display = 'flex';
      selectedCountEl.textContent = `${count} order${count > 1 ? 's' : ''} selected`;
    } else {
      batchBar.style.display = 'none';
    }
  }

  function populateStaffDropdowns() {
    const staff = currentData.staffMembers || [];
    batchStaffSelect.innerHTML = `
      <option value="">Assign Specialist...</option>
      <option value="__unassign__">Unassign Specialist</option>
      ${staff.map((s) => `<option value="${s.id}">${s.full_name} (${s.role})</option>`).join('')}
    `;
  }

  async function loadOrders() {
    isLoading = true;
    tbody.innerHTML = '';
    stateContainer.style.display = 'block';
    stateContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
        <span style="display: flex; animation: spin 1s linear infinite; color: #71717a;">${getIcon('refresh')}</span>
        <p style="font-size: 12px; color: #71717a; margin: 0;">Loading warehouse pipeline...</p>
      </div>
    `;

    try {
      const res = await getFulfillment({
        tab: activeTab,
        search: searchQuery,
        staffId: activeStaffFilter,
        courier: activeCourierFilter,
      });

      currentData = res || { orders: [], tabCounts: {}, staffMembers: [] };
      renderTabs();
      populateStaffDropdowns();

      const orders = currentData.orders || [];

      if (orders.length === 0) {
        stateContainer.style.display = 'block';
        stateContainer.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
            <span style="display: flex; color: #52525b;">${getIcon('checkCircle')}</span>
            <p style="font-size: 13px; font-weight: 700; color: #d4d4d8; margin: 0;">Pipeline Clear</p>
            <p style="font-size: 11px; color: #71717a; margin: 0;">No orders matching active filters in ${activeTab.replace('_', ' ')}.</p>
          </div>
        `;
        return;
      }

      stateContainer.style.display = 'none';
      renderOrderRows(orders);
    } catch (err) {
      stateContainer.style.display = 'block';
      stateContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
          <span style="display: flex; color: #ef4444;">${getIcon('alertTriangle')}</span>
          <p style="font-size: 13px; font-weight: 700; color: #fca5a5; margin: 0;">Failed to load fulfillment data</p>
          <p style="font-size: 11px; color: #71717a; margin: 0;">${err.message || 'Please check your connection and retry.'}</p>
        </div>
      `;
    } finally {
      isLoading = false;
    }
  }

  function renderOrderRows(orders) {
    tbody.innerHTML = orders.map((o) => {
      const isSelected = selectedOrderIds.has(o.id);
      const isPacked = o.packingStatus === 'packed';
      const isPartiallyPacked = o.packingStatus === 'partially_packed';

      return `
        <tr style="border-bottom: 1px solid #1f1f23; transition: background 0.1s; ${isSelected ? 'background: #18181b;' : ''}" class="hover:bg-zinc-900/40">
          
          <!-- Select Checkbox -->
          <td style="padding: 12px 14px; text-align: center;">
            <input type="checkbox" class="fc-row-cb" data-id="${o.id}" ${isSelected ? 'checked' : ''} style="accent-color: #fff; cursor: pointer;" />
          </td>

          <!-- Order Reference & Urgent Flag -->
          <td style="padding: 12px 14px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-weight: 800; font-family: monospace; color: #fff;">${o.orderNumber}</span>
              <button 
                class="fc-urgent-toggle-btn" 
                data-id="${o.id}" 
                data-urgent="${o.isUrgent}"
                title="${o.isUrgent ? 'Urgent Priority Drop (Click to remove)' : 'Mark as Urgent Drop'}" 
                style="background: transparent; border: none; cursor: pointer; display: flex; padding: 2px; color: ${o.isUrgent ? '#ef4444' : '#3f3f46'};"
              >
                ${getIcon(o.isUrgent ? 'flame' : 'alertTriangle')}
              </button>
            </div>
            <div style="font-size: 10px; color: #71717a; margin-top: 2px;">
              ${new Date(o.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </td>

          <!-- Customer & Location -->
          <td style="padding: 12px 14px;">
            <div style="font-weight: 700; color: #e4e4e7;">${o.customerName}</div>
            <div style="font-size: 11px; color: #71717a; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${o.shippingAddress || 'Address on file'}
            </div>
          </td>

          <!-- Items & Packing Status -->
          <td style="padding: 12px 14px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="font-size: 11px; font-weight: 800; color: ${isPacked ? '#10b981' : isPartiallyPacked ? '#eab308' : '#71717a'};">
                ${o.packedCount} / ${o.totalItems} Packed
              </span>
              <span style="font-size: 9px; padding: 1px 6px; border-radius: 4px; font-weight: 800; text-transform: uppercase; ${
                isPacked 
                  ? 'background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);' 
                  : isPartiallyPacked 
                    ? 'background: rgba(234, 179, 8, 0.15); color: #fde047; border: 1px solid rgba(234, 179, 8, 0.3);'
                    : 'background: #18181b; color: #71717a; border: 1px solid #27272a;'
              }">
                ${o.packingStatus.replace('_', ' ')}
              </span>
            </div>
            <div style="width: 100px; height: 4px; background: #27272a; border-radius: 9999px; overflow: hidden;">
              <div style="width: ${o.totalItems > 0 ? (o.packedCount / o.totalItems) * 100 : 0}%; height: 100%; background: ${isPacked ? '#10b981' : '#eab308'}; border-radius: 9999px;"></div>
            </div>
          </td>

          <!-- Assigned Specialist -->
          <td style="padding: 12px 14px;">
            ${o.assignedStaffName ? `
              <div style="display: flex; align-items: center; gap: 4px; color: #d4d4d8; font-weight: 600;">
                <span style="display: flex; color: #38bdf8;">${getIcon('userCheck')}</span>
                <span>${o.assignedStaffName}</span>
              </div>
            ` : `
              <span style="color: #52525b; font-style: italic;">Unassigned</span>
            `}
          </td>

          <!-- Logistics & AWB -->
          <td style="padding: 12px 14px;">
            <div style="font-weight: 600; color: #d4d4d8;">${o.carrierName}</div>
            ${o.trackingNumber ? `
              <div style="font-size: 10px; font-family: monospace; color: #38bdf8;">${o.trackingNumber}</div>
            ` : `
              <div style="font-size: 10px; color: #52525b;">AWB Pending</div>
            `}
          </td>

          <!-- Pipeline State -->
          <td style="padding: 12px 14px;">
            <span style="font-size: 10px; padding: 2px 8px; border-radius: 6px; font-weight: 800; text-transform: uppercase; font-family: monospace; ${
              o.status === 'shipped'
                ? 'background: rgba(16, 185, 129, 0.15); color: #34d399;'
                : o.status === 'ready_to_ship'
                  ? 'background: rgba(56, 189, 248, 0.15); color: #38bdf8;'
                  : o.status === 'exception'
                    ? 'background: rgba(239, 68, 68, 0.15); color: #f87171;'
                    : 'background: #27272a; color: #d4d4d8;'
            }">
              ${o.status.replace('_', ' ')}
            </span>
          </td>

          <!-- Actions -->
          <td style="padding: 12px 14px; text-align: right;">
            <div style="display: inline-flex; align-items: center; gap: 6px;">
              <button 
                class="fc-open-drawer-btn" 
                data-id="${o.id}" 
                style="padding: 5px 10px; background: #27272a; border: 1px solid #3f3f46; border-radius: 6px; color: #fff; font-size: 11px; font-weight: 700; cursor: pointer;"
              >
                Inspect &amp; Pack
              </button>
              <button 
                class="fc-print-single-btn" 
                data-id="${o.id}" 
                title="Print Packing Slip" 
                style="padding: 5px; background: transparent; border: 1px solid #27272a; border-radius: 6px; color: #a1a1aa; cursor: pointer; display: flex;"
              >
                ${getIcon('print')}
              </button>
            </div>
          </td>

        </tr>
      `;
    }).join('');

    // Attach row events
    tbody.querySelectorAll('.fc-row-cb').forEach((cb) => {
      cb.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        if (e.target.checked) selectedOrderIds.add(id);
        else selectedOrderIds.delete(id);
        updateBatchBar();
      });
    });

    tbody.querySelectorAll('.fc-urgent-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const currentUrgent = btn.dataset.urgent === 'true';
        try {
          await toggleOrderUrgent(id, !currentUrgent);
          loadOrders();
        } catch (err) {
          alert('Failed to update urgency: ' + err.message);
        }
      });
    });

    tbody.querySelectorAll('.fc-open-drawer-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const order = orders.find((x) => x.id === id);
        if (order) openDrawer(order);
      });
    });

    tbody.querySelectorAll('.fc-print-single-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        openBatchPackingSlips([id]);
      });
    });
  }

  // Slide-Over Order Drawer Implementation
  async function openDrawer(order) {
    activeDrawerOrder = order;
    drawerBackdrop.style.display = 'block';

    drawerContent.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100%; color: #f4f4f5;">
        
        <!-- Drawer Header -->
        <div style="padding: 16px 20px; border-bottom: 1px solid #27272a; display: flex; items-center; justify-content: space-between; background: #141416;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 15px; font-weight: 800; font-family: monospace; color: #fff;">${order.orderNumber}</span>
              <span style="font-size: 10px; padding: 2px 8px; border-radius: 9999px; font-weight: 800; text-transform: uppercase; ${
                order.isUrgent ? 'background: #ef4444; color: #fff;' : 'background: #27272a; color: #a1a1aa;'
              }">
                ${order.isUrgent ? 'URGENT DROP' : 'STANDARD AIR'}
              </span>
            </div>
            <div style="font-size: 11px; color: #71717a; margin-top: 2px;">
              Fulfillment Verification &amp; Packing Terminal
            </div>
          </div>

          <button id="fc-close-drawer-btn" style="background: transparent; border: none; color: #71717a; cursor: pointer; display: flex; padding: 4px;">
            ${getIcon('close')}
          </button>
        </div>

        <!-- Drawer Body -->
        <div style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px;">
          
          <!-- Customer Address Summary Card -->
          <div style="background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 14px;">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #71717a; letter-spacing: 0.5px; margin-bottom: 6px;">
              Delivery Destination
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #fff;">${order.customerName}</div>
            <div style="font-size: 11px; color: #38bdf8; font-mono; margin: 2px 0;">Phone: ${order.customerPhone || 'N/A'}</div>
            <div style="font-size: 11px; color: #a1a1aa; line-height: 1.4;">${order.shippingAddress}</div>
          </div>

          <!-- SKU-Level Interactive Packing Checklist -->
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #fff; letter-spacing: 0.5px;">
                Item Packing Checklist (${order.packedCount}/${order.totalItems})
              </div>
              <span style="font-size: 10px; color: #a1a1aa;">Check each SKU as you pack</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px;" id="fc-drawer-items-list">
              ${order.items.map((item) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #18181b; border: 1px solid ${item.isPacked ? '#059669' : '#27272a'}; border-radius: 8px;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <input 
                      type="checkbox" 
                      class="fc-item-check-cb" 
                      data-index="${item.index}" 
                      ${item.isPacked ? 'checked' : ''} 
                      style="width: 16px; height: 16px; accent-color: #10b981; cursor: pointer;" 
                    />
                    <div>
                      <div style="font-size: 12px; font-weight: 700; color: #fff;">${item.name}</div>
                      <div style="font-size: 10px; color: #71717a; font-family: monospace;">
                        Size: <strong>${item.size || 'M'}</strong> • Colour: ${item.colour || 'Black'} • SKU: ${item.sku}
                      </div>
                    </div>
                  </div>
                  <div style="font-size: 12px; font-weight: 800; color: #fff; padding: 2px 8px; background: #27272a; border-radius: 4px;">
                    x${item.qty}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Staff Assignment -->
          <div style="background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 14px;">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #71717a; letter-spacing: 0.5px; margin-bottom: 6px;">
              Fulfillment Specialist Assignment
            </div>
            <select id="fc-drawer-staff-select" style="width: 100%; padding: 8px 10px; background: #09090b; border: 1px solid #3f3f46; border-radius: 6px; color: #fff; font-size: 11px; font-weight: 600;">
              <option value="">Unassigned</option>
              ${(currentData.staffMembers || []).map((s) => `
                <option value="${s.id}" ${order.assignedStaffId === s.id ? 'selected' : ''}>${s.full_name} (${s.role})</option>
              `).join('')}
            </select>
          </div>

          <!-- Audit Timeline Feed -->
          <div>
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #fff; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
              ${getIcon('history')}
              <span>Order Fulfillment Timeline</span>
            </div>
            <div id="fc-drawer-timeline-container" style="display: flex; flex-direction: column; gap: 8px;">
              <p style="font-size: 11px; color: #71717a;">Loading audit events...</p>
            </div>
          </div>

        </div>

        <!-- Drawer Footer Controls -->
        <div style="padding: 16px 20px; border-top: 1px solid #27272a; background: #141416; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
          <button id="fc-drawer-print-btn" style="display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: #27272a; border: 1px solid #3f3f46; border-radius: 6px; color: #fff; font-size: 11px; font-weight: 700; cursor: pointer;">
            ${getIcon('print')}
            <span>Print Slip</span>
          </button>

          <div style="display: flex; items-center; gap: 8px;">
            <button id="fc-drawer-ready-btn" style="padding: 8px 14px; background: #0284c7; border: none; border-radius: 6px; color: #fff; font-size: 11px; font-weight: 800; cursor: pointer;">
              Ready to Ship
            </button>
            <button id="fc-drawer-ship-btn" style="padding: 8px 14px; background: #10b981; border: none; border-radius: 6px; color: #fff; font-size: 11px; font-weight: 800; cursor: pointer;">
              Dispatch &amp; AWB
            </button>
          </div>
        </div>

      </div>
    `;

    // Drawer Event Bindings
    drawerContent.querySelector('#fc-close-drawer-btn').addEventListener('click', closeDrawer);
    
    // Checklist Toggles
    drawerContent.querySelectorAll('.fc-item-check-cb').forEach((cb) => {
      cb.addEventListener('change', async (e) => {
        const itemIdx = Number(e.target.dataset.index);
        const isPacked = e.target.checked;
        try {
          const res = await updatePackingChecklist(order.id, itemIdx, isPacked);
          if (res?.success) {
            order.packingStatus = res.data.packingStatus;
            order.packedCount = res.data.packedCount;
            // Reload timeline
            loadTimeline(order.id);
          }
        } catch (err) {
          alert('Failed to update packing state: ' + err.message);
        }
      });
    });

    // Staff change
    drawerContent.querySelector('#fc-drawer-staff-select').addEventListener('change', async (e) => {
      const newStaffId = e.target.value;
      try {
        await assignFulfillmentStaff([order.id], newStaffId || null);
        loadTimeline(order.id);
      } catch (err) {
        alert('Failed to assign staff: ' + err.message);
      }
    });

    // Print slip
    drawerContent.querySelector('#fc-drawer-print-btn').addEventListener('click', () => {
      openBatchPackingSlips([order.id]);
    });

    // Ready to ship
    drawerContent.querySelector('#fc-drawer-ready-btn').addEventListener('click', async () => {
      try {
        await bulkUpdateFulfillmentStatus([order.id], 'ready_to_ship');
        closeDrawer();
        loadOrders();
      } catch (err) {
        alert('Failed to update status: ' + err.message);
      }
    });

    // Dispatch & AWB
    drawerContent.querySelector('#fc-drawer-ship-btn').addEventListener('click', async () => {
      const awb = prompt('Enter Courier AWB / Tracking Reference Number:', order.trackingNumber || '');
      if (awb === null) return;
      const carrier = prompt('Enter Logistics Carrier Name:', order.carrierName || 'Pan-India Express Air');
      try {
        await bulkUpdateFulfillmentStatus([order.id], 'shipped', {
          carrierName: carrier || 'Pan-India Express Air',
          trackingNumber: awb.trim() || undefined,
        });
        closeDrawer();
        loadOrders();
      } catch (err) {
        alert('Failed to mark shipped: ' + err.message);
      }
    });

    // Load initial timeline
    loadTimeline(order.id);
  }

  async function loadTimeline(orderId) {
    const timelineContainer = drawerContent.querySelector('#fc-drawer-timeline-container');
    if (!timelineContainer) return;
    try {
      const events = await getOrderTimeline(orderId);
      if (!events || events.length === 0) {
        timelineContainer.innerHTML = `<p style="font-size: 11px; color: #52525b;">No fulfillment events recorded yet.</p>`;
        return;
      }
      timelineContainer.innerHTML = events.map((ev) => `
        <div style="padding: 8px 10px; background: #09090b; border: 1px solid #1f1f23; border-radius: 6px; font-size: 11px;">
          <div style="display: flex; items-center; justify-content: space-between; margin-bottom: 2px;">
            <span style="font-weight: 700; color: #fff;">${ev.notes || ev.action}</span>
            <span style="font-size: 10px; color: #71717a; font-mono;">${new Date(ev.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div style="color: #71717a; font-size: 10px;">
            By: <span style="color: #d4d4d8;">${ev.actor_name || 'System'}</span>
          </div>
        </div>
      `).join('');
    } catch {}
  }

  function closeDrawer() {
    drawerBackdrop.style.display = 'none';
    activeDrawerOrder = null;
    loadOrders();
  }

  drawerBackdrop.addEventListener('click', (e) => {
    if (e.target === drawerBackdrop) closeDrawer();
  });

  // Batch actions
  selectAllCb.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    const orders = currentData.orders || [];
    if (isChecked) {
      orders.forEach((o) => selectedOrderIds.add(o.id));
    } else {
      selectedOrderIds.clear();
    }
    renderOrderRows(orders);
    updateBatchBar();
  });

  batchStaffSelect.addEventListener('change', async (e) => {
    const val = e.target.value;
    if (!val) return;
    const staffId = val === '__unassign__' ? null : val;
    try {
      await assignFulfillmentStaff(Array.from(selectedOrderIds), staffId);
      selectedOrderIds.clear();
      updateBatchBar();
      loadOrders();
    } catch (err) {
      alert('Failed to assign staff in bulk: ' + err.message);
    }
  });

  batchProcessingBtn.addEventListener('click', async () => {
    try {
      await bulkUpdateFulfillmentStatus(Array.from(selectedOrderIds), 'processing');
      selectedOrderIds.clear();
      updateBatchBar();
      loadOrders();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  });

  batchReadyBtn.addEventListener('click', async () => {
    try {
      await bulkUpdateFulfillmentStatus(Array.from(selectedOrderIds), 'ready_to_ship');
      selectedOrderIds.clear();
      updateBatchBar();
      loadOrders();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  });

  batchPrintBtn.addEventListener('click', () => {
    openBatchPackingSlips(Array.from(selectedOrderIds));
  });

  // Search input debounce
  let searchTimer = null;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = e.target.value;
      loadOrders();
    }, 300);
  });

  refreshBtn.addEventListener('click', () => {
    loadOrders();
  });

  // Initial load
  renderTabs();
  loadOrders();
}
