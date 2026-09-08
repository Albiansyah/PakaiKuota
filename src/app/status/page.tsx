"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/components/providers/language-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Container, Grid } from "@/components/layout"
import {
  Server,
  Cloud,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"

type StatusData = {
  gateway: string
  upstream: string
  timestamp: string
}

export default function StatusPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    const fetchStatusLocal = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/status")
        const result = await res.json()
        setData(result)
        setLastRefresh(new Date())
      } catch (err) {
        console.error("Failed to fetch status:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStatusLocal()
    const interval = setInterval(fetchStatusLocal, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />
      case "error":
      case "degraded":
        return <XCircle className="h-5 w-5 text-[var(--color-destructive)]" />
      default:
        return <AlertTriangle className="h-5 w-5 text-[var(--color-warning)]" />
    }
  }

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "ok":
        return <Badge variant="success">{t("status.ok")}</Badge>
      case "error":
        return <Badge variant="destructive">{t("status.error")}</Badge>
      default:
        return <Badge variant="warning">Memuat...</Badge>
    }
  }

  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("status.title")}</h1>
        <p className="text-[var(--color-muted-foreground)] flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {t("status.lastUpdate")}:{" "}
          {loading ? (
            "..."
          ) : (
            lastRefresh.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          )}
        </p>
      </div>

      <Grid cols={2} gap="md">
        {/* Gateway Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand)]/10">
                <Server className="h-5 w-5 text-[var(--color-brand)]" />
              </div>
              <div>
                <CardTitle className="text-base">{t("status.gateway")}</CardTitle>
                <CardDescription>API Gateway</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(data?.gateway)}
                {getStatusBadge(data?.gateway)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upstream Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand)]/10">
                <Cloud className="h-5 w-5 text-[var(--color-brand)]" />
              </div>
              <div>
                <CardTitle className="text-base">{t("status.upstream")}</CardTitle>
                <CardDescription>OpenRouter</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(data?.upstream)}
                {getStatusBadge(data?.upstream)}
              </div>
            </div>
          </CardContent>
        </Card>
      </Grid>

      <Separator className="my-8" />

      {/* Incident History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Insiden</CardTitle>
          <CardDescription>
            Tidak ada insiden dalam 30 hari terakhir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-[var(--color-muted-foreground)]">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-[var(--color-success)] opacity-50" />
            <p>Semua sistem beroperasi normal</p>
          </div>
        </CardContent>
      </Card>

      {/* Subscribe to Updates */}
      <div className="mt-8 text-center">
        <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
          Dapatkan notifikasi jika ada gangguan
        </p>
        <div className="flex items-center justify-center gap-2 text-sm">
          <RefreshCw className="h-4 w-4" />
          <span>Status diperbarui otomatis setiap 30 detik</span>
        </div>
      </div>
    </Container>
  )
}
