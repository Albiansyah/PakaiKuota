"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  BookOpen,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Settings,
  User,
  WalletCards,
  X,
} from "lucide-react"

const groups = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
    ],
  },
  {
    label: "Akun",
    items: [
      { href: "/dashboard/keys", label: "API keys", icon: KeyRound },
      { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
    ],
  },
  {
    label: "Keuangan",
    items: [
      { href: "/dashboard/topup", label: "Beli kuota", icon: Package },
      { href: "/dashboard/transactions", label: "Transaksi", icon: ReceiptText },
      { href: "/dashboard/ledger", label: "Mutasi saldo", icon: WalletCards },
      { href: "/dashboard/refunds", label: "Refund", icon: WalletCards },
    ],
  },
  {
    label: "Developer",
    items: [
      { href: "/dashboard/playground", label: "Playground", icon: KeyRound },
      { href: "/docs", label: "Dokumentasi", icon: BookOpen },
    ],
  },
]

export function DashboardSidebar({ email }: { email: string | undefined }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

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
  }, [pathname])

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    setMenuOpen(false)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // tetap lanjut ke redirect
    }
    window.location.href = "/"
  }

  const initial = (email?.[0] ?? "A").toUpperCase()

  const NavContent = (
    <nav
      className="pk-scroll mt-3 space-y-5 overflow-y-auto px-3 pb-5"
      aria-label="Navigasi dashboard"
    >
      {groups.map((group) => (
        <section key={group.label}>
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-text-mute)]">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname?.startsWith(item.href + "/"))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`relative flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-[#ffc266] to-[#f0a93b] font-semibold text-[#10192b] shadow-[0_10px_28px_-12px_rgba(240,169,59,0.9)]"
                      : "text-[color:var(--pk-text-dim)] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </nav>
  )

  const UserMenu = (
    <div data-user-menu className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex w-full items-center gap-3 rounded-xl border border-[color:var(--pk-line)] bg-[#0b1626]/60 px-3 py-2.5 text-left transition-colors hover:border-[color:var(--pk-line-2)] hover:bg-[#0b1626]"
      >
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#ffc266] to-[#f0a93b] text-xs font-bold text-[#10192b]">
          {initial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-[color:var(--pk-text)]">
            {email ?? "Akun"}
          </span>
          <span className="block text-[10px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
            User
          </span>
        </span>
        <span
          aria-hidden
          className={`text-[color:var(--pk-text-mute)] transition-transform duration-200 ${
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
          className="pk-panel pk-menu-in absolute bottom-full left-0 right-0 mb-2 z-20 overflow-hidden p-1.5"
        >
          <Link
            href="/dashboard/settings"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[color:var(--pk-text-dim)] transition-colors hover:bg-white/5 hover:text-white"
          >
            <User size={14} />
            Profil &amp; pengaturan
          </Link>
          <Link
            href="/docs"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[color:var(--pk-text-dim)] transition-colors hover:bg-white/5 hover:text-white"
          >
            <BookOpen size={14} />
            Dokumentasi
          </Link>
          <div className="my-1 h-px bg-[color:var(--pk-line)]" />
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
        aria-label="Buka menu"
        className="pk-panel fixed right-4 top-4 z-30 inline-flex h-11 w-11 items-center justify-center text-[color:var(--pk-text)] lg:hidden"
      >
        <Menu size={20} />
      </button>

      <aside className="pk-panel fixed bottom-4 left-4 top-4 z-30 hidden w-64 flex-col overflow-hidden lg:flex">
        <div className="flex items-center gap-2.5 border-b border-[color:var(--pk-line)] px-5 py-5">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-base font-semibold tracking-[-0.02em]"
          >
            <span className="pk-logo" aria-hidden />
            <span className="text-[color:var(--pk-text)]">
              Pakai<span className="text-[color:var(--pk-accent)]">Kuota</span>
            </span>
          </Link>
        </div>

        <div className="pk-scroll flex-1 overflow-y-auto">{NavContent}</div>

        <div className="border-t border-[color:var(--pk-line)] p-3">{UserMenu}</div>
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
        aria-label="Menu dashboard"
        className={`pk-panel fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-b-none rounded-t-3xl transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-center pt-3">
          <span className="h-1.5 w-10 rounded-full bg-[color:var(--pk-line-2)]" />
        </div>

        <div className="flex items-center justify-between px-5 py-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-base font-semibold"
          >
            <span className="pk-logo" aria-hidden />
            <span className="text-[color:var(--pk-text)]">
              Pakai<span className="text-[color:var(--pk-accent)]">Kuota</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--pk-line)] text-[color:var(--pk-text-dim)] transition-colors hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="pk-scroll flex-1 overflow-y-auto">{NavContent}</div>

        <div className="border-t border-[color:var(--pk-line)] p-3">{UserMenu}</div>
      </aside>
    </>
  )
}