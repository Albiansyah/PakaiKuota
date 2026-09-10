"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { toast } from "sonner"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  X,
  XCircle,
} from "lucide-react"

type Transaction = {
  id: string
  user_id: string
  order_id: string
  amount_rupiah: number
  status: string
  payment_method: string
  pakasir_tx_id: string | null
  created_at: string
  paid_at: string | null
}

type StatusFilter =
  | "all"
  | "success"
  | "pending"
  | "failed"
  | "expired"
  | "refunded"
  | "refund_requested"

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "success", label: "Berhasil" },
  { value: "pending", label: "Menunggu" },
  { value: "failed", label: "Gagal" },
  { value: "expired", label: "Kadaluarsa" },
  { value: "refunded", label: "Di-refund" },
  { value: "refund_requested", label: "Refund Diminta" },
]

function statusTone(status: string) {
  switch (status) {
    case "success":
      return "border-[#34d399]/30 bg-[#34d399]/10 text-[#6ee7b7]"
    case "pending":
      return "border-[#fbbf24]/30 bg-[#fbbf24]/10 text-[#fcd34d]"
    case "failed":
      return "border-[#f87171]/30 bg-[#f87171]/10 text-[#fca5a5]"
    case "expired":
      return "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-mute)"
    case "refunded":
      return "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim)"
    case "refund_requested":
      return "border-[#fbbf24]/30 bg-[#fbbf24]/10 text-[#fcd34d]"
    default:
      return "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim)"
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "success":
      return "Berhasil"
    case "pending":
      return "Menunggu"
    case "failed":
      return "Gagal"
    case "expired":
      return "Kadaluarsa"
    case "refunded":
      return "Di-refund"
    case "refund_requested":
      return "Refund Diminta"
    default:
      return status
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "success":
      return <CheckCircle2 size={13} />
    case "pending":
      return <Clock size={13} />
    case "failed":
      return <XCircle size={13} />
    case "refunded":
      return <RotateCcw size={13} />
    case "refund_requested":
      return <AlertTriangle size={13} />
    default:
      return null
  }
}

export default function AdminTransactionsPage() {
  const { user } = useSupabase()
  const router = useRouter()

  const [txns, setTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [query, setQuery] = useState("")
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null)

  const fetchTransactions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(false)
    try {
      const res = await fetch("/api/admin/transactions")
      if (!res.ok) throw new Error("Unauthorized")
      const data = (await res.json()) as { transactions?: Transaction[] }
      setTxns(data.transactions ?? [])
    } catch (err) {
      console.error("Failed to fetch transactions:", err)
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
    void fetchTransactions()
  }, [user, router, fetchTransactions])

  const filtered = useMemo(() => {
    let list = txns
    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (t) =>
          t.order_id.toLowerCase().includes(q) ||
          t.user_id.toLowerCase().includes(q) ||
          t.payment_method.toLowerCase().includes(q) ||
          (t.pakasir_tx_id ?? "").toLowerCase().includes(q)
      )
    }
    return list
  }, [txns, statusFilter, query])

  const stats = useMemo(() => {
    const totalSuccess = txns
      .filter((t) => t.status === "success")
      .reduce((s, t) => s + t.amount_rupiah, 0)
    const totalRefund = txns
      .filter((t) => t.status === "refunded")
      .reduce((s, t) => s + t.amount_rupiah, 0)
    const pendingCount = txns.filter((t) => t.status === "pending").length
    return { totalSuccess, totalRefund, pendingCount, total: txns.length }
  }, [txns])

  async function processRefund(id: string) {
    if (!confirm("Proses refund untuk transaksi ini?")) return
    setActionLoading(id)
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: id, action: "refund" }),
      })
      if (!res.ok) throw new Error("Refund gagal diproses")
      setTxns((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "refunded" } : t))
      )
      toast.success("Refund berhasil diproses")
    } catch (err) {
      console.error("Failed to process refund:", err)
      toast.error("Gagal memproses refund")
    } finally {
      setActionLoading(null)
    }
  }

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
                <Receipt size={26} className="text-(--pk-accent)" />
                Transaksi
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-(--pk-text-dim)">
                Riwayat dan status semua transaksi pembayaran.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchTransactions(true)}
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
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {error && (
          <div className="pk-panel mb-6 p-5 text-center">
            <p className="text-sm text-[#fca5a5]">
              Data transaksi tidak bisa dimuat.
            </p>
            <button
              type="button"
              onClick={() => void fetchTransactions()}
              className="pk-btn-ghost mt-4 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
            >
              Coba lagi
            </button>
          </div>
        )}

        {!error && !loading && txns.length > 0 && (
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="pk-panel pk-inview p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Total transaksi
                </p>
                <Receipt size={14} className="text-(--pk-text-mute)" />
              </div>
              <p className="mt-3 font-mono text-2xl">{stats.total}</p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Semua status
              </p>
            </div>

            <div className="pk-panel pk-inview p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Total berhasil
                </p>
                <DollarSign size={14} className="text-[#6ee7b7]" />
              </div>
              <p className="mt-3 font-mono text-2xl text-[#6ee7b7]">
                Rp {stats.totalSuccess.toLocaleString("id-ID")}
              </p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Akumulasi transaksi sukses
              </p>
            </div>

            <div className="pk-panel pk-inview p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Di-refund
                </p>
                <RotateCcw size={14} className="text-[#fca5a5]" />
              </div>
              <p className="mt-3 font-mono text-2xl text-[#fca5a5]">
                Rp {stats.totalRefund.toLocaleString("id-ID")}
              </p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Akumulasi refund
              </p>
            </div>

            <div
              className={`pk-panel pk-inview p-5 ${
                stats.pendingCount > 0 ? "pk-featured" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Pending
                </p>
                <Clock size={14} className="text-[#fcd34d]" />
              </div>
              <p className="mt-3 font-mono text-2xl text-[#fcd34d]">
                {stats.pendingCount}
              </p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                {stats.pendingCount > 0
                  ? "Menunggu pembayaran"
                  : "Tidak ada pending"}
              </p>
            </div>
          </section>
        )}

        {!error && !loading && txns.length > 0 && (
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div
              role="group"
              aria-label="Filter status"
              className="flex flex-wrap gap-1 rounded-xl border border-(--pk-line-2) bg-[#0b1626] p-1"
            >
              {statusFilters.map((item) => {
                const active = statusFilter === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setStatusFilter(item.value)}
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
                placeholder="Cari order ID, user, metode..."
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

          {!loading && txns.length === 0 && (
            <div className="p-12 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-(--pk-line-2) bg-[#0b1626]">
                <Receipt size={22} className="text-(--pk-text-mute)" />
              </span>
              <p className="mt-5 font-semibold">Belum ada transaksi</p>
              <p className="mt-2 text-sm text-(--pk-text-dim)">
                Transaksi akan muncul di sini setelah user melakukan
                pembayaran.
              </p>
            </div>
          )}

          {!loading && txns.length > 0 && filtered.length === 0 && (
            <div className="p-12 text-center">
              <p className="font-semibold">Tidak ada transaksi yang cocok.</p>
              <p className="mt-2 text-sm text-(--pk-text-dim)">
                Coba ubah kata kunci atau filter status.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("")
                  setStatusFilter("all")
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
                        Order ID
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        User
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                        Nominal
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Metode
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Status
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Tanggal
                      </th>
                      <th className="w-24 px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((txn) => {
                      const isProcessing = actionLoading === txn.id
                      return (
                        <tr
                          key={txn.id}
                          onClick={() => setSelectedTxn(txn)}
                          className="cursor-pointer border-b border-(--pk-line) transition-colors last:border-0 hover:bg-white/2"
                        >
                          <td className="px-5 py-4 font-mono text-xs font-medium text-(--pk-text)">
                            {txn.order_id}
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-(--pk-text-dim)">
                            {txn.user_id.slice(0, 8)}…
                          </td>
                          <td className="px-5 py-4 text-right font-mono text-xs font-medium text-(--pk-text)">
                            Rp {txn.amount_rupiah.toLocaleString("id-ID")}
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center rounded-full border border-(--pk-line-2) bg-[#0b1626] px-2.5 py-0.5 text-[10px] font-medium text-(--pk-text-dim)">
                              {txn.payment_method}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${statusTone(
                                txn.status
                              )}`}
                            >
                              {statusIcon(txn.status)}
                              {statusLabel(txn.status)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-(--pk-text-dim)">
                            {new Date(txn.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {txn.status === "success" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  void processRefund(txn.id)
                                }}
                                disabled={isProcessing}
                                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[#f87171]/40 bg-[#f87171]/10 px-2.5 text-[11px] font-medium text-[#fca5a5] transition-colors hover:bg-[#f87171]/20 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isProcessing ? (
                                  <Loader2
                                    size={11}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <>
                                    <RotateCcw size={11} />
                                    Refund
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-(--pk-line) lg:hidden">
                {filtered.map((txn) => {
                  const isProcessing = actionLoading === txn.id
                  return (
                    <li
                      key={txn.id}
                      className="cursor-pointer p-4 transition-colors hover:bg-white/2"
                      onClick={() => setSelectedTxn(txn)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-xs font-medium text-(--pk-text)">
                            {txn.order_id}
                          </p>
                          <p className="mt-1 font-mono text-[11px] text-(--pk-text-mute)">
                            {txn.user_id.slice(0, 8)}…
                            <span className="mx-1.5">·</span>
                            {new Date(txn.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone(
                            txn.status
                          )}`}
                        >
                          {statusIcon(txn.status)}
                          {statusLabel(txn.status)}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-(--pk-line) bg-[#0b1626]/60 p-2.5">
                          <p className="text-[10px] uppercase tracking-widest text-(--pk-text-mute)">
                            Nominal
                          </p>
                          <p className="mt-1 font-mono text-xs font-medium text-(--pk-text)">
                            Rp {txn.amount_rupiah.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <div className="rounded-lg border border-(--pk-line) bg-[#0b1626]/60 p-2.5">
                          <p className="text-[10px] uppercase tracking-widest text-(--pk-text-mute)">
                            Metode
                          </p>
                          <p className="mt-1 font-mono text-xs text-(--pk-text-dim)">
                            {txn.payment_method}
                          </p>
                        </div>
                      </div>

                      {txn.status === "success" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void processRefund(txn.id)
                          }}
                          disabled={isProcessing}
                          className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#f87171]/40 bg-[#f87171]/10 px-3 text-xs font-medium text-[#fca5a5] transition-colors hover:bg-[#f87171]/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isProcessing ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <>
                              <RotateCcw size={12} />
                              Proses Refund
                            </>
                          )}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>

              <div className="border-t border-(--pk-line) px-5 py-3 text-xs text-(--pk-text-mute)">
                Menampilkan {filtered.length} dari {txns.length} transaksi
              </div>
            </>
          )}
        </div>
      </div>

      {selectedTxn && (
        <TransactionDetailModal
          txn={selectedTxn}
          onClose={() => setSelectedTxn(null)}
        />
      )}
    </div>
  )
}

function TransactionDetailModal({
  txn,
  onClose,
}: {
  txn: Transaction
  onClose: () => void
}) {
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onEsc)
    return () => {
      document.body.style.overflow = original
      document.removeEventListener("keydown", onEsc)
    }
  }, [onClose])

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Order ID",
      value: (
        <span className="font-mono text-xs text-(--pk-text)">
          {txn.order_id}
        </span>
      ),
    },
    {
      label: "User ID",
      value: (
        <span className="font-mono text-[11px] text-(--pk-text-dim)">
          {txn.user_id}
        </span>
      ),
    },
    {
      label: "Nominal",
      value: (
        <span className="font-mono text-sm font-semibold text-(--pk-accent)">
          Rp {txn.amount_rupiah.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      label: "Metode",
      value: (
        <span className="inline-flex items-center rounded-full border border-(--pk-line-2) bg-[#0b1626] px-2.5 py-0.5 text-[10px] font-medium text-(--pk-text-dim)">
          {txn.payment_method}
        </span>
      ),
    },
    {
      label: "Status",
      value: (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${statusTone(
            txn.status
          )}`}
        >
          {statusIcon(txn.status)}
          {statusLabel(txn.status)}
        </span>
      ),
    },
    {
      label: "Pakasir TX ID",
      value: (
        <span className="font-mono text-[11px] text-(--pk-text-dim)">
          {txn.pakasir_tx_id || "—"}
        </span>
      ),
    },
    {
      label: "Dibuat",
      value: (
        <span className="font-mono text-xs text-(--pk-text-dim)">
          {new Date(txn.created_at).toLocaleString("id-ID")}
        </span>
      ),
    },
    ...(txn.paid_at
      ? [
          {
            label: "Dibayar",
            value: (
              <span className="font-mono text-xs text-[#6ee7b7]">
                {new Date(txn.paid_at).toLocaleString("id-ID")}
              </span>
            ),
          },
        ]
      : []),
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="txn-modal-title"
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="pk-panel pk-menu-in relative max-h-[90vh] w-full max-w-md overflow-y-auto p-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-(--pk-text-mute) transition-colors hover:bg-white/5 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
          <Receipt size={20} className="text-(--pk-accent)" />
        </div>

        <h2
          id="txn-modal-title"
          className="mt-4 text-lg font-semibold text-(--pk-text)"
        >
          Detail Transaksi
        </h2>
        <p className="mt-2 text-sm text-(--pk-text-dim)">
          Informasi lengkap transaksi pembayaran.
        </p>

        <dl className="mt-5 space-y-3 text-sm">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-4 border-b border-(--pk-line) pb-3 last:border-0 last:pb-0"
            >
              <dt className="shrink-0 text-xs text-(--pk-text-mute)">
                {row.label}
              </dt>
              <dd className="text-right">{row.value}</dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          onClick={onClose}
          className="pk-btn-ghost mt-6 inline-flex min-h-10 w-full items-center justify-center px-4 text-sm font-medium"
        >
          Tutup
        </button>
      </div>
    </div>
  )
}