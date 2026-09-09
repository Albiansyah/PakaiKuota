import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const admin = createSupabaseAdminClient();
  const permanent = new URL(request.url).searchParams.get('permanent') === 'true';
  if (permanent) {
    const { data, error } = await admin
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .not('revoked_at', 'is', null)
      .select('id')
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'not_found_or_active' }, { status: 404 });
    return NextResponse.json({ ok: true });
  }
  const { data, error } = await admin
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
