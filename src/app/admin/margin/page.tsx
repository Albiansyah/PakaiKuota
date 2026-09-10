"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import {
  AlertTriangle,
  BarChart3,
  Loader2,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react"
import { getModelTierLabel } from "@/lib/model-tier-labels"

type ModelMarkup = {
  id: string
  name: string
  provider: string
  tier: string
  upstream_price_per_token: number
  markup_price_per_token: number
  is_active: boolean
}

type MarginFilter = "all" | "low" | "negative" | "healthy"

const filters: { value: MarginFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "negative", label: "Negatif" },
  { value: "low", label: "Tipis (<10%)" },
  { value: "healthy", label: "Sehat (≥10%)" },
]

function calcMargin(upstream: number, markup: number) {
  if (markup === 0) return 0
  return ((markup - upstream) / markup) * 100
}

function marginTone(margin: number) {
  if (margin < 0)
    return {
      text: "text-[#fca5a5]",
      bar: "from-[#f87171] to-[#ef4444]",
      glow: "shadow-[0_0_18px_-4px_rgba(248,113,113,0.6)]",
      dot: "bg-[#f87171]",
      badge: "border-[#f87171]/30 bg-[#f87171]/10 text-[#fca5a5]",
      label: "Negatif",
    }
  if (margin < 10)
    return {
      text: "text-[color:var(--pk-accent)]",
      bar: "from-[#ffc266] to-[#f0a93b]",
      glow: "shadow-[0_0_18px_-4px_rgba(240,169,59,0.6)]",
      dot: "bg-[color:var(--pk-accent)]",
      badge: "border-[color:var(--pk-accent)]/30 bg-[color:var(--pk-accent)]/10 text-[color:var(--pk-accent)]",
      label: "Tipis",
    }
  return {
    text: "text-[#6ee7b7]",
    bar: "from-[#34d399] to-[#10b981]",
    glow: "shadow-[0_0_18px_-4px_rgba(52,211,153,0.6)]",
    dot: "bg-[#34d399]",
    badge: "border-[#34d399]/30 bg-[#34d399]/10 text-[#6ee7b7]",
    label: "Sehat",
  }
}

function tierTone(tier: string) {
  if (tier === "murah")
    return "border-[#34d399]/30 bg-[#34d399]/10 text-[#6ee7b7]"
  if (tier === "mahal")
    return "border-[#f87171]/30 bg-[#f87171]/10 text-[#fca5a5]"
  return "border-[color:var(--pk-line-2)] bg-[#0b1626] text-[color:var(--pk-text-dim)]"
}

export default function AdminMarginPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [models, setModels] = useState<ModelMarkup[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState<MarginFilter>("all")
  const [query, setQuery] = useState("")
  const [mounted, setMounted] = useState(false)

  const fetchModels = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(false)
    try {
      const res = await fetch("/api/admin/models")
      if (!res.ok) throw new Error("unauthorized")
      const data = (await res.json()) as { models?: ModelMarkup[] }
      setModels(data.models ?? [])
      setMounted(false)
      requestAnimationFrame(() => setMounted(true))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    void fetchModels()
  }, [user, router, fetchModels])

  const enriched = useMemo(() => {
    return models
      .map((m) => ({
        ...m,
        margin: calcMargin(m.upstream_price_per_token, m.markup_price_per_token),
      }))
      .sort((a, b) => a.margin - b.margin)
  }, [models])

  const stats = useMemo(() => {
    if (enriched.length === 0) {
      return { total: 0, negative: 0, low: 0, healthy: 0, avg: 0 }
    }
    const negative = enriched.filter((m) => m.margin < 0).length
    const low = enriched.filter((m) => m.margin >= 0 && m.margin < 10).length
    const healthy = enriched.filter((m) => m.margin >= 10).length
    const avg =
      enriched.reduce((sum, m) => sum + m.margin, 0) / enriched.length
    return { total: enriched.length, negative, low, healthy, avg }
  }, [enriched])

  const filtered = useMemo(() => {
    let list = enriched
    if (filter === "negative") list = list.filter((m) => m.margin < 0)
    else if (filter === "low")
      list = list.filter((m) => m.margin >= 0 && m.margin < 10)
    else if (filter === "healthy") list = list.filter((m) => m.margin >= 10)

    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q)
      )
    }
    return list
  }, [enriched, filter, query])

  const maxAbsMargin = useMemo(
    () => Math.max(...enriched.map((m) => Math.abs(m.margin)), 1),
    [enriched]
  )

  return (
    <div className="relative min-h-screen text-[color:var(--pk-text)]">
      <header className="border-b border-[color:var(--pk-line)] bg-[#070f1e]/60 px-5 py-8 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
                Admin tool
              </p>
              <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                <BarChart3 size={26} className="text-[color:var(--pk-accent)]" />
                Monitor Margin
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--pk-text-dim)]">
                Margin per model — dari paling tipis ke paling tebal.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchModels(true)}
              disabled={refreshing}
              className="pk-btn-ghost inline-flex min-h-10 items-center gap-2 px-4 text-sm font-medium disabled:opacity-60"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Memuat..." : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {error && (
          <div className="pk-panel mb-6 p-5 text-center">
            <p className="text-sm text-[#fca5a5]">
              Data model tidak bisa dimuat.
            </p>
            <button
              type="button"
              onClick={() => void fetchModels()}
              className="pk-btn-ghost mt-4 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
            >
              Coba lagi
            </button>
          </div>
        )}

        {!error && !loading && enriched.length > 0 && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="pk-panel pk-inview p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                    Rata-rata margin
                  </p>
                  <TrendingUp size={14} className="text-[color:var(--pk-accent)]" />
                </div>
                <p
                  className={`mt-3 font-mono text-2xl ${marginTone(stats.avg).text}`}
                >
                  {stats.avg.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                  Dari {stats.total} model aktif
                </p>
              </div>

              <div className="pk-panel pk-inview p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                    Sehat
                  </p>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                </div>
                <p className="mt-3 font-mono text-2xl text-[#6ee7b7]">
                  {stats.healthy}
                </p>
                <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                  Margin ≥ 10%
                </p>
              </div>

              <div className="pk-panel pk-inview p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                    Tipis
                  </p>
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--pk-accent)]" />
                </div>
                <p className="mt-3 font-mono text-2xl text-[color:var(--pk-accent)]">
                  {stats.low}
                </p>
                <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                  Margin 0–10%
                </p>
              </div>

              <div
                className={`pk-panel pk-inview p-5 ${
                  stats.negative > 0 ? "pk-featured" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                    Negatif
                  </p>
                  <TrendingDown size={14} className="text-[#fca5a5]" />
                </div>
                <p className="mt-3 font-mono text-2xl text-[#fca5a5]">
                  {stats.negative}
                </p>
                <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                  {stats.negative > 0
                    ? "Perlu tindakan segera"
                    : "Semua model untung"}
                </p>
              </div>
            </section>

            <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div
                role="group"
                aria-label="Filter margin"
                className="pk-scroll flex flex-wrap gap-1.5 overflow-x-auto rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] p-1"
              >
                {filters.map((item) => {
                  const active = filter === item.value
                  return (
                    <button
                      key={item.value}
                      onClick={() => setFilter(item.value)}
                      aria-pressed={active}
                      className={`min-h-9 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-all ${
                        active
                          ? "bg-gradient-to-r from-[#ffc266] to-[#f0a93b] text-[#10192b] shadow-[0_6px_18px_-8px_rgba(240,169,59,0.9)]"
                          : "text-[color:var(--pk-text-dim)] hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>

              <div className="relative lg:w-72">
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--pk-text-mute)]"
                >
                  <Search size={15} />
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama atau provider..."
                  className="min-h-11 w-full rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] pl-10 pr-10 text-sm text-[color:var(--pk-text)] outline-none transition-colors placeholder:text-[color:var(--pk-text-mute)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Bersihkan"
                    className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[color:var(--pk-text-mute)] transition-colors hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="pk-panel pk-inview mt-4 overflow-hidden">
              {filtered.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="font-semibold">Tidak ada model yang cocok.</p>
                  <p className="mt-2 text-sm text-[color:var(--pk-text-dim)]">
                    Coba ubah kata kunci atau filter margin.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("")
                      setFilter("all")
                    }}
                    className="pk-btn-ghost mt-5 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
                  >
                    Reset filter
                  </button>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-[color:var(--pk-line)]">
                    {filtered.map((m) => {
                      const tone = marginTone(m.margin)
                      const barWidth = Math.max(
                        (Math.abs(m.margin) / maxAbsMargin) * 100,
                        2
                      )
                      const isAlert = m.margin < 10
                      return (
                        <li
                          key={m.id}
                          className="px-5 py-4 transition-colors hover:bg-white/[0.02]"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                            <div className="min-w-0 sm:w-56 sm:shrink-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-medium text-[color:var(--pk-text)]">
                                  {m.name}
                                </p>
                                {isAlert && (
                                  <AlertTriangle
                                    size={12}
                                    className={`shrink-0 ${
                                      m.margin < 0
                                        ? "text-[#fca5a5]"
                                        : "text-[color:var(--pk-accent)]"
                                    }`}
                                  />
                                )}
                              </div>
                              <p className="mt-0.5 truncate text-xs text-[color:var(--pk-text-mute)]">
                                {m.provider}
                              </p>
                            </div>

                            <div className="flex flex-1 items-center gap-3">
                              <div className="relative h-6 flex-1 overflow-hidden rounded-lg border border-[color:var(--pk-line)] bg-[#0b1626]">
                                <div
                                  className={`h-full rounded-md bg-gradient-to-r ${tone.bar} ${tone.glow} transition-[width] duration-700 ease-out`}
                                  style={{
                                    width: mounted ? `${barWidth}%` : "0%",
                                  }}
                                />
                              </div>
                              <span
                                className={`w-16 shrink-0 text-right font-mono text-sm font-semibold ${tone.text}`}
                              >
                                {m.margin.toFixed(1)}%
                              </span>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${tone.badge}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${tone.dot}`}
                                />
                                {tone.label}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium ${tierTone(m.tier)}`}
                              >
                                {getModelTierLabel(m.tier)}
                              </span>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>

                  <div className="flex items-center justify-between border-t border-[color:var(--pk-line)] px-5 py-3 text-xs text-[color:var(--pk-text-mute)]">
                    <span>
                      Menampilkan {filtered.length} dari {enriched.length} model
                    </span>
                    {stats.negative > 0 && (
                      <span className="text-[#fca5a5]">
                        {stats.negative} model rugi
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2
              size={24}
              className="animate-spin text-[color:var(--pk-text-mute)]"
            />
          </div>
        )}

        {!loading && !error && enriched.length === 0 && (
          <div className="pk-panel p-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[color:var(--pk-line-2)] bg-[#0b1626] text-[color:var(--pk-text-mute)]">
              <BarChart3 size={22} />
            </span>
            <p className="mt-5 font-semibold">Belum ada model</p>
            <p className="mt-2 text-sm text-[color:var(--pk-text-dim)]">
              Tambahkan model di halaman Model & pricing untuk melihat margin.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}