import 'server-only';

import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/cron/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data, error } = await createSupabaseAdminClient().rpc('expire_pending_topups');
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, expired: data ?? 0 });
}
