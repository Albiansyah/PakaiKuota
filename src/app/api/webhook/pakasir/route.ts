import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  // Verify signature (HMAC SHA256)
  const secret = process.env.PAKASIR_WEBHOOK_SECRET || ''
  const rawBody = await request.clone().text()
  const crypto = await import('crypto')
  const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const signature = request.headers.get('pakasir-signature')
  if (signature !== hmac) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const payload = JSON.parse(rawBody)
  const { order_id, status } = payload

  // Idempotency: fetch transaction
  const supabase = await createClient()
  const { data: txn, error: txnErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('order_id', order_id)
    .single()

  if (txnErr || !txn) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }

  if (txn.status === 'success') {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  // Verify transaction with Pakasir API if status success
  if (status === 'success') {
    const apiKey = process.env.PAKASIR_API_KEY || ''
    const detailRes = await fetch(`https://api.pakasir.id/v2/transactions/${order_id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!detailRes.ok) {
      return NextResponse.json({ error: 'Failed to verify transaction' }, { status: 502 })
    }
    const detail = await detailRes.json()
    if (detail.status !== 'success') {
      return NextResponse.json({ error: 'Transaction not successful' }, { status: 400 })
    }

    // Get current user balance first
    const { data: currentUser, error: userErr } = await supabase
      .from('users')
      .select('balance_rupiah')
      .eq('id', txn.user_id)
      .single()

    if (userErr || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const newBalance = (currentUser.balance_rupiah ?? 0) + txn.amount_rupiah

    // Update user balance
    const { data: updatedUser } = await supabase
      .from('users')
      .update({ balance_rupiah: newBalance })
      .eq('id', txn.user_id)
      .select('balance_rupiah')
      .single()

    // mirror to Redis quota cache
    if (updatedUser) {
      try {
        const { getRedis } = await import('@/lib/redis/client')
        await getRedis().set(`quota:${txn.user_id}`, updatedUser.balance_rupiah)
      } catch {
        // Redis failure is non-fatal
      }
    }

    await supabase
      .from('transactions')
      .update({ status: 'success', paid_at: new Date().toISOString() })
      .eq('order_id', order_id)
  } else {
    await supabase
      .from('transactions')
      .update({ status })
      .eq('order_id', order_id)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
