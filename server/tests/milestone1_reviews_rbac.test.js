import test from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app.js';
import { roleHasPermission, PERMISSIONS } from '../src/middleware/rbac.js';

test('Milestone 1 — Storefront Review Scalability (10A) & Fine-Grained RBAC', async (t) => {
  const app = createApp();
  let server;
  let baseUrl;

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  t.after(() => {
    server.close();
  });

  await t.test('1. Bounded review pagination: API enforces limit and returns structured pagination envelope', async () => {
    // Request default page
    const res = await fetch(`${baseUrl}/api/v1/reviews?limit=5`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();

    assert.strictEqual(json.success, true);
    assert.ok(Array.isArray(json.data.reviews), 'data.reviews must be an array');
    assert.ok(json.data.reviews.length <= 5, 'Must not return more than requested limit');
    assert.ok(json.data.pagination, 'data.pagination envelope must exist');
    assert.strictEqual(json.data.pagination.page, 1);
    assert.strictEqual(json.data.pagination.limit, 5);
    assert.strictEqual(typeof json.data.pagination.total, 'number');
    assert.strictEqual(typeof json.data.pagination.totalPages, 'number');
    assert.strictEqual(typeof json.data.pagination.hasNextPage, 'boolean');
    assert.ok(json.data.metrics, 'data.metrics summary must exist');
  });

  await t.test('2. Strict limit cap: Requests exceeding maximum limit (50) are safely capped', async () => {
    const res = await fetch(`${baseUrl}/api/v1/reviews?limit=500`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.pagination.limit, 50, 'Limit must be capped to 50 max to prevent DoS');
  });

  await t.test('3. Star rating and fit filtering', async () => {
    const res = await fetch(`${baseUrl}/api/v1/reviews?rating=5`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    json.data.reviews.forEach((r) => {
      assert.strictEqual(r.rating, 5, 'Every returned review must match requested rating');
    });

    const fitRes = await fetch(`${baseUrl}/api/v1/reviews?fit=True+to+Size`);
    assert.strictEqual(fitRes.status, 200);
    const fitJson = await fitRes.json();
    fitJson.data.reviews.forEach((r) => {
      assert.ok(r.fit.toLowerCase().includes('true to size'), 'Review fit must match filter');
    });
  });

  await t.test('4. Sorting by rating and newest', async () => {
    const highestRes = await fetch(`${baseUrl}/api/v1/reviews?sort=highest_rating&limit=10`);
    assert.strictEqual(highestRes.status, 200);
    const highestJson = await highestRes.json();
    const highestRatings = highestJson.data.reviews.map((r) => r.rating);
    for (let i = 1; i < highestRatings.length; i++) {
      assert.ok(highestRatings[i - 1] >= highestRatings[i], 'Reviews must be sorted descending by rating');
    }

    const lowestRes = await fetch(`${baseUrl}/api/v1/reviews?sort=lowest_rating&limit=10`);
    assert.strictEqual(lowestRes.status, 200);
    const lowestJson = await lowestRes.json();
    const lowestRatings = lowestJson.data.reviews.map((r) => r.rating);
    for (let i = 1; i < lowestRatings.length; i++) {
      assert.ok(lowestRatings[i - 1] <= lowestRatings[i], 'Reviews must be sorted ascending by rating');
    }
  });

  await t.test('5. RBAC role permission checks: Invariants hold across staff specializations', () => {
    // Super Admin has wildcard access
    assert.strictEqual(roleHasPermission('super_admin', PERMISSIONS.STAFF_MANAGE), true);
    assert.strictEqual(roleHasPermission('super_admin', PERMISSIONS.PAYMENTS_REFUND), true);

    // Operations Manager has fulfillment & inventory, but not payments:refund or staff:manage
    assert.strictEqual(roleHasPermission('operations_manager', PERMISSIONS.FULFILLMENT_MANAGE), true);
    assert.strictEqual(roleHasPermission('operations_manager', PERMISSIONS.INVENTORY_ADJUST), true);
    assert.strictEqual(roleHasPermission('operations_manager', PERMISSIONS.PAYMENTS_REFUND), false);
    assert.strictEqual(roleHasPermission('operations_manager', PERMISSIONS.STAFF_MANAGE), false);

    // Catalog Manager has reviews and catalog, but not inventory:adjust
    assert.strictEqual(roleHasPermission('catalog_manager', PERMISSIONS.CATALOG_WRITE), true);
    assert.strictEqual(roleHasPermission('catalog_manager', PERMISSIONS.REVIEWS_MODERATE), true);
    assert.strictEqual(roleHasPermission('catalog_manager', PERMISSIONS.INVENTORY_ADJUST), false);

    // Finance Manager has payments and refunds, but not catalog:write
    assert.strictEqual(roleHasPermission('finance_manager', PERMISSIONS.PAYMENTS_REFUND), true);
    assert.strictEqual(roleHasPermission('finance_manager', PERMISSIONS.PAYMENTS_RECONCILE), true);
    assert.strictEqual(roleHasPermission('finance_manager', PERMISSIONS.CATALOG_WRITE), false);

    // Analyst has read-only access
    assert.strictEqual(roleHasPermission('analyst', PERMISSIONS.ANALYTICS_READ), true);
    assert.strictEqual(roleHasPermission('analyst', PERMISSIONS.ORDERS_WRITE), false);
    assert.strictEqual(roleHasPermission('analyst', PERMISSIONS.PAYMENTS_REFUND), false);
  });
});
