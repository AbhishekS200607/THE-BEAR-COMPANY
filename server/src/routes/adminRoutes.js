import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/auth.js';
import {
  handleGetAdminMe,
  handleGetDashboard,
  handleGetOrders,
  handleUpdateOrderStatus,
  handleGetInventory,
  handleUpdateInventory,
  handleBulkImportInventory,
  handleCreateProduct,
  handleUpdateProduct,
  handleArchiveProduct,
  handleGetAdminProducts,
  handleGetCategories,
  handleCreateCategory,
  handleUpdateCategory,
  handleDeleteCategory,
  handleGetCustomers,
  handleUpdateCustomerNotes,
  handleGetDiscounts,
  handleCreateDiscount,
  handleUpdateDiscount,
  handleDeleteDiscount,
  handleGetPromotions,
  handleSavePromotions,
  handleGetSettings,
  handleSaveSettings,
  handleGetStaff,
  handleInviteStaff,
  handleRevokeStaff,
  handleGetAuditLogs,
  handleGetNotifications,
  handleMarkNotificationsRead,
  handleUploadImage,
} from '../controllers/adminController.js';

const router = Router();

// All admin routes strictly require valid admin JWT authentication
router.use(requireAdmin);

// 0. Authenticated Admin Profile & Roles
router.get('/me', handleGetAdminMe);

const updateOrderStatusSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['pending_whatsapp', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']),
    carrierName: z.string().trim().optional().nullable(),
    trackingNumber: z.string().trim().optional().nullable(),
    trackingUrl: z.string().url().optional().nullable(),
    adminNotes: z.string().trim().optional().nullable(),
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

const bulkImportInventorySchema = {
  body: z.object({
    items: z.array(z.object({
      sku: z.string().trim().min(1).optional(),
      variantId: z.string().uuid().optional(),
      quantityAvailable: z.number().int().min(0),
      lowStockThreshold: z.number().int().min(0).optional(),
    })).min(1, 'At least one inventory item is required'),
  }),
};

const createProductSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(150),
    mode: z.enum(['bear', 'sow']),
    category: z.string().trim().min(2).optional(),
    categoryName: z.string().trim().min(2).optional(),
    price: z.number().positive(),
    comparePrice: z.number().positive().optional().nullable(),
    compareAtPrice: z.number().positive().optional().nullable(),
    description: z.string().trim().min(5),
    colours: z.array(z.string().trim()).optional(),
    sizes: z.array(z.string().trim()).optional(),
    images: z.array(z.string().trim()).optional(),
    skuBase: z.string().trim().optional(),
    isPublished: z.boolean().optional(),
    isActive: z.boolean().optional(),
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
    category: z.string().trim().min(2).optional(),
    categoryName: z.string().trim().min(2).optional(),
    price: z.number().positive().optional(),
    comparePrice: z.number().positive().optional().nullable(),
    compareAtPrice: z.number().positive().optional().nullable(),
    description: z.string().trim().min(5).optional(),
    mode: z.enum(['bear', 'sow']).optional(),
    images: z.array(z.string().trim()).optional(),
    isPublished: z.boolean().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isBestseller: z.boolean().optional(),
    isNew: z.boolean().optional(),
  }),
};

const createCategorySchema = {
  body: z.object({
    name: z.string().trim().min(2).max(100),
    mode: z.enum(['bear', 'sow']),
    slug: z.string().trim().min(2).max(100).optional(),
    displayOrder: z.number().int().min(0).optional(),
  }),
};

const updateCategorySchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    mode: z.enum(['bear', 'sow']).optional(),
    slug: z.string().trim().min(2).max(100).optional(),
    displayOrder: z.number().int().min(0).optional(),
  }),
};

const updateCustomerNotesSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    notes: z.string().trim().optional().default(''),
  }),
};

const createDiscountSchema = {
  body: z.object({
    code: z.string().trim().min(2).max(30),
    type: z.enum(['percentage', 'fixed']).default('percentage'),
    value: z.number().positive(),
    minOrder: z.number().min(0).optional(),
    min_order: z.number().min(0).optional(),
    usageLimit: z.number().int().min(1).optional(),
    usage_limit: z.number().int().min(1).optional(),
    isActive: z.boolean().optional(),
    is_active: z.boolean().optional(),
    expiresAt: z.string().optional(),
  }),
};

const updateDiscountSchema = {
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    isActive: z.boolean().optional(),
    is_active: z.boolean().optional(),
    value: z.number().positive().optional(),
    type: z.enum(['percentage', 'fixed']).optional(),
    minOrder: z.number().min(0).optional(),
    min_order: z.number().min(0).optional(),
    usageLimit: z.number().int().min(1).optional(),
    usage_limit: z.number().int().min(1).optional(),
  }),
};

// 1. Dashboard
router.get('/dashboard', handleGetDashboard);

// 2. Orders
router.get('/orders', handleGetOrders);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), handleUpdateOrderStatus);

// 3. Inventory
router.get('/inventory', handleGetInventory);
router.post('/inventory/import', validate(bulkImportInventorySchema), handleBulkImportInventory);
router.patch('/inventory/:variantId', validate(updateInventorySchema), handleUpdateInventory);

// 4. Products & Categories
router.get('/categories', handleGetCategories);
router.post('/categories', validate(createCategorySchema), handleCreateCategory);
router.patch('/categories/:id', validate(updateCategorySchema), handleUpdateCategory);
router.delete('/categories/:id', handleDeleteCategory);

router.get('/products', handleGetAdminProducts);
router.post('/products', validate(createProductSchema), handleCreateProduct);
router.patch('/products/:id', validate(updateProductSchema), handleUpdateProduct);
router.delete('/products/:id', handleArchiveProduct);
router.post('/upload-image', handleUploadImage);

// 5. Customers
router.get('/customers', handleGetCustomers);
router.patch('/customers/:id', validate(updateCustomerNotesSchema), handleUpdateCustomerNotes);

// 6. Discounts & Coupons
router.get('/discounts', handleGetDiscounts);
router.post('/discounts', validate(createDiscountSchema), handleCreateDiscount);
router.patch('/discounts/:id', validate(updateDiscountSchema), handleUpdateDiscount);
router.delete('/discounts/:id', handleDeleteDiscount);

// 7. Promotions
router.get('/promotions', handleGetPromotions);
router.put('/promotions', handleSavePromotions);
router.patch('/promotions', handleSavePromotions);

// 8. Settings (Super Admin Only)
router.get('/settings', requireSuperAdmin, handleGetSettings);
router.put('/settings', requireSuperAdmin, handleSaveSettings);
router.patch('/settings', requireSuperAdmin, handleSaveSettings);

// 9. Staff & Roles (Super Admin Only)
router.get('/staff', requireSuperAdmin, handleGetStaff);
router.post('/staff/invite', requireSuperAdmin, validate({
  body: z.object({
    email: z.string().email(),
    role: z.enum(['admin', 'super_admin']).default('admin'),
  }),
}), handleInviteStaff);
router.delete('/staff/:id', requireSuperAdmin, handleRevokeStaff);
router.get('/audit-logs', requireSuperAdmin, handleGetAuditLogs);

// 10. Notifications
router.get('/notifications', handleGetNotifications);
router.post('/notifications/mark-read', handleMarkNotificationsRead);

export default router;
