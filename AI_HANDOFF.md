# BEAR Store — Master AI Handoff & Architecture Context
> **Document Purpose:** Single source of truth for cross-agent collaboration, codebase architecture, backend API contracts, and specifications for building the **Admin Panel UI** (`#admin`).
> **Last Updated:** 2026-11-04 by Antigravity Senior Architect.

---

## 1. Project Overview & Brand Identity

* **Brand:** BEAR Store (Dual-Mode Luxury Activewear & Utilitarian Streetwear)
  * **`BEAR` Mode:** Heavyweight performance athletic wear for men (480 GSM, minimal, industrial, Pitch Black `#09090b` / Charcoal / Ice Grey).
  * **`SOW` Mode:** Sculpted luxury activewear for women (Warm Terracotta `#b45309`, Rose Earth, Cashmere, Sand).
* **Target Audience:** Pan-India activewear market.
* **Unified WhatsApp Order Line:** `919605210198` (strictly enforced across all links, messages, and checkout).
* **Delivery Invariant:** Strictly **FREE (₹0)** across all 19,000+ Indian PIN codes.
* **Currency:** Indian Rupees (`₹`), always formatted via `Intl.NumberFormat('en-IN')` / `toLocaleString('en-IN')`.

---

## 2. Directory Structure

```
d:\bear\
├── bear-store/                    ← Frontend (Vanilla JS SPA + Vite)
│   ├── index.html                 ← Application shell, mounts modals & pages
│   ├── package.json               ← Vite 5.4+ dev dependencies
│   ├── src/
│   │   ├── main.js                ← SPA Router (hashchange), global layout mounts
│   │   ├── components/            ← UI components (header, footer, drawers, cards, etc.)
│   │   │   ├── admin/             ← (To be added for Admin UI widgets/tabs)
│   │   │   ├── announcementBar.js
│   │   │   ├── cartDrawer.js      ← Slide-out drawer with quick-add recommendations
│   │   │   ├── cookieBanner.js
│   │   │   ├── emptyState.js      ← Custom vector SVG empty states
│   │   │   ├── floatingWhatsApp.js← Floating WhatsApp action button
│   │   │   ├── header.js          ← Navigation header & dock
│   │   │   ├── loadingBar.js      ← Top 3px route progress bar
│   │   │   ├── productCard.js     ← Mode-aware interactive product card
│   │   │   ├── restockNotifyModal.js
│   │   │   ├── scrollToTop.js     ← Floating scroll-to-top button
│   │   │   ├── searchOverlay.js   ← Search with history & trending chips
│   │   │   ├── sizeRecommender.js ← Drape & body metrics size calculator
│   │   │   └── toast.js           ← Global notification toasts
│   │   ├── data/
│   │   │   └── products.js        ← Static product catalog & specifications
│   │   ├── pages/                 ← Page modules
│   │   │   ├── account.js         ← Customer account & order history
│   │   │   ├── admin.js           ← [COMPLETED] Admin Panel UI (#admin)
│   │   │   ├── cart.js            ← Bag page with "You May Also Like" cross-sells
│   │   │   ├── checkout.js        ← WhatsApp-first checkout with coupon validation
│   │   │   ├── collection.js      ← Catalog with infinite scroll & active filter chips
│   │   │   ├── home.js            ← Hero, mode showcase, recent views, categories
│   │   │   ├── product.js         ← PDP with image zoom, lightbox, reviews, related items
│   │   │   ├── trackOrder.js      ← 4-stage BlueDart timeline tracker
│   │   │   └── wishlist.js        ← Wishlist with "Add All to Bag"
│   │   ├── services/              ← Client-side services & API wrappers
│   │   │   ├── adminService.js    ← [COMPLETED] API client for /api/v1/admin/* with fallback
│   │   │   ├── cartService.js
│   │   │   ├── checkoutService.js ← [COMPLETED] Connected to live /api/v1/orders
│   │   │   ├── productService.js
│   │   │   └── recentlyViewedService.js
│   │   ├── state/
│   │   │   └── store.js           ← Central reactive pub-sub store
│   │   ├── styles/
│   │   │   ├── components.css     ← Component styling & keyframe animations
│   │   │   ├── tokens.css         ← Design system variables
│   │   │   └── ...
│   │   └── utils/
│   │       ├── seo.js             ← Page title & OpenGraph meta updater
│   │       └── storage.js         ← LocalStorage utilities
│   └── dist/                      ← Production build output
│
├── server/                        ← Backend API (Node.js 20+ / Express)
│   ├── .env.example               ← Configuration template
│   ├── src/
│   │   ├── app.js                 ← Express setup, Helmet, CORS, Error handling
│   │   ├── server.js              ← Listens on port 4000
│   │   ├── config/
│   │   │   ├── env.js             ← Zod-validated environment config
│   │   │   └── supabase.js        ← Supabase client (service role client isolated)
│   │   ├── controllers/
│   │   │   ├── adminController.js ← [READY] Endpoints for admin panel
│   │   │   ├── orderController.js
│   │   │   └── productController.js
│   │   ├── middleware/
│   │   │   ├── auth.js            ← JWT verification & requireAdmin guard
│   │   │   ├── rateLimiter.js
│   │   │   └── validate.js        ← Zod request validator
│   │   └── routes/
│   │       ├── adminRoutes.js     ← [READY] /api/v1/admin endpoints
│   │       ├── orderRoutes.js
│   │       └── productRoutes.js
│
└── database/                      ← PostgreSQL Schema & Hardened Functions
    ├── migrations/
    │   └── 001_initial_schema.sql ← Idempotent, locked inventory reservation & RLS
    └── tests/
        └── 001_test_security_concurrency.sql
```

---

## 3. Backend REST API — Admin Endpoints Specification

All Admin routes are hosted under `http://localhost:4000/api/v1/admin` and guarded by `requireAdmin` middleware (`Authorization: Bearer <supabase_admin_jwt>` or dev bypass if configured).

### 3.1. Dashboard Overview
* **Endpoint:** `GET /api/v1/admin/dashboard`
* **Response (JSON):**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 482900,
    "totalOrders": 142,
    "pendingWhatsAppOrders": 9,
    "lowStockCount": 3,
    "recentOrders": [
      {
        "id": "c1f7a83d-3b9e-4c3e-8c31-15b51a89c89e",
        "order_number": "BEAR-20261104-ABCD",
        "customer_name": "Vikram Malhotra",
        "customer_phone": "9876543210",
        "status": "pending_whatsapp",
        "total_amount": 2999,
        "created_at": "2026-11-04T01:45:00Z"
      }
    ]
  }
}
```

### 3.2. Order Management
* **List Orders:** `GET /api/v1/admin/orders?status=all&page=1&limit=20`
  * Status filter options: `all`, `pending_whatsapp`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `returned`.
* **Update Order Status & Dispatch Details:** `PATCH /api/v1/admin/orders/:id/status`
  * **Payload:**
  ```json
  {
    "status": "shipped",
    "carrierName": "BlueDart Express",
    "trackingNumber": "BD-889210948",
    "trackingUrl": "https://www.bluedart.com/tracking/BD-889210948",
    "adminNotes": "Handed to courier pickup"
  }
  ```

### 3.3. Inventory Management
* **List Inventory:** `GET /api/v1/admin/inventory`
  * Returns list of variants across all products with:
    `variant_id`, `product_name`, `mode`, `colour`, `size`, `sku`, `quantity_available`, `quantity_reserved`, `low_stock_threshold`, `is_active`.
* **Update Stock:** `PATCH /api/v1/admin/inventory/:variantId`
  * **Payload:**
  ```json
  {
    "quantityAvailable": 25,
    "lowStockThreshold": 5
  }
  ```

### 3.4. Product Management
* **Create Product:** `POST /api/v1/admin/products`
  * **Payload:**
  ```json
  {
    "name": "Oversized Training Tee",
    "mode": "bear",
    "categoryName": "T-Shirts",
    "price": 999,
    "compareAtPrice": 1499,
    "description": "260 GSM Heavyweight combed cotton.",
    "isFeatured": true,
    "isBestseller": false,
    "isNew": true
  }
  ```
* **Update Product:** `PATCH /api/v1/admin/products/:id`
  * **Payload (any fields):** `{ "price": 1099, "isActive": true }`

### 3.5. Customer Management
* **List Customers:** `GET /api/v1/admin/customers`
  * Returns: `[{ "id": "...", "name": "...", "phone": "...", "joinedAt": "..." }]`

### 3.6. Discounts & Coupons
* **List Active Coupons:** `GET /api/v1/admin/discounts`
  * Returns system active codes: `BEAR10`, `WELCOME500`, `DROP20`.

---

## 4. Frontend Standards & Coding Conventions

When building the Admin Panel inside `bear-store`:
1. **Zero Framework Policy:** Pure Vanilla JavaScript (ES Modules). No React, No Vue.
2. **Design Tokens & Fonts:**
   - Headings: `font-headline` (`font-family: 'Space Grotesk', sans-serif`).
   - Body: `font-body` (`font-family: 'Plus Jakarta Sans', sans-serif`).
   - Dark theme styling: `bg-zinc-950`, `border-zinc-800`, `text-zinc-100`, with high-contrast active states.
   - Icons: `<span class="material-symbols-outlined">icon_name</span>`.
3. **Route Integration:**
   - Handled in `src/main.js` under route `#admin`.
   - Pattern:
     ```js
     import adminPage from './pages/admin.js';
     // In router switch:
     case 'admin':
       adminPage.render(mainContainer);
       break;
     ```
4. **Fallback Mock Mode:** If the backend (`http://localhost:4000`) is offline or in development without Supabase keys, the Admin UI must provide a **graceful mock fallback** so the admin interface is 100% testable and interactive immediately.

---

## 5. Instructions for the Agent Building the Admin Panel

The agent tasked with building the Admin Panel should execute the following scope:

1. **Create `bear-store/src/services/adminService.js`:**
   - Fetch helper wrapping `http://localhost:4000/api/v1/admin/*`.
   - Handles Bearer tokens and falls back to realistic mock data (orders, stats, inventory) if the backend is unreachable.
2. **Create `bear-store/src/pages/admin.js`:**
   - **PIN / Password Access Gate:** Quick secure entrance (e.g., PIN `1980` or admin email) to simulate authentication and store admin session.
   - **Executive Header:** Admin logo, Active Mode indicator, Live clock, Log Out button, and quick link to storefront (`#home`).
   - **Tab Navigation:**
     1. **Dashboard:** KPI summary stat cards, Revenue graph/bars, recent orders feed.
     2. **Orders Queue:** Filter by status, search by customer/order number, click to open Order Details Modal, update order status (`confirmed`, `shipped`, `delivered`), enter BlueDart tracking number, and generate direct WhatsApp customer chat link.
     3. **Inventory Manager:** Table of all products & sizes, live stock counters, `+` and `−` quick adjustment buttons, and low-stock warning chips.
3. **Connect Router in `bear-store/src/main.js`:**
   - Add `#admin` case in the hashchange router.
   - Add an discrete "Admin Portal" link in `footer.js` for easy access.
4. **Verify & Build:**
   - Run `npm run build` in `bear-store/` to confirm 0 compile errors.
