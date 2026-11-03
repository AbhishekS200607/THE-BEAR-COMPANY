/**
 * Generic Drawer primitive (right, left, bottom)
 */
import { trapFocus, releaseFocus } from '../utils/accessibility.js';

export function createDrawer({ id = 'drawer', side = 'right', title = '', content = '' } = {}) {
  const backdrop = document.createElement('div');
  backdrop.className = 'overlay';
  backdrop.id = `${id}-backdrop`;

  const drawer = document.createElement('div');
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-labelledby', `${id}-title`);
  drawer.setAttribute('aria-hidden', 'true');
  drawer.id = id;

  // Inline position styles based on side
  const baseStyle = `
    position: fixed; z-index: var(--z-drawer);
    background: var(--color-bg); box-shadow: var(--shadow-lg);
    transition: transform var(--transition-slow);
    display: flex; flex-direction: column;
  `;
  if (side === 'right') {
    drawer.style.cssText = `${baseStyle} top:0; right:0; bottom:0; width:min(420px,100vw); transform:translateX(100%);`;
  } else if (side === 'left') {
    drawer.style.cssText = `${baseStyle} top:0; left:0; bottom:0; width:min(320px,100vw); transform:translateX(-100%);`;
  } else if (side === 'bottom') {
    drawer.style.cssText = `${baseStyle} bottom:0; left:0; right:0; max-height:90vh; transform:translateY(100%); border-radius: var(--radius-xl) var(--radius-xl) 0 0;`;
  }

  drawer.innerHTML = `
    <div class="cart-drawer__header">
      <h2 class="cart-drawer__title" id="${id}-title">${title}</h2>
      <button class="cart-drawer__close" id="${id}-close" aria-label="Close">×</button>
    </div>
    <div class="cart-drawer__body" id="${id}-body">
      ${typeof content === 'string' ? content : ''}
    </div>
  `;

  if (content instanceof HTMLElement) {
    drawer.querySelector(`#${id}-body`).appendChild(content);
  }

  const root = document.getElementById('modal-root');
  root.appendChild(backdrop);
  root.appendChild(drawer);

  let previousFocus = null;
  let releaseTrap = null;

  function open() {
    previousFocus = document.activeElement;
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('active');
    drawer.style.transform = 'none';
    document.body.classList.add('scroll-locked');
    releaseTrap = trapFocus(drawer);
    requestAnimationFrame(() => drawer.querySelector(`#${id}-close`)?.focus());
  }

  function close() {
    if (side === 'right') drawer.style.transform = 'translateX(100%)';
    else if (side === 'left') drawer.style.transform = 'translateX(-100%)';
    else drawer.style.transform = 'translateY(100%)';
    backdrop.classList.remove('active');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('scroll-locked');
    if (releaseTrap) releaseTrap();
    setTimeout(() => releaseFocus(previousFocus), 400);
  }

  drawer.querySelector(`#${id}-close`)?.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  drawer.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  return { open, close, drawer, backdrop };
}

export default { createDrawer };

