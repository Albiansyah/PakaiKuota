import 'server-only';

import { serverEnv } from '@/lib/env';

type CreatePaymentResponse = {
  payment?: {
    project?: string;
    order_id?: string;
    amount?: number;
    fee?: number;
    total_payment?: number;
    payment_method?: string;
    payment_number?: string;
    expired_at?: string;
  };
};

export async function createPakasirPayment(args: {
  method: string;
  orderId: string;
  amount: number;
}): Promise<NonNullable<CreatePaymentResponse['payment']>> {
  const env = serverEnv();
  const response = await fetch(`https://app.pakasir.com/api/transactioncreate/${encodeURIComponent(args.method)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      project: env.pakasirSlug,
      order_id: args.orderId,
      amount: args.amount,
      api_key: env.pakasirApiKey,
    }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`PAKASIR_CREATE_FAILED_${response.status}`);
  const data = (await response.json()) as CreatePaymentResponse;
  if (!data.payment?.order_id || !data.payment.expired_at) throw new Error('PAKASIR_INVALID_RESPONSE');
  return data.payment;
}
