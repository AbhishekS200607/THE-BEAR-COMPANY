import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
process.env.NODE_ENV = 'test';

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../src/config/supabase.js';
import { getStoredCoupons, saveStoredCoupons } from '../src/services/storePersistence.js';

let server;
let baseUrl;
let superAdminToken;
let testVariantId;
let testVariantSku;

before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
      resolve();
    });
  });

  // Authenticate as Super Admin
  const clientSA = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const { data: authData, error: authErr } = await clientSA.auth.signInWithPassword({
    email: env.TEST_ADMIN_EMAIL,
    password: env.TEST_ADMIN_PASSWORD,
  });
  if (authErr) throw authErr;
  superAdminToken = authData.session.access_token;

  // Find an active product variant
  const { data, error } = await supabaseAdmin
    .from('inventory')
    .select('variant_id, product_variants!inner(sku, products!inner(is_active))')
    .eq('product_variants.products.is_active', true)
    .limit(1)
    .single();
  if (error || !data) throw new Error('No active variants found');
  testVariantId = data.variant_id;
  testVariantSku = data.product_variants.sku;

  // Ensure stock is available
  await supabaseAdmin
    .from('inventory')
    .update({ quantity_available: 20, quantity_reserved: 0, updated_at: new Date().toISOString() })
    .eq('variant_id', testVariantId);
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('Production Readiness Verification', () => {

  test('Fix 1: Coupon usageCount increments on order creation and enforces usage limits', async () => {
    const testCode = `PRODTEST${Date.now().toString().slice(-4)}`;

    // 1. Create a coupon with limit = 1
    const createRes = await fetch(`${baseUrl}/admin/discounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        code: testCode,
        type: 'percentage',
        value: 15,
        minOrder: 100,
        usageLimit: 1,
        isActive: true,
      }),
    });
    assert.strictEqual(createRes.status, 201);
    const createJson = await createRes.json();
    const couponId = createJson.data.id;

    // 2. Validate coupon before use — must be valid
    const valRes1 = await fetch(`${baseUrl}/orders/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: testCode, cartTotal: 2000 }),
    });
    assert.strictEqual(valRes1.status, 200);
    const valJson1 = await valRes1.json();
    assert.strictEqual(valJson1.data.valid, true);

    // 3. Create an order with this coupon
    const orderRes1 = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `coupon-test-1-${Date.now()}`,
      },
      body: JSON.stringify({
        customerName: 'Coupon Tester',
        customerPhone: '9876543210',
        deliveryLine1: 'Test Address 123',
        deliveryCity: 'Mumbai',
        deliveryState: 'Maharashtra',
        deliveryPincode: '400001',
        couponCode: testCode,
        items: [{ variant_id: testVariantId, quantity: 1 }],
      }),
    });
    assert.strictEqual(orderRes1.status, 201);
    const orderJson1 = await orderRes1.json();
    assert.ok(orderJson1.data.order.discount > 0, 'Discount must be applied to order');

    // 4. Check that coupon usageCount has now incremented to 1
    const couponsAfter = getStoredCoupons();
    const usedCoupon = couponsAfter.find(c => c.code === testCode);
    assert.ok(usedCoupon, 'Coupon must exist in storage');
    assert.strictEqual(usedCoupon.usageCount, 1, 'usageCount must be exactly 1 after order');

    // 5. Attempt second validation — MUST BE REJECTED because limit is 1
    const valRes2 = await fetch(`${baseUrl}/orders/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: testCode, cartTotal: 2000 }),
    });
    assert.strictEqual(valRes2.status, 200);
    const valJson2 = await valRes2.json();
    assert.strictEqual(valJson2.data.valid, false, 'Coupon must now be invalid due to usage limit');
    assert.ok(valJson2.data.message.includes('limit has been reached'), `Expected limit message, got: ${valJson2.data.message}`);

    // Clean up coupon
    await fetch(`${baseUrl}/admin/discounts/${couponId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
  });

  test('Fix 2: Admin order cancellation releases reserved inventory atomically (no orphaned stock)', async () => {
    // 1. Reset inventory to known state
    await supabaseAdmin
      .from('inventory')
      .update({ quantity_available: 10, quantity_reserved: 0, updated_at: new Date().toISOString() })
      .eq('variant_id', testVariantId);

    // 2. Place an order for 2 units
    const orderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `admin-cancel-test-${Date.now()}`,
      },
      body: JSON.stringify({
        customerName: 'Cancel Test Customer',
        customerPhone: '9876543211',
        deliveryLine1: 'Test Address 456',
        deliveryCity: 'Bengaluru',
        deliveryState: 'Karnataka',
        deliveryPincode: '560001',
        items: [{ variant_id: testVariantId, quantity: 2 }],
      }),
    });
    assert.strictEqual(orderRes.status, 201);
    const order = (await orderRes.json()).data.order;
    assert.strictEqual(order.status, 'pending_whatsapp');

    // Verify 2 units reserved in DB
    const { data: invDuring } = await supabaseAdmin
      .from('inventory')
      .select('quantity_available, quantity_reserved')
      .eq('variant_id', testVariantId)
      .single();
    assert.strictEqual(invDuring.quantity_reserved, 2, '2 units must be reserved');

    // 3. Admin cancels the order via PATCH /orders/:id/status
    const cancelRes = await fetch(`${baseUrl}/admin/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        status: 'cancelled',
        adminNotes: 'Customer requested cancellation via admin panel',
      }),
    });
    assert.strictEqual(cancelRes.status, 200);
    const cancelJson = await cancelRes.json();
    assert.strictEqual(cancelJson.data.status, 'cancelled');

    // 4. Verify in DB: order is cancelled AND reservation_released_at is set
    const { data: dbOrder } = await supabaseAdmin
      .from('orders')
      .select('status, reservation_released_at')
      .eq('id', order.id)
      .single();
    assert.strictEqual(dbOrder.status, 'cancelled');
    assert.ok(dbOrder.reservation_released_at !== null, 'reservation_released_at must be populated');

    // 5. Verify in DB: quantity_reserved is 0 (inventory released, NOT orphaned!)
    const { data: invAfter } = await supabaseAdmin
      .from('inventory')
      .select('quantity_available, quantity_reserved')
      .eq('variant_id', testVariantId)
      .single();
    assert.strictEqual(invAfter.quantity_reserved, 0, 'Reserved stock must be released back to 0');
    assert.strictEqual(invAfter.quantity_available, 10, 'Available stock must remain 10');
  });

});
