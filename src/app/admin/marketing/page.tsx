"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Check,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Gift,
  GripVertical,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Trash2,
  Users,
  X,
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
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

type FormState = Omit<Banner, "id" | "created_at" | "updated_at">

/* ============================================================
   CONSTANTS
   ============================================================ */

const TONES: { value: BannerTone; label: string; preview: string }[] = [
  {
    value: "telegram",
    label: "Telegram",
    preview: "border-[#4aa8e0]/40 bg-[#4aa8e0]/10 text-[#7dd3fc]",
  },
  {
    value: "flashsale",
    label: "Flash Sale",
    preview: "border-[#f87171]/40 bg-[#f87171]/10 text-[#fca5a5]",
  },
  {
    value: "bonus",
    label: "Bonus",
    preview: "border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#fcd34d]",
  },
  {
    value: "event",
    label: "Event",
    preview: "border-[#34d399]/40 bg-[#34d399]/10 text-[#6ee7b7]",
  },
  {
    value: "info",
    label: "Info",
    preview: "border-(--pk-accent)/40 bg-(--pk-accent)/10 text-(--pk-accent)",
  },
]

const ICONS: { value: BannerIcon; label: string; icon: React.ReactNode }[] = [
  { value: "sparkles", label: "Sparkles", icon: <Sparkles size={14} /> },
  { value: "zap", label: "Petir", icon: <Zap size={14} /> },
  { value: "gift", label: "Hadiah", icon: <Gift size={14} /> },
  { value: "users", label: "Orang", icon: <Users size={14} /> },
  { value: "send", label: "Kirim", icon: <Send size={14} /> },
  { value: "megaphone", label: "Mega", icon: <Megaphone size={14} /> },
]

const EMPTY_FORM: FormState = {
  eyebrow: "",
  title: "",
  subtitle: "",
  cta: "Selengkapnya",
  href: "/",
  external: false,
  tone: "info",
  icon: "sparkles",
  sort_order: 0,
  is_active: true,
  starts_at: null,
  ends_at: null,
}

const inputClass =
  "min-h-10 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] px-3 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25"

/* ============================================================
   PAGE
   ============================================================ */

export default function AdminMarketingPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchBanners = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(false)
    try {
      const res = await fetch("/api/admin/marketing-banners")
      if (!res.ok) throw new Error("Failed")
      const data = (await res.json()) as { banners?: Banner[] }
      setBanners(data.banners ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void fetchBanners()
  }, [fetchBanners])

  function openCreate() {
    setEditing(null)
    const nextOrder =
      banners.length > 0
        ? Math.max(...banners.map((b) => b.sort_order)) + 1
        : 0
    setForm({ ...EMPTY_FORM, sort_order: nextOrder })
    setModalOpen(true)
  }

  function openEdit(banner: Banner) {
    setEditing(banner)
    setForm({
      eyebrow: banner.eyebrow,
      title: banner.title,
      subtitle: banner.subtitle,
      cta: banner.cta,
      href: banner.href,
      external: banner.external,
      tone: banner.tone,
      icon: banner.icon,
      sort_order: banner.sort_order,
      is_active: banner.is_active,
      starts_at: banner.starts_at,
      ends_at: banner.ends_at,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  function updateField<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function saveBanner() {
    if (!form.title.trim()) {
      toast.error("Title wajib diisi")
      return
    }
    setSaving(true)
    try {
      const url = "/api/admin/marketing-banners"
      const method = editing ? "PATCH" : "POST"
      const body = editing ? { id: editing.id, ...form } : form

      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed")

      toast.success(editing ? "Banner diperbarui" : "Banner dibuat")
      await fetchBanners(true)
      closeModal()
    } catch {
      toast.error("Gagal menyimpan banner")
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(banner: Banner) {
    setProcessing(banner.id)
    try {
      const res = await fetch("/api/admin/marketing-banners", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: banner.id, is_active: !banner.is_active }),
      })
      if (!res.ok) throw new Error("Failed")
      setBanners((prev) =>
        prev.map((b) =>
          b.id === banner.id ? { ...b, is_active: !b.is_active } : b
        )
      )
    } catch {
      toast.error("Gagal mengubah status")
    } finally {
      setProcessing(null)
    }
  }

  async function deleteBanner(banner: Banner) {
    if (!confirm(`Hapus banner "${banner.title}"?`)) return
    setProcessing(banner.id)
    try {
      const res = await fetch(
        `/api/admin/marketing-banners?id=${banner.id}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error("Failed")
      setBanners((prev) => prev.filter((b) => b.id !== banner.id))
      toast.success("Banner dihapus")
    } catch {
      toast.error("Gagal menghapus banner")
    } finally {
      setProcessing(null)
    }
  }

  const stats = useMemo(() => {
    const total = banners.length
    const active = banners.filter((b) => b.is_active).length
    return { total, active, inactive: total - active }
  }, [banners])

  return (
    <div className="relative min-h-screen text-(--pk-text)">
      {/* Header */}
      <header className="border-b border-(--pk-line) bg-[#070f1e]/60 px-5 py-8 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
                Admin tool
              </p>
              <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                <Megaphone size={26} className="text-(--pk-accent)" />
                Marketing Banners
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-(--pk-text-dim)">
                Kelola banner promo di landing page — muncul di bawah navbar.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchBanners(true)}
                disabled={refreshing}
                aria-label="Refresh"
                className="pk-btn-ghost inline-flex h-10 w-10 items-center justify-center disabled:opacity-60"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="pk-btn-primary inline-flex min-h-10 items-center gap-2 px-4 text-sm"
              >
                <Plus size={14} />
                Tambah Banner
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {error && (
          <div className="pk-panel mb-6 p-5 text-center">
            <p className="text-sm text-[#fca5a5]">
              Data banner tidak bisa dimuat.
            </p>
            <button
              type="button"
              onClick={() => void fetchBanners()}
              className="pk-btn-ghost mt-4 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
            >
              Coba lagi
            </button>
          </div>
        )}

        {!error && !loading && banners.length > 0 && (
          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="pk-panel pk-inview p-5">
              <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                Total banner
              </p>
              <p className="mt-3 font-mono text-2xl">{stats.total}</p>
            </div>
            <div className="pk-panel pk-inview p-5">
              <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                Aktif
              </p>
              <p className="mt-3 font-mono text-2xl text-[#6ee7b7]">
                {stats.active}
              </p>
            </div>
            <div className="pk-panel pk-inview p-5">
              <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                Nonaktif
              </p>
              <p className="mt-3 font-mono text-2xl text-(--pk-text-mute)">
                {stats.inactive}
              </p>
            </div>
          </section>
        )}

        <div className="pk-panel pk-inview overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2
                size={24}
                className="animate-spin text-(--pk-text-mute)"
              />
            </div>
          ) : banners.length === 0 ? (
            <div className="p-12 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-(--pk-line-2) bg-[#0b1626]">
                <Megaphone size={22} className="text-(--pk-text-mute)" />
              </span>
              <p className="mt-5 font-semibold">Belum ada banner</p>
              <p className="mt-2 text-sm text-(--pk-text-dim)">
                Buat banner pertama untuk ditampilkan di landing page.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="pk-btn-primary mt-5 inline-flex min-h-10 items-center justify-center gap-2 px-4 text-sm"
              >
                <Plus size={13} />
                Tambah Banner
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-(--pk-line)">
              {banners.map((banner) => {
                const tone = TONES.find((t) => t.value === banner.tone)
                const iconDef = ICONS.find((i) => i.value === banner.icon)
                const isProcessing = processing === banner.id
                return (
                  <li key={banner.id} className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <span className="mt-0.5 cursor-grab text-(--pk-text-mute)">
                          <GripVertical size={16} />
                        </span>

                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                            tone?.preview ??
                            "border-(--pk-line-2) bg-[#0b1626]"
                          }`}
                        >
                          {iconDef?.icon}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-(--pk-text-mute)">
                              {banner.eyebrow || "—"}
                            </span>
                            {banner.is_active ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-2 py-0.5 text-[10px] font-medium text-[#6ee7b7]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-(--pk-line-2) bg-[#0b1626] px-2 py-0.5 text-[10px] font-medium text-(--pk-text-mute)">
                                <span className="h-1.5 w-1.5 rounded-full bg-(--pk-line-2)" />
                                Nonaktif
                              </span>
                            )}
                            <span className="font-mono text-[10px] text-(--pk-text-mute)">
                              #{banner.sort_order}
                            </span>
                          </div>

                          <p className="mt-1.5 text-sm font-semibold text-(--pk-text)">
                            {banner.title}
                          </p>
                          {banner.subtitle && (
                            <p className="mt-0.5 text-xs text-(--pk-text-dim)">
                              {banner.subtitle}
                            </p>
                          )}
                          <p className="mt-1.5 text-[11px] text-(--pk-text-mute)">
                            CTA:{" "}
                            <span className="text-(--pk-text-dim)">
                              {banner.cta}
                            </span>{" "}
                            →{" "}
                            <span className="font-mono text-(--pk-text-dim)">
                              {banner.href}
                            </span>
                            {banner.external && (
                              <ExternalLink
                                size={10}
                                className="ml-1 inline text-(--pk-text-mute)"
                              />
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void toggleActive(banner)}
                          disabled={isProcessing}
                          aria-label={
                            banner.is_active ? "Nonaktifkan" : "Aktifkan"
                          }
                          title={banner.is_active ? "Nonaktifkan" : "Aktifkan"}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-(--pk-line-2) text-(--pk-text-dim) transition-colors hover:border-(--pk-accent)/50 hover:text-(--pk-accent) disabled:opacity-60"
                        >
                          {isProcessing ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : banner.is_active ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(banner)}
                          disabled={isProcessing}
                          aria-label="Edit"
                          title="Edit"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-(--pk-line-2) text-(--pk-text-dim) transition-colors hover:border-(--pk-accent)/50 hover:text-(--pk-accent) disabled:opacity-60"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteBanner(banner)}
                          disabled={isProcessing}
                          aria-label="Hapus"
                          title="Hapus"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#f87171]/40 bg-[#f87171]/10 text-[#fca5a5] transition-colors hover:bg-[#f87171]/20 disabled:opacity-60"
                        >
                          {isProcessing ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {modalOpen && (
        <BannerModal
          editing={!!editing}
          form={form}
          saving={saving}
          onChange={updateField}
          onClose={closeModal}
          onSave={saveBanner}
        />
      )}
    </div>
  )
}

/* ============================================================
   Banner Modal
   ============================================================ */

function BannerModal({
  editing,
  form,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  editing: boolean
  form: FormState
  saving: boolean
  onChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  onClose: () => void
  onSave: () => void
}) {
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose()
    }
    document.addEventListener("keydown", onEsc)
    return () => {
      document.body.style.overflow = original
      document.removeEventListener("keydown", onEsc)
    }
  }, [onClose, saving])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="banner-modal-title"
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={() => !saving && onClose()}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="pk-panel pk-menu-in relative max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6"
      >
        <button
          type="button"
          onClick={() => !saving && onClose()}
          aria-label="Tutup"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-(--pk-text-mute) transition-colors hover:bg-white/5 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
          <Megaphone size={20} className="text-(--pk-accent)" />
        </div>

        <h2
          id="banner-modal-title"
          className="mt-4 text-lg font-semibold text-(--pk-text)"
        >
          {editing ? "Edit banner" : "Buat banner baru"}
        </h2>
        <p className="mt-1 text-sm text-(--pk-text-dim)">
          Banner akan muncul di landing page, tepat di bawah navbar.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave()
          }}
          className="mt-5 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium">
                Eyebrow (kategori kecil)
              </label>
              <input
                type="text"
                value={form.eyebrow}
                onChange={(e) => onChange("eyebrow", e.target.value)}
                placeholder="Misalnya: Flash Sale"
                className={`${inputClass} mt-1.5`}
              />
            </div>
            <div>
              <label className="text-xs font-medium">
                Urutan (sort order)
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  onChange("sort_order", Number(e.target.value) || 0)
                }
                className={`${inputClass} mt-1.5`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">
              Judul <span className="text-(--pk-accent)">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => onChange("title", e.target.value)}
              placeholder="Diskon 20% topup hari ini"
              required
              className={`${inputClass} mt-1.5`}
            />
          </div>

          <div>
            <label className="text-xs font-medium">Subjudul</label>
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => onChange("subtitle", e.target.value)}
              placeholder="Berlaku hingga 23.59 WIB."
              className={`${inputClass} mt-1.5`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium">
                CTA (label tombol)
              </label>
              <input
                type="text"
                value={form.cta}
                onChange={(e) => onChange("cta", e.target.value)}
                placeholder="Beli sekarang"
                className={`${inputClass} mt-1.5`}
              />
            </div>
            <div>
              <label className="text-xs font-medium">
                Link tujuan (href)
              </label>
              <input
                type="text"
                value={form.href}
                onChange={(e) => onChange("href", e.target.value)}
                placeholder="/dashboard/topup atau https://..."
                className={`${inputClass} mt-1.5`}
              />
            </div>
          </div>

          {/* Toggle external */}
          <div className="flex items-center justify-between rounded-xl border border-(--pk-line-2) bg-[#0b1626]/60 p-3.5">
            <div className="space-y-0.5">
              <p className="text-xs font-medium">Link eksternal</p>
              <p className="text-[11px] text-(--pk-text-mute)">
                Aktifkan kalau link mengarah ke domain lain (buka di tab baru).
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.external}
              onClick={() => onChange("external", !form.external)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
                form.external
                  ? "border-(--pk-accent)/50 bg-(--pk-accent)/20"
                  : "border-(--pk-line-2) bg-[#0b1626]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                  form.external
                    ? "translate-x-6 bg-(--pk-accent)"
                    : "translate-x-1 bg-(--pk-text-mute)"
                }`}
              />
            </button>
          </div>

          {/* Tone picker */}
          <div>
            <label className="text-xs font-medium">Warna banner</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TONES.map((tone) => {
                const active = form.tone === tone.value
                return (
                  <button
                    key={tone.value}
                    type="button"
                    onClick={() => onChange("tone", tone.value)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      active
                        ? "border-(--pk-accent)/50 bg-(--pk-accent)/10 text-(--pk-accent)"
                        : "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim) hover:border-(--pk-accent)/30 hover:text-white"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        tone.value === "telegram"
                          ? "bg-[#4aa8e0]"
                          : tone.value === "flashsale"
                            ? "bg-[#f87171]"
                            : tone.value === "bonus"
                              ? "bg-[#fbbf24]"
                              : tone.value === "event"
                                ? "bg-[#34d399]"
                                : "bg-(--pk-accent)"
                      }`}
                    />
                    {tone.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <label className="text-xs font-medium">Icon</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ICONS.map((iconDef) => {
                const active = form.icon === iconDef.value
                return (
                  <button
                    key={iconDef.value}
                    type="button"
                    onClick={() => onChange("icon", iconDef.value)}
                    aria-pressed={active}
                    aria-label={iconDef.label}
                    title={iconDef.label}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${
                      active
                        ? "border-(--pk-accent)/50 bg-(--pk-accent)/10 text-(--pk-accent)"
                        : "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim) hover:border-(--pk-accent)/30 hover:text-white"
                    }`}
                  >
                    {iconDef.icon}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Optional scheduling */}
          <details className="rounded-xl border border-(--pk-line-2) bg-[#0b1626]/60 p-3.5">
            <summary className="cursor-pointer text-xs font-medium text-(--pk-text)">
              Penjadwalan (opsional)
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-medium text-(--pk-text-dim)">
                  Mulai tampil (starts_at)
                </label>
                <input
                  type="datetime-local"
                  value={form.starts_at ?? ""}
                  onChange={(e) =>
                    onChange("starts_at", e.target.value || null)
                  }
                  className={`${inputClass} mt-1.5`}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-(--pk-text-dim)">
                  Berhenti tampil (ends_at)
                </label>
                <input
                  type="datetime-local"
                  value={form.ends_at ?? ""}
                  onChange={(e) => onChange("ends_at", e.target.value || null)}
                  className={`${inputClass} mt-1.5`}
                />
              </div>
            </div>
            <p className="mt-2 text-[10px] text-(--pk-text-mute)">
              Kosongkan kalau banner ingin selalu tampil. Waktu dalam zona
              lokal browser.
            </p>
          </details>

          {/* Toggle active */}
          <div className="flex items-center justify-between rounded-xl border border-(--pk-line-2) bg-[#0b1626]/60 p-3.5">
            <div className="space-y-0.5">
              <p className="text-xs font-medium">Aktifkan banner</p>
              <p className="text-[11px] text-(--pk-text-mute)">
                Banner aktif langsung tampil di landing page.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.is_active}
              onClick={() => onChange("is_active", !form.is_active)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
                form.is_active
                  ? "border-(--pk-accent)/50 bg-(--pk-accent)/20"
                  : "border-(--pk-line-2) bg-[#0b1626]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                  form.is_active
                    ? "translate-x-6 bg-(--pk-accent)"
                    : "translate-x-1 bg-(--pk-text-mute)"
                }`}
              />
            </button>
          </div>

          {/* Preview */}
          <div>
            <p className="text-xs font-medium">Preview</p>
            <div className="mt-2 overflow-hidden rounded-xl border border-(--pk-line-2) bg-[#050b16] p-3">
              <BannerPreview form={form} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="pk-btn-ghost inline-flex min-h-10 items-center justify-center px-4 text-sm font-medium disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="pk-btn-primary inline-flex min-h-10 items-center justify-center gap-2 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={13} />
                  {editing ? "Simpan Perubahan" : "Buat Banner"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ============================================================
   Banner Preview
   ============================================================ */

function BannerPreview({ form }: { form: FormState }) {
  const tone = TONES.find((t) => t.value === form.tone) ?? TONES[4]
  const iconDef = ICONS.find((i) => i.value === form.icon) ?? ICONS[0]

  const toneBg =
    form.tone === "telegram"
      ? "border-[#4aa8e0]/40 from-[#1e4d7b]/40 via-[#0b1626] to-[#0b1626]"
      : form.tone === "flashsale"
        ? "border-[#f87171]/40 from-[#7b1e1e]/40 via-[#0b1626] to-[#0b1626]"
        : form.tone === "bonus"
          ? "border-[#fbbf24]/40 from-[#7b5e1e]/40 via-[#0b1626] to-[#0b1626]"
          : form.tone === "event"
            ? "border-[#34d399]/40 from-[#1e7b5a]/40 via-[#0b1626] to-[#0b1626]"
            : "border-(--pk-accent)/40 from-(--pk-accent)/20 via-[#0b1626] to-[#0b1626]"

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-linear-to-r p-3 ${toneBg}`}
    >
      <span
        className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border sm:flex ${tone.preview}`}
      >
        {iconDef.icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
          <Sparkles size={9} />
          {form.eyebrow || "KATEGORI"}
        </p>
        <p className="mt-0.5 truncate text-xs font-semibold text-white">
          {form.title || "Judul banner akan tampil di sini"}
        </p>
        {form.subtitle && (
          <p className="mt-0.5 hidden truncate text-[10px] text-(--pk-text-dim) sm:block">
            {form.subtitle}
          </p>
        )}
      </div>

      <span className="pk-btn-primary hidden min-h-7 shrink-0 items-center px-2.5 text-[10px] font-semibold sm:inline-flex">
        {form.cta || "Selengkapnya"}
      </span>
    </div>
  )
}