import * as XLSX from 'xlsx';
import { getInventory, updateInventory, bulkImportInventory } from '../services/adminService.js';
import { stockChip, modeBadge, spinner, showToast, openModal } from '../helpers.js';

export async function renderInventory(container) {
  container.innerHTML = spinner();
  const { inventory, _error } = await getInventory();

  if (_error) {
    container.innerHTML = `
      <div style="padding:40px;text-align:center;background:#18181b;border:1px solid #27272a;">
        <span class="material-symbols-outlined" style="font-size:36px;color:#f87171;margin-bottom:12px;">warehouse</span>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#f4f4f5;margin-bottom:6px;">Error Loading Inventory</p>
        <p style="font-size:12px;color:#71717a;margin-bottom:20px;">${_error}</p>
        <button id="inv-retry-btn" class="admin-btn primary">Retry</button>
      </div>
    `;
    container.querySelector('#inv-retry-btn')?.addEventListener('click', () => renderInventory(container));
    return;
  }

  const grouped = {};
  for (const v of inventory) {
    const key = v.productName || 'Unassigned Product';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(v);
  }

  const lowCount = inventory.filter(v => (v.quantityAvailable - v.quantityReserved) <= v.lowStockThreshold).length;

  container.innerHTML = `
    <div class="section-header" style="flex-wrap:wrap;gap:12px;">
      <div>
        <p class="section-title">Inventory Matrix</p>
        <p class="section-subtitle">${inventory.length} tracked variant SKUs · ${lowCount} low stock alerts · Real-time Supabase stock</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <button id="inv-export-btn" class="admin-btn" title="Export current inventory to Excel (.xlsx)">
          <span class="material-symbols-outlined" style="font-size:16px;">download</span> Export Excel
        </button>
        <button id="inv-template-btn" class="admin-btn" title="Download Excel template for inventory updates">
          <span class="material-symbols-outlined" style="font-size:16px;">description</span> Template
        </button>
        <button id="inv-import-btn" class="admin-btn primary" title="Upload Excel spreadsheet to bulk update stock">
          <span class="material-symbols-outlined" style="font-size:16px;">upload_file</span> Import Excel
        </button>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:16px;" id="inv-groups">
      ${Object.keys(grouped).length === 0 ? `
        <div class="card" style="padding:32px;text-align:center;color:#71717a;">No variant inventory found in database.</div>
      ` : Object.entries(grouped).map(([name, variants]) => `
        <div class="card">
          <div style="padding:12px 16px;border-bottom:1px solid #27272a;display:flex;align-items:center;gap:12px;">
            ${variants[0]?.imageUrl ? `
              <img src="${variants[0].imageUrl}" alt="${name}" style="width:36px;height:44px;object-fit:cover;border-radius:2px;border:1px solid #27272a;background:#09090b;display:block;" onerror="this.onerror=null;this.parentElement.innerHTML='<div style=\\'width:36px;height:44px;border-radius:2px;border:1px dashed #3f3f46;background:#18181b;display:flex;align-items:center;justify-content:center;color:#52525b;\\'><span class=\\'material-symbols-outlined\\' style=\\'font-size:18px;\\'>image</span></div>';" />
            ` : `
              <div style="width:36px;height:44px;border-radius:2px;border:1px dashed #3f3f46;background:#18181b;display:flex;align-items:center;justify-content:center;color:#52525b;">
                <span class="material-symbols-outlined" style="font-size:18px;">image</span>
              </div>
            `}
            <div>
              <p style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;color:#f4f4f5;">${name}</p>
              <div style="display:flex;gap:6px;align-items:center;margin-top:2px;">
                ${modeBadge(variants[0]?.mode || 'bear')}
                <span style="font-size:11px;color:#71717a;">${variants.length} SKU variant${variants.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          <div style="overflow-x:auto;">
            <table>
              <thead><tr>
                <th>SKU</th>
                <th>Colour</th>
                <th>Size</th>
                <th>Available</th>
                <th>Reserved</th>
                <th>Threshold</th>
                <th>Stock Health</th>
                <th>Quick Adjust</th>
              </tr></thead>
              <tbody>
                ${variants.map(v => `
                  <tr data-variant="${v.variantId}">
                    <td style="font-size:11px;color:#71717a;font-family:'Space Grotesk',sans-serif;">${v.sku}</td>
                    <td>${v.colour}</td>
                    <td style="font-family:'Space Grotesk',sans-serif;font-weight:700;">${v.size}</td>
                    <td class="qty-cell" style="font-family:'Space Grotesk',sans-serif;font-weight:700;color:${v.quantityAvailable === 0 ? '#f87171' : v.quantityAvailable <= v.lowStockThreshold ? '#fbbf24' : '#f4f4f5'};">
                      ${v.quantityAvailable}
                    </td>
                    <td style="color:#52525b;">${v.quantityReserved}</td>
                    <td style="color:#71717a;font-size:12px;">${v.lowStockThreshold}</td>
                    <td class="chip-cell">${stockChip(v.quantityAvailable - v.quantityReserved, v.lowStockThreshold)}</td>
                    <td>
                      <div style="display:flex;gap:4px;">
                        <button class="admin-btn inv-dec" data-id="${v.variantId}" style="padding:3px 8px;font-size:14px;line-height:1;" title="Decrease 1 unit">−</button>
                        <button class="admin-btn inv-inc" data-id="${v.variantId}" style="padding:3px 8px;font-size:14px;line-height:1;" title="Increase 1 unit">+</button>
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

  // Attach Export Button
  container.querySelector('#inv-export-btn')?.addEventListener('click', () => {
    exportToExcel(inventory);
  });

  // Attach Template Button
  container.querySelector('#inv-template-btn')?.addEventListener('click', () => {
    downloadTemplate(inventory);
  });

  // Attach Import Button
  container.querySelector('#inv-import-btn')?.addEventListener('click', () => {
    openImportModal(inventory, () => renderInventory(container));
  });

  const qtyMap = {};
  for (const v of inventory) {
    qtyMap[v.variantId] = { qty: v.quantityAvailable, threshold: v.lowStockThreshold, reserved: v.quantityReserved };
  }

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
        if (chipEl) chipEl.innerHTML = stockChip(newQty - entry.reserved, entry.threshold);
      }

      try {
        await updateInventory(id, { quantityAvailable: newQty });
        showToast('Inventory stock adjusted.');
      } catch (err) {
        showToast(err.message, 'error');
        renderInventory(container);
      }
    });
  });
}

function exportToExcel(inventory) {
  try {
    const rows = inventory.map(v => ({
      'SKU': v.sku,
      'Product Name': v.productName || 'Unassigned',
      'Mode': (v.mode || 'BEAR').toUpperCase(),
      'Colour': v.colour || '',
      'Size': v.size || '',
      'Quantity Available': v.quantityAvailable,
      'Quantity Reserved': v.quantityReserved,
      'Low Stock Threshold': v.lowStockThreshold,
      'Stock Health': v.quantityAvailable === 0 ? 'Out of Stock' : (v.quantityAvailable - v.quantityReserved) <= v.lowStockThreshold ? 'Low Stock' : 'In Stock'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 24 }, // SKU
      { wch: 30 }, // Product Name
      { wch: 10 }, // Mode
      { wch: 16 }, // Colour
      { wch: 8 },  // Size
      { wch: 18 }, // Quantity Available
      { wch: 18 }, // Quantity Reserved
      { wch: 20 }, // Low Stock Threshold
      { wch: 15 }, // Stock Health
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    const filename = `BEAR_Inventory_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    showToast(`Exported ${rows.length} variants to ${filename}`);
  } catch (err) {
    showToast('Failed to export inventory: ' + err.message, 'error');
  }
}

function downloadTemplate(inventory) {
  try {
    const rows = inventory.map(v => ({
      'SKU': v.sku,
      'Product Name': v.productName || '',
      'Size': v.size || '',
      'Colour': v.colour || '',
      'Quantity Available': v.quantityAvailable,
      'Low Stock Threshold': v.lowStockThreshold,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 24 }, // SKU
      { wch: 30 }, // Product Name
      { wch: 8 },  // Size
      { wch: 16 }, // Colour
      { wch: 18 }, // Quantity Available
      { wch: 20 }, // Low Stock Threshold
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory_Template');
    XLSX.writeFile(wb, 'BEAR_Inventory_Template.xlsx');
    showToast('Downloaded inventory template with catalog SKUs');
  } catch (err) {
    showToast('Failed to download template: ' + err.message, 'error');
  }
}

function findColumnValue(row, candidates) {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const foundKey = keys.find(k => k.trim().toLowerCase() === c.toLowerCase());
    if (foundKey !== undefined && row[foundKey] !== undefined && row[foundKey] !== null) {
      return row[foundKey];
    }
  }
  return undefined;
}

function openImportModal(inventory, onComplete) {
  const skuMap = new Map();
  inventory.forEach(v => {
    if (v.sku) skuMap.set(v.sku.toUpperCase().trim(), v);
  });

  const modalHtml = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
      <div>
        <p style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#f4f4f5;display:flex;align-items:center;gap:8px;">
          <span class="material-symbols-outlined" style="color:#fbbf24;">upload_file</span>
          Import Inventory from Excel / CSV
        </p>
        <p style="font-size:12px;color:#71717a;margin-top:4px;">
          Upload an Excel (.xlsx, .xls) or CSV file. Supported columns: <strong>SKU</strong>, <strong>Quantity Available</strong> (or <strong>Stock</strong>), and optional <strong>Low Stock Threshold</strong>.
        </p>
      </div>
      <button id="import-modal-close" class="admin-btn" style="padding:4px 8px;font-size:12px;">✕</button>
    </div>

    <!-- Drop Zone -->
    <div id="import-drop-zone" style="border:2px dashed #3f3f46;background:#141417;padding:30px 20px;text-align:center;cursor:pointer;transition:border-color 0.2s, background 0.2s;margin-bottom:16px;border-radius:4px;">
      <span class="material-symbols-outlined" style="font-size:36px;color:#71717a;margin-bottom:6px;">table_chart</span>
      <p style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;color:#e4e4e7;margin-bottom:4px;">
        Click to browse or drag & drop Excel / CSV file here
      </p>
      <p style="font-size:11px;color:#71717a;">Formats: .xlsx, .xls, .csv</p>
      <input type="file" id="import-file-input" accept=".xlsx,.xls,.csv" style="display:none;" />
    </div>

    <!-- Summary Bar -->
    <div id="import-summary-bar" style="display:none;margin-bottom:14px;padding:12px 16px;background:#18181b;border:1px solid #27272a;border-radius:4px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span id="import-file-name" style="font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:600;color:#f4f4f5;"></span>
        <button id="import-reselect-btn" class="admin-btn" style="padding:2px 8px;font-size:11px;">Select Another File</button>
      </div>
      <div style="display:flex;gap:16px;font-size:12px;flex-wrap:wrap;">
        <div style="color:#a1a1aa;"><strong id="sum-total" style="color:#f4f4f5;font-family:'Space Grotesk',sans-serif;">0</strong> total rows</div>
        <div style="color:#34d399;"><strong id="sum-valid" style="color:#34d399;font-family:'Space Grotesk',sans-serif;">0</strong> valid updates</div>
        <div style="color:#f87171;"><strong id="sum-errors" style="color:#f87171;font-family:'Space Grotesk',sans-serif;">0</strong> errors / warnings</div>
      </div>
    </div>

    <!-- Preview Table -->
    <div id="import-preview-wrapper" style="display:none;max-height:320px;overflow-y:auto;border:1px solid #27272a;margin-bottom:18px;border-radius:4px;">
      <table style="width:100%;font-size:12px;">
        <thead>
          <tr style="background:#121214;position:sticky;top:0;z-index:1;">
            <th style="padding:8px 10px;">SKU</th>
            <th style="padding:8px 10px;">Product Name</th>
            <th style="padding:8px 10px;text-align:right;">Current</th>
            <th style="padding:8px 10px;text-align:right;">New Stock</th>
            <th style="padding:8px 10px;text-align:right;">Reserved</th>
            <th style="padding:8px 10px;text-align:center;">Status</th>
          </tr>
        </thead>
        <tbody id="import-preview-tbody"></tbody>
      </table>
    </div>

    <!-- Actions -->
    <div style="display:flex;justify-content:flex-end;gap:10px;align-items:center;">
      <button id="import-cancel-btn" class="admin-btn">Cancel</button>
      <button id="import-apply-btn" class="admin-btn primary" disabled>
        <span class="material-symbols-outlined" style="font-size:16px;">check</span>
        Apply Bulk Stock Update
      </button>
    </div>
  `;

  const { overlay, panel, close } = openModal(modalHtml);
  panel.style.maxWidth = '780px';

  overlay.querySelector('#import-modal-close')?.addEventListener('click', close);
  overlay.querySelector('#import-cancel-btn')?.addEventListener('click', close);

  const fileInput = overlay.querySelector('#import-file-input');
  const dropZone = overlay.querySelector('#import-drop-zone');
  const summaryBar = overlay.querySelector('#import-summary-bar');
  const fileNameEl = overlay.querySelector('#import-file-name');
  const sumTotalEl = overlay.querySelector('#sum-total');
  const sumValidEl = overlay.querySelector('#sum-valid');
  const sumErrorsEl = overlay.querySelector('#sum-errors');
  const previewWrapper = overlay.querySelector('#import-preview-wrapper');
  const previewTbody = overlay.querySelector('#import-preview-tbody');
  const applyBtn = overlay.querySelector('#import-apply-btn');
  const reselectBtn = overlay.querySelector('#import-reselect-btn');

  dropZone?.addEventListener('click', () => fileInput?.click());
  reselectBtn?.addEventListener('click', () => fileInput?.click());

  dropZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#fbbf24';
    dropZone.style.background = '#1c1917';
  });

  dropZone?.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#3f3f46';
    dropZone.style.background = '#141417';
  });

  dropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#3f3f46';
    dropZone.style.background = '#141417';
    if (e.dataTransfer?.files?.length) {
      processFile(e.dataTransfer.files[0]);
    }
  });

  fileInput?.addEventListener('change', () => {
    if (fileInput.files?.length) {
      processFile(fileInput.files[0]);
    }
  });

  let parsedItemsToApply = [];

  function processFile(file) {
    if (!file) return;
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          throw new Error('Workbook contains no sheets.');
        }

        const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
        if (!rawRows || rawRows.length === 0) {
          throw new Error('Sheet is empty or has no recognizable data rows.');
        }

        parseAndRenderRows(file.name, rawRows);
      } catch (err) {
        showToast('Error parsing file: ' + err.message, 'error');
      }
    };

    reader.readAsArrayBuffer(file);
  }

  function parseAndRenderRows(fileName, rawRows) {
    const skuCandidates = ['sku', 'variant sku', 'item sku', 'code', 'product sku', 'barcode'];
    const qtyCandidates = ['quantity available', 'quantity_available', 'available stock', 'stock', 'quantity', 'qty', 'units', 'available', 'available_stock', 'new stock', 'new_stock'];
    const thresholdCandidates = ['low stock threshold', 'low_stock_threshold', 'threshold', 'low stock', 'min stock', 'alert threshold'];

    const parsedList = [];
    let validCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rawSku = findColumnValue(row, skuCandidates);
      const rawQty = findColumnValue(row, qtyCandidates);
      const rawThresh = findColumnValue(row, thresholdCandidates);

      // Skip completely empty rows
      if (rawSku === undefined && rawQty === undefined) continue;

      const sku = String(rawSku || '').trim().toUpperCase();
      const variant = skuMap.get(sku);

      let isValid = false;
      let statusText = '';
      let statusColor = '#f87171';
      let parsedQty = null;
      let parsedThresh = null;

      if (!sku) {
        statusText = 'Missing SKU';
      } else if (!variant) {
        statusText = 'SKU Not in Catalog';
      } else if (rawQty === undefined || rawQty === '') {
        statusText = 'Missing Quantity';
      } else {
        parsedQty = parseInt(rawQty, 10);
        if (isNaN(parsedQty) || parsedQty < 0) {
          statusText = `Invalid Qty (${rawQty})`;
        } else if (parsedQty < variant.quantityReserved) {
          statusText = `Conflict: ${parsedQty} < ${variant.quantityReserved} reserved`;
          statusColor = '#fbbf24';
        } else {
          isValid = true;
          statusText = 'Ready';
          statusColor = '#34d399';
        }
      }

      if (rawThresh !== undefined && rawThresh !== '') {
        const pt = parseInt(rawThresh, 10);
        if (!isNaN(pt) && pt >= 0) parsedThresh = pt;
      }

      if (isValid) {
        validCount++;
        parsedList.push({
          sku,
          variantId: variant.variantId,
          productName: variant.productName,
          size: variant.size,
          colour: variant.colour,
          currentQty: variant.quantityAvailable,
          reserved: variant.quantityReserved,
          newQty: parsedQty,
          threshold: parsedThresh,
          isValid: true,
          statusText,
          statusColor,
        });
      } else {
        errorCount++;
        parsedList.push({
          sku: sku || '—',
          productName: variant ? variant.productName : '—',
          size: variant ? variant.size : '—',
          colour: variant ? variant.colour : '—',
          currentQty: variant ? variant.quantityAvailable : '—',
          reserved: variant ? variant.quantityReserved : '—',
          newQty: rawQty !== undefined ? rawQty : '—',
          threshold: parsedThresh,
          isValid: false,
          statusText,
          statusColor,
        });
      }
    }

    parsedItemsToApply = parsedList.filter(item => item.isValid);

    // Update UI elements
    dropZone.style.display = 'none';
    summaryBar.style.display = 'block';
    previewWrapper.style.display = 'block';

    fileNameEl.textContent = fileName;
    sumTotalEl.textContent = parsedList.length;
    sumValidEl.textContent = validCount;
    sumErrorsEl.textContent = errorCount;

    previewTbody.innerHTML = parsedList.map(item => `
      <tr style="background:${item.isValid ? 'transparent' : 'rgba(239,68,68,0.06)'};">
        <td style="font-family:'Space Grotesk',sans-serif;font-weight:600;color:${item.isValid ? '#f4f4f5' : '#f87171'};">${item.sku}</td>
        <td style="color:#a1a1aa;">${item.productName} <span style="font-size:10px;color:#71717a;">${item.size || ''} ${item.colour || ''}</span></td>
        <td style="text-align:right;color:#71717a;">${item.currentQty}</td>
        <td style="text-align:right;font-weight:700;color:${item.isValid ? '#34d399' : '#f87171'};font-family:'Space Grotesk',sans-serif;">${item.newQty}</td>
        <td style="text-align:right;color:#71717a;">${item.reserved}</td>
        <td style="text-align:center;">
          <span style="display:inline-block;padding:2px 6px;border-radius:2px;font-size:10px;font-family:'Space Grotesk',sans-serif;font-weight:700;color:${item.statusColor};background:${item.statusColor}15;border:1px solid ${item.statusColor}30;">
            ${item.statusText}
          </span>
        </td>
      </tr>
    `).join('');

    if (parsedItemsToApply.length > 0) {
      applyBtn.removeAttribute('disabled');
      applyBtn.innerHTML = `
        <span class="material-symbols-outlined" style="font-size:16px;">check</span>
        Apply Stock Update (${parsedItemsToApply.length} items)
      `;
    } else {
      applyBtn.setAttribute('disabled', 'true');
      applyBtn.innerHTML = `
        <span class="material-symbols-outlined" style="font-size:16px;">block</span>
        No Valid Rows to Apply
      `;
    }
  }

  applyBtn?.addEventListener('click', async () => {
    if (parsedItemsToApply.length === 0) return;

    applyBtn.setAttribute('disabled', 'true');
    applyBtn.innerHTML = `<span class="spinner" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:6px;"></span> Updating Supabase...`;

    try {
      const payload = parsedItemsToApply.map(item => ({
        sku: item.sku,
        variantId: item.variantId,
        quantityAvailable: item.newQty,
        lowStockThreshold: typeof item.threshold === 'number' ? item.threshold : undefined,
      }));

      const res = await bulkImportInventory(payload);
      showToast(`Successfully updated stock for ${res.updatedCount} variants!`);
      close();
      if (typeof onComplete === 'function') onComplete();
    } catch (err) {
      showToast('Import failed: ' + err.message, 'error');
      applyBtn.removeAttribute('disabled');
      applyBtn.innerHTML = `
        <span class="material-symbols-outlined" style="font-size:16px;">check</span>
        Apply Stock Update (${parsedItemsToApply.length} items)
      `;
    }
  });
}
