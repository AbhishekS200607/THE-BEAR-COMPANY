import { supabaseAnon, supabaseAdmin } from '../config/supabase.js';
import { errorResponse } from '../utils/response.js';

// Short-lived in-memory cache to prevent hammering Supabase Auth endpoint on rapid bursts
const tokenCache = new Map();
const CACHE_TTL_MS = 30000; // 30 seconds

function getCachedAuth(token) {
  const cached = tokenCache.get(token);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached;
  }
  tokenCache.delete(token);
  return null;
}

function setCachedAuth(token, user, profile = null) {
  tokenCache.set(token, { user, profile, timestamp: Date.now() });
  // Clean up cache periodically
  if (tokenCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of tokenCache.entries()) {
      if (now - v.timestamp >= CACHE_TTL_MS) tokenCache.delete(k);
    }
  }
}

/**
 * Optional authentication middleware: Populates req.user if a valid token is provided.
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const cached = getCachedAuth(token);
    if (cached) {
      req.user = cached.user;
      return next();
    }
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
    req.user = (error || !user) ? null : user;
    if (req.user) setCachedAuth(token, req.user);
  } catch {
    req.user = null;
  }
  return next();
}

/**
 * Required Customer Authentication middleware
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const cached = getCachedAuth(token);
    if (cached) {
      req.user = cached.user;
      return next();
    }
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
    if (error || !user) {
      return errorResponse(res, 'Invalid or expired session', 401);
    }
    setCachedAuth(token, user);
    req.user = user;
    return next();
  } catch (err) {
    return errorResponse(res, 'Authentication failed', 401);
  }
}

/**
 * Required Admin Authorization middleware
 * Exclusively accepts cryptographic Supabase JWT tokens via Authorization: Bearer.
 * Verifies token signature/expiration via Supabase Auth.
 * Enforces admin/super_admin role directly from trusted public.profiles table.
 * Shared secrets and development bypasses are strictly prohibited.
 */
export async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const cached = getCachedAuth(token);
    if (cached?.profile) {
      req.user = cached.user;
      req.adminProfile = cached.profile;
      return next();
    }

    // 1. Verify Supabase JWT cryptographic signature and expiration
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user) {
      return errorResponse(res, 'Invalid or expired session', 401);
    }

    // 2. Verify admin role from trusted database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
      return errorResponse(res, 'Admin privileges required', 403);
    }

    setCachedAuth(token, user, profile);
    req.user = user;
    req.adminProfile = profile;
    return next();
  } catch (err) {
    return errorResponse(res, 'Authorization check failed', 401);
  }
}

/**
 * Required Super Admin Authorization middleware
 * Enforces strictly role === 'super_admin'. Managers with 'admin' role are rejected with 403.
 */
export async function requireSuperAdmin(req, res, next) {
  return requireAdmin(req, res, () => {
    if (req.adminProfile?.role !== 'super_admin') {
      return errorResponse(res, 'Super-admin privileges required for this action', 403);
    }
    next();
  });
}

