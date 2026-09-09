import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  if (code) {
    const response = NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // Check if user profile exists in users table
      const { data: profile } = await (supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single())

      // If profile doesn't exist, create one
      if (!profile) {
        const emailPrefix = user.email?.split("@")[0] || "user"
        await (supabase.from("users").insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || emailPrefix,
          role: "user",
          balance_rupiah: 0,
          email_confirm: true,
        }))
      }

      // Redirect based on role
      const { data: updatedProfile } = await (supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single())

      const destination = NextResponse.redirect(new URL(
        updatedProfile?.role === "super_admin" || updatedProfile?.role === "support" ? "/admin" : "/dashboard",
        requestUrl.origin,
      ))
      response.cookies.getAll().forEach((cookie) => destination.cookies.set(cookie))
      return destination
    }
  }

  // Fallback redirect
  return NextResponse.redirect(new URL("/login?error=auth_callback_error", requestUrl.origin))
}
