import { supabaseAdmin } from '../config/supabase.js';

let cachedStats = null;
let cachedStatsTime = 0;
const STATS_TTL_MS = 20 * 1000; // 20s in-memory cache

export function invalidateDashboardStatsCache() {
  cachedStats = null;
  cachedStatsTime = 0;
}

export async function getDashboardStats() {
  if (cachedStats && (Date.now() - cachedStatsTime < STATS_TTL_MS)) {
    return cachedStats;
  }

  const [ordersRes, itemsRes, inventoryRes, recentOrdersRes] = await Promise.all([
    supabaseAdmin.from('orders').select('id, status, total_paise, created_at'),
    supabaseAdmin.from('order_items').select('sku, total_price_paise, orders(status)'),
    supabaseAdmin.from('inventory').select('quantity_available, quantity_reserved, low_stock_threshold'),
    supabaseAdmin.from('orders')
      .select('id, order_number, customer_name, status, total_paise, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const orders = ordersRes.data || [];
  const items = itemsRes.data || [];
  const inventory = inventoryRes.data || [];
  const recentOrders = recentOrdersRes.data || [];

  const completedStatuses = ['confirmed', 'processing', 'shipped', 'delivered'];

  const totalRevenuePaise = orders
    .filter((o) => completedStatuses.includes(o.status))
    .reduce((sum, o) => sum + (o.total_paise || 0), 0);

  // Calculate BEAR vs SOW revenue based on SKU prefixes in confirmed orders
  let bearPaise = 0;
  let sowPaise = 0;
  for (const item of items) {
    if (item.orders && completedStatuses.includes(item.orders.status)) {
      const sku = (item.sku || '').toUpperCase();
      if (sku.startsWith('B-') || sku.startsWith('BEAR-')) {
        bearPaise += item.total_price_paise || 0;
      } else if (sku.startsWith('S-') || sku.startsWith('SOW-')) {
        sowPaise += item.total_price_paise || 0;
      }
    }
  }

  // Count orders by status
  const pendingWhatsApp = orders.filter((o) => o.status === 'pending_whatsapp').length;
  const confirmed = orders.filter((o) => o.status === 'confirmed').length;
  const processing = orders.filter((o) => o.status === 'processing').length;
  const shipped = orders.filter((o) => o.status === 'shipped').length;
  const delivered = orders.filter((o) => o.status === 'delivered').length;
  const cancelled = orders.filter((o) => o.status === 'cancelled').length;

  // Low stock inventory count
  const lowStockCount = inventory.filter(
    (i) => (i.quantity_available - i.quantity_reserved) <= i.low_stock_threshold
  ).length;

  const formattedRecentOrders = recentOrders.map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    customerName: o.customer_name,
    status: o.status,
    totalAmount: (o.total_paise || 0) / 100,
    createdAt: o.created_at,
  }));

  const result = {
    totalRevenue: totalRevenuePaise / 100,
    bearRevenue: bearPaise / 100,
    sowRevenue: sowPaise / 100,
    totalOrders: orders.length,
    pendingWhatsApp,
    confirmed,
    processing,
    shipped,
    delivered,
    cancelled,
    lowStockCount,
    recentOrders: formattedRecentOrders,
  };

  cachedStats = result;
  cachedStatsTime = Date.now();
  return result;
}

export async function logAdminAction({ adminId, action, targetEntity, targetId, changes, ipAddress }) {
  try {
    if (!adminId || adminId === '00000000-0000-0000-0000-000000000000') return;
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_id: adminId,
      action,
      target_entity: targetEntity,
      target_id: targetId,
      changes,
      ip_address: ipAddress || null,
    });
  } catch (e) {
    console.warn('[Admin Audit Log] Skipped recording audit log:', e.message);
  }
}

