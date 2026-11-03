import { getOrders, updateOrderStatus } from '../services/adminService.js';
import { statusBadge, openModal, showToast, spinner } from '../helpers.js';

export async function renderShipping(container) {
  container.innerHTML = spinner();
  const { orders } = await getOrders('all');
  const dispatchableOrders = orders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.status));

  container.innerHTML = `
    <div class="section-header">
      <div>
        <p class="section-title">Shipping & Logistics</p>
        <p class="section-subtitle">Manual courier assignment, BlueDart tracking link entry, and transit status updates</p>
      </div>
    </div>

    <!-- Logistics Policy Quick Reference -->
    <div style="background:#18181b;border:1px solid #27272a;padding:16px;margin-bottom:20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;">
      <div>
        <span class="material-symbols-outlined" style="color:#22d3ee;font-size:20px;">flight_takeoff</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:700;color:#f4f4f5;margin-top:4px;">AIR EXPRESS PRIORITY</p>
        <p style="font-size:11px;color:#71717a;">Primary Carrier: BlueDart Air / Delhivery Express. Free Pan-India ₹0 shipping.</p>
      </div>
      <div>
        <span class="material-symbols-outlined" style="color:#fbbf24;font-size:20px;">schedule</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:700;color:#f4f4f5;margin-top:4px;">DISPATCH SLA</p>
        <p style="font-size:11px;color:#71717a;">Bengaluru Central Fulfillment Hub dispatches within 24–48 hours of WhatsApp verification.</p>
      </div>
      <div>
        <span class="material-symbols-outlined" style="color:#34d399;font-size:20px;">pin_drop</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:700;color:#f4f4f5;margin-top:4px;">SERVICEABILITY</p>
        <p style="font-size:11px;color:#71717a;">19,000+ Indian PIN codes covered via AWB cargo network.</p>
      </div>
    </div>

    <div class="card" style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>Order Ref</th>
            <th>Customer & Destination</th>
            <th>Current Status</th>
            <th>Assigned Courier</th>
            <th>AWB / Tracking Number</th>
            <th>Tracking URL</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${dispatchableOrders.length === 0 ? `
            <tr><td colspan="7" style="text-align:center;color:#71717a;padding:32px;">No active orders requiring dispatch.</td></tr>
          ` : dispatchableOrders.map(o => `
            <tr>
              <td>
                <p style="font-family:'Space Grotesk',sans-serif;font-weight:600;color:#e4e4e7;">${o.order_number}</p>
                <p style="font-size:11px;color:#52525b;">${new Date(o.created_at).toLocaleDateString('en-IN')}</p>
              </td>
              <td>
                <p style="color:#e4e4e7;font-weight:500;">${o.customer_name}</p>
                <p style="font-size:11px;color:#71717a;">${o.shipping_address || 'India'}</p>
              </td>
              <td>${statusBadge(o.status)}</td>
              <td>
                <span style="font-size:12px;font-family:'Space Grotesk',sans-serif;color:${o.carrier_name ? '#34d399' : '#71717a'};">
                  ${o.carrier_name || 'Unassigned'}
                </span>
              </td>
              <td>
                <span style="font-family:'Space Grotesk',sans-serif;font-size:12px;color:#a1a1aa;">
                  ${o.tracking_number || '—'}
                </span>
              </td>
              <td>
                ${o.tracking_url ? `
                  <a href="${o.tracking_url}" target="_blank" rel="noopener" style="color:#22d3ee;font-size:11px;text-decoration:underline;">View Link</a>
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
        <p style="font-size:11px;color:#71717a;">${order.order_number} · ${order.customer_name}</p>
      </div>
      <button id="modal-close" class="admin-btn" style="padding:4px 8px;font-size:11px;">✕</button>
    </div>

    <form id="shipping-form" style="display:flex;flex-direction:column;gap:14px;">
      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">Courier Partner</label>
        <select id="ship-carrier" class="admin-select">
          <option value="BlueDart Express" ${order.carrier_name?.includes('BlueDart') ? 'selected' : ''}>BlueDart Express Air</option>
          <option value="Delhivery" ${order.carrier_name?.includes('Delhivery') ? 'selected' : ''}>Delhivery Surface & Air</option>
          <option value="DTDC Express" ${order.carrier_name?.includes('DTDC') ? 'selected' : ''}>DTDC Express Cargo</option>
          <option value="Shadowfax" ${order.carrier_name?.includes('Shadowfax') ? 'selected' : ''}>Shadowfax Express</option>
        </select>
      </div>

      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">Tracking ID / AWB Number</label>
        <input id="ship-awb" type="text" class="admin-input" placeholder="e.g. BD-889210948" value="${order.tracking_number || ''}" required />
      </div>

      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">Direct Courier Tracking URL</label>
        <input id="ship-url" type="url" class="admin-input" placeholder="https://www.bluedart.com/tracking/..." value="${order.tracking_url || ''}" />
      </div>

      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">Order Status Update</label>
        <select id="ship-status" class="admin-select">
          <option value="shipped" selected>Shipped (Dispatched to Courier)</option>
          <option value="processing">Processing (Packing in Hub)</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      <button type="submit" class="admin-btn primary" style="width:100%;justify-content:center;padding:10px;margin-top:10px;">
        Save Tracking & Notify
      </button>
    </form>
  `;

  const { overlay, close } = openModal(modalHtml);
  overlay.querySelector('#modal-close').addEventListener('click', close);

  overlay.querySelector('#shipping-form').addEventListener('submit', async e => {
    e.preventDefault();
    const carrier = overlay.querySelector('#ship-carrier').value;
    const awb = overlay.querySelector('#ship-awb').value.trim();
    const url = overlay.querySelector('#ship-url').value.trim() || `https://www.bluedart.com/tracking/${awb}`;
    const status = overlay.querySelector('#ship-status').value;

    await updateOrderStatus(order.id, {
      status,
      carrier_name: carrier,
      tracking_number: awb,
      tracking_url: url,
    });

    showToast(`Shipping details updated for ${order.order_number}`);
    close();
    onSaved();
  });
}
