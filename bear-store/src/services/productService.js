import { mockDelay } from './mockStore.js';
import { products } from '../data/products.js';
import { collections } from '../data/collections.js';

export async function getProducts(mode, filters = {}, sort = 'featured') {
  await mockDelay();
  let result = products.filter((p) => p.mode === mode);

  // Apply category filter
  if (filters.category && filters.category !== 'all') {
    result = result.filter((p) => p.category.toLowerCase() === filters.category.toLowerCase());
  }

  // Apply size filter
  if (filters.sizes && filters.sizes.length > 0) {
    result = result.filter((p) =>
      p.sizes.some((s) => filters.sizes.includes(s.size) && s.available)
    );
  }

  // Apply colour filter
  if (filters.colours && filters.colours.length > 0) {
    result = result.filter((p) =>
      p.colours.some((c) => filters.colours.includes(c.id))
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
}

export async function getProductBySlug(slug) {
  await mockDelay(100, 200);
  return products.find((p) => p.slug === slug) || null;
}

export async function getCollections(mode) {
  await mockDelay();
  return collections[mode] || [];
}

export async function searchProducts(query, mode) {
  await mockDelay(100, 250);
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  return products.filter(
    (p) =>
      (mode ? p.mode === mode : true) &&
      (p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q))
  );
}

export async function getFeatured(mode) {
  await mockDelay();
  return products.filter((p) => p.mode === mode && p.featured);
}

export async function getBestsellers(mode) {
  await mockDelay();
  return products.filter((p) => p.mode === mode && p.bestseller);
}

export async function getNewArrivals(mode) {
  await mockDelay();
  return products.filter((p) => p.mode === mode && p.new);
}

export default { getProducts, getProductBySlug, getCollections, searchProducts, getFeatured, getBestsellers, getNewArrivals };

