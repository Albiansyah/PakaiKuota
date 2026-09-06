"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container, PageHeader } from "@/components/layout"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Key,
  Plus,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/cn"

type ApiKey = {
  id: string
  name: string
  key_prefix: string
  is_active: boolean
  created_at: string
}

export default function ApiKeysPage() {
  const { user } = useSupabase()
  const { t } = useLanguage()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [name, setName] = useState("")
  const [generated, setGenerated] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const refresh = async () => {
    const res = await fetch("/api/keys")
    const data = await res.json()
    setKeys(data.keys ?? [])
    setInitialLoading(false)
  }

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const res = await fetch("/api/keys")
      const data = await res.json()
      setKeys(data.keys ?? [])
      setInitialLoading(false)
    })()
  }, [user])

  const createKey = async () => {
    if (!name.trim()) return
    setLoading(true)

    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()

    if (res.ok) {
      setGenerated(data.key)
      setName("")
      refresh()
    } else {
      alert(data.error)
    }
    setLoading(false)
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    )
  }

  return (
    <Container>
      <PageHeader
        title={t("apikeys.title")}
        description="Kelola API keys untuk mengakses layanan"
      />

      {/* Generated Key Warning */}
      {generated && (
        <Card className="mb-6 border-[var(--color-warning)] bg-[var(--color-warning)]/10">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-[var(--color-warning)] mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">{t("apikeys.warning")}</p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 p-2 bg-[var(--color-background)] rounded text-sm font-mono break-all">
                    {generated}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generated)}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGenerated(null)}
              >
                Tutup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create New Key */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{t("apikeys.create")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Nama API key (contoh: production-api)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={createKey} disabled={loading || !name.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("apikeys.create")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Keys List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada API key</p>
              <p className="text-sm mt-1">
                Buat API key baru untuk memulai
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("apikeys.name")}</TableHead>
                  <TableHead>{t("apikeys.prefix")}</TableHead>
                  <TableHead>{t("apikeys.active")}</TableHead>
                  <TableHead>{t("apikeys.created")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {key.key_prefix}****
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={key.is_active ? "success" : "secondary"}
                      >
                        {key.is_active ? t("common.active") : t("common.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[var(--color-muted-foreground)]">
                      {new Date(key.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}
