"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "@/components/providers/theme-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sun,
  Moon,
  Monitor,
  Globe,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Key,
  CreditCard,
  History,
  Settings,
  Shield,
  LogOut,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/cn"
import { Container } from "@/components/layout"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale, t } = useLanguage()
  const { user, loading, signOut } = useSupabase()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border-color)] bg-[var(--bg-base)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg-base)]/60">
      <Container>
        <div className="flex h-14 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)]">
            <span className="font-mono text-sm font-bold text-[var(--bg-base)]">PK</span>
          </div>
          <span className="hidden sm:inline-block">PakaiKuota</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-[var(--radius-sm)] transition-colors",
                pathname === item.href
                  ? "text-[var(--accent-text)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Side Controls */}
        <div className="flex items-center gap-1">
          {/* Language Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-[var(--text-secondary)]">
                <Globe className="h-4 w-4" />
                <span className="sr-only">Language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[var(--bg-surface)] border-[var(--border-color)]">
              <DropdownMenuLabel className="text-[var(--text-secondary)]">Language</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[var(--border-color)]" />
              <DropdownMenuItem
                onClick={() => setLocale("id")}
                className={cn(
                  "focus:bg-[var(--bg-surface-hover)] focus:text-[var(--text-primary)]",
                  locale === "id" && "text-[var(--accent-text)]"
                )}
              >
                🇮🇩 Indonesia
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLocale("en")}
                className={cn(
                  "focus:bg-[var(--bg-surface-hover)] focus:text-[var(--text-primary)]",
                  locale === "en" && "text-[var(--accent-text)]"
                )}
              >
                🇬🇧 English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-[var(--text-secondary)]">
                {theme === "light" && <Sun className="h-4 w-4" />}
                {theme === "dark" && <Moon className="h-4 w-4" />}
                {theme === "system" && <Monitor className="h-4 w-4" />}
                <span className="sr-only">Theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[var(--bg-surface)] border-[var(--border-color)]">
              <DropdownMenuLabel className="text-[var(--text-secondary)]">Tema</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[var(--border-color)]" />
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className="focus:bg-[var(--bg-surface-hover)] focus:text-[var(--text-primary)]"
              >
                <Sun className="mr-2 h-4 w-4" />
                Terang
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className="focus:bg-[var(--bg-surface-hover)] focus:text-[var(--text-primary)]"
              >
                <Moon className="mr-2 h-4 w-4" />
                Gelap
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("system")}
                className="focus:bg-[var(--bg-surface-hover)] focus:text-[var(--text-primary)]"
              >
                <Monitor className="mr-2 h-4 w-4" />
                Sistem
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          {loading ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-[var(--text-secondary)]">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-surface)] text-xs font-medium">
                    {user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:inline-block truncate max-w-[120px]">
                    {user.email?.split("@")[0]}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[var(--bg-surface)] border-[var(--border-color)]">
                <DropdownMenuLabel className="text-[var(--text-secondary)]">
                  {t("nav.dashboard")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[var(--border-color)]" />
                {userMenuItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center gap-2 cursor-pointer focus:bg-[var(--bg-surface-hover)]">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                {user.role === "super_admin" && (
                  <>
                    <DropdownMenuSeparator className="bg-[var(--border-color)]" />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 cursor-pointer focus:bg-[var(--bg-surface-hover)]">
                        <Shield className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator className="bg-[var(--border-color)]" />
                <DropdownMenuItem
                  onClick={signOut}
                  className="text-[var(--error)] focus:text-[var(--error)] focus:bg-[var(--error)]/10 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-[var(--text-secondary)]">
                  {t("nav.login")}
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="accent" size="sm">
                  {t("nav.register")}
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 text-[var(--text-secondary)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
            <span className="sr-only">Menu</span>
          </Button>
        </div>
        </div>
      </Container>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--border-color)] bg-[var(--bg-base)]">
          <Container>
            <nav className="py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block px-3 py-2 text-sm font-medium rounded-[var(--radius-sm)] transition-colors",
                  pathname === item.href
                    ? "text-[var(--accent-text)]"
                    : "text-[var(--text-secondary)]"
                )}
              >
                {item.label}
              </Link>
            ))}
            {!user && (
              <div className="pt-2 flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="accent" className="w-full">
                    {t("nav.register")}
                  </Button>
                </Link>
              </div>
            )}
          </nav>
          </Container>
        </div>
      )}
    </header>
  )
}
