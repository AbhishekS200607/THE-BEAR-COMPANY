# BEAR — AI Development Guidelines

## 1. Mandatory reading order
Before writing, editing or generating any application code, the AI coding agent must read these files in full:
1. `GUIDELINE.md`
2. `DESIGN.md`
3. `ARCHITECTURE.md`
4. `SPECIFICATION.md`
5. `UI_UX.md`
6. `FLOW.md`

Do not begin coding after reading only one or two files. Read all six and reconcile their requirements first.

## 2. Development order — strict
**Frontend first. Backend later.**

Milestone 1 — Frontend prototype:
- HTML, CSS and Vanilla JavaScript only.
- Use mock data and local demo state.
- Complete the customer-facing storefront flows described in the documentation.
- Validate desktop and mobile behaviour.
- Do not build an API, database, authentication integration or admin backend.
- Do not start backend work unless the user explicitly approves the frontend milestone and asks to begin backend development.

Milestone 2 — Review and approval:
- Run the frontend and inspect all pages and flows.
- Fix visual, responsive, accessibility and interaction defects.
- Present the completed frontend for user review.
- Record requested changes.
- Wait for explicit approval before moving to backend.

Milestone 3 — Backend (future):
- Only after approval, read all documentation again.
- Plan database schema, RLS, API contracts, authentication and security before implementation.
- Use the future stack in `ARCHITECTURE.md`.
- Do not silently change the chosen stack.

## 3. Source-of-truth hierarchy
If instructions conflict, follow this order:
1. The user's latest explicit instruction.
2. `SPECIFICATION.md` for functional scope.
3. `ARCHITECTURE.md` for technology and boundaries.
4. `DESIGN.md` and `UI_UX.md` for visual and interaction rules.
5. `FLOW.md` for journeys.
6. This file for process and coding discipline.

If a conflict materially affects the product, stop and ask rather than inventing a decision.

## 4. Non-negotiable brand rules
- BEAR is the company and logo.
- SOW is a shopping mode/collection identity inside BEAR.
- Never call the brand “BEAR × SOW”.
- Never replace the BEAR header logo with SOW.
- Mode switch labels are exactly BEAR and SOW, never MEN/WOMEN.
- BEAR theme is monochrome.
- SOW theme is warm neutral.
- Shared layout and functionality across modes.
- Initial products are clothing only.

## 5. Code-generation discipline
- Inspect the existing repository before changing it.
- Do not overwrite existing work without understanding it.
- Implement in small, testable increments.
- Keep data, UI rendering, state and service logic separated.
- Use semantic HTML and accessible controls.
- Use CSS variables for design tokens.
- Avoid unnecessary dependencies.
- Do not introduce a frontend framework.
- Do not create dead buttons or decorative controls that appear interactive.
- Do not hard-code the same content in multiple components.
- Use meaningful filenames and consistent naming.
- Avoid giant single-file implementations.
- Add comments only where they clarify non-obvious decisions.
- Do not invent real business policies, product specifications, legal claims or customer testimonials.

## 6. Mock data and prototype honesty
- Clearly distinguish sample content from verified business data.
- Use fictional sample products, prices, stock and customers.
- Never claim that a demo login is secure authentication.
- Never claim that a demo checkout created a real order.
- Never claim a WhatsApp message was sent.
- Never claim a newsletter subscription was stored remotely.
- Keep mock services isolated so they can later be replaced by API services.

## 7. Responsive and browser testing
At minimum, test:
- 320 × 700
- 375 × 812
- 430 × 900
- 768 × 1024
- 1024 × 768
- 1440 × 900

Check:
- No horizontal overflow.
- Header and bottom dock do not obscure content.
- Product grids have consistent spacing.
- Images preserve intended aspect ratios.
- Drawers and dialogs fit small screens.
- Checkout controls remain reachable.
- Touch targets are practical.
- Keyboard navigation works.
- Reduced-motion preference is respected.

## 8. Functional testing checklist
- BEAR/SOW switch updates theme and content.
- BEAR logo remains unchanged in both modes.
- Navigation links work.
- Search returns mock products and has an empty state.
- Filters and sorting change visible results.
- Product gallery and variant selection work.
- Unavailable sizes cannot be added.
- Add-to-bag updates cart state.
- Quantity changes and removal work.
- Wishlist toggles and persists in demo state.
- Checkout validates and preserves form values.
- Mobile swipe and tap navigation both work.
- Desktop checkout has no swipe/slide controls.
- Final mobile slider and tap alternative share one guarded handler.
- All visible controls have meaningful behaviour.
- No console errors or broken assets.

## 9. Security boundary
Even in the frontend prototype:
- Never place secret keys or credentials in source code.
- Do not collect real payment information.
- Do not store real passwords.
- Do not treat local storage as secure authentication or authoritative order storage.
- Do not trust client-side prices, discounts or stock in the future backend.
- Keep future privileged operations server-side.

## 10. Completion report
At the end of the frontend milestone, report:
- Pages and components implemented.
- Interactions completed.
- Responsive widths tested.
- Accessibility checks completed.
- Known limitations and placeholder content.
- Bugs still open.
- Exact command to run the project.
- Confirmation that backend work has not started.

## 11. Stop conditions
Stop and ask the user before proceeding if:
- A required brand asset is missing and cannot be reasonably represented by a placeholder.
- A requested change contradicts a non-negotiable brand rule.
- A task requires real customer data, credentials, payment or production access.
- The scope would require backend work before frontend approval.
- Existing project structure or code conflicts with the documented architecture.
