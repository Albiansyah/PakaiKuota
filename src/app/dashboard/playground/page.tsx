"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  Check,
  Copy,
  Loader2,
  Send,
  Square,
  Trash2,
} from "lucide-react"

type Model = { id: string; object: string; owned_by: string }

export default function PlaygroundPage() {
  const [models, setModels] = useState<Model[]>([])
  const [model, setModel] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [system, setSystem] = useState("You are a concise assistant.")
  const [message, setMessage] = useState("")
  const [responseText, setResponseText] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [elapsed, setElapsed] = useState<number | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const responseRef = useRef<HTMLPreElement | null>(null)

  useEffect(() => {
    if (!apiKey) {
      setState("idle")
      setModels([])
      setModel("")
      return
    }
    let active = true
    setState("loading")
    setError("")
    const timer = setTimeout(() => {
      fetch("/api/v1/models", {
        headers: { authorization: `Bearer ${apiKey}` },
      })
        .then(async (res) => {
          if (!active) return
          if (!res.ok) {
            throw new Error(
              "API key tidak valid atau model tidak tersedia."
            )
          }
          const data = (await res.json()) as { data: Model[] }
          if (!active) return
          setModels(data.data)
          setModel(data.data[0]?.id ?? "")
          setState("ready")
        })
        .catch((err: Error) => {
          if (!active) return
          setError(err.message)
          setState("error")
        })
    }, 400)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [apiKey])

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight
    }
  }, [responseText])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError("")
    setResponseText("")
    setElapsed(null)

    const controller = new AbortController()
    abortRef.current = controller
    const start = performance.now()

    try {
      const response = await fetch("/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
          "idempotency-key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(system.trim()
              ? [{ role: "system", content: system }]
              : []),
            { role: "user", content: message },
          ],
          max_tokens: 256,
          stream: false,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: { message?: string } | string }
          | null
        const message =
          typeof data?.error === "string"
            ? data.error
            : data?.error?.message
        throw new Error(message ?? "Request gagal.")
      }

      // Non-streaming: parse JSON biasa
      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[]
        error?: { message?: string } | string
      }

      // Kalau backend balikin error via body (walau status 200)
      if (data.error) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : data.error.message
        throw new Error(msg ?? "Request gagal.")
      }

      const output = data.choices?.[0]?.message?.content ?? ""
      setResponseText(output)
      setElapsed(performance.now() - start)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setElapsed(performance.now() - start)
      } else {
        setError(err instanceof Error ? err.message : "Request gagal.")
      }
    } finally {
      setSubmitting(false)
      abortRef.current = null
    }
  }

  function stop() {
    abortRef.current?.abort()
  }

  async function copyResponse() {
    try {
      await navigator.clipboard.writeText(responseText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  function clearResponse() {
    setResponseText("")
    setElapsed(null)
    setError("")
  }

  const inputClass =
    "mt-2 min-h-11 w-full rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] px-3.5 text-sm text-[color:var(--pk-text)] outline-none transition-colors placeholder:text-[color:var(--pk-text-mute)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"

  return (
    <div className="relative min-h-screen text-[color:var(--pk-text)]">
      <header className="border-b border-[color:var(--pk-line)] bg-[#070f1e]/60 px-5 py-8 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
            Developer tool
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Playground
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--pk-text-dim)]">
            Uji chat completions dengan konfigurasi sederhana.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          {/* ============ FORM ============ */}
          <form
            onSubmit={submit}
            className="pk-panel pk-inview flex min-w-0 flex-col p-5 sm:p-6"
          >
            <div>
              <h2 className="text-base font-semibold">Konfigurasi</h2>
              <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                API key hanya dipakai untuk request ini.
              </p>
            </div>

            <div className="mt-6 flex flex-1 flex-col gap-5">
              <label className="block text-sm font-medium">
                API key
                <input
                  required
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="pk_live_..."
                  autoComplete="off"
                  className={`${inputClass} font-mono`}
                />
                <span className="mt-2 flex items-center gap-2 text-xs text-[color:var(--pk-text-mute)]">
                  {state === "loading" && (
                    <>
                      <Loader2 size={11} className="animate-spin" />
                      Memuat model...
                    </>
                  )}
                  {state === "ready" && (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                      {models.length} model tersedia
                    </>
                  )}
                  {state === "idle" && "Masukkan API key untuk memuat model."}
                  {state === "error" && (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#f87171]" />
                      Gagal memuat model
                    </>
                  )}
                </span>
              </label>

              <label className="block text-sm font-medium">
                Model
                <select
                  required
                  disabled={state !== "ready"}
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <option value="">
                    {state === "error"
                      ? "Model tidak tersedia"
                      : state === "ready"
                        ? "Pilih model"
                        : "Masukkan API key dulu"}
                  </option>
                  {models.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.id}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                System message
                <textarea
                  value={system}
                  onChange={(event) => setSystem(event.target.value)}
                  rows={3}
                  className={`${inputClass} resize-y py-2.5`}
                />
              </label>

              <label className="block text-sm font-medium">
                Pesan
                <textarea
                  required
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={6}
                  placeholder="Tulis pesan kamu di sini..."
                  className={`${inputClass} resize-y py-2.5`}
                />
              </label>

              {error && (
                <p
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-[#f87171]/30 bg-[#f87171]/10 px-4 py-3 text-sm text-[#fca5a5]"
                >
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  {error}
                </p>
              )}

              <div className="mt-auto flex gap-2 border-t border-[color:var(--pk-line)] pt-5">
                {submitting ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#f87171]/40 bg-[#f87171]/10 px-5 text-sm font-medium text-[#fca5a5] transition-colors hover:bg-[#f87171]/20"
                  >
                    <Square size={13} fill="currentColor" />
                    Hentikan
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={state !== "ready" || !message.trim()}
                    className="pk-btn-primary inline-flex min-h-11 flex-1 items-center justify-center gap-2 px-5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={13} />
                    Kirim
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* ============ RESPONSE ============ */}
          <section className="pk-panel pk-inview flex min-w-0 flex-col p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Response</h2>
                <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                  {submitting
                    ? "Menunggu response..."
                    : elapsed
                      ? `Selesai dalam ${(elapsed / 1000).toFixed(2)}s`
                      : "Response akan tampil di sini."}
                </p>
              </div>

              {(responseText || error) && !submitting && (
                <div className="flex items-center gap-1.5">
                  {responseText && (
                    <button
                      type="button"
                      onClick={copyResponse}
                      aria-label="Salin response"
                      className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-all ${
                        copied
                          ? "border-[#34d399]/50 bg-[#34d399]/15 text-[#6ee7b7]"
                          : "border-[color:var(--pk-line-2)] text-[color:var(--pk-text-mute)] hover:border-[color:var(--pk-accent)]/50 hover:text-[color:var(--pk-accent)]"
                      }`}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? "Tersalin" : "Salin"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={clearResponse}
                    aria-label="Bersihkan response"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--pk-line-2)] text-[color:var(--pk-text-mute)] transition-colors hover:border-[#f87171]/40 hover:text-[#fca5a5]"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>

            <pre
              ref={responseRef}
              className="pk-scroll pk-terminal mt-4 min-h-[24rem] max-w-full flex-1 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-[color:var(--pk-line)] p-4 font-mono text-[13px] leading-6 text-[color:var(--pk-text)]"
            >
              {responseText ? (
                responseText
              ) : submitting ? (
                <span className="text-[color:var(--pk-text-mute)]">
                  Menunggu response...
                </span>
              ) : (
                <span className="text-[color:var(--pk-text-mute)]">
                  Isi konfigurasi di kiri, lalu kirim pesan.
                </span>
              )}
            </pre>

            {state === "ready" && model && !submitting && (
              <p className="mt-3 flex items-center gap-2 text-[11px] text-[color:var(--pk-text-mute)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--pk-accent)]" />
                Model aktif:{" "}
                <code className="font-mono text-[color:var(--pk-text-dim)]">
                  {model}
                </code>
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}