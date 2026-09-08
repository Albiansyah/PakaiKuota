import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseEnv } from '@/lib/env';

/**
 * Admin client — uses the SERVICE ROLE KEY, which BYPASSES ALL RLS.
 *
 * `import 'server-only'` makes the build fail if this module is ever imported
 * into a client bundle, so the service role key can never leak to the browser.
 *
 * Use ONLY for trusted server-side work that must ignore RLS:
 *   - Pakasir webhook credit
 *   - cron jobs (orphaned-hold sweep, forex-check)
 *   - the VPS New API gateway's billing RPC calls
 *
 * A new client is created per call (no shared mutable auth state).
 */
export function createSupabaseAdminClient(): SupabaseClient {
  const env = supabaseEnv();
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
