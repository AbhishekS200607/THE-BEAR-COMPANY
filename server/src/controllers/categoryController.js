import { supabaseAdmin } from '../config/supabase.js';
import { successResponse } from '../utils/response.js';

export async function handleGetCategories(req, res, next) {
  try {
    const { mode } = req.query;
    let query = supabaseAdmin
      .from('categories')
      .select('id, slug, name, mode, display_order')
      .order('display_order', { ascending: true });

    if (mode) {
      query = query.eq('mode', mode.toLowerCase());
    }

    const { data, error } = await query;
    if (error) throw error;

    return successResponse(res, data || []);
  } catch (err) {
    return next(err);
  }
}
