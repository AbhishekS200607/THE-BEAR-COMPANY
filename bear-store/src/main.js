/**
 * BEAR Store — Main Application Entry Point
 * SPA Router, Layout Initializer & Mode State Manager
 */

import { getMode, setMode, subscribe } from './state/store.js';
import { mount as mountAnnouncement } from './components/announcementBar.js';
import { mount as mountHeader } from './components/header.js';
import { mount as mountFooter } from './components/footer.js';
import { mount as mountCartDrawer } from './components/cartDrawer.js';
import { mount as mountSearchOverlay } from './components/searchOverlay.js';
import { mount as mountToast } from './components/toast.js';
import { mount as mountCookieBanner } from './components/cookieBanner.js';

// Pages
import { render as renderHome } from './pages/home.js';
import { render as renderCollection } from './pages/collection.js';
import { render as renderProduct } from './pages/product.js';
import { render as renderCart } from './pages/cart.js';
import { render as renderCheckout } from './pages/checkout.js';
import { render as renderAccount } from './pages/account.js';
import { render as renderWishlist } from './pages/wishlist.js';
import { render as renderFAQ } from './pages/faq.js';
import { render as renderTrackOrder } from './pages/trackOrder.js';
import { render as renderReturns } from './pages/returns.js';
import { render as renderSizeGuide } from './pages/sizeGuide.js';
import { render as renderShipping } from './pages/shipping.js';
import { render as renderManifesto } from './pages/manifesto.js';
import { render as renderTextiles } from './pages/textiles.js';
import { render as renderEthicalProduction } from './pages/ethicalProduction.js';
import { render as renderAthletes } from './pages/athletes.js';
import { render as renderCareers } from './pages/careers.js';
import { render as renderLegal } from './pages/legal.js';

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

/**
 * Route table definition
 */
async function router(options = {}) {
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

  // Route matching
  if (!path || path === '' || path === 'home') {
    const mode = getMode();
    document.title = mode === 'sow' ? 'SOW. by BEAR — Women\'s Luxury Activewear' : 'BEAR. — Built For More';
    await renderHome(pageContainer);
  } else if (path === 'collection') {
    const mode = getMode();
    document.title = mode === 'sow' ? 'SOW. Collection — Women\'s Athletic' : 'BEAR. — Performance Collection';
    await renderCollection(pageContainer);
  } else if (path.startsWith('product/')) {
    const slug = path.replace('product/', '');
    document.title = 'BEAR. — Product Details';
    await renderProduct(pageContainer, slug);
  } else if (path === 'cart') {
    document.title = 'BEAR. — Your Bag';
    renderCart(pageContainer);
  } else if (path === 'checkout') {
    document.title = 'BEAR. — Checkout';
    renderCheckout(pageContainer);
  } else if (path === 'account') {
    document.title = 'BEAR. — My Account';
    await renderAccount(pageContainer);
  } else if (path === 'wishlist') {
    document.title = 'BEAR. — Wishlist';
    renderWishlist(pageContainer);
  } else if (path === 'faq') {
    document.title = 'BEAR. — Frequently Asked Questions';
    renderFAQ(pageContainer);
  } else if (path === 'track-order') {
    document.title = 'BEAR. — Track Shipment & PIN Serviceability';
    renderTrackOrder(pageContainer);
  } else if (path === 'returns' || path === 'swaps') {
    document.title = 'BEAR. — 7-Day Doorstep Swaps';
    renderReturns(pageContainer);
  } else if (path === 'size-guide') {
    document.title = 'BEAR. — Ergonomic Size & Fit Guide';
    renderSizeGuide(pageContainer);
  } else if (path === 'shipping') {
    document.title = 'BEAR. — Shipping & Logistics Policy';
    renderShipping(pageContainer);
  } else if (path === 'manifesto') {
    document.title = 'BEAR. — The Discipline Manifesto';
    renderManifesto(pageContainer);
  } else if (path === 'textiles' || path === 'fabrics') {
    document.title = 'BEAR. — Technical Textiles & Fabric Lab';
    renderTextiles(pageContainer);
  } else if (path === 'ethical-production') {
    document.title = 'BEAR. — Ethical Production Hub';
    renderEthicalProduction(pageContainer);
  } else if (path === 'athletes') {
    document.title = 'BEAR. — Athlete Club & Ambassador Roster';
    renderAthletes(pageContainer);
  } else if (path === 'careers') {
    document.title = 'BEAR. — Careers at BEAR';
    renderCareers(pageContainer);
  } else if (path === 'privacy') {
    document.title = 'BEAR. — Privacy Policy (DPDPA)';
    renderLegal(pageContainer, 'privacy');
  } else if (path === 'terms') {
    document.title = 'BEAR. — Terms of Service';
    renderLegal(pageContainer, 'terms');
  } else if (path === 'legal') {
    document.title = 'BEAR. — Trust & Legal Compliance';
    renderLegal(pageContainer, 'privacy');
  } else {
    // 404 Not Found fallback
    document.title = 'BEAR. — Page Not Found';
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
}

/**
 * Application initialization
 */
function init() {
  // 1. Sync theme mode with document
  const initialMode = getMode();
  document.documentElement.setAttribute('data-mode', initialMode);

  // 2. Mount permanent layout components
  if (announcementContainer) mountAnnouncement(announcementContainer);
  if (headerContainer) mountHeader(headerContainer);
  if (footerContainer) mountFooter(footerContainer);
  if (cartDrawerContainer) mountCartDrawer(cartDrawerContainer);
  if (searchOverlayContainer) mountSearchOverlay(searchOverlayContainer);
  if (toastContainer) mountToast(toastContainer);
  if (cookieBannerContainer) mountCookieBanner(cookieBannerContainer);

  // 3. Listen for hash changes
  window.addEventListener('hashchange', () => router());

  // 4. Listen for mode changes to instantly re-render active page & synchronize theme
  window.addEventListener('mode-change', (e) => {
    const mode = e.detail?.mode || getMode();
    document.documentElement.setAttribute('data-mode', mode);
    router({ preserveScroll: true });
  });

  // 5. Initial route execution
  router();
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
