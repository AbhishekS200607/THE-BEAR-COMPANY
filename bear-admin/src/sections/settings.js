import { getSettings, saveSettings } from '../services/adminService.js';
import { spinner, showToast } from '../helpers.js';
import { supabase } from '../auth.js';

export async function renderSettings(container) {
  container.innerHTML = spinner();
  const { settings = {}, _error } = await getSettings();

  if (_error) {
    container.innerHTML = `
      <div style="padding:40px;text-align:center;background:#18181b;border:1px solid #27272a;">
        <span class="material-symbols-outlined" style="font-size:36px;color:#f87171;margin-bottom:12px;">settings</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#f4f4f5;margin-bottom:6px;">Error Loading Settings</p>
        <p style="font-size:12px;color:#71717a;margin-bottom:20px;">${_error}</p>
        <button id="settings-retry-btn" class="admin-btn primary">Retry</button>
      </div>
    `;
    container.querySelector('#settings-retry-btn')?.addEventListener('click', () => renderSettings(container));
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div>
        <p class="section-title">Store Settings & System Configuration</p>
        <p class="section-subtitle">Operational parameters, unified WhatsApp Business integration, and security controls</p>
      </div>
      <button class="admin-btn primary" id="save-settings-btn">Save Settings</button>
    </div>

    <div style="display:flex;flex-direction:column;gap:20px;">
      <!-- Store Identity & WhatsApp -->
      <div class="card" style="padding:20px;">
        <p style="font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:700;color:#f4f4f5;margin-bottom:14px;">Store Identity & WhatsApp Business Line</p>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">Store Name</label>
            <input id="set-store-name" type="text" class="admin-input" value="${settings.storeName || settings.store_name || 'BEAR Store (The Bear Company)'}" />
          </div>
          <div>
            <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">Unified WhatsApp Business Number (Locked)</label>
            <input id="set-whatsapp" type="text" class="admin-input" value="${settings.whatsappNumber || settings.whatsapp_number || '919605210198'}" readonly style="opacity:0.8;cursor:not-allowed;" />
            <p style="font-size:10px;color:#52525b;margin-top:2px;">Enforced across all customer WhatsApp order triggers.</p>
          </div>
        </div>
      </div>

      <!-- Logistics Invariants -->
      <div class="card" style="padding:20px;">
        <p style="font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:700;color:#f4f4f5;margin-bottom:14px;">Logistics & Pan-India Pricing Invariants</p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">Default Delivery Fee</label>
            <input type="text" class="admin-input" value="FREE (₹0 Pan-India Express)" readonly style="opacity:0.8;cursor:not-allowed;" />
          </div>
          <div>
            <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">Stock Reservation Expiry Duration</label>
            <input id="set-expiry" type="text" class="admin-input" value="${settings.reservationExpiryMinutes || 120} Minutes" readonly style="opacity:0.8;cursor:not-allowed;" />
            <p style="font-size:10px;color:#52525b;margin-top:2px;">Handled automatically by background reservation worker.</p>
          </div>
        </div>
      </div>

      <!-- Infrastructure Status -->
      <div class="card" style="padding:20px;">
        <p style="font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:700;color:#f4f4f5;margin-bottom:14px;">Backend & Security Services Health</p>
        
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#27272a;border-radius:4px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="material-symbols-outlined" style="color:#34d399;font-size:18px;">dns</span>
              <span style="font-size:12px;font-family:'Space Grotesk',sans-serif;color:#f4f4f5;">Node.js Express REST API (Port 4000)</span>
            </div>
            <span class="badge badge-green">HEALTHY (ONLINE)</span>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#27272a;border-radius:4px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="material-symbols-outlined" style="color:#34d399;font-size:18px;">database</span>
              <span style="font-size:12px;font-family:'Space Grotesk',sans-serif;color:#f4f4f5;">PostgreSQL Atomic Reservation Engine</span>
            </div>
            <span class="badge badge-green">MIGRATIONS ACTIVE</span>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#27272a;border-radius:4px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="material-symbols-outlined" style="color:#22d3ee;font-size:18px;">timer</span>
              <span style="font-size:12px;font-family:'Space Grotesk',sans-serif;color:#f4f4f5;">Reservation Expiry Background Sweeper (60s loop)</span>
            </div>
            <span class="badge badge-cyan">ACTIVE POLLING</span>
          </div>
        </div>
      </div>

      <!-- Administrator Credentials & Password -->
      <div class="card" style="padding:20px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span class="material-symbols-outlined" style="font-size:18px;color:#f59e0b;">lock_reset</span>
          <p style="font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:700;color:#f4f4f5;">Change Admin Password</p>
        </div>
        <p style="font-size:12px;color:#71717a;margin-bottom:16px;">
          Update your cryptographic Supabase password directly from this session.
        </p>

        <form id="change-pass-form" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:end;">
          <div>
            <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">New Password</label>
            <input id="set-new-pass" type="password" class="admin-input" placeholder="••••••••••••" minlength="6" required autocomplete="new-password" />
          </div>
          <div>
            <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">Confirm New Password</label>
            <input id="set-confirm-pass" type="password" class="admin-input" placeholder="••••••••••••" minlength="6" required autocomplete="new-password" />
          </div>
          <div style="grid-column:1 / -1;display:flex;justify-content:flex-end;">
            <button type="submit" id="update-pass-btn" class="admin-btn primary">
              <span class="material-symbols-outlined" style="font-size:15px;">check</span>
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  container.querySelector('#save-settings-btn')?.addEventListener('click', async () => {
    const btn = container.querySelector('#save-settings-btn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const storeName = container.querySelector('#set-store-name').value.trim();
    try {
      await saveSettings({ storeName, store_name: storeName });
      showToast('Store settings saved successfully.');
      btn.disabled = false;
      btn.textContent = 'Save Settings';
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Save Settings';
    }
  });

  // Handle Admin Password Change directly with Supabase Auth
  container.querySelector('#change-pass-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = container.querySelector('#update-pass-btn');
    const newPass = container.querySelector('#set-new-pass').value;
    const confirmPass = container.querySelector('#set-confirm-pass').value;

    if (newPass.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (newPass !== confirmPass) {
      showToast('Passwords do not match. Please re-type.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Updating Password...';

    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      showToast('Admin password updated successfully!');
      container.querySelector('#set-new-pass').value = '';
      container.querySelector('#set-confirm-pass').value = '';
    } catch (err) {
      showToast(err.message || 'Failed to update password.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `
        <span class="material-symbols-outlined" style="font-size:15px;">check</span>
        <span>Update Password</span>
      `;
    }
  });
}
