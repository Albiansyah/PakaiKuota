import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deductQuota } from '@/lib/redis/deduct'
import { checkAndRecordSpend } from '@/lib/redis/spend'

const PRICE_PER_TOKEN = 0.001 // placeholder

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { model, prompt_tokens, completion_tokens } = await request.json()
  const totalTokens = (prompt_tokens ?? 0) + (completion_tokens ?? 0)
  const cost = totalTokens * PRICE_PER_TOKEN

  const { data: profile } = await supabase
    .from('users')
    .select('is_suspended, spending_limit_hourly, spending_limit_daily, created_at')
    .eq('id', user.id)
    .single()

  if (profile?.is_suspended) {
    return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
  }

  const accountAgeHours = (Date.now() - new Date(profile?.created_at ?? Date.now()).getTime()) / 3600000
  const hourlyLimit = accountAgeHours < 48 ? 1000 : (profile?.spending_limit_hourly ?? 50000)
  const dailyLimit = accountAgeHours < 48 ? 5000 : (profile?.spending_limit_daily ?? 500000)

  const withinHourly = await checkAndRecordSpend(user.id, cost, 3600, hourlyLimit)
  if (!withinHourly) return NextResponse.json({ error: 'Hourly limit exceeded' }, { status: 429 })

  const withinDaily = await checkAndRecordSpend(user.id, cost, 86400, dailyLimit)
  if (!withinDaily) return NextResponse.json({ error: 'Daily limit exceeded' }, { status: 429 })

  const ok = await deductQuota(user.id, cost)
  if (!ok) return NextResponse.json({ error: 'Insufficient quota' }, { status: 402 })

  // forward to New API
  const resp = await fetch('https://newapi.example.com/v1/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt_tokens, completion_tokens }),
  })
  const data = await resp.json()

  // log usage
  await supabase.from('usage_logs').insert({
    user_id: user.id,
    api_key_id: user.id, // simplified: per-user not per-key here
    model,
    prompt_tokens: prompt_tokens ?? 0,
    completion_tokens: completion_tokens ?? 0,
    total_tokens: totalTokens,
    cost_rupiah: cost,
  })

  return NextResponse.json(data)
}
