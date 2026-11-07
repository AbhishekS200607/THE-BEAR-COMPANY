import test from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app.js';
import { createClient } from '@supabase/supabase-js';
import { env } from '../src/config/env.js';

test('Milestone 2 — Fulfillment Centre & Order History Engine', async (t) => {
  const app = createApp();
  let server;
  let baseUrl;
  let adminToken;

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/v1`;
      resolve();
    });
  });

  // Login as admin
  const clientAdm = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const admRes = await clientAdm.auth.signInWithPassword({
    email: env.TEST_ADMIN_EMAIL,
    password: env.TEST_ADMIN_PASSWORD,
  });
  adminToken = admRes.data?.session?.access_token || null;

  t.after(() => {
    server.close();
  });

  await t.test('1. Security check: Unauthenticated access to /admin/fulfillment is strictly rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/admin/fulfillment`);
    assert.strictEqual(res.status, 401);
  });

  await t.test('2. Get fulfillment pipeline: Returns orders, live tab counts, staff list and pagination', async () => {
    if (!adminToken) {
      console.warn('Skipping test 2: Test admin credentials not available in test environment');
      return;
    }

    const res = await fetch(`${baseUrl}/admin/fulfillment`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(Array.isArray(json.data.orders), 'data.orders must be an array');
    assert.ok(json.data.tabCounts, 'data.tabCounts must exist');
    assert.strictEqual(typeof json.data.tabCounts.urgent, 'number');
    assert.strictEqual(typeof json.data.tabCounts.processing, 'number');
    assert.strictEqual(typeof json.data.tabCounts.ready_to_ship, 'number');
    assert.strictEqual(typeof json.data.tabCounts.shipped, 'number');
    assert.strictEqual(typeof json.data.tabCounts.exceptions, 'number');
    assert.ok(Array.isArray(json.data.staffMembers), 'data.staffMembers must be an array');
  });

  await t.test('3. Batch packing slips generation: Renders print-ready HTML with BEAR fulfillment slip structure', async () => {
    if (!adminToken) return;

    const res = await fetch(`${baseUrl}/admin/fulfillment/packing-slips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ orderIds: [] }),
    });

    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('BEAR'), 'Must contain BEAR branding');
    assert.ok(html.includes('No orders selected') || html.includes('Fulfillment Slip'), 'Must render valid slip shell');
  });

  await t.test('4. Bulk status and staff assignment validation: Rejects empty or invalid payloads with 400', async () => {
    if (!adminToken) return;

    // Missing orderIds
    const assignRes = await fetch(`${baseUrl}/admin/fulfillment/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ orderIds: [] }),
    });
    assert.strictEqual(assignRes.status, 400);

    // Missing status
    const statusRes = await fetch(`${baseUrl}/admin/fulfillment/bulk-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ orderIds: ['00000000-0000-0000-0000-000000000000'] }),
    });
    assert.strictEqual(statusRes.status, 400);
  });
});
