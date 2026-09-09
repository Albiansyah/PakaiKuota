import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { error_code, order_id } = await request.json()
  if (error_code !== 'upstream_failure') {
    return NextResponse.json({ skipped: true })
  }

  const supabase = await createClient()
  const { data: txn } = await (supabase
    .from('transactions')
    .select('*')
    .eq('order_id', order_id)
    .single())

  if (!txn) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (txn.status !== 'success') return NextResponse.json({ skipped: true })

  // mark as auto-refunded (manual reconciliation still logged)
  await (supabase.from('refund_requests').insert({
    user_id: txn.user_id,
    transaction_id: txn.id,
    amount: txn.amount_rupiah,
    reason: 'auto: upstream failure',
    status: 'pending',
  }))
  return NextResponse.json({ ok: true })
}
