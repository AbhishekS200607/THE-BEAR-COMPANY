import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

function safeReadJson(filePath, defaultData) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`[storePersistence] Error reading ${filePath}:`, err.message);
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
    // Non-blocking fallback write error
  }
}

// ── Product ID to UUID mapping for Reviews FK integrity ──────────────────────

const PRODUCT_ID_MAP = {
  'bear-001': 'c0000001-0000-4000-8000-000000000001',
  'essential-oversized-tee': 'c0000001-0000-4000-8000-000000000001',
  'bear-002': 'c0000001-0000-4000-8000-000000000002',
  'training-tee': 'c0000001-0000-4000-8000-000000000002',
  'bear-003': 'c0000001-0000-4000-8000-000000000003',
  'training-shorts': 'c0000001-0000-4000-8000-000000000003',
  'bear-004': 'c0000001-0000-4000-8000-000000000004',
  'performance-joggers': 'c0000001-0000-4000-8000-000000000004',
  'bear-005': 'c0000001-0000-4000-8000-000000000005',
  'core-tank-top': 'c0000001-0000-4000-8000-000000000005',
  'bear-006': 'c0000001-0000-4000-8000-000000000006',
  'essential-hoodie': 'c0000001-0000-4000-8000-000000000006',
  'bear-007': 'c0000001-0000-4000-8000-000000000007',
  'athletic-shorts-7in': 'c0000001-0000-4000-8000-000000000007',
  'bear-008': 'c0000001-0000-4000-8000-000000000008',
  'compression-tee': 'c0000001-0000-4000-8000-000000000008',
  'sow-001': 'd0000001-0000-4000-8000-000000000001',
  'sculpt-flex-bra': 'd0000001-0000-4000-8000-000000000001',
  'sow-002': 'd0000001-0000-4000-8000-000000000002',
  'high-waist-ribbed-leggings': 'd0000001-0000-4000-8000-000000000002',
  'sow-003': 'd0000001-0000-4000-8000-000000000003',
  'cropped-zip-hoodie': 'd0000001-0000-4000-8000-000000000003',
  'sow-004': 'd0000001-0000-4000-8000-000000000004',
  'seamless-contour-shorts': 'd0000001-0000-4000-8000-000000000004',
  'sow-005': 'd0000001-0000-4000-8000-000000000005',
  'terracotta-contour-suit': 'd0000001-0000-4000-8000-000000000005',
  'sow-006': 'd0000001-0000-4000-8000-000000000006',
  'flow-studio-joggers': 'd0000001-0000-4000-8000-000000000006',
  'sow-007': 'd0000001-0000-4000-8000-000000000007',
  'ribbed-crop-tank': 'd0000001-0000-4000-8000-000000000007',
  'sow-008': 'd0000001-0000-4000-8000-000000000008',
  'sculpt-biker-set': 'd0000001-0000-4000-8000-000000000008',
};

function resolveProductId(pid) {
  if (!pid) return 'c0000001-0000-4000-8000-000000000001';
  if (PRODUCT_ID_MAP[pid]) return PRODUCT_ID_MAP[pid];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(pid)) return pid;
  return 'c0000001-0000-4000-8000-000000000001';
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

let cachedCoupons = safeReadJson(COUPONS_FILE, DEFAULT_COUPONS);

function normalizeCoupon(row) {
  const isAct = row.isActive !== undefined ? Boolean(row.isActive) : (row.is_active !== undefined ? Boolean(row.is_active) : true);
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: Number(row.value),
    minOrder: Number(row.min_order ?? row.minOrder ?? 0),
    min_order: Number(row.min_order ?? row.minOrder ?? 0),
    usageCount: Number(row.usage_count ?? row.usageCount ?? 0),
    usage_count: Number(row.usage_count ?? row.usageCount ?? 0),
    usageLimit: Number(row.usage_limit ?? row.usageLimit ?? 100),
    usage_limit: Number(row.usage_limit ?? row.usageLimit ?? 100),
    isActive: isAct,
    is_active: isAct,
    expiresAt: row.expires_at || row.expiresAt || null,
    expires_at: row.expires_at || row.expiresAt || null,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    created_at: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    updated_at: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

function toCouponRow(c) {
  return {
    id: c.id,
    code: c.code.toUpperCase(),
    type: c.type || 'percentage',
    value: Number(c.value),
    min_order: Number(c.minOrder ?? c.min_order ?? 0),
    usage_count: Number(c.usageCount ?? c.usage_count ?? 0),
    usage_limit: Number(c.usageLimit ?? c.usage_limit ?? 100),
    is_active: c.isActive !== undefined ? Boolean(c.isActive) : (c.is_active !== undefined ? Boolean(c.is_active) : true),
    expires_at: c.expiresAt || c.expires_at || null,
    updated_at: new Date().toISOString(),
  };
}

export function getStoredCoupons() {
  return cachedCoupons;
}

export function saveStoredCoupons(coupons) {
  cachedCoupons = coupons.map(normalizeCoupon);
  safeWriteJson(COUPONS_FILE, cachedCoupons);

  // Asynchronously persist to Supabase using supabaseAdmin
  if (supabaseAdmin) {
    (async () => {
      try {
        const rows = cachedCoupons.map(toCouponRow);
        if (rows.length > 0) {
          await supabaseAdmin.from('coupons').upsert(rows, { onConflict: 'code' });
        }
      } catch (err) {
        console.error('[storePersistence] Supabase coupon sync error:', err.message);
      }
    })();
  }

  return cachedCoupons;
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

  if (supabaseAdmin) {
    (async () => {
      try {
        await supabaseAdmin
          .from('coupons')
          .update({ usage_count: c.usageCount, updated_at: new Date().toISOString() })
          .eq('code', c.code.toUpperCase());
      } catch (err) {
        console.error('[storePersistence] Supabase coupon increment error:', err.message);
      }
    })();
  }

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

  if (supabaseAdmin) {
    (async () => {
      try {
        await supabaseAdmin
          .from('coupons')
          .update({ usage_count: c.usageCount, updated_at: new Date().toISOString() })
          .eq('code', c.code.toUpperCase());
      } catch (err) {
        console.error('[storePersistence] Supabase coupon decrement error:', err.message);
      }
    })();
  }

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

let cachedPromotions = safeReadJson(PROMOTIONS_FILE, DEFAULT_PROMOTIONS);

export function getStoredPromotions() {
  return cachedPromotions;
}

export function saveStoredPromotions(promotions) {
  cachedPromotions = { ...cachedPromotions, ...promotions };
  safeWriteJson(PROMOTIONS_FILE, cachedPromotions);

  // Asynchronously persist to Supabase store_settings using supabaseAdmin
  if (supabaseAdmin) {
    (async () => {
      try {
        await supabaseAdmin.from('store_settings').upsert({
          key: 'promotions',
          value: cachedPromotions,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[storePersistence] Supabase promotions sync error:', err.message);
      }
    })();
  }

  return cachedPromotions;
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

let cachedSettings = safeReadJson(SETTINGS_FILE, DEFAULT_SETTINGS);

export function getStoredSettings() {
  return cachedSettings;
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
  cachedSettings = merged;
  safeWriteJson(SETTINGS_FILE, merged);

  // Asynchronously persist to Supabase store_settings using supabaseAdmin
  if (supabaseAdmin) {
    (async () => {
      try {
        await supabaseAdmin.from('store_settings').upsert({
          key: 'settings',
          value: merged,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[storePersistence] Supabase settings sync error:', err.message);
      }
    })();
  }

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

// ── 5. Product Reviews & Ratings (Persistent Storage via Supabase) ───────────

const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

const DEFAULT_REVIEWS = [
  {
    id: 'a0000001-0001-4000-8000-000000000001',
    productId: 'c0000001-0000-4000-8000-000000000001',
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
    id: 'a0000001-0001-4000-8000-000000000002',
    productId: 'd0000001-0000-4000-8000-000000000002',
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
    id: 'a0000001-0001-4000-8000-000000000003',
    productId: 'c0000001-0000-4000-8000-000000000001',
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
    id: 'a0000001-0001-4000-8000-000000000004',
    productId: 'c0000001-0000-4000-8000-000000000002',
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
    id: 'a0000001-0001-4000-8000-000000000005',
    productId: 'd0000001-0000-4000-8000-000000000007',
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

let cachedReviews = safeReadJson(REVIEWS_FILE, DEFAULT_REVIEWS);

function normalizeReview(r) {
  const pId = resolveProductId(r.product_id || r.productId);
  const isPub = r.isPublished !== undefined ? Boolean(r.isPublished) : (r.is_published !== undefined ? Boolean(r.is_published) : true);
  const isVer = r.isVerified !== undefined ? Boolean(r.isVerified) : (r.is_verified !== undefined ? Boolean(r.is_verified) : true);
  return {
    id: r.id || crypto.randomUUID(),
    productId: pId,
    product_id: pId,
    productName: r.product_name || r.productName || 'BEAR Garment',
    product_name: r.product_name || r.productName || 'BEAR Garment',
    author: r.author || 'Anonymous Athlete',
    rating: Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5))),
    fit: r.fit || 'True to Size',
    title: r.title || 'Verified Athlete Review',
    comment: r.comment || '',
    isVerified: isVer,
    is_verified: isVer,
    isPublished: isPub,
    is_published: isPub,
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    created_at: r.created_at || r.createdAt || new Date().toISOString(),
    updatedAt: r.updated_at || r.updatedAt || new Date().toISOString(),
    updated_at: r.updated_at || r.updatedAt || new Date().toISOString(),
  };
}

function toReviewRow(r) {
  const norm = normalizeReview(r);
  return {
    id: norm.id,
    product_id: norm.productId,
    product_name: norm.productName,
    author: norm.author,
    rating: norm.rating,
    fit: norm.fit,
    title: norm.title,
    comment: norm.comment,
    is_verified: norm.isVerified,
    is_published: norm.isPublished,
    created_at: norm.createdAt,
    updated_at: norm.updatedAt,
  };
}

export function getStoredReviews(filters = {}) {
  return cachedReviews.filter((r) => {
    if (filters.productId) {
      const targetPid = resolveProductId(filters.productId);
      if (r.productId !== targetPid && r.productId !== filters.productId) return false;
    }
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
  const pId = resolveProductId(data.productId);
  const newReview = normalizeReview({
    ...data,
    id: data.id || crypto.randomUUID(),
    productId: pId,
  });

  cachedReviews.unshift(newReview);
  safeWriteJson(REVIEWS_FILE, cachedReviews);

  if (supabaseAdmin) {
    (async () => {
      try {
        await supabaseAdmin.from('reviews').insert(toReviewRow(newReview));
      } catch (err) {
        console.error('[storePersistence] Supabase review insert error:', err.message);
      }
    })();
  }

  return newReview;
}

export function updateStoredReview(id, updates) {
  const idx = cachedReviews.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  const current = cachedReviews[idx];
  const isPub = updates.isPublished !== undefined ? Boolean(updates.isPublished) : (updates.is_published !== undefined ? Boolean(updates.is_published) : current.isPublished);
  const isVer = updates.isVerified !== undefined ? Boolean(updates.isVerified) : (updates.is_verified !== undefined ? Boolean(updates.is_verified) : current.isVerified);

  const updated = {
    ...current,
    ...updates,
    isPublished: isPub,
    is_published: isPub,
    isVerified: isVer,
    is_verified: isVer,
    updatedAt: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (updates.rating !== undefined) {
    updated.rating = Math.max(1, Math.min(5, Math.round(Number(updates.rating))));
  }
  if (updates.productId || updates.product_id) {
    const pId = resolveProductId(updates.productId || updates.product_id);
    updated.productId = pId;
    updated.product_id = pId;
  }

  cachedReviews[idx] = updated;
  safeWriteJson(REVIEWS_FILE, cachedReviews);

  if (supabaseAdmin) {
    (async () => {
      try {
        await supabaseAdmin.from('reviews').update(toReviewRow(updated)).eq('id', id);
      } catch (err) {
        console.error('[storePersistence] Supabase review update error:', err.message);
      }
    })();
  }

  return updated;
}

export function deleteStoredReview(id) {
  const idx = cachedReviews.findIndex((r) => r.id === id);
  if (idx === -1) return false;

  cachedReviews.splice(idx, 1);
  safeWriteJson(REVIEWS_FILE, cachedReviews);

  if (supabaseAdmin) {
    (async () => {
      try {
        await supabaseAdmin.from('reviews').delete().eq('id', id);
      } catch (err) {
        console.error('[storePersistence] Supabase review delete error:', err.message);
      }
    })();
  }

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

// ── One-Time Supabase Sync & Auto-Migration Fallback ─────────────────────────

export async function syncFromSupabase() {
  if (!supabaseAdmin) return;

  try {
    // 1. Sync Coupons
    const { data: dbCoupons, error: couponErr } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (!couponErr && Array.isArray(dbCoupons) && dbCoupons.length > 0) {
      cachedCoupons = dbCoupons.map(normalizeCoupon);
    } else if (!couponErr && Array.isArray(dbCoupons) && dbCoupons.length === 0 && cachedCoupons.length > 0) {
      // One-time migration fallback: seed Supabase from JSON
      const rows = cachedCoupons.map(toCouponRow);
      await supabaseAdmin.from('coupons').insert(rows);
    }

    // 2. Sync Store Settings (Promotions & General Settings)
    const { data: dbSettings, error: settingsErr } = await supabaseAdmin
      .from('store_settings')
      .select('*');

    if (!settingsErr && Array.isArray(dbSettings)) {
      const promoRow = dbSettings.find((s) => s.key === 'promotions');
      if (promoRow?.value) {
        cachedPromotions = { ...cachedPromotions, ...promoRow.value };
      } else {
        // One-time migration fallback
        await supabaseAdmin.from('store_settings').upsert({
          key: 'promotions',
          value: cachedPromotions,
          updated_at: new Date().toISOString(),
        });
      }

      const generalRow = dbSettings.find((s) => s.key === 'settings');
      if (generalRow?.value) {
        cachedSettings = { ...cachedSettings, ...generalRow.value };
      } else {
        // One-time migration fallback
        await supabaseAdmin.from('store_settings').upsert({
          key: 'settings',
          value: cachedSettings,
          updated_at: new Date().toISOString(),
        });
      }
    }

    // 3. Sync Reviews
    const { data: dbReviews, error: reviewErr } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!reviewErr && Array.isArray(dbReviews) && dbReviews.length > 0) {
      cachedReviews = dbReviews.map(normalizeReview);
    } else if (!reviewErr && Array.isArray(dbReviews) && dbReviews.length === 0 && cachedReviews.length > 0) {
      // One-time migration fallback
      const rows = cachedReviews.map(toReviewRow);
      await supabaseAdmin.from('reviews').insert(rows);
    }
  } catch (err) {
    console.warn('[storePersistence] Initial Supabase synchronization notice:', err.message);
  }
}

// Background sync on server startup
syncFromSupabase().catch(() => {});
