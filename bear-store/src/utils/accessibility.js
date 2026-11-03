/**
 * Accessibility utilities: focus management, screen reader announcements
 */

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Trap keyboard focus within a given element.
 * Returns a cleanup function.
 */
export function trapFocus(element) {
  const focusable = Array.from(element.querySelectorAll(FOCUSABLE_SELECTORS));
  if (!focusable.length) return () => {};

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handleKeydown(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  element.addEventListener('keydown', handleKeydown);
  return () => element.removeEventListener('keydown', handleKeydown);
}

/**
 * Restore focus to previousElement.
 */
export function releaseFocus(previousElement) {
  if (previousElement && typeof previousElement.focus === 'function') {
    previousElement.focus();
  }
}

/**
 * Announce a message to screen readers via the aria-live region.
 */
export function announceToScreenReader(message) {
  const announcer = document.getElementById('sr-announcer');
  if (!announcer) return;
  announcer.textContent = '';
  requestAnimationFrame(() => {
    announcer.textContent = message;
  });
}

/**
 * Focus the first focusable element inside a container.
 */
export function manageFocusOnOpen(element) {
  const focusable = element.querySelector(FOCUSABLE_SELECTORS);
  if (focusable) {
    requestAnimationFrame(() => focusable.focus());
  }
}

export default { trapFocus, releaseFocus, announceToScreenReader, manageFocusOnOpen };

