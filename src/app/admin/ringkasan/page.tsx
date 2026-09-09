"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

 type Metrics = { labels: string[]; users: number[]; transactions: number[]; revenue: number[] }

export default function AdminSummaryPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  useEffect(() => {
    const load = () => fetch("/api/admin/metrics", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then(setMetrics).catch(() => null)
    load()
    const timer = setInterval(load, 30000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="admin-tab-content mx-auto max-w-5xl space-y-8 px-5 py-8 sm:px-8">
      <div>
        <p className="text-sm font-medium text-[var(--accent)]">Overview</p>
        <h1 className="mt-1 text-2xl font-semibold">Ringkasan</h1>
      </div>
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader>
          <div className="flex items-end justify-between gap-4">
            <div><CardTitle>Aktivitas 7 hari</CardTitle><CardDescription>Diperbarui otomatis setiap 30 detik.</CardDescription></div>
            <div className="text-right text-sm text-muted-foreground">Transaksi: <b className="text-foreground">{metrics?.transactions.reduce((sum, value) => sum + value, 0) ?? "-"}</b></div>
          </div>
        </CardHeader>
        <CardContent>
          {!metrics ? <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Memuat aktivitas...</div> : <div className="flex h-40 items-end gap-2">
            {metrics.labels.map((label, index) => { const height = Math.max(metrics.users[index], metrics.transactions[index], 1); return <div key={label} className="flex flex-1 flex-col items-center gap-2"><div className="flex h-32 w-full items-end gap-1"><span className="flex-1 rounded-t bg-[var(--accent)]" style={{ height: `${(metrics.users[index] / height) * 100}%` }} title={`${metrics.users[index]} user`} /><span className="flex-1 rounded-t bg-[var(--foreground)]" style={{ height: `${(metrics.transactions[index] / height) * 100}%` }} title={`${metrics.transactions[index]} transaksi`} /></div><span className="text-[10px] text-muted-foreground">{label}</span></div> })}
          </div>}
        </CardContent>
      </Card>
    </div>
  )
}
