import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type GatewayModel = {
  id: string;
  slug?: string;
  name?: string;
  input_price_per_1k: number;
  output_price_per_1k: number;
  markup_percent: number;
  enabled?: boolean;
};

export async function getGatewayModel(model: string): Promise<GatewayModel | null> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('models')
    .select('id, slug, name, input_price_per_1k, output_price_per_1k, markup_percent, enabled')
    .or(`slug.eq.${model},name.eq.${model}`)
    .maybeSingle();
  return data as GatewayModel | null;
}

export async function getLatestForexRate(): Promise<number | null> {
  const { data } = await createSupabaseAdminClient()
    .from('forex_history')
    .select('rate')
    .eq('base', 'USD')
    .eq('quote', 'IDR')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return typeof data?.rate === 'number' ? data.rate : null;
}

export async function authorizeRequest(args: {
  userId: string;
  modelId: string;
  estimatedCostUsd: number;
  forexRate: number;
  idempotencyKey: string | null;
}) {
  return createSupabaseAdminClient().rpc('authorize_request', {
    p_user_id: args.userId,
    p_model_id: args.modelId,
    p_estimated_cost_usd: args.estimatedCostUsd,
    p_forex_rate_at_hold: args.forexRate,
    p_idempotency_key: args.idempotencyKey ?? undefined,
  });
}

export async function finalizeRequest(args: {
  requestId: string;
  status: 'completed' | 'failed';
  actualCostUsd?: number;
  forexRate?: number;
  inputTokens?: number;
  outputTokens?: number;
}) {
  return createSupabaseAdminClient().rpc('finalize_request', {
    p_request_id: args.requestId,
    p_status: args.status,
    p_actual_cost_usd: args.actualCostUsd,
    p_forex_rate_used: args.forexRate,
    p_input_tokens: args.inputTokens,
    p_output_tokens: args.outputTokens,
  });
}
