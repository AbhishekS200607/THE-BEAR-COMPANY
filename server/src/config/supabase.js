import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Trusted backend Supabase client using service-role key.
 * Used for server-side transactions, inventory RPCs, and admin tasks.
 * NEVER exposed to client.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Public/Anon client for validating user JWT bearer tokens.
 */
export const supabaseAnon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
