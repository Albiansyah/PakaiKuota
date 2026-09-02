import type { Metadata } from "next"
import { JetBrains_Mono, Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { LanguageProvider } from "@/components/providers/language-provider"
import { SupabaseProvider } from "@/components/providers/supabase-provider"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "PakaiKuota.id — Akses API Key LLM Termurah",
  description: "Beli akses API key GPT, Claude, Gemini, dll dengan sistem kuota prabayar. Bayar pakai QRIS/e-wallet.",
  metadataBase: new URL("https://pakaikuota.id"),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning className={`${jetbrainsMono.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] antialiased font-sans">
        <ThemeProvider>
          <LanguageProvider>
            <SupabaseProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </SupabaseProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
