import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app.js';

describe('BEAR REST API Server Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api/v1`;
        resolve();
      });
    });
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
        items: [{ variant_id: '11111111-1111-1111-1111-111111111111', quantity: 1 }],
        customerName: 'Test Customer',
        customerPhone: '9876543210',
        deliveryLine1: '123 MG Road',
        deliveryCity: 'Bengaluru',
        deliveryState: 'Karnataka',
        deliveryPincode: '56000', // Invalid 5 digits
      }),
    });

    assert.strictEqual(res.status, 422);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  test('POST /orders rejects negative or 0 quantity with 422', async () => {
    const res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ variant_id: '11111111-1111-1111-1111-111111111111', quantity: 0 }],
        customerName: 'Test Customer',
        customerPhone: '9876543210',
        deliveryLine1: '123 MG Road',
        deliveryCity: 'Bengaluru',
        deliveryState: 'Karnataka',
        deliveryPincode: '560001',
      }),
    });

    assert.strictEqual(res.status, 422);
  });

  test('Admin routes require authorization header or reject with 401/403', async () => {
    const res = await fetch(`${baseUrl}/admin/dashboard`);
    assert.ok(res.status === 401 || res.status === 403);
    const data = await res.json();
    assert.strictEqual(data.success, false);

    const custRes = await fetch(`${baseUrl}/admin/customers`);
    assert.ok(custRes.status === 401 || custRes.status === 403);

    const discRes = await fetch(`${baseUrl}/admin/discounts`);
    assert.ok(discRes.status === 401 || discRes.status === 403);

    const prodRes = await fetch(`${baseUrl}/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });
    assert.ok(prodRes.status === 401 || prodRes.status === 403);
  });
});
