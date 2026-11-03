# BEAR — UI/UX Requirements

## 1. Experience principles
1. Product photography leads; interface supports it.
2. Keep the shopping journey direct and low-friction.
3. Maintain one consistent BEAR identity across both modes.
4. Design mobile as a first-class experience.
5. Make every interactive element's purpose obvious.
6. Use motion as feedback, never as an obstacle.

## 2. Header and navigation
### Desktop
- Slim announcement strip above the main content.
- Floating rounded-pill navigation near the top.
- Sticky behaviour while scrolling, without covering page content.
- Exact logical order: HOME, COLLECTION, centred BEAR logo, BEAR/SOW switch, SEARCH, CART, PROFILE.
- Keep the logo visually central.
- Use restrained hover/focus feedback.

### Mobile
- Floating rounded pill dock fixed near the bottom.
- Preserve the same logical order.
- Use compact icons for Home, Collection, Search, Cart and Profile, with accessible labels/tooltips.
- Show BEAR logo clearly and keep the BEAR/SOW segmented switch compact.
- Respect `env(safe-area-inset-bottom)`.
- Ensure the dock does not cover product CTAs, checkout controls or form fields; reserve bottom content space.
- Test 320px, 375px and 430px widths.

## 3. Mode switching
- Switch labels exactly BEAR and SOW.
- Use a clear segmented control with a subtle animated active indicator.
- Change theme tokens and mode-specific editorial/catalogue content.
- Do not rebuild the whole page or change the navigation structure.
- Preserve cart state when changing modes.
- Persist selected mode locally during the prototype.
- Announce mode changes accessibly to assistive technology.

## 4. Homepage
- Use a strong editorial hero with one primary CTA.
- Keep headline concise and avoid covering important subject areas in the image.
- Follow with collection entry points and product discovery.
- Use consistent image ratios and intentional crops.
- Keep sections visually distinct through spacing and photography rather than decorative containers.
- Mobile hero should have a considered crop and legible CTA.
- Newsletter form should have validation and a clear demo success state.

## 5. Product cards
- Image is the dominant element.
- Product title and price should be easy to scan.
- Use a consistent image ratio within each grid.
- Wishlist icon must have an accessible name and selected state.
- Colour swatches must be labelled and keyboard operable.
- Quick add must not silently add a default size; require a size choice or open a size-selection interface.
- Hover-only information must also be available on touch and keyboard.

## 6. Product page
- Desktop gallery/details two-column composition.
- Mobile image gallery first, details beneath.
- Size selector must clearly distinguish selected, unavailable and unselected sizes.
- Size guide opens a modal or drawer and is keyboard accessible.
- Add-to-bag feedback should be immediate and non-blocking.
- Keep fit, fabric, care and delivery details in concise expandable sections if needed.
- Primary CTA: ADD TO BAG.

## 7. Drawers and dialogs
- Search overlay, cart drawer, account panel and size guide should share consistent interaction patterns.
- Close with close button and Escape.
- Keep focus within modal dialogs while open and restore focus when closed.
- Prevent background scroll where appropriate.
- On mobile, use a full-height or bottom-sheet pattern only where it improves usability.
- Do not rely on backdrop click as the only close method.

## 8. Checkout interaction
- Mobile steps: BAG → DETAILS → REVIEW.
- Provide both swipe and tap navigation.
- Gesture recognition must be horizontal and threshold-based; ignore vertical scrolling and gestures originating in inputs, textareas, selects, buttons or interactive controls.
- Validate before moving forward.
- Preserve all entered values.
- Let users tap completed steps to go backwards.
- Final step supports slide-to-order and tap-to-order, both using one submission function with a duplicate-submit guard.
- Desktop uses a normal form and normal final button; no gesture controls.
- Show a clear order summary and shipping/address review before final action.
- During the frontend phase, final action is a demo state only.

## 9. Feedback and states
Provide:
- Loading indicators for simulated async actions.
- Inline validation messages.
- Toasts for add-to-bag, wishlist and demo actions.
- Empty cart and empty wishlist states.
- No search results state.
- Out-of-stock variant state.
- Error state with retry affordance where relevant.
- Disabled states that are visually and semantically clear.

## 10. Accessibility
- Use semantic landmarks and heading order.
- All controls keyboard accessible.
- Visible focus ring.
- Correct labels and error associations.
- `aria-expanded`, `aria-controls`, `aria-pressed` and dialog semantics where applicable.
- Do not communicate selected/unavailable state by colour alone.
- Respect `prefers-reduced-motion`.
- Keep contrast sufficient in both themes.
