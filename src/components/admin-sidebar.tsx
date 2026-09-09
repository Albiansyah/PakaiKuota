"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useState } from "react"
import { ChevronDown, ChevronRight, LayoutDashboard, LogOut, Settings, Users, WalletCards, Package, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

const groups = [
  { label: "Overview", items: [{ href: "/admin/ringkasan", label: "Ringkasan", icon: LayoutDashboard }] },
  { label: "Manajemen", items: [{ href: "/admin?tab=users", label: "Users", icon: Users }, { href: "/admin?tab=transactions", label: "Transaksi", icon: WalletCards }, { href: "/admin?tab=refunds", label: "Refund queue", icon: WalletCards }] },
  { label: "Konfigurasi", items: [{ href: "/admin/newapi-config", label: "NewAPI config", icon: Settings }, { href: "/admin/models", label: "Model & pricing", icon: BarChart3 }, { href: "/admin/token-packages", label: "Token packages", icon: Package }] },
  { label: "Laporan", items: [{ href: "/admin?tab=reconciliation", label: "Reconciliation", icon: BarChart3 }] },
]

export function AdminSidebar({ email, role }: { email: string | undefined; role: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab")
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggle = (label: string) => setCollapsed((current) => ({ ...current, [label]: !current[label] }))

  return (
    <aside className="border-border bg-card text-foreground lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/" className="text-lg font-semibold">Pakai<span className="text-[var(--accent)]">Kuota</span></Link>
        <Button variant="ghost" size="icon" className="text-foreground" onClick={() => setCollapsed((current) => ({ ...current, __all: !current.__all }))} aria-label="Toggle menu">
          <ChevronRight className={collapsed.__all ? "rotate-0" : "rotate-90"} />
        </Button>
      </div>
      <p className="px-5 text-xs text-muted-foreground">Admin, {role === "super_admin" ? "super admin" : role}</p>
      <nav className="mt-5 space-y-3 overflow-y-auto px-3 pb-5" aria-label="Navigasi admin">
        {groups.map((group) => <section key={group.label}>
          <button className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground" onClick={() => toggle(group.label)}>{group.label}{collapsed[group.label] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}</button>
          {!collapsed[group.label] && !collapsed.__all && <div className="space-y-1">{group.items.map((item) => {
            const Icon = item.icon
            const [itemPath, itemQuery] = item.href.split("?")
            const itemTab = itemQuery?.replace("tab=", "")
            const active = pathname === itemPath && (itemTab ? activeTab === itemTab : !activeTab)
            return <Link key={item.href} href={item.href} className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm ${active ? "bg-[var(--accent)] font-semibold text-[var(--background)]" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon size={16} />{item.label}</Link>
          })}</div>}
        </section>)}
      </nav>
      <div className="mt-auto hidden border-border p-4 lg:block lg:border-t">
        <p className="truncate text-xs text-muted-foreground">{email ?? "Akun"}</p>
        <form action="/api/auth/logout" method="post"><button className="mt-3 flex items-center gap-2 text-sm text-[var(--accent)] underline"><LogOut size={14} />Keluar</button></form>
      </div>
    </aside>
  )
}
