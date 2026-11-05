import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { generateOrderFingerprint } from '../utils/crypto.js';
import { generateWhatsAppHandoff } from './whatsappService.js';
import { validateCouponCode, incrementCouponUsage } from './storePersistence.js';

export async function createOrder({
  items,
  customerName,
  customerPhone,
  deliveryLine1,
  deliveryLine2,
  deliveryCity,
  deliveryState,
  deliveryPincode,
  profileId,
  idempotencyKey,
  couponCode,
}) {
  // 1. Generate unique human-readable order reference
  const randomSuffix = `${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;
  const orderNumber = `BEAR-${new Date().getFullYear()}-${randomSuffix}`;

  // 2. Compute fingerprint of payload to prevent tampering
  const fingerprint = generateOrderFingerprint(items, {
    fullName: customerName,
    mobile: customerPhone,
    line1: deliveryLine1,
    pincode: deliveryPincode,
  });

  // 3. Execute atomic PostgreSQL RPC on backend with service-role
  const resolvedIdempotencyKey = idempotencyKey || `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const { data: orderId, error } = await supabaseAdmin.rpc('create_order_with_reservation', {
    p_order_number: orderNumber,
    p_idempotency_key: resolvedIdempotencyKey,
    p_fingerprint: fingerprint,
    p_profile_id: profileId || null,
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
    p_delivery_line1: deliveryLine1,
    p_delivery_line2: deliveryLine2 || null,
    p_delivery_city: deliveryCity,
    p_delivery_state: deliveryState,
    p_delivery_pincode: deliveryPincode,
    p_items: items,
    p_expiry_minutes: env.RESERVATION_EXPIRY_MINUTES || 120,
  });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = error.message.includes('Insufficient stock') ? 409 : 400;
    err.isPublic = true;
    throw err;
  }

  // 4. Fetch the created order with line items
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      customer_name,
      customer_phone,
      delivery_line1,
      delivery_line2,
      delivery_city,
      delivery_state,
      delivery_pincode,
      subtotal_paise,
      total_paise,
      reservation_expires_at,
      order_items (
        product_name,
        colour_name,
        size,
        quantity,
        unit_price_paise,
        total_price_paise
      )
    `)
    .eq('id', orderId)
    .single();

  if (fetchErr || !order) {
    throw new Error('Failed to retrieve created order record');
  }

  // 4b. Apply validated coupon discount if provided
  let discountPaise = 0;
  if (couponCode) {
    const val = validateCouponCode(couponCode, order.subtotal_paise / 100);
    if (val.valid) {
      discountPaise = val.discountPaise;
      const totalPaise = Math.max(0, order.subtotal_paise - discountPaise);
      await supabaseAdmin
        .from('orders')
        .update({
          discount_paise: discountPaise,
          total_paise: totalPaise,
        })
        .eq('id', orderId);
      order.discount_paise = discountPaise;
      order.total_paise = totalPaise;
      incrementCouponUsage(couponCode);
    }
  }

  // 5. Generate WhatsApp Handoff details
  const whatsappHandoff = generateWhatsAppHandoff({
    ...order,
    items: order.order_items,
  });

  return {
    order: {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      deliveryAddress: {
        line1: order.delivery_line1,
        line2: order.delivery_line2,
        city: order.delivery_city,
        state: order.delivery_state,
        pincode: order.delivery_pincode,
      },
      subtotal: order.subtotal_paise / 100,
      discount: (order.discount_paise || 0) / 100,
      deliveryFee: 0,
      total: order.total_paise / 100,
      reservationExpiresAt: order.reservation_expires_at,
      items: (order.order_items || []).map((i) => ({
        productName: i.product_name,
        colour: i.colour_name,
        size: i.size,
        quantity: i.quantity,
        unitPrice: i.unit_price_paise / 100,
        totalPrice: i.total_price_paise / 100,
      })),
    },
    whatsappHandoff,
  };
}

/**
 * Protected Guest & Customer Order Status Tracking
 * Requires both order_number and matching customer_phone
 */
export async function trackOrder({ orderNumber, phone }) {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      delivery_city,
      delivery_state,
      carrier_name,
      tracking_number,
      tracking_url,
      dispatched_at,
      created_at,
      reservation_expires_at,
      order_items (
        product_name,
        size,
        colour_name,
        quantity
      )
    `)
    .eq('order_number', orderNumber.trim())
    .eq('customer_phone', phone.trim())
    .single();

  if (error || !order) {
    const err = new Error('No order found matching the provided order reference and phone number.');
    err.statusCode = 404;
    err.isPublic = true;
    throw err;
  }

  return {
    orderNumber: order.order_number,
    status: order.status,
    destination: `${order.delivery_city}, ${order.delivery_state}`,
    createdAt: order.created_at,
    dispatchedAt: order.dispatched_at,
    carrier: order.carrier_name,
    trackingNumber: order.tracking_number,
    trackingUrl: order.tracking_url,
    itemCount: (order.order_items || []).reduce((acc, i) => acc + i.quantity, 0),
    items: order.order_items,
  };
}

/**
 * Confirm order inventory upon admin WhatsApp verification
 */
export async function confirmOrder(orderId) {
  const { error } = await supabaseAdmin.rpc('confirm_order_inventory', {
    p_order_id: orderId,
  });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    err.isPublic = true;
    throw err;
  }

  return { confirmed: true, orderId };
}

/**
 * Cancel order and release reserved stock
 */
export async function cancelOrder(orderId, reason) {
  const { error } = await supabaseAdmin.rpc('cancel_pending_order', {
    p_order_id: orderId,
    p_reason: reason || 'Cancelled by user or admin',
  });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    err.isPublic = true;
    throw err;
  }

  return { cancelled: true, orderId };
}

