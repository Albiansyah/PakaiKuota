import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const { data, error } = await createSupabaseAdminClient()
    .from('models')
    .select('id, slug, name, tier, input_price_per_1k, output_price_per_1k, markup_percent')
    .eq('enabled', true)
    .order('tier')
    .order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ models: data });
}
