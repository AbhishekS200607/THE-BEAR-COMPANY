import { getMode, setMode, subscribe } from '../state/store.js';
import { announceToScreenReader } from '../utils/accessibility.js';

export function createModeSwitch() {
  const el = document.createElement('button');
  el.setAttribute('role', 'switch');
  el.setAttribute('aria-label', 'Toggle between BEAR and SOW collection');
  el.type = 'button';

  function render() {
    const mode = getMode();
    const isSow = mode === 'sow';

    el.className = `mode-switch${isSow ? ' mode-switch--sow' : ''}`;
    el.setAttribute('aria-checked', isSow ? 'true' : 'false');

    el.innerHTML = `
      <div class="mode-switch__thumb${isSow ? ' mode-switch__thumb--sow' : ''}"></div>
      <div class="mode-switch__labels">
        <span class="mode-switch__label mode-switch__label--bear">BEAR</span>
        <span class="mode-switch__label mode-switch__label--sow">SOW</span>
      </div>
    `;
  }

  el.addEventListener('click', () => {
    const next = getMode() === 'bear' ? 'sow' : 'bear';
    setMode(next);
    announceToScreenReader(`Switched to ${next === 'bear' ? 'BEAR men\'s' : 'SOW women\'s'} collection`);
  });

  render();
  subscribe(() => render());

  return el;
}

export default { createModeSwitch };
