/**
 * BEAR Store — Admin Service
 * Wraps /api/v1/admin/* endpoints with mock fallback when backend is offline.
 */

import { API_V1 } from '../config/api.js';

const BASE = `${API_V1}/admin`;
const TIMEOUT_MS = 3000;

// ─── Offline Empty State Fallbacks ────────────────────────────────────────────

const EMPTY_DASHBOARD = {
  totalRevenue: 0,
  totalOrders: 0,
  pendingWhatsAppOrders: 0,
  lowStockCount: 0,
  recentOrders: [],
};

// ─── Fetch Helper ─────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    clearTimeout(timer);
    return null; // signals fallback
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getDashboard() {
  const data = await apiFetch('/dashboard');
  if (data?.success) {
    const d = data.data;
    return {
      totalRevenue: d.totalRevenue ?? 0,
      totalOrders: d.totalOrders ?? 0,
      pendingWhatsAppOrders: d.pendingWhatsApp ?? d.pendingWhatsAppOrders ?? 0,
      lowStockCount: d.lowStockCount ?? 0,
      recentOrders: (d.recentOrders || []).map(o => ({
        customer_name: o.customerName ?? o.customer_name,
        order_number: o.orderNumber ?? o.order_number,
        status: o.status,
        total_amount: o.totalAmount ?? o.total_amount,
        created_at: o.createdAt ?? o.created_at,
      })),
      _mock: false,
    };
  }
  return { ...EMPTY_DASHBOARD, _mock: false };
}

export async function getOrders(status = 'all', page = 1) {
  const data = await apiFetch(`/orders?status=${status}&page=${page}&limit=50`);
  if (data?.success) return { orders: data.data || [], _mock: false };
  return { orders: [], _mock: false };
}

export async function updateOrderStatus(orderId, payload) {
  const data = await apiFetch(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (data?.success) return { order: data.data, _mock: false };
  return { order: null, _mock: false };
}

export async function getInventory() {
  const data = await apiFetch('/inventory');
  if (data?.success) return { inventory: data.data || [], _mock: false };
  return { inventory: [], _mock: false };
}

export async function updateInventory(variantId, payload) {
  const data = await apiFetch(`/inventory/${variantId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (data?.success) return { variant: data.data, _mock: false };
  return { variant: null, _mock: false };
}

export default { getDashboard, getOrders, updateOrderStatus, getInventory, updateInventory };
