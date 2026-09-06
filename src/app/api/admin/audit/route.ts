import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/rbac'

export async function GET(request: Request) {
  const guard = await requireRole(['super_admin', 'support'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('admin_audit_logs')
    .select(`
      *,
      admin:users!admin_id (
        id, name, email, role
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20) as any)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data })
}

export async function POST(request: Request) {
  const guard = await requireRole(['super_admin', 'support'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action, target_type, target_id, details } = await request.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { error } = await (supabase.from('admin_audit_logs').insert({
    admin_id: user.id,
    action,
    target_type,
    target_id,
    details,
  }) as any)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
