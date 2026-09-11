import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

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
  const start = url.searchParams.get("start")
  const end = url.searchParams.get("end")
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 100)

  const supabase = createSupabaseAdminClient()

  // Topups (success only)
  let topupQuery = supabase
    .from("transactions")
    .select("id, user_id, order_id, amount_rupiah, status, payment_method, paid_at, created_at")
    .order("paid_at", { ascending: false })
    .limit(limit)

  if (start) topupQuery = topupQuery.gte("paid_at", start)
  if (end) topupQuery = topupQuery.lt("paid_at", end)

  const { data: topups } = await topupQuery

  // AI usage (completed)
  let usageQuery = supabase
    .from("ai_usage_logs")
    .select("id, user_id, model, input_tokens, output_tokens, total_tokens, cost_rupiah, cost_usd, created_at, status")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (start) usageQuery = usageQuery.gte("created_at", start)
  if (end) usageQuery = usageQuery.lt("created_at", end)

  const { data: usage } = await usageQuery

  // Expenses
  let expenseQuery = supabase
    .from("admin_expenses")
    .select("id, category, description, amount_rupiah, expense_date, created_at")
    .is("deleted_at", null)
    .order("expense_date", { ascending: false })
    .limit(limit)

  if (start) expenseQuery = expenseQuery.gte("expense_date", start.slice(0, 10))
  if (end) expenseQuery = expenseQuery.lt("expense_date", end.slice(0, 10))

  const { data: expenses } = await expenseQuery

  // Withdrawals
  let withdrawalQuery = supabase
    .from("owner_withdrawals")
    .select("id, amount_rupiah, recipient, method, withdrawn_at, created_at")
    .is("deleted_at", null)
    .order("withdrawn_at", { ascending: false })
    .limit(limit)

  if (start) withdrawalQuery = withdrawalQuery.gte("withdrawn_at", start.slice(0, 10))
  if (end) withdrawalQuery = withdrawalQuery.lt("withdrawn_at", end.slice(0, 10))

  const { data: withdrawals } = await withdrawalQuery

  return NextResponse.json({
    topups: topups ?? [],
    usage: usage ?? [],
    expenses: expenses ?? [],
    withdrawals: withdrawals ?? [],
  })
}