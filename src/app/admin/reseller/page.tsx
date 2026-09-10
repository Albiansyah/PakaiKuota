"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import {
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  Phone,
  RefreshCw,
  Search,
  Shield,
  X,
  XCircle,
} from "lucide-react"

type ResellerApplication = {
  id: string
  business_name: string
  business_phone: string
  npwp: string | null
  user_id: string
  status: string
  created_at: string
}

export default function AdminResellerPage() {
  const { user } = useSupabase()
  const router = useRouter()

  const [apps, setApps] = useState<ResellerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState("")

  const fetchApplications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(false)
    try {
      const res = await fetch("/api/admin/reseller")
      if (!res.ok) throw new Error("Unauthorized")
      const data = (await res.json()) as {
        applications?: ResellerApplication[]
      }
      setApps(data.applications ?? [])
    } catch (err) {
      console.error("Failed to fetch reseller applications:", err)
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
    void fetchApplications()
  }, [user, router, fetchApplications])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return apps
    return apps.filter(
      (a) =>
        a.business_name.toLowerCase().includes(q) ||
        a.business_phone.toLowerCase().includes(q) ||
        (a.npwp ?? "").toLowerCase().includes(q) ||
        a.user_id.toLowerCase().includes(q)
    )
  }, [apps, query])

  const stats = useMemo(() => {
    const total = apps.length
    const withNpwp = apps.filter((a) => a.npwp).length
    return { total, withNpwp }
  }, [apps])

  async function handleDecision(
    id: string,
    decision: "approved" | "rejected"
  ) {
    const label = decision === "approved" ? "Setujui" : "Tolak"
    if (!confirm(`${label} pengajuan reseller ini?`)) return
    setProcessing(id)
    try {
      const res = await fetch("/api/admin/reseller", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision }),
      })
      if (!res.ok) throw new Error("Gagal memproses keputusan")
      setApps((prev) => prev.filter((app) => app.id !== id))
    } catch (err) {
      console.error("Failed to process decision:", err)
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-screen text-(--pk-text)">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2
            size={24}
            className="animate-spin text-(--pk-text-mute)"
          />
        </div>
      </div>
    )
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
                <Shield size={26} className="text-(--pk-accent)" />
                KYC Reseller
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-(--pk-text-dim)">
                Verifikasi data bisnis reseller.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchApplications(true)}
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

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {error && (
          <div className="pk-panel mb-6 p-5 text-center">
            <p className="text-sm text-[#fca5a5]">
              Data pengajuan reseller tidak bisa dimuat.
            </p>
            <button
              type="button"
              onClick={() => void fetchApplications()}
              className="pk-btn-ghost mt-4 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
            >
              Coba lagi
            </button>
          </div>
        )}

        {!error && apps.length > 0 && (
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="pk-panel pk-inview p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Total pengajuan
                </p>
                <Shield size={14} className="text-(--pk-text-mute)" />
              </div>
              <p className="mt-3 font-mono text-2xl">{stats.total}</p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Menunggu verifikasi
              </p>
            </div>

            <div className="pk-panel pk-inview p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Dengan NPWP
                </p>
                <FileText size={14} className="text-(--pk-accent)" />
              </div>
              <p className="mt-3 font-mono text-2xl text-(--pk-accent)">
                {stats.withNpwp}
              </p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Data pajak tersedia
              </p>
            </div>

            <div className="pk-panel pk-inview p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Tanpa NPWP
                </p>
                <span className="h-1.5 w-1.5 rounded-full bg-(--pk-line-2)" />
              </div>
              <p className="mt-3 font-mono text-2xl text-(--pk-text-dim)">
                {stats.total - stats.withNpwp}
              </p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Perlu verifikasi manual
              </p>
            </div>
          </section>
        )}

        {!error && apps.length > 0 && (
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-xs text-(--pk-text-mute)">
              {filtered.length} dari {apps.length} pengajuan
            </p>
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
                placeholder="Cari bisnis, telepon, NPWP..."
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

        {!error && apps.length === 0 && (
          <div className="pk-panel pk-inview p-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-(--pk-line-2) bg-[#0b1626]">
              <CheckCircle2 size={22} className="text-[#6ee7b7]" />
            </span>
            <p className="mt-5 font-semibold">Tidak ada pengajuan reseller</p>
            <p className="mt-2 text-sm text-(--pk-text-dim)">
              Semua pengajuan sudah ditinjau. Cek kembali nanti.
            </p>
          </div>
        )}

        {!error && apps.length > 0 && filtered.length === 0 && (
          <div className="pk-panel pk-inview p-12 text-center">
            <p className="font-semibold">Tidak ada pengajuan yang cocok.</p>
            <p className="mt-2 text-sm text-(--pk-text-dim)">
              Coba ubah kata kunci pencarian.
            </p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="pk-btn-ghost mt-5 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
            >
              Reset pencarian
            </button>
          </div>
        )}

        {!error && filtered.length > 0 && (
          <ul className="space-y-3">
            {filtered.map((app) => {
              const isProcessing = processing === app.id
              return (
                <li
                  key={app.id}
                  className="pk-panel pk-inview flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-(--pk-accent)/30 bg-(--pk-accent)/10">
                      <Building2
                        size={20}
                        className="text-(--pk-accent)"
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-(--pk-text)">
                        {app.business_name}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-(--pk-text-dim)">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone size={12} className="text-(--pk-text-mute)" />
                          {app.business_phone}
                        </span>
                        {app.npwp && (
                          <span className="inline-flex items-center gap-1.5">
                            <FileText
                              size={12}
                              className="text-(--pk-text-mute)"
                            />
                            {app.npwp}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 font-mono text-[11px] text-(--pk-text-mute)">
                        User: {app.user_id.slice(0, 8)}…
                        <span className="mx-2">·</span>
                        {new Date(app.created_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleDecision(app.id, "rejected")}
                      disabled={isProcessing}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#f87171]/40 bg-[#f87171]/10 px-3 text-xs font-medium text-[#fca5a5] transition-colors hover:bg-[#f87171]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isProcessing ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <>
                          <XCircle size={13} />
                          Tolak
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDecision(app.id, "approved")}
                      disabled={isProcessing}
                      className="pk-btn-primary inline-flex min-h-9 items-center gap-1.5 px-3 text-xs disabled:cursor-wait disabled:opacity-60"
                    >
                      {isProcessing ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 size={13} />
                          Setujui
                        </>
                      )}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}