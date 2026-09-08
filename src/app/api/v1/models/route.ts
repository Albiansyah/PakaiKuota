import 'server-only';

import { NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/gateway/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const identity = await authenticateApiKey(request.headers.get('authorization') ?? '');
  if (!identity) {
    return NextResponse.json(
      { error: { code: 'INVALID_API_KEY', message: 'API key is invalid or revoked' } },
      { status: 401 },
    );
  }

  const { data, error } = await createSupabaseAdminClient()
    .from('models')
    .select('id, slug, name, input_price_per_1k, output_price_per_1k')
    .eq('enabled', true)
    .order('name');

  if (error) {
    return NextResponse.json(
      { error: { code: 'DATABASE_ERROR', message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({
    object: 'list',
    data: (data ?? []).map((model) => ({
      id: model.slug ?? model.name,
      object: 'model',
      owned_by: 'pakaikuota',
    })),
  });
}
