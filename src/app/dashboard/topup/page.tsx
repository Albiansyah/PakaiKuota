"use client"

import { useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { useTransactionStatus } from "@/hooks/useTransactionStatus"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container, Grid, PageHeader } from "@/components/layout"
import {
  CreditCard,
  Smartphone,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  QrCode,
} from "lucide-react"

const PRESET_AMOUNTS = [
  { value: 10000, label: "Rp 10.000" },
  { value: 25000, label: "Rp 25.000" },
  { value: 50000, label: "Rp 50.000" },
  { value: 100000, label: "Rp 100.000" },
  { value: 250000, label: "Rp 250.000" },
]

export default function TopupPage() {
  const { user } = useSupabase()
  const { t } = useLanguage()
  const [amount, setAmount] = useState("")
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const status = useTransactionStatus(orderId)

  const handleTopup = async () => {
    if (!user) {
      setMessage(t("common.please_login"))
      return
    }

    const amountNum = Number(amount)
    if (!amountNum || amountNum < 1000) {
      setMessage(t("topup.minimum"))
      return
    }

    setLoading(true)
    setMessage("")

    const res = await fetch("/api/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountNum }),
    })
    const data = await res.json()

    if (res.ok) {
      setOrderId(data.orderId)
      setPaymentUrl(data.paymentUrl)
      setMessage(`Order ${data.orderId} dibuat. Silakan lakukan pembayaran.`)
    } else {
      setMessage(data.error ?? t("common.error"))
    }
    setLoading(false)
  }

  const selectPreset = (value: number) => {
    setAmount(value.toString())
  }

  return (
    <Container>
      <PageHeader
        title={t("topup.title")}
        description="Top-up saldo menggunakan QRIS"
      />

      <Grid cols={2} gap="lg">
        {/* Amount Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("topup.amount")}</CardTitle>
            <CardDescription>
              Pilih nominal top-up atau masukkan jumlah sendiri
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preset Amounts */}
            <div className="grid grid-cols-2 gap-3">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={amount === preset.value.toString() ? "default" : "outline"}
                  onClick={() => selectPreset(preset.value)}
                  className="h-12"
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[var(--color-border)]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[var(--color-card)] px-2 text-[var(--color-muted-foreground)]">
                  atau
                </span>
              </div>
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah Custom</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]">
                  Rp
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 text-lg h-12"
                  min="1000"
                />
              </div>
            </div>

            {message && (
              <div
                className={`p-3 rounded-md text-sm ${
                  status === "success"
                    ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                    : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                }`}
              >
                {message}
              </div>
            )}

            <Button
              onClick={handleTopup}
              disabled={loading || !amount || Number(amount) < 1000}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("topup.processing")}
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  {t("topup.create")}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-[var(--color-muted-foreground)]">
              {t("topup.minimum")}
            </p>
          </CardContent>
        </Card>

        {/* Payment Info / Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Informasi Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {orderId ? (
              <>
                {/* QRIS Placeholder */}
                <div className="flex items-center justify-center p-8 bg-[var(--color-muted)] rounded-lg">
                  <div className="text-center">
                    <QrCode className="h-32 w-32 mx-auto mb-4 text-[var(--color-muted-foreground)]" />
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      QR Code akan muncul setelah order dibuat
                    </p>
                  </div>
                </div>

                {/* Order Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-muted-foreground)]">
                      Order ID
                    </span>
                    <span className="font-mono text-sm">{orderId}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-muted-foreground)]">
                      Metode
                    </span>
                    <Badge variant="outline">QRIS</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-muted-foreground)]">
                      Jumlah
                    </span>
                    <span className="font-bold">
                      Rp {Number(amount).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 p-4 bg-[var(--color-muted)] rounded-lg">
                  {!status || status === "pending" ? (
                    <>
                      <Clock className="h-5 w-5 text-[var(--color-warning)]" />
                      <div>
                        <p className="font-medium">Menunggu Pembayaran</p>
                        <p className="text-sm text-[var(--color-muted-foreground)]">
                          Selesaikan pembayaran sebelum 15 menit
                        </p>
                      </div>
                    </>
                  ) : status === "success" ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />
                      <div>
                        <p className="font-medium text-[var(--color-success)]">
                          {t("topup.success")}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-[var(--color-destructive)]" />
                      <div>
                        <p className="font-medium text-[var(--color-destructive)]">
                          {t("topup.failed")}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="h-16 w-16 mx-auto mb-4 text-[var(--color-muted-foreground)] opacity-50" />
                <p className="text-[var(--color-muted-foreground)]">
                  Pilih nominal dan buat order untuk memulai pembayaran
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Container>
  )
}
