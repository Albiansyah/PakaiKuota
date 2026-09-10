import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WhatsAppCs } from "@/components/whatsapp-cs";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="relative min-h-screen overflow-x-hidden text-[color:var(--pk-text)]">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#0f1e38_0%,#050b16_55%,#03070e_100%)]" />
        <div className="pk-grid absolute inset-0" />
      </div>

      <DashboardSidebar email={user?.email} />
      <main className="relative min-w-0 pb-24 lg:pb-8 lg:pl-72">{children}</main>
      <WhatsAppCs />
    </div>
  );
}