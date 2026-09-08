"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import type { Database } from "@/types/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

type NewAPIConfig = {
  id: number
  base_url: string
  api_key: string
  default_model: string
  markup_percent: number
  is_active: boolean
  hourly_limit_rupiah?: number
  daily_limit_rupiah?: number
}

export default function NewAPIConfigPage() {
  const { supabase } = useSupabase()
  const router = useRouter()
  const [config, setConfig] = useState<NewAPIConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<NewAPIConfig>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const { data, error } = await (supabase as any).from("newapi_config").select("*").single()
        if (error) throw error
        setConfig(data as NewAPIConfig)
        setForm(data as NewAPIConfig)
      } catch {
        toast.error("Konfigurasi NewAPI tidak bisa dimuat")
      } finally {
        setLoading(false)
      }
    })()
  }, [supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({ ...prev, [name]: type === "number" ? Number(value) || 0 : value }))
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const { error } = await supabase
        .from("newapi_config")
        .upsert({ ...form, id: 1 } as never, { onConflict: "id" })
      if (error) throw error
      const { data, error: fetchError } = await supabase
        .from("newapi_config")
        .select("*")
        .single()
      if (fetchError) throw fetchError
      setConfig(data as NewAPIConfig)
      setSaved(true)
      toast.success("Konfigurasi NewAPI tersimpan")
      setTimeout(() => setSaved(false), 3000)
    } catch {
      toast.error("Gagal menyimpan konfigurasi")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-8">Loading...</div>

  return (
    <div className="space-y-6">
      {/* NewAPI Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi NewAPI</CardTitle>
          <CardDescription>URL endpoint, API key, model default, dan markup harga</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_url">Base URL</Label>
              <Input id="base_url" name="base_url" value={form.base_url || ""} onChange={handleChange} placeholder="https://api.newapi.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input id="api_key" name="api_key" type="password" value={form.api_key || ""} onChange={handleChange} placeholder="newapi-xxx" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_model">Model Default</Label>
              <Input id="default_model" name="default_model" value={form.default_model || ""} onChange={handleChange} placeholder="gpt-4o-mini" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="markup_percent">Markup (%)</Label>
              <Input id="markup_percent" name="markup_percent" type="number" min="0" max="100" value={form.markup_percent ?? 20} onChange={handleChange} />
              <p className="text-xs text-muted-foreground">Persentase markup dari harga upstream</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              name="is_active"
              checked={form.is_active ?? true}
              onChange={e => { setForm(prev => ({ ...prev, is_active: e.target.checked })); setSaved(false) }}
              className="w-5 h-5 rounded"
            />
            <Label htmlFor="is_active">Aktifkan NewAPI</Label>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting</CardTitle>
          <CardDescription>Batas pengeluaran per jam dan per hari untuk mencegah abuse</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourly_limit_rupiah">Limit Per Jam (Rp)</Label>
              <Input
                id="hourly_limit_rupiah"
                name="hourly_limit_rupiah"
                type="number"
                min="0"
                value={form.hourly_limit_rupiah ?? 0}
                onChange={handleChange}
                placeholder="0 = unlimited"
              />
              <p className="text-xs text-muted-foreground">0 = tidak ada batas per jam</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily_limit_rupiah">Limit Per Hari (Rp)</Label>
              <Input
                id="daily_limit_rupiah"
                name="daily_limit_rupiah"
                type="number"
                min="0"
                value={form.daily_limit_rupiah ?? 0}
                onChange={handleChange}
                placeholder="0 = unlimited"
              />
              <p className="text-xs text-muted-foreground">0 = tidak ada batas per hari</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Packages */}
      <Card>
        <CardHeader>
          <CardTitle>Paket Token</CardTitle>
          <CardDescription>Kelola paket token untuk dijual. bisa juga langsung dari menu Paket Token.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => router.push("/admin/token-packages")}>
            Kelola Paket Token
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center gap-4">
        <Button onClick={save} disabled={saving} size="lg">
          {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">✓ Konfigurasi tersimpan!</span>
        )}
      </div>
    </div>
  )
}
