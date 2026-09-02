"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Container, Grid } from "@/components/layout"
import {
  Receipt,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
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
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { router.push("/login"); return }
    fetchRefunds()
  }, [user, router])

  const fetchRefunds = async () => {
    try {
      const res = await fetch("/api/admin/transactions")
      if (!res.ok) throw new Error("Unauthorized")
      const data = await res.json()
      const refundRequests = (data.transactions ?? []).filter(
        (t: { status: string }) => t.status === "refund_requested"
      )
      setRefunds(refundRequests)
    } catch (err) {
      console.error("Failed to fetch refunds:", err)
    }
    setLoading(false)
  }

  const processRefund = async (id: string, action: "refund" | "reject") => {
    if (action === "reject" && !confirm("Tolak permintaan refund ini?")) return
    if (action === "refund" && !confirm("Proses refund untuk transaksi ini?")) return
    setProcessing(id)

    try {
      await fetch("/api/admin/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: id,
          action: action === "refund" ? "refund" : "reject_refund",
        }),
      })
      setRefunds((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error("Failed to process refund:", err)
    }
    setProcessing(null)
  }

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-muted-foreground)]" />
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Receipt className="h-8 w-8 text-[var(--color-warning)]" />
          <div>
            <h1 className="text-3xl font-bold">Antrian Refund</h1>
            <p className="text-[var(--color-muted-foreground)]">
              Permintaan refund yang perlu diproses
            </p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={fetchRefunds}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {refunds.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-[var(--color-success)] opacity-50" />
            <p className="text-[var(--color-muted-foreground)]">
              Tidak ada permintaan refund
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {refunds.map((r) => (
            <Card key={r.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-warning)]/10">
                      <AlertTriangle className="h-5 w-5 text-[var(--color-warning)]" />
                    </div>
                    <div>
                      <p className="font-mono text-sm">{r.order_id}</p>
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        {r.email} &middot; {new Date(r.created_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold font-mono">
                      Rp {r.amount_rupiah.toLocaleString("id-ID")}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[var(--color-destructive)]"
                        onClick={() => processRefund(r.id, "reject")}
                        disabled={processing === r.id}
                      >
                        {processing === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Tolak
                          </>
                        )}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => processRefund(r.id, "refund")}
                        disabled={processing === r.id}
                      >
                        {processing === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Proses Refund"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Container>
  )
}
