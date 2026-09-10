import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const revalidate = 60

export async function GET() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single()

  if (error || !data) {
    // Fallback default kalau belum ada row
    return NextResponse.json({
      settings: null,
    })
  }

  return NextResponse.json({ settings: data })
}