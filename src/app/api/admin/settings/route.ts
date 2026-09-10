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
  return { error: null, status: 200, userId: user.id }
}

export async function GET() {
  const check = await requireAdmin()
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ settings: data })
}

export async function PATCH(req: Request) {
  const check = await requireAdmin()
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  try {
    const body = (await req.json()) as Record<string, unknown>

    // Whitelist field yang boleh diubah
    const allowedFields = [
      "brand_name",
      "brand_tagline",
      "brand_description",
      "logo_url",
      "logo_dark_url",
      "favicon_url",
      "accent_color",
      "seo_title_template",
      "seo_default_title",
      "seo_default_description",
      "seo_keywords",
      "og_image_url",
      "twitter_handle",
      "contact_email",
      "contact_phone",
      "contact_address",
      "social_telegram",
      "social_twitter",
      "social_github",
      "social_instagram",
      "social_linkedin",
      "ga_tracking_id",
      "meta_pixel_id",
      "footer_copyright",
      "footer_company_name",
    ]

    const patch: Record<string, unknown> = { updated_by: check.userId }
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        patch[key] = body[key] === "" ? null : body[key]
      }
    }

    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from("site_settings")
      .update(patch)
      .eq("id", 1)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ settings: data })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}