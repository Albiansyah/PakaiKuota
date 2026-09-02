import { NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: import("next/server").NextRequest) {
  // Refresh session before proceeding
  const response = await updateSession(request)

  const adminMatch = request.nextUrl.pathname.startsWith("/admin")
  const dashboardMatch = request.nextUrl.pathname.startsWith("/dashboard")

  if (adminMatch || dashboardMatch) {
    const { createServerClient } = await import("@supabase/ssr")
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    if (adminMatch) {
      const { data } = await supabase.from("users").select("role").eq("id", user.id).single()
      if (!data || (data.role !== "super_admin" && data.role !== "support")) {
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
    }

    if (dashboardMatch) {
      const { data } = await supabase.from("users").select("role").eq("id", user.id).single()
      if (data && (data.role === "super_admin" || data.role === "support")) {
        const url = request.nextUrl.clone()
        url.pathname = "/admin"
        return NextResponse.redirect(url)
      }
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next|api|static|.*\\..*).*)"],
}
