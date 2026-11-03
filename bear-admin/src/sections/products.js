import { getProducts, updateProduct } from '../services/adminService.js';
import { fmtCurrency, modeBadge, spinner, mockBanner, showToast, openModal } from '../helpers.js';

export async function renderProducts(container) {
  container.innerHTML = spinner();
  const { products, _mock } = await getProducts();

  container.innerHTML = `
    ${_mock ? mockBanner() : ''}
    <div class="section-header">
      <div><p class="section-title">Products</p><p class="section-subtitle">${products.length} products</p></div>
      <button class="admin-btn primary" id="add-product-btn">+ Add Product</button>
    </div>

    <div class="card" style="overflow-x:auto;">
      <table>
        <thead><tr>
          <th>Product</th><th>Mode</th><th>Category</th><th>Price</th><th>SKU Base</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${products.map(p => `
            <tr data-product-id="${p.id}">
              <td>
                <p style="color:#e4e4e7;font-weight:500;">${p.name}</p>
                <p style="font-size:11px;color:#52525b;">${(p.colours || []).join(', ')}</p>
              </td>
              <td>${modeBadge(p.mode)}</td>
              <td style="color:#a1a1aa;font-size:12px;">${p.category}</td>
              <td>
                <p style="font-family:'Space Grotesk',sans-serif;font-weight:600;">${fmtCurrency(p.price)}</p>
                ${p.compare_price ? `<p style="font-size:11px;color:#52525b;text-decoration:line-through;">${fmtCurrency(p.compare_price)}</p>` : ''}
              </td>
              <td style="font-size:11px;color:#52525b;font-family:'Space Grotesk',sans-serif;">${p.sku_base}</td>
              <td>
                <span class="badge ${p.is_published ? 'badge-green' : 'badge-zinc'}">${p.is_published ? 'Published' : 'Draft'}</span>
              </td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button class="admin-btn product-edit-btn" data-id="${p.id}" style="padding:4px 10px;font-size:10px;">Edit</button>
                  <button class="admin-btn product-toggle-btn ${p.is_published ? 'danger' : ''}" data-id="${p.id}" data-published="${p.is_published}" style="padding:4px 10px;font-size:10px;">
                    ${p.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelector('#add-product-btn')?.addEventListener('click', () => openProductDrawer(null, () => renderProducts(container)));

  container.querySelectorAll('.product-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = products.find(x => x.id === btn.dataset.id);
      if (p) openProductDrawer(p, () => renderProducts(container));
    });
  });

  container.querySelectorAll('.product-toggle-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const isPublished = btn.dataset.published === 'true';
      await updateProduct(btn.dataset.id, { is_published: !isPublished });
      showToast(`Product ${isPublished ? 'unpublished' : 'published'}.`);
      renderProducts(container);
    });
  });
}

function openProductDrawer(product, onSave) {
  const isNew = !product;
  const { panel, close } = openModal(`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <p style="font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;color:#f4f4f5;">${isNew ? 'Add Product' : 'Edit Product'}</p>
      <button id="modal-close" style="background:none;border:none;color:#71717a;cursor:pointer;font-size:20px;line-height:1;">✕</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div><label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;">Product Name</label>
        <input id="p-name" class="admin-input" value="${product?.name || ''}" placeholder="e.g. BEAR Oversized Tee" /></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div><label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;">Mode</label>
          <select id="p-mode" class="admin-select">
            <option value="bear" ${product?.mode === 'bear' ? 'selected' : ''}>BEAR</option>
            <option value="sow" ${product?.mode === 'sow' ? 'selected' : ''}>SOW</option>
          </select></div>
        <div><label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;">Category</label>
          <input id="p-category" class="admin-input" value="${product?.category || ''}" placeholder="e.g. T-Shirts" /></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div><label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;">Price (₹)</label>
          <input id="p-price" type="number" class="admin-input" value="${product?.price || ''}" placeholder="2999" /></div>
        <div><label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;">Compare Price (₹)</label>
          <input id="p-compare" type="number" class="admin-input" value="${product?.compare_price || ''}" placeholder="3999" /></div>
      </div>
      <div><label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;">SKU Base</label>
        <input id="p-sku" class="admin-input" value="${product?.sku_base || ''}" placeholder="e.g. BEAR-OT" /></div>
      <div><label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;">Colours (comma-separated)</label>
        <input id="p-colours" class="admin-input" value="${(product?.colours || []).join(', ')}" placeholder="Pitch Black, Charcoal" /></div>
      <div><label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;">Sizes (comma-separated)</label>
        <input id="p-sizes" class="admin-input" value="${(product?.sizes || []).join(', ')}" placeholder="S, M, L, XL" /></div>
      <div><label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;">Description</label>
        <textarea id="p-desc" class="admin-input" rows="3" style="resize:none;" placeholder="Product description...">${product?.description || ''}</textarea></div>
      <button id="p-save" class="admin-btn primary" style="justify-content:center;padding:10px;margin-top:4px;">
        ${isNew ? 'Create Product' : 'Save Changes'}
      </button>
    </div>
  `);

  panel.querySelector('#modal-close').addEventListener('click', close);
  panel.querySelector('#p-save').addEventListener('click', async () => {
    const payload = {
      name: panel.querySelector('#p-name').value.trim(),
      mode: panel.querySelector('#p-mode').value,
      category: panel.querySelector('#p-category').value.trim(),
      price: Number(panel.querySelector('#p-price').value),
      compare_price: Number(panel.querySelector('#p-compare').value) || null,
      sku_base: panel.querySelector('#p-sku').value.trim(),
      colours: panel.querySelector('#p-colours').value.split(',').map(s => s.trim()).filter(Boolean),
      sizes: panel.querySelector('#p-sizes').value.split(',').map(s => s.trim()).filter(Boolean),
      description: panel.querySelector('#p-desc').value.trim(),
    };
    if (!payload.name) { showToast('Product name is required.', 'error'); return; }
    if (product) await updateProduct(product.id, payload);
    showToast(isNew ? 'Product created.' : 'Product saved.');
    close();
    onSave();
  });
}
