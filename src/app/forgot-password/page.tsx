"use client"

import { useState } from "react"
import Link from "next/link"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Container } from "@/components/layout"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const { supabase } = useSupabase()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <Container size="xs" className="py-12">
      <Card className="bg-[var(--bg-surface)] border-[var(--border-color)]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-left">Reset Password</CardTitle>
          <CardDescription className="text-left">
            Masukkan email Anda untuk menerima link reset password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <div className="flex flex-col items-center text-center gap-4 py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Email terkirim!</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Kami telah mengirim link reset password ke <strong>{email}</strong>
                </p>
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">
                Cek folder spam jika email tidak ditemukan dalam beberapa menit.
              </p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-500 bg-red-500/10 rounded-[var(--radius-sm)]">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {loading ? "Mengirim..." : "Kirim Link Reset"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            <Link href="/login" className="text-[var(--accent-text)] hover:underline">
              ← Kembali ke Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </Container>
  )
}
