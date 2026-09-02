"use client"

import Link from "next/link"
import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container, Section, Grid } from "@/components/layout"
import { ArrowRight, CheckCircle2, QrCode, Zap, Shield, Copy, Check } from "lucide-react"
import { useState } from "react"

const codeExample = `curl https://api.pakaikuota.id/v1/chat/completions \\
  -H "Authorization: Bearer $PK_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Halo!"}]}'`

const features = [
  { titleKey: "features.local.title", descKey: "features.local.desc", icon: QrCode },
  { titleKey: "features.instant.title", descKey: "features.instant.desc", icon: Zap },
  { titleKey: "features.price.title", descKey: "features.price.desc", icon: Shield },
]

const models = [
  { name: "gpt-4o-mini", provider: "OpenAI", price: "1.500", tier: "Entry" },
  { name: "gemini-1.5-flash", provider: "Google", price: "1.500", tier: "Entry" },
  { name: "claude-haiku", provider: "Anthropic", price: "2.000", tier: "Entry" },
  { name: "gpt-4o", provider: "OpenAI", price: "15.000", tier: "Premium" },
]

export default function LandingPage() {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)

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
                    <Badge variant={model.tier === "Premium" ? "warning" : "secondary"}>
                      {t(model.tier === "Premium" ? "models.tier.premium" : "models.tier.entry")}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-2">{model.provider}</p>
                  <p className="font-mono text-lg font-semibold text-[var(--accent-text)]">
                    Rp {model.price}
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
