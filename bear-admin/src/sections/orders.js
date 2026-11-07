import { getOrders, updateOrderStatus } from '../services/adminService.js';
import { fmtCurrency, fmtDate, statusBadge, timeAgo, spinner, openModal, showToast } from '../helpers.js';

const STATUSES = ['all', 'pending_whatsapp', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export async function renderOrders(container, initialStatus = 'all') {
  container.innerHTML = spinner();
  const { orders, _error } = await getOrders(initialStatus);

  if (_error) {
    container.innerHTML = `
      <div style="padding:40px;text-align:center;background:#18181b;border:1px solid #27272a;">
        <span class="material-symbols-outlined" style="font-size:36px;color:#f87171;margin-bottom:12px;">receipt_long</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#f4f4f5;margin-bottom:6px;">Error Loading Orders</p>
        <p style="font-size:12px;color:#71717a;margin-bottom:20px;">${_error}</p>
        <button id="order-retry-btn" class="admin-btn primary">Retry</button>
      </div>
    `;
    container.querySelector('#order-retry-btn')?.addEventListener('click', () => renderOrders(container, initialStatus));
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div>
        <p class="section-title">Orders Management</p>
        <p class="section-subtitle">${orders.length} order${orders.length !== 1 ? 's' : ''} in view · Real-time Supabase Database</p>
      </div>
    </div>

    <!-- Status Filter Pills -->
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px;">
      ${STATUSES.map(s => `
        <button type="button" data-status="${s}" class="admin-btn order-filter ${s === initialStatus ? 'primary' : ''}" style="padding:5px 12px;font-size:10px;">
          ${s.replace(/_/g, ' ')}
        </button>
      `).join('')}
    </div>

    <div class="card" style="overflow-x:auto;">
      <table>
        <thead><tr>
          <th>Order #</th>
          <th>Customer</th>
          <th>Status</th>
          <th>Total Amount</th>
          <th>Placed</th>
          <th>Actions</th>
        </tr></thead>
        <tbody>
          ${orders.length === 0 ? `
            <tr><td colspan="6" style="text-align:center;color:#52525b;padding:40px;">No orders found for this filter.</td></tr>
          ` : orders.map(o => `
            <tr>
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
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll('.order-filter').forEach(btn => {
    btn.addEventListener('click', () => renderOrders(container, btn.dataset.status));
  });

  container.querySelectorAll('.order-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const order = orders.find(x => x.id === btn.dataset.id);
      if (order) openOrderModal(order, () => renderOrders(container, initialStatus));
    });
  });
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
