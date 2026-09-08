/**
 * Pure billing math — mirrors the arithmetic in the SQL RPCs
 * (supabase/migrations/0002_billing_rpc.sql). Kept here as the single, unit-
 * tested source of truth for the hold buffer and the anti-minus cap (§6.3).
 *
 * These are the money-critical formulas; the SQL functions MUST stay in sync
 * with them. Rupiah amounts are rounded to whole rupiah.
 */

export const HOLD_BUFFER = 1.05; // 5% operational buffer (§6.3)
export const FOREX_MARGIN = 0.03; // 3% forex volatility markup buffer (§3.1)

/** nominal_hold = estimated_cost_usd * forex_rate_at_hold * 1.05 */
export function computeNominalHold(
  estimatedCostUsd: number,
  forexRateAtHold: number,
): number {
  if (estimatedCostUsd < 0) throw new Error('INVALID_ESTIMATE');
  if (forexRateAtHold <= 0) throw new Error('INVALID_FOREX_RATE');
  return Math.round(estimatedCostUsd * forexRateAtHold * HOLD_BUFFER);
}

export interface ChargeResult {
  /** Amount actually debited from balance_rupiah. Never exceeds nominalHold. */
  charge: number;
  /** Positive only in the extreme edge case actual > buffered hold (§6.3 #5). */
  shortfall: number;
}

/**
 * Actual charge on 'completed', capped at the hold so the balance can never go
 * negative. Any shortfall is a business-absorbed operational loss and should be
 * logged as a 'hold_insufficient' reconciliation alert.
 */
export function computeCompletedCharge(
  actualCostUsd: number,
  forexRateUsed: number,
  nominalHold: number,
): ChargeResult {
  if (actualCostUsd < 0) throw new Error('INVALID_ACTUAL_COST');
  if (forexRateUsed <= 0) throw new Error('INVALID_FOREX_RATE');

  const actualRupiah = Math.round(actualCostUsd * forexRateUsed);
  const charge = Math.min(actualRupiah, nominalHold);
  return { charge, shortfall: actualRupiah - charge };
}
