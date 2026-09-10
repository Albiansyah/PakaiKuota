"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { PromoBar } from "@/components/promo-bar"
import { WhatsAppCs } from "@/components/whatsapp-cs"
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  Star,
  Trash2,
} from "lucide-react"

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
]

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
]

const feedbackCategories = [
  "Kesan & Pesan",
  "Masukan Fitur",
  "Laporan Bug",
  "Keluhan Layanan",
  "Kritik & Saran",
  "Lainnya",
]

const inputClass =
  "min-h-11 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] px-3.5 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25 disabled:opacity-60"

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden text-(--pk-text)">
      {/* ============ LATAR GLOBAL ============ */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#0f1e38_0%,#050b16_55%,#03070e_100%)]" />
        <div className="pk-grid absolute inset-0" />
        <div className="pk-aurora">
          <span />
          <span />
        </div>
      </div>

      <Navbar />

      <PromoBar />

      {/* ============ HERO ============ */}
      <section className="relative">
        <div className="mx-auto grid w-full max-w-7xl gap-14 px-5 pb-20 pt-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28 lg:pt-28">
          <div className="min-w-0">
            <div className="pk-reveal inline-flex max-w-full items-center gap-2.5 rounded-full border border-[color:var(--pk-line-2)] bg-[#0b1626]/70 px-3.5 py-1.5 text-xs font-medium tracking-wide text-[color:var(--pk-text-dim)]">
              <span className="pk-dot shrink-0" aria-hidden />
              <span className="truncate">
                API LLM sesuai kebutuhanmu, kapanpun.
              </span>
            </div>

            <h1 className="pk-reveal pk-d1 mt-6 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-6xl">
              API LLM paling
              <br />
              murah se{" "}
              <span className="pk-gradient-text">Indonesia</span>.
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
                Coba Gratis
              </Link>
              <Link
                href="#cara-kerja"
                className="pk-btn-ghost inline-flex min-h-12 items-center justify-center px-6 text-sm font-medium"
              >
                Lihat alurnya →
              </Link>
            </div>

            <dl className="pk-reveal pk-d4 mt-12 grid max-w-lg grid-cols-3 gap-3 border-t border-[color:var(--pk-line)] pt-6 sm:gap-4">
              <div className="min-w-0">
                <dt className="text-[10px] uppercase tracking-wider text-[color:var(--pk-text-mute)] sm:text-[11px] sm:tracking-widest">
                  Pembayaran
                </dt>
                <dd className="mt-1 truncate text-sm font-medium">
                  QRIS &amp; VA
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] uppercase tracking-wider text-[color:var(--pk-text-mute)] sm:text-[11px] sm:tracking-widest">
                  Endpoint
                </dt>
                <dd className="mt-1 truncate text-sm font-medium">
                  Chat Completions
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] uppercase tracking-wider text-[color:var(--pk-text-mute)] sm:text-[11px] sm:tracking-widest">
                  Billing
                </dt>
                <dd className="mt-1 truncate text-sm font-medium">
                  Per token
                </dd>
              </div>
            </dl>
          </div>

          <div className="pk-reveal pk-d2 relative min-w-0">
            <div className="pk-panel pk-float overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[color:var(--pk-line)] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 truncate font-mono text-xs text-[color:var(--pk-text-mute)]">
                  request.sh
                </span>
              </div>

              <div className="pk-terminal pk-scroll overflow-x-auto p-5 font-mono text-[12.5px] leading-6">
                <div className="whitespace-pre text-[color:var(--pk-text-mute)]">
                  <span className="text-[color:var(--pk-cyan)]">$</span> curl
                  https://api.pakaikuota.cloud/v1/chat/completions \
                </div>
                <div className="whitespace-pre pl-4 text-[color:var(--pk-text-dim)]">
                  -H{" "}
                  <span className="text-[color:var(--pk-accent-2)]">
                    &quot;Authorization: Bearer $PK_KEY&quot;
                  </span>{" "}
                  \
                </div>
                <div className="whitespace-pre pl-4 text-[color:var(--pk-text-dim)]">
                  -d{" "}
                  <span className="text-[color:var(--pk-accent-2)]">
                    &apos;{`{ "model": "premium", "messages": [...] }`}&apos;
                  </span>
                </div>
                <div className="mt-3 whitespace-pre text-[#7ee787]">
                  ✓ 200 OK · 128 tokens · Rp 42
                </div>
              </div>

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
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--pk-accent)]" />
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

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
        <div className="pk-inview min-w-0">
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
              className="pk-panel pk-lift pk-inview flex items-start gap-4 p-5 sm:gap-5 sm:p-6"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span className="pk-step-no shrink-0">{step.no}</span>
              <div className="min-w-0">
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
            <div className="min-w-0">
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

          <div className="mt-12 grid items-stretch gap-5 pt-4 lg:grid-cols-3">
            {tiers.map((tier, i) => (
              <article
                key={tier.name}
                className={`pk-panel pk-lift pk-inview relative flex h-full flex-col p-6 sm:p-7 ${
                  tier.featured ? "pk-featured" : ""
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
        <div className="pk-inview min-w-0">
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
                <span className="min-w-0">{item.q}</span>
                <span className="pk-faq-icon shrink-0" aria-hidden>
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

      {/* ============ FEEDBACK / MASUKAN ============ */}
      <FeedbackSection />

      {/* ============ CTA PENUTUP ============ */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-24 sm:px-8">
        <div className="pk-panel pk-inview relative overflow-hidden px-6 py-14 text-center sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_120%,rgba(240,169,59,0.22),transparent_70%)]"
          />
          <h2 className="relative break-words text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
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

      <Footer />

      <WhatsAppCs />
    </main>
  )
}

/* ============================================================
   FEEDBACK SECTION
   ============================================================ */

const MAX_FILE_SIZE_MB = 5
const MAX_FILES = 3

function FeedbackSection() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [category, setCategory] = useState(feedbackCategories[0])
  const [message, setMessage] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  )
  const [errorMsg, setErrorMsg] = useState("")

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    message.trim().length > 0 &&
    state !== "loading"

  function handleFiles(selected: FileList | null) {
    if (!selected) return
    const incoming = Array.from(selected)
    const valid: File[] = []
    for (const f of incoming) {
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setState("error")
        setErrorMsg(`File "${f.name}" melebihi ${MAX_FILE_SIZE_MB} MB`)
        return
      }
      valid.push(f)
    }
    const next = [...files, ...valid].slice(0, MAX_FILES)
    setFiles(next)
    setState("idle")
    setErrorMsg("")
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function reset() {
    setName("")
    setEmail("")
    setPhone("")
    setCategory(feedbackCategories[0])
    setMessage("")
    setFiles([])
    setState("idle")
    setErrorMsg("")
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setState("loading")
    setErrorMsg("")

    try {
      const formData = new FormData()
      formData.append("name", name.trim())
      formData.append("email", email.trim())
      formData.append("phone", phone.trim())
      formData.append("category", category)
      formData.append("message", message.trim())
      files.forEach((f) => formData.append("files", f))

      const res = await fetch("/api/feedback", {
        method: "POST",
        body: formData,
      })

      const data = (await res.json().catch(() => ({}))) as {
        error?: string
      }

      if (!res.ok) {
        setState("error")
        setErrorMsg(data.error ?? "Gagal mengirim masukan")
        return
      }

      setState("success")
      setTimeout(() => {
        reset()
      }, 4000)
    } catch {
      setState("error")
      setErrorMsg("Koneksi gagal. Coba lagi.")
    }
  }

  return (
    <section
      id="feedback"
      className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8"
    >
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        {/* Kolom kiri: info */}
        <div className="pk-inview min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
            Suara Anda
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Ada masukan, kesan, atau ide fitur?
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-[color:var(--pk-text-dim)]">
            Kami baca semua masukan. Ceritakan pengalaman Anda, laporkan bug,
            atau usulkan fitur baru — tim kami akan menindaklanjuti.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-[color:var(--pk-text-dim)]">
            {[
              "Masukan langsung dibaca tim produk",
              "Respon maksimal 1×24 jam kerja",
              "Identitas Anda terjaga & tidak dipublikasikan",
              "Bisa lampirkan screenshot atau file pendukung",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--pk-accent)]"
                />
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>

          {/* Rating visual */}
          <div className="mt-8 inline-flex max-w-full items-center gap-2 rounded-full border border-[color:var(--pk-line-2)] bg-[#0b1626]/60 px-3.5 py-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={12}
                  className="fill-[color:var(--pk-accent)] text-[color:var(--pk-accent)]"
                />
              ))}
            </div>
            <span className="truncate text-[11px] font-medium text-[color:var(--pk-text-dim)]">
              Dipercaya pengguna di seluruh Indonesia
            </span>
          </div>
        </div>

        {/* Kolom kanan: form */}
        <div className="pk-panel pk-inview min-w-0 p-6 sm:p-8">
          {state === "success" ? (
            <div className="flex flex-col items-center py-8 text-center">
              <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#34d399]/40 bg-[#34d399]/10">
                <CheckCircle2 size={32} className="text-[#6ee7b7]" />
                <span className="absolute -right-1 -top-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34d399] opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-[#34d399]" />
                </span>
              </span>
              <h3 className="mt-5 text-lg font-semibold">
                Terima kasih atas masukannya!
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[color:var(--pk-text-dim)]">
                Kami sudah menerima pesan Anda. Tim akan meninjau dan
                menindaklanjuti maksimal 1×24 jam kerja.
              </p>
              <button
                type="button"
                onClick={reset}
                className="pk-btn-ghost mt-6 inline-flex min-h-10 items-center justify-center px-4 text-sm font-medium"
              >
                Kirim masukan lain
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--pk-accent)]/40 bg-[color:var(--pk-accent)]/10">
                  <MessageSquare
                    size={18}
                    className="text-[color:var(--pk-accent)]"
                  />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold">Kirim Masukan</h3>
                  <p className="mt-0.5 text-[11px] text-[color:var(--pk-text-mute)]">
                    Semua field bertanda{" "}
                    <span className="text-[color:var(--pk-accent)]">*</span>{" "}
                    wajib diisi
                  </p>
                </div>
              </div>

              {/* Error banner */}
              {state === "error" && errorMsg && (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#f87171]/40 bg-[#f87171]/10 px-4 py-3 text-sm text-[#fca5a5]">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span className="min-w-0 break-words">{errorMsg}</span>
                </div>
              )}

              {/* Nama + Email */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className="text-xs font-medium">
                    Nama lengkap{" "}
                    <span className="text-[color:var(--pk-accent)]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={state === "loading"}
                    placeholder="Misalnya: Budi Santoso"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>
                <div className="min-w-0">
                  <label className="text-xs font-medium">
                    Email{" "}
                    <span className="text-[color:var(--pk-accent)]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={state === "loading"}
                    placeholder="nama@email.com"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>
              </div>

              {/* WA + Kategori */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className="text-xs font-medium">
                    Nomor WhatsApp{" "}
                    <span className="text-[color:var(--pk-text-mute)]">
                      (opsional)
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={state === "loading"}
                    placeholder="08xxxxxxxxxx"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>
                <div className="min-w-0">
                  <label className="text-xs font-medium">
                    Jenis masukan{" "}
                    <span className="text-[color:var(--pk-accent)]">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={state === "loading"}
                      className="min-h-11 w-full appearance-none rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] py-2.5 pl-3.5 pr-10 text-sm text-[color:var(--pk-text)] outline-none transition-colors focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25 disabled:opacity-60"
                    >
                      {feedbackCategories.map((c) => (
                        <option key={c} value={c} className="bg-[#0b1626]">
                          {c}
                        </option>
                      ))}
                    </select>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[color:var(--pk-text-mute)]"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              {/* Pesan */}
              <div className="min-w-0">
                <label className="text-xs font-medium">
                  Pesan{" "}
                  <span className="text-[color:var(--pk-accent)]">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  maxLength={2000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={state === "loading"}
                  placeholder="Ceritakan pengalaman, kesan, ide fitur, atau masalah yang Anda temui…"
                  className="mt-1.5 w-full resize-none rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] px-3.5 py-3 text-sm text-[color:var(--pk-text)] outline-none transition-colors placeholder:text-[color:var(--pk-text-mute)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25 disabled:opacity-60"
                />
                <div className="mt-1 flex items-center justify-between text-[10px] text-[color:var(--pk-text-mute)]">
                  <span>Minimal 1 karakter</span>
                  <span className="font-mono">{message.length}/2000</span>
                </div>
              </div>

              {/* Attach File */}
              <div className="min-w-0">
                <label className="text-xs font-medium">
                  Lampiran{" "}
                  <span className="text-[color:var(--pk-text-mute)]">
                    (opsional, maks. {MAX_FILES} file, {MAX_FILE_SIZE_MB}{" "}
                    MB/file)
                  </span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.txt,.doc,.docx,.zip"
                  className="hidden"
                  onChange={(e) => {
                    handleFiles(e.target.files)
                    e.target.value = ""
                  }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={state === "loading" || files.length >= MAX_FILES}
                  className="mt-1.5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[color:var(--pk-line-2)] bg-[#0b1626]/60 px-4 text-sm text-[color:var(--pk-text-dim)] transition-colors hover:border-[color:var(--pk-accent)]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Paperclip size={14} className="shrink-0" />
                  <span className="truncate">
                    {files.length >= MAX_FILES
                      ? "Maksimal file tercapai"
                      : "Tambah lampiran"}
                  </span>
                </button>

                {/* File list */}
                {files.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {files.map((f, i) => (
                      <li
                        key={`${f.name}-${f.size}-${f.lastModified}`}
                        className="flex items-center gap-2 rounded-lg border border-[color:var(--pk-line-2)] bg-[#0b1626] px-3 py-2 text-xs"
                      >
                        <Paperclip
                          size={12}
                          className="shrink-0 text-[color:var(--pk-text-mute)]"
                        />
                        <span className="min-w-0 flex-1 truncate font-mono text-[color:var(--pk-text-dim)]">
                          {f.name}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-[color:var(--pk-text-mute)]">
                          {(f.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          disabled={state === "loading"}
                          aria-label={`Hapus ${f.name}`}
                          className="shrink-0 rounded-md p-1 text-[color:var(--pk-text-mute)] transition-colors hover:bg-[#f87171]/10 hover:text-[#fca5a5]"
                        >
                          <Trash2 size={11} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="pk-btn-primary inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state === "loading" ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Mengirim…
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Kirim Masukan
                  </>
                )}
              </button>

              <p className="text-center text-[10px] leading-5 text-[color:var(--pk-text-mute)]">
                Dengan mengirim, Anda setuju masukan dapat digunakan untuk
                peningkatan layanan.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}