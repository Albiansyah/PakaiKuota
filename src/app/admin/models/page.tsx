"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Cpu, RefreshCw, Loader2, MoreHorizontal, Pencil, Power, PowerOff, Save } from "lucide-react"
import { getModelTierLabel } from "@/lib/model-tier-labels"

type Model = {
  id: string
  name: string
  slug: string
  tier: "standard" | "premium" | "ultra"
  input_price_per_1k: number
  output_price_per_1k: number
  markup_percent: number
  enabled: boolean
}

const numClass = "text-right font-mono tabular-nums"

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
  const [connection, setConnection] = useState<{ last_test_status?: "success" | "failed" | null; last_test_response_time_ms?: number | null; last_tested_at?: string | null }>({})

  useEffect(() => {
    if (!user) { router.push("/login"); return }
    const fetchModels = async () => {
      try {
        const res = await fetch("/api/admin/models")
        if (!res.ok) throw new Error("Unauthorized")
        const data = await res.json()
        setModels(data.models ?? [])
        setConnection(data.connection ?? {})
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
    setEditValue(model.markup_percent.toString())
  }

  const saveMarkup = async (model: Model) => {
    const newMarkup = parseFloat(editValue)
    if (isNaN(newMarkup) || newMarkup < 0) return
    setSaving(model.id)
    try {
      await fetch("/api/admin/models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: model.id, markup_percent: newMarkup }),
      })
      setModels((prev) => prev.map((m) => (m.id === model.id ? { ...m, markup_percent: newMarkup } : m)))
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
        body: JSON.stringify({ modelId: model.id, enabled: !model.enabled }),
      })
      setModels((prev) => prev.map((m) => (m.id === model.id ? { ...m, enabled: !m.enabled } : m)))
    } catch (err) {
      console.error("Failed to toggle model:", err)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-8 sm:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="h-8 w-8 text-[var(--accent)]" />
          <div><h1 className="text-3xl font-bold">Manajemen Model</h1><div className="mt-2 text-sm">{connection.last_test_status === "success" ? <Badge className="border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]">Terhubung ke NewAPI{connection.last_test_response_time_ms ? ` · ${connection.last_test_response_time_ms} ms` : ""}</Badge> : <Badge variant="outline">Belum terhubung</Badge>}</div></div>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          {syncing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Syncing...</> : <><RefreshCw className="mr-2 h-4 w-4" />Sync NewAPI</>}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Model</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--text-secondary)]" />
            </div>
          ) : models.length === 0 ? (
            <div className="py-16 text-center text-[var(--text-secondary)]">Belum ada model</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Input / 1K</TableHead>
                  <TableHead className="text-right">Markup</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((m) => {
                  const margin = m.markup_percent
                  const isEditing = editingId === m.id
                  const tierLabel = getModelTierLabel(m.tier)

                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-sm font-medium">{m.name}</TableCell>
                      <TableCell className="text-sm">NewAPI</TableCell>
                      <TableCell>
                        {tierLabel ? (
                          <Badge variant={tierLabel === "Premium" ? "default" : "secondary"}>{tierLabel}</Badge>
                        ) : (
                          <Badge variant="outline">-</Badge>
                        )}
                      </TableCell>
                      <TableCell className={numClass}>{ (m.input_price_per_1k * rate).toFixed(2) }</TableCell>
                      <TableCell className={numClass}>
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8 w-28 text-right text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveMarkup(m)
                                if (e.key === "Escape") setEditingId(null)
                              }}
                            />
                            <Button size="sm" variant="ghost" onClick={() => saveMarkup(m)} disabled={saving === m.id}>
                              {saving === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            </Button>
                          </div>
                        ) : (
                          <span className="cursor-pointer hover:text-[var(--accent)]" onClick={() => startEdit(m)}>
                            {m.markup_percent.toFixed(2)}%
                          </span>
                        )}
                      </TableCell>
                      <TableCell className={`${numClass} font-bold ${margin < 10 ? "text-[var(--warning)]" : "text-[var(--success)]"}`}>
                        {margin.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-center">
                        {m.enabled ? (
                          <Badge className="border-emerald-500/20 bg-emerald-500/15 text-emerald-500">Aktif</Badge>
                        ) : (
                          <Badge variant="outline">Nonaktif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Aksi">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEdit(m)}>
                              <Pencil /> Edit Markup
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
{m.enabled ? (
                              <DropdownMenuItem onClick={() => toggleActive(m)}>
                                <PowerOff /> Nonaktifkan
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => toggleActive(m)}>
                                <Power /> Aktifkan
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
