import { createClient } from '@/lib/supabase/server'

export type Role = 'user' | 'super_admin' | 'support'

export async function getUserRole(): Promise<Role | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  return (data?.role as Role) ?? 'user'
}

export async function requireRole(allowed: Role[]) {
  const role = await getUserRole()
  if (!role || !allowed.includes(role)) {
    return { ok: false as const, role }
  }
  return { ok: true as const, role }
}
