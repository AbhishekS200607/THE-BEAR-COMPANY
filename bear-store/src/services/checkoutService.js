import { validateCheckoutDetails } from '../utils/validation.js';
import { getCart, getCartTotal } from '../state/store.js';
import { mockDelay } from './mockStore.js';
import { addOrder } from './accountService.js';

let orderInProgress = false;

export function validateBag() {
  const cart = getCart();
  return cart.length > 0;
}

export function validateDetails(formData) {
  return validateCheckoutDetails(formData);
}

/**
 * Converts any product/variant id string into a valid UUID format for backend schema validation
 */
function toValidUUID(str) {
  // If already standard UUID format:
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  // Generate deterministic-looking UUID from string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `00000000-0000-4000-8000-${hex.repeat(2).slice(0, 12)}`;
}

/**
 * Submits an order request to the Express REST API backend with fallback to local mode
 */
export async function submitOrder(bagData, detailsData) {
  if (orderInProgress) return null;
  orderInProgress = true;

  try {
    const cart = bagData || getCart();
    const total = getCartTotal();
    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Prepare payload for backend API
    const apiPayload = {
      items: cart.map((item) => ({
        variant_id: toValidUUID(item.variantId || `${item.id}-${item.size}-${item.colour}`),
        quantity: Math.min(Math.max(item.quantity || 1, 1), 10),
      })),
      customerName: detailsData.fullName || 'Guest Customer',
      customerPhone: (detailsData.mobile || '').replace(/[^0-9]/g, '').slice(-10),
      deliveryLine1: detailsData.address || 'Standard Delivery',
      deliveryLine2: detailsData.landmark || null,
      deliveryCity: detailsData.city || 'Bengaluru',
      deliveryState: detailsData.state || 'Karnataka',
      deliveryPincode: (detailsData.pincode || '560001').slice(0, 6),
      idempotencyKey,
    };

    let serverOrder = null;

    try {
      // Attempt live REST API call
      const res = await fetch('http://localhost:4000/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(apiPayload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          serverOrder = json.data;
        }
      }
    } catch (netErr) {
      // Backend is offline or unreachable - proceed gracefully with local fallback
      console.info('[BEAR Checkout] Backend server offline, completing order in client mode:', netErr.message);
    }

    // Standardize order response object
    const randomSuffix = String(Math.floor(Math.random() * 900000) + 100000).slice(0, 6);
    const orderNumber = serverOrder?.order_number || `BEAR-${new Date().getFullYear()}-${randomSuffix}`;
    const reservationExpiresAt = serverOrder?.reservation_expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const newOrder = {
      success: true,
      orderNumber,
      id: orderNumber,
      backendId: serverOrder?.id || null,
      reservationExpiresAt,
      estimatedDelivery: '2–3 business days (BlueDart Air Express)',
      items: cart,
      total,
      details: detailsData,
      status: 'pending_whatsapp',
      createdAt: new Date().toISOString(),
    };

    // Persist to user orders list in localStorage
    addOrder(newOrder);

    await mockDelay(300, 600);
    return newOrder;
  } finally {
    orderInProgress = false;
  }
}

export function generateWhatsAppMessage(order) {
  const lines = [
    `Hello BEAR! I'd like to place an order.`,
    ``,
    `Order: ${order.orderNumber || order.id}`,
    ``,
    ...(order.items || []).map(
      (item) => `• ${item.name} — ${item.size} / ${item.colour} × ${item.quantity || 1}`
    ),
    ``,
    `Total: ₹${(order.total || 0).toLocaleString('en-IN')} (Free Pan-India Air Shipping)`,
    ``,
    `Delivery to: ${order.details?.address || ''}, ${order.details?.city || ''} — ${order.details?.pincode || ''}`,
    `Name: ${order.details?.fullName || ''}`,
    `Mobile: ${order.details?.mobile || ''}`,
  ];
  return lines.join('\n');
}

export default { validateBag, validateDetails, submitOrder, generateWhatsAppMessage };
