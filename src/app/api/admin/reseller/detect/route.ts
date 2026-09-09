import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/rbac'

const RESELLER_THRESHOLD = 5_000_000

export async function GET() {
  const guard = await requireRole(['super_admin', 'support'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString()
  const { data } = await (supabase
    .from('transactions')
    .select('user_id, amount_rupiah')
    .eq('status', 'success')
    .gte('created_at', since))

  const totals: Record<string, number> = {}
  for (const t of data ?? []) {
    totals[t.user_id] = (totals[t.user_id] ?? 0) + t.amount_rupiah
  }

  const candidates = Object.entries(totals)
    .filter(([, v]) => v >= RESELLER_THRESHOLD)
    .map(([userId, volume]) => ({ userId, volume }))

  return NextResponse.json({ candidates })
}
