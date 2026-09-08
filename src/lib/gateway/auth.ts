import 'server-only';

import { hashApiKey } from '@/lib/api-keys';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function authenticateApiKey(value: string) {
  const key = value.startsWith('Bearer ') ? value.slice(7).trim() : value.trim();
  if (!key) return null;

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('api_keys')
    .select('id, user_id, revoked_at')
    .eq('key_hash', hashApiKey(key))
    .is('revoked_at', null)
    .maybeSingle();

  if (!data) return null;

  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);

  return { keyId: data.id, userId: data.user_id };
}
