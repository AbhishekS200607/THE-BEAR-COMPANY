import { getConsent, setConsent } from '../services/cookieService.js';

export function mount(container) {
  if (getConsent()) return; // already decided

  container.innerHTML = `
    <div class="cookie-banner" role="dialog" aria-label="Cookie consent" aria-live="polite">
      <div class="cookie-banner__inner">
        <div class="cookie-banner__icon">🍪</div>
        <div class="cookie-banner__body">
          <p class="cookie-banner__title">We use cookies</p>
          <p class="cookie-banner__desc">
            We use cookies to personalise content, analyse traffic, and improve your experience.
            <a href="#privacy" class="cookie-banner__link">Privacy Policy</a>
          </p>
        </div>
        <div class="cookie-banner__actions">
          <button class="btn btn-sm btn-secondary cookie-banner__reject">Reject</button>
          <button class="btn btn-sm btn-primary cookie-banner__accept">Accept All</button>
        </div>
      </div>
    </div>
  `;

  const banner = container.querySelector('.cookie-banner');

  // Animate in after a short delay
  requestAnimationFrame(() => {
    requestAnimationFrame(() => banner.classList.add('cookie-banner--visible'));
  });

  function dismiss(choice) {
    setConsent(choice);
    banner.classList.remove('cookie-banner--visible');
    banner.classList.add('cookie-banner--hiding');
    banner.addEventListener('transitionend', () => container.innerHTML = '', { once: true });
  }

  container.querySelector('.cookie-banner__accept').addEventListener('click', () => dismiss('accepted'));
  container.querySelector('.cookie-banner__reject').addEventListener('click', () => dismiss('rejected'));
}

export default { mount };
