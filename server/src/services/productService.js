import { supabaseAdmin } from '../config/supabase.js';

// In-Memory Catalog Cache for sub-millisecond responses
const catalogCache = new Map();
const CATALOG_CACHE_TTL_MS = 30 * 1000; // 30 seconds
const PRODUCT_SLUG_CACHE_TTL_MS = 60 * 1000; // 60 seconds

export function clearProductCatalogCache() {
  catalogCache.clear();
}

export async function getProducts({ mode, category, search, limit = 50 }) {
  const cacheKey = `list:${mode || ''}:${category || ''}:${search || ''}:${limit}`;
  const cached = catalogCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CATALOG_CACHE_TTL_MS) {
    return cached.data;
  }

  let query = supabaseAdmin
    .from('products')
    .select(`
      id,
      slug,
      mode,
      name,
      category_name,
      price_paise,
      compare_at_price_paise,
      description,
      fit_details,
      fabric_details,
      care_instructions,
      delivery_info,
      is_featured,
      is_bestseller,
      is_new,
      created_at,
      product_images (
        id,
        image_url,
        alt_text,
        is_primary,
        display_order
      ),
      product_variants (
        id,
        sku,
        colour_name,
        colour_hex,
        size,
        price_override_paise,
        inventory (
          quantity_available,
          quantity_reserved
        )
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (mode) {
    query = query.eq('mode', mode.toLowerCase());
  }

  if (category && category !== 'all') {
    query = query.ilike('category_name', `%${category}%`);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  const result = (data || []).map(formatProductResponse);
  catalogCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

export async function getProductBySlug(slugOrId) {
  const cacheKey = `slug:${slugOrId}`;
  const cached = catalogCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < PRODUCT_SLUG_CACHE_TTL_MS) {
    return cached.data;
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

  let query = supabaseAdmin
    .from('products')
    .select(`
      id,
      slug,
      mode,
      name,
      category_name,
      price_paise,
      compare_at_price_paise,
      description,
      fit_details,
      fabric_details,
      care_instructions,
      delivery_info,
      is_featured,
      is_bestseller,
      is_new,
      created_at,
      product_images (
        id,
        image_url,
        alt_text,
        is_primary,
        display_order
      ),
      product_variants (
        id,
        sku,
        colour_name,
        colour_hex,
        size,
        price_override_paise,
        inventory (
          quantity_available,
          quantity_reserved
        )
      )
    `)
    .eq('is_active', true);

  if (isUuid) {
    query = query.or(`id.eq.${slugOrId},slug.eq.${slugOrId}`);
  } else {
    query = query.eq('slug', slugOrId);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    err.isPublic = true;
    throw err;
  }

  const result = formatProductResponse(data);
  catalogCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

function formatProductResponse(p) {
  // Extract and sort images
  const images = (p.product_images || [])
    .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.display_order - b.display_order)
    .map((img) => img.image_url);

  // Group unique colors
  const colourMap = new Map();
  (p.product_variants || []).forEach((v) => {
    if (!colourMap.has(v.colour_name)) {
      colourMap.set(v.colour_name, {
        id: v.colour_name.toLowerCase().replace(/\s+/g, '-'),
        name: v.colour_name,
        hex: v.colour_hex,
      });
    }
  });

  // Extract all variants with stock status
  const variants = (p.product_variants || []).map((v) => {
    const inv = v.inventory && v.inventory[0] ? v.inventory[0] : v.inventory;
    const availableUnreserved = inv ? inv.quantity_available - inv.quantity_reserved : 0;
    return {
      variantId: v.id,
      sku: v.sku,
      size: v.size,
      colour: v.colour_name,
      available: availableUnreserved > 0,
    };
  });

  // Deduplicate sizes — one entry per unique size (S, M, L, XL, XXL) in canonical order
  const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  const sizeMap = new Map();
  variants.forEach((v) => {
    if (!sizeMap.has(v.size)) {
      sizeMap.set(v.size, {
        size: v.size,
        variantId: v.variantId,
        available: v.available,
      });
    } else if (v.available) {
      sizeMap.get(v.size).available = true;
    }
  });

  const sizes = Array.from(sizeMap.values()).sort((a, b) => {
    const idxA = SIZE_ORDER.indexOf(a.size);
    const idxB = SIZE_ORDER.indexOf(b.size);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.size.localeCompare(b.size);
  });

  return {
    id: p.id,
    slug: p.slug,
    mode: p.mode,
    name: p.name,
    category: p.category_name,
    price: p.price_paise / 100,
    compareAtPrice: p.compare_at_price_paise ? p.compare_at_price_paise / 100 : null,
    description: p.description,
    fit: p.fit_details,
    fitDetails: p.fit_details,
    fit_details: p.fit_details,
    fabric: p.fabric_details,
    fabricDetails: p.fabric_details,
    fabric_details: p.fabric_details,
    care: p.care_instructions,
    careInstructions: p.care_instructions,
    care_instructions: p.care_instructions,
    delivery: p.delivery_info,
    deliveryInfo: p.delivery_info,
    delivery_info: p.delivery_info,
    featured: p.is_featured,
    bestseller: p.is_bestseller,
    new: p.is_new,
    createdAt: p.created_at,
    created_at: p.created_at,
    images,
    colours: Array.from(colourMap.values()),
    sizes,
    variants,
  };
}

