/**
 * ============================================================================
 * BEAR Performance Wear - Secure Transactional Email Service
 * ============================================================================
 * Provides robust, idempotent, and secure SMTP email dispatching with outbox tracking.
 * - Powered by Nodemailer with TLS/STARTTLS support.
 * - Idempotency enforced via public.email_outbox table (with resilient memory fallback).
 * - Non-blocking failure model: email delivery failures never compromise core transactions.
 * - Zero leakage of credentials, passwords, or customer secrets in logs.
 */

import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';

let cachedTransporter = null;
const memoryOutbox = new Map();

/**
 * Checks whether SMTP environment variables are properly configured.
 */
export function isSmtpConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD);
}

/**
 * Creates or retrieves the cached Nodemailer SMTP transporter.
 */
export function getMailTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  if (!isSmtpConfigured()) {
    return null;
  }

  const port = Number(env.SMTP_PORT) || 587;
  const secure = String(env.SMTP_SECURE).toLowerCase() === 'true' || port === 465;

  cachedTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000,
  });

  return cachedTransporter;
}

/**
 * Allows test suites to inject a mock transporter.
 */
export function setMailTransporterForTesting(mockTransporter) {
  cachedTransporter = mockTransporter;
}

/**
 * Sanitizes an email address for safe log output (e.g. "abh***@gmail.com")
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return 'unknown';
  const parts = email.split('@');
  if (parts.length !== 2) return 'invalid-email';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length <= 2 ? `${name[0]}***` : `${name.slice(0, 2)}***${name.slice(-1)}`;
  return `${maskedName}@${domain}`;
}

/**
 * Primary transactional email sender with idempotency checking and outbox auditing.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Subject line
 * @param {string} options.html - Responsive HTML body
 * @param {string} options.text - Plain-text fallback body
 * @param {'otp_verification'|'order_confirmation'|'shipment_dispatched'|'admin_test'} options.eventType - Category of email
 * @param {string} options.idempotencyKey - Unique key to prevent duplicates
 * @param {Object} [options.payload] - Metadata to persist in outbox for auditing
 * @returns {Promise<{success: boolean, skipped?: boolean, error?: string, outboxId?: string, messageId?: string, unconfigured?: boolean}>}
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  eventType,
  idempotencyKey,
  payload = {},
}) {
  if (!to || !subject || !eventType || !idempotencyKey) {
    const errorMsg = 'Missing required email parameters (to, subject, eventType, idempotencyKey)';
    console.error(`[EmailService] Validation error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  const cleanRecipient = to.toLowerCase().trim();
  const maskedRecipient = maskEmail(cleanRecipient);

  let outboxRecord = null;

  // 1. Check or create record in email_outbox (Postgres with Memory Fallback)
  try {
    const { data: existing, error: selectErr } = await supabaseAdmin
      .from('email_outbox')
      .select('id, status, attempts')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (!selectErr && existing) {
      if (existing.status === 'sent') {
        return {
          success: true,
          skipped: true,
          outboxId: existing.id,
          message: 'Email previously delivered under this idempotency key',
        };
      }
      outboxRecord = existing;
    } else if (selectErr) {
      // Schema cache missing or table not created yet, check memory fallback
      const memExisting = memoryOutbox.get(idempotencyKey);
      if (memExisting) {
        if (memExisting.status === 'sent') {
          return {
            success: true,
            skipped: true,
            outboxId: memExisting.id,
            message: 'Email previously delivered under this idempotency key',
          };
        }
        outboxRecord = memExisting;
      }
    }

    if (!outboxRecord) {
      // Create pending outbox entry
      const { data: created, error: insertErr } = await supabaseAdmin
        .from('email_outbox')
        .insert({
          event_type: eventType,
          recipient_email: cleanRecipient,
          subject,
          payload_json: payload || {},
          idempotency_key: idempotencyKey,
          status: 'pending',
          attempts: 0,
        })
        .select('id, status, attempts')
        .single();

      if (!insertErr && created) {
        outboxRecord = created;
      } else {
        // Fallback to memory store
        outboxRecord = {
          id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          event_type: eventType,
          recipient_email: cleanRecipient,
          subject,
          payload_json: payload || {},
          idempotency_key: idempotencyKey,
          status: 'pending',
          attempts: 0,
        };
        memoryOutbox.set(idempotencyKey, outboxRecord);
      }
    }
  } catch (dbErr) {
    console.warn('[EmailService] Outbox check warning:', dbErr.message);
    const memExisting = memoryOutbox.get(idempotencyKey);
    if (memExisting?.status === 'sent') {
      return { success: true, skipped: true, outboxId: memExisting.id };
    }
  }

  // 2. Validate SMTP configuration (allows test mock bypass if set)
  const isMocked = Boolean(cachedTransporter);
  if (!isSmtpConfigured() && !isMocked) {
    const warnMsg = 'SMTP credentials not configured in environment variables.';
    console.warn(`[EmailService] ${warnMsg} Delivery skipped for ${maskedRecipient} (${eventType}).`);

    if (outboxRecord?.id) {
      outboxRecord.status = 'failed';
      outboxRecord.last_error = warnMsg;
      memoryOutbox.set(idempotencyKey, outboxRecord);

      await supabaseAdmin
        .from('email_outbox')
        .update({
          status: 'failed',
          last_error: warnMsg,
          updated_at: new Date().toISOString(),
        })
        .eq('id', outboxRecord.id)
        .catch(() => {});
    }

    return {
      success: false,
      error: warnMsg,
      unconfigured: true,
    };
  }

  // 3. Dispatch email through Nodemailer
  const transporter = getMailTransporter();
  const fromName = env.EMAIL_FROM_NAME || 'BEAR Performance Wear';
  const fromAddress = env.EMAIL_FROM_ADDRESS || env.SMTP_USER || 'orders@thebearcompany.com';
  const replyTo = env.EMAIL_REPLY_TO || fromAddress;

  const mailOptions = {
    from: `"${fromName}" <${fromAddress}>`,
    to: cleanRecipient,
    replyTo,
    subject,
    text: text || '',
    html: html || '',
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    const messageId = info?.messageId || 'sent';

    // 4. Update outbox record to 'sent'
    if (outboxRecord) {
      outboxRecord.status = 'sent';
      outboxRecord.sent_at = new Date().toISOString();
      outboxRecord.attempts = (outboxRecord.attempts || 0) + 1;
      outboxRecord.last_error = null;
      memoryOutbox.set(idempotencyKey, outboxRecord);

      if (outboxRecord.id && !outboxRecord.id.startsWith('mem_')) {
        await supabaseAdmin
          .from('email_outbox')
          .update({
            status: 'sent',
            sent_at: outboxRecord.sent_at,
            attempts: outboxRecord.attempts,
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', outboxRecord.id)
          .catch(() => {});
      }
    }

    console.log(`[EmailService] Successfully sent [${eventType}] to ${maskedRecipient} (Key: ${idempotencyKey})`);
    return {
      success: true,
      outboxId: outboxRecord?.id,
      messageId,
    };
  } catch (sendErr) {
    const errMsg = sendErr.message || 'SMTP transmission failure';
    console.error(`[EmailService] Delivery failed for [${eventType}] to ${maskedRecipient}: ${errMsg}`);

    // 5. Update outbox record to 'failed'
    if (outboxRecord) {
      outboxRecord.status = 'failed';
      outboxRecord.last_error = errMsg;
      outboxRecord.attempts = (outboxRecord.attempts || 0) + 1;
      memoryOutbox.set(idempotencyKey, outboxRecord);

      if (outboxRecord.id && !outboxRecord.id.startsWith('mem_')) {
        await supabaseAdmin
          .from('email_outbox')
          .update({
            status: 'failed',
            last_error: errMsg,
            attempts: outboxRecord.attempts,
            updated_at: new Date().toISOString(),
          })
          .eq('id', outboxRecord.id)
          .catch(() => {});
      }
    }

    return {
      success: false,
      error: errMsg,
    };
  }
}
