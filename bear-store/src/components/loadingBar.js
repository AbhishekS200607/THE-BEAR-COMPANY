/**
 * Top Page Loading Progress Bar
 * Simulates YouTube / GitHub style thin top progress indicator during route swaps.
 */

let barElement = null;
let progress = 0;
let timer = null;

export function initLoadingBar() {
  if (barElement) return;

  barElement = document.createElement('div');
  barElement.id = 'top-loading-bar';
  barElement.setAttribute('aria-hidden', 'true');
  barElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    width: 0%;
    background: var(--color-accent, #000);
    z-index: 99999;
    pointer-events: none;
    transition: width 0.25s ease, opacity 0.3s ease;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
    opacity: 0;
  `;
  document.body.appendChild(barElement);
}

export function startLoading() {
  if (!barElement) initLoadingBar();
  if (timer) clearInterval(timer);

  progress = 15;
  barElement.style.opacity = '1';
  barElement.style.width = `${progress}%`;

  // Incrementally advance to 80%
  timer = setInterval(() => {
    if (progress < 80) {
      progress += Math.floor(Math.random() * 12) + 5;
      if (progress > 85) progress = 85;
      barElement.style.width = `${progress}%`;
    }
  }, 120);
}

export function completeLoading() {
  if (!barElement) return;
  if (timer) clearInterval(timer);

  progress = 100;
  barElement.style.width = '100%';

  setTimeout(() => {
    barElement.style.opacity = '0';
    setTimeout(() => {
      barElement.style.width = '0%';
    }, 300);
  }, 200);
}

export default { initLoadingBar, startLoading, completeLoading };
