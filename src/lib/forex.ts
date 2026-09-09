import { createClient } from '@/lib/supabase/server'

let cachedRate: { value: number; ts: number } | null = null
const TTL_MS = 60_000

export async function getUsdIdrRate(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.ts < TTL_MS) {
    return cachedRate.value
  }
  const supabase = await createClient()
  const { data } = await (supabase
    .from('settings')
    .select('value')
    .eq('key', 'usd_idr_rate')
    .single())
  const fallback = Number(process.env.FOREX_FALLBACK_RATE ?? '15000')
  const value = data ? Number(data.value) : fallback
  if (!data) console.warn(`Forex rate unavailable; using FOREX_FALLBACK_RATE=${fallback}`)
  cachedRate = { value, ts: Date.now() }
  return value
}