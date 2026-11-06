-- ============================================================================
-- MIGRATION: 004_email_outbox_and_otps.sql
-- Description: Transactional email outbox and cryptographic email OTP tables
-- ============================================================================

BEGIN;

-- 1. EMAIL OUTBOX TABLE (Idempotent transactional email delivery record)
CREATE TABLE IF NOT EXISTS public.email_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN ('otp_verification', 'order_confirmation', 'shipment_dispatched', 'admin_test')),
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    idempotency_key TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    attempts INT NOT NULL DEFAULT 0,
    last_error TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for outbox lookup, status filtering, and cleanup
CREATE INDEX IF NOT EXISTS idx_email_outbox_idempotency_key ON public.email_outbox (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_email_outbox_status ON public.email_outbox (status);
CREATE INDEX IF NOT EXISTS idx_email_outbox_created_at ON public.email_outbox (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_outbox_recipient ON public.email_outbox (recipient_email);

-- 2. EMAIL OTPS TABLE (Salted SHA-256 OTP hashes for security & verification)
CREATE TABLE IF NOT EXISTS public.email_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('verification', 'login', 'password_reset')),
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for OTP lookups and expiry checks
CREATE INDEX IF NOT EXISTS idx_email_otps_email_purpose ON public.email_otps (email, purpose);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON public.email_otps (expires_at);
CREATE INDEX IF NOT EXISTS idx_email_otps_consumed_at ON public.email_otps (consumed_at);

-- 3. ROW LEVEL SECURITY (RLS) ENFORCEMENT
-- Security Rule: Direct customer/anon client access is completely restricted.
-- Only backend service-role operations (or super-admin queries via RPC) can access outbox and OTPs.
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- Deny all public and authenticated direct access; service-role bypasses RLS
DROP POLICY IF EXISTS "No public access to email outbox" ON public.email_outbox;
CREATE POLICY "No public access to email outbox"
    ON public.email_outbox
    FOR ALL
    TO anon, authenticated
    USING (FALSE);

DROP POLICY IF EXISTS "No public access to email otps" ON public.email_otps;
CREATE POLICY "No public access to email otps"
    ON public.email_otps
    FOR ALL
    TO anon, authenticated
    USING (FALSE);

COMMIT;

