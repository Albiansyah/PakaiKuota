import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

const ALLOWED_ROLES = ["super_admin", "support"]

async function requireAdmin() {
  const auth = await createSupabaseServerClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user) return { error: "unauthorized", status: 401 }

  const { data: profile } = await createSupabaseAdminClient()
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return { error: "forbidden", status: 403 }
  }
  return { error: null, status: 200 }
}

export async function GET(req: Request) {
  const check = await requireAdmin()
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const url = new URL(req.url)
  const startParam = url.searchParams.get("start")
  const endParam = url.searchParams.get("end")

  if (!startParam || !endParam) {
    return NextResponse.json(
      { error: "Parameter start & end wajib" },
      { status: 400 }
    )
  }

  // Panggil RPC via server client (pakai session user, RLS akan jalan)
  const auth = await createSupabaseServerClient()

  const { data: summary, error: err1 } = await auth.rpc("finance_summary", {
    p_start: startParam,
    p_end: endParam,
  })

  if (err1) {
    console.error("finance_summary error:", err1)
    return NextResponse.json({ error: err1.message }, { status: 500 })
  }

  const { data: breakdown, error: err2 } = await auth.rpc(
    "finance_model_breakdown",
    { p_start: startParam, p_end: endParam }
  )

  if (err2) {
    console.error("finance_model_breakdown error:", err2)
    return NextResponse.json({ error: err2.message }, { status: 500 })
  }

  const { data: trend, error: err3 } = await auth.rpc(
    "finance_daily_trend",
    { p_start: startParam, p_end: endParam }
  )

  if (err3) {
    console.error("finance_daily_trend error:", err3)
    return NextResponse.json({ error: err3.message }, { status: 500 })
  }

  return NextResponse.json({
    summary: summary ?? {},
    modelBreakdown: breakdown ?? [],
    dailyTrend: trend ?? [],
  })
}