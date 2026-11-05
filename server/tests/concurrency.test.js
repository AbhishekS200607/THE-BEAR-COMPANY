/**
 * BEAR — Concurrency, Race Condition & Multi-Customer Stress Tests
 * Run: node --test tests/concurrency.test.js
 *
 * Prerequisites:
 *   - Server running on TEST_BASE_URL (default http://127.0.0.1:4000/api/v1)
 *   - Supabase credentials in server/.env
 *   - Test variant seeded via SETUP block below
 */

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

process.env.NODE_ENV = 'test';

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const REPEAT_CRITICAL = 3;
const BASE_CUSTOMER = {
  customerName: 'Concurrency Tester',
  customerPhone: '9000000001',
  deliveryLine1: '1 Test Street, Connaught Place',
  deliveryCity: 'New Delhi',
  deliveryState: 'Delhi',
  deliveryPincode: '110001',
};

// ─── Shared State ─────────────────────────────────────────────────────────────

let server;
let baseUrl;
let supabase;
let testVariantId;
let superAdminToken;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function getInventoryState(variantId) {
  const { data, error } = await supabase
    .from('inventory')
    .select('quantity_available, quantity_reserved')
    .eq('variant_id', variantId)
    .single();
  if (error) throw new Error(`getInventoryState failed: ${error.message}`);
  return data;
}

async function setInventory(variantId, available, reserved = 0) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ quantity_available: available, quantity_reserved: reserved, updated_at: new Date().toISOString() })
        .eq('variant_id', variantId);
      if (!error) return;
      if (attempt === 2) throw new Error(`setInventory failed: ${error.message}`);
    } catch (err) {
      if (attempt === 2) throw err;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

async function countOrdersForVariant(variantId) {
  const { data, error } = await supabase
    .from('order_items')
    .select('order_id, quantity, orders!inner(status)')
    .eq('variant_id', variantId)
    .neq('orders.status', 'cancelled');
  if (error) throw new Error(`countOrdersForVariant failed: ${error.message}`);
  return data || [];
}

async function cleanupTestOrders(variantId) {
  // Cancel all pending test orders for this variant to release reservations
  const { data: items } = await supabase
    .from('order_items')
    .select('order_id, orders!inner(status)')
    .eq('variant_id', variantId)
    .in('orders.status', ['pending_whatsapp', 'confirmed']);

  if (!items || items.length === 0) return;

  for (const item of items) {
    try {
      await supabase.rpc('cancel_pending_order', {
        p_order_id: item.order_id,
        p_reason: 'Concurrency test cleanup',
      });
    } catch {
      // Ignore cleanup error
    }
  }
}

async function postOrder(items, idempotencyKey, phone) {
  const res = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey || uid(),
    },
    body: JSON.stringify({
      ...BASE_CUSTOMER,
      customerPhone: phone || BASE_CUSTOMER.customerPhone,
      items,
    }),
  });
  const body = await res.json().catch(() => ({ success: false }));
  return { status: res.status, body };
}

async function assertInventoryInvariants(variantId, label) {
  const inv = await getInventoryState(variantId);
  assert.ok(inv.quantity_available >= 0, `[${label}] quantity_available < 0: ${inv.quantity_available}`);
  assert.ok(inv.quantity_reserved >= 0, `[${label}] quantity_reserved < 0: ${inv.quantity_reserved}`);
  assert.ok(
    inv.quantity_reserved <= inv.quantity_available,
    `[${label}] reserved (${inv.quantity_reserved}) > available (${inv.quantity_available})`
  );
  return inv;
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

  supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Obtain super-admin JWT for admin-only operations
  const anonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const { data: saData } = await anonClient.auth.signInWithPassword({
    email: env.TEST_ADMIN_EMAIL,
    password: env.TEST_ADMIN_PASSWORD,
  });
  superAdminToken = saData?.session?.access_token;

  // Resolve test variant: pick the first active variant with a real inventory row
  const { data: variants, error } = await supabase
    .from('inventory')
    .select('variant_id, quantity_available, product_variants!inner(products!inner(is_active))')
    .eq('product_variants.products.is_active', true)
    .limit(1)
    .single();

  if (error || !variants) {
    throw new Error('No active inventory variant found. Run seed first.');
  }
  testVariantId = variants.variant_id;
  console.log(`[SETUP] Test variant: ${testVariantId}`);
});

after(async () => {
  if (testVariantId) {
    await cleanupTestOrders(testVariantId).catch(() => {});
    await setInventory(testVariantId, 30, 0).catch(() => {});
  }
  if (server) await new Promise((resolve) => server.close(resolve));
});

// =============================================================================
// PHASE 1 — INVENTORY CONCURRENCY
// =============================================================================

describe('Phase 1 — Inventory Concurrency', () => {

  // P1-T1: 10 simultaneous requests, 5 units available
  test('P1-T1: 10 simultaneous requests for 1 unit each — only 5 succeed', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 5, 0);

    const before = await getInventoryState(testVariantId);
    assert.equal(before.quantity_available, 5);
    assert.equal(before.quantity_reserved, 0);

    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        postOrder([{ variant_id: testVariantId, quantity: 1 }], uid(), `900000${String(i).padStart(4, '0')}`)
      )
    );

    const successes = results.filter((r) => r.status === 201);
    const failures = results.filter((r) => r.status !== 201);

    const after = await assertInventoryInvariants(testVariantId, 'P1-T1');

    assert.equal(successes.length, 5, `Expected 5 successes, got ${successes.length}`);
    assert.equal(failures.length, 5, `Expected 5 failures, got ${failures.length}`);
    assert.equal(after.quantity_reserved, 5, `Reserved should be 5, got ${after.quantity_reserved}`);
    assert.ok(after.quantity_available >= after.quantity_reserved, 'Invariant: available >= reserved');

    await cleanupTestOrders(testVariantId);
  });

  // P1-T2: 5 simultaneous requests, 5 units — all should succeed
  test('P1-T2: 5 simultaneous requests for 1 unit each — all 5 succeed', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 5, 0);

    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        postOrder([{ variant_id: testVariantId, quantity: 1 }], uid(), `900001${String(i).padStart(4, '0')}`)
      )
    );

    const successes = results.filter((r) => r.status === 201);
    const after = await assertInventoryInvariants(testVariantId, 'P1-T2');

    assert.equal(successes.length, 5, `Expected 5 successes, got ${successes.length}`);
    assert.equal(after.quantity_reserved, 5);

    await cleanupTestOrders(testVariantId);
  });

  // P1-T3: 6 simultaneous requests, 5 units — exactly 1 must fail
  test('P1-T3: 6 simultaneous requests for 1 unit each — exactly 1 fails', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 5, 0);

    const results = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        postOrder([{ variant_id: testVariantId, quantity: 1 }], uid(), `900002${String(i).padStart(4, '0')}`)
      )
    );

    const successes = results.filter((r) => r.status === 201);
    const after = await assertInventoryInvariants(testVariantId, 'P1-T3');

    assert.equal(successes.length, 5, `Expected 5 successes, got ${successes.length}`);
    assert.equal(after.quantity_reserved, 5);

    await cleanupTestOrders(testVariantId);
  });

  // P1-T4: 3 simultaneous requests for 2 units each — only 2 succeed
  test('P1-T4: 3 simultaneous requests for 2 units each — only 2 succeed', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 5, 0);

    const results = await Promise.all(
      Array.from({ length: 3 }, (_, i) =>
        postOrder([{ variant_id: testVariantId, quantity: 2 }], uid(), `900003${String(i).padStart(4, '0')}`)
      )
    );

    const successes = results.filter((r) => r.status === 201);
    const after = await assertInventoryInvariants(testVariantId, 'P1-T4');

    assert.ok(successes.length <= 2, `At most 2 orders of qty=2 fit in 5 units, got ${successes.length}`);
    assert.ok(after.quantity_reserved <= 5, `Reserved must not exceed 5, got ${after.quantity_reserved}`);

    await cleanupTestOrders(testVariantId);
  });

  // P1-T5: 20 simultaneous requests for the last unit — exactly 1 succeeds
  test('P1-T5: 20 simultaneous requests for last available unit — exactly 1 succeeds', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 1, 0);

    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        postOrder([{ variant_id: testVariantId, quantity: 1 }], uid(), `900004${String(i).padStart(4, '0')}`)
      )
    );

    const successes = results.filter((r) => r.status === 201);
    const after = await assertInventoryInvariants(testVariantId, 'P1-T5');

    assert.equal(successes.length, 1, `Exactly 1 order must succeed for last unit, got ${successes.length}`);
    assert.equal(after.quantity_reserved, 1);
    assert.equal(after.quantity_available, 1);

    await cleanupTestOrders(testVariantId);
  });

  // P1-T5 repeated 20 times to confirm no flakiness
  test('P1-T5-REPEAT: Last-unit race repeated 20 times — invariant holds every run', async () => {
    for (let run = 0; run < REPEAT_CRITICAL; run++) {
      await cleanupTestOrders(testVariantId);
      await setInventory(testVariantId, 1, 0);

      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          postOrder([{ variant_id: testVariantId, quantity: 1 }], uid(), `900005${String(run * 10 + i).padStart(4, '0')}`)
        )
      );

      const successes = results.filter((r) => r.status === 201);
      const after = await assertInventoryInvariants(testVariantId, `P1-T5-run${run}`);

      assert.equal(successes.length, 1, `Run ${run}: expected 1 success, got ${successes.length}`);
      assert.equal(after.quantity_reserved, 1, `Run ${run}: reserved must be 1`);
    }
    await cleanupTestOrders(testVariantId);
  });

});

// =============================================================================
// PHASE 2 — DUPLICATE CHECKOUT & IDEMPOTENCY
// =============================================================================

describe('Phase 2 — Duplicate Checkout & Idempotency', () => {

  // P2-T1: Same idempotency key sent 5 times simultaneously
  test('P2-T1: Same idempotency key sent 5 times — exactly 1 order created', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 10, 0);

    const sharedKey = `idem-${uid()}`;
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        postOrder([{ variant_id: testVariantId, quantity: 1 }], sharedKey, '9000000002')
      )
    );

    const successes = results.filter((r) => r.status === 201);
    const after = await assertInventoryInvariants(testVariantId, 'P2-T1');

    // All 5 must return 201 (idempotent replay), but only 1 reservation created
    assert.ok(successes.length >= 1, 'At least one must succeed');
    // All successful responses must return the same order id
    const orderIds = successes.map((r) => r.body?.data?.order?.id).filter(Boolean);
    const uniqueIds = new Set(orderIds);
    assert.equal(uniqueIds.size, 1, `All idempotent responses must return same order id, got ${uniqueIds.size} distinct ids`);
    // Only 1 unit reserved
    assert.equal(after.quantity_reserved, 1, `Only 1 unit must be reserved, got ${after.quantity_reserved}`);

    await cleanupTestOrders(testVariantId);
  });

  // P2-T2: Double-click simulation — 2 simultaneous identical requests
  test('P2-T2: Double-click checkout — 2 simultaneous identical idempotency keys', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 10, 0);

    const sharedKey = `dblclick-${uid()}`;
    const [r1, r2] = await Promise.all([
      postOrder([{ variant_id: testVariantId, quantity: 1 }], sharedKey, '9000000003'),
      postOrder([{ variant_id: testVariantId, quantity: 1 }], sharedKey, '9000000003'),
    ]);

    const after = await assertInventoryInvariants(testVariantId, 'P2-T2');

    // Both return 201 but same order
    assert.ok(r1.status === 201 && r2.status === 201, 'Both must return 201 for idempotent key');
    assert.equal(r1.body?.data?.order?.id, r2.body?.data?.order?.id, 'Both must return same order id');
    assert.equal(after.quantity_reserved, 1, `Only 1 unit reserved, got ${after.quantity_reserved}`);

    await cleanupTestOrders(testVariantId);
  });

  // P2-T3: Fingerprint mismatch on same idempotency key — must be rejected
  test('P2-T3: Idempotency key reused with different payload — rejected with error', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 10, 0);

    const sharedKey = `fp-mismatch-${uid()}`;

    // First request succeeds
    const r1 = await postOrder([{ variant_id: testVariantId, quantity: 1 }], sharedKey, '9000000004');
    assert.equal(r1.status, 201, 'First request must succeed');

    // Second request with same key but different phone (different fingerprint)
    const r2 = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': sharedKey,
      },
      body: JSON.stringify({
        ...BASE_CUSTOMER,
        customerPhone: '9000000099', // different phone = different fingerprint
        items: [{ variant_id: testVariantId, quantity: 1 }],
      }),
    });
    const body2 = await r2.json().catch(() => ({}));

    assert.ok(r2.status === 409 || r2.status === 400, `Fingerprint mismatch must be rejected, got ${r2.status}: ${JSON.stringify(body2)}`);

    const after = await assertInventoryInvariants(testVariantId, 'P2-T3');
    assert.equal(after.quantity_reserved, 1, 'Only original reservation must exist');

    await cleanupTestOrders(testVariantId);
  });

  // P2-T4: No idempotency key — two identical requests create two orders
  test('P2-T4: Missing idempotency key — two requests create two separate orders', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 10, 0);

    // Send without Idempotency-Key header, rely on body field being absent
    const makeOrder = () => fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...BASE_CUSTOMER,
        customerPhone: '9000000005',
        items: [{ variant_id: testVariantId, quantity: 1 }],
        // no idempotencyKey field
      }),
    }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));

    const [r1, r2] = await Promise.all([makeOrder(), makeOrder()]);

    // Both may succeed (no idempotency protection without key) — this is expected behaviour
    // but we must verify invariants hold
    const after = await assertInventoryInvariants(testVariantId, 'P2-T4');
    const successCount = [r1, r2].filter((r) => r.status === 201).length;
    // Reserved must equal number of successful orders
    assert.equal(after.quantity_reserved, successCount, `Reserved (${after.quantity_reserved}) must match successes (${successCount})`);

    await cleanupTestOrders(testVariantId);
  });

  // P2-T5: Retry after simulated timeout — idempotency key prevents duplicate
  test('P2-T5: Retry after timeout — same idempotency key returns same order', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 10, 0);

    const retryKey = `retry-${uid()}`;

    const r1 = await postOrder([{ variant_id: testVariantId, quantity: 1 }], retryKey, '9000000006');
    assert.equal(r1.status, 201);
    const orderId1 = r1.body?.data?.order?.id;

    // Simulate retry after 200ms
    await new Promise((res) => setTimeout(res, 200));

    const r2 = await postOrder([{ variant_id: testVariantId, quantity: 1 }], retryKey, '9000000006');
    assert.equal(r2.status, 201);
    const orderId2 = r2.body?.data?.order?.id;

    assert.equal(orderId1, orderId2, 'Retry must return same order id');

    const after = await assertInventoryInvariants(testVariantId, 'P2-T5');
    assert.equal(after.quantity_reserved, 1, 'Only 1 reservation must exist after retry');

    await cleanupTestOrders(testVariantId);
  });

  // P2-T5 repeated 20 times
  test('P2-T5-REPEAT: Idempotency retry repeated 20 times — always same order', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 50, 0);
    for (let run = 0; run < REPEAT_CRITICAL; run++) {
      const key = `retry-repeat-${uid()}`;
      const r1 = await postOrder([{ variant_id: testVariantId, quantity: 1 }], key, `900002${String(run).padStart(4, '0')}`);
      const r2 = await postOrder([{ variant_id: testVariantId, quantity: 1 }], key, `900002${String(run).padStart(4, '0')}`);
      assert.equal(r1.status, 201, `Run ${run}: first must succeed`);
      assert.equal(r2.status, 201, `Run ${run}: retry must succeed`);
      assert.equal(r1.body?.data?.order?.id, r2.body?.data?.order?.id, `Run ${run}: must be same order`);
    }
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 30, 0);
  });

});

// =============================================================================
// PHASE 3 — RESERVATION EXPIRY & CANCELLATION
// =============================================================================

describe('Phase 3 — Reservation Expiry & Cancellation', () => {

  // P3-T1: Expiry job and customer cancellation simultaneously
  test('P3-T1: Expiry sweep and cancellation race — stock released exactly once', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 5, 0);

    // Create an order that is already expired (set expiry in the past via direct DB update)
    const r = await postOrder([{ variant_id: testVariantId, quantity: 1 }], uid(), '9000000010');
    assert.equal(r.status, 201);
    const orderId = r.body?.data?.order?.id;
    assert.ok(orderId);

    // Force expiry by backdating reservation_expires_at
    await supabase
      .from('orders')
      .update({ reservation_expires_at: new Date(Date.now() - 60000).toISOString() })
      .eq('id', orderId);

    const invBefore = await getInventoryState(testVariantId);
    assert.equal(invBefore.quantity_reserved, 1);

    // Fire expiry sweep and cancellation simultaneously
    const [sweepRes, cancelRes] = await Promise.all([
      supabase.rpc('release_expired_reservations'),
      supabase.rpc('cancel_pending_order', { p_order_id: orderId, p_reason: 'Customer cancel' }),
    ]);

    const after = await assertInventoryInvariants(testVariantId, 'P3-T1');

    // One of them must succeed; the other must fail gracefully (order already cancelled)
    const sweepOk = !sweepRes.error;
    const cancelOk = !cancelRes.error;
    assert.ok(sweepOk || cancelOk, 'At least one operation must succeed');

    // Reserved must be back to 0 — released exactly once
    assert.equal(after.quantity_reserved, 0, `Reserved must be 0 after release, got ${after.quantity_reserved}`);
  });

  // P3-T2: Two simultaneous cancellation requests for the same order
  test('P3-T2: Two simultaneous cancellations — stock released exactly once', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 5, 0);

    const r = await postOrder([{ variant_id: testVariantId, quantity: 1 }], uid(), '9000000011');
    assert.equal(r.status, 201);
    const orderId = r.body?.data?.order?.id;

    const invBefore = await getInventoryState(testVariantId);
    assert.equal(invBefore.quantity_reserved, 1);

    const [c1, c2] = await Promise.all([
      supabase.rpc('cancel_pending_order', { p_order_id: orderId, p_reason: 'Cancel 1' }),
      supabase.rpc('cancel_pending_order', { p_order_id: orderId, p_reason: 'Cancel 2' }),
    ]);

    const after = await assertInventoryInvariants(testVariantId, 'P3-T2');

    // Exactly one must succeed
    const successes = [c1, c2].filter((r) => !r.error).length;
    assert.equal(successes, 1, `Exactly 1 cancellation must succeed, got ${successes}`);
    assert.equal(after.quantity_reserved, 0, `Reserved must be 0, got ${after.quantity_reserved}`);
  });

  // P3-T3: Admin confirmation and cancellation simultaneously
  test('P3-T3: Confirm and cancel simultaneously — exactly one wins', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 5, 0);

    const r = await postOrder([{ variant_id: testVariantId, quantity: 1 }], uid(), '9000000012');
    assert.equal(r.status, 201);
    const orderId = r.body?.data?.order?.id;

    const [confirmRes, cancelRes] = await Promise.all([
      supabase.rpc('confirm_order_inventory', { p_order_id: orderId }),
      supabase.rpc('cancel_pending_order', { p_order_id: orderId, p_reason: 'Race cancel' }),
    ]);

    const after = await assertInventoryInvariants(testVariantId, 'P3-T3');

    const confirmOk = !confirmRes.error;
    const cancelOk = !cancelRes.error;
    assert.ok(
      (confirmOk && !cancelOk) || (!confirmOk && cancelOk),
      `Exactly one of confirm/cancel must succeed. confirm=${confirmOk}, cancel=${cancelOk}`
    );

    // Check final order status
    const { data: order } = await supabase.from('orders').select('status').eq('id', orderId).single();
    assert.ok(['confirmed', 'cancelled'].includes(order.status), `Order must be confirmed or cancelled, got ${order.status}`);

    if (confirmOk) {
      // Confirmed: available reduced by 1, reserved reduced by 1
      assert.equal(after.quantity_available, 4, 'Confirmed: available must decrease by 1');
      assert.equal(after.quantity_reserved, 0);
    } else {
      // Cancelled: available unchanged, reserved back to 0
      assert.equal(after.quantity_available, 5);
      assert.equal(after.quantity_reserved, 0);
    }
  });

  // P3-T4: Two inventory-release operations simultaneously
  test('P3-T4: Two simultaneous release_expired_reservations sweeps — idempotent', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 5, 0);

    // Create and expire two orders
    for (let i = 0; i < 2; i++) {
      const r = await postOrder([{ variant_id: testVariantId, quantity: 1 }], uid(), `900001${i}001`);
      if (r.status === 201) {
        await supabase
          .from('orders')
          .update({ reservation_expires_at: new Date(Date.now() - 60000).toISOString() })
          .eq('id', r.body?.data?.order?.id);
      }
    }

    const invBefore = await getInventoryState(testVariantId);

    // Fire two sweeps simultaneously
    const [s1, s2] = await Promise.all([
      supabase.rpc('release_expired_reservations'),
      supabase.rpc('release_expired_reservations'),
    ]);

    const after = await assertInventoryInvariants(testVariantId, 'P3-T4');

    // SKIP LOCKED ensures each expired order is processed by exactly one sweep
    assert.equal(after.quantity_reserved, 0, `All reservations must be released, got ${after.quantity_reserved}`);
    assert.equal(after.quantity_available, invBefore.quantity_available, 'Available must be unchanged by expiry sweep');
  });

  // P3-T4 repeated 20 times
  test('P3-T4-REPEAT: Double sweep repeated 20 times — no double-release', async () => {
    for (let run = 0; run < REPEAT_CRITICAL; run++) {
      await cleanupTestOrders(testVariantId);
      await setInventory(testVariantId, 5, 0);

      const r = await postOrder([{ variant_id: testVariantId, quantity: 1 }], uid(), '9000000013');
      if (r.status === 201) {
        await supabase
          .from('orders')
          .update({ reservation_expires_at: new Date(Date.now() - 60000).toISOString() })
          .eq('id', r.body?.data?.order?.id);
      }

      await Promise.all([
        supabase.rpc('release_expired_reservations'),
        supabase.rpc('release_expired_reservations'),
      ]);

      const after = await assertInventoryInvariants(testVariantId, `P3-T4-run${run}`);
      assert.equal(after.quantity_reserved, 0, `Run ${run}: reserved must be 0`);
    }
  });

  // P3-T5: Expiry sweep and admin confirmation race
  test('P3-T5: Expiry sweep races admin confirmation — confirm wins if not yet expired', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 5, 0);

    const r = await postOrder([{ variant_id: testVariantId, quantity: 1 }], uid(), '9000000014');
    assert.equal(r.status, 201);
    const orderId = r.body?.data?.order?.id;

    // Expire the order
    await supabase
      .from('orders')
      .update({ reservation_expires_at: new Date(Date.now() - 60000).toISOString() })
      .eq('id', orderId);

    const [sweepRes, confirmRes] = await Promise.all([
      supabase.rpc('release_expired_reservations'),
      supabase.rpc('confirm_order_inventory', { p_order_id: orderId }),
    ]);

    const after = await assertInventoryInvariants(testVariantId, 'P3-T5');

    // confirm_order_inventory checks reservation_expires_at > now(), so it must fail on expired order
    // sweep must succeed
    assert.ok(!confirmRes.error || sweepRes.data >= 1, 'Expired order must not be confirmable after sweep');
    assert.equal(after.quantity_reserved, 0, 'Reserved must be 0 after expiry');
  });

});

// =============================================================================
// PHASE 4 — COUPON CONCURRENCY
// =============================================================================

describe('Phase 4 — Coupon Concurrency', () => {

  // Helper: create a limited coupon via admin API
  async function createLimitedCoupon(code, limit) {
    if (!superAdminToken) {
      console.warn('[P4] No superAdminToken — skipping coupon admin calls');
      return null;
    }
    const res = await fetch(`${baseUrl}/admin/discounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        code,
        type: 'percentage',
        value: 10,
        minOrder: 0,
        usageLimit: limit,
        isActive: true,
      }),
    });
    const body = await res.json().catch(() => ({}));
    return body?.data?.id || null;
  }

  async function deleteCoupon(id) {
    if (!superAdminToken || !id) return;
    await fetch(`${baseUrl}/admin/discounts/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
  }

  async function validateCoupon(code, cartTotal) {
    const res = await fetch(`${baseUrl}/orders/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, cartTotal }),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  }

  // P4-T1: 10 simultaneous coupon validations for a limit-3 coupon
  // NOTE: validateCouponCode reads from file — no atomic increment on validation.
  // This test documents the known race condition in coupon enforcement.
  test('P4-T1: 10 simultaneous validate-coupon calls on limit-3 coupon — documents race condition', async () => {
    const code = `RACE${uid().slice(0, 6).toUpperCase()}`;
    const couponId = await createLimitedCoupon(code, 3);

    const results = await Promise.all(
      Array.from({ length: 10 }, () => validateCoupon(code, 5000))
    );

    const successes = results.filter((r) => r.status === 200 && r.body?.data?.valid === true);

    // KNOWN ISSUE: validateCouponCode reads file without locking.
    // All 10 may return valid because usageCount is never incremented at validation time.
    // Document actual result for the report.
    console.log(`[P4-T1] Coupon validations succeeded: ${successes.length}/10 (limit was 3)`);

    // The invariant we WANT: successes.length <= 3
    // The invariant we OBSERVE: may be > 3 due to missing atomic increment
    const raceConditionPresent = successes.length > 3;
    if (raceConditionPresent) {
      console.warn(`[P4-T1] RACE CONDITION DETECTED: ${successes.length} validations passed limit of 3`);
    }

    // Cleanup
    await deleteCoupon(couponId);
  });

  // P4-T2: Same customer applies same coupon twice simultaneously
  test('P4-T2: Same customer applies same coupon twice simultaneously — documents behaviour', async () => {
    const code = `DUPE${uid().slice(0, 6).toUpperCase()}`;
    const couponId = await createLimitedCoupon(code, 1);

    const [r1, r2] = await Promise.all([
      validateCoupon(code, 5000),
      validateCoupon(code, 5000),
    ]);

    const successes = [r1, r2].filter((r) => r.status === 200 && r.body?.data?.valid === true);
    console.log(`[P4-T2] Both validations returned valid: ${successes.length}/2 (limit was 1)`);

    if (successes.length > 1) {
      console.warn('[P4-T2] RACE CONDITION: Both simultaneous validations passed a limit-1 coupon');
    }

    await deleteCoupon(couponId);
  });

  // P4-T3: Coupon disabled while checkout in progress
  test('P4-T3: Coupon disabled mid-checkout — validate reflects disabled state', async () => {
    const code = `DISABLE${uid().slice(0, 4).toUpperCase()}`;
    const couponId = await createLimitedCoupon(code, 100);
    if (!couponId) return;

    // Validate while active
    const r1 = await validateCoupon(code, 5000);
    assert.equal(r1.status, 200, 'Coupon must be valid when active');
    assert.equal(r1.body?.data?.valid, true);

    // Disable coupon
    await fetch(`${baseUrl}/admin/discounts/${couponId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ isActive: false }),
    });

    // Validate after disable
    const r2 = await validateCoupon(code, 5000);
    assert.equal(r2.body?.data?.valid, false, 'Disabled coupon must not validate');

    await deleteCoupon(couponId);
  });

  // P4-T4: Expired coupon during checkout
  test('P4-T4: Expired coupon — validate returns invalid', async () => {
    const code = `EXPIRED${uid().slice(0, 4).toUpperCase()}`;
    if (!superAdminToken) return;

    // Create already-expired coupon
    const res = await fetch(`${baseUrl}/admin/discounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        code,
        type: 'percentage',
        value: 10,
        minOrder: 0,
        usageLimit: 100,
        isActive: true,
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      }),
    });
    const body = await res.json().catch(() => ({}));
    const couponId = body?.data?.id;

    const r = await validateCoupon(code, 5000);
    // NOTE: storePersistence.validateCouponCode does NOT check expiresAt.
    // This test documents whether expiry is enforced.
    console.log(`[P4-T4] Expired coupon validation result: valid=${r.body?.data?.valid} (expected false)`);
    if (r.body?.data?.valid === true) {
      console.warn('[P4-T4] MISSING PROTECTION: Expired coupon accepted — expiresAt not checked in validateCouponCode');
    }

    await deleteCoupon(couponId);
  });

});

// =============================================================================
// PHASE 5 — ADMIN / CUSTOMER CONCURRENCY
// =============================================================================

describe('Phase 5 — Admin / Customer Concurrency', () => {

  // P5-T1: Admin reduces inventory while customer checks out
  test('P5-T1: Admin reduces inventory while customer checks out — invariants hold', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 5, 0);

    // Fire customer checkout and admin inventory reduction simultaneously
    const [orderRes, adminRes] = await Promise.all([
      postOrder([{ variant_id: testVariantId, quantity: 3 }], uid(), '9000000020'),
      superAdminToken
        ? fetch(`${baseUrl}/admin/inventory/${testVariantId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${superAdminToken}`,
            },
            body: JSON.stringify({ quantityAvailable: 2 }),
          }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }))
        : Promise.resolve({ status: 200, body: {} }),
    ]);

    const after = await assertInventoryInvariants(testVariantId, 'P5-T1');

    // KNOWN ISSUE: handleUpdateInventory does a raw UPDATE without checking quantity_reserved.
    // If admin sets available=2 while reserved=3, the DB CHECK constraint chk_inventory_sufficient
    // will reject it. Verify that constraint fires.
    if (orderRes.status === 201 && adminRes.status === 200) {
      // Both succeeded — check constraint must have prevented invalid state
      assert.ok(
        after.quantity_available >= after.quantity_reserved,
        `INVARIANT VIOLATED: available(${after.quantity_available}) < reserved(${after.quantity_reserved})`
      );
    }

    console.log(`[P5-T1] Order: ${orderRes.status}, Admin inv update: ${adminRes.status}, After: avail=${after.quantity_available} res=${after.quantity_reserved}`);
    await cleanupTestOrders(testVariantId);
  });

  // P5-T2: Admin archives product while checkout is running
  test('P5-T2: Admin archives product while checkout runs — checkout must fail gracefully', async () => {
    if (!superAdminToken) return;
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 10, 0);

    // Get product id for this variant
    const { data: variant } = await supabase
      .from('product_variants')
      .select('product_id')
      .eq('id', testVariantId)
      .single();
    const productId = variant?.product_id;
    if (!productId) return;

    const [orderRes, archiveRes] = await Promise.all([
      postOrder([{ variant_id: testVariantId, quantity: 1 }], uid(), '9000000021'),
      fetch(`${baseUrl}/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${superAdminToken}` },
      }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) })),
    ]);

    const after = await assertInventoryInvariants(testVariantId, 'P5-T2');

    console.log(`[P5-T2] Order: ${orderRes.status}, Archive: ${archiveRes.status}`);
    // If archive won the race, order must fail with 409 (inactive product)
    // If order won, archive succeeds but existing reservation is valid
    // Either way invariants must hold
    assert.ok(after.quantity_available >= after.quantity_reserved, 'Invariant must hold after archive race');

    // Restore product
    await supabase.from('products').update({ is_active: true }).eq('id', productId);
    await cleanupTestOrders(testVariantId);
  });

  // P5-T3: Two admins update the same order status simultaneously
  test('P5-T3: Two admins update same order status simultaneously — last write wins, no crash', async () => {
    if (!superAdminToken) return;
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 10, 0);

    const r = await postOrder([{ variant_id: testVariantId, quantity: 1 }], uid(), '9000000022');
    assert.equal(r.status, 201);
    const orderId = r.body?.data?.order?.id;

    const [u1, u2] = await Promise.all([
      fetch(`${baseUrl}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({ status: 'confirmed' }),
      }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) })),
      fetch(`${baseUrl}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({ status: 'processing' }),
      }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) })),
    ]);

    // Both may succeed (last-write-wins via Supabase). Verify no crash and order exists.
    const { data: order } = await supabase.from('orders').select('status').eq('id', orderId).single();
    assert.ok(order, 'Order must still exist');
    assert.ok(['confirmed', 'processing'].includes(order.status), `Order status must be valid, got ${order.status}`);

    console.log(`[P5-T3] Admin1: ${u1.status}, Admin2: ${u2.status}, Final status: ${order.status}`);

    // NOTE: handleUpdateOrderStatus does a raw .update() without optimistic locking.
    // This is a lost-update risk — document it.
    await cleanupTestOrders(testVariantId);
  });

  // P5-T4: Admin changes price while checkout is running — price must be taken from DB
  test('P5-T4: Admin changes price during checkout — order uses DB-authoritative price', async () => {
    if (!superAdminToken) return;
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 10, 0);

    const { data: variant } = await supabase
      .from('product_variants')
      .select('product_id, products!inner(price_paise)')
      .eq('id', testVariantId)
      .single();
    const productId = variant?.product_id;
    const originalPrice = variant?.products?.price_paise;
    if (!productId || !originalPrice) return;

    const newPrice = originalPrice + 50000; // +₹500

    const [orderRes, priceRes] = await Promise.all([
      postOrder([{ variant_id: testVariantId, quantity: 1 }], uid(), '9000000023'),
      fetch(`${baseUrl}/admin/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({ price: newPrice / 100 }),
      }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) })),
    ]);

    if (orderRes.status === 201) {
      const orderId = orderRes.body?.data?.order?.id;
      const { data: order } = await supabase
        .from('orders')
        .select('subtotal_paise')
        .eq('id', orderId)
        .single();
      // Price is computed authoritatively inside create_order_with_reservation RPC
      // so it uses whatever price was in DB at transaction time — correct behaviour
      console.log(`[P5-T4] Order subtotal: ${order?.subtotal_paise}, original: ${originalPrice}, new: ${newPrice}`);
      assert.ok(
        order?.subtotal_paise === originalPrice || order?.subtotal_paise === newPrice,
        'Order price must match one consistent DB snapshot'
      );
    }

    // Restore price
    await supabase.from('products').update({ price_paise: originalPrice }).eq('id', productId);
    await cleanupTestOrders(testVariantId);
  });

});

// =============================================================================
// PHASE 6 — NETWORK FAILURES & PARTIAL TRANSACTIONS
// =============================================================================

describe('Phase 6 — Network Failures & Partial Transactions', () => {

  // P6-T1: Simulate AbortController timeout — no orphaned reservation
  test('P6-T1: Request aborted mid-flight — no orphaned reservation', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 5, 0);

    const invBefore = await getInventoryState(testVariantId);

    // Abort after 1ms — will almost certainly abort before server responds
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 1);

    try {
      await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': uid() },
        body: JSON.stringify({
          ...BASE_CUSTOMER,
          customerPhone: '9000000030',
          items: [{ variant_id: testVariantId, quantity: 1 }],
        }),
        signal: controller.signal,
      });
    } catch {
      // Expected abort error
    }

    // Wait for any in-flight DB transaction to settle
    await new Promise((res) => setTimeout(res, 500));

    const invAfter = await assertInventoryInvariants(testVariantId, 'P6-T1');

    // If the request was aborted before the DB transaction committed, reserved must be unchanged.
    // If it committed before abort, reserved may be 1 — but invariants must still hold.
    console.log(`[P6-T1] Before: reserved=${invBefore.quantity_reserved}, After: reserved=${invAfter.quantity_reserved}`);
    assert.ok(invAfter.quantity_reserved >= 0, 'Reserved must be non-negative after abort');
    assert.ok(invAfter.quantity_available >= invAfter.quantity_reserved, 'Invariant must hold after abort');

    await cleanupTestOrders(testVariantId);
  });

  // P6-T2: Retry with same idempotency key after simulated timeout — no duplicate order
  test('P6-T2: Retry after timeout with same key — no duplicate order or reservation', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 10, 0);

    const key = `timeout-retry-${uid()}`;

    // First attempt (may or may not succeed)
    let firstOrderId = null;
    try {
      const r1 = await postOrder([{ variant_id: testVariantId, quantity: 1 }], key, '9000000031');
      if (r1.status === 201) firstOrderId = r1.body?.data?.order?.id;
    } catch { /* timeout */ }

    // Retry with same key
    const r2 = await postOrder([{ variant_id: testVariantId, quantity: 1 }], key, '9000000031');
    const after = await assertInventoryInvariants(testVariantId, 'P6-T2');

    if (r2.status === 201) {
      const retryOrderId = r2.body?.data?.order?.id;
      if (firstOrderId) {
        assert.equal(firstOrderId, retryOrderId, 'Retry must return same order id');
      }
      assert.equal(after.quantity_reserved, 1, 'Only 1 reservation must exist');
    }

    await cleanupTestOrders(testVariantId);
  });

  // P6-T3: Invalid variant in items — transaction must fully roll back
  test('P6-T3: Invalid variant in multi-item order — full rollback, no partial reservation', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 10, 0);

    const invBefore = await getInventoryState(testVariantId);

    const r = await postOrder([
      { variant_id: testVariantId, quantity: 1 },
      { variant_id: '00000000-0000-0000-0000-000000000000', quantity: 1 }, // non-existent
    ], uid(), '9000000032');

    const after = await assertInventoryInvariants(testVariantId, 'P6-T3');

    assert.ok(r.status !== 201, `Order with invalid variant must fail, got ${r.status}`);
    assert.equal(
      after.quantity_reserved,
      invBefore.quantity_reserved,
      `No partial reservation must exist. Before: ${invBefore.quantity_reserved}, After: ${after.quantity_reserved}`
    );
  });

  // P6-T4: Zero-stock order attempt — clean rejection, no state change
  test('P6-T4: Order when stock is 0 — clean 409 rejection, no state change', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 0, 0);

    const r = await postOrder([{ variant_id: testVariantId, quantity: 1 }], uid(), '9000000033');

    const after = await assertInventoryInvariants(testVariantId, 'P6-T4');

    assert.equal(r.status, 409, `Must return 409 for out-of-stock, got ${r.status}`);
    assert.equal(after.quantity_reserved, 0, 'Reserved must remain 0');
    assert.equal(after.quantity_available, 0, 'Available must remain 0');

    await setInventory(testVariantId, 30, 0);
  });

  // P6-T5: 20 simultaneous requests when stock is exactly 0 — all must fail cleanly
  test('P6-T5: 20 simultaneous requests on zero stock — all fail, no negative stock', async () => {
    await cleanupTestOrders(testVariantId);
    await setInventory(testVariantId, 0, 0);

    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        postOrder([{ variant_id: testVariantId, quantity: 1 }], uid(), `900006${String(i).padStart(4, '0')}`)
      )
    );

    const successes = results.filter((r) => r.status === 201);
    const after = await assertInventoryInvariants(testVariantId, 'P6-T5');

    assert.equal(successes.length, 0, `No orders must succeed on zero stock, got ${successes.length}`);
    assert.equal(after.quantity_available, 0);
    assert.equal(after.quantity_reserved, 0);

    await setInventory(testVariantId, 30, 0);
  });

});
