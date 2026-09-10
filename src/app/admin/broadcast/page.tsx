"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Megaphone,
  Search,
  Send,
  X,
} from "lucide-react"

type Announcement = {
  id: string
  title: string
  message: string
  is_active: boolean
  created_at: string
}

export default function AdminBroadcastPage() {
  const { user } = useSupabase()
  const router = useRouter()

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [query, setQuery] = useState("")

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/admin/announcements")
      if (!res.ok) throw new Error("unauthorized")
      const data = (await res.json()) as { announcements?: Announcement[] }
      setAnnouncements(data.announcements ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    void fetchAnnouncements()
  }, [user, router, fetchAnnouncements])

  const stats = useMemo(() => {
    const active = announcements.filter((a) => a.is_active).length
    return {
      total: announcements.length,
      active,
      inactive: announcements.length - active,
    }
  }, [announcements])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return announcements
    return announcements.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q)
    )
  }, [announcements, query])

  const canSend = title.trim().length > 0 && message.trim().length > 0

  async function handleSend() {
    if (!canSend || sending) return
    setSending(true)
    setSent(false)
    setSendError(null)
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), message: message.trim() }),
      })
      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null
      if (!res.ok) {
        setSendError(data?.error ?? "Gagal mengirim pengumuman.")
        return
      }
      setSent(true)
      setTitle("")
      setMessage("")
      setTimeout(() => setSent(false), 3500)
      await fetchAnnouncements()
    } catch {
      setSendError("Terjadi kesalahan. Coba lagi.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="relative min-h-screen text-[color:var(--pk-text)]">
      <header className="border-b border-[color:var(--pk-line)] bg-[#070f1e]/60 px-5 py-8 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--pk-accent)]">
            Admin tool
          </p>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            <Megaphone size={26} className="text-[color:var(--pk-accent)]" />
            Broadcast
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--pk-text-dim)]">
            Kirim pengumuman ke semua user. Muncul di dashboard user sebagai
            banner informasi.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          {/* ============ FORM ============ */}
          <section className="pk-panel pk-inview flex flex-col p-5 sm:p-6">
            <div>
              <h2 className="text-base font-semibold">
                Kirim pengumuman baru
              </h2>
              <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                Akan tampil di dashboard seluruh user.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                void handleSend()
              }}
              className="mt-6 flex flex-1 flex-col gap-5"
            >
              <label className="block text-sm font-medium">
                Judul
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misalnya: Maintenance 12 Des 2026"
                  maxLength={120}
                  className="mt-2 min-h-11 w-full rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] px-3.5 text-sm text-[color:var(--pk-text)] outline-none transition-colors placeholder:text-[color:var(--pk-text-mute)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
                />
                <span className="mt-1.5 block text-[11px] text-[color:var(--pk-text-mute)]">
                  {title.length}/120 karakter
                </span>
              </label>

              <label className="block text-sm font-medium">
                Pesan
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tulis isi pengumuman yang jelas dan singkat..."
                  rows={6}
                  maxLength={1000}
                  className="mt-2 w-full resize-y rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] px-3.5 py-2.5 text-sm leading-6 text-[color:var(--pk-text)] outline-none transition-colors placeholder:text-[color:var(--pk-text-mute)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
                />
                <span className="mt-1.5 block text-[11px] text-[color:var(--pk-text-mute)]">
                  {message.length}/1000 karakter
                </span>
              </label>

              {sendError && (
                <p
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-[#f87171]/30 bg-[#f87171]/10 px-4 py-3 text-sm text-[#fca5a5]"
                >
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  {sendError}
                </p>
              )}

              {sent && (
                <p
                  role="status"
                  className="flex items-start gap-3 rounded-lg border border-[#34d399]/30 bg-[#34d399]/10 px-4 py-3 text-sm text-[#6ee7b7]"
                >
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  Pengumuman berhasil dikirim ke semua user.
                </p>
              )}

              <div className="mt-auto border-t border-[color:var(--pk-line)] pt-5">
                <button
                  type="submit"
                  disabled={!canSend || sending}
                  className="pk-btn-primary inline-flex min-h-11 w-full items-center justify-center gap-2 px-5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  {sending ? "Mengirim..." : "Kirim ke semua user"}
                </button>
              </div>
            </form>
          </section>

          {/* ============ HISTORY ============ */}
          <section className="pk-panel pk-inview flex flex-col p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Riwayat pengumuman</h2>
                <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                  {stats.total > 0
                    ? `${stats.active} aktif · ${stats.inactive} nonaktif`
                    : "Belum ada pengumuman dikirim."}
                </p>
              </div>
            </div>

            {announcements.length > 0 && (
              <div className="relative mt-4">
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--pk-text-mute)]"
                >
                  <Search size={15} />
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari judul atau pesan..."
                  className="min-h-11 w-full rounded-xl border border-[color:var(--pk-line-2)] bg-[#0b1626] pl-10 pr-10 text-sm text-[color:var(--pk-text)] outline-none transition-colors placeholder:text-[color:var(--pk-text-mute)] focus:border-[color:var(--pk-accent)] focus:ring-2 focus:ring-[color:var(--pk-accent)]/25"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Bersihkan"
                    className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[color:var(--pk-text-mute)] transition-colors hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            <div className="mt-4 flex-1">
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2
                    size={22}
                    className="animate-spin text-[color:var(--pk-text-mute)]"
                  />
                </div>
              )}

              {!loading && error && (
                <div className="rounded-xl border border-[#f87171]/30 bg-[#f87171]/10 p-5 text-center">
                  <p className="text-sm text-[#fca5a5]">
                    Riwayat pengumuman tidak bisa dimuat.
                  </p>
                  <button
                    type="button"
                    onClick={() => void fetchAnnouncements()}
                    className="pk-btn-ghost mt-4 inline-flex min-h-9 items-center justify-center px-3 text-xs font-medium"
                  >
                    Coba lagi
                  </button>
                </div>
              )}

              {!loading && !error && announcements.length === 0 && (
                <div className="rounded-xl border border-dashed border-[color:var(--pk-line-2)] p-8 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--pk-line-2)] bg-[#0b1626] text-[color:var(--pk-text-mute)]">
                    <Megaphone size={18} />
                  </span>
                  <p className="mt-4 text-sm font-medium">
                    Belum ada pengumuman
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--pk-text-mute)]">
                    Kirim pengumuman pertama dari form di samping.
                  </p>
                </div>
              )}

              {!loading && !error && announcements.length > 0 && filtered.length === 0 && (
                <div className="rounded-xl border border-dashed border-[color:var(--pk-line-2)] p-8 text-center">
                  <p className="text-sm font-medium">
                    Tidak ada pengumuman yang cocok.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="pk-btn-ghost mt-4 inline-flex min-h-9 items-center justify-center px-3 text-xs font-medium"
                  >
                    Reset pencarian
                  </button>
                </div>
              )}

              {!loading && !error && filtered.length > 0 && (
                <ul className="pk-scroll max-h-[32rem] space-y-2.5 overflow-y-auto pr-1">
                  {filtered.map((a) => (
                    <li
                      key={a.id}
                      className="pk-lift rounded-xl border border-[color:var(--pk-line)] bg-[#0b1626]/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="min-w-0 flex-1 text-sm font-semibold text-[color:var(--pk-text)]">
                          {a.title}
                        </h3>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                            a.is_active
                              ? "border-[#34d399]/30 bg-[#34d399]/10 text-[#6ee7b7]"
                              : "border-[color:var(--pk-line-2)] bg-[#0b1626] text-[color:var(--pk-text-mute)]"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              a.is_active ? "bg-[#34d399]" : "bg-[color:var(--pk-line-2)]"
                            }`}
                          />
                          {a.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-[color:var(--pk-text-dim)]">
                        {a.message}
                      </p>

                      <p className="mt-3 text-[10px] uppercase tracking-widest text-[color:var(--pk-text-mute)]">
                        {new Date(a.created_at).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!loading && filtered.length > 0 && (
              <p className="mt-4 border-t border-[color:var(--pk-line)] pt-3 text-[11px] text-[color:var(--pk-text-mute)]">
                Menampilkan {filtered.length} dari {announcements.length}{" "}
                pengumuman
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}