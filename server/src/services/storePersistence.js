import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function safeReadJson(filePath, defaultData) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
  safeWriteJson(filePath, defaultData);
  return defaultData;
}

function safeWriteJson(filePath, data) {
  try {
    const tmpPath = `${filePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
  }
}

// ── 1. Coupons ───────────────────────────────────────────────────────────────

const COUPONS_FILE = path.join(DATA_DIR, 'coupons.json');
const DEFAULT_COUPONS = [
  {
    id: 'a1111111-1111-4111-8111-111111111111',
    code: 'BEAR10',
    type: 'percentage',
    value: 10,
    minOrder: 999,
    min_order: 999,
    usageCount: 0,
    usage_count: 0,
    usageLimit: 100,
    usage_limit: 100,
    isActive: true,
    is_active: true,
    expiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b2222222-2222-4222-8222-222222222222',
    code: 'WELCOME500',
    type: 'fixed',
    value: 500,
    minOrder: 2499,
    min_order: 2499,
    usageCount: 0,
    usage_count: 0,
    usageLimit: 50,
    usage_limit: 50,
    isActive: true,
    is_active: true,
    expiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c3333333-3333-4333-8333-333333333333',
    code: 'DROP20',
    type: 'percentage',
    value: 20,
    minOrder: 3999,
    min_order: 3999,
    usageCount: 0,
    usage_count: 0,
    usageLimit: 25,
    usage_limit: 25,
    isActive: true,
    is_active: true,
    expiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

export function getStoredCoupons() {
  return safeReadJson(COUPONS_FILE, DEFAULT_COUPONS);
}

export function saveStoredCoupons(coupons) {
  safeWriteJson(COUPONS_FILE, coupons);
  return coupons;
}

export function validateCouponCode(code, cartTotal) {
  if (!code || typeof code !== 'string') {
    return { valid: false, message: 'Coupon code required' };
  }
  const coupons = getStoredCoupons();
  const c = coupons.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!c || (!c.isActive && !c.is_active)) {
    return { valid: false, message: 'Invalid or inactive coupon code' };
  }

  const expiresAt = c.expiresAt || c.expires_at;
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    return { valid: false, message: 'Coupon code has expired' };
  }

  const min = c.minOrder !== undefined ? c.minOrder : (c.min_order !== undefined ? c.min_order : 0);
  if (cartTotal < min) {
    return { valid: false, message: `Minimum cart value of ₹${min} required for this coupon` };
  }

  const limit = c.usageLimit !== undefined ? c.usageLimit : c.usage_limit;
  const count = c.usageCount !== undefined ? c.usageCount : c.usage_count;
  if (limit && count >= limit) {
    return { valid: false, message: 'Coupon usage limit has been reached' };
  }

  let discountAmount = 0;
  if (c.type === 'percentage') {
    discountAmount = Math.round(cartTotal * (c.value / 100));
  } else {
    discountAmount = Math.min(cartTotal, c.value);
  }

  return {
    valid: true,
    code: c.code,
    type: c.type,
    value: c.value,
    discountAmount,
    discountPaise: discountAmount * 100,
    label: c.type === 'percentage' ? `${c.value}% Off Your Order` : `₹${c.value} Flat Off`,
  };
}

export function incrementCouponUsage(code) {
  if (!code || typeof code !== 'string') return null;
  const coupons = getStoredCoupons();
  const c = coupons.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!c) return null;

  c.usageCount = (c.usageCount || c.usage_count || 0) + 1;
  c.usage_count = c.usageCount;
  saveStoredCoupons(coupons);
  return c;
}

export function decrementCouponUsage(code) {
  if (!code || typeof code !== 'string') return null;
  const coupons = getStoredCoupons();
  const c = coupons.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!c) return null;

  c.usageCount = Math.max(0, (c.usageCount || c.usage_count || 1) - 1);
  c.usage_count = c.usageCount;
  saveStoredCoupons(coupons);
  return c;
}

// ── 2. Promotions ────────────────────────────────────────────────────────────

const PROMOTIONS_FILE = path.join(DATA_DIR, 'promotions.json');
const DEFAULT_PROMOTIONS = {
  announcement_bar: {
    enabled: true,
    messages: [
      'COMPLIMENTARY EXPRESS AIR SHIPPING ACROSS INDIA (₹0)',
      'USE CODE BEAR10 FOR 10% OFF YOUR FIRST DROP',
      'SOW WOMEN’S SCULPT COLLECTION NOW LIVE',
    ],
  },
  hero_banner: {
    bear_title: 'BUILT FOR DISCIPLINE. 480 GSM HEAVYWEIGHT.',
    sow_title: 'SCULPTED FOR MOVEMENT. BUTTER-SOFT LUXURY.',
  },
  popup: {
    enabled: true,
    text: 'Unlock ₹500 off on your first order. Use code WELCOME500 at checkout.',
  },
};

export function getStoredPromotions() {
  return safeReadJson(PROMOTIONS_FILE, DEFAULT_PROMOTIONS);
}

export function saveStoredPromotions(promotions) {
  safeWriteJson(PROMOTIONS_FILE, promotions);
  return promotions;
}

// ── 3. Store Settings ────────────────────────────────────────────────────────

const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const DEFAULT_SETTINGS = {
  storeName: 'BEAR Performance Wear',
  store_name: 'BEAR Performance Wear',
  whatsappNumber: '919605210198',
  whatsapp_number: '919605210198',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  lowStockThreshold: 5,
  reservationExpiryMinutes: 120,
  freeShippingPanIndia: true,
  deliveryFee: 0,
};

export function getStoredSettings() {
  return safeReadJson(SETTINGS_FILE, DEFAULT_SETTINGS);
}

export function saveStoredSettings(settings) {
  const current = getStoredSettings();
  const name = settings.storeName || settings.store_name || current.storeName;
  const whatsapp = settings.whatsappNumber || settings.whatsapp_number || current.whatsappNumber;
  const merged = {
    ...current,
    ...settings,
    storeName: name,
    store_name: name,
    whatsappNumber: whatsapp,
    whatsapp_number: whatsapp,
  };
  safeWriteJson(SETTINGS_FILE, merged);
  return merged;
}

// ── 4. Notification Reads ────────────────────────────────────────────────────

const NOTIF_READS_FILE = path.join(DATA_DIR, 'notification_reads.json');

export function getReadNotificationIds() {
  return safeReadJson(NOTIF_READS_FILE, []);
}

export function saveReadNotificationIds(ids) {
  const current = getReadNotificationIds();
  const merged = Array.from(new Set([...current, ...(ids || [])]));
  safeWriteJson(NOTIF_READS_FILE, merged);
  return merged;
}
