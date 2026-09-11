"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react"

/* ============================================================
   TYPES
   ============================================================ */

type Transaction = {
  id: string
  user_id: string
  order_id: string
  amount_rupiah: number
  status: string
  payment_method: string | null
  payment_number: string | null
  total_payment: number | null
  pakasir_tx_id: string | null
  created_at: string
  paid_at: string | null
  updated_at: string | null
}

type StatusFilter =
  | "all"
  | "awaiting_verification"
  | "pending"
  | "success"
  | "failed"
  | "expired"

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "awaiting_verification", label: "Perlu Verify" },
  { value: "pending", label: "Menunggu Bayar" },
  { value: "success", label: "Berhasil" },
  { value: "failed", label: "Gagal" },
  { value: "expired", label: "Kadaluarsa" },
]

/* ============================================================
   HELPERS
   ============================================================ */

function statusTone(status: string) {
  switch (status) {
    case "success":
      return "border-[#34d399]/30 bg-[#34d399]/10 text-[#6ee7b7]"
    case "awaiting_verification":
      return "border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#fcd34d]"
    case "pending":
      return "border-[#7dd3fc]/30 bg-[#7dd3fc]/10 text-[#7dd3fc]"
    case "failed":
      return "border-[#f87171]/30 bg-[#f87171]/10 text-[#fca5a5]"
    case "expired":
      return "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-mute)"
    default:
      return "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim)"
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "success":
      return "Berhasil"
    case "awaiting_verification":
      return "Perlu Verify"
    case "pending":
      return "Menunggu Bayar"
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
      return <CheckCircle2 size={12} />
    case "awaiting_verification":
      return <ShieldCheck size={12} />
    case "pending":
      return <Clock size={12} />
    case "failed":
      return <XCircle size={12} />
    case "refunded":
      return <RotateCcw size={12} />
    case "refund_requested":
      return <AlertTriangle size={12} />
    default:
      return null
  }
}

function paymentMethodLabel(method: string | null) {
  if (!method) return "—"
  if (method === "gopay_qris") return "GoPay QRIS"
  if (method === "pakasir") return "Pakasir"
  return method
}

function shortRupiah(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(2)} M`
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} jt`
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)} rb`
  return `Rp ${value}`
}

/* ============================================================
   PAGE
   ============================================================ */

export default function AdminTransactionsPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [txns, setTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => {
    const urlFilter = searchParams.get("filter")
    if (urlFilter === "awaiting_verification") return "awaiting_verification"
    return "all"
  })
  const [query, setQuery] = useState("")
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null)

  // Sync filter dari URL
  useEffect(() => {
    const urlFilter = searchParams.get("filter")
    if (urlFilter === "awaiting_verification") {
      setStatusFilter("awaiting_verification")
    }
  }, [searchParams])

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
          (t.payment_method ?? "").toLowerCase().includes(q) ||
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
    const awaitingCount = txns.filter(
      (t) => t.status === "awaiting_verification"
    ).length
    return {
      totalSuccess,
      totalRefund,
      pendingCount,
      awaitingCount,
      total: txns.length,
    }
  }, [txns])

  /* ============================================================
     Verify & Credit
     ============================================================ */
  async function verifyAndCredit(txn: Transaction) {
    const confirmed = confirm(
      `Verifikasi pembayaran ini?\n\n` +
        `Order: ${txn.order_id}\n` +
        `Nominal: Rp ${txn.amount_rupiah.toLocaleString("id-ID")}\n` +
        `Metode: ${paymentMethodLabel(txn.payment_method)}\n\n` +
        `Pastikan pembayaran SUDAH masuk ke akun GoPay Merchant Anda sebelum konfirmasi.\n\n` +
        `Aksi ini akan langsung mengkredit saldo user.`
    )
    if (!confirmed) return

    setActionLoading(txn.id)
    try {
      const res = await fetch(
        "/api/admin/transactions/verify-and-credit",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: txn.order_id }),
        }
      )
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        amount?: number
      }

      if (!res.ok || !data.ok) {
        const errCode = data.error ?? "verify_failed"
        const errMessage =
          errCode === "ALREADY_CREDITED"
            ? "Transaksi ini sudah dikredit sebelumnya."
            : errCode === "INVALID_STATUS"
              ? "Status transaksi tidak valid untuk verifikasi."
              : errCode === "ORDER_NOT_FOUND"
                ? "Transaksi tidak ditemukan."
                : "Gagal memverifikasi pembayaran."
        toast.error(errMessage)
        void fetchTransactions(true)
        return
      }

      const amount = data.amount ?? txn.amount_rupiah
      toast.success(
        `Terverifikasi! Saldo user +Rp ${amount.toLocaleString("id-ID")}`
      )
      void fetchTransactions(true)
      setSelectedTxn((prev) =>
        prev && prev.id === txn.id
          ? { ...prev, status: "success", paid_at: new Date().toISOString() }
          : prev
      )
    } catch (err) {
      console.error("Failed to verify:", err)
      toast.error("Gagal memverifikasi pembayaran")
    } finally {
      setActionLoading(null)
    }
  }

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
      {/* ============================================================
          HEADER
          ============================================================ */}
      <header className="border-b border-(--pk-line) bg-[#070f1e]/60 px-4 py-6 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-(--pk-accent) sm:text-xs">
                Admin tool
              </p>
              <h1 className="mt-2 flex items-center gap-2.5 text-2xl font-semibold tracking-[-0.035em] sm:gap-3 sm:text-3xl">
                <Receipt size={22} className="shrink-0 text-(--pk-accent) sm:hidden" />
                <Receipt size={26} className="hidden shrink-0 text-(--pk-accent) sm:block" />
                Transaksi
              </h1>
              <p className="mt-1.5 max-w-xl text-xs leading-5 text-(--pk-text-dim) sm:text-sm">
                Riwayat dan status semua transaksi pembayaran.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchTransactions(true)}
              disabled={refreshing}
              aria-label="Refresh"
              className="pk-btn-ghost inline-flex h-10 w-10 shrink-0 items-center justify-center disabled:opacity-60"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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

        {/* ============================================================
            STAT CARDS — 2 kolom mobile, 3 tablet, 5 desktop
            ============================================================ */}
        {!error && !loading && txns.length > 0 && (
          <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              label="Total"
              value={String(stats.total)}
              hint="Semua status"
              icon={<Receipt size={13} />}
              iconClass="text-(--pk-text-mute)"
            />
            <StatCard
              label="Berhasil"
              value={shortRupiah(stats.totalSuccess)}
              hint="Akumulasi sukses"
              icon={<DollarSign size={13} />}
              iconClass="text-[#6ee7b7]"
              valueClass="text-[#6ee7b7]"
            />
            <StatCard
              label="Perlu Verify"
              value={String(stats.awaitingCount)}
              hint={stats.awaitingCount > 0 ? "Segera proses" : "Tidak ada"}
              icon={<ShieldCheck size={13} />}
              iconClass="text-[#fcd34d]"
              valueClass="text-[#fcd34d]"
              highlight={stats.awaitingCount > 0}
            />
            <StatCard
              label="Di-refund"
              value={shortRupiah(stats.totalRefund)}
              hint="Akumulasi refund"
              icon={<RotateCcw size={13} />}
              iconClass="text-[#fca5a5]"
              valueClass="text-[#fca5a5]"
            />
            <StatCard
              label="Menunggu Bayar"
              value={String(stats.pendingCount)}
              hint={stats.pendingCount > 0 ? "Belum dibayar" : "Tidak ada"}
              icon={<Clock size={13} />}
              iconClass="text-[#7dd3fc]"
              valueClass="text-[#7dd3fc]"
            />
          </section>
        )}

        {/* ============================================================
            FILTER BAR — search full width di atas, tabs full width di bawah
            ============================================================ */}
        {!error && !loading && txns.length > 0 && (
          <div className="mb-4 space-y-3">
            {/* Search full width */}
            <div className="relative w-full">
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
                placeholder="Cari order ID, user, metode, atau pakasir TX ID..."
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

            {/* Tabs full width — grid supaya sama lebar & mengikuti search */}
            <div
              role="group"
              aria-label="Filter status"
              className="grid grid-cols-2 gap-1 rounded-xl border border-(--pk-line-2) bg-[#0b1626] p-1 sm:grid-cols-3 lg:grid-cols-6"
            >
              {statusFilters.map((item) => {
                const active = statusFilter === item.value
                const count =
                  item.value === "all"
                    ? txns.length
                    : txns.filter((t) => t.status === item.value).length
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setStatusFilter(item.value)}
                    aria-pressed={active}
                    className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-all ${
                      active
                        ? "bg-linear-to-r from-[#ffc266] to-[#f0a93b] text-[#10192b] shadow-[0_6px_18px_-8px_rgba(240,169,59,0.9)]"
                        : "text-(--pk-text-dim) hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    <span
                      className={`inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 font-mono text-[9px] font-semibold ${
                        active
                          ? "bg-[#10192b]/15 text-[#10192b]"
                          : "bg-white/5 text-(--pk-text-mute)"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Counter */}
            <div className="flex items-center justify-end text-xs text-(--pk-text-mute)">
              <span className="font-mono">{filtered.length}</span>
              <span className="mx-1.5">dari</span>
              <span className="font-mono">{txns.length}</span>
              <span className="ml-1.5">transaksi</span>
            </div>
          </div>
        )}

        {/* ============================================================
            TABLE / LIST
            ============================================================ */}
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
            <EmptyState
              icon={<Receipt size={22} className="text-(--pk-text-mute)" />}
              title="Belum ada transaksi"
              subtitle="Transaksi akan muncul di sini setelah user melakukan pembayaran."
            />
          )}

          {!loading && txns.length > 0 && filtered.length === 0 && (
            <EmptyState
              icon={<Search size={22} className="text-(--pk-text-mute)" />}
              title={
                statusFilter === "awaiting_verification"
                  ? "Tidak ada transaksi yang perlu di-verify"
                  : "Tidak ada transaksi yang cocok"
              }
              subtitle={
                statusFilter === "awaiting_verification"
                  ? "Semua transaksi sudah diproses. Cek lagi nanti."
                  : "Coba ubah kata kunci atau filter status."
              }
              action={
                <button
                  type="button"
                  onClick={() => {
                    setQuery("")
                    setStatusFilter("all")
                  }}
                  className="pk-btn-ghost mt-4 inline-flex min-h-9 items-center justify-center px-4 text-xs font-medium"
                >
                  Reset filter
                </button>
              }
            />
          )}

          {!loading && filtered.length > 0 && (
            <>
              {/* Desktop table */}
              <div className="pk-scroll hidden overflow-x-auto lg:block">
                <table className="w-full min-w-5xl text-left text-sm">
                  <thead className="border-b border-(--pk-line) text-(--pk-text-mute)">
                    <tr>
                      <Th>Order ID</Th>
                      <Th>User</Th>
                      <Th align="right">Nominal</Th>
                      <Th>Metode</Th>
                      <Th>Status</Th>
                      <Th>Tanggal</Th>
                      <Th align="right">Aksi</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((txn) => {
                      const isProcessing = actionLoading === txn.id
                      const needsVerification =
                        txn.status === "awaiting_verification"
                      return (
                        <tr
                          key={txn.id}
                          onClick={() => setSelectedTxn(txn)}
                          className={`cursor-pointer border-b border-(--pk-line) transition-colors last:border-0 ${
                            needsVerification
                              ? "bg-[#fbbf24]/5 hover:bg-[#fbbf24]/10"
                              : "hover:bg-white/2"
                          }`}
                        >
                          <td className="px-4 py-3 font-mono text-xs font-medium text-(--pk-text)">
                            {txn.order_id}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-(--pk-text-dim)">
                            {txn.user_id.slice(0, 8)}…
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs font-medium text-(--pk-text)">
                            Rp {txn.amount_rupiah.toLocaleString("id-ID")}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-full border border-(--pk-line-2) bg-[#0b1626] px-2 py-0.5 text-[10px] font-medium text-(--pk-text-dim)">
                              {paymentMethodLabel(txn.payment_method)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone(
                                txn.status
                              )}`}
                            >
                              {statusIcon(txn.status)}
                              {statusLabel(txn.status)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-(--pk-text-dim)">
                            {new Date(txn.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {needsVerification && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    void verifyAndCredit(txn)
                                  }}
                                  disabled={isProcessing}
                                  className="inline-flex min-h-7 items-center gap-1 rounded-lg border border-[#34d399]/40 bg-[#34d399]/10 px-2.5 text-[10px] font-medium text-[#6ee7b7] transition-colors hover:bg-[#34d399]/20 disabled:cursor-wait disabled:opacity-60"
                                >
                                  {isProcessing ? (
                                    <Loader2
                                      size={10}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <>
                                      <ShieldCheck size={10} />
                                      Verify &amp; Credit
                                    </>
                                  )}
                                </button>
                              )}
                              {txn.status === "success" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    void processRefund(txn.id)
                                  }}
                                  disabled={isProcessing}
                                  className="inline-flex min-h-7 items-center gap-1 rounded-lg border border-[#f87171]/40 bg-[#f87171]/10 px-2 text-[10px] font-medium text-[#fca5a5] transition-colors hover:bg-[#f87171]/20 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isProcessing ? (
                                    <Loader2
                                      size={10}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <>
                                      <RotateCcw size={10} />
                                      Refund
                                    </>
                                  )}
                                </button>
                              )}
                              {!needsVerification &&
                                txn.status !== "success" && (
                                  <span className="text-[10px] text-(--pk-text-mute)">
                                    —
                                  </span>
                                )}
                            </div>
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
                  const needsVerification =
                    txn.status === "awaiting_verification"
                  return (
                    <li
                      key={txn.id}
                      className={`cursor-pointer p-4 transition-colors ${
                        needsVerification
                          ? "bg-[#fbbf24]/5 active:bg-[#fbbf24]/10"
                          : "active:bg-white/5"
                      }`}
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

                      <div className="mt-3 grid grid-cols-2 gap-2.5">
                        <div className="rounded-lg border border-(--pk-line) bg-[#0b1626]/60 p-2.5">
                          <p className="text-[9px] uppercase tracking-widest text-(--pk-text-mute)">
                            Nominal
                          </p>
                          <p className="mt-0.5 font-mono text-xs font-medium text-(--pk-text)">
                            Rp {txn.amount_rupiah.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <div className="rounded-lg border border-(--pk-line) bg-[#0b1626]/60 p-2.5">
                          <p className="text-[9px] uppercase tracking-widest text-(--pk-text-mute)">
                            Metode
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-(--pk-text-dim)">
                            {paymentMethodLabel(txn.payment_method)}
                          </p>
                        </div>
                      </div>

                      {(needsVerification || txn.status === "success") && (
                        <div className="mt-3 flex flex-col gap-2">
                          {needsVerification && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                void verifyAndCredit(txn)
                              }}
                              disabled={isProcessing}
                              className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#34d399]/40 bg-[#34d399]/10 px-3 text-xs font-medium text-[#6ee7b7] transition-colors active:bg-[#34d399]/20 disabled:cursor-wait disabled:opacity-60"
                            >
                              {isProcessing ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <>
                                  <ShieldCheck size={12} />
                                  Verify &amp; Credit
                                </>
                              )}
                            </button>
                          )}
                          {txn.status === "success" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                void processRefund(txn.id)
                              }}
                              disabled={isProcessing}
                              className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#f87171]/40 bg-[#f87171]/10 px-3 text-xs font-medium text-[#fca5a5] transition-colors active:bg-[#f87171]/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isProcessing ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <>
                                  <RotateCcw size={12} />
                                  Refund
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>

              <div className="border-t border-(--pk-line) px-4 py-3 text-xs text-(--pk-text-mute)">
                Menampilkan {filtered.length} dari {txns.length} transaksi
              </div>
            </>
          )}
        </div>
      </div>

      {selectedTxn && (
        <TransactionDetailModal
          txn={selectedTxn}
          processing={actionLoading === selectedTxn.id}
          onVerify={() => void verifyAndCredit(selectedTxn)}
          onClose={() => setSelectedTxn(null)}
        />
      )}
    </div>
  )
}

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

function StatCard({
  label,
  value,
  hint,
  icon,
  iconClass = "text-(--pk-text-mute)",
  valueClass = "text-(--pk-text)",
  highlight = false,
}: {
  label: string
  value: string
  hint?: string
  icon?: React.ReactNode
  iconClass?: string
  valueClass?: string
  highlight?: boolean
}) {
  return (
    <div className={`pk-panel p-3.5 sm:p-4 ${highlight ? "pk-featured" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[10px] font-medium uppercase tracking-widest text-(--pk-text-mute)">
          {label}
        </p>
        {icon && <span className={iconClass}>{icon}</span>}
      </div>
      <p
        className={`mt-2 truncate font-mono text-xl font-semibold sm:text-2xl ${valueClass}`}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1 truncate text-[10px] text-(--pk-text-mute)">
          {hint}
        </p>
      )}
    </div>
  )
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode
  align?: "left" | "right"
}) {
  return (
    <th
      className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-widest ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  )
}

function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  action?: React.ReactNode
}) {
  return (
    <div className="p-8 text-center sm:p-12">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-(--pk-line-2) bg-[#0b1626] sm:h-14 sm:w-14">
        {icon}
      </span>
      <p className="mt-4 font-semibold sm:mt-5">{title}</p>
      <p className="mt-2 text-sm text-(--pk-text-dim)">{subtitle}</p>
      {action}
    </div>
  )
}

/* ============================================================
   DETAIL MODAL
   ============================================================ */

function TransactionDetailModal({
  txn,
  processing,
  onVerify,
  onClose,
}: {
  txn: Transaction
  processing: boolean
  onVerify: () => void
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

  const needsVerification = txn.status === "awaiting_verification"

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
          {paymentMethodLabel(txn.payment_method)}
        </span>
      ),
    },
    ...(txn.payment_number
      ? [
          {
            label: "No. Pembayaran",
            value: (
              <span className="font-mono text-[11px] text-(--pk-text-dim)">
                {txn.payment_number}
              </span>
            ),
          },
        ]
      : []),
    ...(txn.total_payment
      ? [
          {
            label: "Total Bayar",
            value: (
              <span className="font-mono text-[11px] text-(--pk-text-dim)">
                Rp {txn.total_payment.toLocaleString("id-ID")}
              </span>
            ),
          },
        ]
      : []),
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
    ...(txn.updated_at
      ? [
          {
            label: "Update Terakhir",
            value: (
              <span className="font-mono text-xs text-(--pk-text-dim)">
                {new Date(txn.updated_at).toLocaleString("id-ID")}
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
      className="fixed inset-0 z-60 flex items-end justify-center p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="pk-panel pk-menu-in relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-5 sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-(--pk-text-mute) transition-colors hover:bg-white/5 hover:text-white sm:right-4 sm:top-4"
        >
          <X size={16} />
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626] sm:h-11 sm:w-11">
          <Receipt size={18} className="text-(--pk-accent) sm:hidden" />
          <Receipt size={20} className="hidden text-(--pk-accent) sm:block" />
        </div>

        <h2
          id="txn-modal-title"
          className="mt-4 text-base font-semibold text-(--pk-text) sm:text-lg"
        >
          Detail Transaksi
        </h2>
        <p className="mt-1.5 text-xs text-(--pk-text-dim) sm:mt-2 sm:text-sm">
          Informasi lengkap transaksi pembayaran.
        </p>

        <dl className="mt-4 space-y-2.5 text-sm sm:mt-5 sm:space-y-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-4 border-b border-(--pk-line) pb-2.5 last:border-0 last:pb-0 sm:pb-3"
            >
              <dt className="shrink-0 text-[11px] text-(--pk-text-mute) sm:text-xs">
                {row.label}
              </dt>
              <dd className="text-right">{row.value}</dd>
            </div>
          ))}
        </dl>

        {needsVerification && (
          <div className="mt-4 rounded-xl border border-[#fbbf24]/40 bg-[#fbbf24]/5 p-3 text-[11px] leading-5 text-[#fcd34d] sm:mt-5">
            <strong>Perhatian:</strong> Cek pembayaran di aplikasi GoPay
            Merchant Anda terlebih dahulu. Setelah klik &quot;Verify &amp;
            Credit&quot;, saldo user akan langsung bertambah.
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="pk-btn-ghost inline-flex min-h-10 flex-1 items-center justify-center px-4 text-sm font-medium"
          >
            Tutup
          </button>

          {needsVerification && (
            <button
              type="button"
              onClick={onVerify}
              disabled={processing}
              className="pk-btn-primary inline-flex min-h-10 flex-1 items-center justify-center gap-2 px-4 text-sm disabled:cursor-wait disabled:opacity-60"
            >
              {processing ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <ShieldCheck size={13} />
              )}
              {processing ? "Memverifikasi..." : "Verify & Credit"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}