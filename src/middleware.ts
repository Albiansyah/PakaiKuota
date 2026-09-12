import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const { response } = await updateSession(request)
  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/keys/:path*",
    "/api/topups/:path*",
    "/api/refunds/:path*",
    "/api/admin/:path*",
  ],
}