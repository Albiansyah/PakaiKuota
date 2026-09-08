import { describe, expect, it } from 'vitest';
import {
  computeNominalHold,
  computeCompletedCharge,
  HOLD_BUFFER,
} from './hold';

describe('computeNominalHold (§6.3)', () => {
  it('applies the 5% operational buffer', () => {
    // 0.01 USD * 16000 IDR = 160; * 1.05 = 168
    expect(computeNominalHold(0.01, 16000)).toBe(168);
  });

  it('rounds to whole rupiah', () => {
    const raw = 0.00123 * 15500 * HOLD_BUFFER;
    expect(computeNominalHold(0.00123, 15500)).toBe(Math.round(raw));
  });

  it('returns 0 for a zero estimate', () => {
    expect(computeNominalHold(0, 16000)).toBe(0);
  });

  it('rejects invalid inputs', () => {
    expect(() => computeNominalHold(-1, 16000)).toThrow('INVALID_ESTIMATE');
    expect(() => computeNominalHold(0.01, 0)).toThrow('INVALID_FOREX_RATE');
    expect(() => computeNominalHold(0.01, -5)).toThrow('INVALID_FOREX_RATE');
  });
});

describe('computeCompletedCharge — anti-minus cap (§6.3 #5)', () => {
  it('charges the actual cost when it is within the hold', () => {
    const hold = computeNominalHold(0.01, 16000); // 168
    const { charge, shortfall } = computeCompletedCharge(0.008, 16000, hold);
    // 0.008 * 16000 = 128, within hold
    expect(charge).toBe(128);
    expect(shortfall).toBe(0);
  });

  it('caps the charge at the hold and reports the shortfall when actual exceeds hold', () => {
    const hold = computeNominalHold(0.01, 16000); // 168
    // Kurs spiked: actual = 0.011 * 17000 = 187 > hold(168)
    const { charge, shortfall } = computeCompletedCharge(0.011, 17000, hold);
    expect(charge).toBe(hold); // capped — balance never goes negative
    expect(charge).toBe(168);
    expect(shortfall).toBe(187 - 168);
  });

  it('never charges more than the hold (property)', () => {
    const hold = computeNominalHold(0.02, 16000);
    for (const [cost, rate] of [
      [0.02, 16000],
      [0.05, 20000],
      [0.001, 16000],
    ] as const) {
      const { charge } = computeCompletedCharge(cost, rate, hold);
      expect(charge).toBeLessThanOrEqual(hold);
    }
  });

  it('rejects invalid inputs', () => {
    expect(() => computeCompletedCharge(-1, 16000, 100)).toThrow('INVALID_ACTUAL_COST');
    expect(() => computeCompletedCharge(0.01, 0, 100)).toThrow('INVALID_FOREX_RATE');
  });
});
