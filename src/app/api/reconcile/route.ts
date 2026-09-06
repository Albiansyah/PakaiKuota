import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRedis } from '@/lib/redis/client'

const DRIFT_THRESHOLD = 100 // rupiah

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: users } = await (supabase.from('users').select('id, balance_rupiah') as any)
  if (!users) return NextResponse.json({ reconciled: 0 })

  const redis = getRedis()
  let alerts = 0

  for (const u of users) {
    const cached = parseInt((await redis.get(`quota:${u.id}`)) ?? '0', 10)
    const diff = Math.abs(cached - u.balance_rupiah)
    if (diff > DRIFT_THRESHOLD) {
      // conservative: snap cache toward lower
      const corrected = Math.min(cached, u.balance_rupiah)
      await redis.set(`quota:${u.id}`, corrected)
      await (supabase.from('reconciliation_logs').insert({
        source: 'redis_vs_supabase',
        expected_amount: u.balance_rupiah,
        actual_amount: cached,
        difference: diff,
        status: 'alert',
        notes: `auto-corrected to ${corrected}`,
      }) as any)
      alerts++
    }
  }

  return NextResponse.json({ reconciled: users.length, alerts })
}
