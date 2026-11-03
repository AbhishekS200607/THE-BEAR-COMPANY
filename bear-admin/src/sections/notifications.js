import { showToast } from '../helpers.js';

const MOCK_NOTIFICATIONS = [
  { id: 'notif-1', title: 'New WhatsApp Order Request', desc: 'Order BEAR-20261104-A1B2 received from Vikram Malhotra (+91 9876543210). Stock reserved for 30 min.', time: '12m ago', type: 'order', read: false },
  { id: 'notif-2', title: 'Low Stock Alert: BEAR Oversized Tee', desc: 'SKU BEAR-OT-CH-M has reached 2 units available (threshold: 5).', time: '1h ago', type: 'inventory', read: false },
  { id: 'notif-3', title: 'BlueDart Air Manifest Recorded', desc: 'AWB BD-889210948 generated and dispatched from Bengaluru Kempegowda hub.', time: '3h ago', type: 'shipping', read: true },
  { id: 'notif-4', title: 'Customer Cancellation Handled', desc: 'Order BEAR-20261101-K1L2 cancelled by customer. Reserved inventory released back to catalog.', time: '1d ago', type: 'system', read: true },
];

export function renderNotifications(container) {
  container.innerHTML = `
    <div class="section-header">
      <div>
        <p class="section-title">Notifications & Activity Feed</p>
        <p class="section-subtitle">Real-time alerts for incoming orders, WhatsApp handoffs, stock thresholds, and logistics</p>
      </div>
      <button class="admin-btn" id="mark-all-read-btn">Mark All Read</button>
    </div>

    <!-- Notification Channel Controls -->
    <div class="card" style="padding:16px;margin-bottom:20px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;">
      <div>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;color:#f4f4f5;">ACTIVE ALERT CHANNELS</p>
        <p style="font-size:11px;color:#71717a;">Receive instant notifications on order lifecycle events.</p>
      </div>
      <div style="display:flex;gap:16px;font-size:12px;color:#a1a1aa;">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
          <input type="checkbox" checked />
          <span>In-App Dashboard Alerts</span>
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
          <input type="checkbox" checked />
          <span>Email Alerts (admin@bear.in)</span>
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
          <input type="checkbox" checked />
          <span>WhatsApp Business Dispatch Bot</span>
        </label>
      </div>
    </div>

    <!-- Notifications List -->
    <div style="display:flex;flex-direction:column;gap:10px;">
      ${MOCK_NOTIFICATIONS.map(n => `
        <div class="card" style="padding:16px;display:flex;align-items:flex-start;gap:14px;border-left:3px solid ${n.read ? '#3f3f46' : '#22d3ee'};">
          <span class="material-symbols-outlined" style="font-size:22px;color:${n.type === 'order' ? '#34d399' : n.type === 'inventory' ? '#fbbf24' : '#22d3ee'};flex-shrink:0;margin-top:2px;">
            ${n.type === 'order' ? 'shopping_bag' : n.type === 'inventory' ? 'warning' : 'local_shipping'}
          </span>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px;">
              <p style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;color:${n.read ? '#a1a1aa' : '#f4f4f5'};">
                ${n.title}
              </p>
              <span style="font-size:11px;color:#52525b;white-space:nowrap;">${n.time}</span>
            </div>
            <p style="font-size:12px;color:#71717a;line-height:1.4;">${n.desc}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelector('#mark-all-read-btn')?.addEventListener('click', () => {
    MOCK_NOTIFICATIONS.forEach(n => { n.read = true; });
    showToast('All notifications marked as read.');
    renderNotifications(container);
  });
}
