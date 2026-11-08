import { getPromotions, savePromotions } from '../services/adminService.js';
import { spinner, showToast } from '../helpers.js';
import { getIcon } from '../utils/icons.js';

export async function renderPromotions(container) {
  container.innerHTML = spinner();
  const { promotions = {}, _error } = await getPromotions();

  if (_error) {
    container.innerHTML = `
      <div style="padding:40px;text-align:center;background:#18181b;border:1px solid #27272a;">
        <span style="font-size:36px;color:#f87171;margin-bottom:12px;display:inline-block;">${getIcon('promotions')}</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#f4f4f5;margin-bottom:6px;">Error Loading Promotions</p>
        <p style="font-size:12px;color:#71717a;margin-bottom:20px;">${_error}</p>
        <button id="promo-retry-btn" class="admin-btn primary">Retry</button>
      </div>
    `;
    container.querySelector('#promo-retry-btn')?.addEventListener('click', () => renderPromotions(container));
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div>
        <p class="section-title">Promotions & Marketing Banners</p>
        <p class="section-subtitle">Manage storefront announcement messages, hero campaign banners, and modal popups</p>
      </div>
      <button class="admin-btn primary" id="save-promos-btn">Save All Changes</button>
    </div>

    <div style="display:flex;flex-direction:column;gap:20px;">
      <!-- 1. Announcement Bar Manager -->
      <div class="card" style="padding:20px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <div>
            <p style="font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:700;color:#f4f4f5;">Top Announcement Bar</p>
            <p style="font-size:11px;color:#71717a;">Rotating ticker rendered above the main storefront navigation.</p>
          </div>
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#a1a1aa;cursor:pointer;">
            <input type="checkbox" id="announcement-enabled" ${promotions.announcement_bar?.enabled ? 'checked' : ''} />
            <span>Enable Bar</span>
          </label>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;">
          <label style="font-size:11px;color:#71717a;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">Announcement Messages (One per line)</label>
          <textarea id="announcement-text" class="admin-input" rows="3" placeholder="Enter rotating announcement lines...">${(promotions.announcement_bar?.messages || [
            'COMPLIMENTARY EXPRESS AIR SHIPPING ACROSS INDIA (₹0)',
            'USE CODE BEAR10 FOR 10% OFF YOUR FIRST DROP',
            'SOW WOMEN’S SCULPT COLLECTION NOW LIVE'
          ]).join('\n')}</textarea>
        </div>
      </div>

      <!-- 2. Hero Campaign Banner -->
      <div class="card" style="padding:20px;">
        <div style="margin-bottom:14px;">
          <p style="font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:700;color:#f4f4f5;">Homepage Hero Campaign Banner</p>
          <p style="font-size:11px;color:#71717a;">Primary headline and subtext displayed in the storefront hero stage.</p>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">BEAR Hero Tagline</label>
            <input id="hero-bear-title" type="text" class="admin-input" value="${promotions.hero_banner?.bear_title || 'BUILT FOR DISCIPLINE. 480 GSM HEAVYWEIGHT.'}" />
          </div>
          <div>
            <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">SOW Hero Tagline</label>
            <input id="hero-sow-title" type="text" class="admin-input" value="${promotions.hero_banner?.sow_title || 'SCULPTED FOR MOVEMENT. BUTTER-SOFT LUXURY.'}" />
          </div>
        </div>
      </div>

      <!-- 3. Promotional Popup -->
      <div class="card" style="padding:20px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <div>
            <p style="font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:700;color:#f4f4f5;">Promotional Restock / VIP Popup</p>
            <p style="font-size:11px;color:#71717a;">Modal prompt for new visitors on first session entry.</p>
          </div>
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#a1a1aa;cursor:pointer;">
            <input type="checkbox" id="popup-enabled" ${promotions.popup?.enabled ? 'checked' : ''} />
            <span>Enable Popup</span>
          </label>
        </div>

        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">Popup Promo Offer</label>
          <input id="popup-text" type="text" class="admin-input" value="${promotions.popup?.text || 'Unlock ₹500 off on your first order. Use code WELCOME500 at checkout.'}" />
        </div>
      </div>
    </div>
  `;

  container.querySelector('#save-promos-btn')?.addEventListener('click', async () => {
    const btn = container.querySelector('#save-promos-btn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const announcementMessages = container.querySelector('#announcement-text').value.split('\n').map(s => s.trim()).filter(Boolean);
    const announcementEnabled = container.querySelector('#announcement-enabled').checked;
    const heroBearTitle = container.querySelector('#hero-bear-title').value.trim();
    const heroSowTitle = container.querySelector('#hero-sow-title').value.trim();
    const popupEnabled = container.querySelector('#popup-enabled').checked;
    const popupText = container.querySelector('#popup-text').value.trim();

    try {
      await savePromotions({
        announcement_bar: { enabled: announcementEnabled, messages: announcementMessages },
        hero_banner: { bear_title: heroBearTitle, sow_title: heroSowTitle },
        popup: { enabled: popupEnabled, text: popupText },
      });

      showToast('Promotions and banners published successfully.');
      btn.disabled = false;
      btn.textContent = 'Save All Changes';
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Save All Changes';
    }
  });
}
