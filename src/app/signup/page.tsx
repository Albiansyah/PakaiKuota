"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error" | "success">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await response.json().catch(() => null)) as
      | { error?: string; session?: unknown }
      | null;
    if (!response.ok) {
      setState("error");
      setMessage(data?.error ?? "Akun tidak bisa dibuat.");
      return;
    }
    if (data?.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setState("success");
    setMessage(
      "Akun dibuat. Cek email kamu untuk konfirmasi sebelum masuk."
    );
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden text-[color:var(--pk-text)] lg:grid-cols-[0.95fr_1.05fr]">
      {/* ============ LATAR GLOBAL ============ */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#0f1e38_0%,#050b16_55%,#03070e_100%)]" />
        <div className="pk-grid absolute inset-0" />
        <div className="pk-aurora">
          <span />
          <span />
        </div>
      </div>

      {/* ============ PANEL KIRI (brand & pitch) ============ */}
      <aside className="relative hidden flex-col justify-between border-r border-[color:var(--pk-line)] bg-[#070f1e]/60 p-10 backdrop-blur-sm lg:flex xl:p-14">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-base font-semibold tracking-[-0.02em]"
        >
          <span className="pk-logo" aria-hidden />
          <span>
            Pakai<span className="text-[color:var(--pk-accent)]">Kuota</span>
          </span>
        </Link>

        {/* Konten tengah */}
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
            Mulai dengan fondasi yang jelas
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.04em] xl:text-5xl">
            Buat akun, isi kuota,
            <br />
            lalu kirim{" "}
            <span className="pk-gradient-text">request pertama</span> kamu.
          </h1>

          <ul className="mt-8 space-y-3 text-sm text-[color:var(--pk-text-dim)]">
            {[
              "Bayar dengan QRIS atau VA — tanpa kartu kredit luar negeri.",
              "Saldo & biaya token transparan di dashboard.",
              "Endpoint chat completions yang familiar.",
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

        {/* Footer kecil */}
        <p className="font-mono text-xs text-[color:var(--pk-text-mute)]">
          /signup · pakaikuota.id
        </p>
      </aside>

      {/* ============ PANEL KANAN (form) ============ */}
      <section className="relative flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          {/* Brand mobile */}
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
            {/* Header form */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
                Akun baru
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                Buat akun PakaiKuota
              </h2>
              <p className="mt-3 text-sm leading-6 text-[color:var(--pk-text-dim)]">
                Gunakan email aktif. Konfirmasi email mungkin diperlukan.
              </p>
            </div>

            {/* Alert state */}
            {state === "error" && (
              <p
                role="alert"
                className="mt-6 flex items-start gap-3 rounded-lg border border-[#f87171]/30 bg-[#f87171]/10 px-4 py-3 text-sm text-[#fca5a5]"
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
                className="mt-6 flex items-start gap-3 rounded-lg border border-[#34d399]/30 bg-[#34d399]/10 px-4 py-3 text-sm text-[#6ee7b7]"
              >
                <span aria-hidden className="mt-0.5">
                  ✓
                </span>
                {message}
              </p>
            )}

            {/* Form */}
            <form onSubmit={submit} className="mt-7 space-y-5">
              <label className="block text-sm font-medium">
                Email
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@email.com"
                  className="mt-2 min-h-11 w-full rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] px-3.5 text-base text-[color:var(--pk-text)] outline-none transition-colors placeholder:text-[color:var(--pk-text-mute)] hover:border-[color:var(--pk-line-2)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
                />
              </label>

              <label className="block text-sm font-medium">
                Password
                <input
                  required
                  minLength={8}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="mt-2 min-h-11 w-full rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] px-3.5 text-base text-[color:var(--pk-text)] outline-none transition-colors placeholder:text-[color:var(--pk-text-mute)] hover:border-[color:var(--pk-line-2)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
                />
                <span className="mt-2 block text-xs text-[color:var(--pk-text-mute)]">
                  Minimal 8 karakter.
                </span>
              </label>

              <button
                type="submit"
                disabled={state === "loading" || state === "success"}
                className="pk-btn-primary inline-flex min-h-12 w-full items-center justify-center px-5 text-sm disabled:cursor-wait disabled:opacity-60"
              >
                {state === "loading" ? "Membuat akun..." : "Buat akun"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-[color:var(--pk-line)]" />
              <span className="text-xs uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                atau
              </span>
              <span className="h-px flex-1 bg-[color:var(--pk-line)]" />
            </div>

            {/* Link ke login */}
            <p className="text-center text-sm text-[color:var(--pk-text-dim)]">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-semibold text-[color:var(--pk-accent)] underline decoration-[color:var(--pk-accent)]/40 underline-offset-4 transition-colors hover:decoration-[color:var(--pk-accent)]"
              >
                Masuk
              </Link>
            </p>
          </div>

          {/* Foot note */}
          <p className="mt-6 text-center text-xs text-[color:var(--pk-text-mute)]">
            Dengan membuat akun, kamu menyetujui{" "}
            <Link href="/terms" className="hover:text-[color:var(--pk-text-dim)]">
              Ketentuan Layanan
            </Link>{" "}
            dan{" "}
            <Link
              href="/privacy"
              className="hover:text-[color:var(--pk-text-dim)]"
            >
              Kebijakan Privasi
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}