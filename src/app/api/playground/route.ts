import { NextResponse } from 'next/server';
import { createApiKey } from '@/lib/api-keys';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { serverEnv } from '@/lib/env';

export async function POST(request: Request) {
  const auth = await createSupabaseServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from('api_keys')
    .select('key_hash')
    .eq('user_id', user.id)
    .eq('name', 'Internal Playground')
    .is('revoked_at', null)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'playground_key_unrecoverable' }, { status: 409 });
  }

  const generated = createApiKey();
  const { error } = await admin.from('api_keys').insert({
    user_id: user.id,
    name: 'Internal Playground',
    key_prefix: generated.prefix,
    key_hash: generated.hash,
  });
  if (error) return NextResponse.json({ error: 'key_creation_failed' }, { status: 500 });
  const key = generated.plaintext;
  const env = serverEnv();
  const response = await fetch(new URL('/api/v1/chat/completions', env.appUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  return NextResponse.json(result, { status: response.status });
}
