"use client"

import { useCallback, useEffect, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { toast } from "sonner"
import {
  Check,
  Clock,
  Edit3,
  Gift,
  Hash,
  Loader2,
  Package,
  Plus,
  Power,
  PowerOff,
  Save,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from "lucide-react"

type TokenPackage = {
  id: string
  name: string
  description: string | null
  token_amount: number
  price_rupiah: number
  bonus_percent: number
  duration_days: number | null
  is_active: boolean
  sort_order: number
}

type FormState = {
  name: string
  description: string
  token_amount: string
  price_rupiah: string
  bonus_percent: string
  duration_days: string
  sort_order: string
  is_active: boolean
}

const emptyForm: FormState = {
  name: "",
  description: "",
  token_amount: "",
  price_rupiah: "",
  bonus_percent: "0",
  duration_days: "",
  sort_order: "0",
  is_active: true,
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] px-3.5 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25"
const labelClass = "text-xs font-medium text-(--pk-text)"

export default function TokenPackagesPage() {
  const { supabase } = useSupabase()

  const [packages, setPackages] = useState<TokenPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchPackages = useCallback(async () => {
    setError(false)
    try {
      const { data, error } = await supabase
        .from("token_packages")
        .select("*")
        .order("sort_order")
      if (error) throw error
      setPackages((data ?? []) as TokenPackage[])
    } catch (e) {
      console.error(e)
      setError(true)
      toast.error("Gagal memuat paket token")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void fetchPackages()
  }, [fetchPackages])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(pkg: TokenPackage) {
    setEditingId(pkg.id)
    setForm({
      name: pkg.name,
      description: pkg.description ?? "",
      token_amount: String(pkg.token_amount),
      price_rupiah: String(pkg.price_rupiah),
      bonus_percent: String(pkg.bonus_percent ?? 0),
      duration_days: pkg.duration_days != null ? String(pkg.duration_days) : "",
      sort_order: String(pkg.sort_order ?? 0),
      is_active: pkg.is_active,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function savePackage() {
    const name = form.name.trim()
    if (!name) {
      toast.error("Nama paket wajib diisi")
      return
    }
    const tokenAmount = Number(form.token_amount)
    const price = Number(form.price_rupiah)
    if (!Number.isFinite(tokenAmount) || tokenAmount <= 0) {
      toast.error("Jumlah token harus lebih dari 0")
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Harga tidak valid")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name,
        description: form.description.trim() || null,
        token_amount: tokenAmount,
        price_rupiah: price,
        bonus_percent: Number(form.bonus_percent) || 0,
        duration_days:
          form.duration_days === "" ? null : Number(form.duration_days),
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      }

      if (editingId) {
        const { error } = await supabase
          .from("token_packages")
          .update(payload as never)
          .eq("id", editingId)
        if (error) throw error
        toast.success("Paket token diperbarui")
      } else {
        const { error } = await supabase
          .from("token_packages")
          .insert(payload as never)
        if (error) throw error
        toast.success("Paket token dibuat")
      }

      await fetchPackages()
      closeModal()
    } catch (e) {
      console.error(e)
      toast.error("Gagal menyimpan paket token")
    } finally {
      setSaving(false)
    }
  }

  async function deletePackage(id: string) {
    if (!confirm("Hapus paket token ini?")) return
    setProcessing(id)
    try {
      const { error } = await supabase
        .from("token_packages")
        .delete()
        .eq("id", id)
      if (error) throw error
      setPackages((prev) => prev.filter((p) => p.id !== id))
      toast.success("Paket token dihapus")
    } catch (e) {
      console.error(e)
      toast.error("Gagal menghapus paket token")
    } finally {
      setProcessing(null)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    setProcessing(id)
    try {
      const { error } = await supabase
        .from("token_packages")
        .update({ is_active: !current } as never)
        .eq("id", id)
      if (error) throw error
      setPackages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !current } : p))
      )
    } catch (e) {
      console.error(e)
      toast.error("Gagal mengubah status paket")
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="relative min-h-screen text-(--pk-text)">
      <header className="border-b border-(--pk-line) bg-[#070f1e]/60 px-5 py-8 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
                Admin tool
              </p>
              <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                <Package size={26} className="text-(--pk-accent)" />
                Paket Token
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-(--pk-text-dim)">
                Kelola paket token yang dijual ke user.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="pk-btn-primary inline-flex min-h-10 items-center gap-2 px-4 text-sm"
            >
              <Plus size={14} />
              Tambah Paket
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {error && (
          <div className="pk-panel mb-6 p-5 text-center">
            <p className="text-sm text-[#fca5a5]">
              Data paket token tidak bisa dimuat.
            </p>
            <button
              type="button"
              onClick={() => {
                setLoading(true)
                void fetchPackages()
              }}
              className="pk-btn-ghost mt-4 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
            >
              Coba lagi
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2
              size={24}
              className="animate-spin text-(--pk-text-mute)"
            />
          </div>
        )}

        {!loading && !error && packages.length === 0 && (
          <div className="pk-panel pk-inview p-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-(--pk-line-2) bg-[#0b1626]">
              <Package size={22} className="text-(--pk-text-mute)" />
            </span>
            <p className="mt-5 font-semibold">Belum ada paket token</p>
            <p className="mt-2 text-sm text-(--pk-text-dim)">
              Buat paket pertama untuk mulai dijual.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="pk-btn-primary mt-5 inline-flex min-h-10 items-center justify-center gap-2 px-4 text-sm"
            >
              <Plus size={13} />
              Tambah Paket Pertama
            </button>
          </div>
        )}

        {!loading && !error && packages.length > 0 && (
          <ul className="space-y-3">
            {packages.map((pkg) => {
              const isProcessing = processing === pkg.id
              return (
                <li
                  key={pkg.id}
                  className="pk-panel pk-inview flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-(--pk-text)">
                        {pkg.name}
                      </p>
                      {pkg.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#6ee7b7]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-(--pk-line-2) bg-[#0b1626] px-2.5 py-0.5 text-[10px] font-medium text-(--pk-text-mute)">
                          <span className="h-1.5 w-1.5 rounded-full bg-(--pk-line-2)" />
                          Nonaktif
                        </span>
                      )}
                    </div>
                    {pkg.description && (
                      <p className="mt-1 text-xs text-(--pk-text-dim)">
                        {pkg.description}
                      </p>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-(--pk-text-dim) sm:grid-cols-4">
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles size={12} className="text-(--pk-accent)" />
                        <span className="font-mono">
                          {pkg.token_amount.toLocaleString("id-ID")}
                        </span>
                        token
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Wallet size={12} className="text-[#6ee7b7]" />
                        <span className="font-mono">
                          Rp {pkg.price_rupiah.toLocaleString("id-ID")}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Gift size={12} className="text-(--pk-text-mute)" />
                        Bonus{" "}
                        <span className="font-mono">{pkg.bonus_percent}%</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={12} className="text-(--pk-text-mute)" />
                        {pkg.duration_days != null
                          ? `${pkg.duration_days} hari`
                          : "Tanpa batas"}
                      </span>
                    </div>

                    <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] text-(--pk-text-mute)">
                      <Hash size={10} />
                      Urutan: {pkg.sort_order}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleActive(pkg.id, pkg.is_active)}
                      disabled={isProcessing}
                      aria-label={pkg.is_active ? "Nonaktifkan" : "Aktifkan"}
                      title={pkg.is_active ? "Nonaktifkan" : "Aktifkan"}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-(--pk-line-2) text-(--pk-text-dim) transition-colors hover:border-(--pk-accent)/50 hover:text-(--pk-accent) disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isProcessing ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : pkg.is_active ? (
                        <PowerOff size={14} />
                      ) : (
                        <Power size={14} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(pkg)}
                      disabled={isProcessing}
                      aria-label="Edit"
                      title="Edit"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-(--pk-line-2) text-(--pk-text-dim) transition-colors hover:border-(--pk-accent)/50 hover:text-(--pk-accent) disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deletePackage(pkg.id)}
                      disabled={isProcessing}
                      aria-label="Hapus"
                      title="Hapus"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#f87171]/40 bg-[#f87171]/10 text-[#fca5a5] transition-colors hover:bg-[#f87171]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isProcessing ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {modalOpen && (
        <PackageModal
          editing={editingId !== null}
          form={form}
          saving={saving}
          onChange={updateField}
          onClose={closeModal}
          onSave={savePackage}
        />
      )}
    </div>
  )
}

function PackageModal({
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
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onEsc)
    return () => {
      document.body.style.overflow = original
      document.removeEventListener("keydown", onEsc)
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pkg-modal-title"
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="pk-panel pk-menu-in relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-(--pk-text-mute) transition-colors hover:bg-white/5 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
          <Package size={20} className="text-(--pk-accent)" />
        </div>

        <h2
          id="pkg-modal-title"
          className="mt-4 text-lg font-semibold text-(--pk-text)"
        >
          {editing ? "Edit Paket" : "Buat Paket Baru"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-(--pk-text-dim)">
          Atur nama, harga, token, bonus, dan durasi paket.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave()
          }}
          className="mt-5 space-y-4"
        >
          <label className="block">
            <span className={labelClass}>Nama paket</span>
            <input
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Misalnya: Starter"
              autoFocus
              className={`${inputClass} mt-1.5`}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Deskripsi (opsional)</span>
            <input
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder="Deskripsi singkat paket"
              className={`${inputClass} mt-1.5`}
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Jumlah token</span>
              <input
                type="number"
                min={1}
                value={form.token_amount}
                onChange={(e) => onChange("token_amount", e.target.value)}
                placeholder="100000"
                className={`${inputClass} mt-1.5`}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Harga (Rp)</span>
              <input
                type="number"
                min={0}
                value={form.price_rupiah}
                onChange={(e) => onChange("price_rupiah", e.target.value)}
                placeholder="50000"
                className={`${inputClass} mt-1.5`}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Bonus (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={form.bonus_percent}
                onChange={(e) => onChange("bonus_percent", e.target.value)}
                placeholder="0"
                className={`${inputClass} mt-1.5`}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Durasi (hari)</span>
              <input
                type="number"
                min={0}
                value={form.duration_days}
                onChange={(e) => onChange("duration_days", e.target.value)}
                placeholder="Kosong = tanpa batas"
                className={`${inputClass} mt-1.5`}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Urutan</span>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => onChange("sort_order", e.target.value)}
                placeholder="0"
                className={`${inputClass} mt-1.5`}
              />
            </label>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-(--pk-line-2) bg-[#0b1626]/60 p-3.5">
            <div className="space-y-0.5">
              <p className="text-xs font-medium">Aktifkan paket</p>
              <p className="text-[11px] text-(--pk-text-mute)">
                Paket aktif langsung tampil untuk user.
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

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="pk-btn-ghost inline-flex min-h-10 items-center justify-center px-4 text-sm font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="pk-btn-primary inline-flex min-h-10 items-center justify-center gap-2 px-4 text-sm disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Buat Paket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}