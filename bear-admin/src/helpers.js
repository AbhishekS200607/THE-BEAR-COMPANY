/**
 * BEAR Admin — Shared Helpers
 */

export function fmtCurrency(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

export function fmt(n) {
  return Number(n).toLocaleString('en-IN');
}

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function statusBadge(status) {
  const map = {
    pending_whatsapp: 'badge-amber',
    confirmed:        'badge-blue',
    processing:       'badge-purple',
    shipped:          'badge-cyan',
    delivered:        'badge-green',
    cancelled:        'badge-red',
    returned:         'badge-zinc',
  };
  const cls = map[status] || 'badge-zinc';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `<span class="badge ${cls}">${label}</span>`;
}

export function stockChip(qty, threshold) {
  if (qty === 0) return `<span class="badge badge-red">OUT</span>`;
  if (qty <= threshold) return `<span class="badge badge-amber">LOW</span>`;
  return `<span class="badge badge-green">OK</span>`;
}

export function modeBadge(mode) {
  return mode === 'sow'
    ? `<span class="badge badge-sow">SOW</span>`
    : `<span class="badge badge-bear">BEAR</span>`;
}

export function spinner() {
  return `<div style="display:flex;align-items:center;justify-content:center;padding:60px 0;"><div class="spinner"></div></div>`;
}

export function mockBanner() {
  return `<div class="mock-banner">⚡ Mock data — backend offline. All changes are local to this session.</div>`;
}

export function openModal(html) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-panel">${html}</div>`;
  document.body.appendChild(overlay);

  function close() { overlay.remove(); }
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  return { overlay, panel: overlay.querySelector('.modal-panel'), close };
}

export function showToast(msg, type = 'success') {
  const el = document.createElement('div');
  const bg = type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)';
  const border = type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)';
  const color = type === 'error' ? '#f87171' : '#34d399';
  el.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:999;padding:10px 16px;background:${bg};border:1px solid ${border};color:${color};font-size:12px;font-family:'Space Grotesk',sans-serif;font-weight:600;letter-spacing:0.04em;max-width:320px;`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
