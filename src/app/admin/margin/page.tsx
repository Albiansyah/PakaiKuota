"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout"
import {
  BarChart3,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react"

type ModelMarkup = {
  id: string
  name: string
  provider: string
  tier: string
  upstream_price_per_token: number
  markup_price_per_token: number
  is_active: boolean
}

export default function AdminMarginPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [models, setModels] = useState<ModelMarkup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push("/login"); return }
    const fetchModels = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/admin/models")
        if (!res.ok) throw new Error("Unauthorized")
        const data = await res.json()
        setModels(data.models ?? [])
      } catch (err) {
        console.error("Failed to fetch models:", err)
      }
      setLoading(false)
    }
    fetchModels()
  }, [user, router])

  const fetchModels = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/models")
      if (!res.ok) throw new Error("Unauthorized")
      const data = await res.json()
      setModels(data.models ?? [])
    } catch (err) {
      console.error("Failed to fetch models:", err)
    }
    setLoading(false)
  }

  const calcMargin = (upstream: number, markup: number) => {
    if (markup === 0) return 0
    return ((markup - upstream) / markup) * 100
  }

  const sortedModels = [...models]
    .sort((a, b) => calcMargin(a.upstream_price_per_token, a.markup_price_per_token) - calcMargin(b.upstream_price_per_token, b.markup_price_per_token))

  const maxMargin = Math.max(...sortedModels.map((m) => calcMargin(m.upstream_price_per_token, m.markup_price_per_token)), 1)

  return (
    <Container>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-[var(--accent)]" />
          <div>
            <h1 className="text-3xl font-bold">Monitor Margin</h1>
            <p className="text-[var(--color-muted-foreground)]">
              Margin per model — dari paling tipis ke paling tebal
            </p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={fetchModels}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-muted-foreground)]" />
        </div>
      ) : sortedModels.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-[var(--color-muted-foreground)]">
            Belum ada model
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedModels.map((m) => {
            const margin = calcMargin(m.upstream_price_per_token, m.markup_price_per_token)
            const barWidth = Math.max((margin / maxMargin) * 100, 2)
            const isLow = margin < 10
            const isNegative = margin < 0

            return (
              <div key={m.id} className="flex items-center gap-4">
                <div className="w-48 shrink-0 text-right">
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{m.provider}</p>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="h-6 rounded bg-[var(--color-muted)] flex-1 overflow-hidden relative">
                    <div
                      className={`h-full rounded transition-all ${
                        isNegative ? "bg-[var(--color-destructive)]" : isLow ? "bg-[var(--color-warning)]" : "bg-[var(--color-success)]"
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className={`w-16 text-right text-sm font-mono font-bold ${isNegative ? "text-[var(--color-destructive)]" : isLow ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}`}>
                    {margin.toFixed(1)}%
                  </span>
                </div>
                {(isLow || isNegative) && (
                  <AlertTriangle className={`h-4 w-4 shrink-0 ${isNegative ? "text-[var(--color-destructive)]" : "text-[var(--color-warning)]"}`} />
                )}
                <Badge variant={m.tier === "murah" ? "default" : m.tier === "mahal" ? "destructive" : "secondary"} className="w-16 justify-center shrink-0">
                  {m.tier}
                </Badge>
              </div>
            )
          })}
        </div>
      )}
    </Container>
  )
}
