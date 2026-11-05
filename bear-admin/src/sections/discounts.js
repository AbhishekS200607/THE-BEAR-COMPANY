import { getCoupons, saveCoupon, toggleCoupon, deleteCoupon } from '../services/adminService.js';
import { fmtCurrency, spinner, showToast, openModal } from '../helpers.js';

export async function renderDiscounts(container) {
  container.innerHTML = spinner();
  const { coupons = [], _error } = await getCoupons();

  if (_error) {
    container.innerHTML = `
      <div style="padding:40px;text-align:center;background:#18181b;border:1px solid #27272a;">
        <span class="material-symbols-outlined" style="font-size:36px;color:#f87171;margin-bottom:12px;">percent</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#f4f4f5;margin-bottom:6px;">Error Loading Discounts</p>
        <p style="font-size:12px;color:#71717a;margin-bottom:20px;">${_error}</p>
        <button id="disc-retry-btn" class="admin-btn primary">Retry</button>
      </div>
    `;
    container.querySelector('#disc-retry-btn')?.addEventListener('click', () => renderDiscounts(container));
    return;
  }

  container.innerHTML = `
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
          ${coupons.length === 0 ? `
            <tr><td colspan="7" style="text-align:center;color:#52525b;padding:32px;">No coupons configured. Click "+ Create Coupon" above.</td></tr>
          ` : coupons.map(c => `
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
              <td style="font-size:12px;color:#d4d4d8;">${fmtCurrency(c.minOrder ?? c.min_order ?? 0)}</td>
              <td>
                <span style="font-family:'Space Grotesk',sans-serif;font-size:12px;color:#a1a1aa;">
                  ${c.usageCount ?? c.usage_count ?? 0} / ${c.usageLimit ?? c.usage_limit ?? '∞'}
                </span>
              </td>
              <td>
                <span class="badge ${c.isActive || c.is_active ? 'badge-green' : 'badge-zinc'}">
                  ${c.isActive || c.is_active ? 'Active' : 'Disabled'}
                </span>
              </td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button class="admin-btn coupon-toggle-btn ${(c.isActive || c.is_active) ? 'danger' : ''}" data-id="${c.id}" data-active="${c.isActive || c.is_active}" style="padding:4px 8px;font-size:10px;">
                    ${(c.isActive || c.is_active) ? 'Disable' : 'Enable'}
                  </button>
                  <button class="admin-btn coupon-del-btn danger" data-id="${c.id}" data-code="${c.code}" style="padding:4px 8px;font-size:10px;">
                    Delete
                  </button>
                </div>
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
      try {
        await toggleCoupon(id, !currentActive);
        showToast(`Coupon status updated.`);
        renderDiscounts(container);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  container.querySelectorAll('.coupon-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const code = btn.dataset.code;
      if (!confirm(`Are you sure you want to delete coupon ${code}?`)) return;

      try {
        await deleteCoupon(id);
        showToast(`Coupon ${code} deleted.`);
        renderDiscounts(container);
      } catch (err) {
        showToast(err.message, 'error');
      }
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

      <button type="submit" id="cp-submit-btn" class="admin-btn primary" style="width:100%;justify-content:center;padding:10px;margin-top:10px;">
        Publish Coupon Code
      </button>
    </form>
  `;

  const { overlay, close } = openModal(modalHtml);
  overlay.querySelector('#modal-close').addEventListener('click', close);

  overlay.querySelector('#coupon-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = overlay.querySelector('#cp-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Publishing...';

    const code = overlay.querySelector('#cp-code').value.trim().toUpperCase();
    const type = overlay.querySelector('#cp-type').value;
    const value = Number(overlay.querySelector('#cp-val').value);
    const min_order = Number(overlay.querySelector('#cp-min').value);
    const usage_limit = Number(overlay.querySelector('#cp-limit').value);

    try {
      await saveCoupon({
        code,
        type,
        value,
        minOrder: min_order,
        min_order,
        usageLimit: usage_limit,
        usage_limit,
        isActive: true,
      });

      showToast(`Coupon ${code} created successfully.`);
      close();
      onSaved();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Publish Coupon Code';
    }
  });
}
