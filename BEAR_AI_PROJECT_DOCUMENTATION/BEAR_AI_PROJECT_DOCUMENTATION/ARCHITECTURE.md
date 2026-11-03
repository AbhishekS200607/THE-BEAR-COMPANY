# BEAR — Technical Architecture

## 1. Architecture status
**Current milestone: frontend only.** Build and validate the complete storefront experience using HTML, CSS and Vanilla JavaScript. Do not implement the backend, database, authentication provider, API server or production integrations during this milestone.

The architecture below records the intended future system so frontend decisions do not block it.

## 2. Technology decisions

### Frontend — build now
- HTML5
- CSS3
- Vanilla JavaScript (ES modules)
- Vite may be used as a development/build tool.
- No React, Vue, Angular or other frontend framework.
- No TypeScript unless separately approved.
- Use mock data and a local mock service layer.

### Backend — future phase only
- Node.js
- Express
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage for product media
- Upstash Redis for distributed rate limiting
- Resend for email
- Vercel hosting and Vercel Functions/Cron

Do not install or configure the backend stack during the frontend milestone.

## 3. System overview (future target)
```text
Customer browser
  ├── BEAR storefront (HTML/CSS/Vanilla JS)
  └── Admin application (separate frontend)
          |
          v
     Node.js + Express API
          |
          v
     Supabase PostgreSQL
       ├── Auth
       ├── Storage
       └── Realtime (optional)
          |
          ├── Upstash Redis (rate limits)
          └── Resend (email)
```

## 4. Frontend architecture
Use a modular, framework-free structure. Suggested structure:

```text
bear-store/
├── index.html
├── package.json
├── vite.config.js
├── README.md
├── public/
│   ├── favicon.svg
│   └── assets/
│       ├── logo/
│       ├── hero/
│       ├── products/
│       └── campaigns/
└── src/
    ├── main.js
    ├── styles/
    │   ├── tokens.css
    │   ├── reset.css
    │   ├── global.css
    │   ├── layout.css
    │   ├── components.css
    │   └── responsive.css
    ├── data/
    │   ├── products.js
    │   ├── collections.js
    │   └── content.js
    ├── services/
    │   ├── mockStore.js
    │   ├── productService.js
    │   ├── cartService.js
    │   ├── accountService.js
    │   └── checkoutService.js
    ├── state/
    │   └── store.js
    ├── components/
    │   ├── header.js
    │   ├── modeSwitch.js
    │   ├── productCard.js
    │   ├── productGrid.js
    │   ├── drawer.js
    │   ├── modal.js
    │   └── toast.js
    ├── pages/
    │   ├── home.js
    │   ├── collection.js
    │   ├── product.js
    │   ├── cart.js
    │   ├── checkout.js
    │   └── account.js
    └── utils/
        ├── formatCurrency.js
        ├── validation.js
        └── accessibility.js
```

This is a recommended structure, not a requirement to create empty files. Keep modules small and purposeful.

## 5. Frontend data boundary
- All product, collection, banner, cart and order data is mock data.
- Keep mock data separate from UI rendering.
- UI components must call service functions rather than directly depending on hard-coded arrays.
- Service functions should return Promises where practical, making future API replacement straightforward.
- Do not put Supabase keys, API secrets or fake credentials in frontend files.
- Do not claim that mock checkout creates a real order or sends a real WhatsApp message.
- Clearly mark demo-only behaviour in development documentation.

## 6. Future backend integration boundary
When backend work is approved:
- Replace mock service implementations with calls to `/api/v1`.
- Preserve the UI component contracts where possible.
- Backend owns authoritative prices, discounts, stock, order status and permissions.
- Never trust client-submitted prices or stock values.
- Never expose the Supabase secret/service-role key in browser code.
- Customer data must be isolated by authenticated user.
- Use server-side authorization and database Row Level Security.

## 7. Future deployment
Target separate Vercel projects:
- Storefront: `www.yourdomain.com`
- Admin: `admin.yourdomain.com`
- API: `api.yourdomain.com`

Use separate staging and production Supabase projects. Do not deploy production services until the frontend milestone is reviewed and approved.
