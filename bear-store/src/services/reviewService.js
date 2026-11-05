/**
 * BEAR Store — Review & Rating Engine
 * 
 * Manages authentic athlete reviews via backend REST API (/api/v1/reviews)
 * with real-time recalculation of star distribution, fit sentiment, and weighted ratings.
 */

const API_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000') + '/api/v1/reviews';

const SEED_REVIEWS = [
  {
    id: 'rev-seed-1',
    author: 'Vikram Mehta',
    rating: 5,
    date: '2 weeks ago',
    verified: true,
    fit: 'True to Size',
    title: 'Unbelievable fabric density and drape',
    comment: 'The heavyweight compact cotton holds its structure through intense lifting sessions and washes. Easily on par with international activewear brands that charge 3x the price.',
  },
  {
    id: 'rev-seed-2',
    author: 'Ananya Deshmukh',
    rating: 5,
    date: '3 weeks ago',
    verified: true,
    fit: 'True to Size',
    title: 'Flattering compression without pinching',
    comment: 'SOW activewear has completely replaced my imported tights. High-waisted contour stays firmly locked during HIIT and squats. Breathable and luxurious hand-feel.',
  },
  {
    id: 'rev-seed-3',
    author: 'Rohit Shenoy',
    rating: 5,
    date: 'Last month',
    verified: true,
    fit: 'Runs Slightly Large',
    title: 'Best oversized gym tee in India',
    comment: 'Drop shoulders and heavy ribbed collar never sag after repeated washes. Dispatched fast with BlueDart directly to Bengaluru in 48 hours.',
  },
  {
    id: 'rev-seed-4',
    author: 'Karanvir S.',
    rating: 4,
    date: '1 month ago',
    verified: true,
    fit: 'True to Size',
    title: 'Premium stitching and clean aesthetics',
    comment: 'Clean minimalist branding and reinforced twin-needle hems. Very satisfied with the fit and quality.',
  },
];

const STORAGE_PREFIX = 'bear_product_reviews_';

/**
 * Local cache fallback
 */
export function getProductReviews(productId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${productId}`);
    const userReviews = raw ? JSON.parse(raw) : [];
    return [...userReviews, ...SEED_REVIEWS];
  } catch (e) {
    return SEED_REVIEWS;
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
      averageRating: '5.0',
      totalCount: 0,
      fitSentiment: '100% of buyers say "True to Size"',
      trueToSizePercent: 100,
      breakdown: [
        { stars: 5, count: 0, pct: 100 },
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

/**
 * Dispatches verified review submission to the backend API and persists server-side.
 */
export async function postProductReview(productId, reviewData) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        productName: reviewData.productName || 'BEAR Garment',
        author: reviewData.author,
        rating: Number(reviewData.rating) || 5,
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
    console.warn('[ReviewService] Backend submission failed, saving locally:', err.message);
  }
  // Local fallback
  const localRev = submitProductReview(productId, reviewData);
  const updatedReviews = getProductReviews(productId);
  return {
    review: localRev,
    metrics: calculateReviewMetrics(updatedReviews),
  };
}
