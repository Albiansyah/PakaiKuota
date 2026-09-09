"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container, PageHeader } from "@/components/layout"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  History,
  Download,
  RefreshCw,
  Loader2,
  FileText,
} from "lucide-react"

type Transaction = {
  id: string
  order_id: string
  amount_rupiah: number
  status: string
  created_at: string
  paid_at?: string
}

export default function HistoryPage() {
  const { t } = useLanguage()
  const [txns, setTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/transactions")
      const data = await res.json()
      setTxns(data.transactions ?? [])
    } catch (err) {
      console.error("Failed to fetch transactions:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => { fetchTransactions() }, 0)
    return () => clearTimeout(timer)
  }, [])

  const requestRefund = async (id: string) => {
    const reason = prompt("Alasan refund?") ?? ""
    if (!reason) return

    const res = await fetch("/api/refund", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId: id, reason }),
    })

    if (res.ok) {
      alert("Refund berhasil diajukan")
    } else {
      alert("Gagal mengajukan refund")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="success">{t("common.success_status")}</Badge>
      case "pending":
        return <Badge variant="warning">{t("common.pending")}</Badge>
      case "failed":
        return <Badge variant="destructive">{t("common.failed_status")}</Badge>
      case "expired":
        return <Badge variant="secondary">{t("common.expired")}</Badge>
      case "refunded":
        return <Badge variant="outline">{t("common.refunded")}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    )
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-8">
        <PageHeader
          title={t("history.title")}
          description="Riwayat transaksi top-up saldo"
          className="mb-0"
        />
        <Button variant="outline" size="icon" onClick={fetchTransactions}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {txns.length === 0 ? (
            <div className="text-center py-16">
              <History className="h-16 w-16 mx-auto mb-4 text-[var(--color-muted-foreground)] opacity-50" />
              <p className="text-[var(--color-muted-foreground)]">
                {t("common.no_data")}
              </p>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                Belum ada transaksi
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("history.date")}</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead className="text-right">{t("history.amount")}</TableHead>
                  <TableHead>{t("history.status")}</TableHead>
                  <TableHead className="text-right">{t("history.action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txns.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(txn.created_at).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {txn.order_id}
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">
                      Rp {txn.amount_rupiah.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>{getStatusBadge(txn.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {txn.status === "success" && (
                          <>
                            <Button variant="ghost" size="icon" title="Invoice">
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => requestRefund(txn.id)}
                              className="text-[var(--color-destructive)]"
                            >
                              {t("history.refund")}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}
