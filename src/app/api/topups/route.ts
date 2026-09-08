import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createPakasirPayment } from '@/lib/pakasir/client';
import { isPakasirMethod } from '@/lib/pakasir/methods';

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

  const method = new URL(request.url).searchParams.get('method') ?? 'qris';
  if (!isPakasirMethod(method)) {
    return NextResponse.json({ error: 'unsupported_pakasir_method' }, { status: 400 });
  }

  try {
    const payment = await createPakasirPayment({ method, orderId, amount });
    const paymentUpdate = await admin.rpc('mark_topup_payment', {
      p_transaction_id: transactionId,
      p_payment_method: payment.payment_method ?? method,
      p_payment_number: payment.payment_number ?? '',
      p_fee: payment.fee ?? 0,
      p_total_payment: payment.total_payment ?? amount,
      p_expires_at: payment.expired_at,
    });
    if (paymentUpdate.error) throw new Error(paymentUpdate.error.message);

    return NextResponse.json({
      transaction_id: transactionId,
      order_id: orderId,
      amount_rupiah: amount,
      payment_provider: 'pakasir',
      payment,
    }, { status: 201 });
  } catch (paymentError) {
    return NextResponse.json(
      { error: paymentError instanceof Error ? paymentError.message : 'payment_creation_failed' },
      { status: 502 },
    );
  }
}
