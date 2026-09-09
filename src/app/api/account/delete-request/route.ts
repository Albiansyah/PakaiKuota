import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { reason } = await request.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  await (supabase.from('data_deletion_requests').insert({
    user_id: user.id,
    reason,
    status: 'pending',
  }))
  return NextResponse.json({ ok: true })
}
