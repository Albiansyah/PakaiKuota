import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WhatsAppCs } from "@/components/whatsapp-cs";
import { ModelCard } from "@/components/model-card";

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

  const stats = [
    {
      label: "Saldo tersedia",
      value: `Rp ${formatRupiah(Number(profile.data?.balance_rupiah ?? 0))}`,
      hint: "Saldo dari akun kamu.",
      accent: true,
    },
    {
      label: "Pemakaian bulan ini",
      value: `Rp ${formatRupiah(monthlyUsage)}`,
      hint: "Total cost pemakaian.",
      accent: false,
    },
    {
      label: "Request hari ini",
      value: String(dailyRequests),
      hint: "Request AI hari ini.",
      accent: false,
    },
    {
      label: "API key aktif",
      value: String(keys.data?.length ?? 0),
      hint: "Key yang belum dicabut.",
      accent: false,
    },
  ];

  const modelsData = models.data ?? [];

  return (
    <div className="relative min-h-screen text-[color:var(--pk-text)]">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#0f1e38_0%,#050b16_55%,#03070e_100%)]" />
        <div className="pk-grid absolute inset-0" />
      </div>

      <header className="border-b border-[color:var(--pk-line)] bg-[#070f1e]/60 px-5 py-8 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
            Ringkasan
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Kerja dari satu tempat.
          </h1>
          <p className="mt-3 text-sm text-[color:var(--pk-text-dim)]">
            {user?.email ?? "Akun kamu"}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <section aria-label="Ringkasan akun" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <article
              key={stat.label}
              className={`pk-panel pk-lift pk-inview p-5 ${stat.accent ? "pk-featured" : ""}`}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <p className="text-xs uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                {stat.label}
              </p>
              <p
                className={`mt-4 font-mono text-2xl ${
                  stat.accent
                    ? "text-[color:var(--pk-accent)]"
                    : "text-[color:var(--pk-text)]"
                }`}
              >
                {stat.value}
              </p>
              <p className="mt-2 text-xs text-[color:var(--pk-text-mute)]">
                {stat.hint}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-10">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
                Katalog
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                Model tersedia
              </h2>
            </div>
            <p className="text-xs text-[color:var(--pk-text-mute)]">
              {modelsData.length} model aktif · klik salin untuk pakai slug
            </p>
          </div>

          {modelsData.length ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {modelsData.map((model, i) => (
                <div
                  key={model.id}
                  className="pk-inview"
                  style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                >
                  <ModelCard
                    slug={model.slug}
                    name={model.name}
                    group={model.group_name ?? "Lainnya"}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="pk-panel mt-6 px-5 py-12 text-center text-sm text-[color:var(--pk-text-mute)]">
              Belum ada model yang aktif.
            </div>
          )}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="pk-panel pk-inview overflow-hidden">
            <div className="flex items-center justify-between border-b border-[color:var(--pk-line)] px-5 py-4">
              <h2 className="text-base font-semibold">Aktivitas terbaru</h2>
              <Link
                href="/dashboard/ledger"
                className="text-xs text-[color:var(--pk-accent)] hover:underline"
              >
                Lihat semua
              </Link>
            </div>
            {activity.data?.length ? (
              <div className="divide-y divide-[color:var(--pk-line)]">
                {activity.data.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between px-5 py-4 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {entry.description ?? entry.type}
                      </p>
                      <p className="text-xs text-[color:var(--pk-text-mute)]">
                        {new Date(entry.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <span className="ml-4 shrink-0 font-mono text-[color:var(--pk-text-dim)]">
                      Rp {formatRupiah(Number(entry.amount))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-12 text-center text-sm text-[color:var(--pk-text-mute)]">
                Belum ada aktivitas.
              </div>
            )}
          </div>

          <div className="pk-panel pk-featured pk-inview relative overflow-hidden p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_100%_0%,rgba(240,169,59,0.16),transparent_70%)]"
            />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
                Langkah berikutnya
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                Siapkan API key pertama kamu.
              </h2>
              <p className="mt-3 text-sm leading-6 text-[color:var(--pk-text-dim)]">
                Key hanya ditampilkan sekali saat dibuat. Simpan sebelum menutup dialog.
              </p>
              <Link
                href="/dashboard/keys"
                className="pk-btn-primary mt-6 inline-flex min-h-11 items-center justify-center px-5 text-sm"
              >
                Kelola API key
              </Link>
            </div>
          </div>
        </section>
      </div>

      <WhatsAppCs />
    </div>
  );
}