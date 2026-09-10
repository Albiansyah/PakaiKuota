"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      setState("error");
      const errorData = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setMessage(
        errorData?.error === "email_not_confirmed"
          ? "Email belum dikonfirmasi. Cek inbox email kamu."
          : "Email atau password tidak valid."
      );
      return;
    }
    const data = (await response.json()) as { role?: string };
    router.push(
      data.role === "super_admin" || data.role === "support"
        ? "/admin"
        : "/dashboard"
    );
    router.refresh();
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden text-[color:var(--pk-text)] lg:grid-cols-[0.95fr_1.05fr]">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#0f1e38_0%,#050b16_55%,#03070e_100%)]" />
        <div className="pk-grid absolute inset-0" />
        <div className="pk-aurora">
          <span />
          <span />
        </div>
      </div>

      <aside className="relative hidden flex-col justify-between border-r border-[color:var(--pk-line)] bg-[#070f1e]/60 p-10 backdrop-blur-sm lg:flex xl:p-14">
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-base font-semibold tracking-[-0.02em]"
        >
          <span className="pk-logo" aria-hidden />
          <span>
            Pakai<span className="text-[color:var(--pk-accent)]">Kuota</span>
          </span>
        </Link>

        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
            Akses kerja kamu
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.04em] xl:text-5xl">
            Masuk dan lihat saldo, key, serta pemakaian dalam{" "}
            <span className="pk-gradient-text">satu tempat</span>.
          </h1>

          <ul className="mt-8 space-y-3 text-sm text-[color:var(--pk-text-dim)]">
            {[
              "Saldo & pemakaian token real-time.",
              "Kelola API key tanpa pindah halaman.",
              "Pembayaran dalam Rupiah — angka billing tetap jelas.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[color:var(--pk-accent)]"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="font-mono text-xs text-[color:var(--pk-text-mute)]">
          /login · pakaikuota.id
        </p>
      </aside>

      <section className="relative flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 flex items-center gap-2.5 text-base font-semibold tracking-[-0.02em] lg:hidden"
          >
            <span className="pk-logo" aria-hidden />
            <span>
              Pakai<span className="text-[color:var(--pk-accent)]">Kuota</span>
            </span>
          </Link>

          <div className="pk-panel pk-reveal p-6 sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
                Akun
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                Masuk ke PakaiKuota
              </h2>
              <p className="mt-3 text-sm leading-6 text-[color:var(--pk-text-dim)]">
                Gunakan akun kamu untuk mengelola kuota dan API key.
              </p>
            </div>

            <form onSubmit={submit} className="mt-7 space-y-5">
              {state === "error" && (
                <p
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-[#f87171]/30 bg-[#f87171]/10 px-4 py-3 text-sm text-[#fca5a5]"
                >
                  <span aria-hidden className="mt-0.5">
                    ⚠
                  </span>
                  {message}
                </p>
              )}

              <label className="block text-sm font-medium">
                Email
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@email.com"
                  className="mt-2 min-h-11 w-full rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] px-3.5 text-base text-[color:var(--pk-text)] outline-none transition-colors placeholder:text-[color:var(--pk-text-mute)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
                />
              </label>

              <label className="block text-sm font-medium">
                Password
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="mt-2 min-h-11 w-full rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] px-3.5 text-base text-[color:var(--pk-text)] outline-none transition-colors placeholder:text-[color:var(--pk-text-mute)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
                />
              </label>

              <button
                type="submit"
                disabled={state === "loading"}
                className="pk-btn-primary inline-flex min-h-12 w-full items-center justify-center px-5 text-sm disabled:cursor-wait disabled:opacity-60"
              >
                {state === "loading" ? "Memeriksa akun..." : "Masuk"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-[color:var(--pk-line)]" />
              <span className="text-xs uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                atau
              </span>
              <span className="h-px flex-1 bg-[color:var(--pk-line)]" />
            </div>

            <p className="text-center text-sm text-[color:var(--pk-text-dim)]">
              Belum punya akun?{" "}
              <Link
                href="/signup"
                className="font-semibold text-[color:var(--pk-accent)] underline decoration-[color:var(--pk-accent)]/40 underline-offset-4 transition-colors hover:decoration-[color:var(--pk-accent)]"
              >
                Buat akun
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-[color:var(--pk-text-mute)]">
            Lupa password?{" "}
            <Link
              href="/forgot-password"
              className="hover:text-[color:var(--pk-text-dim)]"
            >
              Reset di sini
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}