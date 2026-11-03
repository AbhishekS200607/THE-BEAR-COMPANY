import { supabaseAdmin } from '../config/supabase.js';

export async function getProducts({ mode, category, search, limit = 50 }) {
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

  return (data || []).map(formatProductResponse);
}

export async function getProductBySlug(slug) {
  const { data, error } = await supabaseAdmin
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
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    err.isPublic = true;
    throw err;
  }

  return formatProductResponse(data);
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

  // Group sizes and compute real-time in-stock status (quantity_available - quantity_reserved > 0)
  const sizes = (p.product_variants || []).map((v) => {
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
    fabric: p.fabric_details,
    care: p.care_instructions,
    delivery: p.delivery_info,
    featured: p.is_featured,
    bestseller: p.is_bestseller,
    new: p.is_new,
    images,
    colours: Array.from(colourMap.values()),
    sizes,
  };
}
