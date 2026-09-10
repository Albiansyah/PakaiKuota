"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useTheme } from "@/components/providers/theme-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useSettings } from "@/components/providers/settings-provider"
import { useAdminRole } from "@/hooks/use-admin-role"
import { PakaiKuotaLogo } from "@/components/brand/pakai-kuota-logo"
import {
  ChevronDown,
  CreditCard,
  Globe,
  History,
  Key,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Settings,
  Shield,
  Sun,
  X,
} from "lucide-react"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale, t } = useLanguage()
  const { user, loading, signOut } = useSupabase()
  const { isAdmin } = useAdminRole()
  const { settings } = useSettings()
  const pathname = usePathname()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)

  const brandName = settings?.brand_name ?? "PakaiKuota"

  const navItems = [
    { href: "/", label: t("nav.home") },
    { href: "/pricing", label: t("pricing.title") },
    { href: "/docs", label: t("nav.docs") },
    { href: "/status", label: t("nav.status") },
  ]

  const userMenuItems = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/dashboard/api-keys", label: t("nav.apiKeys"), icon: Key },
    { href: "/dashboard/topup", label: t("nav.topup"), icon: CreditCard },
    { href: "/dashboard/history", label: t("nav.history"), icon: History },
    { href: "/dashboard/settings", label: t("nav.settings"), icon: Settings },
  ]

  // Tutup semua dropdown saat route berubah
  useEffect(() => {
    setUserMenuOpen(false)
    setThemeMenuOpen(false)
    setLangMenuOpen(false)
    setMobileMenuOpen(false)
  }, [pathname])

  // Tutup semua dropdown saat ESC
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setUserMenuOpen(false)
        setThemeMenuOpen(false)
        setLangMenuOpen(false)
      }
    }
    document.addEventListener("keydown", onEsc)
    return () => document.removeEventListener("keydown", onEsc)
  }, [])

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-(--pk-line) bg-[#050b16]/80 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-base font-semibold tracking-[-0.02em] text-(--pk-text)"
        >
          <PakaiKuotaLogo size={32} />
          <span>{brandName}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-1 text-sm md:flex"
        >
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-10 items-center px-3 transition-colors ${
                  active
                    ? "text-(--pk-accent)"
                    : "text-(--pk-text-dim) hover:text-white"
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute -bottom-px left-2 right-2 h-px bg-(--pk-accent)" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right Side Controls */}
        <div className="flex items-center gap-1">
          {/* Language Toggle */}
          <Dropdown
            open={langMenuOpen}
            onOpenChange={setLangMenuOpen}
            trigger={
              <button
                type="button"
                aria-label="Ganti bahasa"
                aria-haspopup="menu"
                aria-expanded={langMenuOpen}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-(--pk-text-dim) transition-colors hover:bg-white/5 hover:text-white"
              >
                <Globe size={16} />
              </button>
            }
          >
            <DropdownLabel>Bahasa</DropdownLabel>
            <DropdownDivider />
            <DropdownItem
              active={locale === "id"}
              onClick={() => {
                setLocale("id")
                setLangMenuOpen(false)
              }}
            >
              🇮🇩 Indonesia
            </DropdownItem>
            <DropdownItem
              active={locale === "en"}
              onClick={() => {
                setLocale("en")
                setLangMenuOpen(false)
              }}
            >
              🇬🇧 English
            </DropdownItem>
          </Dropdown>

          {/* Theme Toggle */}
          <Dropdown
            open={themeMenuOpen}
            onOpenChange={setThemeMenuOpen}
            trigger={
              <button
                type="button"
                aria-label="Ganti tema"
                aria-haspopup="menu"
                aria-expanded={themeMenuOpen}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-(--pk-text-dim) transition-colors hover:bg-white/5 hover:text-white"
              >
                {theme === "light" && <Sun size={16} />}
                {theme === "dark" && <Moon size={16} />}
                {theme === "system" && <Monitor size={16} />}
              </button>
            }
          >
            <DropdownLabel>Tema</DropdownLabel>
            <DropdownDivider />
            <DropdownItem
              active={theme === "light"}
              onClick={() => {
                setTheme("light")
                setThemeMenuOpen(false)
              }}
            >
              <Sun size={14} />
              Terang
            </DropdownItem>
            <DropdownItem
              active={theme === "dark"}
              onClick={() => {
                setTheme("dark")
                setThemeMenuOpen(false)
              }}
            >
              <Moon size={14} />
              Gelap
            </DropdownItem>
            <DropdownItem
              active={theme === "system"}
              onClick={() => {
                setTheme("system")
                setThemeMenuOpen(false)
              }}
            >
              <Monitor size={14} />
              Sistem
            </DropdownItem>
          </Dropdown>

          {/* User Menu / Auth Buttons */}
          {loading ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-white/5" />
          ) : user ? (
            <Dropdown
              open={userMenuOpen}
              onOpenChange={setUserMenuOpen}
              align="end"
              width="w-56"
              trigger={
                <button
                  type="button"
                  aria-label="Menu akun"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-(--pk-text-dim) transition-colors hover:bg-white/5 hover:text-white"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-(--pk-accent)/40 bg-(--pk-accent)/10 text-xs font-semibold text-(--pk-accent)">
                    {user.email?.[0]?.toUpperCase() || "U"}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-xs sm:inline-block">
                    {user.email?.split("@")[0]}
                  </span>
                  <ChevronDown size={12} className="opacity-60" />
                </button>
              }
            >
              <DropdownLabel>{t("nav.dashboard")}</DropdownLabel>
              <DropdownDivider />
              {userMenuItems.map((item) => (
                <DropdownLink
                  key={item.href}
                  href={item.href}
                  onClick={() => setUserMenuOpen(false)}
                >
                  <item.icon size={14} />
                  {item.label}
                </DropdownLink>
              ))}

              {isAdmin && (
                <>
                  <DropdownDivider />
                  <DropdownLink
                    href="/admin"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Shield size={14} />
                    Admin Panel
                  </DropdownLink>
                </>
              )}

              <DropdownDivider />
              <DropdownItem
                danger
                onClick={() => {
                  setUserMenuOpen(false)
                  void signOut()
                }}
              >
                <LogOut size={14} />
                {t("nav.logout")}
              </DropdownItem>
            </Dropdown>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="flex min-h-10 items-center px-3 text-sm text-(--pk-text-dim) transition-colors hover:text-white"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                className="pk-btn-primary ml-1 inline-flex min-h-10 items-center px-4 text-sm"
              >
                {t("nav.register")}
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-(--pk-text-dim) transition-colors hover:bg-white/5 hover:text-white md:hidden"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-(--pk-line) bg-[#050b16]/95 backdrop-blur-md md:hidden">
          <div className="mx-auto w-full max-w-7xl px-5 py-4 sm:px-8">
            <nav aria-label="Navigasi mobile" className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-(--pk-accent)/10 text-(--pk-accent)"
                        : "text-(--pk-text-dim) hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Auth buttons mobile */}
            {!user && !loading && (
              <div className="mt-4 flex flex-col gap-2 border-t border-(--pk-line) pt-4">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="pk-btn-ghost inline-flex min-h-11 items-center justify-center px-4 text-sm font-medium"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="pk-btn-primary inline-flex min-h-11 items-center justify-center px-4 text-sm"
                >
                  {t("nav.register")}
                </Link>
              </div>
            )}

            {/* Admin link mobile */}
            {user && isAdmin && (
              <div className="mt-4 border-t border-(--pk-line) pt-4">
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-(--pk-accent)/40 bg-(--pk-accent)/10 px-4 text-sm font-medium text-(--pk-accent)"
                >
                  <Shield size={14} />
                  Admin Panel
                </Link>
              </div>
            )}

            {/* Extra controls mobile: theme + lang */}
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-(--pk-line) pt-4">
              <div className="rounded-lg border border-(--pk-line-2) bg-[#0b1626] p-1">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-(--pk-text-mute)">
                  Tema
                </p>
                <div className="flex gap-1">
                  {(
                    [
                      { value: "light", label: "Terang", icon: Sun },
                      { value: "dark", label: "Gelap", icon: Moon },
                      { value: "system", label: "Auto", icon: Monitor },
                    ] as const
                  ).map((opt) => {
                    const Icon = opt.icon
                    const active = theme === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTheme(opt.value)}
                        aria-label={opt.label}
                        className={`flex h-8 flex-1 items-center justify-center gap-1 rounded-md text-[11px] font-medium transition-colors ${
                          active
                            ? "bg-(--pk-accent)/15 text-(--pk-accent)"
                            : "text-(--pk-text-dim) hover:text-white"
                        }`}
                      >
                        <Icon size={12} />
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-(--pk-line-2) bg-[#0b1626] p-1">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-(--pk-text-mute)">
                  Bahasa
                </p>
                <div className="flex gap-1">
                  {(
                    [
                      { value: "id", label: "🇮🇩 ID" },
                      { value: "en", label: "🇬🇧 EN" },
                    ] as const
                  ).map((opt) => {
                    const active = locale === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setLocale(opt.value)}
                        className={`flex h-8 flex-1 items-center justify-center rounded-md text-[11px] font-medium transition-colors ${
                          active
                            ? "bg-(--pk-accent)/15 text-(--pk-accent)"
                            : "text-(--pk-text-dim) hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

/* ============================================================
   DROPDOWN HELPERS — custom, tanpa shadcn
   ============================================================ */

function Dropdown({
  open,
  onOpenChange,
  trigger,
  children,
  align = "end",
  width = "w-48",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "start" | "end"
  width?: string
}) {
  return (
    <div className="relative">
      <div onClick={() => onOpenChange(!open)}>{trigger}</div>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => onOpenChange(false)}
            aria-hidden
          />
          <div
            role="menu"
            className={`absolute top-full z-50 mt-2 ${width} overflow-hidden rounded-xl border border-(--pk-line-2) bg-[#0b1626] p-1.5 shadow-lg ${
              align === "end" ? "right-0" : "left-0"
            }`}
          >
            {children}
          </div>
        </>
      )}
    </div>
  )
}

function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-(--pk-text-mute)">
      {children}
    </p>
  )
}

function DropdownDivider() {
  return <div className="my-1 h-px bg-(--pk-line)" />
}

function DropdownItem({
  children,
  onClick,
  active,
  danger,
}: {
  children: React.ReactNode
  onClick?: () => void
  active?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
        danger
          ? "text-[#fca5a5] hover:bg-[#f87171]/10"
          : active
            ? "text-(--pk-accent)"
            : "text-(--pk-text-dim) hover:bg-white/5 hover:text-white"
      }`}
    >
      {children}
    </button>
  )
}

function DropdownLink({
  href,
  onClick,
  children,
}: {
  href: string
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-(--pk-text-dim) transition-colors hover:bg-white/5 hover:text-white"
    >
      {children}
    </Link>
  )
}