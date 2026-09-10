"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Loader2,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Package,
  Palette,
  Settings,
  Shield,
  User,
  Users,
  WalletCards,
  X,
} from "lucide-react"

type AdminRole = "super_admin" | "support" | "admin" | string

const groups = [
  {
    label: "Overview",
    items: [
      { href: "/admin/ringkasan", label: "Ringkasan", icon: LayoutDashboard },
    ],
  },
  {
    label: "Manajemen",
    items: [
      { href: "/admin?tab=users", label: "Users", icon: Users },
      {
        href: "/admin?tab=transactions",
        label: "Transaksi",
        icon: WalletCards,
      },
      { href: "/admin?tab=refunds", label: "Refund queue", icon: WalletCards },
      { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
    ],
  },
  {
    label: "Konfigurasi",
    items: [
      { href: "/admin/branding", label: "Branding & SEO", icon: Palette },
      { href: "/admin/newapi-config", label: "NewAPI config", icon: Settings },
      { href: "/admin/models", label: "Model & pricing", icon: BarChart3 },
      { href: "/admin/token-packages", label: "Token packages", icon: Package },
      { href: "/admin/marketing", label: "Marketing banners", icon: Megaphone },
    ],
  },
  {
    label: "Laporan",
    items: [
      {
        href: "/admin?tab=reconciliation",
        label: "Reconciliation",
        icon: BarChart3,
      },
    ],
  },
]

function roleLabel(role: AdminRole) {
  if (role === "super_admin") return "Super Admin"
  if (role === "support") return "Support"
  if (role === "admin") return "Admin"
  return role
}

function roleTone(role: AdminRole) {
  if (role === "super_admin")
    return "border-(--pk-accent)/40 bg-(--pk-accent)/10 text-(--pk-accent)"
  if (role === "support")
    return "border-[#60a5fa]/40 bg-[#60a5fa]/10 text-[#93c5fd]"
  return "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim)"
}

export function AdminSidebar({
  email,
  role,
}: {
  email: string | undefined
  role: AdminRole
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab")

  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [loggingOut, setLoggingOut] = useState(false)

  const allCollapsed = groups.every((g) => collapsed[g.label])

  useEffect(() => {
    if (!menuOpen) return
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null
      if (target?.closest("[data-user-menu]")) return
      setMenuOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onEsc)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onEsc)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!mobileOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false)
    }
    document.addEventListener("keydown", onEsc)
    return () => {
      document.body.style.overflow = original
      document.removeEventListener("keydown", onEsc)
    }
  }, [mobileOpen])

  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [pathname, activeTab])

  function toggleGroup(label: string) {
    setCollapsed((c) => ({ ...c, [label]: !c[label] }))
  }

  function toggleAll() {
    if (allCollapsed) {
      setCollapsed({})
    } else {
      const next: Record<string, boolean> = {}
      groups.forEach((g) => {
        next[g.label] = true
      })
      setCollapsed(next)
    }
  }

  function isActive(href: string) {
    const [itemPath, itemQuery] = href.split("?")
    const itemTab = itemQuery?.replace("tab=", "")
    if (pathname !== itemPath) return false
    if (itemTab) return activeTab === itemTab
    return !activeTab
  }

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    setMenuOpen(false)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // tetap lanjut redirect
    }
    window.location.href = "/"
  }

  const initial = (email?.[0] ?? "A").toUpperCase()

  const NavContent = (
    <nav
      className="pk-scroll mt-3 space-y-4 overflow-y-auto px-3 pb-5"
      aria-label="Navigasi admin"
    >
      {groups.map((group) => {
        const isCollapsed = !!collapsed[group.label]
        return (
          <section key={group.label}>
            <button
              type="button"
              onClick={() => toggleGroup(group.label)}
              aria-expanded={!isCollapsed}
              className="group flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-(--pk-text-mute) transition-colors hover:text-(--pk-text-dim)"
            >
              <span>{group.label}</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${
                  isCollapsed ? "-rotate-90" : "rotate-0"
                }`}
              />
            </button>

            <div
              className={`grid overflow-hidden transition-all duration-200 ease-out ${
                isCollapsed
                  ? "grid-rows-[0fr] opacity-0"
                  : "mt-1 grid-rows-[1fr] opacity-100"
              }`}
            >
              <div className="min-h-0 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`relative flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm transition-all duration-200 ${
                        active
                          ? "bg-linear-to-r from-[#ffc266] to-[#f0a93b] font-semibold text-[#10192b] shadow-[0_10px_28px_-12px_rgba(240,169,59,0.9)]"
                          : "text-(--pk-text-dim) hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon size={16} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })}

      <div className="pt-2">
        <button
          type="button"
          onClick={toggleAll}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium text-(--pk-text-mute) transition-colors hover:bg-white/5 hover:text-(--pk-text-dim)"
        >
          {allCollapsed ? (
            <>
              <ChevronUp size={12} />
              Buka semua grup
            </>
          ) : (
            <>
              <ChevronDown size={12} />
              Tutup semua grup
            </>
          )}
        </button>
      </div>
    </nav>
  )

  const UserMenu = (
    <div data-user-menu className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex w-full items-center gap-3 rounded-xl border border-(--pk-line) bg-[#0b1626]/60 px-3 py-2.5 text-left transition-colors hover:border-(--pk-line-2) hover:bg-[#0b1626]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#ffc266] to-[#f0a93b] text-xs font-bold text-[#10192b]">
          {initial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-(--pk-text)">
            {email ?? "Admin"}
          </span>
          <span className="block text-[10px] uppercase tracking-widest text-(--pk-text-mute)">
            {roleLabel(role)}
          </span>
        </span>
        <span
          aria-hidden
          className={`text-(--pk-text-mute) transition-transform duration-200 ${
            menuOpen ? "rotate-180" : ""
          }`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </span>
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="pk-panel pk-menu-in absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden p-1.5"
        >
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
            <Shield size={14} className="text-(--pk-text-mute)" />
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${roleTone(
                role
              )}`}
            >
              {roleLabel(role)}
            </span>
          </div>

          <div className="my-1 h-px bg-(--pk-line)" />

          <Link
            href="/dashboard"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-(--pk-text-dim) transition-colors hover:bg-white/5 hover:text-white"
          >
            <User size={14} />
            Ke dashboard user
          </Link>
          <Link
            href="/docs"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-(--pk-text-dim) transition-colors hover:bg-white/5 hover:text-white"
          >
            <BookOpen size={14} />
            Dokumentasi
          </Link>

          <div className="my-1 h-px bg-(--pk-line)" />

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-[#fca5a5] transition-colors hover:bg-[#f87171]/10 disabled:cursor-wait disabled:opacity-60"
          >
            {loggingOut ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <LogOut size={14} />
            )}
            {loggingOut ? "Keluar..." : "Keluar"}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Buka menu admin"
        className="pk-panel fixed right-4 top-4 z-30 inline-flex h-11 w-11 items-center justify-center text-(--pk-text) lg:hidden"
      >
        <Menu size={20} />
      </button>

      <aside className="pk-panel fixed bottom-4 left-4 top-4 z-30 hidden w-64 flex-col overflow-hidden lg:flex">
        <div className="flex items-center justify-between gap-2 border-b border-(--pk-line) px-5 py-5">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-base font-semibold tracking-[-0.02em]"
          >
            <span className="pk-logo" aria-hidden />
            <span className="text-(--pk-text)">
              Pakai<span className="text-(--pk-accent)">Kuota</span>
            </span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-(--pk-accent)/40 bg-(--pk-accent)/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-(--pk-accent)">
            Admin
          </span>
        </div>

        <div className="pk-scroll flex-1 overflow-y-auto">{NavContent}</div>

        <div className="border-t border-(--pk-line) p-3">{UserMenu}</div>
      </aside>

      <div
        aria-hidden
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu admin"
        className={`pk-panel fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-b-none rounded-t-3xl transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-center pt-3">
          <span className="h-1.5 w-10 rounded-full bg-(--pk-line-2)" />
        </div>

        <div className="flex items-center justify-between px-5 py-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-base font-semibold"
          >
            <span className="pk-logo" aria-hidden />
            <span className="text-(--pk-text)">
              Pakai<span className="text-(--pk-accent)">Kuota</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-(--pk-line) text-(--pk-text-dim) transition-colors hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="pk-scroll flex-1 overflow-y-auto">{NavContent}</div>

        <div className="border-t border-(--pk-line) p-3">{UserMenu}</div>
      </aside>
    </>
  )
}