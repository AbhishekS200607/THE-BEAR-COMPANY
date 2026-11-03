/**
 * Standardized API Response Helpers
 */

export function successResponse(res, data, statusCode = 200, message = 'Success') {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(res, message, statusCode = 400, details = null) {
  const payload = {
    success: false,
    error: {
      message,
    },
  };

  if (details && process.env.NODE_ENV !== 'production') {
    payload.error.details = details;
  }

  return res.status(statusCode).json(payload);
}
