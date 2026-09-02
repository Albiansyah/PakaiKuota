import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/rbac'

const EDITABLE_FIELDS = new Set([
  "name",
  "business_name",
  "business_phone",
  "npwp",
  "balance_rupiah",
])

export async function GET() {
  const guard = await requireRole(['super_admin', 'support'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, balance_rupiah, is_suspended, business_name, business_phone, npwp, created_at, deleted_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data })
}

export async function POST(request: Request) {
  const guard = await requireRole(['super_admin'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const {
    email,
    password,
    name,
    business_name,
    business_phone,
    npwp,
    role,
  } = await request.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // Create user via Supabase Admin API
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      email,
      password,
      name,
      business_name,
      business_phone,
      npwp,
      role: role || "user",
      balance_rupiah: 0,
      email_confirm: true,
    })
    .select()

  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })

  // Log the creation
  await supabase.from('admin_audit_logs').insert({
    admin_id: user.id,
    action: "create_user",
    target_type: "user",
    target_id: newUser?.[0]?.id,
    details: { action: "create_user", target_id: newUser?.[0]?.id, reason: "Manual user creation by admin" },
  })

  return NextResponse.json({ user: newUser?.[0] })
}

export async function PATCH(request: Request) {
  const guard = await requireRole(['super_admin', 'support'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, field, value, reason } = await request.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // Support restrictions
  const isSupport = guard.role === 'support'
  const targetUser = await supabase
    .from('users')
    .select('role, is_suspended')
    .eq('id', userId)
    .single()

  if (!targetUser.data) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const targetRole = targetUser.data.role

  // Support cannot soft-delete or change role of any user
  if (isSupport) {
    if (field === "is_suspended" || field === "role") {
      return NextResponse.json({ error: 'Action not permitted for support role' }, { status: 403 })
    }
    // Support cannot change role to/from super_admin
    if (field === "role" && (value === "super_admin" || targetRole === "super_admin")) {
      return NextResponse.json({ error: 'Cannot change role to/from super_admin' }, { status: 403 })
    }
  }

  // Field restrictions for all users
  if (!EDITABLE_FIELDS.has(field)) {
    return NextResponse.json({ error: `Field "${field}" cannot be edited manually` }, { status: 400 })
  }

  // Cannot edit email, id, created_at
  if (["email", "id", "created_at"].includes(field)) {
    return NextResponse.json({ error: `Field "${field}" cannot be edited manually` }, { status: 400 })
  }

  // Update the user field
  const updateData: any = { [field]: value }
  const { error: updateError } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // If adjusting saldo, log to audit
  if (field === "balance_rupiah") {
    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      action: "adjust_balance",
      target_type: "user",
      target_id: userId,
      details: { action: "adjust_balance", field, value, reason },
    })
  }

  // If soft-delete, log to audit
  if (field === "is_suspended" && value === true) {
    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      action: "soft_delete_user",
      target_type: "user",
      target_id: userId,
      details: { action: "soft_delete_user", reason },
    })
  }

  const { data: updatedUser, error: fetchError } = await supabase
    .from('users')
    .select()
    .eq('id', userId)
    .single()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  return NextResponse.json({ user: updatedUser })
}