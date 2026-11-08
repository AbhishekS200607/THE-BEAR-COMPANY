import { getCustomers, updateCustomerNotes } from '../services/adminService.js';
import { fmtCurrency, spinner, showToast, openModal } from '../helpers.js';
import { getIcon } from '../utils/icons.js';

export async function renderCustomers(container) {
  container.innerHTML = spinner();
  const { customers, _error } = await getCustomers();

  if (_error) {
    container.innerHTML = `
      <div style="padding:40px;text-align:center;background:#18181b;border:1px solid #27272a;">
        <span style="font-size:36px;color:#f87171;margin-bottom:12px;display:inline-block;">${getIcon('customers')}</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#f4f4f5;margin-bottom:6px;">Error Loading Customer CRM</p>
        <p style="font-size:12px;color:#71717a;margin-bottom:20px;">${_error}</p>
        <button id="cust-retry-btn" class="admin-btn primary">Retry</button>
      </div>
    `;
    container.querySelector('#cust-retry-btn')?.addEventListener('click', () => renderCustomers(container));
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div>
        <p class="section-title">Customer CRM</p>
        <p class="section-subtitle">${customers.length} registered profiles · Lifetime spend & support notes directly from Supabase</p>
      </div>
    </div>

    <div class="card" style="overflow-x:auto;">
      <table>
        <thead><tr>
          <th>Customer Profile</th>
          <th>Contact & WhatsApp</th>
          <th>Location</th>
          <th>Orders</th>
          <th>Lifetime Spend</th>
          <th>Support Notes</th>
          <th>Actions</th>
        </tr></thead>
        <tbody>
          ${customers.length === 0 ? `
            <tr><td colspan="7" style="text-align:center;color:#52525b;padding:32px;">No customer records found.</td></tr>
          ` : customers.map(c => {
            const cleanDigits = (c.phone || '').replace(/\D/g, '').replace(/^91/, '');
            const displayPhone = cleanDigits ? `+91 ${cleanDigits}` : (c.phone || '—');
            const waNumber = cleanDigits ? `91${cleanDigits}` : '';
            return `
            <tr>
              <td>
                <p style="color:#e4e4e7;font-weight:600;">${c.name}</p>
                <p style="font-size:11px;color:#52525b;">Joined ${c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : 'Recently'}</p>
              </td>
              <td>
                <p style="font-family:'Space Grotesk',sans-serif;font-size:12px;color:#d4d4d8;">${displayPhone}</p>
                <p style="font-size:11px;color:#71717a;">${c.email || 'No email attached'}</p>
              </td>
              <td>
                <span style="font-size:12px;color:#a1a1aa;">${c.city || 'India'}${c.state ? ', ' + c.state : ''}</span>
              </td>
              <td>
                <span class="badge badge-bear">${c.orderCount || 0} Orders</span>
              </td>
              <td>
                <p style="font-family:'Space Grotesk',sans-serif;font-weight:700;color:#f4f4f5;">${fmtCurrency(c.totalSpent || 0)}</p>
              </td>
              <td>
                <span style="font-size:11px;color:${c.notes ? '#fbbf24' : '#52525b'};font-style:${c.notes ? 'normal' : 'italic'};">
                  ${c.notes || 'No notes added'}
                </span>
              </td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button class="admin-btn cust-note-btn" data-id="${c.id}" style="padding:4px 8px;font-size:10px;">
                    Edit Note
                  </button>
                  ${waNumber ? `
                    <a href="https://wa.me/${waNumber}" target="_blank" rel="noopener noreferrer" class="admin-btn" style="padding:4px 8px;font-size:10px;text-decoration:none;color:#34d399;">
                      WA
                    </a>
                  ` : ''}
                </div>
              </td>
            </tr>
          `;}).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll('.cust-note-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = customers.find(x => x.id === btn.dataset.id);
      if (c) openNoteModal(c, () => renderCustomers(container));
    });
  });
}

function openNoteModal(customer, onSaved) {
  const modalHtml = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;color:#f4f4f5;">Customer Support Notes</p>
        <p style="font-size:11px;color:#71717a;">${customer.name} (+91 ${customer.phone || '—'})</p>
      </div>
      <button id="modal-close" class="admin-btn" style="padding:4px 8px;font-size:11px;">✕</button>
    </div>

    <form id="note-form" style="display:flex;flex-direction:column;gap:14px;">
      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;text-transform:uppercase;">Support & Delivery Preferences</label>
        <textarea id="note-text" class="admin-input" rows="4" placeholder="Enter sizing notes, delivery instructions, VIP status...">${customer.notes || ''}</textarea>
      </div>
      <button type="submit" id="save-note-btn" class="admin-btn primary" style="width:100%;justify-content:center;padding:10px;">
        Save Notes to Database
      </button>
    </form>
  `;

  const { overlay, close } = openModal(modalHtml);
  overlay.querySelector('#modal-close').addEventListener('click', close);

  overlay.querySelector('#note-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = overlay.querySelector('#save-note-btn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const notes = overlay.querySelector('#note-text').value.trim();
    try {
      await updateCustomerNotes(customer.id, notes);
      showToast(`Notes updated for ${customer.name}`);
      close();
      onSaved();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Save Notes to Database';
    }
  });
}
