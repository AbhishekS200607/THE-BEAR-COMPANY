-- =============================================================================
-- BEAR E-COMMERCE — PRODUCTION SEED DATA (001_initial_products.sql)
-- Idempotent Catalog & Inventory Seeding for BEAR (Men) and SOW (Women)
-- =============================================================================

BEGIN;

-- 1. CATEGORIES SEEDING
INSERT INTO public.categories (id, slug, name, mode, display_order)
VALUES
    ('a0000001-0000-4000-8000-000000000001', 't-shirts-bear', 'T-Shirts', 'bear', 1),
    ('a0000001-0000-4000-8000-000000000002', 'shorts-bear', 'Shorts', 'bear', 2),
    ('a0000001-0000-4000-8000-000000000003', 'joggers-bear', 'Joggers', 'bear', 3),
    ('a0000001-0000-4000-8000-000000000004', 'hoodies-bear', 'Hoodies', 'bear', 4),
    ('a0000001-0000-4000-8000-000000000005', 'tanks-bear', 'Tank Tops', 'bear', 5),
    ('b0000001-0000-4000-8000-000000000001', 'leggings-sow', 'Leggings', 'sow', 1),
    ('b0000001-0000-4000-8000-000000000002', 'tops-sow', 'Tops & Sports Bras', 'sow', 2),
    ('b0000001-0000-4000-8000-000000000003', 'outerwear-sow', 'Outerwear', 'sow', 3),
    ('b0000001-0000-4000-8000-000000000004', 'shorts-sow', 'Shorts', 'sow', 4),
    ('b0000001-0000-4000-8000-000000000005', 'sets-sow', 'Active Sets', 'sow', 5)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, mode = EXCLUDED.mode, display_order = EXCLUDED.display_order;

-- 2. PRODUCTS SEEDING (16 Total Products: 8 BEAR + 8 SOW)
INSERT INTO public.products (
    id, slug, mode, name, category_id, category_name, price_paise, compare_at_price_paise,
    description, fit_details, fabric_details, care_instructions, delivery_info,
    is_featured, is_bestseller, is_new, is_active
)
VALUES
    -- BEAR 1: Essential Oversized Tee
    (
        'c0000001-0000-4000-8000-000000000001', 'essential-oversized-tee', 'bear', 'Essential Oversized Tee',
        'a0000001-0000-4000-8000-000000000001', 'T-Shirts', 99900, 149900,
        'A relaxed-fit oversized t-shirt made with premium 260 GSM combed compact cotton for all-day comfort and movement.',
        'Boxy drop-shoulder oversized fit. Model is 6''1" wearing size L.',
        '100% Combed Compact Cotton, 260 GSM Heavyweight Interlock Knit.',
        'Machine wash cold inside out. Hang dry or tumble dry low.',
        'Free domestic express shipping over ₹1,999. 7-day doorstep exchange.',
        TRUE, TRUE, FALSE, TRUE
    ),
    -- BEAR 2: Training Tee
    (
        'c0000001-0000-4000-8000-000000000002', 'training-tee', 'bear', 'Training Tee',
        'a0000001-0000-4000-8000-000000000001', 'T-Shirts', 89900, 129900,
        'Engineered for high-output conditioning and functional fitness. Cut from AeroDry micro-perforated knit fabric.',
        'Athletic tailored fit through chest and arms with a straight bottom hem.',
        'AeroDry 90% Polyamide, 10% Elastane. 4-way mechanical stretch with anti-microbial silver ion yarn.',
        'Machine wash warm (30°C). Air dry recommended.',
        'Fast 2-3 day metro air delivery across India.',
        TRUE, FALSE, TRUE, TRUE
    ),
    -- BEAR 3: Training Shorts
    (
        'c0000001-0000-4000-8000-000000000003', 'training-shorts', 'bear', 'Training Shorts',
        'a0000001-0000-4000-8000-000000000002', 'Shorts', 79900, 119900,
        'Utilitarian 5-inch inseam shorts designed for heavy squats, box jumps, and sprints. Features reinforced zip security pockets.',
        '5-inch above-knee inseam with ergonomic side split hem for unrestricted quad flexion.',
        'Ultra-lightweight 88% Matte Ripstop Nylon, 12% Spandex. Water-repellent quick-drying finish.',
        'Cold wash. Quick hang dry in 20 minutes.',
        'Pan-India dispatch within 24 hours. Express air transit.',
        TRUE, TRUE, FALSE, TRUE
    ),
    -- BEAR 4: Performance Joggers
    (
        'c0000001-0000-4000-8000-000000000004', 'performance-joggers', 'bear', 'Performance Joggers',
        'a0000001-0000-4000-8000-000000000003', 'Joggers', 129900, 189900,
        'Heavyweight tapered training joggers built with Thermo-Flex French terry yarn. Features tactical flatlock seam construction.',
        'Tapered slim fit through lower leg with roomy thigh space for lifter proportions.',
        '320 GSM 80% Combed Cotton, 20% Polyester French Terry.',
        'Machine wash cold. Do not tumble dry high to maintain ankle rib elasticity.',
        'Ships across 19,000+ PIN codes in India. Free Pan-India shipping.',
        TRUE, FALSE, TRUE, TRUE
    ),
    -- BEAR 5: Core Stringer Tank
    (
        'c0000001-0000-4000-8000-000000000005', 'core-tank-top', 'bear', 'Core Stringer Tank',
        'a0000001-0000-4000-8000-000000000005', 'Tank Tops', 69900, 99900,
        'Deep armhole stringer cut for optimal back and shoulder visual freedom during pulling movements.',
        'Relaxed athletic stringer cut with scoop neck.',
        '100% Breathable Ribbed Cotton, 180 GSM.',
        'Machine wash cold.',
        'Free Pan-India express delivery.',
        FALSE, FALSE, FALSE, TRUE
    ),
    -- BEAR 6: Essential Drop-Shoulder Hoodie
    (
        'c0000001-0000-4000-8000-000000000006', 'essential-hoodie', 'bear', 'Essential Drop-Shoulder Hoodie',
        'a0000001-0000-4000-8000-000000000004', 'Hoodies', 189900, 249900,
        'Heavyweight 420 GSM brushed fleece pullover hoodie with double-layer crossover hood and zero-drawcord minimal clean collar.',
        'Exaggerated boxy streetwear cut with drop shoulders.',
        '420 GSM 100% Organic Cotton Fleece.',
        'Cold wash. Dry flat.',
        'Free express shipping across India.',
        FALSE, FALSE, TRUE, TRUE
    ),
    -- BEAR 7: All-Day Performance Shorts
    (
        'c0000001-0000-4000-8000-000000000007', 'athletic-shorts-7in', 'bear', 'All-Day Performance Shorts',
        'a0000001-0000-4000-8000-000000000002', 'Shorts', 84900, 119900,
        '7-inch regular length gym shorts with internal stretch compression liner and hidden phone holster.',
        'Standard athletic 7" inseam.',
        '4-Way Stretch Performance Nylon.',
        'Machine wash cold.',
        'Dispatched within 24 hours.',
        FALSE, FALSE, FALSE, TRUE
    ),
    -- BEAR 8: Pro-Combat Compression Top
    (
        'c0000001-0000-4000-8000-000000000008', 'compression-tee', 'bear', 'Pro-Combat Compression Top',
        'a0000001-0000-4000-8000-000000000001', 'T-Shirts', 94900, 139900,
        'Second-skin compressive fit that improves muscular proprioception, blood flow, and keeps you dry.',
        'Skin-tight performance compression.',
        '85% Recycled Polyester, 15% Elastane.',
        'Cold wash gentle.',
        'Free shipping over ₹1,999.',
        FALSE, FALSE, FALSE, TRUE
    ),
    -- SOW 1: Sculpt Flex Bra
    (
        'd0000001-0000-4000-8000-000000000001', 'sculpt-flex-bra', 'sow', 'Sculpt Flex Bra',
        'b0000001-0000-4000-8000-000000000002', 'Tops & Sports Bras', 119900, 169900,
        'Medium-support compressive sports bra designed in our signature SculptSpun fabric with removable contour cups.',
        'Second-skin medium compression fit. Removable padding. Model is 5''8" wearing size S.',
        'SculptSpun 75% Recycled Polyamide, 25% Elastane. Butter-soft brushed micro-rib finish.',
        'Machine wash cold inside laundry bag. Remove cups before washing. Air dry flat.',
        'Free domestic express shipping over ₹1,999. Fast 2-3 day metro air delivery across India.',
        TRUE, TRUE, FALSE, TRUE
    ),
    -- SOW 2: High-Waist Ribbed Leggings
    (
        'd0000001-0000-4000-8000-000000000002', 'high-waist-ribbed-leggings', 'sow', 'High-Waist Ribbed Leggings',
        'b0000001-0000-4000-8000-000000000001', 'Leggings', 149900, 219900,
        '100% squat-proof 4-way stretch leggings with a double-layered high waistband that contours and stays locked in place.',
        'High-rise 25" 7/8 ankle crop length. Compressive tummy control waistband.',
        'MicroRib Compressive Knit, 78% Micro-Nylon, 22% Spandex. Zero see-through guarantee.',
        'Cold wash inside out. Lay flat to dry.',
        'Dispatched in 24 hours. Express air transit across India.',
        TRUE, TRUE, FALSE, TRUE
    ),
    -- SOW 3: Cropped Zip Hoodie
    (
        'd0000001-0000-4000-8000-000000000003', 'cropped-zip-hoodie', 'sow', 'Cropped Zip Hoodie',
        'b0000001-0000-4000-8000-000000000003', 'Outerwear', 179900, 249900,
        'Studio-to-street cropped hoodie crafted in plush French terry knit with a matte rose-gold two-way zipper and relaxed raglan sleeves.',
        'Cropped waistline fit designed to pair seamlessly with high-waisted leggings.',
        '340 GSM 100% French Terry Cotton.',
        'Cold wash. Dry in shade.',
        'Express delivery across India.',
        TRUE, FALSE, TRUE, TRUE
    ),
    -- SOW 4: Seamless Contour Shorts
    (
        'd0000001-0000-4000-8000-000000000004', 'seamless-contour-shorts', 'sow', 'Seamless Contour Shorts',
        'b0000001-0000-4000-8000-000000000004', 'Shorts', 89900, 129900,
        'Anti-ride biker inseam contour shorts with subtle under-glute contour shading that sculpts and defines. No front seam.',
        '6-inch biker length with stay-put leg silicone grip strip inside.',
        'Seamless Compressive Micro-Yarn, 82% Nylon, 18% Elastane.',
        'Machine wash cold.',
        'Ships in 24 hours.',
        TRUE, FALSE, FALSE, TRUE
    ),
    -- SOW 5: Terracotta Contour Suit
    (
        'd0000001-0000-4000-8000-000000000005', 'terracotta-contour-suit', 'sow', 'Terracotta Contour Suit',
        'b0000001-0000-4000-8000-000000000005', 'Active Sets', 289900, 389900,
        'Signature 2-piece set featuring the Sculpt Flex Bra and High-Waist Ribbed Leggings matched in warm autumnal terracotta earth tone.',
        'Coordinated set with compressive support throughout.',
        'SculptSpun 75% Recycled Polyamide, 25% Elastane.',
        'Cold wash inside out.',
        'Complimentary express shipping across India.',
        FALSE, TRUE, TRUE, TRUE
    ),
    -- SOW 6: Flow Studio Joggers
    (
        'd0000001-0000-4000-8000-000000000006', 'flow-studio-joggers', 'sow', 'Flow Studio Joggers',
        'b0000001-0000-4000-8000-000000000003', 'Outerwear', 139900, 199900,
        'Relaxed drapey studio joggers with wide fold-over waistband, deep side pockets, and cuffed ankles. Perfect for yoga and warmups.',
        'Relaxed loose leg with tapered ankle cuff.',
        'Modal French Terry blend, ultra-soft and lightweight.',
        'Delicate cycle cold wash.',
        'Fast dispatch within 24 hours.',
        FALSE, FALSE, FALSE, TRUE
    ),
    -- SOW 7: Ribbed Crop Tank
    (
        'd0000001-0000-4000-8000-000000000007', 'ribbed-crop-tank', 'sow', 'Ribbed Crop Tank',
        'b0000001-0000-4000-8000-000000000002', 'Tops & Sports Bras', 79900, 109900,
        'High-neck compressive crop tank with built-in shelf bra and wide racerback straps.',
        'Snug compressive crop fit.',
        'Ribbed Performance Knit.',
        'Cold wash.',
        'Ships across India.',
        FALSE, FALSE, FALSE, TRUE
    ),
    -- SOW 8: Sculpt Biker 2-Piece Set
    (
        'd0000001-0000-4000-8000-000000000008', 'sculpt-biker-set', 'sow', 'Sculpt Biker 2-Piece Set',
        'b0000001-0000-4000-8000-000000000005', 'Active Sets', 199900, 289900,
        'Matched active set with sports bra and 6-inch biker shorts in compressive micro-rib knit.',
        'Fitted athletic set.',
        'SculptSpun 75% Recycled Polyamide, 25% Elastane.',
        'Cold wash.',
        'Free express delivery.',
        FALSE, FALSE, TRUE, TRUE
    )
ON CONFLICT (slug) DO UPDATE
SET 
    name = EXCLUDED.name,
    category_id = EXCLUDED.category_id,
    category_name = EXCLUDED.category_name,
    price_paise = EXCLUDED.price_paise,
    compare_at_price_paise = EXCLUDED.compare_at_price_paise,
    description = EXCLUDED.description,
    is_featured = EXCLUDED.is_featured,
    is_bestseller = EXCLUDED.is_bestseller,
    is_new = EXCLUDED.is_new,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 3. PRODUCT VARIANTS & INVENTORY GENERATION
-- Corrected: Globally unique SKU generation with multi-colour support (3 colours per product)
-- Safe to rerun: Existing variants are updated, inventory is preserved
DO $$
DECLARE
    prod RECORD;
    col_rec RECORD;
    sz TEXT;
    var_id UUID;
    sku_val TEXT;
    colour_val TEXT;
    colour_hex_val TEXT;
BEGIN
    FOR prod IN
        SELECT
            id,
            slug,
            mode::text AS mode,
            name
        FROM public.products
        ORDER BY id
    LOOP

        -- Iterate over 3 colours per product mode
        FOR col_rec IN
            SELECT * FROM (
                VALUES
                    ('Pitch Black', '#111111', 'bear'),
                    ('Heather Grey', '#888888', 'bear'),
                    ('Raw White', '#EAEAEA', 'bear'),
                    ('Terracotta', '#80534C', 'sow'),
                    ('Sage Green', '#6B8F71', 'sow'),
                    ('Ink Black', '#1A1A1A', 'sow')
            ) AS c(colour_name, colour_hex, mode)
            WHERE c.mode = prod.mode
        LOOP
            colour_val := col_rec.colour_name;
            colour_hex_val := col_rec.colour_hex;

            -- Generate variants for each size
            FOREACH sz IN ARRAY ARRAY['S', 'M', 'L', 'XL', 'XXL']
            LOOP

                -- Use product UUID and colour abbreviation to guarantee globally unique SKUs
                sku_val := UPPER(
                    SUBSTRING(prod.mode, 1, 1)
                    || '-'
                    || REPLACE(prod.id::text, '-', '')
                    || '-'
                    || SUBSTRING(REPLACE(colour_val, ' ', ''), 1, 3)
                    || '-'
                    || sz
                );

                -- Insert or update the matching product variant
                INSERT INTO public.product_variants (
                    product_id,
                    sku,
                    colour_name,
                    colour_hex,
                    size
                )
                VALUES (
                    prod.id,
                    sku_val,
                    colour_val,
                    colour_hex_val,
                    sz
                )
                ON CONFLICT (product_id, colour_name, size)
                DO UPDATE SET
                    sku = EXCLUDED.sku,
                    colour_hex = EXCLUDED.colour_hex
                RETURNING id INTO var_id;

                -- Create initial inventory only if it does not exist
                INSERT INTO public.inventory (
                    variant_id,
                    quantity_available,
                    quantity_reserved,
                    low_stock_threshold
                )
                VALUES (
                    var_id,
                    30,
                    0,
                    5
                )
                ON CONFLICT (variant_id)
                DO NOTHING;

            END LOOP;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Product variants and inventory generation completed successfully.';

END $$;

-- 4. PRODUCT IMAGES SEEDING (One Primary Image per Product)
INSERT INTO public.product_images (
    product_id,
    image_url,
    alt_text,
    display_order,
    is_primary
)
SELECT v.product_id, v.image_url, v.alt_text, v.display_order, v.is_primary
FROM (
    VALUES
        ('c0000001-0000-4000-8000-000000000001'::UUID, 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0A_M4HqJNIIAusW1iTMaL94tnVHUlB2_7uyMjBw5mHw6BLBMJonDYlpbl1ks7zxdtF5jLW3oxBMrz9ZUSoacdbiSztre6lZoDTkvo9Apt6qGtxTxL2PLQibuZAUxKdZJVQD8YhaWaEAhApqCJQHkOjxDW8K-juFBWPSJxhzNXraK5jbwy0Vfos7iF5tBILTs-ByqMTeXYzQYYE66yCKJF6mcKz8kT6DF0rxTO3w', 'Essential Oversized Tee Front', 0, TRUE),
        ('c0000001-0000-4000-8000-000000000002'::UUID, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQmFvyeHajAO2EewAdyDO-HInZVDGx5AxysNjqo7an0dHKhm4eCLM3wOwnaxRO7i7gyr0TlZeLPwkXOaOm62q_KFLJZs_6TeCoHiEDLWBDRn1fnISXvz3p0jPY7_lCiKZlcrRbqiQsu0ArWB3gUWC-Fhfzeql37_tFpmXSLiSsMwe9tQwe4HFScMGeTjK2JcitgA1sgoZlJc-4X4z1ENmADZYj_D50viFjFv2eLw', 'Training Tee Front', 0, TRUE),
        ('c0000001-0000-4000-8000-000000000003'::UUID, 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2ueOr2JQ6nAqaGWMtwNojd9BbeeDgei4FHY00nWZvozOP2mBUSkRi0F6_U1FXd-gDlUangcGp0usTkq-MNHZRDIxyBEomEPGW0KSayE7o12_8b5imHItg1v01dFfJw-gQGfmbCd8iF4AH3IFNL5q18bG0R9kmON-YnKgXjrxqTV-icn7dA4ltz5o-oLdDgHBxD9WDPPjj0MOGXSwQ8OX8x0MWXx_2euZpn1b8vQ', 'Training Shorts Front', 0, TRUE),
        ('c0000001-0000-4000-8000-000000000004'::UUID, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBv5GZk9CHUcMayrA6GNyFaN3-Op3M8Ig_IujOSZrvLnGzmnaxLsdzIyhDCZf9LeUCzEbn7pZ39WDFRU3Kxf19y-gDlcAfQrDzGMZeO-RxtBDd_8rIpcD6CwfUliq4_7DHXJ6oiMRx9dWBpxBFBg1wlkZp_6nZn_9dcvp-PqgY4elZPMwuvkY-RuRjkyGamKYXQWg4pmS5Rk-offXylM4p5J1DKkyaa5YR2w080gA', 'Performance Joggers Front', 0, TRUE),
        ('c0000001-0000-4000-8000-000000000005'::UUID, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZfUaCLWobDsFeaa3fUotfDOwDwDCxViQiwoun9TK6_dXUUQXFOlWFGADID0ZMmkVuKjshRg_yXJ_0z9ern--ww8BVZ0wSTA7axQtzGhOEm14Kbno0vi-J495g6ghRL0de6ua4PncYU_8gVguf39AOI0U8ta6Agsn3oGpaUhfCyQYJhEJhNpyPwWR_3wWKE1p-FYpNffpR1LfSXhpLQ1ufI_FWbeQ2rivNiV_9uQ', 'Core Stringer Tank Front', 0, TRUE),
        ('c0000001-0000-4000-8000-000000000006'::UUID, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFI4Qmp1Czp23XcB5Cbco6sMgrp2p35nxY5ytRztT6NUWiOQEDB_TSV7V9ibTH8cYRDe6Ya-rplEzJkOdlJfrpbTIQjWKRlWrjAqYW6MbQusWRoG_7f8G0Zsi44AY68eYDzXFr6hUvVyj0yVNY1-Q5R1optBBvWKFiwLmpzdtiy4x5WReXbpEYbaqjSQNPL_I-QEHzrnHUSWHdU--V7bVGK1gVwrlzeyTMi5lKGg', 'Essential Drop-Shoulder Hoodie Front', 0, TRUE),
        ('c0000001-0000-4000-8000-000000000007'::UUID, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCe9uvKg3u0Iep_b9FvetuEsfxVclYO__pB8rckS2BZAzuG-nmY8kLjH_4ef33tU4gP5C_awVUNs3_UCSMvJUvRoal-wO-QasovBAgozltnH17xxE6NjtJJdHWzW71Oj6K_GWoPh9V2yLzQj3H2E0bGmTK9IzQwTqMUGkjM7OmcTZfLHz-ucMIaayWX5AqnJq-ui5WHEf5XXZth63SQCBJtpl0bMyy_zBlgrYlGRg', 'All-Day Performance Shorts Front', 0, TRUE),
        ('c0000001-0000-4000-8000-000000000008'::UUID, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgzcKioH0b84F8U8HAKo-q1RCrHEsE_vBoh_rzwKIEXJf5IMzpJH_WPl3qQa8BQS-jmAXqG9RZQKxdlB4QpuGOyk6q9bAqIRdfTYFM2uZ2TdJqY4skJyMsdVQQ0EpVR4HycrLdupEUDy4uvnjh_WZrsbdpWelp5XKPMqw2geRGpzTXCJuDMreP5kFSnE5ZmiQ4kehNU6P4Kf6QPJfCwPBJ5wdbLUzCY7JTnl5bmA', 'Pro-Combat Compression Top Front', 0, TRUE),
        ('d0000001-0000-4000-8000-000000000001'::UUID, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwJwjClrMEmcZdI7T5_s4E_hHPVNSvONzixL7JG9-QvsrOFNVHsJuM34lczkEnDZwBuddxz_XYgYNG3dVxfyDWbS9nWSmYIm9hoZqLJC2kjzY0eZzeqffaWX-YYCyBV25Vha3ShEgy8-DsQyeiv8v-7doFJr0Aw4myGI4pHt412ia-kqZZyIN1J3O23yjiYoMKkZDS_f51t6qAJ4pXlwdu3EG3rgGzswUdnY2fxQ', 'Sculpt Flex Bra Front', 0, TRUE),
        ('d0000001-0000-4000-8000-000000000002'::UUID, 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4Mwdd33IQiXxYvoZjoUYwVaNsHMyQqHGgfwrOLC7mgwyMN3lSQTRaAsvH_c2sWptQerXsbHRreHedH5S_sijZ2e9eD11keAse9pyNAJaO8GNrRM_mIUVfqDic0edxJTyW_sOIZDPUKThT-y1_8bMr9J7Yal_Sbrxk3jvw0pWsNV9HEJZeHeb9ZGWzF83475qVnVZTEVvoPfuPh-_QdwrIvx2C35dqyAykokYYRw', 'High-Waist Ribbed Leggings Front', 0, TRUE),
        ('d0000001-0000-4000-8000-000000000003'::UUID, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwJwjClrMEmcZdI7T5_s4E_hHPVNSvONzixL7JG9-QvsrOFNVHsJuM34lczkEnDZwBuddxz_XYgYNG3dVxfyDWbS9nWSmYIm9hoZqLJC2kjzY0eZzeqffaWX-YYCyBV25Vha3ShEgy8-DsQyeiv8v-7doFJr0Aw4myGI4pHt412ia-kqZZyIN1J3O23yjiYoMKkZDS_f51t6qAJ4pXlwdu3EG3rgGzswUdnY2fxQ', 'Cropped Zip Hoodie Front', 0, TRUE),
        ('d0000001-0000-4000-8000-000000000004'::UUID, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQEiogc_cPXim5UCGnhYNjkqhNBolHTUYVLmqhnzr9avfYJ3iL_FxP5Ms6egN1z6_30qHnq1THf0gkHHYr4apPcM0A0i6Za-NpBQlrl6THFESDuh0cwSL-TFQ8yhT03GNn129FPbbTTjblL7Td3hyUSQd0l7a6iquHpLS_cJ81XPtoOcbfO17xZxFBhAjnP4-vaB3dtZDRi8lytMq4pOCSwyvG41cKE6fHzltWvQ', 'Seamless Contour Shorts Front', 0, TRUE),
        ('d0000001-0000-4000-8000-000000000005'::UUID, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwJwjClrMEmcZdI7T5_s4E_hHPVNSvONzixL7JG9-QvsrOFNVHsJuM34lczkEnDZwBuddxz_XYgYNG3dVxfyDWbS9nWSmYIm9hoZqLJC2kjzY0eZzeqffaWX-YYCyBV25Vha3ShEgy8-DsQyeiv8v-7doFJr0Aw4myGI4pHt412ia-kqZZyIN1J3O23yjiYoMKkZDS_f51t6qAJ4pXlwdu3EG3rgGzswUdnY2fxQ', 'Terracotta Contour Suit Front', 0, TRUE),
        ('d0000001-0000-4000-8000-000000000006'::UUID, 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4Mwdd33IQiXxYvoZjoUYwVaNsHMyQqHGgfwrOLC7mgwyMN3lSQTRaAsvH_c2sWptQerXsbHRreHedH5S_sijZ2e9eD11keAse9pyNAJaO8GNrRM_mIUVfqDic0edxJTyW_sOIZDPUKThT-y1_8bMr9J7Yal_Sbrxk3jvw0pWsNV9HEJZeHeb9ZGWzF83475qVnVZTEVvoPfuPh-_QdwrIvx2C35dqyAykokYYRw', 'Flow Studio Joggers Front', 0, TRUE),
        ('d0000001-0000-4000-8000-000000000007'::UUID, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZfUaCLWobDsFeaa3fUotfDOwDwDCxViQiwoun9TK6_dXUUQXFOlWFGADID0ZMmkVuKjshRg_yXJ_0z9ern--ww8BVZ0wSTA7axQtzGhOEm14Kbno0vi-J495g6ghRL0de6ua4PncYU_8gVguf39AOI0U8ta6Agsn3oGpaUhfCyQYJhEJhNpyPwWR_3wWKE1p-FYpNffpR1LfSXhpLQ1ufI_FWbeQ2rivNiV_9uQ', 'Ribbed Crop Tank Front', 0, TRUE),
        ('d0000001-0000-4000-8000-000000000008'::UUID, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwJwjClrMEmcZdI7T5_s4E_hHPVNSvONzixL7JG9-QvsrOFNVHsJuM34lczkEnDZwBuddxz_XYgYNG3dVxfyDWbS9nWSmYIm9hoZqLJC2kjzY0eZzeqffaWX-YYCyBV25Vha3ShEgy8-DsQyeiv8v-7doFJr0Aw4myGI4pHt412ia-kqZZyIN1J3O23yjiYoMKkZDS_f51t6qAJ4pXlwdu3EG3rgGzswUdnY2fxQ', 'Sculpt Biker 2-Piece Set Front', 0, TRUE)
) AS v(product_id, image_url, alt_text, display_order, is_primary)
WHERE NOT EXISTS (
    SELECT 1 FROM public.product_images pi 
    WHERE pi.product_id = v.product_id AND pi.display_order = v.display_order
);

COMMIT;

