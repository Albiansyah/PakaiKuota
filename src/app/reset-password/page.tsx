"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Container } from "@/components/layout"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const { supabase } = useSupabase()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setIsValidSession(false)
      } else {
        setIsValidSession(true)
      }
    }
    checkSession()
  }, [supabase])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("Password minimal 6 karakter")
      return
    }

    if (password !== confirmPassword) {
      setError("Password tidak cocok")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    }
    setLoading(false)
  }

  if (isValidSession === null) {
    return (
      <Container size="xs" className="py-12">
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-text)]" />
        </div>
      </Container>
    )
  }

  if (isValidSession === false) {
    return (
      <Container size="xs" className="py-12">
        <Card className="bg-[var(--bg-surface)] border-[var(--border-color)]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-left text-red-500">Link Expired</CardTitle>
            <CardDescription className="text-left">
              Link reset password sudah expired atau tidak valid
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Silakan minta link reset password baru dari halaman login.
            </p>
            <Link href="/forgot-password">
              <Button className="w-full">Minta Link Baru</Button>
            </Link>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="text-sm text-[var(--accent-text)] hover:underline">
              ← Kembali ke Login
            </Link>
          </CardFooter>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xs" className="py-12">
      <Card className="bg-[var(--bg-surface)] border-[var(--border-color)]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-left">Password Baru</CardTitle>
          <CardDescription className="text-left">
            Masukkan password baru untuk akun Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <div className="flex flex-col items-center text-center gap-4 py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Password berhasil diubah!</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Mengalihkan ke halaman login...
                </p>
              </div>
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
                <Label htmlFor="password">Password Baru</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Masukkan password lagi"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {loading ? "Menyimpan..." : "Simpan Password Baru"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter>
          <Link href="/login" className="text-sm text-[var(--accent-text)] hover:underline">
            ← Kembali ke Login
          </Link>
        </CardFooter>
      </Card>
    </Container>
  )
}
