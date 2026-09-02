import { NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: import("next/server").NextRequest) {
  const response = await updateSession(request)

  if (request.nextUrl.pathname.startsWith("/admin")) {
    const { createServerClient } = await import("@supabase/ssr")
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      const redirectRes = NextResponse.redirect(url)
      response.cookies.getAll().forEach((c) => redirectRes.cookies.set(c))
      return redirectRes
    }

    const { data } = await supabase.from("users").select("role").eq("id", user.id).single()
    if (!data || (data.role !== "super_admin" && data.role !== "support")) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      const redirectRes = NextResponse.redirect(url)
      response.cookies.getAll().forEach((c) => redirectRes.cookies.set(c))
      return redirectRes
    }
  }

  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const { createServerClient } = await import("@supabase/ssr")
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from("users").select("role").eq("id", user.id).single()
      if (data && (data.role === "super_admin" || data.role === "support")) {
        const url = request.nextUrl.clone()
        url.pathname = "/admin"
        const redirectRes = NextResponse.redirect(url)
        response.cookies.getAll().forEach((c) => redirectRes.cookies.set(c))
        return redirectRes
      }
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next|api|static|.*\\..*).*)"],
}
