"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"

type Role = "super_admin" | "support" | "admin" | "user" | null

/** Tipe baris dari tabel "users" — sesuaikan kalau skema beda */
type UserRoleRow = {
  role: string | null
}

export function useAdminRole() {
  const { user, supabase, loading: userLoading } = useSupabase()
  const [role, setRole] = useState<Role>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userLoading) return
    if (!user) {
      setRole(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single<UserRoleRow>()
      .then(({ data, error }) => {
        if (!active) return
        if (!error && data?.role) {
          setRole(data.role as Role)
        } else {
          setRole(null)
        }
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user, supabase, userLoading])

  return {
    role,
    loading,
    isAdmin: role === "super_admin" || role === "support",
    isSuperAdmin: role === "super_admin",
    isSupport: role === "support",
  }
}