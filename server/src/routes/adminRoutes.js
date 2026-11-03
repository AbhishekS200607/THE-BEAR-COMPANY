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
  handleCreateProduct,
  handleUpdateProduct,
  handleGetCustomers,
  handleGetDiscounts,
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

const createProductSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(150),
    mode: z.enum(['bear', 'sow']),
    categoryName: z.string().trim().min(2),
    price: z.number().positive(),
    compareAtPrice: z.number().positive().optional(),
    description: z.string().trim().min(5),
    isFeatured: z.boolean().optional(),
    isBestseller: z.boolean().optional(),
    isNew: z.boolean().optional(),
  }),
};

const updateProductSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().trim().min(2).max(150).optional(),
    categoryName: z.string().trim().min(2).optional(),
    price: z.number().positive().optional(),
    compareAtPrice: z.number().positive().optional(),
    description: z.string().trim().min(5).optional(),
    isFeatured: z.boolean().optional(),
    isBestseller: z.boolean().optional(),
    isNew: z.boolean().optional(),
    isActive: z.boolean().optional(),
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

// Admin Product Management
router.post('/products', validate(createProductSchema), handleCreateProduct);
router.patch('/products/:id', validate(updateProductSchema), handleUpdateProduct);

// Admin Customers Directory
router.get('/customers', handleGetCustomers);

// Admin Discounts & Coupons
router.get('/discounts', handleGetDiscounts);

export default router;
