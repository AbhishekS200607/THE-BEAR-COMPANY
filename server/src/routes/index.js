import { Router } from 'express';
import productRoutes from './productRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import orderRoutes from './orderRoutes.js';
import customerRoutes from './customerRoutes.js';
import adminRoutes from './adminRoutes.js';
import authRoutes from './authRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import cronRoutes from './cronRoutes.js';
import { getStoredPromotions } from '../services/storePersistence.js';
import { successResponse } from '../utils/response.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'bear-api',
  });
});

// Public promotions endpoint
router.get('/promotions', (req, res) => {
  const promos = getStoredPromotions();
  res.set('Cache-Control', 'public, max-age=120, s-maxage=300, stale-while-revalidate=600');
  return successResponse(res, promos);
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/customer', customerRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/cron', cronRoutes);

export default router;

