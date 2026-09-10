import Link from "next/link";
import { WhatsAppCs } from "@/components/whatsapp-cs";

const tiers = [
  {
    name: "Standard",
    detail: "Untuk eksperimen dan penggunaan rutin.",
    price: "Lihat harga setelah masuk",
    featured: false,
  },
  {
    name: "Premium",
    detail: "Untuk workflow yang butuh model lebih kuat.",
    price: "Lihat harga setelah masuk",
    featured: true,
  },
  {
    name: "Ultra",
    detail: "Untuk beban kerja dengan kebutuhan model tertinggi.",
    price: "Lihat harga setelah masuk",
    featured: false,
  },
];

const steps = [
  {
    no: "01",
    title: "Isi kuota",
    desc: "Pilih nominal dan selesaikan pembayaran melalui QRIS atau VA.",
  },
  {
    no: "02",
    title: "Buat API key",
    desc: "Key hanya ditampilkan saat dibuat. Simpan di tempat yang aman.",
  },
  {
    no: "03",
    title: "Kirim request",
    desc: "Gunakan endpoint chat completions dengan format yang familiar.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden text-[color:var(--pk-text)]">
      {/* ============ LATAR GLOBAL ============ */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#0f1e38_0%,#050b16_55%,#03070e_100%)]" />
        <div className="pk-grid absolute inset-0" />
        <div className="pk-aurora">
          <span />
          <span />
        </div>
      </div>

      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-40 border-b border-[color:var(--pk-line)] bg-[#050b16]/80 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-base font-semibold tracking-[-0.02em]"
          >
            <span className="pk-logo" aria-hidden />
            <span>
              Pakai<span className="text-[color:var(--pk-accent)]">Kuota</span>
            </span>
          </Link>

          <nav
            aria-label="Navigasi utama"
            className="flex items-center gap-1.5 text-sm"
          >
            <Link
              href="#harga"
              className="hidden min-h-10 items-center px-3 text-[color:var(--pk-text-dim)] transition-colors hover:text-white sm:flex"
            >
              Harga
            </Link>
            <Link
              href="/docs"
              className="flex min-h-10 items-center px-3 text-[color:var(--pk-text-dim)] transition-colors hover:text-white"
            >
              Dokumentasi
            </Link>
            <Link
              href="/login"
              className="flex min-h-10 items-center px-3 text-[color:var(--pk-text-dim)] transition-colors hover:text-white"
            >
              Masuk
            </Link>
            <Link
              href="/signup"
              className="pk-btn-primary ml-1 inline-flex min-h-10 items-center px-4 text-sm"
            >
              Buat akun
            </Link>
          </nav>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative">
        <div className="mx-auto grid w-full max-w-7xl gap-14 px-5 pb-20 pt-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28 lg:pt-28">
          {/* Kolom kiri */}
          <div>
            <div className="pk-reveal inline-flex items-center gap-2.5 rounded-full border border-[color:var(--pk-line-2)] bg-[#0b1626]/70 px-3.5 py-1.5 text-xs font-medium tracking-wide text-[color:var(--pk-text-dim)]">
              <span className="pk-dot" aria-hidden />
              API LLM untuk kebutuhan kerja kamu
            </div>

            <h1 className="pk-reveal pk-d1 mt-6 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-6xl">
              Pakai API LLM.
              <br />
              Bayar dengan{" "}
              <span className="pk-gradient-text">Rupiah</span>.
            </h1>

            <p className="pk-reveal pk-d2 mt-6 max-w-xl text-base leading-7 text-[color:var(--pk-text-dim)] sm:text-lg">
              Satu API key untuk model LLM yang kamu butuhkan. Isi kuota lewat
              QRIS atau VA, lalu pakai endpoint chat completions yang familiar.
            </p>

            <div className="pk-reveal pk-d3 mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="pk-btn-primary inline-flex min-h-12 items-center justify-center px-6 text-sm"
              >
                Mulai dengan akun
              </Link>
              <Link
                href="#cara-kerja"
                className="pk-btn-ghost inline-flex min-h-12 items-center justify-center px-6 text-sm font-medium"
              >
                Lihat alurnya →
              </Link>
            </div>

            {/* Trust strip */}
            <dl className="pk-reveal pk-d4 mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-[color:var(--pk-line)] pt-6">
              <div>
                <dt className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                  Pembayaran
                </dt>
                <dd className="mt-1 text-sm font-medium">QRIS &amp; VA</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                  Endpoint
                </dt>
                <dd className="mt-1 text-sm font-medium">Chat Completions</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                  Billing
                </dt>
                <dd className="mt-1 text-sm font-medium">Per token</dd>
              </div>
            </dl>
          </div>

          {/* Kolom kanan: terminal + poin */}
          <div className="pk-reveal pk-d2 relative">
            <div className="pk-panel pk-float overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-2 border-b border-[color:var(--pk-line)] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 font-mono text-xs text-[color:var(--pk-text-mute)]">
                  request.sh
                </span>
              </div>

              {/* Body terminal */}
              <div className="pk-terminal pk-scroll overflow-x-auto p-5 font-mono text-[12.5px] leading-6">
                <div className="text-[color:var(--pk-text-mute)]">
                  <span className="text-[color:var(--pk-cyan)]">$</span> curl
                  https://api.pakaikuota.id/v1/chat/completions \
                </div>
                <div className="pl-4 text-[color:var(--pk-text-dim)]">
                  -H{" "}
                  <span className="text-[color:var(--pk-accent-2)]">
                    &quot;Authorization: Bearer $PK_KEY&quot;
                  </span>{" "}
                  \
                </div>
                <div className="pl-4 text-[color:var(--pk-text-dim)]">
                  -d{" "}
                  <span className="text-[color:var(--pk-accent-2)]">
                    &apos;{`{ "model": "premium", "messages": [...] }`}&apos;
                  </span>
                </div>
                <div className="mt-3 text-[#7ee787]">
                  ✓ 200 OK · 128 tokens · Rp 42
                </div>
              </div>

              {/* Footer panel */}
              <ul className="divide-y divide-[color:var(--pk-line)] border-t border-[color:var(--pk-line)] text-sm">
                {[
                  "Saldo tersedia sebelum request dikirim.",
                  "Biaya dihitung dari pemakaian token aktual.",
                  "Request gagal tidak memotong saldo.",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 px-5 py-3 text-[color:var(--pk-text-dim)]"
                  >
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[color:var(--pk-accent)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Glow di belakang panel */}
            <div
              aria-hidden
              className="absolute -inset-6 -z-10 rounded-[32px] bg-[radial-gradient(closest-side,rgba(240,169,59,0.18),transparent_70%)]"
            />
          </div>
        </div>
      </section>

      {/* ============ CARA KERJA ============ */}
      <section
        id="cara-kerja"
        className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.7fr_1.3fr]"
      >
        <div className="pk-inview">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
            Alur penggunaan
          </p>
          <h2 className="mt-4 max-w-md text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Dari saldo ke request, tanpa langkah tersembunyi.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[color:var(--pk-text-dim)]">
            Tiga langkah saja. Semua status terlihat di dashboard.
          </p>
        </div>

        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li
              key={step.no}
              className={`pk-panel pk-lift pk-inview flex items-start gap-5 p-5 sm:p-6`}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span className="pk-step-no">{step.no}</span>
              <div>
                <h3 className="text-base font-semibold sm:text-lg">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[color:var(--pk-text-dim)]">
                  {step.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ============ HARGA ============ */}
      <section id="harga" className="relative">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
          <div className="pk-inview flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
                Pilihan model
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                Pilih tier sesuai beban kerja.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[color:var(--pk-text-dim)]">
              Harga dan model aktif tampil dari konfigurasi akun. Tidak ada
              angka perkiraan yang disamarkan sebagai harga final.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {tiers.map((tier, i) => (
              <article
                key={tier.name}
                className={`pk-panel pk-lift pk-inview relative flex flex-col p-6 sm:p-7 ${
                  tier.featured ? "pk-featured lg:-translate-y-3" : ""
                }`}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                {tier.featured && (
                  <span className="absolute right-5 top-5 rounded-full border border-[color:var(--pk-accent)]/40 bg-[color:var(--pk-accent)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--pk-accent)]">
                    Populer
                  </span>
                )}

                <h3 className="text-xl font-semibold">{tier.name}</h3>
                <p className="mt-3 min-h-12 text-sm leading-6 text-[color:var(--pk-text-dim)]">
                  {tier.detail}
                </p>

                <div className="mt-auto pt-8">
                  <p className="border-t border-[color:var(--pk-line)] pt-4 font-mono text-sm text-[color:var(--pk-accent)]">
                    {tier.price}
                  </p>
                  <Link
                    href="/signup"
                    className={`mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold ${
                      tier.featured ? "pk-btn-primary" : "pk-btn-ghost"
                    }`}
                  >
                    Pilih {tier.name}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2">
        <div className="pk-inview">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
            FAQ
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Pertanyaan yang penting sebelum mulai.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-[color:var(--pk-text-dim)]">
            Jawaban ini mengikuti perilaku billing yang digunakan sistem.
          </p>
        </div>

        <div className="pk-panel pk-inview divide-y divide-[color:var(--pk-line)] overflow-hidden">
          {[
            {
              q: "Apa yang terjadi jika request gagal?",
              a: "Hold dilepas dan saldo tidak dipotong.",
            },
            {
              q: "Bagaimana pembayaran diverifikasi?",
              a: "Webhook hanya menjadi pemicu. Status diverifikasi ulang melalui Transaction Detail API Pakasir.",
            },
            {
              q: "Kapan saya bisa mulai memakai API?",
              a: "Setelah pembayaran terverifikasi dan saldo masuk, buat API key dari dashboard.",
            },
          ].map((item) => (
            <details key={item.q} className="pk-faq group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-sm font-semibold transition-colors hover:text-[color:var(--pk-accent)] sm:text-base">
                {item.q}
                <span className="pk-faq-icon" aria-hidden>
                  +
                </span>
              </summary>
              <p className="pk-faq-answer px-5 pb-5 text-sm leading-6 text-[color:var(--pk-text-dim)]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ============ CTA PENUTUP ============ */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-24 sm:px-8">
        <div className="pk-panel pk-inview relative overflow-hidden px-6 py-14 text-center sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_120%,rgba(240,169,59,0.22),transparent_70%)]"
          />
          <h2 className="relative text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Siap kirim request pertama?
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-sm leading-6 text-[color:var(--pk-text-dim)]">
            Buat akun, isi kuota dengan QRIS atau VA, lalu langsung pakai
            endpoint chat completions.
          </p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="pk-btn-primary inline-flex min-h-12 items-center justify-center px-6 text-sm"
            >
              Buat akun gratis
            </Link>
            <Link
              href="/docs"
              className="pk-btn-ghost inline-flex min-h-12 items-center justify-center px-6 text-sm font-medium"
            >
              Baca dokumentasi
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-[color:var(--pk-line)] bg-[#040a13]/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="flex items-center gap-2.5 font-semibold">
            <span className="pk-logo" aria-hidden />
            <span>
              Pakai<span className="text-[color:var(--pk-accent)]">Kuota</span>
            </span>
          </span>
          <span className="text-[color:var(--pk-text-mute)]">
            API LLM dengan pembayaran Rupiah.
          </span>
          <Link
            href="/docs"
            className="text-[color:var(--pk-accent)] hover:underline"
          >
            Baca dokumentasi
          </Link>
        </div>
      </footer>

      <WhatsAppCs />
    </main>
  );
}