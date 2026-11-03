# BEAR — Design Direction

## 1. Purpose
This document defines the visual identity and design direction for the BEAR ecommerce storefront. BEAR is the company and primary brand. SOW is the women's shopping mode/collection identity inside BEAR, not a separate company.

## 2. Brand rules
- The company name and header logo always remain **BEAR**, including while SOW mode is active.
- The mode switch labels must be exactly **BEAR** and **SOW**. Never label them MEN/WOMEN.
- BEAR mode uses a monochrome palette: black, white and neutral greys.
- SOW mode uses warm neutrals: beige, dusty rose and warm brown.
- The two modes share the same layout, navigation, components and functionality. Only theme colours and editorial/product presentation change.
- The current catalogue is clothing only. Do not invent accessories.

## 3. Visual character
Create a premium, minimal, editorial performance-fashion storefront:
- Confident, athletic typography.
- Strong product and campaign photography.
- Generous whitespace and clear visual hierarchy.
- Restrained borders, shadows and motion.
- Simple, purposeful layouts.
- A polished fashion-commerce feel, not a generic dashboard or over-designed app.

Avoid:
- Excessive glassmorphism, gradients, glow effects or decorative animation.
- Dense cards, unnecessary badges, cluttered layouts and oversized UI chrome.
- Generic stock imagery presented as actual BEAR product photography.
- Adding unapproved brand names, slogans, product categories or claims.

## 4. Colour tokens
Use CSS custom properties so themes can change without duplicating components.

### BEAR
- `--color-bg: #FFFFFF`
- `--color-surface: #F6F6F4`
- `--color-text: #111111`
- `--color-muted: #777777`
- `--color-border: #E5E5E2`
- `--color-accent: #111111`
- `--color-accent-contrast: #FFFFFF`

### SOW
- `--color-bg: #F8F4EF`
- `--color-surface: #EFE7DF`
- `--color-text: #332923`
- `--color-muted: #88776D`
- `--color-border: #E3D8CE`
- `--color-accent: #8A625B`
- `--color-accent-contrast: #FFFFFF`

These are starting tokens. Keep them centralized and do not scatter literal colours throughout component CSS.

## 5. Typography
- Use a strong, modern sans-serif for headings and navigation.
- Use a highly readable sans-serif for body copy and product information.
- Use a restrained scale with clear contrast between hero heading, section heading, product name and metadata.
- Prefer uppercase sparingly for short navigation labels and campaign statements.
- Use system font fallbacks. Do not make the site depend on a paid font or external font service.

## 6. Photography and image treatment
- Photography is the primary visual asset.
- Hero imagery should be wide, editorial and high quality.
- Product images should use consistent aspect ratios and predictable crops.
- Product gallery should support front, back, side and detail views where supplied.
- BEAR imagery should communicate performance and strength.
- SOW imagery should communicate the same performance category with a softer editorial presentation.
- Use local placeholder assets with clearly named filenames during frontend development. Do not fabricate product photography or imply placeholders are real products.
- Add meaningful alt text.

## 7. Logo
- Use the user-provided BEAR logo asset when available.
- Do not redraw, distort, recolour or alter the logo unless explicitly requested.
- Preserve aspect ratio and clear space.
- The header logo always says BEAR.

## 8. Shared component design
Build reusable components for:
- Announcement bar
- Responsive header/navigation
- BEAR/SOW mode switch
- Search overlay
- Cart drawer
- Account panel/page
- Hero/editorial section
- Collection tiles
- Product card and product grid
- Filter and sort controls
- Product gallery and product details
- Size selector and size guide
- Checkout steps
- Footer
- Toast/feedback messages
- Modal and drawer primitives

## 9. Responsive behaviour
Design mobile-first, then enhance for tablet and desktop.
- Test at 320, 375, 430, 768, 1024 and 1440 CSS pixels.
- Avoid horizontal overflow.
- Use touch targets of approximately 44px or larger.
- Respect safe-area insets.
- Keep product images prominent and product information legible.
- Do not shrink the desktop layout into a phone layout.

## 10. Motion
- Use short, subtle transitions for hover, drawer, modal and theme changes.
- Use a restrained liquid/water-drop-inspired active indicator for the mode switch if it remains clear and accessible.
- Motion must respect `prefers-reduced-motion`.
- Avoid scroll-jacking and decorative motion that delays shopping tasks.
