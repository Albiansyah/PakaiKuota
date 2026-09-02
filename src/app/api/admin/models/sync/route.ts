import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { createClient } from '@/lib/supabase/server'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/models'

export async function POST() {
  const guard = await requireRole(['super_admin'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const res = await fetch(OPENROUTER_URL, {
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
  })
  if (!res.ok) return NextResponse.json({ error: 'OpenRouter fetch failed' }, { status: 502 })
  const data = await res.json()

  const supabase = await createClient()
  const tier = (pricing: number) => (pricing < 0.000001 ? 'murah' : pricing < 0.00001 ? 'menengah' : 'mahal')
  const markup = (t: string) => (t === 'murah' ? 1.9 : t === 'menengah' ? 1.55 : 1.35)

  for (const m of data.data ?? []) {
    const t = tier(parseFloat(m.pricing?.prompt ?? '0'))
    const upstream = parseFloat(m.pricing?.prompt ?? '0')
    await supabase.from('models').upsert({
      name: m.id,
      provider: 'openrouter',
      tier: t,
      is_active: true,
      upstream_price_per_token: upstream,
      markup_price_per_token: upstream * markup(t),
    }, { onConflict: 'name' })
  }

  return NextResponse.json({ synced: data.data?.length ?? 0 })
}
