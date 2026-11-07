-- =============================================================================
-- BEAR E-COMMERCE — PRODUCTION DATABASE MIGRATION (007_reviews_pagination_and_rbac.sql)
-- Review Indexes for Storefront Scalability (10A) & Fine-Grained Staff RBAC Roles
-- =============================================================================

-- 1. Composite & Bounded Indexes for High-Volume Review Queries (10A)
CREATE INDEX IF NOT EXISTS idx_reviews_product_published_created 
    ON public.reviews(product_id, is_published, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_product_rating 
    ON public.reviews(product_id, rating, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_product_fit 
    ON public.reviews(product_id, fit);

CREATE INDEX IF NOT EXISTS idx_reviews_product_verified 
    ON public.reviews(product_id, is_verified);

-- 2. Extend public.user_role Enum for Staff Specializations
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'operations_manager';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'catalog_manager';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'customer_support';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'marketing_manager';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'finance_manager';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'analyst';

-- 3. Update public.is_admin() to Recognize All Authorized Staff Roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN (
            'admin', 
            'super_admin', 
            'operations_manager', 
            'catalog_manager', 
            'customer_support', 
            'marketing_manager', 
            'finance_manager', 
            'analyst'
        )
    );
$$;

-- 4. Create Staff Roles & Permissions Directory Table
CREATE TABLE IF NOT EXISTS public.staff_roles (
    name VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Staff Roles and Standard Permissions
INSERT INTO public.staff_roles (name, label, description, permissions)
VALUES
    ('super_admin', 'Super Administrator', 'Full system and staff management authority', 
     '["*"]'::jsonb),
    ('admin', 'General Administrator', 'Broad day-to-day operations and management', 
     '["orders:read", "orders:write", "fulfillment:manage", "payments:read", "payments:reconcile", "payments:refund", "rma:read", "rma:manage", "inventory:read", "inventory:write", "inventory:adjust", "catalog:read", "catalog:write", "reviews:read", "reviews:moderate", "customers:read", "customers:write", "marketing:read", "marketing:write", "analytics:read", "analytics:export", "audit:read"]'::jsonb),
    ('operations_manager', 'Operations & Warehouse Manager', 'Fulfillment, shipping, inventory adjustments, and returns', 
     '["orders:read", "orders:write", "fulfillment:manage", "rma:read", "rma:manage", "inventory:read", "inventory:write", "inventory:adjust", "shipping:manage", "analytics:read"]'::jsonb),
    ('catalog_manager', 'Catalog & Merchandising Manager', 'Products, categories, media, inventory visibility, and review moderation', 
     '["catalog:read", "catalog:write", "reviews:read", "reviews:moderate", "inventory:read"]'::jsonb),
    ('customer_support', 'Customer Support Representative', 'Order inquiries, customer tickets, notes, and returns', 
     '["orders:read", "orders:write", "customers:read", "customers:write", "rma:read", "rma:manage", "reviews:read"]'::jsonb),
    ('finance_manager', 'Finance & Reconciliation Manager', 'Payment verification, manual proofs, refund ledger, and financial reports', 
     '["payments:read", "payments:reconcile", "payments:refund", "orders:read", "analytics:read", "analytics:export"]'::jsonb),
    ('marketing_manager', 'Marketing & Growth Manager', 'Promotions, coupon codes, campaign segments, and review analytics', 
     '["marketing:read", "marketing:write", "customers:read", "catalog:read", "analytics:read"]'::jsonb),
    ('analyst', 'Business & Data Analyst', 'Read-only aggregate metrics, revenue reports, and export tools', 
     '["analytics:read", "analytics:export", "orders:read", "inventory:read", "customers:read", "catalog:read"]'::jsonb)
ON CONFLICT (name) DO UPDATE 
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions;

-- Enable RLS on staff_roles
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public staff roles read"
    ON public.staff_roles FOR SELECT
    USING (TRUE);
