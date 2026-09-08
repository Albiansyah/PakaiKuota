import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function requireAdmin(roles: string[] = ["support", "super_admin"]) {
  const auth = await createSupabaseServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from("users").select("role").eq("id", user.id).single();
  if (!profile?.role || !roles.includes(profile.role)) return null;
  return { admin, user, role: profile.role };
}

export function isSuperAdmin(role: string) {
  return role === "super_admin";
}
