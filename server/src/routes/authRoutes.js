import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { sensitiveRateLimiter } from '../middleware/rateLimiter.js';
import { supabaseAdmin, supabaseAnon } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { requestOtp, verifyOtp, resendOtp } from '../services/otpService.js';
import { encryptPassword, decryptPassword } from '../utils/crypto.js';

const router = Router();

const signupSchema = {
  body: z.object({
    email: z.string().trim().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
    phoneNumber: z.string().trim().regex(/^[0-9]{10}$/, 'Must be a 10-digit mobile number').optional().nullable(),
  }),
};

const signupVerifyOtpSchema = {
  body: z.object({
    email: z.string().trim().email('Invalid email address'),
    otp: z.string().trim().length(6, 'Verification code must be 6 digits'),
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

// POST /api/v1/auth/signup/request-otp - Stage pending signup with encrypted password & dispatch OTP
router.post('/signup/request-otp', sensitiveRateLimiter, validate(signupSchema), async (req, res, next) => {
  try {
    const { email, password, fullName, phoneNumber } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    // 1. Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      return errorResponse(res, 'An account with this email already exists. Try signing in instead.', 409);
    }

    // 2. Encrypt password with server secret (AES-256-GCM)
    const encrypted = encryptPassword(password);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // 3. Persist encrypted staging record
    const { error: stageErr } = await supabaseAdmin
      .from('pending_signups')
      .upsert(
        {
          email: cleanEmail,
          full_name: fullName.trim(),
          phone_number: phoneNumber ? phoneNumber.trim() : null,
          encrypted_password: encrypted.ciphertext,
          password_iv: encrypted.iv,
          password_tag: encrypted.tag,
          expires_at: expiresAt,
        },
        { onConflict: 'email' }
      );

    if (stageErr) {
      console.error('[AuthRoutes] Staging signup error:', stageErr.message);
      return errorResponse(res, 'Failed to prepare signup request. Please try again.', 500);
    }

    // 4. Atomically dispatch 6-digit verification OTP
    const otpResult = await requestOtp(cleanEmail, 'verification');
    if (!otpResult.success) {
      const status = otpResult.cooldownSeconds ? 429 : 502;
      return errorResponse(res, otpResult.error || 'Failed to dispatch verification email', status, {
        cooldownSeconds: otpResult.cooldownSeconds,
      });
    }

    return successResponse(
      res,
      {
        message: 'A 6-digit verification code has been dispatched to your email.',
        email: cleanEmail,
      },
      200
    );
  } catch (err) {
    return next(err);
  }
});

// POST /api/v1/auth/signup/verify-otp - Atomically verify OTP, create Supabase account & auto-sign in
router.post('/signup/verify-otp', sensitiveRateLimiter, validate(signupVerifyOtpSchema), async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    // 1. Fetch pending signup record
    const { data: pending, error: pendingErr } = await supabaseAdmin
      .from('pending_signups')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (pendingErr || !pending) {
      return errorResponse(res, 'No pending signup found for this email, or the request has expired. Please sign up again.', 404);
    }

    if (new Date(pending.expires_at).getTime() < Date.now()) {
      try {
        await supabaseAdmin.from('pending_signups').delete().eq('email', cleanEmail);
      } catch {}
      return errorResponse(res, 'Signup request has expired. Please sign up again.', 400);
    }

    // 2. Atomically verify OTP via PostgreSQL
    const otpResult = await verifyOtp(cleanEmail, otp, 'verification');
    if (!otpResult.success) {
      return errorResponse(res, otpResult.error || 'Invalid verification code.', 400, {
        attemptsRemaining: otpResult.attemptsRemaining,
      });
    }

    // 3. Decrypt password
    let plainPassword;
    try {
      plainPassword = decryptPassword({
        ciphertext: pending.encrypted_password,
        iv: pending.password_iv,
        tag: pending.password_tag,
      });
    } catch (decryptErr) {
      console.error('[AuthRoutes] Password decryption error:', decryptErr.message);
      return errorResponse(res, 'Authentication validation failure. Please restart signup.', 500);
    }

    // 4. Create user in Supabase Auth ONLY AFTER successful OTP verification
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: plainPassword,
      email_confirm: true,
      user_metadata: { full_name: pending.full_name },
    });

    if (createError) {
      if (createError.message?.toLowerCase().includes('already registered') || createError.message?.toLowerCase().includes('already exists')) {
        try {
          await supabaseAdmin.from('pending_signups').delete().eq('email', cleanEmail);
        } catch {}
        return errorResponse(res, 'An account with this email already exists. Try signing in instead.', 409);
      }
      return errorResponse(res, createError.message || 'Failed to create account', 400);
    }

    const userId = userData.user?.id;
    if (!userId) {
      return errorResponse(res, 'User creation failed', 500);
    }

    // 5. Upsert customer profile in public.profiles
    await supabaseAdmin.from('profiles').upsert({
      id: userId,
      email: cleanEmail,
      full_name: pending.full_name,
      phone_number: pending.phone_number || null,
      role: 'customer',
      updated_at: new Date().toISOString(),
    });

    // 6. Link eligible guest orders matching this mobile number
    if (pending.phone_number) {
      const cleanPhone = pending.phone_number.replace(/[^0-9]/g, '').slice(-10);
      if (cleanPhone) {
        await supabaseAdmin
          .from('orders')
          .update({ profile_id: userId })
          .is('profile_id', null)
          .eq('customer_phone', cleanPhone);
      }
    }

    // 7. Delete consumed pending signup record
    try {
      await supabaseAdmin.from('pending_signups').delete().eq('email', cleanEmail);
    } catch {}

    // 8. Immediately sign in to generate session tokens
    const { data: authData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: cleanEmail,
      password: plainPassword,
    });

    if (signInError || !authData.session) {
      return successResponse(res, { user: userData.user, session: null }, 201, 'Account created and verified successfully');
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

