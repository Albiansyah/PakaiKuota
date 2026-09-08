import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from('forex_history').select('id').limit(1);
    if (error) {
      return NextResponse.json({ ok: false, checks: { supabase: false } }, { status: 503 });
    }
    return NextResponse.json({
      ok: true,
      checks: { supabase: true },
      latency_ms: Date.now() - startedAt,
    });
  } catch {
    return NextResponse.json({ ok: false, checks: { supabase: false } }, { status: 503 });
  }
}
