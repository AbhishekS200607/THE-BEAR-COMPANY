import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import {
  handleGetProfile,
  handleUpdateProfile,
  handleGetAddresses,
  handleAddAddress,
  handleDeleteAddress,
  handleGetCustomerOrders,
} from '../controllers/customerController.js';

const router = Router();

// All customer routes require authentication
router.use(requireAuth);

const updateProfileSchema = {
  body: z.object({
    fullName: z.string().trim().min(2).max(100).optional(),
    phoneNumber: z.string().trim().regex(/^[0-9]{10}$/).optional(),
  }),
};

const addressSchema = {
  body: z.object({
    label: z.string().trim().default('Home'),
    fullName: z.string().trim().min(2),
    phoneNumber: z.string().trim().regex(/^[0-9]{10}$/),
    line1: z.string().trim().min(5),
    line2: z.string().trim().optional().nullable(),
    city: z.string().trim().min(2),
    state: z.string().trim().min(2),
    pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/),
    isDefault: z.boolean().optional(),
  }),
};

// Profile endpoints
router.get('/profile', handleGetProfile);
router.patch('/profile', validate(updateProfileSchema), handleUpdateProfile);

// Address endpoints
router.get('/addresses', handleGetAddresses);
router.post('/addresses', validate(addressSchema), handleAddAddress);
router.delete('/addresses/:id', handleDeleteAddress);

// Order history
router.get('/orders', handleGetCustomerOrders);

export default router;
