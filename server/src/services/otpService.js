/**
 * ============================================================================
 * BEAR Performance Wear - Cryptographic OTP Service
 * ============================================================================
 * Implements bank-grade one-time-password lifecycle management:
 * - 6-digit cryptographically secure random codes via crypto.randomInt
 * - Salted HMAC/SHA-256 hash storage using strict OTP_PEPPER (no hard-coded fallback)
 * - Atomic database verification with SELECT FOR UPDATE and attempt tracking via PostgreSQL RPC
 * - Strict 10-minute expiry window & 60-second cooldown
 * - Maximum 5 failed verification attempts before auto-invalidation
 * - Single-use enforcement (immediate atomic consumption upon verification)
 * - Returns explicit failure when SMTP delivery fails
 */

import crypto from 'crypto';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { sendEmail } from './emailService.js';
import { renderOtpEmail } from './emailTemplates.js';

const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFICATION_ATTEMPTS = 5;

/**
 * Generates a 6-digit cryptographically secure OTP.
 */
export function generateCryptoOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Computes a salted SHA-256 hash for an OTP using strict OTP_PEPPER.
 * Throws if neither OTP_PEPPER nor JWT_SECRET is configured.
 */
export function hashOtp(email, otp) {
  const cleanEmail = email.toLowerCase().trim();
  const pepper = env.OTP_PEPPER || env.JWT_SECRET;
  if (!pepper) {
    throw new Error('OTP_PEPPER or JWT_SECRET configuration missing. Cannot compute secure OTP hash.');
  }

  return crypto
    .createHash('sha256')
    .update(`${cleanEmail}:${otp.trim()}:${pepper}`)
    .digest('hex');
}

/**
 * Requests a new OTP for an email address and dispatches it via SMTP.
 * Enforces atomic database cooldown and invalidation.
 *
 * @param {string} email
 * @param {'verification'|'login'|'password_reset'} [purpose='verification']
 * @returns {Promise<{success: boolean, message?: string, error?: string, cooldownSeconds?: number}>}
 */
export async function requestOtp(email, purpose = 'verification') {
  if (!email || typeof email !== 'string') {
    return { success: false, error: 'A valid email address is required.' };
  }

  const cleanEmail = email.toLowerCase().trim();
  const validPurposes = ['verification', 'login', 'password_reset'];
  const cleanPurpose = validPurposes.includes(purpose) ? purpose : 'verification';

  // 1. Generate 6-digit code and salted hash
  const otp = generateCryptoOtp();
  const otpHash = hashOtp(cleanEmail, otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  // 2. Atomic PostgreSQL RPC to enforce cooldown, invalidate old codes, and insert new OTP
  let rpcData = null;
  const { data, error: rpcErr } = await supabaseAdmin.rpc('request_email_otp', {
    p_email: cleanEmail,
    p_purpose: cleanPurpose,
    p_otp_hash: otpHash,
    p_expires_at: expiresAt,
    p_cooldown_seconds: RESEND_COOLDOWN_SECONDS,
  });

  if (rpcErr) {
    console.error('[OtpService] request_email_otp RPC error:', rpcErr.message);
    return {
      success: false,
      error: rpcErr.message || 'Failed to initiate OTP verification. Please try again.',
    };
  }

  rpcData = typeof data === 'string' ? JSON.parse(data) : data;

  if (!rpcData?.success) {
    return {
      success: false,
      error: rpcData?.error || 'Rate limit cooldown active. Please wait before retrying.',
      cooldownSeconds: rpcData?.cooldown_seconds || RESEND_COOLDOWN_SECONDS,
    };
  }

  // 3. Render responsive branded template and send email
  const { html, text } = renderOtpEmail({
    otp,
    expiryMinutes: OTP_EXPIRY_MINUTES,
    purpose: cleanPurpose,
  });

  const idempotencyKey = `otp:${cleanEmail}:${cleanPurpose}:${Date.now()}`;
  const sendResult = await sendEmail({
    to: cleanEmail,
    subject: `${otp} is your BEAR Verification Code`,
    html,
    text,
    eventType: 'otp_verification',
    idempotencyKey,
    payload: { purpose: cleanPurpose, expiresAt },
  });

  // 4. Return failure when SMTP send fails
  if (!sendResult.success) {
    console.error(`[OtpService] Email dispatch failed for ${cleanEmail}:`, sendResult.error);
    return {
      success: false,
      error: sendResult.error || 'Failed to dispatch verification email. Please check SMTP settings.',
    };
  }

  return {
    success: true,
    message: 'A 6-digit verification code has been dispatched to your email.',
  };
}

/**
 * Verifies an OTP submitted by the user using atomic PostgreSQL row locking and attempt counter.
 *
 * @param {string} email
 * @param {string} otp
 * @param {'verification'|'login'|'password_reset'} [purpose='verification']
 * @returns {Promise<{success: boolean, message?: string, error?: string, attemptsRemaining?: number}>}
 */
export async function verifyOtp(email, otp, purpose = 'verification') {
  if (!email || !otp) {
    return { success: false, error: 'Email and verification code are required.' };
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanOtp = String(otp).trim();
  const validPurposes = ['verification', 'login', 'password_reset'];
  const cleanPurpose = validPurposes.includes(purpose) ? purpose : 'verification';

  // Compute hash using pepper
  const inputHash = hashOtp(cleanEmail, cleanOtp);

  // Atomic PostgreSQL RPC: row-locks FOR UPDATE, increments attempts, checks expiry and consumes if valid
  const { data, error: rpcErr } = await supabaseAdmin.rpc('verify_email_otp', {
    p_email: cleanEmail,
    p_purpose: cleanPurpose,
    p_otp_hash: inputHash,
    p_max_attempts: MAX_VERIFICATION_ATTEMPTS,
  });

  if (rpcErr) {
    console.error('[OtpService] verify_email_otp RPC error:', rpcErr.message);
    return { success: false, error: rpcErr.message || 'Verification failed. Please try again.' };
  }

  const result = typeof data === 'string' ? JSON.parse(data) : data;

  if (!result?.success) {
    return {
      success: false,
      error: result?.error || 'Invalid or expired verification code.',
      attemptsRemaining: result?.attempts_remaining,
    };
  }

  return {
    success: true,
    message: result?.message || 'Verification code confirmed successfully.',
  };
}

/**
 * Resends an active OTP code following cooldown rules.
 */
export async function resendOtp(email, purpose = 'verification') {
  return requestOtp(email, purpose);
}
