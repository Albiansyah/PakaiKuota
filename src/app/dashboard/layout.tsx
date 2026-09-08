import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WhatsAppCs } from "@/components/whatsapp-cs";

const navigation = [
  { href: "/dashboard", label: "Ringkasan" },
  { href: "/dashboard/keys", label: "API keys" },
  { href: "/dashboard/topup", label: "Beli kuota" },
  { href: "/dashboard/transactions", label: "Transaksi" },
  { href: "/dashboard/ledger", label: "Mutasi saldo" },
  { href: "/dashboard/refunds", label: "Refund" },
  { href: "/dashboard/playground", label: "Playground" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#122542] lg:grid lg:grid-cols-[14rem_1fr]">
      <aside className="border-b border-[#d9e0e8] bg-[#122542] text-white lg:fixed lg:inset-y-0 lg:flex lg:w-56 lg:flex-col lg:border-b-0 lg:border-r lg:border-[#30435d]">
        <div className="flex items-center justify-between px-5 py-5 lg:block"><Link href="/" className="text-lg font-semibold tracking-[-0.03em] focus-visible:outline-2 focus-visible:outline-[#F0A93B]">Pakai<span className="text-[#F0A93B]">Kuota</span></Link><span className="text-xs text-[#b7c5d6] lg:mt-3 lg:block">Dashboard</span></div>
        <nav aria-label="Navigasi dashboard" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:px-3 lg:py-4">{navigation.map((item) => <Link key={item.href} href={item.href} className="flex min-h-11 shrink-0 items-center px-3 text-sm text-[#dbe4ef] hover:bg-[#1d3555] hover:text-white focus-visible:outline-2 focus-visible:outline-[#F0A93B]">{item.label}</Link>)}</nav>
        <div className="mt-auto hidden border-t border-[#30435d] p-4 lg:block"><p className="truncate text-xs text-[#b7c5d6]">{user?.email ?? "Akun"}</p><form action="/api/auth/logout" method="post" className="mt-3"><button className="min-h-11 text-sm text-[#F0A93B] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#F0A93B]">Keluar</button></form></div>
      </aside>
      <main className="min-w-0 lg:col-start-2">{children}</main>
      <WhatsAppCs />
    </div>
  );
}
