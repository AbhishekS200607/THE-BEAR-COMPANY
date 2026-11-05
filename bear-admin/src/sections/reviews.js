import {
  getAdminReviews,
  createAdminReview,
  updateAdminReview,
  deleteAdminReview,
  getProducts,
} from '../services/adminService.js';
import { spinner, showToast, openModal } from '../helpers.js';

export async function renderReviews(container) {
  container.innerHTML = spinner();

  // Load products list for dropdown filtering
  const { products } = await getProducts().catch(() => ({ products: [] }));
  
  // State
  let selectedProduct = 'all';
  let selectedRating = 'all';
  let selectedStatus = 'all';
  let searchQuery = '';

  async function loadData() {
    container.innerHTML = spinner();
    const res = await getAdminReviews({
      productId: selectedProduct,
      rating: selectedRating,
      status: selectedStatus,
      search: searchQuery,
    });

    if (res._error) {
      container.innerHTML = `
        <div style="padding:40px;text-align:center;background:#18181b;border:1px solid #27272a;">
          <span class="material-symbols-outlined" style="font-size:36px;color:#f87171;margin-bottom:12px;">error</span>
          <p style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#f4f4f5;margin-bottom:6px;">Error Loading Reviews</p>
          <p style="font-size:12px;color:#71717a;margin-bottom:20px;">${res._error}</p>
          <button id="rev-retry-btn" class="admin-btn primary">Retry</button>
        </div>
      `;
      container.querySelector('#rev-retry-btn')?.addEventListener('click', loadData);
      return;
    }

    const { reviews, stats, metrics } = res;

    container.innerHTML = `
      <div class="section-header">
        <div>
          <p class="section-title">Product Reviews & Moderation</p>
          <p class="section-subtitle">${stats?.total || reviews.length} customer reviews · Server-persisted · Filter based on product</p>
        </div>
        <button class="admin-btn primary" id="add-review-btn">+ Add Verified Review</button>
      </div>

      <!-- Quick Stats KPI Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px;margin-bottom:20px;">
        <div class="card" style="padding:16px;">
          <p style="font-size:11px;color:#71717a;text-transform:uppercase;font-weight:600;margin-bottom:6px;">Total Reviews</p>
          <p style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;color:#f4f4f5;">${stats?.total || 0}</p>
          <p style="font-size:11px;color:#a1a1aa;margin-top:2px;">Across all products</p>
        </div>

        <div class="card" style="padding:16px;">
          <p style="font-size:11px;color:#71717a;text-transform:uppercase;font-weight:600;margin-bottom:6px;">Average Rating</p>
          <div style="display:flex;align-items:baseline;gap:6px;">
            <p style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;color:#fbbf24;">${stats?.averageRating || '5.0'} ★</p>
            <span style="font-size:11px;color:#71717a;">/ 5.0</span>
          </div>
          <p style="font-size:11px;color:#10b981;margin-top:2px;">${metrics?.fitSentiment || 'High satisfaction'}</p>
        </div>

        <div class="card" style="padding:16px;">
          <p style="font-size:11px;color:#71717a;text-transform:uppercase;font-weight:600;margin-bottom:6px;">Published Live</p>
          <p style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;color:#10b981;">${stats?.publishedCount || 0}</p>
          <p style="font-size:11px;color:#71717a;margin-top:2px;">Visible in storefront</p>
        </div>

        <div class="card" style="padding:16px;">
          <p style="font-size:11px;color:#71717a;text-transform:uppercase;font-weight:600;margin-bottom:6px;">Hidden / Flagged</p>
          <p style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;color:#71717a;">${stats?.hiddenCount || 0}</p>
          <p style="font-size:11px;color:#71717a;margin-top:2px;">Unpublished</p>
        </div>
      </div>

      <!-- Filters Row -->
      <div class="card" style="padding:14px;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;">
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;flex:1;">
          <!-- Product Selector -->
          <div style="display:flex;flex-direction:column;gap:3px;">
            <label style="font-size:10px;color:#71717a;text-transform:uppercase;font-weight:600;">Filter by Product</label>
            <select id="filter-product" class="admin-select" style="min-width:200px;font-size:12px;padding:6px 10px;">
              <option value="all" ${selectedProduct === 'all' ? 'selected' : ''}>All Products (${stats?.total || 0})</option>
              ${products.map(p => `
                <option value="${p.id}" ${selectedProduct === p.id ? 'selected' : ''}>${p.name}</option>
              `).join('')}
              <option value="bear-001" ${selectedProduct === 'bear-001' ? 'selected' : ''}>Essential Oversized Tee (bear-001)</option>
              <option value="bear-002" ${selectedProduct === 'bear-002' ? 'selected' : ''}>Training Tee (bear-002)</option>
              <option value="sow-001" ${selectedProduct === 'sow-001' ? 'selected' : ''}>Sculpt Leggings (sow-001)</option>
              <option value="sow-002" ${selectedProduct === 'sow-002' ? 'selected' : ''}>Ribbed Crop Top (sow-002)</option>
            </select>
          </div>

          <!-- Rating Selector -->
          <div style="display:flex;flex-direction:column;gap:3px;">
            <label style="font-size:10px;color:#71717a;text-transform:uppercase;font-weight:600;">Rating</label>
            <select id="filter-rating" class="admin-select" style="width:110px;font-size:12px;padding:6px 10px;">
              <option value="all" ${selectedRating === 'all' ? 'selected' : ''}>All Stars</option>
              <option value="5" ${selectedRating === '5' ? 'selected' : ''}>5 Stars ★★★★★</option>
              <option value="4" ${selectedRating === '4' ? 'selected' : ''}>4 Stars ★★★★☆</option>
              <option value="3" ${selectedRating === '3' ? 'selected' : ''}>3 Stars ★★★☆☆</option>
              <option value="2" ${selectedRating === '2' ? 'selected' : ''}>2 Stars ★★☆☆☆</option>
              <option value="1" ${selectedRating === '1' ? 'selected' : ''}>1 Star ★☆☆☆☆</option>
            </select>
          </div>

          <!-- Status Selector -->
          <div style="display:flex;flex-direction:column;gap:3px;">
            <label style="font-size:10px;color:#71717a;text-transform:uppercase;font-weight:600;">Status</label>
            <select id="filter-status" class="admin-select" style="width:110px;font-size:12px;padding:6px 10px;">
              <option value="all" ${selectedStatus === 'all' ? 'selected' : ''}>All</option>
              <option value="published" ${selectedStatus === 'published' ? 'selected' : ''}>Published</option>
              <option value="hidden" ${selectedStatus === 'hidden' ? 'selected' : ''}>Hidden</option>
            </select>
          </div>
        </div>

        <!-- Search Bar -->
        <div style="display:flex;flex-direction:column;gap:3px;">
          <label style="font-size:10px;color:#71717a;text-transform:uppercase;font-weight:600;">Search Keyword</label>
          <div style="position:relative;">
            <input id="filter-search" class="admin-input" placeholder="Search author, title, words..." value="${searchQuery}" style="font-size:12px;padding:6px 28px 6px 10px;width:200px;" />
            <span class="material-symbols-outlined" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:16px;color:#71717a;pointer-events:none;">search</span>
          </div>
        </div>
      </div>

      <!-- Reviews Data Table -->
      <div class="card" style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th style="min-width:140px;">Product</th>
              <th style="min-width:130px;">Athlete / Author</th>
              <th style="min-width:90px;">Rating</th>
              <th style="min-width:100px;">Fit Sentiment</th>
              <th style="min-width:240px;">Review Headline & Feedback</th>
              <th style="min-width:90px;">Status</th>
              <th style="min-width:110px;">Date</th>
              <th style="min-width:130px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${reviews.length === 0 ? `
              <tr>
                <td colspan="8" style="text-align:center;color:#52525b;padding:36px;">
                  No reviews found matching the selected filters.
                </td>
              </tr>
            ` : reviews.map(r => {
              const starsHtml = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
              const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : (r.date || 'Recently');
              return `
                <tr data-review-id="${r.id}">
                  <td>
                    <p style="color:#e4e4e7;font-weight:600;font-size:12px;">${r.productName || 'BEAR Garment'}</p>
                    <p style="font-size:10px;color:#71717a;font-family:'Space Grotesk',sans-serif;">ID: ${r.productId}</p>
                  </td>
                  <td>
                    <p style="color:#f4f4f5;font-weight:500;">${r.author}</p>
                    ${r.isVerified ? `
                      <span style="display:inline-block;font-size:9px;color:#34d399;font-weight:700;letter-spacing:0.02em;">✓ VERIFIED ATHLETE</span>
                    ` : `
                      <span style="display:inline-block;font-size:9px;color:#71717a;">Guest</span>
                    `}
                  </td>
                  <td>
                    <span style="color:#fbbf24;font-size:13px;letter-spacing:1px;" title="${r.rating} out of 5 stars">${starsHtml}</span>
                    <span style="font-size:11px;color:#a1a1aa;margin-left:2px;font-family:'Space Grotesk',sans-serif;">(${r.rating})</span>
                  </td>
                  <td>
                    <span style="font-size:11px;color:#a1a1aa;background:#27272a;padding:2px 6px;border-radius:3px;">${r.fit || 'True to Size'}</span>
                  </td>
                  <td>
                    <p style="color:#f4f4f5;font-weight:600;font-size:12px;margin-bottom:2px;">${r.title}</p>
                    <p style="color:#a1a1aa;font-size:11px;line-height:1.4;max-width:320px;">${r.comment}</p>
                  </td>
                  <td>
                    <span class="badge ${r.isPublished ? 'badge-green' : 'badge-zinc'}">
                      ${r.isPublished ? 'Published' : 'Hidden'}
                    </span>
                  </td>
                  <td style="font-size:11px;color:#71717a;white-space:nowrap;">
                    ${dateStr}
                  </td>
                  <td>
                    <div style="display:flex;gap:6px;">
                      <button class="admin-btn rev-edit-btn" data-id="${r.id}" style="padding:4px 8px;font-size:10px;">Edit</button>
                      <button class="admin-btn rev-toggle-btn ${r.isPublished ? '' : 'primary'}" data-id="${r.id}" data-published="${r.isPublished}" style="padding:4px 8px;font-size:10px;">
                        ${r.isPublished ? 'Hide' : 'Publish'}
                      </button>
                      <button class="admin-btn rev-del-btn danger" data-id="${r.id}" style="padding:4px 8px;font-size:10px;" title="Delete Review">✕</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Filter listeners
    container.querySelector('#filter-product')?.addEventListener('change', (e) => {
      selectedProduct = e.target.value;
      loadData();
    });

    container.querySelector('#filter-rating')?.addEventListener('change', (e) => {
      selectedRating = e.target.value;
      loadData();
    });

    container.querySelector('#filter-status')?.addEventListener('change', (e) => {
      selectedStatus = e.target.value;
      loadData();
    });

    let searchTimer;
    container.querySelector('#filter-search')?.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchQuery = e.target.value.trim();
      searchTimer = setTimeout(loadData, 350);
    });

    // Create review button
    container.querySelector('#add-review-btn')?.addEventListener('click', () => {
      openReviewDrawer(null, products, loadData);
    });

    // Edit review buttons
    container.querySelectorAll('.rev-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rev = reviews.find(x => x.id === btn.dataset.id);
        if (rev) openReviewDrawer(rev, products, loadData);
      });
    });

    // Toggle publish buttons
    container.querySelectorAll('.rev-toggle-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const isPublished = btn.dataset.published === 'true';
        try {
          await updateAdminReview(btn.dataset.id, { isPublished: !isPublished });
          showToast(`Review ${isPublished ? 'hidden' : 'published'}.`);
          loadData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    // Delete review buttons
    container.querySelectorAll('.rev-del-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Permanently delete this customer review?')) {
          try {
            await deleteAdminReview(btn.dataset.id);
            showToast('Review permanently deleted.');
            loadData();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });
  }

  loadData();
}

function openReviewDrawer(review, products = [], onSave) {
  const isNew = !review;

  const { overlay, panel, close } = openModal(`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <p style="font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;color:#f4f4f5;">
        ${isNew ? 'Create Verified Product Review' : `Edit Review by ${review.author}`}
      </p>
      <button id="modal-close" class="admin-btn" style="padding:4px 8px;font-size:11px;">✕</button>
    </div>

    <form id="review-form" style="display:flex;flex-direction:column;gap:12px;max-height:calc(85vh - 70px);overflow-y:auto;padding-right:4px;">
      <!-- Product Target -->
      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Product Target</label>
        <select id="rev-form-product" class="admin-select" required>
          ${products.map(p => `
            <option value="${p.id}" data-name="${p.name}" ${review?.productId === p.id ? 'selected' : ''}>${p.name} (${p.slug || p.id})</option>
          `).join('')}
          <option value="bear-001" data-name="Essential Oversized Tee" ${review?.productId === 'bear-001' ? 'selected' : ''}>Essential Oversized Tee (bear-001)</option>
          <option value="bear-002" data-name="Training Tee" ${review?.productId === 'bear-002' ? 'selected' : ''}>Training Tee (bear-002)</option>
          <option value="sow-001" data-name="Sculpt High-Waist Ribbed Leggings" ${review?.productId === 'sow-001' ? 'selected' : ''}>Sculpt Leggings (sow-001)</option>
          <option value="sow-002" data-name="Ribbed Contour Crop Top" ${review?.productId === 'sow-002' ? 'selected' : ''}>Ribbed Crop Top (sow-002)</option>
        </select>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Athlete / Author Name</label>
          <input id="rev-form-author" class="admin-input" value="${review?.author || ''}" placeholder="e.g. Vikram Mehta" required />
        </div>
        <div>
          <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Rating</label>
          <select id="rev-form-rating" class="admin-select">
            <option value="5" ${review?.rating === 5 || !review ? 'selected' : ''}>★★★★★ (5 Stars)</option>
            <option value="4" ${review?.rating === 4 ? 'selected' : ''}>★★★★☆ (4 Stars)</option>
            <option value="3" ${review?.rating === 3 ? 'selected' : ''}>★★★☆☆ (3 Stars)</option>
            <option value="2" ${review?.rating === 2 ? 'selected' : ''}>★★☆☆☆ (2 Stars)</option>
            <option value="1" ${review?.rating === 1 ? 'selected' : ''}>★☆☆☆☆ (1 Star)</option>
          </select>
        </div>
      </div>

      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Fit Assessment</label>
        <select id="rev-form-fit" class="admin-select">
          <option value="True to Size" ${review?.fit === 'True to Size' || !review ? 'selected' : ''}>True to Size</option>
          <option value="Runs Slightly Large" ${review?.fit === 'Runs Slightly Large' ? 'selected' : ''}>Runs Slightly Large</option>
          <option value="Runs Slightly Small" ${review?.fit === 'Runs Slightly Small' ? 'selected' : ''}>Runs Slightly Small</option>
          <option value="Perfect Athletic Cut" ${review?.fit === 'Perfect Athletic Cut' ? 'selected' : ''}>Perfect Athletic Cut</option>
          <option value="Relaxed Oversized" ${review?.fit === 'Relaxed Oversized' ? 'selected' : ''}>Relaxed Oversized</option>
        </select>
      </div>

      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Review Headline</label>
        <input id="rev-form-title" class="admin-input" value="${review?.title || ''}" placeholder="e.g. Unbelievable fabric density and drape" required />
      </div>

      <div>
        <label style="display:block;font-size:11px;color:#71717a;margin-bottom:5px;text-transform:uppercase;">Detailed Feedback Content</label>
        <textarea id="rev-form-comment" class="admin-input" rows="4" style="resize:none;" placeholder="Customer detailed review comments..." required>${review?.comment || ''}</textarea>
      </div>

      <div style="display:flex;gap:16px;margin-top:4px;">
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#e4e4e7;cursor:pointer;">
          <input type="checkbox" id="rev-form-verified" ${review?.isVerified !== false ? 'checked' : ''} />
          Verified Athlete Badge
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#e4e4e7;cursor:pointer;">
          <input type="checkbox" id="rev-form-published" ${review?.isPublished !== false ? 'checked' : ''} />
          Published in Storefront
        </label>
      </div>

      <button type="submit" id="rev-form-submit" class="admin-btn primary" style="justify-content:center;padding:10px;margin-top:10px;">
        ${isNew ? 'Create & Publish Review' : 'Save Changes'}
      </button>
    </form>
  `);

  if (panel) panel.style.maxWidth = '500px';
  overlay.querySelector('#modal-close').addEventListener('click', close);

  overlay.querySelector('#review-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = overlay.querySelector('#rev-form-submit');
    btn.disabled = true;
    btn.textContent = 'Saving Review...';

    const prodSelect = overlay.querySelector('#rev-form-product');
    const selectedOption = prodSelect.options[prodSelect.selectedIndex];

    const payload = {
      productId: prodSelect.value,
      productName: selectedOption?.dataset?.name || 'BEAR Garment',
      author: overlay.querySelector('#rev-form-author').value.trim(),
      rating: Number(overlay.querySelector('#rev-form-rating').value),
      fit: overlay.querySelector('#rev-form-fit').value,
      title: overlay.querySelector('#rev-form-title').value.trim(),
      comment: overlay.querySelector('#rev-form-comment').value.trim(),
      isVerified: overlay.querySelector('#rev-form-verified').checked,
      isPublished: overlay.querySelector('#rev-form-published').checked,
    };

    try {
      if (isNew) {
        await createAdminReview(payload);
        showToast(`Review created for "${payload.productName}".`);
      } else {
        await updateAdminReview(review.id, payload);
        showToast('Review updated.');
      }
      close();
      onSave();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = isNew ? 'Create & Publish Review' : 'Save Changes';
    }
  });
}
