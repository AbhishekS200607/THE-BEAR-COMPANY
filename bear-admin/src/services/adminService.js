import { getAccessToken } from '../auth.js';
import { API_ADMIN } from '../config/api.js';

/**
 * BEAR Admin — Unified Service Layer
 * Directly interfaces with Express REST API.
 * Eliminates production mock-data fallbacks.
 */

const BASE = API_ADMIN;
const TIMEOUT = 25000; // 25s timeout to comfortably absorb Vercel cold starts and Supabase pooling

async function apiFetch(path, opts = {}, retries = 1) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const token = await getAccessToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    };

    const res = await fetch(`${BASE}${path}`, {
      ...opts,
      signal: ctrl.signal,
      headers,
    });
    clearTimeout(t);
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = json?.error?.message || `HTTP ${res.status}`;
      return { success: false, error: { message: msg } };
    }
    return json;
  } catch (err) {
    clearTimeout(t);
    if (retries > 0) {
      // Small pause before retry to let cold start complete
      await new Promise((r) => setTimeout(r, 600));
      return apiFetch(path, opts, retries - 1);
    }
    return { success: false, error: { message: err.name === 'AbortError' ? 'Request timed out' : 'Failed to connect to backend' } };
  }
}

// ── 0. Current Admin Profile ───────────────────────────────────────────────

export async function getAdminMe() {
  const d = await apiFetch('/me');
  if (d?.success) return d.data;
  return null;
}

// ── 1. Dashboard ─────────────────────────────────────────────────────────────

export async function getDashboard() {
  const d = await apiFetch('/dashboard');
  if (d?.success) return { ...d.data, _error: null };
  return { _error: d?.error?.message || 'Failed to load dashboard' };
}

// ── 2. Orders & Fulfillment ──────────────────────────────────────────────────

export async function getOrders(status = 'all') {
  const query = status && status !== 'all' ? `?status=${status}&limit=100` : '?limit=100';
  const d = await apiFetch(`/orders${query}`);
  if (d?.success) return { orders: d.data, _error: null };
  return { orders: [], _error: d?.error?.message || 'Failed to load orders' };
}

export async function updateOrderStatus(id, payload) {
  const d = await apiFetch(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (d?.success) return { success: true };
  throw new Error(d?.error?.message || 'Failed to update order status');
}

export async function bulkUpdateOrderStatus(orderIds, status, notes = '') {
  const d = await apiFetch('/fulfillment/bulk-status', {
    method: 'PATCH',
    body: JSON.stringify({ orderIds, status, notes }),
  });
  if (d?.success) return d.data;
  const results = await Promise.allSettled(orderIds.map(id => updateOrderStatus(id, { status, adminNotes: notes })));
  return { success: true, count: results.filter(r => r.status === 'fulfilled').length };
}

// ── 3. Inventory Matrix ───────────────────────────────────────────────────────

export async function getInventory() {
  const d = await apiFetch('/inventory');
  if (d?.success) return { inventory: d.data, _error: null };
  return { inventory: [], _error: d?.error?.message || 'Failed to load inventory' };
}

export async function updateInventory(variantId, payload) {
  const d = await apiFetch(`/inventory/${variantId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (d?.success) return { success: true };
  throw new Error(d?.error?.message || 'Failed to adjust inventory');
}

export async function bulkImportInventory(items) {
  const d = await apiFetch('/inventory/import', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
  if (d?.success) return d.data;
  throw new Error(d?.error?.message || 'Failed to import inventory');
}

// ── 4. Products Catalog & Categories ──────────────────────────────────────────

export async function getCategories() {
  const d = await apiFetch('/categories');
  if (d?.success) return { categories: d.data, _error: null };
  return { categories: [], _error: d?.error?.message || 'Failed to load categories' };
}

export async function createCategory(payload) {
  const d = await apiFetch('/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (d?.success) return { category: d.data, _error: null };
  throw new Error(d?.error?.message || 'Failed to create category');
}

export async function updateCategory(id, payload) {
  const d = await apiFetch(`/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (d?.success) return { category: d.data, _error: null };
  throw new Error(d?.error?.message || 'Failed to update category');
}

export async function deleteCategory(id) {
  const d = await apiFetch(`/categories/${id}`, {
    method: 'DELETE',
  });
  if (d?.success) return { success: true };
  throw new Error(d?.error?.message || 'Failed to delete category');
}

export async function getProducts() {
  const d = await apiFetch('/products');
  if (d?.success) return { products: d.data, _error: null };
  return { products: [], _error: d?.error?.message || 'Failed to load products' };
}

export async function createProduct(payload) {
  const d = await apiFetch('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (d?.success) return { product: d.data, _error: null };
  throw new Error(d?.error?.message || 'Failed to create product');
}

export async function updateProduct(id, payload) {
  const d = await apiFetch(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (d?.success) return { product: d.data, _error: null };
  throw new Error(d?.error?.message || 'Failed to update product');
}

export async function archiveProduct(id, isArchived = true) {
  const d = await apiFetch(`/products/${id}/archive`, {
    method: 'POST',
    body: JSON.stringify({ isArchived }),
  });
  if (d?.success) return { success: true, product: d.data };
  throw new Error(d?.error?.message || 'Failed to update product archive status');
}

export async function deleteProduct(id) {
  const d = await apiFetch(`/products/${id}`, {
    method: 'DELETE',
  });
  if (d?.success) return { success: true, data: d.data };
  throw new Error(d?.error?.message || 'Failed to delete product');
}

export async function bulkDeleteProducts(ids) {
  const results = await Promise.allSettled(ids.map(id => deleteProduct(id)));
  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0 && failed.length === ids.length) {
    throw new Error('Failed to delete selected products');
  }
  return { success: true, count: ids.length - failed.length };
}

export async function bulkUpdateProducts(ids, updates) {
  const results = await Promise.allSettled(ids.map(id => updateProduct(id, updates)));
  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0 && failed.length === ids.length) {
    throw new Error('Failed to update selected products');
  }
  return { success: true, count: ids.length - failed.length };
}

export async function bulkArchiveProducts(ids, isArchived = true) {
  const results = await Promise.allSettled(ids.map(id => archiveProduct(id, isArchived)));
  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0 && failed.length === ids.length) {
    throw new Error('Failed to update archive status for selected products');
  }
  return { success: true, count: ids.length - failed.length };
}

export async function uploadProductImage(base64Data, filename) {
  const d = await apiFetch('/upload-image', {
    method: 'POST',
    body: JSON.stringify({ base64Data, filename }),
  });
  if (d?.success) return d.data;
  throw new Error(d?.error?.message || 'Failed to upload image');
}

// ── 5. Customers CRM ──────────────────────────────────────────────────────────

export async function getCustomers() {
  const d = await apiFetch('/customers');
  if (d?.success) return { customers: d.data, _error: null };
  return { customers: [], _error: d?.error?.message || 'Failed to load customers' };
}

export async function updateCustomerNotes(id, notes) {
  const d = await apiFetch(`/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ notes }),
  });
  if (d?.success) return { success: true };
  throw new Error(d?.error?.message || 'Failed to update customer notes');
}

// ── 6. Discounts & Promotions ─────────────────────────────────────────────────

export async function getCoupons() {
  const d = await apiFetch('/discounts');
  if (d?.success) return { coupons: d.data, _error: null };
  return { coupons: [], _error: d?.error?.message || 'Failed to load coupons' };
}

export async function saveCoupon(payload) {
  const d = await apiFetch('/discounts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (d?.success) return { coupon: d.data, success: true };
  throw new Error(d?.error?.message || 'Failed to save coupon');
}

export async function toggleCoupon(id, isActive) {
  const d = await apiFetch(`/discounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  if (d?.success) return { success: true };
  throw new Error(d?.error?.message || 'Failed to toggle coupon');
}

export async function deleteCoupon(id) {
  const d = await apiFetch(`/discounts/${id}`, {
    method: 'DELETE',
  });
  if (d?.success) return { success: true };
  throw new Error(d?.error?.message || 'Failed to delete coupon');
}

export async function getPromotions() {
  const d = await apiFetch('/promotions');
  if (d?.success) return { promotions: d.data, _error: null };
  return { promotions: {}, _error: d?.error?.message || 'Failed to load promotions' };
}

export async function savePromotions(payload) {
  const d = await apiFetch('/promotions', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (d?.success) return { success: true };
  throw new Error(d?.error?.message || 'Failed to save promotions');
}

// ── 7. Settings & Audit ───────────────────────────────────────────────────────

export async function getSettings() {
  const d = await apiFetch('/settings');
  if (d?.success) return { settings: d.data, _error: null };
  return { settings: {}, _error: d?.error?.message || 'Failed to load settings' };
}

export async function saveSettings(payload) {
  const d = await apiFetch('/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (d?.success) return { success: true };
  throw new Error(d?.error?.message || 'Failed to save settings');
}

export async function getStaff() {
  const d = await apiFetch('/staff');
  if (d?.success) return { staff: d.data?.staff || [], logs: d.data?.logs || [], _error: null };
  return { staff: [], logs: [], _error: d?.error?.message || 'Failed to load staff records' };
}

export async function inviteStaff({ email, role = 'admin' }) {
  const d = await apiFetch('/staff/invite', {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });
  if (d?.success) return { success: true, ...d.data };
  throw new Error(d?.error?.message || 'Failed to dispatch staff invitation');
}

export async function revokeStaff(id) {
  const d = await apiFetch(`/staff/${id}`, {
    method: 'DELETE',
  });
  if (d?.success) return { success: true, ...d.data };
  throw new Error(d?.error?.message || 'Failed to revoke staff access');
}

export async function getAuditLogs() {
  const d = await apiFetch('/audit-logs');
  if (d?.success) return { logs: d.data, _error: null };
  return { logs: [], _error: d?.error?.message || 'Failed to load audit logs' };
}

// ── 8. Notifications Feed ────────────────────────────────────────────────────

export async function getNotifications() {
  const d = await apiFetch('/notifications');
  if (d?.success) return { notifications: d.data, _error: null };
  return { notifications: [], _error: d?.error?.message || 'Failed to load notifications' };
}

export async function markNotificationsRead() {
  const d = await apiFetch('/notifications/mark-read', {
    method: 'POST',
  });
  if (d?.success) return { success: true };
  throw new Error(d?.error?.message || 'Failed to mark notifications read');
}

// ── 11. Product Reviews & Ratings Moderation ──────────────────────────────────

export async function getAdminReviews(filters = {}) {
  const params = new URLSearchParams();
  if (filters.productId && filters.productId !== 'all') params.set('productId', filters.productId);
  if (filters.rating && filters.rating !== 'all') params.set('rating', filters.rating);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);

  const query = params.toString() ? `?${params.toString()}` : '';
  const d = await apiFetch(`/reviews${query}`);
  if (d?.success) return { ...d.data, _error: null };
  return { reviews: [], metrics: null, stats: null, _error: d?.error?.message || 'Failed to load reviews' };
}

export async function createAdminReview(payload) {
  const d = await apiFetch('/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (d?.success) return d.data;
  throw new Error(d?.error?.message || 'Failed to create review');
}

export async function updateAdminReview(id, payload) {
  const d = await apiFetch(`/reviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (d?.success) return d.data;
  throw new Error(d?.error?.message || 'Failed to update review');
}

export async function deleteAdminReview(id) {
  const d = await apiFetch(`/reviews/${id}`, {
    method: 'DELETE',
  });
  if (d?.success) return { success: true };
  throw new Error(d?.error?.message || 'Failed to delete review');
}

// ── 13. Fulfillment Operations (Milestone 2) ──────────────────────────────

export async function getFulfillment(params = {}) {
  const q = new URLSearchParams();
  if (params.tab) q.set('tab', params.tab);
  if (params.search) q.set('search', params.search);
  if (params.staffId) q.set('staffId', params.staffId);
  if (params.courier) q.set('courier', params.courier);
  if (params.limit) q.set('limit', String(params.limit));
  if (params.offset) q.set('offset', String(params.offset));

  const d = await apiFetch(`/fulfillment?${q.toString()}`);
  if (d?.success) return d.data;
  return { orders: [], tabCounts: {}, staffMembers: [], _error: d?.error?.message };
}

export async function assignFulfillmentStaff(orderIds, staffId) {
  const d = await apiFetch('/fulfillment/assign', {
    method: 'PATCH',
    body: JSON.stringify({ orderIds, staffId }),
  });
  return d;
}

export async function bulkUpdateFulfillmentStatus(orderIds, status, trackingData = {}) {
  const d = await apiFetch('/fulfillment/bulk-status', {
    method: 'PATCH',
    body: JSON.stringify({ orderIds, status, ...trackingData }),
  });
  return d;
}

export async function updatePackingChecklist(orderId, itemIndex, isPacked) {
  const d = await apiFetch(`/fulfillment/${orderId}/packing-checklist`, {
    method: 'PATCH',
    body: JSON.stringify({ itemIndex, isPacked }),
  });
  return d;
}

export async function toggleOrderUrgent(orderId, isUrgent) {
  const d = await apiFetch(`/fulfillment/${orderId}/urgent`, {
    method: 'PATCH',
    body: JSON.stringify({ isUrgent }),
  });
  return d;
}

export async function getOrderTimeline(orderId) {
  const d = await apiFetch(`/fulfillment/${orderId}/timeline`);
  if (d?.success) return d.data;
  return [];
}

export async function openBatchPackingSlips(orderIds = []) {
  const q = orderIds.length > 0 ? `?ids=${encodeURIComponent(orderIds.join(','))}` : '';
  const printUrl = `${BASE}/fulfillment/packing-slips${q}`;
  const win = window.open(printUrl, '_blank');
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this site to print packing slips.');
  }
}

export default {
  getDashboard,
  getOrders,
  updateOrderStatus,
  getFulfillment,
  assignFulfillmentStaff,
  bulkUpdateFulfillmentStatus,
  updatePackingChecklist,
  toggleOrderUrgent,
  getOrderTimeline,
  openBatchPackingSlips,
  getInventory,
  updateInventory,
  bulkImportInventory,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  createProduct,
  updateProduct,
  archiveProduct,
  getCustomers,
  updateCustomerNotes,
  getCoupons,
  saveCoupon,
  toggleCoupon,
  deleteCoupon,
  getPromotions,
  savePromotions,
  getSettings,
  saveSettings,
  getStaff,
  inviteStaff,
  revokeStaff,
  getAuditLogs,
  getNotifications,
  markNotificationsRead,
};
