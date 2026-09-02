"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Container, Grid, PageHeader } from "@/components/layout"
import { Key, Plus, CreditCard, History, Settings, Shield, ArrowUpRight, Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { user, loading: authLoading } = useSupabase()
  const { t } = useLanguage()
  const router = useRouter()
  const [saldo, setSaldo] = useState<number | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      setBalanceLoading(true)
      try {
        const balanceRes = await fetch("/api/me/balance")
        if (balanceRes.ok) {
          const data = await balanceRes.json()
          setSaldo(data.balance_rupiah ?? 0)
        }
        const adminRes = await fetch("/api/admin/users")
        if (adminRes.ok) setRole("admin")
      } catch (err) {
        console.error("Failed to fetch data:", err)
      }
      setBalanceLoading(false)
    }
    fetchData()
  }, [user])

  const quickActions = [
    { href: "/dashboard/api-keys", icon: Key, label: t("dashboard.createKey") },
    { href: "/dashboard/topup", icon: Plus, label: t("dashboard.topup") },
    { href: "/dashboard/history", icon: History, label: t("dashboard.viewHistory") },
    { href: "/dashboard/settings", icon: Settings, label: t("nav.settings") },
  ]

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-text)]" />
      </div>
    )
  }

  if (!user) return null

  return (
    <Container>
      <div className="py-8">
        <PageHeader title={t("dashboard.title")} description={`Selamat datang, ${user.email?.split("@")[0]}`} />

        {/* Balance Card */}
        <Card className="mb-8 bg-[var(--bg-surface)] border-[var(--border-color)]">
          <CardContent className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-secondary)] text-sm mb-1">{t("dashboard.balance")}</p>
                {balanceLoading ? (
                  <div className="h-10 w-40 bg-[var(--bg-base)]/50 rounded animate-pulse" />
                ) : (
                  <p className="text-4xl font-bold font-mono text-[var(--accent-text)]">
                    Rp {(saldo ?? 0).toLocaleString("id-ID")}
                  </p>
                )}
              </div>
              <Link href="/dashboard/topup">
                <Button variant="accent" size="lg" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  {t("dashboard.topup")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{t("dashboard.quickActions")}</h2>
          <Grid cols={4} gap="md">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Card className="bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[var(--accent)]/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)]/10">
                        <action.icon className="h-6 w-6 text-[var(--accent-text)]" />
                      </div>
                      <span className="text-sm font-medium text-[var(--text-primary)]">{action.label}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </Grid>
        </div>

        {/* Admin Section */}
        {role === "admin" && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-[var(--accent-text)]" />
              Admin Panel
            </h2>
            <Link href="/admin">
              <Card className="bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[var(--accent)]/50 transition-colors">
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--warning)]/10">
                      <Shield className="h-5 w-5 text-[var(--warning)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">Kelola Sistem</p>
                      <p className="text-sm text-[var(--text-secondary)]">User, model, transaksi, dan lainnya</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-[var(--text-tertiary)]" />
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Usage Stats */}
        <Card className="bg-[var(--bg-surface)] border-[var(--border-color)]">
          <CardHeader>
            <CardTitle className="text-lg">Statistik Penggunaan</CardTitle>
            <CardDescription>Grafik usage 7/30 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-[var(--text-tertiary)]">
              <div className="text-center">
                <p className="text-sm">Belum ada data usage</p>
                <p className="text-xs mt-1">Usage akan muncul setelah menggunakan API</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}
