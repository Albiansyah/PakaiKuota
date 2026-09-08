import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { publicEnv } from '@/lib/env';
import type { Database } from '@/types/supabase';

/**
 * Server-side client bound to the request's auth cookies (anon key).
 * Use in Server Components, Route Handlers, and Server Actions where the
 * action should run AS THE LOGGED-IN USER (RLS applies).
 *
 * For privileged, RLS-bypassing work (VPS gateway, webhooks, cron) use the
 * admin client instead.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component — safe to ignore when
            // middleware is responsible for refreshing the session.
          }
        },
      },
    },
  );
}

export { createSupabaseServerClient as createClient };
