import { supabaseAdmin } from '../config/supabase.js';
import { getDashboardStats, logAdminAction } from '../services/adminService.js';
import { successResponse } from '../utils/response.js';

export async function handleGetDashboard(req, res, next) {
  try {
    const stats = await getDashboardStats();
    return successResponse(res, stats);
  } catch (err) {
    return next(err);
  }
}

export async function handleGetOrders(req, res, next) {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        customer_name,
        customer_phone,
        delivery_city,
        delivery_state,
        total_paise,
        created_at,
        reservation_expires_at,
        order_items (
          product_name,
          size,
          colour_name,
          quantity
        )
      `)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formatted = (data || []).map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      location: `${o.delivery_city}, ${o.delivery_state}`,
      total: o.total_paise / 100,
      createdAt: o.created_at,
      reservationExpiresAt: o.reservation_expires_at,
      items: o.order_items,
    }));

    return successResponse(res, formatted);
  } catch (err) {
    return next(err);
  }
}

export async function handleUpdateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, carrierName, trackingNumber, trackingUrl, adminNotes } = req.body;

    const updates = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (carrierName) updates.carrier_name = carrierName;
    if (trackingNumber) updates.tracking_number = trackingNumber;
    if (trackingUrl) updates.tracking_url = trackingUrl;
    if (status === 'shipped') updates.dispatched_at = new Date().toISOString();
    if (adminNotes) updates.admin_notes = adminNotes;

    const { data: updatedOrder, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId: req.user.id,
      action: 'UPDATE_ORDER_STATUS',
      targetEntity: 'orders',
      targetId: id,
      changes: updates,
      ipAddress: req.ip,
    });

    return successResponse(res, updatedOrder, 200, 'Order status updated');
  } catch (err) {
    return next(err);
  }
}

export async function handleGetInventory(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('inventory')
      .select(`
        variant_id,
        quantity_available,
        quantity_reserved,
        low_stock_threshold,
        updated_at,
        product_variants (
          sku,
          size,
          colour_name,
          products (
            name,
            mode
          )
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map((i) => ({
      variantId: i.variant_id,
      productName: i.product_variants?.products?.name,
      mode: i.product_variants?.products?.mode,
      sku: i.product_variants?.sku,
      size: i.product_variants?.size,
      colour: i.product_variants?.colour_name,
      available: i.quantity_available,
      reserved: i.quantity_reserved,
      unreservedStock: i.quantity_available - i.quantity_reserved,
      lowStock: i.quantity_available - i.quantity_reserved <= i.low_stock_threshold,
      updatedAt: i.updated_at,
    }));

    return successResponse(res, formatted);
  } catch (err) {
    return next(err);
  }
}

export async function handleUpdateInventory(req, res, next) {
  try {
    const { variantId } = req.params;
    const { quantityAvailable, lowStockThreshold } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (typeof quantityAvailable === 'number') updates.quantity_available = quantityAvailable;
    if (typeof lowStockThreshold === 'number') updates.low_stock_threshold = lowStockThreshold;

    const { data, error } = await supabaseAdmin
      .from('inventory')
      .update(updates)
      .eq('variant_id', variantId)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId: req.user.id,
      action: 'UPDATE_INVENTORY',
      targetEntity: 'inventory',
      targetId: variantId,
      changes: updates,
      ipAddress: req.ip,
    });

    return successResponse(res, data, 200, 'Stock updated');
  } catch (err) {
    return next(err);
  }
}

