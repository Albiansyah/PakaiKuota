"use client"

import { LanguageProvider } from "@/components/providers/language-provider"
import { SupabaseProvider } from "@/components/providers/supabase-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <SupabaseProvider>{children}</SupabaseProvider>
    </LanguageProvider>
  )
}
