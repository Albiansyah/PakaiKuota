import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

function sign(p: string) {
  return createHash('sha256').update(p + (process.env.N8N_SECRET ?? '')).digest('hex')
}

async function alert(text: string) {
  const url = process.env.N8N_WEBHOOK_URL
  if (!url) return
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Signature': sign(text) },
    body: JSON.stringify({ source: 'pakaikuota', text }),
  })
}

export async function POST() {
  const supabase = await createClient()
  const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString()
  const { data: logs } = await supabase
    .from('usage_logs')
    .select('user_id, cost_rupiah')
    .gte('created_at', since)

  const totals: Record<string, number> = {}
  for (const l of logs ?? []) totals[l.user_id] = (totals[l.user_id] ?? 0) + l.cost_rupiah

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, user_id, is_active, last_used_at')
    .lt('last_used_at', new Date(Date.now() - 180 * 86400 * 1000).toISOString())
    .eq('is_active', true)

  let autoRevoked = 0
  for (const k of keys ?? []) {
    await supabase.from('api_keys').update({ is_active: false }).eq('id', k.id)
    autoRevoked++
    await alert(`Auto-revoke key ${k.id} user ${k.user_id}: idle >6mo`)
  }

  return NextResponse.json({ autoRevoked, usersWithUsage: Object.keys(totals).length })
}
