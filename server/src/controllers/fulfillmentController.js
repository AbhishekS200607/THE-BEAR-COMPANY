import {
  getFulfillmentData,
  assignStaffToOrders,
  updateOrdersStatus,
  updateItemPackingChecklist,
  toggleOrderUrgent,
  getOrderTimelineEvents,
  renderBatchPackingSlipsHtml,
} from '../services/fulfillmentService.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function handleGetFulfillment(req, res, next) {
  try {
    const { tab, staffId, courier, search, limit = 50, offset = 0 } = req.query;
    const data = await getFulfillmentData({
      tab: tab || 'all',
      staffId: staffId || undefined,
      courier: courier || undefined,
      search: search || undefined,
      limit: Number(limit) || 50,
      offset: Number(offset) || 0,
    });
    return successResponse(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function handleAssignStaff(req, res, next) {
  try {
    const { orderIds, staffId } = req.body;
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return errorResponse(res, 'orderIds must be a non-empty array of UUIDs', 400);
    }
    const actor = {
      id: req.adminProfile?.id || req.user?.id,
      fullName: req.adminProfile?.full_name || 'Warehouse Lead',
    };
    const result = await assignStaffToOrders(orderIds, staffId || null, actor);
    return successResponse(res, result, 200, `Successfully assigned ${result.count} order(s)`);
  } catch (err) {
    return next(err);
  }
}

export async function handleBulkUpdateStatus(req, res, next) {
  try {
    const { orderIds, status, carrierName, trackingNumber, trackingUrl } = req.body;
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return errorResponse(res, 'orderIds must be a non-empty array of UUIDs', 400);
    }
    if (!status) {
      return errorResponse(res, 'status is required', 400);
    }
    const actor = {
      id: req.adminProfile?.id || req.user?.id,
      fullName: req.adminProfile?.full_name || 'Fulfillment Specialist',
    };
    const result = await updateOrdersStatus(
      orderIds,
      status,
      { carrierName, trackingNumber, trackingUrl },
      actor
    );
    return successResponse(res, result, 200, `Successfully updated ${result.count} order(s) to ${status}`);
  } catch (err) {
    return next(err);
  }
}

export async function handleUpdateItemPacking(req, res, next) {
  try {
    const { id } = req.params;
    const { itemIndex, isPacked } = req.body;
    if (itemIndex === undefined || itemIndex === null) {
      return errorResponse(res, 'itemIndex is required', 400);
    }
    const actor = {
      id: req.adminProfile?.id || req.user?.id,
      fullName: req.adminProfile?.full_name || 'Warehouse Specialist',
    };
    const result = await updateItemPackingChecklist(id, Number(itemIndex), Boolean(isPacked), actor);
    return successResponse(res, result, 200, 'Checklist updated');
  } catch (err) {
    return next(err);
  }
}

export async function handleToggleUrgent(req, res, next) {
  try {
    const { id } = req.params;
    const { isUrgent } = req.body;
    const actor = {
      id: req.adminProfile?.id || req.user?.id,
      fullName: req.adminProfile?.full_name || 'Operations Lead',
    };
    const result = await toggleOrderUrgent(id, Boolean(isUrgent), actor);
    return successResponse(res, result, 200, isUrgent ? 'Order marked urgent' : 'Urgent flag removed');
  } catch (err) {
    return next(err);
  }
}

export async function handleGetOrderTimeline(req, res, next) {
  try {
    const { id } = req.params;
    const timeline = await getOrderTimelineEvents(id);
    return successResponse(res, timeline);
  } catch (err) {
    return next(err);
  }
}

export async function handlePrintBatchPackingSlips(req, res, next) {
  try {
    let orderIds = [];
    if (req.method === 'POST') {
      orderIds = req.body.orderIds || [];
    } else if (req.query.ids) {
      orderIds = String(req.query.ids).split(',').map((s) => s.trim()).filter(Boolean);
    }
    const html = await renderBatchPackingSlipsHtml(orderIds);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (err) {
    return next(err);
  }
}

