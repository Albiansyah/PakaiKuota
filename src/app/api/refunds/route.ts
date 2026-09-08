import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const userClient = await createSupabaseServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { amount_rupiah?: number; reason?: string };
  if (!Number.isInteger(body.amount_rupiah) || !body.amount_rupiah || !body.reason?.trim()) {
    return NextResponse.json({ error: 'amount_rupiah and reason are required' }, { status: 400 });
  }
  const { data, error } = await createSupabaseAdminClient()
    .from('refund_requests')
    .insert({ user_id: user.id, amount_rupiah: body.amount_rupiah, reason: body.reason.trim() })
    .select('id, amount_rupiah, reason, status, created_at')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ refund: data }, { status: 201 });
}

export async function GET() {
  const userClient = await createSupabaseServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data, error } = await createSupabaseAdminClient()
    .from('refund_requests')
    .select('id, amount_rupiah, reason, status, reviewed_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ refunds: data });
}
