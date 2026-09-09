import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const guard = await requireRole(['super_admin'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const config = await createSupabaseAdminClient().from('newapi_config').select('base_url, api_key, is_active').eq('id', 1).maybeSingle()
  if (config.error || !config.data?.is_active || !config.data.base_url || !config.data.api_key) return NextResponse.json({ error: 'NewAPI config unavailable' }, { status: 502 })
  const res = await fetch(new URL('/v1/models', config.data.base_url), {
    headers: { Authorization: `Bearer ${config.data.api_key}` },
    cache: 'no-store',
  })
  if (!res.ok) return NextResponse.json({ error: 'OpenRouter fetch failed' }, { status: 502 })
  const data = await res.json()

  const supabase = createSupabaseAdminClient()
  const tier = (pricing: number) => (pricing < 0.000001 ? 'murah' : pricing < 0.00001 ? 'menengah' : 'mahal')
  const markup = (t: string) => (t === 'murah' ? 1.9 : t === 'menengah' ? 1.55 : 1.35)

  for (const m of data.data ?? []) {
    const t = tier(parseFloat(m.pricing?.prompt ?? '0'))
    const upstream = parseFloat(m.pricing?.prompt ?? '0')
    await (supabase.from('models').upsert({
      name: m.id,
      provider: 'newapi',
      tier: t,
      is_active: true,
      upstream_price_per_token: upstream,
      markup_price_per_token: upstream * markup(t),
    }, { onConflict: 'name' }))
  }

  return NextResponse.json({ synced: data.data?.length ?? 0 })
}
