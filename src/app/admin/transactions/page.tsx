"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Container, Grid } from "@/components/layout"
import {
  Receipt,
  RefreshCw,
  DollarSign,
  Loader2,
  Filter,
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

export default function AdminTransactionsPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [txns, setTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null)

  useEffect(() => {
    if (!user) { router.push("/login"); return }
    ;(async () => {
      try {
        const res = await fetch("/api/admin/transactions")
        if (!res.ok) throw new Error("Unauthorized")
        const data = await res.json()
        setTxns(data.transactions ?? [])
      } catch (err) {
        console.error("Failed to fetch transactions:", err)
      } finally {
        setLoading(false)
      }
    })()
  }, [user, router])

  // fetchTransactions removed

  const processRefund = async (id: string) => {
    if (!confirm("Proses refund untuk transaksi ini?")) return
    setActionLoading(id)
    try {
      await fetch("/api/admin/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: id, action: "refund" }),
      })
      setTxns((prev) => prev.map((t) => t.id === id ? { ...t, status: "refunded" } : t))
    } catch (err) {
      console.error("Failed to process refund:", err)
    }
    setActionLoading(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success": return <Badge variant="success">Berhasil</Badge>
      case "pending": return <Badge variant="warning">Menunggu</Badge>
      case "failed": return <Badge variant="destructive">Gagal</Badge>
      case "expired": return <Badge variant="secondary">Kadaluarsa</Badge>
      case "refunded": return <Badge variant="outline">Di-refund</Badge>
      case "refund_requested": return <Badge variant="warning">Refund Diminta</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filtered = statusFilter === "all" ? txns : txns.filter((t) => t.status === statusFilter)

  const totalSuccess = txns.filter((t) => t.status === "success").reduce((s, t) => s + t.amount_rupiah, 0)
  const totalRefund = txns.filter((t) => t.status === "refunded").reduce((s, t) => s + t.amount_rupiah, 0)
  const pendingCount = txns.filter((t) => t.status === "pending").length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Receipt className="h-8 w-8 text-[var(--accent)]" />
          <h1 className="text-3xl font-bold">Transaksi</h1>
        </div>
        <Button variant="outline" size="icon" onClick={() => location.reload()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary */}
      <Grid cols={3} gap="md" className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-success)]/10">
                <DollarSign className="h-6 w-6 text-[var(--color-success)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-muted-foreground)]">Total Berhasil</p>
                <p className="text-2xl font-bold font-mono">Rp {totalSuccess.toLocaleString("id-ID")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-destructive)]/10">
                <Receipt className="h-6 w-6 text-[var(--color-destructive)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-muted-foreground)]">Di-refund</p>
                <p className="text-2xl font-bold font-mono">Rp {totalRefund.toLocaleString("id-ID")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-warning)]/10">
                <Filter className="h-6 w-6 text-[var(--color-warning)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-muted-foreground)]">Pending</p>
                <p className="text-2xl font-bold font-mono">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        {["all", "success", "pending", "failed", "refunded", "refund_requested"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
            }`}
          >
            {s === "all" ? "Semua" : s === "success" ? "Berhasil" : s === "pending" ? "Menunggu" : s === "failed" ? "Gagal" : s === "refunded" ? "Di-refund" : "Refund Diminta"}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-muted-foreground)]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-[var(--color-muted-foreground)]">
              Tidak ada transaksi
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">User</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Nominal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Metode</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Tanggal</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((txn) => (
                    <tr key={txn.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-muted)]/50 cursor-pointer" onClick={() => setSelectedTxn(txn)}>
                      <td className="px-4 py-3 font-mono text-xs">{txn.order_id}</td>
                      <td className="px-4 py-3 font-mono text-xs">{txn.user_id.slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-right font-medium font-mono">Rp {txn.amount_rupiah.toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{txn.payment_method}</Badge></td>
                      <td className="px-4 py-3">{getStatusBadge(txn.status)}</td>
                      <td className="px-4 py-3 text-[var(--color-muted-foreground)] text-sm whitespace-nowrap">
                        {new Date(txn.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {txn.status === "success" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); processRefund(txn.id) }}
                            disabled={actionLoading === txn.id}
                            className="text-[var(--color-destructive)]"
                          >
                            {actionLoading === txn.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refund"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedTxn(null)}>
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Detail Transaksi</h2>
              <button onClick={() => setSelectedTxn(null)}>
                <span className="text-[var(--color-muted-foreground)]">&times;</span>
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">Order ID</span>
                <span className="font-mono">{selectedTxn.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">User ID</span>
                <span className="font-mono text-xs">{selectedTxn.user_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">Nominal</span>
                <span className="font-mono font-bold">Rp {selectedTxn.amount_rupiah.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">Metode</span>
                <span>{selectedTxn.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">Status</span>
                {getStatusBadge(selectedTxn.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">Pakasir TX ID</span>
                <span className="font-mono text-xs">{selectedTxn.pakasir_tx_id || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">Dibuat</span>
                <span className="font-mono">{new Date(selectedTxn.created_at).toLocaleString("id-ID")}</span>
              </div>
              {selectedTxn.paid_at && (
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted-foreground)]">Dibayar</span>
                  <span className="font-mono">{new Date(selectedTxn.paid_at).toLocaleString("id-ID")}</span>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full mt-6" onClick={() => setSelectedTxn(null)}>Tutup</Button>
          </div>
        </div>
      )}
    </div>
  )
}
