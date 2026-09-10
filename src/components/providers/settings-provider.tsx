"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

export type SiteSettings = {
  id: number
  brand_name: string
  brand_tagline: string | null
  brand_description: string | null
  logo_url: string | null
  logo_dark_url: string | null
  favicon_url: string | null
  accent_color: string | null
  seo_title_template: string | null
  seo_default_title: string | null
  seo_default_description: string | null
  seo_keywords: string | null
  og_image_url: string | null
  twitter_handle: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_address: string | null
  social_telegram: string | null
  social_twitter: string | null
  social_github: string | null
  social_instagram: string | null
  social_linkedin: string | null
  ga_tracking_id: string | null
  meta_pixel_id: string | null
  footer_copyright: string | null
  footer_company_name: string | null
  updated_at: string
  updated_by: string | null
}

type SettingsContextType = {
  settings: SiteSettings | null
  loading: boolean
  refresh: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed")
      const data = (await res.json()) as { settings?: SiteSettings | null }
      setSettings(data.settings ?? null)
    } catch {
      setSettings(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}