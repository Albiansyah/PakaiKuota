import { NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

type UserRoleResult = { role: "user" | "super_admin" | "support" } | null

export async function middleware(request: import("next/server").NextRequest) {
  // Update session and get user + supabase client from the same source
  const { response, user, supabase } = await updateSession(request)

  const pathname = request.nextUrl.pathname
  const adminMatch = pathname.startsWith("/admin")
  const dashboardMatch = pathname.startsWith("/dashboard")

  if (adminMatch || dashboardMatch) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    // Fetch user role from database
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single() as { data: UserRoleResult }

    if (adminMatch) {
      // Check if user is admin (super_admin or support)
      if (!userData || (userData.role !== "super_admin" && userData.role !== "support")) {
        // Non-admin users redirected to dashboard
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
      // Admin users are allowed to access /admin
    }

    if (dashboardMatch && userData) {
      // Admin users accessing /dashboard should go to /admin instead
      if (userData.role === "super_admin" || userData.role === "support") {
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
