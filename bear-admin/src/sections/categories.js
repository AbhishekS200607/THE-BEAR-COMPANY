import { MOCK_CATEGORIES } from '../services/adminService.js';
import { modeBadge, showToast } from '../helpers.js';

export function renderCategories(container) {
  container.innerHTML = `
    <div class="section-header">
      <div>
        <p class="section-title">Categories</p>
        <p class="section-subtitle">${MOCK_CATEGORIES.length} active catalog categories</p>
      </div>
      <button class="admin-btn primary" id="add-cat-btn">+ Add Category</button>
    </div>

    <div class="card" style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>Category Name</th>
            <th>Brand Mode</th>
            <th>Linked Products</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${MOCK_CATEGORIES.map(c => `
            <tr>
              <td>
                <p style="color:#e4e4e7;font-weight:600;font-family:'Space Grotesk',sans-serif;">${c.name}</p>
                <p style="font-size:11px;color:#52525b;font-mono;">id: ${c.id}</p>
              </td>
              <td>${modeBadge(c.mode)}</td>
              <td style="font-family:'Space Grotesk',sans-serif;font-size:13px;color:#a1a1aa;">${c.product_count} items</td>
              <td><span class="badge ${c.is_active ? 'badge-green' : 'badge-zinc'}">${c.is_active ? 'Active' : 'Inactive'}</span></td>
              <td>
                <button class="admin-btn cat-toggle-btn" data-id="${c.id}" style="padding:4px 10px;font-size:10px;">
                  ${c.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelector('#add-cat-btn')?.addEventListener('click', () => {
    const name = prompt('Enter new category name:');
    if (!name) return;
    const mode = prompt('Enter brand mode (bear or sow):', 'bear') || 'bear';
    MOCK_CATEGORIES.push({
      id: `cat-${Date.now()}`,
      name,
      mode: mode.toLowerCase() === 'sow' ? 'sow' : 'bear',
      product_count: 0,
      is_active: true,
    });
    showToast(`Category "${name}" created.`);
    renderCategories(container);
  });

  container.querySelectorAll('.cat-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = MOCK_CATEGORIES.find(c => c.id === btn.dataset.id);
      if (cat) {
        cat.is_active = !cat.is_active;
        showToast(`Category "${cat.name}" updated.`);
        renderCategories(container);
      }
    });
  });
}
