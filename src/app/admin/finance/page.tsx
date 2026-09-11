"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { useFinanceRealtime } from "@/hooks/use-finance-realtime"
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Calendar,
  ChevronDown,
  CircleDollarSign,
  Clock,
  Coins,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  RefreshCw,
  Receipt,
  Settings2,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react"

/* ============================================================
   TYPES
   ============================================================ */

type FinanceSummary = {
  period: { start: string; end: string; timezone: string }
  cash_in: number
  ai_revenue: number
  ai_cost: number
  gross_profit: number
  operating_expenses: number
  net_profit: number
  owner_withdrawals: number
  cash_position: number
  wallet_liability: {
    available: number
    held: number
    total: number
  }
  forex_rate_used: number
}

type ModelBreakdown = {
  provider: string
  requests: number
  input_tokens: number
  output_tokens: number
  total_tokens: number
  revenue_rupiah: number
  cost_rupiah: number
  gross_profit: number
  gross_margin_pct: number
}

type DailyTrend = {
  day: string
  revenue_rupiah: number
  cost_rupiah: number
  gross_profit: number
  cash_in: number
}

type Expense = {
  id: string
  category: string
  description: string
  amount_rupiah: number
  expense_date: string
  vendor: string | null
  reference_number: string | null
  receipt_url: string | null
  is_recurring: boolean
  recurring_period: string | null
  notes: string | null
  created_at: string
}

type Withdrawal = {
  id: string
  amount_rupiah: number
  withdrawn_at: string
  recipient: string
  method: string | null
  reference_number: string | null
  proof_url: string | null
  notes: string | null
  created_at: string
}

type RecentActivity = {
  topups: {
    id: string
    order_id: string
    amount_rupiah: number
    status: string
    payment_method: string | null
    paid_at: string | null
    created_at: string
  }[]
  usage: {
    id: string
    model: string
    input_tokens: number | null
    output_tokens: number | null
    total_tokens: number
    cost_rupiah: number
    cost_usd: number
    created_at: string
    status: string
  }[]
  expenses: {
    id: string
    category: string
    description: string
    amount_rupiah: number
    expense_date: string
    created_at: string
  }[]
  withdrawals: {
    id: string
    amount_rupiah: number
    recipient: string
    method: string | null
    withdrawn_at: string
    created_at: string
  }[]
}

type DateRange = "today" | "7d" | "month" | "last_month" | "custom"

/* ============================================================
   HELPERS
   ============================================================ */

const EXPENSE_CATEGORIES = [
  "VPS",
  "Domain",
  "Hosting",
  "Software",
  "Monitoring",
  "Email",
  "Marketing",
  "Legal",
  "Tax",
  "Hardware",
  "Other",
]

function formatRupiah(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""
  return `${sign}Rp ${abs.toLocaleString("id-ID")}`
}

function formatCompactRupiah(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(2)} M`
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(2)} jt`
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(abs / 1_000).toFixed(1)} rb`
  }
  return `${sign}Rp ${abs.toLocaleString("id-ID")}`
}

function formatNumber(value: number): string {
  return value.toLocaleString("id-ID")
}

function formatDateID(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  })
}

function formatDateOnlyID(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  })
}

/** Hitung range dari filter relatif (dalam WIB) */
function computeRange(
  range: DateRange,
  customStart?: string,
  customEnd?: string
): { start: string; end: string; label: string } {
  const now = new Date()
  const jakartaOffsetMs = 7 * 60 * 60 * 1000

  // Hari ini di WIB
  const jakartaNow = new Date(now.getTime() + jakartaOffsetMs)
  const y = jakartaNow.getUTCFullYear()
  const m = jakartaNow.getUTCMonth()
  const d = jakartaNow.getUTCDate()

  // Start of today WIB → convert balik ke UTC
  const startTodayUTC = new Date(Date.UTC(y, m, d, 0, 0, 0) - jakartaOffsetMs)
  const endTodayUTC = new Date(
    Date.UTC(y, m, d + 1, 0, 0, 0) - jakartaOffsetMs
  )

  function isoStart(offsetDays: number): string {
    const s = new Date(startTodayUTC.getTime() - offsetDays * 86400000)
    return s.toISOString()
  }

  function isoEnd(offsetDays: number): string {
    const e = new Date(endTodayUTC.getTime() - offsetDays * 86400000)
    return e.toISOString()
  }

  switch (range) {
    case "today":
      return {
        start: startTodayUTC.toISOString(),
        end: endTodayUTC.toISOString(),
        label: "Hari ini",
      }
    case "7d":
      return {
        start: isoStart(6),
        end: endTodayUTC.toISOString(),
        label: "7 hari terakhir",
      }
    case "month": {
      // Start of current month WIB
      const startMonth = new Date(
        Date.UTC(y, m, 1, 0, 0, 0) - jakartaOffsetMs
      )
      return {
        start: startMonth.toISOString(),
        end: endTodayUTC.toISOString(),
        label: "Bulan ini",
      }
    }
    case "last_month": {
      const startLast = new Date(
        Date.UTC(y, m - 1, 1, 0, 0, 0) - jakartaOffsetMs
      )
      const endLast = new Date(Date.UTC(y, m, 1, 0, 0, 0) - jakartaOffsetMs)
      return {
        start: startLast.toISOString(),
        end: endLast.toISOString(),
        label: "Bulan lalu",
      }
    }
    case "custom": {
      if (!customStart || !customEnd) {
        return {
          start: startTodayUTC.toISOString(),
          end: endTodayUTC.toISOString(),
          label: "Hari ini",
        }
      }
      // Custom: customStart & customEnd dalam format YYYY-MM-DD (WIB)
      const [sy, sm, sd] = customStart.split("-").map(Number)
      const [ey, em, ed] = customEnd.split("-").map(Number)
      const s = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0) - jakartaOffsetMs)
      const e = new Date(Date.UTC(ey, em - 1, ed + 1, 0, 0, 0) - jakartaOffsetMs)
      return {
        start: s.toISOString(),
        end: e.toISOString(),
        label: `${customStart} → ${customEnd}`,
      }
    }
  }
}

const inputClass =
  "min-h-10 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] px-3 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25 disabled:opacity-60"

/* ============================================================
   PAGE
   ============================================================ */

export default function AdminFinancePage() {
  const [range, setRange] = useState<DateRange>("month")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")

  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [breakdown, setBreakdown] = useState<ModelBreakdown[]>([])
  const [trend, setTrend] = useState<DailyTrend[]>([])
  const [activity, setActivity] = useState<RecentActivity>({
    topups: [],
    usage: [],
    expenses: [],
    withdrawals: [],
  })
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "withdrawals">(
    "overview"
  )
  const [showValue, setShowValue] = useState(true)
  const [expenseModal, setExpenseModal] = useState<Expense | "new" | null>(null)
  const [withdrawalModal, setWithdrawalModal] = useState<Withdrawal | "new" | null>(
    null
  )

  const computedRange = useMemo(
    () => computeRange(range, customStart, customEnd),
    [range, customStart, customEnd]
  )

  const fetchAll = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      else setRefreshing(true)
      setError(false)
      try {
        const params = new URLSearchParams({
          start: computedRange.start,
          end: computedRange.end,
        })

        const [resSummary, resActivity, resExpenses, resWithdrawals] =
          await Promise.all([
            fetch(`/api/admin/finance/summary?${params}`),
            fetch(`/api/admin/finance/transactions?${params}&limit=15`),
            fetch(`/api/admin/finance/expenses?${params}`),
            fetch(`/api/admin/finance/withdrawals?${params}`),
          ])

        if (!resSummary.ok || !resActivity.ok) throw new Error("Failed")

        const dataSummary = (await resSummary.json()) as {
          summary: FinanceSummary
          modelBreakdown: ModelBreakdown[]
          dailyTrend: DailyTrend[]
        }
        const dataActivity = (await resActivity.json()) as RecentActivity
        const dataExpenses = (await resExpenses.json()) as {
          expenses: Expense[]
        }
        const dataWithdrawals = (await resWithdrawals.json()) as {
          withdrawals: Withdrawal[]
        }

        setSummary(dataSummary.summary)
        setBreakdown(dataSummary.modelBreakdown)
        setTrend(dataSummary.dailyTrend)
        setActivity(dataActivity)
        setExpenses(dataExpenses.expenses ?? [])
        setWithdrawals(dataWithdrawals.withdrawals ?? [])
      } catch (err) {
        console.error("Finance fetch error:", err)
        setError(true)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [computedRange.start, computedRange.end]
  )

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  // Realtime subscription
  const { status: rtStatus, lastEventAt } = useFinanceRealtime(() => {
    void fetchAll(true)
  })

  /* ============ Derived metrics ============ */
  const aiMarginPct = useMemo(() => {
    if (!summary || summary.ai_revenue <= 0) return 0
    return (summary.gross_profit / summary.ai_revenue) * 100
  }, [summary])

  const netMarginPct = useMemo(() => {
    if (!summary || summary.ai_revenue <= 0) return 0
    return (summary.net_profit / summary.ai_revenue) * 100
  }, [summary])

  const visibleValue = (value: number): string =>
    showValue ? formatRupiah(value) : "Rp ••••••"

  if (loading && !summary) {
    return (
      <div className="relative flex min-h-screen items-center justify-center text-(--pk-text)">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-(--pk-accent)" />
          <p className="text-xs text-(--pk-text-mute)">
            Memuat data keuangan…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen text-(--pk-text)">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-(--pk-line) bg-[#070f1e]/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
                Admin tool
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                  <Coins size={24} className="text-(--pk-accent)" />
                  Finance
                </h1>

                {/* Realtime indicator */}
                <RealtimeBadge
                  status={rtStatus}
                  lastEventAt={lastEventAt}
                />
              </div>
              <p className="mt-2 max-w-2xl text-sm text-(--pk-text-dim)">
                P&L, COGS, wallet liability, dan cash position real-time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowValue((v) => !v)}
                aria-label={showValue ? "Sembunyikan angka" : "Tampilkan angka"}
                title={showValue ? "Sembunyikan angka" : "Tampilkan angka"}
                className="pk-btn-ghost inline-flex h-10 w-10 items-center justify-center"
              >
                {showValue ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              <button
                type="button"
                onClick={() => void fetchAll(true)}
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

          {/* Date filter + Tabs */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <DateFilter
              value={range}
              onChange={setRange}
              customStart={customStart}
              customEnd={customEnd}
              onCustomStart={setCustomStart}
              onCustomEnd={setCustomEnd}
              label={computedRange.label}
            />

            <div
              role="tablist"
              className="inline-flex w-fit rounded-xl border border-(--pk-line-2) bg-[#0b1626] p-1"
            >
              {(
                [
                  { value: "overview", label: "Overview" },
                  { value: "expenses", label: "Biaya" },
                  { value: "withdrawals", label: "Penarikan" },
                ] as const
              ).map((tab) => {
                const active = activeTab === tab.value
                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.value)}
                    className={`min-h-9 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-all ${
                      active
                        ? "bg-linear-to-r from-[#ffc266] to-[#f0a93b] text-[#10192b] shadow-[0_6px_18px_-8px_rgba(240,169,59,0.9)]"
                        : "text-(--pk-text-dim) hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        {error && (
          <div className="pk-panel mb-6 p-5 text-center">
            <p className="text-sm text-[#fca5a5]">
              Data finance tidak bisa dimuat.
            </p>
            <button
              type="button"
              onClick={() => void fetchAll()}
              className="pk-btn-ghost mt-4 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
            >
              Coba lagi
            </button>
          </div>
        )}

        {activeTab === "overview" && summary && (
          <OverviewTab
            summary={summary}
            breakdown={breakdown}
            trend={trend}
            activity={activity}
            aiMarginPct={aiMarginPct}
            netMarginPct={netMarginPct}
            showValue={showValue}
            visibleValue={visibleValue}
            rangeLabel={computedRange.label}
          />
        )}

        {activeTab === "expenses" && (
          <ExpensesTab
            expenses={expenses}
            showValue={showValue}
            visibleValue={visibleValue}
            onAdd={() => setExpenseModal("new")}
            onEdit={(e) => setExpenseModal(e)}
            onDelete={async (expense) => {
              if (!confirm(`Hapus biaya "${expense.description}"?`)) return
              const res = await fetch(
                `/api/admin/finance/expenses?id=${expense.id}`,
                { method: "DELETE" }
              )
              if (res.ok) {
                toast.success("Biaya dihapus")
                void fetchAll(true)
              } else {
                toast.error("Gagal menghapus biaya")
              }
            }}
          />
        )}

        {activeTab === "withdrawals" && (
          <WithdrawalsTab
            withdrawals={withdrawals}
            showValue={showValue}
            visibleValue={visibleValue}
            onAdd={() => setWithdrawalModal("new")}
            onDelete={async (w) => {
              if (!confirm(`Hapus penarikan ${formatRupiah(w.amount_rupiah)}?`)) return
              const res = await fetch(
                `/api/admin/finance/withdrawals?id=${w.id}`,
                { method: "DELETE" }
              )
              if (res.ok) {
                toast.success("Penarikan dihapus")
                void fetchAll(true)
              } else {
                toast.error("Gagal menghapus penarikan")
              }
            }}
          />
        )}
      </div>

      {expenseModal && (
        <ExpenseModal
          editing={expenseModal === "new" ? null : expenseModal}
          onClose={() => setExpenseModal(null)}
          onSaved={() => {
            setExpenseModal(null)
            void fetchAll(true)
          }}
        />
      )}

      {withdrawalModal && (
        <WithdrawalModal
          onClose={() => setWithdrawalModal(null)}
          onSaved={() => {
            setWithdrawalModal(null)
            void fetchAll(true)
          }}
        />
      )}
    </div>
  )
}

/* ============================================================
   REALTIME BADGE
   ============================================================ */

function RealtimeBadge({
  status,
  lastEventAt,
}: {
  status: "connecting" | "connected" | "disconnected"
  lastEventAt: Date | null
}) {
  const tone =
    status === "connected"
      ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#6ee7b7]"
      : status === "connecting"
        ? "border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#fcd34d]"
        : "border-[#f87171]/40 bg-[#f87171]/10 text-[#fca5a5]"

  const label =
    status === "connected"
      ? "Live"
      : status === "connecting"
        ? "Menghubungkan…"
        : "Realtime disconnected"

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${tone}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {status === "connected" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
        )}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {label}
      {lastEventAt && status === "connected" && (
        <span className="ml-1 opacity-70">
          · {lastEventAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </span>
  )
}

/* ============================================================
   DATE FILTER
   ============================================================ */

function DateFilter({
  value,
  onChange,
  customStart,
  customEnd,
  onCustomStart,
  onCustomEnd,
  label,
}: {
  value: DateRange
  onChange: (v: DateRange) => void
  customStart: string
  customEnd: string
  onCustomStart: (v: string) => void
  onCustomEnd: (v: string) => void
  label: string
}) {
  const presets: { value: DateRange; label: string }[] = [
    { value: "today", label: "Hari ini" },
    { value: "7d", label: "7 hari" },
    { value: "month", label: "Bulan ini" },
    { value: "last_month", label: "Bulan lalu" },
    { value: "custom", label: "Custom" },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-xl border border-(--pk-line-2) bg-[#0b1626] p-1">
        {presets.map((p) => {
          const active = value === p.value
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value)}
              className={`min-h-8 whitespace-nowrap rounded-lg px-2.5 text-[11px] font-medium transition-all ${
                active
                  ? "bg-(--pk-accent)/15 text-(--pk-accent)"
                  : "text-(--pk-text-dim) hover:text-white"
              }`}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {value === "custom" && (
        <div className="flex items-center gap-1.5 rounded-xl border border-(--pk-line-2) bg-[#0b1626] px-2 py-1">
          <Calendar size={12} className="text-(--pk-text-mute)" />
          <input
            type="date"
            value={customStart}
            onChange={(e) => onCustomStart(e.target.value)}
            className="bg-transparent text-[11px] text-(--pk-text) outline-none [color-scheme:dark]"
          />
          <span className="text-(--pk-text-mute)">→</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onCustomEnd(e.target.value)}
            className="bg-transparent text-[11px] text-(--pk-text) outline-none [color-scheme:dark]"
          />
        </div>
      )}

      <span className="hidden text-[11px] text-(--pk-text-mute) sm:inline">
        {label}
      </span>
    </div>
  )
}

/* ============================================================
   OVERVIEW TAB
   ============================================================ */

function OverviewTab({
  summary,
  breakdown,
  trend,
  activity,
  aiMarginPct,
  netMarginPct,
  showValue,
  visibleValue,
  rangeLabel,
}: {
  summary: FinanceSummary
  breakdown: ModelBreakdown[]
  trend: DailyTrend[]
  activity: RecentActivity
  aiMarginPct: number
  netMarginPct: number
  showValue: boolean
  visibleValue: (v: number) => string
  rangeLabel: string
}) {
  return (
    <div className="space-y-6">
      {/* Top cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="AI Revenue"
          value={visibleValue(summary.ai_revenue)}
          hint={`Customer charged · ${rangeLabel}`}
          icon={<TrendingUp size={14} className="text-[#6ee7b7]" />}
          tone="border-[#34d399]/30"
          valueClass="text-[#6ee7b7]"
        />
        <StatCard
          label="AI Cost (COGS)"
          value={visibleValue(summary.ai_cost)}
          hint={`OpenRouter · rate ${summary.forex_rate_used.toLocaleString("id-ID")}`}
          icon={<TrendingDown size={14} className="text-[#fca5a5]" />}
          tone="border-[#f87171]/30"
          valueClass="text-[#fca5a5]"
        />
        <StatCard
          label="Gross Profit"
          value={visibleValue(summary.gross_profit)}
          hint={`Margin ${aiMarginPct.toFixed(1)}%`}
          icon={<CircleDollarSign size={14} className="text-(--pk-accent)" />}
          tone="border-(--pk-accent)/30"
          valueClass="text-(--pk-accent)"
        />
        <StatCard
          label="Net Profit"
          value={visibleValue(summary.net_profit)}
          hint={`Margin ${netMarginPct.toFixed(1)}%`}
          icon={<Banknote size={14} className="text-(--pk-accent)" />}
          tone="border-(--pk-accent)/30"
          valueClass="text-(--pk-accent)"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Cash In"
          value={visibleValue(summary.cash_in)}
          hint={`Topup settled · ${rangeLabel}`}
          icon={<ArrowUpRight size={14} className="text-[#6ee7b7]" />}
          tone="border-(--pk-line-2)"
        />
        <StatCard
          label="Operating Expenses"
          value={visibleValue(summary.operating_expenses)}
          hint={`Biaya operasional · ${rangeLabel}`}
          icon={<Receipt size={14} className="text-[#fca5a5]" />}
          tone="border-(--pk-line-2)"
        />
        <StatCard
          label="Cash Position"
          value={visibleValue(summary.cash_position)}
          hint="Kumulatif (all-time)"
          icon={<Wallet size={14} className="text-(--pk-accent)" />}
          tone="border-(--pk-accent)/30"
        />
        <StatCard
          label="Wallet Liability"
          value={visibleValue(summary.wallet_liability.total)}
          hint={`Avail ${formatCompactRupiah(summary.wallet_liability.available)} · Held ${formatCompactRupiah(summary.wallet_liability.held)}`}
          icon={<Coins size={14} className="text-[#fcd34d]" />}
          tone="border-[#fbbf24]/30"
          valueClass="text-[#fcd34d]"
        />
      </section>

      {/* Chart: Revenue vs Cost trend */}
      <TrendChart trend={trend} showValue={showValue} />

      {/* Model Breakdown */}
      <section className="pk-panel p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Breakdown Model</h2>
            <p className="mt-0.5 text-xs text-(--pk-text-mute)">
              GPT · Claude · GLM · {rangeLabel}
            </p>
          </div>
        </div>

        {breakdown.length === 0 ? (
          <p className="mt-5 py-8 text-center text-sm text-(--pk-text-mute)">
            Belum ada data usage di periode ini.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto pk-scroll">
            <table className="w-full min-w-3xl text-left text-sm">
              <thead className="border-b border-(--pk-line) text-(--pk-text-mute)">
                <tr>
                  <th className="py-3 pr-4 text-[10px] font-semibold uppercase tracking-widest">
                    Provider
                  </th>
                  <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-widest">
                    Requests
                  </th>
                  <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-widest">
                    Tokens
                  </th>
                  <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-widest">
                    Revenue
                  </th>
                  <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-widest">
                    AI Cost
                  </th>
                  <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-widest">
                    Profit
                  </th>
                  <th className="pl-3 py-3 text-right text-[10px] font-semibold uppercase tracking-widest">
                    Margin
                  </th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((row) => (
                  <tr
                    key={row.provider}
                    className="border-b border-(--pk-line) last:border-0"
                  >
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
                          row.provider === "GPT"
                            ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#6ee7b7]"
                            : row.provider === "Claude"
                              ? "border-(--pk-accent)/40 bg-(--pk-accent)/10 text-(--pk-accent)"
                              : row.provider === "GLM"
                                ? "border-[#a78bfa]/40 bg-[#a78bfa]/10 text-[#c4b5fd]"
                                : "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim)"
                        }`}
                      >
                        {row.provider}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs">
                      {formatNumber(row.requests)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-(--pk-text-dim)">
                      {formatNumber(row.total_tokens)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-[#6ee7b7]">
                      {showValue ? formatCompactRupiah(row.revenue_rupiah) : "•••"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-[#fca5a5]">
                      {showValue ? formatCompactRupiah(row.cost_rupiah) : "•••"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs font-semibold text-(--pk-accent)">
                      {showValue ? formatCompactRupiah(row.gross_profit) : "•••"}
                    </td>
                    <td className="pl-3 py-3 text-right font-mono text-xs">
                      <span
                        className={
                          row.gross_margin_pct >= 30
                            ? "text-[#6ee7b7]"
                            : row.gross_margin_pct >= 15
                              ? "text-[#fcd34d]"
                              : "text-[#fca5a5]"
                        }
                      >
                        {row.gross_margin_pct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent Activity */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ActivityCard
          title="Topup Terbaru"
          empty="Belum ada topup di periode ini"
          items={activity.topups.map((t) => ({
            id: t.id,
            primary: `Rp ${t.amount_rupiah.toLocaleString("id-ID")}`,
            secondary: `${t.payment_method ?? "—"} · ${t.order_id}`,
            time: t.paid_at ?? t.created_at,
            tone: "text-[#6ee7b7]",
          }))}
          showValue={showValue}
        />
        <ActivityCard
          title="AI Usage Terbaru"
          empty="Belum ada usage di periode ini"
          items={activity.usage.map((u) => ({
            id: u.id,
            primary: `Rp ${u.cost_rupiah.toLocaleString("id-ID")}`,
            secondary: `${u.model} · ${u.total_tokens} tok`,
            time: u.created_at,
            tone: "text-(--pk-text)",
          }))}
          showValue={showValue}
        />
      </section>
    </div>
  )
}

/* ============================================================
   STAT CARD
   ============================================================ */

function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "border-(--pk-line-2)",
  valueClass = "text-(--pk-text)",
}: {
  label: string
  value: string
  hint?: string
  icon?: React.ReactNode
  tone?: string
  valueClass?: string
}) {
  return (
    <div className={`pk-panel p-5 ${tone}`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
          {label}
        </p>
        {icon}
      </div>
      <p className={`mt-3 truncate font-mono text-2xl font-semibold ${valueClass}`}>
        {value}
      </p>
      {hint && (
        <p className="mt-1 truncate text-[11px] text-(--pk-text-mute)">
          {hint}
        </p>
      )}
    </div>
  )
}

/* ============================================================
   TREND CHART (SVG sederhana)
   ============================================================ */

function TrendChart({
  trend,
  showValue,
}: {
  trend: DailyTrend[]
  showValue: boolean
}) {
  const width = 800
  const height = 220
  const padding = { top: 20, right: 20, bottom: 30, left: 50 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const maxValue = useMemo(() => {
    let m = 0
    for (const t of trend) {
      m = Math.max(m, t.revenue_rupiah, t.cost_rupiah)
    }
    return m > 0 ? m : 1
  }, [trend])

  if (trend.length === 0) {
    return (
      <section className="pk-panel p-5 sm:p-6">
        <h2 className="text-base font-semibold">Tren Revenue vs Cost</h2>
        <p className="mt-5 py-12 text-center text-sm text-(--pk-text-mute)">
          Belum ada data di periode ini.
        </p>
      </section>
    )
  }

  const stepX = trend.length > 1 ? chartW / (trend.length - 1) : 0

  function x(i: number) {
    return padding.left + i * stepX
  }
  function y(v: number) {
    return padding.top + chartH - (v / maxValue) * chartH
  }

  const revenuePath = trend
    .map((t, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(t.revenue_rupiah)}`)
    .join(" ")

  const costPath = trend
    .map((t, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(t.cost_rupiah)}`)
    .join(" ")

  return (
    <section className="pk-panel p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Tren Revenue vs Cost</h2>
          <p className="mt-0.5 text-xs text-(--pk-text-mute)">
            Per hari · hover untuk detail
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#6ee7b7]" />
            Revenue
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#fca5a5]" />
            Cost
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto pk-scroll">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[600px] w-full"
          role="img"
          aria-label="Revenue vs Cost trend"
        >
          {/* Y grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <line
              key={p}
              x1={padding.left}
              x2={width - padding.right}
              y1={padding.top + chartH * (1 - p)}
              y2={padding.top + chartH * (1 - p)}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeWidth="1"
            />
          ))}

          {/* Y labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <text
              key={p}
              x={padding.left - 8}
              y={padding.top + chartH * (1 - p) + 4}
              textAnchor="end"
              className="fill-current text-[9px]"
              fill="currentColor"
              fillOpacity="0.5"
            >
              {showValue ? formatCompactRupiah(maxValue * p) : "•••"}
            </text>
          ))}

          {/* Revenue line */}
          <path
            d={revenuePath}
            stroke="#6ee7b7"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Cost line */}
          <path
            d={costPath}
            stroke="#fca5a5"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots */}
          {trend.map((t, i) => (
            <g key={t.day}>
              <circle
                cx={x(i)}
                cy={y(t.revenue_rupiah)}
                r="3"
                fill="#6ee7b7"
              />
              <circle cx={x(i)} cy={y(t.cost_rupiah)} r="3" fill="#fca5a5" />
            </g>
          ))}

          {/* X labels (setiap 2 hari kalau lebih dari 14) */}
          {trend.map((t, i) => {
            const skip = trend.length > 14 ? 3 : trend.length > 7 ? 2 : 1
            if (i % skip !== 0 && i !== trend.length - 1) return null
            return (
              <text
                key={t.day}
                x={x(i)}
                y={height - 8}
                textAnchor="middle"
                fill="currentColor"
                fillOpacity="0.5"
                className="text-[9px]"
              >
                {new Date(t.day).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                })}
              </text>
            )
          })}
        </svg>
      </div>
    </section>
  )
}

/* ============================================================
   ACTIVITY CARD
   ============================================================ */

function ActivityCard({
  title,
  empty,
  items,
  showValue,
}: {
  title: string
  empty: string
  items: { id: string; primary: string; secondary: string; time: string; tone: string }[]
  showValue: boolean
}) {
  return (
    <div className="pk-panel p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-4 py-6 text-center text-xs text-(--pk-text-mute)">
          {empty}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-(--pk-line)">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className={`truncate font-mono text-xs font-medium ${item.tone}`}>
                  {showValue ? item.primary : "Rp ••••"}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-(--pk-text-mute)">
                  {item.secondary}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-(--pk-text-mute)">
                {new Date(item.time).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Jakarta",
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ============================================================
   EXPENSES TAB
   ============================================================ */

function ExpensesTab({
  expenses,
  showValue,
  visibleValue,
  onAdd,
  onEdit,
  onDelete,
}: {
  expenses: Expense[]
  showValue: boolean
  visibleValue: (v: number) => string
  onAdd: () => void
  onEdit: (e: Expense) => void
  onDelete: (e: Expense) => void
}) {
  const total = useMemo(
    () => expenses.reduce((s, e) => s + e.amount_rupiah, 0),
    [expenses]
  )

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of expenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount_rupiah)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [expenses])

  return (
    <div className="space-y-6">
      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Biaya"
          value={visibleValue(total)}
          hint={`${expenses.length} entri`}
          icon={<Receipt size={14} className="text-[#fca5a5]" />}
          tone="border-[#f87171]/30"
          valueClass="text-[#fca5a5]"
        />
        <StatCard
          label="Kategori Unik"
          value={byCategory.length.toString()}
          hint="Dari daftar biaya"
          icon={<Settings2 size={14} className="text-(--pk-accent)" />}
          tone="border-(--pk-line-2)"
        />
        <StatCard
          label="Rata-rata"
          value={
            expenses.length > 0 ? visibleValue(total / expenses.length) : "Rp 0"
          }
          hint="Per entri"
          icon={<Coins size={14} className="text-(--pk-accent)" />}
          tone="border-(--pk-line-2)"
        />
      </section>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <section className="pk-panel p-5">
          <h3 className="text-sm font-semibold">Breakdown Kategori</h3>
          <ul className="mt-3 space-y-2">
            {byCategory.map(([cat, amt]) => {
              const pct = total > 0 ? (amt / total) * 100 : 0
              return (
                <li key={cat} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 truncate text-[11px] text-(--pk-text-dim)">
                    {cat}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#0b1626]">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-[#ffc266] to-[#f0a93b]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right font-mono text-[11px] text-(--pk-text-mute)">
                    {showValue ? formatCompactRupiah(amt) : "•••"}
                  </span>
                  <span className="w-12 shrink-0 text-right font-mono text-[10px] text-(--pk-text-mute)">
                    {pct.toFixed(1)}%
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* List */}
      <section className="pk-panel p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Daftar Biaya</h3>
            <p className="mt-0.5 text-xs text-(--pk-text-mute)">
              Biaya operasional manual
            </p>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="pk-btn-primary inline-flex min-h-9 items-center gap-1.5 px-3 text-xs"
          >
            <Plus size={12} />
            Tambah
          </button>
        </div>

        {expenses.length === 0 ? (
          <p className="mt-6 py-8 text-center text-sm text-(--pk-text-mute)">
            Belum ada biaya dicatat. Klik Tambah untuk mulai.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-(--pk-line)">
            {expenses.map((e) => (
              <li
                key={e.id}
                className="flex items-start justify-between gap-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-(--pk-line-2) bg-[#0b1626] px-2 py-0.5 text-[10px] font-medium text-(--pk-text-dim)">
                      {e.category}
                    </span>
                    {e.is_recurring && (
                      <span className="inline-flex items-center rounded-full border border-(--pk-accent)/40 bg-(--pk-accent)/10 px-2 py-0.5 text-[10px] font-medium text-(--pk-accent)">
                        {e.recurring_period ?? "recurring"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 truncate text-xs text-(--pk-text)">
                    {e.description}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-(--pk-text-mute)">
                    {formatDateOnlyID(e.expense_date)}
                    {e.vendor && ` · ${e.vendor}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#fca5a5]">
                    {showValue ? formatRupiah(e.amount_rupiah) : "Rp •••"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEdit(e)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-(--pk-line-2) text-(--pk-text-mute) transition-colors hover:border-(--pk-accent)/40 hover:text-(--pk-accent)"
                    aria-label="Edit"
                  >
                    <Settings2 size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(e)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#f87171]/30 bg-[#f87171]/5 text-[#fca5a5] transition-colors hover:bg-[#f87171]/20"
                    aria-label="Hapus"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

/* ============================================================
   WITHDRAWALS TAB
   ============================================================ */

function WithdrawalsTab({
  withdrawals,
  showValue,
  visibleValue,
  onAdd,
  onDelete,
}: {
  withdrawals: Withdrawal[]
  showValue: boolean
  visibleValue: (v: number) => string
  onAdd: () => void
  onDelete: (w: Withdrawal) => void
}) {
  const total = useMemo(
    () => withdrawals.reduce((s, w) => s + w.amount_rupiah, 0),
    [withdrawals]
  )

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Penarikan"
          value={visibleValue(total)}
          hint={`${withdrawals.length} entri`}
          icon={<ArrowDownRight size={14} className="text-[#fca5a5]" />}
          tone="border-[#f87171]/30"
          valueClass="text-[#fca5a5]"
        />
        <StatCard
          label="Rata-rata"
          value={
            withdrawals.length > 0
              ? visibleValue(total / withdrawals.length)
              : "Rp 0"
          }
          hint="Per penarikan"
          icon={<Coins size={14} className="text-(--pk-accent)" />}
          tone="border-(--pk-line-2)"
        />
        <StatCard
          label="Penerima Unik"
          value={
            new Set(withdrawals.map((w) => w.recipient)).size.toString()
          }
          hint="Dari daftar penarikan"
          icon={<CircleDollarSign size={14} className="text-(--pk-accent)" />}
          tone="border-(--pk-line-2)"
        />
      </section>

      <section className="pk-panel p-5">
        <div className="rounded-xl border border-[#fbbf24]/30 bg-[#fbbf24]/5 p-3 text-[11px] leading-5 text-[#fcd34d]">
          <strong>Catatan:</strong> Owner withdrawal BUKAN operating expense.
          Ini pergerakan equity — uang keluar dari cash bisnis untuk owner.
          Tidak masuk perhitungan P&L, hanya mengurangi cash position.
        </div>
      </section>

      <section className="pk-panel p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Riwayat Penarikan</h3>
            <p className="mt-0.5 text-xs text-(--pk-text-mute)">
              Owner/equity cash movement
            </p>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="pk-btn-primary inline-flex min-h-9 items-center gap-1.5 px-3 text-xs"
          >
            <Plus size={12} />
            Tambah
          </button>
        </div>

        {withdrawals.length === 0 ? (
          <p className="mt-6 py-8 text-center text-sm text-(--pk-text-mute)">
            Belum ada penarikan dicatat.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-(--pk-line)">
            {withdrawals.map((w) => (
              <li
                key={w.id}
                className="flex items-start justify-between gap-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-(--pk-text)">
                    {w.recipient}
                    {w.method && (
                      <span className="text-(--pk-text-mute)"> · {w.method}</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[10px] text-(--pk-text-mute)">
                    {formatDateOnlyID(w.withdrawn_at)}
                    {w.reference_number && ` · ${w.reference_number}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#fca5a5]">
                    −{showValue ? formatRupiah(w.amount_rupiah) : "Rp •••"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDelete(w)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#f87171]/30 bg-[#f87171]/5 text-[#fca5a5] transition-colors hover:bg-[#f87171]/20"
                    aria-label="Hapus"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

/* ============================================================
   EXPENSE MODAL
   ============================================================ */

function ExpenseModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: Expense | null
  onClose: () => void
  onSaved: () => void
}) {
  const [category, setCategory] = useState(editing?.category ?? "Other")
  const [description, setDescription] = useState(editing?.description ?? "")
  const [amount, setAmount] = useState(
    editing?.amount_rupiah ? String(editing.amount_rupiah) : ""
  )
  const [expenseDate, setExpenseDate] = useState(
    editing?.expense_date ?? new Date().toISOString().slice(0, 10)
  )
  const [vendor, setVendor] = useState(editing?.vendor ?? "")
  const [referenceNumber, setReferenceNumber] = useState(
    editing?.reference_number ?? ""
  )
  const [receiptUrl, setReceiptUrl] = useState(editing?.receipt_url ?? "")
  const [isRecurring, setIsRecurring] = useState(editing?.is_recurring ?? false)
  const [recurringPeriod, setRecurringPeriod] = useState(
    editing?.recurring_period ?? "monthly"
  )
  const [notes, setNotes] = useState(editing?.notes ?? "")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose()
    }
    document.addEventListener("keydown", onEsc)
    return () => {
      document.body.style.overflow = original
      document.removeEventListener("keydown", onEsc)
    }
  }, [onClose, saving])

  async function save() {
    const amountNum = Number(amount)
    if (!description.trim()) {
      toast.error("Deskripsi wajib diisi")
      return
    }
    if (!amountNum || amountNum <= 0) {
      toast.error("Jumlah harus lebih dari 0")
      return
    }
    if (!expenseDate) {
      toast.error("Tanggal wajib diisi")
      return
    }

    setSaving(true)
    try {
      const url = "/api/admin/finance/expenses"
      const method = editing ? "PATCH" : "POST"
      const body = editing
        ? {
            id: editing.id,
            category,
            description: description.trim(),
            amount_rupiah: amountNum,
            expense_date: expenseDate,
            vendor: vendor.trim() || null,
            reference_number: referenceNumber.trim() || null,
            receipt_url: receiptUrl.trim() || null,
            is_recurring: isRecurring,
            recurring_period: isRecurring ? recurringPeriod : null,
            notes: notes.trim() || null,
          }
        : {
            category,
            description: description.trim(),
            amount_rupiah: amountNum,
            expense_date: expenseDate,
            vendor: vendor.trim() || null,
            reference_number: referenceNumber.trim() || null,
            receipt_url: receiptUrl.trim() || null,
            is_recurring: isRecurring,
            recurring_period: isRecurring ? recurringPeriod : null,
            notes: notes.trim() || null,
          }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success(editing ? "Biaya diperbarui" : "Biaya ditambahkan")
      onSaved()
    } catch {
      toast.error("Gagal menyimpan biaya")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={() => !saving && onClose()}
    >
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="pk-panel pk-menu-in relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-6"
      >
        <button
          type="button"
          onClick={() => !saving && onClose()}
          aria-label="Tutup"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-(--pk-text-mute) transition-colors hover:bg-white/5 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
            <Receipt size={18} className="text-(--pk-accent)" />
          </span>
          <div>
            <h2 id="expense-modal-title" className="text-base font-semibold">
              {editing ? "Edit Biaya" : "Tambah Biaya"}
            </h2>
            <p className="mt-0.5 text-[11px] text-(--pk-text-mute)">
              Biaya operasional — mengurangi Net Profit
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
          className="mt-5 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium">Kategori</label>
              <div className="relative mt-1.5">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={saving}
                  className={`${inputClass} appearance-none pr-10`}
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#0b1626]">
                      {c}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-(--pk-text-mute)">
                  <ChevronDown size={12} />
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium">Tanggal</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                disabled={saving}
                className={`${inputClass} mt-1.5 [color-scheme:dark]`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">
              Deskripsi <span className="text-(--pk-accent)">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              placeholder="Misalnya: VPS production bulan September"
              className={`${inputClass} mt-1.5`}
            />
          </div>

          <div>
            <label className="text-xs font-medium">
              Jumlah (Rp) <span className="text-(--pk-accent)">*</span>
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-(--pk-text-mute)">
                Rp
              </span>
              <input
                type="number"
                min={1}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={saving}
                placeholder="0"
                className={`${inputClass} pl-10 font-mono`}
              />
            </div>
            {amount && Number(amount) > 0 && (
              <p className="mt-1 text-[10px] text-(--pk-text-mute)">
                = {formatRupiah(Number(amount))}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium">
                Vendor <span className="text-(--pk-text-mute)">(opsional)</span>
              </label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                disabled={saving}
                placeholder="Misalnya: DigitalOcean"
                className={`${inputClass} mt-1.5`}
              />
            </div>

            <div>
              <label className="text-xs font-medium">
                No. Referensi{" "}
                <span className="text-(--pk-text-mute)">(opsional)</span>
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                disabled={saving}
                placeholder="INV-2026-001"
                className={`${inputClass} mt-1.5 font-mono`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">
              URL Bukti{" "}
              <span className="text-(--pk-text-mute)">(opsional)</span>
            </label>
            <input
              type="url"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              disabled={saving}
              placeholder="https://..."
              className={`${inputClass} mt-1.5`}
            />
          </div>

          <div className="rounded-xl border border-(--pk-line-2) bg-[#0b1626]/60 p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Biaya berulang?</p>
                <p className="mt-0.5 text-[10px] text-(--pk-text-mute)">
                  Catat sebagai recurring expense
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isRecurring}
                onClick={() => setIsRecurring((v) => !v)}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
                  isRecurring
                    ? "border-(--pk-accent)/50 bg-(--pk-accent)/20"
                    : "border-(--pk-line-2) bg-[#0b1626]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                    isRecurring
                      ? "translate-x-6 bg-(--pk-accent)"
                      : "translate-x-1 bg-(--pk-text-mute)"
                  }`}
                />
              </button>
            </div>

            {isRecurring && (
              <div className="mt-3">
                <label className="text-[11px] font-medium text-(--pk-text-dim)">
                  Periode
                </label>
                <div className="relative mt-1.5">
                  <select
                    value={recurringPeriod}
                    onChange={(e) => setRecurringPeriod(e.target.value)}
                    disabled={saving}
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    <option value="daily">Harian</option>
                    <option value="weekly">Mingguan</option>
                    <option value="monthly">Bulanan</option>
                    <option value="quarterly">Kuartal</option>
                    <option value="yearly">Tahunan</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-(--pk-text-mute)">
                    <ChevronDown size={12} />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium">
              Catatan <span className="text-(--pk-text-mute)">(opsional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
              placeholder="Catatan internal…"
              className={`${inputClass} mt-1.5 resize-none`}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="pk-btn-ghost inline-flex min-h-10 items-center justify-center px-4 text-sm font-medium disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="pk-btn-primary inline-flex min-h-10 items-center justify-center gap-2 px-4 text-sm disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Plus size={13} />
              )}
              {saving ? "Menyimpan…" : editing ? "Simpan Perubahan" : "Tambah Biaya"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ============================================================
   WITHDRAWAL MODAL
   ============================================================ */

function WithdrawalModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const [amount, setAmount] = useState("")
  const [withdrawnAt, setWithdrawnAt] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [recipient, setRecipient] = useState("Owner")
  const [method, setMethod] = useState("bank_transfer")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [proofUrl, setProofUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose()
    }
    document.addEventListener("keydown", onEsc)
    return () => {
      document.body.style.overflow = original
      document.removeEventListener("keydown", onEsc)
    }
  }, [onClose, saving])

  async function save() {
    const amountNum = Number(amount)
    if (!amountNum || amountNum <= 0) {
      toast.error("Jumlah harus lebih dari 0")
      return
    }
    if (!withdrawnAt) {
      toast.error("Tanggal wajib diisi")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/finance/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_rupiah: amountNum,
          withdrawn_at: withdrawnAt,
          recipient: recipient.trim() || "Owner",
          method: method || null,
          reference_number: referenceNumber.trim() || null,
          proof_url: proofUrl.trim() || null,
          notes: notes.trim() || null,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Penarikan dicatat")
      onSaved()
    } catch {
      toast.error("Gagal menyimpan penarikan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdrawal-modal-title"
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={() => !saving && onClose()}
    >
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="pk-panel pk-menu-in relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-6"
      >
        <button
          type="button"
          onClick={() => !saving && onClose()}
          aria-label="Tutup"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-(--pk-text-mute) transition-colors hover:bg-white/5 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
            <ArrowDownRight size={18} className="text-(--pk-accent)" />
          </span>
          <div>
            <h2 id="withdrawal-modal-title" className="text-base font-semibold">
              Catat Penarikan Owner
            </h2>
            <p className="mt-0.5 text-[11px] text-(--pk-text-mute)">
              Equity movement — bukan operating expense
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[#fbbf24]/30 bg-[#fbbf24]/5 p-3 text-[11px] leading-5 text-[#fcd34d]">
          Penarikan owner akan <strong>mengurangi Cash Position</strong> tapi
          <strong> tidak masuk</strong> Operating Expenses atau Net Profit.
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
          className="mt-5 space-y-4"
        >
          <div>
            <label className="text-xs font-medium">
              Jumlah (Rp) <span className="text-(--pk-accent)">*</span>
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-(--pk-text-mute)">
                Rp
              </span>
              <input
                type="number"
                min={1}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={saving}
                placeholder="0"
                className={`${inputClass} pl-10 font-mono`}
              />
            </div>
            {amount && Number(amount) > 0 && (
              <p className="mt-1 text-[10px] text-(--pk-text-mute)">
                = {formatRupiah(Number(amount))}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium">Tanggal</label>
              <input
                type="date"
                value={withdrawnAt}
                onChange={(e) => setWithdrawnAt(e.target.value)}
                disabled={saving}
                className={`${inputClass} mt-1.5 [color-scheme:dark]`}
              />
            </div>

            <div>
              <label className="text-xs font-medium">Penerima</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                disabled={saving}
                placeholder="Owner"
                className={`${inputClass} mt-1.5`}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium">Metode</label>
              <div className="relative mt-1.5">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  disabled={saving}
                  className={`${inputClass} appearance-none pr-10`}
                >
                  <option value="bank_transfer">Transfer Bank</option>
                  <option value="cash">Tunai</option>
                  <option value="e_wallet">E-Wallet</option>
                  <option value="other">Lainnya</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-(--pk-text-mute)">
                  <ChevronDown size={12} />
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium">
                No. Referensi{" "}
                <span className="text-(--pk-text-mute)">(opsional)</span>
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                disabled={saving}
                placeholder="TRF-2026-001"
                className={`${inputClass} mt-1.5 font-mono`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">
              URL Bukti{" "}
              <span className="text-(--pk-text-mute)">(opsional)</span>
            </label>
            <input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              disabled={saving}
              placeholder="https://..."
              className={`${inputClass} mt-1.5`}
            />
          </div>

          <div>
            <label className="text-xs font-medium">
              Catatan <span className="text-(--pk-text-mute)">(opsional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
              placeholder="Catatan internal…"
              className={`${inputClass} mt-1.5 resize-none`}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="pk-btn-ghost inline-flex min-h-10 items-center justify-center px-4 text-sm font-medium disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="pk-btn-primary inline-flex min-h-10 items-center justify-center gap-2 px-4 text-sm disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Plus size={13} />
              )}
              {saving ? "Menyimpan…" : "Catat Penarikan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}