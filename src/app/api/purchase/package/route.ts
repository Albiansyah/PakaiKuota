import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { package_id } = body

    if (!package_id) {
      return NextResponse.json({ error: "package_id required" }, { status: 400 })
    }

    // Get package with loyalty pricing
    const { data: pricing, error: priceError } = await (supabase
      .rpc('calculate_package_price', { p_package_id: package_id, p_user_id: user.id }))

    if (priceError || !pricing || pricing.length === 0) {
      return NextResponse.json({ error: "Package not found or inactive" }, { status: 404 })
    }

    const p = pricing[0]
    const finalPrice = p.final_price
    const totalTokens = p.token_amount + p.bonus_tokens

    // Create transaction record
    const { data: transaction, error: txError } = await (supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        package_id: package_id,
        amount_rupiah: finalPrice,
        token_amount: p.token_amount,
        bonus_tokens: p.bonus_tokens,
        purchase_type: 'package',
        status: 'pending',
        loyalty_tier_at_purchase: p.loyalty_tier
      })
      .select()
      .single())

    if (txError) {
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
    }

    // TODO: Integrate with Midtrans/Xendit to get payment URL
    // For now return transaction info for manual testing
    return NextResponse.json({
      transaction_id: transaction.id,
      amount: finalPrice,
      token_amount: p.token_amount,
      bonus_tokens: p.bonus_tokens,
      total_tokens: totalTokens,
      loyalty_tier: p.loyalty_tier,
      discount_percent: p.discount_percent,
      payment_url: `/payment/${transaction.id}` // placeholder
    })

  } catch (error) {
    console.error('Purchase package error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}