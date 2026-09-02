import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

const MARGIN_FLOOR = 1.1 // 10% minimum margin

function sign(payload: string) {
  return createHash('sha256').update(payload + (process.env.N8N_SECRET ?? '')).digest('hex')
}

async function alertTelegram(text: string) {
  const url = process.env.N8N_WEBHOOK_URL
  if (!url) return
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Signature': sign(text) },
    body: JSON.stringify({ source: 'pakaikuota', text }),
  })
}

export async function GET(request: Request) {
  if (request.headers.get('x-cron-key') !== process.env.CRON_KEY) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = await createClient()
  const { data: models } = await supabase.from('models').select('*')
  if (!models) return NextResponse.json({ checked: 0 })

  const low: string[] = []
  for (const m of models) {
    const margin = m.markup_price_per_token / Math.max(m.upstream_price_per_token, 1e-12)
    if (margin < MARGIN_FLOOR) low.push(`${m.name}: margin ${margin.toFixed(2)}x`)
  }
  if (low.length) await alertTelegram(`Margin alert: ${low.join('; ')}`)

  return NextResponse.json({ checked: models.length, low: low.length })
}
