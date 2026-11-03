/**
 * Generic Modal primitive
 */
import { trapFocus, releaseFocus } from '../utils/accessibility.js';

let backdropEl = null;
let modalEl = null;
let previousFocus = null;
let releaseTrap = null;

export function createModal({ id = 'modal', title = '', content = '', size = 'md' } = {}) {
  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = `${id}-backdrop`;

  // Modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = id;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', `${id}-title`);
  modal.setAttribute('aria-hidden', 'true');

  if (size === 'lg') modal.style.width = '700px';
  if (size === 'sm') modal.style.width = '360px';

  modal.innerHTML = `
    <div class="modal__header">
      <h2 class="modal__title" id="${id}-title">${title}</h2>
      <button class="modal__close" id="${id}-close" aria-label="Close dialog">×</button>
    </div>
    <div class="modal__body">${typeof content === 'string' ? content : ''}</div>
  `;

  if (content instanceof HTMLElement) {
    modal.querySelector('.modal__body').appendChild(content);
  }

  document.getElementById('modal-root').appendChild(backdrop);
  document.getElementById('modal-root').appendChild(modal);

  function open() {
    previousFocus = document.activeElement;
    modal.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('visible');
    modal.classList.add('open');
    document.body.classList.add('scroll-locked');
    releaseTrap = trapFocus(modal);
    requestAnimationFrame(() => modal.querySelector('.modal__close')?.focus());
  }

  function close() {
    backdrop.classList.remove('visible');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('scroll-locked');
    if (releaseTrap) releaseTrap();
    setTimeout(() => releaseFocus(previousFocus), 300);
  }

  modal.querySelector(`#${id}-close`)?.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  return { open, close, modal, backdrop };
}

export default { createModal };

