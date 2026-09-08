"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Container } from "@/components/layout"
import {
  Users,
  UserX,
  UserCheck,
  Loader2,
  Search,
  X,
} from "lucide-react"

type User = {
  id: string
  email: string
  name: string | null
  role: string
  balance_rupiah: number
  is_suspended: boolean
  business_name: string | null
  created_at: string
}

export default function AdminUsersPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    if (!user) { router.push("/login"); return }
    ;(async () => {
      try {
        const res = await fetch("/api/admin/users")
        if (!res.ok) throw new Error("Unauthorized")
        const data = await res.json()
        setUsers(data.users ?? [])
      } catch (err) {
        console.error("Failed to fetch users:", err)
      } finally {
        setLoading(false)
      }
    })()
  }, [user, router])

  // fetchUsers removed

  const toggleSuspend = async (id: string, currentStatus: boolean) => {
    setActionLoading(id)
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, is_suspended: !currentStatus }),
      })
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_suspended: !currentStatus } : u))
      )
      if (selectedUser?.id === id) {
        setSelectedUser((prev) => prev ? { ...prev, is_suspended: !currentStatus } : null)
      }
    } catch (err) {
      console.error("Failed to toggle suspend:", err)
    }
    setActionLoading(null)
  }

  const filtered = users.filter((u) => {
    const matchSearch = search === "" ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
    const matchRole = roleFilter === "all" || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Users className="h-8 w-8 text-[var(--accent)]" />
        <h1 className="text-3xl font-bold">Manajemen User</h1>
      </div>
      <p className="text-[var(--color-muted-foreground)] mb-6">
        Kelola user, role, dan status akun
      </p>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
          <Input
            placeholder="Cari email atau nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-[var(--color-muted-foreground)]" />
            </button>
          )}
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border bg-[var(--color-muted)] text-[var(--color-foreground)] text-sm"
        >
          <option value="all">Semua Role</option>
          <option value="user">User</option>
          <option value="support">Support</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {filtered.length} user
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-muted-foreground)]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-[var(--color-muted-foreground)]">
              Tidak ada user ditemukan
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Role</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Saldo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Reseller</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted-foreground)] uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-muted)]/50 cursor-pointer" onClick={() => setSelectedUser(u)}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{u.email}</p>
                        {u.name && <p className="text-xs text-[var(--color-muted-foreground)]">{u.name}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.role === "super_admin" ? "destructive" : u.role === "support" ? "warning" : "secondary"}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        Rp {u.balance_rupiah.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.is_suspended ? "destructive" : "success"}>
                          {u.is_suspended ? "Suspended" : "Aktif"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {u.business_name && (
                          <Badge variant="outline">{u.business_name}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); toggleSuspend(u.id, u.is_suspended) }}
                          disabled={actionLoading === u.id || u.role === "super_admin"}
                        >
                          {actionLoading === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : u.is_suspended ? (
                            <><UserCheck className="h-4 w-4 mr-1" />Aktifkan</>
                          ) : (
                            <><UserX className="h-4 w-4 mr-1" />Suspend</>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedUser(null)}>
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Detail User</h2>
              <button onClick={() => setSelectedUser(null)}>
                <X className="h-5 w-5 text-[var(--color-muted-foreground)]" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">Email</span>
                <span className="font-medium">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">Nama</span>
                <span>{selectedUser.name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">Role</span>
                <Badge variant={selectedUser.role === "super_admin" ? "destructive" : "secondary"}>{selectedUser.role}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">Saldo</span>
                <span className="font-mono">Rp {selectedUser.balance_rupiah.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">Status</span>
                <Badge variant={selectedUser.is_suspended ? "destructive" : "success"}>
                  {selectedUser.is_suspended ? "Suspended" : "Aktif"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">Bisnis</span>
                <span>{selectedUser.business_name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">Daftar</span>
                <span className="font-mono">{new Date(selectedUser.created_at).toLocaleDateString("id-ID")}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedUser(null)}>Tutup</Button>
              {selectedUser.role !== "super_admin" && (
                <Button
                  variant={selectedUser.is_suspended ? "default" : "destructive"}
                  className="flex-1"
                  onClick={() => toggleSuspend(selectedUser.id, selectedUser.is_suspended)}
                  disabled={actionLoading === selectedUser.id}
                >
                  {actionLoading === selectedUser.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : selectedUser.is_suspended ? "Aktifkan" : "Suspend"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
