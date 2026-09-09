import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const context = await requireAdmin()
  if (!context) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { data, error } = await context.admin.from('reconciliation_logs').select('*').order('created_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data ?? [] })
}

export async function POST() {
  const context = await requireAdmin(['super_admin'])
  if (!context) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { data, error } = await context.admin.rpc('run_billing_reconciliation')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, result: data })
}
