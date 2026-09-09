import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

const fields = 'id,slug,name,input_price_per_1k,output_price_per_1k,markup_percent,tier,enabled,created_at'

export async function GET() {
  const guard = await requireRole(['super_admin'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const db = createSupabaseAdminClient()
  const [{ data: models, error }, { data: config }] = await Promise.all([
    db.from('models').select(fields).order('name'),
    db.from('newapi_config').select('last_test_status,last_test_response_time_ms,last_test_error,last_tested_at').eq('id', 1).maybeSingle(),
  ])
  if (error) return NextResponse.json({ error: 'models_load_failed' }, { status: 500 })
  return NextResponse.json({ models, connection: config ?? null })
}

export async function POST(request: Request) {
  const guard = await requireRole(['super_admin'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body || typeof body.slug !== 'string' || typeof body.name !== 'string' || !['standard', 'premium', 'ultra'].includes(String(body.tier)) || !['input_price_per_1k', 'output_price_per_1k', 'markup_percent'].every((key) => typeof body[key] === 'number')) return NextResponse.json({ error: 'invalid_model' }, { status: 400 })
  const { data, error } = await createSupabaseAdminClient().from('models').insert({ slug: body.slug, name: body.name, tier: body.tier, input_price_per_1k: body.input_price_per_1k, output_price_per_1k: body.output_price_per_1k, markup_percent: body.markup_percent, enabled: body.enabled !== false }).select(fields).single()
  if (error) return NextResponse.json({ error: 'model_save_failed' }, { status: 400 })
  return NextResponse.json({ model: data }, { status: 201 })
}

export async function PATCH(request: Request) {
  const guard = await requireRole(['super_admin'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body || typeof body.modelId !== 'string') return NextResponse.json({ error: 'invalid_model' }, { status: 400 })
  const updates = Object.fromEntries(Object.entries(body).filter(([key]) => ['slug', 'name', 'tier', 'input_price_per_1k', 'output_price_per_1k', 'markup_percent', 'enabled'].includes(key)))
  const { data, error } = await createSupabaseAdminClient().from('models').update(updates).eq('id', body.modelId).select(fields).single()
  if (error) return NextResponse.json({ error: 'model_save_failed' }, { status: 400 })
  return NextResponse.json({ model: data })
}
