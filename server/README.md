# BEAR E-Commerce — Node.js REST API

Production-ready REST API for BEAR Performance Wear and SOW Active Luxury.

## Architecture

```text
Frontend (Vanilla JS SPA) -> Node.js + Express REST API -> Supabase PostgreSQL (RLS)
```

## Security & Architecture Highlights
- **Helmet**: Comprehensive HTTP security headers.
- **Strict CORS**: Allowlist tied to `CORS_ORIGIN` (default: `http://localhost:5173`).
- **Rate Limiting**: Public endpoints (100 req / 15 min), sensitive checkout and tracking endpoints (15 req / 15 min).
- **Zod Schema Validation**: All request bodies, query params, and route parameters strictly validated.
- **Atomic Stock Reservation**: Server computes prices and calls atomic PostgreSQL RPC `create_order_with_reservation`.
- **Zero Frontend Secrets**: Supabase `service_role` key used strictly on the server.
- **WhatsApp Integration**: Formats pre-filled message using unified business variable `WHATSAPP_BUSINESS_NUMBER=919605210198`.

## API Endpoints

### 1. System
- `GET /api/v1/health` — Health check endpoint.

### 2. Public Catalog
- `GET /api/v1/products?mode=bear&category=t-shirts&search=oversized` — List active products.
- `GET /api/v1/products/:slug` — Single active product with variants and real-time stock availability.
- `GET /api/v1/categories?mode=bear` — List product categories.

### 3. Orders & WhatsApp Checkout
- `POST /api/v1/orders` — Create an order request, reserve stock for 120 minutes, and return WhatsApp handoff URL.
  - Requires header `Idempotency-Key: <unique-string>`
  - Body:
    ```json
    {
      "items": [{ "variant_id": "uuid", "quantity": 1 }],
      "customerName": "Arjun Sharma",
      "customerPhone": "9876543210",
      "deliveryLine1": "24 Green Park",
      "deliveryLine2": "Near Metro",
      "deliveryCity": "New Delhi",
      "deliveryState": "Delhi",
      "deliveryPincode": "110016"
    }
    ```
- `GET /api/v1/orders/track?orderNumber=BEAR-2026-XXXXXX&phone=9876543210` — Protected guest order tracking. Requires both order number and matching phone.

### 4. Customer (Requires Bearer Token)
- `GET /api/v1/customer/profile` — View own profile.
- `PATCH /api/v1/customer/profile` — Update non-privileged profile fields (`fullName`, `phoneNumber`).
- `GET /api/v1/customer/addresses` — List saved addresses.
- `POST /api/v1/customer/addresses` — Add shipping address.
- `DELETE /api/v1/customer/addresses/:id` — Delete address.
- `GET /api/v1/customer/orders` — View customer's own order history.

### 5. Admin (Requires Admin / Super-Admin Bearer Token)
- `GET /api/v1/admin/dashboard` — Live business statistics (orders, revenue in ₹, pending WhatsApp count).
- `GET /api/v1/admin/orders?status=pending_whatsapp` — List orders with filters and pagination.
- `PATCH /api/v1/admin/orders/:id/status` — Update order status, add tracking AWB and carrier.
- `GET /api/v1/admin/inventory` — View SKU-level stock (available, reserved, unreserved).
- `PATCH /api/v1/admin/inventory/:variantId` — Adjust stock and low-stock thresholds with audit logging.

## Local Development
```bash
# In server/
npm install
npm run dev # Starts on port 4000
```

