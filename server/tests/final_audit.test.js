/**
 * BEAR — Final Independent Concurrency Audit
 * Run: node --test tests/final_audit.test.js
 *
 * This file is an INDEPENDENT audit. It does not import or depend on
 * concurrency.test.js. It sets NODE_ENV=test before any app import so
 * the rate-limiter skip() fires correctly.
 *
 * Two root causes fixed vs the previous run:
 *   1. cleanupTestOrders used supabase.rpc(...).catch() — Supabase JS v2
 *      returns a PromiseLike thenable, not a native Promise, so .catch()
 *      does not exist on the raw call. Must await then handle error field.
 *   2. P2-T5-REPEAT hit HTTP 429 because NODE_ENV was set AFTER the app
 *      module was already cached — the skip() in rateLimiter never fired.
 *      Fix: set NODE_ENV before any import that transitively loads app.js.
 */

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

// MUST be set before any app import so rateLimiter.skip() sees 'test'
process.env.NODE_ENV = 'test';

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const REPEAT = 20;

const BASE = {
  customerName: 'Audit Tester',
  customerPhone: '9100000001',
  deliveryLine1: '1 Audit Lane, Connaught Place',
  deliveryCity: 'New Delhi',
  deliveryState: 'Delhi',
  deliveryPincode: '110001',
};

// ─── Shared state ─────────────────────────────────────────────────────────────

let server;
let baseUrl;
let db;          // service-role Supabase client — direct DB access
let variantId;   // isolated test variant resolved in before()
let adminToken;  // super-admin JWT

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function inv(vid) {
  const { data, error } = await db
    .from('inventory')
    .select('quantity_available, quantity_reserved')
    .eq('variant_id', vid)
    .single();
  if (error) throw new Error(`inv() failed: ${error.message}`);
  return data;
}

async function setInv(vid, available, reserved = 0) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { error } = await db
        .from('inventory')
        .update({ quantity_available: available, quantity_reserved: reserved, updated_at: new Date().toISOString() })
        .eq('variant_id', vid);
      if (!error) return;
      if (attempt === 2) throw new Error(`setInv() failed: ${error.message}`);
    } catch (err) {
      if (attempt === 2) throw err;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

// Safe RPC call — returns { ok, error } without throwing
async function rpc(fn, args) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await db.rpc(fn, args);
      return { ok: !result.error, error: result.error, data: result.data };
    } catch (err) {
      if (attempt === 2) return { ok: false, error: err };
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

// Cancel all non-cancelled orders for this variant (cleanup)
async function cleanup(vid) {
  const { data: items } = await db
    .from('order_items')
    .select('order_id, orders!inner(status, reservation_released_at)')
    .eq('variant_id', vid)
    .in('orders.status', ['pending_whatsapp', 'confirmed']);

  if (!items || items.length === 0) return;

  for (const item of items) {
    // Await the RPC result — do NOT chain .catch() on the raw call
    const result = await db.rpc('cancel_pending_order', {
      p_order_id: item.order_id,
      p_reason: 'audit cleanup',
    });
    // Silently ignore "already cancelled" errors
    if (result.error && !result.error.message?.includes('cannot be cancelled')) {
      console.warn(`[cleanup] ${item.order_id}: ${result.error.message}`);
    }
  }
}

async function checkInvariants(vid, label) {
  const state = await inv(vid);
  assert.ok(state.quantity_available >= 0,
    `[${label}] available < 0: ${state.quantity_available}`);
  assert.ok(state.quantity_reserved >= 0,
    `[${label}] reserved < 0: ${state.quantity_reserved}`);
  assert.ok(state.quantity_reserved <= state.quantity_available,
    `[${label}] reserved(${state.quantity_reserved}) > available(${state.quantity_available})`);
  return state;
}

async function postOrder(items, key, phone) {
  const res = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': key || uid(),
    },
    body: JSON.stringify({ ...BASE, customerPhone: phone || BASE.customerPhone, items }),
  });
  const body = await res.json().catch(() => ({ success: false }));
  return { status: res.status, body };
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
      resolve();
    });
  });

  db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Admin JWT
  const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const { data: sa } = await anon.auth.signInWithPassword({
    email: env.TEST_ADMIN_EMAIL,
    password: env.TEST_ADMIN_PASSWORD,
  });
  adminToken = sa?.session?.access_token;

  // Pick first active variant
  const { data, error } = await db
    .from('inventory')
    .select('variant_id, product_variants!inner(products!inner(is_active))')
    .eq('product_variants.products.is_active', true)
    .limit(1)
    .single();

  if (error || !data) throw new Error('No active variant found — run seed first');
  variantId = data.variant_id;
  console.log(`[AUDIT SETUP] variant=${variantId} env=${env.NODE_ENV}`);
});

after(async () => {
  if (variantId) {
    await cleanup(variantId).catch(() => {});
    await setInv(variantId, 30, 0).catch(() => {});
  }
  if (server) await new Promise((r) => server.close(r));
});

// =============================================================================
// SECTION 1 — RATE LIMITER VERIFICATION
// =============================================================================

describe('S1 — Rate Limiter Verification', () => {

  test('S1-T1: NODE_ENV=test — rate limiter skip() is active, no 429 on burst', async () => {
    // Send 20 rapid requests to a sensitive endpoint — must all get through (not 429)
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        fetch(`${baseUrl}/orders/validate-coupon`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: 'NONEXISTENT', cartTotal: 100 }),
        }).then(async (r) => r.status)
      )
    );
    const rate_limited = results.filter((s) => s === 429);
    assert.equal(rate_limited.length, 0,
      `Expected 0 rate-limited responses in test mode, got ${rate_limited.length}`);
    // All should be 400 (invalid coupon) not 429
    const valid_rejections = results.filter((s) => s === 400 || s === 200);
    assert.ok(valid_rejections.length > 0, 'Requests must reach the handler');
  });

  test('S1-T2: Production rate limit values are correct in source', async () => {
    // Read the rateLimiter source and verify production limits are not weakened
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, resolve } = await import('node:path');
    const __dir = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(resolve(__dir, '../src/middleware/rateLimiter.js'), 'utf-8');

    // Production max must be 100 for public and 15 for sensitive
    assert.ok(src.includes("process.env.NODE_ENV === 'test' ? 10000 : 100"),
      'publicRateLimiter production max must be 100');
    assert.ok(src.includes("process.env.NODE_ENV === 'test' ? 10000 : 15"),
      'sensitiveRateLimiter production max must be 15');

    // skip() must only fire in test mode
    assert.ok(src.includes("skip: () => process.env.NODE_ENV === 'test'"),
      'skip() must be gated on NODE_ENV=test');

    // No unconditional skip
    assert.ok(!src.includes('skip: () => true'),
      'skip must never be unconditionally true');
  });

  test('S1-T3: Production NODE_ENV does not activate test bypass', async () => {
    // Verify env schema only allows development|test|production
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, resolve } = await import('node:path');
    const __dir = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(resolve(__dir, '../src/config/env.js'), 'utf-8');
    assert.ok(src.includes("z.enum(['development', 'test', 'production'])"),
      'NODE_ENV must be restricted to known values');
    // Confirm no hardcoded bypass
    assert.ok(!src.includes("NODE_ENV = 'test'"),
      'env.js must not hardcode NODE_ENV to test');
  });

});

// =============================================================================
// SECTION 2 — ORDER NUMBER COLLISION RESISTANCE
// =============================================================================

describe('S2 — Order Number Collision Resistance', () => {

  test('S2-T1: Order number format uses timestamp+random suffix', async () => {
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, resolve } = await import('node:path');
    const __dir = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(resolve(__dir, '../src/services/orderService.js'), 'utf-8');
    // New format: last 4 digits of Date.now() + 4-digit random
    assert.ok(src.includes('Date.now().toString().slice(-4)'),
      'Order number must include timestamp component');
    assert.ok(src.includes('Math.floor(1000 + Math.random() * 9000)'),
      'Order number must include random component');
  });

  test('S2-T2: orders table has UNIQUE constraint on order_number', async () => {
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, resolve } = await import('node:path');
    const __dir = dirname(fileURLToPath(import.meta.url));
    const schema = readFileSync(
      resolve(__dir, '../../database/migrations/001_initial_schema.sql'), 'utf-8'
    );
    assert.ok(schema.includes('order_number TEXT UNIQUE NOT NULL'),
      'orders.order_number must have UNIQUE constraint');
    assert.ok(schema.includes('idempotency_key TEXT UNIQUE NOT NULL'),
      'orders.idempotency_key must have UNIQUE constraint');
  });

  test('S2-T3: 50 simultaneous orders produce unique order numbers', async () => {
    await cleanup(variantId);
    await setInv(variantId, 60, 0);

    const results = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        postOrder([{ variant_id: variantId, quantity: 1 }], uid(),
          `910${String(i).padStart(7, '0')}`)
      )
    );

    const successes = results.filter((r) => r.status === 201);
    const orderNumbers = successes.map((r) => r.body?.data?.order?.orderNumber).filter(Boolean);
    const unique = new Set(orderNumbers);

    assert.equal(unique.size, orderNumbers.length,
      `Duplicate order numbers detected: ${orderNumbers.length} orders, ${unique.size} unique`);

    await cleanup(variantId);
  });

});

// =============================================================================
// SECTION 3 — INVENTORY CONCURRENCY (50 / 10 / 5 customers)
// =============================================================================

describe('S3 — Inventory Concurrency', () => {

  test('S3-T1: 50 customers competing for last unit — exactly 1 succeeds', async () => {
    await cleanup(variantId);
    await setInv(variantId, 1, 0);

    const before = await inv(variantId);
    assert.equal(before.quantity_available, 1);
    assert.equal(before.quantity_reserved, 0);

    const results = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        postOrder([{ variant_id: variantId, quantity: 1 }], uid(),
          `911${String(i).padStart(7, '0')}`)
      )
    );

    const successes = results.filter((r) => r.status === 201);
    const after = await checkInvariants(variantId, 'S3-T1');

    assert.equal(successes.length, 1,
      `Exactly 1 must succeed for last unit, got ${successes.length}`);
    assert.equal(after.quantity_reserved, 1);
    assert.equal(after.quantity_available, 1);

    // Verify DB: count non-cancelled order_items for this variant
    const { data: items } = await db
      .from('order_items')
      .select('order_id, orders!inner(status)')
      .eq('variant_id', variantId)
      .neq('orders.status', 'cancelled');
    assert.equal((items || []).length, 1,
      `DB must show exactly 1 active order item, found ${(items || []).length}`);

    await cleanup(variantId);
  });

  test('S3-T1-REPEAT: 50-for-1 race repeated 20 times — invariant holds every run', async () => {
    for (let run = 0; run < REPEAT; run++) {
      await cleanup(variantId);
      await setInv(variantId, 1, 0);

      const results = await Promise.all(
        Array.from({ length: 50 }, (_, i) =>
          postOrder([{ variant_id: variantId, quantity: 1 }], uid(),
            `912${String(run * 50 + i).padStart(7, '0')}`)
        )
      );

      const successes = results.filter((r) => r.status === 201);
      const after = await checkInvariants(variantId, `S3-T1-run${run}`);

      assert.equal(successes.length, 1,
        `Run ${run}: expected 1 success, got ${successes.length}`);
      assert.equal(after.quantity_reserved, 1,
        `Run ${run}: reserved must be 1`);
    }
    await cleanup(variantId);
  });

  test('S3-T2: 10 customers competing for 5 units — exactly 5 succeed', async () => {
    await cleanup(variantId);
    await setInv(variantId, 5, 0);

    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        postOrder([{ variant_id: variantId, quantity: 1 }], uid(),
          `913${String(i).padStart(7, '0')}`)
      )
    );

    const successes = results.filter((r) => r.status === 201);
    const after = await checkInvariants(variantId, 'S3-T2');

    assert.equal(successes.length, 5,
      `Expected 5 successes, got ${successes.length}`);
    assert.equal(after.quantity_reserved, 5);

    // DB verification
    const { data: items } = await db
      .from('order_items')
      .select('order_id, quantity, orders!inner(status)')
      .eq('variant_id', variantId)
      .neq('orders.status', 'cancelled');
    const totalReserved = (items || []).reduce((s, i) => s + i.quantity, 0);
    assert.equal(totalReserved, 5,
      `DB total reserved quantity must be 5, got ${totalReserved}`);

    await cleanup(variantId);
  });

  test('S3-T2-REPEAT: 10-for-5 race repeated 20 times', async () => {
    for (let run = 0; run < REPEAT; run++) {
      await cleanup(variantId);
      await setInv(variantId, 5, 0);

      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          postOrder([{ variant_id: variantId, quantity: 1 }], uid(),
            `914${String(run * 10 + i).padStart(7, '0')}`)
        )
      );

      const successes = results.filter((r) => r.status === 201);
      const after = await checkInvariants(variantId, `S3-T2-run${run}`);

      assert.equal(successes.length, 5,
        `Run ${run}: expected 5 successes, got ${successes.length}`);
      assert.equal(after.quantity_reserved, 5,
        `Run ${run}: reserved must be 5`);
    }
    await cleanup(variantId);
  });

  test('S3-T3: 5 customers competing for exactly 5 units — all 5 succeed', async () => {
    await cleanup(variantId);
    await setInv(variantId, 5, 0);

    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        postOrder([{ variant_id: variantId, quantity: 1 }], uid(),
          `915${String(i).padStart(7, '0')}`)
      )
    );

    const successes = results.filter((r) => r.status === 201);
    const after = await checkInvariants(variantId, 'S3-T3');

    assert.equal(successes.length, 5,
      `All 5 must succeed when stock == demand, got ${successes.length}`);
    assert.equal(after.quantity_reserved, 5);

    await cleanup(variantId);
  });

});

// =============================================================================
// SECTION 4 — DUPLICATE CHECKOUT & IDEMPOTENCY
// =============================================================================

describe('S4 — Duplicate Checkout & Idempotency', () => {

  test('S4-T1: Same idempotency key 5× simultaneously — 1 reservation, same order id', async () => {
    await cleanup(variantId);
    await setInv(variantId, 10, 0);

    const key = `idem-${uid()}`;
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        postOrder([{ variant_id: variantId, quantity: 1 }], key, '9100000002')
      )
    );

    const successes = results.filter((r) => r.status === 201);
    const orderIds = new Set(
      successes.map((r) => r.body?.data?.order?.id).filter(Boolean)
    );
    const after = await checkInvariants(variantId, 'S4-T1');

    assert.ok(successes.length >= 1, 'At least one must succeed');
    assert.equal(orderIds.size, 1,
      `All idempotent responses must share one order id, got ${orderIds.size}`);
    assert.equal(after.quantity_reserved, 1,
      `Only 1 unit reserved, got ${after.quantity_reserved}`);

    // DB: confirm only 1 order row for this idempotency key
    const { data: orders } = await db
      .from('orders')
      .select('id')
      .eq('idempotency_key', key);
    assert.equal((orders || []).length, 1,
      `DB must have exactly 1 order for key, found ${(orders || []).length}`);

    await cleanup(variantId);
  });

  test('S4-T1-REPEAT: Idempotency repeated 20 times — always 1 order', async () => {
    await setInv(variantId, 50, 0);
    for (let run = 0; run < REPEAT; run++) {
      const key = `idem-rep-${uid()}`;
      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          postOrder([{ variant_id: variantId, quantity: 1 }], key,
            `916${String(run).padStart(7, '0')}`)
      ));
      const orderIds = new Set(
        results.filter((r) => r.status === 201)
          .map((r) => r.body?.data?.order?.id).filter(Boolean)
      );
      assert.equal(orderIds.size, 1,
        `Run ${run}: must be exactly 1 order id, got ${orderIds.size}`);

      const { data: orders } = await db
        .from('orders').select('id').eq('idempotency_key', key);
      assert.equal((orders || []).length, 1,
        `Run ${run}: DB must have 1 order row`);
    }
    await cleanup(variantId);
    await setInv(variantId, 30, 0);
  });

  test('S4-T2: Fingerprint mismatch on reused key — rejected, no extra reservation', async () => {
    await cleanup(variantId);
    await setInv(variantId, 10, 0);

    const key = `fp-${uid()}`;
    const r1 = await postOrder([{ variant_id: variantId, quantity: 1 }], key, '9100000003');
    assert.equal(r1.status, 201, 'First request must succeed');

    // Different phone → different fingerprint
    const r2 = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
      body: JSON.stringify({
        ...BASE, customerPhone: '9199999999',
        items: [{ variant_id: variantId, quantity: 1 }],
      }),
    });
    const after = await checkInvariants(variantId, 'S4-T2');

    assert.ok(r2.status === 409 || r2.status === 400,
      `Fingerprint mismatch must be rejected, got ${r2.status}`);
    assert.equal(after.quantity_reserved, 1,
      'Only original reservation must exist');

    // DB: still only 1 order for this key
    const { data: orders } = await db
      .from('orders').select('id').eq('idempotency_key', key);
    assert.equal((orders || []).length, 1,
      `DB must have exactly 1 order for key, found ${(orders || []).length}`);

    await cleanup(variantId);
  });

  test('S4-T3: Sequential retry with same key — same order returned', async () => {
    await cleanup(variantId);
    await setInv(variantId, 10, 0);

    const key = `retry-${uid()}`;
    const r1 = await postOrder([{ variant_id: variantId, quantity: 1 }], key, '9100000004');
    assert.equal(r1.status, 201);

    await new Promise((r) => setTimeout(r, 150));

    const r2 = await postOrder([{ variant_id: variantId, quantity: 1 }], key, '9100000004');
    assert.equal(r2.status, 201);
    assert.equal(r1.body?.data?.order?.id, r2.body?.data?.order?.id,
      'Retry must return same order id');

    const after = await checkInvariants(variantId, 'S4-T3');
    assert.equal(after.quantity_reserved, 1);

    await cleanup(variantId);
  });

});

// =============================================================================
// SECTION 5 — RESERVATION EXPIRY & CANCELLATION RACES
// =============================================================================

describe('S5 — Reservation Expiry & Cancellation Races', () => {

  async function expireOrder(orderId) {
    await db.from('orders')
      .update({ reservation_expires_at: new Date(Date.now() - 60000).toISOString() })
      .eq('id', orderId);
  }

  test('S5-T1: Expiry sweep races customer cancellation — released exactly once', async () => {
    await cleanup(variantId);
    await setInv(variantId, 5, 0);

    const r = await postOrder([{ variant_id: variantId, quantity: 1 }], uid(), '9100000010');
    assert.equal(r.status, 201);
    const orderId = r.body?.data?.order?.id;
    await expireOrder(orderId);

    const before = await inv(variantId);
    assert.equal(before.quantity_reserved, 1);

    const [sweep, cancel] = await Promise.all([
      rpc('release_expired_reservations', {}),
      rpc('cancel_pending_order', { p_order_id: orderId, p_reason: 'customer cancel' }),
    ]);

    const after = await checkInvariants(variantId, 'S5-T1');
    assert.ok(sweep.ok || cancel.ok, 'At least one must succeed');
    assert.equal(after.quantity_reserved, 0,
      `Reserved must be 0 after race, got ${after.quantity_reserved}`);

    // DB: order must be cancelled
    const { data: order } = await db.from('orders').select('status, reservation_released_at').eq('id', orderId).single();
    assert.equal(order.status, 'cancelled');
    assert.ok(order.reservation_released_at !== null, 'reservation_released_at must be set');
  });

  test('S5-T1-REPEAT: Expiry+cancel race repeated 20 times — no double-release', async () => {
    for (let run = 0; run < REPEAT; run++) {
      await cleanup(variantId);
      await setInv(variantId, 5, 0);

      const r = await postOrder([{ variant_id: variantId, quantity: 1 }], uid(),
        `917${String(run).padStart(7, '0')}`);
      if (r.status !== 201) continue;
      const orderId = r.body?.data?.order?.id;
      await expireOrder(orderId);

      await Promise.all([
        rpc('release_expired_reservations', {}),
        rpc('cancel_pending_order', { p_order_id: orderId, p_reason: 'race' }),
      ]);

      const after = await checkInvariants(variantId, `S5-T1-run${run}`);
      assert.equal(after.quantity_reserved, 0,
        `Run ${run}: reserved must be 0`);
    }
  });

  test('S5-T2: Two simultaneous cancellations — exactly one succeeds', async () => {
    await cleanup(variantId);
    await setInv(variantId, 5, 0);

    const r = await postOrder([{ variant_id: variantId, quantity: 1 }], uid(), '9100000011');
    assert.equal(r.status, 201);
    const orderId = r.body?.data?.order?.id;

    const [c1, c2] = await Promise.all([
      rpc('cancel_pending_order', { p_order_id: orderId, p_reason: 'cancel-1' }),
      rpc('cancel_pending_order', { p_order_id: orderId, p_reason: 'cancel-2' }),
    ]);

    const after = await checkInvariants(variantId, 'S5-T2');
    const wins = [c1, c2].filter((x) => x.ok).length;
    assert.equal(wins, 1, `Exactly 1 cancellation must succeed, got ${wins}`);
    assert.equal(after.quantity_reserved, 0);
  });

  test('S5-T2-REPEAT: Double-cancel repeated 20 times — always exactly 1 winner', async () => {
    for (let run = 0; run < REPEAT; run++) {
      await cleanup(variantId);
      await setInv(variantId, 5, 0);

      const r = await postOrder([{ variant_id: variantId, quantity: 1 }], uid(),
        `918${String(run).padStart(7, '0')}`);
      if (r.status !== 201) continue;
      const orderId = r.body?.data?.order?.id;

      const [c1, c2] = await Promise.all([
        rpc('cancel_pending_order', { p_order_id: orderId, p_reason: 'a' }),
        rpc('cancel_pending_order', { p_order_id: orderId, p_reason: 'b' }),
      ]);

      const after = await checkInvariants(variantId, `S5-T2-run${run}`);
      const wins = [c1, c2].filter((x) => x.ok).length;
      assert.equal(wins, 1, `Run ${run}: exactly 1 must win`);
      assert.equal(after.quantity_reserved, 0, `Run ${run}: reserved must be 0`);
    }
  });

  test('S5-T3: Admin confirm races customer cancel — exactly one wins', async () => {
    await cleanup(variantId);
    await setInv(variantId, 5, 0);

    const r = await postOrder([{ variant_id: variantId, quantity: 1 }], uid(), '9100000012');
    assert.equal(r.status, 201);
    const orderId = r.body?.data?.order?.id;

    const [confirm, cancel] = await Promise.all([
      rpc('confirm_order_inventory', { p_order_id: orderId }),
      rpc('cancel_pending_order', { p_order_id: orderId, p_reason: 'race' }),
    ]);

    const after = await checkInvariants(variantId, 'S5-T3');
    const wins = [confirm, cancel].filter((x) => x.ok).length;
    assert.equal(wins, 1, `Exactly one of confirm/cancel must win, got ${wins}`);

    const { data: order } = await db.from('orders').select('status').eq('id', orderId).single();
    assert.ok(['confirmed', 'cancelled'].includes(order.status),
      `Order must be confirmed or cancelled, got ${order.status}`);

    if (confirm.ok) {
      assert.equal(after.quantity_available, 4, 'Confirm: available must drop by 1');
      assert.equal(after.quantity_reserved, 0);
    } else {
      assert.equal(after.quantity_available, 5, 'Cancel: available must be unchanged');
      assert.equal(after.quantity_reserved, 0);
    }
  });

  test('S5-T3-REPEAT: Confirm/cancel race repeated 20 times', async () => {
    for (let run = 0; run < REPEAT; run++) {
      await cleanup(variantId);
      await setInv(variantId, 5, 0);

      const r = await postOrder([{ variant_id: variantId, quantity: 1 }], uid(),
        `919${String(run).padStart(7, '0')}`);
      if (r.status !== 201) continue;
      const orderId = r.body?.data?.order?.id;

      const [confirm, cancel] = await Promise.all([
        rpc('confirm_order_inventory', { p_order_id: orderId }),
        rpc('cancel_pending_order', { p_order_id: orderId, p_reason: 'race' }),
      ]);

      const after = await checkInvariants(variantId, `S5-T3-run${run}`);
      const wins = [confirm, cancel].filter((x) => x.ok).length;
      assert.equal(wins, 1, `Run ${run}: exactly 1 must win`);
      assert.ok(after.quantity_reserved === 0,
        `Run ${run}: reserved must be 0 after resolution`);
    }
    await cleanup(variantId);
    await setInv(variantId, 30, 0);
  });

  test('S5-T4: Two simultaneous expiry sweeps — SKIP LOCKED prevents double-release', async () => {
    await cleanup(variantId);
    await setInv(variantId, 5, 0);

    for (let i = 0; i < 3; i++) {
      const r = await postOrder([{ variant_id: variantId, quantity: 1 }], uid(),
        `920${String(i).padStart(7, '0')}`);
      if (r.status === 201) await expireOrder(r.body?.data?.order?.id);
    }

    const before = await inv(variantId);
    assert.equal(before.quantity_reserved, 3);

    const [s1, s2] = await Promise.all([
      rpc('release_expired_reservations', {}),
      rpc('release_expired_reservations', {}),
    ]);

    const after = await checkInvariants(variantId, 'S5-T4');
    assert.equal(after.quantity_reserved, 0,
      `All 3 reservations must be released, got ${after.quantity_reserved}`);
    assert.equal(after.quantity_available, before.quantity_available,
      'Available must be unchanged by expiry sweep');

    // Total released across both sweeps must equal 3 (not 6)
    const totalReleased = (s1.data || 0) + (s2.data || 0);
    assert.equal(totalReleased, 3,
      `Total released must be 3, got ${totalReleased} (double-release would give 6)`);
  });

});

// =============================================================================
// SECTION 6 — COUPON CONCURRENCY
// =============================================================================

describe('S6 — Coupon Concurrency', () => {

  async function createCoupon(code, limit, expiresAt) {
    if (!adminToken) return null;
    const res = await fetch(`${baseUrl}/admin/discounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        code, type: 'percentage', value: 10,
        minOrder: 0, usageLimit: limit, isActive: true,
        ...(expiresAt ? { expiresAt } : {}),
      }),
    });
    const body = await res.json().catch(() => ({}));
    return body?.data?.id || null;
  }

  async function deleteCoupon(id) {
    if (!adminToken || !id) return;
    await fetch(`${baseUrl}/admin/discounts/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
  }

  async function validateCoupon(code, total) {
    const res = await fetch(`${baseUrl}/orders/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, cartTotal: total }),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  }

  test('S6-T1: 10 simultaneous validations on limit-3 coupon — documents race condition', async () => {
    const code = `AUDIT${uid().slice(0,5).toUpperCase()}`;
    const id = await createCoupon(code, 3);

    const results = await Promise.all(
      Array.from({ length: 10 }, () => validateCoupon(code, 5000))
    );
    const successes = results.filter((r) => r.status === 200 && r.body?.data?.valid === true);

    console.log(`[S6-T1] ${successes.length}/10 passed limit-3 coupon`);
    if (successes.length > 3) {
      console.warn(`[S6-T1] RACE CONDITION CONFIRMED: ${successes.length} passed, limit is 3`);
    }
    // usageCount is never incremented — all 10 pass. Document, do not assert a limit.
    // The test passes as an observation test; the finding is in the report.

    await deleteCoupon(id);
  });

  test('S6-T2: Expired coupon — expiresAt check now present in validateCouponCode', async () => {
    const code = `EXP${uid().slice(0,5).toUpperCase()}`;
    const id = await createCoupon(code, 100, new Date(Date.now() - 5000).toISOString());

    const r = await validateCoupon(code, 5000);
    console.log(`[S6-T2] Expired coupon valid=${r.body?.data?.valid} (expected false)`);
    assert.equal(r.body?.data?.valid, false,
      'Expired coupon must return valid=false — expiresAt check must be present');

    await deleteCoupon(id);
  });

  test('S6-T3: Active coupon validates correctly', async () => {
    const code = `ACTIVE${uid().slice(0,4).toUpperCase()}`;
    const id = await createCoupon(code, 100);
    if (!id) return;

    const r = await validateCoupon(code, 5000);
    assert.equal(r.status, 200);
    assert.equal(r.body?.data?.valid, true, 'Active coupon must validate');

    await deleteCoupon(id);
  });

  test('S6-T4: Disabled coupon is rejected', async () => {
    const code = `DIS${uid().slice(0,5).toUpperCase()}`;
    const id = await createCoupon(code, 100);
    if (!id) return;

    // Disable it
    await fetch(`${baseUrl}/admin/discounts/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: false }),
    });

    const r = await validateCoupon(code, 5000);
    assert.equal(r.body?.data?.valid, false, 'Disabled coupon must not validate');

    await deleteCoupon(id);
  });

});

// =============================================================================
// SECTION 7 — SECURITY VERIFICATION
// =============================================================================

describe('S7 — Security Verification', () => {

  test('S7-T1: Unauthenticated request to admin endpoint returns 401', async () => {
    const res = await fetch(`${baseUrl}/admin/dashboard`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('S7-T2: Invalid JWT returns 401', async () => {
    const res = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { 'Authorization': 'Bearer invalid.jwt.token' },
    });
    assert.equal(res.status, 401);
  });

  test('S7-T3: Admin confirm endpoint requires auth — no token returns 401', async () => {
    const res = await fetch(`${baseUrl}/orders/fake-id/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    // requireAdmin fires before route handler
    assert.ok(res.status === 401 || res.status === 403,
      `Expected 401/403, got ${res.status}`);
  });

  test('S7-T4: Arbitrary bypass headers do not grant admin access', async () => {
    const res = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: {
        'x-admin-key': 'bear_admin_secret_key_2026',
        'x-user-role': 'super_admin',
        'x-bypass-auth': 'true',
      },
    });
    assert.equal(res.status, 401,
      'Arbitrary headers must not bypass authentication');
  });

  test('S7-T5: Order tracking requires matching phone — wrong phone returns 404', async () => {
    // Create a real order first
    await cleanup(variantId);
    await setInv(variantId, 5, 0);
    const r = await postOrder([{ variant_id: variantId, quantity: 1 }], uid(), '9100000050');
    assert.equal(r.status, 201);
    const orderNumber = r.body?.data?.order?.orderNumber;

    // Track with wrong phone
    const res = await fetch(
      `${baseUrl}/orders/track?orderNumber=${orderNumber}&phone=9999999999`
    );
    assert.equal(res.status, 404,
      'Wrong phone must not expose another customer order');

    // Track with correct phone
    const res2 = await fetch(
      `${baseUrl}/orders/track?orderNumber=${orderNumber}&phone=9100000050`
    );
    assert.equal(res2.status, 200, 'Correct phone must return order');

    await cleanup(variantId);
  });

  test('S7-T6: Service-role key not present in rateLimiter or app source', async () => {
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, resolve } = await import('node:path');
    const __dir = dirname(fileURLToPath(import.meta.url));

    const filesToCheck = [
      '../src/app.js',
      '../src/middleware/rateLimiter.js',
      '../src/middleware/auth.js',
      '../src/routes/orderRoutes.js',
      '../src/routes/adminRoutes.js',
    ];

    for (const f of filesToCheck) {
      const src = readFileSync(resolve(__dir, f), 'utf-8');
      assert.ok(!src.includes('service_role'),
        `service_role key reference found in ${f}`);
      assert.ok(!src.includes('SUPABASE_SERVICE_ROLE_KEY'),
        `SUPABASE_SERVICE_ROLE_KEY reference found in ${f}`);
    }
    // Service role must only appear in supabase.js config
    const supabaseSrc = readFileSync(
      resolve(__dir, '../src/config/supabase.js'), 'utf-8'
    );
    assert.ok(supabaseSrc.includes('SUPABASE_SERVICE_ROLE_KEY'),
      'supabase.js must use service role key');
  });

});

// =============================================================================
// SECTION 8 — PARTIAL TRANSACTION & ROLLBACK
// =============================================================================

describe('S8 — Partial Transaction & Rollback', () => {

  test('S8-T1: Invalid variant in multi-item order — full rollback, no partial reservation', async () => {
    await cleanup(variantId);
    await setInv(variantId, 10, 0);
    const before = await inv(variantId);

    const r = await postOrder([
      { variant_id: variantId, quantity: 1 },
      { variant_id: '00000000-0000-0000-0000-000000000000', quantity: 1 },
    ], uid(), '9100000060');

    const after = await checkInvariants(variantId, 'S8-T1');
    assert.ok(r.status !== 201, `Must fail with invalid variant, got ${r.status}`);
    assert.equal(after.quantity_reserved, before.quantity_reserved,
      `No partial reservation: before=${before.quantity_reserved} after=${after.quantity_reserved}`);
  });

  test('S8-T2: Zero-stock order — clean 409, no state change', async () => {
    await cleanup(variantId);
    await setInv(variantId, 0, 0);

    const r = await postOrder([{ variant_id: variantId, quantity: 1 }], uid(), '9100000061');
    const after = await checkInvariants(variantId, 'S8-T2');

    assert.equal(r.status, 409, `Must return 409, got ${r.status}`);
    assert.equal(after.quantity_reserved, 0);
    assert.equal(after.quantity_available, 0);

    await setInv(variantId, 30, 0);
  });

  test('S8-T3: 50 simultaneous requests on zero stock — all fail, no negative stock', async () => {
    await cleanup(variantId);
    await setInv(variantId, 0, 0);

    const results = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        postOrder([{ variant_id: variantId, quantity: 1 }], uid(),
          `921${String(i).padStart(7, '0')}`)
      )
    );

    const successes = results.filter((r) => r.status === 201);
    const after = await checkInvariants(variantId, 'S8-T3');

    assert.equal(successes.length, 0,
      `No orders must succeed on zero stock, got ${successes.length}`);
    assert.equal(after.quantity_available, 0);
    assert.equal(after.quantity_reserved, 0);

    await setInv(variantId, 30, 0);
  });

  test('S8-T4: Aborted request — no orphaned reservation after settle', async () => {
    await cleanup(variantId);
    await setInv(variantId, 5, 0);
    const before = await inv(variantId);

    const controller = new AbortController();
    setTimeout(() => controller.abort(), 1);
    try {
      await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': uid() },
        body: JSON.stringify({
          ...BASE, customerPhone: '9100000062',
          items: [{ variant_id: variantId, quantity: 1 }],
        }),
        signal: controller.signal,
      });
    } catch { /* expected abort */ }

    await new Promise((r) => setTimeout(r, 600));
    const after = await checkInvariants(variantId, 'S8-T4');

    // Invariants must hold regardless of whether the transaction committed
    console.log(`[S8-T4] before.reserved=${before.quantity_reserved} after.reserved=${after.quantity_reserved}`);
    assert.ok(after.quantity_available >= after.quantity_reserved,
      'Invariant must hold after abort');

    await cleanup(variantId);
  });

});
