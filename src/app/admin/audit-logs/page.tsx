"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout"
import {
  Shield,
  RefreshCw,
  Loader2,
  Filter,
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

export default function AdminAuditLogsPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    if (!user) { router.push("/login"); return }
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/admin/audit")
        if (!res.ok) throw new Error("Unauthorized")
        const data = await res.json()
        setLogs(data.logs ?? [])
      } catch (err) {
        console.error("Failed to fetch audit logs:", err)
      }
      setLoading(false)
    }
    fetchLogs()
  }, [user, router])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/audit")
      if (!res.ok) throw new Error("Unauthorized")
      const data = await res.json()
      setLogs(data.logs ?? [])
    } catch (err) {
      console.error("Failed to fetch audit logs:", err)
    }
    setLoading(false)
  }

  const filteredLogs = filter === "all"
    ? logs
    : logs.filter((l) => l.action.startsWith(filter))

  const actionBadge = (action: string) => {
    if (action.startsWith("refund")) return "destructive"
    if (action.startsWith("suspend") || action.startsWith("delete")) return "warning"
    if (action.startsWith("create") || action.startsWith("update")) return "default"
    return "secondary"
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-[var(--accent)]" />
          <div>
            <h1 className="text-3xl font-bold">Audit Log</h1>
            <p className="text-[var(--color-muted-foreground)]">
              Riwayat aktivitas admin (read-only)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border bg-[var(--color-muted)] text-[var(--color-foreground)] text-sm"
          >
            <option value="all">Semua</option>
            <option value="user">User</option>
            <option value="transaction">Transaksi</option>
            <option value="refund">Refund</option>
            <option value="model">Model</option>
            <option value="markup">Markup</option>
          </select>
          <Button variant="outline" size="icon" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Waktu</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Admin</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Aksi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Target</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Detail</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-[var(--color-muted-foreground)]" />
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-[var(--color-muted-foreground)]">
                      Belum ada audit log
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="px-4 py-3 text-sm font-mono whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-sm">{log.admin_email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={actionBadge(log.action)}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {log.target_type}
                        {log.target_id && (
                          <span className="text-[var(--color-muted-foreground)]"> / {log.target_id.slice(0, 8)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--color-muted-foreground)] max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : "-"}
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
