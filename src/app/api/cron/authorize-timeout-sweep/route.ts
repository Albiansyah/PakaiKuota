import 'server-only';

import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/cron/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * authorize-timeout-sweep (final.md §6.3.1) — runs every 1 minute.
 *
 * Releases holds stuck in 'authorized' for > 5 minutes (gateway crash, network
 * partition, VPS restart mid-request). Without this, balance_held leaks
 * permanently — one of the most critical billing risks. The actual release is
 * done inside the sweep_orphaned_holds() RPC so each release is row-locked and
 * atomic with its ledger entry.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('sweep_orphaned_holds');

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, released: data ?? 0 }, { status: 200 });
}
