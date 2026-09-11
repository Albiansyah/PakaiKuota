import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET() {
  const context = await requireAdmin()
  if (!context) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const { count, error } = await context.admin
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("status", "awaiting_verification")

  if (error) {
    return NextResponse.json({ count: 0 }, { status: 200 })
  }

  return NextResponse.json({ count: count ?? 0 })
}