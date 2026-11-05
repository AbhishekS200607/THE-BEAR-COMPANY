/**
 * BEAR Store — Admin Service
 * Wraps /api/v1/admin/* endpoints with mock fallback when backend is offline.
 */

const BASE = 'http://localhost:4000/api/v1/admin';
const TIMEOUT_MS = 3000;

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ORDERS = [
  { id: 'ord-001', order_number: 'BEAR-20261104-A1B2', customer_name: 'Vikram Malhotra', customer_phone: '9876543210', status: 'pending_whatsapp', total_amount: 2999, items: [{ name: 'BEAR Oversized Tee', size: 'L', colour: 'Pitch Black', qty: 1, price: 2999 }], shipping_address: '14, Sector 21, Gurugram, Haryana 122001', carrier_name: null, tracking_number: null, admin_notes: null, created_at: '2026-11-04T01:45:00Z' },
  { id: 'ord-002', order_number: 'BEAR-20261103-C3D4', customer_name: 'Priya Nair', customer_phone: '9845012345', status: 'confirmed', total_amount: 5498, items: [{ name: 'SOW Sculpt Leggings', size: 'S', colour: 'Terracotta', qty: 2, price: 2749 }], shipping_address: '7, Koramangala 4th Block, Bengaluru, Karnataka 560034', carrier_name: null, tracking_number: null, admin_notes: 'Confirmed via WhatsApp', created_at: '2026-11-03T14:20:00Z' },
  { id: 'ord-003', order_number: 'BEAR-20261103-E5F6', customer_name: 'Arjun Sharma', customer_phone: '9988776655', status: 'shipped', total_amount: 3499, items: [{ name: 'BEAR Training Shorts', size: 'M', colour: 'Charcoal', qty: 1, price: 3499 }], shipping_address: '22, Andheri West, Mumbai, Maharashtra 400058', carrier_name: 'BlueDart Express', tracking_number: 'BD-889210948', admin_notes: null, created_at: '2026-11-03T09:10:00Z' },
  { id: 'ord-004', order_number: 'BEAR-20261102-G7H8', customer_name: 'Sneha Reddy', customer_phone: '9123456789', status: 'delivered', total_amount: 7998, items: [{ name: 'SOW Sports Bra', size: 'M', colour: 'Rose Earth', qty: 2, price: 1999 }, { name: 'SOW Sculpt Leggings', size: 'M', colour: 'Sand', qty: 1, price: 2749 }], shipping_address: '3, Banjara Hills, Hyderabad, Telangana 500034', carrier_name: 'BlueDart Express', tracking_number: 'BD-776543210', admin_notes: 'Delivered on time', created_at: '2026-11-02T11:30:00Z' },
  { id: 'ord-005', order_number: 'BEAR-20261102-I9J0', customer_name: 'Rahul Gupta', customer_phone: '9012345678', status: 'pending_whatsapp', total_amount: 4299, items: [{ name: 'BEAR Compression Tights', size: 'XL', colour: 'Ice Grey', qty: 1, price: 4299 }], shipping_address: '55, Civil Lines, Jaipur, Rajasthan 302006', carrier_name: null, tracking_number: null, admin_notes: null, created_at: '2026-11-02T08:55:00Z' },
  { id: 'ord-006', order_number: 'BEAR-20261101-K1L2', customer_name: 'Meera Iyer', customer_phone: '9765432109', status: 'cancelled', total_amount: 2749, items: [{ name: 'SOW Sculpt Leggings', size: 'XS', colour: 'Cashmere', qty: 1, price: 2749 }], shipping_address: '9, T Nagar, Chennai, Tamil Nadu 600017', carrier_name: null, tracking_number: null, admin_notes: 'Customer requested cancellation', created_at: '2026-11-01T16:40:00Z' },
  { id: 'ord-007', order_number: 'BEAR-20261101-M3N4', customer_name: 'Karan Mehta', customer_phone: '9654321098', status: 'confirmed', total_amount: 6998, items: [{ name: 'BEAR Oversized Tee', size: 'XXL', colour: 'Pitch Black', qty: 2, price: 2999 }, { name: 'BEAR Training Shorts', size: 'XL', colour: 'Charcoal', qty: 1, price: 3499 }], shipping_address: '18, Powai, Mumbai, Maharashtra 400076', carrier_name: null, tracking_number: null, admin_notes: null, created_at: '2026-11-01T12:15:00Z' },
  { id: 'ord-008', order_number: 'BEAR-20261031-O5P6', customer_name: 'Divya Krishnan', customer_phone: '9543210987', status: 'shipped', total_amount: 3998, items: [{ name: 'SOW Sports Bra', size: 'S', colour: 'Terracotta', qty: 2, price: 1999 }], shipping_address: '41, Indiranagar, Bengaluru, Karnataka 560038', carrier_name: 'Delhivery', tracking_number: 'DL-334455667', admin_notes: null, created_at: '2026-10-31T10:00:00Z' },
];

const MOCK_INVENTORY = [
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

const MOCK_DASHBOARD = {
  totalRevenue: 482900,
  totalOrders: 142,
  pendingWhatsAppOrders: 9,
  lowStockCount: 3,
  recentOrders: MOCK_ORDERS.slice(0, 5),
};

// ─── Fetch Helper ─────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    clearTimeout(timer);
    return null; // signals fallback
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getDashboard() {
  const data = await apiFetch('/dashboard');
  if (data?.success) {
    const d = data.data;
    return {
      totalRevenue: d.totalRevenue ?? 0,
      totalOrders: d.totalOrders ?? 0,
      pendingWhatsAppOrders: d.pendingWhatsApp ?? d.pendingWhatsAppOrders ?? 0,
      lowStockCount: d.lowStockCount ?? 0,
      recentOrders: (d.recentOrders || []).map(o => ({
        customer_name: o.customerName ?? o.customer_name,
        order_number: o.orderNumber ?? o.order_number,
        status: o.status,
        total_amount: o.totalAmount ?? o.total_amount,
        created_at: o.createdAt ?? o.created_at,
      })),
      _mock: false,
    };
  }
  return { ...MOCK_DASHBOARD, _mock: true };
}

export async function getOrders(status = 'all', page = 1) {
  const data = await apiFetch(`/orders?status=${status}&page=${page}&limit=50`);
  if (data?.success) return { orders: data.data, _mock: false };
  const filtered = status === 'all'
    ? MOCK_ORDERS
    : MOCK_ORDERS.filter((o) => o.status === status);
  return { orders: filtered, _mock: true };
}

export async function updateOrderStatus(orderId, payload) {
  const data = await apiFetch(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (data?.success) return { order: data.data, _mock: false };
  // Optimistic mock update
  const idx = MOCK_ORDERS.findIndex((o) => o.id === orderId);
  if (idx !== -1) Object.assign(MOCK_ORDERS[idx], payload);
  return { order: MOCK_ORDERS[idx] || null, _mock: true };
}

export async function getInventory() {
  const data = await apiFetch('/inventory');
  if (data?.success) return { inventory: data.data, _mock: false };
  return { inventory: MOCK_INVENTORY, _mock: true };
}

export async function updateInventory(variantId, payload) {
  const data = await apiFetch(`/inventory/${variantId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (data?.success) return { variant: data.data, _mock: false };
  // Optimistic mock update
  const idx = MOCK_INVENTORY.findIndex((v) => v.variant_id === variantId);
  if (idx !== -1) Object.assign(MOCK_INVENTORY[idx], { quantity_available: payload.quantityAvailable ?? MOCK_INVENTORY[idx].quantity_available });
  return { variant: MOCK_INVENTORY[idx] || null, _mock: true };
}

export default { getDashboard, getOrders, updateOrderStatus, getInventory, updateInventory };
