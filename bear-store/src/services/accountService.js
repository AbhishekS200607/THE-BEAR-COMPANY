import { get, set, TTL } from '../utils/storage.js';
import { API_V1 } from '../config/api.js';

const API_BASE = API_V1;

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://flxccuowqflxtwtynvml.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_a97yBCvUiIhQOGxpnXG2MA_Z9OVx83s';

const STORAGE_KEYS = {
  addresses: 'bear_addresses',
  orders: 'bear_orders',
  user: 'bear_user',
};

// Wipe old hardcoded demo data from previous builds
(function purgeLegacyDemoData() {
  const user = get(STORAGE_KEYS.user);
  if (user?.email === 'arjun@example.com') {
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.orders);
    localStorage.removeItem(STORAGE_KEYS.addresses);
    localStorage.removeItem('bear_auth_mode');
    localStorage.removeItem('bear_auth_session');
  }
})();

const defaultUser = {
  name: 'Guest',
  email: '',
  phone: '',
  avatar: null,
  memberSince: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
  bearPoints: 0,
};

let refreshPromise = null;

/**
 * Proactively refreshes the Supabase access_token using the stored refresh_token.
 * Safely clears stale sessions if the refresh token is expired or revoked.
 */
export async function refreshSession() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const session = get('bear_auth_session');
    if (!session?.refresh_token) {
      clearInvalidSession();
      return null;
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });

      if (!res.ok) {
        clearInvalidSession();
        return null;
      }

      const newSession = await res.json();
      if (!newSession?.access_token) {
        clearInvalidSession();
        return null;
      }

      set('bear_auth_session', newSession, TTL.SESSION);
      return newSession;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Safely removes invalid or expired auth session data from storage & cookie.
 */
export function clearInvalidSession() {
  try {
    localStorage.removeItem('bear_auth_session');
    localStorage.removeItem('bear_auth_mode');
    document.cookie = 'bear_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  } catch {}
}

/**
 * Returns a valid access_token, refreshing automatically if expired or expiring within 60 seconds.
 */
export async function getValidToken() {
  const session = get('bear_auth_session');
  if (!session?.access_token) return null;

  const expiresAt = session.expires_at;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const isExpiring = expiresAt && (expiresAt - nowSeconds) < 60;

  if (isExpiring) {
    const refreshed = await refreshSession();
    return refreshed?.access_token || null;
  }

  return session.access_token;
}

export function hasAuth() {
  const session = get('bear_auth_session');
  return !!session?.access_token;
}

/**
 * Authenticated fetch helper:
 * 1. Attaches fresh bearer token
 * 2. On 401, attempts token refresh and single retry
 * 3. Gracefully clears invalid sessions without unhandled errors
 */
export async function authFetch(url, options = {}) {
  let token = await getValidToken();
  if (!token) return null;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  try {
    let res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      const refreshed = await refreshSession();
      if (refreshed?.access_token) {
        headers.Authorization = `Bearer ${refreshed.access_token}`;
        res = await fetch(url, { ...options, headers });
      } else {
        clearInvalidSession();
        return null;
      }
    }

    return res;
  } catch (err) {
    console.warn('[BEAR Account] Request error:', err.message);
    return null;
  }
}

export async function getDemoUser() {
  const stored = get(STORAGE_KEYS.user);
  const session = get('bear_auth_session');

  if (hasAuth()) {
    try {
      const res = await authFetch(`${API_BASE}/customer/profile`);
      if (res && res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const profile = json.data;
          const merged = {
            name: profile.full_name || stored?.name || session?.user?.user_metadata?.full_name || 'Customer',
            email: session?.user?.email || stored?.email || '',
            phone: profile.phone_number || stored?.phone || '',
            avatar: null,
            role: profile.role || 'customer',
            memberSince: new Date(profile.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
            bearPoints: stored?.bearPoints || 0,
          };
          set(STORAGE_KEYS.user, merged);
          return merged;
        }
      }
    } catch (err) {
      console.warn('[BEAR Account] Could not sync remote profile, using cached user:', err.message);
    }
  }

  if (stored) return stored;
  const pending = get('bear_pending_user');
  if (pending) return { ...defaultUser, ...pending };
  return defaultUser;
}

// ── ADDRESS CRUD ─────────────────────────────────────────────
export async function getDemoAddresses() {
  if (hasAuth()) {
    try {
      const res = await authFetch(`${API_BASE}/customer/addresses`);
      if (res && res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const mapped = json.data.map((a) => ({
            id: a.id,
            fullName: a.full_name,
            phone: a.phone_number,
            line1: a.line1,
            line2: a.line2 || '',
            city: a.city,
            state: a.state,
            pincode: a.pincode,
            label: a.label || 'Home',
            default: !!a.is_default,
          }));

          if (mapped.length > 0) {
            set(STORAGE_KEYS.addresses, mapped);
            return mapped;
          }

          // If user has 0 database addresses, check if local storage has a guest address
          // that matches this customer (by name or phone) to migrate it
          const localAddrs = get(STORAGE_KEYS.addresses) || [];
          const currentUser = get(STORAGE_KEYS.user);
          const userPhone = (currentUser?.phone || '').replace(/[^0-9]/g, '').slice(-10);

          const matchingGuestAddr = localAddrs.find((a) => {
            const aPhone = (a.phone || '').replace(/[^0-9]/g, '').slice(-10);
            return (userPhone && aPhone === userPhone) ||
                   (a.fullName && currentUser?.name && a.fullName.toLowerCase() === currentUser.name.toLowerCase());
          });

          if (matchingGuestAddr) {
            try {
              const saveRes = await authFetch(`${API_BASE}/customer/addresses`, {
                method: 'POST',
                body: JSON.stringify({
                  label: matchingGuestAddr.label || 'Home',
                  fullName: matchingGuestAddr.fullName,
                  phoneNumber: matchingGuestAddr.phone,
                  line1: matchingGuestAddr.line1,
                  line2: matchingGuestAddr.line2 || null,
                  city: matchingGuestAddr.city,
                  state: matchingGuestAddr.state,
                  pincode: matchingGuestAddr.pincode,
                  isDefault: true,
                }),
              });
              if (saveRes && saveRes.ok) {
                const saveJson = await saveRes.json();
                if (saveJson.success && saveJson.data) {
                  const migrated = [{
                    id: saveJson.data.id,
                    fullName: saveJson.data.full_name,
                    phone: saveJson.data.phone_number,
                    line1: saveJson.data.line1,
                    line2: saveJson.data.line2 || '',
                    city: saveJson.data.city,
                    state: saveJson.data.state,
                    pincode: saveJson.data.pincode,
                    label: saveJson.data.label || 'Home',
                    default: true,
                  }];
                  set(STORAGE_KEYS.addresses, migrated);
                  return migrated;
                }
              }
            } catch (migrateErr) {
              console.warn('[BEAR Account] Could not auto-migrate guest address:', migrateErr.message);
            }
          }

          // If no matching address exists, start with clean empty list
          set(STORAGE_KEYS.addresses, []);
          return [];
        }
      }
    } catch (err) {
      console.warn('[BEAR Account] Could not sync addresses with API:', err.message);
    }
  }
  return get(STORAGE_KEYS.addresses) || [];
}

export function addAddress(address) {
  const addresses = get(STORAGE_KEYS.addresses) || [];
  const tempId = `addr-${Date.now()}`;
  const newAddr = {
    ...address,
    id: tempId,
    default: address.default || addresses.length === 0,
  };
  if (newAddr.default) {
    addresses.forEach((a) => (a.default = false));
  }
  const updated = [newAddr, ...addresses];
  set(STORAGE_KEYS.addresses, updated);

  if (hasAuth()) {
    authFetch(`${API_BASE}/customer/addresses`, {
      method: 'POST',
      body: JSON.stringify({
        label: address.label || 'Home',
        fullName: address.fullName,
        phoneNumber: address.phone,
        line1: address.line1,
        line2: address.line2 || null,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        isDefault: !!address.default,
      }),
    })
      .then((r) => r?.json())
      .then((json) => {
        if (json?.success && json.data) {
          const current = get(STORAGE_KEYS.addresses) || [];
          const idx = current.findIndex((a) => a.id === tempId);
          if (idx >= 0) {
            current[idx].id = json.data.id;
            set(STORAGE_KEYS.addresses, current);
          }
        }
      })
      .catch((e) => console.warn('[BEAR Account] Error saving address to backend:', e.message));
  }

  return updated;
}

export function updateAddress(id, patch) {
  let addresses = get(STORAGE_KEYS.addresses) || [];
  if (patch.default) {
    addresses.forEach((a) => (a.default = false));
  }
  addresses = addresses.map((a) => (a.id === id ? { ...a, ...patch } : a));
  set(STORAGE_KEYS.addresses, addresses);

  if (hasAuth() && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    const payload = {};
    if (patch.label !== undefined) payload.label = patch.label;
    if (patch.fullName !== undefined) payload.fullName = patch.fullName;
    if (patch.phone !== undefined) payload.phoneNumber = patch.phone;
    if (patch.line1 !== undefined) payload.line1 = patch.line1;
    if (patch.line2 !== undefined) payload.line2 = patch.line2;
    if (patch.city !== undefined) payload.city = patch.city;
    if (patch.state !== undefined) payload.state = patch.state;
    if (patch.pincode !== undefined) payload.pincode = patch.pincode;
    if (patch.default !== undefined) payload.isDefault = !!patch.default;

    authFetch(`${API_BASE}/customer/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).catch((e) => console.warn('[BEAR Account] Error updating address on backend:', e.message));
  }

  return addresses;
}

export function deleteAddress(id) {
  let addresses = get(STORAGE_KEYS.addresses) || [];
  addresses = addresses.filter((a) => a.id !== id);
  if (addresses.length > 0 && !addresses.some((a) => a.default)) {
    addresses[0].default = true;
  }
  set(STORAGE_KEYS.addresses, addresses);

  if (hasAuth() && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    authFetch(`${API_BASE}/customer/addresses/${id}`, {
      method: 'DELETE',
    }).catch((e) => console.warn('[BEAR Account] Error deleting address from backend:', e.message));
  }

  return addresses;
}

// ── ORDER CRUD ───────────────────────────────────────────────
export async function getDemoOrders() {
  const localOrders = get(STORAGE_KEYS.orders) || [];

  if (hasAuth()) {
    try {
      // 1. If this device has local guest orders, attempt to link/claim them on the backend
      if (localOrders.length > 0) {
        const orderNumbers = localOrders.map((o) => o.orderNumber || o.id).filter(Boolean);
        const currentUser = get(STORAGE_KEYS.user);
        const phoneNumber = currentUser?.phone || undefined;

        await authFetch(`${API_BASE}/customer/claim-orders`, {
          method: 'POST',
          body: JSON.stringify({ orderNumbers, phoneNumber }),
        });
      }

      // 2. Query all authenticated orders belonging to this customer from the database
      const res = await authFetch(`${API_BASE}/customer/orders`);
      if (res && res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const remoteOrders = json.data.map((o) => ({
            id: o.orderNumber,
            backendId: o.id,
            orderNumber: o.orderNumber,
            date: new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            items: (o.items || []).map((i) => ({
              name: i.name,
              size: i.size || 'M',
              colour: i.colour || 'Standard',
              quantity: i.quantity || 1,
              price: i.price,
            })),
            total: o.total,
            status: o.status,
            carrier: o.carrier,
            trackingNumber: o.trackingNumber,
            trackingUrl: o.trackingUrl,
          }));

          set(STORAGE_KEYS.orders, remoteOrders);
          return remoteOrders;
        }
      }
    } catch (err) {
      console.warn('[BEAR Account] Could not sync customer orders with API:', err.message);
    }
  }

  return localOrders;
}

export function addOrder(order) {
  const orders = get(STORAGE_KEYS.orders) || [];
  const newOrder = {
    id: order.id || order.orderNumber,
    orderNumber: order.orderNumber || order.id,
    backendId: order.backendId || null,
    date: order.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    items: (order.items || []).map((i) => ({
      name: i.name,
      size: i.size || 'M',
      colour: i.colour || 'Standard',
      quantity: i.quantity || 1,
      price: i.price,
    })),
    total: order.total,
    status: order.status || 'pending_whatsapp',
    details: order.details,
    trackingNumber: order.trackingNumber || null,
    carrier: order.carrier || null,
  };
  const updated = [newOrder, ...orders.filter((o) => (o.orderNumber || o.id) !== newOrder.orderNumber)];
  set(STORAGE_KEYS.orders, updated);
  return updated;
}

export async function confirmOrder(orderId) {
  let orders = get(STORAGE_KEYS.orders) || [];
  orders = orders.map((o) => (o.id === orderId || o.backendId === orderId ? { ...o, status: 'processing' } : o));
  set(STORAGE_KEYS.orders, orders);
  return orders;
}

export async function cancelOrder(orderId, reason = 'Customer cancelled') {
  let orders = get(STORAGE_KEYS.orders) || [];
  orders = orders.map((o) => (o.id === orderId || o.backendId === orderId ? { ...o, status: 'cancelled' } : o));
  set(STORAGE_KEYS.orders, orders);

  if (hasAuth() && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
    authFetch(`${API_BASE}/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }).catch((err) => console.warn('[BEAR Account] Error cancelling order on backend:', err.message));
  }

  return orders;
}

export async function requestCancellation(orderId, reason = 'Customer requested cancellation', notes = '') {
  let orders = get(STORAGE_KEYS.orders) || [];
  orders = orders.map((o) =>
    o.id === orderId || o.backendId === orderId || o.orderNumber === orderId
      ? { ...o, cancellationRequested: true, cancellationReason: reason, cancellationNotes: notes }
      : o
  );
  set(STORAGE_KEYS.orders, orders);

  authFetch(`${API_BASE}/orders/${orderId}/request-cancellation`, {
    method: 'POST',
    body: JSON.stringify({ reason, notes }),
  }).catch((err) => console.warn('[BEAR Account] Error recording cancellation request on backend:', err.message));

  return orders;
}

export function generateWhatsAppCancellationMessage(order, reason, notes) {
  const orderRef = order.orderNumber || order.id;
  const itemsText = (order.items || [])
    .map((i) => `• ${i.name} (${i.size || 'M'}) × ${i.quantity || 1}`)
    .join('\n');

  const lines = [
    `*ORDER CANCELLATION REQUEST — BEAR.*`,
    `Order Reference: ${orderRef}`,
    ``,
    `*Customer Details:*`,
    `• Name: ${order.details?.fullName || 'Customer'}`,
    `• Phone: ${order.details?.mobile || ''}`,
    ``,
    `*Cancellation Reason:*`,
    `• Reason: ${reason || 'Customer requested cancellation'}`,
    ...(notes ? [`• Additional Notes: ${notes}`] : []),
    ``,
    `*Order Items:*`,
    `• Order items on record`,
    ``,
    `*Total Due / Paid:*`,
    `₹${(order.total || 0).toLocaleString('en-IN')}`,
    ``,
    `Please process this cancellation and confirm once updated.`,
  ];

  return lines.join('\n');
}

export default {
  getDemoUser,
  getDemoOrders,
  getDemoAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  addOrder,
  confirmOrder,
  cancelOrder,
  requestCancellation,
  generateWhatsAppCancellationMessage,
  refreshSession,
  getValidToken,
  clearInvalidSession,
  hasAuth,
  authFetch,
};
