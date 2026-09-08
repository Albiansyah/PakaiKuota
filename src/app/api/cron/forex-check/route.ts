import 'server-only';

import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/cron/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * forex-check (final.md §3.1) — runs every 1 hour.
 *
 * Fetches USD->IDR from ONE chosen third-party provider (no multi-source in
 * MVP) and appends it to forex_history. authorize_request/finalize_request read
 * the latest row from forex_history for both hold and actual charge, so the
 * source stays consistent.
 *
 * Set FOREX_API_URL to the chosen provider's endpoint. The parsing below
 * assumes a { rates: { IDR: number } } shape (e.g. open.er-api / exchangerate
 * style) — adjust to match the provider you standardize on.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = process.env.FOREX_API_URL;
  if (!url) {
    return NextResponse.json(
      { ok: false, error: 'FOREX_API_URL not configured' },
      { status: 500 },
    );
  }

  let rate: number | undefined;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`forex provider HTTP ${res.status}`);
    const json = (await res.json()) as {
      result?: string;
      conversion_rates?: { IDR?: number };
    };
    if (json.result !== 'success') {
      throw new Error('forex provider returned an unsuccessful result');
    }
    rate = json.conversion_rates?.IDR;
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'fetch failed' },
      { status: 502 },
    );
  }

  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    return NextResponse.json(
      { ok: false, error: 'invalid IDR rate from provider' },
      { status: 502 },
    );
  }

  // Reject malformed provider responses that could create dangerous billing
  // amounts. The expected USD/IDR range is deliberately broad for validation.
  if (rate < 1_000 || rate > 100_000) {
    return NextResponse.json(
      { ok: false, error: 'IDR rate outside configured safety range' },
      { status: 502 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('forex_history')
    .insert({ usd_to_idr: rate });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, usd_to_idr: rate }, { status: 200 });
}
