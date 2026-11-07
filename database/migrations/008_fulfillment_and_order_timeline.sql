-- =============================================================================
-- BEAR E-COMMERCE — PRODUCTION DATABASE MIGRATION (008_fulfillment_and_order_timeline.sql)
-- Fulfillment Operations, SKU-Level Packing Checklists & Order Timeline Engine
-- =============================================================================

-- 1. Add Fulfillment Tracking Columns to Orders Table
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS fulfillment_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS packing_status VARCHAR(30) NOT NULL DEFAULT 'unpacked',
    ADD COLUMN IF NOT EXISTS packed_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS fulfillment_priority INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ;

-- 2. Indices for Warehouse Operations and Dispatch Filtering
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_staff ON public.orders(fulfillment_staff_id);
CREATE INDEX IF NOT EXISTS idx_orders_packing_status ON public.orders(packing_status);
CREATE INDEX IF NOT EXISTS idx_orders_is_urgent ON public.orders(is_urgent);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.orders(status, packing_status, is_urgent);

-- 3. Create Immutable Order Status & Audit Timeline Table
CREATE TABLE IF NOT EXISTS public.order_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL DEFAULT 'System Engine',
    action VARCHAR(50) NOT NULL,
    previous_state TEXT,
    new_state TEXT,
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_timeline_order_id ON public.order_timeline(order_id, created_at ASC);

-- 4. Enable Row Level Security on Timeline
ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and staff full timeline access"
    ON public.order_timeline
    FOR ALL
    USING (
        auth.role() = 'service_role' OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role::text IN (
                'admin', 
                'super_admin', 
                'operations_manager', 
                'catalog_manager', 
                'customer_support', 
                'marketing_manager', 
                'finance_manager', 
                'analyst'
            )
        )
    );

CREATE POLICY "Customers view own order timeline"
    ON public.order_timeline
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_timeline.order_id 
            AND orders.profile_id = auth.uid()
        )
    );
