import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const context = await requireAdmin();
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { data, error } = await context.admin.from("users").select("id, email, role, balance_rupiah, balance_held, suspended_at, created_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data });
}

export async function PATCH(request: Request) {
  const context = await requireAdmin(["super_admin"]);
  if (!context) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null) as { id?: string; suspended?: boolean } | null;
  if (!body?.id || typeof body.suspended !== "boolean") return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const { data, error } = await context.admin.from("users").update({ suspended_at: body.suspended ? new Date().toISOString() : null }).eq("id", body.id).select("id, suspended_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ user: data });
}
