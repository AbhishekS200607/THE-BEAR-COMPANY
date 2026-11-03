import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/auth.js';
import { sensitiveRateLimiter } from '../middleware/rateLimiter.js';
import { handleCreateOrder, handleTrackOrder, handleConfirmOrder, handleCancelOrder } from '../controllers/orderController.js';

const router = Router();

const createOrderSchema = {
  body: z.object({
    items: z.array(
      z.object({
        variant_id: z.string().uuid('Invalid variant ID format'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 units per item'),
      })
    ).min(1, 'Order must contain at least 1 item').max(25, 'Maximum 25 items per order'),
    customerName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    customerPhone: z.string().trim().regex(/^[0-9]{10}$/, 'Must be a 10-digit mobile number'),
    deliveryLine1: z.string().trim().min(5, 'Address line 1 must be at least 5 characters').max(200),
    deliveryLine2: z.string().trim().max(200).optional().nullable(),
    deliveryCity: z.string().trim().min(2, 'City must be at least 2 characters').max(100),
    deliveryState: z.string().trim().min(2, 'State must be at least 2 characters').max(100),
    deliveryPincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, 'Must be a valid 6-digit Indian PIN code'),
    idempotencyKey: z.string().min(8, 'Idempotency key required').optional(),
  }),
};

const trackOrderSchema = {
  query: z.object({
    orderNumber: z.string().trim().min(5, 'Order number required'),
    phone: z.string().trim().min(10, 'Phone number required'),
  }),
};

// POST /api/v1/orders - Create an order request with inventory reservation
router.post('/', sensitiveRateLimiter, optionalAuth, validate(createOrderSchema), handleCreateOrder);

// GET /api/v1/orders/track - Protected guest order tracking
router.get('/track', sensitiveRateLimiter, validate(trackOrderSchema), handleTrackOrder);

// POST /api/v1/orders/:id/confirm - Admin / trusted backend order confirmation
router.post('/:id/confirm', handleConfirmOrder);

// POST /api/v1/orders/:id/cancel - Cancel pending reservation
router.post('/:id/cancel', handleCancelOrder);

export default router;
