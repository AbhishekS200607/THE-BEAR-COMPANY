import { getStaff } from '../services/adminService.js';
import { spinner, mockBanner, showToast } from '../helpers.js';

export async function renderStaff(container) {
  container.innerHTML = spinner();
  const { staff, logs, _mock } = await getStaff();

  container.innerHTML = `
    ${_mock ? mockBanner() : ''}
    <div class="section-header">
      <div>
        <p class="section-title">Staff Roles & Permissions</p>
        <p class="section-subtitle">Manage administrative console access, security roles, and system audit history</p>
      </div>
      <button class="admin-btn primary" id="add-staff-btn">+ Invite Staff Member</button>
    </div>

    <!-- Staff Members Table -->
    <div class="card" style="margin-bottom:28px;overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>Staff Member</th>
            <th>Email</th>
            <th>Role & Permissions</th>
            <th>Status</th>
            <th>Last Active</th>
          </tr>
        </thead>
        <tbody>
          ${(staff || [
            { id: 'st-1', name: 'Abhishek Sharma', email: 'admin@bear.in', role: 'Super Admin', permissions: 'Full System Access', active: true, last_active: 'Active Now' },
            { id: 'st-2', name: 'Logistics Desk', email: 'shipping@bear.in', role: 'Fulfillment Lead', permissions: 'Orders & Inventory Only', active: true, last_active: '2h ago' },
            { id: 'st-3', name: 'Support Associate', email: 'support@bear.in', role: 'Customer Support', permissions: 'Read Only & Notes', active: true, last_active: '1d ago' },
          ]).map(s => `
            <tr>
              <td>
                <p style="color:#e4e4e7;font-weight:600;">${s.name}</p>
                <p style="font-size:11px;color:#52525b;">ID: ${s.id}</p>
              </td>
              <td style="font-size:12px;color:#a1a1aa;font-mono;">${s.email}</td>
              <td>
                <span class="badge ${s.role === 'Super Admin' ? 'badge-amber' : 'badge-blue'}">${s.role}</span>
                <p style="font-size:11px;color:#52525b;margin-top:2px;">${s.permissions}</p>
              </td>
              <td><span class="badge badge-green">ACTIVE</span></td>
              <td style="font-size:12px;color:#71717a;">${s.last_active}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Audit Logs Section -->
    <div class="section-header" style="margin-top:24px;">
      <div>
        <p class="section-title">Security & Action Audit Logs</p>
        <p class="section-subtitle">Immutable chronological ledger of store changes and administrative events</p>
      </div>
    </div>

    <div class="card" style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Admin User</th>
            <th>Action</th>
            <th>Target Entity</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody>
          ${(logs || [
            { id: 'log-1', timestamp: '2026-11-04 02:40:12', user: 'admin@bear.in', action: 'CREATE_PRODUCT', target: 'essential-oversized-tee', ip: '127.0.0.1' },
            { id: 'log-2', timestamp: '2026-11-04 02:22:45', user: 'admin@bear.in', action: 'UPDATE_INVENTORY', target: 'SKU BEAR-OT-PB-M (+10 units)', ip: '127.0.0.1' },
            { id: 'log-3', timestamp: '2026-11-04 01:50:30', user: 'admin@bear.in', action: 'DISPATCH_ORDER', target: 'BEAR-20261103-E5F6 (BlueDart)', ip: '127.0.0.1' },
            { id: 'log-4', timestamp: '2026-11-03 23:15:00', user: 'admin@bear.in', action: 'AUTH_LOGIN', target: 'Admin Console Session Started', ip: '127.0.0.1' },
          ]).map(l => `
            <tr>
              <td style="font-family:'Space Grotesk',sans-serif;font-size:11px;color:#71717a;">${l.timestamp}</td>
              <td style="font-size:12px;color:#e4e4e7;font-weight:500;">${l.user}</td>
              <td><span class="badge badge-bear">${l.action}</span></td>
              <td style="font-size:12px;color:#d4d4d8;">${l.target}</td>
              <td style="font-family:'Space Grotesk',sans-serif;font-size:11px;color:#52525b;">${l.ip}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelector('#add-staff-btn')?.addEventListener('click', () => {
    const email = prompt('Enter staff member email address:');
    if (!email) return;
    showToast(`Invitation sent to ${email}`);
  });
}
