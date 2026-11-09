import { supabaseAdmin } from '../config/supabase.js';
import { successResponse } from '../utils/response.js';

let categoriesCache = null;
let categoriesCacheTime = 0;
const CATEGORIES_CACHE_TTL_MS = 60 * 1000;

export function clearCategoriesCache() {
  categoriesCache = null;
  categoriesCacheTime = 0;
}

export async function handleGetCategories(req, res, next) {
  try {
    const { mode } = req.query;

    if (!mode && categoriesCache && Date.now() - categoriesCacheTime < CATEGORIES_CACHE_TTL_MS) {
      res.set('Cache-Control', 'public, max-age=120, s-maxage=300, stale-while-revalidate=600');
      return successResponse(res, categoriesCache);
    }

    let query = supabaseAdmin
      .from('categories')
      .select('id, slug, name, mode, display_order')
      .order('display_order', { ascending: true });

    if (mode) {
      query = query.eq('mode', mode.toLowerCase());
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!mode) {
      categoriesCache = data || [];
      categoriesCacheTime = Date.now();
    }

    res.set('Cache-Control', 'public, max-age=120, s-maxage=300, stale-while-revalidate=600');
    return successResponse(res, data || []);
  } catch (err) {
    return next(err);
  }
}

