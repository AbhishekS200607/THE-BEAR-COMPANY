import { Router } from 'express';
import { publicRateLimiter } from '../middleware/rateLimiter.js';
import { handleGetCategories } from '../controllers/categoryController.js';

const router = Router();

// GET /api/v1/categories - Public category list
router.get('/', publicRateLimiter, handleGetCategories);

export default router;

