import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

const FOREX_PROVIDER = process.env.FOREX_PROVIDER_URL || 'https://api.exchangerate.host/latest?base=USD&symbols=IDR'

function sign(p: string) {
  return createHash('sha256').update(p + (process.env.N8N_SECRET ?? '')).digest('hex')
}

export async function GET(request: Request) {
  if (request.headers.get('x-cron-key') !== process.env.CRON_KEY) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const res = await fetch(FOREX_PROVIDER)
  if (!res.ok) return NextResponse.json({ error: 'fetch failed' }, { status: 502 })
  const data = await res.json()
  const rate = data?.rates?.IDR
  if (!rate) return NextResponse.json({ error: 'no rate' }, { status: 502 })

  const supabase = await createClient()
  await (supabase.from('forex_history').insert({ base: 'USD', quote: 'IDR', rate }) as any)

  if (Math.abs(rate - (data.previous ?? rate)) / rate > 0.03) {
    const text = `FX drift >3%: USD/IDR=${rate}`
    const url = process.env.N8N_WEBHOOK_URL
    if (url) await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Signature': sign(text) },
      body: JSON.stringify({ source: 'pakaikuota', text }),
    })
  }
  return NextResponse.json({ rate })
}
