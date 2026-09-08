import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await createSupabaseServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await createSupabaseAdminClient().from("users").select("role").eq("id", user.id).single();
  if (!profile || !["support", "super_admin"].includes(profile.role)) redirect("/dashboard");
  return <div className="min-h-screen bg-[#FAFAF9] text-[#122542] lg:grid lg:grid-cols-[16rem_1fr]"><AdminSidebar email={user.email} role={profile.role} /><main className="min-w-0 lg:col-start-2">{children}</main></div>;
}
