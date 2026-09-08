import 'server-only';

import { NextResponse } from 'next/server';
import { pakasirEnv } from '@/lib/env';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type PakasirWebhook = {
  amount?: number;
  order_id?: string;
  project?: string;
};

type PakasirTransactionDetail = {
  transaction?: {
    amount?: number;
    order_id?: string;
    project?: string;
    status?: string;
  };
};

/**
 * Pakasir webhook is only a trigger. The Transaction Detail API is the source
 * of truth because Pakasir does not provide HMAC signatures or webhook secrets.
 */
export async function POST(request: Request) {
  const payload = (await request.json()) as PakasirWebhook;
  const { order_id: orderId, amount: webhookAmount, project } = payload;

  if (!orderId || typeof webhookAmount !== 'number') {
    return NextResponse.json(
      { error: { code: 'INVALID_PAYLOAD', message: 'Missing order_id or amount' } },
      { status: 400 },
    );
  }

  const env = pakasirEnv();
  if (project && project !== env.pakasirSlug) {
    return NextResponse.json({ error: { code: 'PROJECT_MISMATCH' } }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .select('id, user_id, amount_rupiah, status, order_id')
    .eq('order_id', orderId)
    .maybeSingle();

  if (transactionError) {
    return NextResponse.json(
      { error: { code: 'DATABASE_ERROR', message: transactionError.message } },
      { status: 500 },
    );
  }
  if (!transaction) {
    return NextResponse.json({ error: { code: 'ORDER_NOT_FOUND' } }, { status: 404 });
  }

  if (transaction.status !== 'pending') {
    return NextResponse.json({ ok: true, alreadyProcessed: true }, { status: 200 });
  }

  if (webhookAmount !== transaction.amount_rupiah) {
    return NextResponse.json({ error: { code: 'AMOUNT_MISMATCH' } }, { status: 400 });
  }

  const detailUrl = new URL('https://app.pakasir.com/api/transactiondetail');
  detailUrl.search = new URLSearchParams({
    project: env.pakasirSlug,
    amount: String(transaction.amount_rupiah),
    order_id: transaction.order_id,
    api_key: env.pakasirApiKey,
  }).toString();

  let detail: PakasirTransactionDetail;
  try {
    const response = await fetch(detailUrl, { cache: 'no-store' });
    if (!response.ok) {
      return NextResponse.json({ error: { code: 'PAKASIR_VERIFY_FAILED' } }, { status: 502 });
    }
    detail = (await response.json()) as PakasirTransactionDetail;
  } catch {
    return NextResponse.json({ error: { code: 'PAKASIR_UNAVAILABLE' } }, { status: 502 });
  }

  const verified = detail.transaction;
  if (
    !verified ||
    verified.status !== 'completed' ||
    verified.amount !== transaction.amount_rupiah ||
    verified.order_id !== transaction.order_id ||
    verified.project !== env.pakasirSlug
  ) {
    return NextResponse.json({ ok: true, verified: false }, { status: 200 });
  }

  const { data: credited, error: creditError } = await supabase.rpc(
    'process_pakasir_payment',
    {
      p_order_id: transaction.order_id,
      p_amount_rupiah: transaction.amount_rupiah,
    },
  );

  if (creditError) {
    return NextResponse.json(
      { error: { code: 'CREDIT_FAILED', message: creditError.message } },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { ok: true, credited: credited === true, alreadyProcessed: credited === false },
    { status: 200 },
  );
}
