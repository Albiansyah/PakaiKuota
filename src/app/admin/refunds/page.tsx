"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Receipt,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react"

type RefundRequest = {
  id: string
  order_id: string
  user_id: string
  email: string
  amount_rupiah: number
  created_at: string
}

export default function AdminRefundsPage() {
  const { user } = useSupabase()
  const router = useRouter()

  const [refunds, setRefunds] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState("")

  const fetchRefunds = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(false)
    try {
      const res = await fetch("/api/admin/refunds")
      if (!res.ok) throw new Error("Unauthorized")
      const data = (await res.json()) as { refunds?: RefundRequest[] }
      setRefunds(data.refunds ?? [])
    } catch (err) {
      console.error("Failed to fetch refunds:", err)
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
    void fetchRefunds()
  }, [user, router, fetchRefunds])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return refunds
    return refunds.filter(
      (r) =>
        r.order_id.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
    )
  }, [refunds, query])

  const stats = useMemo(() => {
    const total = refunds.length
    const amount = refunds.reduce((s, r) => s + r.amount_rupiah, 0)
    return { total, amount }
  }, [refunds])

  async function processRefund(id: string, action: "refund" | "reject") {
    if (action === "reject" && !confirm("Tolak permintaan refund ini?")) return
    if (action === "refund" && !confirm("Proses refund untuk transaksi ini?"))
      return
    setProcessing(id)
    try {
      if (action === "reject") {
        setRefunds((prev) => prev.filter((r) => r.id !== id))
        return
      }
      const response = await fetch(`/api/admin/refunds/${id}/approve`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Refund gagal diproses")
      setRefunds((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error("Failed to process refund:", err)
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-screen text-(--pk-text)">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2
            size={24}
            className="animate-spin text-(--pk-text-mute)"
          />
        </div>
      </div>
    )
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
                Antrian Refund
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-(--pk-text-dim)">
                Permintaan refund yang perlu diproses.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchRefunds(true)}
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
              Data refund tidak bisa dimuat.
            </p>
            <button
              type="button"
              onClick={() => void fetchRefunds()}
              className="pk-btn-ghost mt-4 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
            >
              Coba lagi
            </button>
          </div>
        )}

        {!error && refunds.length > 0 && (
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="pk-panel pk-inview p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Total permintaan
                </p>
                <Receipt size={14} className="text-(--pk-text-mute)" />
              </div>
              <p className="mt-3 font-mono text-2xl">{stats.total}</p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Menunggu diproses
              </p>
            </div>

            <div className="pk-panel pk-inview p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Total nilai
                </p>
                <span className="h-1.5 w-1.5 rounded-full bg-(--pk-accent)" />
              </div>
              <p className="mt-3 font-mono text-2xl text-(--pk-accent)">
                Rp {stats.amount.toLocaleString("id-ID")}
              </p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Akumulasi nominal refund
              </p>
            </div>

            <div className="pk-panel pk-inview p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Status
                </p>
                <AlertTriangle size={14} className="text-[#fbbf24]" />
              </div>
              <p className="mt-3 font-mono text-2xl text-[#fbbf24]">
                Pending
              </p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Perlu tindakan admin
              </p>
            </div>
          </section>
        )}

        {!error && refunds.length > 0 && (
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-xs text-(--pk-text-mute)">
              {filtered.length} dari {refunds.length} permintaan
            </p>
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
                placeholder="Cari order ID atau email..."
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

        {!error && refunds.length === 0 && (
          <div className="pk-panel pk-inview p-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-(--pk-line-2) bg-[#0b1626]">
              <CheckCircle2 size={22} className="text-[#6ee7b7]" />
            </span>
            <p className="mt-5 font-semibold">Tidak ada permintaan refund</p>
            <p className="mt-2 text-sm text-(--pk-text-dim)">
              Semua permintaan sudah diproses. Cek kembali nanti.
            </p>
          </div>
        )}

        {!error && refunds.length > 0 && filtered.length === 0 && (
          <div className="pk-panel pk-inview p-12 text-center">
            <p className="font-semibold">Tidak ada refund yang cocok.</p>
            <p className="mt-2 text-sm text-(--pk-text-dim)">
              Coba ubah kata kunci pencarian.
            </p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="pk-btn-ghost mt-5 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
            >
              Reset pencarian
            </button>
          </div>
        )}

        {!error && filtered.length > 0 && (
          <ul className="space-y-3">
            {filtered.map((r) => {
              const isProcessing = processing === r.id
              return (
                <li
                  key={r.id}
                  className="pk-panel pk-inview flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#fbbf24]/30 bg-[#fbbf24]/10">
                      <AlertTriangle size={16} className="text-[#fbbf24]" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-medium text-(--pk-text)">
                        {r.order_id}
                      </p>
                      <p className="mt-1 truncate text-xs text-(--pk-text-dim)">
                        {r.email}
                        <span className="mx-2 text-(--pk-text-mute)">·</span>
                        {new Date(r.created_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                    <p className="font-mono text-sm font-semibold text-(--pk-accent)">
                      Rp {r.amount_rupiah.toLocaleString("id-ID")}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void processRefund(r.id, "reject")}
                        disabled={isProcessing}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#f87171]/40 bg-[#f87171]/10 px-3 text-xs font-medium text-[#fca5a5] transition-colors hover:bg-[#f87171]/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isProcessing ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <>
                            <XCircle size={13} />
                            Tolak
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => void processRefund(r.id, "refund")}
                        disabled={isProcessing}
                        className="pk-btn-primary inline-flex min-h-9 items-center gap-1.5 px-3 text-xs disabled:cursor-wait disabled:opacity-60"
                      >
                        {isProcessing ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 size={13} />
                            Proses Refund
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}