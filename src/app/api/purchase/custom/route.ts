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
    const { token_amount, duration_days, nominal_rupiah } = body

    // Validation
    if (!token_amount || !duration_days || !nominal_rupiah) {
      return NextResponse.json(
        { error: "token_amount, duration_days, nominal_rupiah required" },
        { status: 400 }
      )
    }

    if (token_amount < 1000) {
      return NextResponse.json(
        { error: "Minimum token purchase is 1,000 tokens" },
        { status: 400 }
      )
    }

    if (duration_days < 1 || duration_days > 365) {
      return NextResponse.json(
        { error: "Duration must be between 1-365 days" },
        { status: 400 }
      )
    }

    if (nominal_rupiah < 1000) {
      return NextResponse.json(
        { error: "Minimum nominal is Rp 1,000" },
        { status: 400 }
      )
    }

    // Calculate with loyalty bonus and check competitiveness
    const { data: calc, error: calcError } = await (supabase
      .rpc('calculate_custom_purchase', {
        p_token_amount: token_amount,
        p_duration_days: duration_days,
        p_nominal_rupiah: nominal_rupiah,
        p_user_id: user.id
      }))

    if (calcError || !calc || calc.length === 0) {
      return NextResponse.json({ error: "Calculation failed" }, { status: 500 })
    }

    const c = calc[0]

    // Check if price is competitive (user pays enough)
    if (!c.is_competitive) {
      return NextResponse.json({
        error: "Nominal terlalu rendah untuk jumlah token dan durasi yang diminta",
        suggested_minimal: Math.ceil(c.token_amount * c.price_per_token),
        price_per_token: c.price_per_token
      }, { status: 400 })
    }

    // Create transaction
    const { data: transaction, error: txError } = await (supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount_rupiah: nominal_rupiah,
        token_amount: c.token_amount,
        bonus_tokens: c.bonus_tokens,
        purchase_type: 'custom',
        status: 'pending',
        custom_token_amount: token_amount,
        custom_duration_days: duration_days,
        loyalty_tier_at_purchase: c.loyalty_tier
      })
      .select()
      .single())

    if (txError) {
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
    }

    return NextResponse.json({
      transaction_id: transaction.id,
      amount: nominal_rupiah,
      token_amount: c.token_amount,
      bonus_tokens: c.bonus_tokens,
      total_tokens: c.total_tokens,
      duration_days: duration_days,
      loyalty_tier: c.loyalty_tier,
      bonus_percent: c.bonus_percent,
      price_per_token: c.price_per_token,
      payment_url: `/payment/${transaction.id}` // placeholder
    })

  } catch (error) {
    console.error('Custom purchase error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}