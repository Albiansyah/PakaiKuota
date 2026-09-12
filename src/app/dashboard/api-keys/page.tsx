"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useLanguage } from "@/components/providers/language-provider"
import {
  AlertTriangle,
  Check,
  Copy,
  Key,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"

type ApiKey = {
  id: string
  name: string
  key_prefix: string
  revoked_at: string | null
  created_at: string
}

export default function ApiKeysPage() {
  const { user } = useSupabase()
  const { t } = useLanguage()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [name, setName] = useState("")
  const [generated, setGenerated] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const refresh = async () => {
    const res = await fetch("/api/keys")
    const data = await res.json()
    setKeys(data.keys ?? [])
    setInitialLoading(false)
  }

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const res = await fetch("/api/keys")
      const data = await res.json()
      setKeys(data.keys ?? [])
      setInitialLoading(false)
    })()
  }, [user])

  const createKey = async () => {
    if (!name.trim()) return
    setLoading(true)

    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()

    if (res.ok) {
      setGenerated(data.key)
      setName("")
      refresh()
    } else {
      alert(data.error)
    }
    setLoading(false)
  }

  const deleteRevokedKey = async (id: string) => {
    if (!confirm("Hapus key yang sudah dicabut secara permanen?")) return
    const res = await fetch(`/api/keys/${id}?permanent=true`, { method: "DELETE" })
    if (res.ok) setKeys((current) => current.filter((key) => key.id !== id))
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (initialLoading) {
    return (
      <div className="relative min-h-screen text-(--pk-text)">
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#0f1e38_0%,#050b16_55%,#03070e_100%)]" />
          <div className="pk-grid absolute inset-0" />
        </div>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-(--pk-text-mute)" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen text-(--pk-text)">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#0f1e38_0%,#050b16_55%,#03070e_100%)]" />
        <div className="pk-grid absolute inset-0" />
      </div>

      <header className="border-b border-(--pk-line) bg-[#070f1e]/60 px-5 py-8 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--pk-accent)">
            Akses API
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            {t("apikeys.title")}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-(--pk-text-dim)">
            Kelola API key untuk mengakses layanan. Key hanya ditampilkan sekali saat dibuat.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {generated && (
          <div className="pk-panel mb-6 border-[#fbbf24]/30 bg-[#fbbf24]/5 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#fcd34d]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-(--pk-text)">
                  {t("apikeys.warning")}
                </p>
                <p className="mt-1 text-xs text-(--pk-text-dim)">
                  Key hanya ditampilkan sekali. Simpan sebelum menutup.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="min-w-0 flex-1 truncate rounded-lg border border-(--pk-line-2) bg-[#0b1626] px-3 py-2 font-mono text-xs text-(--pk-text)">
                    {generated}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generated)}
                    className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-(--pk-line-2) bg-[#0b1626] px-3 text-xs font-medium text-(--pk-text-dim) transition-colors hover:border-(--pk-accent)/50 hover:text-(--pk-accent)"
                  >
                    {copied ? (
                      <>
                        <Check size={12} />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        Salin
                      </>
                    )}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGenerated(null)}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-(--pk-text-mute) transition-colors hover:bg-white/5 hover:text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        <section className="pk-panel p-5 sm:p-6">
          <div>
            <h2 className="text-base font-semibold">
              {t("apikeys.create")}
            </h2>
            <p className="mt-1 text-xs text-(--pk-text-mute)">
              Beri nama untuk memudahkan identifikasi.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama API key (contoh: production-api)"
              className="min-h-11 flex-1 rounded-xl border border-(--pk-line-2) bg-[#0b1626] px-3.5 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25"
            />
            <button
              type="button"
              onClick={createKey}
              disabled={loading || !name.trim()}
              className="pk-btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  {t("apikeys.create")}
                </>
              )}
            </button>
          </div>
        </section>

        <section className="pk-panel mt-6 overflow-hidden">
          <div className="flex items-center justify-between border-b border-(--pk-line) px-5 py-4">
            <h2 className="text-base font-semibold">Daftar API Keys</h2>
            <span className="font-mono text-[11px] text-(--pk-text-mute)">
              {keys.length} key
            </span>
          </div>

          {keys.length === 0 ? (
            <div className="p-10 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-mute)">
                <Key size={22} />
              </span>
              <p className="mt-5 font-semibold">Belum ada API key</p>
              <p className="mt-2 text-sm text-(--pk-text-dim)">
                Buat API key baru untuk memulai.
              </p>
            </div>
          ) : (
            <div className="pk-scroll overflow-x-auto">
              <table className="w-full min-w-208 text-left text-sm">
                <thead className="border-b border-(--pk-line) text-(--pk-text-mute)">
                  <tr>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                      {t("apikeys.name")}
                    </th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                      {t("apikeys.prefix")}
                    </th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                      {t("apikeys.active")}
                    </th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                      {t("apikeys.created")}
                    </th>
                    <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => (
                    <tr
                      key={key.id}
                      className="border-b border-(--pk-line) transition-colors last:border-0 hover:bg-white/2"
                    >
                      <td className="px-5 py-4 font-medium">{key.name}</td>
                      <td className="px-5 py-4 font-mono text-xs text-(--pk-text-dim)">
                        {key.key_prefix}****
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-2 text-sm ${
                            key.revoked_at
                              ? "text-(--pk-text-mute)"
                              : "text-[#6ee7b7]"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              key.revoked_at
                                ? "bg-(--pk-line-2)"
                                : "bg-[#34d399]"
                            }`}
                          />
                          {key.revoked_at ? "Dicabut" : t("common.active")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-(--pk-text-mute)">
                        {new Date(key.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {key.revoked_at ? (
                          <button
                            type="button"
                            onClick={() => deleteRevokedKey(key.id)}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#f87171]/30 px-3 text-xs font-medium text-[#fca5a5] transition-colors hover:bg-[#f87171]/10"
                          >
                            <Trash2 size={12} />
                            Hapus
                          </button>
                        ) : (
                          <span className="text-xs text-(--pk-text-mute)">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}