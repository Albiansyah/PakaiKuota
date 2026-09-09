import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WhatsAppCs } from "@/components/whatsapp-cs";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const [profile, usage, keys, activity, models] = await Promise.all([
    supabase.from('users').select('balance_rupiah').eq('id', user?.id ?? '').maybeSingle(),
    supabase.from('ai_usage_logs').select('id, cost_rupiah, created_at').eq('user_id', user?.id ?? '').gte('created_at', monthStart),
    supabase.from('api_keys').select('id').eq('user_id', user?.id ?? '').is('revoked_at', null),
    supabase.from('wallet_ledger').select('id, type, amount, description, created_at').eq('user_id', user?.id ?? '').order('created_at', { ascending: false }).limit(5),
    supabase.from('models').select('id, slug, name, group_name').eq('enabled', true).order('group_name').order('name'),
  ]);
  const monthlyUsage = (usage.data ?? []).reduce((sum, row) => sum + Number(row.cost_rupiah ?? 0), 0);
  const dailyRequests = (usage.data ?? []).filter((row) => row.created_at >= dayStart).length;
  const formatRupiah = (value: number) => value.toLocaleString('id-ID');

  return (
    <div>
      <header className="border-b border-[#d9e0e8] bg-white px-5 py-8 sm:px-8"><p className="text-sm font-semibold text-[#D97B2E]">Ringkasan</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Kerja dari satu tempat.</h1><p className="mt-3 text-sm text-[#40536d]">{user?.email ?? "Akun kamu"}</p></header>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <section aria-label="Ringkasan akun" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
<article className="border border-[#d9e0e8] bg-white p-5"><p className="text-sm text-[#40536d]">Saldo tersedia</p><p className="mt-4 font-mono text-2xl text-[#F0A93B]">Rp {formatRupiah(Number(profile.data?.balance_rupiah ?? 0))}</p><p className="mt-2 text-xs text-[#40536d]">Saldo dari akun kamu.</p></article>
           <article className="border border-[#d9e0e8] bg-white p-5"><p className="text-sm text-[#40536d]">Pemakaian bulan ini</p><p className="mt-4 font-mono text-2xl">Rp {formatRupiah(monthlyUsage)}</p><p className="mt-2 text-xs text-[#40536d]">Total cost pemakaian.</p></article>
           <article className="border border-[#d9e0e8] bg-white p-5"><p className="text-sm text-[#40536d]">Request hari ini</p><p className="mt-4 font-mono text-2xl">{dailyRequests}</p><p className="mt-2 text-xs text-[#40536d]">Request AI hari ini.</p></article>
           <article className="border border-[#d9e0e8] bg-white p-5"><p className="text-sm text-[#40536d]">API key aktif</p><p className="mt-4 font-mono text-2xl">{keys.data?.length ?? 0}</p><p className="mt-2 text-xs text-[#40536d]">Key yang belum dicabut.</p></article>
        </section>
          <section className="mt-10 border-y border-[#d9e0e8] bg-white p-5"><h2 className="font-semibold">Model tersedia</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{Object.entries((models.data ?? []).reduce<Record<string, { id: string; slug: string; name: string }[]>>((groups, model) => { (groups[model.group_name || 'Lainnya'] ??= []).push(model); return groups }, {})).map(([group, items]) => <div key={group}><h3 className="text-sm font-semibold text-[#D97B2E]">{group}</h3><div className="mt-2 space-y-2">{items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 text-sm"><code className="truncate">{item.slug}</code><span className="shrink-0 text-xs text-[#40536d]">Gunakan slug</span></div>)}</div></div>)}</div></section>
          <section className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border-y border-[#d9e0e8] bg-white"><div className="flex items-center justify-between border-b border-[#d9e0e8] px-5 py-4"><h2 className="font-semibold">Aktivitas terbaru</h2><Link href="/dashboard/ledger" className="text-xs text-[#40536d]">Lihat semua</Link></div>{activity.data?.length ? <div className="divide-y divide-[#d9e0e8]">{activity.data.map((entry) => <div key={entry.id} className="flex items-center justify-between px-5 py-4 text-sm"><div><p className="font-medium">{entry.description ?? entry.type}</p><p className="text-xs text-[#40536d]">{new Date(entry.created_at).toLocaleString('id-ID')}</p></div><span className="font-mono">Rp {formatRupiah(Number(entry.amount))}</span></div>)}</div> : <div className="px-5 py-12 text-sm text-[#40536d]">Belum ada aktivitas.</div>}</div>
          <div className="border border-[#122542] bg-[#122542] p-6 text-white"><p className="text-sm text-[#F0A93B]">Langkah berikutnya</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Siapkan API key pertama kamu.</h2><p className="mt-3 text-sm leading-6 text-[#dbe4ef]">Key hanya ditampilkan sekali saat dibuat. Simpan sebelum menutup dialog.</p><Link href="/dashboard/keys" className="mt-6 inline-flex min-h-11 items-center bg-[#F0A93B] px-4 text-sm font-semibold text-[#122542] hover:bg-[#f7bb5d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Kelola API key</Link></div>
        </section>
      </div>
      <WhatsAppCs />
    </div>
  );
}
