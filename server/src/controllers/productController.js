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
    return successResponse(res, products);
  } catch (err) {
    return next(err);
  }
}

export async function handleGetProductBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const product = await getProductBySlug(slug);
    return successResponse(res, product);
  } catch (err) {
    return next(err);
  }
}
