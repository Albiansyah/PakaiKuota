import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/rbac'

const SUSPEND_THRESHOLD_IP = 5
const COST_SPIKE_HOURLY = 100000

export async function POST() {
  const guard = await requireRole(['super_admin', 'support'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const since = new Date(Date.now() - 3600 * 1000).toISOString()
  const { data: logs } = await (supabase
    .from('usage_logs')
    .select('user_id, api_key_id, cost_rupiah, request_metadata')
    .gte('created_at', since))

  if (!logs) return NextResponse.json({ flagged: 0 })

  const flags: Array<{ user_id: string; reason: string }> = []
  const byKey: Record<string, { cost: number; ips: Set<string> }> = {}

  for (const log of logs) {
    const k = log.api_key_id
    if (!k) continue
    byKey[k] = byKey[k] ?? { cost: 0, ips: new Set() }
    byKey[k].cost += log.cost_rupiah
    const ip = (log.request_metadata as { ip?: string } | null)?.ip
    if (ip) byKey[k].ips.add(ip)
  }

  for (const [key, info] of Object.entries(byKey)) {
    if (info.cost > COST_SPIKE_HOURLY) flags.push({ user_id: key, reason: 'cost_spike' })
    if (info.ips.size > SUSPEND_THRESHOLD_IP) flags.push({ user_id: key, reason: 'many_ips' })
  }

  return NextResponse.json({ flagged: flags.length, flags })
}
