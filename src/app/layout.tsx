import type { Metadata } from "next"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { SettingsProvider } from "@/components/providers/settings-provider"
import { SupabaseProvider } from "@/components/providers/supabase-provider"
import { LanguageProvider } from "@/components/providers/language-provider"
import "./globals.css"

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  try {
    const res = await fetch(`${baseUrl}/api/settings`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) throw new Error("Failed")
    const { settings } = (await res.json()) as {
      settings: {
        brand_name?: string
        brand_description?: string
        seo_title_template?: string
        seo_default_title?: string
        seo_default_description?: string
        seo_keywords?: string
        og_image_url?: string
        twitter_handle?: string
        favicon_url?: string
      } | null
    }

    if (!settings) throw new Error("No settings")

    return {
      title: {
        default:
          settings.seo_default_title ??
          `${settings.brand_name ?? "PakaiKuota"} — API LLM, Bayar dengan Rupiah`,
        template:
          settings.seo_title_template ??
          `%s — ${settings.brand_name ?? "PakaiKuota"}`,
      },
      description:
        settings.seo_default_description ?? settings.brand_description,
      keywords: settings.seo_keywords
        ?.split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      openGraph: {
        title: settings.seo_default_title,
        description: settings.seo_default_description,
        images: settings.og_image_url ? [settings.og_image_url] : [],
        siteName: settings.brand_name,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        site: settings.twitter_handle ?? undefined,
        title: settings.seo_default_title,
        description: settings.seo_default_description,
        images: settings.og_image_url ? [settings.og_image_url] : [],
      },
      icons: settings.favicon_url
        ? { icon: settings.favicon_url }
        : { icon: "/favicon.ico" },
    }
  } catch {
    // Fallback default
    return {
      title: {
        default: "PakaiKuota — API LLM, Bayar dengan Rupiah",
        template: "%s — PakaiKuota",
      },
      description:
        "Satu API key untuk model LLM yang kamu butuhkan. Isi kuota lewat QRIS atau VA.",
      icons: { icon: "/favicon.ico" },
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <SettingsProvider>
            <SupabaseProvider>
              <LanguageProvider>{children}</LanguageProvider>
            </SupabaseProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}