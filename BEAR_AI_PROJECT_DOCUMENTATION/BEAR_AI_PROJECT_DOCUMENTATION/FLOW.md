# BEAR — User and Interface Flows

## 1. Global entry
```text
Open storefront
  -> Load saved mode (default BEAR)
  -> Render announcement + navigation + homepage
  -> Customer browses active mode
```

## 2. Mode switch
```text
Customer selects BEAR or SOW
  -> Update active mode state
  -> Apply corresponding CSS theme tokens
  -> Load that mode's collection/editorial content
  -> Preserve cart and wishlist state
  -> Persist mode locally
```

## 3. Browse and discover
```text
Homepage
  -> Select Collection OR Search OR Featured product
  -> Collection listing
       -> Filter by size/colour/price
       -> Sort products
       -> Open product
  -> Product detail
```

## 4. Product selection
```text
Product detail
  -> Browse gallery
  -> Select colour
  -> Select available size
  -> Select quantity
  -> Review fit/fabric/care information
  -> ADD TO BAG
  -> Show confirmation
  -> Continue shopping OR open cart
```
Do not allow adding a size-dependent product without a valid size selection.

## 5. Cart
```text
Open cart
  -> Review items
  -> Change quantity OR remove item
  -> Review subtotal
  -> PROCEED TO CHECKOUT
```
No WhatsApp action exists before the final checkout stage.

## 6. Checkout — mobile
```text
BAG
  -> Review cart
  -> Continue (or valid swipe left)
DETAILS
  -> Enter recipient and delivery details
  -> Validate required fields
  -> Continue (or valid swipe left)
REVIEW
  -> Review address and items
  -> Slide to order OR tap to order
  -> Demo confirmation state (frontend milestone only)
```
Back navigation:
- Swipe right or Back button returns to the previous step.
- Completed progress steps are tappable.
- Form state is preserved.
- A gesture must not interrupt vertical scrolling or form interaction.

## 7. Checkout — desktop
```text
Checkout page
  -> Delivery form on left
  -> Order summary on right
  -> Validate fields
  -> PLACE ORDER VIA WHATSAPP
  -> Demo confirmation state (frontend milestone only)
```
No slide-to-order or swipe step navigation on desktop.

## 8. Search
```text
Tap Search
  -> Open search overlay
  -> Enter query
  -> Search mock catalogue
  -> Show matching products
  -> Select result
  -> Product detail
```
Include clear-query and no-results states.

## 9. Account prototype
```text
Tap Profile
  -> Account panel/page
  -> Profile / Addresses / Orders / Wishlist / Settings / Support
  -> Demo sign-in or demo account state
```
No real credentials or authentication are used in the frontend milestone.

## 10. Wishlist
```text
Tap wishlist control on product
  -> Toggle saved state
  -> Update wishlist count/state
  -> Show feedback
  -> View wishlist from account
```

## 11. Future real order flow — reference only
This flow is not implemented during frontend development.
```text
Customer submits final checkout
  -> Backend validates user, address, cart, prices, discounts and stock
  -> Backend creates order and item/address snapshots atomically
  -> Backend applies reservation/idempotency rules
  -> Backend returns order number and WhatsApp message data
  -> Browser opens WhatsApp with prefilled message
  -> Customer manually sends the message
  -> Admin verifies and confirms the order
```
Important:
- Opening WhatsApp does not prove the message was sent.
- Initial real order status is `AWAITING_CONFIRMATION`.
- Never create duplicate orders from repeated taps or slider completion.
- Coupon and stock reservation/commit/release rules belong to backend implementation.

## 12. Future shipping flow — reference only
```text
Admin enters courier, tracking number and exact HTTPS tracking URL
  -> Backend validates and saves shipment
  -> Customer views own order
  -> Customer selects Track your package
  -> Exact tracking URL opens
```
No courier API or scraping is included in the initial system.

## 13. Failure and recovery
- Invalid form: show inline error and retain input.
- Empty cart: block checkout and link back to collection.
- Unavailable size: prevent add-to-bag.
- Search miss: show no-results state and clear-search action.
- Simulated service failure: show retry and retain local state.
- Duplicate checkout interaction: ignore while submission is in progress.
