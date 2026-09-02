import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/rbac'

export async function GET() {
  const guard = await requireRole(['super_admin'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const { data } = await supabase
    .from('reseller_applications')
    .select('*')
    .eq('status', 'pending')
  return NextResponse.json({ applications: data ?? [] })
}

export async function PATCH(request: Request) {
  const guard = await requireRole(['super_admin'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, decision } = await request.json()
  const supabase = await createClient()
  await supabase
    .from('reseller_applications')
    .update({ status: decision, decided_at: new Date().toISOString() })
    .eq('id', id)
  return NextResponse.json({ ok: true })
}
