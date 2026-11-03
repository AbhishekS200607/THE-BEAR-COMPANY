import crypto from 'crypto';

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
