"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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

const helperClass = "mt-1.5 text-xs text-[var(--text-secondary)]"

export default function NewAPIConfigPage() {
  const { supabase } = useSupabase()
  const [testing, setTesting] = useState(false)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<NewAPIConfig>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const { data, error } = await (supabase).from("newapi_config").select("*").single()
        if (error) throw error
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

  const testConnection = async () => {
    setTesting(true)
    const response = await fetch("/api/admin/newapi-config", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ base_url: form.base_url, api_key: form.api_key }) })
    setTesting(false)
    if (response.ok) toast.success("Koneksi NewAPI berhasil")
    else toast.error("Koneksi NewAPI gagal")
  }

  const save = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const { error } = await supabase.from("newapi_config").upsert({ ...form, id: 1 } as never, { onConflict: "id" })
      if (error) throw error
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
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-8 sm:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Endpoint & Model</CardTitle>
          <CardDescription>Konfigurasi koneksi NewAPI dan model default.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="base_url">Base URL</Label>
              <Input className="mt-2" id="base_url" name="base_url" value={form.base_url || ""} onChange={handleChange} placeholder="https://api.newapi.com" />
              <p className={helperClass}>URL endpoint upstream NewAPI.</p>
            </div>
            <div>
              <Label htmlFor="api_key">API Key</Label>
              <Input className="mt-2" id="api_key" name="api_key" type="password" value={form.api_key || ""} onChange={handleChange} placeholder="newapi-xxx" />
              <p className={helperClass}>Kunci autentikasi untuk koneksi upstream.</p>
            </div>
            <div>
              <Label htmlFor="default_model">Model Default</Label>
              <Input className="mt-2" id="default_model" name="default_model" value={form.default_model || ""} onChange={handleChange} placeholder="gpt-4o-mini" />
              <p className={helperClass}>Model yang digunakan saat tidak ada pilihan khusus.</p>
            </div>
            <div>
              <Label htmlFor="markup_percent">Markup (%)</Label>
              <Input className="mt-2" id="markup_percent" name="markup_percent" type="number" min="0" max="100" value={form.markup_percent ?? 20} onChange={handleChange} />
              <p className={helperClass}>Persentase markup dari harga upstream.</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-hover)]/40 p-4">
            <div className="space-y-1">
              <Label htmlFor="is_active">Aktifkan NewAPI</Label>
              <p className="text-sm text-[var(--text-secondary)]">Izinkan aplikasi menggunakan koneksi NewAPI.</p>
            </div>
            <Switch id="is_active" checked={form.is_active ?? true} onCheckedChange={is_active => { setForm(prev => ({ ...prev, is_active })); setSaved(false) }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting</CardTitle>
          <CardDescription>Batas pengeluaran untuk mencegah abuse.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="hourly_limit_rupiah">Limit Per Jam (Rp)</Label>
              <Input className="mt-2" id="hourly_limit_rupiah" name="hourly_limit_rupiah" type="number" min="0" value={form.hourly_limit_rupiah ?? 0} onChange={handleChange} placeholder="0 = unlimited" />
              <p className={helperClass}>0 = tidak ada batas per jam.</p>
            </div>
            <div>
              <Label htmlFor="daily_limit_rupiah">Limit Per Hari (Rp)</Label>
              <Input className="mt-2" id="daily_limit_rupiah" name="daily_limit_rupiah" type="number" min="0" value={form.daily_limit_rupiah ?? 0} onChange={handleChange} placeholder="0 = unlimited" />
              <p className={helperClass}>0 = tidak ada batas per hari.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paket Token</CardTitle>
          <CardDescription>Kelola paket token yang tersedia untuk dijual.</CardDescription>
        </CardHeader>
        <CardContent><Button variant="outline" onClick={() => router.push("/admin/token-packages")}>Kelola Paket Token</Button></CardContent>
      </Card>

      <Separator />
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={testConnection} disabled={testing || !form.base_url || !form.api_key} size="lg">{testing ? "Menguji..." : "Test koneksi"}</Button>
        <Button onClick={save} disabled={saving} size="lg">{saving ? "Menyimpan..." : "Simpan Konfigurasi"}</Button>
        {saved && <span className="text-sm text-[var(--success)]">Konfigurasi tersimpan.</span>}
      </div>
    </div>
  )
}
