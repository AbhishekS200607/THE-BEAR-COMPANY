import { getProducts, getProductBySlug } from '../services/productService.js';
import { successResponse } from '../utils/response.js';

export async function handleGetProducts(req, res, next) {
  try {
    const { mode, category, search, limit } = req.query;
    const products = await getProducts({
      mode,
      category,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    // Edge CDN caching: 60s browser, 5m Vercel Edge, 10m stale-while-revalidate
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    return successResponse(res, products);
  } catch (err) {
    return next(err);
  }
}

export async function handleGetProductBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const product = await getProductBySlug(slug);
    // Edge CDN caching: 2m browser, 10m Vercel Edge, 20m stale-while-revalidate
    res.set('Cache-Control', 'public, max-age=120, s-maxage=600, stale-while-revalidate=1200');
    return successResponse(res, product);
  } catch (err) {
    return next(err);
  }
}

