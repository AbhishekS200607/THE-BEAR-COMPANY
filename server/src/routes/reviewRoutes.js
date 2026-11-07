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
    author: z.string().trim().min(1).default('Athlete'),
    rating: z.coerce.number().int().min(1).max(5).default(5),
    fit: z.string().trim().optional().default('True to Size'),
    title: z.string().trim().optional().default('Verified Athlete Review'),
    comment: z.string().trim().min(1).default('Verified athletic fit.'),
  }),
};

const updateReviewSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Review ID is required'),
  }),
  body: z.object({
    author: z.string().trim().optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    fit: z.string().trim().optional(),
    title: z.string().trim().optional(),
    comment: z.string().trim().optional(),
  }),
};

// GET /api/v1/reviews?productId=...&page=1&limit=10&rating=5&fit=True+to+Size&verified=true&sort=newest
router.get('/', (req, res, next) => {
  try {
    const { productId, rating, fit, verified, sort, search } = req.query;
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    // Enforce strict bounded limit (max 50, default 10)
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '10'), 10) || 10));

    // 1. Calculate authoritative product metrics over all published reviews for this product
    const allProductReviews = getStoredReviews({
      productId: productId ? String(productId) : undefined,
      isPublished: true,
    });
    const metrics = calculateStoredReviewMetrics(allProductReviews);

    // 2. Apply active filters & sorting
    const isVerifiedBool = verified !== undefined && verified !== '' ? verified === 'true' || verified === true : undefined;
    const filteredReviews = getStoredReviews({
      productId: productId ? String(productId) : undefined,
      rating: rating ? Number(rating) : undefined,
      fit: fit ? String(fit) : undefined,
      isVerified: isVerifiedBool,
      sort: sort ? String(sort) : 'newest',
      search: search ? String(search) : undefined,
      isPublished: true,
    });

    // 3. Paginate
    const total = filteredReviews.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedReviews = filteredReviews.slice(startIndex, startIndex + limit);
    const hasNextPage = startIndex + limit < total;

    return successResponse(res, {
      metrics,
      reviews: paginatedReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
      },
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

