import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverEnv } from '@/lib/env'

// Default price per token in IDR (simplified - should come from database)
const PRICE_PER_TOKEN = 0.0001

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { model, prompt_tokens, completion_tokens } = await request.json()
  const totalTokens = (prompt_tokens ?? 0) + (completion_tokens ?? 0)
  const cost = Math.ceil(totalTokens * PRICE_PER_TOKEN)

  const { data: profile } = await (supabase
    .from('users')
    .select('is_suspended, spending_limit_hourly, spending_limit_daily, created_at')
    .eq('id', user.id)
    .single())

  if (profile?.is_suspended) {
    return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
  }

  const accountAgeHours = (Date.now() - new Date(profile?.created_at ?? Date.now()).getTime()) / 3600000
  const hourlyLimit = accountAgeHours < 48 ? 1000 : (profile?.spending_limit_hourly ?? 50000)
  const dailyLimit = accountAgeHours < 48 ? 5000 : (profile?.spending_limit_daily ?? 500000)

  const { data: deducted } = await (supabase.rpc('deduct_quota', {
    p_user_id: user.id,
    p_amount: cost,
    p_hourly_limit: hourlyLimit,
    p_daily_limit: dailyLimit,
  }))

  if (!deducted) {
    return NextResponse.json(
      { error: 'Quota exceeded or spending limit reached' },
      { status: 402 }
    )
  }

  const env = serverEnv()
  const resp = await fetch(env.upstreamChatCompletionsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.upstreamApiKey}`,
    },
    body: JSON.stringify({ model, prompt_tokens, completion_tokens }),
  })
  const data = await resp.json()

  // log usage
  await (supabase.from('usage_logs').insert({
    user_id: user.id,
    api_key_id: user.id,
    model,
    prompt_tokens: prompt_tokens ?? 0,
    completion_tokens: completion_tokens ?? 0,
    total_tokens: totalTokens,
    cost_rupiah: cost,
  }))

  return NextResponse.json(data)
}
