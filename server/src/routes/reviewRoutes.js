import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  getStoredReviews,
  createStoredReview,
  calculateStoredReviewMetrics,
} from '../services/storePersistence.js';

const router = Router();

const createReviewSchema = {
  body: z.object({
    productId: z.string().trim().min(1, 'Product ID is required'),
    productName: z.string().trim().optional(),
    author: z.string().trim().min(2, 'Name must be at least 2 characters'),
    rating: z.number().int().min(1).max(5),
    fit: z.enum(['True to Size', 'Runs Slightly Large', 'Runs Slightly Small', 'Perfect Athletic Cut', 'Relaxed Oversized']).optional(),
    title: z.string().trim().min(2, 'Headline must be at least 2 characters'),
    comment: z.string().trim().min(5, 'Review feedback must be at least 5 characters'),
  }),
};

// GET /api/v1/reviews?productId=...
router.get('/', (req, res, next) => {
  try {
    const { productId, rating, search } = req.query;
    // Only published reviews for storefront users
    const reviews = getStoredReviews({
      productId: productId ? String(productId) : undefined,
      rating: rating ? Number(rating) : undefined,
      search: search ? String(search) : undefined,
      isPublished: true,
    });

    const metrics = calculateStoredReviewMetrics(reviews);
    return successResponse(res, {
      metrics,
      reviews,
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/v1/reviews (Storefront Customer Submission)
router.post('/', validate(createReviewSchema), (req, res, next) => {
  try {
    const { productId, productName, author, rating, fit, title, comment } = req.body;

    const review = createStoredReview({
      productId,
      productName: productName || 'BEAR Garment',
      author,
      rating,
      fit: fit || 'True to Size',
      title,
      comment,
      isVerified: true,
      isPublished: true, // auto-published verified athlete review
    });

    // Re-calculate updated metrics for this product
    const productReviews = getStoredReviews({ productId, isPublished: true });
    const metrics = calculateStoredReviewMetrics(productReviews);

    return successResponse(res, {
      review,
      metrics,
    }, 201, 'Thank you! Your verified athlete review has been published.');
  } catch (err) {
    return next(err);
  }
});

export default router;

