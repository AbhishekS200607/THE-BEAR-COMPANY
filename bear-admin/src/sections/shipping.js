import { getOrders, updateOrderStatus } from '../services/adminService.js';
import { statusBadge, openModal, showToast, spinner } from '../helpers.js';

export async function renderShipping(container) {
  container.innerHTML = spinner();
  const { orders, _error } = await getOrders('all');

  if (_error) {
    container.innerHTML = `
      <div style="padding:40px;text-align:center;background:#18181b;border:1px solid #27272a;">
        <span class="material-symbols-outlined" style="font-size:36px;color:#f87171;margin-bottom:12px;">flight_takeoff</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#f4f4f5;margin-bottom:6px;">Error Loading Logistics</p>
        <p style="font-size:12px;color:#71717a;margin-bottom:20px;">${_error}</p>
        <button id="ship-retry-btn" class="admin-btn primary">Retry</button>
      </div>
    `;
    container.querySelector('#ship-retry-btn')?.addEventListener('click', () => renderShipping(container));
    return;
  }

  const dispatchableOrders = (orders || []).filter(o => ['confirmed', 'processing', 'shipped'].includes(o.status));

  container.innerHTML = `
    <div class="section-header">
      <div>
        <p class="section-title">Shipping & Logistics</p>
        <p class="section-subtitle">Courier partner assignment, AWB tracking link entry, and transit milestones</p>
      </div>
    </div>

    <!-- Logistics Policy Quick Reference -->
    <div style="background:#18181b;border:1px solid #27272a;padding:16px;margin-bottom:20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;">
      <div>
        <span class="material-symbols-outlined" style="color:#22d3ee;font-size:20px;">flight_takeoff</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:700;color:#f4f4f5;margin-top:4px;">AIR EXPRESS PRIORITY</p>
        <p style="font-size:11px;color:#71717a;">Pan-India Priority Express Air Delivery. Complimentary ₹0 shipping.</p>
      </div>
      <div>
        <span class="material-symbols-outlined" style="color:#fbbf24;font-size:20px;">schedule</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:700;color:#f4f4f5;margin-top:4px;">DISPATCH SLA</p>
        <p style="font-size:11px;color:#71717a;">Bengaluru Central Fulfillment Hub dispatches within 24–48 hours of verification.</p>
      </div>
      <div>
        <span class="material-symbols-outlined" style="color:#34d399;font-size:20px;">pin_drop</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:700;color:#f4f4f5;margin-top:4px;">PAN-INDIA SERVICEABILITY</p>
        <p style="font-size:11px;color:#71717a;">19,000+ PIN codes covered via domestic cargo network.</p>
      </div>
    </div>

    <div class="card" style="overflow-x:auto;">
      <table>
        <thead><tr>
          <th>Order Ref</th>
          <th>Customer & Destination</th>
          <th>Status</th>
          <th>Courier Carrier</th>
          <th>AWB / Tracking Number</th>
          <th>Tracking URL</th>
          <th>Action</th>
        </tr></thead>
        <tbody>
          ${dispatchableOrders.length === 0 ? `
            <tr><td colspan="7" style="text-align:center;color:#71717a;padding:32px;">No active orders requiring dispatch at this time.</td></tr>
          ` : dispatchableOrders.map(o => `
            <tr>
              <td>
                <p style="font-family:'Space Grotesk',sans-serif;font-weight:600;color:#e4e4e7;">${o.orderNumber}</p>
                <p style="font-size:11px;color:#52525b;">${new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
              </td>
              <td>
                <p style="color:#e4e4e7;font-weight:500;">${o.customerName}</p>
                <p style="font-size:11px;color:#71717a;">${o.shippingAddress || 'India'}</p>
              </td>
              <td>${statusBadge(o.status)}</td>
              <td>
                <span style="font-size:12px;font-family:'Space Grotesk',sans-serif;color:${o.carrierName ? '#34d399' : '#71717a'};">
                  ${o.carrierName || 'Unassigned'}
                </span>
              </td>
              <td>
                <span style="font-family:'Space Grotesk',sans-serif;font-size:12px;color:#a1a1aa;">
                  ${o.trackingNumber || '—'}
                </span>
              </td>
              <td>
                ${o.trackingUrl ? `
                  <a href="${o.trackingUrl}" target="_blank" rel="noopener noreferrer" style="color:#22d3ee;font-size:11px;text-decoration:underline;">View Link</a>
                ` : '<span style="color:#52525b;font-size:11px;">None</span>'}
              </td>
              <td>
                <button class="admin-btn primary ship-update-btn" data-id="${o.id}" style="padding:4px 10px;font-size:11px;">
                  Update Courier
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll('.ship-update-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const order = dispatchableOrders.find(o => o.id === btn.dataset.id);
      if (order) openShippingModal(order, () => renderShipping(container));
    });
  });
}

function openShippingModal(order, onSaved) {
  const modalHtml = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;color:#f4f4f5;">Dispatch & Tracking Entry</p>
        <p style="font-size:11px;color:#71717a;">${order.orderNumber} · ${order.customerName}</p>
      </div>
      <button id="modal-close" class="admin-btn" style="padding:4px 8px;font-size:11px;">✕</button>
    </div>

    <form id="shipping-form" style="display:flex;flex-direction:column;gap:14px;">
      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;text-transform:uppercase;">Courier Partner</label>
        <select id="ship-carrier" class="admin-select">
          <option value="Express Air Cargo" ${order.carrierName?.includes('Express') ? 'selected' : ''}>Express Air Cargo</option>
          <option value="Shiprocket" ${order.carrierName?.includes('Shiprocket') ? 'selected' : ''}>Shiprocket</option>
          <option value="Delhivery" ${order.carrierName?.includes('Delhivery') ? 'selected' : ''}>Delhivery Surface & Air</option>
          <option value="BlueDart Express" ${order.carrierName?.includes('BlueDart') ? 'selected' : ''}>BlueDart Express Air</option>
          <option value="DTDC Express" ${order.carrierName?.includes('DTDC') ? 'selected' : ''}>DTDC Express Cargo</option>
          <option value="Shadowfax" ${order.carrierName?.includes('Shadowfax') ? 'selected' : ''}>Shadowfax Express</option>
          <option value="India Post" ${order.carrierName?.includes('Post') ? 'selected' : ''}>India Post Speed Post</option>
        </select>
      </div>

      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;text-transform:uppercase;">Tracking ID / AWB Number</label>
        <input id="ship-awb" type="text" class="admin-input" placeholder="e.g. AWB-889210948" value="${order.trackingNumber || ''}" required />
      </div>

      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;text-transform:uppercase;">Direct Courier Tracking URL (Optional)</label>
        <input id="ship-url" type="url" class="admin-input" placeholder="https://..." value="${order.trackingUrl || ''}" />
      </div>

      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;text-transform:uppercase;">Order Status Update</label>
        <select id="ship-status" class="admin-select">
          <option value="shipped" selected>Shipped (Dispatched to Courier)</option>
          <option value="processing">Processing (Packing in Hub)</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      <button type="submit" id="ship-submit-btn" class="admin-btn primary" style="width:100%;justify-content:center;padding:10px;margin-top:10px;">
        Save Tracking Details
      </button>
    </form>
  `;

  const { overlay, close } = openModal(modalHtml);
  overlay.querySelector('#modal-close').addEventListener('click', close);

  overlay.querySelector('#shipping-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = overlay.querySelector('#ship-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const carrierName = overlay.querySelector('#ship-carrier').value;
    const trackingNumber = overlay.querySelector('#ship-awb').value.trim();
    let trackingUrl = overlay.querySelector('#ship-url').value.trim() || null;
    const status = overlay.querySelector('#ship-status').value;

    try {
      await updateOrderStatus(order.id, {
        status,
        carrierName,
        trackingNumber,
        trackingUrl,
      });

      showToast(`Shipping details updated for ${order.orderNumber}`);
      close();
      onSaved();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Save Tracking Details';
    }
  });
}
