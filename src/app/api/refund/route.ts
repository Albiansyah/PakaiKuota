import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { transactionId, reason } = await request.json()
  const { data: txn } = await (supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('user_id', user.id)
    .single())

  if (!txn || txn.status !== 'success') {
    return NextResponse.json({ error: 'Invalid transaction' }, { status: 400 })
  }

  await (supabase.from('refund_requests').insert({
    user_id: user.id,
    transaction_id: transactionId,
    amount: txn.amount_rupiah,
    reason,
    status: 'pending',
  }))
  return NextResponse.json({ ok: true })
}
