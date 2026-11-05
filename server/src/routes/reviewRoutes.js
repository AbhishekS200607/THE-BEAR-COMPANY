import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  getStoredReviews,
  createStoredReview,
  updateStoredReview,
  deleteStoredReview,
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

const updateReviewSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Review ID is required'),
  }),
  body: z.object({
    author: z.string().trim().min(2).optional(),
    rating: z.number().int().min(1).max(5).optional(),
    fit: z.enum(['True to Size', 'Runs Slightly Large', 'Runs Slightly Small', 'Perfect Athletic Cut', 'Relaxed Oversized']).optional(),
    title: z.string().trim().min(2, 'Headline must be at least 2 characters').optional(),
    comment: z.string().trim().min(5, 'Review feedback must be at least 5 characters').optional(),
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

// PATCH /api/v1/reviews/:id (Customer Edit Review)
router.patch('/:id', validate(updateReviewSchema), (req, res, next) => {
  try {
    const { id } = req.params;
    const { author, rating, fit, title, comment } = req.body;

    const updated = updateStoredReview(id, {
      ...(author ? { author } : {}),
      ...(rating !== undefined ? { rating } : {}),
      ...(fit ? { fit } : {}),
      ...(title ? { title } : {}),
      ...(comment ? { comment } : {}),
    });

    if (!updated) {
      return errorResponse(res, 404, 'Review not found');
    }

    const productReviews = getStoredReviews({ productId: updated.productId, isPublished: true });
    const metrics = calculateStoredReviewMetrics(productReviews);

    return successResponse(res, {
      review: updated,
      metrics,
    }, 200, 'Review updated successfully.');
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/v1/reviews/:id (Customer Delete Review)
router.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const all = getStoredReviews();
    const existing = all.find((r) => r.id === id);
    if (!existing) {
      return errorResponse(res, 404, 'Review not found');
    }

    const productId = existing.productId;
    const deleted = deleteStoredReview(id);
    if (!deleted) {
      return errorResponse(res, 404, 'Review not found');
    }

    const productReviews = getStoredReviews({ productId, isPublished: true });
    const metrics = calculateStoredReviewMetrics(productReviews);

    return successResponse(res, {
      deleted: true,
      id,
      metrics,
    }, 200, 'Review deleted successfully.');
  } catch (err) {
    return next(err);
  }
});

export default router;

