"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Container, Grid, PageHeader } from "@/components/layout"
import { Key, Plus, CreditCard, History, Settings, Shield, ArrowUpRight, Loader2, Star, TrendingUp, Award } from "lucide-react"

type LoyaltyInfo = {
  tier: "bronze" | "silver" | "gold"
  total_purchased: number
  bonus_percent: number
  discount_percent: number
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useSupabase()
  const { t } = useLanguage()
  const router = useRouter()
  const [saldo, setSaldo] = useState<number | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [loyalty, setLoyalty] = useState<LoyaltyInfo | null>(null)

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

  // Fetch loyalty info
  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const res = await fetch("/api/me/loyalty")
        if (res.ok) {
          const data = await res.json()
          setLoyalty(data)
        }
      } catch (e) {
        console.error("Failed to fetch loyalty:", e)
      }
    })()
  }, [user])

  const quickActions = [
    { href: "/dashboard/api-keys", icon: Key, label: t("dashboard.createKey") },
    { href: "/dashboard/topup", icon: Plus, label: t("dashboard.topup") },
    { href: "/dashboard/history", icon: History, label: t("dashboard.viewHistory") },
    { href: "/dashboard/settings", icon: Settings, label: t("nav.settings") },
  ]

  const tierEmoji = { bronze: "🥉", silver: "🥈", gold: "🥇" }
  const tierColors = { bronze: "text-yellow-600", silver: "text-gray-400", gold: "text-amber-400" }
  const tierLabels = { bronze: "Bronze", silver: "Silver", gold: "Gold" }

  const nextTierInfo = () => {
    if (!loyalty) return null
    if (loyalty.tier === "bronze") {
      const needed = 1000000 - loyalty.total_purchased
      return { label: "Silver", needed, threshold: 1000000 }
    }
    if (loyalty.tier === "silver") {
      const needed = 5000000 - loyalty.total_purchased
      return { label: "Gold", needed, threshold: 5000000 }
    }
    return null
  }

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

        {/* Loyalty Card */}
        {loyalty && (
          <Card className="mb-8 bg-gradient-to-r from-[var(--accent)]/10 to-transparent border-[var(--accent)]/30">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{tierEmoji[loyalty.tier]}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Award className={`h-5 w-5 ${tierColors[loyalty.tier]}`} />
                      <h3 className={`font-bold ${tierColors[loyalty.tier]}`}>
                        {tierLabels[loyalty.tier]} Member
                      </h3>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Total Pembelian: Rp {loyalty.total_purchased.toLocaleString("id-ID")}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-[var(--text-tertiary)]">
                        Bonus: <span className="text-[var(--accent-text)] font-medium">{loyalty.bonus_percent}%</span>
                      </span>
                      <span className="text-[var(--text-tertiary)]">
                        Diskon: <span className="text-[var(--accent-text)] font-medium">{loyalty.discount_percent}%</span>
                      </span>
                    </div>
                  </div>
                </div>

                {nextTierInfo() && (
                  <div className="bg-[var(--bg-surface)] rounded-lg p-4 md:min-w-[250px]">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-[var(--accent-text)]" />
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        Naik ke {nextTierInfo()?.label}
                      </span>
                    </div>
                    <div className="w-full bg-[var(--bg-base)] rounded-full h-2 mb-2">
                      <div
                        className="bg-[var(--accent)] h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (loyalty.total_purchased / (nextTierInfo()?.threshold ?? 1)) * 100)}%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Butuh Rp {(nextTierInfo()?.needed ?? 0).toLocaleString("id-ID")} lagi
                    </p>
                  </div>
                )}

                {loyalty.tier === "gold" && (
                  <div className="flex items-center gap-2 text-sm text-[var(--accent-text)]">
                    <Star className="h-4 w-4" />
                    <span>Highest tier achieved!</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
