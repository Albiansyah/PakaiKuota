import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const { data } = await supabase.from('users').select('privacy_mode').eq('id', user.id).single()
  return NextResponse.json({ privacy_mode: data?.privacy_mode ?? false })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const { privacy_mode } = await request.json()
  await supabase.from('users').update({ privacy_mode }).eq('id', user.id)
  return NextResponse.json({ ok: true })
}
