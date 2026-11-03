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

export async function submitOrder(bagData, detailsData) {
  if (orderInProgress) return null;
  orderInProgress = true;

  try {
    await mockDelay(400, 800);
    const orderNumber = `BEAR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900000) + 100000).slice(0, 6)}`;
    const newOrder = {
      success: true,
      orderNumber,
      id: orderNumber,
      estimatedDelivery: '3–5 business days',
      items: bagData || getCart(),
      total: getCartTotal(),
      details: detailsData,
    };

    // Persist to user orders CRUD list
    addOrder(newOrder);

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
    `Total: ₹${(order.total || 0).toLocaleString('en-IN')}`,
    ``,
    `Delivery to: ${order.details?.address || ''}, ${order.details?.city || ''} — ${order.details?.pincode || ''}`,
    `Name: ${order.details?.fullName || ''}`,
    `Mobile: ${order.details?.mobile || ''}`,
  ];
  return lines.join('\n');
}

export default { validateBag, validateDetails, submitOrder, generateWhatsAppMessage };
