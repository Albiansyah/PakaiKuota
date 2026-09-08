import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

async function requireAdmin() {
  const auth = await createSupabaseServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from('users').select('role').eq('id', user.id).single();
  return data?.role === 'super_admin' ? { admin, user } : null;
}

export async function GET() {
  const context = await requireAdmin();
  if (!context) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { data, error } = await context.admin.from('models').select('*').order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ models: data });
}

export async function POST(request: Request) {
  const context = await requireAdmin();
  if (!context) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await request.json().catch(() => null) as {
    slug?: string; name?: string; tier?: string; input_price_per_1k?: number;
    output_price_per_1k?: number; markup_percent?: number; enabled?: boolean;
  } | null;
  if (!body?.slug || !body.name || !['standard', 'premium', 'ultra'].includes(body.tier ?? '') ||
      typeof body.input_price_per_1k !== 'number' || typeof body.output_price_per_1k !== 'number' ||
      typeof body.markup_percent !== 'number') {
    return NextResponse.json({ error: 'invalid_model' }, { status: 400 });
  }
  const { data, error } = await context.admin.from('models').insert(body).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ model: data }, { status: 201 });
}
