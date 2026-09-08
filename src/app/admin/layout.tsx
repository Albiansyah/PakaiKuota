import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await createSupabaseServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/login");
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from("users").select("role").eq("id", user.id).single();
  if (!profile || !["support", "super_admin"].includes(profile.role)) redirect("/dashboard");
  return <div className="min-h-screen bg-[#FAFAF9] text-[#122542] lg:grid lg:grid-cols-[14rem_1fr]"><aside className="border-b border-[#30435d] bg-[#122542] text-white lg:fixed lg:inset-y-0 lg:flex lg:w-56 lg:flex-col"><div className="px-5 py-5"><Link href="/" className="text-lg font-semibold focus-visible:outline-2 focus-visible:outline-[#F0A93B]">Pakai<span className="text-[#F0A93B]">Kuota</span></Link><p className="mt-3 text-xs text-[#b7c5d6]">Admin, {profile.role === "super_admin" ? "super admin" : "support"}</p></div><nav aria-label="Navigasi admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:py-4">{[{ href: "/admin", label: "Ringkasan" }, { href: "/admin?tab=users", label: "Users" }, { href: "/admin?tab=transactions", label: "Transaksi" }, { href: "/admin?tab=refunds", label: "Refund queue" }, { href: "/admin/token-packages", label: "Token packages" }, { href: "/admin/newapi-config", label: "NewAPI config" }, ...(profile.role === "super_admin" ? [{ href: "/admin?tab=models", label: "Model & pricing" }, { href: "/admin?tab=reconciliation", label: "Reconciliation" }] : [])].map((item) => <Link key={item.href} href={item.href} className="flex min-h-11 shrink-0 items-center px-3 text-sm text-[#dbe4ef] hover:bg-[#1d3555] focus-visible:outline-2 focus-visible:outline-[#F0A93B]">{item.label}</Link>)}</nav><div className="mt-auto hidden border-t border-[#30435d] p-4 lg:block"><p className="truncate text-xs text-[#b7c5d6]">{user.email}</p><Link href="/dashboard" className="mt-3 inline-block text-sm text-[#F0A93B] underline underline-offset-4">Dashboard user</Link></div></aside><main className="min-w-0 lg:col-start-2">{children}</main></div>;
}
