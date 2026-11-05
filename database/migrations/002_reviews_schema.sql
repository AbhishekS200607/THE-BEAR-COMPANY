-- =============================================================================
-- BEAR E-COMMERCE — PRODUCTION DATABASE MIGRATION (002_reviews_schema.sql)
-- Product Reviews, Ratings Calculation & Admin Moderation
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    author TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    fit TEXT NOT NULL DEFAULT 'True to Size',
    title TEXT NOT NULL,
    comment TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for fast querying by product, rating, and published status
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_published ON public.reviews(is_published);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can read published reviews
CREATE POLICY "Public read published reviews"
    ON public.reviews
    FOR SELECT
    USING (is_published = TRUE);

-- 2. Authenticated users can insert reviews
CREATE POLICY "Users can create reviews"
    ON public.reviews
    FOR INSERT
    WITH CHECK (TRUE);

-- 3. Service role and admins have full access
CREATE POLICY "Admin full review management"
    ON public.reviews
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    ));

COMMIT;

