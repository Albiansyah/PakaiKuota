import { describe, expect, it } from 'vitest';
import { isPakasirMethod } from './methods';

describe('Pakasir payment methods', () => {
  it('accepts documented methods', () => {
    expect(isPakasirMethod('qris')).toBe(true);
    expect(isPakasirMethod('bni_va')).toBe(true);
  });

  it('rejects arbitrary method names', () => {
    expect(isPakasirMethod('javascript:alert(1)')).toBe(false);
    expect(isPakasirMethod('credit_card')).toBe(false);
  });
});
