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

// ── 5. Product Reviews & Ratings (Persistent Server Storage) ─────────────────

const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

const DEFAULT_REVIEWS = [
  {
    id: 'rev-001',
    productId: 'bear-001',
    productName: 'Essential Oversized Tee',
    author: 'Vikram Mehta',
    rating: 5,
    fit: 'True to Size',
    title: 'Unbelievable fabric density and drape',
    comment: 'The 260 GSM heavyweight compact cotton holds its structure through intense lifting sessions and washes. Easily on par with international activewear brands that charge 3x the price.',
    isVerified: true,
    isPublished: true,
    createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'rev-002',
    productId: 'sow-001',
    productName: 'Sculpt High-Waist Ribbed Leggings',
    author: 'Ananya Deshmukh',
    rating: 5,
    fit: 'True to Size',
    title: 'Flattering compression without pinching',
    comment: 'SOW activewear has completely replaced my imported tights. High-waisted contour stays firmly locked during HIIT and squats. Breathable and luxurious hand-feel.',
    isVerified: true,
    isPublished: true,
    createdAt: new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'rev-003',
    productId: 'bear-001',
    productName: 'Essential Oversized Tee',
    author: 'Rohit Shenoy',
    rating: 5,
    fit: 'Runs Slightly Large',
    title: 'Best oversized gym tee in India',
    comment: 'Drop shoulders and heavy ribbed collar never sag after repeated washes. Dispatched fast with BlueDart directly to Bengaluru in 48 hours.',
    isVerified: true,
    isPublished: true,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'rev-004',
    productId: 'bear-002',
    productName: 'Training Tee',
    author: 'Karanvir S.',
    rating: 4,
    fit: 'True to Size',
    title: 'Premium stitching and clean aesthetics',
    comment: 'Clean minimalist branding and reinforced twin-needle hems. Very satisfied with the fit and quality.',
    isVerified: true,
    isPublished: true,
    createdAt: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'rev-005',
    productId: 'sow-002',
    productName: 'Ribbed Contour Crop Top',
    author: 'Meera Rao',
    rating: 5,
    fit: 'True to Size',
    title: 'Buttery soft and holds chest comfortably',
    comment: 'No chafe underarms during running. The ribbed waistband does not roll up when doing pushups or yoga.',
    isVerified: true,
    isPublished: true,
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },
];

export function getStoredReviews(filters = {}) {
  const reviews = safeReadJson(REVIEWS_FILE, DEFAULT_REVIEWS);
  return reviews.filter((r) => {
    if (filters.productId && r.productId !== filters.productId) return false;
    if (filters.rating && r.rating !== Number(filters.rating)) return false;
    if (filters.isPublished !== undefined && r.isPublished !== filters.isPublished) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        (r.author && r.author.toLowerCase().includes(q)) ||
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.comment && r.comment.toLowerCase().includes(q)) ||
        (r.productName && r.productName.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });
}

export function createStoredReview(data) {
  const reviews = safeReadJson(REVIEWS_FILE, DEFAULT_REVIEWS);
  const newReview = {
    id: data.id || `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productId: data.productId || 'general',
    productName: data.productName || 'BEAR Garment',
    author: data.author || 'Anonymous Athlete',
    rating: Math.max(1, Math.min(5, Math.round(Number(data.rating) || 5))),
    fit: data.fit || 'True to Size',
    title: data.title || 'Verified Athlete Review',
    comment: data.comment || '',
    isVerified: data.isVerified !== undefined ? Boolean(data.isVerified) : true,
    isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  reviews.unshift(newReview);
  safeWriteJson(REVIEWS_FILE, reviews);
  return newReview;
}

export function updateStoredReview(id, updates) {
  const reviews = safeReadJson(REVIEWS_FILE, DEFAULT_REVIEWS);
  const idx = reviews.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  const current = reviews[idx];
  const updated = {
    ...current,
    ...(updates.author !== undefined && { author: updates.author }),
    ...(updates.rating !== undefined && { rating: Math.max(1, Math.min(5, Math.round(Number(updates.rating)))) }),
    ...(updates.fit !== undefined && { fit: updates.fit }),
    ...(updates.title !== undefined && { title: updates.title }),
    ...(updates.comment !== undefined && { comment: updates.comment }),
    ...(updates.isVerified !== undefined && { isVerified: Boolean(updates.isVerified) }),
    ...(updates.isPublished !== undefined && { isPublished: Boolean(updates.isPublished) }),
    ...(updates.productName !== undefined && { productName: updates.productName }),
    updatedAt: new Date().toISOString(),
  };

  reviews[idx] = updated;
  safeWriteJson(REVIEWS_FILE, reviews);
  return updated;
}

export function deleteStoredReview(id) {
  const reviews = safeReadJson(REVIEWS_FILE, DEFAULT_REVIEWS);
  const idx = reviews.findIndex((r) => r.id === id);
  if (idx === -1) return false;

  reviews.splice(idx, 1);
  safeWriteJson(REVIEWS_FILE, reviews);
  return true;
}

export function calculateStoredReviewMetrics(reviews = []) {
  if (!reviews || reviews.length === 0) {
    return {
      averageRating: '5.0',
      totalCount: 0,
      fitSentiment: '100% of buyers say "True to Size"',
      trueToSizePercent: 100,
      breakdown: [
        { stars: 5, count: 0, pct: 100 },
        { stars: 4, count: 0, pct: 0 },
        { stars: 3, count: 0, pct: 0 },
        { stars: 2, count: 0, pct: 0 },
        { stars: 1, count: 0, pct: 0 },
      ],
    };
  }

  const total = reviews.length;
  const sumRating = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
  const avg = (sumRating / total).toFixed(1);

  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let trueToSizeCount = 0;

  reviews.forEach((r) => {
    const star = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
    counts[star] = (counts[star] || 0) + 1;
    if (r.fit === 'True to Size' || !r.fit) {
      trueToSizeCount++;
    }
  });

  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = counts[stars] || 0;
    const pct = Math.round((count / total) * 100);
    return { stars, count, pct };
  });

  const trueToSizePct = Math.round((trueToSizeCount / total) * 100);

  return {
    averageRating: avg,
    totalCount: total,
    fitSentiment: `${trueToSizePct}% of buyers say "True to Size"`,
    trueToSizePercent: trueToSizePct,
    breakdown,
  };
}
