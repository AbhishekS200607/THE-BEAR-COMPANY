/**
 * Toast notification manager
 * Max 3 visible at once. Auto-dismiss after 3s.
 */

let container = null;
const activeToasts = [];

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

export function mount(containerEl) {
  container = containerEl;
  container.className = 'toast-container';
}

export function showToast(message, type = 'info', duration = 3000) {
  if (!container) return;

  // Limit to 3 toasts
  while (activeToasts.length >= 3) {
    const oldest = activeToasts.shift();
    oldest?.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${ICONS[type] || ICONS.info}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  activeToasts.push(toast);

  // Auto dismiss
  const timer = setTimeout(() => dismiss(toast), duration);

  toast.addEventListener('click', () => {
    clearTimeout(timer);
    dismiss(toast);
  });

  return toast;
}

function dismiss(toast) {
  if (!toast.isConnected) return;
  toast.classList.add('exiting');
  setTimeout(() => {
    toast.remove();
    const idx = activeToasts.indexOf(toast);
    if (idx >= 0) activeToasts.splice(idx, 1);
  }, 250);
}

export default { mount, showToast };

