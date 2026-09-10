"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  X,
} from "lucide-react"

type AuditLog = {
  id: string
  admin_id: string
  admin: {
    name: string | null
    email: string
    role: string
  } | null
  action: string
  target_type: string
  target_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

const filters = [
  { value: "all", label: "Semua" },
  { value: "user", label: "User" },
  { value: "transaction", label: "Transaksi" },
  { value: "refund", label: "Refund" },
  { value: "model", label: "Model" },
  { value: "markup", label: "Markup" },
]

function actionStyle(action: string) {
  if (action.startsWith("refund"))
    return {
      color: "text-[#fca5a5]",
      dot: "bg-[#f87171]",
      bg: "bg-[#f87171]/10",
      border: "border-[#f87171]/30",
    }
  if (action.startsWith("suspend") || action.startsWith("delete"))
    return {
      color: "text-[color:var(--pk-accent)]",
      dot: "bg-[color:var(--pk-accent)]",
      bg: "bg-[color:var(--pk-accent)]/10",
      border: "border-[color:var(--pk-accent)]/30",
    }
  if (action.startsWith("create"))
    return {
      color: "text-[#6ee7b7]",
      dot: "bg-[#34d399]",
      bg: "bg-[#34d399]/10",
      border: "border-[#34d399]/30",
    }
  if (action.startsWith("update"))
    return {
      color: "text-[#93c5fd]",
      dot: "bg-[#60a5fa]",
      bg: "bg-[#60a5fa]/10",
      border: "border-[#60a5fa]/30",
    }
  return {
    color: "text-[color:var(--pk-text-dim)]",
    dot: "bg-[color:var(--pk-line-2)]",
    bg: "bg-white/5",
    border: "border-[color:var(--pk-line-2)]",
  }
}

export default function AdminAuditLogsPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState("all")
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(false)
    try {
      const res = await fetch("/api/admin/audit")
      if (!res.ok) throw new Error("unauthorized")
      const data = (await res.json()) as { logs?: AuditLog[] }
      setLogs(data.logs ?? [])
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
    void fetchLogs()
  }, [user, router, fetchLogs])

  const stats = useMemo(() => {
    const adminSet = new Set(logs.map((l) => l.admin_id))
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayCount = logs.filter(
      (l) => new Date(l.created_at) >= today
    ).length
    return {
      total: logs.length,
      admins: adminSet.size,
      today: todayCount,
    }
  }, [logs])

  const filtered = useMemo(() => {
    let list =
      filter === "all"
        ? logs
        : logs.filter((l) => l.action.startsWith(filter))
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((l) => {
        const email = (l.admin?.email ?? "").toLowerCase()
        const action = l.action.toLowerCase()
        const target = `${l.target_type} ${l.target_id ?? ""}`.toLowerCase()
        return (
          email.includes(q) ||
          action.includes(q) ||
          target.includes(q) ||
          l.admin_id.toLowerCase().includes(q)
        )
      })
    }
    return list
  }, [logs, filter, query])

  async function copy(value: string, field: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(field)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      setCopied(null)
    }
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
                <Shield size={28} className="text-[color:var(--pk-accent)]" />
                Audit Log
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--pk-text-dim)]">
                Riwayat aktivitas admin. Read-only untuk keperluan audit.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchLogs(true)}
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
              Audit log tidak bisa dimuat. Pastikan kamu punya akses admin.
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

        {!error && (
          <>
            {logs.length > 0 && (
              <section className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="pk-panel pk-inview p-5">
                  <p className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                    Total log
                  </p>
                  <p className="mt-3 font-mono text-2xl">{stats.total}</p>
                  <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                    Aktivitas tercatat
                  </p>
                </div>
                <div className="pk-panel pk-inview p-5">
                  <p className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                    Admin unik
                  </p>
                  <p className="mt-3 font-mono text-2xl text-[color:var(--pk-accent)]">
                    {stats.admins}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                    Yang beraktivitas
                  </p>
                </div>
                <div className="pk-panel pk-inview p-5">
                  <p className="text-[11px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                    Hari ini
                  </p>
                  <p className="mt-3 font-mono text-2xl">{stats.today}</p>
                  <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                    Aksi dalam 24 jam
                  </p>
                </div>
              </section>
            )}

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div
                role="group"
                aria-label="Filter jenis aksi"
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

              {logs.length > 0 && (
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
                    placeholder="Cari admin, aksi, target..."
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
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2
                    size={24}
                    className="animate-spin text-[color:var(--pk-text-mute)]"
                  />
                </div>
              )}

              {!loading && logs.length === 0 && (
                <div className="p-12 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[color:var(--pk-line-2)] bg-[#0b1626] text-[color:var(--pk-text-mute)]">
                    <Shield size={22} />
                  </span>
                  <p className="mt-5 font-semibold">Belum ada audit log</p>
                  <p className="mt-2 text-sm text-[color:var(--pk-text-dim)]">
                    Aktivitas admin akan muncul di sini setelah ada aksi.
                  </p>
                </div>
              )}

              {!loading && logs.length > 0 && filtered.length === 0 && (
                <div className="p-12 text-center">
                  <p className="font-semibold">Tidak ada log yang cocok.</p>
                  <p className="mt-2 text-sm text-[color:var(--pk-text-dim)]">
                    Coba ubah kata kunci atau filter jenis aksi.
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
                    <table className="w-full min-w-[64rem] text-left text-sm">
                      <thead className="border-b border-[color:var(--pk-line)] text-[color:var(--pk-text-mute)]">
                        <tr>
                          <th className="w-10 px-3 py-4"></th>
                          <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                            Waktu
                          </th>
                          <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                            Admin
                          </th>
                          <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                            Aksi
                          </th>
                          <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                            Target
                          </th>
                          <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                            Detail
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((log) => {
                          const style = actionStyle(log.action)
                          const isOpen = expanded === log.id
                          return (
                            <FragmentRow
                              key={log.id}
                              log={log}
                              style={style}
                              isOpen={isOpen}
                              onToggle={() =>
                                setExpanded(isOpen ? null : log.id)
                              }
                              onCopy={copy}
                              copiedField={copied}
                            />
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <ul className="divide-y divide-[color:var(--pk-line)] lg:hidden">
                    {filtered.map((log) => {
                      const style = actionStyle(log.action)
                      const isOpen = expanded === log.id
                      return (
                        <li key={log.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${style.border} ${style.bg} ${style.color}`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                                  />
                                  {log.action}
                                </span>
                                <span className="text-[11px] text-[color:var(--pk-text-mute)]">
                                  {new Date(log.created_at).toLocaleString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              </div>
                              <p className="mt-2 truncate text-xs text-[color:var(--pk-text-dim)]">
                                {log.admin?.email ?? log.admin_id.slice(0, 12)}
                              </p>
                              <p className="mt-1 truncate font-mono text-[11px] text-[color:var(--pk-text-mute)]">
                                {log.target_type}
                                {log.target_id && ` / ${log.target_id.slice(0, 8)}`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setExpanded(isOpen ? null : log.id)
                              }
                              aria-label={isOpen ? "Tutup detail" : "Buka detail"}
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[color:var(--pk-line-2)] text-[color:var(--pk-text-mute)] transition-colors hover:text-white"
                            >
                              <ChevronDown
                                size={14}
                                className={`transition-transform duration-200 ${
                                  isOpen ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>

                          {isOpen && (
                            <DetailPanel log={log} onCopy={copy} copiedField={copied} />
                          )}
                        </li>
                      )
                    })}
                  </ul>

                  <div className="border-t border-[color:var(--pk-line)] px-5 py-3 text-xs text-[color:var(--pk-text-mute)]">
                    Menampilkan {filtered.length} dari {logs.length} log
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

function FragmentRow({
  log,
  style,
  isOpen,
  onToggle,
  onCopy,
  copiedField,
}: {
  log: AuditLog
  style: ReturnType<typeof actionStyle>
  isOpen: boolean
  onToggle: () => void
  onCopy: (value: string, field: string) => void
  copiedField: string | null
}) {
  const d = new Date(log.created_at)
  return (
    <>
      <tr
        className={`border-b border-[color:var(--pk-line)] transition-colors ${
          isOpen ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"
        }`}
      >
        <td className="px-3 py-4">
          <button
            type="button"
            onClick={onToggle}
            aria-label={isOpen ? "Tutup detail" : "Buka detail"}
            aria-expanded={isOpen}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--pk-text-mute)] transition-colors hover:bg-white/5 hover:text-white"
          >
            <ChevronRight
              size={14}
              className={`transition-transform duration-200 ${
                isOpen ? "rotate-90" : ""
              }`}
            />
          </button>
        </td>
        <td className="whitespace-nowrap px-5 py-4 text-xs text-[color:var(--pk-text-mute)]">
          <div>
            {d.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
          <div className="text-[10px] opacity-70">
            {d.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs text-[color:var(--pk-text)]">
                {log.admin?.email ?? "—"}
              </p>
              {log.admin?.role && (
                <p className="text-[10px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                  {log.admin.role}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onCopy(log.admin_id, `admin-${log.id}`)}
              aria-label="Salin admin ID"
              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                copiedField === `admin-${log.id}`
                  ? "border-[#34d399]/50 bg-[#34d399]/15 text-[#6ee7b7]"
                  : "border-transparent text-[color:var(--pk-text-mute)] hover:border-[color:var(--pk-line-2)] hover:text-[color:var(--pk-accent)]"
              }`}
            >
              {copiedField === `admin-${log.id}` ? (
                <Check size={11} />
              ) : (
                <Copy size={11} />
              )}
            </button>
          </div>
        </td>
        <td className="px-5 py-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${style.border} ${style.bg} ${style.color}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {log.action}
          </span>
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <code className="truncate font-mono text-xs text-[color:var(--pk-text-dim)]">
              {log.target_type}
              {log.target_id && (
                <span className="text-[color:var(--pk-text-mute)]">
                  {" / "}
                  {log.target_id.slice(0, 8)}
                </span>
              )}
            </code>
            {log.target_id && (
              <button
                type="button"
                onClick={() => onCopy(log.target_id!, `target-${log.id}`)}
                aria-label="Salin target ID"
                className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  copiedField === `target-${log.id}`
                    ? "border-[#34d399]/50 bg-[#34d399]/15 text-[#6ee7b7]"
                    : "border-transparent text-[color:var(--pk-text-mute)] hover:border-[color:var(--pk-line-2)] hover:text-[color:var(--pk-accent)]"
                }`}
              >
                {copiedField === `target-${log.id}` ? (
                  <Check size={11} />
                ) : (
                  <Copy size={11} />
                )}
              </button>
            )}
          </div>
        </td>
        <td className="px-5 py-4 text-right">
          {log.details ? (
            <span className="text-xs text-[color:var(--pk-text-mute)]">
              {Object.keys(log.details).length} field
            </span>
          ) : (
            <span className="text-xs text-[color:var(--pk-text-mute)]">—</span>
          )}
        </td>
      </tr>
      {isOpen && (
        <tr className="border-b border-[color:var(--pk-line)] bg-[#0b1626]/40">
          <td colSpan={6} className="px-5 py-5">
            <DetailPanel log={log} onCopy={onCopy} copiedField={copiedField} />
          </td>
        </tr>
      )}
    </>
  )
}

function DetailPanel({
  log,
  onCopy,
  copiedField,
}: {
  log: AuditLog
  onCopy: (value: string, field: string) => void
  copiedField: string | null
}) {
  const json = log.details ? JSON.stringify(log.details, null, 2) : ""
  return (
    <div className="pk-panel overflow-hidden p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[color:var(--pk-text-mute)]">
          Detail
        </p>
        {log.details && (
          <button
            type="button"
            onClick={() => onCopy(json, `detail-${log.id}`)}
            className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-[10px] font-medium transition-all ${
              copiedField === `detail-${log.id}`
                ? "border-[#34d399]/50 bg-[#34d399]/15 text-[#6ee7b7]"
                : "border-[color:var(--pk-line-2)] text-[color:var(--pk-text-mute)] hover:border-[color:var(--pk-accent)]/50 hover:text-[color:var(--pk-accent)]"
            }`}
          >
            {copiedField === `detail-${log.id}` ? (
              <Check size={11} />
            ) : (
              <Copy size={11} />
            )}
            {copiedField === `detail-${log.id}` ? "Tersalin" : "Salin JSON"}
          </button>
        )}
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-[10px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
            Log ID
          </dt>
          <dd className="mt-1 break-all font-mono text-xs text-[color:var(--pk-text-dim)]">
            {log.id}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
            Admin ID
          </dt>
          <dd className="mt-1 break-all font-mono text-xs text-[color:var(--pk-text-dim)]">
            {log.admin_id}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
            Target ID
          </dt>
          <dd className="mt-1 break-all font-mono text-xs text-[color:var(--pk-text-dim)]">
            {log.target_id ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
            Waktu
          </dt>
          <dd className="mt-1 text-xs text-[color:var(--pk-text-dim)]">
            {new Date(log.created_at).toLocaleString("id-ID")}
          </dd>
        </div>
      </dl>

      {log.details && (
        <div className="mt-4 border-t border-[color:var(--pk-line)] pt-4">
          <p className="text-[10px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
            Payload
          </p>
          <pre className="pk-scroll pk-terminal mt-2 max-h-64 overflow-auto rounded-xl border border-[color:var(--pk-line)] p-3 font-mono text-[11.5px] leading-5 text-[color:var(--pk-text)]">
            <code>{json}</code>
          </pre>
        </div>
      )}
    </div>
  )
}