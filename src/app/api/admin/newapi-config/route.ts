import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/rbac'

export async function GET() {
  const guard = await requireRole(['super_admin'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = await createClient()
  const { data, error } = await supabase.from('newapi_config').select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ config: data })
}

export async function PATCH(request: Request) {
  const guard = await requireRole(['super_admin'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = await createClient()
  const payload = await request.json()
  const { error } = await supabase.from('newapi_config').upsert({ ...payload, id: 1 }, { onConflict: 'id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
