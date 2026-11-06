import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { sensitiveRateLimiter } from '../middleware/rateLimiter.js';
import { supabaseAdmin, supabaseAnon } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { requestOtp, verifyOtp, resendOtp } from '../services/otpService.js';

const router = Router();

const signupSchema = {
  body: z.object({
    email: z.string().trim().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
    phoneNumber: z.string().trim().regex(/^[0-9]{10}$/, 'Must be a 10-digit mobile number').optional().nullable(),
  }),
};

const otpRequestSchema = {
  body: z.object({
    email: z.string().trim().email('Invalid email address'),
    purpose: z.enum(['verification', 'login', 'password_reset']).optional().default('verification'),
  }),
};

const otpVerifySchema = {
  body: z.object({
    email: z.string().trim().email('Invalid email address'),
    otp: z.string().trim().length(6, 'Verification code must be 6 digits'),
    purpose: z.enum(['verification', 'login', 'password_reset']).optional().default('verification'),
  }),
};

// POST /api/v1/auth/email-otp/request - Request 6-digit email OTP
router.post('/email-otp/request', sensitiveRateLimiter, validate(otpRequestSchema), async (req, res, next) => {
  try {
    const { email, purpose } = req.body;
    const result = await requestOtp(email, purpose);
    if (!result.success) {
      const status = result.cooldownSeconds ? 429 : 400;
      return errorResponse(res, result.error, status, { cooldownSeconds: result.cooldownSeconds });
    }
    return successResponse(res, { message: result.message, testMode: result.testMode }, 200, result.message);
  } catch (err) {
    return next(err);
  }
});

// POST /api/v1/auth/email-otp/verify - Verify 6-digit email OTP
router.post('/email-otp/verify', sensitiveRateLimiter, validate(otpVerifySchema), async (req, res, next) => {
  try {
    const { email, otp, purpose } = req.body;
    const result = await verifyOtp(email, otp, purpose);
    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }
    return successResponse(res, { verified: true, message: result.message }, 200, result.message);
  } catch (err) {
    return next(err);
  }
});

// POST /api/v1/auth/email-otp/resend - Resend 6-digit email OTP
router.post('/email-otp/resend', sensitiveRateLimiter, validate(otpRequestSchema), async (req, res, next) => {
  try {
    const { email, purpose } = req.body;
    const result = await resendOtp(email, purpose);
    if (!result.success) {
      const status = result.cooldownSeconds ? 429 : 400;
      return errorResponse(res, result.error, status, { cooldownSeconds: result.cooldownSeconds });
    }
    return successResponse(res, { message: result.message, testMode: result.testMode }, 200, result.message);
  } catch (err) {
    return next(err);
  }
});

// POST /api/v1/auth/signup - Register customer account with immediate pre-confirmation
router.post('/signup', sensitiveRateLimiter, validate(signupSchema), async (req, res, next) => {
  try {
    const { email, password, fullName, phoneNumber } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    // 1. Create user in Supabase Auth with auto-confirmed email (bypasses third-party SMTP rate limit)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      if (createError.message?.toLowerCase().includes('already registered') || createError.message?.toLowerCase().includes('already exists')) {
        return errorResponse(res, 'An account with this email already exists. Try signing in instead.', 409);
      }
      return errorResponse(res, createError.message || 'Failed to create account', 400);
    }

    const userId = userData.user?.id;
    if (!userId) {
      return errorResponse(res, 'User creation failed', 500);
    }

    // 2. Upsert customer profile in public.profiles table
    await supabaseAdmin.from('profiles').upsert({
      id: userId,
      full_name: fullName,
      phone_number: phoneNumber || null,
      role: 'customer',
      updated_at: new Date().toISOString(),
    });

    // 2.1 Automatically link existing guest orders matching this mobile number
    if (phoneNumber) {
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
      if (cleanPhone) {
        await supabaseAdmin
          .from('orders')
          .update({ profile_id: userId })
          .is('profile_id', null)
          .eq('customer_phone', cleanPhone);
      }
    }

    // 3. Immediately sign in to generate a valid cryptographic session
    const { data: authData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (signInError || !authData.session) {
      // Fallback: user was created, return user object
      return successResponse(res, { user: userData.user, session: null }, 201, 'Account created successfully');
    }

    return successResponse(
      res,
      {
        user: authData.user,
        session: authData.session,
      },
      201,
      'Account created and signed in successfully'
    );
  } catch (err) {
    return next(err);
  }
});

export default router;

