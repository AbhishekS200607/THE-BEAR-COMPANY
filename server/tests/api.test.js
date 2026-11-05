import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';

describe('BEAR REST API Server Tests', () => {
  let server;
  let baseUrl;
  let superAdminToken;
  let adminToken;
  let customerToken;
  let clientSA;
  let clientAdm;
  let clientCust;

  before(async () => {
    const app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api/v1`;
        resolve();
      });
    });

    // Obtain real Supabase JWT tokens using isolated clients
    clientSA = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    clientAdm = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    clientCust = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    const [saRes, admRes, custRes] = await Promise.all([
      clientSA.auth.signInWithPassword({
        email: env.TEST_ADMIN_EMAIL,
        password: env.TEST_ADMIN_PASSWORD,
      }),
      clientAdm.auth.signInWithPassword({
        email: env.TEST_MANAGER_EMAIL,
        password: env.TEST_MANAGER_PASSWORD,
      }),
      clientCust.auth.signInWithPassword({
        email: env.TEST_CUSTOMER_EMAIL,
        password: env.TEST_CUSTOMER_PASSWORD,
      }),
    ]);

    superAdminToken = saRes.data?.session?.access_token;
    adminToken = admRes.data?.session?.access_token;
    customerToken = custRes.data?.session?.access_token;

    if (!superAdminToken) throw new Error(`Super admin auth failed: ${saRes.error?.message || 'No token'}`);
    if (!adminToken) throw new Error(`Admin auth failed: ${admRes.error?.message || 'No token'}`);
    if (!customerToken) throw new Error(`Customer auth failed: ${custRes.error?.message || 'No token'}`);
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('GET /health returns healthy status and service name', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.strictEqual(data.status, 'healthy');
    assert.strictEqual(data.service, 'bear-api');
    assert.ok(data.timestamp);
  });

  test('GET unknown route returns 404 with structured JSON error', async () => {
    const res = await fetch(`${baseUrl}/non-existent-endpoint`);
    assert.strictEqual(res.status, 404);

    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.message.includes('not found'));
  });

  test('POST /orders rejects empty items array with 422', async () => {
    const res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [],
        customerName: 'Test Customer',
        customerPhone: '9876543210',
        deliveryLine1: '123 MG Road',
        deliveryCity: 'Bengaluru',
        deliveryState: 'Karnataka',
        deliveryPincode: '560001',
      }),
    });

    assert.strictEqual(res.status, 422);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.message.includes('Validation'));
  });

  test('POST /orders rejects invalid 5-digit PIN code with 422', async () => {
    const res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ variantId: '00000000-0000-0000-0000-000000000001', quantity: 1 }],
        customerName: 'Test Customer',
        customerPhone: '9876543210',
        deliveryLine1: '123 MG Road',
        deliveryCity: 'Bengaluru',
        deliveryState: 'Karnataka',
        deliveryPincode: '56001', // Invalid 5-digit PIN code
      }),
    });

    assert.strictEqual(res.status, 422);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.message.includes('Validation'));
  });

  test('POST /orders rejects negative or 0 quantity with 422', async () => {
    const res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ variantId: '00000000-0000-0000-0000-000000000001', quantity: 0 }],
        customerName: 'Test Customer',
        customerPhone: '9876543210',
        deliveryLine1: '123 MG Road',
        deliveryCity: 'Bengaluru',
        deliveryState: 'Karnataka',
        deliveryPincode: '560001',
      }),
    });

    assert.strictEqual(res.status, 422);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.message.includes('Validation'));
  });

  // ── Security Verification Tests ─────────────────────────────────────────────

  test('Security: No authentication rejects with 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/admin/dashboard`);
    assert.strictEqual(res.status, 401);

    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.message.includes('Authentication required'));
  });

  test('Security: Invalid JWT rejects with 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { 'Authorization': 'Bearer invalid.jwt.token' },
    });
    assert.strictEqual(res.status, 401);

    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  test('Security: Expired or malformed JWT rejects with 401 Unauthorized', async () => {
    const fakeExpiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MTYyMzkwMjJ9.4dc';
    const res = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { 'Authorization': `Bearer ${fakeExpiredToken}` },
    });
    assert.strictEqual(res.status, 401);

    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  test('Security: Customer JWT is rejected with 403 Forbidden', async () => {
    assert.ok(customerToken, 'Customer token must exist for test');
    const res = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { 'Authorization': `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 403);

    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.message.includes('Admin privileges required'));
  });

  test('Security: Admin JWT (role: admin) is allowed with 200 OK', async () => {
    assert.ok(adminToken, 'Admin token must exist for test');
    const res = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  test('Security: Super-admin JWT (role: super_admin) is allowed with 200 OK', async () => {
    assert.ok(superAdminToken, 'Super admin token must exist for test');
    const res = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  test('Security: Browser bundle contains no admin secrets or shared keys', async () => {
    const distPath = path.resolve('..', 'bear-admin', 'dist', 'assets');
    if (!fs.existsSync(distPath)) {
      assert.ok(true, 'Dist not built in test environment, skipping static check');
      return;
    }

    const files = fs.readdirSync(distPath);
    for (const file of files) {
      if (file.endsWith('.js')) {
        const content = fs.readFileSync(path.join(distPath, file), 'utf-8');
        // Ensure service role keys are never present in the client bundle
        if (env.SUPABASE_SERVICE_ROLE_KEY) {
          assert.strictEqual(content.includes(env.SUPABASE_SERVICE_ROLE_KEY), false, `Service role key found in ${file}`);
        }
      }
    }
  });

  test('Security: Direct API calls cannot bypass role verification with arbitrary headers', async () => {
    const res = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: {
        'x-admin-key': 'bear_admin_secret_key_2026',
        'x-user-role': 'super_admin',
        'x-bypass-auth': 'true',
      },
    });
    assert.strictEqual(res.status, 401);
  });

  // ── Stage 2: Contract Alignment Tests ────────────────────────────────────────

  test('Stage 2: Dashboard aggregate calculations & camelCase contract', async () => {
    const res = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.strictEqual(data.success, true);
    const d = data.data;

    // Verify camelCase fields exist
    assert.strictEqual(typeof d.totalRevenue, 'number');
    assert.strictEqual(typeof d.bearRevenue, 'number');
    assert.strictEqual(typeof d.sowRevenue, 'number');
    assert.strictEqual(typeof d.totalOrders, 'number');
    assert.strictEqual(typeof d.pendingWhatsApp, 'number');
    assert.strictEqual(typeof d.confirmed, 'number');
    assert.strictEqual(typeof d.processing, 'number');
    assert.strictEqual(typeof d.shipped, 'number');
    assert.strictEqual(typeof d.delivered, 'number');
    assert.strictEqual(typeof d.cancelled, 'number');
    assert.strictEqual(typeof d.lowStockCount, 'number');
    assert.ok(Array.isArray(d.recentOrders));
  });

  test('Stage 2: Product CRUD — Create, Read, Update, Archive', async () => {
    const testSlug = `audit-hoodie-${Date.now()}`;
    const createPayload = {
      name: 'Audit Heavyweight Hoodie',
      mode: 'bear',
      category: 'Hoodies',
      price: 4999,
      comparePrice: 5999,
      description: '480 GSM French Terry heavyweight construction for audit testing.',
      isPublished: true,
      colours: ['Pitch Black'],
      sizes: ['S', 'M', 'L'],
    };

    // 1. Create Product
    const createRes = await fetch(`${baseUrl}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify(createPayload),
    });
    assert.strictEqual(createRes.status, 201);
    const createJson = await createRes.json();
    assert.strictEqual(createJson.success, true);
    const createdProductId = createJson.data.id;
    assert.ok(createdProductId);

    // 2. Read products catalog
    const listRes = await fetch(`${baseUrl}/admin/products`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(listRes.status, 200);
    const listJson = await listRes.json();
    assert.ok(Array.isArray(listJson.data));
    const found = listJson.data.find(p => p.id === createdProductId);
    assert.ok(found);
    assert.strictEqual(found.name, 'Audit Heavyweight Hoodie');
    assert.strictEqual(found.price, 4999);
    assert.strictEqual(found.comparePrice, 5999);

    // 3. Update Product
    const updateRes = await fetch(`${baseUrl}/admin/products/${createdProductId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        price: 5499,
        isBestseller: true,
      }),
    });
    assert.strictEqual(updateRes.status, 200);

    // 4. Safely Archive Product (Soft Delete)
    const archiveRes = await fetch(`${baseUrl}/admin/products/${createdProductId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(archiveRes.status, 200);

    // Verify it is now unpublished
    const verifyRes = await fetch(`${baseUrl}/admin/products`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    const verifyJson = await verifyRes.json();
    const archivedItem = verifyJson.data.find(p => p.id === createdProductId);
    assert.strictEqual(archivedItem.isPublished, false);
  });

  test('Stage 2: WebP Product Image Upload & Supabase Storage Bucket', async () => {
    // 1. Unauthorized attempt
    const anonRes = await fetch(`${baseUrl}/admin/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data: 'sample', filename: 'test.webp' }),
    });
    assert.strictEqual(anonRes.status, 401);

    // 2. Authorized admin upload with base64 WebP image
    const sampleWebpBase64 = 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoB+AAA/v6n/4k1z/5Fsf+QfP9f538o+R7I6/3+b3+n8AA=';
    const uploadRes = await fetch(`${baseUrl}/admin/upload-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        filename: 'bear-test-tee.webp',
        base64Data: sampleWebpBase64,
      }),
    });
    assert.strictEqual(uploadRes.status, 201);
    const uploadJson = await uploadRes.json();
    assert.strictEqual(uploadJson.success, true);
    assert.ok(uploadJson.data.url.includes('product-images'));
    assert.ok(uploadJson.data.filename.endsWith('.webp'));
    assert.strictEqual(uploadJson.data.contentType, 'image/webp');

    // Clean up created test object from bucket
    const clientAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    await clientAdmin.storage.from('product-images').remove([uploadJson.data.filename]);
  });

  test('Stage 2: Inventory matrix listing and stock adjustment', async () => {
    // 1. Get inventory
    const invRes = await fetch(`${baseUrl}/admin/inventory`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(invRes.status, 200);
    const invJson = await invRes.json();
    assert.ok(Array.isArray(invJson.data));
    assert.ok(invJson.data.length > 0);

    const firstItem = invJson.data[0];
    assert.ok(firstItem.variantId);
    assert.ok(firstItem.productName);
    assert.strictEqual(typeof firstItem.quantityAvailable, 'number');
    assert.strictEqual(typeof firstItem.lowStockThreshold, 'number');

    // 2. Update available stock
    const targetVariantId = firstItem.variantId;
    const newQty = firstItem.quantityAvailable + 5;

    const patchRes = await fetch(`${baseUrl}/admin/inventory/${targetVariantId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        quantityAvailable: newQty,
      }),
    });
    assert.strictEqual(patchRes.status, 200);

    // 3. Reject negative inventory
    const negRes = await fetch(`${baseUrl}/admin/inventory/${targetVariantId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        quantityAvailable: -10,
      }),
    });
    assert.strictEqual(negRes.status, 422);

    // Revert back
    await fetch(`${baseUrl}/admin/inventory/${targetVariantId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ quantityAvailable: firstItem.quantityAvailable }),
    });
  });

  test('Stage 2: Bulk import inventory via SKU or variantId with audit log', async () => {
    const invRes = await fetch(`${baseUrl}/admin/inventory`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(invRes.status, 200);
    const invJson = await invRes.json();
    const item = invJson.data[0];
    assert.ok(item.sku);

    const newQty = item.quantityAvailable + 2;
    const importRes = await fetch(`${baseUrl}/admin/inventory/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        items: [
          { sku: item.sku, quantityAvailable: newQty, lowStockThreshold: 5 },
          { sku: 'NON_EXISTENT_SKU_TEST_123', quantityAvailable: 10 },
        ],
      }),
    });
    assert.strictEqual(importRes.status, 200);
    const importJson = await importRes.json();
    assert.strictEqual(importJson.data.updatedCount, 1);
    assert.strictEqual(importJson.data.errorCount, 1);
    assert.strictEqual(importJson.data.results[0].sku, item.sku);

    // Revert back
    await fetch(`${baseUrl}/admin/inventory/${item.variantId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ quantityAvailable: item.quantityAvailable }),
    });
  });

  test('Stage 2: Customer CRM listing and support notes update', async () => {
    const custRes = await fetch(`${baseUrl}/admin/customers`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(custRes.status, 200);
    const custJson = await custRes.json();
    assert.ok(Array.isArray(custJson.data));

    const targetCustomer = custJson.data.find(c => c.email === 'customer@example.com');
    assert.ok(targetCustomer, 'Test customer must exist in customer CRM');
    assert.strictEqual(targetCustomer.name, 'Test Customer');

    // Update notes
    const updateNotesRes = await fetch(`${baseUrl}/admin/customers/${targetCustomer.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        notes: 'VIP Customer. Requested priority delivery.',
      }),
    });
    assert.strictEqual(updateNotesRes.status, 200);
  });

  // ── Stage 3: Complete Missing CRUD Tests ────────────────────────────────────

  test('Stage 3: Categories CRUD against Supabase public.categories', async () => {
    const testCatName = `Compression Gear ${Date.now().toString().slice(-4)}`;
    // 1. Create Category
    const createRes = await fetch(`${baseUrl}/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        name: testCatName,
        mode: 'bear',
        displayOrder: 95,
      }),
    });
    assert.strictEqual(createRes.status, 201);
    const createJson = await createRes.json();
    assert.strictEqual(createJson.success, true);
    const catId = createJson.data.id;
    assert.ok(catId);

    // 2. Read Categories
    const listRes = await fetch(`${baseUrl}/admin/categories`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(listRes.status, 200);
    const listJson = await listRes.json();
    const createdCat = listJson.data.find(c => c.id === catId);
    assert.ok(createdCat);
    assert.strictEqual(createdCat.name, testCatName);

    // 3. Update Category
    const patchRes = await fetch(`${baseUrl}/admin/categories/${catId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        name: 'Compression Gear Pro',
        displayOrder: 96,
      }),
    });
    assert.strictEqual(patchRes.status, 200);

    // 4. Delete Category
    const delRes = await fetch(`${baseUrl}/admin/categories/${catId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(delRes.status, 200);

    // Verify deleted
    const verifyRes = await fetch(`${baseUrl}/admin/categories`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    const verifyJson = await verifyRes.json();
    assert.strictEqual(verifyJson.data.some(c => c.id === catId), false);
  });

  test('Stage 3: Discounts & Coupons CRUD with persistent storage', async () => {
    const couponCode = `TEST${Date.now().toString().slice(-4)}`;

    // 1. Create Coupon
    const createRes = await fetch(`${baseUrl}/admin/discounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        code: couponCode,
        type: 'percentage',
        value: 15,
        minOrder: 1499,
        usageLimit: 50,
        isActive: true,
      }),
    });
    assert.strictEqual(createRes.status, 201);
    const createJson = await createRes.json();
    const couponId = createJson.data.id;
    assert.ok(couponId);
    assert.strictEqual(createJson.data.code, couponCode);

    // 2. Read Coupons
    const listRes = await fetch(`${baseUrl}/admin/discounts`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(listRes.status, 200);
    const listJson = await listRes.json();
    assert.ok(listJson.data.some(c => c.code === couponCode));

    // 3. Toggle Coupon
    const toggleRes = await fetch(`${baseUrl}/admin/discounts/${couponId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ isActive: false }),
    });
    assert.strictEqual(toggleRes.status, 200);
    const toggleJson = await toggleRes.json();
    assert.strictEqual(toggleJson.data.isActive, false);

    // 4. Delete Coupon
    const delRes = await fetch(`${baseUrl}/admin/discounts/${couponId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(delRes.status, 200);
  });

  test('Stage 3: Store Settings & System Invariants', async () => {
    // 1. Get Settings
    const getRes = await fetch(`${baseUrl}/admin/settings`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(getRes.status, 200);
    const getJson = await getRes.json();
    assert.strictEqual(getJson.data.whatsappNumber, '919605210198');
    assert.strictEqual(getJson.data.deliveryFee, 0);

    // 2. Save Settings
    const putRes = await fetch(`${baseUrl}/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ storeName: 'BEAR Performance Official' }),
    });
    assert.strictEqual(putRes.status, 200);
    const putJson = await putRes.json();
    assert.strictEqual(putJson.data.storeName, 'BEAR Performance Official');
  });

  test('Stage 3: Staff & Immutable Audit Logs', async () => {
    // 1. Get Staff & Logs
    const staffRes = await fetch(`${baseUrl}/admin/staff`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(staffRes.status, 200);
    const staffJson = await staffRes.json();
    assert.ok(Array.isArray(staffJson.data.staff));
    assert.ok(Array.isArray(staffJson.data.logs));

    // Must find BEAR Super Admin
    const superAdminStaff = staffJson.data.staff.find(s => s.email === 'admin@bear.in');
    assert.ok(superAdminStaff);
    assert.strictEqual(superAdminStaff.role, 'Super Admin');

    // 2. Get Audit Logs standalone
    const logsRes = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(logsRes.status, 200);
    const logsJson = await logsRes.json();
    assert.ok(Array.isArray(logsJson.data));
    assert.ok(logsJson.data.length > 0);
  });

  test('Stage 3: Dynamic Real-time Notifications Feed', async () => {
    const notifRes = await fetch(`${baseUrl}/admin/notifications`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(notifRes.status, 200);
    const notifJson = await notifRes.json();
    assert.ok(Array.isArray(notifJson.data));

    // Mark as read
    const markRes = await fetch(`${baseUrl}/admin/notifications/mark-read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    assert.strictEqual(markRes.status, 200);
  });

  test('Customer Address CRUD — Create, Read, Update (PUT), Delete', async () => {
    // 1. Create Address
    const cToken = (await clientCust.auth.signInWithPassword({
      email: env.TEST_CUSTOMER_EMAIL,
      password: env.TEST_CUSTOMER_PASSWORD,
    })).data?.session?.access_token || customerToken;

    const addRes = await fetch(`${baseUrl}/customer/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cToken}`,
      },
      body: JSON.stringify({
        label: 'Home',
        fullName: 'Test Customer',
        phoneNumber: '9876543210',
        line1: '123 Koramangala 4th Block',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
        isDefault: true,
      }),
    });
    assert.strictEqual(addRes.status, 201);
    const addJson = await addRes.json();
    assert.ok(addJson.data.id);
    const addressId = addJson.data.id;

    // 2. Read Addresses
    const listRes = await fetch(`${baseUrl}/customer/addresses`, {
      headers: { 'Authorization': `Bearer ${cToken}` },
    });
    assert.strictEqual(listRes.status, 200);
    const listJson = await listRes.json();
    assert.ok(listJson.data.some((a) => a.id === addressId));

    // 3. Update Address via PUT
    const updateRes = await fetch(`${baseUrl}/customer/addresses/${addressId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cToken}`,
      },
      body: JSON.stringify({
        label: 'Office',
        line1: '456 Indiranagar 100ft Rd',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
      }),
    });
    assert.strictEqual(updateRes.status, 200);
    const updateJson = await updateRes.json();
    assert.strictEqual(updateJson.data.label, 'Office');
    assert.strictEqual(updateJson.data.line1, '456 Indiranagar 100ft Rd');
    assert.strictEqual(updateJson.data.pincode, '560038');

    // 4. Delete Address
    const delRes = await fetch(`${baseUrl}/customer/addresses/${addressId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${cToken}` },
    });
    assert.strictEqual(delRes.status, 200);
  });

  test('Stage 3: Product Reviews & Moderation CRUD with Metrics Calculations', async () => {
    // 1. Public GET reviews and dynamic metrics calculation
    const pubGet = await fetch(`${baseUrl}/reviews?productId=bear-001`);
    assert.strictEqual(pubGet.status, 200);
    const pubGetJson = await pubGet.json();
    assert.strictEqual(pubGetJson.success, true);
    assert.ok(pubGetJson.data.metrics);
    assert.ok(Array.isArray(pubGetJson.data.reviews));

    // 2. Public Customer Review Submission
    const postRes = await fetch(`${baseUrl}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'bear-001',
        productName: 'Essential Oversized Tee',
        author: 'Athlete Reviewer',
        rating: 5,
        fit: 'True to Size',
        title: 'Outstanding fabric durability',
        comment: 'Discipline in every stitch. Heavyweight drape feels premium.',
      }),
    });
    assert.strictEqual(postRes.status, 201);
    const postJson = await postRes.json();
    assert.strictEqual(postJson.success, true);
    assert.ok(postJson.data.review.id);
    const createdReviewId = postJson.data.review.id;

    // 3. Admin GET Reviews with filter
    const saToken = (await clientSA.auth.signInWithPassword({
      email: env.TEST_ADMIN_EMAIL,
      password: env.TEST_ADMIN_PASSWORD,
    })).data?.session?.access_token || superAdminToken;

    const adminGet = await fetch(`${baseUrl}/admin/reviews?productId=bear-001`, {
      headers: { 'Authorization': `Bearer ${saToken}` },
    });
    assert.strictEqual(adminGet.status, 200);
    const adminGetJson = await adminGet.json();
    assert.ok(adminGetJson.data.stats.total > 0);
    assert.ok(adminGetJson.data.reviews.some((r) => r.id === createdReviewId));

    // 4. Admin PATCH Review (Update rating & hide)
    const adminPatch = await fetch(`${baseUrl}/admin/reviews/${createdReviewId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${saToken}`,
      },
      body: JSON.stringify({
        isPublished: false,
        rating: 4,
        fit: 'Runs Slightly Large',
      }),
    });
    assert.strictEqual(adminPatch.status, 200);
    const adminPatchJson = await adminPatch.json();
    assert.strictEqual(adminPatchJson.data.isPublished, false);
    assert.strictEqual(adminPatchJson.data.rating, 4);
    assert.strictEqual(adminPatchJson.data.fit, 'Runs Slightly Large');

    // 5. Admin DELETE Review
    const adminDel = await fetch(`${baseUrl}/admin/reviews/${createdReviewId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${saToken}` },
    });
    assert.strictEqual(adminDel.status, 200);
    const adminDelJson = await adminDel.json();
    assert.strictEqual(adminDelJson.data.deleted, true);
  });
});
