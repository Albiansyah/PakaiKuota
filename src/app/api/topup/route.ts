import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createQrisTransaction } from "@/lib/pakasir"
import { generateOrderId } from "@/lib/utils"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const { amount } = await request.json()
  if (!amount || amount < 1000) {
    return NextResponse.json({ error: "Minimum top-up Rp 1.000" }, { status: 400 })
  }

  const orderId = generateOrderId()

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    order_id: orderId,
    amount_rupiah: amount,
    status: "pending",
    payment_method: "qris",
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { paymentUrl, pakasirTxId } = await createQrisTransaction({ amount, orderId })

  // Update transaction with Pakasir details
  const { error: updError } = await supabase
    .from("transactions")
    .update({ pakasir_tx_id: pakasirTxId })
    .eq("order_id", orderId)

  if (updError) return NextResponse.json({ error: updError.message }, { status: 500 })

  return NextResponse.json({ orderId, paymentUrl })
}
