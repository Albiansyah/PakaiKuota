"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Scale,
  Search,
  X,
} from "lucide-react"

type ReconciliationLog = {
  id: string
  category: string
  status: string
  details: Record<string, unknown>
  created_at: string
}

type StatusFilter = "all" | "ok" | "alert" | "resolved"

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "ok", label: "OK" },
  { value: "alert", label: "Alert" },
  { value: "resolved", label: "Resolved" },
]

function statusTone(status: string) {
  switch (status) {
    case "ok":
      return "border-[#34d399]/30 bg-[#34d399]/10 text-[#6ee7b7]"
    case "alert":
      return "border-[#f87171]/30 bg-[#f87171]/10 text-[#fca5a5]"
    case "resolved":
      return "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim)"
    default:
      return "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim)"
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "ok":
      return <CheckCircle2 size={14} className="text-[#6ee7b7]" />
    case "alert":
      return <AlertTriangle size={14} className="text-[#fca5a5]" />
    default:
      return <Scale size={14} className="text-(--pk-text-mute)" />
  }
}

export default function AdminReconciliationPage() {
  const { user } = useSupabase()
  const router = useRouter()

  const [logs, setLogs] = useState<ReconciliationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [auditing, setAuditing] = useState(false)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState<StatusFilter>("all")
  const [query, setQuery] = useState("")

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(false)
    try {
      const res = await fetch("/api/reconcile")
      if (!res.ok) throw new Error("Unauthorized")
      const data = (await res.json()) as { logs?: ReconciliationLog[] }
      setLogs(data.logs ?? [])
    } catch (err) {
      console.error("Failed to fetch reconciliation logs:", err)
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
    void fetchLogs()
  }, [user, router, fetchLogs])

  async function runAudit() {
    setAuditing(true)
    try {
      await fetch("/api/reconcile", { method: "POST" })
      await fetchLogs(true)
    } catch {
      // ignore
    } finally {
      setAuditing(false)
    }
  }

  const filtered = (() => {
    let list = logs
    if (filter !== "all") list = list.filter((l) => l.status === filter)

    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (l) =>
          l.category.toLowerCase().includes(q) ||
          l.status.toLowerCase().includes(q) ||
          JSON.stringify(l.details).toLowerCase().includes(q)
      )
    }
    return list
  })()

  const stats = (() => {
    const ok = logs.filter((l) => l.status === "ok").length
    const alert = logs.filter((l) => l.status === "alert").length
    const resolved = logs.filter((l) => l.status === "resolved").length
    return { total: logs.length, ok, alert, resolved }
  })()

  return (
    <div className="relative min-h-screen text-(--pk-text)">
      <header className="border-b border-(--pk-line) bg-[#070f1e]/60 px-5 py-8 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
                Admin tool
              </p>
              <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                <Scale size={26} className="text-(--pk-accent)" />
                Rekonsiliasi
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-(--pk-text-dim)">
                Log pencocokan data internal vs upstream.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchLogs(true)}
                disabled={refreshing}
                aria-label="Refresh"
                className="pk-btn-ghost inline-flex h-10 w-10 items-center justify-center disabled:opacity-60"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
              <button
                type="button"
                onClick={runAudit}
                disabled={auditing}
                className="pk-btn-primary inline-flex min-h-10 items-center gap-2 px-4 text-sm disabled:cursor-wait disabled:opacity-60"
              >
                {auditing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Scale size={14} />
                )}
                {auditing ? "Menjalankan..." : "Jalankan audit"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {error && (
          <div className="pk-panel mb-6 p-5 text-center">
            <p className="text-sm text-[#fca5a5]">
              Log rekonsiliasi tidak bisa dimuat.
            </p>
            <button
              type="button"
              onClick={() => void fetchLogs()}
              className="pk-btn-ghost mt-4 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
            >
              Coba lagi
            </button>
          </div>
        )}

        {!error && !loading && logs.length > 0 && (
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="pk-panel pk-inview p-5">
              <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                Total log
              </p>
              <p className="mt-3 font-mono text-2xl">{stats.total}</p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Semua entri rekonsiliasi
              </p>
            </div>

            <div className="pk-panel pk-inview p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  OK
                </p>
                <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
              </div>
              <p className="mt-3 font-mono text-2xl text-[#6ee7b7]">
                {stats.ok}
              </p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Cocok dengan upstream
              </p>
            </div>

            <div
              className={`pk-panel pk-inview p-5 ${
                stats.alert > 0 ? "pk-featured" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Alert
                </p>
                <AlertTriangle size={14} className="text-[#fca5a5]" />
              </div>
              <p className="mt-3 font-mono text-2xl text-[#fca5a5]">
                {stats.alert}
              </p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                {stats.alert > 0 ? "Perlu ditindaklanjuti" : "Tidak ada alert"}
              </p>
            </div>

            <div className="pk-panel pk-inview p-5">
              <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                Resolved
              </p>
              <p className="mt-3 font-mono text-2xl text-(--pk-text-dim)">
                {stats.resolved}
              </p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Sudah ditangani
              </p>
            </div>
          </section>
        )}

        {!error && !loading && logs.length > 0 && (
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div
              role="group"
              aria-label="Filter status"
              className="inline-flex w-fit rounded-xl border border-(--pk-line-2) bg-[#0b1626] p-1"
            >
              {statusFilters.map((item) => {
                const active = filter === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value)}
                    aria-pressed={active}
                    className={`min-h-9 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-all ${
                      active
                        ? "bg-linear-to-r from-[#ffc266] to-[#f0a93b] text-[#10192b] shadow-[0_6px_18px_-8px_rgba(240,169,59,0.9)]"
                        : "text-(--pk-text-dim) hover:text-white"
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
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--pk-text-mute)"
              >
                <Search size={15} />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari kategori atau detail..."
                className="min-h-11 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] pl-10 pr-10 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Bersihkan"
                  className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-(--pk-text-mute) transition-colors hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="pk-panel pk-inview overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2
                size={24}
                className="animate-spin text-(--pk-text-mute)"
              />
            </div>
          )}

          {!loading && logs.length === 0 && (
            <div className="p-12 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-mute)">
                <Scale size={22} />
              </span>
              <p className="mt-5 font-semibold">Belum ada log rekonsiliasi</p>
              <p className="mt-2 text-sm text-(--pk-text-dim)">
                Jalankan audit untuk membandingkan data internal dengan
                upstream.
              </p>
              <button
                type="button"
                onClick={runAudit}
                disabled={auditing}
                className="pk-btn-primary mt-5 inline-flex min-h-10 items-center justify-center gap-2 px-4 text-sm disabled:opacity-60"
              >
                {auditing ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Scale size={13} />
                )}
                Jalankan audit sekarang
              </button>
            </div>
          )}

          {!loading && logs.length > 0 && filtered.length === 0 && (
            <div className="p-12 text-center">
              <p className="font-semibold">Tidak ada log yang cocok.</p>
              <p className="mt-2 text-sm text-(--pk-text-dim)">
                Coba ubah kata kunci atau filter status.
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

          {!loading && filtered.length > 0 && (
            <>
              {/* Desktop table */}
              <div className="pk-scroll hidden overflow-x-auto lg:block">
                <table className="w-full min-w-5xl text-left text-sm">
                  <thead className="border-b border-(--pk-line) text-(--pk-text-mute)">
                    <tr>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Waktu
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Kategori
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Detail
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-(--pk-line) transition-colors last:border-0 hover:bg-white/2"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-(--pk-text-dim)">
                          {new Date(log.created_at).toLocaleString("id-ID")}
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-medium text-(--pk-text)">
                            {log.category}
                          </span>
                        </td>
                        <td className="max-w-md px-5 py-4">
                          <code className="block truncate font-mono text-[11px] text-(--pk-text-dim)">
                            {JSON.stringify(log.details)}
                          </code>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${statusTone(
                              log.status
                            )}`}
                          >
                            {statusIcon(log.status)}
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-(--pk-line) lg:hidden">
                {filtered.map((log) => (
                  <li key={log.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-medium text-(--pk-text)">
                          {log.category}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-(--pk-text-mute)">
                          {new Date(log.created_at).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone(
                          log.status
                        )}`}
                      >
                        {statusIcon(log.status)}
                        {log.status}
                      </span>
                    </div>
                    <div className="mt-3 rounded-lg border border-(--pk-line) bg-[#0b1626]/60 p-2.5">
                      <p className="text-[10px] uppercase tracking-widest text-(--pk-text-mute)">
                        Detail
                      </p>
                      <code className="mt-1 block break-all font-mono text-[11px] text-(--pk-text-dim)">
                        {JSON.stringify(log.details)}
                      </code>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-(--pk-line) px-5 py-3 text-xs text-(--pk-text-mute)">
                Menampilkan {filtered.length} dari {logs.length} log
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}