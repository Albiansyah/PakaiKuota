import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WhatsAppCs } from "@/components/whatsapp-cs";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <header className="border-b border-[#d9e0e8] bg-white px-5 py-8 sm:px-8"><p className="text-sm font-semibold text-[#D97B2E]">Ringkasan</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Kerja dari satu tempat.</h1><p className="mt-3 text-sm text-[#40536d]">{user?.email ?? "Akun kamu"}</p></header>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <section aria-label="Ringkasan akun" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="border border-[#d9e0e8] bg-white p-5"><p className="text-sm text-[#40536d]">Saldo tersedia</p><p className="mt-4 font-mono text-2xl text-[#F0A93B]">Rp <span aria-label="Data saldo belum tersedia">--</span></p><p className="mt-2 text-xs text-[#40536d]">Menunggu data saldo akun.</p></article>
          <article className="border border-[#d9e0e8] bg-white p-5"><p className="text-sm text-[#40536d]">Pemakaian bulan ini</p><p className="mt-4 font-mono text-2xl">--</p><p className="mt-2 text-xs text-[#40536d]">Data usage belum tersedia.</p></article>
          <article className="border border-[#d9e0e8] bg-white p-5"><p className="text-sm text-[#40536d]">Request hari ini</p><p className="mt-4 font-mono text-2xl">--</p><p className="mt-2 text-xs text-[#40536d]">Data usage belum tersedia.</p></article>
          <article className="border border-[#d9e0e8] bg-white p-5"><p className="text-sm text-[#40536d]">API key aktif</p><p className="mt-4 font-mono text-2xl">--</p><p className="mt-2 text-xs text-[#40536d]">Kelola key dari halaman API keys.</p></article>
        </section>
        <section className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border-y border-[#d9e0e8] bg-white"><div className="flex items-center justify-between border-b border-[#d9e0e8] px-5 py-4"><h2 className="font-semibold">Aktivitas terbaru</h2><span className="text-xs text-[#40536d]">Belum ada data</span></div><div className="px-5 py-12 text-sm text-[#40536d]">Aktivitas transaksi dan usage akan muncul setelah akun mulai digunakan.</div></div>
          <div className="border border-[#122542] bg-[#122542] p-6 text-white"><p className="text-sm text-[#F0A93B]">Langkah berikutnya</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Siapkan API key pertama kamu.</h2><p className="mt-3 text-sm leading-6 text-[#dbe4ef]">Key hanya ditampilkan sekali saat dibuat. Simpan sebelum menutup dialog.</p><Link href="/dashboard/keys" className="mt-6 inline-flex min-h-11 items-center bg-[#F0A93B] px-4 text-sm font-semibold text-[#122542] hover:bg-[#f7bb5d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Kelola API key</Link></div>
        </section>
      </div>
      <WhatsAppCs />
    </div>
  );
}
