"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useLanguage } from "@/components/providers/language-provider"
import {
  AlertTriangle,
  Bot,
  Check,
  Copy,
  Info,
  Loader2,
  LogIn,
  Send,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react"

type TrialModel = {
  id: string
  name: string
  tier: string
  description: string
}

const TRIAL_MODELS: TrialModel[] = [
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    tier: "Murah",
    description: "Cepat, cocok untuk chat umum",
  },
  {
    id: "claude-haiku",
    name: "Claude Haiku",
    tier: "Murah",
    description: "Ringan, responsif untuk task pendek",
  },
  {
    id: "glm-4-flash",
    name: "GLM-4 Flash",
    tier: "Murah",
    description: "Generasi cepat dari Zhipu AI",
  },
]

const TRIAL_DAILY_LIMIT = 20

export default function PlaygroundPage() {
  const { user } = useSupabase()
  const { t } = useLanguage()

  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState(TRIAL_MODELS[0].id)
  const [output, setOutput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [usedToday, setUsedToday] = useState(0)

  const outputRef = useRef<HTMLDivElement | null>(null)

  const selectedModel = useMemo(
    () => TRIAL_MODELS.find((m) => m.id === model),
    [model]
  )

  const remaining = Math.max(0, TRIAL_DAILY_LIMIT - usedToday)
  const limitReached = remaining === 0
  const canSubmit =
    !!user && prompt.trim().length > 0 && !loading && !limitReached

  useEffect(() => {
    if (output && outputRef.current) {
      outputRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }, [output])

  const handleSubmit = useCallback(async () => {
    if (!user) {
      setError("Login diperlukan untuk menggunakan playground")
      return
    }
    if (!prompt.trim()) {
      setError("Prompt tidak boleh kosong")
      return
    }
    if (limitReached) {
      setError(
        `Limit harian tercapai (${TRIAL_DAILY_LIMIT} request/hari). Coba lagi besok.`
      )
      return
    }

    setLoading(true)
    setError("")
    setOutput("")

    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 50,
        }),
      })
      const data = (await res.json()) as {
        output?: string
        error?: string
      }

      if (!res.ok) {
        setError(data.error ?? "Gagal mengirim request")
      } else {
        setOutput(data.output ?? JSON.stringify(data, null, 2))
        setUsedToday((v) => v + 1)
      }
    } catch {
      setError("Koneksi gagal. Coba lagi.")
    } finally {
      setLoading(false)
    }
  }, [user, prompt, model, limitReached])

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  function clearAll() {
    setPrompt("")
    setOutput("")
    setError("")
  }

  return (
    <div className="relative min-h-screen text-(--pk-text)">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#0f1e38_0%,#050b16_55%,#03070e_100%)]" />
        <div className="pk-grid absolute inset-0" />
      </div>

      <header className="border-b border-(--pk-line) bg-[#070f1e]/60 px-5 py-12 backdrop-blur-sm sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
            Coba gratis
          </p>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            <Sparkles size={26} className="text-(--pk-accent)" />
            Playground
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-(--pk-text-dim)">
            Test model AI langsung dari browser. Gunakan quota trial
            (tanpa menguras saldo), maksimal {TRIAL_DAILY_LIMIT} request
            per hari.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <section className="pk-panel pk-inview p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold">Pilih Model</h2>
                  <p className="mt-1 text-sm text-(--pk-text-dim)">
                    Model yang tersedia untuk trial
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {TRIAL_MODELS.map((m) => {
                  const active = model === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModel(m.id)}
                      aria-pressed={active}
                      className={`flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all ${
                        active
                          ? "border-(--pk-accent)/50 bg-(--pk-accent)/10 shadow-[0_6px_18px_-8px_rgba(240,169,59,0.6)]"
                          : "border-(--pk-line-2) bg-[#0b1626] hover:border-(--pk-accent)/30"
                      }`}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <span
                          className={`text-sm font-medium ${
                            active
                              ? "text-(--pk-accent)"
                              : "text-(--pk-text)"
                          }`}
                        >
                          {m.name}
                        </span>
                        {active && (
                          <Check
                            size={14}
                            className="shrink-0 text-(--pk-accent)"
                          />
                        )}
                      </div>
                      <span className="text-[11px] text-(--pk-text-mute)">
                        {m.description}
                      </span>
                      <span
                        className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                          active
                            ? "border-(--pk-accent)/40 bg-(--pk-accent)/10 text-(--pk-accent)"
                            : "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim)"
                        }`}
                      >
                        {m.tier}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="pk-panel pk-inview p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold">Prompt</h2>
                  <p className="mt-1 text-sm text-(--pk-text-dim)">
                    Tulis pertanyaan atau instruksi untuk model
                  </p>
                </div>
                {(prompt || output) && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-(--pk-line-2) bg-[#0b1626] px-2.5 text-[11px] font-medium text-(--pk-text-dim) transition-colors hover:border-[#f87171]/40 hover:text-[#fca5a5]"
                  >
                    <Trash2 size={12} />
                    Bersihkan
                  </button>
                )}
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    (e.metaKey || e.ctrlKey) &&
                    e.key === "Enter" &&
                    canSubmit
                  ) {
                    e.preventDefault()
                    void handleSubmit()
                  }
                }}
                disabled={loading}
                rows={6}
                maxLength={2000}
                placeholder="Contoh: Jelaskan apa itu API dalam 2 kalimat singkat..."
                className="mt-4 w-full resize-none rounded-xl border border-(--pk-line-2) bg-[#0b1626] px-4 py-3 font-mono text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25 disabled:opacity-60"
              />

              <div className="mt-2 flex items-center justify-between text-[10px] text-(--pk-text-mute)">
                <span>
                  Tip: <kbd className="rounded border border-(--pk-line-2) bg-[#0b1626] px-1 py-0.5 font-mono">⌘/Ctrl</kbd>{" "}
                  + <kbd className="rounded border border-(--pk-line-2) bg-[#0b1626] px-1 py-0.5 font-mono">Enter</kbd>{" "}
                  untuk kirim
                </span>
                <span className="font-mono">{prompt.length}/2000</span>
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#f87171]/40 bg-[#f87171]/10 px-4 py-3 text-sm text-[#fca5a5]">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-(--pk-text-mute)">
                  {limitReached
                    ? "Limit harian tercapai. Coba lagi besok."
                    : `Sisa ${remaining} dari ${TRIAL_DAILY_LIMIT} request hari ini`}
                </p>
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!canSubmit}
                  className="pk-btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-6 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Mengirim...
                    </>
                  ) : !user ? (
                    <>
                      <LogIn size={14} />
                      Login untuk mengirim
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Kirim ke model
                    </>
                  )}
                </button>
              </div>
            </section>

            {output && (
              <section
                ref={outputRef}
                className="pk-panel pk-inview p-5 sm:p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-(--pk-accent)/40 bg-(--pk-accent)/10">
                      <Sparkles size={16} className="text-(--pk-accent)" />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold">Response</h2>
                      <p className="text-[11px] text-(--pk-text-mute)">
                        Dari {selectedModel?.name}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyOutput()}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-(--pk-line-2) bg-[#0b1626] px-2.5 text-[11px] font-medium text-(--pk-text-dim) transition-colors hover:border-(--pk-accent)/50 hover:text-(--pk-accent)"
                  >
                    {copied ? (
                      <>
                        <Check size={12} />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        Salin
                      </>
                    )}
                  </button>
                </div>

                <pre className="pk-terminal mt-4 max-h-100 overflow-x-auto rounded-xl border border-(--pk-line-2) bg-[#050b16] p-4 font-mono text-[12.5px] leading-6 whitespace-pre-wrap text-(--pk-text)">
                  <code>{output}</code>
                </pre>
              </section>
            )}
          </div>

          <div className="space-y-5">
            <section className="pk-panel pk-inview p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-(--pk-accent)" />
                <h2 className="text-base font-semibold">Info Trial</h2>
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-(--pk-text-mute)">Limit harian</dt>
                  <dd className="font-mono text-(--pk-text)">
                    {TRIAL_DAILY_LIMIT} request
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-(--pk-line) pt-3">
                  <dt className="text-(--pk-text-mute)">Sudah dipakai</dt>
                  <dd className="font-mono text-(--pk-text)">
                    {usedToday} request
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-(--pk-line) pt-3">
                  <dt className="text-(--pk-text-mute)">Sisa hari ini</dt>
                  <dd
                    className={`font-mono font-semibold ${
                      limitReached
                        ? "text-[#fca5a5]"
                        : "text-(--pk-accent)"
                    }`}
                  >
                    {remaining} request
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-(--pk-line) pt-3">
                  <dt className="text-(--pk-text-mute)">Model aktif</dt>
                  <dd>
                    <span className="inline-flex items-center rounded-full border border-(--pk-accent)/40 bg-(--pk-accent)/10 px-2.5 py-0.5 text-[10px] font-medium text-(--pk-accent)">
                      {selectedModel?.name}
                    </span>
                  </dd>
                </div>
              </dl>

              <div className="mt-5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0b1626]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      limitReached
                        ? "bg-[#f87171]"
                        : "bg-linear-to-r from-[#ffc266] to-[#f0a93b]"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (usedToday / TRIAL_DAILY_LIMIT) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </section>

            <section className="pk-panel pk-inview p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Bot size={14} className="text-(--pk-accent)" />
                <h2 className="text-base font-semibold">Tips</h2>
              </div>
              <ul className="mt-4 space-y-2.5 text-sm text-(--pk-text-dim)">
                <li className="flex items-start gap-2.5">
                  <Info
                    size={13}
                    className="mt-1 shrink-0 text-(--pk-text-mute)"
                  />
                  <span>
                    Playground pakai <strong className="text-(--pk-text)">quota trial</strong>, bukan saldo asli.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Info
                    size={13}
                    className="mt-1 shrink-0 text-(--pk-text-mute)"
                  />
                  <span>
                    Model dibatasi untuk trial — <strong className="text-(--pk-text)">login diperlukan</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Info
                    size={13}
                    className="mt-1 shrink-0 text-(--pk-text-mute)"
                  />
                  <span>
                    Limit direset setiap hari jam <strong className="text-(--pk-text)">00.00 WIB</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Info
                    size={13}
                    className="mt-1 shrink-0 text-(--pk-text-mute)"
                  />
                  <span>
                    Output dibatasi <strong className="text-(--pk-text)">50 token</strong> untuk efisiensi.
                  </span>
                </li>
              </ul>
            </section>

            {!user ? (
              <section className="pk-panel pk-inview relative overflow-hidden border-(--pk-accent)/40 bg-linear-to-br from-(--pk-accent)/15 via-transparent to-transparent p-5 sm:p-6">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(closest-side,rgba(240,169,59,0.25),transparent)]"
                />
                <div className="relative">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--pk-accent)/40 bg-(--pk-accent)/10">
                    <Sparkles size={18} className="text-(--pk-accent)" />
                  </span>
                  <h3 className="mt-3 text-base font-semibold">
                    Mau akses penuh?
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-(--pk-text-dim)">
                    Daftar dan top-up saldo untuk akses semua model tanpa
                    batas trial.
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Link
                      href="/register"
                      className="pk-btn-primary inline-flex min-h-10 items-center justify-center gap-2 px-4 text-sm"
                    >
                      Daftar Sekarang
                    </Link>
                    <Link
                      href="/login"
                      className="pk-btn-ghost inline-flex min-h-10 items-center justify-center px-4 text-sm font-medium"
                    >
                      Sudah punya akun
                    </Link>
                  </div>
                </div>
              </section>
            ) : (
              <section className="pk-panel pk-inview p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-(--pk-accent)" />
                  <h2 className="text-base font-semibold">Butuh lebih?</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-(--pk-text-dim)">
                  Top-up saldo untuk akses semua model (termasuk Ultra) tanpa
                  batas trial.
                </p>
                <Link
                  href="/dashboard/topup"
                  className="pk-btn-primary mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 px-4 text-sm"
                >
                  <Zap size={14} />
                  Top-up saldo
                </Link>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}