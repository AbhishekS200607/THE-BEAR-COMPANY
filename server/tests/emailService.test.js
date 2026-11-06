import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import {
  generateCryptoOtp,
  hashOtp,
  requestOtp,
  verifyOtp,
} from '../src/services/otpService.js';
import {
  escapeHtml,
  renderOtpEmail,
  renderOrderConfirmationEmail,
  renderShipmentDispatchedEmail,
  renderAdminTestEmail,
} from '../src/services/emailTemplates.js';
import {
  sendEmail,
  setMailTransporterForTesting,
} from '../src/services/emailService.js';

describe('BEAR Transactional Email & OTP System Tests', () => {
  const sentEmails = [];

  before(() => {
    // Mock Nodemailer SMTP transporter
    setMailTransporterForTesting({
      sendMail: async (mailOptions) => {
        sentEmails.push(mailOptions);
        return {
          messageId: `mock_msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          response: '250 Message accepted',
        };
      },
    });
  });

  after(() => {
    setMailTransporterForTesting(null);
  });

  test('OTP Generation generates 6-digit cryptographically secure numeric codes', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateCryptoOtp();
      assert.strictEqual(code.length, 6, 'Code must be exactly 6 characters');
      assert.match(code, /^[0-9]{6}$/, 'Code must contain only digits');
      const num = parseInt(code, 10);
      assert.ok(num >= 100000 && num <= 999999, 'Code must be within [100000, 999999]');
    }
  });

  test('OTP Hashing produces salted SHA-256 hex string and is resistant to rainbow tables', () => {
    const code = '482910';
    const hash1 = hashOtp('customer@example.com', code);
    const hash2 = hashOtp('customer@example.com', code);
    const hashOtherEmail = hashOtp('other@example.com', code);

    assert.strictEqual(hash1.length, 64, 'SHA-256 hash must be 64 hex characters');
    assert.strictEqual(hash1, hash2, 'Identical inputs must yield identical hash');
    assert.notStrictEqual(hash1, hashOtherEmail, 'Different emails must yield completely different hashes for the same OTP');
    assert.notStrictEqual(hash1, code, 'Hash must never contain plaintext OTP');
  });

  test('Email template XSS sanitizer escapes dangerous HTML and script tags', () => {
    const dirty = '<script>alert("hack")</script>&"\'<b>Bold</b>';
    const clean = escapeHtml(dirty);

    assert.ok(!clean.includes('<script>'), 'Must not contain literal script tag');
    assert.ok(clean.includes('&lt;script&gt;'), 'Must encode opening bracket');
    assert.ok(clean.includes('&quot;hack&quot;'), 'Must encode quotes');
    assert.ok(clean.includes('&amp;'), 'Must encode ampersand');
  });

  test('Order confirmation email tracking link contains ONLY order reference and zero customer secrets', () => {
    const dummyOrder = {
      customerName: 'Aarav Sharma',
      orderNumber: 'BEAR-2026-99120',
      items: [
        { productName: 'AERO-01 Oversized Hoodie', colour: 'Shadow Black', size: 'L', quantity: 1, totalPrice: 3299 },
      ],
      deliveryAddress: {
        line1: 'Flat 402, Stellar Heights',
        line2: 'Koramangala 4th Block',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
      },
      subtotal: 3299,
      discount: 0,
      total: 3299,
      status: 'pending_whatsapp',
      trackingUrl: 'https://the-bear-company.vercel.app/#/track-order?orderNumber=BEAR-2026-99120',
      supportEmail: 'support@thebearcompany.com',
    };

    const { html, text } = renderOrderConfirmationEmail(dummyOrder);

    assert.ok(html.includes('BEAR-2026-99120'), 'HTML must include order number');
    assert.ok(html.includes('Aarav Sharma'), 'HTML must include customer name');
    assert.ok(html.includes('#/track-order?orderNumber=BEAR-2026-99120'), 'Tracking button URL must point to track-order with orderNumber');

    // Strict privacy assurance: URL must NOT leak sensitive customer data
    const urlPattern = /href="([^"]*track-order[^"]*)"/i;
    const match = html.match(urlPattern);
    assert.ok(match, 'Must find tracking URL in HTML');
    const trackingHref = match[1];

    assert.ok(!trackingHref.includes('9876543210'), 'Tracking URL must not contain customer phone number');
    assert.ok(!trackingHref.includes('Aarav'), 'Tracking URL must not contain customer name');
    assert.ok(!trackingHref.includes('560034'), 'Tracking URL must not contain pincode');
    assert.ok(!trackingHref.includes('secret'), 'Tracking URL must not contain secrets');
    assert.ok(!trackingHref.includes('jwt'), 'Tracking URL must not contain JWT');
    assert.ok(!trackingHref.includes('bearer'), 'Tracking URL must not contain Bearer tokens');
  });

  test('Shipment dispatched email includes courier details, AWB, and store tracking link', () => {
    const shipmentData = {
      customerName: 'Rohan Mehra',
      orderNumber: 'BEAR-2026-77881',
      courierName: 'BlueDart Air Express',
      trackingNumber: 'BLUEDART-88291039',
      trackingUrl: 'https://www.bluedart.com/track?awb=BLUEDART-88291039',
      storeTrackingUrl: 'https://the-bear-company.vercel.app/#/track-order?orderNumber=BEAR-2026-77881',
      supportEmail: 'support@thebearcompany.com',
    };

    const { html, text } = renderShipmentDispatchedEmail(shipmentData);

    assert.ok(html.includes('BlueDart Air Express'), 'Must display carrier name');
    assert.ok(html.includes('BLUEDART-88291039'), 'Must display AWB/tracking number');
    assert.ok(html.includes(shipmentData.trackingUrl), 'Must include courier tracking link');
    assert.ok(html.includes(shipmentData.storeTrackingUrl), 'Must include store tracking link');
    assert.ok(text.includes('BLUEDART-88291039'), 'Plain-text version must include tracking number');
  });

  test('Admin diagnostic email renders correctly with audit timestamp', () => {
    const testAdmin = 'admin@thebearcompany.com';
    const timestamp = new Date().toISOString();
    const { html, text } = renderAdminTestEmail({ adminEmail: testAdmin, timestamp });

    assert.ok(html.includes(testAdmin), 'Must show admin email');
    assert.ok(html.includes('BEAR SMTP Diagnostic Test'), 'Must show header');
    assert.ok(text.includes(testAdmin), 'Plain-text must show admin email');
  });

  test('Email outbox idempotency prevents duplicate email deliveries', async () => {
    const testKey = `test:idemp:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const recipient = 'idempotency-test@thebearcompany.test';

    // First call
    const firstCall = await sendEmail({
      to: recipient,
      subject: 'Idempotency Test 1',
      html: '<p>Test</p>',
      text: 'Test',
      eventType: 'otp_verification',
      idempotencyKey: testKey,
      payload: { testRun: 1 },
    });

    assert.strictEqual(firstCall.success, true, 'First call should succeed');

    // Second call with same idempotencyKey
    const secondCall = await sendEmail({
      to: recipient,
      subject: 'Idempotency Test 2',
      html: '<p>Duplicate</p>',
      text: 'Duplicate',
      eventType: 'otp_verification',
      idempotencyKey: testKey,
      payload: { testRun: 2 },
    });

    assert.strictEqual(secondCall.success, true, 'Second call should succeed safely');
    assert.strictEqual(secondCall.skipped, true, 'Second call must be marked as skipped due to idempotency');
  });

  test('OTP verification enforces single-use consumption and rejects reuse', async () => {
    const testEmailForOtp = `singleuse_${Date.now()}@thebearcompany.test`;

    // Request an OTP
    const reqRes = await requestOtp(testEmailForOtp, 'verification');
    assert.strictEqual(reqRes.success, true, 'OTP requested successfully');

    // Extract dispatched OTP from the mock transporter
    const lastDispatched = sentEmails[sentEmails.length - 1];
    assert.strictEqual(lastDispatched.to, testEmailForOtp);
    const otpMatch = lastDispatched.subject.match(/([0-9]{6})/);
    assert.ok(otpMatch, 'Subject must contain the 6-digit OTP code');
    const sentOtp = otpMatch[1];

    // Verify the OTP the first time
    const verifyFirst = await verifyOtp(testEmailForOtp, sentOtp, 'verification');
    assert.strictEqual(verifyFirst.success, true, 'First verification must succeed');

    // Attempt second verification of the SAME OTP (must fail due to single-use consumption)
    const verifySecond = await verifyOtp(testEmailForOtp, sentOtp, 'verification');
    assert.strictEqual(verifySecond.success, false, 'Second verification must fail');
    assert.ok(verifySecond.error.includes('Invalid or expired'), 'Error must indicate invalid or expired');
  });

  test('OTP verification enforces maximum 5 attempts and locks out afterwards', async () => {
    const testEmailForLockout = `lockout_${Date.now()}@thebearcompany.test`;

    const reqRes = await requestOtp(testEmailForLockout, 'verification');
    assert.strictEqual(reqRes.success, true);

    const wrongOtp = '000000';

    // 5 failed verification attempts
    for (let attempt = 1; attempt <= 4; attempt++) {
      const res = await verifyOtp(testEmailForLockout, wrongOtp, 'verification');
      assert.strictEqual(res.success, false);
      assert.ok(res.error.includes('attempts remaining') || res.error.includes('attempt remaining'));
    }

    // 5th failed attempt should lock out the code
    const fifthRes = await verifyOtp(testEmailForLockout, wrongOtp, 'verification');
    assert.strictEqual(fifthRes.success, false);
    assert.ok(fifthRes.error.includes('Too many incorrect attempts') || fifthRes.error.includes('invalid'));

    // Any subsequent attempt should be immediately rejected
    const sixthRes = await verifyOtp(testEmailForLockout, wrongOtp, 'verification');
    assert.strictEqual(sixthRes.success, false);
    assert.ok(sixthRes.error.includes('expired') || sixthRes.error.includes('invalid') || sixthRes.error.includes('Maximum'));
  });

  test('OTP service enforces 60-second cooldown on consecutive requests', async () => {
    const testEmailCooldown = `cooldown_${Date.now()}@thebearcompany.test`;

    const firstReq = await requestOtp(testEmailCooldown, 'verification');
    assert.strictEqual(firstReq.success, true, 'First request must succeed');

    // Immediate second request within 60 seconds
    const secondReq = await requestOtp(testEmailCooldown, 'verification');
    assert.strictEqual(secondReq.success, false, 'Second request within 60s must be throttled');
    assert.ok(secondReq.cooldownSeconds > 0, 'Must report remaining cooldown seconds');
    assert.ok(secondReq.error.includes('wait'), 'Must explain cooldown');
  });
});
