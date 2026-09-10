"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSupabase } from "@/components/providers/supabase-provider"
import { PakaiKuotaLogo } from "@/components/brand/pakai-kuota-logo"
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Link2Off,
  Loader2,
  Save,
  ShieldCheck,
} from "lucide-react"

type PasswordStrength = "weak" | "medium" | "strong"

function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 6) return "weak"
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score >= 4) return "strong"
  if (score >= 2) return "medium"
  return "weak"
}

const STRENGTH_LABEL: Record<PasswordStrength, string> = {
  weak: "Lemah",
  medium: "Sedang",
  strong: "Kuat",
}

const STRENGTH_TONE: Record<PasswordStrength, string> = {
  weak: "border-[#f87171]/40 bg-[#f87171]/10 text-[#fca5a5]",
  medium: "border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#fcd34d]",
  strong: "border-[#34d399]/40 bg-[#34d399]/10 text-[#6ee7b7]",
}

const STRENGTH_BAR: Record<PasswordStrength, string> = {
  weak: "w-1/3 bg-[#f87171]",
  medium: "w-2/3 bg-[#fbbf24]",
  strong: "w-full bg-[#34d399]",
}

export default function ResetPasswordPage() {
  const { supabase } = useSupabase()
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  // Check session
  useEffect(() => {
    let active = true
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (active) setIsValidSession(!!session)
    })()
    return () => {
      active = false
    }
  }, [supabase])

  const strength = useMemo(
    () => getPasswordStrength(password),
    [password]
  )

  const passwordsMatch = password.length > 0 && password === confirmPassword
  const canSubmit =
    password.length >= 6 && passwordsMatch && !loading

  const handleResetPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (password.length < 6) {
        setError("Password minimal 6 karakter")
        return
      }
      if (password !== confirmPassword) {
        setError("Password tidak cocok")
        return
      }

      setLoading(true)
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setSuccess(true)
        setLoading(false)
        setTimeout(() => router.push("/login"), 2000)
      }
    },
    [password, confirmPassword, supabase, router]
  )

  /* ============ LOADING ============ */
  if (isValidSession === null) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-5 text-(--pk-text)">
        <BackgroundDecor />
        <Loader2
          size={28}
          className="animate-spin text-(--pk-text-mute)"
        />
      </div>
    )
  }

  /* ============ INVALID SESSION ============ */
  if (isValidSession === false) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-5 py-12 text-(--pk-text) sm:px-8">
        <BackgroundDecor />
        <div className="w-full max-w-md">
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

          <div className="pk-panel pk-inview p-6 text-center sm:p-8">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#f87171]/40 bg-[#f87171]/10">
              <Link2Off size={28} className="text-[#fca5a5]" />
            </span>

            <h1 className="mt-5 text-xl font-semibold">Link kadaluarsa</h1>
            <p className="mt-2 text-sm leading-6 text-(--pk-text-dim)">
              Link reset password sudah tidak berlaku atau tidak valid.
              Silakan minta link baru.
            </p>

            <Link
              href="/forgot-password"
              className="pk-btn-primary mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 text-sm"
            >
              Minta link baru
            </Link>
          </div>

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

  /* ============ FORM ============ */
  return (
    <div className="relative flex min-h-screen items-center justify-center px-5 py-12 text-(--pk-text) sm:px-8">
      <BackgroundDecor />

      <div className="w-full max-w-md">
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
                <CheckCircle2 size={32} className="text-[#6ee7b7]" />
                <span className="absolute -right-1 -top-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34d399] opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-[#34d399]" />
                </span>
              </span>

              <h1 className="mt-5 text-xl font-semibold">
                Password berhasil diubah
              </h1>
              <p className="mt-2 text-sm leading-6 text-(--pk-text-dim)">
                Akun Anda sekarang pakai password baru. Mengalihkan ke
                halaman login…
              </p>

              <div className="mt-5 flex items-center gap-2 text-xs text-(--pk-text-mute)">
                <Loader2 size={12} className="animate-spin" />
                Mengalihkan otomatis
              </div>

              <Link
                href="/login"
                className="pk-btn-ghost mt-6 inline-flex min-h-10 w-full items-center justify-center gap-2 px-4 text-sm font-medium"
              >
                Ke halaman login sekarang
              </Link>
            </div>
          ) : (
            /* ============ FORM STATE ============ */
            <>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-(--pk-accent)/40 bg-(--pk-accent)/10">
                <KeyRound size={20} className="text-(--pk-accent)" />
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">
                Password Baru
              </h1>
              <p className="mt-2 text-sm leading-6 text-(--pk-text-dim)">
                Buat password baru yang kuat dan mudah Anda ingat.
              </p>

              <form
                onSubmit={handleResetPassword}
                className="mt-6 space-y-4"
              >
                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-[#f87171]/40 bg-[#f87171]/10 px-4 py-3 text-sm text-[#fca5a5]">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Password baru */}
                <div>
                  <label
                    htmlFor="password"
                    className="text-xs font-medium text-(--pk-text)"
                  >
                    Password Baru
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                      className="min-h-11 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] pl-10 pr-11 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25 disabled:opacity-60"
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--pk-text-mute)"
                    >
                      <KeyRound size={14} />
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      tabIndex={-1}
                      className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-(--pk-text-mute) transition-colors hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#0b1626]">
                          <div
                            className={`h-full rounded-full transition-all ${STRENGTH_BAR[strength]}`}
                          />
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${STRENGTH_TONE[strength]}`}
                        >
                          {STRENGTH_LABEL[strength]}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Konfirmasi */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="text-xs font-medium text-(--pk-text)"
                  >
                    Konfirmasi Password
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Masukkan password lagi"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                      className={`min-h-11 w-full rounded-xl border bg-[#0b1626] pl-10 pr-11 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:ring-2 focus:ring-(--pk-accent)/25 disabled:opacity-60 ${
                        confirmPassword.length === 0
                          ? "border-(--pk-line-2) focus:border-(--pk-accent)"
                          : passwordsMatch
                            ? "border-[#34d399]/50 focus:border-[#34d399]"
                            : "border-[#f87171]/50 focus:border-[#f87171]"
                      }`}
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--pk-text-mute)"
                    >
                      <ShieldCheck size={14} />
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={
                        showConfirm
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      tabIndex={-1}
                      className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-(--pk-text-mute) transition-colors hover:text-white"
                    >
                      {showConfirm ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </button>
                    {passwordsMatch && (
                      <span className="absolute right-11 top-1/2 -translate-y-1/2 text-[#6ee7b7]">
                        <Check size={14} />
                      </span>
                    )}
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="mt-1.5 text-[11px] text-[#fca5a5]">
                      Password belum cocok.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="pk-btn-primary inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Simpan Password Baru
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Back to login */}
        {!success && (
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-(--pk-text-dim) transition-colors hover:text-(--pk-accent)"
            >
              <ArrowLeft size={14} />
              Kembali ke Login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   Background decoration
   ============================================================ */
function BackgroundDecor() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#0f1e38_0%,#050b16_55%,#03070e_100%)]" />
      <div className="pk-grid absolute inset-0" />
      <div className="pk-aurora">
        <span />
        <span />
      </div>
    </div>
  )
}