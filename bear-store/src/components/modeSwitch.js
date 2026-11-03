import { getMode, setMode, subscribe } from '../state/store.js';
import { announceToScreenReader } from '../utils/accessibility.js';

export function createModeSwitch() {
  const el = document.createElement('div');
  el.className = 'mode-switch';
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', 'Shopping mode');

  function render() {
    const mode = getMode();
    el.innerHTML = `
      <div class="mode-switch__indicator" id="mode-indicator"></div>
      <button class="mode-switch__btn ${mode === 'bear' ? 'active' : ''}" data-mode="bear" aria-pressed="${mode === 'bear'}">BEAR</button>
      <button class="mode-switch__btn ${mode === 'sow' ? 'active' : ''}" data-mode="sow" aria-pressed="${mode === 'sow'}">SOW</button>
    `;
    updateIndicator(mode);
    attachListeners();
  }

  function updateIndicator(mode) {
    const indicator = el.querySelector('#mode-indicator');
    const bearBtn = el.querySelector('[data-mode="bear"]');
    const sowBtn = el.querySelector('[data-mode="sow"]');
    if (!indicator || !bearBtn || !sowBtn) return;

    if (mode === 'bear') {
      indicator.style.width = bearBtn.offsetWidth + 'px';
      indicator.style.transform = 'translateX(0)';
    } else {
      indicator.style.width = sowBtn.offsetWidth + 'px';
      indicator.style.transform = `translateX(${bearBtn.offsetWidth}px)`;
    }
  }

  function attachListeners() {
    el.querySelectorAll('.mode-switch__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const newMode = btn.dataset.mode;
        if (newMode === getMode()) return;
        setMode(newMode);
        announceToScreenReader(`Switched to ${newMode === 'bear' ? 'BEAR men\'s' : 'SOW women\'s'} collection`);
      });
    });
  }

  render();
  subscribe(() => render());

  return el;
}

export default { createModeSwitch };

