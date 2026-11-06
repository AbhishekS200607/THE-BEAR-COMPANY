import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Encrypts temporary signup password using AES-256-GCM with server secret.
 * Plaintext passwords are NEVER stored in the database.
 */
export function encryptPassword(password) {
  const secret = env.OTP_PEPPER || env.JWT_SECRET || 'bear-secret-staging-key-minimum-32chars!';
  const key = crypto.createHash('sha256').update(secret).digest(); // 32-byte key
  const iv = crypto.randomBytes(12); // 96-bit IV
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let ciphertext = cipher.update(password, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext,
    iv: iv.toString('hex'),
    tag,
  };
}

/**
 * Decrypts temporary signup password using AES-256-GCM.
 */
export function decryptPassword({ ciphertext, iv, tag }) {
  const secret = env.OTP_PEPPER || env.JWT_SECRET || 'bear-secret-staging-key-minimum-32chars!';
  const key = crypto.createHash('sha256').update(secret).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  let password = decipher.update(ciphertext, 'hex', 'utf8');
  password += decipher.final('utf8');
  return password;
}

/**
 * Creates a deterministic SHA-256 hash fingerprint of an order's items and address.
 * Prevents idempotency key collision/hijacking with mismatched payloads.
 */
export function generateOrderFingerprint(items, deliveryDetails) {
  const sortedItems = [...items]
    .sort((a, b) => a.variant_id.localeCompare(b.variant_id))
    .map((i) => `${i.variant_id}:${i.quantity}`)
    .join('|');

  const normalizedAddress = [
    deliveryDetails.fullName?.trim().toLowerCase(),
    deliveryDetails.mobile?.trim(),
    deliveryDetails.line1?.trim().toLowerCase(),
    deliveryDetails.pincode?.trim(),
  ].join('|');

  return crypto
    .createHash('sha256')
    .update(`${sortedItems}##${normalizedAddress}`)
    .digest('hex');
}

