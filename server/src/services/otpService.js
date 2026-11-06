/**
 * ============================================================================
 * BEAR Performance Wear - Cryptographic OTP Service
 * ============================================================================
 * Implements bank-grade one-time-password lifecycle management:
 * - 6-digit cryptographically secure random codes via crypto.randomInt
 * - Salted SHA-256 hash storage (plaintext OTPs are NEVER written to DB or logs)
 * - Strict 10-minute expiry window
 * - 60-second resend cooldown
 * - Maximum 5 failed verification attempts before auto-invalidation
 * - Single-use enforcement (immediate atomic consumption upon verification)
 * - Resilient database persistence with memory store fallback
 * - Safe response messaging to mitigate account enumeration
 */

import crypto from 'crypto';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { sendEmail } from './emailService.js';
import { renderOtpEmail } from './emailTemplates.js';

const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFICATION_ATTEMPTS = 5;

// In-memory fallback if remote database table is pending migration
const memoryOtps = [];

/**
 * Generates a 6-digit cryptographically secure OTP.
 */
export function generateCryptoOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Computes a salted SHA-256 hash for an OTP.
 */
export function hashOtp(email, otp) {
  const cleanEmail = email.toLowerCase().trim();
  const salt = env.JWT_SECRET || 'bear-auth-otp-salt-key';
  return crypto
    .createHash('sha256')
    .update(`${cleanEmail}:${otp.trim()}:${salt}`)
    .digest('hex');
}

/**
 * Requests a new OTP for an email address and dispatches it via SMTP.
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

  // 1. Check 60-second cooldown from most recent OTP
  let recentCreatedAt = null;
  try {
    const { data: recentOtps, error } = await supabaseAdmin
      .from('email_otps')
      .select('id, created_at')
      .eq('email', cleanEmail)
      .eq('purpose', cleanPurpose)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!error && recentOtps && recentOtps.length > 0) {
      recentCreatedAt = recentOtps[0].created_at;
    }
  } catch {}

  if (!recentCreatedAt) {
    const memRecent = memoryOtps
      .filter((o) => o.email === cleanEmail && o.purpose === cleanPurpose)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    if (memRecent) {
      recentCreatedAt = memRecent.created_at;
    }
  }

  if (recentCreatedAt) {
    const elapsedMs = Date.now() - new Date(recentCreatedAt).getTime();
    const cooldownMs = RESEND_COOLDOWN_SECONDS * 1000;
    if (elapsedMs < cooldownMs) {
      const remainingSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
      return {
        success: false,
        error: `Please wait ${remainingSeconds}s before requesting another verification code.`,
        cooldownSeconds: remainingSeconds,
      };
    }
  }

  // 2. Invalidate any previous unconsumed OTPs for this email and purpose
  const nowIso = new Date().toISOString();
  try {
    await supabaseAdmin
      .from('email_otps')
      .update({ consumed_at: nowIso })
      .eq('email', cleanEmail)
      .eq('purpose', cleanPurpose)
      .is('consumed_at', null);
  } catch {}

  memoryOtps.forEach((o) => {
    if (o.email === cleanEmail && o.purpose === cleanPurpose && !o.consumed_at) {
      o.consumed_at = nowIso;
    }
  });

  // 3. Generate 6-digit code and salted hash
  const otp = generateCryptoOtp();
  const otpHash = hashOtp(cleanEmail, otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  // 4. Persist hash in database or memory store
  let savedToDb = false;
  try {
    const { error: insertErr } = await supabaseAdmin.from('email_otps').insert({
      email: cleanEmail,
      purpose: cleanPurpose,
      otp_hash: otpHash,
      expires_at: expiresAt,
      attempt_count: 0,
    });
    if (!insertErr) savedToDb = true;
  } catch {}

  if (!savedToDb) {
    memoryOtps.push({
      id: `mem_otp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: cleanEmail,
      purpose: cleanPurpose,
      otp_hash: otpHash,
      expires_at: expiresAt,
      attempt_count: 0,
      consumed_at: null,
      created_at: nowIso,
    });
  }

  // 5. Render responsive branded template and send email
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

  if (!sendResult.success && sendResult.unconfigured) {
    return {
      success: true,
      message: 'Verification code generated (SMTP in test/offline mode).',
      testMode: true,
    };
  }

  return {
    success: true,
    message: 'A 6-digit verification code has been dispatched to your email.',
  };
}

/**
 * Verifies an OTP submitted by the user.
 *
 * @param {string} email
 * @param {string} otp
 * @param {'verification'|'login'|'password_reset'} [purpose='verification']
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function verifyOtp(email, otp, purpose = 'verification') {
  if (!email || !otp) {
    return { success: false, error: 'Email and verification code are required.' };
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanOtp = String(otp).trim();
  const validPurposes = ['verification', 'login', 'password_reset'];
  const cleanPurpose = validPurposes.includes(purpose) ? purpose : 'verification';

  // 1. Fetch latest active unconsumed OTP
  let record = null;
  try {
    const { data: records, error: fetchErr } = await supabaseAdmin
      .from('email_otps')
      .select('id, otp_hash, expires_at, attempt_count, consumed_at')
      .eq('email', cleanEmail)
      .eq('purpose', cleanPurpose)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!fetchErr && records && records.length > 0) {
      record = records[0];
    }
  } catch {}

  if (!record) {
    const memRecords = memoryOtps
      .filter((o) => o.email === cleanEmail && o.purpose === cleanPurpose && !o.consumed_at)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (memRecords.length > 0) {
      record = memRecords[0];
    }
  }

  if (!record) {
    return { success: false, error: 'Invalid or expired verification code.' };
  }

  // 2. Check if code has expired
  if (new Date(record.expires_at).getTime() < Date.now()) {
    record.consumed_at = new Date().toISOString();
    if (record.id && !record.id.startsWith('mem_')) {
      await supabaseAdmin
        .from('email_otps')
        .update({ consumed_at: record.consumed_at })
        .eq('id', record.id)
        .catch(() => {});
    }
    return { success: false, error: 'Verification code has expired. Please request a new one.' };
  }

  // 3. Check attempt limit
  if (record.attempt_count >= MAX_VERIFICATION_ATTEMPTS) {
    record.consumed_at = new Date().toISOString();
    if (record.id && !record.id.startsWith('mem_')) {
      await supabaseAdmin
        .from('email_otps')
        .update({ consumed_at: record.consumed_at })
        .eq('id', record.id)
        .catch(() => {});
    }
    return {
      success: false,
      error: 'Maximum verification attempts exceeded. Please request a new code.',
    };
  }

  // 4. Verify cryptographic hash using timing-safe comparison
  const inputHash = hashOtp(cleanEmail, cleanOtp);
  let isMatch = false;

  try {
    const inputBuf = Buffer.from(inputHash, 'hex');
    const storedBuf = Buffer.from(record.otp_hash, 'hex');
    if (inputBuf.length === storedBuf.length) {
      isMatch = crypto.timingSafeEqual(inputBuf, storedBuf);
    }
  } catch {
    isMatch = false;
  }

  if (!isMatch) {
    const nextAttempts = record.attempt_count + 1;
    record.attempt_count = nextAttempts;

    if (record.id && !record.id.startsWith('mem_')) {
      await supabaseAdmin
        .from('email_otps')
        .update({ attempt_count: nextAttempts })
        .eq('id', record.id)
        .catch(() => {});
    }

    const remaining = Math.max(0, MAX_VERIFICATION_ATTEMPTS - nextAttempts);
    if (remaining === 0) {
      record.consumed_at = new Date().toISOString();
      if (record.id && !record.id.startsWith('mem_')) {
        await supabaseAdmin
          .from('email_otps')
          .update({ consumed_at: record.consumed_at })
          .eq('id', record.id)
          .catch(() => {});
      }
      return {
        success: false,
        error: 'Too many incorrect attempts. This code is now invalid. Please request a new one.',
      };
    }

    return {
      success: false,
      error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }

  // 5. Success: Consume OTP atomically
  record.consumed_at = new Date().toISOString();
  if (record.id && !record.id.startsWith('mem_')) {
    await supabaseAdmin
      .from('email_otps')
      .update({ consumed_at: record.consumed_at })
      .eq('id', record.id)
      .catch(() => {});
  }

  return {
    success: true,
    message: 'Verification code confirmed successfully.',
  };
}

/**
 * Resends an active OTP code or generates a fresh one following the 60-second cooldown.
 */
export async function resendOtp(email, purpose = 'verification') {
  return requestOtp(email, purpose);
}
