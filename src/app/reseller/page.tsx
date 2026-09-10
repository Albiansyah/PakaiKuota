"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useLanguage } from "@/components/providers/language-provider"
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileText,
  Headset,
  Loader2,
  LogIn,
  Percent,
  Send,
  Sparkles,
  TrendingUp,
} from "lucide-react"

const BENEFITS = [
  {
    icon: <Percent size={20} />,
    tone: "border-[#34d399]/40 bg-[#34d399]/10 text-[#6ee7b7]",
    title: "Margin lebih besar",
    desc: "Dapatkan harga wholesale khusus untuk reseller aktif.",
  },
  {
    icon: <Building2 size={20} />,
    tone: "border-(--pk-accent)/40 bg-(--pk-accent)/10 text-(--pk-accent)",
    title: "White-label tersedia",
    desc: "Pakai brand sendiri dengan API tetap dari PakaiKuota.",
  },
  {
    icon: <Headset size={20} />,
    tone: "border-[#7dd3fc]/40 bg-[#7dd3fc]/10 text-[#7dd3fc]",
    title: "Support prioritas",
    desc: "Dedicated account manager + jalur support khusus.",
  },
]

const REQUIREMENTS = [
  "Volume transaksi minimal Rp 5 juta/bulan",
  "Memiliki akun bisnis atau NPWP",
  "Bersedia menandatangani perjanjian reseller",
]

export default function ResellerPage() {
  const { user } = useSupabase()
  const { t } = useLanguage()

  const [businessName, setBusinessName] = useState("")
  const [phone, setPhone] = useState("")
  const [npwp, setNpwp] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(false)

  const canSubmit = useMemo(() => {
    return (
      !!user &&
      businessName.trim().length > 0 &&
      phone.trim().length > 0 &&
      !loading
    )
  }, [user, businessName, phone, loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!user) {
      setMessage("Harap login terlebih dahulu")
      setError(true)
      return
    }
    if (!businessName.trim() || !phone.trim()) {
      setMessage("Nama usaha dan nomor telepon wajib diisi")
      setError(true)
      return
    }

    setLoading(true)
    setMessage("")
    setError(false)

    try {
      const res = await fetch("/api/reseller/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName.trim(),
          business_phone: phone.trim(),
          npwp: npwp.trim() || null,
        }),
      })

      const data = (await res.json().catch(() => ({}))) as {
        error?: string
      }

      if (res.ok) {
        setSuccess(true)
        setMessage("Pengajuan reseller berhasil dikirim!")
        setBusinessName("")
        setPhone("")
        setNpwp("")
      } else {
        setError(true)
        setMessage(data.error || "Gagal mengirim pengajuan")
      }
    } catch {
      setError(true)
      setMessage("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen text-(--pk-text)">
      {/* Background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#0f1e38_0%,#050b16_55%,#03070e_100%)]" />
        <div className="pk-grid absolute inset-0" />
        <div className="pk-aurora">
          <span />
          <span />
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-(--pk-line) bg-[#070f1e]/60 px-5 py-16 backdrop-blur-sm sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-(--pk-accent)/40 bg-(--pk-accent)/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
            <Sparkles size={11} />
            Reseller Program
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            Jadi Partner{" "}
            <span className="pk-gradient-text">Reseller</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-(--pk-text-dim)">
            Dapatkan margin lebih besar dengan menjadi reseller PakaiKuota.
            Cocok untuk agency, startup, dan bisnis yang butuh API LLM
            volume tinggi.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        {/* Benefits */}
        <section className="mb-12 grid gap-4 sm:grid-cols-3">
          {BENEFITS.map((b) => (
            <article
              key={b.title}
              className="pk-panel pk-inview p-5"
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl border ${b.tone}`}
              >
                {b.icon}
              </span>
              <h3 className="mt-4 text-sm font-semibold">{b.title}</h3>
              <p className="mt-1.5 text-xs leading-5 text-(--pk-text-dim)">
                {b.desc}
              </p>
            </article>
          ))}
        </section>

        {/* Form + Requirements Grid */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Application Form */}
          <section className="pk-panel pk-inview p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-(--pk-accent)/40 bg-(--pk-accent)/10">
                <FileText size={20} className="text-(--pk-accent)" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">
                  Formulir Pendaftaran
                </h2>
                <p className="mt-1 text-sm text-(--pk-text-dim)">
                  Untuk volume transaksi &gt; Rp 5 juta/bulan
                </p>
              </div>
            </div>

            {/* Not logged in */}
            {!user ? (
              <div className="mt-8 rounded-xl border border-(--pk-line-2) bg-[#0b1626]/60 p-6 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
                  <LogIn size={20} className="text-(--pk-text-mute)" />
                </span>
                <p className="mt-4 text-sm font-medium">
                  Login diperlukan
                </p>
                <p className="mt-1 text-xs text-(--pk-text-dim)">
                  Login dulu untuk mengajukan reseller.
                </p>
                <Link
                  href="/login"
                  className="pk-btn-primary mt-5 inline-flex min-h-10 items-center justify-center gap-2 px-5 text-sm"
                >
                  <LogIn size={14} />
                  Login sekarang
                </Link>
              </div>
            ) : success ? (
              /* Success state */
              <div className="mt-8 flex flex-col items-center text-center">
                <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#34d399]/40 bg-[#34d399]/10">
                  <CheckCircle2 size={32} className="text-[#6ee7b7]" />
                  <span className="absolute -right-1 -top-1 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34d399] opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-[#34d399]" />
                  </span>
                </span>
                <h3 className="mt-5 text-lg font-semibold">
                  Pengajuan Terkirim!
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-(--pk-text-dim)">
                  Tim kami akan meninjau pengajuan Anda dan menghubungi
                  melalui email terdaftar dalam 1–3 hari kerja.
                </p>
                <Link
                  href="/dashboard"
                  className="pk-btn-ghost mt-6 inline-flex min-h-10 items-center justify-center px-5 text-sm font-medium"
                >
                  Kembali ke Dashboard
                </Link>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {message && error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-[#f87171]/40 bg-[#f87171]/10 px-4 py-3 text-sm text-[#fca5a5]">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{message}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="businessName"
                    className="text-xs font-medium text-(--pk-text)"
                  >
                    Nama Usaha <span className="text-(--pk-accent)">*</span>
                  </label>
                  <input
                    id="businessName"
                    type="text"
                    autoComplete="organization"
                    placeholder="PT Contoh Indonesia"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    disabled={loading}
                    required
                    className="mt-1.5 min-h-11 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] px-3.5 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="text-xs font-medium text-(--pk-text)"
                  >
                    No. Telepon Bisnis{" "}
                    <span className="text-(--pk-accent)">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="08xxxxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    required
                    className="mt-1.5 min-h-11 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] px-3.5 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="npwp"
                    className="text-xs font-medium text-(--pk-text)"
                  >
                    NPWP{" "}
                    <span className="text-(--pk-text-mute)">(Opsional)</span>
                  </label>
                  <input
                    id="npwp"
                    type="text"
                    placeholder="01.234.567.8-901.000"
                    value={npwp}
                    onChange={(e) => setNpwp(e.target.value)}
                    disabled={loading}
                    className="mt-1.5 min-h-11 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] px-3.5 font-mono text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25 disabled:opacity-60"
                  />
                  <p className="mt-1.5 text-[11px] text-(--pk-text-mute)">
                    Kosongkan jika belum memiliki NPWP.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="pk-btn-primary inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Ajukan Sekarang
                    </>
                  )}
                </button>
              </form>
            )}
          </section>

          {/* Sidebar: Requirements + Contact */}
          <div className="space-y-6">
            {/* Requirements */}
            <section className="pk-panel pk-inview p-6">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-(--pk-accent)" />
                <h2 className="text-base font-semibold">Syarat Reseller</h2>
              </div>

              <ul className="mt-4 space-y-3 text-sm">
                {REQUIREMENTS.map((req) => (
                  <li key={req} className="flex items-start gap-2.5">
                    <CheckCircle2
                      size={14}
                      className="mt-0.5 shrink-0 text-[#6ee7b7]"
                    />
                    <span className="leading-6 text-(--pk-text-dim)">
                      {req}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Contact */}
            <section className="pk-panel pk-inview p-6">
              <div className="flex items-center gap-2">
                <Headset size={14} className="text-(--pk-accent)" />
                <h2 className="text-base font-semibold">
                  Butuh konsultasi?
                </h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-(--pk-text-dim)">
                Tanya dulu sebelum ajukan. Tim partnership siap bantu
                cari skema terbaik untuk bisnis Anda.
              </p>
              <a
                href="https://wa.me/6285184657474?text=Halo%2C%20saya%20tertarik%20jadi%20reseller%20PakaiKuota"
                target="_blank"
                rel="noreferrer"
                className="pk-btn-ghost mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 px-4 text-sm font-medium"
              >
                <Headset size={14} />
                Chat CS Reseller
              </a>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}