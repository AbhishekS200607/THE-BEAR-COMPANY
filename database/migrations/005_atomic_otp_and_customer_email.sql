-- ============================================================================
-- MIGRATION: 005_atomic_otp_and_customer_email.sql
-- Description: 
--   1. Adds customer_email column to public.orders table
--   2. Updates create_order_with_reservation to persist customer_email
--   3. Adds atomic PostgreSQL RPCs for OTP request (cooldown) & verification (FOR UPDATE)
-- ============================================================================

BEGIN;

-- 1. ADD customer_email TO ORDERS TABLE
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_email TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders (customer_email);

-- 2. UPDATE create_order_with_reservation TO PERSIST customer_email
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
    p_expiry_minutes INT DEFAULT 120,
    p_customer_email TEXT DEFAULT NULL
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
        WHERE v.id = v_item.variant_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product variant % does not exist', v_item.variant_id;
        END IF;

        v_calculated_subtotal := v_calculated_subtotal + (v_variant.unit_price * v_item.quantity);
    END LOOP;

    -- Insert Order Record with customer_email
    INSERT INTO public.orders (
        order_number, idempotency_key, fingerprint, profile_id,
        customer_name, customer_email, customer_phone, delivery_line1, delivery_line2,
        delivery_city, delivery_state, delivery_pincode,
        subtotal_paise, discount_paise, delivery_fee_paise, total_paise,
        reservation_expires_at
    ) VALUES (
        p_order_number, p_idempotency_key, p_fingerprint, p_profile_id,
        trim(p_customer_name), lower(trim(nullif(p_customer_email, ''))), trim(p_customer_phone), trim(p_delivery_line1), p_delivery_line2,
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
        SELECT p.is_active INTO v_is_active
        FROM public.product_variants v
        JOIN public.products p ON p.id = v.product_id
        WHERE v.id = v_item.variant_id;

        IF NOT v_is_active THEN
            RAISE EXCEPTION 'Item variant % belongs to an inactive product', v_item.variant_id;
        END IF;

        SELECT quantity_available, quantity_reserved
        INTO v_available, v_reserved
        FROM public.inventory
        WHERE variant_id = v_item.variant_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Inventory record not found for variant %', v_item.variant_id;
        END IF;

        IF (v_available - v_reserved) < v_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for variant % (available: %, requested: %)',
                v_item.variant_id, (v_available - v_reserved), v_item.quantity;
        END IF;

        UPDATE public.inventory
        SET quantity_reserved = quantity_reserved + v_item.quantity,
            updated_at = now()
        WHERE variant_id = v_item.variant_id;
    END LOOP;

    RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_with_reservation(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, INT, TEXT) TO service_role;


-- 3. ATOMIC OTP REQUEST FUNCTION (Enforces Cooldown & Invalidates Prior OTPs)
CREATE OR REPLACE FUNCTION public.request_email_otp(
    p_email TEXT,
    p_purpose TEXT,
    p_otp_hash TEXT,
    p_expires_at TIMESTAMPTZ,
    p_cooldown_seconds INT DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE
    v_clean_email TEXT := lower(trim(p_email));
    v_recent_created TIMESTAMPTZ;
    v_elapsed_seconds INT;
    v_otp_id UUID;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Trusted backend required' USING ERRCODE='42501';
    END IF;

    -- Row-lock latest record for this email and purpose to prevent race conditions
    SELECT created_at INTO v_recent_created
    FROM public.email_otps
    WHERE email = v_clean_email AND purpose = p_purpose
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
        v_elapsed_seconds := EXTRACT(EPOCH FROM (NOW() - v_recent_created))::INT;
        IF v_elapsed_seconds < p_cooldown_seconds THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'error', format('Please wait %s seconds before requesting a new code.', (p_cooldown_seconds - v_elapsed_seconds)),
                'cooldown_seconds', (p_cooldown_seconds - v_elapsed_seconds)
            );
        END IF;
    END IF;

    -- Invalidate existing unconsumed codes
    UPDATE public.email_otps
    SET consumed_at = NOW()
    WHERE email = v_clean_email AND purpose = p_purpose AND consumed_at IS NULL;

    -- Insert new code atomically
    INSERT INTO public.email_otps (
        email,
        purpose,
        otp_hash,
        expires_at,
        attempt_count
    ) VALUES (
        v_clean_email,
        p_purpose,
        p_otp_hash,
        p_expires_at,
        0
    )
    RETURNING id INTO v_otp_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'otp_id', v_otp_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_email_otp(TEXT, TEXT, TEXT, TIMESTAMPTZ, INT) TO service_role;


-- 4. ATOMIC OTP VERIFY FUNCTION (Row lock FOR UPDATE, atomic attempt counter & invalidation)
CREATE OR REPLACE FUNCTION public.verify_email_otp(
    p_email TEXT,
    p_purpose TEXT,
    p_otp_hash TEXT,
    p_max_attempts INT DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE
    v_clean_email TEXT := lower(trim(p_email));
    v_record RECORD;
    v_next_attempts INT;
    v_remaining INT;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Trusted backend required' USING ERRCODE='42501';
    END IF;

    -- Atomically lock the latest active OTP row FOR UPDATE
    SELECT id, otp_hash, expires_at, attempt_count
    INTO v_record
    FROM public.email_otps
    WHERE email = v_clean_email AND purpose = p_purpose AND consumed_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Invalid or expired verification code.'
        );
    END IF;

    -- Check if code expired
    IF v_record.expires_at < NOW() THEN
        UPDATE public.email_otps SET consumed_at = NOW() WHERE id = v_record.id;
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Verification code has expired. Please request a new one.'
        );
    END IF;

    -- Check if max attempts reached
    IF v_record.attempt_count >= p_max_attempts THEN
        UPDATE public.email_otps SET consumed_at = NOW() WHERE id = v_record.id;
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Maximum verification attempts exceeded. Please request a new code.'
        );
    END IF;

    -- Verify cryptographic hash
    IF v_record.otp_hash <> p_otp_hash THEN
        v_next_attempts := v_record.attempt_count + 1;
        v_remaining := GREATEST(0, p_max_attempts - v_next_attempts);

        IF v_remaining = 0 THEN
            UPDATE public.email_otps
            SET attempt_count = v_next_attempts, consumed_at = NOW()
            WHERE id = v_record.id;

            RETURN jsonb_build_object(
                'success', FALSE,
                'error', 'Too many incorrect attempts. This code is now invalid. Please request a new one.'
            );
        ELSE
            UPDATE public.email_otps
            SET attempt_count = v_next_attempts
            WHERE id = v_record.id;

            RETURN jsonb_build_object(
                'success', FALSE,
                'error', format('Invalid verification code. %s attempt(s) remaining.', v_remaining),
                'attempts_remaining', v_remaining
            );
        END IF;
    END IF;

    -- Hash matched! Atomically consume the OTP
    UPDATE public.email_otps
    SET consumed_at = NOW()
    WHERE id = v_record.id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Verification code confirmed successfully.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_email_otp(TEXT, TEXT, TEXT, INT) TO service_role;

COMMIT;

