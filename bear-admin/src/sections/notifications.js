import { getNotifications, markNotificationsRead } from '../services/adminService.js';
import { spinner, showToast } from '../helpers.js';
import { getIcon } from '../utils/icons.js';

export async function renderNotifications(container) {
  container.innerHTML = spinner();
  const { notifications = [], _error } = await getNotifications();

  if (_error) {
    container.innerHTML = `
      <div style="padding:40px;text-align:center;background:#18181b;border:1px solid #27272a;">
        <span style="font-size:36px;color:#f87171;margin-bottom:12px;display:inline-block;">${getIcon('notifications')}</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#f4f4f5;margin-bottom:6px;">Error Loading Notifications</p>
        <p style="font-size:12px;color:#71717a;margin-bottom:20px;">${_error}</p>
        <button id="notif-retry-btn" class="admin-btn primary">Retry</button>
      </div>
    `;
    container.querySelector('#notif-retry-btn')?.addEventListener('click', () => renderNotifications(container));
    return;
  }

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
      ${notifications.length === 0 ? `
        <div class="card" style="padding:32px;text-align:center;color:#71717a;">
          <span style="font-size:32px;color:#34d399;margin-bottom:8px;display:inline-block;">${getIcon('checkCircle')}</span>
          <p style="color:#e4e4e7;font-size:14px;font-weight:600;">All caught up!</p>
          <p style="font-size:12px;color:#71717a;margin-top:4px;">No critical inventory warnings or unhandled orders.</p>
        </div>
      ` : notifications.map(n => `
        <div class="card" style="padding:16px;display:flex;align-items:flex-start;gap:14px;border-left:3px solid ${n.read ? '#3f3f46' : '#22d3ee'};">
          <span style="font-size:20px;color:${n.type === 'order' ? '#34d399' : n.type === 'inventory' ? '#fbbf24' : '#22d3ee'};flex-shrink:0;margin-top:2px;display:inline-flex;">
            ${n.type === 'order' ? getIcon('orders') : n.type === 'inventory' ? getIcon('alertTriangle') : getIcon('shipping')}
          </span>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px;">
              <p style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;color:${n.read ? '#a1a1aa' : '#f4f4f5'};">
                ${n.title}
              </p>
              <span style="font-size:11px;color:#52525b;white-space:nowrap;font-family:'Space Grotesk',sans-serif;">${n.time}</span>
            </div>
            <p style="font-size:12px;color:#71717a;line-height:1.4;">${n.desc}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelector('#mark-all-read-btn')?.addEventListener('click', async () => {
    try {
      await markNotificationsRead();
      showToast('All notifications marked as read.');
      renderNotifications(container);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
