"use client"

import Link from "next/link"
import { useLanguage } from "@/components/providers/language-provider"
import { Separator } from "@/components/ui/separator"
import { Container } from "@/components/layout"

export function Footer() {
  const { t } = useLanguage()
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { href: "/pricing", label: t("pricing.title") },
      { href: "/docs", label: t("nav.docs") },
      { href: "/status", label: t("nav.status") },
      { href: "/playground", label: t("nav.playground") },
    ],
    company: [
      { href: "/reseller", label: t("nav.reseller") },
    ],
    legal: [
      { href: "/tos", label: "Syarat & Ketentuan" },
      { href: "/privacy", label: "Kebijakan Privasi" },
      { href: "/refund", label: "Kebijakan Refund" },
    ],
  }

  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--bg-surface)] mt-auto">
      <Container>
        <div className="py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 font-semibold text-[var(--text-primary)] mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)]">
                  <span className="font-mono text-sm font-bold text-[var(--bg-base)]">PK</span>
                </div>
                <span>PakaiKuota</span>
              </Link>
              <p className="text-sm text-[var(--text-secondary)]">
                Akses API LLM termurah di Indonesia. Bayar pakai QRIS, tanpa kartu kredit.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-medium mb-3 text-sm text-[var(--text-primary)]">Produk</h4>
              <ul className="space-y-2">
                {footerLinks.product.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-medium mb-3 text-sm text-[var(--text-primary)]">Perusahaan</h4>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-medium mb-3 text-sm text-[var(--text-primary)]">Legal</h4>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--text-tertiary)]">
            <p>© {currentYear} PakaiKuota. {t("footer.copyright")}.</p>
            <p className="text-xs font-mono">PT Ales Cipta Sejahtera</p>
          </div>
        </div>
      </Container>
    </footer>
  )
}
