import { getOrders, updateOrderStatus } from '../services/adminService.js';
import { fmtCurrency, fmtDate, statusBadge, timeAgo, spinner, mockBanner, openModal, showToast } from '../helpers.js';

const STATUSES = ['all','pending_whatsapp','confirmed','processing','shipped','delivered','cancelled','returned'];

export async function renderOrders(container, initialStatus = 'all') {
  container.innerHTML = spinner();
  const { orders, _mock } = await getOrders(initialStatus);

  container.innerHTML = `
    ${_mock ? mockBanner() : ''}
    <div class="section-header">
      <div><p class="section-title">Orders</p><p class="section-subtitle">${orders.length} order${orders.length !== 1 ? 's' : ''} · ${initialStatus === 'all' ? 'All statuses' : initialStatus.replace(/_/g,' ')}</p></div>
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px;">
      ${STATUSES.map(s => `
        <button type="button" data-status="${s}" class="admin-btn order-filter ${s === initialStatus ? 'primary' : ''}" style="padding:5px 12px;font-size:10px;">
          ${s.replace(/_/g,' ')}
        </button>
      `).join('')}
    </div>

    <div class="card" style="overflow-x:auto;">
      <table>
        <thead><tr>
          <th>Order #</th><th>Customer</th><th>Status</th><th>Amount</th><th>Date</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${orders.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:#52525b;padding:40px;">No orders found.</td></tr>` :
            orders.map(o => `
              <tr>
                <td style="font-family:'Space Grotesk',sans-serif;font-size:12px;color:#71717a;">${o.order_number}</td>
                <td>
                  <p style="color:#e4e4e7;">${o.customer_name}</p>
                  <p style="font-size:11px;color:#52525b;">${o.customer_phone}</p>
                </td>
                <td>${statusBadge(o.status)}</td>
                <td style="font-family:'Space Grotesk',sans-serif;font-weight:600;">${fmtCurrency(o.total_amount)}</td>
                <td style="color:#52525b;font-size:12px;">${timeAgo(o.created_at)}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <button class="admin-btn order-view-btn" data-id="${o.id}" style="padding:4px 10px;font-size:10px;">View</button>
                    <a href="https://wa.me/91${o.customer_phone}?text=${encodeURIComponent(`Hi ${o.customer_name}, regarding your BEAR order ${o.order_number}`)}" target="_blank" rel="noopener noreferrer" class="admin-btn" style="padding:4px 10px;font-size:10px;background:rgba(16,185,129,0.1);border-color:rgba(16,185,129,0.3);color:#34d399;text-decoration:none;">WA</a>
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
      const order = orders.find(o => o.id === btn.dataset.id);
      if (order) openOrderModal(order, () => renderOrders(container, initialStatus));
    });
  });
}

function openOrderModal(order, onUpdate) {
  const { panel, close } = openModal(`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <div>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;color:#f4f4f5;">${order.order_number}</p>
        <p style="font-size:11px;color:#52525b;margin-top:2px;">${fmtDate(order.created_at)}</p>
      </div>
      <button id="modal-close" style="background:none;border:none;color:#71717a;cursor:pointer;font-size:20px;line-height:1;">✕</button>
    </div>

    <div style="background:#111113;border:1px solid #27272a;padding:14px;margin-bottom:14px;">
      <p style="font-size:10px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.08em;text-transform:uppercase;color:#52525b;margin-bottom:8px;">Customer</p>
      <p style="color:#e4e4e7;font-size:13px;">${order.customer_name}</p>
      <p style="color:#71717a;font-size:12px;">${order.customer_phone} · ${order.customer_email || ''}</p>
      ${order.shipping_address ? `<p style="color:#52525b;font-size:11px;margin-top:6px;">${order.shipping_address}</p>` : ''}
    </div>

    <div style="margin-bottom:14px;">
      <p style="font-size:10px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.08em;text-transform:uppercase;color:#52525b;margin-bottom:8px;">Items</p>
      ${(order.items || []).map(item => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1f1f22;">
          <div>
            <p style="color:#d4d4d8;font-size:13px;">${item.name}</p>
            <p style="color:#52525b;font-size:11px;">${item.size} · ${item.colour} · Qty ${item.qty}</p>
          </div>
          <p style="font-family:'Space Grotesk',sans-serif;font-weight:600;color:#f4f4f5;">${fmtCurrency(item.price * item.qty)}</p>
        </div>
      `).join('')}
      <div style="display:flex;justify-content:space-between;padding-top:10px;">
        <span style="color:#71717a;font-size:12px;">Total</span>
        <span style="font-family:'Space Grotesk',sans-serif;font-weight:700;color:#f4f4f5;">${fmtCurrency(order.total_amount)}</span>
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
      <span style="font-size:10px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.08em;text-transform:uppercase;color:#52525b;">Status:</span>
      ${statusBadge(order.status)}
    </div>

    ${order.tracking_number ? `
      <div style="background:#111113;border:1px solid #27272a;padding:12px;margin-bottom:14px;">
        <p style="font-size:10px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.08em;text-transform:uppercase;color:#52525b;margin-bottom:6px;">Tracking</p>
        <p style="color:#d4d4d8;font-size:13px;">${order.carrier_name || 'Carrier'} · ${order.tracking_number}</p>
        ${order.tracking_url ? `<a href="${order.tracking_url}" target="_blank" rel="noopener noreferrer" style="color:#60a5fa;font-size:11px;text-decoration:none;">Track shipment →</a>` : ''}
      </div>
    ` : ''}

    <div style="border-top:1px solid #27272a;padding-top:16px;margin-top:4px;">
      <p style="font-size:10px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.08em;text-transform:uppercase;color:#52525b;margin-bottom:14px;">Update Order</p>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;">New Status</label>
          <select id="m-status" class="admin-select">
            <option value="">— select —</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;">Carrier</label>
          <select id="m-carrier" class="admin-select">
            <option value="">— select —</option>
            <option value="BlueDart Express">BlueDart Express</option>
            <option value="Delhivery">Delhivery</option>
            <option value="DTDC">DTDC</option>
            <option value="Ekart">Ekart</option>
            <option value="India Post">India Post</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;">Tracking Number</label>
          <input id="m-tracking" type="text" class="admin-input" placeholder="e.g. BD-889210948" value="${order.tracking_number || ''}" />
        </div>
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;">Tracking URL</label>
          <input id="m-tracking-url" type="url" class="admin-input" placeholder="https://www.bluedart.com/tracking/..." value="${order.tracking_url || ''}" />
        </div>
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;">Admin Notes</label>
          <textarea id="m-notes" class="admin-input" rows="2" style="resize:none;" placeholder="Internal note...">${order.admin_notes || ''}</textarea>
        </div>
        <button id="m-save" class="admin-btn primary" style="justify-content:center;padding:10px;">Save Changes</button>
        <a href="https://wa.me/919605210198?text=${encodeURIComponent(`Order ${order.order_number} — ${order.customer_name}`)}" target="_blank" rel="noopener noreferrer" class="admin-btn" style="justify-content:center;padding:10px;background:rgba(16,185,129,0.1);border-color:rgba(16,185,129,0.3);color:#34d399;text-decoration:none;text-align:center;">Open WhatsApp Order Line</a>
      </div>
    </div>
  `);

  panel.querySelector('#modal-close').addEventListener('click', close);
  panel.querySelector('#m-save').addEventListener('click', async () => {
    const status = panel.querySelector('#m-status').value;
    const carrierName = panel.querySelector('#m-carrier').value;
    const trackingNumber = panel.querySelector('#m-tracking').value.trim();
    const trackingUrl = panel.querySelector('#m-tracking-url').value.trim();
    const adminNotes = panel.querySelector('#m-notes').value.trim();
    if (!status) { showToast('Select a status first.', 'error'); return; }
    const payload = { status };
    if (carrierName) payload.carrierName = carrierName;
    if (trackingNumber) payload.trackingNumber = trackingNumber;
    if (trackingUrl) payload.trackingUrl = trackingUrl;
    if (adminNotes) payload.adminNotes = adminNotes;
    await updateOrderStatus(order.id, payload);
    showToast('Order updated.');
    close();
    onUpdate();
  });
}
