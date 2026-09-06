"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Container } from "@/components/layout"
import {
  Cpu,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Save,
} from "lucide-react"
import { getModelTierLabel } from "@/lib/model-tier-labels"

type Model = {
  id: string
  name: string
  provider: string
  tier: string
  upstream_price_per_token: number
  markup_price_per_token: number
  is_active: boolean
}

export default function AdminModelsPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [saving, setSaving] = useState<string | null>(null)
  const [rate, setRate] = useState(15000)

  useEffect(() => {
    if (!user) { router.push("/login"); return }
    const fetchModels = async () => {
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
    fetch("/api/forex").then((r) => r.json()).then((d) => setRate(d.rate ?? 15000)).catch(() => {})
  }, [user, router])

  const handleSync = async () => {
    setSyncing(true)
    try {
      await fetch("/api/admin/models/sync", { method: "POST" })
      const res = await fetch("/api/admin/models")
      if (res.ok) {
        const data = await res.json()
        setModels(data.models ?? [])
      }
    } catch (err) {
      console.error("Failed to sync models:", err)
    }
    setSyncing(false)
  }

  const startEdit = (model: Model) => {
    setEditingId(model.id)
    setEditValue(model.markup_price_per_token.toString())
  }

  const saveMarkup = async (model: Model) => {
    const newMarkup = parseFloat(editValue)
    if (isNaN(newMarkup) || newMarkup < 0) return

    setSaving(model.id)
    try {
      await fetch("/api/admin/models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: model.id,
          markup_price_per_token: newMarkup,
        }),
      })
      setModels((prev) =>
        prev.map((m) =>
          m.id === model.id ? { ...m, markup_price_per_token: newMarkup } : m
        )
      )
      setEditingId(null)
    } catch (err) {
      console.error("Failed to save markup:", err)
    }
    setSaving(null)
  }

  const toggleActive = async (model: Model) => {
    try {
      await fetch("/api/admin/models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: model.id,
          is_active: !model.is_active,
        }),
      })
      setModels((prev) =>
        prev.map((m) =>
          m.id === model.id ? { ...m, is_active: !m.is_active } : m
        )
      )
    } catch (err) {
      console.error("Failed to toggle model:", err)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Cpu className="h-8 w-8 text-[var(--accent)]" />
          <h1 className="text-3xl font-bold">Manajemen Model</h1>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          {syncing ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Syncing...</>
          ) : (
            <><RefreshCw className="h-4 w-4 mr-2" />Sync OpenRouter</>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Model</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-muted-foreground)]" />
            </div>
          ) : models.length === 0 ? (
            <div className="text-center py-16 text-[var(--color-muted-foreground)]">Belum ada model</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Model</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Provider</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Tier</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Upstream</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Markup</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Margin</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m) => {
                    const margin = m.markup_price_per_token > 0
                      ? ((m.markup_price_per_token - m.upstream_price_per_token) / m.markup_price_per_token) * 100
                      : 0
                    const isEditing = editingId === m.id

                    return (
                      <tr key={m.id} className="border-b border-[var(--color-border)] last:border-0">
                        <td className="px-4 py-3 font-mono text-sm font-medium">{m.name}</td>
                        <td className="px-4 py-3 text-sm">{m.provider}</td>
                        <td className="px-4 py-3">
                          <Badge variant={m.tier === "murah" ? "default" : m.tier === "mahal" ? "destructive" : "secondary"}>
                            {getModelTierLabel(m.tier)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {(m.upstream_price_per_token * rate).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-28 text-right h-8 text-xs"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveMarkup(m)
                                  if (e.key === "Escape") setEditingId(null)
                                }}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => saveMarkup(m)}
                                disabled={saving === m.id}
                              >
                                {saving === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              </Button>
                            </div>
                          ) : (
                            <span
                              className="cursor-pointer hover:text-[var(--accent)]"
                              onClick={() => startEdit(m)}
                            >
                              {(m.markup_price_per_token * rate).toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono text-xs font-bold ${margin < 10 ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}`}>
                          {margin.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          {m.is_active ? (
                            <CheckCircle2 className="h-4 w-4 text-[var(--color-success)] inline" />
                          ) : (
                            <XCircle className="h-4 w-4 text-[var(--color-destructive)] inline" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(m)}
                          >
                            {m.is_active ? "Nonaktif" : "Aktifkan"}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
