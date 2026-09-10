"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react"

type User = {
  id: string
  email: string
  name: string | null
  role: string
  balance_rupiah: number
  balance_held: number
  is_suspended: boolean
  business_name: string | null
  created_at: string
  suspended_at: string | null
}

type RoleFilter = "all" | "user" | "support" | "super_admin"

const roleFilters: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "Semua Role" },
  { value: "user", label: "User" },
  { value: "support", label: "Support" },
  { value: "super_admin", label: "Super Admin" },
]

function roleTone(role: string) {
  switch (role) {
    case "super_admin":
      return "border-[#f87171]/40 bg-[#f87171]/10 text-[#fca5a5]"
    case "support":
      return "border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#fcd34d]"
    default:
      return "border-(--pk-line-2) bg-[#0b1626] text-(--pk-text-dim)"
  }
}

function roleLabel(role: string) {
  switch (role) {
    case "super_admin":
      return "Super Admin"
    case "support":
      return "Support"
    case "user":
      return "User"
    default:
      return role
  }
}

const currency = (value: unknown) =>
  typeof value === "number"
    ? new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(value)
    : "-"

const dateFmt = (value: unknown) =>
  typeof value === "string"
    ? new Date(value).toLocaleString("id-ID")
    : "-"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const fetchUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(false)
    try {
      const res = await fetch("/api/admin/users")
      if (!res.ok) throw new Error("Unauthorized")
      const data = (await res.json()) as { users?: User[] }
      setUsers(data.users ?? [])
    } catch (err) {
      console.error("Failed to fetch users:", err)
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      const matchSearch =
        q === "" ||
        u.email.toLowerCase().includes(q) ||
        (u.name ?? "").toLowerCase().includes(q) ||
        (u.business_name ?? "").toLowerCase().includes(q)
      const matchRole = roleFilter === "all" || u.role === roleFilter
      return matchSearch && matchRole
    })
  }, [users, search, roleFilter])

  const stats = useMemo(() => {
    const total = users.length
    const suspended = users.filter((u) => u.is_suspended).length
    const reseller = users.filter((u) => u.business_name).length
    return { total, suspended, reseller, active: total - suspended }
  }, [users])

  async function toggleSuspend(id: string, currentStatus: boolean) {
    const action = currentStatus ? "Aktifkan" : "Suspend"
    if (!confirm(`${action} user ini?`)) return
    setActionLoading(id)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, is_suspended: !currentStatus }),
      })
      if (!res.ok) throw new Error("Gagal mengubah status user")
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                is_suspended: !currentStatus,
                suspended_at: !currentStatus
                  ? new Date().toISOString()
                  : null,
              }
            : u
        )
      )
      setSelectedUser((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              is_suspended: !currentStatus,
              suspended_at: !currentStatus
                ? new Date().toISOString()
                : null,
            }
          : prev
      )
      toast.success(`User berhasil di${currentStatus ? "aktifkan" : "suspend"}`)
    } catch (err) {
      console.error("Failed to toggle suspend:", err)
      toast.error("Gagal mengubah status user")
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
                <Users size={26} className="text-(--pk-accent)" />
                Users
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-(--pk-text-dim)">
                Kelola user dari satu tempat.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchUsers(true)}
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
              Data user tidak bisa dimuat.
            </p>
            <button
              type="button"
              onClick={() => void fetchUsers()}
              className="pk-btn-ghost mt-4 inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium"
            >
              Coba lagi
            </button>
          </div>
        )}

        {!error && !loading && users.length > 0 && (
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="pk-panel pk-inview p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Total user
                </p>
                <Users size={14} className="text-(--pk-text-mute)" />
              </div>
              <p className="mt-3 font-mono text-2xl">{stats.total}</p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Semua akun terdaftar
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
                {stats.active}
              </p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Akun dapat login
              </p>
            </div>

            <div className="pk-panel pk-inview p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Reseller
                </p>
                <Building2 size={14} className="text-(--pk-accent)" />
              </div>
              <p className="mt-3 font-mono text-2xl text-(--pk-accent)">
                {stats.reseller}
              </p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                Punya business_name
              </p>
            </div>

            <div
              className={`pk-panel pk-inview p-5 ${
                stats.suspended > 0 ? "pk-featured" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-(--pk-text-mute)">
                  Suspended
                </p>
                <UserX size={14} className="text-[#fca5a5]" />
              </div>
              <p className="mt-3 font-mono text-2xl text-[#fca5a5]">
                {stats.suspended}
              </p>
              <p className="mt-1 text-xs text-(--pk-text-mute)">
                {stats.suspended > 0 ? "Perlu ditinjau" : "Tidak ada"}
              </p>
            </div>
          </section>
        )}

        {!error && !loading && users.length > 0 && (
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div
              role="group"
              aria-label="Filter role"
              className="inline-flex w-fit rounded-xl border border-(--pk-line-2) bg-[#0b1626] p-1"
            >
              {roleFilters.map((item) => {
                const active = roleFilter === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRoleFilter(item.value)}
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari email, nama, atau bisnis..."
                className="min-h-11 w-full rounded-xl border border-(--pk-line-2) bg-[#0b1626] pl-10 pr-10 text-sm text-(--pk-text) outline-none transition-colors placeholder:text-(--pk-text-mute) focus:border-(--pk-accent) focus:ring-2 focus:ring-(--pk-accent)/25"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Bersihkan"
                  className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-(--pk-text-mute) transition-colors hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="pk-panel pk-inview overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2
                size={24}
                className="animate-spin text-(--pk-text-mute)"
              />
            </div>
          )}

          {!loading && users.length === 0 && (
            <div className="p-12 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-(--pk-line-2) bg-[#0b1626]">
                <Users size={22} className="text-(--pk-text-mute)" />
              </span>
              <p className="mt-5 font-semibold">Belum ada user</p>
              <p className="mt-2 text-sm text-(--pk-text-dim)">
                User akan muncul di sini setelah mendaftar.
              </p>
            </div>
          )}

          {!loading && users.length > 0 && filtered.length === 0 && (
            <div className="p-12 text-center">
              <p className="font-semibold">Tidak ada user yang cocok.</p>
              <p className="mt-2 text-sm text-(--pk-text-dim)">
                Coba ubah kata kunci atau filter role.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("")
                  setRoleFilter("all")
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
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Email
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Role
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                        Saldo
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                        Saldo ditahan
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Status
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Reseller
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-widest">
                        Terdaftar
                      </th>
                      <th className="w-32 px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-widest">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => {
                      const isProcessing = actionLoading === u.id
                      const isSuperAdmin = u.role === "super_admin"
                      return (
                        <tr
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className="cursor-pointer border-b border-(--pk-line) transition-colors last:border-0 hover:bg-white/2"
                        >
                          <td className="px-5 py-4">
                            <p className="truncate text-xs font-medium text-(--pk-text)">
                              {u.email}
                            </p>
                            {u.name && (
                              <p className="mt-0.5 truncate text-[11px] text-(--pk-text-mute)">
                                {u.name}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${roleTone(
                                u.role
                              )}`}
                            >
                              {isSuperAdmin && <Shield size={10} />}
                              {roleLabel(u.role)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right font-mono text-xs text-(--pk-text)">
                            {currency(u.balance_rupiah)}
                          </td>
                          <td className="px-5 py-4 text-right font-mono text-xs text-(--pk-text-dim)">
                            {currency(u.balance_held)}
                          </td>
                          <td className="px-5 py-4">
                            {u.is_suspended ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f87171]/30 bg-[#f87171]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#fca5a5]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#f87171]" />
                                Suspended
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#6ee7b7]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                                Aktif
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {u.business_name ? (
                              <span className="inline-flex max-w-[10rem] items-center gap-1.5 truncate rounded-full border border-(--pk-line-2) bg-[#0b1626] px-2.5 py-0.5 text-[10px] font-medium text-(--pk-text-dim)">
                                <Building2 size={10} />
                                {u.business_name}
                              </span>
                            ) : (
                              <span className="text-xs text-(--pk-text-mute)">
                                —
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-(--pk-text-dim)">
                            {new Date(u.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                void toggleSuspend(u.id, u.is_suspended)
                              }}
                              disabled={isProcessing || isSuperAdmin}
                              title={
                                isSuperAdmin
                                  ? "Super admin tidak bisa disuspend"
                                  : undefined
                              }
                              className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                u.is_suspended
                                  ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#6ee7b7] hover:bg-[#34d399]/20"
                                  : "border-[#f87171]/40 bg-[#f87171]/10 text-[#fca5a5] hover:bg-[#f87171]/20"
                              }`}
                            >
                              {isProcessing ? (
                                <Loader2
                                  size={11}
                                  className="animate-spin"
                                />
                              ) : u.is_suspended ? (
                                <>
                                  <UserCheck size={11} />
                                  Aktifkan
                                </>
                              ) : (
                                <>
                                  <UserX size={11} />
                                  Suspend
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-(--pk-line) lg:hidden">
                {filtered.map((u) => {
                  const isProcessing = actionLoading === u.id
                  const isSuperAdmin = u.role === "super_admin"
                  return (
                    <li
                      key={u.id}
                      className="cursor-pointer p-4 transition-colors hover:bg-white/2"
                      onClick={() => setSelectedUser(u)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-(--pk-text)">
                            {u.email}
                          </p>
                          {u.name && (
                            <p className="mt-0.5 truncate text-[11px] text-(--pk-text-mute)">
                              {u.name}
                            </p>
                          )}
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${roleTone(
                            u.role
                          )}`}
                        >
                          {isSuperAdmin && <Shield size={9} />}
                          {roleLabel(u.role)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {u.is_suspended ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#f87171]/30 bg-[#f87171]/10 px-2 py-0.5 text-[10px] font-medium text-[#fca5a5]">
                            <span className="h-1 w-1 rounded-full bg-[#f87171]" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-2 py-0.5 text-[10px] font-medium text-[#6ee7b7]">
                            <span className="h-1 w-1 rounded-full bg-[#34d399]" />
                            Aktif
                          </span>
                        )}
                        {u.business_name && (
                          <span className="inline-flex max-w-[10rem] items-center gap-1 truncate rounded-full border border-(--pk-line-2) bg-[#0b1626] px-2 py-0.5 text-[10px] text-(--pk-text-dim)">
                            <Building2 size={9} />
                            {u.business_name}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-(--pk-line) bg-[#0b1626]/60 p-2.5">
                          <p className="text-[10px] uppercase tracking-widest text-(--pk-text-mute)">
                            Saldo
                          </p>
                          <p className="mt-1 font-mono text-xs text-(--pk-text)">
                            {currency(u.balance_rupiah)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-(--pk-line) bg-[#0b1626]/60 p-2.5">
                          <p className="text-[10px] uppercase tracking-widest text-(--pk-text-mute)">
                            Saldo ditahan
                          </p>
                          <p className="mt-1 font-mono text-xs text-(--pk-text-dim)">
                            {currency(u.balance_held)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="font-mono text-[11px] text-(--pk-text-mute)">
                          {new Date(u.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void toggleSuspend(u.id, u.is_suspended)
                          }}
                          disabled={isProcessing || isSuperAdmin}
                          className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            u.is_suspended
                              ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#6ee7b7]"
                              : "border-[#f87171]/40 bg-[#f87171]/10 text-[#fca5a5]"
                          }`}
                        >
                          {isProcessing ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : u.is_suspended ? (
                            <>
                              <UserCheck size={11} />
                              Aktifkan
                            </>
                          ) : (
                            <>
                              <UserX size={11} />
                              Suspend
                            </>
                          )}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <div className="border-t border-(--pk-line) px-5 py-3 text-xs text-(--pk-text-mute)">
                Menampilkan {filtered.length} dari {users.length} user
              </div>
            </>
          )}
        </div>
      </div>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          processing={actionLoading === selectedUser.id}
          onClose={() => setSelectedUser(null)}
          onToggleSuspend={() =>
            void toggleSuspend(selectedUser.id, selectedUser.is_suspended)
          }
        />
      )}
    </div>
  )
}

function UserDetailModal({
  user,
  processing,
  onClose,
  onToggleSuspend,
}: {
  user: User
  processing: boolean
  onClose: () => void
  onToggleSuspend: () => void
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

  const isSuperAdmin = user.role === "super_admin"

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Email",
      value: (
        <span className="font-mono text-xs text-(--pk-text)">
          {user.email}
        </span>
      ),
    },
    {
      label: "Nama",
      value: (
        <span className="text-xs text-(--pk-text-dim)">
          {user.name || "—"}
        </span>
      ),
    },
    {
      label: "Role",
      value: (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${roleTone(
            user.role
          )}`}
        >
          {isSuperAdmin && <ShieldCheck size={10} />}
          {roleLabel(user.role)}
        </span>
      ),
    },
    {
      label: "Saldo",
      value: (
        <span className="font-mono text-sm font-semibold text-(--pk-accent)">
          {currency(user.balance_rupiah)}
        </span>
      ),
    },
    {
      label: "Saldo ditahan",
      value: (
        <span className="font-mono text-xs text-(--pk-text-dim)">
          {currency(user.balance_held)}
        </span>
      ),
    },
    {
      label: "Status",
      value: user.is_suspended ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f87171]/30 bg-[#f87171]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#fca5a5]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#f87171]" />
          Suspended
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#6ee7b7]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
          Aktif
        </span>
      ),
    },
    {
      label: "Bisnis",
      value: (
        <span className="text-xs text-(--pk-text-dim)">
          {user.business_name || "—"}
        </span>
      ),
    },
    {
      label: "Terdaftar",
      value: (
        <span className="font-mono text-xs text-(--pk-text-dim)">
          {dateFmt(user.created_at)}
        </span>
      ),
    },
    ...(user.suspended_at
      ? [
          {
            label: "Disuspend",
            value: (
              <span className="font-mono text-xs text-[#fca5a5]">
                {dateFmt(user.suspended_at)}
              </span>
            ),
          },
        ]
      : []),
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-modal-title"
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="pk-panel pk-menu-in relative max-h-[90vh] w-full max-w-md overflow-y-auto p-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-(--pk-text-mute) transition-colors hover:bg-white/5 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-(--pk-line-2) bg-[#0b1626]">
          <Users size={20} className="text-(--pk-accent)" />
        </div>

        <h2
          id="user-modal-title"
          className="mt-4 text-lg font-semibold text-(--pk-text)"
        >
          Detail User
        </h2>
        <p className="mt-2 text-sm text-(--pk-text-dim)">
          Informasi lengkap akun user.
        </p>

        <dl className="mt-5 space-y-3 text-sm">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-4 border-b border-(--pk-line) pb-3 last:border-0 last:pb-0"
            >
              <dt className="shrink-0 text-xs text-(--pk-text-mute)">
                {row.label}
              </dt>
              <dd className="min-w-0 text-right">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="pk-btn-ghost inline-flex min-h-10 flex-1 items-center justify-center px-4 text-sm font-medium"
          >
            Tutup
          </button>
          {!isSuperAdmin && (
            <button
              type="button"
              onClick={onToggleSuspend}
              disabled={processing}
              className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-60 ${
                user.is_suspended
                  ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#6ee7b7] hover:bg-[#34d399]/20"
                  : "border-[#f87171]/40 bg-[#f87171]/10 text-[#fca5a5] hover:bg-[#f87171]/20"
              }`}
            >
              {processing ? (
                <Loader2 size={13} className="animate-spin" />
              ) : user.is_suspended ? (
                <>
                  <UserCheck size={13} />
                  Aktifkan
                </>
              ) : (
                <>
                  <UserX size={13} />
                  Suspend
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}