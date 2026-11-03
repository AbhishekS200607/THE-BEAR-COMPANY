import { getCustomers, updateCustomerNotes } from '../services/adminService.js';
import { fmtCurrency, spinner, mockBanner, showToast, openModal } from '../helpers.js';

export async function renderCustomers(container) {
  container.innerHTML = spinner();
  const { customers, _mock } = await getCustomers();

  container.innerHTML = `
    ${_mock ? mockBanner() : ''}
    <div class="section-header">
      <div>
        <p class="section-title">Customers</p>
        <p class="section-subtitle">${customers.length} registered customers · Lifetime customer spend tracking</p>
      </div>
    </div>

    <div class="card" style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Contact & WhatsApp</th>
            <th>Location</th>
            <th>Orders</th>
            <th>Lifetime Spend</th>
            <th>Internal Support Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${customers.map(c => `
            <tr>
              <td>
                <p style="color:#e4e4e7;font-weight:600;">${c.name}</p>
                <p style="font-size:11px;color:#52525b;">Joined ${new Date(c.created_at).toLocaleDateString('en-IN')}</p>
              </td>
              <td>
                <p style="font-family:'Space Grotesk',sans-serif;font-size:12px;color:#d4d4d8;">+91 ${c.phone}</p>
                <p style="font-size:11px;color:#71717a;">${c.email}</p>
              </td>
              <td>
                <span style="font-size:12px;color:#a1a1aa;">${c.city || '—'}, ${c.state || ''}</span>
              </td>
              <td>
                <span class="badge badge-bear">${c.order_count || 1} Orders</span>
              </td>
              <td>
                <p style="font-family:'Space Grotesk',sans-serif;font-weight:700;color:#f4f4f5;">${fmtCurrency(c.total_spent || 0)}</p>
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
                  <a href="https://wa.me/91${c.phone}" target="_blank" rel="noopener" class="admin-btn" style="padding:4px 8px;font-size:10px;text-decoration:none;color:#34d399;">
                    WhatsApp
                  </a>
                </div>
              </td>
            </tr>
          `).join('')}
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
        <p style="font-size:11px;color:#71717a;">${customer.name} (+91 ${customer.phone})</p>
      </div>
      <button id="modal-close" class="admin-btn" style="padding:4px 8px;font-size:11px;">✕</button>
    </div>

    <form id="note-form" style="display:flex;flex-direction:column;gap:14px;">
      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;">Internal Notes</label>
        <textarea id="note-text" class="admin-input" rows="4" placeholder="Enter VIP preferences, delivery instructions, sizing notes...">${customer.notes || ''}</textarea>
      </div>
      <button type="submit" class="admin-btn primary" style="width:100%;justify-content:center;padding:10px;">
        Save Notes
      </button>
    </form>
  `;

  const { overlay, close } = openModal(modalHtml);
  overlay.querySelector('#modal-close').addEventListener('click', close);

  overlay.querySelector('#note-form').addEventListener('submit', async e => {
    e.preventDefault();
    const notes = overlay.querySelector('#note-text').value.trim();
    await updateCustomerNotes(customer.id, notes);
    showToast(`Notes updated for ${customer.name}`);
    close();
    onSaved();
  });
}
