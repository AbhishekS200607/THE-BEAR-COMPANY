import { createOrder, trackOrder, confirmOrder, cancelOrder } from '../services/orderService.js';
import { successResponse } from '../utils/response.js';

export async function handleCreateOrder(req, res, next) {
  try {
    const {
      items,
      customerName,
      customerPhone,
      deliveryLine1,
      deliveryLine2,
      deliveryCity,
      deliveryState,
      deliveryPincode,
    } = req.body;

    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
    const profileId = req.user ? req.user.id : null;

    const result = await createOrder({
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
    const { reason } = req.body;
    const result = await cancelOrder(id, reason);
    return successResponse(res, result, 200, 'Order cancelled and stock released');
  } catch (err) {
    return next(err);
  }
}

