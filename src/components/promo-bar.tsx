"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Gift,
  Megaphone,
  Send,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"

/* ============================================================
   TYPES
   ============================================================ */

type BannerTone = "telegram" | "flashsale" | "bonus" | "event" | "info"
type BannerIcon = "sparkles" | "zap" | "gift" | "users" | "send" | "megaphone"

type Banner = {
  id: string
  eyebrow: string
  title: string
  subtitle: string
  cta: string
  href: string
  external: boolean
  tone: BannerTone
  icon: BannerIcon
  sort_order: number
}

/* ============================================================
   TONE STYLES
   ============================================================ */

const toneStyles: Record<BannerTone, { bg: string; icon: string }> = {
  telegram: {
    bg: "from-[#1e4d7b]/40 via-[#0b1626] to-[#0b1626] border-[#4aa8e0]/30",
    icon: "border-[#4aa8e0]/40 bg-[#4aa8e0]/10 text-[#7dd3fc]",
  },
  flashsale: {
    bg: "from-[#7b1e1e]/40 via-[#0b1626] to-[#0b1626] border-[#f87171]/30",
    icon: "border-[#f87171]/40 bg-[#f87171]/10 text-[#fca5a5]",
  },
  bonus: {
    bg: "from-[#7b5e1e]/40 via-[#0b1626] to-[#0b1626] border-[#fbbf24]/30",
    icon: "border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#fcd34d]",
  },
  event: {
    bg: "from-[#1e7b5a]/40 via-[#0b1626] to-[#0b1626] border-[#34d399]/30",
    icon: "border-[#34d399]/40 bg-[#34d399]/10 text-[#6ee7b7]",
  },
  info: {
    bg: "from-(--pk-accent)/20 via-[#0b1626] to-[#0b1626] border-(--pk-accent)/30",
    icon: "border-(--pk-accent)/40 bg-(--pk-accent)/10 text-(--pk-accent)",
  },
}

/* ============================================================
   ICON RESOLVER
   ============================================================ */

function resolveIcon(icon: BannerIcon) {
  switch (icon) {
    case "zap":
      return <Zap size={18} />
    case "gift":
      return <Gift size={18} />
    case "users":
      return <Users size={18} />
    case "send":
      return <Send size={18} />
    case "megaphone":
      return <Megaphone size={18} />
    case "sparkles":
    default:
      return <Sparkles size={18} />
  }
}

/* ============================================================
   PROMO BAR — fetch dari API publik
   ============================================================ */

export function PromoBar() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch banners dari API publik
  useEffect(() => {
    let active = true
    fetch("/api/marketing-banners")
      .then((res) => {
        if (!res.ok) throw new Error("Failed")
        return res.json()
      })
      .then((data: { banners?: Banner[] }) => {
        if (!active) return
        setBanners(data.banners ?? [])
      })
      .catch(() => {
        if (active) setBanners([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Auto-slide
  useEffect(() => {
    if (paused || banners.length <= 1) return
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length)
    }, 6000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [paused, banners.length])

  // Reset index kalau banners berubah
  useEffect(() => {
    setIndex(0)
  }, [banners.length])

  function go(delta: number) {
    if (banners.length === 0) return
    setIndex((i) => (i + delta + banners.length) % banners.length)
  }

  // Tidak render apa-apa kalau tidak ada banner
  if (loading || banners.length === 0) return null

  const banner = banners[index]
  if (!banner) return null

  const tone = toneStyles[banner.tone] ?? toneStyles.info

  return (
    <section
      aria-label="Promo dan pengumuman"
      className="relative border-b border-(--pk-line) bg-[#050b16]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto w-full max-w-7xl px-5 py-3 sm:px-8">
        <div
          className={`relative overflow-hidden rounded-2xl border bg-linear-to-r ${tone.bg}`}
        >
          {/* Konten */}
          <div className="flex items-center gap-4 px-4 py-3 sm:px-5 sm:py-4">
            <span
              className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border sm:flex ${tone.icon}`}
              aria-hidden
            >
              {resolveIcon(banner.icon)}
            </span>

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
                <Sparkles size={10} />
                {banner.eyebrow}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-white sm:text-base">
                {banner.title}
              </p>
              {banner.subtitle && (
                <p className="mt-0.5 hidden truncate text-xs text-(--pk-text-dim) sm:block">
                  {banner.subtitle}
                </p>
              )}
            </div>

            <Link
              href={banner.href}
              target={banner.external ? "_blank" : undefined}
              rel={banner.external ? "noreferrer" : undefined}
              className="pk-btn-primary inline-flex min-h-9 shrink-0 items-center px-3 text-xs font-semibold sm:px-4 sm:text-sm"
            >
              {banner.cta}
            </Link>
          </div>

          {/* Navigasi prev/next (kalau > 1 banner) */}
          {banners.length > 1 && (
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-1.5 sm:px-2">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Promo sebelumnya"
                className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/70 backdrop-blur transition-colors hover:bg-black/60 hover:text-white"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Promo berikutnya"
                className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/70 backdrop-blur transition-colors hover:bg-black/60 hover:text-white"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Dots (kalau > 1 banner) */}
        {banners.length > 1 && (
          <div className="mt-2 flex items-center justify-center gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Tampilkan promo ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={`h-1 rounded-full transition-all ${
                  i === index
                    ? "w-6 bg-(--pk-accent)"
                    : "w-1.5 bg-(--pk-line-2) hover:bg-(--pk-text-mute)"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}