"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { PakaiKuotaLogo } from "@/components/brand/pakai-kuota-logo"
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [googleLoading, setGoogleLoading] = useState(false)
  const [state, setState] = useState<"idle" | "loading" | "error" | "success">(
    "idle"
  )
  const [message, setMessage] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState("loading")
    setMessage("")

    if (password !== confirmPassword) {
      setState("error")
      setMessage("Password dan konfirmasi tidak cocok.")
      return
    }

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = (await response.json().catch(() => null)) as
      | { error?: string; session?: unknown }
      | null

    if (!response.ok) {
      setState("error")
      setMessage(data?.error ?? "Akun tidak bisa dibuat.")
      return
    }

    if (data?.session) {
      router.push("/dashboard")
      router.refresh()
      return
    }

    setState("success")
    setMessage(
      "Akun dibuat. Cek email kamu untuk konfirmasi sebelum masuk."
    )
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setMessage("")
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    } catch {
      setState("error")
      setMessage("Gagal memulai login Google.")
      setGoogleLoading(false)
    }
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden text-(--pk-text) lg:grid-cols-[0.95fr_1.05fr]">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#0f1e38_0%,#050b16_55%,#03070e_100%)]" />
        <div className="pk-grid absolute inset-0" />
        <div className="pk-aurora">
          <span />
          <span />
        </div>
      </div>

      <aside className="relative hidden flex-col justify-between border-r border-(--pk-line) bg-[#070f1e]/60 p-10 backdrop-blur-sm lg:flex xl:p-14">
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-base font-semibold tracking-[-0.02em]"
        >
          <PakaiKuotaLogo size={32} />
          <span>
            Pakai
            <span className="text-(--pk-accent)">Kuota</span>
          </span>
        </Link>

        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
            Mulai dengan fondasi yang jelas
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.04em] xl:text-5xl">
            Buat akun, top up saldo,
            <br />
            lalu kirim{" "}
            <span className="pk-gradient-text">request pertama</span> kamu.
          </h1>

          <ul className="mt-8 space-y-3 text-sm text-(--pk-text-dim)">
            {[
              "Bayar dengan QRIS — tanpa kartu kredit luar negeri.",
              "Saldo Rupiah, biaya transparan per pemakaian.",
              "Endpoint chat completions yang familiar.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-(--pk-accent)"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="font-mono text-xs text-(--pk-text-mute)">
          /signup · pakaikuota.cloud
        </p>
      </aside>

      <section className="relative flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 flex items-center gap-2.5 text-base font-semibold tracking-[-0.02em] lg:hidden"
          >
            <PakaiKuotaLogo size={32} />
            <span>
              Pakai
              <span className="text-(--pk-accent)">Kuota</span>
            </span>
          </Link>

          <div className="pk-panel pk-inview p-6 sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
                Akun baru
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                Buat akun PakaiKuota
              </h2>
              <p className="mt-3 text-sm leading-6 text-(--pk-text-dim)">
                Gunakan email aktif. Konfirmasi email mungkin diperlukan.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || state === "loading"}
              className="pk-btn-ghost mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 text-sm font-medium disabled:cursor-wait disabled:opacity-60"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {googleLoading ? "Memuat..." : "Daftar dengan Google"}
            </button>

            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-(--pk-line)" />
              <span className="text-xs uppercase tracking-widest text-(--pk-text-mute)">
                atau
              </span>
              <span className="h-px flex-1 bg-(--pk-line)" />
            </div>

            {state === "error" && (
              <p
                role="alert"
                className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/40 bg-[#f87171]/10 px-4 py-3 text-sm text-[#fca5a5]"
              >
                <span aria-hidden className="mt-0.5">
                  ⚠
                </span>
                {message}
              </p>
            )}
            {state === "success" && (
              <p
                role="status"
                className="mb-4 flex items-start gap-3 rounded-xl border border-[#34d399]/40 bg-[#34d399]/10 px-4 py-3 text-sm text-[#6ee7b7]"
              >
                <span aria-hidden className="mt-0.5">
                  ✓
                </span>
                {message}
              </p>
            )}

            <form onSubmit={submit} className="space-y-5">
              <label className="block text-xs font-medium">
                Email
                <div className="relative mt-2">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--pk-text-mute)"
                  >
                    <Mail size={14} />
                  </span>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nama@email.com"
                    className="min-h-11 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] pl-10 pr-3.5 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25"
                  />
                </div>
              </label>

              <label className="block text-xs font-medium">
                Password
                <div className="relative mt-2">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--pk-text-mute)"
                  >
                    <Lock size={14} />
                  </span>
                  <input
                    required
                    minLength={8}
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="min-h-11 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] pl-10 pr-3.5 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25"
                  />
                </div>
                <span className="mt-1.5 block text-[11px] text-(--pk-text-mute)">
                  Minimal 8 karakter.
                </span>
              </label>

              <label className="block text-xs font-medium">
                Konfirmasi password
                <div className="relative mt-2">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--pk-text-mute)"
                  >
                    <Lock size={14} />
                  </span>
                  <input
                    required
                    minLength={8}
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="••••••••"
                    className="min-h-11 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] pl-10 pr-3.5 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={state === "loading" || state === "success"}
                className="pk-btn-primary inline-flex min-h-12 w-full items-center justify-center gap-2 px-5 text-sm disabled:cursor-wait disabled:opacity-60"
              >
                {state === "loading" ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Membuat akun...
                  </>
                ) : (
                  <>
                    Buat akun
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-(--pk-text-dim)">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-semibold text-(--pk-accent) underline decoration-(--pk-accent)/40 underline-offset-4 transition-colors hover:decoration-(--pk-accent)"
              >
                Masuk
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-(--pk-text-mute)">
            Dengan membuat akun, kamu menyetujui{" "}
            <Link
              href="/terms"
              className="text-(--pk-text-dim) hover:text-(--pk-accent)"
            >
              Ketentuan Layanan
            </Link>{" "}
            dan{" "}
            <Link
              href="/privacy"
              className="text-(--pk-text-dim) hover:text-(--pk-accent)"
            >
              Kebijakan Privasi
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  )
}