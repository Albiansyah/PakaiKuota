"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout"
import {
  Scale,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

type ReconciliationLog = {
  id: string
  source: string
  expected_amount: number
  actual_amount: number
  difference: number
  status: string
  notes: string | null
  created_at: string
}

export default function AdminReconciliationPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [logs, setLogs] = useState<ReconciliationLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push("/login"); return }
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/reconcile")
        if (!res.ok) throw new Error("Unauthorized")
        const data = await res.json()
        setLogs(data.logs ?? [])
      } catch (err) {
        console.error("Failed to fetch reconciliation logs:", err)
      } finally {
        setLoading(false)
      }
    })()
  }, [user, router])

  // fetchLogs removed

  const statusBadge = (status: string) => {
    switch (status) {
      case "ok": return "default"
      case "alert": return "destructive"
      case "resolved": return "secondary"
      default: return "default"
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "ok": return <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
      case "alert": return <AlertCircle className="h-4 w-4 text-[var(--color-destructive)]" />
      default: return <Scale className="h-4 w-4 text-[var(--color-muted-foreground)]" />
    }
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Scale className="h-8 w-8 text-[var(--accent)]" />
          <div>
            <h1 className="text-3xl font-bold">Rekonsiliasi</h1>
            <p className="text-[var(--color-muted-foreground)]">
              Log pencocokan data internal vs upstream
            </p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={() => location.reload()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Waktu</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Sumber</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Expected</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Actual</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Selisih</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-[var(--color-muted-foreground)]" />
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-[var(--color-muted-foreground)]">
                      Belum ada log rekonsiliasi
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="px-4 py-3 text-sm font-mono whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-sm">{log.source}</td>
                      <td className="px-4 py-3 text-sm font-mono text-right">
                        Rp {log.expected_amount.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-right">
                        Rp {log.actual_amount.toLocaleString("id-ID")}
                      </td>
                      <td className={`px-4 py-3 text-sm font-mono text-right font-bold ${log.difference !== 0 ? "text-[var(--color-destructive)]" : "text-[var(--color-success)]"}`}>
                        {log.difference >= 0 ? "+" : ""}Rp {log.difference.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {statusIcon(log.status)}
                          <Badge variant={statusBadge(log.status)}>{log.status}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--color-muted-foreground)] max-w-xs truncate">
                        {log.notes ?? "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Container>
  )
}
