import { getStaff, inviteStaff, revokeStaff } from '../services/adminService.js';
import { spinner, showToast, openModal } from '../helpers.js';
import { getIcon } from '../utils/icons.js';

export async function renderStaff(container) {
  container.innerHTML = spinner();
  const { staff = [], logs = [], _error } = await getStaff();

  if (_error) {
    container.innerHTML = `
      <div style="padding:40px;text-align:center;background:#18181b;border:1px solid #27272a;">
        <span style="font-size:36px;color:#f87171;margin-bottom:12px;display:inline-block;">${getIcon('staff')}</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#f4f4f5;margin-bottom:6px;">Error Loading Staff & Audit Logs</p>
        <p style="font-size:12px;color:#71717a;margin-bottom:20px;">${_error}</p>
        <button id="staff-retry-btn" class="admin-btn primary">Retry</button>
      </div>
    `;
    container.querySelector('#staff-retry-btn')?.addEventListener('click', () => renderStaff(container));
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div>
        <p class="section-title">Staff Roles & Permissions</p>
        <p class="section-subtitle">${staff.length} administrative user${staff.length !== 1 ? 's' : ''} with trusted role authorization</p>
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
            <th style="text-align:right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${staff.length === 0 ? `
            <tr><td colspan="6" style="text-align:center;color:#52525b;padding:32px;">No admin profiles found.</td></tr>
          ` : staff.map(s => `
            <tr>
              <td>
                <p style="color:#e4e4e7;font-weight:600;">${s.name}</p>
                <p style="font-size:11px;color:#52525b;font-family:'Space Grotesk',sans-serif;">ID: ${s.id.slice(0, 8)}...</p>
              </td>
              <td style="font-size:12px;color:#a1a1aa;font-family:'Space Grotesk',sans-serif;">${s.email}</td>
              <td>
                <span class="badge ${s.role === 'Super Admin' ? 'badge-amber' : 'badge-blue'}">${s.role}</span>
                <p style="font-size:11px;color:#52525b;margin-top:2px;">${s.permissions}</p>
              </td>
              <td><span class="badge badge-green">ACTIVE</span></td>
              <td style="font-size:12px;color:#71717a;">${s.lastActive}</td>
              <td style="text-align:right;">
                ${s.role === 'Super Admin' ? `
                  <span style="font-size:10px;color:#52525b;text-transform:uppercase;font-family:'Space Grotesk',sans-serif;">Protected</span>
                ` : `
                  <button class="admin-btn danger revoke-staff-btn" data-id="${s.id}" data-name="${s.name}" data-email="${s.email}" style="padding:4px 8px;font-size:11px;">
                    Revoke Access
                  </button>
                `}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Audit Logs Section -->
    <div class="section-header" style="margin-top:24px;">
      <div>
        <p class="section-title">Security & Action Audit Logs</p>
        <p class="section-subtitle">Immutable chronological ledger of store changes and administrative events (Supabase public.admin_audit_logs)</p>
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
          ${logs.length === 0 ? `
            <tr><td colspan="5" style="text-align:center;color:#52525b;padding:32px;">No audit logs recorded yet.</td></tr>
          ` : logs.map(l => `
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
    const modalHtml = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <p style="font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;color:#f4f4f5;">Invite Staff Member</p>
        <button id="modal-close" class="admin-btn" style="padding:4px 8px;font-size:11px;">✕</button>
      </div>

      <form id="invite-form" style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;text-transform:uppercase;">Email Address</label>
          <input id="inv-email" type="email" class="admin-input" placeholder="colleague@bear.in" required />
        </div>

        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;text-transform:uppercase;">Administrative Role</label>
          <select id="inv-role" class="admin-select">
            <option value="admin">Admin (Catalog, Inventory, Fulfillment)</option>
            <option value="super_admin">Super Admin (Full System Access)</option>
          </select>
        </div>

        <button type="submit" id="inv-submit" class="admin-btn primary" style="width:100%;justify-content:center;padding:10px;margin-top:10px;">
          Send Invitation
        </button>
      </form>
    `;

    const { overlay, close } = openModal(modalHtml);
    overlay.querySelector('#modal-close').addEventListener('click', close);

    overlay.querySelector('#invite-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = overlay.querySelector('#inv-submit');
      btn.disabled = true;
      btn.textContent = 'Sending...';

      const email = overlay.querySelector('#inv-email').value.trim();
      const role = overlay.querySelector('#inv-role').value;

      try {
        await inviteStaff({ email, role });
        showToast(`Staff invitation sent to ${email}`);
        close();
        renderStaff(container);
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Send Invitation';
      }
    });
  });

  // Wire Revoke Staff Access buttons
  container.querySelectorAll('.revoke-staff-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const email = btn.dataset.email;

      const confirmed = window.confirm(`Are you sure you want to revoke administrative access for ${name} (${email})?\n\nThey will immediately lose access to the Admin Portal.`);
      if (!confirmed) return;

      btn.disabled = true;
      btn.textContent = 'Revoking...';

      try {
        await revokeStaff(id);
        showToast(`Administrative access revoked for ${email}`);
        renderStaff(container);
      } catch (err) {
        showToast(err.message || 'Failed to revoke access', 'error');
        btn.disabled = false;
        btn.textContent = 'Revoke Access';
      }
    });
  });
}
