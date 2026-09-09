import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/rbac'

async function getConfig() {
  const { data, error } = await createSupabaseAdminClient().from('newapi_config').select('*').eq('id', 1).maybeSingle()
  if (error) throw error
  return data
}

export async function GET() {
  const guard = await requireRole(['super_admin'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const data = await getConfig()
    return NextResponse.json({ config: data ? { ...data, api_key: data.api_key ? '••••••••' : '' } : null })
  } catch {
    return NextResponse.json({ error: 'config_load_failed' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const guard = await requireRole(['super_admin'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!payload || typeof payload.base_url !== 'string' || !/^https?:\/\//.test(payload.base_url)) return NextResponse.json({ error: 'invalid_base_url' }, { status: 400 })
  if (typeof payload.is_active !== 'boolean' || typeof payload.markup_percent !== 'number' || payload.markup_percent < 0) return NextResponse.json({ error: 'invalid_config' }, { status: 400 })
  const current = await getConfig()
  const apiKey = typeof payload.api_key === 'string' && payload.api_key !== '••••••••' ? payload.api_key : current?.api_key ?? ''
  const { data, error } = await createSupabaseAdminClient().from('newapi_config').upsert({ ...payload, api_key: apiKey, id: 1 }, { onConflict: 'id' }).select('*').single()
  if (error) return NextResponse.json({ error: 'config_save_failed' }, { status: 500 })
  return NextResponse.json({ config: { ...data, api_key: data.api_key ? '••••••••' : '' } })
}

export async function POST(request: Request) {
  const guard = await requireRole(['super_admin'])
  if (!guard.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(() => null) as { base_url?: string; api_key?: string; default_model?: string } | null
  if (!body?.base_url || !body.api_key || body.api_key.trim().length < 8 || /^(placeholder|your[-_ ]?api[-_ ]?key|xxx+)$/i.test(body.api_key.trim()) || !/^https?:\/\//.test(body.base_url)) return NextResponse.json({ error: 'invalid_config' }, { status: 400 })
  const started = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  try {
    const headers = { Authorization: `Bearer ${body.api_key}`, 'Content-Type': 'application/json' }
    const statusResponse = await fetch(new URL('/api/status', body.base_url), { headers, signal: controller.signal, cache: 'no-store' })
    if (!statusResponse.ok) throw new Error(`status_http_${statusResponse.status}`)
    const modelsResponse = await fetch(new URL('/v1/models', body.base_url), { headers, signal: controller.signal, cache: 'no-store' })
    if (!modelsResponse.ok) throw new Error(`models_http_${modelsResponse.status}`)
    const modelsPayload = await modelsResponse.json() as { data?: Array<{ id?: string }> }
    const model = body.default_model || modelsPayload.data?.find((item) => item.id)?.id
    if (!model) throw new Error('no_model_available')
    const chatResponse = await fetch(new URL('/v1/chat/completions', body.base_url), { method: 'POST', headers, body: JSON.stringify({ model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }), signal: controller.signal, cache: 'no-store' })
    const responseTimeMs = Date.now() - started
    const status = chatResponse.ok ? 'success' : 'failed'
    const errorMessage = chatResponse.ok ? null : `chat_http_${chatResponse.status}`
    await createSupabaseAdminClient().from('newapi_config').update({ last_test_status: status, last_test_response_time_ms: responseTimeMs, last_test_error: errorMessage, last_tested_at: new Date().toISOString() }).eq('id', 1)
    if (!chatResponse.ok) return NextResponse.json({ error: errorMessage, model, response_time_ms: responseTimeMs }, { status: 502 })
    return NextResponse.json({ ok: true, model, response_time_ms: responseTimeMs })
  } catch {
    const responseTimeMs = Date.now() - started
    await createSupabaseAdminClient().from('newapi_config').update({ last_test_status: 'failed', last_test_response_time_ms: responseTimeMs, last_test_error: 'connection_unavailable', last_tested_at: new Date().toISOString() }).eq('id', 1)
    return NextResponse.json({ error: 'connection_unavailable', response_time_ms: responseTimeMs }, { status: 502 })
  } finally {
    clearTimeout(timer)
  }
}
