import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(["super_admin"]);
  if (!auth) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null) as { input_price_per_1k?: number; output_price_per_1k?: number; markup_percent?: number; enabled?: boolean } | null;
  if (!body || (body.input_price_per_1k !== undefined && typeof body.input_price_per_1k !== "number") || (body.output_price_per_1k !== undefined && typeof body.output_price_per_1k !== "number") || (body.markup_percent !== undefined && typeof body.markup_percent !== "number") || (body.enabled !== undefined && typeof body.enabled !== "boolean")) return NextResponse.json({ error: "invalid_model" }, { status: 400 });
  const { id } = await context.params;
  const { data, error } = await auth.admin.from("models").update(body).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ model: data });
}
