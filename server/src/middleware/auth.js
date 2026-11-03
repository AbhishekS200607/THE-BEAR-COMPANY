import { supabaseAnon, supabaseAdmin } from '../config/supabase.js';
import { errorResponse } from '../utils/response.js';

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
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
    if (error || !user) {
      req.user = null;
    } else {
      req.user = user;
    }
  } catch (err) {
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
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
    if (error || !user) {
      return errorResponse(res, 'Invalid or expired session', 401);
    }
    req.user = user;
    return next();
  } catch (err) {
    return errorResponse(res, 'Authentication failed', 401);
  }
}

/**
 * Required Admin Authorization middleware
 */
export async function requireAdmin(req, res, next) {
  await requireAuth(req, res, async () => {
    try {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', req.user.id)
        .single();

      if (error || !profile || !['admin', 'super_admin'].includes(profile.role)) {
        return errorResponse(res, 'Admin privileges required', 403);
      }

      req.adminProfile = profile;
      return next();
    } catch (err) {
      return errorResponse(res, 'Authorization check failed', 403);
    }
  });
}
