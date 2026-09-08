"use client"

import { useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container, PageHeader } from "@/components/layout"
import { User, Lock, Eye, Trash2, Loader2, Check } from "lucide-react"

export default function SettingsPage() {
  const { user } = useSupabase()
  const { t } = useLanguage()
  const [privacyMode, setPrivacyMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSavePrivacy = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: privacyMode }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err) {
      console.error("Failed to save privacy settings:", err)
    }
    setSaving(false)
  }

  const handleDeleteAccount = async () => {
    if (!confirm("Yakin ingin mengajukan penghapusan akun? Tindakan ini tidak bisa dibatalkan.")) {
      return
    }

    const res = await fetch("/api/account/delete-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "user request" }),
    })

    if (res.ok) {
      alert("Permintaan hapus akun telah dikirim. Kami akan menghubungi Anda.")
    } else {
      alert("Gagal mengirim permintaan.")
    }
  }

  if (!user) {
    return (
      <Container>
        <p className="text-center text-[var(--color-muted-foreground)]">
          {t("common.please_login")}
        </p>
      </Container>
    )
  }

  return (
    <Container>
      <PageHeader
        title={t("settings.title")}
        description="Kelola pengaturan akun Anda"
      />

      <div className="max-w-2xl space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Profil
            </CardTitle>
            <CardDescription>
              Informasi akun Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-2">
                <Badge variant={user.email_confirmed_at ? "success" : "warning"}>
                  {user.email_confirmed_at ? "Email terverifikasi" : "Email belum diverifikasi"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5" />
              {t("settings.privacy")}
            </CardTitle>
            <CardDescription>
              {t("settings.privacyDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Aktifkan Mode Privasi</Label>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Prompt tidak akan disimpan di server
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={privacyMode}
                  onCheckedChange={setPrivacyMode}
                />
                <Button
                  size="sm"
                  onClick={handleSavePrivacy}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : saved ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    t("common.save")
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5" />
              Keamanan
            </CardTitle>
            <CardDescription>
              Kelola password dan keamanan akun
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline">
              <Lock className="h-4 w-4 mr-2" />
              Ubah Password
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-[var(--color-destructive)]/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-[var(--color-destructive)]">
              <Trash2 className="h-5 w-5" />
              Zona Berbahaya
            </CardTitle>
            <CardDescription>
              Tindakan di bawah tidak dapat dibatalkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("settings.delete")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}
