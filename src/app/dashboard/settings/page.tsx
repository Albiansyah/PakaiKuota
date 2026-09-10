"use client"

import { useEffect, useRef, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useLanguage } from "@/components/providers/language-provider"
import {
  AlertTriangle,
  Calendar,
  Check,
  Copy,
  Eye,
  Loader2,
  Lock,
  Shield,
  Trash2,
  User,
  X,
} from "lucide-react"

export default function SettingsPage() {
  const { user } = useSupabase()
  const { t } = useLanguage()

  const [privacyMode, setPrivacyMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const [passwordOpen, setPasswordOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function copy(value: string, field: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1600)
    } catch {
      setCopiedField(null)
    }
  }

  async function handleSavePrivacy() {
    setSaving(true)
    try {
      const res = await fetch("/api/settings/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: privacyMode }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err) {
      console.error("Failed to save privacy settings:", err)
    }
    setSaving(false)
  }

  if (!user) {
    return (
      <div className="relative min-h-screen text-[color:var(--pk-text)]">
        <div className="mx-auto max-w-7xl px-5 py-20 text-center sm:px-8">
          <p className="text-sm text-[color:var(--pk-text-dim)]">
            {t("common.please_login")}
          </p>
        </div>
      </div>
    )
  }

  const initial = (user.email?.[0] ?? "A").toUpperCase()
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <div className="relative min-h-screen text-[color:var(--pk-text)]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          {/* ============ PROFIL (full width) ============ */}
          <section className="pk-panel pk-inview p-5 sm:p-6 lg:col-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626]">
                <User size={16} className="text-[color:var(--pk-accent)]" />
              </span>
              <div>
                <h2 className="text-base font-semibold">Profil</h2>
                <p className="text-xs text-[color:var(--pk-text-mute)]">
                  Informasi akun kamu
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
              <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl border border-[color:var(--pk-line-2)] bg-gradient-to-br from-[#1a2b47] to-[#0b1626] text-2xl font-bold text-[color:var(--pk-accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  {initial}
                </div>
                <div className="min-w-0 lg:mt-3">
                  <p className="truncate text-sm font-medium text-[color:var(--pk-text)]">
                    {user.email}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {user.email_confirmed_at ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-2.5 py-1 text-[11px] font-medium text-[#6ee7b7]">
                        <Shield size={11} />
                        Email terverifikasi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f0a93b]/30 bg-[#f0a93b]/10 px-2.5 py-1 text-[11px] font-medium text-[color:var(--pk-accent)]">
                        <AlertTriangle size={11} />
                        Email belum diverifikasi
                      </span>
                    )}
                    {memberSince && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--pk-line-2)] bg-[#0b1626]/60 px-2.5 py-1 text-[11px] text-[color:var(--pk-text-dim)]">
                        <Calendar size={11} />
                        Bergabung {memberSince}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <FieldRow
                  label="Email"
                  value={user.email ?? "—"}
                  copied={copiedField === "email"}
                  onCopy={
                    user.email ? () => copy(user.email!, "email") : undefined
                  }
                />
                <FieldRow
                  label="User ID"
                  value={user.id}
                  mono
                  copied={copiedField === "id"}
                  onCopy={() => copy(user.id, "id")}
                  hint="Kirimkan ke support jika butuh bantuan."
                />
              </div>
            </div>
          </section>

          {/* ============ PRIVASI ============ */}
          <section className="pk-panel pk-inview flex flex-col p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626]">
                <Eye size={16} className="text-[color:var(--pk-accent)]" />
              </span>
              <div>
                <h2 className="text-base font-semibold">
                  {t("settings.privacy")}
                </h2>
                <p className="text-xs text-[color:var(--pk-text-mute)]">
                  {t("settings.privacyDesc")}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-1 flex-col justify-between gap-4 border-t border-[color:var(--pk-line)] pt-6">
              <div className="min-w-0">
                <p className="text-sm font-medium">Mode Privasi</p>
                <p className="mt-1 text-xs text-[color:var(--pk-text-dim)]">
                  Prompt tidak akan disimpan di server.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={privacyMode}
                  onChange={setPrivacyMode}
                  ariaLabel="Aktifkan mode privasi"
                />
                <button
                  type="button"
                  onClick={handleSavePrivacy}
                  disabled={saving}
                  className={`inline-flex min-h-10 min-w-[7rem] items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-all ${
                    saved
                      ? "border border-[#34d399]/50 bg-[#34d399]/15 text-[#6ee7b7]"
                      : "pk-btn-primary"
                  } disabled:cursor-wait disabled:opacity-60`}
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Menyimpan
                    </>
                  ) : saved ? (
                    <>
                      <Check size={14} />
                      Tersimpan
                    </>
                  ) : (
                    t("common.save")
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* ============ KEAMANAN ============ */}
          <section className="pk-panel pk-inview flex flex-col p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626]">
                <Lock size={16} className="text-[color:var(--pk-accent)]" />
              </span>
              <div>
                <h2 className="text-base font-semibold">Keamanan</h2>
                <p className="text-xs text-[color:var(--pk-text-mute)]">
                  Kelola password dan keamanan akun
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-1 flex-col justify-between gap-4 border-t border-[color:var(--pk-line)] pt-6">
              <div className="min-w-0">
                <p className="text-sm font-medium">Password</p>
                <p className="mt-1 text-xs text-[color:var(--pk-text-dim)]">
                  Ganti password secara berkala untuk keamanan akun.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPasswordOpen((v) => !v)}
                className="pk-btn-ghost inline-flex min-h-10 items-center justify-center gap-2 self-start px-4 text-sm font-medium"
              >
                <Lock size={14} />
                {passwordOpen ? "Tutup form" : "Ubah password"}
              </button>

              {passwordOpen && (
                <PasswordForm onClose={() => setPasswordOpen(false)} />
              )}
            </div>
          </section>

          {/* ============ DANGER ZONE (full width) ============ */}
          <section className="pk-panel pk-inview relative overflow-hidden p-5 sm:p-6 lg:col-span-2">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_100%_0%,rgba(248,113,113,0.12),transparent_70%)]"
            />
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#f87171]/30 bg-[#f87171]/10">
                  <AlertTriangle size={16} className="text-[#fca5a5]" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-[#fca5a5]">
                    Zona Berbahaya
                  </h2>
                  <p className="text-xs text-[color:var(--pk-text-mute)]">
                    Tindakan di bawah tidak dapat dibatalkan
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4 border-t border-[#f87171]/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Hapus akun</p>
                  <p className="mt-1 text-xs text-[color:var(--pk-text-dim)]">
                    Semua data, key, dan saldo akan hilang permanen.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#f87171]/40 bg-[#f87171]/10 px-4 text-sm font-medium text-[#fca5a5] transition-colors hover:bg-[#f87171]/20"
                >
                  <Trash2 size={14} />
                  {t("settings.delete")}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {deleteOpen && (
        <DeleteAccountModal
          email={user.email ?? ""}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </div>
  )
}

function FieldRow({
  label,
  value,
  mono,
  copied,
  onCopy,
  hint,
}: {
  label: string
  value: string
  mono?: boolean
  copied: boolean
  onCopy?: () => void
  hint?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-medium text-[color:var(--pk-text-mute)]">
          {label}
        </label>
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            aria-label={`Salin ${label}`}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all ${
              copied
                ? "border-[#34d399]/50 bg-[#34d399]/15 text-[#6ee7b7]"
                : "border-[color:var(--pk-line-2)] bg-[#0b1626] text-[color:var(--pk-text-mute)] hover:border-[color:var(--pk-accent)]/50 hover:text-[color:var(--pk-accent)]"
            }`}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Tersalin" : "Salin"}
          </button>
        )}
      </div>
      <p
        className={`mt-1.5 truncate rounded-lg border border-[color:var(--pk-line)] bg-[#0b1626]/60 px-3 py-2 text-sm text-[color:var(--pk-text-dim)] ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1.5 text-[11px] text-[color:var(--pk-text-mute)]">
          {hint}
        </p>
      )}
    </div>
  )
}

function Switch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-colors ${
        checked
          ? "border-[color:var(--pk-accent)]/50 bg-gradient-to-r from-[#ffc266] to-[#f0a93b] shadow-[0_0_18px_-4px_rgba(240,169,59,0.7)]"
          : "border-[color:var(--pk-line-2)] bg-[#0b1626]"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )
}

function PasswordForm({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (next !== confirm) {
      setError("Password baru tidak cocok.")
      return
    }
    if (next.length < 8) {
      setError("Password baru minimal 8 karakter.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      })
      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null
      if (!res.ok) {
        setError(data?.error ?? "Password tidak bisa diubah.")
        return
      }
      setMessage("Password berhasil diubah.")
      setCurrent("")
      setNext("")
      setConfirm("")
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch {
      setError("Terjadi kesalahan. Coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    "min-h-11 w-full rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] px-3.5 text-sm text-[color:var(--pk-text)] outline-none transition-colors placeholder:text-[color:var(--pk-text-mute)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"

  return (
    <form
      onSubmit={submit}
      className="pk-menu-in w-full space-y-4 rounded-xl border border-[color:var(--pk-line)] bg-[#0b1626]/40 p-4"
    >
      {error && (
        <p className="rounded-lg border border-[#f87171]/30 bg-[#f87171]/10 px-3 py-2 text-xs text-[#fca5a5]">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg border border-[#34d399]/30 bg-[#34d399]/10 px-3 py-2 text-xs text-[#6ee7b7]">
          {message}
        </p>
      )}

      <label className="block text-xs font-medium">
        Password saat ini
        <input
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          className={`mt-1.5 ${inputClass}`}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-medium">
          Password baru
          <input
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            className={`mt-1.5 ${inputClass}`}
          />
        </label>
        <label className="block text-xs font-medium">
          Konfirmasi password baru
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className={`mt-1.5 ${inputClass}`}
          />
        </label>
      </div>

      <p className="text-[11px] text-[color:var(--pk-text-mute)]">
        Minimal 8 karakter. Gunakan kombinasi huruf, angka, dan simbol.
      </p>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="pk-btn-primary inline-flex min-h-10 items-center gap-2 px-4 text-sm disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {loading ? "Menyimpan..." : "Simpan password"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="pk-btn-ghost inline-flex min-h-10 items-center px-4 text-sm font-medium"
        >
          Batal
        </button>
      </div>
    </form>
  )
}

function DeleteAccountModal({
  email,
  onClose,
}: {
  email: string
  onClose: () => void
}) {
  const [confirmText, setConfirmText] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const expected = "HAPUS"
  const canSubmit = confirmText.trim().toUpperCase() === expected

  useEffect(() => {
    inputRef.current?.focus()
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose()
    }
    document.addEventListener("keydown", onEsc)
    return () => {
      document.body.style.overflow = original
      document.removeEventListener("keydown", onEsc)
    }
  }, [loading, onClose])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/account/delete-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "user request" }),
      })
      if (!res.ok) {
        setError("Gagal mengirim permintaan.")
        return
      }
      onClose()
    } catch {
      setError("Terjadi kesalahan. Coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <div
        aria-hidden
        onClick={() => !loading && onClose()}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="pk-panel pk-menu-in relative w-full max-w-md overflow-hidden p-6">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Tutup"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--pk-text-mute)] transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
        >
          <X size={16} />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#f87171]/30 bg-[#f87171]/10">
          <AlertTriangle size={20} className="text-[#fca5a5]" />
        </div>

        <h2
          id="delete-title"
          className="mt-4 text-lg font-semibold text-[color:var(--pk-text)]"
        >
          Hapus akun kamu?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[color:var(--pk-text-dim)]">
          Semua data, API key, dan saldo di{" "}
          <span className="font-medium text-[color:var(--pk-text)]">
            {email}
          </span>{" "}
          akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          {error && (
            <p className="rounded-lg border border-[#f87171]/30 bg-[#f87171]/10 px-3 py-2 text-xs text-[#fca5a5]">
              {error}
            </p>
          )}

          <label className="block text-xs font-medium">
            Ketik{" "}
            <span className="font-mono text-[color:var(--pk-accent)]">
              {expected}
            </span>{" "}
            untuk konfirmasi
            <input
              ref={inputRef}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expected}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] px-3.5 text-sm text-[color:var(--pk-text)] outline-none transition-colors placeholder:text-[color:var(--pk-text-mute)] focus:border-[#f87171]/60 focus:ring-2 focus:ring-[#f87171]/20"
            />
          </label>

          <label className="block text-xs font-medium">
            Alasan (opsional)
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Ceritakan kenapa kamu pergi..."
              className="mt-1.5 w-full resize-none rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] px-3.5 py-2.5 text-sm text-[color:var(--pk-text)] outline-none transition-colors placeholder:text-[color:var(--pk-text-mute)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
            />
          </label>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="pk-btn-ghost inline-flex min-h-10 items-center justify-center px-4 text-sm font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#f87171]/40 bg-[#f87171]/15 px-4 text-sm font-medium text-[#fca5a5] transition-colors hover:bg-[#f87171]/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              {loading ? "Mengirim..." : "Ajukan hapus akun"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}