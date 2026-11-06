-- ============================================================================
-- MIGRATION: 006_pending_signups.sql
-- Description: Creates secure encrypted staging table for pending signups
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.pending_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    encrypted_password TEXT NOT NULL,
    password_iv TEXT NOT NULL,
    password_tag TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for email lookup and automated cleanup
CREATE INDEX IF NOT EXISTS idx_pending_signups_email ON public.pending_signups (email);
CREATE INDEX IF NOT EXISTS idx_pending_signups_expires_at ON public.pending_signups (expires_at);

-- ROW LEVEL SECURITY: strictly deny public/anon client access
ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to pending signups"
    ON public.pending_signups
    FOR ALL
    TO anon, authenticated
    USING (FALSE);

COMMIT;
