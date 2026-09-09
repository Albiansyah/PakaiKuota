import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET || ''
const SIGNUP_LIMIT_PER_IP = 3
const WINDOW_HOURS = 24

export async function POST(request: Request) {
  const { email, password, turnstileToken } = await request.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email/password wajib' }, { status: 400 })
  }

  // captcha verify
  if (TURNSTILE_SECRET) {
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${TURNSTILE_SECRET}&response=${turnstileToken}`,
    })
    const v = await verify.json()
    if (!v.success) return NextResponse.json({ error: 'Captcha gagal' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const supabase = await createClient()
  const since = new Date(Date.now() - WINDOW_HOURS * 3600 * 1000).toISOString()

  const { count } = await (supabase
    .from('signup_log')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', since))

  if ((count ?? 0) >= SIGNUP_LIMIT_PER_IP) {
    return NextResponse.json({ error: 'Batas signup per IP terlampaui' }, { status: 429 })
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login` },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await (supabase.from('signup_log').insert({ ip, email }))
  return NextResponse.json({ ok: true })
}
