/**
 * BEAR Admin — Service Layer
 * Wraps /api/v1/admin/* with full mock fallback for all 11 sections.
 */

const BASE = 'http://localhost:4000/api/v1/admin';
const TIMEOUT = 3000;

async function apiFetch(path, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...opts, signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch { clearTimeout(t); return null; }
}

// ── Mock: Orders ──────────────────────────────────────────────────────────────

export const MOCK_ORDERS = [
  { id: 'ord-001', order_number: 'BEAR-20261104-A1B2', customer_name: 'Vikram Malhotra', customer_phone: '9876543210', customer_email: 'vikram@example.com', status: 'pending_whatsapp', total_amount: 2999, items: [{ name: 'BEAR Oversized Tee', size: 'L', colour: 'Pitch Black', qty: 1, price: 2999 }], shipping_address: '14, Sector 21, Gurugram, Haryana 122001', carrier_name: null, tracking_number: null, tracking_url: null, admin_notes: null, created_at: '2026-11-04T01:45:00Z' },
  { id: 'ord-002', order_number: 'BEAR-20261103-C3D4', customer_name: 'Priya Nair', customer_phone: '9845012345', customer_email: 'priya@example.com', status: 'confirmed', total_amount: 5498, items: [{ name: 'SOW Sculpt Leggings', size: 'S', colour: 'Terracotta', qty: 2, price: 2749 }], shipping_address: '7, Koramangala 4th Block, Bengaluru, Karnataka 560034', carrier_name: null, tracking_number: null, tracking_url: null, admin_notes: 'Confirmed via WhatsApp', created_at: '2026-11-03T14:20:00Z' },
  { id: 'ord-003', order_number: 'BEAR-20261103-E5F6', customer_name: 'Arjun Sharma', customer_phone: '9988776655', customer_email: 'arjun@example.com', status: 'shipped', total_amount: 3499, items: [{ name: 'BEAR Training Shorts', size: 'M', colour: 'Charcoal', qty: 1, price: 3499 }], shipping_address: '22, Andheri West, Mumbai, Maharashtra 400058', carrier_name: 'BlueDart Express', tracking_number: 'BD-889210948', tracking_url: 'https://www.bluedart.com/tracking/BD-889210948', admin_notes: null, created_at: '2026-11-03T09:10:00Z' },
  { id: 'ord-004', order_number: 'BEAR-20261102-G7H8', customer_name: 'Sneha Reddy', customer_phone: '9123456789', customer_email: 'sneha@example.com', status: 'delivered', total_amount: 7998, items: [{ name: 'SOW Sports Bra', size: 'M', colour: 'Rose Earth', qty: 2, price: 1999 }, { name: 'SOW Sculpt Leggings', size: 'M', colour: 'Sand', qty: 1, price: 2749 }], shipping_address: '3, Banjara Hills, Hyderabad, Telangana 500034', carrier_name: 'BlueDart Express', tracking_number: 'BD-776543210', tracking_url: 'https://www.bluedart.com/tracking/BD-776543210', admin_notes: 'Delivered on time', created_at: '2026-11-02T11:30:00Z' },
  { id: 'ord-005', order_number: 'BEAR-20261102-I9J0', customer_name: 'Rahul Gupta', customer_phone: '9012345678', customer_email: 'rahul@example.com', status: 'pending_whatsapp', total_amount: 4299, items: [{ name: 'BEAR Compression Tights', size: 'XL', colour: 'Ice Grey', qty: 1, price: 4299 }], shipping_address: '55, Civil Lines, Jaipur, Rajasthan 302006', carrier_name: null, tracking_number: null, tracking_url: null, admin_notes: null, created_at: '2026-11-02T08:55:00Z' },
  { id: 'ord-006', order_number: 'BEAR-20261101-K1L2', customer_name: 'Meera Iyer', customer_phone: '9765432109', customer_email: 'meera@example.com', status: 'cancelled', total_amount: 2749, items: [{ name: 'SOW Sculpt Leggings', size: 'XS', colour: 'Cashmere', qty: 1, price: 2749 }], shipping_address: '9, T Nagar, Chennai, Tamil Nadu 600017', carrier_name: null, tracking_number: null, tracking_url: null, admin_notes: 'Customer requested cancellation', created_at: '2026-11-01T16:40:00Z' },
  { id: 'ord-007', order_number: 'BEAR-20261101-M3N4', customer_name: 'Karan Mehta', customer_phone: '9654321098', customer_email: 'karan@example.com', status: 'confirmed', total_amount: 6998, items: [{ name: 'BEAR Oversized Tee', size: 'XXL', colour: 'Pitch Black', qty: 2, price: 2999 }, { name: 'BEAR Training Shorts', size: 'XL', colour: 'Charcoal', qty: 1, price: 3499 }], shipping_address: '18, Powai, Mumbai, Maharashtra 400076', carrier_name: null, tracking_number: null, tracking_url: null, admin_notes: null, created_at: '2026-11-01T12:15:00Z' },
  { id: 'ord-008', order_number: 'BEAR-20261031-O5P6', customer_name: 'Divya Krishnan', customer_phone: '9543210987', customer_email: 'divya@example.com', status: 'shipped', total_amount: 3998, items: [{ name: 'SOW Sports Bra', size: 'S', colour: 'Terracotta', qty: 2, price: 1999 }], shipping_address: '41, Indiranagar, Bengaluru, Karnataka 560038', carrier_name: 'Delhivery', tracking_number: 'DL-334455667', tracking_url: null, admin_notes: null, created_at: '2026-10-31T10:00:00Z' },
  { id: 'ord-009', order_number: 'BEAR-20261030-P7Q8', customer_name: 'Aditya Verma', customer_phone: '9432109876', customer_email: 'aditya@example.com', status: 'processing', total_amount: 5998, items: [{ name: 'BEAR Oversized Tee', size: 'M', colour: 'Ice Grey', qty: 2, price: 2999 }], shipping_address: '12, Vasant Kunj, New Delhi 110070', carrier_name: null, tracking_number: null, tracking_url: null, admin_notes: 'Payment verified', created_at: '2026-10-30T15:20:00Z' },
  { id: 'ord-010', order_number: 'BEAR-20261029-R9S0', customer_name: 'Ananya Pillai', customer_phone: '9321098765', customer_email: 'ananya@example.com', status: 'returned', total_amount: 2749, items: [{ name: 'SOW Sculpt Leggings', size: 'L', colour: 'Sand', qty: 1, price: 2749 }], shipping_address: '5, Jubilee Hills, Hyderabad, Telangana 500033', carrier_name: 'BlueDart Express', tracking_number: 'BD-112233445', tracking_url: null, admin_notes: 'Size exchange requested', created_at: '2026-10-29T09:00:00Z' },
];

// ── Mock: Inventory ───────────────────────────────────────────────────────────

export const MOCK_INVENTORY = [
  { variant_id: 'var-001', product_name: 'BEAR Oversized Tee', mode: 'bear', colour: 'Pitch Black', size: 'S', sku: 'BEAR-OT-PB-S', quantity_available: 24, quantity_reserved: 2, low_stock_threshold: 5, is_active: true },
  { variant_id: 'var-002', product_name: 'BEAR Oversized Tee', mode: 'bear', colour: 'Pitch Black', size: 'M', sku: 'BEAR-OT-PB-M', quantity_available: 3, quantity_reserved: 1, low_stock_threshold: 5, is_active: true },
  { variant_id: 'var-003', product_name: 'BEAR Oversized Tee', mode: 'bear', colour: 'Pitch Black', size: 'L', sku: 'BEAR-OT-PB-L', quantity_available: 18, quantity_reserved: 3, low_stock_threshold: 5, is_active: true },
  { variant_id: 'var-004', product_name: 'BEAR Oversized Tee', mode: 'bear', colour: 'Pitch Black', size: 'XL', sku: 'BEAR-OT-PB-XL', quantity_available: 11, quantity_reserved: 0, low_stock_threshold: 5, is_active: true },
  { variant_id: 'var-005', product_name: 'BEAR Oversized Tee', mode: 'bear', colour: 'Charcoal', size: 'M', sku: 'BEAR-OT-CH-M', quantity_available: 2, quantity_reserved: 2, low_stock_threshold: 5, is_active: true },
  { variant_id: 'var-006', product_name: 'BEAR Oversized Tee', mode: 'bear', colour: 'Charcoal', size: 'L', sku: 'BEAR-OT-CH-L', quantity_available: 9, quantity_reserved: 1, low_stock_threshold: 5, is_active: true },
  { variant_id: 'var-007', product_name: 'BEAR Training Shorts', mode: 'bear', colour: 'Pitch Black', size: 'S', sku: 'BEAR-TS-PB-S', quantity_available: 15, quantity_reserved: 0, low_stock_threshold: 5, is_active: true },
  { variant_id: 'var-008', product_name: 'BEAR Training Shorts', mode: 'bear', colour: 'Pitch Black', size: 'M', sku: 'BEAR-TS-PB-M', quantity_available: 4, quantity_reserved: 2, low_stock_threshold: 5, is_active: true },
  { variant_id: 'var-009', product_name: 'BEAR Training Shorts', mode: 'bear', colour: 'Charcoal', size: 'L', sku: 'BEAR-TS-CH-L', quantity_available: 0, quantity_reserved: 0, low_stock_threshold: 5, is_active: true },
  { variant_id: 'var-010', product_name: 'BEAR Compression Tights', mode: 'bear', colour: 'Ice Grey', size: 'M', sku: 'BEAR-CT-IG-M', quantity_available: 22, quantity_reserved: 1, low_stock_threshold: 5, is_active: true },
  { variant_id: 'var-011', product_name: 'BEAR Compression Tights', mode: 'bear', colour: 'Ice Grey', size: 'L', sku: 'BEAR-CT-IG-L', quantity_available: 7, quantity_reserved: 0, low_stock_threshold: 5, is_active: true },
  { variant_id: 'var-012', product_name: 'SOW Sculpt Leggings', mode: 'sow', colour: 'Terracotta', size: 'XS', sku: 'SOW-SL-TC-XS', quantity_available: 3, quantity_reserved: 1, low_stock_threshold: 5, is_active: true },
  { variant_id: 'var-013', product_name: 'SOW Sculpt Leggings', mode: 'sow', colour: 'Terracotta', size: 'S', sku: 'SOW-SL-TC-S', quantity_available: 14, quantity_reserved: 2, low_stock_threshold: 5, is_active: true },
  { variant_id: 'var-014', product_name: 'SOW Sculpt Leggings', mode: 'sow', colour: 'Cashmere', size: 'M', sku: 'SOW-SL-CA-M', quantity_available: 8, quantity_reserved: 0, low_stock_threshold: 5, is_active: true },
  { variant_id: 'var-015', product_name: 'SOW Sculpt Leggings', mode: 'sow', colour: 'Sand', size: 'L', sku: 'SOW-SL-SA-L', quantity_available: 1, quantity_reserved: 1, low_stock_threshold: 5, is_active: true },
  { variant_id: 'var-016', product_name: 'SOW Sports Bra', mode: 'sow', colour: 'Rose Earth', size: 'XS', sku: 'SOW-SB-RE-XS', quantity_available: 19, quantity_reserved: 0, low_stock_threshold: 5, is_active: true },
  { variant_id: 'var-017', product_name: 'SOW Sports Bra', mode: 'sow', colour: 'Rose Earth', size: 'S', sku: 'SOW-SB-RE-S', quantity_available: 6, quantity_reserved: 3, low_stock_threshold: 5, is_active: true },
  { variant_id: 'var-018', product_name: 'SOW Sports Bra', mode: 'sow', colour: 'Terracotta', size: 'M', sku: 'SOW-SB-TC-M', quantity_available: 2, quantity_reserved: 0, low_stock_threshold: 5, is_active: true },
];

// ── Mock: Products ────────────────────────────────────────────────────────────

export const MOCK_PRODUCTS = [
  { id: 'prod-001', name: 'BEAR Oversized Tee', slug: 'bear-oversized-tee', mode: 'bear', category: 'T-Shirts', price: 2999, compare_price: 3999, sku_base: 'BEAR-OT', description: '480 GSM heavyweight cotton. Dropped shoulders, boxy silhouette. Built for discipline.', colours: ['Pitch Black', 'Charcoal', 'Ice Grey'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], is_published: true, created_at: '2026-10-01T00:00:00Z' },
  { id: 'prod-002', name: 'BEAR Training Shorts', slug: 'bear-training-shorts', mode: 'bear', category: 'Shorts', price: 3499, compare_price: 4499, sku_base: 'BEAR-TS', description: 'Technical stretch fabric. 7-inch inseam. Zippered pockets. Built for performance.', colours: ['Pitch Black', 'Charcoal'], sizes: ['S', 'M', 'L', 'XL'], is_published: true, created_at: '2026-10-01T00:00:00Z' },
  { id: 'prod-003', name: 'BEAR Compression Tights', slug: 'bear-compression-tights', mode: 'bear', category: 'Bottoms', price: 4299, compare_price: 5499, sku_base: 'BEAR-CT', description: 'Four-way stretch compression. Moisture-wicking. Flatlock seams. Zero chafe.', colours: ['Ice Grey', 'Pitch Black'], sizes: ['S', 'M', 'L', 'XL'], is_published: true, created_at: '2026-10-05T00:00:00Z' },
  { id: 'prod-004', name: 'SOW Sculpt Leggings', slug: 'sow-sculpt-leggings', mode: 'sow', category: 'Leggings', price: 2749, compare_price: 3749, sku_base: 'SOW-SL', description: 'High-waist sculpt fit. Buttery-soft fabric. Squat-proof. Designed for movement.', colours: ['Terracotta', 'Cashmere', 'Sand', 'Rose Earth'], sizes: ['XS', 'S', 'M', 'L', 'XL'], is_published: true, created_at: '2026-10-01T00:00:00Z' },
  { id: 'prod-005', name: 'SOW Sports Bra', slug: 'sow-sports-bra', mode: 'sow', category: 'Sports Bras', price: 1999, compare_price: 2799, sku_base: 'SOW-SB', description: 'Medium-impact support. Removable pads. Racerback design. Sculpted for confidence.', colours: ['Rose Earth', 'Terracotta', 'Cashmere'], sizes: ['XS', 'S', 'M', 'L'], is_published: true, created_at: '2026-10-01T00:00:00Z' },
  { id: 'prod-006', name: 'BEAR Performance Hoodie', slug: 'bear-performance-hoodie', mode: 'bear', category: 'Hoodies', price: 5499, compare_price: 6999, sku_base: 'BEAR-PH', description: 'French terry 400 GSM. Kangaroo pocket. Ribbed cuffs. Heavyweight warmth.', colours: ['Pitch Black', 'Charcoal'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], is_published: false, created_at: '2026-10-15T00:00:00Z' },
];

export const MOCK_CATEGORIES = [
  { id: 'cat-001', name: 'T-Shirts', mode: 'bear', product_count: 1, is_active: true },
  { id: 'cat-002', name: 'Shorts', mode: 'bear', product_count: 1, is_active: true },
  { id: 'cat-003', name: 'Bottoms', mode: 'bear', product_count: 1, is_active: true },
  { id: 'cat-004', name: 'Hoodies', mode: 'bear', product_count: 1, is_active: true },
  { id: 'cat-005', name: 'Leggings', mode: 'sow', product_count: 1, is_active: true },
  { id: 'cat-006', name: 'Sports Bras', mode: 'sow', product_count: 1, is_active: true },
];

// ── Mock: Customers ───────────────────────────────────────────────────────────

export const MOCK_CUSTOMERS = [
  { id: 'cust-001', name: 'Vikram Malhotra', email: 'vikram@example.com', phone: '9876543210', city: 'Gurugram', state: 'Haryana', order_count: 3, total_spent: 8997, last_order_at: '2026-11-04T01:45:00Z', notes: '', created_at: '2026-09-10T00:00:00Z' },
  { id: 'cust-002', name: 'Priya Nair', email: 'priya@example.com', phone: '9845012345', city: 'Bengaluru', state: 'Karnataka', order_count: 2, total_spent: 8247, last_order_at: '2026-11-03T14:20:00Z', notes: 'Prefers SOW collection', created_at: '2026-09-15T00:00:00Z' },
  { id: 'cust-003', name: 'Arjun Sharma', email: 'arjun@example.com', phone: '9988776655', city: 'Mumbai', state: 'Maharashtra', order_count: 5, total_spent: 17495, last_order_at: '2026-11-03T09:10:00Z', notes: '', created_at: '2026-08-20T00:00:00Z' },
  { id: 'cust-004', name: 'Sneha Reddy', email: 'sneha@example.com', phone: '9123456789', city: 'Hyderabad', state: 'Telangana', order_count: 4, total_spent: 15996, last_order_at: '2026-11-02T11:30:00Z', notes: 'VIP customer', created_at: '2026-08-01T00:00:00Z' },
  { id: 'cust-005', name: 'Rahul Gupta', email: 'rahul@example.com', phone: '9012345678', city: 'Jaipur', state: 'Rajasthan', order_count: 1, total_spent: 4299, last_order_at: '2026-11-02T08:55:00Z', notes: '', created_at: '2026-11-02T00:00:00Z' },
  { id: 'cust-006', name: 'Meera Iyer', email: 'meera@example.com', phone: '9765432109', city: 'Chennai', state: 'Tamil Nadu', order_count: 2, total_spent: 5498, last_order_at: '2026-11-01T16:40:00Z', notes: 'Cancelled last order', created_at: '2026-10-01T00:00:00Z' },
  { id: 'cust-007', name: 'Karan Mehta', email: 'karan@example.com', phone: '9654321098', city: 'Mumbai', state: 'Maharashtra', order_count: 3, total_spent: 13996, last_order_at: '2026-11-01T12:15:00Z', notes: '', created_at: '2026-09-05T00:00:00Z' },
];

// ── Mock: Discounts ───────────────────────────────────────────────────────────

export const MOCK_COUPONS = [
  { id: 'coup-001', code: 'BEAR10', type: 'percentage', value: 10, min_order: 2000, usage_count: 34, usage_limit: 100, is_active: true, expires_at: '2026-12-31T23:59:59Z' },
  { id: 'coup-002', code: 'WELCOME500', type: 'fixed', value: 500, min_order: 2500, usage_count: 12, usage_limit: 50, is_active: true, expires_at: '2026-12-31T23:59:59Z' },
  { id: 'coup-003', code: 'DROP20', type: 'percentage', value: 20, min_order: 4000, usage_count: 8, usage_limit: 30, is_active: true, expires_at: '2026-11-30T23:59:59Z' },
  { id: 'coup-004', code: 'SOW15', type: 'percentage', value: 15, min_order: 1999, usage_count: 21, usage_limit: 75, is_active: false, expires_at: '2026-10-31T23:59:59Z' },
];

export const MOCK_AUTO_DISCOUNTS = [
  { id: 'auto-001', name: 'Buy 2 Get 10% Off', condition: 'cart_quantity >= 2', discount_type: 'percentage', value: 10, is_active: true },
  { id: 'auto-002', name: 'Order Above ₹5000 — Free Gift', condition: 'cart_total >= 5000', discount_type: 'free_gift', value: 0, is_active: false },
];

// ── Mock: Promotions ──────────────────────────────────────────────────────────

export const MOCK_PROMOTIONS = {
  announcement_bar: {
    text: 'Complimentary domestic shipping across India • Seamless WhatsApp checkout',
    is_active: true,
    bg_color: '#000000',
  },
  hero_banners: [
    { id: 'ban-001', title: 'BUILT FOR MORE', subtitle: 'New BEAR Drop — 480 GSM Oversized Tees', cta_text: 'Shop Now', cta_link: '#collection', mode: 'bear', is_active: true },
    { id: 'ban-002', title: 'SCULPTED FOR YOU', subtitle: 'SOW Autumn Collection — Terracotta & Sand', cta_text: 'Explore SOW', cta_link: '#collection', mode: 'sow', is_active: false },
  ],
  popup: {
    title: 'Get ₹500 Off Your First Order',
    body: 'Use code WELCOME500 at checkout.',
    cta_text: 'Claim Offer',
    is_active: false,
    delay_seconds: 5,
  },
};

// ── Mock: Staff ───────────────────────────────────────────────────────────────

export const MOCK_STAFF = [
  { id: 'staff-001', name: 'Store Owner', email: 'admin@bear.in', role: 'super_admin', last_login: '2026-11-04T08:00:00Z', is_active: true },
  { id: 'staff-002', name: 'Ops Manager', email: 'ops@bear.in', role: 'manager', last_login: '2026-11-03T10:30:00Z', is_active: true },
];

export const MOCK_AUDIT_LOGS = [
  { id: 'log-001', admin: 'admin@bear.in', action: 'Updated order BEAR-20261103-E5F6 to shipped', created_at: '2026-11-03T11:00:00Z' },
  { id: 'log-002', admin: 'admin@bear.in', action: 'Added coupon BEAR10', created_at: '2026-11-02T09:00:00Z' },
  { id: 'log-003', admin: 'ops@bear.in', action: 'Updated inventory BEAR-OT-PB-M +10 units', created_at: '2026-11-01T14:00:00Z' },
  { id: 'log-004', admin: 'admin@bear.in', action: 'Published product BEAR Oversized Tee', created_at: '2026-10-30T10:00:00Z' },
];

export const MOCK_SETTINGS = {
  store_name: 'BEAR Performance Wear',
  whatsapp_number: '919605210198',
  support_email: 'support@bearperformance.in',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  low_stock_threshold: 5,
  order_expiry_minutes: 30,
};

// ── Mock: Dashboard ───────────────────────────────────────────────────────────

export const MOCK_DASHBOARD = {
  totalRevenue: 482900,
  bearRevenue: 298400,
  sowRevenue: 184500,
  totalOrders: 142,
  pendingWhatsApp: 9,
  confirmed: 18,
  processing: 7,
  shipped: 24,
  delivered: 76,
  cancelled: 8,
  lowStockCount: 4,
  recentOrders: MOCK_ORDERS.slice(0, 6),
};

// ── Public API ────────────────────────────────────────────────────────────────

export async function getDashboard() {
  const d = await apiFetch('/dashboard');
  return d?.success ? { ...d.data, _mock: false } : { ...MOCK_DASHBOARD, _mock: true };
}

export async function getOrders(status = 'all') {
  const d = await apiFetch(`/orders?status=${status}&limit=100`);
  if (d?.success) return { orders: d.data, _mock: false };
  const list = status === 'all' ? MOCK_ORDERS : MOCK_ORDERS.filter(o => o.status === status);
  return { orders: list, _mock: true };
}

export async function updateOrderStatus(id, payload) {
  const d = await apiFetch(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) });
  if (d?.success) return { _mock: false };
  const idx = MOCK_ORDERS.findIndex(o => o.id === id);
  if (idx !== -1) Object.assign(MOCK_ORDERS[idx], payload);
  return { _mock: true };
}

export async function getInventory() {
  const d = await apiFetch('/inventory');
  return d?.success ? { inventory: d.data, _mock: false } : { inventory: MOCK_INVENTORY, _mock: true };
}

export async function updateInventory(variantId, payload) {
  const d = await apiFetch(`/inventory/${variantId}`, { method: 'PATCH', body: JSON.stringify(payload) });
  if (d?.success) return { _mock: false };
  const idx = MOCK_INVENTORY.findIndex(v => v.variant_id === variantId);
  if (idx !== -1 && payload.quantityAvailable !== undefined) MOCK_INVENTORY[idx].quantity_available = payload.quantityAvailable;
  return { _mock: true };
}

export async function getProducts() {
  const d = await apiFetch('/products');
  return d?.success ? { products: d.data, _mock: false } : { products: MOCK_PRODUCTS, _mock: true };
}

export async function updateProduct(id, payload) {
  const d = await apiFetch(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  if (d?.success) return { _mock: false };
  const idx = MOCK_PRODUCTS.findIndex(p => p.id === id);
  if (idx !== -1) Object.assign(MOCK_PRODUCTS[idx], payload);
  return { _mock: true };
}

export async function getCustomers() {
  const d = await apiFetch('/customers');
  return d?.success ? { customers: d.data, _mock: false } : { customers: MOCK_CUSTOMERS, _mock: true };
}

export async function updateCustomerNotes(id, notes) {
  const d = await apiFetch(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify({ notes }) });
  if (d?.success) return { _mock: false };
  const idx = MOCK_CUSTOMERS.findIndex(c => c.id === id);
  if (idx !== -1) MOCK_CUSTOMERS[idx].notes = notes;
  return { _mock: true };
}

export async function getCoupons() {
  const d = await apiFetch('/discounts');
  return d?.success ? { coupons: d.data, _mock: false } : { coupons: MOCK_COUPONS, _mock: true };
}

export async function saveCoupon(payload) {
  const d = await apiFetch('/discounts', { method: 'POST', body: JSON.stringify(payload) });
  if (d?.success) return { _mock: false };
  MOCK_COUPONS.push({ id: `coup-${Date.now()}`, usage_count: 0, ...payload });
  return { _mock: true };
}

export async function toggleCoupon(id, is_active) {
  const d = await apiFetch(`/discounts/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active }) });
  if (d?.success) return { _mock: false };
  const idx = MOCK_COUPONS.findIndex(c => c.id === id);
  if (idx !== -1) MOCK_COUPONS[idx].is_active = is_active;
  return { _mock: true };
}

export async function getPromotions() {
  const d = await apiFetch('/promotions');
  return d?.success ? { promotions: d.data, _mock: false } : { promotions: MOCK_PROMOTIONS, _mock: true };
}

export async function savePromotions(payload) {
  const d = await apiFetch('/promotions', { method: 'PUT', body: JSON.stringify(payload) });
  if (d?.success) return { _mock: false };
  Object.assign(MOCK_PROMOTIONS, payload);
  return { _mock: true };
}

export async function getStaff() {
  return { staff: MOCK_STAFF, logs: MOCK_AUDIT_LOGS, _mock: true };
}

export async function getSettings() {
  return { settings: MOCK_SETTINGS, _mock: true };
}

export async function saveSettings(payload) {
  Object.assign(MOCK_SETTINGS, payload);
  return { _mock: true };
}

export default {
  getDashboard, getOrders, updateOrderStatus,
  getInventory, updateInventory,
  getProducts, updateProduct,
  getCustomers, updateCustomerNotes,
  getCoupons, saveCoupon, toggleCoupon,
  getPromotions, savePromotions,
  getStaff, getSettings, saveSettings,
};
