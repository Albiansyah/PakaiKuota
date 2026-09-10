"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { toast } from "sonner"
import {
  AlertTriangle,
  Check,
  Gauge,
  KeyRound,
  Loader2,
  Package,
  Plug,
  Save,
  Server,
  Sparkles,
  Wallet,
} from "lucide-react"

type NewAPIConfig = {
  id: number
  base_url: string
  api_key: string
  default_model: string
  markup_percent: number
  is_active: boolean
  hourly_limit_rupiah?: number
  daily_limit_rupiah?: number
}

const helperClass = "mt-1.5 text-xs text-(--pk-text-mute)"
const inputClass =
  "mt-2 min-h-11 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] px-3.5 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25"
const labelClass = "text-xs font-medium text-(--pk-text)"
const panelClass = "pk-panel pk-inview p-6"

export default function NewAPIConfigPage() {
  const { supabase } = useSupabase()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [form, setForm] = useState<Partial<NewAPIConfig>>({})
  const [saved, setSaved] = useState(false)
  const [testResult, setTestResult] = useState<{
    status: "success" | "failed"
    responseTimeMs?: number
    message?: string
  } | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from("newapi_config")
          .select("*")
          .single()
        if (error) throw error
        setForm(data as NewAPIConfig)
      } catch {
        toast.error("Konfigurasi NewAPI tidak bisa dimuat")
      } finally {
        setLoading(false)
      }
    })()
  }, [supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) || 0 : value,
    }))
    setSaved(false)
  }

  const testConnection = async () => {
    const key = form.api_key?.trim() ?? ""
    if (
      !form.base_url ||
      key.length < 8 ||
      /^(placeholder|your[-_ ]?api[-_ ]?key|xxx+)$/i.test(key)
    ) {
      setTestResult({
        status: "failed",
        message: "API Key belum diisi dengan benar",
      })
      toast.error("API Key belum diisi dengan benar")
      return
    }
    setTesting(true)
    try {
      const response = await fetch("/api/admin/newapi-config", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ base_url: form.base_url, api_key: key }),
      })
      const result = (await response.json()) as {
        response_time_ms?: number
        error?: string
      }
      const next = {
        status: response.ok ? ("success" as const) : ("failed" as const),
        responseTimeMs: result.response_time_ms,
        message: result.error,
      }
      setTestResult(next)
      if (response.ok) {
        toast.success(`Koneksi berhasil (${result.response_time_ms} ms)`)
      } else {
        toast.error(
          `${result.error ?? "Koneksi gagal"}${
            result.response_time_ms
              ? ` (${result.response_time_ms} ms)`
              : ""
          }`
        )
      }
    } catch {
      setTestResult({ status: "failed", message: "connection_unavailable" })
      toast.error("Koneksi tidak tersedia")
    } finally {
      setTesting(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const { error } = await supabase
        .from("newapi_config")
        .upsert({ ...form, id: 1 } as never, { onConflict: "id" })
      if (error) throw error
      setSaved(true)
      toast.success("Konfigurasi NewAPI tersimpan")
      setTimeout(() => setSaved(false), 3000)
    } catch {
      toast.error("Gagal menyimpan konfigurasi")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2
          size={24}
          className="animate-spin text-(--pk-text-mute)"
        />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen text-(--pk-text)">
      <header className="border-b border-(--pk-line) bg-[#070f1e]/60 px-5 py-8 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
            Admin tool
          </p>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            <Server size={26} className="text-(--pk-accent)" />
            Konfigurasi NewAPI
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-(--pk-text-dim)">
            Atur endpoint upstream, kredensial, markup, dan rate limiting
            untuk koneksi NewAPI.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-5 py-8 sm:px-8">
        {/* Endpoint & Model */}
        <section className={panelClass}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
              <Plug size={18} className="text-(--pk-accent)" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Endpoint & Model</h2>
              <p className="mt-1 text-sm text-(--pk-text-dim)">
                Konfigurasi koneksi NewAPI dan model default.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="base_url" className={labelClass}>
                Base URL
              </label>
              <input
                id="base_url"
                name="base_url"
                value={form.base_url || ""}
                onChange={handleChange}
                placeholder="https://api.newapi.com"
                className={inputClass}
              />
              <p className={helperClass}>URL endpoint upstream NewAPI.</p>
            </div>

            <div>
              <label htmlFor="api_key" className={labelClass}>
                API Key
              </label>
              <div className="relative">
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--pk-text-mute)"
                >
                  <KeyRound size={14} />
                </span>
                <input
                  id="api_key"
                  name="api_key"
                  type="password"
                  value={form.api_key || ""}
                  onChange={handleChange}
                  placeholder="newapi-xxx"
                  className={`${inputClass} pl-10`}
                />
              </div>
              <p className={helperClass}>
                Kunci autentikasi untuk koneksi upstream.
              </p>
            </div>

            <div>
              <label htmlFor="default_model" className={labelClass}>
                Model Default
              </label>
              <input
                id="default_model"
                name="default_model"
                value={form.default_model || ""}
                onChange={handleChange}
                placeholder="gpt-4o-mini"
                className={inputClass}
              />
              <p className={helperClass}>
                Model yang digunakan saat tidak ada pilihan khusus.
              </p>
            </div>

            <div>
              <label htmlFor="markup_percent" className={labelClass}>
                Markup (%)
              </label>
              <input
                id="markup_percent"
                name="markup_percent"
                type="number"
                min={0}
                max={100}
                value={form.markup_percent ?? 20}
                onChange={handleChange}
                className={inputClass}
              />
              <p className={helperClass}>
                Persentase markup dari harga upstream.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl border border-(--pk-line-2) bg-[#0b1626]/60 p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium">Aktifkan NewAPI</p>
              <p className="text-sm text-(--pk-text-dim)">
                Izinkan aplikasi menggunakan koneksi NewAPI.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.is_active ?? true}
              onClick={() => {
                setForm((prev) => ({
                  ...prev,
                  is_active: !(prev.is_active ?? true),
                }))
                setSaved(false)
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
                (form.is_active ?? true)
                  ? "border-(--pk-accent)/50 bg-(--pk-accent)/20"
                  : "border-(--pk-line-2) bg-[#0b1626]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                  (form.is_active ?? true)
                    ? "translate-x-6 bg-(--pk-accent)"
                    : "translate-x-1 bg-(--pk-text-mute)"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Rate Limiting */}
        <section className={panelClass}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
              <Gauge size={18} className="text-(--pk-accent)" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Rate Limiting</h2>
              <p className="mt-1 text-sm text-(--pk-text-dim)">
                Batas pengeluaran untuk mencegah abuse.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="hourly_limit_rupiah" className={labelClass}>
                Limit Per Jam (Rp)
              </label>
              <div className="relative">
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--pk-text-mute)"
                >
                  <Wallet size={14} />
                </span>
                <input
                  id="hourly_limit_rupiah"
                  name="hourly_limit_rupiah"
                  type="number"
                  min={0}
                  value={form.hourly_limit_rupiah ?? 0}
                  onChange={handleChange}
                  placeholder="0 = unlimited"
                  className={`${inputClass} pl-10`}
                />
              </div>
              <p className={helperClass}>
                Batas pengeluaran billing, bukan batas request Upstash. 0 =
                unlimited.
              </p>
            </div>

            <div>
              <label htmlFor="daily_limit_rupiah" className={labelClass}>
                Limit Per Hari (Rp)
              </label>
              <div className="relative">
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--pk-text-mute)"
                >
                  <Wallet size={14} />
                </span>
                <input
                  id="daily_limit_rupiah"
                  name="daily_limit_rupiah"
                  type="number"
                  min={0}
                  value={form.daily_limit_rupiah ?? 0}
                  onChange={handleChange}
                  placeholder="0 = unlimited"
                  className={`${inputClass} pl-10`}
                />
              </div>
              <p className={helperClass}>
                0 = tidak ada batas per hari.
              </p>
            </div>
          </div>
        </section>

        {/* Paket Token */}
        <section className={panelClass}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
              <Package size={18} className="text-(--pk-accent)" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Paket Token</h2>
              <p className="mt-1 text-sm text-(--pk-text-dim)">
                Kelola paket token yang tersedia untuk dijual.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => router.push("/admin/token-packages")}
              className="pk-btn-ghost inline-flex min-h-10 items-center gap-2 px-4 text-sm font-medium"
            >
              <Sparkles size={14} />
              Kelola Paket Token
            </button>
          </div>
        </section>

        {/* Test Result */}
        {testResult && (
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              testResult.status === "success"
                ? "border-[#34d399]/30 bg-[#34d399]/10 text-[#6ee7b7]"
                : "border-[#f87171]/30 bg-[#f87171]/10 text-[#fca5a5]"
            }`}
          >
            <span className="mt-0.5 shrink-0">
              {testResult.status === "success" ? (
                <Check size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
            </span>
            <div>
              <strong>
                {testResult.status === "success"
                  ? "Terhubung"
                  : "Gagal terhubung"}
              </strong>
              {testResult.responseTimeMs
                ? ` · ${testResult.responseTimeMs} ms`
                : ""}
              {testResult.message ? ` · ${testResult.message}` : ""}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={testConnection}
            disabled={testing || !form.base_url || !form.api_key}
            className="pk-btn-ghost inline-flex min-h-11 items-center gap-2 px-5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {testing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plug size={14} />
            )}
            {testing ? "Menguji..." : "Test koneksi"}
          </button>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="pk-btn-primary inline-flex min-h-11 items-center gap-2 px-5 text-sm disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
          </button>

          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-[#6ee7b7]">
              <Check size={14} />
              Konfigurasi tersimpan.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}