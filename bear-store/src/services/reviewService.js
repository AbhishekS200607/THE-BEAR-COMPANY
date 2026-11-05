/**
 * BEAR Store — Review & Rating Engine
 * 
 * Manages authentic athlete reviews via backend REST API (/api/v1/reviews)
 * with real-time recalculation of star distribution, fit sentiment, and weighted ratings.
 */

import { API_V1 } from '../config/api.js';

const isUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const API_URL = `${API_V1}/reviews`;

const SEED_REVIEWS = [];

const STORAGE_PREFIX = 'bear_product_reviews_';

/**
 * Local cache fallback
 */
export function getProductReviews(productId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${productId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Local submission fallback
 */
export function submitProductReview(productId, review) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${productId}`);
    const existing = raw ? JSON.parse(raw) : [];
    const newEntry = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      author: review.author || 'Anonymous Athlete',
      rating: Number(review.rating) || 5,
      date: 'Just now',
      verified: true,
      fit: review.fit || 'True to Size',
      title: review.title || 'Verified Purchase Feedback',
      comment: review.comment || '',
      createdAt: new Date().toISOString(),
    };
    existing.unshift(newEntry);
    localStorage.setItem(`${STORAGE_PREFIX}${productId}`, JSON.stringify(existing));
    return newEntry;
  } catch (err) {
    console.error('Failed to store review:', err);
    return null;
  }
}

/**
 * Dynamically computes rating score, star distributions, and fit sentiment percentages.
 */
export function calculateReviewMetrics(reviews = []) {
  if (!reviews || reviews.length === 0) {
    return {
      averageRating: '0.0',
      totalCount: 0,
      fitSentiment: 'No athlete fit feedback yet',
      trueToSizePercent: 0,
      breakdown: [
        { stars: 5, count: 0, pct: 0 },
        { stars: 4, count: 0, pct: 0 },
        { stars: 3, count: 0, pct: 0 },
        { stars: 2, count: 0, pct: 0 },
        { stars: 1, count: 0, pct: 0 },
      ],
    };
  }

  const total = reviews.length;
  const sumRating = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
  const avg = (sumRating / total).toFixed(1);

  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let trueToSizeCount = 0;

  reviews.forEach((r) => {
    const star = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
    counts[star] = (counts[star] || 0) + 1;

    if (r.fit === 'True to Size' || !r.fit) {
      trueToSizeCount++;
    }
  });

  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = counts[stars] || 0;
    const pct = Math.round((count / total) * 100);
    return { stars, count, pct };
  });

  const trueToSizePct = Math.round((trueToSizeCount / total) * 100);

  return {
    averageRating: avg,
    totalCount: total,
    fitSentiment: `${trueToSizePct}% of buyers say "True to Size"`,
    trueToSizePercent: trueToSizePct,
    breakdown,
  };
}

/**
 * Fetches real reviews and metrics from the backend API, falling back to cache.
 */
export async function fetchProductReviews(productId) {
  if (!isUUID(productId)) {
    const fallback = getProductReviews(productId);
    return { reviews: fallback, metrics: calculateReviewMetrics(fallback) };
  }
  try {
    const res = await fetch(`${API_URL}?productId=${encodeURIComponent(productId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          reviews: json.data.reviews || [],
          metrics: json.data.metrics || calculateReviewMetrics(json.data.reviews),
        };
      }
    }
  } catch (err) {
    console.warn('[ReviewService] Backend fetch failed, falling back to local seed/cache:', err.message);
  }
  const fallback = getProductReviews(productId);
  return {
    reviews: fallback,
    metrics: calculateReviewMetrics(fallback),
  };
}

const MY_REVIEWS_KEY = 'bear_my_review_ids';

export function getMyReviewIds() {
  try {
    const raw = localStorage.getItem(MY_REVIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordMyReviewId(id) {
  if (!id) return;
  try {
    const ids = new Set(getMyReviewIds());
    ids.add(String(id));
    localStorage.setItem(MY_REVIEWS_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

export function removeMyReviewId(id) {
  if (!id) return;
  try {
    const ids = new Set(getMyReviewIds());
    ids.delete(String(id));
    localStorage.setItem(MY_REVIEWS_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

export function isMyReview(id) {
  if (!id) return false;
  return getMyReviewIds().includes(String(id));
}

/**
 * Dispatches verified review submission to the backend API and persists server-side.
 */
export async function postProductReview(productId, reviewData) {
  if (!isUUID(productId)) {
    const localRev = submitProductReview(productId, reviewData);
    if (localRev?.id) recordMyReviewId(localRev.id);
    const updatedReviews = getProductReviews(productId);
    return { review: localRev, metrics: calculateReviewMetrics(updatedReviews) };
  }
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        productName: reviewData.productName || 'BEAR Garment',
        author: reviewData.author,
        rating: Math.round(Number(reviewData.rating) || 5),
        fit: reviewData.fit || 'True to Size',
        title: reviewData.title,
        comment: reviewData.comment,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.review?.id) recordMyReviewId(json.data.review.id);
        return {
          review: json.data.review,
          metrics: json.data.metrics,
        };
      }
    }
  } catch (err) {
    console.warn('[ReviewService] Backend submission failed, saving locally:', err.message);
  }
  // Local fallback
  const localRev = submitProductReview(productId, reviewData);
  if (localRev?.id) recordMyReviewId(localRev.id);
  const updatedReviews = getProductReviews(productId);
  return {
    review: localRev,
    metrics: calculateReviewMetrics(updatedReviews),
  };
}

/**
 * Updates an existing review (customer re-edit).
 */
export async function updateProductReview(reviewId, productId, reviewData) {
  if (!isUUID(productId)) {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${productId}`);
      const list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(r => r.id === reviewId);
      if (idx !== -1) {
        Object.assign(list[idx], {
          rating: Math.round(Number(reviewData.rating) || list[idx].rating),
          fit: reviewData.fit || list[idx].fit,
          title: reviewData.title || list[idx].title,
          comment: reviewData.comment || list[idx].comment,
          author: reviewData.author || list[idx].author,
          updatedAt: new Date().toISOString(),
        });
        localStorage.setItem(`${STORAGE_PREFIX}${productId}`, JSON.stringify(list));
        return { review: list[idx], metrics: calculateReviewMetrics(getProductReviews(productId)) };
      }
    } catch {}
    return null;
  }

  try {
    const res = await fetch(`${API_URL}/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author: reviewData.author,
        rating: Math.round(Number(reviewData.rating) || 5),
        fit: reviewData.fit || 'True to Size',
        title: reviewData.title,
        comment: reviewData.comment,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          review: json.data.review,
          metrics: json.data.metrics,
        };
      }
    }
  } catch (err) {
    console.warn('[ReviewService] Update failed:', err.message);
  }
  return null;
}

/**
 * Deletes a review.
 */
export async function deleteProductReview(reviewId, productId) {
  removeMyReviewId(reviewId);

  if (!isUUID(productId)) {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${productId}`);
      const list = raw ? JSON.parse(raw) : [];
      const filtered = list.filter(r => r.id !== reviewId);
      localStorage.setItem(`${STORAGE_PREFIX}${productId}`, JSON.stringify(filtered));
      return { success: true, metrics: calculateReviewMetrics(getProductReviews(productId)) };
    } catch {}
    return { success: true, metrics: calculateReviewMetrics(getProductReviews(productId)) };
  }

  try {
    const res = await fetch(`${API_URL}/${reviewId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        return {
          success: true,
          metrics: json.data?.metrics,
        };
      }
    }
  } catch (err) {
    console.warn('[ReviewService] Delete failed:', err.message);
  }
  return { success: false };
}
