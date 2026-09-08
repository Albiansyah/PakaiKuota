import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PKP = process.env.PKP_STATUS === 'true'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const url = new URL(request.url)
  const transactionId = url.searchParams.get('transactionId')
  if (!transactionId) return NextResponse.json({ error: 'transactionId required' }, { status: 400 })

  const { data: txn } = await (supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('user_id', user.id)
    .single() as any)
  if (!txn) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const subtotal = txn.amount_rupiah
  const ppn = PKP ? subtotal * 0.11 : 0
  const total = subtotal + ppn
  const invoiceNumber = `INV-${txn.id.slice(0, 8).toUpperCase()}`

  return NextResponse.json({
    invoice_number: invoiceNumber,
    date: txn.paid_at ?? txn.created_at,
    items: [{ description: 'Top-up saldo', amount: subtotal }],
    subtotal,
    ppn,
    ppn_included: !PKP,
    total,
  })
}
