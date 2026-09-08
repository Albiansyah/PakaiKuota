import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
  if (!body.email || !body.password) return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: body.email, password: body.password });
  if (error) return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  const { data: profile } = await supabase.from('users').select('role').eq('id', data.user.id).maybeSingle();
  return NextResponse.json({ user: data.user, role: profile?.role ?? 'user' });
}
