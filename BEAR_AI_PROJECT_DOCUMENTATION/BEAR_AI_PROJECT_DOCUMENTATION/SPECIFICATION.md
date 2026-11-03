# BEAR — Product and Functional Specification

## 1. Product scope
BEAR is a clothing ecommerce storefront with two shopping modes:
- **BEAR** — monochrome performance clothing presentation.
- **SOW** — warm-neutral women's clothing presentation within the BEAR brand.

Both modes share one storefront, navigation system, catalogue architecture and customer journey.

## 2. Frontend milestone scope
Build a complete, navigable frontend prototype with realistic mock data. The prototype should demonstrate the intended user experience without connecting to a real backend.

In scope:
- Homepage
- BEAR/SOW mode switching
- Collection/product listing
- Search
- Product detail
- Wishlist interaction (demo state)
- Shopping bag/cart
- Checkout steps
- Account UI (demo state)
- Responsive navigation
- Footer and policy/content page placeholders
- Empty, loading, error and success UI states

Out of scope until backend approval:
- Real account registration/login
- Real password reset/email verification
- Real order creation
- Real payment processing
- Real inventory reservation
- Real coupon redemption
- Real email delivery
- Real WhatsApp order submission
- Admin panel implementation unless separately prioritized
- Supabase setup, database migrations and Express API

## 3. Brand and mode rules
- Header brand remains BEAR in both modes.
- Switcher labels are exactly BEAR and SOW.
- Never use MEN/WOMEN labels in the switcher.
- Mode state controls theme and relevant collection/product content.
- Do not create a second SOW company identity.
- No accessories in the initial catalogue.

## 4. Homepage
Desktop section order:
1. Slim announcement bar.
2. Floating/sticky navigation.
3. Large editorial hero with clear CTA.
4. Featured collections.
5. New arrivals.
6. Editorial/campaign image section.
7. Best sellers.
8. Brand story.
9. Newsletter UI.
10. Footer.

Mobile homepage:
- Mobile-first layout with prominent hero.
- Compact collection shortcuts where useful.
- Two-column product grid.
- Readable product names and prices.
- Avoid desktop sections becoming excessively tall or cramped.
- Keep the bottom navigation dock accessible.

All text, images and CTA destinations should come from mock content data rather than being scattered through rendering code.

## 5. Navigation and overlays
Desktop navigation order:
`HOME | COLLECTION | BEAR LOGO | BEAR/SOW MODE SWITCH | SEARCH | CART | PROFILE`

Mobile navigation uses a compact floating pill dock at the bottom, preserving the same logical order. Use icons for compact actions where necessary. The logo and mode switch must remain understandable.

Required interactions:
- Home navigates to homepage.
- Collection opens the active mode's collection listing.
- BEAR/SOW switch changes theme and mode content.
- Search opens a search overlay.
- Cart opens a cart drawer or cart page.
- Profile opens account panel/page.

## 6. Collection listing
- Responsive product grid: two columns on mobile, up to four on large desktop.
- Filters: size, colour and price.
- Sorting: featured, newest, price low-high, price high-low.
- Product cards show image, product name, price and available colour options where relevant.
- Wishlist control.
- Optional quick add only if size selection is handled clearly.
- Provide empty-results and no-products states.

## 7. Product detail
- Desktop: gallery on the left, product information on the right.
- Mobile: swipeable image gallery with product details below.
- Show product name, price, compare-at price when applicable, colour, size, quantity, size guide, fit, fabric, care and delivery/exchange information.
- Variant availability must be visible.
- Primary CTA text is **ADD TO BAG**.
- Do not show WhatsApp ordering on product cards, product detail or cart.
- Do not invent material, performance or sustainability claims.

## 8. Cart
- Show product image, name, selected size/colour, price and quantity.
- Allow quantity adjustment and removal.
- Show subtotal and shipping estimate/placeholder.
- Main CTA: **PROCEED TO CHECKOUT**.
- No WhatsApp button in cart.
- Persist demo cart state locally for prototype convenience.

## 9. Checkout
### Mobile
Three stages:
1. BAG
2. DETAILS
3. REVIEW

Requirements:
- Both swipe gestures and visible buttons navigate between stages.
- Swipe left moves forward; swipe right moves back.
- Completed progress steps can be tapped to return.
- Preserve entered form data when navigating.
- Validate required fields before advancing.
- Do not hijack vertical scrolling, text selection, buttons or form controls.
- Use smooth transitions around 350–450ms and respect reduced-motion settings.
- On final Review stage provide both slide-to-order and a normal tap alternative.
- Both controls call the same guarded submit handler to prevent duplicate actions.

### Desktop
- Conventional single-page checkout.
- Delivery form on the left.
- Order summary on the right.
- No swipe navigation and no slide-to-purchase control.
- Final CTA label: **PLACE ORDER VIA WHATSAPP**.

### WhatsApp prototype boundary
The frontend prototype may demonstrate the final confirmation UI and generate a preview message, but must not pretend to create a real order or send a WhatsApp message. Real WhatsApp handoff is backend-phase work.

## 10. Account UI
Create demo account screens/panels for:
- Profile details
- Addresses
- Orders
- Wishlist
- Settings
- Support
- Logout

Clearly label authentication as demo-only until backend integration.

## 11. Currency, locale and content
- Display prices in Indian Rupees (₹).
- Format amounts using `en-IN`.
- Use realistic but clearly fictional mock products and prices.
- Do not publish unverified shipping, return, exchange or delivery promises.
- Use editable placeholder policy content until final business policies are supplied.

## 12. Quality requirements
- Responsive at 320px through large desktop.
- Keyboard-accessible navigation, dialogs and forms.
- Visible focus states.
- Semantic HTML and accessible labels.
- Good colour contrast.
- Meaningful alt text.
- No console errors.
- No dead buttons or fake interactions.
- No horizontal overflow.
- Avoid layout shift from images.
- Provide empty, error and success states for key flows.
