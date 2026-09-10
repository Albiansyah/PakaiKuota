"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Cpu,
  Edit3,
  Layers,
  Loader2,
  Minus,
  MoreHorizontal,
  Package,
  Pencil,
  Power,
  PowerOff,
  RefreshCw,
  Save,
  Search,
  X,
} from "lucide-react"
import { getModelTierLabel } from "@/lib/model-tier-labels"

type Model = {
  id: string
  name: string
  slug: string
  group_name: string
  tier: "standard" | "premium" | "ultra"
  input_price_per_1k: number
  output_price_per_1k: number
  markup_percent: number
  enabled: boolean
}

type Connection = {
  last_test_status?: "success" | "failed" | null
  last_test_response_time_ms?: number | null
  last_tested_at?: string | null
}

type StatusFilter = "all" | "active" | "inactive"

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
]

function tierTone(tier: string) {
  if (tier === "premium")
    return "border-(--pk-accent)/40 bg-(--pk-accent)/10 text-(--pk-accent)"
  if (tier === "ultra")
    return "border-[#a78bfa]/40 bg-[#a78bfa]/10 text-[#c4b5fd]"
  return "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim)"
}

function SelectCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
  label: string
}) {
  const active = checked || indeterminate
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      onClick={onChange}
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
        active
          ? "border-(--pk-accent)/60 bg-(--pk-accent)/15 text-(--pk-accent)"
          : "border-(--pk-line-2) bg-[#0b1626] text-transparent hover:border-(--pk-text-dim) hover:text-(--pk-text-mute)/50"
      }`}
    >
      {indeterminate ? <Minus size={12} /> : <Check size={12} />}
    </button>
  )
}

export default function AdminModelsPage() {
  const { user } = useSupabase()
  const router = useRouter()

  const [models, setModels] = useState<Model[]>([])
  const [connection, setConnection] = useState<Connection>({})
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [rate, setRate] = useState(15000)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [saving, setSaving] = useState<string | null>(null)

  const [groupEditTarget, setGroupEditTarget] = useState<Model | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const [filter, setFilter] = useState<StatusFilter>("all")
  const [query, setQuery] = useState("")

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkGroupOpen, setBulkGroupOpen] = useState(false)
  const selectAllRef = useRef<HTMLInputElement | null>(null)

  const fetchModels = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(false)
    try {
      const res = await fetch("/api/admin/models")
      if (!res.ok) throw new Error("unauthorized")
      const data = (await res.json()) as {
        models?: Model[]
        connection?: Connection
      }
      setModels(data.models ?? [])
      setConnection(data.connection ?? {})
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    void fetchModels()
    fetch("/api/forex")
      .then((r) => r.json())
      .then((d) => setRate(d.rate ?? 15000))
      .catch(() => {})
  }, [user, router, fetchModels])

  useEffect(() => {
    if (!menuOpenId) return
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null
      if (target?.closest(`[data-model-menu="${menuOpenId}"]`)) return
      setMenuOpenId(null)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpenId(null)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onEsc)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onEsc)
    }
  }, [menuOpenId])

  const stats = useMemo(() => {
    const enabled = models.filter((m) => m.enabled).length
    const lowMargin = models.filter((m) => m.markup_percent < 10).length
    const avgMarkup =
      models.length > 0
        ? models.reduce((s, m) => s + m.markup_percent, 0) / models.length
        : 0
    return {
      total: models.length,
      enabled,
      disabled: models.length - enabled,
      lowMargin,
      avgMarkup,
    }
  }, [models])

  const filtered = useMemo(() => {
    let list = models
    if (filter === "active") list = list.filter((m) => m.enabled)
    if (filter === "inactive") list = list.filter((m) => !m.enabled)

    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q) ||
          (m.group_name ?? "").toLowerCase().includes(q)
      )
    }
    return list
  }, [models, filter, query])

  /* -------------------- selection helpers -------------------- */

  const allFilteredSelected = useMemo(
    () => filtered.length > 0 && filtered.every((m) => selectedIds.has(m.id)),
    [filtered, selectedIds]
  )
  const someFilteredSelected = useMemo(
    () => filtered.some((m) => selectedIds.has(m.id)),
    [filtered, selectedIds]
  )
  const selectedCount = selectedIds.size

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const everySelected =
        filtered.length > 0 && filtered.every((m) => next.has(m.id))
      if (everySelected) {
        filtered.forEach((m) => next.delete(m.id))
      } else {
        filtered.forEach((m) => next.add(m.id))
      }
      return next
    })
  }, [filtered])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        someFilteredSelected && !allFilteredSelected
    }
  }, [someFilteredSelected, allFilteredSelected])

  /* -------------------- single-item actions -------------------- */

  async function handleSync() {
    setSyncing(true)
    try {
      await fetch("/api/admin/models/sync", { method: "POST" })
      await fetchModels(true)
    } catch {
      // ignore
    } finally {
      setSyncing(false)
    }
  }

  function startEdit(model: Model) {
    setEditingId(model.id)
    setEditValue(model.markup_percent.toString())
    setMenuOpenId(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue("")
  }

  async function saveMarkup(model: Model) {
    const newMarkup = parseFloat(editValue)
    if (isNaN(newMarkup) || newMarkup < 0) return
    setSaving(model.id)
    try {
      await fetch("/api/admin/models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: model.id, markup_percent: newMarkup }),
      })
      setModels((prev) =>
        prev.map((m) =>
          m.id === model.id ? { ...m, markup_percent: newMarkup } : m
        )
      )
      setEditingId(null)
    } catch {
      // ignore
    } finally {
      setSaving(null)
    }
  }

  async function toggleActive(model: Model) {
    setMenuOpenId(null)
    try {
      await fetch("/api/admin/models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: model.id, enabled: !model.enabled }),
      })
      setModels((prev) =>
        prev.map((m) =>
          m.id === model.id ? { ...m, enabled: !m.enabled } : m
        )
      )
    } catch {
      // ignore
    }
  }

  async function saveGroup(model: Model, group: string) {
    const trimmed = group.trim()
    if (!trimmed || trimmed === model.group_name) {
      setGroupEditTarget(null)
      return
    }
    try {
      const res = await fetch("/api/admin/models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: model.id, group_name: trimmed }),
      })
      if (res.ok) {
        setModels((prev) =>
          prev.map((item) =>
            item.id === model.id ? { ...item, group_name: trimmed } : item
          )
        )
      }
    } catch {
      // ignore
    } finally {
      setGroupEditTarget(null)
    }
  }

  /* -------------------- bulk actions -------------------- */

  async function bulkSetEnabled(enabled: boolean) {
    if (selectedIds.size === 0 || bulkSaving) return
    setBulkSaving(true)
    const ids = Array.from(selectedIds)
    try {
      await Promise.all(
        ids.map((id) =>
          fetch("/api/admin/models", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ modelId: id, enabled }),
          })
        )
      )
      setModels((prev) =>
        prev.map((m) => (selectedIds.has(m.id) ? { ...m, enabled } : m))
      )
      setSelectedIds(new Set())
    } catch {
      // ignore
    } finally {
      setBulkSaving(false)
    }
  }

  async function bulkSetGroup(group: string) {
    const trimmed = group.trim()
    if (!trimmed || selectedIds.size === 0) {
      setBulkGroupOpen(false)
      return
    }
    setBulkSaving(true)
    const ids = Array.from(selectedIds)
    try {
      await Promise.all(
        ids.map((id) =>
          fetch("/api/admin/models", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ modelId: id, group_name: trimmed }),
          })
        )
      )
      setModels((prev) =>
        prev.map((m) =>
          selectedIds.has(m.id) ? { ...m, group_name: trimmed } : m
        )
      )
      setSelectedIds(new Set())
    } catch {
      // ignore
    } finally {
      setBulkSaving(false)
      setBulkGroupOpen(false)
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
                <Cpu size={26} className="text-(--pk-accent)" />
                Manajemen Model
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {connection.last_test_status === "success" ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-2.5 py-1 text-[11px] font-medium text-[#6ee7b7]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#34d399]" />
                    Terhubung ke NewAPI
                    {connection.last_test_response_time_ms
                      ? ` · ${connection.last_test_response_time_ms} ms`
                      : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-(--pk-line-2) bg-[#0b1626] px-2.5 py-1 text-[11px] text-(--pk-text-mute)">
                    <span className="h-1.5 w-1.5 rounded-full bg-(--pk-line-2)" />
                    Belum terhubung
                  </span>
                )}
                <span className="font-mono text-[11px] text-(--pk-text-mute)">
                  USD/IDR {rate.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchModels(true)}
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
                onClick={handleSync}
                disabled={syncing}
                className="pk-btn-primary inline-flex min-h-10 items-center gap-2 px-4 text-sm disabled:cursor-wait disabled:opacity-60"
              >
                {syncing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                {syncing ? "Syncing..." : "Sync NewAPI"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {error && (
          <div className="pk-panel mb-6 p-5 text-center">
            <p className="text-sm text-[#fca5a5]">
              Data model tidak bisa dimuat.
            </p>
            <button
              type="button"
              onClick={() => void fetchModels()}
              className="pk-btn-ghost mt-4 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
            >
              Coba lagi
            </button>
          </div>
        )}

        {!error && !loading && models.length > 0 && (
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="pk-panel pk-inview p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Total model
                </p>
                <Package size={14} className="text-(--pk-text-mute)" />
              </div>
              <p className="mt-3 font-mono text-2xl">{stats.total}</p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                {stats.enabled} aktif · {stats.disabled} nonaktif
              </p>
            </div>

            <div className="pk-panel pk-inview p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Aktif
                </p>
                <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
              </div>
              <p className="mt-3 font-mono text-2xl text-[#6ee7b7]">
                {stats.enabled}
              </p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Tampil untuk user
              </p>
            </div>

            <div className="pk-panel pk-inview p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Rata-rata markup
                </p>
                <span className="h-1.5 w-1.5 rounded-full bg-(--pk-accent)" />
              </div>
              <p className="mt-3 font-mono text-2xl text-(--pk-accent)">
                {stats.avgMarkup.toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Across semua model
              </p>
            </div>

            <div
              className={`pk-panel pk-inview p-5 ${
                stats.lowMargin > 0 ? "pk-featured" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Margin tipis
                </p>
                <AlertTriangle size={14} className="text-[#fca5a5]" />
              </div>
              <p className="mt-3 font-mono text-2xl text-[#fca5a5]">
                {stats.lowMargin}
              </p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                {stats.lowMargin > 0 ? "Perlu direview" : "Semua aman"}
              </p>
            </div>
          </section>
        )}

        {!error && !loading && models.length > 0 && (
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div
              role="group"
              aria-label="Filter status"
              className="inline-flex w-fit rounded-xl border border-(--pk-line-2) bg-[#0b1626] p-1"
            >
              {statusFilters.map((item) => {
                const active = filter === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value)}
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
                placeholder="Cari model atau grup..."
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
        )}

        <div className="pk-panel pk-inview mt-4 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2
                size={24}
                className="animate-spin text-(--pk-text-mute)"
              />
            </div>
          )}

          {!loading && models.length === 0 && (
            <div className="p-12 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-mute)">
                <Cpu size={22} />
              </span>
              <p className="mt-5 font-semibold">Belum ada model</p>
              <p className="mt-2 text-sm text-(--pk-text-dim)">
                Klik "Sync NewAPI" untuk mengambil daftar model dari upstream.
              </p>
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="pk-btn-primary mt-5 inline-flex min-h-10 items-center justify-center gap-2 px-4 text-sm disabled:opacity-60"
              >
                <RefreshCw size={13} />
                Sync sekarang
              </button>
            </div>
          )}

          {!loading && models.length > 0 && filtered.length === 0 && (
            <div className="p-12 text-center">
              <p className="font-semibold">Tidak ada model yang cocok.</p>
              <p className="mt-2 text-sm text-(--pk-text-dim)">
                Coba ubah kata kunci atau filter status.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("")
                  setFilter("all")
                }}
                className="pk-btn-ghost mt-5 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
              >
                Reset filter
              </button>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <>
              {/* Desktop table */}
              <div className="pk-scroll hidden overflow-x-auto lg:block">
                <table className="w-full min-w-5xl text-left text-sm">
                  <thead className="border-b border-(--pk-line) text-(--pk-text-mute)">
                    <tr>
                      <th className="w-12 px-5 py-4">
                        <SelectCheckbox
                          checked={allFilteredSelected}
                          indeterminate={
                            !allFilteredSelected && someFilteredSelected
                          }
                          onChange={toggleSelectAll}
                          label="Pilih semua model pada tampilan ini"
                        />
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Model
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Grup
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Tier
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                        Input / 1K
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                        Markup
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Status
                      </th>
                      <th className="w-16 px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => {
                      const isEditing = editingId === m.id
                      const tierLabel = getModelTierLabel(m.tier)
                      const menuOpen = menuOpenId === m.id
                      const isLow = m.markup_percent < 10
                      const isSelected = selectedIds.has(m.id)

                      return (
                        <tr
                          key={m.id}
                          className={`border-b border-(--pk-line) transition-colors last:border-0 ${
                            isSelected
                              ? "bg-(--pk-accent)/5"
                              : "hover:bg-white/2"
                          }`}
                        >
                          <td className="px-5 py-4">
                            <SelectCheckbox
                              checked={isSelected}
                              onChange={() => toggleSelect(m.id)}
                              label={`Pilih ${m.name}`}
                            />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-mono text-xs font-medium text-(--pk-text)">
                                {m.name}
                              </p>
                              {isLow && (
                                <span title="Markup tipis" className="inline-flex">
                                  <AlertTriangle
                                    size={12}
                                    className="shrink-0 text-(--pk-accent)"
                                  />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => setGroupEditTarget(m)}
                              className="group inline-flex items-center gap-1.5 text-xs text-(--pk-text-dim) transition-colors hover:text-(--pk-accent)"
                            >
                              {m.group_name || "Lainnya"}
                              <Edit3
                                size={11}
                                className="opacity-0 transition-opacity group-hover:opacity-100"
                              />
                            </button>
                          </td>
                          <td className="px-5 py-4">
                            {tierLabel ? (
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${tierTone(m.tier)}`}
                              >
                                {tierLabel}
                              </span>
                            ) : (
                              <span className="text-xs text-(--pk-text-mute)">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right font-mono text-xs tabular-nums text-(--pk-text-dim)">
                            Rp {(m.input_price_per_1k * rate).toFixed(2)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") void saveMarkup(m)
                                    if (e.key === "Escape") cancelEdit()
                                  }}
                                  className="h-8 w-20 rounded-md border border-(--pk-accent)/50 bg-[#0b1626] px-2 text-right font-mono text-xs text-(--pk-text) outline-none focus:ring-2 focus:ring-(--pk-accent)/25"
                                />
                                <button
                                  type="button"
                                  onClick={() => void saveMarkup(m)}
                                  disabled={saving === m.id}
                                  aria-label="Simpan"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#34d399]/40 bg-[#34d399]/10 text-[#6ee7b7] transition-colors hover:bg-[#34d399]/20 disabled:opacity-60"
                                >
                                  {saving === m.id ? (
                                    <Loader2
                                      size={12}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Save size={12} />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  aria-label="Batal"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-(--pk-text-mute) transition-colors hover:text-white"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEdit(m)}
                                className={`font-mono text-xs font-medium transition-colors hover:text-(--pk-accent) ${
                                  isLow
                                    ? "text-(--pk-accent)"
                                    : "text-[#6ee7b7]"
                                }`}
                              >
                                {m.markup_percent.toFixed(2)}%
                              </button>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {m.enabled ? (
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
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div
                              data-model-menu={m.id}
                              className="relative inline-block"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setMenuOpenId(menuOpen ? null : m.id)
                                }
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                                aria-label="Aksi"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-(--pk-text-mute) transition-colors hover:bg-white/5 hover:text-white"
                              >
                                <MoreHorizontal size={15} />
                              </button>

                              {menuOpen && (
                                <div
                                  role="menu"
                                  className="pk-panel pk-menu-in absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden p-1.5"
                                >
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => startEdit(m)}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-(--pk-text-dim) transition-colors hover:bg-white/5 hover:text-white"
                                  >
                                    <Pencil size={13} />
                                    Edit markup
                                  </button>
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      setMenuOpenId(null)
                                      setGroupEditTarget(m)
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-(--pk-text-dim) transition-colors hover:bg-white/5 hover:text-white"
                                  >
                                    <Edit3 size={13} />
                                    Edit grup
                                  </button>
                                  <div className="my-1 h-px bg-(--pk-line)" />
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => void toggleActive(m)}
                                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                                      m.enabled
                                        ? "text-[#fca5a5] hover:bg-[#f87171]/10"
                                        : "text-[#6ee7b7] hover:bg-[#34d399]/10"
                                    }`}
                                  >
                                    {m.enabled ? (
                                      <>
                                        <PowerOff size={13} />
                                        Nonaktifkan
                                      </>
                                    ) : (
                                      <>
                                        <Power size={13} />
                                        Aktifkan
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-(--pk-line) lg:hidden">
                {filtered.map((m) => {
                  const isEditing = editingId === m.id
                  const tierLabel = getModelTierLabel(m.tier)
                  const isLow = m.markup_percent < 10
                  const isSelected = selectedIds.has(m.id)

                  return (
                    <li
                      key={m.id}
                      className={`p-4 ${isSelected ? "bg-(--pk-accent)/5" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div className="pt-0.5">
                            <SelectCheckbox
                              checked={isSelected}
                              onChange={() => toggleSelect(m.id)}
                              label={`Pilih ${m.name}`}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-mono text-xs font-medium text-(--pk-text)">
                                {m.name}
                              </p>
                              {isLow && (
                                <AlertTriangle
                                  size={11}
                                  className="shrink-0 text-(--pk-accent)"
                                />
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {tierLabel && (
                                <span
                                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${tierTone(m.tier)}`}
                                >
                                  {tierLabel}
                                </span>
                              )}
                              {m.enabled ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-2 py-0.5 text-[10px] font-medium text-[#6ee7b7]">
                                  <span className="h-1 w-1 rounded-full bg-[#34d399]" />
                                  Aktif
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full border border-(--pk-line-2) bg-[#0b1626] px-2 py-0.5 text-[10px] text-(--pk-text-mute)">
                                  <span className="h-1 w-1 rounded-full bg-(--pk-line-2)" />
                                  Nonaktif
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div
                          data-model-menu={m.id}
                          className="relative shrink-0"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setMenuOpenId(
                                menuOpenId === m.id ? null : m.id
                              )
                            }
                            aria-label="Aksi"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-(--pk-line-2) text-(--pk-text-mute)"
                          >
                            <MoreHorizontal size={14} />
                          </button>

                          {menuOpenId === m.id && (
                            <div
                              role="menu"
                              className="pk-panel pk-menu-in absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden p-1.5"
                            >
                              <button
                                type="button"
                                onClick={() => startEdit(m)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-(--pk-text-dim) hover:bg-white/5 hover:text-white"
                              >
                                <Pencil size={12} />
                                Edit markup
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpenId(null)
                                  setGroupEditTarget(m)
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-(--pk-text-dim) hover:bg-white/5 hover:text-white"
                              >
                                <Edit3 size={12} />
                                Edit grup
                              </button>
                              <div className="my-1 h-px bg-(--pk-line)" />
                              <button
                                type="button"
                                onClick={() => void toggleActive(m)}
                                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs ${
                                  m.enabled
                                    ? "text-[#fca5a5]"
                                    : "text-[#6ee7b7]"
                                }`}
                              >
                                {m.enabled ? (
                                  <>
                                    <PowerOff size={12} />
                                    Nonaktifkan
                                  </>
                                ) : (
                                  <>
                                    <Power size={12} />
                                    Aktifkan
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-(--pk-line) bg-[#0b1626]/60 p-2.5">
                          <p className="text-[10px] uppercase tracking-widest text-(--pk-text-mute)">
                            Input / 1K
                          </p>
                          <p className="mt-1 font-mono text-xs text-(--pk-text-dim)">
                            Rp {(m.input_price_per_1k * rate).toFixed(2)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-(--pk-line) bg-[#0b1626]/60 p-2.5">
                          <p className="text-[10px] uppercase tracking-widest text-(--pk-text-mute)">
                            Markup
                          </p>
                          {isEditing ? (
                            <div className="mt-1 flex items-center gap-1">
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) =>
                                  setEditValue(e.target.value)
                                }
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") void saveMarkup(m)
                                  if (e.key === "Escape") cancelEdit()
                                }}
                                className="h-7 w-full rounded-md border border-(--pk-accent)/50 bg-[#0b1626] px-1.5 text-right font-mono text-xs text-(--pk-text) outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => void saveMarkup(m)}
                                disabled={saving === m.id}
                                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#34d399]/40 bg-[#34d399]/10 text-[#6ee7b7]"
                              >
                                {saving === m.id ? (
                                  <Loader2
                                    size={11}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Check size={11} />
                                )}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(m)}
                              className={`mt-1 font-mono text-xs font-medium ${
                                isLow
                                  ? "text-(--pk-accent)"
                                  : "text-[#6ee7b7]"
                              }`}
                            >
                              {m.markup_percent.toFixed(2)}%
                            </button>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setGroupEditTarget(m)}
                        className="mt-3 flex w-full items-center justify-between rounded-lg border border-(--pk-line) bg-[#0b1626]/60 px-3 py-2 text-xs text-(--pk-text-dim) transition-colors hover:border-(--pk-line-2)"
                      >
                        <span className="truncate">
                          Grup: {m.group_name || "Lainnya"}
                        </span>
                        <Edit3 size={11} />
                      </button>
                    </li>
                  )
                })}
              </ul>

              <div className="border-t border-(--pk-line) px-5 py-3 text-xs text-(--pk-text-mute)">
                Menampilkan {filtered.length} dari {models.length} model
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:bottom-6">
          <div className="pk-panel pk-menu-in pointer-events-auto flex flex-wrap items-center gap-2 p-2 pl-3.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.65)]">
            <div className="flex items-center gap-2 pr-1">
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-(--pk-accent)/15 px-1.5 font-mono text-[11px] font-semibold text-(--pk-accent)">
                {selectedCount}
              </span>
              <span className="text-xs text-(--pk-text-dim)">
                model dipilih
              </span>
            </div>

            <div className="hidden h-5 w-px bg-(--pk-line) sm:block" />

            <button
              type="button"
              onClick={() => setBulkGroupOpen(true)}
              disabled={bulkSaving}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-(--pk-text-dim) transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              <Layers size={13} />
              Set grup
            </button>

            <button
              type="button"
              onClick={() => void bulkSetEnabled(true)}
              disabled={bulkSaving}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-[#6ee7b7] transition-colors hover:bg-[#34d399]/10 disabled:opacity-50"
            >
              {bulkSaving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Power size={13} />
              )}
              Aktifkan
            </button>

            <button
              type="button"
              onClick={() => void bulkSetEnabled(false)}
              disabled={bulkSaving}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-[#fca5a5] transition-colors hover:bg-[#f87171]/10 disabled:opacity-50"
            >
              {bulkSaving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <PowerOff size={13} />
              )}
              Nonaktifkan
            </button>

            <div className="hidden h-5 w-px bg-(--pk-line) sm:block" />

            <button
              type="button"
              onClick={clearSelection}
              disabled={bulkSaving}
              aria-label="Batalkan pilihan"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-(--pk-text-mute) transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {groupEditTarget && (
        <GroupEditModal
          model={groupEditTarget}
          onClose={() => setGroupEditTarget(null)}
          onSave={(group) => void saveGroup(groupEditTarget, group)}
        />
      )}

      {bulkGroupOpen && (
        <BulkGroupModal
          count={selectedCount}
          busy={bulkSaving}
          onClose={() => setBulkGroupOpen(false)}
          onSave={(group) => void bulkSetGroup(group)}
        />
      )}
    </div>
  )
}

function GroupEditModal({
  model,
  onClose,
  onSave,
}: {
  model: Model
  onClose: () => void
  onSave: (group: string) => void
}) {
  const [value, setValue] = useState(model.group_name || "")
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
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

  const suggestions = [
    "OpenAI",
    "Anthropic",
    "Gemini",
    "NVIDIA",
    "Mistral",
    "Lainnya",
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-edit-title"
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="pk-panel pk-menu-in relative w-full max-w-md overflow-hidden p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-(--pk-text-mute) transition-colors hover:bg-white/5 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
          <Edit3 size={20} className="text-(--pk-accent)" />
        </div>

        <h2
          id="group-edit-title"
          className="mt-4 text-lg font-semibold text-(--pk-text)"
        >
          Edit grup model
        </h2>
        <p className="mt-2 text-sm leading-6 text-(--pk-text-dim)">
          Ubah nama grup untuk{" "}
          <code className="font-mono text-xs text-(--pk-text)">
            {model.name}
          </code>
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave(value)
          }}
          className="mt-5 space-y-4"
        >
          <label className="block text-xs font-medium">
            Nama grup
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Misalnya: OpenAI"
              className="mt-1.5 min-h-11 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] px-3.5 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25"
            />
          </label>

          <div>
            <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
              Saran
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setValue(s)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all ${
                    value === s
                      ? "border-(--pk-accent)/50 bg-(--pk-accent)/10 text-(--pk-accent)"
                      : "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim) hover:border-(--pk-line-2) hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
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
              className="pk-btn-primary inline-flex min-h-10 items-center justify-center gap-2 px-4 text-sm"
            >
              <Save size={13} />
              Simpan grup
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BulkGroupModal({
  count,
  busy,
  onClose,
  onSave,
}: {
  count: number
  busy: boolean
  onClose: () => void
  onSave: (group: string) => void
}) {
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose()
    }
    document.addEventListener("keydown", onEsc)
    return () => {
      document.body.style.overflow = original
      document.removeEventListener("keydown", onEsc)
    }
  }, [onClose, busy])

  const suggestions = [
    "OpenAI",
    "Anthropic",
    "Gemini",
    "NVIDIA",
    "Mistral",
    "Lainnya",
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-group-title"
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
    >
      <div
        aria-hidden
        onClick={() => !busy && onClose()}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="pk-panel pk-menu-in relative w-full max-w-md overflow-hidden p-6">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Tutup"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-(--pk-text-mute) transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
        >
          <X size={16} />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
          <Layers size={20} className="text-(--pk-accent)" />
        </div>

        <h2
          id="bulk-group-title"
          className="mt-4 text-lg font-semibold text-(--pk-text)"
        >
          Set grup massal
        </h2>
        <p className="mt-2 text-sm leading-6 text-(--pk-text-dim)">
          Terapkan grup yang sama untuk{" "}
          <span className="font-semibold text-(--pk-text)">
            {count} model
          </span>{" "}
          terpilih.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (busy) return
            onSave(value)
          }}
          className="mt-5 space-y-4"
        >
          <label className="block text-xs font-medium">
            Nama grup
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Misalnya: OpenAI"
              className="mt-1.5 min-h-11 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] px-3.5 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25"
            />
          </label>

          <div>
            <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
              Saran
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setValue(s)}
                  disabled={busy}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all disabled:opacity-50 ${
                    value === s
                      ? "border-(--pk-accent)/50 bg-(--pk-accent)/10 text-(--pk-accent)"
                      : "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim) hover:border-(--pk-line-2) hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="pk-btn-ghost inline-flex min-h-10 items-center justify-center px-4 text-sm font-medium disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busy || !value.trim()}
              className="pk-btn-primary inline-flex min-h-10 items-center justify-center gap-2 px-4 text-sm disabled:opacity-50"
            >
              {busy ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Layers size={13} />
              )}
              Terapkan ke {count} model
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}