import { errorResponse } from '../utils/response.js';

/**
 * Global Express Error Handler
 */
export function errorHandler(err, req, res, next) {
  // Handle JSON parsing syntax errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 'Malformed JSON in request body', 400);
  }

  console.error('[API Error]:', {
    method: req.method,
    url: req.originalUrl,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  if (err.name === 'ZodError') {
    return errorResponse(res, 'Validation failed', 422, err.errors);
  }

  const statusCode = err.statusCode || 500;
  const message = err.isPublic || statusCode < 500 ? err.message : 'Internal server error';

  return errorResponse(res, message, statusCode, err.details);
}
