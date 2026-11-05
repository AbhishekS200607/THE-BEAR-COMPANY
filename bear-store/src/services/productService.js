import { products as fallbackProducts } from '../data/products.js';
import { collections } from '../data/collections.js';
import { remember } from './cacheService.js';
import { API_V1 } from '../config/api.js';

const API_BASE = API_V1;

async function fetchAllLiveProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map(normalizeProduct);
      }
    }
  } catch (err) {
    console.warn('[BEAR Store] Could not reach products API, using static fallback:', err.message);
  }
  return fallbackProducts.map(normalizeProduct);
}

function normalizeProduct(p) {
  return {
    ...p,
    rating: p.rating || 4.8,
    reviewCount: p.reviewCount || 128,
    sizes: (p.sizes || []).map((s) => ({
      ...s,
      variantId: s.variantId || null,
      available: s.available !== undefined ? s.available : true,
    })),
  };
}

export async function getProducts(mode, filters = {}, sort = 'featured') {
  const key = `products:${mode}:${JSON.stringify(filters)}:${sort}`;
  return remember(key, async () => {
    const all = await fetchAllLiveProducts();
    let result = all.filter((p) => p.mode === mode);

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      result = result.filter((p) => (p.category || '').toLowerCase() === filters.category.toLowerCase());
    }

    // Apply size filter
    if (filters.sizes && filters.sizes.length > 0) {
      result = result.filter((p) =>
        (p.sizes || []).some((s) => filters.sizes.includes(s.size) && s.available)
      );
    }

    // Apply colour filter
    if (filters.colours && filters.colours.length > 0) {
      result = result.filter((p) =>
        (p.colours || []).some((c) => filters.colours.includes(c.id))
      );
    }

    // Apply price filter
    if (filters.minPrice !== undefined) {
      result = result.filter((p) => p.price >= filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= filters.maxPrice);
    }

    // Apply sort
    switch (sort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'featured':
      default:
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, 60 * 1000); // 1 min cache
}

export async function getProductBySlug(slug) {
  return remember(`product:${slug}`, async () => {
    try {
      const res = await fetch(`${API_BASE}/products/${encodeURIComponent(slug)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return normalizeProduct(json.data);
        }
      }
    } catch (err) {
      console.warn('[BEAR Store] Could not fetch product by slug from API:', err.message);
    }
    const found = fallbackProducts.find((p) => p.slug === slug);
    return found ? normalizeProduct(found) : null;
  }, 60 * 1000);
}

export async function getCollections(mode) {
  return remember(`collections:${mode}`, async () => {
    return collections[mode] || [];
  });
}

export async function searchProducts(query, mode) {
  if (!query || query.trim().length < 2) return [];
  return remember(`search:${mode}:${query.trim().toLowerCase()}`, async () => {
    const q = query.trim().toLowerCase();
    const all = await fetchAllLiveProducts();
    return all.filter(
      (p) =>
        (mode ? p.mode === mode : true) &&
        (p.name.toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q))
    );
  }, 2 * 60 * 1000);
}

export async function getFeatured(mode) {
  return remember(`featured:${mode}`, async () => {
    const all = await fetchAllLiveProducts();
    return all.filter((p) => p.mode === mode && p.featured);
  }, 60 * 1000);
}

export async function getBestsellers(mode) {
  return remember(`bestsellers:${mode}`, async () => {
    const all = await fetchAllLiveProducts();
    return all.filter((p) => p.mode === mode && p.bestseller);
  }, 60 * 1000);
}

export async function getNewArrivals(mode) {
  return remember(`newArrivals:${mode}`, async () => {
    const all = await fetchAllLiveProducts();
    return all.filter((p) => p.mode === mode && p.new);
  }, 60 * 1000);
}

export default { getProducts, getProductBySlug, getCollections, searchProducts, getFeatured, getBestsellers, getNewArrivals };
