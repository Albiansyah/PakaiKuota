import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { TOPUP_PACKAGES, usdPer1MFromPer1k } from "@/lib/pricing-config"

export async function GET() {
  const db = createSupabaseAdminClient()
  const { data: models, error } = await db
    .from("models")
    .select(
      "id, slug, name, provider, group_name, tier, input_price_per_1k, output_price_per_1k"
    )
    .eq("enabled", true)
    .order("group_name")
    .order("name")

  if (error) {
    return NextResponse.json(
      { error: "catalog_unavailable" },
      { status: 500 }
    )
  }

  const modelsWithDisplay = (models ?? []).map((m) => ({
    ...m,
    input_price_per_1m_usd: usdPer1MFromPer1k(m.input_price_per_1k ?? 0),
    output_price_per_1m_usd: usdPer1MFromPer1k(m.output_price_per_1k ?? 0),
  }))

  return NextResponse.json({
    packages: TOPUP_PACKAGES,
    models: modelsWithDisplay,
  })
}