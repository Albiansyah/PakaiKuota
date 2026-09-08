import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/rbac'

export async function POST(request: Request) {
  const guard = await requireRole(['super_admin'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await request.json()
  const supabase = await createClient()

  // Anonymize PII; preserve financial records
  await (supabase.from('users').update({
    email: `deleted_${userId}@anonymized.local`,
    name: null,
    avatar_url: null,
  }).eq('id', userId) as any)

  await (supabase.from('api_keys').update({ is_active: false }).eq('user_id', userId) as any)
  await (supabase.from('admin_audit_logs').insert({
    admin_id: 'system',
    action: 'data_deletion',
    target_type: 'user',
    target_id: userId,
  }) as any)
  return NextResponse.json({ ok: true })
}
