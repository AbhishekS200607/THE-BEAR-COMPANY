# BEAR Store — AI Handoff & Codebase Context File
> Last updated by Amazon Q Developer
> Purpose: Full project context for any AI assistant joining this codebase mid-development.

---

## Project Overview

**Name:** BEAR Store  
**Type:** Vanilla JS SPA (no framework) — Vite build tool  
**Concept:** Dual-mode premium Indian activewear storefront  
- `bear` mode → Men's utilitarian performance wear (dark, minimal, black/charcoal)  
- `sow` mode → Women's sculpted luxury activewear (warm, earthy, terracotta/rose)  
**Currency:** Indian Rupees (₹), formatted with `en-IN` locale  
**Target Market:** India — WhatsApp-first checkout, 19,000+ PIN codes, COD-friendly  

---

## Tech Stack

| Layer | Choice |
|---|---|
| Bundler | Vite |
| JS | Vanilla ES Modules (no React, no Vue) |
| CSS | Custom design tokens + Tailwind CDN (utility classes in HTML) |
| Fonts | Space Grotesk (headings), Plus Jakarta Sans (body) via Google Fonts |
| Icons | Material Symbols Outlined (Google CDN) |
| State | Custom event-based reactive store (`state/store.js`) |
| Persistence | localStorage via `utils/storage.js` |
| Cookies | `services/cookieService.js` (document.cookie wrapper) |
| Cache | `services/cacheService.js` (in-memory TTL Map) |
| Routing | Hash-based SPA router in `main.js` |

---

## Folder Structure

```
bear-store/
├── index.html                  ← App shell, all root DOM containers
├── src/
│   ├── main.js                 ← Router, app init, mounts all layout components
│   ├── components/
│   │   ├── announcementBar.js
│   │   ├── cartDrawer.js
│   │   ├── cookieBanner.js     ← NEW: animated cookie consent banner
│   │   ├── drawer.js
│   │   ├── footer.js
│   │   ├── header.js
│   │   ├── modal.js
│   │   ├── modeSwitch.js
│   │   ├── navigation.js
│   │   ├── productCard.js
│   │   ├── productGallery.js
│   │   ├── productGrid.js
│   │   ├── searchOverlay.js
│   │   ├── slideToConfirm.js
│   │   └── toast.js
│   ├── data/
│   │   ├── campaigns.js
│   │   ├── collections.js
│   │   ├── content.js
│   │   └── products.js         ← 8 BEAR + 8 SOW products (static mock data)
│   ├── pages/
│   │   ├── account.js
│   │   ├── athletes.js
│   │   ├── careers.js
│   │   ├── cart.js
│   │   ├── checkout.js
│   │   ├── collection.js
│   │   ├── ethicalProduction.js
│   │   ├── faq.js
│   │   ├── home.js
│   │   ├── legal.js
│   │   ├── manifesto.js
│   │   ├── product.js
│   │   ├── returns.js
│   │   ├── shipping.js
│   │   ├── sizeGuide.js
│   │   ├── textiles.js
│   │   ├── trackOrder.js
│   │   └── wishlist.js
│   ├── services/
│   │   ├── accountService.js   ← User, orders, addresses CRUD (localStorage)
│   │   ├── cacheService.js     ← NEW: in-memory TTL cache
│   │   ├── cartService.js      ← Cart operations (wraps store.js)
│   │   ├── checkoutService.js  ← Order submission + WhatsApp message builder
│   │   ├── cookieService.js    ← NEW: cookie get/set/remove + consent helpers
│   │   ├── mockStore.js        ← mockDelay() utility for simulated async
│   │   ├── productService.js   ← Product fetching (now cache-wrapped)
│   │   └── wishlistService.js  ← Wishlist toggle/query (wraps store.js)
│   ├── state/
│   │   └── store.js            ← Single reactive state store
│   ├── styles/
│   │   ├── components.css      ← All component styles (cookie banner added here)
│   │   ├── global.css
│   │   ├── layout.css
│   │   ├── reset.css
│   │   ├── responsive.css
│   │   ├── tokens.css          ← CSS custom properties (design tokens)
│   │   └── typography.css
│   └── utils/
│       ├── accessibility.js
│       ├── formatCurrency.js
│       ├── storage.js          ← localStorage JSON wrapper
│       └── validation.js
```

---

## Routing (Hash-based SPA)

All routes use `window.location.hash`. Pattern: `#/path` or `#path`

| Hash | Page |
|---|---|
| `#` / `#home` | Home |
| `#collection` | Collection grid with filters |
| `#product/{slug}` | Product detail |
| `#cart` | Cart page |
| `#checkout` | Checkout (3-step: bag → details → confirm) |
| `#account` | Account (orders, addresses, profile) |
| `#wishlist` | Wishlist |
| `#faq` | FAQ accordion |
| `#track-order` | Order tracking |
| `#returns` / `#swaps` | Returns policy |
| `#size-guide` | Size guide |
| `#shipping` | Shipping policy |
| `#manifesto` | Brand manifesto |
| `#textiles` / `#fabrics` | Fabric lab |
| `#ethical-production` | Ethical production |
| `#athletes` | Athlete roster |
| `#careers` | Careers |
| `#privacy` / `#legal` | Privacy policy |
| `#terms` | Terms of service |

Router fires on `hashchange` and `mode-change` events. Mode changes use `preserveScroll: true`.

---

## State Management (`state/store.js`)

Single global state object. No external library.

```js
state = {
  mode: 'bear' | 'sow',     // persisted to localStorage
  cart: [...],               // persisted to localStorage
  wishlist: [...],           // persisted to localStorage (array of product IDs)
  searchQuery: '',
  searchOpen: false,
  cartOpen: false,
  accountOpen: false,
}
```

**Key exports:**
- `getState()` / `setState(patch)` — read/merge state
- `subscribe(listener)` → returns unsubscribe fn, fires on every `state-change` event
- `getMode()` / `setMode('bear'|'sow')` — also fires `mode-change` CustomEvent
- `getCart()` / `addToCart(item)` / `removeFromCart(id, size, colour)` / `updateCartQty(...)`
- `getCartCount()` / `getCartTotal()`
- `getWishlist()` / `isInWishlist(id)` / `toggleWishlist(id)` / `removeFromWishlist(id)`

**localStorage keys:**
- `bear_mode` — current mode
- `bear_cart` — cart array
- `bear_wishlist` — wishlist array

---

## Services

### `cacheService.js` ← ADDED BY AMAZON Q
In-memory TTL cache using a `Map`. Does NOT persist across page reloads.

```js
get(key)                        // returns value or null if expired/missing
set(key, value, ttl?)           // default TTL: 5 minutes
invalidate(key)                 // remove single entry
invalidateAll()                 // clear entire cache
remember(key, asyncFn, ttl?)    // cache-aside: returns cache or calls fn and stores result
```

### `productService.js` ← MODIFIED BY AMAZON Q
All 7 functions now wrapped with `cacheService.remember()`:

| Function | Cache Key Pattern | TTL |
|---|---|---|
| `getProducts(mode, filters, sort)` | `products:{mode}:{filters}:{sort}` | 5 min |
| `getProductBySlug(slug)` | `product:{slug}` | 5 min |
| `getCollections(mode)` | `collections:{mode}` | 5 min |
| `searchProducts(query, mode)` | `search:{mode}:{query}` | 2 min |
| `getFeatured(mode)` | `featured:{mode}` | 5 min |
| `getBestsellers(mode)` | `bestsellers:{mode}` | 5 min |
| `getNewArrivals(mode)` | `newArrivals:{mode}` | 5 min |

### `cookieService.js` ← ADDED BY AMAZON Q
Thin wrapper around `document.cookie`.

```js
get(name)                       // returns string value or null
set(name, value, options?)      // options: maxAge, expires, path, domain, sameSite, secure
remove(name, options?)          // sets maxAge=0
getConsent()                    // returns 'accepted' | 'rejected' | null
setConsent('accepted'|'rejected') // persists for 1 year (max-age: 31536000)
```

Cookie key for consent: `bear_cookie_consent`  
Defaults: `path='/'`, `sameSite='Lax'`, `secure=true` on HTTPS.

### `cartService.js`
Wraps `store.js` cart helpers. Supports two call signatures for `addItem`:
1. `addItem({ id, name, price, size, colour, image, mode, quantity })` — single object
2. `addItem(product, colour, size, quantity)` — positional args

### `checkoutService.js`
- `validateBag()` — checks cart is non-empty
- `validateDetails(formData)` — delegates to `utils/validation.js`
- `submitOrder(bagData, detailsData)` — async, generates `BEAR-{year}-{6digits}` order ID, calls `accountService.addOrder()`
- `generateWhatsAppMessage(order)` — returns formatted string for WhatsApp deep link

### `accountService.js`
localStorage-backed CRUD. Keys: `bear_addresses`, `bear_orders`, `bear_user`.
- `getDemoUser()` / `getDemoOrders()` / `getDemoAddresses()`
- `addAddress(addr)` / `updateAddress(id, patch)` / `deleteAddress(id)`
- `addOrder(order)` / `confirmOrder(orderId)` / `cancelOrder(orderId)`

---

## Components

### `cookieBanner.js` ← ADDED BY AMAZON Q
Animated cookie consent banner. Mount point: `#cookie-banner-root` in `index.html`.

**Behaviour:**
- Calls `cookieService.getConsent()` on mount — does nothing if already decided
- Slides up from bottom with spring easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
- Cookie icon plays a wiggle keyframe animation on entry
- "Accept All" → saves `'accepted'`, slides banner back down, removes from DOM
- "Reject" → saves `'rejected'`, same dismiss animation
- Links to `#privacy` page
- Mobile: stacks vertically, buttons go full-width

**CSS classes:** `.cookie-banner`, `.cookie-banner--visible`, `.cookie-banner--hiding`  
**Styles location:** `styles/components.css` (section: COOKIE BANNER)

### `toast.js`
Global toast notification system. Mount point: `#toast-root`.  
Fires via CustomEvent or direct API. Types: `success`, `error`, `info`.

### `cartDrawer.js`
Slide-in cart panel from right. Mount point: `#cart-drawer-root`.

### `searchOverlay.js`
Full-screen search. Mount point: `#search-overlay-root`.

---

## Design Tokens (CSS Custom Properties)

Defined in `styles/tokens.css`. Key ones:

```css
--color-bg, --color-surface, --color-text, --color-muted
--color-border, --color-accent, --color-accent-contrast
--color-success (#1A7A4A), --color-error (#C0392B)
--space-1 through --space-16  (4px base scale)
--radius-sm/md/lg/xl/full
--shadow-sm/md/lg/pill
--transition-fast/base/slow/spring
--z-header(100) / --z-drawer(200) / --z-modal(300) / --z-toast(400) / --z-top(500)
```

**SOW mode overrides** via `[data-mode="sow"]` attribute on `<html>`:
- bg: `#FAF7F5`, surface: `#F3ECE6`, text: `#332923`, accent: `#80534C`

---

## Data Models

### Product
```js
{
  id: 'bear-001',
  mode: 'bear' | 'sow',
  slug: 'essential-oversized-tee',
  name, category, price, compareAtPrice,
  description, fit, fabric, care, delivery,
  colours: [{ id, name, hex }],
  sizes: [{ size: 'S'|'M'|'L'|'XL'|'XXL', available: bool }],
  images: [url, ...],
  featured: bool, bestseller: bool, new: bool,
  rating: number, reviewCount: number
}
```

### Cart Item
```js
{ id, slug, name, price, colour, size, quantity, image, mode }
```

### Order
```js
{
  id: 'BEAR-2026-984231',
  date: '28 Oct 2026',
  items: [{ name, size, colour, quantity, price? }],
  total: number,
  status: 'delivered' | 'processing' | 'shipped' | 'pending_whatsapp' | 'cancelled',
  details?: { fullName, address, city, pincode, mobile }
}
```

### Address
```js
{ id, label, fullName, line1, city, state, pincode, phone, default: bool }
```

---

## DOM Root Containers (index.html)

```html
<div id="site-header"></div>
<main id="page-content"></main>
<div id="site-footer"></div>
<div id="cart-drawer-root"></div>
<div id="search-overlay-root"></div>
<div id="modal-root"></div>
<div id="toast-root" aria-live="polite"></div>
<div id="cookie-banner-root"></div>   ← ADDED BY AMAZON Q
```

---

## Component Pattern

Every component and page follows this pattern:

```js
// Component
export function mount(container) {
  container.innerHTML = `...`;
  // attach event listeners
  // return cleanup fn if needed
}

// Page
export async function render(container) {
  container.innerHTML = `...`;
  // fetch data, attach listeners
}
```

Pages return a cleanup function stored in `currentRouteCleanup` in `main.js`.

---

## Key Conventions

- **No framework** — pure DOM manipulation, `innerHTML`, `addEventListener`
- **Currency** — always `₹` + `toLocaleString('en-IN')`
- **Images** — all product images are Google AIDA CDN URLs (lh3.googleusercontent.com)
- **Async simulation** — `mockDelay(minMs, maxMs)` from `mockStore.js` simulates network
- **Mode switching** — fires `mode-change` CustomEvent, router re-renders with `preserveScroll: true`
- **CSS naming** — BEM-like: `.block__element--modifier`
- **No TypeScript** — plain `.js` throughout
- **No test files** — not set up yet

---

## What Was Built / Changed (Amazon Q Session)

1. **`src/services/cacheService.js`** — Created from scratch. In-memory TTL cache with `remember()` cache-aside helper.

2. **`src/services/productService.js`** — Modified. All 7 export functions now use `cacheService.remember()`. Search TTL is 2 min, all others 5 min.

3. **`src/services/cookieService.js`** — Created from scratch. Full `document.cookie` CRUD + consent helpers (`getConsent` / `setConsent`). Consent stored as `bear_cookie_consent` cookie for 1 year.

4. **`src/components/cookieBanner.js`** — Created from scratch. Animated slide-up banner with Accept/Reject buttons. Self-removes from DOM after choice. Skips render if consent already exists.

5. **`src/styles/components.css`** — Added `COOKIE BANNER` section with slide-up spring animation, cookie icon wiggle keyframe, and mobile responsive stacking.

6. **`index.html`** — Added `<div id="cookie-banner-root"></div>` before closing `</body>`.

7. **`src/main.js`** — Imported `cookieBanner.js` and mounted it to `#cookie-banner-root` in `init()`.

---

## Pending / Not Yet Built

- Real backend / API integration (currently all mock data)
- Payment gateway (currently WhatsApp-based order flow)
- Authentication (currently demo user hardcoded in `accountService.js`)
- Search indexing (currently linear filter over products array)
- Analytics / tracking (consent banner is ready, but no analytics wired up yet)
- PWA / service worker
- SSR / SEO meta tags beyond basic `<title>` updates
- Test suite

---

## How to Run

```bash
cd bear-store
npm install
npm run dev
```

Runs on `http://localhost:5173` by default (Vite).
