"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertCircle,
  Check,
  ChevronDown,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  Paperclip,
  Phone,
  RefreshCw,
  Search,
  Send,
  Trash2,
  User,
  X,
} from "lucide-react"

/* ============================================================
   TYPES
   ============================================================ */

type Attachment = {
  name: string
  url: string // path di Supabase Storage
  size: number
}

type Feedback = {
  id: string
  name: string
  email: string
  phone: string | null
  category: string
  message: string
  attachments: Attachment[]
  status: "new" | "read" | "in_progress" | "resolved" | "archived"
  priority: "low" | "normal" | "high" | "urgent"
  admin_notes: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  ip_address: string | null
  user_agent: string | null
}

type StatusFilter =
  | "all"
  | "new"
  | "read"
  | "in_progress"
  | "resolved"
  | "archived"

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "new", label: "Baru" },
  { value: "read", label: "Dibaca" },
  { value: "in_progress", label: "Diproses" },
  { value: "resolved", label: "Selesai" },
  { value: "archived", label: "Arsip" },
]

const CATEGORY_FILTERS = [
  "all",
  "Kesan & Pesan",
  "Masukan Fitur",
  "Laporan Bug",
  "Keluhan Layanan",
  "Kritik & Saran",
  "Lainnya",
]

function statusTone(status: Feedback["status"]) {
  switch (status) {
    case "new":
      return "border-[#7dd3fc]/40 bg-[#7dd3fc]/10 text-[#7dd3fc]"
    case "read":
      return "border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#fcd34d]"
    case "in_progress":
      return "border-(--pk-accent)/40 bg-(--pk-accent)/10 text-(--pk-accent)"
    case "resolved":
      return "border-[#34d399]/40 bg-[#34d399]/10 text-[#6ee7b7]"
    case "archived":
      return "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-mute)"
  }
}

function statusLabel(status: Feedback["status"]) {
  switch (status) {
    case "new":
      return "Baru"
    case "read":
      return "Dibaca"
    case "in_progress":
      return "Diproses"
    case "resolved":
      return "Selesai"
    case "archived":
      return "Arsip"
  }
}

function priorityTone(priority: Feedback["priority"]) {
  switch (priority) {
    case "urgent":
      return "border-[#f87171]/40 bg-[#f87171]/10 text-[#fca5a5]"
    case "high":
      return "border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#fcd34d]"
    case "low":
      return "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-mute)"
    default:
      return "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim)"
  }
}

const inputClass =
  "min-h-10 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] px-3 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25 disabled:opacity-60"

/* ============================================================
   PAGE
   ============================================================ */

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Feedback | null>(null)

  const fetchFeedback = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(false)
    try {
      const res = await fetch("/api/admin/feedback")
      if (!res.ok) throw new Error("Failed")
      const data = (await res.json()) as { feedback?: Feedback[] }
      setItems(data.feedback ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void fetchFeedback()
  }, [fetchFeedback])

  const filtered = useMemo(() => {
    let list = items
    if (statusFilter !== "all") {
      list = list.filter((f) => f.status === statusFilter)
    }
    if (categoryFilter !== "all") {
      list = list.filter((f) => f.category === categoryFilter)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.email.toLowerCase().includes(q) ||
          f.message.toLowerCase().includes(q) ||
          (f.phone ?? "").includes(q)
      )
    }
    return list
  }, [items, statusFilter, categoryFilter, query])

  const stats = useMemo(() => {
    const total = items.length
    const unread = items.filter((f) => f.status === "new").length
    const inProgress = items.filter(
      (f) => f.status === "in_progress" || f.status === "read"
    ).length
    const resolved = items.filter((f) => f.status === "resolved").length
    return { total, unread, inProgress, resolved }
  }, [items])

  async function updateFeedback(
    id: string,
    patch: Partial<Pick<Feedback, "status" | "priority" | "admin_notes">>
  ) {
    setActionLoading(id)
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      })
      if (!res.ok) throw new Error("Failed")
      const data = (await res.json()) as { feedback?: Feedback }
      if (data.feedback) {
        setItems((prev) =>
          prev.map((f) => (f.id === id ? data.feedback! : f))
        )
        setSelected((prev) =>
          prev && prev.id === id ? data.feedback! : prev
        )
      }
      toast.success("Feedback diperbarui")
    } catch {
      toast.error("Gagal memperbarui feedback")
    } finally {
      setActionLoading(null)
    }
  }

  async function deleteFeedback(item: Feedback) {
    if (!confirm(`Hapus feedback dari "${item.name}"?`)) return
    setActionLoading(item.id)
    try {
      const res = await fetch(`/api/admin/feedback?id=${item.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed")
      setItems((prev) => prev.filter((f) => f.id !== item.id))
      setSelected(null)
      toast.success("Feedback dihapus")
    } catch {
      toast.error("Gagal menghapus feedback")
    } finally {
      setActionLoading(null)
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
                <MessageSquare size={26} className="text-(--pk-accent)" />
                Feedback
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-(--pk-text-dim)">
                Masukan, kesan, laporan bug, dan permintaan fitur dari
                pengguna.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchFeedback(true)}
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
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {error && (
          <div className="pk-panel mb-6 p-5 text-center">
            <p className="text-sm text-[#fca5a5]">
              Data feedback tidak bisa dimuat.
            </p>
            <button
              type="button"
              onClick={() => void fetchFeedback()}
              className="pk-btn-ghost mt-4 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
            >
              Coba lagi
            </button>
          </div>
        )}

        {!error && !loading && items.length > 0 && (
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="pk-panel pk-inview p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Total
                </p>
                <Inbox size={14} className="text-(--pk-text-mute)" />
              </div>
              <p className="mt-3 font-mono text-2xl">{stats.total}</p>
            </div>

            <div
              className={`pk-panel pk-inview p-5 ${
                stats.unread > 0 ? "pk-featured" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Baru
                </p>
                <span className="h-1.5 w-1.5 rounded-full bg-[#7dd3fc]" />
              </div>
              <p className="mt-3 font-mono text-2xl text-[#7dd3fc]">
                {stats.unread}
              </p>
            </div>

            <div className="pk-panel pk-inview p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Diproses
                </p>
                <Clock size={14} className="text-(--pk-accent)" />
              </div>
              <p className="mt-3 font-mono text-2xl text-(--pk-accent)">
                {stats.inProgress}
              </p>
            </div>

            <div className="pk-panel pk-inview p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Selesai
                </p>
                <Check size={14} className="text-[#6ee7b7]" />
              </div>
              <p className="mt-3 font-mono text-2xl text-[#6ee7b7]">
                {stats.resolved}
              </p>
            </div>
          </section>
        )}

        {/* Filters */}
        {!error && !loading && items.length > 0 && (
          <div className="mb-4 space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div
                role="group"
                aria-label="Filter status"
                className="flex flex-wrap gap-1 rounded-xl border border-(--pk-line-2) bg-[#0b1626] p-1"
              >
                {STATUS_FILTERS.map((item) => {
                  const active = statusFilter === item.value
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setStatusFilter(item.value)}
                      aria-pressed={active}
                      className={`min-h-9 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-all ${
                        active
                          ? "bg-linear-to-r from-[#ffc266] to-[#f0a93b] text-[#10192b] shadow-[0_6px_18px_-8px_rgba(240,169,59,0.9)]"
                          : "text-(--pk-text-dim) hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>

              <div className="relative lg:w-72">
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--pk-text-mute)"
                >
                  <Search size={15} />
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama, email, atau pesan…"
                  className="min-h-11 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] pl-10 pr-10 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Bersihkan"
                    className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-(--pk-text-mute) transition-colors hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_FILTERS.map((c) => {
                const active = categoryFilter === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategoryFilter(c)}
                    className={`inline-flex min-h-7 items-center rounded-lg border px-2.5 text-[11px] font-medium transition-colors ${
                      active
                        ? "border-(--pk-accent)/50 bg-(--pk-accent)/10 text-(--pk-accent)"
                        : "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim) hover:border-(--pk-accent)/30 hover:text-white"
                    }`}
                  >
                    {c === "all" ? "Semua Kategori" : c}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* List */}
        <div className="pk-panel pk-inview overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2
                size={24}
                className="animate-spin text-(--pk-text-mute)"
              />
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="p-12 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-(--pk-line-2) bg-[#0b1626]">
                <Inbox size={22} className="text-(--pk-text-mute)" />
              </span>
              <p className="mt-5 font-semibold">Belum ada feedback</p>
              <p className="mt-2 text-sm text-(--pk-text-dim)">
                Feedback dari pengguna akan muncul di sini.
              </p>
            </div>
          )}

          {!loading && items.length > 0 && filtered.length === 0 && (
            <div className="p-12 text-center">
              <p className="font-semibold">Tidak ada feedback yang cocok.</p>
              <p className="mt-2 text-sm text-(--pk-text-dim)">
                Coba ubah filter atau kata kunci.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("")
                  setStatusFilter("all")
                  setCategoryFilter("all")
                }}
                className="pk-btn-ghost mt-5 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
              >
                Reset filter
              </button>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <ul className="divide-y divide-(--pk-line)">
              {filtered.map((item) => {
                const isProcessing = actionLoading === item.id
                return (
                  <li
                    key={item.id}
                    className="cursor-pointer p-5 transition-colors hover:bg-white/2"
                    onClick={() => {
                      setSelected(item)
                      // Auto-mark as read kalau masih new
                      if (item.status === "new") {
                        void updateFeedback(item.id, { status: "read" })
                      }
                    }}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${statusTone(
                              item.status
                            )}`}
                          >
                            {statusLabel(item.status)}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${priorityTone(
                              item.priority
                            )}`}
                          >
                            {item.priority}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-(--pk-text-mute)">
                            {item.category}
                          </span>
                        </div>

                        <p className="mt-2 truncate text-sm font-semibold text-(--pk-text)">
                          {item.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-(--pk-text-dim)">
                          {item.email}
                          {item.phone && (
                            <>
                              <span className="mx-1.5 text-(--pk-text-mute)">
                                ·
                              </span>
                              {item.phone}
                            </>
                          )}
                        </p>

                        <p className="mt-2 line-clamp-2 text-xs text-(--pk-text-dim)">
                          {item.message}
                        </p>

                        {item.attachments.length > 0 && (
                          <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-(--pk-text-mute)">
                            <Paperclip size={10} />
                            {item.attachments.length} lampiran
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
                        <span className="font-mono text-[11px] text-(--pk-text-mute)">
                          {new Date(item.created_at).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              void deleteFeedback(item)
                            }}
                            disabled={isProcessing}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#f87171]/40 bg-[#f87171]/10 text-[#fca5a5] transition-colors hover:bg-[#f87171]/20 disabled:opacity-60"
                            aria-label="Hapus"
                          >
                            {isProcessing ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {selected && (
        <FeedbackDetailModal
          item={selected}
          processing={actionLoading === selected.id}
          onClose={() => setSelected(null)}
          onUpdate={(patch) => void updateFeedback(selected.id, patch)}
          onDelete={() => void deleteFeedback(selected)}
        />
      )}
    </div>
  )
}

/* ============================================================
   Detail Modal
   ============================================================ */

function FeedbackDetailModal({
  item,
  processing,
  onClose,
  onUpdate,
  onDelete,
}: {
  item: Feedback
  processing: boolean
  onClose: () => void
  onUpdate: (
    patch: Partial<Pick<Feedback, "status" | "priority" | "admin_notes">>
  ) => void
  onDelete: () => void
}) {
  const [notes, setNotes] = useState(item.admin_notes ?? "")
  const [notesDirty, setNotesDirty] = useState(false)

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

  async function downloadAttachment(att: Attachment) {
    // Karena bucket private, kita fetch dulu via API untuk dapat signed URL.
    // Alternatif: panggil supabase.storage.createSignedUrl di client.
    // Untuk simpel, kita redirect ke path public (kalau bucket dibuat public).
    // Di kode ini kita asumsikan admin punya akses, jadi buka di tab baru.
    window.open(att.url, "_blank", "noopener,noreferrer")
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={onClose}
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
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-(--pk-text-mute) transition-colors hover:bg-white/5 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-(--pk-accent)/40 bg-(--pk-accent)/10">
            <MessageSquare size={20} className="text-(--pk-accent)" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="feedback-modal-title"
              className="text-lg font-semibold text-(--pk-text)"
            >
              {item.name}
            </h2>
            <p className="mt-0.5 text-[11px] text-(--pk-text-mute)">
              {item.category} ·{" "}
              {new Date(item.created_at).toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${statusTone(
              item.status
            )}`}
          >
            {statusLabel(item.status)}
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${priorityTone(
              item.priority
            )}`}
          >
            {item.priority}
          </span>
        </div>

        {/* Kontak */}
        <div className="mt-5 grid gap-3 rounded-xl border border-(--pk-line-2) bg-[#0b1626]/60 p-4 sm:grid-cols-2">
          <div className="flex items-start gap-2.5">
            <Mail size={14} className="mt-0.5 text-(--pk-text-mute)" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-(--pk-text-mute)">
                Email
              </p>
              <a
                href={`mailto:${item.email}`}
                className="mt-0.5 block truncate font-mono text-xs text-(--pk-accent) hover:underline"
              >
                {item.email}
              </a>
            </div>
          </div>
          {item.phone && (
            <div className="flex items-start gap-2.5">
              <Phone size={14} className="mt-0.5 text-(--pk-text-mute)" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-(--pk-text-mute)">
                  WhatsApp
                </p>
                <a
                  href={`https://wa.me/${item.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 block truncate font-mono text-xs text-(--pk-accent) hover:underline"
                >
                  {item.phone}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Pesan */}
        <div className="mt-5">
          <p className="text-[10px] uppercase tracking-widest text-(--pk-text-mute)">
            Pesan
          </p>
          <div className="mt-2 whitespace-pre-wrap rounded-xl border border-(--pk-line-2) bg-[#0b1626]/60 p-4 text-sm leading-6 text-(--pk-text-dim)">
            {item.message}
          </div>
        </div>

        {/* Attachments */}
        {item.attachments.length > 0 && (
          <div className="mt-5">
            <p className="text-[10px] uppercase tracking-widest text-(--pk-text-mute)">
              Lampiran ({item.attachments.length})
            </p>
            <ul className="mt-2 space-y-1.5">
              {item.attachments.map((att, i) => (
                <li
                  key={`${att.name}-${i}`}
                  className="flex items-center gap-2 rounded-lg border border-(--pk-line-2) bg-[#0b1626] px-3 py-2 text-xs"
                >
                  <FileText
                    size={12}
                    className="shrink-0 text-(--pk-text-mute)"
                  />
                  <span className="min-w-0 flex-1 truncate font-mono text-(--pk-text-dim)">
                    {att.name}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-(--pk-text-mute)">
                    {(att.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => void downloadAttachment(att)}
                    className="shrink-0 rounded-md p-1 text-(--pk-text-mute) transition-colors hover:bg-white/5 hover:text-(--pk-accent)"
                    aria-label={`Download ${att.name}`}
                  >
                    <Download size={11} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Aksi */}
        <div className="mt-6 space-y-3 border-t border-(--pk-line) pt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-medium text-(--pk-text-dim)">
                Status
              </label>
              <div className="relative mt-1.5">
                <select
                  value={item.status}
                  onChange={(e) =>
                    onUpdate({
                      status: e.target.value as Feedback["status"],
                    })
                  }
                  disabled={processing}
                  className={`${inputClass} appearance-none pr-10`}
                >
                  <option value="new">Baru</option>
                  <option value="read">Dibaca</option>
                  <option value="in_progress">Diproses</option>
                  <option value="resolved">Selesai</option>
                  <option value="archived">Arsip</option>
                </select>
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-(--pk-text-mute)">
                  <ChevronDown size={12} />
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-(--pk-text-dim)">
                Prioritas
              </label>
              <div className="relative mt-1.5">
                <select
                  value={item.priority}
                  onChange={(e) =>
                    onUpdate({
                      priority: e.target.value as Feedback["priority"],
                    })
                  }
                  disabled={processing}
                  className={`${inputClass} appearance-none pr-10`}
                >
                  <option value="low">Rendah</option>
                  <option value="normal">Normal</option>
                  <option value="high">Tinggi</option>
                  <option value="urgent">Mendesak</option>
                </select>
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-(--pk-text-mute)">
                  <ChevronDown size={12} />
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-(--pk-text-dim)">
              Catatan internal
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                setNotesDirty(true)
              }}
              placeholder="Catatan untuk tim, tidak tampil ke user…"
              className={`${inputClass} mt-1.5 resize-none`}
            />
            {notesDirty && (
              <button
                type="button"
                onClick={() => {
                  onUpdate({ admin_notes: notes })
                  setNotesDirty(false)
                }}
                disabled={processing}
                className="pk-btn-primary mt-2 inline-flex min-h-9 items-center gap-2 px-4 text-xs disabled:opacity-60"
              >
                <Send size={12} />
                Simpan catatan
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={onDelete}
            disabled={processing}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#f87171]/40 bg-[#f87171]/10 px-4 text-sm font-medium text-[#fca5a5] transition-colors hover:bg-[#f87171]/20 disabled:opacity-60"
          >
            {processing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
            Hapus
          </button>
          <button
            type="button"
            onClick={onClose}
            className="pk-btn-ghost inline-flex min-h-10 items-center justify-center px-4 text-sm font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}