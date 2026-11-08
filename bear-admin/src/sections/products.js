import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  archiveProduct, 
  deleteProduct, 
  bulkDeleteProducts, 
  bulkUpdateProducts, 
  bulkArchiveProducts, 
  uploadProductImage 
} from '../services/adminService.js';
import { fmtCurrency, modeBadge, spinner, showToast, openModal } from '../helpers.js';
import { compressImageToWebP, formatBytes } from '../utils/imageCompressor.js';
import { getIcon } from '../utils/icons.js';

export async function renderProducts(container) {
  container.innerHTML = spinner();
  const { products, _error } = await getProducts();

  if (_error) {
    container.innerHTML = `
      <div style="padding:40px;text-align:center;background:#18181b;border:1px solid #27272a;">
        <span style="font-size:36px;color:#f87171;margin-bottom:12px;display:flex;justify-content:center;">${getIcon('error')}</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#f4f4f5;margin-bottom:6px;">Error Loading Products</p>
        <p style="font-size:12px;color:#71717a;margin-bottom:20px;">${_error}</p>
        <button id="prod-retry-btn" class="admin-btn primary">Retry</button>
      </div>
    `;
    container.querySelector('#prod-retry-btn')?.addEventListener('click', () => renderProducts(container));
    return;
  }

  // State management for Search, Sort, Filter, and Select All
  let searchQuery = '';
  let modeFilter = 'all';
  let statusFilter = 'all';
  let categoryFilter = 'all';
  let sortBy = 'newest';
  const selectedIds = new Set();

  // Extract unique categories
  const categories = Array.from(new Set(products.map(p => p.category || 'General').filter(Boolean))).sort();

  function getFilteredAndSorted() {
    return products
      .filter(p => {
        if (modeFilter !== 'all' && p.mode !== modeFilter) return false;
        if (statusFilter === 'published' && !p.isPublished) return false;
        if (statusFilter === 'archived' && p.isPublished) return false;
        if (categoryFilter !== 'all' && (p.category || 'General').toLowerCase() !== categoryFilter.toLowerCase()) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (p.name || '').toLowerCase().includes(q);
          const matchSku = (p.skuBase || p.slug || '').toLowerCase().includes(q);
          const matchCat = (p.category || '').toLowerCase().includes(q);
          const matchColours = (p.colours || []).some(c => c.toLowerCase().includes(q));
          if (!matchName && !matchSku && !matchCat && !matchColours) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
        return 0;
      });
  }

  function renderView() {
    const displayed = getFilteredAndSorted();
    const allVisibleSelected = displayed.length > 0 && displayed.every(p => selectedIds.has(p.id));
    const someVisibleSelected = displayed.some(p => selectedIds.has(p.id));

    container.innerHTML = `
      <!-- Section Header -->
      <div class="section-header" style="flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div>
          <p class="section-title">Products Catalog</p>
          <p class="section-subtitle">${products.length} catalog items total · ${displayed.length} shown in view</p>
        </div>
        <button class="admin-btn primary" id="add-product-btn" style="display:flex;align-items:center;gap:6px;">
          ${getIcon('plus')}
          <span>Add Product</span>
        </button>
      </div>

      <!-- Controls Bar: Search, Filters & Sort -->
      <div style="background:#111113;border:1px solid #27272a;border-radius:6px;padding:12px 14px;margin-bottom:14px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;">
        
        <!-- Live Search Input -->
        <div style="position:relative;flex:1;min-width:240px;max-width:380px;">
          <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#71717a;display:flex;align-items:center;pointer-events:none;">
            ${getIcon('search')}
          </span>
          <input 
            id="product-search-input" 
            class="admin-input" 
            type="text" 
            placeholder="Search products by title, SKU, colour, category..." 
            value="${searchQuery}" 
            style="padding-left:34px;padding-right:28px;width:100%;height:36px;font-size:12px;" 
          />
          ${searchQuery ? `
            <button id="clear-search-btn" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:#a1a1aa;cursor:pointer;padding:2px;display:flex;align-items:center;">
              ${getIcon('close')}
            </button>
          ` : ''}
        </div>

        <!-- Filter Dropdowns & Sort -->
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
          
          <!-- Mode Filter -->
          <select id="filter-mode" class="admin-select" style="height:36px;font-size:11px;padding:0 8px;">
            <option value="all" ${modeFilter === 'all' ? 'selected' : ''}>All Brands (BEAR & SOW)</option>
            <option value="bear" ${modeFilter === 'bear' ? 'selected' : ''}>BEAR (Men / Unisex)</option>
            <option value="sow" ${modeFilter === 'sow' ? 'selected' : ''}>SOW (Women)</option>
          </select>

          <!-- Status Filter -->
          <select id="filter-status" class="admin-select" style="height:36px;font-size:11px;padding:0 8px;">
            <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
            <option value="published" ${statusFilter === 'published' ? 'selected' : ''}>Published Only</option>
            <option value="archived" ${statusFilter === 'archived' ? 'selected' : ''}>Archived / Draft Only</option>
          </select>

          <!-- Category Filter -->
          <select id="filter-category" class="admin-select" style="height:36px;font-size:11px;padding:0 8px;">
            <option value="all" ${categoryFilter === 'all' ? 'selected' : ''}>All Categories</option>
            ${categories.map(c => `
              <option value="${c}" ${categoryFilter.toLowerCase() === c.toLowerCase() ? 'selected' : ''}>${c}</option>
            `).join('')}
          </select>

          <!-- Sort Dropdown -->
          <select id="sort-products" class="admin-select" style="height:36px;font-size:11px;padding:0 8px;">
            <option value="newest" ${sortBy === 'newest' ? 'selected' : ''}>Sort: Newest First</option>
            <option value="oldest" ${sortBy === 'oldest' ? 'selected' : ''}>Sort: Oldest First</option>
            <option value="price_asc" ${sortBy === 'price_asc' ? 'selected' : ''}>Price: Low → High</option>
            <option value="price_desc" ${sortBy === 'price_desc' ? 'selected' : ''}>Price: High → Low</option>
            <option value="name_asc" ${sortBy === 'name_asc' ? 'selected' : ''}>Name: A → Z</option>
            <option value="name_desc" ${sortBy === 'name_desc' ? 'selected' : ''}>Name: Z → A</option>
          </select>

          <!-- Reset Filters Button -->
          ${(searchQuery || modeFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all' || sortBy !== 'newest') ? `
            <button id="reset-filters-btn" class="admin-btn" style="height:36px;padding:0 10px;font-size:11px;" title="Reset search & filters">
              Reset
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Batch Actions Bar (when products are selected) -->
      ${selectedIds.size > 0 ? `
        <div style="background:#18181b;border:1px solid #3b82f6;border-radius:6px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;animation:fadeIn 0.15s ease-in-out;">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:700;color:#93c5fd;display:flex;align-items:center;gap:6px;">
              ${getIcon('check')}
              <span>${selectedIds.size} product${selectedIds.size > 1 ? 's' : ''} selected</span>
            </span>
            <button id="batch-clear-btn" class="admin-btn" style="padding:3px 8px;font-size:10px;color:#a1a1aa;">
              Deselect All
            </button>
          </div>

          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <button id="batch-publish-btn" class="admin-btn" style="padding:5px 10px;font-size:11px;display:flex;align-items:center;gap:4px;">
              ${getIcon('eye')}
              <span>Publish Selected</span>
            </button>
            <button id="batch-unpublish-btn" class="admin-btn" style="padding:5px 10px;font-size:11px;display:flex;align-items:center;gap:4px;">
              ${getIcon('eyeOff')}
              <span>Unpublish</span>
            </button>
            <button id="batch-archive-btn" class="admin-btn" style="padding:5px 10px;font-size:11px;display:flex;align-items:center;gap:4px;">
              ${getIcon('archive')}
              <span>Archive</span>
            </button>
            <button id="batch-delete-btn" class="admin-btn danger" style="padding:5px 10px;font-size:11px;display:flex;align-items:center;gap:4px;background:#7f1d1d;border-color:#991b1b;color:#fecaca;">
              ${getIcon('trash')}
              <span>Delete (${selectedIds.size})</span>
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Products Data Table -->
      <div class="card" style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <!-- Master Select All Checkbox -->
              <th style="width:38px;padding:10px 8px 10px 14px;">
                <input 
                  type="checkbox" 
                  id="select-all-checkbox" 
                  ${allVisibleSelected ? 'checked' : ''} 
                  style="cursor:pointer;accent-color:#3b82f6;width:15px;height:15px;" 
                  title="Select all ${displayed.length} visible products" 
                />
              </th>
              <th style="width:50px;">Photo</th>
              <th class="sortable-header" data-sort="name" style="cursor:pointer;" title="Click to sort by Name">
                <span style="display:inline-flex;align-items:center;gap:4px;">
                  <span>Product</span>
                  ${sortBy === 'name_asc' ? getIcon('chevronUp') : sortBy === 'name_desc' ? getIcon('chevronDown') : getIcon('arrowUpDown')}
                </span>
              </th>
              <th>Mode</th>
              <th>Category</th>
              <th class="sortable-header" data-sort="price" style="cursor:pointer;" title="Click to sort by Price">
                <span style="display:inline-flex;align-items:center;gap:4px;">
                  <span>Price</span>
                  ${sortBy === 'price_asc' ? getIcon('chevronUp') : sortBy === 'price_desc' ? getIcon('chevronDown') : getIcon('arrowUpDown')}
                </span>
              </th>
              <th>SKU Identifier</th>
              <th class="sortable-header" data-sort="newest" style="cursor:pointer;" title="Click to sort by Date">
                <span style="display:inline-flex;align-items:center;gap:4px;">
                  <span>Status</span>
                  ${sortBy === 'newest' ? getIcon('chevronDown') : sortBy === 'oldest' ? getIcon('chevronUp') : ''}
                </span>
              </th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${displayed.length === 0 ? `
              <tr>
                <td colspan="9" style="text-align:center;color:#71717a;padding:40px 16px;">
                  <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                    <span style="color:#52525b;">${getIcon('search')}</span>
                    <p style="font-size:13px;color:#a1a1aa;font-weight:500;">No products match your current search or filter criteria.</p>
                    ${(searchQuery || modeFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all') ? `
                      <button id="inline-reset-btn" class="admin-btn" style="margin-top:8px;font-size:11px;">Reset Search & Filters</button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            ` : displayed.map(p => {
              const displayImg = p.primaryImage || (p.images && p.images[0]) || null;
              const isSelected = selectedIds.has(p.id);
              return `
              <tr data-product-id="${p.id}" style="${isSelected ? 'background:rgba(59,130,246,0.06);' : ''}">
                <td style="width:38px;padding:11px 8px 11px 14px;">
                  <input 
                    type="checkbox" 
                    class="product-row-checkbox" 
                    data-id="${p.id}" 
                    ${isSelected ? 'checked' : ''} 
                    style="cursor:pointer;accent-color:#3b82f6;width:15px;height:15px;" 
                  />
                </td>
                <td>
                  ${displayImg ? `
                    <img src="${displayImg}" alt="${p.name}" style="width:38px;height:48px;object-fit:cover;border-radius:2px;border:1px solid #27272a;background:#09090b;display:block;" onerror="this.onerror=null;this.parentElement.innerHTML='<div style=\\'width:38px;height:48px;border-radius:2px;border:1px dashed #3f3f46;background:#18181b;display:flex;align-items:center;justify-content:center;color:#52525b;\\'>${getIcon('brokenImage')}</div>';" />
                  ` : `
                    <div style="width:38px;height:48px;border-radius:2px;border:1px dashed #3f3f46;background:#18181b;display:flex;align-items:center;justify-content:center;color:#52525b;">
                      ${getIcon('image')}
                    </div>
                  `}
                </td>
                <td>
                  <p style="color:#e4e4e7;font-weight:500;">${p.name}</p>
                  <p style="font-size:11px;color:#52525b;">${(p.colours || []).join(', ')}</p>
                </td>
                <td>${modeBadge(p.mode)}</td>
                <td style="color:#a1a1aa;font-size:12px;">${p.category || 'General'}</td>
                <td>
                  <p style="font-family:'Space Grotesk',sans-serif;font-weight:600;">${fmtCurrency(p.price)}</p>
                  ${p.comparePrice ? `<p style="font-size:11px;color:#52525b;text-decoration:line-through;">${fmtCurrency(p.comparePrice)}</p>` : ''}
                </td>
                <td style="font-size:11px;color:#52525b;font-family:'Space Grotesk',sans-serif;">${p.skuBase || p.slug}</td>
                <td>
                  <span class="badge ${p.isPublished ? 'badge-green' : 'badge-zinc'}">${p.isPublished ? 'Published' : 'Archived / Draft'}</span>
                </td>
                <td>
                  <div style="display:flex;gap:5px;justify-content:flex-end;">
                    <button class="admin-btn product-edit-btn" data-id="${p.id}" style="padding:4px 8px;font-size:10px;gap:4px;display:flex;align-items:center;" title="Edit product details">
                      ${getIcon('edit')}
                      <span>Edit</span>
                    </button>
                    <button class="admin-btn product-toggle-btn ${p.isPublished ? '' : 'primary'}" data-id="${p.id}" data-published="${p.isPublished}" style="padding:4px 8px;font-size:10px;gap:4px;display:flex;align-items:center;" title="${p.isPublished ? 'Unpublish from store' : 'Publish to store'}">
                      ${p.isPublished ? getIcon('eyeOff') : getIcon('eye')}
                      <span>${p.isPublished ? 'Unpublish' : 'Publish'}</span>
                    </button>
                    <button class="admin-btn product-archive-btn" data-id="${p.id}" data-archived="${!p.isPublished}" style="padding:4px 8px;font-size:10px;gap:4px;display:flex;align-items:center;" title="${p.isPublished ? 'Archive (deactivate product)' : 'Restore to active status'}">
                      ${p.isPublished ? getIcon('archive') : getIcon('unarchive')}
                      <span>${p.isPublished ? 'Archive' : 'Restore'}</span>
                    </button>
                    <button class="admin-btn product-delete-btn danger" data-id="${p.id}" data-name="${p.name.replace(/"/g, '&quot;')}" style="padding:4px 8px;font-size:10px;gap:4px;display:flex;align-items:center;background:#7f1d1d;border-color:#991b1b;color:#fecaca;" title="Permanently delete product from database">
                      ${getIcon('trash')}
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            `;}).join('')}
          </tbody>
        </table>
      </div>
    `;

    // ── Bind Event Listeners ──────────────────────────────────────────────────
    
    // Search input (preserves cursor position)
    const searchInput = container.querySelector('#product-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderView();
        const updatedInput = container.querySelector('#product-search-input');
        if (updatedInput) {
          updatedInput.focus();
          updatedInput.setSelectionRange(updatedInput.value.length, updatedInput.value.length);
        }
      });
    }

    container.querySelector('#clear-search-btn')?.addEventListener('click', () => {
      searchQuery = '';
      renderView();
    });

    container.querySelector('#filter-mode')?.addEventListener('change', (e) => {
      modeFilter = e.target.value;
      renderView();
    });

    container.querySelector('#filter-status')?.addEventListener('change', (e) => {
      statusFilter = e.target.value;
      renderView();
    });

    container.querySelector('#filter-category')?.addEventListener('change', (e) => {
      categoryFilter = e.target.value;
      renderView();
    });

    container.querySelector('#sort-products')?.addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderView();
    });

    const resetHandler = () => {
      searchQuery = '';
      modeFilter = 'all';
      statusFilter = 'all';
      categoryFilter = 'all';
      sortBy = 'newest';
      renderView();
    };
    container.querySelector('#reset-filters-btn')?.addEventListener('click', resetHandler);
    container.querySelector('#inline-reset-btn')?.addEventListener('click', resetHandler);

    // Clickable table header sorting
    container.querySelectorAll('.sortable-header').forEach(th => {
      th.addEventListener('click', () => {
        const type = th.dataset.sort;
        if (type === 'name') {
          sortBy = sortBy === 'name_asc' ? 'name_desc' : 'name_asc';
        } else if (type === 'price') {
          sortBy = sortBy === 'price_asc' ? 'price_desc' : 'price_asc';
        } else if (type === 'newest') {
          sortBy = sortBy === 'newest' ? 'oldest' : 'newest';
        }
        renderView();
      });
    });

    // Master Select All Checkbox
    container.querySelector('#select-all-checkbox')?.addEventListener('change', (e) => {
      const checked = e.target.checked;
      displayed.forEach(p => {
        if (checked) selectedIds.add(p.id);
        else selectedIds.delete(p.id);
      });
      renderView();
    });

    // Row Checkboxes
    container.querySelectorAll('.product-row-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = cb.dataset.id;
        if (e.target.checked) selectedIds.add(id);
        else selectedIds.delete(id);
        renderView();
      });
    });

    // Batch Actions
    container.querySelector('#batch-clear-btn')?.addEventListener('click', () => {
      selectedIds.clear();
      renderView();
    });

    container.querySelector('#batch-publish-btn')?.addEventListener('click', async () => {
      const ids = Array.from(selectedIds);
      try {
        await bulkUpdateProducts(ids, { isPublished: true });
        showToast(`Published ${ids.length} product(s).`);
        selectedIds.clear();
        renderProducts(container);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    container.querySelector('#batch-unpublish-btn')?.addEventListener('click', async () => {
      const ids = Array.from(selectedIds);
      try {
        await bulkUpdateProducts(ids, { isPublished: false });
        showToast(`Unpublished ${ids.length} product(s).`);
        selectedIds.clear();
        renderProducts(container);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    container.querySelector('#batch-archive-btn')?.addEventListener('click', async () => {
      const ids = Array.from(selectedIds);
      if (confirm(`Archive ${ids.length} selected product(s)?`)) {
        try {
          await bulkArchiveProducts(ids, true);
          showToast(`Archived ${ids.length} product(s).`);
          selectedIds.clear();
          renderProducts(container);
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });

    container.querySelector('#batch-delete-btn')?.addEventListener('click', async () => {
      const ids = Array.from(selectedIds);
      const answer = prompt(
        `PERMANENT BATCH DELETION:\n\nYou are about to permanently delete ${ids.length} product(s) and all their variants, inventory, and reviews.\n\nType DELETE to confirm:`
      );
      if (answer !== 'DELETE') {
        if (answer !== null) showToast('Batch deletion cancelled.', 'error');
        return;
      }

      try {
        await bulkDeleteProducts(ids);
        showToast(`Permanently deleted ${ids.length} product(s).`);
        selectedIds.clear();
        renderProducts(container);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // Row-level actions
    container.querySelector('#add-product-btn')?.addEventListener('click', () => {
      openProductDrawer(null, () => renderProducts(container));
    });

    container.querySelectorAll('.product-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = products.find(x => x.id === btn.dataset.id);
        if (p) openProductDrawer(p, () => renderProducts(container));
      });
    });

    container.querySelectorAll('.product-toggle-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const isPublished = btn.dataset.published === 'true';
        try {
          await updateProduct(btn.dataset.id, { isPublished: !isPublished });
          showToast(`Product ${isPublished ? 'unpublished' : 'published'}.`);
          renderProducts(container);
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    container.querySelectorAll('.product-archive-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const isCurrentlyArchived = btn.dataset.archived === 'true';
        const promptMsg = isCurrentlyArchived
          ? 'Restore this product to active catalog status?'
          : 'Archive this product? It will be marked inactive but historical order records remain intact.';
        if (confirm(promptMsg)) {
          try {
            await archiveProduct(btn.dataset.id, !isCurrentlyArchived);
            showToast(`Product ${isCurrentlyArchived ? 'restored' : 'archived'}.`);
            renderProducts(container);
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });

    container.querySelectorAll('.product-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const prodId = btn.dataset.id;
        const prodName = btn.dataset.name || 'this product';
        const confirmed = confirm(
          `PERMANENT DELETION WARNING:\n\nAre you sure you want to permanently delete "${prodName}"?\n\nThis will remove the product, all its variants, images, inventory, and reviews from the database.\n\nThis action CANNOT be undone.`
        );
        if (!confirmed) return;

        btn.disabled = true;
        btn.innerHTML = `${getIcon('refresh', 'spin')} <span>Deleting...</span>`;
        try {
          await deleteProduct(prodId);
          showToast(`Product "${prodName}" permanently deleted.`);
          selectedIds.delete(prodId);
          renderProducts(container);
        } catch (err) {
          showToast(err.message, 'error');
          btn.disabled = false;
          btn.innerHTML = `${getIcon('trash')} <span>Delete</span>`;
        }
      });
    });
  }

  // Initial render
  renderView();
}

function openProductDrawer(product, onSave) {
  const isNew = !product;
  let currentImages = [...(product?.images || [])];

  const { overlay, panel, close } = openModal(`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
      <p style="font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;color:#f4f4f5;">
        ${isNew ? 'Create New Catalog Product' : `Edit: ${product.name}`}
      </p>
      <button id="modal-close" class="admin-btn" style="padding:4px 8px;font-size:11px;">✕</button>
    </div>

    <form id="product-form" style="display:flex;flex-direction:column;gap:12px;max-height:calc(85vh - 70px);overflow-y:auto;padding-right:4px;">
      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Product Name</label>
        <input id="p-name" class="admin-input" value="${product?.name || ''}" placeholder="e.g. BEAR 480 GSM Oversized Tee" required />
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Brand Mode</label>
          <select id="p-mode" class="admin-select" ${!isNew ? 'disabled' : ''}>
            <option value="bear" ${product?.mode === 'bear' ? 'selected' : ''}>BEAR (Men / Unisex)</option>
            <option value="sow" ${product?.mode === 'sow' ? 'selected' : ''}>SOW (Women)</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Category</label>
          <input id="p-category" class="admin-input" value="${product?.category || ''}" placeholder="e.g. T-Shirts" required />
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Price (₹)</label>
          <input id="p-price" type="number" class="admin-input" value="${product?.price || ''}" placeholder="2999" required min="1" />
        </div>
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Compare Price (₹)</label>
          <input id="p-compare" type="number" class="admin-input" value="${product?.comparePrice || ''}" placeholder="3999" min="1" />
        </div>
      </div>

      <!-- PHOTO MANAGER SECTION -->
      <div style="background:#141417;border:1px solid #27272a;border-radius:4px;padding:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <label id="photo-count-label" style="font-size:11px;color:#e4e4e7;text-transform:uppercase;font-weight:600;letter-spacing:0.04em;">
            Product Photos (${currentImages.length})
          </label>
          <span style="font-size:10px;color:#71717a;">Auto-compressed to WebP · Supabase Storage</span>
        </div>

        <!-- Drag & Drop Zone -->
        <div id="dropzone" style="border:1.5px dashed #3f3f46;border-radius:4px;padding:16px 12px;text-align:center;background:#18181b;cursor:pointer;transition:all 0.15s ease-in-out;">
          <span style="display:flex;justify-content:center;color:#60a5fa;margin-bottom:6px;">${getIcon('cloudUpload')}</span>
          <p style="font-size:12px;color:#e4e4e7;margin-bottom:2px;">
            Drag & drop images here, or <span style="color:#60a5fa;text-decoration:underline;">browse files</span>
          </p>
          <p style="font-size:10px;color:#71717a;">Converts JPEG/PNG → WebP (82% quality) & uploads to Supabase Storage</p>
          <input type="file" id="file-input" multiple accept="image/*" style="display:none;" />
        </div>

        <!-- Uploading Progress Indicator -->
        <div id="upload-status" style="display:none;margin-top:10px;padding:10px 12px;background:#18181b;border:1px solid #3b82f6;border-radius:4px;font-size:12px;color:#93c5fd;align-items:center;gap:8px;"></div>

        <!-- URL Input fallback -->
        <div style="display:flex;gap:6px;margin-top:10px;">
          <input id="img-url-input" class="admin-input" placeholder="Or paste image URL (e.g. https://...)" style="font-size:11px;flex:1;" />
          <button type="button" id="btn-add-img-url" class="admin-btn" style="white-space:nowrap;padding:6px 12px;font-size:11px;">+ Add URL</button>
        </div>

        <!-- Gallery Thumbnails Grid -->
        <div id="image-gallery-preview" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(95px, 1fr));gap:8px;margin-top:12px;"></div>
      </div>

      ${isNew ? `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Initial Stock per Size</label>
          <input id="p-stock" type="number" class="admin-input" value="30" placeholder="30" min="0" max="9999" />
          <p style="font-size:10px;color:#52525b;margin-top:3px;">Applied to each size variant on creation.</p>
        </div>
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Low Stock Alert Threshold</label>
          <input id="p-threshold" type="number" class="admin-input" value="5" placeholder="5" min="0" max="999" />
          <p style="font-size:10px;color:#52525b;margin-top:3px;">Alert triggers when stock drops to this level.</p>
        </div>
      </div>
      ` : `
      <div style="background:#141417;border:1px solid #27272a;border-radius:4px;padding:10px 12px;">
        <p style="font-size:11px;color:#71717a;">To update stock levels, go to the <strong style="color:#a1a1aa;">Inventory</strong> section.</p>
      </div>
      `}

      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Colours (comma-separated)</label>
        <input id="p-colours" class="admin-input" value="${(product?.colours || []).join(', ')}" placeholder="Pitch Black, Charcoal" />
      </div>

      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Sizes (comma-separated)</label>
        <input id="p-sizes" class="admin-input" value="${(product?.sizes || ['S', 'M', 'L', 'XL', 'XXL']).join(', ')}" placeholder="S, M, L, XL, XXL" />
      </div>

      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Description</label>
        <textarea id="p-desc" class="admin-input" rows="3" style="resize:none;" placeholder="Crafted with heavyweight cotton, built for discipline..." required>${product?.description || ''}</textarea>
      </div>

      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Fit Details</label>
        <textarea id="p-fit" class="admin-input" rows="2" style="resize:none;" placeholder="e.g. Boxy drop-shoulder oversized fit. Model is 6'1&quot; wearing size L.">${product?.fit || ''}</textarea>
      </div>

      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Fabric Details</label>
        <textarea id="p-fabric" class="admin-input" rows="2" style="resize:none;" placeholder="e.g. 100% Combed Compact Cotton, 260 GSM Heavyweight Interlock Knit.">${product?.fabric || ''}</textarea>
      </div>

      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Care Instructions</label>
        <textarea id="p-care" class="admin-input" rows="2" style="resize:none;" placeholder="e.g. Machine wash cold inside out. Hang dry or tumble dry low.">${product?.care || ''}</textarea>
      </div>

      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Delivery Info</label>
        <textarea id="p-delivery" class="admin-input" rows="2" style="resize:none;" placeholder="e.g. Free domestic express shipping over ₹1,999. 7-day doorstep exchange.">${product?.delivery || ''}</textarea>
      </div>

      <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
        <input type="checkbox" id="p-published" ${product?.isPublished !== false ? 'checked' : ''} />
        <label for="p-published" style="font-size:12px;color:#e4e4e7;cursor:pointer;">Published in Storefront Catalog</label>
      </div>

      ${!isNew ? `
      <div style="display:flex;gap:10px;margin-top:12px;align-items:center;">
        <button type="button" id="drawer-delete-prod-btn" class="admin-btn danger" style="padding:10px 14px;background:#7f1d1d;border-color:#991b1b;color:#fecaca;display:flex;align-items:center;gap:6px;" title="Permanently delete product from database">
          ${getIcon('trash')}
          <span>Delete Product</span>
        </button>
        <button type="submit" id="p-save" class="admin-btn primary" style="flex:1;justify-content:center;padding:10px;">
          Save Changes
        </button>
      </div>
      ` : `
      <button type="submit" id="p-save" class="admin-btn primary" style="justify-content:center;padding:10px;margin-top:8px;">
        Create Product & Save Photos
      </button>
      `}
    </form>
  `);

  if (panel) {
    panel.style.maxWidth = '540px';
  }

  overlay.querySelector('#modal-close').addEventListener('click', close);

  overlay.querySelector('#drawer-delete-prod-btn')?.addEventListener('click', async () => {
    const confirmed = confirm(
      `PERMANENT DELETION WARNING:\n\nAre you sure you want to permanently delete "${product.name}"?\n\nThis will remove the product, all its variants, images, inventory, and reviews from the database.\n\nThis action CANNOT be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteProduct(product.id);
      showToast(`Product "${product.name}" permanently deleted.`);
      close();
      onSave();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Gallery Preview Renderer
  const galleryEl = overlay.querySelector('#image-gallery-preview');
  const countLabel = overlay.querySelector('#photo-count-label');

  function renderGallery() {
    if (countLabel) {
      countLabel.textContent = `Product Photos (${currentImages.length})`;
    }
    if (currentImages.length === 0) {
      galleryEl.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#52525b;font-size:11px;padding:8px 0;">No photos attached yet.</p>`;
      return;
    }
    galleryEl.innerHTML = currentImages.map((url, idx) => {
      const isWebp = url.toLowerCase().includes('.webp') || url.includes('product-images');
      return `
      <div style="position:relative;background:#18181b;border:1px solid ${idx === 0 ? '#3b82f6' : '#27272a'};border-radius:4px;overflow:hidden;group" data-idx="${idx}">
        <div style="position:relative;padding-top:125%;background:#09090b;">
          <img src="${url}" alt="Preview" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;" onerror="this.src='';this.alt='Broken URL';" />
          ${idx === 0 ? `
            <span style="position:absolute;top:4px;left:4px;background:#2563eb;color:#fff;font-size:9px;font-family:'Space Grotesk',sans-serif;font-weight:700;padding:1px 5px;border-radius:2px;letter-spacing:0.04em;">PRIMARY</span>
          ` : `
            <button type="button" class="btn-make-primary" data-idx="${idx}" style="position:absolute;top:4px;left:4px;background:rgba(0,0,0,0.7);color:#e4e4e7;border:1px solid #3f3f46;font-size:9px;padding:1px 4px;border-radius:2px;cursor:pointer;" title="Make Primary Cover">★ Cover</button>
          `}
          ${isWebp ? `
            <span style="position:absolute;bottom:4px;left:4px;background:rgba(16,185,129,0.9);color:#022c22;font-size:8px;font-family:'Space Grotesk',sans-serif;font-weight:700;padding:1px 4px;border-radius:2px;letter-spacing:0.05em;" title="Hosted as WebP on Supabase">WEBP</span>
          ` : ''}
          <button type="button" class="btn-del-photo" data-idx="${idx}" style="position:absolute;top:4px;right:4px;background:rgba(239,68,68,0.85);color:#fff;border:none;width:18px;height:18px;border-radius:50%;cursor:pointer;font-size:10px;line-height:1;display:flex;align-items:center;justify-content:center;" title="Remove Photo">✕</button>
        </div>
        <div style="display:flex;justify-content:space-between;padding:3px 4px;background:#18181b;border-top:1px solid #27272a;">
          <button type="button" class="btn-move-left" data-idx="${idx}" ${idx === 0 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : 'style="cursor:pointer;"'} title="Move left">←</button>
          <span style="font-size:10px;color:#71717a;font-family:'Space Grotesk',sans-serif;">#${idx + 1}</span>
          <button type="button" class="btn-move-right" data-idx="${idx}" ${idx === currentImages.length - 1 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : 'style="cursor:pointer;"'} title="Move right">→</button>
        </div>
      </div>
    `;}).join('');

    // Attach actions
    galleryEl.querySelectorAll('.btn-del-photo').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const i = Number(b.dataset.idx);
        currentImages.splice(i, 1);
        renderGallery();
      });
    });

    galleryEl.querySelectorAll('.btn-make-primary').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const i = Number(b.dataset.idx);
        const [selected] = currentImages.splice(i, 1);
        currentImages.unshift(selected);
        renderGallery();
      });
    });

    galleryEl.querySelectorAll('.btn-move-left').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const i = Number(b.dataset.idx);
        if (i > 0) {
          const temp = currentImages[i];
          currentImages[i] = currentImages[i - 1];
          currentImages[i - 1] = temp;
          renderGallery();
        }
      });
    });

    galleryEl.querySelectorAll('.btn-move-right').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const i = Number(b.dataset.idx);
        if (i < currentImages.length - 1) {
          const temp = currentImages[i];
          currentImages[i] = currentImages[i + 1];
          currentImages[i + 1] = temp;
          renderGallery();
        }
      });
    });
  }

  renderGallery();

  // Drag & drop handlers
  const dropzone = overlay.querySelector('#dropzone');
  const fileInput = overlay.querySelector('#file-input');
  const statusEl = overlay.querySelector('#upload-status');
  const saveBtn = overlay.querySelector('#p-save');

  dropzone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.style.borderColor = '#3b82f6';
      dropzone.style.background = 'rgba(59,130,246,0.08)';
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.style.borderColor = '#3f3f46';
      dropzone.style.background = '#18181b';
    });
  });

  async function processFiles(files) {
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileList.length === 0) {
      showToast('Please select valid image files (JPEG, PNG, WebP).', 'error');
      return;
    }

    if (saveBtn) saveBtn.disabled = true;
    let successCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (statusEl) {
        statusEl.style.display = 'flex';
        statusEl.innerHTML = `
          <span class="spin" style="color:#60a5fa;display:inline-flex;">${getIcon('refresh')}</span>
          <span>[${i + 1}/${fileList.length}] Compressing <strong>${file.name}</strong> to WebP...</span>
        `;
      }

      try {
        // Step 1: Client-Side WebP compression (82% quality, max 1600x2000)
        const compressed = await compressImageToWebP(file, {
          maxWidth: 1600,
          maxHeight: 2000,
          quality: 0.82,
        });

        if (statusEl) {
          statusEl.innerHTML = `
            <span class="spin" style="color:#34d399;display:inline-flex;">${getIcon('cloudUpload')}</span>
            <span>[${i + 1}/${fileList.length}] Uploading WebP (${formatBytes(compressed.compressedSize)}, -${compressed.savingsPercent}%) to Supabase...</span>
          `;
        }

        // Step 2: Upload to Supabase Storage bucket 'product-images'
        const res = await uploadProductImage(compressed.base64, compressed.filename);
        if (res?.url) {
          currentImages.push(res.url);
          renderGallery();
          successCount++;
        }
      } catch (err) {
        console.error('Image upload failed:', err);
        showToast(`Failed uploading "${file.name}": ${err.message}`, 'error');
      }
    }

    if (statusEl) statusEl.style.display = 'none';
    if (saveBtn) saveBtn.disabled = false;
    fileInput.value = '';

    if (successCount > 0) {
      showToast(`Successfully compressed & uploaded ${successCount} photo(s) to Supabase Storage!`);
    }
  }

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer?.files) processFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files) processFiles(fileInput.files);
  });

  // URL input handler
  const urlInput = overlay.querySelector('#img-url-input');
  overlay.querySelector('#btn-add-img-url')?.addEventListener('click', () => {
    const u = urlInput.value.trim();
    if (!u) return;
    if (!u.startsWith('http') && !u.startsWith('data:image')) {
      showToast('Please enter a valid HTTP/HTTPS image URL', 'error');
      return;
    }
    currentImages.push(u);
    urlInput.value = '';
    renderGallery();
  });

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      overlay.querySelector('#btn-add-img-url')?.click();
    }
  });

  // Form submit
  overlay.querySelector('#product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = overlay.querySelector('#p-save');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving to Database...';

    const payload = {
      name: overlay.querySelector('#p-name').value.trim(),
      mode: overlay.querySelector('#p-mode').value,
      category: overlay.querySelector('#p-category').value.trim(),
      price: Number(overlay.querySelector('#p-price').value),
      comparePrice: Number(overlay.querySelector('#p-compare').value) || null,
      colours: overlay.querySelector('#p-colours').value.split(',').map(s => s.trim()).filter(Boolean),
      sizes: overlay.querySelector('#p-sizes').value.split(',').map(s => s.trim()).filter(Boolean),
      initialStock: parseInt(overlay.querySelector('#p-stock')?.value || '30', 10),
      lowStockThreshold: parseInt(overlay.querySelector('#p-threshold')?.value || '5', 10),
      description: overlay.querySelector('#p-desc').value.trim(),
      fit: overlay.querySelector('#p-fit').value.trim() || null,
      fabric: overlay.querySelector('#p-fabric').value.trim() || null,
      care: overlay.querySelector('#p-care').value.trim() || null,
      delivery: overlay.querySelector('#p-delivery').value.trim() || null,
      images: currentImages,
      isPublished: overlay.querySelector('#p-published').checked,
    };

    try {
      if (isNew) {
        await createProduct(payload);
        showToast(`Product "${payload.name}" created with ${currentImages.length} photo(s).`);
      } else {
        await updateProduct(product.id, payload);
        showToast(`Product "${payload.name}" updated.`);
      }
      close();
      onSave();
    } catch (err) {
      showToast(err.message, 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = isNew ? 'Create Product & Save Photos' : 'Save Changes';
    }
  });
}
