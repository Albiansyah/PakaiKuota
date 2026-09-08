import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || !body.password) return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: body.password });
  if (error) {
    const code = error.message.toLowerCase().includes('confirm') ? 'email_not_confirmed' : 'invalid_credentials';
    return NextResponse.json({ error: code }, { status: 401 });
  }
  const { data: profile } = await supabase.from('users').select('role').eq('id', data.user.id).maybeSingle();
  return NextResponse.json({ user: data.user, role: profile?.role ?? 'user' });
}
