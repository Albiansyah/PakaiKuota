/**
 * Centralized, validated environment access.
 *
 * Split by trust boundary:
 *  - publicEnv: safe to reference anywhere (NEXT_PUBLIC_*).
 *  - serverEnv(): server-only secrets. Throws if called where it shouldn't be,
 *    and never bundles the service role key into client code.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const publicEnv = {
  supabaseUrl: required(
    'NEXT_PUBLIC_SUPABASE_URL',
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: required(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
};

/**
 * Server-only secrets. Accessing these from a Client Component will throw,
 * because `process.env.SUPABASE_SERVICE_ROLE_KEY` is undefined in the browser
 * bundle (it is not prefixed with NEXT_PUBLIC_).
 */
function assertServer() {
  if (typeof window !== 'undefined') {
    throw new Error('Server environment accessed from client.');
  }
}

export function supabaseEnv() {
  assertServer();
  return {
    supabaseUrl: publicEnv.supabaseUrl,
    supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

export function serverEnv() {
  assertServer();
  return {
    supabaseUrl: publicEnv.supabaseUrl,
    supabaseServiceRoleKey: required(
      'SUPABASE_SERVICE_ROLE_KEY',
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    pakasirSlug: required('PAKASIR_SLUG', process.env.PAKASIR_SLUG),
    pakasirApiKey: required('PAKASIR_API_KEY', process.env.PAKASIR_API_KEY),
    appUrl: required('APP_URL', process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL),
    upstreamChatCompletionsUrl: required(
      'UPSTREAM_CHAT_COMPLETIONS_URL',
      process.env.UPSTREAM_CHAT_COMPLETIONS_URL,
    ),
    upstreamApiKey: required('UPSTREAM_API_KEY', process.env.UPSTREAM_API_KEY),
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  };
}

export function pakasirEnv() {
  assertServer();
  return {
    pakasirSlug: required('PAKASIR_SLUG', process.env.PAKASIR_SLUG),
    pakasirApiKey: required('PAKASIR_API_KEY', process.env.PAKASIR_API_KEY),
    appUrl: required('APP_URL', process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL),
  };
}
