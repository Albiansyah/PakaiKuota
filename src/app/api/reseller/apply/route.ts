import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { business_name, business_phone, npwp } = await request.json()
  await (supabase.from('reseller_applications').insert({
    user_id: user.id,
    business_name,
    business_phone,
    npwp: npwp || null,
    status: 'pending',
  }))
  await (supabase.from('users').update({ business_name, business_phone, npwp: npwp || null }).eq('id', user.id))
  return NextResponse.json({ ok: true })
}
