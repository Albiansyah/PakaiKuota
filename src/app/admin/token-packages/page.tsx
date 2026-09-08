"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Grid } from "@/components/layout"
import { Trash2, Edit, Check, X } from "lucide-react"

type TokenPackage = {
  id: string
  name: string
  description: string | null
  token_amount: number
  price_rupiah: number
  bonus_percent: number
  duration_days: number | null
  is_active: boolean
  sort_order: number
}

export default function TokenPackagesPage() {
  const { supabase } = useSupabase()
  const router = useRouter()
  const [packages, setPackages] = useState<TokenPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<TokenPackage>>({})

  useEffect(() => {
    ;(async () => {
      try {
        const { data, error } = await (supabase as any).from("token_packages").select("*").order("sort_order")
        if (error) throw error
        setPackages(data as TokenPackage[])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [supabase])

  const startEdit = (pkg: TokenPackage) => {
    setEditing(pkg.id)
    setForm({ ...pkg })
  }

  const cancelEdit = () => {
    setEditing(null)
    setForm({})
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name.includes("_days") || name.includes("_percent") || name.includes("_amount") || name.includes("price") ? Number(value) : value }))
  }

  const savePackage = async () => {
    const payload = { ...form }
    if (editing) {
      const { error } = await (supabase as any).from("token_packages").update(payload).eq("id", editing)
      if (error) throw error
    } else {
      const { error } = await (supabase as any).from("token_packages").insert(payload)
      if (error) throw error
    }
    // refresh list
    const { data, error } = await (supabase as any).from("token_packages").select("*").order("sort_order")
    if (error) throw error
    setPackages(data as TokenPackage[])
    cancelEdit()
  }

  const deletePackage = async (id: string) => {
    if (!confirm("Hapus paket token ini?")) return
    const { error } = await (supabase as any).from("token_packages").delete().eq("id", id)
    if (error) throw error
    setPackages(prev => prev.filter(p => p.id !== id))
  }

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await (supabase as any).from("token_packages").update({ is_active: !current }).eq("id", id)
    if (error) throw error
    setPackages(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
  }

  if (loading) return <div className="flex items-center justify-center py-8"><span>Loading...</span></div>

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Paket Token</CardTitle>
          <CardDescription>Kelola paket token yang dijual</CardDescription>
        </CardHeader>
        <CardContent>
          <Grid cols={1} gap="md">
            {packages.map(pkg => (
              <Card key={pkg.id}>
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{pkg.name}</h3>
                    <p className="text-sm text-muted-foreground">{pkg.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={pkg.is_active ? "default" : "secondary"}>{pkg.is_active ? "Aktif" : "Non‑aktif"}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(pkg.id, pkg.is_active)}>
                      {pkg.is_active ? <X size={16} /> : <Check size={16} />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => startEdit(pkg)}><Edit size={16} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deletePackage(pkg.id)}><Trash2 size={16} /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Jumlah Token: {pkg.token_amount}</div>
                    <div>Harga (Rp): {pkg.price_rupiah.toLocaleString("id-ID")}</div>
                    <div>Bonus %: {pkg.bonus_percent}</div>
                    <div>Durasi (hari): {pkg.duration_days ?? "-"}</div>
                    <div>Urutan: {pkg.sort_order}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button onClick={() => setEditing(null)} className="mt-4">Tambah Paket Baru</Button>
          </Grid>
        </CardContent>
      </Card>

      {(editing !== null || packages.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Paket" : "Buat Paket Baru"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input name="name" placeholder="Nama paket" value={form.name || ""} onChange={handleChange} />
            <Input name="description" placeholder="Deskripsi" value={form.description || ""} onChange={handleChange} />
            <Input name="token_amount" type="number" placeholder="Jumlah token" value={form.token_amount?.toString() || ""} onChange={handleChange} />
            <Input name="price_rupiah" type="number" placeholder="Harga (Rp)" value={form.price_rupiah?.toString() || ""} onChange={handleChange} />
            <Input name="bonus_percent" type="number" placeholder="Bonus %" value={form.bonus_percent?.toString() || ""} onChange={handleChange} />
            <Input name="duration_days" type="number" placeholder="Durasi (hari)" value={form.duration_days?.toString() || ""} onChange={handleChange} />
            <Input name="sort_order" type="number" placeholder="Urutan" value={form.sort_order?.toString() || ""} onChange={handleChange} />
            <div className="flex gap-2">
              <Button onClick={savePackage}>Simpan</Button>
              <Button variant="secondary" onClick={cancelEdit}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
