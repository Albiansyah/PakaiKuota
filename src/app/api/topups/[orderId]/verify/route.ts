import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { pakasirEnv } from "@/lib/env"
import { isGopayQrisActive, isPakasirActive } from "@/lib/payment-provider"

export async function POST(
  _request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const auth = await createSupabaseServerClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const { orderId } = await context.params
  const db = createSupabaseAdminClient()

  const { data: transaction, error } = await db
    .from("transactions")
    .select("id, user_id, order_id, amount_rupiah, status")
    .eq("order_id", orderId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { error: "transaction_lookup_failed" },
      { status: 500 }
    )
  }
  if (!transaction) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  /* ============================================================
     IDEMPOTENT — kalau sudah tidak pending, return status apa adanya
     ============================================================ */
  if (transaction.status === "success") {
    return NextResponse.json({ ok: true, status: "success" })
  }
  if (transaction.status === "awaiting_verification") {
    return NextResponse.json({
      ok: true,
      status: "awaiting_verification",
    })
  }
  if (transaction.status !== "pending") {
    return NextResponse.json({
      ok: true,
      status: transaction.status,
    })
  }

  /* ============================================================
     GOPAY QRIS — user hanya bisa mark "sudah bayar"
     Admin yang akan credit saldo setelah verifikasi.
     ============================================================ */
  if (isGopayQrisActive()) {
    const { error: updateError } = await db
      .from("transactions")
      .update({
        status: "awaiting_verification",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)

    if (updateError) {
      return NextResponse.json(
        { error: "update_failed" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      status: "awaiting_verification",
      message:
        "Pembayaran kamu sedang menunggu verifikasi admin. " +
        "Saldo akan masuk setelah admin konfirmasi.",
    })
  }

  /* ============================================================
     PAKASIR — flow lama (auto-verify ke Pakasir API)
     ============================================================ */
  if (isPakasirActive()) {
    const env = pakasirEnv()
    const detailUrl = new URL(
      "https://app.pakasir.com/api/transactiondetail"
    )
    detailUrl.search = new URLSearchParams({
      project: env.pakasirSlug,
      amount: String(transaction.amount_rupiah),
      order_id: transaction.order_id,
      api_key: env.pakasirApiKey,
    }).toString()

    const response = await fetch(detailUrl, { cache: "no-store" })
    if (!response.ok) {
      return NextResponse.json(
        { error: "pakasir_verify_failed" },
        { status: 502 }
      )
    }

    const payload = (await response.json()) as {
      transaction?: {
        status?: string
        amount?: number
        order_id?: string
        project?: string
      }
    }
    const verified = payload.transaction
    const paid =
      verified &&
      ["completed", "success", "paid"].includes(verified.status ?? "") &&
      verified.amount === transaction.amount_rupiah &&
      verified.order_id === transaction.order_id &&
      verified.project === env.pakasirSlug

    if (!paid) {
      return NextResponse.json({
        ok: true,
        status: transaction.status,
        verified: false,
      })
    }

    const { data: credited, error: creditError } = await db.rpc(
      "process_pakasir_payment",
      {
        p_order_id: transaction.order_id,
        p_amount_rupiah: transaction.amount_rupiah,
      }
    )

    if (creditError) {
      return NextResponse.json(
        { error: "credit_failed" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      status: credited === true ? "credited" : "pending",
      verified: true,
    })
  }

  return NextResponse.json(
    { error: "no_active_payment_provider" },
    { status: 500 }
  )
}