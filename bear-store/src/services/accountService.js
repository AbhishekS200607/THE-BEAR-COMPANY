import { mockDelay } from './mockStore.js';
import { get, set } from '../utils/storage.js';

const STORAGE_KEYS = {
  addresses: 'bear_addresses',
  orders: 'bear_orders',
  user: 'bear_user',
};

const defaultUser = {
  name: 'Arjun Sharma',
  email: 'arjun@example.com',
  phone: '9876543210',
  avatar: null,
  memberSince: 'January 2025',
  bearPoints: 1240,
};

const initialOrders = [
  {
    id: 'BEAR-2026-984231',
    date: '28 Oct 2026',
    items: [{ name: 'Essential Oversized Tee', size: 'M', colour: 'Jet Black', quantity: 1 }],
    total: 1299,
    status: 'delivered',
  },
  {
    id: 'BEAR-2026-773190',
    date: '12 Oct 2026',
    items: [
      { name: 'Performance Joggers', size: 'L', colour: 'Ash Grey', quantity: 1 },
      { name: 'Training Shorts', size: 'L', colour: 'Charcoal', quantity: 1 },
    ],
    total: 2798,
    status: 'delivered',
  },
  {
    id: 'BEAR-2026-601045',
    date: '2 Nov 2026',
    items: [{ name: 'Essential Hoodie', size: 'M', colour: 'Jet Black', quantity: 1 }],
    total: 2499,
    status: 'processing',
  },
];

const initialAddresses = [
  {
    id: 'addr-1',
    label: 'Home',
    fullName: 'Arjun Sharma',
    line1: '24, Green Park Colony',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110016',
    phone: '9876543210',
    default: true,
  },
  {
    id: 'addr-2',
    label: 'Office',
    fullName: 'Arjun Sharma',
    line1: 'Tower B, Sector 62',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    phone: '9876543210',
    default: false,
  },
];

export async function getDemoUser() {
  await mockDelay(50, 100);
  return get(STORAGE_KEYS.user) || defaultUser;
}

// ── ADDRESS CRUD ─────────────────────────────────────────────
export async function getDemoAddresses() {
  await mockDelay(50, 100);
  let addresses = get(STORAGE_KEYS.addresses);
  if (!addresses || addresses.length === 0) {
    addresses = initialAddresses;
    set(STORAGE_KEYS.addresses, addresses);
  }
  return [...addresses];
}

export function addAddress(address) {
  const addresses = get(STORAGE_KEYS.addresses) || initialAddresses;
  const newAddr = {
    ...address,
    id: `addr-${Date.now()}`,
    default: address.default || addresses.length === 0,
  };
  if (newAddr.default) {
    addresses.forEach(a => a.default = false);
  }
  const updated = [newAddr, ...addresses];
  set(STORAGE_KEYS.addresses, updated);
  return updated;
}

export function updateAddress(id, patch) {
  let addresses = get(STORAGE_KEYS.addresses) || initialAddresses;
  if (patch.default) {
    addresses.forEach(a => a.default = false);
  }
  addresses = addresses.map(a => a.id === id ? { ...a, ...patch } : a);
  set(STORAGE_KEYS.addresses, addresses);
  return addresses;
}

export function deleteAddress(id) {
  let addresses = get(STORAGE_KEYS.addresses) || initialAddresses;
  addresses = addresses.filter(a => a.id !== id);
  if (addresses.length > 0 && !addresses.some(a => a.default)) {
    addresses[0].default = true;
  }
  set(STORAGE_KEYS.addresses, addresses);
  return addresses;
}

// ── ORDER CRUD ───────────────────────────────────────────────
export async function getDemoOrders() {
  await mockDelay(50, 100);
  let orders = get(STORAGE_KEYS.orders);
  if (!orders || orders.length === 0) {
    orders = initialOrders;
    set(STORAGE_KEYS.orders, orders);
  }
  return [...orders];
}

export function addOrder(order) {
  const orders = get(STORAGE_KEYS.orders) || initialOrders;
  const newOrder = {
    id: order.id || order.orderNumber,
    date: order.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    items: (order.items || []).map(i => ({
      name: i.name,
      size: i.size || 'M',
      colour: i.colour || 'Standard',
      quantity: i.quantity || 1,
      price: i.price,
    })),
    total: order.total,
    status: order.status || 'pending_whatsapp',
    details: order.details,
  };
  const updated = [newOrder, ...orders];
  set(STORAGE_KEYS.orders, updated);
  return updated;
}

export function confirmOrder(orderId) {
  let orders = get(STORAGE_KEYS.orders) || initialOrders;
  orders = orders.map(o => o.id === orderId ? { ...o, status: 'processing' } : o);
  set(STORAGE_KEYS.orders, orders);
  return orders;
}

export function cancelOrder(orderId) {
  let orders = get(STORAGE_KEYS.orders) || initialOrders;
  orders = orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o);
  set(STORAGE_KEYS.orders, orders);
  return orders;
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
};
