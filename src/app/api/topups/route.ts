import { randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { pakasirEnv } from "@/lib/env"
import {
  isGopayQrisActive,
  isPakasirActive,
  getGopayQrisConfig,
} from "@/lib/payment-provider"

const MIN_TOPUP_RUPIAH = 10_000
const MAX_TOPUP_RUPIAH = 50_000_000

export async function POST(request: Request) {
  const authClient = await createSupabaseServerClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    amount_rupiah?: number
  }
  const amount = body.amount_rupiah
  if (
    typeof amount !== "number" ||
    !Number.isInteger(amount) ||
    amount < MIN_TOPUP_RUPIAH ||
    amount > MAX_TOPUP_RUPIAH
  ) {
    return NextResponse.json(
      {
        error:
          "amount must be an integer between 10000 and 50000000",
      },
      { status: 400 }
    )
  }

  const orderId = `PK-${Date.now()
    .toString(36)
    .toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`

  const admin = createSupabaseAdminClient()
  const { data: transactionId, error } = await admin.rpc(
    "create_pending_topup",
    {
      p_user_id: user.id,
      p_order_id: orderId,
      p_amount_rupiah: amount,
    }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  /* ============================================================
     GOPAY QRIS — flow baru
     ============================================================ */
  if (isGopayQrisActive()) {
    try {
      const config = getGopayQrisConfig()

      // Simpan payment_method di transaksi
      await admin
        .from("transactions")
        .update({
          payment_method: "gopay_qris",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transactionId)

      return NextResponse.json(
        {
          transaction_id: transactionId,
          order_id: orderId,
          amount_rupiah: amount,
          payment_provider: "gopay_qris",
          payment: {
            order_id: orderId,
            amount,
            status: "pending",
            qris_url: config.qrisUrl,
            merchant_name: config.merchantName,
            merchant_id: config.merchantId,
            instructions: config.instructions,
          },
        },
        { status: 201 }
      )
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "gopay_qris_creation_failed",
        },
        { status: 502 }
      )
    }
  }

  /* ============================================================
     PAKASIR — flow lama (dipertahankan untuk re-enable nanti)
     ============================================================ */
  if (isPakasirActive()) {
    try {
      const env = pakasirEnv()
      const paymentUrl = new URL(
        `https://app.pakasir.com/pay/${encodeURIComponent(
          env.pakasirSlug
        )}/${amount}`
      )
      paymentUrl.searchParams.set("order_id", orderId)
      paymentUrl.searchParams.set(
        "redirect",
        `${env.appUrl}/topup/${encodeURIComponent(orderId)}/success`
      )

      await admin
        .from("transactions")
        .update({
          payment_method: "pakasir",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transactionId)

      return NextResponse.json(
        {
          transaction_id: transactionId,
          order_id: orderId,
          amount_rupiah: amount,
          payment_provider: "pakasir",
          payment: {
            order_id: orderId,
            amount,
            payment_url: paymentUrl.toString(),
          },
        },
        { status: 201 }
      )
    } catch (paymentError) {
      return NextResponse.json(
        {
          error:
            paymentError instanceof Error
              ? paymentError.message
              : "payment_creation_failed",
        },
        { status: 502 }
      )
    }
  }

  // Fallback — seharusnya tidak terjadi
  return NextResponse.json(
    { error: "no_active_payment_provider" },
    { status: 500 }
  )
}