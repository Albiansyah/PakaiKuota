"use client"

import Link from "next/link"
import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container, Section, Grid } from "@/components/layout"
import { ArrowRight, CheckCircle2, QrCode, Zap, Shield, Copy, Check } from "lucide-react"
import { useEffect, useState } from "react"

const codeExample = `curl https://api.pakaikuota.id/v1/chat/completions \\
  -H "Authorization: Bearer $PK_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Halo!"}]}'`

const features = [
  { titleKey: "features.local.title", descKey: "features.local.desc", icon: QrCode },
  { titleKey: "features.instant.title", descKey: "features.instant.desc", icon: Zap },
  { titleKey: "features.price.title", descKey: "features.price.desc", icon: Shield },
]

type ModelItem = {
  name: string
  provider: string
  tier: string
  markup_price_per_token: number
}

export default function LandingPage() {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [models, setModels] = useState<ModelItem[]>([])
  const [rate, setRate] = useState(15000)

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((d) => setModels((d.models ?? []).slice(0, 4)))
      .catch(() => setModels([]))
    fetch("/api/forex")
      .then((r) => r.json())
      .then((d) => setRate(d.rate ?? 15000))
      .catch(() => {})
  }, [])

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(codeExample)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <Section className="py-16 md:py-24 lg:py-32">
        <Container>
          <Grid cols={2} gap="lg">
            {/* Left Column - Text */}
            <div className="flex flex-col items-start">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
                API LLM dengan
                <br />
                <span className="text-[var(--accent-text)]">{t("hero.titleAccent")}</span>
              </h1>

              <p className="text-lg text-[var(--text-secondary)] mb-6">
                {t("hero.subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/register">
                  <Button variant="accent" size="lg" className="gap-2">
                    {t("hero.cta")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button variant="outline" size="lg">
                    {t("hero.docs")}
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-[var(--text-tertiary)] mt-4">
                {t("hero.note")}
              </p>
            </div>

            {/* Right Column - Terminal Demo */}
            <div>
              <Card className="bg-[var(--bg-surface)] border-[var(--border-color)] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-base)]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[var(--error)]" />
                    <div className="w-3 h-3 rounded-full bg-[var(--warning)]" />
                    <div className="w-3 h-3 rounded-full bg-[var(--success)]" />
                  </div>
                  <span className="ml-2 text-xs text-[var(--text-tertiary)] font-mono">terminal</span>
                  <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={copyToClipboard}>
                    {copied ? <Check className="h-3.5 w-3.5 text-[var(--success)]" /> : <Copy className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />}
                  </Button>
                </div>
                <CardContent className="p-0">
                  <pre className="p-4 overflow-x-auto text-sm font-mono">
                    <code className="text-[var(--text-secondary)]">{codeExample}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>
          </Grid>
        </Container>
      </Section>

      {/* Features - Horizontal List */}
      <Section variant="surface" className="py-12">
        <Container>
          <Grid cols={3} gap="lg">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)]/10">
                  <feature.icon className="h-5 w-5 text-[var(--accent-text)]" />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--text-primary)] mb-1">{t(feature.titleKey)}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{t(feature.descKey)}</p>
                </div>
              </div>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Models Section */}
      <Section>
        <Container>
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">
              {t("models.title")}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {t("models.subtitle")}
            </p>
          </div>

          <Grid cols={4} gap="md">
            {models.map((model, index) => (
              <Card key={index} className="bg-[var(--bg-surface)] border-[var(--border-color)]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <code className="font-mono text-sm text-[var(--text-primary)]">
                      {model.name}
                    </code>
                    <Badge variant={model.tier === "Premium" || model.tier === "mahal" ? "warning" : "secondary"}>
                      {t(model.tier === "Premium" || model.tier === "mahal" ? "models.tier.premium" : "models.tier.entry")}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-2">{model.provider}</p>
                  <p className="font-mono text-lg font-semibold text-[var(--accent-text)]">
                    Rp {(model.markup_price_per_token * rate * 1000).toLocaleString("id-ID", { maximumFractionDigits: 0 })}/1K
                  </p>
                </CardContent>
              </Card>
            ))}
          </Grid>

          <div className="mt-8 text-center">
            <Link href="/docs">
              <Button variant="outline" className="gap-2">
                {t("models.viewAll")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Container>
      </Section>

      {/* Loyalty Section */}
      <Section variant="surface" className="py-16">
        <Container>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-3">
              Loyalty Program — Makin Beli, Makin Hemat
            </h2>
            <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
              Setiap pembelian menambah saldo loyaltymu. Naik tier dan dapatkan bonus token serta diskon lebih besar!
            </p>
          </div>

          <Grid cols={3} gap="lg">
            <Card className="bg-[var(--bg-base)] border-[var(--border-color)] text-center">
              <CardContent className="pt-8 pb-6">
                <div className="text-4xl mb-4">🥉</div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Bronze</h3>
                <p className="text-sm text-[var(--text-tertiary)] mb-4">Tier default untuk semua user</p>
                <div className="space-y-2 text-sm">
                  <p className="text-[var(--text-secondary)]">Bonus: 0%</p>
                  <p className="text-[var(--text-secondary)]">Diskon: 0%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--bg-base)] border-[var(--accent)]/50 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="accent">Rekomendasi</Badge>
              </div>
              <CardContent className="pt-8 pb-6">
                <div className="text-4xl mb-4">🥈</div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Silver</h3>
                <p className="text-sm text-[var(--text-tertiary)] mb-4">Total beli ≥ Rp1.000.000</p>
                <div className="space-y-2 text-sm">
                  <p className="text-[var(--accent-text)] font-medium">Bonus: 5%</p>
                  <p className="text-[var(--accent-text)] font-medium">Diskon: 5%</p>
                  <p className="text-[var(--text-tertiary)]">Priority Support</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--bg-base)] border-[var(--border-color)] text-center">
              <CardContent className="pt-8 pb-6">
                <div className="text-4xl mb-4">🥇</div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Gold</h3>
                <p className="text-sm text-[var(--text-tertiary)] mb-4">Total beli ≥ Rp5.000.000</p>
                <div className="space-y-2 text-sm">
                  <p className="text-[var(--accent-text)] font-medium">Bonus: 15%</p>
                  <p className="text-[var(--accent-text)] font-medium">Diskon: 15%</p>
                  <p className="text-[var(--text-tertiary)]">Priority Support</p>
                  <p className="text-[var(--text-tertiary)]">Custom Model Access</p>
                </div>
              </CardContent>
            </Card>
          </Grid>

          <div className="text-center mt-8">
            <Link href="/register">
              <Button variant="outline" size="lg">
                Mulai Kumpulkan Loyalty
              </Button>
            </Link>
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section variant="bordered">
        <Container>
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4">
              {t("cta.title")}
            </h2>
            <p className="text-[var(--text-secondary)] mb-8">
              {t("cta.subtitle")}
            </p>
            <Link href="/register">
              <Button variant="accent" size="lg" className="gap-2">
                {t("cta.button")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Container>
      </Section>

      {/* Trust Badges */}
      <Section>
        <Container>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-[var(--text-tertiary)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
              <span>{t("trust.nocredit")}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
              <span>{t("trust.qris")}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
              <span>{t("trust.instant")}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
              <span>{t("trust.indonesia")}</span>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  )
}
