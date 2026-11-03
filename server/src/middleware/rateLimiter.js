import rateLimit from 'express-rate-limit';

/**
 * Standard public rate limiter: 100 requests per 15 minutes
 */
export const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many requests, please try again later.' },
  },
});

/**
 * Sensitive endpoints limiter (Order creation, tracking): 15 attempts per 15 minutes
 */
export const sensitiveRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many order attempts from this IP, please try again after 15 minutes.' },
  },
});
