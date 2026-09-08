import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(_request: Request, context: { params: Promise<{ orderId: string }> }) {
  const auth = await createSupabaseServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { orderId } = await context.params;
  const { data, error } = await createSupabaseAdminClient()
    .from('transactions')
    .select('order_id, amount_rupiah, status, payment_method, payment_number, total_payment, expires_at, created_at')
    .eq('order_id', orderId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'transaction_lookup_failed' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ transaction: data }, { headers: { 'cache-control': 'no-store' } });
}
