import { supabaseAdmin } from '../config/supabase.js';

export async function getDashboardStats() {
  const [ordersRes, productsRes] = await Promise.all([
    supabaseAdmin.from('orders').select('status, total_paise, created_at'),
    supabaseAdmin.from('products').select('id, is_active'),
  ]);

  const orders = ordersRes.data || [];
  const products = productsRes.data || [];

  const totalRevenuePaise = orders
    .filter((o) => ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + (o.total_paise || 0), 0);

  const pendingOrders = orders.filter((o) => o.status === 'pending_whatsapp').length;
  const activeOrders = orders.filter((o) => ['confirmed', 'processing', 'shipped'].includes(o.status)).length;

  return {
    totalRevenue: totalRevenuePaise / 100,
    totalOrders: orders.length,
    pendingWhatsAppVerification: pendingOrders,
    activeOrders,
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.is_active).length,
  };
}

export async function logAdminAction({ adminId, action, targetEntity, targetId, changes, ipAddress }) {
  await supabaseAdmin.from('admin_audit_logs').insert({
    admin_id: adminId,
    action,
    target_entity: targetEntity,
    target_id: targetId,
    changes,
    ip_address: ipAddress || null,
  });
}
