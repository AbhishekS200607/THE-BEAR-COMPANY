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

export async function handleCreateProduct(req, res, next) {
  try {
    const { name, mode, categoryName, price, compareAtPrice, description, isFeatured, isBestseller, isNew } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        slug,
        mode,
        category_name: categoryName,
        price_paise: Math.round(price * 100),
        compare_at_price_paise: compareAtPrice ? Math.round(compareAtPrice * 100) : null,
        description,
        is_featured: !!isFeatured,
        is_bestseller: !!isBestseller,
        is_new: isNew ?? true,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId: req.user.id,
      action: 'CREATE_PRODUCT',
      targetEntity: 'products',
      targetId: data.id,
      changes: data,
      ipAddress: req.ip,
    });

    return successResponse(res, data, 201, 'Product created successfully');
  } catch (err) {
    return next(err);
  }
}

export async function handleUpdateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { name, categoryName, price, compareAtPrice, description, isFeatured, isBestseller, isNew, isActive } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (name) updates.name = name;
    if (categoryName) updates.category_name = categoryName;
    if (typeof price === 'number') updates.price_paise = Math.round(price * 100);
    if (typeof compareAtPrice === 'number') updates.compare_at_price_paise = Math.round(compareAtPrice * 100);
    if (description) updates.description = description;
    if (typeof isFeatured === 'boolean') updates.is_featured = isFeatured;
    if (typeof isBestseller === 'boolean') updates.is_bestseller = isBestseller;
    if (typeof isNew === 'boolean') updates.is_new = isNew;
    if (typeof isActive === 'boolean') updates.is_active = isActive;

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId: req.user.id,
      action: 'UPDATE_PRODUCT',
      targetEntity: 'products',
      targetId: id,
      changes: updates,
      ipAddress: req.ip,
    });

    return successResponse(res, data, 200, 'Product updated successfully');
  } catch (err) {
    return next(err);
  }
}

export async function handleGetCustomers(req, res, next) {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone_number, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (profiles || []).map((p) => ({
      id: p.id,
      name: p.full_name,
      phone: p.phone_number,
      joinedAt: p.created_at,
    }));

    return successResponse(res, formatted);
  } catch (err) {
    return next(err);
  }
}

export async function handleGetDiscounts(req, res, next) {
  try {
    // Standard system active discount coupons
    const discounts = [
      { id: 'disc-1', code: 'BEAR10', type: 'percentage', value: 10, minCartValue: 999, active: true },
      { id: 'disc-2', code: 'WELCOME500', type: 'fixed', value: 500, minCartValue: 2499, active: true },
      { id: 'disc-3', code: 'DROP20', type: 'percentage', value: 20, minCartValue: 3999, active: true },
    ];
    return successResponse(res, discounts);
  } catch (err) {
    return next(err);
  }
}
