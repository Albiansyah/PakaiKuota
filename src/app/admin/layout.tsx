"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Container } from "@/components/layout"
import {
  LayoutDashboard,
  Users,
  Receipt,
  RefreshCw,
  BarChart3,
  Scale,
  Shield,
  Megaphone,
  Bot,
  AlertTriangle,
} from "lucide-react"
import type { ReactNode } from "react"

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/transactions", label: "Transaksi", icon: Receipt },
  { href: "/admin/refunds", label: "Refund", icon: RefreshCw },
  { href: "/admin/models", label: "Models", icon: Bot },
  { href: "/admin/margin", label: "Margin", icon: BarChart3 },
  { href: "/admin/reconciliation", label: "Rekonsiliasi", icon: Scale },
  { href: "/admin/audit-logs", label: "Audit Log", icon: Shield },
  { href: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
  { href: "/admin/anomaly", label: "Anomaly", icon: AlertTriangle },
  { href: "/admin/reseller", label: "Reseller", icon: Users },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-[calc(100dvar(--spacing-nav)*1px)]">
      <Container size="full" className="flex">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-[var(--color-border)] py-6 pr-4 sticky top-[var(--spacing-nav)*1px] h-[calc(100dvh-var(--spacing-nav)*1px)] overflow-y-auto hidden lg:block">
          <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider mb-4 px-3">
            Admin Panel
          </p>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                      : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 py-6 px-6 lg:px-8 min-w-0">
          {/* Mobile nav */}
          <div className="lg:hidden mb-6 overflow-x-auto -mx-6 px-6">
            <div className="flex gap-1">
              {navItems.map((item) => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                      active
                        ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                        : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                    }`}
                  >
                    <item.icon className="h-3 w-3" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          {children}
        </main>
      </Container>
    </div>
  )
}
