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
  const value = data ? Number(data.value) : 15000
  cachedRate = { value, ts: Date.now() }
  return value
}