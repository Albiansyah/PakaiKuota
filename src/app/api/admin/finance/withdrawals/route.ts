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

  const supabase = createSupabaseAdminClient()
  let query = supabase
    .from("owner_withdrawals")
    .select("*")
    .is("deleted_at", null)
    .order("withdrawn_at", { ascending: false })

  if (start) query = query.gte("withdrawn_at", start)
  if (end) query = query.lte("withdrawn_at", end)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ withdrawals: data ?? [] })
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
      amount_rupiah: Number(body.amount_rupiah ?? 0),
      withdrawn_at: String(body.withdrawn_at ?? ""),
      recipient: String(body.recipient ?? "Owner"),
      method: body.method ? String(body.method) : null,
      reference_number: body.reference_number
        ? String(body.reference_number)
        : null,
      proof_url: body.proof_url ? String(body.proof_url) : null,
      notes: body.notes ? String(body.notes) : null,
      created_by: check.userId,
    }

    if (payload.amount_rupiah <= 0) {
      return NextResponse.json(
        { error: "Amount harus > 0" },
        { status: 400 }
      )
    }
    if (!payload.withdrawn_at) {
      return NextResponse.json(
        { error: "Tanggal wajib diisi" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("owner_withdrawals")
      .insert(payload)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ withdrawal: data })
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
  const { error } = await supabase
    .from("owner_withdrawals")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}