"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Container, PageHeader } from "@/components/layout"
import {
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
  Phone,
  FileText,
} from "lucide-react"

type ResellerApplication = {
  id: string
  business_name: string
  business_phone: string
  npwp: string | null
  user_id: string
  status: string
  created_at: string
}

export default function AdminResellerPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [apps, setApps] = useState<ResellerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    ;(async () => {
      try {
        const res = await fetch("/api/admin/reseller")
        const data = await res.json()
        setApps(data.applications ?? [])
      } catch (err) {
        console.error("Failed to fetch reseller applications:", err)
      } finally {
        setLoading(false)
      }
    })()
  }, [user, router])

  // fetchApplications removed

  const handleDecision = async (id: string, decision: "approved" | "rejected") => {
    setProcessing(id)
    try {
      await fetch("/api/admin/reseller", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision }),
      })
      setApps((prev) => prev.filter((app) => app.id !== id))
    } catch (err) {
      console.error("Failed to process decision:", err)
    }
    setProcessing(null)
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
          <Shield className="h-8 w-8 text-[var(--color-brand)]" />
          <div>
            <h1 className="text-3xl font-bold">KYC Reseller</h1>
            <p className="text-[var(--color-muted-foreground)]">
              Verifikasi data bisnis reseller
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          {apps.length} pengajuan
        </Badge>
      </div>

      <Separator className="mb-8" />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pengajuan Reseller</CardTitle>
          <CardDescription>
            User yang mengajukan menjadi reseller
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {apps.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-[var(--color-success)] opacity-50" />
              <p className="text-[var(--color-muted-foreground)]">
                Tidak ada pengajuan reseller
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="p-4 hover:bg-[var(--color-muted)]/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-brand)]/10">
                        <Building2 className="h-6 w-6 text-[var(--color-brand)]" />
                      </div>
                      <div>
                        <p className="font-semibold">{app.business_name}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-[var(--color-muted-foreground)]">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {app.business_phone}
                          </span>
                          {app.npwp && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {app.npwp}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-2 font-mono">
                          User: {app.user_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[var(--color-destructive)]"
                        onClick={() => handleDecision(app.id, "rejected")}
                        disabled={processing === app.id}
                      >
                        {processing === app.id ? (
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
                        onClick={() => handleDecision(app.id, "approved")}
                        disabled={processing === app.id}
                      >
                        {processing === app.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Setujui
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}
