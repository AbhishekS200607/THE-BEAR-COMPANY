import { Router } from 'express';
import productRoutes from './productRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import orderRoutes from './orderRoutes.js';
import customerRoutes from './customerRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'bear-api',
  });
});

// Mount modules
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/customer', customerRoutes);
router.use('/admin', adminRoutes);

export default router;
