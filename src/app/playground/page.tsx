"use client"

import { useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Container, Grid, PageHeader } from "@/components/layout"
import {
  Bot,
  Send,
  Loader2,
  Zap,
  Copy,
  Check,
} from "lucide-react"

const TRIAL_MODELS = [
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", tier: "Murah" },
  { id: "claude-haiku", name: "Claude Haiku", tier: "Murah" },
  { id: "gemini-flash", name: "Gemini Flash", tier: "Murah" },
]

const TRIAL_DAILY_LIMIT = 20

export default function PlaygroundPage() {
  const { user } = useSupabase()
  const { t } = useLanguage()
  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState(TRIAL_MODELS[0].id)
  const [output, setOutput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const handleSubmit = async () => {
    if (!user) return setError("Login required")
    if (!prompt.trim()) return setError("Prompt cannot be empty")
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 50,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Failed")
      } else {
        setOutput(data.output ?? JSON.stringify(data, null, 2))
      }
    } catch (err) {
      setError("Request failed. Please try again.")
    }

    setLoading(false)
  }

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectedModel = TRIAL_MODELS.find((m) => m.id === model)

  return (
    <Container>
      <PageHeader
        title="Playground"
        description="Test model AI langsung dari browser dengan quota trial"
      />

      <Grid cols={3} gap="md">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Model Selection */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Pilih Model</CardTitle>
              <CardDescription>
                Model yang tersedia untuk trial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Grid cols={3} gap="sm">
                {TRIAL_MODELS.map((m) => (
                  <Button
                    key={m.id}
                    variant={model === m.id ? "default" : "outline"}
                    onClick={() => setModel(m.id)}
                    className="h-auto py-3 flex-col gap-1"
                  >
                    <span className="font-medium">{m.name}</span>
                    <Badge
                      variant={model === m.id ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {m.tier}
                    </Badge>
                  </Button>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Input */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Prompt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Tulis prompt di sini..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
              />

              {error && (
                <div className="p-3 text-sm text-[var(--color-destructive)] bg-[var(--color-destructive)]/10 rounded-md">
                  {error}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={loading || !prompt.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Kirim
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output */}
          {output && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Response</CardTitle>
                  <Button variant="ghost" size="sm" onClick={copyOutput}>
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-[var(--color-muted)] rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                  <code>{output}</code>
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trial Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Trial Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-muted-foreground)]">
                  Limit Harian
                </span>
                <Badge variant="outline">{TRIAL_DAILY_LIMIT} request</Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-muted-foreground)]">
                    Model aktif
                  </span>
                  <Badge variant="accent">{selectedModel?.name}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--color-muted-foreground)]">
              <p>• Playground menggunakan quota trial, bukan saldo asli</p>
              <p>• Model yang tersedia dibatasi untuk trial</p>
              <p>• Login diperlukan untuk akses playground</p>
              <p>• Trial limit reset setiap hari</p>
            </CardContent>
          </Card>

          {/* API Key CTA */}
          {!user && (
            <Card className="bg-[var(--color-brand)] border-0 text-white">
              <CardContent className="py-6">
                <h3 className="font-semibold mb-2">Mau akses penuh?</h3>
                <p className="text-sm text-white/80 mb-4">
                  Daftar dan top-up saldo untuk akses semua model
                </p>
                <Button variant="secondary" className="w-full">
                  Daftar Sekarang
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </Grid>
    </Container>
  )
}
