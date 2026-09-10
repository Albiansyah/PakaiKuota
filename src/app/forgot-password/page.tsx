"use client"

import { useState } from "react"
import Link from "next/link"
import { useSupabase } from "@/components/providers/supabase-provider"
import { PakaiKuotaLogo } from "@/components/brand/pakai-kuota-logo"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
} from "lucide-react"

export default function ForgotPasswordPage() {
  const { supabase } = useSupabase()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-5 py-12 text-(--pk-text) sm:px-8">
      {/* Background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#0f1e38_0%,#050b16_55%,#03070e_100%)]" />
        <div className="pk-grid absolute inset-0" />
        <div className="pk-aurora">
          <span />
          <span />
        </div>
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          href="/"
          className="mx-auto mb-8 flex w-fit items-center gap-2.5 text-base font-semibold tracking-[-0.02em]"
        >
          <PakaiKuotaLogo size={32} />
          <span>
            Pakai
            <span className="text-(--pk-accent)">Kuota</span>
          </span>
        </Link>

        <div className="pk-panel pk-inview p-6 sm:p-8">
          {success ? (
            /* ============ SUCCESS STATE ============ */
            <div className="flex flex-col items-center text-center">
              <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#34d399]/40 bg-[#34d399]/10">
                <CheckCircle2
                  size={32}
                  className="text-[#6ee7b7]"
                />
                <span className="absolute -right-1 -top-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34d399] opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-[#34d399]" />
                </span>
              </span>

              <h1 className="mt-5 text-xl font-semibold">
                Email terkirim!
              </h1>
              <p className="mt-2 text-sm leading-6 text-(--pk-text-dim)">
                Kami telah mengirim link reset password ke{" "}
                <strong className="font-mono text-(--pk-text)">
                  {email}
                </strong>
              </p>

              <div className="mt-5 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626]/60 p-4 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-(--pk-text-mute)">
                  Tidak menerima email?
                </p>
                <ul className="mt-2 space-y-1.5 text-xs leading-5 text-(--pk-text-dim)">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-(--pk-text-mute)" />
                    Cek folder <strong className="text-(--pk-text)">spam</strong> atau <strong className="text-(--pk-text)">promotions</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-(--pk-text-mute)" />
                    Tunggu 1–2 menit, email kadang tertunda
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-(--pk-text-mute)" />
                    Pastikan email yang dimasukkan sudah benar
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSuccess(false)
                  setEmail("")
                }}
                className="pk-btn-ghost mt-5 inline-flex min-h-10 items-center justify-center gap-2 px-4 text-sm font-medium"
              >
                <Send size={14} />
                Kirim ulang ke email lain
              </button>
            </div>
          ) : (
            /* ============ FORM STATE ============ */
            <>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-(--pk-accent)/40 bg-(--pk-accent)/10">
                <Mail size={20} className="text-(--pk-accent)" />
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">
                Reset Password
              </h1>
              <p className="mt-2 text-sm leading-6 text-(--pk-text-dim)">
                Masukkan email Anda untuk menerima link reset password.
              </p>

              <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-[#f87171]/40 bg-[#f87171]/10 px-4 py-3 text-sm text-[#fca5a5]">
                    <AlertCircle
                      size={16}
                      className="mt-0.5 shrink-0"
                    />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="text-xs font-medium text-(--pk-text)"
                  >
                    Email
                  </label>
                  <div className="relative mt-1.5">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--pk-text-mute)"
                    >
                      <Mail size={14} />
                    </span>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="min-h-11 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] pl-10 pr-3.5 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25 disabled:opacity-60"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="pk-btn-primary inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 text-sm disabled:cursor-wait disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Kirim Link Reset
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Back to login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-(--pk-text-dim) transition-colors hover:text-(--pk-accent)"
          >
            <ArrowLeft size={14} />
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  )
}