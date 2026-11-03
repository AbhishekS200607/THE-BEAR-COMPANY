-- =============================================================================
-- BEAR E-COMMERCE — STAGE B VERIFICATION TEST SUITE (001_test_security_concurrency.sql)
-- Run against a disposable Supabase project. Self-contained in a transaction rollback.
-- =============================================================================

BEGIN;

-- 1. Catalog check: RLS enabled on all sensitive tables
SELECT c.relname, c.relrowsecurity
FROM pg_class c 
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relname IN ('profiles','addresses','products','inventory','orders','order_items','admin_audit_logs')
ORDER BY c.relname;

-- 2. Privileged RPC check: Zero execution grants to anon or authenticated
SELECT routine_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE specific_schema = 'public' 
  AND routine_name IN ('create_order_with_reservation','confirm_order_inventory','cancel_pending_order','release_expired_reservations')
ORDER BY routine_name, grantee;

-- 3. Inventory accounting invariant test: Quantity must never be negative or under-reserved
SELECT variant_id, quantity_available, quantity_reserved 
FROM public.inventory
WHERE quantity_reserved < 0 OR quantity_available < quantity_reserved;

ROLLBACK;

