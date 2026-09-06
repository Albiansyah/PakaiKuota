import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/rbac'

export async function GET() {
  const guard = await requireRole(['super_admin', 'support'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('models')
    .select('*')
    .order('tier', { ascending: true }) as any)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ models: data })
}

export async function PATCH(request: Request) {
  const guard = await requireRole(['super_admin'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { modelId, markup_price_per_token, is_active } = await request.json()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: old } = await (supabase
    .from('models')
    .select('markup_price_per_token')
    .eq('id', modelId)
    .single() as any)

  const { error } = await (supabase
    .from('models')
    .update({ markup_price_per_token, is_active })
    .eq('id', modelId) as any)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (old && old.markup_price_per_token !== markup_price_per_token) {
    await (supabase.from('model_markup_history').insert({
      model_id: modelId,
      old_markup: old.markup_price_per_token,
      new_markup: markup_price_per_token,
      changed_by: user.id,
    }) as any)
  }

  return NextResponse.json({ ok: true })
}
