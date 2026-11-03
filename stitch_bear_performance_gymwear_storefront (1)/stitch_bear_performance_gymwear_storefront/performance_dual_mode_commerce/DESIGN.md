---
name: Performance Dual-Mode Commerce
colors:
  surface: '#f9f9f8'
  surface-dim: '#dadad9'
  surface-bright: '#f9f9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f3'
  surface-container: '#eeeeed'
  surface-container-high: '#e8e8e7'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1f0'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#80534c'
  on-secondary: '#ffffff'
  secondary-container: '#ffc3bb'
  on-secondary-container: '#7b4e48'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002109'
  on-tertiary-container: '#009844'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#ffdad5'
  secondary-fixed-dim: '#f3b8b0'
  on-secondary-fixed: '#32120e'
  on-secondary-fixed-variant: '#653c36'
  tertiary-fixed: '#66ff8e'
  tertiary-fixed-dim: '#3de273'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005322'
  background: '#f9f9f8'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  price-hero:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  price-card:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 20px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
  label-pill:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 4rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
---

## Brand & Style

This design system powers a dual-identity premium Indian gymwear and performance fashion brand. The architecture centers around a synchronized dual shopping mode:
- **BEAR Mode (Men's)**: High-contrast athletic minimalism, stark monochrome blacks, off-whites, neutral charcoals, and razor-sharp structural layouts that evoke relentless discipline, power, and utilitarian technical performance.
- **SOW Mode (Women's)**: Sculpted, warm-earth editorial aesthetics incorporating warm beige, dusty mauve/rose, rich espresso browns, and cream tones, evoking fluid movement, ergonomic grace, and grounded luxury.

The experience bridges high-fashion editorial digital retail with hyper-functional Indian e-commerce utilities (including Indian PIN-code validation and single-tap WhatsApp checkout flows). The aesthetic combines brutalist typography framing with soft, organic pill controls, micro-radii image cards, and airy whitespace.

## Colors

The foundation is built around a dynamic dual-palette system controlled by the active gender browsing state.

### BEAR Palette (Men's Mode)
- **Primary / Dominant**: Pitch Black (`#121212`) for high-impact CTA buttons, logotype, and stark active badges.
- **Surface & Canvas**: Clean Off-White (`#FFFFFF`) to Soft Alabaster (`#F7F7F7`) background tiers.
- **Muted & Borders**: Neutral Charcoal (`#2C2C2E`) and subtle grey line dividers (`#E5E5EA`).
- **Supportive Accents**: Cool Slate (`#8E8E93`) for secondary metadata and disabled states.

### SOW Palette (Women's Mode)
- **Primary / Dominant**: Deep Warm Espresso (`#482D28`) to Earthy Mauve (`#764A44`) for primary interactive triggers and headlines.
- **Surface & Warm Layers**: Soft Linen (`#FAF7F5`), Rose Sand (`#F2EBE5`), and Pale Petal (`#ECE2DC`).
- **Muted & Borders**: Dusty Warm Rose (`#D9C5BD`) and Warm Clay (`#B89A90`).

### Universal Functional Tokens
- **WhatsApp Checkout Primary**: Conversational Commerce Green (`#25D366`), used exclusively on Indian direct-order triggers.
- **Success / Order Confirmed**: Forest Emerald (`#1C7D47`).
- **Rating Accent**: Warm Gold Star (`#E5A93C`).
- **Alert / Destructive**: Crimson Red (`#D32F2F`).

## Typography

The type system blends athletic precision with editorial legibility:
- **Display and Headers (`Space Grotesk`)**: Provides an unapologetic, technical, geometric edge with condensed proportions that emulate modern street-gym high fashion. All campaign slogans (e.g., "BUILT FOR MORE", "POWER IN MOTION") and brand logotypes are styled in uppercase or high-weight tracking.
- **Interface & Text (`Plus Jakarta Sans`)**: Delivers welcoming, crystal-clear readability for product descriptions, form inputs, size charts, and cart calculation summaries.
- **Indian Rupee Formatting**: Currency glyphs (`₹`) must strictly align with font weights and match line baseline heights with trailing integers (`₹999`, `₹1,499`, `₹2,698`). Never omit the currency symbol or isolate it with excessive kerning.

## Layout & Spacing

The layout adapts between rapid handheld shopping and immersive widescreen lookbooks.

### Grid Foundations
- **Mobile (< 768px)**: 4-column layout with `16px` outer canvas margins and `12px` to `16px` gutters. Product listings utilize a fluid 2-column card arrangement. Single column layouts strictly reserved for checkout sheets and product detail pages.
- **Tablet (768px – 1024px)**: 8-column layout with `32px` margins and `16px` gutters.
- **Desktop (1024px+)**: 12-column layout with fixed max-width container (`1360px`) centered in viewport. `24px` gutters allow high-density multi-angle product galleries alongside sticky purchase sidebars.

### Spacing Principles
- **Hero & Lookbook Sections**: Utilize generous vertical intervals (`space-2xl`) to establish brand confidence and breathing room between hero banners and curated collections.
- **Ecommerce Control Clusters**: Tightly pair related functional units (e.g., color dots, size selector tiles, and quantity controls) using `space-xs` and `space-sm` to maintain high gesture ergonomics.

## Elevation & Depth

Visual hierarchy emphasizes clean, crisp separation without heavy skeuomorphic drops.

- **Flat Architectural Baseline**: Main surfaces rely on crisp separation using hairline micro-borders (`1px solid rgba(0, 0, 0, 0.08)` in BEAR mode, `1px solid rgba(118, 74, 68, 0.12)` in SOW mode) rather than dropped shadows.
- **Floating Pill Bars (Mobile Bottom Navigation & Mode Switchers)**: Lifted using ambient diffusion:
  - `box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.08);`
  - In dark mode or BEAR high-contrast cards: `box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.22);`
- **Modals, Drawers & Size Guide Trays**: Render with subtle backdrop blurs (`backdrop-filter: blur(12px); background: rgba(255, 255, 255, 0.85)`) complemented by a gentle top-directional sheet shadow: `0 -12px 32px rgba(0, 0, 0, 0.06)`.

## Shapes

The design language pairs high-density pill capsules with soft-cornered rectangular content surfaces.

- **Buttons, Badges & Toggles**: Fully pill-shaped (`border-radius: 9999px` or level 3). This encompasses primary CTAs ("Add to Bag", "Proceed to Checkout"), gender toggles (BEAR / SOW), filter chips, and floating bottom navigation docks.
- **Media & Product Imagery**: Controlled soft rounding (`12px` on mobile, `16px` on desktop) ensuring fashion editorial shots feel structured, modern, and framed rather than bubbly.
- **Interactive Selectors (Size Tiles)**: Subtle rounded squares (`8px` border radius) providing clear boundary definition for finger taps.
- **Form Inputs & Order Breakdown Containers**: Soft card borders (`10px` to `12px`) balancing administrative clarity with contemporary fashion polish.

## Components

### Dual-Mode Toggle
- Fixed pill capsule switcher in top navigation or sticky utility bar.
- Shows side-by-side labels: **BEAR** and **SOW**.
- Active selection fills with dominant theme color (`#121212` for BEAR, `#764A44` for SOW) with crisp contrast text; inactive mode recedes with subtle grey or sand typography.
- Toggling triggers a global theme transition affecting button fills, hero typography tint, and promotional imagery.

### Buttons
- **Primary CTA**: Full pill shape, high vertical padding (`16px`), bold centered text accompanied by subtle directional indicators (`→`). Deep black in BEAR, rich espresso/mauve in SOW.
- **WhatsApp Checkout Button**: Fixed brand green (`#25D366`) fill with pure white typography and the official messaging icon. Positioned as an immediate alternative or secondary review CTA tailored for high-conversion Indian commerce.
- **Secondary / Outline Buttons**: Transparent background, `1.5px` border matching theme stroke token, instant contrast shift on hover/press.

### Chips & Filter Pills
- Horizontal scrollable filter rows for quick category jumps ("All", "T-Shirts", "Tops", "Shorts", "Joggers").
- Inactive state: Subtle grey/sand background or light contour border.
- Active state: Inverted solid theme color with pure white text.

### Size & Color Selectors
- **Color Swatches**: Circular color dots (`24px` diameter) with an outer ring offset (`2px` gap) indicating current selection.
- **Size Selector Tiles**: Geometric rounded boxes (`42px` × `42px` minimum touch target). Inactive sizes feature light borders; active sizes are filled solid with contrasting white text; out-of-stock sizes show a clean diagonal strikethrough line and 40% opacity.

### Floating Mobile Navigation Bar
- High-aesthetic floating dock anchored at screen bottom (`16px` off bottom edge, padded safe area).
- Houses 5 core destination icons (Home, Categories, Active Brand Emblem Pill, Search, Profile).
- The central brand indicator sits within a distinct contrasting pill badge highlighting the active mode (**BEAR** or **SOW**).

### Form Inputs & Indian Address Fields
- Clean floating-label inputs with soft `8px` corner radii and thin `1px` borders.
- Specific form prioritization for Indian delivery logistics: Full Name, 10-digit Mobile Number (`+91` prefix lock), 6-digit PIN code with automated city/state resolution, street address, and landmark.