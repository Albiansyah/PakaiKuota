"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container, Section, Grid } from "@/components/layout"
import { Check, Zap, Calculator, ArrowRight, Copy } from "lucide-react"

type Package = { id: string; name: string; description: string | null; token_amount: number; price_rupiah: number; bonus_percent: number; duration_days: number | null }
type Model = { id: string; slug: string; name: string; group_name: string; tier: string; input_price_per_1k: number; output_price_per_1k: number }

function getDailyRate(days: number): number {
  if (days <= 30) return 300
  if (days <= 60) return 250
  if (days <= 90) return 200
  return 150
}

function calcTotalPrice(quota_rupiah: number, days: number): number {
  return quota_rupiah + days * getDailyRate(days)
}

export default function PricingPage() {
  const { t } = useLanguage()
  const [customDays, setCustomDays] = useState(14)
  const [customQuota, setCustomQuota] = useState(100000)
  const [packages, setPackages] = useState<Package[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  useEffect(() => { fetch('/api/catalog').then((res) => res.json()).then((data) => { setPackages(data.packages ?? []); setModels(data.models ?? []) }).catch(() => { setPackages([]); setModels([]) }) }, [])
  const groupedModels = models.reduce<Record<string, Model[]>>((groups, model) => { (groups[model.group_name || 'Lainnya'] ??= []).push(model); return groups }, {})
  const copyModel = async (slug: string) => { await navigator.clipboard.writeText(slug); setCopied(slug); setTimeout(() => setCopied(null), 1500) }

  const customTotal = useMemo(() => calcTotalPrice(customQuota, customDays), [customQuota, customDays])
  const customDailyRate = getDailyRate(customDays)

  return (
    <div className="flex flex-col">
      {/* Pay As You Go */}
      <Section className="py-16 md:py-24">
        <Container>
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
              {t("pricing.title")}
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              {t("pricing.subtitle")}
            </p>
          </div>

          {/* Pay-as-you-go */}
          <Card className="mb-12 bg-[var(--bg-surface)] border-[var(--border-color)]">
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{t("pricing.payg")}</h3>
                  <p className="text-[var(--text-secondary)]">{t("pricing.payg.desc")}</p>
                </div>
                <Button variant="accent" size="lg">
                  {t("topup.title")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Commitment Packages */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{t("pricing.packages")}</h2>
            <p className="text-[var(--text-secondary)]">{t("pricing.packages.desc")}</p>
          </div>

          <Grid cols={4} gap="lg" className="mb-16">
            {packages.map((pkg, index) => (
              <Card
                key={pkg.id}
                className={`relative bg-[var(--bg-surface)] border-[var(--border-color)] ${
                  index === 1 ? "border-[var(--accent)]" : ""
                }`}
              >
                {index === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="accent">Paling Populer</Badge>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description ?? "Paket penggunaan API"}</CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div>
                    <p className="text-3xl font-bold text-[var(--text-primary)]">
                      Rp {pkg.price_rupiah.toLocaleString("id-ID")}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {(pkg.duration_days ?? 0)} hari aktif
                    </p>
                  </div>

                  <ul className="space-y-2 text-sm text-left">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[var(--success)] mt-0.5 shrink-0" />
                      <span>Kuota Rp {pkg.price_rupiah.toLocaleString("id-ID")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[var(--success)] mt-0.5 shrink-0" />
                      <span>{(pkg.duration_days ?? 0)} hari aktif</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[var(--success)] mt-0.5 shrink-0" />
                      <span>Rp {getDailyRate((pkg.duration_days ?? 0)).toLocaleString("id-ID")}/hari</span>
                    </li>
                  </ul>

                  <Link href="/register">
                    <Button
                      variant={index === 1 ? "accent" : "outline"}
                      className="w-full"
                      size="lg"
                    >
                      Beli Sekarang
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </Grid>

           <div className="mb-16">
             <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Model tersedia</h2>
             <p className="text-[var(--text-secondary)]">Model aktif dikelompokkan oleh admin. Salin slug untuk dipakai di API.</p>
             <div className="mt-6 space-y-5">{Object.entries(groupedModels).map(([group, items]) => <section key={group} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-5"><h3 className="font-semibold">{group}</h3><div className="mt-3 grid gap-2 md:grid-cols-2">{items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 border-b border-[var(--border-color)] py-3"><div className="min-w-0"><p className="truncate font-medium">{item.name}</p><code className="text-xs text-[var(--text-secondary)]">{item.slug}</code></div><Button variant="outline" size="sm" onClick={() => copyModel(item.slug)}><Copy className="mr-1 h-3 w-3" />{copied === item.slug ? "Tersalin" : "Salin"}</Button></div>)}</div></section>)}</div>
           </div>

           {/* Custom Package */}
          <Card className="bg-[var(--bg-surface)] border-[var(--border-color)]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)]/10">
                  <Calculator className="h-5 w-5 text-[var(--accent-text)]" />
                </div>
                <div>
                  <CardTitle>{t("pricing.custom.title")}</CardTitle>
                  <CardDescription>{t("pricing.custom.subtitle")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Grid cols={2} gap="lg">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-days">{t("pricing.custom.days")}</Label>
                    <Input
                      id="custom-days"
                      type="number"
                      min={1}
                      max={365}
                      value={customDays}
                      onChange={(e) => setCustomDays(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-quota">{t("pricing.custom.quota")}</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">Rp</span>
                      <Input
                        id="custom-quota"
                        type="number"
                        min={1000}
                        step={1000}
                        value={customQuota}
                        onChange={(e) => setCustomQuota(Math.max(1000, Number(e.target.value) || 0))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center p-6 bg-[var(--bg-base)] rounded-lg">
                  <p className="text-sm text-[var(--text-secondary)] mb-1">{t("pricing.custom.dailyRate")}</p>
                  <p className="text-lg font-mono font-semibold text-[var(--accent-text)] mb-4">
                    Rp {customDailyRate.toLocaleString("id-ID")}/hari
                  </p>

                  <p className="text-sm text-[var(--text-secondary)] mb-1">{t("pricing.custom.total")}</p>
                  <p className="text-3xl font-bold text-[var(--text-primary)] mb-6">
                    Rp {customTotal.toLocaleString("id-ID")}
                  </p>

                  <Button variant="accent" size="lg" className="w-full gap-2">
                    <Zap className="h-4 w-4" />
                    {t("pricing.custom.buy")}
                  </Button>
                </div>
              </Grid>
            </CardContent>
          </Card>
        </Container>
      </Section>
    </div>
  )
}
