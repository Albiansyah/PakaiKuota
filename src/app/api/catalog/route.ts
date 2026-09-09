import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const db = createSupabaseAdminClient();
  const [packages, models] = await Promise.all([
    db.from('token_packages').select('id, name, description, token_amount, price_rupiah, bonus_percent, duration_days, sort_order').eq('is_active', true).order('sort_order'),
    db.from('models').select('id, slug, name, provider, group_name, tier, input_price_per_1k, output_price_per_1k').eq('enabled', true).order('group_name').order('name'),
  ]);
  if (packages.error || models.error) return NextResponse.json({ error: 'catalog_unavailable' }, { status: 500 });
  return NextResponse.json({ packages: packages.data ?? [], models: models.data ?? [] });
}
