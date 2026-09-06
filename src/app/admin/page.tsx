"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Grid } from "@/components/layout"
import {
  Users,
  Cpu,
  Receipt,
  BarChart3,
  AlertTriangle,
  Shield,
  ArrowUpRight,
  Loader2,
  TrendingUp,
  Clock,
  DollarSign,
  Search,
  Package,
} from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type KPI = {
  totalUsers: number
  revenueThisMonth: number
  pendingTransactions: number
  avgMargin: number
}

type DailyRevenue = {
  name: string
  uv: number
}

type ModelUsage = {
  name: string
  score: number
}

type RecentActivity = {
  id: string
  type: string
  description: string
  created_at: string
}

export default function AdminPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [kpi, setKpi] = useState<KPI | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([])
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    if (!user) { router.push("/login"); return }
    ;(async () => {
      try {
        const [kpiRes, txnRes, modelsRes, auditRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/admin/transactions"),
          fetch("/api/admin/models"),
          fetch("/api/admin/audit"),
        ])
        if (!kpiRes.ok || !txnRes.ok || !modelsRes.ok || !auditRes.ok) {
          console.error("Admin API fetch failed", {
            users: kpiRes.status,
            transactions: txnRes.status,
            models: modelsRes.status,
            audit: auditRes.status,
          })
          setLoading(false)
          return
        }
        const kpiData = await kpiRes.json()
        const txnData = await txnRes.json()
        const modelsData = await modelsRes.json()
        const auditData = await auditRes.json()
        const users = kpiData.users ?? []
        const txns = txnData.transactions ?? []
        const models = modelsData.models ?? []
        const auditLogs = auditData.logs ?? []
        const now = new Date()
        const thisMonth = txns.filter(
          (t: { status: string; paid_at: string }) =>
            t.status === "success" && t.paid_at &&
            new Date(t.paid_at).getMonth() === now.getMonth() &&
            new Date(t.paid_at).getFullYear() === now.getFullYear()
        )
        const revenueThisMonth = thisMonth.reduce((sum: number, t: { amount_rupiah: number }) => sum + t.amount_rupiah, 0)
        const pending = txns.filter((t: { status: string }) => t.status === "pending").length
        // Safe margin calculation with type coercion
        const margins = models
          .filter((m: { upstream_price_per_token: number | string; markup_price_per_token: number | string }) => {
            const markup = Number(m.markup_price_per_token)
            return markup > 0
          })
          .map((m: { upstream_price_per_token: number | string; markup_price_per_token: number | string }) => {
            const markup = Number(m.markup_price_per_token)
            const upstream = Number(m.upstream_price_per_token)
            if (markup <= 0) return 0
            return ((markup - upstream) / markup) * 100
          })
        const avgMargin = margins.length > 0 ? margins.reduce((a: number, b: number) => a + b, 0) / margins.length : 0
        setKpi({ totalUsers: users.length, revenueThisMonth, pendingTransactions: pending, avgMargin })
        const last30Days: DailyRevenue[] = []
        for (let i = 29; i >= 0; i--) {
          const day = new Date()
          day.setDate(now.getDate() - i)
          const dayStr = day.toISOString().split("T")[0]
          const dayTxns = txns.filter(
            (t: { status: string; paid_at: string }) => t.status === "success" && t.paid_at && new Date(t.paid_at).toISOString().split("T")[0] === dayStr
          )
          const dayRevenue = dayTxns.reduce((sum: number, t: { amount_rupiah: number }) => sum + t.amount_rupiah, 0)
          last30Days.push({ name: day.toLocaleDateString("id-ID", { weekday: "short" }), uv: dayRevenue })
        }
        setDailyRevenue(last30Days)
        const modelUsageData = models
          .filter((m: { markup_price_per_token: number | string }) => {
            const score = Number(m.markup_price_per_token)
            return score > 0
          })
          .map((m: { id: string; name: string; markup_price_per_token: number | string }) => ({
            name: m.name || `Model ${String(m.id).substring(0, 8)}`,
            score: Number(m.markup_price_per_token) || 0
          }))
          .sort((a: { score: number }, b: { score: number }) => (b.score || 0) - (a.score || 0))
          .slice(0, 5)
        setModelUsage(modelUsageData)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [user, router])

  const kpiCards = kpi
    ? [
        { label: "Total User", value: kpi.totalUsers.toLocaleString("id-ID"), icon: Users, color: "text-blue-500" },
        { label: "Revenue Bulan Ini", value: `Rp ${kpi.revenueThisMonth.toLocaleString("id-ID")}`, icon: DollarSign, color: "text-[var(--color-success)]" },
        { label: "Transaksi Pending", value: kpi.pendingTransactions.toString(), icon: Clock, color: "text-[var(--color-warning)]" },
        { label: "Margin Rata-rata", value: `${kpi.avgMargin.toFixed(1)}%`, icon: BarChart3, color: "text-[var(--accent)]" },
      ]
    : []

  const adminMenu = [
    { href: "/admin/users", icon: Users, title: "Users", color: "text-blue-500" },
    { href: "/admin/transactions", icon: Receipt, title: "Transaksi", color: "text-green-500" },
    { href: "/admin/token-packages", icon: Package, title: "Paket Token", color: "text-yellow-500" },
    { href: "/admin/refunds", icon: AlertTriangle, title: "Refund", color: "text-orange-500" },
    { href: "/admin/models", icon: Cpu, title: "Models", color: "text-purple-500" },
    { href: "/admin/margin", icon: BarChart3, title: "Margin", color: "text-[var(--accent)]" },
    { href: "/admin/reconciliation", icon: Shield, title: "Rekonsiliasi", color: "text-cyan-500" },
    { href: "/admin/audit-logs", icon: Shield, title: "Audit Log", color: "text-gray-500" },
    { href: "/admin/broadcast", icon: TrendingUp, title: "Broadcast", color: "text-pink-500" },
    { href: "/admin/anomaly", icon: AlertTriangle, title: "Anomaly", color: "text-red-500" },
    { href: "/admin/reseller", icon: Users, title: "Reseller", color: "text-teal-500" },
  ]

  const filteredActivities = activities.length > 0 ? activities : []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-[var(--accent)]" />
        <h1 className="text-3xl font-bold">Overview</h1>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
            <input
              type="text"
              placeholder={t("overview.searchPlaceholder") || "Cari Users/Transaksi..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-4 h-10 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <Grid cols={4} gap="md">
        {kpiCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-muted)]`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm text-[var(--color-muted-foreground)]">{card.label}</p>
                  <p className="text-2xl font-bold font-mono">{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </Grid>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue 30 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyRevenue}>
              <XAxis dataKey="name" tick={{ fontSize: 8 }} label={{ value: "Hari", fontSize: 10 }} />
              <YAxis label={{ value: "Revenue (Rp)", fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="uv" fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Model Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Model Usage</CardTitle>
          <CardDescription>Top 5 model berdasarkan markup price</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={modelUsage}>
              <XAxis dataKey="name" tick={{ fontSize: 8, angle: -45, textAnchor: "end" }} label={{ value: "Model", fontSize: 10 }} />
              <YAxis label={{ value: "Price Score", fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="score" fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Panel Admin</CardTitle>
          <CardDescription>Akses cepat ke halaman admin</CardDescription>
        </CardHeader>
        <CardContent>
          <Grid cols={3} gap="sm">
            {adminMenu.map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--accent)]/50 transition-colors cursor-pointer">
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                  <span className="text-sm font-medium">{item.title}</span>
                  <ArrowUpRight className="h-3 w-3 ml-auto text-[var(--color-muted-foreground)]" />
                </div>
              </Link>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredActivities.length > 0 ? (
            <div className="space-y-3">
              {filteredActivities.map((a) => (
                <div key={a.id} className="flex items-center gap-3 text-sm">
                  <Badge variant="secondary" className="w-16 justify-center shrink-0">{a.type}</Badge>
                  <p className="flex-1 truncate">{a.description}</p>
                  <span className="text-xs text-[var(--color-muted-foreground)] font-mono whitespace-nowrap">
                    {new Date(a.created_at).toLocaleDateString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)] text-center py-8">
              Belum ada aktivitas
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}