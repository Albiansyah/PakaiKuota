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

/* ============================================================
   GET — list feedback dengan filter & search
   ============================================================ */
export async function GET(req: Request) {
  const check = await requireAdmin()
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get("status")
  const category = url.searchParams.get("category")
  const search = url.searchParams.get("q")?.trim().toLowerCase()

  const supabase = createSupabaseAdminClient()
  let query = supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false })

  if (status && status !== "all") query = query.eq("status", status)
  if (category && category !== "all") query = query.eq("category", category)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let filtered = data ?? []
  if (search) {
    filtered = filtered.filter(
      (f) =>
        f.name?.toLowerCase().includes(search) ||
        f.email?.toLowerCase().includes(search) ||
        f.message?.toLowerCase().includes(search) ||
        f.phone?.toLowerCase().includes(search)
    )
  }

  return NextResponse.json({ feedback: filtered })
}

/* ============================================================
   PATCH — update status, priority, admin_notes
   ============================================================ */
export async function PATCH(req: Request) {
  const check = await requireAdmin()
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  try {
    const body = (await req.json()) as {
      id?: string
      status?: string
      priority?: string
      admin_notes?: string
    }

    const id = String(body.id ?? "")
    if (!id) {
      return NextResponse.json({ error: "id wajib diisi" }, { status: 400 })
    }

    const patch: Record<string, unknown> = {}
    if (body.status !== undefined) patch.status = body.status
    if (body.priority !== undefined) patch.priority = body.priority
    if (body.admin_notes !== undefined) patch.admin_notes = body.admin_notes

    // Kalau status jadi resolved/archived, catat resolved_at
    if (body.status === "resolved" || body.status === "archived") {
      patch.resolved_by = check.userId
      patch.resolved_at = new Date().toISOString()
    } else if (body.status) {
      patch.resolved_by = null
      patch.resolved_at = null
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Tidak ada field" }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from("feedback")
      .update(patch)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ feedback: data })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

/* ============================================================
   DELETE — hapus feedback (dan attachment)
   ============================================================ */
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

  // Ambil attachment paths dulu
  const { data: row } = await supabase
    .from("feedback")
    .select("attachments")
    .eq("id", id)
    .single()

  // Hapus file di storage
  const paths = (row?.attachments ?? [])
    .map((a: { url?: string }) => a.url)
    .filter(Boolean) as string[]

  if (paths.length > 0) {
    await supabase.storage.from("feedback-attachments").remove(paths)
  }

  // Hapus row
  const { error } = await supabase.from("feedback").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}