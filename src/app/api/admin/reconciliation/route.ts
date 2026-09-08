import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const context = await requireAdmin(["super_admin"]);
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { data, error } = await context.admin.from("reconciliation_logs").select("id, category, status, details, created_at").order("created_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data });
}
