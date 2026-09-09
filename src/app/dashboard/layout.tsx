import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WhatsAppCs } from "@/components/whatsapp-cs";
import { DashboardSidebar } from "@/components/dashboard-sidebar";


export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#122542] lg:grid lg:grid-cols-[16rem_1fr]">
      <DashboardSidebar email={user?.email} />
      <main className="min-w-0 lg:col-start-2">{children}</main>
      <WhatsAppCs />
    </div>
  );
}
