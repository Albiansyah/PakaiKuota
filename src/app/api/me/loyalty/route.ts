import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user loyalty info from users table
  const { data: userData, error } = await (supabase
    .from("users")
    .select("loyalty_tier, total_purchased")
    .eq("id", user.id)
    .single())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get loyalty rules for bonus/discount info
  const { data: rules } = await (supabase
    .from("loyalty_rules")
    .select("*")
    .eq("tier", userData?.loyalty_tier || "bronze")
    .single())

  return NextResponse.json({
    tier: userData?.loyalty_tier || "bronze",
    total_purchased: userData?.total_purchased || 0,
    bonus_percent: rules?.purchase_bonus_percent || 0,
    discount_percent: rules?.package_discount_percent || 0,
  })
}
