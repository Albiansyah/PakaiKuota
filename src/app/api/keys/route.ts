import { NextResponse } from 'next/server';
import { createApiKey } from '@/lib/api-keys';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('api_keys')
    .select('id, name, key_prefix, revoked_at, last_used_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: data });
}

export async function POST(request: Request) {
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { name?: string };
  const name = body.name?.trim() || 'Default key';
  if (name.length > 100) {
    return NextResponse.json({ error: 'invalid_name' }, { status: 400 });
  }

  const key = createApiKey();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('api_keys')
    .insert({
      user_id: user.id,
      name,
      key_prefix: key.prefix,
      key_hash: key.hash,
    })
    .select('id, name, key_prefix, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ key: key.plaintext, record: data }, { status: 201 });
}
