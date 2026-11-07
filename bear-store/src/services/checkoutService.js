import { validateCheckoutDetails } from '../utils/validation.js';
import { getCart, getCartTotal } from '../state/store.js';
import { get } from '../utils/storage.js';
import { addOrder } from './accountService.js';
import { API_V1 } from '../config/api.js';

const API_BASE = API_V1;

let orderInProgress = false;

export function validateBag() {
  const cart = getCart();
  return cart.length > 0;
}

export function validateDetails(formData) {
  return validateCheckoutDetails(formData);
}

/**
 * Resolves real Supabase variantId for an item if not yet attached
 */
async function resolveCartVariantId(item) {
  if (item.variantId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.variantId)) {
    return item.variantId;
  }
  try {
    const slugCandidates = [item.slug, item.id].filter(Boolean);
    for (const slug of slugCandidates) {
      const res = await fetch(`${API_BASE}/products/${encodeURIComponent(slug)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data.sizes)) {
          const match =
            json.data.sizes.find((s) => s.size === item.size && (!s.colour || s.colour === item.colour)) ||
            json.data.sizes.find((s) => s.size === item.size) ||
            json.data.sizes[0];
          if (match?.variantId) return match.variantId;
        }
      }
    }

    // Fallback: search catalog by name
    if (item.name) {
      const searchRes = await fetch(`${API_BASE}/products?search=${encodeURIComponent(item.name)}`);
      if (searchRes.ok) {
        const searchJson = await searchRes.json();
        const found = (searchJson.data?.products || searchJson.data || []).find(
          (p) => p.name?.toLowerCase() === item.name?.toLowerCase() || p.slug === item.slug
        );
        if (found?.slug) {
          const detailRes = await fetch(`${API_BASE}/products/${encodeURIComponent(found.slug)}`);
          if (detailRes.ok) {
            const detailJson = await detailRes.json();
            if (detailJson.data && Array.isArray(detailJson.data.sizes)) {
              const match =
                detailJson.data.sizes.find((s) => s.size === item.size && (!s.colour || s.colour === item.colour)) ||
                detailJson.data.sizes.find((s) => s.size === item.size) ||
                detailJson.data.sizes[0];
              if (match?.variantId) return match.variantId;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[BEAR Checkout] Error resolving variant ID from API:', err.message);
  }
  return null;
}

/**
 * Submits an order request to the Express REST API backend with real database persistence
 */
export async function submitOrder(bagData, detailsData, couponCode = null) {
  if (orderInProgress) return null;
  orderInProgress = true;

  try {
    const cart = bagData || getCart();
    const total = getCartTotal();
    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Ensure all items carry real UUIDs from Supabase
    for (const item of cart) {
      if (!item.variantId) {
        item.variantId = await resolveCartVariantId(item);
      }
      if (!item.variantId) {
        throw new Error(`Variant ID missing for "${item.name}" (${item.size || 'M'}). Please re-select size from product page.`);
      }
    }

    const appliedCoupon = detailsData?.coupon || couponCode || null;

    // Prepare payload for backend API
    const apiPayload = {
      items: cart.map((item) => ({
        variant_id: item.variantId,
        quantity: Math.min(Math.max(item.quantity || 1, 1), 10),
      })),
      customerName: detailsData.fullName || 'Guest Customer',
      customerEmail: detailsData.email || detailsData.customerEmail || null,
      customerPhone: (detailsData.mobile || '').replace(/[^0-9]/g, '').slice(-10),
      deliveryLine1: detailsData.address || 'Standard Delivery',
      deliveryLine2: detailsData.landmark || null,
      deliveryCity: detailsData.city || 'Bengaluru',
      deliveryState: detailsData.state || 'Karnataka',
      deliveryPincode: (detailsData.pincode || '560001').slice(0, 6),
      idempotencyKey,
      couponCode: appliedCoupon,
    };

    const session = get('bear_auth_session');
    const headers = {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(apiPayload),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success || !json.data) {
      const errMsg = json.error?.message || json.message || `Order placement failed (HTTP ${res.status})`;
      throw new Error(errMsg);
    }

    const serverOrder = json.data?.order || json.data;
    const orderNumber = serverOrder.orderNumber || serverOrder.order_number || `BEAR-${Date.now().toString().slice(-8)}`;
    const reservationExpiresAt = serverOrder.reservationExpiresAt || serverOrder.reservation_expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const newOrder = {
      success: true,
      orderNumber,
      id: orderNumber,
      backendId: serverOrder.id,
      reservationExpiresAt,
      estimatedDelivery: '2–4 business days (Pan-India Express Air)',
      items: cart,
      total: typeof serverOrder.total === 'number'
        ? serverOrder.total
        : (serverOrder.total_paise ? serverOrder.total_paise / 100 : total),
      details: detailsData,
      status: serverOrder.status || 'pending_whatsapp',
      createdAt: serverOrder.createdAt || serverOrder.created_at || new Date().toISOString(),
    };

    // Persist to user orders list in localStorage & customer account
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
    `Total: ₹${(order.total || 0).toLocaleString('en-IN')} (Free Pan-India Air Shipping)`,
    ``,
    `Delivery to: ${order.details?.address || ''}, ${order.details?.city || ''} — ${order.details?.pincode || ''}`,
    `Name: ${order.details?.fullName || ''}`,
    `Mobile: ${order.details?.mobile || ''}`,
  ];
  return lines.join('\n');
}

export default { validateBag, validateDetails, submitOrder, generateWhatsAppMessage };
