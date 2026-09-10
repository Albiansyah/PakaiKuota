import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

const ALLOWED_ROLES = ["super_admin", "support"]

async function requireAdmin() {
  const auth = await createSupabaseServerClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user) return { error: "unauthorized", status: 401, user: null }

  const { data: profile } = await createSupabaseAdminClient()
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return { error: "forbidden", status: 403, user: null }
  }
  return { error: null, status: 200, user }
}

/* ============================================================
   GET /api/admin/marketing-banners
   ============================================================ */
export async function GET() {
  const check = await requireAdmin()
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from("marketing_banners")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ banners: data ?? [] })
}

/* ============================================================
   POST /api/admin/marketing-banners
   ============================================================ */
export async function POST(req: Request) {
  const check = await requireAdmin()
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  try {
    const body = (await req.json()) as Record<string, unknown>
    const payload = {
      eyebrow: String(body.eyebrow ?? "").trim(),
      title: String(body.title ?? "").trim(),
      subtitle: String(body.subtitle ?? "").trim(),
      cta: String(body.cta ?? "Selengkapnya").trim(),
      href: String(body.href ?? "/").trim(),
      external: Boolean(body.external),
      tone: String(body.tone ?? "info"),
      icon: String(body.icon ?? "sparkles"),
      sort_order: Number(body.sort_order ?? 0),
      is_active: body.is_active !== false,
      starts_at: body.starts_at ? String(body.starts_at) : null,
      ends_at: body.ends_at ? String(body.ends_at) : null,
    }

    if (!payload.title) {
      return NextResponse.json({ error: "Title wajib diisi" }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from("marketing_banners")
      .insert(payload)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ banner: data })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

/* ============================================================
   PATCH /api/admin/marketing-banners
   ============================================================ */
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

    const patch: Record<string, unknown> = {}
    if (body.eyebrow !== undefined)
      patch.eyebrow = String(body.eyebrow).trim()
    if (body.title !== undefined) patch.title = String(body.title).trim()
    if (body.subtitle !== undefined)
      patch.subtitle = String(body.subtitle).trim()
    if (body.cta !== undefined) patch.cta = String(body.cta).trim()
    if (body.href !== undefined) patch.href = String(body.href).trim()
    if (body.external !== undefined) patch.external = Boolean(body.external)
    if (body.tone !== undefined) patch.tone = String(body.tone)
    if (body.icon !== undefined) patch.icon = String(body.icon)
    if (body.sort_order !== undefined)
      patch.sort_order = Number(body.sort_order)
    if (body.is_active !== undefined) patch.is_active = Boolean(body.is_active)
    if (body.starts_at !== undefined)
      patch.starts_at = body.starts_at ? String(body.starts_at) : null
    if (body.ends_at !== undefined)
      patch.ends_at = body.ends_at ? String(body.ends_at) : null

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Tidak ada field" }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from("marketing_banners")
      .update(patch)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ banner: data })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

/* ============================================================
   DELETE /api/admin/marketing-banners?id=xxx
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
  const { error } = await supabase
    .from("marketing_banners")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}