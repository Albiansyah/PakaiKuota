"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Clock,
  Download,
  Gauge,
  Loader2,
  Package,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"

type Metrics = {
  labels: string[]
  users: number[]
  transactions: number[]
  revenue: number[]
}

type Range = "7d" | "30d" | "90d"

type TopModel = { slug: string; requests: number; revenue: number }
type PendingTasks = {
  refunds: number
  resellerKyc: number
  lowMarginModels: number
}
type Alert = {
  level: "warning" | "danger"
  title: string
  href: string
}

const RANGE_LABELS: Record<Range, string> = {
  "7d": "7 hari",
  "30d": "30 hari",
  "90d": "90 hari",
}

export default function AdminSummaryPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [prevMetrics, setPrevMetrics] = useState<Metrics | null>(null)
  const [topModels, setTopModels] = useState<TopModel[]>([])
  const [pending, setPending] = useState<PendingTasks | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(30)
  const [range, setRange] = useState<Range>("7d")
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const countdownRef = useRef<number>(30)

  const load = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true)
      setError(false)
      try {
        const [resMetrics, resPrev, resTop, resPending] = await Promise.all([
          fetch(`/api/admin/metrics?range=${range}`, { cache: "no-store" }),
          fetch(`/api/admin/metrics?range=${range}&prev=1`, {
            cache: "no-store",
          }),
          fetch(`/api/admin/metrics/top-models?range=${range}`, {
            cache: "no-store",
          }),
          fetch("/api/admin/pending-tasks", { cache: "no-store" }),
        ])

        if (!resMetrics.ok) throw new Error("Failed to load metrics")

        const data = (await resMetrics.json()) as Metrics
        setMetrics(data)

        if (resPrev.ok) {
          const prev = (await resPrev.json()) as Metrics
          setPrevMetrics(prev)
        }

        if (resTop.ok) {
          const top = (await resTop.json()) as { models?: TopModel[] }
          setTopModels(top.models ?? [])
        }

        if (resPending.ok) {
          const p = (await resPending.json()) as PendingTasks
          setPending(p)
        }

        setLastUpdated(new Date())
        countdownRef.current = 30
        setCountdown(30)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [range]
  )

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(true), 30000)
    return () => clearInterval(timer)
  }, [load])

  // Countdown ticker
  useEffect(() => {
    const tick = setInterval(() => {
      countdownRef.current = Math.max(0, countdownRef.current - 1)
      setCountdown(countdownRef.current)
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  const stats = useMemo(() => {
    if (!metrics) {
      return {
        totalUsers: 0,
        totalTx: 0,
        totalRevenue: 0,
        avgRevenue: 0,
        days: 0,
      }
    }
    const totalUsers = metrics.users.reduce((s, v) => s + v, 0)
    const totalTx = metrics.transactions.reduce((s, v) => s + v, 0)
    const totalRevenue = metrics.revenue.reduce((s, v) => s + v, 0)
    const days = metrics.labels.length || 1
    return {
      totalUsers,
      totalTx,
      totalRevenue,
      avgRevenue: totalRevenue / days,
      days,
    }
  }, [metrics])

  const delta = useMemo(() => {
    if (!metrics || !prevMetrics) return null
    const sum = (arr: number[]) => arr.reduce((s, v) => s + v, 0)
    const prevUsers = sum(prevMetrics.users)
    const prevTx = sum(prevMetrics.transactions)
    const prevRev = sum(prevMetrics.revenue)
    const pct = (curr: number, prev: number) =>
      prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100
    return {
      users: pct(stats.totalUsers, prevUsers),
      tx: pct(stats.totalTx, prevTx),
      revenue: pct(stats.totalRevenue, prevRev),
    }
  }, [metrics, prevMetrics, stats])

  const alerts = useMemo<Alert[]>(() => {
    if (!pending) return []
    const list: Alert[] = []
    if (pending.refunds > 0) {
      list.push({
        level: "warning",
        title: `${pending.refunds} permintaan refund menunggu`,
        href: "/admin/refunds",
      })
    }
    if (pending.resellerKyc > 0) {
      list.push({
        level: "warning",
        title: `${pending.resellerKyc} pengajuan reseller perlu verifikasi`,
        href: "/admin/reseller",
      })
    }
    if (pending.lowMarginModels > 0) {
      list.push({
        level: "danger",
        title: `${pending.lowMarginModels} model dengan markup < 10%`,
        href: "/admin/models",
      })
    }
    return list
  }, [pending])

  function exportCsv() {
    if (!metrics) return
    const rows = [
      ["label", "users", "transactions", "revenue"],
      ...metrics.labels.map((label, i) => [
        label,
        String(metrics.users[i] ?? 0),
        String(metrics.transactions[i] ?? 0),
        String(metrics.revenue[i] ?? 0),
      ]),
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `metrics-${range}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const chartMax = useMemo(() => {
    if (!metrics) return 1
    return Math.max(
      1,
      ...metrics.users,
      ...metrics.transactions
    )
  }, [metrics])

  return (
    <div className="relative min-h-screen text-(--pk-text)">
      <header className="border-b border-(--pk-line) bg-[#070f1e]/60 px-5 py-8 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
                Overview
              </p>
              <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                <BarChart3 size={26} className="text-(--pk-accent)" />
                Ringkasan
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-(--pk-text-dim)">
                Aktivitas {RANGE_LABELS[range]} terakhir. Auto-refresh
                setiap 30 detik.
                {lastUpdated && (
                  <span className="ml-2 font-mono text-[11px] text-(--pk-text-mute)">
                    · refresh dalam {countdown}s
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportCsv}
                disabled={!metrics}
                aria-label="Export CSV"
                title="Export CSV"
                className="pk-btn-ghost inline-flex h-10 w-10 items-center justify-center disabled:opacity-60"
              >
                <Download size={15} />
              </button>
              <button
                type="button"
                onClick={() => void load(true)}
                disabled={refreshing}
                aria-label="Refresh"
                className="pk-btn-ghost inline-flex h-10 w-10 items-center justify-center disabled:opacity-60"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {error && (
          <div className="pk-panel mb-6 p-5 text-center">
            <p className="text-sm text-[#fca5a5]">
              Data metrics tidak bisa dimuat.
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="pk-btn-ghost mt-4 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <ul className="mb-6 space-y-2">
            {alerts.map((alert, i) => (
              <li key={i}>
                <Link
                  href={alert.href}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                    alert.level === "danger"
                      ? "border-[#f87171]/40 bg-[#f87171]/10 text-[#fca5a5] hover:bg-[#f87171]/20"
                      : "border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#fcd34d] hover:bg-[#fbbf24]/20"
                  }`}
                >
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span className="flex-1">{alert.title}</span>
                  <span className="shrink-0 text-xs opacity-70">
                    Lihat →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Range selector */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Rentang waktu"
            className="inline-flex w-fit rounded-xl border border-(--pk-line-2) bg-[#0b1626] p-1"
          >
            {(Object.keys(RANGE_LABELS) as Range[]).map((r) => {
              const active = range === r
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  aria-pressed={active}
                  className={`min-h-9 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-all ${
                    active
                      ? "bg-linear-to-r from-[#ffc266] to-[#f0a93b] text-[#10192b] shadow-[0_6px_18px_-8px_rgba(240,169,59,0.9)]"
                      : "text-(--pk-text-dim) hover:text-white"
                  }`}
                >
                  {RANGE_LABELS[r]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Stat cards */}
        {metrics && (
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total user aktif"
              value={stats.totalUsers.toLocaleString("id-ID")}
              icon={<Users size={14} className="text-(--pk-text-mute)" />}
              delta={delta?.users}
              hint={`Selama ${RANGE_LABELS[range]} terakhir`}
            />
            <StatCard
              title="Total transaksi"
              value={stats.totalTx.toLocaleString("id-ID")}
              icon={<TrendingUp size={14} className="text-(--pk-accent)" />}
              valueClass="text-(--pk-accent)"
              delta={delta?.tx}
              hint={`Selama ${RANGE_LABELS[range]} terakhir`}
            />
            <StatCard
              title="Total revenue"
              value={`Rp ${stats.totalRevenue.toLocaleString("id-ID")}`}
              icon={
                <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
              }
              valueClass="text-[#6ee7b7]"
              delta={delta?.revenue}
              hint={`Selama ${RANGE_LABELS[range]} terakhir`}
            />
            <StatCard
              title="Rata-rata revenue/hari"
              value={`Rp ${Math.round(stats.avgRevenue).toLocaleString("id-ID")}`}
              icon={<Gauge size={14} className="text-(--pk-text-mute)" />}
              hint={`${stats.days} hari terakhir`}
            />
          </section>
        )}

        {/* Chart */}
        <section className="pk-panel pk-inview p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">
                Aktivitas {RANGE_LABELS[range]}
              </h2>
              <p className="mt-1 text-sm text-(--pk-text-dim)">
                Perbandingan user aktif dan transaksi per hari.
              </p>
            </div>
            {lastUpdated && (
              <p className="font-mono text-[11px] text-(--pk-text-mute)">
                Update:{" "}
                {lastUpdated.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-(--pk-text-dim)">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-(--pk-accent)" />
              User aktif
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-(--pk-text)" />
              Transaksi
            </span>
          </div>

          <div className="mt-6">
            {loading && !metrics ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2
                  size={24}
                  className="animate-spin text-(--pk-text-mute)"
                />
              </div>
            ) : !metrics || metrics.labels.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                <Zap size={22} className="text-(--pk-text-mute)" />
                <p className="text-sm text-(--pk-text-mute)">
                  Belum ada data aktivitas.
                </p>
                <p className="text-xs text-(--pk-text-mute)">
                  Data akan muncul setelah ada transaksi pertama.
                </p>
              </div>
            ) : (
              <div className="relative flex h-48 items-end gap-2 sm:gap-3">
                {metrics.labels.map((label, index) => {
                  const users = metrics.users[index] ?? 0
                  const tx = metrics.transactions[index] ?? 0
                  const hovered = hoveredBar === index
                  return (
                    <div
                      key={label}
                      className="flex flex-1 flex-col items-center gap-2"
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <div className="relative flex h-40 w-full items-end gap-1">
                        <span
                          className={`flex-1 rounded-t bg-(--pk-accent) transition-all ${
                            hovered ? "opacity-100" : "opacity-90"
                          }`}
                          style={{
                            height: `${(users / chartMax) * 100}%`,
                          }}
                        />
                        <span
                          className={`flex-1 rounded-t bg-(--pk-text) transition-all ${
                            hovered ? "opacity-100" : "opacity-90"
                          }`}
                          style={{
                            height: `${(tx / chartMax) * 100}%`,
                          }}
                        />

                        {hovered && (
                          <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-(--pk-line-2) bg-[#0b1626] px-3 py-2 text-[11px] shadow-lg">
                            <p className="font-mono font-semibold text-(--pk-text)">
                              {label}
                            </p>
                            <p className="mt-1 text-(--pk-accent)">
                              {users} user
                            </p>
                            <p className="text-(--pk-text-dim)">
                              {tx} transaksi
                            </p>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-(--pk-text-mute)">
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Bottom grid: Top models + Pending tasks + Quick links */}
        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Top models */}
          <div className="pk-panel pk-inview p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Model terpopuler</h2>
              <Package size={14} className="text-(--pk-text-mute)" />
            </div>
            <p className="mt-1 text-sm text-(--pk-text-dim)">
              Top 5 berdasarkan jumlah request.
            </p>

            <ul className="mt-4 space-y-3">
              {topModels.length === 0 ? (
                <li className="text-xs text-(--pk-text-mute)">
                  Belum ada data.
                </li>
              ) : (
                topModels.slice(0, 5).map((m, i) => (
                  <li
                    key={m.slug}
                    className="flex items-center justify-between gap-3 border-b border-(--pk-line) pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-(--pk-line-2) bg-[#0b1626] font-mono text-[10px] text-(--pk-text-mute)">
                        {i + 1}
                      </span>
                      <span className="truncate font-mono text-xs text-(--pk-text)">
                        {m.slug}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-(--pk-text-dim)">
                      {m.requests.toLocaleString("id-ID")}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Pending tasks */}
          <div className="pk-panel pk-inview p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Antrian tugas</h2>
              <Clock size={14} className="text-(--pk-text-mute)" />
            </div>
            <p className="mt-1 text-sm text-(--pk-text-dim)">
              Yang perlu ditindaklanjuti.
            </p>

            <ul className="mt-4 space-y-2">
              <PendingRow
                label="Refund"
                count={pending?.refunds ?? 0}
                href="/admin/refunds"
                icon={<RotateCcw size={13} />}
              />
              <PendingRow
                label="KYC Reseller"
                count={pending?.resellerKyc ?? 0}
                href="/admin/reseller"
                icon={<Shield size={13} />}
              />
              <PendingRow
                label="Model margin tipis"
                count={pending?.lowMarginModels ?? 0}
                href="/admin/models"
                icon={<Package size={13} />}
              />
            </ul>
          </div>

          {/* Quick links */}
          <div className="pk-panel pk-inview p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Akses cepat</h2>
              <Zap size={14} className="text-(--pk-accent)" />
            </div>
            <p className="mt-1 text-sm text-(--pk-text-dim)">
              Shortcut ke halaman admin.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <QuickLink href="/admin" label="Users" icon={<Users size={13} />} />
              <QuickLink
                href="/admin/transactions"
                label="Transaksi"
                icon={<TrendingUp size={13} />}
              />
              <QuickLink
                href="/admin/refunds"
                label="Refunds"
                icon={<RotateCcw size={13} />}
              />
              <QuickLink
                href="/admin/models"
                label="Models"
                icon={<Package size={13} />}
              />
              <QuickLink
                href="/admin/reconciliation"
                label="Recon"
                icon={<ScrollText size={13} />}
              />
              <QuickLink
                href="/admin/newapi-config"
                label="NewAPI"
                icon={<Gauge size={13} />}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  valueClass = "",
  delta,
  hint,
}: {
  title: string
  value: string
  icon: React.ReactNode
  valueClass?: string
  delta?: number | null
  hint?: string
}) {
  const deltaValue = delta ?? null
  const isPositive = deltaValue != null && deltaValue > 0
  const isNegative = deltaValue != null && deltaValue < 0
  return (
    <div className="pk-panel pk-inview p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
          {title}
        </p>
        {icon}
      </div>
      <p className={`mt-3 font-mono text-2xl ${valueClass}`}>{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs text-(--pk-text-mute)">
        {deltaValue != null && (
          <span
            className={`inline-flex items-center gap-0.5 font-mono ${
              isPositive
                ? "text-[#6ee7b7]"
                : isNegative
                  ? "text-[#fca5a5]"
                  : "text-(--pk-text-mute)"
            }`}
            title="Perubahan vs periode sebelumnya"
          >
            {isPositive ? (
              <ArrowUpRight size={11} />
            ) : isNegative ? (
              <ArrowDownRight size={11} />
            ) : null}
            {deltaValue > 0 ? "+" : ""}
            {deltaValue.toFixed(1)}%
          </span>
        )}
        {hint && <span>{hint}</span>}
      </div>
    </div>
  )
}

function PendingRow({
  label,
  count,
  href,
  icon,
}: {
  label: string
  count: number
  href: string
  icon: React.ReactNode
}) {
  const hasItems = count > 0
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs transition-colors ${
          hasItems
            ? "border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#fcd34d] hover:bg-[#fbbf24]/20"
            : "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim) hover:border-(--pk-accent)/40"
        }`}
      >
        <span className="inline-flex items-center gap-2">
          {icon}
          {label}
        </span>
        <span className="font-mono font-semibold">{count}</span>
      </Link>
    </li>
  )
}

function QuickLink({
  href,
  label,
  icon,
}: {
  href: string
  label: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg border border-(--pk-line-2) bg-[#0b1626] px-3 py-2 text-[11px] font-medium text-(--pk-text-dim) transition-colors hover:border-(--pk-accent)/50 hover:text-(--pk-accent)"
    >
      {icon}
      {label}
    </Link>
  )
}