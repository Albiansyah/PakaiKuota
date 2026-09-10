import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const revalidate = 60 // ISR: cache 60 detik

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("marketing_banners")
    .select(
      "id, eyebrow, title, subtitle, cta, href, external, tone, icon, sort_order"
    )
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("sort_order", { ascending: true })

  if (error) {
    return NextResponse.json({ banners: [] }, { status: 200 })
  }
  return NextResponse.json({ banners: data ?? [] })
}