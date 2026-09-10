"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useSettings } from "@/components/providers/settings-provider"
import { toast } from "sonner"
import {
  Building2,
  Check,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Palette,
  RefreshCw,
  Save,
  Search,
  Share2,
  Trash2,
  Upload,
  X,
} from "lucide-react"

/* ============================================================
   TYPES
   ============================================================ */

type SiteSettingsForm = {
  brand_name: string
  brand_tagline: string
  brand_description: string
  logo_url: string
  logo_dark_url: string
  favicon_url: string
  accent_color: string
  seo_title_template: string
  seo_default_title: string
  seo_default_description: string
  seo_keywords: string
  og_image_url: string
  twitter_handle: string
  contact_email: string
  contact_phone: string
  contact_address: string
  social_telegram: string
  social_twitter: string
  social_github: string
  social_instagram: string
  social_linkedin: string
  ga_tracking_id: string
  meta_pixel_id: string
  footer_copyright: string
  footer_company_name: string
}

const EMPTY_FORM: SiteSettingsForm = {
  brand_name: "PakaiKuota",
  brand_tagline: "",
  brand_description: "",
  logo_url: "",
  logo_dark_url: "",
  favicon_url: "",
  accent_color: "#f0a93b",
  seo_title_template: "%s — PakaiKuota",
  seo_default_title: "PakaiKuota — API LLM, Bayar dengan Rupiah",
  seo_default_description: "",
  seo_keywords: "",
  og_image_url: "",
  twitter_handle: "",
  contact_email: "",
  contact_phone: "",
  contact_address: "",
  social_telegram: "",
  social_twitter: "",
  social_github: "",
  social_instagram: "",
  social_linkedin: "",
  ga_tracking_id: "",
  meta_pixel_id: "",
  footer_copyright: "",
  footer_company_name: "",
}

const inputClass =
  "min-h-10 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] px-3 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25 disabled:opacity-60"

/* ============================================================
   UPLOAD HELPER
   ============================================================ */

async function uploadImage(
  supabase: ReturnType<typeof useSupabase>["supabase"],
  file: File,
  prefix: string
): Promise<string> {
  const ext = file.name.split(".").pop() || "png"
  const path = `${prefix}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from("branding")
    .upload(path, file, { upsert: true, cacheControl: "3600" })

  if (error) throw error

  const { data } = supabase.storage.from("branding").getPublicUrl(path)
  return data.publicUrl
}

/* ============================================================
   PAGE
   ============================================================ */

export default function AdminBrandingPage() {
  const { supabase } = useSupabase()
  const { refresh: refreshSettings } = useSettings()

  const [form, setForm] = useState<SiteSettingsForm>(EMPTY_FORM)
  const [originalForm, setOriginalForm] = useState<SiteSettingsForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const [uploadingField, setUploadingField] = useState<string | null>(null)

  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const logoDarkInputRef = useRef<HTMLInputElement | null>(null)
  const faviconInputRef = useRef<HTMLInputElement | null>(null)
  const ogImageInputRef = useRef<HTMLInputElement | null>(null)

  const fetchSettings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(false)
    try {
      const res = await fetch("/api/admin/settings")
      if (!res.ok) throw new Error("Failed")
      const data = (await res.json()) as {
        settings: Record<string, unknown> | null
      }

      if (data.settings) {
        const s = data.settings as Record<string, unknown>
        const next: SiteSettingsForm = {
          brand_name: String(s.brand_name ?? ""),
          brand_tagline: String(s.brand_tagline ?? ""),
          brand_description: String(s.brand_description ?? ""),
          logo_url: String(s.logo_url ?? ""),
          logo_dark_url: String(s.logo_dark_url ?? ""),
          favicon_url: String(s.favicon_url ?? ""),
          accent_color: String(s.accent_color ?? "#f0a93b"),
          seo_title_template: String(s.seo_title_template ?? ""),
          seo_default_title: String(s.seo_default_title ?? ""),
          seo_default_description: String(s.seo_default_description ?? ""),
          seo_keywords: String(s.seo_keywords ?? ""),
          og_image_url: String(s.og_image_url ?? ""),
          twitter_handle: String(s.twitter_handle ?? ""),
          contact_email: String(s.contact_email ?? ""),
          contact_phone: String(s.contact_phone ?? ""),
          contact_address: String(s.contact_address ?? ""),
          social_telegram: String(s.social_telegram ?? ""),
          social_twitter: String(s.social_twitter ?? ""),
          social_github: String(s.social_github ?? ""),
          social_instagram: String(s.social_instagram ?? ""),
          social_linkedin: String(s.social_linkedin ?? ""),
          ga_tracking_id: String(s.ga_tracking_id ?? ""),
          meta_pixel_id: String(s.meta_pixel_id ?? ""),
          footer_copyright: String(s.footer_copyright ?? ""),
          footer_company_name: String(s.footer_company_name ?? ""),
        }
        setForm(next)
        setOriginalForm(next)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void fetchSettings()
  }, [fetchSettings])

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(originalForm),
    [form, originalForm]
  )

  function updateField<K extends keyof SiteSettingsForm>(
    key: K,
    value: SiteSettingsForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleUpload(
    field: "logo_url" | "logo_dark_url" | "favicon_url" | "og_image_url",
    file: File
  ) {
    setUploadingField(field)
    try {
      const url = await uploadImage(supabase, file, field.replace("_url", ""))
      updateField(field, url)
      toast.success("Gambar berhasil diupload. Klik Simpan untuk menerapkan.")
    } catch (err) {
      console.error("Upload failed:", err)
      toast.error("Gagal upload gambar")
    } finally {
      setUploadingField(null)
    }
  }

  async function save() {
    if (!form.brand_name.trim()) {
      toast.error("Brand name wajib diisi")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed")

      toast.success("Branding berhasil disimpan")
      setOriginalForm(form)
      await refreshSettings()
    } catch {
      toast.error("Gagal menyimpan branding")
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setForm(originalForm)
    toast.info("Perubahan dibatalkan")
  }

  return (
    <div className="relative min-h-screen text-(--pk-text)">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-(--pk-line) bg-[#070f1e]/80 px-5 py-6 backdrop-blur-md sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
                Admin tool
              </p>
              <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                <Palette size={24} className="text-(--pk-accent)" />
                Branding & SEO
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-(--pk-text-dim)">
                Kustomisasi logo, brand name, warna, SEO, dan info kontak untuk
                semua halaman.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchSettings(true)}
                disabled={refreshing}
                aria-label="Refresh"
                className="pk-btn-ghost inline-flex h-10 w-10 items-center justify-center disabled:opacity-60"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dirty bar */}
      {dirty && (
        <div className="sticky top-[105px] z-10 border-b border-[#fbbf24]/30 bg-[#fbbf24]/10 px-5 py-2.5 sm:px-8">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 text-sm">
            <p className="text-[#fcd34d]">
              Ada perubahan yang belum disimpan.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reset}
                disabled={saving}
                className="text-xs text-(--pk-text-dim) hover:text-white"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="pk-btn-primary inline-flex min-h-8 items-center gap-1.5 px-3 text-xs disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Save size={11} />
                )}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        {error && (
          <div className="pk-panel mb-6 p-5 text-center">
            <p className="text-sm text-[#fca5a5]">
              Data branding tidak bisa dimuat.
            </p>
            <button
              type="button"
              onClick={() => void fetchSettings()}
              className="pk-btn-ghost mt-4 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
            >
              Coba lagi
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2
              size={24}
              className="animate-spin text-(--pk-text-mute)"
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* ============ BRAND IDENTITY ============ */}
            <section className="pk-panel p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
                  <Building2 size={18} className="text-(--pk-accent)" />
                </span>
                <div>
                  <h2 className="text-base font-semibold">
                    Identitas Brand
                  </h2>
                  <p className="mt-0.5 text-xs text-(--pk-text-mute)">
                    Nama, tagline, dan deskripsi yang tampil di navbar dan
                    footer.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium">
                    Nama brand <span className="text-(--pk-accent)">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.brand_name}
                    onChange={(e) => updateField("brand_name", e.target.value)}
                    placeholder="PakaiKuota"
                    className={`${inputClass} mt-1.5`}
                  />
                  <p className="mt-1 text-[11px] text-(--pk-text-mute)">
                    Tampil di navbar, footer, dan title halaman.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium">Tagline</label>
                  <input
                    type="text"
                    value={form.brand_tagline}
                    onChange={(e) =>
                      updateField("brand_tagline", e.target.value)
                    }
                    placeholder="API LLM, Bayar dengan Rupiah"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium">Deskripsi</label>
                  <textarea
                    rows={3}
                    value={form.brand_description}
                    onChange={(e) =>
                      updateField("brand_description", e.target.value)
                    }
                    placeholder="Akses API LLM termurah di Indonesia..."
                    className={`${inputClass} mt-1.5 resize-none`}
                  />
                </div>
              </div>
            </section>

            {/* ============ LOGO & ICON ============ */}
            <section className="pk-panel p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
                  <ImageIcon size={18} className="text-(--pk-accent)" />
                </span>
                <div>
                  <h2 className="text-base font-semibold">Logo & Ikon</h2>
                  <p className="mt-0.5 text-xs text-(--pk-text-mute)">
                    Upload logo utama, versi dark, dan favicon. Format: PNG, SVG,
                    atau WebP. Max 2MB.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-3">
                <UploadField
                  label="Logo Utama"
                  description="Tampil di navbar & footer"
                  value={form.logo_url}
                  onChange={(url) => updateField("logo_url", url)}
                  onUpload={(file) => void handleUpload("logo_url", file)}
                  uploading={uploadingField === "logo_url"}
                  inputRef={logoInputRef}
                  previewBg="bg-[#0b1626]"
                />

                <UploadField
                  label="Logo Dark (opsional)"
                  description="Untuk tema terang"
                  value={form.logo_dark_url}
                  onChange={(url) => updateField("logo_dark_url", url)}
                  onUpload={(file) => void handleUpload("logo_dark_url", file)}
                  uploading={uploadingField === "logo_dark_url"}
                  inputRef={logoDarkInputRef}
                  previewBg="bg-white"
                />

                <UploadField
                  label="Favicon"
                  description="Tampil di tab browser"
                  value={form.favicon_url}
                  onChange={(url) => updateField("favicon_url", url)}
                  onUpload={(file) => void handleUpload("favicon_url", file)}
                  uploading={uploadingField === "favicon_url"}
                  inputRef={faviconInputRef}
                  previewBg="bg-[#0b1626]"
                  square
                />
              </div>
            </section>

            {/* ============ ACCENT COLOR ============ */}
            <section className="pk-panel p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
                  <Palette size={18} className="text-(--pk-accent)" />
                </span>
                <div>
                  <h2 className="text-base font-semibold">Warna Accent</h2>
                  <p className="mt-0.5 text-xs text-(--pk-text-mute)">
                    Warna utama untuk tombol, link, dan highlight.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.accent_color}
                    onChange={(e) =>
                      updateField("accent_color", e.target.value)
                    }
                    className="h-11 w-16 cursor-pointer rounded-xl border border-(--pk-line-2) bg-[#0b1626] p-1"
                  />
                  <input
                    type="text"
                    value={form.accent_color}
                    onChange={(e) =>
                      updateField("accent_color", e.target.value)
                    }
                    placeholder="#f0a93b"
                    className={`${inputClass} w-32 font-mono`}
                  />
                </div>

                {/* Preview */}
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex min-h-9 items-center rounded-xl px-4 text-xs font-semibold text-[#10192b]"
                    style={{ backgroundColor: form.accent_color }}
                  >
                    Preview tombol
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: form.accent_color }}
                  >
                    Preview link
                  </span>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-(--pk-text-mute)">
                Catatan: warna ini akan di-override di CSS. Untuk mengubah
                warna site-wide, pastikan CSS Anda membaca dari settings ini.
              </p>
            </section>

            {/* ============ SEO ============ */}
            <section className="pk-panel p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
                  <Search size={18} className="text-(--pk-accent)" />
                </span>
                <div>
                  <h2 className="text-base font-semibold">SEO</h2>
                  <p className="mt-0.5 text-xs text-(--pk-text-mute)">
                    Meta title, description, keywords, dan Open Graph untuk
                    preview saat dibagikan.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-medium">
                    Default title
                  </label>
                  <input
                    type="text"
                    value={form.seo_default_title}
                    onChange={(e) =>
                      updateField("seo_default_title", e.target.value)
                    }
                    placeholder="PakaiKuota — API LLM, Bayar dengan Rupiah"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">
                    Title template (per halaman)
                  </label>
                  <input
                    type="text"
                    value={form.seo_title_template}
                    onChange={(e) =>
                      updateField("seo_title_template", e.target.value)
                    }
                    placeholder="%s — PakaiKuota"
                    className={`${inputClass} mt-1.5`}
                  />
                  <p className="mt-1 text-[11px] text-(--pk-text-mute)">
                    Gunakan <code className="font-mono">%s</code> sebagai
                    placeholder untuk title halaman. Contoh:{" "}
                    <code className="font-mono">Harga — PakaiKuota</code>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium">
                    Default description
                  </label>
                  <textarea
                    rows={3}
                    value={form.seo_default_description}
                    onChange={(e) =>
                      updateField("seo_default_description", e.target.value)
                    }
                    placeholder="Satu API key untuk model LLM..."
                    className={`${inputClass} mt-1.5 resize-none`}
                  />
                  <p className="mt-1 text-[11px] text-(--pk-text-mute)">
                    Rekomendasi: 120-160 karakter
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium">
                    Keywords (pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={form.seo_keywords}
                    onChange={(e) =>
                      updateField("seo_keywords", e.target.value)
                    }
                    placeholder="api llm, ai indonesia, qris"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">
                    Twitter handle
                  </label>
                  <input
                    type="text"
                    value={form.twitter_handle}
                    onChange={(e) =>
                      updateField("twitter_handle", e.target.value)
                    }
                    placeholder="@pakaikuota"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">
                    Open Graph image
                  </label>
                  <p className="mt-1 text-[11px] text-(--pk-text-mute)">
                    Tampil saat link dibagikan di WhatsApp, Twitter, Facebook.
                    Ukuran ideal: 1200×630px.
                  </p>

                  <div className="mt-2 flex items-start gap-3">
                    {form.og_image_url ? (
                      <div className="relative h-32 w-56 overflow-hidden rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.og_image_url}
                          alt="OG preview"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => updateField("og_image_url", "")}
                          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white transition-colors hover:bg-black/80"
                          aria-label="Hapus gambar"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-32 w-56 items-center justify-center rounded-xl border border-dashed border-(--pk-line-2) bg-[#0b1626]">
                        <ImageIcon
                          size={22}
                          className="text-(--pk-text-mute)"
                        />
                      </div>
                    )}

                    <div>
                      <input
                        ref={ogImageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) void handleUpload("og_image_url", file)
                          e.target.value = ""
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => ogImageInputRef.current?.click()}
                        disabled={uploadingField === "og_image_url"}
                        className="pk-btn-ghost inline-flex min-h-10 items-center gap-2 px-4 text-sm disabled:opacity-60"
                      >
                        {uploadingField === "og_image_url" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                        {uploadingField === "og_image_url"
                          ? "Mengunggah..."
                          : "Upload"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ============ KONTAK ============ */}
            <section className="pk-panel p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
                  <Building2 size={18} className="text-(--pk-accent)" />
                </span>
                <div>
                  <h2 className="text-base font-semibold">Kontak</h2>
                  <p className="mt-0.5 text-xs text-(--pk-text-mute)">
                    Info kontak yang tampil di footer.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium">Email</label>
                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={(e) =>
                      updateField("contact_email", e.target.value)
                    }
                    placeholder="support@pakaikuota.id"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">Telepon</label>
                  <input
                    type="tel"
                    value={form.contact_phone}
                    onChange={(e) =>
                      updateField("contact_phone", e.target.value)
                    }
                    placeholder="+6285184657474"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium">Alamat</label>
                  <input
                    type="text"
                    value={form.contact_address}
                    onChange={(e) =>
                      updateField("contact_address", e.target.value)
                    }
                    placeholder="Jakarta, Indonesia"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>
              </div>
            </section>

            {/* ============ SOCIAL MEDIA ============ */}
            <section className="pk-panel p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
                  <Share2 size={18} className="text-(--pk-accent)" />
                </span>
                <div>
                  <h2 className="text-base font-semibold">Social Media</h2>
                  <p className="mt-0.5 text-xs text-(--pk-text-mute)">
                    Link sosial media yang tampil di footer.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium">Telegram</label>
                  <input
                    type="url"
                    value={form.social_telegram}
                    onChange={(e) =>
                      updateField("social_telegram", e.target.value)
                    }
                    placeholder="https://t.me/+xxx"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">Twitter / X</label>
                  <input
                    type="url"
                    value={form.social_twitter}
                    onChange={(e) =>
                      updateField("social_twitter", e.target.value)
                    }
                    placeholder="https://twitter.com/xxx"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">GitHub</label>
                  <input
                    type="url"
                    value={form.social_github}
                    onChange={(e) =>
                      updateField("social_github", e.target.value)
                    }
                    placeholder="https://github.com/xxx"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">Instagram</label>
                  <input
                    type="url"
                    value={form.social_instagram}
                    onChange={(e) =>
                      updateField("social_instagram", e.target.value)
                    }
                    placeholder="https://instagram.com/xxx"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium">LinkedIn</label>
                  <input
                    type="url"
                    value={form.social_linkedin}
                    onChange={(e) =>
                      updateField("social_linkedin", e.target.value)
                    }
                    placeholder="https://linkedin.com/company/xxx"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>
              </div>
            </section>

            {/* ============ ANALYTICS ============ */}
            <section className="pk-panel p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
                  <ExternalLink size={18} className="text-(--pk-accent)" />
                </span>
                <div>
                  <h2 className="text-base font-semibold">Analytics</h2>
                  <p className="mt-0.5 text-xs text-(--pk-text-mute)">
                    Tracking ID untuk Google Analytics & Meta Pixel.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium">
                    Google Analytics ID
                  </label>
                  <input
                    type="text"
                    value={form.ga_tracking_id}
                    onChange={(e) =>
                      updateField("ga_tracking_id", e.target.value)
                    }
                    placeholder="G-XXXXXXXXXX"
                    className={`${inputClass} mt-1.5 font-mono`}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">
                    Meta Pixel ID
                  </label>
                  <input
                    type="text"
                    value={form.meta_pixel_id}
                    onChange={(e) =>
                      updateField("meta_pixel_id", e.target.value)
                    }
                    placeholder="1234567890"
                    className={`${inputClass} mt-1.5 font-mono`}
                  />
                </div>
              </div>
            </section>

            {/* ============ FOOTER ============ */}
            <section className="pk-panel p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
                  <Building2 size={18} className="text-(--pk-accent)" />
                </span>
                <div>
                  <h2 className="text-base font-semibold">Footer</h2>
                  <p className="mt-0.5 text-xs text-(--pk-text-mute)">
                    Teks yang tampil di bagian bawah website.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium">
                    Copyright text
                  </label>
                  <input
                    type="text"
                    value={form.footer_copyright}
                    onChange={(e) =>
                      updateField("footer_copyright", e.target.value)
                    }
                    placeholder="Seluruh hak cipta dilindungi."
                    className={`${inputClass} mt-1.5`}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">
                    Nama perusahaan
                  </label>
                  <input
                    type="text"
                    value={form.footer_company_name}
                    onChange={(e) =>
                      updateField("footer_company_name", e.target.value)
                    }
                    placeholder="PT Ales Cipta Sejahtera"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>
              </div>
            </section>

            {/* ============ STICKY SAVE BAR ============ */}
            <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-(--pk-line-2) bg-[#0b1626]/95 p-3 backdrop-blur-md shadow-lg">
              <p className="text-xs text-(--pk-text-mute)">
                {dirty
                  ? "Ada perubahan yang belum disimpan."
                  : "Semua perubahan sudah tersimpan."}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={reset}
                  disabled={!dirty || saving}
                  className="pk-btn-ghost inline-flex min-h-10 items-center gap-2 px-4 text-sm disabled:opacity-40"
                >
                  <X size={14} />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={!dirty || saving}
                  className="pk-btn-primary inline-flex min-h-10 items-center gap-2 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Simpan perubahan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   Upload Field Component
   ============================================================ */
function UploadField({
  label,
  description,
  value,
  onChange,
  onUpload,
  uploading,
  inputRef,
  previewBg,
  square = false,
}: {
  label: string
  description: string
  value: string
  onChange: (url: string) => void
  onUpload: (file: File) => void
  uploading: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  previewBg: string
  square?: boolean
}) {
  return (
    <div>
      <p className="text-xs font-medium">{label}</p>
      <p className="mt-0.5 text-[11px] text-(--pk-text-mute)">
        {description}
      </p>

      <div className="mt-2 space-y-2">
        <div
          className={`flex items-center justify-center overflow-hidden rounded-xl border border-(--pk-line-2) ${previewBg} ${
            square ? "h-20 w-20" : "h-20 w-full"
          }`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt={label}
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <ImageIcon size={20} className="text-(--pk-text-mute)" />
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onUpload(file)
            e.target.value = ""
          }}
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="pk-btn-ghost inline-flex min-h-8 flex-1 items-center justify-center gap-1.5 px-3 text-xs disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Upload size={11} />
            )}
            {uploading ? "Upload..." : value ? "Ganti" : "Upload"}
          </button>

          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#f87171]/40 bg-[#f87171]/10 text-[#fca5a5] transition-colors hover:bg-[#f87171]/20"
              aria-label="Hapus"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}