"use client"

import { LanguageProvider } from "@/components/providers/language-provider"
import { SupabaseProvider } from "@/components/providers/supabase-provider"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <SupabaseProvider>{children}</SupabaseProvider>
      <Toaster position="top-right" richColors />
    </LanguageProvider>
  )
}
