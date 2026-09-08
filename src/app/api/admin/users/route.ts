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
const body = await request.json().catch(() => null) as { id?: string; suspended?: boolean; role?: "user" | "support" | "super_admin" } | null;
   if (!body?.id || (typeof body.suspended !== "boolean" && !body.role)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
   if (body.role && !["user", "support", "super_admin"].includes(body.role)) return NextResponse.json({ error: "invalid_role" }, { status: 400 });
   const updates = body.role ? { role: body.role } : { suspended_at: body.suspended ? new Date().toISOString() : null };
   const { data, error } = await context.admin.from("users").update(updates).eq("id", body.id).select("id, role, suspended_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ user: data });
}
