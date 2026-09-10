"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react"

type AnomalyFlag = {
  user_id: string
  reason: string
  timestamp?: string
}

type AnomalyData = {
  flagged: number
  flags: AnomalyFlag[]
}

const reasonMeta: Record<
  string,
  { label: string; color: string; dot: string; bg: string; border: string }
> = {
  cost_spike: {
    label: "Cost Spike",
    color: "text-[#fca5a5]",
    dot: "bg-[#f87171]",
    bg: "bg-[#f87171]/10",
    border: "border-[#f87171]/30",
  },
  many_ips: {
    label: "Multiple IPs",
    color: "text-[color:var(--pk-accent)]",
    dot: "bg-[color:var(--pk-accent)]",
    bg: "bg-[color:var(--pk-accent)]/10",
    border: "border-[color:var(--pk-accent)]/30",
  },
  suspicious_pattern: {
    label: "Suspicious Pattern",
    color: "text-[#93c5fd]",
    dot: "bg-[#60a5fa]",
    bg: "bg-[#60a5fa]/10",
    border: "border-[#60a5fa]/30",
  },
}

const filters = [
  { value: "all", label: "Semua" },
  { value: "cost_spike", label: "Cost Spike" },
  { value: "many_ips", label: "Multiple IPs" },
  { value: "suspicious_pattern", label: "Suspicious" },
]

export default function AdminAnomalyPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [data, setData] = useState<AnomalyData>({ flagged: 0, flags: [] })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState("all")
  const [query, setQuery] = useState("")
  const [copied, setCopied] = useState<string | null>(null)

  const fetchAnomalies = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(false)
    try {
      const res = await fetch("/api/admin/anomaly", { method: "POST" })
      if (!res.ok) throw new Error("failed")
      const result = (await res.json()) as AnomalyData
      setData(result)
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
    void fetchAnomalies()
  }, [user, router, fetchAnomalies])

  const stats = useMemo(() => {
    const costSpike = data.flags.filter((f) => f.reason === "cost_spike").length
    const manyIps = data.flags.filter((f) => f.reason === "many_ips").length
    const other = data.flags.length - costSpike - manyIps
    return {
      flagged: data.flagged,
      costSpike,
      manyIps,
      other,
    }
  }, [data])

  const filtered = useMemo(() => {
    let list =
      filter === "all"
        ? data.flags
        : data.flags.filter((f) => f.reason === filter)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((f) => f.user_id.toLowerCase().includes(q))
    }
    return list
  }, [data.flags, filter, query])

  async function copy(value: string, field: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(field)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      setCopied(null)
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-screen text-[color:var(--pk-text)]">
        <div className="flex min-h-screen items-center justify-center">
          <Loader2
            size={26}
            className="animate-spin text-[color:var(--pk-text-mute)]"
          />
        </div>
      </div>
    )
  }

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
                Anomali Usage
                {stats.flagged > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f87171]/30 bg-[#f87171]/10 px-2.5 py-1 text-xs font-semibold text-[#fca5a5]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f87171]" />
                    {stats.flagged}
                  </span>
                )}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--pk-text-dim)]">
                Deteksi pattern mencurigakan dari aktivitas usage user.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchAnomalies(true)}
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
              Data anomali tidak bisa dimuat.
            </p>
            <button
              type="button"
              onClick={() => void fetchAnomalies()}
              className="pk-btn-ghost mt-4 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
            >
              Coba lagi
            </button>
          </div>
        )}

        {!error && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="pk-panel pk-featured pk-inview p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                    Total flagged
                  </p>
                  <ShieldAlert size={14} className="text-[#fca5a5]" />
                </div>
                <p className="mt-3 font-mono text-2xl text-[#fca5a5]">
                  {stats.flagged}
                </p>
                <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                  Perlu investigasi
                </p>
              </div>

              <div className="pk-panel pk-inview p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                    Cost spike
                  </p>
                  <AlertTriangle
                    size={14}
                    className="text-[color:var(--pk-accent)]"
                  />
                </div>
                <p className="mt-3 font-mono text-2xl">{stats.costSpike}</p>
                <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                  Lonjakan biaya
                </p>
              </div>

              <div className="pk-panel pk-inview p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                    Multiple IPs
                  </p>
                  <Clock size={14} className="text-[#93c5fd]" />
                </div>
                <p className="mt-3 font-mono text-2xl">{stats.manyIps}</p>
                <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                  IP berbeda
                </p>
              </div>

              <div className="pk-panel pk-inview p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                    Lainnya
                  </p>
                  <AlertTriangle
                    size={14}
                    className="text-[color:var(--pk-text-mute)]"
                  />
                </div>
                <p className="mt-3 font-mono text-2xl">{stats.other}</p>
                <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                  Pattern lain
                </p>
              </div>
            </section>

            <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div
                role="group"
                aria-label="Filter alasan"
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

              {data.flags.length > 0 && (
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
                    placeholder="Cari User ID..."
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
              )}
            </div>

            <div className="pk-panel pk-inview mt-4 overflow-hidden">
              {data.flags.length === 0 && (
                <div className="p-12 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#34d399]/30 bg-[#34d399]/10 text-[#6ee7b7]">
                    <CheckCircle2 size={22} />
                  </span>
                  <p className="mt-5 font-semibold">Tidak ada anomali</p>
                  <p className="mt-2 text-sm text-[color:var(--pk-text-dim)]">
                    Semua usage user dalam batas wajar.
                  </p>
                </div>
              )}

              {data.flags.length > 0 && filtered.length === 0 && (
                <div className="p-12 text-center">
                  <p className="font-semibold">Tidak ada flag yang cocok.</p>
                  <p className="mt-2 text-sm text-[color:var(--pk-text-dim)]">
                    Coba ubah kata kunci atau filter alasan.
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
              )}

              {filtered.length > 0 && (
                <>
                  <ul className="divide-y divide-[color:var(--pk-line)]">
                    {filtered.map((flag, i) => {
                      const meta = reasonMeta[flag.reason] ?? {
                        label: flag.reason,
                        color: "text-[color:var(--pk-text-dim)]",
                        dot: "bg-[color:var(--pk-line-2)]",
                        bg: "bg-white/5",
                        border: "border-[color:var(--pk-line-2)]",
                      }
                      return (
                        <li
                          key={`${flag.user_id}-${flag.reason}-${i}`}
                          className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-start gap-4">
                            <span
                              className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border ${meta.border} ${meta.bg}`}
                            >
                              <AlertTriangle size={15} className={meta.color} />
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <code className="truncate font-mono text-sm text-[color:var(--pk-text)]">
                                  {query ? (
                                    <Highlight
                                      text={flag.user_id}
                                      query={query}
                                    />
                                  ) : (
                                    flag.user_id
                                  )}
                                </code>
                                <button
                                  type="button"
                                  onClick={() =>
                                    copy(flag.user_id, `user-${i}`)
                                  }
                                  aria-label="Salin User ID"
                                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                    copied === `user-${i}`
                                      ? "border-[#34d399]/50 bg-[#34d399]/15 text-[#6ee7b7]"
                                      : "border-transparent text-[color:var(--pk-text-mute)] hover:border-[color:var(--pk-line-2)] hover:text-[color:var(--pk-accent)]"
                                  }`}
                                >
                                  {copied === `user-${i}` ? (
                                    <Check size={11} />
                                  ) : (
                                    <Copy size={11} />
                                  )}
                                </button>
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${meta.border} ${meta.bg} ${meta.color}`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                                  />
                                  {meta.label}
                                </span>
                                {flag.timestamp && (
                                  <span className="text-[11px] text-[color:var(--pk-text-mute)]">
                                    {new Date(
                                      flag.timestamp
                                    ).toLocaleString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="pk-btn-ghost inline-flex min-h-9 shrink-0 items-center justify-center self-start px-3 text-xs font-medium sm:self-center"
                          >
                            Review
                          </button>
                        </li>
                      )
                    })}
                  </ul>

                  <div className="border-t border-[color:var(--pk-line)] px-5 py-3 text-xs text-[color:var(--pk-text-mute)]">
                    Menampilkan {filtered.length} dari {data.flags.length} flag
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return <>{text}</>
  const before = text.slice(0, idx)
  const match = text.slice(idx, idx + q.length)
  const after = text.slice(idx + q.length)
  return (
    <>
      {before}
      <mark className="rounded bg-[color:var(--pk-accent)]/25 px-0.5 text-[color:var(--pk-accent-2)]">
        {match}
      </mark>
      {after}
    </>
  )
}