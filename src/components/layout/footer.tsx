"use client"

import Link from "next/link"
import { useLanguage } from "@/components/providers/language-provider"
import {
  ArrowUpRight,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react"

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
      { href: "/about", label: "Tentang Kami" },
      { href: "/blog", label: "Blog" },
      { href: "/careers", label: "Karier" },
    ],
    legal: [
      { href: "/tos", label: "Syarat & Ketentuan" },
      { href: "/privacy", label: "Kebijakan Privasi" },
      { href: "/refund", label: "Kebijakan Refund" },
      { href: "/dpa", label: "Data Processing" },
    ],
    support: [
      { href: "/docs/getting-started", label: "Panduan Awal" },
      { href: "/faq", label: "FAQ" },
      {
        href: "https://t.me/+p2LTbZ8y-hZkZWM1",
        label: "Grup Telegram",
        external: true,
      },
      { href: "/contact", label: "Hubungi Kami" },
    ],
  }

  const socials = [
    {
      href: "https://t.me/+p2LTbZ8y-hZkZWM1",
      label: "Telegram",
      icon: <TelegramIcon />,
    },
    {
      href: "https://twitter.com/pakaikuota",
      label: "Twitter / X",
      icon: <XIcon />,
    },
    {
      href: "https://github.com/pakaikuota",
      label: "GitHub",
      icon: <GithubIcon />,
    },
    {
      href: "mailto:support@pakaikuota.id",
      label: "Email",
      icon: <Mail size={14} />,
    },
  ]

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-(--pk-line) bg-[#040a13]/80 backdrop-blur">
      {/* Background decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-(--pk-accent)/40 to-transparent" />
        <div className="absolute -bottom-40 left-1/2 h-80 w-160 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(240,169,59,0.10),transparent_70%)]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-5 pt-14 pb-8 sm:px-8">
        {/* Top: Brand + Newsletter */}
        <div className="grid gap-10 border-b border-(--pk-line) pb-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-base font-semibold tracking-[-0.02em] text-(--pk-text)"
            >
              <PakaiKuotaLogo />
              <span>
                Pakai
                <span className="text-(--pk-accent)">Kuota</span>
              </span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-(--pk-text-dim)">
              Akses API LLM termurah di Indonesia. Bayar pakai QRIS atau VA,
              tanpa kartu kredit. Satu API key untuk semua model.
            </p>

            {/* Status badge */}
            <Link
              href="/status"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-3 py-1.5 text-[11px] font-medium text-[#6ee7b7] transition-colors hover:bg-[#34d399]/20"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34d399] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#34d399]" />
              </span>
              Semua sistem normal
              <ArrowUpRight size={11} />
            </Link>

            {/* Kontak */}
            <ul className="mt-6 space-y-2.5 text-sm text-(--pk-text-dim)">
              <li className="flex items-start gap-2.5">
                <MapPin
                  size={14}
                  className="mt-0.5 shrink-0 text-(--pk-text-mute)"
                />
                <span>
                  PT Ales Cipta Sejahtera
                  <br />
                  Jakarta, Indonesia
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={14} className="shrink-0 text-(--pk-text-mute)" />
                <a
                  href="mailto:support@pakaikuota.id"
                  className="transition-colors hover:text-(--pk-accent)"
                >
                  support@pakaikuota.id
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={14} className="shrink-0 text-(--pk-text-mute)" />
                <a
                  href="https://wa.me/6285184657474"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-(--pk-accent)"
                >
                  +62 851-8465-7474
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter / CTA Telegram */}
          <div className="lg:pl-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-(--pk-accent)">
              Update &amp; komunitas
            </p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-(--pk-text) sm:text-2xl">
              Info rilis model &amp; promo eksklusif.
            </h3>
            <p className="mt-2 text-sm leading-6 text-(--pk-text-dim)">
              Gabung grup Telegram untuk dapat notifikasi model baru, diskon
              topup, dan bantuan dari komunitas developer.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <a
                href="https://t.me/+p2LTbZ8y-hZkZWM1"
                target="_blank"
                rel="noreferrer"
                className="pk-btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm"
              >
                <Send size={14} />
                Gabung Telegram
              </a>
              <Link
                href="/docs"
                className="pk-btn-ghost inline-flex min-h-11 items-center justify-center px-5 text-sm font-medium"
              >
                Baca dokumentasi
              </Link>
            </div>

            {/* Socials */}
            <div className="mt-6 flex items-center gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-mute) transition-colors hover:border-(--pk-accent)/50 hover:text-(--pk-accent)"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Middle: Link columns */}
        <div className="grid grid-cols-2 gap-8 py-10 md:grid-cols-4">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-(--pk-text)">
              Produk
            </h4>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-(--pk-text-dim) transition-colors hover:text-(--pk-accent)"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-(--pk-text)">
              Perusahaan
            </h4>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-(--pk-text-dim) transition-colors hover:text-(--pk-accent)"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-(--pk-text)">
              Dukungan
            </h4>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  {"external" in link && link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-(--pk-text-dim) transition-colors hover:text-(--pk-accent)"
                    >
                      {link.label}
                      <ArrowUpRight size={11} className="opacity-60" />
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-(--pk-text-dim) transition-colors hover:text-(--pk-accent)"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-(--pk-text)">
              Legal
            </h4>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-(--pk-text-dim) transition-colors hover:text-(--pk-accent)"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-(--pk-line) pt-6 text-sm sm:flex-row">
          <p className="text-(--pk-text-mute)">
            © {currentYear} PakaiKuota. {t("footer.copyright")}.
          </p>
          <div className="flex items-center gap-4">
            <p className="font-mono text-xs text-(--pk-text-mute)">
              PT Ales Cipta Sejahtera
            </p>
            <span className="hidden h-3 w-px bg-(--pk-line-2) sm:block" />
            <p className="text-xs text-(--pk-text-mute)">
              Made with <span className="text-(--pk-accent)">♥</span> in
              Indonesia
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ============================================================
   LOGO COMPONENT — Mark + Wordmark
   ============================================================ */

export function PakaiKuotaLogo({ size = 32 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Glow belakang */}
      <span className="absolute inset-0 rounded-[10px] bg-linear-to-br from-[#ffc266] to-[#f0a93b] opacity-30 blur-md" />

      {/* Mark utama */}
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        className="relative"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="pk-logo-grad"
            x1="0"
            y1="0"
            x2="32"
            y2="32"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#ffc266" />
            <stop offset="1" stopColor="#f0a93b" />
          </linearGradient>
          <linearGradient
            id="pk-logo-shine"
            x1="0"
            y1="0"
            x2="0"
            y2="32"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Rounded square base */}
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="9"
          fill="url(#pk-logo-grad)"
        />

        {/* Shine overlay */}
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="9"
          fill="url(#pk-logo-shine)"
        />

        {/* Symbol: "P" + bolt */}
        <path
          d="M11 22.5V10.5C11 9.94772 11.4477 9.5 12 9.5H17.5C19.1569 9.5 20.5 10.8431 20.5 12.5V14.5C20.5 16.1569 19.1569 17.5 17.5 17.5H15V22.5"
          stroke="#10192b"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Small bolt accent */}
        <path
          d="M22 14L19.5 18H21.5L19 22L23 17H21L22.5 14H22Z"
          fill="#10192b"
          opacity="0.85"
        />
      </svg>
    </span>
  )
}

/* ============================================================
   BRAND ICONS (SVG inline — tidak ada di lucide-react v0.4xx)
   ============================================================ */

function TelegramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M21.94 4.3a1.5 1.5 0 0 0-1.53-.22L3.1 11.04a1.5 1.5 0 0 0 .1 2.83l3.72 1.2 1.4 4.5a1.5 1.5 0 0 0 2.4.63l2.03-1.72 3.7 2.72a1.5 1.5 0 0 0 2.36-.9l3.03-14.4a1.5 1.5 0 0 0-.9-1.6ZM10.2 15.02l-.36 2.28-.94-3.03 8.6-5.4-7.3 6.15Z" />
    </svg>
  )
}

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  )
}

function GithubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-1.94c-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.28-1.67-1.28-1.67-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.83 1.19 3.08 0 4.41-2.7 5.38-5.26 5.67.41.35.78 1.05.78 2.12v3.14c0 .31.21.67.8.55 4.56-1.52 7.85-5.83 7.85-10.91C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}