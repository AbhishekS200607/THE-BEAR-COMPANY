import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/adminService.js';
import { modeBadge, spinner, showToast, openModal } from '../helpers.js';

export async function renderCategories(container) {
  container.innerHTML = spinner();
  const { categories, _error } = await getCategories();

  if (_error) {
    container.innerHTML = `
      <div style="padding:40px;text-align:center;background:#18181b;border:1px solid #27272a;">
        <span class="material-symbols-outlined" style="font-size:36px;color:#f87171;margin-bottom:12px;">category</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#f4f4f5;margin-bottom:6px;">Error Loading Categories</p>
        <p style="font-size:12px;color:#71717a;margin-bottom:20px;">${_error}</p>
        <button id="cat-retry-btn" class="admin-btn primary">Retry</button>
      </div>
    `;
    container.querySelector('#cat-retry-btn')?.addEventListener('click', () => renderCategories(container));
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div>
        <p class="section-title">Catalog Categories</p>
        <p class="section-subtitle">${categories.length} active categories · Synchronized with Supabase public.categories</p>
      </div>
      <button class="admin-btn primary" id="add-category-btn">+ Add Category</button>
    </div>

    <div class="card" style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>Category Name</th>
            <th>Brand Mode</th>
            <th>Linked Catalog Products</th>
            <th>Display Order</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${categories.length === 0 ? `
            <tr><td colspan="6" style="text-align:center;color:#52525b;padding:32px;">No categories found in database.</td></tr>
          ` : categories.map(c => `
            <tr>
              <td>
                <p style="color:#e4e4e7;font-weight:600;font-family:'Space Grotesk',sans-serif;">${c.name}</p>
                <p style="font-size:11px;color:#52525b;font-family:'Space Grotesk',sans-serif;">slug: ${c.slug}</p>
              </td>
              <td>${modeBadge(c.mode)}</td>
              <td style="font-family:'Space Grotesk',sans-serif;font-size:13px;color:#a1a1aa;">
                ${c.productCount} products
              </td>
              <td style="font-family:'Space Grotesk',sans-serif;font-size:12px;color:#71717a;">
                #${c.displayOrder}
              </td>
              <td><span class="badge badge-green">ACTIVE</span></td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button class="admin-btn cat-edit-btn" data-id="${c.id}" style="padding:4px 8px;font-size:10px;">Edit</button>
                  <button class="admin-btn danger cat-del-btn" data-id="${c.id}" data-count="${c.productCount}" style="padding:4px 8px;font-size:10px;">Delete</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelector('#add-category-btn')?.addEventListener('click', () => {
    openCategoryModal({
      category: null,
      onSave: () => renderCategories(container),
    });
  });

  container.querySelectorAll('.cat-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = categories.find(x => x.id === btn.dataset.id);
      if (c) {
        openCategoryModal({
          category: c,
          onSave: () => renderCategories(container),
        });
      }
    });
  });

  container.querySelectorAll('.cat-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const count = parseInt(btn.dataset.count || '0', 10);
      if (count > 0) {
        showToast(`Cannot delete category with ${count} linked products.`, 'error');
        return;
      }
      if (!confirm('Are you sure you want to delete this category?')) return;

      try {
        await deleteCategory(id);
        showToast('Category deleted successfully.');
        renderCategories(container);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

function openCategoryModal({ category, onSave }) {
  const isEdit = !!category;
  const modalHtml = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <p style="font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;color:#f4f4f5;">
        ${isEdit ? 'Edit Category' : 'Create New Category'}
      </p>
      <button id="modal-close" class="admin-btn" style="padding:4px 8px;font-size:11px;">✕</button>
    </div>

    <form id="category-form" style="display:flex;flex-direction:column;gap:14px;">
      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;text-transform:uppercase;">Category Name</label>
        <input id="cat-name" type="text" class="admin-input" placeholder="e.g. Compression Tops" value="${category?.name || ''}" required />
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;text-transform:uppercase;">Brand Mode</label>
          <select id="cat-mode" class="admin-select">
            <option value="bear" ${category?.mode === 'bear' ? 'selected' : ''}>BEAR (Men's Heavyweight)</option>
            <option value="sow" ${category?.mode === 'sow' ? 'selected' : ''}>SOW (Women's Sculpt)</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:4px;text-transform:uppercase;">Display Order</label>
          <input id="cat-order" type="number" class="admin-input" value="${category?.displayOrder ?? 1}" min="0" />
        </div>
      </div>

      <button type="submit" id="cat-submit-btn" class="admin-btn primary" style="width:100%;justify-content:center;padding:10px;margin-top:10px;">
        ${isEdit ? 'Update Category' : 'Save Category'}
      </button>
    </form>
  `;

  const { overlay, close } = openModal(modalHtml);
  overlay.querySelector('#modal-close').addEventListener('click', close);

  overlay.querySelector('#category-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = overlay.querySelector('#cat-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const name = overlay.querySelector('#cat-name').value.trim();
    const mode = overlay.querySelector('#cat-mode').value;
    const displayOrder = parseInt(overlay.querySelector('#cat-order').value || '0', 10);

    try {
      if (isEdit) {
        await updateCategory(category.id, { name, mode, displayOrder });
        showToast('Category updated successfully.');
      } else {
        await createCategory({ name, mode, displayOrder });
        showToast('Category created successfully.');
      }
      close();
      onSave();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = isEdit ? 'Update Category' : 'Save Category';
    }
  });
}
