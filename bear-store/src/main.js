/**
 * BEAR Store — Main Application Entry Point
 * SPA Router, Layout Initializer & Mode State Manager
 */

import { getMode, setMode, subscribe } from './state/store.js';
import { hasConsent } from './services/cookieService.js';
import { mount as mountAnnouncement } from './components/announcementBar.js';
import { mount as mountHeader } from './components/header.js';
import { mount as mountFooter } from './components/footer.js';
import { mount as mountCartDrawer } from './components/cartDrawer.js';
import { mount as mountSearchOverlay } from './components/searchOverlay.js';
import { mount as mountToast } from './components/toast.js';
import { mount as mountCookieBanner } from './components/cookieBanner.js';
import { initLoadingBar, startLoading, completeLoading } from './components/loadingBar.js';
import { mountScrollToTop } from './components/scrollToTop.js';
import { mountFloatingWhatsApp } from './components/floatingWhatsApp.js';
import { setPageMeta } from './utils/seo.js';
import { initAnimations, initPageAnimations } from './utils/animations.js';
import './styles/animations.css';


// DOM Containers
const announcementContainer = document.getElementById('announcement-bar');
const headerContainer = document.getElementById('site-header');
const pageContainer = document.getElementById('page-content');
const footerContainer = document.getElementById('site-footer');
const cartDrawerContainer = document.getElementById('cart-drawer-root');
const searchOverlayContainer = document.getElementById('search-overlay-root');
const toastContainer = document.getElementById('toast-root');
const cookieBannerContainer = document.getElementById('cookie-banner-root');

// Current route teardown/cleanups
let currentRouteCleanup = null;

// Mode Curtain Overlay element
let modeCurtain = null;

function triggerModeCurtain() {
  if (!modeCurtain) {
    modeCurtain = document.createElement('div');
    modeCurtain.className = 'mode-curtain-overlay';
    document.body.appendChild(modeCurtain);
  }
  modeCurtain.classList.add('active');
  setTimeout(() => {
    modeCurtain.classList.remove('active');
  }, 240);
}

/**
 * Route table definition
 */
async function router(options = {}) {
  startLoading();

  if (currentRouteCleanup && typeof currentRouteCleanup === 'function') {
    currentRouteCleanup();
    currentRouteCleanup = null;
  }

  const rawHash = window.location.hash || '';
  const hash = rawHash.replace(/^#\/?/, '');
  const [path, queryString] = hash.split('?');

  // Scroll to top on standard navigation, retain position when switching mode
  if (!options.preserveScroll) {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // Trigger smooth enter transition animation
  if (pageContainer) {
    pageContainer.classList.remove('page-transition-active');
    void pageContainer.offsetWidth; // trigger reflow
    pageContainer.classList.add('page-transition-active');
  }

  try {
    // Route matching
    if (!path || path === '' || path === 'home') {
      const mode = getMode();
      setPageMeta({
        title: mode === 'sow' ? 'SOW. by BEAR — Women\'s Luxury Activewear' : 'BEAR. — Built For More',
        description: 'Engineered activewear, oversized technical tees, and seamless training essentials. Pan-India express delivery.',
      });
      const { render } = await import('./pages/home.js');
      currentRouteCleanup = await render(pageContainer) || null;
    } else if (path === 'collection') {
      const mode = getMode();
      setPageMeta({
        title: mode === 'sow' ? 'SOW. Collection — Women\'s Athletic' : 'BEAR. — Performance Collection',
        description: 'Explore the complete high-performance activewear collection for athletic training and daily discipline.',
      });
      const { render } = await import('./pages/collection.js');
      currentRouteCleanup = await render(pageContainer) || null;
    } else if (path.startsWith('product/')) {
      const slug = path.replace('product/', '');
      setPageMeta({
        title: 'BEAR. — Product Details',
        description: 'Technical activewear engineered with moisture-wicking polymers and ergonomic stretch fit.',
      });
      const { render } = await import('./pages/product.js');
      await render(pageContainer, slug);
    } else if (path === 'cart') {
      setPageMeta({ title: 'BEAR. — Your Bag', description: 'Review your selected garments and prepare for WhatsApp express checkout.' });
      const { render } = await import('./pages/cart.js');
      currentRouteCleanup = render(pageContainer) || null;
    } else if (path === 'checkout') {
      setPageMeta({ title: 'BEAR. — Checkout', description: 'Complete your pan-India delivery details and order via WhatsApp verification.' });
      const { render } = await import('./pages/checkout.js');
      await render(pageContainer);
    } else if (path === 'auth' || path === 'login' || path === 'signup') {
      setPageMeta({ title: 'BEAR. — Sign In or Create Account' });
      const { render } = await import('./pages/auth.js');
      render(pageContainer);
    } else if (path === 'account') {
      setPageMeta({ title: 'BEAR. — My Account', description: 'Manage your delivery addresses, past orders, and profile.' });
      const { render } = await import('./pages/account.js');
      await render(pageContainer);
    } else if (path === 'wishlist') {
      setPageMeta({ title: 'BEAR. — Wishlist', description: 'Your saved favorite athletic pieces and garments.' });
      const { render } = await import('./pages/wishlist.js');
      currentRouteCleanup = render(pageContainer) || null;
    } else if (path === 'faq') {
      setPageMeta({ title: 'BEAR. — Frequently Asked Questions' });
      const { render } = await import('./pages/faq.js');
      render(pageContainer);
    } else if (path === 'track-order') {
      setPageMeta({ title: 'BEAR. — Track Shipment & PIN Serviceability', description: 'Live BlueDart express air logistics and pin code transit tracker.' });
      const { render } = await import('./pages/trackOrder.js');
      render(pageContainer);
    } else if (path === 'returns' || path === 'swaps') {
      setPageMeta({ title: 'BEAR. — 7-Day Doorstep Swaps' });
      const { render } = await import('./pages/returns.js');
      render(pageContainer);
    } else if (path === 'size-guide') {
      setPageMeta({ title: 'BEAR. — Ergonomic Size & Fit Guide' });
      const { render } = await import('./pages/sizeGuide.js');
      render(pageContainer);
    } else if (path === 'shipping') {
      setPageMeta({ title: 'BEAR. — Shipping & Logistics Policy' });
      const { render } = await import('./pages/shipping.js');
      render(pageContainer);
    } else if (path === 'manifesto') {
      setPageMeta({ title: 'BEAR. — The Discipline Manifesto' });
      const { render } = await import('./pages/manifesto.js');
      render(pageContainer);
    } else if (path === 'textiles' || path === 'fabrics') {
      setPageMeta({ title: 'BEAR. — Technical Textiles & Fabric Lab' });
      const { render } = await import('./pages/textiles.js');
      render(pageContainer);
    } else if (path === 'ethical-production') {
      setPageMeta({ title: 'BEAR. — Ethical Production Hub' });
      const { render } = await import('./pages/ethicalProduction.js');
      render(pageContainer);
    } else if (path === 'athletes') {
      setPageMeta({ title: 'BEAR. — Athlete Club & Ambassador Roster' });
      const { render } = await import('./pages/athletes.js');
      render(pageContainer);
    } else if (path === 'careers') {
      setPageMeta({ title: 'BEAR. — Careers at BEAR' });
      const { render } = await import('./pages/careers.js');
      render(pageContainer);
    } else if (path === 'privacy') {
      setPageMeta({ title: 'BEAR. — Privacy Policy (DPDPA)' });
      const { render } = await import('./pages/legal.js');
      render(pageContainer, 'privacy');
    } else if (path === 'terms') {
      setPageMeta({ title: 'BEAR. — Terms of Service' });
      const { render } = await import('./pages/legal.js');
      render(pageContainer, 'terms');
    } else if (path === 'legal') {
      setPageMeta({ title: 'BEAR. — Trust & Legal Compliance' });
      const { render } = await import('./pages/legal.js');
      render(pageContainer, 'privacy');
    } else if (path === 'contact') {
      setPageMeta({ title: 'BEAR. — Contact Us', description: 'Get in touch with the BEAR support team via WhatsApp, email, or our contact form.' });
      const { render } = await import('./pages/contact.js');
      render(pageContainer);
    } else if (path === 'order-confirmation') {
      setPageMeta({ title: 'BEAR. — Order Confirmed' });
      const { render } = await import('./pages/orderConfirmation.js');
      render(pageContainer);
    } else if (path === 'admin') {
      setPageMeta({ title: 'BEAR. — Admin Portal' });
      const { render } = await import('./pages/admin.js');
      render(pageContainer);
    } else {
      // 404 Not Found fallback
      setPageMeta({ title: 'BEAR. — Page Not Found' });
      pageContainer.innerHTML = `
        <div class="container" style="padding-top: calc(72px + var(--space-12)); padding-bottom: var(--space-16);">
          <div class="empty-state text-center py-20">
            <div class="empty-state__icon text-5xl mb-4">🔍</div>
            <h1 class="empty-state__title font-headline-lg uppercase font-bold text-primary">Page Not Found</h1>
            <p class="empty-state__desc font-body-md text-on-surface-variant mt-2">The page you are looking for does not exist or has been moved.</p>
            <a href="#" class="inline-block mt-6 px-6 py-3 rounded-full bg-primary text-on-primary font-bold text-sm uppercase">Back to Home</a>
          </div>
        </div>
      `;
    }

    // Trigger page-level animations on newly rendered elements
    requestAnimationFrame(() => {
      if (pageContainer) initPageAnimations(pageContainer);
    });
  } finally {
    completeLoading();
  }
}

/**
 * Application initialization
 */
function init() {
  // 1. Sync theme mode with document
  const initialMode = getMode();
  document.documentElement.setAttribute('data-mode', initialMode);

  // 2. Initialize Loading Bar & Floating Widgets
  initLoadingBar();
  mountScrollToTop();
  mountFloatingWhatsApp();

  // 3. Mount permanent layout components
  if (announcementContainer) mountAnnouncement(announcementContainer);
  if (headerContainer) mountHeader(headerContainer);
  if (footerContainer) mountFooter(footerContainer);
  if (cartDrawerContainer) mountCartDrawer(cartDrawerContainer);
  if (searchOverlayContainer) mountSearchOverlay(searchOverlayContainer);
  if (toastContainer) mountToast(toastContainer);
  if (cookieBannerContainer) mountCookieBanner(cookieBannerContainer);

  // 4. Listen for hash changes
  window.addEventListener('hashchange', () => router());

  // 5. Listen for mode changes to smoothly re-render active page & synchronize theme
  window.addEventListener('mode-change', (e) => {
    triggerModeCurtain();
    const mode = e.detail?.mode || getMode();
    document.documentElement.setAttribute('data-mode', mode);
    router({ preserveScroll: true });
  });

  // 6. Initial route execution
  router();

  // 7. Boot all animations
  initAnimations();

  // 7. Analytics — only if user consented
  function initAnalytics() {
    if (!hasConsent('analytics')) return;
    // Placeholder: swap with real analytics SDK (e.g. gtag, Plausible)
    // e.g. window.gtag?.('config', 'G-XXXXXXXX');
    console.debug('[BEAR] Analytics initialised (consent granted)');
  }
  initAnalytics();
  // Re-check when consent changes (user updates preferences)
  window.addEventListener('bear:consent', () => initAnalytics());
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
