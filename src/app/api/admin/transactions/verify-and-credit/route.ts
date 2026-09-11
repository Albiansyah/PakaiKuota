import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function POST(request: Request) {
  const context = await requireAdmin()
  if (!context) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    order_id?: string
  }
  const orderId = String(body.order_id ?? "").trim()

  if (!orderId) {
    return NextResponse.json(
      { error: "order_id_required" },
      { status: 400 }
    )
  }

  const { data, error } = await context.admin.rpc("verify_manual_topup", {
    p_order_id: orderId,
    p_admin_id: context.user.id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = data as {
    ok: boolean
    error?: string
    transaction_id?: string
    amount?: number
    user_id?: string
  } | null

  if (!result || !result.ok) {
    const errCode = result?.error ?? "verify_failed"
    const status = errCode === "ORDER_NOT_FOUND" ? 404 : 400
    return NextResponse.json(
      { error: errCode, ok: false },
      { status }
    )
  }

  return NextResponse.json({
    ok: true,
    transaction_id: result.transaction_id,
    amount: result.amount,
    user_id: result.user_id,
    message: "Pembayaran berhasil diverifikasi dan saldo sudah dikredit.",
  })
}