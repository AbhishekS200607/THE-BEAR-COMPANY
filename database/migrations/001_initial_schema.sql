-- =============================================================================
-- BEAR E-COMMERCE — PRODUCTION DATABASE MIGRATION (001_initial_schema.sql)
-- Complete hardened schema, atomic inventory accounting & least-privilege RLS
-- =============================================================================

BEGIN;

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('customer', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM (
        'pending_whatsapp',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'returned'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.catalog_mode AS ENUM ('bear', 'sow');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE,
    role public.user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_number);

-- 3. ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT 'Home',
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    line1 TEXT NOT NULL,
    line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode VARCHAR(6) NOT NULL CHECK (pincode ~ '^[1-9][0-9]{5}$'),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_profile ON public.addresses(profile_id);

-- 4. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    mode public.catalog_mode NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_mode ON public.categories(mode);

-- 5. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    mode public.catalog_mode NOT NULL,
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL,
    price_paise BIGINT NOT NULL CHECK (price_paise > 0),
    compare_at_price_paise BIGINT CHECK (compare_at_price_paise >= price_paise),
    description TEXT NOT NULL,
    fit_details TEXT,
    fabric_details TEXT,
    care_instructions TEXT,
    delivery_info TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
    is_new BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_mode_active ON public.products(mode, is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- 6. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id, display_order);

-- 7. PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL,
    colour_name TEXT NOT NULL,
    colour_hex VARCHAR(7) NOT NULL CHECK (colour_hex ~ '^#[0-9A-Fa-f]{6}$'),
    size VARCHAR(6) NOT NULL,
    price_override_paise BIGINT CHECK (price_override_paise > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_colour_size UNIQUE (product_id, colour_name, size)
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants(sku);

-- 8. INVENTORY
CREATE TABLE IF NOT EXISTS public.inventory (
    variant_id UUID PRIMARY KEY REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity_available INTEGER NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
    quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_inventory_sufficient CHECK (quantity_available >= quantity_reserved)
);

-- 9. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    idempotency_key TEXT UNIQUE NOT NULL,
    fingerprint TEXT NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status public.order_status NOT NULL DEFAULT 'pending_whatsapp',
    
    customer_name TEXT NOT NULL CHECK (length(trim(customer_name)) >= 2),
    customer_phone TEXT NOT NULL CHECK (customer_phone ~ '^[0-9]{10,12}$'),
    delivery_line1 TEXT NOT NULL CHECK (length(trim(delivery_line1)) >= 5),
    delivery_line2 TEXT,
    delivery_city TEXT NOT NULL CHECK (length(trim(delivery_city)) >= 2),
    delivery_state TEXT NOT NULL CHECK (length(trim(delivery_state)) >= 2),
    delivery_pincode VARCHAR(6) NOT NULL CHECK (delivery_pincode ~ '^[1-9][0-9]{5}$'),
    
    subtotal_paise BIGINT NOT NULL CHECK (subtotal_paise > 0),
    discount_paise BIGINT NOT NULL DEFAULT 0 CHECK (discount_paise >= 0),
    delivery_fee_paise BIGINT NOT NULL DEFAULT 0 CHECK (delivery_fee_paise = 0),
    total_paise BIGINT NOT NULL CHECK (total_paise > 0),
    
    reservation_expires_at TIMESTAMPTZ NOT NULL,
    reservation_released_at TIMESTAMPTZ,
    
    carrier_name TEXT,
    tracking_number TEXT,
    tracking_url TEXT,
    dispatched_at TIMESTAMPTZ,
    admin_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_order_math CHECK (total_paise = subtotal_paise - discount_paise + delivery_fee_paise),
    CONSTRAINT chk_order_discount CHECK (discount_paise <= subtotal_paise)
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_profile ON public.orders(profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_expiry ON public.orders(status, reservation_expires_at) 
    WHERE status = 'pending_whatsapp' AND reservation_released_at IS NULL;

-- 10. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    sku TEXT NOT NULL,
    colour_name TEXT NOT NULL,
    size TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 10),
    unit_price_paise BIGINT NOT NULL CHECK (unit_price_paise > 0),
    total_price_paise BIGINT NOT NULL CHECK (total_price_paise > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_item_math CHECK (total_price_paise = unit_price_paise * quantity)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- 11. ADMIN AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id UUID NOT NULL,
    changes JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON public.admin_audit_logs(target_entity, target_id);

-- 12. HELPER FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable. UPDATE and DELETE operations are prohibited.';
END;
$$;

DROP TRIGGER IF EXISTS trg_immutable_audit_logs ON public.admin_audit_logs;
CREATE TRIGGER trg_immutable_audit_logs
    BEFORE UPDATE OR DELETE ON public.admin_audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.set_profile_role(p_user_id UUID, p_role public.user_role)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin privilege required' USING ERRCODE='42501';
    END IF;
    UPDATE public.profiles SET role = p_role, updated_at = now() WHERE id = p_user_id;
END;
$$;

-- 13. ATOMIC INVENTORY & ORDER MANAGEMENT RPCs
CREATE OR REPLACE FUNCTION public.create_order_with_reservation(
    p_order_number TEXT,
    p_idempotency_key TEXT,
    p_fingerprint TEXT,
    p_profile_id UUID,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_delivery_line1 TEXT,
    p_delivery_line2 TEXT,
    p_delivery_city TEXT,
    p_delivery_state TEXT,
    p_delivery_pincode TEXT,
    p_items JSONB,
    p_expiry_minutes INT DEFAULT 120
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE
    v_order_id UUID;
    v_existing_fp TEXT;
    v_item RECORD;
    v_variant RECORD;
    v_calculated_subtotal BIGINT := 0;
    v_available INT;
    v_reserved INT;
    v_is_active BOOLEAN;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Trusted backend required' USING ERRCODE='42501';
    END IF;

    -- Concurrency Idempotency & Fingerprint Collision Protection
    SELECT id, fingerprint INTO v_order_id, v_existing_fp
    FROM public.orders WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
        IF v_existing_fp <> p_fingerprint THEN
            RAISE EXCEPTION 'Idempotency conflict: Fingerprint mismatch for key %', p_idempotency_key;
        END IF;
        RETURN v_order_id;
    END IF;

    -- Validations
    IF p_expiry_minutes < 10 OR p_expiry_minutes > 240 THEN
        RAISE EXCEPTION 'Expiry duration must be between 10 and 240 minutes.';
    END IF;

    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 25 THEN
        RAISE EXCEPTION 'Item count must be between 1 and 25.';
    END IF;

    -- Calculate Subtotal Authoritatively from DB
    FOR v_item IN 
        SELECT (x->>'variant_id')::UUID AS variant_id, (x->>'quantity')::INT AS quantity
        FROM jsonb_array_elements(p_items) AS x
    LOOP
        SELECT COALESCE(v.price_override_paise, p.price_paise) AS unit_price
        INTO v_variant
        FROM public.product_variants v
        JOIN public.products p ON p.id = v.product_id
        WHERE v.id = v_item.variant_id AND p.is_active = TRUE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Variant % does not exist or product is inactive.', v_item.variant_id;
        END IF;

        v_calculated_subtotal := v_calculated_subtotal + (v_variant.unit_price * v_item.quantity);
    END LOOP;

    -- Insert Order
    INSERT INTO public.orders (
        order_number, idempotency_key, fingerprint, profile_id, status,
        customer_name, customer_phone, delivery_line1, delivery_line2,
        delivery_city, delivery_state, delivery_pincode,
        subtotal_paise, discount_paise, delivery_fee_paise, total_paise,
        reservation_expires_at
    ) VALUES (
        p_order_number, p_idempotency_key, p_fingerprint, p_profile_id, 'pending_whatsapp',
        trim(p_customer_name), trim(p_customer_phone), trim(p_delivery_line1), p_delivery_line2,
        trim(p_delivery_city), trim(p_delivery_state), trim(p_delivery_pincode),
        v_calculated_subtotal, 0, 0, v_calculated_subtotal,
        now() + (p_expiry_minutes || ' minutes')::INTERVAL
    )
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id INTO v_order_id;

    IF v_order_id IS NULL THEN
        SELECT id INTO v_order_id FROM public.orders WHERE idempotency_key = p_idempotency_key;
        RETURN v_order_id;
    END IF;

    -- Insert Order Items
    FOR v_item IN 
        SELECT (x->>'variant_id')::UUID AS variant_id, (x->>'quantity')::INT AS quantity
        FROM jsonb_array_elements(p_items) AS x
    LOOP
        SELECT v.sku, v.colour_name, v.size, p.name AS product_name,
               COALESCE(v.price_override_paise, p.price_paise) AS unit_price
        INTO v_variant
        FROM public.product_variants v
        JOIN public.products p ON p.id = v.product_id
        WHERE v.id = v_item.variant_id;

        INSERT INTO public.order_items (
            order_id, variant_id, product_name, sku, colour_name, size,
            quantity, unit_price_paise, total_price_paise
        ) VALUES (
            v_order_id, v_item.variant_id, v_variant.product_name, v_variant.sku,
            v_variant.colour_name, v_variant.size, v_item.quantity,
            v_variant.unit_price, v_variant.unit_price * v_item.quantity
        );
    END LOOP;

    -- Lock and Reserve Inventory (Strict Ascending UUID order)
    FOR v_item IN 
        SELECT (x->>'variant_id')::UUID AS variant_id, SUM((x->>'quantity')::INT) AS quantity
        FROM jsonb_array_elements(p_items) AS x
        GROUP BY (x->>'variant_id')::UUID
        ORDER BY (x->>'variant_id')::UUID ASC
    LOOP
        SELECT i.quantity_available, i.quantity_reserved, p.is_active
        INTO v_available, v_reserved, v_is_active
        FROM public.inventory i
        JOIN public.product_variants v ON v.id = i.variant_id
        JOIN public.products p ON p.id = v.product_id
        WHERE i.variant_id = v_item.variant_id
        FOR UPDATE OF i;

        IF (v_available - v_reserved) < v_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for variant %.', v_item.variant_id;
        END IF;

        UPDATE public.inventory
        SET quantity_reserved = quantity_reserved + v_item.quantity, updated_at = now()
        WHERE variant_id = v_item.variant_id;
    END LOOP;

    RETURN v_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_order_inventory(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE
    o public.orders%ROWTYPE;
    r record;
    reserved_now int;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Trusted backend required' USING ERRCODE='42501';
    END IF;

    SELECT * INTO o FROM public.orders
    WHERE id = p_order_id AND status = 'pending_whatsapp'
      AND reservation_expires_at > now() AND reservation_released_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order cannot be confirmed';
    END IF;

    FOR r IN 
        SELECT variant_id, sum(quantity)::int qty 
        FROM public.order_items WHERE order_id = p_order_id
        GROUP BY variant_id ORDER BY variant_id 
    LOOP
        IF r.variant_id IS NULL THEN
            RAISE EXCEPTION 'Missing variant on order item';
        END IF;

        SELECT quantity_reserved INTO reserved_now
        FROM public.inventory WHERE variant_id = r.variant_id FOR UPDATE;

        IF NOT FOUND OR reserved_now < r.qty THEN
            RAISE EXCEPTION 'Reservation accounting invariant failed';
        END IF;

        UPDATE public.inventory
        SET quantity_available = quantity_available - r.qty,
            quantity_reserved = quantity_reserved - r.qty,
            updated_at = now()
        WHERE variant_id = r.variant_id;
    END LOOP;

    UPDATE public.orders SET status = 'confirmed', updated_at = now() WHERE id = p_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_pending_order(p_order_id UUID, p_reason TEXT DEFAULT 'Cancelled')
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE
    o public.orders%ROWTYPE;
    r record;
    reserved_now int;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Trusted backend required' USING ERRCODE='42501';
    END IF;

    SELECT * INTO o FROM public.orders
    WHERE id = p_order_id AND status = 'pending_whatsapp' AND reservation_released_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order cannot be cancelled';
    END IF;

    FOR r IN 
        SELECT variant_id, sum(quantity)::int qty 
        FROM public.order_items WHERE order_id = p_order_id
        GROUP BY variant_id ORDER BY variant_id 
    LOOP
        SELECT quantity_reserved INTO reserved_now
        FROM public.inventory WHERE variant_id = r.variant_id FOR UPDATE;

        IF NOT FOUND OR reserved_now < r.qty THEN
            RAISE EXCEPTION 'Reservation accounting invariant failed';
        END IF;

        UPDATE public.inventory
        SET quantity_reserved = quantity_reserved - r.qty, updated_at = now()
        WHERE variant_id = r.variant_id;
    END LOOP;

    UPDATE public.orders 
    SET status = 'cancelled', reservation_released_at = now(),
        admin_notes = concat_ws(E'\n', nullif(admin_notes, ''), left(coalesce(p_reason, 'Cancelled'), 500)),
        updated_at = now()
    WHERE id = p_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_expired_reservations()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE
    o record;
    r record;
    reserved_now int;
    released_count int := 0;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Trusted backend required' USING ERRCODE='42501';
    END IF;

    FOR o IN 
        SELECT id FROM public.orders
        WHERE status = 'pending_whatsapp' AND reservation_expires_at <= now() AND reservation_released_at IS NULL
        ORDER BY id FOR UPDATE SKIP LOCKED
    LOOP
        FOR r IN 
            SELECT variant_id, sum(quantity)::int qty 
            FROM public.order_items WHERE order_id = o.id
            GROUP BY variant_id ORDER BY variant_id 
        LOOP
            SELECT quantity_reserved INTO reserved_now
            FROM public.inventory WHERE variant_id = r.variant_id FOR UPDATE;

            IF NOT FOUND OR reserved_now < r.qty THEN
                RAISE EXCEPTION 'Reservation accounting invariant failed';
            END IF;

            UPDATE public.inventory
            SET quantity_reserved = quantity_reserved - r.qty, updated_at = now()
            WHERE variant_id = r.variant_id;
        END LOOP;

        UPDATE public.orders 
        SET status = 'cancelled', reservation_released_at = now(),
            admin_notes = concat_ws(E'\n', nullif(admin_notes, ''), 'Reservation expired automatically.'),
            updated_at = now()
        WHERE id = o.id;

        released_count := released_count + 1;
    END LOOP;

    RETURN released_count;
END;
$$;

-- 14. ROW LEVEL SECURITY POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profile_select_self_admin ON public.profiles;
CREATE POLICY profile_select_self_admin ON public.profiles
    FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profile_update_self_admin ON public.profiles;
CREATE POLICY profile_update_self_admin ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid() OR public.is_admin())
    WITH CHECK (public.is_admin() OR (id = auth.uid() AND role = public.current_profile_role()));

DROP POLICY IF EXISTS addresses_self_admin ON public.addresses;
CREATE POLICY addresses_self_admin ON public.addresses
    FOR ALL TO authenticated
    USING (profile_id = auth.uid() OR public.is_admin())
    WITH CHECK (profile_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS categories_read ON public.categories;
CREATE POLICY categories_read ON public.categories
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS categories_admin ON public.categories;
CREATE POLICY categories_admin ON public.categories
    FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS products_read ON public.products;
CREATE POLICY products_read ON public.products
    FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin());

DROP POLICY IF EXISTS products_admin ON public.products;
CREATE POLICY products_admin ON public.products
    FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS images_read ON public.product_images;
CREATE POLICY images_read ON public.product_images
    FOR SELECT TO anon, authenticated
    USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND (p.is_active OR public.is_admin())));

DROP POLICY IF EXISTS images_admin ON public.product_images;
CREATE POLICY images_admin ON public.product_images
    FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS variants_read ON public.product_variants;
CREATE POLICY variants_read ON public.product_variants
    FOR SELECT TO anon, authenticated
    USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND (p.is_active OR public.is_admin())));

DROP POLICY IF EXISTS variants_admin ON public.product_variants;
CREATE POLICY variants_admin ON public.product_variants
    FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS inventory_admin ON public.inventory;
CREATE POLICY inventory_admin ON public.inventory
    FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS orders_read ON public.orders;
CREATE POLICY orders_read ON public.orders
    FOR SELECT TO authenticated
    USING (profile_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS orders_admin ON public.orders;
CREATE POLICY orders_admin ON public.orders
    FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS order_items_read ON public.order_items;
CREATE POLICY order_items_read ON public.order_items
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.profile_id = auth.uid() OR public.is_admin())));

DROP POLICY IF EXISTS order_items_admin ON public.order_items;
CREATE POLICY order_items_admin ON public.order_items
    FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS audit_read ON public.admin_audit_logs;
CREATE POLICY audit_read ON public.admin_audit_logs
    FOR SELECT TO authenticated USING (public.is_admin());

-- 15. LEAST-PRIVILEGE ROLE GRANTS
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.categories, public.products, public.product_images, public.product_variants TO anon, authenticated;
GRANT SELECT ON public.profiles, public.addresses, public.orders, public.order_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT UPDATE(full_name, phone_number) ON public.profiles TO authenticated;
GRANT SELECT ON public.inventory, public.admin_audit_logs TO authenticated;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_profile_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_profile_role(UUID, public.user_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_order_with_reservation(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.confirm_order_inventory(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_pending_order(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_expired_reservations() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_profile_role(UUID, public.user_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_order_with_reservation(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_order_inventory(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_pending_order(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_expired_reservations() TO service_role;

COMMIT;

