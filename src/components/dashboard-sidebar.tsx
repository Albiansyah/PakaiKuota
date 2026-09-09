"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ChevronDown, ChevronRight, KeyRound, LayoutDashboard, LogOut, Package, ReceiptText, Settings, WalletCards, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const groups = [
  { label: "Overview", items: [{ href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard }] },
  { label: "Akun", items: [{ href: "/dashboard/keys", label: "API keys", icon: KeyRound }, { href: "/dashboard/settings", label: "Pengaturan", icon: Settings }] },
  { label: "Keuangan", items: [{ href: "/dashboard/topup", label: "Beli kuota", icon: Package }, { href: "/dashboard/transactions", label: "Transaksi", icon: ReceiptText }, { href: "/dashboard/ledger", label: "Mutasi saldo", icon: WalletCards }, { href: "/dashboard/refunds", label: "Refund", icon: WalletCards }] },
  { label: "Developer", items: [{ href: "/dashboard/playground", label: "Playground", icon: KeyRound }] },
]

export function DashboardSidebar({ email }: { email: string | undefined }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggle = (label: string) => setCollapsed((current) => ({ ...current, [label]: !current[label] }))

  return <>
    <Button variant="outline" size="icon" className="fixed left-4 top-4 z-30 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Buka menu"><ChevronRight size={18} /></Button>
    {mobileOpen && <button className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Tutup menu" />}
    <aside className={`border-[#30435d] bg-[#122542] text-white ${mobileOpen ? "fixed inset-y-0 left-0 z-50 flex w-72" : "hidden"} lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r`}>
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/" className="text-lg font-semibold">Pakai<span className="text-[#F0A93B]">Kuota</span></Link>
        <Button variant="ghost" size="icon" className="text-white lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Tutup menu"><X size={18} /></Button>
      </div>
      <p className="px-5 text-xs text-[#b7c5d6]">Dashboard user</p>
      <nav className="mt-5 space-y-3 overflow-y-auto px-3 pb-5" aria-label="Navigasi dashboard">
        {groups.map((group) => <section key={group.label}>
          <button className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground" onClick={() => toggle(group.label)}>{group.label}{collapsed[group.label] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}</button>
          {!collapsed[group.label] && <div className="space-y-1">{group.items.map((item) => { const Icon = item.icon; const active = pathname === item.href; return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm ${active ? "bg-[#F0A93B] font-semibold text-[#122542]" : "text-[#dbe4ef] hover:bg-[#1d3555] hover:text-white"}`}><Icon size={16} />{item.label}</Link> })}</div>}
        </section>)}
      </nav>
      <div className="mt-auto hidden border-[#30435d] p-4 lg:block lg:border-t"><p className="truncate text-xs text-[#b7c5d6]">{email ?? "Akun"}</p><form action="/api/auth/logout" method="post"><button className="mt-3 flex items-center gap-2 text-sm text-[#F0A93B] underline"><LogOut size={14} />Keluar</button></form></div>
    </aside>
  </>
}
