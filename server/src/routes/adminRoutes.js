import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import {
  handleGetDashboard,
  handleGetOrders,
  handleUpdateOrderStatus,
  handleGetInventory,
  handleUpdateInventory,
} from '../controllers/adminController.js';

const router = Router();

// All admin routes require admin role
router.use(requireAdmin);

const updateOrderStatusSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['pending_whatsapp', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']),
    carrierName: z.string().trim().optional(),
    trackingNumber: z.string().trim().optional(),
    trackingUrl: z.string().url().optional(),
    adminNotes: z.string().trim().optional(),
  }),
};

const updateInventorySchema = {
  params: z.object({
    variantId: z.string().uuid(),
  }),
  body: z.object({
    quantityAvailable: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
  }),
};

// Admin Dashboard stats
router.get('/dashboard', handleGetDashboard);

// Admin Order Management
router.get('/orders', handleGetOrders);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), handleUpdateOrderStatus);

// Admin Inventory Management
router.get('/inventory', handleGetInventory);
router.patch('/inventory/:variantId', validate(updateInventorySchema), handleUpdateInventory);

export default router;
