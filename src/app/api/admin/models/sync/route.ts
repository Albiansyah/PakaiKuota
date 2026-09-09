import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const guard = await requireRole(['super_admin'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const db = createSupabaseAdminClient()
  const { data: config } = await db.from('newapi_config').select('base_url,api_key,is_active,markup_percent').eq('id', 1).maybeSingle()
  if (!config?.is_active || !config.base_url || !config.api_key) return NextResponse.json({ error: 'NewAPI config unavailable' }, { status: 502 })
  const response = await fetch(new URL('/v1/models', config.base_url), { headers: { Authorization: `Bearer ${config.api_key}` }, cache: 'no-store' })
  if (!response.ok) return NextResponse.json({ error: 'upstream_fetch_failed' }, { status: 502 })
  const payload = await response.json() as { data?: Array<{ id?: string; pricing?: { prompt?: string; completion?: string } }> }
  let synced = 0
  for (const item of payload.data ?? []) {
    if (!item.id) continue
    const input = Math.max(0, Number(item.pricing?.prompt ?? 0) * 1000)
    const output = Math.max(0, Number(item.pricing?.completion ?? item.pricing?.prompt ?? 0) * 1000)
    const tier = input < 0.01 ? 'standard' : input < 0.1 ? 'premium' : 'ultra'
    const { error } = await db.from('models').upsert({ slug: item.id, name: item.id, input_price_per_1k: input, output_price_per_1k: output, markup_percent: Number(config.markup_percent ?? 0), tier, enabled: true }, { onConflict: 'slug' })
    if (!error) synced++
  }
  return NextResponse.json({ synced })
}
