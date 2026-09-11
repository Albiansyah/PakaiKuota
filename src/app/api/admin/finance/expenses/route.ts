import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

const ALLOWED_ROLES = ["super_admin", "support"]

async function requireAdmin() {
  const auth = await createSupabaseServerClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user) return { error: "unauthorized", status: 401, userId: null }

  const { data: profile } = await createSupabaseAdminClient()
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return { error: "forbidden", status: 403, userId: null }
  }
  return { error: null, status: 200, userId: user.id }
}

export async function GET(req: Request) {
  const check = await requireAdmin()
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const url = new URL(req.url)
  const start = url.searchParams.get("start")
  const end = url.searchParams.get("end")
  const category = url.searchParams.get("category")

  const supabase = createSupabaseAdminClient()
  let query = supabase
    .from("admin_expenses")
    .select("*")
    .is("deleted_at", null)
    .order("expense_date", { ascending: false })

  if (start) query = query.gte("expense_date", start)
  if (end) query = query.lte("expense_date", end)
  if (category && category !== "all") query = query.eq("category", category)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ expenses: data ?? [] })
}

export async function POST(req: Request) {
  const check = await requireAdmin()
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  try {
    const body = (await req.json()) as Record<string, unknown>
    const supabase = createSupabaseAdminClient()

    const payload = {
      category: String(body.category ?? "Other"),
      description: String(body.description ?? "").trim(),
      amount_rupiah: Number(body.amount_rupiah ?? 0),
      expense_date: String(body.expense_date ?? ""),
      vendor: body.vendor ? String(body.vendor) : null,
      reference_number: body.reference_number
        ? String(body.reference_number)
        : null,
      receipt_url: body.receipt_url ? String(body.receipt_url) : null,
      is_recurring: Boolean(body.is_recurring),
      recurring_period: body.recurring_period
        ? String(body.recurring_period)
        : null,
      notes: body.notes ? String(body.notes) : null,
      created_by: check.userId,
    }

    if (!payload.description) {
      return NextResponse.json(
        { error: "Description wajib diisi" },
        { status: 400 }
      )
    }
    if (payload.amount_rupiah <= 0) {
      return NextResponse.json(
        { error: "Amount harus > 0" },
        { status: 400 }
      )
    }
    if (!payload.expense_date) {
      return NextResponse.json(
        { error: "Tanggal wajib diisi" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("admin_expenses")
      .insert(payload)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ expense: data })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

export async function PATCH(req: Request) {
  const check = await requireAdmin()
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  try {
    const body = (await req.json()) as { id?: string } & Record<string, unknown>
    const id = String(body.id ?? "")
    if (!id) {
      return NextResponse.json({ error: "id wajib diisi" }, { status: 400 })
    }

    const allowed = [
      "category",
      "description",
      "amount_rupiah",
      "expense_date",
      "vendor",
      "reference_number",
      "receipt_url",
      "is_recurring",
      "recurring_period",
      "notes",
    ]
    const patch: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) {
        patch[key] = body[key]
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Tidak ada field" }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from("admin_expenses")
      .update(patch)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ expense: data })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  const check = await requireAdmin()
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id wajib diisi" }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()
  // Soft delete
  const { error } = await supabase
    .from("admin_expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}