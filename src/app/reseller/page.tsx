"use client"

import { useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container, Grid, PageHeader } from "@/components/layout"
import { Building2, Phone, FileText, Loader2, CheckCircle2 } from "lucide-react"

export default function ResellerPage() {
  const { user } = useSupabase()
  const { t } = useLanguage()
  const [businessName, setBusinessName] = useState("")
  const [phone, setPhone] = useState("")
  const [npwp, setNpwp] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!user) {
      setMessage("Harap login terlebih dahulu")
      return
    }

    if (!businessName.trim() || !phone.trim()) {
      setMessage("Nama usaha dan nomor telepon wajib diisi")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/reseller/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          business_phone: phone,
          npwp: npwp || null,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        setMessage("Pengajuan reseller berhasil dikirim!")
        setBusinessName("")
        setPhone("")
        setNpwp("")
      } else {
        const data = await res.json()
        setMessage(data.error || "Gagal mengirim pengajuan")
      }
    } catch (err) {
      setMessage("Terjadi kesalahan. Silakan coba lagi.")
    }

    setLoading(false)
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Badge variant="accent" className="mb-4">
            Reseller Program
          </Badge>
          <h1 className="text-3xl font-bold mb-2">Jadi Partner Reseller</h1>
          <p className="text-[var(--color-muted-foreground)]">
            Dapatkan margin lebih dengan menjadi reseller PakaiKuota
          </p>
        </div>

        {/* Benefits */}
        <Grid cols={3} gap="sm" className="mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-success)]/10 mx-auto mb-3">
                <span className="text-2xl font-bold text-[var(--color-success)]">%</span>
              </div>
              <p className="font-semibold">Margin Lebih</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Dapatkan discount wholesale
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand)]/10 mx-auto mb-3">
                <Building2 className="h-6 w-6 text-[var(--color-brand)]" />
              </div>
              <p className="font-semibold">Brand Sendiri</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                White-label tersedia
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-info)]/10 mx-auto mb-3">
                <Phone className="h-6 w-6 text-[var(--color-info)]" />
              </div>
              <p className="font-semibold">Support Prioritas</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Dedicated account manager
              </p>
            </CardContent>
          </Card>
        </Grid>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Formulir Pendaftaran</CardTitle>
            <CardDescription>
              Untuk volume transaksi {" > "} Rp 5 juta/bulan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!user ? (
              <div className="text-center py-8">
                <p className="text-[var(--color-muted-foreground)] mb-4">
                  Login terlebih dahulu untuk mengajukan reseller
                </p>
                <Button asChild>
                  <a href="/login">Login</a>
                </Button>
              </div>
            ) : success ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-[var(--color-success)]" />
                <p className="font-semibold text-lg mb-2">
                  Pengajuan Terkirim!
                </p>
                <p className="text-[var(--color-muted-foreground)]">
                  Tim kami akan menghubungi Anda segera.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Nama Usaha *</Label>
                  <Input
                    id="businessName"
                    placeholder="PT Contoh Indonesia"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">No. Telepon Bisnis *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="npwp">NPWP (Opsional)</Label>
                  <Input
                    id="npwp"
                    placeholder="01.234.567.8-901.000"
                    value={npwp}
                    onChange={(e) => setNpwp(e.target.value)}
                  />
                </div>

                {message && (
                  <div
                    className={`p-3 rounded-md text-sm ${
                      success
                        ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                        : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                    }`}
                  >
                    {message}
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    "Ajukan Sekarang"
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Syarat Reseller</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-[var(--color-success)] mt-0.5" />
              <p>Volume transaksi minimal Rp 5 juta/bulan</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-[var(--color-success)] mt-0.5" />
              <p>Memiliki akun bisnis atau NPWP</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-[var(--color-success)] mt-0.5" />
              <p>Bersedia menandatangani perjanjian reseller</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}
