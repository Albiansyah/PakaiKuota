import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/rbac'

export async function GET() {
  const guard = await requireRole(['super_admin', 'support'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('id, user_id, order_id, amount_rupiah, status, payment_method, paid_at, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ transactions: data })
}

export async function PATCH(request: Request) {
  const guard = await requireRole(['super_admin', 'support'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { transactionId, action } = await request.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: txn } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single()

  if (!txn) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'refund') {
    if (guard.role === 'support' && txn.amount_rupiah > 100000) {
      return NextResponse.json({ error: 'Nominal exceeds support limit' }, { status: 403 })
    }
    await supabase
      .from('transactions')
      .update({ status: 'refunded', refunded_amount: txn.amount_rupiah })
      .eq('id', transactionId)
    await supabase
      .from('users')
      .update({ balance_rupiah: 0 })
      .eq('id', txn.user_id)
  }

  await supabase.from('admin_audit_logs').insert({
    admin_id: user.id,
    action,
    target_type: 'transaction',
    target_id: transactionId,
  })

  return NextResponse.json({ ok: true })
}
