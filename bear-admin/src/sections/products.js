import { getProducts, createProduct, updateProduct, archiveProduct, uploadProductImage } from '../services/adminService.js';
import { fmtCurrency, modeBadge, spinner, showToast, openModal } from '../helpers.js';
import { compressImageToWebP, formatBytes } from '../utils/imageCompressor.js';

export async function renderProducts(container) {
  container.innerHTML = spinner();
  const { products, _error } = await getProducts();

  if (_error) {
    container.innerHTML = `
      <div style="padding:40px;text-align:center;background:#18181b;border:1px solid #27272a;">
        <span class="material-symbols-outlined" style="font-size:36px;color:#f87171;margin-bottom:12px;">error</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#f4f4f5;margin-bottom:6px;">Error Loading Products</p>
        <p style="font-size:12px;color:#71717a;margin-bottom:20px;">${_error}</p>
        <button id="prod-retry-btn" class="admin-btn primary">Retry</button>
      </div>
    `;
    container.querySelector('#prod-retry-btn')?.addEventListener('click', () => renderProducts(container));
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div>
        <p class="section-title">Products</p>
        <p class="section-subtitle">${products.length} catalog items · Synchronized with Supabase</p>
      </div>
      <button class="admin-btn primary" id="add-product-btn">+ Add Product</button>
    </div>

    <div class="card" style="overflow-x:auto;">
      <table>
        <thead><tr>
          <th style="width:50px;">Photo</th>
          <th>Product</th>
          <th>Mode</th>
          <th>Category</th>
          <th>Price</th>
          <th>SKU Identifier</th>
          <th>Status</th>
          <th>Actions</th>
        </tr></thead>
        <tbody>
          ${products.length === 0 ? `
            <tr><td colspan="8" style="text-align:center;color:#52525b;padding:32px;">No products found in database.</td></tr>
          ` : products.map(p => {
            const displayImg = p.primaryImage || (p.images && p.images[0]) || null;
            return `
            <tr data-product-id="${p.id}">
              <td>
                ${displayImg ? `
                  <img src="${displayImg}" alt="${p.name}" style="width:38px;height:48px;object-fit:cover;border-radius:2px;border:1px solid #27272a;background:#09090b;display:block;" onerror="this.onerror=null;this.parentElement.innerHTML='<div style=\\'width:38px;height:48px;border-radius:2px;border:1px dashed #3f3f46;background:#18181b;display:flex;align-items:center;justify-content:center;color:#52525b;\\'><span class=\\'material-symbols-outlined\\' style=\\'font-size:18px;\\'>broken_image</span></div>';" />
                ` : `
                  <div style="width:38px;height:48px;border-radius:2px;border:1px dashed #3f3f46;background:#18181b;display:flex;align-items:center;justify-content:center;color:#52525b;">
                    <span class="material-symbols-outlined" style="font-size:18px;">image</span>
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
                <span class="badge ${p.isPublished ? 'badge-green' : 'badge-zinc'}">${p.isPublished ? 'Published' : 'Draft / Inactive'}</span>
              </td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button class="admin-btn product-edit-btn" data-id="${p.id}" style="padding:4px 8px;font-size:10px;">Edit</button>
                  <button class="admin-btn product-toggle-btn ${p.isPublished ? '' : 'primary'}" data-id="${p.id}" data-published="${p.isPublished}" style="padding:4px 8px;font-size:10px;">
                    ${p.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button class="admin-btn product-archive-btn danger" data-id="${p.id}" style="padding:4px 8px;font-size:10px;" title="Archive product safely">Archive</button>
                </div>
              </td>
            </tr>
          `;}).join('')}
        </tbody>
      </table>
    </div>
  `;

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
      if (confirm('Archive this product? It will be marked inactive but historical order records will remain safe.')) {
        try {
          await archiveProduct(btn.dataset.id);
          showToast('Product archived.');
          renderProducts(container);
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  });
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
          <span class="material-symbols-outlined" style="font-size:24px;color:#60a5fa;margin-bottom:4px;display:block;">cloud_upload</span>
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

      <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
        <input type="checkbox" id="p-published" ${product?.isPublished !== false ? 'checked' : ''} />
        <label for="p-published" style="font-size:12px;color:#e4e4e7;cursor:pointer;">Published in Storefront Catalog</label>
      </div>

      <button type="submit" id="p-save" class="admin-btn primary" style="justify-content:center;padding:10px;margin-top:8px;">
        ${isNew ? 'Create Product & Save Photos' : 'Save Changes'}
      </button>
    </form>
  `);

  if (panel) {
    panel.style.maxWidth = '540px';
  }

  overlay.querySelector('#modal-close').addEventListener('click', close);

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
          <span class="material-symbols-outlined spin" style="font-size:16px;color:#60a5fa;">sync</span>
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
            <span class="material-symbols-outlined spin" style="font-size:16px;color:#34d399;">cloud_upload</span>
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
      description: overlay.querySelector('#p-desc').value.trim(),
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
