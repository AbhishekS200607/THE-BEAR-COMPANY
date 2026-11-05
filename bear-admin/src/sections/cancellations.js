import { getOrders, updateOrderStatus } from '../services/adminService.js';
import { fmtCurrency, fmtDate, timeAgo, openModal, showToast, spinner } from '../helpers.js';

export async function renderCancellations(container, filter = 'all') {
  container.innerHTML = `
    <div style="padding:32px;display:flex;justify-content:center;align-items:center;">
      <p style="color:#71717a;font-size:13px;">Loading cancellations & requests...</p>
    </div>
  `;

  const { orders = [], _error } = await getOrders('all');

  if (_error) {
    container.innerHTML = `
      <div style="padding:24px;">
        <div style="background:#271214;border:1px solid #7f1d1d;padding:16px;border-radius:4px;color:#fca5a5;font-size:13px;">
          Failed to load cancellations: ${_error}
        </div>
      </div>
    `;
    return;
  }

  // Filter for orders that are cancelled OR have cancellation requested
  const allCancellations = orders.filter(
    (o) => o.status === 'cancelled' || (o.adminNotes && o.adminNotes.includes('[CANCELLATION REQUESTED]'))
  );

  const pendingRequests = allCancellations.filter(
    (o) => o.status !== 'cancelled' && o.adminNotes && o.adminNotes.includes('[CANCELLATION REQUESTED]')
  );

  const approvedCancelled = allCancellations.filter((o) => o.status === 'cancelled');

  let filtered = allCancellations;
  if (filter === 'pending') filtered = pendingRequests;
  if (filter === 'approved') filtered = approvedCancelled;

  const totalValue = allCancellations.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  container.innerHTML = `
    <div style="padding:24px;display:flex;flex-direction:column;gap:20px;">
      
      <!-- Top Title Bar -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
        <div>
          <h1 style="font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.03em;color:#f4f4f5;">
            Cancellations &amp; Return Requests
          </h1>
          <p style="font-size:12px;color:#71717a;margin-top:4px;">
            Dedicated desk for reviewing customer cancellation requests, reasons, and releasing stock.
          </p>
        </div>
        <button id="refresh-cancellations-btn" class="admin-btn" style="padding:6px 14px;font-size:11px;display:flex;align-items:center;gap:6px;">
          <span class="material-symbols-outlined" style="font-size:16px;">refresh</span>
          <span>Refresh List</span>
        </button>
      </div>

      <!-- Metric Summary Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:14px;">
        <div style="background:#111113;border:1px solid #27272a;padding:16px;border-radius:6px;">
          <p style="font-size:11px;color:#a1a1aa;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.05em;">Pending Desk Review</p>
          <div style="display:flex;align-items:baseline;gap:8px;margin-top:6px;">
            <span style="font-size:24px;font-weight:700;color:${pendingRequests.length > 0 ? '#f59e0b' : '#f4f4f5'};font-family:'Space Grotesk',sans-serif;">${pendingRequests.length}</span>
            <span style="font-size:11px;color:#71717a;">requires action</span>
          </div>
        </div>

        <div style="background:#111113;border:1px solid #27272a;padding:16px;border-radius:6px;">
          <p style="font-size:11px;color:#a1a1aa;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.05em;">Total Cancelled</p>
          <div style="display:flex;align-items:baseline;gap:8px;margin-top:6px;">
            <span style="font-size:24px;font-weight:700;color:#ef4444;font-family:'Space Grotesk',sans-serif;">${approvedCancelled.length}</span>
            <span style="font-size:11px;color:#71717a;">orders restocked</span>
          </div>
        </div>

        <div style="background:#111113;border:1px solid #27272a;padding:16px;border-radius:6px;">
          <p style="font-size:11px;color:#a1a1aa;font-family:'Space Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.05em;">Total Impact Value</p>
          <div style="display:flex;align-items:baseline;gap:8px;margin-top:6px;">
            <span style="font-size:24px;font-weight:700;color:#f4f4f5;font-family:'Space Grotesk',sans-serif;">${fmtCurrency(totalValue)}</span>
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div style="display:flex;gap:8px;border-bottom:1px solid #27272a;padding-bottom:12px;">
        <button class="admin-btn cancel-filter ${filter === 'all' ? 'primary' : ''}" data-filter="all" style="padding:6px 14px;font-size:11px;">
          All Records (${allCancellations.length})
        </button>
        <button class="admin-btn cancel-filter ${filter === 'pending' ? 'primary' : ''}" data-filter="pending" style="padding:6px 14px;font-size:11px;">
          Pending Review (${pendingRequests.length})
        </button>
        <button class="admin-btn cancel-filter ${filter === 'approved' ? 'primary' : ''}" data-filter="approved" style="padding:6px 14px;font-size:11px;">
          Cancelled &amp; Restocked (${approvedCancelled.length})
        </button>
      </div>

      <!-- Cancellations Table -->
      <div style="background:#111113;border:1px solid #27272a;border-radius:6px;overflow-x:auto;">
        ${
          filtered.length === 0
            ? `<div style="padding:48px 24px;text-align:center;color:#71717a;font-size:12px;">
                 No cancellation records found under this filter.
               </div>`
            : `
          <table class="admin-table" style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr style="border-bottom:1px solid #27272a;text-align:left;color:#71717a;font-size:11px;text-transform:uppercase;">
                <th style="padding:12px 16px;">Order Ref</th>
                <th style="padding:12px 16px;">Customer</th>
                <th style="padding:12px 16px;">Cancellation Reason</th>
                <th style="padding:12px 16px;">Items</th>
                <th style="padding:12px 16px;">Amount</th>
                <th style="padding:12px 16px;">Review Status</th>
                <th style="padding:12px 16px;text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered
                .map((o) => {
                  const isPending = o.status !== 'cancelled' && o.adminNotes && o.adminNotes.includes('[CANCELLATION REQUESTED]');
                  const reasonMatch = o.adminNotes ? o.adminNotes.match(/\[CANCELLATION REQUESTED\]:\s*([^(\n]+)/i) : null;
                  const reasonText = reasonMatch ? reasonMatch[1].trim() : (o.status === 'cancelled' ? (o.adminNotes || 'Direct cancellation') : 'Not specified');

                  return `
                    <tr style="border-bottom:1px solid #1c1c1f;">
                      <td style="padding:12px 16px;font-family:'Space Grotesk',sans-serif;font-weight:600;color:#f4f4f5;">
                        ${o.orderNumber}
                      </td>
                      <td style="padding:12px 16px;">
                        <p style="color:#e4e4e7;font-weight:500;">${o.customerName}</p>
                        <p style="font-size:11px;color:#71717a;">+91 ${o.customerPhone}</p>
                      </td>
                      <td style="padding:12px 16px;max-width:260px;">
                        <div style="background:${isPending ? '#27170a' : '#1c1c1f'};border:1px solid ${isPending ? '#78350f' : '#27272a'};padding:6px 10px;border-radius:4px;">
                          <p style="font-size:11px;color:${isPending ? '#fcd34d' : '#d4d4d8'};font-weight:600;">
                            ${reasonText}
                          </p>
                          <p style="font-size:10px;color:#71717a;margin-top:2px;">${timeAgo(o.createdAt)}</p>
                        </div>
                      </td>
                      <td style="padding:12px 16px;">
                        ${(o.items || [])
                          .map((i) => `<div style="font-size:11px;color:#a1a1aa;">${i.name} <span style="color:#71717a;">(${i.size}) × ${i.qty}</span></div>`)
                          .join('')}
                      </td>
                      <td style="padding:12px 16px;font-family:'Space Grotesk',sans-serif;font-weight:600;color:#f4f4f5;">
                        ${fmtCurrency(o.totalAmount)}
                      </td>
                      <td style="padding:12px 16px;">
                        ${
                          isPending
                            ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;background:#451a03;color:#fbbf24;border:1px solid #b45309;">
                                 ● Action Required
                               </span>`
                            : `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;background:#451a1a;color:#f87171;border:1px solid #991b1b;">
                                 ✓ Restocked
                               </span>`
                        }
                      </td>
                      <td style="padding:12px 16px;text-align:right;">
                        <div style="display:inline-flex;gap:6px;align-items:center;">
                          ${
                            isPending
                              ? `
                            <button class="admin-btn approve-cancel-btn" data-id="${o.id}" data-ref="${o.orderNumber}" style="background:#7f1d1d;color:#fef2f2;border-color:#991b1b;padding:4px 8px;font-size:10px;font-weight:700;">
                              Approve Cancel
                            </button>
                            <button class="admin-btn decline-cancel-btn" data-id="${o.id}" data-notes="${encodeURIComponent(o.adminNotes || '')}" style="padding:4px 8px;font-size:10px;">
                              Decline
                            </button>
                          `
                              : ''
                          }
                          <a href="https://wa.me/91${o.customerPhone}?text=${encodeURIComponent(`Hi ${o.customerName}, regarding your BEAR order ${o.orderNumber} cancellation request`)}" target="_blank" rel="noopener noreferrer" class="admin-btn" style="padding:4px 8px;font-size:10px;color:#34d399;text-decoration:none;" title="Chat on WhatsApp">
                            WhatsApp
                          </a>
                        </div>
                      </td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        `
        }
      </div>

    </div>
  `;

  // Attach tab filter clicks
  container.querySelectorAll('.cancel-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      renderCancellations(container, btn.dataset.filter);
    });
  });

  // Refresh button
  container.querySelector('#refresh-cancellations-btn')?.addEventListener('click', () => {
    renderCancellations(container, filter);
  });

  // Approve Cancellation (Releases stock and cancels order)
  container.querySelectorAll('.approve-cancel-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const orderId = btn.dataset.id;
      const orderRef = btn.dataset.ref;
      if (!confirm(`Are you sure you want to approve cancellation for order ${orderRef}? This will officially cancel the order and release reserved stock back into inventory.`)) {
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Cancelling...';

      try {
        await updateOrderStatus(orderId, {
          status: 'cancelled',
          adminNotes: `[CANCELLATION APPROVED & RESTOCKED] on ${new Date().toLocaleString('en-IN')}`,
        });
        showToast(`Order ${orderRef} cancelled & inventory restocked successfully.`, 'success');
        renderCancellations(container, filter);
      } catch (err) {
        showToast(err.message || 'Failed to cancel order', 'error');
        btn.disabled = false;
        btn.textContent = 'Approve Cancel';
      }
    });
  });

  // Decline Cancellation Request
  container.querySelectorAll('.decline-cancel-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const orderId = btn.dataset.id;
      const existingNotes = decodeURIComponent(btn.dataset.notes || '');

      const reason = prompt('Enter note for declining cancellation request (optional):', 'Customer advised order already prepared for shipping');
      if (reason === null) return;

      btn.disabled = true;
      btn.textContent = 'Updating...';

      try {
        const cleanedNotes = existingNotes.replace(/\[CANCELLATION REQUESTED\].*(\n|$)/i, '').trim();
        const updatedNotes = `[CANCELLATION DECLINED]: ${reason}\n${cleanedNotes}`.trim();

        await updateOrderStatus(orderId, {
          adminNotes: updatedNotes,
        });

        showToast('Cancellation request declined. Order remains active.', 'info');
        renderCancellations(container, filter);
      } catch (err) {
        showToast(err.message || 'Failed to update order', 'error');
        btn.disabled = false;
        btn.textContent = 'Decline';
      }
    });
  });
}

export default { renderCancellations };
