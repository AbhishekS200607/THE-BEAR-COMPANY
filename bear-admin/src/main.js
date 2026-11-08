import './styles.css';
import { isAuthenticated, logout, renderAuthGate } from './auth.js';
import { getAdminMe } from './services/adminService.js';
import { renderDashboard } from './sections/dashboard.js';
import { renderOrders } from './sections/orders.js';
import { renderCancellations } from './sections/cancellations.js';
import { renderInventory } from './sections/inventory.js';
import { renderProducts } from './sections/products.js';
import { renderCategories } from './sections/categories.js';
import { renderReviews } from './sections/reviews.js';
import { renderShipping } from './sections/shipping.js';
import { renderCustomers } from './sections/customers.js';
import { renderDiscounts } from './sections/discounts.js';
import { renderPromotions } from './sections/promotions.js';
import { renderNotifications } from './sections/notifications.js';
import { renderStaff } from './sections/staff.js';
import { renderSettings } from './sections/settings.js';
import { renderFulfillment } from './sections/fulfillment.js';
import { getIcon } from './utils/icons.js';

const app = document.getElementById('app');

const SECTIONS = {
  dashboard:     { label: 'Dashboard',            icon: 'dashboard',        render: renderDashboard, role: 'admin' },
  fulfillment:   { label: 'Fulfillment Centre',   icon: 'fulfillment',      render: renderFulfillment, role: 'admin' },
  orders:        { label: 'Orders Queue',         icon: 'orders',           render: renderOrders, role: 'admin' },
  inventory:     { label: 'Inventory Matrix',     icon: 'inventory',        render: renderInventory, role: 'admin' },
  products:      { label: 'Products',             icon: 'products',         render: renderProducts, role: 'admin' },
  categories:    { label: 'Categories',           icon: 'categories',       render: renderCategories, role: 'admin' },
  reviews:       { label: 'Customer Reviews',     icon: 'reviews',          render: renderReviews, role: 'admin' },
  cancellations: { label: 'Cancellations',        icon: 'cancellations',    render: renderCancellations, role: 'admin' },
  customers:     { label: 'Customer CRM',         icon: 'customers',        render: renderCustomers, role: 'admin' },
  shipping:      { label: 'Shipping & Logistics', icon: 'shipping',         render: renderShipping, role: 'admin' },
  discounts:     { label: 'Discounts & Coupons',  icon: 'discounts',        render: renderDiscounts, role: 'admin' },
  promotions:    { label: 'Promotions & Banners', icon: 'promotions',       render: renderPromotions, role: 'admin' },
  notifications: { label: 'Notifications',        icon: 'notifications',    render: renderNotifications, role: 'admin' },
  staff:         { label: 'Staff & Audit Logs',   icon: 'staff',            render: renderStaff, role: 'super_admin' },
  settings:      { label: 'Store Settings',       icon: 'settings',         render: renderSettings, role: 'super_admin' },
};

let currentSection = 'dashboard';
let currentAdmin = null;
let clockInterval = null;

async function init() {
  const authed = await isAuthenticated();
  if (!authed) {
    if (clockInterval) clearInterval(clockInterval);
    renderAuthGate(app, () => init());
    return;
  }

  // Fetch verified profile from backend
  currentAdmin = await getAdminMe();
  if (!currentAdmin) {
    await logout();
    renderAuthGate(app, () => init());
    return;
  }

  // Role guard: if user is not super_admin and tries to access system screens, redirect to dashboard
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  const isSuperAdmin = currentAdmin.isSuperAdmin;
  if (!isSuperAdmin && (hash === 'staff' || hash === 'settings')) {
    currentSection = 'dashboard';
    window.location.hash = '#dashboard';
  } else {
    currentSection = SECTIONS[hash] ? hash : 'dashboard';
  }

  renderShell();
}

function renderShell() {
  app.innerHTML = `
    <div style="display:flex;height:100vh;overflow:hidden;background:#09090b;">
      
      <!-- ── Left Fixed Sidebar ────────────────────────────────────────────────── -->
      <aside style="width:260px;min-width:260px;background:#111113;border-right:1px solid #27272a;display:flex;flex-direction:column;justify-content:space-between;">
        
        <!-- Sidebar Brand & Nav -->
        <div style="overflow-y:auto;padding:20px 14px;">
          <!-- Brand Badge -->
          <div style="padding:0 8px 18px 8px;border-bottom:1px solid #1f1f23;margin-bottom:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <p style="font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#f4f4f5;">
                BEAR<span style="color:#71717a;">.</span>
              </p>
              <span class="badge badge-bear" style="font-size:10px;">ADMIN CONSOLE</span>
            </div>
            <p style="font-size:11px;color:#71717a;margin-top:2px;">Performance Wear Pvt. Ltd.</p>
          </div>

          <!-- Navigation Links Grouped -->
          <nav style="display:flex;flex-direction:column;gap:18px;">
            
            <!-- Group 1: OVERVIEW -->
            <div>
              <p style="font-family:'Space Grotesk',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#52525b;padding:0 8px 6px 8px;">
                OVERVIEW
              </p>
              ${renderNavLink('dashboard')}
            </div>

            <!-- Group 2: FULFILLMENT & LOGISTICS -->
            <div>
              <p style="font-family:'Space Grotesk',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#52525b;padding:0 8px 6px 8px;">
                LOGISTICS & DISPATCH
              </p>
              ${renderNavLink('fulfillment')}
              ${renderNavLink('orders')}
              ${renderNavLink('cancellations')}
              ${renderNavLink('shipping')}
            </div>

            <!-- Group 3: CATALOG & INVENTORY -->
            <div>
              <p style="font-family:'Space Grotesk',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#52525b;padding:0 8px 6px 8px;">
                CATALOG & INVENTORY
              </p>
              ${renderNavLink('products')}
              ${renderNavLink('categories')}
              ${renderNavLink('inventory')}
              ${renderNavLink('reviews')}
            </div>

            <!-- Group 4: MARKETING & CRM -->
            <div>
              <p style="font-family:'Space Grotesk',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#52525b;padding:0 8px 6px 8px;">
                GROWTH & CRM
              </p>
              ${renderNavLink('customers')}
              ${renderNavLink('discounts')}
              ${renderNavLink('promotions')}
              ${renderNavLink('notifications')}
            </div>

            <!-- Group 5: SYSTEM (Super Admin Only) -->
            ${currentAdmin.isSuperAdmin ? `
              <div>
                <p style="font-family:'Space Grotesk',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#52525b;padding:0 8px 6px 8px;">
                  SYSTEM & SECURITY
                </p>
                ${renderNavLink('staff')}
                ${renderNavLink('settings')}
              </div>
            ` : ''}
          </nav>
        </div>

        <!-- Sidebar Footer & Admin User Card -->
        <div style="padding:14px;border-top:1px solid #1f1f23;background:#0d0d0f;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <div style="overflow:hidden;padding-right:8px;">
              <p style="font-size:12px;font-weight:600;color:#f4f4f5;font-family:'Space Grotesk',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${currentAdmin.fullName || 'Store Staff'}
              </p>
              <p style="font-size:10px;color:#71717a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${currentAdmin.email}
              </p>
            </div>
            ${currentAdmin.isSuperAdmin 
              ? '<span class="badge badge-amber" style="font-size:9px;white-space:nowrap;">SUPER ADMIN</span>' 
              : '<span class="badge badge-blue" style="font-size:9px;white-space:nowrap;">OPS MANAGER</span>'}
          </div>

          <div style="display:flex;gap:6px;">
            <a href="/" target="_blank" rel="noopener" class="admin-btn" style="flex:1;justify-content:center;padding:5px 8px;font-size:10px;text-decoration:none;">
              <span style="display:flex;align-items:center;">${getIcon('arrowRight')}</span>
              <span>Storefront</span>
            </a>
            <button id="admin-logout-btn" class="admin-btn danger" style="padding:5px 10px;font-size:10px;" title="Sign out of console">
              <span style="display:flex;align-items:center;">${getIcon('close')}</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- ── Main Workspace Area ───────────────────────────────────────────────── -->
      <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
        
        <!-- Top Executive Bar -->
        <header style="height:56px;background:#111113;border-bottom:1px solid #27272a;display:flex;align-items:center;justify-content:space-between;padding:0 24px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="display:flex;align-items:center;color:#71717a;">${getIcon(SECTIONS[currentSection]?.icon || 'dashboard')}</span>
            <span style="font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:700;color:#f4f4f5;letter-spacing:-0.01em;">
              ${SECTIONS[currentSection]?.label || 'Dashboard'}
            </span>
            <span style="font-size:12px;color:#52525b;">/ Console</span>
          </div>

          <!-- Live Digital Clock & Operational Status -->
          <div style="display:flex;align-items:center;gap:16px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="width:7px;height:7px;border-radius:50%;background:#10b981;display:inline-block;animation:pulse 2s infinite;"></span>
              <span style="font-size:11px;font-family:'Space Grotesk',sans-serif;color:#a1a1aa;letter-spacing:0.04em;">SYSTEM LIVE</span>
            </div>
            <div id="live-clock" style="font-family:'Space Grotesk',sans-serif;font-size:12px;color:#71717a;font-variant-numeric:tabular-nums;border-left:1px solid #27272a;padding-left:16px;">
              --:--:-- IST
            </div>
          </div>
        </header>

        <!-- Dynamic Content Mount -->
        <main id="section-mount" style="flex:1;overflow-y:auto;padding:24px;background:#09090b;"></main>
      </div>

    </div>
  `;

  // Attach nav click handlers
  app.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      const target = link.dataset.section;
      if (target && SECTIONS[target]) {
        currentSection = target;
        window.location.hash = `#${target}`;
        updateActiveLink();
        loadActiveSection();
      }
    });
  });

  // Attach logout handler
  app.querySelector('#admin-logout-btn')?.addEventListener('click', async () => {
    if (confirm('Sign out of BEAR Admin Console?')) {
      await logout();
      init();
    }
  });

  startLiveClock();
  loadActiveSection();
}

function renderNavLink(key) {
  const item = SECTIONS[key];
  const isActive = key === currentSection;
  return `
    <button class="sidebar-link ${isActive ? 'active' : ''}" data-section="${key}">
      <span style="display:flex;align-items:center;">${getIcon(item.icon)}</span>
      <span>${item.label}</span>
    </button>
  `;
}

function updateActiveLink() {
  app.querySelectorAll('.sidebar-link').forEach(btn => {
    if (btn.dataset.section === currentSection) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function loadActiveSection() {
  const mount = document.getElementById('section-mount');
  if (!mount) return;

  const item = SECTIONS[currentSection];
  if (item && typeof item.render === 'function') {
    item.render(mount);
  }
}

function startLiveClock() {
  if (clockInterval) clearInterval(clockInterval);
  const clockEl = document.getElementById('live-clock');
  function tick() {
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
  }
  tick();
  clockInterval = setInterval(tick, 1000);
}

// Global hash change listener
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (SECTIONS[hash] && hash !== currentSection) {
    if (!currentAdmin?.isSuperAdmin && (hash === 'staff' || hash === 'settings')) {
      window.location.hash = '#dashboard';
      return;
    }
    currentSection = hash;
    updateActiveLink();
    loadActiveSection();
  }
});

init();
