import { getDashboard } from '../services/adminService.js';
import { fmtCurrency, fmt, statusBadge, timeAgo, spinner } from '../helpers.js';

export async function renderDashboard(container) {
  container.innerHTML = spinner();
  const data = await getDashboard();

  if (data._error) {
    container.innerHTML = `
      <div style="padding:40px;text-align:center;background:#18181b;border:1px solid #27272a;">
        <span class="material-symbols-outlined" style="font-size:36px;color:#f87171;margin-bottom:12px;">cloud_off</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#f4f4f5;margin-bottom:6px;">Failed to Load Dashboard</p>
        <p style="font-size:12px;color:#71717a;margin-bottom:20px;">${data._error}</p>
        <button id="dash-retry-btn" class="admin-btn primary">Retry Connection</button>
      </div>
    `;
    container.querySelector('#dash-retry-btn')?.addEventListener('click', () => renderDashboard(container));
    return;
  }

  const statuses = [
    { label: 'Pending WA', value: data.pendingWhatsApp || 0, color: '#fbbf24' },
    { label: 'Confirmed', value: data.confirmed || 0, color: '#60a5fa' },
    { label: 'Processing', value: data.processing || 0, color: '#c084fc' },
    { label: 'Shipped', value: data.shipped || 0, color: '#22d3ee' },
    { label: 'Delivered', value: data.delivered || 0, color: '#34d399' },
    { label: 'Cancelled', value: data.cancelled || 0, color: '#f87171' },
  ];

  const totalRev = Number(data.totalRevenue) || 0;
  const bearRev = Number(data.bearRevenue) || 0;
  const sowRev = Number(data.sowRevenue) || 0;

  const bearPct = totalRev > 0 ? Math.round((bearRev / totalRev) * 100) : 50;
  const sowPct = totalRev > 0 ? 100 - bearPct : 50;

  container.innerHTML = `
    <div class="section-header">
      <div>
        <p class="section-title">Dashboard</p>
        <p class="section-subtitle">Store overview · Real-time Supabase Database</p>
      </div>
    </div>

    <!-- KPI Row -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:24px;">
      <div class="card" style="padding:18px 20px;">
        <p style="font-size:11px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.07em;text-transform:uppercase;color:#52525b;margin-bottom:8px;">Total Revenue</p>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;color:#f4f4f5;letter-spacing:-0.02em;">${fmtCurrency(totalRev)}</p>
      </div>
      <div class="card" style="padding:18px 20px;">
        <p style="font-size:11px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.07em;text-transform:uppercase;color:#52525b;margin-bottom:8px;">Total Orders</p>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;color:#f4f4f5;letter-spacing:-0.02em;">${fmt(data.totalOrders || 0)}</p>
      </div>
      <div class="card" style="padding:18px 20px;">
        <p style="font-size:11px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.07em;text-transform:uppercase;color:#52525b;margin-bottom:8px;">WhatsApp Pending</p>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;color:#fbbf24;letter-spacing:-0.02em;">${fmt(data.pendingWhatsApp || 0)}</p>
      </div>
      <div class="card" style="padding:18px 20px;">
        <p style="font-size:11px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.07em;text-transform:uppercase;color:#52525b;margin-bottom:8px;">Low Stock SKUs</p>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;color:#f87171;letter-spacing:-0.02em;">${fmt(data.lowStockCount || 0)}</p>
      </div>
    </div>

    <!-- Order Status Breakdown + BEAR vs SOW -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
      <div class="card" style="padding:18px 20px;">
        <p style="font-size:11px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.07em;text-transform:uppercase;color:#52525b;margin-bottom:14px;">Order Status Breakdown</p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${statuses.map(s => {
            const pct = (data.totalOrders > 0) ? Math.round((s.value / data.totalOrders) * 100) : 0;
            return `
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <span style="font-size:12px;color:#a1a1aa;">${s.label}</span>
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:80px;height:4px;background:#27272a;border-radius:2px;overflow:hidden;">
                    <div style="width:${pct}%;height:100%;background:${s.color};border-radius:2px;"></div>
                  </div>
                  <span style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;color:#f4f4f5;min-width:24px;text-align:right;">${s.value}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="card" style="padding:18px 20px;">
        <p style="font-size:11px;font-family:'Space Grotesk',sans-serif;letter-spacing:0.07em;text-transform:uppercase;color:#52525b;margin-bottom:14px;">BEAR vs SOW Revenue</p>
        <div style="margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:12px;color:#a1a1aa;">BEAR</span>
            <span style="font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:600;color:#f4f4f5;">${fmtCurrency(bearRev)} <span style="color:#52525b;font-weight:400;">(${bearPct}%)</span></span>
          </div>
          <div style="height:8px;background:#27272a;border-radius:2px;overflow:hidden;">
            <div style="width:${bearPct}%;height:100%;background:#f4f4f5;border-radius:2px;"></div>
          </div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:12px;color:#a1a1aa;">SOW</span>
            <span style="font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:600;color:#fb923c;">${fmtCurrency(sowRev)} <span style="color:#52525b;font-weight:400;">(${sowPct}%)</span></span>
          </div>
          <div style="height:8px;background:#27272a;border-radius:2px;overflow:hidden;">
            <div style="width:${sowPct}%;height:100%;background:#b45309;border-radius:2px;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Orders -->
    <div class="card">
      <div style="padding:14px 18px;border-bottom:1px solid #27272a;display:flex;align-items:center;justify-content:space-between;">
        <p style="font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">Recent Orders</p>
        <button class="admin-btn" id="dash-view-orders" style="padding:4px 10px;font-size:10px;">View All</button>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead><tr>
            <th>Order</th><th>Customer</th><th>Status</th><th>Amount</th><th>Time</th>
          </tr></thead>
          <tbody>
            ${(data.recentOrders || []).length === 0 ? `
              <tr><td colspan="5" style="text-align:center;color:#52525b;padding:32px;">No orders recorded in database yet.</td></tr>
            ` : (data.recentOrders || []).map(o => `
              <tr>
                <td style="font-family:'Space Grotesk',sans-serif;font-size:12px;color:#a1a1aa;">${o.orderNumber}</td>
                <td>${o.customerName}</td>
                <td>${statusBadge(o.status)}</td>
                <td style="font-family:'Space Grotesk',sans-serif;font-weight:600;">${fmtCurrency(o.totalAmount)}</td>
                <td style="color:#52525b;">${timeAgo(o.createdAt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.querySelector('#dash-view-orders')?.addEventListener('click', () => {
    document.querySelector('[data-section="orders"]')?.click();
  });
}
