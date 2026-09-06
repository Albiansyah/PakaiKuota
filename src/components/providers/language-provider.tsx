"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import type { Locale } from "@/types/i18n"

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const dictionaries: Record<Locale, Record<string, string>> = {
  id: {
    // Navigation
    "nav.home": "Beranda",
    "nav.dashboard": "Dashboard",
    "nav.login": "Masuk",
    "nav.register": "Daftar",
    "nav.logout": "Keluar",
    "nav.docs": "Dokumentasi",
    "nav.status": "Status",
    "nav.settings": "Pengaturan",
    "nav.admin": "Admin",
    "nav.apiKeys": "API Keys",
    "nav.topup": "Top-up",
    "nav.history": "Riwayat",
    "nav.playground": "Playground",
    "nav.reseller": "Reseller",

    // Landing
    "hero.title": "Akses API LLM Termurah di Indonesia",
    "hero.titleAccent": "harga terjangkau",
    "hero.subtitle": "Bayar pakai QRIS. Key aktif dalam hitungan detik. Mulai dari Rp 1.500 per 1 juta tokens.",
    "hero.cta": "Mulai Gratis",
    "hero.docs": "Lihat Docs",
    "hero.note": "Tidak perlu kartu kredit. Registrasi cuma 30 detik.",

    // Features
    "features.title": "Kenapa PakaiKuota?",
    "features.local.title": "QRIS & E-Wallet",
    "features.local.desc": "GoPay, OVO, Dana, LinkAja — tanpa kartu kredit internasional.",
    "features.instant.title": "Key Aktif Instant",
    "features.instant.desc": "Generate API key langsung setelah top-up.",
    "features.price.title": "Harga Transparan",
    "features.price.desc": "Markup jelas per model. Tidak ada biaya tersembunyi.",

    // Models
    "models.title": "Model yang tersedia",
    "models.subtitle": "Harga per 1M tokens (input + output)",
    "models.tier.entry": "Entry",
    "models.tier.premium": "Premium",
    "models.viewAll": "Lihat Semua Model",

    // CTA
    "cta.title": "Siap memulai?",
    "cta.subtitle": "Daftar sekarang dan dapatkan API key dalam hitungan detik.",
    "cta.button": "Daftar Gratis",

    // Trust
    "trust.nocredit": "Tanpa kartu kredit",
    "trust.qris": "Pembayaran QRIS",
    "trust.instant": "Key aktif instant",
    "trust.indonesia": "Support Bahasa Indonesia",

    // Pricing
    "pricing.title": "Harga & Paket",
    "pricing.subtitle": "Pilih paket yang sesuai kebutuhan Anda",
    "pricing.payg": "Bayar Sesuai Pakai",
    "pricing.payg.desc": "Top-up saldo bebas, bayar hanya untuk yang dipakai.",
    "pricing.packages": "Paket Komitmen",
    "pricing.packages.desc": "Kommit lebih lama, harga lebih pasti.",
    "pricing.popular": "Paling Populer",
    "pricing.custom.title": "Butuh Durasi Lain?",
    "pricing.custom.subtitle": "Masukkan durasi dan kuota sendiri",
    "pricing.custom.days": "Jumlah Hari",
    "pricing.custom.quota": "Kuota (Rp)",
    "pricing.custom.total": "Total Harga",
    "pricing.custom.dailyRate": "Tarif/Hari",
    "pricing.custom.buy": "Beli Paket",
    "pricing.pemula.name": "Pemula",
    "pricing.pemula.desc": "Buat coba-coba/testing",
    "pricing.harian.name": "Harian",
    "pricing.harian.desc": "Paling umum buat side project",
    "pricing.pro.name": "Pro",
    "pricing.pro.desc": "Buat produksi kecil",
    "pricing.days": "{n} hari",
    "pricing.quota": "Kuota Rp {n}",
    "pricing.perMonth": "/bulan",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.balance": "Saldo",
    "dashboard.quickActions": "Aksi Cepat",
    "dashboard.createKey": "Buat API Key",
    "dashboard.topup": "Top-up Saldo",
    "dashboard.viewHistory": "Lihat Riwayat",

    // API Keys
    "apikeys.title": "API Keys",
    "apikeys.create": "Buat Key Baru",
    "apikeys.name": "Nama",
    "apikeys.prefix": "Prefix",
    "apikeys.active": "Aktif",
    "apikeys.created": "Dibuat",
    "apikeys.warning": "Simpan key ini. Tidak akan ditampilkan lagi.",
    "apikeys.copy": "Salin",
    "apikeys.revoke": "Revoke",

    // Topup
    "topup.title": "Top-up Saldo",
    "topup.amount": "Jumlah",
    "topup.minimum": "Minimum Rp 1.000",
    "topup.create": "Buat Order",
    "topup.processing": "Memproses...",
    "topup.success": "Pembayaran berhasil!",
    "topup.failed": "Pembayaran gagal.",

    // History
    "history.title": "Riwayat Transaksi",
    "history.date": "Tanggal",
    "history.amount": "Nominal",
    "history.status": "Status",
    "history.action": "Aksi",
    "history.refund": "Refund",
    "history.invoice": "Invoice",

    // Status
    "status.title": "Status Sistem",
    "status.gateway": "Gateway",
    "status.upstream": "Upstream",
    "status.lastUpdate": "Update Terakhir",
    "status.ok": "Normal",
    "status.error": "Gangguan",

    // Settings
    "settings.title": "Pengaturan",
    "settings.privacy": "Mode Privasi",
    "settings.privacyDesc": "Nonaktifkan log isi prompt",
    "settings.delete": "Ajukan Hapus Akun",
    "settings.deleteDesc": "Hapus semua data pribadi",

    // Common
    "common.loading": "Memuat...",
    "common.error": "Terjadi kesalahan",
    "common.success": "Berhasil",
    "common.cancel": "Batal",
    "common.confirm": "Konfirmasi",
    "common.save": "Simpan",
    "common.delete": "Hapus",
    "common.edit": "Edit",
    "common.view": "Lihat",
    "common.active": "Aktif",
    "common.inactive": "Tidak Aktif",
    "common.pending": "Menunggu",
    "common.success_status": "Berhasil",
    "common.failed_status": "Gagal",
    "common.expired": "Kadaluarsa",
    "common.refunded": "Di-refund",
    "common.please_login": "Harap masuk terlebih dahulu.",
    "common.no_data": "Tidak ada data.",

    // Footer
    "footer.copyright": "Hak Dilindungi",
  },
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.dashboard": "Dashboard",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.logout": "Logout",
    "nav.docs": "Docs",
    "nav.status": "Status",
    "nav.settings": "Settings",
    "nav.admin": "Admin",
    "nav.apiKeys": "API Keys",
    "nav.topup": "Top-up",
    "nav.history": "History",
    "nav.playground": "Playground",
    "nav.reseller": "Reseller",

    // Landing
    "hero.title": "Cheapest LLM API Access in Indonesia",
    "hero.titleAccent": "affordable pricing",
    "hero.subtitle": "Pay with QRIS. Key activates in seconds. Starting from Rp 1,500 per 1M tokens.",
    "hero.cta": "Get Started Free",
    "hero.docs": "View Docs",
    "hero.note": "No credit card required. Registration takes 30 seconds.",

    // Features
    "features.title": "Why PakaiKuota?",
    "features.local.title": "QRIS & E-Wallet",
    "features.local.desc": "GoPay, OVO, Dana, LinkAja — no international credit card needed.",
    "features.instant.title": "Instant Key Activation",
    "features.instant.desc": "Generate API key immediately after top-up.",
    "features.price.title": "Transparent Pricing",
    "features.price.desc": "Clear markup per model. No hidden fees.",

    // Models
    "models.title": "Available Models",
    "models.subtitle": "Price per 1M tokens (input + output)",
    "models.tier.entry": "Entry",
    "models.tier.premium": "Premium",
    "models.viewAll": "View All Models",

    // CTA
    "cta.title": "Ready to start?",
    "cta.subtitle": "Sign up now and get an API key in seconds.",
    "cta.button": "Sign Up Free",

    // Trust
    "trust.nocredit": "No credit card",
    "trust.qris": "QRIS Payment",
    "trust.instant": "Instant key activation",
    "trust.indonesia": "Indonesian language support",

    // Pricing
    "pricing.title": "Pricing & Plans",
    "pricing.subtitle": "Choose the plan that fits your needs",
    "pricing.payg": "Pay As You Go",
    "pricing.payg.desc": "Top up freely, pay only for what you use.",
    "pricing.packages": "Commitment Plans",
    "pricing.packages.desc": "Commit longer, get more predictable pricing.",
    "pricing.popular": "Most Popular",
    "pricing.custom.title": "Need Different Duration?",
    "pricing.custom.subtitle": "Enter your own duration and quota",
    "pricing.custom.days": "Number of Days",
    "pricing.custom.quota": "Quota (Rp)",
    "pricing.custom.total": "Total Price",
    "pricing.custom.dailyRate": "Daily Rate",
    "pricing.custom.buy": "Buy Package",
    "pricing.pemula.name": "Starter",
    "pricing.pemula.desc": "For testing and experimentation",
    "pricing.harian.name": "Daily",
    "pricing.harian.desc": "Most common for side projects",
    "pricing.pro.name": "Pro",
    "pricing.pro.desc": "For small production workloads",
    "pricing.days": "{n} days",
    "pricing.quota": "Rp {n} quota",
    "pricing.perMonth": "/month",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.balance": "Balance",
    "dashboard.quickActions": "Quick Actions",
    "dashboard.createKey": "Create API Key",
    "dashboard.topup": "Top-up Balance",
    "dashboard.viewHistory": "View History",

    // API Keys
    "apikeys.title": "API Keys",
    "apikeys.create": "Create New Key",
    "apikeys.name": "Name",
    "apikeys.prefix": "Prefix",
    "apikeys.active": "Active",
    "apikeys.created": "Created",
    "apikeys.warning": "Save this key. It will not be shown again.",
    "apikeys.copy": "Copy",
    "apikeys.revoke": "Revoke",

    // Topup
    "topup.title": "Top-up Balance",
    "topup.amount": "Amount",
    "topup.minimum": "Minimum Rp 1,000",
    "topup.create": "Create Order",
    "topup.processing": "Processing...",
    "topup.success": "Payment successful!",
    "topup.failed": "Payment failed.",

    // History
    "history.title": "Transaction History",
    "history.date": "Date",
    "history.amount": "Amount",
    "history.status": "Status",
    "history.action": "Action",
    "history.refund": "Refund",
    "history.invoice": "Invoice",

    // Status
    "status.title": "System Status",
    "status.gateway": "Gateway",
    "status.upstream": "Upstream",
    "status.lastUpdate": "Last Update",
    "status.ok": "Operational",
    "status.error": "Degraded",

    // Settings
    "settings.title": "Settings",
    "settings.privacy": "Privacy Mode",
    "settings.privacyDesc": "Disable prompt content logging",
    "settings.delete": "Request Account Deletion",
    "settings.deleteDesc": "Delete all personal data",

    // Common
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.success": "Success",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.view": "View",
    "common.active": "Active",
    "common.inactive": "Inactive",
    "common.pending": "Pending",
    "common.success_status": "Success",
    "common.failed_status": "Failed",
    "common.expired": "Expired",
    "common.refunded": "Refunded",
    "common.please_login": "Please login first.",
    "common.no_data": "No data.",

    // Footer
    "footer.copyright": "All Rights Reserved",
  },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("id")

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null
    if (saved && (saved === "id" || saved === "en")) {
      queueMicrotask(() => setLocale(saved))
    }
  }, [])

  const t = (key: string): string => {
    return dictionaries[locale][key] || key
  }

  useEffect(() => {
    localStorage.setItem("locale", locale)
    document.documentElement.lang = locale
  }, [locale])

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
