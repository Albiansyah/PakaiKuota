"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Container, Grid, PageHeader } from "@/components/layout"
import {
  AlertTriangle,
  RefreshCw,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  Clock,
} from "lucide-react"

type AnomalyFlag = {
  user_id: string
  reason: string
  timestamp?: string
}

export default function AdminAnomalyPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [data, setData] = useState<{ flagged: number; flags: AnomalyFlag[] }>({
    flagged: 0,
    flags: [],
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!user) { router.push("/login"); return }
    const fetchAnomalies = async () => {
      try {
        const res = await fetch("/api/admin/anomaly", { method: "POST" })
        const result = await res.json()
        setData(result)
      } catch (err) {
        console.error("Failed to fetch anomalies:", err)
      }
      setLoading(false)
    }
    fetchAnomalies()
  }, [user, router])

  const fetchAnomalies = async () => {
    try {
      const res = await fetch("/api/admin/anomaly", { method: "POST" })
      const result = await res.json()
      setData(result)
    } catch (err) {
      console.error("Failed to fetch anomalies:", err)
    }
    setLoading(false)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnomalies()
    setRefreshing(false)
  }

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "cost_spike":
        return { label: "Cost Spike", color: "destructive" as const }
      case "many_ips":
        return { label: "Multiple IPs", color: "warning" as const }
      case "suspicious_pattern":
        return { label: "Suspicious Pattern", color: "warning" as const }
      default:
        return { label: reason, color: "secondary" as const }
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
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-[var(--color-warning)]" />
          <div>
            <h1 className="text-3xl font-bold">Anomali Usage</h1>
            <p className="text-[var(--color-muted-foreground)]">
              Deteksi pattern mencurigakan
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <Separator className="mb-8" />

      {/* Summary Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Ringkasan</CardTitle>
        </CardHeader>
        <CardContent>
          <Grid cols={3} gap="sm">
            <div className="flex items-center gap-3 p-4 bg-[var(--color-muted)] rounded-lg">
              <ShieldAlert className="h-8 w-8 text-[var(--color-destructive)]" />
              <div>
                <p className="text-2xl font-bold">{data.flagged}</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Total Flagged
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[var(--color-muted)] rounded-lg">
              <AlertTriangle className="h-8 w-8 text-[var(--color-warning)]" />
              <div>
                <p className="text-2xl font-bold">
                  {data.flags.filter((f) => f.reason === "cost_spike").length}
                </p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Cost Spike
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[var(--color-muted)] rounded-lg">
              <Clock className="h-8 w-8 text-[var(--color-info)]" />
              <div>
                <p className="text-2xl font-bold">
                  {data.flags.filter((f) => f.reason === "many_ips").length}
                </p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Multiple IPs
                </p>
              </div>
            </div>
          </Grid>
        </CardContent>
      </Card>

      {/* Flags List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detail Flags</CardTitle>
          <CardDescription>
            User yang perlu diinvestigasi
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.flags.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-[var(--color-success)] opacity-50" />
              <p className="text-[var(--color-muted-foreground)]">
                Tidak ada anomali yang terdeteksi
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {data.flags.map((flag, index) => {
                const reasonInfo = getReasonLabel(flag.reason)
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 hover:bg-[var(--color-muted)]/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-warning)]/10">
                        <AlertTriangle className="h-5 w-5 text-[var(--color-warning)]" />
                      </div>
                      <div>
                        <p className="font-mono text-sm">{flag.user_id}</p>
                        <Badge variant={reasonInfo.color} className="text-xs mt-1">
                          {reasonInfo.label}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}
