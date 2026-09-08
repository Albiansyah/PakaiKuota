import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { pakasirEnv } from '@/lib/env';

const MIN_TOPUP_RUPIAH = 10_000;
const MAX_TOPUP_RUPIAH = 50_000_000;

export async function POST(request: Request) {
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { amount_rupiah?: number };
  const amount = body.amount_rupiah;
  if (
    typeof amount !== 'number' ||
    !Number.isInteger(amount) ||
    amount < MIN_TOPUP_RUPIAH ||
    amount > MAX_TOPUP_RUPIAH
  ) {
    return NextResponse.json(
      { error: 'amount must be an integer between 10000 and 50000000' },
      { status: 400 },
    );
  }

  const orderId = `PK-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  const admin = createSupabaseAdminClient();
  const { data: transactionId, error } = await admin.rpc('create_pending_topup', {
    p_user_id: user.id,
    p_order_id: orderId,
    p_amount_rupiah: amount,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const env = pakasirEnv();
    const paymentUrl = new URL(`https://app.pakasir.com/pay/${encodeURIComponent(env.pakasirSlug)}/${amount}`);
    paymentUrl.searchParams.set('order_id', orderId);
    paymentUrl.searchParams.set('redirect', `${env.appUrl}/topup/${encodeURIComponent(orderId)}/success`);
    return NextResponse.json({
      transaction_id: transactionId,
      order_id: orderId,
      amount_rupiah: amount,
      payment_provider: 'pakasir',
      payment: { order_id: orderId, amount, payment_url: paymentUrl.toString() },
    }, { status: 201 });
  } catch (paymentError) {
    return NextResponse.json(
      { error: paymentError instanceof Error ? paymentError.message : 'payment_creation_failed' },
      { status: 502 },
    );
  }
}
