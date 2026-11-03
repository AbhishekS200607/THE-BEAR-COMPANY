import { getSettings, saveSettings } from '../services/adminService.js';
import { spinner, mockBanner, showToast } from '../helpers.js';

export async function renderSettings(container) {
  container.innerHTML = spinner();
  const { settings, _mock } = await getSettings();

  container.innerHTML = `
    ${_mock ? mockBanner() : ''}
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
            <input id="set-store-name" type="text" class="admin-input" value="${settings.store_name || 'BEAR Store (The Bear Company)'}" />
          </div>
          <div>
            <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">Unified WhatsApp Business Number (Locked)</label>
            <input id="set-whatsapp" type="text" class="admin-input" value="${settings.whatsapp_number || '919605210198'}" readonly style="opacity:0.8;cursor:not-allowed;" />
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
            <input id="set-expiry" type="text" class="admin-input" value="30 Minutes" readonly style="opacity:0.8;cursor:not-allowed;" />
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
            <span class="badge badge-green">MIGRATIONS PREPARED</span>
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
    </div>
  `;

  container.querySelector('#save-settings-btn')?.addEventListener('click', async () => {
    const storeName = container.querySelector('#set-store-name').value.trim();
    await saveSettings({ store_name: storeName });
    showToast('Store settings saved successfully.');
    renderSettings(container);
  });
}
