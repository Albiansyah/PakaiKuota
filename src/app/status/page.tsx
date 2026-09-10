"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/components/providers/language-provider"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Cloud,
  Loader2,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-react"

type StatusValue = "ok" | "degraded" | "error" | "loading"

type StatusData = {
  gateway: string
  upstream: string
  timestamp: string
}

const REFRESH_INTERVAL = 30_000

function toneFor(status: string | undefined) {
  switch (status) {
    case "ok":
      return {
        border: "border-[#34d399]/30",
        bg: "bg-[#34d399]/10",
        text: "text-[#6ee7b7]",
        dot: "bg-[#34d399]",
        label: "Operasional",
      }
    case "degraded":
      return {
        border: "border-[#fbbf24]/30",
        bg: "bg-[#fbbf24]/10",
        text: "text-[#fcd34d]",
        dot: "bg-[#fbbf24]",
        label: "Degradasi",
      }
    case "error":
      return {
        border: "border-[#f87171]/30",
        bg: "bg-[#f87171]/10",
        text: "text-[#fca5a5]",
        dot: "bg-[#f87171]",
        label: "Gangguan",
      }
    default:
      return {
        border: "border-(--pk-line-2)",
        bg: "bg-[#0b1626]",
        text: "text-(--pk-text-mute)",
        dot: "bg-(--pk-text-mute)",
        label: "Memuat...",
      }
  }
}

function StatusIcon({ status }: { status: string | undefined }) {
  const tone = toneFor(status)
  const className = `h-4 w-4 ${tone.text}`
  if (status === "ok") return <CheckCircle2 className={className} />
  if (status === "error" || status === "degraded")
    return <XCircle className={className} />
  if (status === undefined) return <AlertTriangle className={className} />
  return <AlertTriangle className={className} />
}

export default function StatusPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchStatus = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/status")
      if (!res.ok) throw new Error("Failed")
      const result = (await res.json()) as StatusData
      setData(result)
      setLastRefresh(new Date())
    } catch (err) {
      console.error("Failed to fetch status:", err)
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void fetchStatus()
    const interval = setInterval(() => void fetchStatus(true), REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const overallStatus: StatusValue = (() => {
    if (loading || !data) return "loading"
    const values = [data.gateway, data.upstream]
    if (values.some((v) => v === "error")) return "error"
    if (values.some((v) => v === "degraded")) return "degraded"
    if (values.every((v) => v === "ok")) return "ok"
    return "loading"
  })()

  const overallTone = toneFor(overallStatus)
  const overallLabel =
    overallStatus === "ok"
      ? "Semua sistem normal"
      : overallStatus === "degraded"
        ? "Beberapa layanan terdegradasi"
        : overallStatus === "error"
          ? "Ada gangguan pada layanan"
          : "Memeriksa status..."

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
      <header className="border-b border-(--pk-line) bg-[#070f1e]/60 px-5 py-8 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Back to home */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-(--pk-text-dim) transition-colors hover:text-(--pk-accent)"
          >
            <ArrowLeft size={13} />
            Kembali ke halaman utama
          </Link>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
                Status
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                {t("status.title")}
              </h1>
              <p className="mt-3 flex items-center gap-2 text-sm text-(--pk-text-dim)">
                <Clock size={14} className="text-(--pk-text-mute)" />
                Update terakhir:{" "}
                {loading ? (
                  "..."
                ) : (
                  <span className="font-mono">
                    {lastRefresh.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchStatus(true)}
              disabled={refreshing || loading}
              aria-label="Refresh status"
              className="pk-btn-ghost inline-flex h-10 w-10 items-center justify-center disabled:opacity-60"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-12">
        {/* Overall status banner */}
        <div
          className={`pk-panel pk-inview mb-6 flex items-center gap-3 border ${overallTone.border} ${overallTone.bg} px-5 py-4`}
        >
          <span className="relative flex h-3 w-3 shrink-0">
            {overallStatus === "ok" && (
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full ${overallTone.dot} opacity-75`}
              />
            )}
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${overallTone.dot}`}
            />
          </span>
          <p className={`text-sm font-medium ${overallTone.text}`}>
            {overallLabel}
          </p>
        </div>

        {error && (
          <div className="pk-panel mb-6 p-5 text-center">
            <p className="text-sm text-[#fca5a5]">
              Data status tidak bisa dimuat.
            </p>
            <button
              type="button"
              onClick={() => void fetchStatus()}
              className="pk-btn-ghost mt-4 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Services */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          {/* Gateway */}
          <article className="pk-panel pk-inview p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-(--pk-accent)/40 bg-(--pk-accent)/10">
                <Server size={20} className="text-(--pk-accent)" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold">
                  {t("status.gateway")}
                </h2>
                <p className="mt-0.5 text-xs text-(--pk-text-mute)">
                  API Gateway · endpoint publik
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-(--pk-line) pt-4">
              <div className="flex items-center gap-2">
                {loading ? (
                  <Loader2
                    size={14}
                    className="animate-spin text-(--pk-text-mute)"
                  />
                ) : (
                  <StatusIcon status={data?.gateway} />
                )}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
                    toneFor(data?.gateway).border
                  } ${toneFor(data?.gateway).bg} ${toneFor(data?.gateway).text}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${toneFor(data?.gateway).dot}`}
                  />
                  {toneFor(data?.gateway).label}
                </span>
              </div>
              <span className="font-mono text-[11px] text-(--pk-text-mute)">
                {data?.gateway ?? "—"}
              </span>
            </div>
          </article>

          {/* Upstream */}
          <article className="pk-panel pk-inview p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-(--pk-accent)/40 bg-(--pk-accent)/10">
                <Cloud size={20} className="text-(--pk-accent)" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold">
                  {t("status.upstream")}
                </h2>
                <p className="mt-0.5 text-xs text-(--pk-text-mute)">
                  OpenRouter · penyedia model upstream
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-(--pk-line) pt-4">
              <div className="flex items-center gap-2">
                {loading ? (
                  <Loader2
                    size={14}
                    className="animate-spin text-(--pk-text-mute)"
                  />
                ) : (
                  <StatusIcon status={data?.upstream} />
                )}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
                    toneFor(data?.upstream).border
                  } ${toneFor(data?.upstream).bg} ${toneFor(data?.upstream).text}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${toneFor(data?.upstream).dot}`}
                  />
                  {toneFor(data?.upstream).label}
                </span>
              </div>
              <span className="font-mono text-[11px] text-(--pk-text-mute)">
                {data?.upstream ?? "—"}
              </span>
            </div>
          </article>
        </section>

        {/* Incident History */}
        <section className="pk-panel pk-inview p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Riwayat Insiden</h2>
              <p className="mt-1 text-sm text-(--pk-text-dim)">
                Tidak ada insiden dalam 30 hari terakhir.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-(--pk-line-2) bg-[#0b1626]/60 p-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#34d399]/40 bg-[#34d399]/10">
              <CheckCircle2 size={24} className="text-[#6ee7b7]" />
            </span>
            <p className="mt-4 text-sm font-medium">
              Semua sistem beroperasi normal
            </p>
            <p className="mt-1 text-xs text-(--pk-text-mute)">
              Uptime 99.9% dalam 30 hari terakhir.
            </p>
          </div>
        </section>

        {/* Footer note */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-(--pk-line-2) bg-[#0b1626] px-3 py-1.5 text-[11px] font-medium text-(--pk-text-dim)">
            <RefreshCw size={11} />
            Status diperbarui otomatis setiap 30 detik
          </div>
          <p className="text-xs text-(--pk-text-mute)">
            Ada pertanyaan tentang status?{" "}
            <Link
              href="/docs"
              className="text-(--pk-accent) transition-colors hover:underline"
            >
              Baca dokumentasi
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}