import { createOrder, trackOrder, confirmOrder, cancelOrder } from '../services/orderService.js';
import { validateCouponCode } from '../services/storePersistence.js';
import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function handleValidateCoupon(req, res, next) {
  try {
    const { code, cartTotal } = req.body;
    const result = validateCouponCode(code, cartTotal);
    if (!result.valid) {
      return res.status(200).json({
        success: true,
        data: {
          valid: false,
          message: result.message,
        },
      });
    }
    return successResponse(res, result, 200, 'Coupon validated successfully');
  } catch (err) {
    return next(err);
  }
}

export async function handleCreateOrder(req, res, next) {
  try {
    const {
      items,
      customerName,
      customerEmail,
      customerPhone,
      deliveryLine1,
      deliveryLine2,
      deliveryCity,
      deliveryState,
      deliveryPincode,
      couponCode,
    } = req.body;

    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
    const profileId = req.user ? req.user.id : null;
    const resolvedEmail = customerEmail || req.user?.email || null;

    const result = await createOrder({
      items,
      customerName,
      customerEmail: resolvedEmail,
      customerPhone,
      deliveryLine1,
      deliveryLine2,
      deliveryCity,
      deliveryState,
      deliveryPincode,
      profileId,
      idempotencyKey,
      couponCode,
    });

    return successResponse(res, result, 201, 'Order reservation created');
  } catch (err) {
    return next(err);
  }
}

export async function handleTrackOrder(req, res, next) {
  try {
    const { orderNumber, phone } = req.query;
    const result = await trackOrder({ orderNumber, phone });
    return successResponse(res, result, 200, 'Tracking information retrieved');
  } catch (err) {
    return next(err);
  }
}

export async function handleConfirmOrder(req, res, next) {
  try {
    const { id } = req.params;
    const result = await confirmOrder(id);
    return successResponse(res, result, 200, 'Order verified and confirmed');
  } catch (err) {
    return next(err);
  }
}

export async function handleCancelOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const user = req.user;

    // Check if user has administrative privileges
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role);

    if (!isAdmin) {
      // Must be the owner of the order
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('profile_id, customer_phone')
        .eq('id', id)
        .single();

      if (!order || (order.profile_id !== user.id && order.customer_phone !== user.phone)) {
        return errorResponse(res, 'Forbidden: You do not have permission to cancel this order', 403);
      }
    }

    const result = await cancelOrder(id, reason);
    return successResponse(res, result, 200, 'Order cancelled and stock released');
  } catch (err) {
    return next(err);
  }
}

export async function handleRequestCancellation(req, res, next) {
  try {
    const { id } = req.params;
    const { reason = 'Customer requested cancellation', notes = '' } = req.body;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = supabaseAdmin.from('orders').select('*');
    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.eq('order_number', id.trim());
    }

    const { data: order, error } = await query.single();
    if (error || !order) {
      return errorResponse(res, 'Order not found', 404);
    }

    if (order.status === 'cancelled') {
      return errorResponse(res, 'Order is already cancelled', 400);
    }

    const cancellationNote = `[CANCELLATION REQUESTED]: ${reason}${notes ? ` - ${notes}` : ''} (Requested on ${new Date().toLocaleString('en-IN')})`;
    const updatedNotes = order.admin_notes
      ? `${cancellationNote}\n${order.admin_notes}`
      : cancellationNote;

    await supabaseAdmin
      .from('orders')
      .update({ admin_notes: updatedNotes, updated_at: new Date().toISOString() })
      .eq('id', order.id);

    return successResponse(res, {
      orderNumber: order.order_number,
      cancellationRequested: true,
      reason,
      notes,
    }, 200, 'Cancellation request recorded');
  } catch (err) {
    return next(err);
  }
}
