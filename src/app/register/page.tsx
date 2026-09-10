"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Container } from "@/components/layout"
import { Loader2 } from "lucide-react"

export default function RegisterPage() {
  const { supabase } = useSupabase()
  const { t } = useLanguage()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Password tidak cocok")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter")
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
    } else {
      router.push("/login?registered=true")
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    setGoogleLoading(false)
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-[color:var(--pk-text)]">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#0f1e38_0%,#050b16_55%,#03070e_100%)]" />
        <div className="pk-grid absolute inset-0" />
        <div className="pk-aurora">
          <span />
          <span />
        </div>
      </div>

      <Container size="xs" className="relative py-12">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/"
            className="mb-10 flex items-center justify-center gap-2.5 text-base font-semibold tracking-[-0.02em]"
          >
            <span className="pk-logo" aria-hidden />
            <span>
              Pakai<span className="text-[color:var(--pk-accent)]">Kuota</span>
            </span>
          </Link>

          <div className="pk-panel pk-reveal p-6 sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
                {t("nav.register")}
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                {t("nav.register")}
              </h1>
              <p className="mt-3 text-sm leading-6 text-[color:var(--pk-text-dim)]">
                Buat akun baru untuk mulai menggunakan API
              </p>
            </div>

            <div className="mt-7 space-y-4">
              <Button
                variant="outline"
                className="pk-btn-ghost inline-flex min-h-11 w-full items-center justify-center gap-2 bg-transparent px-4 text-sm font-medium"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {googleLoading ? t("common.loading") : "Daftar dengan Google"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="bg-[color:var(--pk-line)]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0b1626] px-3 text-[color:var(--pk-text-mute)]">
                    atau
                  </span>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-3 rounded-lg border border-[#f87171]/30 bg-[#f87171]/10 px-4 py-3 text-sm text-[#fca5a5]">
                    <span aria-hidden className="mt-0.5">
                      ⚠
                    </span>
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="min-h-11 rounded-xl border-[color:var(--pk-line-2)] bg-[#0b1626] px-3.5 text-base text-[color:var(--pk-text)] placeholder:text-[color:var(--pk-text-mute)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="min-h-11 rounded-xl border-[color:var(--pk-line-2)] bg-[#0b1626] px-3.5 text-base text-[color:var(--pk-text)] placeholder:text-[color:var(--pk-text-mute)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">
                    Konfirmasi Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="min-h-11 rounded-xl border-[color:var(--pk-line-2)] bg-[#0b1626] px-3.5 text-base text-[color:var(--pk-text)] placeholder:text-[color:var(--pk-text-mute)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
                  />
                </div>

                <Button
                  type="submit"
                  className="pk-btn-primary inline-flex min-h-12 w-full items-center justify-center px-5 text-sm disabled:cursor-wait disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {loading ? t("common.loading") : t("nav.register")}
                </Button>
              </form>
            </div>

            <div className="mt-6 border-t border-[color:var(--pk-line)] pt-6">
              <p className="text-center text-xs text-[color:var(--pk-text-mute)]">
                Dengan mendaftar, Anda menyetujui{" "}
                <Link
                  href="/tos"
                  className="text-[color:var(--pk-accent)] hover:underline"
                >
                  Syarat & Ketentuan
                </Link>{" "}
                dan{" "}
                <Link
                  href="/privacy"
                  className="text-[color:var(--pk-accent)] hover:underline"
                >
                  Kebijakan Privasi
                </Link>
              </p>
              <p className="mt-4 text-center text-sm text-[color:var(--pk-text-dim)]">
                Sudah punya akun?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[color:var(--pk-accent)] underline decoration-[color:var(--pk-accent)]/40 underline-offset-4 hover:decoration-[color:var(--pk-accent)]"
                >
                  {t("nav.login")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </main>
  )
}