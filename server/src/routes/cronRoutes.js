import { Router } from 'express';
import { env } from '../config/env.js';
import { processPendingEmailOutbox } from '../services/emailService.js';
import { successResponse, errorResponse } from '../utils/response.js';

const router = Router();

/**
 * Middleware to verify Vercel Cron invocation authenticity.
 * Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` with cron requests.
 */
function verifyCronAuth(req, res, next) {
  if (env.CRON_SECRET) {
    const authHeader = req.headers['authorization'];
    const customHeader = req.headers['x-cron-secret'];
    const expected = `Bearer ${env.CRON_SECRET}`;

    if (authHeader !== expected && customHeader !== env.CRON_SECRET) {
      return errorResponse(res, 'Unauthorized cron invocation', 401);
    }
  }
  next();
}

/**
 * GET/POST /api/v1/cron/email-outbox
 * Processes queued transactional emails and retries failed deliveries (< 5 attempts).
 */
async function handleProcessEmailOutbox(req, res, next) {
  try {
    const result = await processPendingEmailOutbox({ limit: 25 });
    return successResponse(res, result, 200, 'Email outbox queue processed successfully');
  } catch (err) {
    return next(err);
  }
}

router.get('/email-outbox', verifyCronAuth, handleProcessEmailOutbox);
router.post('/email-outbox', verifyCronAuth, handleProcessEmailOutbox);

export default router;

