import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('models')
    .select('id, name, provider, tier, is_active, upstream_price_per_token, markup_price_per_token')
    .eq('is_active', true)
    .order('tier', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ models: data })
}
