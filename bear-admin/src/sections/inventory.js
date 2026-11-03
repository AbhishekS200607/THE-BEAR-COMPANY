import { getInventory, updateInventory } from '../services/adminService.js';
import { stockChip, modeBadge, spinner, mockBanner } from '../helpers.js';

export async function renderInventory(container) {
  container.innerHTML = spinner();
  const { inventory, _mock } = await getInventory();

  const grouped = {};
  inventory.forEach(v => {
    if (!grouped[v.product_name]) grouped[v.product_name] = [];
    grouped[v.product_name].push(v);
  });

  const lowCount = inventory.filter(v => v.quantity_available <= v.low_stock_threshold).length;

  container.innerHTML = `
    ${_mock ? mockBanner() : ''}
    <div class="section-header">
      <div>
        <p class="section-title">Inventory</p>
        <p class="section-subtitle">${inventory.length} SKUs · ${lowCount} low stock</p>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:16px;" id="inv-groups">
      ${Object.entries(grouped).map(([name, variants]) => `
        <div class="card">
          <div style="padding:12px 16px;border-bottom:1px solid #27272a;display:flex;align-items:center;gap:10px;">
            <p style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;color:#f4f4f5;">${name}</p>
            ${modeBadge(variants[0].mode)}
          </div>
          <div style="overflow-x:auto;">
            <table>
              <thead><tr>
                <th>SKU</th><th>Colour</th><th>Size</th><th>Available</th><th>Reserved</th><th>Status</th><th>Adjust</th>
              </tr></thead>
              <tbody>
                ${variants.map(v => `
                  <tr data-variant="${v.variant_id}">
                    <td style="font-size:11px;color:#52525b;font-family:'Space Grotesk',sans-serif;">${v.sku}</td>
                    <td>${v.colour}</td>
                    <td style="font-family:'Space Grotesk',sans-serif;font-weight:700;">${v.size}</td>
                    <td class="qty-cell" style="font-family:'Space Grotesk',sans-serif;font-weight:700;color:${v.quantity_available === 0 ? '#f87171' : v.quantity_available <= v.low_stock_threshold ? '#fbbf24' : '#f4f4f5'};">${v.quantity_available}</td>
                    <td style="color:#52525b;">${v.quantity_reserved}</td>
                    <td class="chip-cell">${stockChip(v.quantity_available, v.low_stock_threshold)}</td>
                    <td>
                      <div style="display:flex;gap:4px;">
                        <button class="admin-btn inv-dec" data-id="${v.variant_id}" style="padding:3px 8px;font-size:14px;line-height:1;">−</button>
                        <button class="admin-btn inv-inc" data-id="${v.variant_id}" style="padding:3px 8px;font-size:14px;line-height:1;">+</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  const qtyMap = {};
  inventory.forEach(v => { qtyMap[v.variant_id] = { qty: v.quantity_available, threshold: v.low_stock_threshold }; });

  container.querySelectorAll('.inv-dec, .inv-inc').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const entry = qtyMap[id];
      if (!entry) return;
      const newQty = btn.classList.contains('inv-inc') ? entry.qty + 1 : Math.max(0, entry.qty - 1);
      entry.qty = newQty;

      const row = container.querySelector(`tr[data-variant="${id}"]`);
      if (row) {
        const qtyEl = row.querySelector('.qty-cell');
        const chipEl = row.querySelector('.chip-cell');
        if (qtyEl) {
          qtyEl.textContent = newQty;
          qtyEl.style.color = newQty === 0 ? '#f87171' : newQty <= entry.threshold ? '#fbbf24' : '#f4f4f5';
        }
        if (chipEl) chipEl.innerHTML = stockChip(newQty, entry.threshold);
      }

      await updateInventory(id, { quantityAvailable: newQty });
    });
  });
}
