import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { publicRateLimiter } from '../middleware/rateLimiter.js';
import { handleGetProducts, handleGetProductBySlug } from '../controllers/productController.js';

const router = Router();

const getProductsSchema = {
  query: z.object({
    mode: z.enum(['bear', 'sow']).optional(),
    category: z.string().optional(),
    search: z.string().optional(),
    limit: z.string().optional(),
  }),
};

// GET /api/v1/products - Public product catalog with filters
router.get('/', publicRateLimiter, validate(getProductsSchema), handleGetProducts);

// GET /api/v1/products/:slug - Product details
router.get('/:slug', publicRateLimiter, handleGetProductBySlug);

export default router;
