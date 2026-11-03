import { getCoupons, saveCoupon, toggleCoupon } from '../services/adminService.js';
import { fmtCurrency, spinner, mockBanner, showToast, openModal } from '../helpers.js';

export async function renderDiscounts(container) {
  container.innerHTML = spinner();
  const { coupons, _mock } = await getCoupons();

  container.innerHTML = `
    ${_mock ? mockBanner() : ''}
    <div class="section-header">
      <div>
        <p class="section-title">Discounts & Coupons</p>
        <p class="section-subtitle">Manage manual promo codes and automatic promotional checkout rules</p>
      </div>
      <button class="admin-btn primary" id="add-coupon-btn">+ Create Coupon</button>
    </div>

    <!-- Automatic Discount Rule Badge -->
    <div style="background:#18181b;border:1px solid #27272a;padding:16px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
      <div>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;color:#f4f4f5;">AUTOMATIC RULE: 100% Pan-India Express Air Shipping Free (₹0)</p>
        <p style="font-size:11px;color:#71717a;">Applied universally across all orders. Never charges customers shipping fees.</p>
      </div>
      <span class="badge badge-green">SYSTEM LOCKED (ACTIVE)</span>
    </div>

    <div class="card" style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>Coupon Code</th>
            <th>Type</th>
            <th>Discount Value</th>
            <th>Min. Order Value</th>
            <th>Usage</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${coupons.map(c => `
            <tr>
              <td>
                <span style="font-family:'Space Grotesk',sans-serif;font-weight:700;letter-spacing:0.06em;color:#f4f4f5;background:#27272a;padding:3px 8px;border:1px solid #3f3f46;border-radius:2px;">
                  ${c.code}
                </span>
              </td>
              <td style="font-size:12px;color:#a1a1aa;text-transform:capitalize;">${c.type}</td>
              <td style="font-family:'Space Grotesk',sans-serif;font-weight:600;color:#e4e4e7;">
                ${c.type === 'percentage' ? `${c.value}% OFF` : `₹${c.value} OFF`}
              </td>
              <td style="font-size:12px;color:#d4d4d8;">${fmtCurrency(c.min_order || c.minCartValue || 0)}</td>
              <td>
                <span style="font-family:'Space Grotesk',sans-serif;font-size:12px;color:#a1a1aa;">
                  ${c.usage_count || 0} / ${c.usage_limit || '∞'}
                </span>
              </td>
              <td>
                <span class="badge ${c.is_active ? 'badge-green' : 'badge-zinc'}">
                  ${c.is_active ? 'Active' : 'Expired / Paused'}
                </span>
              </td>
              <td>
                <button class="admin-btn coupon-toggle-btn ${c.is_active ? 'danger' : ''}" data-id="${c.id}" data-active="${c.is_active}" style="padding:4px 8px;font-size:10px;">
                  ${c.is_active ? 'Disable' : 'Enable'}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelector('#add-coupon-btn')?.addEventListener('click', () => {
    openCreateCouponModal(() => renderDiscounts(container));
  });

  container.querySelectorAll('.coupon-toggle-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const currentActive = btn.dataset.active === 'true';
      await toggleCoupon(id, !currentActive);
      showToast(`Coupon status updated.`);
      renderDiscounts(container);
    });
  });
}

function openCreateCouponModal(onSaved) {
  const modalHtml = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <p style="font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;color:#f4f4f5;">Create New Coupon</p>
      <button id="modal-close" class="admin-btn" style="padding:4px 8px;font-size:11px;">✕</button>
    </div>

    <form id="coupon-form" style="display:flex;flex-direction:column;gap:14px;">
      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">Coupon Code (Uppercase)</label>
        <input id="cp-code" type="text" class="admin-input" placeholder="e.g. FESTIVE25" required style="font-family:'Space Grotesk',sans-serif;text-transform:uppercase;" />
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">Type</label>
          <select id="cp-type" class="admin-select">
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Flat (₹)</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">Value</label>
          <input id="cp-val" type="number" class="admin-input" placeholder="e.g. 15 or 500" required min="1" />
        </div>
      </div>

      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">Minimum Order Value (₹)</label>
        <input id="cp-min" type="number" class="admin-input" placeholder="e.g. 1999" value="999" min="0" />
      </div>

      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">Usage Limit</label>
        <input id="cp-limit" type="number" class="admin-input" placeholder="e.g. 100" value="50" min="1" />
      </div>

      <button type="submit" class="admin-btn primary" style="width:100%;justify-content:center;padding:10px;margin-top:10px;">
        Publish Coupon Code
      </button>
    </form>
  `;

  const { overlay, close } = openModal(modalHtml);
  overlay.querySelector('#modal-close').addEventListener('click', close);

  overlay.querySelector('#coupon-form').addEventListener('submit', async e => {
    e.preventDefault();
    const code = overlay.querySelector('#cp-code').value.trim().toUpperCase();
    const type = overlay.querySelector('#cp-type').value;
    const value = Number(overlay.querySelector('#cp-val').value);
    const min_order = Number(overlay.querySelector('#cp-min').value);
    const usage_limit = Number(overlay.querySelector('#cp-limit').value);

    await saveCoupon({
      code,
      type,
      value,
      min_order,
      usage_limit,
      is_active: true,
      expires_at: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
    });

    showToast(`Coupon ${code} created successfully.`);
    close();
    onSaved();
  });
}
